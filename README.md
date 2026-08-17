# Generador de Informes HTML Offline

Skill de opencode (formato `SKILL.md`) que genera informes profesionales en un
**único archivo `.html` monolítico**, 100% autocontenido y 100% offline (0
internet, 0 CDN, 0 dependencias externas).

## Qué produce

- **Portada** con título, empresa, autor/fecha y período.
- **Resumen ejecutivo** con KPIs y contadores animados.
- **Gráficas SVG** estáticas: barras, líneas, pie, donut, radar, funnel, gauge,
  heatmap, treemap y sparklines.
- **Infografías**: timelines, procesos, comparativas, progress rings, panel
  "Lo más importante" e índice navegable.
- **Iconos SVG inline**, animaciones elegantes y sobrias (`data-reveal/grow/draw/pop/count/stagger`)
  que respetan `prefers-reduced-motion`.
- **Footer obligatorio** con logo/monograma + empresa + contacto + autor.
- **"Lectura:"** bajo cada gráfica (interpretación en 1-2 frases).

## Entradas soportadas

Datos pegados por el usuario, archivos (xlsx/csv/pdf/docx) o preguntas guiadas.

## Estructura

```
generador-informes-offline/
├── SKILL.md                  # Instrucciones de la skill
├── assets/                   # plantilla-base.html (skeleton), motion.min.js,
│                             # iconos.svg (sprite), paletas.json, alpine.min.js
├── references/               # guías: diseño, svg-charts, infografías, movimiento, tipos
├── scripts/
│   └── validar-offline.mjs   # validador 100% offline (modo --strict)
└── evals/                    # suite de evaluaciones
```

## Instalación

Copia la carpeta `generador-informes-offline/` a tu directorio de skills de
opencode, por ejemplo:

```
~/.config/opencode/skills/generador-informes-offline/
```

## Validación

```bash
node "generador-informes-offline/scripts/validar-offline.mjs" <informe.html> [--strict]
```

Requisito: Node.js (solo para validar; el informe en sí no necesita nada).
