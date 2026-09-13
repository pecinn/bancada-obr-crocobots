
/* =======================================================================
   9. PAINEL, LACO E INTERACAO
   ======================================================================= */
const $ = id => document.getElementById(id);
function registra(t) {
  const c = $("console");
  c.textContent += t + "\n";
  if (c.textContent.length > 60000) c.textContent = c.textContent.slice(-40000);
  c.scrollTop = c.scrollHeight;
}
function zeraPrograma() {
  RODANDO = false; PAUSADO = false; FIOS = []; ATUAL = null; PARADO_POR = "";
  R.cron = 0; R.t = 0; R.trilha = []; R.yaw0 = R.th; R.yaw = 0;
  PORTAS.forEach(p => { MOT[p].pos = 0; MOT[p].vel = 0; MOT[p].real = 0; MOT[p].alvo = undefined; });
  PA_BAIXA = false; for (const v of VITIMAS) { v.preso = null; v.salva = null; v.queda = 0; }
  PAR_MOV = PLAT.par.slice(); VEL_MOV = 50; LUZ_STATUS = "1"; BALAO = null; BOTAO = "6"; carinha();
  CORRIDA = null; AMOSTRAS.length = 0;
  $("btPausa").textContent = "⏸"; $("fcPausa").textContent = "⏸ Pausar";
  prepara(); destaca(null);
}
function voltaLargada() {
  MOVIDO = false;
  if (typeof sorteiaDesafio === "function") sorteiaDesafio();
  R.x = LARGADA.x; R.y = LARGADA.y; R.th = LARGADA.a * Math.PI / 180;
  R.alt = alturaEm(R.x, R.y); R.pitch = R.roll = 0; R.yaw = 0; R.yaw0 = R.th; R.trilha = [];
  tiltGangorra = tiltInicial(); precisaRelevo = true;
  for (const v of VITIMAS) { if (v.x0 === undefined) { v.x0 = v.x; v.y0 = v.y; } v.x = v.x0; v.y = v.y0; v.preso = null; v.salva = null; v.queda = 0; }
  if (typeof sorteiaSala === "function") sorteiaSala();
  if (TRES) for (const v of VITIMAS) if (v._m) v._m.position.set(v.x - LARG / 2, 2.5 + alturaEm(v.x, v.y), -(v.y - ALT / 2));
}
function reinicia() { voltaLargada(); zeraPrograma(); }
let SELECIONADO = false, OBJSEL = null, MOVIDO = false;
const velSim = () => parseFloat($("vel").value) || 1;

function nomeCor(id) {
  const m = CORES_SPIKE.find(c => c[1] === String(id));
  return m ? m[0] : id;
}
function cel(t, v) { return '<div class="leitura"><b>' + t + "</b><span>" + v + "</span></div>"; }
function painel() {
  const cores = portasDe("cor"), dists = portasDe("dist"), forcas = portasDe("forca");
  if ($("leituras").offsetParent) {
    let h = "";
    cores.forEach(p => {
      const lado = LADO[p] === "esq" ? "esq." : LADO[p] === "dir" ? "dir." : "centro";
      const c = corDeSensorVisual(p);
      h += cel(PLAT.rotulo(p) + " cor · " + lado, '<i style="display:inline-block;width:11px;height:11px;border-radius:3px;vertical-align:-1px;margin-right:5px;border:1px solid rgba(0,0,0,.25);background:' + HEX_SPIKE[c] + '"></i>' + nomeCor(c));
      h += cel(PLAT.rotulo(p) + (PLAT.id === "arduino" ? " analógico" : " reflexo"), reflexoVisual(p));
      const v = leitura(p);
      if (PLAT.temCru) h += cel(PLAT.rotulo(p) + " bruto R G B", [0, 1, 2].map(i => Math.round(v[i] / 255 * PLAT.cruMax * (1 - 0.4 * (v[3] || 0)))).join(" "));
    });
    dists.forEach(p => h += cel(PLAT.rotulo(p) + " distância", ULT_DIST.d >= 200 ? "—" : Math.round(ULT_DIST.d) + " cm"));
    forcas.forEach(p => h += cel(PLAT.rotulo(p) + (PLAT.id === "spike" ? " força" : " toque"), forcaAgora() + "%"));
    h += cel("guinada", Math.round(((R.yaw % 360) + 540) % 360 - 180) + "°");
    h += cel("inclinação", Math.round(R.pitch * 180 / Math.PI) + "°");
    h += cel("cronômetro", R.cron.toFixed(1) + " s");
    $("leituras").innerHTML = h;
    const em = PAR_MOV[0], ed = PAR_MOV[1];
    let e = "";
    e += cel("posição", R.x.toFixed(0) + ", " + R.y.toFixed(0) + " cm");
    e += cel("direção", Math.round(((R.th * 180 / Math.PI) % 360 + 360) % 360) + "°");
    e += cel("altura", R.alt.toFixed(1) + " cm");
    e += cel("motores " + PAR_MOV.join("+"), Math.round(MOT[em] ? MOT[em].real : 0) + " / " + Math.round(MOT[ed] ? MOT[ed].real : 0) + " %");
    e += cel("situação", RODANDO ? (PAUSADO ? "pausado" : "rodando") : (PARADO_POR || "parado"));
    e += cel("colisão", R.bateu ? "batendo" : "livre");
    $("estado").innerHTML = e;
  }
  if ($("varsVivas").offsetParent) {
    $("varsVivas").innerHTML = Object.keys(VARS).length
      ? Object.keys(VARS).map(k => cel(k, typeof VARS[k] === "number" ? +VARS[k].toFixed(3) : VARS[k])).join("")
      : cel("variáveis", "nenhuma");
  }
  /* chips do HUD */
  $("sensChips").innerHTML = cores.map((p, i) => {
    const c = corDeSensorVisual(p);
    return '<div class="schip"><span class="amostra" style="background:' + HEX_SPIKE[c] + '"></span><span>' + PLAT.rotulo(p) +
      " <small>" + nomeCor(c) + "</small></span><span class=rf>" + reflexoVisual(p) + "</span></div>";
  }).join("") + (dists.length ? '<div class="schip"><span>📏 <small>distância</small></span><span class=rf>' +
    (ULT_DIST.d >= 200 ? "—" : Math.round(ULT_DIST.d) + " cm") + "</span></div>" : "");
}
function hud() {
  const cont = RODANDO && CORRIDA && CORRIDA.naChegada && CORRIDA.paradoDesde !== null && !CORRIDA.completou;
  const cg = $("contagem");
  cg.hidden = !cont;
  if (cont) cg.innerHTML = "<b>" + Math.max(0, 5 - (R.t - CORRIDA.paradoDesde)).toFixed(1).replace(".", ",") + "</b><span>parado na faixa vermelha</span>";
  const est = TESTANDO ? "testando…" : cont ? "na chegada" : RODANDO ? (PAUSADO ? "pausado" : (CORRIDA && CORRIDA.travado ? "travado!" : CORRIDA && CORRIDA.fora ? "fora da linha" : "rodando")) : (PARADO_POR || "parado");
  $("hEstado").textContent = est;
  $("hPonto").className = "ponto" + (RODANDO && !PAUSADO ? " on" : PAUSADO ? " pausa" : "");
  $("hTempo").textContent = "⏱ " + R.t.toFixed(1).replace(".", ",") + " s";
  const pct = CORRIDA && ROTA ? CORRIDA.pct : 0;
  $("hBarra").style.width = pct + "%";
  $("hPct").textContent = ROTA ? pct + "%" : "—";
  $("hEquipe").textContent = "🤖 " + (EQUIPE.nome || "equipe");
}

/* ---- laco principal ---- */
let acumulado = 0, marcaT = 0, ultPainel = 0, ultGraf = 0, ESTAVA = false;
function laco(agora) {
  const dtReal = marcaT ? Math.min(0.06, (agora - marcaT) / 1000) : 0;
  marcaT = agora;
  if (RODANDO && !PAUSADO && !TESTANDO) {
    acumulado += dtReal * velSim();
    let n = 0;
    while (acumulado >= DT && n < 800 && RODANDO) { umPasso(); acumulado -= DT; n++; }
    if (acumulado > 0.4) acumulado = 0;
  } else acumulado = 0;
  if (ESTAVA && !RODANDO && !TESTANDO) fimDeCorrida();
  ESTAVA = RODANDO && !TESTANDO;
  if (!RODANDO) distanciaFrente();
  if (VISTA3D && TRES) desenha3d(); else desenha2d();
  desenhaLente(); desenhaConfete(); hud();
  if (agora - ultPainel > 120) { painel(); ultPainel = agora; }
  if (agora - ultGraf > 66) { desenhaGrafico(); ultGraf = agora; }
  destaca(ATUAL);
  requestAnimationFrame(laco);
}

/* ---- por que a corrida acabou antes da chegada ---- */
function explicaParada(C) {
  const m = PARADO_POR || "interrompido";
  if (C.travado || m === "travou") return "O robô ficou travado. Veja no mapa onde ele parou.";
  if (m === "perdeu a linha") return "Perdeu a linha e não voltou para ela. Os ✕ vermelhos mostram onde.";
  if (m === "parado por você") return "Você parou a corrida.";
  if (m === "bloco parar") return "Um bloco \"parar tudo\" encerrou o programa antes da faixa vermelha.";
  if (m === "programa terminou") {
    const txt = "O programa chegou ao fim sozinho, antes da faixa vermelha: não sobrou nenhum bloco para rodar.";
    if (String(VARS.fimSegueLinha) === "1")
      return txt + " A variável fimSegueLinha virou 1: o checa_cinza achou que viu a fita prata da sala de resgate" +
        (C.saidas ? " (o robô tinha saído da linha e leu a mesa como cinza)." : ".");
    return txt + (C.saidas ? " Antes disso ele saiu da linha nos pontos marcados com ✕." : "");
  }
  return (C.saidas ? "Saiu da linha nos pontos marcados com ✕. " : "") + "Parou: " + m + ".";
}

/* ---- fim de uma corrida: cartao de resultado e historico ---- */
const HIST = [];
function fimDeCorrida() {
  const C = CORRIDA; if (!C || R.t < 0.5) return;
  if (typeof DESAFIO !== "undefined" && DESAFIO) { if (PARADO_POR !== "parado por você") terminaDesafio(); return; }
  const st = estrelasDe(C);
  const nome = PISTAS[PISTA_ATUAL].nome;
  HIST.unshift({ nome, pct: ROTA ? C.pct : null, t: C.tempoFim || R.t, st, saidas: C.saidas, motivo: (ROTA ? notaDe(C).txt + " · " : "") + (PARADO_POR || "interrompido") });
  $("contagem").hidden = true;
  if (HIST.length > 12) HIST.pop();
  $("historico").innerHTML = HIST.map(h => "<div style='display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid var(--borda)'><span><b>" +
    h.nome + "</b><br><small>" + h.motivo + (h.saidas ? " · " + h.saidas + " saída(s) da linha" : "") + "</small></span><span style='text-align:right;white-space:nowrap'>" +
    (h.pct === null ? "" : "★".repeat(h.st) + "☆".repeat(3 - h.st) + "<br>") + (h.pct === null ? "" : h.pct + "% · ") + h.t.toFixed(1) + " s</span></div>").join("");
  if (!ROTA) return;
  const nota = notaDe(C);
  const titulos = { Perfeito: "Perfeito!", Bom: "Bom!", Ruim: "Ruim · continue treinando" };
  const res = $("resultado");
  const vit = VITIMAS.length ? '<div><b>' + C.resgatadas + "/" + VITIMAS.length + "</b><span>vítimas na área certa" +
    (C.trocadas ? " (+" + C.trocadas + " na trocada)" : "") + "</span></div>" : "";
  res.innerHTML = '<img class="logoRes" src="' + LOGO_IMG.src + '" alt=""><div class="estrelas">' + "★".repeat(st) + '<span style="opacity:.3">' + "★".repeat(3 - st) + "</span></div>" +
    "<h3>" + titulos[nota.txt] + "</h3><p>" + nome + "</p>" +
    '<div class="nums"><div><b>' + C.pct + '%</b><span>percurso</span></div><div><b>' + (C.tempoFim || R.t).toFixed(1).replace(".", ",") +
    ' s</b><span>' + (C.completou ? "tempo da volta" : "tempo até parar") + '</span></div><div><b>' + C.saidas + "</b><span>saídas</span></div>" + vit + "</div>" +
    "<p>" + (C.completou ? (C.saidas ? "Chegada validada, mas saiu da linha " + C.saidas + "×. Os ✕ vermelhos mostram onde." : C.falhas ? "Chegada validada depois de " + C.falhas + " falha(s) de progresso na faixa vermelha." : "Parou 5 s na faixa vermelha, sem sair da linha nenhuma vez.") :
      C.falhas ? "Passou pela faixa vermelha sem parar: falha de progresso. Pela regra da OBR o robô precisa parar em cima dela e ficar 5 s parado." :
      C.naChegada ? "Chegou na faixa vermelha, mas não ficou 5 s completamente parado." :
      explicaParada(C)) + "</p>" +
    '<button class="verde" id="resDeNovo">⟲ Tentar de novo</button><button id="resFecha">Fechar</button>';
  res.classList.add("show");
  $("resDeNovo").onclick = () => { res.classList.remove("show"); voltaLargada(); $("btRodar").click(); };
  $("resFecha").onclick = () => res.classList.remove("show");
  if (C.completou) { soltaConfete(); fanfarra(); }
}

/* ---- botoes ---- */
$("btRodar").onclick = () => {
  if (TESTANDO) return;
  $("resultado").classList.remove("show");
  try { if (SOM) { AUDIO = AUDIO || new (window.AudioContext || window.webkitAudioContext)(); AUDIO.resume(); } } catch (e) {}
  if (!MOVIDO) voltaLargada();
  MOVIDO = false;
  zeraPrograma();
  if (typeof DESAFIO !== "undefined" && DESAFIO) novaTentativa();
  if (comeca("ev_inicio")) {
    RODANDO = true; PAUSADO = false; acumulado = 0; ESTAVA = true;
    registra("--- rodando em \"" + PISTAS[PISTA_ATUAL].nome + "\" de " + R.x.toFixed(0) + ", " + R.y.toFixed(0) + " cm ---");
  }
};
$("btParar").onclick = () => { if (!RODANDO) return; RODANDO = false; paraPar(); PARADO_POR = "parado por você"; };
$("btPausa").onclick = () => {
  if (!RODANDO) return;
  PAUSADO = !PAUSADO;
  $("btPausa").textContent = PAUSADO ? "▶" : "⏸";
  $("fcPausa").textContent = PAUSADO ? "▶ Continuar" : "⏸ Pausar";
};
$("btReset").onclick = () => { if (TESTANDO) return; $("resultado").classList.remove("show"); voltaLargada(); zeraPrograma(); };
$("btSom").onclick = () => { SOM = !SOM; $("btSom").textContent = SOM ? "🔊" : "🔇"; salvaDepois(); };
function mostraVel(v) {
  $("vel").value = v; $("fcVel").value = v;
  $("velTxt").textContent = v + "× real"; $("fcVelTxt").textContent = v + "× real";
}
$("vel").oninput = e => mostraVel(e.target.value);
$("fcVel").oninput = e => mostraVel(e.target.value);

/* vistas */
$("vb3d").onclick = () => { VISTA3D = TRES; MODO_CAM = "livre"; trocaVista(); };
$("vbSegue").onclick = () => { VISTA3D = TRES; MODO_CAM = "segue"; trocaVista(); };
$("vbCima").onclick = () => { VISTA3D = false; trocaVista(); };
$("vbLente").onclick = () => { MOSTRA_LENTE = !MOSTRA_LENTE; palco.classList.toggle("semlente", !MOSTRA_LENTE); $("vbLente").classList.toggle("on", MOSTRA_LENTE); };

/* tela cheia */
function entraCheio(sim) {
  CHEIO = sim;
  palco.classList.toggle("cheio", sim);
  ajustaLona(); trocaVista();
  if (sim) {
    const r = document.documentElement.requestFullscreen;
    if (r) { try { r.call(document.documentElement).catch(() => {}); } catch (e) {} }
  } else if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} }
}
$("btCheio").onclick = () => entraCheio(!CHEIO);
$("fcSair").onclick = () => entraCheio(false);
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && CHEIO) entraCheio(false); });
for (const [a, b] of [["fcRodar","btRodar"],["fcParar","btParar"],["fcPausa","btPausa"],["fcReset","btReset"]])
  $(a).onclick = () => $(b).click();

/* abas */
document.querySelectorAll("#abas button").forEach(b => b.onclick = () => {
  document.querySelectorAll("#abas button").forEach(x => x.classList.toggle("on", x === b));
  document.querySelectorAll(".aba").forEach(a => a.hidden = a.dataset.aba !== b.dataset.aba);
  if (b.dataset.aba === "pista") montaTabuleiro();
  painel();
});

/* divisor arrastavel entre os blocos e a pista */
(function () {
  const dv = $("divisor"), hub = $("hub");
  let ini = null;
  dv.addEventListener("pointerdown", e => { ini = { x: e.clientX, w: hub.offsetWidth }; dv.classList.add("ativo"); dv.setPointerCapture(e.pointerId); });
  dv.addEventListener("pointermove", e => {
    if (!ini) return;
    const w = Math.max(360, Math.min(window.innerWidth * 0.74, ini.w - (e.clientX - ini.x)));
    hub.style.width = w + "px"; ajustaLona();
  });
  dv.addEventListener("pointerup", () => { ini = null; dv.classList.remove("ativo"); salvaDepois(); });
})();

/* ---- portas ---- */
function montaPortas() {
  const d = $("portas");
  d.innerHTML = "";
  for (const p of PORTAS) {
    const l = document.createElement("div"); l.className = "linha";
    const lb = document.createElement("label"); lb.textContent = (PLAT.id === "arduino" ? "" : "Porta ") + PLAT.rotulo(p);
    if (PLAT.pinos && PLAT.pinos[p]) lb.title = PLAT.pinos[p];
    const s = document.createElement("select");
    const soMotor = PLAT.portasMotor.indexOf(p) >= 0 && PLAT.portasSensor.indexOf(p) < 0;
    const soSensor = PLAT.portasSensor.indexOf(p) >= 0 && PLAT.portasMotor.indexOf(p) < 0;
    for (const [rot, v] of PLAT.tipos.filter(t => soMotor ? (t[1] === "vazio" || t[1] === "motor") : soSensor ? t[1] !== "motor" : true)) {
      const o = document.createElement("option"); o.value = v; o.textContent = rot; s.appendChild(o);
    }
    s.value = CFG[p];
    s.onchange = () => { CFG[p] = s.value; arrumaLados(); montaPortas(); mudouRobo(); };
    l.appendChild(lb); l.appendChild(s);
    if (CFG[p] === "cor") {
      const sl = document.createElement("select");
      sl.style.maxWidth = "96px";
      for (const [rot, v] of [["à esquerda","esq"],["à direita","dir"],["no centro","centro"]]) {
        const o = document.createElement("option"); o.value = v; o.textContent = rot; sl.appendChild(o);
      }
      sl.value = LADO[p] || "centro";
      sl.onchange = () => { LADO[p] = sl.value; mudouRobo(); };
      l.appendChild(sl);
    }
    d.appendChild(l);
  }
  const nota = document.createElement("p"); nota.className = "nota";
  nota.textContent = (PLAT.id === "arduino" ? "Passe o mouse no nome para ver os pinos. " : "") + "Se o robô virar para o lado errado no quadrado verde, troque aqui qual sensor de cor é o da esquerda.";
  d.appendChild(nota);
}
function marcaModelo() {
  document.querySelectorAll("#modelos button").forEach(b => b.setAttribute("aria-checked", b.dataset.modelo === MODELO ? "true" : "false"));
}
document.querySelectorAll("#modelos button").forEach(b => b.onclick = () => {
  if (MODELO === b.dataset.modelo) return;
  MODELO = b.dataset.modelo; marcaModelo(); refazRobo(); salvaDepois();
  registra("Modelo do robô: " + MODELOS[MODELO] + ".");
});
function mudouRobo() { refazRobo(); montaLegenda(); AMOSTRAS.length = 0; painel(); salvaDepois(); }
$("cfgRoda").oninput = e => { ROD_MM = num(e.target.value) || 56; mudouRobo(); };
$("cfgEixo").oninput = e => { EIXO_CM = num(e.target.value) || 14; salvaDepois(); };
const DESLIZES = [
  ["cfgSep", "oSep", v => SEP = v, () => SEP, v => v.toFixed(1).replace(".", ",") + " cm", true],
  ["cfgFrente", "oFrente", v => FRENTE = v, () => FRENTE, v => v.toFixed(1).replace(".", ",") + " cm", true],
  ["cfgMancha", "oMancha", v => MANCHA = v, () => MANCHA, v => "Ø " + v.toFixed(1).replace(".", ",") + " cm", true],
  ["cfgRuido", "oRuido", v => RUIDO = v, () => RUIDO, v => v ? "±" + v.toFixed(1).replace(".", ",") : "sem ruído", false],
  ["cfgMotor", "oMotor", v => DIF_MOTOR = v, () => DIF_MOTOR, v => v ? v.toFixed(1).replace(".", ",") + "%" : "iguais", false],
  ["cfgInercia", "oInercia", v => INERCIA = v, () => INERCIA, v => v ? v.toFixed(2).replace(".", ",") + " s" : "desligada", false]
];
function montaDeslizes() {
  for (const [id, o, set, get, fmt, robo] of DESLIZES) {
    const el = $(id); el.value = get(); $(o).textContent = fmt(get());
    el.oninput = () => { set(parseFloat(el.value)); $(o).textContent = fmt(get()); if (robo) refazRobo(); salvaDepois(); };
  }
}
function montaEquipe() {
  const d = $("coresEquipe"); d.innerHTML = "";
  for (const c of CORES_EQUIPE) {
    const b = document.createElement("button"); b.style.background = c; b.title = c;
    if (c === EQUIPE.cor) b.className = "on";
    b.onclick = () => { EQUIPE.cor = c; montaEquipe(); refazRobo(); salvaDepois(); };
    d.appendChild(b);
  }
  $("cfgEquipe").value = EQUIPE.nome;
}
let tmEquipe = 0;
$("cfgEquipe").oninput = e => { EQUIPE.nome = e.target.value; clearTimeout(tmEquipe); tmEquipe = setTimeout(() => { refazRobo(); salvaDepois(); }, 400); };

/* ---- mexer no robo e nos objetos ---- */
let ORB = null, ARRC = null, ARRO = null;
const telaViva = () => (VISTA3D && TRES) ? lona : lona2;
function mundoNoPonto(e) {
  const alvo = telaViva();
  const r = alvo.getBoundingClientRect();
  const cx = (e.clientX - r.left) * alvo.width / r.width;
  const cy = (e.clientY - r.top) * alvo.height / r.height;
  if (!VISTA3D || !TRES) return telaParaMundo2d(cx, cy);
  const nd = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1));
  const rc = new THREE.Raycaster(); rc.setFromCamera(nd, cam);
  const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -R.alt);
  const p = new THREE.Vector3();
  if (!rc.ray.intersectPlane(plano, p)) return null;
  return { x: p.x + LARG / 2, y: -p.z + ALT / 2 };
}
palco.addEventListener("pointerdown", e => {
  if (e.target.closest && (e.target.closest("#barraCheia") || e.target.closest(".hud"))) return;
  if (TESTANDO) return;
  palco.setPointerCapture(e.pointerId);
  const m = mundoNoPonto(e);
  if (m && Math.hypot(m.x - R.x, m.y - R.y) < 12) {
    SELECIONADO = true; OBJSEL = null; ARRC = { dx: R.x - m.x, dy: R.y - m.y };
    if (RODANDO) { PAUSADO = true; $("btPausa").textContent = "▶"; }
  } else {
    const o = m ? objetoNoPonto(m.x, m.y) : null;
    if (o && !o.parede) { SELECIONADO = false; OBJSEL = o; ARRO = { o, dx: o.x - m.x, dy: o.y - m.y }; mostraObjeto(); }
    else { SELECIONADO = false; OBJSEL = null; mostraObjeto(); ORB = { x: e.clientX, y: e.clientY, az: camAz, el: camEl }; }
  }
  palco.style.cursor = (ARRC || ARRO) ? "grabbing" : "move";
});
palco.addEventListener("pointermove", e => {
  if (ARRO) {
    const m = mundoNoPonto(e); if (!m) return;
    const o = ARRO.o;
    o.x = Math.max(3, Math.min(LARG - 3, m.x + ARRO.dx)); o.y = Math.max(3, Math.min(ALT - 3, m.y + ARRO.dy));
    if (o.tipo) { o.x0 = o.x; o.y0 = o.y; }
    if (o._m) o._m.position.set(o.x - LARG / 2, o._m.position.y, -(o.y - ALT / 2));
  } else if (ARRC) {
    const m = mundoNoPonto(e); if (!m) return;
    R.x = Math.max(4, Math.min(LARG - 4, m.x + ARRC.dx)); R.y = Math.max(4, Math.min(ALT - 4, m.y + ARRC.dy)); MOVIDO = true;
    R.alt = alturaEm(R.x, R.y); R.trilha = [];
  } else if (ORB && MODO_CAM === "livre") {
    camAz = ORB.az - (e.clientX - ORB.x) * 0.008;
    camEl = Math.max(0.12, Math.min(1.5, ORB.el + (e.clientY - ORB.y) * 0.006));
  }
});
palco.addEventListener("pointerup", () => { if (ARRO) refazCena(); ARRC = null; ARRO = null; ORB = null; palco.style.cursor = ""; });
palco.addEventListener("wheel", e => {
  if (e.target.closest && e.target.closest(".hud")) return;
  camR = Math.max(45, Math.min(600, camR + e.deltaY * 0.25)); e.preventDefault();
}, { passive: false });
function objetoNoPonto(x, y) {
  let melhor = null, dmin = 6;
  for (const c of CAIXAS) { const f = folgaAte(c, x, y); if (f < dmin) { dmin = f; melhor = c; } }
  for (const v of VITIMAS) { const f = Math.hypot(x - v.x, y - v.y) - 2.6; if (f < dmin) { dmin = f; melhor = v; } }
  return melhor;
}
function mostraObjeto() {
  const d = $("objInfo");
  if (!OBJSEL) { d.textContent = "Clique num obstáculo ou vítima para pegá-lo. Arraste para mover, Delete para tirar."; return; }
  const q = OBJSEL.tipo ? "vítima " + OBJSEL.tipo : OBJSEL.r !== undefined ? "obstáculo redondo" : "obstáculo quadrado";
  d.textContent = "Pego: " + q + " em " + OBJSEL.x.toFixed(0) + ", " + OBJSEL.y.toFixed(0) + " cm.";
}
function tiraObjeto(o) {
  if (!o) return;
  let i = CAIXAS.indexOf(o); if (i >= 0) CAIXAS.splice(i, 1);
  i = VITIMAS.indexOf(o);    if (i >= 0) VITIMAS.splice(i, 1);
  OBJSEL = null; refazCena(); mostraObjeto();
}
$("btAddObst").onclick = () => {
  const o = { x: R.x + 25 * Math.cos(R.th), y: R.y + 25 * Math.sin(R.th), r: 5, alt: 14, cor: 0xe07a1f };
  o.x = Math.max(6, Math.min(LARG - 6, o.x)); o.y = Math.max(6, Math.min(ALT - 6, o.y));
  CAIXAS.push(o); OBJSEL = o; refazCena(); mostraObjeto();
};
$("btAddVit").onclick = () => {
  const v = { x: R.x + 25 * Math.cos(R.th), y: R.y + 25 * Math.sin(R.th), tipo: VITIMAS.length % 3 === 2 ? "preta" : "prata" };
  v.x = Math.max(6, Math.min(LARG - 6, v.x)); v.y = Math.max(6, Math.min(ALT - 6, v.y)); v.x0 = v.x; v.y0 = v.y;
  VITIMAS.push(v); OBJSEL = v; refazCena(); mostraObjeto();
};
$("btDelObj").onclick = () => tiraObjeto(OBJSEL);
$("btLimpaObst").onclick = () => {
  CAIXAS = CAIXAS.filter(c => c.parede);
  OBJSEL = null; refazCena(); mostraObjeto();
  registra("Obstáculos retirados da pista (as paredes ficaram).");
};
window.addEventListener("keydown", e => {
  if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === "Escape" && CHEIO) { entraCheio(false); e.preventDefault(); return; }
  if (e.key === "f" || e.key === "F") { entraCheio(!CHEIO); e.preventDefault(); return; }
  if (e.key === " " && RODANDO) { $("btPausa").click(); e.preventDefault(); return; }
  if ((e.key === "Delete" || e.key === "Backspace") && OBJSEL) { tiraObjeto(OBJSEL); e.preventDefault(); return; }
  if (OBJSEL) {
    const p = e.shiftKey ? 0.5 : 3;
    if (e.key === "ArrowLeft")  { OBJSEL.x -= p; e.preventDefault(); }
    if (e.key === "ArrowRight") { OBJSEL.x += p; e.preventDefault(); }
    if (e.key === "ArrowUp")    { OBJSEL.y += p; e.preventDefault(); }
    if (e.key === "ArrowDown")  { OBJSEL.y -= p; e.preventDefault(); }
    if (/^Arrow/.test(e.key)) { if (OBJSEL.tipo) { OBJSEL.x0 = OBJSEL.x; OBJSEL.y0 = OBJSEL.y; } refazCena(); mostraObjeto(); return; }
  }
  if (!SELECIONADO) return;
  if (/^Arrow/.test(e.key)) MOVIDO = true;
  const g = e.shiftKey ? 1 : 5;
  if (e.key === "ArrowLeft")  { R.th += g * Math.PI / 180; e.preventDefault(); }
  if (e.key === "ArrowRight") { R.th -= g * Math.PI / 180; e.preventDefault(); }
  if (e.key === "ArrowUp")    { R.x += Math.cos(R.th) * (g / 2); R.y += Math.sin(R.th) * (g / 2); e.preventDefault(); }
  if (e.key === "ArrowDown")  { R.x -= Math.cos(R.th) * (g / 2); R.y -= Math.sin(R.th) * (g / 2); e.preventDefault(); }
  if (e.key === "r" || e.key === "R") {
    LARGADA = { x: R.x, y: R.y, a: R.th * 180 / Math.PI };
    estadoDe(PISTA_ATUAL).largada = Object.assign({}, LARGADA);
    registra("Largada marcada em " + R.x.toFixed(0) + ", " + R.y.toFixed(0) + " cm.");
    if (PISTAS[PISTA_ATUAL].livre) salvaDepois();
  }
  R.alt = alturaEm(R.x, R.y);
});

/* =======================================================================
   9b. EDITOR DE LADRILHOS
   ======================================================================= */
let LADSEL = 1, LADROT = 0, MODOVERDE = false, CELSEL = null;
function desenhaLadrilho(cv, t, rot, marcas) {
  const cx = cv.getContext("2d"), tam = cv.width, esc = tam / 300;
  const base = () => cx.setTransform(1, 0, 0, -1, 0, tam);
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.fillStyle = CORES_PISO.branco; cx.fillRect(0, 0, tam, tam);
  if (LADRILHOS[t]) {
    cx.save(); base(); cx.beginPath(); cx.rect(0, 0, tam, tam); cx.clip();
    LADRILHOS[t].f(criaPintor(cx, prepLadrilho(cx, base, 0, 0, esc, rot)));
    cx.restore();
  }
  for (let q = 0; q < 4; q++) if (marcas & (1 << q)) {
    const sx = (q === 0 || q === 3) ? 1 : -1, sy = (q === 0 || q === 1) ? 1 : -1;
    const x = 150 + sx * 10, y = 150 + sy * 10;
    base(); cx.fillStyle = CORES_PISO.verde;
    cx.fillRect(Math.min(x, x + sx * 25) * esc, Math.min(y, y + sy * 25) * esc, 25 * esc, 25 * esc);
  }
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.strokeStyle = "rgba(0,0,0,.12)"; cx.strokeRect(.5, .5, tam - 1, tam - 1);
}
function montaTabuleiro() {
  const t = $("tab");
  if (!ehPistaLadrilho()) { t.innerHTML = ""; return; }
  t.style.gridTemplateColumns = "repeat(" + LCOL + ",1fr)";
  t.innerHTML = "";
  const ruins = encaixesRuins();
  const ehRuim = (c, l) => ruins.some(r => r[0] === c && r[1] === l);
  for (let l = LLIN - 1; l >= 0; l--) for (let c = 0; c < LCOL; c++) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 60;
    const m = TAPETE[l] ? TAPETE[l][c] : null;
    desenhaLadrilho(cv, m ? m.t : 0, m ? m.rot : 0, MARCAS[l] ? MARCAS[l][c] : 0);
    if (ehRuim(c, l)) cv.className = "solto";
    if (CELSEL && CELSEL[0] === c && CELSEL[1] === l) cv.className += " sel";
    cv.title = "coluna " + (c + 1) + ", linha " + (l + 1);
    cv.onclick = () => {
      CELSEL = [c, l];
      if (MODOVERDE) MARCAS[l][c] ^= (1 << LADROT);
      else if (LADSEL === 0) { TAPETE[l][c] = null; MARCAS[l][c] = 0; }
      else TAPETE[l][c] = { t: LADSEL, rot: LADROT };
      repintaLadrilhos(); montaTabuleiro(); refazCena(); mostraDesc();
    };
    t.appendChild(cv);
  }
  const av = $("avisoEncaixe");
  av.style.display = ruins.length ? "" : "none";
  av.textContent = ruins.length === 1
    ? "1 casa com a linha solta: a ponta dela não encontra o ladrilho vizinho."
    : ruins.length + " casas com a linha solta: as pontas não encontram os ladrilhos vizinhos.";
}
function montaPaletaLad() {
  const p = $("pal");
  p.innerHTML = "";
  LADRILHOS.forEach((L, i) => {
    const d = document.createElement("div");
    d.className = "lad" + (i === LADSEL && !MODOVERDE ? " on" : "");
    const cv = document.createElement("canvas");
    cv.width = cv.height = 54;
    desenhaLadrilho(cv, i, LADROT, 0);
    d.appendChild(cv);
    const s = document.createElement("span"); s.textContent = L.n; d.appendChild(s);
    d.title = L.n;
    d.onclick = () => { LADSEL = i; MODOVERDE = false; montaPaletaLad(); rotuloVerde(); };
    p.appendChild(d);
  });
}
function rotuloVerde() {
  $("btVerde").textContent = "Verde: " + (MODOVERDE ? "ligado" : "desligado");
  $("btGirar").textContent = "⟳ " + (MODOVERDE ? "Canto" : "Girar") +
    " (" + (MODOVERDE ? ["NE","NO","SO","SE"][LADROT] : (LADROT * 90) + "°") + ")";
}
$("btGirar").onclick = () => { LADROT = (LADROT + 1) % 4; montaPaletaLad(); rotuloVerde(); };
$("btVerde").onclick = () => { MODOVERDE = !MODOVERDE; montaPaletaLad(); rotuloVerde(); };
$("btMapaPadrao").onclick = () => {
  const p = PISTAS[PISTA_ATUAL];
  p.estado = null; p.editada = false;
  if (p.livre) { limpaTapeteLad(); const E = estadoDe(PISTA_ATUAL); E.tapete = TAPETE; E.marcas = MARCAS; }
  montaPista(PISTA_ATUAL); montaTabuleiro(); mostraDesc();
  if (p.livre) salvaDepois();
  registra("Pista \"" + p.nome + "\" voltou ao original.");
};
$("btMapaLimpo").onclick = () => {
  const E = estadoDe(PISTA_ATUAL);
  for (let l = 0; l < LLIN; l++) for (let c = 0; c < LCOL; c++) { E.tapete[l][c] = null; E.marcas[l][c] = 0; }
  repintaLadrilhos(); montaTabuleiro(); refazCena(); mostraDesc();
};
function mostraDesc() {
  const p = PISTAS[PISTA_ATUAL];
  $("cartaoLad").style.display = ehPistaLadrilho() ? "" : "none";
  $("pistaDesc").innerHTML = p.desc + (p.editada ? "<br><br><b>Você mudou os ladrilhos</b>, então o percurso não é medido. Use <b>Desfazer mudanças</b> para voltar." : "") +
    (ROTA ? "<br><br>Percurso: <b>" + Math.round(ROTA.total) + " cm</b> de linha. Na chegada, o robô deve <b>parar em cima da faixa vermelha e ficar 5 s parado</b> (regra da OBR 2026)." : "");
}

/* ---- pistas ---- */
const sel = $("selPista");
PISTAS.forEach((p, i) => { const o = document.createElement("option"); o.value = i; o.textContent = p.nome; sel.appendChild(o); });
function vaiParaPista(i) {
  if (TESTANDO) return;
  $("resultado").classList.remove("show");
  sel.value = i; montaPista(i); mostraDesc(); montaTabuleiro(); OBJSEL = null; mostraObjeto();
  salvaDepois();
}
sel.onchange = () => {
  /* trocar de pista no seletor sai do desafio e vai para a bancada livre */
  if (typeof DESAFIO !== "undefined" && DESAFIO) { guardaProgramaDesafio(); DESAFIO = null; mundoReal(false); mostraAbaDesafio(); delete SESSAO.desafio; gravaSessao(SESSAO); }
  vaiParaPista(+sel.value);
};
$("zArruma").onclick = () => { arrumaPilhas(); registra("Blocos arrumados em colunas."); };
$("selNivel").onchange = () => {
  NIVEL_RESGATE = +$("selNivel").value;
  pintaPista(); if (TRES) refazCena(); salvaDepois();
  registra("Área de resgate: Nível " + NIVEL_RESGATE + (NIVEL_RESGATE === 2 ? " (recipiente com borda de 6 cm)." : " (triângulo com borda de 5 mm)."));
};

/* imagem propria */
$("btImg").onclick = () => $("arqImg").click();
$("arqImg").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const url = URL.createObjectURL(f), img = new Image();
  img.onload = () => {
    IMG_PISTA = img;
    const i = PISTAS.findIndex(p => p.tipo === "img");
    vaiParaPista(i);
    registra("Imagem carregada: " + img.width + " × " + img.height + " px. Arraste o robô até a linha e aperte R para marcar a largada.");
  };
  img.src = url;
};
$("imgLarg").onchange = () => { if (PISTAS[PISTA_ATUAL].tipo === "img") { pintaPista(); } };

/* =======================================================================
   9c. BATERIA DE TESTES: roda o programa em todas as pistas
   ======================================================================= */
async function testaTudo() {
  if (TESTANDO) return;
  if (!PROG.scripts.some(s => s.pilha[0] && s.pilha[0].op === "ev_inicio")) { registra("Nada para testar: falta o bloco 'quando o programa iniciar'."); return; }
  document.querySelector('#abas button[data-aba="testes"]').click();
  $("resultado").classList.remove("show");
  RODANDO = false; paraPar();
  const volta = PISTA_ATUAL;
  const lista = PISTAS.map((p, i) => i).filter(i => PISTAS[i].tipo !== "img" && !PISTAS[i].livre && !PISTAS[i].oculta);
  TESTANDO = true;
  $("btTestar").disabled = $("btTestar2").disabled = true;
  $("resLista").innerHTML = ""; $("placar").innerHTML = "";
  const out = [];
  for (let k = 0; k < lista.length; k++) {
    const i = lista[k];
    $("barraTeste").firstChild.style.width = (k / lista.length * 100) + "%";
    montaPista(i, true);
    if (!ROTA) continue;
    voltaLargada(); zeraPrograma();
    comeca("ev_inicio"); RODANDO = true;
    /* sem limite de tempo: roda até validar, travar, perder a linha ou ficar 60 s sem avançar no percurso */
    let n = 0, melhor = -1, desde = 0;
    while (RODANDO) {
      umPasso();
      if (CORRIDA.pct > melhor || naSemLinha(R.x, R.y)) { melhor = Math.max(melhor, CORRIDA.pct); desde = R.t; }   /* na sala de resgate não conta */
      if (R.t - desde > 60 && RODANDO) { RODANDO = false; paraPar(); PARADO_POR = "ficou 60 s sem avançar no percurso"; }
      if (++n % 700 === 0) await new Promise(r => setTimeout(r, 0));
    }
    const C = CORRIDA;
    const r = { i, nome: PISTAS[i].nome, pct: C.pct, t: C.tempoFim || R.t, completou: C.completou, saidas: C.saidas, falhas: C.falhas,
                st: estrelasDe(C), motivo: PARADO_POR || "interrompido", nota: notaDe(C), batidas: C.batidas,
                vit: VITIMAS.length ? C.resgatadas + "/" + VITIMAS.length + (C.trocadas ? " (+" + C.trocadas + " na área trocada, vale ×1,1)" : "") : null };
    RODANDO = false; paraPar();
    r.mini = miniatura(C);
    out.push(r); mostraTeste(r);
  }
  $("barraTeste").firstChild.style.width = "100%";
  TESTANDO = false;
  $("btTestar").disabled = $("btTestar2").disabled = false;
  montaPista(volta); sel.value = volta; mostraDesc(); montaTabuleiro();
  const ok = out.filter(r => r.completou).length, est = out.reduce((s, r) => s + r.st, 0);
  $("placar").innerHTML = '<div class="placar"><div><b>' + ok + "/" + out.length + "</b><span>chegadas validadas</span></div><div><b>" +
    est + "/" + out.length * 3 + "</b><span>estrelas</span></div><div><b>" + out.reduce((s, r) => s + r.saidas, 0) +
    "</b><span>saídas da linha</span></div></div>";
  registra("Bateria de testes: completou " + ok + " de " + out.length + " pistas.");
}
function miniatura(C) {
  const cv = document.createElement("canvas"); cv.width = 240; cv.height = 180;
  const cx = cv.getContext("2d");
  cx.drawImage(MAT, 0, 0, 240, 180);
  for (const c of CAIXAS) if (!c.parede) { cx.fillStyle = "#e07a1f"; cx.beginPath(); cx.arc(c.x, ALT - c.y, 5, 0, 7); cx.fill(); }
  if (R.trilha.length > 1) {
    cx.beginPath(); R.trilha.forEach((p, i) => i ? cx.lineTo(p[0], ALT - p[1]) : cx.moveTo(p[0], ALT - p[1]));
    cx.strokeStyle = "rgba(255,59,48,.9)"; cx.lineWidth = 2; cx.stroke();
  }
  for (const [x, y] of C.marcas) { cx.fillStyle = "#ff3b30"; cx.font = "bold 14px sans-serif"; cx.textAlign = "center"; cx.fillText("✕", x, ALT - y + 5); }
  cx.fillStyle = "#1a1f27"; cx.beginPath(); cx.arc(R.x, ALT - R.y, 4, 0, 7); cx.fill();
  cx.strokeStyle = "#ffd23f"; cx.lineWidth = 1.5; cx.stroke();
  return cv;
}
function mostraTeste(r) {
  const d = document.createElement("div"); d.className = "res";
  r.mini.title = "Abrir esta pista"; r.mini.onclick = () => vaiParaPista(r.i);
  d.appendChild(r.mini);
  const tx = document.createElement("div");
  tx.innerHTML = "<b>" + r.nome + "</b><div class='st " + r.nota.cls + "'><span class='pilula " + r.nota.cls + "'>" + r.nota.txt + "</span> " +
    r.t.toFixed(1).replace(".", ",") + " s · " + "★".repeat(r.st) + "☆".repeat(3 - r.st) + " · " +
    (r.completou ? "chegada validada" : "chegou a " + r.pct + "%") + "</div><small>" +
    (r.completou ? "" : "Parou por: " + r.motivo + ". ") + (r.falhas ? "Passou da faixa vermelha sem parar " + r.falhas + "×. " : "") + (r.saidas ? r.saidas + " saída(s) da linha. " : "Não saiu da linha. ") +
    (r.batidas ? r.batidas + " batida(s). " : "") + (r.vit ? "Vítimas no lugar certo: " + r.vit + "." : "") + "</small>";
  d.appendChild(tx);
  $("resLista").appendChild(d);
}
$("btTestar").onclick = testaTudo;
$("btTestar2").onclick = testaTudo;

/* =======================================================================
   9d. SALVAR NESTE NAVEGADOR
   ======================================================================= */
const CHAVE = "bancadaOBR.v2" + (PLAT.id === "spike" ? "" : "." + PLAT.id);
function lerSalvo() { try { return JSON.parse(localStorage.getItem(CHAVE) || "null"); } catch (e) { return null; } }
let tmSalva = 0, ULT_JSON = "";
function salvaDepois() { clearTimeout(tmSalva); tmSalva = setTimeout(salvaAgora, 600); }
function salvaAgora() {
  const livre = PISTAS.find(p => p.livre);
  if (typeof DESAFIO !== "undefined" && DESAFIO) { guardaProgramaDesafio(); return; }
  const dados = {
    prog: PROG, tag: $("tagProj").textContent, equipe: EQUIPE, cfg: CFG, lado: LADO,
    robo: { SEP, FRENTE, MANCHA, RUIDO, DIF_MOTOR, INERCIA, ROD_MM, EIXO_CM }, som: SOM, pista: PISTA_ATUAL, portas: "D-dir", versao: 8, modelo: MODELO, nivel: NIVEL_RESGATE,
    hub: $("hub").style.width || "",
    livre: livre && livre.estado ? { tapete: livre.estado.tapete, marcas: livre.estado.marcas, largada: livre.estado.largada } : null
  };
  try { const j = JSON.stringify(dados); if (j !== ULT_JSON) { localStorage.setItem(CHAVE, j); ULT_JSON = j; } } catch (e) {}
}
setInterval(salvaAgora, 5000);
function aplicaSalvo(s) {
  if (!s) return false;
  if (s.equipe) EQUIPE = Object.assign(EQUIPE, s.equipe);
  if (s.cfg) for (const p of PORTAS) if (s.cfg[p]) CFG[p] = s.cfg[p];
  if (s.lado) { for (const p of PORTAS) if (s.lado[p]) LADO[p] = s.lado[p]; Object.assign(LADO, PLAT.lado); }
  if (s.robo) ({ SEP, FRENTE, MANCHA, RUIDO, DIF_MOTOR, INERCIA, ROD_MM, EIXO_CM } = Object.assign({ SEP, FRENTE, MANCHA, RUIDO, DIF_MOTOR, INERCIA, ROD_MM, EIXO_CM }, s.robo));
  if (s.modelo && MODELOS[s.modelo]) MODELO = s.modelo;
  if (s.nivel === 1 || s.nivel === 2) NIVEL_RESGATE = s.nivel;
  $("selNivel").value = String(NIVEL_RESGATE);
  if (s.som === false) { SOM = false; $("btSom").textContent = "🔇"; }
  if (s.hub) $("hub").style.width = s.hub;
  $("cfgRoda").value = ROD_MM; $("cfgEixo").value = EIXO_CM;
  if (s.prog && s.prog.scripts && s.prog.scripts.length) {
    PROG = s.prog;
    let mx = 0;
    (function varre(arr) { for (const b of arr) { const n = parseInt(String(b.id).slice(1)); if (n > mx) mx = n;
      for (const k in b.a) if (b.a[k] && b.a[k].op) varre([b.a[k]]); for (const sub of b.c) varre(sub); } })(PROG.scripts.flatMap(x => x.pilha));
    PROG.scripts.forEach(x => { const n = parseInt(String(x.id).slice(1)); if (n > mx) mx = n; });
    SEQ = mx + 1;
    $("tagProj").textContent = s.tag || "programa salvo";
    return true;
  }
  return false;
}

/* =======================================================================
   10. EXEMPLOS E PARTIDA
   ======================================================================= */
const f_ = (op, a, c) => { const b = criaBloco(op); if (a) for (const k in a) b.a[k] = a[k]; if (c) b.c = c; return b; };
const L_ = v => ({ lit: String(v) });
const V_ = n => f_("var_ler", { VAR: L_(n) });
/* luz refletida na escala do SPIKE (0 a 100, branco ~95) em qualquer kit: assim os exemplos usam os mesmos limiares.
   EV3: (leitura - 3) / 0,72.  Arduino: (1023 - leitura analógica) / 9,6 */
const RF_ = p => PLAT.id === "ev3" ? f_("op_div", { A: f_("op_sub", { A: f_("sen_reflexo", { P: L_(p) }), B: L_(3) }), B: L_(0.72) })
  : PLAT.id === "arduino" ? f_("op_div", { A: f_("op_sub", { A: L_(1023), B: f_("sen_reflexo", { P: L_(p) }) }), B: L_(9.6) })
  : f_("sen_reflexo", { P: L_(p) });
const SOMA_ = (a, b) => f_("op_soma", { A: a, B: b });
const SUB_ = (a, b) => f_("op_sub", { A: a, B: b });
const MULT_ = (a, b) => f_("op_mult", { A: a, B: b });
function paraNoVermelho() {
  const verm = p => f_("sen_ecor", { P: L_(p), COR: L_("9") });
  return f_("ctl_se", { COND: f_("op_ou", { A: verm("D"), B: verm("E") }) },
    [[f_("mov_parar"), f_("luz_texto", { TXT: L_("Chegamos!") }), f_("ctl_parar", { ALVO: L_("all") })]]);
}
function novoPrograma(nome, vars, corpo, antes) {
  PROG = { scripts: [], vars: vars || [], procs: [] };
  corpo = [paraNoVermelho()].concat(corpo);
  PROG.scripts.push({ id: novoId(), x: 40, y: 40, pilha: [f_("ev_inicio"), f_("mov_par", { PAR: L_("AB") })].concat(antes || [], [f_("ctl_sempre", {}, [corpo])]) });
  $("tagProj").textContent = nome;
}
function exemploSeguidor() {
  const preto = p => f_("sen_ecor", { P: L_(p), COR: L_("0") });
  novoPrograma("seguidor por cor", [], [
    f_("ctl_sesenao", { COND: preto("D") },
      [[f_("mov_dual", { ESQ: L_(38), DIR: L_(-10) })],
       [f_("ctl_sesenao", { COND: preto("E") },
         [[f_("mov_dual", { ESQ: L_(-10), DIR: L_(38) })],
          [f_("mov_dual", { ESQ: L_(38), DIR: L_(38) })]])]])]);
}
function exemploReflexo() {
  novoPrograma("seguidor por reflexo (P)", ["base", "Kp", "erro"], [
    f_("var_def", { VAR: L_("erro"), VAL: SUB_(RF_("E"), RF_("D")) }),
    f_("mov_dual", { ESQ: SOMA_(V_("base"), MULT_(V_("Kp"), V_("erro"))), DIR: SUB_(V_("base"), MULT_(V_("Kp"), V_("erro"))) })
  ], [f_("var_def", { VAR: L_("base"), VAL: L_(30) }), f_("var_def", { VAR: L_("Kp"), VAL: L_(0.8) })]);
}
function exemploBorda() {
  novoPrograma("seguidor de borda (1 sensor)", ["base", "Kp", "alvo", "erro"], [
    f_("var_def", { VAR: L_("erro"), VAL: SUB_(V_("alvo"), RF_("D")) }),
    f_("mov_dual", { ESQ: SOMA_(V_("base"), MULT_(V_("Kp"), V_("erro"))), DIR: SUB_(V_("base"), MULT_(V_("Kp"), V_("erro"))) })
  ], [f_("var_def", { VAR: L_("base"), VAL: L_(22) }), f_("var_def", { VAR: L_("Kp"), VAL: L_(0.9) }),
      f_("var_def", { VAR: L_("alvo"), VAL: L_(52) })]);
}
/* ---- PD com as regras da OBR: cruzamento, falso caminho, canto de 90° e verde ---- */
const PRETO_ = p => f_("sen_ecor", { P: L_(p), COR: L_("0") });
const VERDE_ = p => f_("sen_ecor", { P: L_(p), COR: L_("6") });
const OU_ = (a, b) => f_("op_ou", { A: a, B: b }), E_ = (a, b) => f_("op_e", { A: a, B: b });
const MENOR_ = (a, b) => f_("op_menor", { A: a, B: b }), MAIOR_ = (a, b) => f_("op_maior", { A: a, B: b });
const IGUAL_ = (v, x) => f_("op_igual", { A: V_(v), B: L_(x) });
const DEF_ = (v, x) => f_("var_def", { VAR: L_(v), VAL: (x && x.op) ? x : L_(x) });
const MUDA_ = (v, x) => f_("var_muda", { VAR: L_(v), VAL: L_(x) });
const GIRA_ = (dir, rot) => f_("mov_esterco", { DIR: L_(dir), VAL: (rot && rot.op) ? rot : L_(rot), UN: L_("rotations") });
const ANDA_ = (cm, tras) => f_("mov_mover", { DIR: L_(tras ? "back" : "forward"), VAL: L_(cm), UN: L_("cm") });
const SE_ = (c, a) => f_("ctl_se", { COND: c }, [a]);
const SESENAO_ = (c, a, b) => f_("ctl_sesenao", { COND: c }, [a, b]);
const CHAMA_ = n => f_("meu_chama", { NOME: L_(n) });
const CRON_ = () => f_("sen_cron");
const ALGUM_PRETO_ = () => OU_(PRETO_("D"), PRETO_("E"));
function defineBloco(nome, corpo, x, y) {
  PROG.procs.push(nome);
  PROG.scripts.push({ id: novoId(), x, y, pilha: [f_("meu_def", { NOME: L_(nome) })].concat(corpo) });
}
/* gira até um dos sensores achar preto (no máximo uns 120°, para nunca voltar pela linha de onde veio) */
const GIRA_ATE_PRETO_ = dir => [GIRA_(dir, 0.25), DEF_("k", 0),
  f_("ctl_repetir_ate", { COND: OU_(ALGUM_PRETO_(), MAIOR_(V_("k"), L_(20))) }, [[GIRA_(dir, 0.03), MUDA_("k", 1)]])];
/* varre para um lado (7 passos de ~4°); achou linha: fica virado para ela; não achou: volta ao centro */
const VARRE_ = dir => [DEF_("passos", 0),
  f_("ctl_repetir", { N: L_(7) }, [[SE_(IGUAL_("achou", 0), [
    GIRA_(dir, 0.03), MUDA_("passos", 1), SE_(ALGUM_PRETO_(), [DEF_("achou", 1)])])]]),
  SE_(IGUAL_("achou", 0), [GIRA_(-dir, MULT_(L_(0.03), V_("passos")))])];
const OLHA_VERDE_ = () => [SE_(VERDE_("E"), [DEF_("verdeE", 1)]), SE_(VERDE_("D"), [DEF_("verdeD", 1)])];

/* ---- desvio de obstáculo: contorna pela direita num "estádio" e volta para a linha ----
   Obstáculo da OBR: de 3×5 até 10×12 cm, numa reta com 10 cm livres antes e depois.
   Os ângulos vêm do giroscópio; o raio dos arcos sai das velocidades das rodas:
   raio = (vFora + vDentro) / (vFora − vDentro) × metade da distância entre as rodas (7 cm) ≈ 17 cm. */
const DIST_ = () => f_("sen_dist", { P: L_("F"), UN: L_("cm") });
const YAW_ = () => f_("sen_angulo", { EIXO: L_("yaw") });
const DUAL_ = (a, b) => f_("mov_dual", { ESQ: (a && a.op) ? a : L_(a), DIR: (b && b.op) ? b : L_(b) });
const ATE_ = (c, corpo) => f_("ctl_repetir_ate", { COND: c }, [corpo]);
function blocosDesvio() {
  return [
    f_("mov_parar"),
    f_("som_bip", { NOTA: L_(76), SEG: L_(0.15) }),
    /* se viu o obstáculo muito perto (por exemplo, saindo de uma curva), recua até ~14 cm */
    DEF_("k", 0),
    ATE_(OU_(MAIOR_(DIST_(), L_(14)), MAIOR_(V_("k"), L_(150))), [DUAL_(-18, -18), MUDA_("k", 1)]),
    /* chega até ~7 cm do obstáculo seguindo a linha devagar, para ficar alinhado com ela */
    DEF_("k", 0),
    ATE_(OU_(OU_(MENOR_(DIST_(), L_(7)), MAIOR_(DIST_(), L_(25))), MAIOR_(V_("k"), L_(400))), [
      DEF_("erro", SUB_(RF_("E"), RF_("D"))),
      DUAL_(SOMA_(L_(16), MULT_(L_(0.4), V_("erro"))), SUB_(L_(16), MULT_(L_(0.4), V_("erro")))),
      MUDA_("k", 1)]),
    f_("mov_parar"),
    /* se o objeto saiu da frente (era algo fora da linha), não desvia */
    SE_(MENOR_(DIST_(), L_(12)), [
      f_("sen_zerar_ang"),
      /* 1) gira 90° para a direita no lugar */
      ATE_(MAIOR_(YAW_(), L_(86)), [DUAL_(25, -25)]),
      f_("mov_parar"),
      /* 2) ¼ de arco para a esquerda até ficar paralelo à linha */
      ATE_(MENOR_(YAW_(), L_(2)), [DUAL_(V_("vDentro"), V_("vFora"))]),
      /* 3) reto ao lado do obstáculo */
      ANDA_(8),
      /* 4) outro ¼ de arco até achar a linha do outro lado (ou desistir depois de virar demais) */
      ATE_(OU_(E_(ALGUM_PRETO_(), MENOR_(YAW_(), L_(-20))), MENOR_(YAW_(), L_(-150))), [DUAL_(V_("vDentro"), V_("vFora"))]),
      f_("mov_parar"),
      /* 5) põe o eixo em cima da linha, volta ao sentido original e recua um pouco
            (se a linha fizer um canto logo ali, os sensores ainda estão antes dele) */
      ANDA_(5.5),
      ATE_(MAIOR_(YAW_(), L_(-3)), [DUAL_(25, -25)]),
      f_("mov_parar"),
      ANDA_(2.5, true)
    ]),
    f_("mov_parar")
  ];
}

function exemploPD() {
  PROG = { scripts: [], vars: ["base", "Kp", "Kd", "erro", "anterior", "correcao", "lado", "achou", "passos", "k", "verdeE", "verdeD", "vDentro", "vFora"], procs: [] };
  const escuro = p => MENOR_(RF_(p), L_(15));
  PROG.scripts.push({ id: novoId(), x: 40, y: 40, pilha: [
    f_("ev_inicio"), f_("mov_par", { PAR: L_("AB") }), f_("mov_vel", { VAL: L_(30) }),
    DEF_("base", 38), DEF_("Kp", 0.8), DEF_("Kd", 0.4), DEF_("anterior", 0),
    /* velocidades das rodas no contorno do obstáculo (roda de dentro / de fora) */
    DEF_("vDentro", 18), DEF_("vFora", 43), DEF_("resgateFeito", 0), DEF_("contaPrata", 0), f_("sen_zerar_cron"),
    f_("ctl_sempre", {}, [[
      paraNoVermelho(),
      /* fita prata nos dois sensores = entrada da sala de resgate */
      ...blocosVePrata(),
      /* obstáculo a menos de 20 cm no sensor de distância (porta F) */
      SESENAO_(MENOR_(DIST_(), L_(20)), [CHAMA_("desvia_obstaculo")], [
      /* viu verde de frente (o cronômetro evita pegar o verde da curva que acabou de fazer) */
      SESENAO_(E_(OU_(VERDE_("D"), VERDE_("E")), MAIOR_(CRON_(), L_(1))), [CHAMA_("verde_na_frente")], [
        /* preto forte num sensor = linha atravessada (cruzamento, falso caminho ou canto) */
        SESENAO_(E_(OU_(escuro("D"), escuro("E")), MAIOR_(CRON_(), L_(0.5))), [CHAMA_("linha_atravessada")], [
          DEF_("erro", SUB_(RF_("E"), RF_("D"))),
          DEF_("correcao", SOMA_(MULT_(V_("Kp"), V_("erro")), MULT_(V_("Kd"), SUB_(V_("erro"), V_("anterior"))))),
          DEF_("anterior", V_("erro")),
          f_("mov_dual", { ESQ: SOMA_(V_("base"), V_("correcao")), DIR: SUB_(V_("base"), V_("correcao")) })
        ])
      ])
      ])
    ]])
  ] });
  defineBloco("desvia_obstaculo", blocosDesvio().concat([DEF_("anterior", 0)]), 1640, 40);
  defineBloco("linha_atravessada", [
    f_("mov_parar"),
    SESENAO_(E_(escuro("D"), escuro("E")), [DEF_("lado", 0)], [SESENAO_(MENOR_(RF_("D"), RF_("E")), [DEF_("lado", 1)], [DEF_("lado", -1)])]),
    CHAMA_("procura_verde"),
    SESENAO_(OU_(IGUAL_("verdeE", 1), IGUAL_("verdeD", 1)), [
      /* verde ANTES da linha: vira para o lado dele (dois verdes = meia-volta) */
      SESENAO_(E_(IGUAL_("verdeE", 1), IGUAL_("verdeD", 1)), [DEF_("lado", 2)], [SESENAO_(IGUAL_("verdeD", 1), [DEF_("lado", 1)], [DEF_("lado", -1)])]),
      CHAMA_("vira_no_verde")
    ], [
      /* sem verde: passa por cima da linha (e do verde que fica DEPOIS dela) e procura a linha à frente */
      ANDA_(6.8), DEF_("achou", 0)].concat(VARRE_(-100), [
      SE_(IGUAL_("achou", 0), VARRE_(100)),
      /* não tem linha à frente: era um canto de 90°, vira para o lado do preto */
      SE_(IGUAL_("achou", 0), [SESENAO_(IGUAL_("lado", 1), GIRA_ATE_PRETO_(100), GIRA_ATE_PRETO_(-100))])
    ])),
    DEF_("anterior", 0), f_("sen_zerar_cron")
  ], 560, 40);
  defineBloco("procura_verde", [
    /* volta 1,8 cm para ficar em cima da área dos verdes e olha reto, um pouco à esquerda e um pouco à direita */
    DEF_("verdeE", 0), DEF_("verdeD", 0), ANDA_(1.8, true)
  ].concat(OLHA_VERDE_(), [GIRA_(-100, 0.06)], OLHA_VERDE_(), [GIRA_(100, 0.12)], OLHA_VERDE_(), [GIRA_(-100, 0.06)]), 560, 900);
  defineBloco("verde_na_frente", [
    /* só vira com verde confirmado: lado 1 = direita, -1 = esquerda, 2 = os dois (meia-volta), 0 = alarme falso */
    DEF_("lado", 0),
    SE_(VERDE_("D"), [DEF_("lado", 1)]),
    SE_(VERDE_("E"), [SESENAO_(IGUAL_("lado", 1), [DEF_("lado", 2)], [DEF_("lado", -1)])]),
    SE_(f_("op_nao", { A: IGUAL_("lado", 0) }), [
      f_("mov_parar"), ANDA_(1),
      /* anda 1 cm e olha o outro sensor: se ele também estiver no verde, são dois verdes */
      SE_(OU_(E_(IGUAL_("lado", 1), VERDE_("E")), E_(IGUAL_("lado", -1), VERDE_("D"))), [DEF_("lado", 2)]),
      CHAMA_("vira_no_verde"),
      DEF_("anterior", 0), f_("sen_zerar_cron")
    ])
  ], 1100, 40);
  defineBloco("vira_no_verde", [
    /* anda até a linha preta, passa para o meio do cruzamento e vira */
    f_("sen_zerar_cron"),
    f_("ctl_repetir_ate", { COND: OU_(ALGUM_PRETO_(), MAIOR_(CRON_(), L_(2))) }, [[f_("mov_dual", { ESQ: L_(25), DIR: L_(25) })]]),
    ANDA_(4.5),
    SESENAO_(IGUAL_("lado", 2), [GIRA_(100, 1.26)], [SESENAO_(IGUAL_("lado", 1), GIRA_ATE_PRETO_(100), GIRA_ATE_PRETO_(-100))]),
    f_("sen_zerar_cron")
  ], 1100, 700);
  blocosResgate(2200, 40);
  $("tagProj").textContent = "seguidor PD OBR";
}
/* ---- programas guardados neste navegador ---- */
const CHAVE_PROGS = "bancadaOBR.progs" + (PLAT.id === "spike" ? "" : "." + PLAT.id);
function lerProgs() { try { return JSON.parse(localStorage.getItem(CHAVE_PROGS) || "null"); } catch (e) { return null; } }
function gravaProgs(l) { try { localStorage.setItem(CHAVE_PROGS, JSON.stringify(l)); return true; } catch (e) { return false; } }
let MEUS = lerProgs() || [];
function listaMeus() {
  const g = $("grpMeus"); g.innerHTML = "";
  MEUS.forEach((m, i) => { const o = document.createElement("option"); o.value = "meu:" + i; o.textContent = m.nome; g.appendChild(o); });
  g.hidden = !MEUS.length;
}
function usaPrograma(prog, tag) {
  PROG = JSON.parse(JSON.stringify(prog));
  let mx = SEQ;
  (function varre(arr) { for (const b of arr) { const n = parseInt(String(b.id).slice(1)); if (n > mx) mx = n;
    for (const k in b.a) if (b.a[k] && b.a[k].op) varre([b.a[k]]); for (const sub of b.c) varre(sub); } })(PROG.scripts.flatMap(x => x.pilha));
  PROG.scripts.forEach(x => { const n = parseInt(String(x.id).slice(1)); if (n > mx) mx = n; });
  SEQ = mx + 1;
  $("tagProj").textContent = tag;
}
function abreGuarda() {
  const b = $("guardaBox"), inp = $("guardaNome");
  inp.value = $("tagProj").textContent.trim() || "meu programa";
  b.hidden = false; confereNome(); inp.focus(); inp.select();
}
function confereNome() {
  const n = $("guardaNome").value.trim(), k = MEUS.findIndex(m => m.nome === n);
  $("guardaAviso").textContent = k >= 0 ? "Já existe um programa com esse nome: ele será substituído." : "";
  $("guardaApagar").hidden = k < 0;
}
$("guardaNome").oninput = confereNome;
$("guardaCancela").onclick = () => { $("guardaBox").hidden = true; };
$("guardaBox").onkeydown = e => { if (e.key === "Escape") { e.stopPropagation(); $("guardaBox").hidden = true; } };
$("guardaApagar").onclick = () => {
  const n = $("guardaNome").value.trim();
  MEUS = MEUS.filter(m => m.nome !== n); gravaProgs(MEUS); listaMeus();
  $("guardaBox").hidden = true; registra("Programa \"" + n + "\" apagado dos guardados.");
};
$("guardaBox").onsubmit = e => {
  e.preventDefault();
  const n = $("guardaNome").value.trim(); if (!n) return;
  const item = { nome: n, prog: JSON.parse(JSON.stringify(PROG)), quando: Date.now() };
  const k = MEUS.findIndex(m => m.nome === n);
  if (k >= 0) MEUS[k] = item; else MEUS.push(item);
  if (!gravaProgs(MEUS)) { registra("Não consegui guardar: o navegador bloqueou o armazenamento."); return; }
  listaMeus(); $("tagProj").textContent = n; salvaDepois();
  $("guardaBox").hidden = true; registra("Programa guardado: \"" + n + "\". Ele fica em Programas… → Guardados.");
};
/* na primeira vez, deixa o PD ajustado já guardado */
const NOME_SAMURAI = "Samurai OBR 2026 v12";
/* o Samurai da equipe (SPIKE). Na v12 a fita prata é achada pelo valor bruto do vermelho, como no robô de verdade:
   a luz refletida da prata é igual à do branco. O resgate entra na versão atual do gerador. */
function carregaSamurai() {
  importaProjeto(EMBUTIDO, NOME_SAMURAI);
  blocosResgate();
  const s = PROG.scripts.find(q => q.pilha[0] && q.pilha[0].op === "meu_def" && q.pilha[0].a.NOME.lit === "checa_cinza");
  let trocas = 0;
  const ehRef = (x, cmp, v) => x && x.op === cmp && x.a.A && x.a.A.op === "sen_reflexo" && x.a.B && String(x.a.B.lit) === v;
  (function varre(b) {
    if (!b || typeof b !== "object") return;
    for (const k in b.a) {
      const v = b.a[k];
      if (v && v.op === "op_e" && ehRef(v.a.A, "op_maior", "58") && ehRef(v.a.B, "op_menor", "84")) {
        b.a[k] = PRATA_(v.a.A.a.A.a.P.lit); trocas++;
      } else if (v && v.op) varre(v);
    }
    for (const sub of (b.c || [])) sub.forEach(varre);
  })(s ? { a: {}, c: [s.pilha] } : null);
  if (PROG.vars.indexOf("contaPrata") < 0) PROG.vars.push("contaPrata");
  montaPaleta(); desenhaBlocos();
  return trocas;
}
const NOME_PD_GUARDADO = "Seguidor PD OBR (cruzamentos, verdes, obstáculo e resgate)";
const VERSAO_PD = 3;   /* sobe a cada mudança no PD de exemplo: o guardado é trocado pelo novo */
function semeiaGuardados() {
  const lista = lerProgs();
  /* troca o PD guardado sempre que sai uma versão nova dele */
  const velho = lista ? lista.findIndex(m => m.nome === "Seguidor PD (base 38 · Kp 0,8 · Kd 0,4)" ||
    (/^Seguidor PD OBR \(cruzamentos/.test(m.nome) && m.versaoPD !== VERSAO_PD)) : -1;
  if (lista && velho < 0) return;
  const antes = PROG, tag = $("tagProj").textContent;
  exemploPD(); traduzPrograma(PROG);
  const item = { nome: NOME_PD_GUARDADO, prog: JSON.parse(JSON.stringify(PROG)), quando: Date.now(), versaoPD: VERSAO_PD };
  PROG = antes; $("tagProj").textContent = tag;
  if (lista) { lista[velho] = item; MEUS = lista; } else MEUS = [item];   /* troca o PD antigo pelo novo */
  gravaProgs(MEUS);
}
$("selExemplo").onchange = e => {
  const v = e.target.value; e.target.value = "";
  if (!v || TESTANDO) return;
  if (v === "#guardar") { abreGuarda(); return; }
  RODANDO = false;
  if (v === "samurai") { if (PLAT.id !== "spike") return; carregaSamurai(); arrumaPilhas(); salvaDepois(); return; }
  if (v.startsWith("meu:")) {
    const m = MEUS[+v.slice(4)]; if (!m) return;
    usaPrograma(m.prog, m.nome);
  } else { ({ cor: exemploSeguidor, reflexo: exemploReflexo, borda: exemploBorda, pd: exemploPD })[v](); traduzPrograma(PROG); }
  ZOOM = 1; PANX = 40; PANY = 40;
  montaPaleta(); arrumaPilhas(); reinicia(); salvaDepois();
  registra("Programa carregado: " + $("tagProj").textContent + ". Aperte Rodar.");
};
