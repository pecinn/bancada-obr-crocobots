
/* =======================================================================
   9e. RESGATE CEGO NA SALA (o mesmo módulo entra no PD e no Samurai)
   Sem sensor de cor para achar vítimas: a sala é varrida em faixas com a pá abaixada,
   guiada pelo giroscópio, pelo tempo andado e pelo ultrassônico (só para ver paredes).
   A pá desce ao entrar e só sobe no recipiente: cada faixa termina apertando a parede, e a vítima
   que estiver na frente sobe para dentro da pá. Ao levantar, a pá joga as vítimas por cima da borda.
   Os sensores de cor de baixo só servem para o que não dá para fazer de olhos fechados:
   ver a cor da área de resgate no Nível 1 (o manual proíbe programar onde ela fica) e achar a fita preta da saída.
   No Nível 2 o recipiente tem borda de 6 cm e o chão de dentro é branco: o robô descobre que ele está no canto
   quando a pá encosta na borda e o ultrassônico mostra que ele parou antes.
   Posição estimada: X para a direita e Y para dentro da sala, com o zero no meio da porta de entrada.
   ======================================================================= */
const DIV_ = (a, b) => f_("op_div", { A: a, B: b });
const NAO_ = a => f_("op_nao", { A: a });
const SOMAR_ = (v, x) => f_("var_muda", { VAR: L_(v), VAL: (x && x.op) ? x : L_(x) });
const COR_ = (p, c) => f_("sen_ecor", { P: L_(p), COR: L_(c) });
const CRU_ = (p, c) => f_("sen_cru", { P: L_(p), CANAL: L_(c) });
/* fita prata da entrada. No SPIKE a luz refletida da prata é igual à do branco (as duas perto de 100), então quem separa
   é o valor bruto do vermelho: ~430 na prata contra ~980 no branco. No EV3 a prata reflete mais que o branco (~90 contra ~71).
   No Arduino a leitura analógica da prata fica abaixo da do branco (~80 contra ~150). */
const PRATA_ = p => PLAT.id === "spike" ? E_(MAIOR_(RF_(p), L_(80)), MENOR_(CRU_(p, "r"), L_(650)))
  : PLAT.id === "ev3" ? MAIOR_(f_("sen_reflexo", { P: L_(p) }), L_(82))
  : MENOR_(f_("sen_reflexo", { P: L_(p) }), L_(110));
const BRANCO_ = p => E_(MAIOR_(RF_(p), L_(86)), NAO_(PRATA_(p)));
const NEG_ = x => MULT_(L_(-1), x);
const VARS_RESGATE = ["resgateFeito", "contaPrata", "X", "Y", "rumo", "erroRumo", "giro", "dist", "andou", "sentido",
  "usaParede", "paredeMin", "olhaFita", "motivo", "vel", "cmPorSeg", "paredeO", "paredeL", "paredeN", "rumoFaixa",
  "ultima", "fimVarre", "sobra", "rumoIda", "rumoVolta", "rumoPasso", "ciclo", "ciclos", "canto", "diagonal", "corCanto", "cantoVerde",
  "cantoVermelho", "destinoX", "destinoY", "voltas", "anguloAntes", "angInicio", "emVao", "vaoIni", "nVaos",
  "vao1", "vao2", "saiu", "rumoPorta", "angPorta", "angTan", "rad", "tg", "tE", "tD", "ajuste", "achou", "passos", "k",
  "nivel", "kCanto", "kk", "rec1", "rec2", "rec3", "rec4", "nRec", "ladoRef", "cantoFim", "px", "py", "ok", "okX", "okY", "guardaX", "guardaY", "bordaA", "bordaB", "lateral", "dCanto", "alvoParede", "sLado", "sProx", "eMin", "velAntes", "leitura0", "ordemY", "tX", "tY", "cX", "cY"];

/* se o programa já tem um bloco com esse nome (o Samurai tem garra_abrir vazio), troca o corpo */
function defineOuTroca(nome, corpo, x, y) {
  const s = PROG.scripts.find(q => q.pilha[0] && q.pilha[0].op === "meu_def" && q.pilha[0].a.NOME.lit === nome);
  if (s) { s.pilha = [s.pilha[0]].concat(corpo); return; }
  defineBloco(nome, corpo, x, y);
}
function poeVarsResgate() { for (const v of VARS_RESGATE) if (PROG.vars.indexOf(v) < 0) PROG.vars.push(v); }

/* no laço de seguir linha: os dois sensores na faixa da fita prata por alguns ciclos seguidos = entrada da sala */
function blocosVePrata() {
  return [
    SESENAO_(E_(IGUAL_("resgateFeito", 0), E_(PRATA_("D"), PRATA_("E"))), [MUDA_("contaPrata", 1)], [DEF_("contaPrata", 0)]),
    SE_(MAIOR_(V_("contaPrata"), L_(3)), [CHAMA_("resgate"), DEF_("contaPrata", 0), f_("sen_zerar_cron")])
  ];
}

function blocosResgate(x0, y0) {
  x0 = x0 || 2200; y0 = y0 || 40;
  poeVarsResgate();
  const col = (i, j) => [x0 + i * 560, y0 + j * 760];

  defineOuTroca("resgate", [
    f_("mov_parar"), f_("som_bip", { NOTA: L_(84), SEG: L_(0.2) }),
    /* velocidade na sala e quantos cm o robô anda em 1 s a 40% (calibre no robô de verdade: aqui ≈ 17,6 cm/s) */
    DEF_("vel", 40), DEF_("cmPorSeg", 17.6),
    /* quantas vezes varre a sala inteira e entrega as vítimas */
    DEF_("ciclos", 2),
    /* nível da equipe: 1 = área de resgate pintada (borda de 5 mm); 2 = recipiente com borda de 6 cm (ensino médio) */
    DEF_("nivel", 2),
    /* no Nível 2 o robô não chega perto de um canto com recipiente: a soma das distâncias até as duas paredes
       do canto fica acima de kCanto. rec1..rec4 = 1 nos cantos em que ele achou recipiente */
    DEF_("kCanto", 0), SE_(IGUAL_("nivel", 2), [DEF_("kCanto", 57)]),
    DEF_("rec1", 0), DEF_("rec2", 0), DEF_("rec3", 0), DEF_("rec4", 0), DEF_("nRec", 0),
    /* nos cantos o robô para a dCanto cm das duas paredes (longe o bastante para girar sem raspar no recipiente) */
    DEF_("dCanto", 29), DEF_("alvoParede", SUB_(V_("dCanto"), L_(8))),
    /* fica reto em relação à fita prata (e à parede) antes de zerar o giroscópio: todos os rumos da sala partem daqui */
    CHAMA_("enquadra_na_fita"),
    /* os sensores estão na beirada de dentro da fita, 5,5 cm à frente das rodas: o zero da sala é o meio da porta */
    f_("sen_zerar_ang"), DEF_("rumo", 0), DEF_("X", 0), DEF_("Y", -4.25),
    DEF_("usaParede", 0), DEF_("olhaFita", 0), DEF_("dist", 23), CHAMA_("anda_na_sala"),
    DEF_("paredeN", 0), DEF_("paredeL", 999), DEF_("cantoVerde", 0), DEF_("cantoVermelho", 0), DEF_("ciclo", 1),
    /* abaixa a pá: daqui até o recipiente ela não sobe mais */
    CHAMA_("garra_abrir"),
    /* Nível 2: antes de varrer, mede a sala e descobre em que cantos estão os recipientes */
    SE_(IGUAL_("nivel", 2), [CHAMA_("acha_recipientes")]),
    f_("ctl_repetir", { N: V_("ciclos") }, [[CHAMA_("varre_sala"), CHAMA_("entrega_vitimas"), SOMAR_("ciclo", 1)]]),
    CHAMA_("procura_saida"),
    DEF_("resgateFeito", 1)
  ], ...col(0, 0));

  defineOuTroca("enquadra_na_fita", [
    /* 1) passa a fita inteira: os dois sensores ficam no piso branco da sala (lá não tem linha preta atrapalhando) */
    f_("mov_parar"), f_("ctl_esperar", { SEG: L_(0.2) }),
    f_("sen_zerar_cron"),
    ATE_(OU_(E_(BRANCO_("D"), BRANCO_("E")), MAIOR_(CRON_(), L_(2))), [DUAL_(10, 10)]),
    f_("sen_zerar_cron"), ATE_(MAIOR_(CRON_(), L_(0.35)), [DUAL_(10, 10)]),
    f_("mov_parar"), f_("ctl_esperar", { SEG: L_(0.2) }),
    /* 2) volta de ré devagar e marca quando cada sensor chega na fita: se um chega antes, o robô está torto.
          ângulo = diferença de tempo × velocidade ÷ distância entre os sensores (4,4 cm) */
    DEF_("tE", 0), DEF_("tD", 0), f_("sen_zerar_cron"),
    ATE_(OU_(E_(MAIOR_(V_("tE"), L_(0)), MAIOR_(V_("tD"), L_(0))), MAIOR_(CRON_(), L_(3))), [
      DUAL_(-6, -6),
      SE_(E_(IGUAL_("tE", 0), PRATA_("E")), [DEF_("tE", CRON_())]),
      SE_(E_(IGUAL_("tD", 0), PRATA_("D")), [DEF_("tD", CRON_())])
    ]),
    f_("mov_parar"), f_("ctl_esperar", { SEG: L_(0.2) }),
    /* de ré, o sensor esquerdo chega antes quando o robô está virado para a esquerda: o fundo da sala fica em "ajuste" graus */
    DEF_("ajuste", 0),
    SE_(E_(MAIOR_(V_("tE"), L_(0)), MAIOR_(V_("tD"), L_(0))), [
      DEF_("ajuste", MULT_(SUB_(V_("tD"), V_("tE")), DIV_(MULT_(L_(6), MULT_(V_("cmPorSeg"), L_(57.3))), MULT_(V_("vel"), L_(4.4)))))
    ]),
    SE_(MAIOR_(V_("ajuste"), L_(25)), [DEF_("ajuste", 0)]),
    SE_(MENOR_(V_("ajuste"), L_(-25)), [DEF_("ajuste", 0)])
  ], ...col(0, 0.6));

  defineOuTroca("garra_abrir", [
    /* abaixa a pá (motor C em 90°): ela empurra as vítimas; apertada contra a parede, a vítima sobe para dentro dela */
    f_("mot_vel", { P: L_("C"), VAL: L_(60) }), f_("mot_ir", { P: L_("C"), VAL: L_(90) })
  ], ...col(0, 1));
  defineOuTroca("garra_fechar", [
    /* levanta a pá (motor C em 0°): ela joga para a frente as vítimas que carrega (só fazer isso no recipiente) */
    f_("mot_vel", { P: L_("C"), VAL: L_(60) }), f_("mot_ir", { P: L_("C"), VAL: L_(0) })
  ], ...col(0, 1.35));

  defineOuTroca("calcula_erro_rumo", [
    /* quanto falta girar para ficar no rumo (entre -180 e 180; positivo = virar à direita).
       "ajuste" corrige o quanto o robô entrou torto na sala */
    /* resto da divisão por 360: funciona com o giroscópio do EV3, que soma as voltas sem voltar para -180..180 */
    DEF_("erroRumo", SUB_(f_("op_mod", { A: SOMA_(SUB_(SOMA_(V_("rumo"), V_("ajuste")), YAW_()), L_(540)), B: L_(360) }), L_(180)))
  ], ...col(1, 0));

  defineOuTroca("vira_para_rumo", [
    /* com a parede quase encostada o robô não cabe para girar: recua o mínimo antes */
    SE_(MENOR_(DIST_(), L_(7.5)), [
      f_("sen_zerar_cron"),
      ATE_(OU_(MAIOR_(DIST_(), L_(9.5)), MAIOR_(CRON_(), L_(1.2))), [DUAL_(-15, -15)]),
      f_("mov_parar")
    ]),
    /* gira no lugar até o giroscópio marcar o rumo; devagar no final para não passar */
    DEF_("erroRumo", 99),
    ATE_(MENOR_(MULT_(V_("erroRumo"), V_("erroRumo")), L_(2)), [
      CHAMA_("calcula_erro_rumo"),
      DEF_("giro", MULT_(V_("erroRumo"), L_(0.6))),
      SE_(MAIOR_(V_("giro"), L_(35)), [DEF_("giro", 35)]),
      SE_(MENOR_(V_("giro"), L_(-35)), [DEF_("giro", -35)]),
      SE_(E_(MAIOR_(V_("giro"), L_(0)), MENOR_(V_("giro"), L_(6))), [DEF_("giro", 6)]),
      SE_(E_(MENOR_(V_("giro"), L_(0)), MAIOR_(V_("giro"), L_(-6))), [DEF_("giro", -6)]),
      DUAL_(V_("giro"), NEG_(V_("giro")))
    ]),
    f_("mov_parar"), f_("ctl_esperar", { SEG: L_(0.1) })
  ], ...col(1, 0.6));

  defineOuTroca("anda_na_sala", [
    /* anda reto no rumo (dist negativa = de ré) até:
       1 = andou dist cm · 2 = parede a menos de paredeMin cm · 3 = fita preta · 4 = fita prata */
    DEF_("motivo", 0), DEF_("andou", 0), DEF_("contaPrata", 0), f_("sen_zerar_cron"),
    DEF_("sentido", 1), SE_(MENOR_(V_("dist"), L_(0)), [DEF_("sentido", -1), DEF_("dist", NEG_(V_("dist")))]),
    ATE_(MAIOR_(V_("motivo"), L_(0)), [
      CHAMA_("calcula_erro_rumo"),
      DUAL_(SOMA_(MULT_(V_("sentido"), V_("vel")), MULT_(L_(1.5), V_("erroRumo"))),
            SUB_(MULT_(V_("sentido"), V_("vel")), MULT_(L_(1.5), V_("erroRumo")))),
      /* cmPorSeg é a medida a 40%: em outra velocidade, proporcional */
      DEF_("andou", MULT_(CRON_(), MULT_(V_("cmPorSeg"), DIV_(V_("vel"), L_(40))))),
      SE_(NAO_(MENOR_(V_("andou"), V_("dist"))), [DEF_("motivo", 1)]),
      SE_(E_(E_(IGUAL_("usaParede", 1), IGUAL_("sentido", 1)), MENOR_(DIST_(), V_("paredeMin"))), [DEF_("motivo", 2)]),
      SE_(IGUAL_("olhaFita", 1), [
        SE_(OU_(MENOR_(RF_("D"), L_(20)), MENOR_(RF_("E"), L_(20))), [DEF_("motivo", 3)]),
        SESENAO_(E_(PRATA_("D"), PRATA_("E")), [MUDA_("contaPrata", 1)], [DEF_("contaPrata", 0)]),
        SE_(MAIOR_(V_("contaPrata"), L_(2)), [DEF_("motivo", 4)])
      ])
    ]),
    f_("mov_parar"),
    /* atualiza a posição estimada (só nos quatro rumos retos) */
    SE_(IGUAL_("rumo", 0), [SOMAR_("Y", MULT_(V_("sentido"), V_("andou")))]),
    SE_(OU_(IGUAL_("rumo", 180), IGUAL_("rumo", -180)), [SOMAR_("Y", NEG_(MULT_(V_("sentido"), V_("andou"))))]),
    SE_(IGUAL_("rumo", 90), [SOMAR_("X", MULT_(V_("sentido"), V_("andou")))]),
    SE_(IGUAL_("rumo", -90), [SOMAR_("X", NEG_(MULT_(V_("sentido"), V_("andou"))))])
  ], ...col(1, 1.5));

  defineOuTroca("vai_para_destino", [
    /* vai até (destinoX, destinoY) andando só nos rumos retos: de lado e depois para a frente, ou o contrário.
       Escolhe a ordem em que o ponto da virada fica longe dos recipientes; se nenhuma serve, passa pelo meio da sala */
    DEF_("px", V_("destinoX")), DEF_("py", V_("Y")), CHAMA_("ponto_seguro"), DEF_("okX", V_("ok")),
    DEF_("px", V_("X")), DEF_("py", V_("destinoY")), CHAMA_("ponto_seguro"), DEF_("okY", V_("ok")),
    SE_(E_(IGUAL_("okX", 0), IGUAL_("okY", 0)), [
      DEF_("guardaX", V_("destinoX")), DEF_("guardaY", V_("destinoY")),
      DEF_("destinoX", DIV_(SOMA_(V_("paredeO"), V_("paredeL")), L_(2))), DEF_("destinoY", DIV_(SOMA_(V_("paredeN"), L_(1.25)), L_(2))),
      /* até o meio: primeiro sai da parede mais perto */
      DEF_("cX", SUB_(V_("X"), V_("paredeO"))), SE_(MENOR_(SUB_(V_("paredeL"), V_("X")), V_("cX")), [DEF_("cX", SUB_(V_("paredeL"), V_("X")))]),
      DEF_("cY", SUB_(V_("Y"), L_(1.25))), SE_(MENOR_(SUB_(V_("paredeN"), V_("Y")), V_("cY")), [DEF_("cY", SUB_(V_("paredeN"), V_("Y")))]),
      SESENAO_(MENOR_(V_("cY"), V_("cX")), [CHAMA_("anda_em_y"), CHAMA_("anda_em_x")], [CHAMA_("anda_em_x"), CHAMA_("anda_em_y")]),
      DEF_("destinoX", V_("guardaX")), DEF_("destinoY", V_("guardaY")),
      DEF_("px", V_("destinoX")), DEF_("py", V_("Y")), CHAMA_("ponto_seguro"), DEF_("okX", V_("ok"))
    ]),
    SESENAO_(IGUAL_("okX", 1), [CHAMA_("anda_em_x"), CHAMA_("anda_em_y")], [CHAMA_("anda_em_y"), CHAMA_("anda_em_x")])
  ], ...col(2, 0));

  defineOuTroca("ponto_seguro", [
    /* ok = 1 se o ponto (px, py) está longe dos cantos com recipiente (soma das distâncias às duas paredes ≥ kCanto) */
    DEF_("ok", 1),
    SE_(E_(IGUAL_("rec1", 1), MENOR_(SOMA_(SUB_(V_("px"), V_("paredeO")), SUB_(V_("paredeN"), V_("py"))), SUB_(V_("kCanto"), L_(1)))), [DEF_("ok", 0)]),
    SE_(E_(IGUAL_("rec2", 1), MENOR_(SOMA_(SUB_(V_("paredeL"), V_("px")), SUB_(V_("paredeN"), V_("py"))), SUB_(V_("kCanto"), L_(1)))), [DEF_("ok", 0)]),
    SE_(E_(IGUAL_("rec3", 1), MENOR_(SOMA_(SUB_(V_("paredeL"), V_("px")), SUB_(V_("py"), L_(1.25))), SUB_(V_("kCanto"), L_(1)))), [DEF_("ok", 0)]),
    SE_(E_(IGUAL_("rec4", 1), MENOR_(SOMA_(SUB_(V_("px"), V_("paredeO")), SUB_(V_("py"), L_(1.25))), SUB_(V_("kCanto"), L_(1)))), [DEF_("ok", 0)])
  ], ...col(5, 1));

  defineOuTroca("anda_em_x", [
    /* para a 16,5 cm da parede (8,5 no sensor): mais perto que isso a pá raspa nela quando o robô gira */
    SE_(MAIOR_(MULT_(SUB_(V_("destinoX"), V_("X")), SUB_(V_("destinoX"), V_("X"))), L_(1)), [
      SESENAO_(MAIOR_(V_("destinoX"), V_("X")),
        [DEF_("rumo", 90), DEF_("dist", SUB_(V_("destinoX"), V_("X")))],
        [DEF_("rumo", -90), DEF_("dist", SUB_(V_("X"), V_("destinoX")))]),
      DEF_("usaParede", 1), DEF_("paredeMin", 8.5), DEF_("olhaFita", 0),
      CHAMA_("vira_para_rumo"), CHAMA_("anda_na_sala"),
      /* parou na parede: acerta a conta por ela */
      SE_(IGUAL_("motivo", 2), [SESENAO_(IGUAL_("rumo", 90),
        [SE_(MENOR_(V_("paredeL"), L_(900)), [DEF_("X", SUB_(V_("paredeL"), SOMA_(DIST_(), L_(8))))])],
        [DEF_("X", SOMA_(V_("paredeO"), SOMA_(DIST_(), L_(8))))])])])
  ], ...col(5, 0));
  defineOuTroca("anda_em_y", [
    SE_(MAIOR_(MULT_(SUB_(V_("destinoY"), V_("Y")), SUB_(V_("destinoY"), V_("Y"))), L_(1)), [
      SESENAO_(MAIOR_(V_("destinoY"), V_("Y")),
        [DEF_("rumo", 0), DEF_("dist", SUB_(V_("destinoY"), V_("Y")))],
        [DEF_("rumo", 180), DEF_("dist", SUB_(V_("Y"), V_("destinoY")))]),
      DEF_("usaParede", 1), DEF_("paredeMin", 8.5), DEF_("olhaFita", 0),
      CHAMA_("vira_para_rumo"), CHAMA_("anda_na_sala"),
      SE_(IGUAL_("motivo", 2), [SESENAO_(IGUAL_("rumo", 0),
        [SE_(MAIOR_(V_("paredeN"), L_(0)), [DEF_("Y", SUB_(V_("paredeN"), SOMA_(DIST_(), L_(8))))])],
        [DEF_("Y", SOMA_(DIST_(), L_(9.25)))])])])
  ], ...col(5, 0.5));

  defineOuTroca("varre_sala", [
    DEF_("usaParede", 1), DEF_("olhaFita", 1),
    SESENAO_(E_(IGUAL_("ciclo", 1), IGUAL_("nivel", 1)), [
      /* 1ª vez: vai para a esquerda (a pá abaixada já recolhe) até ver a parede, e mede onde ela está.
         No Nível 2 para mais longe, porque o canto pode ter recipiente */
      DEF_("rumo", -90), CHAMA_("vira_para_rumo"),
      DEF_("dist", 140), DEF_("paredeMin", 14),
      SE_(MAIOR_(SUB_(V_("kCanto"), SOMA_(L_(8), SUB_(V_("Y"), L_(1.25)))), L_(14)), [DEF_("paredeMin", SUB_(V_("kCanto"), SOMA_(L_(8), SUB_(V_("Y"), L_(1.25)))))]),
      CHAMA_("anda_na_sala"),
      DEF_("paredeO", SUB_(V_("X"), SOMA_(DIST_(), L_(8)))),
      /* primeira faixa a 16,5 cm da parede da esquerda (mais perto, a traseira raspa nela quando o robô gira) */
      DEF_("destinoX", SOMA_(V_("paredeO"), L_(16.5))), DEF_("destinoY", V_("Y")),
      SE_(MAIOR_(V_("kCanto"), L_(0)), [DEF_("destinoY", SUB_(V_("kCanto"), L_(15.25)))]),
      CHAMA_("vai_para_destino"),
      /* faixas de trás para a frente, andando para a direita */
      DEF_("rumoIda", 0), DEF_("rumoVolta", 180), DEF_("rumoPasso", 90)
    ], [
      /* cada faixa só limpa a beirada da parede onde ela termina; por isso as voltas se alternam:
         nas pares, as faixas são atravessadas (da esquerda para a direita) e sobem para o fundo */
      /* (no Nível 2 o começo foge do canto da frente à esquerda se ele tiver recipiente) */
      SESENAO_(f_("op_igual", { A: f_("op_mod", { A: V_("ciclo"), B: L_(2) }), B: L_(0) }), [
        DEF_("destinoX", SOMA_(V_("paredeO"), L_(24))), DEF_("destinoY", 17.75),
        SE_(IGUAL_("rec4", 1), [DEF_("destinoX", SOMA_(V_("paredeO"), SUB_(V_("kCanto"), L_(16.5))))]),
        DEF_("rumoIda", 90), DEF_("rumoVolta", -90), DEF_("rumoPasso", 0)
      ], [
        DEF_("destinoX", SOMA_(V_("paredeO"), L_(16.5))), DEF_("destinoY", 24),
        SE_(IGUAL_("ciclo", 1), [DEF_("destinoY", 17.75)]),
        SE_(IGUAL_("rec4", 1), [DEF_("destinoY", SUB_(V_("kCanto"), L_(15.25)))]),
        DEF_("rumoIda", 0), DEF_("rumoVolta", 180), DEF_("rumoPasso", 90)
      ]),
      CHAMA_("vai_para_destino")
    ]),
    DEF_("usaParede", 1), DEF_("olhaFita", 1),
    DEF_("rumoFaixa", V_("rumoIda")), DEF_("rumo", V_("rumoFaixa")), CHAMA_("vira_para_rumo"),
    DEF_("ultima", 0), DEF_("fimVarre", 0),
    ATE_(IGUAL_("fimVarre", 1), [
      CHAMA_("faixa"),
      SESENAO_(IGUAL_("ultima", 1), [DEF_("fimVarre", 1)], [
        /* vira para o lado em que as faixas andam: quanto falta até a parede de lá? */
        DEF_("rumo", V_("rumoPasso")), CHAMA_("vira_para_rumo"),
        DEF_("sobra", SOMA_(DIST_(), L_(8))),
        /* a parede do lado já é conhecida e a leitura bate (±15 cm)? então acerta a posição por ela;
           se não bate (uma porta), confia na conta */
        SE_(IGUAL_("rumoPasso", 90), [
          SESENAO_(MAIOR_(V_("paredeL"), L_(900)), [DEF_("paredeL", SOMA_(V_("X"), V_("sobra")))], [
            SESENAO_(MENOR_(MULT_(SUB_(SOMA_(V_("X"), V_("sobra")), V_("paredeL")), SUB_(SOMA_(V_("X"), V_("sobra")), V_("paredeL"))), L_(225)),
              [DEF_("X", SUB_(V_("paredeL"), V_("sobra")))], [DEF_("sobra", SUB_(V_("paredeL"), V_("X")))])])]),
        SE_(E_(IGUAL_("rumoPasso", 0), MAIOR_(V_("paredeN"), L_(0))), [
          SESENAO_(MENOR_(MULT_(SUB_(SOMA_(V_("Y"), V_("sobra")), V_("paredeN")), SUB_(SOMA_(V_("Y"), V_("sobra")), V_("paredeN"))), L_(225)),
            [DEF_("Y", SUB_(V_("paredeN"), V_("sobra")))], [DEF_("sobra", SUB_(V_("paredeN"), V_("Y")))])]),
        SESENAO_(MENOR_(V_("sobra"), L_(21)), [DEF_("fimVarre", 1)], [
          /* anda uma largura de pá (16 cm); se a próxima faixa já encosta na parede, ela é a última */
          DEF_("usaParede", 1), DEF_("olhaFita", 1), DEF_("paredeMin", 8.5),
          SESENAO_(MENOR_(V_("sobra"), L_(34)), [DEF_("dist", SUB_(V_("sobra"), L_(16.5))), DEF_("ultima", 1)], [DEF_("dist", 16)]),
          CHAMA_("anda_na_sala"),
          SESENAO_(f_("op_igual", { A: V_("rumoFaixa"), B: V_("rumoIda") }), [DEF_("rumoFaixa", V_("rumoVolta"))], [DEF_("rumoFaixa", V_("rumoIda"))]),
          DEF_("rumo", V_("rumoFaixa")), CHAMA_("vira_para_rumo")
        ])
      ])
    ])
  ], ...col(2, 0.75));

  defineOuTroca("faixa", [
    /* uma faixa, com a pá abaixada. sLado = distância até a parede do lado; sProx = a mesma coisa na próxima faixa */
    DEF_("usaParede", 1), DEF_("olhaFita", 1),
    SESENAO_(OU_(IGUAL_("rumoFaixa", 90), IGUAL_("rumoFaixa", -90)), [
      DEF_("sLado", SUB_(V_("Y"), L_(1.25))), DEF_("sProx", SUB_(SOMA_(V_("Y"), L_(16)), L_(1.25))),
      SE_(MAIOR_(V_("paredeN"), L_(0)), [
        SE_(MENOR_(SUB_(V_("paredeN"), V_("Y")), V_("sLado")), [DEF_("sLado", SUB_(V_("paredeN"), V_("Y")))]),
        SE_(MENOR_(SUB_(V_("paredeN"), SOMA_(V_("Y"), L_(16))), V_("sProx")), [DEF_("sProx", SUB_(V_("paredeN"), SOMA_(V_("Y"), L_(16))))])])
    ], [
      DEF_("sLado", SUB_(V_("X"), V_("paredeO"))), DEF_("sProx", SUB_(SOMA_(V_("X"), L_(16)), V_("paredeO"))),
      SE_(MENOR_(SUB_(V_("paredeL"), V_("X")), V_("sLado")), [DEF_("sLado", SUB_(V_("paredeL"), V_("X")))]),
      SE_(MENOR_(SUB_(V_("paredeL"), SOMA_(V_("X"), L_(16))), V_("sProx")), [DEF_("sProx", SUB_(V_("paredeL"), SOMA_(V_("X"), L_(16))))])
    ]),
    SE_(MENOR_(V_("sProx"), L_(16.5)), [DEF_("sProx", 16.5)]),
    SE_(IGUAL_("ultima", 1), [DEF_("sProx", V_("sLado"))]),
    /* de que lado fica a parede mais perto (na próxima faixa, se ela for a mais perto) e em que canto a faixa termina
       (1 = fundo à esquerda, 2 = fundo à direita, 3 = frente à direita, 4 = frente à esquerda) */
    SESENAO_(OU_(IGUAL_("rumoFaixa", 90), IGUAL_("rumoFaixa", -90)), [
      DEF_("ladoRef", V_("Y")), SE_(MENOR_(V_("sProx"), V_("sLado")), [DEF_("ladoRef", SOMA_(V_("Y"), L_(16)))]),
      SESENAO_(MENOR_(SUB_(V_("ladoRef"), L_(1.25)), SUB_(V_("paredeN"), V_("ladoRef"))),
        [SESENAO_(IGUAL_("rumoFaixa", 90), [DEF_("cantoFim", 3)], [DEF_("cantoFim", 4)])],
        [SESENAO_(IGUAL_("rumoFaixa", 90), [DEF_("cantoFim", 2)], [DEF_("cantoFim", 1)])])
    ], [
      DEF_("ladoRef", V_("X")), SE_(MENOR_(V_("sProx"), V_("sLado")), [DEF_("ladoRef", SOMA_(V_("X"), L_(16)))]),
      SESENAO_(MENOR_(SUB_(V_("ladoRef"), V_("paredeO")), SUB_(V_("paredeL"), V_("ladoRef"))),
        [SESENAO_(IGUAL_("rumoFaixa", 0), [DEF_("cantoFim", 1)], [DEF_("cantoFim", 4)])],
        [SESENAO_(IGUAL_("rumoFaixa", 0), [DEF_("cantoFim", 2)], [DEF_("cantoFim", 3)])])
    ]),
    DEF_("kk", 0),
    SE_(OU_(OU_(E_(IGUAL_("cantoFim", 1), IGUAL_("rec1", 1)), E_(IGUAL_("cantoFim", 2), IGUAL_("rec2", 1))),
            OU_(E_(IGUAL_("cantoFim", 3), IGUAL_("rec3", 1)), E_(IGUAL_("cantoFim", 4), IGUAL_("rec4", 1)))), [DEF_("kk", V_("kCanto"))]),
    SE_(MENOR_(V_("sProx"), V_("sLado")), [DEF_("sLado", V_("sProx"))]),
    /* eMin = até quantos cm da parede do fim o robô pode ir: 13,5 (a pá a 1,5 cm dela) ou mais longe se o canto tiver recipiente */
    DEF_("eMin", 13.5), SE_(MAIOR_(SUB_(V_("kk"), V_("sLado")), V_("eMin")), [DEF_("eMin", SUB_(V_("kk"), V_("sLado")))]),
    /* 1) anda rápido até o ultrassônico ver a parede a 14 cm (ou a eMin, se for mais longe);
          a conta de distância só serve de limite, para não sair por uma porta */
    DEF_("paredeMin", 14), SE_(MAIOR_(SUB_(V_("eMin"), L_(8)), L_(14)), [DEF_("paredeMin", SUB_(V_("eMin"), L_(8)))]),
    CHAMA_("limite_da_faixa"),
    SE_(MENOR_(V_("dist"), L_(0)), [DEF_("dist", 0)]),
    CHAMA_("anda_na_sala"),
    SE_(IGUAL_("motivo", 2), [CHAMA_("acerta_na_parede")]),
    /* passou por uma porta e viu fita: volta um pouco */
    SE_(MAIOR_(V_("motivo"), L_(2)), [DEF_("dist", -8), CHAMA_("anda_na_sala")]),
    /* 2) se a parede está ali, encosta devagar até a pá ficar a 1,5 cm dela: a vítima que estiver na frente
          fica apertada e sobe para dentro da pá. Depois recua para girar sem raspar */
    SE_(E_(MENOR_(V_("eMin"), L_(14)), MENOR_(DIST_(), L_(20))), [
      DEF_("velAntes", V_("vel")), DEF_("vel", 15),
      DEF_("paredeMin", 6), DEF_("dist", 14), CHAMA_("anda_na_sala"),
      DEF_("vel", V_("velAntes")),
      SE_(IGUAL_("motivo", 2), [CHAMA_("acerta_na_parede")]),
      SE_(MAIOR_(V_("motivo"), L_(2)), [DEF_("dist", -8), CHAMA_("anda_na_sala")]),
      SE_(MENOR_(DIST_(), L_(9)), [DEF_("dist", SUB_(DIST_(), L_(8.5))), CHAMA_("anda_na_sala")])
    ])
  ], ...col(2, 1.9));

  defineOuTroca("limite_da_faixa", [
    /* até onde a faixa pode ir pela conta: 22 cm antes da parede (se for uma porta, o ultrassônico não vê nada),
       ou eMin, se for mais */
    DEF_("sobra", 22), SE_(MAIOR_(V_("eMin"), V_("sobra")), [DEF_("sobra", V_("eMin"))]),
    SE_(IGUAL_("rumoFaixa", 0), [SESENAO_(MAIOR_(V_("paredeN"), L_(0)), [DEF_("dist", SUB_(SUB_(V_("paredeN"), V_("sobra")), V_("Y")))], [DEF_("dist", 140)])]),
    SE_(OU_(IGUAL_("rumoFaixa", 180), IGUAL_("rumoFaixa", -180)), [DEF_("dist", SUB_(V_("Y"), SOMA_(V_("sobra"), L_(1))))]),
    SE_(IGUAL_("rumoFaixa", 90), [SESENAO_(MENOR_(V_("paredeL"), L_(900)), [DEF_("dist", SUB_(SUB_(V_("paredeL"), V_("sobra")), V_("X")))], [DEF_("dist", 140)])]),
    SE_(IGUAL_("rumoFaixa", -90), [DEF_("dist", SUB_(SUB_(V_("X"), V_("paredeO")), V_("sobra")))])
  ], ...col(2, 2.6));

  defineOuTroca("acerta_na_parede", [
    /* chegou na parede: acerta a posição estimada com a medida do ultrassônico (sensor 8 cm à frente das rodas) */
    SE_(IGUAL_("rumoFaixa", 0), [SESENAO_(MAIOR_(V_("paredeN"), L_(0)), [DEF_("Y", SUB_(V_("paredeN"), SOMA_(DIST_(), L_(8))))],
                                                                         [DEF_("paredeN", SOMA_(V_("Y"), SOMA_(DIST_(), L_(8))))])]),
    SE_(OU_(IGUAL_("rumoFaixa", 180), IGUAL_("rumoFaixa", -180)), [DEF_("Y", SOMA_(DIST_(), L_(9.25)))]),
    SE_(E_(IGUAL_("rumoFaixa", 90), MENOR_(V_("paredeL"), L_(900))), [DEF_("X", SUB_(V_("paredeL"), SOMA_(DIST_(), L_(8))))]),
    SE_(IGUAL_("rumoFaixa", -90), [DEF_("X", SOMA_(V_("paredeO"), SOMA_(DIST_(), L_(8))))])
  ], ...col(2, 3.0));

  defineOuTroca("entrega_vitimas", [
    /* a pá continua abaixada, com as vítimas presas nela */
    SESENAO_(MAIOR_(V_("cantoVerde"), L_(0)), [DEF_("canto", V_("cantoVerde")), CHAMA_("vai_ao_canto")], [
      /* ainda não sabe onde fica a área verde: olha os cantos em volta da sala, começando pelo mais perto
         (1 = fundo à esquerda, 2 = fundo à direita, 3 = frente à direita, 4 = frente à esquerda) */
      DEF_("canto", 4),
      SE_(MAIOR_(V_("X"), DIV_(SOMA_(V_("paredeO"), V_("paredeL")), L_(2))), [DEF_("canto", 3)]),
      SE_(MAIOR_(V_("Y"), DIV_(V_("paredeN"), L_(2))), [SESENAO_(IGUAL_("canto", 3), [DEF_("canto", 2)], [DEF_("canto", 1)])]),
      DEF_("k", 0),
      ATE_(OU_(MAIOR_(V_("cantoVerde"), L_(0)), MAIOR_(V_("k"), L_(3))), [
        CHAMA_("vai_ao_canto"), CHAMA_("olha_canto"),
        SE_(IGUAL_("corCanto", 6), [DEF_("cantoVerde", V_("canto"))]),
        SE_(IGUAL_("corCanto", 9), [DEF_("cantoVermelho", V_("canto"))]),
        SE_(IGUAL_("cantoVerde", 0), [SOMAR_("canto", 1), SE_(MAIOR_(V_("canto"), L_(4)), [DEF_("canto", 1)]), MUDA_("k", 1)])
      ]),
      /* sem verde: a vermelha vale menos, mas vale */
      SE_(E_(IGUAL_("cantoVerde", 0), MAIOR_(V_("cantoVermelho"), L_(0))), [DEF_("canto", V_("cantoVermelho")), CHAMA_("vai_ao_canto")])
    ]),
    SE_(OU_(MAIOR_(V_("cantoVerde"), L_(0)), MAIOR_(V_("cantoVermelho"), L_(0))), [CHAMA_("solta_no_canto")])
  ], ...col(3, 0));

  defineOuTroca("vai_ao_canto", [
    /* para a dCanto (29 cm) das duas paredes do canto e vira de frente para ele (45°).
       A parede do fundo ou da frente fica em rumo 0 ou 180; a do lado, em 90 ou -90 */
    SE_(IGUAL_("canto", 1), [DEF_("destinoX", SOMA_(V_("paredeO"), V_("dCanto"))), DEF_("destinoY", SUB_(V_("paredeN"), V_("dCanto"))), DEF_("diagonal", -45)]),
    SE_(IGUAL_("canto", 2), [DEF_("destinoX", SUB_(V_("paredeL"), V_("dCanto"))), DEF_("destinoY", SUB_(V_("paredeN"), V_("dCanto"))), DEF_("diagonal", 45)]),
    SE_(IGUAL_("canto", 3), [DEF_("destinoX", SUB_(V_("paredeL"), V_("dCanto"))), DEF_("destinoY", SOMA_(V_("dCanto"), L_(1.25))), DEF_("diagonal", 135)]),
    SE_(IGUAL_("canto", 4), [DEF_("destinoX", SOMA_(V_("paredeO"), V_("dCanto"))), DEF_("destinoY", SOMA_(V_("dCanto"), L_(1.25))), DEF_("diagonal", -135)]),
    CHAMA_("vai_para_destino"),
    /* confere com o ultrassônico: fica a dCanto de cada parede (o sensor está 8 cm à frente das rodas) */
    SESENAO_(MENOR_(V_("canto"), L_(3)), [DEF_("rumo", 0)], [DEF_("rumo", 180)]),
    CHAMA_("vira_para_rumo"), CHAMA_("ajusta_parede"),
    SE_(IGUAL_("motivo", 2), [SESENAO_(MENOR_(V_("canto"), L_(3)), [DEF_("Y", SUB_(V_("paredeN"), V_("dCanto")))], [DEF_("Y", SOMA_(V_("dCanto"), L_(1.25)))])]),
    SESENAO_(OU_(IGUAL_("canto", 2), IGUAL_("canto", 3)), [DEF_("rumo", 90)], [DEF_("rumo", -90)]),
    CHAMA_("vira_para_rumo"), CHAMA_("ajusta_parede"),
    SE_(IGUAL_("motivo", 2), [SESENAO_(OU_(IGUAL_("canto", 2), IGUAL_("canto", 3)), [DEF_("X", SUB_(V_("paredeL"), V_("dCanto")))], [DEF_("X", SOMA_(V_("paredeO"), V_("dCanto")))])]),
    DEF_("rumo", V_("diagonal")), CHAMA_("vira_para_rumo")
  ], ...col(3, 0.8));

  defineOuTroca("ajusta_parede", [
    /* anda para a frente ou de ré até o ultrassônico marcar alvoParede (21 cm); se não vê parede perto (porta), não mexe */
    DEF_("motivo", 0),
    SE_(MENOR_(DIST_(), L_(45)), [
      f_("sen_zerar_cron"),
      ATE_(OU_(MENOR_(MULT_(SUB_(DIST_(), V_("alvoParede")), SUB_(DIST_(), V_("alvoParede"))), L_(0.4)), MAIOR_(CRON_(), L_(4))), [
        DEF_("giro", MULT_(SUB_(DIST_(), V_("alvoParede")), L_(2))),
        SE_(MAIOR_(V_("giro"), L_(20)), [DEF_("giro", 20)]),
        SE_(MENOR_(V_("giro"), L_(-20)), [DEF_("giro", -20)]),
        SE_(E_(MAIOR_(V_("giro"), L_(0)), MENOR_(V_("giro"), L_(5))), [DEF_("giro", 5)]),
        SE_(E_(MENOR_(V_("giro"), L_(0)), MAIOR_(V_("giro"), L_(-5))), [DEF_("giro", -5)]),
        DUAL_(V_("giro"), V_("giro"))
      ]),
      f_("mov_parar"), DEF_("motivo", 2)
    ])
  ], ...col(3, 1.25));

  defineOuTroca("mede_sala", [
    /* olha para a esquerda, a direita e o fundo e marca onde ficam as paredes.
       Leitura muito longa = uma porta na frente: anda 20 cm para dentro e mede de novo */
    DEF_("paredeO", -999), DEF_("paredeL", 999), DEF_("paredeN", 0),
    f_("ctl_repetir", { N: L_(2) }, [[
      SE_(MENOR_(V_("paredeO"), L_(-900)), [DEF_("rumo", -90), CHAMA_("vira_para_rumo"),
        SE_(MENOR_(DIST_(), L_(125)), [DEF_("paredeO", SUB_(V_("X"), SOMA_(DIST_(), L_(8))))])]),
      SE_(MAIOR_(V_("paredeL"), L_(900)), [DEF_("rumo", 90), CHAMA_("vira_para_rumo"),
        SE_(MENOR_(DIST_(), L_(125)), [DEF_("paredeL", SOMA_(V_("X"), SOMA_(DIST_(), L_(8))))])]),
      SE_(IGUAL_("paredeN", 0), [DEF_("rumo", 0), CHAMA_("vira_para_rumo"),
        SE_(MENOR_(DIST_(), L_(125)), [DEF_("paredeN", SOMA_(V_("Y"), SOMA_(DIST_(), L_(8))))])]),
      SE_(OU_(OU_(MENOR_(V_("paredeO"), L_(-900)), MAIOR_(V_("paredeL"), L_(900))), IGUAL_("paredeN", 0)), [
        DEF_("rumo", 0), CHAMA_("vira_para_rumo"), DEF_("usaParede", 1), DEF_("paredeMin", 30), DEF_("olhaFita", 0),
        DEF_("dist", 20), CHAMA_("anda_na_sala")])
    ]]),
    /* se ainda faltou alguma, supõe a sala de 120 × 90 */
    SE_(MENOR_(V_("paredeO"), L_(-900)), [DEF_("paredeO", SUB_(V_("paredeL"), L_(117.5)))]),
    SE_(MAIOR_(V_("paredeL"), L_(900)), [DEF_("paredeL", SOMA_(V_("paredeO"), L_(117.5)))]),
    SE_(IGUAL_("paredeN", 0), [DEF_("paredeN", 88.75)])
  ], ...col(4, 3.2));

  defineOuTroca("acha_recipientes", [
    /* Nível 2: visita os cantos (começando pelo da frente mais perto) até achar os dois recipientes.
       Enquanto não sabe, trata todo canto como se tivesse recipiente */
    CHAMA_("mede_sala"),
    DEF_("rec1", 1), DEF_("rec2", 1), DEF_("rec3", 1), DEF_("rec4", 1),
    DEF_("canto", 4), SE_(MAIOR_(SUB_(V_("X"), V_("paredeO")), SUB_(V_("paredeL"), V_("X"))), [DEF_("canto", 3)]),
    DEF_("nRec", 0), DEF_("k", 0),
    ATE_(OU_(MAIOR_(V_("nRec"), L_(1)), MAIOR_(V_("k"), L_(3))), [
      CHAMA_("vai_ao_canto"), CHAMA_("olha_canto"),
      DEF_("achou", 0), SE_(IGUAL_("corCanto", 6), [DEF_("achou", 1), SOMAR_("nRec", 1),
        SE_(IGUAL_("cantoVerde", 0), [DEF_("cantoVerde", V_("canto"))])]),
      SE_(IGUAL_("canto", 1), [DEF_("rec1", V_("achou"))]),
      SE_(IGUAL_("canto", 2), [DEF_("rec2", V_("achou"))]),
      SE_(IGUAL_("canto", 3), [DEF_("rec3", V_("achou"))]),
      SE_(IGUAL_("canto", 4), [DEF_("rec4", V_("achou"))]),
      SOMAR_("canto", 1), SE_(MAIOR_(V_("canto"), L_(4)), [DEF_("canto", 1)]), MUDA_("k", 1)
    ]),
    /* os cantos que não visitou não têm recipiente (já achou os dois) */
    f_("ctl_repetir", { N: SUB_(L_(4), V_("k")) }, [[
      SE_(IGUAL_("canto", 1), [DEF_("rec1", 0)]), SE_(IGUAL_("canto", 2), [DEF_("rec2", 0)]),
      SE_(IGUAL_("canto", 3), [DEF_("rec3", 0)]), SE_(IGUAL_("canto", 4), [DEF_("rec4", 0)]),
      SOMAR_("canto", 1), SE_(MAIOR_(V_("canto"), L_(4)), [DEF_("canto", 1)])
    ]])
  ], ...col(4, 3.9));

  defineOuTroca("olha_canto", [
    DEF_("usaParede", 1), DEF_("paredeMin", 4), DEF_("olhaFita", 0), DEF_("corCanto", 0),
    SESENAO_(IGUAL_("nivel", 1), [
      /* Nível 1: entra 17 cm na diagonal; se o canto tiver área de resgate, os sensores de cor ficam em cima dela */
      DEF_("dist", 17), CHAMA_("anda_na_sala"),
      SE_(OU_(COR_("D", "6"), COR_("E", "6")), [DEF_("corCanto", 6)]),
      SE_(OU_(COR_("D", "9"), COR_("E", "9")), [DEF_("corCanto", 9)]),
      DEF_("dist", -17), CHAMA_("anda_na_sala")
    ], [
      /* Nível 2: anda 12 cm devagar. Sem recipiente, o ultrassônico (que olha o canto por cima da borda) diminui 12 cm;
         com recipiente, a pá encosta na borda depois de uns 7 cm e o robô para. De ré, volta o quanto andou de verdade */
      DEF_("leitura0", DIST_()), DEF_("velAntes", V_("vel")), DEF_("vel", 15),
      DEF_("usaParede", 0), DEF_("dist", 12), CHAMA_("anda_na_sala"),
      f_("ctl_esperar", { SEG: L_(0.2) }),
      SE_(MAIOR_(DIST_(), SUB_(V_("leitura0"), L_(9.5))), [DEF_("corCanto", 6)]),
      /* volta o quanto andou de verdade, mais 2 cm de folga para poder girar */
      DEF_("dist", NEG_(SOMA_(SUB_(V_("leitura0"), DIST_()), L_(2)))), CHAMA_("anda_na_sala"),
      DEF_("vel", V_("velAntes"))
    ])
  ], ...col(3, 1.75));

  defineOuTroca("solta_no_canto", [
    /* chega com a boca da pá a ~1 cm da borda do recipiente (ou da beirada da área, no Nível 1) e levanta a pá:
       as vítimas caem uns 5 cm lá dentro. Depois volta ao ponto do canto e abaixa a pá de novo */
    DEF_("usaParede", 0), DEF_("olhaFita", 0), DEF_("velAntes", V_("vel")), DEF_("vel", 15),
    DEF_("dist", 7), CHAMA_("anda_na_sala"),
    CHAMA_("garra_fechar"), f_("som_bip", { NOTA: L_(88), SEG: L_(0.15) }), f_("ctl_esperar", { SEG: L_(0.3) }),
    DEF_("dist", -7), CHAMA_("anda_na_sala"),
    DEF_("vel", V_("velAntes")),
    SE_(MENOR_(V_("ciclo"), V_("ciclos")), [CHAMA_("garra_abrir")])
  ], ...col(3, 2.2));

  defineOuTroca("procura_saida", [
    CHAMA_("garra_fechar"),
    /* vai para o meio da sala e dá uma volta olhando com o ultrassônico: onde a distância "some" tem uma porta */
    DEF_("destinoX", DIV_(SOMA_(V_("paredeO"), V_("paredeL")), L_(2))), DEF_("destinoY", DIV_(V_("paredeN"), L_(2))),
    CHAMA_("vai_para_destino"),
    CHAMA_("confere_posicao"),
    DEF_("rumo", 0), CHAMA_("vira_para_rumo"),
    /* começa olhando para uma parede, para nenhuma porta ficar cortada no começo e no fim da volta.
       Os ângulos da volta são os do giroscópio; tirando o "ajuste" eles viram rumos da sala */
    ATE_(MENOR_(DIST_(), L_(85)), [DUAL_(10, -10)]),
    DEF_("voltas", 0), DEF_("anguloAntes", YAW_()), DEF_("angInicio", YAW_()), DEF_("giro", 0),
    DEF_("emVao", 0), DEF_("nVaos", 0),
    ATE_(MAIOR_(V_("giro"), L_(362)), [
      DUAL_(10, -10),
      SE_(MENOR_(YAW_(), SUB_(V_("anguloAntes"), L_(180))), [SOMAR_("voltas", 360)]),
      DEF_("anguloAntes", YAW_()),
      DEF_("giro", SUB_(SOMA_(V_("anguloAntes"), V_("voltas")), V_("angInicio"))),
      SESENAO_(MAIOR_(DIST_(), L_(85)),
        [SE_(IGUAL_("emVao", 0), [DEF_("emVao", 1), DEF_("vaoIni", V_("giro"))])],
        [SE_(IGUAL_("emVao", 1), [DEF_("emVao", 0),
          SE_(MAIOR_(SUB_(V_("giro"), V_("vaoIni")), L_(6)), [
            SOMAR_("nVaos", 1),
            SESENAO_(IGUAL_("nVaos", 1),
              [DEF_("vao1", SUB_(SOMA_(V_("angInicio"), DIV_(SOMA_(V_("vaoIni"), V_("giro")), L_(2))), V_("ajuste")))],
              [SE_(IGUAL_("nVaos", 2), [DEF_("vao2", SUB_(SOMA_(V_("angInicio"), DIV_(SOMA_(V_("vaoIni"), V_("giro")), L_(2))), V_("ajuste")))])])
          ])
        ])])
    ]),
    f_("mov_parar"),
    /* a entrada fica na parede de trás (rumo 180): tenta primeiro a porta mais longe dela */
    SE_(MAIOR_(V_("nVaos"), L_(1)), [
      DEF_("rumo", V_("vao1")), DEF_("erroRumo", SUB_(V_("vao1"), L_(180))), CHAMA_("normaliza_erro"), DEF_("sobra", MULT_(V_("erroRumo"), V_("erroRumo"))),
      DEF_("erroRumo", SUB_(V_("vao2"), L_(180))), CHAMA_("normaliza_erro"),
      SE_(MAIOR_(MULT_(V_("erroRumo"), V_("erroRumo")), V_("sobra")), [DEF_("giro", V_("vao1")), DEF_("vao1", V_("vao2")), DEF_("vao2", V_("giro"))])
    ]),
    DEF_("saiu", 0),
    SE_(MAIOR_(V_("nVaos"), L_(0)), [DEF_("rumo", V_("vao1")), CHAMA_("tenta_porta")]),
    SE_(E_(IGUAL_("saiu", 0), MAIOR_(V_("nVaos"), L_(1))), [DEF_("rumo", V_("vao2")), CHAMA_("tenta_porta")]),
    SE_(IGUAL_("saiu", 0), [f_("luz_texto", { TXT: L_("Nao achei a saida") })])
  ], ...col(4, 0));

  defineOuTroca("confere_posicao", [
    /* olha as quatro paredes e corrige a posição estimada; leitura muito diferente do esperado (uma porta) não conta */
    DEF_("rumo", 0), CHAMA_("vira_para_rumo"), DEF_("sobra", SOMA_(DIST_(), L_(8))),
    SE_(MENOR_(MULT_(SUB_(V_("sobra"), SUB_(V_("paredeN"), V_("Y"))), SUB_(V_("sobra"), SUB_(V_("paredeN"), V_("Y")))), L_(225)), [DEF_("Y", SUB_(V_("paredeN"), V_("sobra")))]),
    DEF_("rumo", 90), CHAMA_("vira_para_rumo"), DEF_("sobra", SOMA_(DIST_(), L_(8))),
    SE_(MENOR_(MULT_(SUB_(V_("sobra"), SUB_(V_("paredeL"), V_("X"))), SUB_(V_("sobra"), SUB_(V_("paredeL"), V_("X")))), L_(225)), [DEF_("X", SUB_(V_("paredeL"), V_("sobra")))]),
    DEF_("rumo", 180), CHAMA_("vira_para_rumo"), DEF_("sobra", SOMA_(DIST_(), L_(8))),
    SE_(MENOR_(MULT_(SUB_(V_("sobra"), SUB_(V_("Y"), L_(1.25))), SUB_(V_("sobra"), SUB_(V_("Y"), L_(1.25)))), L_(225)), [DEF_("Y", SOMA_(V_("sobra"), L_(1.25)))]),
    DEF_("rumo", -90), CHAMA_("vira_para_rumo"), DEF_("sobra", SOMA_(DIST_(), L_(8))),
    SE_(MENOR_(MULT_(SUB_(V_("sobra"), SUB_(V_("X"), V_("paredeO"))), SUB_(V_("sobra"), SUB_(V_("X"), V_("paredeO")))), L_(225)), [DEF_("X", SOMA_(V_("paredeO"), V_("sobra")))]),
  ], ...col(4, 0.8));

  defineOuTroca("normaliza_erro", [
    SE_(MAIOR_(V_("erroRumo"), L_(180)), [SOMAR_("erroRumo", -360)]),
    SE_(MENOR_(V_("erroRumo"), L_(-180)), [SOMAR_("erroRumo", 360)]),
    SE_(MAIOR_(V_("erroRumo"), L_(180)), [SOMAR_("erroRumo", -360)]),
    SE_(MENOR_(V_("erroRumo"), L_(-180)), [SOMAR_("erroRumo", 360)])
  ], ...col(4, 1.2));

  defineOuTroca("tenta_porta", [
    /* 1) em que parede está o vão? a do rumo reto mais perto do ângulo em que ele apareceu */
    DEF_("erroRumo", V_("rumo")), CHAMA_("normaliza_erro"), DEF_("angPorta", V_("erroRumo")),
    SESENAO_(MENOR_(MULT_(V_("angPorta"), V_("angPorta")), L_(2025)), [DEF_("rumoPorta", 0)], [
      SESENAO_(MAIOR_(MULT_(V_("angPorta"), V_("angPorta")), L_(18225)), [DEF_("rumoPorta", 180)], [
        SESENAO_(MAIOR_(V_("angPorta"), L_(0)), [DEF_("rumoPorta", 90)], [DEF_("rumoPorta", -90)])])]),
    /* 2) onde fica o meio do vão: distância até a parede × tangente do ângulo (visto do meio da sala) */
    DEF_("erroRumo", SUB_(V_("angPorta"), V_("rumoPorta"))), CHAMA_("normaliza_erro"),
    DEF_("angTan", V_("erroRumo")), CHAMA_("tangente"),
    SE_(IGUAL_("rumoPorta", 0), [DEF_("destinoX", SOMA_(V_("X"), MULT_(SUB_(V_("paredeN"), V_("Y")), V_("tg")))), DEF_("destinoY", SUB_(V_("paredeN"), L_(28)))]),
    SE_(IGUAL_("rumoPorta", 180), [DEF_("destinoX", SUB_(V_("X"), MULT_(SUB_(V_("Y"), L_(1.25)), V_("tg")))), DEF_("destinoY", 29.25)]),
    SE_(IGUAL_("rumoPorta", 90), [DEF_("destinoY", SUB_(V_("Y"), MULT_(SUB_(V_("paredeL"), V_("X")), V_("tg")))), DEF_("destinoX", SUB_(V_("paredeL"), L_(28)))]),
    SE_(IGUAL_("rumoPorta", -90), [DEF_("destinoY", SOMA_(V_("Y"), MULT_(SUB_(V_("X"), V_("paredeO")), V_("tg")))), DEF_("destinoX", SOMA_(V_("paredeO"), L_(28)))]),
    /* 3) vai até 28 cm da parede, bem na frente do vão, mira o meio da porta de perto e anda reto até a fita */
    CHAMA_("vai_para_destino"),
    DEF_("rumo", V_("rumoPorta")), CHAMA_("vira_para_rumo"),
    CHAMA_("mira_a_porta"),
    DEF_("usaParede", 1), DEF_("paredeMin", 5), DEF_("olhaFita", 1),
    DEF_("dist", 45), CHAMA_("anda_na_sala"),
    SESENAO_(IGUAL_("motivo", 3), [
      /* fita preta: é a saída! passa por cima dela; se a linha não estiver embaixo, gira um pouco para cada lado até achar */
      DEF_("saiu", 1), f_("som_bip", { NOTA: L_(79), SEG: L_(0.15) }),
      ANDA_(4), DEF_("achou", 0), SE_(ALGUM_PRETO_(), [DEF_("achou", 1)])].concat([
      SE_(IGUAL_("achou", 0), VARRE_(-100)),
      SE_(IGUAL_("achou", 0), VARRE_(100))
    ]), [
      /* fita prata (a entrada) ou parede: não é a saída, volta para o meio da sala (com folga para girar) */
      DEF_("olhaFita", 0), DEF_("usaParede", 0), DEF_("dist", NEG_(SOMA_(V_("andou"), L_(6)))), CHAMA_("anda_na_sala"),
      DEF_("destinoX", DIV_(SOMA_(V_("paredeO"), V_("paredeL")), L_(2))), DEF_("destinoY", DIV_(V_("paredeN"), L_(2))),
      CHAMA_("vai_para_destino")
    ])
  ], ...col(4, 1.6));

  defineOuTroca("mira_a_porta", [
    /* de frente para a porta: gira de -34° a +34° olhando com o ultrassônico. Onde a distância "some" é o vão.
       Com as duas bordas dá para saber o quanto o robô está fora do meio e andar de lado para acertar */
    DEF_("bordaA", 999), DEF_("bordaB", -999), DEF_("leitura0", 0),
    DEF_("rumo", SUB_(V_("rumoPorta"), L_(34))), CHAMA_("vira_para_rumo"),
    DEF_("rumo", SOMA_(V_("rumoPorta"), L_(34))), DEF_("erroRumo", 99),
    ATE_(MENOR_(V_("erroRumo"), L_(1)), [
      CHAMA_("calcula_erro_rumo"), DUAL_(12, -12),
      SESENAO_(MAIOR_(DIST_(), L_(55)), [
        DEF_("angTan", SUB_(V_("rumo"), V_("erroRumo"))),
        SE_(MENOR_(V_("angTan"), V_("bordaA")), [DEF_("bordaA", V_("angTan"))]),
        SE_(MAIOR_(V_("angTan"), V_("bordaB")), [DEF_("bordaB", V_("angTan"))])
      ], [
        /* está vendo a parede: guarda a menor distância, que é a perpendicular */
        SE_(OU_(IGUAL_("leitura0", 0), MENOR_(DIST_(), V_("leitura0"))), [DEF_("leitura0", DIST_())])
      ])
    ]),
    f_("mov_parar"),
    /* achou as duas bordas do vão? então anda de lado até o meio dele */
    SE_(E_(MENOR_(V_("bordaA"), L_(900)), MAIOR_(SUB_(V_("bordaB"), V_("bordaA")), L_(4))), [
      DEF_("angTan", SUB_(DIV_(SOMA_(V_("bordaA"), V_("bordaB")), L_(2)), V_("rumoPorta"))), CHAMA_("tangente"),
      SE_(IGUAL_("leitura0", 0), [DEF_("leitura0", 20)]),
      DEF_("lateral", MULT_(V_("leitura0"), V_("tg"))),
      SE_(MAIOR_(MULT_(V_("lateral"), V_("lateral")), L_(4)), [
        DEF_("usaParede", 0), DEF_("olhaFita", 0),
        SESENAO_(MAIOR_(V_("lateral"), L_(0)),
          [DEF_("rumo", SOMA_(V_("rumoPorta"), L_(90))), DEF_("dist", V_("lateral"))],
          [DEF_("rumo", SUB_(V_("rumoPorta"), L_(90))), DEF_("dist", NEG_(V_("lateral")))]),
        SE_(MAIOR_(V_("rumo"), L_(180)), [SOMAR_("rumo", -360)]),
        SE_(MENOR_(V_("rumo"), L_(-180)), [SOMAR_("rumo", 360)]),
        SE_(MAIOR_(V_("dist"), L_(20)), [DEF_("dist", 20)]),
        CHAMA_("vira_para_rumo"), CHAMA_("anda_na_sala")
      ])
    ]),
    DEF_("rumo", V_("rumoPorta")), CHAMA_("vira_para_rumo")
  ], ...col(5, 1.8));

  defineOuTroca("tangente", [
    /* tangente aproximada do ângulo angTan (em graus), pela série de Taylor: boa até uns 55° */
    DEF_("rad", MULT_(V_("angTan"), L_(0.017453))),
    SE_(MAIOR_(V_("rad"), L_(1)), [DEF_("rad", 1)]),
    SE_(MENOR_(V_("rad"), L_(-1)), [DEF_("rad", -1)]),
    DEF_("tg", MULT_(V_("rad"), SOMA_(L_(1), MULT_(MULT_(V_("rad"), V_("rad")),
      SOMA_(L_(0.3333), MULT_(MULT_(V_("rad"), V_("rad")), SOMA_(L_(0.1333), MULT_(MULT_(V_("rad"), V_("rad")), L_(0.054)))))))))
  ], ...col(4, 2.5));
}
