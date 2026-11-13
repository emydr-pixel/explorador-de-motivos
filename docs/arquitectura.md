# Arquitectura

```
PDF ──pdf.js──▶ páginas de líneas ──motor.js──▶ texto limpio · oraciones con página · candidatos ──▶ datos de lectura (JSON)
                                                                                                        │
                                                       proyecto .motivos.json ◀── lectura.js (modelo + vista) ◀┘
```

| Archivo | Qué hace |
|---|---|
| `sitio/js/pdf-lineas.js` | Extrae las líneas de cada página con pdf.js y las ordena de arriba abajo. |
| `sitio/js/motor.js` | Limpieza, estructura, voces, oraciones con página, tramos, candidatos y diccionario inicial. Es el mismo algoritmo que el cuaderno de Colab (`laboratorio/`), sin dependencias del navegador: también corre en Node. |
| `sitio/js/lectura.js` | `crearModelo` calcula conexiones, solidez, familias, puente y disposición; `montarLectura` dibuja las cinco pestañas y guarda proyectos. |
| `sitio/index.html` | Portada, galería, herramienta, método, guía de prueba y cita. |
| `herramientas/generar_galeria.mjs` | Regenera los datos de la galería desde los PDF. |

Todo ocurre en el navegador: el PDF no se envía a ningún servidor. Para publicar el sitio basta un hosting estático (GitHub Pages, ver `.github/workflows/pages.yml`).
