"use strict";
/* =======================================================================
   0. PLATAFORMAS: SPIKE Prime, EV3 e Arduino
   Cada kit tem as portas, os sensores, as cores e o formato de arquivo do de verdade.
   O simulador guarda tudo pelo nome da porta (A, B, 1, 2, ME, SE...), então a mesma física serve para os três.
   A plataforma é escolhida no portal e fica na sessão; trocar de plataforma recarrega a página.
   ======================================================================= */
const CORES_SPIKE = [
  ["preto","0"],["magenta","1"],["roxo","2"],["azul","3"],["azul-claro","4"],
  ["turquesa","5"],["verde","6"],["amarelo","7"],["laranja","8"],["vermelho","9"],
  ["branco","10"],["nenhuma","-1"]
];
/* EV3 Classroom: 0 sem cor, 1 preto, 2 azul, 3 verde, 4 amarelo, 5 vermelho, 6 branco, 7 marrom */
const CORES_EV3 = [["sem cor","0"],["preto","1"],["azul","2"],["verde","3"],["amarelo","4"],["vermelho","5"],["branco","6"],["marrom","7"]];
/* Arduino: a biblioteca da bancada classifica a leitura RGB do TCS3200 com os mesmos números do SPIKE */
const CORES_ARD = [["preto","0"],["azul","3"],["verde","6"],["amarelo","7"],["vermelho","9"],["branco","10"],["nenhuma","-1"]];

const PLATAFORMAS = {
  spike: {
    id: "spike", nome: "SPIKE Prime", fabricante: "LEGO Education", ext: "llsp3", app: "LEGO Education SPIKE",
    portas: ["A", "B", "C", "D", "E", "F"],
    portasMotor: ["A", "B", "C", "D", "E", "F"], portasSensor: ["A", "B", "C", "D", "E", "F"],
    rotulo: p => p,
    cfg: { A: "motor", B: "motor", C: "motor", D: "cor", E: "cor", F: "dist" },
    lado: { D: "dir", E: "esq" }, par: ["A", "B"], pa: "C", giro: null,
    tipos: [["vazia", "vazio"], ["motor", "motor"], ["sensor de cor", "cor"], ["sensor de distância", "dist"], ["sensor de força", "forca"]],
    cores: CORES_SPIKE, cor: { preto: "0", azul: "3", verde: "6", amarelo: "7", vermelho: "9", branco: "10", nenhuma: "-1" },
    unidades: [["cm", "cm"], ["polegadas", "inches"], ["rotações", "rotations"], ["graus", "degrees"], ["segundos", "seconds"]],
    temCru: true, cruMax: 1024,
    luz: "luz refletida de 0 a 100: o branco e a fita prata dão quase 100 (não dá para separar); o valor bruto do vermelho separa",
    traduz: null
  },
  ev3: {
    id: "ev3", nome: "EV3", fabricante: "LEGO MINDSTORMS Education", ext: "lmsp", app: "EV3 Classroom",
    portas: ["A", "B", "C", "D", "1", "2", "3", "4"],
    portasMotor: ["A", "B", "C", "D"], portasSensor: ["1", "2", "3", "4"],
    rotulo: p => /^\d$/.test(p) ? "porta " + p : p,
    cfg: { A: "motor", B: "motor", C: "motor", D: "vazio", "1": "giro", "2": "cor", "3": "cor", "4": "dist" },
    lado: { "2": "esq", "3": "dir" }, par: ["B", "C"], pa: "A", giro: "1",
    tipos: [["vazia", "vazio"], ["motor", "motor"], ["sensor de cor", "cor"], ["ultrassônico", "dist"], ["sensor de toque", "forca"], ["giroscópio", "giro"]],
    cores: CORES_EV3, cor: { preto: "1", azul: "2", verde: "3", amarelo: "4", vermelho: "5", branco: "6", nenhuma: "0" },
    unidades: [["rotações", "rotations"], ["graus", "degrees"], ["segundos", "seconds"]],
    temCru: false, cruMax: 0,
    luz: "luz refletida de 0 a 100: branco perto de 70, preto perto de 7 e a fita prata acima do branco (uns 90)",
    /* os programas de exemplo são escritos para o SPIKE: portas e cores equivalentes no EV3 */
    traduz: { portas: { A: "B", B: "C", C: "A", D: "3", E: "2", F: "4" }, cores: { "0": "1", "3": "2", "6": "3", "7": "4", "9": "5", "10": "6", "-1": "0" }, par: { AB: "B+C", BA: "C+B" } }
  },
  arduino: {
    id: "arduino", nome: "Arduino", fabricante: "Arduino UNO + ponte H L298N", ext: "ino", app: "Arduino IDE",
    portas: ["ME", "MD", "SV", "SE", "SD", "US", "IMU"],
    portasMotor: ["ME", "MD", "SV"], portasSensor: ["SE", "SD", "US", "IMU"],
    rotulo: p => ({ ME: "motor esq.", MD: "motor dir.", SV: "servo", SE: "sensor esq.", SD: "sensor dir.", US: "ultrassom", IMU: "MPU-6050" })[p] || p,
    pinos: { ME: "ENA 5 · IN1 7 · IN2 8", MD: "ENB 6 · IN3 9 · IN4 10", SV: "sinal no pino 3", SE: "linha TCRT5000 em A0 · cor TCS3200 OUT 2 (S2 A2, S3 A3)",
             SD: "linha TCRT5000 em A1 · cor TCS3200 OUT 13 (S2 A2, S3 A3)",
             US: "HC-SR04: TRIG 12 · ECHO 11", IMU: "I2C: SDA A4 · SCL A5" },
    cfg: { ME: "motor", MD: "motor", SV: "motor", SE: "cor", SD: "cor", US: "dist", IMU: "giro" },
    lado: { SE: "esq", SD: "dir" }, par: ["ME", "MD"], pa: "SV", giro: "IMU",
    tipos: [["vazia", "vazio"], ["motor", "motor"], ["sensor de cor/linha", "cor"], ["ultrassônico", "dist"], ["botão", "forca"], ["giroscópio", "giro"]],
    cores: CORES_ARD, cor: { preto: "0", azul: "3", verde: "6", amarelo: "7", vermelho: "9", branco: "10", nenhuma: "-1" },
    unidades: [["cm", "cm"], ["segundos", "seconds"]],
    temCru: true, cruMax: 255,
    luz: "leitura analógica do sensor de linha de 0 a 1023: o preto dá perto de 920, o branco perto de 150 e a fita prata ainda menos (uns 60)",
    traduz: { portas: { A: "ME", B: "MD", C: "SV", D: "SD", E: "SE", F: "US" }, cores: null, par: { AB: "ME+MD", BA: "MD+ME" } }
  }
};

/* ---- sessão do portal: quem entrou, em que plataforma e em que segmento ---- */
const CHAVE_SESSAO = "portalRobotica.sessao";
function lerSessao() { try { return JSON.parse(localStorage.getItem(CHAVE_SESSAO) || "null") || {}; } catch (e) { return {}; } }
function gravaSessao(s) { try { localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s)); } catch (e) {} }
const SESSAO = lerSessao();
let PLAT = PLATAFORMAS[SESSAO.plataforma] || PLATAFORMAS.spike;
let PORTAS = PLAT.portas.slice();
/* pares de motores para o bloco "definir motores de movimento" */
function paresDe() {
  const ms = PLAT.portasMotor, out = [];
  for (const a of ms) for (const b of ms) if (a !== b)
    out.push([PLAT.id === "arduino" ? PLAT.rotulo(a) + " + " + PLAT.rotulo(b) : a + "+" + b, PLAT.id === "spike" ? a + b : a + "+" + b]);
  return out;
}
/* "AB", "B+C", "ME+MD" -> ["A","B"] */
function lePar(v) {
  const s = String(v).toUpperCase().replace(/\s/g, "");
  if (s.indexOf("+") >= 0) return s.split("+").slice(0, 2);
  if (s.length === 2) return [s[0], s[1]];
  return PLAT.par.slice();
}
const opMotor = () => PLAT.portasMotor.map(p => [PLAT.rotulo(p), p]);
const opSensor = () => PLAT.portasSensor.map(p => [PLAT.rotulo(p), p]);
const portaDoTipo = (tipo, lado) => {
  const l = PLAT.portas.filter(p => PLAT.cfg[p] === tipo);
  if (lado) return l.find(p => PLAT.lado[p] === lado) || l[0] || PLAT.portasSensor[0];
  return l[0] || PLAT.portasSensor[0];
};

/* traduz um programa escrito para o SPIKE para a plataforma atual: portas, pares e números de cor */
function traduzPrograma(prog) {
  const T = PLAT.traduz; if (!T) return prog;
  const muda = b => {
    for (const k in b.a) {
      const v = b.a[k];
      if (!v) continue;
      /* o giroscópio do EV3 soma as voltas (passa de 360); os exemplos foram escritos para -180..180:
         (ângulo + 180) resto 360 − 180 devolve o mesmo intervalo */
      if (v.op === "sen_angulo" && PLAT.id === "ev3" && !b.__giroEmbrulhado) {
        muda(v);
        const no = (op, a) => ({ id: novoId(), op, a, c: [] });
        b.a[k] = no("op_sub", { A: no("op_mod", { A: no("op_soma", { A: v, B: { lit: "180" } }), B: { lit: "360" } }), B: { lit: "180" } });
        b.a[k].__giroEmbrulhado = true;
        continue;
      }
      if (v.op) { if (!v.__giroEmbrulhado) muda(v); else muda(v.a.A.a.A.a.A); continue; }
      if (v.lit === undefined) continue;
      if (k === "P" && T.portas[v.lit]) v.lit = T.portas[v.lit];
      else if (k === "PAR") v.lit = T.par[String(v.lit).replace("+", "")] || v.lit;
      else if (k === "COR" && T.cores && T.cores[v.lit] !== undefined) v.lit = T.cores[v.lit];
    }
    /* no EV3 o giroscópio é um sensor numa porta */
    if ((b.op === "sen_angulo" || b.op === "sen_zerar_ang") && PLAT.id === "ev3" && !(b.a.P && b.a.P.lit)) b.a.P = { lit: PLAT.giro };
    for (const s of b.c) s.forEach(muda);
  };
  prog.scripts.forEach(s => s.pilha.forEach(muda));
  return prog;
}
