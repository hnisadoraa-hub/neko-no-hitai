/* Manifesto de fotos das casas.
   ---------------------------------------------------------------------------
   ORIGEM DAS IMAGENS
   Todas vêm da pasta "Microcasas/Candidatas" do Google Drive da autora
   (arquivo 01_fachada.jpg de cada obra), redimensionadas para no máximo
   1400 px e comprimidas. Nenhuma foi baixada de site de terceiros.

   CRÉDITO
   O fotógrafo foi conferido nas publicações da obra (ArchDaily, Dezeen,
   designboom, TECTURE MAG, site do escritório). Quando o escritório pediu
   uma forma de crédito, ela prevalece sobre a das revistas.

   AUTORIZAÇÃO
   rights  quem autorizou e quando, conforme o e-mail ou a base do Notion
   scope   o que a autorização cobre, nas palavras do registro
   quote   a frase do escritório, no idioma original
   verify  o que ainda falta conferir; a foto mostra [VERIFICAR] ao lado
           do crédito enquanto este campo existir

   Os pedidos e as respostas falam em "tese", "卒業論文", "academic paper".
   Nenhum registro trata de publicação na internet. Antes de tornar o atlas
   público, vale confirmar esse uso com os escritórios.

   COMO ADICIONAR UMA FOTO
   1. Salve o arquivo em assets/photos/ com o id da casa como nome
      (o id aparece no CSV exportado). Ex.: assets/photos/h017-house-in-a-plum-grove.jpg
   2. Acrescente uma entrada abaixo. file, credit e rights são obrigatórios:
      nenhuma foto aparece sem crédito, de propósito.
   3. rights com "uso restrito" aparece em vermelho, para não escapar numa
      publicação aberta.

   ONDE AS FOTOS APARECEM
   Na mesa comparativa e no card de tipologia. As fichas da lista não têm
   foto, a pedido da autora; trazem o link "ver a obra e as fotos na fonte".
   --------------------------------------------------------------------------- */

window.NEKO_PHOTOS = {
  "h089-small-house-unemori-architects": {
    file: "h089-small-house-unemori-architects.jpg",
    caption: "Small House, fachada à noite",
    credit: "Foto: Ken Sasajima, Shinkenchiku-sha · Unemori Architects",
    rights: "autorizado por Hiroyuki Unemori (Unemori Architects), e-mail de 28/07/2026",
    scope: "mencionar e analisar no TCC; fotos com o crédito dos fotógrafos como consta no site do escritório",
    quote: "You have my permission to mention and analyze both House Tokyo and Small House in your thesis. […] If you reproduce any photographs, please also credit the photographers as listed there.",
    source: "Drive, 02_Small_House/01_fachada.jpg · crédito conforme unemori-archi.com: photo：Ken Sasajima, Shinkenchiku-sha",
  },

  "h117-tunnel-house": {
    file: "h117-tunnel-house.jpg",
    caption: "Tunnel House, fachada com a entrada em túnel",
    credit: "Foto: Shinkenchiku-sha · Makiko Tsukada Architects",
    rights: "autorizado por Makiko Tsukada, 15/08/2026",
    scope: "citar e analisar no TCC, com crédito e referências; crédito exigido: Makiko Tsukada Architects",
    quote: "Concedida para citar e analisar a Tunnel House no TCC, com crédito e referências. Crédito exigido: Makiko Tsukada Architects. (registro no Notion)",
    source: "Drive, 06_Tunnel_House/01_fachada.jpg: página de 住宅特集, jul. 2012, p. 12, recortada para tirar a tipografia da revista · crédito: ArchDaily, Dezeen, designboom e o site do escritório (写真 新建築社)",
  },

  "h124-1-8-m-width-house": {
    file: "h124-1-8-m-width-house.jpg",
    caption: "1.8-M Width House, fachada à noite",
    credit: "Foto: Toshihiro Sobajima · YUUA Architects & Associates",
    rights: "autorizado por Bas Spaanderman (YUUA Architects & Associates), 21/07/2026",
    scope: "analisar no TCC para fins acadêmicos; fotos com o crédito do fotógrafo indicado no press kit ou na publicação original",
    quote: "You are very welcome to analyse 1.8 M Width House in your thesis for academic purposes. […] If you reproduce any photographs, please credit the photographer as indicated in the press kit or the original publication.",
    source: "Drive, 08_1_8M_Width_House/01_fachada.jpg · crédito: ArchDaily, Dezeen e yuua.jp (写真撮影 傍島 利浩)",
  },

  "h203-open-sky-house": {
    file: "h203-open-sky-house.jpg",
    caption: "Open Sky House, vista da rua",
    credit: "Foto: Yasuhiro Nakayama · 鈴木理考建築都市事務所, 高橋庸文, 高橋みのり",
    rights: "autorizado por 座二郎 (Nobufumi Takahashi) e 鈴木理考 (YSAA), jul. 2026",
    scope: "incluir no TCC, com o crédito de projeto indicado pelo escritório: 基本設計：高橋庸文、鈴木理考建築都市事務所 / 実施設計：鈴木理考建築都市事務所 / キッチン・照明・色彩：高橋みのり",
    quote: "３卒業論文でしたら載せていただいて構いません。",
    source: "Drive, 09_Open_Sky_House/01_fachada.jpg · crédito: ArchDaily, TECTURE MAG, ysaa.co",
    verify: "o site do escritório credita 撮影：住宅特集（中山保寛、一部、座二郎）; confirmar se esta foto é de Nakayama ou de 座二郎",
  },

  "h202-love-house": {
    file: "h202-love-house.jpg",
    caption: "LOVE² HOUSE, fachada",
    credit: "Foto: Koji Fujii / Nacasa & Partners · Takeshi Hosaka Architects",
    rights: "autorizado por Takeshi Hosaka (保坂猛), 22/07/2026",
    scope: "mencionar e analisar no TCC; a resposta não trata de fotografias",
    quote: "Love2 HouseとBalcony House に言及し分析する件、承知しました。",
    source: "Drive, 10_LOVE2_HOUSE/01_fachada.jpg · crédito: ArchDaily, designboom, Dezeen, hosakatakeshi.com",
  },

  "h206-6-tsubo-house": {
    file: "h206-6-tsubo-house.jpg",
    caption: "6-Tsubo House, fachada",
    credit: "Foto: Kai Nakamura · Arte-1 Architects",
    rights: "respostas de Yugo Yamada (Arte-1 Architects) enviadas em 18/09/2026, em PDF anexo",
    scope: "pedido feito: mencionar e analisar no TCC, com crédito (pergunta 4)",
    source: "Drive, 11_6_Tsubo_House/01_fachada.jpg · crédito: ArchDaily, TECTURE MAG (撮影：中村 絵)",
    verify: "a resposta à pergunta 4 está no PDF 260918_Arte1_answer, que não foi transcrito; conferir antes de publicar",
  },

  "h244-m-residence": {
    file: "h244-m-residence.jpg",
    caption: "House M, vista da rua junto à linha férrea",
    credit: "Foto: Masao Nishikawa · Takehiko Suzuki Architects",
    rights: "autorizado por Takehiko Suzuki (鈴木岳彦), 27/07/2026",
    scope: "mencionar e analisar no TCC, com crédito; sem forma de crédito exigida",
    quote: "クレジット表記いただければ、卒業論文で言及、分析していただいて構いません。特に表記方法の指定はありません。",
    source: "Drive, 13_House_M/01_fachada.jpg · crédito: ArchDaily, takehikosuzuki.com (写真 西川公朗)",
    note: "No site do escritório a obra se chama House M (M邸). É a mesma que a planilha registra como M Residence: escritório, ward, ano, 28,67 m² de lote e 33,06 m² de área coincidem.",
  },

  "h254-seta-house": {
    file: "h254-seta-house.jpg",
    caption: "Seta House (瀬田の住宅), fachada",
    credit: "Foto: ToLoLo studio · TKO-M.architects",
    rights: "autorizado por Yuji Okamura (TKO-M.architects), 25/08/2026",
    scope: "apresentar e analisar no TCC, com crédito e desenhos próprios da autora; em 27/08/2026, citação das respostas liberada",
    quote: "OKです。全部論文が書き終わったらぜひ送ってください。",
    source: "Drive, 14_Seta_House/01_fachada.jpg · crédito: tko-m.com (写真：ToLoLo studio)",
  },

  "h125-base": {
    file: "h125-base.jpg",
    caption: "BASE, fachada",
    credit: "Foto: Toshihiro Sobajima · Komada Architects' Office",
    rights: "autorizado por Takeshi Komada (駒田剛司), 27/08/2026",
    scope: "uso autorizado, desenhos cedidos, crédito fotográfico obrigatório (registro no Notion)",
    quote: "Autorização de uso: ✅ concedida · desenhos cedidos em anexo (base.zip) · crédito fotográfico obrigatório: Toshihiro Sobajima (registro no Notion)",
    source: "Drive, 17_BASE_House/01_fachada.jpg",
    verify: "o escritório pediu o crédito Toshihiro Sobajima, mas ArchDaily e Japan-architects creditam Tomohiro Saruyama; confirmar de quem é esta foto",
  },

  "h192-milk-carton-house": {
    file: "h192-milk-carton-house.jpg",
    caption: "Milk Carton House, cobertura e fachada num só plano",
    credit: "Foto: Akihide Mishima · .8 / TENHACHI",
    rights: "autorizado por Tomoko Sasaki (.8 / TENHACHI), 06/08/2026",
    scope: "apresentar e analisar no TCC, com crédito, no limite do que o cliente autorizar",
    quote: "Yes, that's fine. We would be happy to provide information to the extent that our client permits.",
    source: "Drive, 20_MILK_CARTON_HOUSE/01_fachada.jpg · crédito: ArchDaily, TECTURE MAG, ten-hachi.com",
  },

  "h094-tsubomi-house-tokyo-bud-house": {
    file: "h094-tsubomi-house-tokyo-bud-house.jpg",
    caption: "Tokyo Bud House, vista da rua",
    credit: "Foto © Takumi Ota · Yoshinori Sakano Architects",
    rights: "autorizado por Yoshinori Sakano, 18/08/2026",
    scope: "aparecer no TCC; fotos do site creditadas como (c) Takumi Ota; em 28/08/2026, citação das respostas liberada",
    quote: "It is an honor to have Tokyo Bud House featured in an academic paper. Please credit the photos of Tokyo Bud House on our firm's website as (c) Takumi Ota.",
    source: "Drive, 22_Tokyo_Bud_House/01_fachada.jpg · crédito: ArchDaily, ys-arc.co.jp",
    note: "O site do escritório situa a casa em Setagaya, num lote em bandeira (旗竿敷地); a planilha registra Bunkyo [VERIFICAR].",
  },
};
