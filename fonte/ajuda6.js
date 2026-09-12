/* testes do resgate */
window.rodaSala = async (carrega, pista, tmax = 500, log = true) => {
  carrega(); montaPista(pista, true);
  voltaLargada(); zeraPrograma(); comeca("ev_inicio"); RODANDO = true; TESTANDO = true;
  let n = 0, ult = "", ev = [];
  while (RODANDO && R.t < tmax) {
    umPasso(); const q = DONO[ATUAL] || "main";
    if (q !== ult) { if (log && ev.length < 600) ev.push(R.t.toFixed(1) + " " + q + " (" + R.x.toFixed(0) + "," + R.y.toFixed(0) + ")"); ult = q; }
    if (++n % 2000 === 0) await new Promise(r => setTimeout(r, 0));
  }
  const C = CORRIDA;
  const r = { fim: C.completou ? "OK " + C.tempoFim.toFixed(1) : C.pct + "% " + PARADO_POR, t: R.t.toFixed(1), resg: C.resgatadas, bat: C.batidas, S: C.saidas,
    vars: { X: +(+VARS.X).toFixed(1), Y: +(+VARS.Y).toFixed(1), pO: +(+VARS.paredeO).toFixed(1), pL: +(+VARS.paredeL).toFixed(1), pN: +(+VARS.paredeN).toFixed(1),
      verde: VARS.cantoVerde, verm: VARS.cantoVermelho, nVaos: VARS.nVaos, v1: VARS.vao1, v2: VARS.vao2, saiu: VARS.saiu },
    vit: VITIMAS.map(v => v.tipo + "@" + v.x.toFixed(0) + "," + v.y.toFixed(0) + (v.preso ? "P" : "")), areas: AREAS.map(a => a.cor + ":" + a.canto) };
  RODANDO = false; TESTANDO = false; paraPar(); window.__ev = ev; return r;
};
window.serie = async (carrega, pista, vezes = 6, real = false) => {
  if (real) { RUIDO = 2; DIF_MOTOR = 3; INERCIA = 0.1; }
  const out = [];
  for (let i = 0; i < vezes; i++) { const r = await rodaSala(carrega, pista, 500, false); out.push(r.fim + " resg" + r.resg + "+" + CORRIDA.trocadas + " bat" + r.bat + " " + r.areas.join("/") + " t" + r.t); }
  RUIDO = 1; DIF_MOTOR = 0; INERCIA = 0;
  return out;
};
window.PSALA = PISTAS.findIndex(p => /treino \(sorteada/.test(p.nome));
window.PDESAFIO = PISTAS.findIndex(p => /^Desafio/.test(p.nome));
/* fixa a sala (em vez do sorteio) */
window.FIXA = null;
window._sorteia = window._sorteia || sorteiaSala;
window.sorteiaSala = sorteiaSala = function () {
  if (!FIXA) return _sorteia();
  const p = PISTAS[PISTA_ATUAL]; if (!p || !p.sorteio) return;
  const E = p.estado; E.areas = triangulosNosCantos(E.sala, FIXA.tri); AREAS = E.areas;
  E.vitimas = FIXA.vit.map(v => Object.assign({}, v)); VITIMAS = E.vitimas.map(v => Object.assign({ x0: v.x, y0: v.y }, v));
  pintaPista();
};
window.rastroBat = () => { };
