# SPEC — generador-informes-offline

Especificación funcional de la skill de opencode que genera informes
profesionales en un único archivo `.html` monolítico, 100% autocontenido y
100% offline.

## 1. Propósito

Permitir a un usuario producir un informe profesional (reporte, memoria,
resumen de resultados, dashboard estático o documento con datos/gráficas en
HTML) que se abra con doble clic y funcione sin internet, sin CDN y sin
dependencias externas. Cero peticiones de red: todo vive dentro del archivo.

## 2. Entradas

- Datos pegados por el usuario (texto, tablas, series, métricas).
- Archivos: xlsx, csv, pdf, docx.
- Preguntas guiadas (cuando no hay datos previos).

Regla de datos: **nunca inventar valores**. Si falta un dato para una sección
o métrica, omitir la sección o preguntar.

## 3. Salida

Un único archivo `.html` con:

| Bloque | Contenido |
|--------|-----------|
| Portada | Título, subtítulo, período, logo + nombre de empresa, autor, fecha |
| TOC + "Lo más importante" | Obligatorios si el informe supera 6 secciones |
| Resumen ejecutivo | 3-6 KPIs en tarjetas con contador animado |
| Secciones | Según tipo e informe, cada una con su gráfica/infografía |
| Recomendaciones | Si aplica |
| Notas/fuentes | Metodología, fuentes y apéndice |
| Footer | Identidad completa del cliente (ver §7) |

## 4. Restricciones de autocontención (0 internet estricto)

PROHIBIDO en el HTML generado:

- URLs externas (`http://`, `https://`, `//dominio`) en `src`, `href`,
  `action`, `poster` y CSS `url()`
- `<link rel="stylesheet">`, `<script src>`, `@import` y `@font-face` externo
- `<iframe>`, `fetch()`/XHR/WebSocket a red, `<base href>`
- Imágenes remotas, mapas externos, iconos de CDN
- `<use href="archivo.svg#id">` con ruta a archivo externo

OBLIGATORIO:

- `<meta charset="UTF-8">` + `<html lang="es">` + system font stack
- CSS completo inline; JS inline si lo hay (Alpine embebido, nunca `<script src>`)
- Iconos como sprite SVG embebido (`assets/iconos.svg`) o SVG inline dibujado a mano
- Imágenes de marca embebidas en base64
- `@media print` para Imprimir → Guardar como PDF
- Footer con identidad completa del cliente
- "Lectura:" (1-2 frases) bajo TODA gráfica/infografía

## 5. Arquitectura de generación

- **Punto de partida único**: `assets/plantilla-base.html` (skeleton canónico).
  Copiar y rellenar placeholders: `{{TITULO}}`, `{{PALETA}}`, `{{SPRITE}}`,
  `{{MOTION_JS}}`, `{{TOPBAR}}`, `{{BODY}}`, `{{FOOTER}}`.
- **No reescribir el sistema de diseño del skeleton**: añadir contenido y, si
  falta un componente, consultar las referencias.
- **Estilos extra**: se permite un segundo bloque `<style>` en el body para
  variantes locales; el validador une todos los bloques CSS y sigue pasando
  `--strict`.
- **Modos**:
  - Estático (por defecto): informes simples, peso ligero, impresión perfecta.
  - Interactivo: Alpine.js inline (`assets/alpine.min.js`, ~47 KB) para
    muchos datos, tabs, tooltips, filtros, toggle de tema.

## 6. Componentes de diseño

- **Gráficas SVG** (referencia `references/svg-charts.md`): barras, líneas,
  pie, donut, radar, funnel, gauge, heatmap, treemap, sparklines. Máximo
  6 colores de serie por gráfica. Contraste AA/AAA.
- **Infografías** (referencia `references/infografias.md`): timeline,
  procesos/steps, comparativas, progress ring, panel "Lo más importante",
  TOC, KPIs, tablas híbridas.
- **Código de color por bloque temático**: bloques A–E de un diagnóstico con
  borde lateral + badge de color; preguntas/ítems en tarjetas con hover.
- **Animaciones** (referencia `references/movimiento.md`): `data-reveal`,
  `data-grow`, `data-draw`, `data-pop`, `data-count`. Sobrias, una vez por
  elemento, solo transform/opacity; respetan `prefers-reduced-motion`;
  estado final completo sin JS y en print. Los rings usan `data-pop` (no `data-draw`).
- **Logo del cliente**: embebido en base64. Si el PNG original es muy grande
  (p. ej. 287 KB / 4982 px), redimensionar antes a un ancho razonable
  (p. ej. 480 px) para no inflar el informe. El logo blanco solo va sobre
  superficies oscuras (portada/hero y footer).

## 7. Footer — regla del cliente

- El footer es SOLO identidad del cliente: logo/monograma + empresa +
  contacto (teléfono, correo, web, dirección) + `Elaborado por: [autor]` +
  período.
- **PROHIBIDO** añadir la firma `Documento 100% offline · generado con
  generador-informes-offline` ni ninguna autofirma de la skill.
- Para pasar `--strict`, el footer debe contener la palabra `autor`
  (`Elaborado por`, `autor`, `preparado por` o `realizado por`).

## 8. Validación

```bash
node generador-informes-offline/scripts/validar-offline.mjs <informe.html> [--strict]
```

- Bloque A (errores bloqueantes): dependencias externas (URLs, link/script src,
  base, iframe/embed/object, @import, url() externa, fetch/XHR/WS, font-face sin
  fuente embebida).
- Bloque B (warnings de diseño): footer completo, contraste AA, "Lectura:" en
  cada gráfica, TOC en informes largos, prefers-reduced-motion.
- Con `--strict` los warnings de diseño también bloquean.
- El informe debe abrirse sin internet y sin errores de consola.

## 9. Criterios de aceptación

1. El archivo pasa `validar-offline.mjs --strict` con 0 errores.
2. Se abre con doble clic y se ve perfecto sin internet.
3. Toda gráfica tiene "Lectura:" con el hallazgo real.
4. El footer contiene la identidad completa del cliente y nunca la autofirma
   de la skill.
5. Las animaciones respetan `prefers-reduced-motion` y se ven completas en print.
6. Imprimir → Guardar como PDF produce un documento limpio (A4, sin topbar,
   sin sombras).

## 10. Estado del proyecto

- **Iteración 1**: skill base + validador + evals (benchmark old_skill).
- **Iteración 2**: animaciones `data-*` (reveal, grow, draw, pop, count),
  skeleton `plantilla-base.html`, benchmark new_skill 100% vs old_skill 93.2%
  (delta +0.07). Skill publicada en GitHub y instalada localmente.
- **Iteración 3 (actual)**: regla de footer del cliente (prohibida la
  autofirma), mejoras de UI (bloques con código de color, tarjetas `.q` con
  hover, números en círculo `.rnum`, meta de portada en pills), generación de
  informes de ejemplo (Informe Técnico de Consulta del CTA).