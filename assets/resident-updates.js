/* Registros de participação na pesquisa. Sem transcrição de correspondência,
   dados familiares ou informações de contato. Atualização de 06/11/2026. */
(function () {
  const city = window.NEKO_CITY;
  const house = "Kagurazaka House (Wakui + Wakui)";
  const client = city.clientela.find((record) => record.name === house);
  if (client) Object.assign(client, {
    classification: "Autoria-habitação",
    detail: "Residência dos próprios arquitetos."
  });

  const canonicalHouseName = (name) => name === "Kenyu Fujii Residence (own house)" ? "Kenyu Fujii Residence" : name;
  for (const record of city.clientela) record.name = canonicalHouseName(record.name);
  for (const record of city.residents) record.house = canonicalHouseName(record.house);

  const records = [
    {
      house: "Kenyu Fujii Residence",
      relation: "Arquiteto + morador",
      architectResident: true,
      responseType: "Dimensões úteis do lote, escada como vazio para luz e ventilação, convivência com animais, adaptação cotidiana e avaliação da experiência de morar.",
      responseDate: "21/09/2026",
      publicationStatus: "authorized",
      ward: "Nakano",
      year: null,
      yearLabel: "ocupação c. 2005",
      yearSource: "https://www.kenyufujii.com/info-1",
      yearNote: "Início da ocupação estimado pela referência a dez anos de moradia em nota do escritório de 01/05/2015. O ano exato de conclusão não está confirmado."
    },
    {
      house,
      relation: "Arquiteto + morador",
      architectResident: true,
      responseType: "Banho e escadas com múltiplos usos, privacidade entre pavimentos, trabalho doméstico e armazenamento, circulação vertical e cuidado, luz natural, bairro como extensão da casa e organização em corte.",
      responseDate: "06/11/2026",
      publicationStatus: "authorized",
      ward: "Shinjuku",
      year: 2024
    }
  ];
  for (const response of records) {
    const existing = city.residents.find((record) => record.house === response.house);
    if (existing) Object.assign(existing, response);
    else city.residents.push(response);
  }
})();
