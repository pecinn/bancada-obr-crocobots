"use strict";
/* =======================================================================
   1. CATALOGO DE BLOCOS  (estilo SPIKE Prime / palavras-bloco)
   ======================================================================= */
const PORTAS = ["A","B","C","D","E","F"];
const PARES = [];
for (const a of PORTAS) for (const b of PORTAS) if (a !== b) PARES.push([a + "+" + b, a + b]);

const CORES_SPIKE = [
  ["preto","0"],["magenta","1"],["roxo","2"],["azul","3"],["azul-claro","4"],
  ["turquesa","5"],["verde","6"],["amarelo","7"],["laranja","8"],["vermelho","9"],
  ["branco","10"],["nenhuma","-1"]
];
const opPorta  = () => PORTAS.map(p => [p, p]);
const opSentido= () => [["sentido horário","clockwise"],["sentido anti-horário","counterclockwise"]];

/* construtores de pedacos de bloco */
const T = t => ({ k:"t", t });
const N = (nome, pad) => ({ k:"n", nome, pad: String(pad) });
const S = (nome, pad) => ({ k:"s", nome, pad: String(pad) });
const M = (nome, ops, pad) => ({ k:"m", nome, ops, pad: pad !== undefined ? pad : ops[0][1] });
const B = nome => ({ k:"b", nome });
const VARM = nome => ({ k:"v", nome });
const PROCM = nome => ({ k:"p", nome });

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
const CORCAT = {}; CAT.forEach(c => CORCAT[c.id] = c.cor);
CORCAT.desconhecido = "var(--c-desconhecido)";

const SPEC = {};
function D(op, cat, forma, partes) { SPEC[op] = { op, cat, forma, partes }; }

/* --- eventos --- */
D("ev_inicio","eventos","chapeu",[T("quando o programa iniciar")]);
D("ev_botao","eventos","chapeu",[T("quando o botão central for pressionado")]);

/* --- movimento --- */
D("mov_par","movimento","stack",[T("definir motores de movimento para"), M("PAR", PARES, "AB")]);
D("mov_mover","movimento","stack",[T("mover"),
  M("DIR",[["para frente","forward"],["para trás","back"],["à esquerda","left"],["à direita","right"]]),
  T("por"), N("VAL","10"),
  M("UN",[["cm","cm"],["polegadas","inches"],["rotações","rotations"],["graus","degrees"],["segundos","seconds"]])]);
D("mov_iniciar","movimento","stack",[T("começar a mover"),
  M("DIR",[["para frente","forward"],["para trás","back"],["à esquerda","left"],["à direita","right"]])]);
D("mov_esterco","movimento","stack",[T("mover com direção"), N("DIR","0"), T("por"), N("VAL","10"),
  M("UN",[["cm","cm"],["polegadas","inches"],["rotações","rotations"],["graus","degrees"],["segundos","seconds"]])]);
D("mov_iniciar_esterco","movimento","stack",[T("começar a mover com direção"), N("DIR","0")]);
D("mov_dual","movimento","stack",[T("começar a mover: esquerda"), N("ESQ","50"), T("% direita"), N("DIR","50"), T("%")]);
D("mov_parar","movimento","stack",[T("parar de mover")]);
D("mov_vel","movimento","stack",[T("definir velocidade de movimento para"), N("VAL","50"), T("%")]);
D("mov_rot","movimento","stack",[T("definir rotação da roda para"), N("VAL","17.6"), T("cm")]);

/* --- motores --- */
D("mot_girar","motores","stack",[T("motor"), M("P", opPorta(), "C"), T("girar"), M("SENT", opSentido()),
  T("por"), N("VAL","1"),
  M("UN",[["rotações","rotations"],["graus","degrees"],["segundos","seconds"]])]);
D("mot_iniciar","motores","stack",[T("motor"), M("P", opPorta(), "C"), T("começar a girar"), M("SENT", opSentido())]);
D("mot_parar","motores","stack",[T("motor"), M("P", opPorta(), "C"), T("parar")]);
D("mot_vel","motores","stack",[T("motor"), M("P", opPorta(), "C"), T("definir velocidade para"), N("VAL","75"), T("%")]);
D("mot_ir","motores","stack",[T("motor"), M("P", opPorta(), "C"), T("ir para a posição"), N("VAL","0"), T("graus")]);
D("mot_zerar","motores","stack",[T("motor"), M("P", opPorta(), "C"), T("zerar a contagem")]);
D("mot_pos","motores","rep",[T("posição do motor"), M("P", opPorta(), "C")]);
D("mot_velr","motores","rep",[T("velocidade do motor"), M("P", opPorta(), "C")]);

/* --- luz --- */
D("luz_texto","luz","stack",[T("escrever"), S("TXT","Oi")]);
D("luz_limpar","luz","stack",[T("apagar a tela")]);
D("luz_pixel","luz","stack",[T("acender pixel x"), N("X","3"), T("y"), N("Y","3"), T("com"), N("B","100"), T("% de brilho")]);
D("luz_cor","luz","stack",[T("definir a cor do hub para"), M("COR", CORES_SPIKE, "6")]);

/* --- som --- */
D("som_bip","som","stack",[T("tocar o bipe"), N("NOTA","60"), T("por"), N("SEG","0.2"), T("segundos")]);

/* --- sensores --- */
D("sen_ecor","sensores","bool",[M("P", opPorta(), "D"), T("é a cor"), M("COR", CORES_SPIKE, "0"), T("?")]);
D("sen_cor","sensores","rep",[T("cor em"), M("P", opPorta(), "D")]);
D("sen_reflexo","sensores","rep",[T("luz refletida em"), M("P", opPorta(), "D")]);
D("sen_ereflexo","sensores","bool",[M("P", opPorta(), "D"), T("luz refletida"),
  M("CMP",[["menor que","<"],["maior que",">"],["igual a","="]],"<"), N("VAL","50"), T("%?")]);
D("sen_cru","sensores","rep",[T("valor bruto"),
  M("CANAL",[["vermelho","r"],["verde","g"],["azul","b"]],"r"), T("em"), M("P", opPorta(), "D")]);
D("sen_edist","sensores","bool",[T("distância em"), M("P", opPorta(), "F"),
  M("CMP",[["menor que","<"],["maior que",">"],["igual a","="]],"<"), N("VAL","10"),
  M("UN",[["cm","cm"],["polegadas","inches"],["%","%"]],"cm"), T("?")]);
D("sen_dist","sensores","rep",[T("distância em"), M("P", opPorta(), "F"),
  M("UN",[["cm","cm"],["polegadas","inches"],["%","%"]],"cm")]);
D("sen_forca","sensores","bool",[T("sensor de força"), M("P", opPorta(), "B"), T("pressionado?")]);
D("sen_forcar","sensores","rep",[T("força em"), M("P", opPorta(), "B"), T("%")]);
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

/* --- variaveis --- */
D("var_def","variaveis","stack",[T("definir"), VARM("VAR"), T("para"), N("VAL","0")]);
D("var_muda","variaveis","stack",[T("mudar"), VARM("VAR"), T("por"), N("VAL","1")]);
D("var_ler","variaveis","rep",[VARM("VAR")]);

/* --- meus blocos --- */
D("meu_def","meus","chapeu",[T("definir"), PROCM("NOME")]);
D("meu_chama","meus","stack",[PROCM("NOME")]);

/* bloco coringa para opcodes do SPIKE que a bancada ainda nao executa */
D("desconhecido","desconhecido","stack",[T("?")]);

/* o que a paleta mostra, por categoria */
const PALETA = {
  eventos:["ev_inicio","ev_botao"],
  movimento:["mov_par","mov_mover","mov_iniciar","mov_esterco","mov_iniciar_esterco","mov_dual","mov_parar","mov_vel","mov_rot"],
  motores:["mot_girar","mot_iniciar","mot_parar","mot_vel","mot_ir","mot_zerar","mot_pos","mot_velr"],
  luz:["luz_texto","luz_limpar","luz_pixel","luz_cor"],
  som:["som_bip"],
  sensores:["sen_ecor","sen_cor","sen_reflexo","sen_ereflexo","sen_cru","sen_edist","sen_dist","sen_forca","sen_forcar",
            "sen_angulo","sen_zerar_ang","sen_inclinado","sen_cron","sen_zerar_cron"],
  controle:["ctl_esperar","ctl_repetir","ctl_sempre","ctl_se","ctl_sesenao","ctl_esperar_ate","ctl_repetir_ate","ctl_parar"],
  operadores:["op_soma","op_sub","op_mult","op_div","op_menor","op_igual","op_maior","op_e","op_ou","op_nao","op_aleatorio","op_arred","op_mod"],
  variaveis:["var_def","var_muda","var_ler"],
  meus:["meu_def","meu_chama"]
};

/* =======================================================================
   2. MODELO DO PROGRAMA + EDITOR DE BLOCOS
   ======================================================================= */
let SEQ = 1;
const novoId = () => "b" + (SEQ++);

let PROG = { scripts: [], vars: [], procs: [] };

function criaBloco(op) {
  const sp = SPEC[op] || SPEC.desconhecido;
  const b = { id: novoId(), op, a: {}, c: [] };
  for (const p of sp.partes) {
    if (p.k === "n" || p.k === "s") b.a[p.nome] = { lit: p.pad };
    else if (p.k === "m") b.a[p.nome] = { lit: p.pad };
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
  const sp = SPEC[op];
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
    for (const [rot, v] of p.ops) {
      const o = document.createElement("option");
      o.value = v; o.textContent = rot; s.appendChild(o);
    }
    s.value = val ? val.lit : p.pad;
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
  const sp = SPEC[b.op] || SPEC.desconhecido;
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
    cab.appendChild(txt("bloco do SPIKE: " + (b.origem || "?")));
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
    bt.innerHTML = '<span class="bola" style="background:' + c.cor + '"></span><span>' + c.nome + "</span>";
    if (c.id === CATATUAL) bt.className = "on";
    bt.onclick = () => { CATATUAL = c.id; montaTrilho(); montaPaleta(); };
    t.appendChild(bt);
  }
}
function montaPaleta() {
  const p = document.getElementById("paleta");
  p.innerHTML = "";
  const h = document.createElement("h4");
  h.textContent = (CAT.find(c => c.id === CATATUAL) || {}).nome || "";
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
  const sp = SPEC[blocos[0].op] || SPEC.desconhecido;
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
          const sp = SPEC[filhos[i].__b.op];
          if (sp && sp.forma === "chapeu") continue;   /* nada entra antes de um chapeu */
        } else if (filhos.length) {
          const rr = filhos[filhos.length - 1].getBoundingClientRect();
          const spu = SPEC[filhos[filhos.length - 1].__b.op];
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

/* =======================================================================
   4. LEITURA DE ARQUIVOS .llsp3 / .sb3  ->  blocos da bancada
   ======================================================================= */
function campoUnico(b) {
  for (const k in b.fields) return b.fields[k][0];
  return "";
}
/* um seletor e um bloco-sombra sem entradas e com um unico campo: menus do SPIKE */
function ehSeletor(b) {
  return b.shadow && Object.keys(b.inputs || {}).length === 0 && Object.keys(b.fields || {}).length === 1;
}

function entradaSb(b, nome, BS) {
  const inp = b.inputs && b.inputs[nome];
  if (!inp) return null;
  let v = inp[1];
  if (v === null || v === undefined) v = inp[2];
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) {
    if (v[0] === 12 || v[0] === 13) return { op: "var_ler", id: novoId(), a: { VAR: { lit: v[1] } }, c: [] };
    return { lit: String(v[1]) };
  }
  const alvo = BS[v];
  if (!alvo) return null;
  if (ehSeletor(alvo)) return { lit: campoUnico(alvo) };
  return convBloco(alvo, BS);
}
function campoSb(b, nome, pad) {
  return { lit: (b.fields && b.fields[nome]) ? String(b.fields[nome][0]) : (pad === undefined ? "" : pad) };
}
function pilhaSb(b, nome, BS) {
  const inp = b.inputs && b.inputs[nome];
  if (!inp || !inp[1]) return [];
  return correnteSb(inp[1], BS);
}
function correnteSb(id, BS) {
  const out = [];
  let cur = id, guarda = 0;
  while (cur && BS[cur] && guarda++ < 4000) {
    out.push(convBloco(BS[cur], BS));
    cur = BS[cur].next;
  }
  return out;
}

const MAPA = {
  flipperevents_whenProgramStarts: () => mk("ev_inicio"),
  flipperevents_whenButton:        () => mk("ev_botao"),
  flipperevents_whenTimer:         () => mk("ev_botao"),

  flippermove_setMovementPair: (b, S) => mk("mov_par", { PAR: entradaSb(b, "PAIR", S) }),
  flippermove_move:      (b, S) => mk("mov_mover", { DIR: entradaSb(b, "DIRECTION", S), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "cm") }),
  flippermove_startMove: (b, S) => mk("mov_iniciar", { DIR: entradaSb(b, "DIRECTION", S) }),
  flippermove_steer:      (b, S) => mk("mov_esterco", { DIR: entradaSb(b, "STEERING", S), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "cm") }),
  flippermove_startSteer: (b, S) => mk("mov_iniciar_esterco", { DIR: entradaSb(b, "STEERING", S) }),
  flippermove_stopMove:      () => mk("mov_parar"),
  flippermove_movementSpeed: (b, S) => mk("mov_vel", { VAL: entradaSb(b, "SPEED", S) }),
  flippermove_setDistance:   (b, S) => mk("mov_rot", { VAL: entradaSb(b, "DISTANCE", S) }),
  flippermove_setMovementRotation: (b, S) => mk("mov_rot", { VAL: entradaSb(b, "ROTATION", S) }),
  flippermoremove_startDualSpeed: (b, S) => mk("mov_dual", { ESQ: entradaSb(b, "LEFT", S), DIR: entradaSb(b, "RIGHT", S) }),

  flippermotor_motorTurnForDirection: (b, S) => mk("mot_girar", { P: entradaSb(b, "PORT", S), SENT: campoSb(b, "DIRECTION", "clockwise"), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "rotations") }),
  flippermotor_motorStartDirection:   (b, S) => mk("mot_iniciar", { P: entradaSb(b, "PORT", S), SENT: campoSb(b, "DIRECTION", "clockwise") }),
  flippermotor_motorStop:      (b, S) => mk("mot_parar", { P: entradaSb(b, "PORT", S) }),
  flippermotor_motorSetSpeed:  (b, S) => mk("mot_vel", { P: entradaSb(b, "PORT", S), VAL: entradaSb(b, "SPEED", S) }),
  flippermotor_motorGoDirectionToPosition: (b, S) => mk("mot_ir", { P: entradaSb(b, "PORT", S), VAL: entradaSb(b, "POSITION", S) }),
  flippermotor_motorSetDegreeCounted:      (b, S) => mk("mot_zerar", { P: entradaSb(b, "PORT", S) }),
  flippermotor_absolutePosition: (b, S) => mk("mot_pos", { P: entradaSb(b, "PORT", S) }),
  flippermotor_position:         (b, S) => mk("mot_pos", { P: entradaSb(b, "PORT", S) }),
  flippermotor_speed:            (b, S) => mk("mot_velr", { P: entradaSb(b, "PORT", S) }),

  flipperdisplay_ledOn:   (b, S) => mk("luz_pixel", { X: entradaSb(b, "X", S), Y: entradaSb(b, "Y", S), B: entradaSb(b, "BRIGHTNESS", S) }),
  flipperdisplay_ledText: (b, S) => mk("luz_texto", { TXT: entradaSb(b, "TEXT", S) }),
  flipperdisplay_displayText: (b, S) => mk("luz_texto", { TXT: entradaSb(b, "TEXT", S) }),
  flipperdisplay_displayOff:  () => mk("luz_limpar"),
  flipperdisplay_centerButtonLight: (b, S) => mk("luz_cor", { COR: entradaSb(b, "COLOR", S) }),
  flippersound_beep:     (b, S) => mk("som_bip", { NOTA: entradaSb(b, "NOTE", S), SEG: entradaSb(b, "DURATION", S) }),
  flippersound_beepForTime: (b, S) => mk("som_bip", { NOTA: entradaSb(b, "NOTE", S), SEG: entradaSb(b, "DURATION", S) }),

  flippersensors_isColor:   (b, S) => mk("sen_ecor", { P: entradaSb(b, "PORT", S), COR: entradaSb(b, "VALUE", S) }),
  flippersensors_color:     (b, S) => mk("sen_cor", { P: entradaSb(b, "PORT", S) }),
  flippersensors_reflectivity: (b, S) => mk("sen_reflexo", { P: entradaSb(b, "PORT", S) }),
  flippersensors_rawColor: (b, S) => Object.assign(mk("sen_cru", { P: entradaSb(b, "PORT", S), CANAL: canalCru(b, S) }), { origem: b.opcode }),
  flippersensors_rawValue: (b, S) => Object.assign(mk("sen_cru", { P: entradaSb(b, "PORT", S), CANAL: canalCru(b, S) }), { origem: b.opcode }),
  flippersensors_isReflectivity: (b, S) => mk("sen_ereflexo", { P: entradaSb(b, "PORT", S), CMP: campoSb(b, "COMPARATOR", "<"), VAL: entradaSb(b, "VALUE", S) }),
  flippersensors_isDistance: (b, S) => mk("sen_edist", { P: entradaSb(b, "PORT", S), CMP: campoSb(b, "COMPARATOR", "<"), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "cm") }),
  flippersensors_distance:  (b, S) => mk("sen_dist", { P: entradaSb(b, "PORT", S), UN: campoSb(b, "UNIT", "cm") }),
  flippersensors_isPressed: (b, S) => mk("sen_forca", { P: entradaSb(b, "PORT", S) }),
  flippersensors_force:     (b, S) => mk("sen_forcar", { P: entradaSb(b, "PORT", S) }),
  flippersensors_orientationAxis: (b, S) => mk("sen_angulo", { EIXO: campoSb(b, "AXIS", "yaw") }),
  flippersensors_resetYaw:  () => mk("sen_zerar_ang"),
  flippersensors_timer:     () => mk("sen_cron"),
  flippersensors_resetTimer:() => mk("sen_zerar_cron"),

  control_wait:      (b, S) => mk("ctl_esperar", { SEG: entradaSb(b, "DURATION", S) }),
  control_repeat:    (b, S) => mk("ctl_repetir", { N: entradaSb(b, "TIMES", S) }, [pilhaSb(b, "SUBSTACK", S)]),
  control_forever:   (b, S) => mk("ctl_sempre", {}, [pilhaSb(b, "SUBSTACK", S)]),
  control_if:        (b, S) => mk("ctl_se", { COND: entradaSb(b, "CONDITION", S) }, [pilhaSb(b, "SUBSTACK", S)]),
  control_if_else:   (b, S) => mk("ctl_sesenao", { COND: entradaSb(b, "CONDITION", S) }, [pilhaSb(b, "SUBSTACK", S), pilhaSb(b, "SUBSTACK2", S)]),
  control_wait_until:(b, S) => mk("ctl_esperar_ate", { COND: entradaSb(b, "CONDITION", S) }),
  control_repeat_until: (b, S) => mk("ctl_repetir_ate", { COND: entradaSb(b, "CONDITION", S) }, [pilhaSb(b, "SUBSTACK", S)]),
  control_stop:      (b) => mk("ctl_parar", { ALVO: campoSb(b, "STOP_OPTION", "all") }),
  flippercontrol_stop: () => mk("ctl_parar", { ALVO: { lit: "all" } }),
  flippercontrol_stopOtherStacks: () => mk("ctl_parar", { ALVO: { lit: "other scripts in sprite" } }),

  operator_add:      (b, S) => mk("op_soma", { A: entradaSb(b, "NUM1", S), B: entradaSb(b, "NUM2", S) }),
  operator_subtract: (b, S) => mk("op_sub",  { A: entradaSb(b, "NUM1", S), B: entradaSb(b, "NUM2", S) }),
  operator_multiply: (b, S) => mk("op_mult", { A: entradaSb(b, "NUM1", S), B: entradaSb(b, "NUM2", S) }),
  operator_divide:   (b, S) => mk("op_div",  { A: entradaSb(b, "NUM1", S), B: entradaSb(b, "NUM2", S) }),
  operator_mod:      (b, S) => mk("op_mod",  { A: entradaSb(b, "NUM1", S), B: entradaSb(b, "NUM2", S) }),
  operator_round:    (b, S) => mk("op_arred",{ A: entradaSb(b, "NUM", S) }),
  operator_random:   (b, S) => mk("op_aleatorio", { A: entradaSb(b, "FROM", S), B: entradaSb(b, "TO", S) }),
  operator_lt:       (b, S) => mk("op_menor", { A: entradaSb(b, "OPERAND1", S), B: entradaSb(b, "OPERAND2", S) }),
  operator_gt:       (b, S) => mk("op_maior", { A: entradaSb(b, "OPERAND1", S), B: entradaSb(b, "OPERAND2", S) }),
  operator_equals:   (b, S) => mk("op_igual", { A: entradaSb(b, "OPERAND1", S), B: entradaSb(b, "OPERAND2", S) }),
  operator_and:      (b, S) => mk("op_e",  { A: entradaSb(b, "OPERAND1", S), B: entradaSb(b, "OPERAND2", S) }),
  operator_or:       (b, S) => mk("op_ou", { A: entradaSb(b, "OPERAND1", S), B: entradaSb(b, "OPERAND2", S) }),
  operator_not:      (b, S) => mk("op_nao", { A: entradaSb(b, "OPERAND", S) }),

  data_setvariableto:   (b, S) => mk("var_def",  { VAR: campoSb(b, "VARIABLE"), VAL: entradaSb(b, "VALUE", S) }),
  data_changevariableby:(b, S) => mk("var_muda", { VAR: campoSb(b, "VARIABLE"), VAL: entradaSb(b, "VALUE", S) }),
  data_variable:        (b)    => mk("var_ler",  { VAR: campoSb(b, "VARIABLE") })
};

/* o bloco de valor bruto tem um menu de canal; aceitamos varias grafias */
function canalCru(b, S) {
  let v = entradaSb(b, "CHANNEL", S) || entradaSb(b, "COLOR", S) || entradaSb(b, "VALUE", S);
  if (!v) for (const k in (b.fields || {})) v = { lit: b.fields[k][0] };
  const s = String(v ? v.lit : "red").toLowerCase();
  return { lit: /verd|green/.test(s) ? "g" : /azul|blue/.test(s) ? "b" : "r" };
}
function mk(op, a, c) {
  const b = criaBloco(op);
  if (a) for (const k in a) if (a[k] !== null && a[k] !== undefined) b.a[k] = a[k];
  if (c) b.c = c;
  return b;
}

function convBloco(b, BS) {
  if (b.opcode === "procedures_definition") {
    const proto = BS[b.inputs.custom_block[1]];
    const nome = proto && proto.mutation ? proto.mutation.proccode : "bloco";
    return mk("meu_def", { NOME: { lit: nome } });
  }
  if (b.opcode === "procedures_call") {
    return mk("meu_chama", { NOME: { lit: b.mutation ? b.mutation.proccode : "bloco" } });
  }
  const f = MAPA[b.opcode];
  if (f) return f(b, BS);
  /* qualquer bloco de "valor bruto" do SPIKE, seja qual for o nome exato */
  if (/raw/i.test(b.opcode) && b.inputs && b.inputs.PORT) {
    const r = mk("sen_cru", { P: entradaSb(b, "PORT", BS), CANAL: canalCru(b, BS) });
    r.origem = b.opcode;                 /* guarda o nome real, para devolver igual na hora de exportar */
    return r;
  }
  const d = criaBloco("desconhecido");
  d.origem = b.opcode;
  return d;
}

function contaBlocos(arr, comArgs) {
  let n = 0;
  for (const b of arr) {
    n++;
    if (comArgs) for (const k in b.a) if (b.a[k] && b.a[k].op) n += contaBlocos([b.a[k]], true);
    for (const s of b.c) n += contaBlocos(s, comArgs);
  }
  return n;
}

function importaProjeto(json, nome) {
  const alvo = json.targets.find(t => !t.isStage) || json.targets[0];
  const BS = alvo.blocks;
  const vars = [];
  for (const k in (alvo.variables || {})) vars.push(alvo.variables[k][0]);
  for (const k in ((json.targets.find(t => t.isStage) || {}).variables || {})) {
    const n = json.targets.find(t => t.isStage).variables[k][0];
    if (vars.indexOf(n) < 0) vars.push(n);
  }
  PROG = { scripts: [], vars, procs: [] };

  for (const k in BS) {
    const b = BS[k];
    if (b.opcode === "procedures_prototype" && b.mutation) {
      if (PROG.procs.indexOf(b.mutation.proccode) < 0) PROG.procs.push(b.mutation.proccode);
    }
  }
  const topos = [];
  for (const k in BS) {
    const b = BS[k];
    if (b.topLevel && !b.shadow) topos.push([k, b]);
  }
  /* chapeus primeiro, depois o resto, na ordem do arquivo */
  topos.sort((p, q) => {
    const a = p[1].opcode === "flipperevents_whenProgramStarts" ? 0 : p[1].opcode === "procedures_definition" ? 1 : 2;
    const b2 = q[1].opcode === "flipperevents_whenProgramStarts" ? 0 : q[1].opcode === "procedures_definition" ? 1 : 2;
    return a - b2;
  });
  let x = 40, y = 40, colMax = 0;
  for (const [k] of topos) {
    const pilha = correnteSb(k, BS);
    if (!pilha.length) continue;
    const alt = contaBlocos(pilha) * 40 + 70;
    if (y + alt > 2400 && y > 40) { x += colMax + 90; y = 40; colMax = 0; }
    PROG.scripts.push({ id: novoId(), x, y, pilha });
    y += alt;
    colMax = Math.max(colMax, 360);
  }
  document.getElementById("tagProj").textContent = nome || "programa importado";
  ZOOM = 0.8; PANX = 20; PANY = 20;
  montaPaleta(); desenhaBlocos(); reinicia();
  registra("Programa carregado: " + contaTudo() + " blocos, " +
           PROG.scripts.length + " pilhas, " + PROG.procs.length + " meus blocos.");
  const desc = {};
  (function varre(arr) {
    for (const b of arr) {
      if (b.op === "desconhecido") desc[b.origem] = (desc[b.origem] || 0) + 1;
      for (const k in b.a) if (b.a[k] && b.a[k].op) varre([b.a[k]]);
      for (const s of b.c) varre(s);
    }
  })(PROG.scripts.flatMap(s => s.pilha));
  const nd = Object.keys(desc);
  if (nd.length) registra("Blocos que a bancada mostra mas nao executa: " + nd.join(", "));
}
function contaTudo() { let n = 0; for (const s of PROG.scripts) n += contaBlocos(s.pilha, true); return n; }

async function abreArquivo(file) {
  const nome = file.name.replace(/\.[^.]+$/, "");
  try {
    if (/\.json$/i.test(file.name)) { importaProjeto(JSON.parse(await file.text()), nome); return; }
    const zip = await JSZip.loadAsync(file);
    let alvo = zip.file("project.json");
    if (!alvo) {
      const sb3 = zip.file("scratch.sb3");
      if (sb3) {
        const z2 = await JSZip.loadAsync(await sb3.async("blob"));
        alvo = z2.file("project.json");
      }
    }
    if (!alvo) { registra("Nao achei project.json dentro do arquivo."); return; }
    importaProjeto(JSON.parse(await alvo.async("string")), nome);
  } catch (err) {
    registra("Erro ao abrir: " + err.message);
  }
}
document.getElementById("btAbrir").onclick = () => document.getElementById("arq").click();
document.getElementById("arq").onchange = e => { if (e.target.files[0]) abreArquivo(e.target.files[0]); };
document.getElementById("btLimpar").onclick = () => {
  PROG = { scripts: [], vars: [], procs: [] };
  document.getElementById("tagProj").textContent = "programa novo";
  montaPaleta(); desenhaBlocos(); reinicia();
};

