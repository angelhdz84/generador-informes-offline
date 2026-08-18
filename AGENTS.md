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
- CSS completo inline, JS inline
- Imágenes de marca embebidas en base64 (nunca por ruta)
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
  - Animaciones `data-*` del skeleton: sobrias, una vez por elemento, respetar
    `prefers-reduced-motion`, estado final completo sin JS y en print.
- Logo del cliente: embebido en base64; si el PNG original es muy grande
  (p. ej. 287 KB / 4982 px), redimensionar antes a un ancho razonable
  (p. ej. 480 px) para no inflar el informe.

## Flujo de trabajo

1. **Diagnóstico** (máximo 3-4 preguntas): tipo de informe, público, origen de
   datos, identidad y autoría (siempre se pregunta: empresa, logo, colores,
   contacto, autor).
2. **Datos**: nunca inventar valores; si falta un dato, omitir la sección o
   preguntar.
3. **Plan** breve: secciones + gráfica/infografía por sección; decidir modo
   (estático / interactivo con Alpine inline).
4. **Generar** desde `plantilla-base.html`; "Lectura:" bajo cada gráfica.
5. **Validar** hasta pasar limpio:
   ```bash
   node generador-informes-offline/scripts/validar-offline.mjs <informe.html> [--strict]
   ```

## Estructura del repo

```
├── SPEC.md                    # especificación funcional de la skill
├── AGENTS.md                  # este archivo
├── README.md                  # presentación e instalación
├── generador-informes-offline/
│   ├── SKILL.md               # instrucciones de la skill
│   ├── assets/                # plantilla-base.html, motion.min.js, iconos.svg, paletas.json, alpine.min.js
│   ├── references/            # diseno, svg-charts, infografias, movimiento, tipos-informe
│   ├── scripts/validar-offline.mjs
│   └── evals/                 # suite de evaluaciones
└── logo/                      # logos del cliente (blanco.png, azul.png, negro.png)
```

## Commits

- Mensajes en español, estilo conciso que describa el cambio.
- `generador-informes-offline-workspace/` está en `.gitignore` (resultados de
  benchmark, no forman parte de la skill).
- No commitear secretos ni datos de clientes fuera del repo.