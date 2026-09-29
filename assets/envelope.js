/* A norma, corte por corte.

   Duas peças novas na seção 07:
   1. um corte que recebe uma regra de cada vez, para mostrar que o envelope
      não é um número e sim a interseção de superfícies;
   2. um jogo de cinco rodadas: vendo o volume cortado, qual regra cortou?

   Os parâmetros saem de assets/law.js, que é a transcrição das classes de
   zona da 建築基準法. O lote é hipotético e está dito no texto: serve para
   ver a regra operar, não para atestar conformidade de parcela nenhuma.   */

(function () {
  "use strict";

  const A = window.NekoAtlas;
  const LAW = window.NEKO_LAW;
  if (!A || !LAW) return;
  const $ = (id) => document.getElementById(id);
  const fmt = A.fmt;
  const esc = A.escapeHtml;

  const INK = "#10264a";
  const HOT = "#c2185b";
  const SOFT = "#a9c5d9";

  /* ---------------------------------------------------------------
     geometria do corte
     --------------------------------------------------------------- */

  const PX = 17;              /* pixels por metro */
  const HMAX = 15;            /* metros desenhados na vertical */
  const M = { l: 42, r: 26, t: 20, b: 54 };

  function sectionGeom(state) {
    const depth = state.depth;
    const road = state.road;
    const zone = LAW.zones.find((z) => z.key === state.zone) || LAW.zones[0];
    return { depth, road, zone };
  }

  /* altura permitida em cada x (metros a partir da divisa da via) */
  function limitAt(x, g, rules) {
    let h = HMAX;
    if (rules.absolute && g.zone.absoluteHeight) h = Math.min(h, g.zone.absoluteHeight);
    if (rules.road) h = Math.min(h, g.zone.roadSlope * (x + g.road));
    if (rules.north && g.zone.northStart != null) h = Math.min(h, g.zone.northStart + g.zone.northSlope * (g.depth - x));
    return Math.max(0, h);
  }

  const STEPS = [
    { key: "lote", title: "O lote", rules: {},
      text: "Cinco metros de frente por doze de profundidade: 60 m² de terreno, via de {road} m na frente e a divisa norte no fundo. Nenhuma regra aplicada ainda. É este chão que todas as outras linhas vão recortar." },
    { key: "bcr", title: "建ぺい率 · a planta encolhe", rules: {},
      text: "A taxa de ocupação de {bcr}% limita a projeção da edificação a {foot} m². O que sai não é altura: é a sombra da casa no chão, e com ela o recuo que sobra em volta." },
    { key: "far", title: "容積率 · a área total encolhe", rules: {},
      text: "O coeficiente de {far}% dá {gfa} m² de área computável. Com {foot} m² de projeção, isso equivale a {floorsEq} pavimentos cheios. A via de {road} m também pesa aqui: abaixo de 12 m de largura, o artigo 52 impõe outro teto, {roadFar}%, e vale o menor." },
    { key: "absolute", title: "Altura absoluta · a tampa", rules: { absolute: true },
      text: "Nesta classe de zona a altura é travada em {abs} m, independentemente do que o coeficiente permitiria. É a única das regras que é mesmo um número." },
    { key: "road", title: "道路斜線 · o plano da via", rules: { absolute: true, road: true },
      text: "Do outro lado da rua sobe um plano inclinado de {roadSlope} para 1. Quanto mais estreita a via, mais cedo ele corta: com {road} m de rua, na divisa da frente a altura já está limitada a {roadAtFront} m." },
    { key: "north", title: "北側斜線 · o plano do norte", rules: { absolute: true, road: true, north: true },
      text: "Do fundo desce o plano da face norte, que começa a {northStart} m sobre a divisa e sobe {northSlope} para 1. Ele existe para não roubar o sol do vizinho de trás, e é o que costuma explicar o telhado torto das microcasas." },
    { key: "fim", title: "O que sobra", rules: { absolute: true, road: true, north: true },
      text: "O envelope é a interseção, não a soma. Sobram {vol} m² de área de corte sob as três superfícies, e dentro desse recorte ainda é preciso caber {gfa} m² de área computável. É por isso que não existe um FAR máximo por ward: o teto é da parcela." },
  ];

  function computeNumbers(g, state) {
    const lotArea = 5 * g.depth;
    const bcr = state.bcr;
    const far = state.far;
    const foot = (lotArea * bcr) / 100;
    const roadFar = Math.round(g.road * (g.zone.roadCoef || 0.4) * 100);
    const farEff = Math.min(far, roadFar);
    const gfa = (lotArea * farEff) / 100;
    const roadAtFront = g.zone.roadSlope * g.road;
    return { lotArea, bcr, far, foot, roadFar, farEff, gfa, roadAtFront,
      floorsEq: gfa / foot, abs: g.zone.absoluteHeight };
  }

  function sectionSvg(g, rules, state, opts) {
    const o = opts || {};
    const roadPx = g.road * PX;
    const W = M.l + roadPx + g.depth * PX + M.r;
    const H = M.t + HMAX * PX + M.b;
    const x0 = M.l + roadPx, y0 = M.t + HMAX * PX;
    const px = (m) => x0 + m * PX;
    const py = (m) => y0 - m * PX;

    /* silhueta do envelope, amostrada a cada 10 cm */
    const pts = [];
    for (let x = 0; x <= g.depth + 0.001; x += 0.1) pts.push([px(x), py(limitAt(x, g, rules))]);
    const env = `M${px(0)},${py(0)} ${pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")} L${px(g.depth)},${py(0)} Z`;

    const grid = [0, 5, 10, 15].map((m) =>
      `<line x1="${x0}" y1="${py(m)}" x2="${px(g.depth)}" y2="${py(m)}" stroke="#dde5ec" stroke-width="1"/>
       <text x="${x0 - 8}" y="${py(m) + 4}" text-anchor="end" class="env-axis">${m} m</text>`).join("");

    /* rua à esquerda da divisa */
    const road = `<rect x="${px(-g.road)}" y="${y0}" width="${(g.road * PX).toFixed(1)}" height="9" fill="#e7e3d8"/>
      <text x="${px(-g.road / 2)}" y="${y0 + 26}" text-anchor="middle" class="env-note">via ${fmt(g.road, 1)} m</text>`;

    const lines = [];
    if (rules.road) {
      lines.push(`<line x1="${px(-g.road)}" y1="${py(0)}" x2="${px(g.depth)}" y2="${py(g.zone.roadSlope * (g.depth + g.road))}"
        stroke="${HOT}" stroke-width="1.6" stroke-dasharray="5 4"/>`);
    }
    if (rules.north && g.zone.northStart != null) {
      lines.push(`<line x1="${px(g.depth)}" y1="${py(g.zone.northStart)}" x2="${px(0)}" y2="${py(g.zone.northStart + g.zone.northSlope * g.depth)}"
        stroke="#e07a1f" stroke-width="1.6" stroke-dasharray="5 4"/>`);
    }
    if (rules.absolute && g.zone.absoluteHeight) {
      lines.push(`<line x1="${x0}" y1="${py(g.zone.absoluteHeight)}" x2="${px(g.depth)}" y2="${py(g.zone.absoluteHeight)}"
        stroke="#2e7d32" stroke-width="1.6" stroke-dasharray="5 4"/>`);
    }

    /* a caixa da ocupação, quando o passo já falou dela */
    const n = computeNumbers(g, state);
    const footDepth = n.foot / 5;
    const occ = o.showFootprint
      ? `<rect x="${px(0.8)}" y="${y0 - 6}" width="${(footDepth * PX).toFixed(1)}" height="6" fill="${INK}" opacity=".8"/>
         <text x="${px(0.8 + footDepth / 2)}" y="${y0 + 42}" text-anchor="middle" class="env-note">projeção ${fmt(n.foot, 1)} m²</text>`
      : "";

    const floors = o.showFloors
      ? Array.from({ length: Math.max(1, Math.round(n.floorsEq)) }, (_, i) =>
          `<rect x="${px(0.8)}" y="${py((i + 1) * 2.8)}" width="${(footDepth * PX).toFixed(1)}" height="${(2.8 * PX).toFixed(1)}"
            fill="${SOFT}" opacity=".5" stroke="${INK}" stroke-width=".9"/>`).join("")
      : "";

    return `<svg viewBox="0 0 ${W} ${H}" class="env-svg" role="img"
      aria-label="Corte do lote com as regras aplicadas até aqui">
      ${road}${grid}
      <path d="${env}" fill="rgba(71,116,156,.18)" stroke="${INK}" stroke-width="1.8"/>
      ${floors}${occ}${lines.join("")}
      <line x1="${x0}" y1="${y0}" x2="${px(g.depth)}" y2="${y0}" stroke="${INK}" stroke-width="2"/>
      <text x="${px(0)}" y="${y0 + 26}" text-anchor="start" class="env-note">frente</text>
      <text x="${px(g.depth)}" y="${y0 + 26}" text-anchor="end" class="env-note">norte</text>
    </svg>`;
  }

  /* área do corte sob a silhueta, em m² de seção */
  function sectionArea(g, rules) {
    let a = 0;
    for (let x = 0; x < g.depth; x += 0.05) a += limitAt(x + 0.025, g, rules) * 0.05;
    return a;
  }

  /* ---------------------------------------------------------------
     peça 1: o corte que recebe uma regra de cada vez
     --------------------------------------------------------------- */

  const state = { zone: "l1", depth: 12, road: 4, bcr: 50, far: 100, step: 0, playing: false };

  function stepsBlock() {
    return `<article class="panel env-panel" id="block-envelope">
      <div class="panel-title"><div><p>passo a passo</p><h3>O envelope, corte por corte</h3></div></div>
      <p class="panel-lede">Um lote hipotético de 5 por 12 metros recebe uma regra por vez. Nenhuma delas é uma altura máxima: são superfícies que o edifício não pode atravessar, e o que sobra é a interseção de todas.</p>
      <div class="env-grid">
        <div class="env-stage" id="env-stage"></div>
        <div class="env-side">
          <ol class="env-steps" id="env-steps">${STEPS.map((s, i) =>
            `<li><button type="button" class="env-step" data-step="${i}" aria-pressed="${i === 0}">
              <span class="env-step-n">${i + 1}</span><span class="env-step-t">${esc(s.title)}</span></button></li>`).join("")}</ol>
          <p class="env-text" id="env-text"></p>
          <div class="env-numbers" id="env-numbers"></div>
        </div>
      </div>
      <div class="env-controls">
        <button type="button" class="primary-button" id="env-play">Rodar os sete passos</button>
        <label class="env-slider">via frontal <input type="range" id="env-road" min="1.8" max="12" step="0.2" value="4"><output id="env-road-out">4,0 m</output></label>
        <label class="env-slider">profundidade <input type="range" id="env-depth" min="6" max="20" step="0.5" value="12"><output id="env-depth-out">12,0 m</output></label>
        <label class="env-slider zone">zona <select id="env-zone">${LAW.zones.map((z) =>
          `<option value="${z.key}">${esc(z.pt)}</option>`).join("")}</select></label>
      </div>
      <p class="law-disclaimer">O lote é hipotético e os valores de ocupação e aproveitamento são os designáveis na classe de zona escolhida, não a designação de nenhuma parcela real. A área de corte é uma leitura da figura, em metros quadrados de seção, e não área construída.</p>
    </article>`;
  }

  function renderSteps() {
    const stage = $("env-stage");
    if (!stage) return;
    const g = sectionGeom(state);
    const s = STEPS[state.step];
    const n = computeNumbers(g, state);
    stage.innerHTML = sectionSvg(g, s.rules, state, {
      showFootprint: state.step >= 1,
      showFloors: state.step >= 2,
    });

    const fill = (t) => t
      .replace("{road}", fmt(g.road, 1))
      .replace("{bcr}", n.bcr)
      .replace(/\{foot\}/g, fmt(n.foot, 1))
      .replace("{far}", n.far)
      .replace(/\{gfa\}/g, fmt(n.gfa, 1))
      .replace("{floorsEq}", fmt(n.floorsEq, 1))
      .replace("{roadFar}", n.roadFar)
      .replace("{abs}", g.zone.absoluteHeight || "sem trava")
      .replace("{roadSlope}", fmt(g.zone.roadSlope, 2))
      .replace("{roadAtFront}", fmt(n.roadAtFront, 1))
      .replace("{northStart}", g.zone.northStart == null ? "—" : fmt(g.zone.northStart, 1))
      .replace("{northSlope}", g.zone.northSlope == null ? "—" : fmt(g.zone.northSlope, 2))
      .replace("{vol}", fmt(sectionArea(g, s.rules), 1));

    $("env-text").textContent = fill(s.text);
    const free = sectionArea(g, {});
    const now = sectionArea(g, s.rules);
    $("env-numbers").innerHTML = `
      <div><strong>${fmt(n.lotArea, 0)} m²</strong><span>lote hipotético</span></div>
      <div><strong>${fmt(n.foot, 1)} m²</strong><span>projeção no ${n.bcr}%</span></div>
      <div><strong>${fmt(n.gfa, 1)} m²</strong><span>área computável, já com o teto da via</span></div>
      <div><strong>${fmt((1 - now / free) * 100, 0)}%</strong><span>do corte livre já retirado pelas regras deste passo</span></div>`;

    document.querySelectorAll(".env-step").forEach((b) =>
      b.setAttribute("aria-pressed", String(Number(b.dataset.step) === state.step)));
  }

  function initSteps() {
    if (!$("env-stage")) return;
    document.querySelectorAll(".env-step").forEach((b) => b.addEventListener("click", () => {
      state.step = Number(b.dataset.step);
      renderSteps();
    }));
    const play = $("env-play");
    play.addEventListener("click", () => {
      if (state.playing) return;
      state.playing = true;
      play.disabled = true;
      state.step = 0;
      renderSteps();
      const tick = () => {
        if (state.step >= STEPS.length - 1) { state.playing = false; play.disabled = false; return; }
        state.step += 1;
        renderSteps();
        setTimeout(tick, 1250);
      };
      setTimeout(tick, 1250);
    });
    const road = $("env-road"), depth = $("env-depth"), zone = $("env-zone");
    road.addEventListener("input", () => {
      state.road = Number(road.value);
      $("env-road-out").textContent = `${fmt(state.road, 1)} m`;
      renderSteps();
    });
    depth.addEventListener("input", () => {
      state.depth = Number(depth.value);
      $("env-depth-out").textContent = `${fmt(state.depth, 1)} m`;
      renderSteps();
    });
    zone.addEventListener("change", () => {
      state.zone = zone.value;
      const z = LAW.zones.find((x) => x.key === state.zone);
      state.bcr = z.bcrDefault; state.far = z.farDefault;
      renderSteps();
    });
    renderSteps();
  }

  /* ---------------------------------------------------------------
     peça 2: qual regra cortou este volume?
     --------------------------------------------------------------- */

  const CUTS = [
    { key: "road", label: "道路斜線, o plano da via", rules: { road: true },
      why: "O corte desce em direção à frente do lote: quem manda é a distância até o outro lado da rua." },
    { key: "north", label: "北側斜線, o plano da face norte", rules: { north: true },
      why: "O corte desce em direção ao fundo: é o vizinho do norte que está sendo protegido do sombreamento." },
    { key: "absolute", label: "Altura absoluta da zona", rules: { absolute: true },
      why: "O topo é uma reta horizontal: a única regra do conjunto que é mesmo um número." },
    { key: "roadnorth", label: "Os dois planos inclinados juntos", rules: { road: true, north: true },
      why: "Desce dos dois lados e forma um cume: nenhuma altura absoluta entra nesse desenho." },
  ];

  const QUIZ_ROUNDS = 5;

  function quizBlock() {
    return `<article class="panel game" id="block-envquiz">
      <div class="panel-title"><div><p>jogo</p><h3>Qual regra cortou este volume?</h3></div></div>
      <p class="panel-lede">Cinco cortes, cada um com uma regra só, ou duas. O desenho é a única pista: a direção em que o volume desce diz qual superfície o cortou.</p>
      <div class="envquiz-board" id="envquiz-board"></div>
      <p class="city-note">Os cortes usam a mesma classe de zona e um lote sorteado entre 8 e 18 m de profundidade, com via entre 2 e 10 m. Acertar aqui não é conformidade: a verificação real é o 建築確認, parcela a parcela.</p>
    </article>`;
  }

  function initQuiz() {
    const board = $("envquiz-board");
    if (!board) return;
    let round = 0, score = 0, rounds = [];

    const deal = () => {
      rounds = [];
      for (let i = 0; i < QUIZ_ROUNDS; i += 1) {
        const cut = CUTS[Math.floor(Math.random() * CUTS.length)];
        rounds.push({
          cut,
          g: {
            depth: 8 + Math.random() * 10,
            road: 2 + Math.random() * 8,
            zone: LAW.zones.find((z) => z.key === "l1"),
          },
        });
      }
    };

    const render = () => {
      if (round >= QUIZ_ROUNDS) {
        board.innerHTML = `<div class="game-end">
          <p class="game-final">${score} de ${QUIZ_ROUNDS}</p>
          <p>${score >= 4 ? "Você já lê o corte pela direção da queda." : "A direção da queda é a pista: para a frente é a via, para o fundo é o norte."}</p>
          <button type="button" class="quiet-button" id="envquiz-again">Jogar de novo</button>
        </div>`;
        $("envquiz-again").addEventListener("click", start);
        return;
      }
      const { cut, g } = rounds[round];
      board.innerHTML = `
        <p class="game-round">rodada ${round + 1} de ${QUIZ_ROUNDS}</p>
        <div class="envquiz-stage">${sectionSvg(g, cut.rules, { bcr: 50, far: 100 }, {})}</div>
        <div class="envquiz-options">${CUTS.map((c) =>
          `<button type="button" class="quiet-button envquiz-opt" data-key="${c.key}">${esc(c.label)}</button>`).join("")}</div>
        <div class="envquiz-reveal" hidden></div>`;
      board.querySelectorAll(".envquiz-opt").forEach((btn) => btn.addEventListener("click", () => {
        const right = btn.dataset.key === cut.key;
        if (right) score += 1;
        board.querySelectorAll(".envquiz-opt").forEach((b) => {
          b.disabled = true;
          if (b.dataset.key === cut.key) b.classList.add("ok");
          else if (b === btn) b.classList.add("no");
        });
        const rev = board.querySelector(".envquiz-reveal");
        rev.hidden = false;
        rev.innerHTML = `<p class="game-verdict ${right ? "ok" : "no"}">${right ? "acertou" : "era"}: ${esc(cut.label)}. ${esc(cut.why)}</p>
          <button type="button" class="primary-button" id="envquiz-next">${round + 1 === QUIZ_ROUNDS ? "Ver o resultado" : "Próxima"}</button>`;
        $("envquiz-next").addEventListener("click", () => { round += 1; render(); });
        $("envquiz-next").focus();
      }));
    };

    const start = () => { round = 0; score = 0; deal(); render(); };
    start();
  }

  /* ---------------------------------------------------------------
     peça 3: as dez classes de zona, em um gráfico
     --------------------------------------------------------------- */

  function zonesChartBlock() {
    const W = 780, H = 360, m = { t: 24, r: 150, b: 48, l: 62 };
    const maxFar = Math.max(...LAW.zones.map((z) => Math.max(...z.far)));
    const X = (v) => m.l + ((v - 20) / (80 - 20)) * (W - m.l - m.r);
    const Y = (v) => H - m.b - (v / maxFar) * (H - m.t - m.b);

    const rows = LAW.zones.map((z, i) => {
      const bMin = Math.min(...z.bcr), bMax = Math.max(...z.bcr);
      const fMin = Math.min(...z.far), fMax = Math.max(...z.far);
      const color = `hsl(${210 + i * 14} 46% ${34 + (i % 3) * 8}%)`;
      return `<g class="zone-box" data-zone="${z.key}">
        <rect x="${X(bMin).toFixed(1)}" y="${Y(fMax).toFixed(1)}"
          width="${(X(bMax) - X(bMin)).toFixed(1)}" height="${(Y(fMin) - Y(fMax)).toFixed(1)}"
          fill="${color}" opacity=".16" stroke="${color}" stroke-width="1.4"/>
        <circle cx="${X(z.bcrDefault).toFixed(1)}" cy="${Y(z.farDefault).toFixed(1)}" r="5" fill="${color}"/>
        <title>${esc(z.pt)}: 建ぺい率 de ${bMin} a ${bMax}%, 容積率 de ${fMin} a ${fMax}%</title>
      </g>`;
    }).join("");

    const gx = [20, 30, 40, 50, 60, 70, 80].map((v) =>
      `<line x1="${X(v)}" y1="${m.t}" x2="${X(v)}" y2="${H - m.b}" stroke="#e6ecf2" stroke-width="1"/>
       <text x="${X(v)}" y="${H - m.b + 18}" text-anchor="middle" class="env-axis">${v}%</text>`).join("");
    const gy = [0, 100, 200, 300, 400, 500, 600, 700].filter((v) => v <= maxFar).map((v) =>
      `<line x1="${m.l}" y1="${Y(v)}" x2="${W - m.r}" y2="${Y(v)}" stroke="#e6ecf2" stroke-width="1"/>
       <text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end" class="env-axis">${v}%</text>`).join("");

    const key = LAW.zones.map((z, i) => {
      const color = `hsl(${210 + i * 14} 46% ${34 + (i % 3) * 8}%)`;
      return `<li><span class="dot" style="background:${color}"></span>${esc(z.pt)}</li>`;
    }).join("");

    return `<article class="panel" id="block-zones-chart">
      <div class="panel-title"><div><p>as dez classes</p><h3>O que cada zona admite</h3></div></div>
      <p class="panel-lede">Cada retângulo é uma classe de zona de uso: a largura é a faixa de 建ぺい率 designável, a altura é a faixa de 容積率. O ponto cheio é o valor que este atlas usa como padrão na calculadora. Zonas que se sobrepõem admitem os mesmos números: é o plano urbano de cada distrito que escolhe qual vale onde.</p>
      <div class="zones-chart-wrap">
        <svg viewBox="0 0 ${W} ${H}" class="zones-chart" role="img" aria-label="Faixas de ocupação e aproveitamento das dez classes de zona">
          ${gx}${gy}
          <text x="${(m.l + W - m.r) / 2}" y="${H - 8}" text-anchor="middle" class="env-axis-title">建ぺい率 designável</text>
          <text transform="translate(16,${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle" class="env-axis-title">容積率 designável</text>
          ${rows}
        </svg>
        <ul class="zones-key">${key}</ul>
      </div>
      <p class="city-note">Transcrição das classes de uso da 建築基準法, arts. 52 e 53. A faixa é o que o plano pode designar, não o que vale numa parcela: a designação real depende do plano de distrito, e a largura da via ainda pode rebaixar o 容積率 efetivo.</p>
    </article>`;
  }

  /* ---------------------------------------------------------------
     montagem
     --------------------------------------------------------------- */

  function mount() {
    const host = $("norma-extra");
    if (!host) return;
    host.innerHTML = stepsBlock() + zonesChartBlock() + quizBlock();
    initSteps();
    initQuiz();
  }

  mount();
})();
