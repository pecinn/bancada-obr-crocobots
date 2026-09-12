
/* =======================================================================
   6. O ROBO: portas, fisica, sensores
   ======================================================================= */
let CFG = { A:"motor", B:"motor", C:"motor", D:"cor", E:"cor", F:"dist" };
let ROD_MM = 56, EIXO_CM = 14;
let SEP = 2.2, FRENTE = 5.5, MANCHA = 1.4;          /* cm; 2,2 = meia fita de 19 mm + meio verde de 2,5 cm */
let RUIDO = 1, DIF_MOTOR = 0, INERCIA = 0;
const MOT = {};
PORTAS.forEach(p => MOT[p] = { pos:0, vel:0, real:0 });

const R = { x:20, y:15, th:0, alt:0, pitch:0, roll:0, yaw:0, yaw0:0,
            cron:0, t:0, trilha:[], bateu:false };
let PAR_MOV = "AB", VEL_MOV = 50;
const DT = 0.02;
let PASSO = 0;                                   /* contador de passos, para o cache dos sensores */

const cmPorPct = () => 2.5 * Math.PI * (ROD_MM / 10) / 100;   /* 100% ~ 2,5 rot/s */
const circCm  = () => Math.PI * ROD_MM / 10;

function portasDe(tipo) { return PORTAS.filter(p => CFG[p] === tipo); }

function posSensor(dFrente, dLado) {
  const c = Math.cos(R.th), s = Math.sin(R.th);
  return { x: R.x + c * dFrente - s * dLado, y: R.y + s * dFrente + c * dLado };
}
/* padrão da equipe: porta D = sensor direito, porta E = sensor esquerdo */
let LADO = { D:"dir", E:"esq" };
function arrumaLados() {
  const lista = portasDe("cor");
  lista.forEach((p, i) => { if (!LADO[p]) LADO[p] = i === 0 ? "esq" : i === 1 ? "dir" : "centro"; });
}
const ladoCm = p => LADO[p] === "esq" ? SEP : LADO[p] === "dir" ? -SEP : 0;
function pontoDoSensorCor(porta) { return posSensor(FRENTE, ladoCm(porta)); }

/* ---- a leitura: media ponderada (gaussiana) dos pixels debaixo da mancha de luz ---- */
const CACHE = {};
function rgbEm(x, y) {
  const raio = MANCHA * 0.65, sig = MANCHA / 3.2;
  const cx = x * RES, cy = (ALT - y) * RES, rp = raio * RES;
  const i0 = Math.floor(cx - rp), i1 = Math.ceil(cx + rp), j0 = Math.floor(cy - rp), j1 = Math.ceil(cy + rp);
  let r = 0, g = 0, b = 0, w = 0;
  const k2 = 1 / (2 * sig * sig * RES * RES);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const dx = i + 0.5 - cx, dy = j + 0.5 - cy, d2 = dx * dx + dy * dy;
    if (d2 > rp * rp) continue;
    const p = Math.exp(-d2 * k2);
    let pr, pg, pb;
    if (i < 0 || j < 0 || i >= NX || j >= NY) { pr = 150; pg = 108; pb = 70; }   /* madeira da mesa */
    else { const k = (j * NX + i) * 4; pr = PIX[k]; pg = PIX[k+1]; pb = PIX[k+2]; }
    r += pr * p; g += pg * p; b += pb * p; w += p;
  }
  return w ? [r / w, g / w, b / w] : [244, 243, 238];
}
function leitura(porta) {
  const c = CACHE[porta];
  if (c && c.passo === PASSO && c.x === R.x && c.y === R.y && c.th === R.th) return c.v;
  const p = pontoDoSensorCor(porta), v = rgbEm(p.x, p.y);
  CACHE[porta] = { passo: PASSO, x: R.x, y: R.y, th: R.th, v };
  return v;
}
function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) * 1.15; }
/* luz refletida: quanto da luz branca do sensor volta (0 a 100) */
function reflexoDe(porta) {
  if (CFG[porta] !== "cor") return 0;
  const [r, g, b] = leitura(porta);
  const v = (r + g + b) / 3 / 255 * 100 + gauss() * RUIDO;
  return Math.max(0, Math.min(100, Math.round(v)));
}
/* cor reconhecida, com o mesmo codigo de cores do SPIKE */
function classificaCor(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), V = mx / 255, S = mx ? (mx - mn) / mx : 0;
  if (V < 0.22) return "0";
  if (S < 0.28) return V < 0.42 ? "0" : "10";
  let h;
  if (mx === r) h = 60 * (((g - b) / (mx - mn)) % 6);
  else if (mx === g) h = 60 * ((b - r) / (mx - mn) + 2);
  else h = 60 * ((r - g) / (mx - mn) + 4);
  if (h < 0) h += 360;
  if (h < 14 || h >= 345) return "9";
  if (h < 38) return "8";
  if (h < 70) return "7";
  if (h < 165) return "6";
  if (h < 190) return "5";
  if (h < 212) return "4";
  if (h < 255) return "3";
  if (h < 290) return "2";
  return "1";
}
function corDeSensor(porta) {
  if (CFG[porta] !== "cor") return "-1";
  const [r, g, b] = leitura(porta);
  const n = RUIDO * 2.2;
  return classificaCor(r + gauss() * n, g + gauss() * n, b + gauss() * n);
}
/* valor bruto de um canal (0 a 1024), como o bloco do SPIKE */
function cruDe(porta, canal) {
  if (CFG[porta] !== "cor") return 0;
  const v = leitura(porta)[canal === "g" ? 1 : canal === "b" ? 2 : 0];
  return Math.max(0, Math.min(1024, Math.round(v / 255 * 1024 + gauss() * RUIDO * 4)));
}

/* ---- sensor de distancia: tres raios estreitos, fica com o menor ---- */
let ULT_DIST = { d: 200, x: 0, y: 0 };
function raio(ox, oy, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  for (let d = 0; d <= 200; d += 0.4) {
    const x = ox + c * d, y = oy + s * d;
    if (x < -20 || y < -20 || x > LARG + 20 || y > ALT + 20) return 200;
    for (const cx of CAIXAS) if (folgaAte(cx, x, y) <= 0) return d;
    /* as vítimas (bolas de 4–5 cm) e a borda de 6 cm do recipiente do Nível 2 passam por baixo do feixe:
       o sensor fica a 8 cm do chão */
  }
  return 200;
}
function distanciaFrente() {
  const o = posSensor(8, 0);
  let d = 200;
  for (const a of [-0.07, 0, 0.07]) d = Math.min(d, raio(o.x, o.y, R.th + a));
  ULT_DIST = { d, x: o.x + Math.cos(R.th) * d, y: o.y + Math.sin(R.th) * d };
  if (d >= 200) return 200;
  return Math.max(0, d + gauss() * RUIDO * 0.15);
}
function forcaAgora() { return distanciaFrente() < 1.5 ? 100 : 0; }

/* ---- o contorno do robo, para as colisoes ---- */
const CORPO = { tras: -10, frente: 9, meia: 7.4 };
/* ---- pá coletora no motor C ----
   posição 0° = levantada, 90° = abaixada no chão.
   Abaixada, é uma bandeja rasa aberta na frente, com duas paredes laterais: empurra as vítimas.
   Quando o robô aperta uma vítima contra a parede, ela sobe para dentro da pá e fica presa (anda junto, até de ré).
   O robô não tem onde guardar vítimas: a pá só levanta no recipiente, e ao levantar ela joga as vítimas
   para a frente, por cima da borda (elas caem uns 6 cm à frente da boca da pá). */
const PA = { x0: 9, x1: 12, meia: 7.8, esp: 0.3 };        /* bandeja de 3 × 15,6 cm: a bola fica com a frente para fora */
const RV = 2.5;                                        /* raio da vítima (esfera de 5 cm) */
function paFracao(pos) { return CFG.C === "motor" ? Math.max(0, Math.min(1, pos / 90)) : 0; }
/* eixo da pá (cm à frente do eixo das rodas e altura); levantada ela gira 1,9 rad para cima */
const PA_PIVO = { x: 4, h: 10 };
function paAngulo() { return (1 - paFracao(MOT.C.pos)) * 1.9; }
function paBaixa(pos) { return paFracao(pos === undefined ? MOT.C.pos : pos) > 0.5; }
function pontosDoCorpo(x, y, th, baixa) {
  const c = Math.cos(th), s = Math.sin(th), out = [];
  const add = (a, b) => out.push([x + c * a - s * b, y + s * a + c * b]);
  for (let a = CORPO.tras; a <= CORPO.frente; a += 1.9) { add(a, CORPO.meia); add(a, -CORPO.meia); }
  for (let b = -CORPO.meia; b <= CORPO.meia; b += 1.9) { add(CORPO.tras, b); add(CORPO.frente, b); }
  add(CORPO.frente, CORPO.meia); add(CORPO.frente, -CORPO.meia);
  if (baixa) for (let a = PA.x0; a <= PA.x1 + 0.01; a += 1.25) { add(a, PA.meia + PA.esp); add(a, -PA.meia - PA.esp); }
  return out;
}
/* ---- recipiente do Nível 2: borda de 6 cm na aresta que não encosta na parede, centro oco ----
   (no Nível 1 é só uma elevação de 5 mm, que o robô e as vítimas passam por cima) */
let NIVEL_RESGATE = 2;
const MOLD = 1.5;                                      /* espessura da borda */
function molduras() {
  if (NIVEL_RESGATE !== 2 || !AREAS || !AREAS.length) return [];
  return AREAS.map(a => {
    const [p0, p1, p2] = a.pts, mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
    const nx = p0[0] - mx, ny = p0[1] - my, n = Math.hypot(nx, ny), k = MOLD / 2 / n;
    return { ax: p1[0] + nx * k, ay: p1[1] + ny * k, bx: p2[0] + nx * k, by: p2[1] + ny * k, r: MOLD / 2, cor: a.cor };
  });
}
function pertoDoSeg(m, x, y) {
  const dx = m.bx - m.ax, dy = m.by - m.ay, t = Math.max(0, Math.min(1, ((x - m.ax) * dx + (y - m.ay) * dy) / (dx * dx + dy * dy)));
  return [m.ax + dx * t, m.ay + dy * t];
}
/* o segmento (engrossado por r) cruza o retângulo [a0,a1]×[b0,b1] do robô? */
function segCruzaRet(p, q, a0, a1, b0, b1) {
  let t0 = 0, t1 = 1;
  const d = [q[0] - p[0], q[1] - p[1]];
  for (const [pv, dv, lo, hi] of [[p[0], d[0], a0, a1], [p[1], d[1], b0, b1]]) {
    if (Math.abs(dv) < 1e-9) { if (pv < lo || pv > hi) return false; continue; }
    let u = (lo - pv) / dv, w = (hi - pv) / dv;
    if (u > w) [u, w] = [w, u];
    t0 = Math.max(t0, u); t1 = Math.min(t1, w);
    if (t0 > t1) return false;
  }
  return true;
}
function bateNaMoldura(x, y, th, baixa) {
  const ms = molduras(); if (!ms.length) return false;
  const c = Math.cos(th), s = Math.sin(th);
  const noRobo = (px, py) => { const dx = px - x, dy = py - y; return [c * dx + s * dy, -s * dx + c * dy]; };
  for (const m of ms) {
    const p = noRobo(m.ax, m.ay), q = noRobo(m.bx, m.by), r = m.r;
    if (segCruzaRet(p, q, CORPO.tras - r, CORPO.frente + r, -CORPO.meia - r, CORPO.meia + r)) return true;
    if (baixa && segCruzaRet(p, q, PA.x0 - r, PA.x1 + r, -PA.meia - PA.esp - r, PA.meia + PA.esp + r)) return true;
  }
  return false;
}
/* devolve 1 se encostou numa parede ou obstáculo, 2 se foi só na borda do recipiente, 0 se está livre */
function bateEm(x, y, th, baixa) {
  if (baixa === undefined) baixa = paBaixa();
  if (x < 4 || y < 4 || x > LARG - 4 || y > ALT - 4) return 1;
  const pts = pontosDoCorpo(x, y, th, baixa);
  for (const cx of CAIXAS) {
    if (folgaAte(cx, x, y) > 24) continue;
    for (const p of pts) if (folgaAte(cx, p[0], p[1]) < 0) return 1;
  }
  return bateNaMoldura(x, y, th, baixa) ? 2 : 0;
}
/* círculo de raio RV fora de um retângulo: devolve o novo centro ou null se não encosta */
function tiraDoRet(a, b, a0, a1, b0, b1, r) {
  const qa = Math.max(a0, Math.min(a1, a)), qb = Math.max(b0, Math.min(b1, b));
  const da = a - qa, db = b - qb, d = Math.hypot(da, db);
  if (d >= r) return null;
  if (d > 1e-6) return [qa + da * r / d, qb + db * r / d];
  const op = [[a - a0, a0 - r, 0], [a1 - a, a1 + r, 0], [b - b0, b0 - r, 1], [b1 - b, b1 + r, 1]].sort((p, q) => p[0] - q[0])[0];
  return op[2] === 0 ? [op[1], b] : [a, op[1]];
}
/* vítimas: empurradas pelo corpo e pelas paredes da pá, uma não entra na outra e nenhuma atravessa parede.
   Se alguma ficar espremida contra a parede, o robô não consegue fazer o movimento. */
function resolveVitimas(x, y, th, baixa, aplica) {
  const livres = VITIMAS.filter(v => !v.preso && !v.salva && Math.hypot(v.x - x, v.y - y) < 34);
  if (!livres.length) return true;
  const ms = molduras();
  const c = Math.cos(th), s = Math.sin(th);
  const P = livres.map(v => [v.x, v.y]);
  const noRobo = (px, py) => { const dx = px - x, dy = py - y; return [c * dx + s * dy, -s * dx + c * dy]; };
  const noMundo = (a, b) => [x + c * a - s * b, y + s * a + c * b];
  const empurraRobo = (i) => {
    let [a, b] = noRobo(P[i][0], P[i][1]), mexeu = false;
    const q = tiraDoRet(a, b, CORPO.tras, CORPO.frente, -CORPO.meia, CORPO.meia, RV);
    if (q) { [a, b] = q; mexeu = true; }
    if (baixa) for (const lado of [1, -1]) {
      const pb = lado * PA.meia, qa = Math.max(PA.x0, Math.min(PA.x1, a)), da = a - qa, db = b - pb, d = Math.hypot(da, db);
      if (d < RV + PA.esp) {
        if (d > 1e-6) { a = qa + da * (RV + PA.esp) / d; b = pb + db * (RV + PA.esp) / d; }
        else b = pb + (Math.abs(b) < PA.meia ? -lado : lado) * (RV + PA.esp);
        mexeu = true;
      }
    }
    if (mexeu) P[i] = noMundo(a, b);
  };
  const empurraParede = (i) => {
    for (const cx of CAIXAS) {
      if (folgaAte(cx, P[i][0], P[i][1]) >= RV) continue;
      if (cx.r !== undefined) {
        const dx = P[i][0] - cx.x, dy = P[i][1] - cx.y, d = Math.hypot(dx, dy) || 1e-6;
        P[i] = [cx.x + dx / d * (cx.r + RV), cx.y + dy / d * (cx.r + RV)];
      } else {
        const q = tiraDoRet(P[i][0], P[i][1], cx.x - cx.w / 2, cx.x + cx.w / 2, cx.y - cx.h / 2, cx.y + cx.h / 2, RV);
        if (q) P[i] = q;
      }
    }
    /* borda do recipiente: a vítima fica do lado em que está o centro dela */
    for (const m of ms) {
      const [qx, qy] = pertoDoSeg(m, P[i][0], P[i][1]), dx = P[i][0] - qx, dy = P[i][1] - qy, d = Math.hypot(dx, dy);
      if (d < RV + m.r && d > 1e-6) P[i] = [qx + dx / d * (RV + m.r), qy + dy / d * (RV + m.r)];
    }
    P[i][0] = Math.max(RV, Math.min(LARG - RV, P[i][0])); P[i][1] = Math.max(RV, Math.min(ALT - RV, P[i][1]));
  };
  for (let it = 0; it < 5; it++) {
    for (let i = 0; i < P.length; i++) empurraRobo(i);
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const dx = P[j][0] - P[i][0], dy = P[j][1] - P[i][1], d = Math.hypot(dx, dy);
      if (d < 2 * RV) {
        const k = (2 * RV - d) / 2 / (d || 1e-6), ux = d ? dx : 1, uy = d ? dy : 0;
        P[i] = [P[i][0] - ux * k, P[i][1] - uy * k]; P[j] = [P[j][0] + ux * k, P[j][1] + uy * k];
      }
    }
    for (let i = 0; i < P.length; i++) empurraParede(i);
  }
  /* ainda espremida entre o robô e uma parede? então o robô não passa */
  for (let i = 0; i < P.length; i++) {
    const [a, b] = noRobo(P[i][0], P[i][1]);
    const q = tiraDoRet(a, b, CORPO.tras, CORPO.frente, -CORPO.meia, CORPO.meia, RV - 0.6);
    if (q) return false;
    for (const cx of CAIXAS) if (folgaAte(cx, P[i][0], P[i][1]) < RV - 0.6) return false;
    for (const m of ms) { const [qx, qy] = pertoDoSeg(m, P[i][0], P[i][1]); if (Math.hypot(P[i][0] - qx, P[i][1] - qy) < RV + m.r - 0.6) return false; }
  }
  if (aplica !== false) livres.forEach((v, i) => { v.x = P[i][0]; v.y = P[i][1]; v.mexeu = true; });
  return true;
}
/* folga entre a vítima e a parede, obstáculo ou borda de recipiente mais perto */
function folgaVitima(x, y) {
  let f = 99;
  for (const cx of CAIXAS) f = Math.min(f, folgaAte(cx, x, y));
  for (const m of molduras()) { const [qx, qy] = pertoDoSeg(m, x, y); f = Math.min(f, Math.hypot(x - qx, y - qy) - m.r); }
  return f - RV;
}
/* pá abaixada apertando uma vítima contra a parede: ela sobe para dentro da pá e fica presa */
const PRESA_A = CORPO.frente + RV - 1, PRESA_H = 3.8;
function sobeNaPa() {
  if (!paBaixa()) return;
  const c = Math.cos(R.th), s = Math.sin(R.th);
  for (const v of VITIMAS) {
    if (v.preso || v.salva) continue;
    const dx = v.x - R.x, dy = v.y - R.y, a = c * dx + s * dy, b = -s * dx + c * dy;
    if (a < CORPO.frente - 0.5 || a > CORPO.frente + RV + 0.9 || Math.abs(b) > PA.meia - RV + 0.8) continue;
    if (folgaVitima(v.x, v.y) > 0.5) continue;
    /* cabe na pá? as presas ficam lado a lado */
    const bm = PA.meia - RV - PA.esp, ocup = VITIMAS.filter(u => u.preso).map(u => u.preso.b);
    let bb = Math.max(-bm, Math.min(bm, b));
    for (let k = 0; k < 3 && ocup.some(o => Math.abs(o - bb) < 2 * RV); k++) {
      const o = ocup.find(o => Math.abs(o - bb) < 2 * RV);
      bb = bb >= o ? o + 2 * RV : o - 2 * RV;
      if (Math.abs(bb) > bm + 0.4) { bb = null; break; }
    }
    if (bb === null || ocup.some(o => Math.abs(o - bb) < 2 * RV - 0.1)) continue;
    v.preso = { a: PRESA_A, b: bb }; v.queda = 0;
  }
}
/* a pá mudou de posição: ao levantar, joga para a frente o que está nela (presas e o que estiver na bandeja) */
let PA_BAIXA = false;
function atualizaPa() {
  const baixa = paBaixa();
  if (baixa === PA_BAIXA) return;
  const c = Math.cos(R.th), s = Math.sin(R.th);
  if (!baixa) {
    const soltas = [];
    for (const v of VITIMAS) {
      if (v.salva) continue;
      const dx = v.x - R.x, dy = v.y - R.y, a = c * dx + s * dy, b = -s * dx + c * dy;
      if (!v.preso && !(a >= PA.x0 - 0.5 && a <= PA.x1 + RV && Math.abs(b) <= PA.meia)) continue;
      const bb = v.preso ? v.preso.b : Math.max(-PA.meia + RV, Math.min(PA.meia - RV, b));
      /* cai uns 6 cm à frente da boca da pá, de uma altura de ~12 cm */
      const la = PA.x1 + 6;
      v.x = R.x + c * la - s * bb; v.y = R.y + s * la + c * bb;
      v.preso = null; v.queda = 9; soltas.push(v);
    }
    if (soltas.length) resolveVitimas(R.x, R.y, R.th, false);
  }
  PA_BAIXA = baixa;
}
/* vítimas presas: andam com a pá (e sobem com ela, se ela girar) */
function levaPresas() {
  const c = Math.cos(R.th), s = Math.sin(R.th), ph = paAngulo(), cp = Math.cos(ph), sp = Math.sin(ph);
  for (const v of VITIMAS) {
    if (v.queda > 0) v.queda = Math.max(0, v.queda - 45 * DT);
    if (!v.preso) continue;
    const rx = v.preso.a - PA_PIVO.x, ry = PRESA_H - PA_PIVO.h;
    const a = PA_PIVO.x + rx * cp - ry * sp, b = v.preso.b;
    v.h = PA_PIVO.h + rx * sp + ry * cp;
    v.x = R.x + c * a - s * b; v.y = R.y + s * a + c * b;
  }
}

function passoFisica() {
  PASSO++;
  const e = PAR_MOV[0], d = PAR_MOV[1];
  const k = INERCIA > 0 ? Math.min(1, DT / INERCIA) : 1;
  for (const p of PORTAS) { const m = MOT[p]; m.real += (m.vel - m.real) * k; if (Math.abs(m.real) < 0.01) m.real = 0; }
  const cpp = cmPorPct();
  let vl = MOT[e] ? MOT[e].real : 0, vr = MOT[d] ? MOT[d].real : 0;
  vl *= 1 - DIF_MOTOR / 100; vr *= 1 + DIF_MOTOR / 100;

  /* subida perde forca, descida ganha um pouco */
  const c = Math.cos(R.th), s = Math.sin(R.th);
  const h0 = alturaEm(R.x, R.y), h1 = alturaEm(R.x + c * 2, R.y + s * 2);
  const rampa = (h1 - h0) / 2;
  const fator = Math.max(0.35, Math.min(1.1, 1 - rampa * 2.2));

  const ve = vl * cpp * fator, vd = vr * cpp * fator;
  const v = (ve + vd) / 2, w = (vd - ve) / EIXO_CM;
  const nth = R.th + w * DT;
  const nx = R.x + v * Math.cos(nth) * DT, ny = R.y + v * Math.sin(nth) * DT;
  R.bateu = false;
  const baixa = paBaixa();
  const parede = bateEm(nx, ny, nth, baixa);
  if (!parede && resolveVitimas(nx, ny, nth, baixa)) { R.x = nx; R.y = ny; R.th = nth; }
  else {
    /* batida = o robô ou a pá encostou numa parede/obstáculo; vítima espremida ou borda de recipiente só seguram o robô */
    R.bateu = parede === 1;
    if (!bateEm(R.x, R.y, nth, baixa) && resolveVitimas(R.x, R.y, nth, baixa)) R.th = nth;   /* ainda consegue girar */
  }
  R.yaw = -(R.th - R.yaw0) * 180 / Math.PI;

  for (const p of PORTAS) if (CFG[p] === "motor" && p !== e && p !== d) {
    const m = MOT[p];
    /* "ir para a posição": gira até lá na velocidade do motor */
    if (m.alvo !== undefined) {
      const falta = m.alvo - m.pos, passo = Math.abs(m.cfg === undefined ? 75 : m.cfg) * 2.5 * 360 / 100 * DT;
      m.real = 0;
      if (Math.abs(falta) <= passo) { m.pos = m.alvo; m.alvo = undefined; }
      else m.pos += Math.sign(falta) * passo;
    } else m.pos += m.real * 2.5 * 360 / 100 * DT;
  } else if (CFG[p] === "motor") MOT[p].pos += MOT[p].real * 2.5 * 360 / 100 * DT;
  /* a pá não desce em cima de uma parede: o motor trava */
  if (CFG.C === "motor" && !baixa && paBaixa() && bateEm(R.x, R.y, R.th, true)) {
    MOT.C.pos = 44; MOT.C.alvo = undefined; MOT.C.travou = true;
  }
  atualizaPa(); sobeNaPa(); levaPresas();
  if (paBaixa() && !baixa) resolveVitimas(R.x, R.y, R.th, true);

  const g = naGangorra(R.x, R.y);
  if (g) {
    const p = g.eixo === "x" ? R.x : R.y;
    const alvo = g.sinal * (p - g.pivo) > 0 ? 1 : -1;
    tiltGangorra += Math.max(-1.6 * DT, Math.min(1.6 * DT, alvo - tiltGangorra));
    marcaRelevo();
  }
  R.alt = alturaEm(R.x, R.y);
  R.pitch = Math.atan((alturaEm(R.x + c * 3, R.y + s * 3) - alturaEm(R.x - c * 3, R.y - s * 3)) / 6);
  R.roll = Math.atan((alturaEm(R.x - s * 3, R.y + c * 3) - alturaEm(R.x + s * 3, R.y - c * 3)) / 6);
  R.t += DT; R.cron += DT;
  const u = R.trilha[R.trilha.length - 1];
  if (!u || Math.hypot(R.x - u[0], R.y - u[1]) > 0.8) {
    R.trilha.push([R.x, R.y]);
    if (R.trilha.length > 6000) R.trilha.shift();
  }
}

/* =======================================================================
   6b. A CORRIDA: percurso, saidas da linha, travamentos, resultado
   ======================================================================= */
let CORRIDA = null;
function novaCorrida() {
  CORRIDA = { s: 0, pct: 0, completou: false, tempoFim: null, saidas: 0, marcas: [], batidas: 0,
              foraDesde: null, fora: false, bateuAntes: false, travadoDesde: null, travado: false,
              ultPos: [R.x, R.y, 0, R.th], resgatadas: 0, fimMotivo: "",
              naChegada: false, paradoDesde: null, falhas: 0, passouEm: null, px: R.x, py: R.y, pth: R.th, fimProg: null };
}
function naSemLinha(x, y) { return SEMLINHA.some(z => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2); }
function dentroTri(p, t) {
  const [a, b, c] = t, s = (u, v, w) => (u[0] - w[0]) * (v[1] - w[1]) - (v[0] - w[0]) * (u[1] - w[1]);
  const d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function dentroTriInteira(p, t) {
  if (!dentroTri(p, t)) return false;
  for (let i = 0; i < 3; i++) {                         /* o centro fica a pelo menos um raio de cada lado */
    const a = t[i], b = t[(i + 1) % 3], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L < RV - 0.2) return false;
  }
  return true;
}
function tocaRobo(v) {
  const c = Math.cos(R.th), s = Math.sin(R.th), dx = v.x - R.x, dy = v.y - R.y, a = c * dx + s * dy, b = -s * dx + c * dy;
  const x1 = paBaixa() ? PA.x1 : CORPO.frente, m = paBaixa() ? PA.meia + PA.esp : CORPO.meia;
  return a > CORPO.tras - RV - 0.3 && a < x1 + RV + 0.3 && Math.abs(b) < m + RV + 0.3 && tiraDoRet(a, b, CORPO.tras, x1, -m, m, RV + 0.3) !== null;
}
function avaliaCorrida() {
  const C = CORRIDA; if (!C) return;
  if (ROTA && !C.completou) {
    const pr = projetaNaRota(R.x, R.y, C.s, naSemLinha(R.x, R.y));   /* na sala de resgate o robô pode sair em qualquer ponto */
    if (pr && pr.d < 13 && pr.s > C.s) C.s = pr.s;
    C.pct = Math.min(99, Math.round(C.s / ROTA.total * 100));
  }
  /* ladrilho de chegada: parar em cima da faixa vermelha e ficar 5 s completamente parado */
  const mov = Math.hypot(R.x - C.px, R.y - C.py) + Math.abs(R.th - C.pth) * 6;
  C.px = R.x; C.py = R.y; C.pth = R.th;
  const Z = ROTA ? PISTAS[PISTA_ATUAL].estado.chegada : null;
  if (Z && Z.zona && !C.completou) {
    const d = VIZ[Z.lado], along = (R.x - Z.pt[0]) * d[0] + (R.y - Z.pt[1]) * d[1];
    const noLadrilho = R.x >= Z.zona.x1 && R.x <= Z.zona.x2 && R.y >= Z.zona.y1 && R.y <= Z.zona.y2;
    const naFaixa = noLadrilho && along >= CORPO.tras - 1 && along <= CORPO.frente + 1;
    if (naFaixa) {
      C.naChegada = true;
      if (mov < 1e-4) {
        if (C.paradoDesde === null) C.paradoDesde = R.t;
        if (R.t - C.paradoDesde >= 5) {
          C.completou = true; C.pct = 100; C.tempoFim = C.paradoDesde; C.fimMotivo = "chegada validada"; return "fim";
        }
      } else C.paradoDesde = null;
    } else {
      if (C.naChegada && along > 0 && C.passouEm === null) { C.falhas++; C.passouEm = R.t; }
      C.naChegada = false; C.paradoDesde = null;
    }
  }
  /* saiu da linha? mede a partir do meio dos sensores */
  const m = posSensor(FRENTE, 0);
  /* contornando um obstáculo não conta como saída da linha (regra da OBR) */
  const contorno = CAIXAS.some(c => !c.parede && folgaAte(c, R.x, R.y) < 32);
  const longe = ROTA && !C.completou && !C.naChegada && !contorno && !naSemLinha(m.x, m.y) && distLinha(m.x, m.y) > 9;
  if (longe) {
    if (C.foraDesde === null) C.foraDesde = R.t;
    if (!C.fora && R.t - C.foraDesde > 1.5) { C.fora = true; C.saidas++; C.marcas.push([m.x, m.y]); }
  } else { C.foraDesde = null; C.fora = false; }
  if (R.bateu && !C.bateuAntes) C.batidas++;
  C.bateuAntes = R.bateu;
  /* travado: motores ligados e o robo parado no mesmo lugar */
  const ligado = Math.abs(MOT[PAR_MOV[0]] ? MOT[PAR_MOV[0]].vel : 0) + Math.abs(MOT[PAR_MOV[1]] ? MOT[PAR_MOV[1]].vel : 0) > 4;
  if (R.t - C.ultPos[2] > 1) {
    const mexeu = Math.hypot(R.x - C.ultPos[0], R.y - C.ultPos[1]) > 0.6 || Math.abs(R.th - C.ultPos[3]) > 0.05;   /* girar no lugar também é se mexer */
    if (mexeu || !ligado) C.travadoDesde = null;
    else if (C.travadoDesde === null) C.travadoDesde = R.t - 1;
    C.ultPos = [R.x, R.y, R.t, R.th];
  }
  C.travado = C.travadoDesde !== null && R.t - C.travadoDesde > 4;
  C.resgatadas = 0; C.trocadas = 0;
  /* resgatada: inteira dentro da área e sem contato com o robô. O juiz tira a vítima dali (regra da OBR):
     no simulador ela fica onde está, mas não se mexe mais */
  for (const v of VITIMAS) {
    if (!v.salva && !v.preso && !(v.queda > 0)) for (const a of AREAS)
      if (dentroTriInteira([v.x, v.y], a.pts) && !tocaRobo(v)) { v.salva = { cor: a.cor, t: R.t }; break; }
    /* vítima viva no verde e morta no vermelho: ×1,3; na área trocada ainda vale ×1,1 */
    if (v.salva) { if ((v.tipo === "prata") === (v.salva.cor === "verde")) C.resgatadas++; else C.trocadas++; }
  }
  if (TESTANDO) {
    if (C.travadoDesde !== null && R.t - C.travadoDesde > 10) { C.fimMotivo = "travou"; return "fim"; }
    if (C.foraDesde !== null && R.t - C.foraDesde > 14) { C.fimMotivo = "perdeu a linha"; return "fim"; }
    if (C.passouEm !== null && R.t - C.passouEm > 8) { C.fimMotivo = "passou da faixa vermelha sem parar"; return "fim"; }
  }
  return null;
}
/* Perfeito: validou sem sair da linha e sem falha; Bom: validou; Ruim: não validou a chegada */
function notaDe(C) {
  if (C && C.completou && C.saidas === 0 && C.falhas === 0 && !C.travado) return { txt: "Perfeito", cls: "ok" };
  if (C && C.completou) return { txt: "Bom", cls: "meio" };
  return { txt: "Ruim", cls: "ruim" };
}
function estrelasDe(C) {
  if (!C || !ROTA) return 0;
  if (C.completou && C.saidas === 0 && C.falhas === 0 && !C.travado) return 3;
  if (C.completou) return 2;
  return C.pct >= 50 ? 1 : 0;
}
