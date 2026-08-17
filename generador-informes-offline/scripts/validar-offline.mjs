#!/usr/bin/env node
// validar-offline.mjs — comprueba que un HTML es 100% autocontenido (0 dependencias externas)
// y añade checks de diseño (warnings). Con --strict los warnings también bloquean.
// Uso: node validar-offline.mjs <archivo.html> [--strict]
// Salida: PASS/FAIL. Códigos: 0 = OK, 1 = hallazgos (o warnings con --strict), 2 = mal uso.

import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('Uso: node validar-offline.mjs <archivo.html> [--strict]');
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

// ============ BLOQUE A: 0-internet (errores) ============

// A1. URLs externas en atributos src/href/poster/action/data-src
const attrRe = /(?:src|href|poster|data-src|action)\s*=\s*["']([^"']+)["']/gi;
let m;
while ((m = attrRe.exec(html))) {
  const url = m[1].trim();
  if (/^(?:https?:)?\/\//i.test(url)) {
    failMsg(`URL externa en atributo: ${url}`);
  } else if (url.startsWith('data:')) {
    okMsg(`data: URI embebida (${url.slice(0, 34)}…)`);
  } else if (/^(?:mailto|tel|#)/.test(url)) {
    // ok: enlaces internos y de contacto
  } else if (/\.[a-z0-9]{1,5}\b/i.test(url)) {
    okMsg(`Referencia local/relativa: ${url}`);
  }
}

// A2. <script src> y <link rel=stylesheet>
if (/<script[^>]*\bsrc\s*=/i.test(html)) failMsg('<script src> externo presente (debe ir inline)');
if (/<link[^>]*rel=["']?stylesheet/i.test(html)) failMsg('<link rel="stylesheet"> presente (debe ir inline)');

// A3. <base href>
if (/<base\b/i.test(html)) failMsg('<base href> presente');

// A4. <iframe> / <embed> / <object>
if (/<iframe\b/i.test(html)) failMsg('<iframe> presente');
if (/<embed\b/i.test(html)) failMsg('<embed> presente');

// A5. Bloques CSS: @import, url() externa, @font-face sin fuente embebida
const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
for (const sb of styleBlocks) {
  const css = sb[1];
  if (/@import\b/i.test(css)) failMsg('@import detectado en CSS');
  if (/url\(\s*(?:https?:)?\/\//i.test(css)) failMsg('url() externa en CSS');
  const fontFaces = [...css.matchAll(/@font-face\s*\{[\s\S]*?\}/gi)];
  for (const ff of fontFaces) {
    if (/data:\s*font/i.test(ff[0])) okMsg('@font-face con fuente embebida (data: URI)');
    else failMsg('@font-face sin fuente embebida (riesgo de descarga)');
  }
}

// A6. fetch / XMLHttpRequest / WebSocket
const fetchCalls = [...html.matchAll(/\bfetch\s*\(\s*["'`]([^"'`]+)/g)];
for (const fc of fetchCalls) {
  const target = fc[1];
  if (/^(?:https?:)?\/\//i.test(target)) failMsg(`fetch() a URL externa: ${target}`);
  else if (!/^(?:data|blob):/i.test(target)) failMsg(`fetch() a recurso no embebido: ${target}`);
}
if (/\bXMLHttpRequest\b/.test(html)) failMsg('XMLHttpRequest presente');
if (/new\s+WebSocket/.test(html)) failMsg('WebSocket presente');

// A7. <use> con referencia externa
const useRe = /<use\b[^>]*\b(?:href|xlink:href)\s*=\s*["']([^"']+)["']/gi;
while ((m = useRe.exec(html))) {
  const ref = m[1];
  if (!ref.startsWith('#')) failMsg(`<use> con referencia externa: ${ref}`);
}

// A8. Iconos remotos: <img> con src remoto ya cubierto en A1.

// ============ BLOQUE B: estructurales (obligatorias) ============

if (!/<meta[^>]*charset=["']?utf-8/i.test(html)) failMsg('<meta charset="UTF-8"> ausente (obligatorio)');
else okMsg('<meta charset="UTF-8"> presente');
if (!/<html[^>]*lang=["']?es/i.test(html)) failMsg('<html lang="es"> no declarado (obligatorio)');
else okMsg('<html lang="es"> presente');
if (!/@media\s*print/i.test(html)) warnMsg('Sin @media print: el PDF se exportará sin estilos de impresión.');
else okMsg('@media print presente');

// ============ BLOQUE C: diseño (warnings; bloquean con --strict) ============

// C1. Contraste AA de los tokens (--text y --muted sobre --surface; --text sobre --bg)
const rootMatch = html.match(/:root\s*\{([\s\S]*?)\}/);
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
  if (cMutedSurface != null && cMutedSurface < 3) warnMsg(`Contraste --muted/--surface ${cMutedSurface.toFixed(2)}:1 < 3 (bajo para texto secundario).`);
  const cTextBg = ratio(text, bg);
  if (cTextBg != null && cTextBg < 4.5) warnMsg(`Contraste --text/--bg ${cTextBg.toFixed(2)}:1 < 4.5 (AA).`);
  else if (cTextBg != null) okMsg(`Contraste --text/--bg ${cTextBg.toFixed(2)}:1 (≥4.5 AA).`);
} else {
  warnMsg('No se encontró bloque :root con tokens de color.');
}

// C2. Footer con identidad (5 campos)
const footer = html.match(/<footer[\s\S]*?<\/footer>/i);
if (!footer) {
  warnMsg('Sin <footer>: falta el bloque de identidad obligatorio.');
} else {
  const f = footer[0];
  const checks = [
    ['logo', /class="logo"|<svg[^>]*class="[^"]*logo/i.test(f) || /<img[^>]*data:/i.test(f)],
    ['nombre de empresa', /<strong>[\s\S]{2,}<\/strong>|brand/i.test(f)],
    ['contacto', /@|mailto:|tel:|www\.|\.(?:com|es|net|org)\b/i.test(f)],
    ['autor', /Elaborado por|autor|preparado por|realizado por/i.test(f)],
    ['período', /20\d{2}/.test(f)],
  ];
  const missing = checks.filter(([, p]) => !p).map(([n]) => n);
  if (missing.length) warnMsg(`Footer incompleto: falta ${missing.join(', ')}.`);
  else okMsg('Footer con identidad completa (logo, empresa, contacto, autor, período).');
}

// C3. Título descriptivo por gráfica + "Lectura:" de análisis
let svgsSinTitulo = 0;
const svgTags = [...html.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi)];
for (const svg of svgTags) {
  if (/class="[^"]*\bchart\b[^"]*"/.test(svg[0]) && !/<title>[\s\S]*?<\/title>/i.test(svg[1]) && !/aria-label=["'][^"']+["']/i.test(svg[0])) {
    svgsSinTitulo++;
  }
}
if (svgsSinTitulo > 0) warnMsg(`${svgsSinTitulo} gráfica(s) sin <title> descriptivo (o aria-label).`);
const lecturas = (html.match(/Lectura:/g) || []).length;
const chartWraps = (html.match(/class="chart"/g) || []).length + (html.match(/class="chart "/g) || []).length;
if (chartWraps > 0 && lecturas < chartWraps) warnMsg(`Faltan análisis: ${chartWraps} gráfica(s) pero solo ${lecturas} "Lectura:".`);
else if (chartWraps > 0) okMsg(`Todas las gráficas (${chartWraps}) llevan "Lectura:".`);

// C4. TOC si hay >6 secciones
const sections = (html.match(/<section\b/gi) || []).length;
if (sections > 6 && !/class="[^"]*\btoc\b[^"]*"/.test(html)) warnMsg(`Hay ${sections} secciones y no se detectó un índice (TOC).`);
else if (sections > 6) okMsg('TOC presente para informe largo.');

// C5. Secciones vacías
const sectionTags = [...html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/gi)];
let emptySecs = 0;
for (const s of sectionTags) {
  const text = s[1].replace(/<[^>]+>/g, '').trim();
  if (text.length < 20) emptySecs++;
}
if (emptySecs > 0) warnMsg(`${emptySecs} sección(es) sin contenido sustancial.`);

// C6. Animaciones: reduced-motion + print
const hasAnim = /data-(reveal|grow|draw|pop|count|stagger)/.test(html);
if (hasAnim) {
  const css = styleBlocks.map((s) => s[1]).join('\n');
  if (!/prefers-reduced-motion/i.test(css)) warnMsg('Hay animaciones pero falta regla prefers-reduced-motion.');
  else okMsg('prefers-reduced-motion presente.');
  if (!/@media\s*print/i.test(css)) warnMsg('Hay animaciones pero no @media print para forzar estado final.');
  if (/no-anim|\.in\b/.test(css)) okMsg('Clases de animación (.in / no-anim) presentes.');
}

// ============ Resumen ============
const line = '─'.repeat(52);
console.log(line);
console.log(`Validación offline de: ${file}`);
console.log(line);
console.log(`Tamaño: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB · <style>: ${styleBlocks.length} · secciones: ${sections}`);
console.log(line);

const blockers = hallazgos.length;
const designIssues = warnings.length;
if (blockers > 0 || (strict && designIssues > 0)) {
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
