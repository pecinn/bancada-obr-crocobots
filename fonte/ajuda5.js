/* Samurai v9 = v8 + desvio de obstáculo novo */
window.montaV9 = () => {
  importaProjeto(EMBUTIDO, "Samurai OBR 2026 v9");
  const acha = nome => PROG.scripts.find(x => x.pilha[0].op === "meu_def" && x.pilha[0].a.NOME.lit === nome);
  for (const v of ["vDentro", "vFora", "erro", "k"]) if (PROG.vars.indexOf(v) < 0) PROG.vars.push(v);
  const avisos = [];
  varreBlocos((b) => {
    if (b.op !== "ctl_sesenao" || !b.a.COND || b.a.COND.op !== "sen_edist") return;
    const val = b.a.COND.a.VAL && b.a.COND.a.VAL.lit;
    if (val === "15") { b.a.COND.a.VAL = L_(20); avisos.push("desvio agora a 20 cm"); }
    if (val === "25") {
      /* segue_rampa só quando o robô está inclinado (numa rampa); antes qualquer obstáculo a 25 cm parecia a rampa */
      const arf = () => f_("sen_angulo", { EIXO: L_("pitch") });
      b.a.COND = E_(b.a.COND, OU_(MAIOR_(arf(), L_(10)), MENOR_(arf(), L_(-10))));
      avisos.push("rampa só inclinado");
    }
  });
  const dv = acha("desvia_obstaculo");
  dv.pilha = [dv.pilha[0]].concat(blocosDesvio(), [DEF_("contaCurva", 0), DEF_("contaEsq", 0), DEF_("contaDir", 0), DEF_("esperaLinha", 12)]);
  /* canto: em empate de contaDir x contaEsq, vale o lado da última correção */
  if (PROG.vars.indexOf("ultimoLado") < 0) PROG.vars.push("ultimoLado");
  acha("corrige_esquerda").pilha.splice(1, 0, DEF_("ultimoLado", -1));
  acha("corrige_direita").pilha.splice(1, 0, DEF_("ultimoLado", 1));
  varreBlocos((b) => {
    const c = b.a && b.a.COND;
    if (b.op === "ctl_sesenao" && c && c.op === "op_maior" && c.a.A.op === "var_ler" && c.a.A.a.VAR.lit === "contaDir" &&
        c.a.B.op === "var_ler" && c.a.B.a.VAR.lit === "contaEsq") {
      b.a.COND = OU_(c, E_(f_("op_igual", { A: V_("contaDir"), B: V_("contaEsq") }), IGUAL_("ultimoLado", 1)));
      avisos.push("empate no canto");
    }
  });
  /* confere_canto: não adivinha o lado; procura primeiro no lado mais provável e, se não achar, no outro */
  if (PROG.vars.indexOf("ladoCanto") < 0) PROG.vars.push("ladoCanto");
  if (PROG.vars.indexOf("achouCanto") < 0) PROG.vars.push("achouCanto");
  const cc = acha("confere_canto");
  const busca = dir => [
    GIRA_(dir, 0.25), DEF_("k", 0),
    ATE_(OU_(ALGUM_PRETO_(), MAIOR_(V_("k"), L_(18))), [GIRA_(dir, 0.03), MUDA_("k", 1)]),
    SE_(ALGUM_PRETO_(), [DEF_("achouCanto", 1)])
  ];
  const procura = [
    SESENAO_(OU_(MAIOR_(V_("contaDir"), V_("contaEsq")), E_(f_("op_igual", { A: V_("contaDir"), B: V_("contaEsq") }), IGUAL_("ultimoLado", 1))),
      [DEF_("ladoCanto", 100)], [DEF_("ladoCanto", -100)]),
    DEF_("achouCanto", 0),
    SESENAO_(IGUAL_("ladoCanto", 100), busca(100), busca(-100)),
    SE_(IGUAL_("achouCanto", 0), [
      /* volta ao centro e procura do outro lado */
      SESENAO_(IGUAL_("ladoCanto", 100),
        [GIRA_(-100, SOMA_(L_(0.25), MULT_(L_(0.03), V_("k"))))].concat(busca(-100)),
        [GIRA_(100, SOMA_(L_(0.25), MULT_(L_(0.03), V_("k"))))].concat(busca(100)))
    ]),
    DEF_("ladoCurva", 0), DEF_("contaCurva", 0), DEF_("contaEsq", 0), DEF_("contaDir", 0)
  ];
  let trocou = false;
  (function andar(arr) {
    for (let i = 0; i < arr.length; i++) {
      const b = arr[i];
      if (b.op === "ctl_se" && b.c[0] && b.c[0].some(x => x.op === "ctl_sesenao" && x.c.flat().some(y => y.op === "meu_chama" && /curva_/.test(y.a.NOME.lit)))) {
        b.c[0] = procura; trocou = true; return;
      }
      for (const sub of b.c || []) andar(sub);
    }
  })(cc.pilha);
  avisos.push(trocou ? "confere_canto procura dos dois lados" : "confere_canto NÃO trocado");
  const main = PROG.scripts.find(s => s.pilha[0].op === "ev_inicio");
  main.pilha.splice(3, 0, DEF_("vDentro", 18), DEF_("vFora", 43));
  window.__avisosV9 = avisos;
  return PROG;
};
window.comObstaculo = async (carrega, pista, cx, tmax=150) => {
  carrega(); montaPista(pista, true); CAIXAS.push(Object.assign({ alt: 18, cor: 0x3a7bd5 }, cx));
  voltaLargada(); zeraPrograma(); comeca("ev_inicio"); RODANDO=true; TESTANDO=true;
  let n=0, desvios=0, ult=""; while(RODANDO && R.t<tmax){ umPasso(); const q=DONO[ATUAL]||""; if(q!==ult){ if(q==="desvia_obstaculo") desvios++; ult=q; } if(++n%2000===0) await new Promise(r=>setTimeout(r,0)); }
  const C=CORRIDA, r=(C.completou?"OK "+C.tempoFim.toFixed(1)+"s":C.pct+"% "+PARADO_POR)+" bat"+C.batidas+" S"+C.saidas+" desvios"+desvios;
  RODANDO=false; TESTANDO=false; paraPar(); return r; };
window.grade = async (carrega, vezes=2) => {
  const pos = [ [2, 45, 135], [2, 75, 105], [2, 75, 110] ];
  const tipos = { max: { w: 12, h: 10 }, maxGirado: { w: 10, h: 12 }, min: { w: 5, h: 3 }, garrafa: { r: 4 } };
  const out = {}; let ok=0, tot=0, bat=0;
  for (const real of [false, true]) {
    if (real) { RUIDO = 2; DIF_MOTOR = 3; INERCIA = 0.1; }
    for (const [p, x, y] of pos) for (const k in tipos) {
      const rs = []; for (let v=0; v<vezes; v++) { const s = await comObstaculo(carrega, p, Object.assign({ x, y }, tipos[k])); rs.push(s); tot++; if (/^OK .* bat0 S0/.test(s)) ok++; if (!/bat0/.test(s)) bat++; }
      const f = rs.filter(s=>!/^OK .* bat0 S0/.test(s)); if (f.length) out[(real?"real_":"")+"("+x+","+y+")_"+k] = f.join(" || ");
    }
  }
  RUIDO = 1; DIF_MOTOR = 0; INERCIA = 0;
  out.resumo = ok + "/" + tot + " perfeitos; corridas com batida: " + bat;
  return out; };
