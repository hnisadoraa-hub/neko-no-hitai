/* Camada de interface do atlas: barra de seções, abas, filtros por faixa,
   glossário no cursor, gaveta de ficha, citação do recorte, modo apresentação,
   barra de leitura, comparação com a casa de quem lê e a versão em inglês.

   Tudo aqui é interface. Nenhum número é calculado neste arquivo: os dados vêm
   de window.NekoAtlas (app.js), de window.NEKO_CITY e de window.NEKO_BIBLIO. */

(function () {
  "use strict";

  const A = window.NekoAtlas;
  if (!A) return;
  const $ = (id) => document.getElementById(id);
  const fmt = A.fmt;

  /* =====================================================================
     1. Barra de seções
     ===================================================================== */

  function sectionBar() {
    const sections = [...document.querySelectorAll("main .section[data-section-label]")];
    const list = $("section-links");
    if (!list || !sections.length) return;
    list.innerHTML = sections.map((s, i) => `
      <li><a href="#${s.id}" data-section-link="${s.id}"><span>${String(i).padStart(2, "0")}</span>${s.dataset.sectionLabel}</a></li>`).join("");

    const current = $("section-current");
    const links = new Map([...list.querySelectorAll("[data-section-link]")].map((a) => [a.dataset.sectionLink, a]));
    let active = null;
    const setActive = (id) => {
      if (id === active) return;
      active = id;
      links.forEach((a, key) => a.classList.toggle("current", key === id));
      const section = sections.find((s) => s.id === id);
      if (current && section) current.textContent = section.dataset.sectionLabel;
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.15, 0.4, 0.75] });
    sections.forEach((s) => observer.observe(s));

    const toggle = $("section-menu-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = document.body.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      list.addEventListener("click", (e) => {
        if (e.target.closest("a")) {
          document.body.classList.remove("nav-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  /* =====================================================================
     2. Abas
     ===================================================================== */

  function tabs() {
    document.querySelectorAll("[data-tabs]").forEach((group) => {
      const tabList = group.querySelectorAll('[role="tab"]');
      const select = (tab) => {
        tabList.forEach((t) => {
          const on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        group.dispatchEvent(new CustomEvent("tabchange", { detail: { id: tab.id } }));
      };
      tabList.forEach((tab, i) => {
        tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
        tab.addEventListener("click", () => select(tab));
        tab.addEventListener("keydown", (e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          e.preventDefault();
          const next = tabList[(i + (e.key === "ArrowRight" ? 1 : tabList.length - 1)) % tabList.length];
          next.focus();
          select(next);
        });
      });
    });
  }

  /* =====================================================================
     3. Glossário no cursor
     ===================================================================== */

  const GLOSSARY = [
    { key: "kenpeiritsu", cat: "norma", ja: "建ぺい率", romaji: "kenpeiritsu", pt: "taxa de ocupação do lote, BCR",
      def: "Projeção da edificação dividida pela área do lote. O valor designado vem da zona de uso e do plano urbano; art. 53 da Lei de Padrões de Construção admite acréscimos em lote de esquina e em edificação resistente ao fogo dentro de zona de prevenção.",
      patterns: ["建ぺい率", "kenpeiritsu"] },
    { key: "yosekiritsu", cat: "norma", ja: "容積率", romaji: "yōsekiritsu", pt: "coeficiente de aproveitamento, FAR",
      def: "Área construída dividida pela área do lote. Além do valor designado por zona, o art. 52 limita o FAR pela largura da via frontal quando ela tem menos de 12 m.",
      patterns: ["容積率", "yōsekiritsu", "yosekiritsu"] },
    { key: "shasen", cat: "norma", ja: "斜線制限", romaji: "shasen seigen", pt: "restrição por plano inclinado",
      def: "Planos inclinados que cortam o volume a partir da via, da divisa norte ou da zona vizinha. Não é altura máxima: é uma superfície que o edifício não pode atravessar.",
      patterns: ["斜線制限", "斜線", "shasen"] },
    { key: "nichiei", cat: "norma", ja: "日影規制", romaji: "nichiei kisei", pt: "regulação de sombreamento",
      def: "Limite de horas de sombra projetada sobre os lotes vizinhos em um dia de referência do inverno. Incide sobre edifícios acima de certa altura, conforme a zona e o município.",
      patterns: ["日影規制", "日影", "nichiei"] },
    { key: "tenkuritsu", cat: "norma", ja: "天空率", romaji: "tenkūritsu", pt: "índice de céu visível",
      def: "Procedimento alternativo às restrições de plano inclinado: compara o céu visível do projeto com o do volume permitido pela regra padrão. Se o projeto deixa ver mais céu, pode escapar do plano inclinado.",
      patterns: ["天空率", "tenkūritsu"] },
    { key: "hatazao", cat: "solo", ja: "旗竿敷地", romaji: "hatazao shikichi", pt: "lote em bandeira",
      def: "Lote cujo acesso à via é um corredor estreito, o cabo da bandeira. Aparece na subdivisão de lotes profundos e costuma vir acompanhado de restrições de iluminação e de acesso de veículos.",
      patterns: ["旗竿敷地", "旗竿地", "lote em bandeira", "hatazao"] },
    { key: "kizon", cat: "solo", ja: "既存不適格", romaji: "kizon futekikaku", pt: "existente em desconformidade",
      def: "Edificação ou lote legal quando foi aprovado e que deixou de atender a uma regra posterior. Não é irregularidade: é anterioridade. Lotes abaixo do mínimo atual costumam estar nessa condição.",
      patterns: ["既存不適格", "kizon futekikaku"] },
    { key: "bunpitsu", cat: "solo", ja: "分筆", romaji: "bunpitsu", pt: "subdivisão registral",
      def: "Divisão de uma matrícula em duas ou mais. É ato de registro: não cria automaticamente lotes edificáveis, porque a conformidade é verificada depois, no 建築確認.",
      patterns: ["分筆", "bunpitsu"] },
    { key: "kakunin", cat: "norma", ja: "建築確認", romaji: "kenchiku kakunin", pt: "confirmação de conformidade",
      def: "Exame prévio que verifica se o projeto atende às regras aplicáveis à parcela. É o momento em que a norma encontra o lote concreto.",
      patterns: ["建築確認", "kenchiku kakunin"] },
    { key: "kyosho", cat: "medida", ja: "狭小住宅", romaji: "kyōshō jūtaku", pt: "casa muito pequena",
      def: "Casa produzida sob condição espacial severamente reduzida. O atlas não usa o termo como sinônimo de microlote: microlote é recorte de área de solo, kyōshō jūtaku é categoria da cultura arquitetônica.",
      patterns: ["狭小住宅", "kyōshō jūtaku", "kyosho jutaku", "kyōsho jūtaku"] },
    { key: "ie", cat: "casa", ja: "家", romaji: "ie", pt: "casa e linhagem doméstica",
      def: "Designa a casa e também a unidade familiar com continuidade no tempo. Traduzir por casa apaga a segunda camada.",
      patterns: ["家（ie）"] },
    { key: "katei", cat: "casa", ja: "家庭", romaji: "katei", pt: "lar, esfera familiar",
      def: "Aproxima-se de lar: a esfera afetiva e doméstica da família moderna, formulada no Japão a partir de Meiji.",
      patterns: ["katei"] },
    { key: "jutaku", cat: "medida", ja: "住宅", romaji: "jūtaku", pt: "residência, habitação",
      def: "Nomeia a residência também como categoria material e administrativa, a que aparece nas estatísticas e nos planos.",
      patterns: ["住宅"] },
    { key: "agarikamachi", cat: "casa", ja: "上がり框", romaji: "agarikamachi", pt: "soleira do genkan",
      def: "Peça de madeira que marca o degrau entre o piso de entrada e o piso da casa. É o limite onde se tiram os sapatos: um limiar de altura mínima e consequência máxima.",
      patterns: ["上がり框", "agarikamachi"] },
    { key: "tsubo", cat: "medida", ja: "坪", romaji: "tsubo", pt: "unidade de área",
      def: "Unidade tradicional de área equivalente a cerca de 3,31 m², usada no mercado imobiliário e nos nomes de casas, como a Six-Tsubo House. Em qualquer lugar desta página, digite tsubo: o atlas inteiro troca de unidade.",
      patterns: ["坪", "tsubo"] },
    { key: "nldk", cat: "medida", ja: "nLDK", romaji: "nLDK", pt: "notação de programa",
      def: "Notação de mercado: n quartos mais sala, refeição e cozinha. Virou ideologia de planta ao fixar a família nuclear como unidade de projeto.",
      patterns: ["nLDK"] },
    { key: "shokushin", cat: "casa", ja: "食寝分離", romaji: "shokushin bunri", pt: "separar comer e dormir",
      def: "Princípio formulado por Nishiyama Uzō em 1942: o espaço de dormir deve se separar do de comer. Organiza boa parte da política habitacional do pós-guerra.",
      patterns: ["食寝分離", "shokushin bunri"] },
    { key: "minikaihatsu", cat: "solo", ja: "ミニ開発", romaji: "mini-kaihatsu", pt: "mini loteamento",
      def: "Definido pelo Governo Metropolitano em 1977: loteamento de gleba menor que 1.000 m² cuja maior parte é dividida em parcelas abaixo de 100 m².",
      patterns: ["ミニ開発", "mini-kaihatsu"] },
    { key: "yotochiiki", cat: "norma", ja: "用途地域", romaji: "yōto chiiki", pt: "zona de uso",
      def: "As doze zonas de uso da Lei de Planejamento Urbano. Cada uma traz usos admitidos e a faixa de valores designáveis de ocupação, aproveitamento e altura.",
      patterns: ["用途地域", "yōto chiiki"] },
    { key: "saiteigendo", cat: "norma", ja: "敷地面積の最低限度", romaji: "shikichi menseki no saitei gendo", pt: "área mínima de lote",
      def: "Limite mínimo de área de lote fixado pelo plano urbano. O art. 53-2 da Lei de Padrões de Construção impede que esse mínimo ultrapasse 200 m².",
      patterns: ["敷地面積の最低限度"] },

    /* Os termos abaixo vêm do RASCUNHO OFICIAL ORIGINAL: a definição é a da
       própria autora, no capítulo indicado, sem reescrita. */
    { key: "homu", cat: "casa", ja: "ホーム", romaji: "hōmu", pt: "o lar conjugal importado",
      def: "A importação do ideal conjugal do hōmu ofereceu um vocabulário para julgar e reformar a casa existente. Os termos ie sei e hōmu foram, em larga medida, produtos do mesmo momento histórico.",
      src: "rascunho, cap. 2", patterns: [] },
    { key: "genkan", cat: "casa", ja: "玄関", romaji: "genkan", pt: "o vestíbulo de entrada",
      def: "O genkan e o engawa mediavam passagens entre rua, jardim e interior; a retirada dos calçados materializava uma distinção física, social e simbólica entre condições de limpeza e pertencimento.",
      src: "rascunho, cap. 2", patterns: ["玄関", "genkan"] },
    { key: "engawa", cat: "casa", ja: "縁側", romaji: "engawa", pt: "a varanda de borda",
      def: "Faixa de transição entre o interior e o jardim. No memorial de uma das casas do corpus, os espaços de transição superiores são aproximados do engawa, e o recinto inferior de um hanare, ambiente separado.",
      src: "rascunho, cap. 9", patterns: ["縁側", "engawa"] },
    { key: "doma", cat: "casa", ja: "土間", romaji: "doma", pt: "o piso de terra batida",
      def: "Em vez de pertencer inteiramente ao dentro ou ao fora, o piso de terra funcionava como área de sobreposição entre atividades domésticas, trabalho e acesso exterior.",
      src: "rascunho, cap. 2 · Nakagawa, 2006, p. 9", patterns: ["土間"] },
    { key: "zashiki", cat: "casa", ja: "座敷", romaji: "zashiki", pt: "o recinto de recepção elevado",
      def: "O zashiki elevado, ligado à frente pública e cerimonial, concentrava a representação masculina; o doma rebaixado, nos fundos, reunia cozinha e trabalho doméstico feminino.",
      src: "rascunho, cap. 2 · Ingarden e Kinoshita Watanabe, 2025, p. 25–32", patterns: ["座敷"] },
    { key: "chanoma", cat: "casa", ja: "茶の間", romaji: "chanoma", pt: "a sala cotidiana da família",
      def: "No interior, a chanoma, sala cotidiana da família, ganhou centralidade, enquanto o kyakuma, reservado à recepção e à representação, perdia centralidade.",
      src: "rascunho, cap. 2", patterns: ["茶の間"] },
    { key: "nakaroka", cat: "casa", ja: "中廊下", romaji: "naka-rōka", pt: "o corredor interno",
      def: "A reforma do fim de Meiji e início de Taishō incorporou o naka-rōka, uma faixa interna que oferecia caminhos alternativos para sanitário e banho e distinguia os percursos de familiares, visitantes e criadas.",
      src: "rascunho, cap. 2", patterns: ["中廊下", "naka-rōka"] },
    { key: "chabudai", cat: "casa", ja: "ちゃぶ台", romaji: "chabudai", pt: "a mesa baixa comum",
      def: "Sand contrapõe a mesa baixa comum, o chabudai, às bandejas individuais, zen, distribuídas segundo posição e hierarquia. O mesmo móvel podia produzir convivência e reforçar vigilância.",
      src: "rascunho, cap. 2", patterns: ["ちゃぶ台", "chabudai"] },
    { key: "danran", cat: "casa", ja: "一家団欒", romaji: "ikka danran", pt: "o círculo familiar",
      def: "A refeição compartilhada deu uma forma cotidiana ao ikka danran ou kazoku danran, o círculo familiar.",
      src: "rascunho, cap. 2", patterns: ["団欒", "danran"] },
    { key: "kaji", cat: "casa", ja: "家事", romaji: "kaji", pt: "as tarefas da casa",
      def: "As tarefas da casa, kaji, passaram a receber tratamento especializado. O conhecimento doméstico ampliava suas atribuições sem assegurar a partilha do trabalho.",
      src: "rascunho, cap. 2", patterns: ["家事"] },
    { key: "shufu", cat: "casa", ja: "主婦", romaji: "shufu", pt: "a dona de casa",
      def: "Uma função gerencial mais nítida da shufu: administrar orçamento, alimentação e criação dos filhos. No pós-guerra o programa familiar foi associado ao salaryman e à sengyō shufu, dona de casa em tempo integral.",
      src: "rascunho, cap. 2", patterns: ["主婦", "shufu"] },
    { key: "jochu", cat: "casa", ja: "女中", romaji: "jochū", pt: "a criada doméstica",
      def: "Parte do esforço físico era transferida à jochū, criada doméstica, em geral uma jovem migrante rural de origem menos favorecida. Entrava pela porta de serviço, kateguchi, circulava por corredores secundários e dormia junto às áreas de trabalho.",
      src: "rascunho, cap. 2", patterns: ["女中"] },
    { key: "danchi", cat: "casa", ja: "団地", romaji: "danchi", pt: "os conjuntos habitacionais",
      def: "Nos danchi, a correspondência entre composição familiar e número de recintos ganhou escala; na década de 1960, a indústria de casas pré-fabricadas a expandiu no código nLDK.",
      src: "rascunho, cap. 2", patterns: ["団地", "danchi"] },
    { key: "kotatsu", cat: "casa", ja: "炬燵", romaji: "kotatsu", pt: "a mesa baixa aquecida",
      def: "O kotatsu, mesa baixa aquecida e coberta por uma manta, acrescenta outra dimensão a esse plano de uso.",
      src: "rascunho, cap. 2", patterns: ["炬燵", "kotatsu"] },
    { key: "kutsurogu", cat: "casa", ja: "寛ぐ", romaji: "kutsurogu", pt: "sentir-se à vontade",
      def: "A experiência de sentir-se à vontade, kutsurogu, relacionava-se à possibilidade de apropriar esse plano, e não exclusivamente à presença do tatame.",
      src: "rascunho, cap. 2", patterns: ["kutsurogu"] },
    { key: "bottosuru", cat: "casa", ja: "ぼーっとする", romaji: "bōtto suru", pt: "estar junto sem conversar",
      def: "Daniels (2015) descreve o bōtto suru, recolhimento mental que permite estar junto sem interação contínua.",
      src: "rascunho, cap. 2", patterns: [] },
    { key: "shikii", cat: "casa", ja: "閾", romaji: "shikii", pt: "o limiar",
      def: "Riken Yamamoto, em resposta à autora: considero eficaz criar um espaço intermediário como o shikii. O limiar é um espaço para receber pessoas, um lugar de conexão gradual, nem inteiramente privado nem comum.",
      src: "rascunho, cap. 2 · entrevista, tradução da autora", patterns: ["閾"] },
    { key: "iebiraki", cat: "casa", ja: "家開き", romaji: "ie-biraki", pt: "abrir a casa",
      def: "Também passou a aparecer o ie-biraki, a prática de abrir a casa como lugar para diferentes atividades.",
      src: "rascunho, cap. 2", patterns: ["家開き"] },
    { key: "konbini", cat: "casa", ja: "コンビニ", romaji: "konbini", pt: "a loja de conveniência",
      def: "Whitelaw, em resposta à autora: os konbini são normalmente referidos como infraestrutura social, termo que abrange as diversas funções que essas lojas passaram a desempenhar. Retirar uma função da planta não garante que o bairro a ofereça.",
      src: "rascunho, cap. 2 · correspondência", patterns: ["コンビニ", "konbini"] },
    { key: "amado", cat: "casa", ja: "雨戸", romaji: "amado", pt: "a portada de tempestade",
      def: "Vidros foscos, cortinas, persianas e amado protegiam contra clima, intrusão e olhar externo. Abertura arquitetônica e abertura doméstica não coincidem: o morador regula a janela ao utilizá-la.",
      src: "rascunho, cap. 2", patterns: ["雨戸"] },
    { key: "kodokushi", cat: "casa", ja: "孤独死", romaji: "kodokushi", pt: "morte em isolamento",
      def: "A relação entre fechamento, isolamento social e kodokushi, porém, não foi demonstrada pelas fontes consultadas.",
      src: "rascunho, cap. 2", patterns: ["孤独死"] },
    { key: "yohaku", cat: "casa", ja: "余白", romaji: "yohaku", pt: "a margem em branco",
      def: "Go Hasegawa explora yohaku, espaços em branco ou margens de apropriação. Sou Fujimoto formula uma yowai kenchiku, arquitetura fraca, aberta a relações menos predeterminadas.",
      src: "rascunho, cap. 2", patterns: ["余白"] },
    { key: "kaneru", cat: "casa", ja: "兼ねる", romaji: "kaneru", pt: "acumular funções",
      def: "O princípio de kaneru parte de uma conta simples: se o número de cômodos continua o mesmo enquanto a casa encolhe, cada cômodo apenas fica menor e ainda consome área de circulação. Com ele trabalham sukeru, tornar permeável, e nukeru, produzir continuidade ou escape, inclusive vertical por vazios.",
      src: "rascunho, cap. 6 · Sugiura, 2026", patterns: ["兼ねる"] },
    { key: "jukyogaku", cat: "casa", ja: "住居学", romaji: "jūkyo-gaku", pt: "estudos da habitação",
      def: "Campo que situa seus antecedentes nas experiências de economia doméstica desde Meiji. Compreender a moradia pelo lado da vida, perguntando quem vive e de que maneira, além de abordá-la pelo edifício, perguntando o que construir.",
      src: "rascunho, cap. 2 · Niwa, tradução livre da autora", patterns: ["住居学"] },

    { key: "tokubetsuku", cat: "solo", ja: "特別区", romaji: "tokubetsu-ku", pt: "os 23 distritos especiais",
      def: "O recorte territorial abrange os 23 distritos especiais, tokubetsu-ku, que formam o núcleo municipalizado da Metrópole de Tóquio.",
      src: "rascunho, cap. 4", patterns: ["特別区", "tokubetsu-ku"] },
    { key: "roji", cat: "solo", ja: "路地", romaji: "roji", pt: "o beco compartilhado",
      def: "Nos becos populares, a portinhola de acesso ao roji delimitava a passagem compartilhada e permitia reconhecer quem entrava. Nas nagaya, a ausência de quintais privativos fazia do roji uma extensão doméstica.",
      src: "rascunho, cap. 4 · Jinnai, 1995, p. 124", patterns: ["路地"] },
    { key: "machiya", cat: "solo", ja: "町屋", romaji: "machiya", pt: "a casa-loja urbana",
      def: "Nas machiya, a frente comercial se articulava à residência nos fundos ou no pavimento superior.",
      src: "rascunho, cap. 4 · Jinnai, 1995, p. 61–62", patterns: ["町屋", "machiya"] },
    { key: "kukakuseiri", cat: "solo", ja: "土地区画整理", romaji: "tochi kukaku seiri", pt: "reajuste fundiário",
      def: "No novo desenho, cada proprietário cedia uma fração de sua área: o genbu (減歩) fornecia solo para ruas e parques; outra parcela podia ser reservada como horyūchi (保留地, terra de reserva) e vendida para custear a infraestrutura.",
      src: "rascunho, cap. 4 · Hein, 2010; Sorensen, 1999", patterns: ["土地区画整理"] },
    { key: "unagi", cat: "solo", ja: "鰻の寝床", romaji: "unagi no nedoko", pt: "ninho de enguia",
      def: "Apelido dos lotes longos e estreitos, associados ao jiguchisen, cobrança relacionada à largura da fachada.",
      src: "rascunho, cap. 4 · Daniell et al., 2008", patterns: ["鰻の寝床"] },
    { key: "tatemonosokai", cat: "solo", ja: "建物疎開", romaji: "tatemono sokai", pt: "evacuação de edifícios",
      def: "O tatemono sokai abriu aceiros por demolição durante a guerra. Esses casos mostram que o lote exíguo também podia ser produzido pela obra que melhorava a circulação da cidade.",
      src: "rascunho, cap. 4", patterns: ["建物疎開"] },

    { key: "ken", cat: "medida", ja: "間", romaji: "ken", pt: "a medida de vão",
      def: "Para comparação aproximada, adotando 1 ken como 1,818 m. O tsubo, unidade de superfície equivalente a um ken quadrado nessa convenção, corresponde a aproximadamente 3,306 m².",
      src: "rascunho, cap. 4", patterns: [] },
    { key: "chicchai", cat: "medida", ja: "ちっちゃい家", romaji: "chicchai na ie", pt: "casinha",
      def: "Sugiura prefere chicchai na ie, casinha, à conotação negativa que identifica em kyōshō jūtaku.",
      src: "rascunho, cap. 6 · Sugiura, 2026", patterns: ["ちっちゃい家"] },
    { key: "koya", cat: "medida", ja: "小屋以上住宅未満", romaji: "koya ijō jūtaku miman", pt: "mais que cabana, menos que casa",
      def: "Takeshi Hosaka chamou assim a sua própria casa de 18 m² no corpus.",
      src: "rascunho, cap. 6 · OCEANS, 2021", patterns: ["小屋以上住宅未満"] },

    { key: "kitagawa", cat: "norma", ja: "北側斜線", romaji: "kitagawa shasen", pt: "diagonal de face norte",
      def: "O artigo 56 distingue as diagonais de via (dōro shasen), de vizinhança (rinchi shasen) e de face norte (kitagawa shasen), referidas, respectivamente, ao limite oposto da via, à divisa vizinha e à distância na direção norte.",
      src: "rascunho, cap. 5", patterns: ["北側斜線"] },
    { key: "kakuchi", cat: "norma", ja: "角地緩和", romaji: "kakuchi kanwa", pt: "relaxamento de esquina",
      def: "Acréscimo admitido na taxa de ocupação para lote de esquina, em geral acompanhado do 隅切り (sumi-kiri, corte de esquina). A condição jurídica de esquina precisa ser verificada parcela a parcela, e não se deduz da forma do quarteirão.",
      src: "rascunho, cap. 9.2", patterns: ["角地緩和"] },
  ];

  const glossaryByKey = new Map(GLOSSARY.map((g) => [g.key, g]));

  const GLOSSARY_CATS = [
    { key: "norma", label: "norma e envelope", hint: "o que a regra desenha antes do arquiteto" },
    { key: "solo", label: "solo e parcela", hint: "o terreno, a divisão e o que sobra dela" },
    { key: "medida", label: "medida e tipo", hint: "as unidades e os nomes de tamanho" },
    { key: "casa", label: "casa e domesticidade", hint: "as palavras que casa não traduz" },
  ];

  function renderGlossaryGrid() {
    const grid = $("glossary-grid");
    if (!grid) return;
    const bands = GLOSSARY_CATS.map((cat) => {
      const terms = GLOSSARY.filter((g) => g.cat === cat.key);
      if (!terms.length) return "";
      return `<section class="gloss-band" data-cat="${cat.key}">
        <header>
          <h4>${cat.label}</h4>
          <p>${cat.hint} · ${terms.length} termo${terms.length === 1 ? "" : "s"}</p>
        </header>
        <div class="gloss-cells">
          ${terms.map((g) => `<button type="button" class="gloss-cell${g.ja.length > 4 ? " long" : ""}" data-term="${g.key}"
            aria-label="${g.romaji}, ${g.pt}"><span class="ja">${g.ja}</span></button>`).join("")}
        </div>
      </section>`;
    }).join("");

    grid.innerHTML = `
      <div class="gloss-tools">
        <label class="gloss-search">
          <span class="sr-only">Filtrar termos</span>
          <input id="gloss-filter" type="search" placeholder="filtrar: privacidade, lote, altura…" autocomplete="off">
        </label>
        <span class="gloss-count" id="gloss-count">${GLOSSARY.length} termos</span>
      </div>
      <div class="gloss-body">
        <div class="gloss-bands">${bands}</div>
        <div class="gloss-detail" id="gloss-detail"></div>
      </div>`;

    const detail = $("gloss-detail");
    const show = (key) => {
      const g = glossaryByKey.get(key);
      if (!g) return;
      grid.querySelectorAll(".gloss-cell").forEach((c) => c.classList.toggle("on", c.dataset.term === key));
      detail.innerHTML = `<article class="gloss-card">
        <p class="gloss-card-ja">${g.ja}</p>
        <div>
          <h4>${g.romaji}</h4>
          <p class="glossary-pt">${g.pt}</p>
          <p>${g.def}</p>
          ${g.src ? `<p class="gloss-src">${g.src}</p>` : ""}
        </div>
      </article>`;
      detail.scrollIntoView({ block: "nearest" });
    };
    grid.querySelectorAll(".gloss-cell").forEach((cell) => {
      cell.addEventListener("click", () => show(cell.dataset.term));
      cell.addEventListener("mouseenter", () => show(cell.dataset.term));
      cell.addEventListener("focus", () => show(cell.dataset.term));
    });
    show(GLOSSARY[0].key);

    const filter = $("gloss-filter");
    const count = $("gloss-count");
    filter.addEventListener("input", () => {
      const q = filter.value.trim().toLowerCase();
      let n = 0;
      grid.querySelectorAll(".gloss-cell").forEach((cell) => {
        const g = glossaryByKey.get(cell.dataset.term);
        const hay = `${g.ja} ${g.romaji} ${g.pt} ${g.def}`.toLowerCase();
        const hit = !q || hay.includes(q);
        cell.hidden = !hit;
        if (hit) n += 1;
      });
      grid.querySelectorAll(".gloss-band").forEach((band) => {
        band.hidden = !band.querySelector(".gloss-cell:not([hidden])");
      });
      count.textContent = q ? `${n} de ${GLOSSARY.length} termos` : `${GLOSSARY.length} termos`;
    });
  }

  function markGlossaryTerms() {
    const selectors = ".section-lede, .law-callout p, .city-note, .finding-body p, .rule-card p, .rule-card h4, .law-disclaimer, .filter-note, .panel-lede, .norm-item p, .guess-ask, .profile-text, .typology-card p, .law-field > span, .rule-ja";
    const targets = [...document.querySelectorAll(selectors)];
    const entries = GLOSSARY.flatMap((g) => g.patterns.map((p) => ({ key: g.key, pattern: p })))
      .sort((a, b) => b.pattern.length - a.pattern.length);
    const seen = new Set();
    for (const node of targets) {
      if (node.closest("[data-no-glossary]")) continue;
      for (const { key, pattern } of entries) {
        if (seen.has(key)) continue;
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
          acceptNode: (t) => (t.parentElement.closest(".glossary-term, a, button, code") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
        });
        const needle = pattern.toLowerCase();
        let textNode, found = null, index = -1;
        while ((textNode = walker.nextNode())) {
          index = textNode.nodeValue.toLowerCase().indexOf(needle);
          if (index >= 0) { found = textNode; break; }
        }
        if (!found) continue;
        const after = found.splitText(index);
        after.splitText(pattern.length);
        const mark = document.createElement("span");
        mark.className = "glossary-term";
        mark.dataset.term = key;
        mark.tabIndex = 0;
        mark.textContent = after.nodeValue;
        after.parentNode.replaceChild(mark, after);
        seen.add(key);
      }
    }
  }

  function glossaryTooltip() {
    const tip = document.createElement("div");
    tip.className = "glossary-tip";
    tip.hidden = true;
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);

    const place = (target, event) => {
      const g = glossaryByKey.get(target.dataset.term);
      if (!g) return;
      tip.innerHTML = `<strong><span class="ja">${g.ja}</span> ${g.romaji}</strong><em>${g.pt}</em><p>${g.def}</p>`;
      tip.hidden = false;
      const rect = target.getBoundingClientRect();
      const w = tip.offsetWidth, h = tip.offsetHeight;
      const cx = event && event.clientX ? event.clientX : rect.left + rect.width / 2;
      let left = Math.min(Math.max(8, cx - w / 2), window.innerWidth - w - 8);
      /* o cursor é um gato de 37 por 48 px: a ficha fica acima do ponteiro e,
         se não couber, abaixo do gato inteiro */
      let top = rect.top + window.scrollY - h - 14;
      if (rect.top - h - 14 < 8) top = rect.bottom + window.scrollY + 52;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    };
    const hide = () => { tip.hidden = true; };

    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest ? e.target.closest(".glossary-term") : null;
      if (target) place(target, e);
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest && e.target.closest(".glossary-term")) hide();
    });
    document.addEventListener("focusin", (e) => {
      const target = e.target.closest ? e.target.closest(".glossary-term") : null;
      if (target) place(target, null);
    });
    document.addEventListener("focusout", hide);
    window.addEventListener("scroll", hide, { passive: true });
  }

  /* =====================================================================
     4. Filtros por faixa, com histograma
     ===================================================================== */

  const RANGE_FIELDS = [
    { field: "year", label: "Ano", step: 1, dec: 0, factor: 1, disp: (v) => String(Math.round(v)) },
    { field: "lotArea", label: "Lote · m²", step: 1, dec: 0, factor: 1 },
    { field: "builtArea", label: "Construída · m²", step: 1, dec: 0, factor: 1 },
    { field: "far", label: "FAR observado", step: 0.05, dec: 2, factor: 1 },
    { field: "bcr", label: "BCR observado · %", step: 1, dec: 0, factor: 100 },
    { field: "floors", label: "Pavimentos", step: 1, dec: 0, factor: 1 },
  ];

  const BINS = 26;
  const show = (cfg, v) => (cfg.disp ? cfg.disp(v) : fmt(v, cfg.dec));

  function binsFor(field, factor) {
    const values = A.houses.map((h) => h[field]).filter(Number.isFinite).map((v) => v * factor);
    const min = Math.min(...values), max = Math.max(...values);
    const width = (max - min) / BINS || 1;
    const bins = Array.from({ length: BINS }, (_, i) => ({ x0: min + i * width, x1: min + (i + 1) * width, n: 0 }));
    for (const v of values) {
      const i = Math.min(BINS - 1, Math.floor((v - min) / width));
      bins[i].n += 1;
    }
    return { bins, min, max, width, max_n: Math.max(...bins.map((b) => b.n)), missing: A.houses.length - values.length };
  }

  function rangeFilters() {
    const host = $("range-filters");
    if (!host) return;
    const built = RANGE_FIELDS.map((cfg) => {
      const dist = binsFor(cfg.field, cfg.factor);
      const W = 300, H = 62, padB = 14;
      const barW = W / BINS;
      const wrap = document.createElement("div");
      wrap.className = "range-filter";
      wrap.dataset.field = cfg.field;
      wrap.innerHTML = `
        <div class="range-head">
          <span>${cfg.label}</span>
          <button type="button" class="range-clear" hidden>limpar</button>
        </div>
        <svg viewBox="0 0 ${W} ${H}" class="range-hist" role="img"
             aria-label="Distribuição de ${cfg.label} nas ${A.houses.length} fichas. Arraste para filtrar.">
          <g class="range-bars-all"></g>
          <g class="range-bars-now"></g>
          <rect class="range-band" x="0" y="0" width="0" height="${H - padB}" hidden></rect>
          <line class="range-axis" x1="0" x2="${W}" y1="${H - padB}" y2="${H - padB}"></line>
        </svg>
        <div class="range-foot">
          <span class="range-min">${show(cfg, dist.min)}</span>
          <span class="range-value" aria-live="polite">faixa inteira</span>
          <span class="range-max">${show(cfg, dist.max)}</span>
        </div>
        ${dist.missing ? `<p class="range-missing">${dist.missing} ficha${dist.missing === 1 ? "" : "s"} sem este campo: fora do filtro, nunca zerada${dist.missing === 1 ? "" : "s"}.</p>` : ""}`;
      host.appendChild(wrap);

      const svg = wrap.querySelector("svg");
      const gAll = wrap.querySelector(".range-bars-all");
      const gNow = wrap.querySelector(".range-bars-now");
      const band = wrap.querySelector(".range-band");
      const valueText = wrap.querySelector(".range-value");
      const clear = wrap.querySelector(".range-clear");
      const scaleY = (n) => (dist.max_n ? (n / dist.max_n) * (H - padB - 4) : 0);

      gAll.innerHTML = dist.bins.map((b, i) =>
        `<rect x="${(i * barW + 0.6).toFixed(2)}" y="${(H - padB - scaleY(b.n)).toFixed(2)}" width="${(barW - 1.2).toFixed(2)}" height="${scaleY(b.n).toFixed(2)}"></rect>`).join("");

      const valueAt = (clientX) => {
        const rect = svg.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const raw = dist.min + ratio * (dist.max - dist.min);
        return Math.round(raw / cfg.step) * cfg.step;
      };

      let dragging = null;
      const apply = (a, b) => {
        const min = Math.min(a, b), max = Math.max(a, b);
        if (Math.abs(max - min) < cfg.step / 2) { A.setRange(cfg.field, null, null); return; }
        A.setRange(cfg.field, Number(min.toFixed(cfg.dec)), Number(max.toFixed(cfg.dec)));
      };

      svg.addEventListener("pointerdown", (e) => {
        svg.setPointerCapture(e.pointerId);
        dragging = { start: valueAt(e.clientX) };
        drawBand(dragging.start, dragging.start);
      });
      svg.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        drawBand(dragging.start, valueAt(e.clientX));
      });
      const finish = (e) => {
        if (!dragging) return;
        const end = valueAt(e.clientX);
        const a = dragging.start;
        dragging = null;
        if (Math.abs(end - a) < cfg.step / 2) {
          /* clique simples: seleciona a faixa da barra clicada */
          const i = Math.min(BINS - 1, Math.max(0, Math.floor(((a - dist.min) / (dist.max - dist.min || 1)) * BINS)));
          apply(dist.bins[i].x0, dist.bins[i].x1);
        } else apply(a, end);
      };
      svg.addEventListener("pointerup", finish);
      svg.addEventListener("pointercancel", () => { dragging = null; sync(); });
      svg.addEventListener("dblclick", () => A.setRange(cfg.field, null, null));
      clear.addEventListener("click", () => A.setRange(cfg.field, null, null));

      function drawBand(a, b) {
        const x = (v) => ((v - dist.min) / (dist.max - dist.min || 1)) * W;
        const left = Math.max(0, Math.min(x(a), x(b)));
        const right = Math.min(W, Math.max(x(a), x(b)));
        band.hidden = false;
        band.setAttribute("x", left.toFixed(2));
        band.setAttribute("width", Math.max(1, right - left).toFixed(2));
      }

      function sync() {
        const now = A.state.filtered.map((h) => h[cfg.field]).filter(Number.isFinite).map((v) => v * cfg.factor);
        const counts = Array(BINS).fill(0);
        for (const v of now) {
          const i = Math.min(BINS - 1, Math.max(0, Math.floor((v - dist.min) / (dist.width || 1))));
          counts[i] += 1;
        }
        gNow.innerHTML = counts.map((n, i) =>
          `<rect x="${(i * barW + 0.6).toFixed(2)}" y="${(H - padB - scaleY(n)).toFixed(2)}" width="${(barW - 1.2).toFixed(2)}" height="${scaleY(n).toFixed(2)}"></rect>`).join("");
        const range = A.state.filters[cfg.field];
        const active = range && (range.min != null || range.max != null);
        clear.hidden = !active;
        if (active) {
          const lo = range.min != null ? Number(range.min) * cfg.factor : dist.min;
          const hi = range.max != null ? Number(range.max) * cfg.factor : dist.max;
          drawBand(lo, hi);
          valueText.textContent = `${show(cfg, lo)} a ${show(cfg, hi)}`;
          valueText.classList.add("on");
        } else {
          band.hidden = true;
          valueText.textContent = "faixa inteira";
          valueText.classList.remove("on");
        }
      }
      return sync;
    });
    const syncAll = () => built.forEach((fn) => fn());
    A.onUpdate(syncAll);
    syncAll();
  }

  /* =====================================================================
     5. Citar este recorte
     ===================================================================== */

  function citation() {
    const dialog = $("cite-dialog");
    if (!dialog) return;
    const open = () => {
      const now = new Date();
      const date = now.toLocaleDateString("pt-BR");
      const url = location.href;
      const filters = describeFilters();
      $("cite-text").value =
        `NOGUEIRA, Isadora Helena. Neko no Hitai: atlas do microlote. ${A.metadata.eligibleRecords} fichas comparáveis de um corpus de ${A.metadata.targetCorpus} casas. Recorte: ${filters}. Disponível em: ${url}. Acesso em: ${date}.`;
      $("cite-url").value = url;
      $("cite-feedback").textContent = "";
      dialog.hidden = false;
      $("cite-copy").focus();
    };
    const close = () => { dialog.hidden = true; };
    $("cite-view").addEventListener("click", open);
    $("cite-close").addEventListener("click", close);
    dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !dialog.hidden) close(); });
    $("cite-copy").addEventListener("click", async () => {
      const text = `${$("cite-text").value}`;
      try {
        await navigator.clipboard.writeText(text);
        $("cite-feedback").textContent = "copiado";
      } catch (err) {
        $("cite-text").select();
        $("cite-feedback").textContent = "selecione e copie";
      }
    });
  }

  function describeFilters() {
    const f = A.state.filters;
    const parts = [];
    if (f.query) parts.push(`busca “${f.query}”`);
    if (f.wards && f.wards.length) parts.push(`wards ${f.wards.join(", ")}`);
    const labels = { year: "ano", lotArea: "lote", builtArea: "área construída", far: "FAR", bcr: "BCR", floors: "pavimentos" };
    for (const [field, label] of Object.entries(labels)) {
      const r = f[field];
      if (!r || (r.min == null && r.max == null)) continue;
      const factor = field === "bcr" ? 100 : 1;
      const dec = field === "far" ? 2 : field === "bcr" ? 0 : field === "year" || field === "floors" ? 0 : 1;
      const lo = r.min != null ? fmt(Number(r.min) * factor, dec) : "sem mínimo";
      const hi = r.max != null ? fmt(Number(r.max) * factor, dec) : "sem máximo";
      parts.push(`${label} de ${lo} a ${hi}`);
    }
    if (f.onlyFloors) parts.push("só fichas com pavimentos registrados");
    if (f.ids) parts.push("lista fixa de casas");
    if (!parts.length) return `corpus comparável inteiro, ${A.state.filtered.length} casas`;
    return `${parts.join("; ")} (${A.state.filtered.length} casas)`;
  }

  /* =====================================================================
     6. Modo apresentação
     ===================================================================== */

  const SLIDES = [
    { id: "lot-histogram", title: "O arquivo em uma linha", note: "Distribuição do lote nas 194 fichas comparáveis." },
    { id: "chart-landowner", title: "A cidade encolhe, o arquivo não", note: "Solo por proprietário nos 23 wards, 1974 a 2024, contra a mediana do corpus." },
    { id: "chart-micro", title: "Microlotes, 2016 a 2024", note: "Proprietários de lotes abaixo de 100 m² nos 23 wards." },
    { id: "chart-archive-city", title: "Arquivo contra cidade", note: "Obras publicadas por 10 mil proprietários de microlote." },
    { id: "chart-census", title: "O domicílio encolhe", note: "Pessoas por domicílio e domicílios de uma pessoa, 1995 a 2020." },
    { id: "street-stage", title: "A rua do corpus", note: "Catorze fichas desenhadas na mesma escala, lado a lado." },
    { id: "scatter", title: "Relações dentro do recorte", note: "Cada ponto é uma ficha completa." },
    { id: "geo-map", title: "Onde o arquivo está", note: "Distribuição das casas pelos 23 wards." },
    { id: "chart-biblio-arc", title: "Quem conversa com quem", note: "Ligações declaradas entre as obras da bibliografia." },
  ];

  function presentation() {
    const button = $("present-toggle");
    if (!button) return;
    const overlay = document.createElement("div");
    overlay.className = "present-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="present-bar">
        <span class="present-title" id="present-title"></span>
        <span class="present-counter" id="present-counter"></span>
        <button type="button" class="bar-button" id="present-prev" aria-label="Anterior">←</button>
        <button type="button" class="bar-button" id="present-next" aria-label="Próximo">→</button>
        <button type="button" class="bar-button" id="present-exit" aria-label="Sair da apresentação">sair</button>
      </div>
      <div class="present-stage" id="present-stage"></div>
      <p class="present-note" id="present-note"></p>`;
    document.body.appendChild(overlay);

    const stage = overlay.querySelector("#present-stage");
    let index = 0, active = false, placeholder = null, moved = null;

    const restore = () => {
      if (moved && placeholder && placeholder.parentNode) {
        placeholder.parentNode.replaceChild(moved, placeholder);
      }
      moved = null; placeholder = null;
    };

    const show = (i) => {
      const available = SLIDES.filter((s) => document.getElementById(s.id));
      if (!available.length) return;
      index = (i + available.length) % available.length;
      const slide = available[index];
      const node = document.getElementById(slide.id);
      restore();
      placeholder = document.createComment(`present:${slide.id}`);
      node.parentNode.replaceChild(placeholder, node);
      moved = node;
      stage.innerHTML = "";
      stage.appendChild(node);
      overlay.querySelector("#present-title").textContent = slide.title;
      overlay.querySelector("#present-note").textContent = slide.note;
      overlay.querySelector("#present-counter").textContent = `${index + 1} / ${available.length}`;
    };

    const enter = () => {
      active = true;
      document.body.classList.add("presenting");
      overlay.hidden = false;
      show(0);
      overlay.querySelector("#present-next").focus();
    };
    const exit = () => {
      active = false;
      restore();
      overlay.hidden = true;
      document.body.classList.remove("presenting");
      button.focus();
    };

    button.addEventListener("click", () => (active ? exit() : enter()));
    overlay.querySelector("#present-exit").addEventListener("click", exit);
    overlay.querySelector("#present-next").addEventListener("click", () => show(index + 1));
    overlay.querySelector("#present-prev").addEventListener("click", () => show(index - 1));
    document.addEventListener("keydown", (e) => {
      if (!active) return;
      if (e.key === "Escape") { e.preventDefault(); exit(); }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); show(index + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); show(index - 1); }
    });
  }

  /* =====================================================================
     7. Seções recolhidas e filtros em gaveta, no celular
     ===================================================================== */

  function mobileLayout() {
    const mq = window.matchMedia("(max-width: 760px)");
    const sections = [...document.querySelectorAll("main .section[data-section-label]")];

    sections.forEach((section, i) => {
      const heading = section.querySelector(".section-heading");
      if (!heading || heading.querySelector(".section-fold")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "section-fold";
      button.setAttribute("aria-expanded", "true");
      button.innerHTML = '<span aria-hidden="true">−</span><span class="sr-only">Recolher seção</span>';
      button.addEventListener("click", () => {
        const collapsed = section.classList.toggle("collapsed");
        button.setAttribute("aria-expanded", String(!collapsed));
        button.querySelector("span[aria-hidden]").textContent = collapsed ? "+" : "−";
      });
      heading.appendChild(button);
      if (mq.matches && i > 1) {
        section.classList.add("collapsed");
        button.setAttribute("aria-expanded", "false");
        button.querySelector("span[aria-hidden]").textContent = "+";
      }
    });

    const filters = document.querySelector(".filters");
    const workbench = document.querySelector(".workbench");
    if (!filters || !workbench) return;
    const open = document.createElement("button");
    open.type = "button";
    open.className = "filters-open";
    open.textContent = "Filtros";
    workbench.insertAdjacentElement("beforebegin", open);
    const close = document.createElement("button");
    close.type = "button";
    close.className = "filters-close";
    close.textContent = "Ver as casas";
    filters.appendChild(close);
    open.addEventListener("click", () => {
      document.body.classList.add("filters-open");
      filters.scrollTop = 0;
    });
    close.addEventListener("click", () => document.body.classList.remove("filters-open"));
    A.onUpdate(() => {
      open.textContent = `Filtros · ${A.state.filtered.length} casas`;
      close.textContent = `Ver as ${A.state.filtered.length} casas`;
    });
  }

  /* =====================================================================
     8. Versão em inglês
     ===================================================================== */

  const EN = {
    "kicker": "Neko no Hitai · atlas of the micro-lot",
    "badge": "194 complete records",
    "title": "Houses, territory<br>and the building code.",
    "lede": "Compare only complete records, read how the houses spread across the 23 wards, and see the rules that draw the envelope of a micro-lot side by side. A missing field never becomes a number: it disappears from the record.",
    "hint": "Hover the underlined terms for the Japanese original. Press <kbd>?</kbd> for keyboard shortcuts. Everything here can be cited with a date and a slice.",
    "citeButton": "Cite this slice",
    "presentButton": "Present",
  };

  /* pares de seletor e texto: o que muda quando a página vira inglês */
  const EN_NODES = [
    ["#preamble-title", "The terms that stay in Japanese"],
    ["#preambulo .section-index", "00 · glossary"],
    ["#preambulo .data-rule", "猫の額 · a cat’s forehead"],
    ["#preambulo .section-lede", "The terms this atlas keeps in Japanese, because translating them as house, lot or code would erase the difference they carry. Elsewhere on the page they appear underlined: the cursor opens the same entry shown here."],
    ["#city-title", "The ground that shrinks"],
    ["#cidade .section-index", "01 · the city"],
    ["#findings-title", "What the corpus says"],
    ["#achados .section-index", "02 · findings"],
    ["#explorer-title", "Comparable slice"],
    ["#explorar .section-index", "03 · explore"],
    ["#territory-title", "The geography of the corpus"],
    ["#territorio .section-index", "04 · territory"],
    ["#typology-title", "Four shapes of lot"],
    ["#tipologias .section-index", "05 · typologies"],
    ["#rules-title", "The rule, drawn"],
    ["#norma .section-index", "06 · the code"],
    ["#compare-title", "Case table"],
    ["#comparar .section-index", "07 · compare"],
    ["#biblio-title", "Who talks to whom"],
    ["#bibliografia .section-index", "09 · bibliography"],
    ["#backstage-title", "What holds the atlas up"],
    ["#bastidores .section-index", "10 · backstage"],
    ["#tab-calc", "Calculator"],
    ["#tab-comp", "Comparisons"],
    ["#tab-zonas", "Zone table"],
    ["#tab-regras", "Rules that are not a measure"],
    ["#tab-rede", "Network by axis"],
    ["#tab-conversa", "Conversation over time"],
    ["#tab-linha", "Timeline"],
    ["#tab-matriz", "Axis × chapter"],
    ["#reset-filters", "Clear filters"],
    ["#export-filtered", "Export slice · CSV"],
    ["#load-more", "Show more"],
    ["#clear-selection", "Empty the table"],
    ["#export-compare-svg", "Export figure · SVG"],
    ["#export-selection", "Export selection · JSON"],
  ];

  function language() {
    const button = $("lang-toggle");
    if (!button) return;
    let lang = "pt";
    const banner = document.createElement("p");
    banner.className = "lang-banner";
    banner.hidden = true;
    banner.textContent = "Working translation by the machine, not revised by the author. The preamble, the quotations and the source notes stay in Portuguese, as written.";
    document.querySelector("main").prepend(banner);

    const apply = () => {
      const en = lang === "en";
      document.documentElement.lang = en ? "en" : "pt-BR";
      banner.hidden = !en;
      button.textContent = en ? "PT" : "EN";
      button.setAttribute("aria-label", en ? "Voltar ao português" : "Switch to English");
      document.querySelectorAll("[data-i18n]").forEach((node) => {
        const key = node.dataset.i18n;
        if (!node.dataset.pt) node.dataset.pt = node.innerHTML;
        node.innerHTML = en && EN[key] ? EN[key] : node.dataset.pt;
      });
      for (const [selector, text] of EN_NODES) {
        const node = document.querySelector(selector);
        if (!node) continue;
        if (!node.dataset.pt) node.dataset.pt = node.innerHTML;
        node.innerHTML = en ? text : node.dataset.pt;
      }
      document.body.classList.toggle("en", en);
      window.dispatchEvent(new CustomEvent("nekolang", { detail: { lang } }));
    };

    button.addEventListener("click", () => { lang = lang === "pt" ? "en" : "pt"; apply(); });
    window.NekoLang = { get current() { return lang; } };
  }

  /* =====================================================================
     9. Barra de leitura
     ===================================================================== */

  function readProgress() {
    const bar = $("read-progress");
    if (!bar) return;
    const fill = bar.querySelector("span");
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const k = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      fill.style.transform = `scaleX(${k.toFixed(4)})`;
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* =====================================================================
     10. Me surpreenda: abre uma ficha sorteada do recorte atual
     ===================================================================== */

  function randomHouse() {
    const button = $("random-house");
    if (!button) return;
    let last = null;
    button.addEventListener("click", () => {
      const pool = A.state.filtered.filter((h) => h.id !== last);
      if (!pool.length) return;
      const house = pool[Math.floor(Math.random() * pool.length)];
      last = house.id;
      A.openDrawer(house.id);
    });
    A.onUpdate(() => { button.disabled = A.state.filtered.length === 0; });
  }

  /* =====================================================================
     11. Cabe a sua casa aqui?
     ===================================================================== */

  function yours() {
    const form = $("yours-form");
    const input = $("yours-input");
    const result = $("yours-result");
    if (!form || !input || !result) return;
    const lots = A.houses.map((h) => h.lotArea).filter(Number.isFinite).sort((a, b) => a - b);
    const median = A.core.median(lots);
    const smallest = A.houses.reduce((m, h) => (h.lotArea < m.lotArea ? h : m), A.houses[0]);

    /* três quadrados na mesma escala: a área de quem lê, o lote mediano do
       corpus e o menor lote do corpus */
    const draw = (area) => {
      const side = Math.sqrt(area), medSide = Math.sqrt(median), minSide = Math.sqrt(smallest.lotArea);
      const biggest = Math.max(side, medSide, minSide);
      const W = 460, H = 210, pad = 30;
      const k = (H - pad * 2) / biggest;
      const w1 = side * k, w2 = medSide * k, w3 = minSide * k;
      const gap = Math.max(16, (W - (w1 + w2 + w3)) / 4);
      const box = (w, x, cls, label, value) => `<g>
          <rect x="${x.toFixed(1)}" y="${(H - pad - w).toFixed(1)}" width="${w.toFixed(1)}" height="${w.toFixed(1)}" class="yours-box ${cls}"></rect>
          <text x="${(x + w / 2).toFixed(1)}" y="${H - pad + 15}" text-anchor="middle" class="yours-box-label">${label}</text>
          <text x="${(x + w / 2).toFixed(1)}" y="${H - pad + 28}" text-anchor="middle" class="yours-box-value">${value}</text>
        </g>`;
      return `<svg viewBox="0 0 ${W} ${H}" class="yours-svg" role="img"
        aria-label="A sua área, o lote mediano do corpus e o menor lote, na mesma escala">
        ${box(w1, gap, "mine", "você", `${fmt(area, 1)} m²`)}
        ${box(w2, gap * 2 + w1, "median", "mediana", `${fmt(median, 1)} m²`)}
        ${box(w3, gap * 3 + w1 + w2, "smallest", "menor lote", `${fmt(smallest.lotArea, 2)} m²`)}
      </svg>`;
    };

    const render = () => {
      const area = Number(input.value);
      if (!Number.isFinite(area) || area <= 0) { result.innerHTML = ""; return; }
      const below = lots.filter((v) => v < area).length;
      const pct = (below / lots.length) * 100;
      const phrase = area < smallest.lotArea
        ? `A sua área é menor que o menor lote do corpus, os ${fmt(smallest.lotArea, 2)} m² da ${A.escapeHtml(smallest.name)}.`
        : area > lots[lots.length - 1]
          ? `A sua área passa do maior lote do recorte comparável, ${fmt(lots[lots.length - 1], 1)} m².`
          : `${below} das ${lots.length} fichas têm lote menor que isso: ${fmt(pct, 0)}% do recorte comparável.`;
      const vsMedian = area >= median
        ? `O lote mediano do corpus, ${fmt(median, 1)} m², ocupa ${fmt((median / area) * 100, 0)}% da sua área.`
        : `Cabem ${fmt(median / area, 1)} áreas como a sua dentro do lote mediano do corpus, ${fmt(median, 1)} m².`;
      result.innerHTML = `${draw(area)}
        <p class="yours-say">${phrase} ${vsMedian}</p>
        <p class="yours-caveat">A conta compara área com área. Um cômodo não é um lote: a ficha mede o terreno, não o que se vive dentro dele.</p>`;
    };

    input.addEventListener("input", render);
    form.addEventListener("submit", (e) => e.preventDefault());
    form.querySelectorAll("[data-yours]").forEach((b) => b.addEventListener("click", () => {
      form.querySelectorAll("[data-yours]").forEach((o) => o.classList.toggle("active", o === b));
      input.value = b.dataset.yours;
      render();
    }));
  }

  /* =====================================================================
     12. Pegadas: um clique no cabeçalho deixa a marca da pata
     ===================================================================== */

  function pawPrints() {
    const host = document.querySelector(".masthead");
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    host.style.position = "relative";
    host.style.overflow = "hidden";
    host.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input, select")) return;
      const rect = host.getBoundingClientRect();
      const print = document.createElement("span");
      print.className = "paw-print";
      print.style.left = `${e.clientX - rect.left - 11}px`;
      print.style.top = `${e.clientY - rect.top - 11}px`;
      print.style.setProperty("--rot", `${Math.round(Math.random() * 40 - 20)}deg`);
      host.appendChild(print);
      setTimeout(() => print.remove(), 1500);
    });
  }

  /* =====================================================================
     13. Teclado: atalhos para a defesa
     ===================================================================== */

  const SHORTCUTS = [
    ["/", "ir para a busca do corpus"],
    ["t", "alternar entre fichas e tabela"],
    ["r", "abrir uma ficha sorteada"],
    ["p", "entrar ou sair da apresentação"],
    ["c", "abrir a citação do recorte"],
    ["←  →", "na apresentação, passar de gráfico"],
    ["Esc", "fechar a gaveta, a citação ou a apresentação"],
    ["?", "mostrar ou esconder esta lista"],
  ];

  function shortcuts() {
    const panel = document.createElement("div");
    panel.className = "shortcuts";
    panel.hidden = true;
    panel.innerHTML = `<h4>Atalhos</h4><dl>${
      SHORTCUTS.map(([k, d]) => `<div><dt>${k}</dt><dd>${d}</dd></div>`).join("")}</dl>
      <p class="shortcuts-secret">Três coisas não estão nesta lista. Uma se acha digitando <kbd>neko</kbd>; as outras duas estão escondidas no glossário e no texto, para quem passar o cursor devagar.</p>
      <p>Pressione ? de novo para fechar.</p>`;
    document.body.appendChild(panel);

    const typing = (e) => {
      const el = e.target;
      return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
    };
    document.addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing(e)) return;
      const k = e.key;
      if (k === "?") { e.preventDefault(); panel.hidden = !panel.hidden; return; }
      if (k === "Escape" && !panel.hidden) { panel.hidden = true; return; }
      if (k === "/") { e.preventDefault(); const q = $("query"); if (q) { q.scrollIntoView({ block: "center" }); q.focus(); } return; }
      if (k === "t") { A.setView(A.state.view === "table" ? "cards" : "table"); return; }
      if (k === "r") { const b = $("random-house"); if (b) b.click(); return; }
      if (k === "p") { const b = $("present-toggle"); if (b) b.click(); return; }
      if (k === "c") { const b = $("cite-view"); if (b) b.click(); return; }
    });
  }

  /* =====================================================================
     14. O que ainda falta conferir, sem gritar na página
     ===================================================================== */

  /* A marca [VERIFICAR] sai do texto corrido e vira um sublinhado pontilhado
     com a explicação no cursor. O dado continua marcado como não confirmado,
     que é a regra do trabalho; só deixa de interromper a leitura. A contagem
     vai para os bastidores. */
  const PENDING_RE = /\s*(\[VERIFICAR\]|\(verificar\)|\[FONTE NECESSÁRIA\])/g;
  let pendingCount = 0;

  function markPending(root) {
    const scope = root || document.body;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue || node.nodeValue.indexOf("VERIFICAR") < 0 && node.nodeValue.indexOf("verificar)") < 0 && node.nodeValue.indexOf("FONTE NECESS") < 0) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p || p.closest("script, style, .pending")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const hits = [];
    let n;
    while ((n = walker.nextNode())) hits.push(n);
    hits.forEach((node) => {
      if (!PENDING_RE.test(node.nodeValue)) { PENDING_RE.lastIndex = 0; return; }
      PENDING_RE.lastIndex = 0;
      node.nodeValue = node.nodeValue.replace(PENDING_RE, "");
      const host = node.parentElement;
      if (host && !host.classList.contains("pending")) {
        host.classList.add("pending");
        host.title = "a conferir antes da versão final";
        pendingCount += 1;
      }
    });
    const tally = $("pending-tally");
    if (tally) tally.textContent = pendingCount
      ? `${pendingCount} ${pendingCount === 1 ? "campo ainda a conferir" : "campos ainda a conferir"} nesta página, sublinhados em pontilhado.`
      : "Nenhum campo pendente de conferência nesta página.";
  }

  /* =====================================================================
     15. Epígrafes: a voz da autora abrindo cada seção

     Todas as frases são do RASCUNHO OFICIAL ORIGINAL, copiadas sem
     alteração, com o capítulo de origem ao lado.
     ===================================================================== */

  const EPIGRAPHS = {
    cidade: ["A capacidade de alterar a casa não pressupõe igual liberdade para alterar o terreno.", "rascunho · cap. 4"],
    achados: ["Uma casa incluída pelo terreno pode superar a imagem corrente de “micro” ao empilhar área; outra pode preservar vazios e permanecer pequena apesar do potencial construtivo disponível.", "rascunho · cap. 1"],
    explorar: ["A kyōshō jūtaku é muito fotografada e frequentemente mal fichada.", "rascunho · cap. 7"],
    territorio: ["A rua podia ser modernizada enquanto o desenho das edificações continuava a ser decidido parcela por parcela.", "rascunho · cap. 4"],
    tipologias: ["A forma atual pode ser observada diretamente; sua origem depende de documentação específica.", "rascunho · cap. 4"],
    retratos: ["É ela que converte escassez de terra em laboratório de domesticidade, e por isso trato essas casas como argumento, e não como curiosidade dimensional.", "rascunho · notas"],
    norma: ["A norma participa da forma, mas não define sozinha o que a janela enquadra nem como ela é usada.", "rascunho · cap. 5"],
    comparar: ["A contagem de portas ganha sentido quando relacionada a quem usa o espaço, para quê e em que momento.", "rascunho · cap. 9.16"],
    bibliografia: ["Separar essas vozes faz parte do método.", "rascunho · cap. 1"],
    bastidores: ["Forma e experiência doméstica serão tratadas separadamente: a qualidade formal de uma casa não permite inferir, sozinha, como ela foi vivida.", "rascunho · Traduttore, traditore"],
  };

  function epigraphs() {
    Object.keys(EPIGRAPHS).forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;
      const heading = section.querySelector(".section-heading");
      if (!heading) return;
      const [text, src] = EPIGRAPHS[id];
      const fig = document.createElement("blockquote");
      fig.className = "epigraph";
      fig.innerHTML = `<p>${text}</p><cite>${src}</cite>`;
      heading.insertAdjacentElement("afterend", fig);
    });
  }

  /* =====================================================================
     16. O gato deitado do texto da régua
     ===================================================================== */

  /* =====================================================================
     16. Escolha do cursor, e o gato que atravessa a tela
     ===================================================================== */

  const CURSORS = [
    { id: "gato", label: "gato" },
    { id: "pata", label: "pata" },
    { id: "normal", label: "seta" },
  ];

  function cursorPicker() {
    const host = $("cursor-pick");
    if (!host) return;
    let current = "gato";
    try { current = localStorage.getItem("neko-cursor") || "gato"; } catch (e) { current = "gato"; }
    if (!CURSORS.some((c) => c.id === current)) current = "gato";

    const apply = (id) => {
      if (id === "gato") document.body.removeAttribute("data-cursor");
      else document.body.setAttribute("data-cursor", id);
      host.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cursor === id)));
      try { localStorage.setItem("neko-cursor", id); } catch (e) { /* navegador sem storage */ }
    };

    host.innerHTML = `<span>cursor</span>${CURSORS.map((c) =>
      `<button type="button" data-cursor="${c.id}" aria-pressed="false">${c.label}</button>`).join("")}`;
    host.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => apply(b.dataset.cursor)));
    apply(current);
  }

  /* =====================================================================
     19. O gato que espia

     Fica escondido atrás da borda e sobe quando o cursor passa pela
     etiqueta 猫の額 do preâmbulo, pelo fecho do ensaio ou pelo rodapé.
     ===================================================================== */

  let peekEl = null;
  let peekTimer = null;

  function peek(force) {
    if (!peekEl) {
      peekEl = document.createElement("div");
      peekEl.className = "neko-peek";
      peekEl.setAttribute("aria-hidden", "true");
      peekEl.innerHTML = '<img src="assets/illo/gato-pixel.png" alt="">';
      document.body.appendChild(peekEl);
    }
    peekEl.classList.add("up");
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => peekEl.classList.remove("up"), force ? 4200 : 2600);
  }

  function peekSpots() {
    const spots = [
      document.querySelector("#preambulo .data-rule"),
      document.querySelector("#preambulo .section-lede"),
      document.querySelector("footer span"),
    ].filter(Boolean);
    spots.forEach((el) => {
      el.classList.add("peek-spot");
      el.addEventListener("mouseenter", () => peek(false));
      el.addEventListener("focus", () => peek(false));
    });
  }

  function easterEggs() {
    let buffer = "";
    const inField = (e) => {
      const t = e.target;
      return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    };
    document.addEventListener("keydown", (e) => {
      if (inField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-8);
      if (buffer.endsWith("neko")) peek(true);
      if (buffer.endsWith("tsubo")) toggleTsubo();
    });
    /* o título guarda o original */
    const h1 = document.querySelector(".masthead h1");
    if (h1) {
      h1.title = "猫の額 · neko no hitai · testa de gato";
    }
  }


  /* =====================================================================
     18. Escondido: a página inteira em tsubo

     Digitar tsubo em qualquer lugar troca todo m² da página pela unidade
     japonesa, 1 tsubo = 3,3058 m². Digitar de novo desfaz. A pista está
     na ficha do termo no glossário.
     ===================================================================== */

  const TSUBO = 3.3058;
  let tsuboOn = false;
  const tsuboMemory = new Map();

  function toggleTsubo() {
    const root = document.getElementById("conteudo");
    if (!root) return;
    if (tsuboOn) {
      tsuboMemory.forEach((original, node) => { node.nodeValue = original; });
      tsuboMemory.clear();
      tsuboOn = false;
      flash("de volta ao metro quadrado");
      return;
    }
    const re = /(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:\.\d+)?)\s*m²/g;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        if (!n.nodeValue || n.nodeValue.indexOf("m²") < 0) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (!p || p.closest("script, style, input, textarea, select")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const hits = [];
    let n;
    while ((n = walker.nextNode())) hits.push(n);
    hits.forEach((node) => {
      tsuboMemory.set(node, node.nodeValue);
      node.nodeValue = node.nodeValue.replace(re, (all, num) => {
        const v = Number(String(num).replace(/\./g, "").replace(",", "."));
        if (!Number.isFinite(v)) return all;
        return `${(v / TSUBO).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} 坪`;
      });
    });
    tsuboOn = true;
    flash("a página inteira em tsubo · 1 坪 = 3,3058 m² · digite tsubo de novo para desfazer");
  }

  let flashEl = null;
  function flash(text) {
    if (!flashEl) {
      flashEl = document.createElement("div");
      flashEl.className = "neko-flash";
      flashEl.setAttribute("role", "status");
      document.body.appendChild(flashEl);
    }
    flashEl.textContent = text;
    flashEl.classList.add("on");
    clearTimeout(flashEl._t);
    flashEl._t = setTimeout(() => flashEl.classList.remove("on"), 4200);
  }

  /* =====================================================================
     start
     ===================================================================== */

  sectionBar();
  tabs();
  renderGlossaryGrid();
  rangeFilters();
  citation();
  presentation();
  mobileLayout();
  readProgress();
  randomHouse();
  yours();
  pawPrints();
  shortcuts();
  epigraphs();
  cursorPicker();
  peekSpots();
  easterEggs();
  language();
  /* o glossário marca o texto depois que os gráficos escreveram os seus */
  window.addEventListener("load", () => {
    markGlossaryTerms();
    glossaryTooltip();
    markPending();
    setTimeout(markPending, 600);
  });
})();
