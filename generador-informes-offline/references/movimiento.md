# Sistema de animación (elegante y sobrio)

Guía del motor de animación del skeleton (`assets/plantilla-base.html` +
`assets/motion.min.js`). La animación es **opt-in por atributo**: un elemento
solo se mueve si lleva un `data-*`. Si el informe no usa ninguno, no se
incrusta el runtime. Cuando se usa, aporta lectura con un acabado profesional
y contenido; nada de efectos llamativos.

Los criterios normativos de movimiento están en `references/accesibilidad-ux.md`
§8. Este documento explica el cómo.

## Reglas de oro

1. **Mejora progresiva**: sin JS el documento se ve COMPLETO. La animación
   solo añade entrada suave; nunca oculta contenido de forma permanente.
2. **`prefers-reduced-motion`**: si el sistema lo pide, el script añade
   `html.no-anim` y el CSS fuerza el estado final (todo visible al instante).
3. **Print**: en `@media print` todas las animaciones se fuerzan a su estado
   final (CSS del skeleton). Un PDF nunca sale con elementos a media animación.
4. **Solo propiedades baratas**: `transform`, `opacity`, `stroke-dashoffset`.
   Sin animar `width`, `top`, `left`, `margin` (causan reflow). Nunca
   `transition: all`: declara las propiedades explícitamente.
5. **Una vez por elemento**: la animación corre al entrar en viewport y no se
   repite. Sin loops, sin retrasos largos.
6. **Momento focal, no cascada**: en modo lectura una secuencia memorable
   (`data-stagger`) es mejor que reveals repetidos en cada bloque.
7. **Escala no singular**: nunca empieces en `scale(0)`. Parte de `scale(.2)` o
   usa solo opacidad; `scale(0)` rompe la reversibilidad y produce CLS.
8. **Interrumpible**: las transiciones de UI se cancelan al cambiar de estado;
   evita animaciones de propiedades que no se puedan interrumpir.
9. **Gating `html.js`**: todo selector que aplique el estado inicial oculto
   (`opacity:0`, `visibility:hidden`) a un elemento `data-*` va detrás de la
   clase que solo añade el JS:

   ```css
   /* MAL: sin JS el contenido queda invisible para siempre */
   [data-reveal]{opacity:0;transform:translateY(16px)}

   /* BIEN: sin la clase .js la regla no existe y el contenido se ve */
   html.js:not(.no-anim) [data-reveal]{opacity:0;transform:translateY(16px)}
   ```

   `motion.min.js` añade `js` a `<html>` como primera cosa. Es lo que convierte la
   regla 1 (mejora progresiva) en algo verificable: el validador (C6) falla si
   encuentra un estado inicial oculto sin gate. `.no-anim` es una clase aparte
   (`prefers-reduced-motion`); no sustituye al gate.

## Duraciones y easing

El skeleton expone tres tokens en `:root`; úsalos en lugar de valores sueltos:

```css
--motion-ease: cubic-bezier(0.23, 1, 0.32, 1);
--motion-duration: 240ms;
--motion-delay: 80ms;
```

| Caso | Duración | Curva |
|---|---|---|
| Feedback inmediato (hover, foco, cambio de estado) | 100–150 ms | `--motion-ease` |
| Estado de componente (abrir/cerrar un panel, activar una fila) | 150–300 ms | `--motion-ease` |
| Entrada de contenido (`data-reveal`, `data-grow`, `data-pop`, `data-water`) | `--motion-duration` (240 ms) | `--motion-ease` |
| Contador (`data-count`) | 240 ms con tope de 280 ms | lineal |
| Trazado (`data-draw`) | 1.1 s | `--motion-ease` — excepción de lectura secuencial |
| Momento focal único (portada, reveal del resumen) | 500–800 ms | `--motion-ease`, una sola vez |

- El `data-draw` de 1.1 s es la única excepción larga: dibuja la serie como si
  se trazara. No se replica en UI ni en micro-interacciones. Usa
  `--motion-ease` (no `ease` genérico) para que el trazado tenga la misma
  deceleración que el resto del sistema.
- `data-stagger`: máximo 80 ms de delay por hijo y 500 ms de retraso total
  (`min(var(--d, 0ms), var(--motion-delay))`).
- El runtime (`motion.min.js`) ya aplica el tope de 80 ms por hijo; no hace
  falta calcularlo a mano.

## Atributos disponibles

| Atributo | Efecto | Uso |
|---|---|---|
| `data-reveal` | fade + subida 16px | secciones, tarjetas, leyendas, análisis |
| `data-slide` | fade + desliz lateral/direccional | listas, columnas comparativas, piezas que entran desde un lado |
| `data-stagger` | escala a los hijos (80 ms máx.) | contenedor de tarjetas / grupo de barras |
| `data-grow` | crece desde la base (parte de `scale(.2)`, nunca `scale(0)`) | `<rect>` de barras (vertic./horiz.) |
| `data-draw` | se dibuja el trazo (1.1 s, excepción secuencial) | línea/área/sparkline/gauge/timeline (un solo path o circle) |
| `data-pop` | escala suave (0.88 → 1) | donut/pie, progress ring (grupos), nodos de timeline |
| `data-count` | cuenta de 0 al valor (240 ms, tope 280 ms) | valores KPI, stat blocks |
| `data-water` | fundido de fondo decorativo | patrón SVG del hero, marca de agua discreta |

## Variante `data-slide`

- Por defecto desliza desde abajo (22px) con fade. Dirección opcional con
  `data-from="left|right|up|down"`:

  ```html
  <div class="compare-col" data-slide data-from="left">…</div>
  <div class="compare-col" data-slide data-from="right">…</div>
  ```

- Ideal para efectos "antes/después" o columnas que entran desde lados opuestos.
- Respeta reduced-motion y print igual que el resto (fuerza estado final).

## Uso correcto

```html
<!-- contador: el valor final ya está en el DOM (fallback sin JS) -->
<span data-count data-to="1240000" data-suffix=" €">1.240.000 €</span>

<!-- barra: crece desde la base al entrar -->
<rect class="bar" data-grow style="--d:180ms" …></rect>

<!-- grupo escalonado -->
<div class="kpis" data-stagger>
  <div class="kpi" data-reveal>…</div>
  <div class="kpi" data-reveal>…</div>
</div>

<!-- donut: escala suave -->
<g data-pop>…sectores…</g>

<!-- línea que se dibuja: motion.js calcula --len automáticamente -->
<path data-draw d="…"></path>
```

## Contadores (`data-count`)

- `data-to`: número final (puede llevar decimales con `data-dec="1"`).
- `data-suffix`: texto tras el número (`" €"`, `" %"`).
- Formato siempre es-ES vía `Intl.NumberFormat` (miles con `.`, decimales con `,`).
- El contenido del elemento es el valor final formateado: es lo que se ve si el
  JS no corre o el usuario imprime antes de entrar.

## Trazados (`data-draw`)

- motion.js mide `getTotalLength()` y fija `--len`; el CSS usa
  `stroke-dasharray`/`stroke-dashoffset` para el "dibujado".
- Un solo path/circle por elemento animado. Para donuts multi-sector usa
  `data-pop` en el grupo (no `data-draw` por sector).
- Progress ring: usa `data-draw` sobre el círculo `.value` para el barrido.

## Barras horizontales (`.mbar`)

Comparativas por ítem con relleno que crece de izquierda a derecha (usa
`data-grow`, pero el skeleton lo redefine a `scaleX` dentro de `.mbar`):

```html
<div class="mbars" data-stagger>
  <div class="mbar"><span class="mbar-label">Backup</span>
    <span class="mbar-track"><span class="fill" data-grow style="--w:40%;--d:0ms"></span></span>
    <span class="mbar-val">40 %</span></div>
  <div class="mbar">…</div>
</div>
```

- Fijar el ancho final con `style="--w:XX%"` (el CSS arranca en 0).
- Portable: sin `data-grow` el relleno aparece directo con su ancho (no-JS/print).

## Sello de estado pulsante (`.status-dot`)

Chicle pequeño con punto verde que pulsa 2 veces al cargar (animación finita,
no loop) — ideal para el hero o paneles "operativo/activo":

```html
<span class="status-dot on-light"><i></i> Web operativa</span>
```

- Variante oscura: sin `.on-light` (texto blanco sobre fondo del hero).
- El `@keyframes dotPulse` queda en la plantilla; bajo `prefers-reduced-motion`
  no se anima.

## Micro-interacciones hover (toques premium)

La plantilla incluye respuestas sutiles al puntero - solo `transform`/opacidad,
duración `var(--motion-duration)` y SOLO bajo `html.js:not(.no-anim)`. EXCEPCIÓN:
el tooltip no es una animación sino contenido, así que también se muestra con
`prefers-reduced-motion` (con JS y sin reduce se añade un fade).

- **Tooltip** (`.tip-zone` + `.tip`): enseña la ayuda del ítem al hover/foco.
  Es un extra: la línea "Lectura:" sigue siendo obligatoria bajo la pieza, y la
  información importante se escribe en el flujo principal, disponible con foco.
- **Zoom de iconos**: `.hl-ic svg`, `.kpi-head svg` y numerales `.recs .rnum`
  crecen ~1.1-1.15× al hover de su tarjeta.
- Regla print: estas interacciones no existen en papel (`.tip` se fuerza a
  `display:none`); el estado final de lo relevante lo dan las reglas `data-*`.
- El skip link (`.skip-link`) se revela con `transform:translateY(0)` (nunca con
  `top`, que provoca reflow) y se fuerza a `display:none` en print.

## Antipatrones

- No `data-grow` sobre texto ni sobre contenedores con padding (deforman).
- No combinar `data-draw` con elementos que ya tengan `stroke-dasharray` de
  sector (rompe la geometría): usa `data-pop`.
- No animar desde `display:none` → `block`: el IntersectionObserver no dispara
  bien; usa opacidad + transform.
- No más de un `data-count` en el mismo contenedor si compiten por el stagger
  visual: dales `--d` escalonado con `data-stagger` en el padre.
- No `scale(0)` como estado inicial: usa `scale(.2)` o solo opacidad.
- No `transition: all`: nombra las propiedades (`opacity`, `transform`, ...).
- No revelar cada bloque con un `data-reveal` por sección: elige un momento
  focal y deja el resto estático.
- No valores de duración sueltos: usa `var(--motion-duration)`,
  `var(--motion-ease)` y `var(--motion-delay)`.
- No repetir el patrón decorativo `data-water` en varias secciones: es un acento
  para la portada.
- No depends del hover para información importante (ver tooltip más arriba).
