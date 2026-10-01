/* O mosaico: todos os terrenos dos 23 wards, do modelo de uso do solo do PLATEAU
   (levantamento de uso do solo do Governo Metropolitano de Tóquio, 2016). De longe,
   uma imagem pré-desenhada (assets/lots/overview.png); de perto, os polígonos de
   verdade, carregados em trechos de 2 km (assets/lots/i_j.txt, binário em base64,
   gerados por lusetiles.py). Terrenos abaixo de 100 m² em azul; quanto mais escuro,
   menor. WebGL via three.js, carregado sob demanda. */

(function () {
  "use strict";

  const R = window.NEKO_RELIEF;
  const host = document.getElementById("city-blocks");
  if (!R || !R.geom || !host) return;

  const WARDS = R.wardOrder;
  const isEn = () => !!(window.NekoLang && window.NekoLang.current === "en");
  const L = (pt, en) => (isEn() ? en : pt);
  const nf = (v, d = 0) => (Number.isFinite(v)
    ? v.toLocaleString(isEn() ? "en-US" : "pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d })
    : "—");

  const CLS = [
    { c: "#b4bfcb", pt: "menos de 20 m²", en: "under 20 m²" },
    { c: "#0d2143", pt: "20 a 50 m²", en: "20 to 50 m²" },
    { c: "#1f5089", pt: "50 a 70 m²", en: "50 to 70 m²" },
    { c: "#4f8cc4", pt: "70 a 100 m²", en: "70 to 100 m²" },
    { c: "#d3dbe4", pt: "100 m² ou mais", en: "100 m² or more" },
  ];
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const JUMPS = ["Sumida", "Taito", "Arakawa", "Kita", "Adachi", "Katsushika", "Shinjuku", "Setagaya"];
  const VECTOR_BELOW = 0.006;   // km por pixel: abaixo disso, os polígonos de verdade

  const art = document.createElement("article");
  art.className = "city-block panel mosaic-block";
  art.id = "block-mosaic";
  art.innerHTML = `
    <div class="panel-title"><div><p data-m="kicker"></p><h3 data-m="title"></h3></div></div>
    <p class="relief-lede" data-m="lede"></p>
    <div class="mosaic-stage">
      <canvas class="mosaic-canvas" aria-hidden="true"></canvas>
      <div class="mosaic-labels" aria-hidden="true"></div>
      <p class="mosaic-loading" data-m="loading"></p>
      <div class="mosaic-top">
        <div class="mosaic-jumps"><span data-m="goto"></span>
          <button type="button" data-go="all"></button>
          ${JUMPS.map((w) => `<button type="button" data-go="${w}">${w}</button>`).join("")}
        </div>
        <ul class="mosaic-legend">${CLS.map((k) => `<li><i style="background:${k.c}"></i><span></span></li>`).join("")}</ul>
      </div>
      <div class="mosaic-info" hidden></div>
      <div class="mosaic-bottom">
        <div class="mosaic-zoom"><button type="button" data-z="1" aria-label="+">+</button><button type="button" data-z="-1" aria-label="−">−</button></div>
        <p class="mosaic-hint" data-m="hint"></p>
        <p class="mosaic-busy" hidden data-m="busy"></p>
        <div class="mosaic-scale"><i></i><span></span></div>
      </div>
      <p class="mosaic-wheel" hidden data-m="wheel"></p>
    </div>
    <p class="city-note" data-m="note"></p>`;
  const after = document.getElementById("block-relief");
  if (after && after.parentNode === host) after.after(art);
  else host.appendChild(art);

  const q = (s) => art.querySelector(s);
  const stage = q(".mosaic-stage");
  const canvas = q(".mosaic-canvas");
  const info = q(".mosaic-info");
  const labelsHost = q(".mosaic-labels");
  const M = { ready: false, meta: null };

  function paintText() {
    const m = M.meta && M.meta.stat;
    const n = m ? m.n : 839154, small = m ? m.cls[0] + m.cls[1] + m.cls[2] + m.cls[3] : 234468;
    const T = {
      kicker: L("mosaico · uso do solo em 2016", "mosaic · land use in 2016"),
      title: L("Todos os terrenos dos 23 wards", "Every plot in the 23 wards"),
      lede: L(`Cada polígono é uma unidade do levantamento de uso do solo que o governo de Tóquio fez em 2016, publicado pelo Ministério da Terra no projeto PLATEAU. São ${nf(n)} polígonos, e ${nf(small)} deles (${nf(small / n * 100, 0)}%) medem menos de 100 m²: são os azuis, mais escuros quanto menores. Aproxime para ver o desenho de cada quadra.`,
        `Each polygon is a unit of the land-use survey the Tokyo government carried out in 2016, published by the Ministry of Land in the PLATEAU project. There are ${nf(n)} polygons, and ${nf(small)} of them (${nf(small / n * 100, 0)}%) measure under 100 m²: the blue ones, darker the smaller. Zoom in to see the drawing of each block.`),
      loading: L("montando o mosaico…", "laying the mosaic…"),
      busy: L("carregando os terrenos desta área…", "loading the plots in this area…"),
      goto: L("ir para", "go to"),
      hint: L("arraste para mover · Ctrl + roda, pinça ou +/− para aproximar", "drag to move · Ctrl + wheel, pinch or +/− to zoom"),
      wheel: L("use Ctrl + roda para aproximar", "use Ctrl + wheel to zoom"),
      note: L(`Fonte: 3D都市モデル（Project PLATEAU）東京都23区（2022年度）, modelo de uso do solo (土地利用), Ministério da Terra, Infraestrutura, Transportes e Turismo do Japão, <a href="https://www.geospatial.jp/ckan/dataset/plateau-tokyo23ku-2022" target="_blank" rel="noopener">G空間情報センター</a>, acesso em 30 set. 2026, com dados processados pela autora. O modelo vem do 東京都平成28年度区部土地利用現況調査 (levantamento de uso do solo dos 23 wards, Governo Metropolitano de Tóquio, 2016). A área de cada polígono é a do próprio arquivo (areaInSquareMeter). O arquivo não traz a classe de uso: polígonos grandes incluem também rios e grandes equipamentos, e os menores que 20 m² devem ser sobras e faixas (inferência). Se cada polígono corresponde a um terreno de edificação (敷地) é [VERIFICAR] no manual do levantamento. Os polígonos aparecem recuados 0,25 m e simplificados a 0,35 m para desenhar as juntas; a imagem de longe tem 8 m por pixel.`,
        `Source: 3D都市モデル（Project PLATEAU）東京都23区（2022年度）, land-use model (土地利用), Ministry of Land, Infrastructure, Transport and Tourism, <a href="https://www.geospatial.jp/ckan/dataset/plateau-tokyo23ku-2022" target="_blank" rel="noopener">G空間情報センター</a>, accessed 30 Sep 2026, processed by the author. The model comes from 東京都平成28年度区部土地利用現況調査 (land-use survey of the 23 wards, Tokyo Metropolitan Government, 2016). Each polygon’s area is the file’s own (areaInSquareMeter). The file carries no land-use class: large polygons also include rivers and large facilities, and those under 20 m² are probably leftovers and strips (inference). Whether each polygon is a building site (敷地) is [TO VERIFY] in the survey manual. Polygons are inset 0.25 m and simplified to 0.35 m to draw the joints; the far image is 8 m per pixel.`),
    };
    art.querySelectorAll("[data-m]").forEach((node) => {
      if (T[node.dataset.m] == null) return;
      if (node.dataset.m === "note") node.innerHTML = T.note; else node.textContent = T[node.dataset.m];
    });
    q('[data-go="all"]').textContent = L("23 wards", "23 wards");
    const lis = art.querySelectorAll(".mosaic-legend li span");
    CLS.forEach((k, i) => { lis[i].textContent = L(k.pt, k.en); });
  }

  /* ---------- vista ---------- */

  const view = { cx: 0, cy: 0, s: 0.05 };
  let T3, renderer, scene, camera, hl, dirty = true;
  const tiles = new Map();   // "i_j" → { state, mesh, data }
  let inflight = 0;

  const W = () => stage.clientWidth, H = () => stage.clientHeight;
  function fitScale() { return (R.geom.span * 1.08) / Math.min(W(), H()); }
  function setCamera() {
    camera.left = view.cx - (W() / 2) * view.s;
    camera.right = view.cx + (W() / 2) * view.s;
    camera.top = view.cy + (H() / 2) * view.s;
    camera.bottom = view.cy - (H() / 2) * view.s;
    camera.updateProjectionMatrix();
  }
  const clampS = (s) => Math.max(0.00006, Math.min(0.08, s));
  function zoomAt(f, sx, sy) {
    const wx = view.cx + (sx - W() / 2) * view.s, wy = view.cy - (sy - H() / 2) * view.s;
    view.s = clampS(view.s / f);
    view.cx = wx - (sx - W() / 2) * view.s;
    view.cy = wy + (sy - H() / 2) * view.s;
    dirty = true;
  }
  let anim = null;
  function flyTo(cx, cy, s) {
    const from = { ...view }, t0 = performance.now(), dur = 900;
    anim = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      view.cx = from.cx + (cx - from.cx) * e;
      view.cy = from.cy + (cy - from.cy) * e;
      view.s = Math.exp(Math.log(from.s) + (Math.log(s) - Math.log(from.s)) * e);
      dirty = true;
      if (k >= 1) anim = null;
    };
  }
  function flyZoom(f, sx, sy) {
    const wx = view.cx + (sx - W() / 2) * view.s, wy = view.cy - (sy - H() / 2) * view.s;
    const s = clampS(view.s / f);
    flyTo(wx - (sx - W() / 2) * s, wy + (sy - H() / 2) * s, s);
  }

  /* ---------- trechos ---------- */

  function decodeTile(txt) {
    const bin = atob(txt.trim());
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) u8[i] = bin.charCodeAt(i);
    const buf = u8.buffer, dv = new DataView(buf);
    const n = dv.getUint32(4, true), nr = dv.getUint32(8, true), nv = dv.getUint32(12, true);
    let o = 16;
    const cls = new Uint8Array(buf, o, n); o += n;
    const ward = new Uint8Array(buf, o, n); o += n;
    const area = new Uint16Array(buf.slice(o, o + n * 2)); o += n * 2;
    const rings = new Uint8Array(buf, o, n); o += n;
    const rv = new Uint16Array(buf.slice(o, o + nr * 2)); o += nr * 2;
    const xy = new Int16Array(buf.slice(o, o + nv * 4));
    return { n, cls, ward, area, rings, rv, xy };
  }

  function buildTile(d) {
    const { n, cls, rings, rv, xy } = d;
    const nv = xy.length / 2;
    const pos = new Float32Array(nv * 3), col = new Uint8Array(nv * 3);
    const idx = [];
    const start = new Uint32Array(n + 1), outer = new Uint32Array(n);   // vértice inicial e fim do contorno
    let v = 0, r = 0;
    for (let i = 0; i < n; i += 1) {
      start[i] = v;
      const c = rgb(CLS[cls[i]].c);
      const contour = [], holes = [];
      for (let k = 0; k < rings[i]; k += 1) {
        const cnt = rv[r + k], ring = [];
        for (let j = 0; j < cnt; j += 1) {
          const x = xy[(v + j) * 2] * 0.0005, y = xy[(v + j) * 2 + 1] * 0.0005;
          pos[(v + j) * 3] = x; pos[(v + j) * 3 + 1] = y;
          col[(v + j) * 3] = c[0]; col[(v + j) * 3 + 1] = c[1]; col[(v + j) * 3 + 2] = c[2];
          ring.push(new T3.Vector2(x, y));
        }
        if (k === 0) { contour.push(...ring); outer[i] = v + cnt; } else holes.push(ring);
        v += cnt;
      }
      const base = start[i];
      if (holes.length === 0 && contour.length === 4) {
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      } else {
        const faces = T3.ShapeUtils.triangulateShape(contour, holes);
        for (const f of faces) idx.push(base + f[0], base + f[1], base + f[2]);
      }
      r += rings[i];
    }
    start[n] = v;
    const geo = new T3.BufferGeometry();
    geo.setAttribute("position", new T3.BufferAttribute(pos, 3));
    geo.setAttribute("color", new T3.BufferAttribute(col, 3, true));
    geo.setIndex(nv > 65535 ? new T3.Uint32BufferAttribute(idx, 1) : new T3.Uint16BufferAttribute(idx, 1));
    const mesh = new T3.Mesh(geo, new T3.MeshBasicMaterial({ vertexColors: true, side: T3.DoubleSide }));
    mesh.position.z = 0.1;
    mesh.frustumCulled = false;
    return { mesh, start, outer, pos };
  }

  function wantTiles() {
    if (!M.meta || view.s >= VECTOR_BELOW) return [];
    const { tile, g0 } = M.meta;
    const x0 = view.cx - (W() / 2) * view.s - 0.2, x1 = view.cx + (W() / 2) * view.s + 0.2;
    const y0 = view.cy - (H() / 2) * view.s - 0.2, y1 = view.cy + (H() / 2) * view.s + 0.2;
    const out = [];
    for (let i = Math.floor((x0 - g0) / tile); i <= Math.floor((x1 - g0) / tile); i += 1) {
      for (let j = Math.floor((y0 - g0) / tile); j <= Math.floor((y1 - g0) / tile); j += 1) {
        const key = `${i}_${j}`;
        if (M.meta.tiles[key]) out.push(key);
      }
    }
    return out;
  }

  function updateTiles() {
    const want = wantTiles();
    const vec = view.s < VECTOR_BELOW;
    let changed = false;
    for (const [key, t] of tiles) {
      if (!t.mesh) continue;
      const vis = vec && want.includes(key);
      if (t.mesh.visible !== vis) { t.mesh.visible = vis; changed = true; }
    }
    for (const key of want) {
      if (tiles.has(key) || inflight >= 4) continue;
      tiles.set(key, { state: "loading" });
      inflight += 1;
      changed = true;
      q(".mosaic-busy").hidden = false;
      fetch(`assets/lots/${key}.txt`).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }).then((txt) => {
        const d = decodeTile(txt);
        const b = buildTile(d);
        scene.add(b.mesh);
        tiles.set(key, { state: "ready", mesh: b.mesh, d, ...b, used: performance.now() });
      }).catch(() => tiles.set(key, { state: "error" })).finally(() => {
        inflight -= 1;
        if (!inflight) q(".mosaic-busy").hidden = true;
        dirty = true;
      });
    }
    /* guarda no máximo 36 trechos; os mais antigos fora da vista saem */
    const ready = [...tiles.entries()].filter(([k, t]) => t.state === "ready");
    for (const [k, t] of ready) if (want.includes(k)) t.used = performance.now();
    if (ready.length > 36) {
      ready.filter(([k]) => !want.includes(k)).sort((a, b) => a[1].used - b[1].used).slice(0, ready.length - 36).forEach(([k, t]) => {
        scene.remove(t.mesh); t.mesh.geometry.dispose(); t.mesh.material.dispose(); tiles.delete(k);
      });
    }
    return changed;
  }

  function pickAt(sx, sy) {
    if (view.s >= VECTOR_BELOW || !M.meta) return null;
    const x = view.cx + (sx - W() / 2) * view.s, y = view.cy - (sy - H() / 2) * view.s;
    const { tile, g0 } = M.meta;
    /* o polígono pode estar no trecho vizinho: procura nos nove ao redor, do menor para o maior */
    let best = null;
    const ti = Math.floor((x - g0) / tile), tj = Math.floor((y - g0) / tile);
    for (let di = -1; di <= 1; di += 1) for (let dj = -1; dj <= 1; dj += 1) {
      const t = tiles.get(`${ti + di}_${tj + dj}`);
      if (!t || t.state !== "ready") continue;
      const { d, start, outer, pos } = t;
      for (let i = d.n - 1; i >= 0; i -= 1) {
        if (best && d.area[i] >= best.area) continue;
        const a = start[i], b = outer[i];
        let inside = false;
        for (let j = a, k = b - 1; j < b; k = j++) {
          const xj = pos[j * 3], yj = pos[j * 3 + 1], xk = pos[k * 3], yk = pos[k * 3 + 1];
          if ((yj > y) !== (yk > y) && x < ((xk - xj) * (y - yj)) / (yk - yj) + xj) inside = !inside;
        }
        if (inside) best = { t, i, area: d.area[i] };
      }
    }
    return best;
  }

  function showInfo(p) {
    if (!p) { info.hidden = true; hl.visible = false; dirty = true; return; }
    const { t, i } = p, d = t.d;
    const w = WARDS[d.ward[i]];
    info.hidden = false;
    info.innerHTML = `<p class="relief-info-name">${L("Terreno", "Plot")} <span>${w || ""}</span></p>
      <dl><dt>${L("área", "area")}</dt><dd>${d.area[i] >= 65535 ? L("65.535 m² ou mais", "65,535 m² or more") : `${nf(d.area[i])} m²`}</dd>
      <dt>${L("classe", "class")}</dt><dd>${L(CLS[d.cls[i]].pt, CLS[d.cls[i]].en)}</dd></dl>`;
    const pts = [];
    for (let j = t.start[i]; j < t.outer[i]; j += 1) pts.push(new T3.Vector3(t.pos[j * 3], t.pos[j * 3 + 1], 0.3));
    pts.push(pts[0].clone());
    hl.geometry.dispose();
    hl.geometry = new T3.BufferGeometry().setFromPoints(pts);
    hl.visible = true;
    dirty = true;
  }

  /* ---------- cena ---------- */

  function init() {
    T3 = window.THREE;
    try {
      renderer = new T3.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (err) {
      q(".mosaic-loading").textContent = L("Este navegador não abriu o WebGL.", "This browser did not open WebGL.");
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    scene = new T3.Scene();
    camera = new T3.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    const fill = new T3.MeshBasicMaterial({ color: 0xedf1f5 });
    const line = new T3.LineBasicMaterial({ color: 0xffffff });
    for (const w of WARDS) {
      const rings = R.geom.outline[w];
      let best = null, bestA = 0;
      const shapes = rings.map((r) => {
        const v2 = r.map(([x, y]) => new T3.Vector2(x, y));
        const a = Math.abs(T3.ShapeUtils.area(v2));
        if (a > bestA) { bestA = a; best = r; }
        const l = new T3.Line(new T3.BufferGeometry().setFromPoints(r.map(([x, y]) => new T3.Vector3(x, y, 0.2))), line);
        l.renderOrder = 3;
        scene.add(l);
        return new T3.Shape(v2);
      });
      scene.add(new T3.Mesh(new T3.ShapeGeometry(shapes), fill));
      let cx = 0, cy = 0, A2 = 0;
      for (let k = 0; k < best.length - 1; k += 1) {
        const [ax, ay] = best[k], [bx, by] = best[k + 1];
        const cr = ax * by - bx * ay;
        A2 += cr; cx += (ax + bx) * cr; cy += (ay + by) * cr;
      }
      const lab = document.createElement("span");
      lab.textContent = w;
      lab.dataset.x = cx / (3 * A2); lab.dataset.y = cy / (3 * A2);
      labelsHost.appendChild(lab);
    }
    hl = new T3.Line(new T3.BufferGeometry(), new T3.LineBasicMaterial({ color: 0xc2185b }));
    hl.visible = false;
    scene.add(hl);
    resize();
    view.s = fitScale();
    bind();
    fetch("assets/lots/index.json").then((r) => r.json()).then((meta) => {
      M.meta = meta;
      paintText();
      new T3.TextureLoader().load("assets/lots/overview.png", (tex) => {
        tex.minFilter = T3.LinearMipmapLinearFilter;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const plane = new T3.Mesh(new T3.PlaneGeometry(meta.span, meta.span), new T3.MeshBasicMaterial({ map: tex, transparent: true }));
        plane.position.z = 0.05;
        scene.add(plane);
        M.plane = plane;
        M.ready = true;
        q(".mosaic-loading").hidden = true;
        dirty = true;
      });
    }).catch(() => { q(".mosaic-loading").textContent = L("O mosaico não carregou.", "The mosaic did not load."); });
    let settleT = 0;
    const loop = (now) => {
      requestAnimationFrame(loop);
      if (anim) anim(now);
      if (!dirty) return;
      dirty = false;
      setCamera();
      if (M.plane) M.plane.visible = view.s >= VECTOR_BELOW * 0.6 || ![...tiles.values()].some((t) => t.mesh && t.mesh.visible);
      clearTimeout(settleT);
      settleT = setTimeout(() => { if (updateTiles()) dirty = true; }, anim ? 200 : 60);
      renderer.render(scene, camera);
      paintOverlay();
    };
    requestAnimationFrame(loop);
  }

  function paintOverlay() {
    const w = W(), h = H();
    const show = view.s > 0.006;
    labelsHost.classList.toggle("off", !show);
    if (show) {
      labelsHost.querySelectorAll("span").forEach((s) => {
        const x = (Number(s.dataset.x) - view.cx) / view.s + w / 2, y = h / 2 - (Number(s.dataset.y) - view.cy) / view.s;
        s.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      });
    }
    const target = view.s * 110 * 1000;
    const p = Math.pow(10, Math.floor(Math.log10(target)));
    const m = [1, 2, 5, 10].map((k) => k * p).filter((k) => k <= target).pop() || p;
    q(".mosaic-scale i").style.width = `${m / (view.s * 1000)}px`;
    q(".mosaic-scale span").textContent = m >= 1000 ? `${m / 1000} km` : `${m} m`;
  }

  function resize() {
    if (!renderer || !W() || !H()) return;
    renderer.setSize(W(), H(), false);
    dirty = true;
  }

  function bind() {
    new ResizeObserver(resize).observe(stage);
    const pts = new Map();
    let last = null;
    canvas.addEventListener("pointerdown", (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
      if (e.pointerType === "mouse" || pts.size === 2) canvas.setPointerCapture(e.pointerId);
      last = null;
      anim = null;
    });
    canvas.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      const prev = pts.get(e.pointerId);
      if (!prev) {
        if (e.pointerType === "mouse" && M.ready) showInfo(pickAt(e.clientX - r.left, e.clientY - r.top));
        return;
      }
      pts.set(e.pointerId, { ...prev, x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const cur = { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
        if (last) {
          view.cx -= (cur.x - last.x) * view.s;
          view.cy += (cur.y - last.y) * view.s;
          zoomAt(cur.d / last.d, cur.x, cur.y);
        }
        last = cur;
      } else if (e.pointerType === "mouse") {
        view.cx -= (e.clientX - prev.x) * view.s;
        view.cy += (e.clientY - prev.y) * view.s;
        dirty = true;
      }
    });
    const up = (e) => { pts.delete(e.pointerId); last = null; };
    canvas.addEventListener("pointerup", (e) => {
      const r = canvas.getBoundingClientRect();
      const p = pts.get(e.pointerId);
      if (e.pointerType !== "mouse" && pts.size === 1 && p && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 8 && M.ready) showInfo(pickAt(e.clientX - r.left, e.clientY - r.top));
      up(e);
    });
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && hl) { info.hidden = true; hl.visible = false; dirty = true; } });
    canvas.addEventListener("dblclick", (e) => {
      const r = canvas.getBoundingClientRect();
      flyZoom(2.5, e.clientX - r.left, e.clientY - r.top);
    });
    let wheelT = 0;
    canvas.addEventListener("wheel", (e) => {
      if (!(e.ctrlKey || e.metaKey)) {
        const hint = q(".mosaic-wheel");
        hint.hidden = false;
        clearTimeout(wheelT);
        wheelT = setTimeout(() => { hint.hidden = true; }, 1200);
        return;
      }
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    art.querySelectorAll(".mosaic-zoom button").forEach((b) => b.addEventListener("click", () => {
      flyZoom(Number(b.dataset.z) > 0 ? 2 : 0.5, W() / 2, H() / 2);
    }));
    art.querySelectorAll(".mosaic-jumps button").forEach((b) => b.addEventListener("click", () => {
      const w = b.dataset.go;
      const best = M.meta && M.meta.best && M.meta.best[w];
      if (w === "all" || !best) flyTo(0, 0, fitScale());
      else flyTo(best[0], best[1], 1.1 / Math.min(W(), H()));
    }));
  }

  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    const load = window.THREE ? Promise.resolve() : window.NekoLoadThree ? window.NekoLoadThree() : Promise.reject(new Error("three"));
    load.then(init).catch(() => { q(".mosaic-loading").textContent = L("O mosaico não carregou.", "The mosaic did not load."); });
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: "600px 0px" });
    io.observe(art);
  } else go();

  window.addEventListener("nekolang", paintText);
  paintText();
  window.NekoMosaic = {
    get ready() { return M.ready; },
    get tiles() { return [...tiles.entries()].map(([k, t]) => [k, t.state]); },
    view, flyTo, pickAt, showInfo,
  };
})();
