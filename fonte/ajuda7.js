/* Samurai v10 = v9 + resgate cego na sala (o mesmo módulo do PD) */
window.montaV10 = () => {
  importaProjeto(EMBUTIDO, "Samurai OBR 2026 v10");
  const acha = nome => PROG.scripts.find(x => x.pilha[0].op === "meu_def" && x.pilha[0].a.NOME.lit === nome);
  const avisos = [];
  blocosResgate(2600, 40);
  /* checa_cinza: se os dois sensores estão na faixa da fita prata, conta a cada volta do laço, sem esperar,
     e na 3ª seguida chama o resgate (com a espera de 0,05 s o robô passava da fita sem ver).
     Fora disso, continua exatamente como a equipe fez. */
  const cc = acha("checa_cinza");
  const original = cc.pilha.slice(1);
  cc.pilha = [cc.pilha[0],
    SESENAO_(E_(IGUAL_("resgateFeito", 0), E_(PRATA_("D"), PRATA_("E"))), [
      MUDA_("contaPrata", 1),
      SE_(MAIOR_(V_("contaPrata"), L_(2)), [
        CHAMA_("resgate"),
        DEF_("contaPrata", 0), DEF_("contaCinza", 0), DEF_("contaCurva", 0), DEF_("contaEsq", 0), DEF_("contaDir", 0), DEF_("esperaLinha", 12)
      ])
    ], [DEF_("contaPrata", 0)].concat(original))];
  /* depois do resgate, o checa_cinza antigo não pode mais encerrar o seguidor de linha */
  (function tira(arr) { for (const b of arr) { if (b.op === "var_def" && b.a.VAR.lit === "fimSegueLinha" && b.a.VAL.lit === "1") b.a.VAL = L_(0); for (const sub of b.c || []) tira(sub); } })(original);
  avisos.push("checa_cinza chama o resgate");
  const main = PROG.scripts.find(s => s.pilha[0].op === "ev_inicio");
  main.pilha.splice(3, 0, DEF_("resgateFeito", 0), DEF_("contaCinza", 0), DEF_("contaPrata", 0));
  window.__avisosV10 = avisos;
  return PROG;
};
