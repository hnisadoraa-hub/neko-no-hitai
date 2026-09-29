/* Os quatro diagramas da bibliografia.

   Fonte: window.NEKO_BIBLIO, exportado da base do Notion. Cada ligação carrega
   a origem: citação conferida no PDF, ligação escrita no fichamento, mesma
   autoria, ou dois textos que citam um mesmo terceiro. Nenhuma aresta foi
   criada por semelhança de assunto. A matriz eixo por capítulo é proposta e
   está marcada como tal. */

(function () {
  "use strict";

  const A = window.NekoAtlas;
  const B = window.NEKO_BIBLIO;
  if (!A || !B) return;
  const $ = (id) => document.getElementById(id);
  const esc = A.escapeHtml;

  const byId = new Map(B.works.map((w) => [w.id, w]));
  const eixoById = new Map(B.eixos.map((e) => [e.key, e]));
  const YEAR_MIN = 1950, YEAR_MAX = 2026;
  const yearOf = (w) => (Number.isFinite(w.y) ? w.y : 2015);

  /* pares vindos de terceiros citados em comum */
  const sharedPairs = [];
  for (const group of B.shared) {
    for (let i = 0; i < group.works.length; i += 1) {
      for (let j = i + 1; j < group.works.length; j += 1) {
        sharedPairs.push({ s: group.works[i], t: group.works[j], kind: "comum", note: `citam ${group.ref}`, ref: group.ref });
      }
    }
  }
  const allLinks = [...B.links, ...sharedPairs].filter((l) => byId.has(l.s) && byId.has(l.t));

  /* pontes: obras que ligam o próprio eixo a dois ou mais eixos diferentes */
  const neighbours = new Map(B.works.map((w) => [w.id, new Set()]));
  for (const l of allLinks) {
    neighbours.get(l.s).add(l.t);
    neighbours.get(l.t).add(l.s);
  }
  const bridges = new Set();
  for (const w of B.works) {
    const others = new Set([...neighbours.get(w.id)].map((id) => byId.get(id).eixo).filter((e) => e !== w.eixo));
    if (others.size >= 2) bridges.add(w.id);
  }

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

  function workTip(w, extra) {
    const e = eixoById.get(w.eixo);
    return `<strong>${esc(w.a)}${w.y ? `, ${w.y}` : ""}</strong>${esc(w.t)}<br>
      <em style="color:${e.color}">${esc(e.label)}</em> · ${esc(w.type)}
      ${w.yNote ? `<br><span class="tip-flag">${esc(w.yNote)}</span>` : ""}
      ${bridges.has(w.id) ? '<br><span class="tip-flag">ponte entre eixos</span>' : ""}
      ${extra || ""}`;
  }

  /* =====================================================================
     1. Rede por eixo
     ===================================================================== */

  function network(panel) {
    const W = 1120, H = 780, cx = W / 2, cy = H / 2 - 6;
    const rIn = 120, rOut = 300;
    const groups = B.eixos.map((e) => ({ ...e, works: B.works.filter((w) => w.eixo === e.key).sort((a, b) => yearOf(a) - yearOf(b)) }))
      .filter((g) => g.works.length);
    const total = groups.reduce((s, g) => s + g.works.length, 0);
    const gap = 0.055;
    let angle = -Math.PI / 2;
    const pos = new Map();
    const arcs = [];
    for (const g of groups) {
      const span = (Math.PI * 2 - gap * groups.length) * (g.works.length / total);
      const start = angle;
      g.works.forEach((w, i) => {
        const a = start + (span * (i + 0.5)) / g.works.length;
        const r = rIn + ((yearOf(w) - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (rOut - rIn);
        pos.set(w.id, { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a, r });
      });
      const mid = start + span / 2;
      arcs.push({ g, start, end: start + span, mid });
      angle = start + span + gap;
    }

    const ringLabels = arcs.map(({ g, start, end, mid }) => {
      const r = rOut + 42;
      const x = cx + Math.cos(mid) * r, y = cy + Math.sin(mid) * r;
      const anchor = Math.cos(mid) > 0.25 ? "start" : Math.cos(mid) < -0.25 ? "end" : "middle";
      const arcPath = `M${cx + Math.cos(start) * (rOut + 18)},${cy + Math.sin(start) * (rOut + 18)} A${rOut + 18},${rOut + 18} 0 ${end - start > Math.PI ? 1 : 0} 1 ${cx + Math.cos(end) * (rOut + 18)},${cy + Math.sin(end) * (rOut + 18)}`;
      return `<path d="${arcPath}" class="eixo-arc" stroke="${g.color}"></path>
        <text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" class="eixo-label" fill="${g.color}">${esc(g.label)} · ${g.works.length}</text>`;
    }).join("");

    const edges = allLinks.map((l, i) => {
      const p1 = pos.get(l.s), p2 = pos.get(l.t);
      const k = 0.42;
      const qx = cx + (p1.x + p2.x - 2 * cx) * k, qy = cy + (p1.y + p2.y - 2 * cy) * k;
      const cross = byId.get(l.s).eixo !== byId.get(l.t).eixo;
      return `<path d="M${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}"
        class="bib-edge kind-${l.kind}${cross ? " cross" : ""}" data-edge="${i}" data-s="${esc(l.s)}" data-t="${esc(l.t)}"></path>`;
    }).join("");

    /* etiquetas das pontes: empurradas para não se sobreporem */
    const labelY = new Map();
    for (const side of ["right", "left"]) {
      const list = B.works.filter((w) => bridges.has(w.id))
        .map((w) => ({ w, p: pos.get(w.id) }))
        .filter(({ p }) => (Math.cos(p.a) > 0 ? "right" : "left") === side)
        .sort((a, b) => a.p.y - b.p.y);
      let lastY = -Infinity;
      for (const { w, p } of list) {
        const y = Math.max(p.y + 4, lastY + 14);
        labelY.set(w.id, y);
        lastY = y;
      }
    }

    const nodes = B.works.map((w) => {
      const p = pos.get(w.id);
      const e = eixoById.get(w.eixo);
      const isBridge = bridges.has(w.id);
      const right = Math.cos(p.a) > 0;
      const ly = labelY.get(w.id);
      return `<g class="bib-node${isBridge ? " bridge" : ""}" data-id="${esc(w.id)}" tabindex="0" role="button" aria-label="${esc(w.a)}, ${w.y || "sem ano"}">
        ${isBridge ? `<line x1="${(p.x + (right ? 8 : -8)).toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${(p.x + (right ? 11 : -11)).toFixed(1)}" y2="${(ly - 4).toFixed(1)}" class="bib-label-leader"></line>` : ""}
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isBridge ? 7.5 : 4.6}" fill="${e.color}"></circle>
        ${isBridge ? `<text x="${(p.x + (right ? 13 : -13)).toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${right ? "start" : "end"}" class="bib-node-label">${esc(w.a)}${w.y ? `, ${w.y}` : ""}</text>` : ""}
      </g>`;
    }).join("");

    panel.innerHTML = `
      <p class="panel-lede">Cada ponto é uma obra, posta no setor do seu eixo e afastada do centro conforme o ano: 1950 junto ao miolo, 2026 na borda. As linhas só existem quando há registro: citação conferida no PDF, ligação escrita no fichamento, mesma autoria, ou duas obras que citam o mesmo terceiro. As ${bridges.size} obras destacadas são as que amarram dois ou mais eixos diferentes.</p>
      <div class="bib-legend">${legendHtml()}</div>
      <div class="plot-wrap bib-wrap">
        <svg id="chart-biblio-network" viewBox="0 0 ${W} ${H}" role="img" aria-label="Rede das ${B.works.length} obras por eixo temático">
          <g class="bib-edges">${edges}</g>
          ${ringLabels}
          <g class="bib-nodes">${nodes}</g>
        </svg>
      </div>
      <div class="bib-detail" id="bib-detail"><p class="muted">Passe o cursor por um ponto para ver a obra e as ligações registradas.</p></div>`;

    const svg = panel.querySelector("svg");
    const detail = $("bib-detail");
    const focus = (id, on) => {
      svg.classList.toggle("focused", on);
      svg.querySelectorAll(".bib-edge").forEach((p) => {
        const hit = p.dataset.s === id || p.dataset.t === id;
        p.classList.toggle("on", on && hit);
        p.classList.toggle("off", on && !hit);
      });
      svg.querySelectorAll(".bib-node").forEach((n) => {
        const linked = n.dataset.id === id || (on && neighbours.get(id).has(n.dataset.id));
        n.classList.toggle("on", on && linked);
        n.classList.toggle("off", on && !linked);
      });
      if (!on) { detail.innerHTML = '<p class="muted">Passe o cursor por um ponto para ver a obra e as ligações registradas.</p>'; return; }
      const w = byId.get(id);
      const links = allLinks.filter((l) => l.s === id || l.t === id);
      detail.innerHTML = `
        <h4>${esc(w.a)}${w.y ? `, ${w.y}` : ""}</h4>
        <p class="bib-detail-title">${esc(w.t)}${w.ja ? ` <span class="ja">${esc(w.ja)}</span>` : ""}</p>
        <p class="bib-detail-meta"><span style="color:${eixoById.get(w.eixo).color}">${esc(eixoById.get(w.eixo).label)}</span> · ${esc(w.type)}${w.link ? ` · <a href="${esc(w.link)}" target="_blank" rel="noreferrer">abrir ↗</a>` : ""}</p>
        ${w.yNote ? `<p class="bib-flag">${esc(w.yNote)}</p>` : ""}
        ${w.note ? `<p class="bib-flag">${esc(w.note)}</p>` : ""}
        <ul class="bib-links">${links.map((l) => {
          const other = byId.get(l.s === id ? l.t : l.s);
          return `<li><span class="kind-dot kind-${l.kind}"></span><strong>${esc(other.a)}${other.y ? `, ${other.y}` : ""}</strong><span>${esc(B.kinds[l.kind].label)}${l.note ? `: ${esc(l.note)}` : ""}</span></li>`;
        }).join("") || "<li class=\"muted\">Nenhuma ligação registrada até agora.</li>"}</ul>`;
    };

    svg.querySelectorAll(".bib-node").forEach((node) => {
      const id = node.dataset.id;
      node.addEventListener("mouseenter", () => focus(id, true));
      node.addEventListener("mousemove", (e) => tip(e, workTip(byId.get(id))));
      node.addEventListener("mouseleave", () => { focus(id, false); hideTip(); });
      node.addEventListener("focus", () => focus(id, true));
      node.addEventListener("blur", () => focus(id, false));
    });
  }

  function legendHtml() {
    return Object.entries(B.kinds).map(([k, v]) =>
      `<span class="bib-legend-item"><i class="kind-dot kind-${k}"></i>${esc(v.label)}</span>`).join("");
  }

  /* =====================================================================
     2. Conversa no tempo, em arcos
     ===================================================================== */

  function arcs(panel) {
    const W = 980, H = 520, axisY = 268, m = { l: 40, r: 40 };
    const X = (y) => m.l + ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - m.l - m.r);
    const used = new Map();
    const pos = new Map();
    for (const w of B.works.slice().sort((a, b) => yearOf(a) - yearOf(b))) {
      const y = yearOf(w);
      const n = used.get(y) || 0;
      used.set(y, n + 1);
      pos.set(w.id, X(y) + (n ? (n % 2 ? 1 : -1) * Math.ceil(n / 2) * 5.5 : 0));
    }

    const direct = allLinks.filter((l) => l.kind !== "comum");
    const common = allLinks.filter((l) => l.kind === "comum");
    const arcPath = (l, up) => {
      const x1 = pos.get(l.s), x2 = pos.get(l.t);
      const r = Math.abs(x2 - x1) / 2;
      const sweep = up ? (x1 < x2 ? 1 : 0) : (x1 < x2 ? 0 : 1);
      const ry = Math.min(r, up ? axisY - 30 : H - axisY - 60);
      return `<path d="M${Math.min(x1, x2).toFixed(1)},${axisY} A${r.toFixed(1)},${ry.toFixed(1)} 0 0 ${x1 < x2 ? 1 : 1} ${Math.max(x1, x2).toFixed(1)},${axisY}"
        class="arc-line kind-${l.kind}${up ? " up" : " down"}" data-s="${esc(l.s)}" data-t="${esc(l.t)}"
        transform="${up ? "" : `rotate(180 ${((x1 + x2) / 2).toFixed(1)} ${axisY})`}"></path>`;
    };

    const dots = B.works.map((w) => {
      const e = eixoById.get(w.eixo);
      return `<circle cx="${pos.get(w.id).toFixed(1)}" cy="${axisY}" r="${bridges.has(w.id) ? 6 : 4}" fill="${e.color}"
        class="arc-dot${bridges.has(w.id) ? " bridge" : ""}" data-id="${esc(w.id)}" tabindex="0" role="button"
        aria-label="${esc(w.a)}, ${w.y || "sem ano"}"></circle>`;
    }).join("");

    const decades = [];
    for (let y = 1950; y <= 2020; y += 10) decades.push(y);
    const grid = decades.map((y) =>
      `<line x1="${X(y)}" x2="${X(y)}" y1="40" y2="${H - 40}" class="grid-line"></line>
       <text x="${X(y)}" y="${H - 22}" text-anchor="middle" class="axis-text">${y}</text>`).join("");

    panel.innerHTML = `
      <p class="panel-lede">A mesma bibliografia posta no tempo. Acima da linha, as conversas diretas: citação conferida no PDF, ligação escrita no fichamento, continuidade de autoria. Abaixo, as indiretas: duas obras que chamam o mesmo terceiro, como Nishiyama, Shinohara, Tange ou Taut. Evidência em cima, leitura em baixo.</p>
      <div class="bib-legend">${legendHtml()}</div>
      <div class="plot-wrap bib-wrap">
        <svg id="chart-biblio-arc" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ligações entre as obras, de 1950 a 2026">
          ${grid}
          <g class="arcs-up">${direct.map((l) => arcPath(l, true)).join("")}</g>
          <g class="arcs-down">${common.map((l) => arcPath(l, false)).join("")}</g>
          <line x1="${m.l}" x2="${W - m.r}" y1="${axisY}" y2="${axisY}" class="axis-line"></line>
          <text x="${m.l}" y="${axisY - 210}" class="axis-text">conversa registrada</text>
          <text x="${m.l}" y="${axisY + 200}" class="axis-text">terceiro citado em comum</text>
          <g class="arc-dots">${dots}</g>
        </svg>
      </div>
      <div class="bib-detail" id="arc-detail"><p class="muted">Passe o cursor por um ponto para acender as ligações daquela obra.</p></div>`;

    const svg = panel.querySelector("svg");
    const detail = $("arc-detail");
    svg.querySelectorAll(".arc-dot").forEach((dot) => {
      const id = dot.dataset.id;
      const set = (on) => {
        svg.classList.toggle("focused", on);
        svg.querySelectorAll(".arc-line").forEach((p) => {
          const hit = p.dataset.s === id || p.dataset.t === id;
          p.classList.toggle("on", on && hit);
          p.classList.toggle("off", on && !hit);
        });
        if (!on) { detail.innerHTML = '<p class="muted">Passe o cursor por um ponto para acender as ligações daquela obra.</p>'; return; }
        const w = byId.get(id);
        const links = allLinks.filter((l) => l.s === id || l.t === id);
        detail.innerHTML = `<h4>${esc(w.a)}${w.y ? `, ${w.y}` : ""}</h4>
          <p class="bib-detail-title">${esc(w.t)}</p>
          <ul class="bib-links">${links.map((l) => {
            const other = byId.get(l.s === id ? l.t : l.s);
            return `<li><span class="kind-dot kind-${l.kind}"></span><strong>${esc(other.a)}${other.y ? `, ${other.y}` : ""}</strong><span>${esc(l.note || B.kinds[l.kind].label)}</span></li>`;
          }).join("") || '<li class="muted">Sem ligação registrada.</li>'}</ul>`;
      };
      dot.addEventListener("mouseenter", () => set(true));
      dot.addEventListener("mousemove", (e) => tip(e, workTip(byId.get(id))));
      dot.addEventListener("mouseleave", () => { set(false); hideTip(); });
      dot.addEventListener("focus", () => set(true));
      dot.addEventListener("blur", () => set(false));
    });
  }

  /* =====================================================================
     3. Linha do tempo por eixo
     ===================================================================== */

  function timeline(panel) {
    const rows = B.eixos.map((e) => ({ ...e, works: B.works.filter((w) => w.eixo === e.key).sort((a, b) => yearOf(a) - yearOf(b)) }))
      .filter((r) => r.works.length);
    const W = 960, rowH = 58, H = 60 + rows.length * rowH, m = { l: 170, r: 30, t: 40 };
    const X = (y) => m.l + ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - m.l - m.r);
    const decades = [];
    for (let y = 1950; y <= 2020; y += 10) decades.push(y);

    const body = rows.map((r, i) => {
      const y0 = m.t + i * rowH;
      const used = new Map();
      const dots = r.works.map((w) => {
        const year = yearOf(w);
        const n = used.get(year) || 0;
        used.set(year, n + 1);
        const x = X(year) + (n ? (n % 2 ? 1 : -1) * Math.ceil(n / 2) * 7 : 0);
        return `<circle cx="${x.toFixed(1)}" cy="${y0 + 26}" r="${bridges.has(w.id) ? 7 : 5}" fill="${r.color}"
          class="tl-dot${bridges.has(w.id) ? " bridge" : ""}" data-id="${esc(w.id)}" tabindex="0" role="button"
          aria-label="${esc(w.a)}, ${w.y || "sem ano"}, ${esc(r.label)}"></circle>`;
      }).join("");
      const first = r.works[0], last = r.works[r.works.length - 1];
      return `<g class="tl-row">
        <text x="${m.l - 14}" y="${y0 + 24}" text-anchor="end" class="tl-label" fill="${r.color}">${esc(r.label)}</text>
        <text x="${m.l - 14}" y="${y0 + 40}" text-anchor="end" class="tl-sub">${r.works.length} obras · ${first.y || "s.d."} a ${last.y || "s.d."}</text>
        <line x1="${m.l}" x2="${W - m.r}" y1="${y0 + 26}" y2="${y0 + 26}" class="tl-axis"></line>
        ${dots}
      </g>`;
    }).join("");

    panel.innerHTML = `
      <p class="panel-lede">Cada linha é um eixo, cada ponto é uma obra no ano da edição consultada. Traduções aparecem no ano da edição em mãos, não no do original: Teige é de 1932 e entra em 2002. Obra sem ano confirmado fica marcada na ficha.</p>
      <div class="plot-wrap bib-wrap">
        <svg id="chart-biblio-timeline" viewBox="0 0 ${W} ${H}" role="img" aria-label="Linha do tempo das obras por eixo, de 1950 a 2026">
          ${decades.map((y) => `<line x1="${X(y)}" x2="${X(y)}" y1="${m.t - 12}" y2="${H - 28}" class="grid-line"></line>
            <text x="${X(y)}" y="${m.t - 20}" text-anchor="middle" class="axis-text">${y}</text>`).join("")}
          ${body}
        </svg>
      </div>`;

    panel.querySelectorAll(".tl-dot").forEach((dot) => {
      const w = byId.get(dot.dataset.id);
      dot.addEventListener("mousemove", (e) => tip(e, workTip(w)));
      dot.addEventListener("focus", () => {
        const r = dot.getBoundingClientRect();
        tip({ clientX: r.left + r.width / 2, clientY: r.top }, workTip(w));
      });
      dot.addEventListener("mouseleave", hideTip);
      dot.addEventListener("blur", hideTip);
    });
  }

  /* =====================================================================
     4. Matriz eixo × capítulo
     ===================================================================== */

  function matrix(panel) {
    const counts = {};
    for (const w of B.works) counts[w.eixo] = (counts[w.eixo] || 0) + 1;
    const head = `<tr><th scope="col" class="corner">eixo</th>${B.chapters.map((c) =>
      `<th scope="col" title="${esc(c.label)}"><span class="chap-n">${c.n}</span></th>`).join("")}<th scope="col">obras</th></tr>`;
    const rows = B.eixos.filter((e) => counts[e.key]).map((e) => {
      const row = B.matrix[e.key] || {};
      return `<tr><th scope="row"><span class="dot" style="background:${e.color}"></span>${esc(e.label)}</th>
        ${B.chapters.map((c) => {
          const v = row[c.key] || 0;
          return `<td class="mx ${v === 2 ? "base" : v === 1 ? "apoio" : "none"}" data-eixo="${e.key}" data-chap="${c.key}"
            tabindex="${v ? 0 : -1}" title="${esc(e.label)} no capítulo ${c.n}: ${v === 2 ? "base" : v === 1 ? "apoio" : "não entra"}">
            ${v ? `<span class="mx-mark" style="background:${e.color};opacity:${v === 2 ? 1 : 0.45}"></span>` : ""}</td>`;
        }).join("")}
        <td class="mx-count">${counts[e.key]}</td></tr>`;
    }).join("");

    panel.innerHTML = `
      <p class="panel-lede">Proposta de onde cada eixo entra no sumário, para ser corrigida: círculo cheio é capítulo que se apoia naquele eixo, círculo claro é entrada de apoio. A coluna da direita traz quantas obras o eixo reúne hoje. Esta é a única figura do atlas que não sai da base: é sugestão, e por isso pode ser editada aqui.</p>
      <div class="matrix-tools">
        <button type="button" class="chip-button" id="matrix-edit" aria-pressed="false">Editar a matriz</button>
        <button type="button" class="quiet-button" id="matrix-export" hidden>Baixar as correções · JSON</button>
        <button type="button" class="quiet-button" id="matrix-reset" hidden>Voltar à proposta</button>
        <span class="matrix-hint" id="matrix-hint">Clique numa célula para ver as obras do eixo.</span>
      </div>
      <div class="table-scroll">
        <table class="matrix-table" id="chart-biblio-matrix">
          <thead>${head}</thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <ol class="chapter-key">${B.chapters.map((c) => `<li><span>${c.n}</span>${esc(c.label)}</li>`).join("")}</ol>
      <div class="bib-detail" id="matrix-detail"><p class="muted">Clique numa célula para ver as obras daquele eixo.</p></div>`;

    const detail = $("matrix-detail");

    /* edição local: a proposta é dela, não minha. O que for corrigido aqui
       fica no navegador e sai em JSON, para voltar ao Notion.            */
    const OVERRIDE_KEY = "neko-matrix-override";
    let overrides = {};
    try { overrides = JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "{}"); } catch (e) { overrides = {}; }
    let editing = false;

    const valueOf = (eixo, chap) => {
      const k = `${eixo}|${chap}`;
      return Object.prototype.hasOwnProperty.call(overrides, k) ? overrides[k] : ((B.matrix[eixo] || {})[chap] || 0);
    };
    const paintCell = (cell) => {
      const eixo = cell.dataset.eixo, chap = cell.dataset.chap;
      const v = valueOf(eixo, chap);
      const e = eixoById.get(eixo);
      cell.className = `mx ${v === 2 ? "base" : v === 1 ? "apoio" : "none"}${Object.prototype.hasOwnProperty.call(overrides, `${eixo}|${chap}`) ? " edited" : ""}`;
      cell.tabIndex = editing || v ? 0 : -1;
      cell.innerHTML = v ? `<span class="mx-mark" style="background:${e.color};opacity:${v === 2 ? 1 : 0.45}"></span>` : "";
    };
    const repaint = () => panel.querySelectorAll("td.mx").forEach(paintCell);
    const persist = () => { try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides)); } catch (e) { /* sem storage */ } };

    const editBtn = $("matrix-edit"), exportBtn = $("matrix-export"), resetBtn = $("matrix-reset"), hint = $("matrix-hint");
    const setMode = (on) => {
      editing = on;
      editBtn.setAttribute("aria-pressed", String(on));
      editBtn.textContent = on ? "Parar de editar" : "Editar a matriz";
      exportBtn.hidden = !on;
      resetBtn.hidden = !on;
      hint.textContent = on
        ? "Cada clique gira a célula: vazia, apoio, base. As correções ficam neste navegador e saem em JSON."
        : "Clique numa célula para ver as obras do eixo.";
      repaint();
    };
    editBtn.addEventListener("click", () => setMode(!editing));
    resetBtn.addEventListener("click", () => { overrides = {}; persist(); repaint(); });
    exportBtn.addEventListener("click", () => {
      const full = {};
      B.eixos.forEach((e) => {
        full[e.key] = {};
        B.chapters.forEach((c) => { const v = valueOf(e.key, c.key); if (v) full[e.key][c.key] = v; });
      });
      const blob = new Blob([JSON.stringify({ gerado: new Date().toISOString(), matriz: full }, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "neko-matriz-eixo-capitulo.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });

    panel.querySelectorAll("td.mx").forEach((cell) => {
      const open = () => {
        if (editing) {
          const k = `${cell.dataset.eixo}|${cell.dataset.chap}`;
          overrides[k] = (valueOf(cell.dataset.eixo, cell.dataset.chap) + 1) % 3;
          persist();
          paintCell(cell);
          return;
        }
        const eixo = cell.dataset.eixo, chap = cell.dataset.chap;
        const e = eixoById.get(eixo);
        const c = B.chapters.find((x) => x.key === chap);
        const works = B.works.filter((w) => w.eixo === eixo).sort((a, b) => yearOf(a) - yearOf(b));
        const weight = valueOf(eixo, chap);
        detail.innerHTML = `<h4>${esc(e.label)} no capítulo ${c.n}</h4>
          <p class="bib-detail-meta">${weight === 2 ? "capítulo que se apoia neste eixo" : weight === 1 ? "entrada de apoio" : "não previsto"} · ${esc(c.label)}</p>
          <ul class="bib-works">${works.map((w) => `<li><strong>${esc(w.a)}${w.y ? `, ${w.y}` : ""}</strong> ${esc(w.t)}</li>`).join("")}</ul>`;
      };
      cell.addEventListener("click", open);
      cell.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open(); } });
    });
    repaint();
  }


  /* =====================================================================
     montagem
     ===================================================================== */

  function mount() {
    const lede = $("biblio-lede");
    if (lede) {
      lede.textContent = `As ${B.nodes} obras da bibliografia, por eixo, no tempo e nas ligações que estão escritas em algum lugar, no PDF ou no fichamento. ${bridges.size} delas funcionam como ponte entre eixos diferentes.`;
    }
    const rule = $("biblio-rule");
    if (rule) rule.textContent = `${B.nodes} obras · ${B.eixos.length} eixos · ${allLinks.length} ligações`;

    const panels = {
      "panel-rede": network,
      "panel-conversa": arcs,
      "panel-linha": timeline,
      "panel-matriz": matrix,
    };
    const drawn = new Set();
    const draw = (id) => {
      if (drawn.has(id)) return;
      const panel = $(id);
      if (!panel) return;
      panels[id](panel);
      drawn.add(id);
    };
    draw("panel-rede");
    const group = document.querySelector('[data-tabs="biblio"]');
    if (group) {
      group.addEventListener("tabchange", (e) => {
        const tabId = e.detail.id;
        const map = { "tab-rede": "panel-rede", "tab-conversa": "panel-conversa", "tab-linha": "panel-linha", "tab-matriz": "panel-matriz" };
        draw(map[tabId]);
      });
    }
    /* o modo apresentação usa os arcos: desenha assim que a página assenta */
    window.addEventListener("load", () => { draw("panel-conversa"); draw("panel-linha"); draw("panel-matriz"); });
  }

  mount();
})();
