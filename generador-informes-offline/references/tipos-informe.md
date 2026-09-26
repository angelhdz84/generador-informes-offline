# Estructura de informes por tipo

Plantillas de secciones según el tipo de informe identificado en Fase 1.
Adapta a los datos reales: si una sección no aplica, omítela; si falta un dato
para una métrica, no la inventes.

Todas las plantillas comparten la estructura base obligatoria:
**Portada → Resumen ejecutivo (KPIs) → Secciones → Recomendaciones → Notas/fuentes/apéndice → Footer con identidad.**

Regla de estructura larga: si el informe supera 6 secciones, añade tras la
portada un **Índice (TOC) navegable** (`references/infografias.md`) y un panel
**"Lo más importante"** (2-4 hallazgos). En informes cortos el resumen ejecutivo
basta; no dupliques.

Independientemente del tipo, todo informe cumple el baseline de
`references/accesibilidad-ux.md`: skip link + `main#contenido`, un solo `<h1>`,
SVG con nombre accesible o ocultos, imágenes con dimensiones, reflow a 320 px y
zoom 200 %, y contenido completo sin JS, con reduced motion y en print.

---

## 1. Informe de ventas / comercial

**Público**: dirección comercial o gerencia.

Secciones sugeridas:

1. **Resumen ejecutivo**: KPIs — ingresos, unidades vendidas, ticket medio, margen, cumplimiento de cuota.
2. **Evolución de ventas**: gráfica de línea/área por mes/trimestre; resaltar picos y valles.
3. **Desglose por canal**: donut (online/presencial/distribución) + tabla.
4. **Top productos / categorías**: barras horizontales (ranking) + % del total.
5. **Desempeño por región/equipo**: barras agrupadas o mapa de calor por región; resaltar mejor/peor.
6. **Funnel de conversión** (si hay datos de leads): visitas → presupuesto → pedido → factura.
7. **Conclusiones y recomendaciones**: 3-5 acciones con impacto esperado.
8. **Apéndice**: tabla completa de ventas por período/producto.

Infografías clave: KPI cards, funnel, comparativa de regiones, badges de tendencia.

---

## 2. Informe de gestión / gerencial

**Público**: directivos; tono ejecutivo y sintético (máximo 10-12 páginas imprimibles).

Secciones sugeridas:

1. **Resumen ejecutivo**: 4-6 KPIs estratégicos con sparkline y tendencia.
2. **Resultados del período**: qué se logró, contra qué meta (progress bars por objetivo).
3. **Indicadores clave por área** (finanzas, operaciones, personas, clientes): tablas con badges de estado.
4. **Riesgos y alertas**: callouts (rojo = crítico, ámbar = vigilar) + heatmap de prioridad.
5. **Plan a seguir**: proceso en pasos (próximos 30/60/90 días) o timeline de hitos.
6. **Notas metodológicas**: fuentes de datos, definiciones, limitaciones.

Infografías clave: progress bars, callouts, heatmap de prioridad, timeline.

---

## 3. Informe académico / de investigación

**Público**: académicos, comités; tono formal y riguroso.

Secciones sugeridas:

1. **Portada académica**: título, autor/es, afiliación, fecha; luego resumen (abstract).
2. **Contexto y objetivos**: por qué y qué se busca responder.
3. **Metodología**: pasos, muestra, instrumentos, limitaciones (proceso en pasos).
4. **Resultados**: por hipótesis/variable; gráfica apropiada a cada dato (barras de comparación, líneas de evolución, radar para perfiles multidimensionales).
5. **Discusión**: hallazgos clave como callouts + comparativa con referencias si las hay.
6. **Conclusiones**: síntesis + trabajo futuro.
7. **Referencias y apéndice**: fuentes, tablas de datos completas, definiciones de variables.

Nota: en informes académicos el autor suele ser el investigador/institución; la
identidad (empresa) puede ser la institución o el autor individual — pregunta si hay duda.

---

## 4. Informe técnico

**Público**: ingenieros, equipos técnicos, clientes técnicos; alto detalle.

Secciones sugeridas:

1. **Resumen ejecutivo** (una página, para no-técnicos que aprueban).
2. **Alcance y contexto**: qué se evaluó/construyó, entorno.
3. **Metodología / procedimiento**: pasos numerados + timeline.
4. **Resultados y mediciones**: tablas densas + gráficas (líneas de series temporales, barras de comparación, heatmaps).
5. **Análisis y diagnóstico**: desviaciones, causa-efecto, riesgos.
6. **Recomendaciones técnicas**: priorizadas (impacto × esfuerzo).
7. **Apéndice técnico**: datos crudos, configuraciones, referencias normativas.

Infografías clave: tabla densa bien formateada, heatmap, proceso en pasos, comparativa.

---

## 5. Informe médico / clínico

**Público**: personal de salud, dirección sanitaria; tono sobrio y preciso.

Secciones sugeridas:

1. **Resumen ejecutivo**: indicadores clave de salud (ocupación, estancia media, incidencia...).
2. **Actividad asistencial**: volumen de atenciones, por tipo (donut/barras).
3. **Indicadores de calidad/seguridad**: tabla con metas y badges (cumplido/en riesgo).
4. **Comparativa de períodos**: líneas de evolución (urgencias, ingresos).
5. **Alertas y riesgos**: callouts críticos.
6. **Notas metodológicas**: fuentes (historias clínicas, registros), definiciones, privacidad.

Nota: nunca inventar datos clínicos; si no hay datos, pedirlos.

---

## 6. Informe general / a medida

Cuando el usuario no encaja en los tipos anteriores o pide algo específico:

1. Identifica las **3-5 ideas/factores clave** que el informe debe comunicar.
2. Arma la estructura: portada → resumen → sección por factor (cada una con su gráfica/infografía) → conclusiones/recomendaciones → notas/apéndice → footer.
3. Pregunta solo lo que sea imprescindible para no errar la estructura.

---

## Reglas transversales

- El **resumen ejecutivo** siempre va después de la portada y antes de las secciones.
- Informes con >6 secciones: TOC + panel "Lo más importante" tras la portada.
- Cada sección responde a **una** pregunta principal; si necesita un dato de
  otra sección, lo repite junto a su gráfica.
- **Recomendaciones**: solo si hay datos para sustentarlas; 3-5 máx, concretas.
- **Notas metodológicas**: siempre presentes (de dónde salen los datos y cómo se midieron).
- **Apéndice**: tablas completas con los datos usados; es el "fuente de verdad" que respalda las gráficas.
- Toda cifra en el informe debe poder rastrearse a un dato del apéndice o de la fuente.
- El footer (identidad completa: logo, empresa, contacto, autor, período) es obligatorio en TODOS los tipos.
- Las animaciones son opt-in por `data-*`; no añadas movimiento a una sección
  solo porque el resto lo tiene (ver `references/movimiento.md`).
- Antes de entregar, valida con `--strict` y completa el checklist manual de
  `references/accesibilidad-ux.md`.