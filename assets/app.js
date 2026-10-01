(function () {
  "use strict";

  const data = window.NEKO_DATA;
  const geo = window.TOKYO23_GEO;
  const legalReference = window.WARD_LEGAL_REFERENCE;
  const context = window.WARD_CONTEXT;
  const rules = window.NEKO_RULES;
  const typologies = window.NEKO_TYPOLOGIES;
  const findings = window.NEKO_FINDINGS;
  const LAW = window.NEKO_LAW;
  const DRAW = window.NekoDraw;
  const photos = window.NEKO_PHOTOS || {};
  const core = window.NekoCore;
  if (!data || !geo || !legalReference || !context || !rules || !typologies || !findings || !LAW || !DRAW || !core) {
    throw new Error("Dados do atlas não carregados.");
  }

  const { houses, metadata } = data;
  const wardLegal = legalReference.wards;
  const wardCtx = context.wards;
  const wardHousing = (window.NEKO_CITY && window.NEKO_CITY.wardHousing) || {};
  const cityData = window.NEKO_CITY || null;

  /* Regime de lote mínimo. A exportação antiga da planilha deixou nove wards
     como "a verificar", com números vindos de outra tabela. A aba NORMA E
     REGIME FUNDIÁRIO, já revista, cobre os 23 e entra por cima. O que não
     estiver nela continua marcado como a verificar. */
  const wardNorms = (() => {
    const merged = {};
    for (const [ward, n] of Object.entries(data.wardNorms || {})) merged[ward] = n;
    const updated = cityData && cityData.wardNorms;
    if (updated) for (const [ward, n] of Object.entries(updated)) merged[ward] = { ...n, status: "registrado" };
    return merged;
  })();

  const state = {
    filters: { query: "", wards: [], onlyFloors: false, year: null, lotArea: null, builtArea: null, far: null, bcr: null, floors: null },
    sort: "lotArea:asc",
    selected: new Set(),
    visibleLimit: 24,
    xAxis: "lotArea",
    yAxis: "far",
    mapMetric: "count",
    wardFocus: null,
    view: "cards",
    drawer: null,
    filtered: houses.slice(),
  };

  const listeners = [];

  const RAMP = ["#eef4f8", "#d3e1eb", "#a9c5d9", "#6f9aba", "#35678f", "#12345d"];
  const REGIME_COLORS = { A: "#12345d", B: "#35678f", C: "#a9c5d9" };
  const REGIME_UNKNOWN = "#e4d4cd";

  const metricConfig = {
    year: { label: "Ano", short: "Ano", decimals: 0, plain: true },
    lotArea: { label: "Área do lote", short: "Lote", unit: "m²", decimals: 2 },
    builtArea: { label: "Área construída", short: "Construída", unit: "m²", decimals: 2 },
    footprintArea: { label: "Projeção", short: "Projeção", unit: "m²", decimals: 2 },
    floors: { label: "Pavimentos", short: "Pav.", decimals: 0 },
    far: { label: "FAR observado", short: "FAR", suffix: "×", decimals: 2 },
    bcr: { label: "BCR observado", short: "BCR", percent: true, decimals: 1 },
  };

  const axisOptions = ["lotArea", "builtArea", "footprintArea", "year", "floors", "far", "bcr"];
  const rangeFields = ["year", "lotArea", "builtArea", "far", "bcr", "floors"];
  const rangeFactor = { bcr: 0.01 };

  function $(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function fmt(value, decimals = 1) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  }

  function formatMetric(field, value, compact = false) {
    if (value == null || !Number.isFinite(Number(value))) return '<span class="lacuna">não registrado</span>';
    const config = metricConfig[field] || { decimals: 2 };
    let display = Number(value);
    if (config.percent) display *= 100;
    if (config.plain) return String(Math.round(display));
    const formatted = fmt(display, compact ? Math.min(config.decimals, 1) : config.decimals);
    if (config.percent) return `${formatted}%`;
    if (config.suffix) return `${formatted}${config.suffix}`;
    if (config.unit) return `${formatted}${compact ? "" : ` ${config.unit}`}`;
    return formatted;
  }

  function plainMetric(field, value) {
    const span = document.createElement("span");
    span.innerHTML = formatMetric(field, value);
    return span.textContent;
  }

  /* ---------- contexto territorial ---------- */

  function ctx(ward) { return wardCtx[ward] || null; }
  function density(ward) {
    const c = ctx(ward);
    return c && c.pop && c.area ? c.pop / c.area : null;
  }

  const mapMetrics = {
    count: { label: "casas no recorte", value: (s) => s.count, format: (v) => Number.isFinite(v) ? fmt(Math.round(v), 0) : "0", zeroIsData: true },
    share: { label: "participação no recorte", value: (s) => s.share, format: (v) => `${fmt((v || 0) * 100, 1)}%`, zeroIsData: true },
    perCapita: { label: "casas por 100 mil hab.", value: (s, w) => { const c = ctx(w); return c && c.pop ? (s.count / c.pop) * 1e5 : null; }, format: (v) => Number.isFinite(v) ? fmt(v, 2) : "—", zeroIsData: true },
    perArea: { label: "casas por km²", value: (s, w) => { const c = ctx(w); return c && c.area ? s.count / c.area : null; }, format: (v) => Number.isFinite(v) ? fmt(v, 2) : "—", zeroIsData: true },
    lotMedian: { label: "lote mediano", value: (s) => s.lotMedian, format: (v) => Number.isFinite(v) ? `${fmt(v, 1)} m²` : "sem casas" },
    farMedian: { label: "FAR mediano", value: (s) => s.farMedian, format: (v) => Number.isFinite(v) ? `${fmt(v, 2)}×` : "sem casas" },
    bcrMedian: { label: "BCR mediano", value: (s) => s.bcrMedian, format: (v) => Number.isFinite(v) ? `${fmt(v * 100, 1)}%` : "sem casas" },
    population: { label: "população", value: (_, w) => ctx(w)?.pop ?? null, format: (v) => Number.isFinite(v) ? fmt(v, 0) : "—" },
    area: { label: "área do ward", value: (_, w) => ctx(w)?.area ?? null, format: (v) => Number.isFinite(v) ? `${fmt(v, 2)} km²` : "—" },
    density: { label: "densidade populacional", value: (_, w) => density(w), format: (v) => Number.isFinite(v) ? `${fmt(v, 0)} hab./km²` : "—" },
    income: { label: "renda média por contribuinte (FY2024)", value: (_, w) => wardHousing[w]?.income ?? null, format: (v) => Number.isFinite(v) ? `¥${fmt(v, 2)} mi` : "—", short: (v) => Number.isFinite(v) ? `¥${fmt(v, 1)}` : "—", housing: true,
      warn: "A renda é a média fiscal tributável por contribuinte, não per capita e não renda do domicílio. Quem não declara imposto fica de fora do denominador." },
    owners: { label: "domicílios proprietários (2023)", value: (_, w) => wardHousing[w]?.owners ?? null, format: (v) => Number.isFinite(v) ? `${fmt(v, 1)}%` : "—", housing: true,
      warn: "Proprietários e inquilinos não somam 100%: o restante são domicílios sem condição de ocupação declarada." },
    renters: { label: "domicílios inquilinos (2023)", value: (_, w) => wardHousing[w]?.renters ?? null, format: (v) => Number.isFinite(v) ? `${fmt(v, 1)}%` : "—", housing: true,
      warn: "Proprietários e inquilinos não somam 100%: o restante são domicílios sem condição de ocupação declarada." },
    dwellArea: { label: "área média da moradia (2023)", value: (_, w) => wardHousing[w]?.dwellArea ?? null, format: (v) => Number.isFinite(v) ? `${fmt(v, 1)} m²` : "—", housing: true,
      warn: "Área média de todas as moradias do ward, apartamentos incluídos. Não é a área das casas do corpus." },
    onePerson: { label: "domicílios de uma pessoa (2020)", value: (_, w) => wardHousing[w]?.onePerson ?? null, format: (v) => Number.isFinite(v) ? `${fmt(v, 1)}%` : "—", housing: true },
    aged: { label: "população de 65 anos ou mais (2020)", value: (_, w) => wardHousing[w]?.aged ?? null, format: (v) => Number.isFinite(v) ? `${fmt(v, 1)}%` : "—", housing: true },
    bcrRefMin: { label: "menor BCR designado no ward", value: (_, w) => wardLegal[w]?.bcrMin ?? null, format: (v) => Number.isFinite(v) ? `${v}%` : "ausente do A29" },
    farRefMin: { label: "menor FAR designado no ward", value: (_, w) => wardLegal[w]?.farMin ?? null, format: (v) => Number.isFinite(v) ? `${fmt(v / 100, 1)}×` : "ausente do A29" },
    farRefMax: { label: "maior FAR designado no ward", value: (_, w) => wardLegal[w]?.farMax ?? null, format: (v) => Number.isFinite(v) ? `${fmt(v / 100, 1)}×` : "ausente do A29" },
    regime: { categorical: true, label: "regime de lote mínimo", value: (_, w) => wardNorms[w]?.regimeCode ?? (wardNorms[w]?.status === "verificar" ? "?" : null), format: (v) => v === "A" ? "A · mínimo em todo o ward" : v === "B" ? "B · só em áreas delimitadas" : v === "C" ? "C · não define mínimo" : "a verificar" },
  };

  function metricValueFor(ward, summaries) {
    const config = mapMetrics[state.mapMetric];
    return config.value(summaries[ward], ward);
  }

  /* ---------- filtros ---------- */

  function readRange(field) {
    const factor = rangeFactor[field] || 1;
    const read = (suffix) => {
      const el = $(`${field}-${suffix}`);
      const raw = el.value.trim();
      if (!raw) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n * factor : null;
    };
    const min = read("min"), max = read("max");
    return min == null && max == null ? null : { min, max };
  }

  function syncFiltersFromInputs() {
    const next = {};
    for (const field of rangeFields) next[field] = readRange(field);
    const check = core.validateRanges(next);
    for (const field of rangeFields) {
      const bad = check.invalid.includes(field);
      const fieldset = $(`${field}-min`).closest("fieldset");
      if (fieldset) fieldset.classList.toggle("invalid", bad);
      $(`${field}-min`).setAttribute("aria-invalid", String(bad));
      $(`${field}-max`).setAttribute("aria-invalid", String(bad));
    }
    $("filter-error").hidden = check.valid;
    if (!check.valid) return;
    Object.assign(state.filters, next);
    state.filters.query = $("query").value;
    state.filters.onlyFloors = $("only-floors").checked;
    state.visibleLimit = 24;
    renderAll();
  }

  let restoring = false;

  function writeUrlState() {
    if (restoring) return;
    const p = new URLSearchParams();
    const f = state.filters;
    if (f.query) p.set("q", f.query);
    if (f.wards.length) p.set("ward", f.wards.join(","));
    if (f.onlyFloors) p.set("pav", "1");
    if (f.ids === CH9) p.set("cap9", "1");
    for (const field of rangeFields) {
      const r = f[field];
      if (!r) continue;
      const factor = rangeFactor[field] || 1;
      if (r.min != null) p.set(field + "Min", String(+(r.min / factor).toFixed(4)));
      if (r.max != null) p.set(field + "Max", String(+(r.max / factor).toFixed(4)));
    }
    if (state.sort !== "lotArea:asc") p.set("ord", state.sort);
    if (state.selected.size) p.set("sel", [...state.selected].join(","));
    if (state.mapMetric !== "count") p.set("mapa", state.mapMetric);
    const qs = p.toString();
    const hash = location.hash.startsWith("#") && !location.hash.includes("=") && location.hash.length > 1 && !qs
      ? location.hash : (qs ? "#" + qs : "");
    history.replaceState(null, "", location.pathname + (hash || ""));
  }

  function readUrlState() {
    const raw = location.hash.replace(/^#/, "");
    if (!raw || !raw.includes("=")) return false;
    restoring = true;
    const p = new URLSearchParams(raw);
    if (p.get("q")) { state.filters.query = p.get("q"); $("query").value = p.get("q"); }
    if (p.get("ward")) state.filters.wards = p.get("ward").split(",").filter(Boolean);
    if (p.get("pav") === "1") { state.filters.onlyFloors = true; $("only-floors").checked = true; }
    if (p.get("cap9") === "1") { state.filters.ids = CH9; $("filter-ch9").classList.add("active"); }
    for (const field of rangeFields) {
      const factor = rangeFactor[field] || 1;
      const mn = p.get(field + "Min"), mx = p.get(field + "Max");
      if (mn != null) $(`${field}-min`).value = mn;
      if (mx != null) $(`${field}-max`).value = mx;
      if (mn != null || mx != null) {
        state.filters[field] = { min: mn != null ? Number(mn) * factor : null, max: mx != null ? Number(mx) * factor : null };
      }
    }
    if (p.get("ord")) { state.sort = p.get("ord"); $("sort").value = state.sort; }
    if (p.get("sel")) p.get("sel").split(",").filter(Boolean).slice(0, 4).forEach((id) => state.selected.add(id));
    if (p.get("mapa")) { state.mapMetric = p.get("mapa"); $("map-metric").value = state.mapMetric; }
    restoring = false;
    return true;
  }

  function otherFiltersWithoutWards() { return { ...state.filters, wards: [] }; }
  function territoryBase() { return core.filterHouses(houses, otherFiltersWithoutWards()); }
  function metricValues(field) { return state.filtered.map((h) => h[field]).filter(Number.isFinite); }

  /* ---------- 01 achados ---------- */

  const CH9 = ["h017-house-in-a-plum-grove", "h089-small-house-unemori-architects", "h094-tsubomi-house-tokyo-bud-house",
    "h117-tunnel-house", "h124-1-8-m-width-house", "h192-milk-carton-house", "h203-open-sky-house",
    "h202-love-house", "h206-6-tsubo-house", "h244-m-residence", "h217-flagpole-in-nakameguro",
    "h256-building-frame-of-the-house", "h267-nakano-house"];

  const stackOf = (h) => (h.footprintArea > 0 ? h.builtArea / h.footprintArea : NaN);

  /* Pavimentos: o número registrado na planilha. Quando ela separa subsolo (B1)
     ou loft, o número conta só os pavimentos e a anotação original fica em
     floorsNote. Registro que não se reduz a inteiro (níveis escalonados, meio
     pavimento) fica fora da contagem, mas aparece na ficha. */
  const levelsOf = (h) => (Number.isFinite(h.floors) ? h.floors + (h.basement || 0) : NaN);
  const isFloorsOdd = (h) => Number.isFinite(h.floors) && stackOf(h) > levelsOf(h) + 0.35;
  function compactFloors(h) {
    if (!Number.isFinite(h.floors)) return "";
    if (h.basement) return `B${h.basement}+${h.floors}`;
    if (h.loft) return `${h.floors}+loft`;
    return String(h.floors);
  }
  function floorsFull(h) {
    if (h.floorsNote) return escapeHtml(h.floorsNote);
    return Number.isFinite(h.floors) ? String(h.floors) : '<span class="lacuna">não registrado</span>';
  }

  function corpusStats() {
    const all = houses;
    const band = (pred) => all.filter(pred);
    const small = band((h) => h.lotArea < 40), big = band((h) => h.lotArea >= 80);
    const mid = band((h) => h.lotArea >= 40 && h.lotArea < 60), mid2 = band((h) => h.lotArea >= 60 && h.lotArea < 80);
    const rho = (f, g) => core.spearman(all.map((h) => [f(h), g(h)]))?.rho ?? NaN;
    const byDecade = {};
    for (const h of all) { const d = Math.floor(h.year / 10) * 10; (byDecade[d] = byDecade[d] || []).push(h); }
    const withFloors = all.filter((h) => Number.isFinite(h.floors));
    const floorCounts = {};
    withFloors.forEach((h) => { floorCounts[h.floors] = (floorCounts[h.floors] || 0) + 1; });
    return {
      all, small, mid, mid2, big, rho, byDecade, withFloors, floorCounts,
      bands: [
        { label: "< 40 m²", set: small }, { label: "40 a 60", set: mid },
        { label: "60 a 80", set: mid2 }, { label: "≥ 80 m²", set: big },
      ],
    };
  }

  const CS = corpusStats();
  const medOf = (set, f) => core.median(set.map(f));

  function findingTokens() {
    const t = {
      n: String(houses.length),
      farSmall: fmt(medOf(CS.small, (h) => h.far), 2), farBig: fmt(medOf(CS.big, (h) => h.far), 2),
      bcrSmall: fmt(medOf(CS.small, (h) => h.bcr) * 100, 1), bcrBig: fmt(medOf(CS.big, (h) => h.bcr) * 100, 1),
      stackSmall: fmt(medOf(CS.small, stackOf), 2), stackBig: fmt(medOf(CS.big, stackOf), 2),
      rhoFar: fmt(CS.rho((h) => h.lotArea, (h) => h.far), 2),
      rhoBcr: fmt(CS.rho((h) => h.lotArea, (h) => h.bcr), 2),
      rhoStack: fmt(CS.rho((h) => h.lotArea, stackOf), 2),
      rhoBuilt: fmt(CS.rho((h) => h.lotArea, (h) => h.builtArea), 2),
      rhoYear: fmt(CS.rho((h) => h.year, (h) => h.lotArea), 2),
      builtSmall: fmt(medOf(CS.small, (h) => h.builtArea), 1), builtBig: fmt(medOf(CS.big, (h) => h.builtArea), 1),
      builtGap: fmt(medOf(CS.big, (h) => h.builtArea) - medOf(CS.small, (h) => h.builtArea), 1),
      lot2000: fmt(medOf(CS.byDecade[2000] || [], (h) => h.lotArea), 1),
      lot2010: fmt(medOf(CS.byDecade[2010] || [], (h) => h.lotArea), 1),
      lot2020: fmt(medOf(CS.byDecade[2020] || [], (h) => h.lotArea), 1),
      stack2000: fmt(medOf(CS.byDecade[2000] || [], stackOf), 2),
      stack2020: fmt(medOf(CS.byDecade[2020] || [], stackOf), 2),
      floorsN: String(CS.withFloors.length),
      floorsMissing: String(houses.length - CS.withFloors.length),
      floors3: String(CS.floorCounts[3] || 0),
      floors234: String((CS.floorCounts[2] || 0) + (CS.floorCounts[3] || 0) + (CS.floorCounts[4] || 0)),
      floorsShare: fmt(((CS.floorCounts[3] || 0) / CS.withFloors.length) * 100, 0),
      floorsOdd: String(houses.filter(isFloorsOdd).length),
    };
    return t;
  }

  function fill(text, t) { return String(text).replace(/\{(\w+)\}/g, (_, k) => (k in t ? t[k] : `{${k}}`)); }

  function miniBars(rows, opts) {
    const o = Object.assign({ w: 470, h: 190, label: "", labelWidth: 96 }, opts || {});
    const m = { t: 18, r: 16, b: 34, l: o.labelWidth };
    const iw = o.w - m.l - m.r, rowH = (o.h - m.t - m.b) / rows.length;
    const max = Math.max(...rows.map((r) => r.value), 0.0001);
    const out = [];
    rows.forEach((r, i) => {
      const y = m.t + i * rowH + rowH * 0.18, hh = rowH * 0.56;
      const bw = Math.max(2, (r.value / max) * iw);
      const inside = bw > iw * 0.55;
      out.push(`<text x="${m.l - 10}" y="${y + hh * 0.75}" class="mini-label-text">${escapeHtml(r.label)}</text>`);
      out.push(`<rect x="${m.l}" y="${y}" width="${iw}" height="${hh}" rx="4" class="mini-bar-bg"/>`);
      out.push(`<rect x="${m.l}" y="${y}" width="${bw}" height="${hh}" rx="4" class="mini-bar${r.highlight ? " hot" : ""}"/>`);
      out.push(`<text x="${m.l + bw + (inside ? -8 : 8)}" y="${y + hh * 0.78}" class="mini-value${inside ? " inside" : ""}" text-anchor="${inside ? "end" : "start"}">${escapeHtml(r.display)}</text>`);
      if (r.sub) out.push(`<text x="${m.l - 10}" y="${y + hh * 0.75 + 13}" class="mini-sub">${escapeHtml(r.sub)}</text>`);
    });
    if (o.label) out.push(`<text x="${o.w / 2}" y="${o.h - 8}" class="mini-axis">${escapeHtml(o.label)}</text>`);
    return `<svg viewBox="0 0 ${o.w} ${o.h}" role="img" aria-label="${escapeHtml(o.label || "gráfico")}">${out.join("")}</svg>`;
  }

  function findingChart(kind) {
    if (kind === "bands") {
      return miniBars(CS.bands.map((b) => ({
        label: b.label, sub: `n = ${b.set.length}`,
        value: medOf(b.set, stackOf) || 0,
        display: `${fmt(medOf(b.set, stackOf), 2)}× · ${fmt(medOf(b.set, (h) => h.bcr) * 100, 1)}%`,
        highlight: b.label === "< 40 m²",
      })), { label: "empilhamento equivalente mediano, por faixa de lote" });
    }
    if (kind === "built") {
      return miniBars(CS.bands.map((b) => ({
        label: b.label, sub: `n = ${b.set.length}`,
        value: medOf(b.set, (h) => h.builtArea) || 0,
        display: `${fmt(medOf(b.set, (h) => h.builtArea), 1)} m²`,
        highlight: b.label === "≥ 80 m²",
      })), { label: "área construída mediana, por faixa de lote" });
    }
    if (kind === "decades") {
      const ds = Object.keys(CS.byDecade).map(Number).sort();
      return miniBars(ds.map((d) => ({
        label: `${d}s`, sub: `n = ${CS.byDecade[d].length}`,
        value: medOf(CS.byDecade[d], (h) => h.lotArea) || 0,
        display: `${fmt(medOf(CS.byDecade[d], (h) => h.lotArea), 1)} m²`,
        highlight: CS.byDecade[d].length >= 30,
      })), { h: 236, label: "lote mediano por década · n baixo antes de 2000" });
    }
    if (kind === "floors") {
      const ks = Object.keys(CS.floorCounts).map(Number).sort();
      return miniBars(ks.map((k) => ({
        label: `${k} pav.`, value: CS.floorCounts[k],
        display: String(CS.floorCounts[k]), highlight: k === 3,
      })), { h: 214, label: `pavimentos registrados em ${CS.withFloors.length} fichas` });
    }
    return "";
  }

  function renderFindings() {
    const t = findingTokens();
    $("findings-lede").textContent = fill(findings.lede, t);
    $("findings-list").innerHTML = findings.items.map((f) => `
      <article class="finding panel">
        <div class="finding-head">
          <span class="finding-number">${escapeHtml(f.number)}</span>
          <h3>${escapeHtml(f.claim)}</h3>
        </div>
        <div class="finding-body">
          <div>
            <p class="finding-text">${escapeHtml(fill(f.body, t))}</p>
            <p class="finding-method"><span>método</span>${escapeHtml(fill(f.method, t))}</p>
            <p class="finding-caveat"><span>ressalva</span>${escapeHtml(fill(f.caveat, t))}</p>
          </div>
          <div class="finding-chart">${findingChart(f.chart)}</div>
        </div>
      </article>`).join("");
  }

  function renderScale() {
    const sc = findings.scale;
    const minLot = Math.min(...houses.map((h) => h.lotArea));
    const minHouse = houses.find((h) => h.lotArea === minLot);
    const medLot = core.median(houses.map((h) => h.lotArea));
    const resolved = sc.items.map((it) => {
      const value = it.field === "minLot" ? minLot : it.field === "medLot" ? medLot : it.value;
      const note = it.field === "minLot" ? `${minHouse.name} · ${minHouse.ward} ${minHouse.year}` : fill(it.note, { n: String(houses.length) });
      return { ...it, value, note };
    }).sort((a, b) => a.value - b.value);
    const max = Math.max(...resolved.map((r) => r.value));
    $("scale-title").textContent = sc.title;
    $("scale-lede").textContent = sc.lede;
    $("scale-rows").innerHTML = resolved.map((r) => `
      <div class="scale-row ${escapeHtml(r.kind)}">
        <span class="scale-label">${escapeHtml(r.label)}</span>
        <span class="scale-track"><span class="scale-fill" style="width:${(r.value / max) * 100}%"></span></span>
        <strong class="scale-value">${fmt(r.value, r.value < 25 ? 2 : 1)} m²</strong>
        <span class="scale-note">${escapeHtml(r.note)}</span>
      </div>`).join("");
    $("scale-cat").textContent = fill(sc.catNote, {
      minLot: fmt(minLot, 2),
      catCount: fmt(Math.round(minLot / 0.1), 0),
    });
  }

  function renderHistogram() {
    const svg = $("lot-histogram");
    svg.innerHTML = "";
    const W = 860, H = 300, m = { t: 22, r: 22, b: 52, l: 52 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const step = 10, lo = 20, hi = 100;
    const bins = [];
    for (let a = lo; a < hi; a += step) {
      const set = houses.filter((h) => h.lotArea >= a && h.lotArea < a + step);
      bins.push({ a, b: a + step, n: set.length, set });
    }
    const max = Math.max(...bins.map((b) => b.n));
    const bw = iw / bins.length;
    for (let i = 0; i <= 4; i += 1) {
      const v = (max * i) / 4, y = m.t + ih - (v / max) * ih;
      svg.insertAdjacentHTML("beforeend", `<line x1="${m.l}" x2="${m.l + iw}" y1="${y}" y2="${y}" class="grid-line"/><text x="${m.l - 10}" y="${y + 4}" class="axis-text" text-anchor="end">${Math.round(v)}</text>`);
    }
    bins.forEach((b, i) => {
      const h = (b.n / max) * ih, x = m.l + i * bw + 4, y = m.t + ih - h;
      const median = core.median(b.set.map((s) => s.far));
      svg.insertAdjacentHTML("beforeend",
        `<rect x="${x}" y="${y}" width="${bw - 8}" height="${h}" rx="4" class="hist-bar" tabindex="0" role="button" data-bin="${b.a}" aria-label="${b.n} casas entre ${b.a} e ${b.b} metros quadrados"/>`
        + `<text x="${x + (bw - 8) / 2}" y="${y - 7}" class="hist-value">${b.n}</text>`
        + `<text x="${x + (bw - 8) / 2}" y="${m.t + ih + 20}" class="axis-text">${b.a}</text>`);
      const rect = svg.querySelector(`[data-bin="${b.a}"]`);
      const tip = (e) => showTip("hist-tooltip", svg, e, `<strong>${b.a} a ${b.b} m²</strong>${b.n} casas · ${fmt((b.n / houses.length) * 100, 1)}% do corpus<br>FAR mediano: ${fmt(median, 2)}×<br>lote mediano: ${fmt(core.median(b.set.map((s) => s.lotArea)), 1)} m²`);
      rect.addEventListener("mouseenter", tip); rect.addEventListener("mousemove", tip); rect.addEventListener("focus", tip);
      rect.addEventListener("mouseleave", () => { $("hist-tooltip").hidden = true; });
      rect.addEventListener("blur", () => { $("hist-tooltip").hidden = true; });
      rect.addEventListener("click", () => {
        $("lotArea-min").value = b.a; $("lotArea-max").value = b.b;
        syncFiltersFromInputs();
        document.getElementById("explorar").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    svg.insertAdjacentHTML("beforeend", `<line x1="${m.l}" x2="${m.l + iw}" y1="${m.t + ih}" y2="${m.t + ih}" class="axis-line"/>`
      + `<text x="${m.l + iw / 2}" y="${H - 12}" class="axis-text">área do lote · m², faixas de 10 em 10</text>`);
    const q1 = core.median(houses.map((h) => h.lotArea));
    $("hist-note").innerHTML = `Mediana em <strong>${fmt(q1, 1)} m²</strong>. Abaixo de 60 m² estão ${houses.filter((h) => h.lotArea < 60).length} das ${houses.length} fichas; abaixo de 40 m², apenas ${houses.filter((h) => h.lotArea < 40).length}. O corte de 100 m² é operacional e não uma fronteira encontrada no dado. Clique numa barra para levar a faixa ao explorador. Fonte: aba 01 casas base.`;
  }

  /* ---------- 02 explorar ---------- */

  function renderStats() {
    const full = houses;
    const delta = (now, all, unit, dec) => {
      if (!Number.isFinite(now) || !Number.isFinite(all)) return "";
      const d = now - all;
      if (Math.abs(d) < Math.pow(10, -dec) / 2) return `<em class="stat-delta flat">igual ao corpus</em>`;
      return `<em class="stat-delta ${d > 0 ? "up" : "down"}">${d > 0 ? "+" : "−"}${fmt(Math.abs(d), dec)}${unit} vs corpus</em>`;
    };
    const medLot = core.median(metricValues("lotArea"));
    const medFar = core.median(metricValues("far"));
    const medBcr = core.median(metricValues("bcr"));
    const cards = [
      { value: String(state.filtered.length), label: "casas no recorte atual",
        extra: state.filtered.length === full.length ? `<em class="stat-delta flat">corpus inteiro</em>` : `<em class="stat-delta">${fmt((state.filtered.length / full.length) * 100, 1)}% das ${full.length}</em>` },
      { value: `${fmt(medLot, 1)} m²`, label: "lote mediano", extra: delta(medLot, core.median(full.map((h) => h.lotArea)), " m²", 1) },
      { value: `${fmt(medFar, 2)}×`, label: "FAR mediano observado", extra: delta(medFar, core.median(full.map((h) => h.far)), "×", 2) },
      { value: `${fmt((medBcr || 0) * 100, 1)}%`, label: "BCR mediano observado", extra: delta((medBcr || 0) * 100, core.median(full.map((h) => h.bcr)) * 100, " pontos", 1) },
    ];
    $("stat-strip").innerHTML = cards.map((c) => `
      <article class="stat-card panel"><strong>${escapeHtml(c.value)}</strong><span>${escapeHtml(c.label)}</span>${c.extra || ""}</article>`).join("");
  }

  function candidateTags(house) {
    const tags = [];
    const extreme = (field, mode) => {
      const values = state.filtered.map((h) => h[field]).filter(Number.isFinite);
      if (!values.length || house[field] == null) return false;
      return house[field] === (mode === "min" ? Math.min(...values) : Math.max(...values));
    };
    if (extreme("lotArea", "min")) tags.push("menor lote do recorte");
    if (extreme("far", "max")) tags.push("maior FAR do recorte");
    if (extreme("bcr", "max")) tags.push("maior BCR do recorte");
    if (extreme("year", "min")) tags.push("mais antiga do recorte");
    if (extreme("year", "max")) tags.push("mais recente do recorte");
    return tags.slice(0, 2);
  }

  function wardRangeChip(ward, field) {
    const ref = wardLegal[ward];
    if (!ref || !ref.available) return '<span class="legal-reference muted">faixa do ward: ausente do A29-2019</span>';
    const values = field === "far" ? ref.farValues : ref.bcrValues;
    if (!values || !values.length) return '<span class="legal-reference muted">faixa do ward: ausente do A29-2019</span>';
    const min = values[0], max = values[values.length - 1];
    const text = field === "far"
      ? `faixa do ward: ${fmt(min / 100, 1)}× a ${fmt(max / 100, 1)}×`
      : `faixa do ward: ${min}% a ${max}%`;
    return `<span class="legal-reference">${escapeHtml(text)}</span>`;
  }

  function photoFor(house) {
    const p = photos[house.id];
    if (!p || !p.file || !p.credit || !p.rights) return "";
    const restricted = /restrit/i.test(p.rights || "");
    const src = `assets/photos/${encodeURIComponent(p.file)}`;
    const record = [p.rights, p.scope, p.note, p.verify ? `a verificar: ${p.verify}` : ""].filter(Boolean).join(" · ");
    return `<figure class="house-photo${restricted ? " restricted" : ""}">
      <a class="house-photo-link" href="${src}" target="_blank" rel="noopener" aria-label="Abrir a foto de ${escapeHtml(house.name)} em tamanho maior">
        <img src="${src}" alt="${escapeHtml(p.caption || house.name)}" loading="lazy" decoding="async">
      </a>
      <figcaption title="${escapeHtml(record)}">${escapeHtml(p.credit)}${p.verify ? ' <span class="photo-verify">[VERIFICAR]</span>' : ""}</figcaption>
    </figure>`;
  }

  function renderActiveWards() {
    $("active-wards").innerHTML = state.filters.wards.map((ward) =>
      `<button type="button" class="filter-chip" data-remove-ward="${escapeHtml(ward)}">${escapeHtml(ward)} ×</button>`).join("");
  }

  /* ---------- modo tabela ---------- */

  const TABLE_COLS = [
    { key: "n", label: "nº", cell: (h) => String(h.n).padStart(3, "0"), num: true },
    { key: "name", label: "casa", cell: (h) => escapeHtml(h.name) },
    { key: "architect", label: "escritório", cell: (h) => escapeHtml(h.architect) },
    { key: "ward", label: "ward", cell: (h) => escapeHtml(h.ward) },
    { key: "year", label: "ano", cell: (h) => String(h.year), num: true },
    { key: "lotArea", label: "lote m²", cell: (h) => fmt(h.lotArea, 1), num: true },
    { key: "builtArea", label: "constr. m²", cell: (h) => fmt(h.builtArea, 1), num: true },
    { key: "footprintArea", label: "projeção m²", cell: (h) => fmt(h.footprintArea, 1), num: true },
    { key: "floors", label: "pav.", cell: (h) => compactFloors(h) ? escapeHtml(compactFloors(h)) : `<span class="lacuna"${h.floorsNote ? ` title="${escapeHtml(h.floorsNote)}"` : ""}>—</span>`, num: true },
    { key: "far", label: "FAR", cell: (h) => fmt(h.far, 2), num: true },
    { key: "bcr", label: "BCR", cell: (h) => `${fmt(h.bcr * 100, 1)}%`, num: true },
  ];

  function renderTable(sorted) {
    const [sortKey, sortDir] = state.sort.split(":");
    const head = TABLE_COLS.map((c) => {
      const active = c.key === sortKey;
      const arrow = active ? (sortDir === "asc" ? " ▲" : " ▼") : "";
      return `<th scope="col" class="${c.num ? "num" : ""}${active ? " sorted" : ""}">
        <button type="button" data-sort-col="${c.key}" aria-label="Ordenar por ${escapeHtml(c.label)}">${escapeHtml(c.label)}${arrow}</button></th>`;
    }).join("");
    const body = sorted.map((h) => {
      const sel = state.selected.has(h.id);
      return `<tr data-card-id="${escapeHtml(h.id)}" class="${sel ? "selected" : ""}">
        ${TABLE_COLS.map((c) => `<td class="${c.num ? "num" : ""}">${c.cell(h)}</td>`).join("")}
        <td class="row-actions">
          <button type="button" class="row-button" data-open-id="${escapeHtml(h.id)}">ficha</button>
          <button type="button" class="row-button" data-house-id="${escapeHtml(h.id)}">${sel ? "retirar" : "comparar"}</button>
        </td></tr>`;
    }).join("");
    return `<div class="table-scroll"><table class="dense-table">
      <thead><tr>${head}<th scope="col"><span class="sr-only">ações</span></th></tr></thead>
      <tbody>${body}</tbody></table></div>
      <p class="table-note">A tabela mostra as ${sorted.length} fichas do recorte, sem paginação. Campo sem dado aparece como traço, nunca como zero.</p>`;
  }

  /* ---------- gaveta da ficha ---------- */

  function similarHouses(house, n = 3) {
    const pool = houses.filter((h) => h.id !== house.id);
    const scale = (f) => {
      const vals = houses.map((h) => h[f]).filter(Number.isFinite);
      const min = Math.min(...vals), max = Math.max(...vals);
      return (v) => (Number.isFinite(v) && max > min ? (v - min) / (max - min) : null);
    };
    const S = { lotArea: scale("lotArea"), far: scale("far"), bcr: scale("bcr"), builtArea: scale("builtArea") };
    const dist = (h) => {
      let sum = 0, used = 0;
      for (const f of Object.keys(S)) {
        const a = S[f](house[f]), b = S[f](h[f]);
        if (a == null || b == null) continue;
        sum += (a - b) ** 2; used += 1;
      }
      return used >= 3 ? Math.sqrt(sum / used) : Infinity;
    };
    return pool.map((h) => ({ h, d: dist(h) })).filter((x) => Number.isFinite(x.d))
      .sort((a, b) => a.d - b.d).slice(0, n).map((x) => x.h);
  }

  function distributionRow(field, house) {
    const value = house[field];
    if (!Number.isFinite(value)) return "";
    const values = houses.map((h) => h[field]).filter(Number.isFinite).sort((a, b) => a - b);
    if (!values.length) return "";
    const min = values[0], max = values[values.length - 1];
    const pos = max > min ? ((value - min) / (max - min)) * 100 : 50;
    const p = core.percentile(value, values);
    const med = core.median(values);
    const medPos = max > min ? ((med - min) / (max - min)) * 100 : 50;
    return `<div class="dist-row">
      <div class="dist-head"><span>${escapeHtml(metricConfig[field].short)}</span><strong>${formatMetric(field, value)}</strong></div>
      <div class="dist-track" role="img" aria-label="Posição de ${escapeHtml(metricConfig[field].short)} entre as ${houses.length} fichas: percentil ${p}">
        <span class="dist-median" style="left:${medPos.toFixed(1)}%"></span>
        <span class="dist-dot" style="left:${pos.toFixed(1)}%"></span>
      </div>
      <div class="dist-foot"><span>${plainMetric(field, min)}</span><span>${p == null ? "" : `P${p} · mediana ${formatMetric(field, med, true)}`}</span><span>${plainMetric(field, max)}</span></div>
    </div>`;
  }

  function drawerWardMap(ward) {
    const W = 220, H = 150;
    const project = projection(W, H, 8);
    const shapes = geo.features.map((f) => {
      const name = f.properties.ward || f.properties.name;
      const on = name === ward;
      return `<path d="${pathFor(f, project)}" fill="${on ? "#12345d" : "#e7eef4"}" stroke="#ffffff" stroke-width="0.6"></path>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="drawer-map" role="img" aria-label="${escapeHtml(ward)} nos 23 wards">${shapes}</svg>`;
  }

  function renderDrawer() {
    const wrap = $("house-drawer");
    if (!wrap) return;
    const house = state.drawer ? houses.find((h) => h.id === state.drawer) : null;
    if (!house) {
      wrap.hidden = true;
      wrap.innerHTML = "";
      document.body.classList.remove("drawer-open");
      return;
    }
    const norm = wardNorms[house.ward];
    const legal = wardLegal[house.ward];
    const c = ctx(house.ward);
    const stack = house.footprintArea > 0 ? house.builtArea / house.footprintArea : null;
    const field = (label, value) => value === null || value === undefined || value === ""
      ? "" : `<div class="drawer-field"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`;
    const similar = similarHouses(house);
    wrap.hidden = false;
    document.body.classList.add("drawer-open");
    wrap.innerHTML = `
      <div class="drawer-inner" role="dialog" aria-modal="false" aria-label="Ficha de ${escapeHtml(house.name)}">
        <div class="drawer-head">
          <div>
            <p class="drawer-kicker">ficha ${String(house.n).padStart(3, "0")} · ${escapeHtml(house.ward)} · ${house.year}</p>
            <h3>${escapeHtml(house.name)}</h3>
            <p class="drawer-architect">${escapeHtml(house.architect)}</p>
          </div>
          <button type="button" class="drawer-close" data-close-drawer aria-label="Fechar a ficha">×</button>
        </div>
        <div class="drawer-grid">
          ${field("lote", formatMetric("lotArea", house.lotArea))}
          ${field("área construída", formatMetric("builtArea", house.builtArea))}
          ${field("projeção", formatMetric("footprintArea", house.footprintArea))}
          ${field("pavimentos", floorsFull(house))}
          ${field("FAR observado", formatMetric("far", house.far))}
          ${field("BCR observado", formatMetric("bcr", house.bcr))}
          ${field("empilhamento equivalente", stack ? `${fmt(stack, 2)}×` : '<span class="lacuna">sem projeção</span>')}
          ${field("solo não coberto", Number.isFinite(house.bcr) ? `${fmt((1 - house.bcr) * 100, 1)}%` : "")}
        </div>
        <div class="drawer-dists">
          <h4>Onde esta casa cai, entre as ${houses.length} fichas</h4>
          ${["lotArea", "builtArea", "far", "bcr"].map((f) => distributionRow(f, house)).join("")}
          <p class="muted drawer-src">Medidas e posição: aba 01 casas base. FAR e BCR são calculados aqui, construída e projeção sobre o lote.</p>
        </div>
        <div class="drawer-ward">
          ${drawerWardMap(house.ward)}
          <div>
            <h4>${escapeHtml(house.ward)} <span class="ja">${escapeHtml(c?.ja || "")}</span></h4>
            <p>${legal && legal.available
              ? `BCR designado: ${escapeHtml(legal.bcrValues.join(" / "))}%<br>FAR designado: ${escapeHtml(legal.farValues.join(" / "))}%`
              : '<span class="lacuna">ward ausente do A29-2019</span>'}</p>
            <p class="drawer-norm">${norm && norm.status === "registrado"
              ? `Lote mínimo: ${escapeHtml(norm.minimumLot || "não registrado")} · ${escapeHtml(norm.regime || "")}`
              : "Regime de lote mínimo a verificar"}<br><span class="muted">Faixas designadas: A29-2019 (MLIT), fora da planilha. Regime: aba 11 normas wards.</span></p>
          </div>
        </div>
        <div class="drawer-similar">
          <h4>As mais próximas no recorte comparável</h4>
          <p class="drawer-similar-note">Proximidade calculada sobre lote, área construída, FAR e BCR normalizados. É vizinhança numérica, não parentesco de projeto.</p>
          <ul>${similar.map((h) => `<li><button type="button" data-open-id="${escapeHtml(h.id)}"><strong>${escapeHtml(h.name)}</strong><span>${escapeHtml(h.ward)} · ${h.year} · ${fmt(h.lotArea, 1)} m²</span></button></li>`).join("")}</ul>
        </div>
        <div class="drawer-actions">
          <button type="button" class="primary-button" data-house-id="${escapeHtml(house.id)}">${state.selected.has(house.id) ? "Retirar da mesa" : "Levar para a mesa"}</button>
          ${house.sourceUrl ? `<a class="quiet-button" href="${escapeHtml(house.sourceUrl)}" target="_blank" rel="noreferrer">ver a obra na fonte ↗</a>` : '<span class="muted">fonte não registrada</span>'}
        </div>
      </div>`;
  }

  function openDrawer(id) {
    state.drawer = id;
    renderDrawer();
    const inner = document.querySelector("#house-drawer .drawer-close");
    if (inner) inner.focus({ preventScroll: true });
  }

  function closeDrawer() {
    state.drawer = null;
    renderDrawer();
  }

  /* ---------- seleção ligada ---------- */

  function linkHighlight(id, on) {
    const mark = (nodes) => nodes.forEach((n) => n.classList.toggle("linked", on));
    mark(document.querySelectorAll(`[data-card-id="${CSS.escape(id)}"]`));
    const house = houses.find((h) => h.id === id);
    const point = $("scatter") ? $("scatter").querySelector(`[data-house-id="${CSS.escape(id)}"]`) : null;
    if (point) point.classList.toggle("linked", on);
    if (house) {
      const shape = document.querySelector(`#geo-map [data-ward="${CSS.escape(house.ward)}"]`);
      if (shape) shape.classList.toggle("linked", on);
      const bar = document.querySelector(`#ward-bars [data-ward="${CSS.escape(house.ward)}"]`);
      if (bar) bar.classList.toggle("linked", on);
    }
  }

  function renderList() {
    const sorted = core.sortHouses(state.filtered, state.sort);
    const visible = state.view === "table" ? sorted : sorted.slice(0, state.visibleLimit);
    $("result-count").textContent = `${state.filtered.length} ${state.filtered.length === 1 ? "casa" : "casas"}`;
    if (state.view === "table") {
      $("house-list").innerHTML = sorted.length
        ? renderTable(sorted)
        : '<div class="empty-results">Nenhuma ficha completa atravessa todos estes filtros.</div>';
      $("load-more").hidden = true;
      renderActiveWards();
      return;
    }
    if (!visible.length) {
      $("house-list").innerHTML = '<div class="empty-results">Nenhuma ficha completa atravessa todos estes filtros.</div>';
    } else {
      $("house-list").innerHTML = visible.map((house) => {
        const selected = state.selected.has(house.id);
        const atLimit = state.selected.size >= 4 && !selected;
        const tags = candidateTags(house);
        const floorsOdd = isFloorsOdd(house);
        const noteAttr = house.floorsNote ? ` title="${escapeHtml(house.floorsNote)}"` : "";
        const floors = Number.isFinite(house.floors)
          ? `<div><span>pav.</span><strong${floorsOdd ? ' class="flagged" title="O empilhamento equivalente supera os pavimentos registrados, subsolo incluído. Conferir na planilha."' : noteAttr}>${escapeHtml(compactFloors(house))}${floorsOdd ? " ⚑" : ""}</strong></div>`
          : `<div><span>pav.</span><strong class="soft"${noteAttr}>—</strong></div>`;
        return `<article class="house-card ${selected ? "selected" : ""}" data-card-id="${escapeHtml(house.id)}">
          <div class="house-card-head">
            <span class="house-number">${String(house.n).padStart(3, "0")}</span>
            <span class="coverage-mark">${escapeHtml(house.ward)}</span>
          </div>
          <div>
            <h4>${escapeHtml(house.name)}</h4>
            <p class="architect">${escapeHtml(house.architect)}</p>
            <div class="house-basics">
              <div><span>ano</span><strong>${house.year}</strong></div>
              <div><span>lote</span><strong>${fmt(house.lotArea, 1)}</strong></div>
              ${floors}
            </div>
            <div class="house-ratio-grid">
              <div class="ratio-card"><div class="ratio-value"><span>FAR observado</span><strong>${formatMetric("far", house.far)}</strong></div>${wardRangeChip(house.ward, "far")}</div>
              <div class="ratio-card"><div class="ratio-value"><span>BCR observado</span><strong>${formatMetric("bcr", house.bcr)}</strong></div>${wardRangeChip(house.ward, "bcr")}</div>
            </div>
            <div class="card-tags">${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
            ${house.sourceUrl
              ? `<a class="house-source" href="${escapeHtml(house.sourceUrl)}" target="_blank" rel="noreferrer">ver a obra e as fotos na fonte ↗</a>`
              : '<span class="house-source muted">fonte não registrada</span>'}
          </div>
          <div class="house-card-actions">
            <button class="compare-toggle" type="button" data-house-id="${escapeHtml(house.id)}"${atLimit ? " disabled title=\"Mesa cheia\"" : ""}>${selected ? "Retirar da mesa" : atLimit ? "Mesa cheia" : "Comparar"}</button>
            <button class="ficha-toggle" type="button" data-open-id="${escapeHtml(house.id)}">Ficha completa</button>
          </div>
        </article>`;
      }).join("");
    }
    $("load-more").hidden = state.visibleLimit >= sorted.length || !sorted.length;
    renderActiveWards();
  }

  /* ---------- svg helpers ---------- */

  function svgEl(name, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  function ticks(min, max, count = 5) {
    if (min === max) return [min];
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, i) => min + step * i);
  }

  function showTip(id, svgNode, event, html) {
    const tip = $(id);
    const bounds = svgNode.getBoundingClientRect();
    tip.innerHTML = html;
    tip.hidden = false;
    const cx = event.clientX || bounds.left + bounds.width / 2;
    const cy = event.clientY || bounds.top + bounds.height / 2;
    /* O cursor é um gato de 37 x 48 px pendurado abaixo e à direita da ponta
       da orelha. A etiqueta fica acima do ponteiro e, se não couber, abaixo
       do gato; perto da borda direita, passa para a esquerda. */
    const w = tip.offsetWidth, h = tip.offsetHeight;
    const x = cx - bounds.left, y = cy - bounds.top;
    let left = x + 14;
    if (left + w > bounds.width - 4) left = x - w - 14;
    let top = y - h - 12;
    if (top < 4) top = y + 54;
    tip.style.left = `${Math.max(4, left)}px`;
    tip.style.top = `${top}px`;
  }

  /* ---------- dispersão do corpus ---------- */

  function renderScatter() {
    const svg = $("scatter");
    svg.innerHTML = "";
    const points = state.filtered.filter((h) => Number.isFinite(h[state.xAxis]) && Number.isFinite(h[state.yAxis]));
    const W = 860, H = 410, m = { top: 20, right: 22, bottom: 52, left: 68 };
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
    if (!points.length) {
      const t = svgEl("text", { x: W / 2, y: H / 2, "text-anchor": "middle", class: "axis-text" });
      t.textContent = "Sem pares de dados para os eixos escolhidos";
      svg.appendChild(t);
      return;
    }
    const xs = points.map((h) => h[state.xAxis]), ys = points.map((h) => h[state.yAxis]);
    let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const px = (maxX - minX || 1) * 0.06, py = (maxY - minY || 1) * 0.08;
    minX -= px; maxX += px; minY -= py; maxY += py;
    const X = (v) => m.left + ((v - minX) / (maxX - minX)) * iw;
    const Y = (v) => m.top + ih - ((v - minY) / (maxY - minY)) * ih;

    for (const t of ticks(minX, maxX)) {
      svg.appendChild(svgEl("line", { x1: X(t), x2: X(t), y1: m.top, y2: m.top + ih, class: "grid-line" }));
      const l = svgEl("text", { x: X(t), y: H - 25, "text-anchor": "middle", class: "axis-text" });
      l.textContent = plainMetric(state.xAxis, t); svg.appendChild(l);
    }
    for (const t of ticks(minY, maxY)) {
      svg.appendChild(svgEl("line", { x1: m.left, x2: m.left + iw, y1: Y(t), y2: Y(t), class: "grid-line" }));
      const l = svgEl("text", { x: m.left - 10, y: Y(t) + 3, "text-anchor": "end", class: "axis-text" });
      l.textContent = plainMetric(state.yAxis, t); svg.appendChild(l);
    }
    svg.appendChild(svgEl("line", { x1: m.left, x2: m.left + iw, y1: m.top + ih, y2: m.top + ih, class: "axis-line" }));
    svg.appendChild(svgEl("line", { x1: m.left, x2: m.left, y1: m.top, y2: m.top + ih, class: "axis-line" }));
    const xl = svgEl("text", { x: m.left + iw / 2, y: H - 3, "text-anchor": "middle", class: "axis-text" });
    xl.textContent = metricConfig[state.xAxis].label;
    const yl = svgEl("text", { x: 14, y: m.top + ih / 2, transform: `rotate(-90 14 ${m.top + ih / 2})`, "text-anchor": "middle", class: "axis-text" });
    yl.textContent = metricConfig[state.yAxis].label;
    svg.append(xl, yl);

    for (const house of points) {
      const c = svgEl("circle", {
        cx: X(house[state.xAxis]), cy: Y(house[state.yAxis]), r: 4.2,
        class: `plot-point ${state.selected.has(house.id) ? "selected" : ""}`,
        tabindex: 0, role: "button", "aria-label": `${house.name}: adicionar à comparação`,
      });
      c.dataset.houseId = house.id;
      const tip = (e) => showTip("plot-tooltip", svg, e,
        `<strong>${escapeHtml(house.name)}</strong>${escapeHtml(house.ward)} · ${house.year}<br>${escapeHtml(metricConfig[state.xAxis].short)}: ${formatMetric(state.xAxis, house[state.xAxis])}<br>${escapeHtml(metricConfig[state.yAxis].short)}: ${formatMetric(state.yAxis, house[state.yAxis])}`);
      c.addEventListener("mouseenter", tip);
      c.addEventListener("mousemove", tip);
      c.addEventListener("focus", tip);
      c.addEventListener("mouseleave", () => { $("plot-tooltip").hidden = true; });
      c.addEventListener("blur", () => { $("plot-tooltip").hidden = true; });
      c.addEventListener("click", () => toggleSelection(house.id));
      c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSelection(house.id); } });
      svg.appendChild(c);
    }
  }

  /* ---------- 03 território ---------- */

  function rings(geometry) {
    if (geometry.type === "Polygon") return geometry.coordinates;
    if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
    return [];
  }

  function projection(width, height, padding) {
    const pts = geo.features.flatMap((f) => rings(f.geometry).flat());
    const minLon = Math.min(...pts.map((p) => p[0])), maxLon = Math.max(...pts.map((p) => p[0]));
    const minLat = Math.min(...pts.map((p) => p[1])), maxLat = Math.max(...pts.map((p) => p[1]));
    const scale = Math.min((width - padding * 2) / (maxLon - minLon), (height - padding * 2) / (maxLat - minLat));
    const dw = (maxLon - minLon) * scale, dh = (maxLat - minLat) * scale;
    const ox = (width - dw) / 2, oy = (height - dh) / 2;
    return ([lon, lat]) => [ox + (lon - minLon) * scale, oy + (maxLat - lat) * scale];
  }

  function pathFor(feature, project) {
    return rings(feature.geometry).map((ring) => ring.map((p, i) => {
      const [x, y] = project(p);
      return `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ") + " Z").join(" ");
  }

  function labelPoint(feature, project) {
    const rs = rings(feature.geometry);
    const ring = rs.reduce((best, cur) => (cur.length > best.length ? cur : best), rs[0] || []);
    if (!ring.length) return [0, 0];
    const pr = ring.map(project);
    const xs = pr.map((p) => p[0]), ys = pr.map((p) => p[1]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  }

  function rampColor(value, values, zeroIsData) {
    if (!Number.isFinite(value)) return "#f0eae7";
    const valid = values.filter(Number.isFinite);
    if (!valid.length) return RAMP[0];
    const min = Math.min(...valid), max = Math.max(...valid);
    if (min === max) return RAMP[3];
    if (!zeroIsData && value === 0) return RAMP[0];
    const t = (value - min) / (max - min);
    return RAMP[Math.max(0, Math.min(5, Math.round(t * 5)))];
  }

  function colorFor(ward, summaries, values) {
    const config = mapMetrics[state.mapMetric];
    const value = metricValueFor(ward, summaries);
    if (config.categorical) return value === "?" || value == null ? REGIME_UNKNOWN : (REGIME_COLORS[value] || REGIME_UNKNOWN);
    return rampColor(value, values, config.zeroIsData);
  }

  function renderMapLegend(values) {
    const config = mapMetrics[state.mapMetric];
    if (config.categorical) {
      $("map-legend").innerHTML = [
        ["A", "mínimo em todo o ward", REGIME_COLORS.A],
        ["B", "só em áreas delimitadas", REGIME_COLORS.B],
        ["C", "não define mínimo", REGIME_COLORS.C],
        ["?", "registro a verificar", REGIME_UNKNOWN],
      ].map(([code, label, color]) => `<span class="legend-swatch" style="background:${color}"></span><span>${escapeHtml(code)} · ${escapeHtml(label)}</span>`).join("");
      return;
    }
    const valid = values.filter(Number.isFinite);
    if (!valid.length) { $("map-legend").innerHTML = ""; return; }
    const min = Math.min(...valid), max = Math.max(...valid);
    const samples = Array.from({ length: 6 }, (_, i) => min + ((max - min) * i) / 5);
    $("map-legend").innerHTML = samples.map((v, i) =>
      `<span class="legend-swatch" style="background:${RAMP[i]}"></span><span>${escapeHtml(config.format(v))}</span>`).join("")
      + (values.some((v) => !Number.isFinite(v)) ? `<span class="legend-swatch" style="background:#f0eae7"></span><span>sem dado</span>` : "");
  }

  function renderGeoMap() {
    const svg = $("geo-map");
    svg.innerHTML = "";
    const project = projection(820, 530, 28);
    const summaries = core.wardSummaries(territoryBase(), metadata.wards);
    const config = mapMetrics[state.mapMetric];
    const values = metadata.wards.map((w) => metricValueFor(w, summaries));
    const labels = [];
    $("geo-title").textContent = config.categorical ? "Regime de lote mínimo" : config.label.charAt(0).toUpperCase() + config.label.slice(1);

    for (const feature of geo.features) {
      const ward = feature.properties.ward;
      const summary = summaries[ward];
      const value = metricValueFor(ward, summaries);
      const active = state.filters.wards.includes(ward);
      const path = svgEl("path", {
        d: pathFor(feature, project),
        class: `ward-shape ${active ? "active" : ""}`,
        fill: colorFor(ward, summaries, values),
        tabindex: 0, role: "button", "aria-pressed": String(active),
        "aria-label": `${ward}: ${config.format(value)}; ${summary.count} casas no recorte`,
      });
      path.dataset.ward = ward;
      const c = ctx(ward);
      const tip = (e) => showTip("geo-tooltip", svg, e,
        `<strong>${escapeHtml(ward)} · ${escapeHtml(feature.properties.wardJa)}</strong>`
        + `${escapeHtml(config.label)}: ${escapeHtml(config.format(value))}<br>`
        + `casas no recorte: ${summary.count}<br>`
        + (c ? `densidade: ${fmt(density(ward), 0)} hab./km²<br>` : "")
        + `lote mediano: ${summary.lotMedian == null ? "sem casas" : fmt(summary.lotMedian, 1) + " m²"}`);
      path.addEventListener("mouseenter", tip);
      path.addEventListener("mousemove", tip);
      path.addEventListener("focus", tip);
      path.addEventListener("mouseleave", () => { $("geo-tooltip").hidden = true; });
      path.addEventListener("blur", () => { $("geo-tooltip").hidden = true; });
      path.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleWard(ward); } });
      svg.appendChild(path);

      const [x, y] = labelPoint(feature, project);
      const label = svgEl("text", { x, y: y - 2, class: "geo-label" });
      const name = svgEl("tspan", { x, dy: 0 }); name.textContent = ward;
      const amount = svgEl("tspan", { x, dy: 11, class: "geo-label-value" }); amount.textContent = (config.short || config.format)(value);
      label.append(name, amount);
      labels.push(label);
    }
    labels.forEach((l) => svg.appendChild(l));
    renderMapLegend(values);
    const warn = $("map-warn");
    if (warn) { warn.hidden = !config.warn; warn.textContent = config.warn || ""; }
    const housingSrc = config.housing ? ` ${escapeHtml(config.label.charAt(0).toUpperCase() + config.label.slice(1))}: aba 23 painel renda habitação, seção 5, conferida com a aba 07 contexto wards (${escapeHtml(config === mapMetrics.income ? "Governo Metropolitano de Tóquio, tributação municipal FY2024, tabela 12" : config === mapMetrics.onePerson ? "Censo 2020" : config === mapMetrics.aged ? "projeção populacional de Tóquio 2023, dados de 2020" : "Housing and Land Survey 2023")}).` : "";
    $("map-source").innerHTML = `Limites administrativos N03-2021 (MLIT), simplificados por SmartNews Media Research Institute. ${escapeHtml(context.source.note)} População e área: ${escapeHtml(context.source.demography)}. As casas aparecem agregadas por ward porque a planilha não traz coordenadas. Fonte das casas: aba 01 casas base; regime de lote mínimo: aba 11 normas wards; população e área não vêm da planilha.${housingSrc}`;
  }

  function renderWardBars() {
    const svg = $("ward-bars");
    svg.innerHTML = "";
    const summaries = core.wardSummaries(territoryBase(), metadata.wards);
    const config = mapMetrics[state.mapMetric];
    const numeric = !config.categorical;
    $("bars-title").textContent = numeric ? config.label.charAt(0).toUpperCase() + config.label.slice(1) : "Casas por ward";

    const rows = metadata.wards.map((ward) => ({
      ward,
      value: numeric ? metricValueFor(ward, summaries) : summaries[ward].count,
      count: summaries[ward].count,
    })).sort((a, b) => {
      const av = Number.isFinite(a.value) ? a.value : -Infinity;
      const bv = Number.isFinite(b.value) ? b.value : -Infinity;
      return bv - av || a.ward.localeCompare(b.ward);
    });

    const W = 620, rowH = 29, top = 13, left = 92, right = 74;
    const H = top * 2 + rows.length * rowH;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const max = Math.max(1, ...rows.map((r) => (Number.isFinite(r.value) ? r.value : 0)));
    const iw = W - left - right;

    rows.forEach((row, i) => {
      const y = top + i * rowH;
      const g = svgEl("g", {
        class: `ward-bar-hit ${state.filters.wards.includes(row.ward) ? "active" : ""}`,
        tabindex: 0, role: "button",
        "aria-label": `${row.ward}: ${numeric ? config.format(row.value) : row.count + " casas"}`,
      });
      g.dataset.ward = row.ward;
      const label = svgEl("text", { x: left - 10, y: y + 17, "text-anchor": "end", class: "ward-bar-label" });
      label.textContent = row.ward;
      const bg = svgEl("rect", { x: left, y: y + 5, width: iw, height: 14, rx: 4, class: "ward-bar-bg" });
      const w = Number.isFinite(row.value) && max > 0 ? Math.max(0, (row.value / max) * iw) : 0;
      const bar = svgEl("rect", { x: left, y: y + 5, width: w, height: 14, rx: 4, class: "ward-bar-fill" });
      const value = svgEl("text", { x: W - right + 6, y: y + 17, class: "ward-bar-value" });
      value.textContent = numeric ? config.format(row.value) : String(row.count);
      g.append(label, bg, bar, value);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleWard(row.ward); } });
      svg.appendChild(g);
    });
  }

  function renderTerritoryInsights() {
    const base = territoryBase();
    const summaries = core.wardSummaries(base, metadata.wards);
    const ordered = Object.values(summaries).sort((a, b) => b.count - a.count);
    const top = ordered[0];
    const topThree = ordered.slice(0, 3).reduce((s, r) => s + r.count, 0);
    const represented = ordered.filter((r) => r.count > 0).length;

    const perCapita = metadata.wards
      .map((w) => ({ ward: w, v: mapMetrics.perCapita.value(summaries[w], w) }))
      .filter((r) => Number.isFinite(r.v) && summaries[r.ward].count > 0)
      .sort((a, b) => b.v - a.v);

    const cards = [
      { value: String(base.length), label: "casas após filtros não territoriais" },
      { value: top && top.count ? `${top.ward} · ${top.count}` : "—", label: base.length && top ? `${fmt(top.share * 100, 1)}% do recorte` : "ward mais representado" },
      { value: base.length ? `${fmt((topThree / base.length) * 100, 1)}%` : "—", label: "concentração nos 3 wards líderes" },
      { value: perCapita.length ? `${perCapita[0].ward} · ${fmt(perCapita[0].v, 2)}` : "—", label: "mais casas por 100 mil habitantes" },
    ];
    $("territory-insights").innerHTML = cards.map((c) =>
      `<article class="insight-card"><strong>${escapeHtml(c.value)}</strong><span>${escapeHtml(c.label)}</span></article>`).join("");
    return { summaries, represented };
  }

  function renderWardProfile() {
    const base = territoryBase();
    const summaries = core.wardSummaries(base, metadata.wards);
    const fallback = Object.values(summaries).sort((a, b) => b.count - a.count)[0]?.ward || metadata.wards[0];
    const ward = state.wardFocus || state.filters.wards[state.filters.wards.length - 1] || fallback;
    const s = summaries[ward];
    const c = ctx(ward);
    const norm = wardNorms[ward];
    const legal = wardLegal[ward];

    /* números das notas de contexto: sempre sobre o recorte comparável inteiro */
    const wardAll = houses.filter((h) => h.ward === ward).length;
    const noteTokens = { wardCount: String(wardAll), corpusTotal: String(houses.length), wardShare: fmt((wardAll / houses.length) * 100, 1) };

    const allLots = base.map((h) => h.lotArea).filter(Number.isFinite);
    const medianAll = core.median(allLots);
    const comparison = s.lotMedian != null && medianAll != null
      ? `${s.lotMedian < medianAll ? "abaixo" : s.lotMedian > medianAll ? "acima" : "igual"} da mediana do recorte (${fmt(medianAll, 1)} m²)`
      : "sem casas no recorte atual";

    const normBlock = norm && norm.status === "registrado"
      ? `<div class="norm-card">
           <div><span class="regime-code">${escapeHtml(norm.regimeCode)}</span><strong>${escapeHtml(norm.regime)}</strong></div>
           <p><strong>Lote mínimo:</strong> ${escapeHtml(norm.minimumLot || "não registrado")}<br>
              <strong>Escopo:</strong> ${escapeHtml(norm.scope || "não registrado")}<br>
              <strong>Adoção:</strong> ${escapeHtml(norm.adoptionDate || "não registrada")}<br>
              <span class="muted">Fonte: aba 11 normas wards.</span></p>
         </div>`
      : `<div class="norm-card alert">
           <div><span class="regime-code alert">?</span><strong>Regime de lote mínimo a verificar</strong></div>
           <p>Os valores importados da planilha para este ward não são confiáveis: as colunas de regime, lote mínimo, escopo e adoção trazem números vindos de outra tabela. Conferir na fonte antes de citar.</p>
         </div>`;

    const legalBlock = legal && legal.available
      ? `<p>BCR designado no ward: ${escapeHtml(legal.bcrValues.join(" / "))}%<br>FAR designado no ward: ${escapeHtml(legal.farValues.join(" / "))}%<br><span class="muted">${legal.zones} zonas registradas</span></p>`
      : `<p class="lacuna">Ward ausente do pacote público A29-2019.</p>`;

    $("ward-profile").innerHTML = `
      <p class="profile-kicker">perfil territorial</p>
      <h3>${escapeHtml(ward)} <span class="ja">${escapeHtml(c?.ja || "")}</span></h3>
      <div class="profile-metrics">
        <div><span>casas no recorte</span><strong>${s.count}</strong></div>
        <div><span>participação</span><strong>${fmt(base.length ? s.share * 100 : 0, 1)}%</strong></div>
        <div><span>lote mediano</span><strong>${s.lotMedian == null ? "—" : fmt(s.lotMedian, 1) + " m²"}</strong></div>
        <div><span>FAR mediano</span><strong>${s.farMedian == null ? "—" : fmt(s.farMedian, 2) + "×"}</strong></div>
      </div>
      <p class="profile-compare">${escapeHtml(s.lotMedian == null ? comparison : `Lote mediano ${comparison}.`)}</p>
      <div class="profile-context">
        <div><span>população</span><strong>${c ? fmt(c.pop, 0) : "—"}</strong></div>
        <div><span>área</span><strong>${c ? fmt(c.area, 2) + " km²" : "—"}</strong></div>
        <div><span>densidade</span><strong>${c ? fmt(density(ward), 0) : "—"}</strong></div>
      </div>
      ${c ? `<p class="profile-text">${escapeHtml(c.profile)}</p>` : ""}
      ${c && c.notes ? `<ul class="profile-notes">${c.notes.map((n) => `<li>${escapeHtml(fill(n, noteTokens))}</li>`).join("")}</ul>` : ""}
      ${normBlock}
      <div class="ward-legal-range"><strong>Faixa de zoneamento A29 · 2019</strong>${legalBlock}</div>`;
  }

  /* ---------- 04 tipologias ---------- */

  function renderTypologies() {
    $("typology-note").textContent = typologies.note;
    const medianLot = core.median(houses.map((h) => h.lotArea));
    const medianBcr = core.median(houses.map((h) => h.bcr));
    $("typology-cards").innerHTML = typologies.items.map((t) => {
      const house = houses.find((h) => h.id === t.houseId);
      const stats = house ? `
        <div class="typology-stats">
          <div><span>lote</span><strong>${fmt(house.lotArea, 2)} m²</strong></div>
          <div><span>projeção</span><strong>${fmt(house.footprintArea, 2)} m²</strong></div>
          <div><span>BCR</span><strong>${fmt(house.bcr * 100, 1)}%</strong></div>
          <div><span>FAR</span><strong>${fmt(house.far, 2)}×</strong></div>
        </div>` : "";
      const link = house && house.sourceUrl
        ? `<a class="typology-source" href="${escapeHtml(house.sourceUrl)}" target="_blank" rel="noreferrer">fonte da obra ↗</a>` : "";
      const tid = `typ-${escapeHtml(t.romaji || t.en || house?.id || "x").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
      return `<article class="typology-card panel compact" data-typology="${tid}">
        <div class="typology-head">
          <p class="rule-ja">${escapeHtml(t.ja)} <span class="typology-en">${escapeHtml(t.en)}</span></p>
          <p class="rule-romaji">${escapeHtml(t.romaji)}</p>
          <h3>${escapeHtml(t.pt)}</h3>
        </div>
        <div class="rule-figure typology-figure">${DRAW.parcel(t.figure)}</div>
        ${t.proportionNote ? `<p class="typology-proportion">${escapeHtml(t.proportionNote)}</p>` : ""}
        ${house ? `<p class="typology-peek">${escapeHtml(house.name)} · ${fmt(house.lotArea, 2)} m² de lote</p>` : ""}
        <button class="typology-toggle" type="button" aria-expanded="false" aria-controls="${tid}-detail">ver a leitura</button>
        <div class="typology-detail" id="${tid}-detail" hidden>
        <p class="typology-text">${escapeHtml(t.text)}</p>
        ${house ? `<div class="typology-case">
          <p class="typology-case-kicker">no corpus</p>
          <h4>${escapeHtml(house.name)}</h4>
          <p class="typology-case-meta">${escapeHtml(house.architect)} · ${escapeHtml(house.ward)} · ${house.year}</p>
          ${photoFor(house)}
          ${stats}
          <p class="typology-basis"><span>critério</span>${escapeHtml(t.basis)}</p>
          <p class="typology-reading">${escapeHtml(t.reading.replace("{medBcr}", `${fmt(medianBcr * 100, 1)}%`))}</p>
          ${link}
        </div>` : `<p class="typology-basis">Caso não localizado no recorte comparável.</p>`}
        </div>
      </article>`;
    }).join("")
      + `<p class="typology-footnote">Medianas do recorte para referência: lote ${fmt(medianLot, 1)} m², BCR ${fmt(medianBcr * 100, 1)}%. Fonte: aba 01 casas base; a planilha não classifica tipologia de lote.</p>`;
  }

  /* ---------- 05 a norma: calculadora, comparações, referência ---------- */

  const lawState = Object.assign({}, rules.defaultInput);

  function lawZone() { return LAW.zones.find((z) => z.key === lawState.zoneKey) || LAW.zones[0]; }

  function fillZoneDependentControls() {
    const zone = lawZone();
    $("law-bcr").innerHTML = zone.bcr.map((v) => `<option value="${v}">${v}%</option>`).join("");
    $("law-far").innerHTML = zone.far.map((v) => `<option value="${v}">${v}%</option>`).join("");
    if (!zone.bcr.includes(Number(lawState.bcr))) lawState.bcr = zone.bcrDefault;
    if (!zone.far.includes(Number(lawState.far))) lawState.far = zone.farDefault;
    $("law-bcr").value = String(lawState.bcr);
    $("law-far").value = String(lawState.far);
    $("law-height-field").hidden = !zone.absoluteHeight;
    if (zone.absoluteHeight) $("law-height").value = String(lawState.absoluteHeight || zone.absoluteHeight);
    $("law-zone-note").textContent = zone.note;
  }

  function lawRow(label, article, applied, result, flag) {
    return `<tr${flag ? ' class="law-row-binding"' : ""}>
      <th scope="row">${escapeHtml(label)}</th>
      <td class="law-article">${escapeHtml(article)}</td>
      <td>${applied}</td>
      <td class="law-result">${result}</td>
    </tr>`;
  }

  function renderLaw() {
    const zone = lawZone();
    const r = LAW.compute(lawState);

    $("law-area").textContent = `${fmt(r.grossArea, 2)} m²`;
    $("law-section").innerHTML = DRAW.section(r, { w: 620, h: 300, caption: "corte · escala real", aria: "Corte do lote mostrando o plano da via, o plano do lado norte, a altura absoluta e o envelope resultante" });
    $("law-plan").innerHTML = DRAW.plan(r, { w: 300, h: 300, caption: "planta · escala real" });

    const cards = [
      { v: `${fmt(r.netArea, 2)} m²`, l: r.setbackApplies ? `área efetiva após ceder ${fmt(r.cededArea, 2)} m²` : "área efetiva do lote" },
      { v: `${fmt(r.maxFootprint, 2)} m²`, l: `projeção máxima · ${r.unlimited ? "sem limite de ocupação" : fmt(r.bcrApplied, 0) + "%"}` },
      { v: `${fmt(r.maxFloorArea, 2)} m²`, l: `área construída máxima · ${fmt(r.farApplied, 0)}%` },
      { v: `${fmt(r.heightMax, 2)} m`, l: `altura útil máxima · cerca de ${r.floorsEstimate} pavimentos` },
    ];
    $("law-results").innerHTML = cards.map((c) => `<div class="law-result-card"><strong>${escapeHtml(c.v)}</strong><span>${escapeHtml(c.l)}</span></div>`).join("");

    const rows = [];
    rows.push(lawRow("Zona de uso", "都市計画法, art. 8", escapeHtml(zone.ja), escapeHtml(zone.pt)));
    rows.push(lawRow("Testada mínima", "art. 43", "2 m sobre via de 4 m", r.front >= 2 ? "frente de " + fmt(r.front, 1) + " m atende" : '<span class="law-fail">frente insuficiente</span>'));
    rows.push(lawRow("Recuo por via estreita", "art. 42, § 2",
      r.setbackApplies ? `via de ${fmt(r.roadRaw, 1)} m: recuo de ${fmt(r.setbackDepth, 2)} m` : `via de ${fmt(r.roadRaw, 1)} m: sem recuo`,
      r.setbackApplies ? `cede ${fmt(r.cededArea, 2)} m², resta ${fmt(r.netArea, 2)} m²` : `lote íntegro: ${fmt(r.netArea, 2)} m²`, r.setbackApplies));
    rows.push(lawRow("Ocupação designada", "art. 53", `${fmt(r.bcrBase, 0)}%`, `${fmt(r.netArea * r.bcrBase / 100, 2)} m² de projeção`));
    rows.push(lawRow("Acréscimo de esquina", "art. 53, § 3", r.bonusCorner ? "+10 pontos" : "não aplicado", r.bonusCorner ? `${fmt(r.netArea * 0.1, 2)} m² a mais` : "—", !!r.bonusCorner));
    rows.push(lawRow("Acréscimo por resistência ao fogo", "art. 53, § 3", r.bonusFire ? "+10 pontos" : "não aplicado", r.unlimited ? "zona de 80% com edificação resistente: limite afastado" : r.bonusFire ? `${fmt(r.netArea * 0.1, 2)} m² a mais` : "—", !!r.bonusFire));
    rows.push(lawRow("Ocupação aplicada", "art. 53", r.unlimited ? "sem limite" : `${fmt(r.bcrApplied, 0)}%`, `<strong>${fmt(r.maxFootprint, 2)} m²</strong> de projeção`));
    rows.push(lawRow("Aproveitamento designado", "art. 52", `${fmt(r.farDesignated, 0)}%`, `${fmt(r.netArea * r.farDesignated / 100, 2)} m² de piso`));
    rows.push(lawRow("Teto pela largura da via", "art. 52, § 2",
      Number.isFinite(r.farByRoad) ? `${fmt(r.roadEffective, 1)} m × ${fmt(zone.roadCoef, 1)} = ${fmt(r.farByRoad, 0)}%` : "via de 12 m ou mais: não incide",
      Number.isFinite(r.farByRoad) ? `${fmt(r.netArea * r.farByRoad / 100, 2)} m² de piso` : "—", r.farBinding === "via"));
    rows.push(lawRow("Aproveitamento aplicado", "art. 52", `${fmt(r.farApplied, 0)}% · vale o ${r.farBinding === "via" ? "teto da via" : "designado no plano"}`, `<strong>${fmt(r.maxFloorArea, 2)} m²</strong> de piso`));
    rows.push(lawRow("Altura absoluta", "art. 55", zone.absoluteHeight ? `${fmt(r.absoluteHeight, 0)} m` : "não incide nesta zona", zone.absoluteHeight ? `corta o envelope em ${fmt(r.absoluteHeight, 0)} m` : "—", !!zone.absoluteHeight));
    rows.push(lawRow("Plano inclinado da via", "art. 56, § 1, I", `1 : ${fmt(zone.roadSlope, 2)} a partir do limite oposto`, `${fmt((r.roadEffective) * zone.roadSlope, 2)} m na testada`, true));
    rows.push(lawRow("Plano inclinado do lado norte", "art. 56, § 1, III", zone.northStart ? `parte de ${fmt(zone.northStart, 0)} m, 1 : ${fmt(zone.northSlope, 2)}` : "não incide nesta zona", zone.northStart ? `${fmt(r.heightAtBack, 2)} m no fundo do lote` : "—", !!zone.northStart));
    rows.push(lawRow("Plano inclinado do lote vizinho", "art. 56, § 1, II", zone.neighbourStart ? `parte de ${fmt(zone.neighbourStart, 0)} m` : "não incide nesta zona", zone.neighbourStart ? "acima do envelope desta casa" : "—"));
    rows.push(lawRow("Regulação de sombra", "art. 56-2", "delimitada por lei local", '<span class="law-na">fora do alcance desta base</span>'));
    rows.push(lawRow("Área mínima de lote", "art. 53-2", "fixada por plano de distrito", '<span class="law-na">não documentada por parcela</span>'));
    rows.push(lawRow("Altura útil resultante", "arts. 52 a 56", "menor entre todos os limites", `<strong>${fmt(r.heightMax, 2)} m</strong> · cerca de ${r.floorsEstimate} pavimentos a 2,9 m`, true));

    $("law-table").innerHTML = `<thead><tr><th>Regra</th><th>Base legal</th><th>Valor aplicado</th><th>Resultado neste lote</th></tr></thead><tbody>${rows.join("")}</tbody>`;
  }

  function renderComparisons() {
    $("law-comparisons").innerHTML = rules.comparisons.map((c) => {
      const ra = LAW.compute(Object.assign({}, rules.defaultInput, c.a.input));
      const rb = LAW.compute(Object.assign({}, rules.defaultInput, c.b.input));
      const side = (label, r, key) => `
        <div class="law-compare-side">
          <div class="law-compare-head">
            <strong>${escapeHtml(label)}</strong>
            <button class="quiet-button tiny" type="button" data-load-case="${escapeHtml(key)}">Carregar</button>
          </div>
          ${c.view === "plan"
            ? DRAW.plan(r, { w: 420, h: 290, caption: "planta · escala real" })
            : DRAW.section(r, { w: 420, h: 280, caption: "corte · escala real" })}
          <div class="law-compare-stats">
            <div><span>projeção</span><strong>${fmt(r.maxFootprint, 1)} m²</strong></div>
            <div><span>construída</span><strong>${fmt(r.maxFloorArea, 1)} m²</strong></div>
            <div><span>FAR aplicado</span><strong>${fmt(r.farApplied, 0)}%</strong></div>
            <div><span>altura</span><strong>${fmt(r.heightMax, 1)} m</strong></div>
          </div>
        </div>`;
      const useFootprint = c.metric === "footprint";
      const delta = useFootprint ? rb.maxFootprint - ra.maxFootprint : rb.maxFloorArea - ra.maxFloorArea;
      const deltaLabel = useFootprint ? "de projeção admissível" : "de área construída admissível";
      return `<article class="law-compare panel">
        <div class="panel-title">
          <div><p>${escapeHtml(c.ja)} · ${escapeHtml(c.article)}</p><h3>${escapeHtml(c.title)}</h3></div>
        </div>
        <p class="law-compare-lede">${escapeHtml(c.lede)}</p>
        <div class="law-compare-grid">${side(c.a.label, ra, c.key + ":a")}${side(c.b.label, rb, c.key + ":b")}</div>
        ${ra.absoluteHeight && rb.absoluteHeight ? "" : `<p class="law-compare-warn">${ra.absoluteHeight || rb.absoluteHeight ? `Em ${escapeHtml((ra.absoluteHeight ? c.b : c.a).label)}, a zona não tem altura absoluta` : "Nenhum dos dois casos tem altura absoluta"}: a regulação de sombra do art. 56-2, que não está modelada aqui, costuma ser o limite efetivo.</p>`}
        <p class="law-compare-delta"><strong>${delta >= 0 ? "+" : ""}${fmt(delta, 1)} m²</strong> ${escapeHtml(deltaLabel)} entre os dois casos.</p>
        <p class="law-compare-read">${escapeHtml(c.read)}</p>
      </article>`;
    }).join("");
  }

  function renderZoneTable() {
    const rows = LAW.zones.map((z) => `<tr>
      <td><strong>${escapeHtml(z.pt)}</strong><small>${escapeHtml(z.ja)}</small></td>
      <td>${z.bcr.join(" / ")}%</td>
      <td>${z.far[0]} a ${z.far[z.far.length - 1]}%</td>
      <td>${z.absoluteHeight ? z.absoluteHeight + " ou 12 m" : "—"}</td>
      <td>${z.northStart ? z.northStart + " m · 1:" + fmt(z.northSlope, 2) : "—"}</td>
      <td>1 : ${fmt(z.roadSlope, 2)}</td>
      <td>× ${fmt(z.roadCoef, 1)}</td>
    </tr>`).join("");
    $("zone-table").innerHTML = `<table><thead><tr>
      <th>Classe de zona</th><th>建ぺい率</th><th>容積率</th><th>altura absoluta</th><th>北側斜線</th><th>道路斜線</th><th>coef. da via</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <p class="matrix-note">Faixas designáveis pelo plano urbano. A designação de uma parcela concreta se consulta no mapa urbanístico de Tóquio, não aqui.</p>`;
  }

  function renderRuleCards() {
    $("rules-defs").innerHTML = rules.defs;
    $("rules-cards").innerHTML = rules.cards.map((rule) => {
      const fig = rule.figure.kind === "static" ? rule.figure.svg : DRAW.parcel(rule.figure);
      return `<article class="rule-card panel">
        <div class="rule-head">
          <div>
            <p class="rule-ja">${escapeHtml(rule.ja)}</p>
            <p class="rule-romaji">${escapeHtml(rule.romaji)}</p>
            <h4>${escapeHtml(rule.pt)}</h4>
          </div>
        </div>
        <div class="rule-figure">${fig}</div>
        <p class="rule-summary">${escapeHtml(rule.summary)}</p>
        <p class="rule-micro"><span>no microlote</span>${escapeHtml(rule.micro)}</p>
        <p class="rule-article">${escapeHtml(rule.article)}</p>
      </article>`;
    }).join("");
  }

  function initLawControls() {
    $("law-zone").innerHTML = LAW.zones.map((z) => `<option value="${z.key}">${escapeHtml(z.pt)} · ${escapeHtml(z.ja)}</option>`).join("");
    $("law-zone").value = lawState.zoneKey;
    $("law-front").value = lawState.front;
    $("law-depth").value = lawState.depth;
    $("law-road").value = lawState.roadWidth;
    fillZoneDependentControls();

    const cases = core.sortHouses(houses, "lotArea:asc");
    $("law-case").innerHTML = '<option value="">lote livre</option>'
      + cases.map((h) => `<option value="${escapeHtml(h.id)}">${escapeHtml(h.name)} · ${fmt(h.lotArea, 1)} m²</option>`).join("");

    $("law-zone").addEventListener("change", () => {
      lawState.zoneKey = $("law-zone").value;
      const z = lawZone();
      lawState.bcr = z.bcrDefault; lawState.far = z.farDefault;
      lawState.absoluteHeight = z.absoluteHeight || null;
      fillZoneDependentControls(); renderLaw();
    });
    for (const [id, key, num] of [["law-front", "front", true], ["law-depth", "depth", true], ["law-road", "roadWidth", true], ["law-bcr", "bcr", true], ["law-far", "far", true], ["law-height", "absoluteHeight", true]]) {
      $(id).addEventListener("input", () => { lawState[key] = num ? Number($(id).value) : $(id).value; renderLaw(); });
      $(id).addEventListener("change", () => { lawState[key] = num ? Number($(id).value) : $(id).value; renderLaw(); });
    }
    $("law-corner").addEventListener("change", () => { lawState.corner = $("law-corner").checked; renderLaw(); });
    $("law-fire").addEventListener("change", () => { lawState.fireproof = $("law-fire").checked; renderLaw(); });
    $("law-case").addEventListener("change", () => {
      const house = houses.find((h) => h.id === $("law-case").value);
      if (!house) return;
      const front = Number(lawState.front) || 5;
      lawState.depth = Math.round((house.lotArea / front) * 10) / 10;
      $("law-depth").value = lawState.depth;
      renderLaw();
    });
    $("law-comparisons").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-load-case]");
      if (!btn) return;
      const [key, sideKey] = btn.dataset.loadCase.split(":");
      const c = rules.comparisons.find((x) => x.key === key);
      if (!c) return;
      Object.assign(lawState, rules.defaultInput, c[sideKey].input);
      $("law-zone").value = lawState.zoneKey;
      $("law-front").value = lawState.front;
      $("law-depth").value = lawState.depth;
      $("law-road").value = lawState.roadWidth;
      $("law-corner").checked = !!lawState.corner;
      $("law-fire").checked = !!lawState.fireproof;
      fillZoneDependentControls();
      renderLaw();
      document.getElementById("norma").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------- 06 comparar ---------- */

  function toggleWard(ward) {
    state.wardFocus = ward;
    state.filters.wards = state.filters.wards.includes(ward)
      ? state.filters.wards.filter((w) => w !== ward)
      : [...state.filters.wards, ward];
    state.visibleLimit = 24;
    renderAll();
  }

  function toggleSelection(id) {
    if (state.selected.has(id)) state.selected.delete(id);
    else if (state.selected.size < 4) state.selected.add(id);
    renderAll();
  }

  function percentileNote(field, value) {
    if (!Number.isFinite(value)) return "";
    const p = core.percentile(value, metricValues(field));
    return p == null ? "" : `<small>P${p} no recorte filtrado</small>`;
  }

  function rangeCell(ward, field) {
    const ref = wardLegal[ward];
    if (!ref || !ref.available) return '<span class="lacuna">ausente do A29-2019</span>';
    const values = field === "far" ? ref.farValues : ref.bcrValues;
    if (!values || !values.length) return '<span class="lacuna">ausente do A29-2019</span>';
    const min = values[0], max = values[values.length - 1];
    return field === "far"
      ? `${fmt(min / 100, 1)}× a ${fmt(max / 100, 1)}×<small>${values.length} valores designados</small>`
      : `${min}% a ${max}%<small>${values.length} valores designados</small>`;
  }

  function renderCompare() {
    const selected = [...state.selected].map((id) => houses.find((h) => h.id === id)).filter(Boolean);
    $("selection-count").textContent = `${selected.length} de 4 selecionadas`;
    $("compare-empty").hidden = selected.length > 0;
    $("compare-wrap").hidden = selected.length === 0;
    if (!selected.length) return;

    $("compare-cards").innerHTML = selected.map((h) => `
      <article class="compare-card">
        <button class="remove-selection" type="button" data-remove-id="${escapeHtml(h.id)}" aria-label="Retirar ${escapeHtml(h.name)}">×</button>
        ${photoFor(h)}
        <h3>${escapeHtml(h.name)}</h3>
        <p>${escapeHtml(h.architect)}</p>
        <p class="compare-meta">${escapeHtml(h.ward)} · ${h.year}</p>
      </article>`).join("");

    const rows = [
      ["Ward", (h) => `${escapeHtml(h.ward)}<small>${escapeHtml(ctx(h.ward)?.ja || "")}</small>`],
      ["Ano", (h) => String(h.year)],
      ["Lote", (h) => formatMetric("lotArea", h.lotArea) + percentileNote("lotArea", h.lotArea)],
      ["Construída", (h) => formatMetric("builtArea", h.builtArea) + percentileNote("builtArea", h.builtArea)],
      ["Projeção", (h) => formatMetric("footprintArea", h.footprintArea)],
      ["Pavimentos", (h) => floorsFull(h)],
      ["FAR observado", (h) => formatMetric("far", h.far) + percentileNote("far", h.far)],
      ["BCR observado", (h) => formatMetric("bcr", h.bcr) + percentileNote("bcr", h.bcr)],
      ["Faixa de FAR no ward · A29-2019", (h) => rangeCell(h.ward, "far")],
      ["Faixa de BCR no ward · A29-2019", (h) => rangeCell(h.ward, "bcr")],
      ["Densidade do ward", (h) => { const d = density(h.ward); return Number.isFinite(d) ? `${fmt(d, 0)} hab./km²` : '<span class="lacuna">sem dado</span>'; }],
      ["Fonte da casa", (h) => h.sourceUrl ? `<a href="${escapeHtml(h.sourceUrl)}" target="_blank" rel="noreferrer">abrir fonte ↗</a>` : '<span class="lacuna">não registrada</span>'],
    ];
    renderCompareChart(selected);
    $("comparison-table").innerHTML = `<tbody>${rows.map(([label, render]) =>
      `<tr><th scope="row">${escapeHtml(label)}</th>${selected.map((h) => `<td>${render(h)}</td>`).join("")}</tr>`).join("")}</tbody>`;
  }

  function renderCompareChart(selected) {
    const svg = $("compare-chart");
    svg.innerHTML = "";
    if (!selected.length) return;
    const metrics = [
      { key: "lotArea", label: "lote", unit: " m²", dec: 1 },
      { key: "builtArea", label: "construída", unit: " m²", dec: 1 },
      { key: "footprintArea", label: "projeção", unit: " m²", dec: 1 },
      { key: "far", label: "FAR", unit: "×", dec: 2 },
      { key: "bcr", label: "BCR", unit: "%", dec: 1, scale: 100 },
    ];
    const W = 900, H = 60 + metrics.length * 40, m = { t: 44, l: 96, r: 150 };
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const iw = W - m.l - m.r;
    const slot = iw / selected.length;
    selected.forEach((h, i) => {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", m.l + slot * i + slot / 2); t.setAttribute("y", 24);
      t.setAttribute("class", "cmp-head");
      t.textContent = h.name.length > 26 ? h.name.slice(0, 25) + "…" : h.name;
      svg.appendChild(t);
    });
    metrics.forEach((mt, r) => {
      const y = m.t + r * 40;
      const vals = selected.map((h) => (h[mt.key] || 0) * (mt.scale || 1));
      const max = Math.max(...vals, 0.0001);
      svg.insertAdjacentHTML("beforeend", `<text x="${m.l - 12}" y="${y + 16}" class="cmp-label">${escapeHtml(mt.label)}</text>`);
      selected.forEach((h, i) => {
        const v = vals[i];
        const bw = Math.max(2, (v / max) * (slot - 18));
        const x = m.l + slot * i;
        svg.insertAdjacentHTML("beforeend",
          `<rect x="${x}" y="${y + 4}" width="${slot - 18}" height="18" rx="4" class="cmp-bg"/>`
          + `<rect x="${x}" y="${y + 4}" width="${bw}" height="18" rx="4" class="cmp-bar"/>`
          + `<text x="${x + bw + 7}" y="${y + 18}" class="cmp-value">${escapeHtml(fmt(v, mt.dec) + mt.unit)}</text>`);
      });
    });
    svg.insertAdjacentHTML("beforeend", `<text x="${W - 12}" y="${H - 10}" class="cmp-foot" text-anchor="end">Neko no Hitai · valores observados, não limites legais</text>`);
  }

  function renderEvidence() {
    const fields = [["year", "Ano"], ["ward", "Ward"], ["lotArea", "Lote"], ["builtArea", "Construída"], ["bcr", "BCR"], ["far", "FAR"]];
    const total = metadata.sourceRecords;
    /* cada campo traz a própria base: ano e ward vêm das abas-resumo da
       planilha, os demais das abas de casas; o denominador aparece junto */
    $("coverage-bars").innerHTML = fields.map(([field, label]) => {
      const cov = metadata.coverageSource[field];
      const count = typeof cov === "object" ? cov.count : cov;
      const base = typeof cov === "object" ? cov.total : total;
      const from = typeof cov === "object" && cov.from ? ` title="${escapeHtml(cov.from)}"` : "";
      return `<div class="coverage-row"${from}><span>${label}</span><div class="coverage-track"><div class="coverage-fill" style="width:${(count / base) * 100}%"></div></div><strong>${count}/${base}</strong></div>`;
    }).join("")
      + `<div class="coverage-row highlight"><span>seis campos</span><div class="coverage-track"><div class="coverage-fill" style="width:${(metadata.eligibleRecords / total) * 100}%"></div></div><strong>${metadata.eligibleRecords}/${total}</strong></div>`
      + `<p class="coverage-split">dentro das ${metadata.eligibleRecords} fichas comparáveis</p>`
      + `<div class="coverage-row"><span>pavimentos</span><div class="coverage-track"><div class="coverage-fill" style="width:${(metadata.coverageInCorpus.floors / metadata.eligibleRecords) * 100}%"></div></div><strong>${metadata.coverageInCorpus.floors}/${metadata.eligibleRecords}</strong></div>`
      + `<div class="coverage-row"><span>fonte</span><div class="coverage-track"><div class="coverage-fill" style="width:${(metadata.coverageInCorpus.sourceUrl / metadata.eligibleRecords) * 100}%"></div></div><strong>${metadata.coverageInCorpus.sourceUrl}/${metadata.eligibleRecords}</strong></div>`;

    const gaps = [
      ["faixa de referência do ward · 2019", `${legalReference.availableWards}/23 wards`],
      ["zona de uso por casa", `0/${metadata.eligibleRecords}`],
      ["largura da via frontal", `0/${metadata.eligibleRecords}`],
      ["zona de prevenção contra incêndio", `0/${metadata.eligibleRecords}`],
      ["plano de distrito", `0/${metadata.eligibleRecords}`],
      ["regime de lote mínimo por ward", `${metadata.wards.filter((w) => wardNorms[w] && wardNorms[w].status === "registrado").length}/23 registrados`],
    ];
    $("legal-gap-list").innerHTML = gaps.map(([label, value]) =>
      `<div class="legal-gap-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");

    const tabs = (metadata.sourceTabs || []).map((t) => `<em>${escapeHtml(t)}</em>`);
    const tabsText = tabs.length > 1 ? `${tabs.slice(0, -1).join(", ")} e ${tabs[tabs.length - 1]}` : tabs.join("");
    const readAt = metadata.sourceReadAt ? new Date(`${metadata.sourceReadAt}T12:00:00`).toLocaleDateString("pt-BR") : "";
    $("source-note").innerHTML = `Fonte: <strong>${escapeHtml(metadata.sourceFile)}</strong>${tabsText ? `, abas ${tabsText}` : ""}${readAt ? `, lidas em ${readAt}` : ""}. `
      + (metadata.declaredRecords && metadata.declaredRecords !== metadata.sourceRecords
        ? `A planilha declara ${metadata.declaredRecords} registros na base, e ${metadata.sourceRecords} obras distintas aparecem nessas abas. `
        : "")
      + `Das ${metadata.sourceRecords} obras do corpus, ${metadata.excludedIncomplete} ficaram fora por faltar ao menos um dos seis campos comparáveis${metadata.missingFromTarget ? `, e ${metadata.missingFromTarget} registros do corpus-alvo de ${metadata.targetCorpus} não constam da planilha` : ""}. `
      + `As barras contam as ${metadata.sourceRecords} linhas da aba <em>01 casas base</em>; projeção e área construída só entram quando a taxa de ocupação e o coeficiente de aproveitamento da aba <em>90 aux casas indicadores</em> batem com elas. `
      + `IDP, IPE-Pico e limites legais por casa não constam dessas abas e ficaram fora da interface em vez de aparecer como lacuna.`;
    $("footer-build").textContent = `corpus de ${metadata.sourceFile} · atlas reconstruído em ${new Date(metadata.rebuiltAt).toLocaleDateString("pt-BR")}`;
    document.querySelectorAll('[data-count="eligible"]').forEach((node) => { node.textContent = String(houses.length); });
    const years = houses.map((h) => h.year).filter(Number.isFinite);
    if ($("findings-rule") && years.length) $("findings-rule").textContent = `${houses.length} fichas · ${Math.min(...years)} a ${Math.max(...years)}`;
    if ($("lot-histogram")) $("lot-histogram").setAttribute("aria-label", `Histograma da área de lote das ${houses.length} fichas`);
    $("floors-count").textContent = `(${metadata.coverageInCorpus.floors} de ${metadata.eligibleRecords})`;
    $("data-rule").textContent = `${metadata.eligibleRecords} fichas de ${metadata.sourceRecords}`;
  }

  /* ---------- exportações ---------- */

  function download(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function exportFilteredCsv() {
    const columns = ["n", "id", "name", "architect", "year", "ward", "wardJa", "lotArea", "builtArea", "footprintArea", "floors", "floorsNote", "bcrObserved", "farObserved", "wardBcrRange2019", "wardFarRange2019", "wardPopulation", "wardAreaKm2", "wardDensity", "sourceUrl"];
    const rows = [columns.join(";"), ...state.filtered.map((h) => {
      const ref = wardLegal[h.ward] || {};
      const c = ctx(h.ward) || {};
      const range = (vals) => (vals && vals.length ? `${vals[0]}-${vals[vals.length - 1]}` : "");
      return [
        h.n, h.id, h.name, h.architect, h.year, h.ward, c.ja || "",
        h.lotArea, h.builtArea, h.footprintArea, Number.isFinite(h.floors) ? h.floors : "", h.floorsNote || "",
        h.bcr, h.far, range(ref.bcrValues), range(ref.farValues),
        c.pop || "", c.area || "", Number.isFinite(density(h.ward)) ? Math.round(density(h.ward)) : "",
        h.sourceUrl || "",
      ].map(core.csvEscape).join(";");
    })];
    download("﻿" + rows.join("\n"), "neko-no-hitai-recorte.csv", "text/csv;charset=utf-8");
  }

  function exportSelection() {
    const selected = houses.filter((h) => state.selected.has(h.id)).map((h) => ({
      ...h,
      wardContext: ctx(h.ward),
      wardZoning2019: wardLegal[h.ward] || null,
      wardMinimumLotRegime: wardNorms[h.ward] || null,
    }));
    download(JSON.stringify({ exportedAt: new Date().toISOString(), filters: state.filters, houses: selected }, null, 2),
      "neko-no-hitai-selecao.json", "application/json");
  }

  function exportSvg(id) {
    const svg = $(id).cloneNode(true);
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const style = svgEl("style");
    style.textContent = `text{font-family:Arial,sans-serif}.ward-shape{stroke:#f7fbfe;stroke-width:1.6}.ward-shape.active{stroke:#071a37;stroke-width:3.5}.geo-label{fill:#10264a;font-weight:700;font-size:10px;text-anchor:middle;paint-order:stroke;stroke:#fff;stroke-width:3px}.geo-label-value{font-size:9px}.ward-bar-bg{fill:#edf2f6}.ward-bar-fill{fill:#6f98b9}.ward-bar-hit.active .ward-bar-fill{fill:#10264a}.ward-bar-label{fill:#111b2e;font-size:12px}.ward-bar-value{fill:#10264a;font-weight:700;font-size:11px}.grid-line{stroke:#e5eaf0}.axis-line{stroke:#99a5b4}.axis-text{fill:#697486;font-size:11px}.corr-point{fill:rgba(53,103,143,.62);stroke:#fff;stroke-width:2}.corr-point.empty{fill:#d3e1eb}.corr-label{fill:#10264a;font-weight:700;font-size:11px}`;
    svg.insertBefore(style, svg.firstChild);
    download(new XMLSerializer().serializeToString(svg), `${id}-neko-no-hitai.svg`, "image/svg+xml;charset=utf-8");
  }

  /* ---------- render ---------- */

  function renderTerritory() {
    renderTerritoryInsights();
    renderGeoMap();
    renderWardBars();
    renderWardProfile();
  }

  function renderAll() {
    state.filtered = core.filterHouses(houses, state.filters);
    writeUrlState();
    renderStats();
    renderList();
    renderScatter();
    renderTerritory();
    renderCompare();
    renderDrawer();
    listeners.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } });
  }

  function initControls() {
    for (const axis of [$("x-axis"), $("y-axis")]) {
      axis.innerHTML = axisOptions.map((f) => `<option value="${f}">${metricConfig[f].short}</option>`).join("");
    }
    $("x-axis").value = state.xAxis;
    $("y-axis").value = state.yAxis;
    $("map-metric").value = state.mapMetric;

    const years = houses.map((h) => h.year);
    $("year-min").placeholder = String(Math.min(...years));
    $("year-max").placeholder = String(Math.max(...years));
    const lots = houses.map((h) => h.lotArea);
    $("lotArea-min").placeholder = fmt(Math.min(...lots), 1);
    $("lotArea-max").placeholder = fmt(Math.max(...lots), 1);

    $("query").addEventListener("input", syncFiltersFromInputs);
    $("only-floors").addEventListener("change", syncFiltersFromInputs);
    for (const field of rangeFields) {
      for (const suffix of ["min", "max"]) {
        $(`${field}-${suffix}`).addEventListener("input", syncFiltersFromInputs);
        $(`${field}-${suffix}`).addEventListener("change", syncFiltersFromInputs);
      }
    }
    $("sort").addEventListener("change", () => { state.sort = $("sort").value; renderList(); });
    $("x-axis").addEventListener("change", () => { state.xAxis = $("x-axis").value; renderScatter(); });
    $("y-axis").addEventListener("change", () => { state.yAxis = $("y-axis").value; renderScatter(); });
    $("map-metric").addEventListener("change", () => { state.mapMetric = $("map-metric").value; renderGeoMap(); renderWardBars(); });
    $("reset-filters").addEventListener("click", () => {
      $("query").value = "";
      $("only-floors").checked = false;
      for (const field of rangeFields) { $(`${field}-min`).value = ""; $(`${field}-max`).value = ""; }
      state.filters.wards = [];
      state.filters.ids = null;
      state.wardFocus = null;
      QUICK.forEach((id) => $(id).classList.remove("active"));
      syncFiltersFromInputs();
    });
    $("load-more").addEventListener("click", () => { state.visibleLimit += 24; renderList(); });
    const QUICK = ["filter-ch9", "filter-tiny"];
    const quickOnly = (keep) => QUICK.filter((id) => id !== keep).forEach((id) => $(id).classList.remove("active"));
    const idsChip = (chipId, ids) => () => {
      const on = $(chipId).classList.toggle("active");
      quickOnly(chipId);
      for (const field of rangeFields) { $(`${field}-min`).value = ""; $(`${field}-max`).value = ""; }
      state.filters.wards = [];
      state.filters.ids = on ? ids : null;
      syncFiltersFromInputs();
    };
    $("filter-ch9").addEventListener("click", idsChip("filter-ch9", CH9));
    $("filter-tiny").addEventListener("click", () => {
      const on = $("filter-tiny").classList.toggle("active");
      quickOnly("filter-tiny");
      state.filters.ids = null;
      $("lotArea-min").value = ""; $("lotArea-max").value = on ? "40" : "";
      syncFiltersFromInputs();
    });
    $("export-compare-svg").addEventListener("click", () => exportSvg("compare-chart"));
    $("clear-selection").addEventListener("click", () => { state.selected.clear(); renderAll(); });
    $("export-selection").addEventListener("click", exportSelection);
    $("export-filtered").addEventListener("click", exportFilteredCsv);

    for (const id of ["geo-map", "ward-bars"]) {
      $(id).addEventListener("click", (e) => {
        const target = e.target.closest("[data-ward]");
        if (target) toggleWard(target.dataset.ward);
      });
    }
    $("active-wards").addEventListener("click", (e) => {
      const button = e.target.closest("[data-remove-ward]");
      if (!button) return;
      state.filters.wards = state.filters.wards.filter((w) => w !== button.dataset.removeWard);
      renderAll();
    });
    $("house-list").addEventListener("click", (e) => {
      const open = e.target.closest("[data-open-id]");
      if (open) { openDrawer(open.dataset.openId); return; }
      const col = e.target.closest("[data-sort-col]");
      if (col) {
        const key = col.dataset.sortCol;
        const [curKey, curDir] = state.sort.split(":");
        state.sort = `${key}:${key === curKey && curDir === "asc" ? "desc" : "asc"}`;
        const select = $("sort");
        if ([...select.options].some((o) => o.value === state.sort)) select.value = state.sort;
        renderList();
        return;
      }
      const button = e.target.closest("[data-house-id]");
      if (button && !button.disabled) toggleSelection(button.dataset.houseId);
    });
    /* seleção ligada: passar o cursor por uma ficha acende o ponto e o ward */
    const hoverIn = (e) => {
      const node = e.target.closest ? e.target.closest("[data-card-id]") : null;
      if (node) linkHighlight(node.dataset.cardId, true);
    };
    const hoverOut = (e) => {
      const node = e.target.closest ? e.target.closest("[data-card-id]") : null;
      if (node) linkHighlight(node.dataset.cardId, false);
    };
    $("house-list").addEventListener("mouseover", hoverIn);
    $("house-list").addEventListener("mouseout", hoverOut);
    $("house-list").addEventListener("focusin", hoverIn);
    $("house-list").addEventListener("focusout", hoverOut);
    const drawerWrap = $("house-drawer");
    if (drawerWrap) {
      drawerWrap.addEventListener("click", (e) => {
        if (e.target.closest("[data-close-drawer]")) { closeDrawer(); return; }
        const open = e.target.closest("[data-open-id]");
        if (open) { openDrawer(open.dataset.openId); return; }
        const button = e.target.closest("[data-house-id]");
        if (button && !button.disabled) toggleSelection(button.dataset.houseId);
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.drawer) closeDrawer();
    });
    document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
      state.view = b.dataset.view;
      document.querySelectorAll("[data-view]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      renderList();
    }));
    $("compare-cards").addEventListener("click", (e) => {
      const button = e.target.closest("[data-remove-id]");
      if (button) toggleSelection(button.dataset.removeId);
    });
    document.querySelectorAll("[data-export-svg]").forEach((b) =>
      b.addEventListener("click", () => exportSvg(b.dataset.exportSvg)));
    $("typology-cards").addEventListener("click", (e) => {
      const button = e.target.closest(".typology-toggle");
      if (!button) return;
      const card = button.closest(".typology-card");
      const detail = document.getElementById(button.getAttribute("aria-controls"));
      const open = card.classList.toggle("open");
      card.classList.toggle("compact", !open);
      detail.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "fechar" : "ver a leitura";
    });
  }

  /* ---------- interface pública, usada por ui.js e pelos gráficos ---------- */

  window.NekoAtlas = {
    houses,
    metadata,
    state,
    core,
    wardNorms,
    wardLegal,
    wardCtx,
    metricConfig,
    fmt,
    formatMetric,
    escapeHtml,
    svgEl,
    showTip,
    ticks,
    onUpdate(fn) { listeners.push(fn); },
    openDrawer,
    closeDrawer,
    toggleSelection,
    toggleWard,
    linkHighlight,
    setRange(field, min, max) {
      const set = (suffix, value) => {
        const input = $(`${field}-${suffix}`);
        if (!input) return;
        input.value = value == null ? "" : String(value);
      };
      set("min", min); set("max", max);
      syncFiltersFromInputs();
    },
    getRange(field) { return state.filters[field] || null; },
    setView(view) {
      state.view = view;
      document.querySelectorAll("[data-view]").forEach((o) => o.setAttribute("aria-pressed", String(o.dataset.view === view)));
      renderList();
    },
    render: renderAll,
  };

  initControls();
  readUrlState();
  renderFindings();
  renderScale();
  renderHistogram();
  renderTypologies();
  renderRuleCards();
  initLawControls();
  renderLaw();
  renderComparisons();
  renderZoneTable();
  renderEvidence();
  renderAll();
})();
