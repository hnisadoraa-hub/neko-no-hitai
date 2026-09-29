/* Parâmetros urbanísticos por zona de uso e o cálculo do envelope.
   Base: 建築基準法 (Lei de Padrões de Construção, Lei nº 201 de 1950), arts. 42, 52,
   53, 53-2, 55, 56 e 56-2, e 都市計画法 (Lei de Planejamento Urbano), art. 8 e 9.

   O que esta tabela é: os valores que o plano urbano PODE designar em cada classe
   de zona, e as regras gerais de altura e inclinação. O que ela não é: o cálculo
   de um lote real. O limite de um lote depende da designação específica da parcela,
   do plano de distrito, da zona de prevenção contra incêndio e das exceções
   aplicáveis, nenhum dos quais está na base do corpus.

   Conferir sempre o texto vigente no e-Gov e o mapa urbanístico de Tóquio. */

window.NEKO_LAW = {
  pedireito: 2.9, // altura suposta por pavimento, usada só para estimar nº de pisos

  zones: [
    {
      key: "l1", ja: "第一種低層住居専用地域", pt: "Residencial exclusiva de baixa altura I",
      bcr: [30, 40, 50, 60], bcrDefault: 50,
      far: [50, 60, 80, 100, 150, 200], farDefault: 100,
      absoluteHeight: 10, northStart: 5, northSlope: 1.25,
      roadSlope: 1.25, roadCoef: 0.4, neighbourStart: null,
      note: "Altura absoluta de 10 m ou 12 m conforme o plano. O plano inclinado do lote vizinho não se aplica.",
    },
    {
      key: "l2", ja: "第二種低層住居専用地域", pt: "Residencial exclusiva de baixa altura II",
      bcr: [30, 40, 50, 60], bcrDefault: 60,
      far: [50, 60, 80, 100, 150, 200], farDefault: 150,
      absoluteHeight: 10, northStart: 5, northSlope: 1.25,
      roadSlope: 1.25, roadCoef: 0.4, neighbourStart: null,
      note: "Mesmo regime de altura da zona I, com comércio de pequeno porte admitido.",
    },
    {
      key: "m1", ja: "第一種中高層住居専用地域", pt: "Residencial exclusiva de média e alta altura I",
      bcr: [30, 40, 50, 60], bcrDefault: 60,
      far: [100, 150, 200, 300, 400, 500], farDefault: 200,
      absoluteHeight: null, northStart: 10, northSlope: 1.25,
      roadSlope: 1.25, roadCoef: 0.4, neighbourStart: 20,
      note: "O plano do lado norte parte de 10 m e deixa de ser exigido onde a regulação de sombra é designada.",
    },
    {
      key: "m2", ja: "第二種中高層住居専用地域", pt: "Residencial exclusiva de média e alta altura II",
      bcr: [30, 40, 50, 60], bcrDefault: 60,
      far: [100, 150, 200, 300, 400, 500], farDefault: 200,
      absoluteHeight: null, northStart: 10, northSlope: 1.25,
      roadSlope: 1.25, roadCoef: 0.4, neighbourStart: 20,
      note: "Mesmo regime da zona I, com comércio de médio porte admitido.",
    },
    {
      key: "j1", ja: "第一種住居地域", pt: "Residencial I",
      bcr: [50, 60, 80], bcrDefault: 60,
      far: [100, 150, 200, 300, 400, 500], farDefault: 200,
      absoluteHeight: null, northStart: null, northSlope: null,
      roadSlope: 1.25, roadCoef: 0.4, neighbourStart: 20,
      note: "Sem plano do lado norte. A sombra passa a ser o instrumento de proteção do vizinho.",
    },
    {
      key: "j2", ja: "第二種住居地域", pt: "Residencial II",
      bcr: [50, 60, 80], bcrDefault: 60,
      far: [100, 150, 200, 300, 400, 500], farDefault: 200,
      absoluteHeight: null, northStart: null, northSlope: null,
      roadSlope: 1.25, roadCoef: 0.4, neighbourStart: 20,
      note: "Admite usos mistos de maior porte que a zona I.",
    },
    {
      key: "jq", ja: "準住居地域", pt: "Quase residencial",
      bcr: [50, 60, 80], bcrDefault: 60,
      far: [100, 150, 200, 300, 400, 500], farDefault: 200,
      absoluteHeight: null, northStart: null, northSlope: null,
      roadSlope: 1.25, roadCoef: 0.4, neighbourStart: 20,
      note: "Faixas de via arterial com convivência entre moradia e serviço automotivo.",
    },
    {
      key: "kc", ja: "近隣商業地域", pt: "Comercial de vizinhança",
      bcr: [60, 80], bcrDefault: 80,
      far: [100, 150, 200, 300, 400, 500], farDefault: 300,
      absoluteHeight: null, northStart: null, northSlope: null,
      roadSlope: 1.5, roadCoef: 0.6, neighbourStart: 31,
      note: "Coeficiente de via mais alto e inclinação mais permissiva que nas zonas residenciais.",
    },
    {
      key: "sc", ja: "商業地域", pt: "Comercial",
      bcr: [80], bcrDefault: 80,
      far: [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300], farDefault: 400,
      absoluteHeight: null, northStart: null, northSlope: null,
      roadSlope: 1.5, roadCoef: 0.6, neighbourStart: 31,
      note: "Em zona de prevenção contra incêndio, a edificação resistente ao fogo pode ficar sem limite de ocupação.",
    },
    {
      key: "pk", ja: "準工業地域", pt: "Semi-industrial",
      bcr: [50, 60, 80], bcrDefault: 60,
      far: [100, 150, 200, 300, 400], farDefault: 200,
      absoluteHeight: null, northStart: null, northSlope: null,
      roadSlope: 1.5, roadCoef: 0.6, neighbourStart: 31,
      note: "Zona recorrente no tecido de machikoba, onde moradia e oficina convivem.",
    },
  ],

  /* Calcula o envelope a partir de parâmetros declarados.
     Toda saída é hipotética: depende de valores que o usuário escolhe, não de
     designação verificada da parcela. */
  compute(input) {
    const zone = this.zones.find((z) => z.key === input.zoneKey) || this.zones[0];
    const front = Math.max(0.1, Number(input.front) || 0);
    const depth = Math.max(0.1, Number(input.depth) || 0);
    const roadRaw = Math.max(0.1, Number(input.roadWidth) || 0);
    const grossArea = front * depth;

    // art. 42, § 2: via abaixo de 4 m obriga recuo até 2 m do eixo
    const setbackApplies = roadRaw < 4;
    const setbackDepth = setbackApplies ? (4 - roadRaw) / 2 : 0;
    const cededArea = setbackDepth * front;
    const netArea = Math.max(0.1, grossArea - cededArea);
    const netDepth = Math.max(0.1, depth - setbackDepth);
    const roadEffective = setbackApplies ? 4 : roadRaw;

    // art. 53: ocupação designada e acréscimos
    const bcrBase = Number(input.bcr) || zone.bcrDefault;
    const bonusCorner = input.corner ? 10 : 0;
    const bonusFire = input.fireproof ? 10 : 0;
    const unlimited = bcrBase === 80 && input.fireproof;
    const bcrApplied = unlimited ? 100 : Math.min(100, bcrBase + bonusCorner + bonusFire);

    // art. 52: aproveitamento designado e teto pela largura da via
    const farDesignated = Number(input.far) || zone.farDefault;
    const farByRoad = roadEffective < 12 ? roadEffective * zone.roadCoef * 100 : Infinity;
    const farApplied = Math.min(farDesignated, farByRoad);
    const farBinding = farByRoad < farDesignated ? "via" : "plano";

    const maxFootprint = netArea * (bcrApplied / 100);
    const maxFloorArea = netArea * (farApplied / 100);

    // art. 55: altura absoluta nas zonas de baixa altura
    const absoluteHeight = zone.absoluteHeight ? (Number(input.absoluteHeight) || zone.absoluteHeight) : null;

    // art. 56: planos inclinados
    const roadSlant = { slope: zone.roadSlope, origin: -roadEffective };
    const northSlant = zone.northStart ? { start: zone.northStart, slope: zone.northSlope } : null;
    const neighbourSlant = zone.neighbourStart ? { start: zone.neighbourStart, slope: zone.roadSlope >= 1.5 ? 2.5 : 1.25 } : null;

    // altura útil no ponto mais desfavorável do lote, considerando os planos
    const heightAtDepth = (d) => {
      const limits = [];
      if (absoluteHeight) limits.push(absoluteHeight);
      limits.push((roadEffective + d) * zone.roadSlope);
      if (northSlant) limits.push(northSlant.start + (netDepth - d) * northSlant.slope);
      return Math.min(...limits);
    };
    const heightAtFront = heightAtDepth(0);
    const heightAtBack = heightAtDepth(netDepth);
    const heightMax = Math.max(heightAtFront, heightAtBack, heightAtDepth(netDepth / 2));
    const floorsEstimate = Math.max(0, Math.floor(heightMax / this.pedireito));

    return {
      zone, front, depth, grossArea, setbackApplies, setbackDepth, cededArea,
      netArea, netDepth, roadRaw, roadEffective,
      bcrBase, bonusCorner, bonusFire, bcrApplied, unlimited,
      farDesignated, farByRoad, farApplied, farBinding,
      maxFootprint, maxFloorArea,
      absoluteHeight, roadSlant, northSlant, neighbourSlant,
      heightAtFront, heightAtBack, heightMax, floorsEstimate,
      heightAtDepth,
    };
  },
};
