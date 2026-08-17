# Sistema de animación (elegante y sobrio)

Guía del motor de animación del skeleton (`assets/plantilla-base.html` +
`assets/motion.min.js`). Los informes se animan por defecto con un acabado
profesional y contenido; nada de efectos llamativos.

## Reglas de oro

1. **Mejora progresiva**: sin JS el documento se ve COMPLETO. La animación
   solo añade entrada suave; nunca oculta contenido de forma permanente.
2. **`prefers-reduced-motion`**: si el sistema lo pide, el script añade
   `html.no-anim` y no se anima nada (todo visible al instante).
3. **Print**: en `@media print` todas las animaciones se fuerzan a su estado
   final (CSS del skeleton). Un PDF nunca sale con elementos a media animación.
4. **Solo propiedades baratas**: `transform`, `opacity`, `stroke-dashoffset`.
   Sin animar `width`, `top`, `left`, `margin` (causan reflow).
5. **Una vez por elemento**: la animación corre al entrar en viewport y no se
   repite. Duraciones 0.5–1.1s, sin loops, sin retrasos largos (máx 500ms).

## Atributos disponibles

| Atributo | Efecto | Uso |
|---|---|---|
| `data-reveal` | fade + subida 16px | secciones, tarjetas, leyendas, análisis |
| `data-stagger` | escala a los hijos (90ms) | contenedor de tarjetas / grupo de barras |
| `data-grow` | crece desde la base | `<rect>` de barras (vertic./horiz.) |
| `data-draw` | se dibuja el trazo | línea/área/sparkline/gauge (un solo path o circle) |
| `data-pop` | escala suave | donut/pie, progress ring (grupos) |
| `data-count` | cuenta de 0 al valor | valores KPI, stat blocks |

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

## Antipatrones

- No `data-grow` sobre texto ni sobre contenedores con padding (deforman).
- No combinar `data-draw` con elementos que ya tengan `stroke-dasharray` de
  sector (rompe la geometría): usa `data-pop`.
- No animar desde `display:none` → `block`: el IntersectionObserver no dispara
  bien; usa opacidad + transform.
- No más de un `data-count` en el mismo contenedor si compiten por el stagger
  visual: dales `--d` escalonado con `data-stagger` en el padre.
