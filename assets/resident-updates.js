/* Registros de participação na pesquisa. Sem transcrição de correspondência,
   dados familiares ou informações de contato. Atualização de 06/11/2026. */
(function () {
  const city = window.NEKO_CITY;
  const house = "Kagurazaka House (Wakui + Wakui)";
  const client = city.clientela.find((record) => record.name === house);
  if (client) Object.assign(client, {
    classification: "Autoria-habitação",
    detail: "Residência dos próprios arquitetos. Resposta recebida em 06/11/2026; publicação dos trechos aguarda autorização."
  });

  const records = [
    {
      house: "Kenyu Fujii Residence (own house)",
      relation: "Arquiteto + morador",
      architectResident: true,
      responseType: "Resposta direta registrada na pesquisa.",
      responseDate: "21/09/2026",
      publicationStatus: "authorized",
      ward: "Nakano",
      year: null
    },
    {
      house,
      relation: "Arquiteto + morador",
      architectResident: true,
      responseType: "Resposta recebida; publicação dos trechos aguarda autorização.",
      responseDate: "06/11/2026",
      publicationStatus: "pending",
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
