/* Duas vozes: as respostas da correspondência postas uma contra a outra.

   Doze confrontos, em seis frentes. Cada um põe duas pessoas distintas lado a
   lado respondendo à mesma pergunta, e só com
   citação direta: o original como a pessoa escreveu, em japonês ou em inglês,
   e embaixo a tradução livre da autora, as duas copiadas sem alteração do
   RASCUNHO OFICIAL ORIGINAL. Nenhuma paráfrase entra aqui, e nenhuma
   tradução foi feita por esta página.

   Toda fala citada tem autorização registrada na lista de referências, e a
   autorização aparece no pé do card com as palavras do registro. Quem
   respondeu sem autorização anotada ficou de fora, mesmo quando a fala seria
   ótima para um par.

   O que é evidência: as falas, os originais, as traduções, as fontes e as
   autorizações. O que é proposta: o emparelhamento e a leitura embaixo de
   cada par. O par não estava no material: é recorte, e está declarado. */

(function () {
  "use strict";

  const A = window.NekoAtlas;
  if (!A) return;
  const $ = (id) => document.getElementById(id);

  const CORR = "correspondência";
  const PUB = "publicado";

  const PARES = [
    {
      grupo: "O recorte",
      tema: "O que conta como pequeno",
      pergunta: "O que faz uma casa ser pequena: o terreno ou a casa?",
      relacao: "contradizem",
      a: {
        nome: "Mika Narasaki",
        ja: "楢﨑美香",
        papel: "pesquisadora do LIFULL HOME’S Research Institute",
        lang: "ja",
        orig: "本記事においては、「敷地面積60㎡未満」を狭小戸建てと定義しております。なお、集計期間は「1月1日〜12月31日」の暦年集計です。",
        trad: "nesta matéria, definimos como casa compacta em lote pequeno aquela implantada em terreno com menos de 60 m². O período de apuração corresponde ao ano civil, de 1º de janeiro a 31 de dezembro.",
        fonte: "Narasaki, 2026 · correspondência eletrônica, Tóquio, 27–28 ago. 2026",
        via: CORR,
        permissao: "Citação e identificação institucional autorizadas pela remetente.",
      },
      b: {
        nome: "Mieko Hinokidani",
        ja: "檜谷美恵子",
        papel: "pesquisadora de política habitacional da Universidade Prefeitural de Quioto",
        lang: "ja",
        orig: "つまり、小規模敷地にたつ住宅イコール狭小住宅ではない、ということです。",
        trad: "ou seja, uma casa em terreno pequeno não equivale a uma casa pequena.",
        fonte: "Hinokidani, 2026 · correspondência eletrônica, Quioto, 1º set. 2026",
        via: CORR,
        permissao: "Citação expressamente autorizada pela remetente.",
      },
      leitura: "Uma define pequeno pelo solo, abaixo de 60 m², e conta anúncios nessa faixa. A outra desfaz a equivalência numa frase. As duas medem coisas diferentes, e nenhuma delas é o corte deste atlas, que é 100 m² de solo. A régua muda a pergunta, e por isso ela precisa estar escrita antes de qualquer número.",
    },
    {
      grupo: "A norma",
      tema: "A regra determina a forma?",
      pergunta: "O que mais determinou a forma desta casa?",
      relacao: "contradizem",
      a: {
        nome: "Takaaki Fuji",
        papel: "TYFA, sobre a Bay Window Tower House",
        lang: "en",
        orig: "Regulation determines form; form determines structure; structure responds to the conditions of construction.",
        trad: "a regulação determina a forma; a forma determina a estrutura; a estrutura responde às condições de construção.",
        fonte: "Fuji, 2026 · correspondência eletrônica",
        via: CORR,
        permissao: "Citação autorizada pelo remetente; identificação solicitada: “Takaaki Fuji, TYFA (Takaaki Fuji + Yuko Fuji Architecture), correspondence with the author”.",
      },
      b: {
        nome: "Takeshi Hosaka",
        ja: "保坂猛",
        papel: "Takeshi Hosaka Architects",
        lang: "ja",
        orig: "形態を最も決定づけたものは、規制や制約条件ではありません。むしろ、規制や制約条件が形態を最も決定づけてしまうようなことは、私の設計ではほとんどございません。",
        trad: "aquilo que mais determinou a forma não foram as regulações nem as condições restritivas. Na verdade, em meus projetos quase nunca ocorre que regulações ou restrições sejam o fator que mais determina a forma.",
        fonte: "Hosaka, 2026 · correspondência eletrônica, 27 ago. e 1º set. 2026",
        via: CORR,
        pendente: true,
        permissao: "O remetente autorizou a citação e concordou em examinar original e tradução antes da publicação definitiva; essa conferência permanece pendente.",
      },
      leitura: "Dois arquitetos, a mesma pergunta, respostas opostas. Um monta uma cadeia que começa na regulação e termina nas condições de obra; o outro diz que, no trabalho dele, quase nunca é a regra o que mais determina a forma. O capítulo 5 tem de sustentar o desacordo sem escolher lado: a norma participa da forma, e não a escreve sozinha.",
    },
    {
      grupo: "A norma",
      tema: "O que a subdivisão produz",
      pergunta: "O que a subdivisão do solo produz?",
      relacao: "completam",
      a: {
        nome: "Shin Aiba",
        papel: "professor da Universidade Metropolitana de Tóquio",
        lang: "ja",
        orig: "敷地の細分化から発生する都市問題は、日照の不足、災害への脆弱性の拡大、建替更新の非活性化、ということだと思います。",
        trad: "considero que os problemas urbanos decorrentes da subdivisão do terreno são a falta de insolação, o aumento da vulnerabilidade a desastres e a redução da atividade de reconstrução e renovação do estoque.",
        fonte: "Aiba, 2026 · correspondência eletrônica, Tóquio, 27–28 ago. 2026",
        via: CORR,
        permissao: "Citação autorizada pelo remetente.",
      },
      b: {
        nome: "Kozo Kadowaki",
        ja: "門脇耕三",
        papel: "professor da Universidade Meiji, pesquisador de sistemas construtivos",
        lang: "ja",
        orig: "敷地に至る経路が狭くて重機や車両がアクセスできない場合、コスト増や構法の制限につながる場合があります。",
        trad: "quando o percurso de acesso ao terreno é estreito a ponto de impedir a entrada de máquinas pesadas e veículos, pode haver aumento de custo e limitação dos métodos construtivos.",
        fonte: "Kadowaki, 2026 · correspondência eletrônica, Tóquio, 28 ago. 2026",
        via: CORR,
        permissao: "Citação e identificação institucional autorizadas pelo remetente.",
      },
      leitura: "Um urbanista responde em escala de cidade: falta de insolação, vulnerabilidade a desastre, estoque que não se renova. Um pesquisador de construção responde no portão do lote: se a máquina não entra, sobe o custo e cai o repertório construtivo. A mesma pergunta, duas escalas, nenhuma sobreposição entre as respostas.",
    },
    {
      grupo: "A norma",
      tema: "Quanto a regra tolera",
      pergunta: "Quanto a regra pode deixar de fora e ainda assim valer?",
      relacao: "completam",
      a: {
        nome: "Shin Aiba",
        papel: "professor da Universidade Metropolitana de Tóquio",
        lang: "ja",
        orig: "なるべく既存不適格を出さないように数字を決めていると思いますが、いくつかは既存不適格になってしまうことはやむを得ない。",
        trad: "acredito que os números tenham sido definidos de modo a produzir o mínimo possível de situações de não conformidade preexistente, embora seja inevitável que alguns terrenos acabem nessa condição.",
        fonte: "Aiba, 2026 · correspondência eletrônica, Tóquio, 27–28 ago. 2026",
        via: CORR,
        permissao: "Citação autorizada pelo remetente.",
      },
      b: {
        nome: "Manjo Shimahara",
        ja: "島原万丈",
        papel: "diretor do LIFULL HOME’S Research Institute",
        lang: "ja",
        orig: "住宅政策として考えるならば、重要なのは、その妥協が人間が生活する住宅として許容できる範囲に収まっているかどうかです。",
        trad: "do ponto de vista da política habitacional, o importante é saber se essa concessão permanece dentro de limites aceitáveis para uma moradia em que pessoas vivem.",
        fonte: "Shimahara, 2026 · correspondência eletrônica, Tóquio, 29 ago. 2026",
        via: CORR,
        permissao: "Citação autorizada pelo remetente na qualidade de diretor do LIFULL HOME’S Research Institute.",
      },
      leitura: "Um diz que os limiares foram calibrados para produzir o mínimo de não conformidade preexistente, aceitando que alguns terrenos caiam nela. O outro pergunta se a concessão cabe dentro do aceitável para uma moradia onde pessoas vivem. Os dois admitem que a regra produz excluídos; divergem sobre quantos são toleráveis, e nenhum dos dois fixa o número.",
    },
    {
      grupo: "A norma",
      tema: "O mínimo que saiu do plano",
      pergunta: "O que muda quando o padrão mínimo de área sai do corpo do plano nacional?",
      relacao: "contradizem",
      a: {
        nome: "MLIT",
        papel: "Gabinete do Estrategista de Habitação, Housing Bureau",
        lang: "ja",
        orig: "世帯人員に応じた面積の考え方そのものは一切変更しておらず、国土交通省が地方公共団体へ発出した技術的助言に居住面積水準を掲載し、引き続き必要に応じて住宅施策の参考とされることになっています。",
        trad: "a concepção de área segundo o número de pessoas do domicílio permaneceu inalterada; os padrões de área habitável foram incluídos na orientação técnica enviada pelo Ministério aos governos locais e continuarão disponíveis, quando necessário, como referência para políticas habitacionais.",
        fonte: "MLIT, 2026c · resposta escrita de 31 ago. 2026, encaminhada por Ruka Hirano",
        via: CORR,
        permissao: "Atribuição institucional conforme indicação expressa do setor em 1º set. 2026.",
      },
      b: {
        nome: "Manjo Shimahara",
        ja: "島原万丈",
        papel: "diretor do LIFULL HOME’S Research Institute",
        lang: "ja",
        orig: "住生活基本計画から最低居住面積水準が削除されても、各自治体の条例がただちに効力を失うわけではないとは言え、しかし『健康で文化的な住生活を営むために最低限必要な面積』として国が示してきた全国共通の基準がなくなることで、自治体が25㎡という規制を維持する政策的な根拠は弱くなります。",
        trad: "ainda que a retirada do padrão mínimo de área do Plano Básico de Vida Habitacional não faça com que as normas municipais percam imediatamente sua validade, o desaparecimento, do plano nacional, de uma referência comum apresentada pelo Estado como a área mínima necessária a uma vida habitacional saudável e culturalmente adequada pode enfraquecer o fundamento político usado pelos municípios para manter a regra dos 25 m².",
        fonte: "Shimahara, 2026 · correspondência eletrônica, Tóquio, 29 ago. 2026",
        via: CORR,
        permissao: "Citação autorizada pelo remetente na qualidade de diretor do LIFULL HOME’S Research Institute.",
      },
      leitura: "O ministério afirma que a concepção de área por número de pessoas não mudou e que os padrões seguem na orientação técnica. O pesquisador afirma que, sem a referência nacional comum, enfraquece o fundamento político dos municípios para manter a regra dos 25 m². Uma fala é sobre permanência técnica; a outra, sobre perda de força política. É o desacordo mais direto de todo o material, e o capítulo 3 tem de mostrar os dois.",
    },
    {
      grupo: "O corpo",
      tema: "A conta da verticalização",
      pergunta: "O que acontece quando o terreno pequeno obriga a empilhar?",
      relacao: "completam",
      a: {
        nome: "Mieko Hinokidani",
        ja: "檜谷美恵子",
        papel: "pesquisadora de política habitacional da Universidade Prefeitural de Quioto",
        lang: "ja",
        orig: "敷地面積が狭ければ、広さを確保するために住宅を中層化しなければなりません。そうすると上下移動が増えます",
        trad: "quando o terreno é pequeno, é preciso distribuir a casa em mais pavimentos para assegurar espaço. Com isso, aumentam os deslocamentos verticais.",
        fonte: "Hinokidani, 2026 · correspondência eletrônica, Quioto, 1º set. 2026",
        via: CORR,
        permissao: "Citação expressamente autorizada pela remetente.",
      },
      b: {
        nome: "Yuji Okamura",
        ja: "岡村裕次",
        papel: "arquiteto, sobre a Seta House",
        lang: "ja",
        orig: "ただし、高齢になって階段が登れない、車椅子の場合はかなり住むのがむずかしい。そのときには売って、エレベーターが付いているようなマンションに住むことになるのだろう。",
        trad: "entretanto, quando a pessoa envelhece e já não consegue subir escadas, ou quando utiliza cadeira de rodas, morar ali se torna bastante difícil. Nesse momento, provavelmente precisará vender a casa e mudar-se para um apartamento com elevador.",
        fonte: "Okamura, 2026 · correspondência eletrônica, Tóquio, 25–28 ago. 2026",
        via: CORR,
        permissao: "Citação e uso das respostas autorizados pelo remetente.",
      },
      leitura: "Uma dá a conta: terreno estreito obriga a empilhar, empilhar multiplica o deslocamento vertical. O outro diz onde a conta vence: quando a escada deixa de ser subível, a saída é vender e ir para um prédio com elevador. A resposta mais dura à pergunta sobre envelhecimento no microlote não é arquitetônica, é de mercado.",
    },
    {
      grupo: "O corpo",
      tema: "Quem a escada exclui",
      pergunta: "Quem não consegue usar a casa distribuída em pavimentos?",
      relacao: "completam",
      a: {
        nome: "Mika Narasaki",
        ja: "楢﨑美香",
        papel: "pesquisadora do LIFULL HOME’S Research Institute",
        lang: "ja",
        orig: "私自身、子育てをする中で、階数が分かれる縦長の間取りは、乳幼児の安全確保や目が届きにくい面で不安があると感じています。水回りやリビング空間、子ども用品の収納スペースを同一フロアにまとめるなど、動線の負担を軽減する間取りの工夫が必要と考えます。",
        trad: "na minha experiência criando filhos, sinto preocupação com plantas alongadas verticalmente e distribuídas por diferentes pavimentos, no que diz respeito à segurança de bebês e crianças pequenas e à dificuldade de mantê-los ao alcance da vista. Considero necessário reduzir a carga dos percursos por meio de soluções como reunir, no mesmo pavimento, áreas molhadas, estar e armazenamento dos objetos infantis.",
        fonte: "Narasaki, 2026 · correspondência eletrônica, Tóquio, 27–28 ago. 2026",
        via: CORR,
        permissao: "Citação e identificação institucional autorizadas pela remetente.",
      },
      b: {
        nome: "Satoshi Satō",
        ja: "佐藤聡",
        papel: "secretário-geral da DPI Japan Conference",
        lang: "ja",
        orig: "移動の自立性です。段差をなくし、車椅子で利用できるかどうかです。",
        trad: "autonomia de deslocamento. É preciso eliminar desníveis e verificar se o espaço pode ser utilizado em cadeira de rodas.",
        fonte: "Satō, 2026 · correspondência eletrônica, Tóquio, 31 ago. 2026",
        via: CORR,
        permissao: "Citação nominal autorizada.",
      },
      leitura: "Uma responde pelo começo da vida: bebês e crianças pequenas, segurança e campo de visão, e propõe reunir áreas molhadas, estar e armazenamento no mesmo pavimento. O outro responde pelo critério, sem idade: autonomia de deslocamento, sem desnível, utilizável em cadeira de rodas. Os dois extremos da mesma escada, e nenhum dos dois aparece na planta publicada.",
    },
    {
      grupo: "O programa",
      tema: "Sobrepor no espaço, deslocar no tempo",
      pergunta: "Como acomodar muitas atividades em pouca área?",
      relacao: "completam",
      a: {
        nome: "Denso Sugiura",
        ja: "杉浦伝宗",
        papel: "Arts &amp; Crafts Architectural Research Institute",
        lang: "ja",
        orig: "一つの機能に一つの部屋は問い直す必要があります",
        trad: "é preciso questionar se cada função necessita de um cômodo próprio",
        fonte: "Sugiura, 2026 · correspondência eletrônica, Japão, 3–5 set. 2026",
        via: CORR,
        permissao: "Citação direta e identificação nominal autorizadas pelo remetente.",
      },
      b: {
        nome: "Wataru Umishio",
        ja: "海塩渉",
        papel: "pesquisador do Institute of Science Tokyo",
        lang: "ja",
        orig: "様々な活動が同じ限られた空間内で重なるのはやむを得ないので、それをどのように時間的にずらすかという「空間と時間」の2軸で考えることが重要だと思います。",
        trad: "como é inevitável que diferentes atividades se sobreponham no mesmo espaço limitado, considero importante pensar em dois eixos, “espaço e tempo”, ou seja, em como deslocar essas atividades temporalmente.",
        fonte: "Umishio, 2026 · correspondência eletrônica, Tóquio, 31 ago. 2026",
        via: CORR,
        permissao: "Citação expressamente autorizada.",
      },
      leitura: "Um arquiteto questiona a regra de um cômodo por função; um pesquisador de ambiente residencial aceita a sobreposição como inevitável e desloca a solução para o tempo. Juntas, as duas respostas dizem que a dissolução programática tem dois eixos, e que medir só o espaço perde metade do arranjo. É o que o IDP ainda não captura.",
    },
    {
      grupo: "A cidade",
      tema: "A cidade entra em casa",
      pergunta: "A cidade pode assumir funções da casa?",
      relacao: "completam",
      a: {
        nome: "Gavin H. Whitelaw",
        papel: "antropólogo",
        lang: "en",
        orig: "Given Japanese cultural norms and eating habits, I question whether konbini services would be readily understood or classified as \"domestic\" infrastructure. (What terminology will you use instead?) Electricity, natural gas, and water arguably aren't \"domestic\" infrastructure either. Rather, konbini are typically referred to as \"social infrastructure\" a term that encompasses the varied functions konbini have come to serve.",
        trad: "considerando as normas culturais e os hábitos alimentares japoneses, questiono se os serviços dos *konbini* seriam prontamente compreendidos ou classificados como infraestrutura “doméstica”. Que terminologia você usará em seu lugar? Eletricidade, gás natural e água tampouco são, a rigor, infraestruturas “domésticas”. Em vez disso, os *konbini* são normalmente referidos como “infraestrutura social”, termo que abrange as diversas funções que essas lojas passaram a desempenhar.",
        fonte: "Whitelaw, 2026 · correspondência eletrônica, Cambridge, MA, 14 set. 2026",
        via: CORR,
        permissao: "Citação e atribuição nominal autorizadas pelo remetente na própria resposta.",
      },
      b: {
        nome: "Kaori Saya",
        ja: "佐屋香織",
        papel: "PEAKSTUDIO",
        lang: "ja",
        orig: "住戸の外に出ることを前提としすぎることにも注意が必要だと思います。",
        trad: "também é preciso cuidado para não pressupor em excesso que o morador deva sair da habitação",
        fonte: "Saya, 2026 · correspondência eletrônica, PEAKSTUDIO, 8 set. 2026",
        via: CORR,
        permissao: "Citação e identificação institucional autorizadas pela remetente em 12 set. 2026.",
      },
      leitura: "Os dois travam a mesma frase por pontas opostas. Um recusa chamar de doméstica a infraestrutura que assume a geladeira e a cozinha; a outra recusa pressupor que o morador vá sair para usá-la. Entre as duas advertências não sobra espaço para afirmar que a cidade compensa a planta.",
    },
    {
      grupo: "A cidade",
      tema: "O bairro desenhado e o que já existe",
      pergunta: "Quem oferece, no bairro, aquilo que não cabe na casa?",
      relacao: "tensionam",
      a: {
        nome: "Riken Yamamoto",
        ja: "山本理顕",
        papel: "Riken Yamamoto &amp; Field Shop",
        lang: "ja",
        orig: "地区ごとに、多目的ホールのような共有スペースを設ける方法が有望だと考えられます。そこでは、調理やケア、地域活動など、さまざまな用途に対応できるようにすることで、地域の人が必要に応じて自由に利用できる場所になります。<br><br>一つの場所でさまざまな活動ができるようにすることで、住民同士が自然に交流する機会も生まれ、密集した住宅地の中でも地域のつながりをつくることができると考えられます。",
        trad: "considero promissora a criação, em cada distrito ou área local, de espaços compartilhados semelhantes a salões multifuncionais. Se puderem receber diferentes usos, como preparo de alimentos, cuidado e atividades comunitárias, tornam-se lugares que os moradores da região podem utilizar livremente conforme a necessidade. Ao permitir que diferentes atividades ocorram em um mesmo lugar, surgem também oportunidades de interação espontânea entre os moradores, possibilitando a construção de vínculos comunitários mesmo em áreas residenciais densas.",
        fonte: "Yamamoto, 2026 · correspondência eletrônica, Yokohama, 27 ago. 2026, resposta encaminhada por Kyoko Nosaka",
        via: CORR,
        permissao: "Citação e atribuição nominal autorizadas em 28 ago. 2026.",
      },
      b: {
        nome: "Gavin H. Whitelaw",
        papel: "antropólogo",
        lang: "en",
        orig: "Probably food storage and/or cooking. Since the late 1990s, konbini have been recognized as \"refrigerators\" and \"kitchens\" for urban singles and those with busy schedules. Their strategic placement in office buildings, apartments, and even government ministry basements further established them as late modern food \"oases.\" My published work on konbini onigiri and broader issues of food consumption—including retailers' struggles with waste—may be relevant to your research. Please find some of my articles attached, which contain specific examples of how konbini and households interact.",
        trad: "provavelmente o armazenamento de alimentos e/ou o preparo de comida. Desde o fim dos anos 1990, os *konbini* têm sido reconhecidos como “geladeiras” e “cozinhas” para pessoas que vivem sozinhas nas cidades e para quem mantém rotinas muito ocupadas. Sua implantação estratégica em edifícios de escritórios, apartamentos e até nos subsolos de ministérios governamentais reforçou ainda mais seu papel como “oásis” alimentares da modernidade tardia. Meus trabalhos publicados sobre *onigiri* de *konbini* e questões mais amplas do consumo alimentar, incluindo as dificuldades dos varejistas com o desperdício, podem ser relevantes para sua pesquisa. Anexei alguns de meus artigos, que contêm exemplos específicos de como *konbini* e domicílios interagem.",
        fonte: "Whitelaw, 2026 · correspondência eletrônica, Cambridge, MA, 14 set. 2026",
        via: CORR,
        permissao: "Citação e atribuição nominal autorizadas pelo remetente na própria resposta.",
      },
      leitura: "Um propõe construir, em cada distrito, um salão multifuncional onde cozinhar, cuidar e conviver. O outro descreve uma infraestrutura que já faz isso há trinta anos, é privada, comercial e está na esquina. Não se excluem, mas pedem contas diferentes: uma depende de política pública, a outra de quem pode pagar.",
    },
    {
      grupo: "Morar",
      tema: "Quem consegue ficar só",
      pergunta: "Dá para ficar sozinho dentro de uma casa pequena?",
      relacao: "contradizem",
      a: {
        nome: "Miyako Maekita",
        papel: "cliente e moradora da House in a Plum Grove",
        lang: "ja",
        orig: "ひとりで過ごす時間は十分です。狭い家なのに、ひとりになる場所はたくさんあります。入り組んでいるからなのか、ひとの気配の音が遠くて、静かなため、とても広く感じます。音の設計が素晴らしいと思います。",
        trad: "há tempo suficiente para ficar sozinha. Apesar de ser uma casa pequena, existem muitos lugares onde ficar só. Talvez por sua configuração intrincada, o som da presença das pessoas chegue de longe; como é silenciosa, a casa parece muito ampla. Considero excelente o projeto acústico.",
        fonte: "Maekita, 2026 · correspondência eletrônica, Tóquio, 31 ago. 2026, em japonês",
        via: CORR,
        permissao: "Cliente e moradora da casa; citação nominal expressamente autorizada pela remetente na mesma mensagem.",
      },
      b: {
        nome: "Daisuke Uchihama",
        ja: "内濱大輔",
        papel: "Hakuhodo Institute of Life and Living",
        lang: "ja",
        orig: "私たちがインタビューをした60〜70歳代の世帯のなかには、夫婦が日中は別々の家屋で過ごし、夕食のときに集合することで、お互いに干渉しすぎずに仲の良い状態を保っている人たちが何組か存在しました。現代の家族では、適切な距離を保つことができることが要求されているにもかかわらず、広告や住宅設計では常時親密な関係を想定しすぎているきらいがあります。本来は家族の関係性に応じて、多様な住宅設計があるべきですが、マーケティングの効率を考えると対応が難しいという現実的なハードルもあるでしょう。床面積が広ければ、住宅の運用でカバーできる部分はあるはずですが、日本の狭小住宅では難しいという事情もあります。 (Uchihama, 2026). *Daisuke Uchihama, resposta de 10 set. 2026; citação nominal autorizada em 14 set. 2026.",
        trad: "entre os domicílios de pessoas na faixa dos 60 e 70 anos que entrevistamos, havia alguns casais que passavam o dia em casas separadas e se reuniam para jantar, mantendo uma boa relação por não interferirem excessivamente um na vida do outro. Embora as famílias contemporâneas demandem a possibilidade de manter uma distância adequada, a publicidade e o projeto habitacional tendem a pressupor intimidade constante. Deveria haver projetos diversos conforme as relações familiares, mas a eficiência do marketing pode constituir um obstáculo prático. Quando a área é grande, parte disso pode ser resolvida pelo modo de usar a casa; nas pequenas casas japonesas, essa possibilidade é mais difícil.",
        fonte: "Uchihama, 2026 · correspondência eletrônica, Japão, 10 set. 2026",
        via: CORR,
        permissao: "Citação direta nominal e institucional expressamente autorizada em 14 set. 2026.",
      },
      leitura: "A moradora de uma casa responde que sim, e credita isso ao projeto acústico. O pesquisador, a partir de entrevistas em outros domicílios, responde que nas pequenas casas japonesas isso é mais difícil. Não se anulam: um fala de uma obra, o outro de uma tendência. A distância entre as duas respostas é a distância entre casa vivida e casa descrita, que esta pesquisa precisa manter separadas.",
    },
    {
      grupo: "Morar",
      tema: "O limiar, desenhado e operado",
      pergunta: "Como separar sem fechar?",
      relacao: "completam",
      a: {
        nome: "Riken Yamamoto",
        ja: "山本理顕",
        papel: "Riken Yamamoto &amp; Field Shop",
        lang: "ja",
        orig: "「閾 Shikii（threshold）」のような中間的な空間をつくることが有効だと考えられます。閾とは、人を招き入れるための空間であり、完全に私的でも共同でもない、ゆるやかにつながる場所です。<br><br>このような空間を設けることで、居住者のプライバシーを守りながら、必要に応じて近隣の人や他の居住者と交流できる環境をつくることができます。",
        trad: "considero eficaz criar um espaço intermediário como o *shikii* (limiar). O limiar é um espaço para receber pessoas, um lugar de conexão gradual, nem inteiramente privado nem comum. Ao criar esse tipo de espaço, torna-se possível proteger a privacidade dos moradores e, ao mesmo tempo, permitir que se relacionem com vizinhos e outros residentes quando necessário.",
        fonte: "Yamamoto, 2026 · correspondência eletrônica, Yokohama, 27 ago. 2026, resposta encaminhada por Kyoko Nosaka",
        via: CORR,
        permissao: "Citação e atribuição nominal autorizadas em 28 ago. 2026.",
      },
      b: {
        nome: "Miyako Maekita",
        papel: "cliente e moradora da House in a Plum Grove",
        lang: "ja",
        orig: "娘も息子も抵抗していました。娘は独立しましたが、息子はまだ一緒に暮らしています。和室の開口部に板をはめたり外したりしています。",
        trad: "tanto minha filha quanto meu filho resistiram. Minha filha saiu de casa, mas meu filho ainda mora comigo. Na abertura do quarto de tatame, placas de madeira são colocadas e retiradas.",
        fonte: "Maekita, 2026 · correspondência eletrônica, Tóquio, 31 ago. 2026, em japonês",
        via: CORR,
        permissao: "Cliente e moradora da casa; citação nominal expressamente autorizada pela remetente na mesma mensagem.",
      },
      leitura: "Um arquiteto responde com um espaço intermediário, nem privado nem comum. Uma moradora responde com placas de madeira que entram e saem da abertura do quarto de tatame. A segunda resposta é a primeira em uso: o limiar existe, e é operado à mão, todo dia, por quem mora. O fechamento não foi desenhado, foi negociado.",
    },
  ];

  const REL = {
    contradizem: { label: "se contradizem", cls: "duo-contra", sinal: "≠" },
    completam: { label: "se completam", cls: "duo-soma", sinal: "+" },
    tensionam: { label: "se tensionam", cls: "duo-tensao", sinal: "≶" },
  };

  let step = 0;
  let todas = false;

  function card(v, lado) {
    const paras = String(v.orig).split(/<br>\s*<br>/).map((t) => `<p>${t.trim()}</p>`).join("");
    const nota = v.nota ? `<span class="duo-nota">${v.nota}</span>` : "";
    return `<figure class="duo-card duo-${lado}">
      <div class="duo-who">
        <p class="duo-nome">${v.nome}${v.ja ? ` <span class="duo-ja">${v.ja}</span>` : ""}</p>
        <p class="duo-papel">${v.papel}</p>
      </div>
      <div class="duo-orig" lang="${v.lang}">${paras}</div>
      <p class="duo-trad-tag">tradução livre da autora</p>
      <blockquote class="duo-fala"><p>${v.trad}</p></blockquote>
      <figcaption class="duo-pe">
        <span class="duo-tag duo-tag-${v.via === CORR ? "corr" : "pub"}">${v.via}</span>
        <span class="duo-tag duo-tag-tipo">citação direta</span>${nota}
        ${v.pendente ? '<span class="duo-tag duo-tag-pend">conferência pendente · [VERIFICAR]</span>' : ""}
        <span class="duo-fonte">${v.fonte}</span>
        ${v.permissao ? `<span class="duo-perm">${v.permissao}</span>` : ""}
      </figcaption>
    </figure>`;
  }

  function parBlock(p, i) {
    const r = REL[p.relacao];
    return `<div class="duo-par" data-i="${i}">
      <div class="duo-head">
        <p class="duo-n">${String(i + 1).padStart(2, "0")} · ${p.grupo}</p>
        <h4 class="duo-tema">${p.tema}</h4>
        <span class="duo-rel ${r.cls}"><span aria-hidden="true">${r.sinal}</span>${r.label}</span>
      </div>
      <p class="duo-pergunta"><span>ambas respondem a</span>${p.pergunta}</p>
      <div class="duo-stage">
        ${card(p.a, "esq")}
        <div class="duo-spine ${r.cls}" aria-hidden="true"><span>${r.sinal}</span></div>
        ${card(p.b, "dir")}
      </div>
      <p class="duo-leitura"><span class="duo-leitura-tag">leitura proposta</span>${p.leitura}</p>
    </div>`;
  }

  function render() {
    const stage = $("duo-body");
    if (!stage) return;
    stage.innerHTML = todas
      ? PARES.map(parBlock).join("")
      : parBlock(PARES[step], step);
    stage.classList.toggle("duo-all", todas);
    document.querySelectorAll("[data-duo-step]").forEach((b) => {
      b.setAttribute("aria-pressed", String(!todas && Number(b.dataset.duoStep) === step));
    });
    const pos = $("duo-pos");
    if (pos) pos.textContent = todas ? `${PARES.length} confrontos` : `${step + 1} de ${PARES.length}`;
    ["duo-prev", "duo-next"].forEach((id) => { const b = $(id); if (b) b.disabled = todas; });
  }

  function go(d) {
    step = (step + d + PARES.length) % PARES.length;
    todas = false;
    const t = $("duo-todas");
    if (t) { t.setAttribute("aria-pressed", "false"); t.textContent = "Ver todos"; }
    render();
  }

  function block() {
    let grupoAtual = null;
    const chips = PARES.map((p, i) => {
      const sep = p.grupo !== grupoAtual ? `<span class="duo-grupo">${p.grupo}</span>` : "";
      grupoAtual = p.grupo;
      return `${sep}<button type="button" class="duo-chip" data-duo-step="${i}"
        aria-pressed="${i === 0}"><span>${String(i + 1).padStart(2, "0")}</span>${p.tema}</button>`;
    }).join("");
    const nCorr = PARES.reduce((s, p) => s + (p.a.via === CORR ? 1 : 0) + (p.b.via === CORR ? 1 : 0), 0);
    const nPessoas = new Set(PARES.flatMap((p) => [p.a.nome, p.b.nome])).size;
    return `<article class="city-block panel" id="block-duo">
      <div class="panel-title"><div><p>duas vozes</p><h3>Quem discorda de quem</h3></div></div>
      <p class="panel-lede">${PARES.length} confrontos entre ${nPessoas} pessoas que responderam a esta pesquisa. Cada um traz duas respostas à mesma pergunta, e a pergunta está escrita em cima das duas. Só citação direta: o original como cada uma escreveu, em japonês ou em inglês, e embaixo a tradução livre da autora. ${nCorr} das ${PARES.length * 2} falas vêm de correspondência com autorização registrada; a outra é entrevista publicada.</p>

      <div class="duo-rail" role="group" aria-label="Os sete confrontos">${chips}</div>

      <div class="duo-tools">
        <div class="duo-nav">
          <button type="button" class="icon-button" id="duo-prev" aria-label="Confronto anterior">←</button>
          <span class="duo-pos" id="duo-pos"></span>
          <button type="button" class="icon-button" id="duo-next" aria-label="Próximo confronto">→</button>
        </div>
        <button type="button" class="chip-button" id="duo-todas" aria-pressed="false">Ver todos</button>
      </div>

      <div class="duo-body" id="duo-body" tabindex="0" aria-live="polite"></div>

      <p class="city-note"><strong>O que é de quem.</strong> Cada card traz a fala como a pessoa a escreveu e, embaixo, a tradução livre da autora. As duas vêm do RASCUNHO OFICIAL ORIGINAL sem alteração: nenhuma frase foi resumida, reescrita ou traduzida por esta página. A autorização no pé está com as palavras da lista de referências. Quem respondeu sem autorização anotada não entrou, ainda que a fala servisse a um par, e a única resposta cuja autorização é condicional traz a condição escrita no card. A pergunta de cada confronto, o emparelhamento e a <em>leitura proposta</em> são recorte feito para esta página, não achado da pesquisa: nenhum destes pares existe assim no rascunho, e nenhuma das pessoas citadas respondeu à outra. Cada uma respondeu à pesquisa, em datas diferentes, sem saber o que a outra tinha dito.</p>
    </article>`;
  }

  function mount() {
    const host = $("backstage-blocks");
    if (!host) return;
    const holder = document.createElement("div");
    holder.innerHTML = block();
    const node = holder.firstElementChild;
    /* logo depois do bloco de correspondência, que abre os bastidores */
    const first = host.firstElementChild;
    if (first) host.insertBefore(node, first.nextSibling); else host.appendChild(node);

    $("duo-prev").addEventListener("click", () => go(-1));
    $("duo-next").addEventListener("click", () => go(1));
    document.querySelectorAll("[data-duo-step]").forEach((b) => b.addEventListener("click", () => {
      step = Number(b.dataset.duoStep);
      todas = false;
      const t = $("duo-todas");
      t.setAttribute("aria-pressed", "false");
      t.textContent = "Ver todos";
      render();
    }));
    const t = $("duo-todas");
    t.addEventListener("click", () => {
      todas = !todas;
      t.setAttribute("aria-pressed", String(todas));
      t.textContent = todas ? "Ver um por vez" : "Ver todos";
      render();
    });
    const body = $("duo-body");
    body.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    });
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
