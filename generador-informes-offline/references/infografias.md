# Infografías (bloques visuales reutilizables)

Bloques autocontenidos en HTML+CSS+SVG inline que comunican de un vistazo.
Se combinan con las gráficas de `svg-charts.md` dentro de las secciones.

## KPI card (tarjeta de indicador)

```html
<div class="kpi">
  <div class="kpi-head">
    <span class="kpi-icon"><svg class="icon"><use href="#i-trending-up"></use></svg></span>
    <span class="kpi-label">Ingresos Q1</span>
  </div>
  <div class="kpi-value"><span data-count data-to="1240000" data-suffix=" €">1.240.000 €</span></div>
  <div class="kpi-delta up">▲ 12,4 % vs Q4</div>
  <svg class="spark" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true"><path data-draw d="…"/></svg>
</div>
```

Reglas:
- Valor = dato principal, destacado tipográficamente (2-3× el tamaño de la etiqueta).
- Contador `data-count` por defecto (el valor final va ya en el DOM como fallback).
- Delta con color: `--success` si sube, `--danger` si baja, texto plano si es neutral.
- Sparkline debajo (receta en `svg-charts.md` §3) con `data-draw`.
- Máximo 6 KPI en el resumen ejecutivo, en grid responsivo (1 col móvil / 2-3 col desktop).
- Las tarjetas llevan `data-reveal` y su grid `data-stagger`.

## Stat block (bloque de dato destacado)

Sin tarjeta: número gigante + etiqueta + contexto en una línea. Útil en medio de
una sección para enfatizar un dato (ej. "68 % de clientes repiten compra").

```html
<div class="card stat" data-reveal>
  <div class="stat-value"><span data-count data-to="68" data-suffix=" %">68 %</span></div>
  <div class="stat-label">Clientes que repiten compra</div>
  <div class="stat-ctx">vs 61 % el trimestre anterior</div>
</div>
```

## Progress ring (anillo de avance)

Para cumplimiento de objetivos o % de un total (grid de 2-4 anillos).

```html
<div class="ring" data-pop>
  <svg viewBox="0 0 76 76" aria-hidden="true">
    <circle class="track" cx="38" cy="38" r="34"></circle>
    <circle class="value" cx="38" cy="38" r="34" data-draw style="--len:213.6;stroke:var(--primary)"></circle>
  </svg>
  <span class="pct">86 %</span>
</div>
```

- `r=34` → circunferencia 213,6 (puedes ajustar el `--len` si cambias el radio).
- Para representar un % concreto, combina `stroke-dasharray="P*2.136 213.6"` en el atributo
  (el `data-draw` anima el "sweep" de descubrimiento; el valor final se fuerza en print).
- Etiqueta de objetivo y diferencia debajo, p. ej. "Meta 90 % · -4 pts".

## Panel "Lo más importante"

Aparece justo después de la portada (y antes del resumen ejecutivo): 2-4 hallazgos
que el lector debe recordar. Reemplaza al resumen cuando el informe es largo.

```html
<section class="highlights" data-stagger>
  <div class="h2wrap"><h2>Lo más importante</h2></div>
  <div class="hl-grid">
    <div class="hl" data-reveal>
      <span class="hl-ic good"><svg class="icon"><use href="#i-trending-up"></use></svg></span>
      <p><strong>+9 % en marzo</strong> gracias a la campaña; el canal online ya pesa el 61 %.</p>
    </div>
    ...
  </div>
</section>
```

- `hl-ic` coloreado por semántica: `good` (verde), `warn` (ámbar), `danger` (rojo), base (primary).
- Una idea por tarjeta, con verbo y cifra. Icono del sprite que refuerce la idea.

## Índice (TOC) navegable

En informes largos (>6 secciones) va tras la portada:

```html
<nav class="toc" aria-label="Índice">
  <h2>Índice</h2>
  <ol>
    <li><a href="#seccion-1">Resumen ejecutivo</a></li>
    <li><a href="#seccion-2">Evolución de ventas</a></li>
    ...
  </ol>
</nav>
```

- Cada `<section>` de contenido lleva `id`; enlaces con `href="#id"` (anclas locales, siguen siendo 0-internet).
- Los números de la lista son automáticos (CSS counters). En print los enlaces se imprimen planos (mismo documento).

## Donut con total central

Donut (svg-charts.md §4) con centro que muestra el total o el % principal.
Perfecto para distribución (ventas por canal, gasto por categoría). El grupo de
sectores lleva `data-pop` y la leyenda `data-reveal`.

## Funnel de conversión

Para procesos: visitas → leads → ventas. Cada etapa como trapecio con su valor
y el % de conversión entre etapas en el intersticio.

## Timeline

Cronología de hitos/eventos (lanzamientos, logros, entregables). Ver §11 de
`svg-charts.md`. Ideal para la sección de "contexto" o "evolución".

## Proceso en N pasos (1-3-5-7)

```html
<ol class="steps">
  <li><span class="step-num">1</span><h4>Definir</h4><p>…</p></li>
  <li><span class="step-num">2</span><h4>Medir</h4><p>…</p></li>
</ol>
```

- Números en círculo con `--primary`; conectores entre pasos (pseudoelemento o borde).
- 2-4 pasos lado a lado en desktop, apilados en móvil.

## Comparativa lado a lado

Ver §12 de `svg-charts.md`. Usar cuando se comparan 2-3 entidades/escenarios en
varias dimensiones (antes/después, producto A vs B, trimestres).

## Progress bars

Barras de avance con etiqueta y % (ej. cumplimiento por área). Variantes:
sólida, segmentada, con hito. El relleno lleva `data-grow` (crece desde la base)
y el % suele ser un `data-count` si es un número protagonista.

## Barras in-cell (en tablas)

Para comparar filas de una tabla sin gráfica aparte (ver `svg-charts.md` §10):
`<td class="cell-bar" style="--w:85;--bc:var(--success)">85 %</td>`. El color
semántico comunica estado: verde = bueno, ámbar = vigilar, rojo = riesgo.

## Heatmap / matriz de prioridad

Matriz 2×2 (Impacto × Esfuerzo) o heatmap de actividad. Para priorización y
análisis. Con leyenda de gradiente.

## Callout / destacado

```html
<aside class="callout">
  <strong>Hallazgo clave:</strong> …una frase de impacto extraída de los datos…
</aside>
```

- Estilos: info (primario), advertencia (ámbar), alerta (rojo), éxito (verde).
- Un callout por sección como máximo; debe sintetizar un hallazgo real de los datos.

## Badges / etiquetas

Píldoras para estados: `Cumplido`, `En curso`, `Riesgo`. Colores semánticos de
la paleta. Usar en tablas y cabeceras de sección.

## Insignia de tendencia

Flecha + % acompañando cifras: ▲ 12 % (subida), ▼ 3 % (baja), → 0 % (plana).
Siempre con el color semántico correspondiente.

## Reglas de composición de infografía

- Una sola idea dominante por bloque; el resto es soporte.
- Jerarquía visual: valor > etiqueta > contexto.
- Máximo 3 colores de acento por infografía (además de neutros).
- Informes con >6 secciones llevan TOC (navegable) + panel "Lo más importante".
- Respeta `prefers-reduced-motion` en cualquier animación; usa `data-*` del skeleton.
- Si el bloque no aporta a la sección, sácalo: la claridad gana a la decoración.
- Todos los iconos del sprite `assets/iconos.svg`; nunca emojis como fuente única.
- Toda infografía con cifra protagonista admite `data-count`; el valor final va siempre en el HTML.