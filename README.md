# Generador de Informes HTML Offline

Skill de opencode (formato `SKILL.md`) que genera informes profesionales en un
**único archivo `.html` monolítico**, 100% autocontenido y 100% offline (0
internet, 0 CDN, 0 dependencias externas).

## Qué produce

- **Portada** con título, empresa, autor/fecha y período.
- **Resumen ejecutivo** con KPIs y contadores opt-in por `data-count`.
- **Gráficas SVG** estáticas: barras, líneas, pie, donut, radar, funnel, gauge,
  heatmap, treemap y sparklines.
- **Infografías**: timelines, procesos, comparativas, progress rings, panel
  "Lo más importante" e índice navegable.
- **Iconos SVG inline** y animaciones **opt-in por atributo**
  (`data-reveal/grow/draw/pop/count/slide/water`), con easing único, duración
  acotada, sin `scale(0)` y con `prefers-reduced-motion` respetado.
- **Footer obligatorio** con logo/monograma + empresa + contacto + autor.
- **"Lectura:"** bajo cada gráfica (interpretación en 1-2 frases).
- **Accesibilidad de serie**: skip link, `main#contenido`, navegación por
  teclado, foco visible, SVG decorativos ocultos y gráficas con nombre
  accesible, imágenes con dimensiones, reflow a 320 px y zoom 200 %.

## Entradas soportadas

Datos pegados por el usuario, archivos (xlsx/csv/pdf/docx) o preguntas guiadas.

## Estructura

```
generador-informes-offline/
├── SKILL.md                  # Instrucciones de la skill
├── assets/                   # plantilla-base.html (skeleton), motion.min.js,
│                             # iconos.svg (sprite), paletas.json, alpine.min.js
├── references/               # guías: diseño, svg-charts, infografías, movimiento,
│                             # tipos, accesibilidad-ux (baseline obligatorio)
├── scripts/
│   ├── validar-offline.mjs       # validador 100% offline (modo --strict, --json)
│   ├── smoke.mjs                 # prueba de instalación, válida desde cualquier cwd
│   └── validar-offline.test.mjs  # fixtures unitarios del validador
└── evals/                    # suite de evaluaciones
```

En la raíz del repo, `THIRD_PARTY_NOTICES.md` recoge las licencias y la
atribución de terceros: criterios adaptados (Vercel Web Interface Guidelines e
Impeccable) y recursos embebidos (Feather Icons y Alpine.js). **No todas las
licencias son MIT**: Impeccable es Apache-2.0.

## Instalación

Copia la carpeta `generador-informes-offline/` a tu directorio de skills de
opencode, por ejemplo:

```
~/.config/opencode/skills/generador-informes-offline/
```

Queda disponible en **todos** tus proyectos. Ojo: las rutas internas de la skill
(`references/…`, `assets/…`, `scripts/…`) son relativas a **esa** carpeta, no al
proyecto desde el que la uses, así que los comandos hay que lanzarlos contra la
raíz de la skill.

## Comprobación de la instalación

```bash
node "$SKILL/scripts/smoke.mjs"
```

Rellena la plantilla con un informe mínimo y lo valida en `--strict`. Es válido
desde cualquier directorio: el script se resuelve a sí mismo con
`import.meta.url`. Si sale limpio, la instalación está operativa.

En PowerShell, `~` no se expande de forma fiable como argumento de `node`:

```powershell
$SKILL = "$env:USERPROFILE\.config\opencode\skills\generador-informes-offline"
node "$SKILL\scripts\smoke.mjs"
```

## Validación

```bash
node "$SKILL/scripts/validar-offline.mjs" <informe.html> --strict
```

El validador comprueba la autocontención (errores, siempre bloqueantes) y una
capa determinista de diseño y accesibilidad (warnings; bloquean con `--strict`).
Códigos de salida: `0` limpio, `1` hallazgos, `2` mal uso.

Requisito: Node.js (solo para validar; el informe en sí no necesita nada).

La validación no sustituye la revisión manual: recorrido con teclado, árbol de
accesibilidad, 320/390 px, zoom 200 %, estado sin JS e impresión a PDF están en
el checklist de `references/accesibilidad-ux.md`.
