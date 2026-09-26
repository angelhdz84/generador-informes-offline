#!/usr/bin/env node
/**
 * smoke.mjs — prueba de que la skill está bien instalada y operativa.
 *
 * Rellena `assets/plantilla-base.html` con un informe mínimo y lo valida con
 * `--strict`. Sirve para dos cosas:
 *
 *   1. Diagnóstico: si esto falla, la instalación está rota (falta un asset, el
 *      validador no arranca, la paleta no coincide con el skeleton...).
 *   2. Regresión: demuestra que la skill funciona desde CUALQUIER directorio de
 *      trabajo, que es el fallo de portabilidad que motivó este script. Todas
 *      las rutas se resuelven contra la raíz de la skill, derivada de la
 *      ubicación de este propio fichero con `import.meta.url`, nunca del cwd.
 *
 * Uso:
 *   node <raíz-de-la-skill>/scripts/smoke.mjs
 *   node <raíz-de-la-skill>/scripts/smoke.mjs --json
 *
 * Sale con código 0 si todo va bien, 1 si algo falla.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_OUT = process.argv.includes('--json');
const log = (...a) => { if (!JSON_OUT) console.log(...a); };

let dir;
try {
  dir = mkdtempSync(join(tmpdir(), 'skill-smoke-'));
} catch {
  console.error('No se pudo crear el directorio temporal para la prueba.');
  process.exit(1);
}

const destino = join(dir, 'smoke-informe.html');
const validador = join(RAIZ, 'scripts', 'validar-offline.mjs');
const read = (rel) => readFileSync(join(RAIZ, rel), 'utf8');

// --- datos mínimos ---------------------------------------------------------

const pal = JSON.parse(read('assets/paletas.json')).paletas.find((p) => p.id === 'ejecutivo');
if (!pal) throw new Error('paletas.json no contiene la paleta "ejecutivo"');

const PALETA = `:root{
  --bg:${pal.bg};--surface:${pal.surface};--text:${pal.text};--muted:${pal.muted};
  --border:${pal.border};--primary:${pal.primary};--secondary:${pal.secondary};
  --success:${pal.success};--warning:${pal.warning};--danger:${pal.danger};
  --chart-1:${pal.chart[0]};--chart-2:${pal.chart[1]};--chart-3:${pal.chart[2]};
  --chart-4:${pal.chart[3]};--chart-5:${pal.chart[4]};--chart-6:${pal.chart[5]};
  --chart-7:${pal.chart[6]};
  --radius:10px;--topbar-h:72px;
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
}`;

const TOPBAR = `<header class="topbar"><div class="container topbar-inner">
<span class="brand">Smoke Test S.L.</span></div></header>`;

const BODY = `<section id="resumen" class="hero"><h1>Informe de smoke test</h1>
<p class="lede">Comprobacion de que la skill instalada genera y valida un informe completo.</p>
</section>
<section id="datos" class="section">
<h2>Resultados</h2>
<div class="kpi-grid">
<div class="kpi"><div class="kpi-value">128</div><div class="kpi-label">Operaciones</div></div>
<div class="kpi"><div class="kpi-value">7</div><div class="kpi-label">Incidencias</div></div>
</div>
<figure class="chart">
<svg class="chart-svg" viewBox="0 0 320 120" role="img" aria-label="Evolucion mensual de operaciones">
<title>Evolucion mensual de operaciones</title>
<rect x="0" y="40" width="60" height="80" fill="var(--chart-1)"></rect>
<rect x="80" y="20" width="60" height="100" fill="var(--chart-2)"></rect>
<rect x="160" y="10" width="60" height="110" fill="var(--chart-3)"></rect>
</svg>
<figcaption><strong>Lectura:</strong> las operaciones crecen mes a mes y cierran en 128, un 8 % mas que al inicio.</figcaption>
</figure>
<div class="table-wrap">
<table>
<caption>Operaciones por mes</caption>
<thead><tr><th scope="col">Mes</th><th scope="col">Operaciones</th></tr></thead>
<tbody><tr><th scope="row">Enero</th><td>96</td></tr>
<tr><th scope="row">Febrero</th><td>120</td></tr>
<tr><th scope="row">Marzo</th><td>128</td></tr></tbody>
</table>
</div>
</section>`;

// El footer es SOLO identidad del cliente. C2 exige los 5 campos: logo (clase
// `logo`), empresa en <strong> (no en un encabezado), contacto, autoría y
// período. Sin el logo y el <strong> el validador lo rechaza.
const FOOTER = `<footer>
<div class="container">
<div class="foot-grid">
<div>
<div class="foot-brand">
<div class="logo"><svg class="logo" viewBox="0 0 32 32" width="44" height="44" role="img" aria-label="Monograma de Smoke Test S.L."><rect width="32" height="32" rx="6" fill="var(--primary)"></rect><text x="16" y="22" text-anchor="middle" font-size="16" fill="#fff" font-family="sans-serif">S</text></svg></div>
<strong>Smoke Test S.L.</strong>
</div>
<p class="small">Comprobacion tecnica de la skill.</p>
</div>
<div>
<h2>Contacto</h2>
<address style="font-style:normal">
<p class="contact-item">Calle Prueba 1, Madrid</p>
<p class="contact-item">smoke@example.es</p>
</address>
</div>
<div>
<h2>Elaborado por</h2>
<p class="contact-item">Agente OpenCode</p>
</div>
</div>
<div class="foot-bottom">
<span>Smoke Test S.L.</span>
<span>Informe de smoke test - septiembre de 2026</span>
<span>Elaborado por: Agente OpenCode</span>
</div>
</div>
</footer>`;

// --- montaje ---------------------------------------------------------------

let html = read('assets/plantilla-base.html');
const sustituciones = {
  '{{TITULO}}': 'Informe de smoke test',
  '{{COLOR_FONDO}}': pal.bg,
  '{{PALETA}}': PALETA,
  '{{SPRITE}}': read('assets/iconos.svg'),
  '{{MOTION_JS}}': read('assets/motion.min.js'),
  '{{TOPBAR}}': TOPBAR,
  '{{BODY}}': BODY,
  '{{FOOTER}}': FOOTER,
};
for (const [k, v] of Object.entries(sustituciones)) html = html.split(k).join(v);

const sinSustituir = [...new Set(html.match(/\{\{[A-Z_]+\}\}/g) || [])];
if (sinSustituir.length) {
  console.error(`Placeholders sin sustituir en la plantilla: ${sinSustituir.join(', ')}`);
  console.error('Si son marcadores nuevos, añade su entrada a scripts/smoke.mjs.');
  rmSync(dir, { recursive: true, force: true });
  process.exit(1);
}

writeFileSync(destino, html, 'utf8');
log(`Plantilla rellenada: ${destino} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
log(`Ejecutado desde cwd: ${process.cwd()}`);
log(`Raíz de la skill:   ${RAIZ}`);

// --- validación ------------------------------------------------------------

let codigo = 1;
let salida = '';
try {
  salida = execFileSync('node', [validador, destino, '--strict'], { encoding: 'utf8' });
  codigo = 0;
} catch (e) {
  salida = `${e.stdout || ''}${e.stderr || ''}`;
  codigo = e.status == null ? 1 : e.status;
}

if (JSON_OUT) {
  console.log(JSON.stringify({ ok: codigo === 0, codigo, raiz: RAIZ, cwd: process.cwd(), salida: salida.trim() }, null, 2));
} else {
  console.log(salida.trim());
  console.log(codigo === 0
    ? '\n✔ SMOKE OK — la skill esta instalada y genera informes validos.'
    : `\n✘ SMOKE FAIL (codigo ${codigo}) — la skill no esta operativa. Revisa assets/ y scripts/.`);
}

rmSync(dir, { recursive: true, force: true });
process.exit(codigo);
