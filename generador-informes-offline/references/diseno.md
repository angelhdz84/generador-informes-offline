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
- **Espaciado** (escala 4): `4, 8, 12, 16, 24, 32, 48, 64`.
- **Ritmo de página**: secciones separadas 48px; contenido dentro de tarjetas 24px.

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

## Animaciones (por defecto, elegantes y sobrias)

El skeleton + `assets/motion.min.js` animan por defecto, sin configuración:

- `data-reveal` (fade+subida), `data-grow` (barras), `data-draw` (trazos),
  `data-pop` (donut/ring), `data-count` (contadores), `data-stagger` (escalonado).
- **Reglas obligatorias**: (1) el contenido se ve completo sin JS y al imprimir;
  (2) `prefers-reduced-motion: reduce` desactiva todo (el script añade `html.no-anim`);
  (3) solo `transform`/`opacity`/`stroke-dashoffset` (compositor rápido); (4) una
  animación por elemento al entrar en viewport; (5) duraciones 0.5-1.1s, sin loops.
- Referencia de uso: tabla de animación en `references/svg-charts.md`.

## Interactividad (solo modo interactivo)

- Alpine.js inline desde `assets/alpine.min.js` dentro de `<script>`.
- Patrones: tabs de sección/período, filtro por región, tooltip en gráficas
  (sobre datos estáticos), toggle modo oscuro (`data-theme` en `<html>` + CSS variables).
- Si el tamaño justifica no cargar Alpine (informes simples), usa JS vanilla
  mínimo inline (menos de 40 líneas) para tabs/tooltips.
- La interactividad convive con las animaciones `data-*` (no las sustituye).

## Accesibilidad

- Contraste: texto ≥ 4.5:1 (AA); grande ≥ 3:1. Verifica primary sobre surface.
- Texto por color: acompaña todo color con símbolo, texto o patrón.
- Tablas con `<caption>`; gráficas con `<title>` + leyenda; alternativas textuales.
- Foco visible: `:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; }`.
- Target táctil ≥ 44px si es interactivo.
- Navegación por teclado funcional en modo interactivo (tabs con `role="tablist"`).

## Identidad (obligatorio en todo informe)

El bloque de identidad (logo, nombre, contacto, autor) definido en Fase 1 se
reutiliza en: portada, header de página y footer. La skill debe usar el MISMO
logo y los MISMOS datos en los tres sitios para coherencia de marca.