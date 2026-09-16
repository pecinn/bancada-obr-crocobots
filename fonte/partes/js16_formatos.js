
/* =======================================================================
   16. ARQUIVOS: abrir e baixar no formato de cada kit
   SPIKE Prime -> .llsp3 (abre no app LEGO Education SPIKE 3)
   EV3        -> .lmsp  (abre no EV3 Classroom)
   Arduino    -> .ino   (abre na Arduino IDE; o projeto de blocos vai junto num comentário)
   Os dois primeiros são um .zip com manifest.json, scratch.sb3 (outro .zip com o project.json) e icon.svg.
   Os opcodes, as entradas e os menus foram conferidos com os blocos dos próprios apps (SPIKE 3.6 e EV3 Classroom 1.5).
   ======================================================================= */

/* ---------------------------- leitura ---------------------------- */
function campoUnico(b) {
  for (const k in b.fields) return b.fields[k][0];
  return "";
}
/* um seletor e um bloco-sombra sem entradas e com um unico campo: menus do SPIKE e do EV3 */
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
/* no SPIKE 3 alguns menus viraram entrada com sombra (DIRECTION, COLOR...): aceita os dois jeitos */
function valorSb(b, nome, BS, pad) {
  if (b.inputs && b.inputs[nome]) { const v = entradaSb(b, nome, BS); if (v) return v; }
  return campoSb(b, nome, pad);
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
    const b = convBloco(BS[cur], BS);
    if (b) out.push(b);
    cur = BS[cur].next;
  }
  return out;
}
function mk(op, a, c) {
  const b = criaBloco(op);
  if (a) for (const k in a) if (a[k] !== null && a[k] !== undefined) b.a[k] = a[k];
  if (c) b.c = c;
  return b;
}
const lit = v => ({ lit: String(v) });
/* EV3: portas de saída 1..4 = A..D; comparadores 0 "=", 2 ">", 4 "<" (e 1/3/5 viram o mais próximo) */
const EV3_SAIDA = { "1": "A", "2": "B", "3": "C", "4": "D" };
const saidaEv3 = v => (v && v.lit !== undefined) ? lit(EV3_SAIDA[v.lit] || v.lit) : v;
const EV3_CMP = { "0": "=", "1": "=", "2": ">", "3": ">", "4": "<", "5": "<" };
const DIR_MOVE = d => /back|rev|bw/i.test(d) ? "back" : /counter|ccw/i.test(d) ? "left" : /clock|cw/i.test(d) ? "right" : "forward";

const MAPA = {
  /* ---- SPIKE Prime (SPIKE 2 e SPIKE 3) ---- */
  flipperevents_whenProgramStarts: () => mk("ev_inicio"),
  horizontalevents_whenProgramStarts: () => mk("ev_inicio"),
  flipperevents_whenButton:        () => mk("ev_botao"),
  flippermove_setMovementPair: (b, S) => mk("mov_par", { PAR: entradaSb(b, "PAIR", S) }),
  flippermove_move:      (b, S) => { const d = valorSb(b, "DIRECTION", S, "forward"); return mk("mov_mover", { DIR: lit(DIR_MOVE(d.lit || "")), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "cm") }); },
  flippermove_startMove: (b, S) => { const d = valorSb(b, "DIRECTION", S, "forward"); return mk("mov_iniciar", { DIR: lit(DIR_MOVE(d.lit || "")) }); },
  flippermove_steer:      (b, S) => mk("mov_esterco", { DIR: entradaSb(b, "STEERING", S), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "cm") }),
  flippermove_startSteer: (b, S) => mk("mov_iniciar_esterco", { DIR: entradaSb(b, "STEERING", S) }),
  flippermove_stopMove:      () => mk("mov_parar"),
  flippermove_movementSpeed: (b, S) => mk("mov_vel", { VAL: entradaSb(b, "SPEED", S) }),
  flippermove_setDistance:   (b, S) => mk("mov_rot", { VAL: entradaSb(b, "DISTANCE", S) }),
  flippermove_setMovementRotation: (b, S) => mk("mov_rot", { VAL: entradaSb(b, "ROTATION", S) }),
  flippermoremove_startDualSpeed: (b, S) => mk("mov_dual", { ESQ: entradaSb(b, "LEFT", S), DIR: entradaSb(b, "RIGHT", S) }),
  flippermoremove_startDualPower: (b, S) => mk("mov_dual", { ESQ: entradaSb(b, "LEFT", S), DIR: entradaSb(b, "RIGHT", S) }),

  flippermotor_motorTurnForDirection: (b, S) => mk("mot_girar", { P: entradaSb(b, "PORT", S), SENT: valorSb(b, "DIRECTION", S, "clockwise"), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "rotations") }),
  flippermotor_motorStartDirection:   (b, S) => mk("mot_iniciar", { P: entradaSb(b, "PORT", S), SENT: valorSb(b, "DIRECTION", S, "clockwise") }),
  flippermoremotor_motorStartPower:   (b, S) => mk("mot_potencia", { P: entradaSb(b, "PORT", S), VAL: entradaSb(b, "POWER", S) }),
  flippermotor_motorStop:      (b, S) => mk("mot_parar", { P: entradaSb(b, "PORT", S) }),
  flippermotor_motorSetSpeed:  (b, S) => mk("mot_vel", { P: entradaSb(b, "PORT", S), VAL: entradaSb(b, "SPEED", S) }),
  flippermotor_motorGoDirectionToPosition: (b, S) => mk("mot_ir", { P: entradaSb(b, "PORT", S), CAM: campoSb(b, "DIRECTION", "shortest"), VAL: entradaSb(b, "POSITION", S) }),
  flippermotor_motorSetDegreeCounted:      (b, S) => mk("mot_zerar", { P: entradaSb(b, "PORT", S) }),
  flippermoremotor_motorSetDegreeCounted:  (b, S) => mk("mot_zerar", { P: entradaSb(b, "PORT", S), VAL: entradaSb(b, "VALUE", S) }),
  flippermotor_absolutePosition: (b, S) => mk("mot_pos", { P: entradaSb(b, "PORT", S) }),
  flippermotor_position:         (b, S) => mk("mot_pos", { P: entradaSb(b, "PORT", S) }),
  flippermoremotor_position:     (b, S) => mk("mot_pos", { P: entradaSb(b, "PORT", S) }),
  flippermotor_speed:            (b, S) => mk("mot_velr", { P: entradaSb(b, "PORT", S) }),

  flipperdisplay_ledOn:   (b, S) => mk("luz_pixel", { X: entradaSb(b, "X", S), Y: entradaSb(b, "Y", S), B: entradaSb(b, "BRIGHTNESS", S) }),
  flipperlight_lightDisplaySetPixel: (b, S) => mk("luz_pixel", { X: entradaSb(b, "X", S), Y: entradaSb(b, "Y", S), B: entradaSb(b, "BRIGHTNESS", S) }),
  flipperdisplay_ledText: (b, S) => mk("luz_texto", { TXT: entradaSb(b, "TEXT", S) }),
  flipperdisplay_displayText: (b, S) => mk("luz_texto", { TXT: entradaSb(b, "TEXT", S) }),
  flipperlight_lightDisplayText: (b, S) => mk("luz_texto", { TXT: entradaSb(b, "TEXT", S) }),
  flipperdisplay_displayOff:  () => mk("luz_limpar"),
  flipperlight_lightDisplayOff: () => mk("luz_limpar"),
  flipperdisplay_centerButtonLight: (b, S) => mk("luz_cor", { COR: entradaSb(b, "COLOR", S) }),
  flipperlight_centerButtonLight: (b, S) => mk("luz_cor", { COR: entradaSb(b, "COLOR", S) }),
  flippersound_beep:     (b, S) => mk("som_bip", { NOTA: entradaSb(b, "NOTE", S), SEG: lit(0.2) }),
  flippersound_beepForTime: (b, S) => mk("som_bip", { NOTA: entradaSb(b, "NOTE", S), SEG: entradaSb(b, "DURATION", S) }),

  flippersensors_isColor:   (b, S) => mk("sen_ecor", { P: entradaSb(b, "PORT", S), COR: entradaSb(b, "VALUE", S) }),
  flippersensors_color:     (b, S) => mk("sen_cor", { P: entradaSb(b, "PORT", S) }),
  flippersensors_reflectivity: (b, S) => mk("sen_reflexo", { P: entradaSb(b, "PORT", S) }),
  flippersensors_isReflectivity: (b, S) => mk("sen_ereflexo", { P: entradaSb(b, "PORT", S), CMP: campoSb(b, "COMPARATOR", "<"), VAL: entradaSb(b, "VALUE", S) }),
  flippermoresensors_rawColor: (b, S) => mk("sen_cru", { P: entradaSb(b, "PORT", S), CANAL: canalCru(b, S) }),
  flippersensors_isDistance: (b, S) => mk("sen_edist", { P: entradaSb(b, "PORT", S), CMP: campoSb(b, "COMPARATOR", "<"), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "cm") }),
  flippersensors_distance:  (b, S) => mk("sen_dist", { P: entradaSb(b, "PORT", S), UN: campoSb(b, "UNIT", "cm") }),
  flippersensors_isPressed: (b, S) => mk("sen_forca", { P: entradaSb(b, "PORT", S) }),
  flippersensors_force:     (b, S) => mk("sen_forcar", { P: entradaSb(b, "PORT", S) }),
  flippersensors_orientationAxis: (b, S) => mk("sen_angulo", { EIXO: campoSb(b, "AXIS", "yaw") }),
  flippersensors_resetYaw:  () => mk("sen_zerar_ang"),
  flippersensors_timer:     () => mk("sen_cron"),
  flippersensors_resetTimer:() => mk("sen_zerar_cron"),
  flippercontrol_stop: (b) => mk("ctl_parar", { ALVO: lit(/this/.test(campoSb(b, "STOP_OPTION", "all").lit) ? "this script" : "all") }),
  flippercontrol_stopOtherStacks: () => mk("ctl_parar_outras", {}),
  flippermoremotor_motorGoToRelativePosition: (b, S) => mk("mot_ir_rel", { P: entradaSb(b, "PORT", S), VAL: entradaSb(b, "POSITION", S), VEL: entradaSb(b, "SPEED", S) }),
  flippermoremotor_motorSetStopMethod: (b, S) => mk("mot_parada", { P: entradaSb(b, "PORT", S), STOP: campoSb(b, "STOP", "1") }),
  flippermoremotor_motorSetAcceleration: (b, S) => mk("mot_acel", { P: entradaSb(b, "PORT", S), ACEL: entradaSb(b, "ACCELERATION", S) }),
  flippermoremove_movementSetStopMethod: (b) => mk("mov_parada", { STOP: campoSb(b, "STOP", "1") }),
  flippermoremove_movementSetAcceleration: (b, S) => mk("mov_acel", { ACEL: entradaSb(b, "ACCELERATION", S) }),
  flippermoremotor_position: (b, S) => mk("mot_pos_rel", { P: entradaSb(b, "PORT", S) }),
  flippermoremotor_power:    (b, S) => mk("mot_pot_r", { P: entradaSb(b, "PORT", S) }),
  flippermotor_absolutePosition: (b, S) => mk("mot_pos", { P: entradaSb(b, "PORT", S) }),
  flipperoperator_isInBetween: (b, S) => mk("op_entre", { A: entradaSb(b, "VALUE", S), B: entradaSb(b, "LOW", S), C: entradaSb(b, "HIGH", S) }),

  /* ---- EV3 Classroom ---- */
  ev3events_whenProgramStarts: () => mk("ev_inicio"),
  ev3events_whenEV3BrickButtonPressed: () => mk("ev_botao"),
  ev3move_setMovementPair: (b, S) => { const e = saidaEv3(entradaSb(b, "LEFT_PORT", S)), d = saidaEv3(entradaSb(b, "RIGHT_PORT", S));
    return mk("mov_par", { PAR: lit((e ? e.lit : "B") + "+" + (d ? d.lit : "C")) }); },
  ev3move_move: (b, S) => mk("mov_mover", { DIR: lit(DIR_MOVE(campoSb(b, "DIRECTION", "forward").lit)), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "rotations") }),
  ev3move_steer: (b, S) => mk("mov_esterco", { DIR: entradaSb(b, "STEERING", S), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "rotations") }),
  ev3move_startSteer: (b, S) => mk("mov_iniciar_esterco", { DIR: entradaSb(b, "STEERING", S) }),
  ev3move_startDualSpeed: (b, S) => mk("mov_dual", { ESQ: entradaSb(b, "LEFT_SPEED", S), DIR: entradaSb(b, "RIGHT_SPEED", S) }),
  ev3move_stopMove: () => mk("mov_parar"),
  ev3move_movementSpeed: (b, S) => mk("mov_vel", { VAL: entradaSb(b, "SPEED", S) }),
  ev3motor_motorTurnFor: (b, S) => mk("mot_girar", { P: saidaEv3(entradaSb(b, "PORT", S)), SENT: campoSb(b, "DIRECTION", "clockwise"), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "rotations") }),
  ev3motor_motorStart: (b, S) => mk("mot_iniciar", { P: saidaEv3(entradaSb(b, "PORT", S)), SENT: campoSb(b, "DIRECTION", "clockwise") }),
  ev3motor_motorStartSpeed: (b, S) => mk("mot_potencia", { P: saidaEv3(entradaSb(b, "PORT", S)), VAL: entradaSb(b, "SPEED", S) }),
  ev3motor_motorStartPower: (b, S) => mk("mot_potencia", { P: saidaEv3(entradaSb(b, "PORT", S)), VAL: entradaSb(b, "POWER", S) }),
  ev3motor_motorStop: (b, S) => mk("mot_parar", { P: saidaEv3(entradaSb(b, "PORT", S)) }),
  ev3motor_motorSetSpeed: (b, S) => mk("mot_vel", { P: saidaEv3(entradaSb(b, "PORT", S)), VAL: entradaSb(b, "SPEED", S) }),
  ev3motor_motorReset: (b, S) => mk("mot_zerar", { P: saidaEv3(entradaSb(b, "PORT", S)) }),
  ev3motor_position: (b, S) => mk("mot_pos", { P: saidaEv3(entradaSb(b, "PORT", S)) }),
  ev3motor_speed: (b, S) => mk("mot_velr", { P: saidaEv3(entradaSb(b, "PORT", S)) }),
  ev3display_displayText: (b, S) => mk("luz_texto", { TXT: entradaSb(b, "TEXT", S), LINHA: entradaSb(b, "LINE", S) }),
  ev3display_displayClear: () => mk("luz_limpar"),
  ev3display_setStatusLight: (b) => mk("luz_status", { COR: campoSb(b, "OPTION", "1") }),
  ev3sound_beepForTime: (b, S) => mk("som_bip", { NOTA: entradaSb(b, "NOTE", S), SEG: entradaSb(b, "DURATION", S) }),
  ev3sensors_isEV3ColorSensorColor: (b, S) => mk("sen_ecor", { P: entradaSb(b, "PORT", S), COR: entradaSb(b, "VALUE", S) }),
  ev3sensors_getEV3ColorSensorColor: (b, S) => mk("sen_cor", { P: entradaSb(b, "PORT", S) }),
  ev3sensors_getEV3ColorSensorReflected: (b, S) => mk("sen_reflexo", { P: entradaSb(b, "PORT", S) }),
  ev3sensors_isEV3ColorSensorReflected: (b, S) => mk("sen_ereflexo", { P: entradaSb(b, "PORT", S), CMP: lit(EV3_CMP[campoSb(b, "COMPARATOR", "4").lit] || "<"), VAL: entradaSb(b, "VALUE", S) }),
  ev3sensors_isEV3UltrasonicSensorDistance: (b, S) => mk("sen_edist", { P: entradaSb(b, "PORT", S), CMP: lit(EV3_CMP[campoSb(b, "COMPARATOR", "4").lit] || "<"), VAL: entradaSb(b, "VALUE", S), UN: campoSb(b, "UNIT", "cm") }),
  ev3sensors_getEV3UltrasonicSensorDistance: (b, S) => mk("sen_dist", { P: entradaSb(b, "PORT", S), UN: campoSb(b, "UNIT", "cm") }),
  ev3sensors_isEV3TouchSensorPressed: (b, S) => mk("sen_forca", { P: entradaSb(b, "PORT", S) }),
  ev3sensors_getEV3GyroSensorAngle: (b, S) => mk("sen_angulo", { P: entradaSb(b, "PORT", S), EIXO: lit("yaw") }),
  ev3sensors_resetEV3GyroSensorAngle: (b, S) => mk("sen_zerar_ang", { P: entradaSb(b, "PORT", S) }),
  ev3sensors_timer: () => mk("sen_cron"), ev3sensors_resetTimer: () => mk("sen_zerar_cron"),
  sensing_timer: () => mk("sen_cron"), sensing_resettimer: () => mk("sen_zerar_cron"),
  ev3control_stop: (b) => { const o = campoSb(b, "STOP_OPTION", "program").lit;
    return mk("ctl_parar", { ALVO: lit(o === "this stack" ? "this script" : o === "other stacks" ? "other scripts in sprite" : "all") }); },
  ev3control_stopOtherStacks: () => mk("ctl_parar_outras", {}),

  /* ---- Scratch (os dois apps usam estes) ---- */
  control_wait:      (b, S) => mk("ctl_esperar", { SEG: entradaSb(b, "DURATION", S) }),
  control_repeat:    (b, S) => mk("ctl_repetir", { N: entradaSb(b, "TIMES", S) }, [pilhaSb(b, "SUBSTACK", S)]),
  control_forever:   (b, S) => mk("ctl_sempre", {}, [pilhaSb(b, "SUBSTACK", S)]),
  control_if:        (b, S) => mk("ctl_se", { COND: entradaSb(b, "CONDITION", S) }, [pilhaSb(b, "SUBSTACK", S)]),
  control_if_else:   (b, S) => mk("ctl_sesenao", { COND: entradaSb(b, "CONDITION", S) }, [pilhaSb(b, "SUBSTACK", S), pilhaSb(b, "SUBSTACK2", S)]),
  control_wait_until:(b, S) => mk("ctl_esperar_ate", { COND: entradaSb(b, "CONDITION", S) }),
  control_repeat_until: (b, S) => mk("ctl_repetir_ate", { COND: entradaSb(b, "CONDITION", S) }, [pilhaSb(b, "SUBSTACK", S)]),
  control_stop:      (b) => mk("ctl_parar", { ALVO: campoSb(b, "STOP_OPTION", "all") }),
  operator_add:      (b, S) => mk("op_soma", { A: entradaSb(b, "NUM1", S), B: entradaSb(b, "NUM2", S) }),
  operator_subtract: (b, S) => mk("op_sub",  { A: entradaSb(b, "NUM1", S), B: entradaSb(b, "NUM2", S) }),
  operator_multiply: (b, S) => mk("op_mult", { A: entradaSb(b, "NUM1", S), B: entradaSb(b, "NUM2", S) }),
  operator_divide:   (b, S) => mk("op_div",  { A: entradaSb(b, "NUM1", S), B: entradaSb(b, "NUM2", S) }),
  operator_mod:      (b, S) => mk("op_mod",  { A: entradaSb(b, "NUM1", S), B: entradaSb(b, "NUM2", S) }),
  operator_round:    (b, S) => mk("op_arred",{ A: entradaSb(b, "NUM", S) }),
  operator_mathop:   (b, S) => campoSb(b, "OPERATOR", "abs").lit === "abs" ? mk("op_abs", { A: entradaSb(b, "NUM", S) }) : null,
  operator_random:   (b, S) => mk("op_aleatorio", { A: entradaSb(b, "FROM", S), B: entradaSb(b, "TO", S) }),
  operator_join:     (b, S) => mk("op_junta", { A: entradaSb(b, "STRING1", S), B: entradaSb(b, "STRING2", S) }),
  operator_letter_of:(b, S) => mk("op_letra", { A: entradaSb(b, "LETTER", S), B: entradaSb(b, "STRING", S) }),
  operator_length:   (b, S) => mk("op_tamanho", { A: entradaSb(b, "STRING", S) }),
  operator_contains: (b, S) => mk("op_contem", { A: entradaSb(b, "STRING1", S), B: entradaSb(b, "STRING2", S) }),
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

/* o bloco de valor bruto tem um menu de canal; aceitamos varias grafias (SPIKE 3: COLOR 0 vermelho, 1 verde, 2 azul) */
function canalCru(b, S) {
  let v = null;
  if (b.fields && b.fields.COLOR) v = { lit: b.fields.COLOR[0] };
  v = v || entradaSb(b, "CHANNEL", S) || entradaSb(b, "COLOR", S) || entradaSb(b, "VALUE", S);
  if (!v) for (const k in (b.fields || {})) v = { lit: b.fields[k][0] };
  const s = String(v ? v.lit : "0").toLowerCase();
  return { lit: /verd|green|^1$/.test(s) ? "g" : /azul|blue|^2$/.test(s) ? "b" : "r" };
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
  if (f) { const r = f(b, BS); if (r) return r; }
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
/* de que kit é um project.json? */
function plataformaDoProjeto(json) {
  const exts = (json.extensions || []).join(" ");
  if (/\bev3/.test(exts)) return "ev3";
  if (/flipper|horizontal/.test(exts)) return "spike";
  const alvo = (json.targets || []).find(t => !t.isStage) || {};
  for (const k in (alvo.blocks || {})) { const op = alvo.blocks[k].opcode || ""; if (/^ev3/.test(op)) return "ev3"; if (/^flipper|^horizontal/.test(op)) return "spike"; }
  return null;
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
  const ehInicio = op => /whenProgramStarts$/.test(op);
  /* chapeus primeiro, depois o resto, na ordem do arquivo */
  topos.sort((p, q) => {
    const a = ehInicio(p[1].opcode) ? 0 : p[1].opcode === "procedures_definition" ? 1 : 2;
    const b2 = ehInicio(q[1].opcode) ? 0 : q[1].opcode === "procedures_definition" ? 1 : 2;
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
  if (nd.length) registra("Blocos que a bancada mostra mas não executa: " + nd.join(", "));
}
function contaTudo() { let n = 0; for (const s of PROG.scripts) n += contaBlocos(s.pilha, true); return n; }

/* ---------------------------- escrita (SPIKE e EV3) ---------------------------- */
const ALFA_ID = "!#$%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const idScratch = () => { let s = ""; for (let i = 0; i < 20; i++) s += ALFA_ID[Math.floor(Math.random() * ALFA_ID.length)]; return s; };
const TIPO = { num: 4, pos: 5, int: 6, txt: 10 };

/* descrição de cada bloco na saída:
   op   = opcode;  sel  = { ENTRADA: [opcode da sombra, argumento da bancada, campo da sombra?, conversão?] }
   val  = { ENTRADA: [argumento, tipo] };  fld = { CAMPO: argumento | [argumento, conversão] | ["=", valor fixo] }
   bool = { ENTRADA: argumento };  sub = [SUBSTACK...]  */
const CMP_EV3 = { "<": "4", ">": "2", "=": "0" };
const COR_EV3_OK = v => /^[0-7]$/.test(String(v)) ? v : "1";
const saidaParaEv3 = p => ({ A: "1", B: "2", C: "3", D: "4" })[p] || "2";
const SAIDA_SPIKE = {
  ev_inicio:  { op:"flipperevents_whenProgramStarts" },
  ev_botao:   { op:"flipperevents_whenButton", fld:{ BUTTON:["=", "left"], EVENT:["=", "pressed"] } },
  mov_par:    { op:"flippermove_setMovementPair", sel:{ PAIR:["flippermove_movement-port-selector","PAR", null, v => String(v).replace("+", "")] } },
  mov_mover:  { op:"flippermove_move", fld:{ UNIT:"UN" }, sel:{ DIRECTION:["flippermove_custom-icon-direction","DIR", null, v => ({ back:"back", left:"counterclockwise", right:"clockwise" })[v] || "forward"] }, val:{ VALUE:["VAL", TIPO.num] } },
  mov_iniciar:{ op:"flippermove_startMove", sel:{ DIRECTION:["flippermove_custom-icon-direction","DIR", null, v => ({ back:"back", left:"counterclockwise", right:"clockwise" })[v] || "forward"] } },
  mov_esterco:{ op:"flippermove_steer", fld:{ UNIT:"UN" }, sel:{ STEERING:["flippermove_rotation-wheel","DIR"] }, val:{ VALUE:["VAL", TIPO.num] } },
  mov_iniciar_esterco:{ op:"flippermove_startSteer", sel:{ STEERING:["flippermove_rotation-wheel","DIR"] } },
  mov_dual:   { op:"flippermoremove_startDualSpeed", val:{ LEFT:["ESQ", TIPO.num], RIGHT:["DIR", TIPO.num] } },
  mov_parar:  { op:"flippermove_stopMove" },
  mov_vel:    { op:"flippermove_movementSpeed", val:{ SPEED:["VAL", TIPO.num] } },
  mov_rot:    { op:"flippermove_setDistance", fld:{ UNIT:["=", "cm"] }, sel:{ DISTANCE:["flippermove_custom-set-move-distance-number","VAL"] } },
  mot_girar:  { op:"flippermotor_motorTurnForDirection", fld:{ UNIT:"UN" }, sel:{ PORT:["flippermotor_multiple-port-selector","P"], DIRECTION:["flippermotor_custom-icon-direction","SENT"] }, val:{ VALUE:["VAL", TIPO.num] } },
  mot_iniciar:{ op:"flippermotor_motorStartDirection", sel:{ PORT:["flippermotor_multiple-port-selector","P"], DIRECTION:["flippermotor_custom-icon-direction","SENT"] } },
  mot_potencia:{ op:"flippermoremotor_motorStartPower", sel:{ PORT:["flippermoremotor_multiple-port-selector","P"] }, val:{ POWER:["VAL", TIPO.num] } },
  mot_parar:  { op:"flippermotor_motorStop", sel:{ PORT:["flippermotor_multiple-port-selector","P"] } },
  mot_vel:    { op:"flippermotor_motorSetSpeed", sel:{ PORT:["flippermotor_multiple-port-selector","P"] }, val:{ SPEED:["VAL", TIPO.num] } },
  mot_ir:     { op:"flippermotor_motorGoDirectionToPosition", fld:{ DIRECTION:["CAM", v => /clockwise$/.test(v) ? v : "shortest"] }, sel:{ PORT:["flippermotor_multiple-port-selector","P"], POSITION:["flippermotor_custom-angle","VAL"] } },
  mot_zerar:  { op:"flippermoremotor_motorSetDegreeCounted", sel:{ PORT:["flippermoremotor_multiple-port-selector","P"] }, val:{ VALUE:["VAL", TIPO.num] } },
  mot_pos:    { op:"flippermotor_absolutePosition", sel:{ PORT:["flippermotor_single-motor-selector","P"] } },
  mot_pos_rel:{ op:"flippermoremotor_position", sel:{ PORT:["flippermoremotor_single-motor-selector","P"] } },
  mot_pot_r:  { op:"flippermoremotor_power", sel:{ PORT:["flippermoremotor_single-motor-selector","P"] } },
  mot_ir_rel: { op:"flippermoremotor_motorGoToRelativePosition", sel:{ PORT:["flippermoremotor_multiple-port-selector","P"] }, val:{ POSITION:["VAL", TIPO.num], SPEED:["VEL", TIPO.num] } },
  mot_parada: { op:"flippermoremotor_motorSetStopMethod", fld:{ STOP:"STOP" }, sel:{ PORT:["flippermoremotor_multiple-port-selector","P"] } },
  mot_acel:   { op:"flippermoremotor_motorSetAcceleration", sel:{ PORT:["flippermoremotor_multiple-port-selector","P"], ACCELERATION:["flippermoremotor_menu_acceleration","ACEL","acceleration"] } },
  mov_parada: { op:"flippermoremove_movementSetStopMethod", fld:{ STOP:"STOP" } },
  mov_acel:   { op:"flippermoremove_movementSetAcceleration", sel:{ ACCELERATION:["flippermoremove_menu_acceleration","ACEL","acceleration"] } },
  ctl_parar_outras:{ op:"flippercontrol_stopOtherStacks" },
  op_entre:   { op:"flipperoperator_isInBetween", val:{ VALUE:["A", TIPO.num], LOW:["B", TIPO.num], HIGH:["C", TIPO.num] } },
  mot_velr:   { op:"flippermotor_speed", sel:{ PORT:["flippermotor_single-motor-selector","P"] } },
  luz_texto:  { op:"flipperlight_lightDisplayText", val:{ TEXT:["TXT", TIPO.txt] } },
  luz_limpar: { op:"flipperlight_lightDisplayOff" },
  luz_pixel:  { op:"flipperlight_lightDisplaySetPixel", sel:{ X:["flipperlight_matrix-pixel-index","X"], Y:["flipperlight_matrix-pixel-index","Y"] }, val:{ BRIGHTNESS:["B", TIPO.num] } },
  luz_cor:    { op:"flipperlight_centerButtonLight", sel:{ COLOR:["flipperlight_color-selector-vertical","COR"] } },
  som_bip:    { op:"flippersound_beepForTime", sel:{ NOTE:["flippersound_custom-piano","NOTA"] }, val:{ DURATION:["SEG", TIPO.num] } },
  sen_ecor:   { op:"flippersensors_isColor", sel:{ PORT:["flippersensors_color-sensor-selector","P"], VALUE:["flippersensors_color-selector","COR"] } },
  sen_cor:    { op:"flippersensors_color", sel:{ PORT:["flippersensors_color-sensor-selector","P"] } },
  sen_reflexo:{ op:"flippersensors_reflectivity", sel:{ PORT:["flippersensors_color-sensor-selector","P"] } },
  sen_ereflexo:{ op:"flippersensors_isReflectivity", fld:{ COMPARATOR:"CMP" }, sel:{ PORT:["flippersensors_color-sensor-selector","P"] }, val:{ VALUE:["VAL", TIPO.num] } },
  sen_cru:    { op:"flippermoresensors_rawColor", fld:{ COLOR:["CANAL", v => v === "g" ? "1" : v === "b" ? "2" : "0"] }, sel:{ PORT:["flippersensors_color-sensor-selector","P"] } },
  sen_edist:  { op:"flippersensors_isDistance", fld:{ COMPARATOR:"CMP", UNIT:"UN" }, sel:{ PORT:["flippersensors_distance-sensor-selector","P"] }, val:{ VALUE:["VAL", TIPO.num] } },
  sen_dist:   { op:"flippersensors_distance", fld:{ UNIT:"UN" }, sel:{ PORT:["flippersensors_distance-sensor-selector","P"] } },
  sen_forca:  { op:"flippersensors_isPressed", fld:{ OPTION:["=", "pressed"] }, sel:{ PORT:["flippersensors_force-sensor-selector","P"] } },
  sen_forcar: { op:"flippersensors_force", fld:{ UNIT:["=", "%"] }, sel:{ PORT:["flippersensors_force-sensor-selector","P"] } },
  sen_angulo: { op:"flippersensors_orientationAxis", fld:{ AXIS:"EIXO" } },
  sen_zerar_ang:{ op:"flippersensors_resetYaw" },
  sen_cron:   { op:"flippersensors_timer" },
  sen_zerar_cron:{ op:"flippersensors_resetTimer" },
  ctl_parar:  { op:"flippercontrol_stop", fld:{ STOP_OPTION:["=", "all"] }, semNext:true }
};
const SAIDA_EV3 = {
  ev_inicio:  { op:"ev3events_whenProgramStarts" },
  ev_botao:   { op:"ev3events_whenEV3BrickButtonPressed", fld:{ BUTTON:["=", "2"], EVENT:["=", "1"] } },
  mov_mover:  { op:"ev3move_move", fld:{ DIRECTION:["DIR", v => v === "back" ? "backward" : "forward"], UNIT:"UN" }, val:{ VALUE:["VAL", TIPO.num] } },
  mov_esterco:{ op:"ev3move_steer", fld:{ UNIT:"UN" }, sel:{ STEERING:["ev3move_rotation-wheel","DIR"] }, val:{ VALUE:["VAL", TIPO.num] } },
  mov_iniciar_esterco:{ op:"ev3move_startSteer", sel:{ STEERING:["ev3move_rotation-wheel","DIR"] } },
  mov_dual:   { op:"ev3move_startDualSpeed", val:{ LEFT_SPEED:["ESQ", TIPO.num], RIGHT_SPEED:["DIR", TIPO.num] } },
  mov_parar:  { op:"ev3move_stopMove" },
  mov_vel:    { op:"ev3move_movementSpeed", val:{ SPEED:["VAL", TIPO.num] } },
  mot_girar:  { op:"ev3motor_motorTurnFor", fld:{ DIRECTION:"SENT", UNIT:"UN" }, sel:{ PORT:["ev3motor_menu_outputPort","P","outputPort", saidaParaEv3] }, val:{ VALUE:["VAL", TIPO.num] } },
  mot_iniciar:{ op:"ev3motor_motorStart", fld:{ DIRECTION:"SENT" }, sel:{ PORT:["ev3motor_menu_outputPort","P","outputPort", saidaParaEv3] } },
  mot_potencia:{ op:"ev3motor_motorStartSpeed", sel:{ PORT:["ev3motor_menu_outputPort","P","outputPort", saidaParaEv3] }, val:{ SPEED:["VAL", TIPO.num] } },
  mot_parar:  { op:"ev3motor_motorStop", sel:{ PORT:["ev3motor_menu_outputPort","P","outputPort", saidaParaEv3] } },
  mot_vel:    { op:"ev3motor_motorSetSpeed", sel:{ PORT:["ev3motor_menu_outputPort","P","outputPort", saidaParaEv3] }, val:{ SPEED:["VAL", TIPO.num] } },
  mot_zerar:  { op:"ev3motor_motorReset", sel:{ PORT:["ev3motor_menu_outputPort","P","outputPort", saidaParaEv3] } },
  mot_pos:    { op:"ev3motor_position", sel:{ PORT:["ev3motor_menu_outputPort","P","outputPort", saidaParaEv3] } },
  mot_velr:   { op:"ev3motor_speed", sel:{ PORT:["ev3motor_menu_outputPort","P","outputPort", saidaParaEv3] } },
  luz_texto:  { op:"ev3display_displayText", val:{ TEXT:["TXT", TIPO.txt], LINE:["LINHA", TIPO.num, "1"] } },
  luz_limpar: { op:"ev3display_displayClear" },
  luz_status: { op:"ev3display_setStatusLight", fld:{ OPTION:"COR" } },
  som_bip:    { op:"ev3sound_beepForTime", sel:{ NOTE:["ev3sound_custom-piano","NOTA"] }, val:{ DURATION:["SEG", TIPO.num] } },
  sen_ecor:   { op:"ev3sensors_isEV3ColorSensorColor", sel:{ PORT:["ev3sensors_menu_inputPort","P","inputPort"], VALUE:["ev3sensors_menu_color","COR","color", COR_EV3_OK] } },
  sen_cor:    { op:"ev3sensors_getEV3ColorSensorColor", sel:{ PORT:["ev3sensors_menu_inputPort","P","inputPort"] } },
  sen_reflexo:{ op:"ev3sensors_getEV3ColorSensorReflected", sel:{ PORT:["ev3sensors_menu_inputPort","P","inputPort"] } },
  sen_ereflexo:{ op:"ev3sensors_isEV3ColorSensorReflected", fld:{ COMPARATOR:["CMP", v => CMP_EV3[v] || "4"] }, sel:{ PORT:["ev3sensors_menu_inputPort","P","inputPort"] }, val:{ VALUE:["VAL", TIPO.num] } },
  sen_edist:  { op:"ev3sensors_isEV3UltrasonicSensorDistance", fld:{ COMPARATOR:["CMP", v => CMP_EV3[v] || "4"], UNIT:["UN", v => v === "inches" ? "inches" : "cm"] }, sel:{ PORT:["ev3sensors_menu_inputPort","P","inputPort"] }, val:{ VALUE:["VAL", TIPO.num] } },
  sen_dist:   { op:"ev3sensors_getEV3UltrasonicSensorDistance", fld:{ UNIT:["UN", v => v === "inches" ? "inches" : "cm"] }, sel:{ PORT:["ev3sensors_menu_inputPort","P","inputPort"] } },
  sen_forca:  { op:"ev3sensors_isEV3TouchSensorPressed", sel:{ PORT:["ev3sensors_menu_inputPort","P","inputPort"] } },
  sen_angulo: { op:"ev3sensors_getEV3GyroSensorAngle", sel:{ PORT:["ev3sensors_menu_inputPort","P","inputPort", v => /^[1-4]$/.test(v) ? v : (PLAT.giro || "1")] } },
  sen_zerar_ang:{ op:"ev3sensors_resetEV3GyroSensorAngle", sel:{ PORT:["ev3sensors_menu_inputPort","P","inputPort", v => /^[1-4]$/.test(v) ? v : (PLAT.giro || "1")] } },
  sen_cron:   { op:"sensing_timer" },
  sen_zerar_cron:{ op:"sensing_resettimer" },
  ctl_parar_outras:{ op:"ev3control_stopOtherStacks" },
  ctl_parar:  { op:"ev3control_stop", fld:{ STOP_OPTION:["ALVO", v => v === "this script" ? "this stack" : v === "other scripts in sprite" ? "other stacks" : "program"] }, semNext:true }
};
const SAIDA_SCRATCH = {
  ctl_esperar:{ op:"control_wait", val:{ DURATION:["SEG", TIPO.pos] } },
  ctl_repetir:{ op:"control_repeat", val:{ TIMES:["N", TIPO.int] }, sub:["SUBSTACK"] },
  ctl_sempre: { op:"control_forever", sub:["SUBSTACK"], semNext:true },
  ctl_se:     { op:"control_if", bool:{ CONDITION:"COND" }, sub:["SUBSTACK"] },
  ctl_sesenao:{ op:"control_if_else", bool:{ CONDITION:"COND" }, sub:["SUBSTACK","SUBSTACK2"] },
  ctl_esperar_ate:{ op:"control_wait_until", bool:{ CONDITION:"COND" } },
  ctl_repetir_ate:{ op:"control_repeat_until", bool:{ CONDITION:"COND" }, sub:["SUBSTACK"] },
  op_soma:    { op:"operator_add",      val:{ NUM1:["A", TIPO.num], NUM2:["B", TIPO.num] } },
  op_sub:     { op:"operator_subtract", val:{ NUM1:["A", TIPO.num], NUM2:["B", TIPO.num] } },
  op_mult:    { op:"operator_multiply", val:{ NUM1:["A", TIPO.num], NUM2:["B", TIPO.num] } },
  op_div:     { op:"operator_divide",   val:{ NUM1:["A", TIPO.num], NUM2:["B", TIPO.num] } },
  op_mod:     { op:"operator_mod",      val:{ NUM1:["A", TIPO.num], NUM2:["B", TIPO.num] } },
  op_arred:   { op:"operator_round",    val:{ NUM:["A", TIPO.num] } },
  op_abs:     { op:"operator_mathop",   fld:{ OPERATOR:["=", "abs"] }, val:{ NUM:["A", TIPO.num] } },
  op_aleatorio:{op:"operator_random",   val:{ FROM:["A", TIPO.num], TO:["B", TIPO.num] } },
  op_menor:   { op:"operator_lt",     val:{ OPERAND1:["A", TIPO.txt], OPERAND2:["B", TIPO.txt] } },
  op_maior:   { op:"operator_gt",     val:{ OPERAND1:["A", TIPO.txt], OPERAND2:["B", TIPO.txt] } },
  op_igual:   { op:"operator_equals", val:{ OPERAND1:["A", TIPO.txt], OPERAND2:["B", TIPO.txt] } },
  op_e:       { op:"operator_and", bool:{ OPERAND1:"A", OPERAND2:"B" } },
  op_ou:      { op:"operator_or",  bool:{ OPERAND1:"A", OPERAND2:"B" } },
  op_nao:     { op:"operator_not", bool:{ OPERAND:"A" } },
  op_junta:   { op:"operator_join",      val:{ STRING1:["A", TIPO.txt], STRING2:["B", TIPO.txt] } },
  op_letra:   { op:"operator_letter_of", val:{ LETTER:["A", TIPO.num], STRING:["B", TIPO.txt] } },
  op_tamanho: { op:"operator_length",    val:{ STRING:["A", TIPO.txt] } },
  op_contem:  { op:"operator_contains",  val:{ STRING1:["A", TIPO.txt], STRING2:["B", TIPO.txt] } },
  var_def:    { op:"data_setvariableto",    val:{ VALUE:["VAL", TIPO.txt] }, varf:"VAR" },
  var_muda:   { op:"data_changevariableby", val:{ VALUE:["VAL", TIPO.num] }, varf:"VAR" }
};

/* monta o project.json (Scratch 3) com os blocos do kit escolhido */
function exportaScratch(plat, nome) {
  const TAB = Object.assign({}, SAIDA_SCRATCH, plat === "ev3" ? SAIDA_EV3 : SAIDA_SPIKE);
  const B = {}, avisos = [], usados = new Set(), idVar = {};
  for (const v of PROG.vars) idVar[v] = idScratch();
  const av = v => (v && v.lit !== undefined) ? v.lit : "";
  const bruto = (b, k) => b.a[k];

  function novo(op, pai) {
    const id = idScratch();
    B[id] = { opcode: op, next: null, parent: pai || null, inputs: {}, fields: {}, shadow: false, topLevel: false };
    usados.add(op.split("_")[0]);
    return id;
  }
  function sombra(op, campo, valor, pai) {
    const id = idScratch();
    B[id] = { opcode: op, next: null, parent: pai, inputs: {}, fields: {}, shadow: true, topLevel: false };
    B[id].fields[campo || "field_" + op] = [String(valor), null];
    return id;
  }
  function entrada(valor, tipo, pai) {
    if (valor && valor.op) {
      if (valor.op === "var_ler") { const n = av(valor.a.VAR); if (!idVar[n]) { idVar[n] = idScratch(); PROG.vars.indexOf(n) < 0 && avisos.push("variável criada: " + n); }
        return [3, [12, n, idVar[n]], [tipo, tipo === TIPO.txt ? "" : "0"]]; }
      const id = emite(valor, pai);
      return id ? [3, id, [tipo, tipo === TIPO.txt ? "" : "0"]] : [1, [tipo, "0"]];
    }
    return [1, [tipo, valor ? String(valor.lit) : ""]];
  }
  /* EV3 não tem cm: converte para rotações da roda de 5,6 cm (17,6 cm por volta) */
  function cmParaRot(b) {
    if (plat !== "ev3" || !/^(mov_mover|mov_esterco)$/.test(b.op)) return b;
    const un = av(b.a.UN);
    if (un !== "cm" && un !== "inches") return b;
    const k = un === "inches" ? 2.54 / 17.6 : 1 / 17.6, c = JSON.parse(JSON.stringify(b));
    c.a.UN = lit("rotations");
    const v = b.a.VAL;
    c.a.VAL = (v && v.op) ? { op: "op_mult", id: novoId(), a: { A: v, B: lit(+k.toFixed(5)) }, c: [] } : lit(+(num(av(v)) * k).toFixed(3));
    avisos.push("distâncias em cm viraram rotações (roda de 5,6 cm)");
    return c;
  }
  function emite(b0, pai) {
    let b = cmParaRot(b0);
    if (b.op === "meu_chama") {
      const id = novo("procedures_call", pai);
      B[id].mutation = { tagName: "mutation", children: [], proccode: av(b.a.NOME), argumentids: "[]", warp: "false" };
      return id;
    }
    /* casos que o kit não tem igual: vira uma combinação de blocos que faz a mesma coisa */
    if (b.op === "sen_inclinado") {
      const o = av(b.a.O), eixo = (o === "esq" || o === "dir") ? "roll" : "pitch";
      if (plat === "ev3") { avisos.push("\"o hub está inclinado?\" não existe no EV3"); return null; }
      if (o === "nivelado") return emite({ op: "op_menor", a: { A: { op: "op_abs", a: { A: { op: "sen_angulo", a: { EIXO: lit("pitch") }, c: [] } }, c: [] }, B: lit(12) }, c: [] }, pai);
      const cmpOp = (o === "frente" || o === "esq") ? "op_maior" : "op_menor";
      return emite({ op: cmpOp, a: { A: { op: "sen_angulo", a: { EIXO: lit(eixo) }, c: [] }, B: lit(cmpOp === "op_maior" ? 12 : -12) }, c: [] }, pai);
    }
    if (plat === "ev3" && b.op === "op_entre") {
      const v = b.a.A;
      return emite({ op: "op_e", a: {
        A: { op: "op_maior", a: { A: v, B: b.a.B }, c: [] },
        B: { op: "op_menor", a: { A: v, B: b.a.C }, c: [] } }, c: [] }, pai);
    }
    if (plat === "ev3" && b.op === "mov_iniciar") {
      const d = av(b.a.DIR);
      if (d === "back") return emite({ op: "mov_dual", a: { ESQ: lit(-50), DIR: lit(-50) }, c: [] }, pai);
      return emite({ op: "mov_iniciar_esterco", a: { DIR: lit(d === "left" ? -100 : d === "right" ? 100 : 0) }, c: [] }, pai);
    }
    if (plat === "ev3" && b.op === "mov_mover" && /left|right/.test(av(b.a.DIR)))
      return emite({ op: "mov_esterco", a: { DIR: lit(av(b.a.DIR) === "left" ? -100 : 100), VAL: b.a.VAL, UN: b.a.UN }, c: [] }, pai);
    if (plat === "ev3" && b.op === "mov_par") {
      const [e, d] = lePar(av(b.a.PAR)), id = novo("ev3move_setMovementPair", pai);
      B[id].inputs.LEFT_PORT = [1, sombra("ev3move_menu_outputPort", "outputPort", saidaParaEv3(e), id)];
      B[id].inputs.RIGHT_PORT = [1, sombra("ev3move_menu_outputPort", "outputPort", saidaParaEv3(d), id)];
      return id;
    }
    if (plat === "ev3" && b.op === "mot_ir") avisos.push("\"motor ir para a posição\" virou \"motor girar por graus\" no EV3");
    if (plat === "ev3" && b.op === "mot_ir")
      return emite({ op: "mot_girar", a: { P: b.a.P, SENT: lit("clockwise"), VAL: b.a.VAL, UN: lit("degrees") }, c: [] }, pai);
    if (b.op === "ctl_parar" && plat === "spike" && av(b.a.ALVO) === "this script") {
      const id = novo("control_stop", pai);
      B[id].fields.STOP_OPTION = ["this script", null];
      B[id].mutation = { tagName: "mutation", children: [], hasnext: "false" };
      return id;
    }
    if (b.op === "ctl_parar" && plat === "spike" && /other/.test(av(b.a.ALVO))) return novo("flippercontrol_stopOtherStacks", pai);
    const sp = TAB[b.op];
    if (!sp) { avisos.push("sem equivalente no " + (plat === "ev3" ? "EV3" : "SPIKE") + ": " + (b.op === "desconhecido" ? b.origem : b.op)); return null; }
    const id = novo(sp.op, pai);
    if (sp.fld) for (const k in sp.fld) {
      const d = sp.fld[k];
      let v;
      if (Array.isArray(d)) v = d[0] === "=" ? d[1] : d[1](av(b.a[d[0]]));
      else v = av(b.a[d]);
      B[id].fields[k] = [String(v), null];
    }
    if (sp.sel) for (const k in sp.sel) {
      const [selOp, arg, campo, conv] = sp.sel[k];
      const valor = bruto(b, arg);
      if (valor && valor.op) {                       /* um reporter no lugar do menu */
        const s = sombra(selOp, campo, "", id);
        B[id].inputs[k] = [3, emite(valor, id), s];
      } else {
        const t = conv ? conv(av(valor)) : av(valor);
        B[id].inputs[k] = [1, sombra(selOp, campo, t, id)];
      }
    }
    if (sp.val) for (const k in sp.val) {
      const [arg, tipo, pad] = sp.val[k];
      B[id].inputs[k] = entrada(b.a[arg] || (pad !== undefined ? lit(pad) : null), tipo, id);
    }
    if (sp.fixo) for (const k in sp.fixo) B[id].inputs[k] = [1, [sp.fixo[k][1], sp.fixo[k][0]]];
    if (sp.bool) for (const k in sp.bool) {
      const v = b.a[sp.bool[k]];
      if (v && v.op) { const f = emite(v, id); if (f) B[id].inputs[k] = [2, f]; }
    }
    if (sp.varf) {
      const n = av(b.a[sp.varf]);
      if (!idVar[n]) idVar[n] = idScratch();
      B[id].fields.VARIABLE = [n, idVar[n]];
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
      if (!id) continue;
      if (ant) { B[ant].next = id; B[id].parent = ant; } else { primeiro = id; B[id].parent = pai; }
      ant = id;
    }
    return primeiro;
  }

  for (const s of PROG.scripts) {
    const cabeca = s.pilha[0];
    if (!cabeca) continue;
    let topo;
    if (cabeca.op === "meu_def") {
      topo = novo("procedures_definition", null);
      const proto = idScratch();
      B[proto] = { opcode: "procedures_prototype", next: null, parent: topo, inputs: {}, fields: {}, shadow: true, topLevel: false,
                   mutation: { tagName: "mutation", children: [], proccode: av(cabeca.a.NOME), argumentids: "[]", argumentnames: "[]", argumentdefaults: "[]", warp: "false" } };
      B[topo].inputs.custom_block = [1, proto];
    } else {
      topo = emite(cabeca, null);
      if (!topo) continue;
    }
    B[topo].topLevel = true; B[topo].parent = null; B[topo].x = Math.round(s.x); B[topo].y = Math.round(s.y);
    const p = corrente(s.pilha.slice(1), topo);
    if (p) B[topo].next = p;
  }

  const variaveis = {};
  for (const v in idVar) variaveis[idVar[v]] = [v, 0];
  const traje = (nomeT, cx, cy) => ({ assetId: "d41d8cd98f00b204e9800998ecf8427e", name: nomeT, bitmapResolution: 1,
    md5ext: "d41d8cd98f00b204e9800998ecf8427e.svg", dataFormat: "svg", rotationCenterX: cx, rotationCenterY: cy });
  let exts;
  if (plat === "ev3") exts = Array.from(new Set(["ev3events"].concat(Array.from(usados).filter(u => /^ev3/.test(u)))));
  else exts = Array.from(new Set(["flipperevents"].concat(Array.from(usados).filter(u => /^flipper/.test(u)))));
  const proj = {
    targets: [
      { isStage: true, name: "Stage", variables: {}, lists: {}, broadcasts: {}, blocks: {}, comments: {},
        currentCostume: 0, costumes: [traje("backdrop1", 47, 55)], sounds: [], volume: 0, tempo: 60,
        videoTransparency: 50, videoState: "on", textToSpeechLanguage: null },
      { isStage: false, name: idScratch().replace(/[^A-Za-z0-9]/g, "x"), variables: variaveis, lists: {}, broadcasts: {}, blocks: B, comments: {},
        currentCostume: 0, costumes: [traje(idScratch().replace(/[^A-Za-z0-9]/g, "x"), 240, 180)], sounds: [], volume: 100, visible: true,
        x: 0, y: 0, size: 100, direction: 90, draggable: false, rotationStyle: "all around" }
    ],
    monitors: [], extensions: exts,
    meta: { semver: "3.0.0", vm: "0.2.0-prerelease.20200512204241", agent: "Portal da Robotica CROCOBOTS" }
  };
  return { proj, avisos: Array.from(new Set(avisos)), exts };
}

/* .llsp3 / .lmsp: manifest.json + scratch.sb3 + icon.svg */
async function empacotaLego(plat, nome) {
  const r = exportaScratch(plat, nome);
  const sb3 = new JSZip();
  sb3.file("project.json", JSON.stringify(r.proj));
  sb3.file("d41d8cd98f00b204e9800998ecf8427e.svg", "", { compression: "STORE" });
  const sb3Bytes = await sb3.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const agora = new Date().toISOString();
  const idProj = idScratch().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 12).padEnd(12, "x");
  const manifest = {
    type: "word-blocks", autoDelete: false, created: agora, id: idProj, lastsaved: agora, size: 0, name: nome, slotIndex: 0,
    workspaceX: 120, workspaceY: 120, zoomLevel: 0.5, showAllBlocks: false, version: plat === "ev3" ? 8 : 38,
    hardware: { [idScratch()]: { type: "flipper" } }, extensions: r.exts,
    state: plat === "ev3" ? { playMode: "download", canvasDrawerTab: "monitorTab" }
                          : { playMode: "download", canvasDrawerTab: "monitorTab", canvasDrawerOpen: false, hasMonitors: false },
    extraFiles: []
  };
  if (plat === "spike") manifest.lastConnectedHubType = "flipper";
  const icone = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="18" fill="' +
    (plat === "ev3" ? "#3b3f45" : "#ffcf00") + '"/><text x="60" y="72" font-family="Arial" font-size="34" font-weight="700" text-anchor="middle" fill="' +
    (plat === "ev3" ? "#ffffff" : "#1b1b1b") + '">' + (plat === "ev3" ? "EV3" : "OBR") + "</text></svg>";
  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify(manifest));
  zip.file("scratch.sb3", sb3Bytes);
  zip.file("icon.svg", icone);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", mimeType: "application/zip" });
  return { blob, avisos: r.avisos, nBlocos: Object.keys(r.proj.targets[1].blocks).length };
}

/* ---------------------------- Arduino (.ino) ---------------------------- */
const RESERVADAS_C = new Set("auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false setup loop delay millis new delete this class public private template".split(" "));
function nomeC(s, prefixo) {
  let n = String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9_]/g, "_");
  if (/^[0-9]/.test(n) || !n) n = "_" + n;
  if (RESERVADAS_C.has(n)) n = prefixo + n;
  return n;
}
function base64Utf8(t) { return btoa(unescape(encodeURIComponent(t))); }
function deBase64Utf8(t) { return decodeURIComponent(escape(atob(t.replace(/\s/g, "")))); }

function geraArduino(nome) {
  const avisos = [], av = v => (v && v.lit !== undefined) ? v.lit : "";
  const vars = PROG.vars.map(v => [v, "v_" + nomeC(v, "v_")]);
  const nVar = n => { const f = vars.find(x => x[0] === n); if (f) return f[1]; const c = "v_" + nomeC(n, "v_"); vars.push([n, c]); return c; };
  const nProc = n => "bloco_" + nomeC(n, "b_");
  const numC = v => { const x = parseFloat(v); return isNaN(x) ? "0" : String(x); };
  const sensorIdx = p => p === PLAT.par[1] || p === "SD" ? 1 : 0;
  const ex = v => {
    if (!v) return "0";
    if (!v.op) return numC(v.lit);
    const A = () => ex(v.a.A), Bx = () => ex(v.a.B);
    switch (v.op) {
      case "op_soma": return "(" + A() + " + " + Bx() + ")";
      case "op_sub": return "(" + A() + " - " + Bx() + ")";
      case "op_mult": return "(" + A() + " * " + Bx() + ")";
      case "op_div": return "divide(" + A() + ", " + Bx() + ")";
      case "op_mod": return "fmod(" + A() + ", " + Bx() + ")";
      case "op_arred": return "round(" + A() + ")";
      case "op_abs": return "fabs(" + A() + ")";
      case "op_aleatorio": return "random(" + A() + ", " + Bx() + " + 1)";
      case "op_menor": return "(" + A() + " < " + Bx() + ")";
      case "op_maior": return "(" + A() + " > " + Bx() + ")";
      case "op_igual": return "(fabs(" + A() + " - " + Bx() + ") < 0.001)";
      case "op_e": return "(" + A() + " && " + Bx() + ")";
      case "op_ou": return "(" + A() + " || " + Bx() + ")";
      case "op_nao": return "(!" + A() + ")";
      case "op_entre": return "(" + A() + " >= min(" + Bx() + ", " + ex(v.a.C) + ") && " + A() + " <= max(" + Bx() + ", " + ex(v.a.C) + "))";
      case "op_junta": return "(String(" + A() + ") + String(" + Bx() + "))";
      case "op_letra": return "String(" + Bx() + ").charAt((int)(" + A() + ") - 1)";
      case "op_tamanho": return "String(" + A() + ").length()";
      case "op_contem": return "(String(" + A() + ").indexOf(String(" + Bx() + ")) >= 0)";
      case "var_ler": return nVar(av(v.a.VAR));
      case "sen_reflexo": return "lerLinha(" + sensorIdx(av(v.a.P)) + ")";
      case "sen_ereflexo": return "(lerLinha(" + sensorIdx(av(v.a.P)) + ") " + (av(v.a.CMP) === "=" ? "==" : av(v.a.CMP)) + " " + ex(v.a.VAL) + ")";
      case "sen_cru": return "lerCanal(" + sensorIdx(av(v.a.P)) + ", '" + (av(v.a.CANAL) || "r") + "')";
      case "sen_cor": return "corDetectada(" + sensorIdx(av(v.a.P)) + ")";
      case "sen_ecor": return "(corDetectada(" + sensorIdx(av(v.a.P)) + ") == " + numC(av(v.a.COR)) + ")";
      case "sen_dist": return "distanciaCm()";
      case "sen_edist": return "(distanciaCm() " + (av(v.a.CMP) === "=" ? "==" : av(v.a.CMP)) + " " + ex(v.a.VAL) + ")";
      case "sen_angulo": return av(v.a.EIXO) === "yaw" ? "anguloGuinada()" : "anguloInclinacao('" + (av(v.a.EIXO) === "roll" ? "r" : "p") + "')";
      case "sen_cron": return "cronometro()";
      case "sen_forca": return "false";
      default: avisos.push("sem equivalente no Arduino: " + v.op); return "0";
    }
  };
  const txtC = v => (v && v.op) ? ex(v) : "F(" + JSON.stringify(String(av(v))) + ")";
  const dirC = d => d === "back" ? "b" : d === "left" ? "e" : d === "right" ? "d" : "f";
  const motC = p => p === "MD" ? 1 : p === "ME" ? 0 : 2;
  let laco = 0;
  const bl = (arr, ind) => arr.map(b => st(b, ind)).join("");
  const st = (b, ind) => {
    const I = "  ".repeat(ind), A = n => ex(b.a[n]);
    switch (b.op) {
      case "mov_par": return I + "// motores de movimento: " + av(b.a.PAR) + "\n";
      case "mov_vel": return I + "velocidadeMov = " + A("VAL") + ";\n";
      case "mov_dual": return I + "motores(" + A("ESQ") + ", " + A("DIR") + ");\n";
      case "mov_parar": return I + "motores(0, 0);\n";
      case "mov_iniciar": return I + "comecarAMover('" + dirC(av(b.a.DIR)) + "');\n";
      case "mov_mover": return I + "andar('" + dirC(av(b.a.DIR)) + "', " + A("VAL") + ", " + (av(b.a.UN) === "seconds" ? "true" : "false") + ");\n";
      case "mov_esterco": return I + "andarComDirecao(" + A("DIR") + ", " + A("VAL") + ", " + (av(b.a.UN) === "seconds" ? "true" : "false") + ");\n";
      case "mov_iniciar_esterco": return I + "moverComDirecao(" + A("DIR") + ");\n";
      case "mot_potencia": return I + "motorPorta(" + motC(av(b.a.P)) + ", " + A("VAL") + ");\n";
      case "mot_parar": return I + "motorPorta(" + motC(av(b.a.P)) + ", 0);\n";
      case "mot_ir": return I + "servo.write(constrain((int)(" + A("VAL") + "), 0, 180));\n" + I + "esperar(0.4);\n";
      case "mot_girar": return I + "motorPorta(" + motC(av(b.a.P)) + ", " + (av(b.a.SENT) === "counterclockwise" ? "-" : "") + "75);\n" + I + "esperar(" + A("VAL") + ");\n" + I + "motorPorta(" + motC(av(b.a.P)) + ", 0);\n";
      case "luz_texto": return I + "Serial.println(" + txtC(b.a.TXT) + ");\n";
      case "som_bip": return I + "bipe(" + A("NOTA") + ", " + A("SEG") + ");\n";
      case "sen_zerar_ang": return I + "guinada = 0;\n";
      case "sen_zerar_cron": return I + "inicioCron = millis();\n";
      case "ctl_esperar": return I + "esperar(" + A("SEG") + ");\n";
      case "ctl_repetir": { const i = "i" + (++laco); return I + "for (long " + i + " = 0; " + i + " < (long)(" + A("N") + "); " + i + "++) {\n" + bl(b.c[0], ind + 1) + I + "  atualizaSensores();\n" + I + "}\n"; }
      case "ctl_sempre": return I + "while (true) {\n" + bl(b.c[0], ind + 1) + I + "  atualizaSensores();\n" + I + "}\n";
      case "ctl_se": return I + "if (" + ex(b.a.COND) + ") {\n" + bl(b.c[0], ind + 1) + I + "}\n";
      case "ctl_sesenao": return I + "if (" + ex(b.a.COND) + ") {\n" + bl(b.c[0], ind + 1) + I + "} else {\n" + bl(b.c[1], ind + 1) + I + "}\n";
      case "ctl_esperar_ate": return I + "while (!(" + ex(b.a.COND) + ")) atualizaSensores();\n";
      case "ctl_repetir_ate": return I + "while (!(" + ex(b.a.COND) + ")) {\n" + bl(b.c[0], ind + 1) + I + "  atualizaSensores();\n" + I + "}\n";
      case "ctl_parar": return av(b.a.ALVO) === "this script" ? I + "return;\n" : I + "pararTudo();\n";
      case "var_def": return I + nVar(av(b.a.VAR)) + " = " + A("VAL") + ";\n";
      case "var_muda": return I + nVar(av(b.a.VAR)) + " += " + A("VAL") + ";\n";
      case "meu_chama": return I + nProc(av(b.a.NOME)) + "();\n";
      case "ctl_parar_outras": return I + "// o Arduino roda um programa só: não há outras pilhas\n";
      case "luz_limpar": case "luz_pixel": case "luz_cor": case "luz_status": case "mov_rot": case "mot_vel": case "mot_zerar":
      case "mot_parada": case "mot_acel": case "mov_parada": case "mov_acel": return "";
      default: avisos.push("sem equivalente no Arduino: " + (b.op === "desconhecido" ? b.origem : b.op)); return I + "// (bloco sem equivalente: " + b.op + ")\n";
    }
  };
  const inicios = PROG.scripts.filter(s => s.pilha[0] && s.pilha[0].op === "ev_inicio");
  if (inicios.length > 1) avisos.push("o Arduino roda um programa só: usei o primeiro \"quando o Arduino ligar\"");
  const procs = PROG.scripts.filter(s => s.pilha[0] && s.pilha[0].op === "meu_def");
  const corpoProcs = procs.map(s => "void " + nProc(av(s.pilha[0].a.NOME)) + "() {\n" + bl(s.pilha.slice(1), 1) + "}\n").join("\n");
  const corpoPrincipal = inicios.length ? bl(inicios[0].pilha.slice(1), 1) : "  // (o programa não tem o bloco \"quando o Arduino ligar\")\n";
  const projeto = base64Utf8(JSON.stringify({ formato: "bancada-obr", versao: 1, plataforma: "arduino", nome, prog: PROG }));
  const linhasProj = projeto.match(/.{1,100}/g).join("\n");
  const c = `/*
  ${nome}
  Gerado pelo Portal da Robótica CROCOBOTS (bancada de simulação) para Arduino UNO.
  Programas grandes (seguidor completo com resgate) passam dos 32 KB do UNO: use um Arduino Mega 2560
  com as mesmas ligações (Ferramentas > Placa > Arduino Mega or Mega 2560).

  Ligações (as mesmas do robô da bancada):
    Ponte H L298N .... motor esquerdo: ENA 5, IN1 7, IN2 8 | motor direito: ENB 6, IN3 9, IN4 10
    Servo da pá ...... sinal no pino 3
    Buzzer ........... pino 4
    Ultrassônico ..... HC-SR04: TRIG 12, ECHO 11
    Sensores de linha  TCRT5000 (saída analógica): esquerdo A0, direito A1
    Sensores de cor .. TCS3200 com S0 e S1 em 5V: S2 A2 e S3 A3 (ligados nos dois), OUT esquerdo 2, OUT direito 13
    Giroscópio ....... MPU-6050 no I2C: SDA A4, SCL A5
  Bibliotecas: Servo e Wire (já vêm com a Arduino IDE). Não precisa instalar nada.

  Calibre no robô de verdade: CM_POR_SEGUNDO (quantos cm ele anda em 1 s a 100%) e os limites de cor em corDetectada().

  BANCADA-PROJETO (não apague: é por aqui que a bancada abre este arquivo de volta em blocos)
${linhasProj}
*/
#include <Servo.h>
#include <Wire.h>

const int ME_EN = 5, ME_IN1 = 7, ME_IN2 = 8;
const int MD_EN = 6, MD_IN3 = 9, MD_IN4 = 10;
const int SERVO_PINO = 3, BUZZER = 4, US_TRIG = 12, US_ECHO = 11;
const int LINHA_ESQ = A0, LINHA_DIR = A1, COR_S2 = A2, COR_S3 = A3, COR_OUT_ESQ = 2, COR_OUT_DIR = 13;
const int MPU = 0x68;

float CM_POR_SEGUNDO = 45.0;     // a 100%: meça no seu robô
float velocidadeMov = 50;        // % usada por andar() e moverComDirecao()
unsigned long inicioCron = 0;
Servo servo;
float guinada = 0, derivaGiro = 0;
unsigned long ultimoGiro = 0;

${vars.map(v => "float " + v[1] + " = 0;   // " + v[0]).join("\n")}

float divide(float a, float b) { return b == 0 ? 0 : a / b; }
float cronometro() { return (millis() - inicioCron) / 1000.0; }

void motor(int en, int a, int b, float pct) {
  pct = constrain(pct, -100, 100);
  digitalWrite(a, pct >= 0 ? HIGH : LOW);
  digitalWrite(b, pct >= 0 ? LOW : HIGH);
  analogWrite(en, (int)(fabs(pct) * 2.55));
}
void motores(float esq, float dir) { motor(ME_EN, ME_IN1, ME_IN2, esq); motor(MD_EN, MD_IN3, MD_IN4, dir); }
void motorPorta(int p, float pct) {   // 0 = esquerdo, 1 = direito
  if (p == 0) motor(ME_EN, ME_IN1, ME_IN2, pct);
  else if (p == 1) motor(MD_EN, MD_IN3, MD_IN4, pct);
}
void pararTudo() { motores(0, 0); while (true) delay(100); }

/* giroscópio: integra o eixo Z do MPU-6050 (graus, positivo = virou para a direita) */
int16_t leRegistro16(int reg) {
  Wire.beginTransmission(MPU); Wire.write(reg); Wire.endTransmission(false);
  Wire.requestFrom(MPU, 2); return (Wire.read() << 8) | Wire.read();
}
void iniciaGiro() {
  Wire.begin(); Wire.beginTransmission(MPU); Wire.write(0x6B); Wire.write(0); Wire.endTransmission();
  long soma = 0; for (int i = 0; i < 200; i++) { soma += leRegistro16(0x47); delay(2); }
  derivaGiro = soma / 200.0; ultimoGiro = micros();
}
void atualizaSensores() {
  unsigned long agora = micros();
  float dt = (agora - ultimoGiro) / 1000000.0; ultimoGiro = agora;
  guinada -= (leRegistro16(0x47) - derivaGiro) / 131.0 * dt;
}
float anguloGuinada() { atualizaSensores(); return guinada; }
float anguloInclinacao(char eixo) {
  float ax = leRegistro16(0x3B), ay = leRegistro16(0x3D), az = leRegistro16(0x3F);
  if (eixo == 'r') return atan2(ay, az) * 57.3;
  return atan2(-ax, sqrt(ay * ay + az * az)) * 57.3;
}
void esperar(float s) { unsigned long t = millis(); while (millis() - t < s * 1000) atualizaSensores(); }

/* sensores de linha e de cor */
int lerLinha(int lado) { return analogRead(lado == 0 ? LINHA_ESQ : LINHA_DIR); }
int lerCanal(int lado, char canal) {
  digitalWrite(COR_S2, canal == 'g' ? HIGH : LOW);
  digitalWrite(COR_S3, canal == 'r' ? LOW : HIGH);
  unsigned long p = pulseIn(lado == 0 ? COR_OUT_ESQ : COR_OUT_DIR, LOW, 40000);
  if (p == 0) return 0;
  return constrain(map(p, 400, 40, 0, 255), 0, 255);   // pulso curto = muita luz
}
/* 0 preto, 3 azul, 6 verde, 7 amarelo, 9 vermelho, 10 branco (os mesmos números do SPIKE) */
int corDetectada(int lado) {
  int r = lerCanal(lado, 'r'), g = lerCanal(lado, 'g'), b = lerCanal(lado, 'b');
  int mx = max(r, max(g, b)), mn = min(r, min(g, b));
  if (mx < 55) return 0;
  if (mx - mn < 40) return mx < 105 ? 0 : 10;
  if (g == mx) return 6;
  if (r == mx) return g > b + 40 ? 7 : 9;
  return 3;
}
float distanciaCm() {
  digitalWrite(US_TRIG, LOW); delayMicroseconds(2);
  digitalWrite(US_TRIG, HIGH); delayMicroseconds(10); digitalWrite(US_TRIG, LOW);
  unsigned long t = pulseIn(US_ECHO, HIGH, 25000);
  return t == 0 ? 200 : t / 58.0;
}
void bipe(float nota, float segundos) {
  tone(BUZZER, 440.0 * pow(2, (nota - 69) / 12.0), (unsigned long)(segundos * 1000));
  esperar(segundos);
}

/* andar: sem encoder, a distância sai do tempo (calibre CM_POR_SEGUNDO) */
float segundosPara(float valor, bool emSegundos) {
  if (emSegundos) return valor;
  return fabs(valor) / (CM_POR_SEGUNDO * velocidadeMov / 100.0);
}
void comecarAMover(char dir) {   // f frente, b trás, e esquerda, d direita
  float v = velocidadeMov;
  if (dir == 'b') motores(-v, -v); else if (dir == 'e') motores(-v, v); else if (dir == 'd') motores(v, -v); else motores(v, v);
}
void andar(char dir, float valor, bool emSegundos) { comecarAMover(dir); esperar(segundosPara(valor, emSegundos)); motores(0, 0); }
void moverComDirecao(float d) {
  float v = velocidadeMov, k = constrain(d, -100, 100);
  if (k >= 0) motores(v, v * (1 - 2 * k / 100)); else motores(v * (1 + 2 * k / 100), v);
}
void andarComDirecao(float d, float valor, bool emSegundos) { moverComDirecao(d); esperar(segundosPara(valor, emSegundos)); motores(0, 0); }

${corpoProcs}
void programa() {
${corpoPrincipal}}

void setup() {
  Serial.begin(9600);
  pinMode(ME_EN, OUTPUT); pinMode(ME_IN1, OUTPUT); pinMode(ME_IN2, OUTPUT);
  pinMode(MD_EN, OUTPUT); pinMode(MD_IN3, OUTPUT); pinMode(MD_IN4, OUTPUT);
  pinMode(US_TRIG, OUTPUT); pinMode(US_ECHO, INPUT); pinMode(BUZZER, OUTPUT);
  pinMode(COR_S2, OUTPUT); pinMode(COR_S3, OUTPUT); pinMode(COR_OUT_ESQ, INPUT); pinMode(COR_OUT_DIR, INPUT);
  servo.attach(SERVO_PINO);
  iniciaGiro();
  randomSeed(analogRead(A6));
  inicioCron = millis();
  programa();
  motores(0, 0);
}

void loop() {
}
`;
  return { texto: c, avisos: Array.from(new Set(avisos)) };
}
function leArduino(texto) {
  const m = /BANCADA-PROJETO[^\n]*\n([A-Za-z0-9+/=\s]+?)\*\//.exec(texto);
  if (!m) return null;
  try { return JSON.parse(deBase64Utf8(m[1])); } catch (e) { return null; }
}

/* ---------------------------- baixar e abrir ---------------------------- */
let BAIXAR = undefined;
async function achaBaixar() {
  if (BAIXAR !== undefined) return BAIXAR;
  BAIXAR = null;
  try { if (window.claude && window.claude.use) BAIXAR = await window.claude.use("downloads"); } catch (e) {}
  return BAIXAR;
}
async function entregaArquivo(nomeArq, blob) {
  const d = await achaBaixar();
  if (d) {
    /* dentro do claude.ai só dá para baixar alguns tipos de arquivo (.llsp3, .lmsp e .ino não estão entre eles) */
    try { const r = await d.save({ filename: nomeArq, data: blob }); return r && r.status === "saved" ? "salvo" : "entregue"; }
    catch (err) {
      if (err && err.code === "declined") return "cancelado";
      registra("Aqui dentro do claude.ai o navegador não deixa baixar ." + nomeArq.split(".").pop() + ". Abra o portal em https://pecinn.github.io/bancada-obr-crocobots/ para baixar.");
      return "não baixado";
    }
  }
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = nomeArq; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "baixado";
}
const nomeDoProjeto = () => (document.getElementById("tagProj").textContent || "programa").replace(/[\\/:*?"<>|]/g, "").trim() || "programa";
async function baixaPrograma() {
  const nome = nomeDoProjeto();
  try {
    if (PLAT.id === "arduino") {
      const r = geraArduino(nome);
      const res = await entregaArquivo(nomeC(nome, "p_") + ".ino", new Blob([r.texto], { type: "text/plain" }));
      registra("Arduino: " + r.texto.split("\n").length + " linhas de C++ (" + res + "). Abra na Arduino IDE e envie para a placa.");
      r.avisos.forEach(a => registra("  atenção: " + a));
      return;
    }
    const r = await empacotaLego(PLAT.id, nome);
    const res = await entregaArquivo(nome + "." + PLAT.ext, r.blob);
    registra(PLAT.nome + ": " + r.nBlocos + " blocos no " + nome + "." + PLAT.ext + " (" + res + "). Abra no app " + PLAT.app + ".");
    r.avisos.forEach(a => registra("  atenção: " + a));
  } catch (e) { registra("Não consegui montar o arquivo: " + e.message); }
}

async function abreArquivo(file) {
  const nome = file.name.replace(/\.[^.]+$/, "");
  try {
    if (/\.ino$/i.test(file.name)) {
      const p = leArduino(await file.text());
      if (!p) { registra("Este .ino não foi feito na bancada: dá para abrir na Arduino IDE, mas não dá para transformar C++ em blocos."); return; }
      return trocaOuImporta("arduino", { prog: p.prog }, p.nome || nome);
    }
    if (/\.json$/i.test(file.name)) {
      const j = JSON.parse(await file.text());
      if (j.formato === "bancada-obr") return trocaOuImporta(j.plataforma, { prog: j.prog }, j.nome || nome);
      return trocaOuImporta(plataformaDoProjeto(j) || PLAT.id, { json: j }, nome);
    }
    const zip = await JSZip.loadAsync(file);
    if (zip.file("projectbody.json")) { registra("Este projeto é em Python (SPIKE). A bancada trabalha com blocos: abra um projeto de palavras-bloco."); return; }
    let alvo = zip.file("project.json");
    if (!alvo) {
      const sb3 = zip.file("scratch.sb3");
      if (sb3) { const z2 = await JSZip.loadAsync(await sb3.async("uint8array")); alvo = z2.file("project.json"); }
    }
    if (!alvo) { registra("Não achei o project.json dentro do arquivo."); return; }
    const j = JSON.parse(await alvo.async("string"));
    const plat = plataformaDoProjeto(j) || (/\.lmsp$/i.test(file.name) ? "ev3" : "spike");
    return trocaOuImporta(plat, { json: j }, nome);
  } catch (err) {
    registra("Erro ao abrir: " + err.message);
  }
}
/* arquivo de outro kit: guarda, troca de plataforma e abre depois de recarregar */
const CHAVE_IMPORT = "portalRobotica.importPendente";
function trocaOuImporta(plat, dados, nome) {
  if (plat && plat !== PLAT.id) {
    const outro = PLATAFORMAS[plat];
    if (!confirm("Este arquivo é de " + outro.nome + ", e a bancada está em " + PLAT.nome + ". Trocar para " + outro.nome + " e abrir?")) return;
    try { sessionStorage.setItem(CHAVE_IMPORT, JSON.stringify({ plat, nome, dados })); } catch (e) { registra("Arquivo grande demais para trocar de plataforma."); return; }
    if (typeof salvaAgora === "function") salvaAgora();
    const s = lerSessao(); s.plataforma = plat; gravaSessao(s);
    location.reload();
    return;
  }
  if (dados.json) importaProjeto(dados.json, nome);
  else { usaPrograma(dados.prog, nome); ZOOM = 1; PANX = 40; PANY = 40; montaPaleta(); desenhaBlocos(); reinicia(); }
  arrumaPilhas(); salvaDepois();
}
function importPendente() {
  let p = null;
  try { p = JSON.parse(sessionStorage.getItem(CHAVE_IMPORT) || "null"); sessionStorage.removeItem(CHAVE_IMPORT); } catch (e) {}
  if (!p || p.plat !== PLAT.id) return false;
  trocaOuImporta(p.plat, p.dados, p.nome);
  return true;
}
document.getElementById("btAbrir").textContent = "Abrir ." + PLAT.ext;
document.getElementById("btAbrir").title = "Abrir um projeto do " + PLAT.app + " (." + PLAT.ext + ")";
document.getElementById("btBaixar").textContent = "⤓ Baixar ." + PLAT.ext;
document.getElementById("btBaixar").title = "Baixar para abrir no " + PLAT.app;
if (PLAT.id !== "spike") { const o = document.getElementById("optSamurai"); if (o) o.remove(); }
document.getElementById("btAbrir").onclick = () => document.getElementById("arq").click();
document.getElementById("arq").onchange = e => { if (e.target.files[0]) abreArquivo(e.target.files[0]); e.target.value = ""; };
document.getElementById("btBaixar").onclick = baixaPrograma;
document.getElementById("btLimpar").onclick = () => {
  PROG = { scripts: [], vars: [], procs: [] };
  document.getElementById("tagProj").textContent = "programa novo";
  montaPaleta(); desenhaBlocos(); reinicia();
};
