# Bancada OBR · CROCOBOTS

Simulador de arena e editor de blocos para treinar o robô da **OBR 2026 (Resgate, Nível 2 — Ensino Médio)** sem precisar da pista montada. Roda inteiro no navegador, em um único arquivo HTML, sem instalar nada.

▶ **Abrir a bancada:** https://pecinn.github.io/bancada-obr-crocobots/

## O que tem dentro

**Editor de blocos** no estilo LEGO SPIKE Prime — motores, sensor de cor, ultrassônico, giroscópio, variáveis, "Meus Blocos" com as funções do programa, botão 🧹 Arrumar para organizar as pilhas em colunas.

**Física do robô** com dois motores de tração, roda-boba, pá coletora no motor C, ruído de sensor, diferença entre motores e inércia (modo realista).

**Arena com as regras do manual OBR 2026:**

- linha preta com curvas, cruzamentos, gaps, zigue-zague e curvas de 90°
- marcadores **verdes** (virar), **falso verde** (verde depois da linha) e **beco de dois verdes** (meia-volta de 180°)
- **rampa** ≤ 25° com subida, plateau e descida, e **gangorra**
- **lombadas** (quebra-molas) de 1 cm, brancas, sobre a linha
- **obstáculo** de 15 cm nos ladrilhos depois da área de resgate
- **sala de resgate** 90×90, 120×90 ou 90×120, com fita prateada na entrada, fita preta na saída, porta de 25–30 cm e paredes de 10 cm
- **vítimas** (2 prateadas + 1 preta, esferas de 4–5 cm) e **áreas de resgate** 30×30 cm sorteadas a cada corrida, como o árbitro faz
- **recipiente do Nível 1** (borda de 5 mm) e do **Nível 2** (borda de 6 cm, centro oco) — selecionável na aba Pista

**12 pistas prontas**, incluindo três completas ("OBR completa · A / B / C") que juntam tudo acima com salas de resgate em disposições diferentes.

**Dois programas de exemplo** que fazem a pista inteira, do início ao resgate:

- `Samurai OBR 2026 v11` — seguidor por estados, já embutido na bancada
- `Seguidor PD OBR` — controle proporcional-derivativo

Os dois usam a mesma estratégia de resgate: a pá desce ao entrar na sala e **fica abaixada**; a vítima é capturada ao ser prensada contra a parede e sobe para dentro da pá; a pá só levanta no recipiente, e é esse movimento que despeja as vítimas por cima da borda.

## Estrutura

```
index.html          a bancada pronta (é isto que o GitHub Pages serve)
fonte/              o código separado em partes + o montador
  montar.py         junta as partes e escreve bancada-obr.html
  original.html     o esqueleto herdado do editor de blocos
  partes/           css, html e os módulos js (mundo, robô, cena, interpretador, ui, resgate…)
  ajuda*.js         helpers de teste headless (rodaSala, serie, diag)
programas/          programas salvos em .project.json, para carregar na bancada
```

Para reconstruir depois de mexer em `fonte/partes/`:

```bash
cd fonte && python montar.py && cp bancada-obr.html ../index.html
```

## Rodando local

Basta abrir `index.html` no navegador — não precisa de servidor. Para os helpers de teste, sirva a pasta (`python -m http.server 8765`) e carregue `ajuda8.js` pelo console.

## Licença

Uso livre para fins educacionais. Feito para a equipe **CROCOBOTS**.
