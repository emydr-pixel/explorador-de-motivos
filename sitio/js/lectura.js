// Urdimbre (explorador de motivos) · la lectura en red (versión web)
// crearModelo(D) hace los cálculos (sin DOM); montarLectura(raiz, D, opciones) dibuja la lectura completa.

const PALETA = ["#C8553D", "#2E86AB", "#5B8C5A", "#8E5BC2", "#D9822B", "#3D7A8C", "#B5838D", "#7A8B3A", "#A26A42", "#5C6BC0"];
const GRIS = "#9AA3A8";
export const norm = s => s.toLowerCase().replace(/ñ/g, "\u0001").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\u0001/g, "ñ");
const RX_TOK = /\d+(?:[.,]\d+)*|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
export const coincide = (w, fs) => fs.some(f => f.endsWith("*") ? w.startsWith(f.slice(0, -1)) : w === f);

// ======================= MODELO (cálculos) =======================
export function crearModelo(D) {
  const O = D.O.map(([seg, par, pag, voz, tx], i) => ({i, seg, par, pag, voz: D.voces[voz], tx, toks: (tx.match(RX_TOK) || []).map(norm)}));
  let NTOK = 0; O.forEach(o => { o.ini = NTOK; NTOK += o.toks.length; o.tr = D.segmentos[o.seg].tr; });
  const FREC = new Map(); O.forEach(o => o.toks.forEach(t => FREC.set(t, (FREC.get(t) || 0) + 1)));
  const VOCAB = [...FREC.keys()], T = D.tramos.length;
  const TR_INI = D.tramos.map((_, t) => { const o = O.find(x => x.tr === t); return o ? o.ini : NTOK; });
  const TR_LARGO = D.tramos.map((_, t) => O.filter(o => o.tr === t).reduce((s, o) => s + o.toks.length, 0));
  const M = {O, NTOK, FREC, VOCAB, T, TR_INI, TR_LARGO, motivos: [], unidad: D.unidad, top: 40};
  M.contar = fs => { let c = 0; for (const [w, n] of FREC) if (coincide(w, fs)) c += n; return c; };
  M.oracionEn = pos => { let lo = 0, hi = O.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (O[m].ini <= pos) lo = m; else hi = m - 1; } return O[lo]; };

  M.calcular = (motivos, unidad = M.unidad, top = M.top) => {
    Object.assign(M, {motivos, unidad, top}); const K = motivos.length;
    M.W2M = new Map();
    for (const w of VOCAB) { const ids = []; motivos.forEach((m, k) => { if (coincide(w, m.f)) ids.push(k); }); if (ids.length) M.W2M.set(w, ids); }
    M.POSM = motivos.map(() => []);
    O.forEach(o => { const s = new Set(); o.toks.forEach((t, j) => { const ids = M.W2M.get(t); if (ids) ids.forEach(k => { s.add(k); M.POSM[k].push(o.ini + j); }); }); o.m = [...s]; });
    M.UNIS = {oracion: O.map(o => ({os: [o.i], tr: o.tr, m: o.m}))};
    for (const tipo of ["parrafo", "ventana"]) {
      const g = new Map();
      O.forEach(o => { const k = tipo === "parrafo" ? o.par : Math.floor(o.ini / 60); if (!g.has(k)) g.set(k, {os: [], tr: o.tr, m: new Set()}); const u = g.get(k); u.os.push(o.i); o.m.forEach(x => u.m.add(x)); });
      M.UNIS[tipo] = [...g.values()].map(u => ({os: u.os, tr: u.tr, m: [...u.m]}));
    }
    M.CACHE = {}; M.BASE = M.red(unidad, -1); M.solidez();
    familias(M, K); M.POS = disponer(M, K); M.BETW = intermediacion(M.BASE.edges, K);
    return M;
  };
  M.red = (tipo, tr) => {
    const key = tipo + "|" + tr + "|" + M.top; if (M.CACHE[key]) return M.CACHE[key];
    const US = M.UNIS[tipo].filter(u => tr < 0 || u.tr === tr), n = US.length, nA = new Array(M.motivos.length).fill(0), co = new Map();
    US.forEach((u, ui) => { const m = u.m; m.forEach(a => nA[a]++);
      for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) {
        const a = Math.min(m[i], m[j]), b = Math.max(m[i], m[j]), k = a * 1000 + b;
        let e = co.get(k); if (!e) { e = {a, b, c: 0, us: []}; co.set(k, e); } e.c++; e.us.push(ui); } });
    const minJ = tr < 0 ? (n < 5000 ? 2 : Math.max(3, Math.round(n / 3000))) : 2;
    const edges = [...co.values()].filter(e => e.c >= minJ).map(e => ({...e, f: e.c / Math.sqrt(nA[e.a] * nA[e.b]), l: e.c * n / (nA[e.a] * nA[e.b])}))
      .filter(e => e.l > 1).sort((x, y) => y.f - x.f).slice(0, M.top);
    return M.CACHE[key] = {US, n, nA, edges, co};
  };
  M.solidez = () => {
    const otras = ["oracion", "parrafo", "ventana"].map(u => new Set(M.red(u, -1).edges.map(e => e.a * 1000 + e.b)));
    M.BASE.edges.forEach(e => e.sol = otras.filter(s => s.has(e.a * 1000 + e.b)).length);
  };
  return M;
}

function familias(M, k) {   // Louvain, una pasada de movimientos locales
  const w = Array.from({length: k}, () => new Map()), deg = new Array(k).fill(0);
  M.BASE.edges.forEach(e => { w[e.a].set(e.b, e.f); w[e.b].set(e.a, e.f); deg[e.a] += e.f; deg[e.b] += e.f; });
  const m2 = deg.reduce((s, x) => s + x, 0) || 1, com = [...Array(k).keys()], tot = deg.slice();
  for (let it = 0, mov = true; mov && it < 20; it++) { mov = false;
    for (let i = 0; i < k; i++) { if (!deg[i]) continue;
      const ci = com[i]; tot[ci] -= deg[i]; const enl = new Map();
      w[i].forEach((f, j) => enl.set(com[j], (enl.get(com[j]) || 0) + f));
      let mejor = ci, g0 = (enl.get(ci) || 0) - tot[ci] * deg[i] / m2;
      enl.forEach((v, c) => { const g = v - tot[c] * deg[i] / m2; if (g > g0 + 1e-9) { g0 = g; mejor = c; } });
      com[i] = mejor; tot[mejor] += deg[i]; if (mejor !== ci) mov = true; } }
  const tam = new Map(); com.forEach((c, i) => deg[i] && tam.set(c, (tam.get(c) || 0) + 1));
  const orden = [...tam.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]);
  M.FAM = com.map((c, i) => deg[i] ? orden.indexOf(c) : -1);
  M.COLOR = M.FAM.map(f => f < 0 ? GRIS : PALETA[f % PALETA.length]);
}
function disponer(M, k) {   // resortes para el grupo principal; grupos pequeños y sueltos en una fila inferior
  const par = [...Array(k).keys()], raiz = x => par[x] === x ? x : (par[x] = raiz(par[x]));
  M.BASE.edges.forEach(e => { par[raiz(e.a)] = raiz(e.b); });
  const comps = new Map(); for (let i = 0; i < k; i++) { if (!M.POSM[i].length) continue; const r = raiz(i); if (!comps.has(r)) comps.set(r, []); comps.get(r).push(i); }
  const lista = [...comps.values()].sort((a, b) => b.length - a.length), pos = new Array(k).fill(null);
  const resortes = nodos => {
    const n = nodos.length, idx = new Map(nodos.map((x, i) => [x, i]));
    if (n === 1) return [[0.5, 0.5]];
    const p = nodos.map((_, i) => [0.5 + 0.4 * Math.cos(2 * Math.PI * i / n), 0.5 + 0.4 * Math.sin(2 * Math.PI * i / n)]);
    const es = M.BASE.edges.filter(e => idx.has(e.a) && idx.has(e.b)), fmax = Math.max(...es.map(e => e.f), 1e-6), kk = Math.sqrt(1 / n) * 0.9;
    for (let it = 0; it < 500; it++) {
      const t = 0.08 * (1 - it / 500) + 0.002, d = p.map(() => [0, 0]);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const dx = p[i][0] - p[j][0], dy = p[i][1] - p[j][1], dist = Math.hypot(dx, dy) || 1e-3, f = kk * kk / dist;
        d[i][0] += dx / dist * f; d[i][1] += dy / dist * f; d[j][0] -= dx / dist * f; d[j][1] -= dy / dist * f; }
      es.forEach(e => { const i = idx.get(e.a), j = idx.get(e.b), dx = p[i][0] - p[j][0], dy = p[i][1] - p[j][1];
        const dist = Math.hypot(dx, dy) || 1e-3, f = dist * dist / kk * (0.4 + e.f / fmax);
        d[i][0] -= dx / dist * f; d[i][1] -= dy / dist * f; d[j][0] += dx / dist * f; d[j][1] += dy / dist * f; });
      p.forEach((q, i) => { const len = Math.hypot(d[i][0], d[i][1]) || 1; q[0] += d[i][0] / len * Math.min(len, t); q[1] += d[i][1] / len * Math.min(len, t); });
    }
    const xs = p.map(q => q[0]), ys = p.map(q => q[1]), [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    return p.map(q => [(q[0] - x0) / ((x1 - x0) || 1), (q[1] - y0) / ((y1 - y0) || 1)]);
  };
  if (lista.length) resortes(lista[0]).forEach((q, i) => pos[lista[0][i]] = [q[0], q[1] * 0.8]);
  const resto = lista.slice(1), total = resto.reduce((s, c) => s + c.length, 0); let x = 0;
  resto.forEach(c => { const w = c.length / total; resortes(c).forEach((q, i) => pos[c[i]] = [x + w * (0.15 + 0.7 * q[0]), 0.93 + 0.07 * q[1]]); x += w; });
  return pos;
}
function intermediacion(edges, k) {   // Brandes, con distancia = 1 / fuerza
  const adj = Array.from({length: k}, () => []), cb = new Array(k).fill(0);
  edges.forEach(e => { adj[e.a].push([e.b, 1 / e.f]); adj[e.b].push([e.a, 1 / e.f]); });
  for (let s = 0; s < k; s++) {
    if (!adj[s].length) continue;
    const dist = new Array(k).fill(Infinity), sigma = new Array(k).fill(0), pred = Array.from({length: k}, () => []), orden = [], hecho = new Array(k).fill(false);
    dist[s] = 0; sigma[s] = 1;
    for (;;) { let u = -1; for (let i = 0; i < k; i++) if (!hecho[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0) break; hecho[u] = true; orden.push(u);
      adj[u].forEach(([v, w]) => { const nd = dist[u] + w;
        if (nd < dist[v] - 1e-12) { dist[v] = nd; sigma[v] = sigma[u]; pred[v] = [u]; } else if (Math.abs(nd - dist[v]) < 1e-12) { sigma[v] += sigma[u]; pred[v].push(u); } }); }
    const delta = new Array(k).fill(0);
    for (let i = orden.length - 1; i >= 0; i--) { const w = orden[i]; pred[w].forEach(v => delta[v] += sigma[v] / sigma[w] * (1 + delta[w])); if (w !== s) cb[w] += delta[w]; }
  }
  const n = cb.filter((_, i) => adj[i].length).length, norma = n > 2 ? (n - 1) * (n - 2) : 1;
  return cb.map(x => x / norma);
}

// Miniatura de la red (para la galería)
export function miniRed(D, motivos) {
  const M = crearModelo(D).calcular(motivos.map(m => ({n: m.n, f: m.f, t: m.t})));
  const P = i => M.POS[i] ? [20 + 260 * M.POS[i][0], 16 + 150 * M.POS[i][1]] : null, nmax = Math.max(1, ...M.BASE.nA), fmax = Math.max(0.01, ...M.BASE.edges.map(e => e.f));
  let s = `<svg viewBox="0 0 300 186" class="mini" role="img" aria-label="Red de motivos de ${esc(D.titulo)}">`;
  M.BASE.edges.forEach(e => { const a = P(e.a), b = P(e.b); if (a && b) s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${M.FAM[e.a] === M.FAM[e.b] && M.FAM[e.a] >= 0 ? M.COLOR[e.a] : GRIS}" stroke-opacity=".55" stroke-width="${(0.6 + 3 * e.f / fmax).toFixed(1)}"/>`; });
  motivos.forEach((_, i) => { const p = P(i); if (p && M.BASE.nA[i]) s += `<circle cx="${p[0]}" cy="${p[1]}" r="${(2.5 + 7 * Math.sqrt(M.BASE.nA[i] / nmax)).toFixed(1)}" fill="${M.COLOR[i]}"/>`; });
  return {svg: s + "</svg>", palabras: M.NTOK, motivos: motivos.length};
}

// ======================= VISTA =======================
const CSS = `
.lr{font-family:var(--f-ui);color:var(--tinta);font-size:14.5px;line-height:1.5}
.lr *{box-sizing:border-box}
.lr button,.lr select,.lr input,.lr textarea{font:inherit;color:var(--tinta)}
.lr .cab{display:flex;justify-content:space-between;align-items:flex-end;gap:12px 20px;flex-wrap:wrap;padding-bottom:14px;border-bottom:1px solid var(--linea)}
.lr .cab>div:first-child{min-width:0}
.lr h1{font-family:var(--f-libro);font-weight:600;font-size:clamp(26px,4vw,34px);margin:0;line-height:1.1;text-wrap:balance;color:var(--naranja,var(--acento))}
.lr .autor{font-family:var(--f-libro);font-style:italic;color:var(--gris);font-size:16px}
.lr .datos{color:var(--gris);font-size:12.5px;margin-top:4px;font-family:var(--f-mono)}
.lr .acciones{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.lr .interruptor{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--gris);cursor:pointer;user-select:none;background:none;border:0;padding:4px}
.lr .interruptor i{width:34px;height:19px;border-radius:10px;background:var(--linea);position:relative;transition:.2s}
.lr .interruptor i:after{content:"";position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:var(--hoja);transition:.2s}
.lr .interruptor[aria-pressed=true] i{background:var(--acento)} .lr .interruptor[aria-pressed=true] i:after{left:17px}
.lr nav{display:flex;gap:2px;margin:14px 0 18px;flex-wrap:wrap;border-bottom:1px solid var(--linea)}
.lr nav button{border:0;background:transparent;padding:8px 14px 9px;cursor:pointer;color:var(--gris);font-weight:500;border-bottom:2px solid transparent;margin-bottom:-1px}
.lr nav button[aria-selected=true]{color:var(--acento);border-bottom-color:var(--naranja,var(--acento));font-weight:600}
.lr nav .n{font-size:11px;background:var(--naranja,var(--acento));color:#fff;border-radius:9px;padding:0 6px;margin-left:5px;font-family:var(--f-mono)}
.lr .vista[hidden]{display:none}
.lr .intro{font-family:var(--f-libro);font-size:17px;max-width:68ch;margin:0 0 16px}
.lr .grilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr));gap:14px}
.lr .tarjeta{background:var(--hoja);border:1px solid var(--linea);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-width:0}
.lr .etq{font-family:var(--f-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--naranja,var(--gris))}
.lr .frase{font-family:var(--f-libro);font-size:17px;line-height:1.4}
.lr .mot{font-weight:600}
.lr .btn{border:1px solid var(--linea);background:var(--hoja);border-radius:7px;padding:6px 12px;cursor:pointer;font-size:13px}
.lr .btn:hover{border-color:var(--acento)} .lr .btn.pri{background:var(--naranja,var(--tinta));color:#fff;border-color:var(--naranja,var(--tinta))}
.lr .btn.pri:hover{background:var(--naranja-hondo,var(--tinta))}
.lr .btn.link{border:0;background:none;padding:0;color:var(--acento);font-weight:600;text-align:left}
.lr .tarjeta .btn.link{margin-top:auto}
.lr :focus-visible{outline:2px solid var(--acento);outline-offset:2px}
.lr .tira{width:100%;height:auto;display:block}
.lr .redgrid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:16px}
@media (max-width:860px){.lr .redgrid{grid-template-columns:minmax(0,1fr)}}
.lr .ctl{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center;margin-bottom:10px;font-size:13.5px}
.lr .ctl label{display:flex;align-items:center;gap:7px}
.lr select,.lr input[type=text],.lr textarea{background:var(--hoja);border:1px solid var(--linea);border-radius:6px;padding:5px 8px;max-width:100%}
.lr .tramo{display:flex;align-items:center;gap:8px;flex:1 1 300px;min-width:0}
.lr .tramo input{flex:1;min-width:80px;accent-color:var(--acento)} .lr .tramo b{font-family:var(--f-libro);font-weight:600;min-width:0}
.lr .lienzo{background:var(--hoja);border:1px solid var(--linea);border-radius:10px;overflow:hidden}
.lr svg.red{width:100%;height:auto;display:block}
.lr .red text{font-size:13px;font-family:var(--f-ui);paint-order:stroke;stroke:var(--hoja);stroke-width:4px;stroke-linejoin:round;fill:var(--tinta);pointer-events:none}
.lr .red .n{cursor:pointer} .lr .red line{cursor:pointer}
.lr .panel{background:var(--hoja);border:1px solid var(--linea);border-radius:10px;padding:14px 16px;max-height:680px;overflow:auto;min-width:0}
.lr .panel h3{font-family:var(--f-libro);font-size:22px;margin:0 0 2px;font-weight:600}
.lr .sub{color:var(--gris);font-size:13px}
.lr .tit{font-family:var(--f-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gris);margin:14px 0 6px}
.lr .vec{display:flex;justify-content:space-between;gap:10px;padding:4px 6px;border-radius:6px;cursor:pointer;width:100%;border:0;background:none;text-align:left}
.lr .vec:hover{background:var(--papel)} .lr .vec span:last-child{color:var(--gris);font-size:12.5px;text-align:right}
.lr .cita{margin:8px 0;padding:2px 0 2px 12px;border-left:2px solid var(--subrayado2,var(--linea));font-family:var(--f-libro);font-size:15px;line-height:1.5}
.lr .cita .lug{display:block;font-family:var(--f-mono);font-size:11px;color:var(--gris);letter-spacing:.02em}
.lr .cita .mas{font-family:var(--f-ui);font-size:12px;border:0;background:none;color:var(--naranja,var(--acento));cursor:pointer;padding:0;margin-left:8px;font-weight:600}
.lr mark.a{background:var(--subrayado);color:inherit;padding:0 1px} .lr mark.b{background:var(--subrayado2);color:inherit;padding:0 1px}
.lr .ley{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:var(--gris);margin-top:8px}
.lr .ley i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.lr .num{font-variant-numeric:tabular-nums}
.lr:not(.investigar) .inv{display:none!important}
.lr .tabla{overflow-x:auto}
.lr table{border-collapse:collapse;font-size:12.5px;width:100%} .lr td,.lr th{padding:4px 6px;border-bottom:1px solid var(--linea);text-align:left}
.lr .taller{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px}
@media (max-width:860px){.lr .taller{grid-template-columns:minmax(0,1fr)}}
.lr .fila{display:grid;grid-template-columns:12px minmax(70px,.8fr) minmax(90px,2fr) 46px 24px;gap:8px;align-items:center;margin:5px 0}
.lr .fila input{width:100%;min-width:0} .lr .fila .c{font-size:12px;color:var(--gris);text-align:right;font-family:var(--f-mono)} .lr .fila .c.cero{color:var(--alerta);font-weight:600}
.lr .fila .x{border:0;background:none;cursor:pointer;color:var(--gris);font-size:16px}
.lr .chip{display:inline-block;border:1px solid var(--linea);border-radius:14px;padding:2px 9px;margin:3px 3px 0 0;font-size:12.5px;cursor:pointer;background:var(--hoja)}
.lr .chip:hover{border-color:var(--naranja,var(--acento));background:var(--naranja-suave,var(--hoja))} .lr .chip.usado{opacity:.4;cursor:default}
.lr .aviso{background:var(--papel);border:1px solid var(--linea);border-radius:8px;padding:8px 12px;font-size:13px;margin:8px 0}
.lr .nota{background:var(--hoja);border:1px solid var(--linea);border-radius:10px;padding:12px 16px;margin-bottom:12px}
.lr .nota textarea{width:100%;min-height:70px;margin-top:6px}
.lr .toast{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);background:var(--tinta);color:var(--papel);padding:8px 16px;border-radius:20px;font-size:13px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:20}
.lr .toast.on{opacity:1}
.lr details summary{cursor:pointer;color:var(--gris);font-size:13px}
.lr .redpj .n text{font-size:13.5px}
.lr .cuando text{font-size:12px;fill:var(--tinta);font-family:var(--f-ui)} .lr .cuando .fila-pj{cursor:pointer} .lr .cuando .fila-pj:hover rect.fondo-fila{fill:var(--papel)}
.lr mark.c{background:none;color:inherit;border-bottom:1.5px dotted var(--gris);padding:0}
.lr .rol{display:inline-block;font-family:var(--f-mono);font-size:10.5px;border-radius:9px;padding:1px 7px;background:var(--papel);color:var(--gris);letter-spacing:.03em;margin-left:8px;vertical-align:3px}
.lr .grilla.hallpj{grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))} .lr .hallpj .frase{font-size:15.5px}
.lr .pjn{font-weight:600;cursor:pointer;border:0;background:none;padding:0;font:inherit;font-weight:600;text-align:left} .lr .pjn:hover{text-decoration:underline}
.lr .vpjs{display:flex;gap:4px} .lr .vpjs .btn[aria-pressed=true]{background:var(--acento);color:var(--hoja);border-color:var(--acento)}
.lr .arbol-lienzo{overflow:auto;max-height:720px} .lr svg.arbolpj{display:block} .lr svg.arbolpj text{font-size:12.5px;fill:var(--tinta);font-family:var(--f-ui)}
.lr svg.arbolpj .n,.lr svg.arbolpj .v{cursor:pointer} .lr svg.arbolpj .v:hover{stroke-width:5}
.lr .redgrid.ancho{grid-template-columns:minmax(0,1fr)} .lr .redgrid.ancho .panel{max-height:none}
.lr .chip.on{border-color:var(--naranja,var(--acento));background:var(--naranja-suave,var(--papel))}
.lr .famrow{display:flex;gap:6px;align-items:baseline;padding:3px 6px;border-radius:6px;cursor:pointer;flex-wrap:wrap;width:100%;border:0;background:none;text-align:left} .lr .famrow:hover{background:var(--papel)}
.lr .ia{background:var(--papel);border-radius:8px;padding:8px 12px;margin:6px 0;font-size:14px} .lr .ia p{margin:4px 0}
.lr .ref{font-size:11px;color:var(--naranja,var(--acento));font-weight:700;cursor:pointer}
.lr .editor-pj{margin-top:18px;background:var(--hoja);border:1px solid var(--linea);border-radius:10px;padding:12px 16px}
.lr .editor-pj summary{font-size:14px;color:var(--tinta);font-weight:600}
.lr .editor-pj textarea{width:100%;font-family:var(--f-mono);font-size:12.5px;line-height:1.5;min-height:180px}
.lr .editor-pj .dos-col{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px;margin-top:10px}
.lr .chatcv{display:flex;flex-direction:column;gap:12px;margin:14px 0;max-height:none}
.lr .msg{max-width:min(760px,100%);border-radius:12px;padding:10px 14px;line-height:1.55}
.lr .msg.yo{align-self:flex-end;background:var(--acento);color:var(--hoja);border-bottom-right-radius:4px}
.lr .msg.yo p{margin:0}
.lr .msg.cv{align-self:flex-start;background:var(--hoja);border:1px solid var(--linea);border-bottom-left-radius:4px;font-family:var(--f-libro);font-size:16px}
.lr .msg.cv p{margin:0 0 8px} .lr .msg.cv ul{margin:0 0 8px;padding-left:20px}
.lr .msg .pie-msg{font-family:var(--f-ui);font-size:14px;border-top:1px solid var(--linea);margin-top:8px;padding-top:6px}
.lr .pensando{color:var(--gris);font-family:var(--f-ui);font-size:14px;font-style:italic}
.lr .refcv{border:0;background:var(--subrayado2);border-radius:5px;padding:0 4px;margin:0 1px;font:600 12px var(--f-mono);color:var(--tinta);cursor:pointer;vertical-align:1px}
.lr .refcv.mala{background:none;color:var(--alerta);text-decoration:line-through;cursor:help}
.lr .brilla .cita{background:var(--naranja-suave,var(--papel));transition:background .3s}
.lr .modocv[aria-pressed=true]{background:var(--acento);color:var(--hoja);border-color:var(--acento)}
.lr .entradacv{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap}
.lr .entradacv textarea{flex:1 1 280px;min-height:60px;font-family:var(--f-ui);font-size:15px}
.lr .de{font-family:var(--f-mono);font-size:10.5px;background:var(--subrayado2);border-radius:8px;padding:1px 7px;margin-left:6px}
@media (prefers-reduced-motion:reduce){.lr *{transition:none!important}}
`;

export function montarLectura(raiz, D, opciones = {}) {
  if (!document.getElementById("css-lectura")) { const st = document.createElement("style"); st.id = "css-lectura"; st.textContent = CSS; document.head.appendChild(st); }
  const descargar = opciones.descargar || (() => {});
  const est = opciones.estado || {};
  raiz.innerHTML = `<div class="lr">
  <div class="cab"><div><h1></h1><div class="autor"></div><div class="datos"></div></div>
    <div class="acciones"><button class="btn guardar-proy" type="button">Guardar proyecto</button>
    <button class="interruptor" type="button" aria-pressed="false" title="Muestra cifras, unidad de análisis y tablas"><i></i>Modo investigación</button></div></div>
  <nav role="tablist"><button data-v="hallazgos" role="tab">Hallazgos</button><button data-v="red" role="tab">Red</button><button data-v="personajes" role="tab" hidden>Personajes</button><button data-v="motivos" role="tab">Motivos</button>
    <button data-v="taller" role="tab">Taller</button><button data-v="conversar" role="tab">Conversar</button><button data-v="cuaderno" role="tab">Cuaderno<span class="n" hidden></span></button></nav>
  <section class="vista" data-v="hallazgos">
    <p class="intro">Puntos de entrada a tu lectura. Cada uno señala algo que la red encontró en la obra; ábrelo y comprueba en las frases si lo reconoces, si te sorprende o si no se sostiene.</p>
    <div class="grilla hall"></div>
    <details style="margin-top:18px"><summary>Cómo leer esta herramienta</summary><ul class="sub" style="max-width:68ch">
      <li>Un <b>motivo</b> es un grupo de palabras que nombran una misma imagen, objeto, espacio, idea o personaje. Tú decides cuáles (pestaña <b>Taller</b>).</li>
      <li>Dos motivos están <b>unidos</b> cuando aparecen en la misma frase más de lo que se esperaría por azar. Es vecindad, no sentido: el sentido lo confirma tu lectura.</li>
      <li>Los <b>colores</b> son familias de motivos que suelen ir juntos. Una línea <b>punteada</b> es una conexión frágil: desaparece si se mide de otra forma.</li>
      <li>En <b>Conversar</b> puedes preguntarle a la obra: un compañero de lectura responde citando frases con su página.</li>
      <li>La pestaña <b>Personajes</b> arma otra red: quién aparece con quién, cuánto y cuándo, y un árbol de familia con las frases que lo respaldan.</li>
      <li>Cada cita trae su página. Con <b>＋ citar</b> la guardas en el <b>Cuaderno</b>; con <b>Guardar proyecto</b> te llevas todo para seguir otro día.</li></ul></details>
  </section>
  <section class="vista" data-v="red" hidden>
    <div class="ctl"><div class="tramo"><button class="btn play" type="button" aria-label="Recorrer la obra">▶</button><input type="range" class="s-tramo" min="0" step="1" value="0" aria-label="Tramo"><b class="v-tramo"></b></div>
      <label>Motivo <select class="s-focal"></select></label>
      <label class="inv">Unidad <select class="s-unidad"></select></label>
      <label class="inv">Conexiones <input type="range" class="s-top" min="10" max="80" step="5" value="40" style="width:90px"><span class="v-top num">40</span></label></div>
    <div class="redgrid"><div style="min-width:0"><div class="lienzo"><svg class="red" viewBox="0 0 1000 660"></svg></div><div class="ley"></div>
      <div class="inv" style="margin-top:12px"><div class="tit">Conexiones de esta vista <button class="btn link csv" type="button" style="margin-left:8px">descargar CSV</button></div><div class="tabla"></div></div></div>
      <div class="panel"></div></div>
  </section>
  <section class="vista" data-v="personajes" hidden>
    <p class="intro">Quién aparece, cuánto, cuándo y con quién. Dos personajes se unen cuando el texto los nombra (o, en teatro, hablan) en el mismo <b>pasaje</b>: unos párrafos seguidos. Sirve para orientarse en obras con muchos personajes o con nombres que se repiten.</p>
    <div class="ctl"><div class="vpjs" hidden><button class="btn vpj" type="button" data-vpj="red" aria-pressed="true">Red</button><button class="btn vpj" type="button" data-vpj="arbol" aria-pressed="false">Árbol de familia</button></div>
      <div class="tramo"><button class="btn pj-play" type="button" aria-label="Recorrer la obra">▶</button><input type="range" class="pj-tramo" min="0" step="1" value="0" aria-label="Tramo"><b class="pj-vtramo"></b></div>
      <label>Personaje <select class="s-pj"></select></label></div>
    <div class="redgrid"><div style="min-width:0"><div class="lienzo red-lienzo"><svg class="red redpj" viewBox="0 0 1000 640"></svg></div>
      <div class="lienzo arbol-lienzo" hidden><svg class="arbolpj"></svg></div><div class="ley leypj"></div></div>
      <div class="panel panelpj"></div></div>
    <div class="tit" style="margin-top:20px">Para empezar</div><div class="grilla hallpj"></div>
    <div class="tit" style="margin-top:20px">Quién está cuándo</div>
    <div class="sub" style="margin-bottom:6px">Cada raya es una mención (o un parlamento); las líneas verticales separan los tramos. Haz clic en un nombre para abrir su ficha.</div>
    <div class="lienzo" style="padding:6px 8px"><svg class="cuando" viewBox="0 0 1000 100" style="width:100%;height:auto;display:block"></svg></div>
    <div class="inv" style="margin-top:14px"><div class="tit">Personajes en cifras <button class="btn link csvpj" type="button" style="margin-left:8px">descargar CSV</button></div><div class="tabla tablapj"></div></div>
    <details class="editor-pj"><summary>Corregir el reparto y la familia</summary>
      <div class="sub" style="margin-top:6px">Lo que cambies aquí recalcula la red, el árbol y las fichas, y se guarda con el proyecto.</div>
      <div class="aviso origen-pj"></div>
      <div class="dos-col">
        <label><span class="tit" style="display:block;margin-top:0">Reparto</span><textarea class="ta-reparto" spellcheck="false" aria-label="Reparto"></textarea>
          <span class="sub">Una línea por personaje: <code>Nombre: forma, otra forma</code>. Formas de varias palabras (<code>jose arcadio buendia</code>; gana la más larga), <code>*</code> para cualquier final (<code>huesped*</code>) y <code>[a-b]</code> para limitar una forma a esos capítulos (<code>aureliano [15-20]</code>). Si dos personajes comparten una forma sin rango, cada mención va al que se nombró más cerca.</span></label>
        <label><span class="tit" style="display:block;margin-top:0">Familia</span><textarea class="ta-familia" spellcheck="false" aria-label="Familia" placeholder="Aureliano Segundo: hijo de Arcadio y Santa Sofía de la Piedad; esposo de Fernanda del Carpio"></textarea>
          <span class="sub">Una línea por personaje, con los nombres del reparto: <code>Nombre: hijo de A y B; esposa de C; amante de D</code>. Arman el árbol: hijo/hija, hijo adoptivo, padre/madre, esposo/esposa, pareja/amante. Los demás (hermano, abuelo, tío, novio…) aparecen en la ficha. Vacía: se usan las frases del tipo «X, hijo de Y».</span></label>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn pri aplicar-pj" type="button">Aplicar cambios</button><button class="btn restaurar-pj" type="button">Volver al reparto inicial</button><button class="btn proponer-pj" type="button">Proponer un reparto automático</button></div>
      <div class="aviso estado-pj" hidden></div>
    </details>
    <details style="margin-top:12px"><summary>Cómo se arma esta sección y qué no ve</summary><ul class="sub" style="max-width:72ch">
      <li>Cuenta las <b>menciones explícitas</b>: nombres y papeles («el padre», «la hermana»). Los pronombres no se cuentan, así que un personaje muy presente pero poco nombrado parece más pequeño.</li>
      <li>Cuando dos personajes comparten un nombre («Aureliano»), cada mención suelta se asigna al que se nombró más cerca en el mismo capítulo. Es una conjetura: revisa las citas.</li>
      <li>El <b>rol</b> combina cuánto se le nombra, con cuántos coincide y en qué parte de la obra está. <b>⇄ Puente</b>: une grupos que casi no se tocan. Los <b>colores</b> son círculos de personajes que suelen aparecer juntos.</li>
      <li>Cada vínculo del <b>árbol</b> busca una frase del texto que lo diga (los dos nombres y una palabra de parentesco cerca); si no la encuentra, la línea se ve punteada y gris.</li>
      <li><b>Cómo lo llama la obra</b> recoge las fórmulas que se repiten pegadas al nombre («el coronel», «la bella»). <b>Motivos que lo acompañan</b> cruza esta red con tus motivos: es una base para pensar su papel simbólico, no una interpretación.</li></ul></details>
  </section>
  <section class="vista" data-v="motivos" hidden><p class="intro">Cada motivo, de un vistazo: dónde aparece a lo largo de la obra (cada raya es una aparición; las divisiones son los tramos), con qué va y dos frases donde se ve.</p><div class="grilla fichas"></div></section>
  <section class="vista" data-v="taller" hidden>
    <p class="intro">Aquí decides qué es un motivo. Cambia nombres, agrupa palabras o suma sugerencias; al pulsar <b>Aplicar</b>, toda la lectura se recalcula.</p>
    <div class="taller"><div class="tarjeta"><div class="etq">Tus motivos</div>
      <div class="sub">Palabras separadas por comas, sin tildes. El asterisco significa «cualquier terminación»: <code>pozo*</code> cuenta <i>pozo</i> y <i>pozos</i>; <code>mir*</code>, <i>mirar, miró, mirada</i>… (y también <i>mirlo</i>: revisa las frases).</div>
      <div class="filas"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn nuevo" type="button">＋ Nuevo motivo</button><button class="btn pri aplicar" type="button">Aplicar cambios</button>
        <button class="btn restaurar" type="button">Volver al diccionario inicial</button></div><div class="aviso estado" hidden></div></div>
      <div class="tarjeta"><div class="etq">Sugerencias del programa</div><div class="sub">Haz clic para sumar una palabra como motivo nuevo (luego puedes unirla a otro).</div><div class="sugs"></div></div></div>
  </section>
  <section class="vista" data-v="conversar" hidden>
    <p class="intro">Conversa con la obra. El compañero de lectura responde <b>solo con frases del libro</b>, numeradas y citadas con su página, para que puedas comprobar cada respuesta. Está pensado para quien ya la leyó: sirve para repasar, aclarar dudas y ponerse a prueba.</p>
    <div class="aviso nodispcv" hidden>La conversación usa Claude y funciona en la página publicada de Urdimbre, abierta desde Claude. En este archivo o en otro navegador no está disponible; el resto de la herramienta funciona igual.</div>
    <div class="dispcv" hidden>
      <div class="ctl"><div class="modoscv vpjs" style="display:flex;gap:4px;flex-wrap:wrap"><button class="btn modocv" type="button" data-m="preguntar">Preguntar a la obra</button><button class="btn modocv" type="button" data-m="prueba">Ponme a prueba</button><button class="btn modocv" type="button" data-m="socratico">Socrático</button></div>
        <label>Alcance <select class="alcancecv"></select></label><button class="btn nuevacv" type="button">Nueva conversación</button></div>
      <div class="sub ayudacv"></div>
      <div class="chatcv" aria-live="polite"></div>
      <div class="sugcv" style="margin-bottom:8px"></div>
      <div class="entradacv"><textarea class="tacv" placeholder="Escribe tu pregunta o tu respuesta…" aria-label="Tu mensaje"></textarea>
        <button class="btn pri enviarcv" type="button">Enviar</button><button class="btn parar" type="button" hidden>Detener</button></div>
      <details style="margin-top:12px"><summary>Cómo funciona y qué no hace</summary><ul class="sub" style="max-width:72ch">
        <li>Con cada mensaje, la página busca en la obra las frases que tienen que ver (por palabras, personajes y motivos) y solo esas frases se envían a Claude, con tu reparto, la familia y tus motivos. Nunca se envía el libro completo. Si le hacen falta más, Claude puede pedir otra búsqueda.</li>
        <li>Cada cita [n] es una frase de la obra: haz clic para verla con su capítulo y su página, y guárdala con <b>＋ citar</b>. Un número tachado es una frase que no se le envió: no está verificada.</li>
        <li>Responde solo con lo que está en las frases. Lo que no encuentra, lo dice. Lo que interpreta, lo marca como «Una lectura posible».</li>
        <li>Usa tu cuenta de Claude: la primera vez te pide permiso y cada mensaje cuenta para tu límite de uso. La conversación no se guarda; guarda en el Cuaderno lo que quieras conservar.</li></ul></details>
    </div>
  </section>
  <section class="vista" data-v="cuaderno" hidden>
    <p class="intro">Tus notas y las citas que guardaste, con su página. Descárgalas para llevarlas a tu trabajo, o guarda el proyecto completo.</p>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center"><button class="btn pri bajar-notas" type="button">Descargar notas (.md)</button><button class="btn nueva-nota" type="button">＋ Nota libre</button>
      <label class="btn" style="cursor:pointer">Unir notas de otro lector<input type="file" class="unir-notas" accept=".json,application/json" style="position:absolute;width:1px;height:1px;opacity:0"></label>
      <label class="sub" style="display:flex;gap:6px;align-items:center">Tu nombre <input type="text" class="autor-notas" placeholder="para el círculo de lectura" style="width:190px"></label></div>
    <div class="notas"></div>
  </section>
  <div class="toast" role="status"></div></div>`;
  const R = raiz.querySelector(".lr"), $ = s => R.querySelector(s), $$ = s => [...R.querySelectorAll(s)];
  const M = crearModelo(D), {O, T, TR_INI, TR_LARGO} = M;
  const lugarSeg = s => `${D.tipo_seg.toLowerCase()} ${D.segmentos[s].e}`;
  const FEM = ["Escena", "Parte", "Sección"].includes(D.tipo_seg);
  const elSeg = s => (FEM ? "la " : "el ") + lugarSeg(s), delSeg = s => (FEM ? "de la " : "del ") + lugarSeg(s);
  const pagina = p => D.cita === "impresa" ? `p. ${p}` : `p. ${p} del PDF`;
  const NOMBRE_UNIDAD = {oracion: "oración", parrafo: D.teatro ? "parlamento" : "párrafo", ventana: "ventana de 60 palabras"};
  const PLURAL_UNIDAD = {oracion: "oraciones", parrafo: D.teatro ? "parlamentos" : "párrafos", ventana: "ventanas de 60 palabras"};
  const MISMAS = {oracion: "las mismas", parrafo: "los mismos", ventana: "las mismas"};
  const S = {motivos: (est.motivos || D.motivos).map(m => ({...m})), unidad: est.unidad || D.unidad, tramo: -1, focal: -1, arista: null,
             top: 40, inv: false, notas: (est.notas || []).map(n => ({...n})), borrador: null};
  let HALL = [];
  const K = () => S.motivos.length, nombre = k => S.motivos[k].n;
  const COLOR = k => M.COLOR[k], FAM = k => M.FAM[k];
  const union = e => e.l >= 5 && e.c >= 5 ? "inseparables" : e.l >= 3 && e.c >= 3 ? "muy unidos" : e.l >= 1.8 ? "unidos" : "cercanos";
  const solidez = s => s >= 3 ? "sólida" : s === 2 ? "probable" : "frágil";
  const motHTML = k => `<span class="mot" style="color:${COLOR(k)}">«${esc(nombre(k))}»</span>`;
  const pct = x => Math.round(100 * x) + "%", veces = n => n === 1 ? "1 vez" : `${n} veces`;
  const cambio = () => opciones.alCambiar && opciones.alCambiar(proyecto());

  function recalcular() { M.calcular(S.motivos, S.unidad, S.top); HALL = hallazgos(); }

  function hallazgos() {
    const H = [], usados = new Set(), k = K(), minN = Math.max(5, Math.round(M.NTOK / 20000)), BASE = M.BASE, POSM = M.POSM, NTOK = M.NTOK;
    const vivos = [...Array(k).keys()].filter(i => POSM[i].length >= minN);
    const add = (h, ms) => { if (ms.some(m => usados.has(m)) && H.length > 2) return; ms.forEach(m => usados.add(m)); H.push(h); };
    const p = vivos.filter(i => M.BETW[i] > 0.05).sort((a, b) => M.BETW[b] - M.BETW[a])[0];
    if (p !== undefined) add({etq: "El puente", html: `${motHTML(p)} es el puente de tu red: muchas conexiones entre otros motivos pasan por él.`, ms: [p], ir: {focal: p}}, [p]);
    const ps = BASE.edges.filter(e => e.sol >= 3 && e.c >= 3).sort((a, b) => b.l - a.l)[0];
    if (ps) add({etq: "Pareja constante", html: `${motHTML(ps.a)} y ${motHTML(ps.b)} van juntos: aparecen en ${MISMAS[S.unidad]} ${ps.c} ${PLURAL_UNIDAD[S.unidad]} y la conexión se mantiene se mida como se mida.`, ms: [ps.a, ps.b], ir: {arista: [ps.a, ps.b]}}, [ps.a, ps.b]);
    const tarde = vivos.map(i => [i, POSM[i][0] / NTOK]).filter(x => x[1] >= 0.3).sort((a, b) => b[1] - a[1])[0];
    if (tarde) { const o = M.oracionEn(POSM[tarde[0]][0]);
      add({etq: "Nace tarde", html: `${motHTML(tarde[0])} no aparece hasta ${elSeg(o.seg)} (${pagina(o.pag)}), pasado el ${pct(tarde[1])} de la obra.`, ms: [tarde[0]], ir: {focal: tarde[0], tramo: o.tr}}, [tarde[0]]); }
    const apaga = vivos.map(i => [i, POSM[i][POSM[i].length - 1] / NTOK]).filter(x => x[1] <= 0.7).sort((a, b) => a[1] - b[1])[0];
    if (apaga) { const o = M.oracionEn(POSM[apaga[0]][POSM[apaga[0]].length - 1]);
      add({etq: "Se apaga", html: `${motHTML(apaga[0])} desaparece después ${delSeg(o.seg)} (${pagina(o.pag)}): no vuelve en el último ${pct(1 - apaga[1])} de la obra.`, ms: [apaga[0]], ir: {focal: apaga[0]}}, [apaga[0]]); }
    if (T > 1) {
      const raf = vivos.map(i => { const c = new Array(T).fill(0); POSM[i].forEach(q => c[M.oracionEn(q).tr]++); const t = c.indexOf(Math.max(...c)); return [i, c[t] / POSM[i].length, t]; })
        .filter(x => x[1] >= 0.6 && TR_LARGO[x[2]] / NTOK <= 0.45).sort((a, b) => b[1] - a[1])[0];
      if (raf) add({etq: "En ráfaga", html: `El ${pct(raf[1])} de ${motHTML(raf[0])} está en un solo tramo: <i>${esc(D.tramos[raf[2]])}</i>.`, ms: [raf[0]], ir: {focal: raf[0], tramo: raf[2]}}, [raf[0]]);
      const enc = BASE.edges.filter(e => e.c >= 4).map(e => { const c = new Array(T).fill(0); e.us.forEach(u => c[BASE.US[u].tr]++); const t = c.indexOf(Math.max(...c)); return [e, c[t], t]; })
        .filter(x => x[1] / x[0].c >= 0.6 && TR_LARGO[x[2]] / NTOK <= 0.45).sort((a, b) => b[1] - a[1])[0];
      if (enc) add({etq: "Un encuentro", html: `${motHTML(enc[0].a)} y ${motHTML(enc[0].b)} se encuentran sobre todo en <i>${esc(D.tramos[enc[2]])}</i> (${enc[1]} de sus ${enc[0].c} coincidencias).`, ms: [enc[0].a, enc[0].b], ir: {arista: [enc[0].a, enc[0].b], tramo: enc[2]}}, [enc[0].a, enc[0].b]);
    }
    let ev = null;
    for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) {
      const esp = BASE.nA[a] * BASE.nA[b] / BASE.n; if (esp < 4 || BASE.nA[a] < 10 || BASE.nA[b] < 10) continue;
      const c = (BASE.co.get(a * 1000 + b) || {c: 0}).c, r = c / esp; if (r <= 0.35 && (!ev || r < ev[3])) ev = [a, b, c, r, esp]; }
    if (ev) add({etq: "Se evitan", html: `${motHTML(ev[0])} y ${motHTML(ev[1])} son frecuentes, pero casi nunca coinciden: ${veces(ev[2])}, cuando por azar se esperarían unas ${Math.round(ev[4])}.`, ms: [ev[0], ev[1]], ir: {focal: ev[0]}}, [ev[0], ev[1]]);
    return H;
  }

  function tira(ks, alto = 16) {
    const W = 600, H = ks.length * alto + 14; let s = `<svg class="tira" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Apariciones a lo largo de la obra">`;
    s += `<rect x="0" y="0" width="${W}" height="${H - 12}" fill="var(--papel)"/>`;
    TR_INI.slice(1).forEach(p => s += `<line x1="${p / M.NTOK * W}" x2="${p / M.NTOK * W}" y1="0" y2="${H - 12}" stroke="var(--linea)" stroke-width="2"/>`);
    ks.forEach((k, r) => M.POSM[k].forEach(p => s += `<rect x="${(p / M.NTOK * W).toFixed(1)}" y="${r * alto + 2}" width="1.6" height="${alto - 4}" fill="${COLOR(k)}"/>`));
    return s + `<text x="0" y="${H - 1}" font-size="10" fill="var(--gris)">inicio</text><text x="${W}" y="${H - 1}" font-size="10" fill="var(--gris)" text-anchor="end">final</text></svg>`;
  }
  function ventana(tx, tramos, largo) {
    if (tx.length <= largo) return [0, tx.length]; if (!tramos.length) return [0, largo];
    const i = Math.min(...tramos.map(t => t[0])), f = Math.max(...tramos.map(t => t[1]));
    largo = Math.max(largo, Math.min(f - i + 80, 2 * largo));
    const a = Math.max(0, Math.min(i - Math.max(0, Math.floor((largo - (f - i)) / 3)), tx.length - largo));
    return [a, Math.min(tx.length, a + largo)];
  }
  function fragmento(os, marcas, largo = 300) {
    const partes = os.map(i => O[i]), tx = partes.map(o => o.tx).join(" "), hits = []; let m; const rx = new RegExp(RX_TOK.source, "g");
    while ((m = rx.exec(tx))) { const ids = M.W2M.get(norm(m[0])); if (ids) { const c = ids.find(x => x in marcas); if (c !== undefined) hits.push([m.index, m.index + m[0].length, marcas[c], c]); } }
    const primeros = [], vistos = new Set(); hits.forEach(h => { if (!vistos.has(h[3])) { vistos.add(h[3]); primeros.push(h); } });
    const [a, b] = ventana(tx, primeros, largo); let out = "", p = a;
    hits.forEach(([s, e, cls]) => { if (s < a || e > b) return; out += esc(tx.slice(p, s)) + `<mark class="${cls}">${esc(tx.slice(s, e))}</mark>`; p = e; });
    out += esc(tx.slice(p, b));
    let off = 0, o0 = partes[0]; for (const o of partes) { if (off + o.tx.length >= (primeros[0] ? primeros[0][0] : 0)) { o0 = o; break; } off += o.tx.length + 1; }
    const voz = D.teatro ? o0.voz : (o0.voz === "diálogo" ? "diálogo" : ""), lug = `${lugarSeg(o0.seg)} · ${pagina(o0.pag)}${voz ? " · " + voz : ""}`;
    const plano = (a > 0 ? "…" : "") + tx.slice(a, b).trim() + (b < tx.length ? "…" : "");
    return `<div class="cita"><span class="lug">${esc(lug)}<button class="mas" type="button" data-cita="${esc(JSON.stringify({tx: plano, lug}))}">＋ citar</button></span>${a > 0 ? "…" : ""}${out.trim()}${b < tx.length ? "…" : ""}</div>`;
  }
  const repartir = (arr, n) => arr.length <= n ? arr : Array.from({length: n}, (_, j) => arr[Math.round(j * (arr.length - 1) / (n - 1))]);

  function pintarHallazgos() {
    $(".hall").innerHTML = HALL.length ? HALL.map((h, i) => `<div class="tarjeta"><div class="etq">${h.etq}</div><div class="frase">${h.html}</div>${tira(h.ms, 14)}
      <button class="btn link ir" type="button" data-i="${i}">Ver en la red →</button></div>`).join("")
      : `<div class="aviso">Con estos motivos la red no muestra patrones claros todavía. Prueba con más motivos o agrupa variantes en el Taller.</div>`;
    $$(".hall .ir").forEach(b => b.onclick = () => irRed(HALL[+b.dataset.i].ir));
    if (DP && DP.hall.length) {
      const d = document.createElement("div"); d.className = "tarjeta";
      d.innerHTML = `<div class="etq">Personajes · ${esc(DP.hall[0].etq)}</div><div class="frase">${txtPJ(DP.hall[0].txt)}</div>${tiraPJ(DP.hall[0].pj, 14)}<button class="btn link" type="button">Ver la red de personajes →</button>`;
      d.querySelector(".btn.link").onclick = () => irPJ(DP.hall[0].ir);
      d.querySelectorAll(".pjn").forEach(x => x.onclick = () => irPJ({focal: +x.dataset.pj}));
      $(".hall").appendChild(d);
    }
  }
  function irRed(h) { S.tramo = h.tramo !== undefined ? h.tramo : -1; S.focal = h.focal !== undefined ? h.focal : -1; S.arista = h.arista || null; if (h.arista) S.focal = h.arista[0]; mostrar("red"); }
  const vistaRed = () => M.red(S.unidad, S.tramo);
  const vecinos = (r, k) => r.edges.filter(e => e.a === k || e.b === k).map(e => ({...e, otro: e.a === k ? e.b : e.a})).sort((x, y) => y.f - x.f);

  function pintarRed() {
    const r = vistaRed(), svg = $("svg.red"), k = K();
    $(".s-tramo").max = T; $(".s-tramo").value = S.tramo + 1;
    $(".v-tramo").textContent = S.tramo < 0 ? "Toda la obra" : `${S.tramo + 1}/${T} · ${D.tramos[S.tramo]}`;
    $(".s-focal").value = S.focal;
    const fmax = Math.max(0.01, ...r.edges.map(e => e.f)), nmax = Math.max(1, ...r.nA), solidas = new Map(M.BASE.edges.map(e => [e.a * 1000 + e.b, e.sol]));
    const veci = new Set(S.focal >= 0 ? vecinos(r, S.focal).map(v => v.otro).concat([S.focal]) : []);
    const P = i => M.POS[i] ? [70 + 860 * M.POS[i][0], 40 + 590 * M.POS[i][1]] : null;
    let s = `<rect x="0" y="0" width="1000" height="660" fill="transparent" class="fondo"/>`;
    r.edges.forEach((e, idx) => { const pa = P(e.a), pb = P(e.b); if (!pa || !pb) return;
      const toca = S.focal < 0 || e.a === S.focal || e.b === S.focal;
      const sel = S.arista && ((S.arista[0] === e.a && S.arista[1] === e.b) || (S.arista[0] === e.b && S.arista[1] === e.a));
      const sol = S.tramo < 0 ? e.sol : (solidas.get(e.a * 1000 + e.b) || 1), col = sel ? "var(--acento)" : (FAM(e.a) >= 0 && FAM(e.a) === FAM(e.b) ? COLOR(e.a) : GRIS);
      s += `<line data-e="${idx}" x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}" stroke="${col}" stroke-linecap="round" stroke-width="${(1.2 + 10 * e.f / fmax).toFixed(1)}"
        stroke-opacity="${toca ? (S.focal >= 0 ? .9 : .55) : .07}" ${sol <= 1 ? 'stroke-dasharray="2 7"' : ""}><title>${esc(nombre(e.a))} — ${esc(nombre(e.b))}: ${union(e)} (${veces(e.c)} juntos)</title></line>`; });
    for (let i = 0; i < k; i++) { const p = P(i); if (!p) continue;
      const c = r.nA[i], rad = c ? 6 + 20 * Math.sqrt(c / nmax) : 4, op = S.focal >= 0 && !veci.has(i) ? .16 : (c ? 1 : .35);
      s += `<g class="n" data-k="${i}" opacity="${op}"><circle cx="${p[0]}" cy="${p[1]}" r="${rad.toFixed(1)}" pointer-events="all" fill="${c ? COLOR(i) : "var(--hoja)"}" stroke="${i === S.focal ? "var(--tinta)" : (c ? "var(--hoja)" : COLOR(i))}" stroke-width="${i === S.focal ? 3.5 : 1.5}"/>
        <text x="${p[0]}" y="${p[1] - rad - 6}" text-anchor="middle">${esc(nombre(i))}</text><title>${esc(nombre(i))}: ${veces(c)} en esta vista</title></g>`; }
    svg.innerHTML = s;
    svg.querySelector(".fondo").onclick = () => { S.focal = -1; S.arista = null; pintarRed(); };
    svg.querySelectorAll("g.n").forEach(g => g.onclick = ev => { ev.stopPropagation(); const i = +g.dataset.k; S.focal = S.focal === i ? -1 : i; S.arista = null; pintarRed(); });
    svg.querySelectorAll("line[data-e]").forEach(l => l.onclick = ev => { ev.stopPropagation(); const e = r.edges[+l.dataset.e]; S.arista = [e.a, e.b]; pintarRed(); });
    const fams = [...new Set(M.FAM.filter(f => f >= 0))].sort((a, b) => a - b);
    $(".ley").innerHTML = fams.map(f => `<span><i style="background:${PALETA[f % PALETA.length]}"></i>${M.FAM.map((x, i) => x === f ? nombre(i) : null).filter(Boolean).slice(0, 3).map(esc).join(", ")}${M.FAM.filter(x => x === f).length > 3 ? "…" : ""}</span>`).join("")
      + `<span>línea continua: unión sólida · <span style="letter-spacing:2px">· · ·</span> frágil</span>`;
    if (S.arista) panelArista(r); else if (S.focal >= 0) panelNodo(r); else panelResumen(r);
    if (S.inv) tablaRed(r);
  }
  function panelResumen(r) {
    const top = r.edges.slice(0, 8);
    $(".panel").innerHTML = `<h3>${S.tramo < 0 ? "Toda la obra" : esc(D.tramos[S.tramo])}</h3>
      <div class="sub">${S.tramo < 0 ? "Mueve el control de arriba (o pulsa ▶) para recorrer la obra por tramos." : "La red solo con este tramo. Los motivos quedan en el mismo lugar para comparar."}</div>
      <div class="tit">Lo que más se une aquí</div>${top.length ? top.map((e, i) => `<button class="vec" type="button" data-i="${i}"><span>${motHTML(e.a)} y ${motHTML(e.b)}</span><span>${union(e)}<span class="inv"> · ${e.c} · ×${e.l.toFixed(1)}</span></span></button>`).join("") : '<div class="sub">Sin conexiones en esta vista.</div>'}
      <div class="tit">Para empezar</div><div class="sub">Haz clic en un motivo para ver con qué se une y en qué frases; o en una línea para leer las frases donde dos motivos coinciden.</div>`;
    $$(".panel .vec").forEach(d => d.onclick = () => { const e = top[+d.dataset.i]; S.arista = [e.a, e.b]; pintarRed(); });
  }
  function panelNodo(r) {
    const k = S.focal, vs = vecinos(r, k), us = r.US.filter(u => u.m.includes(k));
    const conM = us.sort((a, b) => b.m.length - a.m.length).slice(0, 12).sort((a, b) => a.os[0] - b.os[0]);
    $(".panel").innerHTML = `<h3 style="color:${COLOR(k)}">${esc(nombre(k))}</h3>
      <div class="sub">${veces(r.nA[k])} en ${S.tramo < 0 ? "toda la obra" : "este tramo"} <span class="inv">· en ${r.nA[k]} ${PLURAL_UNIDAD[S.unidad]} · palabras: ${esc(S.motivos[k].f.join(", "))}</span></div>
      ${tira([k])}<div class="tit">Va con</div>
      ${vs.length ? vs.slice(0, 10).map((v, i) => `<button class="vec" type="button" data-i="${i}"><span>${motHTML(v.otro)}</span><span>${union(v)}<span class="inv"> · ${v.c} · ×${v.l.toFixed(1)}</span></span></button>`).join("") : '<div class="sub">No se une con otros motivos en esta vista: aparece solo.</div>'}
      <div class="tit">Dónde se ve</div>${repartir(conM, 4).map(u => fragmento(u.os, {[k]: "a"})).join("") || '<div class="sub">No aparece en este tramo.</div>'}
      <button class="btn anotar" type="button" style="margin-top:6px">✎ Anotar sobre «${esc(nombre(k))}»</button>`;
    $$(".panel .vec").forEach(d => d.onclick = () => { S.arista = [k, vs[+d.dataset.i].otro]; pintarRed(); });
    conectarCitas($(".panel"), `«${nombre(k)}»`); $(".panel .anotar").onclick = () => abrirNota(`«${nombre(k)}»`);
  }
  function panelArista(r) {
    const [a, b] = S.arista, lo = Math.min(a, b), hi = Math.max(a, b), e = r.co.get(lo * 1000 + hi), ed = r.edges.find(x => x.a === lo && x.b === hi);
    const us = e ? e.us.map(i => r.US[i]) : [], base = M.BASE.edges.find(x => x.a === lo && x.b === hi);
    $(".panel").innerHTML = `<h3><mark class="a">${esc(nombre(a))}</mark> y <mark class="b">${esc(nombre(b))}</mark></h3>
      <div class="sub">${e ? `${veces(e.c)} juntos${ed ? " · " + union(ed) : ""}${base ? " · unión " + solidez(base.sol) : ""}` : "No coinciden en esta vista"}
      <span class="inv">${ed ? ` · fuerza ${ed.f.toFixed(3)} · ×${ed.l.toFixed(1)} lo esperado` : ""}${base ? ` · aparece con ${base.sol} de 3 unidades` : ""}</span></div>
      ${tira([a, b])}<div class="tit">Donde coinciden</div>${repartir(us, 6).map(u => fragmento(u.os, {[a]: "a", [b]: "b"})).join("") || '<div class="sub">—</div>'}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><button class="btn anotar" type="button">✎ Anotar</button><button class="btn volver" type="button">← volver a «${esc(nombre(a))}»</button></div>`;
    conectarCitas($(".panel"), `«${nombre(a)}» y «${nombre(b)}»`);
    $(".panel .anotar").onclick = () => abrirNota(`«${nombre(a)}» y «${nombre(b)}»`);
    $(".panel .volver").onclick = () => { S.arista = null; S.focal = a; pintarRed(); };
  }
  function tablaRed(r) {
    const solidas = new Map(M.BASE.edges.map(e => [e.a * 1000 + e.b, e.sol]));
    $(".tabla").innerHTML = `<table><tr><th>motivo A</th><th>motivo B</th><th class="num">juntos</th><th class="num">fuerza</th><th class="num">× esperado</th><th>solidez</th></tr>` +
      r.edges.map(e => `<tr><td>${esc(nombre(e.a))}</td><td>${esc(nombre(e.b))}</td><td class="num">${e.c}</td><td class="num">${e.f.toFixed(3)}</td><td class="num">${e.l.toFixed(1)}</td><td>${solidas.has(e.a * 1000 + e.b) ? solidas.get(e.a * 1000 + e.b) + "/3" : "—"}</td></tr>`).join("") + `</table>`;
  }
  function pintarFichas() {
    const orden = [...Array(K()).keys()].filter(k => M.POSM[k].length).sort((a, b) => M.POSM[b].length - M.POSM[a].length);
    const vacios = [...Array(K()).keys()].filter(k => !M.POSM[k].length), usadas = new Set();
    $(".fichas").innerHTML = orden.map(k => {
      const ini = M.oracionEn(M.POSM[k][0]), fin = M.oracionEn(M.POSM[k][M.POSM[k].length - 1]), vs = vecinos(M.BASE, k).slice(0, 3);
      const peso = u => u.os.reduce((s, i) => s + O[i].toks.filter(t => (M.W2M.get(t) || []).includes(k)).length, 0);
      const us = M.BASE.US.filter(u => u.m.includes(k)), tercios = [0, 1, 2].map(t => us.filter(u => O[u.os[0]].ini >= t * M.NTOK / 3 && O[u.os[0]].ini < (t + 1) * M.NTOK / 3));
      const elegidas = tercios.map(g => g.filter(u => !usadas.has(u.os[0])).sort((a, b) => peso(b) - peso(a) || a.os.length - b.os.length)[0]).filter(Boolean).slice(0, 2);
      elegidas.forEach(u => usadas.add(u.os[0]));
      return `<div class="tarjeta" data-ref="«${esc(nombre(k))}»"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="frase" style="color:${COLOR(k)};font-weight:600">${esc(nombre(k))}</span>
        <span class="sub num">${veces(M.POSM[k].length)}</span></div><div class="sub">Desde ${elSeg(ini.seg)} hasta ${elSeg(fin.seg)}<span class="inv"> · ${esc(S.motivos[k].f.join(", "))}</span></div>${tira([k])}
        <div class="sub">${vs.length ? "Va con " + vs.map(v => `${motHTML(v.otro)} (${union(v)})`).join(", ") : "No se une con otros motivos."}</div>${elegidas.map(u => fragmento(u.os, {[k]: "a"}, 220)).join("")}
        <button class="btn link ver" type="button" data-k="${k}">Ver en la red →</button></div>`; }).join("")
      + (vacios.length ? `<div class="aviso">Sin apariciones (revisa sus palabras en el Taller): ${vacios.map(k => esc(nombre(k))).join(", ")}</div>` : "");
    $$(".fichas .ver").forEach(b => b.onclick = () => irRed({focal: +b.dataset.k}));
    $$(".fichas .tarjeta").forEach(t => conectarCitas(t, t.dataset.ref));
  }
  const formas = s => s.split(",").map(x => norm(x.trim())).filter(Boolean);
  function pintarTaller() {
    if (!S.borrador) S.borrador = S.motivos.map(m => ({n: m.n, f: m.f.join(", "), t: m.t}));
    $(".filas").innerHTML = S.borrador.map((m, i) => { const c = M.contar(formas(m.f));
      return `<div class="fila" data-i="${i}"><i style="width:10px;height:10px;border-radius:50%;background:${S.motivos[i] && S.motivos[i].n === m.n ? COLOR(i) : GRIS}"></i>
      <input type="text" id="mot-n-${i}" class="nom" value="${esc(m.n)}" aria-label="nombre del motivo"><input type="text" id="mot-f-${i}" class="fs" value="${esc(m.f)}" aria-label="palabras del motivo">
      <span class="c ${c ? "" : "cero"}">${c}</span><button class="x" type="button" aria-label="Quitar motivo">✕</button></div>`; }).join("");
    $$(".filas .fila").forEach(f => { const i = +f.dataset.i;
      f.querySelector(".nom").oninput = ev => { S.borrador[i].n = ev.target.value; marcar(); };
      f.querySelector(".fs").oninput = ev => { S.borrador[i].f = ev.target.value; const c = M.contar(formas(ev.target.value)), sp = f.querySelector(".c"); sp.textContent = c; sp.classList.toggle("cero", !c); marcar(); };
      f.querySelector(".x").onclick = () => { S.borrador.splice(i, 1); marcar(); pintarTaller(); }; });
    const actuales = S.borrador.map(m => formas(m.f)), usado = c => c.f.some(w => actuales.some(fs => coincide(w, fs)));
    const titulos = {recurrente: "Recorren toda la obra", concentrado: "Aparecen en ráfagas", "característico": "Propias de esta obra", nombre: "Nombres"};
    $(".sugs").innerHTML = Object.entries(D.candidatos).filter(([, l]) => l.length).map(([lista, l]) => `<div class="tit">${titulos[lista] || lista}</div>` +
      l.map((c, j) => `<button type="button" class="chip ${usado(c) ? "usado" : ""}" data-l="${lista}" data-j="${j}">+ ${esc(c.n)} <span class="sub">${c.c}</span></button>`).join("")).join("");
    $$(".sugs .chip").forEach(ch => ch.onclick = () => { if (ch.classList.contains("usado")) return; const c = D.candidatos[ch.dataset.l][+ch.dataset.j];
      S.borrador.push({n: c.n, f: c.f.join(", "), t: ch.dataset.l}); marcar(); pintarTaller(); });
  }
  function marcar(txt) { const e = $(".estado"); e.hidden = false; e.textContent = txt || "Hay cambios sin aplicar."; }
  function aplicar() {
    const nuevos = S.borrador.map(m => ({n: m.n.trim() || "sin nombre", f: formas(m.f), t: m.t || "propio"})).filter(m => m.f.length);
    if (!nuevos.length) { marcar("Necesitas al menos un motivo con palabras."); return; }
    S.motivos = nuevos; S.borrador = null; S.focal = -1; S.arista = null; recalcular(); pintarTodo(); marcar(`Listo: ${K()} motivos. La lectura se recalculó.`); aviso("Motivos aplicados"); cambio();
  }
  // ======================= PERSONAJES =======================
  const PJM = opciones.personajes || null;
  let DP = null, PJ_O, PJ_U, PJ_POS, PJ_TR, PJ_CACHE = {}, relojPJ = null, REP0 = "", FAM0 = "", ORIGEN_PJ = "", INFO_PJ = null;
  const SP = {focal: -1, arista: null, tramo: -1, vista: "red", vinculo: -1};
  const KP = () => DP ? DP.lista.length : 0, HAY_ARBOL = () => !!DP && Object.keys(DP.arbol || {}).length > 0;
  const pjCol = k => DP.lista[k].g >= 0 ? PALETA[DP.lista[k].g % PALETA.length] : GRIS, pjNom = k => DP.lista[k].n;
  const pjHTML = k => `<button type="button" class="pjn" data-pj="${k}" style="color:${pjCol(k)}">${esc(pjNom(k))}</button>`;
  const ROL_TXT = {"protagonista": "el más nombrado y conectado, presente en casi toda la obra", "principal": "pesa en la red y recorre buena parte de la obra",
    "secundario": "aparece a lo largo de la obra, con menos peso", "episódico": "se concentra en una parte de la obra", "sin apariciones": "sus nombres no aparecen en el texto"};
  const relPJ = (c, a, b) => { const s = c / Math.max(1, Math.min(a, b)); return s >= .5 ? "casi siempre juntos" : s >= .25 ? "a menudo juntos" : "a veces juntos"; };
  const txtPJ = t => t.replace(/⟦(\d+)⟧/g, (_, k) => pjHTML(+k));
  function iniciarPersonajes() {
    if (!PJM) return;
    const base = D.reparto_perfil;
    if (base && base.reparto) { REP0 = base.reparto; FAM0 = base.familia || ""; ORIGEN_PJ = `Reparto y familia del perfil «${base.perfil || D.titulo}».`; }
    else { const p = PJM.proponer(D); REP0 = p.texto; FAM0 = ""; INFO_PJ = p.info;
      ORIGEN_PJ = "Reparto propuesto automáticamente a partir de los nombres propios del texto" + (D.teatro ? " y de los hablantes." : "."); }
    S.reparto = est.reparto != null ? est.reparto : REP0; S.familia = est.familia != null ? est.familia : FAM0;
    calcularPJ();
  }
  function calcularPJ() {
    try { DP = PJM.calcular(D, S.reparto, S.familia); } catch (e) { console.error(e); DP = null; }
    PJ_CACHE = {}; SP.focal = -1; SP.arista = null; SP.vinculo = -1; if (SP.vista === "arbol" && !HAY_ARBOL()) SP.vista = "red";
    if (!DP) return;
    PJ_O = O.map(() => []);
    DP.M.forEach(([o, a, b, k, amb]) => PJ_O[o].push({a, b, k, amb}));
    const VOZ = {}; Object.entries(DP.voz || {}).forEach(([v, k]) => VOZ[D.voces[+v]] = k);
    PJ_POS = DP.lista.map(() => []);
    O.forEach(o => PJ_O[o.i].forEach(m => PJ_POS[m.k].push(o.ini)));
    const visto = new Set();
    O.forEach(o => { const k = VOZ[o.voz]; if (k === undefined) return; const c = o.par + ":" + k; if (!visto.has(c)) { visto.add(c); PJ_POS[k].push(o.ini); } });
    PJ_POS.forEach(p => p.sort((x, y) => x - y));
    PJ_TR = PJ_POS.map(ps => { const c = new Array(T).fill(0); ps.forEach(p => c[M.oracionEn(p).tr]++); return c; });
    PJ_U = DP.P.map(([a, b]) => { const s = new Set(), os = [];
      for (let i = a; i <= b; i++) { os.push(i); PJ_O[i].forEach(m => s.add(m.k)); const k = VOZ[O[i].voz]; if (k !== undefined) s.add(k); }
      return {os, tr: O[a].tr, s: [...s]}; });
  }
  function redPJ(tr) {
    if (PJ_CACHE[tr]) return PJ_CACHE[tr];
    const US = PJ_U.filter(u => tr < 0 || u.tr === tr), nA = new Array(KP()).fill(0), co = new Map();
    US.forEach((u, ui) => { const m = u.s; m.forEach(a => nA[a]++);
      for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) {
        const a = Math.min(m[i], m[j]), b = Math.max(m[i], m[j]), key = a * 1000 + b;
        let e = co.get(key); if (!e) { e = {a, b, c: 0, us: []}; co.set(key, e); } e.c++; e.us.push(ui); } });
    const minJ = tr < 0 ? DP.minJ : 2;
    const edges = [...co.values()].filter(e => e.c >= minJ).sort((x, y) => y.c - x.c).slice(0, tr < 0 ? 80 : 50);
    return PJ_CACHE[tr] = {US, nA, co, edges};
  }
  const pesoPJ = (k, tr) => tr < 0 ? PJ_POS[k].length : PJ_TR[k][tr];
  function tiraPJ(ks, alto = 16) {
    const W = 600, H = ks.length * alto + 14;
    let s = `<svg class="tira" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Apariciones a lo largo de la obra"><rect x="0" y="0" width="${W}" height="${H - 12}" fill="var(--papel)"/>`;
    TR_INI.slice(1).forEach(p => s += `<line x1="${p / M.NTOK * W}" x2="${p / M.NTOK * W}" y1="0" y2="${H - 12}" stroke="var(--linea)" stroke-width="2"/>`);
    ks.forEach((k, r) => PJ_POS[k].forEach(p => s += `<rect x="${(p / M.NTOK * W).toFixed(1)}" y="${r * alto + 2}" width="1.6" height="${alto - 4}" fill="${pjCol(k)}"/>`));
    return s + `<text x="0" y="${H - 1}" font-size="10" fill="var(--gris)">inicio</text><text x="${W}" y="${H - 1}" font-size="10" fill="var(--gris)" text-anchor="end">final</text></svg>`;
  }
  function fragmentoPJ(u, marcas, largo = 320, marcasM = null) {
    let tx = ""; const spans = [], offs = [];
    u.os.forEach(i => { if (tx) tx += " "; offs.push([tx.length, i]); PJ_O[i].forEach(m => spans.push([tx.length + m.a, tx.length + m.b, m.k])); tx += O[i].tx; });
    if (marcasM) { const rx = new RegExp(RX_TOK.source, "g"); let mm;
      while ((mm = rx.exec(tx))) { const ids = M.W2M.get(norm(mm[0])), c = ids && ids.find(x => x in marcasM);
        if (c !== undefined && !spans.some(z => z[0] <= mm.index && mm.index < z[1])) spans.push([mm.index, mm.index + mm[0].length, "m" + c]); }
      spans.sort((x, y) => x[0] - y[0]); Object.entries(marcasM).forEach(([m, cl]) => marcas["m" + m] = cl); }
    const hits = spans.filter(x => x[2] in marcas), vistos = new Set(), primeros = [];
    hits.forEach(h => { if (!vistos.has(h[2])) { vistos.add(h[2]); primeros.push(h); } });
    const [a, b] = ventana(tx, primeros, largo); let out = "", p = a;
    spans.forEach(([s0, e0, k]) => { if (s0 < a || e0 > b || s0 < p) return;
      out += esc(tx.slice(p, s0)) + `<mark class="${k in marcas ? marcas[k] : "c"}">${esc(tx.slice(s0, e0))}</mark>`; p = e0; });
    out += esc(tx.slice(p, b));
    const ancla = primeros.length ? primeros[0][0] : a; let o0 = O[u.os[0]];
    offs.forEach(([off, i]) => { if (off <= ancla) o0 = O[i]; });
    const voz = D.teatro ? o0.voz : (o0.voz === "diálogo" ? "diálogo" : ""), lug = `${lugarSeg(o0.seg)} · ${pagina(o0.pag)}${voz ? " · " + voz : ""}`;
    const plano = (a > 0 ? "…" : "") + tx.slice(a, b).trim() + (b < tx.length ? "…" : "");
    return `<div class="cita"><span class="lug">${esc(lug)}<button class="mas" type="button" data-cita="${esc(JSON.stringify({tx: plano, lug}))}">＋ citar</button></span>${a > 0 ? "…" : ""}${out.trim()}${b < tx.length ? "…" : ""}</div>`;
  }
  const nombraA = (u, k) => u.os.some(i => PJ_O[i].some(m => m.k === k));
  function irPJ(h) {
    SP.tramo = h.tramo !== undefined ? h.tramo : -1; SP.focal = h.focal !== undefined ? h.focal : -1; SP.arista = h.arista || null; SP.vinculo = -1;
    SP.vista = h.vista === "arbol" && HAY_ARBOL() ? "arbol" : "red";
    if (h.arista) { SP.focal = h.arista[0];
      if (SP.vista === "arbol") { const i = DP.fam.findIndex(f => (f.a === h.arista[0] && f.b === h.arista[1]) || (f.a === h.arista[1] && f.b === h.arista[0])); if (i >= 0) { SP.vinculo = i; SP.arista = null; } } }
    mostrar("personajes");
  }
  function enlazarPJ(cont) { cont.querySelectorAll(".pjn").forEach(x => x.onclick = ev => { ev.stopPropagation(); SP.focal = +x.dataset.pj; SP.arista = null; SP.vinculo = -1; pintarPersonajes(); }); }
  function pintarPersonajes() {
    if (!DP) { $(".panelpj").innerHTML = `<div class="aviso">No se pudo armar la red de personajes con este reparto. Revisa «Corregir el reparto y la familia».</div>`; pintarEditorPJ(); return; }
    const r = redPJ(SP.tramo), svg = $("svg.redpj");
    $("section[data-v=personajes] .redgrid").classList.toggle("ancho", SP.vista === "arbol");
    $(".red-lienzo").hidden = SP.vista !== "red"; $(".arbol-lienzo").hidden = SP.vista !== "arbol";
    $("section[data-v=personajes] .vpjs").hidden = !HAY_ARBOL(); $$(".vpj").forEach(b => b.setAttribute("aria-pressed", b.dataset.vpj === SP.vista));
    $(".hallpj").innerHTML = DP.hall.map((h, i) => `<div class="tarjeta"><div class="etq">${esc(h.etq)}</div><div class="frase">${txtPJ(h.txt)}</div><button class="btn link irpj" type="button" data-i="${i}">Ver →</button></div>`).join("")
      || `<div class="aviso">Con este reparto no aparecen patrones claros.</div>`;
    $$(".hallpj .irpj").forEach(b => b.onclick = () => irPJ(DP.hall[+b.dataset.i].ir)); enlazarPJ($(".hallpj"));
    $(".pj-tramo").max = T; $(".pj-tramo").value = SP.tramo + 1;
    $(".pj-vtramo").textContent = SP.tramo < 0 ? "Toda la obra" : `${SP.tramo + 1}/${T} · ${D.tramos[SP.tramo]}`;
    $(".s-pj").innerHTML = `<option value="-1">(ninguno)</option>` + [...Array(KP()).keys()].filter(k => PJ_POS[k].length).sort((a, b) => pjNom(a).localeCompare(pjNom(b), "es")).map(k => `<option value="${k}">${esc(pjNom(k))}</option>`).join("");
    $(".s-pj").value = SP.focal;
    const cmax = Math.max(1, ...r.edges.map(e => e.c)), pmax = Math.max(1, ...DP.lista.map((_, k) => pesoPJ(k, SP.tramo)));
    const veci = new Set(SP.focal >= 0 ? r.edges.filter(e => e.a === SP.focal || e.b === SP.focal).flatMap(e => [e.a, e.b]).concat([SP.focal]) : []);
    const P = k => DP.lista[k].xy ? [70 + 860 * DP.lista[k].xy[0], 44 + 560 * DP.lista[k].xy[1]] : null;
    let s = `<rect x="0" y="0" width="1000" height="640" fill="transparent" class="fondo"/>`;
    r.edges.forEach((e, idx) => { const pa = P(e.a), pb = P(e.b); if (!pa || !pb) return;
      const toca = SP.focal < 0 || e.a === SP.focal || e.b === SP.focal, sel = SP.arista && ((SP.arista[0] === e.a && SP.arista[1] === e.b) || (SP.arista[0] === e.b && SP.arista[1] === e.a));
      const col = sel ? "var(--naranja)" : (DP.lista[e.a].g >= 0 && DP.lista[e.a].g === DP.lista[e.b].g ? pjCol(e.a) : GRIS);
      s += `<line data-e="${idx}" x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}" stroke="${col}" stroke-linecap="round" stroke-width="${(1.2 + 10 * e.c / cmax).toFixed(1)}"
        stroke-opacity="${toca ? (SP.focal >= 0 ? .9 : .5) : .06}"><title>${esc(pjNom(e.a))} y ${esc(pjNom(e.b))}: ${relPJ(e.c, r.nA[e.a], r.nA[e.b])} (${e.c} pasajes)</title></line>`; });
    const etiquetas = [];
    [...Array(KP()).keys()].sort((a, b) => pesoPJ(a, SP.tramo) - pesoPJ(b, SP.tramo)).forEach(k => { const p = P(k); if (!p) return;
      const w = pesoPJ(k, SP.tramo), rad = w ? 6 + 22 * Math.sqrt(w / pmax) : 4, L = DP.lista[k], prot = L.rol === "protagonista", op = SP.focal >= 0 && !veci.has(k) ? .15 : (w ? 1 : .3);
      s += `<g class="n" data-k="${k}" opacity="${op}"><circle cx="${p[0]}" cy="${p[1]}" r="${rad.toFixed(1)}" pointer-events="all" fill="${w ? pjCol(k) : "var(--hoja)"}"
        stroke="${k === SP.focal || prot ? "var(--tinta)" : (w ? "var(--hoja)" : pjCol(k))}" stroke-width="${k === SP.focal ? 4 : prot ? 3 : 1.5}"/><title>${esc(L.n)} · ${L.rol}: ${veces(w)} en esta vista</title></g>`;
      etiquetas.push({k, x: p[0], y: p[1] - rad - 6, w, txt: L.n + (L.pu ? " ⇄" : ""), op}); });
    const puestas = [];
    etiquetas.sort((a, b) => (b.k === SP.focal) - (a.k === SP.focal) || (veci.has(b.k) - veci.has(a.k)) || b.w - a.w).forEach(e => {
      const ancho = e.txt.length * 7.2, caja = [e.x - ancho / 2, e.y - 13, e.x + ancho / 2, e.y + 3];
      if (puestas.some(q => caja[0] < q[2] && caja[2] > q[0] && caja[1] < q[3] && caja[3] > q[1])) return;
      puestas.push(caja); s += `<text x="${e.x}" y="${e.y}" text-anchor="middle" opacity="${e.op}">${esc(e.txt)}</text>`; });
    svg.innerHTML = s;
    svg.querySelector(".fondo").onclick = () => { SP.focal = -1; SP.arista = null; SP.vinculo = -1; pintarPersonajes(); };
    svg.querySelectorAll("g.n").forEach(g => g.onclick = ev => { ev.stopPropagation(); const k = +g.dataset.k; SP.focal = SP.focal === k ? -1 : k; SP.arista = null; SP.vinculo = -1; pintarPersonajes(); });
    svg.querySelectorAll("line[data-e]").forEach(l => l.onclick = ev => { ev.stopPropagation(); const e = r.edges[+l.dataset.e]; SP.arista = [e.a, e.b]; SP.vinculo = -1; pintarPersonajes(); });
    const grupos = [...new Set(DP.lista.map(p => p.g).filter(g => g >= 0))].sort((a, b) => a - b);
    if (SP.vista === "arbol") $(".leypj").innerHTML = `<span><i style="background:#E07B24;border-radius:0;height:3px;width:16px"></i>pareja (punteada: no es matrimonio)</span><span><i style="background:${GRIS};border-radius:0;height:2px;width:16px"></i>padres e hijos</span><span>gris punteado: el texto no lo dice en una frase · clic en una línea → la cita</span>${SP.tramo >= 0 ? "<span>huecos: no aparecen en este tramo</span>" : ""}`;
    else $(".leypj").innerHTML = grupos.map(g => { const ns = DP.lista.map((p, k) => p.g === g ? k : -1).filter(k => k >= 0).sort((a, b) => DP.lista[b].s - DP.lista[a].s);
      return `<span><i style="background:${PALETA[g % PALETA.length]}"></i>${ns.slice(0, 3).map(k => esc(pjNom(k))).join(", ")}${ns.length > 3 ? "…" : ""}</span>`; }).join("")
      + `<span>borde oscuro: protagonista · ⇄ puente · tamaño: cuánto se le nombra${D.teatro ? " o habla" : ""}</span>`;
    if (SP.vista === "arbol") pintarArbol();
    if (SP.vinculo >= 0) panelVinculo(SP.vinculo); else if (SP.arista) panelAristaPJ(r); else if (SP.focal >= 0) panelPJ(r); else panelResumenPJ(r);
    pintarCuando(); pintarEditorPJ();
    if (S.inv) tablaPJ();
  }
  function panelResumenPJ(r) {
    const roles = ["protagonista", "principal", "secundario", "episódico", "sin apariciones"], top = r.edges.slice(0, 8);
    const amb = DP.amb && DP.amb.res ? `<div class="aviso">Hay nombres compartidos (${DP.amb.formas.slice(0, 4).map(f => "«" + esc(f[0]) + "»").join(", ")}): ${DP.amb.res} menciones se asignaron por contexto${DP.amb.sin ? ` y ${DP.amb.sin} quedaron sin asignar` : ""}. Revisa las citas de esos personajes.</div>` : "";
    $(".panelpj").innerHTML = `<h3>${SP.tramo < 0 ? "El reparto" : esc(D.tramos[SP.tramo])}</h3>
      <div class="sub">${SP.tramo < 0 ? "Haz clic en un personaje para ver con quién se relaciona y dónde aparece; o en una línea para leer los pasajes que comparten." : "Solo este tramo. Los personajes quedan en su lugar para comparar; los que no aparecen se ven huecos."}</div>
      ${roles.filter(ro => DP.lista.some(p => p.rol === ro)).map(ro => `<div class="tit">${ro}</div><div class="sub" style="margin-bottom:4px">${ROL_TXT[ro]}</div>
        <div>${DP.lista.map((p, k) => p.rol === ro ? k : -1).filter(k => k >= 0).sort((a, b) => DP.lista[b].s - DP.lista[a].s).map(k => pjHTML(k) + (DP.lista[k].pu ? " ⇄" : "")).join(", ")}</div>`).join("")}
      <div class="tit">Las relaciones más frecuentes${SP.tramo < 0 ? "" : " aquí"}</div>${top.length ? top.map((e, i) => `<div class="vec" data-i="${i}" role="button" tabindex="0"><span>${pjHTML(e.a)} y ${pjHTML(e.b)}</span><span>${relPJ(e.c, r.nA[e.a], r.nA[e.b])}<span class="inv"> · ${e.c}</span></span></div>`).join("") : '<div class="sub">Sin relaciones en esta vista.</div>'}
      ${amb}${HAY_ARBOL() ? `<div class="aviso">Hay un <b>árbol de familia</b> con ${DP.fam.filter(f => f.t !== "otro").length} vínculos (${DP.fam.filter(f => f.c.length).length} con una frase del texto). Ábrelo con el botón «Árbol de familia».</div>` : ""}`;
    $$(".panelpj .vec").forEach(d => d.onclick = ev => { if (ev.target.closest(".pjn")) return; const e = top[+d.dataset.i]; SP.arista = [e.a, e.b]; pintarPersonajes(); });
    enlazarPJ($(".panelpj"));
  }
  function motivosDe(k) {
    if (!K()) return [];
    const base = new Map(), c = new Map(); let nk = 0;
    PJ_U.forEach(u => { const ms = new Set(); u.os.forEach(i => (O[i].m || []).forEach(m => ms.add(m)));
      ms.forEach(m => base.set(m, (base.get(m) || 0) + 1));
      if (u.s.includes(k)) { nk++; ms.forEach(m => c.set(m, (c.get(m) || 0) + 1)); } });
    return [...c.entries()].map(([m, n]) => ({m, n, l: n / (nk * base.get(m) / PJ_U.length)}))
      .filter(x => x.n >= 3 && x.l >= 1.3).sort((a, b) => b.l * Math.sqrt(b.n) - a.l * Math.sqrt(a.n)).slice(0, 6);
  }
  const refsIA = t => esc(t || "").replace(/\[(\d+)\]/g, (_, n) => `<span class="ref" data-n="${n}">[${n}]</span>`);
  function panelPJ(r) {
    const k = SP.focal, L = DP.lista[k], vs = r.edges.filter(e => e.a === k || e.b === k).map(e => ({...e, otro: e.a === k ? e.b : e.a}));
    let us = r.US.filter(u => u.s.includes(k)); const conNombre = us.filter(u => nombraA(u, k)); if (conNombre.length >= 3) us = conNombre;
    const fam = DP.fam.map((f, i) => ({...f, i})).filter(f => f.a === k || f.b === k), epi = (DP.epi && DP.epi[k]) || [], mot = motivosDe(k), ia = DP.ia && DP.ia[k];
    $(".panelpj").innerHTML = `<h3 style="color:${pjCol(k)}">${esc(L.n)}<span class="rol">${L.rol}${L.pu ? " · puente ⇄" : ""}</span></h3>
      <div class="sub">${ROL_TXT[L.rol]}${L.pu ? "; además une grupos de personajes que casi no se tocan" : ""}.</div>
      <div class="sub" style="margin-top:4px">${veces(L.m)} nombrado${D.teatro ? ` · ${L.h} parlamentos` : ""} · en ${L.u} pasajes${SP.tramo >= 0 ? ` · ${veces(pesoPJ(k, SP.tramo))} en este tramo` : ""}<span class="inv"> · formas: ${esc(L.f.join(", "))} · intermediación ${L.b}</span></div>
      ${L.amb ? `<div class="aviso">${L.amb} de sus menciones vienen de un nombre compartido y se le asignaron por contexto: revisa las citas.</div>` : ""}
      ${tiraPJ([k])}
      ${epi.length ? `<div class="tit">Cómo lo llama la obra</div><div class="chips-epi">${epi.map((e, i) => `<button type="button" class="chip" data-epi="${i}">«${esc(e[0])}» <span class="sub">×${e[1]} · ${e[2] === e[3] ? elSeg(e[2]) : `${lugarSeg(e[2])}–${D.segmentos[e[3]].e}`}</span></button>`).join("")}</div><div class="epi-citas"></div>` : ""}
      ${fam.length ? `<div class="tit">Familia y vínculos</div>${fam.map(f => `<div class="famrow" data-f="${f.i}" role="button" tabindex="0">${pjHTML(f.a)} <span class="sub">${esc(f.e)} de</span> ${pjHTML(f.b)} <span class="sub">${f.c.length ? "✔ con cita" : "· sin frase"}</span></div>`).join("")}${HAY_ARBOL() && SP.vista !== "arbol" ? '<button class="btn link verarbol" type="button" style="margin:4px 6px">Ver en el árbol →</button>' : ""}` : ""}
      <div class="tit">Se relaciona con</div>
      ${vs.length ? vs.slice(0, 10).map((v, i) => `<div class="vec" data-i="${i}" role="button" tabindex="0"><span>${pjHTML(v.otro)}</span><span>${relPJ(v.c, r.nA[k], r.nA[v.otro])}<span class="inv"> · ${v.c} pasajes</span></span></div>`).join("") : '<div class="sub">No coincide con otros personajes en esta vista.</div>'}
      ${mot.length ? `<div class="tit">Motivos que lo acompañan</div><div class="sub" style="margin-bottom:4px">Motivos que aparecen en sus pasajes más de lo esperado: material para pensar su papel simbólico.</div><div class="chips-mot">${mot.map((x, i) => `<button type="button" class="chip" data-mot="${i}">${motHTML(x.m)} <span class="sub">${x.l >= 2.5 ? "muy ligado" : x.l >= 1.6 ? "ligado" : "algo ligado"}<span class="inv"> · ${x.n} · ×${x.l.toFixed(1)}</span></span></button>`).join("")}</div><div class="mot-citas"></div>` : ""}
      ${ia ? `<div class="tit">Lectura propuesta por la IA <span class="sub" style="text-transform:none;letter-spacing:0">(hipótesis: compruébala en las citas)</span></div><div class="ia"><p><b>En la trama:</b> ${refsIA(ia.literal)}</p><p><b>Simbólicamente:</b> ${refsIA(ia.simbolico)}</p>${ia.cambia ? `<p><b>¿Cambia?</b> ${refsIA(ia.cambia)}</p>` : ""}</div><div class="ia-citas"></div>` : ""}
      <div class="tit">Dónde aparece</div>${repartir(us, 4).map(u => fragmentoPJ(u, {[k]: "a"})).join("") || '<div class="sub">No aparece en este tramo.</div>'}
      <button class="btn anotar" type="button" style="margin-top:6px">✎ Anotar sobre ${esc(L.n)}</button>`;
    $$(".panelpj .vec").forEach(d => d.onclick = ev => { if (ev.target.closest(".pjn")) return; SP.arista = [k, vs[+d.dataset.i].otro]; pintarPersonajes(); });
    $$(".panelpj .chips-epi .chip").forEach(c => c.onclick = () => { const e = epi[+c.dataset.epi], on = !c.classList.contains("on");
      $$(".panelpj .chips-epi .chip").forEach(x => x.classList.remove("on")); c.classList.toggle("on", on);
      $(".panelpj .epi-citas").innerHTML = on ? e[4].map(i => fragmentoPJ({os: [i]}, {[k]: "a"}, 260)).join("") : ""; conectarCitas($(".panelpj .epi-citas"), L.n); });
    $$(".panelpj .famrow").forEach(d => d.onclick = ev => { if (ev.target.closest(".pjn")) return; SP.vinculo = +d.dataset.f; pintarPersonajes(); });
    const va = $(".panelpj .verarbol"); if (va) va.onclick = () => { SP.vista = "arbol"; pintarPersonajes(); };
    $$(".panelpj .chips-mot .chip").forEach(c => c.onclick = () => { const x = mot[+c.dataset.mot], on = !c.classList.contains("on");
      $$(".panelpj .chips-mot .chip").forEach(y => y.classList.remove("on")); c.classList.toggle("on", on);
      const cand = [], conK = [];
      PJ_U.forEach(u => { if (!u.s.includes(k)) return; u.os.forEach(i => { if ((O[i].m || []).includes(x.m)) { cand.push(i); if (PJ_O[i].some(z => z.k === k)) conK.push(i); } }); });
      $(".panelpj .mot-citas").innerHTML = on ? repartir(conK.length >= 3 ? conK : cand, 3).map(i => fragmentoPJ({os: [i]}, {[k]: "a"}, 360, {[x.m]: "b"})).join("") : "";
      conectarCitas($(".panelpj .mot-citas"), `${L.n} y «${nombre(x.m)}»`); });
    $$(".panelpj .ia .ref").forEach(rf => rf.onclick = () => { const c = (ia.citas || []).find(z => z[0] === +rf.dataset.n); if (!c) return;
      $(".panelpj .ia-citas").innerHTML = fragmentoPJ({os: [c[1]]}, {[k]: "a"}, 400); conectarCitas($(".panelpj .ia-citas"), L.n); });
    enlazarPJ($(".panelpj")); conectarCitas($(".panelpj"), L.n);
    $(".panelpj .anotar").onclick = () => abrirNota(L.n);
  }
  function panelAristaPJ(r) {
    const [a, b] = SP.arista, e = r.co.get(Math.min(a, b) * 1000 + Math.max(a, b));
    const us = e ? e.us.map(i => r.US[i]) : [], ambos = us.filter(u => nombraA(u, a) && nombraA(u, b)), ref = `${pjNom(a)} y ${pjNom(b)}`;
    $(".panelpj").innerHTML = `<h3><mark class="a">${esc(pjNom(a))}</mark> y <mark class="b">${esc(pjNom(b))}</mark></h3>
      <div class="sub">${e ? `${relPJ(e.c, r.nA[a], r.nA[b])}: comparten ${e.c} pasajes${SP.tramo >= 0 ? " en este tramo" : ""}` : "No coinciden en esta vista"}</div>
      ${tiraPJ([a, b])}<div class="tit">Pasajes que comparten</div>${repartir(ambos.length >= 3 ? ambos : us, 6).map(u => fragmentoPJ(u, {[a]: "a", [b]: "b"})).join("") || '<div class="sub">—</div>'}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><button class="btn anotar" type="button">✎ Anotar</button><button class="btn volver" type="button">← volver a ${esc(pjNom(a))}</button></div>`;
    conectarCitas($(".panelpj"), ref);
    $(".panelpj .anotar").onclick = () => abrirNota(ref);
    $(".panelpj .volver").onclick = () => { SP.arista = null; SP.focal = a; pintarPersonajes(); };
  }
  function pintarArbol() {
    const A = DP.arbol, ks = Object.keys(A).map(Number), svg = $("svg.arbolpj");
    const maxL = Math.min(22, Math.max(...ks.map(k => pjNom(k).length))), U = Math.max(118, maxL * 6.9 + 46), FILA = 88;
    const X = k => 64 + U / 2 + A[k][1] * U, Y = k => 42 + A[k][0] * FILA;
    const W = Math.max(...ks.map(X)) + U / 2 + 20, H = Math.max(...ks.map(Y)) + 46, cerca = new Set();
    if (SP.focal >= 0) { cerca.add(SP.focal); DP.fam.forEach(f => { if (f.a === SP.focal) cerca.add(f.b); if (f.b === SP.focal) cerca.add(f.a); }); }
    const vf = SP.vinculo >= 0 ? DP.fam[SP.vinculo] : null; if (vf) { cerca.add(vf.a); cerca.add(vf.b); }
    let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="transparent" class="fondo"/>`;
    [...new Set(ks.map(k => A[k][0]))].sort((a, b) => a - b).forEach(g => s += `<text x="10" y="${42 + g * FILA + 4}" style="font-size:11px;fill:var(--gris)">${g + 1}.ª gen.</text>`);
    const grupos = new Map();
    DP.fam.forEach((f, i) => { if ((f.t === "hijo" || f.t === "adoptivo") && f.a in A && f.b in A) { if (!grupos.has(f.a)) grupos.set(f.a, []); grupos.get(f.a).push(i); } });
    const porPadres = new Map();
    grupos.forEach((is, c) => { const key = is.map(i => DP.fam[i].b).sort((a, b) => a - b).join(","); if (!porPadres.has(key)) porPadres.set(key, []); porPadres.get(key).push([c, is]); });
    porPadres.forEach((cs, key) => { const ps = key.split(",").map(Number), ax = ps.reduce((t, p) => t + X(p), 0) / ps.length, jy = Math.max(...ps.map(Y)) + 22;
      const by = Math.min(...cs.map(([c]) => Y(c))) - 22, xs = cs.map(([c]) => X(c)).concat([ax]);
      const op = cerca.size && !ps.some(p => cerca.has(p)) && !cs.some(([c]) => cerca.has(c)) ? .2 : 1;
      const d = ps.map(p => `M${X(p)},${Y(p) + 13} V${jy}`).join(" ") + (ps.length > 1 ? ` M${Math.min(...ps.map(X))},${jy} H${Math.max(...ps.map(X))}` : "");
      s += `<path d="${d} M${ax},${jy} V${by} M${Math.min(...xs)},${by} H${Math.max(...xs)}" fill="none" stroke="${GRIS}" stroke-width="1.6" opacity="${op}"/>`;
      cs.forEach(([c, is]) => { const i = is.find(j => DP.fam[j].c.length) ?? is[0], f = DP.fam[i], sel = vf && is.includes(SP.vinculo);
        const sin = is.every(j => !DP.fam[j].c.length), adop = is.some(j => DP.fam[j].t === "adoptivo");
        s += `<line class="v" data-f="${i}" x1="${X(c)}" y1="${by}" x2="${X(c)}" y2="${Y(c) - 13}" stroke="${sel ? "var(--naranja)" : GRIS}" stroke-width="${sel ? 4 : 2.2}" ${sin || adop ? 'stroke-dasharray="3 4"' : ""} opacity="${cerca.size && !cerca.has(c) ? .2 : 1}"><title>${esc(pjNom(c))}: ${esc(f.e)} de ${is.map(j => esc(pjNom(DP.fam[j].b))).join(" y ")}${sin ? " (sin frase en el texto)" : ""}</title></line>`; }); });
    DP.fam.forEach((f, i) => { if (!(f.t === "pareja" || f.t === "amante") || !(f.a in A) || !(f.b in A)) return;
      const x1 = X(f.a), y1 = Y(f.a), x2 = X(f.b), y2 = Y(f.b), sel = SP.vinculo === i, op = cerca.size && !(cerca.has(f.a) && cerca.has(f.b)) ? .2 : 1;
      const est = `stroke="${sel ? "var(--naranja)" : f.c.length ? "#E07B24" : GRIS}" stroke-width="${sel ? 4.5 : 2.6}" ${f.t === "amante" ? 'stroke-dasharray="6 5"' : (!f.c.length ? 'stroke-dasharray="3 4"' : "")} fill="none" opacity="${op}"`;
      const d = y1 === y2 && Math.abs(A[f.a][1] - A[f.b][1]) <= 1.05 ? `M${x1},${y1} L${x2},${y2}` : y1 === y2 ? `M${x1},${y1 - 13} C${x1},${y1 - 44} ${x2},${y2 - 44} ${x2},${y2 - 13}` : `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
      s += `<path class="v" data-f="${i}" d="${d}" ${est}><title>${esc(pjNom(f.a))}: ${esc(f.e)} de ${esc(pjNom(f.b))}</title></path>`; });
    ks.forEach(k => { const nm = pjNom(k).length > 22 ? pjNom(k).slice(0, 21) + "…" : pjNom(k), w = Math.max(64, nm.length * 6.9 + 16), L = DP.lista[k];
      const presente = SP.tramo < 0 || pesoPJ(k, SP.tramo) > 0, op = cerca.size && !cerca.has(k) ? .25 : presente ? 1 : .45;
      s += `<g class="n" data-k="${k}" opacity="${op}"><rect x="${X(k) - w / 2}" y="${Y(k) - 13}" width="${w}" height="26" rx="13" fill="${presente ? "var(--hoja)" : "var(--papel)"}" stroke="${pjCol(k)}" stroke-width="${k === SP.focal ? 4 : L.rol === "protagonista" ? 3 : 1.6}" ${presente ? "" : 'stroke-dasharray="3 3"'}/>
        <text x="${X(k)}" y="${Y(k) + 4.5}" text-anchor="middle" font-weight="${k === SP.focal || L.rol === "protagonista" ? 700 : 400}">${esc(nm)}</text><title>${esc(L.n)} · ${L.rol}${SP.tramo >= 0 ? ` · ${veces(pesoPJ(k, SP.tramo))} en este tramo` : ""}</title></g>`; });
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H); svg.innerHTML = s;
    const alPanel = () => { const pn = $(".panelpj"); if (pn.getBoundingClientRect().top > window.innerHeight - 120) pn.scrollIntoView({behavior: "smooth", block: "start"}); };
    svg.querySelector(".fondo").onclick = () => { SP.focal = -1; SP.vinculo = -1; SP.arista = null; pintarPersonajes(); };
    svg.querySelectorAll("g.n").forEach(g => g.onclick = ev => { ev.stopPropagation(); const k = +g.dataset.k; SP.focal = SP.focal === k ? -1 : k; SP.vinculo = -1; SP.arista = null; pintarPersonajes(); alPanel(); });
    svg.querySelectorAll(".v").forEach(l => l.onclick = ev => { ev.stopPropagation(); SP.vinculo = +l.dataset.f; SP.arista = null; pintarPersonajes(); alPanel(); });
    const cont = $(".arbol-lienzo"); if (SP.focal >= 0 && SP.focal in A && W > cont.clientWidth) cont.scrollLeft = Math.max(0, X(SP.focal) - cont.clientWidth / 2);
  }
  function panelVinculo(i) {
    const f = DP.fam[i], a = f.a, b = f.b, ref = `${pjNom(a)} y ${pjNom(b)} (${f.e})`;
    let extra = "";
    if (!f.c.length) { const r0 = redPJ(-1), e = r0.co.get(Math.min(a, b) * 1000 + Math.max(a, b)), us = e ? e.us.map(j => r0.US[j]).filter(u => nombraA(u, a) && nombraA(u, b)) : [];
      extra = `<div class="aviso">No encontré una frase que lo diga con una palabra de parentesco junto a los dos nombres. Puede estar dicho con pronombres, apodos o a lo largo de varias frases.</div>` +
        (us.length ? `<div class="tit">Pasajes donde aparecen juntos</div>` + repartir(us, 3).map(u => fragmentoPJ(u, {[a]: "a", [b]: "b"})).join("") : `<div class="sub">Tampoco coinciden en un mismo pasaje.</div>`); }
    $(".panelpj").innerHTML = `<h3 style="font-size:20px">${pjHTML(a)} <span class="sub" style="font-family:var(--f-ui)">${esc(f.e)} de</span> ${pjHTML(b)}</h3>
      <div class="sub">${DP.fam_origen === "escrita" ? "Vínculo del reparto (del perfil o escrito por ti en «Corregir el reparto y la familia»)." : "Vínculo propuesto a partir de una frase del texto."}</div>
      ${f.c.length ? `<div class="tit">Dónde lo dice el texto</div>${f.c.map(o => fragmentoPJ({os: [o]}, {[a]: "a", [b]: "b"}, 380)).join("")}` : extra}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn anotar" type="button">✎ Anotar</button><button class="btn fa" type="button">Ficha: ${esc(pjNom(a))}</button><button class="btn fb" type="button">Ficha: ${esc(pjNom(b))}</button></div>`;
    enlazarPJ($(".panelpj")); conectarCitas($(".panelpj"), ref);
    $(".panelpj .anotar").onclick = () => abrirNota(ref);
    $(".panelpj .fa").onclick = () => { SP.vinculo = -1; SP.focal = a; pintarPersonajes(); };
    $(".panelpj .fb").onclick = () => { SP.vinculo = -1; SP.focal = b; pintarPersonajes(); };
  }
  function pintarCuando() {
    const ks = [...Array(KP()).keys()].filter(k => PJ_POS[k].length).sort((a, b) => PJ_POS[a][0] - PJ_POS[b][0]);
    const fila = 19, izq = 190, W = 1000 - izq - 6, H = ks.length * fila + 18, svg = $("svg.cuando");
    svg.setAttribute("viewBox", `0 0 1000 ${H}`);
    let s = "";
    if (SP.tramo >= 0) { const x0 = TR_INI[SP.tramo] / M.NTOK, x1 = (TR_INI[SP.tramo] + TR_LARGO[SP.tramo]) / M.NTOK; s += `<rect x="${izq + W * x0}" y="0" width="${W * (x1 - x0)}" height="${H - 16}" fill="var(--naranja)" opacity=".08"/>`; }
    TR_INI.slice(1).forEach(p => s += `<line x1="${izq + W * p / M.NTOK}" x2="${izq + W * p / M.NTOK}" y1="0" y2="${H - 16}" stroke="var(--linea)" stroke-width="1.5"/>`);
    ks.forEach((k, r) => { const y = r * fila, ps = PJ_POS[k], foco = SP.focal < 0 || SP.focal === k;
      s += `<g class="fila-pj" data-k="${k}" opacity="${foco ? 1 : .35}"><rect class="fondo-fila" x="0" y="${y}" width="1000" height="${fila}" fill="transparent"/>
        <text x="${izq - 10}" y="${y + 13}" text-anchor="end" font-weight="${SP.focal === k ? 700 : 400}">${esc(pjNom(k))}</text>
        <rect x="${izq + W * ps[0] / M.NTOK}" y="${y + 8.5}" width="${Math.max(1, W * (ps[ps.length - 1] - ps[0]) / M.NTOK)}" height="2" fill="${pjCol(k)}" opacity=".35"/>`;
      const paso = Math.max(1, Math.floor(ps.length / 500));
      for (let i = 0; i < ps.length; i += paso) s += `<rect x="${(izq + W * ps[i] / M.NTOK).toFixed(1)}" y="${y + 3}" width="1.6" height="13" fill="${pjCol(k)}"/>`;
      s += `</g>`; });
    s += `<text x="${izq}" y="${H - 3}" style="font-size:11px;fill:var(--gris)">inicio</text><text x="1000" y="${H - 3}" style="font-size:11px;fill:var(--gris)" text-anchor="end">final</text>`;
    svg.innerHTML = s;
    svg.querySelectorAll(".fila-pj").forEach(g => g.onclick = () => { SP.focal = +g.dataset.k; SP.arista = null; SP.vinculo = -1; pintarPersonajes();
      $(SP.vista === "arbol" ? ".arbol-lienzo" : ".red-lienzo").scrollIntoView({behavior: "smooth", block: "nearest"}); });
  }
  function tablaPJ() {
    const filas = [...Array(KP()).keys()].sort((a, b) => DP.lista[b].s - DP.lista[a].s);
    $(".tablapj").innerHTML = `<table><tr><th>personaje</th><th>rol</th><th class="num">menciones</th>${D.teatro ? '<th class="num">parlamentos</th>' : ""}<th class="num">pasajes</th><th class="num">vínculos</th><th class="num">intermediación</th>${SP.tramo < 0 ? "" : '<th class="num">en el tramo</th>'}</tr>` +
      filas.map(k => { const L = DP.lista[k]; return `<tr><td>${esc(L.n)}</td><td>${L.rol}${L.pu ? " ⇄" : ""}</td><td class="num">${L.m}</td>${D.teatro ? `<td class="num">${L.h}</td>` : ""}<td class="num">${L.u}</td><td class="num">${L.gr}</td><td class="num">${L.b}</td>${SP.tramo < 0 ? "" : `<td class="num">${pesoPJ(k, SP.tramo)}</td>`}</tr>`; }).join("") + `</table>`;
  }
  function pintarEditorPJ() {
    const ta = $(".ta-reparto"), tf = $(".ta-familia");
    if (document.activeElement !== ta && !ta.dataset.sucio) ta.value = S.reparto;
    if (document.activeElement !== tf && !tf.dataset.sucio) tf.value = S.familia;
    const partes = [esc(ORIGEN_PJ)];
    if (est.reparto != null || S.reparto !== REP0 || S.familia !== FAM0) partes.push("Estás usando un reparto o una familia corregidos.");
    if (INFO_PJ) {
      if (INFO_PJ.lugares.length) partes.push("Parecen lugares y quedaron fuera: " + esc(INFO_PJ.lugares.join(", ")) + ".");
      if (INFO_PJ.familias.length) partes.push("Apellidos de familia (no son un personaje): " + esc(INFO_PJ.familias.slice(0, 8).join(", ")) + ".");
      if (INFO_PJ.distintos.length) partes.push("Se separaron porque aparecen juntos en una misma frase: " + esc(INFO_PJ.distintos.slice(0, 6).map(([a, b]) => `${a} ≠ ${b}`).join("; ")) + ".");
      if (INFO_PJ.teatro_papeles) partes.push("En teatro, un papel que se nombra (el Rey, la Reina) suele ser el mismo personaje que un hablante: únelos en una línea (<code>Claudio: claudio, rey</code>).");
      if (INFO_PJ.papeles.length) partes.push("Papeles sin nombre que se repiten (puedes sumarlos): " + esc(INFO_PJ.papeles.slice(0, 10).join(", ")) + ".");
    }
    if (DP && DP.fam_sin_nombre && DP.fam_sin_nombre.length) partes.push(`<b>Nombres de la familia que no están en el reparto:</b> ${esc(DP.fam_sin_nombre.join(", "))}.`);
    if (DP) { const vacios = DP.lista.filter(p => p.rol === "sin apariciones").map(p => p.n); if (vacios.length) partes.push("Sin apariciones (revisa sus formas): " + esc(vacios.join(", ")) + "."); }
    $(".origen-pj").innerHTML = partes.join(" ");
  }
  function marcarPJ(t) { const e = $(".estado-pj"); e.hidden = false; e.innerHTML = t; }
  function aplicarPJ() {
    S.reparto = $(".ta-reparto").value; S.familia = $(".ta-familia").value; delete $(".ta-reparto").dataset.sucio; delete $(".ta-familia").dataset.sucio;
    calcularPJ(); pintarPersonajes(); pintarTodo();
    marcarPJ(DP ? `Listo: ${DP.lista.length} personajes, ${DP.fam.filter(f => f.t !== "otro").length} vínculos de familia.` : "Ese reparto no tiene ninguna línea válida (<code>Nombre: forma, otra forma</code>).");
    aviso("Reparto aplicado"); cambio();
  }

  // ======================= CONVERSAR CON LA OBRA =======================
  // Un compañero de lectura para quien ya leyó la obra. Responde solo con frases del libro, numeradas y citadas con su página.
  // La página elige las frases (búsqueda local) y Claude responde con ellas; no se envía el libro completo.
  const CV = {sample: null, tools: false, turnos: [], ctl: null, modo: "preguntar", alcance: -1, enviadas: new Set(), listo: false, IDX: null};
  const STOPC = (opciones.lex && opciones.lex.STOP) || new Set();
  const MODOS = {
    preguntar: {nombre: "Preguntar a la obra", ayuda: "Pregunta lo que quieras comprobar: quién es quién, qué pasa en un capítulo, cómo cambia una relación. Responde citando frases.",
      regla: "Responde la pregunta de forma directa y breve. Cada afirmación sobre la obra lleva su cita."},
    prueba: {nombre: "Ponme a prueba", ayuda: "El compañero te hace preguntas de comprensión y corrige tus respuestas con la frase que las resuelve.",
      regla: "Eres quien pregunta. Si la persona pide una pregunta, hazle UNA sola pregunta de comprensión, concreta, basada en un fragmento, sin dar la respuesta ni citarla todavía. Si la persona responde a tu pregunta anterior, dile si es correcta, incompleta o equivocada, explica por qué citando la frase que la resuelve y termina ofreciendo otra pregunta."},
    socratico: {nombre: "Socrático", ayuda: "No te da la respuesta: te devuelve preguntas que te llevan a una frase concreta para que llegues tú.",
      regla: "No des la respuesta. Devuelve una o dos preguntas que lleven a la persona a mirar una frase concreta (cítala) y a sacar ella la conclusión. Si ya llegó, confírmalo en una línea y abre una pregunta nueva."},
  };
  function indiceCV() {
    if (CV.IDX) return CV.IDX;
    const df = new Map(); O.forEach(o => new Set(o.toks).forEach(t => df.set(t, (df.get(t) || 0) + 1)));
    return CV.IDX = {df, N: O.length};
  }
  const enAlcance = o => CV.alcance < 0 || o.tr === CV.alcance;
  const capituloEn = txt => { const m = norm(txt).match(/\b(?:capitulo|cap|escena|parte|bloque)\.?\s+([0-9]+|[ivxlc]+)\b/);
    if (!m) return null; const q = m[1].toUpperCase(); const s = D.segmentos.findIndex(x => String(x.e).toUpperCase() === q); return s >= 0 ? s : null; };
  function recuperar(texto, k = 24, extraAlcance = null) {
    const {df, N} = indiceCV(), toks = [...new Set((texto.match(new RegExp(RX_TOK.source, "g")) || []).map(norm))];
    const qt = toks.filter(t => t.length >= 3 && !STOPC.has(t) && df.has(t) && df.get(t) < N * 0.2);
    const motQ = new Set(), pjQ = new Set();
    S.motivos.forEach((m, k2) => { if (toks.some(t => t.length >= 3 && (coincide(t, m.f) || norm(m.n).split(/\s+/).includes(t)))) motQ.add(k2); });
    if (DP) DP.lista.forEach((p, k2) => { const nn = norm(p.n).replace(/[()]/g, " ").split(/\s+/).filter(w => w.length >= 3 && !STOPC.has(w));
      if (nn.some(w => toks.includes(w)) || p.f.some(f => { const fs = f.replace(/\s*\[.*\]$/, "").split(" "); return fs.length && fs.every(w => toks.includes(w.replace(/\*$/, ""))); })) pjQ.add(k2); });
    const seg = capituloEn(texto), filtro = o => (extraAlcance === null ? enAlcance(o) : o.tr === extraAlcance) && (seg === null || o.seg === seg);
    const puntos = [];
    O.forEach(o => { if (!filtro(o)) return;
      let s = 0; const ts = new Set(o.toks); qt.forEach(t => { if (ts.has(t)) s += Math.log(N / df.get(t)); });
      if (pjQ.size && PJ_O) PJ_O[o.i].forEach(m => { if (pjQ.has(m.k)) s += 2.5; });
      (o.m || []).forEach(m => { if (motQ.has(m)) s += 1.2; });
      if (s > 0) puntos.push([s, o.i]); });
    let elegidas;
    if (puntos.length) {
      puntos.sort((a, b) => b[0] - a[0]);
      const mejores = puntos.slice(0, Math.ceil(k * 0.6)).map(p => p[1]), resto = puntos.slice(Math.ceil(k * 0.6), k * 4).map(p => p[1]).sort((a, b) => a - b);
      elegidas = [...new Set(mejores.concat(repartir(resto, k - mejores.length)))];
    } else elegidas = repartir(O.filter(filtro).filter(o => o.toks.length >= 8).map(o => o.i), Math.min(k, 18));
    return elegidas.sort((a, b) => a - b);
  }
  const lineaFrase = i => { const o = O[i], voz = D.teatro ? o.voz : (o.voz === "diálogo" ? "diálogo" : "");
    return `[${i + 1}] (${lugarSeg(o.seg)}, ${pagina(o.pag)}${voz ? ", " + voz : ""}) ${o.tx.length > 420 ? o.tx.slice(0, 420) + "…" : o.tx}`; };
  function fichaObra() {
    const segs = D.segmentos.length, tit = D.segmentos.filter(s => s.t).slice(0, 30).map(s => `${s.e}. ${s.t}`).join("; ");
    let f = `OBRA: «${D.titulo}»${D.autor ? " de " + D.autor : ""}. ${segs} ${D.tipo_seg === "Escena" ? "escenas" : "segmentos (" + D.tipo_seg + ")"}${tit ? ": " + tit : ""}. Tramos: ${D.tramos.join(" | ")}.`;
    if (DP) {
      f += `\nPERSONAJES (rol en la red): ` + DP.lista.filter(p => p.rol !== "sin apariciones").map(p => `${p.n} (${p.rol})`).join("; ") + ".";
      if (DP.fam.length) f += `\nFAMILIA Y VÍNCULOS: ` + DP.fam.map(r => `${pjNom(r.a)} — ${r.e} de — ${pjNom(r.b)}`).join("; ").slice(0, 3000) + ".";
    }
    f += `\nMOTIVOS DEL LECTOR: ` + S.motivos.map(m => m.n).join(", ") + ".";
    return f;
  }
  function reglas() {
    return `Eres el compañero de lectura de Urdimbre, un explorador de motivos literarios. Conversas con una persona que YA LEYÓ la obra y quiere comprenderla mejor (para un trabajo, una tesis o por curiosidad).
REGLAS
1. Usa SOLO los fragmentos numerados que recibes${CV.tools ? " y los que encuentres con la herramienta buscar_en_la_obra" : ""}. No uses lo que sepas de la obra por otras fuentes; si algo no está en los fragmentos, di que no lo encuentras en ellos y sugiere qué buscar o en qué capítulo mirar.
2. Cada afirmación sobre la obra lleva la cita del fragmento con su número entre corchetes, por ejemplo [1532]. Ese número identifica la frase; no es una página. No inventes números.
3. Separa lo que dice el texto de tu interpretación: introduce la interpretación con «Una lectura posible:».
4. Español claro y breve: como máximo unas 170 palabras, salvo que te pidan más. Sin títulos; listas solo si ayudan.
5. Ayuda a pensar, no hagas el trabajo: no escribas ensayos ni resúmenes completos de la obra.
MODO: ${MODOS[CV.modo].nombre}. ${MODOS[CV.modo].regla}
ALCANCE: ${CV.alcance < 0 ? "toda la obra" : "el tramo «" + D.tramos[CV.alcance] + "»"}.

${fichaObra()}`;
  }
  const mdHTML = t => {
    const bloques = esc(t.trim()).split(/\n{2,}/);
    return bloques.map(b => { const ls = b.split("\n");
      if (ls.every(l => /^\s*([-*•]|\d+\.)\s+/.test(l))) return `<ul>${ls.map(l => `<li>${l.replace(/^\s*([-*•]|\d+\.)\s+/, "")}</li>`).join("")}</ul>`;
      return `<p>${ls.join("<br>")}</p>`; }).join("")
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>")
      .replace(/\[(\d+(?:\s*[,;–-]\s*\d+)*)\]/g, (_, g) => g.split(/\s*[,;–-]\s*/).map(n => { const i = +n - 1, ok = CV.enviadas.has(i);
        return `<button type="button" class="refcv${ok ? "" : " mala"}" data-i="${i}" title="${ok ? "Ver la frase" : "Esta frase no se le envió: no está verificada"}">[${n}]</button>`; }).join(""));
  };
  const citadas = t => [...new Set([...t.matchAll(/\[(\d+(?:\s*[,;–-]\s*\d+)*)\]/g)].flatMap(m => m[1].split(/\s*[,;–-]\s*/).map(n => +n - 1)))].filter(i => CV.enviadas.has(i)).sort((a, b) => a - b);
  function pintarConversar() {
    $$(".modocv").forEach(b => b.setAttribute("aria-pressed", b.dataset.m === CV.modo));
    $(".ayudacv").textContent = MODOS[CV.modo].ayuda;
    $(".alcancecv").innerHTML = `<option value="-1">Toda la obra</option>` + D.tramos.map((t, i) => `<option value="${i}">${esc(t)}</option>`).join(""); $(".alcancecv").value = CV.alcance;
    const sug = [];
    if (CV.modo === "prueba") sug.push("Hazme una pregunta", "Hazme una pregunta difícil", "Pregúntame por un personaje secundario");
    else {
      if (DP && DP.lista.length) { const p = DP.lista.map((x, k) => k).sort((a, b) => DP.lista[b].s - DP.lista[a].s);
        sug.push(`¿Qué papel cumple ${pjNom(p[0])} en la trama?`); if (p[1] !== undefined) sug.push(`¿Cómo cambia la relación entre ${pjNom(p[0])} y ${pjNom(p[1])}?`);
        if (DP.fam.some(f => f.t === "hijo")) { const f = DP.fam.find(f => f.t === "hijo"); sug.push(`¿De quién es hijo o hija ${pjNom(f.a)}?`); } }
      if (S.motivos.length) sug.push(`¿Qué sentido tiene «${S.motivos[0].n}» en la obra?`);
      if (HALL.length) sug.push(`Explícame este hallazgo: ${HALL[0].etq.toLowerCase()}`);
    }
    $(".sugcv").innerHTML = sug.slice(0, 5).map(s => `<button type="button" class="chip">${esc(s)}</button>`).join("");
    $$(".sugcv .chip").forEach(c => c.onclick = () => { $(".tacv").value = c.textContent; enviarCV(); });
    const nd = $(".nodispcv"); if (!nd.dataset.base) nd.dataset.base = nd.textContent;
    nd.textContent = CV.bloqueo || nd.dataset.base;
    nd.hidden = (!!CV.sample && !CV.bloqueo) || !CV.listo; $(".dispcv").hidden = !CV.sample;
    $(".tacv").disabled = $(".enviarcv").disabled = !!CV.bloqueo; $$(".sugcv .chip").forEach(c => c.disabled = !!CV.bloqueo);
  }
  function burbuja(rol, html, extra = "") {
    const d = document.createElement("div"); d.className = "msg " + rol; d.innerHTML = `<div class="cuerpo">${html}</div>${extra}`;
    $(".chatcv").appendChild(d); d.scrollIntoView({block: "nearest"}); return d;
  }
  function citasDe(d, texto, pregunta) {
    const ids = citadas(texto), malas = [...texto.matchAll(/\[(\d+)\]/g)].map(m => +m[1] - 1).filter(i => !CV.enviadas.has(i));
    const pie = d.querySelector(".pie-msg") || d.appendChild(Object.assign(document.createElement("div"), {className: "pie-msg"}));
    pie.innerHTML = (ids.length ? `<details${ids.length <= 4 ? " open" : ""}><summary>Frases citadas (${ids.length})</summary>${ids.map(i => `<div data-ic="${i}">${fragmento([i], {}, 600)}</div>`).join("")}</details>` : `<div class="sub">Sin citas: tómalo como orientación, no como dato del texto.</div>`)
      + (malas.length ? `<div class="aviso">Citó ${malas.length === 1 ? "un número que" : "números que"} no le envié (${[...new Set(malas)].map(i => i + 1).join(", ")}): no está verificado.</div>` : "")
      + `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><button class="btn guardarcv" type="button">＋ Guardar en el Cuaderno</button></div>`;
    conectarCitas(pie, `Conversación: ${pregunta.slice(0, 70)}`);
    d.querySelectorAll(".refcv").forEach(b => b.onclick = () => { const i = +b.dataset.i; if (!CV.enviadas.has(i)) return;
      const el = pie.querySelector(`[data-ic="${i}"]`); const det = pie.querySelector("details"); if (det) det.open = true;
      if (el) { el.scrollIntoView({block: "nearest", behavior: "smooth"}); el.classList.add("brilla"); setTimeout(() => el.classList.remove("brilla"), 1400); } });
    pie.querySelector(".guardarcv").onclick = () => {
      const n = nuevaNota(`Conversación: ${pregunta.slice(0, 70)}`);
      n.texto = `${MODOS[CV.modo].nombre}. Pregunta: ${pregunta}\n\nRespuesta del compañero de lectura (hipótesis, comprobar en las citas):\n${texto}`;
      ids.forEach(i => { const o = O[i], voz = D.teatro ? o.voz : (o.voz === "diálogo" ? "diálogo" : ""); n.citas.push({tx: o.tx, lug: `${lugarSeg(o.seg)} · ${pagina(o.pag)}${voz ? " · " + voz : ""}`}); });
      contarNotas(); cambio(); aviso("Guardado en el Cuaderno"); };
  }
  const MENSAJE_ERROR = {not_granted: "No diste permiso para usar Claude en esta página. Puedes volver a intentarlo recargando.", sampling_disabled: "Claude no está disponible para esta cuenta.",
    rate_limited: "Demasiadas preguntas seguidas o llegaste al límite de uso: espera un momento y vuelve a intentarlo.", session_expired: "Tu sesión de Claude expiró: vuelve a iniciar sesión.",
    refused: "Claude no respondió a esta pregunta. Prueba a formularla de otra manera.", prompt_too_large: "La conversación es demasiado larga: empieza una nueva.",
    empty_completion: "No llegó respuesta. Prueba con una pregunta más concreta.", upstream_error: "Se cortó la conexión. Vuelve a intentarlo."};
  async function enviarCV() {
    const ta = $(".tacv"), q = ta.value.trim(); if (!q || !CV.sample || CV.ctl || CV.bloqueo) return;
    ta.value = ""; burbuja("yo", mdHTML(q).replace(/<button[^>]*>(\[\d+\])<\/button>/g, "$1"));
    const ultimaPreg = [...CV.turnos].reverse().find(t => t.role === "assistant");
    const consulta = q + " " + (CV.modo !== "preguntar" && ultimaPreg ? ultimaPreg.content.slice(0, 400) : "");
    let ids = recuperar(consulta, CV.modo === "prueba" ? 20 : 24);
    if (CV.modo === "prueba" && !ultimaPreg) ids = repartir(O.filter(o => enAlcance(o) && o.toks.length >= 10 && ((PJ_O && PJ_O[o.i].length) || (o.m || []).length)).map(o => o.i), 20);
    ids.forEach(i => CV.enviadas.add(i));
    const bloque = `FRAGMENTOS (frases numeradas de la obra, en orden):\n${ids.map(lineaFrase).join("\n")}\n\nMENSAJE DE LA PERSONA: ${q}`;
    const historia = CV.turnos.slice(-8);
    const entrada = [{role: "user", content: reglas()}].concat(historia, [{role: "user", content: bloque}]);
    const d = burbuja("cv", `<span class="pensando">Buscando en la obra y pensando…</span>`);
    $(".parar").hidden = false; $(".enviarcv").disabled = true; CV.ctl = new AbortController();
    const herramientas = CV.tools ? [{name: "buscar_en_la_obra", description: "Busca en el texto completo de la obra y devuelve hasta 12 frases numeradas con capítulo y página. Úsala si los fragmentos recibidos no bastan para responder (un personaje, una palabra, un episodio).",
      inputSchema: {type: "object", properties: {consulta: {type: "string", description: "Palabras o nombres a buscar"}, tramo: {type: "integer", description: "Opcional: número de tramo (1 = primero) para limitar la búsqueda"}}, required: ["consulta"]},
      execute: input => { const t = Number(input.tramo); const r = recuperar(String(input.consulta || ""), 12, Number.isFinite(t) && t >= 1 && t <= T ? t - 1 : null);
        r.forEach(i => CV.enviadas.add(i)); d.querySelector(".cuerpo").innerHTML = `<span class="pensando">Buscando «${esc(String(input.consulta || "").slice(0, 60))}» en la obra…</span>`;
        return r.length ? r.map(lineaFrase).join("\n") : "No encontré frases con esas palabras."; }}] : undefined;
    try {
      const r = await CV.sample(entrada, {signal: CV.ctl.signal, cache: herramientas ? undefined : false, tools: herramientas,
        onText: ({text}) => { d.querySelector(".cuerpo").innerHTML = mdHTML(text); }});
      d.querySelector(".cuerpo").innerHTML = mdHTML(r.text) + (r.truncated ? `<p class="sub">(La respuesta se cortó: pide menos a la vez.)</p>` : "");
      CV.turnos.push({role: "user", content: q}, {role: "assistant", content: r.text});
      citasDe(d, r.text, q);
    } catch (e) {
      const parcial = e && e.text;
      if (e && e.code === "cancelled") { d.querySelector(".cuerpo").innerHTML = parcial ? mdHTML(parcial) + `<p class="sub">(Detenido.)</p>` : `<p class="sub">Detenido.</p>`; }
      else { d.querySelector(".cuerpo").innerHTML = (parcial && e.code !== "refused" ? mdHTML(parcial) : "") + `<div class="aviso">${esc(MENSAJE_ERROR[e && e.code] || MENSAJE_ERROR.upstream_error)}</div>`;
        if (e && ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(e.code)) { CV.bloqueo = MENSAJE_ERROR[e.code] || MENSAJE_ERROR.sampling_disabled; pintarConversar(); } }
    } finally { CV.ctl = null; $(".parar").hidden = true; $(".enviarcv").disabled = !!CV.bloqueo; }
  }
  function iniciarConversar() {
    const promesa = opciones.conversar;
    $$(".modocv").forEach(b => b.onclick = () => { CV.modo = b.dataset.m; pintarConversar(); });
    $(".alcancecv").onchange = ev => { CV.alcance = +ev.target.value; };
    $(".enviarcv").onclick = enviarCV;
    $(".tacv").onkeydown = ev => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); enviarCV(); } };
    $(".parar").onclick = () => CV.ctl && CV.ctl.abort();
    $(".nuevacv").onclick = () => { if (CV.ctl) CV.ctl.abort(); CV.turnos = []; CV.enviadas = new Set(); $(".chatcv").innerHTML = ""; };
    Promise.resolve(promesa).then(async s => { CV.sample = s || null; CV.listo = true;
      if (s && s.limits) { try { const l = await s.limits(); CV.tools = !!(l && l.tools); } catch (e) {} }
      if (vista === "conversar") pintarConversar(); }).catch(() => { CV.listo = true; });
  }

  function nuevaNota(ref) { const n = {id: Date.now() + Math.random(), ref, texto: "", citas: [], fecha: new Date().toLocaleDateString("es")}; S.notas.unshift(n); return n; }
  function abrirNota(ref) {
    const n = S.notas.find(x => x.ref === ref) || nuevaNota(ref); cambio(); mostrar("cuaderno");
    const ta = R.querySelector(`.nota[data-id="${n.id}"] textarea`); if (ta) ta.focus();
  }
  function conectarCitas(cont, ref) {
    cont.querySelectorAll(".mas").forEach(b => b.onclick = ev => { ev.stopPropagation(); const c = JSON.parse(b.dataset.cita), r = ref || "Citas sueltas";
      const n = S.notas.find(x => x.ref === r) || nuevaNota(r); if (!n.citas.some(x => x.tx === c.tx)) n.citas.push(c); contarNotas(); aviso("Cita guardada en el Cuaderno"); cambio(); });
  }
  function contarNotas() { const n = $("nav .n"); n.textContent = S.notas.length; n.hidden = !S.notas.length; }
  function pintarCuaderno() {
    $(".notas").innerHTML = S.notas.length ? S.notas.map(n => `<div class="nota" data-id="${n.id}"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
      <b class="frase" style="font-size:16px">${esc(n.ref)}${n.de ? `<span class="de">de ${esc(n.de)}</span>` : ""}</b><span class="sub">${esc(n.fecha)} <button class="btn link borrar" type="button" style="margin-left:8px">borrar</button></span></div>
      ${n.citas.map((c, j) => `<div class="cita"><span class="lug">${esc(c.lug)}<button class="mas quitar" type="button" data-j="${j}">quitar</button></span>${esc(c.tx)}</div>`).join("")}
      <textarea id="nota-${String(n.id).replace(".", "")}" aria-label="Tu nota" placeholder="Tu lectura: qué ves aquí, qué te sorprende, qué vas a revisar…">${esc(n.texto)}</textarea></div>`).join("")
      : `<div class="aviso">Todavía no hay notas. En la Red o en las fichas, usa <b>＋ citar</b> para guardar una frase con su página, o <b>✎ Anotar</b> para escribir sobre un motivo o una conexión.</div>`;
    $$(".nota").forEach(d => { const n = S.notas.find(x => String(x.id) === d.dataset.id);
      d.querySelector("textarea").oninput = ev => { n.texto = ev.target.value; cambio(); };
      d.querySelector(".borrar").onclick = () => { S.notas = S.notas.filter(x => x !== n); pintarCuaderno(); cambio(); };
      d.querySelectorAll(".quitar").forEach(q => q.onclick = () => { n.citas.splice(+q.dataset.j, 1); pintarCuaderno(); cambio(); }); });
    contarNotas();
  }
  const notasMarkdown = () => `# Notas de lectura: ${D.titulo}${D.autor ? " (" + D.autor + ")" : ""}\n${S.autor ? `\nLectores: ${[S.autor].concat([...new Set(S.notas.map(n => n.de).filter(Boolean))]).join(", ")}\n` : ""}\n` + S.notas.map(n => `## ${n.ref}${n.de ? ` (de ${n.de})` : (S.autor ? ` (de ${S.autor})` : "")}\n\n${n.texto ? n.texto + "\n\n" : ""}` +
    n.citas.map(c => `> ${c.tx}\n> — ${D.titulo}, ${c.lug}\n`).join("\n")).join("\n") +
    `\n---\nMotivos usados: ${S.motivos.map(m => `${m.n} (${m.f.join(", ")})`).join("; ")}\nGenerado con Urdimbre (explorador de motivos) v1.3.1\n`;
  function proyecto() { return {herramienta: "Urdimbre", version: "1.3.1", guardado: new Date().toISOString(), datos: D,
    estado: {motivos: S.motivos, notas: S.notas, unidad: S.unidad, reparto: S.reparto, familia: S.familia, autor: S.autor || ""}}; }

  let vista = "hallazgos", reloj = null;
  function mostrar(v) {
    vista = v; $$("nav button").forEach(b => b.setAttribute("aria-selected", b.dataset.v === v)); $$(".vista").forEach(s => s.hidden = s.dataset.v !== v);
    if (v === "hallazgos") pintarHallazgos(); if (v === "red") pintarRed(); if (v === "personajes") pintarPersonajes(); if (v === "conversar") pintarConversar(); if (v === "motivos") pintarFichas(); if (v === "taller") pintarTaller(); if (v === "cuaderno") pintarCuaderno();
    if (v !== "red" && reloj) { clearInterval(reloj); reloj = null; $(".play").textContent = "▶"; }
    if (v !== "personajes" && relojPJ) { clearInterval(relojPJ); relojPJ = null; $(".pj-play").textContent = "▶"; }
  }
  function pintarTodo() {
    $(".s-focal").innerHTML = `<option value="-1">(ninguno)</option>` + [...Array(K()).keys()].sort((a, b) => nombre(a).localeCompare(nombre(b), "es")).map(k => `<option value="${k}">${esc(nombre(k))}</option>`).join("");
    $(".datos").textContent = `${M.NTOK.toLocaleString("es")} palabras · ${D.segmentos.length} ${D.teatro ? "escenas" : "segmentos"} · ${T} tramos · ${K()} motivos${DP ? ` · ${DP.lista.filter(p => p.rol !== "sin apariciones").length} personajes` : ""}`;
    contarNotas(); mostrar(vista);
  }
  let tAviso; function aviso(t) { const e = $(".toast"); e.textContent = t; e.classList.add("on"); clearTimeout(tAviso); tAviso = setTimeout(() => e.classList.remove("on"), 1800); }

  $("h1").textContent = D.titulo; $(".autor").textContent = D.autor;
  $$("nav button").forEach(b => b.onclick = () => mostrar(b.dataset.v));
  $(".interruptor").onclick = () => { S.inv = !S.inv; R.classList.toggle("investigar", S.inv); $(".interruptor").setAttribute("aria-pressed", S.inv); mostrar(vista); };
  $(".s-unidad").innerHTML = ["oracion", "parrafo", "ventana"].map(u => `<option value="${u}">${NOMBRE_UNIDAD[u]}</option>`).join(""); $(".s-unidad").value = S.unidad;
  $(".s-unidad").onchange = ev => { S.unidad = ev.target.value; recalcular(); pintarTodo(); cambio(); };
  $(".s-top").oninput = ev => { S.top = +ev.target.value; $(".v-top").textContent = S.top; M.top = S.top; M.CACHE = {}; M.BASE = M.red(S.unidad, -1); M.solidez(); pintarRed(); };
  $(".s-tramo").oninput = ev => { S.tramo = +ev.target.value - 1; S.arista = null; pintarRed(); };
  $(".s-focal").onchange = ev => { S.focal = +ev.target.value; S.arista = null; pintarRed(); };
  $(".play").onclick = () => { if (reloj) { clearInterval(reloj); reloj = null; $(".play").textContent = "▶"; return; }
    $(".play").textContent = "❚❚"; S.arista = null; S.tramo = S.tramo >= T - 1 ? 0 : S.tramo + 1; pintarRed();
    reloj = setInterval(() => { if (S.tramo >= T - 1) { clearInterval(reloj); reloj = null; $(".play").textContent = "▶"; return; } S.tramo++; pintarRed(); }, 1700); };
  $(".csv").onclick = () => { const r = vistaRed(); descargar(`conexiones_${D.titulo}.csv`, "motivo_a,motivo_b,juntos,fuerza,lift\n" + r.edges.map(e => `"${nombre(e.a)}","${nombre(e.b)}",${e.c},${e.f.toFixed(4)},${e.l.toFixed(2)}`).join("\n"), "text/csv"); };
  $(".nuevo").onclick = () => { S.borrador.push({n: "", f: "", t: "propio"}); pintarTaller(); const fs = $$(".fila .nom"); fs[fs.length - 1].focus(); marcar(); };
  $(".aplicar").onclick = aplicar;
  $(".restaurar").onclick = () => { S.borrador = D.motivos.map(m => ({n: m.n, f: m.f.join(", "), t: m.t})); pintarTaller(); marcar("Diccionario inicial cargado: pulsa Aplicar."); };
  $(".bajar-notas").onclick = () => descargar(`notas_${D.titulo}.md`, notasMarkdown(), "text/markdown");
  $(".nueva-nota").onclick = () => { nuevaNota("Nota libre"); pintarCuaderno(); cambio(); };
  S.autor = est.autor || ""; $(".autor-notas").value = S.autor;
  $(".autor-notas").oninput = ev => { S.autor = ev.target.value.trim(); cambio(); };
  $(".unir-notas").onchange = async ev => { const f = ev.target.files[0]; if (!f) return;
    try { const p = JSON.parse(await f.text()), notas = (p.estado && p.estado.notas) || [];
      if (!p.datos || !Array.isArray(notas)) throw new Error("x");
      const de = (p.estado.autor || f.name.replace(/\.motivos\.json$|\.json$/i, "")).trim() || "otro lector";
      const otra = p.datos.titulo !== D.titulo;
      let n0 = 0; notas.forEach(n => { if (!n.texto && !(n.citas || []).length) return; S.notas.push({...n, id: Date.now() + Math.random(), de}); n0++; });
      pintarCuaderno(); cambio(); aviso(`${n0} notas de ${de} unidas${otra ? " (son de otra obra)" : ""}`);
    } catch (e) { aviso("Ese archivo no es un proyecto de Urdimbre"); }
    ev.target.value = ""; };
  if (PJM) {
    $('nav button[data-v="personajes"]').hidden = false;
    $$(".vpj").forEach(b => b.onclick = () => { SP.vista = b.dataset.vpj; pintarPersonajes(); });
    $(".s-pj").onchange = ev => { SP.focal = +ev.target.value; SP.arista = null; SP.vinculo = -1; pintarPersonajes(); };
    $(".pj-tramo").oninput = ev => { SP.tramo = +ev.target.value - 1; SP.arista = null; pintarPersonajes(); };
    $(".pj-play").onclick = () => { if (relojPJ) { clearInterval(relojPJ); relojPJ = null; $(".pj-play").textContent = "▶"; return; }
      $(".pj-play").textContent = "❚❚"; SP.arista = null; SP.tramo = SP.tramo >= T - 1 ? 0 : SP.tramo + 1; pintarPersonajes();
      relojPJ = setInterval(() => { if (SP.tramo >= T - 1) { clearInterval(relojPJ); relojPJ = null; $(".pj-play").textContent = "▶"; return; } SP.tramo++; pintarPersonajes(); }, 1700); };
    $(".csvpj").onclick = () => { if (!DP) return; const r = redPJ(SP.tramo);
      descargar(`personajes_${D.titulo}.csv`, "personaje,rol,puente,menciones,parlamentos,pasajes,vinculos,intermediacion\n" + DP.lista.map(L => `"${L.n}",${L.rol},${L.pu ? "sí" : "no"},${L.m},${L.h},${L.u},${L.gr},${L.b}`).join("\n")
        + "\n\npersonaje_a,personaje_b,pasajes_juntos\n" + r.edges.map(e => `"${pjNom(e.a)}","${pjNom(e.b)}",${e.c}`).join("\n"), "text/csv"); };
    $(".ta-reparto").oninput = ev => { ev.target.dataset.sucio = "1"; marcarPJ("Hay cambios sin aplicar."); };
    $(".ta-familia").oninput = ev => { ev.target.dataset.sucio = "1"; marcarPJ("Hay cambios sin aplicar."); };
    $(".aplicar-pj").onclick = aplicarPJ;
    $(".restaurar-pj").onclick = () => { $(".ta-reparto").value = REP0; $(".ta-familia").value = FAM0; $(".ta-reparto").dataset.sucio = $(".ta-familia").dataset.sucio = "1"; marcarPJ("Reparto inicial cargado: pulsa Aplicar."); };
    $(".proponer-pj").onclick = () => { const p = PJM.proponer(D); INFO_PJ = p.info; $(".ta-reparto").value = p.texto; $(".ta-reparto").dataset.sucio = "1"; pintarEditorPJ(); marcarPJ("Propuesta automática cargada (la familia no cambia): pulsa Aplicar."); };
  }
  $(".guardar-proy").onclick = () => descargar(`proyecto_${D.titulo.replace(/\s+/g, "_")}.motivos.json`, JSON.stringify(proyecto()), "application/json");
  S.autor = est.autor || "";
  recalcular(); iniciarPersonajes(); iniciarConversar(); pintarTodo();
  return {proyecto, mostrar};
}
