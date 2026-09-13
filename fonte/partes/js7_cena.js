
/* =======================================================================
   7. CENA 3D, VISTA DE CIMA, LENTE E GRAFICO
   ======================================================================= */
const lona = document.getElementById("lona");
const lona2 = document.getElementById("lona2");
const palco = document.getElementById("palco");
let TRES = false, cena, cam, rend, chao, TEX, grpCaixas, grpVit, carro3d, precisaRelevo = true;
let bandeira = null, rastro3d = null, raio3d = null, alvo3d = null, grpMarcas = null, sol = null;
let camAz = -Math.PI / 2, camEl = 0.98, camR = 262, MODO_CAM = "livre";
let VISTA3D = true, CHEIO = false, MOSTRA_LENTE = false;
/* modelos de robô da equipe: 4 rodas, esteira ou o básico de 2 rodas com bolinha */
let MODELO = "rodas4";
const MODELOS = { rodas4: "4 rodas", esteira: "Esteira", rodas2: "2 rodas + bolinha" };
let EQUIPE = { nome: "CROCOBOTS", cor: "#3a4048" };
const CORES_EQUIPE = ["#3a4048", "#c5cbd3", "#5fa83a", "#ffc21a", "#ff6b35", "#e63946", "#0096d6", "#8b5cf6"];
const LOGO_IMG = new Image();
LOGO_IMG.onload = () => { if (TRES) refazRobo(); };
LOGO_IMG.src = document.getElementById("logoTopo").src;
const HEX_SPIKE = { "0":"#1b1b1b", "1":"#d63aa0", "2":"#7b3fd6", "3":"#1f5fbf", "4":"#5ab8f0", "5":"#1fb5a8",
                    "6":"#10843f", "7":"#f2c230", "8":"#f08a24", "9":"#c8322a", "10":"#f4f3ee", "-1":"#777" };
function marcaRelevo() { precisaRelevo = true; }
const w3 = (x, y, h) => new THREE.Vector3(x - LARG / 2, h, -(y - ALT / 2));

function ajustaLona() {
  let w, h;
  const hub = document.getElementById("hub");
  if (CHEIO) { w = window.innerWidth; h = window.innerHeight; }
  else {
    w = hub.clientWidth;
    h = Math.round(Math.min(w * 0.74, window.innerHeight * 0.64));
    h = Math.max(240, h);
  }
  const dp = Math.min(2, window.devicePixelRatio || 1);
  for (const c of [lona, lona2]) {
    c.width = Math.round(w * dp); c.height = Math.round(h * dp);
    c.style.width = w + "px"; c.style.height = h + "px";
  }
  const cf = document.getElementById("confete");
  cf.width = w; cf.height = h; cf.style.width = w + "px"; cf.style.height = h + "px";
  palco.style.height = CHEIO ? "" : h + "px";
  palco.classList.toggle("pequeno", w < 520);
  palco.classList.toggle("baixo", h < 460);
  if (rend) { rend.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
}
function trocaVista() {
  lona.hidden = !(VISTA3D && TRES);
  lona2.hidden = (VISTA3D && TRES);
  document.getElementById("vb3d").classList.toggle("on", VISTA3D && TRES && MODO_CAM === "livre");
  document.getElementById("vbSegue").classList.toggle("on", VISTA3D && TRES && MODO_CAM === "segue");
  document.getElementById("vbCima").classList.toggle("on", !(VISTA3D && TRES));
}

/* ---------- texturas feitas na hora ---------- */
function texCanvas(w, h, pinta) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  pinta(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}
const corL = hex => new THREE.Color(hex).convertSRGBToLinear();
function texMadeira() {
  const t = texCanvas(512, 512, (x, w, h) => {
    x.fillStyle = "#a8743f"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const y = Math.random() * h, a = 0.05 + Math.random() * 0.12;
      x.strokeStyle = Math.random() < .5 ? "rgba(70,40,15," + a + ")" : "rgba(255,220,170," + a * 0.7 + ")";
      x.lineWidth = 1 + Math.random() * 3; x.beginPath(); x.moveTo(0, y);
      for (let k = 0; k <= w; k += 32) x.lineTo(k, y + Math.sin(k / 60 + i) * 3);
      x.stroke();
    }
    for (let p = 0; p < 4; p++) { x.fillStyle = "rgba(0,0,0,.05)"; x.fillRect(0, p * 128, w, 2); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  return t;
}
function texCeuEquiret() {
  return texCanvas(512, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.45, "#d8e2ee"); g.addColorStop(0.52, "#8e98a6"); g.addColorStop(1, "#3a3f48");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = "rgba(255,255,255,.95)";
    x.fillRect(60, 40, 90, 50); x.fillRect(300, 30, 120, 60);
  });
}
function texFundo() {
  return texCanvas(4, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#39465a"); g.addColorStop(0.6, "#232b36"); g.addColorStop(1, "#171c23");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
}
function texBrilho() {
  return texCanvas(64, 64, (x) => {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  });
}
let TEX_BRILHO = null;

function iniciaTres() {
  if (typeof THREE === "undefined") { document.getElementById("avisoTres").style.display = "block"; VISTA3D = false; return; }
  try {
    rend = new THREE.WebGLRenderer({ canvas: lona, antialias: true });
  } catch (e) { document.getElementById("avisoTres").style.display = "block"; VISTA3D = false; return; }
  TRES = true;
  rend.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  rend.shadowMap.enabled = true; rend.shadowMap.type = THREE.PCFSoftShadowMap;
  rend.outputEncoding = THREE.sRGBEncoding;
  rend.toneMapping = THREE.ACESFilmicToneMapping; rend.toneMappingExposure = 1.05;
  cena = new THREE.Scene();
  cena.background = texFundo();
  cena.fog = new THREE.Fog(0x1c222b, 520, 1100);
  try {
    const pm = new THREE.PMREMGenerator(rend), eq = texCeuEquiret();
    eq.mapping = THREE.EquirectangularReflectionMapping;
    cena.environment = pm.fromEquirectangular(eq).texture;
  } catch (e) {}
  TEX_BRILHO = texBrilho();
  cam = new THREE.PerspectiveCamera(42, 1.3, 1, 2500);
  cena.add(new THREE.HemisphereLight(0xfff4e0, 0x404654, 0.55));
  sol = new THREE.DirectionalLight(0xfff6ea, 1.25);
  sol.position.set(-90, 230, 110); sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -175, right: 175, top: 150, bottom: -150, near: 20, far: 600 });
  sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.25;
  cena.add(sol);

  /* mesa de madeira e a borda do tapete */
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(LARG + 90, 5, ALT + 90),
    new THREE.MeshStandardMaterial({ map: texMadeira(), roughness: 0.75 }));
  mesa.position.y = -2.7; mesa.receiveShadow = true; cena.add(mesa);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: corL(0x2a2f37), roughness: 1 }));
  piso.rotation.x = -Math.PI / 2; piso.position.y = -80; cena.add(piso);
  const base = new THREE.Mesh(new THREE.BoxGeometry(LARG + 1.6, 0.4, ALT + 1.6), new THREE.MeshStandardMaterial({ color: corL(0x30343a), roughness: .6 }));
  base.position.y = -0.22; base.receiveShadow = true; cena.add(base);

  TEX = new THREE.CanvasTexture(MAT);
  TEX.encoding = THREE.sRGBEncoding;
  TEX.anisotropy = Math.min(8, rend.capabilities.getMaxAnisotropy());
  const geo = new THREE.PlaneGeometry(LARG, ALT, LARG / 2, ALT / 2);
  geo.rotateX(-Math.PI / 2);
  chao = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: TEX, roughness: 0.93, metalness: 0 }));
  chao.receiveShadow = true;
  cena.add(chao);

  grpCaixas = new THREE.Group(); cena.add(grpCaixas);
  grpVit = new THREE.Group(); cena.add(grpVit);
  grpMarcas = new THREE.Group(); cena.add(grpMarcas);
  carro3d = montaCarro3d(); cena.add(carro3d);

  rastro3d = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff4d3a, transparent: true, opacity: 0.85 }));
  rastro3d.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6000 * 3), 3));
  rastro3d.frustumCulled = false; cena.add(rastro3d);
  raio3d = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]),
    new THREE.LineDashedMaterial({ color: 0xff5a5a, dashSize: 1.5, gapSize: 1, transparent: true, opacity: .9 }));
  raio3d.frustumCulled = false; cena.add(raio3d);
  alvo3d = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff5a5a }));
  cena.add(alvo3d);
  ajustaLona();
  refazCena();
}

/* ---------- pecas ---------- */
function caixaR(w, h, d, r, mat) {
  const b = Math.min(r * 0.55, h * 0.3);
  const W = w - 2 * b, Dd = d - 2 * b, rr = Math.max(0.01, Math.min(r - b, W / 2 - 0.01, Dd / 2 - 0.01));
  const s = new THREE.Shape(), x0 = -W / 2, y0 = -Dd / 2;
  s.moveTo(x0 + rr, y0); s.lineTo(x0 + W - rr, y0); s.quadraticCurveTo(x0 + W, y0, x0 + W, y0 + rr);
  s.lineTo(x0 + W, y0 + Dd - rr); s.quadraticCurveTo(x0 + W, y0 + Dd, x0 + W - rr, y0 + Dd);
  s.lineTo(x0 + rr, y0 + Dd); s.quadraticCurveTo(x0, y0 + Dd, x0, y0 + Dd - rr);
  s.lineTo(x0, y0 + rr); s.quadraticCurveTo(x0, y0, x0 + rr, y0);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.01, h - 2 * b), bevelEnabled: true, bevelThickness: b,
    bevelSize: b, bevelSegments: 3, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); g.center();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cil(r, h, mat, seg) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 24), mat);
  m.castShadow = true; m.receiveShadow = true; return m;
}
function cabo(pts, mat) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  const m = new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.17, 6, false), mat);
  m.castShadow = true; return m;
}
function texPneu() {
  const t = texCanvas(256, 32, (x, w, h) => {
    x.fillStyle = "#1d1e20"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#0f1011";
    for (let i = 0; i < w; i += 8) { x.fillRect(i, 3, 4, h - 6); }
  });
  t.wrapS = THREE.RepeatWrapping; return t;
}
function texAdesivo() {
  return texCanvas(512, 160, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#2b2f35"); g.addColorStop(1, "#0f1114");
    x.fillStyle = g; x.beginPath();
    if (x.roundRect) x.roundRect(6, 10, w - 12, h - 20, 26); else x.rect(6, 10, w - 12, h - 20);
    x.fill(); x.strokeStyle = "#9aa3ad"; x.lineWidth = 4; x.stroke();
    let tx = w / 2;
    if (LOGO_IMG.complete && LOGO_IMG.naturalWidth) {
      const lh = h - 24, lw = lh * LOGO_IMG.naturalWidth / LOGO_IMG.naturalHeight;
      x.drawImage(LOGO_IMG, 14, 12, lw, lh); tx = (14 + lw + w) / 2;
    }
    const aco = x.createLinearGradient(0, 40, 0, 120);
    aco.addColorStop(0, "#ffffff"); aco.addColorStop(0.5, "#aeb6bf"); aco.addColorStop(1, "#e3e7eb");
    x.fillStyle = aco; x.font = "900 54px 'Black Ops One', Nunito, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    const nome = (EQUIPE.nome || "OBR").toUpperCase().slice(0, 12);
    const maxw = w - (tx - w / 2) * 2 - 40;
    let tam = 54; while (tam > 24 && x.measureText(nome).width > maxw) { tam -= 2; x.font = "900 " + tam + "px 'Black Ops One', Nunito, sans-serif"; }
    x.fillText(nome, tx, h / 2 + 3);
  });
}

/* ---------- tração: rodas ou esteiras ---------- */
function motorGrande(g, M, x, y, z) {
  const mot = caixaR(9, 3.4, 3.0, 1.1, M.branco); mot.position.set(x, y, z); g.add(mot);
  const tampa = cil(1.55, 0.35, M.azul); tampa.rotation.x = Math.PI / 2; tampa.position.set(x + 1.2, y - 0.2, z + Math.sign(z) * 1.62); g.add(tampa);
  const lado = caixaR(3.2, 2.6, 0.3, 0.6, M.cinza); lado.position.set(x - 3.1, y, z + Math.sign(z) * 1.55); g.add(lado);
}
function rodaSpike(M, rodaR, larg) {
  const r = new THREE.Group();
  const pneu = cil(rodaR, larg, M.borracha, 36); pneu.rotation.x = Math.PI / 2; r.add(pneu);
  const aro = cil(rodaR * 0.66, larg + 0.06, M.cinza, 30); aro.rotation.x = Math.PI / 2; r.add(aro);
  const cubo = cil(0.5, larg + 0.12, M.azul, 12); cubo.rotation.x = Math.PI / 2; r.add(cubo);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, f = cil(0.32, larg + 0.14, M.grafite, 10);
    f.rotation.x = Math.PI / 2; f.position.set(Math.cos(a) * rodaR * 0.4, Math.sin(a) * rodaR * 0.4, 0); r.add(f);
  }
  return r;
}
function engrenagem(M, raio, dentes, esp) {
  const e = new THREE.Group();
  const disco = cil(raio * 0.86, esp, M.cinza, dentes * 2); disco.rotation.x = Math.PI / 2; e.add(disco);
  for (let i = 0; i < dentes; i++) {
    const a = i / dentes * Math.PI * 2, d = new THREE.Mesh(new THREE.BoxGeometry(raio * 0.26, raio * 0.3, esp), M.cinza);
    d.position.set(Math.cos(a) * raio * 0.93, Math.sin(a) * raio * 0.93, 0); d.rotation.z = a; e.add(d);
  }
  const eixo = cil(raio * 0.22, esp + 0.1, M.azul, 8); eixo.rotation.x = Math.PI / 2; e.add(eixo);
  return e;
}
/* esteira: rodas dentadas em x = ±cx, raio r do caminho das sapatas, n sapatas */
const TRILHO = { cx: 5.2, r: 2.65, n: 42 };
function pontoTrilho(s, c) {
  const L = 2 * TRILHO.cx, A = Math.PI * TRILHO.r, P = 2 * L + 2 * A;
  s = ((s % P) + P) % P;
  if (s < L) return [TRILHO.cx - s, c - TRILHO.r, Math.PI];                            /* por baixo, para trás */
  s -= L;
  if (s < A) { const t = -Math.PI / 2 - s / TRILHO.r; return [-TRILHO.cx + TRILHO.r * Math.cos(t), c + TRILHO.r * Math.sin(t), t - Math.PI / 2]; }
  s -= A;
  if (s < L) return [-TRILHO.cx + s, c + TRILHO.r, 0];                                 /* por cima, para a frente */
  s -= L;
  const t = Math.PI / 2 - s / TRILHO.r; return [TRILHO.cx + TRILHO.r * Math.cos(t), c + TRILHO.r * Math.sin(t), t - Math.PI / 2];
}
function montaTracao(g, M, rodaR) {
  PECAS.rodas = []; PECAS.giram = []; PECAS.trilhos = [];
  if (MODELO === "rodas2") {
    for (const z of [-4.1, 4.1]) motorGrande(g, M, -1.2, rodaR + 0.2, z);
    for (const z of [-7.1, 7.1]) {
      const r = rodaSpike(M, rodaR, 1.5); r.position.set(0, rodaR, z); g.add(r);
      PECAS.rodas.push({ o: r, lado: z < 0 ? "E" : "D", raio: rodaR });
    }
    const suporte = caixaR(2.4, 2.2, 2.4, 0.6, M.grafite); suporte.position.set(-8.6, 2.6, 0); g.add(suporte);
    const bola = new THREE.Mesh(new THREE.SphereGeometry(1.15, 18, 12), M.metal); bola.position.set(-8.6, 1.15, 0); bola.castShadow = true; g.add(bola);
    return;
  }
  if (MODELO === "rodas4") {
    for (const z of [-3.9, 3.9]) motorGrande(g, M, -0.6, rodaR + 0.6, z);
    for (const z of [-7.1, 7.1]) {
      const sg = Math.sign(z), lado = z < 0 ? "E" : "D";
      /* viga lateral que segura os dois eixos, com o trem de engrenagens ligando as rodas */
      const viga = caixaR(12.4, 1.2, 0.8, 0.45, M.chassi); viga.position.set(0, rodaR, sg * 5.55); g.add(viga);
      for (let i = -5; i <= 5; i++) { const f = cil(0.26, 0.9, M.grafite, 10); f.rotation.x = Math.PI / 2; f.position.set(i * 1.1, rodaR, sg * 5.55); g.add(f); }
      for (const [x, dir] of [[4.6, 1], [2.3, -1], [0, 1], [-2.3, -1], [-4.6, 1]]) {
        const e = engrenagem(M, 1.2, 16, 0.45); e.position.set(x, rodaR, sg * 6.1); g.add(e);
        PECAS.giram.push({ o: e, lado, raio: rodaR * dir });
      }
      for (const x of [4.6, -4.6]) {
        const r = rodaSpike(M, rodaR, 1.7); r.position.set(x, rodaR, z + sg * 0.1); g.add(r);
        PECAS.rodas.push({ o: r, lado, raio: rodaR });
      }
    }
    const pc = caixaR(1.2, 1.4, 9.5, 0.5, M.grafite); pc.position.set(-10.2, 3.4, 0); g.add(pc);   /* para-choque */
    return;
  }
  /* esteira */
  const c = TRILHO.r + 0.3;                        /* altura do centro das rodas dentadas */
  for (const z of [-3.9, 3.9]) motorGrande(g, M, -0.6, c + 1.0, z);
  const sapata = new THREE.BoxGeometry(0.74, 0.5, 2.5);
  const matS = new THREE.MeshStandardMaterial({ color: corL("#202226"), roughness: 0.85 });
  for (const z of [-7.0, 7.0]) {
    const sg = Math.sign(z), lado = z < 0 ? "E" : "D";
    for (const x of [TRILHO.cx, -TRILHO.cx]) {
      const e = engrenagem(M, TRILHO.r - 0.35, 12, 2.1); e.position.set(x, c, z); g.add(e);
      PECAS.giram.push({ o: e, lado, raio: TRILHO.r });
    }
    for (const x of [-2.6, 0, 2.6]) {                /* rodinhas de apoio */
      const rr = cil(1.25, 1.9, M.grafite, 20); rr.rotation.x = Math.PI / 2; rr.position.set(x, 1.55, z); g.add(rr);
      const cb = cil(0.45, 2.0, M.azul, 10); cb.rotation.x = Math.PI / 2; cb.position.set(x, 1.55, z); g.add(cb);
    }
    const placa = caixaR(13.2, 3.2, 0.5, 0.5, M.chassi); placa.position.set(0, c, z - sg * 1.55); g.add(placa);
    const lama = caixaR(16.4, 0.45, 3.2, 0.5, M.chassi); lama.position.set(0, c + TRILHO.r + 0.95, z); g.add(lama);
    const inst = new THREE.InstancedMesh(sapata, matS, TRILHO.n);
    inst.castShadow = true; inst.receiveShadow = true;
    inst.position.z = z; g.add(inst);
    PECAS.trilhos.push({ inst, lado, c });
  }
  animaTracao(0, 0, rodaR);
}
let T3 = null;                                     /* objetos de apoio, criados só se o 3D carregou */
function animaTracao(posE, posD, rodaR) {
  if (!PECAS.rodas) return;
  if (!T3) T3 = { z: new THREE.Vector3(0, 0, 1), um: new THREE.Vector3(1, 1, 1), m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3() };
  const dist = l => (l === "E" ? posE : posD) / 360 * circCm();
  for (const r of PECAS.rodas) r.o.rotation.z = -dist(r.lado) / r.raio;
  for (const r of PECAS.giram) r.o.rotation.z = -dist(r.lado) / r.raio;
  const P = 4 * TRILHO.cx + 2 * Math.PI * TRILHO.r;
  for (const t of PECAS.trilhos) {
    const off = dist(t.lado);
    for (let i = 0; i < TRILHO.n; i++) {
      const [x, y, a] = pontoTrilho(i * P / TRILHO.n + off, t.c);
      T3.q.setFromAxisAngle(T3.z, a); T3.p.set(x, y, 0);
      t.inst.setMatrixAt(i, T3.m.compose(T3.p, T3.q, T3.um));
    }
    t.inst.instanceMatrix.needsUpdate = true;
  }
}

let PECAS = {};
function montaCarro3d() {
  const g = new THREE.Group();
  g.rotation.order = "YZX";
  const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: corL(c), roughness: 0.45 }, o || {}));
  /* cores das peças de cada kit: SPIKE (branco, cinza e azul), EV3 (cinza claro, grafite e vermelho), Arduino (motor TT amarelo) */
  const K = PLAT.id === "ev3" ? { branco: 0xc9ccd0, azul: 0xd0342c, cinza: 0x8d9299, grafite: 0x2e3136 }
          : PLAT.id === "arduino" ? { branco: 0xf2c230, azul: 0xf2c230, cinza: 0xe9d9a0, grafite: 0x26292e }
          : { branco: 0xf2f3f0, azul: 0x0aa3e0, cinza: 0xa9afb6, grafite: 0x3a3f46 };
  const M = {
    chassi: std(EQUIPE.cor, { roughness: 0.38 }), branco: std(K.branco, { roughness: 0.35 }), cinza: std(K.cinza),
    grafite: std(K.grafite, { roughness: .5 }), preto: std(0x1e2024, { roughness: .55 }), azul: std(K.azul, { roughness: .35 }),
    borracha: new THREE.MeshStandardMaterial({ map: texPneu(), roughness: .95 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 1, roughness: .22 }),
    vidro: new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: .12, metalness: .3 })
  };
  PECAS = { M };
  const rodaR = ROD_MM / 20;

  /* chassi: placa com as vigas de encaixe */
  const acrilico = new THREE.MeshPhysicalMaterial({ color: corL(EQUIPE.cor), transparent: true, opacity: 0.45, roughness: 0.08, metalness: 0, clearcoat: 1 });
  const placa = caixaR(19.5, PLAT.id === "arduino" ? 0.5 : 1.3, 11.8, PLAT.id === "arduino" ? 0.25 : 1.4, PLAT.id === "arduino" ? acrilico : M.chassi);
  placa.position.set(-0.5, 4.6, 0); g.add(placa);
  if (PLAT.id !== "arduino") for (const z of [-5.3, 5.3]) {
    const viga = caixaR(19, 0.9, 1.1, 0.4, M.chassi); viga.position.set(-0.5, 5.6, z); g.add(viga);
    for (let i = -4; i <= 4; i++) {           /* furinhos das vigas */
      const f = cil(0.28, 0.2, M.grafite, 10); f.position.set(-0.5 + i * 2, 6.1, z); g.add(f);
    }
  }
  montaTracao(g, M, rodaR);

  PECAS.leds = []; PECAS.botao = null; PECAS.status = null;
  if (PLAT.id === "ev3") montaBlocoEv3(g, M);
  else if (PLAT.id === "arduino") montaArduino(g, M);
  else {
  /* hub SPIKE com a matriz de luzes */
  const hub = caixaR(9, 3.3, 6.0, 1.0, M.branco); hub.position.set(-3.4, 6.95, 0); g.add(hub);
  const tela = caixaR(6.4, 0.3, 5.0, 0.7, M.grafite); tela.position.set(-2.9, 8.62, 0); g.add(tela);
  PECAS.leds = [];
  for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, emissive: 0xffffff, emissiveIntensity: 0, roughness: .4 });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.62), mat);
    led.position.set(-2.4 + (2 - yy) * 0.84, 8.8, (xx - 2) * 0.84);
    g.add(led); PECAS.leds.push(mat);
  }
  const botao = cil(0.62, 0.3, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x33ff66, emissiveIntensity: 1 }), 20);
  botao.position.set(-6.1, 8.72, 0); g.add(botao); PECAS.botao = botao.material;
  for (const z of [-1.5, 1.5]) { const b = caixaR(0.9, 0.3, 0.9, 0.3, M.grafite); b.position.set(-6.1, 8.7, z); g.add(b); }
  }
  /* adesivo com o nome da equipe, dos dois lados do hub */
  const tAd = texAdesivo();
  for (const lado of [-1, 1]) {
    const ad = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.5), new THREE.MeshStandardMaterial({ map: tAd, transparent: true, roughness: .4 }));
    ad.position.set(-3.4, 6.9, lado * 3.03);
    if (lado < 0) ad.rotation.y = Math.PI;
    g.add(ad);
  }

  /* barra dos sensores de cor */
  const cores = portasDe("cor");
  const larg = 2 * SEP + 3;
  const barra = caixaR(1.4, 1.0, Math.max(4, larg), 0.35, M.preto); barra.position.set(FRENTE, 3.4, 0); g.add(barra);
  if (FRENTE > 8.5) { const braco = caixaR(FRENTE - 7.5, 0.9, 1.2, 0.3, M.preto); braco.position.set((FRENTE + 8) / 2, 3.9, 0); g.add(braco); }
  PECAS.sens = [];
  for (const p of cores) {
    const z = -ladoCm(p);
    const s = new THREE.Group(); s.position.set(FRENTE, 0, z);
    if (PLAT.id === "arduino") {   /* módulo TCRT5000 + TCS3200: placa azul com o sensor embaixo */
      const pcb = caixaR(2.6, 0.18, 3.0, 0.1, new THREE.MeshStandardMaterial({ color: corL("#1f5fbf"), roughness: .5 })); pcb.position.y = 1.4; s.add(pcb);
      const chip = caixaR(1.2, 0.5, 1.2, 0.1, M.preto); chip.position.y = 1.0; s.add(chip);
    } else {
    const corpo = caixaR(2.2, 2.5, 2.2, 0.55, PLAT.id === "ev3" ? M.grafite : M.preto); corpo.position.y = 2.05; s.add(corpo);
    }
    const aro = cil(0.78, 0.18, PLAT.id === "ev3" ? M.azul : M.branco, 20); aro.position.y = 0.74; s.add(aro);
    const lente = cil(0.5, 0.2, new THREE.MeshBasicMaterial({ color: 0xffffff }), 16); lente.position.y = 0.7; s.add(lente);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.45, MANCHA * 0.55, 0.62, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.position.y = 0.36; s.add(cone);
    const mancha = new THREE.Mesh(new THREE.PlaneGeometry(MANCHA * 1.9, MANCHA * 1.9),
      new THREE.MeshBasicMaterial({ map: TEX_BRILHO, color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    mancha.rotation.x = -Math.PI / 2; mancha.position.y = 0.06; s.add(mancha);
    g.add(s);
    PECAS.sens.push({ p, cone: cone.material, mancha: mancha.material, lente: lente.material });
    g.add(cabo([[-1.5, 8.4, z * 0.45], [2.5, 7.4, z * 0.9], [FRENTE - 0.2, 4.4, z]], M.preto));
  }
  /* sensor de distancia com os dois "olhos" */
  PECAS.olhos = [];
  if (portasDe("dist").length) {
    const ds = caixaR(PLAT.id === "arduino" ? 0.3 : 2.2, PLAT.id === "arduino" ? 2.1 : 3.0, PLAT.id === "arduino" ? 4.5 : 6.2, PLAT.id === "arduino" ? 0.1 : 0.8,
      PLAT.id === "arduino" ? new THREE.MeshStandardMaterial({ color: corL("#1f5fbf"), roughness: .5 }) : PLAT.id === "ev3" ? M.grafite : M.preto);
    ds.position.set(PLAT.id === "arduino" ? 9.0 : 8.6, 8.2, 0); g.add(ds);
    const pe = caixaR(1.2, 5.2, 1.2, 0.3, M.grafite); pe.position.set(7.9, 5.4, 0); g.add(pe);
    for (const z of [-1.45, 1.45]) {
      const olho = cil(1.08, PLAT.id === "arduino" ? 1.2 : 0.5, PLAT.id === "arduino" ? M.metal : M.vidro, 24); olho.rotation.z = Math.PI / 2; olho.position.set(9.75, 8.2, z); g.add(olho);
      const anel = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.16, 8, 28),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: PLAT.id === "ev3" ? 0xff3b30 : 0xffffff, emissiveIntensity: 0.6, roughness: .3 }));
      anel.rotation.y = Math.PI / 2; anel.position.set(10.02, 8.2, z); g.add(anel);
      const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      brilho.position.set(10.0, 8.6, z - 0.35); g.add(brilho);
      PECAS.olhos.push(anel.material);
    }
    g.add(cabo([[-1, 8.6, 0.6], [4, 9.4, 0.4], [7.6, 9.0, 0.2]], M.preto));
  }
  /* pá coletora da frente (motor C): gira em torno de um eixo alto; abaixada, a bandeja fica no chão */
  PECAS.pa = null;
  if (CFG[PLAT.pa] === "motor") {
    const piv = new THREE.Group(); piv.position.set(PA_PIVO.x, PA_PIVO.h, 0);
    const fundo = caixaR(PA.x1 - PA.x0, 0.5, 2 * PA.meia + 0.6, 0.2, M.azul);
    fundo.position.set((PA.x0 + PA.x1) / 2 - PA_PIVO.x, 0.3 - PA_PIVO.h, 0); piv.add(fundo);
    for (const z of [-1, 1]) {
      const lado = caixaR(PA.x1 - PA.x0, 4, 0.6, 0.2, M.azul);
      lado.position.set((PA.x0 + PA.x1) / 2 - PA_PIVO.x, 2.3 - PA_PIVO.h, z * PA.meia); piv.add(lado);
      const braco = caixaR(1, PA_PIVO.h, 0.8, 0.3, M.grafite);
      braco.position.set(PA.x0 + 0.5 - PA_PIVO.x, 0.5 - PA_PIVO.h / 2, z * (PA.meia + 0.7)); braco.rotation.z = 0.35; piv.add(braco);
    }
    const eixo = cil(0.5, 2 * PA.meia + 2.4, M.grafite, 12); eixo.rotation.x = Math.PI / 2; piv.add(eixo);
    g.add(piv); PECAS.pa = piv;
  }
  /* cabos dos motores */
  for (const z of [-1, 1]) g.add(cabo([[-7.5, 7.2, z * 2.2], [-8.2, 5.6, z * 3.4], [-5.2, 4.4, z * 4.2]], M.preto));
  g.traverse(o => { if (o.isMesh && o.material && !o.material.transparent) o.castShadow = true; });
  MATRIZ_MUDOU = true;
  return g;
}
/* bloco EV3: corpo cinza claro, painel grafite, tela LCD e botões com a luz de status */
function montaBlocoEv3(g, M) {
  const corpo = caixaR(11.4, 4.0, 7.8, 0.9, M.branco); corpo.position.set(-3.2, 7.2, 0); g.add(corpo);
  const painel = caixaR(10.2, 0.4, 6.8, 0.7, M.grafite); painel.position.set(-3.2, 9.3, 0); g.add(painel);
  const tex = texCanvas(256, 160, (x, w, h) => {
    x.fillStyle = "#a9b89c"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#2b3226"; x.font = "bold 34px monospace"; x.textAlign = "center"; x.fillText("EV3", w / 2, 66);
    x.font = "bold 22px monospace"; x.fillText((EQUIPE.nome || "").toUpperCase().slice(0, 12), w / 2, 112);
  });
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.4), new THREE.MeshStandardMaterial({ map: tex, roughness: .6 }));
  tela.rotation.x = -Math.PI / 2; tela.rotation.z = -Math.PI / 2; tela.position.set(-1.2, 9.52, 0); g.add(tela);
  PECAS.status = [];
  const luz = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x33ff66, emissiveIntensity: 1.2, roughness: .4 });
  const moldura = caixaR(3.6, 0.25, 3.6, 0.6, luz); moldura.position.set(-6.2, 9.55, 0); g.add(moldura); PECAS.status.push(luz);
  const centro = caixaR(1.6, 0.4, 1.6, 0.3, M.cinza); centro.position.set(-6.2, 9.7, 0); g.add(centro);
  for (const [dx, dz] of [[0, 1.3], [0, -1.3], [1.3, 0], [-1.3, 0]]) { const b = caixaR(0.8, 0.35, 0.8, 0.25, M.grafite); b.position.set(-6.2 + dx, 9.68, dz); g.add(b); }
  for (const z of [-3.95, 3.95]) {
    const ad = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.5), new THREE.MeshStandardMaterial({ map: texAdesivo(), transparent: true, roughness: .4 }));
    ad.position.set(-3.2, 7.2, z * 1.001); if (z < 0) ad.rotation.y = Math.PI; g.add(ad);
  }
  const giro = caixaR(2.2, 2.0, 2.2, 0.4, M.grafite); giro.position.set(3.2, 6.2, -3.2); g.add(giro);
  const giroTopo = cil(0.6, 0.3, M.azul, 16); giroTopo.position.set(3.2, 7.3, -3.2); g.add(giroTopo);
}
/* Arduino UNO sobre placa de acrílico: UNO azul, ponte H vermelha, suporte de pilhas, protoboard e fios */
function montaArduino(g, M) {
  const std2 = c => new THREE.MeshStandardMaterial({ color: corL(c), roughness: .5 });
  const uno = caixaR(6.9, 0.2, 5.3, 0.15, std2("#00979d")); uno.position.set(-4.2, 5.6, -1.4); g.add(uno);
  for (const z of [-3.9, 1.1]) { const h = caixaR(5.2, 0.8, 0.5, 0.05, M.preto); h.position.set(-4.2, 6.1, z); g.add(h); }
  const chip = caixaR(3.4, 0.4, 0.9, 0.1, M.preto); chip.position.set(-4.8, 5.9, -1.4); g.add(chip);
  const usb = caixaR(1.6, 1.1, 1.2, 0.1, M.metal); usb.position.set(-7.6, 6.2, -2.8); g.add(usb);
  const ponte = caixaR(4.3, 0.25, 4.3, 0.1, std2("#b3202a")); ponte.position.set(-4.2, 5.6, 3.6); g.add(ponte);
  const dissip = caixaR(2.4, 2.2, 1.6, 0.1, M.preto); dissip.position.set(-4.2, 6.9, 3.6); g.add(dissip);
  for (let i = -3; i <= 3; i++) { const a = caixaR(2.3, 2.0, 0.15, 0.02, M.preto); a.position.set(-4.2 + i * 0.35, 7.0, 3.6); g.add(a); }
  const pilhas = caixaR(7.6, 2.0, 4.2, 0.3, M.preto); pilhas.position.set(3.6, 5.9, 0); g.add(pilhas);
  for (const z of [-1, 1]) { const p = cil(0.9, 6.4, std2(z < 0 ? "#2d6fd1" : "#3aa655"), 16); p.rotation.z = Math.PI / 2; p.position.set(3.6, 7.2, z); g.add(p); }
  const proto = caixaR(4.6, 0.9, 3.4, 0.2, std2("#f4f4f2")); proto.position.set(3.6, 8.6, 0); g.add(proto);
  const buzzer = cil(0.6, 0.8, M.preto, 16); buzzer.position.set(2.2, 9.4, 1.0); g.add(buzzer);
  const fios = ["#e63946", "#1d3557", "#f1c40f", "#2ecc71", "#ff7f11"];
  fios.forEach((c, i) => g.add(cabo([[-2.4, 6.4, -3.6 + i * 0.5], [0.2, 8.0 + i * 0.1, -2.2 + i * 0.5], [2.2, 9.1, -1.2 + i * 0.4]], std2(c))));
  fios.slice(0, 3).forEach((c, i) => g.add(cabo([[-2.2, 6.2, 3.2 + i * 0.3], [1.5, 7.2, 2.4], [FRENTE - 0.5, 3.6, (i - 1) * 1.2]], std2(c))));
}
function refazRobo() {
  if (!TRES) return;
  cena.remove(carro3d);
  carro3d = montaCarro3d(); cena.add(carro3d);
}

function bandeira3d(pt, lado) {
  const g = new THREE.Group();
  const dir = VIZ[lado], perp = [-dir[1], dir[0]];
  const x = pt[0] - dir[0] * 7 + perp[0] * 16, y = pt[1] - dir[1] * 7 + perp[1] * 16;
  const mastro = cil(0.35, 22, new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: .8, roughness: .3 }), 10);
  mastro.position.y = 11; g.add(mastro);
  const tx = texCanvas(128, 80, (c, w, h) => {
    for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) { c.fillStyle = (i + j) % 2 ? "#111" : "#fff"; c.fillRect(i * 16, j * 16, 16, 16); }
  });
  const pano = new THREE.Mesh(new THREE.PlaneGeometry(10, 6, 12, 4), new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, roughness: .7 }));
  pano.position.set(5, 18.5, 0); pano.castShadow = true; g.add(pano);
  g.userData.pano = pano;
  const p = w3(x, y, alturaEm(x, y)); g.position.copy(p);
  g.rotation.y = Math.atan2(dir[1], dir[0]);
  return g;
}

function refazCena() {
  if (!TRES) return;
  while (grpCaixas.children.length) grpCaixas.remove(grpCaixas.children[0]);
  while (grpVit.children.length) grpVit.remove(grpVit.children[0]);
  for (const c of CAIXAS) {
    const mat = new THREE.MeshStandardMaterial({ color: corL(c.cor), roughness: c.parede ? 0.8 : 0.45 });
    const m = c.r !== undefined ? cil(c.r, c.alt, mat, 32) : (c.parede ? new THREE.Mesh(new THREE.BoxGeometry(c.w, c.alt, c.h), mat) : caixaR(c.w, c.alt, c.h, 1, mat));
    m.castShadow = true; m.receiveShadow = true;
    m.position.set(c.x - LARG / 2, c.alt / 2 + alturaEm(c.x, c.y), -(c.y - ALT / 2));
    c._m = m; grpCaixas.add(m);
  }
  /* quebra-molas: meio cilindro branco (a parte de baixo fica escondida pelo chão) */
  for (const r of RELEVO) if (r.tipo === "lombada") {
    const L = r.eixo === "x" ? r.y2 - r.y1 : r.x2 - r.x1;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, L, 28), new THREE.MeshStandardMaterial({ color: 0xf4f3ee, roughness: 0.7 }));
    if (r.eixo === "x") m.rotation.x = Math.PI / 2; else m.rotation.z = Math.PI / 2;
    m.position.set((r.x1 + r.x2) / 2 - LARG / 2, r.base - 1.5, -((r.y1 + r.y2) / 2 - ALT / 2));
    m.castShadow = true; m.receiveShadow = true; grpCaixas.add(m);
  }
  /* recipientes do Nível 2: borda de 6 cm nos três lados (a da frente segura as vítimas) */
  if (NIVEL_RESGATE === 2) for (const a of AREAS) {
    const mat = new THREE.MeshStandardMaterial({ color: a.cor === "verde" ? 0x1f8a4c : 0xc0392b, roughness: 0.6 });
    const [p0, p1, p2] = a.pts, cx0 = (p0[0] + p1[0] + p2[0]) / 3, cy0 = (p0[1] + p1[1] + p2[1]) / 3;
    for (const [u, w] of [[p0, p1], [p1, p2], [p2, p0]]) {
      const L = Math.hypot(w[0] - u[0], w[1] - u[1]), mx = (u[0] + w[0]) / 2, my = (u[1] + w[1]) / 2;
      const k = MOLD / 2 / Math.hypot(cx0 - mx, cy0 - my), ox = (cx0 - mx) * k, oy = (cy0 - my) * k;
      const m = new THREE.Mesh(new THREE.BoxGeometry(L, 6, MOLD), mat);
      m.position.set(mx + ox - LARG / 2, 3 + alturaEm(mx, my), -(my + oy - ALT / 2));
      m.rotation.y = Math.atan2(w[1] - u[1], w[0] - u[0]);
      m.castShadow = true; m.receiveShadow = true; grpCaixas.add(m);
    }
  }
  for (const v of VITIMAS) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(2.5, 28, 18), v.tipo === "prata"
      ? new THREE.MeshStandardMaterial({ color: 0xe8ebef, metalness: 1, roughness: 0.14 })
      : new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.35 }));
    m.castShadow = true;
    m.position.set(v.x - LARG / 2, 2.5 + alturaEm(v.x, v.y), -(v.y - ALT / 2));
    v._m = m; grpVit.add(m);
  }
  if (bandeira) { cena.remove(bandeira); bandeira = null; }
  const E = PISTAS[PISTA_ATUAL].estado;
  if (E && E.chegada && ROTA) { bandeira = bandeira3d(E.chegada.pt, E.chegada.lado); cena.add(bandeira); }
  precisaRelevo = true;
}

function atualizaRelevo() {
  if (!TRES || !precisaRelevo) return;
  precisaRelevo = false;
  const pos = chao.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const mx = pos.getX(i) + LARG / 2, my = -pos.getZ(i) + ALT / 2;
    pos.setY(i, alturaEm(mx, my, true));
  }
  pos.needsUpdate = true;
  chao.geometry.computeVertexNormals();
}

let ULT_RASTRO = -1, ULT_MARCAS = -1;
function atualizaRobo3d() {
  carro3d.position.set(R.x - LARG / 2, R.alt, -(R.y - ALT / 2));
  carro3d.rotation.y = R.th; carro3d.rotation.z = R.pitch; carro3d.rotation.x = -R.roll;
  const rodaR = ROD_MM / 20;
  const e = MOT[PAR_MOV[0]], d = MOT[PAR_MOV[1]];
  animaTracao(e ? e.pos : 0, d ? d.pos : 0, rodaR);
  if (MATRIZ_MUDOU) {
    MATRIZ_MUDOU = false;
    PECAS.leds.forEach((m, i) => { m.emissiveIntensity = MATRIZ[i] / 100 * 1.6; m.color.set(MATRIZ[i] > 0 ? 0xffffff : 0x2a2d31); });
    if (PECAS.botao) PECAS.botao.emissive.set(HEX_SPIKE[BOTAO] || "#33ff66");
    if (PECAS.status) { const c = { "0": "#000000", "1": "#33ff66", "2": "#ff3030", "3": "#ff9a1a", "4": "#33ff66", "5": "#ff3030", "6": "#ff9a1a" }[LUZ_STATUS] || "#33ff66";
      PECAS.status.forEach(m => { m.emissive.set(c); m.emissiveIntensity = LUZ_STATUS === "0" ? 0 : 1.2; }); }
  }
  for (const s of PECAS.sens) {
    const id = corDeSensorVisual(s.p), c = id === "0" ? "#6a6f78" : (HEX_SPIKE[id] || "#ffffff");
    s.mancha.color.set(c); s.cone.color.set(c);
  }
  const perto = ULT_DIST.d < 15;
  for (const o of PECAS.olhos) { o.emissive.set(perto ? 0xff7a1a : PLAT.id === "ev3" ? 0xff3b30 : 0xffffff); o.emissiveIntensity = perto ? 1.4 : 0.55; }
  if (PECAS.pa) PECAS.pa.rotation.z = paAngulo();
}
/* a cor que o sensor mostra na tela, sem o ruido */
function corDeSensorVisual(p) { const v = leitura(p); return classificaCor(v[0], v[1], v[2]); }

function desenha3d() {
  atualizaRelevo(); atualizaRobo3d();
  /* rastro */
  if (R.trilha.length !== ULT_RASTRO) {
    ULT_RASTRO = R.trilha.length;
    const a = rastro3d.geometry.attributes.position, n = Math.min(6000, R.trilha.length);
    for (let i = 0; i < n; i++) { const p = R.trilha[R.trilha.length - n + i]; a.setXYZ(i, p[0] - LARG / 2, alturaEm(p[0], p[1]) + 0.12, -(p[1] - ALT / 2)); }
    a.needsUpdate = true; rastro3d.geometry.setDrawRange(0, n);
  }
  const nm = CORRIDA ? CORRIDA.marcas.length : 0;
  if (nm !== ULT_MARCAS) {
    ULT_MARCAS = nm;
    while (grpMarcas.children.length) grpMarcas.remove(grpMarcas.children[0]);
    if (CORRIDA) for (const [x, y] of CORRIDA.marcas) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texCanvas(64, 64, (c) => {
        c.strokeStyle = "#ff3b30"; c.lineWidth = 12; c.lineCap = "round";
        c.beginPath(); c.moveTo(14, 14); c.lineTo(50, 50); c.moveTo(50, 14); c.lineTo(14, 50); c.stroke(); }), depthTest: false }));
      sp.scale.set(7, 7, 1); sp.position.copy(w3(x, y, alturaEm(x, y) + 4)); grpMarcas.add(sp);
    }
  }
  /* vítimas: empurradas pelo robô ou levadas na pá */
  for (const v of VITIMAS) if (v._m) v._m.position.set(v.x - LARG / 2, (v.preso ? v.h + R.alt : 2.5 + (v.queda || 0) + alturaEm(v.x, v.y)), -(v.y - ALT / 2));
  /* feixe do sensor de distancia */
  const mostra = document.getElementById("chkRaio").checked && portasDe("dist").length > 0;
  raio3d.visible = alvo3d.visible = mostra;
  if (mostra) {
    const o = posSensor(10, 0), d = Math.min(ULT_DIST.d, 200);
    const ho = R.alt + 8.2, fim = { x: o.x + Math.cos(R.th) * d, y: o.y + Math.sin(R.th) * d };
    const pa = raio3d.geometry.attributes.position;
    pa.setXYZ(0, o.x - LARG / 2, ho, -(o.y - ALT / 2)); pa.setXYZ(1, fim.x - LARG / 2, ho, -(fim.y - ALT / 2));
    pa.needsUpdate = true; raio3d.computeLineDistances();
    alvo3d.visible = mostra && d < 200;
    alvo3d.position.set(fim.x - LARG / 2, ho, -(fim.y - ALT / 2));
  }
  if (bandeira) {
    const pn = bandeira.userData.pano, ps = pn.geometry.attributes.position, tt = performance.now() / 380;
    for (let i = 0; i < ps.count; i++) { const x = ps.getX(i) + 5; ps.setZ(i, Math.sin(x * 0.7 - tt) * 0.35 * x / 10); }
    ps.needsUpdate = true;
  }
  /* camera */
  let alvo, az = camAz, raioC = camR, el = camEl;
  if (MODO_CAM === "segue") {
    alvo = new THREE.Vector3(R.x - LARG / 2 + Math.cos(R.th) * 14, R.alt + 3, -(R.y - ALT / 2) - Math.sin(R.th) * 14);
    az = R.th + Math.PI; raioC = 58; el = 0.5;
  } else alvo = new THREE.Vector3(0, 0, 8);
  cam.position.set(alvo.x + Math.cos(az) * Math.cos(el) * raioC, alvo.y + Math.sin(el) * raioC, alvo.z - Math.sin(az) * Math.cos(el) * raioC);
  cam.lookAt(alvo);
  rend.render(cena, cam);
  posicionaBalao(() => { const v = w3(R.x, R.y, R.alt + 14).project(cam); return [(v.x + 1) / 2, (1 - v.y) / 2]; });
}

/* ---------------------- vista de cima (2D) ---------------------- */
function rrect(cx, x, y, w, h, r) {
  cx.beginPath();
  if (cx.roundRect) cx.roundRect(x, y, w, h, r); else cx.rect(x, y, w, h);
}
function desenhaRoboTopo(cx, esc) {
  /* sistema do robo: x para a frente, y para a ESQUERDA (a tela ja foi girada) */
  cx.save();
  cx.scale(esc, esc);
  cx.shadowColor = "rgba(0,0,0,.35)"; cx.shadowBlur = 8 * esc / 3; cx.shadowOffsetY = 2;
  cx.fillStyle = EQUIPE.cor; rrect(cx, -10, -6.2, 19.5, 12.4, 1.6); cx.fill();
  cx.shadowColor = "transparent";
  cx.strokeStyle = "rgba(0,0,0,.35)"; cx.lineWidth = 0.25; cx.stroke();
  /* pneus ou esteiras */
  const rodaR = ROD_MM / 20;
  for (const s of [-1, 1]) {
    const m = MOT[s < 0 ? PAR_MOV[1] : PAR_MOV[0]], anda = m ? m.pos / 360 * circCm() : 0;
    if (MODELO === "esteira") {
      const x0 = -TRILHO.cx - TRILHO.r - 0.3, w = 2 * (TRILHO.cx + TRILHO.r + 0.3);
      cx.fillStyle = "#1c1d1f"; rrect(cx, x0, s * 7.0 - 1.25, w, 2.5, 1.2); cx.fill();
      cx.fillStyle = "#0b0c0d"; const off = ((-anda) % 0.9 + 0.9) % 0.9;
      for (let a = x0 + 0.4 + off; a < x0 + w - 0.4; a += 0.9) cx.fillRect(a, s * 7.0 - 1.25, 0.28, 2.5);
      continue;
    }
    const xs = MODELO === "rodas4" ? [4.6, -4.6] : [0], larg = MODELO === "rodas4" ? 1.8 : 1.6;
    for (const xc of xs) {
      cx.fillStyle = "#1c1d1f"; rrect(cx, xc - rodaR, s * 7.1 - larg / 2, rodaR * 2, larg, 0.5); cx.fill();
      cx.fillStyle = "#0d0e0f"; const off = (anda % 1.2 + 1.2) % 1.2;
      for (let a = -rodaR + off; a < rodaR; a += 1.2) cx.fillRect(xc + a, s * 7.1 - larg / 2, 0.5, larg);
    }
  }
  /* motores e hub (cada kit com as suas peças) */
  const corMotor = PLAT.id === "ev3" ? "#c9ccd0" : PLAT.id === "arduino" ? "#f2c230" : "#f2f3f0";
  const corCubo = PLAT.id === "ev3" ? "#d0342c" : PLAT.id === "arduino" ? "#26292e" : "#0aa3e0";
  cx.fillStyle = corMotor;
  rrect(cx, -5.7, -5.6, 9, 3, 1); cx.fill(); rrect(cx, -5.7, 2.6, 9, 3, 1); cx.fill();
  cx.fillStyle = corCubo; cx.beginPath(); cx.arc(0, 5.9, 0.9, 0, 7); cx.arc(0, -5.9, 0.9, 0, 7); cx.fill();
  if (PLAT.id === "ev3") {
    cx.fillStyle = "#c9ccd0"; rrect(cx, -9, -3.9, 11.4, 7.8, 1); cx.fill();
    cx.fillStyle = "#2e3136"; rrect(cx, -8.4, -3.4, 10.2, 6.8, 0.8); cx.fill();
    cx.fillStyle = "#a9b89c"; rrect(cx, -3, -2.2, 3.4, 4.4, 0.3); cx.fill();
    const st = { "0": "#333", "1": "#33ff66", "2": "#ff3030", "3": "#ff9a1a", "4": "#33ff66", "5": "#ff3030", "6": "#ff9a1a" }[LUZ_STATUS] || "#33ff66";
    cx.fillStyle = st; rrect(cx, -8, -1.8, 3.6, 3.6, 0.6); cx.fill();
    cx.fillStyle = "#8d9299"; rrect(cx, -7, -0.8, 1.6, 1.6, 0.3); cx.fill();
  } else if (PLAT.id === "arduino") {
    cx.fillStyle = "#00979d"; rrect(cx, -7.6, -4, 6.9, 5.3, 0.3); cx.fill();
    cx.fillStyle = "#1b1b1b"; cx.fillRect(-7.2, -3.8, 5.2, 0.5); cx.fillRect(-7.2, 0.6, 5.2, 0.5); cx.fillRect(-5.8, -1.9, 3.4, 0.9);
    cx.fillStyle = "#b3202a"; rrect(cx, -6.4, 1.5, 4.3, 4.3, 0.3); cx.fill();
    cx.fillStyle = "#1e2024"; rrect(cx, -0.2, -2.1, 7.6, 4.2, 0.4); cx.fill();
    cx.fillStyle = "#f4f4f2"; rrect(cx, 1.3, -1.7, 4.6, 3.4, 0.3); cx.fill();
  } else {
  cx.fillStyle = "#f7f7f5"; rrect(cx, -7.9, -3, 9, 6, 1); cx.fill();
  cx.strokeStyle = "rgba(0,0,0,.18)"; cx.stroke();
  cx.fillStyle = "#3a3f46"; rrect(cx, -6.1, -2.5, 6.4, 5, 0.7); cx.fill();
  for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
    const b = MATRIZ[yy * 5 + xx];
    cx.fillStyle = b > 0 ? "rgba(255,255,255," + (0.35 + b / 150) + ")" : "#2a2d31";
    cx.fillRect(-2.9 + (2 - yy) * 0.84 - 0.3, (2 - xx) * 0.84 - 0.3, 0.6, 0.6);
  }
  cx.fillStyle = HEX_SPIKE[BOTAO] || "#33ff66"; cx.beginPath(); cx.arc(-6.6, 0, 0.6, 0, 7); cx.fill();
  }
  /* barra e sensores de cor */
  cx.fillStyle = "#1e2024"; cx.fillRect(FRENTE - 0.7, -(SEP + 1.5), 1.4, 2 * SEP + 3);
  for (const p of portasDe("cor")) {
    const l = ladoCm(p), cor = HEX_SPIKE[corDeSensorVisual(p)] || "#fff";
    cx.fillStyle = "#1e2024"; rrect(cx, FRENTE - 1.1, l - 1.1, 2.2, 2.2, 0.5); cx.fill();
    cx.fillStyle = cor; cx.beginPath(); cx.arc(FRENTE, l, 0.55, 0, 7); cx.fill();
  }
  /* sensor de distancia com olhos */
  if (portasDe("dist").length) {
    cx.fillStyle = "#1e2024"; rrect(cx, 7.5, -3.1, 2.2, 6.2, 0.8); cx.fill();
    const perto = ULT_DIST.d < 15;
    for (const s of [-1.45, 1.45]) {
      cx.fillStyle = perto ? "#ff7a1a" : "#e9eef3"; cx.beginPath(); cx.arc(9.9, s, 0.95, 0, 7); cx.fill();
      cx.fillStyle = "#0b0d10"; cx.beginPath(); cx.arc(9.95, s, 0.6, 0, 7); cx.fill();
    }
  }
  /* pá coletora, vista de cima (levantada ela fica quase em pé na frente do robô) */
  if (CFG[PA_PORTA] === "motor") {
    const fr = paFracao(MOT[PA_PORTA].pos), ph = paAngulo();
    const xa = PA_PIVO.x + (PA.x0 - PA_PIVO.x) * Math.cos(ph) + (PA_PIVO.h - 0.3) * Math.sin(ph);
    const xb = PA_PIVO.x + (PA.x1 - PA_PIVO.x) * Math.cos(ph) + (PA_PIVO.h - 0.3) * Math.sin(ph);
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
    const rgbPa = PLAT.id === "ev3" ? "208,52,44" : PLAT.id === "arduino" ? "200,210,215" : "10,163,224";
    cx.fillStyle = fr > 0.5 ? "rgba(" + rgbPa + ",.28)" : "rgba(" + rgbPa + ",.55)";
    cx.fillRect(x0, -PA.meia, x1 - x0, 2 * PA.meia);
    cx.fillStyle = "rgb(" + rgbPa + ")";
    cx.fillRect(x0, PA.meia - 0.3, x1 - x0, 0.6); cx.fillRect(x0, -PA.meia - 0.3, x1 - x0, 0.6);
    cx.fillStyle = "#3a3f46"; cx.fillRect(PA_PIVO.x - 0.5, -PA.meia - 1.1, 1, 2 * PA.meia + 2.2);
  }
  cx.restore();
}
function geo2d() {
  const W = lona2.width, H = lona2.height, esc = Math.min(W / LARG, H / ALT) * 0.97;
  return { W, H, esc, ox: (W - LARG * esc) / 2, oy: (H - ALT * esc) / 2 };
}
function desenha2d() {
  const cx = lona2.getContext("2d");
  const { W, H, esc, ox, oy } = geo2d();
  const px = x => ox + x * esc, py = y => oy + (ALT - y) * esc;
  cx.setTransform(1, 0, 0, 1, 0, 0);
  const gf = cx.createLinearGradient(0, 0, 0, H); gf.addColorStop(0, "#2e3847"); gf.addColorStop(1, "#1a2029");
  cx.fillStyle = gf; cx.fillRect(0, 0, W, H);
  cx.save(); cx.shadowColor = "rgba(0,0,0,.45)"; cx.shadowBlur = 18; cx.shadowOffsetY = 6;
  cx.fillStyle = "#000"; cx.fillRect(ox, oy, LARG * esc, ALT * esc); cx.restore();
  cx.imageSmoothingEnabled = true;
  cx.drawImage(MAT, ox, oy, LARG * esc, ALT * esc);
  for (const r of RELEVO) {
    if (r.tipo === "lombada") {
      cx.fillStyle = "rgba(0,0,0,.22)"; cx.fillRect(px(r.x1) + 1.5, py(r.y2) + 1.5, (r.x2 - r.x1) * esc, (r.y2 - r.y1) * esc);
      cx.fillStyle = "#fbfaf6"; cx.fillRect(px(r.x1), py(r.y2), (r.x2 - r.x1) * esc, (r.y2 - r.y1) * esc);
      continue;
    }
    const g = r.tipo === "rampa"
      ? cx.createLinearGradient(px(r.x1), py(r.y1), r.eixo === "x" ? px(r.x2) : px(r.x1), r.eixo === "x" ? py(r.y1) : py(r.y2)) : null;
    if (g) { g.addColorStop(0, "rgba(0,0,0," + (r.a0 ? .16 : 0) + ")"); g.addColorStop(1, "rgba(0,0,0," + (r.a1 ? .16 : 0) + ")"); cx.fillStyle = g; }
    else cx.fillStyle = r.tipo === "gangorra" ? "rgba(255,160,40,.18)" : "rgba(0,0,0,.14)";
    cx.fillRect(px(r.x1), py(r.y2), (r.x2 - r.x1) * esc, (r.y2 - r.y1) * esc);
  }
  if (R.trilha.length > 1) {
    cx.beginPath(); cx.moveTo(px(R.trilha[0][0]), py(R.trilha[0][1]));
    for (const p of R.trilha) cx.lineTo(px(p[0]), py(p[1]));
    cx.strokeStyle = "rgba(255,77,58,.85)"; cx.lineWidth = Math.max(1.2, esc * 0.45); cx.lineJoin = "round"; cx.stroke();
  }
  for (const c of CAIXAS) {
    cx.save(); cx.shadowColor = "rgba(0,0,0,.4)"; cx.shadowBlur = 6; cx.shadowOffsetX = 3; cx.shadowOffsetY = 3;
    cx.fillStyle = "#" + c.cor.toString(16).padStart(6, "0");
    if (c.r !== undefined) { cx.beginPath(); cx.arc(px(c.x), py(c.y), c.r * esc, 0, 7); cx.fill(); }
    else cx.fillRect(px(c.x - c.w/2), py(c.y + c.h/2), c.w * esc, c.h * esc);
    cx.restore();
    if (c.r !== undefined) { cx.fillStyle = "rgba(255,255,255,.25)"; cx.beginPath(); cx.arc(px(c.x) - c.r * esc * .3, py(c.y) - c.r * esc * .3, c.r * esc * .45, 0, 7); cx.fill(); }
    if (c === OBJSEL) { cx.strokeStyle = "#ffe066"; cx.lineWidth = 2; cx.strokeRect(px(c.x) - 9 * esc, py(c.y) - 9 * esc, 18 * esc, 18 * esc); }
  }
  for (const m of molduras()) {
    cx.save(); cx.shadowColor = "rgba(0,0,0,.4)"; cx.shadowBlur = 5; cx.shadowOffsetX = 2; cx.shadowOffsetY = 2;
    cx.strokeStyle = m.cor === "verde" ? "#1f8a4c" : "#c0392b"; cx.lineWidth = MOLD * esc; cx.lineCap = "round";
    cx.beginPath(); cx.moveTo(px(m.ax), py(m.ay)); cx.lineTo(px(m.bx), py(m.by)); cx.stroke(); cx.restore();
  }
  for (const v of VITIMAS) {
    const g = cx.createRadialGradient(px(v.x) - esc, py(v.y) - esc, 0.3 * esc, px(v.x), py(v.y), 2.6 * esc);
    if (v.tipo === "prata") { g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#8d949c"); }
    else { g.addColorStop(0, "#5a5f66"); g.addColorStop(1, "#0d0e10"); }
    cx.fillStyle = g; cx.beginPath(); cx.arc(px(v.x), py(v.y), 2.5 * esc, 0, 7); cx.fill();
    if (v === OBJSEL) { cx.strokeStyle = "#ffe066"; cx.lineWidth = 2; cx.beginPath(); cx.arc(px(v.x), py(v.y), 6 * esc, 0, 7); cx.stroke(); }
  }
  const E = PISTAS[PISTA_ATUAL].estado;
  if (E && E.chegada && ROTA) {
    const [x, y] = E.chegada.pt;
    cx.font = Math.round(7 * esc) + "px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
    const dv = VIZ[E.chegada.lado];
    cx.fillText("🏁", px(x - dv[0] * 7 - dv[1] * 16), py(y - dv[1] * 7 + dv[0] * 16));
  }
  if (CORRIDA) for (const [x, y] of CORRIDA.marcas) {
    cx.strokeStyle = "#ff3b30"; cx.lineWidth = 3; cx.lineCap = "round"; const k = 2.5 * esc;
    cx.beginPath(); cx.moveTo(px(x) - k, py(y) - k); cx.lineTo(px(x) + k, py(y) + k); cx.moveTo(px(x) + k, py(y) - k); cx.lineTo(px(x) - k, py(y) + k); cx.stroke();
  }
  if (document.getElementById("chkRaio").checked && portasDe("dist").length) {
    const o = posSensor(10, 0), d = Math.min(ULT_DIST.d, 200);
    cx.setLineDash([4, 3]); cx.strokeStyle = "rgba(255,90,90,.9)"; cx.lineWidth = 1.5;
    cx.beginPath(); cx.moveTo(px(o.x), py(o.y)); cx.lineTo(px(o.x + Math.cos(R.th) * d), py(o.y + Math.sin(R.th) * d)); cx.stroke();
    cx.setLineDash([]);
  }
  cx.save();
  cx.translate(px(R.x), py(R.y)); cx.rotate(-R.th); cx.scale(1, -1);
  desenhaRoboTopo(cx, esc);
  cx.restore();
  /* manchas de luz dos sensores */
  for (const p of portasDe("cor")) {
    const s = pontoDoSensorCor(p), cor = HEX_SPIKE[corDeSensorVisual(p)] || "#fff";
    const g = cx.createRadialGradient(px(s.x), py(s.y), 0, px(s.x), py(s.y), MANCHA * esc);
    g.addColorStop(0, cor); g.addColorStop(0.5, cor + "88"); g.addColorStop(1, cor + "00");
    cx.fillStyle = g; cx.beginPath(); cx.arc(px(s.x), py(s.y), MANCHA * esc, 0, 7); cx.fill();
  }
  if (SELECIONADO) {
    cx.beginPath(); cx.arc(px(R.x), py(R.y), 14 * esc, 0, 7);
    cx.strokeStyle = "#ffe066"; cx.lineWidth = 2; cx.setLineDash([5, 4]); cx.stroke(); cx.setLineDash([]);
  }
  posicionaBalao(() => [px(R.x) / W, (py(R.y) - 16 * esc) / H]);
}
function telaParaMundo2d(cxp, cyp) {
  const { esc, ox, oy } = geo2d();
  return { x: (cxp - ox) / esc, y: ALT - (cyp - oy) / esc };
}

/* ---- balao de fala do hub ---- */
const balao = document.createElement("div");
balao.style.cssText = "position:absolute;z-index:5;transform:translate(-50%,-100%);background:#fff;color:#1a1f27;" +
  "font-weight:800;font-size:13px;padding:5px 10px;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;white-space:nowrap";
balao.hidden = true; palco.appendChild(balao);
function posicionaBalao(onde) {
  const vivo = BALAO && R.t < BALAO.ate;
  balao.hidden = !vivo;
  if (!vivo) return;
  const [u, v] = onde();
  balao.textContent = BALAO.t;
  balao.style.left = (u * palco.clientWidth) + "px"; balao.style.top = (v * palco.clientHeight) + "px";
}

/* ---------------------- lente dos sensores ---------------------- */
function desenhaLente() {
  if (!MOSTRA_LENTE) return;
  const cv = document.getElementById("lente"), cx = cv.getContext("2d"), T = cv.width;
  const span = Math.max(12, 2 * SEP + 8);            /* cm mostrados */
  const k = T / span;
  const m = posSensor(FRENTE, 0);
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.fillStyle = "#000"; cx.fillRect(0, 0, T, T);
  cx.save();
  cx.beginPath(); cx.arc(T / 2, T / 2, T / 2, 0, 7); cx.clip();
  cx.translate(T / 2, T / 2);
  cx.rotate(R.th - Math.PI / 2);
  cx.scale(k / RES, k / RES);
  cx.translate(-m.x * RES, -(ALT - m.y) * RES);
  cx.imageSmoothingEnabled = false;
  cx.drawImage(MAT, 0, 0);
  cx.restore();
  /* os sensores, com a frente do robo para cima */
  cx.save(); cx.translate(T / 2, T / 2);
  for (const p of portasDe("cor")) {
    const l = ladoCm(p), cor = HEX_SPIKE[corDeSensorVisual(p)] || "#fff";
    const x = -l * k, r = MANCHA * 0.65 * k;
    cx.strokeStyle = "rgba(255,255,255,.95)"; cx.lineWidth = 3; cx.beginPath(); cx.arc(x, 0, r, 0, 7); cx.stroke();
    cx.strokeStyle = cor; cx.lineWidth = 6; cx.beginPath(); cx.arc(x, 0, r + 5, 0, 7); cx.stroke();
    cx.fillStyle = "rgba(0,0,0,.65)"; cx.font = "800 20px Nunito, sans-serif"; cx.textAlign = "center";
    const t = p + " " + reflexoVisual(p);
    const tw = cx.measureText(t).width + 12;
    cx.fillRect(x - tw / 2, r + 12, tw, 26); cx.fillStyle = "#fff"; cx.fillText(t, x, r + 32);
  }
  cx.fillStyle = "rgba(255,210,63,.95)";
  cx.beginPath(); cx.moveTo(0, -T / 2 + 8); cx.lineTo(-9, -T / 2 + 24); cx.lineTo(9, -T / 2 + 24); cx.fill();
  cx.restore();
}
/* o número que o sensor mostraria, sem o ruído (na escala do kit) */
function reflexoVisual(p) {
  const v = leitura(p), l = luzDaSuperficie(v), q = v[3] || 0;
  if (PLAT.id === "ev3") return Math.round(3 + l * 0.72 + q * 17);
  if (PLAT.id === "arduino") return Math.round(1000 - l * 9 - q * 40);
  return Math.round(l);
}
/* a mesma leitura em 0 a 100 (para o gráfico) */
function reflexo100(p) { const v = reflexoVisual(p); return PLAT.id === "arduino" ? Math.round((1023 - v) / 10.23) : v; }

/* ---------------------- grafico ao vivo ---------------------- */
const AMOSTRAS = [], MAX_AM = 500;
const CORES_LINHA = ["#ff8c1a", "#00b3d6", "#b35cff", "#2ec27e"];
function gravaAmostra() {
  const cores = portasDe("cor");
  AMOSTRAS.push({ t: R.t, rf: cores.map(reflexo100), cr: cores.map(corDeSensorVisual),
    ve: MOT[PAR_MOV[0]] ? MOT[PAR_MOV[0]].real : 0, vd: MOT[PAR_MOV[1]] ? MOT[PAR_MOV[1]].real : 0 });
  if (AMOSTRAS.length > MAX_AM) AMOSTRAS.shift();
}
function desenhaGrafico() {
  const cv = document.getElementById("grafico"); if (!cv.offsetParent) return;
  const cx = cv.getContext("2d"), W = cv.width, H = cv.height;
  const esc = getComputedStyle(document.documentElement);
  const tinta = esc.getPropertyValue("--tinta3").trim() || "#8a95a2";
  cx.clearRect(0, 0, W, H);
  const y = v => H - 16 - v / 100 * (H - 30);
  cx.strokeStyle = "rgba(128,140,155,.25)"; cx.lineWidth = 1; cx.font = "600 18px Nunito, sans-serif"; cx.fillStyle = tinta;
  for (const v of [0, 25, 50, 75, 100]) { cx.beginPath(); cx.moveTo(36, y(v)); cx.lineTo(W, y(v)); cx.stroke(); cx.fillText(v, 2, y(v) + 6); }
  cx.setLineDash([6, 5]); cx.strokeStyle = "rgba(128,140,155,.7)"; cx.beginPath(); cx.moveTo(36, y(50)); cx.lineTo(W, y(50)); cx.stroke(); cx.setLineDash([]);
  const n = AMOSTRAS.length; if (n < 2) return;
  const x = i => 36 + (i + MAX_AM - n) / (MAX_AM - 1) * (W - 40);
  const linha = (f, cor, lw, tr) => {
    cx.strokeStyle = cor; cx.lineWidth = lw; cx.setLineDash(tr ? [8, 6] : []);
    cx.beginPath(); for (let i = 0; i < n; i++) { const v = f(AMOSTRAS[i]); if (v === undefined) continue; i ? cx.lineTo(x(i), y(v)) : cx.moveTo(x(i), y(v)); } cx.stroke();
  };
  linha(a => (a.ve + 100) / 2, "rgba(128,140,155,.55)", 2, true);
  linha(a => (a.vd + 100) / 2, "rgba(128,140,155,.9)", 2, true);
  const nc = AMOSTRAS[n - 1].rf.length;
  for (let k = 0; k < nc; k++) linha(a => a.rf[k], CORES_LINHA[k % 4], 3);
  cx.setLineDash([]);
  /* faixa de cores */
  const fc = document.getElementById("faixaCores"), fx = fc.getContext("2d"), FW = fc.width, FH = fc.height;
  fx.clearRect(0, 0, FW, FH);
  const bw = (FW - 40) / (MAX_AM - 1), hh = FH / Math.max(1, nc);
  for (let k = 0; k < nc; k++) {
    fx.fillStyle = CORES_LINHA[k % 4]; fx.fillRect(0, k * hh + 2, 30, hh - 4);
    for (let i = 0; i < n; i++) { fx.fillStyle = HEX_SPIKE[AMOSTRAS[i].cr[k]] || "#777"; fx.fillRect(36 + (i + MAX_AM - n) * bw, k * hh, bw + 1, hh - 1); }
  }
}
function montaLegenda() {
  const cores = portasDe("cor");
  document.getElementById("legenda").innerHTML =
    cores.map((p, i) => '<span><i style="background:' + CORES_LINHA[i % 4] + '"></i>' + PLAT.rotulo(p) + " reflexo (" +
      (LADO[p] === "esq" ? "esq." : LADO[p] === "dir" ? "dir." : "centro") + ")</span>").join("") +
    '<span><i style="background:rgba(128,140,155,.7)"></i>motores (−100 a 100)</span>';
}

/* ---------------------- confete ---------------------- */
let CONF = [];
function soltaConfete() {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = document.getElementById("confete"), W = cv.width, H = cv.height;
  const cores = ["#ffd23f", "#34d058", "#00b3d6", "#ff5fa2", "#ff8c1a", "#ffffff"];
  CONF = [];
  for (let i = 0; i < 160; i++) CONF.push({ x: W / 2 + (Math.random() - .5) * 80, y: H * 0.45, vx: (Math.random() - .5) * 9,
    vy: -4 - Math.random() * 8, r: Math.random() * 6.3, vr: (Math.random() - .5) * .3, c: cores[i % cores.length], w: 5 + Math.random() * 5 });
}
function desenhaConfete() {
  const cv = document.getElementById("confete"), cx = cv.getContext("2d");
  if (!CONF.length) return;
  cx.clearRect(0, 0, cv.width, cv.height);
  for (const p of CONF) {
    p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); cx.restore();
  }
  CONF = CONF.filter(p => p.y < cv.height + 20);
  if (!CONF.length) cx.clearRect(0, 0, cv.width, cv.height);
}
function fanfarra() { [[72, .12], [76, .12], [79, .12], [84, .35]].reduce((t, [n, d]) => { setTimeout(() => bipe(n, d, 0.05), t); return t + d * 1000 * 0.9; }, 0); }
