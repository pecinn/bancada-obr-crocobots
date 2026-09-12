
/* =======================================================================
   8. INTERPRETADOR
   ======================================================================= */
let VARS = {}, PROCS = {}, FIOS = [], RODANDO = false, PAUSADO = false, ATUAL = null;
let PARADO_POR = "", TESTANDO = false;
/* o que o hub mostra: matriz 5x5, cor do botao, balao de texto */
const MATRIZ = new Array(25).fill(0);
const CARINHA = [0,0,0,0,0, 0,1,0,1,0, 0,0,0,0,0, 1,0,0,0,1, 0,1,1,1,0];
let BOTAO = "6", BALAO = null, MATRIZ_MUDOU = true;
function carinha() { for (let i = 0; i < 25; i++) MATRIZ[i] = CARINHA[i] * 100; MATRIZ_MUDOU = true; }

const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
function aval(v) {
  if (v === null || v === undefined) return 0;
  if (v.lit !== undefined) return v.lit;
  return avaliaBloco(v);
}
function compara(a, cmp, b) { return cmp === "<" ? a < b : cmp === ">" ? a > b : Math.abs(a - b) < 0.5; }
function avaliaBloco(b) {
  const A = () => aval(b.a.A), Bv = () => aval(b.a.B);
  switch (b.op) {
    case "op_soma": return num(A()) + num(Bv());
    case "op_sub":  return num(A()) - num(Bv());
    case "op_mult": return num(A()) * num(Bv());
    case "op_div":  return num(Bv()) === 0 ? 0 : num(A()) / num(Bv());
    case "op_mod":  return num(Bv()) === 0 ? 0 : num(A()) % num(Bv());
    case "op_arred":return Math.round(num(A()));
    case "op_aleatorio": return Math.floor(num(A()) + Math.random() * (num(Bv()) - num(A()) + 1));
    case "op_menor": return num(A()) < num(Bv());
    case "op_maior": return num(A()) > num(Bv());
    case "op_igual": return String(A()) === String(Bv()) || num(A()) === num(Bv());
    case "op_e":  return !!aval(b.a.A) && !!aval(b.a.B);
    case "op_ou": return !!aval(b.a.A) || !!aval(b.a.B);
    case "op_nao":return !aval(b.a.A);
    case "var_ler": { const v = VARS[aval(b.a.VAR)]; return v === undefined ? 0 : v; }
    case "sen_cor":     return corDeSensor(aval(b.a.P));
    case "sen_reflexo": return reflexoDe(aval(b.a.P));
    case "sen_ereflexo":return compara(reflexoDe(aval(b.a.P)), aval(b.a.CMP), num(aval(b.a.VAL)));
    case "sen_cru":     return cruDe(aval(b.a.P), aval(b.a.CANAL));
    case "sen_ecor":    return corDeSensor(aval(b.a.P)) === String(aval(b.a.COR));
    case "sen_dist": {
      const d = distanciaFrente(), u = aval(b.a.UN);
      return u === "inches" ? +(d / 2.54).toFixed(1) : u === "%" ? Math.round(d / 2) : Math.round(d);
    }
    case "sen_edist": {
      let d = distanciaFrente(); const u = aval(b.a.UN);
      if (u === "inches") d /= 2.54; else if (u === "%") d /= 2;
      return compara(d, aval(b.a.CMP), num(aval(b.a.VAL)));
    }
    case "sen_forca":  return forcaAgora() > 0;
    case "sen_forcar": return forcaAgora();
    case "sen_angulo": {
      const e = aval(b.a.EIXO);
      if (e === "pitch") return Math.round(R.pitch * 180 / Math.PI);
      if (e === "roll")  return Math.round(R.roll * 180 / Math.PI);
      let y = R.yaw % 360; if (y > 180) y -= 360; if (y < -180) y += 360;
      return Math.round(y);
    }
    case "sen_inclinado": {
      const o = aval(b.a.O), p = R.pitch * 180 / Math.PI, rr = R.roll * 180 / Math.PI;
      if (o === "frente") return p > 12; if (o === "tras") return p < -12;
      if (o === "esq") return rr > 12;   if (o === "dir") return rr < -12;
      return Math.abs(p) < 12 && Math.abs(rr) < 12;
    }
    case "sen_cron":  return +R.cron.toFixed(2);
    case "mot_pos":   { const m = MOT[aval(b.a.P)]; return m ? Math.round(m.pos) % 360 : 0; }
    case "mot_velr":  { const m = MOT[aval(b.a.P)]; return m ? Math.round(m.real) : 0; }
    default: return 0;
  }
}

function velPar(esq, dir) {
  const e = PAR_MOV[0], d = PAR_MOV[1];
  if (MOT[e]) MOT[e].vel = Math.max(-100, Math.min(100, esq));
  if (MOT[d]) MOT[d].vel = Math.max(-100, Math.min(100, dir));
}
function paraPar() { velPar(0, 0); }
function velDeDirecao(dir) {
  const v = VEL_MOV;
  if (dir === "forward") return [v, v];
  if (dir === "back" || dir === "backward") return [-v, -v];
  if (dir === "left") return [-v, v];
  return [v, -v];
}
function velDeEsterco(s) {
  const v = VEL_MOV, k = Math.max(-100, Math.min(100, num(s)));
  if (k >= 0) return [v, v * (1 - 2 * k / 100)];
  return [v * (1 + 2 * k / 100), v];
}
function paraCm(valor, un) {
  const n = num(valor);
  if (un === "cm") return n;
  if (un === "inches") return n * 2.54;
  if (un === "rotations") return n * circCm();
  if (un === "degrees") return n / 360 * circCm();
  return n;
}
/* anda ate o hub contar a distancia pedida (pelos encoders: velocidade real dos motores) */
function* andaAte(distAlvo, segundos) {
  let feito = 0, t = 0, guarda = 0;
  const e = PAR_MOV[0], d = PAR_MOV[1];
  while (guarda++ < 60000) {
    if (segundos !== null) { if (t >= segundos) break; }
    else { if (feito >= distAlvo) break; }
    yield;
    const ve = (MOT[e] ? MOT[e].real : 0), vd = (MOT[d] ? MOT[d].real : 0);
    feito += (Math.abs(ve) + Math.abs(vd)) / 2 * cmPorPct() * DT; t += DT;
  }
  paraPar();
}

/* ---- som de verdade ---- */
let AUDIO = null, SOM = true;
function bipe(nota, seg, vol) {
  if (!SOM || TESTANDO) return;
  try {
    AUDIO = AUDIO || new (window.AudioContext || window.webkitAudioContext)();
    const o = AUDIO.createOscillator(), g = AUDIO.createGain(), t0 = AUDIO.currentTime;
    o.type = "square"; o.frequency.value = 440 * Math.pow(2, (num(nota) - 69) / 12);
    const dur = Math.max(0.03, Math.min(2, num(seg) / Math.max(1, velSim())));
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol || 0.06, t0 + 0.01);
    g.gain.setValueAtTime(vol || 0.06, t0 + dur - 0.02); g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g); g.connect(AUDIO.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (e) {}
}

function* execBloco(b) {
  ATUAL = b.id;
  const A = n => aval(b.a[n]);
  switch (b.op) {
    case "mov_par": PAR_MOV = String(A("PAR")).replace("+", "").toUpperCase(); break;
    case "mov_vel": VEL_MOV = num(A("VAL")); break;
    case "mov_rot": break;
    case "mov_iniciar": { const [e, d] = velDeDirecao(A("DIR")); velPar(e, d); break; }
    case "mov_iniciar_esterco": { const [e, d] = velDeEsterco(A("DIR")); velPar(e, d); break; }
    case "mov_dual": velPar(num(A("ESQ")), num(A("DIR"))); break;
    case "mov_parar": paraPar(); break;
    case "mov_mover": {
      const [e, d] = velDeDirecao(A("DIR")); velPar(e, d);
      const un = A("UN");
      yield* andaAte(paraCm(A("VAL"), un), un === "seconds" ? num(A("VAL")) : null);
      break;
    }
    case "mov_esterco": {
      const [e, d] = velDeEsterco(A("DIR")); velPar(e, d);
      const un = A("UN");
      yield* andaAte(paraCm(A("VAL"), un), un === "seconds" ? num(A("VAL")) : null);
      break;
    }
    case "mot_vel": { const m = MOT[A("P")]; if (m) m.cfg = num(A("VAL")); break; }
    case "mot_iniciar": {
      const m = MOT[A("P")]; if (m) m.vel = (A("SENT") === "clockwise" ? 1 : -1) * (m.cfg === undefined ? 75 : m.cfg);
      break;
    }
    case "mot_parar": { const m = MOT[A("P")]; if (m) m.vel = 0; break; }
    case "mot_zerar": { const m = MOT[A("P")]; if (m) m.pos = 0; break; }
    case "mot_girar": {
      const p = A("P"), m = MOT[p]; if (!m) break;
      const s = (A("SENT") === "clockwise" ? 1 : -1), v = (m.cfg === undefined ? 75 : m.cfg);
      m.vel = s * v;
      const un = A("UN"), n = num(A("VAL"));
      let segs = un === "seconds" ? n : (un === "rotations" ? n : n / 360) / (Math.abs(v) / 100 * 2.5);
      let t = 0; while (t < segs) { t += DT; yield; }
      m.vel = 0; break;
    }
    case "mot_ir": {
      const m = MOT[A("P")]; if (!m) break;
      /* gira até a posição pedida; se travar (pá contra a parede), desiste depois de 2 s */
      m.alvo = num(A("VAL")); m.travou = false; let t = 0;
      while (m.alvo !== undefined && !m.travou && t < 2) { t += DT; yield; }
      m.alvo = undefined; break;
    }
    case "luz_texto": {
      const tx = String(A("TXT"));
      if (!TESTANDO) { registra("tela: " + tx); BALAO = { t: tx, ate: R.t + 2.5 }; }
      break;
    }
    case "luz_limpar": MATRIZ.fill(0); MATRIZ_MUDOU = true; break;
    case "luz_pixel": {
      const x = Math.round(num(A("X"))) - 1, y = Math.round(num(A("Y"))) - 1;
      if (x >= 0 && x < 5 && y >= 0 && y < 5) { MATRIZ[y * 5 + x] = Math.max(0, Math.min(100, num(A("B")))); MATRIZ_MUDOU = true; }
      break;
    }
    case "luz_cor": BOTAO = String(A("COR")); MATRIZ_MUDOU = true; break;
    case "som_bip": bipe(A("NOTA"), A("SEG")); { let t = 0; const s = num(A("SEG")); while (t < s) { t += DT; yield; } } break;
    case "sen_zerar_ang": R.yaw0 = R.th; R.yaw = 0; break;
    case "sen_zerar_cron": R.cron = 0; break;
    case "ctl_esperar": { let t = 0; const s = num(A("SEG")); while (t < s) { t += DT; yield; } break; }
    case "ctl_repetir": {
      const n = Math.floor(num(A("N")));
      for (let i = 0; i < n; i++) { yield* execPilha(b.c[0]); yield; }
      break;
    }
    case "ctl_sempre": { let g = 0; while (g++ < 400000) { yield* execPilha(b.c[0]); yield; } break; }
    case "ctl_se": if (aval(b.a.COND)) yield* execPilha(b.c[0]); break;
    case "ctl_sesenao": if (aval(b.a.COND)) yield* execPilha(b.c[0]); else yield* execPilha(b.c[1]); break;
    case "ctl_esperar_ate": { let g = 0; while (!aval(b.a.COND) && g++ < 400000) yield; break; }
    case "ctl_repetir_ate": { let g = 0; while (!aval(b.a.COND) && g++ < 400000) { yield* execPilha(b.c[0]); yield; } break; }
    case "ctl_parar":
      if (A("ALVO") === "this script") throw { fim: "script" };
      paraPar(); PARADO_POR = "bloco parar"; throw { fim: "tudo" };
    case "var_def": VARS[A("VAR")] = A("VAL"); break;
    case "var_muda": VARS[A("VAR")] = num(VARS[A("VAR")]) + num(A("VAL")); break;
    case "meu_chama": {
      const p = PROCS[A("NOME")];
      if (p) { if (p.rodando > 12) break; p.rodando = (p.rodando || 0) + 1; yield* execPilha(p.corpo); p.rodando--; }
      break;
    }
    default: break;
  }
}
function* execPilha(arr) { for (const b of arr) yield* execBloco(b); }

let DONO = {}, ULTDONO = "";
function mapeiaDono() {
  DONO = {};
  for (const n in PROCS) (function varre(arr) {
    for (const b of arr) {
      DONO[b.id] = n;
      for (const k in b.a) if (b.a[k] && b.a[k].op) varre([b.a[k]]);
      for (const s of b.c) varre(s);
    }
  })(PROCS[n].corpo);
}
function prepara() {
  VARS = {}; PROCS = {}; FIOS = []; ATUAL = null; PARADO_POR = ""; ULTDONO = "";
  for (const v of PROG.vars) VARS[v] = 0;
  for (const s of PROG.scripts) {
    const h = s.pilha[0]; if (!h) continue;
    if (h.op === "meu_def") PROCS[aval(h.a.NOME)] = { corpo: s.pilha.slice(1), rodando: 0 };
  }
  mapeiaDono();
}
function comeca(gatilho) {
  prepara();
  for (const s of PROG.scripts) {
    const h = s.pilha[0]; if (!h) continue;
    if (h.op === gatilho) FIOS.push({ g: execPilha(s.pilha.slice(1)), vivo: true });
  }
  if (!FIOS.length) { registra("Nenhum bloco 'quando o programa iniciar' encontrado."); return false; }
  novaCorrida();
  return true;
}
function umPasso() {
  let algum = false;
  for (const f of FIOS) {
    if (!f.vivo) continue;
    try { const r = f.g.next(); if (r.done) f.vivo = false; else algum = true; }
    catch (err) {
      f.vivo = false;
      if (err && err.fim === "tudo") { FIOS.forEach(x => x.vivo = false); }
      else if (!err || !err.fim) { registra("Erro: " + (err && err.message ? err.message : err)); }
    }
  }
  passoFisica();
  if (!TESTANDO) gravaAmostra();
  if (!TESTANDO && document.getElementById("chkRastro").checked) {
    const q = DONO[ATUAL] || "(programa principal)";
    if (q !== ULTDONO) {
      ULTDONO = q;
      registra(R.t.toFixed(2) + "s  " + q + "   em " + R.x.toFixed(0) + "," + R.y.toFixed(0) +
        "  " + portasDe("cor").map(p => p + "=" + nomeCor(corDeSensor(p)) + "/" + reflexoDe(p)).join(" "));
    }
  }
  if (avaliaCorrida() === "fim") {
    FIOS.forEach(x => x.vivo = false);
    PARADO_POR = CORRIDA.fimMotivo;
  }
  if (!FIOS.some(f => f.vivo)) {
    paraPar();
    /* o programa acabou em cima da faixa vermelha: o juiz ainda conta os 5 s */
    const C = CORRIDA;
    if (C && C.naChegada && !C.completou) {
      if (C.fimProg === null) C.fimProg = R.t;
      /* conta os 5 s a partir de quando o robô parou de verdade (com inércia ele ainda desliza um pouco) */
      if (R.t - C.fimProg < 12 && (C.paradoDesde === null || R.t - C.paradoDesde < 5.3)) return algum;
    }
    RODANDO = false; if (!PARADO_POR) PARADO_POR = "programa terminou";
  }
  return algum;
}
