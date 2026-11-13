# Explorador de motivos

**Una lectura en red de obras narrativas.** Subes el PDF de una obra que ya leíste y el Explorador encuentra sus motivos (imágenes, objetos, espacios, ideas) y sus personajes, cómo se unen, cómo cambian de capítulo en capítulo y en qué frases ocurre, con su página. Para obras con muchos personajes o nombres que se repiten (como *Cien años de soledad*), arma además un árbol de familia donde cada vínculo trae la frase que lo respalda. No reemplaza la lectura: la condensa y te devuelve al texto para confirmar o descartar cada hallazgo.

Pensada para quien prepara una tesis o un trabajo sobre una obra narrativa, y para lectores curiosos. Funciona con novelas, cuentos largos y, en segundo plano, teatro.

## Dos formas de usarla

| | Para qué | Dónde |
|---|---|---|
| **Web** | Explorar una obra sin programar: ejemplos, subir un PDF, Mi galería, círculos de lectura | `sitio/` (se publica con GitHub Pages) |
| **Laboratorio** | Ver el método paso a paso, modificar el código, usar la lectura asistida con IA | `laboratorio/Explorador_de_motivos.ipynb` (Google Colab) |

Ambas usan el mismo motor de limpieza y los mismos cálculos.

## Usarla sin instalar nada

Abre `descargas/explorador-de-motivos.html` con doble clic: es la herramienta completa en un solo archivo (unos 3 MB) y funciona sin internet.

## Usarla en tu computadora (versión con carpetas)

```bash
python3 -m http.server 8000 --directory sitio
# abre http://localhost:8000
```

(Hace falta un servidor local porque el navegador no carga módulos desde `file://`.)

## Publicarla en GitHub Pages

1. Crea un repositorio y sube este proyecto (rama `main`).
2. En *Settings → Pages*, elige **GitHub Actions** como fuente.
3. Cada `push` a `main` publica `sitio/` con el flujo `.github/workflows/pages.yml`.

## Conversar con la obra (versión 1.3)

La pestaña **Conversar** es un compañero de lectura que usa Claude y responde solo con frases de la obra, numeradas y con su página. Funciona en la página publicada en Claude, donde cada pregunta usa la cuenta de Claude de quien pregunta; en GitHub Pages y en el archivo único aparece como no disponible. Nunca se envía la obra completa: solo una ficha (capítulos, personajes, familia, motivos) y las frases elegidas para cada pregunta. Detalles en el [método](docs/metodo.md#12-conversar-con-la-obra).

## La galería y los derechos de autor

La galería pública incluye solo obras de dominio público. Las demás se procesan en el navegador de quien las sube y **no** se guardan en el repositorio (`sitio/galeria/privada/` está en `.gitignore`). Un proyecto `.motivos.json` contiene el texto procesado: compártelo solo para estudio e investigación.

Para regenerar la galería: `npm install` y `npm run galeria` con los PDF en una carpeta `pdfs/`.

## Documentación

- [Método: cómo se calcula cada cosa](docs/metodo.md)
- [Guía de prueba con lectores](docs/guia-de-prueba.md)
- [Arquitectura](docs/arquitectura.md)
- [Historial de versiones](CHANGELOG.md)

## Citar

Explorador de motivos (versión 1.3) [Software]. (2026). Taller de Humanidades Digitales 1, Universidad del Pacífico.

Los datos de cita están en `CITATION.cff` (GitHub muestra el botón *Cite this repository*). Agrega allí a las personas autoras.

## Licencia

Código bajo licencia MIT. Incluye pdf.js (Apache 2.0); ver `NOTICE`.
