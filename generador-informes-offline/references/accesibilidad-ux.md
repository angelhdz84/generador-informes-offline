# Accesibilidad, lectura y calidad UX

Baseline normativo para informes offline. Complementa a `diseno.md` y
`movimiento.md`; no reemplaza la plantilla canónica ni sus componentes visuales.

## Prioridad

Cuando dos reglas entren en conflicto, gana este orden:

1. **0 internet y autocontención**.
2. **Veracidad de los datos**: no inventar, no ocultar incertidumbre.
3. **Semántica, teclado y alternativa textual**.
4. **Lectura, responsive, zoom y print**.
5. **Expresión visual y movimiento**.

## 1. Perfil de lectura

- El informe es un documento de lectura, no una landing page. La jerarquía debe
  llevar a la siguiente decisión: portada → resumen → secciones → conclusiones →
  notas → footer.
- Cada sección responde a **una pregunta principal**. Si exige recordar datos de
  otra sección, repite la cifra o el contexto mínimo junto al gráfico.
- Un único `<h1>`; después, `<h2>`–`<h4>`. El título explica el tema; la línea
  **Lectura:** explica su significado, no su mecánica.
- **Sin saltos de nivel**: de un encabezado al siguiente nunca se sube más de un
  nivel (`h2` → `h4` está prohibido, también dentro de un `li`, una tarjeta o una
  columna). En el skeleton el reparto canónico es `h1` (informe) → `h2`
  (sección, y también los encabezados de columna del footer, porque el footer es
  un landmark hermano) → `h3` (sub-elemento: pasos, pilares, celdas de
  comparativa) → `h4` (matiz dentro de un sub-elemento). Si saltas de `h2` a
  `h4`, baja a `h3` y dale `font-weight:700` explícito para conservar la
  apariencia (el `h3` base del skeleton es 600). C7 falla ante cualquier salto.
- En texto corrido, busca una medida de 65–75 caracteres. Gráficas, tablas y
  comparativas pueden ocupar el ancho disponible de su contenedor.
- Evita duplicar el mismo dato en hero, resumen, sección y conclusión.
  Repite solo lo que mejora la decisión o la comprensión.

## 2. Estructura semántica

- Un solo `<main>`; usa `header`, `nav`, `section`, `aside`, `table` y `footer`
  antes de añadir ARIA.
- El primer enlace enfocable debe ser un skip link al contenido principal:

  ```html
  <a class="skip-link" href="#contenido">Saltar al contenido principal</a>
  <main id="contenido" tabindex="-1">…</main>
  ```

- Cada `<nav>` necesita `aria-label` o `aria-labelledby` distinto.
- Las secciones enlazadas desde el TOC llevan `id` único y
  `scroll-margin-top`/`scroll-padding-top` para no quedar bajo el topbar. Ambos
  offsets **se suman**: usa un único token `--topbar-h` en
  `html{scroll-padding-top:var(--topbar-h)}` y deja
  `main[id],section[id]{scroll-margin-top:8px}`. No repitas la altura del topbar
  en los dos sitios (C12 acepta cualquier offset válido, pero la suma
  duplicada deja huecos en blanco).
- Las tablas usan `<caption>`, `<thead>` y `<th scope="col|row">` cuando
  corresponda. No simulan estructura con `<div>` ni sustituyen una tabla de
  datos por un gráfico.
- El footer es un landmark con identidad del cliente, no un sustituto de
  `<address>` para datos de contacto.

## 3. Teclado, foco y targets

- Todo lo interactivo se opera con teclado y conserva el orden de tabulación.
- `:focus-visible` debe tener contraste suficiente (3:1 frente a lo adyacente)
  y no se elimina sin sustituto.
- No uses `tabindex` positivo. `tabindex="-1"` solo para destinos programáticos
  como el `main` del skip link.
- No conviertas una tarjeta informativa en control solo para hacerla “bonita”.
  Si es interactiva, usa un enlace o botón nativo con nombre accesible.
- Target táctil: 24 px mínimo general y 44 px recomendado en móvil para
  controles primarios. Un enlace textual en una frase puede respetar la
  excepción de inline, pero no debe crear zonas muertas.
- Revisa estados hover, focus, active, selected, disabled, empty y error en
  cualquier modo interactivo. No inventes estados que el componente no usa.

## 4. Color, contraste y redundancia

- WCAG 2.2 AA es el mínimo: 4.5:1 para texto normal y 3:1 para texto grande y
  componentes. AAA es deseable, no una promesa ambigua del validador.
- El color nunca es la única señal. Acompáñalo con texto, signo, forma,
  icono o patrón.
- **Un color de acento no se usa tal cual: ni como texto ni como cromo.**
  En la paleta `ejecutivo`, medido sobre la superficie tintada, el ámbar da
  **2.15:1**, el verde **2.54:1** y el teal **2.49:1**: no llegan ni al 4.5:1 del
  texto ni al 3:1 de los elementos no textuales. Por eso hay tres mezclas con
  `--text`, cada una con su umbral:

  | Token | Umbral | Para qué |
  |---|---|---|
  | `--accent-line` (`--text` 30 %) | 3:1 | filete, línea, borde de tabla, borde de bloque |
  | `--accent-text` (`--text` 50 %) | 4.5:1 | texto del badge, del eyebrow |
  | `--accent-ink` (`--text` 68 %) | 4.5:1 | cifras grandes de KPI |

  La cuota no es una cuestión de gusto: bajar el texto del 50 % al 38 % lo deja
  en 3.8–4.3:1 en las tres series claras, y el badge de ese bloque deja de
  leerse. **C1 mide las tres cuotas** y avisa si alguna serie no llega, así que
  el defecto salta en `--strict` y no cuando alguien imprime el informe.
- Los iconos decorativos se ocultan del árbol de accesibilidad **y** del
  recorrido de foco en exploradores antiguos:

  ```html
  <svg class="icon" aria-hidden="true" focusable="false">…</svg>
  ```

  `focusable="false"` no es opcional: sin él, un SVG inline puede entrar en la
  lista de tabulación de IE/Edge heredado. C9 exige `aria-hidden` **y**
  `focusable="false"` en cada `.icon` decorativo, y lo reporta **una sola vez**
  por elemento aunque le falten las dos cosas.
- Un icono que aporta el significado debe tener texto adyacente o nombre
  accesible (`aria-label`/`aria-labelledby`).
- `<meta name="color-scheme">`, `color-scheme` en CSS y `<meta name="theme-color">`
  deben estar **presentes**, no solo coherentes, y coincidir con el tema
  inicial. `color-scheme` se declara en `:root` o `html` (C13), no en un
  componente. Los valores invertidos (por ejemplo `content="dark"` con
  `color-scheme:light`) fallan.

## 5. Gráficas, infografías y texto alternativo

- Cada gráfica tiene nombre accesible, contexto/unidades, leyenda cuando hace
  falta y valores legibles.
- “Lectura:” es la interpretación del hallazgo; **no sustituye** la
  disponible textual. Para valores exactos o series complejas añade una tabla o
  lista de datos en el apéndice.
- SVG informativo: `role="img"` con `aria-label` o `aria-labelledby` hacia un
  `<title>` único. SVG decorativo: `aria-hidden="true"`.
- Deltas, metas y estados incluyen signo o etiqueta: `+12 %`, `−4 pts`,
  `Por encima de meta`; no solo verde/rojo.
- Anillos, gauges y sparklines son opcionales. Úsalos cuando el dato los
  justifica; el número y la etiqueta deben ser legibles sin la forma.

## 6. Responsive, zoom y contenido extremo

- Revisa como mínimo 320 px, 390 px, 760 px, escritorio y zoom al 200 %.
- No uses `overflow-x:hidden` para tapar contenido que se sale. Repara la causa
  con wrapping, `min-width:0`, grids flexibles o un contenedor identificado para
  tablas.
- Toda `<table>` va dentro de un `.table-wrap` con `overflow-x:auto`, incluso
  la que cabe: es el contrato que C11 verifica (basta un único `.table-wrap` que
  cubra las tablas, y su regla CSS debe declarar el `overflow-x`). Una tabla
  ancha sin wrap hace scroll horizontal en toda la página y rompe el zoom al
  200 %.
- Los hijos de grid y flex llevan `min-width:0`; sin eso, un token largo en una
  celda expande la columna y desborda el documento.
- `srcset` y `<source>` quedan **prohibidos** aunque el valor sea un `data:` URI:
  la coma de `base64,` hace el valor inanalizable de forma fiable, así que C10 lo
  rechaza en bloque y A1 sigue capturando cualquier URL externa que se cuele en
  él. Para imágenes responsive usa un solo `<img>` con `alt` y `width`/`height`.
- Usa `text-wrap:balance` en títulos y `text-wrap:pretty` en prosa; añade
  `overflow-wrap:anywhere` para tokens largos sin perder la lectura normal.
- Cada `<img>` lleva `alt` coherente y `width`/`height` intrínsecos. Usa
  `loading="lazy"` en imágenes bajo el fold y `decoding="async"` cuando aporte.
- No trunques información crítica. Si una etiqueta no cabe, envuélvela, reduce
  el número de categorías o proporciona una lista/tabla equivalente.

## 7. Tooltips e interactividad

- La ayuda importante se escribe en el flujo principal. Un tooltip es siempre
  un extra y debe estar disponible con foco, no solo con hover.
- El contenido de un tooltip no desaparece con movimiento reducido; un PDF o lector
  de pantalla no puede depender de hover.
- Tabs, filtros y toggles usan controles nativos o un patrón completo de
  teclado/ARIA: `tablist`, `tabindex` rotativo, `aria-selected`, paneles
  etiquetados y foco gestionado.
- El contenido esencial funciona sin JS. El modo interactivo mejora la
  exploración, no sustituye la lectura.

## 8. Movimiento con propósito

- Antes de animar, define el trabajo: feedback, continuidad, jerarquía o un
  momento focal. “Se ve más vivo” no es un objetivo.
- En modo lectura, prefiere una secuencia memorable a reveals repetidos. La
  animación no puede ocultar ni retrasar información ya disponible.
- UI: 100–150 ms para feedback, 150–300 ms para estados y 300–500 ms para
  una transición espacial. Un momento focal puede durar 500–800 ms si explica
  una relación y se ejecuta una sola vez.
- Usa una curva de desaceleración sin rebote: `cubic-bezier(0.23, 1, 0.32, 1)`.
  Las transiciones UI deben ser interrumpibles; no uses loops no esenciales.
- Solo `transform`, `opacity` y `stroke-dashoffset` en el motor visual. Nunca
  `transition: all`; no empieces elementos con `scale(0)`.
- El stagger se limita a 80 ms de delay por hijo y 500 ms de retraso total.
- El estado final es visible sin JS, con `prefers-reduced-motion: reduce` y en
  `@media print`. `data-draw` puede conservar una excepción de 1.1 s para
  lectura secuencial, pero no se replica en UI.
- El estado inicial oculto (`opacity:0`, `visibility:hidden`) va **siempre**
  detrás del gate `html.js:not(.no-anim)`, que es la clase que añade el runtime.
  Sin esa clase la regla no existe y el contenido se ve: si el estado inicial
  oculto se declara sin gate, el informe queda en blanco para siempre sin JS.
  `.no-anim` (reduced motion) no sustituye al gate. C6 falla ante un estado
  inicial oculto sin gate, y este es el único punto donde una animación puede
  romper la lectura completa sin JS.

## 9. Checklist de entrega

### Automático

- `node $SKILL/scripts/validar-offline.mjs informe.html --strict` termina limpio
  (código 0, sin blockers ni warnings). `$SKILL` es la raíz de esta skill, no el
  directorio de trabajo: ver la sección "Rutas de esta skill" en `SKILL.md`.
- Si tocaste el validador, sus fixtures siguen verdes:
  `node --test scripts/validar-offline.test.mjs`.
- Reparto de los checks (una línea cada una, para saber qué revisar cuando
  falla):
  - **A1** — URLs externas y recursos no embebidos en atributos (`src`, `href`,
    `poster`, `srcset`, `xlink:href`). Bloqueante.
  - **A2** — `<script src>` y `<link rel="stylesheet">`.
  - **A3** — `<base href>`.
  - **A4** — `<iframe>` / `<embed>` / `<object>` (los comentarios se ignoran:
    un ejemplo en un `<!-- -->` no cuenta).
  - **A5** — CSS: `@import`, `url()` no embebida, `@font-face` sin fuente
    embebida.
  - **A6** — `fetch` / `XMLHttpRequest` / `WebSocket` en el JS inline.
  - **A7** — `<use>` con referencia externa.
  - **C1** — contraste de los tokens. Los de texto: `--text` y `--muted`
    sobre `--surface`, y `--text` sobre `--bg`. Y los de acento: resuelve el
    `color-mix` de `--accent-line`, `--accent-text` y `--accent-ink` con
    cada uno de los siete colores de serie, y exige 3:1 para el cromo y
    4.5:1 para el texto, contra **las cuatro superficies donde el texto se
    pinta de verdad** (la base, el fondo, el `--head-bg` y el `--zebra`).
    Es aviso y no bloqueante, porque el resultado depende de la paleta de
    cada informe. Si el informe no declara `--chart-1..7`, se calla en vez
    de publicarse una medida que no ha hecho. Solo entiende la forma
    `color-mix(in srgb, var(--text) N%, ...)`: ante cualquier otra se calla.
  - **C2** — footer con los 5 campos de identidad (logo, empresa, contacto,
    autor, período) **y sin** autofirma de la skill.
  - **C3** — "Lectura:" bajo cada gráfica; el nombre accesible del SVG lo vigila
    C9 y aquí no se vuelve a contar.
  - **C4** — índice (TOC) cuando hay más de 6 secciones.
  - **C5** — secciones sin contenido sustancial, con las `<section>` anidadas
    emparejadas por pila.
  - **C6** — reduced motion con estado final, print al estado final, gate
    `html.js` del estado inicial oculto, sin `scale(0)` en entradas y sin
    `transition: all`. Cubre también `data-hero` y `data-rule`.
  - **C7** — un `<main>`, un `<h1>`, jerarquía sin saltos, `<title>` sin
    placeholder, cada `<nav>` con nombre, `:focus-visible` con `outline`,
    sin `tabindex` positivo y sin `outline:none` sin sustituto.
  - **C8** — skip link: `href="#<id del main>"` y `main[tabindex="-1"]`.
  - **C9** — SVG: nombre accesible único, decorativos con `aria-hidden` **y**
    `focusable="false"` (una vez por elemento) y referencias del sprite.
  - **C10** — imágenes embebidas con `alt` y `width`/`height`; rechaza
    `srcset` y `<svg><image>` no embebida.
  - **C11** — reflow: `overflow-wrap`, `text-wrap`, sin `overflow-x:hidden` en
    `html`/`body`, y `.table-wrap` con `overflow-x:auto` que cubra las tablas.
  - **C12** — anclas internas rotas, `id` duplicados y offset de scroll bajo el
    topbar sticky.
  - **C13** — `color-scheme` en `:root`/`html` y `<meta name="theme-color">`
    con el color real, coherentes con el tema inicial.
  - **C14** — colores literales fuera de un token. **Bloqueante** en el CSS y
    **aviso** en los atributos de presentación (`fill`, `stroke`, `color`,
    `stop-color`, `style=""`). Quedan exentos: las declaraciones `--x: valor`
    (`:root`, `[data-theme="dark"]` y cualquier override futuro), los neutros
    `#fff/#ffffff/#000/#000000`, y el color de `<meta name="theme-color">`
    (lo rellena la paleta). Se ignoran los comentarios CSS y los selectores que
    solo parecen un color (`#face{}`).
  - **C15** — el acento derivado tiene que seguir a la sección. **Aviso** (no
    bloqueante). Si algún selector `[data-accent…]` remapea `--accent`, debe
    existir otro `[data-accent…]` que declare los tres derivados
    (`--accent-line`, `--accent-text`, `--accent-ink`); si no, nombra los que
    faltan y explica por qué (`se resolverian en :root contra --primary`).
    Es estructural a propósito: una custom property sustituye sus `var()` en
    el elemento donde se **declara**, así que el derivado escrito solo en
    `:root` se congela contra el `--primary` de la página entera. El fondo del
    badge sí cambia de sección (su `color-mix` se evalúa en el propio
    elemento), y por eso el fallo se parece a un descuido de estilo y no a un
    error.

`--strict` cubre esta capa determinista. No sustituye el checklist manual: hay
requisitos que un regex no puede juzgar.

### Manual (el validador no sustituye esta revisión)

- Recorrido completo con Tab, Shift+Tab, Enter y Escape donde aplique.
- Árbol de accesibilidad sin nombres vacíos ni roles contradictorios.
- Lectura a 320/390 px y zoom al 200 % sin pérdida de contenido.
- Token largo, tabla ancha, valor vacío y nombre de cliente largo.
- Cada dato importante sigue disponible con teclado y sin puntero: nada
  detrás de `:hover` o de un tooltip.
- Con la tabla más ancha del informe, confirma que la página no hace scroll
  horizontal: solo la tabla dentro de `.table-wrap`.
- Sin errores de consola; reduced motion y estado sin JS revisados.
- **Estado de lectura**: con un informe largo, al abrir con un ancla
  (`informe.html#s3`), al recargar con el scroll restaurado y al volver de
  la caché del navegador, la barra `.read-progress` tiene que marcar el
  punto de lectura y el enlace activo del índice llevar `aria-current`. No
  hay check que lo valide —lo escribe el JS en runtime— y es el fallo que
  más se cuela, porque en una carga normal desde arriba sí funciona.
- **Estado de lectura**: `aria-current` en el enlace activo del índice y la
  barra `.read-progress` advancing al desplazar. No hay check que lo valide
  porque lo escribe el runtime en ejecución, no el HTML: compruébalo a mano,
  y comprueba también que **al abrir el informe en un ancla** (`informe.html#s1`)
  la barra y el índice ya salen en su sitio, sin tener que desplazar.
- Imprimir → Guardar como PDF: topbar oculto, animaciones finales y piezas sin
  cortes.

## Fuentes y atribución

Esta referencia adapta criterios de lectura y práctica del movimiento consultados el
25-09-2026. Las reglas del skeleton y sus restricciones offline son propias de
esta skill.

- **Vercel Web Interface Guidelines**, Copyright 2025 Vercel Labs, MIT. Guías
  adaptadas: skip link, foco visible, SVG decorativo, imágenes con dimensiones,
  contenido largo, reduced motion y reflow.
- **Impeccable**, Paul Bakaus, Apache-2.0 (revisión
  `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`). Criterio adaptado: modo Read y
  “comprender antes de expresarse”, con foco en legibilidad, semántica e
  intención. No se adoptan sus restricciones estéticas sobre tipografías de
  sistema, tarjetas, anillos, sparklines o bordes de color, porque el sistema
  visual canónico de esta skill ya los usa.
- Los criterios de easing, duración acotada, movimiento interrumpible y animación
  con propósito son norma propia de esta skill (ver `movimiento.md` y los tokens
  `--motion-*` del skeleton); no proceden de ninguna fuente externa.

### Aviso de cambio (Apache-2.0 §4(b))

Este archivo es una obra modificada derivada de Impeccable. Se replican
únicamente criterios de los apartados indicados arriba; no se ha copiado código
de Impeccable. Cambios introducidos respecto del original: traducción al
español, organización por prioridad, ampliación con requisitos propios de
informes offline monolíticos (`.table-wrap`, rechazo de `srcset`, gate
`html.js`, token `--topbar-h`, token de contrato de la palabra `autor`) y
enlace a los checks deterministas del validador.

Las licencias y avisos completos están en `THIRD_PARTY_NOTICES.md` en la raíz
del repositorio. Las URLs de atribución son solo documentación del repo: nunca
se copian al HTML generado.
