/* A norma: linha do tempo legislativa do microlote.

   Entram apenas as normas que agem diretamente sobre o lote pequeno ou sobre
   o desenho da casa que cabe nele: acesso à via, recuo, coeficientes, planos
   inclinados, sombra, lote mínimo e aprovação da obra. Leis gerais de
   habitação, financiamento ou tributação ficaram de fora de propósito.

   Datas nacionais e metropolitanas conferidas nos textos oficiais e em
   comentários jurídicos (links em cada item). Datas de adoção dos wards:
   planilha Levantamento de Dados_TCC_Isa, aba 11 normas wards. */

(function () {
  const host = document.getElementById("lawline");
  if (!host) return;

  const EGOV_BSA = "https://laws.e-gov.go.jp/law/325AC0000000201";
  const EGOV_CPA = "https://laws.e-gov.go.jp/law/343AC0000000100";

  const EVENTS = [
    {
      year: 1950, when: "1950",
      ja: "建築基準法", title: "Lei de Padrões de Construção",
      article: "arts. 42 § 2, 43 e 53",
      does: "Só se constrói em lote com pelo menos 2 m de frente para uma via de 4 m. Nas vielas mais estreitas, o lote recua até 2 m do eixo e perde essa faixa para a rua. A taxa de ocupação nasce aqui.",
      micro: "É o filtro de entrada: define quais retalhos de terra podem receber uma casa e quanto do lote a viela come antes do primeiro traço.",
      src: { label: "e-Gov, Lei nº 201/1950", url: EGOV_BSA },
    },
    {
      year: 1950, when: "7/12/1950",
      ja: "東京都建築安全条例", title: "Ordenança de Segurança de Edificações de Tóquio",
      article: "art. 3",
      does: "Para o lote em bandeira (路地状敷地), o corredor até a rua precisa de 2 m de largura se tiver até 20 m de comprimento, e 3 m se for mais longo.",
      micro: "É o que torna edificável o lote de fundo criado por subdivisão, e o que dá à casa em bandeira o seu acesso de 2 m.",
      src: { label: "Reiki de Tóquio, ordenança nº 89/1950", url: "https://www.reiki.metro.tokyo.lg.jp/reiki/reiki_honbun/g101RG00001306.html" },
    },
    {
      year: 1968, when: "1968",
      ja: "都市計画法", title: "Lei de Planejamento Urbano",
      article: "zonas de uso",
      does: "Reorganiza o planejamento urbano: as zonas de uso (用途地域) passam a ser fixadas por plano urbano, e com a revisão de 1970 cada zona recebe taxa de ocupação e coeficiente de aproveitamento designados.",
      micro: "É a zona que fixa o teto de ocupação e de área que a casa pequena tenta encostar.",
      src: { label: "e-Gov, Lei nº 100/1968", url: EGOV_CPA },
    },
    {
      year: 1970, when: "1970",
      ja: "建築基準法改正", title: "Revisão da Lei de Padrões de Construção",
      article: "art. 52 e art. 56",
      does: "O coeficiente de aproveitamento (容積率) passa a valer em toda a área urbana, e entra o plano inclinado norte (北側斜線).",
      micro: "Daqui vem a cobertura cortada em diagonal tão frequente nas casas estreitas: a casa cresce até onde o plano norte deixa.",
      src: { label: "Keiyaku Watch, histórico da lei", url: "https://keiyaku-watch.jp/media/hourei/kenchikukijunho/" },
    },
    {
      year: 1976, when: "1976",
      ja: "日影規制", title: "Controle de sombreamento",
      article: "art. 56-2",
      does: "Limita as horas de sombra que um edifício pode projetar sobre o vizinho no solstício de inverno. A lei nacional deixa às ordenanças locais a escolha das zonas e dos limites.",
      micro: "Em zona residencial de baixa altura atinge edifícios com mais de 7 m ou três pavimentos: justamente a altura que a casa de três andares no microlote quer ter.",
      src: { label: "Keiyaku Watch, histórico da lei", url: "https://keiyaku-watch.jp/media/hourei/kenchikukijunho/" },
    },
    {
      year: 1978, when: "14/7/1978",
      ja: "東京都日影による中高層建築物の高さの制限に関する条例", title: "Ordenança de sombreamento de Tóquio",
      article: "ordenança nº 63/1978",
      does: "Tóquio fixa, zona por zona, as horas máximas de sombra e a altura de medição.",
      micro: "É a tabela que decide se o terceiro pavimento cabe.",
      src: { label: "Reiki de Tóquio", url: "https://www.reiki.metro.tokyo.lg.jp/reiki/reiki_honbun/g101RG00001307.html" },
    },
    {
      year: 1980, when: "1980",
      ja: "地区計画", title: "Planos de distrito",
      article: "Lei de Planejamento Urbano, art. 12-4",
      does: "Permite regras finas por quadra sobre o zoneamento, entre elas uma área mínima de lote.",
      micro: "É por esse caminho que parte dos wards (regime B do mapa) impõe lote mínimo só em áreas delimitadas.",
      src: { label: "Governo Metropolitano, planos de distrito", url: "https://www.toshiseibi.metro.tokyo.lg.jp/web/keikaku/chiku/" },
    },
    {
      year: 1993, when: "1992, em vigor em 25/6/1993",
      ja: "敷地面積の最低限度", title: "Área mínima de lote nas zonas de baixa altura",
      article: "Lei nº 82/1992",
      does: "O plano urbano passa a poder fixar uma área mínima de lote nas zonas residenciais exclusivas de baixa altura.",
      micro: "É a primeira ferramenta nacional contra a subdivisão em microlotes, restrita às zonas de casas baixas.",
      src: { label: "Setagaya, nota técnica sobre o lote mínimo", url: "https://www.city.setagaya.lg.jp/documents/3852/4-6_.pdf" },
    },
    {
      year: 2002, when: "2002",
      ja: "建築基準法改正", title: "Lote mínimo em todas as zonas e 天空率",
      article: "art. 53-2 e art. 56 § 7",
      does: "O lote mínimo pode ser fixado em qualquer zona de uso, sem ultrapassar 200 m². Na mesma revisão entra o 天空率: um projeto que deixe tanto céu visível quanto o envelope inclinado pode dispensar os planos inclinados.",
      micro: "Uma revisão abre caminho para proibir o microlote, a outra dá ao arquiteto uma saída geométrica dentro dele.",
      src: { label: "NILIM, estudo sobre o 天空率", url: "https://www.nilim.go.jp/lab/bcg/siryou/kpr/prn0032pdf/kh0032009.pdf" },
    },
    {
      year: 2004, when: "24/6/2004", ward: true,
      ja: "区の最低敷地面積", title: "Primeira onda de lotes mínimos nos wards",
      article: "planos urbanos dos wards",
      does: "Edogawa, Nakano e Suginami adotam mínimo de lote; Meguro e Setagaya adotam nas zonas de baixa altura.",
      micro: "O lote menor que já existia continua edificável. O que muda é a subdivisão nova: abaixo do mínimo, ela deixa de gerar lote edificável.",
      src: { label: "planilha, aba 11 normas wards; Edogawa, lote mínimo", url: "https://www.city.edogawa.tokyo.jp/e021/toshikeikaku/kenchiku/kisei_chosa/saiteisikicgi.html" },
    },
    {
      year: 2007, when: "2007", ward: true,
      ja: "新宿区", title: "Shinjuku",
      article: "lei local",
      does: "Mínimo de lote em áreas delimitadas, conforme o anexo 2 da lei local.",
      micro: "Regime B: o mínimo não cobre o ward inteiro.",
      src: { label: "planilha, aba 11 normas wards" },
    },
    {
      year: 2008, when: "7/3/2008", ward: true,
      ja: "練馬区", title: "Nerima",
      article: "plano urbano",
      does: "Mínimo de 70 a 110 m² nas zonas residenciais.",
      micro: "O maior mínimo registrado na planilha entre os wards de regime A.",
      src: { label: "planilha, aba 11 normas wards" },
    },
    {
      year: 2009, when: "6/3/2009", ward: true,
      ja: "目黒区", title: "Meguro estende a regra",
      article: "plano urbano",
      does: "O mínimo, já vigente nas zonas de baixa altura, passa a valer nas demais zonas.",
      micro: "Meguro se torna ward de mínimo em todo o território.",
      src: { label: "planilha, aba 11 normas wards" },
    },
    {
      year: 2015, when: "6/3/2015", ward: true,
      ja: "板橋区", title: "Itabashi",
      article: "plano urbano",
      does: "Mínimo de 60 a 100 m² em todo o ward, exceto zonas comerciais e industrial exclusiva.",
      micro: "",
      src: { label: "planilha, aba 11 normas wards" },
    },
    {
      year: 2019, when: "1/4 e 1/10/2019", ward: true,
      ja: "世田谷区 · 足立区", title: "Setagaya estende a regra; Adachi regula loteamentos",
      article: "plano urbano e ordenança local",
      does: "Setagaya leva o mínimo às demais zonas residenciais e à semi-industrial (1/4). Adachi fixa 66, 70 ou 83 m² por lote resultante em empreendimentos a partir de 150 m² divididos em dois ou mais lotes (1/10).",
      micro: "Adachi não fixa mínimo por zona: regula o ato de dividir.",
      src: { label: "planilha, aba 11 normas wards" },
    },
    {
      year: 2021, when: "26/11/2021", ward: true,
      ja: "荒川区", title: "Arakawa",
      article: "plano urbano",
      does: "Mínimo de 60 m² em todo o ward.",
      micro: "A adoção mais recente registrada na planilha.",
      src: { label: "planilha, aba 11 normas wards" },
    },
    {
      year: 2025, when: "abril de 2025",
      ja: "4号特例の縮小 · 省エネ基準適合義務化", title: "Fim da isenção para casas pequenas de madeira",
      article: "revisão da Lei de Padrões de Construção",
      does: "A casa de madeira de dois pavimentos deixa de ter a revisão estrutural dispensada na aprovação (建築確認), e todo edifício novo passa a ter de cumprir o padrão de eficiência energética.",
      micro: "Atinge a produção corrente de casas pequenas de madeira: mais cálculo e mais documentação por projeto. Se o isolamento exigido também custa espessura de parede num lote em que cada centímetro conta é uma inferência a verificar nos casos.",
      src: { label: "Keiyaku Watch, revisão de 2025", url: "https://keiyaku-watch.jp/media/hourei/kenchikukijunho-202504/" },
    },
  ];

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const Y0 = 1948, Y1 = 2027;
  const W = 900, H = 112, L = 20, R = 20, BASE = 72;
  const x = (y) => L + ((y - Y0) / (Y1 - Y0)) * (W - L - R);
  const years = [...new Set(EVENTS.map((e) => e.year))];

  const axis = `<svg class="lawline-axis" viewBox="0 0 ${W} ${H}" role="img" aria-label="Eixo de 1950 a 2025 com as datas das normas">
      <line x1="${L}" y1="${BASE}" x2="${W - R}" y2="${BASE}" class="ll-base"/>
      ${[1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((d) => `<line x1="${x(d)}" y1="${BASE - 4}" x2="${x(d)}" y2="${BASE + 4}" class="ll-tick"/><text x="${x(d)}" y="${BASE + 28}" class="ll-decade">${d}</text>`).join("")}
      ${years.map((y, i) => {
        const e = EVENTS.find((v) => v.year === y);
        const ty = BASE - 22 - (i % 3) * 16;
        return `<g class="ll-dot ${e.ward ? "ward" : "law"}" data-year="${y}" tabindex="0" role="button" aria-label="${y}: ${esc(e.title)}">
          <line x1="${x(y)}" y1="${BASE}" x2="${x(y)}" y2="${ty + 3}" class="ll-stem"/>
          <circle cx="${x(y)}" cy="${BASE}" r="6"/>
          <text x="${x(y)}" y="${ty}" class="ll-year">${y}</text>
        </g>`;
      }).join("")}
    </svg>`;

  const cards = EVENTS.map((e) => `
      <li class="ll-item ${e.ward ? "ward" : "law"}" data-year="${e.year}">
        <p class="ll-when">${esc(e.when)}${e.ward ? " · ward" : ""}</p>
        <h4>${esc(e.title)} <span class="ja" lang="ja">${esc(e.ja)}</span></h4>
        <p class="ll-art">${esc(e.article)}</p>
        <p>${esc(e.does)}</p>
        ${e.micro ? `<p class="ll-micro">${esc(e.micro)}</p>` : ""}
        <p class="ll-src">${e.src.url ? `<a href="${esc(e.src.url)}" target="_blank" rel="noreferrer">${esc(e.src.label)} ↗</a>` : esc(e.src.label)}</p>
      </li>`).join("");

  host.innerHTML = `
    <article class="lawline panel">
      <div class="panel-title">
        <div><p>1950 a 2025</p><h3>As leis que chegam ao microlote</h3></div>
      </div>
      <p class="lawline-lede">Só as normas que tocam diretamente o lote pequeno ou a casa que cabe nele: acesso à via, recuo, coeficientes, planos inclinados, sombra, lote mínimo e aprovação da obra. Os pontos azul-escuros são normas nacionais e metropolitanas. Os claros são as datas em que cada ward adotou um lote mínimo.</p>
      ${axis}
      <ol class="ll-list">${cards}</ol>
      <p class="plot-note">Datas nacionais e metropolitanas: textos oficiais e comentários citados em cada item. Datas e mínimos dos wards: planilha, aba 11 normas wards. Wards sem data única de adoção (mínimo variável por plano de distrito) não aparecem no eixo. Adachi: a planilha registra que uma alteração de 2023 estendeu a ordenança a certas divisões sem construção (aba 10 normas tempo) [VERIFICAR a data exata].</p>
    </article>`;

  const list = host.querySelector(".ll-list");
  const focusYear = (y) => {
    host.querySelectorAll(".ll-dot").forEach((d) => d.classList.toggle("on", d.dataset.year === String(y)));
    const items = [...list.querySelectorAll(".ll-item")];
    items.forEach((it) => it.classList.toggle("on", it.dataset.year === String(y)));
    const first = items.find((it) => it.dataset.year === String(y));
    if (first) list.scrollTo({ left: first.offsetLeft - list.offsetLeft, behavior: "smooth" });
  };
  host.querySelectorAll(".ll-dot").forEach((d) => {
    d.addEventListener("click", () => focusYear(d.dataset.year));
    d.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusYear(d.dataset.year); } });
  });
})();
