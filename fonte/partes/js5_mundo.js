
/* =======================================================================
   5. O MUNDO: o tapete e desenhado de verdade, em alta resolucao,
   e os sensores leem os pixels dele (como no Open Roberta Lab).
   ======================================================================= */
const LARG = 240, ALT = 180, RES = 5;          /* cm e px/cm */
const NX = LARG * RES, NY = ALT * RES;
const TILE = 30;
const CORES_PISO = {
  branco:"#f4f3ee", preto:"#161616", verde:"#10843f", cinza:"#9aa0a6", prata:"#aeb3ba",
  junta:"#e6e4dd", vermelho:"#c8322a", azul:"#1f5fbf", amarelo:"#f2c230"
};
const hexPiso = c => CORES_PISO[c] || c || CORES_PISO.preto;

const MAT = document.createElement("canvas");
MAT.width = NX; MAT.height = NY;
const mc = MAT.getContext("2d", { willReadFrequently: true });
function mundo() { mc.setTransform(RES, 0, 0, -RES, 0, NY); }   /* cm, y para cima */
let PIX = null;

function limpaTapete() {
  mc.setTransform(1, 0, 0, 1, 0, 0);
  mc.fillStyle = CORES_PISO.branco; mc.fillRect(0, 0, NX, NY);
}
function ret(x1, y1, x2, y2, cor) {
  mundo(); mc.fillStyle = hexPiso(cor);
  mc.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
}
function traco(pts, cor, larg, cap) {
  mundo();
  mc.strokeStyle = hexPiso(cor); mc.lineWidth = larg || 2;
  mc.lineCap = cap || "butt"; mc.lineJoin = "miter"; mc.miterLimit = 12;
  mc.beginPath();
  pts.forEach((p, i) => i ? mc.lineTo(p[0], p[1]) : mc.moveTo(p[0], p[1]));
  mc.stroke();
}
function poligono(pts, cor) {
  mundo(); mc.fillStyle = hexPiso(cor); mc.beginPath();
  pts.forEach((p, i) => i ? mc.lineTo(p[0], p[1]) : mc.moveTo(p[0], p[1]));
  mc.closePath(); mc.fill();
}
function texto(t, x, y, tam, cor) {
  mc.setTransform(RES, 0, 0, RES, 0, 0);
  mc.fillStyle = cor || "#c8322a"; mc.font = "800 " + tam + "px Nunito, sans-serif";
  mc.textAlign = "center"; mc.textBaseline = "middle";
  mc.fillText(t, x, ALT - y);
}
/* curva de Bezier quadratica em pontos, para as pistas livres */
function curva(p0, p1, p2, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    out.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]);
  }
  return out;
}
function placas() {                            /* as emendas entre os ladrilhos */
  for (let x = TILE; x < LARG; x += TILE) ret(x - 0.15, 0, x + 0.15, ALT, "junta");
  for (let y = TILE; y < ALT; y += TILE) ret(0, y - 0.15, LARG, y + 0.15, "junta");
}

/* relevo e objetos */
let RELEVO = [], CAIXAS = [], VITIMAS = [], AREAS = [], SEMLINHA = [];
let LARGADA = { x: 15, y: 15, a: 0 };
let tiltGangorra = 1;

function alturaEm(x, y, semLombada) {
  let h = 0;
  for (const r of RELEVO) {
    if (x < r.x1 || x > r.x2 || y < r.y1 || y > r.y2) continue;
    if (r.tipo === "plato") h = Math.max(h, r.a);
    else if (r.tipo === "lombada") {
      /* quebra-molas: meio cilindro de 1 cm de altura e 4 cm de largura (o manual permite até 1 cm) */
      if (semLombada) continue;
      const u = (r.eixo === "x" ? x : y) - r.c;
      if (Math.abs(u) < 2) h = Math.max(h, r.base + Math.sqrt(6.25 - u * u) - 1.5);
    }
    else if (r.tipo === "rampa") {
      const t = r.eixo === "x" ? (x - r.x1) / (r.x2 - r.x1) : (y - r.y1) / (r.y2 - r.y1);
      h = Math.max(h, r.a0 + (r.a1 - r.a0) * t);
    } else if (r.tipo === "gangorra") {
      const p = r.eixo === "x" ? x : y;
      const meia = (r.eixo === "x" ? (r.x2 - r.x1) : (r.y2 - r.y1)) / 2;
      h = Math.max(h, r.amp / 2 * (1 + r.sinal * tiltGangorra * (r.pivo - p) / meia));
    }
  }
  return h;
}
function tiltInicial() { return 1; }           /* a gangorra comeca baixa do lado da entrada */
function naGangorra(x, y) {
  for (const r of RELEVO) if (r.tipo === "gangorra" && x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2) return r;
  return null;
}
function obst(o) { CAIXAS.push(o); return o; }
function folgaAte(c, x, y) {                   /* distancia da borda do objeto ao ponto */
  if (c.r !== undefined) return Math.hypot(x - c.x, y - c.y) - c.r;
  const dx = Math.abs(x - c.x) - c.w / 2, dy = Math.abs(y - c.y) - c.h / 2;
  if (dx <= 0 && dy <= 0) return Math.max(dx, dy);
  return Math.hypot(Math.max(0, dx), Math.max(0, dy));
}

/* =======================================================================
   5b. LADRILHOS OFICIAIS DA OBR
   300 x 300 mm, fita de 20 mm, as pontas saem no meio de cada lado.
   Coordenadas locais em mm, com o zero no canto inferior esquerdo.
   ======================================================================= */
const LCOL = LARG / 30, LLIN = ALT / 30;          /* 8 x 6 */

/* um pintor desenha no sistema local do ladrilho; prep() arma a transformacao */
function criaPintor(ctx, prep) {
  const P = {
    bloco(x1, y1, x2, y2, cor) {
      prep(); ctx.fillStyle = hexPiso(cor);
      ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    },
    faixa(x1, y1, x2, y2, w, cor, cap) {
      prep(); ctx.strokeStyle = hexPiso(cor); ctx.lineWidth = w || 20; ctx.lineCap = cap || "square";
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    },
    caminho(pts, w, cor) {
      prep(); ctx.strokeStyle = hexPiso(cor); ctx.lineWidth = w || 20;
      ctx.lineCap = "square"; ctx.lineJoin = "miter"; ctx.miterLimit = 12;
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    },
    suave(pts, w, cor) {
      prep(); ctx.strokeStyle = hexPiso(cor); ctx.lineWidth = w || 20;
      ctx.lineCap = "butt"; ctx.lineJoin = "round";
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    },
    arco(ax, ay, r, g0, g1, w, cor) {
      prep(); ctx.strokeStyle = hexPiso(cor); ctx.lineWidth = w || 20; ctx.lineCap = "butt";
      ctx.beginPath(); ctx.arc(ax, ay, r, g0 * Math.PI / 180, g1 * Math.PI / 180, g1 < g0); ctx.stroke();
    }
  };
  return P;
}
/* gira (lx,ly) dentro do ladrilho: rot e o numero de quartos de volta anti-horarios */
function giraLocal(lx, ly, rot) {
  if (rot === 1) return [300 - ly, lx];
  if (rot === 2) return [300 - lx, 300 - ly];
  if (rot === 3) return [ly, 300 - lx];
  return [lx, ly];
}
/* transformacao do ladrilho: base (tapete ou miniatura) + giro em torno do centro */
function prepLadrilho(ctx, base, ox, oy, esc, rot) {
  return () => {
    base();
    ctx.translate(ox + 150 * esc, oy + 150 * esc);
    ctx.rotate(rot * Math.PI / 2);
    ctx.scale(esc, esc);
    ctx.translate(-150, -150);
  };
}
function pintorGrade(col, lin, rot) {
  return criaPintor(mc, prepLadrilho(mc, mundo, col * 30, lin * 30, 0.1, rot));
}

/* ---- o catalogo ---- */
const LADRILHOS = [
  { n:"Vazio", c:"", f: () => {} },
  { n:"Reta",             c:"SN",   f: P => P.faixa(150,0,150,300) },
  { n:"Cruzamento",       c:"SNLO", f: P => { P.faixa(150,0,150,300); P.faixa(0,150,300,150); } },
  { n:"T",                c:"SLO",  f: P => { P.faixa(150,0,150,150); P.faixa(0,150,300,150); } },
  { n:"Beco sem saída",   c:"S",    f: P => { P.faixa(150,0,150,150); P.faixa(75,150,225,150,20,null,"butt"); } },
  { n:"Canto reto",       c:"SL",   f: P => P.caminho([[150,0],[150,150],[300,150]]) },
  { n:"Curva 90",         c:"SL",   f: P => P.arco(300, 0, 150, 90, 180) },
  { n:"Canto 135",        c:"SL",   f: P => P.caminho([[150,0],[150,75],[225,150],[300,150]]) },
  { n:"Diagonal 45",      c:"SL",   f: P => P.caminho([[150,0],[150,10],[290,150],[300,150]]) },
  { n:"Duas diagonais",   c:"SLNO", f: P => { P.caminho([[150,0],[150,10],[290,150],[300,150]]); P.caminho([[150,300],[150,290],[10,150],[0,150]]); } },
  { n:"Curva e diagonal", c:"SLNO", f: P => { P.caminho([[150,0],[150,10],[290,150],[300,150]]); P.arco(0,300,150,270,360); } },
  { n:"Falha (gap)",      c:"SN",   f: P => { P.faixa(150,0,150,100,20,null,"butt"); P.faixa(150,200,150,300,20,null,"butt"); } },
  { n:"Tracejada",        c:"SN",   f: P => { P.faixa(150,0,150,40,20,null,"butt"); P.faixa(150,100,150,200,20,null,"butt"); P.faixa(150,260,150,300,20,null,"butt"); } },
  { n:"Zigue-zague 135",  c:"SN",   f: P => P.caminho([[150,-10],[150,60],[90,120],[90,180],[150,240],[150,310]]) },
  { n:"Zigue-zague fino", c:"SN",   f: P => P.caminho([[150,-10],[150,27],[190,67],[110,147],[190,227],[150,267],[150,310]]) },
  { n:"Chevron 45",       c:"SN",   f: P => P.caminho([[150,-10],[150,20],[270,150],[150,280],[150,310]]) },
  { n:"Curva em S",       c:"SN",   f: P => {
      const pts = [[150,-5],[150,35]];
      for (let i = 0; i <= 48; i++) { const y = 35 + 230*i/48; pts.push([150 - 50*Math.sin(2*Math.PI*i/48), y]); }
      pts.push([150,305]); P.suave(pts); } },
  { n:"Chegada",          c:"S",    f: P => { P.faixa(150,0,150,150,20,null,"butt"); P.bloco(0,137.5,300,162.5,"vermelho"); } },
  { n:"Círculo",          c:"SL",   f: P => { P.arco(150,160,90,0,360); P.faixa(150,0,150,70,20,null,"butt"); P.faixa(239,150,300,150,20,null,"butt"); } },
  { n:"Círculo com haste",c:"SLO",  f: P => { P.arco(150,160,90,0,360); P.faixa(150,0,150,70,20,null,"butt"); P.faixa(239,150,300,150,20,null,"butt"); P.faixa(0,150,61,150,20,null,"butt"); } }
];
const iL = n => LADRILHOS.findIndex(x => x.n === n);

/* mapa do tapete; MARCAS guarda os quadrados verdes como bits: 1=NE 2=NO 4=SO 8=SE */
let TAPETE = [], MARCAS = [];
function limpaTapeteLad() {
  TAPETE = []; MARCAS = [];
  for (let l = 0; l < LLIN; l++) { TAPETE.push(new Array(LCOL).fill(null)); MARCAS.push(new Array(LCOL).fill(0)); }
}
function poe(col, lin, t, rot, marca) {
  if (lin < 0 || col < 0 || lin >= LLIN || col >= LCOL) return;
  TAPETE[lin][col] = { t, rot: rot || 0 };
  if (marca !== undefined) MARCAS[lin][col] |= (1 << marca);
}
/* o quadrado de 25 mm no canto q (0=NE 1=NO 2=SO 3=SE), encostado nas duas fitas */
function pintaMarca(col, lin, q) {
  const ox = col * 30, oy = lin * 30, F = 1, T = 2.5, c = 15;
  const sx = (q === 0 || q === 3) ? 1 : -1;
  const sy = (q === 0 || q === 1) ? 1 : -1;
  const x = c + sx * F, y = c + sy * F;
  ret(ox + Math.min(x, x + sx*T), oy + Math.min(y, y + sy*T),
      ox + Math.max(x, x + sx*T), oy + Math.max(y, y + sy*T), "verde");
}
function pintaLadrilhos() {
  for (let l = 0; l < LLIN; l++) for (let c = 0; c < LCOL; c++) {
    const m = TAPETE[l][c]; if (!m || !LADRILHOS[m.t]) continue;
    mc.save();
    mundo(); mc.beginPath(); mc.rect(c * 30, l * 30, 30, 30); mc.clip();
    LADRILHOS[m.t].f(pintorGrade(c, l, m.rot));
    mc.restore();
  }
  for (let l = 0; l < LLIN; l++) for (let c = 0; c < LCOL; c++)
    for (let q = 0; q < 4; q++) if (MARCAS[l][c] & (1 << q)) pintaMarca(c, l, q);
}

/* ---- conferencia de encaixe ---- */
const LADOS = ["S","L","N","O"];
function pontasDe(cel) {
  if (!cel || !LADRILHOS[cel.t]) return "";
  let s = "";
  for (const d of (LADRILHOS[cel.t].c || "")) s += LADOS[(LADOS.indexOf(d) + cel.rot) % 4];
  return s;
}
function encaixesRuins() {
  const ruins = [];
  const viz = { N:[0,1,"S"], S:[0,-1,"N"], L:[1,0,"O"], O:[-1,0,"L"] };
  for (let l = 0; l < LLIN; l++) for (let c = 0; c < LCOL; c++) {
    const p = pontasDe(TAPETE[l][c]); if (!p) continue;
    for (const d of p) {
      const [dc, dl, oposto] = viz[d];
      const nc = c + dc, nl = l + dl;
      if (nc < 0 || nl < 0 || nc >= LCOL || nl >= LLIN) continue;
      if (!TAPETE[nl][nc]) continue;
      if (pontasDe(TAPETE[nl][nc]).indexOf(oposto) < 0) { ruins.push([c, l]); break; }
    }
  }
  return ruins;
}

/* =======================================================================
   5c. MONTADOR DE ROTAS: descreve o caminho casa a casa e ele escolhe
   o giro de cada ladrilho, poe os verdes e calcula o percurso.
   ======================================================================= */
const VIZ = { L:[1,0], O:[-1,0], N:[0,1], S:[0,-1] };
const OPOSTO = { L:"O", O:"L", N:"S", S:"N" };
const ANG_DE = { L:0, N:90, O:180, S:270 };
const ladoPara = (a, b) => b[0] > a[0] ? "L" : b[0] < a[0] ? "O" : b[1] > a[1] ? "N" : "S";
/* canto formado por um lado vertical e um horizontal */
function quad(a, b) {
  const v = (a === "N" || a === "S") ? a : b, h = (a === "L" || a === "O") ? a : b;
  return v === "N" ? (h === "L" ? 0 : 1) : (h === "O" ? 2 : 3);
}
function acharRot(t, lados) {
  const base = LADRILHOS[t].c;
  let quase = 0;
  for (let r = 0; r < 4; r++) {
    const s = pontasDe({ t, rot: r });
    if (lados.every(d => s.indexOf(d) >= 0)) {
      if (s.length === lados.length) return r;
      if (quase === 0) quase = r + 10;
    }
  }
  return quase >= 10 ? quase - 10 : 0;
}
const meioLado = (c, l, d) => [c * 30 + 15 + VIZ[d][0] * 15, l * 30 + 15 + VIZ[d][1] * 15];

/* E = estado da pista sendo montada */
function rota(E, entrada, cels, saida) {
  const pts = [];
  cels.forEach((cel, i) => {
    const [c, l] = cel;
    let tipo = typeof cel[2] === "string" ? cel[2] : null;
    const op = (typeof cel[2] === "object" ? cel[2] : cel[3]) || {};
    const ent = i === 0 ? entrada : OPOSTO[ladoPara(cels[i - 1], cel)];
    const ult = i === cels.length - 1;
    const sai = ult ? saida : ladoPara(cel, cels[i + 1]);
    const fim = sai === "fim";
    const reta = !fim && OPOSTO[ent] === sai;
    if (!tipo) tipo = fim ? "Chegada" : reta ? "Reta" : "Canto reto";
    const t = iL(tipo);
    const lados = fim ? [ent] : [ent, sai]; if (op.ramo) lados.push(op.ramo);
    E.tapete[l][c] = { t, rot: acharRot(t, lados) };
    if (op.verde && !reta && !fim) E.marcas[l][c] |= 1 << quad(ent, sai);
    if (op.marcas) for (const q of op.marcas) E.marcas[l][c] |= 1 << q;
    /* relevo */
    const x1 = c * 30, y1 = l * 30, x2 = x1 + 30, y2 = y1 + 30;
    const eixo = (ent === "L" || ent === "O") ? "x" : "y";
    const doMin = ent === "O" || ent === "S";          /* entra pelo lado de menor coordenada */
    if (op.rampa) {
      const h = Math.abs(op.rampa), sobe = op.rampa > 0;
      const a0 = (doMin === sobe) ? 0 : h, a1 = h - a0;
      E.relevo.push({ tipo:"rampa", x1, y1, x2, y2, eixo, a0: (op.base || 0) + a0, a1: (op.base || 0) + a1 });
    }
    if (op.plato) E.relevo.push({ tipo:"plato", x1, y1, x2, y2, a: op.plato });
    if (op.gangorra) {
      const w = 6;
      const g = eixo === "x" ? { x1, x2, y1: y1 + w, y2: y2 - w } : { y1, y2, x1: x1 + w, x2: x2 - w };
      E.relevo.push(Object.assign(g, { tipo:"gangorra", eixo, pivo: eixo === "x" ? x1 + 15 : y1 + 15,
        amp: 7, sinal: doMin ? -1 : 1 }));
    }
    /* lombadas brancas atravessando o ladrilho (em cima da linha: o sensor vê branco ali) */
    if (op.lombada) for (const off of (Array.isArray(op.lombada) ? op.lombada : [0])) {
      const cm = (eixo === "x" ? x1 : y1) + 15 + off;
      const z = eixo === "x" ? { x1: cm - 2, x2: cm + 2, y1: y1 + 1, y2: y2 - 1 } : { x1: x1 + 1, x2: x2 - 1, y1: cm - 2, y2: cm + 2 };
      E.relevo.push(Object.assign(z, { tipo: "lombada", eixo, c: cm, base: op.plato || 0 }));
      E.extras.push(() => ret(z.x1, z.y1, z.x2, z.y2, "branco"));
    }
    if (op.obst) E.objs.push(op.obst === "caixa"
      ? { x: x1 + 15, y: y1 + 15, w: 10, h: 10, alt: 12, cor: 0x2f6fb0 }
      : { x: x1 + 15, y: y1 + 15, r: 5, alt: 14, cor: 0xe07a1f });
    /* percurso */
    pts.push(meioLado(c, l, ent));
    if (!reta) pts.push([c * 30 + 15, l * 30 + 15]);
    if (ult && !fim) pts.push(meioLado(c, l, sai));
    if (fim) E.chegada = { pt: [c * 30 + 15, l * 30 + 15], lado: OPOSTO[ent], zona: { x1, y1, x2, y2 } };
  });
  if (!E.rotaPts) {
    const [c0, l0] = cels[0];
    const m = meioLado(c0, l0, entrada), dir = VIZ[OPOSTO[entrada]];
    E.largada = { x: m[0] + dir[0] * 11.5, y: m[1] + dir[1] * 11.5, a: ANG_DE[OPOSTO[entrada]] };
    E.rotaPts = pts;
  } else E.rotaPts = E.rotaPts.concat(pts);
}
function estadoVazio() {
  const E = { tapete: [], marcas: [], relevo: [], objs: [], vitimas: [], areas: [], semLinha: [],
              extras: [], largada: { x: 15, y: 15, a: 0 }, rotaPts: null, chegada: null };
  for (let l = 0; l < LLIN; l++) { E.tapete.push(new Array(LCOL).fill(null)); E.marcas.push(new Array(LCOL).fill(0)); }
  return E;
}
/* sala de resgate (manual OBR 2026): paredes brancas de 10 cm, entrada com fita prata e saída com fita preta
   de 25 mm na porta (25 a 30 cm de vão), áreas de resgate triangulares de 30 × 30 cm em cantos sem porta.
   porta = { lado: "S" | "N" | "O" | "L", a, b }  (a..b = o vão, medido ao longo da parede) */
function salaResgate(E, x1, y1, x2, y2, entrada, saida, tri) {
  const esp = 2.5, alt = 10, cor = 0xeceae4;
  const fixo = l => l === "S" ? y1 : l === "N" ? y2 : l === "O" ? x1 : x2;
  for (const lado of ["S", "N", "O", "L"]) {
    const horiz = lado === "S" || lado === "N", f = fixo(lado);
    const vaos = [entrada, saida].filter(p => p.lado === lado).sort((p, q) => p.a - q.a);
    let u = (horiz ? x1 : y1) - esp / 2;
    const segs = [];
    for (const g of vaos) { segs.push([u, g.a]); u = g.b; }
    segs.push([u, (horiz ? x2 : y2) + esp / 2]);
    for (const [a, b] of segs) if (b - a > 0.1)
      E.objs.push(horiz ? { x: (a + b) / 2, y: f, w: b - a, h: esp, alt, cor, parede: true }
                        : { x: f, y: (a + b) / 2, w: esp, h: b - a, alt, cor, parede: true });
  }
  const fita = (p, c) => {
    const f = fixo(p.lado);
    E.extras.push(p.lado === "S" || p.lado === "N" ? () => ret(p.a + 1, f - 1.25, p.b - 1, f + 1.25, c)
                                                  : () => ret(f - 1.25, p.a + 1, f + 1.25, p.b - 1, c));
  };
  fita(entrada, "prata"); fita(saida, "preto");
  E.sala = { x1, y1, x2, y2, entrada, saida };
  E.areas = triangulosNosCantos(E.sala, tri);
  E.extras.push(() => { for (const a of E.areas) pintaArea(a); });
  E.semLinha.push({ x1, y1, x2, y2 });
}
/* Nível 1: o triângulo pintado no chão. Nível 2: só o pé da borda de 6 cm aparece no chão (o centro é oco) */
function pintaArea(a) {
  if (typeof NIVEL_RESGATE !== "undefined" && NIVEL_RESGATE === 2) {
    mundo(); mc.save(); mc.beginPath(); a.pts.forEach((p, i) => i ? mc.lineTo(p[0], p[1]) : mc.moveTo(p[0], p[1])); mc.closePath(); mc.clip();
    mc.strokeStyle = hexPiso(a.cor); mc.lineWidth = 2 * MOLD; mc.lineJoin = "miter"; mc.stroke(); mc.restore();
  } else poligono(a.pts, a.cor);
}
/* tri = { SO: "verde", NE: "vermelho", ... } */
function triangulosNosCantos(S, tri) {
  const T = 30, out = [];
  const canto = { SO: [S.x1, S.y1, 1, 1], SE: [S.x2, S.y1, -1, 1], NO: [S.x1, S.y2, 1, -1], NE: [S.x2, S.y2, -1, -1] };
  for (const k in tri) {
    const [cx, cy, dx, dy] = canto[k], x = cx + dx * 1.3, y = cy + dy * 1.3;
    out.push({ cor: tri[k], canto: k, pts: [[x, y], [x + dx * T, y], [x, y + dy * T]] });
  }
  return out;
}
/* cantos que podem receber área de resgate: os que não encostam numa porta */
function cantosLivres(S) {
  const perto = (lado, ponta) => [S.entrada, S.saida].some(p => p.lado === lado &&
    (ponta === 0 ? p.a - (lado === "S" || lado === "N" ? S.x1 : S.y1) < 29 : (lado === "S" || lado === "N" ? S.x2 : S.y2) - p.b < 29));
  return ["SO", "SE", "NO", "NE"].filter(k => {
    const s = k[0] === "S" ? "S" : "N", l = k.slice(1) === "O" ? "O" : "L";
    return !perto(s, l === "O" ? 0 : 1) && !perto(l, s === "S" ? 0 : 1);
  });
}
/* o juiz sorteia onde ficam as áreas de resgate e as vítimas (pistas com sorteio) */
function sorteiaSala() {
  const p = PISTAS[PISTA_ATUAL];
  if (!p || !p.sorteio || !p.estado || !p.estado.sala) return;
  const E = p.estado, S = E.sala, livres = cantosLivres(S);
  const k1 = livres.splice(Math.floor(Math.random() * livres.length), 1)[0];
  const k2 = livres.splice(Math.floor(Math.random() * livres.length), 1)[0];
  const tri = {}; tri[k1] = "verde"; tri[k2] = "vermelho";
  E.areas = triangulosNosCantos(S, tri);
  const portas = [S.entrada, S.saida].map(q => {
    const f = q.lado === "S" ? S.y1 : q.lado === "N" ? S.y2 : q.lado === "O" ? S.x1 : S.x2, m = (q.a + q.b) / 2;
    return q.lado === "S" || q.lado === "N" ? [m, f] : [f, m];
  });
  const vit = [];
  for (const tipo of ["prata", "prata", "preta"]) {
    for (let t = 0; t < 400; t++) {
      /* em qualquer lugar do piso, inclusive encostada nas paredes (a parede ocupa 1,25 cm de cada lado da linha) */
      const x = S.x1 + 4 + Math.random() * (S.x2 - S.x1 - 8), y = S.y1 + 4 + Math.random() * (S.y2 - S.y1 - 8);
      if (E.areas.some(a => Math.abs(x - a.pts[0][0]) + Math.abs(y - a.pts[0][1]) < 36)) continue;
      if (portas.some(q => Math.hypot(x - q[0], y - q[1]) < 24)) continue;
      if (vit.some(v => Math.hypot(x - v.x, y - v.y) < 8)) continue;
      vit.push({ x, y, tipo }); break;
    }
  }
  E.vitimas = vit;
  AREAS = E.areas;
  VITIMAS = vit.map(v => Object.assign({ x0: v.x, y0: v.y }, v));
  pintaPista();
  if (!TESTANDO && typeof refazCena === "function" && typeof TRES !== "undefined" && TRES) refazCena();
}

/* ---------------------------- pistas ---------------------------- */
const PISTAS = [];
function P(nome, desc, def, extra) { PISTAS.push(Object.assign({ nome, desc, def, tipo: "lad", estado: null }, extra || {})); }

P("Treino da equipe (ladrilhos)",
  "A pista em que o <b>Samurai</b> foi ajustado: reta, cruzamento, zigue-zague, gap, curvas em S e cantos de 90°. " +
  "Aqui <b>todo canto tem verde</b>, o que facilita. Complete esta e depois teste nas outras.",
  E => rota(E, "O", [[0,0],[1,0],[2,0,"Cruzamento"],[3,0,"Zigue-zague 135"],[4,0,"Falha (gap)"],
    [5,0,"Canto reto",{marcas:[1]}],[5,1],[5,2,"Canto reto",{marcas:[2]}],[4,2,"Curva em S"],[3,2],
    [2,2,"Canto reto",{marcas:[0]}],[2,3],[2,4,"Canto reto",{marcas:[3]}],[3,4],[4,4,"Cruzamento"],
    [5,4,"Curva em S"],[6,4,"Canto reto",{marcas:[2]}],[6,3],[6,2,"Canto reto",{marcas:[0]}],[7,2]], "fim"));

P("Nível 1 · Curvas suaves",
  "Para começar: retas, <b>curvas de 90° arredondadas</b> e uma curva em S. Um seguidor simples já completa. " +
  "Bom para ajustar a <b>velocidade</b> e o <b>Kp</b>.",
  E => rota(E, "O", [[0,1],[1,1],[2,1,"Curva 90"],[2,2],[2,3,"Curva 90"],[3,3],[4,3,"Curva em S"],
    [5,3,"Curva 90"],[5,2],[5,1,"Curva 90"],[6,1],[7,1]], "fim"));

P("Nível 2 · Cantos de 90° sem verde",
  "O pesadelo dos seguidores: <b>cantos retos sem quadrado verde</b>, zigue-zagues e um canto de 135°. " +
  "Nos cantos retos os dois sensores veem preto ao mesmo tempo; o programa precisa entender que não é cruzamento.",
  E => rota(E, "O", [[0,4],[1,4],[2,4],[2,3],[2,2],[3,2,"Zigue-zague 135"],[4,2,"Canto 135"],[4,3],[4,4],
    [5,4],[6,4],[6,3,"Zigue-zague fino"],[6,2],[6,1],[5,1],[4,1],[4,0],[5,0],[6,0],[7,0]], "fim"));

P("Nível 3 · Encruzilhadas e verdes",
  "Cruzamentos e Ts. <b>Verde antes</b> da encruzilhada manda virar para o lado dele; <b>sem verde</b>, siga reto. " +
  "Tem um verde <b>depois</b> do cruzamento (na subida da direita): a regra da OBR diz que ele deve ser ignorado.",
  E => rota(E, "O", [[0,0],[1,0,"Cruzamento"],[2,0,"Cruzamento",{verde:1}],[2,1],[2,2,"T",{ramo:"O",verde:1}],
    [3,2],[4,2,"Cruzamento",{verde:1}],[4,1],[4,0,"T",{ramo:"O",verde:1}],[5,0],[6,0,"T",{ramo:"N"}],[7,0],[7,1],
    [7,2,"Cruzamento",{marcas:[1]}],[7,3],[7,4],[6,4],[5,4,"Cruzamento",{verde:1}],[5,3],[4,3,"Cruzamento"],
    [3,3],[2,3],[2,4],[2,5],[1,5],[0,5]], "fim"));

P("Nível 4 · Gaps, tracejado e obstáculos",
  "Linha que some (<b>gap</b> de 10 cm), <b>linha tracejada</b> e dois <b>obstáculos</b> em cima da linha. " +
  "No gap o robô deve seguir reto; no obstáculo, contornar e voltar para a linha.",
  E => rota(E, "O", [[0,0],[1,0,"Falha (gap)"],[2,0],[3,0,"Tracejada"],[4,0],[5,0],[5,1,"Falha (gap)"],[5,2],
    [4,2,"Reta",{obst:true}],[3,2],[2,2],[2,3],[2,4],[3,4,"Tracejada"],[4,4,"Reta",{obst:"caixa"}],[5,4],
    [6,4],[6,3,"Falha (gap)"],[6,2],[7,2]], "fim"));

P("Nível 5 · Rampa e gangorra",
  "Relevo: uma <b>rampa</b> com plataforma no alto e uma <b>gangorra</b>. Na subida o robô perde força; " +
  "use o ângulo de arfagem (inclinação) para saber que está na rampa.",
  E => rota(E, "O", [[0,1],[1,1],[2,1,"Reta",{rampa:9}],[3,1,"Reta",{plato:9}],[4,1,"Reta",{rampa:-9}],[5,1],
    [6,1],[6,2],[6,3],[5,3],[4,3,"Reta",{gangorra:true}],[3,3],[2,3],[1,3],[1,4],[1,5]], "fim"));

P("Desafio OBR · percurso e resgate",
  "Tudo junto, como na regional: zigue-zague, gap, cruzamentos com e sem verde e a " +
  "<b>fita prata</b> da entrada da <b>sala de resgate</b>. Vítimas prata vão para a área verde; a preta, para a vermelha. Depois, saia pela <b>fita preta</b>: " +
  "o <b>obstáculo</b> fica no trajeto de saída, como costuma ser na OBR.",
  E => {
    rota(E, "O", [[0,0],[1,0,"Zigue-zague 135"],[2,0],[3,0,"Falha (gap)"],[4,0,"Cruzamento"],
      [5,0,"Curva em S"],[6,0],[6,1],[5,1],[4,1,"Cruzamento",{verde:1}],[4,2],[5,2]], "N");
    salaResgate(E, 120, 90, 238, 178, { lado: "S", a: 150, b: 180 }, { lado: "O", a: 120, b: 150 }, { NE: "verde", NO: "vermelho" });
    E.vitimas.push({ x: 150, y: 132, tipo:"prata" }, { x: 205, y: 120, tipo:"prata" }, { x: 178, y: 158, tipo:"preta" });
    rota(E, "L", [[3,4],[2,4,"Reta",{obst:true}],[1,4],[0,4]], "fim");
  });

P("Sala de resgate · treino (sorteada)",
  "Treino só do <b>resgate</b>: um trecho curto de linha até a <b>fita prata</b>, a sala de 120 × 90 cm e a saída pela " +
  "<b>fita preta</b>. Como faz o juiz, a cada corrida as <b>áreas de resgate</b> (triângulos verde e vermelho) e as " +
  "<b>vítimas</b> mudam de lugar. O motor C é a pá: 0° levantada, 90° abaixada.",
  E => {
    rota(E, "S", [[4,0],[4,1]], "N");
    salaResgate(E, 90, 60, 210, 150, { lado: "S", a: 120, b: 150 }, { lado: "N", a: 150, b: 180 }, { NE: "verde", SO: "vermelho" });
    E.vitimas.push({ x: 115, y: 110, tipo:"prata" }, { x: 170, y: 95, tipo:"prata" }, { x: 140, y: 130, tipo:"preta" });
    rota(E, "S", [[5,5]], "fim");
  }, { sorteio: true });

/* ---- pistas completas: tudo o que o manual traz, com a sala em lugares e tamanhos diferentes ----
   A meia-volta (dois verdes) acontece num cruzamento de beco: o robô volta ao cruzamento anterior, onde um verde
   manda virar. Na ida, esse verde fica DEPOIS da linha e deve ser ignorado (é o "falso verde"). */
const DESC_COMPLETA = " A cada corrida o juiz virtual sorteia os cantos das áreas de resgate e o lugar das vítimas " +
  "(inclusive encostadas nas paredes). Troque o <b>Nível</b> da área de resgate na aba Pista.";
P("OBR completa · A (sala 90 × 90)",
  "Percurso completo: <b>lombadas</b>, curva em S, <b>gap</b>, T com verde, cruzamento com <b>falso verde</b> (verde depois da linha), " +
  "<b>beco com dois verdes</b> (meia-volta de 180°), <b>rampa</b> com subida, plataforma e descida, cruzamento sem verde e zigue-zague. " +
  "Sala de 90 × 90 com a entrada na parede da direita e a saída embaixo; o <b>obstáculo</b> fica no trajeto de saída." + DESC_COMPLETA,
  E => {
    rota(E, "S", [[7,0],[7,1,"Reta",{lombada:[0]}],[7,2,"Curva em S"],[7,3,"Falha (gap)"],[7,4,"T",{ramo:"N",verde:1}],
      [6,4,"Cruzamento",{marcas:[2]}],[5,4,"Cruzamento",{marcas:[0,3]}],[6,4,"Cruzamento"],
      [6,3,"Reta",{rampa:9}],[6,2,"Reta",{plato:9}],[6,1,"Reta",{rampa:-9}],[6,0],
      [5,0,"Cruzamento"],[4,0,"Zigue-zague 135"],[3,0,"T",{ramo:"S",verde:1}],[3,1,"Reta",{lombada:[-7,7]}],[3,2],
      [3,3,"Curva em S"],[3,4]], "O");
    salaResgate(E, 2, 90, 90, 178, { lado: "L", a: 121, b: 149 }, { lado: "S", a: 31, b: 59 }, { NO: "verde", NE: "vermelho" });
    E.vitimas.push({ x: 30, y: 120, tipo:"prata" }, { x: 60, y: 160, tipo:"prata" }, { x: 45, y: 135, tipo:"preta" });
    rota(E, "N", [[1,2],[1,1,"Reta",{obst:true}],[1,0],[2,0]], "fim");
  }, { sorteio: true });

P("OBR completa · B (sala 120 × 90)",
  "Começa com <b>lombada</b> e curva em S, T com verde e o <b>beco com dois verdes</b> logo depois de um cruzamento com <b>falso verde</b>. " +
  "Na volta, a <b>rampa</b> sobe, faz a curva lá em cima e desce. Depois: cruzamento sem verde (com um verde depois da linha), <b>gap</b> e zigue-zague. " +
  "Sala de 120 × 90 no canto de baixo, com a entrada na parede da esquerda e a saída em cima." + DESC_COMPLETA,
  E => {
    rota(E, "S", [[0,0],[0,1,"Reta",{lombada:[0]}],[0,2,"Curva em S"],[0,3,"T",{ramo:"N",verde:1}],
      [1,3,"Cruzamento",{marcas:[0]}],[2,3,"Cruzamento",{marcas:[1,2]}],[1,3,"Cruzamento"],
      [1,4,"Reta",{rampa:9}],[1,5,"Canto reto",{plato:9}],[2,5,"Reta",{rampa:-9}],[3,5],
      [3,4,"Cruzamento",{marcas:[3]}],[3,3,"Falha (gap)"],[3,2,"Zigue-zague 135"],[3,1]], "L");
    salaResgate(E, 120, 2, 238, 90, { lado: "O", a: 31, b: 59 }, { lado: "N", a: 151, b: 179 }, { SE: "verde", NE: "vermelho" });
    E.vitimas.push({ x: 160, y: 30, tipo:"prata" }, { x: 200, y: 60, tipo:"prata" }, { x: 180, y: 20, tipo:"preta" });
    rota(E, "S", [[5,3],[5,4,"Reta",{obst:true}],[5,5],[6,5,"Reta",{lombada:[0]}],[7,5]], "fim");
  }, { sorteio: true });

P("OBR completa · C (sala 90 × 120)",
  "Lombada, cruzamento sem verde, <b>gap</b>, T com verde, <b>falso verde</b> e <b>beco com dois verdes</b>, " +
  "<b>gangorra</b> e <b>rampa</b> com a curva na plataforma. Sala em pé (90 × 120) no alto à direita, entrada pela esquerda " +
  "e saída embaixo; o trajeto de saída tem <b>lombada</b> e <b>obstáculo</b>." + DESC_COMPLETA,
  E => {
    rota(E, "L", [[2,5],[1,5,"Reta",{lombada:[0]}],[0,5],[0,4,"Cruzamento"],[0,3,"Falha (gap)"],[0,2,"T",{ramo:"S",verde:1}],
      [1,2,"Cruzamento",{marcas:[0]}],[2,2,"Cruzamento",{marcas:[1,2]}],[1,2,"Cruzamento"],
      [1,3,"Reta",{gangorra:true}],[1,4],[2,4,"Reta",{rampa:9}],[3,4,"Canto reto",{plato:9}],[3,3,"Reta",{rampa:-9}],
      [3,2],[4,2],[4,3]], "L");
    salaResgate(E, 150, 60, 238, 178, { lado: "O", a: 91, b: 119 }, { lado: "S", a: 181, b: 209 }, { NE: "verde", SE: "vermelho" });
    E.vitimas.push({ x: 180, y: 100, tipo:"prata" }, { x: 210, y: 150, tipo:"prata" }, { x: 195, y: 125, tipo:"preta" });
    rota(E, "N", [[6,1],[6,0],[5,0,"Reta",{lombada:[0]}],[4,0,"Reta",{obst:true}],[3,0],[2,0]], "fim");
  }, { sorteio: true });

P("Estilo Open Roberta",
  "Uma pista livre inspirada no simulador do <b>Open Roberta Lab</b>: curva em V, curvas grandes, Ts com verde e " +
  "desvios que não levam a lugar nenhum. Siga do <b>Início</b> até a faixa vermelha do <b>Fim</b>.",
  E => {
    const V = curva([46,160],[63,128],[80,160],14);
    const bump = [].concat(curva([100,62],[118,62],[132,82],10), curva([132,82],[146,104],[160,82],10).slice(1),
                           curva([160,82],[176,52],[196,62],12).slice(1));
    const principal = [[6,160],[46,160]].concat(V.slice(1), [[128,160],[128,112],[96,112],[96,62],[100,62]],
                      bump.slice(1), [[230,62],[230,18]]);
    E.extras.push(() => {
      traco([[6,160],[46,160]], "preto", 2, "butt");
      traco(V, "preto", 2); mundo(); mc.lineJoin = "round";
      traco([[80,160],[128,160],[128,112],[96,112],[96,62],[100,62]], "preto", 2, "square");
      traco(bump, "preto", 2, "round");
      traco([[196,62],[230,62],[230,18]], "preto", 2, "square");
      /* desvios */
      traco([[128,160],[234,160]], "preto", 2, "butt");
      traco([[96,112],[40,112],[40,86]], "preto", 2, "butt");
      traco([[182,160],[182,120],[214,120]], "preto", 2, "butt");
      traco([[230,62],[230,100],[204,100]], "preto", 2, "butt");
      /* verdes (25 mm, antes da encruzilhada, do lado da curva) */
      ret(124.5, 156.5, 127, 159, "verde");       /* vira para o sul no T de cima */
      ret(97, 108.5, 99.5, 111, "verde");         /* vira para o sul no T do meio */
      ret(226.5, 58.5, 229, 61, "verde");         /* no fim: vira para o sul */
      ret(215, 16.75, 240, 19.25, "vermelho");    /* faixa de chegada */
      texto("Início", 18, 170, 6);
      texto("Fim", 218, 10, 6);
    });
    E.rotaPts = principal;
    E.largada = { x: 14, y: 160, a: 0 };
    E.chegada = { pt: [230, 18], lado: "S", zona: { x1: 212, y1: 4, x2: 240, y2: 34 } };
  }, { tipo: "livre" });

P("Tapete livre (monte a sua)",
  "Tapete vazio para a equipe montar a própria pista na aba <b>Pista</b>. O que você montar fica salvo neste navegador. " +
  "Arraste o robô até a largada e aperte <b>R</b> para marcar.",
  E => { E.largada = { x: 20, y: 15, a: 0 }; }, { livre: true });

P("🖼 Imagem própria",
  "Carregue a imagem de uma pista (fundo do Open Roberta, desenho ou foto) na aba <b>Pista</b>. " +
  "Os sensores leem a imagem pixel a pixel.",
  E => { E.largada = { x: 20, y: 90, a: 0 }; }, { tipo: "img" });

/* ---- montagem ---- */
let PISTA_ATUAL = 0, ROTA = null, IMG_PISTA = null;
const copia = o => JSON.parse(JSON.stringify(o));
function estadoDe(i) {
  const p = PISTAS[i];
  if (!p.estado) {
    const E = estadoVazio();
    p.def(E);
    p.original = { tapete: copia(E.tapete), marcas: copia(E.marcas) };
    if (p.livre) {
      const s = lerSalvo();
      if (s && s.livre && s.livre.tapete) {
        E.tapete = s.livre.tapete;
        E.marcas = s.livre.marcas.map(l => l.map(v => v || 0));
        if (s.livre.largada) E.largada = s.livre.largada;
      }
    }
    p.estado = E;
  }
  return p.estado;
}
function ehPistaLadrilho() { return PISTAS[PISTA_ATUAL].tipo === "lad"; }

function pintaPista() {
  const p = PISTAS[PISTA_ATUAL], E = estadoDe(PISTA_ATUAL);
  limpaTapete();
  if (p.tipo === "img") {
    if (IMG_PISTA) {
      const w = Math.min(LARG, num(document.getElementById("imgLarg").value) || LARG);
      let h = w * IMG_PISTA.height / IMG_PISTA.width;
      let ww = w; if (h > ALT) { h = ALT; ww = h * IMG_PISTA.width / IMG_PISTA.height; }
      mc.setTransform(RES, 0, 0, RES, 0, 0);
      mc.imageSmoothingEnabled = true;
      mc.drawImage(IMG_PISTA, (LARG - ww) / 2, (ALT - h) / 2, ww, h);
    } else {
      texto("Carregue uma imagem na aba Pista", LARG / 2, ALT / 2, 9, "#9aa3ad");
    }
  } else {
    placas();
    TAPETE = E.tapete; MARCAS = E.marcas;
    pintaLadrilhos();
    for (const f of E.extras) { mc.save(); f(); mc.restore(); }
  }
  mc.setTransform(1, 0, 0, 1, 0, 0);
  PIX = mc.getImageData(0, 0, NX, NY).data;
  calculaDistLinha();
  if (typeof TEX !== "undefined" && TEX) TEX.needsUpdate = true;
}
function repintaLadrilhos() {
  const p = PISTAS[PISTA_ATUAL];
  if (p.tipo !== "lad") return;
  if (!p.livre) { p.estado.rotaPts = null; ROTA = null; p.editada = true; }
  pintaPista();
  if (p.livre) salvaDepois();
}
function montaPista(i, silencioso) {
  PISTA_ATUAL = i;
  const E = estadoDe(i);
  RELEVO = copia(E.relevo);
  CAIXAS = E.objs.map(o => Object.assign({}, o));
  VITIMAS = E.vitimas.map(v => Object.assign({}, v));
  AREAS = E.areas; SEMLINHA = E.semLinha;
  LARGADA = Object.assign({}, E.largada);
  ROTA = preparaRota(E.rotaPts);
  tiltGangorra = tiltInicial();
  pintaPista();
  if (!silencioso && typeof refazCena === "function") refazCena();
  if (typeof voltaLargada === "function") { voltaLargada(); zeraPrograma(); }
}

/* ---- percurso: comprimento acumulado da rota ---- */
function preparaRota(pts) {
  if (!pts || pts.length < 2) return null;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]));
  return { pts, cum, total: cum[cum.length - 1] };
}
/* posicao do robo ao longo da rota, procurando so perto de onde ele ja estava */
function projetaNaRota(x, y, s0, largo) {
  let melhor = null;
  const P = ROTA.pts, C = ROTA.cum;
  for (let i = 0; i < P.length - 1; i++) {
    if (C[i + 1] < s0 - 25 || C[i] > s0 + (largo ? 400 : 40)) continue;
    const ax = P[i][0], ay = P[i][1], bx = P[i+1][0], by = P[i+1][1];
    const L = C[i + 1] - C[i]; if (L < 1e-6) continue;
    let t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (L * L);
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(ax + (bx - ax) * t - x, ay + (by - ay) * t - y);
    if (!melhor || d < melhor.d) melhor = { d, s: C[i] + L * t };
  }
  return melhor;
}

/* ---- distancia ate a linha preta mais proxima (1 cm por celula) ---- */
let DISTL = null;
function calculaDistLinha() {
  const W = LARG, H = ALT, D = new Float32Array(W * H), INF = 1e6;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const px = Math.floor((i + 0.5) * RES), py = Math.floor((H - j - 0.5) * RES), k = (py * NX + px) * 4;
    const m = (PIX[k] + PIX[k+1] + PIX[k+2]) / 3;
    D[j * W + i] = m < 95 ? 0 : INF;
  }
  const a = 1, b = 1.414;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let v = D[j * W + i];
    if (i > 0) v = Math.min(v, D[j * W + i - 1] + a);
    if (j > 0) { v = Math.min(v, D[(j-1) * W + i] + a);
      if (i > 0) v = Math.min(v, D[(j-1) * W + i - 1] + b);
      if (i < W - 1) v = Math.min(v, D[(j-1) * W + i + 1] + b); }
    D[j * W + i] = v;
  }
  for (let j = H - 1; j >= 0; j--) for (let i = W - 1; i >= 0; i--) {
    let v = D[j * W + i];
    if (i < W - 1) v = Math.min(v, D[j * W + i + 1] + a);
    if (j < H - 1) { v = Math.min(v, D[(j+1) * W + i] + a);
      if (i < W - 1) v = Math.min(v, D[(j+1) * W + i + 1] + b);
      if (i > 0) v = Math.min(v, D[(j+1) * W + i - 1] + b); }
    D[j * W + i] = v;
  }
  DISTL = D;
}
function distLinha(x, y) {
  const i = Math.floor(x), j = Math.floor(y);
  if (!DISTL || i < 0 || j < 0 || i >= LARG || j >= ALT) return 99;
  return DISTL[j * LARG + i];
}
