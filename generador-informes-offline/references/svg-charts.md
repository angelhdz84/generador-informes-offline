# Recetas de gráficas SVG (100% offline)

Todas las gráficas se dibujan como SVG inline estático (o animado con CSS/JS
vanilla si se elige modo interactivo). El objetivo: que la geometría se calcule
en generación y el archivo resultante NO necesite ninguna librería.

## Convenciones generales

- `viewBox` común de trabajo: `0 0 600 H` (ancho 600; alto variable según el tipo).
- `preserveAspectRatio="xMidYMid meet"` para que escale.
- Cada gráfica se envuelve en un contenedor con clase `.chart` y lleva un `<title>` descriptivo.
- El SVG informativo lleva `role="img"` y nombre accesible:
  `role="img" aria-label="…"` o `aria-labelledby="id"` apuntando a su `<title>`
  (único en la página). Si la gráfica es puramente decorativa,
  `aria-hidden="true"`.
- Colores desde la paleta (`assets/paletas.json`), campo `chart` (serie categórica) o `primary`/`secondary`.
- Textos con `font-family: inherit` (heredan el system font stack).
- Redondea valores a 1 decimal en etiquetas; formatea miles y % según locale es-ES.
- El color nunca es la única señal: la serie va marcada con etiqueta, y los
  deltas/estados llevan signo (`+9 %`, `−4 pts`) además del color.

## Animación de gráficas (opt-in, elegante y sobria)

La animación se activa **por atributo**: una gráfica sin `data-*` es estática y
correcta. Usa las clases CSS/JS del skeleton (`assets/plantilla-base.html` +
`assets/motion.min.js`). El contenido SIEMPRE debe verse completo sin JS y al
imprimir; la animación es mejora progresiva. Duraciones, easing y reduced motion
en `references/movimiento.md`.

| Atributo | Efecto | Uso típico |
|---|---|---|
| `data-reveal` | fade + subida suave | secciones, tarjetas, leyendas, análisis |
| `data-slide` | fade + desliz direccional (`data-from`) | columnas comparativas, listas |
| `data-stagger` (contenedor) | escalona a los hijos (80 ms máx.) | grupo de barras o tarjetas |
| `data-grow` | crece desde la base (desde `scale(.2)`) | barras verticales/horizontales (`<rect>`) |
| `data-draw` | se dibuja trazo a trazo (1.1 s) | líneas, áreas (borde), sparklines, gauge |
| `data-pop` | escala suavemente (0.88 → 1) | donut/pie, progress ring |
| `data-count` | contador animado (240 ms) | valores KPI, stat blocks |

- Los elementos animados llevan `class="..." data-grow` etc. en el mismo elemento SVG.
- El motor respeta `prefers-reduced-motion` y no anima en `@media print` (fuerza el estado final).
- No sobreanimar: cada elemento se anima UNA vez al entrar en viewport. Elige
  una gráfica focal por sección; el resto puede quedar estática.

Fórmulas útiles:

```
px = min + (valor - minVal) / (maxVal - minVal) * (max - min)   // normalización lineal
```

## 1. Barras verticales

Datos: serie de valores + etiquetas.

```
ancho util = 600 - paddingI - paddingD           // paddingI=40 (eje Y), paddingD=20
barSlot   = ancho util / n
barWidth  = barSlot * 0.6
x(i)      = paddingI + barSlot * i + (barSlot - barWidth) / 2
h(i)      = (valor(i) - min) / (max - min) * plotH
y(i)      = plotTop + plotH - h(i)
```

Estructura por barra:

```svg
<g data-stagger>
  <rect x="..." y="..." width="..." height="..." rx="3" fill="var(--primary)" data-grow style="--d:0ms"/>
  ...
</g>
<text x="..." y="..." text-anchor="middle" class="val-label">VALOR</text>
```

- **Etiqueta de valor**: SIEMPRE sobre cada barra (o a la derecha en horizontales),
  texto pequeño `fill="var(--muted)"`. Es la norma; no hacer esperar al lector.
- **Línea de meta** (si hay objetivo): línea horizontal `stroke="var(--secondary)"`
  con `stroke-dasharray="4 4"` a la altura de la meta + etiqueta "Meta X" en su extremo.
- **Anotaciones** (pico/valle/campaña): pequeño rótulo sobre el punto destacado
  (`<text>` + línea guía), p. ej. "Campaña marzo".
- Barras agrupadas: duplica la serie desplazando `x` por `grupoWidth / nSeries`.
- Barras apiladas: dibuja de abajo hacia arriba acumulando `y` y `height`.
- Eje Y con 3-5 ticks: dibuja línea de grid + etiqueta. Eje X con las etiquetas debajo rotadas si son largas.

## 2. Barras horizontales

Ideal para rankings (top N). Invierte los ejes:

```
barH  = slot * 0.6          // alto por barra
w(i)  = (valor - min) / (max - min) * plotW
```

La etiqueta del valor va a la derecha del rect; la del ítem a la izquierda.

## 3. Líneas y áreas

Datos: serie de puntos (x, valor) ordenados cronológicamente.

```
x(i) = paddingI + i * (anchoUtil / (n-1))
y(i) = plotTop + plotH - (valor(i) - min)/(max-min) * plotH
```

- Polilínea con `stroke="var(--primary)" stroke-width="2.5" fill="none"` y `stroke-linejoin="round"`, con `data-draw` para que se dibuje al entrar.
- Área: cierra el path hasta la línea base y rellena con `fill="url(#grad-area)"` (gradiente lineal vertical de `primary` a transparente). El borde del área se dibuja (data-draw); el relleno aparece ya con opacidad baja.
- Puntos: `<circle r="3.5">` en cada vértice; el último (o el máximo) destacado con círculo de `--secondary` + etiqueta de valor.
- **Línea de meta** (target): línea horizontal dashed `--secondary` + etiqueta "Meta"; si la serie la cruza, señala el cruce con un punto y rótulo.
- **Anotaciones**: pico, valle, evento o campaña → rótulo corto sobre el punto con línea guía. Máx 2-3 anotaciones por gráfica para no ensuciar.
- **Etiquetas de valor** (series cortas, ≤10 puntos): valor sobre cada punto; series largas solo marcan min/max/último.
- Si hay 2+ series, segunda serie con `--secondary` y leyenda.
- **Sparkline** (en tarjetas KPI): versión miniatura `viewBox="0 0 120 32"`, sin ejes, solo línea + relleno suave; último punto destacado con círculo.

## 4. Pie y donut

Geometría de arco (de 0° a 360°, en sentido horario desde las 12):

```
a0 = ángulo inicial, a1 = ángulo final (rad)
x0 = cx + r*cos(a0), y0 = cy + r*sin(a0)
x1 = cx + r*cos(a1), y1 = cy + r*sin(a1)
large = (a1 - a0) > PI ? 1 : 0
d = M cx cy L x0 y0 A r r 0 large 1 x1 y1 Z
```

- Pie: r fijo. Donut: trazo grueso o arco anular con `stroke-width`.
- **Donut con separación** (máx 6 sectores): cada sector como arco con `stroke-width` y un pequeño gap (reduce `stroke-width` del sector o dibuja cada arco con 1-2px menos de radio), dejando líneas de separación limpias. Para más sectores usa el donut contiguo.
- **Donut con centro**: `<text>` en el centro con el total o el % principal (título corto arriba del número, contexto abajo). El centro es el dato "de un vistazo" de la distribución.
- El grupo de sectores lleva `data-pop` (escala suave al entrar).
- Cada sector con su color de serie + leyenda al lado con icono/color y etiqueta + %.
- Si hay muchos sectores (>7), agrupa en "Otros".

## 5. Radar / araña

Datos: n ejes, cada uno con valor 0-100.

```
ángulo(j) = -90° + j * (360° / n)
x(j) = cx + r * cos(rad) ; y(j) = cy + r * sin(rad)     // r = valor/100 * rMax
```

- Dibuja la malla (polígonos concéntricos r=25/50/75/100) y las líneas de ejes.
- Relleno del polígono de datos con `fill="url(#grad-radar)"` al 40% de opacidad + borde `--primary`.
- Etiquetas de eje fuera de la malla.

## 6. Funnel / embudo

Datos: etapas con valores en orden descendente.

```
w(i) = plotW * (valor(i) / valor(1))     // primera etapa = 100%
x(i) = (plotW - w(i)) / 2
```

- Trapecios consecutivos (centrar cada uno) con color degradado del mismo tono.
- Porcentaje de conversión entre etapas en la franja entre trapecios.
- Etiqueta a la derecha: etapa + valor + % del total.
- Alternativa rápida sin SVG: `.funnel` con `.f-step` (`--w` por paso) del skeleton;
  el último paso con `.f-dim` para señalar abandono.

## 7. Gauge / medidor

Datos: valor actual, mínimo, máximo, zonas (buena/media/mala).

```
ángulo = -180° + (valor-min)/(max-min) * 180°   // semicírculo
```

- Arco base de 180° (grid) en gris claro, arco de progreso en `--primary` (o zona).
- Aguja (línea desde centro) o marcador con radio al valor.
- `<text>` central con el valor y la unidad.
- Usa el contenedor `.gauge` del skeleton: el SVG dentro y el valor en
  `.gauge-center` (fila `<strong>` valor + `<small>` unidad).

## 8. Heatmap

Datos: matriz filas×columnas.

```
cellW = plotW / cols ; cellH = plotH / rows
fill(i,j) = escala de color según valor normalizado
```

- Escala simple: `rgba(primary, opacidad)` con opacidad = valor normalizado (mín 0.08).
- Etiquetas de fila/columna en bordes; color del texto según luminancia del fondo.
- Leyenda de gradiente debajo con min/medio/max.

## 9. Treemap

Datos: grupos con valores. Particionar recursivamente el área por peso:

```
x(t) = left + (right-left) * acumulado / total
```

- Ordena descendente, corta en filas (squarify simplificado) o columnas alternadas.
- Cada rect con color de la paleta, etiqueta del grupo y valor.
- Útil para distribución de cartera, gastos por categoría, participación.

## 10. Progress bars, contadores y barras in-cell

- Barra: `<div class="progress"><div class="progress-fill" style="width: X%">` con CSS de `references/diseno.md`. El relleno lleva `data-grow` (crece desde la base).
- Contador KPI: cifra grande con `<span data-count data-to="1240000" data-suffix=" €">1,24 M€</span>`, formato es-ES, flecha de tendencia (▲/▼ con color éxito/peligro). El valor final YA está en el DOM como fallback (si el JS no corre, se ve el número completo).
- **Barras in-cell** (dentro de tablas, ideal para comparar filas): en el `<td>`:
  ```html
  <td class="cell-bar" style="--w:85;--bc:var(--success)">85 %</td>
  ```
  La barra se dibuja en la base de la celda (CSS del skeleton). `--w` es el % (0-100),
  `--bc` el color (verde=bueno, ámbar=alerta, rojo=riesgo según el caso).
- Contador animado y barras: resaltar que respetan `prefers-reduced-motion` y el modo print.
- La barra in-cell no es la única señal: la celda lleva el valor en texto
  además del color, y `--bc` acompaña a un texto/etiqueta cuando el tono
  significa algo.

## 11. Timeline horizontal

- Línea base horizontal con `--muted`.
- Hitos como círculos sobre la línea; altos y bajos se alternan arriba/abajo.
- Cada hito: fecha + título + descripción corta. Conectores verticales cortos.

## 12. Comparativas lado a lado

- Dos (o tres) columnas con encabezado (logo/nombre), 3-6 métricas alineadas como filas, cada fila con mini-barra o valor destacado.
- Resaltar al ganador por fila con `--success` y check.
- Mejor que una tabla genérica cuando se comparan pocas entidades en muchas dimensiones.
- Contenedor del skeleton: `.compare` con `.compare-col` (grid de 2). Para
  antes/después usa `[data-slide data-from="left|right"]` en cada columna.

## Análisis bajo cada gráfica (obligatorio)

Cada gráfica va seguida de **1-2 frases de interpretación** que extraigan el
hallazgo real de los datos. Es la norma de la skill: la gráfica muestra, el
análisis explica. Formato:

```html
<p class="chart-caption">
  <strong>Lectura:</strong> marzo marca el mejor mes del trimestre (+9 %)
  gracias a la campaña; el canal online consolida el 61 % de los ingresos.
</p>
```

- Empieza por "Lectura:" para separarlo del pie descriptivo de la gráfica.
- Di QUÉ pasa y POR QUÉ importa; nunca describas la mecánica ("las barras suben").
- Si hay una anomalía (pico, caída, dato fuera de meta), menciónala y, si se sabe, su causa.
- Cuando aplique, apunta al dato del apéndice que lo respalda.
- "Lectura:" **no sustituye** el dato exacto: es interpretación. Si el lector
  necesita el valor, la tabla o lista del apéndice lo da.

## Checklist por gráfica

- [ ] `<title>` descriptivo y único en el documento
- [ ] `role="img"` + `aria-label`/`aria-labelledby` (o `aria-hidden="true"` si es decorativa)
- [ ] Leyenda clara (salvo sparkline)
- [ ] Ejes etiquetados cuando aplique, con unidades
- [ ] Etiquetas de valor visibles (serie corta) o min/max/último (serie larga)
- [ ] Formato es-ES de números
- [ ] Colores desde la paleta, no valores sueltos; el color no es la única señal
- [ ] Animación `data-*` solo si aporta lectura (opt-in), con los tokens de motion
- [ ] Estado final correcto sin JS / con reduced-motion / en print
- [ ] 1-2 frases de "Lectura:" bajo la gráfica
- [ ] Dato exacto disponible en tabla o lista (apéndice) si la serie es compleja
- [ ] Sin dependencia externa: todo inline en el archivo

Ver `references/accesibilidad-ux.md` §5 para el criterio completo de nombre
accesible, unidades y alternativa textual.