/* procura verde antes da linha: volta um pouco e olha reto, um pouco à esquerda e um pouco à direita */
B_.procuraVerde = (volta, giro) => {
  const { verde, se, def, gira, anda } = B_;
  const olha = () => [se(verde("E"), [def("verdeE", 1)]), se(verde("D"), [def("verdeD", 1)])];
  return [f_("mov_parar"), def("verdeE", 0), def("verdeD", 0), anda(volta, true)]
    .concat(olha(), [gira(-100, giro)], olha(), [gira(100, 2 * giro)], olha(), [gira(-100, giro)]);
};
window.clona = b => {
  const n = f_(b.op);
  for (const k in b.a) n.a[k] = b.a[k] && b.a[k].op ? clona(b.a[k]) : JSON.parse(JSON.stringify(b.a[k]));
  n.c = (b.c || []).map(l => l.map(clona));
  return n;
};
window.varreBlocos = (fn) => {
  (function andar(arr) {
    for (let i = 0; i < arr.length; i++) {
      const b = arr[i]; fn(b, arr, i);
      for (const k in b.a) if (b.a[k] && b.a[k].op) andar([b.a[k]]);
      for (const s of b.c || []) andar(s);
    }
  })(PROG.scripts.flatMap(s => s.pilha));
};

/* ---------- PD com as regras da OBR (com procura de verde) ---------- */
window.montaPD3 = (o = {}) => {
  montaPD2(o);
  const { se, sesenao, ou, e, igual, def, gira, ate, anda, maior } = B_;
  addVars("verdeE", "verdeD");
  const cz = PROG.scripts.find(s => s.pilha[0].op === "meu_def" && s.pilha[0].a.NOME.lit === "cruzamento");
  const corpo = cz.pilha.slice(1);
  const iAnda = corpo.findIndex(b => b.op === "mov_mover");
  const volta = o.volta ?? 1.8, giro = o.giro ?? 0.06;
  /* depois de saber o lado do preto: procura verde; se achou, vira pelo verde; senão segue o teste de sempre */
  const pelaVerde = [
    sesenao(e(igual(V_("verdeE"), L_(1)), igual(V_("verdeD"), L_(1))), [def("lado", 2)],
      [sesenao(igual(V_("verdeD"), L_(1)), [def("lado", 1)], [def("lado", -1)])]),
    f_("sen_zerar_cron"),
    ate(ou(B_.algumPreto(), maior(f_("sen_cron"), L_(2))), [f_("mov_dual", { ESQ: L_(25), DIR: L_(25) })]),
    anda(o.depoisVerde ?? 4.5),
    sesenao(igual(V_("lado"), L_(2)), [gira(100, 1.26)], [
      sesenao(igual(V_("lado"), L_(1)), B_.giraAtePreto(100, 0.3), B_.giraAtePreto(-100, 0.3))
    ])
  ];
  const resto = corpo.slice(iAnda, corpo.length - 2);
  const fim = corpo.slice(corpo.length - 2);
  cz.pilha = [cz.pilha[0]].concat(corpo.slice(0, iAnda), B_.procuraVerde(volta, giro),
    [sesenao(ou(igual(V_("verdeE"), L_(1)), igual(V_("verdeD"), L_(1))), pelaVerde,
      [anda(volta)].concat(resto))], fim);
  return PROG;
};

/* ---------- Samurai v8 ---------- */
window.montaV8 = (o = {}) => {
  const LIM = o.lim ?? 15, volta = o.volta ?? 1.8, giro = o.giro ?? 0.06;
  importaProjeto(EMBUTIDO, "Samurai OBR 2026 v8");
  const { se, sesenao, ou, e, igual, menor, maior, def, anda, chama } = B_;
  addVars("ladoPreto", "verdeE", "verdeD", "achouLinha", "passos");
  const acha = nome => PROG.scripts.find(x => x.pilha[0].op === "meu_def" && x.pilha[0].a.NOME.lit === nome);
  /* 1) dois sensores no preto: sempre confere (antes, com contaCurva > 2 ele virava achando que era canto) */
  varreBlocos((b, arr, i) => {
    if (b.op === "ctl_sesenao" && b.a.COND && b.a.COND.op === "op_maior" && b.a.COND.a.A.op === "var_ler" &&
        b.a.COND.a.A.a.VAR.lit === "contaCurva" && b.a.COND.a.B.lit === "2") arr[i] = chama("cruzamento_beco");
  });
  /* 2) um sensor no preto forte = linha atravessada: confere se é falso caminho ou canto */
  varreBlocos((b) => {
    if (b.op !== "ctl_sesenao" || !b.a.COND || b.a.COND.op !== "sen_ecor" || b.a.COND.a.COR.lit !== "0") return;
    const c0 = b.c[0];
    if (c0.length !== 1 || c0[0].op !== "meu_chama") return;
    const nome = c0[0].a.NOME.lit, p = b.a.COND.a.P.lit;
    if (nome !== "corrige_esquerda" && nome !== "corrige_direita") return;
    b.c[0] = [sesenao(e(menor(RF_(p), L_(LIM)), igual(V_("esperaLinha"), L_(0))), [def("ladoPreto", nome === "corrige_direita" ? 1 : -1), chama("confere_linha")], [chama(nome)])];
  });
  /* esperaLinha: depois de um cruzamento, deixa o robô se ajeitar na linha antes de testar de novo */
  addVars("esperaLinha");
  const dec = acha("decidir");
  dec.pilha.splice(1, 0, se(maior(V_("esperaLinha"), L_(0)), [B_.muda("esperaLinha", -1)]));
  const main = PROG.scripts.find(x => x.pilha[0].op === "ev_inicio");
  main.pilha.splice(2, 0, def("esperaLinha", 0));
  /* 3) o verde separado em "decide o lado" e "executa a curva" para poder chamar depois da procura */
  const ev = acha("encruzilhada_verde");
  const iAcao = ev.pilha.findIndex((b, k) => k > 0 && b.op === "ctl_sesenao" && b.a.COND.op === "op_igual");
  const acao = ev.pilha.slice(iAcao).map(clona);
  /* releitura sem verde nenhum: antes virava para a esquerda (ladoCurva = 0); agora não vira */
  const det = ev.pilha[1], senao = det.c[1][0];
  if (senao && senao.op === "ctl_sesenao" && senao.c[1].length === 1 && senao.c[1][0].op === "var_def") senao.c[1][0].a.VAL = L_(-1);
  else console.warn("encruzilhada_verde: estrutura inesperada");
  ev.pilha = ev.pilha.slice(0, iAcao).concat([se(f_("op_nao", { A: igual(V_("ladoCurva"), L_(-1)) }), [chama("executa_verde")])]);
  addProc("executa_verde", acao.concat([def("ignoraVerde", 20), def("esperaLinha", o.espera ?? 25)]), ev.x + 900, ev.y);
  /* 4) procura_verde: volta, olha para os lados e decide ladoCurva */
  addProc("procura_verde", B_.procuraVerde(volta, giro).concat([
    se(ou(igual(V_("verdeE"), L_(1)), igual(V_("verdeD"), L_(1))), [
      sesenao(e(igual(V_("verdeE"), L_(1)), igual(V_("verdeD"), L_(1))), [def("ladoCurva", 2)],
        [sesenao(igual(V_("verdeD"), L_(1)), [def("ladoCurva", 1)], [def("ladoCurva", 0)])]),
      chama("executa_verde")
    ])
  ]), ev.x + 900, ev.y + 900);
  /* 5) confere_linha: falso caminho ou canto */
  addProc("confere_linha", [
    chama("procura_verde"),
    se(e(igual(V_("verdeE"), L_(0)), igual(V_("verdeD"), L_(0))), [
      anda(volta + (o.avanco ?? 5)),
      def("achouLinha", 0)].concat(
      B_.varre(-100, 7, 0.03).map(x => JSON.parse(JSON.stringify(x).replace(/"achou"/g, '"achouLinha"'))),
      [se(igual(V_("achouLinha"), L_(0)), B_.varre(100, 7, 0.03).map(x => JSON.parse(JSON.stringify(x).replace(/"achou"/g, '"achouLinha"')))),
       se(igual(V_("achouLinha"), L_(0)), [anda(3, true),
         sesenao(igual(V_("ladoPreto"), L_(1)), [chama("curva_direita")], [chama("curva_esquerda")])]),
       def("ignoraVerde", 20)])),
    def("contaCurva", 0), def("contaEsq", 0), def("contaDir", 0), def("esperaLinha", o.espera ?? 25)
  ], ev.x + 900, ev.y + 1500);
  /* 6) cruzamento com os dois no preto: procura verde antes de passar reto */
  const cb = acha("cruzamento_beco");
  const corpoCb = cb.pilha.slice(1);
  cb.pilha = [cb.pilha[0], chama("procura_verde"),
    se(e(igual(V_("verdeE"), L_(0)), igual(V_("verdeD"), L_(0))), [anda(volta)].concat(corpoCb)), def("esperaLinha", o.espera ?? 25)];
  return PROG;
};
