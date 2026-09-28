# Diseño y sistema visual

Principios de diseño para que todos los informes generados se vean
profesionales, coherentes y accesibles, sin depender de nada externo.

## Skeleton (vía ÚNICA de diseño)

**Todos** los informes parten de `assets/plantilla-base.html`. NO reescribas el
sistema de diseño: copia el archivo, rellena los placeholders y añade solo el
contenido. Esto garantiza el mismo acabado en todos los informes.

Placeholders a sustituir:

| Placeholder | Qué va |
|---|---|
| `{{TITULO}}` | Título del documento (`<title>` y hero) |
| `{{COLOR_FONDO}}` | Fondo real de la paleta, para `<meta name="theme-color">`. Debe salir de la paleta elegida, no inventarse ni quedar como placeholder |
| `{{PALETA}}` | Variables CSS de la paleta elegida (`assets/paletas.json`) |
| `{{SPRITE}}` | Contenido de `assets/iconos.svg` |
| `{{MOTION_JS}}` | Contenido de `assets/motion.min.js` |
| `{{TOPBAR}}` | Barra superior con marca |
| `{{BODY}}` | Todo el `<main>`: portada, TOC, panel, secciones, recs, notas |
| `{{FOOTER}}` | Footer con identidad completa |

El skeleton ya incluye: tokens de color, tipografía, layout, KPI grid, donut/ring,
tablas con in-cell bars, callouts, pasos, timeline, TOC, panel, footer, print y
animaciones `data-*`. Para usar componentes nuevos consulta `references/*`.

## Paletas

Toma el esquema desde `assets/paletas.json`. Estructura de cada paleta:

```json
{
  "id": "ejecutivo",
  "nombre": "Ejecutivo",
  "bg": "#f6f8fb", "surface": "#ffffff",
  "text": "#1f2937", "muted": "#6b7280",
  "primary": "#1e3a8a", "secondary": "#f59e0b",
  "success": "#16a34a", "warning": "#d97706", "danger": "#dc2626",
  "chart": ["#1e3a8a", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"],
  "radial": "linear-gradient(135deg,#1e3a8a,#3b82f6)"
}
```

Cómo elegir:
- Informes de gestión/ventas formales → paletas frías (ejecutivo, moderno).
- Informes de salud/sostenibilidad → verdes/teal (salud).
- Informes para clientes / presentaciones → paletas cálidas con acento (energía).
- Pregunta por colores de marca en Fase 1; si no los da, elige por tipo de informe.

## Tokens de diseño

- **Radio**: `4px` (elementos pequeños), `10px` (tarjetas), `16px` (portada/hero).
- **Sombra**: sutil `0 1px 3px rgba(15,23,42,.08), 0 4px 12px rgba(15,23,42,.06)`.
- **Espaciado** (escala 8pt): `8, 16, 24, 32, 48, 64`. Los múltiplos de 4
  (`4, 12, 20`) se usan solo dentro de componentes cerrados (padding de celda,
  hueco entre icono y texto), nunca entre bloques.
- **Ritmo de página**: secciones separadas 48px; contenido dentro de tarjetas 24px.
- **Tokens derivados**: además de los tokens de la paleta, el skeleton
  deriva algunos para que cambiar de paleta recoloree todo lo demás sin tocar
  una línea:

  | Token | De dónde sale |
  |---|---|
  | `--footer-bg` / `--footer-text` / `--footer-muted` / `--footer-accent` | `--primary` y `--surface` |
  | `--zebra` | `--text` al 3 % sobre `--surface` (franja alterna de tabla) |
  | `--head-bg` | `--primary` al 6 % sobre `--surface` (fondo de encabezado) |
  | `--accent` | `--primary` por defecto; `[data-accent="N"]` lo remapea |
  | `--accent-line` / `--accent-text` / `--accent-ink` | `--accent` mezclado con `--text` al 30 % / 50 % / 68 % |

  Ninguno lleva hex propio: todos son `color-mix()`. Por eso el check **C14**
  puede bloquear un color literal en el CSS sin bloquear la paleta.
- **Alto del topbar**: `--topbar-h` (72px por defecto). Compensa el scroll
  sticky: `html{scroll-padding-top:var(--topbar-h)}` y
  `main[id],section[id]{scroll-margin-top:8px}`. Los dos se **suman**, así que si
  cambias el alto del topbar cambia solo el token, nunca los dos números.

## Color por sección (`data-accent`)

El acento vive en un **atributo**, no en un hex local. Se marca el contenedor y
el color se decide en un sitio:

```html
<section id="s1" data-accent="2"> ... </section>
```

`[data-accent="1".."7"]` remapean `--accent` a `--chart-1..7`, así que el
color se lee de la paleta como cualquier otro token.

### El alcance trampa de `var()`: recalcular los tres derivados

Una custom property sustituye sus `var()` **en el elemento donde se declara**,
no en el elemento donde se usa. `--accent-text: color-mix(…, var(--accent))`
escrita en `:root` se resuelve **una sola vez**, contra el `--primary` de
`:root`, y ese color concreto hereda a toda la página. Remapear `--accent` en
`[data-accent="3"]` no cambia nada de lo que ya se calculó.

Por eso el mapa es **doble**, y vive entero en el mismo elemento:

```css
[data-accent="3"]{--accent:var(--chart-3)}
[data-accent]{
  --accent-line:  color-mix(in srgb, var(--text) 30%, var(--accent));
  --accent-text:  color-mix(in srgb, var(--text) 50%, var(--accent));
  --accent-ink:   color-mix(in srgb, var(--text) 68%, var(--accent));
}
```

El fallo no se ve: el **fondo** del badge sí cambia de sección, porque su
`color-mix(in srgb, var(--accent) 12%, …)` se evalúa en el propio elemento, y
el texto no. El resultado parece un descuido de estilo —badge verde con texto
azul— en vez de un error de alcance, que es lo que es.

El check **C15** lo vigila de forma estructural: si algún selector
`[data-accent…]` remapea `--accent`, exige que otro `[data-accent…]` declare
los tres derivados y nombra los que falten.

### Dónde se aplica: solo la CROMA del encabezado

- **Sí**: el filete vertical de 3 px a la izquierda (`.h2wrap::before`), la
  línea bajo el `h2` (`.h2wrap h2::after`) y el color del badge.
- **No**: los colores de los datos. Remapear `--chart-*` rompería "mismo color =
  misma serie" en cuanto el lector comparara dos gráficas.
- **No**: bandas de fondo ni tarjetas teñidas. Un tinte por sección convierte un
  informe largo en un carnival y compite con las gráficas.

Es un cambio **sutil a propósito**: filete y línea cambian de tono, el texto y
los fondos se quedan quietos.

### El matiz que hay que respetar: tres mezclas, tres umbrales

El color puro de la serie **no llega a ningún umbral**, ni al 4.5:1 del texto ni
al 3:1 de los elementos no textuales. Medido sobre la superficie tintada de
`ejecutivo`, el ámbar da **2.15:1**, el verde **2.54:1** y el teal **2.49:1**.
No es un matiz: es una serie que no se puede leer.

Por eso el acento nunca se usa tal cual, y hay **tres** tokens, cada uno con su
umbral y su cuota **medida** (el mínimo está en el 26 % para 3:1 y en el 47 %
para 4.5:1; se usa un margen por encima en los dos casos):

| Uso | Umbral | Token | Por qué |
|---|---|---|---|
| Filete, línea de acento, borde de tabla, borde de bloque, icono del `h2` | 3:1 | `--accent-line` = `color-mix(in srgb, var(--text) 30%, var(--accent))` | Es cromo, no texto: 3:1 basta |
| Texto del eyebrow, texto de badge | 4.5:1 | `--accent-text` = `color-mix(in srgb, var(--text) 50%, var(--accent))` | Es texto: le exige 4.5:1 |
| Cifras grandes de KPI | 4.5:1 | `--accent-ink` = `color-mix(in srgb, var(--text) 68%, var(--accent))` | Es texto grande, pero el tono aún tiene que leerse |

El color puro queda solo para el **fondo** del badge, y ahí ya es un tinte del
12 %, no un plano de color: `color-mix(in srgb, var(--accent) 12%, var(--surface))`.

El check **C1** mide las tres cuotas contra las superficies donde el texto se
pinta de verdad (la base **y** la tintada), y avisa si alguna serie no llega. Es
la parte que no se puede fiar de la intuición: bajar la cuota de 50 % a 38 % no
rompe nada visible hasta que el informe va impreso, y por eso lo comprueba el
validador y no el ojo.

> **Lo que el check no sabe leer.** Solo entiende
> `color-mix(in srgb, var(--text) N%, …)`. Si escribes la mezcla en `oklab`, o
> con el acento primero, o con decimales (`50.0%`), se calla en vez de medir:
> no es que pase, es que no lo ha mirado. La razón es que el promedio sRGB de
> una mezcla oklab no es el color que pinta el motor, y publicar esa medida sería
> peor que no publicar ninguna.

### Eligiendo la rampa

No todos los tonos de la paleta son neutros en significado. Verde y ámbar
comunican "bien" y "aviso", así que usarlos para colorear secciones sugiere un
juicio que los datos no hacen. Para una rampa de secciones, usa tonos **neutros**
(azul, violeta, teal, pizarra) y deja que los secciones de marco se queden con
`--primary`. Repetir tonos cada 3 o 4 secciones es correcto: significa "estas
secciones comparten identidad", no que falten colores.

### Cuándo poner un `.eyebrow`

```html
<div class="h2wrap">
  <div class="eyebrow">Bloque A</div>
  <h2>Naturaleza de los artículos científicos</h2>
</div>
```

Mayúsculas, `letter-spacing: .14em`, `--accent-text`, tamaño `.72rem`. Es
una **etiqueta de contexto**, no un título: escribe solo lo que el informe ya
afirma en otra parte. Si la sección ya lleva su categoría en un badge o en el
propio texto del `h2`, **no añadas el eyebrow**: sería repetir lo mismo con otro
formato e inventarías la jerarquía. Es preferible omitirlo.

## Tipografía

- System font stack SIEMPRE (nada de webfonts):
  `system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`
- Escala:
  - Título portada: `clamp(2rem, 5vw, 3.25rem)` / 800
  - Subtítulo: `1.25rem` / 500 / muted
  - H2 de sección: `1.5rem` / 700 (con línea de acento bajo o icono)
  - H3 de tarjeta: `1.125rem` / 600
  - KPI value: `2rem` / 800 (tabular-nums si hay cifras)
  - Cuerpo: `1rem` / 400, alto de línea 1.6
  - Small/captions: `0.875rem` / muted
- `font-variant-numeric: tabular-nums` en tablas y KPIs para que los números no bailen.
- Números: locale es-ES (`1.234,56`), fechas `dd/MM/yyyy`, moneda con símbolo propio.

## Layout

- Contenedor de página: `max-width: 980px; margin: 0 auto; padding: 24px;`.
- **Portada**: hero con fondo degradado (`paleta.radial`), logo + nombre arriba,
  título central, subtítulo, autor/fecha abajo.
- **Resumen ejecutivo**: grid responsivo de KPI cards:
  `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`.
- **Secciones**: `<section>` con `<h2>` + línea de acento; contenido en tarjetas
  (`.card`) de `surface` con sombra. Gráfica + comentario de análisis al lado.
- **Apéndice**: tablas `.table` con `<caption>`, filas zebra suaves, `th` sticky opcional.
  **Toda `<table>` va dentro de un `.table-wrap`** (`overflow-x:auto`), obligatorio
  en C11: sin él, una tabla ancha desborda el viewport y rompe el reflow a 320 px
  y la impresión. Un solo `.table-wrap` puede envolver varias tablas seguidas;
  no hace falta uno por tabla.
- **Footer**: bandas oscuras o claras según paleta; 2-4 columnas en desktop,
  apilado en móvil; SIEMPRE con logo, nombre, contacto, autor y período.

## Print (exportar a PDF)

El skeleton incluye un `@media print` completo; ajusta solo lo específico del
informe. Reglas clave:

```css
@media print {
  @page { size: A4; margin: 14mm; }
  body { background: #fff; color: #000; }
  .card, .kpi, .hl, .toc, .recs li { box-shadow: none; border: 1px solid #e5e7eb; }
  .topbar, .no-print { display: none !important; }
  a { color: inherit; text-decoration: none; }
  section { break-inside: avoid; }
  .kpi, .chart, .chart-box, .hl { break-inside: avoid; }
  h2 { break-after: avoid; }
}
```

- **Portada en página única**: el `.hero` va al inicio y sus siguientes bloques
  (TOC / panel / resumen) llevan `break-before: page` si queremos empezar la
  página 2 limpia. Prueba con Ctrl+P; si el hero queda cortado, ajusta su altura.
- **Cabecera de página opcional**: para numeración usa margin boxes (soportado en
  Chrome; degrada en silencio en otros): `@page { @bottom-center { content: counter(page) " / " counter(pages); } }`.
- Marca `break-inside: avoid` en tarjetas grandes para que no se corten feo.
- Las animaciones se fuerzan a su estado final en print (el skeleton ya lo hace).
- Oculta elementos puramente interactivos con `.no-print`.

## Animaciones (opt-in por atributo, elegantes y sobrias)

El skeleton trae el CSS de animación preparado, pero **nada anima por defecto**:
un elemento solo se mueve si lleva un atributo `data-*`. Si el informe no usa
ninguno, no se incrusta `assets/motion.min.js`.

- `data-reveal` (fade+subida), `data-slide` (desliz direccional, `data-from`),
  `data-grow` (barras), `data-draw` (trazos), `data-pop` (donut/ring),
  `data-count` (contadores), `data-stagger` (escalonado), `data-water` (fondo decorativo).
- **Reglas obligatorias**: (1) el contenido se ve completo sin JS y al imprimir;
  (2) `prefers-reduced-motion: reduce` desactiva todo (el script añade `html.no-anim`
  y el CSS fuerza el estado final); (3) solo `transform`/`opacity`/`stroke-dashoffset`
  (compositor rápido); (4) una animación por elemento al entrar en viewport;
  (5) duraciones acotadas y sin loops (ver `references/movimiento.md`).
- **Criterio para animar**: la animación aporta lectura — jerarquía, continuidad
  entre datos relacionados o un momento focal. No se añade "porque se ve más vivo".
  Un informe corto o de una sola gráfica se entrega estático.
- Referencia de uso: tabla de animación en `references/svg-charts.md`; duraciones,
  easing y reduced motion en `references/movimiento.md`.

## Decoración y micro-interacciones (incluidas en la plantilla)

Recursos que ya trae el skeleton para que los informes destaquen sin coste:

- **Patrón decorativo del hero** (`svg.hero-pattern[data-water]`): SVG inline
  punteado/trama de fondo con fundido suave (opacidad → `var(--wo,.45)`). Se
  coloca como primer hijo del hero; el resto de contenido hereda `z-index:1`.
- **Sello de estado** (`.status-dot`): píldora con punto que pulsa 2 veces;
  ideal "Web operativa" / "Servicio activo".
- **Mini-barras comparativas** (`.mbar`): rellenos `scaleX` con `--w` y color
  semántico `--bc`; cuentan en la jerarquía "tamaño → color → contraste".
- **Estado de lectura**: la barra `.read-progress` (fija bajo el topbar, 2 px)
  marca cuánto lleva recorrido, y el enlace activo del índice recibe
  `aria-current="true"` (peso, color de marca y un subrayado lleno). Los dos
  los pone `motion.min.js` **en runtime**, también con `prefers-reduced-motion`
  y sin gate `html.js`, porque son navegación y no decoración. En print se
  ocultan. En el esqueleto, `.read-progress` va justo antes de `<main>`.
- **Filete de bloque** (`<i class="rule" data-rule>`): una línea de 3 px que
  se dibuja en `scaleX` al entrar. Es un elemento real, no un `::after`,
  porque los pseudo-elementos no pueden llevar atributos de animación.
- **Subrayado animado del índice**: cada enlace del TOC gana una línea que se
  dibuja al hover (solo `transform`, guardado bajo `prefers-reduced-motion`).
  La variante `aria-current="true"` es la misma línea, ya dibujada.
- **Elevación en hover**: tarjetas `.hl`, `.recs li`, `.ring-item`, ítems de
  timeline suben 3px con sombra ampliada (transición de `var(--motion-duration)`).
- **Modo oscuro opcional** (interactivo): poniendo `data-theme="dark"` en
  `<html>` cambian `--bg/--surface/--border/--text/--muted` + colores de gráficas
  (mapa completo de tokens). Por defecto los informes van en claro; el modo
  oscuro es una elección del informe (con Alpine u otro control), no un default.
- **Tooltip** (`.tip-zone > .tip`): ayuda contextual al hover/foco del ítem;
  oculto en print. NO es una animación: es contenido y también se muestra bajo
  `prefers-reduced-motion` (el fade solo aparece con JS y sin reduce). Usar SOLO
  como extra, nunca como sustituto de la línea "Lectura:" obligatoria.
- **Columnas comparativas** (`.compare > .compare-col`): grid de 2 (antes/después,
  A vs B) con tarjeta por columna; combina con `[data-slide data-from="left|right"]`
  para que cada columna entre desde su lado. En móvil pasa a 1 columna.
- **Gauge y funnel**: el skeleton trae contenedores `.gauge` (medidor con centro
  tipo `.gauge-center` para el valor) y `.funnel` (escaleras con `.f-step` y
  `--w` por paso). Siguen la misma regla: `<title>` + "Lectura:" bajo la pieza.
- **Zoom de iconos**: al hover, iconos de `.hl-ic`, `.kpi-head` y numerales de
  `.recs .rnum` crecen ligeramente (solo `transform`, micro-interacción sobria).
- **Foco visible + scroll suave**: `:focus-visible` con outline accesible en
  enlaces, tarjetas e ítems interactivos; scroll suave solo con JS activo
  (desactivado por `prefers-reduced-motion`).

## Principios UX/UI de referencia (curados)

La plantilla ya aplica estas reglas; úsalas como checklist de "acabado premium"
al revisar un informe generado. La versión normativa de estos principios está
en `references/accesibilidad-ux.md`: aquí quedan como criterio de diseño, no
como especificación.

- **Menos es más**: cada dato extra compite con los que importan. Si un número o
  gráfica no apoya la conclusión, se elimina (heurística #8 de Nielsen).
- **El lector no memoriza**: cada gráfica se entiende en sí misma — título claro,
  etiquetas visibles, "Lectura:" debajo. No obligues a recordar otra sección
  (heurística #6: reconocimiento ante recuerdo).
- **Consistencia, no uniformidad**: mismos patrones visuales para cosas iguales
  (mismo color = misma serie), mismos términos. Ayuda a que el informe "se sienta
  de marca" (GOV.UK principio 9).
- **Claro estándar, no distracción**: jerarquía por tamaño→color→contraste;
  máx. 6 colores por serie; animación sobria, acotada y sin bucles (GOV.UK "do
  the hard work to make it simple").
- **Menos movimiento, más lectura**: en modo lectura prefiere una secuencia
  memorable a reveals encadenados. La animación no oculta ni retrasa información
  que ya está disponible.
- **Accesible es premium**: contraste AA, patrón+símbolo además de color, foco
  visible, títulos de gráfica para lector de pantalla, estados finales sin JS y
  en print (GOV.UK: "This is for everyone").
- **Palanca de contexto**: kpi/tarjetas que elevan al hover, timeline que se
  dibuja, contadores que suben → el lector siente que el informe "responde"
  (heurística #1: visibilidad del estado del sistema).
- **Datos reales o nada**: nunca inventar series; si falta el dato, omitir la
  pieza y explicarlo (GOV.UK: "Design with data").

## Interactividad (solo modo interactivo)

- Alpine.js inline desde `assets/alpine.min.js` dentro de `<script>`.
- Patrones: tabs de sección/período, filtro por región, tooltip en gráficas
  (sobre datos estáticos), toggle modo oscuro (`data-theme` en `<html>` + CSS variables).
- Si el tamaño justifica no cargar Alpine (informes simples), usa JS vanilla
  mínimo inline (menos de 40 líneas) para tabs/tooltips.
- La interactividad convive con las animaciones `data-*` (no las sustituye).
- El contenido esencial funciona sin JS. Los tabs y filtros usan un patrón
  completo de teclado/ARIA (`tablist`, `tabindex` rotativo, `aria-selected`,
  paneles etiquetados y foco gestionado), no solo un click.
- El toggle de modo oscuro declara `color-scheme:dark` en su bloque CSS.

## Accesibilidad

La norma completa vive en `references/accesibilidad-ux.md` (baseline
obligatorio + checklist de entrega). Resumen de los puntos de diseño que
corresponden a este documento:

- Contraste: texto ≥ 4.5:1 (AA); grande ≥ 3:1. Verifica primary sobre surface.
  El validador mide `--text`/`--muted` sobre `--surface` y `--text` sobre `--bg`.
- Texto por color: acompaña todo color con símbolo, texto o patrón. **El color
  nunca es la única señal.**
- Tablas con `<caption>`, `<thead>` y `<th scope>`; gráficas con nombre accesible
  (`role="img"` + `aria-label`/`<title>`) y leyenda cuando hace falta; SVG
  decorativos con `aria-hidden="true" focusable="false"`.
- Foco visible: `:focus-visible` con outline de 3px y `outline-offset` (ya
  incluido en la plantilla). Nunca `outline:none` sin sustituto.
- Skip link + `<main id="contenido" tabindex="-1">`; `nav` con `aria-label`.
- Target táctil ≥ 24px general, 44px recomendado en móvil para controles primarios.
- Navegación por teclado funcional en modo interactivo (tabs con `role="tablist"`).
- Reflow: `text-wrap:balance` en títulos, `text-wrap:pretty` en prosa,
  `overflow-wrap:anywhere` para tokens largos. Sin `overflow-x:hidden` como parche.
- `color-scheme` y `theme-color` coherentes con el tema; con
  `data-theme="dark"`, `color-scheme:dark` en el bloque CSS.

## Identidad (obligatorio en todo informe)

El bloque de identidad (logo, nombre, contacto, autor) definido en Fase 1 se
reutiliza en: portada, header de página y footer. La skill debe usar el MISMO
logo y los MISMOS datos en los tres sitios para coherencia de marca.