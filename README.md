# Portal da Robótica · CROCOBOTS

Plataforma de treino de robótica que roda inteira no navegador: **entrada da equipe**, **escolha do kit** (SPIKE Prime, EV3 ou Arduino), **trilha de desafios** do iniciante às pistas da OBR 2026 e uma **bancada de simulação 3D** com editor de blocos. Um único arquivo HTML, sem instalar nada.

▶ **Abrir o portal:** https://pecinn.github.io/bancada-obr-crocobots/
Acesso da equipe: login `crocobots` · senha `123456`

## Os três kits

| | SPIKE Prime | EV3 | Arduino |
|---|---|---|---|
| Portas | A a F | motores A–D, sensores 1–4 | ponte H L298N, servo, pinos |
| Blocos | palavras-bloco do app SPIKE 3 | blocos do EV3 Classroom | biblioteca da bancada (vira C++) |
| Luz refletida | 0–100; **branco e fita prata dão o mesmo número**; o valor bruto do vermelho separa | 0–100; branco ~71, **prata ~90** | analogRead 0–1023 invertido; branco ~150, **prata ~80** |
| Valor bruto RGB | sim (0–1024) | não existe no EV3 Classroom | TCS3200 (0–255) |
| Giroscópio | dentro do hub | sensor na porta 1 | MPU-6050 |
| Baixar / abrir | **.llsp3** (app LEGO Education SPIKE) | **.lmsp** (EV3 Classroom) | **.ino** (Arduino IDE) |

Os arquivos `.llsp3` e `.lmsp` usam os opcodes, entradas, sombras e menus que os próprios apps gravam (conferidos com o SPIKE 3.6 e o EV3 Classroom 1.5). O `.ino` compila na Arduino IDE só com as bibliotecas que já vêm com ela e leva o projeto de blocos num comentário, para abrir de volta na bancada. Cada kit tem o seu robô 3D (hub SPIKE branco e azul, bloco EV3 cinza e vermelho, UNO sobre acrílico com motores TT amarelos).

## A trilha

- **Iniciante** — sequência, giro de 90°, repetição, slalom, estacionar de ré, parar na faixa preta, contar faixas com variável, radar com ultrassônico.
- **Intermediário** — seguidor de borda com 1 sensor, cantos de 90° com 2 sensores, controle proporcional (a nota mede a distância média da linha), verde, obstáculo, gap e tracejado, e **achar a fita prata** (o jeito certo muda com o kit).
- **Avançado · OBR** — as 10 pistas da bancada (Níveis 1 a 5, sala de resgate, Desafio e as três completas).

**Ensino Fundamental / Ensino Médio**: no Médio os critérios ficam mais apertados, o mundo real liga (ruído nos sensores, motores diferentes, inércia) e a área de resgate é o recipiente do **Nível 2** (borda de 6 cm); no Fundamental é o **Nível 1** (sem parede).

Cada corrida é medida por critérios objetivos (onde o robô parou, se bateu, por onde passou, tempo, blocos usados). O objetivo dá a 1ª estrela, 80 pontos a 2ª e 100 pontos a 3ª. O painel **Meu desempenho** soma pontos, estrelas, corridas e a média por competência (sequência, repetição, sensores, decisões, variáveis, controle P/PD, estratégia OBR). O progresso fica salvo no navegador, separado por usuário, kit e segmento; o programa de cada desafio também.

Alguns desafios **mudam a cada corrida** (a faixa, a parede, a fita prata), para que contar centímetros não funcione e o sensor seja usado de verdade.

## A arena (regras do manual OBR 2026)

- linha preta com curvas, cruzamentos, gaps, tracejado, zigue-zague e cantos de 90°
- verdes, **falso verde** e **beco de dois verdes** (meia-volta)
- rampa com plataforma, gangorra e lombadas de 1 cm
- obstáculo no trajeto de saída da sala
- sala de resgate 90×90, 120×90 ou 90×120, fita prata na entrada e preta na saída, vítimas e áreas sorteadas
- chegada validada parando 5 s na faixa vermelha

Programas de exemplo: `Seguidor PD OBR` (nos três kits, com portas e cores traduzidas) e `Samurai OBR 2026 v12` (SPIKE, o programa da equipe).

## Estrutura

```
index.html          o portal pronto (é isto que o GitHub Pages serve)
fonte/
  montar.py         junta as partes e escreve bancada-obr.html
  valida_lego.py    confere um .llsp3/.lmsp exportado contra o formato dos apps
  original.html     o esqueleto herdado do editor de blocos
  partes/
    js13_plataforma.js  kits: portas, cores, tradução dos programas
    js14.js             catálogo de blocos por kit e editor
    js5_mundo.js        tapete, ladrilhos e pistas
    js6_robo.js         física e sensores (com o modelo de cada kit)
    js7_cena.js         3D e vista de cima
    js8_interp.js       interpretador
    js9_ui.js, js9b_resgate.js, js10_partida.js
    js15_trilha.js      portal, desafios, notas e desempenho
    js16_formatos.js    .llsp3, .lmsp e .ino
    html_*.html, css_*.css
programas/          programas salvos em .project.json
```

Para reconstruir depois de mexer em `fonte/partes/`:

```bash
cd fonte && python montar.py && cp bancada-obr.html ../index.html
```

Para colocar os logos dos patrocinadores, preencha `PATROCINADORES` no começo de `js15_trilha.js` (`{ nome, logo, site }`). Os usuários ficam em `USUARIOS` no mesmo arquivo — o login desta versão é só de demonstração, não protege nada.

## Licença

Uso livre para fins educacionais. Feito para a equipe **CROCOBOTS**. LEGO, SPIKE, MINDSTORMS e Arduino são marcas de seus donos; este projeto não tem ligação com eles.
