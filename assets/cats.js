/* Retratos: a seção em que o corpus vira figura.

   1. Os que cobrem e os que guardam: o recorte partido ao meio pela mediana
      do solo coberto, e as outras medidas comparadas entre as duas metades.
   2. O jogo do lote menor.
   3. O olhômetro.

   Nenhum número é inventado: tudo sai de window.NEKO_DATA por window.NekoAtlas.
   Casa sem o campo não entra na peça que depende dele.                        */

(function () {
  "use strict";

  const A = window.NekoAtlas;
  const CAT = window.NekoCat;
  if (!A || !CAT) return;
  const $ = (id) => document.getElementById(id);
  const fmt = A.fmt;
  const esc = A.escapeHtml;

  const INDIGO = "#3b3f8f";
  const PINK = "#d5476a";
  const PAPER = "#f7f4ec";
  const INK = "#10264a";

  let tipEl = null;
  function tip(event, html) {
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.className = "plot-tooltip city-tip";
      document.body.appendChild(tipEl);
    }
    tipEl.innerHTML = html;
    tipEl.hidden = false;
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let left = event.clientX + window.scrollX + 16;
    if (event.clientX + w + 26 > window.innerWidth) left = event.clientX + window.scrollX - w - 16;
    let top = event.clientY + window.scrollY - h - 14;
    if (event.clientY - h - 14 < 6) top = event.clientY + window.scrollY + 54;
    tipEl.style.left = `${Math.max(8, left)}px`;
    tipEl.style.top = `${top}px`;
  }
  const hideTip = () => { if (tipEl) tipEl.hidden = true; };
  document.addEventListener("scroll", hideTip, { passive: true });

  /* =====================================================================
     1. Os que cobrem e os que guardam

     Padrão do Pudding: partir o conjunto em dois grupos por uma variável e
     comparar todas as outras. Aqui o corte é a mediana do BCR observado, e
     por construção o próprio BCR fica de fora das linhas.
     ===================================================================== */

  const SPLIT_FIELDS = [
    { key: "lotArea", label: "área do lote", unit: "m²", d: 1 },
    { key: "builtArea", label: "área construída", unit: "m²", d: 1 },
    { key: "footprintArea", label: "projeção no solo", unit: "m²", d: 1 },
    { key: "far", label: "FAR observado", unit: "", d: 2 },
    { key: "floors", label: "pavimentos", unit: "", d: 1 },
    { key: "year", label: "ano da obra", unit: "", d: 0, disp: (v) => String(Math.round(v)) },
  ];

  function dividedBlock() {
    const withB = A.houses.filter((h) => Number.isFinite(h.bcr));
    if (withB.length < 40) return "";
    const med = A.core.median(withB.map((h) => h.bcr));
    const cover = withB.filter((h) => h.bcr > med);
    const keep = withB.filter((h) => h.bcr <= med);

    const W = 780, ROW = 66, PAD = { t: 34, b: 26, l: 156, r: 92 };
    const H = PAD.t + SPLIT_FIELDS.length * ROW + PAD.b;

    const rows = SPLIT_FIELDS.map((f, i) => {
      const all = withB.map((h) => h[f.key]).filter(Number.isFinite).sort((a, b) => a - b);
      if (all.length < 10) return "";
      const lo = all[Math.floor(all.length * 0.02)];
      const hi = all[Math.ceil(all.length * 0.98) - 1];
      const span = hi - lo || 1;
      const x = (v) => PAD.l + ((Math.max(lo, Math.min(hi, v)) - lo) / span) * (W - PAD.l - PAD.r);
      const y = PAD.t + i * ROW + ROW / 2;

      const aVals = cover.map((h) => h[f.key]).filter(Number.isFinite);
      const bVals = keep.map((h) => h[f.key]).filter(Number.isFinite);
      const a = A.core.median(aVals), b = A.core.median(bVals);
      const show = (v) => (f.disp ? f.disp(v) : fmt(v, f.d)) + (f.unit ? ` ${f.unit}` : "");
      const diff = b ? (a / b - 1) * 100 : 0;
      const diffText = f.key === "year"
        ? `${a - b > 0 ? "+" : ""}${fmt(a - b, 0)} ${Math.abs(a - b) === 1 ? "ano" : "anos"}`
        : `${diff > 0 ? "+" : ""}${fmt(diff, 0)}%`;

      const dots = (vals, cls) => vals.map((v) =>
        `<circle cx="${x(v).toFixed(1)}" cy="${y}" r="2.4" class="${cls}"></circle>`).join("");

      return `<g class="split-row" data-field="${f.key}">
        <text x="${PAD.l - 14}" y="${y - 4}" text-anchor="end" class="split-label">${esc(f.label)}</text>
        <text x="${PAD.l - 14}" y="${y + 11}" text-anchor="end" class="split-n">${aVals.length} e ${bVals.length} fichas</text>
        <line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" class="split-track"></line>
        <g class="split-cloud">${dots(bVals, "split-dot keep")}${dots(aVals, "split-dot cover")}</g>
        <line x1="${x(a).toFixed(1)}" y1="${y}" x2="${x(b).toFixed(1)}" y2="${y}" class="split-link"></line>
        <circle cx="${x(b).toFixed(1)}" cy="${y}" r="7" class="split-med keep"></circle>
        <circle cx="${x(a).toFixed(1)}" cy="${y}" r="7" class="split-med cover"></circle>
        <text x="${x(a).toFixed(1)}" y="${y - 15}" text-anchor="middle" class="split-value cover">${show(a)}</text>
        <text x="${x(b).toFixed(1)}" y="${y + 24}" text-anchor="middle" class="split-value keep">${show(b)}</text>
        <text x="${W - PAD.r + 12}" y="${y + 4}" class="split-diff ${diff > 0 ? "up" : diff < 0 ? "down" : ""}">${diffText}</text>
      </g>`;
    }).join("");

    return `<article class="city-block panel" id="block-split">
      <div class="panel-title"><div><p>duas metades</p><h3>Os que cobrem e os que guardam</h3></div></div>
      <p class="panel-lede">O recorte partido ao meio pela mediana do solo coberto, ${fmt(med * 100, 1)}%: de um lado as ${cover.length} casas que cobrem mais do que isso, do outro as ${keep.length} que guardam mais chão livre. O BCR fica de fora das linhas, porque é ele que faz o corte. O que aparece é o resto.</p>
      <div class="split-wrap">
        <svg viewBox="0 0 ${W} ${H}" class="split-svg" role="img"
          aria-label="Comparação das medianas dos dois grupos em seis medidas">
          <text x="${PAD.l}" y="20" class="split-head cover">● os que cobrem, acima da mediana</text>
          <text x="${PAD.l + 300}" y="20" class="split-head keep">● os que guardam, abaixo</text>
          <text x="${W - PAD.r + 12}" y="20" class="split-head">diferença</text>
          ${rows}
        </svg>
      </div>
      <p class="city-note">Cada linha é uma medida, na escala do próprio recorte entre o percentil 2 e o 98; os pontinhos são as fichas e os círculos grandes são as medianas de cada grupo. A leitura que salta: cobrir mais do lote acompanha lote menor e área construída maior, com o mesmo número de pavimentos e no mesmo período. Isso descreve o arquivo publicado, não prova causa: o corte é feito pelo próprio BCR, e casa sem o campo não entra na linha que depende dele, por isso pavimentos compara menos fichas que as outras.</p>
    </article>`;
  }

  const r1 = (n) => Math.round(n * 10) / 10;

  /* =====================================================================
     3. O jogo do lote menor
     ===================================================================== */

  const ROUNDS = 6;

  function gameBlock() {
    return `<article class="city-block panel game" id="block-game">
      <div class="panel-title"><div><p>jogo</p><h3>Neko no hitai: qual está no lote menor?</h3></div></div>
      <p class="panel-lede">Seis rodadas. Você vê duas casas do corpus, com a área construída, os pavimentos e o ward, e aponta a que está no terreno menor. A área construída ajuda menos do que parece: no recorte comparável, a correlação de postos entre lote e área construída é <span id="game-rho">…</span>.</p>
      <div class="game-board" id="game-board"></div>
      <div class="game-foot">
        <span class="game-score" id="game-score"></span>
        <button type="button" class="quiet-button" id="game-restart" hidden>Jogar de novo</button>
      </div>
      <p class="city-note">As casas são sorteadas entre as fichas com lote, área construída e pavimentos registrados, e cada rodada garante pelo menos 6 m² de diferença entre os dois lotes. Metade das rodadas é montada de propósito com a casa de maior área construída no lote menor: é o caso que quebra a intuição, e ele existe no corpus.</p>
    </article>`;
  }

  function initGame() {
    const board = $("game-board");
    if (!board) return;
    const pool = A.houses.filter((h) => Number.isFinite(h.lotArea) && Number.isFinite(h.builtArea) && Number.isFinite(h.floors));
    const sp = A.core.spearman(pool.map((h) => [h.lotArea, h.builtArea]));
    const rhoEl = $("game-rho");
    if (rhoEl) rhoEl.textContent = sp ? `${fmt(sp.rho, 2)}, em ${sp.n} fichas` : "não calculada";

    let round = 0, score = 0, rounds = [];

    const build = () => {
      rounds = [];
      let tries = 0;
      while (rounds.length < ROUNDS && tries < 4000) {
        tries += 1;
        const a = pool[Math.floor(Math.random() * pool.length)];
        const b = pool[Math.floor(Math.random() * pool.length)];
        if (a.id === b.id) continue;
        if (Math.abs(a.lotArea - b.lotArea) < 6) continue;
        const tricky = (a.lotArea < b.lotArea && a.builtArea > b.builtArea) || (b.lotArea < a.lotArea && b.builtArea > a.builtArea);
        const wantTricky = rounds.length % 2 === 0;
        if (tricky !== wantTricky) continue;
        if (rounds.some((r) => r.pair.some((h) => h.id === a.id || h.id === b.id))) continue;
        rounds.push({ pair: [a, b], tricky });
      }
      return rounds.length === ROUNDS;
    };

    const card = (h, side) => `
      <button type="button" class="game-card" data-side="${side}" data-id="${esc(h.id)}">
        <span class="game-name">${esc(h.name)}</span>
        <span class="game-meta">${esc(h.architect)}</span>
        <span class="game-meta">${esc(h.ward)} · ${h.year}</span>
        <span class="game-stats">
          <span><em>${fmt(h.builtArea, 1)} m²</em>área construída</span>
          <span><em>${h.floors}</em>pavimentos</span>
        </span>
      </button>`;

    const scaleDraw = (a, b) => {
      const biggest = Math.max(a.lotArea, b.lotArea);
      const S = 150;
      const k = S / Math.sqrt(biggest);
      const box = (h, x) => {
        const s = Math.sqrt(h.lotArea) * k;
        const f = Number.isFinite(h.footprintArea) ? Math.sqrt(h.footprintArea) * k : null;
        return `<g transform="translate(${x},${S - s})">
          <rect width="${s.toFixed(1)}" height="${s.toFixed(1)}" class="game-lot"></rect>
          ${f ? `<rect x="${((s - f) / 2).toFixed(1)}" y="${(s - f).toFixed(1)}" width="${f.toFixed(1)}" height="${f.toFixed(1)}" class="game-foot"></rect>` : ""}
          <text x="${(s / 2).toFixed(1)}" y="${(s + 16).toFixed(1)}" text-anchor="middle" class="game-lot-label">${fmt(h.lotArea, 1)} m²</text>
        </g>`;
      };
      return `<svg viewBox="0 0 ${S * 2 + 40} ${S + 26}" class="game-scale" role="img"
        aria-label="Os dois lotes desenhados na mesma escala, com a projeção da edificação dentro">${box(a, 0)}${box(b, S + 40)}</svg>`;
    };

    const render = () => {
      if (round >= ROUNDS) {
        const verdict = score === ROUNDS ? "Seis de seis. Você leu as pistas certas."
          : score >= 4 ? "Boa. A área construída engana nas rodadas em que a casa maior está no terreno menor."
          : "É difícil mesmo: o que a ficha conta sobre a casa não conta sobre o terreno.";
        board.innerHTML = `<div class="game-end">
          <p class="game-final">${score} de ${ROUNDS}</p>
          <p>${verdict}</p>
        </div>`;
        $("game-score").textContent = "";
        $("game-restart").hidden = false;
        return;
      }
      const { pair, tricky } = rounds[round];
      const [a, b] = pair;
      board.innerHTML = `
        <p class="game-round">rodada ${round + 1} de ${ROUNDS}</p>
        <div class="game-pair">${card(a, "a")}<span class="game-vs">ou</span>${card(b, "b")}</div>
        <div class="game-reveal" hidden></div>`;
      $("game-score").textContent = round ? `${score} de ${round}` : "";
      board.querySelectorAll(".game-card").forEach((btn) => btn.addEventListener("click", () => {
        const chosen = btn.dataset.side === "a" ? a : b;
        const other = chosen === a ? b : a;
        const right = chosen.lotArea < other.lotArea;
        if (right) score += 1;
        board.querySelectorAll(".game-card").forEach((c) => {
          const house = c.dataset.side === "a" ? a : b;
          c.classList.add(house.lotArea < (house === a ? b : a).lotArea ? "smaller" : "bigger");
          c.disabled = true;
        });
        const reveal = board.querySelector(".game-reveal");
        reveal.hidden = false;
        reveal.innerHTML = `
          <p class="game-verdict ${right ? "ok" : "no"}">${right ? "acertou" : "errou"}: ${esc(chosen.name)} tem ${fmt(chosen.lotArea, 1)} m² de lote, ${esc(other.name)} tem ${fmt(other.lotArea, 1)} m².</p>
          ${scaleDraw(a, b)}
          ${tricky ? '<p class="game-hint">Esta era das traiçoeiras: a casa com mais área construída está no lote menor.</p>' : ""}
          <button type="button" class="primary-button" id="game-next">${round + 1 === ROUNDS ? "Ver o resultado" : "Próxima rodada"}</button>`;
        $("game-next").addEventListener("click", () => { round += 1; render(); });
        $("game-next").focus();
      }));
    };

    const start = () => {
      round = 0; score = 0;
      $("game-restart").hidden = true;
      if (!build()) {
        board.innerHTML = '<p class="muted">Não há fichas suficientes com lote, área construída e pavimentos para montar o jogo.</p>';
        return;
      }
      render();
    };
    $("game-restart").addEventListener("click", start);
    start();
  }

  /* =====================================================================
     4. O olhômetro
     ===================================================================== */

  const EYE_ROUNDS = 5;

  function eyeBlock() {
    return `<article class="city-block panel game" id="block-eye">
      <div class="panel-title"><div><p>jogo</p><h3>O olhômetro</h3></div></div>
      <p class="panel-lede">Metro quadrado é uma palavra difícil de ver. Aqui você vê o terreno de uma casa do corpus desenhado em escala e tem que dizer quantos metros quadrados ele tem, no olho.</p>
      <ol class="eye-how">
        <li>O quadrado azul é o terreno. Você não sabe a área dele.</li>
        <li>O retângulo rosa ao lado é a régua: uma vaga de garagem de 2,40 por 5,00 metros, ou seja 12 m², desenhada na mesma escala.</li>
        <li>Compare os dois, arraste o controle até o número que você acha que é a área do terreno e responda. São cinco rodadas.</li>
      </ol>
      <div class="eye-board" id="eye-board"></div>
      <p class="city-note">As casas são sorteadas entre as fichas que têm a área do lote registrada e que ficam entre 12 e 100 m², que é a faixa em que a régua da vaga ainda ajuda. A planilha registra a área do lote, não as suas dimensões: o terreno é desenhado como um quadrado de mesma área, o que é convenção de leitura e não a forma real da parcela. Um lote de 50 m² pode ser um retângulo de 4 por 12,5.</p>
    </article>`;
  }

  function initEye() {
    const board = $("eye-board");
    if (!board) return;
    const pool = A.houses.filter((h) => Number.isFinite(h.lotArea) && h.lotArea >= 12 && h.lotArea <= 100);
    if (pool.length < EYE_ROUNDS) { board.innerHTML = '<p class="muted">Fichas insuficientes para o olhômetro.</p>'; return; }

    let round = 0, errors = [], picks = [];

    const deal = () => {
      const used = new Set();
      picks = [];
      while (picks.length < EYE_ROUNDS && used.size < pool.length) {
        const h = pool[Math.floor(Math.random() * pool.length)];
        if (used.has(h.id)) continue;
        used.add(h.id);
        picks.push(h);
      }
    };

    const draw = (h, revealed, guess) => {
      const area = h.lotArea;
      const S = 210;
      const k = S / Math.sqrt(100);
      const s = Math.sqrt(area) * k;
      const gw = 2.4 * k, gh = 5 * k;
      const gx = S + 40;
      const gy = S - gh;
      const H = S + 58;
      const guessSide = guess ? Math.sqrt(guess) * k : null;
      return `<svg viewBox="-74 -10 ${S + 320} ${H + 10}" class="eye-svg" role="img"
        aria-label="${revealed ? `O terreno tem ${fmt(area, 1)} metros quadrados` : "Um terreno de área desconhecida ao lado de uma vaga de garagem de 12 metros quadrados"}">
        ${revealed && guessSide ? `<rect x="0" y="${(S - guessSide).toFixed(1)}" width="${guessSide.toFixed(1)}" height="${guessSide.toFixed(1)}" class="eye-guess"></rect>` : ""}
        <rect x="0" y="${(S - s).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" class="eye-lot"></rect>
        <text x="${(s / 2).toFixed(1)}" y="${(S - s - 10).toFixed(1)}" text-anchor="middle" class="eye-lot-tag">${revealed ? `o terreno · ${fmt(area, 1)} m²` : "o terreno · quantos m²?"}</text>
        <rect x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" width="${gw.toFixed(1)}" height="${gh.toFixed(1)}" class="eye-ref"></rect>
        <text x="${(gx + gw / 2).toFixed(1)}" y="${(gy - 10).toFixed(1)}" text-anchor="middle" class="eye-ref-label">a régua</text>
        <text x="${(gx + gw + 8).toFixed(1)}" y="${(gy + gh / 2 - 4).toFixed(1)}" class="eye-ref-label">vaga de garagem</text>
        <text x="${(gx + gw + 8).toFixed(1)}" y="${(gy + gh / 2 + 10).toFixed(1)}" class="eye-ref-label">2,40 × 5,00 m · 12 m²</text>
        <line x1="0" y1="${(S + 8).toFixed(1)}" x2="${s.toFixed(1)}" y2="${(S + 8).toFixed(1)}" class="eye-tick"></line>
        ${revealed && guessSide ? `<text x="${(guessSide / 2).toFixed(1)}" y="${(S + 30).toFixed(1)}" text-anchor="middle" class="eye-guess-tag">seu palpite · ${fmt(guess, 0)} m²</text>` : ""}
      </svg>`;
    };

    const render = () => {
      if (round >= EYE_ROUNDS) {
        const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
        const verdict = mean <= 10 ? "Olho bom. Você já está lendo a escala do recorte."
          : mean <= 22 ? "Perto. O erro costuma cair depois de passar pela seção dos achados."
          : "O olho erra muito aqui, e é esse o ponto: a área não se vê, se compara.";
        board.innerHTML = `<div class="game-end">
          <p class="game-final">erro médio de ${fmt(mean, 1)}%</p>
          <p>${verdict}</p>
          <button type="button" class="quiet-button" id="eye-restart">Jogar de novo</button>
        </div>`;
        $("eye-restart").addEventListener("click", start);
        return;
      }
      const h = picks[round];
      board.innerHTML = `
        <p class="game-round">rodada ${round + 1} de ${EYE_ROUNDS}</p>
        <p class="eye-ask">Quantos metros quadrados tem este terreno?</p>
        <div class="eye-stage">${draw(h, false)}</div>
        <div class="eye-controls">
          <label for="eye-range">seu palpite</label>
          <span class="eye-scale">12</span>
          <input type="range" id="eye-range" min="12" max="100" step="1" value="45"
                 aria-describedby="eye-out">
          <span class="eye-scale">100</span>
          <output id="eye-out">45 m²</output>
          <button type="button" class="primary-button" id="eye-go">Responder</button>
        </div>
        <div class="eye-reveal" hidden></div>`;
      const range = $("eye-range"), out = $("eye-out");
      range.addEventListener("input", () => { out.textContent = `${range.value} m²`; });
      $("eye-go").addEventListener("click", () => {
        const guess = Number(range.value);
        const err = Math.abs(guess - h.lotArea) / h.lotArea * 100;
        errors.push(err);
        range.disabled = true;
        $("eye-go").disabled = true;
        const rev = board.querySelector(".eye-reveal");
        const vagas = h.lotArea / 12;
        const bits = [];
        if (Number.isFinite(h.builtArea)) bits.push(`${fmt(h.builtArea, 1)} m² de área construída`);
        if (Number.isFinite(h.floors)) bits.push(`${h.floors} ${h.floors === 1 ? "pavimento" : "pavimentos"}`);
        if (Number.isFinite(h.bcr)) bits.push(`${fmt(h.bcr * 100, 0)}% do terreno coberto`);
        const missing = ["builtArea", "floors", "bcr"].filter((k) => !Number.isFinite(h[k]));
        const missingNames = { builtArea: "área construída", floors: "pavimentos", bcr: "cobertura do solo" };
        const sentence = bits.length
          ? `A ficha registra ${bits.slice(0, -1).join(", ")}${bits.length > 1 ? " e " : ""}${bits[bits.length - 1]}.`
          : "A ficha não registra nenhuma das outras medidas.";
        const gap = missing.length ? ` Sem registro: ${missing.map((k) => missingNames[k]).join(", ")}.` : "";
        rev.hidden = false;
        board.querySelector(".eye-stage").innerHTML = draw(h, true, guess);
        rev.innerHTML = `
          <p class="game-verdict ${err <= 15 ? "ok" : "no"}">Você disse ${guess} m², o terreno tem ${fmt(h.lotArea, 2)} m². Erro de ${fmt(err, 1)}%.</p>
          <div class="eye-card">
            <h4>${esc(h.name)}</h4>
            <p class="eye-card-meta">${esc(h.architect)} · ${esc(h.ward)} · ${h.year}</p>
            <p class="eye-card-body">O lote cabe ${fmt(vagas, 1)} ${vagas < 2 ? "vaga de garagem" : "vagas de garagem"}. ${sentence}${gap}</p>
            <button type="button" class="quiet-button eye-open" data-id="${esc(h.id)}">Abrir a ficha completa</button>
          </div>
          <p class="eye-crit">Como esta casa entrou na rodada: sorteada entre as ${pool.length} fichas com área de lote registrada entre 12 e 100 m². O quadrado é uma convenção: a planilha guarda a área, não a frente e a profundidade da parcela.</p>
          <button type="button" class="primary-button" id="eye-next">${round + 1 === EYE_ROUNDS ? "Ver o resultado" : "Próxima rodada"}</button>`;
        const open = rev.querySelector(".eye-open");
        if (open) open.addEventListener("click", () => A.openDrawer(open.dataset.id));
        $("eye-next").addEventListener("click", () => { round += 1; render(); });
        $("eye-next").focus();
      });
    };

    const start = () => { round = 0; errors = []; deal(); render(); };
    start();
  }

  /* =====================================================================
     montagem
     ===================================================================== */

  function mount() {
    const host = $("cats-blocks");
    if (!host) return;
    if (CAT.defs) CAT.defs();
    host.innerHTML = [dividedBlock(), gameBlock(), eyeBlock()].filter(Boolean).join("");

    initGame();
    initEye();

    const lede = $("cats-lede");
    if (lede) lede.textContent = "As peças desta seção usam as mesmas 194 fichas das outras, só que desenhadas. O recorte se parte ao meio, o arquivo inteiro vira uma fileira que se percorre, e o que a planilha não consegue dizer vira jogo.";
  }

  mount();
})();
