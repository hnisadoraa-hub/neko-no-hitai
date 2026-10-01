/* Achados: o que o corpus diz.

   Os números entre chaves são recalculados na página a partir de assets/data.js
   a cada carregamento. Nenhum valor está escrito à mão aqui, para que o texto
   não descole do dado se a planilha mudar.

   Toda leitura vale para o arquivo publicado, não para a cidade. Um corpus de
   casas divulgadas mede o que editores, revistas e escritórios escolheram
   mostrar. Onde isso importa, o achado traz a ressalva junto. */

window.NEKO_FINDINGS = {
  lede: "Quatro leituras que saem das {n} fichas comparáveis da aba 01 casas base. Cada uma traz o método e a ressalva, porque um corpus de casas publicadas mede o arquivo e não a frequência urbana. As correlações são de postos, de Spearman, e descrevem associação monotônica: não estabelecem causa.",

  items: [
    {
      key: "intensidade",
      number: "01",
      claim: "Quanto menor o lote, mais intensa a operação espacial.",
      body: "A restrição não produz recuo, produz adensamento do gesto. Nos lotes abaixo de 40 m², a mediana do FAR observado é {farSmall}× contra {farBig}× nos lotes de 80 m² ou mais. A ocupação do solo sobe de {bcrBig}% para {bcrSmall}%, e o empilhamento equivalente, que é a área construída dividida pela projeção, vai de {stackBig}× para {stackSmall}×. As três correlações com a área do lote são negativas e consistentes.",
      method: "ρ lote × FAR = {rhoFar} · ρ lote × BCR = {rhoBcr} · ρ lote × empilhamento = {rhoStack} · n = {n}",
      caveat: "Associação, não causa. E o corpus é de casas de autoria publicada: a intensificação observada é a que a arquitetura de projeto faz, não necessariamente a que o mercado imobiliário faz no mesmo tamanho de lote.",
      chart: "bands",
    },
    {
      key: "compensacao",
      number: "02",
      claim: "A intensificação compensa parte da perda, nunca toda.",
      body: "Empilhar devolve área, e não devolve a mesma área. A mediana da construída é {builtSmall} m² nos lotes abaixo de 40 m² e {builtBig} m² nos de 80 m² ou mais: {builtGap} m² de diferença, apesar de todo o esforço de seção. A correlação entre lote e área construída continua positiva e forte. É o argumento contra romantizar a falta de espaço, e ele está no próprio dado.",
      method: "ρ lote × área construída = {rhoBuilt} · medianas por faixa de lote · n = {n}",
      caveat: "A área construída publicada nem sempre coincide com a área efetivamente vivida. Mezanino, subsolo e desvão entram no cômputo de formas diferentes conforme a fonte.",
      chart: "built",
    },
    {
      key: "tempo",
      number: "03",
      claim: "No arquivo publicado, o lote não encolhe.",
      body: "A leitura corrente diz que o microlote avança. O corpus não mostra isso: a mediana do lote é {lot2000} m² nos anos 2000, {lot2010} m² nos 2010 e {lot2020} m² nos 2020. A correlação entre ano e área do lote é {rhoYear}, praticamente nula. O que se move, de leve, é o empilhamento, que cai de {stack2000}× para {stack2020}×.",
      method: "medianas por década · ρ ano × lote = {rhoYear} · n = {n}",
      caveat: "Esta é a ressalva mais importante do atlas. O corpus mede o arquivo, não o mercado fundiário. Se a microlotização avança na cidade e não avança aqui, a diferença é editorial, e é matéria da pesquisa. Décadas de 1960, 1970 e 1990 têm uma única obra cada: a série só é legível a partir de 2000.",
      chart: "decades",
    },
    {
      key: "pavimentos",
      number: "04",
      claim: "Três pavimentos é a regra, não a exceção.",
      body: "Entre as {floorsN} fichas que registram pavimentos, {floors3} são de três pavimentos, {floorsShare}% do subconjunto. Somadas as de dois a quatro, chega-se a {floors234}. A verticalização do microlote é baixa e consistente, o que faz sentido sob a altura absoluta de 10 ou 12 m das zonas exclusivas de baixa altura, e sob o plano inclinado do lado norte.",
      method: "contagem direta do número de pavimentos registrado na planilha, inteiro em {floorsN} de {n} fichas",
      caveat: "Em {floorsMissing} fichas o campo está vazio ou descreve níveis que não se reduzem a um número inteiro, e essas ficam fora da conta. Quando a planilha separa subsolo (B1) ou loft, conta-se só o número de pavimentos e o resto fica anotado na ficha. Em {floorsOdd} fichas o empilhamento equivalente supera os pavimentos registrados, subsolo incluído, o que sugere mezanino ou nível não anotado; elas estão sinalizadas na lista.",
      chart: "floors",
    }
  ],

  /* Régua de comparação. As referências japonesas saem das fontes do próprio
     trabalho; as brasileiras são medidas correntes, sem norma citada. */
  scale: {
    title: "O tamanho de que estamos falando",
    lede: "Metro quadrado não diz nada sozinho, então aqui estão as medidas ao lado das quais o corpus deve ser lido.",
    items: [
      { label: "1K inicial da JHC, Aichi", value: 12.12, note: "1955 a 1960, banho e sanitário coletivos · Miyazaki, 1993, p. 33", kind: "ref" },
      { label: "Vaga de garagem", value: 12.0, note: "2,40 × 5,00 m · medida corrente", kind: "ref" },
      { label: "Seis tsubo", value: 19.83, note: "6 × 3,3058 m² · unidade japonesa", kind: "ref" },
      { label: "Menor lote do corpus", value: null, field: "minLot", note: "{minLotName}", kind: "corpus" },
      { label: "Modelo 51C, 1951", value: 35.0, note: "área privativa aproximada · DK, pais e filhos", kind: "ref" },
      { label: "Referência do Jūseikatsu Kihon Keikaku", value: 40.0, note: "acima de aproximadamente 40 m² · MLIT, 2026 [VERIFICAR]", kind: "ref" },
      { label: "Lote mediano do corpus", value: null, field: "medLot", note: "{n} fichas comparáveis · aba 01 casas base", kind: "corpus" },
      { label: "Corte do recorte", value: 100.0, note: "limite operacional da pesquisa", kind: "cut" },
    ],
    catNote: "Um gato doméstico deitado ocupa algo perto de 0,1 m². O menor lote do corpus, com {minLot} m², caberia {catCount} vezes essa área. Neko no hitai (猫の額), literalmente “testa de gato”, é uma expressão japonesa para lugares de área muito pequena. Como a testa do gato é estreita, a imagem serve para qualquer espaço apertado, de um jardim a um terreno, como em 猫の額ほどの庭, “um jardim do tamanho da testa de um gato”.",
  },
};
