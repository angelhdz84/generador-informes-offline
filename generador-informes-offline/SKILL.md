---
name: generador-informes-offline
description: >-
  Genera informes profesionales en un ÚNICO archivo .html monolítico, 100%
  autocontenido y 100% offline (0 internet, 0 CDN, 0 dependencias externas),
  a partir de datos pegados, archivos (xlsx/csv/pdf/docx) o preguntas guiadas.
  Produce portada, resumen ejecutivo con KPIs, gráficas SVG (barras, líneas,
  pie, donut, radar, funnel, gauge, heatmap, treemap, sparklines),
  infografías (timeline, procesos, comparativas, progress ring, panel "Lo más
  importante", índice navegable) e iconos SVG inline, con animaciones
  elegantes y sobrias opt-in por atributo (reveal, entrada direccional, barras,
  trazados, contadores) que respetan prefers-reduced-motion. Los informes salen
  accesibles por defecto: skip link, un solo h1, main#contenido, navegación por
  teclado con foco visible, SVG decorativos ocultos y gráficas con nombre
  accesible, imágenes embebidas con alt y dimensiones, reflow a 320 px y zoom
  200 %, completos y legibles sin JS, en reduced motion y al imprimir. Footer
  obligatorio que siempre incluye logo + nombre de empresa + datos de contacto
  + autor. Toda gráfica lleva una interpretación de 1-2 frases bajo ella. Usa
  esta skill SIEMPRE que el usuario pida crear, generar, armar, maquetar o
  redactar un informe, reporte, report, memoria, resumen de resultados,
  dashboard estático o documento con datos/gráficas en HTML - incluso si no
  dice explícitamente "informe" o "reporte". Aplica también cuando el usuario
  pase datos o tablas y quiera una presentación visual estructurada e
  imprimible (PDF) sin conexión. No usar para dashboards web dinámicos que
  necesiten backend, ni para documentos Word/PDF nativos.
compatibility:
  - Node.js (solo para el script de validación offline; el informe en sí es 100% sin dependencias)
---

# Generador de Informes HTML Offline

Convierte información en un informe profesional contenido en **un solo archivo
`.html`** que funciona sin internet desde el primer segundo. Cero CDN, cero
webfonts, cero peticiones de red: **todo vive dentro del archivo**.

## Filosofía (por qué existe esta skill)

El usuario abre el informe haciendo doble clic y todo debe verse y funcionar
aunque esté en un avión, un sótano o un hospital sin señal. Eso obliga a una
disciplina estricta de autocontención. Cualquier dependencia externa rompe la
promesa "0 internet desde el comienzo", así que la generación termina siempre
con una validación automática que lo comprueba.

## Reglas no negociables (0 internet estricto)

PROHIBIDO en el HTML generado:

- URLs externas: `http://`, `https://`, `//dominio` en `src`, `href`, `action`, `poster`, CSS `url()`
- `<link rel="stylesheet">` y `<script src>` (todo CSS/JS va inline)
- `@import` en CSS, `@font-face` con fuente externa, webfonts de Google Fonts o similares
- `<iframe>`, `fetch()`/XHR/WebSocket a red, `<base href>`
- Imágenes remotas o mapas externos; iconos desde CDN
- Referencias a archivos externos (`<use href="archivo.svg#id">` con ruta)

OBLIGATORIO en el HTML generado:

- `<meta charset="UTF-8">` y `<html lang="es">`
- `<meta name="color-scheme" content="light">`, `color-scheme` en `:root` y
  `<meta name="theme-color">` con el fondo real
- System font stack: `font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;`
- CSS completo en `<style>`, JS (si hay) en `<script>` inline
- Iconos como sprite SVG embebido (`assets/iconos.svg`) o SVG inline dibujado a mano
- Imágenes de marca embebidas en base64 (nunca por ruta), con `alt` y `width`/`height`
- Skip link al contenido + `<main id="contenido" tabindex="-1">`
- Bloque `prefers-reduced-motion` con estado final completo
- `@media print` para que imprimir → Guardar como PDF produzca un documento limpio
- Footer completo con identidad (ver abajo)

Emojis: permitidos como respaldo iconográfico, nunca como única fuente.

## Flujo de trabajo

### Fase 1 — Diagnóstico (máximo 3-4 preguntas)

Extrae lo que el usuario ya haya dicho en su mensaje y pregunta SOLO lo que
falte. No repitas preguntas ya respondidas.

1. **Tipo de informe** (ventas, gestión/gerencial, académico, técnico, médico, general...)
2. **Público objetivo** (directivos → ejecutivo y sintético; técnicos → detalle; clientes → claro y persuasivo)
3. **Origen de datos** (pegar texto/datos, subir archivo, o responder preguntas)
4. **Identidad y autoría** — SIEMPRE se pregunta (bloque obligatorio):
   - Nombre de la empresa
   - Logo: pedir archivo/imagen. Si el usuario no lo tiene, generar un **monograma SVG** inline con las iniciales del nombre + colores de marca
   - Colores de marca (o proponer paleta de `assets/paletas.json`)
   - Datos de contacto: teléfono, correo, web, dirección (los que apliquen)
   - **Nombre de quien crea el informe** (autor) y cargo si lo da

### Fase 2 — Recopilación de datos

Según lo que eligió el usuario:

- **Datos pegados**: detecta tablas, listas, series y métricas; normaliza formato (números, porcentajes, fechas). Si un dato es ambiguo o falta el período/unidad, haz UNA pregunta puntual antes de generar.
- **Archivo**: lee el archivo con las herramientas disponibles y extrae las tablas/datos relevantes.
- **Preguntas guiadas**: arma la estructura sección por sección con las respuestas.

Regla: si los datos no alcanzan para una sección o métrica, NO inventes valores. Omite la sección o pide el dato.

### Fase 3 — Plan del informe (breve, antes de generar)

Presenta al usuario un listado corto: secciones propuestas + qué gráfica/
infografía va en cada una. Elige el modo:

- **Animación opt-in por atributo `data-*`** (modo por defecto): el skeleton
  (`assets/plantilla-base.html`) trae el CSS preparado, pero un elemento **solo
  anima si lleva** `data-reveal`, `data-slide`, `data-grow`, `data-draw`,
  `data-pop`, `data-count` o `data-water`. El runtime (`assets/motion.min.js`)
  solo se incluye si el informe usa al menos uno. Es mejora progresiva: sin JS,
  con `prefers-reduced-motion` y en print, el estado final se ve completo.
- **SVG estático** (sin `data-*` ni runtime): informes simples, pocas series,
  prioridad a peso ligero e impresión perfecta. El contenido ya es legible y
  completo sin una sola línea de JS.
- **Interactivo** (Alpine.js inline desde `assets/alpine.min.js`, ~47KB): muchos
  datos, tabs por período/región, tooltips, filtros, toggle de modo oscuro. Al
  incrustarlo, el contenido del archivo debe copiarse DENTRO del `<script>` (nunca
  `<script src>`). Las animaciones `data-*` conviven con Alpine.

Regla de decisión: la animación se **añade** cuando aporta lectura (jerarquía,
continuidad entre datos relacionados o un momento focal), no por defecto. Un
informe de una sola gráfica se entrega estático. Si no hay duda razonable,
decide tú y justifica en una línea; si hay duda, pregunta. Detalle en
`references/movimiento.md`.

### Fase 4 — Generación del HTML

**Usa `assets/plantilla-base.html` como punto de partida SIEMPRE.** Copia el
archivo y rellena los placeholders (`{{TITULO}}`, `{{COLOR_FONDO}}`, `{{PALETA}}`,
`{{SPRITE}}`, `{{MOTION_JS}}`, `{{TOPBAR}}`, `{{BODY}}`, `{{FOOTER}}`) con los
datos reales. `{{COLOR_FONDO}}` va en `<meta name="theme-color">`: el color real
de fondo de la paleta, nunca un placeholder (el validador lo rechaza en
`--strict`). No reescribas el sistema de diseño del skeleton: añade contenido y,
si hace falta un componente nuevo, consulta las referencias. Ayuda de cada
referencia:

- `references/svg-charts.md` → fórmulas y recetas de cada gráfica SVG + animación `data-*` + "Lectura:" obligatoria
- `references/infografias.md` → timeline, funnel, KPI cards, comparativas, progress ring, panel, TOC, tooltips, etc.
- `references/diseno.md` → paletas, jerarquía, layout, print y principios UX/UI (estilo premium con `.compare`, `.gauge`, `.funnel`, `.tip-zone`, `.status-dot`, `.hero-pattern`, modo oscuro opcional)
- `references/tipos-informe.md` → estructura de secciones por tipo de informe
- `references/movimiento.md` → sistema de animación, duraciones, easing y reduced motion
- `references/accesibilidad-ux.md` → **baseline obligatorio**: semántica, teclado, foco, color, texto alternativo, responsive/zoom, checklist de entrega

Estructura base OBLIGATORIA del documento:

1. **Portada**: título, subtítulo, período, logo + nombre de empresa, autor, fecha
2. **Índice (TOC)** + **"Lo más importante"** si el informe supera 6 secciones (ver `references/infografias.md`)
3. **Resumen ejecutivo**: 3-6 KPIs en tarjetas con sparkline
4. **Secciones** según tipo y datos, cada una con su gráfica/infografía
5. **Recomendaciones / conclusiones** (si aplica)
6. **Notas metodológicas, fuentes y apéndice** (tabla de datos, definiciones)
7. **Footer — SIEMPRE presente con identidad completa**:
   - Logo + nombre de la empresa
   - Datos de contacto (teléfono, correo, web, dirección)
   - `Elaborado por: [autor]` (+ cargo si lo dio)
   - Período/año del informe
   - **PROHIBIDO** añadir la firma `Documento 100% offline · generado con
     generador-informes-offline` u otra autofirma de la skill en el footer.
     El footer es solo identidad del cliente (logo, empresa, contacto, autor,
     período).

Reglas de contenido (obligatorias):

- **Toda gráfica lleva 1-2 frases de "Lectura:" bajo ella** con el hallazgo real
  (ver `references/svg-charts.md`). La gráfica muestra, el análisis explica.
- Las gráficas e infografías llevan animación `data-*` del skeleton **solo cuando
  aportan lectura**: mejora progresiva, respeta `prefers-reduced-motion` y fuerza el
  estado final en print. Nada de reveals encadenados en cada bloque.
- El logo/nombre también se reutilizan en la portada y el header para coherencia.

Baseline de accesibilidad y lectura (OBLIGATORIO, ver
`references/accesibilidad-ux.md`):

- Skip link como primer elemento enfocable + `<main id="contenido" tabindex="-1">`.
- Un solo `<h1>`, jerarquía de títulos sin saltos, `<nav>` con `aria-label`.
- Iconos decorativos con `aria-hidden="true" focusable="false"`; SVG informativo
  con `role="img"` y `aria-label`/`aria-labelledby` hacia un `<title>` único.
- Toda `<img>` con `alt` coherente y `width`/`height` intrínsecos.
- `<meta name="color-scheme">`, `color-scheme` en CSS y `<meta name="theme-color">`
  coherentes con el fondo real.
- `scroll-padding-top`/`scroll-margin-top` para que el TOC no tape el topbar.
- `overflow-wrap:anywhere`, `text-wrap:balance` en títulos y `text-wrap:pretty`
  en prosa; sin `overflow-x:hidden` como parche.
- Todo operable con teclado, con `:focus-visible` visible y sin `tabindex` positivo.
- El color nunca es la única señal: acompaña con texto, signo, icono o forma.
- Completo y legible sin JS, con reduced motion, en print y a zoom 200 %.

### Fase 5 — Validación offline

1. Guarda el HTML y valida: `node scripts/validar-offline.mjs informe.html --strict`
2. El script comprueba 0-internet (errores que bloquean) y diseño (warnings).
   Con `--strict`, ambos bloquean: corrige TODOS los hallazgos y revalida hasta
   salir limpio (código 0). Sin `--strict` los warnings solo se informan.
3. Antes de entregar, completa el **checklist manual** de
   `references/accesibilidad-ux.md` (recorrido con teclado, zoom 200 %, reduced
   motion, estado sin JS e impresión a PDF): el validador cubre la capa
   determinista, no sustituye esa revisión.
4. Entrega: ruta del archivo + instrucción de abrirlo con doble clic y, si quiere PDF, Imprimir → Guardar como PDF (el CSS print ya está listo).

## Uso de assets

- `assets/plantilla-base.html` — skeleton canónico (vía ÚNICA de diseño). Copiar y rellenar placeholders.
- `assets/motion.min.js` — motor de animación (reveal, slide, grow, draw, pop, count, water). Su contenido va inline en `<script>` dentro del skeleton.
- `assets/iconos.svg` — sprite de iconos SVG (estilo feather). Incrusta en el HTML los `<symbol>` que uses dentro de un `<svg>` oculto y referéncialos con `<svg class="icon"><use href="#i-nombre"></use></svg>`. Si falta un icono, dibújalo a mano con el mismo estilo de trazo (stroke 2, redondeado).
- `assets/paletas.json` — paletas profesionales: objeto con esquema de colores (fondo, superficie, texto, primario, secundario, éxito, alerta, peligro, serie de gráfica). Elige según tipo de informe y preferencia del usuario.
- `assets/alpine.min.js` — solo para modo interactivo; su contenido va inline en `<script>`.

## Recomendaciones de calidad

- Contraste AA/AAA en texto (ver `references/diseno.md`); el validador comprueba
  `--text`/`--muted` sobre `--surface` y `--text` sobre `--bg`.
- Cada gráfica con nombre accesible, leyenda cuando hace falta y valores legibles;
  tablas con `<caption>` y `<th scope>`; toda gráfica con su "Lectura:".
- Números con formato local (miles, %, fechas es-ES) y `font-variant-numeric:tabular-nums`
  en cifras comparables para que las columnas alineen.
- No satures: una idea por gráfica; máximo 6 colores de serie en una misma gráfica.
- Animaciones: una vez por elemento, solo `transform`/`opacity`/`stroke-dashoffset`,
  easing `cubic-bezier(0.23, 1, 0.32, 1)`, UI por debajo de 300 ms, sin `transition:all`
  ni `scale(0)`; respetar `prefers-reduced-motion`; estado final completo sin JS y en
  print (ver `references/movimiento.md` y `references/accesibilidad-ux.md`).
- Micro-interacciones premium disponibles en el skeleton (úsalas con criterio, no
  satures): `.tip-zone` con tooltip, columnas `.compare`, zoom de iconos al hover,
  sello `.status-dot`, patrón `.hero-pattern` y modo oscuro `data-theme="dark"` (solo
  modo interactivo, y con `color-scheme:dark` declarado).
- Tooltips solo como extra: la información importante va en el flujo principal y
  disponible con foco, nunca solo con hover.
- El informe debe abrirse y verse perfecto SIN internet y SIN consola con errores.