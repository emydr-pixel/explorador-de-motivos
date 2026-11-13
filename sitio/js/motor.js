// Explorador de motivos · motor de limpieza y sugerencias (versión web)
// Port del motor del cuaderno de Colab: mismas reglas, mismos resultados. No usa el DOM: corre en el navegador y en Node.

// ======================= PERFILES DE LAS OBRAS PROBADAS =======================
export const PERFILES = {
  "El principito": {claves: ["el principito"], autor: "Antoine de Saint-Exupéry",
    tramos: {"Los mayores y el piloto": [1], "El encuentro": [2, 3, 4], "Baobabs y la flor": [5, 6, 7, 8, 9],
             "Los seis planetas": [10, 11, 12, 13, 14, 15], "La Tierra: el vacío": [16, 17, 18, 19, 20],
             "El zorro": [21], "Prisa y sed": [22, 23], "El pozo": [24, 25], "La despedida": [26, 27]},
    erratas: {"qué contesto estoy": "qué contento estoy", "con gustó a este": "con gusto a este", "dijeran las rosas": "dijeron las rosas"},
    motivos: `flor: flor, flores
rosa: rosa, rosas, rosal*
estrellas: estrella, estrellas
mirar y ver: ojo, ojos, mir*, ver, ves, veo, vista
corazón: corazon, corazones
agua y pozo: agua, sed, pozo*, fuente*, beber, bebe
desierto: desierto*, arena, duna*
personas mayores: mayores, mayor
números: cifra*, numero*, millon*, cuenta, cuentas, sumar
serio: serio, seria, serios, serias
domesticar: domestic*, vinculo*, rito*
invisible y esencial: invisible*, esencial*
risa: reir, rie, rio, risa*, cascabel*
cordero: cordero*, bozal
serpiente: serpiente*, veneno, morder, mordisco
baobabs: baobab*
zorro: zorro, zorros
planeta: planeta, planetas
rey: rey, reyes`},
  "La metamorfosis": {claves: ["la metamorfosis", "gregorio samsa"], autor: "Franz Kafka",
    motivos: `insecto: insecto*, bicho*, sabandija*, monstruo*, animal*
cuerpo: cuerpo*, patas, pata, patitas, caparazon, espalda, vientre, antenas, mandibula*
habitación: habitacion*, cuarto, pared*, techo, muebles, mueble, cama, sofa, canape
puerta: puerta*, llave*, cerradura*
ventana: ventana*
padre: padre, padres
madre: madre
hermana: hermana, grete
trabajo y dinero: trabajo*, oficina, apoderado, jefe, viajante, negocio*, deuda*, dinero, empleo*
comida: comida*, comer, leche, pan, manzana*, alimento*
música: violin, musica, tocar, tocaba
miedo y asco: miedo*, asco, repugnan*, horror*, espanto*
silencio y ruido: silencio*, ruido*, grito*, chillido*
huéspedes: huesped*
herida y dolor: sangr*, herida*, dolor*
Gregorio: gregorio`},
  "El mundo es ancho y ajeno": {claves: ["el mundo es ancho y ajeno"], autor: "Ciro Alegría",
    tramos: {"Rumi: la comunidad": [1, 2, 3, 4, 5, 6], "Litigio y despojo": [7, 8], "Yanañahui y la cárcel": [9, 10, 11, 12],
             "Los dispersos I": [13, 14, 15], "Muerte de Rosendo": [16], "Los dispersos II": [17, 18, 19, 20],
             "Benito Castro y la resistencia": [21, 22, 23, 24]},
    stop_extra: ["pa", "aura", "tamien", "ques", "pue", "onde", "ande", "nomas", "dao", "taba", "asina"],
    motivos: `tierra: tierra, tierras
comunidad: comunidad, comunidades, comuner*
indio: indio, indios, india, indias, indiada, indigena*
hacendado y patrón: hacend*, patron, patrones, gamonal*, hacienda*
ley y papeles: ley, leyes, juez, jueces, juicio*, papeles, titulos, abogado*, tinterillo
sangre y muerte: sangre, muert*, morir, muere, murio, cadaver*
trigo y maíz: trigo*, maiz*, cosecha*, siembra*, sembr*
cerros y Andes: cerro, cerros, andes, puna, punas, cumbre*
coca: coca
camino: camino*, sendero*
lucha: lucha*, rebel*, sublev*, fusil*, balazo*
cárcel: carcel*, preso, presos
selva y caucho: selva*, caucho*, cauchero*
éxodo: exodo, destierro, ajeno*, emigr*
Rosendo: rosendo
Benito: benito
Amenábar: amenabar
Rumi: rumi`},
  "Hamlet": {claves: ["hamlet"], autor: "William Shakespeare (trad. Moratín)",
    motivos: `padre: padre, padres
madre: madre
espectro y sombra: espectro, sombra*, fantasma, aparecido, aparicion
muerte: muerte*, muert*, morir, muero, muere, murio
venganza: veng*
locura: loco, loca, locura*, demencia, delirio
veneno: veneno*, emponzoñ*
sepultura y calavera: sepultur*, calavera*, craneo*, tumba*, sepulcro*
cielo: cielo, cielos
infierno: infierno*, infernal*
amor: amor, amores, amar, amo, ama
noche: noche, noches
teatro y apariencia: comico*, comedia, representa*, fingi*, apariencia*, mascara
alma y conciencia: alma, almas, conciencia
corona y trono: corona, trono, reino, cetro
Hamlet: hamlet
Ofelia: ofelia`},
};

// ======================= UTILIDADES =======================

// Reparto y familia de los perfiles (mismos que en el cuaderno de Colab) y el perfil de Cien años de soledad
const PERFILES_PERSONAJES = {
 "El principito": {
  "personajes": "el principito: principito\nla flor: flor, rosa\nel zorro: zorro\nla serpiente: serpiente\nel cordero: cordero\nel rey: rey\nel vanidoso: vanidoso\nel bebedor: bebedor\nel hombre de negocios: hombre de negocios\nel farolero: farolero\nel geógrafo: geografo\nel comerciante: comerciante\nlas personas mayores: personas mayores"
 },
 "La metamorfosis": {
  "personajes": "Gregorio: gregorio samsa, gregorio\nGrete (la hermana): greta, grete, hermana\nel padre: padre, señor samsa\nla madre: madre, señora samsa\nel apoderado: apoderado\nel jefe: jefe\nla asistenta: asistenta\nlos huéspedes: huesped*",
  "familia": "Gregorio: hijo del padre y de la madre; hermano de Grete (la hermana)\nGrete (la hermana): hija del padre y de la madre\nel padre: esposo de la madre"
 },
 "Hamlet": {
  "personajes": "Hamlet: hamlet, principe\nClaudio (el rey): claudio, rey\nGertrudis (la reina): gertrudis, reina\nla Sombra (el padre): la sombra, sombra, fantasma\nPolonio: polonio\nOfelia: ofelia\nLaertes: laertes\nHoracio: horacio\nMarcelo: marcelo\nBernardo: bernardo\nFrancisco: francisco\nRicardo: ricardo\nGuillermo: guillermo\nEnrique: enrique\nReynaldo: reynaldo\nFortimbrás: fortimbras\nVoltiman: voltiman\nlos cómicos: comico, comicos\nlos sepultureros: sepulturero, sepultureros\nYorick: yorick",
  "familia": "Hamlet: hijo de la Sombra (el padre) y de Gertrudis (la reina); sobrino de Claudio (el rey)\nla Sombra (el padre): esposo de Gertrudis (la reina); hermano de Claudio (el rey)\nClaudio (el rey): esposo de Gertrudis (la reina)\nOfelia: hija de Polonio; hermana de Laertes\nLaertes: hijo de Polonio"
 },
 "Cien años de soledad": {
  "claves": [
   "cien años de soledad",
   "cien anos de soledad"
  ],
  "autor": "Gabriel García Márquez",
  "personajes": "José Arcadio Buendía: jose arcadio buendia\nÚrsula Iguarán: ursula iguaran, ursula\nJosé Arcadio (hijo): jose arcadio [1-10]\nCoronel Aureliano Buendía: coronel aureliano buendia, coronel aureliano, aureliano buendia, coronel, aureliano [1-14]\nAmaranta: amaranta buendia, amaranta\nRebeca: rebeca\nRemedios Moscote: remedios moscote, remedios [1-6]\nApolinar Moscote: don apolinar moscote, apolinar moscote, apolinar\nPilar Ternera: pilar ternera, pilar\nArcadio: arcadio\nAureliano José: aureliano jose\nSanta Sofía de la Piedad: santa sofia de la piedad, santa sofia\nRemedios, la bella: remedios la bella, remedios [7-20]\nAureliano Segundo: aureliano segundo\nJosé Arcadio Segundo: jose arcadio segundo\nFernanda del Carpio: fernanda del carpio, fernanda\nPetra Cotes: petra cotes, petra\nMeme (Renata Remedios): renata remedios, meme\nJosé Arcadio (seminarista): jose arcadio [11-20]\nAmaranta Úrsula: amaranta ursula\nMauricio Babilonia: mauricio babilonia, mauricio\nAureliano Babilonia: aureliano babilonia, aureliano [15-20]\nGastón: gaston\nMelquíades: melquiades\nPrudencio Aguilar: prudencio aguilar, prudencio\nPietro Crespi: pietro crespi, pietro\nGerineldo Márquez: coronel gerineldo marquez, gerineldo marquez, gerineldo\nlos diecisiete Aurelianos: aureliano triste, aureliano centeno, aureliano amador, aureliano serrador, aureliano arcaya, diecisiete aurelianos\nPadre Nicanor: padre nicanor reyna, padre nicanor, nicanor\nGeneral Moncada: general jose raquel moncada, general moncada, coronel moncada, moncada\nNigromanta: nigromanta\nGabriel: gabriel",
  "familia": "José Arcadio (hijo): hijo de José Arcadio Buendía y Úrsula Iguarán; esposo de Rebeca\nCoronel Aureliano Buendía: hijo de José Arcadio Buendía y Úrsula Iguarán; esposo de Remedios Moscote\nAmaranta: hija de José Arcadio Buendía y Úrsula Iguarán\nRebeca: hija adoptiva de José Arcadio Buendía y Úrsula Iguarán\nRemedios Moscote: hija de Apolinar Moscote\nJosé Arcadio Buendía: esposo de Úrsula Iguarán\nArcadio: hijo de José Arcadio (hijo) y Pilar Ternera; pareja de Santa Sofía de la Piedad\nAureliano José: hijo de Coronel Aureliano Buendía y Pilar Ternera\nlos diecisiete Aurelianos: hijos de Coronel Aureliano Buendía\nRemedios, la bella: hija de Arcadio y Santa Sofía de la Piedad\nAureliano Segundo: hijo de Arcadio y Santa Sofía de la Piedad; esposo de Fernanda del Carpio; amante de Petra Cotes\nJosé Arcadio Segundo: hijo de Arcadio y Santa Sofía de la Piedad\nJosé Arcadio (seminarista): hijo de Aureliano Segundo y Fernanda del Carpio\nMeme (Renata Remedios): hija de Aureliano Segundo y Fernanda del Carpio; amante de Mauricio Babilonia\nAmaranta Úrsula: hija de Aureliano Segundo y Fernanda del Carpio; esposa de Gastón; amante de Aureliano Babilonia\nAureliano Babilonia: hijo de Mauricio Babilonia y Meme (Renata Remedios); sobrino de Amaranta Úrsula\nPietro Crespi: novio de Rebeca; pretendiente de Amaranta\nGerineldo Márquez: pretendiente de Amaranta",
  "motivos": "soledad: soledad, solitari*\nmemoria y olvido: memoria, recuerd*, olvid*\ninsomnio y peste: insomnio, peste\nlluvia y diluvio: lluvia*, llov*, diluvio\noro y pescaditos: oro, pescadito*\nguerra: guerra*\nhielo: hielo\ngitanos e inventos: gitano*, invento*, iman*, lupa\npergaminos: pergamino*, manuscrito*\ncasa: casa\ncola de cerdo: cola, cerdo*\nmariposas amarillas: mariposa*, amarill*\nmuerte: muerte, muert*, morir, murio\ntiempo: tiempo, siglo*\nlaboratorio: laboratorio, alquimia, platero*\ncompañía bananera: banano*, bananera*, compañia, gringo*\ntren: tren\nfusilamiento: peloton, fusil*\nolor: olor*\nMacondo: macondo\nMelquíades: melquiades"
 }
};
for (const [k, v] of Object.entries(PERFILES_PERSONAJES)) PERFILES[k] = {...(PERFILES[k] || {}), ...v};

export const sinTildes = t => t.replace(/ñ/g, "\u0001").replace(/Ñ/g, "\u0002").normalize("NFKD")
  .replace(/[̀-ͯ]/g, "").replace(/\u0001/g, "ñ").replace(/\u0002/g, "Ñ");
export const palabras = t => (t.match(/[\p{L}\p{N}_]+/gu) || []).length;
const esMayus = t => t === t.toUpperCase() && t !== t.toLowerCase();
const LETRA = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";
const RX_ROMANO = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
function romanoAInt(s) {
  if (!s || !RX_ROMANO.test(s)) return null;
  const v = {I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000}; let tot = 0;
  for (let i = 0; i < s.length; i++) { const a = v[s[i]], b = v[s[i + 1]]; tot += b && b > a ? -a : a; }
  return tot;
}
export function aRomano(n) {
  let out = "";
  for (const [v, r] of [[100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]])
    while (n >= v) { out += r; n -= v; }
  return out;
}
const ORDINALES = {};
[[], ["primero", "primera", "uno", "una"], ["segundo", "segunda", "dos"], ["tercero", "tercera", "tres"], ["cuarto", "cuarta", "cuatro"],
 ["quinto", "quinta", "cinco"], ["sexto", "sexta", "seis"], ["septimo", "setimo", "septima", "siete"], ["octavo", "octava", "ocho"],
 ["noveno", "novena", "nueve"], ["decimo", "decima", "diez"], ["undecimo", "once"], ["duodecimo", "doce"]]
  .forEach((ws, i) => ws.forEach(w => ORDINALES[w] = i));
function aNumero(s) {
  s = s.replace(/^[ .:]+|[ .:]+$/g, "");
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  if (s.toUpperCase() === s || s.length <= 4) { const r = romanoAInt(s.toUpperCase()); if (r) return r; }
  return ORDINALES[sinTildes(s.toLowerCase())] || null;
}
const percentil = (xs, q) => { const a = [...xs].sort((x, y) => x - y); if (!a.length) return 0; const i = q * (a.length - 1), lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); };
const mediana = xs => percentil(xs, 0.5);
const contar = arr => { const m = new Map(); arr.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return m; };
const masComun = m => { let best = null, c = -1; for (const [k, v] of m) if (v > c) { best = k; c = v; } return [best, c]; };

// ======================= LIMPIEZA =======================
const LIGADURAS = {"ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl", "ﬅ": "st", "ﬆ": "st", "­": "-", "¬": "-"};
export const normalizarLinea = l => { for (const [a, b] of Object.entries(LIGADURAS)) l = l.split(a).join(b); return l.trim(); };
const RUIDO = /https?:\/\/|www\.|©|derechos reservados|todos los derechos|libro descargado|esperamos que lo disfrut|gracias por leer|descubre nuestra colecci|material autorizado|edici[oó]n digital|\bisbn\b/i;
const RUIDO_FINAL = /se termin[oó] de imprimir|impreso en|la edici[oó]n consta|\btiraje\b|primera edici[oó]n|departamento editorial|dise[ñn]o y formaci[oó]n|^rector$|derechos patrimoniales|prohibida la reproducci|^colof[oó]n$/i;
const NUM_PAG = /^[\-–—~·•\s]*(?:p[aá]g(?:ina)?\.?\s*)?(\d{1,4})[\-–—~·•\s]*$/i;
const PAL = `([0-9]+|[A-Za-zÁÉÍÓÚáéíóú]+)(?![${LETRA}0-9])`;
const PAT_TIT = {
  capitulo: new RegExp(`^[^\\p{L}\\p{N}]{0,2}C?AP[IÍ]TULO\\s+${PAL}\\.?\\s*[:.\\-–—]?\\s*(.*)$`, "iu"),
  parte: new RegExp(`^(?:PARTE|CANTO|LIBRO|JORNADA|TRATADO|CUENTO)\\s+${PAL}\\.?\\s*[:.\\-–—]?\\s*(.*)$`, "iu"),
  romano: /^([IVXLC]{1,7})\.?()$/, numero: /^(\d{1,3})\.?()$/,
};
const PAT_ACTO = new RegExp(`^ACTO\\s+${PAL}\\.?\\s*$`, "iu"), PAT_ESCENA = new RegExp(`^ESCENA\\s+${PAL}\\.?\\s*$`, "iu");
const RAYA_INICIO = /^[-–—]\s?[¿¡«"“A-ZÁÉÍÓÚÑ]/;
const CORTE_RAYA = /(?:(?<=\s)|^)[-–—]+\s*|\s*[-–—]+(?=[\s,.;:!?…»)]|$)/;
const FIN_ORACION = /[.!?…:»”"]$/;
const TAG_TEATRO = /^([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ0-9º.\sl]*?)\s*(?:\.\s*[-–—]|:)\s*(.*)$/;
const MARCA_G = /(\d+)/g, MARCA_INI = /^(\d+)/;
const marca = p => `${p}`;
const sinMarcas = t => t.replace(MARCA_G, "");
const esTitulo = l => [...Object.values(PAT_TIT), PAT_ACTO, PAT_ESCENA].some(p => p.test(l));

function coincidencias(textos, patron, desde = 0, hasta = null) {
  const out = [];
  for (let i = desde; i < (hasta === null ? textos.length : hasta); i++) {
    const m = textos[i].match(patron);
    if (m) { const n = aNumero(m[1]); if (n) out.push([i, n, (m[2] || "").trim()]); }
  }
  return out;
}
function cadena(ms) {   // la secuencia 1, 2, 3… más larga (tolera que falten hasta 2 títulos seguidos)
  const cadenas = []; let actual = [], esp = 1, faltan = [];
  for (const m of ms) {
    if (m[1] === esp) { actual.push(m); esp++; }
    else if (actual.length && esp < m[1] && m[1] <= esp + 2) { for (let x = esp; x < m[1]; x++) faltan.push(x); actual.push(m); esp = m[1] + 1; }
    else if (m[1] === 1) { cadenas.push([actual, faltan]); actual = [m]; esp = 2; faltan = []; }
  }
  cadenas.push([actual, faltan]);
  return cadenas.reduce((a, b) => (b[0].length > a[0].length || (b[0].length === a[0].length && (b[0].length ? b[0][b[0].length - 1][0] : 0) > (a[0].length ? a[0][a[0].length - 1][0] : 0))) ? b : a);
}
function titulosSinNumero(textos, inicios) {
  const cand = [];
  textos.forEach((t, i) => {
    const letras = t.replace(new RegExp(`[^A-Za-zÁÉÍÓÚÑáéíóúñ]`, "g"), "");
    if (inicios[i] && letras.length >= 3 && [...letras].filter(c => c === c.toUpperCase()).length / letras.length > 0.85
        && t.split(/\s+/).length <= 8 && !FIN_ORACION.test(t.replace(/[!?¡¿]+$/, "")) && !RUIDO.test(t)) cand.push(i);
  });
  if (cand.length < 3) return [];
  const tramos = cand.map((a, k) => (k + 1 < cand.length ? cand[k + 1] : textos.length) - a);
  if (mediana(tramos) < 25) return [];
  return cand.map((i, k) => [i, k + 1, textos[i], null]);
}
function detectarEstructura(textos, conf, inicios) {
  const forz = conf.estructura || null, cand = {};
  if (conf.patron_titulo) cand.propio = cadena(coincidencias(textos, new RegExp(conf.patron_titulo, "u")));
  for (const [k, p] of Object.entries(PAT_TIT)) cand[k] = cadena(coincidencias(textos, p));
  const [actos, fActos] = cadena(coincidencias(textos, PAT_ACTO));
  let escenas = [], fEsc = [];
  actos.forEach((a, j) => {
    const fin = j + 1 < actos.length ? actos[j + 1][0] : textos.length;
    const [es, fa] = cadena(coincidencias(textos, PAT_ESCENA, a[0], fin));
    escenas = escenas.concat(es.map(([i, n, t]) => [i, n, t, a[1]]));
    fEsc = fEsc.concat(fa.map(x => `Acto ${aRomano(a[1])}, escena ${aRomano(x)}`));
  });
  const largos = Object.fromEntries(Object.entries(cand).map(([k, c]) => [k, c[0].length]));
  if (forz === "teatro" || (!forz && actos.length >= 2 && escenas.length >= actos.length))
    return ["teatro", escenas, fActos.map(x => `Acto ${aRomano(x)}`).concat(fEsc)];
  if (forz === "bloques") return ["bloques", [], []];
  if (forz === "titulos") return ["titulos", titulosSinNumero(textos, inicios), []];
  let clave;
  if (forz) clave = forz;
  else if (cand.propio && largos.propio >= 2) clave = "propio";
  else {
    const orden = ["capitulo", "parte", "romano", "numero"];
    clave = orden.reduce((a, b) => largos[b] > largos[a] ? b : a);
    if (largos[clave] < 2) { const tit = inicios ? titulosSinNumero(textos, inicios) : []; return tit.length ? ["titulos", tit, []] : ["bloques", [], []]; }
  }
  const [heads, faltan] = cand[clave];
  return [clave, heads.map(([i, n, t]) => [i, n, t, null]), faltan];
}
const normHablante = s => s.replace(/\bl(?=\s*\.?\s*º)/g, "1").replace(/\.?\s*º/g, "").replace(/^[ .]+|[ .]+$/g, "").replace(/\s+/g, " ");
function esTag(l) {
  const m = l.match(TAG_TEATRO); if (!m) return null;
  const nombre = m[1];
  if (nombre.replace(/[^A-ZÁÉÍÓÚÑÜ]/g, "").length < 2 || romanoAInt(nombre.replace(/^[ .]+|[ .]+$/g, ""))) return null;
  return [normHablante(nombre), m[2]];
}
function piezasNarrativa(p) {
  let out;
  if (RAYA_INICIO.test(sinMarcas(p))) {
    out = p.split(CORTE_RAYA).map((x, i) => i > 0 ? [i % 2 === 1 ? "diálogo" : "narración", x.replace(/^[ ,]+|[ ,]+$/g, "")] : null).filter(Boolean);
  } else if (/^[“"]/.test(sinMarcas(p).trim())) {
    const m = p.match(/^(\s*(?:\d+)?\s*[“"])([^”"]{1,1500})([”"]?)([\s\S]*)$/);
    out = m ? [["diálogo", m[2]]].concat(m[4].trim() ? [["narración", m[4]]] : []) : [["narración", p]];
  } else {
    out = []; let pos = 0;
    for (const m of p.matchAll(/«[^»]{1,800}»/g)) {
      if (m.index > pos) out.push(["narración", p.slice(pos, m.index)]);
      out.push(["diálogo", m[0].slice(1, -1)]); pos = m.index + m[0].length;
    }
    out.push(["narración", p.slice(pos)]);
  }
  return out.map(([v, t]) => [v, t.replace(/\s+/g, " ").trim()]).filter(([, t]) => /\w|[\p{L}]/u.test(sinMarcas(t)));
}
function unir(pars, linea, pag) { const p = pars[pars.length - 1]; p[1] += " " + (pag !== p[2] ? marca(pag) : "") + linea; p[2] = pag; }
function parrafosNarrativa(lineas, ancho) {
  const pars = []; let prev = "";
  for (const [t, pg] of lineas) {
    if (!pars.length || RAYA_INICIO.test(t) || (FIN_ORACION.test(prev) && prev.length < 0.8 * ancho)) pars.push([pg, t, pg]);
    else unir(pars, t, pg);
    prev = t;
  }
  return pars.map(p => [p[0], piezasNarrativa(p[1])]);
}
function parrafosTeatro(lineas) {
  const pars = [];
  for (const [t, pg] of lineas) {
    const tag = esTag(t);
    if (tag) pars.push([pg, tag[1], pg, tag[0]]);
    else if (!pars.length) pars.push([pg, t, pg, "ACOTACIÓN"]);
    else unir(pars, t, pg);
  }
  return pars.filter(p => p[1].trim()).map(p => [p[0], [[p[3], p[1].replace(/\s+/g, " ").trim()]]]);
}
const MENORES = new Set(["y", "e", "o", "u", "de", "del", "la", "las", "el", "los", "en", "a", "al", "con", "por", "para", "un", "una", "unos", "otros", "sus"]);
const titular = t => !esMayus(t) ? t : t.toLowerCase().split(/\s+/).map((w, k) => k && MENORES.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(" ").replace("¿a", "¿A");
export const ETQ_SEG = {capitulo: "Cap.", romano: "Cap.", numero: "Cap.", parte: "Parte", propio: "Sección", teatro: "Escena", bloques: "Bloque", titulos: "Cap."};

export function limpiar(paginasCrudas, conf = {}) {
  const paginas = paginasCrudas.map(p => p.map(normalizarLinea));
  const inf = {quitadas: new Map(), ejemplos: new Map(), avisos: []};
  const quitar = (motivo, l) => {
    inf.quitadas.set(motivo, (inf.quitadas.get(motivo) || 0) + 1);
    const ej = inf.ejemplos.get(motivo) || []; if (ej.length < 3 && !ej.includes(l.slice(0, 70))) ej.push(l.slice(0, 70)); inf.ejemplos.set(motivo, ej);
  };
  const nPag = paginas.length, clave = l => l.toLowerCase().replace(/\d+/g, "#");
  const pagCon = new Map();
  paginas.forEach(p => new Set(p.filter(Boolean).map(clave)).forEach(k => pagCon.set(k, (pagCon.get(k) || 0) + 1)));
  const repetidas = new Set([...pagCon].filter(([k, c]) => c >= Math.max(4, 0.2 * nPag) && k.length <= 120).map(([k]) => k));
  const esNum = l => NUM_PAG.test(l);
  // números de página: los que siguen la paginación (valor ≈ a·hoja + b) con referencia local; el resto pueden ser títulos
  const nums = []; paginas.forEach((p, ip) => p.forEach(l => { if (l && esNum(l)) nums.push([ip, parseInt(l.match(NUM_PAG)[1], 10)]); }));
  let paginacion = new Set();
  if (nums.length >= 0.5 * nPag) {
    let mejor = [0, null];
    for (const a of [1, 2]) {
      const r = nums.map(([ip, v]) => v - a * ip);
      const ok = new Set(nums.filter(([ip], i) => Math.abs(r[i] - mediana(r.filter((_, j) => Math.abs(nums[j][0] - ip) <= 8))) <= a + 1).map(([ip, v]) => ip + ":" + v));
      if (ok.size > mejor[0]) mejor = [ok.size, ok];
    }
    paginacion = mejor[0] >= 0.5 * nPag ? mejor[1] : new Set();
  }
  const reglas = (conf.quitar || []).map(q => new RegExp(q, "u"));
  let lineas = []; const impresas = [];
  paginas.forEach((p, ip) => {
    const visibles = [], ns = [];
    for (const l of p) {
      if (!l) continue;
      if (esNum(l)) {
        const v = parseInt(l.match(NUM_PAG)[1], 10);
        if (paginacion.has(ip + ":" + v)) { quitar("número de página", l); ns.push([visibles.length, v]); continue; }
      } else if (repetidas.has(clave(l)) && !esTitulo(l)) { quitar("cabecera o pie repetido", l); continue; }
      if (/\.{4,}\s*\d+\s*$|(?:\s\.){4,}/.test(l)) { quitar("índice", l); continue; }
      if ((l.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/g) || []).length <= 1 && !esTitulo(l)) { quitar("adorno o letra suelta", l); continue; }
      if (reglas.some(r => r.test(l))) { quitar("regla de ajuste", l); continue; }
      visibles.push([l, ip, false]);
    }
    while (visibles.length > 3 && /^(\d{1,3}|\*{1,3})\s?[A-ZÁÉÍÓÚ«“"(]/.test(visibles[visibles.length - 1][0]) && !esTitulo(visibles[visibles.length - 1][0])) {
      quitar("nota al pie", visibles[visibles.length - 1][0]); visibles.pop();
    }
    if (ns.length === 1 && (ns[0][0] === 0 || ns[0][0] === visibles.length)) impresas.push([ip, ns[0][1]]);
    if (visibles.length) visibles[0][2] = true;
    lineas = lineas.concat(visibles);
  });
  const offs = contar(impresas.map(([ip, n]) => n - ip));
  const [off, cOff] = impresas.length ? masComun(offs) : [0, 0];
  if (impresas.length && impresas.length >= Math.max(5, 0.3 * nPag) && cOff >= 0.6 * impresas.length) { inf.cita = "impresa"; lineas.forEach(l => l[1] += off); }
  else { inf.cita = "pdf"; lineas.forEach(l => l[1] += 1); }
  let textos = lineas.map(l => l[0]), corte = null;
  if (conf.final) {
    corte = textos.findIndex(t => t.startsWith(conf.final)); if (corte < 0) { corte = null; inf.avisos.push(`No encontré la frase final «${conf.final}»`); }
  } else {
    const desde = Math.floor(textos.length * 0.92);
    for (let i = desde; i < textos.length; i++) if (RUIDO.test(textos[i]) || RUIDO_FINAL.test(textos[i])) { corte = i; break; }
    while (corte && textos[corte - 1].split(/\s+/).length <= 6 && !FIN_ORACION.test(textos[corte - 1]) && corte > desde) corte--;
  }
  if (corte !== null) { textos.slice(corte).forEach(t => quitar("nota editorial o colofón al final", t)); inf.final_cortado = textos.slice(corte, corte + 3); lineas = lineas.slice(0, corte); }
  const limpias = lineas.filter(l => { if (RUIDO.test(l[0])) { quitar("ruido editorial (URL, ©, ISBN…)", l[0]); return false; } return true; });
  lineas = [];
  for (const l of limpias) {
    const prev = lineas[lineas.length - 1];
    if (prev && /[a-záéíóúñü]-$/.test(prev[0]) && /^[a-záéíóúñü]/.test(l[0]) && (prev[0].slice(0, -1).match(/-/g) || []).length % 2 === 0) {
      inf.quitadas.set("palabra partida unida", (inf.quitadas.get("palabra partida unida") || 0) + 1); prev[0] = prev[0].slice(0, -1) + l[0];
    } else lineas.push(l);
  }
  if (conf.inicio) {
    let i0 = lineas.findIndex(l => l[0].startsWith(conf.inicio));
    if (i0 < 0) inf.avisos.push(`No encontré la frase de inicio «${conf.inicio}»`);
    else { while (i0 > 0 && esTitulo(lineas[i0 - 1][0])) i0--; inf.antes = lineas.slice(0, i0).map(l => l[0]); lineas = lineas.slice(i0); }
  }
  textos = lineas.map(l => l[0]);
  const [modo, heads, faltan] = detectarEstructura(textos, conf, lineas.map(l => l[2]));
  inf.modo = modo; inf.faltan = faltan;
  const teatro = modo === "teatro"; let segs = [];
  if (modo === "bloques") {
    const nPal = parseInt(conf.palabras_por_bloque || 2500, 10), ancho = percentil(textos.map(t => t.length), 0.9);
    let bloque = [], cuenta = 0;
    for (const p of parrafosNarrativa(lineas, ancho)) {
      bloque.push(p); cuenta += p[1].reduce((s, [, t]) => s + palabras(sinMarcas(t)), 0);
      if (cuenta >= nPal) { segs.push(bloque); bloque = []; cuenta = 0; }
    }
    if (bloque.length) segs.push(bloque);
    segs = segs.map((b, k) => ({num: k + 1, etiqueta: String(k + 1), titulo: "", acto: null, parrafos: b}));
    inf.avisos.push(`No encontré títulos de capítulo: dividí la obra en bloques de ~${nPal} palabras.`);
    inf.antes = inf.antes || [];
  } else {
    let inicio = heads[0][0];
    if (teatro) { const actos = textos.slice(0, inicio + 1).map((t, i) => PAT_ACTO.test(t) ? i : -1).filter(i => i >= 0); inicio = Math.min(inicio, actos.length ? Math.max(...actos) : inicio); }
    inf.antes = (inf.antes || []).concat(textos.slice(0, inicio));
    inf.irregulares = heads.filter(([i]) => modo === "capitulo" && !/^CAP[IÍ]TULO \S+$/iu.test(textos[i])).map(([i]) => textos[i]);
    const ancho = percentil(textos.slice(inicio).map(t => t.length), 0.9);
    heads.forEach(([i, n, titulo, acto], k) => {
      const fin = k + 1 < heads.length ? heads[k + 1][0] : lineas.length;
      let cuerpo = lineas.slice(i + 1, fin).filter(l => !(teatro && PAT_ACTO.test(l[0])));
      if (modo === "titulos") titulo = textos[i];
      if (!titulo && cuerpo.length && cuerpo[0][0].length < 90 && !teatro) {
        const letras = cuerpo[0][0].replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
        if (letras && [...letras].filter(c => c === c.toUpperCase()).length / letras.length > 0.8) { titulo = cuerpo[0][0]; cuerpo = cuerpo.slice(1); }
      }
      segs.push({num: k + 1, etiqueta: teatro ? `${aRomano(acto)}.${n}` : (modo === "romano" ? aRomano(n) : String(n)), titulo: titular(titulo), acto,
                 parrafos: teatro ? parrafosTeatro(cuerpo) : parrafosNarrativa(cuerpo, ancho)});
    });
  }
  for (const s of segs) for (const [, piezas] of s.parrafos) piezas.forEach((pz, j) => {
    let t = pz[1]; for (const [mal, bien] of Object.entries(conf.erratas || {})) t = t.split(mal).join(bien); piezas[j] = [pz[0], t];
  });
  return [{modo, teatro, segmentos: segs, cita: inf.cita}, inf];
}

// ======================= ORACIONES Y TRAMOS =======================
const PAT_TOK = /\d+(?:[.,]\d+)*|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
const RX_ORACION = /(?<=[.!?…])\s+/;
export const tokenizar = t => { const orig = t.match(PAT_TOK) || []; return [orig, orig.map(x => sinTildes(x.toLowerCase()))]; };

export function armarOraciones(obra, incluirAcotaciones = false) {
  const O = []; let nPar = 0;
  for (const s of obra.segmentos) for (const [pg0, piezas] of s.parrafos) {
    let actual = pg0, hubo = false;
    for (const [v, t] of piezas) {
      if (v === "ACOTACIÓN" && !incluirAcotaciones) continue;
      for (const o of t.split(RX_ORACION)) {
        const m0 = o.trim().match(MARCA_INI), pag = m0 ? parseInt(m0[1], 10) : actual;
        const ms = [...o.matchAll(MARCA_G)]; if (ms.length) actual = parseInt(ms[ms.length - 1][1], 10);
        const limpio = sinMarcas(o).replace(/\s+/g, " ").trim();
        const [orig, norm] = tokenizar(limpio);
        if (norm.length) { O.push({seg: s.num, par: nPar, pag, voz: v, texto: limpio, toks: norm, orig}); hubo = true; }
      }
    }
    if (hubo) nPar++;
  }
  return O;
}

export function armarTramos(obra, conf, O) {
  const segs = obra.segmentos;
  if (conf.tramos) return {...conf.tramos};
  if (obra.teatro) { const tr = {}; segs.forEach(s => (tr[`Acto ${aRomano(s.acto)}`] = tr[`Acto ${aRomano(s.acto)}`] || []).push(s.num)); return tr; }
  if (segs.length <= 12) return Object.fromEntries(segs.map(s => [s.titulo ? `${s.etiqueta}. ${s.titulo}` : `${ETQ_SEG[obra.modo]} ${s.etiqueta}`, [s.num]]));
  const largo = new Map(); O.forEach(o => largo.set(o.seg, (largo.get(o.seg) || 0) + o.toks.length));
  const total = [...largo.values()].reduce((a, b) => a + b, 0), tr = {}; let actual = [], acum = 0;
  segs.forEach((s, k) => {
    actual.push(s); acum += largo.get(s.num) || 0;
    if (acum >= total / 6 * (Object.keys(tr).length + 1) || k === segs.length - 1) {
      tr[`${ETQ_SEG[obra.modo]} ${actual[0].etiqueta}–${actual[actual.length - 1].etiqueta}`] = actual.map(x => x.num); actual = [];
    }
  });
  return tr;
}

// ======================= CANDIDATOS A MOTIVOS =======================
export const STOP = new Set(`a al algo alguien algun alguna algunas alguno algunos ante antes aqui ahi alli alla aca asi aun aunque bien cada casi
como con contra cual cuales cualquier cuando cuanto cuanta cuantos cuantas de del desde donde dos durante e el ella ellas ello ellos
en entre esa esas ese eso esos esta estas este esto estos hasta hacia la las le les lo los luego mas me mi mis mientras mio mia mios
mias mucho mucha muchos muchas muy nada nadie ni no nos nosotros nosotras nuestra nuestro nuestras nuestros o os otra otro otros otras
para pero poco poca pocos pocas por porque pues que quien quienes se si sin sino sobre su sus tal tan tanto tanta tantos tantas te ti
todo toda todos todas tras tu tus tuyo tuya un una uno unos unas usted ustedes vos vosotros vosotras vuestro vuestra vuestros vuestras
y ya yo ahora entonces despues jamas nunca siempre tambien tampoco solo sola solamente aquel aquella aquellos aquellas aquello mismo
misma mismos mismas suyo suya suyos suyas cuyo cuya cuyos cuyas consigo conmigo contigo menos apenas acaso quiza quizas demasiado
bastante pronto tarde temprano todavia ademas mediante segun hoy ayer manana etc oh ah eh ay adonde vete cosa cosas vez veces modo
manera parte partes lado momento rato forma caso gente demas cierto cierta propio propia primer primero primera segundo segunda ultimo
ultima bueno buena buen buenos buenas gran grande grandes nuevo nueva señor señora señores don doña mejor peor medio media lugar fin
tipo verdad sr ud uno dos tres cuatro cinco seis siete ocho nueve diez`.split(/\s+/));
function conjugar(inf) {
  const r = inf.slice(0, -2), t = inf.slice(-2);
  const term = {ar: "o as a amos ais an e aste o amos asteis aron aba abas abamos abais aban are aras ara aremos areis aran aria arias ariamos ariais arian e es emos eis en ara aras aramos arais aran ase ases asen ando ado ada ados adas ar ad",
    er: "o es e emos eis en i iste io imos isteis ieron ia ias iamos iais ian ere eras era eremos ereis eran eria erias eriamos eriais erian a as amos ais an iera ieras ieramos ierais ieran iese iesen iendo ido ida idos idas er ed",
    ir: "o es e imos is en i iste io isteis ieron ia ias iamos iais ian ire iras ira iremos ireis iran iria irias iriamos iriais irian a as amos ais an iera ieras ieramos ierais ieran iese iesen iendo ido ida idos idas ir id"}[t];
  return term.split(" ").map(x => r + x);
}
const REGULARES = "llegar pasar deber quedar hablar llevar dejar tomar acabar entrar responder contestar preguntar exclamar añadir replicar agregar continuar murmurar explicar tratar esperar ocurrir suceder resultar existir permitir lograr usar necesitar comprender recibir partir subir bajar terminar intentar insistir".split(" ");
const IRREGULARES = `ser soy eres es somos sois son fui fuiste fue fuimos fuisteis fueron era eras eramos erais eran sere seras sera seremos seran
seria serias seriamos serian sea seas seamos sean fuera fueras fueramos fueran fuese fuesen siendo sido sed estar estoy estas esta estamos
estais estan estuve estuviste estuvo estuvimos estuvieron estaba estabas estabamos estaban estare estara estaran estaria estarian este estes
esten estuviera estuvieran estuviese estando estado haber he has ha hemos habeis han hube hubo hubieron habia habias habiamos habian habre
habra habran habria habrian haya hayas hayamos hayan hubiera hubieras hubieramos hubieran hubiese hubiesen habiendo habido hay tener tengo
tienes tiene tenemos teneis tienen tuve tuviste tuvo tuvimos tuvieron tenia tenias teniamos tenian tendre tendra tendran tendria tendrian
tenga tengas tengamos tengan tuviera tuvieran tuviese teniendo tenido ten hacer hago haces hace hacemos haceis hacen hice hiciste hizo
hicimos hicieron hacia hacias haciamos hacian hare haras hara haran haria harian haga hagas hagamos hagan hiciera hicieran hiciese haciendo
hecho hecha hechos haz poder puedo puedes puede podemos podeis pueden pude pudo pudieron podia podias podiamos podian podre podra podran
podria podrias podrian pueda puedas puedan pudiera pudieran pudiese pudiendo podido decir digo dices dice decimos decis dicen dije dijiste
dijo dijimos dijeron decia decias deciamos decian dire diras dira diran diria dirian diga digas digamos digan dijera dijeran dijese diciendo
dicho dicha di decidme dime ir voy vas va vamos vais van iba ibas ibamos iban ire iras ira iran iria irian vaya vayas vayamos vayan yendo
ido dar doy das da damos dais dan di diste dio dimos dieron daba daban dare dara daria de des den diera dieran diese dando dado dada saber
se sabes sabe sabemos sabeis saben supe supo supieron sabia sabias sabian sabre sabra sabria sepa sepas sepan supiera supieran sabiendo
sabido querer quiero quieres quiere queremos quereis quieren quise quiso quisieron queria querias querian querre querra querria quiera
quieras quieran quisiera quisieran queriendo venir vengo vienes viene venimos vienen vine vinieron venia venian vendre vendra vendria venga
vengan viniera vinieran viniendo venido poner pongo pones pone ponemos ponen puse puso pusieron ponia ponian pondre pondra pondria ponga
pongan pusiera pusieran poniendo puesto puesta salir salgo sales sale salimos salen sali salio salieron salia salian saldre saldra saldria
salga salgan saliera salieran saliendo salido seguir sigo sigues sigue seguimos siguen segui siguio siguieron seguia seguian seguire
seguira seguiria siga sigan siguiera siguiendo seguido volver vuelvo vuelves vuelve volvemos vuelven volvi volvio volvieron volvia volvian
volvere volvera volveria vuelva vuelvan volviera volviendo vuelto pensar pienso piensas piensa pensamos piensan pense penso pensaron
pensaba pensaban pensare pensara pensaria piense piensen pensando pensado encontrar encuentro encuentra encuentran encontre encontro
encontraron encontraba encontrado encontrando creer creo crees cree creemos creen crei creyo creyeron creia creian creere creera creeria
crea crean creyera creyendo creido conocer conozco conoces conoce conocemos conocen conoci conocio conocieron conocia conocian conocera
conozca conociendo conocido parecer parezco pareces parece parecen parecio parecia parecian pareceria parezca parecido pareciendo empezar
empiezo empieza empiezan empece empezo empezaron empezaba empezando empezado`.split(/\s+/);
export const VERBOS_COMUNES = new Set(IRREGULARES.concat(REGULARES.flatMap(v => conjugar(sinTildes(v)))));
const NO_PLURAL = new Set(["dios", "pais", "mes", "tos", "lunes", "martes", "jueves", "viernes", "crisis", "atlas", "virus", "jesus", "venus", "seis", "tres"]);

export function candidatos(O, conf = {}, porLista = 15) {
  const stop = new Set([...STOP, ...VERBOS_COMUNES, ...(conf.stop_extra || [])]);
  const toks = O.flatMap(o => o.toks), N = toks.length, frec = contar(toks);
  const clavePlural = w => {
    if (NO_PLURAL.has(w)) return w;
    const op = [];
    if (w.endsWith("ces") && w.length > 4) op.push(w.slice(0, -3) + "z");
    if (w.endsWith("es") && w.length > 4 && "rlndjzy".includes(w[w.length - 3])) op.push(w.slice(0, -2));
    if (w.endsWith("s") && w.length > 3 && "aeiou".includes(w[w.length - 2])) op.push(w.slice(0, -1));
    return op.find(x => frec.has(x)) || w;
  };
  const origDe = new Map(), may = new Map(), noIni = new Map(), pos = new Map(), segDe = [];
  let i = 0;
  for (const o of O) o.orig.forEach((a, j) => {
    const n = o.toks[j];
    if (!origDe.has(n)) origDe.set(n, new Map()); const od = origDe.get(n); od.set(a.toLowerCase(), (od.get(a.toLowerCase()) || 0) + 1);
    if (!pos.has(n)) pos.set(n, []); pos.get(n).push(i); segDe.push(o.seg); i++;
    if (j > 0) { noIni.set(n, (noIni.get(n) || 0) + 1); if (a[0] !== a[0].toLowerCase()) may.set(n, (may.get(n) || 0) + 1); }
  });
  const largoSeg = contar(segDe), grupos = new Map();
  for (const w of frec.keys()) if (!stop.has(w) && w.length >= 3 && !/^\d+$/.test(w)) { const k = clavePlural(w); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(w); }
  const minFrec = Math.max(4, Math.round(N / 15000)), filas = [];
  for (const [k, formas] of grupos) {
    if (stop.has(k)) continue;
    const p = formas.flatMap(f => pos.get(f)).sort((a, b) => a - b), n = p.length;
    if (n < minFrec) continue;
    const dec = new Array(10).fill(0); p.forEach(x => dec[Math.floor(x * 10 / N)]++);
    const sc = contar(p.map(x => segDe[x]));
    let pico = null, mejor = -1; for (const [s, c] of sc) { const v = c >= 2 ? c / largoSeg.get(s) : 0; if (v > mejor) { mejor = v; pico = s; } }
    const fs = [...formas].sort((a, b) => frec.get(b) - frec.get(a)), princ = fs[0];
    const vista = masComun(origDe.get(princ))[0], nombre = (noIni.get(princ) || 0) >= 2 && (may.get(princ) || 0) / noIni.get(princ) >= 0.85;
    filas.push({motivo: nombre ? vista.charAt(0).toUpperCase() + vista.slice(1) : vista, formas: fs, apariciones: n,
                recorrido: dec.filter(x => x > 0).length, concentracion: Math.round(Math.max(...dec) / n * 100) / 100, pico, nombre});
  }
  const veces = contar(filas.map(f => f.motivo));
  filas.forEach(f => { if (veces.get(f.motivo) > 1) f.motivo += ` (${f.formas[0]})`; });
  const orden = (arr, clave) => arr.map((x, i) => [x, i]).sort((a, b) => clave(b[0]) - clave(a[0]) || a[1] - b[1]).map(x => x[0]);
  const listas = {
    recurrente: orden(filas.filter(f => !f.nombre && f.recorrido >= 8), f => f.apariciones).slice(0, porLista),
    concentrado: orden(filas.filter(f => !f.nombre && f.concentracion >= 0.45), f => f.apariciones * f.concentracion).slice(0, porLista),
    nombre: orden(filas.filter(f => f.nombre), f => f.apariciones).slice(0, porLista),
  };
  return {filas, listas, frec};
}

// ======================= DICCIONARIO DE MOTIVOS =======================
export function leerDiccionario(texto, tipo = "propio") {
  return texto.trim().split("\n").filter(l => l.includes(":")).map(l => {
    const i = l.indexOf(":"), fs = l.slice(i + 1).split(",").map(f => sinTildes(f.trim().toLowerCase())).filter(Boolean);
    return fs.length ? {nombre: l.slice(0, i).trim(), formas: fs, tipo} : null;
  }).filter(Boolean);
}
export const coincide = (w, formas) => formas.some(f => f.endsWith("*") ? w.startsWith(f.slice(0, -1)) : w === f);
export function contarMotivo(m, frec) { let c = 0; for (const [w, n] of frec) if (coincide(w, m.formas)) c += n; return c; }
export function diccionarioAutomatico(listas, cupos = {recurrente: 5, concentrado: 6, nombre: 3}) {
  const vistos = new Set(), out = [];
  for (const [l, k] of Object.entries(cupos)) for (const f of (listas[l] || []).slice(0, k))
    if (!vistos.has(f.motivo)) { vistos.add(f.motivo); out.push({nombre: f.motivo, formas: [...f.formas], tipo: l}); }
  return out;
}

// ======================= PERFIL, DATOS PARA LA LECTURA =======================
const plano = t => sinTildes(t.toLowerCase()).replace(/[^a-z0-9ñ]+/g, " ");
export function elegirPerfil(nombreArchivo, paginas) {
  const donde = plano(nombreArchivo) + " " + plano(paginas.slice(0, 15).flat().join(" "));
  return Object.keys(PERFILES).find(p => PERFILES[p].claves.some(k => donde.includes(plano(k)))) || null;
}
const titulo1 = s => s.toLowerCase().replace(/(^|[^\p{L}])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

export function datosLectura(obra, O, tramos, motivos, listas, titulo, autor) {
  const trIdx = {}; Object.values(tramos).forEach((ns, k) => ns.forEach(n => trIdx[n] = k));
  const voces = [...new Set(O.map(o => o.voz))], vi = Object.fromEntries(voces.map((v, k) => [v, k]));
  return {titulo, autor: autor || "", teatro: obra.teatro, cita: obra.cita, unidad: obra.teatro ? "parrafo" : "oracion", tipo_seg: ETQ_SEG[obra.modo],
    segmentos: obra.segmentos.map(s => ({e: s.etiqueta, t: s.titulo, tr: trIdx[s.num]})), tramos: Object.keys(tramos),
    voces: voces.map(v => obra.teatro && v !== "diálogo" && v !== "narración" ? titulo1(v) : v),
    O: O.map(o => [o.seg - 1, o.par, o.pag, vi[o.voz], o.texto]),
    candidatos: Object.fromEntries(Object.entries(listas).map(([l, fs]) => [l, fs.map(f => ({n: f.motivo, f: f.formas.slice(0, 6), c: f.apariciones}))])),
    motivos: motivos.map(m => ({n: m.nombre, f: m.formas, t: m.tipo}))};
}

// Tubería completa: de páginas de líneas a datos de lectura + informe
export function procesar(paginas, nombreArchivo, opciones = {}) {
  const perfil = opciones.perfil === "ninguno" ? null : (opciones.perfil && opciones.perfil !== "auto" ? opciones.perfil : elegirPerfil(nombreArchivo, paginas));
  const conf = {...(PERFILES[perfil] || {})};
  for (const k of ["inicio", "final", "estructura", "palabras_por_bloque"]) if (opciones[k]) conf[k] = opciones[k];
  const [obra, inf] = limpiar(paginas, conf);
  const O = armarOraciones(obra), tramos = armarTramos(obra, conf, O);
  const {filas, listas, frec} = candidatos(O, conf);
  let motivos, origen;
  if (opciones.partida !== "sugerencias" && conf.motivos) { motivos = leerDiccionario(conf.motivos, "perfil"); origen = `diccionario del perfil «${perfil}»`; }
  else { motivos = diccionarioAutomatico(listas); origen = "elegidos automáticamente entre las sugerencias"; }
  motivos = motivos.filter(m => contarMotivo(m, frec) > 0);
  const base = nombreArchivo.replace(/\.pdf$/i, "").replace(/[_\-]+/g, " ").replace(/(?<=[a-zé])(?=[A-Z])/g, " ").trim();
  const titulo = opciones.titulo || perfil || base, autor = opciones.autor || conf.autor || "";
  const pal = new Map(); O.forEach(o => pal.set(o.seg, (pal.get(o.seg) || 0) + o.toks.length));
  const informe = {perfil, origen, modo: obra.modo, cita: obra.cita, segmentos: obra.segmentos.length, tramos: Object.keys(tramos).length,
    palabras: O.reduce((s, o) => s + o.toks.length, 0), quitadas: [...inf.quitadas], faltan: inf.faltan || [], irregulares: inf.irregulares || [],
    avisos: inf.avisos, antes: inf.antes || [], final_cortado: inf.final_cortado || null,
    tabla: obra.segmentos.map(s => ({e: s.etiqueta, t: s.titulo, palabras: pal.get(s.num) || 0, empieza: (O.find(o => o.seg === s.num) || {texto: ""}).texto.slice(0, 90)}))};
  const datos = datosLectura(obra, O, tramos, motivos, listas, titulo, autor);
  if (conf.personajes) datos.reparto_perfil = {reparto: conf.personajes, familia: conf.familia || "", perfil};
  if (conf.stop_extra) datos.stop_extra = conf.stop_extra;
  return {datos, informe};
}
