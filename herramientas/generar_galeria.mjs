// Regenera los datos de la galería a partir de los PDF (Node 20+).
// Uso: npm install && node herramientas/generar_galeria.mjs <carpeta-con-pdfs>
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { leerPDF } from "../sitio/js/pdf-lineas.js";
import { procesar } from "../sitio/js/motor.js";
import fs from "fs";
import path from "path";
const carpeta = process.argv[2] || "pdfs";
// [archivo PDF, archivo de salida]; las obras con derechos vigentes van a galeria/privada (no se suben a GitHub)
const obras = [
  ["La_metamorfosis.pdf", "galeria/la-metamorfosis.json"],
  ["William_Shakespeare_Hamlet.pdf", "galeria/hamlet.json"],
  ["ElPrincipito.pdf", "galeria/privada/el-principito.json"],
  ["el-mundo-es-ancho-y-ajeno.pdf", "galeria/privada/el-mundo-es-ancho-y-ajeno.json"],
  ["cien-anos-de-soledad.pdf", "galeria/privada/cien-anos-de-soledad.json"],
];
for (const [pdf, salida] of obras) {
  const ruta = path.join(carpeta, pdf);
  if (!fs.existsSync(ruta)) { console.log("— falta", ruta); continue; }
  const paginas = await leerPDF(pdfjs, new Uint8Array(fs.readFileSync(ruta)));
  const {datos, informe} = procesar(paginas, pdf, {});
  fs.mkdirSync(path.dirname("sitio/" + salida), {recursive: true});
  fs.writeFileSync("sitio/" + salida, JSON.stringify(datos));
  console.log(`✔ ${datos.titulo}: ${informe.segmentos} segmentos, ${informe.palabras} palabras, ${datos.motivos.length} motivos → sitio/${salida}`);
}
