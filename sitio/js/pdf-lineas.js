// Convierte un PDF en páginas de líneas de texto usando pdf.js (en el navegador o en Node).
export async function leerPDF(pdfjs, datos, progreso = () => {}) {
  const tarea = pdfjs.getDocument({data: datos, isEvalSupported: false, useSystemFonts: true});
  const doc = await tarea.promise;
  const paginas = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pag = await doc.getPage(n);
    const tc = await pag.getTextContent();
    paginas.push(lineasDe(tc.items));
    pag.cleanup();
    progreso(n, doc.numPages);
  }
  await tarea.destroy();
  return paginas;
}

function lineasDe(items) {
  // arma líneas en el orden del documento y luego las ordena de arriba abajo (como pdfplumber)
  const lineas = []; let actual = "", y = null, finX = null, yLinea = null;
  const cerrar = () => { const t = actual.replace(/\s+/g, " ").trim(); if (t) lineas.push([t, yLinea, lineas.length]); actual = ""; finX = null; yLinea = null; };
  for (const it of items) {
    if (!("str" in it)) continue;
    const iy = it.transform[5], ix = it.transform[4], alto = Math.abs(it.transform[3]) || it.height || 10;
    if (y !== null && actual && Math.abs(iy - y) > alto * 0.5) cerrar();
    if (it.str) {
      if (actual && finX !== null && ix - finX > alto * 0.12 && !/\s$/.test(actual) && !/^\s/.test(it.str)) actual += " ";
      if (yLinea === null) yLinea = iy;
      actual += it.str; finX = ix + it.width; y = iy;
    }
    if (it.hasEOL) { cerrar(); y = null; }
  }
  if (actual.trim()) cerrar();
  return lineas.sort((a, b) => (b[1] - a[1]) > 2 || (b[1] - a[1]) < -2 ? b[1] - a[1] : a[2] - b[2]).map(l => l[0]);
}
