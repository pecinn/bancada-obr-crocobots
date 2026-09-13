/* =======================================================================
   IDENTIDADE ROBOHUB: tela de entrada e escolha do robô
   (a trilha e a bancada continuam com a cara da CROCOBOTS)
   Roda antes do js15: aqui não se usa nenhuma constante do js15 durante o carregamento.
   ======================================================================= */
const ICO = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  seta_dir: '<path d="M9 6l6 6-6 6"/>',
  seta_baixo: '<path d="M6 9l6 6 6-6"/>',
  casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  barras: '<path d="M5 20v-5M10 20V10M15 20v-7M20 20V4"/>',
  trofeu: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H4.5a3.5 3.5 0 0 0 4 4.2M16 6h3.5a3.5 3.5 0 0 1-4 4.2M12 13v4M8 21h8M9.5 17h5"/>',
  ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6"/><path d="M12 16.8h.01"/>',
  engrenagem: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><circle cx="12" cy="12" r="6.5"/>',
  sinal: '<path d="M4.5 10.5a10.5 10.5 0 0 1 15 0M7.8 14a6 6 0 0 1 8.4 0"/><circle cx="12" cy="18.5" r="1.4"/>',
  giro: '<circle cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="9.5" ry="3.6"/><ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(120 12 12)"/>',
  cubo: '<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M4 7.4l8 4.6 8-4.6M12 12v9.2"/>',
  chip: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx=".8"/><path d="M9.5 2.5v4M14.5 2.5v4M9.5 17.5v4M14.5 17.5v4M2.5 9.5h4M2.5 14.5h4M17.5 9.5h4M17.5 14.5h4"/>',
  codigo: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15"/>',
  lampada: '<path d="M9.2 18h5.6M10.2 21h3.6"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1 1.3 1 2.2h5.2c0-.9.3-1.6 1-2.2A6 6 0 0 0 12 3z"/>',
  robo: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4.5V8"/><circle cx="12" cy="3.6" r="1"/><circle cx="9.5" cy="13" r="1.2"/><circle cx="14.5" cy="13" r="1.2"/><path d="M2.5 12v3M21.5 12v3"/>',
  grupo: '<circle cx="12" cy="7.5" r="3"/><circle cx="5.5" cy="9.5" r="2.3"/><circle cx="18.5" cy="9.5" r="2.3"/><path d="M6.5 20c.4-3.6 2.6-6 5.5-6s5.1 2.4 5.5 6M1.5 18.5c.3-2.4 1.8-4 3.9-4M22.5 18.5c-.3-2.4-1.8-4-3.9-4"/>',
  foguete: '<path d="M14 4.5c3-1.8 5.5-1.5 5.5-1.5s.3 2.5-1.5 5.5L12 15l-3-3z"/><path d="M9 12l-4 .5L3 10l4.5-3H12M12 15l-.5 4 2.5 2 3-4.5V12"/><path d="M6.5 17.5c-1.5.5-2.5 2.5-2.5 2.5s2-1 2.5-2.5z"/><circle cx="15.5" cy="8.5" r="1.3"/>',
  rabisco: '<path d="M21 3c-2 6-7 10-15 11"/><path d="M9.5 10.5L5.8 14l4.4 2.2"/>'
};
const ico = n => '<svg class="ico ico-' + n + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICO[n] || "") + "</svg>";

/* logo RoboHub: cabeça de robô na frente de uma engrenagem meio azul, meio laranja */
let LOGO_N = 0;
function logoRobohub() {
  const cx = 60, cy = 58, n = 12, R1 = 47, R0 = 39; let d = "";
  const u = "rh" + (++LOGO_N);   /* ids únicos: gradiente de um SVG escondido não pinta os outros */
  for (let i = 0; i < n; i++) {
    const b = i / n * Math.PI * 2, t = Math.PI / n;
    const p = [[R0, b - t * 0.62], [R1, b - t * 0.36], [R1, b + t * 0.36], [R0, b + t * 0.62]];
    p.forEach(([r, a], j) => d += (i === 0 && j === 0 ? "M" : "L") + (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1));
  }
  d += "Z";
  return '<svg class="rh-simbolo" viewBox="0 0 120 112" aria-hidden="true"><defs>' +
    '<linearGradient id="' + u + 'G" x1="0" x2="1"><stop offset="0" stop-color="#1f7dff"/><stop offset=".5" stop-color="#2fb2ff"/><stop offset=".5" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ff5b1f"/></linearGradient>' +
    '<linearGradient id="' + u + 'C" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9d6e8"/></linearGradient>' +
    '<radialGradient id="' + u + 'O"><stop offset="0" stop-color="#bfe8ff"/><stop offset=".55" stop-color="#2fb2ff"/><stop offset="1" stop-color="#1f7dff"/></radialGradient></defs>' +
    '<path d="' + d + '" fill="url(#' + u + 'G)"/>' +
    '<line x1="60" y1="30" x2="60" y2="12" stroke="#dfe8f5" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="10" r="6" fill="url(#' + u + 'C)"/>' +
    '<rect x="17" y="50" width="10" height="20" rx="4" fill="#dfe8f5"/><rect x="93" y="50" width="10" height="20" rx="4" fill="#dfe8f5"/>' +
    '<rect x="24" y="28" width="72" height="60" rx="26" fill="url(#' + u + 'C)" stroke="#07101f" stroke-width="3"/>' +
    '<rect x="33" y="41" width="54" height="34" rx="16" fill="#0a1830"/>' +
    '<rect x="42" y="52" width="12" height="11" rx="5" fill="url(#' + u + 'O)"/><rect x="66" y="52" width="12" height="11" rx="5" fill="url(#' + u + 'O)"/></svg>';
}
function montaLogos() {
  document.querySelectorAll("#portal [data-logo]").forEach(el => {
    el.innerHTML = logoRobohub() + '<span class="rh-palavra"><b>ROBO<em>HUB</em></b><small>Conhecimento em movimento</small></span>';
    el.setAttribute("role", "img"); el.setAttribute("aria-label", "RoboHub");
  });
  document.querySelectorAll("#portal i[data-ico]").forEach(el => { el.outerHTML = ico(el.dataset.ico); });
}

/* ---- as "fotos" dos robôs: os modelos 3D da própria bancada, renderizados com fundo transparente ---- */
let FOTOS_KIT = null;
function fotosDosKits() {
  if (FOTOS_KIT) return FOTOS_KIT;
  FOTOS_KIT = {};
  if (typeof THREE === "undefined") return FOTOS_KIT;
  const W = 960, H = 720, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  let r;
  try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { return FOTOS_KIT; }
  r.setClearColor(0x000000, 0);
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const cenaF = new THREE.Scene();
  try { const pm = new THREE.PMREMGenerator(r), eq = texCeuEquiret(); eq.mapping = THREE.EquirectangularReflectionMapping; cenaF.environment = pm.fromEquirectangular(eq).texture; } catch (e) {}
  cenaF.add(new THREE.HemisphereLight(0xdfeaff, 0x1a2233, 0.7));
  const chave = new THREE.DirectionalLight(0xffffff, 1.9); chave.position.set(30, 55, 38); chave.castShadow = true;
  chave.shadow.mapSize.set(1024, 1024); Object.assign(chave.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 200 });
  chave.shadow.radius = 6; cenaF.add(chave);
  const contra = new THREE.DirectionalLight(0xffffff, 0.8); contra.position.set(-40, 18, -30); cenaF.add(contra);
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: 0.5 }));
  sombra.rotation.x = -Math.PI / 2; sombra.receiveShadow = true; cenaF.add(sombra);
  const cam = new THREE.PerspectiveCamera(26, W / H, 1, 1000);
  const acento = { spike: 0xffc814, ev3: 0xff3b30, arduino: 0x22c4ef };
  const guarda = { PLAT, PORTAS, CFG, LADO, PECAS };
  try {
    for (const k of Object.keys(PLATAFORMAS)) {
      PLAT = PLATAFORMAS[k]; PORTAS = PLAT.portas.slice(); CFG = Object.assign({}, PLAT.cfg); LADO = Object.assign({}, PLAT.lado);
      const g = montaCarro3d();
      g.traverse(o => { if (o.material && o.material.blending === THREE.AdditiveBlending) o.visible = false; });
      if (PECAS.leds) [6, 8, 16, 18, 20, 21, 22, 23, 24, 12].forEach(i => { if (PECAS.leds[i]) PECAS.leds[i].emissiveIntensity = 1.3; });
      contra.color.setHex(acento[k]);
      cenaF.add(g);
      const caixa = new THREE.Box3().setFromObject(g), centro = caixa.getCenter(new THREE.Vector3()), tam = caixa.getSize(new THREE.Vector3());
      const dir = new THREE.Vector3(1.0, 0.36, 1.25).normalize();
      const dist = Math.max(tam.x, tam.y, tam.z) / (2 * Math.tan(cam.fov * Math.PI / 360)) * 1.12;
      cam.position.copy(centro).addScaledVector(dir, dist); cam.lookAt(centro.x, centro.y - tam.y * 0.08, centro.z);
      r.render(cenaF, cam);
      FOTOS_KIT[k] = cv.toDataURL("image/png");
      cenaF.remove(g);
      g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
  } catch (e) { console.warn("fotos dos kits:", e); }
  finally {
    PLAT = guarda.PLAT; PORTAS = guarda.PORTAS; CFG = guarda.CFG; LADO = guarda.LADO; PECAS = guarda.PECAS; MATRIZ_MUDOU = true;
    r.dispose(); try { r.forceContextLoss(); } catch (e) {}
  }
  return FOTOS_KIT;
}
function aplicaFotos() {
  const f = FOTOS_KIT || {};
  document.querySelectorAll("#portal img[data-foto]").forEach(im => {
    const k = im.dataset.foto;
    if (f[k]) { if (im.getAttribute("src") !== f[k]) im.src = f[k]; im.hidden = false; return; }
    im.hidden = true;
    const prox = im.nextElementSibling;
    if (!(prox && prox.classList.contains("arte-reserva")) && typeof ARTE_KIT !== "undefined") im.insertAdjacentHTML("afterend", '<span class="arte-reserva">' + ARTE_KIT[k] + "</span>");
  });
}
function preparaFotos() {
  if (FOTOS_KIT) return aplicaFotos();
  setTimeout(() => { fotosDosKits(); aplicaFotos(); }, 40);
}

/* ---- cartões dos kits ---- */
const INFO_KIT = {
  spike: { classe: "spike", marca: "LEGO® Education", nome: "SPIKE <em>Prime</em>", lema: "Construa. Programe. Crie sem limites.",
    itens: [["engrenagem", "Portas A a F para motores e sensores"], ["sinal", "Sensor de cor com luz refletida, cor e valor bruto RGB"],
            ["giro", "Giroscópio dentro do hub"], ["cubo", "Programação em blocos · baixa <b>.llsp3</b> para o app SPIKE"]] },
  ev3: { classe: "ev3", marca: "LEGO® MINDSTORMS® Education", nome: "EV3", lema: "Programação com propósito.",
    itens: [["engrenagem", "Motores em A a D, sensores em 1 a 4"], ["sinal", "Sensor de cor com luz refletida e cor (sem RGB)"],
            ["giro", "Giroscópio e ultrassônico em portas"], ["cubo", "Programação em blocos · baixa <b>.lmsp</b> para o EV3 Classroom"]] },
  arduino: { classe: "ard", marca: "Arduino UNO", nome: "Arduino", lema: "Da ideia ao mundo real.",
    itens: [["engrenagem", "UNO + ponte H L298N + servo da pá"], ["sinal", "Sensores de linha TCRT5000 e de cor TCS3200"],
            ["chip", "HC-SR04 e MPU-6050"], ["codigo", "Arduino IDE · baixa <b>.ino</b> em C++ comentado"]] }
};
/* a tela de kits é a arte do modelo: não há nada para desenhar, só encaixar o palco na janela */
function desenhaKits() { fechaMenuEu(); ajustaModelo(); }
function escolheKit(k) {
  if (!PLATAFORMAS[k]) return;
  const troca = k !== PLAT.id;
  SESSAO.plataforma = k; SESSAO.tela = "trilha"; gravaSessao(SESSAO);
  if (troca) { if (typeof salvaAgora === "function") salvaAgora(); location.reload(); return; }
  mostraPortal("trilha");
}

/* ---- entrada ---- */
const CHAVE_ABERTA = "portalRobotica.aberta";
/* aviso da entrada: o toast do modelo (aparece embaixo e some em 2,8 s) */
function avisoLogin(t) {
  const m = $("lgToast"); if (!t) return m.classList.remove("show");
  m.textContent = t; m.classList.add("show");
  clearTimeout(avisoLogin.tempo); avisoLogin.tempo = setTimeout(() => m.classList.remove("show"), 2800);
}
/* o palco do modelo (1536 × 1024) cabe inteiro na janela, sem cortar nem deformar a arte */
/* a parte da tela que aparece de verdade: a janela, o visualViewport e o recorte que o
   IntersectionObserver enxerga (quando a página está num painel ou iframe maior que a área visível) */
const VISIVEL_POR = {};
function caixaVisivel(sec) {
  const r = sec.getBoundingClientRect();
  let x0 = Math.max(r.left, 0), y0 = Math.max(r.top, 0), x1 = Math.min(r.right, innerWidth), y1 = Math.min(r.bottom, innerHeight);
  const vv = window.visualViewport;
  if (vv) { x0 = Math.max(x0, vv.offsetLeft); y0 = Math.max(y0, vv.offsetTop); x1 = Math.min(x1, vv.offsetLeft + vv.width); y1 = Math.min(y1, vv.offsetTop + vv.height); }
  const io = VISIVEL_POR[sec.id];
  if (io && io.w > 80 && io.h > 80) { x0 = Math.max(x0, io.x); y0 = Math.max(y0, io.y); x1 = Math.min(x1, io.x + io.w); y1 = Math.min(y1, io.y + io.h); }
  return { r, x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
}
function ajustaModelo() {
  for (const id of ["telaLogin", "telaKits"]) {
    const sec = $(id); if (!sec || sec.hidden) continue;
    const c = caixaVisivel(sec), p = sec.querySelector(".page");
    p.style.setProperty("--s", Math.min(c.w / 1536, c.h / 1024));
    p.style.left = (c.x - c.r.left + c.w / 2) + "px";
    p.style.top = (c.y - c.r.top + c.h / 2) + "px";
  }
}
/* aviso da escolha do robô: o toast do index2 do modelo (some em 2,2 s) */
function avisoKits(t) {
  const m = $("kitsToast"); m.textContent = t; m.classList.add("show");
  clearTimeout(avisoKits.tempo); avisoKits.tempo = setTimeout(() => m.classList.remove("show"), 2200);
}
function fechaMenuEu() { $("menuEu").hidden = true; $("btEu").setAttribute("aria-expanded", "false"); }
function abreAjuda(abre) {
  $("rhAjuda").hidden = !abre;
  if (abre) setTimeout(() => $("rhAjuda").querySelector("button").focus(), 20);
}
(function () {
  montaLogos();
  ajustaModelo(); addEventListener("resize", ajustaModelo); addEventListener("load", ajustaModelo);
  if (window.visualViewport) { visualViewport.addEventListener("resize", ajustaModelo); visualViewport.addEventListener("scroll", ajustaModelo); }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(ents => {
      for (const e of ents) { const q = e.intersectionRect; VISIVEL_POR[e.target.id] = e.isIntersecting ? { x: q.left, y: q.top, w: q.width, h: q.height } : null; }
      ajustaModelo();
    }, { threshold: Array.from({ length: 101 }, (_, i) => i / 100) });
    ["telaLogin", "telaKits"].forEach(id => io.observe($(id)));
  }
  /* placeholder invisível só para o CSS saber quando o campo tem texto (e cobrir o texto desenhado na arte) */
  ["lgUsuario", "lgSenha"].forEach(id => $(id).placeholder = " ");
  $("formLogin").onsubmit = e => {
    e.preventDefault();
    const u = $("lgUsuario").value.trim().toLowerCase(), s = $("lgSenha").value;
    if (!u || !s) { avisoLogin("Informe seu usuário/e-mail e sua senha."); return; }
    if (!USUARIOS[u] || USUARIOS[u] !== s) { avisoLogin("Usuário ou senha não conferem. Confira e tente de novo."); $("lgSenha").select(); return; }
    avisoLogin("");
    SESSAO.usuario = u; SESSAO.lembrar = $("lgLembrar").checked; gravaSessao(SESSAO);
    try { sessionStorage.setItem(CHAVE_ABERTA, "1"); } catch (e) {}
    mostraPortal(SESSAO.plataforma ? "trilha" : "kits");
  };
  $("lgOlho").onclick = () => {
    const s = $("lgSenha"), ver = s.type === "password";
    s.type = ver ? "text" : "password";
    $("lgOlho").setAttribute("aria-pressed", ver ? "true" : "false");
    $("lgOlho").setAttribute("aria-label", ver ? "Esconder senha" : "Mostrar senha");
  };
  $("btEu").onclick = e => { e.stopPropagation(); const abre = $("menuEu").hidden; $("menuEu").hidden = !abre; $("btEu").setAttribute("aria-expanded", abre ? "true" : "false"); };
  document.addEventListener("click", e => { if (!e.target.closest("#btEu, #menuEu")) fechaMenuEu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { fechaMenuEu(); abreAjuda(false); } });
  $("portal").addEventListener("click", e => {
    const a = e.target.closest("[data-acao]"); if (!a) return;
    const acao = a.dataset.acao;
    if (acao === "sair") { fechaMenuEu(); delete SESSAO.usuario; SESSAO.tela = "login"; gravaSessao(SESSAO); $("lgSenha").value = ""; mostraPortal("login"); }
    if (acao === "kits" || acao === "inicio") mostraPortal("kits");
    if (acao === "jornada" || acao === "conquistas") {
      fechaMenuEu();
      if (SESSAO.plataforma) mostraPortal("trilha");
      else avisoKits("Escolha um robô primeiro para abrir a sua jornada.");
    }
    if (acao === "ajuda") abreAjuda(true);
    if (acao === "fechaAjuda") abreAjuda(false);
    if (acao === "esqueci") avisoLogin("Acesso de demonstração: usuário crocobots · senha 123456.");
    if (acao === "google") avisoLogin("O login com Google chega na versão para instituições.");
    if (acao === "conta") avisoLogin("Peça o seu acesso ao professor de robótica da sua escola.");
    if (acao === "livre") abreLivre();
    if (acao === "kit") escolheKit(a.dataset.kit);
    if (acao === "desafio") abreDesafio(a.dataset.id);
  });
  $("rhAjuda").addEventListener("click", e => { if (e.target === $("rhAjuda")) abreAjuda(false); });
})();
