// Fixtures unitarios del validador offline.
//
// Ejecutar: node --test generador-informes-offline/scripts/validar-offline.test.mjs
//
// Cada test construye un HTML mínimo y comprueba que el validador falla (o
// pasa) por el motivo esperado. Objetivo: que un check nuevo no se rompa en
// silencio y que un falso positivo no vuelva a colarse. Las aserciones leen
// el JSON de `--json`, no los textos en castellano de la salida humana.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VALIDADOR = join(dirname(fileURLToPath(import.meta.url)), 'validar-offline.mjs');
// Los informes de referencia viven dos niveles arriba; si el script se copia
// aislado, estas pruebas de regresión se omiten en lugar de fallar.
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const workdir = mkdtempSync(join(tmpdir(), 'validar-offline-test-'));
let counter = 0;

/** Ejecuta el validador en modo --json y devuelve el informe parseado + código. */
function run(html, { strict = true } = {}) {
  const file = join(workdir, `caso-${counter++}.html`);
  writeFileSync(file, html, 'utf8');
  const args = [VALIDADOR, file, '--json'];
  if (strict) args.push('--strict');
  try {
    const stdout = execFileSync(process.execPath, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, ...JSON.parse(stdout) };
  } catch (e) {
    if (e.status === 0) throw new Error('fallo inesperado del proceso');
    return { code: e.status, ...JSON.parse(String(e.stdout)) };
  }
}

const SPRITE = '<svg aria-hidden="true" style="display:none"><defs><symbol id="i-x" viewBox="0 0 24 24"><line x1="4" y1="4" x2="20" y2="20"/></symbol></defs></svg>';
const ICONO = '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-x"></use></svg>';

// Paleta de series y tokens de acento con las cuotas MEDIDAS, no estimadas:
// 30% deja el cromo del filete en 3:1 o mas; 50% lleva el texto del badge a
// 4.5:1 en las siete series; 68% es para el texto grande de los KPI, donde el
// tono todavia tiene que leerse.
const TOKENS_ACCENTO = `
  --chart-1:#1e3a8a;--chart-2:#3b82f6;--chart-3:#f59e0b;--chart-4:#10b981;
  --chart-5:#8b5cf6;--chart-6:#ef4444;--chart-7:#14b8a6;
  --accent:var(--primary);
  --accent-line:color-mix(in srgb,var(--text) 30%,var(--accent));
  --accent-text:color-mix(in srgb,var(--text) 50%,var(--accent));
  --accent-ink:color-mix(in srgb,var(--text) 68%,var(--accent));`;

const CSS_BASE = `
:root{color-scheme:light;--bg:#f6f8fb;--surface:#ffffff;--text:#1f2937;--muted:#4b5563;
  --border:#e5e7eb;--primary:#1e3a8a;/*TOKENS*/
  --motion-ease:cubic-bezier(.23,1,.32,1);--motion-duration:240ms;--motion-delay:80ms;}
html{scroll-behavior:smooth;scroll-padding-top:88px}
body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;line-height:1.6;
  overflow-wrap:anywhere;text-wrap:pretty}
h1,h2,h3,h4{line-height:1.2;text-wrap:balance}
:focus-visible{outline:3px solid var(--primary);outline-offset:2px}
.skip-link{position:absolute;top:-80px;transition:top var(--motion-duration) var(--motion-ease)}
.skip-link:focus{top:12px}
.topbar{position:sticky;top:0}
main[id],section[id]{scroll-margin-top:88px}
html.js:not(.no-anim) [data-reveal]{opacity:0;transform:translateY(16px);
  transition:opacity var(--motion-duration) var(--motion-ease),transform var(--motion-duration) var(--motion-ease);
  transition-delay:min(var(--d,0ms),var(--motion-delay))}
html.js:not(.no-anim) [data-reveal].in{opacity:1;transform:none}
html.js:not(.no-anim) [data-grow]{transform:scaleY(.2);transform-box:fill-box;transform-origin:center bottom;
  transition:transform var(--motion-duration) var(--motion-ease)}
html.js:not(.no-anim) [data-grow].in{transform:scaleY(1)}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  html.js [data-reveal],html.js [data-slide],html.js [data-grow],html.js [data-pop]{opacity:1!important;transform:none!important}
  html.js [data-draw]{stroke-dashoffset:0!important}
  .skip-link{display:none!important}
}
@media print{@page{size:A4;margin:14mm}.skip-link{display:none!important}
  html.js [data-reveal]{opacity:1!important;transform:none!important}}`;

/** Informe de referencia: cumple todo el baseline y pasa --strict limpio. */
function informe({ head = '', css = '', main = '', footer, tokens = TOKENS_ACCENTO } = {}) {
  const pie = footer ?? `<footer><img src="data:image/png;base64,iVBORw0KGgo=" alt="Acme" width="60" height="40">
      <strong>Acme S.L.</strong>
      <address>Calle Mayor 1 · acme.example</address>
      <span>Elaborado por: Ana Ruiz</span><span>2026</span></footer>`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#f6f8fb">
<title>Informe de prueba</title>
${head}
<style>${CSS_BASE.replace('/*TOKENS*/', tokens)}${css}</style>
</head>
<body>
${SPRITE}
<a class="skip-link" href="#contenido">Saltar al contenido principal</a>
<nav class="topbar" aria-label="Barra superior"><span>Acme</span></nav>
<nav class="toc" aria-label="Índice"><ol><li><a href="#s1">Resumen</a></li></ol></nav>
<main id="contenido" class="container" tabindex="-1">
  <h1>Informe de prueba</h1>
  <section id="s1"><h2>Resumen</h2><p>Contenido de la sección con texto suficiente.</p></section>
  ${main}
</main>
${pie}
</body>
</html>`;
}

const figura = (titulo, lectura) => `<figure class="chart">
  <svg viewBox="0 0 600 200" role="img" aria-label="${titulo}"><rect x="10" y="10" width="100" height="80"></rect></svg>
  <figcaption class="chart-caption"><strong>Lectura:</strong> ${lectura}</figcaption>
</figure>`;

after(() => rmSync(workdir, { recursive: true, force: true }));

// ---------- Base y códigos de salida ----------

test('el informe de referencia pasa --strict con 0 hallazgos y 0 warnings', () => {
  const r = run(informe());
  assert.equal(r.code, 0);
  assert.equal(r.passed, true);
  assert.equal(r.blockers, 0);
  assert.equal(r.designIssues, 0);
});

test('sin argumentos devuelve código 2 (mal uso)', () => {
  assert.throws(
    () => execFileSync(process.execPath, [VALIDADOR], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }),
    (e) => e.status === 2,
  );
});

test('un archivo inexistente devuelve código 2', () => {
  assert.throws(
    () => execFileSync(process.execPath, [VALIDADOR, join(workdir, 'no-existe.html')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }),
    (e) => e.status === 2,
  );
});

test('sin --strict los warnings se informan pero no rompen el código de salida', () => {
  const roto = informe({ css: 'html.js:not(.no-anim) [data-grow]{transform:scaleY(0)}' });
  const blando = run(roto, { strict: false });
  assert.equal(blando.code, 0);
  assert.equal(blando.passed, true);
  assert.ok(blando.designIssues > 0, 'el warning debe estar registrado aunque no bloquee');
  const duro = run(roto, { strict: true });
  assert.equal(duro.code, 1);
  assert.equal(duro.passed, false);
});

// ---------- Bloque A: 0 internet ----------

test('A1: URL externa en atributo es error bloqueante', () => {
  const r = run(informe({ head: '<link rel="stylesheet" href="https://cdn.example/x.css">' }));
  assert.equal(r.code, 1);
  assert.match(r.blockersList.join('\n'), /URL externa en atributo/);
});

test('A1: un <img> con ruta relativa es error, no solo con URL absoluta', () => {
  const r = run(informe().replace('src="data:image/png;base64,iVBORw0KGgo=" alt="Acme" width="60" height="40"', 'src="logos/acme.png" alt="Acme" width="60" height="40"'));
  assert.equal(r.code, 1);
  assert.match(r.blockersList.join('\n'), /<img> no embebida/);
});

test('A1: un <link> con href local no embebido también es error', () => {
  const r = run(informe({ head: '<link rel="alternate" href="data/otro.html">' }));
  assert.equal(r.code, 1);
  assert.match(r.blockersList.join('\n'), /<link> con recurso no embebido/);
});

test('A1: un ancla interna o un mailto no se confunden con una URL externa', () => {
  const r = run(informe({ main: '<p><a href="#s1">Ir a la sección</a> · <a href="mailto:ana@acme.example">Correo</a></p>' }));
  assert.equal(r.blockers, 0);
});

test('A2: <script src> y <link rel="stylesheet"> son error', () => {
  assert.match(run(informe({ head: '<script src="js/motion.js"></script>' })).blockersList.join('\n'), /<script src> externo/);
  assert.match(run(informe({ head: '<link rel="stylesheet" href="data:text/css,x">' })).blockersList.join('\n'), /<link rel="stylesheet"> presente/);
});

test('A3/A4: <base>, <iframe>, <embed> y <object> son error', () => {
  assert.match(run(informe({ head: '<base href="/">' })).blockersList.join('\n'), /<base href> presente/);
  assert.match(run(informe({ main: '<iframe></iframe>' })).blockersList.join('\n'), /<iframe> presente/);
  assert.match(run(informe({ main: '<embed src="data:,">' })).blockersList.join('\n'), /<embed> presente/);
  assert.match(run(informe({ main: '<object data="data:,"></object>' })).blockersList.join('\n'), /<object> presente/);
});

test('A5: @import y url() no embebida son error; la data: URI no', () => {
  assert.match(run(informe({ css: '@import url("otra.css");' })).blockersList.join('\n'), /@import detectado/);
  assert.match(run(informe({ css: '.x{background:url(fondo.png)}' })).blockersList.join('\n'), /url\(\) no embebida/);
  assert.equal(run(informe({ css: '.x{background:url(data:image/png;base64,iVBORw0KGgo=)}' })).blockers, 0);
});

test('A6: fetch() no embebido, XMLHttpRequest y WebSocket son error', () => {
  assert.match(run(informe({ head: '<script>fetch("datos.json")</script>' })).blockersList.join('\n'), /fetch\(\) a recurso no embebido/);
  assert.match(run(informe({ head: '<script>new XMLHttpRequest()</script>' })).blockersList.join('\n'), /XMLHttpRequest presente/);
  assert.match(run(informe({ head: '<script>new WebSocket("ws://x")</script>' })).blockersList.join('\n'), /WebSocket presente/);
});

test('A7: <use> a un symbol interno es válido y el symbol debe existir', () => {
  const ok = run(informe({ main: ICONO }));
  assert.equal(ok.passed, true, ok.warningsList.join('\n'));

  const falta = run(informe({ main: ICONO }).replace(/<defs>[\s\S]*?<\/defs>/, '') );
  assert.equal(falta.code, 1);
  assert.match(falta.warningsList.join('\n'), /<use> apunta a symbol inexistente: #i-x/);
});

test('A7: <use> con ruta a archivo externo es error', () => {
  const r = run(informe({ main: ICONO.replace('href="#i-x"', 'href="assets/iconos.svg#i-x"') }));
  assert.equal(r.code, 1);
  assert.match(r.blockersList.join('\n'), /<use> con referencia externa/);
});

test('un ejemplo dentro de un comentario HTML no dispara falsos positivos', () => {
  const r = run(informe({ head: '<!-- ver también: <script src="x.js"></script> y <iframe></iframe> -->' }));
  assert.equal(r.blockers, 0, r.blockersList.join('\n'));
});

// ---------- Bloque C: diseño, accesibilidad y motion ----------

test('C1: contraste por debajo de AA en --muted es warning', () => {
  const r = run(informe().replace('--muted:#4b5563', '--muted:#d1d5db'));
  assert.equal(r.code, 1);
  assert.match(r.warningsList.join('\n'), /Contraste --muted\/--surface/);
});

test('C1: sin bloque :root es warning', () => {
  const r = run(informe().replace(/:root\{[\s\S]*?\}/, ''));
  assert.match(r.warningsList.join('\n'), /No se encontró bloque :root/);
});

test('C2: el footer acepta <address> como contacto válido', () => {
  const r = run(informe());
  assert.ok(r.positives.some((p) => /Footer con identidad completa/.test(p)));
});

test('C2: falta de contacto, empresa, autor o periodo se listan en el aviso', () => {
  const r = run(informe({
    footer: '<footer><img src="data:image/png;base64,iVBORw0KGgo=" alt="Acme" width="60" height="40"><span>Sin datos</span></footer>',
  }));
  assert.match(r.warningsList.join('\n'), /Footer incompleto: falta .*contacto/);
});

test('C2: la autofirma de la skill en el footer es warning', () => {
  const r = run(informe({
    footer: '<footer><img src="data:image/png;base64,iVBORw0KGgo=" alt="Acme" width="60" height="40"><strong>Acme S.L.</strong>'
      + '<address>Calle Mayor 1</address><span>Elaborado por: Ana Ruiz</span><span>2026</span>'
      + '<span>Documento 100% offline · generado con generador-informes-offline</span></footer>',
  }));
  assert.equal(r.code, 1);
  assert.match(r.warningsList.join('\n'), /autofirma de la skill/);
});

test('C3: una gráfica sin nombre accesible es warning', () => {
  const r = run(informe({ main: '<figure class="chart"><svg viewBox="0 0 600 200"><rect x="1" y="1" width="9" height="9"></rect></svg>'
    + '<figcaption class="chart-caption"><strong>Lectura:</strong> sin nombre.</figcaption></figure>' }));
  assert.match(r.warningsList.join('\n'), /sin nombre accesible/);
});

test('C3: cada <figure class="chart"> necesita su "Lectura:"', () => {
  const conDos = informe({ main: figura('Gráfica uno', 'sube un 12 %.') + figura('Gráfica dos', 'baja un 3 %.') });
  const ok = run(conDos);
  assert.equal(ok.passed, true, ok.warningsList.join('\n'));
  assert.ok(ok.positives.some((p) => /Todas las gráficas \(2\) llevan "Lectura:"/.test(p)));

  const sinUna = informe({ main: figura('Gráfica uno', 'sube un 12 %.') + figura('Gráfica dos', 'baja un 3 %.') })
    .replace('<strong>Lectura:</strong> baja un 3 %.', '');
  const r = run(sinUna);
  assert.equal(r.code, 1);
  assert.match(r.warningsList.join('\n'), /gráfica\(s\) pero solo 1 "Lectura:"/);
});

test('C3: "chart-caption" no cuenta como gráfica adicional', () => {
  const r = run(informe({ main: figura('Gráfica uno', 'sube un 12 %.') }));
  assert.doesNotMatch(r.warningsList.join('\n'), /gráfica\(s\) pero/);
});

test('C4: más de 6 secciones exigen un índice', () => {
  const muchas = Array.from({ length: 7 }, (_, i) => `<section id="x${i}"><h2>S${i}</h2><p>Texto suficiente de la sección ${i}.</p></section>`).join('');
  const r = run(informe().replace('<nav class="toc" aria-label="Índice"><ol><li><a href="#s1">Resumen</a></li></ol></nav>', '').replace('</main>', `${muchas}</main>`));
  assert.match(r.warningsList.join('\n'), /no se detectó un índice \(TOC\)/);
});

test('C5: una sección vacía es warning', () => {
  const r = run(informe({ main: '<section id="vacia"><h2>Vacía</h2><p></p></section>' }));
  assert.match(r.warningsList.join('\n'), /sección\(es\) sin contenido sustancial/);
});

test('C6: sin bloque prefers-reduced-motion es warning cuando hay animación', () => {
  const r = run(informe().replace(/@media \(prefers-reduced-motion: reduce\)\{[\s\S]*?\n\}\n/, ''));
  assert.match(r.warningsList.join('\n'), /falta regla prefers-reduced-motion/);
});

test('C6: el bloque reduced-motion se lee hasta el siguiente @media, no más allá', () => {
  // Estado final SOLO en @media print: el bloque reduced-motion se queda sin él.
  const soloEnPrint = informe()
    .replace('  html.js [data-reveal],html.js [data-slide],html.js [data-grow],html.js [data-pop]{opacity:1!important;transform:none!important}\n', '')
    .replace('  html.js [data-draw]{stroke-dashoffset:0!important}\n', '');
  const r = run(soloEnPrint);
  assert.equal(r.code, 1);
  assert.match(r.warningsList.join('\n'), /el estado final de los elementos data-\*/);
  assert.doesNotMatch(r.warningsList.join('\n'), /falta regla prefers-reduced-motion/);

  // Un estado final SOLO en @media print no rescata al bloque reduced-motion:
  // aunque se duplique ahí, el bloque reduced-motion sigue siendo el que decide.
  const duplicadoEnPrint = soloEnPrint.replace(
    '@media print{@page{size:A4;margin:14mm}',
    '@media print{@page{size:A4;margin:14mm}html.js [data-reveal],html.js [data-grow]{opacity:1!important;transform:none!important}',
  );
  const igual = run(duplicadoEnPrint);
  assert.equal(igual.code, 1);
  assert.match(igual.warningsList.join('\n'), /el estado final de los elementos data-\*/);

  // Con el estado final dentro del bloque reduced-motion, el mismo HTML pasa limpio.
  const ok = run(informe());
  assert.equal(ok.code, 0);
  assert.doesNotMatch(ok.warningsList.join('\n'), /estado final de los elementos data-\*/);
});

test('C6: transition:all y scale(0) en entradas son warnings', () => {
  const r = run(informe({ css: 'html.js:not(.no-anim) [data-grow]{transform:scaleY(0)}.q{transition:all .3s}' }));
  const avisos = r.warningsList.join('\n');
  assert.match(avisos, /transition:all/);
  assert.match(avisos, /Entradas con scale\(0\)/);
});

test('C6: el subrayado decorativo de hover con scaleX(0) no es una entrada', () => {
  const r = run(informe({ css: '.toc a::after{transform:scaleX(0);transform-origin:left}' }));
  assert.equal(r.passed, true, r.warningsList.join('\n'));
});

test('C7: falta de :focus-visible, tabindex positivo y outline:none son warnings', () => {
  const sinFoco = run(informe().replace(/:focus-visible\{[^}]*\}/, ''));
  assert.match(sinFoco.warningsList.join('\n'), /falta una regla :focus-visible/);

  const positivo = run(informe({ main: '<p tabindex="3">Orden roto</p>' }));
  assert.match(positivo.warningsList.join('\n'), /tabindex positivo/);

  const sinOutline = run(informe({ css: '.q:focus{outline:none}' }));
  assert.match(sinOutline.warningsList.join('\n'), /outline:none/);
});

test('C7: debe existir exactamente un <main> y un <h1> con contenido', () => {
  const dosMain = run(informe({ main: '<main id="otro">Segundo main</main>' }));
  assert.match(dosMain.warningsList.join('\n'), /exactamente un <main> \(hay 2\)/);

  const sinH1 = run(informe().replace('<h1>Informe de prueba</h1>', ''));
  assert.match(sinH1.warningsList.join('\n'), /exactamente un <h1> con contenido/);
});

test('C7: cada <nav> necesita nombre accesible', () => {
  const r = run(informe().replace(' aria-label="Barra superior"', ''));
  assert.match(r.warningsList.join('\n'), /<nav> necesita aria-label/);
});

test('C8: el skip link debe apuntar al main y tener texto', () => {
  const sinTexto = run(informe().replace('>Saltar al contenido principal<', '><'));
  assert.match(sinTexto.warningsList.join('\n'), /href="#id" y texto o aria-label/);

  const malHref = run(informe().replace('href="#contenido"', 'href="#otro"'));
  assert.match(malHref.warningsList.join('\n'), /no coincide con el id de <main>/);

  const sinTabindex = run(informe().replace(' tabindex="-1"', ''));
  assert.match(sinTabindex.warningsList.join('\n'), /necesita tabindex="-1"/);

  const sinSkip = run(informe().replace(/<a class="skip-link"[\s\S]*?<\/a>\n/, ''));
  assert.match(sinSkip.warningsList.join('\n'), /Falta un skip link/);
});

test('C9: cada SVG sin marcar genera un único aviso, nunca dos', () => {
  const r = run(informe({ main: ICONO.replace(' aria-hidden="true" focusable="false"', '') }));
  const sobreIcono = r.warningsList.filter((w) => /\.icon\b|SVG decorativo|sin nombre accesible/.test(w));
  assert.equal(sobreIcono.length, 1, r.warningsList.join('\n'));
  assert.match(sobreIcono[0], /^1 icono\(s\) \.icon/);
});

test('C9: un icono oculto sin focusable="false" es un aviso aparte', () => {
  const r = run(informe({ main: ICONO.replace(' focusable="false"', '') }));
  const avisos = r.warningsList.join('\n');
  assert.doesNotMatch(avisos, /sin aria-hidden/);
  assert.match(avisos, /1 icono\(s\) \.icon sin focusable="false"/);
});

test('C9: role="img" junto a aria-hidden="true" es contradictorio', () => {
  const r = run(informe({ main: '<svg role="img" aria-hidden="true" aria-label="Doble"></svg>' }));
  assert.match(r.warningsList.join('\n'), /role="img" y aria-hidden="true" a la vez/);
});

test('C9: un SVG decorativo ya oculto ni entra en el recuento', () => {
  const r = run(informe({ main: ICONO }));
  assert.doesNotMatch(r.warningsList.join('\n'), /SVG decorativo/);
  assert.doesNotMatch(r.warningsList.join('\n'), /sin nombre accesible/);
});

test('C10: una <img> sin width/height o sin alt es warning', () => {
  const sinDim = run(informe().replace(' alt="Acme" width="60" height="40"', ' alt="Acme"'));
  assert.match(sinDim.warningsList.join('\n'), /no declara width\/height intrínsecos/);

  const sinAlt = run(informe().replace(' alt="Acme"', ''));
  assert.match(sinAlt.warningsList.join('\n'), /no tiene atributo alt/);
});

test('C11: overflow-wrap y text-wrap son obligatorios', () => {
  const r = run(informe().replace('overflow-wrap:anywhere;text-wrap:pretty', '').replace('text-wrap:balance', ''));
  const avisos = r.warningsList.join('\n');
  assert.match(avisos, /Falta overflow-wrap/);
  assert.match(avisos, /Falta text-wrap/);
});

test('C11: overflow-x:hidden en html/body es warning', () => {
  const r = run(informe({ css: 'html{overflow-x:hidden}' }));
  assert.match(r.warningsList.join('\n'), /overflow-x:hidden/);
});

test('C12: con position:sticky hace falta scroll-padding-top o scroll-margin-top', () => {
  const r = run(informe().replace(';scroll-padding-top:88px', '').replace('main[id],section[id]{scroll-margin-top:88px}', ''));
  assert.match(r.warningsList.join('\n'), /position:sticky pero falta scroll-padding-top/);
});

test('C12: un ancla interna rota y un id duplicado son warnings', () => {
  const r = run(informe({ main: '<p><a href="#no-existe">Roto</a></p><span id="s1">Duplicado</span>' }));
  const avisos = r.warningsList.join('\n');
  assert.match(avisos, /Anclas internas rotas: no-existe/);
  assert.match(avisos, /id duplicado\(s\): s1/);
});

test('C13: color-scheme, theme-color y su coherencia en CSS son warnings', () => {
  const sinMetas = run(informe().replace(/<meta name="color-scheme"[^>]*>\n/, '').replace(/<meta name="theme-color"[^>]*>\n/, ''));
  const avisos = sinMetas.warningsList.join('\n');
  assert.match(avisos, /Falta <meta name="color-scheme"/);
  assert.match(avisos, /Falta <meta name="theme-color">/);

  const sinCss = run(informe().replace('color-scheme:light;', ''));
  assert.match(sinCss.warningsList.join('\n'), /Falta color-scheme en CSS/);

  const placeholder = run(informe().replace('content="#f6f8fb"', 'content="{{COLOR_FONDO}}"'));
  assert.match(placeholder.warningsList.join('\n'), /color de fondo real/);
});

test('C13: el modo oscuro necesita color-scheme:dark en su bloque CSS', () => {
  const oscuro = run(informe({ head: '<meta name="color-scheme" content="dark">', main: '<div data-theme="dark">x</div>' }));
  assert.match(oscuro.warningsList.join('\n'), /El modo oscuro necesita color-scheme:dark/);

  const oscuroOk = run(informe({
    css: '[data-theme="dark"]{color-scheme:dark;--bg:#0b1220}',
    main: '<div data-theme="dark">x</div>',
  }));
  assert.doesNotMatch(oscuroOk.warningsList.join('\n'), /modo oscuro/);
});

test('un <title> con placeholder sin sustituir es warning', () => {
  const r = run(informe().replace('<title>Informe de prueba</title>', '<title>{{TITULO}}</title>'));
  assert.match(r.warningsList.join('\n'), /<title> vacío o con placeholder/);
});

// ===== Cobertura de la auditoría: checks que ya cazaron regresiones reales =====

test('A1/C10: <img srcset> y <image xlink:href> se inspeccionan', () => {
  // srcset se rechaza en bloque: la coma de `data:...;base64,` haría imposible
  // separar candidatas sin análisis completo de URI.
  const srcset = run(informe({ main: '<img src="data:image/png;base64,iVBORw0KGgo=" srcset="data:image/png;base64,iVBORw0KGgo= 1x" alt="x" width="4" height="4">' }));
  assert.match(srcset.warningsList.join('\n'), /srcset/);

  // Una URL externa dentro del srcset sigue siendo blocker de A1.
  const externo = run(informe({ main: '<img src="data:image/png;base64,iVBORw0KGgo=" srcset="https://cdn.example/x.png 2x" alt="x" width="4" height="4">' }));
  assert.match(externo.blockersList.join('\n'), /cdn\.example/);

  const xlink = run(informe({ main: '<svg viewBox="0 0 4 4" role="img" aria-label="x"><image xlink:href="logo.png" width="4" height="4"></svg>' }));
  assert.match(xlink.blockersList.join('\n'), /xlink:href|<image> no embebida/);

  const limpio = run(informe({ main: '<img src="data:image/png;base64,iVBORw0KGgo=" alt="x" width="4" height="4">' }));
  assert.equal(limpio.blockers, 0, limpio.blockersList.join('\n'));
  assert.equal(limpio.designIssues, 0, limpio.warningsList.join('\n'));
});

test('A1/C10: una <img> no embebida se reporta una sola vez (A1 es el dueño)', () => {
  const r = run(informe({ main: '<img src="logo.png" alt="x" width="4" height="4">' }));
  const sobreImg = r.blockersList.filter((b) => /logo\.png/.test(b));
  assert.equal(sobreImg.length, 1, r.blockersList.join('\n'));
});

test('C5: las <section> anidadas se emparejan por pila, no por el primer cierre', () => {
  // El <section> externo tiene texto propio: solo el interno quedaría vacío.
  const r = run(informe({ main: '<section id="ext"><h2>Sección</h2><p>Texto suficiente en la sección externa.</p><section id="int"></section></section>' }));
  assert.match(r.warningsList.join('\n'), /1 sección\(es\) sin contenido sustancial/);
});

test('C6: el bloque print se recorta por el siguiente @media, no por el primero', () => {
  // El único estado final está en prefers-reduced-motion: print no lo fuerza.
  const r = run(informe().replace('  html.js [data-reveal]{opacity:1!important;transform:none!important}}', '  .card{color:#111}}'));
  assert.match(r.warningsList.join('\n'), /El bloque print no fuerza el estado final/);
  // El mismo informe con el estado final en print pasa limpio.
  const bien = run(informe());
  assert.doesNotMatch(bien.warningsList.join('\n'), /El bloque print no fuerza/);
});

test('C6: el estado inicial oculto de los data-* debe ir gated por html.js', () => {
  const sinGate = run(informe({ css: '[data-reveal]{opacity:0;transform:translateY(16px)}\n[data-reveal].in{opacity:1;transform:none}' }));
  assert.match(sinGate.warningsList.join('\n'), /gating `html\.js`/);

  const conGate = run(informe({ css: 'body.js [data-grow]{opacity:0}' }));
  assert.doesNotMatch(conGate.warningsList.join('\n'), /gating `html\.js`/);

  // `.no-js` / `.json` no son la clase `js`: no sirven de gate.
  const falso = run(informe({ css: 'html.no-js [data-reveal]{opacity:0}' }));
  assert.match(falso.warningsList.join('\n'), /gating `html\.js`/);
});

test('C7: los saltos en la jerarquía de encabezados son warning', () => {
  const salto = run(informe({ main: '<section id="s2"><h2>Sección</h2><h4>Subtítulo demasiado profundo</h4></section>' }));
  assert.match(salto.warningsList.join('\n'), /Jerarquía de encabezados|Salto\(s\)/);

  const correcto = run(informe({ main: '<section id="s2"><h2>Sección</h2><h3>Subtítulo</h3><h4>Detalle</h4></section>' }));
  assert.doesNotMatch(correcto.warningsList.join('\n'), /Salto\(s\)/);
});

test('C7: aria-label="" no nombra un <nav>; :focus:not(:focus-visible) sí es legítimo', () => {
  const vacio = run(informe().replace(' aria-label="Índice"', ' aria-label=""'));
  assert.match(vacio.warningsList.join('\n'), /<nav> necesita aria-label/);

  const legitimo = run(informe({ css: '.x:focus:not(:focus-visible){outline:none}' }));
  assert.doesNotMatch(legitimo.warningsList.join('\n'), /outline:none/);
});

test('C9: el nombre accesible del SVG se cuenta una sola vez y exige focusable="false"', () => {
  const sinNombre = run(informe({ main: '<figure class="chart"><svg viewBox="0 0 4 4"><rect x="1" y="1" width="2" height="2"></rect></svg><figcaption>Lectura: datos</figcaption></figure>' }));
  const sobreSvg = sinNombre.warningsList.filter((w) => /sin nombre accesible/.test(w));
  assert.equal(sobreSvg.length, 1, sinNombre.warningsList.join('\n'));
});

test('C11: un solo .table-wrap puede cubrir varias tablas', () => {
  const dosEnUna = run(informe({
    css: '.table-wrap{overflow-x:auto}',
    main: '<div class="table-wrap"><table class="table"><caption>a</caption><tr><td>1</td></tr></table>'
      + '<table class="table"><caption>b</caption><tr><td>2</td></tr></table></div>',
  }));
  assert.doesNotMatch(dosEnUna.warningsList.join('\n'), /table-wrap/);

  const sinCss = run(informe({ main: '<div class="table-wrap"><table class="table"><caption>a</caption><tr><td>1</td></tr></table></div>' }));
  assert.match(sinCss.warningsList.join('\n'), /faltan contenedores \.table-wrap/);

  const sinWrap = run(informe({ css: '.table-wrap{overflow-x:auto}', main: '<table class="table"><caption>a</caption><tr><td>1</td></tr></table>' }));
  assert.match(sinWrap.warningsList.join('\n'), /faltan contenedores \.table-wrap/);
});

test('C12: basta UNA declaración de scroll offset válida', () => {
  const r = run(informe().replace('html{scroll-behavior:smooth;scroll-padding-top:88px}', 'html{scroll-behavior:smooth;scroll-padding-top:0}'));
  assert.doesNotMatch(r.warningsList.join('\n'), /position:sticky pero falta/);

  const ninguna = run(informe().replace(';scroll-padding-top:88px', '').replace('main[id],section[id]{scroll-margin-top:88px}', ''));
  assert.match(ninguna.warningsList.join('\n'), /position:sticky pero falta/);
});

test('C13: los metas se resuelven por atributo, no por orden', () => {
  const invertido = run(informe().replace(
    '<meta name="color-scheme" content="light">\n<meta name="theme-color" content="#f6f8fb">',
    '<meta content="light" name="color-scheme">\n<meta content="#f6f8fb" name="theme-color">',
  ));
  assert.doesNotMatch(invertido.warningsList.join('\n'), /Falta <meta name="color-scheme"|Falta <meta name="theme-color"/);

  const sinRoot = run(informe().replace(':root{color-scheme:light;', ':root{'));
  assert.match(sinRoot.warningsList.join('\n'), /Falta color-scheme en CSS/);
});


// ---------- C14: la paleta vive en los tokens ----------

test('C14: un gris repetido por la hoja bloquea, aunque salga en dos reglas', () => {
  // El caso real: #f1f5f9 en el fondo de th, en el hover de fila, en el pie de
  // tabla y en el hover del indice. Es un token disfrazado de decision local.
  const r = run(informe({ css: '.card{background:#f1f5f9}\n.note{background:#f1f5f9}' }));
  assert.match(r.blockersList.join('\n'), /C14/);
  assert.match(r.blockersList.join('\n'), /#f1f5f9/);
  // Una sola vez: el aviso cuenta colores unicos, no apariciones.
  assert.equal(r.blockersList.filter((b) => /C14/.test(b)).length, 1, r.blockersList.join('\n'));
});

test('C14: el color de una paleta si se escribe literal, pero en su token', () => {
  // La zona exenta son las DECLARACIONES `--x: valor`: sin ellas ninguna paleta
  // se podria escribir, y un bloque `[data-theme="dark"]` contaria como falta.
  const conToken = run(informe({ css: ':root{--card:#f1f5f9}\n.card{background:var(--card)}' }));
  assert.doesNotMatch(conToken.blockersList.join('\n'), /C14/);
  assert.equal(conToken.blockers, 0, conToken.blockersList.join('\n'));

  const porAtributo = run(informe({ css: '[data-theme="dark"]{--bg:#0f172a}\n.card{background:var(--bg)}' }));
  assert.doesNotMatch(porAtributo.blockersList.join('\n'), /C14/);
});

test('C14: los neutros puros quedan exentos (el blanco ES el token)', () => {
  // Sobre un hero o un acento, escribir el blanco a mano es lo correcto.
  const r = run(informe({
    css: '.hero{background:#000}\n.hero .logo{color:#fff}\n.card{border-color:#000000}\n.hl{color:#ffffff}',
  }));
  assert.doesNotMatch(r.blockersList.join('\n'), /C14/, r.blockersList.join('\n'));
  // En cambio un gris de la paleta no es un neutro: bloquea aunque se parezca.
  const gris = run(informe({ css: '.hero{color:#6b7280}' }));
  assert.match(gris.blockersList.join('\n'), /#6b7280/);
});

test('C14: no confunde un id que parece color ni un comentario que no se pinta', () => {
  const idSelector = run(informe({ css: '#face{color:inherit}' }));
  assert.doesNotMatch(idSelector.blockersList.join('\n'), /C14/, idSelector.blockersList.join('\n'));

  const comentario = run(informe({ css: '/* el gris del encabezado era #f1f5f9 */\n.card{border:0}' }));
  assert.doesNotMatch(comentario.blockersList.join('\n'), /C14/, comentario.blockersList.join('\n'));
});

test('C14: la zona exenta cubre declaraciones pegadas y seguidas al separador', () => {
  // La zona exenta se ancla al separador previo (`^`, `;`, `{`). El fallo que
  // evita es sutil: si el grupo no captura, el `$1` de la sustitucion se
  // convierte en la palabra "undefined" pegada al texto, la declaracion de
  // :root deja de borrarse y la paleta entera se reporta como color suelto.
  const pegadas = run(informe({ css: '.card{--a:#ff0000;--b:#00ff00;border:0}' }));
  assert.doesNotMatch(pegadas.blockersList.join('\n'), /C14/, pegadas.blockersList.join('\n'));
  assert.equal(pegadas.blockers, 0, pegadas.blockersList.join('\n'));

  // Un literal dentro de var() SI es una decision (es un fallback, no un token),
  // asi que se reporta: el borrado no debe arrastrarselo.
  const fallback = run(informe({ css: '.card{background:var(--z,#f1f5f9)}' }));
  assert.match(fallback.blockersList.join('\n'), /#f1f5f9/, fallback.blockersList.join('\n'));
});

test('C14: el color de <meta name="theme-color"> no se mira a proposito', () => {
  // Lo rellena la paleta y en un informe ya es el fondo real, no una decision de
  // estilo: exigir un token ahi obligaria a duplicar el fondo del :root.
  const r = run(informe().replace('<meta name="theme-color" content="#f6f8fb">', '<meta name="theme-color" content="#1e3a8a">'));
  assert.doesNotMatch(r.blockersList.join('\n'), /C14/, r.blockersList.join('\n'));
  assert.doesNotMatch(r.warningsList.join('\n'), /C14/, r.warningsList.join('\n'));
});

test('C14: en atributos de presentacion el literal avisa pero no bloquea', () => {
  const serie = (attrs) => `<figure class="chart">
  <svg viewBox="0 0 600 200" role="img" aria-label="Serie por mes">${attrs}</svg>
  <figcaption class="chart-caption"><strong>Lectura:</strong> crece cada mes.</figcaption>
</figure>`;

  // Un `fill="#6b7280"` fija en el SVG el gris de un token y rompe el "mismo
  // color = misma serie" en cuanto se cambia de paleta. Avisa, pero el SVG a
  // veces necesita el color tal cual, asi que no bloquea.
  const gris = run(informe({ main: serie('<rect x="10" y="10" width="100" height="80" fill="#6b7280"></rect>') }));
  assert.match(gris.warningsList.join('\n'), /C14/);
  assert.match(gris.warningsList.join('\n'), /#6b7280/);
  assert.doesNotMatch(gris.blockersList.join('\n'), /C14/);

  // El blanco sobre un acento es legitimo: no avisa.
  const blanco = run(informe({ main: serie('<rect x="10" y="10" width="100" height="80" fill="#ffffff"></rect>') }));
  assert.doesNotMatch(blanco.warningsList.join('\n'), /C14/, blanco.warningsList.join('\n'));

  // Con token no hay ni aviso.
  const conToken = run(informe({ main: serie('<rect x="10" y="10" width="100" height="80" fill="var(--muted)"></rect>') }));
  assert.doesNotMatch(conToken.warningsList.join('\n'), /C14/, conToken.warningsList.join('\n'));

  // Un style="" en linea tambien entra en el barrido, y un token declarado
  // dentro de el si se respeta: definir `--x` ahi es una paleta local legitima.
  const enLinea = run(informe({ main: '<div style="fill:#ff8800">x</div>' }));
  assert.match(enLinea.warningsList.join('\n'), /#ff8800/);
  const tokenEnLinea = run(informe({ main: '<div style="--c:#ff8800">x</div>' }));
  assert.doesNotMatch(tokenEnLinea.warningsList.join('\n'), /C14/, tokenEnLinea.warningsList.join('\n'));
});

// ---------- C6: data-hero y data-rule ----------

test('C6: data-hero y data-rule exigen estado final, como los demas', () => {
  // Un portada que se abre con opacidad 0 se queda en blanco para quien pide
  // menos movimiento, que es justo a quien no le va a cerrar la transicion.
  const sinEstado = run(informe({ main: '<div data-hero>Portada</div>' })
    .replace(/html\.js \[data-reveal\][\s\S]*?stroke-dashoffset:0!important\}/, ''));
  assert.match(sinEstado.warningsList.join('\n'), /no fija el estado final/);

  // Con el estado final presente pasa limpio.
  const conEstado = run(informe({ main: '<div data-hero>Portada</div>' }));
  assert.doesNotMatch(conEstado.warningsList.join('\n'), /no fija el estado final/);
});

test('C6: el estado inicial oculto de data-hero tambien va gated por html.js', () => {
  const sinGate = run(informe({ css: '[data-hero]{opacity:0}', main: '<div data-hero>Portada</div>' }));
  assert.match(sinGate.warningsList.join('\n'), /gating `html\.js`/);

  const conGate = run(informe({
    css: 'html.js:not(.no-anim) [data-hero]{opacity:0}\nhtml.js:not(.no-anim) [data-hero].in{opacity:1}',
    main: '<div data-hero>Portada</div>',
  }));
  assert.doesNotMatch(conGate.warningsList.join('\n'), /gating `html\.js`/);
});

test('C6: data-rule usa una escala no singular', () => {
  // scaleX(0) es una singularidad: no se puede deshacer y provoke CLS. La regla
  // arranca en .01, que es visualmente el mismo cero pero reversible.
  const singular = run(informe({
    css: 'html.js:not(.no-anim) [data-rule]{transform:scaleX(0)}',
    main: '<i class="rule" data-rule></i>',
  }));
  assert.match(singular.warningsList.join('\n'), /scale\(0\)/);

  const ok = run(informe({
    css: 'html.js:not(.no-anim) [data-rule]{transform:scaleX(.01)}\nhtml.js:not(.no-anim) [data-rule].in{transform:scaleX(1)}',
    main: '<i class="rule" data-rule></i>',
  }));
  assert.doesNotMatch(ok.warningsList.join('\n'), /scale\(0\)/);
});

test('C6: la plantilla, el motor y el validador conocen los mismos data-*', () => {
  // Una sola fuente de verdad: si se anade un atributo al motor y no a la
  // plantilla, el informe animara con un estado inicial que la hoja no define.
  const plantilla = join(RAIZ_SKILL, 'assets', 'plantilla-base.html');
  const motor = join(RAIZ_SKILL, 'assets', 'motion.min.js');
  if (!existsSync(plantilla) || !existsSync(motor)) return; // copia aislada
  const validador = readFileSync(VALIDADOR, 'utf8');
  const attrs = validador.match(/MOTION_ATTRS\s*=\s*'([^']+)'/)[1].split('|');
  const states = validador.match(/MOTION_STATES\s*=\s*'([^']+)'/)[1].split('|');
  const css = readFileSync(plantilla, 'utf8');
  const js = readFileSync(motor, 'utf8');
  assert.ok(attrs.length >= 10, `MOTION_ATTRS solo conoce ${attrs.length} atributos`);
  assert.ok(states.length >= 8, `MOTION_STATES solo conoce ${states.length} atributos`);
  for (const a of states) {
    assert.ok(attrs.includes(a), `data-${a} fuerza estado final pero no esta en MOTION_ATTRS`);
    assert.match(css, new RegExp(`data-${a}`), `plantilla-base.html sin data-${a}`);
    assert.match(js, new RegExp(`data-${a}`), `motion.min.js sin data-${a}`);
  }

  // Y lo que de verdad importa: en el esqueleto, cada atributo que deja el
  // elemento oculto tiene que quedar en su estado final tanto con movimiento
  // reducido como al imprimir. Si no, la portada se abre en blanco en PDF.
  const mediaBlock = (hoja, re) => {
    const m = hoja.match(re);
    if (!m) return null;
    const resto = hoja.slice(m.index + m[0].length);
    const sig = resto.search(/@media\b/);
    return sig < 0 ? resto : resto.slice(0, sig);
  };
  const reduced = mediaBlock(css, /@media\s*\(\s*prefers-reduced-motion/);
  const print = mediaBlock(css, /@media\s*print\b/);
  assert.ok(reduced, 'la plantilla no tiene bloque prefers-reduced-motion');
  assert.ok(print, 'la plantilla no tiene bloque print');
  for (const a of states) {
    assert.match(reduced, new RegExp(`data-${a}`), `reduced-motion de la plantilla sin data-${a}`);
    assert.match(print, new RegExp(`data-${a}`), `print de la plantilla sin data-${a}`);
  }
});

test('C6: el estado de lectura no se arregla con CSS, lo pone el motor', () => {
  // `aria-current` lo escribe el scroll-spy en runtime, asi que no puede haber
  // un check que lo exija en el HTML. Lo que si se fija es que el motor lo haga,
  // y que el estilo de la fila activa exista (si no, el estado seria invisible).
  const motor = join(RAIZ_SKILL, 'assets', 'motion.min.js');
  if (!existsSync(motor)) return; // copia aislada
  const js = readFileSync(motor, 'utf8');
  assert.match(js, /setAttribute\('aria-current'/, 'el motor no marca la entrada activa del indice');
  assert.match(js, /\.read-progress i/, 'el motor no mueve la barra de progreso');
  const plantilla = readFileSync(join(RAIZ_SKILL, 'assets', 'plantilla-base.html'), 'utf8');
  assert.match(plantilla, /\.toc a\[aria-current="true"\]/, 'sin estilo, el estado activo no se ve');
  assert.match(plantilla, /<div class="read-progress"/, 'la barra de progreso no esta en la plantilla');
});

test('C6: el estado de lectura se recalcula aunque no haya evento de scroll', () => {
  // Abrir el informe en un ancla, recargar con la posicion restaurada o volver
  // desde la cache del navegador deja la pagina desplazada SIN evento de scroll.
  // Sin estos tres oyentes la barra se queda en cero y el indice sin marcar
  // hasta que el visitante mueva la rueda.
  const motor = join(RAIZ_SKILL, 'assets', 'motion.min.js');
  if (!existsSync(motor)) return; // copia aislada
  const js = readFileSync(motor, 'utf8');
  for (const ev of ['load', 'hashchange', 'pageshow']) {
    assert.match(js, new RegExp(`addEventListener\\('${ev}', update\\)`),
      `el motor no recalcula el estado de lectura en "${ev}"`);
  }
  // Y de forma sincrona: colgarlo de un frame que puede no llegar congelaria la
  // barra en cero. Por eso van a `update` y no a `schedule`.
  assert.doesNotMatch(js, /addEventListener\('(?:load|hashchange|pageshow)', schedule\)/,
    'el estado de lectura no debe depender de un frame para estos tres casos');
});


// ---------- C1: los tokens de acento tambien se miden ----------

// La cuota que se coló en los tres informes: 38% de --text. Contra el blanco
// daba 4.20:1 en el ambar, que casi pasa, pero contra la superficie TINTADA
// (--head-bg, --zebra) baja a 3.81:1. Como el badge vive sobre la tintada, ese
// era el contraste real, y por debajo de AA.
const conCuota = (cuota) => TOKENS_ACCENTO.replace('var(--text) 50%,var(--accent));\n  --accent-ink', `var(--text) ${cuota}%,var(--accent));\n  --accent-ink`);

test('C1: un --accent-text por debajo de 4.5:1 es warning, aunque el hex sea correcto', () => {
  // El fallo que de verdad se cuela: nadie ve el hex, solo el token. Bajar la
  // cuota del color-mix no rompe nada visible hasta que el informe se imprime.
  const r = run(informe({ tokens: conCuota(38), css: '.badge.primary{color:var(--accent-text)}' }));
  assert.match(r.warningsList.join('\n'), /--accent-text/);
  assert.match(r.warningsList.join('\n'), /4\.5:1/);
  // Y nombra las series concretas que no llegan, no un "algún color falla".
  assert.match(r.warningsList.join('\n'), /chart-3/);
  assert.match(r.warningsList.join('\n'), /chart-4/);
  assert.match(r.warningsList.join('\n'), /chart-7/);
  // Sin el acento no hay warning por C1 aunque el resto siga limpio.
  assert.equal(r.blockers, 0, r.blockersList.join('\n'));
});

test('C1: las cuotas del skeleton cumplen, y el check lo dice', () => {
  const r = run(informe({ css: '.badge.primary{color:var(--accent-text)}\n.h2wrap::before{background:var(--accent-line)}' }));
  assert.equal(r.warningsList.length, 0, r.warningsList.join('\n'));
  assert.equal(r.passed, true);
  const ok = r.positives.join('\n');
  assert.match(ok, /--accent-text \(50% de --text\) cumple 4\.5:1 como texto/);
  assert.match(ok, /--accent-line \(30% de --text\) cumple 3:1 como cromo/);
});

test('C1: el acento se mide contra la superficie tintada, no solo contra el blanco', () => {
  // Al 42% el ambar pasa contra blanco (4.57:1) y falla contra el --head-bg
  // (4.08:1). Si el check mirara solo el blanco, este caso pasaria. Es
  // justamente donde se pinta el badge, asi que el blanco no es la referencia.
  const r = run(informe({ tokens: conCuota(42) }));
  assert.match(r.warningsList.join('\n'), /--accent-text/);
  assert.match(r.warningsList.join('\n'), /chart-3/);
  // Y con la cuota buena, el mismo caso no dice nada.
  const ok = run(informe({ tokens: conCuota(50) }));
  assert.doesNotMatch(ok.warningsList.join('\n'), /--accent-text/);
});

test('C1: un --accent-line por debajo de 3:1 es warning', () => {
  // El cromo no es texto: el umbral es 3:1, no 4.5:1. Aun asi, al 10% el ambar
  // se pierde sobre el fondo, y un filete que no se ve no puede ser la identidad
  // de color de la seccion.
  const pocos = TOKENS_ACCENTO.replace('var(--text) 30%,var(--accent))', 'var(--text) 10%,var(--accent))');
  const r = run(informe({ tokens: pocos }));
  assert.match(r.warningsList.join('\n'), /--accent-line/);
  assert.match(r.warningsList.join('\n'), /3:1/);
  // Con 30% no dice nada: es el minimo medido para el cromo.
  const ok = run(informe());
  assert.doesNotMatch(ok.warningsList.join('\n'), /--accent-line/);
});

test('C1: sin paleta de series el check no inventa un fallo', () => {
  // Un informe que no usa data-accent no tiene por que declarar --chart-1..7.
  // El check se calla en vez de quejarse de un color que no ha medido.
  const sinPaleta = TOKENS_ACCENTO.replace(/--chart-\d:[^;]+;\s*/g, '');
  const r = run(informe({ tokens: sinPaleta }));
  assert.doesNotMatch(r.warningsList.join('\n'), /--accent/, r.warningsList.join('\n'));
  assert.doesNotMatch(r.positives.join('\n'), /--accent-line/);
});

test('C1: si la cuota no es legible, el check se calla en vez de inventar', () => {
  // Tres formas de escribir el token que este check NO sabe medir, porque solo
  // lee el patron `color-mix(in srgb, var(--text) N%, ...)`. En las tres lo
  // correcto es no decir nada: ni un 0:1 inventado, ni un "cumple" que no ha
  // medido. La limitation es del check, y se documenta en la referencia.
  const variantes = [
    ['hex fijo', '--accent-text:#f59e0b'],
    ['oklab en vez de srgb', '--accent-text:color-mix(in oklab,var(--text) 50%,var(--accent))'],
    ['el acento primero, el texto segundo', '--accent-text:color-mix(in srgb,var(--accent) 50%,var(--text))'],
    ['cuota con decimales y separadores raros', '--accent-text:color-mix(in srgb,var(--text) 50.0%,var(--accent))'],
  ];
  for (const [nombre, decl] of variantes) {
    const r = run(informe({ tokens: TOKENS_ACCENTO.replace('--accent-text:color-mix(in srgb,var(--text) 50%,var(--accent))', decl) }));
    const ruido = r.warningsList.concat(r.positives).filter((m) => /--accent-text/.test(m));
    assert.deepEqual(ruido, [], `${nombre}: el check no deberia hablar de lo que no midio (${JSON.stringify(ruido)})`);
  }
  // Con la forma que si sabe leer, sigue hablando. Si esto callara, el silencio
  // de arriba no valdria nada.
  const ok = run(informe());
  assert.match(ok.positives.join('\n'), /--accent-text \(50% de --text\) cumple 4\.5:1/);
});


// ---------- C15: el acento derivado tiene que seguir a la seccion ----------

// El mapa por atributo, tal como lo escribe la plantilla.
const MAPA_ACCENTO = '[data-accent="1"]{--accent:var(--chart-1)}[data-accent="2"]{--accent:var(--chart-2)}';
// El recalculo de los tres derivados, en el mismo elemento que remapea.
const RECALCULO_ACENTO = '[data-accent]{--accent-line:color-mix(in srgb,var(--text) 30%,var(--accent));--accent-text:color-mix(in srgb,var(--text) 50%,var(--accent));--accent-ink:color-mix(in srgb,var(--text) 68%,var(--accent))}';

test('C15: el acento derivado se recalcula donde se remapea', () => {
  const r = run(informe({ css: MAPA_ACCENTO + RECALCULO_ACENTO, main: '<section data-accent="3"><h2>Bloque C</h2><p>Texto suficiente en la seccion para que C5 no la de por vacia.</p></section>' }));
  assert.equal(r.warningsList.length, 0, r.warningsList.join('\n'));
  assert.match(r.positives.join('\n'), /C15: los tokens derivados del acento se recalculan/);
});

test('C15: sin el recalculo avisa, porque el derivado se congela en :root', () => {
  // El defecto exacto que se colo en los tres informes. Una custom property
  // sustituye sus var() donde se DECLARA: --accent-text escrita en :root se
  // resuelve una vez contra --primary y ese color concreto hereda a toda la
  // pagina. El fondo del badge, en cambio, si sigue a la seccion, porque su
  // color-mix se evalua en el propio elemento. Resultado: el fondo cambia y el
  // texto no, y parece un descuido de estilo en vez de un error.
  const r = run(informe({ css: MAPA_ACCENTO, main: '<section data-accent="3"><h2>Bloque C</h2><p>Texto suficiente en la seccion para que C5 no la de por vacia.</p></section>' }));
  const w = r.warningsList.join('\n');
  assert.match(w, /C15/);
  assert.match(w, /--accent-line/);
  assert.match(w, /--accent-text/);
  assert.match(w, /--accent-ink/);
  // Y explica por que importa, no solo que falta.
  assert.match(w, /--primary/);
  // Sigue siendo aviso, no bloqueo: el informe se lee igual, solo pierde el acento.
  assert.equal(r.blockers, 0, r.blockersList.join('\n'));
});

test('C15: el aviso nombra solo lo que falta, no los tres', () => {
  // Si alguien declara solo --accent-text y --accent-ink (que son los que se ven
  // en pantalla), el filete se quedaria en el primario y el aviso tiene que seguir.
  const parcial = '[data-accent]{--accent-text:color-mix(in srgb,var(--text) 50%,var(--accent));--accent-ink:color-mix(in srgb,var(--text) 68%,var(--accent))}';
  const r = run(informe({ css: MAPA_ACCENTO + parcial }));
  assert.match(r.warningsList.join('\n'), /--accent-line/);
  assert.doesNotMatch(r.warningsList.join('\n'), /--accent-text,/);
  assert.doesNotMatch(r.warningsList.join('\n'), /--accent-ink/);
});

test('C15: un informe que no usa data-accent no recibe el aviso', () => {
  // Sin remapeo por atributo no hay nada que recalcular: el acento sale de
  // :root y es coherente por construccion.
  const r = run(informe());
  assert.doesNotMatch(r.warningsList.join('\n'), /C15/);
  assert.doesNotMatch(r.positives.join('\n'), /C15/);
});

test('C15: el recalculo cuenta con un selector mas especifico', () => {
  // `[data-accent="3"]` recalculando los tres tambien vale: lo que importa es que
  // se recalcule en el elemento que remapea, no la forma exacta del selector.
  const r = run(informe({ css: MAPA_ACCENTO + '[data-accent="3"]{' + RECALCULO_ACENTO.slice(RECALCULO_ACENTO.indexOf('{') + 1) }));
  assert.doesNotMatch(r.warningsList.join('\n'), /C15/);
});

test('C15: un comentario que mencione el patron no cuenta como recalculo', () => {
  // El fallo se cuela justo al reescribir: alguien "arregla" el CSS dejando
  // comentada la regla, y el texto sigue hablando de [data-accent].
  const comentado = '/* antes esto iba aqui: ' + RECALCULO_ACENTO + ' */';
  const r = run(informe({ css: MAPA_ACCENTO + comentado }));
  assert.match(r.warningsList.join('\n'), /C15/);
});

test('regresión: los tres informes de referencia pasan --strict con código 0', (t) => {
  const informes = [
    'informe-consulta-revista-cta.html',
    'informe-requerimientos-gdais.html',
    'informe-restauracion-otinteiro.html',
  ];
  const faltan = informes.filter((f) => !existsSync(join(RAIZ, f)));
  if (faltan.length) return t.skip(`informes no presentes: ${faltan.join(', ')}`);
  for (const nombre of informes) {
    const r = run(readFileSync(join(RAIZ, nombre), 'utf8'));
    assert.equal(r.code, 0, `${nombre}\n${r.blockersList.concat(r.warningsList).join('\n')}`);
    assert.equal(r.blockers, 0, nombre);
    assert.equal(r.designIssues, 0, nombre);
  }
});

test('regresión: la plantilla solo avisa de sus propios placeholders', (t) => {
  const archivo = join(RAIZ, 'generador-informes-offline', 'assets', 'plantilla-base.html');
  if (!existsSync(archivo)) return t.skip('plantilla-base.html no presente');
  const r = run(readFileSync(archivo, 'utf8'));
  // {{BODY}}, {{FOOTER}}, {{TITULO}} y {{COLOR_FONDO}} siguen sin sustituir: es
  // lo único que el esqueleto puede avisar. Cualquier otro warning es un fallo.
  assert.deepEqual(r.blockers, 0, r.blockersList.join('\n'));
  assert.equal(r.warningsList.length, 4, r.warningsList.join('\n'));
  for (const w of r.warningsList) {
    assert.match(w, /Sin <footer>|<h1>|placeholder|theme-color/);
  }
});

// --- portabilidad de la skill ---------------------------------------------
//
// La skill se instala a nivel de usuario y se usa desde proyectos cuyo cwd NO es
// la raíz de la skill. Estas pruebas fijan esa condición: si alguien vuelve a
// documentar o implementar una ruta relativa al cwd, el smoke falla.

const SMOKE = join(dirname(fileURLToPath(import.meta.url)), 'smoke.mjs');
const RAIZ_SKILL = join(dirname(fileURLToPath(import.meta.url)), '..');
// Directorio limpio y sin relación con la skill, para simular "otro proyecto".
const cwdAjeno = mkdtempSync(join(tmpdir(), 'cwd-ajeno-'));

test('portabilidad: el smoke valida un informe desde un cwd ajeno a la skill', () => {
  if (!existsSync(SMOKE)) return; // copia aislada del script de pruebas
  const r = execFileSync(process.execPath, [SMOKE, '--json'], {
    encoding: 'utf8', cwd: cwdAjeno, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const s = JSON.parse(r);
  assert.equal(s.ok, true, s.salida);
  assert.equal(s.codigo, 0);
  // El smoke se resuelve a la raíz de la skill, no al cwd donde se lanzó.
  assert.equal(s.cwd, cwdAjeno, 'el smoke no debe cambiar de cwd');
  assert.equal(s.raiz, RAIZ_SKILL, 'la raíz debe derivarse de la ubicación del propio smoke');
});

test('portabilidad: el smoke limpia su temporal y no escribe en el cwd', () => {
  if (!existsSync(SMOKE)) return;
  execFileSync(process.execPath, [SMOKE, '--json'], { encoding: 'utf8', cwd: cwdAjeno, stdio: ['ignore', 'pipe', 'pipe'] });
  const sueltos = readdirSync(cwdAjeno);
  assert.deepEqual(sueltos, [], `el smoke no debe escribir en el cwd: ${sueltos.join(', ')}`);
});

test('portabilidad: SKILL.md declara la raíz y no manda rutas relativas al cwd', () => {
  const md = join(RAIZ_SKILL, 'SKILL.md');
  if (!existsSync(md)) return; // copia aislada del script de pruebas
  const texto = readFileSync(md, 'utf8');
  // 1. Declara explícitamente que las rutas son relativas a la raíz de la skill.
  assert.match(texto, /Rutas de esta skill/i, 'falta la sección de rutas en SKILL.md');
  assert.match(texto, /\.config[\\/]opencode[\\/]skills[\\/]generador-informes-offline/,
    'falta la ruta canónica de instalación');
  // 2. Ningún comando ejecutable puede quedar con la ruta desnuda: es justo lo
  //    que falla con MODULE_NOT_FOUND fuera de la raíz de la skill. Se barre todo
  //    el documento (código inline Y bloques cercados) tomando el primer
  //    argumento de cada invocación de `node`.
  const args = [...texto.matchAll(/\bnode\s+["']?([^\s"'`\n]+)/g)].map((m) => m[1]);
  assert.ok(args.length > 0, 'no se encontró ningún comando node en SKILL.md');
  for (const a of args) {
    assert.doesNotMatch(a, /^(?:scripts|assets|references)[\\/]/,
      `SKILL.md invoca node con una ruta relativa al cwd: node ${a}`);
  }
  // 3. Las referencias siguen siendo atajos relativos a la raíz (correcto), pero
  //    el documento debe avisar de ello para que no se lean como rutas al proyecto.
  assert.match(texto, /raíz de la skill/i);
});
