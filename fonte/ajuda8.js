/* testes da pá que fica abaixada, do Nível 2 e das pistas completas */
window.poeNivelProg = n => (function f(a){ for (const b of a) { if (b.op==="var_def" && b.a.VAR.lit==="nivel") b.a.VAL = L_(n); for (const k in b.a) if (b.a[k] && b.a[k].op) f([b.a[k]]); for (const c of b.c||[]) f(c);} })(PROG.scripts.flatMap(s=>s.pilha));
window.pd1 = () => { exemploPD(); poeNivelProg(1); };
window.v11 = () => { montaV10(); };
window.v11n1 = () => { montaV10(); poeNivelProg(1); };
window.diag = async (carrega, n, pista, real) => { const out = []; pista = pista === undefined ? PSALA : pista;
  for (let i = 0; i < n; i++) {
    if (real) { RUIDO = 2; DIF_MOTOR = 3; INERCIA = 0.1; }
    const r = await rodaSala(carrega, pista, 600, false);
    RUIDO = 1; DIF_MOTOR = 0; INERCIA = 0;
    const S = PISTAS[pista].estado.sala;
    out.push(r.fim + " bat" + r.bat + " S" + r.S + " resg" + r.resg + "+" + CORRIDA.trocadas + " " + r.areas.join("/") + " v=" + r.vars.verde + " rec=" + [1,2,3,4].map(k=>VARS["rec"+k]).join("") +
      (S ? " || " + VITIMAS.map(v => v.tipo[2] + "(" + (v.x0-S.x1).toFixed(0) + "," + (v.y0-S.y1).toFixed(0) + ")->(" + (v.x-S.x1).toFixed(0) + "," + (v.y-S.y1).toFixed(0) + ")" + (v.salva ? "S" : v.preso ? "P" : "")).join(" ") : ""));
  }
  return out; };
/* tempo gasto em cada procedimento de alto nível */
window.tempos = async (carrega, pista) => {
  carrega(); montaPista(pista, true); voltaLargada(); zeraPrograma(); comeca("ev_inicio"); RODANDO = true; TESTANDO = true;
  const t = {}; let n = 0;
  while (RODANDO && R.t < 600) { umPasso(); const pilha = (FIOS[0] && FIOS[0].pilhaChamadas) || [];
    if (++n % 2000 === 0) await new Promise(r => setTimeout(r, 0)); }
  RODANDO = false; TESTANDO = false; return t; };
