/* Motor de desenho em escala.
   Tudo aqui recebe metros e devolve SVG. Nenhuma coordenada é escolhida à mão:
   uma inclinação de 1:1,25 sai 1:1,25 no papel, 5 m sai 5 m, e um lote de
   29,28 m² sai com a proporção que tem. Toda figura carrega escala gráfica. */

window.NekoDraw = (function () {
  "use strict";

  const esc = (v) => String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const nf = (v, d = 1) => new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: d, maximumFractionDigits: d,
  }).format(v);

  /* Cena: mapeia metros para pixels com escala uniforme nos dois eixos.
     origin "bottom" para cortes (y cresce para cima), "top" para plantas. */
  function scene(opts) {
    const w = opts.w, h = opts.h;
    const pad = Object.assign({ t: 26, r: 26, b: 34, l: 26 }, opts.pad || {});
    const sx = (w - pad.l - pad.r) / opts.mx;
    const sy = (h - pad.t - pad.b) / opts.my;
    const s = Math.min(sx, sy);
    const innerW = opts.mx * s, innerH = opts.my * s;
    const ox = pad.l + (w - pad.l - pad.r - innerW) / 2;
    const oy = opts.origin === "top"
      ? pad.t + (h - pad.t - pad.b - innerH) / 2
      : pad.t + (h - pad.t - pad.b - innerH) / 2 + innerH;
    return {
      w, h, s, ox, oy, mx: opts.mx, my: opts.my,
      X: (m) => ox + m * s,
      Y: (m) => (opts.origin === "top" ? oy + m * s : oy - m * s),
      L: (m) => m * s,
    };
  }

  /* Escala gráfica: barra alternada com o passo em metros anotado. */
  function scaleBar(sc, x0, y0, meters, label) {
    const step = meters / 2;
    const px = sc.L(step);
    const parts = [];
    parts.push(`<rect x="${x0}" y="${y0}" width="${px}" height="5" fill="#10264a"/>`);
    parts.push(`<rect x="${x0 + px}" y="${y0}" width="${px}" height="5" fill="#ffffff" stroke="#10264a" stroke-width="1"/>`);
    parts.push(`<text x="${x0}" y="${y0 + 17}" class="d-scale d-left">0</text>`);
    parts.push(`<text x="${x0 + px * 2}" y="${y0 + 17}" class="d-scale">${esc(label || nf(meters, 0) + " m")}</text>`);
    return parts.join("");
  }

  /* Cota horizontal ou vertical, com tiques e texto. */
  function dimH(sc, m0, m1, yPx, text, cls, below) {
    const a = sc.X(m0), b = sc.X(m1);
    return `<line x1="${a}" y1="${yPx}" x2="${b}" y2="${yPx}" class="d-dim" marker-start="url(#dimTick)" marker-end="url(#dimTick)"/>`
      + `<text x="${(a + b) / 2}" y="${yPx + (below ? 15 : -6)}" class="${cls || "d-dim-text"}">${esc(text)}</text>`;
  }

  function dimV(sc, m0, m1, xPx, text, cls, side) {
    const a = sc.Y(m0), b = sc.Y(m1);
    const right = side === "right";
    return `<line x1="${xPx}" y1="${a}" x2="${xPx}" y2="${b}" class="d-dim" marker-start="url(#dimTick)" marker-end="url(#dimTick)"/>`
      + `<text x="${xPx + (right ? 6 : -6)}" y="${(a + b) / 2 + 4}" class="${cls || "d-dim-text"} ${right ? "d-left" : "d-right"}">${esc(text)}</text>`;
  }

  /* ---------------------------------------------------------------------
     CORTE TRANSVERSAL AO LOTE
     Mostra via, recuo do art. 42 § 2, planos inclinados, altura absoluta e o
     envelope resultante, tudo na mesma escala. Eixo x: distância a partir do
     limite frontal do lote. Eixo y: altura.
     --------------------------------------------------------------------- */
  function section(r, opts) {
    const o = Object.assign({ w: 640, h: 320, showEnvelope: true, showNorth: true, showRoad: true, showAbsolute: true, caption: "corte" }, opts || {});
    const depth = r.netDepth;
    const roadShown = Math.min(r.roadEffective, 8);
    const mx = roadShown + depth + 2;
    // teto do desenho: um pouco acima do limite que governa, para as linhas não
    // dispararem para fora do que interessa
    const ceiling = r.absoluteHeight ? r.absoluteHeight * 1.18 : Math.max(r.heightMax * 1.28, 7);
    const sc = scene({ w: o.w, h: o.h, mx, my: ceiling, origin: "bottom", pad: { t: 28, r: 104, b: 64, l: 40 } });

    const xRoad0 = 0, xLot0 = roadShown, xLot1 = roadShown + depth;
    const out = [];
    const y0 = sc.Y(0);

    out.push(`<rect x="${sc.X(0) - 18}" y="${y0}" width="${sc.L(mx) + 36}" height="14" class="d-ground-fill"/>`);
    out.push(`<line x1="${sc.X(0) - 18}" y1="${y0}" x2="${sc.X(mx) + 18}" y2="${y0}" class="d-ground"/>`);

    if (o.showRoad) {
      out.push(`<rect x="${sc.X(xRoad0)}" y="${y0 - 3}" width="${sc.L(roadShown)}" height="3" class="d-road"/>`);
    }
    if (r.setbackApplies) {
      out.push(`<rect x="${sc.X(xLot0)}" y="${y0 - 6}" width="${sc.L(r.setbackDepth)}" height="6" class="d-lost"/>`);
    }

    if (o.showEnvelope) {
      const pts = [];
      const N = 80;
      for (let i = 0; i <= N; i += 1) {
        const d = (depth * i) / N;
        pts.push([sc.X(xLot0 + d), sc.Y(Math.max(0, r.heightAtDepth(d)))]);
      }
      const path = `M${sc.X(xLot0)},${y0} ` + pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + ` L${sc.X(xLot1)},${y0} Z`;
      out.push(`<path d="${path}" class="d-envelope"/>`);
    }

    // plano da via: interrompido no limite que governa, para não cruzar o outro plano
    const cap = r.absoluteHeight || ceiling;
    const roadReach = Math.min(mx, cap / r.zone.roadSlope);
    out.push(`<line x1="${sc.X(xRoad0)}" y1="${y0}" x2="${sc.X(xRoad0 + roadReach)}" y2="${sc.Y(roadReach * r.zone.roadSlope)}" class="d-limit"/>`);
    // rótulo antes de o plano entrar no lote, sobre fundo claro
    const rl = Math.min(roadShown * 0.60, roadReach * 0.62);
    const rlAng = -Math.atan(sc.L(r.zone.roadSlope) / sc.L(1)) * 180 / Math.PI;
    const rlx = sc.X(rl) - 4, rly = sc.Y(rl * r.zone.roadSlope) - 9;
    out.push(`<text x="${rlx}" y="${rly}" class="d-note-blue d-right" transform="rotate(${rlAng.toFixed(1)} ${rlx} ${rly})">道路斜線 1 : ${nf(r.zone.roadSlope, 2)}</text>`);

    if (o.showNorth && r.northSlant) {
      const ns = r.northSlant;
      const reach = Math.min(depth, Math.max(0, (cap - ns.start) / ns.slope));
      out.push(`<line x1="${sc.X(xLot1)}" y1="${y0}" x2="${sc.X(xLot1)}" y2="${sc.Y(ns.start)}" class="d-limit"/>`);
      out.push(`<line x1="${sc.X(xLot1)}" y1="${sc.Y(ns.start)}" x2="${sc.X(xLot1 - reach)}" y2="${sc.Y(ns.start + reach * ns.slope)}" class="d-limit"/>`);
      out.push(dimV(sc, 0, ns.start, sc.X(xLot1) + 16, `${nf(ns.start, 0)} m`, "d-note-blue", "right"));
      out.push(`<text x="${sc.X(xLot1) + 16}" y="${sc.Y(ns.start) - 10}" class="d-note-blue d-left">北側斜線 1 : ${nf(ns.slope, 2)}</text>`);
    }

    if (o.showAbsolute && r.absoluteHeight) {
      out.push(`<line x1="${sc.X(xLot0) - 10}" y1="${sc.Y(r.absoluteHeight)}" x2="${sc.X(xLot1) + 10}" y2="${sc.Y(r.absoluteHeight)}" class="d-limit-dash"/>`);
      out.push(`<text x="${sc.X(xLot0) + 4}" y="${sc.Y(r.absoluteHeight) - 8}" class="d-note-blue d-left">altura absoluta ${nf(r.absoluteHeight, 0)} m</text>`);
    }

    out.push(`<line x1="${sc.X(xLot0)}" y1="${y0 + 4}" x2="${sc.X(xLot0)}" y2="${sc.Y(ceiling * 0.96)}" class="d-axis-dash"/>`);
    out.push(`<line x1="${sc.X(xLot1)}" y1="${y0 + 4}" x2="${sc.X(xLot1)}" y2="${sc.Y(ceiling * 0.96)}" class="d-axis-dash"/>`);

    // cotas em duas linhas, para não se atropelarem
    out.push(dimH(sc, xRoad0, xLot0, y0 + 26, `via ${nf(r.roadRaw, 1)} m`, null, true));
    out.push(dimH(sc, xLot0, xLot1, y0 + 26, `lote útil ${nf(depth, 1)} m`));
    if (r.setbackApplies) {
      out.push(`<text x="${sc.X(xLot1)}" y="${y0 + 45}" class="d-note-alert d-right">cede ${nf(r.setbackDepth, 2)} m ao alargamento da via</text>`);
    }

    const floors = r.floorsEstimate;
    for (let i = 1; i <= floors; i += 1) {
      const yy = sc.Y(i * 2.9);
      if (yy > sc.Y(r.heightMax)) out.push(`<line x1="${sc.X(xLot0)}" y1="${yy}" x2="${sc.X(xLot1)}" y2="${yy}" class="d-floor"/>`);
    }
    if (floors > 0) {
      out.push(`<text x="${o.w - 14}" y="18" class="d-note d-right">envelope comporta ${floors} pavimentos a 2,9 m</text>`);
    }

    out.push(`<text x="14" y="18" class="d-note d-left">${esc(o.caption)}</text>`);
    out.push(scaleBar(sc, 14, o.h - 22, 4, "4 m"));
    return `<svg viewBox="0 0 ${o.w} ${o.h}" role="img" aria-label="${esc(o.aria || "Corte do lote com os planos normativos e o envelope resultante")}">${out.join("")}</svg>`;
  }

  /* ---------------------------------------------------------------------
     PLANTA DO LOTE
     Lote, faixa cedida, projeção máxima e vizinhos, na mesma escala.
     --------------------------------------------------------------------- */
  function plan(r, opts) {
    const o = Object.assign({ w: 340, h: 300, caption: "planta" }, opts || {});
    const front = r.front, depth = r.depth;
    const mx = front + 6, my = depth + 5;
    const sc = scene({ w: o.w, h: o.h, mx, my, origin: "top", pad: { t: 30, r: 26, b: 46, l: 36 } });
    const x0 = 3, y0 = 1.2;
    const out = [];

    // vizinhos laterais
    out.push(`<rect x="${sc.X(0)}" y="${sc.Y(y0)}" width="${sc.L(x0)}" height="${sc.L(depth)}" class="d-neighbour"/>`);
    out.push(`<rect x="${sc.X(x0 + front)}" y="${sc.Y(y0)}" width="${sc.L(3)}" height="${sc.L(depth)}" class="d-neighbour"/>`);

    // lote
    out.push(`<rect x="${sc.X(x0)}" y="${sc.Y(y0)}" width="${sc.L(front)}" height="${sc.L(depth)}" class="d-lot"/>`);

    // faixa cedida na frente
    if (r.setbackApplies) {
      out.push(`<rect x="${sc.X(x0)}" y="${sc.Y(y0 + depth - r.setbackDepth)}" width="${sc.L(front)}" height="${sc.L(r.setbackDepth)}" class="d-lost"/>`);
    }

    // via
    out.push(`<rect x="${sc.X(0)}" y="${sc.Y(y0 + depth)}" width="${sc.L(mx)}" height="${sc.L(Math.min(r.roadRaw, 4))}" class="d-road"/>`);
    out.push(`<text x="${sc.X(x0 + front / 2)}" y="${sc.Y(y0 + depth + Math.min(r.roadRaw, 4) / 2) + 4}" class="d-label">via ${nf(r.roadRaw, 1)} m</text>`);

    // projeção máxima, desenhada como retângulo de mesma proporção do lote útil
    const ratio = Math.sqrt(r.maxFootprint / (front * r.netDepth));
    const fw = front * ratio, fd = r.netDepth * ratio;
    out.push(`<rect x="${sc.X(x0 + (front - fw) / 2)}" y="${sc.Y(y0 + (r.netDepth - fd) / 2)}" width="${sc.L(fw)}" height="${sc.L(fd)}" class="d-built"/>`);
    out.push(`<text x="${sc.X(x0 + front / 2)}" y="${sc.Y(y0 + r.netDepth / 2) - 2}" class="d-label-inv">${nf(r.maxFootprint, 1)} m²</text>`);
    out.push(`<text x="${sc.X(x0 + front / 2)}" y="${sc.Y(y0 + r.netDepth / 2) + 13}" class="d-label-inv" style="font-size:9.5px;font-weight:400">projeção máxima</text>`);

    out.push(dimH(sc, x0, x0 + front, sc.Y(y0) - 12, `${nf(front, 1)} m`));
    out.push(dimV(sc, y0, y0 + depth, sc.X(0.4), `${nf(depth, 1)} m`));
    out.push(`<text x="14" y="18" class="d-note d-left">${esc(o.caption)}</text>`);
    out.push(`<text x="${o.w - 14}" y="18" class="d-note d-right">lote ${nf(r.grossArea, 1)} m²</text>`);
    out.push(scaleBar(sc, 14, o.h - 22, 4, "4 m"));
    return `<svg viewBox="0 0 ${o.w} ${o.h}" role="img" aria-label="${esc(o.aria || "Planta do lote com a projeção máxima admitida")}">${out.join("")}</svg>`;
  }

  /* ---------------------------------------------------------------------
     PLANTA DE PARCELA COM GEOMETRIA LIVRE
     Usada nas tipologias: recebe um polígono em metros e desenha na quadra.
     --------------------------------------------------------------------- */
  function parcel(opts) {
    const o = Object.assign({ w: 360, h: 300, caption: "planta", scaleMeters: 5 }, opts);
    const sc = scene({ w: o.w, h: o.h, mx: o.mx, my: o.my, origin: "top", pad: { t: 30, r: 26, b: 46, l: 26 } });
    const poly = (pts, cls) => `<polygon points="${pts.map((p) => `${sc.X(p[0]).toFixed(1)},${sc.Y(p[1]).toFixed(1)}`).join(" ")}" class="${cls}"/>`;
    const out = [];
    for (const shape of o.shapes) {
      if (shape.type === "poly") out.push(poly(shape.pts, shape.cls));
      else if (shape.type === "rect") {
        out.push(`<rect x="${sc.X(shape.x)}" y="${sc.Y(shape.y)}" width="${sc.L(shape.w)}" height="${sc.L(shape.h)}" class="${shape.cls}"/>`);
      } else if (shape.type === "text") {
        out.push(`<text x="${sc.X(shape.x)}" y="${sc.Y(shape.y)}" class="${shape.cls || "d-note"}">${esc(shape.text)}</text>`);
      } else if (shape.type === "dimH") {
        out.push(dimH(sc, shape.x0, shape.x1, sc.Y(shape.y), shape.text, null, shape.below));
      } else if (shape.type === "dimV") {
        out.push(dimV(sc, shape.y0, shape.y1, sc.X(shape.x), shape.text));
      } else if (shape.type === "line") {
        out.push(`<line x1="${sc.X(shape.x0)}" y1="${sc.Y(shape.y0)}" x2="${sc.X(shape.x1)}" y2="${sc.Y(shape.y1)}" class="${shape.cls}"/>`);
      }
    }
    out.push(`<text x="14" y="18" class="d-note d-left">${esc(o.caption)}</text>`);
    out.push(scaleBar(sc, sc.X(0), o.h - 16, o.scaleMeters, nf(o.scaleMeters, 0) + " m"));
    return `<svg viewBox="0 0 ${o.w} ${o.h}" role="img" aria-label="${esc(o.aria || o.caption)}">${out.join("")}</svg>`;
  }


  return { scene, section, plan, parcel, scaleBar, dimH, dimV, nf, esc };
})();
