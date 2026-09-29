/* O traço do atlas.

   A referência que a autora trouxe é uma xilogravura: figura cheia de cor
   chapada, contorno trêmulo de goiva, trama branca por dentro, cada figura
   com um adereço diferente. O que estava aqui antes era vetor liso demais.
   Este arquivo tenta a outra coisa.

   Recursos:
     defs()      injeta uma vez os filtros de tremor e as tramas;
     figure()    um gato que preenche uma faixa de altura dada, escolhendo a
                 pose conforme a proporção da faixa, com trama e adereço;
     lying()     o gato deitado do texto da testa de gato;
     elevation() a fachada medida de uma ficha: largura, altura e lajes do
                 dado, abertura por regra declarada, nada inventado;
     walking()   o gato do easter egg.

   Nada aqui é dado. As medidas entram de fora; o traço é só traço.        */

(function (root) {
  "use strict";

  const r = (n) => Math.round(n * 100) / 100;

  /* pseudoaleatório estável: a mesma ficha desenha sempre igual */
  function seeded(key) {
    let h = 2166136261;
    const s = String(key || "neko");
    for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  /* ---------------------------------------------------------------
     defs: tremor de goiva e tramas, uma vez por página
     --------------------------------------------------------------- */

  let defsDone = false;
  function defs() {
    if (defsDone || document.getElementById("neko-defs")) return;
    defsDone = true;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "neko-defs");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    svg.innerHTML = `
      <defs>
        <filter id="neko-rough" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="3" seed="7" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="neko-rough-soft" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.9" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <pattern id="neko-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
          <rect width="7" height="7" fill="none"/>
          <line x1="0" y1="0" x2="0" y2="7" stroke="#f7f4ec" stroke-width="2.1" opacity=".55"/>
        </pattern>
        <pattern id="neko-dots" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#f7f4ec" opacity=".6"/>
          <circle cx="6" cy="6" r="1.5" fill="#f7f4ec" opacity=".6"/>
        </pattern>
        <pattern id="neko-grid" width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M0,0 H9 M0,0 V9" stroke="#f7f4ec" stroke-width="1.5" opacity=".5" fill="none"/>
        </pattern>
      </defs>`;
    document.body.appendChild(svg);
  }

  /* ---------------------------------------------------------------
     as poses. Todas desenhadas num retângulo 100 de largura pela
     altura indicada, com os pés em baixo. O chamador estica.
     --------------------------------------------------------------- */

  const POSES = {
    /* torre: gato muito esticado, de pé, para faixas altas */
    tall: {
      h: 200,
      body: "M28,62 C20,96 16,150 17,199 L83,199 C84,150 80,96 72,62 Z",
      head: { cx: 50, cy: 48, rx: 31, ry: 30 },
      ears: ["M20,36 L23,4 L48,20 Z", "M80,36 L77,4 L52,20 Z"],
      paws: [[32, 192], [68, 192]],
      trim: "M24,104 C34,112 66,112 76,104",
    },
    /* sentado de frente */
    sit: {
      h: 140,
      body: "M30,54 C21,76 13,108 11,139 L89,139 C87,108 79,76 70,54 Z",
      head: { cx: 50, cy: 46, rx: 32, ry: 30 },
      ears: ["M21,33 L24,3 L49,19 Z", "M79,33 L76,3 L51,19 Z"],
      paws: [[29, 133], [71, 133]],
      trim: "M26,88 C36,96 64,96 74,88",
    },
    /* agachado: cabeça grande, corpo curto */
    crouch: {
      h: 84,
      body: "M22,48 C16,62 12,74 12,83 L88,83 C88,74 84,62 78,48 Z",
      head: { cx: 50, cy: 38, rx: 33, ry: 30 },
      ears: ["M20,26 L23,1 L47,13 Z", "M80,26 L77,1 L53,13 Z"],
      paws: [[30, 78], [70, 78]],
      trim: null,
    },
    /* pão de gato: só um monte com orelhas, para faixas baixas */
    loaf: {
      h: 52,
      body: "M9,51 C9,30 26,18 50,18 C74,18 91,30 91,51 Z",
      head: { cx: 50, cy: 30, rx: 25, ry: 21 },
      ears: ["M27,18 L29,1 L47,10 Z", "M73,18 L71,1 L53,10 Z"],
      paws: [[36, 47], [64, 47]],
      trim: null,
    },
  };

  const TRIMS = ["neko-hatch", "neko-dots", "neko-grid"];

  /* adereços, desenhados em papel sobre a cabeça ou o peito */
  function prop(kind, pose, paper) {
    const { cx, cy, ry } = pose.head;
    switch (kind) {
      case "oculos":
        return `<g fill="none" stroke="${paper}" stroke-width="2.4">
          <circle cx="${cx - 12}" cy="${cy - 2}" r="8"/><circle cx="${cx + 12}" cy="${cy - 2}" r="8"/>
          <path d="M${cx - 4},${cy - 2} H${cx + 4}"/></g>`;
      case "livro":
        return `<g transform="translate(${cx - 20},${cy + ry - 2})">
          <path d="M0,4 L20,0 L40,4 L40,20 L20,16 L0,20 Z" fill="${paper}" opacity=".95"/>
          <path d="M20,0 V16" stroke="#2a2f6b" stroke-width="1.6"/></g>`;
      case "cachecol":
        return `<g transform="translate(0,${cy + ry - 6})">
          <path d="M${cx - 26},0 C${cx - 10},9 ${cx + 10},9 ${cx + 26},0 L${cx + 26},9 C${cx + 10},18 ${cx - 10},18 ${cx - 26},9 Z" fill="${paper}"/>
          <path d="M${cx + 16},9 L${cx + 22},28 M${cx + 22},9 L${cx + 27},26" stroke="${paper}" stroke-width="3" stroke-linecap="round"/></g>`;
      case "coleira":
        return `<g><path d="M${cx - 22},${cy + ry - 4} C${cx - 8},${cy + ry + 4} ${cx + 8},${cy + ry + 4} ${cx + 22},${cy + ry - 4}"
          stroke="${paper}" stroke-width="5" fill="none"/>
          <circle cx="${cx}" cy="${cy + ry + 5}" r="4.5" fill="${paper}"/></g>`;
      case "peixe":
        return `<g transform="translate(${cx + 6},${cy + ry + 6})">
          <path d="M0,0 C8,-7 22,-7 28,0 C22,7 8,7 0,0 Z M28,0 L37,-6 L37,6 Z" fill="${paper}"/>
          <circle cx="8" cy="-1" r="1.6" fill="#2a2f6b"/></g>`;
      case "folha":
        return `<path d="M${cx + 18},${cy + ry + 2} C${cx + 34},${cy + ry - 14} ${cx + 40},${cy + ry + 2} ${cx + 24},${cy + ry + 12} Z"
          fill="${paper}"/>`;
      case "novelo":
        return `<g transform="translate(${cx - 34},${cy + ry + 6})"><circle r="10" cx="0" cy="0" fill="${paper}"/>
          <path d="M-8,-4 C-2,2 4,-4 8,2 M-7,4 C-1,-2 5,4 8,-2" stroke="#2a2f6b" stroke-width="1.4" fill="none"/></g>`;
      case "xicara":
        return `<g transform="translate(${cx + 12},${cy + ry + 4})">
          <path d="M0,0 H18 L15,13 H3 Z" fill="${paper}"/>
          <path d="M18,3 C25,3 25,11 18,11" stroke="${paper}" stroke-width="2.6" fill="none"/></g>`;
      default:
        return "";
    }
  }

  const PROPS = ["oculos", "livro", "cachecol", "coleira", "peixe", "folha", "novelo", "xicara"];

  /* Devolve o conteúdo de um <g>: o gato preenchendo w por h.
     A pose é escolhida pela proporção da faixa, como na referência:
     quem tem muito espaço se estica, quem tem pouco se agacha.          */
  function figure(opts) {
    const o = opts || {};
    const w = o.w || 100;
    const h = o.h || 140;
    const fill = o.fill || "#3b3f8f";
    const paper = o.paper || "#f7f4ec";
    const key = o.key || "";
    const rand = seeded(key);
    const ratio = h / w;

    const pose = ratio > 1.55 ? POSES.tall : ratio > 0.92 ? POSES.sit : ratio > 0.55 ? POSES.crouch : POSES.loaf;
    const sx = w / 100;
    const sy = h / pose.h;
    const { cx, cy, rx, ry } = pose.head;

    const eyeClosed = rand() < 0.34;
    const eyes = eyeClosed
      ? `<path d="M${cx - 17},${cy - 2} q6,7 12,0 M${cx + 5},${cy - 2} q6,7 12,0" stroke="${paper}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      : `<ellipse cx="${cx - 11}" cy="${cy - 2}" rx="4.8" ry="6.4" fill="${paper}"/>
         <ellipse cx="${cx + 11}" cy="${cy - 2}" rx="4.8" ry="6.4" fill="${paper}"/>`;

    const trimPattern = TRIMS[Math.floor(rand() * TRIMS.length)];
    const propKind = o.prop === false ? null : PROPS[Math.floor(rand() * PROPS.length)];

    const parts = [
      `<path d="${pose.ears[0]}" fill="${fill}"/>`,
      `<path d="${pose.ears[1]}" fill="${fill}"/>`,
      `<path d="${pose.body}" fill="${fill}"/>`,
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>`,
      /* trama: só no corpo, recortada pelo próprio caminho */
      `<path d="${pose.body}" fill="url(#${trimPattern})"/>`,
      pose.trim ? `<path d="${pose.trim}" stroke="${paper}" stroke-width="2.6" fill="none" opacity=".85"/>` : "",
      eyes,
      `<path d="M${cx - 4},${cy + 9} L${cx + 4},${cy + 9} L${cx},${cy + 15} Z" fill="${paper}"/>`,
      `<path d="M${cx - rx - 4},${cy + 2} L${cx - 13},${cy + 5} M${cx - rx - 4},${cy + 10} L${cx - 13},${cy + 10}
                M${cx + rx + 4},${cy + 2} L${cx + 13},${cy + 5} M${cx + rx + 4},${cy + 10} L${cx + 13},${cy + 10}"
         stroke="${paper}" stroke-width="1.7" fill="none" opacity=".8"/>`,
      pose.paws.map(([px, py]) => `<ellipse cx="${px}" cy="${py}" rx="10" ry="5.5" fill="${paper}" opacity=".42"/>`).join(""),
      propKind ? prop(propKind, pose, paper) : "",
    ];

    return `<g transform="scale(${r(sx)},${r(sy)})" filter="url(#neko-rough-soft)">${parts.join("")}</g>`;
  }

  /* ---------------------------------------------------------------
     gato deitado de perfil, num retângulo de 220 x 112, chão em y = 104.

     Proporção de gato de verdade: o corpo tem pouco mais de duas vezes a
     própria altura, a cabeça é grande e fica na frente, as patas dianteiras
     ficam estendidas e a cauda descansa no chão. Sem trama: nesta escala a
     trama suja a figura.
     --------------------------------------------------------------- */

  function lying(opts) {
    const o = opts || {};
    const fill = o.fill || "#2a2f6b";
    const paper = o.paper || "#f7f4ec";
    const accent = o.accent || "#d5476a";

    const body = `M66,84 C70,56 102,46 136,49 C166,52 186,66 188,88
                  C189,98 184,104 174,104 L74,104 C63,104 61,97 66,84 Z`;
    const tail = `M182,92 C204,80 222,88 218,101 C216,107 208,107 207,101 C209,95 199,93 185,100 Z`;

    return `<g filter="url(#neko-rough-soft)">
      <path class="neko-tail" d="${tail}" fill="${fill}"/>
      <path d="${body}" fill="${fill}"/>
      <rect x="26" y="93" width="56" height="11" rx="5.5" fill="${fill}"/>
      <rect x="26" y="93" width="17" height="11" rx="5.5" fill="${paper}" opacity=".45"/>
      <rect x="40" y="81" width="48" height="11" rx="5.5" fill="${fill}"/>
      <rect x="40" y="81" width="16" height="11" rx="5.5" fill="${paper}" opacity=".45"/>
      <path d="M36,52 L40,18 L66,40 Z" fill="${fill}"/>
      <path d="M88,52 L84,18 L58,40 Z" fill="${fill}"/>
      <circle cx="62" cy="56" r="29" fill="${fill}"/>
      <path d="M47,51 q7,8 14,0" stroke="${paper}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      <path d="M67,51 q7,8 14,0" stroke="${paper}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      <path d="M57,65 L67,65 L62,72 Z" fill="${accent}"/>
      <path d="M62,72 q-6,5 -12,2 M62,72 q6,5 12,2" stroke="${paper}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M24,56 L47,60 M24,65 L47,65 M26,74 L48,70"
            stroke="${paper}" stroke-width="1.8" fill="none" opacity=".7" stroke-linecap="round"/>
    </g>`;
  }

  /* ---------------------------------------------------------------
     fachada medida.

     Não é ilustração de casa: é elevação. Largura, altura e número de
     pavimentos vêm da ficha; a linha de laje é dado; a abertura segue uma
     regra declarada, uma a cada 2,6 m de fachada, e não um sorteio. Nada
     de telhado, cor, planta ou varal inventados.
     --------------------------------------------------------------- */

  function elevation(opts) {
    const o = opts || {};
    const w = o.w || 60;
    const h = o.h || 100;
    const floors = Math.max(1, Math.round(o.floors || 2));
    const ink = o.ink || "#10264a";
    const fill = o.fill || "#e8edf3";
    const parapet = Math.max(3, Math.min(7, w * 0.07));
    const bodyH = h - parapet;
    const floorH = bodyH / floors;
    const out = [];

    out.push(`<rect x="0" y="${r(parapet)}" width="${r(w)}" height="${r(bodyH)}" fill="${fill}" stroke="${ink}" stroke-width="1.5"/>`);
    out.push(`<rect x="${r(-w * 0.035)}" y="0" width="${r(w * 1.07)}" height="${r(parapet)}" fill="${ink}" opacity=".85"/>`);

    const cols = Math.max(1, Math.round(w / 26));
    for (let f = 0; f < floors; f += 1) {
      const top = parapet + f * floorH;
      if (f) out.push(`<line x1="0" y1="${r(top)}" x2="${r(w)}" y2="${r(top)}" stroke="${ink}" stroke-width="1" opacity=".45"/>`);
      const ground = f === floors - 1;
      const winW = Math.min((w / (cols + 1)) * 0.82, floorH * 0.58);
      const winH = Math.min(floorH * 0.44, winW * 1.2);
      for (let c = 0; c < cols; c += 1) {
        const wx = ((c + 1) * w) / (cols + 1) - winW / 2;
        const wy = top + floorH * 0.26;
        if (ground && c === 0 && w > 20) {
          const dw = Math.min(winW, w * 0.3);
          const dh = Math.min(floorH * 0.62, dw * 2.1);
          out.push(`<rect x="${r(wx)}" y="${r(parapet + bodyH - dh)}" width="${r(dw)}" height="${r(dh)}" fill="none" stroke="${ink}" stroke-width="1.3"/>`);
          continue;
        }
        if (winW < 4 || winH < 4) continue;
        out.push(`<rect x="${r(wx)}" y="${r(wy)}" width="${r(winW)}" height="${r(winH)}" fill="#fff" stroke="${ink}" stroke-width="1.1"/>`);
      }
    }
    return `<g filter="url(#neko-rough-soft)">${out.join("")}</g>`;
  }

  /* ---------------------------------------------------------------
     gato de perfil andando, 120 x 70, para o easter egg
     --------------------------------------------------------------- */

  function walking(opts) {
    const o = opts || {};
    const fill = o.fill || "#2a2f6b";
    const paper = o.paper || "#f7f4ec";
    return `<g filter="url(#neko-rough-soft)">
      <path class="neko-tail" d="M96,40 C112,40 120,29 118,16 C117,8 109,6 106,12 C103,18 110,20 110,28 C110,36 103,37 94,36 Z" fill="${fill}"/>
      <path d="M20,40 C18,25 31,19 53,19 C78,19 98,24 101,36 L101,49 L20,49 Z" fill="${fill}"/>
      <circle cx="20" cy="26" r="16" fill="${fill}"/>
      <path d="M5,20 L7,2 L23,14 Z" fill="${fill}"/>
      <path d="M35,20 L33,2 L18,14 Z" fill="${fill}"/>
      <circle cx="13" cy="24" r="2.8" fill="${paper}"/>
      <path d="M0,26 L10,27 M0,32 L10,31" stroke="${paper}" stroke-width="1.4"/>
      <rect class="neko-leg a" x="30" y="46" width="10" height="21" rx="5" fill="${fill}"/>
      <rect class="neko-leg b" x="52" y="46" width="10" height="21" rx="5" fill="${fill}"/>
      <rect class="neko-leg b" x="74" y="46" width="10" height="21" rx="5" fill="${fill}"/>
      <rect class="neko-leg a" x="90" y="46" width="10" height="21" rx="5" fill="${fill}"/>
    </g>`;
  }

  root.NekoCat = { defs, figure, lying, elevation, walking, seeded, POSES };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", defs);
  else defs();
})(window);
