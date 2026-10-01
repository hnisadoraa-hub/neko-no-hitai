/* Contexto territorial dos 23 wards especiais de Tóquio.
   Notas com {wardCount}, {corpusTotal} e {wardShare} são preenchidas na página
   a partir das fichas comparáveis. O regime de lote mínimo de cada ward não
   fica aqui: vem da aba de normas da planilha (city.js) e aparece no cartão
   de norma do perfil.
   População e área: síntese do 令和7年国勢調査 (censo de 1º de outubro de 2025,
   valores preliminares) e do levantamento de área do 国土地理院 para a mesma data,
   compilados em uub.jp. Densidade calculada aqui a partir dos dois campos.
   Os perfis são descrições de formação urbana. Onde a afirmação não pôde ser
   confirmada em fonte primária, o texto traz [VERIFICAR]. */

window.WARD_CONTEXT = {
  source: {
    demography: "令和7年国勢調査 (censo de 01/10/2025, preliminar) e 国土地理院, área em 01/10/2025",
    demographyUrl: "https://uub.jp/rnk/tokyo/k_j.html",
    note: "Densidade calculada a partir de população e área. A área inclui superfícies de água e terrenos não edificáveis, por isso a densidade por km² não é densidade de solo residencial.",
    profileNote: "Os perfis descrevem formação urbana e caráter do tecido. Não são leitura normativa e não substituem a consulta urbanística parcelar.",
  },
  wards: {
    Chiyoda: {
      ja: "千代田区", code: "13101", pop: 66199, area: 11.66,
      belt: "centro",
      profile: "Perímetro do antigo castelo de Edo. O Palácio Imperial e seus fossos ocupam parcela expressiva do território, o que rebaixa a densidade aparente e concentra a população residual em Kanda, Iidabashi e Bancho. É o ward menos populoso dos 23 e o mais dominado por zoneamento comercial.",
      notes: [
        "A densidade agregada é enganosa: o Palácio Imperial e o parque Kitanomaru não são solo residencial.",
        "Kanda preserva parcelamento fino de origem Edo, com lotes estreitos e profundos voltados para a rua.",
        "Faixa de FAR designável vai a 1.300%, a mais alta dos 23 wards junto com Chuo.",
      ],
    },
    Chuo: {
      ja: "中央区", code: "13102", pop: 181918, area: 10.21,
      belt: "centro",
      profile: "Núcleo mercantil de Edo, com Nihonbashi, Ginza e Tsukiji. A população residente despencou durante a bolha e voltou a crescer desde os anos 1990 por torres residenciais em Tsukishima, Kachidoki e Harumi. O tecido fino sobrevive sobretudo nas ilhas do Sumida.",
      notes: [
        "Tsukishima e Tsukuda mantêm nagaya e becos (roji) com lotes muito pequenos, cercados por torres.",
        "O crescimento populacional recente vem de verticalização em terrenos grandes, não de microlotes.",
        "Regime de lote mínimo apenas em áreas delimitadas por plano de distrito.",
      ],
    },
    Minato: {
      ja: "港区", code: "13103", pop: 272662, area: 20.36,
      belt: "centro",
      profile: "Embaixadas, sedes corporativas e residências de alto padrão sobre um relevo acidentado, com os terraços do Yamanote cortados por vales estreitos. Azabu, Shirokane e Takanawa combinam grandes propriedades com tecido de viela herdado do período Edo.",
      notes: [
        "A topografia produz lotes irregulares e acessos por escadaria, condição recorrente nos microlotes do ward.",
        "Pressão fundiária alta favorece desmembramento de propriedades antigas.",
        "Faixa de FAR designável chega a 1.000%.",
      ],
    },
    Shinjuku: {
      ja: "新宿区", code: "13104", pop: 361634, area: 18.22,
      belt: "centro",
      profile: "Sede do governo metropolitano e maior nó ferroviário do mundo em movimento de passageiros, mas com grande parte do território ocupada por tecido residencial de baixa altura em Ochiai, Wakamatsu e Kagurazaka. A diferença entre o centro de Nishi-Shinjuku e essas áreas é a diferença entre dois regimes fundiários.",
      notes: [
        "Kagurazaka preserva rede de becos de origem pré-guerra, com lotes estreitos e vias abaixo de 4 m.",
        "Regime de lote mínimo definido em anexo de lei local de 2007, aplicável a áreas delimitadas.",
        "Waseda e Takadanobaba concentram habitação estudantil de pequena metragem, que não se confunde com microlote unifamiliar.",
      ],
    },
    Bunkyo: {
      ja: "文京区", code: "13105", pop: 250030, area: 11.29,
      belt: "centro",
      profile: "Ward acadêmico e residential consolidado, com a Universidade de Tóquio em Hongo e um relevo de terraços e vales que organiza o parcelamento. Koishikawa, Sendagi e Nezu mantêm tecido fino com muitas encostas e vias sem saída.",
      notes: [
        "A topografia de terraço produz lotes com desnível interno, o que empurra o projeto para a seção.",
        "Não define lote mínimo por norma própria segundo o registro atual da base.",
        "Love2 House, um dos casos do trabalho, está aqui.",
      ],
    },
    Taito: {
      ja: "台東区", code: "13106", pop: 228390, area: 10.11,
      belt: "shitamachi",
      profile: "Menor ward em área e um dos mais densos. Asakusa, Ueno e Yanaka formam o shitamachi por excelência. Parte de Yanaka escapou dos bombardeios incendiários de 1945, o que preservou parcelamento pré-guerra e conjuntos de nagaya raros em Tóquio.",
      notes: [
        "Define lote mínimo em três áreas delimitadas: Asakusa Rokku, entorno da estação de Okachimachi e Yanaka.",
        "A sobrevivência do tecido pré-guerra em Yanaka é exceção documentável, não regra da cidade.",
        "Densidade de 22.590 hab./km² sobre 10,11 km², a menor área dos 23.",
      ],
    },
    Sumida: {
      ja: "墨田区", code: "13107", pop: 285203, area: 13.77,
      belt: "shitamachi",
      profile: "Margem leste do rio Sumida, atingida com severidade pelo terremoto de 1923 e pelos bombardeios de 1945. A reconstrução manteve o parcelamento fino e a mistura entre moradia e oficina de pequeno porte, o machikoba, que ainda define o tecido de Kyojima e Higashi-Mukojima.",
      notes: [
        "Kyojima é uma das maiores concentrações remanescentes de vias estreitas e casas de madeira densas de Tóquio.",
        "A mistura casa e oficina embaralha a separação entre programa doméstico e produtivo.",
        "Regime de lote mínimo conforme anexo 3 da lei local, em áreas delimitadas.",
      ],
    },
    Koto: {
      ja: "江東区", code: "13108", pop: 553358, area: 42.99,
      belt: "shitamachi",
      profile: "Território em boa parte aterrado, organizado por canais, com Fukagawa e Kiba de um lado e a frente de água de Toyosu e Ariake de outro. Convivem tecido fino de origem Edo e redesenvolvimento em escala grande sobre antigas áreas portuárias e industriais.",
      notes: [
        "Áreas de cota zero, abaixo do nível da maré alta, com implicações para fundação e drenagem.",
        "Morishita e Monzen-nakacho mantêm parcelamento fino, e ambos aparecem no corpus.",
        "Não define lote mínimo por norma própria segundo o registro atual da base.",
      ],
    },
    Shinagawa: {
      ja: "品川区", code: "13109", pop: 426403, area: 22.85,
      belt: "sul",
      profile: "Antiga primeira estação do Tokaido somada a um cinturão industrial costeiro e a um interior residencial muito denso em Togoshi, Nakanobu e Ebara. As galerias comerciais lineares organizam o tecido e deixam quarteirões internos de parcelamento miúdo.",
      notes: [
        "Togoshi Ginza é uma das mais longas galerias comerciais de rua de Tóquio e estrutura o parcelamento ao redor.",
        "Registra lote mínimo de 60 m² em áreas delimitadas.",
        "Terceiro ward mais representado no corpus.",
      ],
    },
    Meguro: {
      ja: "目黒区", code: "13110", pop: 286468, area: 14.67,
      belt: "yamanote",
      profile: "Residencial do Yamanote organizado pelo vale do rio Meguro, com Nakameguro, Jiyugaoka e Yutenji. A valorização contínua da terra sustenta um ciclo de desmembramento de lotes maiores em parcelas menores, que é justamente o mecanismo estudado pelo trabalho.",
      notes: [
        "Small House, de Unemori Architects, e Flagpole in Nakameguro, de SALHAUS, estão aqui.",
        "Lotes em bandeira, com acesso por corredor estreito, são recorrentes no tecido de encosta.",
      ],
    },
    Ota: {
      ja: "大田区", code: "13111", pop: 759409, area: 61.86,
      belt: "sul",
      profile: "Maior ward em área e o de maior contraste interno. Den-en-chofu é subúrbio-jardim planejado nos anos 1920, com lotes grandes e regra própria. Kamata e Omori abrigam uma das maiores concentrações de machikoba do país, com parcelamento extremamente fino. O aeroporto de Haneda ocupa a frente de água.",
      notes: [
        "Os dois extremos do espectro fundiário de Tóquio convivem dentro do mesmo ward.",
        "O único lote mínimo registrado é de 250 m² em Tokai 3-chome, área portuária, e não se aplica ao tecido residencial comum.",
        "Den-en-chofu é o contraexemplo útil: o microlote não é destino inevitável da cidade japonesa.",
        "Building Frame of the House, de IGArchitects, está aqui.",
      ],
    },
    Setagaya: {
      ja: "世田谷区", code: "13112", pop: 956608, area: 58.05,
      belt: "oeste",
      profile: "Ward mais populoso dos 23. Formou-se pela conversão de terras agrícolas ao longo das linhas férreas privadas no entreguerras e, sobretudo, no pós-guerra. O resultado é uma extensão contínua de habitação unifamiliar em lotes médios, submetida desde os anos 1990 a desmembramento sucessivo.",
      notes: [
        "Concentra {wardCount} das {corpusTotal} casas do recorte comparável, {wardShare}% do total, a maior participação isolada.",
        "Padrão histórico de lote da área ronda 120 m², segundo registro do trabalho, o que torna o desmembramento em duas parcelas a operação decisiva.",
        "House in a Plum Grove, House M e Tokyo Bud House estão aqui.",
      ],
    },
    Shibuya: {
      ja: "渋谷区", code: "13113", pop: 239119, area: 15.11,
      belt: "centro",
      profile: "Núcleo comercial e de mídia sobre um relevo de vales pronunciados, cercado por residencial de alto padrão em Shoto, Hiroo e Yoyogi-Uehara. A diferença de preço entre o fundo do vale e o topo do terraço se traduz em diferença de parcelamento.",
      notes: [
        "A Tower House de Takamitsu Azuma, de 1966, marco inicial do corpus, está aqui, em lote de 20,56 m².",
        "Milk Carton House, de 8./tenhachi, também está aqui.",
        "Não define lote mínimo por norma própria segundo o registro atual da base.",
      ],
    },
    Nakano: {
      ja: "中野区", code: "13114", pop: 355333, area: 15.59,
      belt: "oeste",
      profile: "Um dos wards mais densos e quase inteiramente de baixa altura. Cresceu depressa depois do terremoto de 1923, quando a população deslocada do centro ocupou o oeste, e de novo no pós-guerra. O parcelamento é fino e a malha viária ficou estreita.",
      notes: [
        "Alta incidência de vias abaixo de 4 m, o que aciona o recuo do artigo 42, parágrafo 2, e reduz o lote edificável.",
        "Nakano House, de Suzuko Yamada Architects, está aqui.",
      ],
    },
    Suginami: {
      ja: "杉並区", code: "13115", pop: 597566, area: 34.06,
      belt: "oeste",
      profile: "Expansão suburbana do entreguerras ao longo da linha Chuo, com Koenji, Asagaya e Ogikubo. Tecido residencial de baixa altura muito contínuo, com tradição de movimentos de vizinhança ativos em questões de altura e sombreamento.",
      notes: [
        "Ausente do pacote público A29-2019, o que impede a leitura da faixa de zoneamento por este atlas.",
        "Tunnel House, de Makiko Tsukada, e Open Sky House, de Zajirogh, estão aqui.",
      ],
    },
    Toshima: {
      ja: "豊島区", code: "13116", pop: 306106, area: 13.01,
      belt: "norte",
      profile: "Ward mais denso dos 23, organizado em torno de Ikebukuro. Combina verticalização comercial intensa com um miolo residencial de baixa altura e parcelamento fino em Zoshigaya, Sugamo e Nagasaki.",
      notes: [
        "Densidade de 23.528 hab./km², a mais alta de Tóquio.",
        "Ausente do pacote público A29-2019, mesma lacuna de Suginami.",
        "1.8 M Width House, de YUUA, está aqui, em lote de largura mínima.",
      ],
    },
    Kita: {
      ja: "北区", code: "13117", pop: 368290, area: 20.61,
      belt: "norte",
      profile: "Antigas terras militares e industriais em Oji e Akabane, convertidas no pós-guerra em grandes conjuntos habitacionais públicos e, ao redor deles, em tecido shitamachi de parcelamento fino. A convivência entre danchi e casa individual é a marca do ward.",
      notes: [
        "Os danchi oferecem um contraponto direto ao microlote: mesma escassez, solução coletiva.",
        "Regime de lote mínimo apenas em áreas delimitadas por plano de distrito.",
      ],
    },
    Arakawa: {
      ja: "荒川区", code: "13118", pop: 226482, area: 10.16,
      belt: "shitamachi",
      profile: "Pequeno, denso e industrial em escala miúda. Nippori concentra o comércio têxtil e Machiya mantém tecido de machikoba com lotes muito pequenos, herdados do parcelamento do início do século XX.",
      notes: [
        "Entre os wards com maior proporção de lotes abaixo de 100 m² no tecido comum, condição a confirmar em fonte fundiária. [VERIFICAR]",
      ],
    },
    Itabashi: {
      ja: "板橋区", code: "13119", pop: 595000, area: 32.22,
      belt: "norte",
      profile: "Antiga estação de posta do Nakasendo, depois área industrial e militar, convertida no pós-guerra em grandes conjuntos habitacionais e residencial de baixa altura ao longo do rio Shakujii. Densidade alta, preço da terra moderado para os padrões do centro.",
      notes: [
        "Takashimadaira é um dos maiores conjuntos habitacionais públicos do país e serve de contraponto de escala.",
      ],
    },
    Nerima: {
      ja: "練馬区", code: "13120", pop: 761587, area: 48.08,
      belt: "oeste",
      profile: "Último dos 23 a ser criado, desmembrado de Itabashi em 1947. A conversão agrícola foi tardia e parcial, e ainda restam parcelas produtivas dentro do perímetro urbano. O lote médio é maior e a densidade menor que a dos wards centrais.",
      notes: [
        "A agricultura urbana remanescente é um caso raro de reserva fundiária dentro da cidade consolidada.",
      ],
    },
    Adachi: {
      ja: "足立区", code: "13121", pop: 702718, area: 53.25,
      belt: "nordeste",
      profile: "Ao norte do rio Arakawa, com Senju como antiga estação de posta e o restante do território ocupado por residencial de baixa altura formado no pós-guerra. Terreno baixo, preço da terra entre os mais acessíveis dos 23.",
      notes: [
        "Preço da terra mais baixo reduz a pressão de desmembramento, hipótese que o corpus pode testar.",
        "Apenas uma casa do recorte comparável está aqui.",
      ],
    },
    Katsushika: {
      ja: "葛飾区", code: "13122", pop: 467614, area: 34.80,
      belt: "nordeste",
      profile: "Entre os rios Arakawa e Edogawa, com Shibamata e Tateishi. Terreno baixo, tecido de canais e forte presença de machikoba. Preço da terra baixo e parcelamento herdado de loteamentos do pós-guerra.",
      notes: [
        "House 14º, de Akaike Kazuhito, está aqui.",
        "Não define lote mínimo por norma própria segundo o registro atual da base.",
      ],
    },
    Edogawa: {
      ja: "江戸川区", code: "13123", pop: 705063, area: 49.90,
      belt: "nordeste",
      profile: "Extremo leste, entre o rio Edogawa e a baía. Grande parte do território está em cota zero, abaixo do nível da maré alta, o que condiciona fundação, drenagem e risco. O crescimento é pós-guerra e majoritariamente de baixa altura.",
      notes: [
        "As áreas de cota zero impõem custo de fundação que interfere na economia do microlote.",
      ],
    },
  },
};
