export type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  body: string[];
  category: string;
  publishedAt: string;
  publishedLabel: string;
  sourceName: string;
  sourceUrl: string;
  imageGradient: [string, string];
  imageEmoji: string;
};

/** Özetler kaynak haberlere dayanır; tam metin için kaynak linkine bakın. */
export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'togg-agustos-2026-satis',
    title:
      'Togg satışları bir yılda yaklaşık 4 kat arttı; Çinli markalar geriledi',
    summary:
      'ODMD verilerine göre Ağustos 2026’da Togg 4.886 adet otomobil sattı. Aynı dönemde Çinli markaların toplam satışı belirgin düştü.',
    body: [
      'Otomotiv Distribütörleri ve Mobilite Derneği (ODMD) verilerine dayanan haberlere göre, Türkiye otomobil pazarı Ağustos 2026’da bir önceki yılın aynı ayına göre daralırken Togg satışlarını güçlü biçimde artırdı.',
      'Ağustos 2025’te 1.249 adet olan Togg satışları, Ağustos 2026’da 4.886 adede yükseldi. Bu artış oranı yaklaşık yüzde 291 olarak hesaplandı. T10X ve T10F modelleri, elektrikli otomobil satışlarında üst sıralarda yer aldı.',
      'Aynı dönemde Çinli markaların toplam otomobil satışı 5.896’dan 2.663’e geriledi. Özellikle BYD’nin aylık satışlarındaki düşüş dikkat çekti.',
      'Ağustos’ta Türkiye’de yaklaşık 11.878 elektrikli otomobil satıldığı ve Togg’un iki modelinin bu pastanın önemli bir bölümünü oluşturduğu belirtiliyor.',
    ],
    category: 'Pazar',
    publishedAt: '2026-09-01',
    publishedLabel: '1 Eyl 2026',
    sourceName: 'Haber7',
    sourceUrl:
      'https://www.haber7.com/otomobil/haber/3657042-toggun-carpici-yukselisi-cinli-araclari-tahtindan-etti-gectigimiz-yili-mumla-ariyorlar',
    imageGradient: ['#0d3b24', '#2DC653'],
    imageEmoji: '🇹🇷',
  },
  {
    id: 'byd-manisa-fabrika',
    title: 'BYD, Manisa’daki fabrika planını askıya aldı',
    summary:
      'Çinli üretici, 1 milyar dolarlık Türkiye yatırımına dair kesin takvim olmadığını açıkladı; öncelik Macaristan üretim tesisinde.',
    body: [
      'Deutsche Welle’nin aktardığına göre BYD, 2024’te duyurulan Manisa üretim yatırımı planını fiilen askıya aldı. Şirket yetkilileri, Türkiye için kesin bir üretim takvimi bulunmadığını belirtti.',
      'BYD, Avrupa stratejisinde Macaristan’daki tesisine ağırlık vereceğini açıkladı. Macaristan fabrikasında üretimin 2026 sonuna doğru başlaması bekleniyor.',
      'Manisa’da yılda 150 bin araçlık kapasite ve binlerce kişilik istihdam öngörülmüştü; ancak inşaat sürecinin başlamadığı bildiriliyor.',
      'Yatırımın belirsizliği, Türkiye’deki BYD satış ve tedarik görünümünü de yakından etkiliyor.',
    ],
    category: 'Yatırım',
    publishedAt: '2026-08-06',
    publishedLabel: '6 Ağu 2026',
    sourceName: 'DW Türkçe',
    sourceUrl:
      'https://www.dw.com/tr/h%C3%BCk%C3%BCmet-ikna-edemedi-byd-manisa-fabrikas%C4%B1ndan-vazge%C3%A7ti/a-77489777',
    imageGradient: ['#3a1a00', '#FF6B00'],
    imageEmoji: '🏭',
  },
  {
    id: 'bev-pazar-togg-lider',
    title: 'BEV pazarında Togg liderliğini pekiştirdi, BYD geriledi',
    summary:
      'Ocak–Temmuz 2026 döneminde Togg yaklaşık yüzde 28 pazar payıyla zirvede; BYD’nin aylık teslimatları sert düştü.',
    body: [
      'Ekonomi Life’ın derlediği verilere göre Temmuz 2026’da Türkiye’de 12.684 adet bataryalı elektrikli otomobil (BEV) satıldı. Togg, Temmuz’da yaklaşık 4.600 araçla ilk sırada yer aldı.',
      'Yılın ilk yedi ayında Togg 25.848 adet satış ve yaklaşık yüzde 27,7 pazar payı ile açık ara lider oldu.',
      'BYD ise Manisa yatırımı sürecinin askıya alınmasıyla birlikte satış performansında belirgin gerileme yaşadı; Temmuz’da çok düşük adetlerde kaldığı aktarıldı.',
      'KG Mobility ve MINI gibi markalar da yılın ilk yedi ayında dikkat çeken satış rakamlarıyla öne çıktı.',
    ],
    category: 'Pazar',
    publishedAt: '2026-08-05',
    publishedLabel: '5 Ağu 2026',
    sourceName: 'Ekonomi Life',
    sourceUrl:
      'https://ekonomilife.com/otomobil/elektrikli-arac-savasinda-surpriz-donemec-byd-geriliyor-togg-zirvede/',
    imageGradient: ['#1a2332', '#378ADD'],
    imageEmoji: '⚡',
  },
  {
    id: 'elektrikli-arz-sikintisi',
    title: 'Elektrikli otomobilde arz sıkışması: ithalat ve stok dengesi bozuldu',
    summary:
      'Yerli üretim avantajıyla Togg öne çıkarken, bazı ithal markalarda teslimat ve stok kısıtı satış tablosunu şekillendiriyor.',
    body: [
      'Sektör analizlerine göre Türkiye elektrikli otomobil pazarında arz tarafı kritik hale geldi. Yerli üretim yapan Togg, talebi karşılama kapasitesiyle pazar payını yaklaşık yüzde 28 seviyesine taşıdı.',
      'BYD’nin şubat sonrası dönemde neredeyse yeni araç teslimatı yapamamış olmasına rağmen yıl başındaki satış bakiyesiyle sıralamada üstlerde kalması, ithalat ve stok tıkanıklığına işaret ediyor.',
      'Ek gümrük vergileri ve ithalat düzenlemeleri, Avrupalı ve Asyalı bazı markaların Türkiye’ye araç getirmesini zorlaştırıyor.',
      'Uzmanlar, yerel üretim ve tedarik zincirinin güçlenmesinin hem fiyat hem de erişilebilirlik açısından belirleyici olacağını belirtiyor.',
    ],
    category: 'Analiz',
    publishedAt: '2026-07-20',
    publishedLabel: '20 Tem 2026',
    sourceName: 'Yatirimx',
    sourceUrl:
      'https://www.yatirimx.com.tr/otomobil/elektrikli-otomobilde-arz-tikandi-togg-lider-byd-aracsiz-4-sirada/22839',
    imageGradient: ['#2a1a3a', '#7F77DD'],
    imageEmoji: '📊',
  },
];

export function getNewsById(id: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find((a) => a.id === id);
}
