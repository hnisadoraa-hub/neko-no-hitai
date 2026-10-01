/* Um gato na Building Frame of the House.

   Minijogo isométrico em 3D, no lugar do antigo "arquivo desenhado".
   Modelo com alterações da Building Frame of the House (IGArchitects,
   2023), caso 9.13 do trabalho, montado sobre as plantas, as elevações e o
   corte do projeto e sobre três fotos da casa, guardados na pasta da
   pesquisa.

   Dado (ficha do projeto na architecturephoto; lote, projeção e área total
   iguais à planilha): lote de 42,19 m², projeção de 31,40 m², área total
   de 59,88 m², concreto armado, Tóquio, abril de 2023. A ficha declara dois
   pavimentos (2階建); a planilha registra sete [VERIFICAR].
   Texto dos arquitetos (architecturephoto, em japonês): um cômodo só, quase
   sem paredes internas; casa para um casal que vive e trabalha em qualquer
   lugar e quer sentir a presença um do outro; parede norte deslocada para
   abrir a casa ao terreno vazio vizinho; três paredes e sete lajes que se
   sobrepõem sem interromper o percurso; aberturas que evitam os vizinhos;
   nada aberto ao sul e luz o dia todo por cima da parede norte; cozinha e
   banho no fundo, longe das aberturas; perto da rua o vão se alarga e as
   aberturas crescem; o vidro aberto faz da casa jardim e terraço; o espaço
   muda aos poucos a partir do genkan; escadas e móveis na escala do corpo.
   Sequência dos níveis: legendas das fotos na architecturephoto (entrada no
   1階下, cozinha no 1階上, banho no 2階上 ao lado de um vazio) e Stirworld
   (mesa de comer e trabalhar no térreo; cozinha num mezanino; área de dormir
   1,6 m acima da cozinha; dali, uma escada para o banho e outra para uma
   laje junto à fachada; estante do chão ao último nível, encaixada na
   escada). Outras publicações: estante na altura toda da parede sul;
   escadas de aço preto, degraus em balanço e uma escada de marinheiro;
   concreto com marca de fôrma, carvalho, tijolo, compensado e bancada de
   metal; pisos de madeira BAREFOOT, tijolo e porcelanato Archetipo Nero
   (kenzai-navi); cortinas creditadas na ficha.
   Falas do Masato Igarashi: tradução livre, em tom de conversa, do e-mail de
   24 ago. 2026 a Isadora Nogueira e do texto dos arquitetos publicado na
   architecturephoto; citação com nomes autorizada pela IGArchitects em
   27 ago. 2026. Gatos do bairro, máquinas e interações: inventados para o
   jogo. Trilha em assets/trilha.js: a música padrão é uma gravação de
   Stelvio Cipriani escolhida pela autora; as outras quatro são originais.
   Dos desenhos: cotas do corte, posição das lajes, escadas, parede norte em
   três placas com vidro nas frestas, vidros altos do vazio e fachada. Das
   fotos: pisos, estante, degraus, cortina do quarto, trilho de luz e as
   folhas de aço da frente. Modelo: espessuras, móveis, objetos, livros, o
   uso do vão sob a cozinha, o porcelanato no banho, o jeito de abrir das
   folhas de aço, as figuras dos moradores e todo o entorno, com quem passa
   na rua e os gatos do bairro.

   Visual: cena em resolução cheia, luz em rampa suave, sombra macia,
   oclusão de ambiente e contorno leve tirados da profundidade, brilho nas
   luzes, desfoque de maquete no alto e embaixo da tela e antisserrilhado.
   A imagem sai espelhada, para ficar com a mão da planta. Um plano de corte
   horizontal acompanha o gato, e o que ele corta aparece em azul-marinho,
   como poché de desenho de arquitetura. */

(function () {
  "use strict";

  const A = window.NekoAtlas;
  const host = document.getElementById("cats-blocks");
  if (!A || !host) return;
  const esc = A.escapeHtml;
  /* idioma: o atlas tem um botão EN, e o jogo acompanha. $t() procura a frase
     no dicionário (assets/frame-en.js); $b() escolhe entre duas versões */
  let LANG = (window.NekoLang && window.NekoLang.current) || "pt";
  const EN = window.NekoFrameEN || {};
  const $t = (s2) => (LANG === "en" && s2 && EN[s2]) || s2;
  const $b = (pt, en) => (LANG === "en" ? en : pt);
  const fmt = (v, d = 1) => (LANG === "en" ? (Number.isFinite(v) ? new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v) : "—") : A.fmt(v, d));
  /* cotas escritas à mão, como "+3,35": no inglês, ponto decimal */
  const numL = (str) => (LANG === "en" ? String(str).replace(/(\d),(\d)/g, "$1.$2") : str);
  const HOUSE = A.houses.find((h) => h.id === "h256-building-frame-of-the-house") || null;
  const REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------------------------------------------------------------------
     medidas, em metros, tiradas das plantas, do corte e das elevações do
     projeto (IGArchitects), guardados na pasta da pesquisa. x cresce para o
     norte e z para a rua. Dentro da casa a conta segue os eixos do desenho:
     a sai do eixo Y1 (parede sul) para o norte, b sai do eixo X4 (parede
     dos fundos) para a rua.
     --------------------------------------------------------------------- */
  const LOT_W = 5.95, LOT_D = 7.09;           /* 42,19 m²; no desenho, um trapézio quase retangular */
  const BX = 0.32, BZ = 0.355;                /* eixos Y1 e X4 dentro do lote */
  const T2 = 0.12;                            /* meia parede de concreto: as paredes são centradas no eixo */
  const GL0 = -0.2;                           /* o chão médio do terreno, o GL do corte */
  const lv = (h) => GL0 + h;                  /* cota do corte, em metros, para a altura no jogo */
  /* cotas do corte: 1FL −215, 1FL1 +100, 1FL2 +2150, 2FL1 +3350, 2FL2 +3800,
     2FL3 +5100, RSL1 +6020, RSL2 +7470, RSL3 +8410 e topo +8600 */
  const FL = { g: lv(-0.215), low: lv(0.1), k: lv(2.15), mid: lv(3.35), bed: lv(3.8), bath: lv(5.1), r1: lv(6.02), r2: lv(7.47), r3: lv(8.41), top: lv(8.6) };
  /* as sete lajes, S1 a S7: térreo, vão sob a cozinha, cozinha, interpavimento,
     quarto, banho e terraço */
  const LV = [FL.g, FL.low, FL.k, FL.mid, FL.bed, FL.bath, FL.r1];
  const ROOF = FL.top;
  const ZG = 6.26;                            /* plano do vidro da frente, em b */
  const PLAT = FL.g + 0.45;                   /* o tablado de madeira da frente, na altura de um banco */
  const LIGHT = { x0: 3.75, x1: 4.55, z0: 3.45, z1: 4.3 };   /* luz da fresta norte no interpavimento, coordenadas da casa */
  const STRAY = { x: 7.75, z: 3.3 };
  const BOXC = { a0: 4.1, a1: 4.5, b0: 2.3, b1: 2.7 };   /* a caixa de papelão, em coordenadas da casa */
  const CAT = { R: 0.13, H: 0.28, SPEED: 1.6, G: 14, JUMP: Math.sqrt(2 * 14 * 1.05), STEP: 0.24 };
  /* física do gato: aceleração no chão e no ar, tolerância na borda (coyote),
     pulo guardado por um instante antes de pousar, pulo mais baixo se soltar
     cedo, queda com velocidade máxima e passo fixo de 1/120 s */
  const PHYS = { ACC: 16, DEC: 22, AIR: 6, COYOTE: 0.1, BUFFER: 0.13, CUT: 0.5, VMAX: 9, DT: 1 / 120 };
  const START = { x: BX + 4.35, y: -0.25, z: LOT_D + 1.9, face: Math.PI / 2 };
  const EL = Math.PI / 6;                     /* 30°: linhas a 2:1 na tela */
  let ZOOMS = [6.2, 10.5, 19];
  const INK = 0x10264a;
  const MIRROR = true;                       /* a imagem final sai espelhada, com a mão da planta */
  const STEEL = 0x2f2b35;

  /* ---------------------------------------------------------------------
     bloco na página
     --------------------------------------------------------------------- */
  function dataRows() {
    if (!HOUSE) return "";
    const rows = [
      ["lote", `${fmt(HOUSE.lotArea, 2)} m²`],
      ["projeção", `${fmt(HOUSE.footprintArea, 2)} m²`],
      ["construída", `${fmt(HOUSE.builtArea, 2)} m²`],
      ["pavimentos", `${HOUSE.floors} ${$b("[VERIFICAR]", "[TO VERIFY]")}`],
      ["FAR · BCR", `${fmt(HOUSE.far, 2)}× · ${fmt(HOUSE.bcr * 100, 1)}%`],
      ["ward · ano", `${esc(HOUSE.ward)} · ${HOUSE.year}`],
    ];
    return rows.map(([k, v]) => `<div><dt>${esc($t(k))}</dt><dd>${v}</dd></div>`).join("");
  }
  const lotTxt = HOUSE ? fmt(HOUSE.lotArea, 2) : "42,19";
  /* ícones em pixel, desenhados em SVG para ficarem nítidos em qualquer tela */
  const svgIcon = (inner) => `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><g fill="currentColor">${inner}</g></svg>`;
  const ICON = {
    play: svgIcon('<path d="M5 3h2v1h2v1h2v1h2v4h-2v1H9v1H7v1H5z"/>'),
    pause: svgIcon('<path d="M4 3h3v10H4zM9 3h3v10H9z"/>'),
    prev: svgIcon('<path d="M3 3h2v10H3zM13 3v10h-2v-1H9v-1H7V9H6V7h1V5h2V4h2V3z"/>'),
    next: svgIcon('<path d="M11 3h2v10h-2zM3 3h2v1h2v1h2v2h1v2H9v2H7v1H5v1H3z"/>'),
    vol: svgIcon('<path d="M1 6h3v1h1V6h1V5h1V4h1V3h1v10H8v-1H7v-1H6v-1H5V9H4v1H1zM11 5h1v1h1v4h-1v1h-1z"/>'),
    file: svgIcon('<path d="M8 2h6v3h-4v7H9v1H8v1H6v-1H5v-2h1v-1h2z"/><path d="M2 2h1v2h2v1H3v2H2V5H0V4h2z"/>'),
    house: svgIcon('<path d="M8 1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h-2v7H3V9H1V8h1V7h1V6h1V5h1V4h1V3h1V2h1zM7 11v4h3v-4z" fill-rule="evenodd"/>'),
  };

  function block() {
    return `<article class="city-block panel nk-block" id="block-frame">
      <div class="panel-title"><div><p data-nk>jogo · caso 9.13</p><h3 data-nk>Um gato na Building Frame of the House</h3></div></div>
      <p class="panel-lede" id="nk-lede">Segundo os arquitetos, nesta casa o que era piso vira cadeira, mesa, prateleira e teto. São sete lajes desencontradas dentro de uma moldura de concreto, num lote de ${lotTxt} m², e aqui um gato sobe por elas e mia para quem mora ali. As alturas, as escadas e a posição das lajes seguem as plantas e o corte do projeto; as respostas do Masato Igarashi vêm do e-mail que ele mandou para esta pesquisa. O modelo é isométrico, em 3D, e tem alterações. Um plano de corte acompanha o gato, e o que ele corta aparece em azul-marinho, como poché.</p>
      <div class="nk-layout">
        <div class="nk-play">
          <div class="nk-stage fr-stage" id="frame-stage" tabindex="0" role="application"
            aria-label="Minijogo: um gato na Building Frame of the House. Setas ou WASD andam, espaço pula, X deita ou mia perto de alguém, Q e E giram a câmera, Z aproxima, N alterna dia e noite." data-nk-a="aria-label" aria-describedby="nk-keys">
            <canvas id="fr-canvas" width="320" height="240"></canvas>
            <div class="nk-hud">
              <p class="nk-where" id="nk-where">rua · −0,05 m</p>
              <p class="nk-msg" id="nk-msg" aria-live="polite"></p>
              <div class="nk-tools">
                <button type="button" id="nk-view" aria-label="ver a casa inteira, fechada, de longe" aria-pressed="false" title="casa de longe (V)" data-nk-a="aria-label,title">${ICON.house}</button>
                <button type="button" id="nk-zoom" aria-label="aproximar ou afastar a câmera" title="aproximar ou afastar (Z)" data-nk-a="aria-label,title">−</button>
                <button type="button" id="nk-night" aria-label="alternar entre fim de tarde e noite" aria-pressed="false" title="dia ou noite (N)" data-nk-a="aria-label,title">☾</button>
                <button type="button" id="nk-sound" aria-label="ligar ou desligar os efeitos sonoros" aria-pressed="true" title="efeitos sonoros (M)" data-nk-a="aria-label,title">fx</button>
                <button type="button" id="nk-hint" aria-label="pedir uma pista do próximo objetivo" title="pista (H)" data-nk-a="aria-label,title">?</button>
              </div>
            </div>
            <div class="nk-star" id="nk-star" aria-hidden="true"></div>
            <div class="nk-dlg" id="nk-dlg" hidden aria-live="polite">
              <div class="nk-face" id="nk-face" aria-hidden="true"></div>
              <div class="nk-dlg-body">
                <p class="nk-dlg-name" id="nk-dlg-name"></p>
                <p class="nk-dlg-text" id="nk-dlg-text"></p>
                <p class="nk-dlg-tr" id="nk-dlg-tr" data-badge="tradução"></p>
                <div class="nk-choices" id="nk-choices" role="group" aria-label="o que o gato pergunta" data-nk-a="aria-label" hidden></div>
              </div>
              <span class="nk-dlg-next" aria-hidden="true">▼</span>
            </div>
            <div class="nk-start" id="nk-start">
              <p class="nk-title" data-nk="html">UM GATO NA<br>BUILDING FRAME<br>OF THE HOUSE</p>
              <p class="nk-press" data-nk>clique ou toque para começar</p>
              <p class="nk-how" data-nk>setas andam · espaço pula · X mia, deita e mexe nas coisas · H dá uma pista</p>
            </div>
            <div class="nk-end" id="nk-end" hidden>
              <p class="nk-title" data-nk>FIM DO PASSEIO</p>
              <p class="nk-end-text" id="nk-end-text"></p>
              <div class="nk-end-actions">
                <button type="button" class="nk-btn" id="nk-again" data-nk>de novo</button>
                <button type="button" class="nk-btn" id="nk-keep" data-nk>continuar andando</button>
              </div>
            </div>
            <div class="nk-tour" id="nk-tour-card" hidden aria-live="polite">
              <p class="nk-tour-k" id="nk-tour-k"></p>
              <p class="nk-tour-t" id="nk-tour-t"></p>
              <p class="nk-tour-src" id="nk-tour-src"></p>
              <div class="nk-tour-nav">
                <button type="button" id="nk-tour-prev" aria-label="laje anterior" data-nk-a="aria-label">◀</button>
                <span class="nk-tour-bar" aria-hidden="true"><i id="nk-tour-fill"></i></span>
                <button type="button" id="nk-tour-next" aria-label="próxima laje" data-nk-a="aria-label">▶</button>
                <button type="button" id="nk-tour-x" aria-label="sair do passeio" data-nk-a="aria-label">✕</button>
              </div>
            </div>
            <div class="nk-fail" id="nk-fail" hidden><p data-nk>O jogo precisa de WebGL, e este navegador não abriu. Os dados da casa continuam ao lado.</p></div>
          </div>
          <div class="nk-extra" role="group" aria-label="Outros jeitos de ver a casa" data-nk-a="aria-label">
            <button type="button" class="nk-xbtn" id="nk-tour" aria-pressed="false" data-nk>▶ passeio pelas lajes</button>
            <button type="button" class="nk-xbtn" id="nk-levels" aria-pressed="false" data-nk>cotas das lajes</button>
          </div>
          <div class="nk-player" id="nk-player" role="group" aria-label="Trilha sonora do jogo" data-nk-a="aria-label">
            <button type="button" class="nk-pl-btn" id="nk-mus-prev" aria-label="música anterior" title="anterior" data-nk-a="aria-label,title">${ICON.prev}</button>
            <button type="button" class="nk-pl-btn nk-pl-main" id="nk-mus-play" aria-label="tocar a música" aria-pressed="false" title="tocar ou pausar (P)" data-nk-a="title">${ICON.play}</button>
            <button type="button" class="nk-pl-btn" id="nk-mus-next" aria-label="próxima música" title="próxima" data-nk-a="aria-label,title">${ICON.next}</button>
            <div class="nk-pl-info">
              <p class="nk-pl-title"><span class="nk-pl-eq" aria-hidden="true"><i></i><i></i><i></i></span><span id="nk-mus-title">Uccidere in silenzio 3</span></p>
              <p class="nk-pl-author" id="nk-mus-author">Stelvio Cipriani</p>
            </div>
            <label class="nk-pl-vol" title="volume ([ e ])" data-nk-a="title">${ICON.vol}<span class="nk-sr" data-nk>volume da música</span><input type="range" id="nk-mus-vol" min="0" max="100" step="5" value="30"><span class="nk-pl-voln" id="nk-mus-vol-n" aria-hidden="true">30%</span></label>
            <button type="button" class="nk-pl-btn" id="nk-mus-file" aria-label="tocar um arquivo de música do seu computador; ele fica só no seu navegador" title="tocar um arquivo seu" data-nk-a="aria-label,title">${ICON.file}</button>
            <input type="file" id="nk-mus-input" accept="audio/*" hidden>
          </div>
          <div class="nk-pad" id="nk-pad">
            <div class="nk-dpad">
              <button type="button" data-k="ul" aria-label="andar para cima e para a esquerda" data-nk-a="aria-label">◤</button>
              <button type="button" data-k="up" aria-label="andar para cima" data-nk-a="aria-label">▲</button>
              <button type="button" data-k="ur" aria-label="andar para cima e para a direita" data-nk-a="aria-label">◥</button>
              <button type="button" data-k="left" aria-label="andar para a esquerda" data-nk-a="aria-label">◀</button>
              <button type="button" data-k="right" aria-label="andar para a direita" data-nk-a="aria-label">▶</button>
              <button type="button" data-k="dl" aria-label="andar para baixo e para a esquerda" data-nk-a="aria-label">◣</button>
              <button type="button" data-k="down" aria-label="andar para baixo" data-nk-a="aria-label">▼</button>
              <button type="button" data-k="dr" aria-label="andar para baixo e para a direita" data-nk-a="aria-label">◢</button>
            </div>
            <div class="nk-acts">
              <button type="button" data-a="rotL" aria-label="girar a câmera para a esquerda" data-nk-a="aria-label">↺</button>
              <button type="button" data-a="rotR" aria-label="girar a câmera para a direita" data-nk-a="aria-label">↻</button>
              <button type="button" data-a="lie" id="nk-act">deitar</button>
              <button type="button" data-a="jump" data-nk>pular</button>
            </div>
          </div>
          <p class="nk-keys" id="nk-keys" data-nk>setas ou WASD andam · espaço pula · X mexe nas coisas: mia, deita, derruba, aperta · na conversa, setas ou 1 a 3 escolhem · Q e E giram · Z aproxima · V vê a casa de longe · N dia e noite · M efeitos · P música, [ e ] volume · H pista · T passeio · C cotas · no controle: analógico anda, A pula, X mexe, Y vê de longe</p>
        </div>
        <aside class="nk-side" aria-label="Objetivos, percurso e dados da casa" data-nk-a="aria-label">
          <h4 data-nk>Objetivos</h4>
          <ul class="nk-goals">
            <li data-goal="slabs"><span data-nk>Passar pelas sete lajes</span> <span class="nk-count" id="nk-slabs">0/7</span></li>
            <li data-goal="talk"><span data-nk>Miar com o Masato Igarashi</span> <span class="nk-count" id="nk-talk">0/5</span></li>
            <li data-goal="shelf"><span data-nk>Subir pela estante acima de 3 m</span></li>
            <li data-goal="vacant"><span data-nk>Ir ao terreno vazio ao lado</span></li>
            <li data-goal="light"><span data-nk>Cochilar na luz do norte, no interpavimento</span></li>
          </ul>
          <h4 data-nk>Extras</h4>
          <ul class="nk-goals nk-extras">
            <li data-extra="book"><span data-nk>Derrubar um livro da estante</span></li>
            <li data-extra="cats"><span data-nk>Fazer amizade com os gatos do bairro</span> <span class="nk-count" id="nk-cats">0/3</span></li>
            <li data-extra="vend"><span data-nk>Tirar alguma coisa das máquinas da rua</span></li>
            <li data-extra="knead"><span data-nk>Fazer pãozinho numa almofada</span></li>
            <li data-extra="view"><span data-nk>Ver a casa inteira, de longe</span></li>
          </ul>
          <h4><span data-nk>Caderninho de segredos</span> <span class="nk-count" id="nk-secret-n">0/9</span></h4>
          <ul class="nk-goals nk-notebook" id="nk-notebook"></ul>
          <h4 data-nk>Percurso</h4>
          <dl class="nk-stats">
            <div><dt data-nk>andado</dt><dd id="nk-dist">0,0 m</dd></div>
            <div><dt data-nk>subida</dt><dd id="nk-climb">0,0 m</dd></div>
            <div><dt data-nk>saltos</dt><dd id="nk-jumps">0</dd></div>
            <div><dt data-nk>tempo</dt><dd id="nk-time">0:00</dd></div>
          </dl>
          <h4 data-nk>Quem mora</h4>
          <p class="nk-side-note nk-side-lead" data-nk>Masato e Tomoko Igarashi, que moram na casa, projeto da IGArchitects. A figura da Tomoko segue a leitora de uma das fotos da casa: cabelo curto castanho-escuro, roupa clara e comprida, livro claro, a poltrona de assento azul junto ao vidro. Que a leitora seja ela é inferência [inferência]. A figura do Masato é genérica: nenhuma foto dele foi consultada.</p>
          <p class="nk-side-note" data-nk>O que o Masato diz traduz livremente o e-mail dele de 24 ago. 2026 e o texto do escritório publicado na architecturephoto; a citação com nomes foi autorizada pela IGArchitects em 27 ago. 2026. As falas do gato, dos gatos do bairro e do narrador são inventadas.</p>
          <h4 data-nk>A casa, na planilha</h4>
          <dl class="nk-data" id="nk-data">${dataRows()}</dl>
          <p class="nk-side-note" id="nk-sheet-note">A planilha (aba 01 casas base) registra ${HOUSE ? HOUSE.floors : 7} pavimentos; a ficha do projeto declara dois (2階建) e descreve sete lajes. O número da planilha parece contar as lajes [VERIFICAR]. Os números do percurso são do modelo.</p>
        </aside>
      </div>
      <details class="world-conv nk-conv"><summary data-nk>O que é dado e o que é modelo</summary>
        <p class="city-note nk-en-note" hidden>These notes stay in Portuguese, as written: they list the sources, the data and what was modelled. In the English version of the game, Masato’s lines are the words of his email of 24 Aug. 2026, unchanged, and the lines about the house are free translations of the architects’ Japanese text (architecturephoto, 2023). The cats’ and the narrator’s lines are invented.</p>
        <p class="city-note"><strong>Dado.</strong> Lote de 42,19 m², projeção de 31,40 m², área total de 59,88 m², concreto armado, Tóquio, conclusão em abril de 2023: ficha do projeto na architecturephoto. Lote, projeção e área coincidem com a planilha. A ficha declara dois pavimentos (2階建) e a planilha registra sete; o sete parece contar as lajes [VERIFICAR]. Os créditos da ficha incluem iluminação (Modulex), serralheria sob medida (Kamo Craft) e cortinas (Fabricscape).</p>
        <p class="city-note"><strong>Texto dos arquitetos.</strong> Na architecturephoto, em japonês: a casa é um cômodo só, quase sem paredes internas, feito de lajes, paredes e desníveis; foi feita para um casal que vive e trabalha sem fronteira clara e quer sentir a presença um do outro em qualquer lugar. A parede norte foi deslocada para abrir a casa ao terreno vazio vizinho, e três paredes e sete lajes se sobrepõem sem interromper o percurso de cima a baixo. As aberturas evitam olhar para os vizinhos; ao sul não há nenhuma, e a luz entra o dia todo por cima da parede norte. As lajes escondem da rua as funções privadas, como paredes ou brises: no fundo, longe das aberturas, ficam cozinha e banho; perto da rua, o vão se alarga e as aberturas crescem. Sem lugar para jardim ou terraço, o vidro grande, aberto, faz da casa um jardim. A partir do genkan, o espaço muda aos poucos, e escadas e móveis na escala do corpo ocupam um esqueleto de concreto grande como uma ruína.</p>
        <p class="city-note"><strong>Ordem dos níveis.</strong> As legendas das fotos na architecturephoto dividem a casa em 1階（下）, 1階（上）, 2階（下） e 2階（上）. A entrada fica no 1階（下）, de onde se olha para cima, em direção à cozinha; a cozinha e um trecho da estante estão no 1階（上）; do 2階（下） se veem a rua, a estante e o 水廻り (banho) do 2階（上）, que fica ao lado de um 吹抜 (vazio). A mesma página publica plantas de 1階, 2階 e 3階 e um corte. A Stirworld descreve o percurso: no térreo, a mesa onde o casal come junto ou onde um dos dois trabalha; uma escada leva à cozinha, num mezanino; 1,6 m acima dela fica a área de dormir; dali saem duas escadas, uma para o banho e outra para uma borda que serve de varanda (“balcony ledge”); a estante vai do chão ao último nível e se encaixa na escada ao lado; há claraboias. A #casa (2025) confirma que é a casa do próprio arquiteto e resume: LDK e lugar de trabalho no 1階; quarto e 水回り mais acima; terraço do lado da rua. O jogo segue essa ordem, com as cotas do corte em relação ao chão médio do terreno (GL): térreo, em tijolo, a −0,215 m; vão sob a cozinha a +0,10; cozinha a +2,15; interpavimento a +3,35; quarto a +3,80; banho a +5,10; terraço a +6,02.</p>
        <p class="city-note"><strong>Desenhos e fotos.</strong> As plantas do 1階 e do 2階 (esta em duas, uma por nível), as quatro elevações e o corte do projeto (IGArchitects), com três fotos da casa (fachada, vazio e térreo), guardados na pasta da pesquisa, dão as alturas, a posição das lajes em planta, as escadas, a parede norte em três placas que recuam 50 cm uma da outra, com vidro nas frestas, os vidros altos do vazio e a fachada. O modelo foi conferido sobrepondo vistas de cima às plantas e medindo o corte e as elevações na escala dos desenhos. Daí vêm: no térreo, as vigas dos eixos X2 e X3 aflorando a +0,10, uma como faixa de tijolo entre a entrada e a mesa (os espelhos da faixa em tijolo são inferência [inferência]), a outra como base de concreto diante das tábuas do vão sob a cozinha (corte, planta do 1階 e foto do térreo); a escada da cozinha com seis espelhos de 20 cm, pisadas de 22 cm e um patamar junto à placa norte; a escada do interpavimento ao banho começando com quatro degraus em leque; a escada de marinheiro em pé, encostada na borda do quarto, logo ao lado do primeiro degrau em leque (nas plantas do 2階, entre 0,57 e 0,98 m da parede sul); no banho, o box de vidro do chuveiro e o lavabo no canto sudeste, com o vaso de costas para a parede sul; no terraço, muretas baixas e nenhum guarda-corpo; a laje de cima, mais fina nos balanços; as juntas dos painéis de agregado, em três colunas e quatro fiadas; e as alturas das janelas da pia e do banho. As fotos mostram o piso de tijolo do térreo, o carvalho do interpavimento, os degraus de concreto em balanço, a escada de aço, a escada de marinheiro, a estante, a mesa com cavaletes pretos, que corre de norte a sul com as cadeiras do lado dos fundos, o trilho de luz com pendentes e spot no mesmo sentido, a cozinha de armários escuros com a prateleira de copos sobre a janela, a escada de marinheiro com seis vãos de uns 45 cm e os montantes curvados por cima da laje do terraço, como alças, a cortina branca do quarto, o conduíte fino no teto do quarto, a caixa de correio na face norte da placa da frente, as duas folhas de aço preto, os painéis de agregado da frente e a faixa de pedrisco claro entre a fachada e a rua. As luminárias do jogo copiam o que aparece nas fotos; a ficha credita a iluminação à Modulex, sem dizer quais peças. As claraboias que a Stirworld cita não são localizadas no texto; nos desenhos, a luz de cima entra pelos vidros altos do vazio (a oeste, sobre o terraço; a leste, sobre o banho) e pelas frestas de vidro da parede norte, e o jogo trata esses vidros como as claraboias [inferência]. Na planta do térreo, a borda do tablado tem o que parece ser o desenho de uma cortina [inferência].</p>
        <p class="city-note"><strong>Outras publicações.</strong> Um cômodo só (ArchDaily; Dezeen). Estante na altura toda da parede sul; cozinha no fundo do térreo e banho no fundo do primeiro andar, com quartos e estar na frente, atrás de vidro na altura toda; escadas de aço preto e uma escada de marinheiro; concreto com marca de fôrma, piso de madeira e bancada de metal (Dezeen). Degraus em balanço, piso de carvalho, trechos de tijolo de terracota e compensado cru (Thisispaper). Pisos de madeira BAREFOOT, tijolo (レンガタイル) e porcelanato Archetipo Nero; o arquiteto tinha muitos livros e quis guardar todos (kenzai-navi). Nas fotos, o tijolo está no térreo e o carvalho no interpavimento; o porcelanato preto no banho continua inferência do modelo. As cortinas da ficha (Fabricscape) aparecem na foto do vazio, no quarto.</p>
        <p class="city-note"><strong>Vizinhança.</strong> Confirmado nas fontes: a rua na frente, o terreno vazio ao norte e vizinhos dos lados, de quem as aberturas desviam o olhar (architecturephoto); casas ao lado, num terreno apertado de cidade densa (Thisispaper). Todo o resto do entorno é inventado: a placa de 売地 (terreno à venda) no terreno vazio, porque as fontes não dizem se ele está à venda, o tipo e a cor das casas vizinhas, o que fica do outro lado da rua, a máquina de bebidas, as máquinas de cápsulas, a cerejeira do terreno vazio, o poste, a fiação, os bichos e os três gatos do bairro (Mina, Mike e Jiji). O ciclista e as duas colegiais voltando da escola também são inventados: figuras genéricas, de uniforme genérico, que não retratam ninguém; elas só passam de dia e param para olhar o gato. De noite, a Mina acorda e brinca de pega-pega com a Jiji no terreno vazio, e a Mike assiste de cima da máquina; os vaga-lumes também são inventados. Nos desenhos, a fachada da rua é a elevação oeste (西側立面図): a rua fica a oeste e o terreno vazio, ao norte.</p>
        <p class="city-note"><strong>Moradores e falas.</strong> A casa é a moradia dos próprios arquitetos; a designboom lista Tomoko e Masato Igarashi como clientes. As falas do Masato traduzem livremente, em tom de conversa e sem acrescentar informação, as respostas 1, 2, 3 e 5 do e-mail de 24 ago. 2026 e o pedido, no mesmo e-mail, de ler o trabalho pronto; onde ele escreve “thesis”, o jogo diz “pesquisa”. A ordem da conversa é do jogador, que escolhe o assunto; as perguntas e as reações do gato são inventadas. As quatro conversas extras sobre a casa traduzem o texto dos arquitetos publicado na architecturephoto (2023), passado para a fala. A citação foi autorizada pela IGArchitects em 27 ago. 2026: “You are welcome to quote brief excerpts from our replies, including our names, office name, and full references.” A Tomoko não fala no jogo, porque não há fala dela registrada. As falas do gato, dos gatos do bairro e do narrador são inventadas. Os bonecos das pessoas e dos gatos são de brinquedo, com cabeça grande, e não estão em escala com a casa; os gestos deles (o gole de café, a página virada, a lambida na pata) também são inventados.</p>
        <p class="city-note"><strong>Originais das falas.</strong> E-mail de 24 ago. 2026, em inglês: “In this project, we did not consider regulations as ‘constraints’ on the design. Regulations such as diagonal plane restrictions and fire-prevention requirements were not obstacles to be overcome, but rather part of the surrounding environment and clues that informed the design.” · “We believe that residential lots in Tokyo will continue to become smaller. In fact, we are currently designing a house on a site even smaller than that of Building Frame of the House. We believe this tendency is, in large part, the result of the widening gap between the rising cost of living and wages that have not increased at the same pace. As this gap continues to widen year by year, smaller lots and more compact ways of living may become increasingly common.” · “There is a richness to space that cannot be fully understood through photographs and drawings alone. The human ability to adapt is remarkable, and every time we visit our clients after the completion of a project, we are surprised by how they have made the space their own and how they live within it. Many architectural photographs and academic studies capture a building only at the moment of its completion. We think it would be wonderful if your thesis could also address what happens afterward: how the residents adapt to the house, how their everyday lives transform the space, and how the architecture continues to change through inhabitation over time.” · “Every residential project is based on different conditions: the client, the budget, the site, and many other factors. For this reason, the question of how we would design this house if we were designing it today is a very difficult one to answer. However, regardless of whether a project is in Tokyo or elsewhere, our projects are designed according to the same fundamental philosophy. We try to create spaces with a certain strength and resilience, spaces that can continue to be used even as time passes and their function or occupants change. We consider everything in the design: structure, space itself, and environmental elements such as light and wind. Another important aspect of our work is the desire to create spaces that offer experiences people may not have encountered before.” · “Once your thesis is completed, we would very much appreciate it if you could share the finished thesis with us. We would be very interested to see how our project has been understood and analyzed within your broader research.” Texto dos arquitetos, architecturephoto, 2023, em japonês: 「この小さな建築は大きなワンルームだ。内部に壁らしい壁はほとんどなく、床と壁とその段差だけで空間がつくられている。」 · 「クライアントは生活と仕事の境界があいまいで、どこにいても仕事ができて、どこにいてもお互いの気配を感じられるそんな住宅をイメージされていた。」 · 「床に配された機能は、床の小ささ故に単独で完結することはなく、ずれた他の床にまたがるようにして成り立っている。さっきまで床だった場所が椅子になり、机になり、棚になり、天井になる。」 · 「遺跡のように大きく、力強いRCの躯体の中に、人のスケールに合わせた階段や家具を配することで、人のために設えつつも、その設えたイメージを超える豊かさをつくりだそうとしている。」</p>
        <p class="city-note"><strong>Interações.</strong> O livro que cai, a toalha, as latas, as cápsulas, a moeda embaixo da máquina, o teclado, o pãozinho, a caixa de papelão, o maneki-neko, a borboleta, a chuva de pétalas, a cerejeira que solta pétalas quando o gato arranha o tronco, a piscada lenta da Jiji, o sino de templo de noite e o pianinho de brinquedo foram inventados para o jogo, assim como os preços, o troco, os nove segredos escondidos no passeio e os degraus de gato da estante, que saem do alto da escada de marinheiro e sobem para o fundo, por cima da escada de aço: são do jogo, não da casa. Os livros que caem da estante têm título, autor e uma frase sobre a história; no décimo oitavo livro, o narrador desconfia de um padrão: Babel, de R. F. Kuang; Coraline, de Neil Gaiman; The Nightmare Before Christmas, de Tim Burton; Arakawa Under the Bridge, de Hikaru Nakamura; Beasts of Burden, de Evan Dorkin e Jill Thompson; Persépolis, de Marjane Satrapi; O Labirinto do Fauno, de Guillermo del Toro e Cornelia Funke; Terminal Boredom, de Izumi Suzuki; Heaven e Breasts and Eggs, de Mieko Kawakami; My Year of Rest and Relaxation e Eileen, de Ottessa Moshfegh; The Secret History, de Donna Tartt; The Lost Daughter, de Elena Ferrante; Pollyanna, de Eleanor H. Porter; Kitchen, de Banana Yoshimoto; Convenience Store Woman, de Sayaka Murata; The Bell Jar, de Sylvia Plath; A Certain Hunger, de Chelsea G. Summers; Everyone in This Room Will Someday Be Dead, de Emily Austin; Fleabag: The Scriptures, os roteiros da série, de Phoebe Waller-Bridge; Girl, Interrupted, de Susanna Kaysen; Mistborn e Yumi and the Nightmare Painter, de Brandon Sanderson; The Long Way to a Small, Angry Planet, de Becky Chambers; e The Hole, de Hiroko Oyamada. São brincadeira do jogo, não a biblioteca dos moradores. O pianinho toca, com as duas mãos, a abertura do Noturno op. 9 n.º 2, de Chopin (anacruse e compassos 1 a 3), e, depois de um desafio, o tema de La Campanella, de Liszt (compassos 5 a 12, com um acorde final acrescentado para fechar). As notas vêm de partituras em domínio público, em MusicXML, do acervo musetrainer/library, no GitHub; o som imita um pianinho de brinquedo, sintetizado no navegador. Apertar X no pianinho enquanto ele toca para a música. Depois do La Campanella vem uma curiosidade sobre o Liszt: a Lisztomania (Heinrich Heine, 1844) e a fuga com a condessa Marie d’Agoult. O trecho do Concerto n.º 2 de Rachmaninoff (3º movimento, compassos 123 a 147, o tema dolce) vem da redução para piano de "Aehneletuer" no MuseScore, em PDF enviado pela autora; as alturas foram lidas da posição de cada nota no PDF. Se o gato sai do lugar, a música para. Nada disso descreve a casa nem os moradores. O passeio guiado e as cotas das lajes usam as cotas do corte. Objetivos, extras e o caderninho de segredos recomeçam do zero a cada visita. A pista (H ou o botão ?) aponta o próximo objetivo e onde ele fica.</p>
        <p class="city-note"><strong>Trilha.</strong> A música padrão do jogo é Uccidere in silenzio 3, de Stelvio Cipriani, uma gravação escolhida pela autora, que toca em loop; a licença de uso não está registrada [VERIFICAR antes de tornar a página pública]. Nas setas do player vêm as outras quatro (Sete lajes, Testa de gato, Terreno vazio e Luz do norte), composições originais feitas em código para esta página e tocadas pelo próprio navegador, sem gravação externa nem melodia de outra obra. O botão de arquivo toca uma música do seu computador só no seu navegador, sem enviar o arquivo a lugar nenhum. A música começa junto com o jogo, subindo aos poucos em três segundos; o P pausa, e ela descansa quando o jogo sai da tela. Os sons de ambiente (pardais, um trem ao longe, grilos de outono, o zumbido da máquina de bebidas) também são sintetizados no navegador e inventados para o jogo; o gato anda em silêncio.</p>
        <p class="city-note"><strong>Modelo.</strong> Fora as medidas tiradas dos desenhos, foram desenhados livremente: a espessura das lajes, os móveis e objetos, os livros, o que se guarda no vão sob a cozinha (o uso dele não aparece nas fontes), a caminha do gato, as figuras dos moradores (a da Tomoko a partir da foto do vazio, como dito acima) e o jeito de abrir das folhas de aço da frente (na planta, uma linha tracejada na frente dos painéis de agregado sugere que correm para ali [inferência]). Simplificações conhecidas: o lote é um trapézio nos desenhos e um retângulo no jogo; ficaram de fora a estrutura de aço com prateleira ao lado da escada da cozinha (foto do térreo) e duas peças que as plantas do banho mostram sem dizer o que são, uma divisória fina no corredor e um bloco hachurado junto ao lavabo; a altura do degrau de madeira diante da faixa de tijolo é estimada; a folha de correr do vidro alto fica aberta no jogo, para o gato passar; no corte, o piso do terraço tem uma linha tracejada por cima da impermeabilização, que o jogo lê como um deque de madeira [inferência]. Quando a câmera esconde uma parede para mostrar o interior, fica o pé dela, com o topo em azul-marinho, como poché: pelo corte, o térreo está 21,5 cm abaixo do terreno, e a mesa fica num trecho 31,5 cm abaixo da faixa de tijolo, como mostra a foto do térreo. Não é levantamento, não reproduz os desenhos do escritório e não deve ser citado como planta da casa. A casa não tem gato registrado: o gatinho e os gatos do bairro são personagens do jogo.</p>
        <p class="city-note"><strong>Divergências.</strong> A Dezeen escreve Saitama numa frase e Tóquio em outras; a ficha da architecturephoto diz 東京都 (Tóquio), sem bairro; a planilha registra Ota [VERIFICAR a fonte do bairro]. A ficha diz 2階建, mas a página publica uma planta de 3階 [VERIFICAR: provável loft ou cobertura, que não conta como pavimento].</p>
        <p class="city-note"><strong>Fontes.</strong> <a href="https://architecturephoto.net/192568/" target="_blank" rel="noopener">architecturephoto, ficha e texto dos arquitetos</a> · <a href="https://www.archdaily.com/1008641/building-frame-of-the-house-igarchitects" target="_blank" rel="noopener">ArchDaily</a> · <a href="https://www.dezeen.com/2023/12/14/igarchitects-building-frame-of-the-house-japan/" target="_blank" rel="noopener">Dezeen, 14 dez. 2023</a> · <a href="https://www.designboom.com/architecture/igarchitects-flexible-urban-living-tokyo-house-frame-10-24-2023/" target="_blank" rel="noopener">designboom, 24 out. 2023</a> · <a href="https://www.thisispaper.com/mag/building-frame-of-the-house-igarchitects" target="_blank" rel="noopener">Thisispaper</a> · <a href="https://www.stirworld.com/see-features-thinking-within-a-box-this-residential-design-prioritises-comfort-in-a-set-form" target="_blank" rel="noopener">Stirworld</a> · <a href="https://hash-casa.com/2025/10/30/buildingframeofthehouse/" target="_blank" rel="noopener">#casa, 30 out. 2025</a> · <a href="https://www.kenzai-navi.com/spacedesign/page92/" target="_blank" rel="noopener">kenzai-navi (すまいりんぐ)</a> · Masato Igarashi (IGArchitects), e-mail a Isadora Nogueira, 24 ago. 2026 · IGArchitects, e-mail a Isadora Nogueira, 27 ago. 2026.</p>
      </details>
    </article>`;
  }

  const anchor = document.createElement("div");
  anchor.innerHTML = block();
  const node = anchor.firstElementChild;
  host.insertBefore(node, host.querySelector(".nk-slot") || host.firstElementChild);

  /* ---------------------------------------------------------------------
     interface: pílulas e cartões arredondados, fonte Urbanist, sombras
     macias. Fica aqui, e não na folha de estilos, para mexer só no jogo
     --------------------------------------------------------------------- */
  const UI_CSS = `
#block-frame .nk-stage { border-radius: 18px; box-shadow: 0 10px 30px rgba(16, 38, 74, .16); }
#block-frame .nk-stage canvas { image-rendering: auto; }
#block-frame .nk-hud { font-family: "Urbanist", "Roboto", sans-serif; }
#block-frame .nk-where { left: 12px; top: 12px; padding: 7px 14px 7px 12px; border-radius: 999px; background: rgba(255, 255, 255, .9); color: #10264a; font: 700 12.5px/1.1 "Urbanist", sans-serif; letter-spacing: .07em; text-transform: uppercase; box-shadow: 0 4px 14px rgba(16, 38, 74, .18); }
#block-frame .nk-where::before { content: ""; display: inline-block; width: 8px; height: 8px; margin-right: 8px; border-radius: 50%; background: #f29e4c; box-shadow: 0 0 0 3px rgba(242, 158, 76, .25); vertical-align: 1px; }
#block-frame .fr-stage.night .nk-where::before { background: #9fb6ff; box-shadow: 0 0 0 3px rgba(159, 182, 255, .28); }
#block-frame .nk-msg { top: 58px; padding: 9px 18px 10px; border-radius: 16px; background: rgba(255, 253, 248, .96); color: #1d2940; font: 600 14.5px/1.35 "Urbanist", sans-serif; box-shadow: 0 8px 22px rgba(16, 38, 74, .2); transform: translate(-50%, -6px) scale(.97); transition: opacity .25s, transform .35s cubic-bezier(.2, 1.4, .4, 1); max-width: min(560px, calc(100% - 32px)); text-wrap: balance; }
#block-frame .nk-msg.on { transform: translate(-50%, 0) scale(1); }
#block-frame .nk-tools { right: 12px; top: 12px; gap: 8px; }
#block-frame .nk-tools button { width: 38px; height: 38px; padding: 0; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .92); color: #10264a; font: 700 17px/1 "Urbanist", sans-serif; box-shadow: 0 4px 12px rgba(16, 38, 74, .2); transition: transform .15s, background .15s, color .15s; }
#block-frame .nk-tools button:hover, #block-frame .nk-tools button:focus-visible { background: #fff; color: #10264a; transform: translateY(-2px); }
#block-frame .nk-tools button:active { transform: scale(.93); }
#block-frame .nk-tools #nk-view[aria-pressed="true"] { background: #10264a; color: #fff; }
#block-frame .nk-tools #nk-sound { font-size: 13px; letter-spacing: 0; }
#block-frame .nk-tools button svg { width: 17px; height: 17px; margin: 0 auto; }
#block-frame .nk-dlg { left: 16px; right: 16px; bottom: 16px; grid-template-columns: 72px 1fr; gap: 16px; align-items: center; padding: 18px 46px 16px 16px; border: 0; border-radius: 26px; background: #fffdf7; box-shadow: 0 12px 32px rgba(16, 38, 74, .32), inset 0 0 0 4px #fffdf7, inset 0 0 0 6px #eadfcc; color: #1d2940; font-family: "Urbanist", sans-serif; }
#block-frame .nk-dlg.pop { animation: nkPop .3s cubic-bezier(.2, 1.4, .4, 1); }
@keyframes nkPop { from { transform: translateY(10px) scale(.98); opacity: .5; } }
#block-frame .nk-dlg[data-who="narr"] { grid-template-columns: 1fr; padding-left: 24px; background: #f6f1e7; }
#block-frame .nk-dlg[data-who="narr"] .nk-dlg-text { font-style: italic; font-weight: 500; color: #56617a; }
#block-frame .nk-face { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; background: #fff; box-shadow: 0 4px 12px rgba(16, 38, 74, .2), 0 0 0 4px #fff; }
#block-frame .nk-face svg { display: block; width: 100%; height: 100%; }
#block-frame .nk-face[hidden] { display: none; }
#block-frame .nk-dlg.pop .nk-face { animation: nkNod .35s ease-out; }
@keyframes nkNod { 40% { transform: translateY(-4px) rotate(-3deg); } }
#block-frame .nk-dlg-name { position: absolute; left: 98px; top: -13px; margin: 0; padding: 5px 13px 6px; border-radius: 999px; background: #7aa7a1; color: #fff; font: 700 11.5px/1 "Urbanist", sans-serif; letter-spacing: .1em; box-shadow: 0 4px 10px rgba(16, 38, 74, .22); }
#block-frame .nk-dlg[data-who="masato"] .nk-dlg-name { background: #3f6fb5; }
#block-frame .nk-dlg[data-who="tomoko"] .nk-dlg-name { background: #d99a2b; }
#block-frame .nk-dlg[data-who="mina"] .nk-dlg-name { background: #e07b3a; }
#block-frame .nk-dlg[data-who="mike"] .nk-dlg-name { background: #d9654a; }
#block-frame .nk-dlg[data-who="jiji"] .nk-dlg-name { background: #5a4e7a; }
#block-frame .nk-dlg-text { min-height: 1.3em; font: 600 clamp(15.5px, 1.9vw, 19px)/1.4 "Urbanist", sans-serif; }
#block-frame .nk-dlg[data-who="cat"] .nk-dlg-text, #block-frame .nk-dlg[data-who="mina"] .nk-dlg-text, #block-frame .nk-dlg[data-who="mike"] .nk-dlg-text, #block-frame .nk-dlg[data-who="jiji"] .nk-dlg-text { min-height: 0; font: 700 clamp(16px, 2vw, 20px)/1.28 "Urbanist", sans-serif; letter-spacing: .01em; color: #10264a; }
#block-frame .nk-dlg-tr { margin: 7px 0 0; color: #45546e; font: 500 .93rem/1.42 "Roboto", sans-serif; }
#block-frame .nk-dlg-tr::before { content: attr(data-badge); display: inline-block; margin-right: 8px; padding: 2px 8px 3px; border-radius: 999px; background: #eef2f7; color: #7a879b; font: 700 9.5px/1.4 "Urbanist", sans-serif; letter-spacing: .1em; text-transform: uppercase; vertical-align: 1px; }
#block-frame .nk-dlg-next { right: 20px; bottom: 16px; width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid #f29e4c; font-size: 0; animation: nkBob .9s ease-in-out infinite; }
@keyframes nkBob { 50% { transform: translateY(4px); } }
#block-frame .nk-dlg.asking .nk-dlg-next { display: none; }
#block-frame .nk-choices { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
#block-frame .nk-choices[hidden] { display: none; }
#block-frame .nk-choices button { padding: 8px 14px 9px; border: 0; border-radius: 999px; background: #eef2f7; color: #10264a; font: 700 13.5px/1.1 "Urbanist", sans-serif; cursor: pointer; transition: transform .15s, background .15s, color .15s, box-shadow .15s; }
#block-frame .nk-choices button .k { display: inline-grid; place-items: center; width: 17px; height: 17px; margin-right: 7px; border-radius: 50%; background: rgba(16, 38, 74, .1); font-size: 10.5px; }
#block-frame .nk-choices button.sel, #block-frame .nk-choices button:hover { background: #10264a; color: #fff; box-shadow: 0 5px 14px rgba(16, 38, 74, .3); transform: translateY(-1px); }
#block-frame .nk-choices button.sel .k, #block-frame .nk-choices button:hover .k { background: rgba(255, 255, 255, .2); }
#block-frame .nk-start { align-content: space-between; padding: 9% 16px 8%; background: linear-gradient(rgba(16, 38, 74, .42), rgba(16, 38, 74, 0) 42%, rgba(16, 38, 74, 0) 70%, rgba(16, 38, 74, .35)); font-family: "Urbanist", sans-serif; }
#block-frame .nk-title { font: 700 clamp(24px, 4.2vw, 42px)/1 "Urbanist", sans-serif; letter-spacing: .01em; text-shadow: 0 4px 0 #10264a, 0 12px 26px rgba(16, 38, 74, .45); }
#block-frame .nk-press { justify-self: center; padding: 11px 22px 12px; border-radius: 999px; background: #fff; color: #10264a; font: 700 14.5px/1 "Urbanist", sans-serif; letter-spacing: .02em; box-shadow: 0 6px 18px rgba(16, 38, 74, .3); animation: nkPulse 1.8s ease-in-out infinite; }
@keyframes nkPulse { 50% { transform: scale(1.05); } }
#block-frame .nk-end { background: rgba(9, 23, 44, .6); font-family: "Urbanist", sans-serif; }
#block-frame .nk-end-text { font: 500 15.5px/1.5 "Roboto", sans-serif; }
#block-frame .nk-btn { padding: 11px 20px 12px; border: 0; border-radius: 999px; background: #fff; color: #10264a; font: 700 14.5px/1 "Urbanist", sans-serif; box-shadow: 0 6px 16px rgba(0, 0, 0, .25); }
#block-frame .nk-btn:hover, #block-frame .nk-btn:focus-visible { background: #f7dcbf; color: #10264a; }
#block-frame .nk-fail { font-family: "Roboto", sans-serif; }
#block-frame .nk-player { border-radius: 20px; padding: 10px 14px; background: linear-gradient(135deg, #10264a, #26457c); font-family: "Urbanist", sans-serif; box-shadow: 0 8px 22px rgba(16, 38, 74, .18); }
#block-frame .nk-pl-title { font: 700 15.5px/1.1 "Urbanist", sans-serif; }
#block-frame .nk-pl-voln { font: 600 12px "Urbanist", sans-serif; }
#block-frame .nk-pl-eq i { border-radius: 2px; }
#block-frame .nk-pad button { font: 700 17px/1 "Urbanist", sans-serif; box-shadow: 0 4px 10px rgba(16, 38, 74, .25); }
#block-frame .nk-pad .nk-acts button { font-size: 13px; }
#block-frame .nk-where { box-sizing: border-box; }
#block-frame .nk-extra { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 0; }
#block-frame .nk-xbtn { padding: 8px 14px 9px; border: 0; border-radius: 999px; background: #eef2f7; color: #10264a; font: 700 13px/1.1 "Urbanist", sans-serif; cursor: pointer; transition: background .15s, color .15s, transform .15s; }
#block-frame .nk-xbtn:hover, #block-frame .nk-xbtn:focus-visible { background: #dfe7f1; transform: translateY(-1px); }
#block-frame .nk-xbtn[aria-pressed="true"] { background: #10264a; color: #fff; }
#block-frame .nk-tour { position: absolute; left: 16px; right: 16px; bottom: 16px; padding: 14px 18px 12px; border-radius: 22px; background: rgba(255, 253, 247, .97); color: #1d2940; box-shadow: 0 12px 30px rgba(16, 38, 74, .3), inset 0 0 0 4px #fffdf7, inset 0 0 0 6px #eadfcc; font-family: "Urbanist", sans-serif; }
#block-frame .nk-tour[hidden] { display: none; }
#block-frame .nk-tour-k { margin: 0 0 5px; color: #d9822b; font: 800 12px/1.2 "Urbanist", sans-serif; letter-spacing: .09em; text-transform: uppercase; }
#block-frame .nk-tour-t { margin: 0; font: 600 clamp(13.5px, 1.5vw, 15.5px)/1.38 "Urbanist", sans-serif; }
#block-frame .nk-tour-src { margin: 6px 0 0; color: #6a7688; font: 500 12px/1.35 "Roboto", sans-serif; }
#block-frame .nk-tour-nav { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
#block-frame .nk-tour-nav button { width: 30px; height: 30px; padding: 0; border: 0; border-radius: 50%; background: #eef2f7; color: #10264a; font: 700 12px/1 "Urbanist", sans-serif; cursor: pointer; }
#block-frame .nk-tour-nav button:hover, #block-frame .nk-tour-nav button:focus-visible { background: #10264a; color: #fff; }
#block-frame .nk-tour-bar { flex: 1; height: 5px; border-radius: 3px; background: #eef2f7; overflow: hidden; }
#block-frame .nk-tour-bar i { display: block; width: 0; height: 100%; background: #f29e4c; }
#block-frame .nk-notebook li { font-size: .92em; }
#block-frame .nk-goals li.next:not(.done) { font-weight: 700; }
#block-frame .nk-goals li.next:not(.done)::after { content: attr(data-now); margin-left: 8px; padding: 1px 7px 2px; border-radius: 999px; background: #f29e4c; color: #fff; font: 700 10px/1.4 "Urbanist", sans-serif; letter-spacing: .06em; vertical-align: 1px; }
#block-frame .nk-goals li.pulse { animation: nkGoalPulse 1.4s ease-out 2; }
@keyframes nkGoalPulse { 0% { background: rgba(242, 158, 76, .35); } 100% { background: transparent; } }
#block-frame .nk-start .nk-how { justify-self: center; max-width: min(560px, calc(100% - 32px)); margin: 10px 16px 0; padding: 7px 14px 8px; border-radius: 14px; background: rgba(255, 253, 248, .92); color: #1d2940; font: 600 12.5px/1.45 "Urbanist", sans-serif; text-align: center; box-shadow: 0 4px 14px rgba(16, 38, 74, .2); }
#block-frame .nk-notebook .nk-hint { color: #6a7688; font-style: italic; }
@media (max-width: 640px) {
  #block-frame .nk-tour { left: 6px; right: 6px; bottom: 6px; padding: 10px 12px 9px; border-radius: 16px; }
  #block-frame .nk-tour-t { font-size: 12.5px; }
  #block-frame .nk-tour-src { font-size: 10.5px; }
  #block-frame .nk-xbtn { font-size: 12px; padding: 7px 11px 8px; }
  #block-frame .nk-where { left: 8px; top: 8px; max-width: calc(100% - 162px); padding: 6px 10px 6px 9px; font-size: 10.5px; letter-spacing: .05em; }
  #block-frame .nk-where::before { width: 6px; height: 6px; margin-right: 6px; }
  #block-frame .nk-tools { right: 8px; top: 8px; gap: 5px; }
  #block-frame .nk-tools button { width: 32px; height: 32px; font-size: 14px; }
  #block-frame .nk-tools button svg { width: 15px; height: 15px; }
  #block-frame .nk-tools #nk-sound { font-size: 11px; }
  #block-frame .nk-dlg { left: 6px; right: 6px; bottom: 6px; grid-template-columns: 40px 1fr; gap: 9px; padding: 14px 26px 10px 9px; border-radius: 18px; box-shadow: 0 8px 22px rgba(16, 38, 74, .3), inset 0 0 0 3px #fffdf7, inset 0 0 0 4px #eadfcc; }
  #block-frame .nk-dlg[data-who="narr"] { padding-left: 14px; }
  #block-frame .nk-face { width: 40px; height: 40px; box-shadow: 0 3px 8px rgba(16, 38, 74, .2), 0 0 0 3px #fff; }
  #block-frame .nk-dlg-name { left: 56px; top: -11px; padding: 4px 10px 5px; font-size: 10px; }
  #block-frame .nk-dlg-text { font-size: 13.5px; line-height: 1.32; }
  #block-frame .nk-dlg[data-who="cat"] .nk-dlg-text, #block-frame .nk-dlg[data-who="mina"] .nk-dlg-text, #block-frame .nk-dlg[data-who="mike"] .nk-dlg-text, #block-frame .nk-dlg[data-who="jiji"] .nk-dlg-text { font-size: 15px; }
  #block-frame .nk-dlg-tr { margin-top: 4px; font-size: 12.5px; line-height: 1.35; }
  #block-frame .nk-dlg-tr::before { margin-right: 6px; padding: 1px 6px 2px; font-size: 8px; }
  #block-frame .nk-dlg-next { right: 12px; bottom: 10px; }
  #block-frame .nk-choices { gap: 6px; margin-top: 8px; }
  #block-frame .nk-choices button { font-size: 11.5px; padding: 6px 10px 7px; }
  #block-frame .nk-choices button .k { display: none; }
  #block-frame .nk-msg { top: 48px; padding: 7px 12px 8px; font-size: 12.5px; border-radius: 13px; }
  #block-frame .nk-title { font-size: clamp(20px, 6.4vw, 30px); }
  #block-frame .nk-press { font-size: 12.5px; padding: 9px 16px 10px; }
}
@media (prefers-reduced-motion: reduce) { #block-frame .nk-press, #block-frame .nk-dlg-next, #block-frame .nk-dlg.pop, #block-frame .nk-dlg.pop .nk-face { animation: none; } }
`;
  if (!document.getElementById("nk-ui-v45")) {
    const st = document.createElement("style");
    st.id = "nk-ui-v45";
    st.textContent = UI_CSS;
    document.head.appendChild(st);
  }

  const $ = (id) => document.getElementById(id);
  const stage = $("frame-stage");
  const canvas = $("fr-canvas");

  function fail() {
    $("nk-fail").hidden = false;
    $("nk-start").hidden = true;
    $("nk-pad").hidden = true;
    const tools = node.querySelector(".nk-tools");
    if (tools) tools.hidden = true;
  }

  const THREE = window.THREE;
  if (!THREE) { fail(); return; }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  } catch (err) { fail(); return; }
  if (!renderer.getContext()) { fail(); return; }
  renderer.setPixelRatio(1);
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 1);
  const CAN_DEPTH = renderer.capabilities.isWebGL2 || renderer.extensions.has("WEBGL_depth_texture");
  const SMALL = Math.min(window.innerWidth || 1000, 1000) < 700;

  /* ---------------------------------------------------------------------
     texturas pintadas em canvas, com UV em metros: ruído suave que emenda
     sem costura, filtro linear e mipmaps
     --------------------------------------------------------------------- */
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const MAXANI = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1);
  function tex(w, h, draw, su, sv) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = MAXANI;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (su) t.repeat.set(1 / su, 1 / (sv || su));
    return t;
  }
  /* ruído de valor periódico: px e py células no tamanho da textura */
  function noise2(seed, px, py) {
    const r = rng(seed), grid = new Float32Array(px * py);
    for (let i = 0; i < px * py; i += 1) grid[i] = r();
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const x0 = ((xi % px) + px) % px, y0 = ((yi % py) + py) % py, x1 = (x0 + 1) % px, y1 = (y0 + 1) % py;
      const a = grid[y0 * px + x0], b = grid[y0 * px + x1], c = grid[y1 * px + x0], d = grid[y1 * px + x1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  function fbm(n, x, y, oct) { let s = 0, a = 0.5, f = 1, tot = 0; for (let i = 0; i < oct; i += 1) { s += n(x * f, y * f) * a; tot += a; a *= 0.5; f *= 2; } return s / tot; }
  const hexRgb = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  /* pinta pixel a pixel: fn(x, y, o) escreve a cor em o */
  function paint(g, w, h, fn) {
    const img = g.createImageData(w, h), d = img.data, o = [0, 0, 0];
    for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
      fn(x, y, o);
      const i = (y * w + x) * 4;
      d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  const put = (o, c, k) => { o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k; };
  const putMix = (o, a, b, t, k) => { o[0] = (a[0] + (b[0] - a[0]) * t) * k; o[1] = (a[1] + (b[1] - a[1]) * t) * k; o[2] = (a[2] + (b[2] - a[2]) * t) * k; };
  /* manchas e pedrinhas desenhadas por cima, que emendam nas bordas */
  function dots(g, w, h, n, seed, rmin, rmax, cols, alpha) {
    const r = rng(seed);
    for (let i = 0; i < n; i += 1) {
      const x = r() * w, y = r() * h, rad = rmin + r() * (rmax - rmin);
      g.fillStyle = cols[(r() * cols.length) | 0];
      g.globalAlpha = alpha == null ? 1 : alpha;
      for (const dx of [0, -w, w]) for (const dy of [0, -h, h]) {
        if (x + dx < -rad || x + dx > w + rad || y + dy < -rad || y + dy > h + rad) continue;
        g.beginPath(); g.ellipse(x + dx, y + dy, rad, rad * (0.7 + r() * 0.3), r() * 3, 0, Math.PI * 2); g.fill();
      }
    }
    g.globalAlpha = 1;
  }
  /* texturas principais em dobro fora do celular: nítidas no zoom mais perto */
  const TS = SMALL ? 1 : 2;
  const TX = {
    /* concreto com marca de fôrma: placas de compensado de 0,9 × 1,8 m, com o
       veio da madeira e os furos dos tensores (fotos do interior) */
    concrete: tex(256 * TS, 512 * TS, (g, w, h) => {
      const nw = noise2(701, 4, 8), nb = noise2(702, 16, 32), nf = noise2(703, 64, 128);
      const base = hexRgb(0xcbcccc), cool = hexRgb(0xbdc0c3);
      paint(g, w, h, (x, y, o) => {
        const u = x / w, v = y / h;
        const warp = fbm(nw, u * 4, v * 8, 3) * 2.2;
        const grain = Math.sin((u * 9 + warp + Math.sin(v * 6.28 * 2 + warp) * 0.25) * 6.2832);
        const blot = fbm(nb, u * 16, v * 32, 3), fine = nf(u * 64, v * 128);
        let k = 0.9 + blot * 0.13 + grain * 0.025 + (fine - 0.5) * 0.035;
        const ex = Math.min(x, w - 1 - x), ey = Math.min(y, h - 1 - y);
        if (ex < TS || ey < TS) k *= 0.8; else if (ex < 4 * TS || ey < 4 * TS) k *= 0.965;
        putMix(o, base, cool, blot, k);
      });
      for (const px of [0.25, 0.75]) for (const py of [1 / 6, 0.5, 5 / 6]) {
        const cx = px * w, cy = py * h;
        g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(cx + 0.8 * TS, cy + 0.8 * TS, 5.2 * TS, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#9d978f"; g.beginPath(); g.arc(cx, cy, 4.4 * TS, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#7d776f"; g.beginPath(); g.arc(cx - 0.6 * TS, cy - 0.6 * TS, 2.6 * TS, 0, Math.PI * 2); g.fill();
      }
    }, 0.9, 1.8),
    /* carvalho em tábuas de 15 cm, de comprimentos variados */
    oak: tex(256 * TS, 256 * TS, (g, w, h) => {
      const r = rng(11), rows = 8, ph = h / rows;
      const pal = [0xc8935f, 0xbd8756, 0xd09c69, 0xb67f4f, 0xc58e5b, 0xcb9763, 0xc18b59].map(hexRgb);
      const segs = [];
      for (let i = 0; i < rows; i += 1) {
        const j0 = r() * w, j1 = (j0 + w * (0.35 + r() * 0.3)) % w;
        segs.push({ j: [Math.min(j0, j1), Math.max(j0, j1)], t: [pal[(r() * pal.length) | 0], pal[(r() * pal.length) | 0]] });
      }
      const ng = noise2(12, 4, 96), nk = noise2(13, 8, 8);
      paint(g, w, h, (x, y, o) => {
        const row = Math.min(rows - 1, Math.floor(y / ph)), yy = y - row * ph, sg = segs[row];
        const inside = x >= sg.j[0] && x < sg.j[1];
        const grain = fbm(ng, (x / w) * 4 + row * 0.37, (y / h) * 96, 3);
        const knot = nk((x / w) * 8, (y / h) * 8);
        let k = 0.88 + grain * 0.2 + (knot - 0.5) * 0.06;
        if (yy < 1.1 * TS || Math.abs(x - sg.j[0]) < 0.8 * TS || Math.abs(x - sg.j[1]) < 0.8 * TS) k *= 0.66;
        else if (yy < 2.6 * TS) k *= 1.04;
        put(o, sg.t[inside ? 1 : 0], k);
      });
    }, 1.2),
    terra: tex(128, 128, (g, w, h) => {
      g.fillStyle = "#e6cdb0"; g.fillRect(0, 0, w, h);
      const r = rng(21), cols = ["#c86a4a", "#bf5f42", "#d17552", "#c46547"];
      for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < w; x += 32) { g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(x + 1, y + 1, 30, 14); }
    }, 0.8),
    /* compensado das prateleiras: claro, com o veio correndo ao longo */
    plywood: tex(256 * TS, 256 * TS, (g, w, h) => {
      const ng = noise2(31, 4, 64), nb = noise2(32, 8, 8);
      const a = hexRgb(0xebcf9f), b = hexRgb(0xdcb986);
      paint(g, w, h, (x, y, o) => {
        const grain = fbm(ng, (x / w) * 4, (y / h) * 64, 3), blot = nb((x / w) * 8, (y / h) * 8);
        putMix(o, a, b, grain, 0.95 + blot * 0.08);
      });
    }, 1.2),
    /* tijolo de barro em quadrados de 15 cm, cada peça de um tom (foto do térreo) */
    brick: tex(256 * TS, 256 * TS, (g, w, h) => {
      const r = rng(131), n = noise2(132, 32, 32);
      const pal = [0xc98059, 0xbb714d, 0xd29067, 0xae674b, 0xd5a07a, 0xbf8161, 0xca8a69, 0xa56148, 0xdcae88].map(hexRgb);
      const cell = []; for (let i = 0; i < 64; i += 1) cell.push(pal[(r() * pal.length) | 0]);
      const mortar = hexRgb(0xd6c3ae);
      paint(g, w, h, (x, y, o) => {
        const C = 32 * TS, cx = Math.floor(x / C), cy = Math.floor(y / C), lx = x % C, ly = y % C;
        const t = fbm(n, (x / w) * 32, (y / h) * 32, 3);
        if (lx < 2 * TS || ly < 2 * TS) { put(o, mortar, 0.94 + t * 0.1); return; }
        const bev = lx < 4 * TS || ly < 4 * TS ? 1.07 : lx > C - 3 * TS || ly > C - 3 * TS ? 0.9 : 1;
        put(o, cell[cy * 8 + cx], (0.9 + t * 0.2) * bev);
      });
    }, 1.2),
    /* painel de agregado exposto da fachada (foto da fachada) */
    aggregate: tex(256 * TS, 256 * TS, (g, w, h) => {
      const n = noise2(141, 32, 32), base = hexRgb(0xa7a49e);
      paint(g, w, h, (x, y, o) => put(o, base, 0.9 + fbm(n, (x / w) * 32, (y / h) * 32, 2) * 0.16));
      dots(g, w, h, 2600 * TS * TS, 142, 0.8 * TS, 2.2 * TS, ["#d9d6cf", "#eeebe4", "#7d7a74", "#5f5c58", "#bdb9b1", "#c9c0b3"], 0.95);
    }, 1.0),
    /* tábuas verticais de madeira clara sob a cozinha (foto do térreo) */
    cedar: tex(256 * TS, 256 * TS, (g, w, h) => {
      const r = rng(151), ng = noise2(152, 64, 4);
      const pal = [0xe7c9a0, 0xdfbd90, 0xecd2ad, 0xd8b387].map(hexRgb), board = [];
      for (let i = 0; i < 8; i += 1) board.push(pal[(r() * pal.length) | 0]);
      paint(g, w, h, (x, y, o) => {
        const bi = Math.floor(x / (32 * TS)), lx = x % (32 * TS);
        const grain = fbm(ng, (x / w) * 64, (y / h) * 4, 3);
        let k = 0.9 + grain * 0.17;
        if (lx < TS) k *= 0.62; else if (lx < 3 * TS) k *= 0.9;
        put(o, board[bi], k);
      });
    }, 1.0),
    /* concreto pré-moldado dos degraus em balanço */
    precast: tex(128, 128, (g, w, h) => {
      const n = noise2(161, 16, 16), base = hexRgb(0xbdbab3);
      paint(g, w, h, (x, y, o) => put(o, base, 0.9 + fbm(n, (x / w) * 16, (y / h) * 16, 3) * 0.16));
      dots(g, w, h, 260, 162, 0.5, 1.2, ["#8f8c86", "#d8d5ce", "#a29f98"], 0.7);
    }, 0.6),
    stone: tex(128, 128, (g, w, h) => {
      const n = noise2(171, 8, 8), a = hexRgb(0xd3c1b5), b = hexRgb(0xb9a293);
      paint(g, w, h, (x, y, o) => putMix(o, a, b, fbm(n, (x / w) * 8, (y / h) * 8, 4), 1));
      dots(g, w, h, 90, 172, 0.6, 1.6, ["#8e7f76", "#e8dcd2"], 0.6);
    }, 0.5),
    /* porcelanato preto em peças de 60 cm (a kenzai-navi lista o Archetipo
       Nero entre os pisos; pô-lo no banho é inferência do modelo) */
    nero: tex(256, 256, (g, w, h) => {
      const nv = noise2(91, 8, 8), nb = noise2(92, 16, 16), base = hexRgb(0x3b3940);
      paint(g, w, h, (x, y, o) => {
        const u = x / w, v = y / h;
        const vein = Math.abs(Math.sin((u * 2 + v * 3 + fbm(nv, u * 8, v * 8, 3) * 2.4) * 3.1416 * 2));
        let k = 0.92 + fbm(nb, u * 16, v * 16, 2) * 0.12 + (vein > 0.97 ? 0.18 : 0);
        if ((x & 127) < 1 || (y & 127) < 1) k = 1.3;
        put(o, base, k);
      });
    }, 1.2),
    asphalt: tex(256, 256, (g, w, h) => {
      const n = noise2(41, 16, 16), nf = noise2(42, 128, 128), base = hexRgb(0x77757d);
      paint(g, w, h, (x, y, o) => put(o, base, 0.88 + fbm(n, (x / w) * 16, (y / h) * 16, 3) * 0.14 + (nf((x / w) * 128, (y / h) * 128) - 0.5) * 0.1));
    }, 2.0),
    apron: tex(256, 256, (g, w, h) => {
      const n = noise2(43, 16, 16), base = hexRgb(0xd8d3ca);
      paint(g, w, h, (x, y, o) => {
        let k = 0.93 + fbm(n, (x / w) * 16, (y / h) * 16, 3) * 0.1;
        if (x < 1 || y < 1) k *= 0.88;
        put(o, base, k);
      });
    }, 1.6),
    gravel: tex(128, 128, (g, w, h) => {
      g.fillStyle = "#bdb3a2"; g.fillRect(0, 0, w, h);
      dots(g, w, h, 520, 51, 1.4, 3.4, ["#d6ccbb", "#c8bdab", "#aa9f8d", "#e3dbcd", "#9e9383"], 1);
      dots(g, w, h, 260, 52, 0.5, 1.1, ["#f4efe6"], 0.6);
    }, 0.8),
    /* pedrisco claro diante da fachada, como na foto da fachada */
    pebble: tex(128, 128, (g, w, h) => {
      g.fillStyle = "#9f9b95"; g.fillRect(0, 0, w, h);
      dots(g, w, h, 620, 71, 1.6, 3.8, ["#e4e1db", "#d2cec7", "#c1bdb6", "#f1eee8", "#b3afa8"], 1);
      dots(g, w, h, 200, 72, 0.6, 1.2, ["#fbfaf7"], 0.7);
    }, 0.6),
    soil: tex(128, 128, (g, w, h) => {
      const n = noise2(61, 8, 16);
      paint(g, w, h, (x, y, o) => {
        const t = fbm(n, (x / w) * 8, (y / h) * 16, 3), band = y < h * 0.3 ? 0 : y < h * 0.7 ? 1 : 2;
        put(o, hexRgb([0x93684a, 0x85593d, 0x754b33][band]), 0.9 + t * 0.18);
      });
      dots(g, w, h, 40, 62, 0.8, 2, ["#a8866a", "#5f3d2b"], 0.8);
    }, 1.6),
    siding: tex(128, 128, (g, w, h) => {
      const n = noise2(63, 8, 8), base = hexRgb(0xf0e4cb);
      paint(g, w, h, (x, y, o) => { const ly = y & 15; put(o, base, (ly < 2 ? 0.86 : ly < 4 ? 1.03 : 1) * (0.97 + n((x / w) * 8, (y / h) * 8) * 0.05)); });
    }, 1.6),
    sidingBlue: tex(128, 128, (g, w, h) => {
      const n = noise2(64, 8, 8), base = hexRgb(0xd2dee9);
      paint(g, w, h, (x, y, o) => { const ly = y & 15; put(o, base, (ly < 2 ? 0.86 : ly < 4 ? 1.03 : 1) * (0.97 + n((x / w) * 8, (y / h) * 8) * 0.05)); });
    }, 1.6),
    tiles: tex(128, 128, (g, w, h) => {
      const base = hexRgb(0xeee6d8);
      paint(g, w, h, (x, y, o) => put(o, base, (x & 31) < 1 || (y & 31) < 1 ? 0.88 : 1));
    }, 1.2),
    /* muro de blocos de concreto, 40 × 20 cm, em amarração corrida */
    block: tex(256, 256, (g, w, h) => {
      const n = noise2(71, 16, 16), base = hexRgb(0xd0c9be);
      paint(g, w, h, (x, y, o) => {
        const row = y >> 5, lx = (x + (row % 2) * 32) & 63, ly = y & 31;
        let k = 0.92 + fbm(n, (x / w) * 16, (y / h) * 16, 3) * 0.12;
        if (lx < 2 || ly < 2) k *= 0.84; else if (lx < 4 || ly < 4) k *= 1.04;
        put(o, base, k);
      });
    }, 1.6),
    /* telhas: as fiadas correm ao longo da cumeeira */
    roof: tex(128, 128, (g, w, h) => {
      const base = hexRgb(0x60708c);
      paint(g, w, h, (x, y, o) => { const lx = x % 16, ly = y & 31; put(o, base, (0.86 + Math.sin((lx / 16) * Math.PI) * 0.18) * (ly < 2 ? 0.8 : 1)); });
    }, 1.2),
    roofBrown: tex(128, 128, (g, w, h) => {
      const base = hexRgb(0x9a6650);
      paint(g, w, h, (x, y, o) => { const lx = x % 16, ly = y & 31; put(o, base, (0.86 + Math.sin((lx / 16) * Math.PI) * 0.18) * (ly < 2 ? 0.8 : 1)); });
    }, 1.2),
    grass: tex(256, 256, (g, w, h) => {
      const n = noise2(81, 16, 16), a = hexRgb(0x94c472), b = hexRgb(0x7cb262);
      paint(g, w, h, (x, y, o) => putMix(o, a, b, fbm(n, (x / w) * 16, (y / h) * 16, 3), 1));
      const r = rng(82);
      g.lineWidth = 1.4; g.lineCap = "round";
      for (let i = 0; i < 900; i += 1) {
        const x = r() * w, y = r() * h, l = 3 + r() * 5, a = -1.2 + r() * 0.8;
        g.strokeStyle = ["#6aa653", "#a8d488", "#86bd69", "#5d9a4b"][(r() * 4) | 0];
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l * 0.4, y - l); g.stroke();
      }
    }, 1.6),
    grate: tex(64, 64, (g, w, h) => {
      g.fillStyle = "#a7a198"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#6c675f"; for (let x = 4; x < w; x += 8) g.fillRect(x, 4, 4, h - 8);
      g.fillStyle = "#bdb7ae"; g.fillRect(0, 0, w, 2);
    }, 0.5),
  };

  /* lombadas: 1024 × 128 px para 2,4 m de livros. O quarto de cima são os
     topos dos livros; o resto, as lombadas, de alturas diferentes */
  const BOOK_COLS = ["#c65a4e", "#e0a24a", "#5f86b5", "#4f8a6a", "#d9c9a3", "#8c6aa8", "#e98b6d", "#3f5f8f", "#f0dcae", "#7aa7a1", "#b84a5a", "#6d8f4e", "#d67b3a", "#9ab6d6", "#eadfc8", "#5a4e7a", "#c9a066", "#f2c6b4"];
  TX.books = tex(1024, 128, (g, w, h) => {
    g.fillStyle = "#3a2b2b"; g.fillRect(0, 0, w, h);
    const r = rng(97), top = 32;
    let x = 0;
    while (x < w - 6) {
      if (r() < 0.05) { x += 3 + ((r() * 6) | 0); continue; }
      const bw = Math.min(w - x, 9 + ((r() * 14) | 0));
      const bh = Math.round((h - top) * (0.62 + r() * 0.38));
      const col = BOOK_COLS[(r() * BOOK_COLS.length) | 0];
      const y0 = h - bh;
      g.fillStyle = col; g.fillRect(x + 0.5, y0, bw - 1.5, bh);
      g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(x + 1, y0, 2, bh);
      g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x + bw - 3, y0, 2, bh);
      if (r() < 0.6) { g.fillStyle = r() < 0.5 ? "rgba(255,248,230,.75)" : "rgba(40,30,30,.45)"; g.fillRect(x + 2, y0 + 6 + r() * 10, bw - 5, 3 + r() * 5); }
      if (r() < 0.5) { g.fillStyle = "rgba(255,248,230,.55)"; for (let k = 0; k < 3; k += 1) g.fillRect(x + bw / 2 - 1, y0 + 26 + k * 7, 2, 4); }
      g.fillStyle = bh > (h - top) * 0.85 ? "#f0e6d2" : "#3a2b2b"; g.fillRect(x + 0.5, 0, bw - 1.5, top);
      if (bh > (h - top) * 0.85) { g.fillStyle = col; g.fillRect(x + 0.5, top - 5, bw - 1.5, 5); }
      x += bw;
    }
  });
  TX.books.repeat.set(1, 1);

  /* ---------------------------------------------------------------------
     materiais: luz em rampa suave, brilho de borda nos bichos e poché no
     avesso cortado
     --------------------------------------------------------------------- */
  const CLIP = new THREE.Plane(new THREE.Vector3(0, -1, 0), 99);
  const U = { ink: { value: new THREE.Color(INK) }, time: { value: 0 }, rim: { value: new THREE.Color(0x1d1b24) }, gloss: { value: 0.3 } };
  const GRAD = (() => {
    const n = 64, a = new Uint8Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      const c = i / (n - 1), s = Math.min(1, Math.max(0, (c - 0.4) / 0.32)), k = 0.5 + 0.5 * s * s * (3 - 2 * s);
      a[i * 3] = a[i * 3 + 1] = a[i * 3 + 2] = Math.round(k * 255);
    }
    const t = new THREE.DataTexture(a, n, 1, THREE.RGBFormat);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  })();
  function toon(o) {
    o = o || {};
    const m = new THREE.MeshToonMaterial({
      color: o.color != null ? o.color : 0xffffff, map: o.map || null, gradientMap: GRAD, vertexColors: true,
      side: THREE.DoubleSide, transparent: !!o.transparent, opacity: o.opacity != null ? o.opacity : 1,
    });
    if (o.clip) { m.clippingPlanes = [CLIP]; m.clipShadows = true; }
    const wob = o.wobble || 0, rim = !!o.rim, gloss = !!o.gloss;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uInk = U.ink;
      sh.uniforms.uTime = U.time;
      sh.uniforms.uRim = U.rim;
      sh.uniforms.uGloss = U.gloss;
      if (wob) {
        sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
          transformed.x += sin(uTime * 1.3 + position.y * 5.0 + position.z * 2.1) * ${wob.toFixed(3)};
          transformed.z += cos(uTime * 1.1 + position.y * 4.0 + position.x * 2.3) * ${wob.toFixed(3)};`);
      }
      sh.fragmentShader = "uniform vec3 uInk;\nuniform vec3 uRim;\nuniform float uGloss;\n" + sh.fragmentShader.replace("#include <fog_fragment>", `#include <fog_fragment>
        ${rim ? "gl_FragColor.rgb += uRim * pow(1.0 - clamp(abs(normal.z), 0.0, 1.0), 2.2);" : ""}
        ${gloss ? "gl_FragColor.rgb += uGloss * pow(max(dot(normalize(normal), normalize(vec3(-0.3, 0.62, 1.0))), 0.0), 26.0);" : ""}
        if (!gl_FrontFacing) gl_FragColor.rgb = uInk;`);
    };
    m.customProgramCacheKey = () => "fr-toon2-" + wob + (rim ? "-rim" : "") + (gloss ? "-gloss" : "");
    return m;
  }
  const GLOWS = [];
  function glow(day, night, o) {
    o = o || {};
    const m = new THREE.MeshBasicMaterial({ color: day, side: THREE.DoubleSide, transparent: !!o.transparent, opacity: o.opacity != null ? o.opacity : 1, depthWrite: o.depthWrite !== false });
    if (o.clip) m.clippingPlanes = [CLIP];
    if (o.additive) m.blending = THREE.AdditiveBlending;
    m.userData.noShadow = !!o.noShadow;
    GLOWS.push({ m, day: new THREE.Color(day), night: new THREE.Color(night), twinkle: !!o.twinkle, dayOpacity: m.opacity, nightOpacity: o.nightOpacity != null ? o.nightOpacity : m.opacity });
    return m;
  }
  /* vidro: um pouco de reflexo do céu nas bordas, quase nada no meio */
  function glassMat(o) {
    const m = new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: o.opacity, depthWrite: false, side: THREE.DoubleSide });
    if (o.clip) m.clippingPlanes = [CLIP];
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWp;").replace("#include <project_vertex>", "#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWp;").replace("#include <dithering_fragment>", `#include <dithering_fragment>
        float st = smoothstep(0.35, 0.5, fract((vWp.x + vWp.z) * 0.9 + vWp.y * 0.35));
        gl_FragColor.rgb += vec3(0.16) * st * (1.0 - smoothstep(0.5, 0.7, fract((vWp.x + vWp.z) * 0.9 + vWp.y * 0.35)));
        gl_FragColor.a *= 0.85 + st * 0.5;`);
    };
    m.customProgramCacheKey = () => "fr-glass-" + (o.clip ? 1 : 0);
    m.userData.noShadow = true;
    return m;
  }
  const M = {
    concrete: toon({ map: TX.concrete, clip: true }),
    oak: toon({ map: TX.oak, clip: true }),
    terra: toon({ map: TX.terra, clip: true }),
    plywood: toon({ map: TX.plywood, clip: true }),
    nero: toon({ map: TX.nero, clip: true }),
    brick: toon({ map: TX.brick, clip: true }),
    aggregate: toon({ map: TX.aggregate, clip: true }),
    cedar: toon({ map: TX.cedar, clip: true }),
    precast: toon({ map: TX.precast, clip: true }),
    stone: toon({ map: TX.stone, clip: true }),
    shelf: toon({ map: TX.plywood, clip: true, color: 0xf6e6c8 }),
    plaster: toon({ clip: true, color: 0xf3f0ea }),
    gravelIn: toon({ map: TX.gravel, clip: true }),
    curtain: toon({ clip: true, wobble: 0.006 }),
    books: toon({ map: TX.books, clip: true }),
    paint: toon({ clip: true }),
    leaf: toon({ clip: true, wobble: 0.012 }),
    cloth: toon({ wobble: 0.03 }),
    clothIn: toon({ clip: true, wobble: 0.01 }),
    fabric: toon({ clip: true }),
    out: toon(),
    outLeaf: toon({ wobble: 0.015 }),
    asphalt: toon({ map: TX.asphalt }),
    apron: toon({ map: TX.apron }),
    gravel: toon({ map: TX.gravel }),
    pebble: toon({ map: TX.pebble }),
    soil: toon({ map: TX.soil }),
    siding: toon({ map: TX.siding }),
    sidingBlue: toon({ map: TX.sidingBlue }),
    tiles: toon({ map: TX.tiles }),
    block: toon({ map: TX.block }),
    roof: toon({ map: TX.roof }),
    roofBrown: toon({ map: TX.roofBrown }),
    grass: toon({ map: TX.grass }),
    grate: toon({ map: TX.grate }),
    glass: glassMat({ color: 0xd9eef6, opacity: 0.16, clip: true }),
    glassOut: glassMat({ color: 0xd9eef6, opacity: 0.3 }),
    vendGlass: glassMat({ color: 0xe8f4fa, opacity: 0.1 }),
    win: glow(0x9fbfd8, 0xffcf7a),
    winDark: glow(0x93b3cc, 0x4d5a78),
    lampIn: glow(0xf4e6cc, 0xffe2a4, { clip: true }),
    lampOut: glow(0xeeeae0, 0xfff1c8),
    screen: glow(0x5a7093, 0xa9dcff, { clip: true }),
    fairy: glow(0xf2e3c2, 0xffcf6e, { clip: true, twinkle: true }),
    vend: glow(0xdde9f3, 0x92b1cb),
    vendStrip: glow(0x7cc4f0, 0x4f93c4),
    vendHead: glow(0x3f6fb5, 0x4a7fc4),
    vendCold: glow(0x5fa8e0, 0x5aa6dc),
    vendWarm: glow(0xe0685e, 0xe8786a),
    vendBtn: glow(0xf2f4f6, 0xfff1cf),
    vendLed: glow(0x2d3b33, 0x6fd49a),
    gachaSign: glow(0x8fcdf2, 0x3e6f94),
    mirror: glow(0xcfe3ee, 0x6d7fa8),
    mirrorIn: glow(0xcfe3ee, 0x6d7fa8, { clip: true }),
    bulb: glow(0xfff4dc, 0xffd98f, { clip: true }),
    glassware: new THREE.MeshBasicMaterial({ color: 0xdff2f8, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [CLIP] }),
    water: new THREE.MeshBasicMaterial({ color: 0x9fd8e6, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [CLIP] }),
    shaft: glow(0xfff2cf, 0xbcd0ff, { clip: true, transparent: true, opacity: 0.07, nightOpacity: 0.03, depthWrite: false, additive: true, noShadow: true }),
    patch: glow(0xfff0c8, 0xc6d6ff, { clip: true, transparent: true, opacity: 0.32, nightOpacity: 0.12, depthWrite: false, additive: true, noShadow: true }),
  };

  /* ---------------------------------------------------------------------
     geometria: tudo o que é estático vai para poucos baldes, por material
     e por grupo de corte, e cada balde vira uma malha só
     --------------------------------------------------------------------- */
  const scene = new THREE.Scene();
  const solids = [];
  /* deslocamento de um bloco inteiro do entorno (o vizinho ao sul, a máquina
     de bebidas), para acompanhar a frente do lote sem refazer cada medida */
  const OFF = { x: 0, z: 0 };
  function withOff(dx, dz, fn) { const px = OFF.x, pz = OFF.z; OFF.x += dx; OFF.z += dz; try { fn(); } finally { OFF.x = px; OFF.z = pz; } }
  const buckets = new Map();
  const faceGroups = { L: [], R: [], B: [], F: [], NL: [], NR: [], NB: [], NF: [] };
  const WHITE = [1, 1, 1];
  const rgb = (h) => (h == null ? WHITE : [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]);
  function bucketOf(mat, group) {
    const key = mat.uuid + "|" + (group || "");
    let b = buckets.get(key);
    if (!b) { b = { mat, group: group || null, p: [], n: [], u: [], c: [] }; buckets.set(key, b); }
    return b;
  }
  function quad(b, a, bb, c, d, nrm, ua, ub, uc, ud, col) {
    const P = [a, bb, c, a, c, d], UV = [ua, ub, uc, ua, uc, ud];
    for (let i = 0; i < 6; i += 1) {
      const p = P[i];
      b.p.push(p[0] + OFF.x, p[1], p[2] + OFF.z);
      b.n.push(nrm[0], nrm[1], nrm[2]);
      b.u.push(UV[i][0], UV[i][1]);
      b.c.push(col[0], col[1], col[2]);
    }
  }
  function solid(x0, y0, z0, x1, y1, z1, tag, oneway) { solids.push({ x0: x0 + OFF.x, y0, z0: z0 + OFF.z, x1: x1 + OFF.x, y1, z1: z1 + OFF.z, tag: tag || null, oneway: !!oneway }); }

  /* caixa alinhada aos eixos, em coordenadas do mundo.
     o.top / o.bottom / o.sides: materiais por face; o.color / o.colorTop: cor;
     o.face: grupo de corte; o.ghost: sem colisão; o.skip: faces omitidas;
     o.uv(face, ponto): UV própria */
  const FACES = [
    ["t", [0, 1, 0]], ["b", [0, -1, 0]], ["px", [1, 0, 0]], ["nx", [-1, 0, 0]], ["pz", [0, 0, 1]], ["nz", [0, 0, -1]],
  ];
  /* caixa de cantos arredondados: a grade de 5 × 5 × 5 da BoxGeometry vira
     miolo e quinas, e a normal de cada vértice é a da quina */
  const RB = {};
  function rboxGeo(w, h, d, r) {
    const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r.toFixed(4)}`;
    if (RB[key]) return RB[key];
    const g = new THREE.BoxGeometry(w, h, d, 5, 5, 5).toNonIndexed();
    const pos = g.attributes.position, nor = g.attributes.normal, n = pos.count;
    const Hh = [w / 2, h / 2, d / 2];
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), F = new Float32Array(n * 3);
    const t = [0, 0, 0], dir = [0, 0, 0], inn = [0, 0, 0];
    for (let i = 0; i < n; i += 1) {
      t[0] = pos.getX(i) / Hh[0]; t[1] = pos.getY(i) / Hh[1]; t[2] = pos.getZ(i) / Hh[2];
      for (let k = 0; k < 3; k += 1) { const c = Math.max(-0.2, Math.min(0.2, t[k])); inn[k] = (c / 0.2) * (Hh[k] - r); dir[k] = t[k] - c; }
      const L = Math.hypot(dir[0], dir[1], dir[2]) || 1;
      for (let k = 0; k < 3; k += 1) { N[i * 3 + k] = dir[k] / L; P[i * 3 + k] = inn[k] + (dir[k] / L) * r; }
      F[i * 3] = nor.getX(i); F[i * 3 + 1] = nor.getY(i); F[i * 3 + 2] = nor.getZ(i);
    }
    g.dispose();
    return (RB[key] = { P, N, F, n });
  }
  function roundBox(x0, y0, z0, x1, y1, z1, mat, o) {
    const r = Math.min(o.round, 0.45 * Math.min(x1 - x0, y1 - y0, z1 - z0));
    const G = rboxGeo(x1 - x0, y1 - y0, z1 - z0, r);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    const col = rgb(o.color), colTop = o.colorTop != null ? rgb(o.colorTop) : col;
    const grp = o.face || null;
    const bS = bucketOf(mat, grp), bT = bucketOf(o.top || mat, grp), bB = bucketOf(o.bottom || mat, grp);
    for (let i = 0; i < G.n; i += 1) {
      const fx = G.F[i * 3], fy = G.F[i * 3 + 1];
      const b = fy > 0.5 ? bT : fy < -0.5 ? bB : bS;
      const x = cx + G.P[i * 3], y = cy + G.P[i * 3 + 1], z = cz + G.P[i * 3 + 2];
      b.p.push(x + OFF.x, y, z + OFF.z);
      b.n.push(G.N[i * 3], G.N[i * 3 + 1], G.N[i * 3 + 2]);
      if (Math.abs(fy) > 0.5) b.u.push(x, z); else if (Math.abs(fx) > 0.5) b.u.push(z, y); else b.u.push(x, y);
      const c = fy > 0.5 ? colTop : col;
      b.c.push(c[0], c[1], c[2]);
    }
    if (!o.ghost) solid(x0, y0, z0, x1, y1, z1, o.tag, o.oneway);
  }
  function box(x0, y0, z0, x1, y1, z1, mat, o) {
    o = o || {};
    if (o.round) { roundBox(x0, y0, z0, x1, y1, z1, mat, o); return; }
    const col = rgb(o.color);
    const colTop = o.colorTop != null ? rgb(o.colorTop) : col;
    const g = o.face || null;
    const skip = o.skip || [];
    for (const [f, n] of FACES) {
      if (skip.indexOf(f) >= 0) continue;
      let a, bb, c, d;
      if (f === "t") { a = [x0, y1, z0]; bb = [x0, y1, z1]; c = [x1, y1, z1]; d = [x1, y1, z0]; }
      else if (f === "b") { a = [x0, y0, z0]; bb = [x1, y0, z0]; c = [x1, y0, z1]; d = [x0, y0, z1]; }
      else if (f === "px") { a = [x1, y0, z0]; bb = [x1, y1, z0]; c = [x1, y1, z1]; d = [x1, y0, z1]; }
      else if (f === "nx") { a = [x0, y0, z0]; bb = [x0, y0, z1]; c = [x0, y1, z1]; d = [x0, y1, z0]; }
      else if (f === "pz") { a = [x0, y0, z1]; bb = [x1, y0, z1]; c = [x1, y1, z1]; d = [x0, y1, z1]; }
      else { a = [x0, y0, z0]; bb = [x0, y1, z0]; c = [x1, y1, z0]; d = [x1, y0, z0]; }
      const m = f === "t" ? (o.top || mat) : f === "b" ? (o.bottom || mat) : mat;
      const uvOf = o.uv ? (p) => o.uv(f, p) : (p) => (f === "t" || f === "b") ? [p[0], p[2]] : (f === "px" || f === "nx") ? [p[2], p[1]] : [p[0], p[1]];
      quad(bucketOf(m, g), a, bb, c, d, n, uvOf(a), uvOf(bb), uvOf(c), uvOf(d), f === "t" ? colTop : col);
    }
    if (!o.ghost) solid(x0, y0, z0, x1, y1, z1, o.tag, o.oneway);
  }
  /* caixa em coordenadas da casa */
  const hb = (x0, y0, z0, x1, y1, z1, mat, o) => box(BX + x0, y0, BZ + z0, BX + x1, y1, BZ + z1, mat, o);

  /* malhas genéricas (cilindros, esferas, cones), já no lugar */
  const GEO = {};
  function baseGeo(kind) {
    if (GEO[kind]) return GEO[kind];
    let g;
    if (kind === "cyl6") g = new THREE.CylinderGeometry(1, 1, 1, 10);
    else if (kind === "cyl8") g = new THREE.CylinderGeometry(1, 1, 1, 14);
    else if (kind === "cyl12") g = new THREE.CylinderGeometry(1, 1, 1, 24);
    else if (kind === "cone4") g = new THREE.ConeGeometry(1, 1, 4);
    else if (kind === "cone8") g = new THREE.ConeGeometry(1, 1, 12);
    else if (kind === "cone10") g = new THREE.ConeGeometry(1, 1, 10);
    else if (kind === "ico0") g = new THREE.IcosahedronGeometry(1, 0);
    else if (kind === "ico1") g = new THREE.IcosahedronGeometry(1, 1);
    else if (kind === "sph") g = new THREE.SphereGeometry(1, 18, 12);
    else if (kind === "torus") g = new THREE.TorusGeometry(1, 0.12, 8, 24);
    else if (kind === "box") g = new THREE.BoxGeometry(1, 1, 1);
    else if (kind === "shade") g = new THREE.CylinderGeometry(0.6, 1, 1, 16, 1, true);
    else if (kind === "prism3") {
      /* prisma triangular com a aresta para cima, na caixa unitária: telhado */
      g = new THREE.CylinderGeometry(1, 1, 1, 3).rotateX(-Math.PI / 2).toNonIndexed();
      g.scale(1 / Math.sqrt(3), 1 / 1.5, 1);
      g.translate(0, -1 / 6, 0);
      g.computeVertexNormals();
    }
    else if (kind === "cap") {
      /* cilindro de pontas arredondadas, para patas, braços e rabos */
      const pts = [];
      for (let i = 0; i <= 5; i += 1) { const a = (i / 5) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a), -0.5 + 0.16 * (1 - Math.cos(a)))); }
      for (let i = 0; i <= 5; i += 1) { const a = Math.PI / 2 - (i / 5) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) + 1e-4, 0.5 - 0.16 * (1 - Math.cos(a)))); }
      g = new THREE.LatheGeometry(pts, 14);
    } else if (kind === "rbx" || kind === "rbx1") {
      const R = rboxGeo(1, 1, 1, kind === "rbx" ? 0.3 : 0.1);
      g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(R.P, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(R.N, 3));
      const uv = new Float32Array(R.n * 2);
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
    GEO[kind] = g.index ? g.toNonIndexed() : g;
    return GEO[kind];
  }
  const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _m3 = new THREE.Matrix3();
  const _nm = new THREE.Matrix3();
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
  const MAT4 = new THREE.Matrix4();
  function place(x, y, z, sx, sy, sz, rx, ry, rz) {
    _p.set(x, y, z);
    _e.set(rx || 0, ry || 0, rz || 0);
    _q.setFromEuler(_e);
    _s.set(sx, sy, sz);
    return MAT4.compose(_p, _q, _s);
  }
  function geo(kind, matrix, mat, color, group, us, vs) {
    const src = baseGeo(kind);
    const pos = src.attributes.position, nor = src.attributes.normal, uv = src.attributes.uv;
    _m3.getNormalMatrix(matrix);
    const b = bucketOf(mat, group), c = rgb(color);
    for (let i = 0; i < pos.count; i += 1) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(matrix);
      _n.fromBufferAttribute(nor, i).applyMatrix3(_m3).normalize();
      b.p.push(_v.x + OFF.x, _v.y, _v.z + OFF.z);
      b.n.push(_n.x, _n.y, _n.z);
      if (uv) b.u.push(uv.getX(i) * (us || 1), uv.getY(i) * (vs || 1)); else b.u.push(0, 0);
      b.c.push(c[0], c[1], c[2]);
    }
  }
  /* atalhos: cilindro em pé, bolha, cone */
  const cyl = (x, y0, z, r, h, mat, color, o) => geo((o && o.kind) || "cyl8", place(x, y0 + h / 2, z, r, h, r, o && o.rx, o && o.ry, o && o.rz), mat, color, o && o.face);
  const blob = (x, y, z, rx, ry, rz, mat, color, o) => geo((o && o.kind) || "ico0", place(x, y, z, rx, ry, rz, 0, (o && o.ry) || 0, 0), mat, color, o && o.face);
  const cone = (x, y0, z, r, h, mat, color, o) => geo((o && o.kind) || "cone8", place(x, y0 + h / 2, z, r, h, r, 0, (o && o.ry) || 0, 0), mat, color, o && o.face);

  function flush() {
    for (const b of buckets.values()) {
      if (!b.p.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(b.p, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(b.n, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(b.u, 2));
      g.setAttribute("color", new THREE.Float32BufferAttribute(b.c, 3));
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, b.mat);
      mesh.castShadow = !b.mat.transparent && !b.mat.userData.noShadow;
      mesh.receiveShadow = !!b.mat.isMeshToonMaterial;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      if (b.mat.transparent) mesh.renderOrder = 2;
      mesh.userData.group = b.group;
      mesh.userData.mat = Object.keys(M).find((k) => M[k] === b.mat) || "?";
      scene.add(mesh);
      if (b.group) (faceGroups[b.group] = faceGroups[b.group] || []).push(mesh);
    }
    buckets.clear();
  }

  /* ---------------------------------------------------------------------
     a casa, pelos desenhos: paredes sul e dos fundos inteiras; a norte em
     três placas que recuam 50 cm cada uma, com vidro nas frestas; na frente,
     vidro, painéis de agregado exposto e duas folhas de aço preto; sete
     lajes e três coberturas
     --------------------------------------------------------------------- */
  const X = (x) => BX + x;
  const Z = (z) => BZ + z;
  /* [etiqueta, a0, b0, a1, b1, piso], em coordenadas da casa; o topo vem de LV */
  const SLABS = [
    ["S1", 0.12, 4.03, 5.13, ZG, "brick"], ["S1", 0.12, 1.77, 4.63, 4.03, "brick"],
    ["S2", 0.12, 0.12, 4.13, 1.77, "oak"],
    ["S3", 0.12, 0.12, 4.13, 2.14, "oak"],
    ["S4", 0.44, 2.14, 4.63, 4.4, "oak"],
    ["S5", 0.44, 4.4, 5.13, ZG, "oak"],
    ["S6", 0.12, 0.12, 4.13, 1.9, "nero"],
    ["S7", -T2, 4.4, 5.37, 6.68, "deck"],
  ];
  const levelOf = (tag) => LV[Number(tag.slice(1)) - 1];
  /* degraus de concreto em balanço, presos na parede da estante, do tablado à
     cozinha: oito pisadas de 30 cm e nove espelhos de 21 cm. [b0, b1, topo] */
  const TREADS = Array.from({ length: 8 }, (_, i) => [4.31 - 0.3 * i, 4.61 - 0.3 * i, PLAT + ((FL.k - PLAT) / 9) * (i + 1)]);
  /* escada de aço do interpavimento ao banho, pela planta do 2階: quatro
     degraus em leque, que giram em volta de um ponto do interpavimento
     (a 1,65; b 3,07), entre os raios de 0,47 e 1,20 m, e quatro degraus retos
     junto à estante, de b 3,07 a 1,90; nove espelhos. Ângulos em graus,
     medidos de +a para +b */
  const FAN = { a: 1.65, b: 3.07, r0: 0.47, r1: 1.2, steps: [[108.6, 126], [126, 145], [145, 164], [164, 180]] };
  const S3R = (FL.bath - FL.mid) / 9;
  const S3_STRAIGHT = Array.from({ length: 4 }, (_, i) => [3.07 - 0.2925 * (i + 1), 3.07 - 0.2925 * i, FL.mid + S3R * (i + 5)]);
  /* a escada de marinheiro, em pé, encostada na borda do quarto: nas plantas
     do 2階, entre a 0,57 e 0,98, em b 4,30 a 4,36; na foto do vazio, seis vãos
     de uns 45 cm. bc é onde o gato fica quando sobe por ela */
  const LAD = { a0: 0.57, a1: 0.98, b0: 4.3, b1: 4.36, bc: 4.17, n: 6 };
  LAD.rise = (FL.r1 - FL.mid) / LAD.n;
  /* degraus de gato (do jogo, não da casa): do alto da escada de marinheiro, a
     estante continua em prateleiras que avançam, uma por altura de prateleira,
     subindo para o fundo por cima da escada de aço, com mais de 2 m de folga
     para quem passa embaixo. [b0, b1, topo] */
  const SHELF_PITCH = 0.36;
  const shelfY = (k) => FL.g + k * SHELF_PITCH;
  const CAT_STEPS = [18, 19, 20, 21, 22].map((k, i) => [3.95 - 0.3 * i, 4.25 - 0.3 * i, shelfY(k)]);
  const CS_A = 0.56;                             /* linha do meio dos degraus de gato, em a */
  const LAMPS = [];
  const PLANTS = [];                             /* vasos que o gato pode cheirar */
  const DOOR = { glass: null, steel: null, open: 0 };

  function slab(tag, x0, z0, x1, z1, top, topMat) {
    hb(x0, top - 0.2, z0, x1, top, z1, M.concrete, { top: topMat || M.oak, tag });
  }
  /* viga inclinada (banzo de escada, corrimão), em coordenadas do mundo */
  function beam(x, y0, z0, y1, z1, w, h, color, o) {
    const len = Math.hypot(z1 - z0, y1 - y0);
    const ang = Math.atan2(y1 - y0, z0 - z1);
    geo("box", place(x, (y0 + y1) / 2, (z0 + z1) / 2, w, h, len, ang, 0, 0), (o && o.mat) || M.paint, color, o && o.face);
  }
  /* barra reta entre dois pontos do mundo (corrimão, montante, trilho) */
  const _ra = new THREE.Vector3(), _rb = new THREE.Vector3(), _rup = new THREE.Vector3(0, 1, 0), _rm = new THREE.Matrix4(), _rq = new THREE.Quaternion();
  function rod(a, b, w, color, face, mat, h) {
    _ra.set(a[0], a[1], a[2]); _rb.set(b[0], b[1], b[2]);
    const len = _ra.distanceTo(_rb);
    _rup.set(0, 1, 0);
    if (Math.abs(b[1] - a[1]) > len * 0.999) _rup.set(1, 0, 0);
    _rm.lookAt(_ra, _rb, _rup);
    _rq.setFromRotationMatrix(_rm);
    _p.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    _s.set(w, h || w, len);
    geo("box", MAT4.compose(_p, _rq, _s), mat || M.paint, color, face);
  }

  /* quadrilátero com a frente virada para n (o avesso vira poché) */
  function quadN(b, p0, p1, p2, p3, n, col) {
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], wx = p2[0] - p0[0], wy = p2[1] - p0[1], wz = p2[2] - p0[2];
    const d = (uy * wz - uz * wy) * n[0] + (uz * wx - ux * wz) * n[1] + (ux * wy - uy * wx) * n[2];
    const Z2 = [0, 0];
    if (d >= 0) quad(b, p0, p1, p2, p3, n, Z2, Z2, Z2, Z2, col);
    else quad(b, p0, p3, p2, p1, n, Z2, Z2, Z2, Z2, col);
  }
  /* chapa em forma de fatia de coroa (degrau em leque), em coordenadas da
     casa; t0 e t1 em radianos; o sólido de colisão vai em pedaços retos */
  function fanPlate(ca, cb, r0, r1, t0, t1, y0, y1, mat, color, tag) {
    const n = 6, col = rgb(color), bk = bucketOf(mat, null);
    const P = (r, t, y) => [X(ca + r * Math.cos(t)), y, Z(cb + r * Math.sin(t))];
    for (let i = 0; i < n; i += 1) {
      const a0 = t0 + ((t1 - t0) * i) / n, a1 = t0 + ((t1 - t0) * (i + 1)) / n, am = (a0 + a1) / 2;
      quadN(bk, P(r0, a0, y1), P(r1, a0, y1), P(r1, a1, y1), P(r0, a1, y1), [0, 1, 0], col);
      quadN(bk, P(r0, a0, y0), P(r1, a0, y0), P(r1, a1, y0), P(r0, a1, y0), [0, -1, 0], col);
      quadN(bk, P(r1, a0, y0), P(r1, a1, y0), P(r1, a1, y1), P(r1, a0, y1), [Math.cos(am), 0, Math.sin(am)], col);
      quadN(bk, P(r0, a0, y0), P(r0, a1, y0), P(r0, a1, y1), P(r0, a0, y1), [-Math.cos(am), 0, -Math.sin(am)], col);
    }
    quadN(bk, P(r0, t0, y0), P(r1, t0, y0), P(r1, t0, y1), P(r0, t0, y1), [Math.sin(t0), 0, -Math.cos(t0)], col);
    quadN(bk, P(r0, t1, y0), P(r1, t1, y0), P(r1, t1, y1), P(r0, t1, y1), [-Math.sin(t1), 0, Math.cos(t1)], col);
    /* colisão: três fatias por dois anéis, cada uma na sua caixa */
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        const a0 = t0 + ((t1 - t0) * i) / 3, a1 = t0 + ((t1 - t0) * (i + 1)) / 3;
        const ra = r0 + ((r1 - r0) * j) / 2, rb = r0 + ((r1 - r0) * (j + 1)) / 2;
        const pts = [P(ra, a0, 0), P(rb, a0, 0), P(ra, a1, 0), P(rb, a1, 0), P(rb, (a0 + a1) / 2, 0)];
        const xs = pts.map((q) => q[0]), zs = pts.map((q) => q[2]);
        solid(Math.min(...xs) + 0.012, y0, Math.min(...zs) + 0.012, Math.max(...xs) - 0.012, y1, Math.max(...zs) - 0.012, tag);
      }
    }
  }

  function buildHouse() {
    const base = FL.g - 0.3;
    /* quando o corte esconde uma parede, fica o pé dela, até 12 cm acima do
       terreno, com o topo em azul-marinho, como poché: assim o térreo, que é
       21,5 cm mais baixo que o terreno, continua lendo como casa, e não como
       buraco */
    const W = (a0, b0, a1, b1, y0, y1, face) => {
      hb(a0, y0, b0, a1, y1, b1, M.concrete, { face, tag: "wall" });
      if (face && y0 <= base + 1e-6 && y1 > lv(0.12)) hb(a0 + 0.004, y0, b0 + 0.004, a1 - 0.004, lv(0.12), b1 - 0.004, M.concrete, { ghost: true, colorTop: INK, skip: ["b"] });
    };
    const glass = (a0, y0, b0, a1, y1, b1, face) => hb(a0, y0, b0, a1, y1, b1, M.glass, { face, tag: "wall" });
    const steel = (a0, y0, b0, a1, y1, b1, face, color) => hb(a0, y0, b0, a1, y1, b1, M.paint, { face, ghost: true, color: color || STEEL });

    /* lajes; o térreo fica 21,5 cm abaixo do chão médio do terreno */
    const FLOOR = { brick: M.brick, oak: M.oak, nero: M.nero, deck: M.concrete };
    for (const [tag, a0, b0, a1, b1, fl] of SLABS) slab(tag, a0, b0, a1, b1, levelOf(tag), FLOOR[fl]);

    /* alturas das elevações (北・南・東・西側立面図) e do corte: a parte dos
       fundos sobe até +7,72, a do vazio até +8,60 e a da frente até +6,35 */
    const TOPB = lv(7.72);
    /* sul: cega, baixa na frente, alta no vazio, média no fundo; a janelinha
       do banho (南側立面図): de b 0,76 a 1,62, entre +6,25 e +7,02 */
    W(-T2, 4.93, T2, 6.71, base, lv(6.35), "L");
    W(-T2, 1.62, T2, 4.93, base, FL.top, "L");
    W(-T2, 1.37, T2, 1.62, base, lv(6.25), "L");
    W(-T2, 1.37, T2, 1.62, lv(7.02), FL.top, "L");
    W(-T2, 0.76, T2, 1.37, base, lv(6.25), "L");
    W(-T2, 0.76, T2, 1.37, lv(7.02), TOPB, "L");
    W(-T2, -T2, T2, 0.76, base, TOPB, "L");
    glass(-0.02, lv(6.25), 0.76, 0.02, lv(7.02), 1.62, "L");

    /* norte: três placas desencontradas, 50 cm uma da outra; vidro nas frestas */
    W(5.13, 4.03, 5.37, 6.71, base, lv(6.35), "R");
    W(4.63, 1.77, 4.87, 4.44, base, FL.top, "R");
    W(4.63, 4.44, 4.87, 4.93, FL.r1 - 0.25, FL.top, "R");
    W(4.13, -T2, 4.37, 2.19, base, TOPB, "R");
    glass(4.87, FL.g, 4.13, 5.13, lv(6.35), 4.17, "R");
    glass(4.37, FL.g, 1.88, 4.63, TOPB, 1.92, "R");

    /* fundos, com a janela comprida sobre a pia (東側立面図): de a 0,83 a 2,37,
       entre +3,12 e +3,45 */
    W(-T2, -T2, 0.83, T2, base, TOPB, "B");
    W(2.37, -T2, 4.37, T2, base, TOPB, "B");
    W(0.83, -T2, 2.37, T2, base, lv(3.12), "B");
    W(0.83, -T2, 2.37, T2, lv(3.45), TOPB, "B");
    glass(0.83, lv(3.12), -0.02, 2.37, lv(3.45), 0.02, "B");

    /* frente (西側立面図): ao sul, painéis de agregado exposto em três colunas
       (juntas em a 0,96 e 1,80) e quatro fiadas; ao norte, vidro; a borda da
       laje do quarto entre +3,57 e +3,80, e a do terraço entre +5,84 e +6,17 */
    hb(T2, FL.g, 6.3, 2.62, lv(5.84), 6.49, M.concrete, { face: "F", tag: "wall" });
    {
      const AA = [T2, 0.96, 1.8, 2.62], AH = [[lv(0.1), lv(1.96)], [lv(2.03), lv(3.57)], [lv(3.8), lv(4.78)], [lv(4.78), lv(5.84)]];
      for (const [y0, y1] of AH) for (let i = 0; i < 3; i += 1) hb(AA[i] + 0.008, y0 + 0.008, 6.49, AA[i + 1] - 0.008, y1 - 0.008, 6.52, M.aggregate, { face: "F", ghost: true });
    }
    hb(-T2, lv(3.57), ZG, 5.37, lv(3.8), 6.68, M.concrete, { face: "F", tag: "wall" });
    hb(-T2, lv(5.84), 6.44, 5.37, lv(6.17), 6.68, M.concrete, { face: "F", tag: "wall" });
    steel(T2, lv(1.96), 6.52, 5.13, lv(2.03), 6.7, "F", 0x26242b);
    glass(2.64, FL.g, ZG - 0.02, 3.7, lv(3.57), ZG + 0.02, "F");
    glass(5.0, FL.g, ZG - 0.02, 5.13, lv(3.57), ZG + 0.02, "F");
    glass(3.7, lv(2.03), ZG - 0.02, 5.0, lv(3.57), ZG + 0.02, "F");
    glass(2.69, lv(3.8), ZG - 0.02, 5.08, lv(5.84), ZG + 0.02, "F");
    for (const a of [2.64, 3.7, 5.13]) steel(a - 0.025, FL.g, ZG - 0.03, a + 0.025, lv(3.57), ZG + 0.03, "F");
    steel(2.64, lv(1.99), ZG - 0.03, 5.13, lv(2.03), ZG + 0.03, "F");
    for (const [a0, a1] of [[2.62, 2.69], [5.08, 5.13]]) steel(a0, lv(3.8), ZG - 0.03, a1, lv(5.84), ZG + 0.03, "F");
    /* a folha de vidro de correr, montada à parte, e as duas folhas de aço preto
       por fora: abrem quando o gato chega perto */
    hb(3.7, FL.g, ZG - 0.075, 5.0, lv(2.03), ZG - 0.045, M.glass, { face: "door", ghost: true });
    for (const a of [3.7, 4.98]) hb(a, FL.g, ZG - 0.08, a + 0.02, lv(2.03), ZG - 0.04, M.paint, { face: "door", ghost: true, color: STEEL });
    hb(3.7, lv(2.01), ZG - 0.08, 5.0, lv(2.03), ZG - 0.04, M.paint, { face: "door", ghost: true, color: STEEL });
    for (const [a0, bz] of [[2.64, 6.58], [3.89, 6.62]]) {
      hb(a0, lv(0.1), bz, a0 + 1.25, lv(1.96), bz + 0.04, M.paint, { face: "door2", ghost: true, color: 0x1f1e24 });
      hb(a0 + 0.1, lv(0.85), bz + 0.04, a0 + 0.12, lv(1.25), bz + 0.05, M.paint, { face: "door2", ghost: true, color: 0x55535c });
    }
    /* spot sob o trilho das folhas de aço, a uns 2 m, como no corte */
    geo("cyl12", place(X(4.4), lv(1.85), Z(6.62), 0.032, 0.07, 0.032), M.paint, 0x2b2a30, "F");
    geo("cyl12", place(X(4.4), lv(1.81), Z(6.62), 0.026, 0.012, 0.026), M.lampOut, null, "F");
    lamp(X(4.4), lv(1.7), Z(6.72), 0xffdcae, 3.2, 0.95, 0);
    DOOR.glass = { x0: X(3.7), y0: FL.g, z0: Z(ZG - 0.08), x1: X(5.0), y1: lv(2.03), z1: Z(ZG - 0.04), tag: "wall" };
    DOOR.steel = { x0: X(2.64), y0: lv(0.1), z0: Z(6.58), x1: X(5.14), y1: lv(1.96), z1: Z(6.66), tag: "wall" };
    solids.push(DOOR.glass, DOOR.steel);

    /* coberturas: a do banho e a do vazio alto, que avança sobre o terraço e
       sobre o banho; a laje do terraço é a S7 */
    hb(-T2, FL.r2 - 0.25, -T2, 4.37, FL.r2, 2.14, M.concrete, { tag: "roof", colorTop: 0xd8d2c8 });
    hb(-T2, FL.r2, -T2, 4.37, TOPB, T2, M.concrete, { tag: "roof" });
    /* a laje de cima (corte): grossa no meio e fina nos balanços sobre o banho
       e sobre o terraço */
    hb(-T2, FL.r3 - 0.25, 2.33, 4.87, FL.r3, 4.53, M.concrete, { tag: "roof", colorTop: 0xd8d2c8 });
    for (const [b0, b1] of [[1.56, 2.33], [4.53, 5.49]]) hb(-T2, FL.r3 - 0.12, b0, 4.87, FL.r3, b1, M.concrete, { tag: "roof", colorTop: 0xd8d2c8 });
    for (const [b0, b1] of [[2.0, 2.25], [4.5, 4.75]]) hb(-T2, FL.r3, b0, 4.87, lv(8.52), b1, M.concrete, { tag: "roof", colorTop: 0xd8d2c8 });
    /* vidro alto do vazio: a oeste, sobre o terraço, em três folhas (西側立面図),
       a do meio de correr, aqui aberta atrás da fixa do sul; a leste, sobre o
       banho. O vidro assenta na mureta de +6,25 */
    const HG = lv(6.25);
    glass(T2, HG, 4.77, 1.61, FL.r3 - 0.25, 4.81, "F");
    glass(3.15, HG, 4.77, 4.63, FL.r3 - 0.25, 4.81, "F");
    hb(0.2, HG, 4.72, 1.6, FL.r3 - 0.27, 4.75, M.glass, { face: "F", ghost: true });
    for (const a of [T2, 1.61, 3.15, 4.63]) steel(a - 0.02, HG, 4.76, a + 0.02, FL.r3 - 0.25, 4.82, "F");
    glass(T2, FL.r2, 1.92, 4.63, FL.r3 - 0.25, 1.96, "B");
    for (const a of [1.2, 2.4, 3.6]) steel(a - 0.02, FL.r2, 1.91, a + 0.02, FL.r3 - 0.25, 1.97, "B");

    /* o tablado de madeira da frente: o piso vira banco, e a escada começa nele */
    hb(0.44, FL.g, 3.78, 2.04, PLAT, 6.18, M.oak, { tag: "step", round: 0.014 });
    hb(2.49, FL.g, 4.47, 3.29, FL.g + 0.16, 4.72, M.oak, { tag: "step2", round: 0.014 });
    /* a viga do eixo X2 aflora no térreo: uma faixa de tijolo a +0,10, de b 3,77
       a 4,46, entre o tablado e a parede norte, que separa a entrada da mesa
       (corte, planta do 1階 e foto do térreo) */
    hb(2.04, FL.g, 3.77, 4.63, FL.low, 4.46, M.brick, { tag: "S1" });
    /* a do eixo X3, diante das tábuas do vão sob a cozinha: uma base de
       concreto a +0,10 (corte e foto do térreo) */
    hb(0.44, FL.g, 1.77, 4.13, FL.low, 2.16, M.concrete, { tag: "ledge", colorTop: 0xcfc9bf });
    /* 1階下 → 1階上: degraus de concreto em balanço, presos na parede da estante */
    for (const [b0, b1, top] of TREADS) hb(0.44, top - 0.075, b0, 1.23, top, b1, M.precast, { tag: "tread", round: 0.012 });
    /* 1階上 → 2階下: escada de aço preto junto à cozinha, subindo para o norte:
       seis espelhos de 20 cm e pisadas de 22 cm (plantas e corte), e um
       patamar no nível do interpavimento, junto à placa norte */
    const KR = (FL.mid - FL.k) / 6;
    for (let j = 0; j < 5; j += 1) {
      const a0 = 2.26 + 0.222 * j, top = FL.k + KR * (j + 1);
      hb(a0, top - 0.03, 1.43, a0 + 0.222, top, 2.18, M.paint, { color: STEEL, tag: "stair" });
    }
    hb(3.37, FL.mid - 0.03, 1.43, 4.13, FL.mid, 2.18, M.paint, { color: STEEL, tag: "stair" });
    for (const bb of [1.43, 2.18]) rod([X(2.26), FL.k, Z(bb)], [X(3.37), FL.mid, Z(bb)], 0.03, STEEL, null, null, 0.16);
    /* do lado do térreo, a guarda de aço: montantes e dois corrimãos (foto do térreo) */
    for (const dy of [0.45, 0.9]) rod([X(2.26), FL.k + dy, Z(2.18)], [X(3.37), FL.mid + dy, Z(2.18)], dy > 0.5 ? 0.025 : 0.02, STEEL);
    for (const a of [2.28, 2.82, 3.35]) { const y = FL.k + (FL.mid - FL.k) * ((a - 2.26) / 1.11); rod([X(a), y, Z(2.18)], [X(a), y + 0.9, Z(2.18)], 0.02, STEEL); }
    /* 2階下 → 2階上: escada de aço preto do interpavimento ao banho, como na
       planta do 2階: quatro degraus em leque e quatro retos junto à estante */
    const deg = Math.PI / 180;
    FAN.steps.forEach(([t0, t1], k) => {
      const top = FL.mid + S3R * (k + 1);
      fanPlate(FAN.a, FAN.b, FAN.r0, FAN.r1, t0 * deg, t1 * deg, top - 0.03, top, M.paint, STEEL, "stair");
    });
    for (const [b0, b1, top] of S3_STRAIGHT) hb(0.44, top - 0.03, b0, 1.18, top, b1, M.paint, { color: STEEL, tag: "stair" });
    /* banzo central, em chapa, que acompanha o giro por baixo dos degraus */
    const spine = [[FAN.a + 0.83 * Math.cos(FAN.steps[0][0] * deg), FAN.b + 0.83 * Math.sin(FAN.steps[0][0] * deg), FL.mid]];
    FAN.steps.forEach(([t0, t1], k) => { const tm = ((t0 + t1) / 2) * deg; spine.push([FAN.a + 0.83 * Math.cos(tm), FAN.b + 0.83 * Math.sin(tm), FL.mid + S3R * (k + 1) - 0.04]); });
    for (const [b0, b1, top] of S3_STRAIGHT) spine.push([0.81, (b0 + b1) / 2, top - 0.04]);
    spine.push([0.81, 1.9, FL.bath - 0.05]);
    for (let i = 0; i < spine.length - 1; i += 1) rod([X(spine[i][0]), spine[i][2] - 0.07, Z(spine[i][1])], [X(spine[i + 1][0]), spine[i + 1][2] - 0.07, Z(spine[i + 1][1])], 0.02, STEEL, null, null, 0.12);
    /* corrimão no lado aberto: acompanha o raio de dentro e segue reto */
    const rail = [];
    for (let k = 0; k <= 8; k += 1) { const tt = (FAN.steps[0][0] + ((180 - FAN.steps[0][0]) * k) / 8) * deg; rail.push([FAN.a + (FAN.r0 + 0.03) * Math.cos(tt), FAN.b + (FAN.r0 + 0.03) * Math.sin(tt), FL.mid + S3R * (0.6 + (3.4 * k) / 8)]); }
    rail.push([1.15, 1.95, FL.bath - S3R * 0.4]);
    for (let i = 0; i < rail.length - 1; i += 1) rod([X(rail[i][0]), rail[i][2] + 0.9, Z(rail[i][1])], [X(rail[i + 1][0]), rail[i + 1][2] + 0.9, Z(rail[i + 1][1])], 0.022, STEEL);
    for (const k of [0, 4, 8, 9]) { const q = rail[k]; rod([X(q[0]), q[2], Z(q[1])], [X(q[0]), q[2] + 0.9, Z(q[1])], 0.016, STEEL); }
    /* do interpavimento ao terraço: a escada de marinheiro de aço preto, em pé,
       logo ao lado do primeiro degrau em leque. Degraus de barra chata e, no
       alto, os montantes passam da laje e se curvam por cima dela, como alças
       (foto do vazio). O gato sobe por ela com as setas, como numa escada */
    for (let k = 1; k <= LAD.n; k += 1) hb(LAD.a0 + 0.012, FL.mid + LAD.rise * k - 0.012, LAD.b0 + 0.004, LAD.a1 - 0.012, FL.mid + LAD.rise * k, LAD.b1 - 0.004, M.paint, { color: STEEL, ghost: true });
    for (const a of [LAD.a0, LAD.a1 - 0.012]) {
      hb(a, FL.mid, LAD.b0, a + 0.012, FL.r1 + 0.78, LAD.b1, M.paint, { color: STEEL, ghost: true });
      const ac = X(a + 0.006), cy = FL.r1 + 0.78, cb = (LAD.b0 + LAD.b1) / 2, R = (4.58 - cb) / 2;
      let pb = cb, py = cy;
      for (let i = 1; i <= 8; i += 1) {
        const th = Math.PI - (Math.PI * i) / 8;
        const nb = cb + R + R * Math.cos(th), ny = cy + R * Math.sin(th);
        rod([ac, py, Z(pb)], [ac, ny, Z(nb)], 0.014, STEEL);
        pb = nb; py = ny;
      }
      rod([ac, cy, Z(4.58)], [ac, FL.r1 + 0.02, Z(4.58)], 0.014, STEEL);
    }

    /* terraço (corte): mureta baixa do lado da rua, de b 6,26 a 6,43, até +6,20,
       e outra do lado do vazio, de b 4,63 a 4,81, até +6,25, onde assenta o
       vidro alto; nas laterais, as paredes sobem até +6,35. Os desenhos e a
       foto da fachada não mostram guarda-corpo */
    hb(T2, FL.r1, 6.26, 5.13, lv(6.2), 6.43, M.concrete, { tag: "wall", colorTop: 0xd8d2c8 });
    hb(T2, FL.r1, 4.63, 4.63, HG, 4.81, M.concrete, { tag: "S7", colorTop: 0xd8d2c8 });
    /* vidro na borda do banho */
    hb(1.23, FL.bath, 1.86, 4.13, FL.bath + 1.0, 1.9, M.glass, { tag: "wall" });

    /* degraus de gato: a prateleira passa da estante e vira escada; uma marca
       de pata clara em cada um mostra o caminho */
    for (const [z0, z1, top] of CAT_STEPS) {
      hb(0.38, top - 0.045, z0, 0.74, top, z1, M.plywood, { tag: "shelf", oneway: true });
      const pc = [X(CS_A + 0.02), top + 0.002, Z((z0 + z1) / 2)];
      cyl(pc[0], pc[1], pc[2], 0.034, 0.003, M.paint, 0xf6efe0, { kind: "cyl8" });
      for (const [da, db] of [[0.05, -0.04], [0.065, 0], [0.05, 0.04]]) cyl(pc[0] + da, pc[1], pc[2] + db, 0.013, 0.003, M.paint, 0xf6efe0, { kind: "cyl6" });
    }

    /* luz do norte: entra pela fresta entre as placas e cai no interpavimento */
    hb(LIGHT.x0, FL.mid, LIGHT.z0, LIGHT.x1, FL.mid + 0.007, LIGHT.z1, M.patch, { ghost: true, skip: ["b", "px", "nx", "pz", "nz"] });
    rod([X(5.0), lv(6.1), Z(4.15)], [X((LIGHT.x0 + LIGHT.x1) / 2), FL.mid + 0.02, Z((LIGHT.z0 + LIGHT.z1) / 2)], 0.62, null, null, M.shaft, 0.22);
  }

  /* ---------------------------------------------------------------------
     a estante na parede sul: do térreo ao alto no vazio, atrás da cama no
     quarto e, na cozinha, ao lado da geladeira (plantas e fotos)
     --------------------------------------------------------------------- */
  const SH = {
    x0: 0.12, x1: 0.44, pitch: SHELF_PITCH,
    segs: [
      { b0: 1.45, b1: 2.14, y0: FL.k, y1: FL.bath - 0.22, zs: [1.45, 2.14] },
      { b0: 1.87, b1: 2.14, y0: FL.bath, y1: FL.r2 - 0.3, zs: [1.87, 2.14] },
      { b0: 2.14, b1: 4.4, y0: FL.g, y1: FL.r3 - 0.3, zs: [2.14, 2.9, 3.65, 4.4] },
      { b0: 4.4, b1: 6.16, y0: FL.g, y1: FL.r1 - 0.27, zs: [4.4, 5.3, 6.16] },
    ],
  };
  function bookBlock(z0, z1, y0, y1, r) {
    const d = 0.2 + r() * 0.07;
    const x0 = SH.x0 + 0.03, x1 = x0 + d;
    const h = Math.max(0.1, y1 - y0 - 0.015 - r() * 0.02);
    const off = r() * 2.4;
    const uv = (f, p) => {
      if (f === "px") return [(p[2] - BZ + off) / 2.4, ((p[1] - y0) / h) * 0.75];
      if (f === "t") return [(p[2] - BZ + off) / 2.4, 0.75 + ((p[0] - X(x0)) / d) * 0.24];
      return [(off + (p[0] - X(x0)) * 0.05) / 2.4, ((p[1] - y0) / h) * 0.75];
    };
    hb(x0, y0, z0, x1, y0 + h, z1, M.books, { ghost: true, face: "L", uv, skip: ["b", "nx"] });
  }
  function shelfObject(z0, zb, y0, y1, r, kind) {
    const room = y1 - y0 - 0.02;
    const xc = X(SH.x0 + 0.17);
    const w = 0.16 + r() * 0.1;
    if (z0 + w > zb) return z0 + w;
    const zc = Z(z0 + w / 2);
    const c = BOOK_COLS[(r() * BOOK_COLS.length) | 0];
    const colorOf = (s) => parseInt(s.slice(1), 16);
    if (kind === "plant") {
      cyl(xc, y0, zc, 0.055, Math.min(0.1, room * 0.4), M.paint, r() < 0.5 ? 0xc8744d : 0xe8dcc6, { face: "L" });
      blob(xc, y0 + Math.min(0.1, room * 0.4) + 0.05, zc, 0.08, Math.min(0.08, room * 0.35), 0.08, M.leaf, r() < 0.5 ? 0x5f9e57 : 0x76b563, { face: "L" });
      if (r() < 0.5) blob(xc + 0.03, y0 + 0.02, zc + 0.05, 0.03, 0.07, 0.03, M.leaf, 0x4a8a4c, { face: "L" });
    } else if (kind === "vase") {
      cyl(xc, y0, zc, 0.045, Math.min(0.22, room * 0.8), M.paint, colorOf(c), { face: "L", kind: "cyl6" });
    } else if (kind === "stack") {
      for (let i = 0; i < 3; i += 1) hb(SH.x0 + 0.05, y0 + i * 0.035, z0 + 0.01, SH.x0 + 0.29, y0 + (i + 1) * 0.035 - 0.003, z0 + w - 0.01, M.paint, { ghost: true, face: "L", color: colorOf(BOOK_COLS[(r() * BOOK_COLS.length) | 0]) });
    } else if (kind === "box") {
      hb(SH.x0 + 0.04, y0, z0 + 0.01, SH.x0 + 0.3, y0 + Math.min(0.2, room * 0.7), z0 + w - 0.01, M.paint, { ghost: true, face: "L", color: [0xe6d3b3, 0xb9c8d6, 0xd9a38a, 0xc9d1b0][(r() * 4) | 0] });
    } else if (kind === "frame") {
      hb(SH.x0 + 0.26, y0, z0 + 0.02, SH.x0 + 0.28, y0 + Math.min(0.22, room * 0.8), z0 + w - 0.02, M.paint, { ghost: true, face: "L", color: 0x3a2b2b });
      hb(SH.x0 + 0.281, y0 + 0.03, z0 + 0.04, SH.x0 + 0.285, y0 + Math.min(0.19, room * 0.7), z0 + w - 0.04, M.paint, { ghost: true, face: "L", color: colorOf(c) });
    } else if (kind === "jars") {
      for (let i = 0; i < 3; i += 1) {
        const zz = Z(z0 + 0.04 + i * (w / 3));
        cyl(xc, y0, zz, 0.035, 0.12, M.paint, [0xf1e3c4, 0xe7b06a, 0xc9573f, 0x8fb56d][(r() * 4) | 0], { face: "L", kind: "cyl6" });
        cyl(xc, y0 + 0.12, zz, 0.036, 0.02, M.paint, 0x7a6a5a, { face: "L", kind: "cyl6" });
      }
    } else if (kind === "plates") {
      for (let i = 0; i < 5; i += 1) cyl(xc, y0 + i * 0.018, zc, 0.1, 0.014, M.paint, 0xf4f1ea, { face: "L", kind: "cyl12" });
    } else if (kind === "towels") {
      for (let i = 0; i < 3; i += 1) geo("cyl8", place(xc, y0 + 0.05, Z(z0 + 0.05 + i * 0.07), 0.05, 0.28, 0.05, 0, 0, Math.PI / 2), M.paint, [0xf2b1a1, 0x9cc6d9, 0xf6f0e2, 0xe8d38a][(r() * 4) | 0], "L");
    } else if (kind === "bottles") {
      for (let i = 0; i < 3; i += 1) cyl(xc, y0, Z(z0 + 0.04 + i * 0.06), 0.022, 0.14 + r() * 0.06, M.paint, [0xf2f0ea, 0x9cc6d9, 0xf2c6b4, 0xb7d3a8][(r() * 4) | 0], { face: "L", kind: "cyl6" });
    }
    return z0 + w + 0.02;
  }
  function fillCompartment(za, zb, y0, y1, r, zone, gaps) {
    let z = za + 0.01;
    let guard = 0;
    while (z < zb - 0.06 && guard < 40) {
      guard += 1;
      const g = gaps.find(([g0, g1]) => z > g0 - 0.03 && z < g1 + 0.03);
      if (g) { z = g[1] + 0.03; continue; }
      const nextGap = gaps.filter(([g0]) => g0 > z).reduce((m, [g0]) => Math.min(m, g0 - 0.03), zb - 0.01);
      if (zone === "kitchen") { z = shelfObject(z, nextGap, y0, y1, r, ["jars", "plates", "jars", "plant", "vase"][(r() * 5) | 0]); continue; }
      if (zone === "bath") { z = shelfObject(z, nextGap, y0, y1, r, ["towels", "bottles", "towels", "plant", "box"][(r() * 5) | 0]); continue; }
      const roll = r();
      if (roll < 0.16) { z = shelfObject(z, nextGap, y0, y1, r, ["plant", "vase", "stack", "box", "frame", "plant"][(r() * 6) | 0]); continue; }
      const len = Math.min(nextGap - z, 0.22 + r() * 0.6);
      if (len < 0.06) { z = nextGap + 0.01; continue; }
      bookBlock(z, z + len, y0, y1, r);
      z += len + (r() < 0.35 ? 0.02 + r() * 0.05 : 0.004);
    }
  }
  function buildShelf() {
    const r = rng(2024);
    for (const s of SH.segs) {
      for (const z of s.zs) hb(SH.x0, s.y0, z - 0.015, SH.x1, s.y1, z + 0.015, M.shelf, { face: "L", ghost: true });
      for (let k = 1; k < 40; k += 1) {
        const y = shelfY(k);
        if (y > s.y1 - 0.05) break;
        if (y < s.y0 + 0.05) continue;
        hb(SH.x0, y - 0.025, s.b0, SH.x1, y, s.b1, M.shelf, { face: "L", ghost: true });
      }
      hb(SH.x0, s.y1 - 0.025, s.b0, SH.x1, s.y1, s.b1, M.shelf, { face: "L", ghost: true });
      solid(X(SH.x0), s.y0, Z(s.b0), X(SH.x1), s.y1, Z(s.b1), "wall");
      for (let i = 0; i < s.zs.length - 1; i += 1) {
        const za = s.zs[i] + 0.015, zb = s.zs[i + 1] - 0.015;
        for (let k = 0; k < 40; k += 1) {
          const y0 = shelfY(k), y1 = y0 + SH.pitch - 0.025;
          if (y1 > s.y1 - 0.02) break;
          if (y0 < s.y0 - 0.001) continue;
          const zone = shelfZone(zb, y0, y1);
          const gaps = CAT_STEPS.filter(([s0, s1, top]) => Math.abs(top - y0) < 0.01 && s1 > za && s0 < zb).map(([s0, s1]) => [s0, s1]);
          fillCompartment(za, zb, y0, y1, r, zone, gaps);
        }
      }
    }
  }

  /* ---------------------------------------------------------------------
     objetos: plantas, luminárias, móveis
     --------------------------------------------------------------------- */
  function plant(x, y, z, s, o) {
    o = o || {};
    const out = !!o.out;
    const pm = out ? M.out : M.paint, lm = out ? M.outLeaf : M.leaf;
    const potH = (o.potH || 0.16) * s, potR = (o.potR || 0.09) * s;
    cyl(x, y, z, potR, potH, pm, o.pot != null ? o.pot : 0xc8744d, { face: o.face, kind: o.square ? "cyl6" : "cyl8" });
    cyl(x, y + potH - 0.005, z, potR * 0.85, 0.012, pm, 0x5b4331, { face: o.face });
    const greens = o.greens || [0x5f9e57, 0x76b563, 0x4a8a4c, 0x88c46e];
    const rr = rng(o.seed || Math.floor(Math.abs(x * 97 + z * 131 + y * 17)) + 3);
    const n = o.n || 4;
    for (let i = 0; i < n; i += 1) {
      const a = rr() * Math.PI * 2, d = rr() * 0.07 * s;
      const hy = y + potH + (0.06 + rr() * (o.tall || 0.18)) * s;
      blob(x + Math.cos(a) * d, hy, z + Math.sin(a) * d, (0.07 + rr() * 0.06) * s, (0.06 + rr() * 0.07) * s, (0.07 + rr() * 0.06) * s, lm, greens[i % greens.length], { face: o.face, ry: rr() * 3 });
    }
    if (o.flowers) for (let i = 0; i < 5; i += 1) {
      const a = rr() * Math.PI * 2, d = (0.04 + rr() * 0.06) * s;
      blob(x + Math.cos(a) * d, y + potH + (0.12 + rr() * 0.14) * s, z + Math.sin(a) * d, 0.022 * s, 0.022 * s, 0.022 * s, lm, o.flowers[i % o.flowers.length], { face: o.face });
    }
    if (o.solid !== false) solid(x - potR, y, z - potR, x + potR, y + potH, z + potR, "pot");
    if (o.face == null && !o.noSniff) PLANTS.push({ x: x + OFF.x, y, z: z + OFF.z, r: potR });
  }
  function lamp(x, y, z, color, dist, night, day) { LAMPS.push({ x: x + OFF.x, y, z: z + OFF.z, color, dist, night, day }); }
  function floorLamp(x, y, z, h, o) {
    o = o || {};
    cyl(x, y, z, 0.11, 0.025, M.paint, STEEL);
    cyl(x, y, z, 0.012, h, M.paint, STEEL);
    geo("shade", place(x, y + h - 0.04, z, 0.15, 0.2, 0.15), M.lampIn, null, o.face);
    lamp(x, y + h - 0.12, z, 0xffc27a, o.dist || 3.0, o.night || 1.2, o.day || 0);
  }
  function laptop(x, y, z, ry) {
    geo("box", place(x, y + 0.01, z, 0.3, 0.018, 0.21, 0, ry, 0), M.paint, 0xb9bec7);
    const bx = x - Math.sin(ry) * 0.1, bz = z - Math.cos(ry) * 0.1;
    geo("box", place(bx, y + 0.11, bz, 0.3, 0.2, 0.012, -0.25, ry, 0), M.screen, null);
  }
  /* portátil com a tela virada para +x, para quem senta do lado de x maior */
  function laptopFacingX(x, y, z) {
    geo("box", place(x, y + 0.01, z, 0.21, 0.018, 0.3), M.paint, 0xb9bec7);
    geo("box", place(x - 0.1, y + 0.11, z, 0.012, 0.2, 0.3, 0, 0, 0.22), M.screen, null);
  }
  function mug(x, y, z, c) { cyl(x, y, z, 0.035, 0.08, M.paint, c || 0xf4efe6, { kind: "cyl6" }); }
  function teapot(x, y, z, c) {
    blob(x, y + 0.07, z, 0.08, 0.065, 0.08, M.paint, c, { kind: "ico1" });
    cyl(x, y + 0.13, z, 0.02, 0.03, M.paint, c);
    geo("box", place(x + 0.08, y + 0.08, z, 0.07, 0.02, 0.02, 0, 0, 0.6), M.paint, c);
  }
  function fairy(pts, n, sag, face) {
    for (let i = 0; i < n; i += 1) {
      const t = i / (n - 1);
      const seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
      const lt = t * (pts.length - 1) - seg;
      const a = pts[seg], b = pts[seg + 1];
      const x = a[0] + (b[0] - a[0]) * lt, y = a[1] + (b[1] - a[1]) * lt - Math.sin(lt * Math.PI) * sag, z = a[2] + (b[2] - a[2]) * lt;
      box(x - 0.018, y - 0.018, z - 0.018, x + 0.018, y + 0.018, z + 0.018, M.fairy, { ghost: true, face });
    }
  }

  function buildInterior() {
    const r = rng(77);
    const G = FL.g, K = FL.k, MID = FL.mid, BED = FL.bed, BA = FL.bath, R1 = FL.r1;
    const DARK = 0x1f1e24;

    /* ---- térreo: piso de tijolo, a pedra da entrada, o tablado, a mesa ---- */
    /* a pedra grande logo depois da porta (planta do térreo e foto do vazio) */
    blob(X(4.28), G + 0.1, Z(5.92), 0.8, 0.12, 0.25, M.stone, 0xc2b4aa, { kind: "ico1", ry: 0.06 });
    blob(X(3.8), G + 0.08, Z(5.86), 0.3, 0.09, 0.2, M.stone, 0xb7a89d, { kind: "ico1", ry: 0.4 });
    solid(X(3.55), G, Z(5.74), X(5.0), G + 0.2, Z(6.1), "stone");
    for (const [a, c] of [[4.2, 0x3b3a42], [4.62, 0xe8dcc6]]) {
      hb(a, G + 0.2, 5.84, a + 0.1, G + 0.23, 6.06, M.paint, { color: c, ghost: true });
      hb(a + 0.13, G + 0.2, 5.86, a + 0.23, G + 0.23, 6.08, M.paint, { color: c, ghost: true });
    }
    /* cortina translúcida na borda norte do tablado, recolhida junto ao vidro (planta do térreo) */
    for (let i = 0; i < 9; i += 1) {
      const b0 = 5.62 + i * 0.06;
      hb(2.02 + (i % 2) * 0.035, G + 0.02, b0, 2.06 + (i % 2) * 0.035, BED - 0.22, b0 + 0.06, M.curtain, { color: 0xf5f1e8, ghost: true });
    }
    hb(2.02, BED - 0.24, 4.47, 2.1, BED - 0.21, 6.18, M.paint, { color: 0xb8bcc4, ghost: true });

    /* mesa de carvalho com cavaletes pretos: o casal come junto ou um dos dois
       trabalha (Stirworld). Pela foto do térreo, o tampo corre de norte a sul,
       logo atrás da faixa de tijolo, com as cadeiras do lado dos fundos */
    const TT = G + 0.72;
    hb(1.65, TT - 0.045, 2.85, 3.85, TT, 3.7, M.oak, { tag: "furniture", round: 0.014 });
    for (const a of [1.82, 3.68]) {
      for (const bb of [2.93, 3.62]) rod([X(a - 0.1), G, Z(bb)], [X(a + 0.02), TT - 0.045, Z(bb)], 0.035, DARK);
      rod([X(a - 0.05), TT - 0.08, Z(2.93)], [X(a - 0.05), TT - 0.08, Z(3.62)], 0.03, DARK);
    }
    rod([X(1.76), G + 0.18, Z(3.275)], [X(3.62), G + 0.18, Z(3.275)], 0.03, DARK);
    /* duas cadeiras de madeira do lado dos fundos: a de encosto de varetas, onde
       o Masato senta, e outra de ripas */
    const chair = (a, b, c, windsor) => {
      hb(a - 0.2, G + 0.42, b - 0.2, a + 0.2, G + 0.45, b + 0.2, M.oak, { tag: "furniture", colorTop: c, round: 0.012 });
      for (const [da, db] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) rod([X(a + da), G, Z(b + db)], [X(a + da * 0.92), G + 0.42, Z(b + db * 0.92)], 0.03, 0xb98a57);
      for (const da of windsor ? [-0.16, -0.08, 0, 0.08, 0.16] : [-0.17, 0.17]) rod([X(a + da), G + 0.45, Z(b - 0.18)], [X(a + da), G + 0.95, Z(b - 0.22)], 0.022, 0xc39565);
      rod([X(a - 0.18), G + 0.95, Z(b - 0.22)], [X(a + 0.18), G + 0.95, Z(b - 0.22)], 0.04, 0xc39565);
      if (!windsor) for (const y of [0.62, 0.78]) rod([X(a - 0.17), G + y, Z(b - 0.19)], [X(a + 0.17), G + y, Z(b - 0.19)], 0.03, 0xe8d6b0);
    };
    chair(2.46, 2.62, 0xd9b27c, true);
    chair(3.04, 2.62, 0xe8d6b0, false);
    laptop(X(2.4), TT, Z(2.975), Math.PI);
    /* a caneca do Masato é peça solta: ele toma uns goles (moradores, adiante) */
    /* sobre a mesa: pedras coloridas, uma pedra cinza, um livro branco e um
       vaso pequeno (foto do térreo) */
    for (const [aa, db, c] of [[3.52, 3.2, 0xc85a4e], [3.44, 3.28, 0xe0a24a], [3.58, 3.3, 0x4f8a6a], [3.5, 3.4, 0x8c6aa8]]) blob(X(aa), TT + 0.035, Z(db), 0.05, 0.035, 0.045, M.stone, c, { kind: "ico1", ry: aa * 9 });
    blob(X(2.95), TT + 0.04, Z(3.3), 0.07, 0.04, 0.06, M.stone, 0x9aa3ad, { kind: "ico0", ry: 0.5 });
    hb(2.6, TT, 3.12, 2.76, TT + 0.025, 3.34, M.paint, { color: 0xf6f3ee, ghost: true });
    plant(X(3.62), TT, Z(3.55), 0.5, { solid: false, n: 3, pot: 0x7a7f88 });
    /* trilho de luz no teto de concreto, de norte a sul sobre a mesa, com três
       pendentes e um spot (foto do térreo); a ficha credita a iluminação à Modulex */
    const CEIL = MID - 0.2;
    hb(2.0, CEIL - 0.03, 3.25, 3.55, CEIL, 3.3, M.paint, { color: 0x2b2a30, ghost: true });
    const pendant = (a, drop, kind) => {
      cyl(X(a), CEIL - drop, Z(3.275), 0.004, drop, M.paint, 0x2b2a30);
      if (kind === "bubble") for (let i = 0; i < 9; i += 1) { const t = i * 2.4; blob(X(a + Math.cos(t) * 0.09 * (i % 3 ? 1 : 0.4)), CEIL - drop - 0.06 + (i % 3) * 0.05 - 0.05, Z(3.275 + Math.sin(t) * 0.09), 0.055, 0.055, 0.055, M.bulb, null, { kind: "ico1" }); }
      else blob(X(a), CEIL - drop - 0.05, Z(3.275), 0.05, 0.07, 0.05, M.bulb, null, { kind: "ico1" });
      lamp(X(a), CEIL - drop - 0.1, Z(3.275), 0xffc27a, 2.6, kind === "bubble" ? 1.1 : 0.6, 0);
    };
    pendant(2.2, 1.35, "bubble");
    pendant(2.62, 1.2);
    pendant(3.02, 1.25);
    geo("cyl8", place(X(3.4), CEIL - 0.12, Z(3.275), 0.045, 0.14, 0.045, 0, 0, -0.6), M.paint, 0xe9eaec);
    /* estante baixa diante das tábuas (foto do térreo) */
    hb(0.95, FL.low, 1.8, 1.95, FL.low + 0.3, 2.12, M.shelf, { tag: "furniture", round: 0.012 });
    hb(0.98, FL.low + 0.02, 2.1, 1.92, FL.low + 0.27, 2.121, M.books, { ghost: true, skip: ["b"] });
    /* o vão sob a cozinha: parede de tábuas de cedro, com a porta de correr aberta */
    hb(0.12, FL.low, 1.71, 3.3, K - 0.2, 1.77, M.cedar, { tag: "wall" });
    hb(4.0, FL.low, 1.71, 4.13, K - 0.2, 1.77, M.cedar, { tag: "wall" });
    hb(3.3, FL.low + 1.62, 1.71, 4.0, K - 0.2, 1.77, M.cedar, { tag: "wall" });
    hb(2.62, FL.low, 1.64, 3.3, FL.low + 1.62, 1.69, M.cedar, { ghost: true });
    /* dentro dele, o que se guarda (modelo: o uso do vão não aparece nas fontes) */
    hb(0.3, FL.low, 0.3, 1.2, FL.low + 0.48, 0.9, M.paint, { color: 0xe6d3b3, tag: "furniture", round: 0.03 });
    hb(1.4, FL.low, 0.3, 2.2, FL.low + 0.34, 0.9, M.paint, { color: 0xb9c8d6, tag: "furniture", round: 0.03 });
    for (let i = 0; i < 3; i += 1) hb(2.6, FL.low + i * 0.12, 0.3, 3.9, FL.low + 0.11 + i * 0.12, 1.1, M.fabric, { color: [0xf4efe6, 0x9cc6d9, 0xf2d27a][i], tag: "furniture", round: 0.04 });
    lamp(X(2.0), FL.low + 1.3, Z(0.9), 0xffc27a, 2.2, 0.5, 0);
    /* a caminha do gato, no canto do tablado junto ao vidro (modelo) */
    cyl(X(1.55), PLAT, Z(5.85), 0.26, 0.09, M.fabric, 0xe8b64c, { kind: "cyl12" });
    cyl(X(1.55), PLAT + 0.05, Z(5.85), 0.2, 0.05, M.fabric, 0xf4e3b8, { kind: "cyl12" });

    /* ---- 1階上: a cozinha, no fundo, 2,15 m acima do chão ---- */
    /* bancada de metal sobre armários de madeira escura, com gavetas de puxador
       embutido e a lava-louças junto à geladeira (foto do térreo) */
    hb(0.82, K, 0.12, 3.95, K + 0.82, 0.72, M.plywood, { tag: "furniture", color: 0x8a6446, round: 0.012 });
    hb(0.8, K + 0.82, 0.12, 3.97, K + 0.86, 0.74, M.paint, { color: 0xd6dbe0, colorTop: 0xe4e8ec, ghost: true, round: 0.01 });
    for (let a = 1.38; a < 3.9; a += 0.52) {
      hb(a, K + 0.08, 0.721, a + 0.48, K + 0.76, 0.725, M.plywood, { ghost: true, color: 0x7d5a3e });
      hb(a + 0.06, K + 0.7, 0.724, a + 0.42, K + 0.715, 0.728, M.paint, { ghost: true, color: 0x2b2a30 });
    }
    hb(0.86, K + 0.08, 0.721, 1.34, K + 0.76, 0.725, M.paint, { ghost: true, color: 0x55545c });
    hb(0.92, K + 0.62, 0.724, 1.28, K + 0.7, 0.728, M.paint, { ghost: true, color: 0x1b1a20 });
    hb(3.36, K + 0.86, 0.2, 3.91, K + 0.866, 0.64, M.paint, { color: 0x2b2a30, ghost: true });
    for (const [a, b] of [[3.5, 0.32], [3.77, 0.32], [3.63, 0.52]]) cyl(X(a), K + 0.866, Z(b), 0.07, 0.008, M.paint, 0x1f1e24);
    teapot(X(3.5), K + 0.866, Z(0.32), 0xe8763d);
    hb(1.47, K + 0.84, 0.2, 2.26, K + 0.861, 0.62, M.paint, { color: 0x8a929d, ghost: true });
    rod([X(1.86), K + 0.86, Z(0.18)], [X(1.86), K + 1.18, Z(0.18)], 0.025, 0xd9dde2);
    rod([X(1.86), K + 1.18, Z(0.18)], [X(1.86), K + 1.12, Z(0.38)], 0.025, 0xd9dde2);
    hb(2.4, K + 0.86, 0.3, 2.75, K + 0.875, 0.6, M.plywood, { ghost: true });
    blob(X(2.5), K + 0.9, Z(0.42), 0.035, 0.03, 0.035, M.paint, 0xd9534a);
    blob(X(2.64), K + 0.9, Z(0.5), 0.05, 0.022, 0.03, M.leaf, 0x7fbf5f);
    /* prateleira aberta logo acima da janela da pia, com copos e canecas e a luz
       embaixo; mais alto, uma prateleira comprida pendurada no teto; ao norte,
       a barra de utensílios (foto do térreo) */
    const YS = K + 1.38, YT = K + 1.98;
    hb(0.86, YS - 0.03, 0.12, 2.4, YS, 0.36, M.oak, { ghost: true, face: "B" });
    for (let i = 0; i < 8; i += 1) {
      const a = 0.96 + i * 0.19;
      if (i % 3 === 0) cyl(X(a), YS, Z(0.24), 0.04, 0.12, M.glassware, null, { kind: "cyl8", face: "B" });
      else cyl(X(a), YS, Z(0.24), 0.035, 0.09 + (i % 2) * 0.03, M.paint, [0xf4efe6, 0x9cc6d9, 0xe8b06a, 0xc9573f][i % 4], { kind: "cyl8", face: "B" });
    }
    hb(0.9, YS - 0.045, 0.14, 2.36, YS - 0.03, 0.2, M.lampIn, { ghost: true, face: "B" });
    lamp(X(1.6), YS - 0.1, Z(0.45), 0xffd9a0, 2.4, 0.9, 0);
    hb(0.86, YT - 0.035, 0.12, 3.9, YT, 0.38, M.oak, { ghost: true, face: "B" });
    for (const a of [0.95, 2.4, 3.8]) rod([X(a), YT, Z(0.3)], [X(a), BA - 0.2, Z(0.3)], 0.012, 0x2b2a30, "B");
    for (let i = 0; i < 6; i += 1) cyl(X(1.0 + i * 0.45), YT, Z(0.25), 0.05, 0.1 + (i % 3) * 0.04, M.paint, [0xf4efe6, 0xd8cdb6, 0x9aa1ab][i % 3], { kind: "cyl8", face: "B" });
    rod([X(2.48), K + 1.3, Z(0.15)], [X(3.3), K + 1.3, Z(0.15)], 0.012, 0x9aa1ab, "B");
    for (let i = 0; i < 5; i += 1) rod([X(2.6 + i * 0.15), K + 1.3, Z(0.16)], [X(2.6 + i * 0.15), K + 1.08 - (i % 2) * 0.05, Z(0.17)], 0.018, [0x2b2a30, 0x9aa1ab, 0x2b2a30, 0xc39565, 0x2b2a30][i], "B");
    hb(1.0, K + 0.86, 0.14, 1.4, K + 1.1, 0.45, M.paint, { color: 0x3b3a42, ghost: true });
    /* geladeira branca junto à estante */
    hb(0.14, K, 0.14, 0.76, K + 1.8, 0.8, M.paint, { color: 0xf4f3ef, colorTop: 0xfaf9f6, tag: "furniture", round: 0.045 });
    hb(0.2, K + 1.05, 0.801, 0.22, K + 1.45, 0.81, M.paint, { color: 0x9aa1ab, ghost: true });
    hb(0.3, K + 1.25, 0.801, 0.36, K + 1.32, 0.81, M.paint, { color: 0xd9534a, ghost: true });

    /* ---- 2階下: o interpavimento, carvalho largo (foto do vazio) ---- */
    blob(X(3.2), MID + 0.06, Z(3.0), 0.26, 0.06, 0.26, M.fabric, 0xe07b5f, { kind: "ico1" });
    hb(3.5, MID, 2.6, 3.72, MID + 0.03, 2.9, M.paint, { color: 0xf6f3ee, ghost: true });

    /* ---- 2階下, na frente: o quarto, 45 cm acima do interpavimento ---- */
    /* a cama: estrado de madeira sobre pés baixos, com o vão aparecendo embaixo (foto do vazio) */
    hb(0.52, BED + 0.1, 4.8, 2.5, BED + 0.22, 6.18, M.oak, { tag: "furniture", round: 0.02 });
    for (const a of [0.6, 1.5, 2.42]) for (const b of [4.88, 6.1]) hb(a - 0.035, BED, b - 0.035, a + 0.035, BED + 0.1, b + 0.035, M.oak, { ghost: true });
    hb(0.56, BED + 0.22, 4.84, 2.46, BED + 0.4, 6.14, M.fabric, { color: 0xf6f3ee, tag: "furniture", round: 0.07 });
    hb(1.2, BED + 0.4, 4.83, 2.47, BED + 0.44, 6.15, M.fabric, { color: 0xe9e1d3, ghost: true, round: 0.018 });
    for (const b0 of [4.98, 5.58]) hb(0.6, BED + 0.4, b0, 1.02, BED + 0.52, b0 + 0.48, M.fabric, { color: 0xffffff, ghost: true, round: 0.055 });
    /* poltrona de madeira com assento azul, junto à janela: a Tomoko lê aqui */
    hb(3.45, BED + 0.36, 5.55, 3.95, BED + 0.42, 6.05, M.fabric, { color: 0x3f5f8f, tag: "furniture", round: 0.028 });
    for (const [a, b] of [[3.47, 5.57], [3.93, 5.57], [3.47, 6.03], [3.93, 6.03]]) rod([X(a), BED, Z(b)], [X(a), BED + 0.36, Z(b)], 0.035, 0xb98a57);
    for (const b of [5.57, 6.03]) rod([X(3.93), BED + 0.36, Z(b)], [X(3.97), BED + 0.84, Z(b)], 0.035, 0xb98a57);
    hb(3.92, BED + 0.62, 5.54, 3.98, BED + 0.84, 6.06, M.oak, { ghost: true, round: 0.022 });
    for (const b of [5.55, 6.03]) {
      hb(3.47, BED + 0.55, b - 0.02, 3.95, BED + 0.58, b + 0.02, M.oak, { ghost: true });
      rod([X(3.5), BED + 0.42, Z(b)], [X(3.52), BED + 0.56, Z(b)], 0.03, 0xb98a57);
    }
    /* plantas junto ao vidro */
    plant(X(4.8), BED, Z(6.05), 1.25, { n: 6, tall: 0.3, pot: 0x7a7f88 });
    plant(X(4.45), BED, Z(6.1), 0.9, { n: 4, pot: 0xe8dcc6 });
    plant(X(4.95), BED, Z(5.72), 0.8, { n: 4, pot: 0xc8744d });
    /* abajur pequeno numa prateleira da estante, na cabeceira da cama (foto do
       vazio), e arandela na parede norte */
    const LY = shelfY(13);
    cyl(X(0.36), LY, Z(5.3), 0.03, 0.02, M.paint, 0x2b2a30);
    cyl(X(0.36), LY, Z(5.3), 0.008, 0.14, M.paint, 0x2b2a30);
    blob(X(0.36), LY + 0.16, Z(5.3), 0.05, 0.045, 0.05, M.lampIn, null, { kind: "ico1" });
    lamp(X(0.5), LY + 0.16, Z(5.3), 0xffc27a, 2.6, 1.0, 0);
    hb(5.05, BED + 1.55, 5.4, 5.13, BED + 1.7, 5.52, M.lampIn, { ghost: true, face: "R" });
    lamp(X(4.9), BED + 1.6, Z(5.46), 0xffd08a, 2.4, 0.8, 0);
    /* o conduíte fino que corre no teto do quarto e desce pela parede da frente
       (fotos do vazio e da fachada) */
    rod([X(2.56), R1 - 0.215, Z(4.7)], [X(2.56), R1 - 0.215, Z(6.19)], 0.016, 0x9aa1ab);
    rod([X(2.56), R1 - 0.215, Z(6.19)], [X(2.56), BED + 1.85, Z(6.19)], 0.016, 0x9aa1ab);
    /* cortina franzida na janela do quarto, no lado sul (foto do vazio; na foto
       da fachada ela está recolhida no lado norte) */
    for (let i = 0; i < 7; i += 1) {
      const a0 = 2.66 + i * 0.06;
      hb(a0, BED + 0.02, 6.14 + (i % 2) * 0.035, a0 + 0.06, lv(5.78), 6.18 + (i % 2) * 0.035, M.curtain, { color: 0xf7f4ee, ghost: true, face: "F" });
    }
    hb(2.64, lv(5.76), 6.12, 5.13, lv(5.79), 6.16, M.paint, { color: 0xb8bcc4, ghost: true, face: "F" });

    /* ---- 2階上: o banho, no fundo, sobre a cozinha (planta do segundo andar) ---- */
    hb(2.77, BA, 0.12, 4.13, BA + 0.55, 0.79, M.paint, { color: 0xf3f1ec, colorTop: 0xf8f6f2, tag: "furniture", round: 0.06 });
    hb(2.85, BA + 0.42, 0.18, 4.05, BA + 0.551, 0.73, M.water, { ghost: true, skip: ["b"] });
    rod([X(4.08), BA + 0.9, Z(1.2)], [X(4.08), BA + 2.0, Z(1.2)], 0.022, 0xd9dde2);
    geo("cyl12", place(X(3.98), BA + 2.02, Z(1.2), 0.1, 0.02, 0.1), M.paint, 0xd9dde2);
    hb(4.07, BA + 1.0, 1.12, 4.13, BA + 1.08, 1.3, M.paint, { color: 0xd9dde2, ghost: true });
    /* o box do chuveiro, em vidro (planta do 2階): lateral em b 1,6 e porta em a 2,72 */
    hb(2.72, BA, 1.57, 4.13, BA + 2.0, 1.61, M.glass, { tag: "wall" });
    hb(2.7, BA, 0.93, 2.74, BA + 2.0, 1.57, M.glass, { tag: "wall" });
    for (const [a0, b0, a1, b1] of [[2.7, 1.57, 2.74, 1.61], [2.7, 0.9, 2.74, 0.93]]) hb(a0, BA, b0, a1, BA + 2.0, b1, M.paint, { color: 0xc9ccd2, ghost: true });
    hb(2.11, BA, 0.12, 2.7, BA + 0.8, 0.76, M.plywood, { tag: "furniture", color: 0xd8b98e, round: 0.012 });
    cyl(X(2.4), BA + 0.8, Z(0.45), 0.17, 0.08, M.paint, 0xfbfbfa, { kind: "cyl12" });
    hb(2.14, BA + 1.05, 0.12, 2.68, BA + 1.75, 0.135, M.mirrorIn, { ghost: true, face: "B" });
    hb(1.35, BA, 0.12, 1.97, BA + 0.85, 0.78, M.paint, { color: 0xf2f2ef, tag: "furniture", round: 0.045 });
    geo("cyl12", place(X(1.66), BA + 0.45, Z(0.79), 0.17, 0.02, 0.17, Math.PI / 2, 0, 0), M.paint, 0x9aa6b3);
    geo("cyl12", place(X(1.66), BA + 0.45, Z(0.8), 0.12, 0.02, 0.12, Math.PI / 2, 0, 0), M.screen, null);
    /* o lavabo no canto sudeste (planta do 2階): porta no norte da parede da
       frente, vaso com a caixa na parede sul, virado para o norte */
    for (const [a0, b0, a1, b1] of [[0.12, 0.8, 0.75, 0.84], [1.29, 0.12, 1.33, 0.84]]) hb(a0, BA, b0, a1, BA + 2.1, b1, M.plaster, { tag: "wall" });
    hb(0.75, BA + 1.95, 0.8, 1.29, BA + 2.1, 0.84, M.plaster, { ghost: true });
    geo("cyl12", place(X(0.54), BA + 0.21, Z(0.45), 0.23, 0.42, 0.18), M.paint, 0xfbfbfa);
    hb(0.12, BA, 0.22, 0.28, BA + 0.75, 0.68, M.paint, { color: 0xfbfbfa, tag: "furniture", round: 0.035 });
    solid(X(0.3), BA, Z(0.27), X(0.77), BA + 0.42, Z(0.63), "furniture");
    for (let i = 0; i < 2; i += 1) hb(2.14 + i * 0.28, BA + 0.95, 0.76, 2.36 + i * 0.28, BA + 1.4, 0.79, M.clothIn, { color: [0xf2b1a1, 0x9cc6d9][i], ghost: true });
    for (let i = 0; i < 3; i += 1) cyl(X(2.2 + i * 0.1), BA + 0.8, Z(0.25), 0.022, 0.14 + (i % 2) * 0.05, M.paint, [0xf2f0ea, 0x9cc6d9, 0xf2c6b4][i], { kind: "cyl6" });
    hb(1.9, BA, 1.0, 2.6, BA + 0.012, 1.4, M.fabric, { color: 0x9cc6d9, ghost: true });
    lamp(X(2.4), BA + 2.0, Z(1.0), 0xffe2b0, 2.8, 0.8, 0);

    /* ---- o terraço sobre o volume da frente (RSL1), do lado da rua ---- */
    plant(X(4.7), R1, Z(6.0), 1.3, { n: 6, tall: 0.3, pot: 0x7a7f88 });

    /* a caixa de papelão no térreo, junto da parede norte: 40 × 40 cm (modelo, para um segredo) */
    {
      const G = FL.g, h = 0.28, t = 0.014, C = 0xc9a06a;
      const { a0, a1, b0, b1 } = BOXC;
      hb(a0, G, b0, a1, G + 0.004, b1, M.paint, { color: 0xb38a58, ghost: true });
      hb(a0, G, b0, a0 + t, G + h, b1, M.paint, { color: C, tag: "box" });
      hb(a1 - t, G, b0, a1, G + h, b1, M.paint, { color: C, tag: "box" });
      hb(a0, G, b0, a1, G + h, b0 + t, M.paint, { color: C, tag: "box" });
      hb(a0, G, b1 - t, a1, G + h, b1, M.paint, { color: C, tag: "box" });
      /* abas abertas: cada uma dobra na borda de cima da sua parede e tomba
         para fora, a 60° do chão; o centro fica a meia aba da dobra */
      const FA = 1.05, FD = 0.14, fo = (FD / 2) * Math.cos(FA), fy = G + h + (FD / 2) * Math.sin(FA);
      const flap = (x, z, rx, rz, w, d) => geo("box", place(X(x), fy, Z(z), w, 0.004, d, rx, 0, rz), M.paint, 0xd4ae7a);
      flap((a0 + a1) / 2, b0 - fo, FA, 0, a1 - a0, FD);
      flap((a0 + a1) / 2, b1 + fo, -FA, 0, a1 - a0, FD);
      flap(a0 - fo, (b0 + b1) / 2, 0, -FA, FD, b1 - b0);
      hb(a0 + 0.12, G + h - 0.06, b1 - 0.002, a0 + 0.3, G + h, b1 + 0.001, M.paint, { color: 0xe8dcc6, ghost: true });
    }
    /* lote: o que fica do lado de fora, nos recuos (planta e elevação dos fundos) */
    acUnit(X(3.4), -0.2, Z(-0.36), X(4.2), Z(-0.12), null, "z-");
    acUnit(X(3.4), 0.42, Z(-0.36), X(4.2), Z(-0.12), null, "z-");
    box(X(4.4), -0.2, Z(0.3), X(4.7), 0.65, Z(0.62), M.out, { color: 0xeeede8, tag: "furniture", round: 0.03 });
    box(X(5.37), 0.55, Z(4.8), X(5.45), 0.85, Z(5.0), M.out, { color: 0x9aa1ab, ghost: true, face: "R" });
    /* caixa de correio preta e interfone na face norte da placa da frente, perto
       da rua (planta do 1階 e foto da fachada) */
    box(X(5.37), lv(0.95), Z(6.3), X(5.46), lv(1.35), Z(6.55), M.out, { color: 0x26242b, tag: "furniture", round: 0.015, face: "R" });
    box(X(5.37), lv(0.55), Z(6.38), X(5.4), lv(0.72), Z(6.47), M.out, { color: 0x3b3a42, ghost: true, face: "R" });
  }

  /* ---------------------------------------------------------------------
     entorno inventado: rua, vizinhos, terreno vazio, máquina de bebidas
     --------------------------------------------------------------------- */
  const OCC = {};                               /* o que pode ficar entre a câmera e a casa */
  const HC = { x: BX + 2.6, z: BZ + 3.2 };
  const DIO = { x0: -6.4, x1: 10.4, z0: -7.0, z1: LOT_D + 6.2 };
  /* o entorno foi desenhado para um lote mais fundo; o que fica na linha da
     rua anda junto com ela */
  const FZ = LOT_D - 8.61;
  const STREET = { z0: LOT_D, z1: LOT_D + 4 };
  const occ = (name, x, z, w) => { OCC[name] = { x: x + OFF.x, z: z + OFF.z, w }; return "occ:" + name; };
  /* a cerca do outro lado da rua, em trechos */
  const FENCE = { x0: DIO.x0, seg: 2.0, n: Math.ceil((DIO.x1 - DIO.x0) / 2.0), z: STREET.z1 + 0.475 };

  function win(x0, y0, z0, x1, y1, z1, lit, face) {
    const dx = x1 - x0, dz = z1 - z0;
    const fx = dx < dz ? 0.03 : 0.06, fz = dx < dz ? 0.06 : 0.03;
    box(x0 - fx, y0 - 0.06, z0 - fz, x1 + fx, y1 + 0.06, z1 + fz, M.out, { color: 0xa19d96, ghost: true, face });
    box(x0, y0, z0, x1, y1, z1, lit ? M.win : M.winDark, { ghost: true, face });
  }
  /* telhado de duas águas com a cumeeira ao longo de z */
  function gable(x0, x1, z0, z1, yE, yR, over, roofMat, wallMat, face) {
    const xm = (x0 + x1) / 2, hw = (x1 - x0) / 2;
    const a = Math.atan2(yR - yE, hw);
    const L = (hw + over) / Math.cos(a);
    const yEo = yE - over * Math.tan(a);
    const cy = (yR + yEo) / 2 + 0.05, D = z1 - z0 + 2 * over;
    geo("box", place(xm - (hw + over) / 2, cy, (z0 + z1) / 2, L, 0.1, D, 0, 0, a), roofMat, null, face, L, D);
    geo("box", place(xm + (hw + over) / 2, cy, (z0 + z1) / 2, L, 0.1, D, 0, 0, -a), roofMat, null, face, L, D);
    for (const [z, nz] of [[z0, -1], [z1, 1]]) quad(bucketOf(wallMat, face), [x0, yE, z], [x1, yE, z], [xm, yR, z], [xm, yR, z], [0, 0, nz], [x0, yE], [x1, yE], [xm, yR], [xm, yR], WHITE);
  }
  function tuft(x, z, y, s, r, mat) {
    const c = [0x6fae5b, 0x88c46e, 0x5f9e57, 0x9ccf6a][(r() * 4) | 0];
    for (let i = 0; i < 3; i += 1) geo("cone4", place(x + (r() - 0.5) * 0.12 * s, y + 0.1 * s, z + (r() - 0.5) * 0.12 * s, 0.05 * s, 0.2 * s + r() * 0.1 * s, 0.05 * s, (r() - 0.5) * 0.5, r() * 3, (r() - 0.5) * 0.5), mat || M.outLeaf, c);
  }
  const WIRES = [];
  function wire(a, b, sag, color) { WIRES.push({ a: [a[0] + OFF.x, a[1], a[2] + OFF.z], b: [b[0] + OFF.x, b[1], b[2] + OFF.z], sag, color: color || 0x2f2a33 }); }

  /* níveis do chão: a rua fica abaixo dos lotes, e o genkan, acima da rua */
  const G_ST = -0.25, G_LOT = -0.2;

  /* telhado de duas águas com a cumeeira ao longo de x */
  function gableX(x0, x1, z0, z1, yE, yR, over, roofMat, wallMat, face) {
    const zm = (z0 + z1) / 2, hw = (z1 - z0) / 2;
    const a = Math.atan2(yR - yE, hw);
    const L = (hw + over) / Math.cos(a);
    const yEo = yE - over * Math.tan(a);
    const cy = (yR + yEo) / 2 + 0.05, D = x1 - x0 + 2 * over;
    geo("box", place((x0 + x1) / 2, cy, zm - (hw + over) / 2, D, 0.1, L, -a, 0, 0), roofMat, null, face, D, L);
    geo("box", place((x0 + x1) / 2, cy, zm + (hw + over) / 2, D, 0.1, L, a, 0, 0), roofMat, null, face, D, L);
    for (const [x, nx] of [[x0, -1], [x1, 1]]) quad(bucketOf(wallMat, face), [x, yE, z0], [x, yE, z1], [x, yR, zm], [x, yR, zm], [nx, 0, 0], [z0, yE], [z1, yE], [zm, yR], [zm, yR], WHITE);
  }
  function acUnit(x0, y0, z0, x1, z1, face, facing) {
    box(x0, y0, z0, x1, y0 + 0.55, z1, M.out, { color: 0xe4e2dc, ghost: true, face, round: 0.035 });
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    if (facing === "z") geo("cyl12", place(cx - 0.05, y0 + 0.28, z1 + 0.005, 0.17, 0.02, 0.17, Math.PI / 2, 0, 0), M.out, 0x6d6f76, face);
    else if (facing === "z-") geo("cyl12", place(cx - 0.05, y0 + 0.28, z0 - 0.005, 0.17, 0.02, 0.17, Math.PI / 2, 0, 0), M.out, 0x6d6f76, face);
    else geo("cyl12", place(x1 + 0.005, y0 + 0.28, cz, 0.17, 0.02, 0.17, 0, 0, Math.PI / 2), M.out, 0x6d6f76, face);
  }
  const CLOTH = [0xf6f1e6, 0x9cc3e6, 0xf3b1a6, 0xf2d27a, 0xb7d3a8, 0xffffff, 0xe07b5f];
  function laundry(x0, x1, y, z, r, face) {
    box(x0, y, z - 0.015, x1, y + 0.03, z + 0.015, M.out, { color: 0x9a968f, ghost: true, face });
    for (let x = x0 + 0.12; x < x1 - 0.25; x += 0.34 + r() * 0.2) {
      const w = 0.22 + r() * 0.16, h = 0.3 + r() * 0.3;
      box(x, y - h, z - 0.012, x + w, y, z + 0.012, M.cloth, { color: CLOTH[(r() * CLOTH.length) | 0], ghost: true, face });
    }
  }

  function buildGround() {
    box(DIO.x0, -1.4, DIO.z0, DIO.x1, -0.26, DIO.z1, M.soil, { ghost: true, skip: ["t"] });
    const ground = (x0, z0, x1, z1, top, mat, tag) => box(x0, -0.26, z0, x1, top, z1, mat, { tag, color: 0xb8b0a6, colorTop: 0xffffff });
    ground(DIO.x0, STREET.z0 + 0.32, DIO.x1, STREET.z1, G_ST, M.asphalt, "street");
    ground(DIO.x0, STREET.z0, DIO.x1, STREET.z0 + 0.32, G_ST + 0.02, M.grate, "street");
    /* o lote em volta da casa: a casa ocupa quase tudo, e o chão de dentro fica
       21,5 cm abaixo do terreno; a borda norte recua em três degraus */
    ground(0, 0, X(-T2), LOT_D, G_LOT, M.apron, "lot");
    ground(X(-T2), 0, LOT_W, Z(-T2), G_LOT, M.apron, "lot");
    ground(X(4.37), Z(-T2), LOT_W, Z(1.88), G_LOT, M.apron, "lot");
    ground(X(4.87), Z(1.88), LOT_W, Z(4.13), G_LOT, M.apron, "lot");
    ground(X(5.37), Z(4.13), LOT_W, LOT_D, G_LOT, M.apron, "lot");
    /* a soleira entre o vidro e as folhas de aço; da face da fachada até a
       rua, uma faixa de pedrisco claro (foto da fachada) */
    box(X(-T2), FL.g - 0.2, Z(ZG), X(5.37), G_LOT, Z(6.52), M.apron, { tag: "lot", color: 0xb8b0a6, colorTop: 0xffffff });
    box(X(-T2), FL.g - 0.2, Z(6.52), X(5.37), G_LOT + 0.015, LOT_D, M.pebble, { tag: "pebble", color: 0xb8b0a6, colorTop: 0xffffff });
    {
      const r = rng(611);
      for (let i = 0; i < 46; i += 1) {
        const x = X(-T2 + 0.05 + r() * 5.4), z = Z(6.55) + r() * (LOT_D - Z(6.55) - 0.03), k = 0.016 + r() * 0.02;
        blob(x, G_LOT + 0.015 + k * 0.3, z, k * 1.2, k * 0.6, k, M.out, [0xe8e5df, 0xd6d2cb, 0xc4c0b9, 0xf3f1ec][(r() * 4) | 0], { ry: r() * 3 });
      }
    }
    ground(LOT_W, 0, DIO.x1, LOT_D, G_LOT, M.gravel, "vacant");
    ground(DIO.x0, 0, 0, LOT_D, G_LOT, M.apron, "lot2");
    ground(DIO.x0, DIO.z0, DIO.x1, 0, G_LOT, M.apron, "back");
    ground(DIO.x0, STREET.z1, DIO.x1, STREET.z1 + 0.4, G_LOT, M.apron, "street");
    ground(DIO.x0, STREET.z1 + 0.4, DIO.x1, DIO.z1, G_LOT, M.grass, "garden");
    /* faixas brancas e tampa de bueiro */
    for (const z of [STREET.z0 + 0.5, STREET.z1 - 0.3]) box(DIO.x0, G_ST, z, DIO.x1, G_ST + 0.004, z + 0.1, M.out, { color: 0xf2f1ea, ghost: true, skip: ["b"] });
    cyl(6.9, G_ST, STREET.z0 + 2.29, 0.34, 0.007, M.out, 0x5f5a55, { kind: "cyl12" });
    cyl(6.9, G_ST, STREET.z0 + 2.29, 0.26, 0.009, M.out, 0x6f6a64, { kind: "cyl12" });
    /* muros de bloco nos limites */
    box(-0.1, G_LOT, 0.1, 0, 0.7, LOT_D - 0.3, M.block, { tag: "wall2" });
    box(-0.45, G_LOT, -0.15, DIO.x1, 1.3, 0, M.block, { tag: "wall2" });
    /* limites invisíveis do passeio */
    const bound = (x0, z0, x1, z1) => solid(x0, -3, z0, x1, 40, z1, "bound");
    bound(DIO.x0 - 1, DIO.z0 - 1, DIO.x0, DIO.z1 + 1);
    bound(DIO.x1, DIO.z0 - 1, DIO.x1 + 1, DIO.z1 + 1);
    bound(DIO.x0 - 1, DIO.z0 - 1, DIO.x1 + 1, -0.15);
    bound(DIO.x0 - 1, STREET.z1 + 0.57, DIO.x1 + 1, DIO.z1 + 1);
    bound(-0.47, 0, 0, 7.35 + FZ);
    bound(DIO.x0, -0.9, -5.88, 7.8 + FZ);
  }

  function buildNeighbours() {
    const rr = rng(404);
    /* vizinho ao sul: sobrado de dois andares, varanda com roupa e futon */
    withOff(0, FZ, () => {
    const sn = occ("sn", -3.2, 4.3, 9);
    box(-5.9, G_LOT, 0.7, -0.45, 5.6, 7.8, M.siding, { face: sn, tag: "bound", skip: ["t"] });
    gable(-5.9, -0.45, 0.7, 7.8, 5.6, 7.05, 0.35, M.roof, M.siding, sn);
    box(-5.95, 2.8, 0.65, -0.4, 2.9, 7.85, M.out, { color: 0xd8cdb6, ghost: true, face: sn });
    win(-5.4, 0.9, 7.8, -4.4, 2.1, 7.84, true, sn);
    win(-2.4, 0.9, 7.8, -1.2, 2.1, 7.84, false, sn);
    win(-5.2, 3.05, 7.8, -3.4, 4.95, 7.84, true, sn);
    win(-2.6, 3.6, 7.8, -1.4, 4.8, 7.84, false, sn);
    win(-0.45, 1.2, 2.0, -0.41, 1.8, 2.6, false, sn);
    win(-0.45, 3.9, 5.2, -0.41, 4.5, 5.8, true, sn);
    box(-3.9, G_LOT, 7.8, -3.0, 2.0, 7.86, M.out, { color: 0x8b5e3c, ghost: true, face: sn });
    box(-4.15, 2.15, 7.8, -2.75, 2.2, 8.35, M.out, { color: 0x9a968f, ghost: true, face: sn });
    box(-2.95, 1.75, 7.86, -2.85, 1.9, 7.92, M.lampOut, { ghost: true, face: sn });
    lamp(-2.9, 1.8, 8.1, 0xffc98a, 2.6, 1.0, 0);
    box(-5.6, 2.85, 7.8, -0.9, 2.97, 8.6, M.out, { color: 0xe9e3d7, ghost: true, face: sn });
    box(-5.6, 3.9, 8.55, -0.9, 3.95, 8.6, M.out, { color: 0xd9d4ca, ghost: true, face: sn });
    for (let x = -5.55; x <= -0.95; x += 0.15) box(x, 2.97, 8.565, x + 0.02, 3.9, 8.585, M.out, { color: 0xd9d4ca, ghost: true, face: sn });
    laundry(-5.3, -3.0, 4.38, 8.16, rr, sn);
    box(-2.9, 3.3, 8.5, -1.3, 3.97, 8.66, M.cloth, { color: 0xefe2c2, ghost: true, face: sn });
    box(-2.9, 3.55, 8.495, -1.3, 3.65, 8.665, M.cloth, { color: 0x8fb0d6, ghost: true, face: sn });
    acUnit(-1.2, 2.97, 7.95, -0.5, 8.25, sn, "z");
    for (const [x, z, s] of [[-5.3, 8.1, 0.8], [-4.9, 8.2, 0.7], [-1.6, 8.15, 0.8]]) plant(x, 2.97, z, s, { out: true, solid: false, face: sn, flowers: [0xe8766b, 0xf7f4ea] });
    /* na lateral, junto ao nosso lote: aquecedor e ar-condicionado */
    box(-0.43, G_LOT, 6.6, -0.05, 1.8, 7.3, M.out, { color: 0xf1f0ea, tag: "bound", round: 0.03, face: sn });
    acUnit(-0.43, G_LOT, 5.4, -0.12, 6.2, sn, "x");
    solid(-0.43, G_LOT, 5.4, -0.12, 0.35, 6.2, "bound");
    /* frente: vasos e uma bicicleta */
    for (const [x, z, s] of [[-5.5, 8.15, 1.1], [-5.1, 8.35, 0.8], [-4.7, 8.2, 1.3], [-2.55, 8.3, 0.9]]) plant(x, G_LOT, z, s, { out: true, n: 4, flowers: rr() < 0.7 ? [0xf2d27a, 0xe8766b, 0xf7f4ea] : null, pot: rr() < 0.5 ? 0xc8744d : 0xe8dcc6 });
    bicycle(-1.3, G_LOT, 8.3, 0, 0x5f86b5);
    });

    /* casas dos fundos: as fontes falam em casas vizinhas, sem dizer quais */
    const b1 = occ("b1", -3.2, -3.9, 8.5);
    box(-5.7, G_LOT, -6.5, -0.7, 5.3, -1.3, M.tiles, { face: b1, tag: "bound", colorTop: 0xd9d2c6, color: 0xf7efe6 });
    box(-5.75, 5.3, -6.55, -0.65, 5.75, -6.35, M.out, { color: 0xe3dccf, ghost: true, face: b1 });
    box(-5.75, 5.3, -1.45, -0.65, 5.75, -1.25, M.out, { color: 0xe3dccf, ghost: true, face: b1 });
    box(-5.75, 5.3, -6.35, -5.55, 5.75, -1.45, M.out, { color: 0xe3dccf, ghost: true, face: b1 });
    box(-0.85, 5.3, -6.35, -0.65, 5.75, -1.45, M.out, { color: 0xe3dccf, ghost: true, face: b1 });
    for (const [x, z, s] of [[-5.1, -1.9, 1.2], [-4.4, -2.0, 0.9], [-1.4, -1.9, 1.1]]) plant(x, 5.3, z, s, { out: true, solid: false, face: b1, flowers: [0xf2d27a, 0xa98ad0] });
    laundry(-3.8, -1.8, 6.4, -2.4, rr, b1);
    for (const x of [-3.8, -1.8]) box(x - 0.02, 5.3, -2.42, x + 0.02, 6.42, -2.38, M.out, { color: 0x9a968f, ghost: true, face: b1 });
    win(-5.2, 0.9, -1.3, -4.0, 2.1, -1.26, true, b1);
    win(-3.2, 0.9, -1.3, -1.4, 2.4, -1.26, false, b1);
    win(-5.2, 3.3, -1.3, -3.6, 4.6, -1.26, false, b1);
    win(-2.8, 3.3, -1.3, -1.4, 4.6, -1.26, true, b1);
    acUnit(-3.5, 3.0, -1.3, -2.9, -1.05, b1, "z");
    const b2 = occ("b2", 3.1, -4.0, 8.5);
    box(0.2, G_LOT, -6.6, 6.2, 5.0, -1.2, M.siding, { face: b2, tag: "bound", skip: ["t"], color: 0xdcefe0 });
    gableX(0.2, 6.2, -6.6, -1.2, 5.0, 6.5, 0.35, M.roofBrown, M.siding, b2);
    win(0.8, 1.0, -1.2, 2.2, 2.2, -1.16, false, b2);
    win(3.2, 1.0, -1.2, 4.2, 2.2, -1.16, true, b2);
    win(0.8, 3.2, -1.2, 2.6, 4.5, -1.16, true, b2);
    win(4.0, 3.2, -1.2, 5.6, 4.5, -1.16, false, b2);
    box(3.6, 2.85, -1.2, 5.9, 2.95, -0.55, M.out, { color: 0xe9e3d7, ghost: true, face: b2 });
    box(3.6, 2.95, -0.6, 5.9, 3.85, -0.55, M.out, { color: 0xc9b89e, ghost: true, face: b2 });
    laundry(3.75, 5.75, 4.2, -0.9, rr, b2);
    acUnit(4.9, 2.95, -1.15, 5.5, -0.85, b2, "z");
    for (const [x, s] of [[3.8, 0.8], [5.7, 0.7]]) plant(x, 2.95, -0.75, s, { out: true, solid: false, face: b2, flowers: [0xe8766b, 0xf2d27a] });
    const bk = occ("bk", 8.6, -4.0, 6.5);
    box(7.0, G_LOT, -6.5, 10.2, 5.0, -1.4, M.sidingBlue, { face: bk, tag: "bound", skip: ["t"] });
    gable(7.0, 10.2, -6.5, -1.4, 5.0, 6.2, 0.3, M.roofBrown, M.sidingBlue, bk);
    win(7.5, 1.0, -1.4, 8.6, 2.0, -1.36, true, bk);
    win(7.5, 3.2, -1.4, 9.4, 4.2, -1.36, false, bk);
    box(7.0, 2.4, -1.4, 10.2, 2.5, -1.3, M.out, { color: 0xb8c3cf, ghost: true, face: bk });
    for (const x of [7.3, 9.6]) plant(x, G_LOT, -1.05, 1.0, { out: true, solid: false, face: bk });
  }

  function bicycle(x, y, z, ry, color, face) {
    const c = Math.cos(ry), s = Math.sin(ry);
    const P = (dx, dy) => [x + dx * c, y + dy, z - dx * s];
    for (const dx of [-0.45, 0.45]) { const p = P(dx, 0.33); geo("torus", place(p[0], p[1], p[2], 0.31, 0.31, 0.31, 0, ry, 0), M.out, 0x2f2b35, face); }
    const seg = (a, b, w, col) => {
      const pa = P(a[0], a[1]), pb = P(b[0], b[1]);
      const len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]);
      const m = new THREE.Matrix4().lookAt(new THREE.Vector3(...pa), new THREE.Vector3(...pb), new THREE.Vector3(0, 1, 0));
      const q = new THREE.Quaternion().setFromRotationMatrix(m);
      const mat = new THREE.Matrix4().compose(new THREE.Vector3((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2), q, new THREE.Vector3(w, w, len));
      geo("box", mat, M.out, col, face);
    };
    seg([-0.45, 0.33], [0, 0.35], 0.04, color);
    seg([0, 0.35], [0.4, 0.7], 0.04, color);
    seg([-0.45, 0.33], [-0.12, 0.72], 0.04, color);
    seg([-0.12, 0.72], [0.4, 0.7], 0.04, color);
    seg([0.45, 0.33], [0.4, 0.95], 0.035, color);
    seg([-0.12, 0.72], [-0.15, 0.85], 0.03, 0x2f2b35);
    const seat = P(-0.15, 0.87); geo("box", place(seat[0], seat[1], seat[2], 0.2, 0.05, 0.1, 0, ry, 0), M.out, 0x3b3a42, face);
    const bar = P(0.4, 0.97); geo("box", place(bar[0], bar[1], bar[2], 0.04, 0.04, 0.45, 0, ry, 0), M.out, 0x2f2b35, face);
    const bk2 = P(0.58, 0.85); geo("box", place(bk2[0], bk2[1], bk2[2], 0.25, 0.2, 0.3, 0, ry, 0), M.out, 0xb7bcc5, face);
    solid(Math.min(P(-0.75, 0)[0], P(0.75, 0)[0]), y, Math.min(P(-0.75, 0)[2], P(0.75, 0)[2]) - 0.15, Math.max(P(-0.75, 0)[0], P(0.75, 0)[0]), y + 0.95, Math.max(P(-0.75, 0)[2], P(0.75, 0)[2]) + 0.15, "bike");
  }

  function buildVacant() {
    const r = rng(606);
    /* mato, flores e hera no muro de trás */
    for (let i = 0; i < 80; i += 1) {
      const x = LOT_W + 0.25 + r() * (DIO.x1 - LOT_W - 0.55), z = 0.3 + r() * (LOT_D - 0.6);
      if (Math.hypot(x - STRAY.x, z - STRAY.z) < 0.7) continue;
      if (x > 8.5 && z > LOT_D - 1.0) continue;
      tuft(x, z, G_LOT, 0.6 + r() * 0.9, r);
      if (r() < 0.3) blob(x, G_LOT + 0.17 + r() * 0.15, z, 0.03, 0.03, 0.03, M.outLeaf, [0xf7f4ea, 0xf0d25a, 0xa98ad0, 0xf29bc0][(r() * 4) | 0]);
    }
    /* touceiras e folhas do fundo: sorteadas só até meio metro antes da borda do modelo */
    for (let i = 0; i < 18; i += 1) tuft(LOT_W + 0.3 + r() * (DIO.x1 - LOT_W - 0.8), 0.25 + r() * 0.4, G_LOT, 1.8 + r(), r);
    for (let i = 0; i < 26; i += 1) blob(LOT_W + 0.3 + r() * (DIO.x1 - LOT_W - 0.65), 0.05 + r() * 1.2, 0.03, 0.14 + r() * 0.12, 0.12 + r() * 0.1, 0.05, M.outLeaf, [0x4a8a4c, 0x5f9e57, 0x3f7a4a][(r() * 3) | 0]);
    /* blocos onde dorme o gato do bairro, com um potinho de água */
    box(STRAY.x - 0.38, G_LOT, STRAY.z - 0.24, STRAY.x + 0.22, 0.0, STRAY.z + 0.2, M.block, { tag: "blocks" });
    box(STRAY.x - 0.22, 0.0, STRAY.z - 0.2, STRAY.x + 0.22, 0.2, STRAY.z + 0.2, M.block, { tag: "blocks" });
    cyl(STRAY.x + 0.45, G_LOT, STRAY.z + 0.35, 0.08, 0.05, M.out, 0x5f9fd0, { kind: "cyl12" });
    cyl(STRAY.x + 0.45, G_LOT + 0.03, STRAY.z + 0.35, 0.06, 0.021, M.out, 0xbfe4f0, { kind: "cyl12" });
    /* placa em branco no fundo */
    for (const x of [8.8, 9.8]) box(x - 0.03, G_LOT, 0.47, x + 0.03, 1.5, 0.53, M.out, { color: 0x9aa3ad, tag: "post" });
    box(8.65, 0.85, 0.46, 9.95, 1.52, 0.5, M.out, { color: 0xf4f4ef, ghost: true });
    /* a placa diz 売地, terreno à venda. Inventado para o jogo: as fontes só
       confirmam que o terreno ao norte está vazio. O telefone fica em branco */
    {
      const t = tex(512, 264, (g2, w, h) => {
        if (MIRROR) { g2.translate(w, 0); g2.scale(-1, 1); }
        g2.fillStyle = "#f4f4ef"; g2.fillRect(0, 0, w, h);
        g2.fillStyle = "#c62828"; g2.fillRect(14, 14, w - 28, 22); g2.fillRect(14, h - 36, w - 28, 22);
        g2.fillStyle = "#1d2940"; g2.textAlign = "center"; g2.textBaseline = "middle";
        g2.font = "900 128px 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif";
        g2.fillText("売地", w / 2, 122);
        g2.strokeStyle = "#8a93a0"; g2.lineWidth = 3; g2.strokeRect(120, 188, w - 240, 30);
      });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.65), new THREE.MeshLambertMaterial({ map: t, clippingPlanes: [CLIP] }));
      sign.position.set(9.3 + OFF.x, 1.185, 0.503 + OFF.z);
      scene.add(sign);
    }
    /* corda amarela e preta na frente, entre postes baixos */
    const posts = [LOT_W + 0.1, 7.0, 7.9, 8.6], pzc = LOT_D - 0.16;
    for (const x of posts) box(x - 0.03, G_LOT, pzc - 0.03, x + 0.03, 0.35, pzc + 0.03, M.out, { color: 0xe9e4da, tag: "post" });
    for (let i = 0; i < posts.length - 1; i += 1) {
      const n = 8;
      for (let k = 0; k < n; k += 1) wire([posts[i] + (posts[i + 1] - posts[i]) * (k / n), 0.27 - Math.sin((k / n) * Math.PI) * 0.1, pzc], [posts[i] + (posts[i + 1] - posts[i]) * ((k + 1) / n), 0.27 - Math.sin(((k + 1) / n) * Math.PI) * 0.1, pzc], 0, k % 2 ? 0x2f2b35 : 0xf0c73c);
    }
    /* máquina de bebidas na esquina do terreno, virada para a rua: vitrine
       iluminada com três fileiras de latas e garrafas atrás de um vidro,
       etiqueta e botão embaixo de cada uma (faixa azul, gelado; vermelha,
       quente), painel de moedas com visor, e a portinha de retirada. A
       marca, as bebidas e os preços são inventados */
    withOff(0, FZ, () => {
    const vy = G_LOT, fz = 8.55;
    box(9.3, vy, 7.95, 10.2, vy + 1.83, fz, M.out, { color: 0xe3e5e1, colorTop: 0xd6d8d3, tag: "vend", round: 0.045 });
    box(9.31, vy, fz - 0.03, 10.19, vy + 0.07, fz + 0.01, M.out, { color: 0x4a4952, ghost: true });
    box(9.32, vy + 1.63, fz, 10.18, vy + 1.8, fz + 0.016, M.vendHead, { ghost: true });
    box(9.32, vy + 1.672, fz + 0.016, 10.18, vy + 1.684, fz + 0.019, M.out, { color: 0xf4f6f8, ghost: true });
    for (const x of [9.5, 9.64, 9.78]) geo("cyl12", place(x, vy + 1.735, fz + 0.019, 0.022, 0.004, 0.022, Math.PI / 2, 0, 0), M.out, 0xf4f6f8);
    /* moldura, fundo aceso e vidro da vitrine */
    box(9.35, vy + 0.92, fz, 10.15, vy + 1.61, fz + 0.012, M.out, { color: 0x8f959e, ghost: true });
    box(9.38, vy + 0.95, fz + 0.012, 10.12, vy + 1.58, fz + 0.015, M.vend, { ghost: true });
    const DCOL = [0xc8a86a, 0x8a5a36, 0x6fae5b, 0xf2d27a, 0xf2b1a1, 0x3f6fb5, 0xd9534a, 0xf4efe6, 0x9cc6d9, 0x2f6b4f, 0xe8766b, 0xb59ad8];
    for (let row = 0; row < 3; row += 1) {
      const y0 = vy + 1.0 + row * 0.21;
      for (let i = 0; i < 6; i += 1) {
        const cx = 9.45 + i * 0.12, col = DCOL[(row * 5 + i * 7) % DCOL.length], dz = fz + 0.026;
        if ((row + i) % 3 === 1) {
          /* garrafa pet: corpo, ombro e tampinha */
          geo("cyl12", place(cx, y0 + 0.05, dz, 0.023, 0.1, 0.023), M.out, col);
          geo("cyl12", place(cx, y0 + 0.045, dz, 0.0235, 0.035, 0.0235), M.out, 0xf6f4ee);
          geo("cone8", place(cx, y0 + 0.115, dz, 0.023, 0.03, 0.023), M.out, col);
          geo("cyl12", place(cx, y0 + 0.136, dz, 0.01, 0.014, 0.01), M.out, 0xf4f4f0);
        } else {
          /* lata, com a faixa do rótulo e a tampa de alumínio */
          geo("cyl12", place(cx, y0 + 0.047, dz, 0.022, 0.094, 0.022), M.out, col);
          geo("cyl12", place(cx, y0 + 0.05, dz, 0.0225, 0.028, 0.0225), M.out, 0xf6f4ee);
          geo("cyl12", place(cx, y0 + 0.096, dz, 0.019, 0.006, 0.019), M.out, 0xc9ccd2);
        }
        const warm = row === 0 && i >= 4;
        box(cx - 0.042, y0 - 0.034, fz + 0.015, cx + 0.042, y0 - 0.014, fz + 0.019, M.out, { color: 0xf8f8f4, ghost: true });
        box(cx - 0.042, y0 - 0.046, fz + 0.015, cx + 0.042, y0 - 0.036, fz + 0.019, warm ? M.vendWarm : M.vendCold, { ghost: true });
        geo("cyl12", place(cx + 0.024, y0 - 0.024, fz + 0.021, 0.008, 0.006, 0.008, Math.PI / 2, 0, 0), M.vendBtn, null);
      }
    }
    box(9.38, vy + 0.95, fz + 0.052, 10.12, vy + 1.58, fz + 0.055, M.vendGlass, { ghost: true });
    for (const [x0, y0, x1, y1] of [[9.35, vy + 0.92, 10.15, vy + 0.95], [9.35, vy + 1.58, 10.15, vy + 1.61], [9.35, vy + 0.95, 9.38, vy + 1.58], [10.12, vy + 0.95, 10.15, vy + 1.58]]) box(x0, y0, fz, x1, y1, fz + 0.058, M.out, { color: 0x8f959e, ghost: true });
    /* faixa acesa sob a vitrine e o cartaz de baixo */
    box(9.38, vy + 0.84, fz, 10.12, vy + 0.89, fz + 0.016, M.vendStrip, { ghost: true });
    box(9.38, vy + 0.46, fz, 9.94, vy + 0.8, fz + 0.012, M.out, { color: 0x3f6fb5, ghost: true });
    box(9.38, vy + 0.58, fz + 0.012, 9.94, vy + 0.6, fz + 0.015, M.out, { color: 0xf4f6f8, ghost: true });
    geo("cyl12", place(9.62, vy + 0.69, fz + 0.014, 0.06, 0.004, 0.06, Math.PI / 2, 0, 0), M.out, 0xf4f6f8);
    geo("cyl12", place(9.62, vy + 0.69, fz + 0.017, 0.042, 0.004, 0.042, Math.PI / 2, 0, 0), M.out, 0x6fb6e8);
    /* painel de moedas: fenda, nota, visor, alavanca de troco e a conchinha */
    box(9.97, vy + 0.4, fz, 10.14, vy + 0.82, fz + 0.016, M.out, { color: 0x3b3a42, ghost: true });
    box(10.03, vy + 0.765, fz + 0.016, 10.09, vy + 0.772, fz + 0.019, M.out, { color: 0xc9ccd2, ghost: true });
    box(10.0, vy + 0.7, fz + 0.016, 10.12, vy + 0.722, fz + 0.019, M.out, { color: 0x8f959e, ghost: true });
    box(10.01, vy + 0.706, fz + 0.019, 10.11, vy + 0.716, fz + 0.021, M.out, { color: 0x1b1a20, ghost: true });
    box(10.0, vy + 0.6, fz + 0.016, 10.12, vy + 0.66, fz + 0.019, M.vendLed, { ghost: true });
    geo("cyl12", place(10.06, vy + 0.54, fz + 0.022, 0.014, 0.012, 0.014, Math.PI / 2, 0, 0), M.out, 0xc9ccd2);
    box(10.0, vy + 0.42, fz + 0.016, 10.12, vy + 0.49, fz + 0.04, M.out, { color: 0x2b2a30, ghost: true });
    /* portinha de retirada */
    box(9.4, vy + 0.1, fz, 9.96, vy + 0.36, fz + 0.016, M.out, { color: 0x2b2a30, ghost: true });
    box(9.43, vy + 0.13, fz + 0.016, 9.93, vy + 0.33, fz + 0.026, M.out, { color: 0x55545c, ghost: true });
    box(9.6, vy + 0.3, fz + 0.026, 9.76, vy + 0.312, fz + 0.034, M.out, { color: 0xc9ccd2, ghost: true });
    /* uma faixa azul na lateral, virada para o terreno vazio */
    box(9.296, vy + 1.05, 8.0, 9.3, vy + 1.25, 8.5, M.out, { color: 0x3f6fb5, ghost: true });
    box(9.296, vy + 1.28, 8.0, 9.3, vy + 1.3, 8.5, M.out, { color: 0x3f6fb5, ghost: true });
    lamp(9.75, vy + 1.2, 8.95, 0xd8f0ff, 2.0, 0.48, 0);
    box(8.8, vy, 8.05, 9.2, vy + 0.85, 8.45, M.out, { color: 0x5f86b5, colorTop: 0xe9eef3, tag: "bin", round: 0.04 });
    for (const x of [8.9, 9.1]) geo("cyl12", place(x, vy + 0.62, 8.455, 0.06, 0.01, 0.06, Math.PI / 2, 0, 0), M.out, 0x2b2a30);
    });
  }

  /* a cerejeira do terreno vazio. Inventada para o jogo, como o resto do
     entorno: nenhuma fonte fala de árvore ao norte da casa. Uma somei-yoshino
     baixa e larga, de copa em guarda-chuva, que não passa da borda do modelo.
     O tronco é sólido; a copa some quando fica entre a câmera e a casa */
  const TREE = { x: 8.75, z: 2.25, cy: 2.75, rx: 1.3, ry: 0.72, rz: 1.2 };
  const SAKURA = [0xf4aec6, 0xf09bb8, 0xf7c3d4, 0xea88aa, 0xfad6e2, 0xf2a9c2];
  const _la = new THREE.Vector3(), _lb = new THREE.Vector3(), _ly = new THREE.Vector3(0, 1, 0);
  /* galho redondo entre dois pontos do mundo */
  function limb(a, b, w, color, face) {
    _la.set(a[0], a[1], a[2]); _lb.set(b[0], b[1], b[2]);
    const len = _la.distanceTo(_lb);
    _q.setFromUnitVectors(_ly, _lb.clone().sub(_la).normalize());
    _p.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    _s.set(w / 2, len + w * 0.3, w / 2);
    geo("cyl8", MAT4.compose(_p, _q, _s), M.out, color, face);
  }
  function buildSakura() {
    const r = rng(1804);
    const T = TREE, bark = 0x5b4a45, bark2 = 0x6e5b53;
    /* tronco um pouco torto e raízes rasas */
    const trunk = [[T.x, G_LOT, T.z], [T.x - 0.06, 0.55, T.z + 0.03], [T.x - 0.02, 1.25, T.z - 0.02]];
    limb(trunk[0], trunk[1], 0.26, bark);
    limb(trunk[1], trunk[2], 0.21, bark);
    for (const [dx, dz] of [[0.28, 0.05], [-0.24, 0.1], [0.04, -0.27], [-0.05, 0.26]]) limb([T.x, G_LOT + 0.1, T.z], [T.x + dx, G_LOT + 0.015, T.z + dz], 0.08, bark2);
    solid(T.x - 0.14, G_LOT, T.z - 0.14, T.x + 0.14, 1.3, T.z + 0.14, "tree");
    /* galhos que abrem para os lados, cada um com um cacho de flor na ponta */
    const top = trunk[2], tips = [];
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2 + r() * 0.5, d = 0.55 + r() * 0.45;
      const tip = [T.x + Math.cos(a) * T.rx * d, T.cy - 0.25 + r() * 0.35, T.z + Math.sin(a) * T.rz * d];
      const mid = [(top[0] + tip[0]) / 2, (top[1] + tip[1]) / 2 + 0.18, (top[2] + tip[2]) / 2];
      limb(top, mid, 0.11, bark, "sakura");
      limb(mid, tip, 0.07, bark2, "sakura");
      tips.push(tip);
    }
    /* a copa: bolas de flor numa casca de elipsoide, mais densas em cima */
    for (let i = 0; i < 46; i += 1) {
      const th = r() * Math.PI * 2, ph = Math.acos(1 - r() * 1.3), k = 0.72 + r() * 0.3;
      const x = T.x + Math.sin(ph) * Math.cos(th) * T.rx * k, z = T.z + Math.sin(ph) * Math.sin(th) * T.rz * k, y = T.cy + Math.cos(ph) * T.ry * k;
      const rr2 = 0.3 + r() * 0.24;
      blob(x, y, z, rr2, rr2 * 0.82, rr2, M.outLeaf, SAKURA[(r() * SAKURA.length) | 0], { kind: "ico1", ry: r() * 3, face: "sakura" });
    }
    for (const t of tips) blob(t[0], t[1] + 0.05, t[2], 0.34, 0.28, 0.34, M.outLeaf, SAKURA[(r() * SAKURA.length) | 0], { kind: "ico1", face: "sakura" });
    /* pétalas caídas no pedrisco, mais juntas perto do tronco */
    for (let i = 0; i < 90; i += 1) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 1.75;
      const x = T.x + Math.cos(a) * d, z = T.z + Math.sin(a) * d * 0.95;
      if (x < LOT_W + 0.1 || x > DIO.x1 - 0.1 || z < 0.1 || z > LOT_D - 0.2) continue;
      if (Math.abs(x - STRAY.x) < 0.45 && Math.abs(z - STRAY.z) < 0.35) continue;
      blob(x, G_LOT + 0.004, z, 0.026, 0.003, 0.017, M.out, SAKURA[(r() * SAKURA.length) | 0], { ry: r() * 3 });
    }
  }

  function buildAcross() {
    const r = rng(707);
    const zw = STREET.z1 + 0.4;
    /* mureta de bloco com cerca de ripas de madeira: o gato anda em cima. A
       cerca vai em trechos de 2 m, que somem quando ficam entre a câmera e o
       gato (as máquinas de cápsulas e o pianinho ficam logo na frente dela) */
    box(DIO.x0, G_LOT, zw, DIO.x1, 0.2, zw + 0.15, M.block, { tag: "wall2" });
    const fseg = (x) => "fence" + Math.max(0, Math.min(FENCE.n - 1, Math.floor((x - DIO.x0) / FENCE.seg)));
    for (let x = DIO.x0 + 0.05; x < DIO.x1 - 0.05; x += 0.14) box(x, 0.2, zw + 0.06, x + 0.1, 1.15, zw + 0.09, M.out, { color: r() < 0.5 ? 0xb88a5a : 0xc39565, ghost: true, face: fseg(x + 0.05) });
    for (let k = 0; k < FENCE.n; k += 1) box(DIO.x0 + k * FENCE.seg, 1.15, zw + 0.04, Math.min(DIO.x1, DIO.x0 + (k + 1) * FENCE.seg), 1.2, zw + 0.11, M.out, { color: 0x9a6e45, tag: "wall2", face: "fence" + k });
    solid(DIO.x0, 0.2, zw + 0.06, DIO.x1, 1.15, zw + 0.09, "wall2");
    /* jardim atrás da cerca: arbustos, hortênsias, duas árvores */
    for (let x = DIO.x0 + 0.5; x < DIO.x1 - 0.5; x += 0.8 + r() * 0.9) blob(x, 0.1 + r() * 0.12, zw + 0.55 + r() * 0.3, 0.32 + r() * 0.12, 0.26 + r() * 0.12, 0.28, M.outLeaf, [0x4a8a4c, 0x5f9e57, 0x3f7a4a, 0x6aaa58][(r() * 4) | 0], { kind: "ico1" });
    for (let i = 0; i < 12; i += 1) {
      const x = DIO.x0 + 0.6 + r() * (DIO.x1 - DIO.x0 - 1.2), c = [0x8fa8e0, 0xb59ad8, 0xe8a3c4, 0x9cc3e6][(r() * 4) | 0];
      blob(x, 0.15, zw + 0.55, 0.22, 0.2, 0.2, M.outLeaf, 0x5f9e57, { kind: "ico1" });
      for (let k = 0; k < 5; k += 1) blob(x + (r() - 0.5) * 0.3, 0.3 + r() * 0.15, zw + 0.45 + r() * 0.2, 0.08, 0.07, 0.08, M.outLeaf, c);
    }
    const TZ = STREET.z1 + 1.44;
    const t1 = occ("tree1", 7.3, TZ, 6);
    for (const [dx, h, rz] of [[0, 2.4, 0.1], [0.15, 2.1, -0.25]]) geo("cyl6", place(7.3 + dx, h / 2 - 0.05, TZ, 0.09, h, 0.09, 0, 0, rz), M.out, 0x8a6a55, t1);
    for (const [dx, dy, dz, s] of [[0, 3.1, 0, 1.0], [-0.7, 2.7, 0.3, 0.75], [0.7, 2.8, -0.2, 0.8], [0.2, 3.6, 0.2, 0.7], [-0.3, 2.6, -0.5, 0.6]]) {
      blob(7.3 + dx, dy, TZ + dz, 0.85 * s, 0.7 * s, 0.85 * s, M.outLeaf, [0x5f9e57, 0x6fae5b, 0x4a8a4c][(r() * 3) | 0], { kind: "ico1", face: t1 });
    }
    for (let i = 0; i < 26; i += 1) {
      const a = r() * Math.PI * 2, e = r() * 1.2 - 0.2;
      blob(7.3 + Math.cos(a) * Math.cos(e) * 0.95, 3.0 + Math.sin(e) * 0.75, TZ + Math.sin(a) * Math.cos(e) * 0.95, 0.09, 0.08, 0.09, M.outLeaf, r() < 0.5 ? 0xf29bc0 : 0xf7b8d3, { face: t1 });
    }
    const t2 = occ("tree2", -1.8, TZ, 5.5);
    geo("cyl6", place(-1.8, 1.2, TZ, 0.1, 2.5, 0.1), M.out, 0x7a5a45, t2);
    for (const [dx, dy, dz, s] of [[0, 2.9, 0, 1.0], [-0.5, 2.5, 0.2, 0.7], [0.5, 2.6, -0.1, 0.7]]) blob(-1.8 + dx, dy, TZ + dz, 0.9 * s, 0.75 * s, 0.9 * s, M.outLeaf, [0x76b563, 0x88c46e][(r() * 2) | 0], { kind: "ico1", face: t2 });
    /* na frente da cerca: floreiras de isopor, regador, bicicleta, espelho */
    for (let i = 0; i < 4; i += 1) {
      const x0 = 1.6 + i * 0.75;
      box(x0, G_LOT, STREET.z1 + 0.08, x0 + 0.62, 0.1, STREET.z1 + 0.36, M.out, { color: 0xf4f4ef, tag: "planter", round: 0.025 });
      for (let k = 0; k < 3; k += 1) blob(x0 + 0.12 + k * 0.19, 0.2 + r() * 0.08, STREET.z1 + 0.22, 0.1, 0.12, 0.1, M.outLeaf, [0x6fae5b, 0x88c46e][(r() * 2) | 0]);
      for (let k = 0; k < 4; k += 1) blob(x0 + 0.08 + r() * 0.46, 0.3 + r() * 0.1, STREET.z1 + 0.14 + r() * 0.16, 0.03, 0.03, 0.03, M.outLeaf, [0xe8766b, 0xf2d27a, 0xf7f4ea, 0xa98ad0][(r() * 4) | 0]);
    }
    box(4.75, G_LOT, STREET.z1 + 0.15, 4.95, 0.02, STREET.z1 + 0.3, M.out, { color: 0x5f9fd0, tag: "planter" });
    geo("box", place(5.02, -0.02, STREET.z1 + 0.22, 0.14, 0.02, 0.02, 0, 0, 0.5), M.out, 0x5f9fd0);
    bicycle(-2.0, G_LOT, STREET.z1 + 0.2, 0, 0xd8584a);
    /* máquinas de cápsulas na calçada, viradas para a rua: duas colunas de duas */
    const GZ = STREET.z1 - 0.09;
    box(6.48, G_LOT, GZ, 7.62, G_LOT + 0.1, GZ + 0.46, M.out, { color: 0x8e9096, colorTop: 0x9aa3ad, tag: "gacha" });
    const gcol = [[0xf2a7b8, 0x9fd6c2], [0xf2d27a, 0x9cc3e6]];
    const capc = [0xe8766b, 0xf2d27a, 0x9cc3e6, 0x9fd6c2, 0xb59ad8, 0xf7f4ea];
    for (let i = 0; i < 2; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x0 = 6.5 + i * 0.56, y0 = G_LOT + 0.1 + j * 0.62;
        box(x0, y0, GZ, x0 + 0.54, y0 + 0.61, GZ + 0.44, M.out, { color: gcol[i][j], colorTop: 0xf4f1ea, tag: "gacha", round: 0.035 });
        box(x0 + 0.06, y0 + 0.28, GZ - 0.012, x0 + 0.48, y0 + 0.57, GZ, M.out, { color: 0xf3f8fc, ghost: true, skip: ["pz"] });
        for (let k = 0; k < 6; k += 1) blob(x0 + 0.12 + (k % 3) * 0.15, y0 + 0.34 + Math.floor(k / 3) * 0.11, GZ - 0.016, 0.045, 0.045, 0.012, M.out, capc[(k + i * 2 + j * 3) % capc.length]);
        geo("cyl12", place(x0 + 0.27, y0 + 0.15, GZ - 0.018, 0.075, 0.03, 0.075, Math.PI / 2, 0, 0), M.out, 0xeae6dd);
        geo("box", place(x0 + 0.27, y0 + 0.15, GZ - 0.038, 0.11, 0.024, 0.016), M.out, 0x8e9096);
        box(x0 + 0.42, y0 + 0.11, GZ - 0.006, x0 + 0.48, y0 + 0.2, GZ, M.out, { color: 0x3b3a42, ghost: true, skip: ["pz"] });
        box(x0 + 0.05, y0 + 0.03, GZ - 0.01, x0 + 0.18, y0 + 0.1, GZ, M.out, { color: 0x3b3a42, ghost: true, skip: ["pz"] });
      }
    }
    /* letreiro em cima das máquinas: aceso de noite, mas baixo, e uma luz
       fraca na frente para as máquinas não sumirem no escuro */
    box(6.48, G_LOT + 1.33, GZ + 0.02, 7.62, G_LOT + 1.45, GZ + 0.42, M.gachaSign, { ghost: true });
    lamp(7.05, G_LOT + 1.1, GZ - 0.5, 0xd6e8ff, 2.0, 0.55, 0);
    /* espelho de esquina */
    cyl(-3.9, G_LOT, STREET.z1 + 0.25, 0.035, 2.8, M.out, 0xe8762d);
    geo("cyl12", place(-3.9, 2.75, STREET.z1 + 0.18, 0.34, 0.04, 0.34, Math.PI / 2, -0.6, 0), M.out, 0xe8762d);
    geo("cyl12", place(-3.9, 2.75, STREET.z1 + 0.15, 0.29, 0.02, 0.29, Math.PI / 2, -0.6, 0), M.mirror, null);
    solid(-3.95, G_LOT, STREET.z1 + 0.2, -3.85, 2.6, STREET.z1 + 0.3, "post");
    /* poste de concreto com transformador, fiação e luminária */
    const pole = occ("pole", -5.5, STREET.z1 + 0.25, 5);
    const pz = STREET.z1 + 0.25;
    geo("cyl8", place(-5.5, 5.1, pz, 0.15, 10.6, 0.15), M.out, 0xc4c0b8, pole);
    for (let i = 0; i < 5; i += 1) cyl(-5.5, G_LOT + i * 0.36, pz, 0.165, 0.18, M.out, i % 2 ? 0x2f2b35 : 0xf0c73c, { face: pole });
    box(-6.3, 9.55, pz - 0.05, -4.7, 9.63, pz + 0.05, M.out, { color: 0x8e9096, ghost: true, face: pole });
    for (const x of [-6.2, -5.8, -5.2, -4.8]) cyl(x, 9.63, pz, 0.035, 0.1, M.out, 0xf4f1ea, { face: pole });
    cyl(-5.18, 6.9, pz, 0.24, 0.7, M.out, 0x9aa3ad, { face: pole, kind: "cyl12" });
    box(-5.5, 6.4, pz - 0.95, -5.46, 6.45, pz, M.out, { color: 0x8e9096, ghost: true, face: pole });
    box(-5.62, 6.28, pz - 1.1, -5.34, 6.38, pz - 0.85, M.lampOut, { ghost: true, face: pole });
    lamp(-5.5, 6.0, pz - 1.0, 0xfff1c8, 7.5, 1.4, 0);
    solid(-5.66, G_LOT, pz - 0.16, -5.34, 11, pz + 0.16, "post");
    for (const y of [9.63, 9.35]) wire([DIO.x0, y + 0.08, pz], [DIO.x1, y + 0.08, pz], 0.45);
    wire([DIO.x0, 7.6, pz + 0.05], [DIO.x1, 7.6, pz + 0.05], 0.35);
    wire([-5.5, 7.6, pz], [-1.0, 5.4, 7.8 + FZ], 0.4);
  }

  buildHouse();
  buildShelf();
  buildInterior();
  buildGround();
  buildNeighbours();
  buildVacant();
  buildSakura();
  buildAcross();
  flush();
  for (const m of [...(faceGroups.door || []), ...(faceGroups.door2 || [])]) { m.matrixAutoUpdate = true; m.castShadow = false; }

  /* fiação e corda: linhas de um pixel, que não somem na grade baixa */
  const wires = (() => {
    const pos = [], col = [];
    for (const w of WIRES) {
      const n = w.sag ? 16 : 1;
      const c = rgb(w.color);
      for (let i = 0; i < n; i += 1) {
        for (const t of [i / n, (i + 1) / n]) {
          pos.push(w.a[0] + (w.b[0] - w.a[0]) * t, w.a[1] + (w.b[1] - w.a[1]) * t - Math.sin(t * Math.PI) * w.sag, w.a[2] + (w.b[2] - w.a[2]) * t);
          col.push(c[0], c[1], c[2]);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true }));
    scene.add(lines);
    return lines;
  })();

  /* ---------------------------------------------------------------------
     luz: céu, sol que acompanha a câmera, luminárias que acendem à noite
     --------------------------------------------------------------------- */
  const DAY = {
    skyTop: 0x7fc0f0, skyBot: 0xfde7cc, cloud: 0xffffff, hemiSky: 0xdce8f8, hemiGround: 0xb09a86, hemiI: 0.52, keyC: 0xfff1dc, keyI: 0.84,
    haze: 0xf1e6d8, hazeAmt: 0.22, sat: 1.16, tintS: [0.94, 0.97, 1.08], tintL: [1.04, 1.01, 0.97], thresh: 0.985, bloom: 0.22, vig: 0.28,
  };
  const NIGHT = {
    skyTop: 0x0c1430, skyBot: 0x2b3563, cloud: 0x243058, hemiSky: 0x5b6ca8, hemiGround: 0x2a2638, hemiI: 0.5, keyC: 0x9fb2f0, keyI: 0.26,
    haze: 0x1e2442, hazeAmt: 0.36, sat: 1.06, tintS: [0.86, 0.93, 1.14], tintL: [1.12, 1.01, 0.88], thresh: 0.66, bloom: 0.58, vig: 0.5,
  };
  const hemi = new THREE.HemisphereLight(DAY.hemiSky, DAY.hemiGround, DAY.hemiI);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(DAY.keyC, DAY.keyI);
  key.castShadow = true;
  key.shadow.mapSize.set(SMALL ? 1024 : 2048, SMALL ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 90 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  scene.add(key, key.target);
  key.target.position.set(HC.x, 0, HC.z);
  renderer.shadowMap.autoUpdate = false;
  /* poucas luzes pontuais de verdade, levadas para as luminárias mais perto
     da câmera: a casa acende inteira sem pesar */
  const lampLights = [];
  for (let i = 0; i < (SMALL ? 4 : 8); i += 1) { const p = new THREE.PointLight(0xffffff, 0, 3, 2); scene.add(p); lampLights.push(p); }
  let poolKey = "";
  function assignLamps(tx, ty, tz) {
    const k = `${night ? 1 : 0}|${Math.round(tx * 2)}|${Math.round(ty * 2)}|${Math.round(tz * 2)}`;
    if (k === poolKey) return;
    poolKey = k;
    const cand = [];
    for (const l of LAMPS) { const I = night ? l.night : l.day; if (I > 0) cand.push({ l, I, d: (l.x - tx) ** 2 + ((l.y - ty) * 1.4) ** 2 + (l.z - tz) ** 2 }); }
    cand.sort((a, b) => a.d - b.d);
    lampLights.forEach((p, i) => {
      const c = cand[i];
      if (!c) { p.intensity = 0; return; }
      p.position.set(c.l.x, c.l.y, c.l.z); p.color.setHex(c.l.color); p.distance = c.l.dist * (night ? 1.15 : 1); p.intensity = c.I * (night ? 1.35 : 1);
    });
  }

  /* ---------------------------------------------------------------------
     peças coloridas para os bichos e as pessoas
     --------------------------------------------------------------------- */
  M.cat = toon({ rim: true });
  M.catClip = toon({ clip: true, rim: true });
  M.pet = toon({ rim: true, gloss: true });
  M.petClip = toon({ clip: true, rim: true, gloss: true });
  M.eyeShine = new THREE.MeshBasicMaterial({ vertexColors: true });
  /* o vulto do gato atrás das paredes: desenhado antes do próprio gato, para
     que ele não se esconda atrás de si mesmo */
  M.ghost = new THREE.MeshBasicMaterial({ color: 0xeaf6ff, opacity: 0.6, depthWrite: false, depthFunc: THREE.GreaterDepth, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
  /* bichos e gente em formas lisas: esfera no lugar do poliedro, cápsula no
     lugar do cilindro de seis lados, caixa de cantos redondos */
  const SMOOTH = { ico1: "sph", ico0: "sph", cyl6: "cap", box: "rbx", cone4: "cone10" };
  function part(kind, sx, sy, sz, color, x, y, z, rx, ry, rz, shadow) {
    const g = baseGeo(SMOOTH[kind] || kind).clone();
    g.scale(sx, sy, sz);
    const n = g.attributes.position.count, c = rgb(color), arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) arr.set(c, i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
    const m = new THREE.Mesh(g, M.cat);
    m.position.set(x || 0, y || 0, z || 0);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    m.castShadow = !!shadow;
    return m;
  }

  /* ---------------------------------------------------------------------
     malhas lisas para os bonecos: bolhas deformadas, tubos que afinam,
     sólidos de revolução e tufos. Coordenadas: x para a frente, y para
     cima, z de lado; o chão em y = 0
     --------------------------------------------------------------------- */
  function smoothNormals(g) {
    g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal, acc = new Map();
    const key = (i) => `${Math.round(p.getX(i) * 20000)},${Math.round(p.getY(i) * 20000)},${Math.round(p.getZ(i) * 20000)}`;
    for (let i = 0; i < p.count; i += 1) {
      const k = key(i);
      let a = acc.get(k);
      if (!a) { a = [0, 0, 0]; acc.set(k, a); }
      a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i);
    }
    for (let i = 0; i < p.count; i += 1) {
      const a = acc.get(key(i)), L = Math.hypot(a[0], a[1], a[2]) || 1;
      n.setXYZ(i, a[0] / L, a[1] / L, a[2] / L);
    }
  }
  function paintGeo(g, paint, ox, oy, oz) {
    const p = g.attributes.position, arr = new Float32Array(p.count * 3), out = [1, 1, 1];
    for (let i = 0; i < p.count; i += 1) {
      paint(p.getX(i) + ox, p.getY(i) + oy, p.getZ(i) + oz, out);
      arr[i * 3] = out[0]; arr[i * 3 + 1] = out[1]; arr[i * 3 + 2] = out[2];
    }
    g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
    return g;
  }
  const _bv = new THREE.Vector3();
  /* esfera de raios (rx, ry, rz), deformada por fn no espaço da esfera
     unitária; paint recebe a posição já somada a (ox, oy, oz) */
  function blobGeo(rx, ry, rz, deform, paint, ox, oy, oz, seg) {
    const n = seg || 22;
    const g0 = new THREE.SphereGeometry(1, n, Math.round(n * 0.7));
    const pos = g0.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      _bv.fromBufferAttribute(pos, i);
      if (deform) deform(_bv);
      pos.setXYZ(i, _bv.x * rx, _bv.y * ry, _bv.z * rz);
    }
    const g = g0.toNonIndexed();
    g0.dispose();
    smoothNormals(g);
    return paintGeo(g, paint, ox || 0, oy || 0, oz || 0);
  }
  /* tubo de pontas redondas, afinando de r0 (em cima) para r1 (embaixo),
     com comprimento len e o centro na origem */
  function taperGeo(r0, r1, len, paint, ox, oy, oz) {
    const pts = [], cap = 6;
    for (let i = 0; i <= cap; i += 1) { const a = (i / cap) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * r1, -len / 2 + r1 * (1 - Math.cos(a)))); }
    for (let i = 0; i <= cap; i += 1) { const a = Math.PI / 2 - (i / cap) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * r0 + 1e-5, len / 2 - r0 * (1 - Math.cos(a)))); }
    const g0 = new THREE.LatheGeometry(pts, 11);
    const g = g0.index ? g0.toNonIndexed() : g0;
    smoothNormals(g);
    return paintGeo(g, paint, ox || 0, oy || 0, oz || 0);
  }
  /* sólido de revolução a partir de um perfil [raio, altura] de 0 a 1,
     esticado em (sx, sy, sz): orelhas e tufos */
  function latheGeo(profile, seg, sx, sy, sz, paint) {
    const g0 = new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), seg);
    const g = g0.index ? g0.toNonIndexed() : g0;
    g.scale(sx, sy, sz);
    smoothNormals(g);
    return paintGeo(g, paint, 0, 0, 0);
  }
  const SPIKE = [[0.001, 0], [1.0, 0], [0.97, 0.2], [0.78, 0.48], [0.48, 0.76], [0.22, 0.92], [0.06, 0.99], [0.001, 1.0]];
  const _qa = new THREE.Quaternion(), _ya = new THREE.Vector3(0, 1, 0), _da = new THREE.Vector3(), _sa = new THREE.Vector3(1, 1, 1), _pa = new THREE.Vector3(), _ma = new THREE.Matrix4();
  /* tufo (um espeto macio) com a base em (x, y, z) apontando para d */
  function spikeGeo(x, y, z, dx, dy, dz, len, r, paint) {
    const g = latheGeo(SPIKE, 9, r, len, r, paint);
    _da.set(dx, dy, dz).normalize();
    _qa.setFromUnitVectors(_ya, _da);
    g.applyMatrix4(_ma.compose(_pa.set(x, y, z), _qa, _sa));
    return new THREE.Mesh(g, M.cat);
  }
  function placed(g, x, y, z, rx, ry, rz, mat) {
    const m = new THREE.Mesh(g, mat || M.cat);
    m.position.set(x || 0, y || 0, z || 0);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    return m;
  }
  const solidPaint = (hex) => { const c = Array.isArray(hex) ? hex : rgb(hex); return (x, y, z, o) => { o[0] = c[0]; o[1] = c[1]; o[2] = c[2]; }; };

  /* abertura dos olhos, de 0 (fechados) a 1; open é o que o gato quer, e
     de vez em quando ele pisca por conta própria */
  function catEyes(f, want, dt, noBlink) {
    f.blink -= dt;
    if (f.blink <= 0) { f.blink = 2.2 + Math.random() * 4.5; if (!noBlink && want > 0.3) f.blinkT = 0.17; }
    let v = want;
    if (f.blinkT > 0) { f.blinkT = Math.max(0, f.blinkT - dt); v = Math.min(v, Math.abs(f.blinkT / 0.17 - 0.5) * 2); }
    f.open += (v - f.open) * Math.min(1, dt * (f.blinkT > 0 ? 40 : 9));
    const o = f.open;
    for (const e of f.eyes) { const k = e.userData.k || 1; e.visible = o > 0.12; e.scale.set(k, k * Math.max(0.12, o), k); }
    for (const l of f.lids) l.visible = o < 0.3;
  }
  /* ---------------------------------------------------------------------
     vida parada: a orelha que mexe sozinha, a ponta do rabo que estala, o
     olhar em volta, a lambida na pata, o bocejo e a espreguiçada. É enfeite:
     nada disso muda o jogo
     --------------------------------------------------------------------- */
  const IDLE_DUR = { groom: 3.4, yawn: 1.9, stretch: 2.4 };
  function idleState() {
    return { ear: 1 + Math.random() * 4, earT: 0, earS: 1, flick: 2 + Math.random() * 4, flickT: 0, look: 2 + Math.random() * 4, lookT: 0, lookD: 1, lookA: 0, act: 4 + Math.random() * 8, actT: 0, dur: 1, kind: "" };
  }
  /* awake: pode olhar em volta; acts: os gestos que cabem na pose de agora */
  function idleTick(s, dt, awake, acts) {
    if (s.freeze) return;
    s.ear -= dt;
    if (s.ear <= 0) { s.ear = 1.4 + Math.random() * 5; s.earT = 0.32; s.earS = Math.random() < 0.5 ? 0 : 1; }
    s.earT = Math.max(0, s.earT - dt);
    s.flick -= dt;
    if (s.flick <= 0) { s.flick = 2.2 + Math.random() * 4.5; s.flickT = 0.55; }
    s.flickT = Math.max(0, s.flickT - dt);
    if (awake) {
      s.look -= dt;
      if (s.look <= 0 && s.actT <= 0) { s.look = 2.5 + Math.random() * 4.5; s.lookD = 1.1 + Math.random() * 1.5; s.lookT = s.lookD; s.lookA = (Math.random() < 0.5 ? -1 : 1) * (0.45 + Math.random() * 0.6); }
    } else s.lookT = 0;
    s.lookT = Math.max(0, s.lookT - dt);
    if (s.actT > 0 && s.kind !== "yawn" && (!acts || acts.indexOf(s.kind) < 0)) { s.actT = 0; s.kind = ""; }
    if (s.actT > 0) { s.actT = Math.max(0, s.actT - dt); if (s.actT === 0) s.kind = ""; }
    else if (acts && acts.length) {
      s.act -= dt;
      if (s.act <= 0) { s.act = 7 + Math.random() * 11; idleDo(s, acts[(Math.random() * acts.length) | 0]); }
    }
  }
  function idleDo(s, kind) { s.kind = kind; s.dur = s.actT = IDLE_DUR[kind]; s.lookT = 0; }
  /* sobe suave em a, segura, desce suave em b (u de 0 a 1) */
  const envU = (u, a, b) => { const x = Math.max(0, Math.min(1, u / a, (1 - u) / b)); return x * x * (3 - 2 * x); };
  /* aplica por cima da pose; devolve quanto os olhos ficam abertos */
  function idleApply(c, pose, t) {
    const s = c.idle;
    const ue = s.earT > 0 ? Math.sin((1 - s.earT / 0.32) * Math.PI) : 0;
    c.ears.forEach((e, i) => { const k = i === s.earS ? ue : 0; e.rotation.set((i ? 1 : -1) * k * 0.5, 0, -k * 0.35); });
    c.mouth.visible = false;
    if (REDUCED) return 1;
    if (s.flickT > 0 && pose !== "walk") {
      const u = 1 - s.flickT / 0.55, w = Math.sin(u * Math.PI) * Math.sin(u * Math.PI * 3);
      c.segs[2].rotation.x += w * 0.35;
      c.segs[3].rotation.x += w * 0.5;
    }
    if (s.lookT > 0) c.head.rotation.y += s.lookA * envU(1 - s.lookT / s.lookD, 0.25, 0.25);
    let eye = 1;
    if (s.actT > 0) {
      const u = 1 - s.actT / s.dur, e = envU(u, 0.2, 0.25);
      if (s.kind === "groom" && pose === "sit") {
        /* lambe a pata da frente */
        const lick = Math.sin(t * 13) * 0.5 + 0.5;
        c.legs[0].rotation.z = e * (2.5 + lick * 0.16);
        c.legs[0].rotation.x = -e * 0.36;
        c.head.rotation.z += -e * (0.36 + lick * 0.1);
        c.head.rotation.x += e * 0.22;
        eye = 1 - e * 0.7;
      } else if (s.kind === "yawn") {
        c.head.rotation.z += e * 0.42;
        c.mouth.visible = e > 0.06;
        c.mouth.scale.set(1, 0.3 + e * 1.5, 1 + e * 0.25);
        eye = 1 - e;
      } else if (s.kind === "stretch" && pose === "stand") {
        /* a espreguiçada de gato: peito no chão, bumbum para cima */
        c.torso.rotation.z -= e * 0.3;
        c.torso.position.y -= e * 0.035;
        c.head.position.y -= e * 0.075;
        c.head.position.x += e * 0.035;
        c.head.rotation.z += e * 0.28;
        for (const i of [0, 1]) { const l = c.legs[i]; l.rotation.z = e * 1.0; l.position.y = 0.12 - e * 0.05; l.position.x = HIP0[i][0] + e * 0.04; }
        for (const i of [2, 3]) c.legs[i].position.y = 0.12 + e * 0.02;
        c.tail.rotation.z += e * 0.35;
        c.mouth.visible = e > 0.55;
        c.mouth.scale.set(1, 0.3 + Math.max(0, e - 0.55) * 2.4, 1);
        eye = 1 - e * 0.8;
      }
    }
    return eye;
  }
  /* ---------------------------------------------------------------------
     o gatinho do jogo, no desenho original: branco, com mancha, orelhas e
     rabo cinza. Só os olhos viraram peça à parte, para piscar
     --------------------------------------------------------------------- */
  function makeKitten(p) {
    const g = new THREE.Group();
    const torso = new THREE.Group();
    torso.position.set(0, 0.165, 0);
    torso.add(part("ico1", 0.15, 0.09, 0.098, p.body, 0, 0, 0));
    if (p.patch != null) torso.add(part("ico1", 0.095, 0.052, 0.08, p.patch, -0.035, 0.05, 0));
    if (p.chest != null) torso.add(part("ico1", 0.07, 0.062, 0.074, p.chest, 0.095, -0.012, 0));
    const head = new THREE.Group();
    head.position.set(0.17, 0.25, 0);
    const muzzle = p.muzzle != null ? p.muzzle : p.chest != null ? p.chest : 0xfbf8f2;
    const hp = [part("ico1", 0.092, 0.084, 0.098, p.body, 0, 0, 0)];
    if (p.headPatch != null) hp.push(part("ico1", 0.06, 0.05, 0.07, p.headPatch, -0.02, 0.04, 0.03));
    hp.push(part("ico1", 0.032, 0.024, 0.046, muzzle, 0.07, -0.024, 0));
    for (const s2 of [-1, 1]) hp.push(part("ico1", 0.005, 0.01, 0.016, 0xf4a3a0, 0.08, -0.016, s2 * 0.062));
    hp.push(part("ico1", 0.009, 0.007, 0.012, 0xee9794, 0.1, -0.009, 0));
    head.add(mergeParts(hp));
    /* orelhas à parte, presas pela base, para poderem mexer sozinhas */
    const ears = [];
    for (const s2 of [-1, 1]) {
      const eg = new THREE.Group();
      eg.position.set(-0.012, 0.047, s2 * 0.041);
      eg.add(mergeParts([
        part("cone4", 0.04, 0.074, 0.04, p.ear, 0, 0.035, s2 * 0.011, s2 * 0.3, Math.PI / 4, 0),
        part("cone4", 0.022, 0.048, 0.022, 0xf2b0ad, 0.016, 0.031, s2 * 0.015, s2 * 0.3, Math.PI / 4, 0),
      ]));
      head.add(eg);
      ears.push(eg);
    }
    /* a boca, escondida, para o bocejo */
    const mouth = mergeParts([part("ico1", 0.009, 0.013, 0.019, 0x8e3f4c, 0.094, -0.036, 0), part("ico1", 0.005, 0.005, 0.011, 0xf08a96, 0.099, -0.043, 0)]);
    mouth.visible = false;
    head.add(mouth);
    /* os olhos do desenho original, num grupo que pisca, e a linha da
       pálpebra para quando fecham */
    const eyes = [], lids = [];
    for (const s2 of [-1, 1]) {
      const eg = new THREE.Group();
      eg.position.set(0.083, 0.014, s2 * 0.037);
      eg.add(mergeParts([part("ico1", 0.013, 0.025, 0.018, p.eye || 0x24222a, 0, 0, 0), part("ico1", 0.0045, 0.0065, 0.005, 0xffffff, 0.011, 0.01, s2 * -0.005)]));
      head.add(eg);
      eyes.push(eg);
      const lid = part("box", 0.006, 0.005, 0.03, 0x2a2830, 0.088, 0.008, s2 * 0.037, 0, 0, 0);
      lid.visible = false;
      head.add(lid);
      lids.push(lid);
    }
    const legs = [];
    for (const [x, z] of HIP0) {
      const hip = new THREE.Group();
      hip.position.set(x, 0.12, z);
      hip.add(mergeParts([part("cyl6", 0.031, 0.12, 0.031, p.legs || p.body, 0, -0.058, 0), part("ico1", 0.034, 0.022, 0.036, p.paws || p.legs || p.body, 0.008, -0.112, 0)]));
      legs.push(hip);
      g.add(hip);
    }
    const tail = new THREE.Group();
    tail.position.set(-0.14, 0.2, 0);
    let seg = tail;
    const segs = [];
    for (let i = 0; i < 4; i += 1) {
      const joint = new THREE.Group();
      if (i > 0) joint.position.set(0, 0.066, 0);
      joint.add(part("cyl6", 0.024 - i * 0.002, 0.08, 0.024 - i * 0.002, i === 3 ? p.tip : p.tail, 0, 0.035, 0));
      seg.add(joint);
      segs.push(joint);
      seg = joint;
    }
    g.add(torso, head, tail);
    return { group: g, torso, head, legs, tail, segs, eyes, lids, ears, mouth, phase: 0, blink: 1 + Math.random() * 4, blinkT: 0, open: 1, idle: idleState() };
  }
  const HIP0 = [[0.09, 0.052], [0.09, -0.052], [-0.09, 0.052], [-0.09, -0.052]];
  function resetKitten(c) {
    c.torso.rotation.set(0, 0, 0);
    c.legs.forEach((l, i) => { l.position.set(HIP0[i][0], 0.12, HIP0[i][1]); l.scale.set(1, 1, 1); l.rotation.set(0, 0, 0); });
    c.head.rotation.set(0, 0, 0);
  }
  function poseKitten(c, t, moving, lying, air) {
    resetKitten(c);
    if (lying) {
      c.torso.position.y = 0.09;
      c.torso.scale.set(1, 1, 1);
      c.head.position.set(0.16, 0.14, 0.02);
      c.head.rotation.set(0, 0.35, -0.12);
      c.legs.forEach((l) => { l.visible = false; });
      c.tail.position.set(-0.15, 0.06, 0);
      c.tail.rotation.set(Math.PI / 2, 0, 0.3);
      c.segs.forEach((s) => { s.rotation.set(0, 0, -0.42); });
      return;
    }
    const bob = moving ? Math.abs(Math.sin(c.phase)) : 0;
    c.torso.position.y = 0.165 + bob * 0.014;
    /* amassa e estica um pouco nos pulos, como desenho animado */
    const sq = air ? 1 + Math.min(0.18, Math.abs(air) * 0.05) : 1;
    c.torso.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    c.head.position.set(0.17, 0.25 + bob * 0.01, 0);
    c.head.rotation.set(0, 0, moving ? 0 : Math.sin(t * 0.7) * 0.06);
    c.legs.forEach((l, i) => {
      l.visible = true;
      l.rotation.z = air ? (i < 2 ? -0.6 : 0.6) : moving ? Math.sin(c.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.6 : 0;
    });
    c.tail.position.set(-0.15, 0.2, 0);
    c.tail.rotation.set(0, 0, 0.45);
    const sway = REDUCED ? 0 : Math.sin(t * 2.2) * 0.14;
    c.segs[0].rotation.set(sway, 0, -0.12);
    c.segs[1].rotation.set(sway, 0, -0.3);
    c.segs[2].rotation.set(sway * 0.5, 0, -0.45);
    c.segs[3].rotation.set(0, 0, -0.8);
  }
  /* sentado; com o.paws as patas da frente mexem (pãozinho) ou sobem (pedindo) */
  function sitKitten(c, t, o) {
    o = o || {};
    resetKitten(c);
    const lean = o.lean != null ? o.lean : 0.5;
    c.torso.position.set(0, 0.15, 0);
    c.torso.rotation.set(0, 0, lean);
    c.torso.scale.set(1, 1, 1);
    c.head.position.set(0.1 - (lean - 0.5) * 0.08, 0.34 + (lean - 0.5) * 0.1, 0);
    c.head.rotation.set(o.tilt || 0, 0, (o.nod || 0) + (REDUCED ? 0 : Math.sin(t * 0.8) * 0.04));
    c.legs.forEach((l, i) => {
      if (i < 2) {
        l.visible = true;
        l.position.set(0.085, 0.17, HIP0[i][1]);
        l.scale.set(1, 1.42, 1);
        l.rotation.set(0, 0, o.paws ? o.paws[i] : 0);
      } else l.visible = false;
    });
    c.tail.position.set(-0.13, 0.04, 0);
    c.tail.rotation.set(Math.PI / 2, 0, 0.55);
    const sw = REDUCED ? 0 : Math.sin(t * 1.4) * 0.12;
    c.segs.forEach((s, i) => s.rotation.set(0, 0, -0.36 - (i === 3 ? 0.25 : 0) + (i ? sw : 0)));
  }
  const me = makeKitten({ body: 0xf6f2ea, patch: 0x8e939c, headPatch: 0x8e939c, ear: 0x8e939c, tail: 0x8e939c, tip: 0x6f747d });
  scene.add(me.group);
  me.group.traverse((o) => { if (o.isMesh) o.renderOrder = 2; });
  for (const grp of [me.torso, me.head, ...me.ears]) {
    const src = grp.children[0];
    const gm = new THREE.Mesh(src.geometry, M.ghost);
    gm.renderOrder = 1;
    gm.position.copy(src.position);
    grp.add(gm);
  }
  const SOFT = tex(64, 64, (g2, w, h) => {
    const gr = g2.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, "#fff"); gr.addColorStop(0.55, "#b3b3b3"); gr.addColorStop(1, "#000");
    g2.fillStyle = gr; g2.fillRect(0, 0, w, h);
  });
  SOFT.wrapS = SOFT.wrapT = THREE.ClampToEdgeWrapping;
  SOFT.repeat.set(1, 1);
  const blobShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.44), new THREE.MeshBasicMaterial({ color: 0x1b1030, alphaMap: SOFT, transparent: true, opacity: 0.3, depthWrite: false }));
  blobShadow.rotation.x = -Math.PI / 2;
  blobShadow.renderOrder = 1;
  scene.add(blobShadow);
  const stray = makeKitten({ body: 0xeaa25e, chest: 0xf6efe2, headPatch: 0xd98a47, ear: 0xd98a47, tail: 0xd98a47, tip: 0xc57638, legs: 0xeaa25e, paws: 0xf6efe2 });
  poseKitten(stray, 0, false, true);
  stray.group.position.set(STRAY.x, 0.2, STRAY.z);
  stray.group.rotation.y = -2.4;
  stray.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(stray.group);
  solid(STRAY.x - 0.2, 0.2, STRAY.z - 0.14, STRAY.x + 0.2, 0.49, STRAY.z + 0.14, "stray");
  const MINA_SOLID = solids[solids.length - 1];

  /* ---------------------------------------------------------------------
     os moradores, sentados. A Tomoko segue a leitora de uma das fotos da
     casa: cabelo curto castanho-escuro, roupa clara e comprida, livro claro,
     na poltrona de assento azul junto ao vidro; que a leitora seja ela é
     inferência. O Masato é genérico: nenhuma foto dele foi consultada. Só o
     Masato fala, e só o que está no e-mail.
     --------------------------------------------------------------------- */
  function makePerson(p) {
    const g = new THREE.Group();
    const R = p.R || 0.16, wide = p.wide ? 1.2 : 1;
    /* colo e quadril; a origem é o assento */
    const base = [placed(blobGeo(0.11, 0.075, 0.125, null, solidPaint(p.pants), 0, 0, 0, 18), 0.02, 0.07, 0)];
    if (p.tunic) base.push(placed(blobGeo(0.16, 0.07, 0.14, (v) => { if (v.y < 0) v.x *= 1 + 0.1 * -v.y; }, solidPaint(p.shirt), 0, 0, 0, 18), 0.07, 0.09, 0));
    g.add(mergeParts(base));
    const chest = new THREE.Group();
    chest.position.set(-0.01, 0.11, 0);
    g.add(chest);
    const tp = [placed(blobGeo(0.1, 0.14, 0.12, (v) => { v.z *= 1 + 0.08 * -v.y; v.x *= 1 + 0.05 * -v.y; }, solidPaint(p.shirt), 0, 0, 0, 20), 0, 0.13, 0)];
    if (p.collar != null) tp.push(placed(blobGeo(0.06, 0.025, 0.08, null, solidPaint(p.collar), 0, 0, 0, 12), 0.035, 0.255, 0));
    chest.add(mergeParts(tp));
    const head = new THREE.Group();
    head.position.set(0.01, 0.265, 0);
    chest.add(head);
    head.add(mergeParts(chibiHead(p, R)));
    const arms = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group();
      sh.position.set(0, 0.22, s * 0.115);
      sh.add(placed(taperGeo(0.037, 0.032, 0.16, solidPaint(p.sleeve || p.shirt), 0, 0, 0), 0, -0.06, 0));
      const el = new THREE.Group();
      el.position.set(0, -0.13, 0);
      el.add(mergeParts([placed(taperGeo(0.032, 0.029, 0.13, solidPaint(p.cuff || p.sleeve || p.shirt), 0, 0, 0), 0, -0.05, 0), placed(blobGeo(0.034, 0.036, 0.034, null, solidPaint(p.skin), 0, 0, 0, 12), 0, -0.115, 0)]));
      sh.add(el);
      chest.add(sh);
      arms.push({ sh, el });
    }
    /* pernas curtas: no assento alto, os pés ficam balançando */
    const legs = [];
    for (const s of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(0.03, 0.06, s * 0.066);
      hip.add(placed(taperGeo(0.046 * wide, 0.052 * wide, 0.28, solidPaint(p.pants), 0, 0, 0), 0.11, 0, 0, 0, 0, -Math.PI / 2));
      const knee = new THREE.Group();
      knee.position.set(0.24, 0, 0);
      knee.add(mergeParts([
        placed(taperGeo(0.045 * wide, 0.04 * wide, 0.21, solidPaint(p.pants), 0, 0, 0), 0, -0.085, 0),
        placed(blobGeo(0.07, 0.035, 0.048, (v) => { if (v.y < 0) v.y *= 0.4; }, solidPaint(p.shoes), 0, 0, 0, 14), 0.025, -0.19, 0),
      ]));
      hip.add(knee);
      g.add(hip);
      legs.push({ hip, knee });
    }
    return { group: g, chest, head, arms, legs, top: 0.11 + 0.265 + 2.12 * R };
  }
  const NPC = {
    masato: { x: X(2.46), y: FL.g + 0.45, z: Z(2.62), floor: FL.g, face: -Math.PI / 2, name: "MASATO IGARASHI", react: 0 },
    /* de costas para o encosto, virada para a cama e um pouco para o vidro,
       como a leitora da foto */
    tomoko: { x: X(3.72), y: FL.bed + 0.42, z: Z(5.8), floor: FL.bed, face: Math.PI + 0.35, name: "TOMOKO IGARASHI" },
  };
  const masato = makePerson({ skin: 0xf2d2b6, hair: 0x241f24, shirt: 0x3d5078, collar: 0xf4f1ea, pants: 0x3a3a41, shoes: 0x2a292e, hairStyle: "short" });
  const tomoko = makePerson({ skin: 0xf4d6be, hair: 0x3f2c23, shirt: 0xf2ede3, pants: 0xe8e0d0, shoes: 0xf6f3ee, hairStyle: "bob", tunic: true, wide: true });
  for (const [who, fig] of [["masato", masato], ["tomoko", tomoko]]) {
    const n = NPC[who];
    fig.group.position.set(n.x, n.y, n.z);
    fig.group.rotation.y = n.face;
    fig.group.traverse((o) => { if (o.isMesh) o.material = M.petClip; });
    scene.add(fig.group);
    n.fig = fig;
  }
  /* poses: ele digita na mesa do térreo, de costas para as tábuas; ela lê na
     poltrona do quarto, junto ao vidro da rua, com o livro claro nas mãos */
  masato.arms.forEach((a) => { a.sh.rotation.z = 1.0; a.el.rotation.z = 0.7; });
  masato.legs.forEach((l) => { l.knee.rotation.z = -0.05; });
  tomoko.arms.forEach((a, i) => { a.sh.rotation.z = 0.5; a.sh.rotation.x = (i ? -1 : 1) * 0.3; a.el.rotation.z = 1.5; });
  {
    /* o livro claro, aberto, com as duas páginas em V */
    const book = new THREE.Group();
    book.position.set(0.2, 0.17, 0);
    book.rotation.set(0, 0, 0.95);
    const bp = [];
    for (const s of [-1, 1]) {
      bp.push(part("box", 0.01, 0.12, 0.078, 0xe6dfcf, -0.004, 0, s * 0.041, s * 0.26, 0, 0));
      bp.push(part("box", 0.008, 0.112, 0.072, 0xfbf8f1, 0.003, 0, s * 0.039, s * 0.26, 0, 0));
    }
    book.add(mergeParts(bp));
    book.traverse((o) => { if (o.isMesh) o.material = M.petClip; });
    tomoko.chest.add(book);
  }
  tomoko.head.rotation.z = -0.32;
  tomoko.legs.forEach((l, i) => { l.hip.rotation.y = (i ? -1 : 1) * 0.04; l.knee.rotation.z = 0.08; });
  /* a folha que vira: presa na lombada, só aparece enquanto gira */
  const pageFlip = new THREE.Group();
  pageFlip.position.set(0.004, 0, 0);
  pageFlip.add(mergeParts([part("box", 0.004, 0.11, 0.074, 0xfffdf7, 0, 0, 0.039), part("box", 0.0045, 0.11, 0.004, 0xd9d0bd, 0, 0, 0.076)]));
  pageFlip.traverse((o) => { if (o.isMesh) o.material = M.petClip; });
  pageFlip.visible = false;
  tomoko.chest.children[tomoko.chest.children.length - 1].add(pageFlip);

  /* ---------------------------------------------------------------------
     gestos dos moradores, inventados como as figuras: o Masato digita e, de
     vez em quando, se espreguiça, coça a cabeça ou toma um gole da caneca;
     a Tomoko lê, vira a página e olha a rua pelo vidro
     --------------------------------------------------------------------- */
  const TLOOK = { t: 0 };
  const RES = { masato: { kind: "", t: 0, dur: 1, next: 5 + Math.random() * 5 }, tomoko: { kind: "", t: 0, dur: 1, next: 3 + Math.random() * 4 } };
  const RES_DUR = { stretch: 2.8, sip: 3.8, scratch: 2.0, page: 1.3, window: 3.6 };
  function resDo(r, kind) { r.kind = kind; r.dur = r.t = RES_DUR[kind]; r.next = 6 + Math.random() * 8; }
  function resTick(r, dt, acts, can) {
    if (r.freeze) return;
    if (r.t > 0) { r.t = Math.max(0, r.t - dt); if (!r.t) r.kind = ""; return; }
    if (!can) return;
    r.next -= dt;
    if (r.next <= 0) resDo(r, acts[(Math.random() * acts.length) | 0]);
  }
  const mix = (a, b, k) => a + (b - a) * k;
  /* braço de boneco: ombro (giro em z e em x) e cotovelo (z). Busca em grade
     a pose que leva a mão até um ponto, nas coordenadas do corpo sentado */
  function armIK(tx, ty, tz, lean) {
    let best = null, bd = 1e9;
    const cl = Math.cos(lean), sl = Math.sin(lean);
    for (let shz = -0.4; shz <= 3.0; shz += 0.05) {
      const cz0 = Math.cos(shz), sz0 = Math.sin(shz);
      for (let shx = -1.2; shx <= 1.2; shx += 0.05) {
        const cx0 = Math.cos(shx), sx0 = Math.sin(shx);
        for (let elz = 0; elz <= 2.6; elz += 0.05) {
          const hx = 0.115 * Math.sin(elz), hy = -0.13 - 0.115 * Math.cos(elz);
          const rx = hx * cz0 - hy * sz0, ry = hx * sz0 + hy * cz0;
          const cx = rx, cy = 0.22 + ry * cx0, cz = 0.115 + ry * sx0;
          const gx = -0.01 + cx * cl - cy * sl, gy = 0.11 + cx * sl + cy * cl;
          const d = (gx - tx) ** 2 + (gy - ty) ** 2 + (cz - tz) ** 2 + 0.0004 * elz * elz;
          if (d < bd) { bd = d; best = [shz, shx, elz]; }
        }
      }
    }
    return best;
  }
  /* a caneca fica ao lado do portátil, onde a mão alcança sem levantar */
  const SIP = { lean: -0.2, mug: [0.27, 0.27, 0.2] };
  SIP.reach = armIK(SIP.mug[0], SIP.mug[1] + 0.045, SIP.mug[2], SIP.lean);
  SIP.drink = armIK(0.17, 0.43, 0.06, 0);
  const deskMug = new THREE.Group();
  {
    const mg = [part("cyl8", 0.034, 0.088, 0.034, 0xf4efe6, 0, 0.044, 0), part("cyl8", 0.029, 0.004, 0.029, 0x6b4a3a, 0, 0.083, 0), part("torus", 0.024, 0.024, 0.03, 0xf4efe6, 0, 0.046, 0.036, 0, 0, 0)];
    deskMug.add(mergeParts(mg));
    deskMug.traverse((o) => { if (o.isMesh) { o.material = M.petClip; o.castShadow = true; } });
    scene.add(deskMug);
  }
  const MUG_REST = new THREE.Vector3(SIP.mug[0], SIP.mug[1], SIP.mug[2]);
  masato.group.updateMatrixWorld(true);
  masato.group.localToWorld(MUG_REST);
  deskMug.position.copy(MUG_REST);
  const _hand = new THREE.Vector3();
  function poseMasato(t) {
    const r = RES.masato, A = masato.arms;
    const typ = REDUCED ? 0 : 0.07;
    const sh = [1.0, 1.0], shx = [0, 0], el = [0.62 + Math.sin(t * 9) * typ, 0.62 + Math.sin(t * 9 + 2) * typ];
    let lean = 0, look = 0, tilt = 0, hold = false, tip = 0;
    if (r.t > 0) {
      const u = 1 - r.t / r.dur;
      if (r.kind === "stretch") {
        const e = envU(u, 0.3, 0.3);
        for (const i of [0, 1]) { sh[i] = mix(1.0, 2.95, e); shx[i] = (i ? 1 : -1) * 0.3 * e; el[i] = mix(el[i], 0.15, e); }
        lean = 0.14 * e; look = 0.3 * e;
      } else if (r.kind === "scratch") {
        const e = envU(u, 0.25, 0.25);
        sh[0] = mix(1.0, 2.6, e); shx[0] = -0.55 * e; el[0] = mix(el[0], 2.2 + (REDUCED ? 0 : Math.sin(t * 20) * 0.14), e);
        tilt = -0.12 * e;
      } else if (r.kind === "sip") {
        /* pega a caneca, bebe, devolve */
        const reach = envU(u, 0.2, 0.2);
        const lift = u > 0.28 && u < 0.72 ? envU((u - 0.28) / 0.44, 0.35, 0.35) : 0;
        sh[1] = mix(mix(1.0, SIP.reach[0], reach), SIP.drink[0], lift);
        shx[1] = mix(SIP.reach[1] * reach, SIP.drink[1], lift);
        el[1] = mix(mix(el[1], SIP.reach[2], reach), SIP.drink[2], lift);
        lean = SIP.lean * reach * (1 - lift);
        look = 0.14 * lift;
        tip = lift;
        hold = u > 0.2 && u < 0.8;
      }
    }
    for (const i of [0, 1]) { A[i].sh.rotation.set(shx[i], 0, sh[i]); A[i].el.rotation.z = el[i]; }
    masato.chest.rotation.z = lean;
    masato.head.rotation.z = look;
    masato.head.rotation.x = tilt;
    if (hold) {
      masato.group.updateMatrixWorld(true);
      A[1].el.localToWorld(_hand.set(0, -0.115, 0));
      deskMug.position.set(_hand.x, _hand.y - 0.045, _hand.z);
      deskMug.rotation.set(-0.55 * tip, 0, 0);
    } else { deskMug.position.copy(MUG_REST); deskMug.rotation.set(0, 0, 0); }
  }
  function poseTomoko(t) {
    const r = RES.tomoko, A = tomoko.arms;
    let yaw = 0, up = 0, turn = -1, lift = 0;
    if (TLOOK.t > 0) {
      const n = NPC.tomoko, bx = X((BOXC.a0 + BOXC.a1) / 2), bz = Z((BOXC.b0 + BOXC.b1) / 2);
      let d = Math.atan2(-(bz - n.z), bx - n.x) - n.face;
      d = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      const e = Math.min(1, TLOOK.t / 0.4, (2.4 - TLOOK.t) / 0.4);
      yaw = Math.max(-1.1, Math.min(1.1, d)) * e;
      up = -0.12 * e;
    }
    if (r.t > 0) {
      const u = 1 - r.t / r.dur;
      if (r.kind === "window") { const e = envU(u, 0.25, 0.3); yaw = 0.95 * e; up = 0.3 * e; }
      else if (r.kind === "page") { turn = u; lift = Math.sin(u * Math.PI); }
    }
    A.forEach((a, i) => { a.sh.rotation.set((i ? -1 : 1) * 0.3, 0, 0.5 + (i ? lift * 0.18 : 0)); a.el.rotation.z = 1.5 + (i ? lift * 0.25 : 0); });
    tomoko.head.rotation.set(0, yaw, -0.32 + up);
    pageFlip.visible = turn >= 0;
    if (turn >= 0) { const e = turn * turn * (3 - 2 * turn); pageFlip.rotation.set(0, e * Math.PI, 0); }
    if (!REDUCED) tomoko.legs.forEach((l, i) => { l.knee.rotation.z = 0.08 + (i ? Math.max(0, Math.sin(t * 1.1)) * 0.06 : 0); });
  }
  solid(X(2.28), FL.g + 0.45, Z(2.44), X(2.64), FL.g + 1.2, Z(2.8), "npc");
  solid(X(3.5), FL.bed + 0.42, Z(5.63), X(3.93), FL.bed + 1.2, Z(5.97), "npc");
  /* balão sobre a cabeça: "!" quando há o que perguntar, coração no fim */
  function bubbleTex(kind) {
    const t = tex(128, 104, (g) => {
      g.clearRect(0, 0, 128, 104);
      const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
      g.fillStyle = "rgba(16, 38, 74, .22)"; rr(10, 12, 110, 74, 30); g.fill();
      g.fillStyle = "#fffdf8"; rr(6, 6, 110, 74, 30); g.fill();
      g.beginPath(); g.moveTo(52, 76); g.lineTo(64, 98); g.lineTo(74, 76); g.closePath(); g.fill();
      if (kind === "!") { g.fillStyle = "#f29e4c"; rr(56, 18, 14, 36, 7); g.fill(); g.beginPath(); g.arc(63, 64, 7.5, 0, Math.PI * 2); g.fill(); }
      else if (kind === "heart") {
        g.fillStyle = "#e8665f";
        g.beginPath(); g.moveTo(61, 66); g.bezierCurveTo(30, 44, 42, 16, 61, 32); g.bezierCurveTo(80, 16, 92, 44, 61, 66); g.fill();
      } else if (kind === "note") {
        g.fillStyle = "#10264a";
        g.beginPath(); g.ellipse(52, 60, 11, 8.5, -0.35, 0, Math.PI * 2); g.fill();
        g.fillRect(60, 18, 5, 42);
        g.beginPath(); g.moveTo(65, 18); g.quadraticCurveTo(84, 26, 80, 44); g.quadraticCurveTo(78, 32, 65, 30); g.closePath(); g.fill();
      } else { g.fillStyle = "#10264a"; for (const x of [40, 61, 82]) { g.beginPath(); g.arc(x, 43, 7, 0, Math.PI * 2); g.fill(); } }
    });
    return t;
  }
  const BUB = { bang: bubbleTex("!"), heart: bubbleTex("heart"), dots: bubbleTex("dots"), note: bubbleTex("note") };
  for (const t of Object.values(BUB)) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1); }
  function bubble() {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: BUB.bang, transparent: true, depthTest: false, depthWrite: false }));
    s.scale.set(0.4, 0.325, 1);
    s.renderOrder = 20;
    s.visible = false;
    scene.add(s);
    return s;
  }
  NPC.masato.bubble = bubble();
  NPC.tomoko.bubble = bubble();

  /* ---------------------------------------------------------------------
     gatos do bairro, inventados como o resto do entorno: a Mina dorme nos
     blocos do terreno vazio, a Mike esquenta a barriga em cima da máquina de
     bebidas e a Jiji passeia pela rua. Cada uma tem sombra e balão.
     --------------------------------------------------------------------- */
  stray.group.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  const mikeFig = makeKitten({ body: 0xf6f2ea, patch: 0xe39a55, headPatch: 0x2f2b35, ear: 0x2f2b35, tail: 0xe39a55, tip: 0x2f2b35, legs: 0xf6f2ea });
  const jijiFig = makeKitten({ body: 0x34313b, chest: 0xf6f2ea, muzzle: 0xf6f2ea, ear: 0x34313b, tail: 0x34313b, tip: 0x34313b, legs: 0x34313b, paws: 0xf6f2ea, eye: 0xd8c95a });
  scene.add(mikeFig.group, jijiFig.group);
  const VEND_TOP = G_LOT + 1.83;
  const ROAM = { x0: -4.3, x1: 9.0, z0: STREET.z0 + 0.54, z1: STREET.z1 - 0.46 };
  function catRec(id, fig, x, y, z, face, mode, voice) {
    const sh = new THREE.Mesh(blobShadow.geometry, blobShadow.material.clone());
    sh.rotation.x = -Math.PI / 2;
    sh.renderOrder = 1;
    scene.add(sh);
    fig.phase = 0;
    return {
      id, fig, x, y, z, face, mode, voice, friend: false, talked: false, again: 0, t: Math.random() * 5,
      say: 0, wake: 0, shadow: sh, bubble: bubble(), wait: 1, walk: 0, dir: face, speed: 0, calm: 0, flee: 0, blinkT: 0,
    };
  }
  const CATS = {
    mina: catRec("mina", stray, STRAY.x, 0.2, STRAY.z, -2.4, "sleep", 0.8),
    mike: catRec("mike", mikeFig, 9.72, VEND_TOP, 8.2 + FZ, -Math.PI / 2, "sit", 1.03),
    jiji: catRec("jiji", jijiFig, 1.8, G_ST, 11.0 + FZ, 0.4, "wander", 1.2),
  };

  /* balõezinhos que sobem e somem: corações, poeira */
  const DUST = tex(8, 8, (g) => { g.clearRect(0, 0, 8, 8); g.fillStyle = "#fffaf0"; g.fillRect(2, 1, 4, 6); g.fillRect(1, 2, 6, 4); });
  DUST.wrapS = DUST.wrapT = THREE.ClampToEdgeWrapping;
  DUST.repeat.set(1, 1);
  const FX = [];
  function pop(kind, x, y, z, life) {
    let f = FX.find((e) => e.t <= 0);
    if (!f) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: BUB.heart, transparent: true, depthTest: false, depthWrite: false }));
      sp.renderOrder = 21;
      sp.visible = false;
      scene.add(sp);
      f = { sp, t: 0 };
      FX.push(f);
    }
    f.sp.material.map = kind === "dust" ? DUST : BUB[kind] || BUB.heart;
    const k = kind === "dust" ? 0.12 : 0.3;
    f.sp.scale.set(k, kind === "dust" ? k : k * 0.8, 1);
    Object.assign(f, { x, y, z, t: life || 1.4, life: life || 1.4, rise: kind === "dust" ? 0.15 : 0.45 });
    f.sp.visible = true;
  }
  function stepFx(dt) {
    for (const f of FX) {
      if (f.t <= 0) { f.sp.visible = false; continue; }
      f.t -= dt;
      const u = 1 - f.t / f.life;
      f.sp.position.set(f.x, f.y + u * f.rise, f.z);
      f.sp.material.opacity = Math.max(0, Math.min(1, f.t * 2.5));
    }
  }

  /* coisas soltas no mundo: livros e toalhas que caem, latas e cápsulas que rolam */
  const drops = [];
  const BOOK_HUES = [0xd9534a, 0x3f6fb5, 0xe8b64c, 0x4f9d9a, 0x8c6aa8, 0xf0d9ae, 0x5f86b5, 0xe07b5f];
  function spawnDrop(kind, x, y, z, vx, vy, vz, color) {
    let mesh, r;
    if (kind === "book") {
      mesh = part("box", 0.05, 0.22, 0.16, color != null ? color : BOOK_HUES[(Math.random() * BOOK_HUES.length) | 0], 0, 0, 0);
      mesh.add(part("box", 0.052, 0.2, 0.148, 0xf6f0e2, 0.004, 0, 0.004));
      r = 0.09;
    } else if (kind === "towel") {
      mesh = part("box", 0.22, 0.035, 0.28, [0xf2b1a1, 0x9cc6d9, 0xf6f0e2][(Math.random() * 3) | 0], 0, 0, 0);
      r = 0.03;
    } else if (kind === "can") {
      mesh = new THREE.Group();
      mesh.add(part("cyl8", 0.034, 0.12, 0.034, color || 0xd9534a, 0, 0, 0));
      mesh.add(part("cyl8", 0.035, 0.02, 0.035, 0xd9dde2, 0, 0.05, 0));
      r = 0.034;
    } else {
      mesh = new THREE.Group();
      mesh.add(part("ico1", 0.045, 0.024, 0.045, color || 0xe8766b, 0, 0.012, 0));
      mesh.add(part("ico1", 0.045, 0.024, 0.045, 0xf4f8fb, 0, -0.012, 0));
      r = 0.045;
    }
    if (kind === "book" || kind === "towel") mesh.traverse((o) => { if (o.isMesh) o.material = M.catClip; });
    scene.add(mesh);
    const d = { kind, mesh, x, y, z, vx, vy, vz, r, rot: 0, spin: (Math.random() - 0.5) * 14, yaw: Math.random() * Math.PI, rest: false, slide: 0, kickCd: 0 };
    drops.push(d);
    while (drops.length > 16) { const o = drops.shift(); scene.remove(o.mesh); }
    return d;
  }
  function blockedAt(x, y, z, r) {
    for (const b of solids) {
      if (b.oneway) continue;
      if (x + r > b.x0 && x - r < b.x1 && z + r > b.z0 && z - r < b.z1 && y + r > b.y0 + 0.02 && y - r < b.y1 - 0.02) return true;
    }
    return false;
  }
  /* chão para o que cai: usa o tamanho do próprio objeto e ignora gente e
     gatos, para nada ficar parado no ar em cima da cabeça de alguém */
  function dropGround(x, z, yRef, r) {
    let g = -Infinity;
    for (const b of solids) {
      if (b.tag === "npc" || b.tag === "stray" || b.tag === "bound") continue;
      if (x + r > b.x0 && x - r < b.x1 && z + r > b.z0 && z - r < b.z1 && b.y1 <= yRef + 1e-3 && b.y1 > g) g = b.y1;
    }
    return g;
  }
  function landSound(d, k) {
    if (d.kind === "book") thud(k);
    else if (d.kind === "towel") noiseHit(0, 0.12, "lowpass", 700, 0, 0.03 * k, 0.01);
    else if (d.kind === "can") tink(k);
    else tone(620, 420, 0.07, "sine", 0.04 * k);
  }
  function stepDrops(dt) {
    for (const d of drops) {
      if (d.kickCd > 0) d.kickCd -= dt;
      if (d.slide > 0) {
        d.slide -= dt;
        d.x += d.vx * dt;
      } else if (!d.rest) {
        d.vy -= 9.8 * dt;
        const nx = d.x + d.vx * dt, nz = d.z + d.vz * dt;
        if (blockedAt(nx, d.y, d.z, d.r)) d.vx *= -0.35; else d.x = nx;
        if (blockedAt(d.x, d.y, nz, d.r)) d.vz *= -0.35; else d.z = nz;
        d.y += d.vy * dt;
        d.rot += d.spin * dt;
        const flat = d.kind === "book" ? 0.025 : d.r;
        const g = dropGround(d.x, d.z, d.y + 0.06, Math.min(d.r, 0.05));
        if (d.y - flat <= g) {
          d.y = g + flat;
          if (d.vy < -1.7 && d.kind !== "towel") {
            d.vy = -d.vy * 0.26;
            d.spin *= 0.5;
            d.vx *= 0.6; d.vz *= 0.6;
            landSound(d, 1);
            pop("dust", d.x, g + 0.04, d.z, 0.5);
          } else {
            d.vy = 0;
            if (d.kind === "book" || d.kind === "towel") {
              d.rest = true;
              d.rot = d.kind === "book" ? Math.PI / 2 : 0;
              d.vx = d.vz = 0;
              landSound(d, 0.6);
              
            } else {
              const f = Math.max(0, 1 - dt * 1.8);
              d.vx *= f; d.vz *= f;
              if (Math.hypot(d.vx, d.vz) < 0.02) d.vx = d.vz = 0;
            }
          }
        }
      }
      d.mesh.position.set(d.x, d.y, d.z);
      if (d.kind === "book") d.mesh.rotation.set(0, d.yaw, d.rot);
      else if (d.kind === "towel") d.mesh.rotation.set(0, d.yaw, d.rest ? 0 : d.rot * 0.3);
      else if (d.kind === "can") d.mesh.rotation.set(0, Math.hypot(d.vx, d.vz) > 0.05 ? Math.atan2(-d.vz, d.vx) + Math.PI / 2 : d.yaw, Math.PI / 2);
    }
  }

  /* ---------------------------------------------------------------------
     bichos do bairro: pardais no fio, borboletas no terreno vazio,
     libélulas vermelhas na rua. Inventados, para dar vida ao entorno.
     --------------------------------------------------------------------- */
  const wireY = (x, y0, sag) => y0 - Math.sin(((x - DIO.x0) / (DIO.x1 - DIO.x0)) * Math.PI) * sag;
  const birds = [];
  for (const [bx, dir] of [[0.9, 1], [1.35, -1], [6.2, 1]]) {
    const g = new THREE.Group();
    g.add(part("ico0", 0.07, 0.05, 0.05, 0x8a6a55, 0, 0.05, 0));
    g.add(part("ico0", 0.04, 0.04, 0.04, 0x5e4636, 0.06, 0.09, 0));
    g.add(part("box", 0.02, 0.012, 0.014, 0xe0a24a, 0.1, 0.088, 0));
    g.add(part("box", 0.06, 0.012, 0.03, 0x5e4636, -0.08, 0.06, 0, 0, 0, 0.35));
    g.add(part("ico0", 0.035, 0.03, 0.04, 0xf1e9dc, 0.02, 0.03, 0));
    g.rotation.y = dir > 0 ? 0 : Math.PI;
    scene.add(g);
    birds.push({ g, x: bx, base: bx, t: Math.random() * 4, hop: 0 });
  }
  function critterWing(color) { return part("box", 0.055, 0.004, 0.045, color, 0, 0, 0); }
  const butterflies = [];
  for (const [cx, cz, c] of [[6.6, 5.2, 0xfbf6e8], [8.4, 2.6, 0xf6d860]]) {
    const g = new THREE.Group();
    g.add(part("box", 0.04, 0.012, 0.012, 0x3b3a42, 0, 0, 0));
    const wl = new THREE.Group(), wr = new THREE.Group();
    const a = critterWing(c); a.position.set(0, 0, 0.025); wl.add(a);
    const b = critterWing(c); b.position.set(0, 0, -0.025); wr.add(b);
    g.add(wl, wr);
    scene.add(g);
    butterflies.push({ g, wl, wr, cx, cz, ph: Math.random() * 6 });
  }
  const flies = [];
  for (let i = 0; i < 2; i += 1) {
    const g = new THREE.Group();
    g.add(part("box", 0.09, 0.014, 0.014, 0xd9432f, 0, 0, 0));
    for (const s of [-1, 1]) { const w = part("box", 0.02, 0.003, 0.06, 0xe8f2f6, 0.012, 0.004, s * 0.035); g.add(w); }
    scene.add(g);
    flies.push({ g, p: new THREE.Vector3(1 + i * 3, 1.2, 10.5), q: new THREE.Vector3(1 + i * 3, 1.2, 10.5), wait: 0.5 + i });
  }

  /* vapor do banho e poeira na luz do norte */
  const puffs = [];
  const puffMat = new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false, clippingPlanes: [CLIP] });
  for (let i = 0; i < 6; i += 1) {
    const sp = new THREE.Sprite(puffMat.clone());
    sp.scale.set(0.16, 0.16, 1);
    scene.add(sp);
    puffs.push({ s: sp, t: i / 6 });
  }
  const motes = [];
  const moteMat = new THREE.SpriteMaterial({ color: 0xfff4d6, transparent: true, opacity: 0.85, depthWrite: false, clippingPlanes: [CLIP] });
  for (let i = 0; i < 9; i += 1) {
    const sp = new THREE.Sprite(moteMat);
    sp.scale.set(0.035, 0.035, 1);
    scene.add(sp);
    motes.push({ s: sp, a: i * 1.7, b: i * 0.9 });
  }

  /* ---------------------------------------------------------------------
     gente na rua: de vez em quando passa alguém de bicicleta e, no fim da
     tarde, duas colegiais voltando da escola. Inventados, como o resto do
     entorno; figuras genéricas, que não retratam ninguém.
     --------------------------------------------------------------------- */
  /* junta peças que andam juntas numa malha só, para gastar menos desenho */
  function mergeParts(list) {
    const pos = [], nor = [], col = [];
    for (const m of list) {
      m.updateMatrix();
      _nm.getNormalMatrix(m.matrix);
      const g = m.geometry, P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color;
      for (let i = 0; i < P.count; i += 1) {
        _v.fromBufferAttribute(P, i).applyMatrix4(m.matrix);
        _n.fromBufferAttribute(N, i).applyMatrix3(_nm).normalize();
        pos.push(_v.x, _v.y, _v.z);
        nor.push(_n.x, _n.y, _n.z);
        col.push(C.getX(i), C.getY(i), C.getZ(i));
      }
      g.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.computeBoundingSphere();
    return new THREE.Mesh(g, M.cat);
  }
  /* barra entre dois pontos, no espaço local de quem ainda está na origem */
  function segPart(a, b, w, color) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const m = part("box", w, w, len, color, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.lookAt(b[0], b[1], b[2]);
    return m;
  }
  /* saia pregueada: tronco de cone fechado, com as pregas pintadas uma sim,
     outra não */
  function skirtPart(color, rTop, rBot, h, y) {
    const geom = new THREE.CylinderGeometry(rTop, rBot, h, 20, 1, false).toNonIndexed();
    const pos = geom.attributes.position, n = pos.count, arr = new Float32Array(n * 3);
    const c0 = rgb(color), c1 = [c0[0] * 0.78, c0[1] * 0.78, c0[2] * 0.8];
    for (let i = 0; i < n; i += 3) {
      const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
      const k = Math.floor(((Math.atan2(cz, cx) + Math.PI) / (2 * Math.PI)) * 20) % 2;
      for (let j = 0; j < 3; j += 1) arr.set(k ? c1 : c0, (i + j) * 3);
    }
    geom.setAttribute("color", new THREE.BufferAttribute(arr, 3));
    const m = new THREE.Mesh(geom, M.cat);
    m.position.set(0, y, 0);
    return m;
  }
  /* ---------------------------------------------------------------------
     gente de brinquedo: cabeça grande e redonda, olhos de pontinho com
     brilho, bochecha rosada, boquinha, corpo curto e mãos redondas, em
     formas lisas como as dos gatos. O cabelo e a roupa dizem quem é
     --------------------------------------------------------------------- */
  function chibiHead(p, R) {
    const sk = solidPaint(p.skin), hc = solidPaint(p.hair);
    const hp = [placed(blobGeo(R * 0.98, R, R, (v) => {
      if (v.y < 0) v.z *= 1 + 0.05 * -v.y;
      if (v.x > 0.5) v.x = 0.5 + (v.x - 0.5) * 0.85;
    }, sk, 0, 0, 0, 24), 0, R, 0)];
    for (const s of [-1, 1]) {
      hp.push(placed(blobGeo(R * 0.16, R * 0.22, R * 0.12, null, sk, 0, 0, 0, 12), -R * 0.02, R * 0.92, s * R * 0.97));
      hp.push(placed(blobGeo(R * 0.07, R * 0.15, R * 0.1, null, solidPaint(0x241c20), 0, 0, 0, 12), R * 0.86, R * 0.96, s * R * 0.36));
      hp.push(placed(blobGeo(R * 0.03, R * 0.05, R * 0.045, null, solidPaint(0xffffff), 0, 0, 0, 8), R * 0.915, R * 1.03, s * R * 0.36 + R * 0.035));
      hp.push(placed(blobGeo(R * 0.02, R * 0.022, R * 0.022, null, solidPaint(0xffffff), 0, 0, 0, 6), R * 0.91, R * 0.9, s * R * 0.36 - R * 0.03));
      hp.push(placed(blobGeo(R * 0.025, R * 0.03, R * 0.13, (v) => { v.y += 0.6 * (1 - v.z * v.z); }, solidPaint(p.brow || p.hair), 0, 0, 0, 10), R * 0.86, R * 1.24, s * R * 0.37, s * 0.12, 0, 0));
      hp.push(placed(blobGeo(R * 0.03, R * 0.075, R * 0.13, null, solidPaint(0xf5a3a3), 0, 0, 0, 10), R * 0.72, R * 0.72, s * R * 0.58));
    }
    hp.push(placed(blobGeo(R * 0.025, R * 0.03, R * 0.11, (v) => { v.y -= 1.1 * (1 - v.z * v.z); }, solidPaint(0xb8685c), 0, 0, 0, 10), R * 0.87, R * 0.64, 0));
    const style = p.hairStyle || "short";
    if (style === "cap") {
      hp.push(placed(blobGeo(R * 1.03, R * 0.66, R * 1.05, (v) => { if (v.y < 0) v.y *= 0.3; }, solidPaint(p.cap), 0, 0, 0, 20), -R * 0.03, R * 1.4, 0));
      hp.push(placed(blobGeo(R * 0.46, R * 0.06, R * 0.72, null, solidPaint(p.cap), 0, 0, 0, 14), R * 0.92, R * 1.33, 0));
      hp.push(placed(blobGeo(R * 0.7, R * 0.5, R * 1.02, (v) => { if (v.x > 0) v.multiplyScalar(0.8); }, hc, 0, 0, 0, 16), -R * 0.25, R * 1.0, 0));
    } else {
      const bob = style === "bob" || style === "pony";
      hp.push(placed(blobGeo(R * 1.04, R * 1.05, R * 1.08, (v) => {
        if (v.x > 0.22 && v.y < 0.42) v.multiplyScalar(0.8);
        if (bob) { if (v.y < -0.62) v.y = -0.62 + (v.y + 0.62) * 0.2; }
        else if (v.y < -0.12 && v.x > -0.35) v.multiplyScalar(0.84);
        else if (v.y < -0.62) v.y = -0.62 + (v.y + 0.62) * 0.3;
      }, hc, 0, 0, 0, 24), -R * 0.07, R * 1.07, 0));
      if (bob) {
        /* franja cheia, com mechas que descem de lado */
        hp.push(placed(blobGeo(R * 0.2, R * 0.24, R * 0.84, null, hc, 0, 0, 0, 16), R * 0.7, R * 1.55, R * 0.05, 0.16, 0, -0.28));
        for (const [zz, l] of [[-0.42, 0.3], [-0.14, 0.34], [0.14, 0.32], [0.4, 0.26]]) hp.push(spikeGeo(R * 0.8, R * 1.58, R * zz, 0.35, -1, zz * 0.5 + 0.12, R * l, R * 0.15, hc));
      } else {
        /* cabelo curto: mechinhas na testa e um topete pequeno */
        for (const [zz, l] of [[-0.36, 0.3], [0, 0.34], [0.34, 0.28]]) hp.push(spikeGeo(R * 0.74, R * 1.7, R * zz, 0.5, -1, zz * 0.6, R * l, R * 0.16, hc));
        for (const [xx, zz, dx, dz] of [[0.3, 0.05, -0.2, 0.15], [0.05, -0.22, -0.5, -0.35], [0.05, 0.25, -0.5, 0.4]]) hp.push(spikeGeo(R * xx, R * 2.0, R * zz, dx, 1, dz, R * 0.26, R * 0.12, hc));
      }
    }
    return hp;
  }
  /* gente em pé, de frente para +x, com o chão na origem */
  function makeWalker(p) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    const H = p.leg || 0.2, hipY = 2 * H + 0.05, R = p.R || 0.15, U = p.up || 1;
    const pelvis = new THREE.Group();
    pelvis.position.set(0, hipY, 0);
    body.add(pelvis);
    const legs = [];
    for (const s of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(0, -0.01, s * 0.052);
      hip.add(placed(taperGeo(0.044, 0.04, H + 0.05, solidPaint(p.thigh), 0, 0, 0), 0, -H / 2, 0));
      const knee = new THREE.Group();
      knee.position.set(0, -H, 0);
      const lower = [placed(taperGeo(0.039, 0.035, H + 0.04, solidPaint(p.shin), 0, 0, 0), 0, -H / 2, 0)];
      if (p.socks != null) lower.push(placed(taperGeo(0.042, 0.038, H * 0.62, solidPaint(p.socks), 0, 0, 0), 0, -H * 0.66, 0));
      lower.push(placed(blobGeo(0.07, 0.036, 0.048, (v) => { if (v.y < 0) v.y *= 0.35; }, solidPaint(p.shoes), 0, 0, 0, 14), 0.022, -H - 0.018, 0));
      knee.add(mergeParts(lower));
      hip.add(knee);
      pelvis.add(hip);
      legs.push({ hip, knee });
    }
    let skirt = null;
    if (p.skirt != null) {
      /* a saia gira em volta da cintura: no agachar, cai por cima das coxas */
      skirt = new THREE.Group();
      skirt.add(skirtPart(p.skirt, 0.104, 0.156, 0.15, -0.06));
      pelvis.add(skirt);
      pelvis.add(placed(blobGeo(0.08, 0.058, 0.098, null, solidPaint(p.skirt), 0, 0, 0, 14), 0, -0.018, 0));
    } else pelvis.add(placed(blobGeo(0.085, 0.07, 0.105, null, solidPaint(p.pants || p.thigh), 0, 0, 0, 16), 0, 0, 0));
    const chest = new THREE.Group();
    chest.position.set(0, 0.03, 0);
    chest.scale.setScalar(U);
    pelvis.add(chest);
    const tp = [placed(blobGeo(0.088, 0.13, 0.108, (v) => { v.z *= 1 + 0.08 * -v.y; v.x *= 1 + 0.05 * -v.y; }, solidPaint(p.shirt), 0, 0, 0, 20), 0, 0.12, 0)];
    if (p.sailor) {
      /* gola de marinheiro: aba nas costas com friso branco, V branco na
         frente e laço vermelho */
      tp.push(placed(blobGeo(0.012, 0.082, 0.108, null, solidPaint(0xf6f3ec), 0, 0, 0, 14), -0.088, 0.185, 0));
      tp.push(placed(blobGeo(0.014, 0.07, 0.094, null, solidPaint(p.flap), 0, 0, 0, 14), -0.093, 0.19, 0));
      for (const s of [-1, 1]) tp.push(placed(taperGeo(0.009, 0.009, 0.12, solidPaint(0xf6f3ec), 0, 0, 0), 0.075, 0.2, s * 0.03, s * 0.55, 0, 0));
      tp.push(placed(blobGeo(0.02, 0.018, 0.02, null, solidPaint(p.tie), 0, 0, 0, 10), 0.094, 0.155, 0));
      for (const s of [-1, 1]) tp.push(placed(blobGeo(0.014, 0.024, 0.03, null, solidPaint(p.tie), 0, 0, 0, 10), 0.09, 0.15, s * 0.028, s * 0.5, 0, 0));
    } else if (p.collar != null) tp.push(placed(blobGeo(0.06, 0.024, 0.08, null, solidPaint(p.collar), 0, 0, 0, 12), 0.03, 0.235, 0));
    if (p.bag === "back") tp.push(placed(blobGeo(0.055, 0.09, 0.085, null, solidPaint(p.bagColor), 0, 0, 0, 14), -0.12, 0.13, 0), placed(blobGeo(0.02, 0.045, 0.07, null, solidPaint(p.bagColor2 || p.bagColor), 0, 0, 0, 12), -0.172, 0.16, 0));
    if (p.bag === "shoulder") tp.push(placed(blobGeo(0.09, 0.065, 0.032, null, solidPaint(p.bagColor), 0, 0, 0, 14), -0.01, -0.01, -0.135), segPart([0.07, 0.22, 0.085], [-0.01, 0.02, -0.13], 0.016, p.bagColor));
    chest.add(mergeParts(tp));
    const head = new THREE.Group();
    head.position.set(0.005, 0.245, 0);
    chest.add(head);
    head.add(mergeParts(chibiHead(Object.assign({ hairStyle: p.cap != null ? "cap" : p.tail ? "pony" : p.bob ? "bob" : "short" }, p), R)));
    let tail = null;
    if (p.tail) {
      tail = new THREE.Group();
      tail.position.set(-R * 0.98, R * 1.3, 0);
      tail.add(mergeParts([placed(blobGeo(R * 0.14, R * 0.14, R * 0.16, null, solidPaint(p.band || 0xd9534a), 0, 0, 0, 10)), placed(blobGeo(R * 0.26, R * 0.5, R * 0.28, null, solidPaint(p.hair), 0, 0, 0, 14), -R * 0.12, -R * 0.36, 0)]));
      head.add(tail);
    }
    const arms = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group();
      sh.position.set(0, 0.2, s * 0.1);
      sh.add(placed(taperGeo(0.034, 0.03, 0.14, solidPaint(p.sleeve || p.shirt), 0, 0, 0), 0, -0.055, 0));
      const el = new THREE.Group();
      el.position.set(0, -0.11, 0);
      el.add(mergeParts([placed(taperGeo(0.03, 0.027, 0.12, solidPaint(p.cuff || p.sleeve || p.shirt), 0, 0, 0), 0, -0.045, 0), placed(blobGeo(0.032, 0.034, 0.032, null, solidPaint(p.skin), 0, 0, 0, 12), 0, -0.105, 0)]));
      sh.add(el);
      chest.add(sh);
      arms.push({ sh, el });
    }
    g.traverse((o) => { if (o.isMesh) o.material = M.pet; });
    return { group: g, body, pelvis, chest, head, legs, arms, tail, skirt, H, hipY, top: hipY + 0.03 + (0.245 + 2.12 * R) * U, phase: Math.random() * 6, yaw: 0 };
  }
  const STRIDE = 0.36;
  const stepRate = (w) => Math.PI / (4 * w.H * Math.sin(STRIDE));
  function resetWalker(w) {
    w.body.position.set(0, 0, 0);
    w.chest.rotation.set(0, 0, 0);
    w.head.rotation.set(0, 0, 0);
    for (const l of w.legs) { l.hip.rotation.set(0, 0, 0); l.knee.rotation.set(0, 0, 0); }
    for (const a of w.arms) { a.sh.rotation.set(0, 0, 0); a.el.rotation.set(0, 0, 0); }
    if (w.tail) w.tail.rotation.set(0, 0, 0.18);
    if (w.skirt) { w.skirt.scale.set(1, 1, 1); w.skirt.rotation.set(0, 0, 0); }
  }
  function poseWalk(w, speed) {
    resetWalker(w);
    const k = Math.min(1, speed / 0.6);
    w.legs.forEach((l, i) => {
      const ph = w.phase + i * Math.PI;
      l.hip.rotation.z = Math.sin(ph) * STRIDE * k;
      l.knee.rotation.z = -Math.max(0, Math.sin(ph - 1.2)) * 0.72 * k;
    });
    w.arms.forEach((a, i) => { a.sh.rotation.z = -Math.sin(w.phase + i * Math.PI) * 0.3 * k; a.sh.rotation.x = (i ? -1 : 1) * 0.07; a.el.rotation.z = 0.3; });
    if (REDUCED) return;
    w.body.position.y = Math.abs(Math.cos(w.phase)) * 0.012 * k;
    w.chest.rotation.y = Math.sin(w.phase) * 0.07 * k;
    if (w.tail) w.tail.rotation.z = 0.18 + Math.sin(w.phase * 2) * 0.14 * k;
    if (w.skirt) { const f = 1 + Math.abs(Math.sin(w.phase)) * 0.05 * k; w.skirt.scale.set(f, 1, f); w.skirt.rotation.z = Math.sin(w.phase) * 0.05 * k; }
  }
  /* agachada para ver o gato de perto; em pé, com as mãos juntas; tchau.
     amt vai de 0 a 1 e deixa a pose entrar devagar */
  function poseCrouch(w, t, amt) {
    resetWalker(w);
    const a = amt == null ? 1 : amt;
    w.body.position.y = -1.22 * w.H * a;
    w.legs.forEach((l, i) => { l.hip.rotation.z = (1.45 - i * 0.1) * a; l.knee.rotation.z = (-2.35 + i * 0.1) * a; });
    w.chest.rotation.z = -0.34 * a;
    /* a saia acompanha as coxas e cai por cima delas */
    if (w.skirt) { w.skirt.rotation.z = 0.95 * a; w.skirt.scale.set(1 + 0.2 * a, 1 - 0.1 * a, 1 + 0.08 * a); }
    w.head.rotation.z = (-0.3 + (REDUCED ? 0 : Math.sin(t * 1.3) * 0.05)) * a;
    w.arms.forEach((ar, i) => { ar.sh.rotation.z = 1.0 * a; ar.el.rotation.z = (i ? 0.5 + (REDUCED ? 0 : Math.sin(t * 7) * 0.25) : 0.9) * a; });
  }
  function poseLook(w, t) {
    resetWalker(w);
    w.head.rotation.z = -0.4;
    w.chest.rotation.z = -0.1;
    w.arms.forEach((a, i) => { a.sh.rotation.z = 0.3; a.sh.rotation.x = (i ? -1 : 1) * 0.3; a.el.rotation.z = 1.55; });
    w.head.rotation.x = REDUCED ? 0 : Math.sin(t * 2.1) * 0.08;
  }
  function poseWave(w, t) {
    resetWalker(w);
    const a = w.arms[1];
    a.sh.rotation.x = -2.5;
    a.el.rotation.x = REDUCED ? 0 : Math.sin(t * 10) * 0.4;
    w.head.rotation.z = -0.15;
  }
  /* vira devagar, pelo caminho mais curto */
  function turnTo(w, target, dt) {
    const d = ((target - w.yaw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    w.yaw += d * Math.min(1, dt * 7);
    w.group.rotation.y = w.yaw;
  }

  /* a bicicleta de bairro, com cesto na frente, e quem pedala */
  const GLOW_TEX = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.35, "rgba(255,255,255,.5)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })();
  function makeBikeRig() {
    const g = new THREE.Group();
    const C = 0x6d9cc7, D = 0x2f2b35, S = 0xb8bfc8;
    const f = [];
    const seg = (a, b, w, col) => f.push(segPart(a, b, w, col == null ? C : col));
    for (const s of [-1, 1]) { seg([-0.45, 0.33, s * 0.04], [0.0, 0.3, 0], 0.028); seg([-0.45, 0.33, s * 0.04], [-0.17, 0.78, 0], 0.024); seg([0.34, 0.76, 0], [0.45, 0.33, s * 0.04], 0.026); }
    seg([0.0, 0.3, 0], [-0.17, 0.76, 0], 0.04);
    seg([0.0, 0.3, 0], [0.18, 0.44, 0], 0.045);
    seg([0.18, 0.44, 0], [0.34, 0.76, 0], 0.045);
    seg([0.33, 0.7, 0], [0.37, 0.92, 0], 0.045);
    seg([0.37, 0.92, 0], [0.22, 0.99, 0], 0.03, D);
    f.push(part("box", 0.035, 0.035, 0.52, D, 0.2, 0.99, 0));
    for (const s of [-1, 1]) f.push(part("box", 0.08, 0.04, 0.05, 0x3b3a42, 0.18, 0.99, s * 0.25));
    f.push(part("box", 0.24, 0.05, 0.12, 0x3b3a42, -0.2, 0.785, 0));
    f.push(part("box", 0.44, 0.09, 0.02, C, -0.22, 0.34, 0.075));
    f.push(part("box", 0.32, 0.025, 0.15, S, -0.55, 0.7, 0));
    seg([-0.45, 0.33, 0], [-0.62, 0.69, 0], 0.02, S);
    /* cesto com cebolinha e pão: compra do mercado na volta para casa */
    const bx = 0.6, by = 0.86;
    f.push(part("box", 0.3, 0.02, 0.36, 0x9aa1ab, bx, by - 0.1, 0));
    for (const s of [-1, 1]) f.push(part("box", 0.3, 0.2, 0.012, S, bx, by, s * 0.18), part("box", 0.012, 0.2, 0.36, S, bx + s * 0.15, by, 0));
    f.push(segPart([bx - 0.05, by - 0.06, 0.05], [bx + 0.06, by + 0.33, 0.1], 0.045, 0xf4f1ea));
    f.push(segPart([bx + 0.055, by + 0.3, 0.098], [bx + 0.11, by + 0.5, 0.11], 0.05, 0x6fae5b));
    f.push(part("box", 0.14, 0.1, 0.12, 0xe0b070, bx - 0.05, by + 0.02, -0.07));
    f.push(part("box", 0.05, 0.05, 0.06, 0xd9d4ca, bx + 0.17, by - 0.08, 0));
    f.push(part("box", 0.02, 0.05, 0.05, 0xd94a3f, -0.72, 0.66, 0));
    g.add(mergeParts(f));
    const lampFace = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.035, 0.04), M.lampOut);
    lampFace.position.set(bx + 0.197, by - 0.08, 0);
    g.add(lampFace);
    const wheels = [];
    for (const x of [-0.45, 0.45]) {
      const w = new THREE.Group();
      w.position.set(x, 0.33, 0);
      w.add(mergeParts([
        part("torus", 0.3, 0.3, 0.3, D, 0, 0, 0),
        part("box", 0.56, 0.012, 0.012, S, 0, 0, 0), part("box", 0.012, 0.56, 0.012, S, 0, 0, 0),
        part("box", 0.56, 0.012, 0.012, S, 0, 0, 0, 0, 0, Math.PI / 4), part("box", 0.56, 0.012, 0.012, S, 0, 0, 0, 0, 0, -Math.PI / 4),
        part("cyl8", 0.03, 0.09, 0.03, 0x9aa1ab, 0, 0, 0, Math.PI / 2, 0, 0),
      ]));
      g.add(w);
      wheels.push(w);
    }
    const crank = new THREE.Group();
    crank.position.set(0, 0.3, 0);
    crank.add(mergeParts([
      part("cyl12", 0.09, 0.02, 0.09, 0x9aa1ab, 0, 0, 0.06, Math.PI / 2, 0, 0),
      part("box", 0.03, 0.17, 0.02, 0x3b3a42, 0, -0.085, 0.09), part("box", 0.03, 0.17, 0.02, 0x3b3a42, 0, 0.085, -0.09),
      part("box", 0.09, 0.02, 0.07, D, 0, -0.17, 0.12), part("box", 0.09, 0.02, 0.07, D, 0, 0.17, -0.12),
    ]));
    g.add(crank);
    const rider = makeWalker({ skin: 0xf2d0b3, hair: 0x2e2622, shirt: 0xe3d3ad, collar: 0xf6f1e6, sleeve: 0xe3d3ad, thigh: 0x4a5566, shin: 0x4a5566, pants: 0x4a5566, shoes: 0xf4efe6, cap: 0x5f86b5, leg: 0.33, R: 0.17, up: 1.2 });
    rider.group.position.set(-0.2, 0.81 - rider.hipY, 0);
    g.add(rider.group);
    /* farol: à noite, um halo e uma mancha de luz no asfalto */
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xfff1c8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.set(0.42, 0.42, 1);
    halo.position.set(bx + 0.22, by - 0.08, 0);
    g.add(halo);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ map: GLOW_TEX, color: 0xfff1c8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2;
    pool.scale.set(2.2, 1.3, 1);
    pool.position.set(1.45, 0.012, 0);
    pool.renderOrder = 2;
    g.add(pool);
    g.visible = false;
    scene.add(g);
    return { group: g, wheels, crank, rider, halo, pool };
  }
  /* pernas no pedal: dois ossos, resolvidos no plano da bicicleta */
  function pedalLegs(r, crankAngle) {
    const hx = -0.2, hy = 0.81, L = r.H;
    r.legs.forEach((l, i) => {
      const a = crankAngle + (i ? 0 : Math.PI);
      let px = Math.sin(a) * 0.17 + 0.02, py = 0.3 - Math.cos(a) * 0.17 + 0.05;
      let dx = px - hx, dy = py - hy, d = Math.hypot(dx, dy);
      if (d > 2 * L - 0.002) { const k = (2 * L - 0.002) / d; dx *= k; dy *= k; d = 2 * L - 0.002; px = hx + dx; py = hy + dy; }
      const base = Math.atan2(dy, dx), bend = Math.acos(Math.min(1, d / (2 * L)));
      const tA = base + bend;
      const kx = hx + Math.cos(tA) * L, ky = hy + Math.sin(tA) * L;
      const thigh = Math.atan2(Math.cos(tA), -Math.sin(tA));
      const shin = Math.atan2(px - kx, -(py - ky));
      l.hip.rotation.set(0, 0, thigh);
      l.knee.rotation.set(0, 0, shin - thigh);
    });
  }
  function poseRider(r, t, crankAngle, look) {
    resetWalker(r);
    pedalLegs(r, crankAngle);
    r.chest.rotation.z = -0.42;
    r.arms.forEach((a) => { a.sh.rotation.z = 1.2; a.el.rotation.z = 0.25; a.sh.rotation.x = 0; });
    r.arms[0].sh.rotation.x = 0.12; r.arms[1].sh.rotation.x = -0.12;
    r.head.rotation.z = 0.24;
    r.head.rotation.y = look || 0;
  }

  const BIKE = makeBikeRig();
  const BIKE_S = 0.82;
  /* uniforme de marinheiro genérico: blusa e gola azul-marinho, friso
     branco, lenço vermelho, saia pregueada, meias e mocassins */
  const GIRLS = [
    makeWalker({ skin: 0xf6d6bd, hair: 0x2b2326, shirt: 0x2f3f66, flap: 0x243457, sailor: true, tie: 0xd24a3f, sleeve: 0x2f3f66, cuff: 0x2f3f66, skirt: 0x3d4a6e, thigh: 0xf6d6bd, shin: 0xf6d6bd, socks: 0xf6f3ec, shoes: 0x4a3328, tail: true, band: 0xd24a3f, bag: "shoulder", bagColor: 0x2a2a33, leg: 0.2, R: 0.15 }),
    makeWalker({ skin: 0xf2cfb2, hair: 0x3a2a24, shirt: 0x2f3f66, flap: 0x243457, sailor: true, tie: 0xd24a3f, sleeve: 0x2f3f66, cuff: 0x2f3f66, skirt: 0x3d4a6e, thigh: 0xf2cfb2, shin: 0xf2cfb2, socks: 0x2f3f66, shoes: 0x4a3328, bob: true, bag: "back", bagColor: 0x8fb0d6, bagColor2: 0xf2d27a, leg: 0.195, R: 0.15 }),
  ];
  for (const w of GIRLS) { w.group.visible = false; scene.add(w.group); }
  const shade = (sx, sz) => {
    const m = new THREE.Mesh(blobShadow.geometry, blobShadow.material.clone());
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 1;
    m.scale.set(sx, sz, 1);
    m.material.opacity = 0.26;
    m.visible = false;
    scene.add(m);
    return m;
  };
  BIKE.shadow = shade(3.0, 0.75);
  BIKE.bubble = bubble();
  GIRLS.forEach((w) => { w.shadow = shade(0.95, 0.85); w.bubble = bubble(); w.bubble.scale.set(0.32, 0.26, 1); });
  const EDGE = { x0: DIO.x0 + 0.3, x1: DIO.x1 - 0.3 };
  const LANE = { min: STREET.z0 + 0.69, max: STREET.z1 - 0.61, girls: STREET.z0 + 0.69, bikeE: STREET.z0 + 1.64, bikeW: STREET.z0 + 2.69 };
  const LIFE = {
    bike: { on: false, x: 0, z: LANE.bikeE, lane: LANE.bikeE, dir: 1, v: 0, crank: 0, wheel: 0, ring: 0, look: 0, next: 28 + Math.random() * 20, passes: 0 },
    girls: { on: false, x: 0, z: LANE.girls, lane: LANE.girls, dir: 1, v: 0, state: "walk", t: 0, stop: 0, chat: 1.5, who: 0, met: [], target: null, heart: 0, next: 20 + Math.random() * 8, passes: 0 },
  };
  const bell = () => { for (const d of [0, 0.17]) { tone(3150, 3120, 0.34, "sine", 0.028, d); tone(4730, 4700, 0.22, "sine", 0.012, d); tone(2100, 2090, 0.3, "triangle", 0.007, d); } };
  const onStreet = (o) => o.y < 0.3 && o.z > STREET.z0 + 0.25 && o.z < STREET.z1 + 0.15;
  function streetFolks() {
    const list = [];
    if (started && !viewMode && onStreet(cat)) list.push({ x: cat.x, z: cat.z, id: "me" });
    for (const id in CATS) { const c = CATS[id]; if (onStreet(c)) list.push({ x: c.x, z: c.z, id }); }
    return list;
  }
  const edgeScale = (x) => Math.max(0.001, Math.min(1, Math.min(x - EDGE.x0, EDGE.x1 - x) / 0.6));
  function startBike() {
    const s = LIFE.bike;
    s.dir = Math.random() < 0.5 ? 1 : -1;
    s.lane = s.dir > 0 ? LANE.bikeE : LANE.bikeW;
    Object.assign(s, { on: true, x: s.dir > 0 ? EDGE.x0 : EDGE.x1, z: s.lane, v: 3.0, ring: 0, look: 0 });
    BIKE.group.visible = true;
  }
  function stepBike(dt) {
    const s = LIFE.bike;
    if (!s.on) { s.next -= dt; if (s.next <= 0) startBike(); return; }
    /* quem está na rua à frente: gato, gata do bairro. Procura a faixa livre
       mais perto; se não houver, espera. */
    const near = streetFolks().filter((o) => { const a = (o.x - s.x) * s.dir; return a > -0.5 && a < 3.4; });
    const clear = (z) => near.reduce((m, o) => Math.min(m, Math.abs(o.z - z)), 9);
    let target = s.lane;
    if (clear(s.lane) < 0.85) {
      let best = null, bd = 9;
      for (let z = LANE.min; z <= LANE.max + 1e-6; z += 0.1) if (clear(z) >= 0.85 && Math.abs(z - s.z) < bd) { bd = Math.abs(z - s.z); best = z; }
      target = best == null ? s.z : best;
    }
    let want = near.length && clear(s.z) < 0.85 ? 1.2 : 3.0;
    for (const o of near) { const a = (o.x - s.x) * s.dir; if (a > 0 && a < 1.1 && Math.abs(o.z - s.z) < 0.6) want = 0; }
    const me = near.find((o) => o.id === "me");
    if (me && s.ring <= 0 && (me.x - s.x) * s.dir > 0.3 && Math.abs(me.z - s.z) < 1.2) {
      bell();
      s.ring = 5;
      s.look = 1.8;
      once("bike", "chirin chirin. a bicicleta pede passagem, e o gato finge que não ouviu", 3.4);
    }
    s.z += Math.max(-dt * 1.2, Math.min(dt * 1.2, target - s.z));
    s.v += (want - s.v) * Math.min(1, dt * (want < s.v ? 5 : 1.4));
    s.x += s.dir * s.v * dt;
    s.crank -= s.v * dt * 2.4;
    s.wheel -= (s.v * dt) / 0.3;
    if (s.ring > 0) s.ring -= dt;
    if (s.look > 0) s.look -= dt;
    const g = BIKE.group;
    g.position.set(s.x, G_ST, s.z);
    g.rotation.y = s.dir > 0 ? 0 : Math.PI;
    g.scale.setScalar(edgeScale(s.x) * BIKE_S);
    for (const w of BIKE.wheels) w.rotation.z = s.wheel;
    BIKE.crank.rotation.z = s.crank;
    let look = 0;
    if (s.look > 0) {
      const a = Math.atan2(-(cat.z - s.z), cat.x - s.x) - g.rotation.y;
      look = Math.max(-1, Math.min(1, ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI));
    }
    poseRider(BIKE.rider, clockT, s.crank, look);
    BIKE.halo.material.opacity = night ? 0.85 : 0;
    BIKE.pool.material.opacity = night ? 0.3 : 0;
    /* o gato não fica embaixo da roda: é empurrado de leve para o lado */
    if (started && onStreet(cat) && Math.abs(cat.x - s.x) < 0.8 && Math.abs(cat.z - s.z) < 0.3) tryMove(cat.x, s.z + (cat.z >= s.z ? 0.3 : -0.3));
    if ((s.dir > 0 && s.x > EDGE.x1) || (s.dir < 0 && s.x < EDGE.x0)) {
      s.on = false;
      s.passes += 1;
      s.next = 80 + Math.random() * 70;
      BIKE.group.visible = false;
      BIKE.shadow.visible = false;
      BIKE.bubble.visible = false;
    }
  }
  function startGirls() {
    const s = LIFE.girls;
    if (night) { s.next = 15; return; }
    s.dir = Math.random() < 0.5 ? 1 : -1;
    s.lane = LANE.girls;
    Object.assign(s, { on: true, x: s.dir > 0 ? EDGE.x0 : EDGE.x1, z: s.lane, v: 0.8, vz: 0, state: "walk", t: 0, stop: 0, chat: 1.2, who: 0, met: [], target: null, heart: 0.4 });
    for (const w of GIRLS) { w.group.visible = true; w.yaw = s.dir > 0 ? 0 : Math.PI; w.group.rotation.y = w.yaw; }
  }
  const girlPos = (s, i) => [s.x - s.dir * i * 0.08, s.z + i * 0.44];
  function stepGirls(dt) {
    const s = LIFE.girls;
    if (!s.on) { s.next -= dt; if (s.next <= 0) startGirls(); return; }
    s.t += dt;
    const folks = streetFolks();
    if (s.state === "walk") {
      let want = 0.8, lane = s.lane;
      for (const o of folks) {
        const ahead = (o.x - s.x) * s.dir;
        if (ahead < -0.3 || ahead > 1.5) continue;
        if (Math.abs(o.z - (s.z + 0.22)) > 1.0) continue;
        if (s.met.indexOf(o.id) < 0) {
          s.met.push(o.id);
          s.state = "look";
          s.stop = 0;
          s.target = o.id;
          s.heart = 0.3;
          if (o.id === "me") { catVoice("mew", 1.05, 0.3); once("girls", "duas colegiais param no meio da rua pra olhar o gato", 3.8); }
          break;
        }
        lane = o.z > s.z + 0.22 ? Math.max(LANE.min, o.z - 1.05) : Math.min(LANE.max - 0.44, o.z + 0.55);
      }
      if (s.state === "walk") {
        const dzs = Math.max(-dt * 0.55, Math.min(dt * 0.55, lane - s.z));
        s.z += dzs;
        s.vz = dzs / Math.max(dt, 1e-4);
        s.v += (want - s.v) * Math.min(1, dt * 3);
        s.x += s.dir * s.v * dt;
        s.chat -= dt;
        if (s.chat <= 0) { s.who = 1 - s.who; s.chat = 2.2 + Math.random() * 1.6; GIRLS[s.who].talk = 1.3; }
      }
    } else if (s.state === "look") {
      s.stop += dt;
      s.v += (0 - s.v) * Math.min(1, dt * 5);
      s.x += s.dir * s.v * dt;
      s.vz = 0;
      const o = folks.find((f) => f.id === s.target);
      s.heart -= dt;
      if (o && s.heart <= 0) {
        s.heart = 1.25;
        const i = (Math.floor(s.stop / 1.25) | 0) % 2;
        const [gx, gz] = girlPos(s, i);
        pop("heart", gx, G_ST + GIRLS[i].top + 0.2, gz, 1.3);
        if (o.id === "me" && s.stop > 1.5 && s.stop < 3) purr(1.0);
      }
      const far = !o || Math.hypot(o.x - s.x, o.z - (s.z + 0.22)) > 2.4;
      if (far || s.stop > (s.target === "me" ? 7 : 2.8)) { s.state = "bye"; s.stop = 0; }
    } else if (s.state === "bye") {
      s.stop += dt;
      if (s.stop > 1.3) s.state = "walk";
    }
    const o = folks.find((f) => f.id === s.target);
    GIRLS.forEach((w, i) => {
      const [gx, gz] = girlPos(s, i);
      w.group.position.set(gx, G_ST, gz);
      w.group.scale.setScalar(edgeScale(gx));
      if (w.talk > 0) w.talk -= dt;
      if (s.state === "walk" || s.v > 0.12) {
        turnTo(w, Math.atan2(-(s.vz || 0), s.dir * Math.max(0.2, s.v)), dt);
        w.phase += s.v * dt * stepRate(w);
        poseWalk(w, s.v);
      } else {
        if (o) turnTo(w, Math.atan2(-(o.z - gz), o.x - gx), dt);
        const crouch = s.state === "look" && i === (s.dir > 0 ? 1 : 0);
        if (s.state === "bye") poseWave(w, s.t + i);
        else if (crouch && s.stop > 0.5) { const u = Math.min(1, (s.stop - 0.5) / 0.6); poseCrouch(w, s.t, u * u * (3 - 2 * u)); }
        else poseLook(w, s.t + i * 0.7);
      }
    });
    if ((s.dir > 0 && s.x > EDGE.x1) || (s.dir < 0 && s.x < EDGE.x0)) {
      s.on = false;
      s.passes += 1;
      s.next = 55 + Math.random() * 45;
      for (const w of GIRLS) { w.group.visible = false; w.shadow.visible = false; w.bubble.visible = false; }
    }
    /* ninguém atravessa ninguém */
    if (started && onStreet(cat)) for (let i = 0; i < 2; i += 1) {
      const [gx, gz] = girlPos(s, i);
      const dx = cat.x - gx, dz = cat.z - gz, d = Math.hypot(dx, dz);
      if (d < 0.28 && d > 1e-4) tryMove(cat.x + (dx / d) * (0.28 - d), cat.z + (dz / d) * (0.28 - d));
    }
  }
  function stepStreet(dt) {
    stepBike(dt);
    stepGirls(dt);
  }
  /* na tela: some quem ficaria entre a câmera e a casa quando o gato está dentro */
  function showStreet(t, inside) {
    const vx = Math.cos(az), vz = Math.sin(az);
    const hides = (x, z) => inside && (x - HC.x) * vx + (z - HC.z) * vz > 1.2;
    const b = LIFE.bike;
    const bv = b.on && !hides(b.x, b.z);
    BIKE.group.visible = bv;
    BIKE.shadow.visible = bv;
    if (bv) BIKE.shadow.position.set(b.x, G_ST + 0.006, b.z);
    BIKE.bubble.visible = bv && b.ring > 3.8 && !dlg.open;
    if (BIKE.bubble.visible) { BIKE.bubble.material.map = BUB.bang; BIKE.bubble.position.set(b.x - b.dir * 0.12, G_ST + 1.62 + Math.sin(t * 5) * 0.03, b.z); }
    const s = LIFE.girls;
    if (s.studio) return;
    GIRLS.forEach((w, i) => {
      const [gx, gz] = girlPos(s, i);
      const v = s.on && !hides(gx, gz);
      w.group.visible = v;
      w.shadow.visible = v;
      if (v) w.shadow.position.set(gx, G_ST + 0.006, gz);
      const talk = v && s.state === "walk" && w.talk > 0 && !dlg.open;
      w.bubble.visible = talk;
      if (talk) { w.bubble.material.map = BUB.dots; w.bubble.position.set(gx, G_ST + w.top + 0.28 + Math.sin(t * 4 + i) * 0.02, gz); }
    });
  }

  /* ---------------------------------------------------------------------
     som: miados feitos com formantes, efeitos curtinhos e a trilha. Nada
     toca antes de um clique ou de uma tecla.
     --------------------------------------------------------------------- */
  const SND = { ctx: null, on: true, fx: null, noise: null };
  function actx() {
    if (!SND.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { SND.ctx = new C(); } catch (err) { SND.ctx = null; return null; }
      SND.fx = SND.ctx.createGain();
      SND.fx.gain.value = SND.on ? 1 : 0;
      SND.fx.connect(SND.ctx.destination);
      const n = Math.floor(SND.ctx.sampleRate * 1.5);
      SND.noise = SND.ctx.createBuffer(1, n, SND.ctx.sampleRate);
      const d = SND.noise.getChannelData(0);
      for (let i = 0; i < n; i += 1) d[i] = Math.random() * 2 - 1;
    }
    if (SND.ctx.state === "suspended" && !document.hidden) SND.ctx.resume();
    return SND.ctx;
  }
  /* os efeitos obedecem ao botão fx; a trilha tem o seu próprio player */
  const fxCtx = () => (SND.on ? actx() : null);
  function tone(f0, f1, dur, type, gain, delay) {
    const a = fxCtx();
    if (!a) return;
    const t = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.03, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(SND.fx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function noiseHit(delay, dur, type, freq, q, gain, attack) {
    const a = fxCtx();
    if (!a) return null;
    const t = a.currentTime + (delay || 0);
    const n = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    n.buffer = SND.noise;
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (q) f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + (attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f).connect(g).connect(SND.fx);
    n.start(t, Math.random() * Math.max(0.01, 1.4 - dur));
    n.stop(t + dur + 0.02);
    return { f, t };
  }

  /* o miado: uma fonte com harmônicos passa por três formantes que vão de
     "m" para "i", "a" e "u", com a altura subindo e descendo e um vibrato
     que só chega no meio. Volume baixo e boca fechando no fim: fofo e macio. */
  const VOWEL = { m: [320, 1050, 2600], i: [430, 2250, 3000], e: [560, 1900, 2800], a: [860, 1450, 2700], u: [420, 880, 2400], r: [520, 1250, 2500] };
  const CALLS = {
    meow: { dur: 0.5, f: [[0, 0.84], [0.3, 1.12], [0.62, 1.04], [1, 0.8]], v: [[0, "m"], [0.16, "i"], [0.42, "a"], [0.8, "u"]], a: 0.05 },
    mew: { dur: 0.27, f: [[0, 0.96], [0.4, 1.2], [1, 0.94]], v: [[0, "m"], [0.2, "i"], [0.62, "e"], [1, "u"]], a: 0.03 },
    q: { dur: 0.46, f: [[0, 0.86], [0.35, 1.02], [0.7, 0.98], [1, 1.24]], v: [[0, "m"], [0.18, "i"], [0.5, "a"], [0.86, "e"]], a: 0.045 },
    long: { dur: 0.8, f: [[0, 0.8], [0.25, 1.1], [0.7, 1.02], [1, 0.72]], v: [[0, "m"], [0.12, "i"], [0.36, "a"], [0.8, "u"]], a: 0.07 },
    mrrp: { dur: 0.36, f: [[0, 0.9], [0.55, 1.02], [1, 1.22]], v: [[0, "m"], [0.2, "r"], [0.7, "e"], [1, "i"]], a: 0.03, trill: 0.55 },
  };
  function catVoice(kind, pitch, delay) {
    if (kind === "purr") { purr(1.2, delay); return; }
    const a = fxCtx();
    if (!a) return;
    const C = CALLS[kind] || CALLS.meow;
    const t = a.currentTime + (delay || 0) + 0.01;
    const D = C.dur * (0.92 + Math.random() * 0.16);
    const base = 640 * (pitch || 1) * (0.97 + Math.random() * 0.06);
    const end = t + D;
    const src = a.createOscillator(), sine = a.createOscillator();
    src.type = "sawtooth";
    for (const o of [src, sine]) {
      o.frequency.setValueAtTime(base * C.f[0][1], t);
      for (const [p, k] of C.f.slice(1)) o.frequency.linearRampToValueAtTime(base * k, t + p * D);
    }
    const lfo = a.createOscillator(), lg = a.createGain();
    lfo.frequency.value = 6.4;
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(base * 0.014, t + D * 0.5);
    lfo.connect(lg);
    lg.connect(src.frequency);
    lg.connect(sine.frequency);
    const sum = a.createGain();
    [0, 1, 2].forEach((i) => {
      const f = a.createBiquadFilter(), g = a.createGain();
      f.type = "bandpass";
      f.Q.value = [4.5, 7, 9][i];
      g.gain.value = [1, 0.45, 0.1][i];
      f.frequency.setValueAtTime(VOWEL[C.v[0][1]][i], t);
      for (const [p, v] of C.v.slice(1)) f.frequency.linearRampToValueAtTime(VOWEL[v][i], t + p * D);
      src.connect(f).connect(g).connect(sum);
    });
    const sg = a.createGain();
    sg.gain.value = 0.5;
    sine.connect(sg).connect(sum);
    const am = a.createGain();
    am.gain.value = 1;
    const lp = a.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(700, t);
    lp.frequency.linearRampToValueAtTime(3200, t + D * 0.22);
    lp.frequency.linearRampToValueAtTime(1900, end);
    const env = a.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.1, t + C.a);
    env.gain.setValueAtTime(0.1, t + D * 0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    sum.connect(am).connect(lp).connect(env).connect(SND.fx);
    const stops = [src, sine, lfo];
    if (C.trill) {
      const tr = a.createOscillator(), tg = a.createGain();
      tr.type = "square";
      tr.frequency.value = 27;
      tg.gain.setValueAtTime(0.45, t);
      tg.gain.linearRampToValueAtTime(0, t + D * C.trill);
      tr.connect(tg).connect(am.gain);
      stops.push(tr);
    }
    for (const o of stops) { o.start(t); o.stop(end + 0.05); }
    noiseHit((delay || 0) + 0.01, D, "bandpass", 3400, 0.8, 0.005, C.a);
  }
  function purr(sec, delay) {
    const a = fxCtx();
    if (!a) return;
    const t = a.currentTime + (delay || 0) + 0.02, end = t + (sec || 1.6);
    const n = a.createBufferSource();
    n.buffer = SND.noise;
    n.loop = true;
    const lp = a.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const am = a.createGain();
    am.gain.value = 0.5;
    const lfo = a.createOscillator(), lg = a.createGain();
    lfo.frequency.value = 24;
    lg.gain.value = 0.5;
    lfo.connect(lg).connect(am.gain);
    const hum = a.createOscillator(), hg = a.createGain();
    hum.frequency.value = 55;
    hg.gain.value = 0.16;
    const hum2 = a.createOscillator(), hg2 = a.createGain();
    hum2.frequency.value = 110;
    hg2.gain.value = 0.1;
    hum2.connect(hg2).connect(am);
    hum.connect(hg).connect(am);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.25);
    g.gain.setValueAtTime(0.18, end - 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    n.connect(lp).connect(am).connect(g).connect(SND.fx);
    for (const o of [n, lfo, hum, hum2]) { o.start(t); o.stop(end + 0.05); }
  }
  function callKind(text) {
    const s = String(text || "").toLowerCase();
    if (s.startsWith("prr")) return "purr";
    if (s.startsWith("mrr")) return "mrrp";
    if (s.startsWith("mew")) return "mew";
    if (s.startsWith("meeow") || s.startsWith("miau")) return "long";
    if (/\?\S*\s*$/.test(s)) return "q";
    return "meow";
  }
  const meow = (pitch, delay) => catVoice("meow", pitch, delay);
  const blip = () => tone(380 + Math.random() * 60, 340, 0.04, "triangle", 0.022);
  const chime = () => { tone(660, 660, 0.14, "triangle", 0.04); tone(990, 990, 0.2, "triangle", 0.04, 0.11); tone(1320, 1320, 0.26, "triangle", 0.032, 0.22); };
  const hopSnd = () => tone(300, 520, 0.08, "sine", 0.022);
  const thud = (k) => { tone(112, 46, 0.22, "sine", 0.2 * (k || 1)); noiseHit(0, 0.09, "lowpass", 900, 0, 0.06 * (k || 1), 0.002); };
  const flutter = () => { const h = noiseHit(0, 0.3, "bandpass", 2200, 0.7, 0.012, 0.06); if (h) h.f.frequency.linearRampToValueAtTime(3400, h.t + 0.3); };
  const clunk = () => { tone(220, 140, 0.13, "sine", 0.14); noiseHit(0, 0.08, "bandpass", 1500, 3, 0.07); tone(1318, 1300, 0.4, "sine", 0.025, 0.012); tone(2150, 2140, 0.3, "sine", 0.014, 0.012); };
  const tink = (v) => { tone(2300 + Math.random() * 500, 2250, 0.16, "sine", 0.03 * (v || 1)); tone(3700, 3650, 0.1, "sine", 0.012 * (v || 1)); };
  const coinSnd = () => { tone(2637, 2637, 0.3, "sine", 0.035); tone(3951, 3951, 0.45, "sine", 0.028, 0.07); };
  const beep = () => tone(1568, 1568, 0.07, "square", 0.01);
  const ratchet = () => { for (let i = 0; i < 4; i += 1) noiseHit(i * 0.1, 0.025, "bandpass", 3100, 2, 0.05); tone(560, 380, 0.09, "sine", 0.06, 0.48); };
  const typing = () => { for (let i = 0; i < 16; i += 1) noiseHit(i * 0.052 + Math.random() * 0.02, 0.02, "bandpass", 2200 + Math.random() * 1400, 2, 0.028); };
  const sneeze = () => {
    const h = noiseHit(0, 0.3, "bandpass", 1100, 1.2, 0.012, 0.22);
    if (h) h.f.frequency.linearRampToValueAtTime(2600, h.t + 0.3);
    noiseHit(0.36, 0.1, "highpass", 2600, 0, 0.07, 0.002);
    tone(1400, 950, 0.07, "triangle", 0.03, 0.37);
  };

  /* ---------------------------------------------------------------------
     ambiente: vento e cidade ao fundo, pardais e um trem ao longe de dia,
     grilos de noite e o zumbido da máquina de bebidas de perto. O gato anda
     em silêncio, como gato. Tudo sintetizado, baixinho, inventado para o
     jogo; obedece ao botão fx
     --------------------------------------------------------------------- */
  const AMB = { bed: null, hum: null, bird: 2.5, cricket: 0.6, train: 40 + Math.random() * 40, stepD: 0, count: { bird: 0, cricket: 0, train: 0, step: 0 } };
  function ambStart() {
    const a = fxCtx();
    if (!a || AMB.bed) return;
    const loop = (type, freq, q) => {
      const n = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      n.buffer = SND.noise; n.loop = true;
      f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
      g.gain.value = 0;
      n.connect(f).connect(g).connect(SND.fx);
      n.start();
      return g;
    };
    AMB.bed = { wind: loop("lowpass", 360), city: loop("bandpass", 130, 0.8) };
    const hg = a.createGain();
    hg.gain.value = 0;
    hg.connect(SND.fx);
    for (const [f, k] of [[100, 0.6], [200, 0.22], [300, 0.08]]) { const o = a.createOscillator(), og = a.createGain(); o.frequency.value = f; og.gain.value = k; o.connect(og).connect(hg); o.start(); }
    AMB.hum = hg;
  }
  const VEND_C = { x: 9.75, z: 8.3 + FZ };
  function ambTick(dt) {
    if (!AMB.bed || !SND.ctx) return;
    const a = SND.ctx, now = a.currentTime;
    const live = started && visible && !document.hidden && SND.on;
    const inside = catInside();
    const muf = inside ? 0.4 : 1;
    const set = (g, v) => g.gain.setTargetAtTime(live ? v : 0, now, 0.4);
    set(AMB.bed.wind, (night ? 0.012 : 0.02) * muf);
    set(AMB.bed.city, (night ? 0.01 : 0.006) * muf);
    const dv = Math.hypot(cat.x - VEND_C.x, cat.z - VEND_C.z);
    set(AMB.hum, 0.02 * Math.max(0, 1 - dv / 3.2) * (night ? 1.3 : 1));
    if (!live || REDUCED) return;
    if (!night) {
      AMB.bird -= dt;
      if (AMB.bird <= 0) { AMB.bird = 1.6 + Math.random() * 5; chirp(muf); }
      AMB.train -= dt;
      if (AMB.train <= 0) { AMB.train = 60 + Math.random() * 60; train(muf); }
    } else {
      AMB.cricket -= dt;
      if (AMB.cricket <= 0) { AMB.cricket = 0.5 + Math.random() * 1.3; cricket(muf); }
    }
  }
  /* pardal: duas a cinco notinhas agudas */
  function chirp(k) {
    AMB.count.bird += 1;
    const n = 2 + ((Math.random() * 4) | 0), f = 3000 + Math.random() * 1400;
    for (let i = 0; i < n; i += 1) tone(f * (1 + (i % 2) * 0.12), f * 1.25, 0.05, "sine", 0.012 * k, i * 0.075);
  }
  /* grilo de outono: "rin-rin", quatro pulsos curtos */
  function cricket(k) {
    AMB.count.cricket += 1;
    const f = Math.random() < 0.6 ? 4400 : 3800;
    for (let i = 0; i < 4; i += 1) tone(f, f * 0.99, 0.028, "sine", 0.007 * k, i * 0.045);
  }
  /* trem ao longe: um ronco que cresce e as batidas nos trilhos */
  function train(k) {
    AMB.count.train += 1;
    const a = fxCtx();
    if (!a) return;
    const t = a.currentTime;
    const n = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    n.buffer = SND.noise; n.loop = true;
    f.type = "lowpass"; f.frequency.value = 200;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03 * k, t + 3);
    g.gain.setValueAtTime(0.03 * k, t + 6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 10);
    n.connect(f).connect(g).connect(SND.fx);
    n.start(t); n.stop(t + 10.2);
    for (let i = 0; i < 12; i += 1) for (const d of [0, 0.13]) noiseHit(2.2 + i * 0.55 + d, 0.05, "bandpass", 850, 2, 0.012 * k * Math.sin(((i + 1) / 13) * Math.PI), 0.004);
  }

  /* ---------------------------------------------------------------------
     colisão
     --------------------------------------------------------------------- */
  const xzHit = (b, x, z) => x + CAT.R > b.x0 && x - CAT.R < b.x1 && z + CAT.R > b.z0 && z - CAT.R < b.z1;
  function blockersAt(x, y, z) {
    const tops = [];
    for (const b of solids) if (!b.oneway && xzHit(b, x, z) && y + CAT.H > b.y0 + 1e-3 && y < b.y1 - 1e-3) tops.push(b.y1);
    return tops;
  }
  function groundAt(x, z, yRef) {
    let g = -Infinity, tag = null;
    for (const b of solids) if (xzHit(b, x, z) && b.y1 <= yRef + 1e-3 && b.y1 > g) { g = b.y1; tag = b.tag; }
    return { y: g, tag };
  }
  function ceilingAt(x, z, headY) {
    let c = Infinity;
    for (const b of solids) if (!b.oneway && xzHit(b, x, z) && b.y0 >= headY - 1e-3 && b.y0 < c) c = b.y0;
    return c;
  }
  const lx = (x) => x - BX, lz = (z) => z - BZ;
  /* dentro da casa, em planta: a borda norte recua em três degraus */
  function insideHouse(x, z) {
    const a = lx(x), b = lz(z);
    if (b < 0.12 || b > ZG || a < 0.12) return false;
    return b < 1.9 ? a < 4.13 : b < 4.15 ? a < 4.63 : a < 5.13;
  }
  /* o terraço fica por cima da casa, ao ar livre */
  const onTerrace = (y, z) => y > FL.r1 - 0.1 && lz(z) > 4.79;
  const catInside = () => insideHouse(cat.x, cat.z) && !onTerrace(cat.y, cat.z);
  const SLAB_BODIES = [...LV.slice(1).map((t) => [t - 0.2, t]), [FL.r2 - 0.25, FL.r2], [FL.r3 - 0.25, FL.r3]];
  const CUT_MAX = FL.r3 - 0.31;
  function snapCut(y) {
    for (const [b, t] of SLAB_BODIES) if (y > b - 0.05 && y < t + 0.05) return b - 0.06;
    return y;
  }

  /* ---------------------------------------------------------------------
     estado
     --------------------------------------------------------------------- */
  const cat = { x: START.x, y: START.y, z: START.z, vy: 0, vx: 0, vz: 0, face: START.face, grounded: true, on: "street", lying: false, climb: null, hop: null, coyote: 0, buffer: 0, land: 0, stepY: 0 };
  const keys = { up: false, down: false, left: false, right: false };
  const goals = { slabs: false, talk: false, shelf: false, vacant: false, light: false };
  const visited = new Set();
  const stats = { dist: 0, climb: 0, jumps: 0, time: 0 };
  const seen = {};
  let started = false, ended = false, visible = true, night = false;
  let az = Math.PI / 4, azTarget = az;
  let zoomIdx = 0, viewH = 24, viewHTarget = 24;
  const camT = new THREE.Vector3(cat.x, cat.y + 0.35, cat.z);
  const CENTER = new THREE.Vector3(X(2.6), 3.2, Z(3.4));
  let cutY = 99, msgTimer = 0;
  let talkIdx = 0, nearNpc = null, hereItem = null;
  /* passeio guiado (modo apresentação): as paradas ficam adiante */
  const TOUR = { on: false, i: 0, t: 0, saved: null };

  let lastMsg = "";
  function show(text, seconds) {
    const el = $("nk-msg");
    lastMsg = text || "";
    el.textContent = $t(text);
    el.classList.toggle("on", !!text);
    msgTimer = seconds || 3.4;
  }
  /* leitura: a fala de um livro segura a tela pelo tempo de ler. Avisos que
     chegam nesse meio-tempo esperam na fila (os de menos de 3 s, que são só
     reação ao momento, ficam de fora), livros novos entram em fila própria, e
     um diálogo que abre por cima devolve a fala quando fecha */
  let holdT = 0, resumeMsg = null, bookAt = null;
  const bookQueue = [];
  const readTime = (text) => Math.min(16, Math.max(5, 2.4 + $t(text).length / 13));
  function say(text, seconds, force) {
    /* tempo mínimo para ler: nada some antes de dar para ler até o fim */
    seconds = Math.max(seconds || 3.4, 1.8 + $t(text || "").length / 16);
    if (holdT > 0 && !force) {
      if ((seconds || 3.4) > 3 && text !== lastMsg && !msgQueue.some((q) => q[0] === text)) { msgQueue.push([text, seconds]); if (msgQueue.length > 3) msgQueue.shift(); }
      return;
    }
    holdT = 0;
    show(text, seconds);
  }
  /* na fila fica no máximo um livro, o último derrubado; as falas do gato
     sobre a pilha (note) nunca saem da fila */
  function sayRead(text, fn, note) {
    /* um livro novo aparece na hora, no lugar da fala do anterior; só espera
       se houver diálogo aberto. As falas do gato (note) esperam a vez */
    if (!note && !dlg.open) {
      for (let i = bookQueue.length - 1; i >= 0; i -= 1) if (!bookQueue[i][2]) bookQueue.splice(i, 1);
      resumeMsg = null;
      const sec = readTime(text);
      show(text, sec);
      holdT = sec;
      bookAt = { x: cat.x, y: cat.y, z: cat.z };
      if (fn) fn();
      return;
    }
    if (dlg.open || holdT > 0 || resumeMsg) {
      if (!note) for (let i = bookQueue.length - 1; i >= 0; i -= 1) if (!bookQueue[i][2]) bookQueue.splice(i, 1);
      bookQueue.push([text, fn, !!note]);
      return;
    }
    const sec = readTime(text);
    show(text, sec);
    holdT = sec;
    if (fn) fn();
  }
  function nextMsg() {
    holdT = 0;
    bookAt = null;
    if (dlg.open) { $("nk-msg").classList.remove("on"); return; }
    if (resumeMsg) { const [t, sec] = resumeMsg; resumeMsg = null; show(t, sec); holdT = sec; return; }
    if (bookQueue.length) { const [t, fn, note] = bookQueue.shift(); const sec = readTime(t); show(t, sec); holdT = sec; if (!note) bookAt = { x: cat.x, y: cat.y, z: cat.z }; if (fn) fn(); return; }
    if (msgQueue.length) { const [t, sec] = msgQueue.shift(); show(t, Math.max(sec || 3.4, 1.8 + $t(t || "").length / 16)); return; }
    $("nk-msg").classList.remove("on");
  }
  function msgTick(dt) {
    /* a frase do livro some quando o gato sai do lugar */
    if (bookAt && msgTimer > 0 && Math.hypot(cat.x - bookAt.x, cat.z - bookAt.z) + Math.abs(cat.y - bookAt.y) > 0.3) { msgTimer = 0; nextMsg(); }
    if (holdT > 0) holdT -= dt;
    if (msgTimer > 0) {
      msgTimer -= dt;
      if (msgTimer <= 0) nextMsg();
    } else if (!dlg.open && (resumeMsg || bookQueue.length || msgQueue.length)) nextMsg();
  }
  /* avisos de lugar entram numa fila curta: um não apaga o outro antes da hora */
  const msgQueue = [];
  function once(k, text, seconds) {
    if (seen[k]) return;
    seen[k] = true;
    if (msgTimer > 0) { msgQueue.push([text, seconds]); if (msgQueue.length > 3) msgQueue.shift(); }
    else say(text, seconds);
  }
  function goal(k, text) {
    if (goals[k]) return;
    goals[k] = true;
    quietT = 0;
    if (text) say(text, Math.max(3.8, 2 + text.length / 26));
    chime();
    renderSide(true);
  }

  /* ---------------------------------------------------------------------
     diálogo: os gatos só dizem miau, e a tradução vem embaixo.
     Masato: tradução livre do e-mail de 24 ago. 2026 (respostas 1, 2, 3 e 5
     e o pedido de ler o trabalho pronto), em tom de conversa e sem
     acrescentar informação; "thesis" vira "pesquisa". As conversas sobre a
     casa e o comentário da estante traduzem o texto dos arquitetos na
     architecturephoto (2023). O gato, os gatos do bairro e o narrador são
     inventados: deles são as perguntas, as reações, a ordem da conversa e
     as escolhas.
     --------------------------------------------------------------------- */
  /* os quatro assuntos do e-mail e o pedido final; a ordem é do jogador */
  const TOPICS = [
    {
      id: "regras", label: "as regras de Tóquio",
      lines: [
        { who: "cat", text: "meow meow, meow?", tr: "as regras de Tóquio deram muito trabalho para vocês?" },
        { who: "masato", text: "Neste projeto, a gente não tratou as normas como “restrições”." },
        { who: "masato", text: "As restrições de plano inclinado e as regras contra incêndio não eram obstáculos a vencer. Eram parte do entorno, pistas que orientaram o projeto." },
        { who: "cat", text: "mrrp.", tr: "achei que vocês iam reclamar mais.", mood: "wow" },
      ],
    },
    {
      id: "lotes", label: "lotes cada vez menores",
      lines: [
        { who: "cat", text: "meow? meow meow…", tr: "os terrenos em Tóquio vão continuar encolhendo?" },
        { who: "masato", text: "A gente acha que os lotes em Tóquio vão continuar diminuindo. Agora mesmo estamos projetando uma casa num terreno ainda menor que este." },
        { who: "cat", text: "mew?!", tr: "menor que este?", mood: "wow" },
        { who: "masato", text: "Em boa parte, isso vem da distância entre o custo de vida, que sobe, e os salários, que não sobem no mesmo ritmo." },
        { who: "masato", text: "Se essa distância continuar crescendo ano a ano, lotes menores e jeitos mais compactos de morar podem ficar cada vez mais comuns." },
      ],
    },
    {
      id: "depois", label: "a casa depois de pronta",
      lines: [
        { who: "cat", text: "meow! meow meow.", tr: "e depois que a obra acaba? as casas continuam iguais às fotos?" },
        { who: "masato", text: "Tem uma riqueza no espaço que foto e desenho não mostram por inteiro." },
        { who: "masato", text: "A capacidade humana de se adaptar é impressionante." },
        { who: "masato", text: "Toda vez que visitamos um cliente depois da obra, a gente se surpreende com o jeito como ele fez do espaço o seu lugar, e com o jeito como vive ali." },
        { who: "masato", text: "Muita foto de arquitetura e muito estudo acadêmico mostram o prédio só no momento em que ele fica pronto." },
        { who: "masato", text: "Seria ótimo se a sua pesquisa contasse também o que vem depois." },
        { who: "masato", text: "Como os moradores se adaptam, como a vida de todo dia transforma o espaço e como a arquitetura continua mudando com quem mora nela." },
        { who: "cat", text: "meow.", tr: "vou contar pra Isadora. a pesquisa é dela, eu só faço a parte fofa.", mood: "happy" },
      ],
    },
    {
      id: "hoje", label: "e se fosse hoje?",
      lines: [
        { who: "cat", text: "mrrp? meow!", tr: "se vocês fossem projetar esta casa hoje, fariam alguma coisa diferente?" },
        { who: "masato", text: "Cada casa parte de condições diferentes: o cliente, o orçamento, o terreno e muitas outras coisas. Por isso é uma pergunta muito difícil." },
        { who: "masato", text: "Mas, em Tóquio ou em qualquer lugar, a filosofia é a mesma." },
        { who: "masato", text: "Espaços com uma certa força e resiliência, que continuem sendo usados quando o tempo passa e a função ou os moradores mudam." },
        { who: "masato", text: "A gente pensa em tudo: a estrutura, o próprio espaço, a luz e o vento. E quer criar espaços com experiências que as pessoas talvez nunca tenham vivido." },
      ],
    },
    {
      id: "voltar", label: "posso voltar outro dia?", last: true,
      lines: [
        { who: "cat", text: "meow meow… meow?", tr: "posso voltar outro dia?" },
        { who: "masato", text: "Quando a pesquisa estiver pronta, manda para a gente? Queremos muito ver como o projeto foi entendido e analisado." },
        { who: "cat", text: "meow!", tr: "combinado. ela manda assim que terminar. (ela diz que está quase. ela sempre diz.)", mood: "happy" },
        { who: "narr", text: "(Masato volta ao computador.)" },
      ],
    },
  ];
  /* sobre a casa: o texto dos arquitetos (architecturephoto, 2023) */
  const HOUSE_TOPICS = [
    {
      id: "quartos", label: "onde fica o quarto?",
      lines: [
        { who: "cat", text: "meow?", tr: "onde fica o quarto? não vi nenhuma porta." },
        { who: "masato", text: "Esta casa pequena é uma grande sala só. Quase não tem parede que pareça parede: o espaço é feito só de pisos, paredes e os desníveis entre eles." },
        { who: "cat", text: "mrrp.", tr: "então o quarto é aquele piso lá em cima, colado no vidro da rua. entendi. acho." },
      ],
    },
    {
      id: "lajes", label: "por que tantos níveis?",
      lines: [
        { who: "cat", text: "mrrp?", tr: "por que tantos níveis diferentes?" },
        { who: "masato", text: "Os pisos são pequenos, então nenhuma função se resolve num piso só: ela se estende sobre as outras lajes desencontradas." },
        { who: "masato", text: "O lugar que agora há pouco era piso vira cadeira, vira mesa, vira prateleira, vira teto." },
        { who: "cat", text: "meow.", tr: "então o tablado lá embaixo é banco. e eu achando que era cama de gato." },
      ],
    },
    {
      id: "trabalho", label: "vida e trabalho",
      lines: [
        { who: "cat", text: "meow meow?", tr: "vocês trabalham aqui mesmo, em casa?" },
        { who: "masato", text: "A ideia era uma casa para quem mistura vida e trabalho: dá para trabalhar em qualquer lugar e, de qualquer lugar, sentir a presença um do outro." },
        { who: "cat", text: "prrr.", tr: "daqui dá pra ouvir um digitando e a outra virando página. é quase uma conversa.", mood: "happy" },
      ],
    },
    {
      id: "concreto", label: "por que tanto concreto?",
      lines: [
        { who: "cat", text: "mrrp?", tr: "por que o concreto em volta é tão pesado, e as escadas por dentro são tão leves?" },
        { who: "masato", text: "O concreto em volta é grande e forte, como uma ruína. Lá dentro, a gente pôs escadas e móveis na escala das pessoas." },
        { who: "masato", text: "É tudo feito para as pessoas, mas a ideia é que o espaço fique mais rico do que aquilo que a gente imaginou ao desenhar." },
      ],
    },
  ];
  const TOMOKO_TALK = {
    day: [
      [
        { who: "narr", text: "(Tomoko lê na poltrona do quarto, junto ao vidro da rua.)" },
        { who: "cat", text: "mew.", tr: "oi, Tomoko. o livro está bom?" },
        { who: "narr", text: "(ela vira a página. pelo jeito, isso é um sim.)" },
      ],
      [
        { who: "narr", text: "(o gato se enrola do lado da poltrona. ela não tira o olho do livro, mas afasta o pé pra dar lugar.)" },
        { who: "cat", text: "prrr.", tr: "vou ficar aqui um pouco.", mood: "happy" },
      ],
    ],
    night: [
      [
        { who: "narr", text: "(de noite, Tomoko continua lendo. lá fora, a rua já acendeu.)" },
        { who: "cat", text: "mew…", tr: "ainda lendo? boa noite, então.", mood: "sleepy" },
      ],
    ],
  };
  /* os gatos do bairro: inventados, como o resto do entorno */
  const CAT_TALK = {
    mina: {
      first: [
        { who: "narr", text: "(a gata laranja abre um olho.)" },
        { who: "mina", text: "mrrrp…", tr: "tô dormindo. volta depois.", mood: "sleepy" },
        { who: "cat", text: "meow!", tr: "desculpa. é que eu cheguei agora no bairro." },
        { who: "mina", text: "mrrp.", tr: "tá bom. eu sou a Mina. esses blocos são meus, e o terreno vazio também." },
        { who: "cat", text: "mew?", tr: "o terreno inteiro?" },
        { who: "mina", text: "prrr.", tr: "enquanto ninguém construir nada, sim. de noite eu te mostro.", mood: "happy" },
      ],
      again: [
        [{ who: "mina", text: "prrr…", tr: "cinco minutinhos.", mood: "sleepy" }],
        [{ who: "mina", text: "mrrp.", tr: "se construírem aqui, eu me mudo para o terraço de vocês." }],
        [{ who: "mina", text: "mrrrp.", tr: "a água do potinho é minha. a sombra da cerejeira também. tá tudo no meu nome." }],
      ],
      /* de noite a Mina acorda e brinca de pega-pega com a Jiji no terreno */
      night: [
        { who: "mina", text: "MRRRAOW!", tr: "acordei! bora correr!", mood: "wow" },
        { who: "cat", text: "meow?!", tr: "você não estava dormindo?", mood: "wow" },
        { who: "mina", text: "prrrt!", tr: "de dia eu durmo. de noite o terreno vira pista, e a Jiji vem brincar. vem também!", mood: "happy" },
      ],
      nightAgain: [
        [{ who: "mina", text: "brrrt!", tr: "mais uma volta! a Jiji quase me pegou.", mood: "happy" }],
        [{ who: "mina", text: "mrrp!", tr: "agora quem pega sou eu!", mood: "wow" }],
        [{ who: "mina", text: "prrr!", tr: "amanhã eu durmo o dia inteiro, prometo.", mood: "happy" }],
      ],
    },
    mike: {
      first: [
        { who: "cat", text: "meow?", tr: "é quentinho aí em cima?" },
        { who: "mike", text: "mrow.", tr: "a máquina esquenta o ano inteiro. é o melhor lugar da rua, e já tem dona." },
        { who: "cat", text: "meow.", tr: "entendi. eu tô visitando aquela casa ali, a de vidro na frente." },
        { who: "mike", text: "mrrp?", tr: "a da estante enorme? quando acende, dá para ver os livros daqui da rua." },
        { who: "cat", text: "mew.", tr: "essa mesma." },
        { who: "mike", text: "prrr.", tr: "prazer. eu sou a Mike.", mood: "happy" },
      ],
      again: [
        [{ who: "mike", text: "mrrp.", tr: "embaixo da máquina sempre aparece alguma coisa. as pessoas deixam cair moeda." }],
        [{ who: "mike", text: "mrow.", tr: "se achar uma moeda, experimenta o refrigerante de melão." }],
        [{ who: "mike", text: "prrr.", tr: "de noite a máquina acende e esquenta ainda mais.", mood: "happy" }],
      ],
      nightFirst: [
        { who: "cat", text: "meow?", tr: "não é quente demais aí em cima?" },
        { who: "mike", text: "prrr.", tr: "de noite é perfeito. a máquina acende e esquenta a barriga.", mood: "happy" },
        { who: "mike", text: "mrrp.", tr: "e daqui eu vejo a Mina e a Jiji correndo no terreno. eu sou a Mike." },
      ],
      nightAgain: [
        [{ who: "mike", text: "mrow.", tr: "olha as duas de novo. uma pega, a outra foge, e depois troca." }],
        [{ who: "mike", text: "prrr.", tr: "eu fico aqui, quentinha. correr é com elas.", mood: "happy" }],
        [{ who: "mike", text: "mrrp…", tr: "shh. o poste está cheio de mariposa.", mood: "sleepy" }],
      ],
    },
    jiji: {
      first: [
        { who: "jiji", text: "mew?", tr: "…oi. você é da casa de vidro?" },
        { who: "cat", text: "meow!", tr: "só de visita! e você?", mood: "happy" },
        { who: "jiji", text: "mrrp.", tr: "Jiji. desculpa, eu demoro um pouquinho pra me acostumar com gato novo." },
        { who: "narr", text: "(ela senta a uma distância segura e fica olhando. mas não vai embora.)" },
      ],
      nightFirst: [
        { who: "jiji", text: "mew?", tr: "ah, oi! você é novo por aqui, né? eu sou a Jiji." },
        { who: "cat", text: "meow!", tr: "prazer! tô visitando a casa de vidro." },
        { who: "jiji", text: "mrrp!", tr: "tô no meio de uma corrida com a Mina. senta aí e assiste, depois a gente conversa!", mood: "happy" },
      ],
      wary: [
        [{ who: "narr", text: "(a Jiji mexe a pontinha do rabo. ainda não chega mais perto, mas também não sai.)" }],
        [{ who: "jiji", text: "…", tr: "ainda tô decidindo se gosto de você. tá indo bem, viu." }],
        [{ who: "jiji", text: "mrrp.", tr: "você mia bastante, né? eu gosto mais quando fica quietinho do meu lado." }],
      ],
      blink: [
        { who: "narr", text: "(a Jiji fecha os olhos bem devagar. o gato faz a mesma coisa.)" },
        { who: "jiji", text: "prrr.", tr: "…tá bom. pode ficar.", mood: "happy" },
        { who: "cat", text: "prrr…", tr: "prometo não miar alto.", mood: "happy" },
        { who: "jiji", text: "mrrp.", tr: "a rua é minha de dia, mas pode passar quando quiser. só não conta pra Mina que eu fui fofa." },
      ],
      again: [
        [{ who: "jiji", text: "mrrp!", tr: "de dia eu fico na rua. o espelho da esquina mostra quem vem, e eu finjo que não tô olhando." }],
        [{ who: "jiji", text: "mew.", tr: "a Mina dorme o dia inteiro. alguém tem que cuidar da rua, né." }],
        [{ who: "jiji", text: "prrr.", tr: "(ela encosta a cabeça na sua, rapidinho, e volta pra ronda.)", mood: "happy" }],
      ],
      nightAgain: [
        [{ who: "jiji", text: "mrrp!", tr: "agora é a Mina que pega. corre!", mood: "happy" }],
        [{ who: "jiji", text: "mew!", tr: "espera, deixa eu recuperar o fôlego…" }],
      ],
    },
  };
  /* o que aparece quando anoitece e quando volta o fim de tarde */
  const NIGHT_SAY = ["anoiteceu. o trilho de luz acendeu lá dentro, e a máquina de bebidas, na rua.", "de noite a Mina acorda, e ela e a Jiji transformam o terreno vazio em pista de corrida.", "a rua escureceu. pelo vidro da frente, dá para ver a estante acesa."];
  const DAY_SAY = ["fim de tarde de novo. a Mina voltou a dormir nos blocos.", "voltou a luz do dia, entrando por cima da parede norte."];
  const NAMES = { cat: "GATO", masato: "MASATO IGARASHI", tomoko: "TOMOKO IGARASHI", narr: "", mina: "MINA", mike: "MIKE", jiji: "JIJI" };
  const VOICE = { cat: 1, mina: 0.8, mike: 1.03, jiji: 1.2 };
  const dlg = { open: false, lines: [], i: 0, shown: 0, acc: 0, onEnd: null, choices: null, sel: 0, focus: null };

  /* retratos em vetor, desenhados em código, com as mesmas cores dos bonecos
     do jogo; as pessoas são genéricas */
  const PORTRAIT = {
    cat: { bg: "#e3eefa", body: "#f8f4ee", ear: "#8e939c", inner: "#f4b6b2", crown: "#8e939c", shoulder: "#8e939c", eye: "#27252d" },
    mina: { bg: "#fff0dd", body: "#eea35c", ear: "#d98a47", inner: "#f7c3a3", crown: "#d98a47", muzzle: "#fbf3e8", bib: "#fbf3e8", eye: "#2c2320" },
    mike: { bg: "#eef6ea", body: "#f8f4ee", ear: "#2f2b35", inner: "#f4b6b2", crownR: "#2f2b35", shoulder: "#e39a55", eye: "#27252d" },
    jiji: { bg: "#e9e5f6", body: "#35323c", ear: "#35323c", inner: "#8f7f93", muzzle: "#f7f3ec", bib: "#f7f3ec", eye: "#161519", iris: "#e3d45a", line: "#f1ecdf" },
    masato: { bg: "#e3edf9", skin: "#f2d2b6", hair: "#241f24", shirt: "#3d5078", collar: "#f4f1ea" },
    tomoko: { bg: "#fdf0db", skin: "#f4d6be", hair: "#3f2c23", shirt: "#f2ede3", bob: true },
  };
  let faceSeq = 0;
  const mirrorPath = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${+(64 - x).toFixed(2)} ${y}`);
  /* retrato de gato: cabeça fofa com tufos nas bochechas, orelhas, busto */
  const K_HEAD = "M11 37 C10 25 19 19.5 32 19.5 C45 19.5 54 25 53 37 C55.8 38.6 55.4 41.6 53 42.6 C54.6 44.4 53.4 46.8 50.6 47 C47 53.2 40.4 56 32 56 C23.6 56 17 53.2 13.4 47 C10.6 46.8 9.4 44.4 11 42.6 C8.6 41.6 8.2 38.6 11 37 Z";
  const K_EAR = "M12.2 33 C11.2 24 12.6 15 15.4 9.6 C16.3 7.9 18 7.7 19.3 8.9 C23.6 12.8 27 17 29.5 21.8 Z";
  const K_INNER = "M15.6 27.4 C15.6 21.4 16.4 16.4 17.8 13.2 C21 16 23.8 19.4 25.6 23 Z";
  function kittenFace(f, mood) {
    const id = "nkf" + (faceSeq += 1), line = f.line || f.eye, eyeY = 37.4;
    const eye = (cx) => {
      if (mood === "happy") return `<path d="M${cx - 4.1} ${eyeY + 1.2} Q${cx} ${eyeY - 3.8} ${cx + 4.1} ${eyeY + 1.2}" stroke="${line}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      if (mood === "sleepy") return `<path d="M${cx - 4} ${eyeY} Q${cx} ${eyeY + 3.2} ${cx + 4} ${eyeY}" stroke="${line}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      const k = mood === "wow" ? 1.2 : 1, rx = 4.3 * k, ry = 5.1 * k;
      const ball = f.iris
        ? `<ellipse cx="${cx}" cy="${eyeY}" rx="${rx}" ry="${ry}" fill="${f.iris}"/><ellipse cx="${cx}" cy="${eyeY + 0.2}" rx="${1.5 * k}" ry="${ry * 0.8}" fill="${f.eye}"/>`
        : `<ellipse cx="${cx}" cy="${eyeY}" rx="${rx}" ry="${ry}" fill="${f.eye}"/><ellipse cx="${cx}" cy="${eyeY + ry * 0.5}" rx="${rx * 0.66}" ry="${ry * 0.3}" fill="#6d6680" opacity=".5"/>`;
      return `${ball}<circle cx="${cx + 1.5}" cy="${eyeY - 1.9 * k}" r="${1.6 * k}" fill="#fff"/><circle cx="${cx - 1.3}" cy="${eyeY + 2.1 * k}" r="${0.75 * k}" fill="#fff" opacity=".85"/>`;
    };
    const mouth = mood === "wow"
      ? `<ellipse cx="32" cy="47.4" rx="2" ry="2.5" fill="#a9505b"/><ellipse cx="32" cy="48.6" rx="1.2" ry=".9" fill="#f08e98"/>`
      : mood === "happy"
        ? `<path d="M28.6 45.3 C29.8 49.2 34.2 49.2 35.4 45.3 C34 46.2 30 46.2 28.6 45.3 Z" fill="#b8535f"/><path d="M30.4 47.6 C31.4 48.4 32.6 48.4 33.6 47.6" stroke="#f08e98" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
        : `<path d="M28.7 45.3 C29.7 47 31.4 47 32 45.6 C32.6 47 34.3 47 35.3 45.3" stroke="#8f6a66" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    const marks = [
      f.crown ? `<path d="M8 36 C8 22 17 16 30 17 C25 21 23.6 27 25.4 33 C19 35.6 13 36.8 8 36 Z" fill="${f.crown}"/>` : "",
      f.crownR ? `<path d="M56 34.5 C56 21 47 15.5 35 16.5 C40.4 21 41.6 26.4 40 32 C46 34.6 51.4 35.4 56 34.5 Z" fill="${f.crownR}"/>` : "",
      f.muzzle ? `<path d="M20 50 C19 43 24.6 39.6 32 39.6 C39.4 39.6 45 43 44 50 C41 55 23 55 20 50 Z" fill="${f.muzzle}"/>` : "",
    ].join("");
    const earR = mirrorPath(K_EAR), innerR = mirrorPath(K_INNER);
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs>
      <radialGradient id="${id}b" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}s" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1b1030" stop-opacity=".14"/></radialGradient>
      <clipPath id="${id}c"><path d="${K_HEAD}"/></clipPath></defs>
      <circle cx="32" cy="32" r="32" fill="${f.bg}"/><circle cx="32" cy="30" r="30" fill="url(#${id}b)"/>
      <path d="M9 64 C10.5 53 19 49.5 32 49.5 C45 49.5 53.5 53 55 64 Z" fill="${f.body}"/>
      ${f.shoulder ? `<path d="M40 50.4 C47 51.4 53 55 54.6 64 L44 64 C43.6 58 42.4 53.6 40 50.4 Z" fill="${f.shoulder}"/>` : ""}
      ${f.bib ? `<path d="M23.4 64 C23.8 56.4 27.4 52.4 32 52.4 C36.6 52.4 40.2 56.4 40.6 64 Z" fill="${f.bib}"/>` : ""}
      <ellipse cx="32" cy="55.4" rx="14" ry="2.6" fill="#1b1030" opacity=".1"/>
      <path d="${K_EAR}" fill="${f.ear}"/><path d="${earR}" fill="${f.ear}"/>
      <path d="${K_INNER}" fill="${f.inner}"/><path d="${innerR}" fill="${f.inner}"/>
      <path d="M18.6 17.6 L20.4 20.6 M20.6 16.4 L21.4 19.8" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".7"/>
      <path d="M45.4 17.6 L43.6 20.6 M43.4 16.4 L42.6 19.8" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".7"/>
      <path d="${K_HEAD}" fill="${f.body}"/>
      <g clip-path="url(#${id}c)">${marks}<path d="${K_HEAD}" fill="url(#${id}s)"/></g>
      <path d="${K_HEAD}" fill="none" stroke="#1b1030" stroke-opacity=".12" stroke-width=".8"/>
      ${eye(23.4)}${eye(40.6)}
      <ellipse cx="16.8" cy="44.6" rx="3.6" ry="2.1" fill="#f59ea0" opacity=".5"/><ellipse cx="47.2" cy="44.6" rx="3.6" ry="2.1" fill="#f59ea0" opacity=".5"/>
      <path d="M29.8 42.3 C31 41.4 33 41.4 34.2 42.3 C33.7 43.6 32.8 44.3 32 44.4 C31.2 44.3 30.3 43.6 29.8 42.3 Z" fill="#ee9098"/>${mouth}
      <path d="M13 42.6 L5.4 41.2 M13.2 45.2 L5.8 46.4 M50.8 42.6 L58.6 41.2 M50.8 45.2 L58.2 46.4" stroke="${f.whisker || "#c9c1b6"}" stroke-width="1" stroke-linecap="round"/></svg>`;
  }
  /* retrato de gente, no mesmo jeito de brinquedo dos bonecos: cabeça grande,
     olhos de pontinho com brilho, bochecha rosada */
  function personFace(f, mood) {
    const id = "nkf" + (faceSeq += 1), eyeY = 33.2;
    const eye = (cx) => {
      if (mood === "happy") return `<path d="M${cx - 2.6} ${eyeY + 0.8} Q${cx} ${eyeY - 2.4} ${cx + 2.6} ${eyeY + 0.8}" stroke="#2a2430" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
      const k = mood === "wow" ? 1.2 : 1;
      return `<ellipse cx="${cx}" cy="${eyeY}" rx="${2.3 * k}" ry="${2.9 * k}" fill="#2a2430"/><circle cx="${cx + 0.8}" cy="${eyeY - 1.1 * k}" r="${0.95 * k}" fill="#fff"/><circle cx="${cx - 0.7}" cy="${eyeY + 1.2 * k}" r=".45" fill="#fff" opacity=".85"/>`;
    };
    const back = f.bob ? `<path d="M12.6 42 C10.6 20 18.6 10.6 32 10.6 C45.4 10.6 53.4 20 51.4 42 C49.6 45.6 45.6 45.6 44 42.6 L44 30 L20 30 L20 42.6 C18.4 45.6 14.4 45.6 12.6 42 Z" fill="${f.hair}"/>` : "";
    const front = f.bob
      ? `<path d="M14.8 32 C14 18.4 21.6 12.2 32 12.2 C42.4 12.2 50 18.4 49.2 32 C47.8 28 46 25.8 44.2 24.8 C41.6 27.6 37 28 33.4 26 C29.2 28.2 24 28 20.8 25.2 C18.4 26.6 16.2 28.8 14.8 32 Z" fill="${f.hair}"/><path d="M22 16.4 C25 14.6 28.4 14 31.4 14.2" stroke="#fff" stroke-opacity=".22" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
      : `<path d="M14.4 30 C13.8 18 21.8 12.2 32 12.2 C42.2 12.2 50.2 18 49.6 30 C48 25.6 45.2 23 42.2 22 L40.6 25.8 L37.8 21.6 L34.6 26 L31.6 21.4 L28.4 25.8 L25.8 21.8 C21.2 23 16.4 25.6 14.4 30 Z" fill="${f.hair}"/><path d="M26.6 13.2 L27.8 8.4 L30.6 12.6 Z M33.2 12.4 L35.8 8 L37.4 13 Z" fill="${f.hair}"/><path d="M21 17.2 C24 15 27.6 14.2 30.6 14.4" stroke="#fff" stroke-opacity=".2" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    const mouth = mood === "wow" ? `<ellipse cx="32" cy="41" rx="1.5" ry="1.9" fill="#a9505b"/>` : mood === "happy" ? `<path d="M29.4 39.8 C30.2 42.6 33.8 42.6 34.6 39.8 C33.4 40.4 30.6 40.4 29.4 39.8 Z" fill="#b8535f"/>` : `<path d="M29.8 40.2 Q32 42 34.2 40.2" stroke="#b56a5e" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs>
      <radialGradient id="${id}b" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}s" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#8a4a3a" stop-opacity=".16"/></radialGradient></defs>
      <circle cx="32" cy="32" r="32" fill="${f.bg}"/><circle cx="32" cy="30" r="30" fill="url(#${id}b)"/>${back}
      <path d="M9 64 C10 53 19 49 32 49 C45 49 54 53 55 64 Z" fill="${f.shirt}"/>
      ${f.collar ? `<path d="M24.2 50.2 C27 54.6 37 54.6 39.8 50.2 C37.4 48.8 26.6 48.8 24.2 50.2 Z" fill="${f.collar}"/>` : `<path d="M26 50 C28.6 52.6 35.4 52.6 38 50" stroke="#1b1030" stroke-opacity=".12" stroke-width="1.2" fill="none" stroke-linecap="round"/>`}
      <rect x="29" y="43" width="6" height="8" rx="2.6" fill="${f.skin}"/>
      <circle cx="15.4" cy="32.6" r="2.6" fill="${f.skin}"/><circle cx="48.6" cy="32.6" r="2.6" fill="${f.skin}"/>
      <circle cx="32" cy="30" r="17" fill="${f.skin}"/><circle cx="32" cy="30" r="17" fill="url(#${id}s)"/>
      <circle cx="32" cy="30" r="17" fill="none" stroke="#1b1030" stroke-opacity=".1" stroke-width=".8"/>${front}
      <path d="M22.8 28.2 Q25.4 27 28 28 M36 28 Q38.6 27 41.2 28.2" stroke="${f.hair}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      ${eye(25.4)}${eye(38.6)}
      <ellipse cx="21.2" cy="38" rx="3" ry="1.8" fill="#f59ea0" opacity=".5"/><ellipse cx="42.8" cy="38" rx="3" ry="1.8" fill="#f59ea0" opacity=".5"/>${mouth}</svg>`;
  }
  function setFace(who, mood) {
    const el = $("nk-face");
    const f = who && PORTRAIT[who];
    el.hidden = !f;
    if (!f) return;
    el.innerHTML = f.skin ? personFace(f, mood) : kittenFace(f, mood);
  }
  function autoMood(L) {
    if (L.mood) return L.mood;
    const s = String(L.text || "").toLowerCase();
    if (s.startsWith("prr")) return "happy";
    if (/[!?]{2}|!$/.test(s) && L.who !== "masato") return "wow";
    return null;
  }
  function showLine() {
    const L = dlg.lines[dlg.i];
    dlg.shown = 0;
    dlg.acc = 0;
    hideChoices();
    const box = $("nk-dlg");
    box.dataset.who = L.who;
    box.classList.remove("pop");
    void box.offsetWidth;
    box.classList.add("pop");
    $("nk-dlg-name").textContent = $t(NAMES[L.who]) || "";
    $("nk-dlg-text").textContent = "";
    $("nk-dlg-tr").textContent = "";
    $("nk-dlg-tr").dataset.badge = $b("tradução", "translation");
    setFace(L.who === "narr" ? null : L.who, autoMood(L));
    if (VOICE[L.who] && !L.quiet) catVoice(callKind(L.text), VOICE[L.who]);
    if (CATS[L.who]) CATS[L.who].say = 0.9;
    if (L.who === "cat") cat.talk = 0.45;
    if (L.who === "masato") NPC.masato.react = 0.8;
    if (REDUCED) finishLine();
  }
  function finishLine() {
    const L = dlg.lines[dlg.i];
    const tx = $t(L.text);
    dlg.shown = tx.length;
    $("nk-dlg-text").textContent = tx;
    $("nk-dlg-tr").textContent = L.tr ? $t(L.tr) : "";
    if (L.ask && !dlg.choices) showChoices(typeof L.ask === "function" ? L.ask() : L.ask);
  }
  /* escolhas: o gato decide o que perguntar; setas ou W e S trocam, X escolhe */
  function showChoices(list) {
    if (!list || !list.length) return;
    dlg.choices = list;
    dlg.sel = 0;
    const box = $("nk-choices");
    box.innerHTML = "";
    list.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<span class="k">${i + 1}</span>${esc($t(c.label))}`;
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); pick(i); });
      box.appendChild(b);
    });
    box.hidden = false;
    $("nk-dlg").classList.add("asking");
    markChoice();
  }
  function markChoice() {
    const bs = $("nk-choices").querySelectorAll("button");
    bs.forEach((b, i) => b.classList.toggle("sel", i === dlg.sel));
  }
  function moveChoice(d) {
    if (!dlg.choices) return;
    dlg.sel = (dlg.sel + d + dlg.choices.length) % dlg.choices.length;
    markChoice();
    tink(0.5);
  }
  function hideChoices() {
    dlg.choices = null;
    const box = $("nk-choices");
    box.hidden = true;
    box.innerHTML = "";
    $("nk-dlg").classList.remove("asking");
  }
  function pick(i) {
    const c = dlg.choices && dlg.choices[i];
    if (!c) return;
    hideChoices();
    dlg.open = false;
    dlg.onEnd = null;
    $("nk-dlg").hidden = true;
    blip();
    c.run();
  }
  function openDialogue(lines, onEnd, focus) {
    dlg.open = true;
    dlg.lines = lines;
    dlg.i = 0;
    dlg.onEnd = onEnd || null;
    if (focus !== undefined) dlg.focus = focus;
    for (const k in keys) keys[k] = false;
    /* a fala de um livro que ainda estava sendo lida volta quando o diálogo fecha */
    if (holdT > 0 && msgTimer > 0.6 && lastMsg) resumeMsg = [lastMsg, Math.max(3.5, msgTimer + 1)];
    holdT = 0;
    $("nk-msg").classList.remove("on");
    msgTimer = 0;
    $("nk-dlg").hidden = false;
    showLine();
  }
  function advance() {
    if (!dlg.open) return;
    const L = dlg.lines[dlg.i];
    if (dlg.shown < $t(L.text).length) { finishLine(); return; }
    if (dlg.choices) { pick(dlg.sel); return; }
    dlg.i += 1;
    if (dlg.i >= dlg.lines.length) {
      dlg.open = false;
      dlg.focus = null;
      $("nk-dlg").hidden = true;
      const fn = dlg.onEnd;
      dlg.onEnd = null;
      if (fn) fn();
      return;
    }
    showLine();
  }
  function tickDialogue(dt) {
    if (!dlg.open) return;
    const L = dlg.lines[dlg.i];
    const tx = $t(L.text);
    if (dlg.shown >= tx.length) return;
    dlg.acc += dt * (L.who === "masato" ? 58 : 46);
    const n = Math.min(tx.length, Math.floor(dlg.acc));
    if (n > dlg.shown) {
      if (L.who === "masato" && Math.floor(n / 3) > Math.floor(dlg.shown / 3)) blip();
      dlg.shown = n;
      $("nk-dlg-text").textContent = tx.slice(0, n);
      if (n >= tx.length) finishLine();
    }
  }

  /* a conversa com o Masato: o gato escolhe o assunto, e ele responde com o
     que escreveu; no começo, o gato comenta o que acabou de aprontar */
  const asked = new Set();
  const noted = new Set();
  let metMasato = false;
  let extraIdx = 0, tomokoIdx = 0;
  const topicById = (id) => TOPICS.find((t) => t.id === id) || HOUSE_TOPICS.find((t) => t.id === id);
  function countEmail() { return TOPICS.filter((t) => asked.has(t.id)).length; }
  function nextOptions() {
    const out = [];
    for (const t of TOPICS) if (!asked.has(t.id) && (!t.last || countEmail() >= 2)) out.push(t);
    if (countEmail() >= 4) for (const t of HOUSE_TOPICS) if (!asked.has(t.id)) out.push(t);
    const last = out.find((t) => t.last);
    let list = out.filter((t) => !t.last).slice(0, 2);
    if (last) list = list.concat([last]);
    return list.slice(0, 3);
  }
  function menu(first) {
    const opts = nextOptions().map((t) => ({ label: t.label, run: () => askTopic(t) }));
    opts.push({ label: first ? "só vim dar um oi" : "até mais, bom trabalho", run: bye });
    return opts;
  }
  function bye() {
    const lines = night
      ? [{ who: "cat", text: "mew.", tr: "boa noite. vou dar uma volta lá fora.", mood: "happy" }]
      : [{ who: "cat", text: "mrrp.", tr: "tá bom, pode voltar ao trabalho.", mood: "happy" }];
    openDialogue(lines, null, null);
  }
  function askTopic(t) {
    const lines = t.lines.map((L) => Object.assign({}, L));
    const done = () => {
      asked.add(t.id);
      talkIdx = countEmail();
      renderSide(true);
      if (talkIdx >= TOPICS.length) goal("talk", "おもしろい…");
    };
    if (!t.last && nextOptions().filter((o) => o.id !== t.id).length) lines[lines.length - 1].ask = () => { done(); return menu(false); };
    openDialogue(lines, done, dlg.focus);
  }
  function reaction() {
    const R = [];
    if (booksDown > 0 && !noted.has("book")) { noted.add("book"); R.push({ who: "narr", text: "(Masato olha para o livro no chão e depois para o gato.)" }, { who: "cat", text: "mew.", tr: "ele caiu sozinho. mais ou menos.", mood: "wow" }); }
    else if (keysN > 0 && !noted.has("keys")) { noted.add("keys"); R.push({ who: "cat", text: "mrrp.", tr: "desculpa pelo teclado. achei que era almofada.", mood: "happy" }); }
    else if (Object.values(CATS).some((c) => c.friend) && !noted.has("cats")) { noted.add("cats"); R.push({ who: "cat", text: "meow meow.", tr: "conheci as gatas da rua. a Mina diz que o terreno vazio é dela." }); }
    return R;
  }
  function talkMasato() {
    const n = NPC.masato;
    const focus = { x: n.x, y: n.y + 0.2, z: n.z };
    if (!nextOptions().length) {
      openDialogue([
        { who: "narr", text: "(Masato volta ao trabalho. o gato se acomoda na cadeira ao lado.)" },
        { who: "cat", text: "prrr…", tr: "obrigado pelas respostas.", mood: "happy" },
      ], null, focus);
      return;
    }
    const lines = [];
    if (!metMasato) lines.push({ who: "narr", text: night ? "(o trilho de luz está aceso. Masato Igarashi, arquiteto e morador da casa, tira os olhos do computador.)" : "(Masato Igarashi, arquiteto e morador da casa, tira os olhos do computador.)" });
    else lines.push({ who: "narr", text: "(Masato olha de novo para o gato.)" });
    metMasato = true;
    lines.push(...reaction());
    const greet = night
      ? { who: "cat", text: "meow?", tr: asked.size ? "ainda trabalhando? posso fazer mais uma pergunta?" : "ainda trabalhando? posso fazer umas perguntas sobre a casa?" }
      : { who: "cat", text: "meow!", tr: asked.size ? "voltei. posso perguntar mais uma coisa?" : "oi. posso fazer umas perguntas sobre a casa?" };
    greet.ask = () => menu(!asked.size);
    lines.push(greet);
    openDialogue(lines, null, focus);
  }
  function talkTo(who) {
    if (who === "masato") { talkMasato(); return; }
    if (who === "tomoko") {
      const n = NPC.tomoko;
      const set = night ? TOMOKO_TALK.night : TOMOKO_TALK.day;
      openDialogue(set[Math.min(tomokoIdx, set.length - 1)], null, { x: n.x, y: n.y + 0.2, z: n.z });
      tomokoIdx += 1;
      return;
    }
    talkToCat(who);
  }

  /* ---------------------------------------------------------------------
     os gatos do bairro: conversa, amizade, a piscada lenta da Jiji e, de
     noite, a corrida da Mina no terreno vazio
     --------------------------------------------------------------------- */
  const catName = (id) => NAMES[id].charAt(0) + NAMES[id].slice(1).toLowerCase();
  function faceTo(c, x, z) { c.face = Math.atan2(-(z - c.z), x - c.x); }
  function catNear() {
    let best = null, bd = 1.0;
    for (const id in CATS) {
      const c = CATS[id];
      const d = Math.hypot(cat.x - c.x, cat.z - c.z);
      if (c.mode === "come" || c.mode === "blink") continue;
      /* depois do primeiro oi, com a Jiji ainda tímida, X perto dela deita:
         é o que ajuda, e ela já ouviu miado suficiente */
      if (id === "jiji" && c.talked && !c.friend) continue;
      if (d < bd && Math.abs(cat.y - c.y) < 0.7) { bd = d; best = id; }
    }
    return best;
  }
  function befriend(c) {
    if (c.friend) return;
    c.friend = true;
    pop("heart", c.x, c.y + 0.5, c.z, 1.6);
    pop("heart", cat.x, cat.y + 0.5, cat.z, 1.6);
    purr(1.4);
    const n = Object.values(CATS).filter((k) => k.friend).length;
    if (n >= 3) extra("cats", $b("amizade feita com as três gatas do bairro.", "friends with all three cats of the street."));
    else say($b(`a ${catName(c.id)} agora é sua amiga: ${n} de 3 gatas do bairro.`, `${catName(c.id)} is your friend now: ${n} of 3 cats on the street.`), 3.2);
    renderSide(true);
  }
  function talkToCat(id) {
    const c = CATS[id];
    if (!c) return;
    const T = CAT_TALK[id];
    const focus = { x: c.x, y: c.y, z: c.z };
    if (id !== "mike") faceTo(c, cat.x, cat.z);
    if (id === "mina") {
      if (night) {
        c.speed = 0;
        const first = !c.nightTalked;
        c.nightTalked = true;
        const lines = first ? T.night : T.nightAgain[c.again % T.nightAgain.length];
        if (!first) c.again += 1;
        openDialogue(lines, () => { c.mode = "circle"; c.circle = 4.2; c.circleA = Math.atan2(c.z - cat.z, c.x - cat.x); c.talked = true; befriend(c); }, focus);
        return;
      }
      if (c.mode === "sleep") { c.mode = "sit"; c.wake = 30; idleDo(c.fig.idle, "yawn"); }
    }
    if (id === "jiji") { c.speed = 0; c.walk = 0; }
    if (!c.talked) {
      c.talked = true;
      if (id === "jiji") {
        openDialogue(night ? T.nightFirst : T.first, () => { c.mode = "wary"; c.calm = 0; say(night ? "(ela vai voltar pra corrida. se o gato deitar por perto, com X, ela talvez venha ver.)" : "(gato desconfiado costuma chegar sozinho. deitar por perto, com X, ajuda.)", 4.4); }, focus);
        return;
      }
      openDialogue(night && T.nightFirst ? T.nightFirst : T.first, () => befriend(c), focus);
      return;
    }
    if (id === "jiji" && !c.friend) {
      c.mode = "wary";
      openDialogue(T.wary[c.again % T.wary.length], null, focus);
      c.again += 1;
      return;
    }
    const pool = night && T.nightAgain ? T.nightAgain : T.again;
    openDialogue(pool[c.again % pool.length], null, focus);
    c.again += 1;
  }
  /* a piscada lenta: fecha devagar, segura, abre devagar (u em segundos) */
  function slowEye(u) {
    if (u < 0) return 1;
    if (u < 0.8) return 1 - u / 0.8;
    if (u < 1.3) return 0;
    if (u < 2.0) return (u - 1.3) / 0.7;
    return 1;
  }
  const BLINK_ME = 2.7, BLINK_END = 5.0;
  /* quando o gato mia, quem está perto responde */
  function answerCats() {
    for (const id in CATS) {
      const c = CATS[id];
      if (Math.hypot(cat.x - c.x, cat.z - c.z) > 3.6) continue;
      if (c.mode === "sleep") purr(0.8, 0.5);
      else { catVoice("mrrp", c.voice, 0.45 + Math.random() * 0.4); c.say = 1.1; }
    }
  }
  function moveBody(b, nx, nz) {
    let y = b.y;
    for (let k = 0; k < 4; k += 1) {
      const tops = blockersAt(nx, y, nz);
      if (!tops.length) { b.x = nx; b.z = nz; b.y = y; return true; }
      const t = Math.max(...tops);
      if (t - y <= CAT.STEP + 1e-4) { y = t; continue; }
      return false;
    }
    return false;
  }
  /* o terreno vazio, onde a Mina corre de noite */
  const VAC = { x0: LOT_W + 0.4, x1: DIO.x1 - 0.45, z0: 0.8, z1: LOT_D - 0.5 };
  const inVac = (x, z) => x > VAC.x0 - 0.3 && z < LOT_D - 0.2;
  /* anda na direção c.dir, com velocidade c.speed, dentro de uma área */
  function stepBody(c, want, dt, area) {
    c.speed += (want - c.speed) * Math.min(1, dt * 6);
    if (c.speed <= 0.03) return;
    const vx = Math.cos(c.dir) * c.speed * dt, vz = -Math.sin(c.dir) * c.speed * dt;
    let nx = c.x + vx, nz = c.z + vz;
    if (area) { nx = Math.max(area.x0, Math.min(area.x1, nx)); nz = Math.max(area.z0, Math.min(area.z1, nz)); }
    const okx = moveBody(c, nx, c.z), okz = moveBody(c, c.x, nz);
    if (!okx || !okz) c.dir += (Math.random() < 0.5 ? 1 : -1) * Math.PI * 0.5;
    c.face += (((c.dir - c.face + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) * Math.min(1, dt * 10);
    c.fig.phase += c.speed * dt * 24;
    const g = groundAt(c.x, c.z, c.y + 0.3);
    if (isFinite(g.y)) c.y = g.y;
  }
  const busy = (c) => dlg.open && dlg.focus && Math.hypot(dlg.focus.x - c.x, dlg.focus.z - c.z) < 0.3;
  function minaAI(c, dt) {
    if (busy(c)) { c.speed = 0; return; }
    if (night && (c.mode === "sleep" || c.mode === "sit" || c.mode === "home")) {
      c.mode = "zoom"; c.wait = 0.5; c.burst = 0;
      MINA_SOLID.y0 = 99;
      if (c.y > 0.1) c.y = 0.2;
      pop("bang", c.x, c.y + 0.5, c.z, 0.9);
      catVoice("mrrp", c.voice, 0.2);
    } else if (!night && (c.mode === "zoom" || c.mode === "circle")) c.mode = "home";
    let want = 0;
    if (c.mode === "zoom" && jijiPlays()) {
      /* pega-pega com a Jiji: foge quando é a Jiji quem pega, persegue quando é
         ela; de vez em quando as duas param, se encaram e recomeçam */
      const j = CATS.jiji;
      if (PLAY.pause > 0 || (PLAY.chaser === "mina" && PLAY.freeze > 0)) { want = 0; faceTo(c, j.x, j.z); c.dir = c.face; }
      else if (PLAY.chaser === "mina") {
        c.dir = Math.atan2(-(j.z - c.z), j.x - c.x) + Math.sin(c.t * 3.1) * 0.2;
        want = 2.2;
      } else {
        c.wait -= dt;
        const dj = Math.hypot(j.x - c.x, j.z - c.z);
        if (c.wait <= 0 || Math.hypot(c.tx - c.x, c.tz - c.z) < 0.3 || Math.hypot(c.tx - j.x, c.tz - j.z) < 1.2) {
          /* um ponto do terreno longe da Jiji */
          let best = null, bd = -1;
          for (let i = 0; i < 6; i += 1) {
            const tx = VAC.x0 + Math.random() * (VAC.x1 - VAC.x0), tz = VAC.z0 + Math.random() * (VAC.z1 - VAC.z0);
            const dd = Math.hypot(tx - j.x, tz - j.z);
            if (dd > bd) { bd = dd; best = [tx, tz]; }
          }
          [c.tx, c.tz] = best;
          c.wait = 0.8 + Math.random() * 0.9;
        }
        c.dir = Math.atan2(-(c.tz - c.z), c.tx - c.x);
        want = dj < 1.4 ? 2.4 : 1.8;
      }
      stepBody(c, want, dt, VAC);
    } else if (c.mode === "zoom") {
      c.wait -= dt;
      if (c.burst > 0) {
        c.burst -= dt;
        c.dir = Math.atan2(-(c.tz - c.z), c.tx - c.x);
        want = 2.0 + Math.sin(c.t * 7) * 0.35;
        if (Math.hypot(c.tx - c.x, c.tz - c.z) < 0.2) c.burst = 0;
      } else if (c.wait <= 0) {
        const nearMe = started && inVac(cat.x, cat.z) && Math.random() < 0.45;
        c.tx = nearMe ? cat.x + (Math.random() - 0.5) * 2.4 : VAC.x0 + Math.random() * (VAC.x1 - VAC.x0);
        c.tz = nearMe ? cat.z + (Math.random() - 0.5) * 2.4 : VAC.z0 + Math.random() * (VAC.z1 - VAC.z0);
        c.tx = Math.max(VAC.x0, Math.min(VAC.x1, c.tx));
        c.tz = Math.max(VAC.z0, Math.min(VAC.z1, c.tz));
        c.burst = 0.7 + Math.random() * 1.5;
        c.wait = c.burst + 0.35 + Math.random() * 0.9;
        if (Math.random() < 0.3) c.say = 0.6;
      }
      stepBody(c, want, dt, VAC);
    } else if (c.mode === "circle") {
      c.circle -= dt;
      c.circleA += dt * 3.4;
      const tx = cat.x + Math.cos(c.circleA) * 0.7, tz = cat.z + Math.sin(c.circleA) * 0.7;
      c.dir = Math.atan2(-(tz - c.z), tx - c.x);
      stepBody(c, 2.1, dt, { x0: DIO.x0 + 0.4, x1: DIO.x1 - 0.4, z0: 0.3, z1: STREET.z1 - 0.3 });
      if (c.circle <= 0) { c.mode = night ? "zoom" : "home"; c.wait = 0.4; }
    } else if (c.mode === "home") {
      const dx = STRAY.x - c.x, dz = STRAY.z - c.z, d = Math.hypot(dx, dz);
      if (d < 0.14) {
        Object.assign(c, { mode: "sleep", x: STRAY.x, z: STRAY.z, y: 0.2, face: -2.4, speed: 0 });
        MINA_SOLID.y0 = 0.2;
        return;
      }
      c.dir = Math.atan2(-dz, dx);
      stepBody(c, 0.75, dt, null);
      if (d < 0.5) { c.x += dx * Math.min(1, dt * 3); c.z += dz * Math.min(1, dt * 3); }
    } else c.speed = 0;
  }
  function jijiAI(c, dt) {
    if (busy(c)) { c.speed = 0; return; }
    const dx = c.x - cat.x, dz = c.z - cat.z, d = Math.hypot(dx, dz);
    const near = started && !viewMode && Math.abs(cat.y - c.y) < 0.8;
    let want = 0, area = ROAM;
    const turnToMe = () => { const f = Math.atan2(dz, -dx); c.face += (((f - c.face + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) * Math.min(1, dt * 4); };
    /* de noite, com a Mina correndo, a Jiji vai atrás dela, amiga ou ainda
       desconfiada; só para quando o gato deita perto e fica quieto */
    const chase = night && CATS.mina.mode === "zoom" && (c.mode === "wander" || c.mode === "friend" || (c.mode === "wary" && !(near && cat.lying && d < 3.2)));
    if (chase) {
      /* entra no terreno vazio pela rua, entre os postes da corda, que ficam
         90 cm um do outro */
      const m = CATS.mina;
      let tx = m.x, tz = m.z;
      if (!inVac(c.x, c.z)) {
        const gx = 7.45;
        if (c.z > LOT_D + 0.2 && Math.abs(c.x - gx) > 0.12) { tx = gx; tz = LOT_D + 0.45; }
        else { tx = gx; tz = LOT_D - 0.8; }
      }
      const mx = tx - c.x, mz = tz - c.z, md = Math.hypot(mx, mz);
      c.flee = 0;
      if (!inVac(c.x, c.z)) { c.dir = Math.atan2(-mz, mx); want = 2.1; }
      else if (PLAY.pause > 0 || (PLAY.chaser === "jiji" && PLAY.freeze > 0)) { want = 0; faceTo(c, m.x, m.z); c.dir = c.face; }
      else if (PLAY.chaser === "jiji") { c.dir = Math.atan2(-mz, mx) + Math.sin(c.t * 2.7) * 0.2; want = 2.2; }
      else {
        /* foge da Mina, para um canto do terreno longe dela */
        c.wait -= dt;
        if (c.wait <= 0 || c.tx == null || Math.hypot(c.tx - c.x, c.tz - c.z) < 0.3 || Math.hypot(c.tx - m.x, c.tz - m.z) < 1.2) {
          let best = null, bd = -1;
          for (let i = 0; i < 6; i += 1) {
            const qx = VAC.x0 + Math.random() * (VAC.x1 - VAC.x0), qz = VAC.z0 + Math.random() * (VAC.z1 - VAC.z0);
            const dd = Math.hypot(qx - m.x, qz - m.z);
            if (dd > bd) { bd = dd; best = [qx, qz]; }
          }
          [c.tx, c.tz] = best;
          c.wait = 0.8 + Math.random() * 0.9;
        }
        c.dir = Math.atan2(-(c.tz - c.z), c.tx - c.x);
        want = Math.hypot(m.x - c.x, m.z - c.z) < 1.4 ? 2.4 : 1.8;
      }
      area = inVac(c.x, c.z) ? VAC : null;
    } else if (c.mode === "wary") {
      /* sentada, de olho, mas curiosa. Se o gato chega perto demais, ela só
         abre espaço de lado, sem fugir; a confiança vai subindo enquanto ele
         fica parado por perto (mais rápido se deitar) e cai devagar quando ele
         se agita. Quando confia o bastante, ela mesma vem */
      area = inVac(c.x, c.z) ? VAC : ROAM;
      if (c.flee > 0) { c.flee -= dt; want = 0.45; }
      else if (near && d < 4) turnToMe();
      if (near && !cat.lying && d < 0.9 && c.flee <= 0) {
        c.dir = Math.atan2(-dz, dx) + (Math.random() < 0.5 ? 1 : -1) * 1.1; c.flee = 0.6;
        if (!dlg.open) once("jijiSide", "(a Jiji dá dois passinhos pro lado. tão perto ainda não, mas ela continua ali.)", 3.6);
      }
      const stillMe = cat.grounded && Math.hypot(cat.vx, cat.vz) < 0.05;
      if (near && stillMe && d < (night ? 3.2 : 2.6)) {
        c.calm += dt * (cat.lying ? 1 : 0.45);
        if (c.calm > 2.2) { c.mode = "come"; c.calm = 0; c.comeT = 0; catVoice("mrrp", c.voice, 0.2); }
      } else c.calm = Math.max(0, c.calm - dt * 0.35);
    } else if (c.mode === "come") {
      area = null;
      c.comeT += dt;
      /* se o gato levanta, ela para onde está e espera: a confiança não zera */
      if (!near || !cat.lying || c.comeT > 10) { c.mode = "wary"; c.calm = 1.2; }
      else if (d > 0.5) { c.dir = Math.atan2(dz, -dx); want = 0.45; }
      else {
        c.mode = "blink"; c.blinkT = 0; c.speed = 0;
        faceTo(c, cat.x, cat.z);
        cat.face = Math.atan2(-(c.z - cat.z), c.x - cat.x);
      }
    } else if (c.mode === "blink") {
      c.blinkT += dt;
      if (!cat.lying && c.blinkT < BLINK_ME) { c.mode = "wary"; c.calm = 1.4; }
      else if (c.blinkT >= BLINK_END) {
        c.mode = "friend";
        pop("heart", c.x, c.y + 0.5, c.z, 1.6);
        openDialogue(CAT_TALK.jiji.blink, () => befriend(c), { x: c.x, y: c.y, z: c.z });
      }
    } else if (c.mode === "wander" || c.mode === "friend") {
      if (inVac(c.x, c.z)) {
        /* amanheceu: volta para a rua */
        c.dir = Math.atan2(-((ROAM.z0 + ROAM.z1) / 2 - c.z), 7.6 - c.x);
        want = 0.9;
        area = null;
      } else {
        c.wait -= dt;
        if (c.wait <= 0) {
          if (c.mode === "friend" && near && d < 6 && d > 1.2 && Math.random() < 0.7) {
            c.dir = Math.atan2(dz, -dx);
            c.walk = Math.min(2.5, d / 0.6);
          } else {
            c.dir += (Math.random() - 0.5) * 2.4;
            c.walk = Math.random() < 0.3 ? 0 : 1 + Math.random() * 2;
          }
          c.wait = c.walk + 1 + Math.random() * 2.5;
        }
        if (c.walk > 0) { c.walk -= dt; want = 0.6; }
        if (c.x < ROAM.x0 + 0.5 || c.x > ROAM.x1 - 0.5 || c.z < ROAM.z0 + 0.3 || c.z > ROAM.z1 - 0.3) {
          c.dir = Math.atan2(-((ROAM.z0 + ROAM.z1) / 2 - c.z), (ROAM.x0 + ROAM.x1) / 2 - c.x);
        }
      }
    }
    stepBody(c, want, dt, area);
  }
  /* de noite, a Mina e a Jiji brincam de pega-pega no terreno vazio: quem
     encosta passa a vez; às vezes as duas param, se encaram e recomeçam */
  const PLAY = { chaser: "jiji", pause: 0, freeze: 0, cd: 0, rest: 6 };
  function jijiPlays() {
    const j = CATS.jiji;
    if (!night || CATS.mina.mode !== "zoom" || !inVac(j.x, j.z)) return false;
    return j.mode === "wander" || j.mode === "friend" || (j.mode === "wary" && !(started && cat.lying && Math.hypot(j.x - cat.x, j.z - cat.z) < 3.2));
  }
  function playTick(dt) {
    const m = CATS.mina, j = CATS.jiji;
    if (PLAY.pause > 0) PLAY.pause -= dt;
    if (PLAY.freeze > 0) PLAY.freeze -= dt;
    PLAY.cd -= dt;
    if (!jijiPlays() || busy(m) || busy(j)) return;
    PLAY.rest -= dt;
    if (PLAY.rest <= 0 && PLAY.pause <= 0) { PLAY.pause = 0.9 + Math.random() * 0.8; PLAY.rest = 5 + Math.random() * 5; }
    const d = Math.hypot(m.x - j.x, m.z - j.z);
    /* uma não atravessa a outra */
    if (d < 0.26 && d > 1e-4) {
      const k = (0.26 - d) / 2, ux = (m.x - j.x) / d, uz = (m.z - j.z) / d;
      moveBody(m, m.x + ux * k, m.z + uz * k);
      moveBody(j, j.x - ux * k, j.z - uz * k);
    }
    if (d < 0.36 && PLAY.cd <= 0) {
      /* pegou: a outra conta até três, e a pega sai correndo */
      PLAY.chaser = PLAY.chaser === "jiji" ? "mina" : "jiji";
      PLAY.cd = 1.6;
      PLAY.freeze = 0.9;
      const tagged = PLAY.chaser === "mina" ? m : j;
      tagged.hop = 0.32;
      pop("dust", (m.x + j.x) / 2, Math.max(m.y, j.y) + 0.04, (m.z + j.z) / 2, 0.7);
      if (Math.random() < 0.55) { tagged.say = 0.8; catVoice("mrrp", tagged.voice, 0.12); }
    }
  }
  function stepCats(dt) {
    playTick(dt);
    for (const id in CATS) {
      const c = CATS[id];
      c.t += dt;
      if (c.say > 0) c.say -= dt;
      if (id === "mina") {
        if (c.mode === "sit" && !dlg.open && !night) { c.wake -= dt; if (c.wake <= 0) c.mode = "sleep"; }
        minaAI(c, dt);
      }
      if (id === "jiji") jijiAI(c, dt);
    }
    /* a Mike, lá de cima, reage quando a Mina passa correndo */
    const mk = CATS.mike, mn = CATS.mina;
    if (night && mn.mode === "zoom" && Math.hypot(mk.x - mn.x, mk.z - mn.z) < 1.6 && mk.say <= 0 && Math.random() < dt * 1.5) { mk.say = 1.0; catVoice("mrrp", mk.voice, 0.1); }
    /* ninguém atravessa ninguém: o gato é empurrado de leve para fora */
    for (const id in CATS) {
      const c = CATS[id];
      const dx = cat.x - c.x, dz = cat.z - c.z, d = Math.hypot(dx, dz);
      if (d < 0.24 && d > 1e-4 && Math.abs(cat.y - c.y) < 0.3) tryMove(cat.x + (dx / d) * (0.24 - d), cat.z + (dz / d) * (0.24 - d));
    }
  }

  /* ---------------------------------------------------------------------
     coisas para mexer: estante, almofadas, plantas, teclado, máquinas.
     Tudo inventado para o jogo; nada disso está nas fontes.
     --------------------------------------------------------------------- */
  const extras = { book: false, cats: false, vend: false, knead: false, view: false };
  function extra(k, text) {
    if (extras[k]) return;
    extras[k] = true;
    quietT = 0;
    if (text) say(text, Math.max(3.6, 2 + text.length / 26));
    chime();
    renderSide(true);
  }
  const timers = [];
  function later(sec, fn) { timers.push({ t: sec, fn }); }
  function stepTimers(dt) {
    for (let i = timers.length - 1; i >= 0; i -= 1) {
      timers[i].t -= dt;
      if (timers[i].t <= 0) { const fn = timers[i].fn; timers.splice(i, 1); fn(); }
    }
  }
  /* caminha no tablado, almofada no interpavimento, travesseiros, futons no vão */
  const KNEAD = [[1.55, PLAT, 5.85], [3.2, FL.mid, 3.0], [0.81, FL.bed + 0.4, 5.22], [0.81, FL.bed + 0.4, 5.82], [3.25, FL.low + 0.35, 0.7]].map(([x, y, z]) => ({ x: X(x), y, z: Z(z) }));
  const LAPTOP = { x: X(2.4), z: Z(2.975) };
  const DESK_Y = FL.g + 0.72;
  const VEND_FRONT = { x0: 9.28, x1: 10.22, z0: 8.55 + FZ, z1: 9.35 + FZ };
  const GACHA_FRONT = { x0: 6.48, x1: 7.62, z0: 11.8 + FZ, z1: 12.52 + FZ };
  const inRect = (r, x, z) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
  function nearShelf() {
    const a = lx(cat.x), b = lz(cat.z);
    return insideHouse(cat.x, cat.z) && a - CAT.R < SH.x1 + 0.06 && b > 1.45 && b < 6.16 && cat.y < CUT_MAX;
  }
  function findItem() {
    if (!started || dlg.open || viewMode) return null;
    if (nearNpc) return { label: "miar", run: () => talkTo(nearNpc) };
    if (!cat.grounded) return null;
    if (cat.y < 0.1 && inRect(VEND_FRONT, cat.x, cat.z)) return { label: "apertar", run: pressVending };
    if (cat.y < 0.1 && inRect(GACHA_FRONT, cat.x, cat.z)) return { label: "girar", run: turnGacha };
    if (toyP.placed && Math.hypot(cat.x - toyP.x, cat.z - toyP.z) < 0.42 && Math.abs(cat.y - toyP.y) < 0.25) return { label: toyP.playing ? "parar" : "tocar", run: () => toyPiano(false) };
    const kc = catNear();
    if (kc) return { label: "miar", run: () => talkTo(kc) };
    for (const k of KNEAD) if (Math.hypot(cat.x - k.x, cat.z - k.z) < 0.32 && Math.abs(cat.y - k.y) < 0.12) return { label: "amassar", run: knead };
    if (nearShelf()) return { label: "patinha", run: () => knockShelf(true) };
    if (cat.y < 0.3 && Math.hypot(cat.x - TREE.x, cat.z - TREE.z) < 0.5) return { label: "arranhar", run: scratchTree };
    for (const q of PLANTS) if (Math.hypot(cat.x - q.x, cat.z - q.z) < q.r + 0.27 && Math.abs(cat.y - q.y) < 0.3) return { label: "cheirar", run: sniff };
    return null;
  }

  /* livros com título, que caem de vez em quando: um easter egg, não a
     biblioteca dos moradores. Os sete aparecem primeiro, depois de vez em quando */
  /* os livros que caem têm título e autor, e uma frase própria sobre a
     história, sem inventar enredo; sad marca os mais tristes. São brincadeira
     do jogo, não a biblioteca dos moradores */
  const NAMED_BOOKS = [
    { t: "Babel", sn: "Kuang", a: "R. F. Kuang", c: 0x7a2b2f, sad: false, line: "Babel, da R. F. Kuang, desceu com Oxford e tudo. é aquele em que a prata funciona com o que se perde entre duas línguas, e um império inteiro se equilibra em cima dessa perda.", en: "Babel, by R. F. Kuang, came down with all of Oxford inside. it is the one where silver runs on what gets lost between two languages, and a whole empire balances on that loss." },
    { t: "Coraline", sn: "Gaiman", a: "Neil Gaiman", c: 0x2e3a5c, sad: false, line: "Coraline caiu aberto. na casa nova, uma portinha dá para outra casa igual, onde a Outra Mãe cozinha melhor, presta mais atenção e só pede uma coisinha em troca: botões no lugar dos olhos.", en: "Coraline landed open. in the new house, a little door leads to an identical one, where the Other Mother cooks better, pays more attention and asks for just one small thing: buttons for eyes." },
    { t: "The Nightmare Before Christmas", sn: "Burton", a: "Tim Burton", c: 0x26232b, sad: false, line: "escorregou The Nightmare Before Christmas, do Tim Burton, e com ele Jack Skellington, cansado de ser o rei do Halloween e decidido a fazer o Natal do jeito dele, que é mais ou menos como deixar o gato cuidando da estante.", en: "down slid The Nightmare Before Christmas, by Tim Burton, and with it Jack Skellington, tired of being king of Halloween and set on doing Christmas his own way, which is roughly like leaving the cat in charge of the bookshelf." },
    { t: "Arakawa Under the Bridge", sn: "Nakamura", a: "Hikaru Nakamura", c: 0x5f95bf, sad: false, line: "lá de cima veio Arakawa Under the Bridge, do Hikaru Nakamura: um herdeiro que jurou nunca dever nada a ninguém cai no rio, é salvo, e vai pagar a dívida morando debaixo da ponte, entre vizinhos que dizem ser um kappa e uma venusiana.", en: "down came Arakawa Under the Bridge, by Hikaru Nakamura: an heir who swore never to owe anyone anything falls into the river, gets rescued, and pays it back by living under the bridge, among neighbours who claim to be a kappa and a Venusian." },
    { t: "Beasts of Burden", sn: "Dorkin", a: "Evan Dorkin e Jill Thompson", ae: "Evan Dorkin and Jill Thompson", c: 0x6b3a2e, sad: false, line: "Beasts of Burden, de Evan Dorkin e Jill Thompson, abriu numa página em aquarela. em Burden Hill, quem cuida das assombrações do bairro são os cachorros e um gato de rua, sem que os donos percebam nada.", en: "Beasts of Burden, by Evan Dorkin and Jill Thompson, fell open on a watercolour page. in Burden Hill, the neighbourhood hauntings are handled by the dogs and a stray cat, and the owners never notice a thing." },
    { t: "Persépolis", sn: "Satrapi", te: "Persepolis", a: "Marjane Satrapi", c: 0x1f1d22, sad: true, line: "em preto e branco, no chão: Persépolis, da Marjane Satrapi. uma menina de Teerã cresce entre a revolução e a guerra, fala alto demais para a época, e os pais, com medo, a mandam sozinha para Viena aos catorze anos.", en: "in black and white, on the floor: Persepolis, by Marjane Satrapi. a girl in Tehran grows up between revolution and war, talks back too much for the times, and her frightened parents send her to Vienna alone at fourteen." },
    { t: "O Labirinto do Fauno", sn: "del Toro", te: "Pan’s Labyrinth: The Labyrinth of the Faun", a: "Guillermo del Toro e Cornelia Funke", ae: "Guillermo del Toro and Cornelia Funke", c: 0x3c5a45, sad: true, line: "O Labirinto do Fauno, de Guillermo del Toro e Cornelia Funke, caiu de capa para baixo. Espanha, 1944: Ofelia foge do padrasto, um capitão franquista, para as três tarefas de um fauno, e desta vez o conto de fadas não consegue proteger ninguém.", en: "Pan’s Labyrinth, by Guillermo del Toro and Cornelia Funke, fell face down. Spain, 1944: Ofelia escapes her stepfather, a Francoist captain, into a faun’s three tasks, and this time the fairy tale cannot protect anyone." },
    { t: "Terminal Boredom", sn: "Suzuki", a: "Izumi Suzuki", c: 0x8fb8c9, sad: true, line: "Terminal Boredom, da Izumi Suzuki, junta contos do Japão dos anos 1970 e 80: num deles os homens vivem trancados, em outro os jovens passam o dia olhando telas. ela morreu em 1986, sem ver o quanto tinha acertado.", en: "Terminal Boredom, by Izumi Suzuki, gathers stories from 1970s and 80s Japan: in one, men live locked away; in another, young people spend their days staring at screens. she died in 1986, without seeing how right she had been." },
    { t: "Heaven", sn: "Kawakami", a: "Mieko Kawakami", c: 0xd9a441, sad: true, line: "um livro fino bateu de lado: Heaven, da Mieko Kawakami. dois alunos de catorze anos, perseguidos na mesma escola, trocam bilhetes escondidos. é o livro mais triste da estante, e olha que a concorrência é forte.", en: "a slim book landed on its side: Heaven, by Mieko Kawakami. two fourteen-year-olds, bullied at the same school, trade secret notes. it is the saddest book on the shelf, and the competition is stiff." },
    { t: "Breasts and Eggs", sn: "Kawakami", a: "Mieko Kawakami", c: 0xe6b8a2, sad: true, line: "Breasts and Eggs, da Mieko Kawakami. a irmã chega de Osaka querendo seios novos, a sobrinha só conversa por um caderninho, e Natsuko, anos depois, pensa em ter um filho sozinha, sem saber direito a quem perguntar.", en: "Breasts and Eggs, by Mieko Kawakami. her sister arrives from Osaka wanting new breasts, her niece only talks through a little notebook, and Natsuko, years later, thinks about having a child on her own, not quite sure whom to ask." },
    { t: "My Year of Rest and Relaxation", sn: "Moshfegh", a: "Ottessa Moshfegh", c: 0xf0dfe3, sad: true, line: "My Year of Rest and Relaxation, da Ottessa Moshfegh: em Nova York, uma moça que tem tudo resolve dormir um ano inteiro, com os remédios de uma psiquiatra que receita qualquer coisa. o gato, que dorme dezesseis horas por dia sem ajuda, acha o método exagerado.", en: "My Year of Rest and Relaxation, by Ottessa Moshfegh: in New York, a young woman who has everything decides to sleep for a whole year, on pills from a psychiatrist who prescribes anything. the cat, who sleeps sixteen hours a day unaided, finds the method excessive." },
    { t: "The Secret History", sn: "Tartt", a: "Donna Tartt", c: 0x2b2b2b, sad: false, line: "a Donna Tartt avisa logo no começo de The Secret History que um grupo de alunos de grego matou um colega, e passa o resto do livro explicando, com muita neve e muito álcool, como aquilo pareceu razoável.", en: "Donna Tartt warns you right at the start of The Secret History that a group of Greek students killed a classmate, and spends the rest of the book explaining, with a lot of snow and a lot of alcohol, how that seemed reasonable." },
    { t: "The Lost Daughter", sn: "Ferrante", a: "Elena Ferrante", c: 0x3f6f8f, sad: true, line: "The Lost Daughter, da Elena Ferrante. de férias no litoral, Leda passa os dias olhando uma jovem mãe com a filha, lembra das filhas que um dia deixou, e esconde a boneca da menina sem saber explicar por quê.", en: "The Lost Daughter, by Elena Ferrante. on holiday by the sea, Leda spends her days watching a young mother with her daughter, remembers the daughters she once left, and hides the girl’s doll without being able to say why." },
    { t: "Pollyanna", sn: "Porter", a: "Eleanor H. Porter", c: 0xf2c14e, sad: false, line: "Pollyanna, da Eleanor H. Porter, a órfã que chega na casa de uma tia severa e ensina a cidade inteira o jogo do contente, até o dia em que ela mesma precisa jogar sem conseguir andar.", en: "Pollyanna, by Eleanor H. Porter, the orphan who moves in with a stern aunt and teaches the whole town the glad game, until the day she has to play it herself, unable to walk." },
    { t: "Kitchen", sn: "Yoshimoto", a: "Banana Yoshimoto", c: 0x9fc9a8, sad: true, line: "Kitchen, da Banana Yoshimoto. quando a avó morre, Mikage só consegue dormir encostada na geladeira, ouvindo o zumbido, e vai morar com Yuichi e Eriko, numa cozinha que não é a dela e aos poucos vira casa.", en: "Kitchen, by Banana Yoshimoto. when her grandmother dies, Mikage can only sleep against the fridge, listening to its hum, and moves in with Yuichi and Eriko, in a kitchen that is not hers and slowly becomes home." },
    { t: "Convenience Store Woman", sn: "Murata", a: "Sayaka Murata", c: 0x5aa9c9, sad: false, line: "Convenience Store Woman, da Sayaka Murata. há dezoito anos Keiko trabalha na mesma konbini, porque lá dentro existe um manual para ser gente, e do lado de fora todo mundo só quer saber quando ela vai se casar.", en: "Convenience Store Woman, by Sayaka Murata. for eighteen years Keiko has worked at the same konbini, because inside there is a manual for being a person, and outside everyone just wants to know when she will get married." },
    { t: "The Bell Jar", sn: "Plath", a: "Sylvia Plath", c: 0xb23a3a, sad: true, line: "The Bell Jar, da Sylvia Plath. Esther ganha um verão numa revista de Nova York, com tudo o que isso promete, e volta para casa sem conseguir dormir, ler nem escrever, como se o ar tivesse ficado preso debaixo de um vidro.", en: "The Bell Jar, by Sylvia Plath. Esther wins a summer at a New York magazine, with everything that promises, and comes home unable to sleep, read or write, as if the air had been trapped under glass." },
    { t: "A Certain Hunger", sn: "Summers", a: "Chelsea G. Summers", c: 0x8c1c2c, sad: false, line: "A Certain Hunger, da Chelsea G. Summers: da prisão, uma crítica de restaurantes escreve sobre os amantes que matou e cozinhou, com a mesma elegância das resenhas. o gato decide que a ração de hoje está ótima.", en: "A Certain Hunger, by Chelsea G. Summers: from prison, a restaurant critic writes about the lovers she killed and cooked, with the same elegance as her reviews. the cat decides today’s kibble is lovely." },
    { t: "Everyone in This Room Will Someday Be Dead", sn: "Austin", a: "Emily Austin", c: 0xf4a6a0, sad: true, line: "Everyone in This Room Will Someday Be Dead, da Emily Austin, tem o título mais honesto da estante. Gilda, ateia e com medo de tudo, procura terapia grátis numa igreja e sai de lá empregada, no lugar da recepcionista que acabou de morrer.", en: "Everyone in This Room Will Someday Be Dead, by Emily Austin, has the most honest title on the shelf. Gilda, an atheist afraid of everything, looks for free therapy at a church and walks out employed, replacing the receptionist who has just died." },
    { t: "Fleabag: The Scriptures", sn: "Waller-Bridge", a: "Phoebe Waller-Bridge", c: 0x1d2b4f, sad: false, line: "Fleabag: The Scriptures, os roteiros anotados pela Phoebe Waller-Bridge. ela passa a série inteira falando com quem assiste, e o único que percebe é um padre, o que complica bastante a vida dos dois.", en: "Fleabag: The Scriptures, the scripts annotated by Phoebe Waller-Bridge. she spends the whole series talking to the audience, and the only one who notices is a priest, which complicates things for both of them." },
    { t: "Girl, Interrupted", sn: "Kaysen", a: "Susanna Kaysen", c: 0xd8c3a5, sad: true, line: "Girl, Interrupted, da Susanna Kaysen. aos dezoito anos ela passa um ano e meio num hospital psiquiátrico perto de Boston e, muito tempo depois, lê o próprio prontuário tentando entender quem decidiu o que ela era.", en: "Girl, Interrupted, by Susanna Kaysen. at eighteen she spends a year and a half in a psychiatric hospital near Boston and, long afterwards, reads her own case file trying to understand who decided what she was." },
    { t: "Eileen", sn: "Moshfegh", a: "Ottessa Moshfegh", c: 0x6e7f5c, sad: true, line: "Eileen, da Ottessa Moshfegh. 1964, uma cidade gelada, um reformatório de meninos durante o dia e um pai alcoólatra à noite, e o plano de ir embora sempre marcado para a semana seguinte, até Rebecca chegar.", en: "Eileen, by Ottessa Moshfegh. 1964, a frozen town, a boys’ reformatory by day and an alcoholic father by night, and the plan to leave always set for next week, until Rebecca arrives." },
    { t: "Mistborn", sn: "Sanderson", a: "Brandon Sanderson", c: 0x4a4f5a, sad: false, line: "Mistborn, do Brandon Sanderson, se passa num império onde chove cinza e a névoa sobe toda noite. Vin, uma menina de rua, descobre que consegue engolir metal e queimá-lo por dentro, e uma quadrilha resolve usar isso para derrubar um deus.", en: "Mistborn, by Brandon Sanderson, is set in an empire where ash falls like rain and mist rises every night. Vin, a street girl, finds she can swallow metal and burn it inside her, and a gang of thieves decides to use that to overthrow a god." },
    { t: "Yumi and the Nightmare Painter", sn: "Sanderson", a: "Brandon Sanderson", c: 0xc75b7a, sad: false, line: "Yumi and the Nightmare Painter, do Brandon Sanderson. ela empilha pedras para agradar espíritos, ele pinta pesadelos para prendê-los, e um dia os dois começam a acordar um no corpo do outro, cada um bagunçando a rotina alheia.", en: "Yumi and the Nightmare Painter, by Brandon Sanderson. she stacks stones to please spirits, he paints nightmares to trap them, and one day they start waking up in each other’s bodies, each one messing up the other’s routine." },
    { t: "The Long Way to a Small, Angry Planet", sn: "Chambers", a: "Becky Chambers", c: 0x3b7d8c, sad: false, line: "The Long Way to a Small, Angry Planet, da Becky Chambers. Rosemary embarca numa nave que abre túneis no espaço, com uma tripulação de espécies que não se parecem em nada, e a viagem é longa o bastante para aquilo virar família.", en: "The Long Way to a Small, Angry Planet, by Becky Chambers. Rosemary boards a ship that punches tunnels through space, with a crew of species that look nothing alike, and the journey is long enough for them to become family." },
    { t: "The Hole", sn: "Oyamada", a: "Hiroko Oyamada", c: 0x7b8a4e, sad: true, line: "The Hole, da Hiroko Oyamada. Asahi larga o emprego, se muda para a casa ao lado da sogra, no interior, e num dia de calor segue um bicho escuro até cair num buraco que parece feito sob medida para ela.", en: "The Hole, by Hiroko Oyamada. Asahi quits her job, moves into the house next to her mother-in-law’s in the countryside, and on a hot day follows a dark animal until she falls into a hole that seems made to measure for her." },
  ];
  const namedDown = new Set();
  const bookT = (nb) => (LANG === "en" && nb.te) || nb.t;
  const bookA = (nb) => (LANG === "en" && nb.ae) || nb.a;
  const bookL = (nb) => (LANG === "en" ? nb.en : nb.line);
  /* cada livro tem a sua frase, com título e autoria dentro; quando um já
     caído cai de novo, a volta é curta */
  const BOOK_AGAIN = [
    (t) => $b(`${t} de novo. esse já sabe o caminho até o chão.`, `${t} again. this one knows its way to the floor by now.`),
    (t, a) => $b(`outra vez ${t}, de ${a}, agora aberto em outra página.`, `${t}, by ${a}, once more, open at a different page this time.`),
    (t) => $b(`${t} caiu mais uma vez. talvez só queira ser lido.`, `${t} fell once more. maybe it just wants to be read.`),
    (t, a) => $b(`lá vem ${t} de novo. ${a} ia gostar de tanta insistência.`, `here comes ${t} again. ${a} would appreciate the persistence.`),
  ];
  /* três livros tristes seguidos, e o gato pergunta. dezoito no chão, e alguém
     tem um padrão */
  const BOOK_SAD = [
    (l) => $b(`o gato olha os três últimos no chão, ${l}, e pergunta baixinho, sem saber bem para quem: tudo bem mesmo?`, `the cat looks at the last three on the floor, ${l}, and asks quietly, not quite sure whom: are you really okay?`),
    (l) => $b(`mais três tristes seguidos: ${l}. o gato senta do lado da pilha e pergunta de novo: tudo bem mesmo?`, `three more sad ones in a row: ${l}. the cat sits down by the pile and asks again: are you really okay?`),
    (l) => $b(`${l}. o gato encosta a cabeça na estante e fica um tempo ali. tudo bem mesmo, mesmo?`, `${l}. the cat rests its head against the shelf and stays there a while. really, truly okay?`),
  ];
  const BOOK_PATTERN = 18;
  let bookAgainN = 0, bookN = 0, sadRun = [], sadN = 0;
  const BOOKS_SECRET = 9;
  const joinNames = (xs) => xs.length > 1 ? `${xs.slice(0, -1).join(", ")} ${$b("e", "and")} ${xs[xs.length - 1]}` : xs.join("");
  function namedBook(nb) {
    const firstTime = !namedDown.has(nb.t);
    namedDown.add(nb.t);
    bookN += 1;
    const text = firstTime ? bookL(nb) : BOOK_AGAIN[bookAgainN++ % BOOK_AGAIN.length](bookT(nb), bookA(nb));
    if (!extras.book) extra("book");
    sayRead(text);
    if (nb.sad) sadRun.push(nb); else sadRun = [];
    /* a pergunta sobre os livros tristes foi retirada; fica só o padrão, no 18º livro */
    if (false) {
      const names = joinNames(sadRun.slice(-3).map((x) => x.sn));
      sadRun = [];
      sayRead(BOOK_SAD[sadN++ % BOOK_SAD.length](names), () => { catVoice("mew", 0.85); pop("heart", cat.x, cat.y + 0.4, cat.z, 1.2); }, true);
    }
    if (bookN === BOOK_PATTERN) sayRead($b("parece que alguém aqui tem um padrão...", "looks like someone around here has a pattern..."), null, true);
    if (firstTime && namedDown.size === BOOKS_SECRET) later(0.4, () => secret("livros", $b("nove livros diferentes no chão.", "nine different books on the floor.")));
  }
  /* a estante: um esbarrão ou uma patinha derrubam um livro */
  let shelfCd = 0, bumpT = 0, booksDown = 0;
  /* junto à geladeira, a estante guarda potes; perto do banho, toalhas; no resto, livros */
  function shelfZone(b, y0, y1) { return b <= 2.15 && y0 >= FL.k - 0.05 && y1 <= FL.bath - 0.2 ? "kitchen" : b <= 2.9 && y0 >= FL.bath - 0.1 && y1 <= FL.bath + 1.6 ? "bath" : "books"; }
  function knockShelf(byPaw) {
    if (shelfCd > 0) return;
    shelfCd = 1.6;
    if (byPaw) cat.paw = 0.5;
    const b = lz(cat.z);
    /* o livro vem da prateleira logo acima da cabeça: cai por cima do gato */
    const k = Math.min(22, Math.max(0, Math.floor((cat.y + 0.3 - FL.g) / SH.pitch) + 1));
    const y0 = shelfY(k), y1 = y0 + SH.pitch - 0.025;
    const zone = shelfZone(b, y0, y1);
    if (zone === "kitchen") { tink(0.5); say("potes de vidro na prateleira. melhor não.", 2.6); return; }
    const kind = zone === "bath" ? "towel" : "book";
    /* cada livro que cai tem título: primeiro os que ainda não caíram, em
       ordem aleatória; depois, qualquer um */
    let title = null;
    if (kind === "book") {
      const left = NAMED_BOOKS.filter((nb) => !namedDown.has(nb.t));
      const pool = left.length ? left : NAMED_BOOKS;
      title = pool[(Math.random() * pool.length) | 0];
    }
    const d = spawnDrop(kind, X(SH.x1 - 0.1), y0 + 0.13, cat.z + (Math.random() - 0.5) * 0.12, 1.6 + Math.random() * 0.4, 0.8, (Math.random() - 0.5) * 0.4, title ? title.c : null);
    if (title) { d.title = title; namedBook(title); }
    d.slide = 0.1;
    if (kind === "towel") { say("uma toalha caiu da prateleira do banho. o gato não sabe de nada.", 2.6); return; }
    flutter();
    booksDown += 1;
    NPC.masato.react = 2.6;
  }

  /* almofadas, cama do gato, travesseiros: pãozinho */
  function knead() {
    cat.lying = false;
    cat.knead = 2.4;
    purr(2.3);
    pop("heart", cat.x, cat.y + 0.42, cat.z, 1.2);
    extra("knead", "o gato faz pãozinho na almofada, com a cara séria de quem está trabalhando.");
  }
  let sniffCd = 0, sniffN = 0;
  const SNIFF = ["atchim!", "cheiro de folha.", "cheiro de terra molhada."];
  function sniff() {
    if (sniffCd > 0) return;
    sniffCd = 2.2;
    cat.sniff = 0.7;
    sneeze();
    say(SNIFF[sniffN % SNIFF.length], 2.4);
    sniffN += 1;
    later(0.4, () => pop("dust", cat.x + Math.cos(cat.face) * 0.22, cat.y + 0.26, cat.z - Math.sin(cat.face) * 0.22, 0.6));
  }
  const KEYS_TXT = ["na tela do Masato: kkkkkkkkkkkkkkkkkkkkk", "na tela do Masato: ççççççççççççç", "na tela do Masato: pppppppp enviar? s"];
  let keysN = 0;

  /* as máquinas: sem moeda, nada; embaixo da de bebidas, uma surpresa */
  const VEND = { yen: 0, found: false, tries: 0, cans: 0, caps: 0 };
  const DRINKS = [["uma lata de chá de cevada gelado", 0xc8a86a], ["um café com leite em lata", 0x8a5a36], ["um refrigerante de melão", 0x6fae5b], ["uma sopa de milho quentinha, em lata", 0xf2d27a], ["uma água com gás de pêssego", 0xf2b1a1]];
  const CAPSULES = ["um gatinho de vinil dormindo", "uma casinha de concreto em miniatura", "um pianinho de brinquedo de nove teclas", "um chaveiro de onigiri", "um bilhete escrito: “cuidado, gato!”", "uma máquina de bebidas do tamanho de um dedo"];
  const CAP_COLS = [0xe8766b, 0x9cc3e6, 0xf29e4c, 0xf2d27a, 0x9fd6c2, 0xb59ad8];
  function pressVending() {
    cat.reach = 0.8;
    cat.lying = false;
    cat.face = Math.PI / 2;
    if (VEND.yen >= 130) {
      VEND.yen -= 130;
      const [name, col] = DRINKS[VEND.cans % DRINKS.length];
      VEND.cans += 1;
      beep();
      later(0.35, () => { clunk(); spawnDrop("can", 9.55 + Math.random() * 0.25, G_LOT + 0.25, 8.62 + FZ, (Math.random() - 0.5) * 0.5, 0.2, 0.9 + Math.random() * 0.3, col); });
      later(1.0, () => { coinSnd(); say($b(`caiu ${name}. troco: ${VEND.yen} ienes.`, `out comes ${$t(name)}. change: ${VEND.yen} yen.`), 3.4); });
      later(4.3, () => say("a máquina diz: “arigatō gozaimashita!”", 2.8));
      later(1.2, () => extra("vend"));
      return;
    }
    if (!VEND.found && VEND.tries >= 1) {
      VEND.found = true;
      VEND.yen += 500;
      cat.reach = 0;
      cat.peek = 1.1;
      later(0.6, () => { coinSnd(); say("embaixo da máquina, uma moeda de 500 ienes. achado não é roubado. (é um pouquinho.)", 3.6); });
      return;
    }
    VEND.tries += 1;
    beep();
    say(VEND.found ? "acabou a moeda. sem ela, a máquina só fica te olhando." : "o botão acende, mas sem moeda não sai nada. às vezes alguém deixa cair troco embaixo das máquinas…", 3.2);
  }
  function turnGacha() {
    cat.reach = 0.8;
    cat.lying = false;
    cat.face = -Math.PI / 2;
    if (VEND.yen >= 100) {
      VEND.yen -= 100;
      const item = CAPSULES[VEND.caps % CAPSULES.length];
      VEND.caps += 1;
      ratchet();
      later(0.55, () => spawnDrop("capsule", 6.64 + (VEND.caps % 2) * 0.54, G_LOT + 0.2, 12.46 + FZ, (Math.random() - 0.5) * 0.3, 0.35, -0.9, CAP_COLS[VEND.caps % CAP_COLS.length]));
      later(1.1, () => say($b(`saiu uma cápsula: ${item}. restam ${VEND.yen} ienes.`, `a capsule comes out: ${$t(item)}. ${VEND.yen} yen left.`), 3.8));
      if (item.indexOf("casinha") >= 0) later(4.6, wearHouse);
      if (item.indexOf("pianinho") >= 0) later(4.6, () => toyPiano(true));
      later(1.2, () => extra("vend"));
      return;
    }
    tink(0.4);
    say(VEND.found ? "acabaram as moedas de 100." : "a máquina de cápsulas pede moedas de 100 ienes. alguém por aqui deve ter troco…", 3.4);
  }

  /* ---------------------------------------------------------------------
     segredos: a casa na testa do gato (猫の額), a estrela cadente, a caixa
     de papelão, o maneki-neko no alto da estante, a borboleta no nariz e
     a chuva de pétalas. Tudo inventado para o jogo
     --------------------------------------------------------------------- */
  const secrets = { hitai: false, star: false, caixa: false, maneki: false, borboleta: false, petalas: false, livros: false, sino: false, pianinho: false };
  const N_SECRETS = Object.keys(secrets).length;
  /* a casinha de três andares, de telhado de duas águas, que o gato equilibra */
  const hitaiHouse = (() => {
    const g = new THREE.Group();
    const P = [];
    P.push(part("rbx1", 0.064, 0.112, 0.074, 0xf5efe4, 0, 0.056, 0));
    for (const y of [0.038, 0.075]) P.push(part("rbx1", 0.068, 0.006, 0.078, 0xd7cab4, 0, y, 0));
    P.push(part("prism3", 0.084, 0.05, 0.094, 0x3f5f8f, 0, 0.135, 0));
    P.push(part("rbx1", 0.013, 0.03, 0.013, 0x9aa1ab, -0.016, 0.152, 0.024));
    P.push(part("rbx1", 0.007, 0.034, 0.022, 0x8a5a36, 0.032, 0.018, 0));
    P.push(part("sph", 0.003, 0.003, 0.003, 0xe8b64c, 0.037, 0.017, 0.007));
    for (const y of [0.057, 0.094]) {
      for (const zz of [-0.018, 0.018]) P.push(part("box", 0.004, 0.02, 0.018, 0xffffff, 0.031, y, zz), part("box", 0.005, 0.014, 0.012, 0xffd98a, 0.032, y, zz));
      for (const s of [-1, 1]) P.push(part("box", 0.02, 0.02, 0.004, 0xffffff, 0, y, s * 0.036), part("box", 0.014, 0.014, 0.005, 0xffd98a, 0, y, s * 0.037));
    }
    P.push(part("sph", 0.009, 0.009, 0.004, 0xffd98a, 0, 0.128, 0.047));
    g.add(mergeParts(P));
    g.position.set(0.0, 0.07, 0);
    g.scale.setScalar(1.65);
    g.rotation.z = 0.08;
    g.visible = false;
    me.head.add(g);
    g.traverse((o) => { if (o.isMesh) o.renderOrder = 2; });
    return g;
  })();
  /* o caderninho: cada segredo tem uma pista vaga até ser achado; o que já foi
     achado fica guardado neste navegador (se ele deixar) */
  const SECRET_INFO = {
    hitai: { name: "猫の額: a casa na testa", hint: "uma das cápsulas da máquina da calçada traz uma casinha de concreto." },
    star: { name: "a estrela cadente", hint: "cochile de noite na luz do norte, no interpavimento." },
    caixa: { name: "a caixa de papelão", hint: "no térreo, junto à parede norte, tem uma caixa de papelão." },
    maneki: { name: "o maneki-neko", hint: "suba a escada de marinheiro e pule os degraus de gato da estante até o último." },
    borboleta: { name: "a borboleta no nariz", hint: "de dia, deite no terreno vazio e espere." },
    petalas: { name: "a chuva de pétalas", hint: "no teclado, digite ↑ ↑ ↓ ↓ ← → ← →." },
    livros: { name: "nove livros no chão", hint: "derrube nove livros diferentes da estante." },
    sino: { name: "o sino de templo", hint: "de noite, deite no terraço e espere." },
    pianinho: { name: "o pianinho", hint: "uma das cápsulas da máquina da calçada traz um pianinho de brinquedo." },
  };
  const SEEN_KEY = "neko-frame-segredos";
  /* tudo recomeça a cada visita: objetivos, extras e segredos. O registro
     antigo do caderninho, de versões anteriores, é apagado */
  try { window.localStorage.removeItem(SEEN_KEY); } catch (err) { /* sem armazenamento */ }
  const seenBefore = new Set();
  function saveSeen() { /* nada é guardado entre visitas */ }
  function renderNotebook() {
    let n = 0;
    $("nk-notebook").innerHTML = Object.keys(secrets).map((k) => {
      const got = secrets[k] || seenBefore.has(k);
      if (got) n += 1;
      const I = SECRET_INFO[k];
      return `<li data-secret="${k}"${got ? ' class="done"' : ""}>${got ? esc($t(I.name)) : `<span class="nk-hint">${esc($t(I.hint))}</span>`}</li>`;
    }).join("");
    $("nk-secret-n").textContent = `${n}/${N_SECRETS}`;
  }
  function secret(k, text) {
    if (secrets[k]) return;
    secrets[k] = true;
    seenBefore.add(k);
    saveSeen();
    renderNotebook();
    if (text) say(text, text.length > 110 ? 7.5 : 5);
    chime();
    later(0.25, chime);
  }
  function wearHouse() {
    hitaiHouse.visible = true;
    pop("heart", cat.x, cat.y + 0.55, cat.z, 1.4);
    secret("hitai", "猫の額, neko no hitai: “testa de gato”, o jeito japonês de dizer que um terreno é minúsculo. agora tem uma casinha equilibrada nela.");
  }
  let starCd = 0;
  function shootingStar() {
    if (starCd > 0) return;
    starCd = 20;
    const el = $("nk-star");
    el.classList.remove("go");
    void el.offsetWidth;
    el.classList.add("go");
    tone(2093, 2093, 0.5, "sine", 0.02, 0.2);
    tone(3136, 3136, 0.7, "sine", 0.014, 0.35);
    later(0.9, () => secret("star", "uma estrela cadente passa pela fresta de vidro da parede norte. o gato faz um pedido. (é churu.)"));
  }
  const inBox = () => { const a = lx(cat.x), b = lz(cat.z); return a > BOXC.a0 + 0.02 && a < BOXC.a1 - 0.02 && b > BOXC.b0 + 0.02 && b < BOXC.b1 - 0.02 && cat.y < FL.g + 0.05; };
  /* o maneki-neko no último degrau de gato da estante */
  const maneki = (() => {
    const g = new THREE.Group();
    g.add(mergeParts([
      part("ico1", 0.045, 0.05, 0.042, 0xfbf8f1, 0, 0.05, 0), part("ico1", 0.04, 0.036, 0.042, 0xfbf8f1, 0.004, 0.115, 0),
      part("cone4", 0.012, 0.02, 0.012, 0xfbf8f1, -0.004, 0.152, -0.022), part("cone4", 0.012, 0.02, 0.012, 0xfbf8f1, -0.004, 0.152, 0.022),
      part("box", 0.05, 0.008, 0.07, 0xd24a3f, 0.004, 0.085, 0), part("ico1", 0.009, 0.009, 0.009, 0xe8b64c, 0.04, 0.08, 0),
      part("box", 0.004, 0.008, 0.006, 0x2a2830, 0.04, 0.12, -0.014), part("box", 0.004, 0.008, 0.006, 0x2a2830, 0.04, 0.12, 0.014),
      part("ico1", 0.028, 0.02, 0.022, 0xe8b64c, 0.03, 0.03, 0.022),
    ]));
    const paw = new THREE.Group();
    paw.position.set(0.02, 0.1, -0.03);
    paw.add(part("cyl6", 0.012, 0.045, 0.012, 0xfbf8f1, 0, 0.022, 0));
    g.add(paw);
    g.traverse((o) => { if (o.isMesh) o.material = M.catClip; });
    const [s0, s1, top] = CAT_STEPS[CAT_STEPS.length - 1];
    g.position.set(X(0.3), top, Z((s0 + s1) / 2));
    g.rotation.y = 0;
    scene.add(g);
    return { g, paw, wave: 0 };
  })();
  /* o pianinho de brinquedo, da máquina de cápsulas. As peças estão em
     assets/pieces.js, tiradas de partituras em domínio público: Chopin,
     Noturno op. 9 n.º 2, e Liszt, La Campanella. O pianinho tem nove teclas,
     mas o gato toca com as duas mãos e com a extensão toda: é um gato. */
  const toyP = (() => {
    const g = new THREE.Group();
    const body = [
      part("box", 0.11, 0.07, 0.23, 0xd9534a, 0, 0.035, 0),
      part("box", 0.035, 0.07, 0.23, 0x2f3f6b, -0.04, 0.1, 0),
      part("box", 0.012, 0.03, 0.2, 0xf6e7c8, -0.02, 0.115, 0),
      part("sph", 0.012, 0.012, 0.012, 0xe8b64c, 0.056, 0.05, 0.1),
    ];
    for (const z of [-0.1, 0.1]) body.push(part("cyl8", 0.016, 0.03, 0.016, 0x2f3f6b, -0.03, -0.012, z));
    const m = mergeParts(body);
    m.material = M.pet;
    g.add(m);
    const keys = [];
    for (let k = 0; k < 9; k += 1) {
      const key = part("box", 0.05, 0.012, 0.021, 0xfbf8f1, 0.028, 0.075, (k - 4) * 0.0235);
      key.material = M.pet;
      key.userData.t = 0;
      g.add(key);
      keys.push(key);
    }
    g.visible = false;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    return { g, keys, placed: false, playing: false, x: 0, y: 0, z: 0 };
  })();
  /* timbre de piano de verdade, macio: parciais com um pouco de
     inarmonicidade, ataque curto, brilho que se apaga primeiro e um toque de
     martelo; as notas soam por cima umas das outras, como com pedal */
  function pianoNote(hz, delay, hold, vel, dest) {
    const a = fxCtx();
    if (!a) return;
    const t = a.currentTime + (delay || 0), v = vel || 1;
    const lp = a.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(9000, hz * 8), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(900, hz * 2.4), t + 0.8);
    const out = a.createGain();
    out.gain.value = 1;
    lp.connect(out).connect(dest || SND.fx);
    const ring = Math.min(3.2, 1.1 + hold * 0.9);
    const P = [[1, 0.62, 1.15], [2, 0.3, 0.7], [3, 0.12, 0.45], [4, 0.07, 0.3], [5, 0.035, 0.22], [6, 0.02, 0.16]];
    for (const [n, amp, tau] of P) {
      const f = hz * n * Math.sqrt(1 + 0.00035 * n * n);
      for (const det of n === 1 ? [-1.2, 1.2] : n === 2 ? [0.6] : [0]) {
        const o = a.createOscillator(), g = a.createGain();
        o.type = "sine";
        o.frequency.value = f * Math.pow(2, det / 1200);
        const peak = (amp * 0.095 * v) / (n === 1 ? 2 : 1);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(peak, t + 0.006);
        g.gain.setTargetAtTime(peak * 0.35, t + 0.006, tau * 0.18);
        g.gain.setTargetAtTime(0.0001, t + 0.12, tau * (0.55 + hold * 0.12));
        o.connect(g).connect(lp);
        o.start(t);
        o.stop(t + ring + 0.2);
      }
    }
    noiseHit(delay || 0, 0.02, "bandpass", Math.min(4200, hz * 3.2), 1.1, 0.01 * v, 0.001);
  }
  /* som de pianinho de brinquedo: cada nota é uma palheta de metal batida,
     com a fundamental redonda, um pouco do segundo harmônico e um brilho
     metálico bem baixo, que some rápido; nada de agudo estridente. As notas
     graves sobem uma oitava, como num brinquedo de verdade, e as agudas
     decaem mais depressa. Reverb curto e um compressor leve por cima */
  const PSAMP = { bus: null };
  function pianoBus(a) {
    if (PSAMP.bus) return PSAMP.bus;
    const input = a.createGain();
    const comp = a.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.008; comp.release.value = 0.2;
    const conv = a.createConvolver();
    const len = Math.floor(a.sampleRate * 1.2), ir = a.createBuffer(2, len, a.sampleRate);
    for (let c = 0; c < 2; c += 1) {
      const d = ir.getChannelData(c);
      for (let k = 0; k < len; k += 1) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 4);
    }
    conv.buffer = ir;
    const wet = a.createGain(); wet.gain.value = 0.14;
    const dry = a.createGain(); dry.gain.value = 0.9;
    const tone2 = a.createBiquadFilter(); tone2.type = "highshelf"; tone2.frequency.value = 3000; tone2.gain.value = -6;
    input.connect(tone2);
    tone2.connect(dry).connect(comp);
    tone2.connect(conv).connect(wet).connect(comp);
    comp.connect(SND.fx);
    PSAMP.bus = input;
    return input;
  }
  function toyNote(midi, delay, hold, vel, dest, srcs) {
    const a = fxCtx();
    if (!a) return;
    while (midi < 48) midi += 12;
    const t = a.currentTime + Math.max(0, delay);
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const lp = a.createBiquadFilter();
    lp.type = "lowpass"; lp.Q.value = 0.4;
    lp.frequency.value = Math.min(3600, 700 + f * 2.6);
    lp.connect(dest || pianoBus(a));
    const dec = Math.max(0.28, Math.min(1.3, 1.5 - (midi - 60) * 0.035));
    const off = t + Math.max(0.09, Math.min(hold, dec * 1.4));
    const tine = midi > 84 ? 0.012 : 0.035;
    for (const [r, amp, type, k] of [[1, 0.5, "triangle", 1], [2, 0.1, "sine", 0.5], [4.2, tine, "sine", 0.18]]) {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type;
      o.frequency.value = f * r;
      const pk = amp * 0.13 * vel;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(pk, t + 0.006);
      g.gain.setTargetAtTime(0.0001, t + 0.006, (dec * k) / 3.2);
      g.gain.setTargetAtTime(0.0001, off, 0.07);
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(off + 0.5);
      if (srcs) srcs.push(o);
    }
  }
  const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const PIANO = { rachStep: 0, unlocked: false, asked: false, trivia: false, musPaused: false, sess: 0, cur: null, liszt: false };
  /* cada peça toca numa sessão própria, com um ganho só dela: interagir de
     novo com o pianinho encerra a sessão, e nada fica soando por cima. A
     trilha de fundo pausa na primeira peça e só volta alguns segundos depois
     da última, para não entrar entre uma peça e outra */
  function stopPiece() {
    const c = PIANO.cur;
    if (!c) return;
    PIANO.cur = null;
    PIANO.sess += 1;
    const a = SND.ctx;
    if (a && c.gain) {
      c.gain.gain.cancelScheduledValues(a.currentTime);
      c.gain.gain.setTargetAtTime(0, a.currentTime, 0.06);
      for (const src of c.srcs) { try { src.stop(a.currentTime + 0.4); } catch (err) { /* já parou */ } }
      later(0.6, () => { try { c.gain.disconnect(); } catch (err) { /* ok */ } });
    }
    toyP.playing = false;
    for (const k of toyP.keys) k.userData.t = 0;
    if (PIANO.last !== "rach") musicBack();
  }
  /* enquanto alguém mexe no pianinho, a trilha ambiente fica calada.
     Volta cinco segundos depois que a interação acaba; depois do Rach,
     só cinco segundos depois do "me pergunto o que seria..." */
  function pianoQuiet() {
    PIANO.qid = (PIANO.qid || 0) + 1;
    if (MUS.api && MUS.api.state.playing) { PIANO.musPaused = true; MUS.api.pause(false); }
  }
  function musicBack(sec, anyway) {
    const id = PIANO.qid = (PIANO.qid || 0) + 1;
    const tryBack = () => {
      if (id !== PIANO.qid) return;
      if (PIANO.cur || PIANO.seq || (dlg.open && !anyway)) { later(1, tryBack); return; }
      if (PIANO.musPaused && MUS.api && !MUS.off) { PIANO.musPaused = false; MUS.api.play(); }
    };
    later(sec || 5, tryBack);
  }
  function playPiece(key, onDone) {
    const P = window.NekoPieces && window.NekoPieces[key];
    if (!P) { if (onDone) onDone(); return; }
    stopPiece();
    const id = ++PIANO.sess;
    const sess = { id, gain: null, srcs: [], x: cat.x, z: cat.z };
    /* só vale a fala do Rach se a última peça tocada for ele */
    PIANO.last = key;
    if (key !== "rach") PIANO.rachSpot = null;
    PIANO.cur = sess;
    toyP.playing = true;
    PIANO.played = true;
    pianoQuiet();
    const go = () => {
      if (PIANO.sess !== id) return;
      const a = fxCtx();
      if (a) { sess.gain = a.createGain(); sess.gain.gain.value = 1; sess.gain.connect(pianoBus(a)); }
      const N = P.notes, endQ = Math.max(...N.map((n) => n[0] + n[2]));
      const ritFrom = endQ - (P.rit || 0);
      /* rallentando no fim: o tempo se alonga até 40% no último trecho */
      const time = (q) => q * P.q + (q > ritFrom ? ((q - ritFrom) * (q - ritFrom) / (2 * P.rit)) * 0.4 * P.q : 0);
      const bells = P.bells || [];
      let rh = 0;
      N.forEach(([q, m, d, h, v5]) => {
        const st = time(q) + 0.12 + (Math.random() - 0.5) * 0.01 + (h ? 0.006 : 0);
        let hold = time(q + d) - time(q);
        /* pedal: a mão esquerda soa até a troca de pedal seguinte */
        if (h === 1 && P.pedal) { const nb = Math.ceil((q + 1e-6) / P.pedal) * P.pedal; hold = Math.max(hold, time(nb) - time(q)); }
        else hold *= 1.08;
        let vel;
        if (bells.includes(m) && h === 0) vel = 0.36 + Math.random() * 0.05;
        else if (h === 0) vel = (d >= 1 ? 0.95 : 0.82) + Math.random() * 0.06;
        else vel = m < 48 ? 0.55 : 0.3 + Math.random() * 0.04;
        if (v5 != null) vel = v5 + (Math.random() - 0.5) * 0.05;
        if (sess.gain) toyNote(m, st, hold, vel, sess.gain, sess.srcs);
        if (h === 0) {
          const k = m % 9, n = rh;
          rh += 1;
          later(st, () => {
            if (PIANO.sess !== id) return;
            toyP.keys[k].userData.t = Math.min(0.14, hold * 0.8);
            cat.paw = Math.min(0.2, hold * 0.9);
            if (n % 6 === 0) pop("note", toyP.x, toyP.y + 0.25, toyP.z, 1.2);
          });
        }
      });
      later(time(endQ) + 2.2, () => {
        if (PIANO.sess !== id) return;
        PIANO.cur = null;
        toyP.playing = false;
        if (key !== "rach") musicBack();
        if (onDone) onDone();
      });
    };
    go();
  }
  /* curiosidade sobre o Liszt, uma vez por visita, depois do La Campanella */
  function lisztNote() {
    if (PIANO.liszt) return;
    PIANO.liszt = true;
    sayRead("o Liszt foi o primeiro “rockstar” do piano: as fãs brigavam pelas luvas dele. e mulherengo: fugiu com uma condessa casada.", null, true);
  }
  /* o gato vira para quem está do outro lado da tela */
  function faceCamera() { cat.face = Math.atan2(-Math.sin(az), Math.cos(az)); cat.lying = false; }
  const PIECE_OPTS = () => [
    { label: "Noturno op. 9 n.º 2", run: () => playPiece("noct") },
    { label: "La Campanella", run: () => playPiece("camp", lisztNote) },
    { label: "Concerto n.º 2, 3º mov.", run: playRach },
  ];
  /* o desafio. "sim" e "sim" dá La Campanella; "sim" e "não" dá o
     Rachmaninoff (Concerto n.º 2, 3º movimento, compassos 123 a 147) e um
     desabafo; "não" logo de cara não dá nada, e a pergunta volta na próxima
     vez. Respondido, o pianinho passa a mostrar o menu das três peças */
  function pianoChallenge() {
    faceCamera();
    openDialogue([
      { who: "narr", text: "(o gato olha pra câmera.)" },
      { who: "cat", text: "meow?", tr: "você gosta de um desafio?", ask: [
        { label: "sim", run: () => {
          cat.tilt = 2.2;
          openDialogue([{ who: "cat", text: "mrrp?", tr: "tem certeza?", ask: [
            { label: "sim", run: () => { PIANO.unlocked = true; faceToy(); playPiece("camp", lisztNote); } },
            { label: "não", run: () => { PIANO.unlocked = true; faceToy(); playRach(); } },
          ] }], null, null);
        } },
        { label: "não", run: () => musicBack() },
      ] },
    ], null, null);
  }
  /* o Rachmaninoff e o desabafo depois dele. Sem a partitura em pieces.js,
     o gato não toca de ouvido: pula direto para o desabafo */
  /* o fim do Rachmaninoff, em tom baixo: o gato olha para o pianinho, fala
     devagar, fica em silêncio, e só no fim olha para a câmera. Enquanto a
     sequência corre (PIANO.seq), X não abre nada por cima */
  function rachEnd() {
    PIANO.seq = true;
    faceToy();
    /* nada de aviso por cima: a fila esvazia e a tela fica limpa */
    msgQueue.length = 0; bookQueue.length = 0; resumeMsg = null; holdT = 0; msgTimer = 0;
    $("nk-msg").classList.remove("on");
    const done = () => { PIANO.seq = false; PIANO.rachSpot = { x: cat.x, z: cat.z }; };
    later(1.2, () => openDialogue([
      { who: "cat", text: "essa aqui é um tópico sensível.", quiet: true, mood: "sleepy" },
      { who: "cat", text: "bom... é impossível navegar em dois barcos ao mesmo tempo.", quiet: true, mood: "sleepy" },
      { who: "cat", text: "queimem os barcos.", quiet: true, mood: "sleepy" },
    ], done, null));
  }
  /* a história da música, no poste do fim da rua. Falas conferidas:
     Uccidere in silenzio, de Giuseppe Rolando (1972), música de Stelvio
     Cipriani; Valeria e Gianni são estudantes, ela engravida e os dois
     discutem se vão ter a criança (MYmovies, IMDb). Os detalhes da faixa
     vêm do próprio arquivo: 1 min 32 s, começa baixinho, cresce até perto
     de um minuto e depois se recolhe. Cada fala só passa com X */
  const STORY = { pole: false };
  function poleStory() {
    STORY.pole = true;
    PIANO.seq = true;
    for (const k in keys) keys[k] = false;
    cat.vx = cat.vz = 0;
    msgQueue.length = 0; holdT = 0; msgTimer = 0;
    $("nk-msg").classList.remove("on");
    const L = (t) => ({ who: "cat", text: t, quiet: true });
    openDialogue([L("tá ouvindo essa música?")], () => {
      later(1.6, () => openDialogue([
        L("é de Uccidere in silenzio, um filme italiano de 1972. a música é do Stelvio Cipriani."),
        L("Valeria e Gianni são estudantes e se apaixonam. quando ela engravida, os dois precisam decidir se vão ter a criança."),
        L("no fundo, é a trilha de uma criança que ainda não nasceu."),
        L("repara: ela começa quase num sussurro, vai crescendo devagar até perto de um minuto e depois se recolhe de novo."),
        L("a voz sem palavras pode ser ouvida quase como uma presença que existe antes de poder falar."),
        L("igual esse trabalho."),
      ], () => { PIANO.seq = false; }, null));
    }, null);
  }
  function playRach() {
    PIANO.rachSpot = null;
    PIANO.rachStep = 0;
    if (window.NekoPieces && window.NekoPieces.rach) {
      playPiece("rach", rachEnd);
      /* se o gato sair no meio, a música para e a frase do Rach vem na hora */
      if (PIANO.cur) PIANO.rachSpot = { x: cat.x, z: cat.z };
    } else later(0.6, rachEnd);
  }
  function faceToy() { cat.lying = false; cat.face = Math.atan2(-(toyP.z - cat.z), toyP.x - cat.x); }
  function afterNocturne() {
    secret("pianinho", "o pianinho toca o começo do Noturno op. 9 n.º 2, de Chopin.");
    if (!PIANO.trivia) { PIANO.trivia = true; sayRead("Chopin tinha uns 20 anos quando escreveu isso. o que eu tava fazendo com 20 anos mesmo...", null, true); }
  }
  /* o pianinho sai da cápsula e fica quieto no chão. A primeira vez que o
     gato mexe nele, toca o noturno; da segunda em diante, vem o desafio, até
     ele ser respondido; depois, o menu. Mexer durante uma peça para a peça */
  function toyPiano(first) {
    if (!toyP.placed) {
      const x = GACHA_FRONT.x0 - 0.3, z = (GACHA_FRONT.z0 + GACHA_FRONT.z1) / 2;
      const gy = groundAt(x, z, 1).y;
      Object.assign(toyP, { placed: true, x, z, y: isFinite(gy) ? gy : G_ST });
      toyP.g.position.set(toyP.x, toyP.y, toyP.z);
      toyP.g.rotation.y = Math.PI;
      toyP.g.visible = true;
      pop("dust", toyP.x, toyP.y + 0.05, toyP.z, 0.6);
    }
    if (first) { say("o pianinho sai da cápsula e para no chão, ao lado da máquina. X toca.", 3.6); return; }
    if (toyP.playing) { stopPiece(); return; }
    pianoQuiet();
    faceToy();
    if (PIANO.unlocked) { openDialogue([{ who: "cat", text: "mrrp?", tr: "qual?", ask: PIECE_OPTS() }], null, null); return; }
    if (!PIANO.playedNoct) { PIANO.playedNoct = true; playPiece("noct", afterNocturne); return; }
    pianoChallenge();
  }
  /* de noite, deitado no terraço: um sino de templo, longe */
  const templeT = { t: 0, cd: 0 };
  function templeBell() {
    const f = 98;
    noiseHit(0, 0.4, "lowpass", 520, 0.7, 0.045, 0.004);
    tone(f, f * 0.998, 7.5, "sine", 0.07);
    tone(f * 1.006, f * 1.004, 7.0, "sine", 0.045);
    tone(f * 2.0, f * 1.998, 5.2, "sine", 0.03);
    tone(f * 2.76, f * 2.75, 3.8, "sine", 0.018);
    tone(f * 5.4, f * 5.38, 2.2, "sine", 0.009);
    tone(f * 8.93, f * 8.9, 1.0, "sine", 0.005);
  }

  /* chuva de pétalas: a sequência ↑ ↑ ↓ ↓ ← → ← → */
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"];
  let konamiAt = 0;
  const PETAL = tex(32, 32, (g2, w, h) => {
    g2.clearRect(0, 0, w, h);
    g2.fillStyle = "#f7b8d3";
    g2.beginPath(); g2.ellipse(16, 16, 12, 7, 0.5, 0, Math.PI * 2); g2.fill();
    g2.fillStyle = "#fde3ee";
    g2.beginPath(); g2.ellipse(13, 14, 5, 2.5, 0.5, 0, Math.PI * 2); g2.fill();
  });
  PETAL.wrapS = PETAL.wrapT = THREE.ClampToEdgeWrapping;
  PETAL.repeat.set(1, 1);
  const petals = [];
  function petalRain() {
    for (let i = 0; i < 70; i += 1) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: PETAL, transparent: true, depthWrite: false, rotation: Math.random() * 6 }));
      sp.scale.set(0.09, 0.09, 1);
      sp.position.set(camT.x + (Math.random() - 0.5) * 8, camT.y + 0.4 + Math.random() * 3.6, camT.z + (Math.random() - 0.5) * 8);
      scene.add(sp);
      petals.push({ s: sp, life: 7 + Math.random() * 4, ph: Math.random() * 6, v: 0.35 + Math.random() * 0.3 });
    }
    tone(1760, 1760, 0.3, "sine", 0.02); tone(2217, 2217, 0.4, "sine", 0.016, 0.12); tone(2637, 2637, 0.6, "sine", 0.014, 0.24);
    later(1.2, () => secret("petalas", "↑ ↑ ↓ ↓ ← → ← →: chove pétala de cerejeira."));
  }
  /* pétalas que se soltam da cerejeira o tempo todo; X no tronco sacode */
  const treeFall = { t: 0 };
  function treePetal(burst) {
    const th = Math.random() * Math.PI * 2, k = Math.sqrt(Math.random());
    const x = TREE.x + Math.cos(th) * TREE.rx * k, z = TREE.z + Math.sin(th) * TREE.rz * k;
    const y = TREE.cy - TREE.ry * 0.4 + Math.random() * TREE.ry * (burst ? 1.2 : 0.6);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: PETAL, transparent: true, depthWrite: false, rotation: Math.random() * 6 }));
    sp.scale.set(0.075, 0.075, 1);
    sp.position.set(x, y, z);
    scene.add(sp);
    const v = (burst ? 0.5 : 0.28) + Math.random() * 0.2;
    petals.push({ s: sp, life: (y - G_LOT) / v, ph: Math.random() * 6, v, tree: true });
  }
  function treeTick(dt) {
    if (REDUCED || !started) return;
    treeFall.t -= dt;
    const n = petals.reduce((c, p) => c + (p.tree ? 1 : 0), 0);
    if (treeFall.t <= 0 && n < 26) { treeFall.t = 0.3 + Math.random() * 0.4; treePetal(false); }
  }
  let scratchCd = 0;
  function scratchTree() {
    if (scratchCd > 0) return;
    scratchCd = 2.4;
    cat.paw = 0.6;
    for (let i = 0; i < 34; i += 1) treePetal(true);
    noiseHit(0, 0.35, "bandpass", 1800, 0.8, 0.02, 0.05);
    noiseHit(0.12, 0.3, "highpass", 3200, 0, 0.012, 0.04);
  }
  function stepPetals(dt) {
    for (let i = petals.length - 1; i >= 0; i -= 1) {
      const p = petals[i];
      p.life -= dt;
      p.ph += dt * 2.2;
      p.s.position.y -= p.v * dt;
      p.s.position.x += Math.sin(p.ph) * 0.25 * dt;
      p.s.position.z += Math.cos(p.ph * 0.7) * 0.2 * dt;
      p.s.material.rotation += dt * 1.5;
      p.s.material.opacity = Math.min(1, p.life);
      if (p.life <= 0) { scene.remove(p.s); p.s.material.dispose(); petals.splice(i, 1); }
    }
  }
  /* a borboleta que pousa no nariz de quem cochila no terreno vazio */
  const perch = { t: 0, on: false, left: 0 };
  /* poças de luz no chão, de noite: poste, máquina de bebidas, spot da frente */
  const POOLS = [];
  function lightPool(x, y, z, sx, sz, color, op) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: GLOW_TEX, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.scale.set(sx, sz, 1);
    m.renderOrder = 2;
    scene.add(m);
    POOLS.push({ m, op });
  }
  lightPool(-5.5, G_ST + 0.012, STREET.z1 - 1.0, 4.2, 3.4, 0xffe7b8, 0.34);
  lightPool(9.75, G_ST + 0.012, LOT_D + 0.55, 2.2, 1.4, 0xbfe0ff, 0.22);
  lightPool(X(4.4), G_LOT + 0.012, Z(6.62), 2.0, 1.2, 0xffd6a0, 0.3);
  /* vaga-lumes no terreno vazio, de noite */
  const fireflies = [];
  for (let i = 0; i < 9; i += 1) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xe6ff9a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.set(0.16, 0.16, 1);
    scene.add(sp);
    fireflies.push({ s: sp, cx: LOT_W + 0.8 + Math.random() * 3.4, cz: 0.9 + Math.random() * (LOT_D - 1.8), ph: Math.random() * 20 });
  }
  function stepSecrets(t, dt) {
    /* a casinha balança na testa */
    if (hitaiHouse.visible) hitaiHouse.rotation.z = 0.08 + (REDUCED ? 0 : Math.sin(t * 2.3) * 0.05 + (cat.vy ? Math.max(-0.2, Math.min(0.2, -cat.vy * 0.02)) : 0));
    /* o maneki acena quando o gato chega ao último degrau */
    const [, , top] = CAT_STEPS[CAT_STEPS.length - 1];
    const up = cat.grounded && cat.on === "shelf" && Math.abs(cat.y - top) < 0.02;
    if (up && maneki.wave <= 0) { maneki.wave = 3; tink(0.8); later(0.4, () => secret("maneki", "no último degrau da estante, um maneki-neko acena com a pata.")); }
    if (maneki.wave > 0) { maneki.wave -= dt; maneki.paw.rotation.z = REDUCED ? 0.6 : 0.4 + Math.sin(t * 9) * 0.45; } else maneki.paw.rotation.z = 0.1;
    stepPetals(dt);
    /* as teclas do pianinho afundam quando tocadas */
    for (const key of toyP.keys) { if (key.userData.t > 0) key.userData.t -= dt; key.position.y = 0.075 - (key.userData.t > 0 ? 0.005 : 0); }
    /* o sino: deitado no terraço, de noite, um tempo quieto */
    if (templeT.cd > 0) templeT.cd -= dt;
    const upTop = cat.y > FL.r1 - 0.05 && lx(cat.x) > -0.3 && lx(cat.x) < 5.45 && lz(cat.z) > 4.35 && lz(cat.z) < 6.75;
    if (night && cat.lying && upTop && templeT.cd <= 0) templeT.t += dt; else templeT.t = 0;
    if (templeT.t > 4.5) {
      templeT.t = 0;
      templeT.cd = 45;
      templeBell();
      later(0.8, () => secret("sino", "um sino de templo, longe. no ano-novo, os templos tocam 108 vezes, uma pra cada desejo mundano do budismo. hoje tocou uma vez só, então dá pra um desejo. o gato já sabe qual."));
    }
    /* borboleta no nariz */
    const f = butterflies[0];
    if (!night && cat.lying && cat.on === "vacant") perch.t += dt; else perch.t = 0;
    if (perch.t > 4 && !perch.on) { perch.on = true; perch.left = 7; }
    if (perch.on) {
      perch.left -= dt;
      if (!cat.lying || perch.left <= 0 || night) { perch.on = false; perch.t = -3; }
      else if (perch.left < 5.5) secret("borboleta", "uma borboleta pousa no nariz do gato. ele fica vesgo e prende a respiração.");
    }
    f.perch = perch.on;
    /* vaga-lumes */
    for (const q of fireflies) {
      const u = t * 0.4 + q.ph;
      q.s.visible = night && !REDUCED;
      if (!q.s.visible) continue;
      q.s.position.set(q.cx + Math.sin(u * 0.9) * 0.7, G_LOT + 0.35 + Math.sin(u * 1.7) * 0.2, q.cz + Math.cos(u * 0.7) * 0.6);
      q.s.material.opacity = Math.max(0, Math.sin(u * 3.1 + q.ph)) * 0.9;
    }
  }

  /* ---------------------------------------------------------------------
     passeio guiado pelas sete lajes, com a cota do corte e uma legenda tirada
     das fontes; cotas das lajes desenhadas por cima da cena
     --------------------------------------------------------------------- */
  const STOPS = [
    { tag: "S1", a: 1.4, b: 3.2, face: 0, lvl: "−0,215", name: "Térreo", text: "Piso de tijolo, 21,5 cm abaixo do chão médio do terreno. A mesa serve para comer junto ou para um dos dois trabalhar. Entre a entrada e a mesa, a viga do eixo X2 aflora como uma faixa de tijolo a +0,10.", src: "corte e planta do 1階; Stirworld; foto do térreo" },
    { tag: "S2", a: 2.3, b: 1.35, face: 0, lvl: "+0,10", name: "Vão sob a cozinha", text: "Um vão embaixo da cozinha, com 2,05 m de piso a piso, fechado por tábuas de madeira. O uso dele não aparece nas fontes; no jogo, guarda futons e caixas.", src: "corte; foto do térreo" },
    { tag: "S3", a: 1.9, b: 1.45, face: Math.PI / 2, lvl: "+2,15", name: "Cozinha", text: "No fundo da casa, longe da rua e das aberturas. Bancada de metal sobre armários de madeira escura, e a janela comprida logo acima da pia.", src: "texto dos arquitetos na architecturephoto; Dezeen; foto do térreo; 東側立面図" },
    { tag: "S4", a: 4.1, b: 3.9, face: Math.PI, lvl: "+3,35", name: "Interpavimento", text: "Carvalho largo. A luz entra o dia todo por cima da parede norte, pelas frestas entre as placas. Daqui se veem a rua, a estante e o banho.", src: "texto e legendas da architecturephoto; foto do vazio" },
    { tag: "S5", a: 3.0, b: 5.2, face: Math.PI / 2, lvl: "+3,80", name: "Quarto", text: "45 cm acima do interpavimento e 1,6 m acima da cozinha, na frente, atrás do vidro da rua. Na foto do vazio, uma leitora lê numa poltrona de assento azul junto ao vidro.", src: "corte; Stirworld; foto do vazio" },
    { tag: "S6", a: 2.0, b: 1.35, face: 0, lvl: "+5,10", name: "Banho", text: "No fundo, por cima da cozinha e ao lado do vazio alto: banheira, chuveiro num box de vidro, pia e um lavabo no canto.", src: "planta do 2階; legendas da architecturephoto" },
    { tag: "S7", a: 2.4, b: 5.7, face: -Math.PI / 2, lvl: "+6,02", name: "Terraço", text: "Por cima do quarto, do lado da rua, com muretas baixas. Atrás, o vidro alto do vazio; em cima, a laje avança em balanço.", src: "corte; 西側立面図; #casa" },
  ];
  const TOUR_SEC = 9;
  function tourGo(i) {
    TOUR.i = (i + STOPS.length) % STOPS.length;
    const S2 = STOPS[TOUR.i];
    Object.assign(cat, { x: X(S2.a), y: levelOf(S2.tag) + 0.02, z: Z(S2.b), vy: 0, vx: 0, vz: 0, grounded: false, lying: false, face: S2.face, knead: 0, reach: 0, peek: 0 });
    TOUR.t = TOUR_SEC;
    $("nk-tour-k").textContent = `${TOUR.i + 1}/${STOPS.length} · ${$t(S2.name)} · ${numL(S2.lvl)} m`;
    $("nk-tour-t").textContent = $t(S2.text);
    $("nk-tour-src").textContent = `${$b("fonte", "source")}: ${$t(S2.src)}`;
    blip();
  }
  function tourStart() {
    if (!started) begin();
    if (dlg.open || TOUR.on) return;
    if (viewMode) setView(false);
    TOUR.saved = { x: cat.x, y: cat.y, z: cat.z, face: cat.face, levels: LEVELS.on };
    TOUR.on = true;
    setLevels(true);
    viewHTarget = ZOOMS[1];
    $("nk-tour-card").hidden = false;
    $("nk-tour").setAttribute("aria-pressed", "true");
    tourGo(0);
  }
  function tourEnd() {
    if (!TOUR.on) return;
    TOUR.on = false;
    const sv = TOUR.saved;
    if (sv) { Object.assign(cat, { x: sv.x, y: sv.y + 0.02, z: sv.z, vy: 0, vx: 0, vz: 0, grounded: false, face: sv.face }); setLevels(sv.levels); }
    viewHTarget = ZOOMS[zoomIdx];
    $("nk-tour-card").hidden = true;
    $("nk-tour").setAttribute("aria-pressed", "false");
  }
  function tourTick(dt) {
    if (!TOUR.on) return;
    TOUR.t -= dt;
    $("nk-tour-fill").style.width = `${Math.max(0, 1 - TOUR.t / TOUR_SEC) * 100}%`;
    if (TOUR.t <= 0) { if (TOUR.i >= STOPS.length - 1) tourEnd(); else tourGo(TOUR.i + 1); }
  }
  $("nk-tour").addEventListener("click", () => { if (TOUR.on) tourEnd(); else tourStart(); stage.focus({ preventScroll: true }); });
  $("nk-tour-prev").addEventListener("click", (e) => { e.stopPropagation(); tourGo(TOUR.i - 1); });
  $("nk-tour-next").addEventListener("click", (e) => { e.stopPropagation(); if (TOUR.i >= STOPS.length - 1) tourEnd(); else tourGo(TOUR.i + 1); });
  $("nk-tour-x").addEventListener("click", (e) => { e.stopPropagation(); tourEnd(); });

  /* cotas das lajes: o contorno de cada laje na sua altura, com a cota do
     corte ao lado; a laje do gato (ou a do passeio) fica em laranja */
  const LEVELS = { on: false, g: new THREE.Group(), lines: [], labels: {} };
  const LV_NAME = { S1: "térreo", S2: "vão sob a cozinha", S3: "cozinha", S4: "interpavimento", S5: "quarto", S6: "banho", S7: "terraço" };
  const LV_TXT = { S1: "−0,215", S2: "+0,10", S3: "+2,15", S4: "+3,35", S5: "+3,80", S6: "+5,10", S7: "+6,02" };
  const LV_INK = new THREE.Color(INK), LV_HOT = new THREE.Color(0xf29e4c);
  function levelLabel(tag, hot) {
    const t = tex(320, 64, (g2, w, h) => {
      g2.clearRect(0, 0, w, h);
      /* a imagem final sai espelhada: o rótulo é desenhado ao contrário */
      if (MIRROR) { g2.translate(w, 0); g2.scale(-1, 1); }
      const txt = `${numL(LV_TXT[tag])} · ${$t(LV_NAME[tag])}`;
      g2.font = "700 26px Urbanist, Roboto, sans-serif";
      const tw = Math.min(w - 8, g2.measureText(txt).width + 30), x0 = (w - tw) / 2, x1 = x0 + tw;
      g2.fillStyle = hot ? "#f29e4c" : "rgba(16, 38, 74, .88)";
      g2.beginPath(); g2.moveTo(x0 + 20, 8); g2.arcTo(x1, 8, x1, 56, 22); g2.arcTo(x1, 56, x0, 56, 22); g2.arcTo(x0, 56, x0, 8, 22); g2.arcTo(x0, 8, x1, 8, 22); g2.closePath(); g2.fill();
      g2.fillStyle = "#fff"; g2.textBaseline = "middle"; g2.textAlign = "center"; g2.fillText(txt, w / 2, 33);
    });
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1);
    return t;
  }
  (function buildLevels() {
    const done = new Set();
    for (const [tag, a0, b0, a1, b1] of SLABS) {
      const y = levelOf(tag) + 0.015;
      const pts = [[a0, b0], [a1, b0], [a1, b1], [a0, b1], [a0, b0]].map(([a, b]) => new THREE.Vector3(X(a), y, Z(b)));
      const mat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.95, depthTest: false, clippingPlanes: [CLIP] });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
      line.renderOrder = 30;
      LEVELS.g.add(line);
      LEVELS.lines.push({ tag, line });
      if (!done.has(tag)) {
        done.add(tag);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: levelLabel(tag, false), transparent: true, depthTest: false, depthWrite: false, clippingPlanes: [CLIP] }));
        sp.position.set(X(a1) + 0.45, y + 0.12, Z((b0 + b1) / 2));
        sp.renderOrder = 31;
        LEVELS.g.add(sp);
        LEVELS.labels[tag] = { sp, hot: null };
      }
    }
    LEVELS.g.visible = false;
    scene.add(LEVELS.g);
  })();
  function setLevels(v) {
    LEVELS.on = !!v;
    LEVELS.g.visible = LEVELS.on;
    $("nk-levels").setAttribute("aria-pressed", LEVELS.on ? "true" : "false");
  }
  function relabelLevels() { for (const tag in LEVELS.labels) { const Lb = LEVELS.labels[tag]; Lb.sp.material.map.dispose(); Lb.sp.material.map = levelLabel(tag, Lb.hot); Lb.sp.material.needsUpdate = true; } }
  function levelsTick() {
    if (!LEVELS.on) return;
    let hot = null;
    if (TOUR.on) hot = STOPS[TOUR.i].tag;
    else if (catInside() || onTerrace(cat.y, cat.z)) hot = /^S[1-7]$/.test(cat.on) ? cat.on : zoneAt(lx(cat.x), lz(cat.z), cat.y);
    for (const { tag, line } of LEVELS.lines) line.material.color.copy(tag === hot ? LV_HOT : LV_INK);
    const k = viewH * 0.052;
    for (const tag in LEVELS.labels) {
      const Lb = LEVELS.labels[tag];
      const h2 = tag === hot;
      if (Lb.hot !== h2) { Lb.hot = h2; Lb.sp.material.map.dispose(); Lb.sp.material.map = levelLabel(tag, h2); Lb.sp.material.needsUpdate = true; }
      Lb.sp.scale.set(k * 5, k, 1);
    }
  }
  $("nk-levels").addEventListener("click", () => { if (!started) begin(); setLevels(!LEVELS.on); stage.focus({ preventScroll: true }); });

  /* ---------------------------------------------------------------------
     vista de longe: a casa inteira, fechadinha, sem corte
     --------------------------------------------------------------------- */
  let viewMode = false;
  const HOUSE_T = new THREE.Vector3(X(2.6), 3.8, Z(3.3));
  function setView(v) {
    if (v && !started) begin();
    viewMode = !!v;
    for (const k in keys) keys[k] = false;
    if (viewMode) {
      cat.lying = false;
      viewHTarget = stage.clientHeight < 440 ? 18 : 20;
      if (!extras.view) extra("view", "a casa inteira, fechadinha, de longe");
      else say("setas giram e aproximam · V volta", 3);
    } else {
      viewHTarget = ZOOMS[zoomIdx];
    }
    const b = $("nk-view");
    b.setAttribute("aria-pressed", viewMode ? "true" : "false");
    stage.classList.toggle("viewing", viewMode);
    renderSide(true);
  }
  function viewStep(dt) {
    const turn = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const zm = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    azTarget += turn * dt * 1.3 + (turn || zm || REDUCED ? 0 : dt * 0.12);
    if (zm) viewHTarget = Math.max(10, Math.min(32, viewHTarget + zm * dt * 10));
  }

  /* o mundo anda mesmo com diálogo aberto ou na vista de longe */
  function stepWorld(dt) {
    nudgeTick(dt);
    if (shelfCd > 0) shelfCd -= dt;
    if (sniffCd > 0) sniffCd -= dt;
    if (starCd > 0) starCd -= dt;
    if (scratchCd > 0) scratchCd -= dt;
    /* se o gato sai do lugar enquanto toca, a música para */
    if (PIANO.cur && Math.hypot(cat.x - PIANO.cur.x, cat.z - PIANO.cur.z) > 0.25) stopPiece();
    /* depois do Rachmaninoff: a 30 cm do lugar onde tocou, "também gosto do
       Rach."; a 1,5 m, "me pergunto o que seria...". E acabou */
    if (PIANO.rachSpot && PIANO.last === "rach" && !dlg.open && !PIANO.seq && PIANO.rachStep < 2) {
      const dr = Math.hypot(cat.x - PIANO.rachSpot.x, cat.z - PIANO.rachSpot.z);
      const catSays = (t) => { msgQueue.length = 0; $("nk-msg").classList.remove("on"); msgTimer = 0; openDialogue([{ who: "cat", text: t, quiet: true, mood: "sleepy" }], null, null); };
      if (!PIANO.rachStep && dr > 0.3) { PIANO.rachStep = 1; catSays("também gosto do Rach."); }
      else if (PIANO.rachStep === 1 && dr > 1.5) {
        PIANO.rachStep = 2; catSays("me pergunto o que seria...");
        /* cinco segundos depois, a trilha ambiente volta */
        musicBack(5, true);
      }
    }
    /* no poste de concreto do fim da rua, se a gravação do Cipriani estiver
       tocando, o gato para e fala dela. Uma vez por visita */
    if (!STORY.pole && started && !dlg.open && !PIANO.seq && !PIANO.cur && cat.y < 0.4
      && Math.hypot(cat.x + 5.5, cat.z - (STREET.z1 + 0.25)) < 1.3
      && MUS.api && MUS.api.state.playing && MUS.api.state.index === 0 && !MUS.api.state.file) poleStory();
    treeTick(dt);
    for (const k of ["paw", "reach", "peek", "sniff"]) if (cat[k] > 0) cat[k] -= dt;
    if (cat.knead > 0) {
      const before = cat.knead;
      cat.knead -= dt;
      if (Math.floor(before / 0.7) !== Math.floor(cat.knead / 0.7) && cat.knead > 0) pop("heart", cat.x, cat.y + 0.42, cat.z, 1.1);
    }
    if (NPC.masato.react > 0) NPC.masato.react -= dt;
    stepTimers(dt);
    stepCats(dt);
    stepStreet(dt);
    stepDrops(dt);
    stepFx(dt);
    stepSecrets(clockT, dt);
  }

  /* ---------------------------------------------------------------------
     entrada
     --------------------------------------------------------------------- */
  function jump() {
    if (!started || ended || dlg.open || viewMode) return;
    if (cat.knead > 0) cat.knead = 0;
    if (cat.lying) { cat.lying = false; return; }
    if (cat.climb) {
      /* espaço solta a escada: o gato cai de costas para ela */
      cat.climb = null;
      cat.vy = 1.2;
      cat.z = Z(LAD.bc - 0.08);
      cat.face = Math.PI / 2;
      return;
    }
    if (cat.grounded || cat.coyote > 0) doJump();
    else cat.buffer = PHYS.BUFFER;
  }
  function doJump() {
    const dir = testDir ? [testDir[0], testDir[1]] : inputDir();
    cat.hop = cat.grounded ? smartHop(dir[1]) : null;
    cat.vy = cat.hop ? cat.hop.vy : CAT.JUMP; cat.grounded = false; cat.coyote = 0; cat.buffer = 0; cat.held = true;
    if (cat.hop) { cat.vx = 0; cat.vz = 0; }
    stats.jumps += 1; hopSnd();
  }
  /* soltar o pulo cedo corta a subida: pulinho curto ou pulo inteiro */
  function jumpRelease() {
    cat.held = false;
    if (!cat.hop && !cat.climb && cat.vy > 0) cat.vy *= PHYS.CUT;
  }
  function inLight() {
    const a = lx(cat.x), b = lz(cat.z);
    return cat.on === "S4" && a > LIGHT.x0 - 0.05 && a < LIGHT.x1 + 0.05 && b > LIGHT.z0 - 0.05 && b < LIGHT.z1 + 0.05;
  }
  function act() {
    if (!started || ended) return;
    if (dlg.open) { advance(); return; }
    /* no silêncio entre as falas do fim do Rachmaninoff, X não faz nada */
    if (PIANO.seq) return;
    if (viewMode) { setView(false); return; }
    const it = findItem();
    if (it) { it.run(); renderSide(true); return; }
    if (!cat.grounded) return;
    cat.lying = !cat.lying;
    if (cat.lying) { catVoice("mew", 0.95); answerCats(); }
    if (cat.lying && inBox()) later(0.6, () => secret("caixa", "uma caixa de 40 × 40 cm, 0,16 m², menor que qualquer lote do corpus. o gato cabe direitinho."));
    if (cat.lying && night) once("nightNap", "um cochilo no escuro.", 2.6);
    if (cat.lying && inLight()) goal("light", $b(`cochilo na luz do norte, no interpavimento, a +${fmt(FL.mid - GL0, 2)} m`, `a nap in the north light, on the mezzanine, at +${fmt(FL.mid - GL0, 2)} m`));
    if (cat.lying && inLight() && night) later(1.2, shootingStar);
  }
  /* a caixa: deitado dentro dela, o gato ronrona enquanto ficar ali */
  const BOXP = { t: 0, n: 0, was: false, said: 0 };
  const BOX_SAY = [
    ["rrrrrrr. 0,16 m² e nenhuma reclamação.", "rrrrrrr. 0.16 m² and not a single complaint."],
    ["de volta à caixa. o ronrom começa antes de ele terminar de deitar.", "back in the box. the purring starts before he has finished lying down."],
    ["(o gato olha pra câmera.) perfeito.", "(the cat looks at the camera.) perfect."],
  ];
  function boxTick(dt) {
    const inside = started && !dlg.open && cat.lying && inBox();
    if (inside && !BOXP.was) {
      BOXP.t = 0.7;
      BOXP.n = 0;
      if (secrets.caixa) { const L = BOX_SAY[BOXP.said % BOX_SAY.length]; BOXP.said += 1; say($b(L[0], L[1]), 4.2); }
    }
    BOXP.was = inside;
    if (!inside) return;
    BOXP.t -= dt;
    if (BOXP.t <= 0) {
      /* no primeiro ronrom de cada entrada, o Masato para um segundo e a
         Tomoko olha para baixo, na direção da caixa */
      if (BOXP.n === 0) { NPC.masato.react = 1.2; TLOOK.t = 2.4; }
      purr(2.9);
      BOXP.t = 2.7;
      BOXP.n += 1;
      if (BOXP.n % 2 === 1) pop("heart", cat.x, cat.y + 0.32, cat.z, 1.1);
    }
  }
  function rotate(dir) { if (!dlg.open) azTarget += (MIRROR ? -dir : dir) * Math.PI / 2; }
  function zoom() {
    zoomIdx = (zoomIdx + 1) % ZOOMS.length;
    if (started) viewHTarget = ZOOMS[zoomIdx];
    $("nk-zoom").textContent = zoomIdx === ZOOMS.length - 1 ? "+" : "−";
  }
  function setSound(v) {
    SND.on = !!v;
    const b = $("nk-sound");
    b.classList.toggle("off", !SND.on);
    b.setAttribute("aria-pressed", SND.on ? "true" : "false");
    if (SND.fx) SND.fx.gain.setTargetAtTime(SND.on ? 1 : 0, SND.ctx.currentTime, 0.02);
    if (SND.on && started) ambStart();
  }
  function setNight(v) {
    night = !!v;
    const P = night ? NIGHT : DAY;
    hemi.color.setHex(P.hemiSky);
    hemi.groundColor.setHex(P.hemiGround);
    hemi.intensity = P.hemiI;
    key.color.setHex(P.keyC);
    key.intensity = P.keyI;
    for (const g of GLOWS) { g.m.color.copy(night ? g.night : g.day); g.m.opacity = night ? g.nightOpacity : g.dayOpacity; }
    poolKey = "";
    for (const q of POOLS) q.m.material.opacity = night ? q.op : 0;
    U.gloss.value = night ? 0.14 : 0.3;
    /* de noite, os olhos da Jiji devolvem a luz da rua (o brilho do fundo do olho) */
    for (const e of jijiFig.eyes) e.children[0].material = night ? M.eyeShine : M.cat;
    const u = comp.m.uniforms;
    u.uSkyTop.value.setHex(P.skyTop);
    u.uSkyBot.value.setHex(P.skyBot);
    u.uCloud.value.setHex(P.cloud);
    u.uHaze.value.setHex(P.haze);
    u.uHazeAmt.value = P.hazeAmt;
    u.uSat.value = P.sat;
    u.uTintS.value.set(...P.tintS);
    u.uTintL.value.set(...P.tintL);
    u.uNight.value = night ? 1 : 0;
    bright.m.uniforms.uThresh.value = P.thresh;
    fin.m.uniforms.uBloom.value = P.bloom;
    fin.m.uniforms.uVig.value = P.vig;
    stage.classList.toggle("night", night);
    if (started && !dlg.open) { const pool = night ? NIGHT_SAY : DAY_SAY; say(pool[(Math.random() * pool.length) | 0], 3.4); }
    const b = $("nk-night");
    b.textContent = night ? "☀" : "☾";
    b.setAttribute("aria-pressed", night ? "true" : "false");
    shadowKey = "";
  }

  const KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
  stage.addEventListener("keydown", (e) => {
    if (e.target !== stage) return;
    if (dlg.open) {
      if (["Space", "Enter", "KeyX", "NumpadEnter"].includes(e.code)) { e.preventDefault(); advance(); }
      else if (dlg.choices && /^(Digit|Numpad)[1-4]$/.test(e.code)) { e.preventDefault(); pick(Number(e.code.slice(-1)) - 1); }
      else if (dlg.choices && ["ArrowUp", "KeyW", "ArrowLeft", "KeyA"].includes(e.code)) { e.preventDefault(); moveChoice(-1); }
      else if (dlg.choices && ["ArrowDown", "KeyS", "ArrowRight", "KeyD"].includes(e.code)) { e.preventDefault(); moveChoice(1); }
      else if (KEYMAP[e.code]) e.preventDefault();
      return;
    }
    if (TOUR.on) {
      if (e.code === "ArrowRight" || e.code === "KeyD") { e.preventDefault(); if (TOUR.i >= STOPS.length - 1) tourEnd(); else tourGo(TOUR.i + 1); }
      else if (e.code === "ArrowLeft" || e.code === "KeyA") { e.preventDefault(); tourGo(TOUR.i - 1); }
      else if (e.code === "Escape" || e.code === "KeyT") { e.preventDefault(); tourEnd(); }
      else if (KEYMAP[e.code] || e.code === "Space") e.preventDefault();
      return;
    }
    if (e.code === "KeyT") { e.preventDefault(); tourStart(); return; }
    if (e.code === "KeyC") { e.preventDefault(); if (!started) begin(); setLevels(!LEVELS.on); return; }
    if (e.code === KONAMI[konamiAt]) { konamiAt += 1; if (konamiAt === KONAMI.length) { konamiAt = 0; if (started) petalRain(); } }
    else konamiAt = e.code === KONAMI[0] ? 1 : 0;
    if (e.code === "KeyV" || (e.code === "Escape" && viewMode)) { e.preventDefault(); setView(!viewMode); return; }
    if (e.code === "KeyP") { e.preventDefault(); toggleMusic(); return; }
    if (e.code === "BracketLeft" || e.code === "Minus" || e.code === "NumpadSubtract") { e.preventDefault(); setVolume(MUS.vol - 0.1); return; }
    if (e.code === "BracketRight" || e.code === "Equal" || e.code === "NumpadAdd") { e.preventDefault(); setVolume(MUS.vol + 0.1); return; }
    if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); if (!started) begin(); return; }
    if (e.code === "Space") { e.preventDefault(); if (!started) begin(); else jump(); return; }
    if (e.code === "KeyX" || e.code === "Enter") { e.preventDefault(); if (!started) begin(); else act(); return; }
    if (e.code === "KeyQ") { e.preventDefault(); rotate(-1); return; }
    if (e.code === "KeyE") { e.preventDefault(); rotate(1); return; }
    if (e.code === "KeyZ") { e.preventDefault(); zoom(); return; }
    if (e.code === "KeyN") { e.preventDefault(); setNight(!night); return; }
    if (e.code === "KeyH") { e.preventDefault(); giveHint(); return; }
    if (e.code === "KeyM") { e.preventDefault(); setSound(!SND.on); }
  });
  stage.addEventListener("keyup", (e) => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; if (e.code === "Space" && started && !dlg.open) jumpRelease(); });
  stage.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

  function begin() {
    if (started) return;
    started = true;
    azTarget = Math.PI / 4 + 2 * Math.PI * Math.round((az - Math.PI / 4) / (2 * Math.PI));
    viewHTarget = ZOOMS[zoomIdx];
    stage.classList.add("playing");
    $("nk-start").hidden = true;
    actx();
    ambStart();
    meow(1.05);
    startMusic();
    renderPlayer();
    say(MUS.off ? "X mexe nas coisas · V vê a casa de longe · P toca a música" : "X mexe nas coisas · V vê a casa de longe · P pausa a música", 4.4);
  }
  $("nk-start").addEventListener("click", () => { stage.focus({ preventScroll: true }); begin(); });
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".nk-pad, .nk-end, .nk-tools")) return;
    stage.focus({ preventScroll: true });
    if (dlg.open && e.target.closest(".nk-dlg, canvas")) { e.preventDefault(); advance(); }
  });
  $("nk-zoom").addEventListener("click", (e) => { e.stopPropagation(); zoom(); stage.focus({ preventScroll: true }); });
  $("nk-night").addEventListener("click", (e) => { e.stopPropagation(); setNight(!night); stage.focus({ preventScroll: true }); });
  $("nk-sound").addEventListener("click", (e) => { e.stopPropagation(); setSound(!SND.on); stage.focus({ preventScroll: true }); });
  $("nk-hint").addEventListener("click", (e) => { e.stopPropagation(); giveHint(); stage.focus({ preventScroll: true }); });
  $("nk-view").addEventListener("click", (e) => { e.stopPropagation(); setView(!viewMode); stage.focus({ preventScroll: true }); });

  /* ---------------------------------------------------------------------
     trilha: as músicas originais do atlas (assets/trilha.js) num mini player
     --------------------------------------------------------------------- */
  const store = {
    get(k, d) { try { const v = window.localStorage.getItem(k); return v == null ? d : v; } catch (err) { return d; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (err) { /* sem armazenamento: tudo bem */ } },
  };
  const volSaved = Number(store.get("nk-trilha-volume", "0.3"));
  const MUS = { api: null, auto: false, vol: isFinite(volSaved) ? Math.max(0, Math.min(1, volSaved)) : 0.3, off: store.get("nk-trilha", "on") === "off" };
  const TRK = window.NekoTrilha ? window.NekoTrilha.TRACKS : [];
  function music() {
    if (MUS.api) return MUS.api;
    const a = actx();
    if (!a || !window.NekoTrilha) return null;
    MUS.api = window.NekoTrilha.create(a, a.destination);
    MUS.api.setVolume(MUS.vol);
    MUS.api.onChange(renderPlayer);
    return MUS.api;
  }
  function startMusic() {
    if (MUS.off) { renderPlayer(); return; }
    const m = music();
    if (m) m.play(3);
  }
  function toggleMusic() {
    const m = music();
    if (!m) return;
    MUS.auto = false;
    if (m.state.playing) { m.pause(true); MUS.off = true; } else { m.play(); MUS.off = false; }
    store.set("nk-trilha", MUS.off ? "off" : "on");
  }
  function setVolume(v) {
    MUS.vol = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100;
    store.set("nk-trilha-volume", String(MUS.vol));
    if (MUS.api) MUS.api.setVolume(MUS.vol); else renderPlayer();
  }
  function skipTrack(dir) {
    const m = music();
    if (!m) return;
    if (dir > 0) m.next(); else m.prev();
    if (!m.state.playing) { m.play(); MUS.off = false; store.set("nk-trilha", "on"); }
  }
  function renderPlayer(st) {
    if (!st) {
      const t0 = TRK[0];
      st = MUS.api ? MUS.api.state : { playing: false, title: t0 ? t0.title : "trilha", author: t0 && t0.src ? t0.author : "trilha original do atlas · composta em código", volume: MUS.vol };
    }
    $("nk-mus-title").textContent = $t(st.title);
    $("nk-mus-author").textContent = $t(st.author);
    const b = $("nk-mus-play");
    b.innerHTML = st.playing ? ICON.pause : ICON.play;
    b.setAttribute("aria-label", $t(st.playing ? "pausar a música" : "tocar a música"));
    b.setAttribute("aria-pressed", st.playing ? "true" : "false");
    $("nk-player").classList.toggle("playing", !!st.playing);
    const v = Math.round(st.volume * 100);
    const r = $("nk-mus-vol");
    if (Number(r.value) !== v) r.value = String(v);
    r.style.setProperty("--v", `${v}%`);
    $("nk-mus-vol-n").textContent = `${v}%`;
  }
  $("nk-mus-play").addEventListener("click", toggleMusic);
  $("nk-mus-next").addEventListener("click", () => skipTrack(1));
  $("nk-mus-prev").addEventListener("click", () => skipTrack(-1));
  $("nk-mus-vol").addEventListener("input", (e) => setVolume(Number(e.target.value) / 100));
  $("nk-mus-file").addEventListener("click", () => $("nk-mus-input").click());
  $("nk-mus-input").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    const m = music();
    if (!m) return;
    m.playFile(f);
    MUS.off = false;
  });
  if (!TRK.length) $("nk-player").hidden = true;
  renderPlayer();
  document.addEventListener("visibilitychange", () => {
    /* a gravação padrão toca num elemento de áudio, que o suspend do contexto
       não alcança: a trilha pausa com a aba escondida e volta com ela */
    if (MUS.api) {
      if (document.hidden && MUS.api.state.playing) { MUS.hid = true; MUS.api.pause(false); }
      else if (!document.hidden && MUS.hid) { MUS.hid = false; if (visible) { if (!MUS.off) MUS.api.play(); } else MUS.auto = true; }
    }
    if (!SND.ctx) return;
    if (document.hidden) SND.ctx.suspend(); else if (visible) SND.ctx.resume();
  });

  const PADKEYS = { ul: ["up", "left"], ur: ["up", "right"], dl: ["down", "left"], dr: ["down", "right"] };
  $("nk-pad").querySelectorAll("[data-k]").forEach((b) => {
    const ks = PADKEYS[b.dataset.k] || [b.dataset.k];
    const on = (e) => { e.preventDefault(); if (dlg.open) return; for (const k of ks) keys[k] = true; if (!started) begin(); };
    const off = () => { for (const k of ks) keys[k] = false; };
    b.addEventListener("pointerdown", on);
    b.addEventListener("pointerup", off);
    b.addEventListener("pointercancel", off);
    b.addEventListener("pointerleave", off);
  });
  $("nk-pad").querySelectorAll("[data-a]").forEach((b) => {
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!started) { begin(); return; }
      const a = b.dataset.a;
      if (a === "jump") { if (dlg.open) advance(); else jump(); }
      else if (a === "lie") act();
      else if (a === "rotL") rotate(-1);
      else if (a === "rotR") rotate(1);
    });
    if (b.dataset.a === "jump") for (const ev of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(ev, () => { if (started && !dlg.open) jumpRelease(); });
  });

  function reset() {
    if (TOUR.on) tourEnd();
    Object.assign(cat, { x: START.x, y: START.y, z: START.z, vy: 0, vx: 0, vz: 0, face: START.face, grounded: true, on: "street", lying: false, climb: null, hop: null, coyote: 0, buffer: 0, land: 0, stepY: 0 });
    Object.assign(goals, { slabs: false, talk: false, shelf: false, vacant: false, light: false });
    Object.assign(stats, { dist: 0, climb: 0, jumps: 0, time: 0 });
    visited.clear();
    talkIdx = 0;
    extraIdx = 0;
    tomokoIdx = 0;
    asked.clear();
    noted.clear();
    metMasato = false;
    dlg.focus = null;
    hideChoices();
    booksDown = 0;
    for (const k in seen) delete seen[k];
    msgQueue.length = 0;
    for (const k in extras) extras[k] = false;
    for (const id in CATS) Object.assign(CATS[id], { friend: false, talked: false, nightTalked: false, again: 0, calm: 0, flee: 0, blinkT: 0, say: 0, mode: id === "mina" ? "sleep" : id === "mike" ? "sit" : "wander" });
    Object.assign(CATS.mina, { x: STRAY.x, y: 0.2, z: STRAY.z, face: -2.4, speed: 0 });
    MINA_SOLID.y0 = 0.2;
    for (const d of drops) scene.remove(d.mesh);
    drops.length = 0;
    timers.length = 0;
    Object.assign(VEND, { yen: 0, found: false, tries: 0, cans: 0, caps: 0 });
    Object.assign(cat, { knead: 0, reach: 0, peek: 0, paw: 0, sniff: 0, onKeys: false });
    for (const k in secrets) secrets[k] = false;
    namedDown.clear();
    hitaiHouse.visible = false;
    Object.assign(toyP, { placed: false, playing: false });
    toyP.g.visible = false;
    Object.assign(templeT, { t: 0, cd: 0 });
    for (const p of petals) scene.remove(p.s);
    petals.length = 0;
    maneki.wave = 0;
    Object.assign(perch, { t: 0, on: false, left: 0 });
    renderNotebook();
    Object.assign(LIFE.bike, { on: false, next: 28 + Math.random() * 20 });
    Object.assign(LIFE.girls, { on: false, next: 20 + Math.random() * 8 });
    if (viewMode) setView(false);
    ended = false;
    dlg.open = false;
    $("nk-dlg").hidden = true;
    $("nk-end").hidden = true;
    delete $("nk-end").dataset.shown;
    stage.focus({ preventScroll: true });
    renderSide(true);
  }
  $("nk-again").addEventListener("click", reset);
  $("nk-keep").addEventListener("click", () => { ended = false; $("nk-end").hidden = true; stage.focus({ preventScroll: true }); });

  /* ---------------------------------------------------------------------
     onde o gato está
     --------------------------------------------------------------------- */
  const ROOM = { S1: "térreo", S2: "vão sob a cozinha", S3: "cozinha", S4: "interpavimento", S5: "quarto", S6: "banho", S7: "terraço" };
  const ON = { shelf: "estante", tread: "degraus de concreto", stair: "escada de aço", ladder: "escada de marinheiro", step: "tablado", step2: "degrau", stone: "pedra da entrada", box: "caixa", npc: "colo", furniture: "móvel", ledge: "base de concreto" };
  function zoneAt(a, b, y) {
    let best = null, top = -1;
    for (const [tag, x0, z0, x1, z1] of SLABS) {
      const t = levelOf(tag);
      if (a > x0 && a < x1 && b > z0 && b < z1 && t <= y + 0.05 && t > top) { top = t; best = tag; }
    }
    return best || "S1";
  }
  function placeOf() {
    const on = cat.on;
    if (onTerrace(cat.y, cat.z) && lx(cat.x) < 5.37) return "terraço";
    if (!insideHouse(cat.x, cat.z)) {
      if (on === "pebble") return "pedrisco";
      if (lz(cat.z) > ZG && lz(cat.z) < 6.72 && lx(cat.x) > -0.1 && lx(cat.x) < 5.37) return "soleira";
      if (on === "vend") return "máquina de bebidas";
      if (on === "bin") return "lixeira";
      if (on === "wall2") return "muro";
      if (on === "blocks") return "blocos";
      if (on === "vacant" || cat.x > LOT_W) return cat.z > LOT_D ? "rua" : "terreno vazio";
      if (cat.z > STREET.z1) return "calçada";
      if (cat.z > LOT_D) return "rua";
      if (cat.x < 0) return "casa vizinha";
      return "lote";
    }
    if (ON[on]) return ON[on];
    const a = lx(cat.x), b = lz(cat.z);
    const tag = ROOM[on] ? on : zoneAt(a, b, cat.y);
    if (tag === "S1") {
      if (a > 2.1 && b > 4.45) return "genkan";
      if (b < 3.77 && b > 2.16 && a > 1.3) return "mesa";
      return "térreo";
    }
    if (tag === "S4" && inLight()) return "luz do norte";
    return ROOM[tag];
  }

  /* ---------------------------------------------------------------------
     passo da física
     --------------------------------------------------------------------- */
  function tryMove(nx, nz) {
    let y = cat.y;
    for (let k = 0; k < 5; k += 1) {
      const tops = blockersAt(nx, y, nz);
      if (!tops.length) { cat.x = nx; cat.z = nz; cat.y = y; return true; }
      if (!cat.grounded) return false;
      const t = Math.max(...tops);
      if (t - y <= CAT.STEP + 1e-4) { y = t; continue; }
      const lo = tops.filter((v) => v > y + 1e-4 && v - y <= CAT.STEP + 1e-4);
      if (!lo.length) return false;
      y = Math.min(...lo);
    }
    return false;
  }
  /* direção das setas no mundo, girada com a câmera (e espelhada com a imagem) */
  function inputDir() {
    const ix = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * (MIRROR ? -1 : 1);
    const iz = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
    if (!ix && !iz) return [0, 0];
    const fx = -Math.cos(az), fz = -Math.sin(az);
    let mx = fx * iz + -fz * ix, mz = fz * iz + fx * ix;
    const len = Math.hypot(mx, mz) || 1;
    return [mx / len, mz / len];
  }
  /* escada de marinheiro: empurrar para ela agarra; para cima sobe, para
     trás desce, espaço solta. No alto, o gato sai na borda do terraço */
  function ladderGrab(mx, mz) {
    if (dlg.open || TOUR.on || cat.lying || viewMode) return false;
    const a = lx(cat.x), b = lz(cat.z);
    if (a < LAD.a0 + 0.03 || a > LAD.a1 - 0.03) return false;
    if (mz > 0.35 && b > 3.96 && b < LAD.b0 + 0.02 && cat.y > FL.mid - 0.06 && cat.y < FL.r1 - 0.15 && (cat.grounded || cat.vy < 1)) { startClimb(); return true; }
    if (mz < -0.35 && cat.grounded && Math.abs(cat.y - FL.r1) < 0.05 && b > LAD.b1 && b < 4.75) { startClimb(); cat.y = FL.r1 - 0.1; return true; }
    return false;
  }
  function startClimb() {
    cat.climb = { phase: 0, rung: -1 };
    cat.hop = null;
    cat.vy = 0;
    cat.grounded = false;
    cat.on = "ladder";
    cat.z = Z(LAD.bc);
    cat.x = X(Math.max(LAD.a0 + 0.15, Math.min(LAD.a1 - 0.15, lx(cat.x))));
    cat.face = -Math.PI / 2;
    once("ladder", "escada de marinheiro de aço preto, em pé, do interpavimento ao terraço. seta para a escada sobe, seta para trás desce, espaço solta", 5);
  }
  function climbStep(dt, mz) {
    const C = cat.climb;
    const dir = mz > 0.35 ? 1 : mz < -0.35 ? -1 : 0;
    const v = dir > 0 ? 1.1 : dir < 0 ? -1.5 : 0;
    cat.y = Math.max(FL.mid, Math.min(FL.r1, cat.y + v * dt));
    C.phase += Math.abs(v) * dt * 10;
    const rung = Math.floor((cat.y - FL.mid) / LAD.rise + 0.5);
    if (rung !== C.rung) C.rung = rung;
    if (dir > 0 && cat.y >= FL.r1 - 0.001) {
      cat.climb = null;
      Object.assign(cat, { y: FL.r1, z: Z(4.47), vy: 0, grounded: true, on: "S7" });
    } else if (dir < 0 && cat.y <= FL.mid + 0.001) {
      cat.climb = null;
      Object.assign(cat, { y: FL.mid, z: Z(LAD.bc - 0.06), vy: 0, grounded: true, on: "S4", face: Math.PI / 2 });
    }
  }
  /* degraus de gato: com uma direção e espaço, o gato pula certinho para o
     próximo degrau (ou de volta para a borda do terraço, junto à escada) */
  function catStepIndex() {
    const a = lx(cat.x), b = lz(cat.z);
    if (a < 0.2 || a > 1.05) return null;
    if (cat.on === "shelf") {
      const k = CAT_STEPS.findIndex(([s0, s1, top]) => Math.abs(cat.y - top) < 0.03 && b > s0 - 0.15 && b < s1 + 0.15);
      return k >= 0 ? k : null;
    }
    if (Math.abs(cat.y - FL.r1) < 0.04 && b > LAD.b1 && b < 4.75) return -1;
    return null;
  }
  function smartHop(mz) {
    const k = catStepIndex();
    if (k == null) return null;
    const dir = mz < -0.3 ? 1 : mz > 0.3 ? -1 : 0;
    if (!dir) return null;
    /* no último degrau (ou na borda, para trás), o pulinho é no lugar */
    const nk = k + dir < -1 || k + dir >= CAT_STEPS.length ? k : k + dir;
    const tg = nk === -1 ? { a: 0.8, b: 4.47, top: FL.r1 } : { a: CS_A, b: (CAT_STEPS[nk][0] + CAT_STEPS[nk][1]) / 2, top: CAT_STEPS[nk][2] };
    /* um pulinho de 15 cm acima do degrau mais alto dos dois: cabe sob a laje */
    const apex = Math.max(cat.y, tg.top) + 0.15;
    const vy = Math.sqrt(2 * CAT.G * (apex - cat.y));
    const T = vy / CAT.G + Math.sqrt((2 * (apex - tg.top)) / CAT.G);
    return { x: X(tg.a), z: Z(tg.b), t: 0, T, vy, down: tg.top < cat.y - 0.01 };
  }
  function hopSteer(dt) {
    const H = cat.hop;
    H.t += dt;
    /* chega em cima do alvo antes de começar a cair; descendo, sai logo de cima
       do degrau de onde pulou */
    const arrive = (H.down ? 0.55 : 0.75) * H.T;
    const left = Math.max(dt, arrive - H.t + dt);
    const k = Math.min(1, dt / left);
    const nx = cat.x + (H.x - cat.x) * k, nz = cat.z + (H.z - cat.z) * k;
    if (Math.abs(nx - cat.x) + Math.abs(nz - cat.z) > 1e-5) { cat.face = Math.atan2(-(nz - cat.z), nx - cat.x); tryMove(nx, cat.z); tryMove(cat.x, nz); }
    if (H.t > H.T + 0.3) cat.hop = null;
  }
  function npcNear() {
    for (const who of ["masato", "tomoko"]) {
      const n = NPC[who];
      if (Math.hypot(cat.x - n.x, cat.z - n.z) < 1.05 && Math.abs(cat.y - n.floor) < 1.25) return who;
    }
    return null;
  }
  function physStep(dt, mx, mz) {
    const wasAir = !cat.grounded, fallV = cat.vy;
    let okX = true;
    if (cat.hop) hopSteer(dt);
    else {
      /* velocidade que acelera e freia; no ar, o gato ainda corrige um pouco */
      const tx = mx * CAT.SPEED, tz = mz * CAT.SPEED;
      const a = !cat.grounded ? PHYS.AIR : (mx || mz) ? PHYS.ACC : PHYS.DEC;
      const dvx = tx - cat.vx, dvz = tz - cat.vz, dl = Math.hypot(dvx, dvz), lim = a * dt;
      if (dl <= lim) { cat.vx = tx; cat.vz = tz; } else { cat.vx += (dvx / dl) * lim; cat.vz += (dvz / dl) * lim; }
      /* nos degraus de gato e na borda do terraço junto ao vazio, o gato não
         sai andando para o nada: só pulando */
      const guard = cat.grounded && (cat.on === "shelf" || (cat.on === "S7" && lz(cat.z) < 4.66 && cat.y > FL.r1 - 0.05));
      const mv = (nx, nz) => {
        if (guard && groundAt(nx, nz, cat.y + 0.01).y < cat.y - 0.3) return false;
        const y0 = cat.y, ok = tryMove(nx, nz);
        /* subiu um degrau: o corpo acompanha em meio segundo, não num estalo */
        if (ok && cat.y > y0 + 0.02) cat.stepY = Math.max(-CAT.STEP, cat.stepY - (cat.y - y0));
        return ok;
      };
      if (Math.abs(cat.vx) > 1e-4) { okX = mv(cat.x + cat.vx * dt, cat.z); if (!okX) cat.vx = 0; }
      if (Math.abs(cat.vz) > 1e-4) { if (!mv(cat.x, cat.z + cat.vz * dt)) cat.vz = 0; }
    }
    /* esbarrar na estante derruba um livro */
    if (mx < -0.35 && !okX && nearShelf()) bumpT += dt; else bumpT = 0;
    if (bumpT > 0.3) { bumpT = 0; knockShelf(false); }

    cat.vy = Math.max(-PHYS.VMAX, cat.vy - CAT.G * dt);
    let ny = cat.y + cat.vy * dt;
    if (cat.vy <= 0) {
      const g = groundAt(cat.x, cat.z, cat.y);
      if (ny <= g.y) { ny = g.y; cat.vy = 0; cat.grounded = true; cat.on = g.tag; }
      else cat.grounded = false;
    } else {
      const c = ceilingAt(cat.x, cat.z, cat.y + CAT.H);
      if (ny + CAT.H > c) { ny = c - CAT.H; cat.vy = 0; }
      cat.grounded = false;
    }
    if (ny < -5) { Object.assign(cat, { x: START.x, y: START.y, z: START.z, vy: 0, vx: 0, vz: 0 }); ny = START.y; }
    cat.y = ny;
    if (cat.grounded) {
      cat.hop = null;
      cat.coyote = PHYS.COYOTE;
      /* pouso: amassa conforme a queda, e faz barulho se foi alto */
      if (wasAir && fallV < -2.2) cat.land = Math.min(1, -fallV / 7);
      if (cat.buffer > 0) doJump();
    } else {
      cat.coyote = Math.max(0, cat.coyote - dt);
      cat.buffer = Math.max(0, cat.buffer - dt);
    }
  }
  let testDir = null;                          /* só para os testes: anda numa direção do mundo */
  function step(dt) {
    stats.time += dt;
    let mx = 0, mz = 0;
    if (testDir && !dlg.open) {
      const len = Math.hypot(testDir[0], testDir[1]) || 1;
      mx = testDir[0] / len; mz = testDir[1] / len;
      if (cat.lying) cat.lying = false;
      cat.face = Math.atan2(-mz, mx);
    } else if (!dlg.open && !TOUR.on && !PIANO.seq) {
      [mx, mz] = inputDir();
      if (mx || mz) {
        if (cat.lying) cat.lying = false;
        /* o gato vira o corpo em vez de girar num estalo: meia volta leva
           um quinto de segundo */
        if (!cat.climb) {
          const want = Math.atan2(-mz, mx);
          let d = want - cat.face;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          const turn = REDUCED ? Math.abs(d) : 16 * dt;
          cat.face += Math.abs(d) <= turn ? d : Math.sign(d) * turn;
        }
      }
    }
    if ((mx || mz) && (cat.knead > 0 || cat.reach > 0 || cat.peek > 0)) { cat.knead = 0; cat.reach = 0; cat.peek = 0; }
    const px = cat.x, pz = cat.z, py = cat.y;
    if (cat.climb || ladderGrab(mx, mz)) { cat.vx = cat.vz = 0; climbStep(dt, mz); }
    else {
      /* passo fixo: o mesmo pulo em qualquer tela, e nada atravessa laje fina */
      let rest = dt;
      while (rest > 1e-6) { const h = Math.min(PHYS.DT, rest); physStep(h, mx, mz); rest -= h; }
    }
    const moved = Math.hypot(cat.x - px, cat.z - pz);
    stats.dist += moved;
    if (cat.y > py) stats.climb += cat.y - py;
    me.phase += moved * 24;

    /* quando o gato chega perto, as folhas de aço correm para a frente dos
       painéis de agregado e a folha de vidro corre para o sul */
    const dDoor = Math.hypot(cat.x - X(4.35), cat.z - Z(6.45));
    const want = dDoor < 1.7 ? 1 : 0;
    DOOR.open += Math.sign(want - DOOR.open) * Math.min(Math.abs(want - DOOR.open), dt * 1.6);
    DOOR.glass.x0 = X(3.7 - 1.3 * DOOR.open); DOOR.glass.x1 = X(5.0 - 1.3 * DOOR.open);
    DOOR.steel.x0 = X(2.64 - 2.49 * DOOR.open); DOOR.steel.x1 = X(5.14 - 2.49 * DOOR.open);
    if (DOOR.open > 0.95) once("door", "o vidro grande da frente abriu. como não sobrou lugar pra jardim, os arquitetos quiseram que ele fizesse esse papel", 4.8);

    /* no passeio, o gato só posa: nada de aviso, laje visitada ou item */
    if (TOUR.on) { nearNpc = null; hereItem = null; return; }
    /* avisos: cada um vem do texto dos arquitetos, das publicações ou dos desenhos */
    const on = cat.grounded ? cat.on : null;
    const inside = catInside();
    if (inside) once("in", "a casa inteira é um cômodo só. sete lajes, cada uma numa altura, e quase nenhuma parede no meio", 4.6);
    if (on === "stone") once("stone", "uma pedra grande no tijolo, logo depois da porta. os arquitetos dizem que é a partir do genkan que o espaço vai mudando aos poucos", 5.2);
    if (on === "stair") once("stair", "escada de aço preto. por dentro da moldura de concreto, é ela que costura as lajes", 4.2);
    if (on === "step") once("step", "tablado de carvalho, 45 cm acima do tijolo. dá pra sentar, e é dele que saem os degraus de concreto", 4.8);
    if (on && /^S[1-7]$/.test(on) && (inside || on === "S7")) {
      if (!visited.has(on)) { visited.add(on); quietT = 0; renderSide(true); }
      const b = lz(cat.z), a = lx(cat.x);
      if (on === "S1") once("S1", "térreo: piso de tijolo, 21,5 cm abaixo do chão do terreno, com a mesa e o tablado", 4.6);
      if (on === "S1" && b > 2.4 && b < 3.77 && a > 1.5 && a < 4.0) once("table", "a mesa fica num trecho mais baixo do térreo, 31,5 cm abaixo da faixa de tijolo e 21,5 cm abaixo do terreno lá fora. o casal come e trabalha aqui", 5.4);
      if (on === "S1" && b > 3.77 && b < 4.46 && a > 2.04 && cat.y > FL.g + 0.2) once("beam", "a viga do eixo X2 aparece no piso como uma faixa de tijolo, 31,5 cm acima do resto do térreo, entre a entrada e a mesa. o degrau de madeira ajuda a subir", 5.2);
      if (on === "S2") once("S2", "o vão embaixo da cozinha, 10 cm acima do terreno, fechado por tábuas de madeira. o uso não aparece nas fontes", 5.2);
      if (on === "S3") once("S3", "cozinha: a +2,15 m, no fundo da casa, longe da rua e das aberturas", 4.6);
      if (on === "S4") once("S4", "interpavimento, a +3,35 m, em carvalho largo. daqui se veem a rua, a estante e o banho", 4.8);
      if (on === "S5") once("S5", "quarto: 45 cm acima do interpavimento, na frente, atrás do vidro da rua", 4.6);
      if (on === "S6") once("S6", "banho: no fundo, por cima da cozinha, a +5,10 m. ao lado, o vazio alto", 4.6);
      if (on === "S7") once("S7", "terraço, a +6,02 m, por cima do quarto, do lado da rua. atrás, o vidro alto do vazio", 5);
      if (visited.size === 7) goal("slabs", "você passou pelas sete lajes, do térreo ao terraço.");
    }
    if (on === "shelf") {
      once("shelf", "a estante cobre toda a parede sul e acompanha as escadas até o alto do vazio", 4.2);
      if (cat.y - GL0 > 3) goal("shelf", "mais de 3 m acima do chão, nos degraus de gato da estante.");
    }
    {
      const la = lx(cat.x), lb = lz(cat.z);
      if (on === "S4" && la > 0.3 && la < 1.3 && lb > 3.7 && lb < 4.4) once("ladderHint", "essa escada de marinheiro vai até o terraço. é só empurrar o gato contra ela", 4.4);
      if (catStepIndex() === -1) once("catsteps", "daqui pra cima a estante vira degrau de gato. seta e espaço, e ele vai pulando", 5);
    }
    if (on === "vacant" && Math.hypot(cat.x - TREE.x, cat.z - TREE.z) < 1.4) once("sakura", $b("essa cerejeira não existe. quer dizer, aqui existe, mas nenhuma fonte fala de árvore nesse terreno. X no tronco, se der vontade de arranhar.", "this cherry tree doesn't exist. well, it does here, but no source mentions a tree on this lot. X by the trunk, if you feel like scratching."), 5);
    if (on === "tread") once("tread", "degraus de concreto em balanço, presos só na parede da estante. embaixo, nada. o gato prefere não pensar nisso", 4.6);
    if (on === "vacant" && !seen.saleSign && cat.x > 8.3 && cat.z < 1.6) {
      seen.saleSign = true;
      const F = window.NEKO_CITY && window.NEKO_CITY.landFlow;
      let pct = null;
      if (F) { let a = 0, b = 0; for (const w in F) { a += F[w].salesSmall; b += F[w].salesTotal; } pct = b ? (100 * a) / b : null; }
      const m = CATS.mina;
      openDialogue([
        { who: "narr", text: $b("(a placa no fundo diz 売地, terreno à venda. o telefone está em branco, o que é ótimo pra Mina.)", "(the sign at the back says 売地, land for sale. the phone number is blank, which suits Mina just fine.)") },
        ...(pct ? [{ who: "narr", text: $b(`(em 2024, ${fmt(pct, 1)}% das vendas de terreno nos 23 wards foram de lotes com menos de 100 m².)`, `(in 2024, ${fmt(pct, 1)}% of land sales in the 23 wards were of lots under 100 m².)`) }] : []),
        { who: "mina", text: "mrrrow.", tr: $b("é meu. por enquanto.", "it's mine. for now."), mood: "happy" },
      ], null, { x: m.x, y: m.y, z: m.z });
    }
    if (on === "vacant") goal("vacant", "o terreno vazio do lado. a parede norte da casa recua em degraus pra se abrir pra ele");
    if (Math.hypot(cat.x - STRAY.x, cat.z - STRAY.z) < 1.1) once("stray", "a Mina dorme nos blocos. chegue perto e mie com X", 3.6);
    if (on === "vend") once("vend", "jidohanbaiki, a máquina de bebidas que o Japão põe em toda esquina. faixa azul é gelado, vermelha é quente", 4.8);
    if (cat.y < 0.1 && inRect(VEND_FRONT, cat.x, cat.z)) once("vendHint", "X aperta a máquina. em cima dela, dormindo, a Mike", 4);
    if (cat.y < 0.1 && inRect(GACHA_FRONT, cat.x, cat.z)) once("gachaHint", "gachapon. põe a moeda, gira e torce. X gira", 4.2);
    if (!CATS.jiji.talked && Math.hypot(cat.x - CATS.jiji.x, cat.z - CATS.jiji.z) < 1.6) once("jijiHint", "uma gata preta e branca fazendo a ronda na rua. X pra miar pra ela", 3.8);
    if (Math.hypot(cat.x - CATS.mike.x, cat.z - CATS.mike.z) < 1.0 && Math.abs(cat.y - CATS.mike.y) < 0.7) once("mikeHint", "a Mike abre um olho. mie com X", 3);
    /* o teclado do Masato */
    const onDesk = cat.grounded && cat.on === "furniture" && Math.abs(cat.y - DESK_Y) < 0.03;
    const dKey = Math.hypot(cat.x - LAPTOP.x, cat.z - LAPTOP.z);
    if (onDesk && dKey < 0.26) {
      if (!cat.onKeys) { cat.onKeys = true; typing(); say(KEYS_TXT[keysN % KEYS_TXT.length], 3); keysN += 1; NPC.masato.react = 2.4; }
    } else if (dKey > 0.45) cat.onKeys = false;
    /* latas e cápsulas rolam quando o gato empurra */
    if (mx || mz) for (const d of drops) {
      if ((d.kind !== "can" && d.kind !== "capsule") || d.kickCd > 0) continue;
      if (Math.hypot(cat.x - d.x, cat.z - d.z) < CAT.R + d.r + 0.03 && Math.abs(cat.y - (d.y - d.r)) < 0.25) {
        d.vx = mx * 1.7 + (Math.random() - 0.5) * 0.3;
        d.vz = mz * 1.7 + (Math.random() - 0.5) * 0.3;
        d.vy = 0.6;
        d.kickCd = 0.3;
        landSound(d, 0.7);
      }
    }
    nearNpc = npcNear();
    if (nearNpc === "masato") once("hintM", "o Masato está trabalhando. mie com X ou com o botão miar", 3.8);
    hereItem = findItem();
    if (goals.slabs && goals.talk && goals.shelf && goals.vacant && goals.light && !ended && !$("nk-end").dataset.shown) finish();
  }

  /* pistas: H (ou o botão ?) diz o que falta e onde fica */
  const SLAB_ORDER = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
  const SLAB_HINT = {
    S1: "o térreo é o piso de tijolo logo depois da porta da frente.",
    S2: "o vão sob a cozinha fica no térreo, embaixo da cozinha: suba na base de concreto diante das tábuas e entre.",
    S3: "a cozinha fica no fundo: suba pelos degraus de concreto que saem do tablado, junto à estante.",
    S4: "o interpavimento fica no alto da escada de aço preto que sai da cozinha.",
    S5: "o quarto fica 45 cm acima do interpavimento, na frente, junto ao vidro da rua: um pulo resolve.",
    S6: "o banho fica no fundo, no alto da escada de aço em leque que sai do interpavimento.",
    S7: "o terraço fica em cima do quarto: suba a escada de marinheiro, junto à borda do quarto, perto da estante.",
  };
  function nextGoal() { for (const k of ["slabs", "talk", "shelf", "vacant", "light"]) if (!goals[k]) return k; return null; }
  function hintText() {
    const g = nextGoal();
    if (!g) {
      const k = Object.keys(secrets).find((q) => !secrets[q] && !seenBefore.has(q));
      return k ? $b(`os cinco objetivos estão feitos. um segredo do caderninho: ${SECRET_INFO[k].hint}`, `all five goals are done. a secret from the notebook: ${$t(SECRET_INFO[k].hint)}`) : "acabou a lista. agora é só ser gato.";
    }
    if (g === "slabs") {
      const miss = SLAB_ORDER.filter((k) => !visited.has(k));
      return `${miss.length === 1 ? $t("falta uma laje") : $b(`faltam ${miss.length} lajes`, `${miss.length} slabs left`)}. ${$t(SLAB_HINT[miss[0]])}`;
    }
    if (g === "talk") return "o Masato trabalha na mesa do térreo. chegue perto e mie com X; as setas escolhem a pergunta.";
    if (g === "shelf") return "suba a escada de marinheiro, junto à borda do quarto, até o terraço. de lá, com uma seta e espaço, o gato pula os degraus de gato da estante.";
    if (g === "vacant") return "saia pela porta da frente e entre no terreno vazio, ao lado da casa, onde a Mina dorme nos blocos.";
    return "a luz do norte cai no interpavimento, perto da parede norte. deite nela com X e espere um pouco.";
  }
  let quietT = 0, nudged = 0;
  function giveHint() {
    if (!started) begin();
    if (dlg.open || TOUR.on) return;
    quietT = 0;
    say(hintText(), 6.5, true);
    const g = nextGoal();
    const li = g && node.querySelector(`[data-goal="${g}"]`);
    if (li) { li.classList.remove("pulse"); void li.offsetWidth; li.classList.add("pulse"); }
  }
  /* quem fica muito tempo sem achar nada ganha um lembrete da pista */
  function nudgeTick(dt) {
    if (!started || ended || dlg.open || viewMode || TOUR.on || !nextGoal()) return;
    quietT += dt;
  }
  function clock(s) { const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${String(r).padStart(2, "0")}`; }
  function finish() {
    ended = true;
    $("nk-end").dataset.shown = "1";
    $("nk-end-text").textContent = endText();
    $("nk-end").hidden = false;
    chime();
    renderSide(true);
  }

  function endText() {
    return $b(`O gato passou pelas sete lajes, miou com o Masato, andou ${fmt(stats.dist, 1)} m, subiu ${fmt(stats.climb, 1)} m e deu ${stats.jumps} saltos em ${clock(stats.time)}. Pelo corte do projeto, as lajes vão de −0,22 m a +6,02 m, e o salto do gato no jogo é de 1,05 m: por isso o caminho passa pelo tablado, pelos degraus de concreto, pelas escadas de aço, pela escada de marinheiro e pelos degraus de gato da estante.`,
      `The cat visited all seven slabs, meowed with Masato, walked ${fmt(stats.dist, 1)} m, climbed ${fmt(stats.climb, 1)} m and jumped ${stats.jumps} times in ${clock(stats.time)}. According to the project section, the slabs go from −0.22 m to +6.02 m, and the cat’s jump in the game is 1.05 m: that is why the route goes over the platform, the concrete treads, the steel stairs, the ship’s ladder and the cat steps on the bookshelf.`);
  }
  /* a página do jogo no idioma do atlas: textos marcados com data-nk e
     atributos com data-nk-a (nomes próprios, para o ui.js não mexer); a abertura, a nota da planilha e os dados
     da casa são montados de novo, com os números no formato do idioma */
  function ledeText() {
    const lot = HOUSE ? fmt(HOUSE.lotArea, 2) : fmt(42.19, 2);
    return $b(`Segundo os arquitetos, nesta casa o que era piso vira cadeira, mesa, prateleira e teto. São sete lajes desencontradas dentro de uma moldura de concreto, num lote de ${lot} m², e aqui um gato sobe por elas e mia para quem mora ali. As alturas, as escadas e a posição das lajes seguem as plantas e o corte do projeto; as respostas do Masato Igarashi vêm do e-mail que ele mandou para esta pesquisa. O modelo é isométrico, em 3D, e tem alterações. Um plano de corte acompanha o gato, e o que ele corta aparece em azul-marinho, como poché.`,
      `According to the architects, in this house what was a floor becomes a chair, a table, a shelf and a ceiling. There are seven offset slabs inside a concrete frame, on a lot of ${lot} m², and here a cat climbs them and meows at the people who live there. The heights, the stairs and the position of the slabs follow the project’s plans and section; Masato Igarashi’s answers come from the email he sent to this research. The model is isometric, in 3D, and has changes. A cutting plane follows the cat, and whatever it cuts shows in navy blue, like poché.`);
  }
  function sheetText() {
    const n = HOUSE ? HOUSE.floors : 7;
    return $b(`A planilha (aba 01 casas base) registra ${n} pavimentos; a ficha do projeto declara dois (2階建) e descreve sete lajes. O número da planilha parece contar as lajes [VERIFICAR]. Os números do percurso são do modelo.`,
      `The spreadsheet (tab 01 casas base) records ${n} storeys; the project sheet declares two (2階建) and describes seven slabs. The spreadsheet number seems to count the slabs [TO VERIFY]. The route numbers come from the model.`);
  }
  function applyLang() {
    node.lang = LANG === "en" ? "en" : "pt-BR";
    node.querySelectorAll("[data-nk]").forEach((el) => {
      const html = el.dataset.nk === "html";
      if (el.dataset.nkpt == null) el.dataset.nkpt = html ? el.innerHTML : el.textContent;
      const v = (LANG === "en" && EN[el.dataset.nkpt]) || el.dataset.nkpt;
      if (html) el.innerHTML = v; else el.textContent = v;
    });
    node.querySelectorAll("[data-nk-a]").forEach((el) => {
      for (const at of el.dataset.nkA.split(",")) {
        const key = "nkpt_" + at.replace(/-/g, "_");
        if (el.dataset[key] == null) el.dataset[key] = el.getAttribute(at) || "";
        const pt = el.dataset[key];
        el.setAttribute(at, (LANG === "en" && EN[pt]) || pt);
      }
    });
    $("nk-lede").textContent = ledeText();
    $("nk-sheet-note").textContent = sheetText();
    $("nk-data").innerHTML = dataRows();
    const note = node.querySelector(".nk-en-note");
    if (note) note.hidden = LANG !== "en";
    if (!$("nk-end").hidden) $("nk-end-text").textContent = endText();
  }
  let sideTimer = 0;
  function renderSide(force) {
    sideTimer -= 1;
    if (!force && sideTimer > 0) return;
    sideTimer = 8;
    $("nk-dist").textContent = `${fmt(stats.dist, 1)} m`;
    $("nk-climb").textContent = `${fmt(stats.climb, 1)} m`;
    $("nk-jumps").textContent = String(stats.jumps);
    $("nk-time").textContent = clock(stats.time);
    $("nk-slabs").textContent = `${visited.size}/7`;
    $("nk-talk").textContent = `${Math.min(talkIdx, TOPICS.length)}/${TOPICS.length}`;
    const ng = nextGoal();
    node.querySelectorAll("[data-goal]").forEach((li) => { li.classList.toggle("done", !!goals[li.dataset.goal]); li.classList.toggle("next", li.dataset.goal === ng && started); li.dataset.now = $b("← agora", "← now"); });
    const h = cat.y - GL0;
    $("nk-where").textContent = viewMode ? $t("casa de longe · V volta") : `${$t(placeOf())} · ${h >= -0.005 ? "+" : "−"}${fmt(Math.abs(h), 2)} m`;
    node.querySelectorAll("[data-extra]").forEach((li) => li.classList.toggle("done", !!extras[li.dataset.extra]));
    $("nk-cats").textContent = `${Object.values(CATS).filter((c) => c.friend).length}/3`;
    const actBtn = $("nk-act");
    const label = $t(dlg.open ? "seguir" : viewMode ? "voltar" : hereItem ? hereItem.label : cat.lying ? "levantar" : "deitar");
    if (actBtn.textContent !== label) actBtn.textContent = label;
  }

  /* ---------------------------------------------------------------------
     imagem: a cena em resolução cheia; depois oclusão de ambiente, contorno
     suave e cor; brilho nas luzes; desfoque de maquete no alto e embaixo da
     tela; antisserrilhado no fim. A imagem sai espelhada na horizontal: o
     modelo é montado com o norte em +x e a rua em +z, e só espelhado fica
     com a mão certa, como na planta e na foto da fachada (de quem olha a
     casa da rua, o norte fica à esquerda)
     --------------------------------------------------------------------- */
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 20, 110);
  const CAM_D = 60;
  let W = 640, H = 480, CW = 640, CH = 480, QUALITY = 1, AUTO_Q = true;
  let rtScene = null, rtComp = null, rtA = null, rtB = null, rtC = null, rtD = null;
  const VS = "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
  function fsPass(frag, uniforms) {
    const m = new THREE.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader: frag, depthTest: false, depthWrite: false });
    const sc = new THREE.Scene();
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m);
    q.frustumCulled = false;
    sc.add(q);
    return { m, sc };
  }
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const NOISE_GLSL = `
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
    float fbm(vec2 p) { return vnoise(p) * 0.5 + vnoise(p * 2.03 + 1.7) * 0.25 + vnoise(p * 4.07 + 3.1) * 0.125 + vnoise(p * 8.11 + 5.3) * 0.0625; }`;
  const comp = fsPass(`
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uRes;
    uniform float uNear, uFar, uWpx, uNight, uTime, uHazeStart, uHazeAmt, uSat, uAO, uEdge;
    uniform vec3 uLine, uSkyTop, uSkyBot, uCloud, uHaze, uTintS, uTintL;
    varying vec2 vUv;
    ${NOISE_GLSL}
    float lin(vec2 uv) { return uNear + texture2D(tDepth, uv).x * (uFar - uNear); }
    void main() {
      float d0 = texture2D(tDepth, vUv).x;
      if (d0 >= 0.99999) {
        vec3 bg = mix(uSkyBot, uSkyTop, smoothstep(0.02, 0.95, vUv.y));
        vec2 cp = vec2(vUv.x * uRes.x / uRes.y * 1.6 + uTime * 0.008, vUv.y * 4.2);
        float n = fbm(cp);
        float cl = smoothstep(0.5, 0.72, n) * smoothstep(0.28, 0.85, vUv.y);
        float lit = smoothstep(0.45, 0.8, fbm(cp + vec2(0.0, -0.18)));
        bg = mix(bg, uCloud * (0.9 + 0.1 * lit), cl * 0.92);
        if (uNight > 0.5) {
          float md = length((vUv - vec2(0.78, 0.8)) * vec2(uRes.x / uRes.y, 1.0));
          bg += vec3(0.16, 0.18, 0.26) * smoothstep(0.22, 0.05, md);
          bg = mix(bg, vec3(1.0, 0.97, 0.86), smoothstep(0.043, 0.038, md));
          vec2 sp = floor(gl_FragCoord.xy / 2.0);
          float h = hash(sp);
          bg += vec3(0.95, 0.92, 0.82) * step(0.9972, h) * (0.55 + 0.45 * sin(uTime * 2.0 + h * 80.0)) * smoothstep(0.22, 0.6, vUv.y);
        }
        gl_FragColor = vec4(bg, 1.0);
        return;
      }
      vec3 col = texture2D(tColor, vUv).rgb;
      vec2 px = 1.0 / uRes;
      float z0 = uNear + d0 * (uFar - uNear);
      /* oclusão: amostras num disco de 30 cm, em espiral */
      float occ = 0.0;
      float rot = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2832;
      float rpx = 0.32 / uWpx;
      for (int i = 0; i < 16; i++) {
        float fi = float(i);
        float a = fi * 2.3999 + rot;
        float rr = rpx * (0.15 + 0.85 * fract(fi * 0.618 + 0.13));
        float dz = z0 - lin(vUv + vec2(cos(a), sin(a)) * rr * px);
        occ += smoothstep(0.035, 0.14, dz) * (1.0 - smoothstep(0.4, 0.8, dz));
      }
      col *= 1.0 - (occ / 16.0) * uAO;
      /* contorno suave só onde há salto de profundidade */
      float zl = lin(vUv - vec2(px.x, 0.0)), zr = lin(vUv + vec2(px.x, 0.0));
      float zu = lin(vUv + vec2(0.0, px.y)), zd = lin(vUv - vec2(0.0, px.y));
      float farther = max(max(zl, zr), max(zu, zd)) - z0;
      float edge = smoothstep(0.06, 0.28, farther);
      col = mix(col, col * 0.55 + uLine * 0.18, edge * uEdge);
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(l), col, uSat);
      col *= mix(uTintS, uTintL, smoothstep(0.08, 0.8, l));
      col = mix(col, uHaze, clamp((z0 - uHazeStart) / 26.0, 0.0, 1.0) * uHazeAmt);
      gl_FragColor = vec4(col, 1.0);
    }`, {
    tColor: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2(640, 480) },
    uNear: { value: 20 }, uFar: { value: 110 }, uWpx: { value: 0.02 }, uAO: { value: 0.5 }, uEdge: { value: 0.55 },
    uNight: { value: 0 }, uTime: { value: 0 }, uHazeStart: { value: CAM_D + 4 }, uHazeAmt: { value: DAY.hazeAmt }, uSat: { value: DAY.sat },
    uLine: { value: new THREE.Color(0x2a1d33) }, uSkyTop: { value: new THREE.Color(DAY.skyTop) }, uSkyBot: { value: new THREE.Color(DAY.skyBot) },
    uCloud: { value: new THREE.Color(DAY.cloud) }, uHaze: { value: new THREE.Color(DAY.haze) },
    uTintS: { value: new THREE.Vector3(...DAY.tintS) }, uTintL: { value: new THREE.Vector3(...DAY.tintL) },
  });
  const bright = fsPass(`
    uniform sampler2D tComp; uniform sampler2D tDepth; uniform vec2 uRes; uniform float uThresh;
    varying vec2 vUv;
    vec3 pick(vec2 uv) {
      vec3 c = texture2D(tComp, uv).rgb;
      float sky = step(0.99999, texture2D(tDepth, uv).x);
      float l = max(c.r, max(c.g, c.b));
      return c * smoothstep(uThresh, uThresh + 0.25, l) * (1.0 - sky);
    }
    void main() {
      vec2 h = 0.5 / uRes;
      gl_FragColor = vec4((pick(vUv + vec2(-h.x, -h.y)) + pick(vUv + vec2(h.x, -h.y)) + pick(vUv + vec2(-h.x, h.y)) + pick(vUv + vec2(h.x, h.y))) * 0.25, 1.0);
    }`, { tComp: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2(640, 480) }, uThresh: { value: DAY.thresh } });
  const down = fsPass(`
    uniform sampler2D tSrc; uniform vec2 uRes;
    varying vec2 vUv;
    void main() {
      vec2 h = 0.5 / uRes;
      gl_FragColor = vec4((texture2D(tSrc, vUv + vec2(-h.x, -h.y)).rgb + texture2D(tSrc, vUv + vec2(h.x, -h.y)).rgb + texture2D(tSrc, vUv + vec2(-h.x, h.y)).rgb + texture2D(tSrc, vUv + vec2(h.x, h.y)).rgb) * 0.25, 1.0);
    }`, { tSrc: { value: null }, uRes: { value: new THREE.Vector2(640, 480) } });
  const blur = fsPass(`
    uniform sampler2D tSrc; uniform vec2 uDir;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tSrc, vUv).rgb * 0.227;
      c += (texture2D(tSrc, vUv + uDir * 1.385).rgb + texture2D(tSrc, vUv - uDir * 1.385).rgb) * 0.316;
      c += (texture2D(tSrc, vUv + uDir * 3.231).rgb + texture2D(tSrc, vUv - uDir * 3.231).rgb) * 0.07;
      gl_FragColor = vec4(c, 1.0);
    }`, { tSrc: { value: null }, uDir: { value: new THREE.Vector2(1, 0) } });
  const fin = fsPass(`
    uniform sampler2D tComp; uniform sampler2D tBloom; uniform sampler2D tBlur; uniform vec2 uRes;
    uniform float uBloom, uVig, uDof, uFocus, uMirror, uTime;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 fxaa(vec2 uv) {
      vec2 px = 1.0 / uRes;
      vec3 nw = texture2D(tComp, uv + vec2(-1.0, -1.0) * px).rgb, ne = texture2D(tComp, uv + vec2(1.0, -1.0) * px).rgb;
      vec3 sw = texture2D(tComp, uv + vec2(-1.0, 1.0) * px).rgb, se = texture2D(tComp, uv + vec2(1.0, 1.0) * px).rgb;
      vec3 m = texture2D(tComp, uv).rgb;
      vec3 L = vec3(0.299, 0.587, 0.114);
      float lnw = dot(nw, L), lne = dot(ne, L), lsw = dot(sw, L), lse = dot(se, L), lm = dot(m, L);
      float lmin = min(lm, min(min(lnw, lne), min(lsw, lse))), lmax = max(lm, max(max(lnw, lne), max(lsw, lse)));
      vec2 dir = vec2(-((lnw + lne) - (lsw + lse)), (lnw + lsw) - (lne + lse));
      float red = max((lnw + lne + lsw + lse) * 0.03125, 0.0078125);
      float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
      dir = clamp(dir * rcp, -8.0, 8.0) * px;
      vec3 a = 0.5 * (texture2D(tComp, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tComp, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
      vec3 b = a * 0.5 + 0.25 * (texture2D(tComp, uv - dir * 0.5).rgb + texture2D(tComp, uv + dir * 0.5).rgb);
      float lb = dot(b, L);
      return (lb < lmin || lb > lmax) ? a : b;
    }
    void main() {
      vec2 uv = vec2(uMirror > 0.5 ? 1.0 - vUv.x : vUv.x, vUv.y);
      vec3 c = fxaa(uv);
      float coc = smoothstep(0.12, 0.52, abs(vUv.y - uFocus)) * uDof;
      c = mix(c, texture2D(tBlur, uv).rgb, coc);
      c += texture2D(tBloom, uv).rgb * uBloom;
      vec2 q = vUv - 0.5;
      c *= 1.0 - dot(q, q) * uVig;
      c += (hash(gl_FragCoord.xy + fract(uTime * 7.0)) - 0.5) / 255.0;
      gl_FragColor = vec4(c, 1.0);
    }`, {
    tComp: { value: null }, tBloom: { value: null }, tBlur: { value: null }, uRes: { value: new THREE.Vector2(640, 480) },
    uBloom: { value: DAY.bloom }, uVig: { value: DAY.vig }, uDof: { value: 0.7 }, uFocus: { value: 0.5 }, uMirror: { value: MIRROR ? 1 : 0 }, uTime: { value: 0 },
  });

  function makeTargets() {
    for (const t of [rtScene, rtComp, rtA, rtB, rtC, rtD]) if (t) t.dispose();
    rtScene = rtComp = rtA = rtB = rtC = rtD = null;
    if (!CAN_DEPTH) return;
    const dt = new THREE.DepthTexture(W, H);
    dt.type = THREE.UnsignedIntType;
    const soft = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false };
    rtScene = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, depthTexture: dt });
    rtComp = new THREE.WebGLRenderTarget(W, H, soft);
    const hw = Math.max(2, Math.ceil(W / 2)), hh = Math.max(2, Math.ceil(H / 2));
    rtA = new THREE.WebGLRenderTarget(hw, hh, soft);
    rtB = new THREE.WebGLRenderTarget(hw, hh, soft);
    rtC = new THREE.WebGLRenderTarget(hw, hh, soft);
    rtD = new THREE.WebGLRenderTarget(hw, hh, soft);
    for (const t of [rtScene, rtComp, rtA, rtB, rtC, rtD]) t.texture.generateMipmaps = false;
    comp.m.uniforms.tColor.value = rtScene.texture;
    comp.m.uniforms.tDepth.value = dt;
    comp.m.uniforms.uRes.value.set(W, H);
    bright.m.uniforms.tComp.value = rtComp.texture;
    bright.m.uniforms.tDepth.value = dt;
    bright.m.uniforms.uRes.value.set(W, H);
    down.m.uniforms.tSrc.value = rtComp.texture;
    down.m.uniforms.uRes.value.set(W, H);
    fin.m.uniforms.tComp.value = rtComp.texture;
    fin.m.uniforms.tBloom.value = rtA.texture;
    fin.m.uniforms.tBlur.value = rtC.texture;
    fin.m.uniforms.uRes.value.set(W, H);
  }
  function resize() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.max(64, Math.round(rect.width * dpr)), ch = Math.max(48, Math.round(rect.height * dpr));
    const budget = (SMALL ? 1.0e6 : 2.0e6) * QUALITY;
    const sc = Math.min(1, Math.sqrt(budget / (cw * ch)));
    const w = Math.max(64, Math.round(cw * sc)), h = Math.max(48, Math.round(ch * sc));
    if (cw === CW && ch === CH && w === W && h === H && (rtScene || !CAN_DEPTH)) return;
    CW = cw; CH = ch; W = w; H = h;
    renderer.setSize(CW, CH, false);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    makeTargets();
    ZOOMS = rect.height < 440 ? [5.0, 9.0, 17] : [6.2, 10.5, 19];
    if (started) viewHTarget = ZOOMS[zoomIdx];
  }
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(() => resize()).observe(stage);
  else window.addEventListener("resize", resize);
  /* se o aparelho penar, a imagem fica um pouco menor, uma vez de cada vez */
  let slowT = 0, fastAvg = 16;
  function watchSpeed(ms) {
    if (!AUTO_Q) return;
    fastAvg += (ms - fastAvg) * 0.05;
    if (fastAvg > 34 && QUALITY > 0.45) { slowT += ms / 1000; if (slowT > 2.5) { slowT = 0; fastAvg = 16; QUALITY = Math.max(0.45, QUALITY * 0.78); resize(); } }
    else slowT = Math.max(0, slowT - ms / 2000);
  }

  const _dir = new THREE.Vector3();
  function placeCamera(target) {
    const aspect = W / H;
    camera.top = viewH / 2; camera.bottom = -viewH / 2;
    camera.left = (-viewH * aspect) / 2; camera.right = (viewH * aspect) / 2;
    camera.updateProjectionMatrix();
    const ce = Math.cos(EL), se = Math.sin(EL), ca = Math.cos(az), sa = Math.sin(az);
    _dir.set(ce * ca, se, ce * sa);
    camera.position.copy(target).addScaledVector(_dir, CAM_D);
    camera.lookAt(target);
    comp.m.uniforms.uWpx.value = viewH / H;
    const zd = viewMode ? 0.3 : !started ? 0.5 : [0.7, 0.58, 0.42][zoomIdx] || 0.5;
    fin.m.uniforms.uDof.value = REDUCED ? zd * 0.5 : zd;
  }

  const FACE_DIR = { L: [-1, 0], R: [1, 0], B: [0, -1], F: [0, 1] };
  let visKey = "";
  function cutaway(inside) {
    const vx = Math.cos(az), vz = Math.sin(az), rx = Math.sin(az), rz = -Math.cos(az);
    let key2 = "";
    for (const k of ["L", "R", "B", "F"]) {
      const d = FACE_DIR[k][0] * vx + FACE_DIR[k][1] * vz;
      const hide = started && inside && d > 0.2;
      for (const m of faceGroups[k]) m.visible = !hide;
      if (k === "F") for (const m of [...(faceGroups.door || []), ...(faceGroups.door2 || [])]) m.visible = !hide;
      key2 += hide ? "1" : "0";
    }
    for (const name in OCC) {
      const o = OCC[name];
      const dx = o.x - HC.x, dz = o.z - HC.z;
      const toward = dx * vx + dz * vz, lateral = dx * rx + dz * rz;
      const hide = started && toward > 1.5 && Math.abs(lateral) < o.w;
      for (const m of faceGroups["occ:" + name] || []) m.visible = !hide;
      key2 += hide ? "1" : "0";
    }
    /* a copa da cerejeira: some quando fica entre a câmera e a casa, menos
       quando o gato está no terreno vazio, embaixo dela */
    {
      const dx = TREE.x - HC.x, dz = TREE.z - HC.z;
      const hide = started && (inside || (dx * vx + dz * vz > 1.5 && Math.abs(dx * rx + dz * rz) < 2.4 && cat.x < LOT_W + 0.4));
      for (const m of faceGroups.sakura || []) m.visible = !hide;
      key2 += hide ? "1" : "0";
    }
    /* trechos da cerca que ficam entre a câmera e o gato, quando ele anda
       na calçada do outro lado da rua */
    let fx = null;
    if (started && !viewMode && vz > 0.15 && cat.z < FENCE.z && FENCE.z - cat.z < 2.5 && cat.y < 1.1) fx = cat.x + (vx / vz) * (FENCE.z - cat.z);
    for (let k = 0; k < FENCE.n; k += 1) {
      const cx = FENCE.x0 + (k + 0.5) * FENCE.seg;
      const hide = fx != null && Math.abs(cx - fx) < FENCE.seg * 1.25;
      for (const m of faceGroups["fence" + k] || []) m.visible = !hide;
      key2 += hide ? "1" : "0";
    }
    const wv = !(started && inside);
    wires.visible = wv;
    for (const b of birds) b.g.visible = wv;
    visKey = key2;
  }
  const _l = new THREE.Vector3();
  function placeLight() {
    const la = az + 0.55, le = 0.98;
    _l.set(Math.cos(le) * Math.cos(la), Math.sin(le), Math.cos(le) * Math.sin(la));
    key.position.set(HC.x + _l.x * 40, _l.y * 40, HC.z + _l.z * 40);
  }
  let shadowKey = "";

  /* ---------------------------------------------------------------------
     laço
     --------------------------------------------------------------------- */
  const _v2 = new THREE.Vector3();
  let last = performance.now(), clockT = 0;
  let camPin = null;
  const STARE = [
    ["(o gato olha pra você.) tá tudo bem aí do outro lado?", "(the cat looks at you.) everything all right on your side?"],
    ["(o gato olha pra câmera, depois pra estante, depois pra câmera de novo.)", "(the cat looks at the camera, then at the bookshelf, then at the camera again.)"],
  ];
  let stareN = 0;
  function animate(dt) {
    const t = clockT;
    /* gatos */
    const moving = started && !ended && !dlg.open && (keys.up || keys.down || keys.left || keys.right || (cat.grounded && Math.hypot(cat.vx, cat.vz) > 0.3));
    cat.stepY *= Math.max(0, 1 - dt * 14);
    if (Math.abs(cat.stepY) < 1e-3) cat.stepY = 0;
    cat.land = Math.max(0, cat.land - dt * 5);
    me.group.position.set(cat.x, cat.y + cat.stepY, cat.z);
    if (cat.talk > 0) { cat.talk = Math.max(0, cat.talk - dt); me.group.position.y += Math.sin((1 - cat.talk / 0.45) * Math.PI) * 0.06; }
    me.group.rotation.y = cat.face;
    me.group.rotation.z = cat.climb ? 1.05 : 0;
    me.group.visible = started;
    const wave = REDUCED ? 0 : Math.sin(t * 10);
    const jj = CATS.jiji;
    /* parado um tempo, o gato senta, se lambe e boceja; parado muito tempo,
       deita e fecha os olhos. Só enfeite: o cochilo de verdade é com X */
    const still = started && !ended && !dlg.open && !viewMode && !TOUR.on && !moving && cat.grounded && !cat.lying && !(cat.knead > 0) && !(cat.reach > 0) && !(cat.peek > 0) && !(cat.sniff > 0) && !(cat.paw > 0) && !(cat.talk > 0) && jj.mode !== "come" && jj.mode !== "blink";
    cat.idleT = still ? (cat.idleT || 0) + dt : 0;
    /* parado por um tempo, o gato olha para quem está jogando. No máximo duas
       vezes por visita, para não virar tique */
    if (cat.idleT === 0) cat.stared = false;
    else if (cat.idleT > 14 && !cat.stared && stareN < STARE.length && !REDUCED && !PIANO.cur && !PIANO.seq && !toyP.playing) { cat.stared = true; sayRead($b(...STARE[stareN++]), null, true); }
    const loaf = cat.idleT > 26, perch = cat.idleT > 5 && !loaf;
    let myPose = "stand";
    if (cat.knead > 0) { sitKitten(me, t, { lean: 0.32, paws: [wave * 0.5, -wave * 0.5], nod: 0.12 }); myPose = "busy"; }
    else if (cat.reach > 0) { sitKitten(me, t, { lean: 1.0, paws: [1.55, 1.15 + wave * 0.15] }); myPose = "busy"; }
    else if (cat.peek > 0) { poseKitten(me, t, false, true, 0); me.head.rotation.set(0, 0, -0.2); myPose = "busy"; }
    else if (perch) { sitKitten(me, t, {}); myPose = "sit"; }
    else if (loaf) { poseKitten(me, t, false, true, 0); me.torso.scale.set(1, REDUCED ? 1 : 1 + Math.sin(t * 1.6) * 0.04, 1); myPose = "lie"; }
    else if (cat.climb) {
      /* na escada: patas da frente e de trás alternando, como quem sobe */
      me.phase = cat.climb.phase;
      poseKitten(me, t, true, false, 0);
      me.legs.forEach((l, i) => { l.rotation.z = (i < 2 ? -0.5 : 0.35) + Math.sin(cat.climb.phase + (i % 2 ? Math.PI : 0)) * 0.55; });
      myPose = "walk";
    }
    else {
      poseKitten(me, t, moving, cat.lying, cat.grounded ? 0 : cat.vy);
      if (!cat.lying && cat.grounded && cat.land > 0 && !REDUCED) {
        const L = Math.sin(cat.land * Math.PI) * cat.land;
        me.torso.scale.set(1 + 0.12 * L, 1 - 0.22 * L, 1 + 0.12 * L);
        me.torso.position.y -= 0.025 * L;
        me.head.position.y -= 0.03 * L;
      }
      if (!cat.lying && cat.sniff > 0) { me.head.position.y -= 0.07; me.head.rotation.z = -0.4; }
      if (!cat.lying && cat.paw > 0) me.legs[0].rotation.z = 1.1 + wave * 0.2;
      myPose = cat.lying ? "lie" : moving || !cat.grounded ? "walk" : "stand";
    }
    /* cabeça inclinada ("gosta mesmo?") e a piscada para a câmera */
    if (cat.tilt > 0) { cat.tilt = Math.max(0, cat.tilt - dt); me.head.rotation.x = 0.42 * Math.min(1, cat.tilt * 3, (2.2 - cat.tilt) * 4); }
    idleTick(me.idle, dt, myPose === "sit" || (myPose === "stand" && cat.idleT > 1.5), myPose === "sit" ? ["groom", "yawn", "groom"] : null);
    const myIdleEye = idleApply(me, myPose, t);
    /* olhos do gato: deitado, vão pesando até fechar; com a Jiji por perto,
       ficam abertos e devolvem a piscada lenta */
    cat.lieT = cat.lying ? (cat.lieT || 0) + dt : 0;
    let myEye = cat.lying ? (cat.lieT > 2.6 ? 0 : 0.55) : cat.knead > 0 ? 0.35 : loaf ? (cat.idleT > 28.5 ? 0 : 0.5) : myIdleEye;
    if (jj.mode === "come") myEye = 1;
    if (jj.mode === "blink") myEye = slowEye(jj.blinkT - BLINK_ME);
    if (cat.wink > 0) { cat.wink = Math.max(0, cat.wink - dt); myEye = slowEye(2.0 - cat.wink); }
    catEyes(me, myEye, dt, jj.mode === "blink" || cat.wink > 0);
    /* gatos do bairro */
    const breath = REDUCED ? 1 : 1 + Math.sin(t * 1.6) * 0.04;
    for (const id in CATS) {
      const c = CATS[id], f = c.fig;
      if (c.hop > 0) c.hop = Math.max(0, c.hop - dt);
      f.group.position.set(c.x, c.y + (c.hop > 0 ? Math.sin((1 - c.hop / 0.32) * Math.PI) * 0.16 : 0), c.z);
      f.group.rotation.y = c.face;
      const held = busy(c);
      c.still = c.speed > 0.08 ? 0 : (c.still || 0) + dt;
      let pose;
      if (c.mode === "sleep") { poseKitten(f, c.t, false, true, 0); f.torso.scale.set(1, breath, 1); pose = "lie"; }
      else if (c.mode === "sit" || c.mode === "blink" || (c.mode === "wary" && c.speed < 0.08) || ((c.mode === "wander" || c.mode === "friend") && c.still > 1.2)) {
        sitKitten(f, c.t, { tilt: c.say > 0 || c.mode === "wary" ? 0.15 : 0, nod: c.mode === "blink" ? 0.1 : 0 });
        pose = "sit";
      } else { poseKitten(f, c.t, c.speed > 0.08, false, 0); pose = c.speed > 0.08 ? "walk" : "stand"; }
      const calmCat = !held && c.mode !== "wary" && c.mode !== "blink" && c.mode !== "come" && c.mode !== "zoom" && c.mode !== "circle";
      idleTick(f.idle, dt, (pose === "sit" || pose === "stand") && !held && c.mode !== "blink" && c.mode !== "come", calmCat ? (pose === "sit" ? ["groom", "yawn", "groom"] : pose === "stand" ? ["stretch", "yawn"] : null) : null);
      const idleEye = idleApply(f, pose, c.t);
      let eye = 0.85;
      if (c.mode === "sleep") eye = 0;
      else if (id === "mina" && c.mode === "sit") eye = 0.7;
      else if (id === "mike") eye = night ? 0.95 : 0.8;
      else if (c.mode === "zoom" || c.mode === "circle" || c.mode === "wary" || c.mode === "come") eye = 1;
      if (c.mode === "blink") eye = slowEye(c.blinkT - 0.6);
      else eye *= idleEye;
      catEyes(f, eye, dt, c.mode === "blink");
      const g2 = groundAt(c.x, c.z, c.y + 0.01);
      c.shadow.visible = isFinite(g2.y);
      if (c.shadow.visible) {
        c.shadow.position.set(c.x, g2.y + 0.007, c.z);
        c.shadow.scale.set(1.05, 0.75, 1);
        c.shadow.rotation.z = c.face;
        c.shadow.material.opacity = 0.28;
      }
      const dC = Math.hypot(cat.x - c.x, cat.z - c.z);
      const b = c.bubble;
      const show = started && !dlg.open && !viewMode && (c.say > 0 || (!c.talked && dC < 1.5 && c.mode !== "sleep") || (c.mode === "sleep" && dC < 1.5));
      b.visible = show;
      if (show) {
        b.material.map = c.mode === "sleep" ? BUB.dots : c.say > 0 ? BUB.heart : BUB.bang;
        b.position.set(c.x, c.y + 0.62 + Math.sin(t * 3 + c.t) * 0.02, c.z);
        b.scale.set(0.34, 0.27, 1);
      }
    }
    /* sombra de bolha */
    const g = groundAt(cat.x, cat.z, cat.y + 0.01);
    const hgt = Math.max(0, cat.y - g.y);
    const k = Math.max(0.35, 1 - hgt * 0.45);
    blobShadow.position.set(cat.x, g.y + 0.007, cat.z);
    blobShadow.scale.set(k * 1.1, k * 0.8, 1);
    blobShadow.rotation.z = cat.face;
    blobShadow.material.opacity = 0.32 * k;
    blobShadow.visible = started && isFinite(g.y);
    /* moradores: gestos de vez em quando, e o Masato acompanha o gato com o olhar */
    const mz = masato;
    resTick(RES.masato, dt, ["stretch", "sip", "scratch", "sip"], started && !dlg.open && !(NPC.masato.react > 0) && !cat.onKeys && !REDUCED);
    resTick(RES.tomoko, dt, ["page", "window", "page"], started && !dlg.open && !REDUCED);
    poseMasato(t);
    if (TLOOK.t > 0) TLOOK.t -= dt;
    poseTomoko(t);
    const dM = Math.hypot(cat.x - NPC.masato.x, cat.z - NPC.masato.z);
    const lookAt = started && dM < 2.2 ? Math.atan2(-(cat.z - NPC.masato.z), cat.x - NPC.masato.x) - NPC.masato.face : 0;
    let dl = ((lookAt + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    dl = Math.max(-1.1, Math.min(1.1, dl));
    mz.head.rotation.y += (dl - mz.head.rotation.y) * Math.min(1, dt * 5);
    for (const who of ["masato", "tomoko"]) {
      const n = NPC[who];
      const b = n.bubble;
      const reacting = who === "masato" && n.react > 0 && !dlg.open && !viewMode;
      const near = started && !dlg.open && !viewMode && Math.hypot(cat.x - n.x, cat.z - n.z) < 2.4 && Math.abs(cat.y - n.floor) < 1.4;
      b.visible = near || reacting;
      if (near || reacting) {
        b.material.map = reacting ? BUB.bang : who === "masato" ? (talkIdx >= TOPICS.length ? BUB.heart : BUB.bang) : BUB.dots;
        b.position.set(n.x, n.y + n.fig.top + 0.28 + Math.sin(t * 3) * 0.03, n.z);
      }
    }
    /* porta */
    for (const m of faceGroups.door || []) m.position.x = -1.3 * DOOR.open;
    for (const m of faceGroups.door2 || []) m.position.x = -2.49 * DOOR.open;
    /* bichos */
    for (const b of birds) {
      b.t -= dt;
      if (b.t <= 0 && b.hop <= 0) { b.hop = 1; b.from = b.x; b.to = b.base + (Math.random() - 0.5) * 0.5; b.t = 2 + Math.random() * 4; }
      let yy = 0;
      if (b.hop > 0) { b.hop = Math.max(0, b.hop - dt * 3); const u = 1 - b.hop; b.x = b.from + (b.to - b.from) * u; yy = Math.sin(u * Math.PI) * 0.12; }
      b.g.position.set(b.x, wireY(b.x, 7.6, 0.35) + yy + 0.005, STREET.z1 + 0.3);
    }
    for (const f of butterflies) {
      if (f.perch) {
        const hx = cat.x + Math.cos(cat.face) * 0.25, hz = cat.z - Math.sin(cat.face) * 0.25;
        f.g.position.lerp(_v2.set(hx, cat.y + 0.2, hz), Math.min(1, dt * 2.5));
        const fl = REDUCED ? 0.5 : 0.35 + Math.sin(t * 2.5) * 0.35;
        f.wl.rotation.x = fl; f.wr.rotation.x = -fl;
        continue;
      }
      const u = t * 0.5 + f.ph;
      f.g.position.set(f.cx + Math.sin(u * 0.7) * 1.4, G_LOT + 0.45 + Math.sin(u * 1.9) * 0.18, f.cz + Math.sin(u * 0.45) * 1.6);
      f.g.rotation.y = -u * 0.5;
      const flap = Math.sin(t * 18 + f.ph) * 0.9;
      f.wl.rotation.x = flap; f.wr.rotation.x = -flap;
    }
    for (const f of flies) {
      f.wait -= dt;
      if (f.wait <= 0) { f.q.set(-4 + Math.random() * 13, 0.8 + Math.random() * 1.1, STREET.z0 + 0.6 + Math.random() * 3.0); f.wait = 1.2 + Math.random() * 2.2; }
      f.p.lerp(f.q, Math.min(1, dt * 3.5));
      f.g.position.copy(f.p);
      f.g.position.y += Math.sin(t * 7 + f.wait) * 0.02;
      _v2.subVectors(f.q, f.p);
      if (_v2.lengthSq() > 1e-4) f.g.rotation.y = Math.atan2(-_v2.z, _v2.x);
    }
    /* vapor, poeira e luzinhas */
    const tub = { x: X(3.45), y: FL.bath + 0.6, z: Z(0.45) };
    for (const p of puffs) {
      p.t = (p.t + dt * 0.18) % 1;
      p.s.position.set(tub.x + Math.sin(p.t * 6 + p.s.id) * 0.12, tub.y + p.t * 0.9, tub.z + Math.cos(p.t * 5 + p.s.id) * 0.1);
      p.s.material.opacity = (night ? 0.3 : 0.45) * Math.sin(p.t * Math.PI);
      p.s.visible = !REDUCED;
    }
    for (const m of motes) {
      const u = t * 0.25;
      m.s.position.set(X((LIGHT.x0 + LIGHT.x1) / 2) + Math.sin(u + m.a) * 0.35, FL.mid + 0.3 + ((u * 0.3 + m.b) % 1.4), Z((LIGHT.z0 + LIGHT.z1) / 2) + Math.cos(u * 0.8 + m.b) * 0.35);
      m.s.visible = !REDUCED && !night;
    }
    if (night && !REDUCED) M.fairy.color.setHex(0xffcf6e).multiplyScalar(0.75 + 0.25 * Math.sin(t * 3));
    /* quem passa na rua */
    showStreet(t, started && !viewMode && catInside());
  }

  function blurPair(a, b, spreads) {
    for (const sp of spreads) {
      blur.m.uniforms.tSrc.value = a.texture;
      blur.m.uniforms.uDir.value.set(sp / a.width, 0);
      renderer.setRenderTarget(b);
      renderer.render(blur.sc, postCam);
      blur.m.uniforms.tSrc.value = b.texture;
      blur.m.uniforms.uDir.value.set(0, sp / a.height);
      renderer.setRenderTarget(a);
      renderer.render(blur.sc, postCam);
    }
  }
  /* controle (gamepad): analógico ou direcional anda, A pula (soltar cedo
     faz pulinho), X ou B mexe nas coisas, Y vê a casa de longe, LB e RB giram
     a câmera, Start começa. Nas conversas, A avança e o direcional escolhe */
  const GP = { held: {}, keys: {} };
  function padPoll() {
    const list = navigator.getGamepads ? navigator.getGamepads() : null;
    let gp = null;
    if (list) for (const g of list) if (g && g.connected) { gp = g; break; }
    const want = { up: false, down: false, left: false, right: false };
    const btn = (i) => !!(gp && gp.buttons[i] && gp.buttons[i].pressed);
    if (gp) {
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      want.left = ax < -0.35 || btn(14); want.right = ax > 0.35 || btn(15);
      want.up = ay < -0.35 || btn(12); want.down = ay > 0.35 || btn(13);
    }
    if (!dlg.open && !TOUR.on) for (const k in want) {
      if (want[k]) { keys[k] = true; GP.keys[k] = true; if (!started) begin(); }
      else if (GP.keys[k]) { keys[k] = false; GP.keys[k] = false; }
    }
    const edge = (i) => { const now = btn(i), was = !!GP.held[i]; GP.held[i] = now; return now && !was ? 1 : !now && was ? -1 : 0; };
    const a = edge(0), x = Math.max(edge(1), 0) || Math.max(edge(2), 0), y = edge(3), lb = edge(4), rb = edge(5), st = edge(9), du = edge(12), dd = edge(13);
    if (!gp) return;
    if (!started) { if (a > 0 || st > 0) begin(); return; }
    if (dlg.open) {
      if (a > 0 || x > 0) advance();
      else if (dlg.choices && du > 0) moveChoice(-1);
      else if (dlg.choices && dd > 0) moveChoice(1);
      return;
    }
    if (a > 0) jump(); else if (a < 0) jumpRelease();
    if (x > 0) act();
    if (y > 0) setView(!viewMode);
    if (lb > 0) rotate(-1);
    if (rb > 0) rotate(1);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = now; return; }
    watchSpeed(Math.min(200, now - last));
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    clockT += dt;
    U.time.value = REDUCED ? 0 : clockT;
    comp.m.uniforms.uTime.value = clockT;
    padPoll();
    if (started && !ended && !viewMode) step(dt);
    else if (!started && !REDUCED) azTarget += dt * 0.1;
    if (viewMode) viewStep(dt);
    if (started) stepWorld(dt);
    tickDialogue(dt);

    const k = REDUCED ? 1 : Math.min(1, dt * 6);
    az += (azTarget - az) * k;
    if (Math.abs(azTarget - az) < 1e-4) az = azTarget;
    const talking = dlg.open && dlg.focus && started && !viewMode;
    /* na conversa, a câmera chega perto: dá para ver a cara de quem fala */
    const vt = viewHTarget * (talking ? 0.66 : 1);
    viewH += (vt - viewH) * (REDUCED ? 1 : Math.min(1, dt * 3));
    /* andando, a câmera olha um pouco adiante do gato, para onde ele vai */
    const ahead = REDUCED || talking || !started ? 0 : 0.28;
    let fx = talking ? (cat.x + dlg.focus.x) / 2 : cat.x + cat.vx * ahead, fy = talking ? (cat.y + dlg.focus.y) / 2 : cat.y, fz = talking ? (cat.z + dlg.focus.z) / 2 : cat.z + cat.vz * ahead;
    if (camPin) { fx = camPin.x; fy = camPin.y; fz = camPin.z; }
    const kc = talking ? Math.min(1, dt * 3) : k;
    camT.x += (fx - camT.x) * kc;
    camT.y += (fy + 0.35 - (TOUR.on ? viewH * 0.13 : 0) - camT.y) * kc;
    camT.z += (fz - camT.z) * kc;
    const tgt = viewMode ? HOUSE_T : started ? camT : CENTER;
    placeCamera(tgt);
    placeLight();
    assignLamps(tgt.x, tgt.y, tgt.z);
    const inside = started && !viewMode && catInside();
    cutaway(inside);
    const cutGoal = inside ? Math.min(CUT_MAX, snapCut(cat.y + 1.9)) : 99;
    cutY += (cutGoal - cutY) * (REDUCED ? 1 : Math.min(1, dt * 6));
    if (Math.abs(cutGoal - cutY) < 0.002 || Math.abs(cutGoal - cutY) > 20) cutY = cutGoal;
    CLIP.constant = cutY;
    animate(dt);
    ambTick(dt);
    boxTick(dt);
    tourTick(dt);
    levelsTick();

    msgTick(dt);
    if (started) renderSide(false);

    /* a sombra só é recalculada quando algo que a projeta muda */
    const sk = `${az.toFixed(4)}|${cutY.toFixed(3)}|${night ? 1 : 0}|${visKey}`;
    if (sk !== shadowKey) { shadowKey = sk; renderer.shadowMap.needsUpdate = true; }

    if (rtScene) {
      renderer.setRenderTarget(rtScene);
      renderer.render(scene, camera);
      renderer.setRenderTarget(rtComp);
      renderer.render(comp.sc, postCam);
      renderer.setRenderTarget(rtA);
      renderer.render(bright.sc, postCam);
      blurPair(rtA, rtB, [1, 2]);
      renderer.setRenderTarget(rtC);
      renderer.render(down.sc, postCam);
      blurPair(rtC, rtD, [1, 2.2]);
      fin.m.uniforms.uTime.value = clockT;
      renderer.setRenderTarget(null);
      renderer.render(fin.sc, postCam);
    } else {
      renderer.setRenderTarget(null);
      renderer.setClearColor(night ? NIGHT.skyBot : DAY.skyBot, 1);
      renderer.render(scene, camera);
    }
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      /* a trilha descansa quando o jogo sai da tela, e volta quando ele volta */
      if (!MUS.api) return;
      if (!visible && MUS.api.state.playing) { MUS.auto = true; MUS.api.pause(false); }
      else if (visible && MUS.auto) { MUS.auto = false; if (!MUS.off) MUS.api.play(); }
    }, { rootMargin: "120px" }).observe(stage);
  }
  setNight(false);
  cutaway(false);
  applyLang();
  renderSide(true);
  renderNotebook();
  /* o botão EN do atlas troca o idioma do jogo também, sem recomeçar */
  window.addEventListener("nekolang", (e) => {
    const lang = e && e.detail && e.detail.lang === "en" ? "en" : "pt";
    if (lang === LANG) return;
    LANG = lang;
    applyLang();
    renderSide(true);
    renderNotebook();
    renderPlayer();
    relabelLevels();
    if (TOUR.on) { const t0 = TOUR.t; tourGo(TOUR.i); TOUR.t = t0; }
    if (dlg.open) {
      $("nk-dlg-name").textContent = $t(NAMES[dlg.lines[dlg.i].who]) || "";
      finishLine();
      if (dlg.choices) showChoices(dlg.choices);
    }
    if (msgTimer > 0) $("nk-msg").textContent = $t(lastMsg);
  });
  requestAnimationFrame(frame);

  /* para testes e para o modo de apresentação */
  window.NekoFrame = {
    get cat() { return { ...cat }; }, get goals() { return { ...goals }; }, get visited() { return [...visited]; }, get stats() { return { ...stats }; },
    get dialogue() { return { open: dlg.open, i: dlg.i, n: dlg.lines.length, who: dlg.open ? dlg.lines[dlg.i].who : null, text: $("nk-dlg-text").textContent, tr: $("nk-dlg-tr").textContent, talkIdx, near: nearNpc }; },
    get door() { return DOOR.open; },
    steer(dx, dz) { testDir = dx == null ? null : [dx, dz]; },
    get choices() { return dlg.choices ? dlg.choices.map((c) => c.label) : null; },
    pick(i) { pick(i); },
    quality(q) { AUTO_Q = false; QUALITY = q; CW = 0; resize(); },
    zoomTo(h) { viewHTarget = viewH = h; },
    project(x, y, z) { placeCamera(camT); camera.updateMatrixWorld(); const v = new THREE.Vector3(x, y, z).project(camera); return { x: MIRROR ? -v.x : v.x, y: v.y }; },
    wearHouse() { wearHouse(); },
    keys, jump, act, advance, rotate, begin, reset, zoom, setNight, setSound,
    place(x, y, z, face) { Object.assign(cat, { x, y, z, vy: 0, vx: 0, vz: 0, grounded: false, lying: false, climb: null, hop: null, buffer: 0, coyote: 0 }); if (face != null) cat.face = face; },
    jumpRelease() { jumpRelease(); },
    toyPiano(f) { toyPiano(!!f); },
    get piano() { return { ...PIANO, playing: toyP.playing, placed: toyP.placed, x: toyP.x, y: toyP.y, z: toyP.z }; },
    view(a) { az = azTarget = a; },
    snap() { camT.set(cat.x, cat.y + 0.35, cat.z); viewH = viewHTarget; const inside = catInside(); cutY = inside ? Math.min(CUT_MAX, snapCut(cat.y + 1.9)) : 99; },
    simulate(sec) { const n = Math.round(sec * 60); for (let i = 0; i < n; i += 1) { if (!viewMode) step(1 / 60); stepWorld(1 / 60); tickDialogue(1 / 60); msgTick(1 / 60); boxTick(1 / 60); } renderSide(true); return { ...cat }; },
    get extras() { return { ...extras }; },
    get secrets() { return { ...secrets }; },
    get cats() { const o = {}; for (const id in CATS) { const c = CATS[id]; o[id] = { x: c.x, y: c.y, z: c.z, mode: c.mode, friend: c.friend, talked: c.talked, calm: c.calm, blinkT: c.blinkT, open: c.fig.open }; } return o; },
    get vend() { return { ...VEND }; },
    get drops() { return drops.map((d) => ({ kind: d.kind, x: d.x, y: d.y, z: d.z, rest: d.rest })); },
    get item() { return hereItem ? hereItem.label : null; },
    get viewMode() { return viewMode; },
    get box() { return { ...BOXP }; },
    get reading() { return { hold: holdT, queue: bookQueue.map((q) => q[0]), resume: resumeMsg && resumeMsg[0], msg: $("nk-msg").classList.contains("on") ? lastMsg : null }; },
    get music() { return MUS.api ? MUS.api.state : null; },
    setView, toggleMusic, setVolume, skipTrack, knockShelf: () => knockShelf(true),
    catPlace(id, x, y, z) { Object.assign(CATS[id], { x, y, z }); },
    catSet(id, o) { Object.assign(CATS[id], { speed: 0 }, o); },
    giveYen(n) { VEND.yen += n; VEND.found = true; },
    pinCam(x, y, z) { camPin = x == null ? null : { x, y, z }; if (camPin) camT.set(x, y + 0.35, z); },
    girlStudio(x, z, pose, ph) {
      Object.assign(LIFE.girls, { on: false, studio: true, next: 1e9 });
      GIRLS.forEach((w, i) => {
        w.group.visible = true;
        w.group.position.set(x + i * 0.5, G_ST, z);
        w.group.scale.setScalar(1);
        w.yaw = 0.6; w.group.rotation.y = w.yaw;
        w.phase = (ph || 0) + i * 1.3;
        if (pose === "crouch") poseCrouch(w, 0, 1);
        else if (pose === "look") poseLook(w, 0);
        else if (pose === "wave") poseWave(w, 0);
        else poseWalk(w, 0.8);
      });
    },
    get piano() { return { placed: toyP.placed, playing: toyP.playing, x: toyP.x, y: toyP.y, z: toyP.z }; },
    /* gesto parado numa fase u (0 a 1), para as fotos de teste; freeze false solta */
    idle(id, kind, u, freeze) { const f = id === "me" ? me : CATS[id].fig, s2 = f.idle; if (kind) { idleDo(s2, kind); s2.actT = s2.dur * (1 - (u || 0)); } s2.freeze = freeze !== false && u != null; return { kind: s2.kind, actT: s2.actT }; },
    res(who, kind, u, freeze) { const r = RES[who]; if (kind) { resDo(r, kind); r.t = r.dur * (1 - (u || 0)); } r.freeze = freeze !== false && u != null; return { kind: r.kind, t: r.t }; },
    idleFor(sec) { cat.idleT = sec; },
    face(who, mood) { const f = PORTRAIT[who]; return f.skin ? personFace(f, mood) : kittenFace(f, mood); },
    /* vista de cima, cortada na altura cut, para conferir com as plantas:
       para cima é +x (a), para a direita é +z (b); devolve PNG em data URL */
    planShot(cut, x0, z0, x1, z1, pw, ph) {
      const cam = new THREE.OrthographicCamera(-(z1 - z0) / 2, (z1 - z0) / 2, (x1 - x0) / 2, -(x1 - x0) / 2, 0.1, 200);
      cam.position.set((x0 + x1) / 2, 60, (z0 + z1) / 2);
      cam.up.set(1, 0, 0);
      cam.lookAt((x0 + x1) / 2, 0, (z0 + z1) / 2);
      cam.updateProjectionMatrix();
      const saved = [];
      for (const k in faceGroups) for (const m of faceGroups[k]) { saved.push([m, m.visible]); m.visible = true; }
      const hide = [me.group, blobShadow, ...Object.values(CATS).map((c) => c.fig.group), masato.group, tomoko.group, wires];
      for (const o of hide) { saved.push([o, o.visible]); o.visible = false; }
      const oc = CLIP.constant;
      CLIP.constant = cut;
      renderer.setRenderTarget(null);
      renderer.setSize(pw, ph, false);
      renderer.setClearColor(0xffffff, 1);
      renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, cam);
      const url = renderer.domElement.toDataURL("image/png");
      CLIP.constant = oc;
      for (const [o, v] of saved) o.visible = v;
      CW = 0;
      resize();
      renderer.shadowMap.needsUpdate = true;
      return url;
    },
    /* vista em elevação, sem corte: side "w" olha da rua (oeste), "e" dos fundos, "n" do terreno vazio, "s" do sul */
    elevShot(side, u0, u1, h0, h1, pw, ph, near) {
      const w = u1 - u0, hh = h1 - h0;
      const cam = new THREE.OrthographicCamera(-w / 2, w / 2, hh / 2, -hh / 2, near || 0.1, 300);
      const uc = (u0 + u1) / 2, hc = (h0 + h1) / 2;
      if (side === "w") { cam.position.set(uc, hc, 120); cam.lookAt(uc, hc, 0); }
      else if (side === "e") { cam.position.set(uc, hc, -120); cam.lookAt(uc, hc, 0); }
      else if (side === "n") { cam.position.set(120, hc, uc); cam.lookAt(0, hc, uc); }
      else { cam.position.set(-120, hc, uc); cam.lookAt(0, hc, uc); }
      cam.updateProjectionMatrix();
      const saved = [];
      for (const k in faceGroups) for (const m of faceGroups[k]) { saved.push([m, m.visible]); m.visible = true; }
      const hide = [me.group, blobShadow, ...Object.values(CATS).map((c) => c.fig.group), masato.group, tomoko.group, wires];
      for (const o of hide) { saved.push([o, o.visible]); o.visible = false; }
      const oc = CLIP.constant;
      CLIP.constant = 99;
      renderer.setRenderTarget(null);
      renderer.setSize(pw, ph, false);
      renderer.setClearColor(0xffffff, 1);
      renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, cam);
      const url = renderer.domElement.toDataURL("image/png");
      CLIP.constant = oc;
      for (const [o, v] of saved) o.visible = v;
      CW = 0;
      resize();
      renderer.shadowMap.needsUpdate = true;
      return url;
    },
    /* depuração: o que está sob um ponto da tela (0 a 1), com a imagem espelhada */
    pick(u, v) {
      const rc = new THREE.Raycaster();
      rc.setFromCamera(new THREE.Vector2((MIRROR ? -1 : 1) * (u * 2 - 1), -(v * 2 - 1)), camera);
      const hits = rc.intersectObjects(scene.children, true).filter((h) => h.object.visible && h.object.isMesh);
      return hits.slice(0, 4).map((h) => ({ mat: h.object.userData.mat || h.object.name || h.object.type, group: h.object.userData.group || null, a: +(h.point.x - BX).toFixed(2), b: +(h.point.z - BZ).toFixed(2), h: +(h.point.y - GL0).toFixed(2) }));
    },
    tour(i) { if (i == null) tourEnd(); else { if (!TOUR.on) tourStart(); tourGo(i); } return { on: TOUR.on, i: TOUR.i }; },
    levels(v) { setLevels(v); return LEVELS.on; },
    get notebook() { return { found: Object.keys(secrets).filter((k) => secrets[k] || seenBefore.has(k)), n: $("nk-secret-n").textContent }; },
    get amb() { return { started: !!AMB.bed, ...AMB.count }; },
    get residents() { return { masato: { ...RES.masato }, tomoko: { ...RES.tomoko }, mug: deskMug.position.toArray(), sip: SIP }; },
    catFig(id) { const f = id === "me" ? me : CATS[id].fig; const out = []; f.group.traverse((o) => { if (o.isMesh || o.isLineSegments) { const w = new THREE.Vector3(); o.getWorldPosition(w); out.push([o.type, o.visible, w.toArray().map((v) => +v.toFixed(3)), o.geometry.attributes.position.count]); } }); return { pos: f.group.position.toArray(), vis: f.group.visible, parts: out }; },
    get street() { const b = LIFE.bike, g = LIFE.girls; return { bike: { on: b.on, x: b.x, z: b.z, v: b.v, dir: b.dir, passes: b.passes, next: b.next }, girls: { on: g.on, x: g.x, z: g.z, state: g.state, dir: g.dir, passes: g.passes, met: [...g.met], next: g.next } }; },
    spawnStreet(kind, dir) { const s = LIFE[kind]; if (!s) return; s.next = 0; if (kind === "bike") startBike(); else startGirls(); if (dir && s.on) { s.dir = dir; s.x = dir > 0 ? EDGE.x0 : EDGE.x1; if (kind === "bike") s.lane = s.z = dir > 0 ? LANE.bikeE : LANE.bikeW; } },
    info() {
      let tris = 0, meshes = 0;
      scene.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.attributes.position) { meshes += 1; tris += o.geometry.attributes.position.count / 3; } });
      return { tris, meshes, W, H, CW, CH, QUALITY, solids: solids.length, lamps: LAMPS.length, pool: lampLights.length };
    },
    world: { BX, BZ, LV, FL, GL0, PLAT, NPC: { masato: { x: NPC.masato.x, z: NPC.masato.z }, tomoko: { x: NPC.tomoko.x, z: NPC.tomoko.z } }, LIGHT: { x0: X(LIGHT.x0), x1: X(LIGHT.x1), z0: Z(LIGHT.z0), z1: Z(LIGHT.z1) }, CAT_STEPS: CAT_STEPS.map(([z0, z1, top]) => ({ x: X(0.56), z: Z((z0 + z1) / 2), top })), TREADS: TREADS.map(([z0, z1, top]) => ({ x: X(0.83), z: Z((z0 + z1) / 2), top })), LADDER: { x: X((LAD.a0 + LAD.a1) / 2), z: Z(LAD.bc), top: FL.r1, strip: Z(4.47) }, DOOR: { x: X(4.35), z: Z(6.45) }, STRAY, START, LOT_W, LOT_D },
  };
})();
