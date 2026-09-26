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
import { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
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

const CSS_BASE = `
:root{color-scheme:light;--bg:#f6f8fb;--surface:#ffffff;--text:#1f2937;--muted:#4b5563;
  --border:#e5e7eb;--primary:#1e3a8a;
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
function informe({ head = '', css = '', main = '', footer } = {}) {
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
<style>${CSS_BASE}${css}</style>
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
