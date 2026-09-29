/* A norma: presets da calculadora, comparações e as regras que não são métricas.

   Tudo que depende de medida é desenhado pelo motor de escala (assets/draw.js)
   a partir dos parâmetros declarados aqui. As figuras que restam como desenho
   fixo são topológicas, não métricas: descrevem uma relação, não uma dimensão.

   Base legal: 建築基準法 (Lei nº 201 de 1950) e 都市計画法. Conferir o texto
   vigente no e-Gov e o mapa urbanístico de Tóquio antes de citar qualquer valor. */

window.NEKO_RULES = {
  sources: {
    egov: "https://laws.e-gov.go.jp/law/325AC0000000201",
    translation: "https://www.japaneselawtranslation.go.jp/en/laws/view/4024/en",
    tokyoMap: "https://www.toshiseibi.metro.tokyo.lg.jp/web/keikaku/map/",
  },

  defs: `<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute"><defs>
    <pattern id="hatchGround" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="8" stroke="#8fa2b4" stroke-width="1"/>
    </pattern>
    <pattern id="hatchNeighbour" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <rect width="7" height="7" fill="#f2f5f8"/>
      <line x1="0" y1="0" x2="0" y2="7" stroke="#c3ceda" stroke-width="1"/>
    </pattern>
    <pattern id="hatchLost" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill="#f7ece7"/>
      <line x1="0" y1="0" x2="0" y2="6" stroke="#c98d75" stroke-width="1.3"/>
    </pattern>
    <marker id="dimTick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="9" markerHeight="9" orient="auto">
      <line x1="2.5" y1="7.5" x2="7.5" y2="2.5" stroke="#a65f47" stroke-width="1.4"/>
    </marker>
    <marker id="arrowHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0.5 1.5 L9 5 L0.5 8.5 Z" fill="#10264a"/>
    </marker>
    <marker id="leaderDot" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5">
      <circle cx="4" cy="4" r="2.2" fill="#56657a"/>
    </marker>
  </defs></svg>`,

  /* Estado inicial da calculadora: um microlote plausível de Setagaya,
     com frente de 5 m, profundidade de 10 m e viela de 3,6 m. */
  defaultInput: {
    zoneKey: "l1", front: 5, depth: 10, roadWidth: 3.6,
    bcr: 50, far: 100, absoluteHeight: 10, corner: false, fireproof: false,
  },

  /* Comparações: dois estados do mesmo lote, com uma variável trocada.
     Cada painel é desenhado na mesma escala, então a diferença é legível. */
  comparisons: [
    {
      key: "via",
      ja: "前面道路幅員による容積率制限",
      title: "A largura da via decide o aproveitamento",
      article: "art. 52, § 2",
      lede: "Mesmo lote, mesma zona, mesmo coeficiente designado. Muda só a via frontal. Em zona residencial o teto é a largura vezes 0,4, e prevalece o menor entre ele e o designado no plano.",
      a: { label: "viela de 3,6 m", input: { zoneKey: "j1", front: 5, depth: 10, roadWidth: 3.6, bcr: 60, far: 200 } },
      b: { label: "via de 6 m", input: { zoneKey: "j1", front: 5, depth: 10, roadWidth: 6, bcr: 60, far: 200 } },
      read: "Na viela, o recuo do art. 42 § 2 ainda retira solo do cálculo antes de o teto ser aplicado. A perda aparece duas vezes: no denominador e no coeficiente.",
    },
    {
      key: "zona",
      ja: "用途地域",
      title: "A zona muda o teto e o envelope",
      article: "arts. 52, 53, 55 e 56",
      lede: "Mesmo lote e mesma via, em zona exclusiva de baixa altura e em zona residencial comum. Na primeira valem a altura absoluta e o plano do lado norte; na segunda, nenhum dos dois.",
      a: { label: "baixa altura I · 10 m", input: { zoneKey: "l1", front: 5, depth: 10, roadWidth: 4, bcr: 50, far: 100, absoluteHeight: 10 } },
      b: { label: "residencial I", input: { zoneKey: "j1", front: 5, depth: 10, roadWidth: 4, bcr: 60, far: 200 } },
      read: "Na zona de baixa altura o envelope é cortado por cima e pelo fundo. O ganho de área da zona residencial não vem de um lote maior, vem de duas regras que deixam de incidir.",
    },
    {
      key: "esquina",
      view: "plan",
      metric: "footprint",
      ja: "角地緩和",
      title: "A esquina e o fogo somam ocupação",
      article: "art. 53, §§ 3 e 6",
      lede: "Mesmo lote, mesma zona. No segundo caso a autoridade local reconhece a condição de esquina e a edificação é resistente ao fogo em zona de prevenção.",
      a: { label: "meio de quadra", input: { zoneKey: "j1", front: 5, depth: 10, roadWidth: 4, bcr: 60, far: 200, corner: false, fireproof: false } },
      b: { label: "esquina + resistente ao fogo", input: { zoneKey: "j1", front: 5, depth: 10, roadWidth: 4, bcr: 60, far: 200, corner: true, fireproof: true } },
      read: "Vinte pontos percentuais de ocupação, no mesmo solo. Num lote de 50 m² isso é dez metros quadrados de projeção, o tamanho de um quarto.",
    },
  ],

  /* Regras topológicas: a figura descreve uma relação, não uma medida.
     As que têm dimensão são desenhadas em escala pelo motor. */
  cards: [
    {
      ja: "接道義務と路地状敷地", romaji: "setsudō gimu / rojijō shikichi", pt: "Testada mínima e lote em corredor",
      article: "Lei de Padrões de Construção, arts. 42, 43 e 40, e Regulamento de Segurança Construtiva de Tóquio, art. 3",
      summary: "A lei nacional exige que o lote confronte por pelo menos 2 m uma via reconhecida. Em Tóquio o regulamento local aperta a regra em função do comprimento do corredor: até 20 m bastam 2 m de largura; acima disso são exigidos 3 m. Para edificação não resistente ao fogo com mais de 200 m² de área construída, os valores sobem para 3 m e 4 m.",
      micro: "O corredor nasce colado a uma divisa, porque é recortado da parcela da frente quando um lote profundo é desmembrado. Ele entra na área do lote e divide BCR e FAR, mas não pode ser edificado. E a exigência é municipal, não nacional: Yokohama, Nagoya e Osaka usam limiares diferentes, então o número não se transporta de uma cidade para outra. [VERIFICAR no ward]",
      figure: {
        kind: "parcel", caption: "planta · desmembramento que produz o corredor", scaleMeters: 5,
        mx: 31, my: 21,
        aria: "Planta de quadra onde um lote profundo é desmembrado em parcela de frente e parcela de fundo, esta ligada à via por um corredor de dois metros encostado na divisa",
        shapes: [
          { type: "rect", x: 0, y: 0, w: 15.5, h: 17.5, cls: "d-neighbour" },
          { type: "rect", x: 0, y: 17.5, w: 15.5, h: 3.5, cls: "d-road" },
          { type: "text", x: 7.7, y: 19.8, text: "via de 4 m", cls: "d-label" },
          { type: "rect", x: 5.5, y: 9.5, w: 7.87, h: 8, cls: "d-neighbour" },
          { type: "text", x: 10.9, y: 14.2, text: "parcela", cls: "d-note" },
          { type: "text", x: 10.9, y: 15.899999999999999, text: "da frente", cls: "d-note" },
          { type: "rect", x: 5.5, y: 3.5, w: 7.87, h: 6, cls: "d-lot" },
          { type: "rect", x: 5.5, y: 9.5, w: 2, h: 8, cls: "d-lot" },
          { type: "rect", x: 6.1, y: 4.3, w: 6.2, h: 4.4, cls: "d-built" },
          { type: "text", x: 9.2, y: 6.8, text: "casa", cls: "d-label-inv" },
          { type: "dimH", x0: 5.5, x1: 7.5, y: 2.9, text: "2,0 m" },
          { type: "dimV", y0: 9.5, y1: 17.5, x: 4.6, text: "8,0 m" },
          { type: "line", x0: 5.5, y0: 3.1, x1: 5.5, y1: 9.5, cls: "d-axis-dash" },
          { type: "line", x0: 7.5, y0: 3.1, x1: 7.5, y1: 9.5, cls: "d-axis-dash" },
          { type: "text", x: 16.6, y: 5.4, text: "até 20 m de corredor: 2 m", cls: "d-note-blue d-left" },
          { type: "text", x: 16.6, y: 7.2, text: "acima de 20 m: 3 m", cls: "d-note-blue d-left" },
          { type: "text", x: 16.6, y: 9.0, text: "Regulamento de Tóquio, art. 3", cls: "d-note d-left" },
          { type: "text", x: 16.6, y: 12.2, text: "o corredor conta na área do lote", cls: "d-note-alert d-left" },
          { type: "text", x: 16.6, y: 14.0, text: "e não pode ser edificado", cls: "d-note-alert d-left" },
        ],
      },
    },
    {
      ja: "天空率", romaji: "tenkūritsu", pt: "Taxa de céu como alternativa",
      article: "Lei de Padrões de Construção, art. 56, § 7",
      summary: "Permite dispensar os planos inclinados se a porção de céu visível a partir de pontos de medição for igual ou maior que a do volume que cumpriria esses planos.",
      micro: "É a brecha que devolve liberdade de forma ao projeto. Troca-se o recorte geométrico por uma equivalência de céu medida ponto a ponto, e a seção deixa de ser escalonada por obrigação.",
      figure: {
        kind: "static",
        svg: `<svg viewBox="0 0 360 230" role="img" aria-label="Comparação entre a porção de céu deixada pelo volume regulamentar e pelo volume proposto">
          <text x="14" y="18" class="d-note d-left">comparação · relação, não medida</text>
          <text x="180" y="40" class="d-note">valores ilustrativos, medidos do mesmo ponto</text>
          <path d="M26 168 A72 72 0 0 1 170 168 Z" class="d-sky"/>
          <path d="M62 168 L62 112 L134 88 L134 168 Z" class="d-built"/>
          <circle cx="98" cy="168" r="3.4" fill="#a65f47"/>
          <text x="98" y="190" class="d-note">volume conforme os planos</text>
          <text x="98" y="208" class="d-label">céu livre 62%</text>
          <path d="M190 168 A72 72 0 0 1 334 168 Z" class="d-sky"/>
          <path d="M212 168 L212 122 L248 104 L248 140 L294 140 L294 168 Z" class="d-built"/>
          <circle cx="262" cy="168" r="3.4" fill="#a65f47"/>
          <text x="262" y="190" class="d-note">volume proposto</text>
          <text x="262" y="208" class="d-label">céu livre 64%</text>
          <text x="180" y="226" class="d-note-blue">passa se a porção de céu for igual ou maior</text>
        </svg>`,
      },
    },
    {
      ja: "防火地域・準防火地域", romaji: "bōka chiiki / jun bōka chiiki", pt: "Zonas de prevenção contra incêndio",
      article: "Lei de Padrões de Construção, art. 61, e Lei de Planejamento Urbano, art. 9",
      summary: "Delimitam onde a edificação precisa ser resistente ao fogo ou semirresistente, conforme a altura e a área construída. Em Tóquio cobrem grande parte do tecido denso de madeira.",
      micro: "Muda o sistema construtivo e o custo por metro quadrado, e é uma das razões pelas quais a estrutura metálica aparece com frequência nas microcasas. Também é o que abre o acréscimo de ocupação do art. 53.",
      figure: {
        kind: "static",
        svg: `<svg viewBox="0 0 360 230" role="img" aria-label="Esquema de zoneamento com a zona de prevenção contra incêndio e a zona semirresistente separadas por um limite">
          <text x="14" y="18" class="d-note d-left">esquema de zoneamento · relação, não medida</text>
          <rect x="18" y="38" width="160" height="140" class="d-alert-soft"/>
          <rect x="182" y="38" width="160" height="140" class="d-soft-fill"/>
          <line x1="180" y1="38" x2="180" y2="178" class="d-axis-dash"/>
          <text x="98" y="62" class="d-label-alert">防火地域</text>
          <text x="98" y="78" class="d-note-alert">bōka chiiki</text>
          <rect x="52" y="96" width="92" height="48" class="d-built"/>
          <text x="98" y="124" class="d-label-inv">resistente</text>
          <text x="98" y="166" class="d-note-alert">estrutura incombustível</text>
          <text x="262" y="62" class="d-label">準防火地域</text>
          <text x="262" y="78" class="d-note">jun bōka chiiki</text>
          <rect x="216" y="96" width="92" height="48" class="d-built-open"/>
          <text x="262" y="124" class="d-label">semirresistente</text>
          <text x="262" y="166" class="d-note">exigência menor</text>
          <text x="180" y="202" class="d-note">a exigência varia com altura e área construída</text>
          <text x="180" y="220" class="d-note-blue">na zona de prevenção, a ocupação pode receber +10 pontos</text>
        </svg>`,
      },
    },
    {
      ja: "既存不適格", romaji: "kizon futekikaku", pt: "Edificação legalmente desconforme",
      article: "Lei de Padrões de Construção, art. 3, § 2",
      summary: "Edificações e lotes que eram regulares quando construídos e deixaram de sê-lo por mudança da norma continuam legais, mas ficam sujeitos às regras vigentes quando se reconstrói ou amplia.",
      micro: "Muitos lotes abaixo do mínimo atual estão nessa condição. É o que explica a existência de microlotes onde a norma vigente não permitiria criá-los, e por que a reconstrução é o momento crítico.",
      figure: {
        kind: "static",
        svg: `<svg viewBox="0 0 360 230" role="img" aria-label="Linha do tempo entre a construção conforme, a mudança da norma e o envelope reduzido da reconstrução">
          <text x="14" y="18" class="d-note d-left">linha do tempo · relação, não medida</text>
          <line x1="18" y1="160" x2="342" y2="160" class="d-ground"/>
          <rect x="34" y="78" width="100" height="82" class="d-built"/>
          <line x1="34" y1="106" x2="134" y2="106" class="d-floor"/>
          <line x1="34" y1="134" x2="134" y2="134" class="d-floor"/>
          <text x="84" y="184" class="d-note">construída conforme</text>
          <text x="84" y="200" class="d-note">a norma da época</text>
          <line x1="180" y1="44" x2="180" y2="174" class="d-axis-dash"/>
          <text x="180" y="36" class="d-note-alert">a norma muda</text>
          <rect x="226" y="78" width="100" height="82" class="d-ghost"/>
          <rect x="244" y="102" width="64" height="58" class="d-outline-alert"/>
          <text x="276" y="184" class="d-note-alert">permanece legal, mas o envelope</text>
          <text x="276" y="200" class="d-note-alert">da reconstrução encolhe</text>
        </svg>`,
      },
    },
  ],
};
