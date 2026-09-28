# AGENTS.md — generador-informes-offline

Reglas de trabajo para agentes que desarrollen, mantengan o usen esta skill.

## Contexto

Skill de opencode que genera informes profesionales en un único `.html`
monolítico, 100% offline (0 internet, 0 CDN, 0 dependencias externas). El
repo contiene la skill (`generador-informes-offline/`), su README, SPEC.md,
AGENTS.md y la documentación asociada.

## Reglas no negociables (0 internet estricto)

En todo informe generado está PROHIBIDO:

- URLs externas (`http://`, `https://`, `//dominio`) en `src`, `href`, `action`, `poster`, CSS `url()`
- `<link rel="stylesheet">`, `<script src>`, `@import`, `@font-face` con fuente externa, webfonts
- `<iframe>`, `fetch()`/XHR/WebSocket a red, `<base href>`
- Imágenes remotas, mapas externos, iconos de CDN, `<use href="archivo.svg#id">` con ruta

Obligatorio en todo informe:

- `<meta charset="UTF-8">` + `<html lang="es">` + system font stack
- `<meta name="color-scheme">` + `color-scheme` en `:root` + `<meta name="theme-color">`
- CSS completo inline, JS inline
- Imágenes de marca embebidas en base64 (nunca por ruta) con `alt` y `width`/`height`
- Skip link + `<main id="contenido" tabindex="-1">`
- Bloque `prefers-reduced-motion` con estado final completo
- `@media print` listo para Imprimir → Guardar como PDF
- Footer con identidad completa del cliente
- "Lectura:" (1-2 frases) bajo TODA gráfica/infografía

## Footer — regla del cliente

- El footer es SOLO identidad del cliente: logo/monograma + empresa +
  contacto + `Elaborado por: [autor]` + período.
- **NUNCA** añadir la firma `Documento 100% offline · generado con
  generador-informes-offline` ni ninguna autofirma de la skill.
- Requisito del validador: el footer debe contener la palabra `autor`
  (`Elaborado por`, `autor`, `preparado por` o `realizado por`) para pasar
  `--strict`.

## Diseño y UI

- Partir SIEMPRE de `assets/plantilla-base.html` (skeleton canónico) y
  rellenar placeholders. No reescribir el sistema de diseño del skeleton.
- Se permite un segundo bloque `<style>` en el body para variantes locales
  (el validador une todos los bloques CSS y sigue pasando `--strict`).
- Reglas visuales (ver `references/diseno.md`):
  - Jerarquía: tamaño > color > contraste > posición > espacio.
  - Rejilla 8pt, máximo 6 colores de serie por gráfica, contraste AA/AAA.
  - Código de color por bloque temático (p. ej. bloques A–E de un diagnóstico)
    usando borde lateral + badge de color; preguntas/ítems en tarjetas con hover.
  - Animaciones `data-*` del skeleton: opt-in por atributo, sobrias, una vez
    por elemento, easing `cubic-bezier(0.23,1,0.32,1)`, UI < 300 ms, sin
    `transition:all` ni `scale(0)`, respetar `prefers-reduced-motion` y estado
    final completo sin JS y en print.
- Logo del cliente: embebido en base64; si el PNG original es muy grande
  (p. ej. 287 KB / 4982 px), redimensionar antes a un ancho razonable
  (p. ej. 480 px) para no inflar el informe.

## Accesibilidad y lectura (baseline obligatorio)

La norma vive en `generador-informes-offline/references/accesibilidad-ux.md`.
Resumen no negociable:

- Skip link como primer elemento enfocable + `<main id="contenido" tabindex="-1">`.
- Un solo `<h1>`, jerarquía sin saltos, `<nav>` con `aria-label` distinto.
- Iconos decorativos: `<svg class="icon" aria-hidden="true" focusable="false">`.
  SVG informativo: `role="img"` + `aria-label`/`aria-labelledby` hacia un `<title>`.
- `overflow-wrap:anywhere`, `text-wrap:balance` (títulos), `text-wrap:pretty` (prosa).
- `scroll-padding-top`/`scroll-margin-top` para el topbar sticky.
- Color nunca como única señal: acompaña con texto, signo, icono o forma.
- Todo operable con teclado, `:focus-visible` visible, sin `tabindex` positivo.
- Completo y legible sin JS, con reduced motion, en print y a zoom 200 %.
- `--strict` cubre la capa determinista; el checklist manual de la referencia
  (teclado, árbol de accesibilidad, 320/390 px, PDF) no lo sustituye.

## Flujo de trabajo

1. **Diagnóstico** (máximo 3-4 preguntas): tipo de informe, público, origen de
   datos, identidad y autoría (siempre se pregunta: empresa, logo, colores,
   contacto, autor).
2. **Datos**: nunca inventar valores; si falta un dato, omitir la sección o
   preguntar.
3. **Plan** breve: secciones + gráfica/infografía por sección; decidir modo
   (estático / animación opt-in por `data-*` / interactivo con Alpine inline).
4. **Generar** desde `plantilla-base.html`; "Lectura:" bajo cada gráfica; aplicar
   el baseline de accesibilidad de `references/accesibilidad-ux.md`.
5. **Validar** hasta pasar limpio (código 0):
   ```bash
   node generador-informes-offline/scripts/validar-offline.mjs <informe.html> --strict
   ```
6. **Revisión manual** con el checklist de `references/accesibilidad-ux.md`
   (teclado, árbol de accesibilidad, 320/390 px, zoom 200 %, reduced motion, PDF).
7. Si tocaste el validador, ejecutar sus fixtures (pasa el archivo explícito;
   `node --test <dir>` no funciona en este entorno):
   ```bash
   node --test generador-informes-offline/scripts/validar-offline.test.mjs
   ```
   Y **cada fixture nuevo, probado en negativo**: rompe a propósito la pieza
   que debería cubrir y comprueba que algún fixture cae. Un check con fixtures
   que nunca fallan no está verificado, por muchos que tenga. La mutación que
   más se cuela es la que degrada el resultado en vez de romperlo: un check que
   baja el umbral, o que se mide contra el fondo en vez de contra la superficie
   tintada, sigue ejecutándose y sigue diciendo que todo va bien.

### Rutas: la skill es user-level, el proyecto no es su raíz

La skill se instala en `%USERPROFILE%\.config\opencode\skills\`
(`~/.config/opencode/skills/`), así que está disponible en todos los proyectos.
Sus rutas internas (`references/…`, `assets/…`, `scripts/…`) son **relativas a la
raíz de la skill**, no al proyecto en el que se usa: el agente corre con el cwd
del proyecto y `node scripts/validar-offline.mjs` falla con `MODULE_NOT_FOUND`.

Al tocar la skill, deja los comandos resolubles contra la raíz. En PowerShell
`~` no se expande fiable como argumento de `node`; usa:

```powershell
$SKILL = "$env:USERPROFILE\.config\opencode\skills\generador-informes-offline"
node "$SKILL\scripts\smoke.mjs"          # o validar-offline.mjs informe.html --strict
```

`scripts/smoke.mjs` es la prueba de que la instalación está sana: rellena la
plantilla y valida en `--strict`, resolviéndose a sí mismo vía `import.meta.url`
para que funcione desde cualquier cwd. Hay tres fixtures que lo fijan, y
**están probados en negativo**: si alguien reintroduce una ruta desnuda o
borra la sección "Rutas de esta skill" de `SKILL.md`, fallan.

### Los 4 warnings de `plantilla-base.html` son los esperados

Validar el skeleton sin rellenar da **exactamente 4 warnings**, no 0, porque
`{{TITULO}}`, `{{COLOR_FONDO}}`, `{{BODY}}` y `{{FOOTER}}` siguen sin
sustituir: falta el `<title>`, falta el `<h1>`, falta el footer de identidad con
la palabra `autor` y el `theme-color` es un placeholder literal. Hay un fixture
que fija ese número: si al retocar el skeleton la plantilla pasa a 0 warnings
o a 5, el cambio no es lo que crees. El skeleton **no** debe pasar `--strict`
por sí solo; los informes generados sí.

## El acento: tres tokens y unas cuotas medidas

El color de serie **nunca** se usa tal cual, ni como texto ni como cromo. En
la paleta `ejecutivo`, medido sobre la superficie tintada, el ámbar da 2.15:1,
el verde 2.54:1 y el teal 2.49:1: no llegan ni al 4.5:1 del texto ni al 3:1 de
los elementos no textuales. De ahí los tres tokens, cada uno con su umbral y su
cuota **medida** (el mínimo real es 26 % para 3:1 y 47 % para 4.5:1):

| Token | Umbral | Uso |
|---|---|---|
| `--accent-line` (`--text` 30 %) | 3:1 | filete, línea, borde de bloque, de tabla |
| `--accent-text` (`--text` 50 %) | 4.5:1 | texto del badge, del eyebrow |
| `--accent-ink` (`--text` 68 %) | 4.5:1 | cifras grandes de KPI |

El error que ya se cometió una vez: bajar `--accent-text` del 50 % al 38 % no
rompe nada visible —nadie ve el hex, solo el token— y el badge de los bloques
ámbar, verde y teal deja de leerse. C1 lo mide por eso, contra la superficie
tintada y no solo contra el blanco. **No bajes las cuotas por estética.**

### El alcance de `var()`: los derivados se recalculan, no heredan

Una custom property sustituye sus `var()` **en el elemento donde se declara**.
`--accent-text: color-mix(…, var(--accent))` escrita en `:root` se resuelve una
vez contra el `--primary` de `:root` y ese color hereda a la página entera:
remapear `--accent` en `[data-accent="3"]` no lo cambia. Por eso el mapa es
**doble** y vive entero en el mismo elemento (ver `references/diseno.md`).

El fallo no se ve: el fondo del badge sí cambia (su `color-mix` se evalúa en el
propio elemento) y el texto no, así que parece un descuido de estilo. **C15** lo
vigila: si algún selector `[data-accent…]` remapea `--accent`, tiene que existir
otro `[data-accent…]` que declare los tres derivados; si no, avisa nombrando los
que faltan.

## Estructura del repo

```
├── SPEC.md                    # especificación funcional de la skill
├── AGENTS.md                  # este archivo
├── README.md                  # presentación e instalación
├── THIRD_PARTY_NOTICES.md     # licencias y atribución de terceros
├── generador-informes-offline/
│   ├── SKILL.md               # instrucciones de la skill
│   ├── assets/                # plantilla-base.html, motion.min.js, iconos.svg, paletas.json, alpine.min.js
│   ├── references/            # diseno, svg-charts, infografias, movimiento, tipos-informe, accesibilidad-ux
│   ├── scripts/
│   │   ├── validar-offline.mjs      # validador (A1-A7, C1-C15, --strict, --json)
│   │   ├── smoke.mjs                # prueba de instalación: rellena la plantilla y valida desde cualquier cwd
│   │   └── validar-offline.test.mjs # fixtures unitarios del validador
│   └── evals/                 # suite de evaluaciones
└── logo/                      # logos del cliente (blanco.png, azul.png, negro.png)
```

## Licencias de terceros

Dos capas, y **no todas son MIT**:

- **Criterios adaptados** en `references/accesibilidad-ux.md`: Vercel Web
  Interface Guidelines (MIT) e Impeccable (Apache-2.0). Solo se reutilizan
  criterios, no código.
- **Recursos embebidos**: `assets/iconos.svg` deriva de Feather Icons (MIT,
  Cole Bemis) y `assets/alpine.min.js` es Alpine.js 3.16.1 (MIT, Caleb Porzio).

Al tocar esa referencia o cualquiera de esos dos assets, conserva y actualiza los
avisos de `THIRD_PARTY_NOTICES.md`. No afirmes que todas las licencias son MIT.
Al modificar un archivo derivado de Impeccable, deja aviso de cambio explícito
(Apache-2.0 §4(b)). Las URLs de atribución son documentación del repo: nunca se
copian al HTML generado.

Antes de citar una fuente nueva, verifíquela (árbol del repo, `LICENSE`,
`NOTICE.md`): no atribuyas a un proyecto una skill o archivo que no exista.

## Commits

- Mensajes en español, estilo conciso que describa el cambio.
- `generador-informes-offline-workspace/` está en `.gitignore` (resultados de
  benchmark, no forman parte de la skill).
- No commitear secretos ni datos de clientes fuera del repo.