"use strict";
/* =======================================================================
   1. CATALOGO DE BLOCOS  (palavras-bloco do SPIKE Prime, do EV3 Classroom e da biblioteca Arduino da bancada)
   Os blocos são os mesmos por dentro; cada plataforma troca o texto, as portas e o que aparece na paleta.
   Menus e valores padrão podem ser funções: são calculados na hora, pela plataforma atual.
   ======================================================================= */
const opSentido= () => [["sentido horário","clockwise"],["sentido anti-horário","counterclockwise"]];

/* construtores de pedacos de bloco */
const T = t => ({ k:"t", t });
const N = (nome, pad) => ({ k:"n", nome, pad: String(pad) });
const S = (nome, pad) => ({ k:"s", nome, pad: String(pad) });
const M = (nome, ops, pad) => ({ k:"m", nome, ops, pad: pad !== undefined ? pad : (typeof ops === "function" ? () => ops()[0][1] : ops[0][1]) });
const B = nome => ({ k:"b", nome });
const VARM = nome => ({ k:"v", nome });
const PROCM = nome => ({ k:"p", nome });
const valorDe = v => typeof v === "function" ? v() : v;

const CAT = [
  { id:"eventos",   nome:"Eventos",     cor:"var(--c-evento)" },
  { id:"movimento", nome:"Movimento",   cor:"var(--c-movimento)" },
  { id:"motores",   nome:"Motores",     cor:"var(--c-motor)" },
  { id:"luz",       nome:"Luz",         cor:"var(--c-luz)" },
  { id:"som",       nome:"Som",         cor:"var(--c-som)" },
  { id:"sensores",  nome:"Sensores",    cor:"var(--c-sensor)" },
  { id:"controle",  nome:"Controle",    cor:"var(--c-controle)" },
  { id:"operadores",nome:"Operadores",  cor:"var(--c-operador)" },
  { id:"variaveis", nome:"Variáveis",   cor:"var(--c-variavel)" },
  { id:"meus",      nome:"Meus Blocos", cor:"var(--c-meus)" }
];
const NOME_CAT = { ev3: { luz: "Tela" }, arduino: { luz: "Serial", motores: "Motores e servo" } };
const nomeCat = c => (NOME_CAT[PLAT.id] && NOME_CAT[PLAT.id][c.id]) || c.nome;
const CORCAT = {}; CAT.forEach(c => CORCAT[c.id] = c.cor);
CORCAT.desconhecido = "var(--c-desconhecido)";

const SPEC = {};
function D(op, cat, forma, partes) { SPEC[op] = { op, cat, forma, partes }; }
/* a mesma operação com outro texto numa plataforma */
const VARIANTES = { ev3: {}, arduino: {} };
function V(plat, op, partes) { VARIANTES[plat][op] = Object.assign({}, SPEC[op], { partes }); }
function specDe(op) { const v = VARIANTES[PLAT.id] && VARIANTES[PLAT.id][op]; return v || SPEC[op] || SPEC.desconhecido; }

const UN_MOV = () => PLAT.unidades;
const UN_MOT = () => PLAT.id === "arduino" ? [["segundos","seconds"]] : [["rotações","rotations"],["graus","degrees"],["segundos","seconds"]];
const UN_DIST = () => PLAT.id === "spike" ? [["cm","cm"],["polegadas","inches"],["%","%"]] : PLAT.id === "ev3" ? [["cm","cm"],["polegadas","inches"]] : [["cm","cm"]];
const CMP = [["menor que","<"],["maior que",">"],["igual a","="]];
const padPar = () => PLAT.id === "spike" ? "AB" : PLAT.par.join("+");
const padPa = () => PLAT.pa;
const padCorDir = () => portaDoTipo("cor", "dir");
const padDist = () => portaDoTipo("dist");
const padForca = () => PLAT.id === "spike" ? "B" : PLAT.portasSensor[0];
const opCores = () => PLAT.cores;
const padPreto = () => PLAT.cor.preto;
const DIRS = [["para frente","forward"],["para trás","back"],["à esquerda","left"],["à direita","right"]];

/* --- eventos --- */
D("ev_inicio","eventos","chapeu",[T("quando o programa iniciar")]);
D("ev_botao","eventos","chapeu",[T("quando o botão central for pressionado")]);

/* --- movimento --- */
D("mov_par","movimento","stack",[T("definir motores de movimento para"), M("PAR", paresDe, padPar)]);
D("mov_mover","movimento","stack",[T("mover"), M("DIR", DIRS), T("por"), N("VAL","10"), M("UN", UN_MOV, () => PLAT.unidades[0][1])]);
D("mov_iniciar","movimento","stack",[T("começar a mover"), M("DIR", DIRS)]);
D("mov_esterco","movimento","stack",[T("mover com direção"), N("DIR","0"), T("por"), N("VAL","10"), M("UN", UN_MOV, () => PLAT.unidades[0][1])]);
D("mov_iniciar_esterco","movimento","stack",[T("começar a mover com direção"), N("DIR","0")]);
D("mov_dual","movimento","stack",[T("começar a mover: esquerda"), N("ESQ","50"), T("% direita"), N("DIR","50"), T("%")]);
D("mov_parar","movimento","stack",[T("parar de mover")]);
D("mov_vel","movimento","stack",[T("definir velocidade de movimento para"), N("VAL","50"), T("%")]);
D("mov_rot","movimento","stack",[T("definir rotação da roda para"), N("VAL","17.6"), T("cm")]);

/* --- motores --- */
D("mot_girar","motores","stack",[T("motor"), M("P", opMotor, padPa), T("girar"), M("SENT", opSentido()),
  T("por"), N("VAL","1"), M("UN", UN_MOT, () => UN_MOT()[0][1])]);
D("mot_iniciar","motores","stack",[T("motor"), M("P", opMotor, padPa), T("começar a girar"), M("SENT", opSentido())]);
D("mot_potencia","motores","stack",[T("motor"), M("P", opMotor, padPa), T("começar a girar com"), N("VAL","50"), T("%")]);
D("mot_parar","motores","stack",[T("motor"), M("P", opMotor, padPa), T("parar")]);
D("mot_vel","motores","stack",[T("motor"), M("P", opMotor, padPa), T("definir velocidade para"), N("VAL","75"), T("%")]);
D("mot_ir","motores","stack",[T("motor"), M("P", opMotor, padPa), T("ir para a posição"), N("VAL","0"), T("graus")]);
D("mot_zerar","motores","stack",[T("motor"), M("P", opMotor, padPa), T("zerar a contagem")]);
D("mot_pos","motores","rep",[T("posição do motor"), M("P", opMotor, padPa)]);
D("mot_velr","motores","rep",[T("velocidade do motor"), M("P", opMotor, padPa)]);

/* --- luz --- */
D("luz_texto","luz","stack",[T("escrever"), S("TXT","Oi")]);
D("luz_limpar","luz","stack",[T("apagar a tela")]);
D("luz_pixel","luz","stack",[T("acender pixel x"), N("X","3"), T("y"), N("Y","3"), T("com"), N("B","100"), T("% de brilho")]);
D("luz_cor","luz","stack",[T("definir a cor do hub para"), M("COR", CORES_SPIKE, "6")]);
D("luz_status","luz","stack",[T("luz de status"), M("COR", [["apagada","0"],["verde","1"],["vermelha","2"],["laranja","3"],["verde piscando","4"],["vermelha piscando","5"],["laranja piscando","6"]], "1")]);

/* --- som --- */
D("som_bip","som","stack",[T("tocar o bipe"), N("NOTA","60"), T("por"), N("SEG","0.2"), T("segundos")]);

/* --- sensores --- */
D("sen_ecor","sensores","bool",[M("P", opSensor, padCorDir), T("é a cor"), M("COR", opCores, padPreto), T("?")]);
D("sen_cor","sensores","rep",[T("cor em"), M("P", opSensor, padCorDir)]);
D("sen_reflexo","sensores","rep",[T("luz refletida em"), M("P", opSensor, padCorDir)]);
D("sen_ereflexo","sensores","bool",[M("P", opSensor, padCorDir), T("luz refletida"), M("CMP", CMP, "<"), N("VAL","50"), T("%?")]);
D("sen_cru","sensores","rep",[T("valor bruto"),
  M("CANAL",[["vermelho","r"],["verde","g"],["azul","b"]],"r"), T("em"), M("P", opSensor, padCorDir)]);
D("sen_edist","sensores","bool",[T("distância em"), M("P", opSensor, padDist), M("CMP", CMP, "<"), N("VAL","10"), M("UN", UN_DIST, "cm"), T("?")]);
D("sen_dist","sensores","rep",[T("distância em"), M("P", opSensor, padDist), M("UN", UN_DIST, "cm")]);
D("sen_forca","sensores","bool",[T("sensor de força"), M("P", opSensor, padForca), T("pressionado?")]);
D("sen_forcar","sensores","rep",[T("força em"), M("P", opSensor, padForca), T("%")]);
D("sen_angulo","sensores","rep",[T("ângulo de"),
  M("EIXO",[["guinada","yaw"],["arfagem","pitch"],["rolagem","roll"]],"yaw")]);
D("sen_zerar_ang","sensores","stack",[T("zerar o ângulo de guinada")]);
D("sen_inclinado","sensores","bool",[T("o hub está"),
  M("O",[["para frente","frente"],["para trás","tras"],["à esquerda","esq"],["à direita","dir"],["nivelado","nivelado"]],"frente"), T("?")]);
D("sen_cron","sensores","rep",[T("cronômetro")]);
D("sen_zerar_cron","sensores","stack",[T("zerar o cronômetro")]);

/* --- controle --- */
D("ctl_esperar","controle","stack",[T("esperar"), N("SEG","1"), T("segundos")]);
D("ctl_repetir","controle","c",[T("repetir"), N("N","10"), T("vezes")]);
D("ctl_sempre","controle","c",[T("sempre")]);
D("ctl_se","controle","c",[T("se"), B("COND"), T("então")]);
D("ctl_sesenao","controle","c2",[T("se"), B("COND"), T("então")]);
D("ctl_esperar_ate","controle","stack",[T("esperar até"), B("COND")]);
D("ctl_repetir_ate","controle","c",[T("repetir até"), B("COND")]);
D("ctl_parar","controle","cap",[T("parar"),
  M("ALVO",[["tudo","all"],["este script","this script"],["outros scripts","other scripts in sprite"]],"all")]);

/* --- operadores --- */
D("op_soma","operadores","rep",[N("A","0"), T("+"), N("B","0")]);
D("op_sub","operadores","rep",[N("A","0"), T("−"), N("B","0")]);
D("op_mult","operadores","rep",[N("A","0"), T("×"), N("B","0")]);
D("op_div","operadores","rep",[N("A","0"), T("÷"), N("B","0")]);
D("op_menor","operadores","bool",[N("A","0"), T("<"), N("B","50")]);
D("op_igual","operadores","bool",[N("A","0"), T("="), N("B","50")]);
D("op_maior","operadores","bool",[N("A","0"), T(">"), N("B","50")]);
D("op_e","operadores","bool",[B("A"), T("e"), B("B")]);
D("op_ou","operadores","bool",[B("A"), T("ou"), B("B")]);
D("op_nao","operadores","bool",[T("não"), B("A")]);
D("op_aleatorio","operadores","rep",[T("número aleatório entre"), N("A","1"), T("e"), N("B","10")]);
D("op_arred","operadores","rep",[T("arredondar"), N("A","0")]);
D("op_mod","operadores","rep",[N("A","0"), T("resto de"), N("B","2")]);
D("op_abs","operadores","rep",[T("valor absoluto de"), N("A","0")]);

/* --- variaveis --- */
D("var_def","variaveis","stack",[T("definir"), VARM("VAR"), T("para"), N("VAL","0")]);
D("var_muda","variaveis","stack",[T("mudar"), VARM("VAR"), T("por"), N("VAL","1")]);
D("var_ler","variaveis","rep",[VARM("VAR")]);

/* --- meus blocos --- */
D("meu_def","meus","chapeu",[T("definir"), PROCM("NOME")]);
D("meu_chama","meus","stack",[PROCM("NOME")]);

/* bloco coringa para opcodes que a bancada ainda nao executa */
D("desconhecido","desconhecido","stack",[T("?")]);

/* ---- EV3 Classroom: portas 1 a 4 para sensores, giroscópio numa porta, tela do bloco EV3 ---- */
V("ev3", "ev_botao", [T("quando o botão central do bloco EV3 for pressionado")]);
V("ev3", "luz_texto", [T("escrever"), S("TXT","EV3"), T("na linha"), N("LINHA","1")]);
V("ev3", "luz_limpar", [T("limpar a tela")]);
V("ev3", "sen_forca", [T("sensor de toque"), M("P", opSensor, "1"), T("pressionado?")]);
V("ev3", "sen_angulo", [T("ângulo do giroscópio em"), M("P", opSensor, () => PLAT.giro)]);
V("ev3", "sen_zerar_ang", [T("zerar o ângulo do giroscópio em"), M("P", opSensor, () => PLAT.giro)]);
V("ev3", "sen_dist", [T("distância do ultrassônico em"), M("P", opSensor, padDist), M("UN", UN_DIST, "cm")]);
V("ev3", "sen_edist", [T("ultrassônico em"), M("P", opSensor, padDist), M("CMP", CMP, "<"), N("VAL","10"), M("UN", UN_DIST, "cm"), T("?")]);
V("ev3", "mov_dual", [T("começar a mover com velocidade esquerda"), N("ESQ","50"), T("% direita"), N("DIR","50"), T("%")]);
V("ev3", "mot_potencia", [T("motor"), M("P", opMotor, padPa), T("começar a girar com velocidade"), N("VAL","50"), T("%")]);
V("ev3", "mot_zerar", [T("motor"), M("P", opMotor, padPa), T("zerar o contador de rotação")]);

/* ---- Arduino: funções da biblioteca da bancada (viram C++ ao baixar o .ino) ---- */
V("arduino", "ev_inicio", [T("quando o Arduino ligar (setup)")]);
V("arduino", "ev_botao", [T("quando o botão do pino 2 for apertado")]);
V("arduino", "mov_par", [T("usar os motores"), M("PAR", paresDe, padPar), T("para andar")]);
V("arduino", "mov_mover", [T("andar"), M("DIR", DIRS), T("por"), N("VAL","10"), M("UN", UN_MOV, "cm"), T("(pelo tempo calibrado)")]);
V("arduino", "mov_dual", [T("motores: esquerdo"), N("ESQ","50"), T("% direito"), N("DIR","50"), T("%")]);
V("arduino", "mov_parar", [T("parar os motores")]);
V("arduino", "mov_vel", [T("velocidade para andar"), N("VAL","50"), T("%")]);
V("arduino", "mot_potencia", [T("motor"), M("P", opMotor, "ME"), T("girar com"), N("VAL","50"), T("% (PWM)")]);
V("arduino", "mot_parar", [T("motor"), M("P", opMotor, "ME"), T("parar")]);
V("arduino", "mot_ir", [T("servo"), M("P", opMotor, padPa), T("ir para"), N("VAL","90"), T("graus")]);
V("arduino", "luz_texto", [T("Serial.println("), S("TXT","Oi"), T(")")]);
V("arduino", "som_bip", [T("buzzer (pino 4) nota"), N("NOTA","60"), T("por"), N("SEG","0.2"), T("s")]);
V("arduino", "sen_reflexo", [T("leitura analógica do sensor de linha"), M("P", opSensor, padCorDir), T("(0–1023)")]);
V("arduino", "sen_ereflexo", [T("sensor de linha"), M("P", opSensor, padCorDir), M("CMP", CMP, "<"), N("VAL","500"), T("?")]);
V("arduino", "sen_cru", [T("TCS3200: canal"), M("CANAL",[["vermelho","r"],["verde","g"],["azul","b"]],"r"), T("em"), M("P", opSensor, padCorDir), T("(0–255)")]);
V("arduino", "sen_cor", [T("cor detectada em"), M("P", opSensor, padCorDir)]);
V("arduino", "sen_dist", [T("HC-SR04: distância em cm")]);
V("arduino", "sen_edist", [T("HC-SR04: distância"), M("CMP", CMP, "<"), N("VAL","10"), T("cm?")]);
V("arduino", "sen_forca", [T("botão"), M("P", opSensor, "US"), T("apertado?")]);
V("arduino", "sen_angulo", [T("MPU-6050: ângulo de"), M("EIXO",[["guinada","yaw"],["arfagem","pitch"],["rolagem","roll"]],"yaw")]);
V("arduino", "sen_zerar_ang", [T("MPU-6050: zerar a guinada")]);
V("arduino", "sen_cron", [T("segundos desde o início (millis)")]);
V("arduino", "sen_zerar_cron", [T("zerar o cronômetro")]);

/* o que a paleta mostra, por plataforma e categoria */
const COMUNS = {
  controle:["ctl_esperar","ctl_repetir","ctl_sempre","ctl_se","ctl_sesenao","ctl_esperar_ate","ctl_repetir_ate","ctl_parar"],
  operadores:["op_soma","op_sub","op_mult","op_div","op_menor","op_igual","op_maior","op_e","op_ou","op_nao","op_aleatorio","op_arred","op_mod","op_abs"],
  variaveis:["var_def","var_muda","var_ler"],
  meus:["meu_def","meu_chama"]
};
const PALETAS = {
  spike: Object.assign({
    eventos:["ev_inicio","ev_botao"],
    movimento:["mov_par","mov_mover","mov_iniciar","mov_esterco","mov_iniciar_esterco","mov_dual","mov_parar","mov_vel","mov_rot"],
    motores:["mot_girar","mot_iniciar","mot_potencia","mot_parar","mot_vel","mot_ir","mot_zerar","mot_pos","mot_velr"],
    luz:["luz_texto","luz_limpar","luz_pixel","luz_cor"],
    som:["som_bip"],
    sensores:["sen_ecor","sen_cor","sen_reflexo","sen_ereflexo","sen_cru","sen_edist","sen_dist","sen_forca","sen_forcar",
              "sen_angulo","sen_zerar_ang","sen_inclinado","sen_cron","sen_zerar_cron"]
  }, COMUNS),
  ev3: Object.assign({
    eventos:["ev_inicio","ev_botao"],
    movimento:["mov_par","mov_mover","mov_esterco","mov_iniciar_esterco","mov_dual","mov_parar","mov_vel"],
    motores:["mot_girar","mot_iniciar","mot_potencia","mot_parar","mot_vel","mot_zerar","mot_pos","mot_velr"],
    luz:["luz_texto","luz_limpar","luz_status"],
    som:["som_bip"],
    sensores:["sen_ecor","sen_cor","sen_reflexo","sen_ereflexo","sen_edist","sen_dist","sen_forca","sen_angulo","sen_zerar_ang","sen_cron","sen_zerar_cron"]
  }, COMUNS),
  arduino: Object.assign({
    eventos:["ev_inicio"],
    movimento:["mov_par","mov_mover","mov_dual","mov_parar","mov_vel"],
    motores:["mot_potencia","mot_parar","mot_ir"],
    luz:["luz_texto"],
    som:["som_bip"],
    sensores:["sen_ecor","sen_cor","sen_reflexo","sen_ereflexo","sen_cru","sen_edist","sen_dist","sen_angulo","sen_zerar_ang","sen_cron","sen_zerar_cron"]
  }, COMUNS)
};
let PALETA = PALETAS[PLAT.id];

/* =======================================================================
   2. MODELO DO PROGRAMA + EDITOR DE BLOCOS
   ======================================================================= */
let SEQ = 1;
const novoId = () => "b" + (SEQ++);

let PROG = { scripts: [], vars: [], procs: [] };

function criaBloco(op) {
  const sp = specDe(op);
  const b = { id: novoId(), op, a: {}, c: [] };
  for (const p of sp.partes) {
    if (p.k === "n" || p.k === "s") b.a[p.nome] = { lit: p.pad };
    else if (p.k === "m") b.a[p.nome] = { lit: String(valorDe(p.pad)) };
    else if (p.k === "b") b.a[p.nome] = null;
    else if (p.k === "v") b.a[p.nome] = { lit: PROG.vars[0] || "" };
    else if (p.k === "p") b.a[p.nome] = { lit: PROG.procs[0] || "" };
  }
  if (sp.forma === "c") b.c = [[]];
  if (sp.forma === "c2") b.c = [[], []];
  return b;
}

/* ---- busca de um bloco dentro do programa ---- */
function acha(id) {
  let r = null;
  function emPilha(arr) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === id) { r = { arr, i }; return true; }
      if (emBloco(arr[i])) return true;
    }
    return false;
  }
  function emBloco(b) {
    for (const k in b.a) {
      const v = b.a[k];
      if (v && v.op) {
        if (v.id === id) { r = { pai: b, nome: k }; return true; }
        if (emBloco(v)) return true;
      }
    }
    for (const sub of b.c) if (emPilha(sub)) return true;
    return false;
  }
  for (const s of PROG.scripts) { if (emPilha(s.pilha)) { r.script = s; return r; } }
  return r;
}

/* ---- desenho ---- */
const lousa = document.getElementById("lousa");
const mesa = document.getElementById("mesa");
let ZOOM = 1, PANX = 40, PANY = 40;

function aplicaTransf() {
  lousa.style.transform = "translate(" + PANX + "px," + PANY + "px) scale(" + ZOOM + ")";
}

function corDe(op) {
  const sp = specDe(op);
  return CORCAT[sp ? sp.cat : "desconhecido"] || CORCAT.desconhecido;
}

function elArg(b, p) {
  const val = b.a[p.nome];
  if (val && val.op) {                       /* um reporter ocupa a vaga */
    const slot = document.createElement("span");
    slot.className = "slot" + (p.k === "b" ? " bool" : "");
    slot.style.background = "transparent";
    slot.__vaga = { b, nome: p.nome, tipo: p.k };
    slot.appendChild(elBloco(val));
    return slot;
  }
  if (p.k === "b") {
    const slot = document.createElement("span");
    slot.className = "slot bool";
    slot.__vaga = { b, nome: p.nome, tipo: "b" };
    return slot;
  }
  if (p.k === "m") {
    const s = document.createElement("select");
    s.className = "enc";
    for (const [rot, v] of valorDe(p.ops)) {
      const o = document.createElement("option");
      o.value = v; o.textContent = rot; s.appendChild(o);
    }
    s.value = val ? val.lit : valorDe(p.pad);
    if (s.selectedIndex < 0) {                /* valor vindo de um arquivo */
      const o = document.createElement("option");
      o.value = val.lit; o.textContent = val.lit; s.appendChild(o); s.value = val.lit;
    }
    s.onchange = () => { b.a[p.nome] = { lit: s.value }; };
    s.onpointerdown = e => e.stopPropagation();
    return s;
  }
  if (p.k === "v" || p.k === "p") {
    const lista = p.k === "v" ? PROG.vars : PROG.procs;
    const s = document.createElement("select");
    s.className = "enc";
    const atual = val ? val.lit : "";
    const opts = lista.slice();
    if (atual && opts.indexOf(atual) < 0) opts.push(atual);
    for (const v of opts) {
      const o = document.createElement("option"); o.value = v; o.textContent = v; s.appendChild(o);
    }
    s.value = atual;
    s.onchange = () => { b.a[p.nome] = { lit: s.value }; };
    s.onpointerdown = e => e.stopPropagation();
    return s;
  }
  /* numero ou texto */
  const slot = document.createElement("span");
  slot.className = "slot";
  slot.__vaga = { b, nome: p.nome, tipo: p.k };
  const i = document.createElement("input");
  i.className = "enc"; i.value = val ? val.lit : "";
  i.size = Math.max(2, String(i.value).length);
  i.oninput = () => { b.a[p.nome] = { lit: i.value }; i.size = Math.max(2, i.value.length); };
  i.onpointerdown = e => e.stopPropagation();
  slot.appendChild(i);
  return slot;
}

function elBloco(b) {
  const sp = specDe(b.op);
  const d = document.createElement("div");
  d.className = "bl " + (sp.forma === "chapeu" ? "chapeu" : sp.forma === "rep" ? "rep" : sp.forma === "bool" ? "bool" : "");
  d.dataset.id = b.id;
  d.__b = b;
  const cor = corDe(b.op);
  const cab = document.createElement("div");
  cab.className = "cab";
  cab.style.background = cor;
  cab.style.borderRadius = (sp.forma === "rep") ? "999px" : (sp.forma === "bool") ? "5px" : "";
  if (b.op === "desconhecido") {
    cab.appendChild(txt("bloco do " + PLAT.nome + ": " + (b.origem || "?")));
  } else {
    for (const p of sp.partes) {
      if (p.k === "t") cab.appendChild(txt(p.t));
      else cab.appendChild(elArg(b, p));
    }
  }
  d.appendChild(cab);

  if (sp.forma === "c" || sp.forma === "c2") {
    d.style.background = cor;
    d.style.borderRadius = "8px";
    const corpo = document.createElement("div");
    corpo.className = "corpoc";
    corpo.appendChild(elPilha(b.c[0]));
    d.appendChild(corpo);
    if (sp.forma === "c2") {
      const barra = document.createElement("div");
      barra.className = "cab"; barra.style.background = cor; barra.style.minHeight = "30px";
      barra.appendChild(txt("senão"));
      barra.style.cursor = "default";
      barra.onpointerdown = e => e.stopPropagation();
      d.appendChild(barra);
      const corpo2 = document.createElement("div");
      corpo2.className = "corpoc";
      corpo2.appendChild(elPilha(b.c[1]));
      d.appendChild(corpo2);
    }
    const fecho = document.createElement("div");
    fecho.className = "fecho"; fecho.style.background = cor;
    d.appendChild(fecho);
  }
  return d;
}
function txt(t) { const s = document.createElement("span"); s.textContent = t; return s; }

function elPilha(arr) {
  const w = document.createElement("div");
  w.className = "corrente";
  w.__arr = arr;
  for (const b of arr) w.appendChild(elBloco(b));
  return w;
}

function desenhaBlocos() {
  lousa.innerHTML = "";
  for (const s of PROG.scripts) {
    const d = document.createElement("div");
    d.className = "pilha";
    d.style.left = s.x + "px"; d.style.top = s.y + "px";
    d.__script = s;
    d.appendChild(elPilha(s.pilha));
    lousa.appendChild(d);
  }
  aplicaTransf();
  marcaExecucao();
}
/* leva o quadro até a definição de um bloco */
function vaiAtePilha(nome) {
  const s = PROG.scripts.find(q => q.pilha[0] && q.pilha[0].op === "meu_def" && q.pilha[0].a.NOME && q.pilha[0].a.NOME.lit === nome);
  if (!s) return;
  PANX = 40 - s.x * ZOOM; PANY = 40 - s.y * ZOOM; aplicaTransf();
  const el = Array.from(lousa.children).find(d => d.__script === s);
  if (el) { el.style.outline = "3px solid var(--marca)"; el.style.outlineOffset = "6px"; setTimeout(() => { el.style.outline = ""; }, 1400); }
}
/* põe as pilhas em colunas, na ordem em que estão, sem uma em cima da outra */
function arrumaPilhas() {
  /* duas passadas: na primeira a fonte pode não ter carregado ainda e as alturas mudam depois */
  for (let passada = 0; passada < 2; passada++) {
    desenhaBlocos();
    const medidas = Array.from(lousa.children).map(d => ({ s: d.__script, w: d.offsetWidth || 220, h: d.offsetHeight || 60 }));
    const MARG = 56, X0 = 40, Y0 = 40, LIMITE = 2600;
    let x = X0, y = Y0, largura = 0;
    for (const m of medidas) {
      if (y > Y0 && y + m.h > LIMITE) { x += largura + MARG; y = Y0; largura = 0; }
      m.s.x = x; m.s.y = y;
      y += m.h + MARG;
      if (m.w > largura) largura = m.w;
    }
  }
  desenhaBlocos();
}

/* ---- paleta ---- */
let CATATUAL = "eventos";
function montaTrilho() {
  const t = document.getElementById("trilho");
  t.innerHTML = "";
  for (const c of CAT) {
    const bt = document.createElement("button");
    bt.innerHTML = '<span class="bola" style="background:' + c.cor + '"></span><span>' + nomeCat(c) + "</span>";
    if (c.id === CATATUAL) bt.className = "on";
    bt.onclick = () => { CATATUAL = c.id; montaTrilho(); montaPaleta(); };
    t.appendChild(bt);
  }
}
function montaPaleta() {
  const p = document.getElementById("paleta");
  p.innerHTML = "";
  const h = document.createElement("h4");
  h.textContent = nomeCat(CAT.find(c => c.id === CATATUAL) || { nome: "" });
  p.appendChild(h);
  if (CATATUAL === "variaveis") {
    p.appendChild(botaozinho("+ Nova variável", () => {
      const n = prompt("Nome da variável:");
      if (n && PROG.vars.indexOf(n) < 0) { PROG.vars.push(n); montaPaleta(); desenhaBlocos(); }
    }));
  }
  if (CATATUAL === "meus") {
    p.appendChild(botaozinho("+ Novo bloco", () => {
      const n = prompt("Nome do bloco:");
      if (n && PROG.procs.indexOf(n) < 0) {
        PROG.procs.push(n);
        const d = criaBloco("meu_def"); d.a.NOME = { lit: n };
        PROG.scripts.push({ id: novoId(), x: 60, y: 60 + PROG.scripts.length * 30, pilha: [d] });
        montaPaleta(); desenhaBlocos();
      }
    }));
    /* uma carta "chamar" para cada bloco que o programa já tem, e um atalho para achar a definição */
    for (const nome of PROG.procs) {
      const b = criaBloco("meu_chama"); b.a.NOME = { lit: nome };
      const cart = document.createElement("div");
      cart.className = "pcard";
      cart.appendChild(elBloco(b));
      cart.__novo = "meu_chama"; cart.__nome = nome;
      const ir = document.createElement("button");
      ir.className = "bt"; ir.textContent = "ir até a definição";
      ir.style.cssText = "width:100%;font-size:11px;padding:2px 4px;margin:2px 0 8px";
      ir.onclick = () => vaiAtePilha(nome);
      p.appendChild(cart); p.appendChild(ir);
    }
    if (!PROG.procs.length) {
      const av = document.createElement("p");
      av.className = "nota"; av.textContent = "Este programa ainda não tem blocos seus. Use + Novo bloco.";
      p.appendChild(av);
    }
  }
  for (const op of PALETA[CATATUAL] || []) {
    const b = criaBloco(op);
    const cart = document.createElement("div");
    cart.className = "pcard";
    cart.appendChild(elBloco(b));
    cart.__novo = op;
    p.appendChild(cart);
  }
}
function botaozinho(rot, fn) {
  const b = document.createElement("button");
  b.className = "bt"; b.style.width = "100%"; b.style.marginBottom = "10px";
  b.textContent = rot; b.onclick = fn;
  return b;
}

/* =======================================================================
   3. ARRASTAR E ENCAIXAR
   ======================================================================= */
let ARR = null;   /* {blocos, el, dx, dy, tipo} */
let ALVOS = [], ALVO = null;
const fantasma = document.createElement("div");
fantasma.className = "fantasma"; fantasma.style.display = "none";

function pontoLousa(e) {
  const r = mesa.getBoundingClientRect();
  return { x: (e.clientX - r.left - PANX) / ZOOM, y: (e.clientY - r.top - PANY) / ZOOM };
}

document.addEventListener("pointerdown", e => {
  if (e.button !== 0) return;
  const cart = e.target.closest ? e.target.closest(".pcard") : null;
  const cab = e.target.closest ? e.target.closest(".cab") : null;
  const dentroPaleta = e.target.closest && e.target.closest("#paleta");

  if (cart && dentroPaleta) {                       /* nascer da paleta */
    const b = criaBloco(cart.__novo);
    if (cart.__nome) b.a.NOME = { lit: cart.__nome };
    const p = pontoLousa(e);
    const r = cart.getBoundingClientRect();
    comecaArraste([b], -(e.clientX - r.left) / ZOOM, -(e.clientY - r.top) / ZOOM, e, true);
    e.preventDefault(); return;
  }
  if (!cab || dentroPaleta) {
    if (e.target === lousa || (e.target.closest && e.target.closest("#lousa") && !cab)) iniciaPan(e);
    return;
  }
  const blEl = cab.parentElement;
  if (!blEl.__b) return;
  const b = blEl.__b;
  const loc = acha(b.id);
  if (!loc) return;
  let levados;
  if (loc.arr) { levados = loc.arr.splice(loc.i); }
  else { loc.pai.a[loc.nome] = null; levados = [b]; }
  /* se o script ficou vazio, some com ele */
  PROG.scripts = PROG.scripts.filter(s => s.pilha.length > 0);
  const r = blEl.getBoundingClientRect();
  const p = pontoLousa(e);
  const dx = -(e.clientX - r.left) / ZOOM, dy = -(e.clientY - r.top) / ZOOM;
  desenhaBlocos();
  comecaArraste(levados, dx, dy, e, false);
  e.preventDefault();
});

function comecaArraste(blocos, dx, dy, e, novo) {
  const el = document.createElement("div");
  el.className = "pilha flutua";
  el.appendChild(elPilha(blocos));
  lousa.appendChild(el);
  lousa.appendChild(fantasma);
  ARR = { blocos, el, dx, dy, novo };
  const sp = specDe(blocos[0].op);
  ARR.tipo = (sp.forma === "rep" || sp.forma === "bool") ? "rep" : "pilha";
  ARR.bool = sp.forma === "bool";
  calculaAlvos();
  moveArraste(e);
  document.getElementById("lixeira").classList.remove("ativa");
}

function calculaAlvos() {
  ALVOS = [];
  const r0 = mesa.getBoundingClientRect();
  const conv = (cx, cy) => ({ x: (cx - r0.left - PANX) / ZOOM, y: (cy - r0.top - PANY) / ZOOM });
  if (ARR.tipo === "pilha") {
    for (const cor of lousa.querySelectorAll(".corrente")) {
      if (cor.closest(".flutua")) continue;
      const arr = cor.__arr; if (!arr) continue;
      const filhos = Array.from(cor.children);
      const dentroC = !!cor.parentElement.closest(".corpoc");
      for (let i = 0; i <= filhos.length; i++) {
        let cx, cy, w;
        if (i < filhos.length) {
          const rr = filhos[i].getBoundingClientRect();
          cx = rr.left; cy = rr.top; w = rr.width;
          const sp = specDe(filhos[i].__b.op);
          if (sp && sp.forma === "chapeu") continue;   /* nada entra antes de um chapeu */
        } else if (filhos.length) {
          const rr = filhos[filhos.length - 1].getBoundingClientRect();
          const spu = specDe(filhos[filhos.length - 1].__b.op);
          if (spu && (spu.forma === "cap")) continue;
          cx = rr.left; cy = rr.bottom; w = rr.width;
        } else {
          const rr = cor.getBoundingClientRect();
          cx = rr.left; cy = rr.top; w = 90;
        }
        const p = conv(cx, cy);
        ALVOS.push({ arr, i, x: p.x, y: p.y, w: Math.max(60, w / ZOOM) });
      }
    }
  } else {
    for (const s of lousa.querySelectorAll(".slot")) {
      if (s.closest(".flutua")) continue;
      const vaga = s.__vaga; if (!vaga) continue;
      if (ARR.bool && vaga.tipo !== "b") continue;
      if (!ARR.bool && vaga.tipo === "b") continue;
      if (vaga.b.a[vaga.nome] && vaga.b.a[vaga.nome].op) continue;
      const rr = s.getBoundingClientRect();
      const p = conv(rr.left, rr.top);
      ALVOS.push({ vaga, slot: s, x: p.x, y: p.y, w: rr.width / ZOOM });
    }
  }
}

function moveArraste(e) {
  const p = pontoLousa(e);
  const x = p.x + ARR.dx, y = p.y + ARR.dy;
  ARR.el.style.left = x + "px"; ARR.el.style.top = y + "px";
  ARR.x = x; ARR.y = y;
  let melhor = null, dmin = 1e9;
  for (const a of ALVOS) {
    const d = Math.hypot(a.x - x, a.y - y);
    if (d < dmin) { dmin = d; melhor = a; }
  }
  if (ALVO && ALVO.slot) ALVO.slot.classList.remove("alvo");
  ALVO = (dmin < 55) ? melhor : null;
  if (ALVO && ALVO.slot) { fantasma.style.display = "none"; ALVO.slot.classList.add("alvo"); }
  else if (ALVO) {
    fantasma.style.display = "block";
    fantasma.style.left = ALVO.x + "px"; fantasma.style.top = (ALVO.y - 3) + "px";
    fantasma.style.width = ALVO.w + "px";
  } else fantasma.style.display = "none";
  const rl = document.getElementById("lixeira").getBoundingClientRect();
  const sobreLixo = e.clientX > rl.left - 20 && e.clientX < rl.right + 20 &&
                    e.clientY > rl.top - 20 && e.clientY < rl.bottom + 20;
  const sobrePaleta = !!(e.target.closest && (e.target.closest("#paleta") || e.target.closest("#trilho")));
  ARR.lixo = sobreLixo || sobrePaleta;
  document.getElementById("lixeira").classList.toggle("ativa", !!ARR.lixo);
}

document.addEventListener("pointermove", e => { if (ARR) { moveArraste(e); e.preventDefault(); } else if (PAN) fazPan(e); });

document.addEventListener("pointerup", e => {
  if (PAN) { PAN = null; return; }
  if (!ARR) return;
  const a = ALVO;
  if (!ARR.lixo) {
    if (a && a.slot) a.vaga.b.a[a.vaga.nome] = ARR.blocos[0];
    else if (a) a.arr.splice(a.i, 0, ...ARR.blocos);
    else if (ARR.tipo === "pilha") PROG.scripts.push({ id: novoId(), x: ARR.x, y: ARR.y, pilha: ARR.blocos });
    else PROG.scripts.push({ id: novoId(), x: ARR.x, y: ARR.y, pilha: ARR.blocos });
  }
  if (ALVO && ALVO.slot) ALVO.slot.classList.remove("alvo");
  ARR.el.remove(); fantasma.style.display = "none";
  ARR = null; ALVO = null;
  document.getElementById("lixeira").classList.remove("ativa");
  desenhaBlocos();
});

/* ---- arrastar o fundo ---- */
let PAN = null;
function iniciaPan(e) { PAN = { x: e.clientX, y: e.clientY, px: PANX, py: PANY }; }
function fazPan(e) { PANX = PAN.px + (e.clientX - PAN.x); PANY = PAN.py + (e.clientY - PAN.y); aplicaTransf(); }
mesa.addEventListener("wheel", e => {
  if (e.ctrlKey) { e.preventDefault(); zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1); }
  else { PANX -= e.deltaX; PANY -= e.deltaY; aplicaTransf(); e.preventDefault(); }
}, { passive: false });
function zoom(f) { ZOOM = Math.min(2, Math.max(0.35, ZOOM * f)); aplicaTransf(); }
document.getElementById("zMais").onclick = () => zoom(1.15);
document.getElementById("zMenos").onclick = () => zoom(1 / 1.15);
document.getElementById("zCem").onclick = () => { ZOOM = 1; PANX = 40; PANY = 40; aplicaTransf(); };

/* destaque do bloco em execucao */
let ULTIMO = null;
function marcaExecucao() {
  if (ULTIMO) { const e = lousa.querySelector('[data-id="' + ULTIMO + '"]'); if (e) e.classList.add("destacado"); }
}
function destaca(id) {
  if (id === ULTIMO) return;
  if (ULTIMO) { const e = lousa.querySelector('[data-id="' + ULTIMO + '"]'); if (e) e.classList.remove("destacado"); }
  ULTIMO = id;
  if (id) { const e = lousa.querySelector('[data-id="' + id + '"]'); if (e) e.classList.add("destacado"); }
}

