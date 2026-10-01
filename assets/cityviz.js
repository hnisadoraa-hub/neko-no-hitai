/* Os gráficos da cidade e dos bastidores.

   Todos os números vêm de window.NEKO_CITY, montado por build/build_city.py a
   partir da planilha-mestra. Nada é estimado aqui: ano sem publicação fica como
   buraco na linha, campo sem dado fica de fora da conta e o texto diz quantos
   ficaram de fora. Onde a planilha se contradiz, a nota registra o conflito. */

(function () {
  "use strict";

  const A = window.NekoAtlas;
  const C = window.NEKO_CITY;
  if (!A || !C) return;
  const $ = (id) => document.getElementById(id);
  const fmt = A.fmt;
  const esc = A.escapeHtml;
  const geo = window.TOKYO23_GEO;

  const COLOR = {
    ink: "#10264a", line: "#35678f", soft: "#a9c5d9", hot: "#c2185b",
    warm: "#e07a1f", green: "#2e7d32", grid: "#dde5ec", pale: "#eef4f8",
  };

  const nf = (v, d = 0) => fmt(v, d);
  const intBr = (v) => (Number.isFinite(v) ? Math.round(v).toLocaleString("pt-BR") : "—");

  /* ---------- etiqueta flutuante ---------- */

  let tipEl = null;
  function tip(host, event, html) {
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
  function hideTip() { if (tipEl) tipEl.hidden = true; }
  document.addEventListener("scroll", hideTip, { passive: true });

  /* ---------- helpers de desenho ---------- */

  function scale(domain, range) {
    const [d0, d1] = domain, [r0, r1] = range;
    const span = d1 - d0 || 1;
    return (v) => r0 + ((v - d0) / span) * (r1 - r0);
  }

  function linePath(points) {
    return points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  }

  function axisTicks(min, max, n) {
    const step = (max - min) / (n - 1);
    return Array.from({ length: n }, (_, i) => min + step * i);
  }

  function block(id, kicker, title, body, note) {
    return `<article class="city-block panel" id="block-${id}">
      <div class="panel-title"><div><p>${esc(kicker)}</p><h3>${esc(title)}</h3></div></div>
      ${body}
      <p class="city-note">${note}</p>
    </article>`;
  }

  /* =====================================================================
     1. A cidade encolhe, o arquivo não
     ===================================================================== */

  function landOwnerBlock() {
    const rows = C.landPerOwner.filter((r) => Number.isFinite(r.wards));
    const first = rows[0], last = rows[rows.length - 1];
    const W = 860, H = 380, m = { t: 24, r: 150, b: 46, l: 56 };
    const X = scale([1974, 2024], [m.l, W - m.r]);
    const Y = scale([0, 340], [H - m.b, m.t]);

    const corpusMedian = A.core.median(A.houses.map((h) => h.lotArea));
    const decades = {};
    for (const h of A.houses) {
      const d = Math.floor(h.year / 10) * 10;
      (decades[d] = decades[d] || []).push(h.lotArea);
    }
    const decadeRows = Object.keys(decades).map(Number).filter((d) => d >= 1970).sort()
      .map((d) => ({ d, n: decades[d].length, med: A.core.median(decades[d]) }));

    /* a linha cinza só vai até 1995: o resto é o que se pede para adivinhar */
    const makeSegs = (limit) => {
      const out = [];
      let cur = [];
      for (const r of C.landPerOwner) {
        if (r.year > limit) break;
        if (Number.isFinite(r.wards)) cur.push([X(r.year), Y(r.wards)]);
        else if (cur.length) { out.push(cur); cur = []; }
      }
      if (cur.length) out.push(cur);
      return out;
    };
    const segs = makeSegs(2024);
    const segsEarly = makeSegs(1995);

    const grid = axisTicks(0, 320, 5).map((t) =>
      `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}" class="grid-line"></line>
       <text x="${m.l - 8}" y="${Y(t) + 4}" text-anchor="end" class="axis-text">${t}</text>`).join("");
    const years = [1974, 1985, 1995, 2005, 2015, 2024].map((t) =>
      `<text x="${X(t)}" y="${H - m.b + 20}" text-anchor="middle" class="axis-text">${t}</text>`).join("");

    const decadeDots = decadeRows.map((r) => {
      const x = X(Math.min(2024, r.d + 5));
      return `<g class="corpus-dot" data-dec="${r.d}">
        <circle cx="${x}" cy="${Y(r.med)}" r="5"></circle>
        <text x="${x}" y="${Y(r.med) - 10}" text-anchor="middle" class="corpus-dot-label">${nf(r.med, 0)}</text>
      </g>`;
    }).join("");

    const body = `
      <div class="guess-wrap" id="guess-landowner">
        <p class="guess-ask">Em 1974, cada proprietário de solo residencial nos 23 wards tinha ${nf(first.wards, 0)} m² em média. Arraste o ponto de 2024 para onde você acha que ele está hoje e depois confira.</p>
        <div class="plot-wrap">
          <svg id="chart-landowner" viewBox="0 0 ${W} ${H}" role="img"
               aria-label="Solo residencial por proprietário nos 23 wards, de 1974 a 2024, comparado com o lote mediano do corpus por década.">
            ${grid}${years}
            <text x="${m.l - 8}" y="${m.t - 8}" text-anchor="end" class="axis-text">m²</text>
            <path class="land-line ghost" d="${segsEarly.map(linePath).join(" ")}"></path>
            <path class="land-line real" d="${segs.map(linePath).join(" ")}" style="opacity:0"></path>
            <path class="land-line guessed" d="" style="opacity:0"></path>
            <g class="corpus-dots">${decadeDots}</g>
            <line class="corpus-median" x1="${m.l}" x2="${W - m.r}" y1="${Y(corpusMedian)}" y2="${Y(corpusMedian)}"></line>
            <text x="${W - m.r + 8}" y="${Y(corpusMedian) + 4}" class="series-label hot">lote mediano do corpus, ${nf(corpusMedian, 1)} m²</text>
            <text x="${W - m.r + 8}" y="${Y(last.wards) + 4}" class="series-label real-label" style="opacity:0">2024: ${nf(last.wards, 0)} m² por proprietário</text>
            <circle class="guess-dot" cx="${X(2024)}" cy="${Y(first.wards)}" r="9"></circle>
            <text class="guess-value" x="${X(2024)}" y="${Y(first.wards) - 16}" text-anchor="middle">${nf(first.wards, 0)}</text>
          </svg>
        </div>
        <div class="guess-actions">
          <button type="button" class="primary-button" id="guess-reveal">Ver a resposta</button>
          <span class="guess-feedback" id="guess-feedback"></span>
        </div>
      </div>`;

    const note = `Solo residencial por proprietário pessoa física, nos 23 wards: ${nf(first.wards, 0)} m² em ${first.year} e ${nf(last.wards, 0)} m² em ${last.year}, uma queda de ${nf((1 - last.wards / first.wards) * 100, 1)}%. Os pontos em rosa são a mediana do lote das ${A.metadata.eligibleRecords} fichas comparáveis, por década. Que fiquem abaixo da linha é consequência do recorte, que só aceita lotes menores que 100 m²; o que o gráfico compara é a inclinação: a cidade perde quase metade do solo por dono, e a mediana do arquivo quase não se move. As duas séries medem coisas diferentes, uma é propriedade, a outra é lote de obra publicada. Fonte: cidade, ${esc(C.source.landPerOwner)} Fichas, aba 01 casas base.`;

    return { html: block("landowner", "a cidade e o arquivo", "A cidade encolhe, o arquivo não", body, note), init: () => initGuess(X, Y, first, last, segs) };
  }

  function initGuess(X, Y, first, last, segs) {
    const svg = $("chart-landowner");
    if (!svg) return;
    const dot = svg.querySelector(".guess-dot");
    const label = svg.querySelector(".guess-value");
    const real = svg.querySelector(".land-line.real");
    const ghost = svg.querySelector(".land-line.ghost");
    const realLabel = svg.querySelector(".real-label");
    const guessed = svg.querySelector(".land-line.guessed");
    const feedback = $("guess-feedback");
    let value = first.wards, done = false;

    const yToValue = (clientY) => {
      const rect = svg.getBoundingClientRect();
      const localY = ((clientY - rect.top) / rect.height) * 380;
      const v = (1 - (localY - 24) / (380 - 46 - 24)) * 340;
      return Math.max(0, Math.min(340, v));
    };
    const move = (v) => {
      value = v;
      dot.setAttribute("cy", Y(v));
      label.setAttribute("y", Y(v) - 16);
      label.textContent = nf(v, 0);
    };
    let dragging = false;
    const start = (e) => { if (done) return; dragging = true; svg.setPointerCapture(e.pointerId); move(yToValue(e.clientY)); };
    svg.addEventListener("pointerdown", start);
    svg.addEventListener("pointermove", (e) => { if (dragging) move(yToValue(e.clientY)); });
    svg.addEventListener("pointerup", () => { dragging = false; });
    svg.addEventListener("keydown", (e) => {
      if (done) return;
      if (e.key === "ArrowUp") { e.preventDefault(); move(Math.min(340, value + 5)); }
      if (e.key === "ArrowDown") { e.preventDefault(); move(Math.max(0, value - 5)); }
    });

    $("guess-reveal").addEventListener("click", () => {
      if (done) return;
      done = true;
      const lastPoint = segs[segs.length - 1][segs[segs.length - 1].length - 1];
      guessed.setAttribute("d", `M${X(1995)},${Y(C.landPerOwner.find((r) => r.year === 1995).wards)} L${lastPoint[0]},${Y(value)}`);
      guessed.style.opacity = "1";
      real.style.opacity = "1";
      ghost.style.opacity = "0";
      realLabel.style.opacity = "1";
      const diff = value - last.wards;
      feedback.textContent = Math.abs(diff) < 6
        ? `Você acertou de perto: são ${nf(last.wards, 0)} m².`
        : `São ${nf(last.wards, 0)} m². Seu palpite ficou ${nf(Math.abs(diff), 0)} m² ${diff > 0 ? "acima" : "abaixo"}.`;
      $("guess-reveal").disabled = true;
    });
  }

  /* =====================================================================
     2. Microlotes 2016 a 2024, com mapa por ward
     ===================================================================== */

  const MICRO_METRICS = {
    delta: { label: "variação de proprietários, 2016 a 2024", get: (w) => C.microByWard[w]?.ownersDeltaPct, format: (v) => `${v > 0 ? "+" : ""}${nf(v, 1)}%`, diverging: true },
    density: { label: "proprietários de microlote por km², 2024", get: (w) => C.microByWard[w]?.density2024, format: (v) => `${intBr(v)} /km²` },
    mean: { label: "área média do microlote em 2024", get: (w) => { const s = C.microByWard[w]?.meanM2; return s ? s[s.length - 1] : null; }, format: (v) => `${nf(v, 1)} m²` },
    owners: { label: "proprietários de microlote em 2024", get: (w) => { const s = C.microByWard[w]?.owners; return s ? s[s.length - 1] : null; }, format: (v) => intBr(v) },
  };

  function wardMapSvg(id, metricKey) {
    const W = 560, H = 380;
    const pts = geo.features.flatMap((f) => (f.geometry.type === "Polygon" ? f.geometry.coordinates : f.geometry.coordinates.flat()).flat());
    const minLon = Math.min(...pts.map((p) => p[0])), maxLon = Math.max(...pts.map((p) => p[0]));
    const minLat = Math.min(...pts.map((p) => p[1])), maxLat = Math.max(...pts.map((p) => p[1]));
    const s = Math.min((W - 24) / (maxLon - minLon), (H - 24) / (maxLat - minLat));
    const dw = (maxLon - minLon) * s, dh = (maxLat - minLat) * s;
    const ox = (W - dw) / 2, oy = (H - dh) / 2;
    const project = ([lon, lat]) => [ox + (lon - minLon) * s, oy + (maxLat - lat) * s];
    const pathFor = (f) => (f.geometry.type === "Polygon" ? f.geometry.coordinates : f.geometry.coordinates.flat())
      .map((ring) => ring.map((p, i) => { const [x, y] = project(p); return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ") + " Z").join(" ");
    const shapes = geo.features.map((f) => {
      const ward = f.properties.ward;
      return `<path d="${pathFor(f)}" data-ward="${esc(ward)}" class="micro-ward"></path>`;
    }).join("");
    return `<svg id="${id}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa dos 23 wards: ${esc(MICRO_METRICS[metricKey].label)}">${shapes}</svg>`;
  }

  /* ---------------------------------------------------------------
     Você desenha: o leitor traça a série antes de vê-la.
     --------------------------------------------------------------- */

  const DRAW = { W: 720, H: 330, m: { t: 26, r: 26, b: 44, l: 74 }, lo: 578000, hi: 652000 };

  function drawItBlock() {
    const t = C.microTotals;
    const first = t[0], last = t[t.length - 1];
    const { W, H, m, lo, hi } = DRAW;
    const X = scale([first.year, last.year], [m.l, W - m.r]);
    const Y = scale([lo, hi], [H - m.b, m.t]);
    const bw = W - m.r - m.l, bh = H - m.b - m.t;

    const grid = [];
    for (let v = 580000; v <= 650000; v += 10000) {
      const rotulo = v % 20000 === 0;
      grid.push(`<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="grid-line" opacity="${rotulo ? 1 : 0.45}"></line>`);
      if (rotulo) grid.push(`<text x="${m.l - 10}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" class="axis-text">${intBr(v / 1000)} mil</text>`);
    }
    const anos = t.map((r, i) => `<line x1="${X(r.year).toFixed(1)}" x2="${X(r.year).toFixed(1)}" y1="${m.t}" y2="${H - m.b}" class="drawit-year"></line>
      <text x="${X(r.year).toFixed(1)}" y="${H - m.b + 20}" text-anchor="middle" class="axis-text">${i % 2 === 0 ? r.year : ""}</text>`).join("");

    const body = `
      <p class="guess-ask">Em 2016, <strong>${intBr(first.owners)}</strong> pessoas eram donas de um lote abaixo de 100 m² nos 23 wards. Oito anos depois, esse número subiu, desceu ou ficou onde estava?</p>
      <p class="guess-how">Arraste da esquerda para a direita dentro do quadro e trace a curva que você imagina. O ponto de 2016 já está marcado. Quando chegar em 2024, o botão libera a série real.</p>
      <div class="drawit-wrap">
        <svg id="chart-drawit" viewBox="0 0 ${W} ${H}" class="drawit-svg" role="img"
          aria-label="Desenhe a série de proprietários de lotes abaixo de 100 m² entre 2016 e 2024">
          <rect x="${m.l}" y="${m.t}" width="${bw}" height="${bh}" rx="8" class="drawit-field"></rect>
          ${grid.join("")}${anos}
          <polygon id="drawit-erro" class="drawit-erro" points="" hidden></polygon>
          <path id="drawit-truth" class="drawit-truth" d="" hidden></path>
          <g id="drawit-truth-dots" hidden></g>
          <path id="drawit-guess" class="drawit-guess" d=""></path>
          <g id="drawit-guess-dots"></g>
          <circle cx="${X(first.year).toFixed(1)}" cy="${Y(first.owners).toFixed(1)}" r="5.5" class="drawit-anchor"></circle>
          <text id="drawit-hint" x="${(m.l + bw / 2).toFixed(1)}" y="${(m.t + bh / 2).toFixed(1)}" text-anchor="middle" class="drawit-hint">arraste aqui, da esquerda para a direita</text>
          <text id="drawit-tag-guess" class="drawit-tag-guess" text-anchor="end" hidden></text>
          <text id="drawit-tag-truth" class="drawit-tag-truth" text-anchor="end" hidden></text>
          <rect id="drawit-hit" x="${m.l}" y="${m.t}" width="${bw}" height="${bh}" fill="transparent"></rect>
        </svg>
      </div>
      <div class="drawit-foot">
        <button type="button" class="primary-button" id="drawit-go" disabled>Ver a série real</button>
        <button type="button" class="quiet-button" id="drawit-reset" hidden>Desenhar de novo</button>
        <p class="drawit-verdict" id="drawit-verdict"></p>
      </div>`;

    const note = `Proprietários pessoas físicas com terreno residencial abaixo de 100 m² nos 23 wards, em 1º de janeiro de cada ano. Desenhar antes de ver é recurso de leitura, não medida: o seu traço não entra em conta nenhuma e nada do que você desenha sai do seu navegador. Fonte: ${esc(C.source.micro)}`;
    return { html: block("drawit", "palpite", "Você desenha: quantos donos de microlote, de 2016 a 2024", body, note), init: initDrawIt };
  }

  function initDrawIt() {
    const svg = $("chart-drawit");
    const hit = $("drawit-hit");
    if (!svg || !hit) return;
    const t = C.microTotals;
    const first = t[0], last = t[t.length - 1];
    const { W, H, m, lo, hi } = DRAW;
    const X = scale([first.year, last.year], [m.l, W - m.r]);
    const Y = scale([lo, hi], [H - m.b, m.t]);
    const guessPath = $("drawit-guess");
    const guessDots = $("drawit-guess-dots");
    const truthPath = $("drawit-truth");
    const truthDots = $("drawit-truth-dots");
    const erro = $("drawit-erro");
    const hint = $("drawit-hint");
    const tagG = $("drawit-tag-guess");
    const tagT = $("drawit-tag-truth");
    const go = $("drawit-go");
    const reset = $("drawit-reset");
    const verdict = $("drawit-verdict");
    let guess = t.map((r, i) => (i === 0 ? r.owners : null));
    let done = false;

    const show = (el, on) => { if (on) el.removeAttribute("hidden"); else el.setAttribute("hidden", ""); };

    const redraw = () => {
      const pts = [];
      t.forEach((r, i) => { if (guess[i] != null) pts.push([X(r.year), Y(guess[i])]); });
      guessPath.setAttribute("d", pts.length > 1 ? linePath(pts) : "");
      guessDots.innerHTML = pts.slice(1).map(([x, y]) =>
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" class="drawit-dot-guess"></circle>`).join("");
      const faltam = guess.filter((v) => v == null).length;
      go.disabled = faltam > 0;
      go.textContent = faltam > 0 ? `Faltam ${faltam} ${faltam === 1 ? "ano" : "anos"}` : "Ver a série real";
    };

    const toLocal = (event) => {
      const box = svg.getBoundingClientRect();
      return [((event.clientX - box.left) / box.width) * W, ((event.clientY - box.top) / box.height) * H];
    };

    const paint = (event) => {
      if (done) return;
      show(hint, false);
      const [x, y] = toLocal(event);
      const span = (W - m.r - m.l) / (t.length - 1);
      const idx = Math.round((x - m.l) / span);
      if (idx < 1 || idx >= t.length) return;
      const clamped = Math.max(m.t, Math.min(H - m.b, y));
      const value = lo + ((H - m.b - clamped) / (H - m.b - m.t)) * (hi - lo);
      guess[idx] = value;
      for (let i = 1; i < idx; i += 1) if (guess[i] == null) guess[i] = guess[0] + ((value - guess[0]) * i) / idx;
      redraw();
    };

    hit.addEventListener("pointerdown", (e) => {
      if (done) return;
      hit.setPointerCapture(e.pointerId);
      svg.classList.add("drawing");
      paint(e);
    });
    hit.addEventListener("pointermove", (e) => { if (e.buttons) paint(e); });
    const solta = (e) => {
      svg.classList.remove("drawing");
      try { hit.releasePointerCapture(e.pointerId); } catch (err) { /* ponteiro já solto */ }
    };
    hit.addEventListener("pointerup", solta);
    hit.addEventListener("pointercancel", solta);

    go.addEventListener("click", () => {
      done = true;
      const real = t.map((r) => [X(r.year), Y(r.owners)]);
      const meu = t.map((r, i) => [X(r.year), Y(guess[i])]);
      truthPath.setAttribute("d", linePath(real));
      truthDots.innerHTML = real.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" class="drawit-dot-truth"></circle>`).join("");
      erro.setAttribute("points", real.concat(meu.slice().reverse()).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" "));
      [truthPath, truthDots, erro, tagT, tagG].forEach((el) => show(el, true));

      const yT = Y(last.owners), yG = Y(guess[t.length - 1]);
      const sep = Math.abs(yT - yG) < 16 ? (yG > yT ? 11 : -11) : 0;
      tagT.setAttribute("x", (W - m.r - 6).toFixed(1));
      tagT.setAttribute("y", (yT - 9 - (sep > 0 ? 0 : 0)).toFixed(1));
      tagT.textContent = `real · ${intBr(last.owners)}`;
      tagG.setAttribute("x", (W - m.r - 6).toFixed(1));
      tagG.setAttribute("y", (yG + 16 + sep).toFixed(1));
      tagG.textContent = `seu traço · ${intBr(guess[t.length - 1])}`;

      const fim = guess[t.length - 1];
      const err = Math.abs(fim - last.owners);
      const pct = (err / last.owners) * 100;
      const subiuReal = last.owners > first.owners;
      const subiuVoce = fim > guess[0] + 2000;
      const desceuVoce = fim < guess[0] - 2000;
      const direcao = subiuVoce ? "subindo" : desceuVoce ? "descendo" : "quase reto";
      const acertouDirecao = subiuReal === subiuVoce;
      verdict.innerHTML = `<strong>${acertouDirecao ? "Você acertou o sentido." : "O sentido é o outro."}</strong> Seu traço vai ${direcao} e para em ${intBr(fim)}; a série real sobe de ${intBr(first.owners)} para ${intBr(last.owners)}, um ganho de ${intBr(last.owners - first.owners)} proprietários em oito anos. A diferença entre o seu último ponto e o real é de ${intBr(err)}, ou ${pct.toFixed(1)}%. <span class="drawit-caveat">Mais proprietários não significa automaticamente mais lotes novos: a série conta pessoas com terreno na faixa, não parcelas criadas.</span>`;
      go.hidden = true;
      reset.hidden = false;
    });

    reset.addEventListener("click", () => {
      done = false;
      guess = t.map((r, i) => (i === 0 ? r.owners : null));
      [truthPath, truthDots, erro, tagT, tagG].forEach((el) => show(el, false));
      truthPath.setAttribute("d", "");
      truthDots.innerHTML = "";
      verdict.textContent = "";
      show(hint, true);
      go.hidden = false;
      reset.hidden = true;
      redraw();
    });

    redraw();
  }

  function microBlock() {
    const t = C.microTotals;
    const first = t[0], last = t[t.length - 1];
    const W = 420, H = 230, m = { t: 20, r: 16, b: 34, l: 54 };
    const X = scale([first.year, last.year], [m.l, W - m.r]);
    const maxOwners = Math.max(...t.map((r) => r.owners));
    const minOwners = Math.min(...t.map((r) => r.owners));
    const Y = scale([minOwners * 0.995, maxOwners * 1.002], [H - m.b, m.t]);
    const pts = t.map((r) => [X(r.year), Y(r.owners)]);
    const area = `M${pts[0][0]},${H - m.b} ${pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")} L${pts[pts.length - 1][0]},${H - m.b} Z`;
    const dots = t.map((r, i) => `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="4" class="micro-dot" data-year="${r.year}"></circle>`).join("");
    const yTicks = [minOwners, (minOwners + maxOwners) / 2, maxOwners].map((v) =>
      `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid-line"></line>
       <text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end" class="axis-text">${intBr(v / 1000)} mil</text>`).join("");

    const body = `
      <div class="micro-grid">
        <div>
          <svg id="chart-micro" viewBox="0 0 ${W} ${H}" class="micro-line" role="img" aria-label="Proprietários de lotes abaixo de 100 m² nos 23 wards, de 2016 a 2024">
            ${yTicks}
            <path d="${area}" class="micro-area"></path>
            <path d="${linePath(pts)}" class="micro-path"></path>
            ${dots}
            <text x="${X(first.year)}" y="${H - m.b + 18}" text-anchor="start" class="axis-text">${first.year}</text>
            <text x="${X(last.year)}" y="${H - m.b + 18}" text-anchor="end" class="axis-text">${last.year}</text>
          </svg>
          <ul class="micro-facts">
            <li><strong>${intBr(first.owners)}</strong><span>proprietários de lote abaixo de 100 m² em ${first.year}</span></li>
            <li><strong>${intBr(last.owners)}</strong><span>em ${last.year}, ${nf(((last.owners / first.owners) - 1) * 100, 1)}% a mais</span></li>
            <li><strong>${nf(last.meanM2, 1)} m²</strong><span>área média desses lotes em ${last.year}, contra ${nf(first.meanM2, 1)} m² em ${first.year}</span></li>
          </ul>
        </div>
        <div class="micro-map-wrap">
          <label class="micro-select">Ver no mapa
            <select id="micro-metric">
              ${Object.entries(MICRO_METRICS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join("")}
            </select>
          </label>
          ${wardMapSvg("chart-micro-map", "delta")}
          <div class="micro-legend" id="micro-legend"></div>
          <div class="micro-rank" id="micro-rank"></div>
        </div>
      </div>`;

    const note = `Proprietários pessoa física de lotes menores que 100 m² nos 23 wards, por ano, em 1º de janeiro. A série conta proprietários, não lotes nem domicílios: um proprietário pode ter mais de um lote e um lote pode ter mais de um dono. Crescimento não é prova de novos parcelamentos, porque herança e venda também movem o número. Fonte: ${esc(C.source.micro)}`;

    return { html: block("micro", "solo", "Microlotes, 2016 a 2024", body, note), init: initMicro };
  }

  function initMicro() {
    const select = $("micro-metric");
    const svg = $("chart-micro-map");
    const legend = $("micro-legend");
    const rank = $("micro-rank");
    if (!select || !svg) return;
    const wards = Object.keys(C.microByWard);

    const paint = () => {
      const cfg = MICRO_METRICS[select.value];
      const values = wards.map((w) => cfg.get(w)).filter(Number.isFinite);
      const min = Math.min(...values), max = Math.max(...values);
      const color = (v) => {
        if (!Number.isFinite(v)) return "#e7eef4";
        if (cfg.diverging) {
          const span = Math.max(Math.abs(min), Math.abs(max)) || 1;
          const k = v / span;
          return k >= 0
            ? `rgba(18,52,93,${(0.15 + 0.75 * k).toFixed(3)})`
            : `rgba(194,24,91,${(0.15 + 0.75 * -k).toFixed(3)})`;
        }
        const k = (v - min) / (max - min || 1);
        return `rgba(18,52,93,${(0.12 + 0.8 * k).toFixed(3)})`;
      };
      svg.querySelectorAll("[data-ward]").forEach((node) => {
        const ward = node.dataset.ward;
        const v = cfg.get(ward);
        node.setAttribute("fill", color(v));
        node.onmousemove = (e) => tip(svg, e, `<strong>${esc(ward)}</strong>${esc(cfg.label)}: ${Number.isFinite(v) ? cfg.format(v) : "sem dado"}`);
        node.onmouseleave = hideTip;
      });
      legend.innerHTML = cfg.diverging
        ? `<span class="legend-chip" style="background:rgba(194,24,91,.8)"></span>queda
           <span class="legend-chip" style="background:rgba(18,52,93,.8)"></span>alta
           <span class="legend-range">${cfg.format(min)} a ${cfg.format(max)}</span>`
        : `<span class="legend-chip" style="background:rgba(18,52,93,.2)"></span>${cfg.format(min)}
           <span class="legend-chip" style="background:rgba(18,52,93,.95)"></span>${cfg.format(max)}`;
      const sorted = wards.filter((w) => Number.isFinite(cfg.get(w))).sort((a, b) => cfg.get(b) - cfg.get(a));
      const column = (title, list, tag) => `<div class="micro-rank-col"><h5>${title}</h5><ol>${
        list.map((w) => `<li class="${tag}"><span>${esc(w)}</span><strong>${cfg.format(cfg.get(w))}</strong></li>`).join("")}</ol></div>`;
      rank.innerHTML = column("três maiores", sorted.slice(0, 3), "topo") + column("três menores", sorted.slice(-3).reverse(), "base");
    };
    select.addEventListener("change", paint);
    paint();
  }

  /* =====================================================================
     3. Arquivo contra cidade
     ===================================================================== */

  function archiveCityBlock() {
    /* obras do corpus por ward: as 249 da aba 01 casas base, que estão na
       clientela; proprietários de microlote em 2024: aba 08 */
    const corpusByWard = {};
    for (const c of C.clientela) if (c.ward) corpusByWard[c.ward] = (corpusByWard[c.ward] || 0) + 1;
    const comparable = {};
    for (const h of A.houses) comparable[h.ward] = (comparable[h.ward] || 0) + 1;
    const total = Object.values(corpusByWard).reduce((a, b) => a + b, 0);
    const rows = Object.entries(C.microByWard).map(([ward, d]) => {
      const owners = d.owners[d.owners.length - 1];
      const works = corpusByWard[ward] || 0;
      return { ward, owners, works, rate: owners ? (works / owners) * 10000 : null, up: d.ownersDeltaPct >= 0, delta: d.ownersDeltaPct };
    }).filter((r) => Number.isFinite(r.rate)).sort((a, b) => b.rate - a.rate);

    const W = 860, H = 40 + rows.length * 26, m = { t: 30, r: 230, b: 10, l: 110 };
    const max = Math.max(...rows.map((r) => r.rate)) || 1;
    const X = scale([0, max], [m.l, W - m.r]);
    const bars = rows.map((r, i) => {
      const y = m.t + i * 26;
      const w = Math.max(1, X(r.rate) - m.l);
      return `<g class="archive-row" data-ward="${esc(r.ward)}">
        <text x="${m.l - 10}" y="${y + 13}" text-anchor="end" class="axis-text">${esc(r.ward)}</text>
        <rect x="${m.l}" y="${y}" width="${w.toFixed(1)}" height="17" rx="3" class="archive-bar ${r.up ? "frag" : "cons"}"></rect>
        <text x="${(m.l + w + 8).toFixed(1)}" y="${y + 13}" class="archive-value">${nf(r.rate, 2)} por 10 mil · ${intBr(r.works)} obra${r.works === 1 ? "" : "s"}</text>
      </g>`;
    }).join("");

    const body = `
      <div class="plot-wrap"><svg id="chart-archive-city" viewBox="0 0 ${W} ${H}" role="img"
        aria-label="Obras do corpus por 10 mil proprietários de microlote, por ward">
        <text x="${m.l - 10}" y="${m.t - 12}" text-anchor="end" class="axis-text">ward</text>
        <g id="archive-bars">${bars}</g>
      </svg></div>
      <div class="archive-legend">
        <span><i class="swatch frag"></i>donos de microlote aumentaram de 2016 a 2024</span>
        <span><i class="swatch cons"></i>diminuíram</span>
      </div>`;

    const top = rows[0], topCount = rows.slice().sort((a, b) => b.works - a.works)[0];
    const note = `Obras do corpus, as ${total} da aba 01 casas base, para cada 10 mil proprietários de lote abaixo de 100 m² em 2024, ward a ward. ${esc(topCount.ward)} tem mais obras em número, ${intBr(topCount.works)}, mas ${esc(top.ward)} lidera a conta relativa, com ${nf(top.rate, 2)} por 10 mil. A cor diz se o número de donos de microlote subiu ou caiu desde 2016, o que não é o mesmo que dizer que o solo foi parcelado: herança e venda também mexem nesse número. A conta cruza um arquivo editorial com um cadastro tributário e mede densidade de publicação, nunca frequência de microcasas na cidade. Fonte: obras, aba 01 casas base; proprietários, ${esc(C.source.micro)} A mesma razão aparece na aba 07 contexto wards.`;

    return { html: block("archive-city", "arquivo × cidade", "Onde se publica não é onde se constrói", body, note), init: () => {
      document.querySelectorAll("#chart-archive-city .archive-row").forEach((node) => {
        node.addEventListener("mousemove", (e) => {
          const ward = node.dataset.ward;
          const d = C.microByWard[ward];
          tip(node, e, `<strong>${esc(ward)}</strong>${intBr(d.owners[d.owners.length - 1])} proprietários de microlote em 2024<br>${nf(d.ownersDeltaPct, 1)}% desde 2016<br>${corpusByWard[ward] || 0} obra${(corpusByWard[ward] || 0) === 1 ? "" : "s"} no corpus, ${comparable[ward] || 0} no recorte comparável`);
        });
        node.addEventListener("mouseleave", hideTip);
        node.addEventListener("click", () => A.toggleWard(node.dataset.ward));
      });
    } };
  }

  /* =====================================================================
     4. Quando cada ward passou a exigir lote mínimo
     ===================================================================== */

  function regimeBlock() {
    const entries = Object.entries(C.wardNorms).map(([ward, n]) => {
      const match = String(n.adoptionDate || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
      return { ward, ...n, year: match ? Number(match[3]) : null, multiple: /\)\s*e\s/.test(n.adoptionDate || "") };
    });
    const counts = entries.reduce((acc, e) => { acc[e.regimeCode] = (acc[e.regimeCode] || 0) + 1; return acc; }, {});
    const dated = entries.filter((e) => e.year).sort((a, b) => a.year - b.year);
    const W = 860, H = 260, m = { t: 40, r: 24, b: 40, l: 24 };
    const years = dated.map((e) => e.year);
    const X = scale([Math.min(...years), Math.max(...years)], [m.l + 40, W - m.r - 40]);
    const lanes = {};
    const dots = dated.map((e) => {
      const x = X(e.year);
      const key = Math.round(x / 40);
      lanes[key] = (lanes[key] || 0) + 1;
      const y = H - m.b - (lanes[key] - 1) * 26;
      return `<g class="regime-dot regime-${e.regimeCode}" data-ward="${esc(e.ward)}">
        <circle cx="${x.toFixed(1)}" cy="${y}" r="9"></circle>
        <text x="${x.toFixed(1)}" y="${y + 3.5}" text-anchor="middle">${esc(e.regimeCode)}</text>
        <text x="${(x + 14).toFixed(1)}" y="${y + 4}" text-anchor="start" class="regime-ward">${esc(e.ward)}${e.multiple ? " *" : ""}</text>
      </g>`;
    }).join("");
    const axis = axisTicks(Math.min(...years), Math.max(...years), 5).map((t) =>
      `<line x1="${X(t)}" x2="${X(t)}" y1="${m.t}" y2="${H - m.b + 6}" class="grid-line"></line>
       <text x="${X(t)}" y="${H - 14}" text-anchor="middle" class="axis-text">${Math.round(t)}</text>`).join("");

    const body = `
      <div class="regime-counts">
        <div class="regime-count A"><strong>${counts.A || 0}</strong><span>wards com mínimo em todo o território</span></div>
        <div class="regime-count B"><strong>${counts.B || 0}</strong><span>só em áreas delimitadas por plano de distrito</span></div>
        <div class="regime-count C"><strong>${counts.C || 0}</strong><span>sem área mínima de lote</span></div>
      </div>
      <div class="plot-wrap"><svg id="chart-regime" viewBox="0 0 ${W} ${H}" role="img"
          aria-label="Ano de adoção da área mínima de lote em cada ward">
          ${axis}${dots}
          <text x="${m.l}" y="${m.t - 16}" class="axis-text">ano de adoção da regra de área mínima</text>
        </svg></div>`;

    const note = `Regime de área mínima de lote nos 23 wards, com a data de adoção registrada. ${dated.length} wards têm data; os demais não definem mínimo ou não registram adoção. Onde há duas datas, a mais antiga entra na linha e o ward aparece com asterisco; a ficha traz as duas. O mínimo vale para lotes novos: lotes anteriores continuam existindo como 既存不適格. Fonte: ${esc(C.source.wardNorms)}`;

    return { html: block("regime", "norma", "Quando cada ward passou a exigir um lote mínimo", body, note), init: () => {
      document.querySelectorAll("#chart-regime .regime-dot").forEach((node) => {
        const n = C.wardNorms[node.dataset.ward];
        node.addEventListener("mousemove", (e) => tip(node, e,
          `<strong>${esc(node.dataset.ward)}</strong>${esc(n.regime || "")}<br>Lote mínimo: ${esc(n.minimumLot || "não registrado")} m²<br>Escopo: ${esc(n.scope || "não registrado")}<br>Adoção: ${esc(n.adoptionDate || "não registrada")}`));
        node.addEventListener("mouseleave", hideTip);
      });
    } };
  }

  /* =====================================================================
     Solo em movimento: quem vende e quem herda terreno pequeno, 2024.
     Fonte: aba 17 análise fluxo lotes 2024. Transações por faixa de área
     da parcela, não subdivisões; a nota diz as duas contas, em número e em
     área, para o microlote não parecer maior do que é.
     ===================================================================== */
  function landFlowBlock() {
    const F = C.landFlow;
    if (!F) return null;
    const wards = Object.keys(F);
    const sum = (k) => wards.reduce((s, w) => s + F[w][k], 0);
    const sS = sum("salesSmall"), sT = sum("salesTotal"), hS = sum("inhSmall"), hT = sum("inhTotal");
    const aS = sum("salesSmallM2"), aT = sum("salesTotalM2");
    const rows = wards.map((w) => Object.assign({ ward: w }, F[w])).sort((a, b) => b.salesPct - a.salesPct);
    const minSale = rows.reduce((a, b) => (b.salesPct < a.salesPct ? b : a));
    const minInh = rows.reduce((a, b) => (b.inhPct < a.inhPct ? b : a));
    const allMajority = rows.every((r) => r.salesPct > 50 && r.inhPct > 50);
    const W = 860, rowH = 22, m = { t: 38, r: 28, b: 34, l: 112 };
    const H = m.t + rows.length * rowH + m.b;
    /* a escala começa em 40%: todos os valores passam de 60%, e a linha de
       metade continua à vista como referência */
    const X = scale([40, 100], [m.l, W - m.r]);
    const ticks = [40, 50, 60, 70, 80, 90, 100].map((v) =>
      `<line x1="${X(v)}" x2="${X(v)}" y1="${m.t - 6}" y2="${H - m.b + 2}" class="${v === 50 ? "flow-half" : "grid-line"}"></line>
       <text x="${X(v)}" y="${H - m.b + 18}" text-anchor="middle" class="axis-text">${v}%</text>`).join("");
    const diamond = (x, y, r) => `M${x.toFixed(1)},${(y - r).toFixed(1)} L${(x + r).toFixed(1)},${y.toFixed(1)} L${x.toFixed(1)},${(y + r).toFixed(1)} L${(x - r).toFixed(1)},${y.toFixed(1)} Z`;
    const marks = rows.map((r, i) => {
      const y = m.t + i * rowH + rowH / 2;
      const xs = X(r.salesPct), xh = X(r.inhPct);
      /* quando vendas e heranças quase coincidem, as marcas se afastam na
         vertical para uma não esconder a outra */
      const near = Math.abs(xs - xh) < 12, ys = near ? y - 3.5 : y, yh = near ? y + 3.5 : y;
      return `<g class="flow-row" data-ward="${esc(r.ward)}" tabindex="0" role="listitem" aria-label="${esc(r.ward)}: vendas ${nf(r.salesPct, 1)}%, heranças ${nf(r.inhPct, 1)}%">
        <rect x="4" y="${y - rowH / 2}" width="${W - 8}" height="${rowH}" rx="4" class="flow-hit"></rect>
        <text x="${m.l - 12}" y="${y + 4}" text-anchor="end" class="axis-text">${esc(r.ward)}</text>
        <line x1="${Math.min(xs, xh).toFixed(1)}" x2="${Math.max(xs, xh).toFixed(1)}" y1="${y}" y2="${y}" class="flow-link"></line>
        <circle cx="${xs.toFixed(1)}" cy="${ys}" r="5.5" class="flow-sale"></circle>
        <path d="${diamond(xh, yh, 6.5)}" class="flow-inh"></path>
      </g>`;
    }).join("");
    const body = `
      <ul class="micro-facts flow-facts">
        <li><strong>${nf((100 * sS) / sT, 1)}%</strong><span>das vendas de terreno nos 23 wards em 2024 foram de lotes com menos de 100 m², ${intBr(sS)} de ${intBr(sT)}</span></li>
        <li><strong>${nf((100 * hS) / hT, 1)}%</strong><span>das heranças de terreno no mesmo ano também, ${intBr(hS)} de ${intBr(hT)}</span></li>
        <li><strong>${nf((100 * aS) / aT, 1)}%</strong><span>é o peso desses lotes na área vendida: são muitos, mas pequenos</span></li>
      </ul>
      <div class="flow-legend" aria-hidden="true">
        <span><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" class="flow-sale"></circle></svg>vendas</span>
        <span><svg width="14" height="14" viewBox="0 0 14 14"><path d="${diamond(7, 7, 6)}" class="flow-inh"></path></svg>heranças</span>
        <span><svg width="22" height="14" viewBox="0 0 22 14"><line x1="11" x2="11" y1="0" y2="14" class="flow-half"></line></svg>metade</span>
      </div>
      <div class="plot-wrap"><svg id="chart-flow" viewBox="0 0 ${W} ${H}" role="img" aria-label="Parcela de lotes abaixo de 100 m² nas vendas e nas heranças de terreno de 2024, por ward">
        <text x="${m.l}" y="${m.t - 18}" class="axis-text">parcela de lotes com menos de 100 m² no total de transações do ward, 2024</text>
        ${ticks}
        <g role="list">${marks}</g>
      </svg></div>`;
    const note = `${allMajority ? "Em todos os 23 wards" : "Na maior parte dos wards"}, a maioria das vendas e das heranças de terreno de 2024 foi de lotes com menos de 100 m²: o menor índice de vendas é o de ${esc(minSale.ward)}, ${nf(minSale.salesPct, 1)}%, e o menor de heranças, o de ${esc(minInh.ward)}, ${nf(minInh.inhPct, 1)}%. Em número de transações, é o microlote que mais muda de dono, por compra ou por família; em área, ele responde por ${nf((100 * aS) / aT, 1)}% do solo vendido. A conta é de transações por faixa de área da parcela (até 50 m² somado a 50 a 100 m²), não de subdivisões, e não separa uso residencial. Fonte: ${esc(C.source.landFlow)}`;
    return { html: block("landflow", "solo em movimento", "O microlote é o que mais muda de dono", body, note), init: () => {
      document.querySelectorAll("#chart-flow .flow-row").forEach((node) => {
        const d = F[node.dataset.ward];
        const show = (e) => tip(node, e, `<strong>${esc(node.dataset.ward)}</strong>vendas: ${intBr(d.salesSmall)} de ${intBr(d.salesTotal)} com menos de 100 m² (${nf(d.salesPct, 1)}%)<br>até 50 m²: ${intBr(d.sales50)} · 50 a 100 m²: ${intBr(d.sales100)}<br>heranças: ${intBr(d.inhSmall)} de ${intBr(d.inhTotal)} (${nf(d.inhPct, 1)}%)`);
        node.addEventListener("mousemove", show);
        node.addEventListener("focus", () => { const r = node.getBoundingClientRect(); show({ clientX: r.left + r.width / 2, clientY: r.top }); });
        node.addEventListener("mouseleave", hideTip);
        node.addEventListener("blur", hideTip);
      });
    } };
  }

  /* =====================================================================
     Quem mora junto: composição dos domicílios da Metrópole de Tóquio.
     Fonte: aba 09 domesticidade base. É a prefeitura inteira, não os 23
     wards; a nota diz isso e reconcilia com o bloco do censo.
     ===================================================================== */
  function householdsBlock() {
    const all = C.households || [];
    const rows = all.filter((r) => r.total && [r.single, r.couple, r.coupleKids, r.singleParent, r.nonNuclear].every(Number.isFinite));
    if (rows.length < 2) return null;
    const TYPES = [
      { key: "single", label: "uma pessoa", hi: true },
      { key: "coupleKids", label: "casal com filhos" },
      { key: "couple", label: "casal sem filhos" },
      { key: "singleParent", label: "monoparental" },
      { key: "nonNuclear", label: "família não nuclear" },
    ];
    const share = (r, k) => (100 * r[k]) / r.total;
    const first = rows[0], last = rows[rows.length - 1];
    const W = 620, H = 290, m = { t: 20, r: 190, b: 30, l: 44 };
    const X = scale([first.year, last.year], [m.l, W - m.r]);
    const Y = scale([0, 55], [H - m.b, m.t]);
    const grid = [0, 10, 20, 30, 40, 50].map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid-line"></line>
      <text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end" class="axis-text">${v}%</text>`).join("");
    const years = rows.map((r) => `<text x="${X(r.year)}" y="${H - m.b + 18}" text-anchor="middle" class="axis-text">${r.year}</text>`).join("");
    const lines = TYPES.map((t) => {
      const pts = rows.map((r) => [X(r.year), Y(share(r, t.key))]);
      const end = pts[pts.length - 1];
      return `<g class="hh-series${t.hi ? " hi" : ""}">
        <path d="${linePath(pts)}" class="hh-line"></path>
        ${rows.map((r, i) => `<circle cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="4" class="hh-dot" data-key="${t.key}" data-i="${i}" tabindex="0"></circle>`).join("")}
        <text x="${end[0] + 10}" y="${end[1] + 4}" class="hh-label">${esc(t.label)} · ${nf(share(last, t.key), 1)}%</text>
      </g>`;
    }).join("");
    const old0 = all.find((r) => Number.isFinite(r.aloneOld)), old1 = [...all].reverse().find((r) => Number.isFinite(r.aloneOld));
    const cp0 = all.find((r) => Number.isFinite(r.oldCouple)), cp1 = [...all].reverse().find((r) => Number.isFinite(r.oldCouple));
    const oneIn = Math.round(old1.total / old1.aloneOld);
    const census = C.census23 && C.census23[C.census23.length - 1];
    const body = `
      <div class="hh-grid">
        <div class="plot-wrap"><svg id="chart-households" viewBox="0 0 ${W} ${H}" role="img" aria-label="Composição dos domicílios particulares da Metrópole de Tóquio, ${first.year} a ${last.year}">
          ${grid}${years}${lines}
        </svg></div>
        <ul class="micro-facts">
          <li><strong>${intBr(old1.aloneOld)}</strong><span>domicílios de uma pessoa com 65 anos ou mais em ${old1.year}, ${nf(old1.aloneOld / old0.aloneOld, 1)} vezes os ${intBr(old0.aloneOld)} de ${old0.year}: um em cada ${oneIn} domicílios da metrópole</span></li>
          <li><strong>${intBr(cp1.oldCouple)}</strong><span>casais idosos em ${cp1.year}, contra ${intBr(cp0.oldCouple)} em ${cp0.year}</span></li>
        </ul>
      </div>`;
    const note = `Parcela de cada tipo nos domicílios particulares da Metrópole de Tóquio, nos censos de ${first.year} a ${last.year}. O casal com filhos, que o código nLDK toma como família padrão, é hoje ${nf(share(last, "coupleKids"), 1)}% dos domicílios; o de uma pessoa, ${nf(share(last, "single"), 1)}%. O recorte é a metrópole inteira, e não só os 23 wards, porque é o único em que a aba traz a composição: por isso a parcela de uma pessoa aqui${census && Number.isFinite(census.pctSingle) ? ` fica abaixo dos ${nf(census.pctSingle, 1)}% do bloco anterior, que conta só os 23 wards` : " difere da dos 23 wards"}. Casal sem filhos, casal com filhos e monoparental somam a família nuclear; cerca de 1% dos domicílios, os que incluem pessoas sem parentesco, fica fora do gráfico. A série começa em ${first.year} porque monoparental e família não nuclear só aparecem na aba a partir desse censo. Fonte: ${esc(C.source.households)}`;
    return { html: block("households", "família", "Metade dos domicílios tem uma pessoa só", body, note), init: () => {
      document.querySelectorAll("#chart-households .hh-dot").forEach((node) => {
        const t = TYPES.find((x) => x.key === node.dataset.key);
        const r = rows[Number(node.dataset.i)];
        const show = (e) => tip(node, e, `<strong>${r.year} · ${esc(t.label)}</strong>${intBr(r[t.key])} domicílios, ${nf(share(r, t.key), 1)}% do total`);
        node.addEventListener("mousemove", show);
        node.addEventListener("focus", () => { const b = node.getBoundingClientRect(); show({ clientX: b.left, clientY: b.top }); });
        node.addEventListener("mouseleave", hideTip);
        node.addEventListener("blur", hideTip);
      });
    } };
  }

  /* =====================================================================
     5. O domicílio encolhe
     ===================================================================== */

  const CENSUS_SERIES = [
    { key: "personsPerHh", label: "pessoas por domicílio", format: (v) => nf(v, 2), invert: true },
    { key: "pctSingle", label: "domicílios de uma pessoa", format: (v) => `${nf(v, 1)}%` },
    { key: "pctDetached", label: "casa isolada", format: (v) => `${nf(v, 1)}%`, invert: true },
    { key: "pctApartment", label: "apartamento", format: (v) => `${nf(v, 1)}%` },
    { key: "pctOwners", label: "domicílios proprietários", format: (v) => `${nf(v, 1)}%` },
    { key: "pct65", label: "população com 65 anos ou mais", format: (v) => `${nf(v, 1)}%` },
  ];

  function censusBlock() {
    const rows = C.census23;
    const direction = (s) => (rows[rows.length - 1][s.key] >= rows[0][s.key] ? "up" : "down");
    const spark = (s) => {
      const W = 240, H = 120, m = { t: 22, r: 14, b: 22, l: 14 };
      const values = rows.map((r) => r[s.key]);
      const min = Math.min(...values), max = Math.max(...values);
      const X = scale([rows[0].year, rows[rows.length - 1].year], [m.l, W - m.r]);
      const Y = scale([min - (max - min) * 0.25, max + (max - min) * 0.25], [H - m.b, m.t]);
      const pts = rows.map((r) => [X(r.year), Y(r[s.key])]);
      return `<figure class="census-card" data-key="${s.key}" data-answer="${direction(s)}">
        <figcaption>${esc(s.label)}</figcaption>
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.label)} nos 23 wards, de ${rows[0].year} a ${rows[rows.length - 1].year}">
          <path d="${linePath(pts)}" class="census-line ${s.invert ? "down" : "up"}"></path>
          ${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" class="census-dot" data-i="${i}" data-key="${s.key}"></circle>`).join("")}
          <text x="${m.l}" y="${H - 6}" class="axis-text">${rows[0].year}</text>
          <text x="${W - m.r}" y="${H - 6}" text-anchor="end" class="axis-text">${rows[rows.length - 1].year}</text>
          <text x="${m.l}" y="${m.t - 8}" class="census-value">${s.format(values[0])}</text>
          <text x="${W - m.r}" y="${m.t - 8}" text-anchor="end" class="census-value strong reveal-only">${s.format(values[values.length - 1])}</text>
        </svg>
        <div class="census-guess">
          <button type="button" data-guess="up">subiu</button>
          <button type="button" data-guess="down">caiu</button>
        </div>
        <p class="census-verdict" aria-live="polite"></p>
      </figure>`;
    };
    const body = `
      <p class="census-ask" id="census-ask">Seis séries dos 23 wards entre ${rows[0].year} e ${rows[rows.length - 1].year}. Antes de ver a linha, diga o que você acha que aconteceu com cada uma. <span id="census-score"></span></p>
      <div class="census-grid guessing" id="chart-census">${CENSUS_SERIES.map(spark).join("")}</div>
      <button type="button" class="quiet-button" id="census-reveal">Mostrar todas</button>`;
    const note = `Os 23 wards somados, censo a censo, de ${rows[0].year} a ${rows[rows.length - 1].year}. Domicílio não é casa nem lote: é unidade de moradia recenseada. Fonte: ${esc(C.source.census23)}`;
    return { html: block("census", "domicílio", "Menos gente em cada casa", body, note), init: () => {
      /* palpite antes da linha: uma pergunta por série, um clique cada */
      const grid = $("chart-census");
      const score = $("census-score");
      let answered = 0, right = 0;
      const tell = () => {
        if (!answered) { score.textContent = ""; return; }
        score.textContent = `Você acertou ${right} de ${answered}.`;
      };
      const settle = (card, guess) => {
        if (card.classList.contains("settled")) return;
        card.classList.add("settled");
        const ok = guess === card.dataset.answer;
        answered += 1;
        if (guess) right += ok ? 1 : 0;
        const verdict = card.querySelector(".census-verdict");
        if (guess) verdict.textContent = ok ? "acertou" : `na verdade ${card.dataset.answer === "up" ? "subiu" : "caiu"}`;
        verdict.classList.toggle("wrong", Boolean(guess) && !ok);
        tell();
        if (!grid.querySelector(".census-card:not(.settled)")) grid.classList.remove("guessing");
      };
      grid.querySelectorAll(".census-card").forEach((card) => {
        card.querySelectorAll("[data-guess]").forEach((b) => b.addEventListener("click", () => settle(card, b.dataset.guess)));
      });
      $("census-reveal").addEventListener("click", () => {
        grid.querySelectorAll(".census-card").forEach((card) => settle(card, null));
        grid.classList.remove("guessing");
      });

      document.querySelectorAll("#chart-census .census-dot").forEach((node) => {
        node.addEventListener("mousemove", (e) => {
          const s = CENSUS_SERIES.find((x) => x.key === node.dataset.key);
          const r = rows[Number(node.dataset.i)];
          tip(node, e, `<strong>${r.year}</strong>${esc(s.label)}: ${s.format(r[s.key])}`);
        });
        node.addEventListener("mouseleave", hideTip);
      });
    } };
  }

  /* =====================================================================
     6. Tóquio no Japão
     ===================================================================== */

  function prefectureBlock() {
    const list = C.prefectures.slice().sort((a, b) => a.m2 - b.m2);
    const mean = list.reduce((s, p) => s + p.m2, 0) / list.length;
    const tokyo = list.find((p) => p.name === "Tokyo");
    const W = 860, H = 150, m = { t: 30, r: 30, b: 40, l: 30 };
    const min = list[0].m2, max = list[list.length - 1].m2;
    const X = scale([min - 4, max + 4], [m.l, W - m.r]);
    const dots = list.map((p, i) => {
      const y = m.t + 40 + (i % 3) * 13;
      const isTokyo = p.name === "Tokyo";
      return `<circle cx="${X(p.m2).toFixed(1)}" cy="${y}" r="${isTokyo ? 8 : 5}" class="pref-dot${isTokyo ? " tokyo" : ""}" data-name="${esc(p.name)}" data-m2="${p.m2}"></circle>`;
    }).join("");
    const body = `<div class="plot-wrap"><svg id="chart-prefectures" viewBox="0 0 ${W} ${H}" role="img"
        aria-label="Área média por moradia nas 47 províncias, com Tóquio destacada">
        <line x1="${m.l}" x2="${W - m.r}" y1="${m.t + 22}" y2="${m.t + 22}" class="axis-line"></line>
        ${axisTicks(60, 150, 7).map((t) => `<text x="${X(t)}" y="${m.t + 12}" text-anchor="middle" class="axis-text">${Math.round(t)}</text>`).join("")}
        <line x1="${X(mean)}" x2="${X(mean)}" y1="${m.t + 22}" y2="${H - 22}" class="pref-mean"></line>
        <text x="${X(mean)}" y="${H - 8}" text-anchor="middle" class="axis-text">média nacional ${nf(mean, 1)} m²</text>
        <text x="${X(tokyo.m2)}" y="${m.t + 8}" text-anchor="middle" class="pref-label">Tóquio ${nf(tokyo.m2, 2)} m²</text>
        ${dots}
      </svg></div>`;
    const note = `Área total média por moradia em cada uma das 47 províncias. Tóquio é a menor, ${nf(tokyo.m2, 2)} m², contra ${nf(mean, 1)} m² de média entre as províncias. A medida é por moradia, não por pessoa: províncias com moradias maiores também têm famílias maiores. Fonte: ${esc(C.source.prefectures)}`;
    return { html: block("prefectures", "escala nacional", "Tóquio é a menor das 47", body, note), init: () => {
      document.querySelectorAll("#chart-prefectures .pref-dot").forEach((node) => {
        node.addEventListener("mousemove", (e) => tip(node, e, `<strong>${esc(node.dataset.name)}</strong>${nf(Number(node.dataset.m2), 2)} m² por moradia`));
        node.addEventListener("mouseleave", hideTip);
      });
    } };
  }

  /* =====================================================================
     7. Quem mora e relatos
     ===================================================================== */

  function residentsBlock() {
    const cl = C.clientela;
    const known = cl.filter((c) => c.classification && c.classification !== "sem dados");
    /* a aba usa rótulos variados; o waffle agrupa em quatro cores */
    const groupOf = (c) => /^Autoria-habitação/.test(c.classification) ? "author"
      : c.classification === "Composição com divergência" ? "conflict"
      : c.classification === "Profissão conhecida" ? "profession" : "known";
    const classes = { author: 0, conflict: 0, profession: 0, known: 0 };
    for (const c of known) classes[groupOf(c)] += 1;
    const cols = 28;
    const cells = cl.map((c, i) => {
      const k = c.classification && c.classification !== "sem dados";
      const cls = !k ? "empty" : groupOf(c);
      return `<span class="waffle-cell ${cls}" data-i="${i}" tabindex="${k ? 0 : -1}"></span>`;
    }).join("");

    const res = C.residents;
    const cards = res.map((r) => `
      <article class="resident-card">
        <p class="resident-house">${esc(r.house)}</p>
        <p class="resident-meta">${esc(r.ward || "ward não registrado")}${r.year ? ` · ${r.year}` : ""}</p>
        <p class="resident-relation">${esc(r.relation)}${r.architectResident ? ' <span class="badge">arquiteto morador</span>' : ""}</p>
        <p class="resident-type">${esc(r.responseType)}</p>
      </article>`).join("");

    const body = `
      <div class="waffle-wrap">
        <div class="waffle" style="--cols:${cols}" role="img" aria-label="${cl.length} obras da aba de clientela: ${known.length} com registro sobre quem mora">${cells}</div>
        <ul class="waffle-legend">
          <li><i class="swatch known"></i>${classes.known} com composição, perfil ou uso doméstico registrado</li>
          <li><i class="swatch author"></i>${classes.author} projetadas pelo próprio morador</li>
          <li><i class="swatch conflict"></i>${classes.conflict} com divergência entre fontes</li>
          <li><i class="swatch profession"></i>${classes.profession} só com a profissão registrada</li>
          <li><i class="swatch empty"></i>${cl.length - known.length} sem dado sobre quem mora</li>
        </ul>
      </div>
      <h4 class="sub-head">Relatos de moradores já autorizados</h4>
      <div class="resident-grid">${cards}</div>`;

    const note = `Das ${cl.length} obras do corpus, ${known.length} têm alguma informação sobre quem mora. Nenhum nome de morador aparece aqui, e cada relato mostra apenas o tipo de resposta que a autorização cobre. Quem responde é uma pessoa, não uma amostra: nenhuma fala vira descrição de como se mora no Japão. Fonte: quadriculado, ${esc(C.source.clientela)} Relatos, ${esc(C.source.residents)}`;
    return { html: block("residents", "quem mora", "O arquivo sabe pouco sobre quem mora", body, note), init: () => {
      document.querySelectorAll(".waffle-cell").forEach((node) => {
        const c = cl[Number(node.dataset.i)];
        if (!c.classification || c.classification === "sem dados") return;
        const show = (e) => tip(node, e, `<strong>${esc(c.name)}</strong>${esc(c.office || "")}${c.ward ? `<br>${esc(c.ward)}` : ""}${c.year ? ` · ${c.year}` : ""}<br>${esc(c.detail || c.classification)}`);
        node.addEventListener("mousemove", show);
        node.addEventListener("focus", (e) => show({ clientX: node.getBoundingClientRect().left, clientY: node.getBoundingClientRect().top }));
        node.addEventListener("mouseleave", hideTip);
        node.addEventListener("blur", hideTip);
      });
    } };
  }

  /* =====================================================================
     8. Bastidores: biblioteca normativa
     ===================================================================== */

  function normsBlock() {
    const lib = C.normsLibrary;
    const levels = [...new Set(lib.map((l) => l.level))];
    const body = `
      <div class="norms-filters" id="norms-filters">
        <button type="button" class="chip-button active" data-level="all">todas · ${lib.length}</button>
        ${levels.map((l) => `<button type="button" class="chip-button" data-level="${esc(l)}">${esc(l)} · ${lib.filter((x) => x.level === l).length}</button>`).join("")}
      </div>
      <div class="norms-list" id="norms-list">
        ${lib.map((l) => `<article class="norm-item" data-level="${esc(l.level)}">
          <h4>${esc(l.name)} <span class="ja">${esc(l.ja || "")}</span></h4>
          <p class="norm-meta">${esc(l.level)}${l.year ? ` · ${esc(l.year)}` : ""}</p>
          <p>${esc(l.role || "")}</p>
          ${l.url ? `<a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.portal || "abrir")} ↗</a>` : '<span class="muted">sem link público registrado</span>'}
        </article>`).join("")}
      </div>`;
    const note = `As ${lib.length} normas e documentos oficiais que as seções A norma e Território usam, com o portal onde cada texto pode ser conferido. Tradução oficial em inglês não substitui o texto japonês vigente: quando os dois divergem, vale o japonês.`;
    return { html: block("norms", "biblioteca", "As normas que o atlas cita", body, note), init: () => {
      const filters = $("norms-filters");
      filters.addEventListener("click", (e) => {
        const b = e.target.closest("[data-level]");
        if (!b) return;
        filters.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
        document.querySelectorAll("#norms-list .norm-item").forEach((item) => {
          item.hidden = b.dataset.level !== "all" && item.dataset.level !== b.dataset.level;
        });
      });
    } };
  }

  const COV_LABELS = {
    pop_total: "população total", pop_homem: "população, homens", pop_mulher: "população, mulheres",
    pop_0_14: "população de 0 a 14 anos", pop_15_64: "população de 15 a 64", pop_65_mais: "população de 65 ou mais",
    idade_media: "idade média", idade_desconhecida: "idade não declarada",
    domicilios_total: "domicílios, total", domicilios_particulares: "domicílios particulares",
    domicilios_coletivos: "domicílios coletivos", pessoas_domicilios_particulares: "pessoas em domicílios particulares",
    pessoas_por_domicilio: "pessoas por domicílio",
    dom_1: "domicílios de 1 pessoa", dom_2: "de 2 pessoas", dom_3: "de 3 pessoas", dom_4: "de 4 pessoas",
    dom_5: "de 5 pessoas", dom_6: "de 6 pessoas", dom_7_mais: "de 7 ou mais",
    familias_nucleares: "famílias nucleares", casal_sem_filhos: "casal sem filhos", casal_com_filhos: "casal com filhos",
    monoparental_com_filhos: "monoparental com filhos", outros_parentes: "outros parentes", nao_parentes: "não parentes",
    unipessoais: "unipessoais", proprietarios: "proprietários", aluguel_publico: "aluguel público",
    aluguel_privado: "aluguel privado", habitacao_empregador: "moradia do empregador",
    casa_isolada_dom: "domicílios em casa isolada", fileira_dom: "domicílios em casa geminada",
    apartamento_dom: "domicílios em apartamento",
  };

  function scrollyFindings() {
    const list = $("findings-list");
    if (!list || window.innerWidth < 1081) return;
    const findings = [...list.querySelectorAll(".finding")];
    if (findings.length < 2) return;
    const wrap = document.createElement("div");
    wrap.className = "scrolly";
    const steps = document.createElement("div");
    steps.className = "scrolly-steps";
    const sticky = document.createElement("div");
    sticky.className = "scrolly-sticky";
    const figures = document.createElement("div");
    figures.className = "scrolly-figures";
    sticky.appendChild(figures);

    findings.forEach((f, i) => {
      const chart = f.querySelector(".finding-chart");
      if (chart) {
        chart.classList.add("scrolly-figure");
        chart.dataset.step = String(i);
        figures.appendChild(chart);
      }
      f.classList.add("scrolly-step");
      f.dataset.step = String(i);
      steps.appendChild(f);
    });
    wrap.append(steps, sticky);
    list.innerHTML = "";
    list.appendChild(wrap);

    const setActive = (i) => {
      figures.querySelectorAll(".scrolly-figure").forEach((n) => n.classList.toggle("active", n.dataset.step === String(i)));
      steps.querySelectorAll(".scrolly-step").forEach((n) => n.classList.toggle("active", n.dataset.step === String(i)));
    };
    setActive(0);
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(Number(visible.target.dataset.step));
    }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.3, 0.6, 1] });
    steps.querySelectorAll(".scrolly-step").forEach((n) => io.observe(n));
  }

  /* =====================================================================
     montagem
     ===================================================================== */

  function mount() {
    const cityHost = $("city-blocks");
    const backHost = $("backstage-blocks");
    if (cityHost) {
      const blocks = [landOwnerBlock(), drawItBlock(), microBlock(), landFlowBlock(), archiveCityBlock(), regimeBlock(), censusBlock(), householdsBlock(), prefectureBlock(), residentsBlock()].filter(Boolean);
      cityHost.innerHTML = blocks.map((b) => b.html).join("");
      blocks.forEach((b) => b.init && b.init());
      const lede = $("city-lede");
      if (lede) {
        lede.textContent = "Antes das casas, o chão. Esta seção usa o cadastro de solo, o censo e a pesquisa de habitação, todos lidos da planilha, para medir a cidade onde o corpus foi construído. Quando um bloco cruza a cidade com as casas do arquivo, a nota diz, e cada nota termina com a aba de onde o dado saiu.";
      }
    }
    if (backHost) {
      const blocks = [normsBlock()];
      backHost.innerHTML = blocks.map((b) => b.html).join("");
      blocks.forEach((b) => b.init && b.init());
    }
    scrollyFindings();
  }

  mount();
})();
