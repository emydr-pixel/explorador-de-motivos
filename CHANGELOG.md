# Historial de versiones

Este proyecto sigue [versionado semántico](https://semver.org/lang/es/): MAYOR.MENOR.PARCHE.

## [1.3.0] · 2026-11-04
### Añadido
- Pestaña **Conversar** en la lectura: un compañero de lectura (Claude) para quien ya leyó la obra. Responde solo con frases numeradas de la obra (unas 20 a 24 por pregunta, elegidas por palabras raras, personajes y motivos de la pregunta, con filtro por capítulo y por tramo) y cita cada afirmación; los números citados llevan a la frase y los que no se enviaron aparecen tachados.
- Tres modos: *Preguntar a la obra*, *Ponme a prueba* (preguntas de comprensión corregidas con la frase que las resuelve) y *Socrático*.
- Las respuestas, con sus frases citadas, se guardan en el Cuaderno.
- Método: sección 12, «Conversar con la obra»; misión «Ponte a prueba» en Círculos de lectura.
### Notas
- Conversar funciona solo en la página publicada en Claude (capacidad `sample`): cada pregunta usa la cuenta de Claude de quien pregunta. En GitHub Pages y en el archivo único la pestaña explica que no está disponible; el resto de la herramienta no cambia.

## [1.2.0] · 2026-11-04
### Añadido
- Pestaña **Personajes** en la lectura: red de personajes (menciones explícitas y, en teatro, parlamentos) con roles (protagonista, principal, secundario, episódico, puente), círculos de color, recorrido por tramos y línea «Quién está cuándo».
- **Árbol de familia**: generaciones, parejas (también entre generaciones) y, para cada vínculo, las frases del texto que lo respaldan; los vínculos sin frase se dibujan punteados.
- **Ficha de personaje**: cómo lo llama la obra (epítetos y aposiciones), familia, con quién coincide, motivos que lo acompañan y citas.
- Reparto y familia editables en el navegador (formas de varias palabras, `*`, rangos por capítulo `[a-b]`); nombres compartidos resueltos por contexto.
- Perfil de *Cien años de soledad* (reparto con rangos, familia y motivos); familia en los perfiles de *Hamlet* y *La metamorfosis*.
- **Mi galería**: las lecturas quedan en el navegador (IndexedDB) y se importan o descargan como proyectos.
- **Círculos de lectura**: guía para grupos (roles, misiones, sesión para profesores) y Cuaderno con notas firmadas que se unen desde varios proyectos.
- `sitio/js/personajes.js` (mismo método que el cuaderno de Colab, verificado con las cinco obras).
### Cambiado
- La portada muestra *Hamlet* y *La metamorfosis* como «Ejemplos de lo que puedes hacer»; la página «Probar» pasa a ser «Círculos de lectura».
- Títulos de las obras en naranja.
- Método ampliado (personajes y árbol) y referencias verificadas, con DOI y Elson, Dames y McKeown (2010).
- El laboratorio de Colab incluye el paso 3 (personajes, árbol y fichas) y la tarea de IA «rol de un personaje».

## [1.1.0] · 2026-10-30
### Cambiado
- Nueva paleta: azul tinta como color dominante (cabecera, títulos, enlaces, pestañas) y naranja para las acciones principales (subir, abrir, aplicar, citar).
### Añadido
- `descargas/explorador-de-motivos.html`: la herramienta completa en un solo archivo (con pdf.js y la galería incluidos) que se abre sin internet ni servidor.

## [1.0.0] · 2026-10-28
### Añadido
- Versión web (`sitio/`): lectura del PDF en el navegador con pdf.js, sin servidor.
- Galería con obras de dominio público (*La metamorfosis*, *Hamlet*).
- Lectura en red con cinco pestañas: Hallazgos, Red (recorrido por tramos), Motivos, Taller y Cuaderno.
- Proyectos guardables (`.motivos.json`) con el texto procesado, los motivos, las notas y las citas.
- Página de método y guía de prueba con lectores (`docs/`).
- Limpieza: capítulos con ordinales, números sueltos y títulos sin número; notas al pie; ligaduras; numeración que deriva por páginas en blanco.
- Laboratorio (`laboratorio/`): cuaderno de Colab con el mismo motor y lectura asistida con IA (opcional).
