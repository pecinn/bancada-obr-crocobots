/* desvio de obstáculo contornando em arco, com giroscópio */
window.DESVIO = (o = {}) => {
  const perto = o.perto ?? 7, giro = o.giro ?? 25, reto = o.reto ?? 8;
  const dist = () => f_("sen_dist", { P: L_("F"), UN: L_("cm") });
  const yaw = () => f_("sen_angulo", { EIXO: L_("yaw") });
  const preto = p => f_("sen_ecor", { P: L_(p), COR: L_("0") });
  const ou = (a, b) => f_("op_ou", { A: a, B: b }), e = (a, b) => f_("op_e", { A: a, B: b });
  const menor = (a, b) => f_("op_menor", { A: a, B: b }), maior = (a, b) => f_("op_maior", { A: a, B: b });
  const def = (v, x) => f_("var_def", { VAR: L_(v), VAL: (x && x.op) ? x : L_(x) });
  const muda = (v, x) => f_("var_muda", { VAR: L_(v), VAL: L_(x) });
  const dual = (a, b) => f_("mov_dual", { ESQ: (a && a.op) ? a : L_(a), DIR: (b && b.op) ? b : L_(b) });
  const ate = (c, a) => f_("ctl_repetir_ate", { COND: c }, [a]);
  const algum = () => ou(preto("D"), preto("E"));
  return [
    f_("mov_parar"),
    f_("som_bip", { NOTA: L_(76), SEG: L_(0.15) }),
    /* chega devagar até ~8 cm do obstáculo (ou se afasta, se passou) */
    def("k", 0),
    ate(ou(maior(dist(), L_(perto - 1)), maior(V_("k"), L_(100))), [dual(-15, -15), muda("k", 1)]),
    /* chega perto seguindo a linha devagar, para ficar alinhado com ela */
    def("k", 0),
    ate(ou(ou(menor(dist(), L_(perto)), maior(dist(), L_(25))), maior(V_("k"), L_(400))), [
      def("erro", f_("op_sub", { A: f_("sen_reflexo", { P: L_("E") }), B: f_("sen_reflexo", { P: L_("D") }) })),
      dual(f_("op_soma", { A: L_(16), B: f_("op_mult", { A: L_(0.4), B: V_("erro") }) }), f_("op_sub", { A: L_(16), B: f_("op_mult", { A: L_(0.4), B: V_("erro") }) })),
      muda("k", 1)]),
    /* o obstáculo saiu da frente (era algo fora da linha): cancela */
    f_("ctl_se", { COND: menor(dist(), L_(12)) }, [[
    f_("mov_parar"),
    f_("sen_zerar_ang"),
    /* 1) gira 90° para a direita no lugar */
    ate(maior(yaw(), L_(86)), [dual(giro, -giro)]),
    f_("mov_parar"),
    /* 2) ¼ de arco para a esquerda (raio ~17 cm) até ficar paralelo à linha */
    ate(menor(yaw(), L_(2)), [dual(V_("vDentro"), V_("vFora"))]),
    /* 3) reto ao lado do obstáculo */
    f_("mov_mover", { DIR: L_("forward"), VAL: L_(reto), UN: L_("cm") }),
    /* 4) outro ¼ de arco até achar a linha do outro lado */
    ate(ou(e(algum(), menor(yaw(), L_(-20))), menor(yaw(), L_(-150))), [dual(V_("vDentro"), V_("vFora"))]),
    f_("mov_parar"),
    /* 5) passa o eixo para cima da linha e gira de volta para o sentido original */
    f_("mov_mover", { DIR: L_("forward"), VAL: L_(o.avanca ?? 5.5), UN: L_("cm") }),
    /* gira para a direita até voltar ao sentido original (giroscópio) e recua um pouco:
       se a linha fizer um canto logo ali, os sensores ainda estão antes dele */
    ate(maior(yaw(), L_(-3)), [dual(giro, -giro)]),
    f_("mov_parar"),
    f_("mov_mover", { DIR: L_("back"), VAL: L_(2.5), UN: L_("cm") }),
    ]]),
    f_("mov_parar")
  ];
};
window.addDesvioPD = (o = {}) => {
  exemploPD();
  addVars("vDentro", "vFora");
  const main = PROG.scripts.find(s => s.pilha[0].op === "ev_inicio");
  const iSempre = main.pilha.findIndex(b => b.op === "ctl_sempre");
  main.pilha.splice(iSempre, 0, f_("var_def", { VAR: L_("vDentro"), VAL: L_(o.vDentro ?? 18) }), f_("var_def", { VAR: L_("vFora"), VAL: L_(o.vFora ?? 43) }));
  const laco = main.pilha[iSempre + 2].c[0];
  /* depois da faixa vermelha: obstáculo a menos de 12 cm */
  const cond = f_("op_menor", { A: f_("sen_dist", { P: L_("F"), UN: L_("cm") }), B: L_(o.detecta ?? 20) });
  const resto = laco.splice(1);
  laco.push(f_("ctl_sesenao", { COND: cond }, [[f_("meu_chama", { NOME: L_("desvia_obstaculo") })], resto]));
  addProc("desvia_obstaculo", DESVIO(o).concat([f_("var_def", { VAR: L_("anterior"), VAL: L_(0) })]), 1640, 40);
  return PROG;
};
