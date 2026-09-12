/* =======================================================================
   11. EXPORTAR: dos blocos da bancada de volta para o formato do SPIKE
   ======================================================================= */
let SEQX = 0;
const idx = () => "x" + (++SEQX).toString().padStart(4, "0");

/* tabela de saida: para cada bloco da bancada, o opcode do SPIKE,
   as entradas e os campos. sel = menu-sombra, val = valor, fld = campo fixo. */
const SAIDA = {
  ev_inicio:  { op:"flipperevents_whenProgramStarts" },
  ev_botao:   { op:"flipperevents_whenButton" },

  mov_par:    { op:"flippermove_setMovementPair",
                sel:{ PAIR:["flippermove_movement-port-selector","PAR"] } },
  mov_mover:  { op:"flippermove_move",
                sel:{ DIRECTION:["flippermove_custom-icon-direction","DIR"] },
                val:{ VALUE:["VAL",4] }, fld:{ UNIT:"UN" } },
  mov_iniciar:{ op:"flippermove_startMove",
                sel:{ DIRECTION:["flippermove_custom-icon-direction","DIR"] } },
  mov_esterco:{ op:"flippermove_steer",
                sel:{ STEERING:["flippermove_rotation-wheel","DIR"] },
                val:{ VALUE:["VAL",4] }, fld:{ UNIT:"UN" } },
  mov_iniciar_esterco:{ op:"flippermove_startSteer",
                sel:{ STEERING:["flippermove_rotation-wheel","DIR"] } },
  mov_dual:   { op:"flippermoremove_startDualSpeed", val:{ LEFT:["ESQ",4], RIGHT:["DIR",4] } },
  mov_parar:  { op:"flippermove_stopMove" },
  mov_vel:    { op:"flippermove_movementSpeed", val:{ SPEED:["VAL",4] } },
  mov_rot:    { op:"flippermove_setDistance", val:{ DISTANCE:["VAL",4] } },

  mot_girar:  { op:"flippermotor_motorTurnForDirection",
                sel:{ PORT:["flippermotor_multiple-port-selector","P"] },
                val:{ VALUE:["VAL",4] }, fld:{ DIRECTION:"SENT", UNIT:"UN" } },
  mot_iniciar:{ op:"flippermotor_motorStartDirection",
                sel:{ PORT:["flippermotor_multiple-port-selector","P"] }, fld:{ DIRECTION:"SENT" } },
  mot_parar:  { op:"flippermotor_motorStop", sel:{ PORT:["flippermotor_multiple-port-selector","P"] } },
  mot_vel:    { op:"flippermotor_motorSetSpeed",
                sel:{ PORT:["flippermotor_multiple-port-selector","P"] }, val:{ SPEED:["VAL",4] } },
  mot_ir:     { op:"flippermotor_motorGoDirectionToPosition",
                sel:{ PORT:["flippermotor_multiple-port-selector","P"] }, val:{ POSITION:["VAL",4] } },
  mot_zerar:  { op:"flippermotor_motorSetDegreeCounted",
                sel:{ PORT:["flippermotor_multiple-port-selector","P"] } },
  mot_pos:    { op:"flippermotor_absolutePosition", sel:{ PORT:["flippermotor_single-port-selector","P"] } },
  mot_velr:   { op:"flippermotor_speed", sel:{ PORT:["flippermotor_single-port-selector","P"] } },

  luz_texto:  { op:"flipperdisplay_ledText", val:{ TEXT:["TXT",10] } },
  luz_limpar: { op:"flipperdisplay_displayOff" },
  luz_pixel:  { op:"flipperdisplay_ledOn", val:{ X:["X",4], Y:["Y",4], BRIGHTNESS:["B",4] } },
  luz_cor:    { op:"flipperdisplay_centerButtonLight",
                sel:{ COLOR:["flipperdisplay_color-selector","COR"] } },
  som_bip:    { op:"flippersound_beepForTime", val:{ NOTE:["NOTA",4], DURATION:["SEG",4] } },

  sen_ecor:   { op:"flippersensors_isColor",
                sel:{ PORT:["flippersensors_color-sensor-selector","P"],
                      VALUE:["flippersensors_color-selector","COR"] } },
  sen_cor:    { op:"flippersensors_color", sel:{ PORT:["flippersensors_color-sensor-selector","P"] } },
  sen_reflexo:{ op:"flippersensors_reflectivity", sel:{ PORT:["flippersensors_color-sensor-selector","P"] } },
  sen_ereflexo:{ op:"flippersensors_isReflectivity", sel:{ PORT:["flippersensors_color-sensor-selector","P"] },
                val:{ VALUE:["VAL",4] }, fld:{ COMPARATOR:"CMP" } },
  sen_cru:    { op:"flippersensors_rawColor", sel:{ PORT:["flippersensors_color-sensor-selector","P"] },
                canal:true },
  sen_edist:  { op:"flippersensors_isDistance",
                sel:{ PORT:["flippersensors_distance-sensor-selector","P"] },
                val:{ VALUE:["VAL",4] }, fld:{ COMPARATOR:"CMP", UNIT:"UN" } },
  sen_dist:   { op:"flippersensors_distance",
                sel:{ PORT:["flippersensors_distance-sensor-selector","P"] }, fld:{ UNIT:"UN" } },
  sen_forca:  { op:"flippersensors_isPressed", sel:{ PORT:["flippersensors_force-sensor-selector","P"] } },
  sen_forcar: { op:"flippersensors_force", sel:{ PORT:["flippersensors_force-sensor-selector","P"] } },
  sen_angulo: { op:"flippersensors_orientationAxis", fld:{ AXIS:"EIXO" } },
  sen_zerar_ang:{ op:"flippersensors_resetYaw" },
  sen_cron:   { op:"flippersensors_timer" },
  sen_zerar_cron:{ op:"flippersensors_resetTimer" },

  ctl_esperar:{ op:"control_wait", val:{ DURATION:["SEG",5] } },
  ctl_repetir:{ op:"control_repeat", val:{ TIMES:["N",6] }, sub:["SUBSTACK"] },
  ctl_sempre: { op:"control_forever", sub:["SUBSTACK"] },
  ctl_se:     { op:"control_if", bool:{ CONDITION:"COND" }, sub:["SUBSTACK"] },
  ctl_sesenao:{ op:"control_if_else", bool:{ CONDITION:"COND" }, sub:["SUBSTACK","SUBSTACK2"] },
  ctl_esperar_ate:{ op:"control_wait_until", bool:{ CONDITION:"COND" } },
  ctl_repetir_ate:{ op:"control_repeat_until", bool:{ CONDITION:"COND" }, sub:["SUBSTACK"] },
  ctl_parar:  { op:"control_stop", fld:{ STOP_OPTION:"ALVO" }, semNext:true },

  op_soma:    { op:"operator_add",      val:{ NUM1:["A",4], NUM2:["B",4] } },
  op_sub:     { op:"operator_subtract", val:{ NUM1:["A",4], NUM2:["B",4] } },
  op_mult:    { op:"operator_multiply", val:{ NUM1:["A",4], NUM2:["B",4] } },
  op_div:     { op:"operator_divide",   val:{ NUM1:["A",4], NUM2:["B",4] } },
  op_mod:     { op:"operator_mod",      val:{ NUM1:["A",4], NUM2:["B",4] } },
  op_arred:   { op:"operator_round",    val:{ NUM:["A",4] } },
  op_aleatorio:{op:"operator_random",   val:{ FROM:["A",4], TO:["B",4] } },
  op_menor:   { op:"operator_lt",     val:{ OPERAND1:["A",10], OPERAND2:["B",10] } },
  op_maior:   { op:"operator_gt",     val:{ OPERAND1:["A",10], OPERAND2:["B",10] } },
  op_igual:   { op:"operator_equals", val:{ OPERAND1:["A",10], OPERAND2:["B",10] } },
  op_e:       { op:"operator_and", bool:{ OPERAND1:"A", OPERAND2:"B" } },
  op_ou:      { op:"operator_or",  bool:{ OPERAND1:"A", OPERAND2:"B" } },
  op_nao:     { op:"operator_not", bool:{ OPERAND:"A" } },

  var_def:    { op:"data_setvariableto",    val:{ VALUE:["VAL",10] }, varf:"VAR" },
  var_muda:   { op:"data_changevariableby", val:{ VALUE:["VAL",4]  }, varf:"VAR" }
};

function exportaProjeto(nome) {
  SEQX = 0;
  const B = {};
  const avisos = [];
  const usados = new Set();
  const idVar = {};
  for (const v of PROG.vars) idVar[v] = "var_" + v;

  function novo(op, pai) {
    const id = idx();
    B[id] = { opcode: op, next: null, parent: pai || null, inputs: {}, fields: {},
              shadow: false, topLevel: false };
    usados.add(op.split("_")[0]);
    return id;
  }
  function sombra(op, valor, pai) {
    const id = idx();
    B[id] = { opcode: op, next: null, parent: pai, inputs: {}, fields: {}, shadow: true, topLevel: false };
    B[id].fields["field_" + op] = [String(valor), null];
    usados.add(op.split("_")[0]);
    return id;
  }
  /* um argumento: literal, variavel ou outro bloco */
  function entrada(bloco, valor, tipo, pai) {
    if (valor && valor.op) {
      if (valor.op === "var_ler") return [3, [12, aval2(valor.a.VAR), idVar[aval2(valor.a.VAR)] || "var_" + aval2(valor.a.VAR)], [tipo, ""]];
      return [3, emite(valor, pai), [tipo, ""]];
    }
    return [1, [tipo, valor ? String(valor.lit) : ""]];
  }
  const aval2 = v => (v && v.lit !== undefined) ? v.lit : "";

  function emite(b, pai) {
    const sp = SAIDA[b.op];
    if (b.op === "meu_chama") {
      const id = novo("procedures_call", pai);
      B[id].mutation = { tagName:"mutation", children:[], proccode: aval2(b.a.NOME),
                         argumentids:"[]", warp:"false" };
      return id;
    }
    if (b.op === "desconhecido") {
      const id = novo(b.origem || "control_wait", pai);
      avisos.push("bloco não convertido: " + (b.origem || "?"));
      return id;
    }
    if (!sp) { avisos.push("sem tradução: " + b.op); return novo("control_wait", pai); }

    const op = (b.op === "sen_cru" && b.origem) ? b.origem : sp.op;
    const id = novo(op, pai);
    if (sp.canal && !b.origem) avisos.push("valor bruto (o nome do bloco no SPIKE não foi confirmado)");
    if (sp.sel) for (const k in sp.sel) {
      const [selOp, arg] = sp.sel[k];
      B[id].inputs[k] = [1, sombra(selOp, aval2(b.a[arg]), id)];
    }
    if (sp.val) for (const k in sp.val) {
      const [arg, tipo] = sp.val[k];
      B[id].inputs[k] = entrada(b, b.a[arg], tipo, id);
    }
    if (sp.bool) for (const k in sp.bool) {
      const v = b.a[sp.bool[k]];
      if (v && v.op) B[id].inputs[k] = [2, emite(v, id)];
    }
    if (sp.fld) for (const k in sp.fld) B[id].fields[k] = [String(aval2(b.a[sp.fld[k]])), null];
    if (sp.varf) {
      const n = aval2(b.a[sp.varf]);
      B[id].fields.VARIABLE = [n, idVar[n] || "var_" + n];
    }
    if (sp.canal) {
      const c = aval2(b.a.CANAL);
      B[id].fields.CHANNEL = [c === "g" ? "green" : c === "b" ? "blue" : "red", null];
    }
    if (sp.sub) sp.sub.forEach((k, i) => {
      const p = corrente(b.c[i] || [], id);
      if (p) B[id].inputs[k] = [2, p];
    });
    return id;
  }
  function corrente(arr, pai) {
    let primeiro = null, ant = null;
    for (const b of arr) {
      const id = emite(b, ant || pai);
      if (ant) B[ant].next = id; else primeiro = id;
      ant = id;
    }
    return primeiro;
  }

  /* --- os scripts --- */
  for (const s of PROG.scripts) {
    const cabeca = s.pilha[0];
    if (!cabeca) continue;
    if (cabeca.op === "meu_def") {
      const def = novo("procedures_definition", null);
      B[def].topLevel = true; B[def].x = Math.round(s.x); B[def].y = Math.round(s.y);
      const proto = idx();
      B[proto] = { opcode:"procedures_prototype", next:null, parent:def, inputs:{}, fields:{},
                   shadow:true, topLevel:false,
                   mutation:{ tagName:"mutation", children:[], proccode: aval2(cabeca.a.NOME),
                              argumentids:"[]", argumentnames:"[]", argumentdefaults:"[]", warp:"false" } };
      B[def].inputs.custom_block = [1, proto];
      const p = corrente(s.pilha.slice(1), def);
      if (p) B[def].next = p;
    } else {
      const topo = emite(cabeca, null);
      B[topo].topLevel = true; B[topo].x = Math.round(s.x); B[topo].y = Math.round(s.y);
      const p = corrente(s.pilha.slice(1), topo);
      if (p) B[topo].next = p;
    }
  }

  const variaveis = {};
  for (const v of PROG.vars) variaveis[idVar[v]] = [v, 0];
  const traje = { assetId:"d41d8cd98f00b204e9800998ecf8427e", name:"costume1", bitmapResolution:1,
                  md5ext:"d41d8cd98f00b204e9800998ecf8427e.svg", dataFormat:"svg",
                  rotationCenterX:47, rotationCenterY:55 };
  /* as cinco que os projetos do SPIKE sempre trazem, mais as que o programa usar */
  const exts = ["flipperevents","flippermove","flippersensors","flippermoremove","flippercontrol"];
  for (const e of ["flippermotor","flipperdisplay","flippersound"]) if (usados.has(e)) exts.push(e);
  const proj = {
    targets: [
      { isStage:true, name:"Stage", variables:{}, lists:{}, broadcasts:{}, blocks:{}, comments:{},
        currentCostume:0, costumes:[Object.assign({}, traje, {name:"backdrop1"})], sounds:[],
        volume:0, tempo:60, videoTransparency:50, videoState:"on", textToSpeechLanguage:null },
      { isStage:false, name:"Robo", variables:variaveis, lists:{}, broadcasts:{}, blocks:B, comments:{},
        currentCostume:0, costumes:[traje], sounds:[], volume:0, visible:true,
        x:0, y:0, size:100, direction:90, draggable:false, rotationStyle:"all around" }
    ],
    monitors: [], extensions: exts,
    meta: { semver:"3.0.0", vm:"0.2.0-prerelease.20200512204241", agent:"Bancada OBR" }
  };
  return { proj, avisos, nome: nome || "programa" };
}

/* ---- baixar ---- */
let BAIXAR = undefined;
async function achaBaixar() {
  if (BAIXAR !== undefined) return BAIXAR;
  BAIXAR = null;
  try { if (window.claude && window.claude.use) BAIXAR = await window.claude.use("downloads"); } catch (e) {}
  return BAIXAR;
}
async function baixaPrograma() {
  const nome = (document.getElementById("tagProj").textContent || "programa")
               .replace(/[^\w \-.]/g, "").trim() || "programa";
  let r;
  try { r = exportaProjeto(nome); }
  catch (e) { registra("Não consegui montar o arquivo: " + e.message); return; }
  const texto = JSON.stringify(r.proj);
  registra("Programa convertido: " + Object.keys(r.proj.targets[1].blocks).length + " blocos do SPIKE.");
  for (const a of new Set(r.avisos)) registra("  atenção: " + a);
  const d = await achaBaixar();
  if (!d) {
    await copiaTexto(texto);
    registra("Sem salvar arquivo aqui: o programa foi copiado para a área de transferência.");
    return;
  }
  try {
    const res = await d.save({ filename: nome + ".project.json", data: texto });
    registra(res.status === "saved" ? "Arquivo salvo." : "Arquivo entregue.");
  } catch (err) {
    const c = err && err.code;
    if (c === "declined") registra("Download cancelado.");
    else if (c === "rate_limited") registra("Já há um pedido aberto. Tente de novo em instantes.");
    else { await copiaTexto(texto); registra("Não deu para salvar (" + (c || "erro") + "). Copiei para a área de transferência."); }
  }
}
async function copiaTexto(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) {}
  const ta = document.createElement("textarea");
  ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  ta.remove();
  return true;
}
document.getElementById("btBaixar").onclick = baixaPrograma;

requestAnimationFrame(laco);
</script>
