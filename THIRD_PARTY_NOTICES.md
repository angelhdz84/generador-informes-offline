# Third-party notices

Este repositorio incluye código y recursos de terceros. Esta página enumera
todos los avisos exigidos por sus licencias. No todos los componentes son MIT:
consulta la licencia de cada uno antes de redistribuir.

Las URL de esta página documentan el repositorio; nunca se copian al HTML
generado, que debe ser 100 % offline.

## 1. Criterios adaptados (sin código de terceros)

`generador-informes-offline/references/accesibilidad-ux.md` adapta ideas de las
fuentes siguientes. No se incluye su código ni sus ejemplos de interfaz en el
skeleton canónico; solo se reutilizan criterios de lectura.

### Vercel Web Interface Guidelines

- Project: <https://github.com/vercel-labs/web-interface-guidelines>
- Copyright (c) 2025 Vercel Labs
- License: MIT
- Criterios adaptados: skip link, foco visible, SVG decorativo, imágenes con
  `width`/`height`, contenido largo, `prefers-reduced-motion` y reflow.
- Modificaciones: los criterios se reescribieron como baseline normativo propio
  y se ajustaron al skeleton canónico de esta skill.

### Impeccable

- Project: <https://github.com/pbakaus/impeccable>
- Copyright 2025 Paul Bakaus
- License: Apache License 2.0
- Revision consultada: `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`
- Criterios adaptados: modo Read y “comprender antes de expresarse”, con foco en
  legibilidad, semántica e intención.
- No se adoptan sus restricciones estéticas sobre tipografías de sistema,
  tarjetas, anillos, sparklines o bordes de color, porque el sistema visual
  canónico de esta skill ya los usa.
- **Archivo modificado**: `generador-informes-offline/references/accesibilidad-ux.md`
  (criterios reescritos y filtrados; aviso de cambio en el propio archivo y en
  esta página, conforme a Apache-2.0 §4(b)).
- El `NOTICE.md` de Impeccable atribuye `skill/reference/ios.md` y
  `skill/reference/android.md` a `platform-design-skills` (MIT, ehmo). Este
  repositorio no deriva de esos archivos, por lo que ese aviso no se reproduce
  aquí (Apache-2.0 §4(d) excluye los avisos que no corresponden a la obra
  derivada).

## 2. Recursos embebidos (código de terceros)

### Feather Icons

- Project: <https://github.com/feathericons/feather>
- Copyright (c) 2013-2023 Cole Bemis
- License: MIT
- Uso: los `path` de `generador-informes-offline/assets/iconos.svg` derivan de
  Feather. No se distribuye ningún icono suelto: el sprite se embebe en el
  informe por `base64`/inline.

### Alpine.js

- Project: <https://github.com/alpinejs/alpine>
- Copyright © 2019-2025 Caleb Porzio and contributors
- License: MIT
- Versión embebida: 3.16.1
- Uso: `generador-informes-offline/assets/alpine.min.js`, copia del build
  oficial minificado, sin modificar.
- Nota: ese build no incluye el banner de licencia en el archivo, así que este
  aviso es la referencia de copyright exigida por MIT.

## 3. Licencias

### MIT License

Aplica a: Vercel Web Interface Guidelines, Feather Icons y Alpine.js.

> Copyright (c) 2025 Vercel Labs — ver la sección 1.
> Copyright (c) 2013-2023 Cole Bemis — ver la sección 2.
> Copyright © 2019-2025 Caleb Porzio and contributors — ver la sección 2.

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

### Apache License 2.0

Aplica a: Impeccable. El texto completo de la licencia está en el `LICENSE` del
repositorio upstream (<https://www.apache.org/licenses/LICENSE-2.0>). Requisitos
aplicables a este repositorio:

- §4(a) copia de la licencia: <https://www.apache.org/licenses/LICENSE-2.0>
- §4(b) archivos modificados con aviso de cambio: `references/accesibilidad-ux.md`
- §4(c) conservación de los avisos de copyright del upstream: secciones 1 y 2
- §4(d) el `NOTICE` de Impeccable no se aplica a esta obra derivada (ver arriba)

Impeccable se aporta como referencia documental, no como dependencia ni como
código distribuido.
