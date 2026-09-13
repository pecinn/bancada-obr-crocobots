
/* =======================================================================
   15. PORTAL DA ROBÓTICA: entrada, escolha do kit, trilha de desafios e desempenho
   Cada desafio monta um mundo na bancada, acompanha a corrida e dá a nota por critérios que dá para medir
   (onde o robô parou, se bateu, por onde passou, quanto tempo levou, que blocos usou).
   A nota vai de 0 a 100: o objetivo principal libera a 1ª estrela, 80 pontos a 2ª e 100 pontos a 3ª.
   ======================================================================= */
const USUARIOS = { crocobots: "123456" };
/* logos dos patrocinadores: { nome, logo (endereço ou data:image/...), site } */
const PATROCINADORES = [];
const CHAVE_PROGRESSO = "portalRobotica.progresso";
const CHAVE_LIVRE = "portalRobotica.livre";
const NIVEIS = { ini: "Iniciante", int: "Intermediário", av: "Avançado · OBR" };
const SEGMENTOS = { fund: "Ensino Fundamental", medio: "Ensino Médio" };
const COMPETENCIAS = {
  sequencia: "Sequência e movimento", repeticao: "Repetição", sensores: "Sensores", condicoes: "Decisões (se/senão)",
  variaveis: "Variáveis", controle: "Controle P / PD", estrategia: "Estratégia OBR"
};

function lerProgresso() { try { return JSON.parse(localStorage.getItem(CHAVE_PROGRESSO) || "null") || {}; } catch (e) { return {}; } }
function gravaProgresso(p) { try { localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(p)); } catch (e) {} }
const segAtual = () => SESSAO.segmento === "medio" ? "medio" : "fund";
function registroDe(id, seg) {
  const P = lerProgresso(), u = SESSAO.usuario || "anonimo";
  return (((P[u] || {})[PLAT.id] || {})[seg || segAtual()] || {})[id] || null;
}
function salvaRegistro(id, reg, seg) {
  const P = lerProgresso(), u = SESSAO.usuario || "anonimo", s = seg || segAtual();
  P[u] = P[u] || {}; P[u][PLAT.id] = P[u][PLAT.id] || {}; P[u][PLAT.id][s] = P[u][PLAT.id][s] || {};
  P[u][PLAT.id][s][id] = reg;
  gravaProgresso(P);
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------------------------- ajudas para montar os mundos ---------------------------- */
const contorno = (x1, y1, x2, y2) => [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1 - 0.4]];
function base(E, cx, cy, w, h, rotulo, cor) {
  E.extras.push(() => {
    traco(contorno(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), cor || "#1f5fbf", 0.9, "square");
    traco([[cx - 1.5, cy], [cx + 1.5, cy]], cor || "#1f5fbf", 0.4); traco([[cx, cy - 1.5], [cx, cy + 1.5]], cor || "#1f5fbf", 0.4);
    if (rotulo) texto(rotulo, cx, cy + h / 2 + 4, 4.2, cor || "#1f5fbf");
  });
}
function largada(E, x, y, a) {
  E.largada = { x, y, a };
  const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180);
  E.extras.push(() => {
    const p = (f, l) => [x + c * f - s * l, y + s * f + c * l];
    traco([p(-11, -8.5), p(10, -8.5), p(10, 8.5), p(-11, 8.5), p(-11, -8.9)], "#9aa3ad", 0.5, "square");
    texto("SAÍDA", x - c * 15, y - s * 15 - 0.5, 3.4, "#7b848f");
  });
}
const cone = (E, x, y) => E.objs.push({ x, y, r: 3.2, alt: 11, cor: 0xff7a1a });
const caixa = (E, x, y, w, h, cor) => E.objs.push({ x, y, w, h, alt: 12, cor: cor || 0x2f6fb0 });
const parede = (E, x1, y1, x2, y2) => E.objs.push({ x: (x1 + x2) / 2, y: (y1 + y2) / 2, w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), alt: 10, cor: 0xeceae4, parede: true });
const faixaPreta = (E, x, y1, y2, larg) => E.extras.push(() => ret(x - (larg || 2) / 2, y1, x + (larg || 2) / 2, y2, "preto"));
const marcoBandeira = (E, x, y, n) => E.extras.push(() => {
  const pts = []; for (let i = 0; i <= 24; i++) pts.push([x + Math.cos(i / 24 * 6.283) * 6, y + Math.sin(i / 24 * 6.283) * 6]);
  traco(pts, "#b0b8c1", 0.5); texto(String(n), x, y, 5, "#8a939d");
});
const sorteio = (a, b) => a + Math.random() * (b - a);
const rumoGraus = () => ((R.th * 180 / Math.PI) % 360 + 360) % 360;
const difAng = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const pontoSensor = () => posSensor(FRENTE, 0);
function usaOp(ops) {
  let achou = false;
  (function varre(arr) { for (const b of arr) { if (ops.indexOf(b.op) >= 0) achou = true;
    for (const k in b.a) if (b.a[k] && b.a[k].op) varre([b.a[k]]); for (const s of b.c) varre(s); } })(PROG.scripts.flatMap(s => s.pilha));
  return achou;
}
const cm = n => PLAT.id === "ev3" ? n + " cm (≈ " + (n / 17.6).toFixed(2).replace(".", ",") + " rotações da roda de 5,6 cm)" : n + " cm";
const blocoMover = () => PLAT.id === "arduino" ? "andar para frente por __ cm" : PLAT.id === "ev3" ? "mover para frente por __ rotações" : "mover para frente por __ cm";
const sensorCorTxt = () => PLAT.id === "arduino" ? "o sensor de linha (SE ou SD)" : PLAT.id === "ev3" ? "o sensor de cor (porta 2 ou 3)" : "o sensor de cor (porta D ou E)";

/* ---------------------------- os desafios ---------------------------- */
const DESAFIOS = [
  /* =============================== INICIANTE =============================== */
  { id: "ini-base", nivel: "ini", titulo: "Primeira missão: até a base", conceitos: ["sequencia"],
    resumo: "Ande em linha reta e pare dentro do quadrado azul.",
    objetivo: s => "O robô sai da <b>SAÍDA</b> e precisa parar com o centro dentro da <b>BASE</b>, que fica " + cm(60) + " à frente. " +
      (s === "medio" ? "No Ensino Médio a base é menor e vale mais parar bem no centro." : "Monte a sequência de blocos e aperte Rodar."),
    dicas: () => ["Use o bloco <b>" + blocoMover() + "</b> depois de <b>quando o programa iniciar</b>.",
      "O centro do robô fica entre as rodas. A distância de 60 cm é de centro a centro.",
      PLAT.id === "arduino" ? "Sem encoder, o Arduino mede a distância pelo tempo: por isso existe a calibração CM_POR_SEGUNDO no código." : "Se passar da base, diminua o número; se parar antes, aumente."],
    tempoMax: 30, fimQuandoParar: true,
    mundo: (E, s) => { largada(E, 40, 90, 0); base(E, 100, 90, s === "medio" ? 14 : 24, s === "medio" ? 14 : 24, "BASE"); },
    criterios: s => [["Parou com o centro dentro da base", 60, true], ["Parou a no máximo " + (s === "medio" ? 2 : 4) + " cm do centro da base", 25],
      ["Usou no máximo " + (s === "medio" ? 3 : 4) + " blocos", 15]],
    avalia: (D, s) => { const m = s === "medio" ? 7 : 12, d = Math.hypot(R.x - 100, R.y - 90);
      return [Math.abs(R.x - 100) <= m && Math.abs(R.y - 90) <= m, d <= (s === "medio" ? 2 : 4), contaTudo() <= (s === "medio" ? 3 : 4)]; } },

  { id: "ini-curva", nivel: "ini", titulo: "Curva de 90°: a garagem do lado", conceitos: ["sequencia"],
    resumo: "Ande, gire 90° para a esquerda e entre na garagem sem bater no prédio.",
    objetivo: s => "A garagem fica " + cm(60) + " à frente e " + cm(60) + " à esquerda. O prédio no meio não deixa cortar caminho: " +
      "ande, <b>gire 90°</b> e ande de novo." + (s === "medio" ? " No Médio o robô precisa terminar <b>virado para a frente da garagem</b> (±8°)." : ""),
    dicas: () => [PLAT.id === "spike" ? "Para girar no lugar: <b>mover com direção -100 por __ graus</b> (graus de roda). Teste valores." :
      PLAT.id === "ev3" ? "Para girar no lugar: <b>mover com direção -100 por __ rotações</b>. Com eixo de 14 cm, 90° de robô ≈ 0,62 rotação." :
      "Para girar: <b>motores: esquerdo -50% direito 50%</b>, <b>esperar</b> e <b>parar os motores</b>. Ajuste o tempo.",
      "Girar para a esquerda é direção negativa; para a direita, positiva.", "Teste um pedaço de cada vez: primeiro só a reta, depois a curva."],
    tempoMax: 40, fimQuandoParar: true,
    mundo: (E, s) => { largada(E, 40, 40, 0); caixa(E, 68, 72, 30, 30, 0x5a6470); base(E, 100, 100, s === "medio" ? 18 : 26, s === "medio" ? 18 : 26, "GARAGEM"); },
    criterios: s => [["Parou dentro da garagem", 60, true], ["Terminou virado para a garagem (±" + (s === "medio" ? 8 : 15) + "°)", 20], ["Não bateu no prédio", 20]],
    avalia: (D, s) => { const m = s === "medio" ? 9 : 13;
      return [Math.abs(R.x - 100) <= m && Math.abs(R.y - 100) <= m, difAng(rumoGraus(), 90) <= (s === "medio" ? 8 : 15), CORRIDA.batidas === 0]; } },

  { id: "ini-quadrado", nivel: "ini", titulo: "Quadrado perfeito", conceitos: ["repeticao", "sequencia"],
    resumo: "Passe pelas bandeiras 1, 2 e 3 e volte à saída. Use o bloco repetir.",
    objetivo: s => "Desenhe um quadrado de " + cm(50) + " de lado: passe pelas bandeiras <b>1, 2 e 3</b>, nessa ordem, e volte à saída. " +
      "Um quadrado é <b>andar e girar, 4 vezes</b>: o bloco <b>repetir</b> faz isso sem copiar blocos." + (s === "medio" ? " No Médio: no máximo 4 blocos." : ""),
    dicas: () => ["Monte um lado (andar + girar 90°) e coloque dentro de <b>repetir 4 vezes</b>.",
      "Se o quadrado \"abre\", o giro está fraco; se \"fecha\", está forte.", "O cone do meio só atrapalha quem corta caminho."],
    tempoMax: 60, fimQuandoParar: true,
    mundo: (E) => { largada(E, 60, 50, 0); marcoBandeira(E, 110, 50, 1); marcoBandeira(E, 110, 100, 2); marcoBandeira(E, 60, 100, 3); cone(E, 85, 75); },
    pontos: [[110, 50], [110, 100], [60, 100]],
    criterios: s => [["Passou pelas bandeiras 1, 2 e 3 em ordem", 40, true], ["Voltou a até 8 cm da saída", 20], ["Usou o bloco repetir", 20],
      ["Usou no máximo " + (s === "medio" ? 4 : 6) + " blocos", 20]],
    avalia: (D, s) => [D.bandeiras >= 3, Math.hypot(R.x - 60, R.y - 50) <= 8, usaOp(["ctl_repetir"]), contaTudo() <= (s === "medio" ? 4 : 6)] },

  { id: "ini-slalom", nivel: "ini", titulo: "Slalom dos cones", conceitos: ["sequencia", "repeticao"],
    resumo: "Zigue-zague entre 4 cones: por cima do 1º, por baixo do 2º... sem derrubar nenhum.",
    objetivo: s => "Passe o <b>1º cone por cima</b>, o <b>2º por baixo</b>, o 3º por cima e o 4º por baixo, e cruze a linha de chegada à direita. " +
      "Encostar num cone conta como batida." + (s === "medio" ? " No Médio o tempo limite é de 18 s." : " Tempo limite: 25 s."),
    dicas: () => ["Curvas suaves: <b>" + (PLAT.id === "arduino" ? "motores: esquerdo 30% direito 60%" : "mover com direção -40 por ...") + "</b> faz o robô andar em arco.",
      "O movimento que passa um cone por cima e o próximo por baixo se repete: dá para usar <b>repetir 2 vezes</b>.",
      "Os cones estão a 40 cm um do outro."],
    tempoMax: 45, fimQuandoParar: true,
    mundo: (E) => { largada(E, 28, 90, 0); for (const x of [70, 110, 150, 190]) cone(E, x, 90); E.extras.push(() => { ret(222, 60, 224, 120, "#b0b8c1"); texto("CHEGADA", 223, 126, 4, "#7b848f"); }); },
    criterios: s => [["Cruzou a chegada", 40, true], ["Passou cada cone do lado certo", 30], ["Não encostou em nenhum cone", 20],
      ["Terminou em até " + (s === "medio" ? 18 : 25) + " s", 10]],
    acompanha: D => { D.lados = D.lados || {}; [70, 110, 150, 190].forEach((x, i) => { if (Math.abs(R.x - x) < 2.5) D.lados[i] = Math.sign(R.y - 90); });
      if (R.x > 223 && D.cruzou === undefined) D.cruzou = R.t; },
    avalia: (D, s) => { const certo = [1, -1, 1, -1].filter((sg, i) => D.lados && D.lados[i] === sg).length;
      return [D.cruzou !== undefined, certo === 4 ? true : certo / 4, CORRIDA.batidas === 0, D.cruzou !== undefined && D.cruzou <= (s === "medio" ? 18 : 25)]; } },

  { id: "ini-re", nivel: "ini", titulo: "Estacionar de ré", conceitos: ["sequencia"],
    resumo: "Entre de ré na vaga entre as duas caixas, sem encostar.",
    objetivo: s => "A vaga fica embaixo, à direita. O robô precisa terminar <b>dentro da vaga</b> e <b>de ré</b> (com a frente virada para fora dela). " +
      (s === "medio" ? "No Médio: sem batidas e em até 15 s." : "Sem encostar nas caixas."),
    dicas: () => ["Planeje no papel: ande até a frente da vaga, gire e entre andando para trás.",
      "Para andar de ré: <b>" + (PLAT.id === "arduino" ? "andar para trás" : "mover para trás") + "</b>.", "A vaga tem 40 cm de largura e o robô 15 cm: sobra pouco."],
    tempoMax: 45, fimQuandoParar: true,
    mundo: (E) => { largada(E, 40, 140, 0); caixa(E, 128, 58, 8, 40, 0x7a3fb0); caixa(E, 172, 58, 8, 40, 0x7a3fb0); parede(E, 124, 34, 176, 37); base(E, 150, 58, 34, 38, "VAGA", "#7a3fb0"); },
    criterios: s => [["Parou dentro da vaga", 50, true], ["Entrou de ré (frente para fora da vaga, ±15°)", 20], ["Não encostou nas caixas", 20],
      ["Terminou em até " + (s === "medio" ? 15 : 30) + " s", 10]],
    avalia: (D, s) => [Math.abs(R.x - 150) <= 13 && R.y >= 42 && R.y <= 78, difAng(rumoGraus(), 90) <= 15, CORRIDA.batidas === 0, D.fimT <= (s === "medio" ? 15 : 30)] },

  { id: "ini-faixa", nivel: "ini", titulo: "Pare na faixa preta", conceitos: ["sensores", "repeticao"],
    resumo: "A faixa muda de lugar a cada corrida: só o sensor de cor sabe onde parar.",
    objetivo: s => "Ande até achar a <b>faixa preta</b> e pare com " + sensorCorTxt() + " em cima dela. A cada corrida a faixa fica num lugar diferente, " +
      "então contar centímetros não funciona." + (s === "medio" ? " No Médio o robô não pode passar mais de 2 cm da faixa." : ""),
    dicas: () => ["Use <b>começar a mover</b> e depois <b>esperar até</b> com " + (PLAT.id === "arduino" ? "<b>sensor de linha > 600</b> (no preto o número sobe)" : "<b>é a cor preto?</b>") + "; aí <b>parar de mover</b>.",
      "Devagar o robô para mais perto: defina a velocidade em uns 30%.", PLAT.id === "ev3" ? "No EV3 o preto é a cor 1." : "No painel Sensores dá para ver o que o sensor está lendo."],
    tempoMax: 30, fimQuandoParar: true, sorteia: true,
    mundo: (E, s, P) => { P.x = P.x || Math.round(sorteio(90, 195)); largada(E, 30, 90, 0); faixaPreta(E, P.x, 62, 118, 2); },
    criterios: s => [["Parou com o sensor em cima da faixa", 60, true], ["Não passou mais de " + (s === "medio" ? 2 : 8) + " cm da faixa", 20], ["Terminou em até 20 s", 20]],
    acompanha: D => { D.maxSx = Math.max(D.maxSx || 0, pontoSensor().x); },
    avalia: (D, s) => { const x = D.params.x, sx = pontoSensor().x;
      return [Math.abs(sx - x) <= 1.8, D.maxSx <= x + (s === "medio" ? 2 : 8), D.fimT <= 20]; } },

  { id: "ini-contar", nivel: "ini", titulo: "Contar faixas", conceitos: ["variaveis", "sensores", "repeticao"],
    resumo: "Várias faixas no caminho: pare exatamente na faixa pedida, contando com uma variável.",
    objetivo: s => "Há " + (s === "medio" ? 5 : 4) + " faixas pretas com espaços que mudam a cada corrida. Pare em cima da <b>" + (s === "medio" ? "4ª" : "3ª") + " faixa</b>. " +
      "Crie uma <b>variável</b> que soma 1 cada vez que o sensor passa por uma faixa.",
    dicas: () => ["Crie a variável <b>faixas</b> em Variáveis e comece com 0.", "Cada faixa: espere o preto aparecer, some 1, e espere o preto <b>sumir</b> (senão a mesma faixa conta várias vezes).",
      "Use <b>repetir até faixas = 3</b>."],
    tempoMax: 40, fimQuandoParar: true, sorteia: true,
    mundo: (E, s, P) => { if (!P.xs) { P.xs = []; let x = 70; const n = s === "medio" ? 5 : 4; for (let i = 0; i < n; i++) { x += Math.round(sorteio(20, 30)); P.xs.push(x); } }
      largada(E, 30, 90, 0); P.xs.forEach(x => faixaPreta(E, x, 62, 118, 2)); },
    criterios: s => [["Parou em cima da " + (s === "medio" ? "4ª" : "3ª") + " faixa", 60, true], ["Usou uma variável para contar", 20], ["Terminou em até 30 s", 20]],
    avalia: (D, s) => { const alvo = D.params.xs[s === "medio" ? 3 : 2], sx = pontoSensor().x;
      return [Math.abs(sx - alvo) <= 1.8, usaOp(["var_muda"]) || (usaOp(["var_def"]) && usaOp(["var_ler"])), D.fimT <= 30]; } },

  { id: "ini-radar", nivel: "ini", titulo: "Radar: pare antes da parede", conceitos: ["sensores", "condicoes"],
    resumo: "O ultrassônico mede a distância: pare perto da parede sem encostar.",
    objetivo: s => "A parede fica num lugar diferente a cada corrida. Pare com a frente do robô a <b>" + (s === "medio" ? "5 cm (±1)" : "10 cm (±2)") + "</b> da parede, " +
      "usando o <b>sensor de distância</b>.",
    dicas: () => ["O sensor fica na frente do robô: o número que ele mostra já é a distância da frente até a parede.",
      "Rápido de longe e devagar de perto: <b>se distância < 30 então velocidade 20%</b>.", PLAT.id === "arduino" ? "No Arduino é o HC-SR04: <b>HC-SR04: distância em cm</b>." : "No painel Sensores aparece a distância ao vivo."],
    tempoMax: 30, fimQuandoParar: true, sorteia: true,
    mundo: (E, s, P) => { P.x = P.x || Math.round(sorteio(110, 205)); largada(E, 30, 90, 0); parede(E, P.x, 55, P.x + 3, 125); },
    criterios: s => [["Parou a " + (s === "medio" ? "5 ± 1" : "10 ± 2") + " cm da parede", 60, true], ["Não encostou na parede", 25], ["Terminou em até 20 s", 15]],
    avalia: (D, s) => { const folga = D.params.x - (R.x + 8), alvo = s === "medio" ? 5 : 10, tol = s === "medio" ? 1 : 2;
      return [Math.abs(folga - alvo) <= tol, CORRIDA.batidas === 0, D.fimT <= 20]; } },

  /* =============================== INTERMEDIÁRIO =============================== */
  { id: "int-borda", nivel: "int", titulo: "Seguidor de borda com 1 sensor", conceitos: ["sensores", "condicoes"],
    resumo: "Siga a linha usando um sensor só: um lado da borda é preto, o outro é branco.",
    objetivo: s => "Siga a linha do começo até a <b>faixa vermelha</b> usando <b>um sensor</b>. Pare em cima dela e fique 5 s parado (regra da OBR)." +
      (s === "medio" ? " No Médio: sensores com ruído, motores diferentes e até 60 s." : " Até 90 s."),
    dicas: () => ["Siga a <b>borda</b>: se o sensor vê preto, vire para o branco; se vê branco, vire para o preto.",
      "Com <b>sempre</b> e <b>se/senão</b> o robô decide o tempo todo.", "Para parar no fim: <b>se é a cor vermelho? então parar</b>."],
    tempoMax: 150, realista: true, pista: E => rota(E, "O", [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1, "Curva 90"], [5, 2], [5, 3, "Curva 90"], [4, 3], [3, 3], [2, 3, "Curva 90"], [2, 4], [2, 5]], "fim"),
    criterios: s => [["Validou a chegada (5 s parado na faixa vermelha)", 60, true], ["Não saiu da linha", 20], ["Terminou em até " + (s === "medio" ? 60 : 90) + " s", 20]],
    avalia: (D, s) => [CORRIDA.completou, CORRIDA.saidas === 0, CORRIDA.completou && CORRIDA.tempoFim <= (s === "medio" ? 60 : 90)] },

  { id: "int-cantos", nivel: "int", titulo: "Cantos de 90° com 2 sensores", conceitos: ["sensores", "condicoes"],
    resumo: "Cantos retos sem verde: com dois sensores o robô sabe para que lado virar.",
    objetivo: s => "Uma linha com <b>cantos de 90°</b>. Use <b>os dois sensores</b>: quando um vê preto, o robô vira para o lado dele. " +
      "Pare na faixa vermelha." + (s === "medio" ? " No Médio: com ruído e até 70 s." : " Até 110 s."),
    dicas: () => ["Três casos: os dois no branco (reto), só o esquerdo no preto (vira à esquerda), só o direito no preto (vira à direita).",
      "No canto de 90° vire <b>até achar a linha de novo</b>, não por um tempo fixo.", "Velocidade baixa nos cantos ajuda muito."],
    tempoMax: 180, realista: true, pista: E => rota(E, "O", [[0, 1], [1, 1], [2, 1], [2, 2], [2, 3], [3, 3], [4, 3], [4, 2], [4, 1], [5, 1], [6, 1], [6, 2], [6, 3], [6, 4]], "fim"),
    criterios: s => [["Validou a chegada", 60, true], ["Não saiu da linha", 20], ["Terminou em até " + (s === "medio" ? 70 : 110) + " s", 20]],
    avalia: (D, s) => [CORRIDA.completou, CORRIDA.saidas === 0, CORRIDA.completou && CORRIDA.tempoFim <= (s === "medio" ? 70 : 110)] },

  { id: "int-p", nivel: "int", titulo: "Controle proporcional nas curvas em S", conceitos: ["controle", "variaveis", "sensores"],
    resumo: "Liga-desliga balança. Com o erro × Kp o robô fica em cima da linha: a nota mede quanto ele se afasta dela.",
    objetivo: s => "Siga as <b>curvas em S</b> até a faixa vermelha, <b>ficando o mais perto possível da linha</b>. " +
      "A bancada mede a distância média entre o meio dos sensores e a linha: precisa ficar em até " + (s === "medio" ? "0,9" : "1,5") + " cm.",
    dicas: () => ["<b>erro = luz esquerda − luz direita</b>.", "<b>esquerda = base + Kp × erro</b> e <b>direita = base − Kp × erro</b>.",
      "Comece com base 30 e Kp 0,5. Balança muito? diminua o Kp. Sai nas curvas? aumente.", PLAT.id === "arduino" ? "No Arduino o número do sensor é invertido (preto = maior): troque a ordem da subtração." : "Veja o gráfico ao vivo na aba Sensores."],
    tempoMax: 150, realista: true,
    pista: E => rota(E, "O", [[0, 2], [1, 2, "Curva em S"], [2, 2, "Curva em S"], [3, 2], [4, 2, "Curva 90"], [4, 3], [4, 4, "Curva 90"], [5, 4, "Curva em S"], [6, 4, "Curva em S"], [7, 4]], "fim"),
    criterios: s => [["Validou a chegada", 50, true], ["Distância média até a linha de no máximo " + (s === "medio" ? "0,9" : "1,5") + " cm", 30], ["Terminou em até " + (s === "medio" ? 60 : 90) + " s", 20]],
    acompanha: D => { if (!CORRIDA.completou && !CORRIDA.naChegada) { const m = pontoSensor(); D.somaDesvio = (D.somaDesvio || 0) + Math.min(9, distLinha(m.x, m.y)); D.nDesvio = (D.nDesvio || 0) + 1; } },
    medida: D => D.nDesvio ? "distância média da linha: " + (D.somaDesvio / D.nDesvio).toFixed(2).replace(".", ",") + " cm" : "",
    avalia: (D, s) => [CORRIDA.completou, D.nDesvio > 0 && D.somaDesvio / D.nDesvio <= (s === "medio" ? 0.9 : 1.5), CORRIDA.completou && CORRIDA.tempoFim <= (s === "medio" ? 60 : 90)] },

  { id: "int-verde", nivel: "int", titulo: "Verde manda virar", conceitos: ["condicoes", "sensores", "estrategia"],
    resumo: "Encruzilhadas: com verde antes da linha, vire para o lado dele; sem verde, siga reto.",
    objetivo: s => "Regra da OBR: um <b>quadrado verde antes</b> da encruzilhada manda virar para o lado do verde. Sem verde, siga reto. " +
      "Chegue à faixa vermelha." + (s === "medio" ? " No Médio: com ruído e sem sair da linha." : ""),
    dicas: () => ["Cheque o verde <b>antes</b> de tratar a linha preta atravessada.", "Achou verde? ande até o meio do cruzamento e só então gire.",
      PLAT.id === "ev3" ? "No EV3 o verde é a cor 3." : "Verde é a cor 6."],
    tempoMax: 200, realista: true,
    pista: E => rota(E, "O", [[0, 0], [1, 0, "Cruzamento"], [2, 0, "Cruzamento", { verde: 1 }], [2, 1], [2, 2, "T", { ramo: "O", verde: 1 }], [3, 2], [4, 2, "Cruzamento", { verde: 1 }], [4, 1], [4, 0, "T", { ramo: "O", verde: 1 }], [5, 0], [6, 0]], "fim"),
    criterios: s => [["Validou a chegada", 60, true], ["Não saiu da linha", 20], ["Terminou em até " + (s === "medio" ? 100 : 150) + " s", 20]],
    avalia: (D, s) => [CORRIDA.completou, CORRIDA.saidas === 0, CORRIDA.completou && CORRIDA.tempoFim <= (s === "medio" ? 100 : 150)] },

  { id: "int-obstaculo", nivel: "int", titulo: "Obstáculo no caminho", conceitos: ["sensores", "condicoes", "estrategia"],
    resumo: "Siga a linha, perceba o obstáculo com o ultrassônico, contorne e volte para a linha.",
    objetivo: s => "Há um obstáculo em cima da linha. Contorne sem encostar e volte para a linha do outro lado; depois pare na faixa vermelha." +
      (s === "medio" ? " No Médio: com ruído e sem nenhuma batida." : ""),
    dicas: () => ["Distância < 15 cm? pare e contorne: gire 90°, ande em arco e procure a linha.", "Use o giroscópio para saber quanto já girou.",
      "Volte a seguir a linha só quando um sensor encontrar o preto de novo."],
    tempoMax: 150, realista: true, pista: E => rota(E, "O", [[0, 2], [1, 2], [2, 2], [3, 2, "Reta", { obst: true }], [4, 2], [5, 2], [6, 2]], "fim"),
    criterios: s => [["Validou a chegada", 60, true], ["Não encostou no obstáculo", 20], ["Não saiu da linha", 20]],
    avalia: (D) => [CORRIDA.completou, CORRIDA.batidas === 0, CORRIDA.saidas === 0] },

  { id: "int-gap", nivel: "int", titulo: "Gap e linha tracejada", conceitos: ["condicoes", "variaveis"],
    resumo: "A linha some por 10 cm: o robô precisa seguir reto até achar a linha de novo.",
    objetivo: s => "Dois <b>gaps</b> e um trecho <b>tracejado</b>. Quando os dois sensores veem branco por um tempo, siga reto em vez de girar procurando." +
      " Pare na faixa vermelha.",
    dicas: () => ["Guarde no <b>cronômetro</b> há quanto tempo o robô não vê preto.", "Branco por pouco tempo = curva; branco por muito tempo = gap: siga reto.",
      "Numa reta de verdade o erro fica perto de zero: dá para aproveitar isso."],
    tempoMax: 150, realista: true, pista: E => rota(E, "O", [[0, 2], [1, 2, "Falha (gap)"], [2, 2], [3, 2, "Tracejada"], [4, 2], [5, 2, "Falha (gap)"], [6, 2]], "fim"),
    criterios: s => [["Validou a chegada", 60, true], ["Não saiu da linha", 25], ["Terminou em até " + (s === "medio" ? 50 : 80) + " s", 15]],
    avalia: (D, s) => [CORRIDA.completou, CORRIDA.saidas === 0, CORRIDA.completou && CORRIDA.tempoFim <= (s === "medio" ? 50 : 80)] },

  { id: "int-prata", nivel: "int", titulo: "Achar a entrada da sala: a fita prata", conceitos: ["sensores", "variaveis", "estrategia"],
    resumo: "O jeito que funciona muda de kit para kit. Calibre, encontre a diferença e pare em cima da fita.",
    objetivo: s => "No fim da linha tem a <b>fita prata</b> da sala de resgate. Pare com os sensores <b>em cima dela</b>. " +
      (PLAT.id === "spike" ? "No SPIKE a <b>luz refletida</b> da prata dá o mesmo que o branco: use o <b>valor bruto do vermelho</b>, que cai bastante na prata."
        : PLAT.id === "ev3" ? "No EV3 não existe valor bruto de cor, mas a fita espelhada reflete <b>mais</b> luz que o branco."
        : "No Arduino a leitura analógica da prata fica <b>abaixo</b> da do branco (mais luz = número menor).") +
      (s === "medio" ? " No Médio a fita muda de lugar, tem ruído e o sensor precisa ficar a até 1 cm dela." : ""),
    dicas: () => ["Primeiro <b>meça</b>: coloque o robô no branco, na linha e na fita, e anote os números da aba Sensores.",
      PLAT.id === "spike" ? "Escolha um limite no meio do caminho entre o branco e a prata no <b>valor bruto vermelho</b>." :
        PLAT.id === "ev3" ? "Escolha um limite de luz refletida entre o branco (~71) e a prata (~90)." : "Escolha um limite entre a prata (~80) e o branco (~150).",
      "Confirme duas leituras seguidas antes de parar: uma leitura sozinha pode ser o sensor passando na borda da linha."],
    tempoMax: 60, realista: true, fimQuandoParar: true, sorteia: true,
    mundo: (E, s, P) => { P.n = P.n || (s === "medio" ? 3 + Math.floor(Math.random() * 3) : 4); const cels = []; for (let i = 0; i <= P.n; i++) cels.push([i, 3]);
      rota(E, "O", cels, "L"); P.x = (P.n + 1) * 30; E.extras.push(() => ret(P.x + 0.5, 92, P.x + 3, 118, "prata")); },
    criterios: s => [["Parou com os sensores em cima da fita", 60, true], ["Não parou antes, no meio da linha", 20], ["Terminou em até 25 s", 20]],
    acompanha: D => { const parado = Math.abs(MOT[PAR_MOV[0]] ? MOT[PAR_MOV[0]].real : 0) + Math.abs(MOT[PAR_MOV[1]] ? MOT[PAR_MOV[1]].real : 0) < 0.5;
      if (parado && R.t > 0.6 && D.primeiraParada === undefined) { D.pp = D.pp || R.t; if (R.t - D.pp > 0.8) D.primeiraParada = pontoSensor().x; } else if (!parado) D.pp = 0; },
    avalia: (D, s) => { const sx = pontoSensor().x, ok = sx >= D.params.x - (s === "medio" ? 0.5 : 1.5) && sx <= D.params.x + 3.5 + (s === "medio" ? 0.5 : 1.5);
      return [ok, D.primeiraParada === undefined || D.primeiraParada >= D.params.x - 3, D.fimT <= 25]; } }
];

/* avançado: as pistas da OBR que a bancada já tem. Fundamental = Nível 1 da área de resgate (sem parede); Médio = Nível 2 (borda de 6 cm) */
[["Nível 1 · Curvas suaves", "Retas e curvas suaves: o primeiro percurso completo."],
 ["Nível 2 · Cantos de 90° sem verde", "Cantos retos e zigue-zagues sem marcação."],
 ["Nível 3 · Encruzilhadas e verdes", "Cruzamentos, Ts, verdes e o verde que deve ser ignorado."],
 ["Nível 4 · Gaps, tracejado e obstáculos", "A linha some, fica tracejada e ganha obstáculos."],
 ["Nível 5 · Rampa e gangorra", "Relevo: rampa com plataforma e gangorra."],
 ["Sala de resgate · treino (sorteada)", "Só o resgate: vítimas e áreas mudam de lugar a cada corrida."],
 ["Desafio OBR · percurso e resgate", "Percurso, sala de resgate e obstáculo na saída."],
 ["OBR completa · A (sala 90 × 90)", "Tudo o que o manual traz, com sala 90 × 90."],
 ["OBR completa · B (sala 120 × 90)", "Tudo o que o manual traz, com sala 120 × 90."],
 ["OBR completa · C (sala 90 × 120)", "Tudo o que o manual traz, com a sala em pé."]].forEach(([nome, resumo], i) => {
  const temSala = /resgate|OBR completa|Desafio OBR/.test(nome);
  DESAFIOS.push({ id: "av-" + (i + 1), nivel: "av", titulo: nome, conceitos: temSala ? ["estrategia", "controle", "sensores"] : ["estrategia", "controle"],
    resumo, pistaObr: nome, tempoMax: temSala ? 600 : 400, realista: true,
    objetivo: s => "Pista oficial da bancada, com as regras da OBR 2026: parar 5 s na faixa vermelha, não sair da linha" +
      (temSala ? ", resgatar as vítimas (prata na área verde, preta na vermelha) e sair pela fita preta" : "") + ". " +
      (s === "medio" ? "Ensino Médio: <b>Nível 2</b> da área de resgate (recipiente com borda de 6 cm) e mundo real ligado (ruído, motores diferentes, inércia)."
        : "Ensino Fundamental: <b>Nível 1</b> da área de resgate (triângulo sem parede)."),
    dicas: () => ["Na aba Programas… há o <b>Seguidor PD OBR</b>" + (PLAT.id === "spike" ? " e o <b>Samurai</b> da equipe" : "") + " para estudar e melhorar.",
      "Use 🧪 Testar tudo para ver em que pistas o seu programa se perde.", "Na OBR são 5 minutos: a nota de tempo usa esse limite."],
    criterios: s => temSala
      ? [["Validou a chegada", 40, true], ["Vítimas na área certa (10 pontos cada)", 30], ["Não saiu da linha", 15], ["Terminou em até 5 min", 15]]
      : [["Validou a chegada", 50, true], ["Não saiu da linha", 25], ["Sem falha de progresso na faixa vermelha", 10], ["Terminou em até 5 min", 15]],
    avalia: () => temSala
      ? [CORRIDA.completou, Math.min(1, CORRIDA.resgatadas / 3), CORRIDA.saidas === 0, CORRIDA.completou && CORRIDA.tempoFim <= 300]
      : [CORRIDA.completou, CORRIDA.saidas === 0, CORRIDA.falhas === 0, CORRIDA.completou && CORRIDA.tempoFim <= 300] });
});

/* os mundos dos desafios entram na lista de pistas, escondidos do seletor */
const PISTA_DESAFIO = {};
for (const d of DESAFIOS) {
  if (d.pistaObr) { PISTA_DESAFIO[d.id] = PISTAS.findIndex(p => p.nome === d.pistaObr); continue; }
  const i = PISTAS.length;
  PISTAS.push({ nome: "🎯 " + d.titulo, desc: d.resumo, tipo: "lad", estado: null, oculta: true, desafio: d.id,
    def: E => { const D = DESAFIO && DESAFIO.def === d ? DESAFIO : null;
      if (d.pista) d.pista(E); else d.mundo(E, segAtual(), D ? D.params : (d._params = d._params || {})); } });
  PISTA_DESAFIO[d.id] = i;
}

/* ---------------------------- um desafio em andamento ---------------------------- */
let DESAFIO = null;
let REAL_ANTES = null;
function sorteiaDesafio() {
  if (!DESAFIO || !DESAFIO.def.sorteia || DESAFIO.montando) return;
  const i = PISTA_DESAFIO[DESAFIO.def.id], p = PISTAS[i];
  DESAFIO.params = {};
  p.estado = null;
  DESAFIO.montando = true;
  const E = estadoDe(i);
  DESAFIO.montando = false;
  RELEVO = copia(E.relevo); CAIXAS = E.objs.map(o => Object.assign({}, o)); VITIMAS = E.vitimas.map(v => Object.assign({}, v));
  AREAS = E.areas; SEMLINHA = E.semLinha; LARGADA = Object.assign({}, E.largada); ROTA = preparaRota(E.rotaPts);
  pintaPista();
  if (!TESTANDO && TRES) refazCena();
}
/* a cada passo da simulação */
function passoDesafio() {
  const D = DESAFIO; if (!D || !CORRIDA) return null;
  if (D.def.acompanha) D.def.acompanha(D);
  if (D.def.pontos) { const alvo = D.def.pontos[D.bandeiras || 0]; if (alvo && Math.hypot(R.x - alvo[0], R.y - alvo[1]) < 11) D.bandeiras = (D.bandeiras || 0) + 1; }
  if (R.t > D.def.tempoMax) { D.motivo = "tempo esgotado (" + D.def.tempoMax + " s)"; return "fim"; }
  if (D.def.fimQuandoParar) {
    const vel = PORTAS.reduce((s, p) => s + (CFG[p] === "motor" && p !== PA_PORTA ? Math.abs(MOT[p].real) : 0), 0);
    if (Math.hypot(R.x - LARGADA.x, R.y - LARGADA.y) > 3 || Math.abs(R.th - LARGADA.a * Math.PI / 180) > 0.3) D.mexeu = true;
    if (D.mexeu && vel < 0.5) { if (D.paradoDesde === null) D.paradoDesde = R.t; if (R.t - D.paradoDesde > 3) { D.motivo = "robô parado"; return "fim"; } }
    else D.paradoDesde = null;
  }
  return null;
}
function novaTentativa() {
  if (!DESAFIO) return;
  const p = DESAFIO.params;
  Object.assign(DESAFIO, { bandeiras: 0, mexeu: false, paradoDesde: null, motivo: "", fimT: null, maxSx: 0, somaDesvio: 0, nDesvio: 0, lados: {}, cruzou: undefined, primeiraParada: undefined, pp: 0 });
  DESAFIO.params = p || {};
}
/* nota de uma corrida */
function notaDesafio() {
  const D = DESAFIO, d = D.def, s = D.seg;
  D.fimT = CORRIDA && CORRIDA.tempoFim ? CORRIDA.tempoFim : R.t;
  const crit = d.criterios(s), res = d.avalia(D, s);
  let pontos = 0, principal = true;
  const itens = crit.map(([txt, peso, prin], i) => {
    const r = res[i], fr = r === true ? 1 : typeof r === "number" ? Math.max(0, Math.min(1, r)) : 0;
    pontos += peso * fr;
    if (prin && fr < 1) principal = false;
    return { txt, peso, ok: fr >= 1, parcial: fr > 0 && fr < 1, ganho: Math.round(peso * fr) };
  });
  pontos = Math.round(pontos);
  if (!principal) pontos = Math.min(pontos, 40);
  const estrelas = !principal ? 0 : pontos >= 100 ? 3 : pontos >= 80 ? 2 : 1;
  return { pontos, estrelas, itens, t: D.fimT, medida: d.medida ? d.medida(D) : "" };
}
function terminaDesafio() {
  const D = DESAFIO; if (!D || !CORRIDA || R.t < 0.3) return;
  const n = notaDesafio(), d = D.def;
  const reg = registroDe(d.id, D.seg) || { melhor: 0, estrelas: 0, tentativas: 0, historico: [] };
  const melhorou = n.pontos > reg.melhor;
  reg.tentativas++; reg.ultima = Date.now();
  if (n.pontos >= reg.melhor) { reg.melhor = n.pontos; reg.estrelas = Math.max(reg.estrelas, n.estrelas); reg.tempo = n.t; }
  reg.estrelas = Math.max(reg.estrelas, n.estrelas);
  reg.historico = [{ p: n.pontos, e: n.estrelas, t: +n.t.toFixed(1), q: Date.now() }].concat(reg.historico || []).slice(0, 12);
  reg.programa = JSON.parse(JSON.stringify(PROG)); reg.tag = $("tagProj").textContent;
  salvaRegistro(d.id, reg, D.seg);
  mostraAbaDesafio();
  const prox = proximoDesafio(d);
  const res = $("resultado");
  res.innerHTML = '<div class="res-desafio"><div class="estrelas">' + "★".repeat(n.estrelas) + '<span style="opacity:.3">' + "★".repeat(3 - n.estrelas) + "</span></div>" +
    "<h3>" + (n.estrelas === 3 ? "Missão perfeita!" : n.estrelas ? "Missão cumprida!" : "Ainda não foi") + "</h3>" +
    "<p>" + esc(d.titulo) + " · " + SEGMENTOS[D.seg] + "</p>" +
    '<div class="nums"><div><b>' + n.pontos + '</b><span>pontos</span></div><div><b>' + n.t.toFixed(1).replace(".", ",") + ' s</b><span>tempo</span></div><div><b>' +
    reg.melhor + "</b><span>seu recorde</span></div></div>" +
    '<ul class="criterios">' + n.itens.map(it => '<li class="' + (it.ok ? "ok" : it.parcial ? "meio" : "nao") + '"><span>' + (it.ok ? "✓" : it.parcial ? "◐" : "✕") + "</span>" +
      esc(it.txt) + "<b>" + it.ganho + "/" + it.peso + "</b></li>").join("") + "</ul>" +
    (n.medida ? '<p class="medida">' + esc(n.medida) + "</p>" : "") +
    (D.motivo && !n.estrelas ? '<p class="medida">Parou por: ' + esc(D.motivo) + ".</p>" : "") +
    (melhorou && reg.tentativas > 1 ? '<p class="recorde">Novo recorde!</p>' : "") +
    '<div class="botoes"><button class="verde" id="resDeNovo">⟲ Tentar de novo</button>' +
    (prox && n.estrelas ? '<button id="resProx">Próximo desafio ›</button>' : "") + '<button id="resTrilha">Trilha</button></div></div>';
  res.classList.add("show");
  $("resDeNovo").onclick = () => { res.classList.remove("show"); voltaLargada(); $("btRodar").click(); };
  if ($("resProx")) $("resProx").onclick = () => { res.classList.remove("show"); abreDesafio(prox.id); };
  $("resTrilha").onclick = () => { res.classList.remove("show"); mostraPortal("trilha"); };
  if (n.estrelas) { soltaConfete(); fanfarra(); }
}

/* ---------------------------- trilha: travas, próximo, desempenho ---------------------------- */
const doNivel = n => DESAFIOS.filter(d => d.nivel === n);
function liberado(d, seg) {
  const lista = doNivel(d.nivel), i = lista.indexOf(d);
  if (i <= 0) return true;
  const ant = registroDe(lista[i - 1].id, seg);
  return !!(ant && ant.estrelas > 0);
}
function proximoDesafio(d) {
  const lista = doNivel(d.nivel), i = lista.indexOf(d);
  if (i >= 0 && i < lista.length - 1) return lista[i + 1];
  const ordem = ["ini", "int", "av"], k = ordem.indexOf(d.nivel);
  return k < 2 ? doNivel(ordem[k + 1])[0] : null;
}
function resumoDesempenho(seg) {
  const out = { pontos: 0, estrelas: 0, feitos: 0, total: DESAFIOS.length, tentativas: 0, niveis: {}, comp: {}, proximo: null };
  for (const n of Object.keys(NIVEIS)) out.niveis[n] = { estrelas: 0, max: doNivel(n).length * 3, feitos: 0, total: doNivel(n).length };
  const somaComp = {};
  for (const d of DESAFIOS) {
    const r = registroDe(d.id, seg), p = r ? r.melhor : 0, e = r ? r.estrelas : 0;
    out.pontos += p; out.estrelas += e; out.tentativas += r ? r.tentativas : 0;
    if (e > 0) { out.feitos++; out.niveis[d.nivel].feitos++; }
    out.niveis[d.nivel].estrelas += e;
    for (const c of d.conceitos) { somaComp[c] = somaComp[c] || [0, 0]; somaComp[c][0] += p; somaComp[c][1]++; }
    if (!out.proximo && e === 0 && liberado(d, seg)) out.proximo = d;
  }
  for (const c in COMPETENCIAS) out.comp[c] = somaComp[c] ? Math.round(somaComp[c][0] / somaComp[c][1]) : 0;
  return out;
}

/* ---------------------------- telas do portal ---------------------------- */
const portal = $("portal");
function mostraPortal(tela) {
  if (DESAFIO) guardaProgramaDesafio();
  if (RODANDO) { RODANDO = false; paraPar(); PARADO_POR = "parado por você"; }
  portal.hidden = false; portal.dataset.tela = tela;
  document.querySelectorAll("#portal .tela").forEach(t => t.hidden = t.id !== { login: "telaLogin", kits: "telaKits", trilha: "telaTrilha" }[tela]);
  document.body.classList.add("no-portal");
  if (tela === "kits") desenhaKits();
  if (tela === "trilha") desenhaTrilha();
  SESSAO.tela = tela; gravaSessao(SESSAO);
  const foco = portal.querySelector("#" + { login: "lgUsuario", kits: "tituloKits", trilha: "tituloTrilha" }[tela]);
  if (foco && tela === "login") setTimeout(() => foco.focus(), 30);
}
function escondePortal() { portal.hidden = true; document.body.classList.remove("no-portal"); setTimeout(() => { ajustaLona(); trocaVista(); }, 20); }

/* patrocinadores */
(function () {
  const d = $("logosPatrocinio"); if (!d) return;   /* a tela de entrada do modelo não tem faixa de patrocínio */
  if (PATROCINADORES.length) d.innerHTML = PATROCINADORES.map(p => '<a class="logo-p" href="' + esc(p.site || "#") + '" target="_blank" rel="noopener"><img src="' + esc(p.logo) + '" alt="' + esc(p.nome) + '"></a>').join("");
  else d.innerHTML = [1, 2, 3, 4].map(() => '<span class="slot-p">sua marca aqui</span>').join("");
})();

const ARTE_KIT = {
  spike: '<svg viewBox="0 0 160 110" aria-hidden="true"><rect x="22" y="60" width="116" height="16" rx="5" fill="#f2f3f0"/><circle cx="36" cy="82" r="17" fill="#1d1e20"/><circle cx="36" cy="82" r="10" fill="#c5cbd3"/><circle cx="36" cy="82" r="4" fill="#00a3da"/><circle cx="124" cy="82" r="17" fill="#1d1e20"/><circle cx="124" cy="82" r="10" fill="#c5cbd3"/><circle cx="124" cy="82" r="4" fill="#00a3da"/><rect x="46" y="20" width="68" height="44" rx="9" fill="#fdfdfb" stroke="#d5d9de" stroke-width="2"/><rect x="56" y="27" width="40" height="30" rx="4" fill="#2b2f35"/><g fill="#ffcf00">' +
    [0, 1, 2, 3, 4].map(i => [0, 1, 2, 3, 4].map(j => (i + j) % 2 ? "" : '<rect x="' + (59 + j * 7) + '" y="' + (30 + i * 5.2) + '" width="4.4" height="3.6" rx="1"/>').join("")).join("") +
    '</g><circle cx="105" cy="42" r="5" fill="#00a3da"/><rect x="134" y="54" width="14" height="10" rx="3" fill="#1e2024"/></svg>',
  ev3: '<svg viewBox="0 0 160 110" aria-hidden="true"><rect x="18" y="62" width="124" height="14" rx="4" fill="#3b3f45"/><circle cx="34" cy="82" r="17" fill="#15161a"/><circle cx="34" cy="82" r="9" fill="#b9bec5"/><circle cx="34" cy="82" r="3.5" fill="#d0342c"/><circle cx="126" cy="82" r="17" fill="#15161a"/><circle cx="126" cy="82" r="9" fill="#b9bec5"/><circle cx="126" cy="82" r="3.5" fill="#d0342c"/><rect x="44" y="12" width="72" height="52" rx="7" fill="#c9ccd0"/><rect x="50" y="17" width="60" height="42" rx="5" fill="#3b3f45"/><rect x="56" y="22" width="36" height="22" rx="2" fill="#a9b89c"/><text x="74" y="37" font-family="monospace" font-size="9" text-anchor="middle" fill="#2b3226">EV3</text><rect x="96" y="24" width="10" height="16" rx="2" fill="#6b7078"/><rect x="62" y="48" width="24" height="7" rx="3" fill="#d0342c" opacity=".85"/><rect x="138" y="52" width="14" height="12" rx="3" fill="#2b2e33"/><circle cx="145" cy="58" r="3" fill="#d0342c"/></svg>',
  arduino: '<svg viewBox="0 0 160 110" aria-hidden="true"><rect x="14" y="52" width="132" height="30" rx="6" fill="#dff3f3" opacity=".55" stroke="#9fd5d6" stroke-width="2"/><rect x="10" y="60" width="16" height="30" rx="4" fill="#f2c230"/><circle cx="18" cy="84" r="15" fill="#15161a"/><circle cx="18" cy="84" r="8" fill="#f2c230"/><rect x="134" y="60" width="16" height="30" rx="4" fill="#f2c230"/><circle cx="142" cy="84" r="15" fill="#15161a"/><circle cx="142" cy="84" r="8" fill="#f2c230"/><rect x="44" y="22" width="64" height="40" rx="3" fill="#00979d"/><rect x="48" y="25" width="40" height="4" fill="#1b1b1b"/><rect x="60" y="55" width="40" height="4" fill="#1b1b1b"/><rect x="92" y="34" width="12" height="12" rx="1" fill="#1b1b1b"/><circle cx="54" cy="46" r="3" fill="#e5e5e5"/><rect x="112" y="30" width="30" height="16" rx="2" fill="#1f5fbf"/><circle cx="120" cy="38" r="5.5" fill="#d9dde2"/><circle cx="134" cy="38" r="5.5" fill="#d9dde2"/><rect x="20" y="36" width="20" height="18" rx="2" fill="#b3202a"/><rect x="24" y="30" width="12" height="8" fill="#26292e"/></svg>'
};
let NIVEL_TELA = "ini";
function desenhaTrilha() {
  const seg = segAtual(), R_ = resumoDesempenho(seg);
  $("olaTrilha").textContent = SESSAO.usuario || "";
  $("kitAtual").innerHTML = '<span class="bolinha ' + INFO_KIT[PLAT.id].classe + '"></span>' + esc(PLAT.nome) + "<small>trocar</small>";
  document.querySelectorAll("#telaTrilha .segmento button").forEach(b => b.setAttribute("aria-checked", b.dataset.seg === seg ? "true" : "false"));
  $("subTrilha").textContent = SEGMENTOS[seg] + " · " + PLAT.nome + ". Cada desafio libera o próximo com pelo menos 1 estrela.";
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  $("painelDesempenho").innerHTML =
    '<div class="numeros"><div><b>' + R_.pontos + '</b><span>pontos</span></div><div><b>' + R_.estrelas + "<small>/" + DESAFIOS.length * 3 + '</small></b><span>estrelas</span></div>' +
    '<div><b>' + R_.feitos + "<small>/" + R_.total + '</small></b><span>desafios cumpridos</span></div><div><b>' + R_.tentativas + '</b><span>corridas</span></div></div>' +
    '<div class="comp"><h3>Competências <small>média dos melhores pontos</small></h3>' + Object.keys(COMPETENCIAS).map(c =>
      '<div class="barra-comp"><span>' + COMPETENCIAS[c] + '</span><i style="--v:' + R_.comp[c] + '%"></i><b>' + R_.comp[c] + "</b></div>").join("") + "</div>" +
    '<div class="proximo">' + (R_.proximo ? '<h3>Próximo passo</h3><p>' + esc(NIVEIS[R_.proximo.nivel]) + '</p><strong>' + esc(R_.proximo.titulo) + '</strong><button data-acao="desafio" data-id="' + R_.proximo.id + '">Começar ›</button>'
      : "<h3>Trilha completa</h3><p>Agora é buscar 3 estrelas em tudo e testar com o mundo real ligado.</p>") + "</div>";
  document.querySelectorAll("#telaTrilha .niveis button").forEach(b => {
    const n = R_.niveis[b.dataset.nivel];
    b.setAttribute("aria-selected", b.dataset.nivel === NIVEL_TELA ? "true" : "false");
    b.innerHTML = NIVEIS[b.dataset.nivel] + '<span class="pct" style="--v:' + pct(n.estrelas, n.max) + '%">' + n.feitos + "/" + n.total + "</span>";
  });
  $("introNivel").innerHTML = { ini: "Sequência, giros, repetição e os primeiros sensores. Aqui a nota mede precisão: onde o robô parou e quantos blocos usou.",
    int: "Seguir linha com decisões e controle. " + (seg === "medio" ? "No Ensino Médio o <b>mundo real</b> fica ligado (ruído nos sensores, motores diferentes e inércia)." : "Sem ruído no Fundamental."),
    av: "As pistas da OBR 2026. " + (seg === "medio" ? "Área de resgate <b>Nível 2</b> (recipiente com borda de 6 cm) e mundo real ligado." : "Área de resgate <b>Nível 1</b> (triângulo sem parede).") }[NIVEL_TELA];
  $("listaDesafios").innerHTML = doNivel(NIVEL_TELA).map((d, i) => {
    const r = registroDe(d.id, seg), ok = liberado(d, seg), e = r ? r.estrelas : 0;
    return '<article class="desafio' + (ok ? "" : " bloqueado") + (e ? " feito" : "") + '">' +
      '<div class="d-topo"><span class="d-num">' + String(i + 1).padStart(2, "0") + '</span><span class="d-estrelas" aria-label="' + e + ' estrelas">' + "★".repeat(e) + '<span>' + "★".repeat(3 - e) + "</span></span></div>" +
      '<h3 class="d-titulo">' + esc(d.titulo) + '</h3><p class="d-resumo">' + esc(d.resumo) + "</p>" +
      '<div class="d-conceitos">' + d.conceitos.map(c => "<span>" + COMPETENCIAS[c] + "</span>").join("") + "</div>" +
      '<div class="d-rodape"><span class="d-pontos">' + (r ? "recorde <b>" + r.melhor + "</b> · " + r.tentativas + " corrida" + (r.tentativas === 1 ? "" : "s") : ok ? "ainda não tentou" : "🔒 cumpra o anterior") + "</span>" +
      (ok ? '<button data-acao="desafio" data-id="' + d.id + '">' + (r ? "Treinar" : "Começar") + " ›</button>" : "") + "</div></article>";
  }).join("");
}
document.querySelectorAll("#telaTrilha .segmento button").forEach(b => b.onclick = () => { SESSAO.segmento = b.dataset.seg; gravaSessao(SESSAO); desenhaTrilha(); });
document.querySelectorAll("#telaTrilha .niveis button").forEach(b => b.onclick = () => { NIVEL_TELA = b.dataset.nivel; SESSAO.nivelTela = NIVEL_TELA; gravaSessao(SESSAO); desenhaTrilha(); });

/* ---------------------------- entrar num desafio ou na bancada livre ---------------------------- */
function guardaProgramaDesafio() {
  if (!DESAFIO) return;
  const reg = registroDe(DESAFIO.def.id, DESAFIO.seg) || { melhor: 0, estrelas: 0, tentativas: 0, historico: [] };
  reg.programa = JSON.parse(JSON.stringify(PROG)); reg.tag = $("tagProj").textContent;
  salvaRegistro(DESAFIO.def.id, reg, DESAFIO.seg);
}
function mundoReal(liga) {
  if (liga && !REAL_ANTES) { REAL_ANTES = { RUIDO, DIF_MOTOR, INERCIA }; RUIDO = 2; DIF_MOTOR = 3; INERCIA = 0.08; }
  if (!liga && REAL_ANTES) { ({ RUIDO, DIF_MOTOR, INERCIA } = REAL_ANTES); REAL_ANTES = null; }
  montaDeslizes();
}
function abreDesafio(id) {
  const d = DESAFIOS.find(x => x.id === id); if (!d) return;
  if (!DESAFIO) { try { localStorage.setItem(CHAVE_LIVRE + "." + PLAT.id, JSON.stringify({ prog: PROG, tag: $("tagProj").textContent, pista: PISTA_ATUAL })); } catch (e) {} }
  else guardaProgramaDesafio();
  const seg = segAtual();
  DESAFIO = { def: d, seg, params: {} };
  novaTentativa();
  mundoReal(!!d.realista && seg === "medio");
  if (d.nivel === "av") { NIVEL_RESGATE = seg === "medio" ? 2 : 1; $("selNivel").value = String(NIVEL_RESGATE); }
  const i = PISTA_DESAFIO[d.id];
  if (!d.pistaObr) PISTAS[i].estado = null;
  const reg = registroDe(d.id, seg);
  if (reg && reg.programa) usaPrograma(reg.programa, reg.tag || d.titulo);
  else { PROG = { scripts: [{ id: novoId(), x: 40, y: 40, pilha: [criaBloco("ev_inicio")] }], vars: [], procs: [] }; $("tagProj").textContent = d.titulo; }
  ZOOM = 1; PANX = 40; PANY = 40;
  montaPista(i); sel.value = d.pistaObr ? i : ""; mostraDesc(); montaTabuleiro();
  montaPaleta(); desenhaBlocos();
  SESSAO.tela = "bancada"; SESSAO.desafio = id; gravaSessao(SESSAO);
  escondePortal();
  $("resultado").classList.remove("show");
  mostraAbaDesafio();
  document.querySelector('#abas button[data-aba="desafio"]').click();
  registra("Desafio: " + d.titulo + " (" + SEGMENTOS[seg] + "). Leia o objetivo na aba 🎯 Desafio.");
}
function abreLivre() {
  if (DESAFIO) guardaProgramaDesafio();
  DESAFIO = null; mundoReal(false);
  let L = null; try { L = JSON.parse(localStorage.getItem(CHAVE_LIVRE + "." + PLAT.id) || "null"); } catch (e) {}
  if (L && L.prog) usaPrograma(L.prog, L.tag || "programa");
  const pi = L && PISTAS[L.pista] && !PISTAS[L.pista].oculta ? L.pista : 0;
  ZOOM = 1; PANX = 40; PANY = 40;
  vaiParaPista(pi); montaPaleta(); desenhaBlocos();
  SESSAO.tela = "bancada"; delete SESSAO.desafio; gravaSessao(SESSAO);
  escondePortal(); mostraAbaDesafio();
  document.querySelector('#abas button[data-aba="sens"]').click();
}

/* ---- aba 🎯 Desafio e botão da trilha na barra de cima ---- */
(function () {
  const bt = document.createElement("button"); bt.className = "bt trilha"; bt.id = "btTrilha"; bt.innerHTML = "☰ Trilha"; bt.title = "Voltar para a trilha de desafios";
  const marca = document.querySelector("#topo .marca"); marca.after(bt);
  bt.onclick = () => mostraPortal("trilha");
  const chip = document.createElement("span"); chip.className = "tag kit " + INFO_KIT[PLAT.id].classe; chip.id = "chipKit"; chip.textContent = PLAT.nome;
  bt.after(chip);
  const ab = document.createElement("button"); ab.dataset.aba = "desafio"; ab.textContent = "🎯 Desafio"; ab.hidden = true;
  $("abas").prepend(ab);
  const painelD = document.createElement("div"); painelD.className = "aba"; painelD.dataset.aba = "desafio"; painelD.hidden = true; painelD.id = "abaDesafio";
  $("hubrolo").prepend(painelD);
  ab.onclick = () => {
    document.querySelectorAll("#abas button").forEach(x => x.classList.toggle("on", x === ab));
    document.querySelectorAll(".aba").forEach(a => a.hidden = a.dataset.aba !== "desafio");
  };
})();
function mostraAbaDesafio() {
  const ab = document.querySelector('#abas button[data-aba="desafio"]'), P_ = $("abaDesafio");
  ab.hidden = !DESAFIO;
  $("hEquipe").textContent = DESAFIO ? "🎯 " + DESAFIO.def.titulo : "🤖 " + (EQUIPE.nome || "equipe");
  if (!DESAFIO) { if (!P_.hidden) document.querySelector('#abas button[data-aba="sens"]').click(); return; }
  const d = DESAFIO.def, s = DESAFIO.seg, reg = registroDe(d.id, s);
  P_.innerHTML = '<div class="cartao dz"><div class="dz-chips"><span>' + NIVEIS[d.nivel] + "</span><span>" + SEGMENTOS[s] + "</span>" +
    (d.realista && s === "medio" ? "<span>mundo real ligado</span>" : "") + (d.sorteia ? "<span>muda a cada corrida</span>" : "") + "</div>" +
    "<h4>" + esc(d.titulo) + "</h4><p>" + d.objetivo(s) + "</p>" +
    '<h5>Como a nota é dada</h5><ul class="dz-crit">' + d.criterios(s).map(([t, p, pr]) => "<li><span>" + esc(t) + (pr ? " <em>objetivo</em>" : "") + "</span><b>" + p + "</b></li>").join("") + "</ul>" +
    '<p class="nota">O objetivo dá a 1ª estrela; 80 pontos dão a 2ª e 100 pontos a 3ª. Tempo máximo da corrida: ' + d.tempoMax + " s.</p>" +
    '<details class="dz-dicas"><summary>Dicas (' + d.dicas().length + ")</summary><ol>" + d.dicas().map(t => "<li>" + t + "</li>").join("") + "</ol></details>" +
    '<div class="dz-reg">' + (reg ? "Recorde: <b>" + reg.melhor + " pontos</b> " + "★".repeat(reg.estrelas) + " · " + reg.tentativas + " corrida(s)" +
      (reg.historico && reg.historico.length ? '<div class="dz-hist">' + reg.historico.slice(0, 8).reverse().map(h => '<i style="--v:' + h.p + '%" title="' + h.p + ' pontos"></i>').join("") + "</div>" : "") : "Ainda sem corridas neste desafio.") + "</div>" +
    '<div class="linha"><button class="bt primaria" id="dzRodar" style="flex:1">▶ Rodar</button><button class="bt" id="dzTrilha">☰ Trilha</button></div>' +
    '<div class="linha"><button class="bt" id="dzZerar" style="flex:1">Começar o programa do zero</button>' +
    (d.nivel !== "ini" ? '<button class="bt" id="dzExemplo">Ver o exemplo PD</button>' : "") + "</div></div>";
  $("dzRodar").onclick = () => $("btRodar").click();
  $("dzTrilha").onclick = () => mostraPortal("trilha");
  $("dzZerar").onclick = () => { if (!confirm("Apagar os blocos deste desafio e começar do zero?")) return;
    PROG = { scripts: [{ id: novoId(), x: 40, y: 40, pilha: [criaBloco("ev_inicio")] }], vars: [], procs: [] }; montaPaleta(); desenhaBlocos(); reinicia(); };
  if ($("dzExemplo")) $("dzExemplo").onclick = () => { if (!confirm("Trocar os blocos deste desafio pelo Seguidor PD de exemplo?")) return;
    exemploPD(); traduzPrograma(PROG); montaPaleta(); arrumaPilhas(); reinicia(); };
}

/* começa o portal depois que a bancada terminou de carregar */
function iniciaPortal() {
  NIVEL_TELA = SESSAO.nivelTela && NIVEIS[SESSAO.nivelTela] ? SESSAO.nivelTela : "ini";
  /* "manter-me conectado" desmarcado: a sessão vale só até fechar o navegador */
  if (SESSAO.usuario && SESSAO.lembrar === false) { let aberta = null; try { aberta = sessionStorage.getItem(CHAVE_ABERTA); } catch (e) {}
    if (!aberta) { delete SESSAO.usuario; gravaSessao(SESSAO); } }
  if (!SESSAO.usuario) return mostraPortal("login");
  if (!SESSAO.plataforma) return mostraPortal("kits");
  if (SESSAO.tela === "bancada") {
    if (SESSAO.desafio && DESAFIOS.some(d => d.id === SESSAO.desafio)) return abreDesafio(SESSAO.desafio);
    escondePortal(); mostraAbaDesafio(); return;
  }
  mostraPortal(SESSAO.tela === "kits" ? "kits" : "trilha");
}
