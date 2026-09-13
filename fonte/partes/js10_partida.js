
/* ---- partida ---- */
window.addEventListener("resize", () => { ajustaLona(); trocaVista(); });
const SALVO = lerSalvo();
const TEM_PROG = aplicaSalvo(SALVO);
const VERSAO_SALVA = (SALVO && SALVO.versao) || 0;
/* sensores a 2,2 cm do centro: fita de 19 mm + verde de 2,5 cm (manual OBR) = centro do verde */
let AVISO_SEP = false;
if (SALVO && VERSAO_SALVA < 4 && SALVO.robo && SALVO.robo.SEP === 2.5) { SEP = 2.2; AVISO_SEP = true; }
montaTrilho(); montaPaleta();
arrumaLados(); montaPortas(); mostraObjeto(); montaDeslizes(); montaEquipe(); montaLegenda();
limpaTapeteLad(); montaPaletaLad(); rotuloVerde();
carinha(); marcaModelo();
iniciaTres();
ajustaLona(); trocaVista();
{
  const pi = SALVO && SALVO.pista >= 0 && SALVO.pista < PISTAS.length && PISTAS[SALVO.pista].tipo !== "img" && !PISTAS[SALVO.pista].oculta ? SALVO.pista : 0;
  sel.value = pi; montaPista(pi); mostraDesc(); montaTabuleiro();
}
semeiaGuardados(); listaMeus();
if (!TEM_PROG) { exemploSeguidor(); traduzPrograma(PROG); }
/* programas salvos por versões antigas: D = direito / E = esquerdo e os exemplos novos */
let MIGROU = "";
if (TEM_PROG && VERSAO_SALVA < 5) {
  const tag = $("tagProj").textContent;
  const ex = { "seguidor por cor": exemploSeguidor, "seguidor por reflexo (P)": exemploReflexo,
               "seguidor de borda (1 sensor)": exemploBorda, "seguidor PD": exemploPD, "seguidor PD OBR": exemploPD }[tag];
  if (/^Samurai/.test(tag)) { carregaSamurai(); MIGROU = NOME_SAMURAI; }
  else if (ex) { ex(); MIGROU = $("tagProj").textContent; }
  else if (SALVO.portas !== "D-dir") MIGROU = "?";
  salvaDepois();
}
/* versão 7: pá que fica abaixada, recipiente do Nível 2 e pistas completas novas.
   Se o programa aberto é um dos exemplos (sem mudanças da equipe no nome), ele é trocado pelo novo;
   se a equipe renomeou, o programa fica como está e só aparece um aviso */
let AVISO_RESGATE = "";
if (TEM_PROG && VERSAO_SALVA >= 5 && VERSAO_SALVA < 8 && PLAT.id === "spike") {
  const tag = $("tagProj").textContent;
  if (/^Samurai OBR 2026 v(6|7|8|9|10|11)$/.test(tag)) { carregaSamurai(); AVISO_RESGATE = "trocado"; }
  else if (/^seguidor PD OBR$/.test(tag)) { exemploPD(); AVISO_RESGATE = "trocado"; }
  else AVISO_RESGATE = "aviso";
  salvaDepois();
}
desenhaBlocos();
if (AVISO_RESGATE === "trocado") arrumaPilhas();
registra("Bancada CROCOBOTS pronta. Escolha a pista, monte os blocos e aperte Rodar.");
registra("Dica: arraste o robô com o mouse; Rodar começa de onde ele estiver. 🧪 Testar tudo roda o programa em todas as pistas.");
if (TEM_PROG) registra("Seu último programa foi recuperado deste navegador.");
if (MIGROU === "?") registra("Atenção: agora a porta D é o sensor DIREITO e a porta E o ESQUERDO. Confira se o seu programa usa as portas nesse sentido.");
else if (MIGROU) registra("Atualizei o programa salvo para a versão nova (D = sensor direito, E = esquerdo, cruzamentos, verdes, desvio de obstáculo e resgate): " + MIGROU + ".");
if (AVISO_SEP) { registra("Sensores agora a 2,2 cm do centro: com a fita de 19 mm cada sensor passa no meio do quadrado verde. Dá para mudar na aba Robô."); salvaDepois(); }
if (AVISO_RESGATE === "trocado") registra("Resgate atualizado: a pá agora fica abaixada e prende a vítima apertando na parede, e o recipiente do Nível 2 (borda de 6 cm) está no simulador. Carreguei a versão nova do seu programa (" + $("tagProj").textContent + ").");
else if (AVISO_RESGATE === "aviso") registra("Resgate atualizado (pá que fica abaixada, recipiente do Nível 2 e pistas completas novas). O seu programa não foi mexido: as versões novas estão em Programas… → " + NOME_SAMURAI + " e o PD com resgate.");
/* arquivo aberto em outra plataforma (a página recarregou para trocar de kit) e o portal */
importPendente();
iniciaPortal();
