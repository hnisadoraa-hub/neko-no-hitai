/* Tóquio em relevo: os 23 wards levantados do chão.

   Duas escalas em window.NEKO_RELIEF (relief-data.js):
   · por 町丁目, as 筆 do 登記所備付地図 2025 (Ministério da Justiça), agregadas por
     classe de área. Cada bairro vira um fio, como no Human Terrain do Pudding: a
     altura conta as 筆 abaixo do limite escolhido, a cor dá a proporção no bairro;
   · por ward, três camadas da planilha: preço do solo residencial, proprietários
     de microlote por km² e FAR designado contra o construído. Cada ward vira uma
     coluna no seu centro.
   Ano que a planilha não registra não é interpolado. A cena usa three.js, que
   chega pelo carregador compartilhado quando o bloco se aproxima da tela. */

(function () {
  "use strict";

  const R = window.NEKO_RELIEF;
  const host = document.getElementById("city-blocks");
  if (!R || !R.towns || !host) return;

  const WARDS = R.wardOrder;
  const W = (w) => R.wards[w];
  const isEn = () => !!(window.NekoLang && window.NekoLang.current === "en");
  const L = (pt, en) => (isEn() ? en : pt);
  const nf = (v, d = 0) => (Number.isFinite(v)
    ? v.toLocaleString(isEn() ? "en-US" : "pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d })
    : "—");
  const nfE = (v, d = 0) => v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (v, d = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${nf(Math.abs(v) * 100, d)}%`;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- cores ---------- */

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function ramp(stops) {
    const s = stops.map(([t, c]) => [t, hex(c)]);
    return (t) => {
      if (t <= s[0][0]) return s[0][1];
      for (let i = 1; i < s.length; i += 1) {
        if (t <= s[i][0]) {
          const [t0, c0] = s[i - 1], [t1, c1] = s[i];
          const k = (t - t0) / (t1 - t0);
          return c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
        }
      }
      return s[s.length - 1][1];
    };
  }
  const SEQ = ramp([[0, "#c9d9e6"], [0.4, "#7fa3c1"], [0.75, "#35678f"], [1, "#0d2143"]]);
  const DIV = ramp([[-0.2, "#c2185b"], [-0.08, "#e3a1bb"], [0, "#d5e1ea"], [0.08, "#6f98b9"], [0.16, "#0d2143"]]);
  const RATIO = ramp([[0.4, "#d5e1ea"], [0.7, "#6f98b9"], [1, "#0d2143"]]);
  const HOT = hex("#c2185b");
  const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

  /* ---------- 筆 por 町丁目 ---------- */

  const EDGES = R.townBins; // [20, 50, 70, 100, 150, 300]
  const TSTOPS = [50, 70, 100, 150, 300];
  const town = R.towns.map(([x, y, wi, name, bins, pub, ro]) => ({ x, y, ward: WARDS[wi], name, ro, bins, pub, n: bins.reduce((a, b) => a + b, 0) }));
  const below = (t, T, frag) => {
    const k = EDGES.indexOf(T);
    let s = 0;
    for (let i = frag ? 0 : 1; i <= k; i += 1) s += t.bins[i];
    return s;
  };
  const TOTAL = town.reduce((a, t) => a + t.n, 0);
  const sumBelow = (T, frag) => town.reduce((a, t) => a + below(t, T, frag), 0);
  const PMAX = Math.max(...town.map((t) => below(t, 300, true)));
  const top3 = town.slice().sort((a, b) => below(b, 100, false) - below(a, 100, false)).slice(0, 3);

  /* ---------- camadas ---------- */

  const maxOf = (f) => Math.max(...WARDS.flatMap(f));
  const MODES = {
    parcels: {
      tab: ["Parcelas por bairro", "Parcels by neighbourhood"],
      stops: TSTOPS,
      label: (i) => `< ${TSTOPS[i]} m²`,
      height: ["altura: parcelas abaixo do limite, por bairro", "height: parcels below the threshold, per neighbourhood"],
      gap: ["registro de imóveis de 2025 · 2.858.961 parcelas em 3.137 bairros", "2025 land registry · 2,858,961 parcels in 3,137 neighbourhoods"],
    },
    price: {
      tab: ["Preço do solo", "Land price"],
      stops: R.years.price,
      label: (i) => String(R.years.price[i]),
      value: (w, i) => W(w).price[i],
      change: (w, i) => W(w).price[i] / W(w).price[0] - 1,
      max: maxOf((w) => W(w).price),
      color: (w, i) => SEQ(W(w).price[i] / W(w).price[0] - 1),
      height: ["altura: preço médio do m² residencial, por ward", "height: mean residential price per m², per ward"],
      legend: ["cor: alta desde 2016", "colour: rise since 2016"],
      legendRamp: [SEQ, 0, 1, "0%", "+100%"],
      gap: ["a planilha registra 2016, 2018, 2023, 2025 e 2026", "the spreadsheet records 2016, 2018, 2023, 2025 and 2026"],
    },
    micro: {
      tab: ["Microlotes", "Micro-lots"],
      stops: R.years.micro,
      label: (i) => String(R.years.micro[i]),
      value: (w, i) => W(w).owners[i] / W(w).km2,
      change: (w, i) => W(w).owners[i] / W(w).owners[0] - 1,
      max: maxOf((w) => W(w).owners.map((o) => o / W(w).km2)),
      color: (w, i) => DIV(W(w).owners[i] / W(w).owners[0] - 1),
      height: ["altura: proprietários de lote < 100 m² por km², por ward", "height: owners of lots < 100 m² per km², per ward"],
      legend: ["cor: variação de proprietários desde 2016", "colour: change in owners since 2016"],
      legendRamp: [DIV, -0.2, 0.16, "−20%", "+16%"],
      gap: ["série anual, 2016 a 2024 · Tokyo no Tochi", "yearly series, 2016 to 2024 · Tokyo no Tochi"],
    },
    far: {
      tab: ["Regra × construído", "Rule × built"],
      stops: [0, 1],
      label: (i) => (i ? L("construído", "built") : L("designado", "designated")),
      value: (w, i) => (i ? W(w).farBuilt : W(w).farDesignated),
      change: (w) => W(w).farBuilt / W(w).farDesignated,
      max: maxOf((w) => [W(w).farBuilt, W(w).farDesignated]),
      color: (w, i) => {
        if (!i) return hex("#9fbbd1");
        const r = W(w).farBuilt / W(w).farDesignated;
        return r > 1 ? HOT : RATIO(r);
      },
      height: ["altura: FAR em %, 2024, por ward", "height: FAR in %, 2024, per ward"],
      legend: ["cor: construído ÷ designado · rosa acima de 100%", "colour: built ÷ designated · pink above 100%"],
      legendRamp: [RATIO, 0.4, 1, "40%", "100%"],
      gap: ["FAR designado médio do ward e FAR aproximado construído, 2024", "ward mean designated FAR and approximate built FAR, 2024"],
    },
  };

  /* ---------- a leitura guiada ---------- */

  const P16 = (w) => W(w).price[0];
  const n20100 = sumBelow(100, false), n20 = town.reduce((a, t) => a + t.bins[0], 0);
  const zu = 0.973;
  const STEPS = [
    { mode: "parcels", i: 2, frag: false,
      t: ["Um fio por bairro", "One thread per neighbourhood"],
      p: [`Cada fio é um bairro. A altura conta as parcelas do registro de imóveis que medem entre 20 e 100 m², segundo o mapa do Ministério da Justiça do Japão de 2025. São ${nf(n20100)} nos 23 wards, ${nf(n20100 / TOTAL * 100, 0)}% de todas as ${nf(TOTAL)} parcelas. Os fios mais altos ficam na borda da cidade: ${top3[0].ro} (${top3[0].ward}), ${top3[1].ro} (${top3[1].ward}) e ${top3[2].ro} (${top3[2].ward}).`,
        `Each thread is a neighbourhood. Its height counts the land-registry parcels measuring between 20 and 100 m² on the 2025 map of Japan’s Ministry of Justice. There are ${nfE(n20100)} of them in the 23 wards, ${nfE(n20100 / TOTAL * 100, 0)}% of all ${nfE(TOTAL)} parcels. The tallest threads sit at the city’s edge: ${top3[0].ro} (${top3[0].ward}), ${top3[1].ro} (${top3[1].ward}) and ${top3[2].ro} (${top3[2].ward}).`] },
    { mode: "parcels", i: 2, frag: true,
      t: ["O que cabe abaixo de 20 m²", "What fits under 20 m²"],
      p: [`Somando as parcelas menores que 20 m², a cidade engorda: são mais ${nf(n20)}. O registro não diz para que servem. Pelo tamanho, muitas devem ser faixas de alargamento de rua e sobras de subdivisão, e não terrenos de casa (inferência). Por isso ficam fora da leitura principal.`,
        `Adding the parcels under 20 m², the city thickens: ${nfE(n20)} more. The registry does not say what they are for. Given their size, many must be road-widening strips and subdivision leftovers rather than house plots (inference). That is why they stay out of the main reading.`] },
    { mode: "parcels", i: 2, frag: false,
      t: ["Parcela não é lote", "A parcel is not a lot"],
      p: [`A parcela é a unidade do registro, não o terreno de uma casa: um lote pode juntar várias parcelas, e uma parcela pode ser rua. ${nf(zu * 100, 0)}% das áreas foram medidas sobre desenhos, alguns feitos na era Meiji, e valem como ordem de grandeza, não como área oficial. A altura é contagem e cresce com o tamanho do bairro; a cor é proporção e não cresce.`,
        `A parcel is the registry’s unit, not a house plot: one lot can join several parcels, and a parcel can be a street. ${nfE(zu * 100, 0)}% of the areas were measured on drawings, some made in the Meiji era, and read as orders of magnitude, not official areas. Height is a count and grows with the size of the neighbourhood; colour is a share and does not.`] },
    { mode: "price", i: 0,
      t: ["O preço do chão, 2016", "The price of the ground, 2016"],
      p: [`Agora, um bloco por ward. Em 2016, o m² residencial médio em Chiyoda valia ¥${nf(P16("Chiyoda"))}; em Adachi, ¥${nf(P16("Adachi"))}, quase nove vezes menos. O pico fica no centro, e o relevo cai mais depressa a leste do que a oeste.`,
        `Now, one block per ward. In 2016 the mean residential m² in Chiyoda was worth ¥${nfE(P16("Chiyoda"))}; in Adachi, ¥${nfE(P16("Adachi"))}, almost nine times less. The peak is in the centre, and the relief falls faster to the east than to the west.`] },
    { mode: "price", i: 4,
      t: ["Dez anos depois", "Ten years later"],
      p: ["Nenhum ward ficou mais barato. De 2016 a 2026, o preço médio residencial subiu entre 35% (Katsushika) e quase 100% (Minato). A planilha registra cinco anos: o controle salta entre eles e não inventa os do meio.",
        "No ward got cheaper. From 2016 to 2026 the mean residential price rose between 35% (Katsushika) and almost 100% (Minato). The spreadsheet records five years: the slider jumps between them and does not invent the ones in between."] },
    { mode: "micro", i: 0,
      t: ["Os donos do microlote, 2016", "Micro-lot owners, 2016"],
      p: [`Proprietários de lote residencial abaixo de 100 m², por km² de ward. O relevo vira do avesso: os picos estão em Arakawa, Taito e Nakano, e Chiyoda, onde o chão mais vale, quase some, com ${nf(W("Chiyoda").owners[0] / W("Chiyoda").km2)} por km².`,
        `Owners of residential lots under 100 m², per km² of ward. The relief turns inside out: the peaks are Arakawa, Taito and Nakano, and Chiyoda, where the ground is worth most, almost vanishes, with ${nfE(W("Chiyoda").owners[0] / W("Chiyoda").km2)} per km².`] },
    { mode: "micro", i: 8,
      t: ["2016 → 2024", "2016 → 2024"],
      p: ["Os 23 wards ganharam 43.932 proprietários de microlote (+7,4%). O centro foi na contramão: Chuo −18,9%, Chiyoda −13,7%, Minato −10,0%, Taito −4,2%. Quanto mais caro o solo em 2016, menor a variação até 2024 (ρ de Spearman = −0,67): associação, não causa. E a unidade é proprietário, não lote novo.",
        "The 23 wards gained 43,932 micro-lot owners (+7.4%). The centre went the other way: Chuo −18.9%, Chiyoda −13.7%, Minato −10.0%, Taito −4.2%. The pricier the ground in 2016, the smaller the change up to 2024 (Spearman’s ρ = −0.67): association, not cause. And the unit is the owner, not a new lot."] },
    { mode: "far", i: 0,
      t: ["A regra, 2024", "The rule, 2024"],
      p: ["A altura passa a ser o FAR médio que o zoneamento designa em cada ward: quanto a regra deixa construir sobre o terreno, em média.",
        "Height becomes the mean FAR that zoning designates in each ward: how much the rule lets you build over the land, on average."] },
    { mode: "far", i: 1,
      t: ["O construído, 2024", "The built, 2024"],
      p: ["E aqui o FAR aproximado do que está de pé. Em 20 dos 23 wards, o construído fica abaixo do designado; Adachi chega a 43% dele. Só Chiyoda, Chuo e Minato passam da regra. O número agrega a categoria fiscal takuchi tributável: descreve o ward, não o lote.",
        "And here, the approximate FAR of what is standing. In 20 of the 23 wards the built stays below the designated; Adachi reaches 43% of it. Only Chiyoda, Chuo and Minato go past the rule. The figure aggregates the taxable takuchi land category: it describes the ward, not the lot."] },
    { mode: null,
      t: ["O mapa é seu", "The map is yours"],
      p: ["Arraste para girar. Passe o cursor num fio ou numa coluna para ler os números; clique para fixar. As camadas ficam no alto, a régua embaixo.",
        "Drag to turn it. Hover a thread or a column to read its numbers; click to pin. Layers are at the top, the ruler at the bottom."] },
  ];

  /* ---------- HTML ---------- */

  const art = document.createElement("article");
  art.className = "city-block panel relief-block";
  art.id = "block-relief";
  art.innerHTML = `
    <div class="panel-title"><div><p data-r="kicker"></p><h3 data-r="title"></h3></div></div>
    <p class="relief-lede" data-r="lede"></p>
    <div class="relief-scrolly">
      <div class="relief-stage">
        <canvas class="relief-canvas" aria-hidden="true"></canvas>
        <div class="relief-labels" aria-hidden="true"></div>
        <p class="relief-loading" data-r="loading"></p>
        <div class="relief-head">
          <div class="relief-tabs" role="group">
            ${Object.keys(MODES).map((m) => `<button type="button" data-mode="${m}"></button>`).join("")}
          </div>
          <p class="relief-now"><strong class="relief-year"></strong><span class="relief-height"></span></p>
        </div>
        <div class="relief-info" aria-live="polite" hidden></div>
        <div class="relief-foot">
          <div class="relief-legend"><span class="relief-legend-label"></span><span class="relief-legend-scale"><b></b><i class="relief-legend-bar"></i><b></b></span>
            <label class="relief-frag"><input type="checkbox"> <span></span></label></div>
          <div class="relief-time">
            <button type="button" class="relief-play" aria-label="">▶</button>
            <div class="relief-track">
              <div class="relief-rail"><i class="relief-fill"></i></div>
              <div class="relief-ticks"></div>
              <input type="range" class="relief-range" min="0" max="1" step="1" value="0">
            </div>
          </div>
          <p class="relief-gap"></p>
        </div>
      </div>
      <div class="relief-steps">
        ${STEPS.map((s, k) => `<section class="relief-step" data-step="${k}"><div class="relief-card"><p class="relief-card-n">${String(k + 1).padStart(2, "0")} / ${String(STEPS.length).padStart(2, "0")}</p><h4></h4><p class="relief-card-p"></p></div></section>`).join("")}
      </div>
    </div>
    <details class="relief-table">
      <summary data-r="tableSummary"></summary>
      <div class="relief-table-wrap"><table><thead><tr><th class="c1"></th><th class="num c2"></th><th class="num c3"></th></tr></thead><tbody></tbody></table></div>
    </details>
    <p class="city-note">Fontes. Parcelas por bairro: 出典「登記所備付地図データ」東京都千代田区ほか22区（法務省）<a href="https://www.geospatial.jp/ckan/dataset/houmusyouchizu-2025-1-719" target="_blank" rel="noopener">G空間情報センター</a>（2026年9月30日に利用）を加工して作成: edição 2025, 2.929.739 parcelas lidas; ficaram 2.858.961 com número de lote (sem ruas, cursos d’água e parcelas sem número) e sem duplicatas entre folhas. A área de cada parcela é calculada pela geometria do mapa e não é a área registrada; ${nf(zu * 100, 1)}% vêm de medição sobre desenho, e o próprio Ministério avisa que a precisão varia com a época do desenho. Os bairros foram casados por nome com os pontos de referência de <a href="https://github.com/geolonia/japanese-addresses" target="_blank" rel="noopener">geolonia/japanese-addresses</a> (CC BY 4.0, a partir dos dados de referência de endereços do MLIT); 6.015 parcelas (0,2%) de nomes antigos ficaram sem ponto. Parcela não é lote nem domicílio. Camadas por ward: ${R.source.price} ${R.source.micro} A unidade é proprietário, não quantidade de parcelas. ${R.source.far} O FAR construído agrega a categoria fiscal takuchi tributável e não equivale ao FAR residencial de cada lote. Anos ausentes não são interpolados; o ρ de Spearman (−0,67) cruza o preço de 2016 com a variação de proprietários de 2016 a 2024 nos 23 wards e descreve associação, não causa.</p>`;

  const micro = document.getElementById("block-micro");
  if (micro && micro.parentNode === host) micro.after(art);
  else host.appendChild(art);

  const q = (s) => art.querySelector(s);
  const stage = q(".relief-stage");
  const canvas = q(".relief-canvas");
  const labelsHost = q(".relief-labels");
  const info = q(".relief-info");
  const range = q(".relief-range");
  const ticks = q(".relief-ticks");
  const playBtn = q(".relief-play");
  const steps = q(".relief-steps");
  const fragBox = q(".relief-frag input");

  const state = { mode: "parcels", i: 2, frag: false, hover: null, pin: null, playing: 0 };
  const three = { renderer: null, free: false, dragged: false };

  /* ---------- textos ---------- */

  function paintText() {
    const T = {
      kicker: L("relevo · 23 wards", "relief · 23 wards"),
      title: L("Tóquio em relevo: a parcela, o preço e a regra", "Tokyo in relief: the parcel, the price and the rule"),
      lede: L("Primeiro, a cidade em fios: cada bairro sobe conforme o número de parcelas pequenas que o registro de imóveis conta ali. Depois, os 23 wards em blocos, com o preço do solo, os donos de microlote e a regra de ocupação. Role para a leitura guiada; no fim, o mapa é seu.",
        "First, the city in threads: each neighbourhood rises with the number of small parcels the land registry counts there. Then the 23 wards as blocks, with land price, micro-lot owners and the building rule. Scroll for the guided reading; at the end, the map is yours."),
      loading: L("levantando o relevo…", "raising the relief…"),
      tableSummary: L("Ver os números desta camada", "See this layer’s numbers"),
    };
    art.querySelectorAll("[data-r]").forEach((n) => { if (T[n.dataset.r] != null) n.textContent = T[n.dataset.r]; });
    art.querySelectorAll(".relief-tabs button").forEach((b) => { b.textContent = L(...MODES[b.dataset.mode].tab); });
    art.querySelectorAll(".relief-step").forEach((s) => {
      const st = STEPS[Number(s.dataset.step)];
      s.querySelector("h4").textContent = L(...st.t);
      s.querySelector(".relief-card-p").textContent = L(...st.p);
    });
    q(".relief-frag span").textContent = L("somar as parcelas < 20 m²", "add parcels < 20 m²");
    stage.setAttribute("aria-label", L("Mapa em três dimensões dos 23 wards de Tóquio. Os números estão na tabela abaixo do mapa.", "Three-dimensional map of Tokyo’s 23 wards. The numbers are in the table below the map."));
    paintMode();
  }

  /* domínio de cor dos fios: do 5º ao 95º percentil da proporção atual */
  let shareDom = [0, 1];
  function townShare(t) { return t.n ? below(t, TSTOPS[state.i], state.frag) / t.n : 0; }
  function computeShareDom() {
    const s = town.filter((t) => t.n >= 30).map(townShare).sort((a, b) => a - b);
    shareDom = [s[Math.floor(s.length * 0.05)], s[Math.floor(s.length * 0.95)]];
  }

  function paintMode() {
    const M = MODES[state.mode];
    const P = state.mode === "parcels";
    if (P) computeShareDom();
    art.querySelectorAll(".relief-tabs button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
    q(".relief-height").textContent = L(...M.height);
    q(".relief-gap").textContent = L(...M.gap);
    q(".relief-frag").hidden = !P;
    fragBox.checked = state.frag;
    const n = 6;
    const [fn, a, b, la, lb] = P ? [(t) => SEQ(t), 0, 1, `${nf(shareDom[0] * 100, 0)}%`, `${nf(shareDom[1] * 100, 0)}%`] : M.legendRamp;
    q(".relief-legend-bar").style.background = `linear-gradient(90deg, ${Array.from({ length: n }, (_, k) => css(fn(a + (b - a) * k / (n - 1)))).join(",")})`;
    q(".relief-legend-label").textContent = P
      ? L("cor: parte das parcelas do bairro abaixo do limite", "colour: share of the neighbourhood’s parcels below the threshold")
      : L(...M.legend);
    const ends = q(".relief-legend-scale").querySelectorAll("b");
    ends[0].textContent = la; ends[1].textContent = lb;

    /* a régua anda no eixo real (anos ou m²); só os valores registrados têm marca */
    const s = M.stops;
    const pos = (k) => (s.length < 2 ? 0 : state.mode === "far" ? k * 100
      : P ? (k / (s.length - 1)) * 100
      : ((s[k] - s[0]) / (s[s.length - 1] - s[0])) * 100);
    range.min = 0; range.max = 1000; range.step = 1;
    range.value = String(pos(state.i) * 10);
    range.setAttribute("aria-label", P ? L("Limite de área", "Area threshold") : L("Ano", "Year"));
    range.setAttribute("aria-valuetext", M.label(state.i));
    q(".relief-fill").style.width = `${pos(state.i)}%`;
    const px = (ticks.clientWidth || 600) / 100;
    let prev = -1;
    const show = s.map(() => false);
    s.forEach((v, k) => {
      const room = prev < 0 || (pos(k) - pos(prev)) * px >= 42;
      if (k === s.length - 1) { if (!room && prev > 0) show[prev] = false; show[k] = true; }
      else if (room) { show[k] = true; prev = k; }
    });
    ticks.innerHTML = s.map((v, k) => `<span style="left:${pos(k)}%" class="${k === state.i ? "on" : ""}${k <= state.i ? " past" : ""}${P && v === 100 ? " mark" : ""}"><em>${show[k] ? M.label(k) : ""}</em></span>`).join("");
    range.dataset.pos = JSON.stringify(s.map((_, k) => pos(k)));
    playBtn.setAttribute("aria-label", state.playing ? L("Parar", "Stop") : P ? L("Tocar a régua", "Play the ruler") : L("Tocar os anos", "Play the years"));
    playBtn.textContent = state.playing ? "❚❚" : "▶";
    q(".relief-year").textContent = M.label(state.i);
    paintTable();
    paintInfo();
  }

  const fmtValue = (mode, v) => (mode === "price" ? `¥${nf(v)}/m²`
    : mode === "micro" ? `${nf(v)} ${L("por km²", "per km²")}`
    : `${nf(v, 1)}%`);

  function paintTable() {
    const th = art.querySelectorAll(".relief-table th");
    if (state.mode === "parcels") {
      const T = TSTOPS[state.i];
      th[0].textContent = L("Bairro", "Neighbourhood");
      th[1].textContent = L(`parcelas ${state.frag ? "< " : "20 a "}${T} m²`, `parcels ${state.frag ? "< " : "20 to "}${T} m²`);
      th[2].textContent = L("parte do bairro", "share of town");
      const rows = town.map((t) => ({ t, v: below(t, T, state.frag) })).sort((a, b) => b.v - a.v).slice(0, 60);
      q(".relief-table tbody").innerHTML = rows.map((r) => `<tr><td>${r.t.ro} <span class="soft">${r.t.ward}</span></td><td class="num">${nf(r.v)}</td><td class="num">${nf(r.v / r.t.n * 100, 0)}%</td></tr>`).join("")
        + `<tr><td colspan="3" class="soft">${L("os 60 bairros com mais parcelas abaixo do limite", "the 60 neighbourhoods with most parcels below the threshold")}</td></tr>`;
      return;
    }
    const M = MODES[state.mode];
    th[0].textContent = "Ward";
    th[1].textContent = state.mode === "price" ? "¥/m²" : state.mode === "micro" ? L("prop./km²", "owners/km²") : "FAR %";
    th[2].textContent = state.mode === "far" ? L("construído ÷ designado", "built ÷ designated") : L(`desde ${M.stops[0]}`, `since ${M.stops[0]}`);
    const rows = WARDS.map((w) => ({ w, v: M.value(w, state.i), c: M.change(w, state.i) })).sort((a, b) => b.v - a.v);
    q(".relief-table tbody").innerHTML = rows.map((r) => `<tr><td>${r.w}</td><td class="num">${fmtValue(state.mode, r.v)}</td><td class="num">${state.mode === "far" ? `${nf(r.c * 100, 0)}%` : signed(r.c)}</td></tr>`).join("");
  }

  function paintInfo() {
    const h = state.hover || state.pin;
    const ok = h && ((state.mode === "parcels") === (h.kind === "town"));
    if (!ok) { info.hidden = true; return; }
    info.hidden = false;
    let head, body;
    if (h.kind === "town") {
      const t = town[h.id], T = TSTOPS[state.i], v = below(t, T, state.frag);
      head = `${t.ro} <span>${t.ward}</span>`;
      body = `<dl><dt>${L(`parcelas ${state.frag ? "< " : "de 20 a "}${T} m²`, `parcels ${state.frag ? "< " : "20 to "}${T} m²`)}</dt><dd>${nf(v)}</dd>
        <dt>${L("parcelas no bairro", "parcels in the neighbourhood")}</dt><dd>${nf(t.n)}</dd>
        <dt>${L("parte abaixo do limite", "share below the threshold")}</dt><dd>${nf(v / t.n * 100, 0)}%</dd>
        <dt>${L("< 20 m²", "< 20 m²")}</dt><dd>${nf(t.bins[0])}</dd>
        <dt>${L("com coordenadas públicas", "with public coordinates")}</dt><dd>${nf(t.pub)}</dd></dl>`;
    } else {
      const w = h.id, d = W(w), i = state.i;
      head = `${w} <span>${MODES[state.mode].label(i)}</span>`;
      if (state.mode === "price") {
        body = `<dl><dt>${L("preço médio residencial", "mean residential price")}</dt><dd>¥${nf(d.price[i])}/m²</dd>
          <dt>${L("desde 2016", "since 2016")}</dt><dd>${signed(d.price[i] / d.price[0] - 1)}</dd></dl>`;
      } else if (state.mode === "micro") {
        body = `<dl><dt>${L("proprietários de lote < 100 m²", "owners of lots < 100 m²")}</dt><dd>${nf(d.owners[i])}</dd>
          <dt>${L("por km² de ward", "per km² of ward")}</dt><dd>${nf(d.owners[i] / d.km2)}</dd>
          <dt>${L("área média do microlote", "mean micro-lot area")}</dt><dd>${nf(d.mean[i], 1)} m²</dd>
          <dt>${L("proprietários desde 2016", "owners since 2016")}</dt><dd>${signed(d.owners[i] / d.owners[0] - 1)}</dd></dl>`;
      } else {
        body = `<dl><dt>${L("FAR designado (média do ward)", "designated FAR (ward mean)")}</dt><dd>${nf(d.farDesignated, 1)}%</dd>
          <dt>${L("FAR construído (aprox.)", "built FAR (approx.)")}</dt><dd>${nf(d.farBuilt, 1)}%</dd>
          <dt>${L("construído ÷ designado", "built ÷ designated")}</dt><dd>${nf(d.farBuilt / d.farDesignated * 100, 0)}%</dd></dl>`;
      }
    }
    const pinned = state.pin && h === state.pin;
    info.innerHTML = `<p class="relief-info-name">${head}${pinned ? `<button type="button" class="relief-unpin" aria-label="${L("Soltar", "Unpin")}">×</button>` : ""}</p>${body}`;
    const un = info.querySelector(".relief-unpin");
    if (un) un.addEventListener("click", () => { state.pin = null; paintInfo(); paintScene(); });
  }

  /* ---------- estado ---------- */

  function setMode(mode, i, frag) {
    if (!MODES[mode]) return;
    if (mode !== state.mode) { state.hover = null; state.pin = null; }
    state.mode = mode;
    state.i = Math.max(0, Math.min(MODES[mode].stops.length - 1, i));
    if (frag !== undefined) state.frag = frag;
    paintMode();
    paintScene();
  }
  function stopPlay() {
    if (!state.playing) return;
    clearInterval(state.playing);
    state.playing = 0;
    paintMode();
  }

  art.querySelectorAll(".relief-tabs button").forEach((b) => b.addEventListener("click", () => {
    stopPlay();
    const m = b.dataset.mode;
    setMode(m, m === state.mode ? state.i : m === "parcels" ? 2 : MODES[m].stops.length - 1);
  }));
  range.addEventListener("input", () => {
    stopPlay();
    const v = Number(range.value) / 10;
    const pos = JSON.parse(range.dataset.pos || "[0]");
    let k = 0;
    pos.forEach((p, j) => { if (Math.abs(p - v) < Math.abs(pos[k] - v)) k = j; });
    if (k !== state.i) setMode(state.mode, k);
    else range.value = String(pos[k] * 10);
  });
  range.addEventListener("change", () => paintMode());
  fragBox.addEventListener("change", () => setMode(state.mode, state.i, fragBox.checked));
  playBtn.addEventListener("click", () => {
    if (state.playing) { stopPlay(); return; }
    if (state.i >= MODES[state.mode].stops.length - 1) setMode(state.mode, 0);
    state.playing = setInterval(() => {
      if (state.i >= MODES[state.mode].stops.length - 1) { stopPlay(); return; }
      setMode(state.mode, state.i + 1);
    }, 1300);
    paintMode();
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting)[0];
      if (!hit) return;
      const st = STEPS[Number(hit.target.dataset.step)];
      art.querySelectorAll(".relief-step").forEach((n) => n.classList.toggle("active", n === hit.target));
      if (st.mode) { stopPlay(); setMode(st.mode, st.i, st.frag !== undefined ? st.frag : state.frag); }
    }, { rootMargin: window.innerWidth > 900 ? "-50% 0px -50% 0px" : "-72% 0px -28% 0px" });
    art.querySelectorAll(".relief-step").forEach((n) => io.observe(n));
  }

  /* ---------- palco ---------- */

  function sizeStage() {
    const bar = document.querySelector(".section-bar");
    const top = (bar ? bar.getBoundingClientRect().height : 0) + 8;
    const h = Math.max(460, Math.min(920, window.innerHeight - top - 8));
    stage.style.top = `${top}px`;
    stage.style.height = `${h}px`;
    steps.style.marginTop = `${-h}px`;
    art.querySelectorAll(".relief-step").forEach((n, k) => {
      n.style.minHeight = `${Math.round(h * (k === STEPS.length - 1 ? 1.05 : 0.95))}px`;
    });
    if (three.renderer) resize3d();
  }

  /* =====================================================================
     a cena
     ===================================================================== */

  function paintScene() {
    if (!three.spikes) return;
    const P = state.mode === "parcels";
    const H = three.H;
    const hv = state.hover || state.pin;
    /* fios */
    const T = TSTOPS[state.i];
    for (let k = 0; k < town.length; k += 1) {
      const t = town[k];
      three.tTo[k] = P ? Math.max(0.01, (below(t, T, state.frag) / PMAX) * H) : 0;
      const on = hv && hv.kind === "town" && hv.id === k;
      const c = on ? HOT : SEQ((townShare(t) - shareDom[0]) / ((shareDom[1] - shareDom[0]) || 1));
      three.cTo[k * 3] = c[0] / 255; three.cTo[k * 3 + 1] = c[1] / 255; three.cTo[k * 3 + 2] = c[2] / 255;
    }
    /* colunas */
    const M = MODES[state.mode];
    WARDS.forEach((w, k) => {
      three.wTo[k] = P ? 0 : Math.max(0.02, (M.value(w, state.i) / M.max) * H);
      const on = hv && hv.kind === "ward" && hv.id === w;
      const c = P ? [200, 210, 220] : on ? [255, 214, 102] : M.color(w, state.i);
      three.wcTo[k * 3] = c[0] / 255; three.wcTo[k * 3 + 1] = c[1] / 255; three.wcTo[k * 3 + 2] = c[2] / 255;
    });
    labelsHost.classList.toggle("cols", !P);
    if (reduce) settle(1);
    three.dirty = true;
  }

  function settle(k) {
    const { spikes, cols, tCur, tTo, cCur, cTo, wCur, wTo, wcCur, wcTo, m4, col } = three;
    let moving = false;
    const step = (cur, to, n, apply) => {
      for (let i = 0; i < n; i += 1) {
        const d = to[i] - cur[i];
        if (Math.abs(d) > 0.0015) { moving = true; cur[i] += d * k; } else cur[i] = to[i];
      }
    };
    step(tCur, tTo, tCur.length);
    step(cCur, cTo, cCur.length);
    step(wCur, wTo, wCur.length);
    step(wcCur, wcTo, wcCur.length);
    for (let i = 0; i < town.length; i += 1) {
      const t = town[i];
      m4.makeScale(1, tCur[i], 1);
      m4.setPosition(t.x, 0, -t.y);
      spikes.setMatrixAt(i, m4);
      col.setRGB(cCur[i * 3], cCur[i * 3 + 1], cCur[i * 3 + 2]);
      spikes.setColorAt(i, col);
    }
    spikes.instanceMatrix.needsUpdate = true;
    spikes.instanceColor.needsUpdate = true;
    spikes.visible = tCur.some((v) => v > 0.012);
    WARDS.forEach((w, i) => {
      const c = three.center[w];
      m4.makeScale(1, wCur[i], 1);
      m4.setPosition(c.x, 0, c.z);
      cols.setMatrixAt(i, m4);
      col.setRGB(wcCur[i * 3], wcCur[i * 3 + 1], wcCur[i * 3 + 2]);
      cols.setColorAt(i, col);
    });
    cols.instanceMatrix.needsUpdate = true;
    cols.instanceColor.needsUpdate = true;
    cols.visible = wCur.some((v) => v > 0.03);
    return moving;
  }

  function build3d() {
    const T3 = window.THREE;
    let renderer;
    try {
      renderer = new T3.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (err) {
      q(".relief-loading").textContent = L("Este navegador não abriu o WebGL. Os números estão na tabela abaixo.", "This browser did not open WebGL. The numbers are in the table below.");
      return;
    }
    q(".relief-loading").hidden = true;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T3.PCFSoftShadowMap;
    const scene = new T3.Scene();
    const BG = 0xf2f5f8;
    scene.fog = new T3.Fog(BG, 60, 140);
    const camera = new T3.PerspectiveCamera(22, 1, 1, 400);
    scene.add(new T3.HemisphereLight(0xffffff, 0xb9c6d3, 0.72));
    const sun = new T3.DirectionalLight(0xfffaf2, 0.62);
    sun.position.set(-14, 30, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 90 });
    sun.shadow.bias = -0.0006;
    sun.shadow.radius = 3;
    scene.add(sun);

    const span = R.geom.span;
    three.span = span;
    three.H = span * 0.26;

    /* chão: os 23 wards em papel, com os limites em branco */
    const ground = new T3.MeshLambertMaterial({ color: 0xe6ecf1 });
    const edge = new T3.LineBasicMaterial({ color: 0xffffff });
    const center = {};
    for (const w of WARDS) {
      const rings = R.geom.outline[w];
      let best = null, bestA = 0;
      const shapes = rings.map((r) => {
        const v = r.map(([x, y]) => new T3.Vector2(x, y));
        const a = Math.abs(T3.ShapeUtils.area(v));
        if (a > bestA) { bestA = a; best = r; }
        const line = new T3.Line(new T3.BufferGeometry().setFromPoints(r.map(([x, y]) => new T3.Vector3(x, 0.015, -y))), edge);
        scene.add(line);
        return new T3.Shape(v);
      });
      const g = new T3.ShapeGeometry(shapes);
      g.rotateX(-Math.PI / 2);
      const m = new T3.Mesh(g, ground);
      m.receiveShadow = true;
      scene.add(m);
      let cx = 0, cy = 0, A2 = 0;
      for (let k = 0; k < best.length - 1; k += 1) {
        const [ax, ay] = best[k], [bx, by] = best[k + 1];
        const cr = ax * by - bx * ay;
        A2 += cr; cx += (ax + bx) * cr; cy += (ay + by) * cr;
      }
      center[w] = { x: cx / (3 * A2), z: -cy / (3 * A2) };
      const lab = document.createElement("span");
      lab.textContent = w;
      labelsHost.appendChild(lab);
      center[w].lab = lab;
    }
    /* sombra no mar e fora dos wards: um plano que só recebe sombra */
    const sh = new T3.Mesh(new T3.PlaneGeometry(90, 90), new T3.ShadowMaterial({ opacity: 0.08 }));
    sh.rotateX(-Math.PI / 2);
    sh.position.y = -0.01;
    sh.receiveShadow = true;
    scene.add(sh);

    /* fios: uma instância por 町丁目 */
    const sg = new T3.BoxGeometry(0.16, 1, 0.16);
    sg.translate(0, 0.5, 0);
    const spikes = new T3.InstancedMesh(sg, new T3.MeshLambertMaterial({ color: 0xffffff }), town.length);
    spikes.castShadow = true;
    spikes.instanceMatrix.setUsage(T3.DynamicDrawUsage);
    spikes.setColorAt(0, new T3.Color(1, 1, 1));
    scene.add(spikes);
    /* colunas: uma por ward */
    const cg = new T3.BoxGeometry(1.05, 1, 1.05);
    cg.translate(0, 0.5, 0);
    const cols = new T3.InstancedMesh(cg, new T3.MeshLambertMaterial({ color: 0xffffff }), WARDS.length);
    cols.castShadow = true;
    cols.setColorAt(0, new T3.Color(1, 1, 1));
    scene.add(cols);

    Object.assign(three, {
      T3, renderer, scene, camera, spikes, cols, center,
      tCur: new Float32Array(town.length), tTo: new Float32Array(town.length),
      cCur: new Float32Array(town.length * 3).fill(0.85), cTo: new Float32Array(town.length * 3),
      wCur: new Float32Array(WARDS.length), wTo: new Float32Array(WARDS.length),
      wcCur: new Float32Array(WARDS.length * 3).fill(0.8), wcTo: new Float32Array(WARDS.length * 3),
      m4: new T3.Matrix4(), col: new T3.Color(), v: new T3.Vector3(), v2: new T3.Vector3(),
      theta: -0.3, phi: 0.96, ray: new T3.Raycaster(),
    });

    let drag = null;
    canvas.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, t: three.theta, p: three.phi, moved: false };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) { drag.moved = true; three.dragged = true; }
        three.theta = drag.t - dx * 0.006;
        three.phi = Math.max(0.28, Math.min(1.3, drag.p - dy * 0.004));
        three.dirty = true;
        return;
      }
      if (e.pointerType === "mouse") pick(e, false);
    });
    canvas.addEventListener("pointerup", (e) => { if (drag && !drag.moved) pick(e, true); drag = null; });
    canvas.addEventListener("pointercancel", () => { drag = null; });
    canvas.addEventListener("pointerleave", () => { if (state.hover) { state.hover = null; paintInfo(); paintScene(); } });

    new ResizeObserver(resize3d).observe(stage);
    resize3d();
    paintScene();
    settle(1);
    let last = performance.now(), visible = true;
    new IntersectionObserver((es) => { visible = es.some((x) => x.isIntersecting); }, { rootMargin: "200px 0px" }).observe(stage);
    const loop = (now) => {
      requestAnimationFrame(loop);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.15, Math.max(0, (now - last) / 1000));
      last = now;
      const moving = settle(reduce ? 1 : 1 - Math.exp(-dt * 4.2));
      const drift = !three.dragged && !reduce;
      if (moving || drift || three.dirty) {
        three.dirty = false;
        render(drift ? Math.sin(now / 11000) * 0.16 : 0);
      }
    };
    requestAnimationFrame(loop);
  }

  function pick(e, click) {
    const { T3, camera, ray, spikes, cols } = three;
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new T3.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    let h = null;
    if (state.mode === "parcels") {
      const hit = ray.intersectObject(spikes, false)[0];
      if (hit && hit.instanceId != null) h = { kind: "town", id: hit.instanceId };
    } else {
      const hit = ray.intersectObject(cols, false)[0];
      if (hit && hit.instanceId != null) h = { kind: "ward", id: WARDS[hit.instanceId] };
    }
    const same = (a, b) => (a && b ? a.kind === b.kind && a.id === b.id : a === b);
    if (click) state.pin = h && !same(state.pin, h) ? h : null;
    else if (same(h, state.hover)) return;
    else state.hover = h;
    if (state.pin && state.hover && same(state.pin, state.hover)) state.hover = state.pin;
    paintInfo();
    paintScene();
  }

  function resize3d() {
    const { renderer, camera } = three;
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const wide = w > 900;
    const shift = wide ? Math.round(w * 0.15) : 0;
    camera.setViewOffset(w, h, -shift, wide ? -Math.round(h * 0.02) : Math.round(h * 0.04), w, h);
    const vf = (camera.fov * Math.PI) / 180;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    const need = three.span * (wide ? 0.56 : 0.47);
    three.radius = Math.max(need / Math.tan(vf / 2), need / Math.tan(hf / 2) * (wide ? 1.12 : 1));
    three.scene.fog.near = three.radius * 0.7;
    three.scene.fog.far = three.radius * 1.55;
    camera.far = three.radius * 3;
    camera.updateProjectionMatrix();
    three.dirty = true;
  }

  function render(wobble) {
    const { renderer, scene, camera, center, v, v2, ray } = three;
    const th = three.theta + wobble, ph = three.phi, rad = three.radius;
    camera.position.set(Math.sin(th) * Math.sin(ph) * rad, Math.cos(ph) * rad + 0.8, Math.cos(th) * Math.sin(ph) * rad);
    camera.lookAt(0, 0.8, 0);
    renderer.render(scene, camera);
    const w = stage.clientWidth, h = stage.clientHeight;
    const P = state.mode === "parcels";
    const occl = (three.tick = (three.tick || 0) + 1) % 8 === 0 || !wobble;
    WARDS.forEach((ward, i) => {
      const c = center[ward];
      v.set(c.x, P ? 0.05 : three.wCur[i] + 0.3, c.z);
      if (occl) {
        const dir = v2.copy(v).sub(camera.position);
        const dist = dir.length();
        ray.set(camera.position, dir.normalize());
        const hit = ray.intersectObject(P ? three.spikes : three.cols, false)[0];
        const own = !P && hit && hit.instanceId === i;
        c.lab.classList.toggle("hid", !!hit && !own && hit.distance < dist - 0.4);
      }
      v.project(camera);
      c.lab.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, ${P ? "-50%" : "-100%"})`;
    });
  }

  function loadThree() {
    if (window.THREE) return Promise.resolve();
    if (window.NekoLoadThree) return window.NekoLoadThree();
    return Promise.reject(new Error("sem carregador"));
  }
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    loadThree().then(build3d).catch(() => {
      q(".relief-loading").textContent = L("O relevo não carregou. Os números estão na tabela abaixo.", "The relief did not load. The numbers are in the table below.");
    });
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: "900px 0px" });
    io.observe(art);
  } else start();

  window.addEventListener("resize", sizeStage);
  window.addEventListener("nekolang", paintText);
  sizeStage();
  paintText();

  window.NekoRelief = { setMode, get state() { return { ...state }; }, get ready() { return !!three.renderer; } };
})();
