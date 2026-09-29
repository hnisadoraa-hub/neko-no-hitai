(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NekoCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const numericFields = ["year", "lotArea", "builtArea", "far", "bcr", "floors"];

  function inRange(value, range) {
    if (!range || (range.min == null && range.max == null)) return true;
    if (value == null || !Number.isFinite(Number(value))) return false;
    const n = Number(value);
    if (range.min != null && n < Number(range.min)) return false;
    if (range.max != null && n > Number(range.max)) return false;
    return true;
  }

  function normalizeSearch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  function filterHouses(houses, filters) {
    const query = normalizeSearch(filters.query);
    const wards = new Set(filters.wards || []);
    return houses.filter((house) => {
      if (query) {
        const haystack = normalizeSearch(`${house.name} ${house.architect || ""} ${house.ward}`);
        if (!haystack.includes(query)) return false;
      }
      if (wards.size && !wards.has(house.ward)) return false;
      if (filters.ids && !filters.ids.includes(house.id)) return false;
      if (filters.onlyFloors && !Number.isFinite(house.floors)) return false;
      for (const field of numericFields) {
        if (!inRange(house[field], filters[field])) return false;
      }
      return true;
    });
  }

  function validateRanges(filters) {
    const invalid = [];
    for (const field of numericFields) {
      const range = filters[field];
      if (!range) continue;
      if (range.min != null && range.max != null && Number(range.min) > Number(range.max)) invalid.push(field);
    }
    return { valid: invalid.length === 0, invalid };
  }

  function median(values) {
    const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (!sorted.length) return null;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function percentile(value, values) {
    const valid = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (value == null || !valid.length) return null;
    const belowOrEqual = valid.filter((item) => item <= value).length;
    return Math.round((belowOrEqual / valid.length) * 100);
  }

  function sortHouses(houses, sortKey) {
    const copy = houses.slice();
    const [field, direction = "asc"] = String(sortKey || "name:asc").split(":");
    const sign = direction === "desc" ? -1 : 1;
    copy.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null && bv == null) return a.name.localeCompare(b.name);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
      return String(av).localeCompare(String(bv), "pt-BR") * sign;
    });
    return copy;
  }

  function wardSummaries(houses, wards) {
    const total = houses.length;
    return Object.fromEntries(wards.map((ward) => {
      const subset = houses.filter((house) => house.ward === ward);
      const values = (field) => subset.map((house) => house[field]).filter(Number.isFinite);
      return [ward, {
        ward,
        count: subset.length,
        share: total ? subset.length / total : 0,
        lotMedian: median(values("lotArea")),
        builtMedian: median(values("builtArea")),
        farMedian: median(values("far")),
        bcrMedian: median(values("bcr")),
        yearMedian: median(values("year")),
      }];
    }));
  }

  /* Correlação de postos de Spearman. Descreve associação monotônica entre duas
     séries pareadas; não estabelece causalidade nem direção. */
  function spearman(pairs) {
    const clean = pairs.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
    const n = clean.length;
    if (n < 3) return null;
    const rank = (values) => {
      const indexed = values.map((value, index) => ({ value, index }));
      indexed.sort((a, b) => a.value - b.value);
      const ranks = new Array(values.length);
      let i = 0;
      while (i < indexed.length) {
        let j = i;
        while (j + 1 < indexed.length && indexed[j + 1].value === indexed[i].value) j += 1;
        const average = (i + j) / 2 + 1;
        for (let k = i; k <= j; k += 1) ranks[indexed[k].index] = average;
        i = j + 1;
      }
      return ranks;
    };
    const rx = rank(clean.map((p) => p[0]));
    const ry = rank(clean.map((p) => p[1]));
    const mean = (arr) => arr.reduce((sum, v) => sum + v, 0) / arr.length;
    const mx = mean(rx), my = mean(ry);
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i += 1) {
      num += (rx[i] - mx) * (ry[i] - my);
      dx += (rx[i] - mx) ** 2;
      dy += (ry[i] - my) ** 2;
    }
    if (!dx || !dy) return null;
    return { rho: num / Math.sqrt(dx * dy), n };
  }

  function csvEscape(value) {
    if (value == null) return "";
    const text = String(value);
    return /[";,\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  return {
    csvEscape,
    filterHouses,
    inRange,
    median,
    normalizeSearch,
    percentile,
    sortHouses,
    spearman,
    validateRanges,
    wardSummaries,
  };
});
