#!/usr/bin/env node
// validar-offline.mjs — comprueba que un HTML es 100% autocontenido (0 dependencias externas)
// y añade checks de diseño, accesibilidad y motion (warnings). Con --strict bloquean.
// Uso: node validar-offline.mjs <archivo.html> [--strict] [--json]
// Salida: PASS/FAIL. Códigos: 0 = OK, 1 = hallazgos (o warnings con --strict), 2 = mal uso.

import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const json = args.includes('--json');
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('Uso: node validar-offline.mjs <archivo.html> [--strict] [--json]');
  process.exit(2);
}

let html;
try {
  html = readFileSync(file, 'utf8');
} catch (e) {
  console.error(`No se pudo leer "${file}": ${e.message}`);
  process.exit(2);
}

const hallazgos = [];
const warnings = [];
const ok = [];
const okMsg = (msg) => ok.push(msg);
const failMsg = (msg) => hallazgos.push(msg);
const warnMsg = (msg) => warnings.push(msg);

const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
const scriptBlocks = [...withoutComments.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
const css = styleBlocks.map((s) => s[1]).join('\n');
const markup = withoutComments
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

const attr = (tag, name) => {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\u0060]+))`, 'i');
  const found = tag.match(re);
  return found ? (found[1] ?? found[2] ?? found[3] ?? '') : null;
};
const hasAttr = (tag, name) => new RegExp(`\\b${name}\\b`, 'i').test(tag);
const classList = (tag) => (attr(tag, 'class') || '').split(/\s+/).filter(Boolean);
const textOf = (fragment) => fragment
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const openTags = (source, tag) => [...source.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map((m) => m[0]);

/**
 * Empareja un elemento con pila en vez de con regex no-greedy: `<section>` y
 * `<svg>` admiten anidamiento, y el no-greedy cortaría por el primer cierre.
 * Devuelve [{ open, body }] del más externo al más interno.
 */
const paired = (source, tag) => {
  const out = [];
  const stack = [];
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  let m;
  while ((m = re.exec(source))) {
    if (m[1] === '/') {
      const top = stack.pop();
      if (top) out.push({ open: top.open, body: source.slice(top.end, m.index) });
    } else {
      stack.push({ open: m[0], end: m.index + m[0].length });
    }
  }
  return out;
};

/**
 * Extrae un bloque `@media` desde su condición hasta el SIGUIENTE `@media`
 * (o el fin del CSS). Tomarlo "hasta el primer `}`" o "hasta el final" mezcla
 * reglas de otros media queries y valida en falso lo que debe fallar.
 */
const mediaBlock = (src, queryRe) => {
  const i = src.search(queryRe);
  if (i < 0) return null;
  const next = src.slice(i + 1).search(/@media\b/i);
  return next >= 0 ? src.slice(i, i + 1 + next) : src.slice(i);
};

// ============ BLOQUE A: 0-internet (errores) ============

// A1. URLs externas y recursos no embebidos en atributos.
const attrRe = /(?:src|href|poster|data-src|action|srcset|xlink:href)\s*=\s*["']([^"']+)["']/gi;
let m;
while ((m = attrRe.exec(withoutComments))) {
  // `srcset` admite varias candidatas separadas por comas: `url 1x, url 2x`.
  for (const raw of m[1].split(',')) {
    const url = (raw.trim().split(/\s+/)[0] || '').trim();
    if (!url) continue;
    if (/^(?:https?:)?\/\//i.test(url)) {
      failMsg(`URL externa en atributo: ${url}`);
    } else if (url.startsWith('data:')) {
      okMsg(`data: URI embebida (${url.slice(0, 34)}…)`);
    } else if (/^(?:mailto|tel|#)/.test(url)) {
      // Enlace interno o de contacto: permitido.
    } else if (/\.[a-z0-9]{1,5}\b/i.test(url)) {
      okMsg(`Referencia local: ${url}`);
    }
  }
}
for (const tag of openTags(withoutComments, 'img')) {
  const src = attr(tag, 'src') || '';
  if (src && !/^data:image\//i.test(src)) failMsg(`<img> no embebida: ${src.slice(0, 80)}`);
}
for (const tag of openTags(withoutComments, 'link')) {
  const href = attr(tag, 'href') || '';
  if (href && !/^data:/i.test(href) && !/^(?:https?:)?\/\//i.test(href)) {
    failMsg(`<link> con recurso no embebido: ${href}`);
  }
}

// A2. <script src> y <link rel=stylesheet>
if (/<script[^>]*\bsrc\s*=/i.test(withoutComments)) failMsg('<script src> externo presente (debe ir inline)');
if (/<link[^>]*rel=["']?stylesheet/i.test(withoutComments)) failMsg('<link rel="stylesheet"> presente (debe ir inline)');

// A3. <base href>
if (/<base\b/i.test(withoutComments)) failMsg('<base href> presente');

// A4. <iframe> / <embed> / <object> — se ignoran los comentarios: un ejemplo en
// un comentario no es una dependencia del informe.
if (/<iframe\b/i.test(withoutComments)) failMsg('<iframe> presente');
if (/<embed\b/i.test(withoutComments)) failMsg('<embed> presente');
if (/<object\b/i.test(withoutComments)) failMsg('<object> presente');

// A5. Bloques CSS: @import, url() no embebida, @font-face sin fuente embebida.
for (const sb of styleBlocks) {
  const block = sb[1];
  if (/@import\b/i.test(block)) failMsg('@import detectado en CSS');
  const urls = [...block.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)];
  for (const u of urls) {
    const target = u[1].trim();
    if (/^(?:https?:)?\/\//i.test(target)) failMsg(`url() externa en CSS: ${target}`);
    else if (!/^data:/i.test(target) && !/^#/.test(target)) failMsg(`url() no embebida en CSS: ${target.slice(0, 80)}`);
  }
  const fontFaces = [...block.matchAll(/@font-face\s*\{[\s\S]*?\}/gi)];
  for (const ff of fontFaces) {
    if (/data:\s*font/i.test(ff[0])) okMsg('@font-face con fuente embebida (data: URI)');
    else failMsg('@font-face sin fuente embebida (riesgo de descarga)');
  }
}

// A6. fetch / XMLHttpRequest / WebSocket en el JS inline.
for (const code of scriptBlocks) {
  const fetchCalls = [...code.matchAll(/\bfetch\s*\(\s*["'`]([^"'`]+)/g)];
  for (const fc of fetchCalls) {
    const target = fc[1];
    if (/^(?:https?:)?\/\//i.test(target)) failMsg(`fetch() a URL externa: ${target}`);
    else if (!/^(?:data|blob):/i.test(target)) failMsg(`fetch() a recurso no embebido: ${target}`);
  }
  if (/\bXMLHttpRequest\b/.test(code)) failMsg('XMLHttpRequest presente');
  if (/new\s+WebSocket/.test(code)) failMsg('WebSocket presente');
}

// A7. <use> con referencia externa.
const useRefs = [...markup.matchAll(/<use\b[^>]*\b(?:href|xlink:href)\s*=\s*["']([^"']+)["']/gi)].map((u) => u[1]);
for (const ref of useRefs) {
  if (!ref.startsWith('#')) failMsg(`<use> con referencia externa: ${ref}`);
}

// ============ BLOQUE B: estructurales (obligatorias) ============

if (!/<meta[^>]*charset=["']?utf-8/i.test(html)) failMsg('<meta charset="UTF-8"> ausente (obligatorio)');
else okMsg('<meta charset="UTF-8"> presente');
if (!/<html[^>]*lang=["']?es/i.test(html)) failMsg('<html lang="es"> no declarado (obligatorio)');
else okMsg('<html lang="es"> presente');
if (!/@media\s*print/i.test(html)) warnMsg('Sin @media print: el PDF se exportará sin estilos de impresión.');
else okMsg('@media print presente');

// ============ BLOQUE C: diseño, accesibilidad y motion (warnings; bloquean con --strict) ============

// C1. Contraste AA de los tokens (--text y --muted sobre --surface; --text sobre --bg)
const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
if (rootMatch) {
  const root = rootMatch[1];
  const get = (v) => { const r = root.match(new RegExp(`--${v}\\s*:\\s*([^;]+)`)); return r ? r[1].trim() : null; };
  const text = get('text'), muted = get('muted'), surface = get('surface'), bg = get('bg');
  const ratio = (c1, c2) => {
    const lum = (hex) => {
      const h = hex.replace('#', '');
      if (h.length !== 6) return null;
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
      const f = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const L1 = lum(c1), L2 = lum(c2);
    if (L1 == null || L2 == null) return null;
    const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
    return (hi + 0.05) / (lo + 0.05);
  };
  const cTextSurface = ratio(text, surface);
  if (cTextSurface != null && cTextSurface < 4.5) warnMsg(`Contraste --text/--surface ${cTextSurface.toFixed(2)}:1 < 4.5 (AA).`);
  else if (cTextSurface != null) okMsg(`Contraste --text/--surface ${cTextSurface.toFixed(2)}:1 (≥4.5 AA).`);
  const cMutedSurface = ratio(muted, surface);
  if (cMutedSurface != null && cMutedSurface < 4.5) warnMsg(`Contraste --muted/--surface ${cMutedSurface.toFixed(2)}:1 < 4.5 (AA para texto normal).`);
  else if (cMutedSurface != null) okMsg(`Contraste --muted/--surface ${cMutedSurface.toFixed(2)}:1 (≥4.5 AA).`);
  const cTextBg = ratio(text, bg);
  if (cTextBg != null && cTextBg < 4.5) warnMsg(`Contraste --text/--bg ${cTextBg.toFixed(2)}:1 < 4.5 (AA).`);
  else if (cTextBg != null) okMsg(`Contraste --text/--bg ${cTextBg.toFixed(2)}:1 (≥4.5 AA).`);
} else {
  warnMsg('No se encontró bloque :root con tokens de color.');
}

// C2. Footer con identidad (5 campos)
const footer = markup.match(/<footer[\s\S]*?<\/footer>/i);
if (!footer) {
  warnMsg('Sin <footer>: falta el bloque de identidad obligatorio.');
} else {
  const f = footer[0];
  const checks = [
    ['logo', /class=["'][^"']*\blogo\b|<svg[^>]*class=["'][^"']*\blogo\b|<img[^>]*data:/i.test(f)],
    ['nombre de empresa', /<strong>[\s\S]{2,}<\/strong>|brand/i.test(f)],
    ['contacto', /@|mailto:|tel:|www\.|\bhttps?:\/\/|\.(?:com|es|net|org)\b|<address\b/i.test(f)],
    ['autor', /Elaborado por|autor|preparado por|realizado por/i.test(f)],
    ['período', /20\d{2}/.test(f)],
  ];
  const missing = checks.filter(([, p]) => !p).map(([n]) => n);
  if (missing.length) warnMsg(`Footer incompleto: falta ${missing.join(', ')}.`);
  else okMsg('Footer con identidad completa (logo, empresa, contacto, autor, período).');
  // El footer es solo identidad del cliente: la skill nunca se firma ahí.
  if (/generador-informes-offline|documento\s+100\s*%\s*offline/i.test(textOf(f))) {
    warnMsg('El footer incluye la autofirma de la skill; deja solo la identidad del cliente.');
  }
}

// C3. "Lectura:" de análisis bajo cada gráfica.
// El nombre accesible de los SVG lo vigila C9: aquí no se vuelve a contar.
const lecturas = (markup.match(/Lectura:/g) || []).length;
// Solo cuenta tokens de clase exactos: `chart`, nunca `chart-caption`/`chart-box`.
const chartWraps = [...markup.matchAll(/<[a-z][\w-]*\b[^>]*>/gi)]
  .map((m) => m[0])
  .filter((t) => classList(t).includes('chart')).length;
if (chartWraps > 0 && lecturas < chartWraps) warnMsg(`Faltan análisis: ${chartWraps} gráfica(s) pero solo ${lecturas} "Lectura:".`);
else if (chartWraps > 0) okMsg(`Todas las gráficas (${chartWraps}) llevan "Lectura:".`);

// C4. TOC si hay >6 secciones
const sections = (markup.match(/<section\b/gi) || []).length;
if (sections > 6 && !/class\s*=\s*["'][^"']*\btoc\b/i.test(markup)) warnMsg(`Hay ${sections} secciones y no se detectó un índice (TOC).`);
else if (sections > 6) okMsg('TOC presente para informe largo.');

// C5. Secciones vacías (emparejado con pila: las <section> anidadas cuentan bien)
const sectionTags = paired(markup, 'section');
let emptySecs = 0;
for (const s of sectionTags) {
  if (textOf(s.body).length < 20) emptySecs++;
}
if (emptySecs > 0) warnMsg(`${emptySecs} sección(es) sin contenido sustancial.`);

// C6. Movimiento: propósito, reduced-motion y estado final en print
const hasAnim = /\bdata-(?:reveal|slide|grow|draw|pop|count|stagger|water)\b/i.test(markup) ||
  /@keyframes\b|scroll-behavior\s*:\s*smooth|(?:^|[;{])\s*(?:animation(?:-name)?|transition(?:-property)?)\s*:/i.test(css);
if (hasAnim) {
  // Ambos bloques se cortan por el SIGUIENTE `@media`: si no, las reglas de
  // print (o de otro media query) validarían en falso el bloque reduced-motion.
  const reducedCss = mediaBlock(css, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);
  if (!reducedCss) warnMsg('Hay animaciones pero falta regla prefers-reduced-motion.');
  else {
    let rmOk = true;
    const falta = (msg) => { rmOk = false; warnMsg(msg); };
    if (!/animation\s*:\s*none|animation-duration\s*:\s*0/i.test(reducedCss)) falta('prefers-reduced-motion no desactiva las animaciones CSS.');
    if (!/transition\s*:\s*none|transition-duration\s*:\s*0/i.test(reducedCss)) falta('prefers-reduced-motion no desactiva las transiciones CSS.');
    if (!/scroll-behavior\s*:\s*auto/i.test(reducedCss)) falta('prefers-reduced-motion no fuerza scroll-behavior:auto.');
    if (!/data-(?:reveal|slide|grow|draw|pop|water)/i.test(reducedCss)) falta('prefers-reduced-motion no fija el estado final de los elementos data-*.');
    if (rmOk) okMsg('prefers-reduced-motion con estado final completo.');
  }
  const printCss = mediaBlock(css, /@media\s*print\b/i);
  if (!printCss) warnMsg('Hay animaciones pero no @media print para forzar estado final.');
  else if (!/data-(?:reveal|slide|grow|draw|pop)[\s\S]*(?:opacity\s*:\s*1|transform\s*:\s*none|stroke-dashoffset\s*:\s*0)/i.test(printCss)) {
    warnMsg('El bloque print no fuerza el estado final de las animaciones data-*.');
  } else okMsg('Print fuerza el estado final de las animaciones.');
  if (/transition\s*:\s*all\b/i.test(css)) warnMsg('Se usa transition:all; declara las propiedades explícitamente.');

  // Gating `html.js`: el estado inicial oculto (opacity:0, visibility:hidden)
  // no debe existir sin JavaScript. Cada selector que lo aplique a un elemento
  // `data-*` de motion tiene que ir detrás de una clase que solo pone el JS
  // (`html.js`, `body.js`, …). Se acepta además la variante `:not(.no-anim)`.
  const motionAttr = 'data-(?:reveal|slide|grow|draw|pop|count|stagger|water)';
  // `.js` cuenta como clase aunque venga pegada a un selector de tipo (`html.js`);
  // lo que no vale es que sea parte de otro nombre (`.no-js`, `.js-active`).
  const gateJs = (selector) => [...selector.matchAll(/\.js\b/g)]
    .some((m) => m.index === 0 || !/[.\-_]/.test(selector[m.index - 1]));
  const reglasOcultas = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, sel, body]) => new RegExp(`\\[${motionAttr}\\]`, 'i').test(sel)
      && /(?:^|[;{\s])opacity\s*:\s*0(?:\.0+)?(?:\s*[;!]|\s*$)|(?:^|[;{\s])visibility\s*:\s*hidden\b/i.test(body));
  const sinGate = [...new Set(reglasOcultas
    .map(([, sel]) => sel.trim().replace(/\s+/g, ' '))
    .filter((sel) => !gateJs(sel)))];
  if (sinGate.length) {
    warnMsg(`Estado inicial oculto sin gating \`html.js\` (${sinGate.slice(0, 2).join(' | ')}); sin JS el contenido quedaría invisible.`);
  } else if (reglasOcultas.length) {
    okMsg('El estado inicial oculto de los elementos data-* está gated por html.js.');
  }

  // scale(0) es una singularidad:rompe la reversibilidad y el CLS. Se ignoran los
  // subrayados/decorados de :hover, :focus, ::after y ::before, que no son entradas.
  const escalaSingular = [...css.matchAll(/([^{}]+)\{([^{}]*scale(?:X|Y)?\(\s*0(?:\.0+)?\s*\)[^{}]*)\}/gi)]
    .filter((m) => !/:hover|:focus|:active|::after|::before/.test(m[1]))
    .map((m) => m[1].trim().replace(/\s+/g, ' '));
  if (escalaSingular.length) warnMsg(`Entradas con scale(0) (${escalaSingular.slice(0, 2).join(' | ')}); usa una escala no singular o solo opacidad.`);
}

// C7. Estructura semántica y navegación por teclado
const mains = openTags(markup, 'main');
if (mains.length !== 1) warnMsg(`Debe existir exactamente un <main> (hay ${mains.length}).`);
const h1s = [...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
if (h1s.length !== 1 || !textOf(h1s[0]?.[1] || '')) warnMsg(`Debe existir exactamente un <h1> con contenido (hay ${h1s.length}).`);
else okMsg('Un único <h1> con contenido.');
// Jerarquía de encabezados sin saltos: h2 -> h4 rompe la navegación por encabezados.
const headingLevels = [...markup.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
  .filter((h) => textOf(h[2]).length > 0)
  .map((h) => Number(h[1]));
const saltos = [];
for (let i = 1; i < headingLevels.length; i++) {
  if (headingLevels[i] - headingLevels[i - 1] > 1) saltos.push(`h${headingLevels[i - 1]} → h${headingLevels[i]}`);
}
if (saltos.length) warnMsg(`Salto(s) en la jerarquía de encabezados: ${saltos.slice(0, 4).join(', ')}.`);
else if (headingLevels.length) okMsg('Jerarquía de encabezados sin saltos.');
const docTitle = markup.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
if (!docTitle || !textOf(docTitle[1]) || /\{\{/.test(docTitle[1])) warnMsg('<title> vacío o con placeholder sin sustituir.');
for (const nav of openTags(markup, 'nav')) {
  // Un atributo presente pero vacío no nombra nada: sirve `hasAttr`, no el nombre.
  const nombre = (attr(nav, 'aria-label') || attr(nav, 'aria-labelledby') || '').trim();
  if (!nombre) warnMsg('Un <nav> necesita aria-label o aria-labelledby con valor.');
}
const interactive = /<(?:a|button|input|select|textarea|summary)\b|\btabindex\s*=/i.test(markup);
if (interactive && !/:focus-visible\b[^}]*\{[^}]*\boutline(?:-style)?\s*:/i.test(css)) warnMsg('Hay elementos interactivos pero falta una regla :focus-visible con outline visible.');
if (/\btabindex\s*=\s*["']?[1-9]\d*/i.test(markup)) warnMsg('Hay tabindex positivo; rompe el orden natural de tabulación.');
// `outline:none` es legítimo solo para retirar el anillo en :focus cuando el
// navegador no distingue focus-visible; en cualquier otro caso el foco desaparece.
const outlineFatal = [...new Set([...css.matchAll(/([^{}]+)\{[^{}]*outline\s*:\s*(?:none|0)\b[^{}]*\}/gi)]
  .map(([, sel]) => sel.trim().replace(/\s+/g, ' '))
  .filter((sel) => !/:not\(\s*:focus-visible\s*\)/.test(sel)))];
if (outlineFatal.length) warnMsg(`Hay outline:none; el foco debe tener un indicador visible (sustituir, no eliminar): ${outlineFatal.slice(0, 2).join(' | ')}.`);

// C8. Skip link al contenido principal
const skipEls = [...markup.matchAll(/<a\b[^>]*\bclass\s*=\s*["'][^"']*\bskip-link\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)];
if (!skipEls.length) warnMsg('Falta un skip link (.skip-link) al contenido principal.');
else {
  const tag = skipEls[0][0];
  const href = attr(tag, 'href') || '';
  const label = textOf(skipEls[0][1]) || attr(tag, 'aria-label') || '';
  if (!href.startsWith('#') || !label) warnMsg('El skip link necesita href="#id" y texto o aria-label.');
  const main = mains[0];
  const mainId = main ? attr(main, 'id') : null;
  if (!mainId || href !== `#${mainId}`) warnMsg('El href del skip link no coincide con el id de <main>.');
  else if (!main || attr(main, 'tabindex') !== '-1') warnMsg('<main id="contenido"> necesita tabindex="-1" para recibir el foco del skip link.');
  else okMsg('Skip link enlazado al <main> con foco programático.');
}

// C9. SVG decorativos, roles, nombres accesibles y referencias del sprite
const svgTags = paired(markup, 'svg');
let svgSinNombre = 0;
let iconosSinOcultar = 0;
let iconosSinFocusable = 0;
let svgImgOculto = 0;
for (const svg of svgTags) {
  const classes = classList(svg.open);
  const hidden = /aria-hidden\s*=\s*["']true["']/i.test(svg.open) || /role\s*=\s*["'](?:presentation|none)["']/i.test(svg.open) || /display\s*:\s*none/i.test(svg.open);
  const named = /<title\b[^>]*>[\s\S]*?\S[\s\S]*?<\/title>/i.test(svg.body) || /aria-label\s*=\s*["'][^"']+["']/i.test(svg.open) || /aria-labelledby\s*=\s*["'][^"']+["']/i.test(svg.open);
  // role="img" + aria-hidden se contradicen: la imagen existe pero se oculta del árbol.
  if (/role\s*=\s*["']img["']/i.test(svg.open) && hidden) { svgImgOculto++; continue; }
  // Cada SVG resuelve su estado en UN solo aviso: nunca dos por el mismo nodo.
  if (classes.includes('icon')) {
    // Los iconos junto a texto son decorativos por definición: exigen ocultar.
    if (!hidden) iconosSinOcultar++;
    else if (!/focusable\s*=\s*["']false["']/i.test(svg.open)) iconosSinFocusable++;
  } else if (!hidden && !named) {
    svgSinNombre++;
  }
}
if (svgSinNombre > 0) warnMsg(`${svgSinNombre} SVG visible(s) sin nombre accesible (<title>, aria-label o aria-labelledby) ni marcado como decorativo.`);
if (iconosSinOcultar > 0) warnMsg(`${iconosSinOcultar} icono(s) .icon sin aria-hidden="true" (junto a texto son decorativos).`);
if (iconosSinFocusable > 0) warnMsg(`${iconosSinFocusable} icono(s) .icon sin focusable="false" (evita que entren en la secuencia de tabulación).`);
if (svgImgOculto > 0) warnMsg(`${svgImgOculto} SVG con role="img" y aria-hidden="true" a la vez (contradictorio).`);
if (!svgSinNombre && !iconosSinOcultar && !iconosSinFocusable && !svgImgOculto && svgTags.length) okMsg('SVG decorativos ocultos y SVG con nombre accesible.');
const ids = new Set([...markup.matchAll(/\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'=<>`]+))/gi)].map((i) => i[1] ?? i[2] ?? i[3]));
const missingSymbols = [...new Set(useRefs.filter((ref) => ref.startsWith('#') && !ids.has(ref.slice(1))))];
if (missingSymbols.length) warnMsg(`<use> apunta a symbol inexistente: ${missingSymbols.slice(0, 5).join(', ')}.`);

// C10. Imágenes embebidas, con alt y dimensiones
const imgs = openTags(markup, 'img');
let imgIssues = 0;
for (const img of imgs) {
  // El bloqueo por `<img>` no embebida ya lo emite A1: aquí solo se cuenta.
  if (!(attr(img, 'src') || '').startsWith('data:image/')) imgIssues++;
  // `srcset` no admite data: URIs (la coma que separa el prefijo de la URI es
  // ambigua con la que separa candidatas) y no aporta nada en un único archivo
  // autocontenido: se rechaza en lugar de intentar analyses por coma.
  if (attr(img, 'srcset') !== null) {
    warnMsg('Una <img> usa srcset; en un informe offline embebe una sola imagen en src (srcset no admite data: URIs).');
    imgIssues++;
  }
  const alt = attr(img, 'alt');
  const decorative = /aria-hidden\s*=\s*["']true["']/i.test(img) || /role\s*=\s*["'](?:presentation|none)["']/i.test(img);
  if (alt === null) { warnMsg('Una <img> no tiene atributo alt.'); imgIssues++; }
  else if (alt.trim() === '' && !decorative) { warnMsg('Una <img> con alt="" debe ser decorativa (aria-hidden o role=presentation).'); imgIssues++; }
  if (!/^\d+$/.test(attr(img, 'width') || '') || !/^\d+$/.test(attr(img, 'height') || '')) { warnMsg('Una <img> no declara width/height intrínsecos (evita CLS).'); imgIssues++; }
}
for (const image of [...markup.matchAll(/<image\b[^>]*\b(?:xlink:)?href\s*=\s*["']([^"']+)["'][^>]*>/gi)]) {
  if (!image[1].startsWith('data:image/')) failMsg(`<svg><image> no embebida: ${image[1].slice(0, 80)}`);
}
if (imgs.length && !imgIssues) okMsg(`${imgs.length} imagen(es) embebida(s) con alt y dimensiones.`);

// C11. Reflow: wrapping, texto largo y tablas con contenedor
if (!/overflow-wrap\s*:\s*(?:anywhere|break-word)\b/i.test(css)) warnMsg('Falta overflow-wrap:anywhere|break-word para contenido largo.');
if (!/text-wrap\s*:\s*(?:balance|pretty)\b/i.test(css)) warnMsg('Falta text-wrap:balance|pretty en títulos o prosa.');
if (/(?:html|body)\s*\{[^}]*overflow-x\s*:\s*hidden/i.test(css)) warnMsg('No uses overflow-x:hidden en html/body para ocultar desbordes.');
const tables = openTags(markup, 'table').length;
const tableWraps = [...markup.matchAll(/<[a-z][\w-]*\b[^>]*class\s*=\s*(?:"[^"]*\btable-wrap\b[^"]*"|'[^']*\btable-wrap\b[^']*')[^>]*>/gi)].length;
// Un único .table-wrap puede envolver varias tablas: se exige cobertura, no paridad.
if (tables > 0 && (tableWraps < 1 || !/\.table-wrap\b[^{]*\{[^}]*overflow-x\s*:\s*(?:auto|scroll)\b/i.test(css))) {
  warnMsg(`Hay ${tables} <table> pero faltan contenedores .table-wrap con overflow-x:auto|scroll.`);
}

// C12. Anclas, sticky y scroll-margin
const sticky = /position\s*:\s*sticky/i.test(css);
// Basta UNA declaración de desplazamiento válida: un `0` temprano en otro
// selector no puede invalidar la que sí compensa el topbar.
const scrollOffsets = [...css.matchAll(/(?:scroll-padding-top|scroll-margin-top)\s*:\s*([^;}]+)/gi)]
  .map((o) => o[1].trim())
  .filter((v) => v && !/^(?:0|0px|0%|auto)$/i.test(v) && !/\{\{/.test(v));
if (sticky && !scrollOffsets.length) warnMsg('Hay position:sticky pero falta scroll-padding-top/scroll-margin-top > 0.');
const fragments = [...markup.matchAll(/<a\b[^>]*\bhref\s*=\s*["']#([^"']+)["'][^>]*>/gi)].map((a) => a[1]);
const missingAnchors = [...new Set(fragments.filter((id) => !ids.has(id)))];
if (missingAnchors.length) warnMsg(`Anclas internas rotas: ${missingAnchors.slice(0, 5).join(', ')}.`);
const idList = [...markup.matchAll(/\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'=<>`]+))/gi)].map((i) => i[1] ?? i[2] ?? i[3]);
const duplicateIds = [...new Set(idList.filter((id, i) => idList.indexOf(id) !== i))];
if (duplicateIds.length) warnMsg(`id duplicado(s): ${duplicateIds.slice(0, 5).join(', ')}.`);

// C13. color-scheme y theme-color coherentes
// Se resuelven los metas por atributo, no por orden: `content="light" name="color-scheme"`
// es igual de válido que al revés.
const metaByName = (name) => {
  for (const tag of openTags(markup, 'meta')) {
    if ((attr(tag, 'name') || '').trim().toLowerCase() === name) return (attr(tag, 'content') || '').trim();
  }
  return null;
};
const metaColorScheme = metaByName('color-scheme');
const metaTheme = metaByName('theme-color');
if (metaColorScheme === null) warnMsg('Falta <meta name="color-scheme" content="light">.');
if (metaTheme === null || !metaTheme || /\{\{/.test(metaTheme)) warnMsg('Falta <meta name="theme-color"> con el color de fondo real.');
// Sin `color-scheme` en `:root`/`html` los controles nativos y los scrollbars
// no siguen al informe: basta con que aparezca en cualquier otra regla.
if (!/(:root|html)\s*\{[^}]*color-scheme\s*:/i.test(css)) warnMsg('Falta color-scheme en CSS (:root o html) para alinear controles nativos y scrollbars.');
if (/data-theme\s*=\s*["']dark["']/i.test(markup) && !/\[data-theme=["']?dark["']?\][^{]*\{[^}]*color-scheme\s*:\s*dark/i.test(css)) {
  warnMsg('El modo oscuro necesita color-scheme:dark en su bloque CSS.');
}
if (metaColorScheme !== null && metaTheme) okMsg('color-scheme y theme-color declarados.');

// ============ Resumen ============
const blockers = hallazgos.length;
const designIssues = warnings.length;
const failed = blockers > 0 || (strict && designIssues > 0);

// Modo --json: salida estructurada y estable para CI y para los tests unitarios.
if (json) {
  console.log(JSON.stringify({
    file, strict, passed: !failed,
    sizeBytes: Buffer.byteLength(html), styleBlocks: styleBlocks.length, sections,
    blockers, designIssues, blockersList: hallazgos, warningsList: warnings, positives: ok,
  }, null, 2));
  process.exit(failed ? 1 : 0);
}

const line = String.fromCharCode(0x2500).repeat(52);
console.log(line);
console.log(`Validación offline de: ${file}`);
console.log(line);
console.log(`Tamaño: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB · <style>: ${styleBlocks.length} · secciones: ${sections}`);
console.log(line);

if (failed) {
  if (blockers > 0) {
    console.log(`\n✘ FAIL — ${blockers} hallazgo(s) de dependencia externa/obligación:`);
    for (const h of hallazgos) console.log(`  ✘ ${h}`);
  }
  if (designIssues > 0) {
    const tag = strict ? '✘ FAIL (--strict)' : '⚠ WARNINGS';
    console.log(`\n${tag} — ${designIssues} check(s) de diseño:`);
    for (const w of warnings) console.log(`  ⚠ ${w}`);
    if (!strict) console.log('\n  (usa --strict para que los warnings también bloqueen)');
  }
  if (ok.length) {
    console.log('\nVerificaciones positivas:');
    for (const o of ok) console.log(`  ✔ ${o}`);
  }
  console.log('\nCorrige los hallazgos y vuelve a validar antes de entregar.');
  process.exit(1);
} else {
  console.log(`\n✔ PASS — 0 errores de dependencia externa${strict ? ' y diseño OK' : ''}.`);
  if (designIssues > 0) {
    console.log(`\n${designIssues} warning(s) de diseño (no bloqueantes):`);
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }
  if (ok.length) console.log(`\nNotas: ${ok.length} verificaciones positivas.`);
  console.log('\nPara PDF: abrir con doble clic → Imprimir → Guardar como PDF.');
  process.exit(0);
}
