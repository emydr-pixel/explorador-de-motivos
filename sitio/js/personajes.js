// Explorador de motivos · personajes (versión web)
// Port del módulo de personajes del cuaderno de Colab: reparto, menciones, red, roles, familia con citas, árbol y fórmulas.
// Trabaja sobre los datos de una lectura (D) y no usa el DOM. Las listas de palabras gramaticales llegan desde el motor.

const RX_TOK = /\d+(?:[.,]\d+)*|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
export const norm = s => s.toLowerCase().replace(/ñ/g, "\u0001").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\u0001/g, "ñ");
const esMay = c => !!c && c !== c.toLowerCase() && c === c.toUpperCase();
const escH = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const conjunto = s => new Set(s.split(/\s+/).filter(Boolean));
const cnt = () => new Map(), sumar = (m, k, n = 1) => m.set(k, (m.get(k) || 0) + n), val = (m, k) => m.get(k) || 0;
const CLAVE = ts => ts.join("\u0001"), DESCLAVE = k => k.split("\u0001");

const NO_PERSONA = conjunto(`dios dioses cristo jesucristo señor señora virgen santisima espiritu santo diablo demonio usted ustedes vuestra vuestro
merced excelencia majestad alteza señoria lunes martes miercoles jueves viernes sabado domingo enero febrero marzo abril mayo junio
julio agosto setiembre septiembre octubre noviembre diciembre navidad pascua oh ah eh ay bah hola adios gracias capitulo parte acto escena
fin nota prologo epilogo indice`);
const HONORIFICOS = conjunto("don doña señor señora señorita niño niña mama papa tio tia taita compadre comadre fray sor doctor coronel general capitan sargento teniente comandante cabo padre madre hermano hermana maestro");
const VERBOS_HABLA = conjunto("dijo dice decia pregunto preguntaba respondio respondia contesto contestaba grito gritaba exclamo murmuro replico explico añadio agrego insistio susurro ordeno llamo conto dijeron");
const LOCATIVOS = ["a", "de", "del", "en", "hacia", "desde", "hasta"];
const PARENTESCO = {hijo: "hijo", hija: "hija", padre: "padre", madre: "madre", hermano: "hermano", hermana: "hermana", esposa: "esposa", mujer: "esposa",
  marido: "esposo", esposo: "esposo", abuelo: "abuelo", abuela: "abuela", nieto: "nieto", nieta: "nieta", tio: "tío", tia: "tía", sobrino: "sobrino",
  sobrina: "sobrina", primo: "primo", prima: "prima", hijastro: "hijastro", hijastra: "hijastra", suegro: "suegro", suegra: "suegra", "cuñado": "cuñado",
  "cuñada": "cuñada", novia: "novia", novio: "novio", amante: "amante", viuda: "viuda"};
const PAPELES = ("padre madre hermana hermano hijo hija esposa marido abuela abuelo tio tia criada criado sirvienta asistenta señora señor jefe patron patrona rey reina " +
  "principe princesa capitan coronel cura medico doctor maestro maestra apoderado huespedes principito zorro serpiente piloto aviador viejo vieja niño niña muchacho muchacha").split(" ");
const COLECTIVOS = conjunto("los las todos todas ambos varios voces unos unas otros coro");
const FEMENINOS = conjunto("madre hermana hija esposa abuela tia criada sirvienta asistenta señora patrona reina princesa maestra vieja niña muchacha serpiente flor rosa");
const articulo = p => p.endsWith("s") && p !== "dios" ? (FEMENINOS.has(p) ? "las" : "los") : (FEMENINOS.has(p) || p.endsWith("a") ? "la" : "el");
const SUJETO = conjunto("se le les lo la los las me te nos no ya tambien también nunca siempre había estaba tenía era fue dijo estuvo tuvo volvió hizo quedó sintió");
const SUFIJOS_NOMBRE = conjunto("segundo segunda tercero tercera primero primera chico chica grande menor mayor hijo viejo");
const CONECTORES = conjunto("de del la");
const DETERMINANTES = conjunto("el la los las del al su sus un una");
const PREPOSICIONES = conjunto("a ante bajo con contra de desde en entre hacia hasta para por segun sin sobre tras durante mediante");
const REL_FAM = {hijo: ["hijo", "hijo"], hija: ["hijo", "hija"], hijos: ["hijo", "hijo"], hijas: ["hijo", "hija"], "hijo adoptivo": ["adoptivo", "hijo adoptivo"],
  "hija adoptiva": ["adoptivo", "hija adoptiva"], padre: ["padre", "padre"], madre: ["padre", "madre"], esposo: ["pareja", "esposo"], esposa: ["pareja", "esposa"],
  marido: ["pareja", "esposo"], mujer: ["pareja", "esposa"], pareja: ["amante", "pareja"], amante: ["amante", "amante"], concubina: ["amante", "pareja"]};
const CLAVES_REL = {hijo: "hijo hija hijos hijas padre madre papa mama parir pario nacio nacer nacimiento engendr* embaraz* criatura bautiz* nieto nieta".split(" "),
  adoptivo: "hijo hija adopt* recog* crianza criar crio padres".split(" "),
  pareja: "esposa esposo marido mujer casar* caso casaron boda matrimonio novia novio viuda viudo".split(" "),
  amante: "amante amantes amor* concubin* querida cama novia novio mujer".split(" ")};
const coincideTok = (t, f) => f.endsWith("*") ? t.startsWith(f.slice(0, -1)) : t === f;
const spans = tx => { const out = [], rx = new RegExp(RX_TOK.source, "g"); let m; while ((m = rx.exec(tx))) out.push([m.index, m.index + m[0].length]); return out; };
const nTok = s => (s.match(RX_TOK) || []).length;
const mayor = (arr, clave) => { let mejor, mv; for (const x of arr) { const v = clave(x); if (mejor === undefined || cmp(v, mv) > 0) { mejor = x; mv = v; } } return mejor; };
const cmp = (a, b) => { if (Array.isArray(a)) { for (let i = 0; i < a.length; i++) { const c = cmp(a[i], b[i]); if (c) return c; } return 0; } return a < b ? -1 : a > b ? 1 : 0; };
const masComun = m => { let k0, v0 = -1; for (const [k, v] of m) if (v > v0) { k0 = k; v0 = v; } return k0; };

// ---------- texto de la lectura ----------
export function prepararTexto(D) {
  const O = D.O.map(([seg, par, pag, voz, tx], i) => { const orig = tx.match(RX_TOK) || [];
    return {i, seg, num: seg + 1, par, pag, voz: D.voces[voz], vozI: voz, texto: tx, orig, toks: orig.map(norm), sp: null}; });
  let acc = 0; O.forEach(o => { o.ini = acc; acc += o.toks.length; });
  O.NT = acc || 1;
  O.spans = o => o.sp || (o.sp = spans(o.texto));
  return O;
}

function tokensNombre(O, lex, stopExtra = []) {
  const may = cnt(), noIni = cnt();
  O.forEach(o => o.orig.forEach((a, j) => { if (j > 0) { sumar(noIni, o.toks[j]); if (esMay(a[0])) sumar(may, o.toks[j]); } }));
  const malas = new Set([...lex.STOP, ...NO_PERSONA, ...stopExtra]), NOM = new Set();
  for (const [n, c] of noIni) if (c >= 2 && val(may, n) / c >= 0.85 && !malas.has(n) && n.length >= 2 && !/^\d+$/.test(n)) NOM.add(n);
  return NOM;
}

function* secuenciasNombre(O, NOM) {
  for (const o of O) {
    const sp = O.spans(o), tx = o.texto, orig = o.orig, toks = o.toks;
    const esNom = q => q < toks.length && esMay(orig[q][0]) && NOM.has(toks[q]);
    const pegado = (a, b) => tx.slice(sp[a][1], sp[b][0]).trim() === "";
    let run = [], j = 0;
    while (j < toks.length) {
      const a = orig[j], n = toks[j];
      if (run.length && run.length < 6 && pegado(run[run.length - 1], j)) {
        if (esMay(a[0]) && (NOM.has(n) || SUFIJOS_NOMBRE.has(n))) { run.push(j); j++; continue; }
        let k = j;
        while (k < toks.length && CONECTORES.has(toks[k]) && !esMay(orig[k][0]) && k - j < 2 && pegado(k > j ? k - 1 : run[run.length - 1], k)) k++;
        if (k > j && esNom(k) && pegado(k - 1, k)) { for (let q = j; q <= k; q++) run.push(q); j = k + 1; continue; }
      }
      if (run.length) yield [o.i, run];
      run = esMay(a[0]) && (NOM.has(n) || ((n === "santa" || n === "san") && esNom(j + 1))) ? [j] : [];
      j++;
    }
    if (run.length) yield [o.i, run];
  }
}

// ---------- propuesta automática del reparto ----------
export function proponerReparto(D, lex, opciones = {}) {
  const O = opciones.O || prepararTexto(D), maxP = opciones.max || 25, teatro = D.teatro;
  const N = O.NT, NOM = tokensNombre(O, lex, opciones.stopExtra);
  const cuenta = cnt(), previa = new Map(), habla = cnt(), sujeto = cnt(), vista = new Map(), enOr = new Map();
  for (const [i, run0] of secuenciasNombre(O, NOM)) {
    const o = O[i]; let run = run0, ts = run.map(j => o.toks[j]);
    while (ts.length > 1 && HONORIFICOS.has(ts[0])) { ts = ts.slice(1); run = run.slice(1); }
    if (ts.length === 2 && (ts[0] === "san" || ts[0] === "santa")) { ts = ts.slice(1); run = run.slice(1); }
    const k = CLAVE(ts); sumar(cuenta, k);
    if (!vista.has(k)) vista.set(k, cnt()); sumar(vista.get(k), run.map(j => o.orig[j]).join(" "));
    if (!enOr.has(k)) enOr.set(k, new Set()); enOr.get(k).add(i);
    if (!previa.has(k)) previa.set(k, cnt()); sumar(previa.get(k), run[0] > 0 ? o.toks[run[0] - 1] : "^");
    const cerca = o.toks.slice(Math.max(0, run[0] - 3), run[0]).concat(o.toks.slice(run[run.length - 1] + 1, run[run.length - 1] + 4));
    if (cerca.some(w => VERBOS_HABLA.has(w))) sumar(habla, k);
    const sig = run[run.length - 1] + 1 < o.orig.length ? o.orig[run[run.length - 1] + 1] : "";
    if (sig && (SUJETO.has(sig.toLowerCase()) || /(ó|aba|ía|ió|aron|ieron|aban|ían)$/.test(sig))) sumar(sujeto, k);
  }
  const minc = Math.max(3, Math.round(N / 25000));
  const cands = [...cuenta.keys()].filter(s => cuenta.get(s) >= minc);
  const hablantes = new Map();
  if (teatro) {
    const porVoz = cnt(); O.forEach(o => sumar(porVoz, o.voz));
    for (const [v, c] of porVoz) {
      const ts = (v.match(RX_TOK) || []).map(norm).filter(t => !/^\d+$/.test(t));
      if (["narración", "diálogo", "ACOTACIÓN", "acotación"].includes(v) || c < 2 || !ts.length || COLECTIVOS.has(ts[0])) continue;
      const k = CLAVE(ts);
      if (hablantes.has(k)) hablantes.get(k)[1] += c; else hablantes.set(k, [v.replace(/\s*\d+$/, ""), c]);
    }
  }
  const largo = k => DESCLAVE(k).length;
  const largos = [...cands].sort((a, b) => largo(b) - largo(a));
  const contiene = (L, s) => { const l = DESCLAVE(L), t = DESCLAVE(s); for (let k = 0; k + t.length <= l.length; k++) if (t.every((x, q) => l[k + q] === x)) return true; return false; };
  const alias = new Map(), compartidos = new Map(), familias = new Map(), distintos = [], principales = [];
  const al = L => alias.get(L) || [];
  for (const s of [...cands].sort((a, b) => largo(b) - largo(a) || cuenta.get(b) - cuenta.get(a))) {
    const cont = largos.filter(L => largo(L) > largo(s) && principales.includes(L) && contiene(L, s));
    const juntos = cont.filter(L => { const c = [...enOr.get(s)].filter(i => enOr.get(L).has(i)).length; return c >= 2 || c >= 0.05 * Math.min(cuenta.get(s), cuenta.get(L)); });
    if (juntos.length) { juntos.forEach(L => distintos.push([s, L])); principales.push(s); continue; }
    if (!cont.length) { principales.push(s); continue; }
    if (cont.length === 1) { alias.set(cont[0], al(cont[0]).concat([s])); continue; }
    const los = val(previa.get(s), "los") + val(previa.get(s), "las");
    if (los >= 0.3 * cuenta.get(s)) { familias.set(s, cont); continue; }
    compartidos.set(s, cont);
  }
  for (const [s, cont] of compartidos) cont.forEach(L => alias.set(L, al(L).concat([s])));
  const total = L => cuenta.get(L) + al(L).reduce((t, a) => t + cuenta.get(a), 0);
  const lugares = []; let filas = [];
  for (const L of principales) {
    const menc = total(L), xs = [L].concat(al(L)), d = Math.max(1, menc);
    const loc = xs.reduce((t, x) => t + LOCATIVOS.reduce((u, w) => u + val(previa.get(x), w), 0), 0) / d;
    const ini = xs.reduce((t, x) => t + val(previa.get(x), "^"), 0) / d;
    const hab = xs.reduce((t, x) => t + val(habla, x), 0) / d, suj = xs.reduce((t, x) => t + val(sujeto, x), 0) / d;
    const lugar = largo(L) === 1 ? loc >= 0.45 && ini < 0.15 && hab < 0.05 && suj < 0.3 : loc >= 0.7 && hab < 0.02;
    if (!hablantes.has(L) && lugar) { lugares.push([L, menc]); continue; }
    filas.push([L, menc]);
  }
  filas = filas.map(([L, c]) => hablantes.has(L) ? [L, c + 2 * hablantes.get(L)[1]] : [L, c]);
  for (const [ts, [v, c]] of hablantes) if (!filas.some(([L]) => ts === L || contiene(L, ts))) filas.push([ts, val(cuenta, ts) + 2 * c]);
  filas.sort((a, b) => (hablantes.has(a[0]) ? 0 : 1) - (hablantes.has(b[0]) ? 0 : 1) || b[1] - a[1]);
  filas = filas.slice(0, maxP);
  const nombreDe = L => hablantes.has(L) ? hablantes.get(L)[0] : masComun(vista.get(L));
  const lineas = filas.map(([L]) => `${nombreDe(L)}: ` + [L].concat([...al(L)].sort((a, b) => cuenta.get(b) - cuenta.get(a))).map(f => DESCLAVE(f).join(" ")).join(", "));
  const papeles = [];
  for (const p of PAPELES) {
    let c = 0; O.forEach(o => o.toks.forEach((t, j) => { if (t === p && j > 0 && ["el", "la", "los", "las", "su"].includes(o.toks[j - 1])) c++; }));
    if (c >= Math.max(8, Math.round(N / 8000))) papeles.push([p, c]);
  }
  papeles.sort((a, b) => b[1] - a[1]);
  if (filas.length < 5) papeles.slice(0, Math.max(0, 8 - filas.length)).forEach(([p]) => lineas.push(`${articulo(p)} ${p}: ${p}`));
  const elegidos = new Set(filas.map(f => f[0]));
  const info = {distintos: distintos.filter(([a, b]) => elegidos.has(a) && elegidos.has(b)).map(([a, b]) => [nombreDe(a), nombreDe(b)]),
    compartidos: [...compartidos].map(([s, c]) => [DESCLAVE(s).join(" "), c.filter(L => elegidos.has(L)).map(nombreDe)]),
    familias: [...familias.keys()].map(s => masComun(vista.get(s))),
    lugares: lugares.sort((a, b) => b[1] - a[1]).slice(0, 12).map(([L]) => masComun(vista.get(L))),
    papeles: papeles.map(p => p[0]), teatro_papeles: !!teatro && papeles.some(([p]) => ["rey", "reina", "principe", "princesa"].includes(p))};
  return {texto: lineas.join("\n"), info};
}

// ---------- reparto escrito ----------
export function leerReparto(texto) {
  const R = [];
  for (const linea of (texto || "").trim().split("\n")) {
    if (!linea.includes(":") || linea.trim().startsWith("#")) continue;
    const i = linea.indexOf(":"), nombre = linea.slice(0, i).trim(), formas = [];
    for (let f of linea.slice(i + 1).split(",")) {
      f = f.trim(); let r = null; const m = f.match(/\[\s*(\d+)\s*[-–]\s*(\d+)\s*\]\s*$/);
      if (m) { r = [+m[1], +m[2]]; f = f.slice(0, m.index).trim(); }
      const ts = f.split(/\s+/).filter(Boolean).map(t => norm(t));
      if (ts.length) formas.push({t: ts, r});
    }
    if (formas.length) R.push({nombre, formas});
  }
  return R;
}

function buscarMenciones(O, R, NOM) {
  const porInicio = new Map();
  R.forEach((p, k) => p.formas.forEach(f => { const c = f.t[0].replace(/\*$/, "").slice(0, 3); if (!porInicio.has(c)) porInicio.set(c, []); porInicio.get(c).push([f.t, f.r, k]); }));
  const M = [];
  for (const o of O) {
    const toks = o.toks, orig = o.orig; let j = 0;
    while (j < toks.length) {
      let mejor = 0, quien = new Set();
      for (const [ft, rango, k] of porInicio.get(toks[j].slice(0, 3)) || []) {
        const n = ft.length;
        if (j + n > toks.length || n < mejor) continue;
        if (rango && !(rango[0] <= o.num && o.num <= rango[1])) continue;
        let ok = true; for (let q = 0; q < n && ok; q++) if (!coincideTok(toks[j + q], ft[q])) ok = false;
        if (!ok) continue;
        if (ft.some((f, q) => NOM.has(f) && !esMay(orig[j + q][0]))) continue;
        if (n > mejor) { mejor = n; quien = new Set([k]); } else quien.add(k);
      }
      if (mejor) { const sp = O.spans(o); M.push({o: o.i, a: sp[j][0], b: sp[j + mejor - 1][1], pos: j, n: mejor, p: [...quien].sort((x, y) => x - y), pj: null}); j += mejor; }
      else j++;
    }
  }
  return M;
}

function resolverAmbiguas(M, O, compartidos) {
  M.forEach(m => { m.g = O[m.o].ini + m.pos; if (m.p.length === 1) m.pj = m.p[0]; });
  if (compartidos !== "contexto") return {resueltas: 0, sin_resolver: M.filter(m => m.pj === null).length};
  const porSeg = new Map(); M.forEach(m => { const s = O[m.o].seg; if (!porSeg.has(s)) porSeg.set(s, []); porSeg.get(s).push(m); });
  let res = 0, sin = 0;
  for (const ms of porSeg.values()) {
    const claras = ms.filter(m => m.pj !== null);
    for (const m of ms) {
      if (m.pj !== null) continue;
      let mejor = null;
      for (const c of claras) { if (!m.p.includes(c.pj)) continue; let d = m.g - c.g; d = d >= 0 ? d : -d * 1.5; if (!mejor || d < mejor[0]) mejor = [d, c.pj]; }
      if (mejor) { m.pj = mejor[1]; m.amb = true; res++; } else sin++;
    }
  }
  return {resueltas: res, sin_resolver: sin};
}

function pasajes(O, palabrasMin = 120) {
  const P = []; let ini = 0, acc = 0, par = null;
  O.forEach((o, i) => {
    if (i > ini && (o.seg !== O[i - 1].seg || (o.par !== par && acc >= palabrasMin))) { P.push([ini, i - 1]); ini = i; acc = 0; }
    par = o.par; acc += o.toks.length;
  });
  if (O.length) P.push([ini, O.length - 1]);
  return P;
}

function louvain(n, edges) {
  const w = Array.from({length: n}, () => new Map()), deg = new Array(n).fill(0);
  edges.forEach(([a, b, f]) => { w[a].set(b, f); w[b].set(a, f); deg[a] += f; deg[b] += f; });
  const m2 = deg.reduce((s, x) => s + x, 0) || 1, com = [...Array(n).keys()], tot = deg.slice();
  for (let it = 0; it < 20; it++) {
    let mov = false;
    for (let i = 0; i < n; i++) {
      if (!deg[i]) continue;
      const ci = com[i]; tot[ci] -= deg[i]; const enl = new Map();
      w[i].forEach((f, j) => enl.set(com[j], (enl.get(com[j]) || 0) + f));
      let mejor = ci, gan = (enl.get(ci) || 0) - tot[ci] * deg[i] / m2;
      enl.forEach((v, c) => { const g = v - tot[c] * deg[i] / m2; if (g > gan + 1e-9) { gan = g; mejor = c; } });
      com[i] = mejor; tot[mejor] += deg[i]; if (mejor !== ci) mov = true;
    }
    if (!mov) break;
  }
  const tam = new Map(); com.forEach((c, i) => { if (deg[i]) tam.set(c, (tam.get(c) || 0) + 1); });
  const orden = [...tam.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]);
  return com.map((c, i) => deg[i] ? orden.indexOf(c) : -1);
}

function intermediacion(n, edges) {
  const adj = Array.from({length: n}, () => []), cb = new Array(n).fill(0);
  edges.forEach(([a, b, f]) => { adj[a].push([b, 1 / f]); adj[b].push([a, 1 / f]); });
  for (let s = 0; s < n; s++) {
    if (!adj[s].length) continue;
    const dist = new Array(n).fill(Infinity), sigma = new Array(n).fill(0), pred = Array.from({length: n}, () => []), orden = [], hecho = new Array(n).fill(false);
    dist[s] = 0; sigma[s] = 1;
    for (;;) {
      let u = -1; for (let i = 0; i < n; i++) if (!hecho[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0) break; hecho[u] = true; orden.push(u);
      adj[u].forEach(([v, ww]) => { const nd = dist[u] + ww;
        if (nd < dist[v] - 1e-12) { dist[v] = nd; sigma[v] = sigma[u]; pred[v] = [u]; } else if (Math.abs(nd - dist[v]) < 1e-12) { sigma[v] += sigma[u]; pred[v].push(u); } });
    }
    const delta = new Array(n).fill(0);
    for (let i = orden.length - 1; i >= 0; i--) { const x = orden[i]; pred[x].forEach(v => delta[v] += sigma[v] / sigma[x] * (1 + delta[x])); if (x !== s) cb[x] += delta[x]; }
  }
  const k = adj.filter(x => x.length).length, norma = k > 2 ? (k - 1) * (k - 2) : 1;
  return cb.map(x => x / norma);
}

function disponer(n, edges, activos) {
  const par = [...Array(n).keys()], raiz = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  edges.forEach(([a, b]) => { par[raiz(a)] = raiz(b); });
  const comps = new Map(); activos.forEach(i => { const r = raiz(i); if (!comps.has(r)) comps.set(r, []); comps.get(r).push(i); });
  const lista = [...comps.values()].sort((a, b) => b.length - a.length), pos = new Array(n).fill(null);
  const normalizar = p => { for (const d of [0, 1]) { const vs = p.map(q => q[d]), lo = Math.min(...vs), r = (Math.max(...vs) - lo) || 1; p.forEach(q => q[d] = (q[d] - lo) / r); } return p; };
  const resortes = nodos => {
    const m = nodos.length; if (m === 1) return [[0.5, 0.5]];
    const idx = new Map(nodos.map((x, i) => [x, i])), es = edges.filter(([a, b]) => idx.has(a) && idx.has(b)).map(([a, b, f]) => [idx.get(a), idx.get(b), f]);
    const fmax = Math.max(1e-6, ...es.map(e => e[2])), kk = Math.sqrt(1 / m) * 0.9;
    let p = nodos.map((_, i) => [0.5 + 0.4 * Math.cos(2 * Math.PI * i / m) + 0.01 * Math.sin(7 * i + 1), 0.5 + 0.4 * Math.sin(2 * Math.PI * i / m) + 0.01 * Math.cos(5 * i + 2)]);
    for (let it = 0; it < 500; it++) {
      const t = 0.08 * (1 - it / 500) + 0.002, d = p.map(() => [0, 0]);
      for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) {
        const dx = p[i][0] - p[j][0], dy = p[i][1] - p[j][1], dist = Math.max(1e-3, Math.hypot(dx, dy)), f = kk * kk / dist;
        d[i][0] += dx / dist * f; d[i][1] += dy / dist * f; d[j][0] -= dx / dist * f; d[j][1] -= dy / dist * f; }
      es.forEach(([a, b, f]) => { const vx = p[a][0] - p[b][0], vy = p[a][1] - p[b][1], dd = Math.max(1e-3, Math.hypot(vx, vy)), fz = dd * dd / kk * (0.4 + f / fmax);
        d[a][0] -= vx / dd * fz; d[a][1] -= vy / dd * fz; d[b][0] += vx / dd * fz; d[b][1] += vy / dd * fz; });
      p.forEach((q, i) => { const ln = Math.hypot(d[i][0], d[i][1]) || 1; q[0] += d[i][0] / ln * Math.min(ln, t); q[1] += d[i][1] / ln * Math.min(ln, t); });
    }
    p = normalizar(p);
    const d0 = Math.min(0.085, 0.5 / Math.sqrt(m)), ey = 0.52;          // que los nodos no se monten (en proporción de pantalla)
    p.forEach(q => q[1] *= ey);
    for (let it = 0; it < 300; it++) {
      let hubo = false; const emp = p.map(() => [0, 0]);
      for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) { if (i === j) continue;
        const dx = p[i][0] - p[j][0], dy = p[i][1] - p[j][1], dist = Math.hypot(dx, dy);
        if (dist < d0) { hubo = true; const dd = Math.max(dist, 1e-4); emp[i][0] += dx / dd * (d0 - dist) * 0.5; emp[i][1] += dy / dd * (d0 - dist) * 0.5; } }
      if (!hubo) break;
      p.forEach((q, i) => { q[0] += emp[i][0]; q[1] += emp[i][1]; });
    }
    p.forEach(q => q[1] /= ey);
    return normalizar(p);
  };
  if (lista.length) resortes(lista[0]).forEach((q, i) => pos[lista[0][i]] = [q[0], q[1] * 0.8]);
  const resto = lista.slice(1), ancho = resto.reduce((s, c) => s + c.length, 0); let x0 = 0;
  resto.forEach(c => { const w = c.length / ancho; resortes(c).forEach((q, i) => pos[c[i]] = [x0 + w * (0.15 + 0.7 * q[0]), 0.93 + 0.07 * q[1]]); x0 += w; });
  return pos;
}

// ---------- parentesco ----------
function pistasParentesco(O, M) {
  const porO = new Map(); M.forEach(m => { if (m.pj !== null) { if (!porO.has(m.o)) porO.set(m.o, []); porO.get(m.o).push(m); } });
  const pistas = new Map(), anotar = (a, k, b, i) => { const c = `${a}|${k}|${b}`; if (!pistas.has(c)) pistas.set(c, [a, k, b, new Set()]); pistas.get(c)[3].add(i); };
  for (const [i, ms0] of porO) {
    const o = O[i], tx = o.texto, toks = o.toks, sp = O.spans(o), ms = [...ms0].sort((a, b) => a.pos - b.pos);
    const fin = m => m.pos + nTok(tx.slice(m.a, m.b)), entre = (c1, t) => t < sp.length ? tx.slice(c1, sp[t][0]) : "";
    ms.forEach((A, x) => {
      const j = fin(A); if (j >= toks.length) return;
      const k = j + (toks[j] === "el" || toks[j] === "la" ? 1 : 0);
      if (k + 1 < toks.length && PARENTESCO[toks[k]] && (toks[k + 1] === "de" || toks[k + 1] === "del") && entre(A.b, j).trim() === ",") {
        const B = ms.slice(x + 1).find(b => b.pos === k + 2 || b.pos === k + 3);
        if (B && B.pj !== A.pj) {
          anotar(A.pj, PARENTESCO[toks[k]], B.pj, i);
          const fb = fin(B), C = ms.find(c => [fb + 1, fb + 2, fb + 3].includes(c.pos) && fb < toks.length && (toks[fb] === "y" || toks[fb] === "e"));
          if (C && C.pj !== A.pj && C.pj !== B.pj && (toks[k] === "hijo" || toks[k] === "hija")) anotar(A.pj, PARENTESCO[toks[k]], C.pj, i);
        }
      }
      if (j + 1 < toks.length && toks[j] === "su" && PARENTESCO[toks[j + 1]] && entre(A.b, j).trim() === "," && x > 0) {
        const B = ms[x - 1]; if (B.pj !== A.pj && A.pos - fin(B) <= 8) anotar(A.pj, PARENTESCO[toks[j + 1]], B.pj, i);
      }
    });
    ms.forEach((A, x) => {
      const q = A.pos;
      if (q >= 2 && x > 0 && toks[q - 2] === "su" && PARENTESCO[toks[q - 1]] && tx.slice(sp[q - 1][1], A.a).trim() === "") {
        const B = ms[x - 1], medio = tx.slice(B.b, A.a);
        if (B.pj !== A.pj && q - fin(B) <= 6 && !medio.includes(";") && !medio.includes(".")) anotar(A.pj, PARENTESCO[toks[q - 1]], B.pj, i);
      }
    });
  }
  return [...pistas.values()].map(([a, k, b, os]) => [a, k, b, [...os].sort((x, y) => x - y)]).sort((x, y) => y[3].length - x[3].length);
}

function buscarPj(nombre, R) {
  const q = norm(nombre.trim()).replace(/\s+/g, " "), nombres = R.map(p => norm(p.nombre));
  let i = nombres.indexOf(q); if (i >= 0) return i;
  const sinPar = nombres.map(x => x.replace(/\s*\(.*?\)/g, "").trim());
  if (sinPar.filter(x => x === q).length === 1) return sinPar.indexOf(q);
  const rx = new RegExp(`(?<![\\wñ])${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\wñ])`);
  let cand = nombres.map((x, k) => rx.test(x) ? k : -1).filter(k => k >= 0); if (cand.length === 1) return cand[0];
  cand = R.map((p, k) => p.formas.some(f => f.t.join(" ") === q) ? k : -1).filter(k => k >= 0);
  return cand.length === 1 ? cand[0] : null;
}

export function leerFamilia(texto, R) {
  const F = [], sin = [];
  for (const linea of (texto || "").trim().split("\n")) {
    if (!linea.includes(":") || linea.trim().startsWith("#")) continue;
    const i = linea.indexOf(":"), x = linea.slice(0, i), a = buscarPj(x, R);
    if (a === null) { sin.push(x.trim()); continue; }
    for (const trozo of linea.slice(i + 1).split(";")) {
      const m = trozo.trim().match(/^\s*([a-záéíóúñ ]+?)\s+(?:de|del)\s+(.+)$/i); if (!m) continue;
      const pal = norm(m[1].trim()).replace(/^(el|la|los|las|su|sus)\s+/, "");
      const [tipo, etq] = REL_FAM[pal] || ["otro", pal];
      for (let nb of m[2].trim().replace(/\.$/, "").split(/\s*,\s*|\s+y\s+|\s+e\s+/)) {
        nb = nb.trim().replace(/^(?:de|del)\s+/i, ""); if (!nb) continue;
        const b = buscarPj(nb, R); if (b === null) { sin.push(nb); continue; }
        if (tipo === "padre") F.push({a: b, b: a, t: "hijo", e: "hijo/a"}); else F.push({a, b, t: tipo, e: etq});
      }
    }
  }
  const vistos = new Set(), out = [];
  F.forEach(r => { const c = r.t === "pareja" || r.t === "amante" ? `${Math.min(r.a, r.b)}|${Math.max(r.a, r.b)}|${r.t}` : `${r.a}|${r.b}|${r.t}`;
    if (!vistos.has(c) && r.a !== r.b) { vistos.add(c); out.push(r); } });
  return {F: out, sin: [...new Set(sin)].sort()};
}

function familiaDesdePistas(pistas) {
  return pistas.map(([a, k, b, os]) => { const k0 = norm(k);
    if (["hijo", "hija", "hijastro", "hijastra"].includes(k0)) return {a, b, t: "hijo", e: k, os};
    if (k0 === "padre" || k0 === "madre") return {a: b, b: a, t: "hijo", e: "hijo/a", os};
    if (k0 === "esposa" || k0 === "esposo") return {a, b, t: "pareja", e: k, os};
    if (["amante", "novia", "novio"].includes(k0)) return {a, b, t: k0 === "amante" ? "amante" : "otro", e: k, os};
    return {a, b, t: "otro", e: k, os}; });
}

function evidenciasFamilia(F, O, M) {
  const porO = new Map(), dentro = new Map();
  M.forEach(m => { if (!dentro.has(m.o)) dentro.set(m.o, new Set()); for (let q = m.pos; q < m.pos + (m.n || 1); q++) dentro.get(m.o).add(q);
    if (m.pj !== null) { if (!porO.has(m.o)) porO.set(m.o, new Map()); const d = porO.get(m.o); if (!d.has(m.pj)) d.set(m.pj, []); d.get(m.pj).push(m.pos); } });
  const porPj = new Map(); for (const [i, d] of porO) for (const k of d.keys()) { if (!porPj.has(k)) porPj.set(k, new Set()); porPj.get(k).add(i); }
  F.forEach(r => {
    if (r.os) { r.c = r.os.slice(0, 3); r.fuente = "frase"; return; }
    const claves = CLAVES_REL[r.t] || r.e.split(/\s+/).map(norm).slice(-1);
    const A = porPj.get(r.a) || new Set(), B = porPj.get(r.b) || new Set(), ambos = [...A].filter(i => B.has(i)).sort((x, y) => x - y), puntos = [];
    for (const i of ambos) {
      const toks = O[i].toks, den = dentro.get(i) || new Set();
      const pk = []; toks.forEach((t, j) => { if (!den.has(j) && claves.some(c => coincideTok(t, c))) pk.push(j); });
      if (!pk.length) continue;
      const pa = porO.get(i).get(r.a), pb = porO.get(i).get(r.b);
      let d = Infinity; pa.forEach(x => pb.forEach(y => d = Math.min(d, Math.abs(x - y))));
      let kd = Infinity; pk.forEach(j => pa.concat(pb).forEach(x => kd = Math.min(kd, Math.abs(j - x))));
      if (kd > 4 || d > 25) continue;
      puntos.push([kd + d / 5, i]);
    }
    puntos.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    r.c = puntos.slice(0, 3).map(p => p[1]); r.fuente = puntos.length ? "frase" : "ninguna";
  });
  return F;
}

function textoFamilia(F, R) {
  const lineas = new Map();
  F.forEach(r => { if (!lineas.has(r.a)) lineas.set(r.a, []);
    lineas.get(r.a).push(r.t === "hijo" ? `${r.e === "hijo" || r.e === "hija" ? r.e : "hijo"} de ${R[r.b].nombre}` : `${r.e} de ${R[r.b].nombre}`); });
  return [...lineas].map(([a, v]) => `${R[a].nombre}: ${v.join("; ")}`).join("\n");
}

function disponerArbol(F) {
  const padres = new Map(), hijos = new Map(), parejas = new Map(), get = (m, k) => m.get(k) || new Set(), add = (m, k, v) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(v); };
  F.forEach(r => { if (r.t === "hijo" || r.t === "adoptivo") { add(padres, r.a, r.b); add(hijos, r.b, r.a); }
    else if (r.t === "pareja" || r.t === "amante") { add(parejas, r.a, r.b); add(parejas, r.b, r.a); } });
  const nodos = [...new Set([...padres.keys(), ...hijos.keys(), ...parejas.keys()])].sort((a, b) => a - b);
  if (!nodos.length) return {};
  const gen = new Map(nodos.map(k => [k, 0]));
  for (let it = 0; it < nodos.length + 2; it++) { let cambio = false;
    for (const [c, ps] of padres) { const g = Math.max(...[...ps].map(p => gen.get(p))) + 1; if (gen.get(c) < g) { gen.set(c, g); cambio = true; } }
    if (!cambio) break; }
  for (let it = 0; it < 6; it++) for (const k of nodos) {
    if (get(padres, k).size) continue;
    const op = [...get(hijos, k)].map(c => gen.get(c) - 1).concat([...get(parejas, k)].filter(q => get(padres, q).size || get(hijos, q).size).map(q => gen.get(q)));
    if (op.length) gen.set(k, Math.max(gen.get(k), Math.min(...op)));
  }
  const G = Math.max(...gen.values()), x = new Map();
  for (let g = 0; g <= G; g++) {
    const clave = k => { const ps = [...get(padres, k)].filter(p => x.has(p)).map(p => x.get(p)); if (ps.length) return ps.reduce((s, v) => s + v, 0) / ps.length;
      let qs = [...get(parejas, k)].filter(q => x.has(q)).map(q => x.get(q)); get(parejas, k).forEach(q => get(padres, q).forEach(p => { if (x.has(p)) qs.push(x.get(p)); }));
      return qs.length ? qs.reduce((s, v) => s + v, 0) / qs.length : 1e6 + k; };
    const fila = nodos.filter(k => gen.get(k) === g).sort((a, b) => clave(a) - clave(b)), orden = [];
    fila.forEach(k => { if (orden.includes(k)) return; orden.push(k);
      [...get(parejas, k)].sort((p, q) => [...get(hijos, q)].filter(c => get(hijos, k).has(c)).length - [...get(hijos, p)].filter(c => get(hijos, k).has(c)).length)
        .forEach(q => { if (fila.includes(q) && !orden.includes(q)) orden.push(q); }); });
    let ult = -1e9; orden.forEach(k => { const d = clave(k) < 1e6 ? clave(k) : null; const v = Math.max(d !== null ? d : ult + 1, ult + 1); x.set(k, v); ult = v; });
  }
  const separar = fila => { fila.sort((a, b) => x.get(a) - x.get(b)); for (let i = 1; i < fila.length; i++) if (x.get(fila[i]) < x.get(fila[i - 1]) + 1) x.set(fila[i], x.get(fila[i - 1]) + 1); };
  for (let it = 0; it < 4; it++) {
    for (let g = G - 1; g >= 0; g--) { const fila = nodos.filter(k => gen.get(k) === g);
      fila.forEach(k => { const hs = [...get(hijos, k)].map(c => x.get(c));
        if (hs.length) { const mh = hs.reduce((s, v) => s + v, 0) / hs.length; x.set(k, get(padres, k).size ? (x.get(k) + mh) / 2 : mh); }
        else if (!get(padres, k).size && get(parejas, k).size) x.set(k, [...get(parejas, k)].reduce((s, q) => s + x.get(q), 0) / get(parejas, k).size + 0.5); });
      separar(fila); }
    for (let g = 1; g <= G; g++) { const fila = nodos.filter(k => gen.get(k) === g);
      fila.forEach(k => { const ps = [...get(padres, k)].map(p => x.get(p)); if (ps.length) x.set(k, (x.get(k) + ps.reduce((s, v) => s + v, 0) / ps.length) / 2); });
      separar(fila); }
  }
  for (let g = 0; g <= G; g++) {
    const fila = nodos.filter(k => gen.get(k) === g).sort((a, b) => x.get(a) - x.get(b)), usados = new Set(), bloques = [];
    fila.forEach(k => { if (usados.has(k)) return;
      const ps = [...get(parejas, k)].sort((p, q) => x.get(p) - x.get(q)).filter(q => gen.get(q) === g && !usados.has(q)), izq = ps.length > 1 ? ps.slice(0, 1) : [];
      const b = izq.concat([k], ps.filter(q => !izq.includes(q))); b.forEach(q => usados.add(q)); bloques.push(b); });
    const media = b => b.reduce((s, q) => s + x.get(q), 0) / b.length;
    bloques.sort((a, b) => media(a) - media(b)); let ult = -1e9;
    bloques.forEach(b => { const ini = Math.max(media(b) - (b.length - 1) / 2, ult + 1); b.forEach((q, i) => x.set(q, ini + i)); ult = x.get(b[b.length - 1]); });
  }
  const m0 = Math.min(...x.values()), out = {};
  nodos.forEach(k => out[k] = [gen.get(k), Math.round((x.get(k) - m0) * 100) / 100]);
  return out;
}

// ---------- cómo lo llama la obra ----------
function epitetos(O, M, NOM, lex, maximo = 6) {
  const malas = new Set([...lex.STOP, ...lex.VERBOS_COMUNES, ...NOM, "que", "quien", "cual", "cuyo", "cuya"]), F = new Map();
  const anotar = (k, f, o) => { if (!F.has(k)) F.set(k, new Map()); const d = F.get(k); if (!d.has(f)) d.set(f, []); d.get(f).push(o); };
  for (const m of M) {
    const k = m.pj; if (k === null) continue;
    const o = O[m.o], toks = o.toks, orig = o.orig, tx = o.texto, nm = nTok(tx.slice(m.a, m.b)), j0 = m.pos, j1 = m.pos + nm, lead = [];
    for (let q = j0; q < j1; q++) { if (esMay(orig[q][0])) break; lead.push(toks[q]); }
    if (lead.length && lead.length < nm) {
      const det = j0 > 0 && DETERMINANTES.has(toks[j0 - 1]) ? toks[j0 - 1] : "";
      anotar(k, ((det === "del" || det === "al" ? "el" : det) + " " + lead.join(" ")).trim(), m.o);
    } else if (!lead.length && j0 >= 2 && !esMay(orig[j0 - 1][0]) && !malas.has(toks[j0 - 1]) && !DETERMINANTES.has(toks[j0 - 1])) {
      let q = j0 - 1; const pal = [toks[q]];
      if (q >= 2 && !malas.has(toks[q - 1]) && !DETERMINANTES.has(toks[q - 1]) && ["el", "la", "su"].includes(toks[q - 2])) { q--; pal.unshift(toks[q]); }
      const det = toks[q - 1];
      if (["el", "la", "su", "los", "las"].includes(det) && (q < 2 || !PREPOSICIONES.has(toks[q - 2])) && !tx.slice(O.spans(o)[q - 1][1], m.a).includes(","))
        anotar(k, `${det} ${pal.join(" ")}`, m.o);
    }
    const am = tx.slice(m.b).match(/^\s*,\s*((?:el|la|los|las|un|una|su)\s+[^,.;:!?»—\-()]{2,60}?)\s*[,.;:]/);
    if (am) { const ws = (am[1].match(RX_TOK) || []).map(norm);
      if (ws.length >= 2 && ws.length <= 6 && !malas.has(ws[1]) && !ws[1].endsWith("ndo") && !ws.some(w => ["que", "quien", "cual"].includes(w))) anotar(k, ws.join(" "), m.o); }
  }
  const totalBi = cnt();
  O.forEach(o => { const t = o.toks; for (let q = 0; q < t.length - 1; q++) if (["el", "la", "su", "los", "las"].includes(t[q])) sumar(totalBi, `${t[q]} ${t[q + 1]}`); });
  const esTitulo = (f, n) => { const ws = f.split(" "); if (ws.length !== 2 || !["el", "la", "su", "los", "las"].includes(ws[0])) return true; return n >= 3 && (n >= 0.1 * Math.max(1, val(totalBi, f)) || n >= 8); };
  const out = {};
  for (const [k, d] of F) {
    const filas = [...d].filter(([f, v]) => esTitulo(f, v.length)).map(([f, v]) => [f, [...new Set(v)].sort((a, b) => a - b)]).filter(([, v]) => v.length >= 2);
    filas.sort((a, b) => b[1].length - a[1].length);
    if (filas.length) out[k] = filas.slice(0, maximo).map(([f, os]) => { const nc = Math.min(3, os.length), c = [];
      for (let t = 0; t < nc; t++) c.push(os[nc > 1 ? Math.round(t * (os.length - 1) / (nc - 1)) : 0]);
      return [f, os.length, O[os[0]].seg, O[os[os.length - 1]].seg, c]; });
  }
  return out;
}

// ---------- todo junto ----------
const relPJ = (c, a, b) => { const s = c / Math.max(1, Math.min(a, b)); return s >= .5 ? "casi siempre juntos" : s >= .25 ? "a menudo juntos" : "a veces juntos"; };

export function calcularPersonajes(D, lex, repartoTexto, familiaTexto = "", opciones = {}) {
  const O = opciones.O || prepararTexto(D), compartidos = opciones.compartidos || "contexto";
  const NOM = tokensNombre(O, lex, opciones.stopExtra), R = leerReparto(repartoTexto), n = R.length;
  const M = buscarMenciones(O, R, NOM), txtM = m => O[m.o].texto.slice(m.a, m.b);
  const ambFormas = cnt(); M.forEach(m => { if (m.p.length > 1) sumar(ambFormas, txtM(m)); });
  const resol = resolverAmbiguas(M, O, compartidos);
  const vozPj = new Map();
  if (D.teatro) for (const v of new Set(O.map(o => o.voz))) {
    const ts = (v.match(RX_TOK) || []).map(norm).filter(t => !/^\d+$/.test(t));
    const k = R.findIndex(p => p.formas.some(f => f.t.join(" ") === ts.join(" ") || (f.t.length === 1 && ts.length === 1 && ts[0] === f.t[0])));
    if (k >= 0) vozPj.set(v, k);
  }
  const T = D.tramos.length, segTr = D.segmentos.map(s => s.tr), NT = O.NT, P = pasajes(O);
  const en = P.map(() => new Set()), oP = new Array(O.length).fill(0);
  P.forEach(([a, b], u) => { for (let i = a; i <= b; i++) oP[i] = u; });
  M.forEach(m => { if (m.pj !== null) en[oP[m.o]].add(m.pj); });
  const parl = new Array(n).fill(0), dichas = new Array(n).fill(0);
  if (vozPj.size) { const vistos = new Set(); O.forEach(o => { const k = vozPj.get(o.voz); if (k === undefined) return;
    en[oP[o.i]].add(k); dichas[k] += o.toks.length; const c = o.par + ":" + k; if (!vistos.has(c)) { vistos.add(c); parl[k]++; } }); }
  const nA = new Array(n).fill(0), co = new Map();
  en.forEach(s => { const a = [...s].sort((x, y) => x - y); a.forEach(x => nA[x]++); for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) sumar(co, a[i] * 1000 + a[j]); });
  const U = P.length, minJ = U < 3000 ? 2 : 3;
  let E = [...co].filter(([, c]) => c >= minJ).map(([key, c]) => { const a = Math.floor(key / 1000), b = key % 1000; return [a, b, c, c / Math.sqrt(nA[a] * nA[b]), c * U / (nA[a] * nA[b])]; });
  E.sort((x, y) => y[2] - x[2]); E = E.slice(0, 80);
  const menc = new Array(n).fill(0), posPj = Array.from({length: n}, () => []);
  M.forEach(m => { if (m.pj !== null) { menc[m.pj]++; posPj[m.pj].push(m.g); } });
  if (vozPj.size) O.forEach(o => { const k = vozPj.get(o.voz); if (k !== undefined) posPj[k].push(o.ini); });
  posPj.forEach(p => p.sort((a, b) => a - b));
  const activos = [...Array(n).keys()].filter(k => nA[k]), aristas = E.map(([a, b, , f]) => [a, b, f]);
  const grupos = louvain(n, aristas), betw = intermediacion(n, aristas), pos = disponer(n, aristas, activos);
  const grado = new Array(n).fill(0); E.forEach(([a, b, c]) => { grado[a] += c; grado[b] += c; });
  const largoTr = new Array(T).fill(0); O.forEach(o => largoTr[segTr[o.seg]] += o.toks.length);
  const oDe = g => { let lo = 0, hi = O.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (O[m].ini <= g) lo = m; else hi = m - 1; } return lo; };
  const peso = [...Array(n).keys()].map(k => menc[k] + parl[k]), pmax = Math.max(1, ...peso), gmax = Math.max(1, ...grado);
  const score = peso.map((p, k) => 0.5 * p / pmax + 0.5 * grado[k] / gmax), smax = Math.max(1e-9, ...score);
  const L = [...Array(n).keys()].map(k => {
    const ps = posPj[k], trs = new Map(); ps.forEach(g => sumar(trs, segTr[O[oDe(g)].seg]));
    const cubre = T ? trs.size / T : 1, conc = ps.length ? Math.max(...trs.values()) / ps.length : 0, tPico = trs.size ? masComun(trs) : 0;
    const tramoGrande = T && largoTr[tPico] / NT > 0.45;
    let rol;
    if (!ps.length) rol = "sin apariciones";
    else if (score[k] >= 0.7 * smax && cubre >= 0.6) rol = "protagonista";
    else if (score[k] >= 0.3 * smax && cubre >= 0.4) rol = "principal";
    else if ((T > 1 && conc >= 0.7 && !tramoGrande) || (ps[ps.length - 1] - ps[0]) / NT <= 0.25) rol = "episódico";
    else rol = "secundario";
    return {n: R[k].nombre, f: R[k].formas.map(f => f.t.join(" ") + (f.r ? ` [${f.r[0]}-${f.r[1]}]` : "")), rol, pu: betw[k] >= 0.15 && nA[k] >= 5 && rol !== "protagonista",
      g: grupos[k], m: menc[k], h: parl[k], d: dichas[k], u: nA[k], gr: grado[k], b: Math.round(betw[k] * 1000) / 1000,
      ini: ps.length ? ps[0] / NT : null, fin: ps.length ? ps[ps.length - 1] / NT : null, t_pico: tPico,
      amb: M.filter(m => m.pj === k && m.amb).length, xy: pos[k] ? [Math.round(pos[k][0] * 1e4) / 1e4, Math.round(pos[k][1] * 1e4) / 1e4] : null, s: Math.round(score[k] / smax * 1000) / 1000};
  });
  [...Array(n).keys()].filter(k => L[k].rol === "protagonista").sort((a, b) => score[b] - score[a]).slice(3).forEach(k => L[k].rol = "principal");
  const pistas = pistasParentesco(O, M);
  let F, sinNombre = [], famOrigen;
  if ((familiaTexto || "").trim()) { const r = leerFamilia(familiaTexto, R); F = r.F; sinNombre = r.sin; famOrigen = "escrita"; }
  else { F = familiaDesdePistas(pistas); famOrigen = "pistas"; }
  F = evidenciasFamilia(F, O, M);
  const arbol = disponerArbol(F), epi = epitetos(O, M, NOM, lex);
  const DP = {lista: L, M: M.filter(m => m.pj !== null).map(m => [m.o, m.a, m.b, m.pj, m.amb ? 1 : 0]), P, teatro: !!D.teatro, minJ,
    voz: Object.fromEntries([...vozPj].map(([v, k]) => [String(O.find(o => o.voz === v).vozI), k])),
    fam: F.map(r => ({a: r.a, b: r.b, t: r.t, e: r.e, c: (r.c || []).slice(0, 3)})), fam_origen: famOrigen,
    fam_texto: (familiaTexto || "").trim() || textoFamilia(F, R), fam_sin_nombre: sinNombre, arbol, epi,
    amb: {res: resol.resueltas, sin: resol.sin_resolver, formas: [...ambFormas].sort((a, b) => b[1] - a[1]).slice(0, 8)},
    reparto: (repartoTexto || "").trim(), ia: {}, E: E.map(e => [e[0], e[1], e[2], Math.round(e[3] * 1e4) / 1e4, Math.round(e[4] * 100) / 100])};
  DP.hall = hallazgos(DP, D, O, M, txtM, E, ambFormas, F, arbol, lex);
  return DP;
}

function hallazgos(DP, D, O, M, txtM, E, ambFormas, F, A, lex) {
  const L = DP.lista, H = [], nom = k => `⟦${k}⟧`;
  const vivos = L.map((p, k) => p.m + p.h > 0 ? k : -1).filter(k => k >= 0); if (!vivos.length) return H;
  const vec = cnt(); E.forEach(([a, b]) => { sumar(vec, a); sumar(vec, b); });
  const c0 = mayor(vivos, k => [L[k].s, L[k].m]);
  if (val(vec, c0)) H.push({etq: "El centro", txt: `Con ${nom(c0)} coinciden ${val(vec, c0)} de los ${vivos.length - 1} personajes restantes: la red gira a su alrededor.`, pj: [c0], ir: {focal: c0}});
  const pu = vivos.filter(k => L[k].pu);
  if (pu.length) { const k = mayor(pu, k => L[k].b); H.push({etq: "Hace de puente", txt: `Muchos caminos de la red pasan por ${nom(k)}: une grupos de personajes que casi no se tocan entre sí.`, pj: [k], ir: {focal: k}}); }
  let E3 = E.filter(e => e[2] >= 3 && e[0] !== c0 && e[1] !== c0); if (!E3.length) E3 = E.filter(e => e[2] >= 3);
  if (E3.length) { const [a, b, c] = mayor(E3, e => [e[3], e[2]]);
    H.push({etq: "Pareja", txt: `${nom(a)} y ${nom(b)} van ${relPJ(c, L[a].u, L[b].u)}: coinciden en ${c} pasajes.`, pj: [a, b], ir: {arista: [a, b]}}); }
  const epi = vivos.filter(k => L[k].rol === "episódico" && L[k].m + L[k].h >= 5);
  if (epi.length && D.tramos.length > 1) { const k = mayor(epi, k => L[k].m + L[k].h);
    H.push({etq: "De paso", txt: `Casi todas las apariciones de ${nom(k)} están en un solo tramo: <i>${escH(D.tramos[L[k].t_pico])}</i>.`, pj: [k], ir: {focal: k, tramo: L[k].t_pico}}); }
  const imp = vivos.filter(k => L[k].rol === "protagonista" || L[k].rol === "principal").sort((a, b) => L[a].ini - L[b].ini); let rel = null;
  imp.forEach((a, i) => imp.slice(i + 1).forEach(b => { if (L[b].ini >= L[a].fin - 0.05 && (!rel || L[b].ini - L[a].fin > rel[2])) rel = [a, b, L[b].ini - L[a].fin]; }));
  if (rel) H.push({etq: "Relevo", txt: `Cuando entra ${nom(rel[1])}, ${nom(rel[0])} ya casi no aparece: no comparten época.`, pj: [rel[0], rel[1]], ir: {focal: rel[1]}});
  if (ambFormas.size) {
    const f = masComun(ambFormas), c = ambFormas.get(f), aq = cnt(); M.forEach(m => { if (m.amb && txtM(m) === f) sumar(aq, m.pj); });
    const quien = [...aq].sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);
    if (quien.length) H.push({etq: "Nombre compartido", txt: `«${escH(f)}» aparece ${c} veces solo, sin apellido: la herramienta lo repartió por contexto entre ${quien.map(nom).join(", ")}. Revísalo.`, pj: quien, ir: {focal: quien[0]}});
  }
  const pos = new Map(); M.forEach(m => { if (m.pj !== null) { if (!pos.has(m.pj)) pos.set(m.pj, []); pos.get(m.pj).push([m.g, m.o]); } });
  let hueco = null;
  for (const [k, ps] of pos) { ps.sort((a, b) => a[0] - b[0]); if (ps.length < 8) continue;
    for (let i = 3; i < ps.length - 2; i++) { const g = (ps[i][0] - ps[i - 1][0]) / O.NT; if (g >= 0.25 && (!hueco || g > hueco[1])) hueco = [k, g, ps[i - 1][1], ps[i][1]]; } }
  const lugar = i => `${D.tipo_seg.toLowerCase()} ${D.segmentos[O[i].seg].e}`;
  if (hueco) { const [k, g, o1, o2] = hueco;
    H.push({etq: "¿Dos personajes?", txt: `${nom(k)} desaparece durante el ${Math.round(100 * g)}% de la obra (desde ${lugar(o1)} hasta ${lugar(o2)}) y luego vuelve. Si en la obra se repiten nombres, puede ser otro personaje: sepáralos en el reparto con un rango, p. ej. <code>aureliano [1-9]</code>.`, pj: [k], ir: {focal: k}}); }
  const ks = Object.keys(A).map(Number);
  if (ks.length) {
    const porNombre = new Map(), vistaW = new Map(), fuera = new Set(["coronel", "padre", "general", "hijo", "bella", "segundo", "seminarista", "renata", "diecisiete"]);
    ks.forEach(k => (L[k].n.match(/[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+/g) || []).forEach(w0 => { const w = norm(w0); if (!vistaW.has(w)) vistaW.set(w, w0);
      if (!lex.STOP.has(w) && w.length > 3 && !fuera.has(w)) { if (!porNombre.has(w)) porNombre.set(w, new Set()); porNombre.get(w).add(k); } }));
    const top = mayor([...porNombre], ([, s]) => [new Set([...s].map(k => A[k][0])).size, s.size]);
    if (top) { const [w, s] = top, gens = new Set([...s].map(k => A[k][0]));
      if (gens.size >= 3) { const kk = [...s].sort((a, b) => A[a][0] - A[b][0]);
        H.push({etq: "Un nombre que se hereda", txt: `«${escH(vistaW.get(w))}» se repite en ${kk.length} personajes de ${gens.size} generaciones: ${kk.map(nom).join(", ")}. El árbol los separa.`, pj: kk.slice(0, 6), ir: {vista: "arbol", focal: kk[0]}}); } }
    const r = F.find(r => (r.t === "pareja" || r.t === "amante") && r.a in A && r.b in A && A[r.a][0] !== A[r.b][0]);
    if (r) H.push({etq: "Pareja entre generaciones", txt: `${nom(r.a)} y ${nom(r.b)} son pareja (${escH(r.e)}) aunque pertenecen a generaciones distintas del árbol.`, pj: [r.a, r.b], ir: {vista: "arbol", arista: [r.a, r.b]}});
  }
  const tard = vivos.filter(k => L[k].ini >= 0.3 && ["protagonista", "principal", "secundario"].includes(L[k].rol));
  if (tard.length) { const k = mayor(tard, k => L[k].s);
    H.push({etq: "Llega tarde", txt: `La primera mención de ${nom(k)} llega pasado el ${Math.round(100 * L[k].ini)}% de la obra, y aun así pesa en la red.`, pj: [k], ir: {focal: k}}); }
  return H.slice(0, 9);
}
