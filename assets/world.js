/* O arquivo inteiro, em escala, navegável e habitado.

   As fichas que registram pavimentos enfileiradas numa única elevação
   contínua que se arrasta e se aproxima. Afastado, o corpus vira silhueta;
   aproximado, cada casa se lê; bem de perto, a fachada abre e o corte fica
   à vista, com gente e gato dentro.

   O que vem do dado: largura (raiz da área de implantação), altura (3 m por
   pavimento), número de lajes e tom (parcela do lote coberta). O que é
   convenção de desenho: tudo que aparece dentro da casa. O interior é
   ornamento declarado, sorteado com semente fixa a partir do id da ficha, e
   não descreve obra nenhuma. O botão "só o medido" apaga o interior inteiro.

   Referência de formato: floor796, de Pavel Sannikau (floor796.com). O
   desenho daqui é original: nada de lá foi copiado.                        */

(function () {
  "use strict";

  const A = window.NekoAtlas;
  if (!A) return;
  const $ = (id) => document.getElementById(id);
  const fmt = A.fmt;
  const esc = A.escapeHtml;
  const seeded = (window.NekoCat && window.NekoCat.seeded) || function (key) {
    let h = 2166136261;
    const s = String(key || "neko");
    for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };

  const NS = "http://www.w3.org/2000/svg";
  const INK = "#10264a";
  const ROOM = "#fdfaf3";           /* o vazio do cômodo */
  const FURN = "#d8c2a6";           /* móvel */
  const FURN2 = "#b99a78";          /* móvel, tom fundo */
  const CLAY = "#cbb08f";           /* vaso, tatame */
  const LEAF = "#8c9a86";           /* folha, sem verde na paleta */
  const SKIN = ["#c0685c", "#3a6b97", "#c2924e", "#b5767f", "#5c7a99", "#a85f4e"];

  const PX = 10;                    /* pixels de mundo por metro */
  const FLOOR_M = 3;
  const GAP_M = 1.2;
  const STAGE_H = 320;
  const GROUND_Y = 250;             /* onde o chão fica dentro do palco */
  const TINTS = ["#eef2f7", "#dce5ee", "#c6d3e2", "#aec0d5", "#93aac6"];
  const K_MIN = 0.05, K_MAX = 3.2;
  const MID_K = 0.42;               /* silhueta vira fachada medida */
  const DETAIL_K = 1.15;            /* fachada medida abre em corte */
  const MAX_LIFE = 34;              /* teto de casas desenhadas por dentro */
  const GUTTER = 54;                /* faixa da esquerda, onde mora o eixo */
  const FLOOR_PAD = 34;             /* respiro abaixo do chão */

  let cam = { x: 0, y: 0, k: 0.55 };
  let items = [];
  let byId = new Map();
  let worldW = 0, maxH = 0;
  let sortKey = "lot";
  let stageW = 1000;
  let highlight = null;
  let lastLevel = null;
  let lifeOn = true;
  let modo = "elevacao";
  const liveNodes = new Map();

  const n = (v) => Number(v.toFixed(1));

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

  /* ---------------------------------------------------------------
     montar o mundo
     --------------------------------------------------------------- */

  function tintOf(h) {
    if (!Number.isFinite(h.bcr)) return "#eef0f2";
    const t = Math.max(0, Math.min(0.999, (h.bcr - 0.3) / 0.6));
    return TINTS[Math.floor(t * TINTS.length)];
  }

  function worldPool() {
    return A.houses.filter((h) => Number.isFinite(h.footprintArea) && h.footprintArea > 0
      && Number.isFinite(h.floors) && h.floors > 0);
  }

  function build() {
    const pool = worldPool();
    const sorted = pool.slice().sort((a, b) => {
      if (sortKey === "floors") return (b.floors || 0) - (a.floors || 0) || a.lotArea - b.lotArea;
      if (sortKey === "year") return a.year - b.year;
      if (sortKey === "ward") return a.ward.localeCompare(b.ward) || a.lotArea - b.lotArea;
      return a.lotArea - b.lotArea;
    });

    let x = GAP_M;
    const maq = modo === "maquete";
    items = sorted.map((h, i) => {
      const lado = Math.sqrt(h.lotArea);
      /* na maquete a peça ocupa a largura isométrica do lote, e sobe a
         altura do prédio mais a profundidade do próprio lote */
      const w = maq ? lado * ISO_W : Math.sqrt(h.footprintArea);
      const hh = h.floors * FLOOR_M + (maq ? lado + 2.6 : 0);
      const it = { h, i, x, w, hh, tint: tintOf(h) };
      x += w + GAP_M;
      return it;
    });
    byId = new Map(items.map((it) => [it.h.id, it]));
    worldW = x;
    maxH = Math.max(FLOOR_M * 2, ...items.map((i) => i.hh));
  }

  /* ---------------------------------------------------------------
     geometria comum às duas leituras da casa
     --------------------------------------------------------------- */

  function geom(it) {
    const w = it.w * PX, hh = it.hh * PX, x = it.x * PX;
    const parapet = Math.min(6, Math.max(2.6, w * 0.09));
    const body = hh - parapet;
    const floors = it.h.floors;
    return { x, w, hh, parapet, body, floors, floorH: body / floors };
  }

  /* ---------------------------------------------------------------
     Maquete: o volume em degraus, em isometria, pousado no próprio lote.

     O que vem da ficha, sem exceção: a área do lote, que vira a base; a
     área de implantação, que vira o térreo; a área construída, que reparte
     os pavimentos de cima; e o número de pavimentos, a 3 m cada.

     O térreo recebe a implantação registrada e o que sobra da área
     construída se reparte igualmente pelos pavimentos de cima, limitado ao
     tamanho do térreo. Assim o volume fecha ao mesmo tempo com os dois
     campos de área, em vez de supor pavimentos iguais.

     Convenções declaradas, porque a base não registra: lote e implantação
     desenhados como quadrados, já que a planilha guarda área e não frente
     e profundidade; casa centrada no lote, já que não há recuo registrado;
     o telhado, que é ornamento pousado acima do volume medido e não entra em medida nenhuma; e as aberturas por regra fixa. O chão que sobra ao
     redor da casa é a parcela do lote que a edificação não cobre, e essa
     sim é medida.
     --------------------------------------------------------------- */

  const COS30 = Math.cos(Math.PI / 6);
  const SIN30 = 0.5;
  const ISO_W = 2 * COS30;          /* largura isométrica de um lado unitário */

  /* (x, y) no plano do lote, z para cima, tudo em metros a partir do centro */
  function iso(x, y, z) {
    return [(x - y) * COS30 * PX, ((x + y) * SIN30 - z) * PX];
  }
  const pt = ([x, y]) => `${n(x)},${n(y)}`;

  /* caixa isométrica: devolve as três faces visíveis, do fundo para a frente */
  function caixa(s, z0, z1, cores, extra) {
    const h = s / 2;
    const A = iso(-h, -h, z1), B = iso(h, -h, z1), C = iso(h, h, z1), D = iso(-h, h, z1);
    const Bb = iso(h, -h, z0), Cb = iso(h, h, z0), Db = iso(-h, h, z0);
    return `<polygon points="${pt(A)} ${pt(B)} ${pt(C)} ${pt(D)}" fill="${cores.topo}" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"></polygon>
      <polygon points="${pt(D)} ${pt(C)} ${pt(Cb)} ${pt(Db)}" fill="${cores.esq}" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"></polygon>
      <polygon points="${pt(C)} ${pt(B)} ${pt(Bb)} ${pt(Cb)}" fill="${cores.dir}" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"></polygon>
      ${extra || ""}`;
  }

  function massa(h) {
    const fp = h.footprintArea;
    const F = h.floors;
    const plates = [fp];
    if (F > 1) {
      const temB = Number.isFinite(h.builtArea) && h.builtArea > 0;
      const rest = temB ? Math.max(0, h.builtArea - fp) : fp * (F - 1);
      const per = Math.min(fp, Math.max(fp * 0.24, rest / (F - 1)));
      for (let i = 1; i < F; i += 1) plates.push(per);
    }
    return plates;
  }

  function mistura(hex, alvo, t) {
    const p = (i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    const q = (i) => parseInt(alvo.slice(1 + i * 2, 3 + i * 2), 16);
    const v = (i) => Math.round(p(i) + (q(i) - p(i)) * t).toString(16).padStart(2, "0");
    return `#${v(0)}${v(1)}${v(2)}`;
  }

  /* aberturas nas duas faces visíveis, pela mesma regra fixa da elevação */
  function aberturas(s, z0, z1, cor, pulaEsq) {
    const h = s / 2;
    const cols = Math.max(1, Math.round((s * PX) / 34));
    const out = [];
    for (let c = 0; c < cols; c += 1) {
      const t0 = -h + (s * (c + 0.32)) / cols;
      const t1 = -h + (s * (c + 0.68)) / cols;
      const a0 = z0 + (z1 - z0) * 0.32, a1 = z0 + (z1 - z0) * 0.66;
      if ((t1 - t0) * PX < 3.2) continue;
      /* face esquerda, a que olha para baixo e para a esquerda; no térreo
         a primeira faixa fica livre para a porta */
      if (!(pulaEsq && c === 0)) out.push(`<polygon points="${pt(iso(t0, h, a1))} ${pt(iso(t1, h, a1))} ${pt(iso(t1, h, a0))} ${pt(iso(t0, h, a0))}" fill="${cor}" stroke="${INK}" stroke-width=".55"></polygon>`);
      /* face direita */
      out.push(`<polygon points="${pt(iso(h, t0, a1))} ${pt(iso(h, t1, a1))} ${pt(iso(h, t1, a0))} ${pt(iso(h, t0, a0))}" fill="${cor}" stroke="${INK}" stroke-width=".55" opacity=".85"></polygon>`);
      /* cruzeta, se a janela comporta */
      if ((t1 - t0) * PX > 5.4) {
        const tm = (t0 + t1) / 2, am = (a0 + a1) / 2;
        const linha = (p, q) => `<line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(q[0])}" y2="${n(q[1])}" stroke="${INK}" stroke-width=".4" opacity=".75"></line>`;
        if (!(pulaEsq && c === 0)) out.push(linha(iso(tm, h, a0), iso(tm, h, a1)) + linha(iso(t0, h, am), iso(t1, h, am)));
        out.push(linha(iso(h, tm, a0), iso(h, tm, a1)) + linha(iso(h, t0, am), iso(h, t1, am)));
      }
    }
    return out.join("");
  }


  /* Telhado: ornamento declarado, pousado ACIMA do volume medido.
     A linha do topo do volume continua marcando a altura que vem da ficha,
     3 m por pavimento; o telhado é um chapéu por cima dela e não entra em
     medida nenhuma. Forma, inclinação e telha são convenção de desenho,
     porque a planilha não registra cobertura. */
  function telhado(s, z, tom) {
    const h = s / 2, ov = Math.min(0.45, s * 0.1);      /* beiral */
    const e = h + ov;
    const rh = Math.min(2, s * 0.34);                    /* altura do caimento */
    const A = iso(-e, 0, z + rh), B = iso(e, 0, z + rh);
    const P2 = iso(e, -e, z), P3 = iso(e, e, z), P4 = iso(-e, e, z);
    const telha = mistura(tom, "#31507a", 0.62);
    const telhaClara = mistura(telha, "#dfe9f3", 0.34);
    const out = [];
    /* água da frente */
    out.push(`<polygon points="${pt(A)} ${pt(P4)} ${pt(P3)} ${pt(B)}" fill="${telha}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"></polygon>`);
    /* fiadas de escama: cada curso é uma sequência de arcos */
    for (let c = 1; c <= 3; c += 1) {
      const t = c / 4;
      const y0 = e - t * e, zz = z + rh * t;
      const passos = Math.max(4, Math.round(s * 1.1));
      const d = [];
      for (let i = 0; i < passos; i += 1) {
        const x0 = -e + (2 * e * i) / passos;
        const x1 = -e + (2 * e * (i + 1)) / passos;
        const a = iso(x0, y0, zz), b = iso(x1, y0, zz);
        const rx = Math.abs(b[0] - a[0]) / 2;
        if (rx < 1.1) continue;
        d.push(`M${pt(a)} A${n(rx)},${n(rx / 2.4)} 0 0 0 ${pt(b)}`);
      }
      if (d.length) out.push(`<path d="${d.join(" ")}" fill="none" stroke="${telhaClara}" stroke-width=".85" stroke-linecap="round"></path>`);
    }
    /* empena direita, o triângulo que aparece de lado */
    out.push(`<polygon points="${pt(B)} ${pt(P2)} ${pt(P3)}" fill="${mistura(telha, "#16294a", 0.32)}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"></polygon>`);
    /* cumeeira */
    out.push(`<line x1="${n(A[0])}" y1="${n(A[1])}" x2="${n(B[0])}" y2="${n(B[1])}" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"></line>`);
    /* chaminé */
    const cs = Math.min(0.75, s * 0.14);
    const cz = z + rh * 0.55;
    const cx0 = e * 0.42;
    const C1 = iso(cx0 - cs, cs, cz + 1.5), C2 = iso(cx0 + cs, cs, cz + 1.5);
    const C3 = iso(cx0 + cs, -cs, cz + 1.5), C4 = iso(cx0 - cs, -cs, cz + 1.5);
    const D1 = iso(cx0 - cs, cs, cz), D2 = iso(cx0 + cs, cs, cz);
    out.push(`<polygon points="${pt(C4)} ${pt(C3)} ${pt(C2)} ${pt(C1)}" fill="${telhaClara}" stroke="${INK}" stroke-width=".8"></polygon>`);
    out.push(`<polygon points="${pt(C1)} ${pt(C2)} ${pt(D2)} ${pt(D1)}" fill="${mistura(telha, "#16294a", 0.22)}" stroke="${INK}" stroke-width=".8"></polygon>`);
    return out.join("");
  }

  function maquete(it, level) {
    const h = it.h;
    const cls = `world-house${highlight === h.id ? " on" : ""}`;
    const L = Math.sqrt(h.lotArea);                 /* lado do lote, em metros */
    const plates = massa(h);
    const cores = {
      topo: mistura(it.tint, "#ffffff", 0.56),
      esq: it.tint,
      dir: mistura(it.tint, "#10264a", 0.32),
    };
    const chao = { topo: "#eef1f4", esq: "#dde3ea", dir: "#c8d1db" };
    const out = [];

    /* o lote: base rasa de 30 cm, com a casa pousada em cima */
    out.push(caixa(L, -0.5, 0, chao));
    if (level > 0) {
      const g = L / 2;
      out.push(`<polygon points="${pt(iso(-g, -g, 0))} ${pt(iso(g, -g, 0))} ${pt(iso(g, g, 0))} ${pt(iso(-g, g, 0))}" fill="url(#neko-dots)" opacity=".5"></polygon>`);
    }

    if (level === 0) {
      const a = Math.sqrt(h.footprintArea);
      out.push(caixa(a, 0, h.floors * FLOOR_M, cores));
    } else {
      /* sombra no chão, para a peça assentar */
      const a0 = Math.sqrt(plates[0]) / 2;
      out.push(`<polygon points="${pt(iso(-a0 + 0.35, -a0 + 0.35, 0))} ${pt(iso(a0 + 0.35, -a0 + 0.35, 0))} ${pt(iso(a0 + 0.35, a0 + 0.35, 0))} ${pt(iso(-a0 + 0.35, a0 + 0.35, 0))}" fill="${INK}" opacity=".13"></polygon>`);
      plates.forEach((area, Lv) => {
        const s = Math.sqrt(area);
        const z0 = Lv * FLOOR_M, z1 = z0 + FLOOR_M;
        let extra = level === 2 && s * PX > 20 ? aberturas(s, z0, z1, "#f6f9fc", Lv === 0) : "";
        if (Lv === 0 && level === 2 && s * PX > 16) {
          const hh2 = s / 2, d0 = -hh2 + s * 0.13, d1 = -hh2 + s * 0.37;
          const q1 = iso(d0, hh2, z0), q2 = iso(d0, hh2, z0 + 1.5);
          const q3 = iso((d0 + d1) / 2, hh2, z0 + 2.4), q4 = iso(d1, hh2, z0 + 1.5), q5 = iso(d1, hh2, z0);
          extra += `<path d="M${pt(q1)} L${pt(q2)} Q${pt(q3)} ${pt(q4)} L${pt(q5)} Z" fill="#f4f7fa" stroke="${INK}" stroke-width=".8"></path>`;
        }
        if (level === 2) {
          const g2 = s / 2;
          extra += `<polygon points="${pt(iso(-g2, g2, z1))} ${pt(iso(g2, g2, z1))} ${pt(iso(g2, g2, z0))} ${pt(iso(-g2, g2, z0))}" fill="url(#neko-hatch)" opacity=".18"></polygon>`;
        }
        out.push(caixa(s, z0, z1, cores, extra));
      });
      /* a linha do topo do volume, que é a altura medida, e o telhado por cima */
      const topS = Math.sqrt(plates[plates.length - 1]);
      const top = topS / 2;
      const zt = plates.length * FLOOR_M;
      out.push(`<polygon points="${pt(iso(-top, -top, zt))} ${pt(iso(top, -top, zt))} ${pt(iso(top, top, zt))} ${pt(iso(-top, top, zt))}" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"></polygon>`);
      out.push(telhado(topS, zt, it.tint));
    }

    /* alvo de mouse: retângulo que cobre a peça inteira */
    const w = L * ISO_W * PX;
    const alturaTotal = (h.floors * FLOOR_M + L) * PX + 16;
    out.push(`<rect x="${n(-w / 2)}" y="${n(-alturaTotal + L * SIN30 * PX)}" width="${n(w)}" height="${n(alturaTotal)}" fill="transparent"></rect>`);

    /* a peça é desenhada em torno do centro do lote; o canto de frente
       encosta na linha do chão da fileira */
    return `<g class="${cls}" data-id="${esc(h.id)}" transform="translate(${n((it.x + it.w / 2) * PX)},${n(-L * SIN30 * PX)})">${out.join("")}</g>`;
  }

  /* ---------------------------------------------------------------
     fachada medida: o que aparece antes do corte
     --------------------------------------------------------------- */

  function facade(it, level) {
    const g = geom(it);
    const { x, w, hh, parapet, body, floors, floorH } = g;
    const cls = `world-house${highlight === it.h.id ? " on" : ""}`;
    const hit = `<rect x="${n(x)}" y="${n(-maxH * PX - 20)}" width="${n(w)}" height="${n(maxH * PX + 26)}" fill="transparent"></rect>`;

    if (level === 0) {
      return `<g class="${cls}" data-id="${esc(it.h.id)}">
        <rect class="wh-body" x="${n(x)}" y="${n(-hh)}" width="${n(w)}" height="${n(hh)}" fill="${it.tint}" stroke="${INK}" stroke-width=".9"></rect>
        ${hit}</g>`;
    }

    const rng = seeded(`fachada:${it.h.id}`);
    const lines = [];
    for (let f = 1; f < floors; f += 1) {
      const y = -body + f * floorH;
      lines.push(`<line x1="${n(x)}" y1="${n(y)}" x2="${n(x + w)}" y2="${n(y)}" stroke="${INK}" stroke-width="1" opacity=".38"></line>`);
    }

    /* aberturas por regra fixa, uma por faixa de fachada */
    const cols = Math.max(1, Math.round(w / 26));
    const ww = Math.min((w / (cols + 1)) * 0.78, floorH * 0.5);
    const wh = Math.min(floorH * 0.42, ww * 1.2);
    const out = [];
    /* varanda em um pavimento alto, nunca no térreo */
    const railFloor = floors > 1 ? Math.floor(rng() * (floors - 1)) : -1;
    for (let f = 0; f < floors; f += 1) {
      const top = -body + f * floorH;
      for (let c = 0; c < cols; c += 1) {
        const wx = x + ((c + 1) * w) / (cols + 1) - ww / 2;
        const wy = top + floorH * 0.26;
        if (f === floors - 1 && c === 0) {
          const dh = Math.min(floorH * 0.66, ww * 2.1);
          out.push(`<rect x="${n(wx)}" y="${n(-dh)}" width="${n(ww)}" height="${n(dh)}" fill="#f4f6f9" stroke="${INK}" stroke-width=".9"></rect>`);
          out.push(`<line x1="${n(wx - 1.4)}" y1="${n(-dh - 1.6)}" x2="${n(wx + ww + 1.4)}" y2="${n(-dh - 1.6)}" stroke="${INK}" stroke-width="1.1"></line>`);
          continue;
        }
        if (ww < 3 || wh < 3) continue;
        out.push(`<rect x="${n(wx)}" y="${n(wy)}" width="${n(ww)}" height="${n(wh)}" fill="#fff" stroke="${INK}" stroke-width=".8"></rect>`);
        out.push(`<line x1="${n(wx + ww / 2)}" y1="${n(wy)}" x2="${n(wx + ww / 2)}" y2="${n(wy + wh)}" stroke="${INK}" stroke-width=".5" opacity=".6"></line>`);
        if (f === railFloor && c === cols - 1 && ww > 5) {
          const ry = top + floorH - 1.2;
          const a = wx - 2.4, b = wx + ww + 2.4;
          const bal = [];
          for (let s = 1; s < 5; s += 1) {
            const bx = a + ((b - a) * s) / 5;
            bal.push(`<line x1="${n(bx)}" y1="${n(ry)}" x2="${n(bx)}" y2="${n(ry - 4.4)}" stroke="${INK}" stroke-width=".45"></line>`);
          }
          out.push(`<g opacity=".8"><line x1="${n(a)}" y1="${n(ry)}" x2="${n(b)}" y2="${n(ry)}" stroke="${INK}" stroke-width="1.1"></line>
            <line x1="${n(a)}" y1="${n(ry - 4.4)}" x2="${n(b)}" y2="${n(ry - 4.4)}" stroke="${INK}" stroke-width=".8"></line>
            <line x1="${n(a)}" y1="${n(ry)}" x2="${n(a)}" y2="${n(ry - 4.4)}" stroke="${INK}" stroke-width=".8"></line>
            <line x1="${n(b)}" y1="${n(ry)}" x2="${n(b)}" y2="${n(ry - 4.4)}" stroke="${INK}" stroke-width=".8"></line>${bal.join("")}</g>`);
        }
      }
    }
    /* condensadora, quando cabe */
    if (w > 34 && rng() < 0.55) {
      const ax = x + w - 9;
      const ay = -body + floorH * 0.55;
      out.push(`<g opacity=".75"><rect x="${n(ax)}" y="${n(ay)}" width="6.4" height="4.2" fill="${FURN}" stroke="${INK}" stroke-width=".6"></rect>
        <circle cx="${n(ax + 3.2)}" cy="${n(ay + 2.1)}" r="1.3" fill="none" stroke="${INK}" stroke-width=".5"></circle></g>`);
    }

    return `<g class="${cls}" data-id="${esc(it.h.id)}">
      <rect class="wh-body" x="${n(x)}" y="${n(-body)}" width="${n(w)}" height="${n(body)}" fill="${it.tint}" stroke="${INK}" stroke-width="1.1"></rect>
      <rect x="${n(x - w * 0.04)}" y="${n(-hh)}" width="${n(w * 1.08)}" height="${n(parapet)}" fill="${INK}" opacity=".85"></rect>
      <rect x="${n(x)}" y="-2.2" width="${n(w)}" height="2.2" fill="${INK}" opacity=".35"></rect>
      ${lines.join("")}${out.join("")}
      ${hit}</g>`;
  }

  /* ---------------------------------------------------------------
     Gente, gato e mobília. Elenco desenhado aqui, do zero: pictogramas
     sem rosto, em escala (1 px de mundo = 10 cm), com origem no pé.
     A variação é combinatória, e não um catálogo de personagens: porte,
     cabelo, cor, o que a figura carrega e o que ela está fazendo se
     sorteiam por semente fixa, e por isso o elenco não se repete.
     --------------------------------------------------------------- */

  const PORTES = [1, 1, 1, 0.94, 1.06, 0.88, 0.62];   /* 0.62 é criança */

  /* espécies do elenco: 0 gente, 1 coelho, 2 raposa, 3 urso, 4 rato */
  const ESPECIES = [0, 0, 0, 0, 1, 2, 3, 4];

  function orelhas(c, cy, r, esp) {
    if (esp === 1) return `<ellipse cx="${n(-r * 0.5)}" cy="${n(cy - r * 1.35)}" rx="${n(r * 0.32)}" ry="${n(r * 0.98)}" fill="${c}"></ellipse>
      <ellipse cx="${n(r * 0.5)}" cy="${n(cy - r * 1.35)}" rx="${n(r * 0.32)}" ry="${n(r * 0.98)}" fill="${c}"></ellipse>`;
    if (esp === 2) return `<path d="M${n(-r * 0.97)},${n(cy - r * 0.55)} L${n(-r * 1.12)},${n(cy - r * 1.7)} L${n(-r * 0.26)},${n(cy - r * 1.07)} Z" fill="${c}"></path>
      <path d="M${n(r * 0.97)},${n(cy - r * 0.55)} L${n(r * 1.12)},${n(cy - r * 1.7)} L${n(r * 0.26)},${n(cy - r * 1.07)} Z" fill="${c}"></path>`;
    if (esp === 3) return `<circle cx="${n(-r * 0.77)}" cy="${n(cy - r * 0.86)}" r="${n(r * 0.49)}" fill="${c}"></circle>
      <circle cx="${n(r * 0.77)}" cy="${n(cy - r * 0.86)}" r="${n(r * 0.49)}" fill="${c}"></circle>`;
    if (esp === 4) return `<circle cx="${n(-r * 0.72)}" cy="${n(cy - r * 0.92)}" r="${n(r * 0.56)}" fill="${c}"></circle>
      <circle cx="${n(r * 0.72)}" cy="${n(cy - r * 0.92)}" r="${n(r * 0.56)}" fill="${c}"></circle>`;
    return "";
  }

  function rabo(c, esp) {
    if (esp === 2) return `<path class="wl-tail" d="M3.1,-4.4 C6.5,-4.6 7.1,-8 5.5,-9.6" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round"></path>`;
    if (esp === 4) return `<path class="wl-tail" d="M3.2,-4.6 C6.2,-4.4 7,-2.6 6,-1.4" fill="none" stroke="${c}" stroke-width=".9" stroke-linecap="round"></path>`;
    if (esp === 1) return `<circle cx="3.6" cy="-4.4" r="1.1" fill="${c}" opacity=".9"></circle>`;
    return "";
  }

  function cabeca(c, cy, r, cab, esp) {
    const out = [orelhas(c, cy, r, esp)];
    if (!esp && cab === 2) out.push(`<rect x="${n(-r - 0.5)}" y="${n(cy - r * 0.45)}" width="${n(r * 2 + 1)}" height="${n(r * 2.3)}" rx="${n(r * 0.7)}" fill="${c}" opacity=".92"></rect>`);
    out.push(`<circle cx="0" cy="${n(cy)}" r="${n(r)}" fill="${c}"></circle>`);
    out.push(`<path d="M${n(-r)},${n(cy - r * 0.11)} a${n(r)},${n(r)} 0 0 1 ${n(r * 2)},0 z" fill="#fff" opacity=".17"></path>`);
    if (esp === 2 || esp === 4) out.push(`<circle cx="${n(r * 0.66)}" cy="${n(cy + r * 0.1)}" r="${n(r * 0.24)}" fill="${INK}" opacity=".5"></circle>`);
    if (!esp) {
      if (cab === 1) out.push(`<circle cx="${n(-r * 0.78)}" cy="${n(cy - r * 0.92)}" r="${n(r * 0.42)}" fill="${c}"></circle>`);
      if (cab === 3) out.push(`<path d="M${n(-r - 0.7)},${n(cy - r * 0.2)} A${n(r + 0.7)},${n(r + 0.7)} 0 0 1 ${n(r + 0.7)},${n(cy - r * 0.2)} Z" fill="${c}"></path>`);
      if (cab === 4) out.push(`<path d="M${n(-r - 0.9)},${n(cy - r * 0.28)} L0,${n(cy - r * 2.1)} L${n(r + 0.9)},${n(cy - r * 0.28)} Z" fill="${c}"></path>
        <ellipse cx="0" cy="${n(cy - r * 0.24)}" rx="${n(r * 1.4)}" ry="${n(r * 0.24)}" fill="${c}"></ellipse>`);
      if (cab === 5) out.push(`<path d="M${n(-r - 0.4)},${n(cy - r * 0.2)} a${n(r + 0.4)},${n(r + 0.4)} 0 0 1 ${n(2 * r + 0.8)},0 z" fill="${c}"></path>
        <circle cx="0" cy="${n(cy - r * 1.5)}" r="${n(r * 0.3)}" fill="${c}"></circle>`);
      if (cab === 6) out.push(`<path d="M${n(-r - 0.4)},${n(cy - r * 0.3)} Q0,${n(cy - r * 2.5)} ${n(r * 1.25)},${n(cy - r)} Z" fill="${c}"></path>`);
    }
    out.push(`<circle cx="${n(r * 0.53)}" cy="${n(cy + r * 0.3)}" r="${n(r * 0.28)}" fill="#e0958c" opacity=".68"></circle>`);
    return out.join("");
  }

  function carga(kind, c) {
    if (kind === "bolsa") return `<rect x="4.1" y="-6.4" width="3.2" height="4" rx=".9" fill="${FURN2}" stroke="${INK}" stroke-width=".4"></rect>
      <path d="M4.6,-6.4 A1.2,1.2 0 0 1 6.8,-6.4" fill="none" stroke="${INK}" stroke-width=".4"></path>`;
    if (kind === "caixa") return `<rect x="2.9" y="-11" width="5.4" height="4.2" rx=".7" fill="${FURN}" stroke="${INK}" stroke-width=".5"></rect>
      <line x1="2.9" y1="-8.9" x2="8.3" y2="-8.9" stroke="${INK}" stroke-width=".4" opacity=".6"></line>`;
    if (kind === "cesto") return `<path d="M3.5,-6.8 L8.5,-6.8 L7.7,-2.9 L4.3,-2.9 Z" fill="${CLAY}" stroke="${INK}" stroke-width=".5"></path>`;
    if (kind === "caneca") return `<rect x="4.1" y="-10.2" width="2.5" height="2.5" rx=".6" fill="${FURN2}" stroke="${INK}" stroke-width=".4"></rect>`;
    if (kind === "gato") return `<g transform="translate(3.1,-8.2) scale(.38)">${gatoLoaf(INK)}</g>`;
    if (kind === "livro") return `<rect x="3.7" y="-10" width="3.9" height="2.7" rx=".4" fill="#f7f0e2" stroke="${INK}" stroke-width=".5"></rect>`;
    if (kind === "guarda") return `<line x1="4.7" y1="-8.2" x2="4.7" y2="-0.6" stroke="${INK}" stroke-width=".7"></line>
      <path d="M2.6,-8.2 A2.1,2.1 0 0 1 6.8,-8.2 Z" fill="${FURN}" stroke="${INK}" stroke-width=".4"></path>`;
    return "";
  }

  /* Figura de pé. Silhueta de túnica até o chão, que é o que se lê num
     boneco de 17 px: a barra encosta no piso e a figura nunca flutua.
     Só quem anda mostra perna, porque a perna é o que carrega o passo.
     o: {c, s, cab, esp, capa, leva, andando, dur, braco, bengala} */
  function pessoa(o) {
    const c = o.c || SKIN[0];
    const s = o.s == null ? 1 : o.s;
    const dur = o.dur || 0.72;
    const esp = o.esp || 0;
    const corpo = [];

    if (o.andando) {
      corpo.push(`<rect class="wl-leg" style="--dur:${dur}s" x="-2" y="-5" width="1.8" height="5" rx=".9" fill="${INK}" opacity=".72"></rect>
        <rect class="wl-leg wl-leg-b" style="--dur:${dur}s" x="0.2" y="-5" width="1.8" height="5" rx=".9" fill="${INK}" opacity=".72"></rect>`);
      /* túnica curta por cima das pernas */
      corpo.push(`<path d="M-2.5,-10.4 C-3.2,-8.4 -3.5,-6.2 -3.6,-4.6 L3.6,-4.6 C3.5,-6.2 3.2,-8.4 2.5,-10.4 Z" fill="${c}"></path>`);
    } else {
      /* túnica inteira, do ombro à barra */
      corpo.push(`<path d="M-2.5,-10.4 C-3.4,-7 -4,-2.6 -4.2,0 L4.2,0 C4,-2.6 3.4,-7 2.5,-10.4 Z" fill="${c}"></path>`);
      corpo.push(`<path d="M-4.2,0 C-2.6,-0.8 2.6,-0.8 4.2,0 Z" fill="${INK}" opacity=".16"></path>`);
    }
    /* ombro arredondado, que fecha a túnica no pescoço */
    corpo.push(`<path d="M-2.6,-9.8 C-2.4,-11.6 2.4,-11.6 2.6,-9.8 Z" fill="${c}"></path>`);

    const capa = o.capa
      ? `<path d="M-2.4,-10.6 C-3.6,-7.4 -4.6,-3 -4.8,-0.4 L-2.2,-0.4 C-2.2,-3.6 -2,-7.4 -1.6,-10.2 Z" fill="${o.capa}" opacity=".92"></path>
         <path d="M-2.6,-10.2 C-2.2,-11.4 2.2,-11.4 2.6,-10.2 C1.6,-9.4 -1.6,-9.4 -2.6,-10.2 Z" fill="${o.capa}"></path>`
      : "";

    let dir;
    if (o.braco === "cima") dir = `<rect x="2.1" y="-15.4" width="1.5" height="5.8" rx=".75" fill="${c}" stroke="${ROOM}" stroke-width=".4"></rect>`;
    else if (o.braco === "frente") dir = `<rect class="${o.mexe ? "wl-type" : ""}" x="2.1" y="-9.6" width="4.3" height="1.5" rx=".75" fill="${c}" stroke="${ROOM}" stroke-width=".4"></rect>`;
    else if (o.braco === "fone") dir = `<rect x="2" y="-13.4" width="1.5" height="4" rx=".75" fill="${c}" stroke="${ROOM}" stroke-width=".4"></rect>`;
    else dir = `<path d="M2.2,-9.8 C3.4,-8.4 3.6,-6.8 3.4,-5.6 L2,-5.6 C2.2,-7 2.1,-8.6 1.6,-9.8 Z" fill="${c}" stroke="${ROOM}" stroke-width=".35"></path>`;
    const esq = `<path d="M-2.2,-9.8 C-3.4,-8.4 -3.6,-6.8 -3.4,-5.6 L-2,-5.6 C-2.2,-7 -2.1,-8.6 -1.6,-9.8 Z" fill="${c}" stroke="${ROOM}" stroke-width=".35"></path>`;
    const bengala = o.bengala ? `<line x1="3.4" y1="-8.6" x2="4.2" y2="0" stroke="${INK}" stroke-width=".8" stroke-linecap="round"></line>` : "";

    return `<g transform="scale(${n(s)})">${rabo(c, esp)}${corpo.join("")}${capa}
      ${esq}${dir}${bengala}${cabeca(c, -13.4, 3.5, o.cab || 0, esp)}${o.leva ? carga(o.leva, c) : ""}</g>`;
  }

  function pessoaSentada(o) {
    const c = o.c || SKIN[0];
    const s = o.s == null ? 1 : o.s;
    const esp = o.esp || 0;
    const braco = o.digitando
      ? `<rect class="wl-type" x="0.8" y="-9.2" width="4.2" height="1.5" rx=".75" fill="${c}"></rect>`
      : `<rect x="0.8" y="-9.2" width="3.7" height="1.5" rx=".75" fill="${c}"></rect>`;
    return `<g transform="scale(${n(s)})">${rabo(c, esp)}
      <path d="M-2.6,-6.2 C-2.4,-4.6 -1.2,-4.4 0.6,-4.4 L3.2,-4.4 C4,-4.4 4.2,-3.6 4,-3.2 L3,-0.2 C2.8,0 2.2,0 2.1,-0.3 L1.4,-3 L-1.6,-3 C-2.6,-3 -3,-4 -3,-5 Z" fill="${c}"></path>
      <rect x="-2.5" y="-10.4" width="5" height="4.6" rx="2.2" fill="${c}"></rect>
      ${o.capa ? `<path d="M-2.6,-10.4 C-3.3,-8 -3.1,-6.4 -2.8,-5.8 L2.8,-5.8 C3.1,-6.4 3.3,-8 2.6,-10.4 Z" fill="${o.capa}" opacity=".94"></path>` : ""}
      ${braco}${cabeca(c, -13.2, 3.3, o.cab || 0, esp)}
      ${o.leva ? `<g transform="translate(0,2.6)">${carga(o.leva, c)}</g>` : ""}</g>`;
  }

  function pessoaNoChao(o) {
    const c = o.c || SKIN[0];
    const s = o.s == null ? 1 : o.s;
    const esp = o.esp || 0;
    return `<g transform="scale(${n(s)})">${rabo(c, esp)}
      <path d="M-4.8,0 C-4.4,-2.2 -3,-3.2 0,-3.2 C3,-3.2 4.4,-2.2 4.8,0 Z" fill="${c}"></path>
      <rect x="-2.5" y="-8.4" width="5" height="5.8" rx="2.2" fill="${c}"></rect>
      ${o.braco === "frente" ? `<rect class="${o.mexe ? "wl-type" : ""}" x="2.4" y="-7" width="3.9" height="1.5" rx=".75" fill="${c}"></rect>` : ""}
      ${cabeca(c, -11.2, 3.3, o.cab || 0, esp)}</g>`;
  }

  function pessoaAgachada(o) {
    const c = o.c || SKIN[0];
    const s = o.s == null ? 1 : o.s;
    return `<g transform="scale(${n(s)})">
      <rect x="-3.4" y="-2.6" width="6.8" height="2.6" rx="1.2" fill="${c}"></rect>
      <g transform="rotate(-13)"><rect x="-2.5" y="-8.4" width="5" height="6" rx="2.2" fill="${c}"></rect>
      <rect x="2.2" y="-5.2" width="3.7" height="1.5" rx=".75" fill="${c}"></rect>
      ${cabeca(c, -11.2, 3.2, o.cab || 0, o.esp || 0)}</g></g>`;
  }

  function pessoaDeitada(c) {
    return `<circle cx="-2.2" cy="-3.2" r="3.2" fill="${c}"></circle>
      <path d="M-5.4,-3.4 a3.2,3.2 0 0 1 4,-2.8 z" fill="#fff" opacity=".18"></path>
      <circle cx="-1.1" cy="-2.3" r=".9" fill="#e0958c" opacity=".62"></circle>
      <rect class="wl-breathe" x="0.6" y="-3.9" width="11" height="3.9" rx="1.9" fill="${c}" opacity=".55"></rect>`;
  }

  /* cadeira de rodas: acessibilidade e envelhecimento são pergunta da pesquisa,
     e o térreo é onde a resposta costuma aparecer */
  function pessoaEmCadeira(o) {
    const c = o.c || SKIN[0];
    return `<g transform="scale(${n(o.s == null ? 1 : o.s)})">
      <circle cx="0" cy="-3.6" r="3.6" fill="none" stroke="${INK}" stroke-width="1"></circle>
      <circle cx="5" cy="-1.5" r="1.5" fill="none" stroke="${INK}" stroke-width=".8"></circle>
      <rect x="-1.6" y="-7.4" width="6.8" height="1.4" rx=".6" fill="${FURN}" stroke="${INK}" stroke-width=".5"></rect>
      <rect x="-3.1" y="-12.6" width="1.6" height="5.4" rx=".7" fill="${INK}" opacity=".6"></rect>
      <rect x="-2.5" y="-12.2" width="5" height="5" rx="2.2" fill="${c}"></rect>
      <rect x="2.2" y="-8" width="3.3" height="1.5" rx=".7" fill="${c}"></rect>
      ${cabeca(c, -15, 3.2, o.cab || 0, o.esp || 0)}</g>`;
  }

  function gatoLoaf(c) {
    return `<path class="wl-tail" d="M-4,-1.3 C-6,-1.7 -6.2,-3.8 -4.6,-4.6" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round"></path>
      <rect x="-4" y="-3.2" width="8.2" height="3.2" rx="1.6" fill="${c}"></rect>
      <circle cx="4" cy="-4.4" r="2.5" fill="${c}"></circle>
      <path d="M2.1,-5.9 L2.2,-7.8 L3.8,-6.5 Z" fill="${c}"></path>
      <path d="M5,-6.6 L6.4,-7.9 L6.4,-6 Z" fill="${c}"></path>
      <circle cx="5.2" cy="-4" r=".8" fill="#e0958c" opacity=".55"></circle>`;
  }

  function gatoSentado(c) {
    return `<path class="wl-tail" d="M-1.4,-0.6 C-4.4,-0.4 -5.4,-2.6 -4.2,-4.4" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round"></path>
      <path d="M-1.6,0 L-1,-4.2 C-0.7,-6 3,-6 3.3,-4.2 L3.9,0 Z" fill="${c}"></path>
      <circle cx="1.2" cy="-6" r="2.6" fill="${c}"></circle>
      <path d="M-0.8,-7.6 L-0.7,-9.5 L1,-8.2 Z" fill="${c}"></path>
      <path d="M2.2,-8.3 L3.7,-9.6 L3.7,-7.7 Z" fill="${c}"></path>
      <circle cx="2.5" cy="-5.6" r=".8" fill="#e0958c" opacity=".55"></circle>`;
  }

  function gatoEmPe(c) {
    return `<path class="wl-tail" d="M-4,-3.2 C-6.2,-3.8 -6.4,-6 -5,-7" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round"></path>
      <rect x="-4" y="-5" width="8.4" height="2.8" rx="1.3" fill="${c}"></rect>
      <rect class="wl-leg" style="--dur:.62s" x="-3.2" y="-2.4" width="1.3" height="2.4" rx=".6" fill="${c}"></rect>
      <rect class="wl-leg wl-leg-b" style="--dur:.62s" x="2.6" y="-2.4" width="1.3" height="2.4" rx=".6" fill="${c}"></rect>
      <circle cx="4.2" cy="-6" r="2.5" fill="${c}"></circle>
      <path d="M2.3,-7.5 L2.4,-9.4 L4,-8.1 Z" fill="${c}"></path>
      <path d="M5.2,-8.2 L6.7,-9.5 L6.7,-7.6 Z" fill="${c}"></path>`;
  }

  /* passarinho: o segundo bicho solto da casa */
  function passaro(c) {
    return `<path d="M0,0 C-2.6,-0.4 -3.4,-2.6 -2.2,-4.2 C-1,-5.8 1.8,-5.8 2.8,-4.2 C3.8,-2.6 2.6,-0.2 0,0 Z" fill="${c}"></path>
      <path class="wl-tail" d="M-2.6,-4.5 L-4.8,-5.2 L-3.1,-3.5 Z" fill="${c}"></path>
      <circle cx="1.7" cy="-4.5" r="1.6" fill="${c}"></circle>
      <path d="M3.1,-4.4 L4.5,-4 L3.1,-3.6 Z" fill="#c2924e"></path>
      <circle cx="2.4" cy="-3.9" r=".6" fill="#e0958c" opacity=".6"></circle>`;
  }

  function vapor(x, y) {
    return `<g opacity=".55">
      <ellipse class="wl-steam" style="--dly:0s" cx="${n(x)}" cy="${n(y)}" rx="1.1" ry="1.5" fill="${FURN2}"></ellipse>
      <ellipse class="wl-steam" style="--dly:.9s" cx="${n(x + 1.2)}" cy="${n(y)}" rx=".9" ry="1.3" fill="${FURN2}"></ellipse>
      <ellipse class="wl-steam" style="--dly:1.7s" cx="${n(x - 1)}" cy="${n(y)}" rx=".8" ry="1.2" fill="${FURN2}"></ellipse></g>`;
  }

  /* sorteia um elenco: cor, porte, cabelo */
  const CAB_N = 6;
  function elenco(rng, extra) {
    const esp = ESPECIES[Math.floor(rng() * ESPECIES.length)];
    return Object.assign({
      c: SKIN[Math.floor(rng() * SKIN.length)],
      s: PORTES[Math.floor(rng() * PORTES.length)],
      cab: Math.floor(rng() * (CAB_N + 1)),
      esp,
      capa: rng() < 0.42 ? SKIN[Math.floor(rng() * SKIN.length)] : null,
    }, extra || {});
  }

  /* --- cômodos. o: {x, y, w, fh, rng} em px de mundo --- */

  function vEntrada(o) {
    const stepW = Math.min(o.w * 0.44, 11);
    const s = [];
    /* agarikamachi: o degrau que separa o chão da rua do chão da casa */
    s.push(`<rect x="${n(o.x)}" y="${n(o.y - 2.6)}" width="${n(stepW)}" height="2.6" fill="${CLAY}" stroke="${INK}" stroke-width=".6"></rect>`);
    s.push(`<line x1="${n(o.x + stepW)}" y1="${n(o.y - 2.6)}" x2="${n(o.x + stepW)}" y2="${n(o.y)}" stroke="${INK}" stroke-width=".8"></line>`);
    for (let i = 0; i < 2; i += 1) {
      const sx = o.x + 1.6 + i * 3.4;
      s.push(`<rect x="${n(sx)}" y="${n(o.y - 1.1)}" width="2.4" height="1.1" rx=".5" fill="${INK}" opacity=".6"></rect>`);
    }
    if (o.w > 20) {
      const px = o.x + stepW + 5.5;
      const d = o.rng();
      if (d < 0.3) s.push(`<g transform="translate(${n(px)},${n(o.y - 2.6)})">${pessoaAgachada(elenco(o.rng))}</g>`);
      else if (d < 0.42) s.push(`<g transform="translate(${n(px)},${n(o.y)})">${pessoaEmCadeira(elenco(o.rng))}</g>`);
      else s.push(`<g transform="translate(${n(px)},${n(o.y - 2.6)})">${pessoa(elenco(o.rng, { leva: ["bolsa", "caixa", "cesto", "guarda", null][Math.floor(o.rng() * 5)] }))}</g>`);
      /* cabideiro */
      s.push(`<line x1="${n(o.x + o.w - 3)}" y1="${n(o.y - o.fh + 6)}" x2="${n(o.x + o.w - 3)}" y2="${n(o.y - o.fh + 12)}" stroke="${INK}" stroke-width=".7"></line>`);
    }
    return s.join("");
  }

  function vCozinha(o) {
    const bw = Math.min(o.w * 0.62, 18);
    const bx = o.x + 1;
    const s = [`<rect x="${n(bx)}" y="${n(o.y - 8.6)}" width="${n(bw)}" height="8.6" fill="${FURN}" stroke="${INK}" stroke-width=".7"></rect>
      <line x1="${n(bx)}" y1="${n(o.y - 8.6)}" x2="${n(bx + bw)}" y2="${n(o.y - 8.6)}" stroke="${INK}" stroke-width="1.1"></line>
      <rect x="${n(bx + 2)}" y="${n(o.y - 7.2)}" width="${n(Math.min(5, bw * 0.34))}" height="1.4" fill="${INK}" opacity=".25"></rect>`];
    const pot = bx + bw - 3.4;
    s.push(`<rect x="${n(pot - 1.8)}" y="${n(o.y - 11)}" width="3.6" height="2.4" rx=".5" fill="${INK}" opacity=".8"></rect>`);
    s.push(vapor(pot, o.y - 12.4));
    if (o.w > 30) s.push(`<g transform="translate(${n(bx + bw + 5.4)},${n(o.y)})"><g class="wl-bob" style="--dur:3.4s">${pessoa(elenco(o.rng, { braco: "frente", mexe: true }))}</g></g>`);
    s.push(`<rect x="${n(bx)}" y="${n(o.y - o.fh + 3)}" width="${n(bw * 0.8)}" height="5.4" fill="${FURN2}" stroke="${INK}" stroke-width=".6" opacity=".85"></rect>`);
    return s.join("");
  }

  function vPia(o) {
    const bw = Math.min(o.w * 0.5, 14);
    const bx = o.x + 1.4;
    return `<rect x="${n(bx)}" y="${n(o.y - 8.4)}" width="${n(bw)}" height="8.4" fill="${FURN}" stroke="${INK}" stroke-width=".7"></rect>
      <rect x="${n(bx + 1.4)}" y="${n(o.y - 9.4)}" width="${n(bw - 2.8)}" height="1.2" fill="#e7eef5" stroke="${INK}" stroke-width=".5"></rect>
      <path d="M${n(bx + bw - 3)},${n(o.y - 9.6)} L${n(bx + bw - 3)},${n(o.y - 13)} L${n(bx + bw - 6.4)},${n(o.y - 13)}" fill="none" stroke="${INK}" stroke-width=".7"></path>
      <rect class="wl-water" x="${n(bx + bw - 6.8)}" y="${n(o.y - 12.8)}" width=".8" height="3.2" fill="${FURN2}"></rect>
      ${o.w > 28 ? `<g transform="translate(${n(bx + bw + 5)},${n(o.y)})"><g class="wl-bob" style="--dur:2.8s">${pessoa(elenco(o.rng, { braco: "frente", mexe: true }))}</g></g>` : ""}`;
  }

  function vMesa(o) {
    const tw = Math.min(o.w * 0.6, 15);
    const tx = o.x + (o.w - tw) / 2;
    const ty = o.y - 7.2;
    const s = [`<rect x="${n(tx)}" y="${n(ty)}" width="${n(tw)}" height="1.3" fill="${FURN}" stroke="${INK}" stroke-width=".7"></rect>
      <rect x="${n(tx + 1.4)}" y="${n(ty + 1.3)}" width="1" height="5.9" fill="${INK}" opacity=".6"></rect>
      <rect x="${n(tx + tw - 2.4)}" y="${n(ty + 1.3)}" width="1" height="5.9" fill="${INK}" opacity=".6"></rect>
      <rect x="${n(tx + tw / 2 - 1)}" y="${n(ty - 2.2)}" width="2" height="2.2" rx=".5" fill="${FURN2}" stroke="${INK}" stroke-width=".5"></rect>`];
    if (o.w > 26) {
      s.push(`<rect x="${n(tx - 4.6)}" y="${n(o.y - 9.4)}" width="1" height="9.4" fill="${INK}" opacity=".55"></rect>
        <rect x="${n(tx - 5.8)}" y="${n(o.y - 4.6)}" width="4.4" height="1" fill="${INK}" opacity=".55"></rect>`);
      s.push(`<g transform="translate(${n(tx - 3.4)},${n(o.y)})">${pessoaSentada(elenco(o.rng, { leva: o.rng() < 0.4 ? "caneca" : null }))}</g>`);
      if (o.w > 38) s.push(`<g transform="translate(${n(tx + tw + 3.4)},${n(o.y)})">${pessoaSentada(elenco(o.rng))}</g>`);
    }
    return s.join("");
  }

  function vEstar(o) {
    const sw = Math.min(o.w * 0.56, 16);
    const sx = o.x + 1.4;
    const s = [`<rect x="${n(sx)}" y="${n(o.y - 3.6)}" width="${n(sw)}" height="3.6" rx="1" fill="${FURN}" stroke="${INK}" stroke-width=".7"></rect>
      <rect x="${n(sx)}" y="${n(o.y - 7.4)}" width="${n(sw * 0.24)}" height="3.9" rx=".8" fill="${FURN2}" stroke="${INK}" stroke-width=".6"></rect>`];
    if (o.rng() < 0.5) s.push(`<g transform="translate(${n(sx + sw * 0.42)},${n(o.y - 3.6)}) scale(.62)">${gatoLoaf(INK)}</g>`);
    else s.push(`<g transform="translate(${n(sx + sw * 0.66)},${n(o.y - 3.6)})">${pessoaSentada(elenco(o.rng, { s: 0.8 }))}</g>`);
    if (o.w > 22) {
      const tvx = o.x + o.w - 8.6;
      s.push(`<rect x="${n(tvx)}" y="${n(o.y - o.fh + 5)}" width="7.4" height="5" rx=".6" fill="${INK}"></rect>
        <rect class="wl-flick" x="${n(tvx + 0.7)}" y="${n(o.y - o.fh + 5.7)}" width="6" height="3.6" fill="#cfe0ee"></rect>`);
    }
    return s.join("");
  }

  function vTrabalho(o) {
    const dw = Math.min(o.w * 0.58, 14);
    const dx = o.x + 1.6;
    const dy = o.y - 7;
    return `<rect x="${n(dx)}" y="${n(dy)}" width="${n(dw)}" height="1.2" fill="${FURN}" stroke="${INK}" stroke-width=".7"></rect>
      <rect x="${n(dx + dw - 1.8)}" y="${n(dy + 1.2)}" width="1" height="5.8" fill="${INK}" opacity=".6"></rect>
      <rect x="${n(dx + 0.8)}" y="${n(dy + 1.2)}" width="1" height="5.8" fill="${INK}" opacity=".6"></rect>
      <rect x="${n(dx + dw - 6.6)}" y="${n(dy - 4.6)}" width="5.4" height="4.6" rx=".5" fill="${INK}"></rect>
      <rect class="wl-flick" style="--dur:2.4s" x="${n(dx + dw - 6.1)}" y="${n(dy - 4.1)}" width="4.4" height="3.6" fill="#cfe0ee"></rect>
      <g transform="translate(${n(dx + dw - 10.4)},${n(o.y)})">${pessoaSentada(elenco(o.rng, { digitando: true }))}</g>`;
  }

  function vEstudo(o) {
    const dw = Math.min(o.w * 0.5, 12);
    const dx = o.x + 2;
    return `<rect x="${n(dx)}" y="${n(o.y - 3.4)}" width="${n(dw)}" height="1" fill="${FURN}" stroke="${INK}" stroke-width=".6"></rect>
      <rect x="${n(dx + 0.8)}" y="${n(o.y - 2.4)}" width=".8" height="2.4" fill="${INK}" opacity=".5"></rect>
      <rect x="${n(dx + dw - 1.6)}" y="${n(o.y - 2.4)}" width=".8" height="2.4" fill="${INK}" opacity=".5"></rect>
      <rect x="${n(dx + dw * 0.4)}" y="${n(o.y - 4.4)}" width="3.4" height="1" rx=".2" fill="#f4f6f9" stroke="${INK}" stroke-width=".4"></rect>
      <g transform="translate(${n(dx + dw + 4)},${n(o.y)})">${pessoaNoChao(elenco(o.rng, { braco: "frente", mexe: true }))}</g>`;
  }

  function vLeitura(o) {
    const sw = Math.min(o.w * 0.34, 9);
    const sx = o.x + 1.2;
    const h = Math.min(o.fh - 4, 15);
    const rows = [];
    for (let r = 0; r < 3; r += 1) {
      const y = o.y - (h * (r + 1)) / 3;
      rows.push(`<line x1="${n(sx)}" y1="${n(y + h / 3)}" x2="${n(sx + sw)}" y2="${n(y + h / 3)}" stroke="${INK}" stroke-width=".6"></line>`);
      for (let b = 0; b < 5; b += 1) {
        const bw = (sw - 1.4) / 5;
        rows.push(`<rect x="${n(sx + 0.7 + b * bw)}" y="${n(y + 1)}" width="${n(bw - 0.4)}" height="${n(h / 3 - 1.6)}" fill="${o.rng() < 0.5 ? FURN : FURN2}"></rect>`);
      }
    }
    return `<rect x="${n(sx)}" y="${n(o.y - h)}" width="${n(sw)}" height="${n(h)}" fill="none" stroke="${INK}" stroke-width=".8"></rect>${rows.join("")}
      ${o.w > 22 ? `<g transform="translate(${n(sx + sw + 7)},${n(o.y)})">${pessoaSentada(elenco(o.rng, { leva: "livro" }))}</g>` : ""}`;
  }

  function vMusica(o) {
    const pw = Math.min(o.w * 0.5, 13);
    const px = o.x + 1.6;
    return `<rect x="${n(px)}" y="${n(o.y - 9.6)}" width="${n(pw)}" height="9.6" fill="${FURN}" stroke="${INK}" stroke-width=".7"></rect>
      <rect x="${n(px + 0.8)}" y="${n(o.y - 6.4)}" width="${n(pw - 1.6)}" height="1.4" fill="#f7f9fb" stroke="${INK}" stroke-width=".4"></rect>
      <rect x="${n(px + 1.4)}" y="${n(o.y - 6.4)}" width=".6" height="1.4" fill="${INK}"></rect>
      <rect x="${n(px + 3.2)}" y="${n(o.y - 6.4)}" width=".6" height="1.4" fill="${INK}"></rect>
      <rect x="${n(px + 5.6)}" y="${n(o.y - 6.4)}" width=".6" height="1.4" fill="${INK}"></rect>
      <rect x="${n(px + 7.4)}" y="${n(o.y - 6.4)}" width=".6" height="1.4" fill="${INK}"></rect>
      <g transform="translate(${n(px + pw + 4.2)},${n(o.y)}) scale(-1,1)">${pessoaSentada(elenco(o.rng, { digitando: true }))}</g>`;
  }

  function vDormir(o) {
    const c = SKIN[Math.floor(o.rng() * SKIN.length)];
    const bw = Math.min(o.w * 0.78, 15.5);
    const bx = o.x + 1.4;
    const alto = o.rng() < 0.5;
    const base = alto
      ? `<rect x="${n(bx)}" y="${n(o.y - 2.8)}" width="${n(bw)}" height="2.8" rx=".6" fill="${FURN}" stroke="${INK}" stroke-width=".7"></rect>`
      : `<rect x="${n(bx)}" y="${n(o.y - 1)}" width="${n(bw)}" height="1" rx=".4" fill="${CLAY}" stroke="${INK}" stroke-width=".5"></rect>`;
    const y0 = o.y - (alto ? 2.8 : 1);
    const s = [base, `<g transform="translate(${n(bx + 2.6)},${n(y0)}) scale(${n(Math.min(1, bw / 14))})">${pessoaDeitada(c)}</g>`];
    if (o.w > 24 && o.rng() < 0.5) s.push(`<g transform="translate(${n(bx + bw - 2)},${n(y0)}) scale(.55)">${gatoLoaf(INK)}</g>`);
    return s.join("");
  }

  function vBanho(o) {
    const tw = Math.min(o.w * 0.56, 13);
    const tx = o.x + 1.6;
    const s = [`<rect x="${n(tx)}" y="${n(o.y - 6.4)}" width="${n(tw)}" height="6.4" rx="1" fill="#e7eef5" stroke="${INK}" stroke-width=".8"></rect>
      <rect class="wl-water" x="${n(tx + 0.8)}" y="${n(o.y - 4.6)}" width="${n(tw - 1.6)}" height="4" fill="${FURN}" opacity=".8"></rect>`];
    s.push(vapor(tx + tw / 2, o.y - 9.6));
    if (o.w > 22) {
      s.push(`<rect x="${n(tx + tw + 3)}" y="${n(o.y - 3.4)}" width="3.6" height="1" fill="${FURN2}" stroke="${INK}" stroke-width=".5"></rect>
        <rect x="${n(tx + tw + 3.4)}" y="${n(o.y - 3)}" width=".8" height="3" fill="${INK}" opacity=".5"></rect>
        <rect x="${n(tx + tw + 5.4)}" y="${n(o.y - 3)}" width=".8" height="3" fill="${INK}" opacity=".5"></rect>`);
    }
    return s.join("");
  }

  function vLavar(o) {
    const mx = o.x + 1.6;
    const s = [`<g class="wl-shake"><rect x="${n(mx)}" y="${n(o.y - 8.4)}" width="7.6" height="8.4" rx=".6" fill="${FURN}" stroke="${INK}" stroke-width=".7"></rect>
      <circle cx="${n(mx + 3.8)}" cy="${n(o.y - 4.6)}" r="2.4" fill="#eef3f8" stroke="${INK}" stroke-width=".6"></circle>
      <rect x="${n(mx + 1)}" y="${n(o.y - 7.6)}" width="2.4" height="1" rx=".3" fill="${INK}" opacity=".5"></rect></g>`];
    s.push(`<path d="M${n(mx + 10)},${n(o.y)} L${n(mx + 16)},${n(o.y)} L${n(mx + 15)},${n(o.y - 4.4)} L${n(mx + 11)},${n(o.y - 4.4)} Z" fill="${CLAY}" stroke="${INK}" stroke-width=".6"></path>`);
    if (o.w > 28) s.push(`<g transform="translate(${n(mx + 21)},${n(o.y)})">${pessoa(elenco(o.rng, { leva: "cesto" }))}</g>`);
    return s.join("");
  }

  function vGuardar(o) {
    const sw = Math.min(o.w - 2, 18);
    const sx = o.x + 1;
    const h = Math.min(o.fh - 5, 16);
    const rows = 3;
    const s = [`<rect x="${n(sx)}" y="${n(o.y - h)}" width="${n(sw)}" height="${n(h)}" fill="none" stroke="${INK}" stroke-width=".8"></rect>`];
    for (let r = 1; r < rows; r += 1) {
      const y = o.y - (h * r) / rows;
      s.push(`<line x1="${n(sx)}" y1="${n(y)}" x2="${n(sx + sw)}" y2="${n(y)}" stroke="${INK}" stroke-width=".7"></line>`);
    }
    for (let r = 0; r < rows; r += 1) {
      const y = o.y - (h * (r + 1)) / rows;
      const nb = 2 + Math.floor(o.rng() * 2);
      for (let b = 0; b < nb; b += 1) {
        const bw = (sw - 2) / nb - 1.2;
        if (bw < 2) continue;
        s.push(`<rect x="${n(sx + 1 + b * (bw + 1.2))}" y="${n(y + 1.2)}" width="${n(bw)}" height="${n(h / rows - 2.4)}" fill="${o.rng() < 0.5 ? FURN : FURN2}" opacity=".9"></rect>`);
      }
    }
    return s.join("");
  }

  function vArrumar(o) {
    const sx = o.x + 1.2;
    const sw = Math.min(o.w * 0.44, 11);
    const sy = o.y - Math.min(o.fh - 4, 17);
    return `<rect x="${n(sx)}" y="${n(sy)}" width="${n(sw)}" height="1" fill="${FURN}" stroke="${INK}" stroke-width=".6"></rect>
      <rect x="${n(sx + 1)}" y="${n(sy - 3.4)}" width="4" height="3.4" fill="${FURN2}" stroke="${INK}" stroke-width=".5"></rect>
      <rect x="${n(sx + 6)}" y="${n(sy - 2.6)}" width="3.4" height="2.6" fill="${FURN}" stroke="${INK}" stroke-width=".5"></rect>
      <g transform="translate(${n(sx + sw + 3.6)},${n(o.y)})">${pessoa(elenco(o.rng, { braco: "cima" }))}</g>`;
  }

  function vEstender(o) {
    const rw = Math.min(o.w - 4, 18);
    const rx = o.x + 2;
    const ry = o.y - o.fh + 5.4;
    const s = [`<line x1="${n(rx)}" y1="${n(ry)}" x2="${n(rx + rw)}" y2="${n(ry)}" stroke="${INK}" stroke-width=".9"></line>`];
    const nPieces = Math.max(2, Math.floor(rw / 5));
    for (let i = 0; i < nPieces; i += 1) {
      const px = rx + 2 + i * ((rw - 3) / nPieces);
      const ph = 5 + o.rng() * 4;
      s.push(`<g transform="translate(${n(px)},${n(ry)})"><rect class="wl-sway" style="--deg:${n(3 + o.rng() * 3)}deg;--dur:${n(3.4 + o.rng() * 2)}s;--dly:${n(o.rng() * 2)}s"
        x="-1.6" y="0" width="3.2" height="${n(ph)}" rx=".6" fill="${o.rng() < 0.5 ? "#f2f5f8" : FURN}" stroke="${INK}" stroke-width=".5"></rect></g>`);
    }
    if (o.w > 24) s.push(`<g transform="translate(${n(rx + rw - 2)},${n(o.y)}) scale(.6)">${gatoSentado(INK)}</g>`);
    return s.join("");
  }

  function vPlanta(o) {
    const cx = o.x + 4;
    const s = [`<g transform="translate(${n(cx)},${n(o.y)})">
      <path d="M-2.6,0 L-2,-3.6 L2,-3.6 L2.6,0 Z" fill="${CLAY}" stroke="${INK}" stroke-width=".6"></path>
      <g class="wl-sway" style="--deg:5deg;--dur:5.2s">
        <path d="M0,-3.6 C-3.6,-5.4 -3.8,-8.8 -0.6,-10" fill="none" stroke="${LEAF}" stroke-width="1.1" stroke-linecap="round"></path>
        <path d="M0,-3.6 C3,-6 3.4,-9.2 0.6,-10.8" fill="none" stroke="${LEAF}" stroke-width="1.1" stroke-linecap="round"></path>
        <path d="M0,-3.6 L0,-8.4" stroke="${LEAF}" stroke-width=".9" stroke-linecap="round"></path>
      </g></g>`];
    if (o.w > 20) s.push(`<g transform="translate(${n(o.x + o.w - 5)},${n(o.y)}) scale(.65)">${gatoSentado(INK)}</g>`);
    if (o.w > 36) s.push(`<g transform="translate(${n(o.x + o.w * 0.5)},${n(o.y)})"><g class="wl-bob" style="--dur:4.2s">${pessoa(elenco(o.rng, { leva: "caneca" }))}</g></g>`);
    return s.join("");
  }

  function vCrianca(o) {
    const s = [`<g transform="translate(${n(o.x + 3.4)},${n(o.y)})">${pessoaNoChao(elenco(o.rng, { s: 0.62, braco: "frente", mexe: true }))}</g>`];
    for (let i = 0; i < 3; i += 1) {
      s.push(`<rect x="${n(o.x + 8 + i * 3.2)}" y="${n(o.y - 2.4 - (i % 2) * 2.4)}" width="2.4" height="2.4" fill="${i % 2 ? FURN : FURN2}" stroke="${INK}" stroke-width=".4"></rect>`);
    }
    if (o.w > 32) {
      s.push(`<g transform="translate(${n(o.x + 17)},${n(o.y)})"><g class="wl-roll" style="--to:${n(Math.min(o.w - 22, 12))}px">
        <circle cx="0" cy="-1.6" r="1.6" fill="none" stroke="${INK}" stroke-width=".6"></circle></g></g>`);
      s.push(`<g transform="translate(${n(o.x + o.w - 5)},${n(o.y)})">${pessoa(elenco(o.rng, { braco: "frente" }))}</g>`);
    }
    return s.join("");
  }

  function vGatoAlto(o) {
    const sx = o.x + 1.6;
    const sw = Math.min(o.w * 0.5, 13);
    const sy = o.y - Math.min(o.fh - 5, 16);
    return `<rect x="${n(sx)}" y="${n(sy)}" width="${n(sw)}" height="1" fill="${FURN}" stroke="${INK}" stroke-width=".6"></rect>
      <g transform="translate(${n(sx + sw * 0.4)},${n(sy)}) scale(${n(o.rng() < 0.4 ? 0.8 : 0.7)})">${o.rng() < 0.4 ? passaro("#8a5a6d") : gatoLoaf(INK)}</g>
      ${o.w > 24 ? `<g transform="translate(${n(sx + sw + 6)},${n(o.y)})">${pessoa(elenco(o.rng, { braco: "cima" }))}</g>` : ""}
      <g transform="translate(${n(o.x + o.w - 6)},${n(o.y)}) scale(.55)">${gatoSentado(INK)}</g>`;
  }

  function vTelefone(o) {
    const a = o.x + 2.4, b = o.x + o.w - 5;
    return `<g transform="translate(${n(a)},${n(o.y)})"><g class="wl-pace" style="--to:${n(b - a)}px;--dur:${n(9 + o.rng() * 4)}s">
      ${pessoa(elenco(o.rng, { braco: "fone", andando: true, dur: 0.66 }))}</g></g>
      ${o.w > 26 ? `<g transform="translate(${n(o.x + o.w - 4)},${n(o.y)}) scale(.6)">${gatoSentado(INK)}</g>` : ""}`;
  }

  function vAlongar(o) {
    const s = [`<rect x="${n(o.x + 1.6)}" y="${n(o.y - 0.9)}" width="${n(Math.min(o.w * 0.6, 15))}" height=".9" rx=".3" fill="${CLAY}" stroke="${INK}" stroke-width=".4"></rect>`];
    s.push(`<g transform="translate(${n(o.x + 6)},${n(o.y - 0.9)})"><g class="wl-bob" style="--dur:5s">${pessoa(elenco(o.rng, { braco: "cima" }))}</g></g>`);
    if (o.w > 32) s.push(`<g transform="translate(${n(o.x + o.w - 6)},${n(o.y - 0.9)})">${pessoaNoChao(elenco(o.rng))}</g>`);
    return s.join("");
  }

  function vBicicleta(o) {
    const bx = o.x + 2.6;
    const s = [`<circle cx="${n(bx)}" cy="${n(o.y - 3)}" r="3" fill="none" stroke="${INK}" stroke-width=".8"></circle>
      <circle cx="${n(bx + 9)}" cy="${n(o.y - 3)}" r="3" fill="none" stroke="${INK}" stroke-width=".8"></circle>
      <path d="M${n(bx)},${n(o.y - 3)} L${n(bx + 4)},${n(o.y - 3)} L${n(bx + 6)},${n(o.y - 7.6)} L${n(bx + 9)},${n(o.y - 3)} M${n(bx + 4)},${n(o.y - 3)} L${n(bx + 6.6)},${n(o.y - 7.6)}"
        fill="none" stroke="${INK}" stroke-width=".7"></path>
      <line x1="${n(bx + 6)}" y1="${n(o.y - 7.6)}" x2="${n(bx + 8)}" y2="${n(o.y - 7.6)}" stroke="${INK}" stroke-width=".7"></line>`];
    if (o.w > 24) s.push(`<g transform="translate(${n(bx + 16)},${n(o.y)})">${pessoa(elenco(o.rng, { leva: "caixa" }))}</g>`);
    return s.join("");
  }

  function vVaranda(o) {
    const rx = o.x + o.w - Math.min(o.w * 0.4, 11);
    const rw = Math.min(o.w * 0.4, 11);
    const bal = [];
    for (let i = 1; i < 5; i += 1) {
      bal.push(`<line x1="${n(rx + (rw * i) / 5)}" y1="${n(o.y)}" x2="${n(rx + (rw * i) / 5)}" y2="${n(o.y - 5)}" stroke="${INK}" stroke-width=".45"></line>`);
    }
    return `<line x1="${n(rx)}" y1="${n(o.y - 5)}" x2="${n(rx + rw)}" y2="${n(o.y - 5)}" stroke="${INK}" stroke-width=".9"></line>${bal.join("")}
      <g transform="translate(${n(rx + rw * 0.5)},${n(o.y)})"><g class="wl-bob" style="--dur:6s">${pessoa(elenco(o.rng))}</g></g>
      <g transform="translate(${n(o.x + 3.4)},${n(o.y)})">${vasoSimples(o)}</g>`;
  }

  function vasoSimples() {
    return `<path d="M-2,0 L-1.5,-2.8 L1.5,-2.8 L2,0 Z" fill="${CLAY}" stroke="${INK}" stroke-width=".5"></path>
      <g class="wl-sway" style="--deg:4deg;--dur:4.8s"><path d="M0,-2.8 C-2.4,-4.4 -2.6,-6.8 -0.4,-7.8" fill="none" stroke="${LEAF}" stroke-width=".9" stroke-linecap="round"></path>
      <path d="M0,-2.8 C2.2,-4.6 2.4,-7 0.4,-8.2" fill="none" stroke="${LEAF}" stroke-width=".9" stroke-linecap="round"></path></g>`;
  }

  const VIGNETTES = {
    entrada: vEntrada, cozinha: vCozinha, pia: vPia, mesa: vMesa, estar: vEstar,
    trabalho: vTrabalho, estudo: vEstudo, leitura: vLeitura, musica: vMusica,
    dormir: vDormir, banho: vBanho, lavar: vLavar, guardar: vGuardar,
    arrumar: vArrumar, estender: vEstender, planta: vPlanta, crianca: vCrianca,
    gatoalto: vGatoAlto, telefone: vTelefone, alongar: vAlongar,
    bicicleta: vBicicleta, varanda: vVaranda,
  };
  const MEIO = ["cozinha", "pia", "mesa", "estar", "trabalho", "estudo", "leitura",
    "musica", "dormir", "banho", "lavar", "guardar", "arrumar", "planta", "crianca",
    "gatoalto", "telefone", "alongar", "bicicleta", "varanda"];

  /* Sorteio sem reposição: dentro de uma casa nenhum cômodo se repete, e a
     fileira é girada pela posição da ficha para que casas vizinhas também
     não comecem iguais. */
  function roomPlan(it, floors, rng) {
    const pool = MEIO.slice();
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    const off = it.i % pool.length;
    const plan = ["entrada"];
    for (let L = 1; L < floors; L += 1) plan.push(pool[(off + L - 1) % pool.length]);
    if (floors > 1 && rng() < 0.4 && plan.indexOf("estender") === -1) plan[floors - 1] = "estender";
    return plan;
  }

  /* ---------------------------------------------------------------
     o corte habitado
     --------------------------------------------------------------- */

  function cutaway(it) {
    const g = geom(it);
    const { x, w, hh, parapet, body, floors, floorH } = g;
    const rng = seeded(`corte:${it.h.id}`);
    const wallT = Math.max(1.2, Math.min(2.2, w * 0.035));
    const slab = Math.max(1.6, Math.min(2.8, floorH * 0.08));
    const stairW = Math.min(Math.max(7, w * 0.26), 11);
    const roomW = w - 2 * wallT - stairW - 1.6;
    const temEscada = floors > 1 && roomW > 11;
    const esquerda = rng() < 0.5;
    const stairX = temEscada ? (esquerda ? x + wallT : x + w - wallT - stairW) : null;
    const rx0 = temEscada && esquerda ? x + wallT + stairW + 1.6 : x + wallT;
    const rw = temEscada ? roomW : w - 2 * wallT;

    const parts = [];
    /* casco: o que sobra de parede e laje depois do corte */
    parts.push(`<rect class="wl-shell" x="${n(x)}" y="${n(-body)}" width="${n(w)}" height="${n(body)}" fill="${it.tint}" stroke="${INK}" stroke-width="1.1"></rect>`);
    parts.push(`<rect x="${n(x - w * 0.04)}" y="${n(-hh)}" width="${n(w * 1.08)}" height="${n(parapet)}" fill="${it.tint}" stroke="${INK}" stroke-width="1"></rect>`);
    parts.push(`<rect x="${n(x)}" y="-2.4" width="${n(w)}" height="2.4" fill="${INK}" opacity=".35"></rect>`);

    const plan = roomPlan(it, floors, rng);
    const voids = [];    /* o vazio dos cômodos, no fundo    */
    const stairs = [];   /* a escada, atrás das lajes        */
    const slabs = [];    /* as lajes, que cortam a escada    */
    const inner = [];    /* mobília, gente e gato, por cima  */

    for (let L = 0; L < floors; L += 1) {
      const fy = -L * floorH;                    /* piso do nível */
      const ch = floorH - slab;                  /* pé-direito desenhado */
      const top = fy - ch;
      voids.push(`<rect x="${n(x + wallT)}" y="${n(top)}" width="${n(w - 2 * wallT)}" height="${n(ch)}" fill="${ROOM}"></rect>`);
      slabs.push(`<rect x="${n(x)}" y="${n(top - slab)}" width="${n(w)}" height="${n(slab)}" fill="${INK}" opacity=".78"></rect>`);
      /* janela no fundo, que é o que se vê de uma parede num corte */
      const jw = Math.min(rw * (0.34 + rng() * 0.14), 9.5);
      if (jw > 3.4) {
        const jx = rx0 + rw - jw - (1.2 + rng() * 2.4);
        inner.push(`<rect x="${n(jx)}" y="${n(top + ch * (0.14 + rng() * 0.1))}" width="${n(jw)}" height="${n(Math.min(ch * 0.46, jw * 0.95))}" fill="#eef3f8" stroke="${INK}" stroke-width=".5" opacity=".9"></rect>`);
      }
      if (rw > 9) {
        const fn = VIGNETTES[plan[L]] || vPlanta;
        inner.push(fn({ x: rx0, y: fy, w: rw, fh: ch, rng }));
        /* alguém atravessando o cômodo, ao modo do corredor do floor796 */
        if (rw > 46 && rng() < 0.22) {
          const c = SKIN[Math.floor(rng() * SKIN.length)];
          const a = rx0 + rw * 0.52, b = rx0 + rw - 4;
          inner.push(`<g transform="translate(${n(a)},${n(fy)})"><g class="wl-pace" style="--to:${n(b - a)}px;--dur:${n(7 + rng() * 6)}s;--dly:${n(rng() * 4)}s">${pessoa(elenco(rng, { c, andando: true, dur: n(0.62 + rng() * 0.2), leva: rng() < 0.35 ? ["bolsa", "caixa", "caneca", "gato"][Math.floor(rng() * 4)] : null }))}</g></g>`);
        }
      }
    }

    /* escada: degraus e, às vezes, alguém subindo */
    if (temEscada) {
      for (let L = 0; L < floors - 1; L += 1) {
        const y0 = -L * floorH;
        const y1 = -(L + 1) * floorH;
        const nStep = 6;
        const d = [];
        for (let s = 0; s < nStep; s += 1) {
          const sx = stairX + (esquerda ? (s * stairW) / nStep : stairW - (s * stairW) / nStep);
          const sy = y0 + ((y1 - y0) * s) / nStep;
          const sx2 = stairX + (esquerda ? ((s + 1) * stairW) / nStep : stairW - ((s + 1) * stairW) / nStep);
          d.push(`M${n(sx)},${n(sy)} L${n(sx2)},${n(sy)} L${n(sx2)},${n(sy + (y1 - y0) / nStep)}`);
        }
        stairs.push(`<path d="${d.join(" ")}" fill="none" stroke="${INK}" stroke-width=".9" opacity=".8"></path>`);
        if (rng() < 0.3) {
          const c = SKIN[Math.floor(rng() * SKIN.length)];
          const ax = stairX + (esquerda ? 1.6 : stairW - 1.6);
          const dx = esquerda ? stairW - 3.2 : -(stairW - 3.2);
          stairs.push(`<g transform="translate(${n(ax)},${n(y0)})"><g class="wl-climb" style="--dx:${n(dx)}px;--dy:${n(y1 - y0)}px;--dur:${n(9 + rng() * 5)}s;--dly:${n(rng() * 5)}s">${pessoa(elenco(rng, { c, andando: true, dur: 0.7, s: 0.9, leva: rng() < 0.3 ? "cesto" : null }))}</g></g>`);
        }
      }
    }

    /* laje da cobertura e contorno por cima de tudo */
    parts.push(`<g>${voids.join("")}${stairs.join("")}${slabs.join("")}${inner.join("")}</g>`);
    parts.push(`<rect x="${n(x)}" y="${n(-body)}" width="${n(w)}" height="${n(body)}" fill="none" stroke="${INK}" stroke-width="1.2"></rect>`);

    return `<g class="wl-house${highlight === it.h.id ? " on" : ""}">${parts.join("")}</g>`;
  }

  /* gato de rua, que patrulha a fileira rente ao chão */
  function strayCat(it) {
    const rng = seeded(`rua:${it.h.id}`);
    const a = it.x * PX;
    const span = Math.min(it.w * PX * 2.4, 90);
    return `<g transform="translate(${n(a)},0)"><g class="wl-pace" style="--to:${n(span)}px;--dur:${n(16 + rng() * 10)}s;--dly:${n(rng() * 6)}s">
      <g transform="scale(.8)">${gatoLoaf(INK)}</g></g></g>`;
  }

  /* ---------------------------------------------------------------
     desenho do palco
     --------------------------------------------------------------- */

  function wardBands() {
    if (sortKey !== "ward") return "";
    const out = [];
    let start = null, current = null;
    items.forEach((it, i) => {
      if (it.h.ward !== current) {
        if (current != null) out.push([current, start, items[i - 1].x + items[i - 1].w]);
        current = it.h.ward;
        start = it.x;
      }
    });
    if (current != null) out.push([current, start, items[items.length - 1].x + items[items.length - 1].w]);
    return out.map(([ward, a, b]) => `<g class="world-ward">
      <line x1="${n(a * PX - 6)}" y1="6" x2="${n(a * PX - 6)}" y2="${n(-maxH * PX - 14)}" stroke="#c3cdd9" stroke-width="1" stroke-dasharray="3 5"></line>
      <text x="${n(((a + b) / 2) * PX)}" y="${n(-maxH * PX - 22)}" text-anchor="middle" class="world-ward-label">${esc(ward)}</text>
    </g>`).join("");
  }

  function levelOf() {
    if (cam.k >= DETAIL_K) return 2;
    if (cam.k >= MID_K) return 1;
    return 0;
  }

  function ensureLayers() {
    const cam3 = $("world-cam");
    if (!cam3) return null;
    if (!$("world-base")) {
      const base = document.createElementNS(NS, "g");
      base.id = "world-base";
      const life = document.createElementNS(NS, "g");
      life.id = "world-life";
      cam3.appendChild(base);
      cam3.appendChild(life);
    }
    return cam3;
  }

  function render() {
    const cam3 = ensureLayers();
    if (!cam3) return;
    const level = levelOf();
    if (lastLevel !== level || cam3.dataset.dirty === "1") {
      const base = $("world-base");
      const grid = [];
      for (let m = 0; m <= Math.ceil(maxH / 3) * 3; m += 3) {
        grid.push(`<line x1="0" y1="${n(-m * PX)}" x2="${n(worldW * PX)}" y2="${n(-m * PX)}" stroke="#e4eaf1" stroke-width="1"></line>`);
      }
      const gw = worldW * PX + 8000;
      base.setAttribute("filter", modo === "maquete" && level > 0 ? "url(#neko-rough-soft)" : "");
      base.innerHTML = `<rect x="-4000" y="0" width="${n(gw)}" height="4000" fill="#f8f6f1"></rect>
        <rect x="-4000" y="0" width="${n(gw)}" height="26" fill="#eee9de"></rect>
        ${grid.join("")}${wardBands()}
        <line x1="-4000" y1="0" x2="${n(worldW * PX + 4000)}" y2="0" stroke="${INK}" stroke-width="1.6"></line>
        ${items.map((it) => (modo === "maquete" ? maquete(it, level) : facade(it, level))).join("")}`;
      cam3.dataset.dirty = "0";
      lastLevel = level;
      wire();
    }
    cam3.setAttribute("transform", `translate(${cam.x.toFixed(2)},${(GROUND_Y + cam.y).toFixed(2)}) scale(${cam.k.toFixed(4)})`);
    updateLife(level);
    axis();
    minimapView();
  }

  function visibleMeters() {
    const a = -cam.x / (PX * cam.k);
    const b = (stageW - cam.x) / (PX * cam.k);
    const pad = 4;
    return [a - pad, b + pad];
  }

  function updateLife(level) {
    const layer = $("world-life");
    if (!layer) return;
    if (level < 2 || !lifeOn || modo === "maquete") {
      if (liveNodes.size) { layer.textContent = ""; liveNodes.clear(); }
      return;
    }
    const [a, b] = visibleMeters();
    const want = [];
    for (const it of items) {
      if (it.x + it.w < a) continue;
      if (it.x > b) break;
      want.push(it);
    }
    if (want.length > MAX_LIFE) {
      const mid = (a + b) / 2;
      want.sort((p, q) => Math.abs(p.x - mid) - Math.abs(q.x - mid));
      want.length = MAX_LIFE;
    }
    const keep = new Set(want.map((it) => it.h.id));
    liveNodes.forEach((node, id) => {
      if (!keep.has(id)) { node.remove(); liveNodes.delete(id); }
    });
    want.forEach((it) => {
      if (liveNodes.has(it.h.id)) return;
      const g = document.createElementNS(NS, "g");
      g.dataset.id = it.h.id;
      g.innerHTML = cutaway(it) + (it.i % 9 === 3 ? strayCat(it) : "");
      layer.appendChild(g);
      liveNodes.set(it.h.id, g);
    });
  }

  function axis() {
    const g = $("world-axis");
    if (!g) return;
    const rows = [`<rect x="0" y="0" width="${GUTTER - 6}" height="${STAGE_H}" fill="#fbfcfd" opacity=".92"></rect>`];
    /* o passo do eixo cresce junto com o afastamento, para as cotas não
       se empilharem quando a fileira inteira cabe na tela */
    const step = [3, 6, 12, 24, 48].find((s) => s * PX * cam.k >= 14) || 48;
    for (let m = 0; m <= Math.ceil(maxH / 3) * 3; m += step) {
      const y = GROUND_Y + cam.y - m * PX * cam.k;
      if (y < 12 || y > STAGE_H - 4) continue;
      rows.push(`<text x="${GUTTER - 14}" y="${n(y + 4)}" text-anchor="end" class="world-tick">${m === 0 ? "0" : `${m} m`}</text>`);
    }
    const bar = 5 * PX * cam.k;
    rows.push(`<g transform="translate(${n(stageW - bar - 22)},22)">
      <line x1="0" y1="0" x2="${n(bar)}" y2="0" stroke="${INK}" stroke-width="1.6"></line>
      <line x1="0" y1="-4" x2="0" y2="4" stroke="${INK}" stroke-width="1.6"></line>
      <line x1="${n(bar)}" y1="-4" x2="${n(bar)}" y2="4" stroke="${INK}" stroke-width="1.6"></line>
      <text x="${n(bar / 2)}" y="-8" text-anchor="middle" class="world-scale">5 m</text></g>`);
    g.innerHTML = rows.join("");
  }

  /* ---------------------------------------------------------------
     minimapa
     --------------------------------------------------------------- */

  const MINI_H = 34;

  function minimapDraw() {
    const g = $("world-mini-bars");
    if (!g) return;
    const k = stageW / (worldW * PX);
    g.innerHTML = items.map((it) => {
      const x = it.x * PX * k, w = Math.max(0.7, it.w * PX * k);
      const h = (it.hh / maxH) * (MINI_H - 8);
      return `<rect x="${x.toFixed(2)}" y="${(MINI_H - 4 - h).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="#8fa3bd"></rect>`;
    }).join("");
  }

  function minimapView() {
    const r = $("world-mini-view");
    if (!r) return;
    const k = stageW / (worldW * PX);
    const left = (-cam.x / cam.k) * k;
    const width = (stageW / cam.k) * k;
    r.setAttribute("x", Math.max(0, left).toFixed(2));
    r.setAttribute("width", Math.min(stageW, width).toFixed(2));
  }

  /* ---------------------------------------------------------------
     câmera
     --------------------------------------------------------------- */

  function clamp() {
    cam.k = Math.max(K_MIN, Math.min(K_MAX, cam.k));
    const w = worldW * PX * cam.k;
    const minX = Math.min(GUTTER, stageW - w - 20);
    cam.x = Math.max(minX, Math.min(GUTTER, cam.x));

    /* o chão desce até encostar embaixo conforme o desenho cresce; quando
       o recorte inteiro está pequeno na tela, ele fica centrado em vez de
       ficar rasteiro. Só quando não cabe na vertical é que a câmera aceita
       subir e descer. */
    const contentH = maxH * PX * cam.k;
    const groundRest = Math.min(STAGE_H - FLOOR_PAD,
      contentH + Math.max(FLOOR_PAD, (STAGE_H - contentH) * 0.56));
    if (contentH + 46 <= groundRest) {
      cam.y = groundRest - GROUND_Y;
    } else {
      const minY = STAGE_H - FLOOR_PAD - GROUND_Y;
      const maxY = 46 + contentH - GROUND_Y;
      cam.y = Math.max(minY, Math.min(maxY, cam.y));
    }
  }

  let raf = 0;
  function draw() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; render(); });
  }

  function zoomAt(px, factor) {
    const before = (px - cam.x) / cam.k;
    cam.k *= factor;
    clamp();
    cam.x = px - before * cam.k;
    clamp();
    render();
  }

  function fitAll() {
    cam.k = Math.max(K_MIN, (stageW - GUTTER - 24) / (worldW * PX));
    cam.x = GUTTER;
    clamp();
    render();
  }

  function setHighlight(id, on) {
    const node = liveNodes.get(id);
    if (node && node.firstElementChild) node.firstElementChild.classList.toggle("on", on);
  }

  function flyTo(id) {
    const it = byId.get(id);
    if (!it) return;
    highlight = id;
    cam.k = Math.max(cam.k, 1.6);
    cam.x = stageW / 2 - (it.x + it.w / 2) * PX * cam.k;
    clamp();
    const g = $("world-cam");
    if (g) g.dataset.dirty = "1";
    render();
    setHighlight(id, true);
    setTimeout(() => {
      setHighlight(id, false);
      highlight = null;
      const c = $("world-cam");
      if (c) { c.dataset.dirty = "1"; render(); }
    }, 2800);
  }

  /* ---------------------------------------------------------------
     eventos das casas
     --------------------------------------------------------------- */

  function wire() {
    const base = $("world-base");
    if (!base) return;
    base.querySelectorAll(".world-house").forEach((node) => {
      const house = A.houses.find((h) => h.id === node.dataset.id);
      if (!house) return;
      node.addEventListener("mousemove", (e) => tip(e,
        `<strong>${esc(house.name)}</strong>${esc(house.architect)}<br>${esc(house.ward)} · ${house.year}<br>
         lote ${fmt(house.lotArea, 1)} m² · implantação ${fmt(house.footprintArea, 1)} m²<br>
         construída ${fmt(house.builtArea, 1)} m² · ${house.floors} pavimentos<br>
         cobre ${Number.isFinite(house.bcr) ? `${fmt(house.bcr * 100, 0)}% do lote` : "cobertura não registrada"}`));
      node.addEventListener("mouseenter", () => setHighlight(node.dataset.id, true));
      node.addEventListener("mouseleave", () => { hideTip(); setHighlight(node.dataset.id, false); });
      node.addEventListener("click", () => A.openDrawer(house.id));
    });
  }

  function flashMiss(el) {
    el.classList.add("miss");
    setTimeout(() => el.classList.remove("miss"), 900);
  }

  /* ---------------------------------------------------------------
     bloco
     --------------------------------------------------------------- */

  function block() {
    const pool = worldPool();
    const total = A.houses.length;
    return `<article class="city-block panel" id="block-world">
      <div class="panel-title"><div><p>o arquivo desenhado</p><h3>As ${pool.length} que têm altura</h3></div></div>
      <p class="panel-lede">As fichas que registram pavimentos, enfileiradas numa elevação contínua, na mesma escala. Arraste para andar, use a roda ou os botões para chegar perto. Em <em>elevação</em>, o recorte é uma silhueta de longe, vira fachada na aproximação média e se abre num corte habitado quando você chega bem perto. Em <em>maquete</em>, cada casa vira um volume em degraus, montado com a implantação e a área construída da própria ficha. Ficam de fora as ${total - pool.length} fichas sem pavimento registrado, que não teriam como ganhar altura sem que a altura fosse inventada.</p>
      <div class="world-tools">
        <div class="world-sorts" role="group" aria-label="Modo de desenho">
          <span class="world-label">desenho</span>
          <button type="button" class="chip-button" data-wmodo="elevacao" aria-pressed="true">elevação</button>
          <button type="button" class="chip-button" data-wmodo="maquete" aria-pressed="false">maquete</button>
        </div>
        <div class="world-sorts" role="group" aria-label="Ordem da fileira">
          <span class="world-label">ordenar</span>
          <button type="button" class="chip-button" data-wsort="lot" aria-pressed="true">por lote</button>
          <button type="button" class="chip-button" data-wsort="floors" aria-pressed="false">por pavimentos</button>
          <button type="button" class="chip-button" data-wsort="year" aria-pressed="false">por ano</button>
          <button type="button" class="chip-button" data-wsort="ward" aria-pressed="false">por ward</button>
        </div>
        <div class="world-zoom">
          <button type="button" class="chip-button" id="world-life-toggle" aria-pressed="true">interior desenhado</button>
          <label class="world-search"><span class="sr-only">Procurar uma casa</span>
            <input type="search" id="world-search" list="world-names" placeholder="voar até uma casa…" autocomplete="off"></label>
          <datalist id="world-names">${A.houses.map((h) => `<option value="${esc(h.name)}"></option>`).join("")}</datalist>
          <button type="button" class="icon-button" id="world-out" aria-label="Afastar">−</button>
          <button type="button" class="icon-button" id="world-in" aria-label="Aproximar">+</button>
          <button type="button" class="quiet-button" id="world-fit">Ver tudo</button>
        </div>
      </div>
      <div class="world-stage" id="world-stage">
        <svg id="world-svg" class="world-svg" role="img" aria-label="As ${pool.length} casas com pavimento registrado, numa elevação contínua que se abre em corte na aproximação">
          <g id="world-cam" data-dirty="1"></g>
          <g id="world-axis"></g>
        </svg>
        <p class="world-hint" id="world-hint">aproxime até o fim para abrir o corte</p>
      </div>
      <svg id="world-mini" class="world-mini" aria-hidden="true">
        <g id="world-mini-bars"></g>
        <rect id="world-mini-view" y="0" height="${MINI_H}" class="world-mini-view"></rect>
      </svg>
      <details class="world-conv"><summary>Convenções de desenho e crédito</summary>
      <p class="city-note"><strong>O que é dado e o que é convenção.</strong> Vem da planilha: a largura, que é a raiz quadrada da área de implantação, porque a base registra a área e não a frente do lote; a altura, a ${FLOOR_M} m por pavimento, medida de trabalho e não altura medida, que a base não registra; o número de lajes; e o tom, que é a parcela do lote coberta pela edificação. Na maquete, o térreo recebe a área de implantação e o que sobra da área construída se reparte pelos pavimentos de cima, limitado ao tamanho do térreo: o volume fecha com os dois campos, em vez de supor pavimentos iguais. É convenção de desenho, e só isso: a planta desenhada como quadrado, porque a base registra área e não frente e profundidade; a janela da fachada, que segue regra fixa de uma abertura por faixa; e <em>tudo</em> o que aparece dentro da casa no corte, do programa dos cômodos à escada, à mobília, aos moradores e aos gatos. Quem aparece nos cômodos não retrata morador nenhum: nem quem mora, nem quantos, nem o que fazem em casa constam da planilha. O interior é sorteado com semente fixa a partir do id da ficha, para que cada casa sempre apareça igual, e não descreve obra nenhuma: o botão <em>interior desenhado</em> apaga o corte inteiro e devolve só o medido. Das ${total} fichas comparáveis, ${pool.length} registram pavimentos e entram aqui. A fileira não existe em Tóquio: é o recorte posto lado a lado para poder ser comparado de uma vez.</p>
      <p class="city-note">Referência de formato: <a href="https://floor796.com/" target="_blank" rel="noopener">floor796</a>, de Pavel Sannikau, uma animação em corte contínuo que se arrasta e se aproxima. De lá veio a ideia de percorrer um corte povoado, e só ela. O elenco daqui foi desenhado para este atlas: pictogramas sem rosto, em escala, com porte, cabelo, cor, carga e atividade sorteados por semente fixa, o que dá ${MEIO.length + 1} cenas de cômodo que não se repetem dentro de uma mesma casa. Nenhum personagem, traço ou cena do floor796 foi reproduzido aqui.</p>
      </details>
    </article>`;
  }

  function mount() {
    const host = $("cats-blocks");
    if (!host) return;
    const anchor = document.createElement("div");
    anchor.innerHTML = block();
    const node = anchor.firstElementChild;
    const first = host.firstElementChild;
    if (first) host.insertBefore(node, first.nextSibling); else host.appendChild(node);

    const stage = $("world-stage");
    const svg = $("world-svg");
    stageW = stage.clientWidth || 1000;
    svg.setAttribute("viewBox", `0 0 ${stageW} ${STAGE_H}`);
    $("world-mini").setAttribute("viewBox", `0 0 ${stageW} ${MINI_H}`);
    build();
    minimapDraw();
    fitAll();
    cam.k = 0.95;
    cam.x = GUTTER;
    clamp();
    render();

    const hint = $("world-hint");
    const hintCheck = () => { if (hint) hint.hidden = levelOf() === 2 || !lifeOn || modo === "maquete"; };
    hintCheck();

    /* arrastar */
    let dragging = false, lastX = 0, lastY = 0;
    stage.addEventListener("pointerdown", (e) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("dragging");
    });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      cam.x += e.clientX - lastX;
      cam.y += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      clamp(); draw();
    });
    const stop = (e) => {
      dragging = false;
      stage.classList.remove("dragging");
      try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* já solto */ }
    };
    stage.addEventListener("pointerup", stop);
    stage.addEventListener("pointercancel", stop);

    /* roda: aproxima onde o cursor está */
    stage.addEventListener("wheel", (e) => {
      e.preventDefault();
      const box = stage.getBoundingClientRect();
      zoomAt(((e.clientX - box.left) / box.width) * stageW, e.deltaY < 0 ? 1.12 : 1 / 1.12);
      hintCheck();
    }, { passive: false });

    $("world-in").addEventListener("click", () => { zoomAt(stageW / 2, 1.35); hintCheck(); });
    $("world-out").addEventListener("click", () => { zoomAt(stageW / 2, 1 / 1.35); hintCheck(); });
    $("world-fit").addEventListener("click", () => { fitAll(); hintCheck(); });

    const lifeBtn = $("world-life-toggle");
    lifeBtn.addEventListener("click", () => {
      lifeOn = !lifeOn;
      lifeBtn.setAttribute("aria-pressed", String(lifeOn));
      lifeBtn.textContent = lifeOn ? "interior desenhado" : "só o medido";
      render();
      hintCheck();
    });

    document.querySelectorAll("[data-wmodo]").forEach((b) => b.addEventListener("click", () => {
      if (modo === b.dataset.wmodo) return;
      modo = b.dataset.wmodo;
      document.querySelectorAll("[data-wmodo]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      lifeBtn.disabled = modo === "maquete";
      build();
      minimapDraw();
      $("world-life").textContent = "";
      liveNodes.clear();
      $("world-cam").dataset.dirty = "1";
      clamp(); render(); hintCheck();
    }));

    document.querySelectorAll("[data-wsort]").forEach((b) => b.addEventListener("click", () => {
      sortKey = b.dataset.wsort;
      document.querySelectorAll("[data-wsort]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      build();
      minimapDraw();
      $("world-life").textContent = "";
      liveNodes.clear();
      $("world-cam").dataset.dirty = "1";
      clamp(); render();
    }));

    const search = $("world-search");
    /* NFKD para que o expoente de LOVE² vire o dígito 2 na busca */
    const norm = (v) => String(v || "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "");
    const go = () => {
      const q = norm(search.value);
      if (!q) return;
      const pool2 = items.map((i) => i.h);
      const hit = pool2.find((h) => norm(h.name) === q)
        || pool2.find((h) => norm(h.name).includes(q))
        || pool2.find((h) => norm(h.architect).includes(q));
      if (hit) { flyTo(hit.id); hintCheck(); }
      else flashMiss(search);
    };
    search.addEventListener("change", go);
    search.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });

    /* minimapa: clicar move a vista */
    const mini = $("world-mini");
    const jump = (e) => {
      const box = mini.getBoundingClientRect();
      const t = (e.clientX - box.left) / box.width;
      cam.x = stageW / 2 - t * worldW * PX * cam.k;
      clamp(); draw();
    };
    mini.addEventListener("pointerdown", (e) => { mini.setPointerCapture(e.pointerId); jump(e); });
    mini.addEventListener("pointermove", (e) => { if (e.buttons) jump(e); });

    window.addEventListener("resize", () => {
      const w = stage.clientWidth || stageW;
      if (Math.abs(w - stageW) < 4) return;
      stageW = w;
      svg.setAttribute("viewBox", `0 0 ${stageW} ${STAGE_H}`);
      mini.setAttribute("viewBox", `0 0 ${stageW} ${MINI_H}`);
      minimapDraw();
      clamp(); render();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
