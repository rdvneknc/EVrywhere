export type HomeTopic = {
  id: string;
  title: string;
  author: string;
  initials: string;
  timeAgo: string;
  category: string;
  categoryTone: 'green' | 'blue' | 'orange' | 'purple';
  replies: number;
  views: number;
};

export const HOME_TOPICS: HomeTopic[] = [
  {
    id: '1',
    title: "Model Y yazılım güncellemesi sonrası menzil arttı mı?",
    author: 'Ayşe K.',
    initials: 'AK',
    timeAgo: '12 dk önce',
    category: 'Teknik',
    categoryTone: 'orange',
    replies: 24,
    views: 812,
  },
  {
    id: '2',
    title: 'İstanbul Anadolu yakasında güvenilir DC şarj noktaları',
    author: 'Mert Y.',
    initials: 'MY',
    timeAgo: '45 dk önce',
    category: 'Şarj',
    categoryTone: 'blue',
    replies: 18,
    views: 640,
  },
  {
    id: '3',
    title: 'Togg T10X uzun yol: Ankara → İzmir deneyimi',
    author: 'Elif D.',
    initials: 'ED',
    timeAgo: '2 saat önce',
    category: 'Yolculuk',
    categoryTone: 'purple',
    replies: 41,
    views: 1520,
  },
  {
    id: '4',
    title: '2021 Model 3 Long Range ikinci el alırken nelere bakmalı?',
    author: 'Can B.',
    initials: 'CB',
    timeAgo: '3 saat önce',
    category: '2. El',
    categoryTone: 'green',
    replies: 33,
    views: 1104,
  },
  {
    id: '5',
    title: 'BYD Seal Türkiye fiyatları ve teslim süreleri — güncel durum',
    author: 'Zeynep A.',
    initials: 'ZA',
    timeAgo: '5 saat önce',
    category: 'Haberler',
    categoryTone: 'orange',
    replies: 57,
    views: 2301,
  },
  {
    id: '6',
    title: 'Ev tipi Type 2 şarj cihazı seçimi: 7 kW mi 11 kW mı?',
    author: 'Burak T.',
    initials: 'BT',
    timeAgo: '8 saat önce',
    category: 'Genel',
    categoryTone: 'green',
    replies: 15,
    views: 498,
  },
];

export const HOME_CATEGORIES = [
  { id: 'forum', label: 'Forum', emoji: '💬', tone: 'bg-emerald-50 text-emerald-700', href: '/forum' },
  { id: 'charging', label: 'Şarj', emoji: '⚡', tone: 'bg-sky-50 text-sky-700', href: '/sarj' },
  { id: 'tech', label: 'Teknik', emoji: '🔧', tone: 'bg-amber-50 text-amber-700', href: '/forum' },
  { id: 'trips', label: 'Yolculuk', emoji: '🗺️', tone: 'bg-violet-50 text-violet-700', href: '/forum' },
  { id: 'secondhand', label: '2. El', emoji: '🚗', tone: 'bg-lime-50 text-lime-700', href: '/ilanlar' },
  { id: 'news', label: 'Haberler', emoji: '📰', tone: 'bg-rose-50 text-rose-700', href: '/haberler' },
  { id: 'guide', label: 'Rehber', emoji: '📖', tone: 'bg-teal-50 text-teal-700', href: '/forum' },
] as const;

export const HOME_STATS = [
  { label: 'Üye', value: '—' },
  { label: 'Konu', value: '—' },
  { label: 'Yanıt', value: '—' },
  { label: 'Şehir', value: '81' },
] as const;

export const COMMUNITY_STATS = [
  { label: 'Aktif üye', value: '12K+', hint: 'Topluluk büyüyor' },
  { label: 'Forum konusu', value: '28K+', hint: 'Deneyimler paylaşılıyor' },
  { label: '2. el ilan', value: '5.7K+', hint: 'Güvenilir alım-satım' },
  { label: 'Şarj noktası', value: '892+', hint: 'Türkiye genelinde' },
] as const;

export const FEATURED_LISTINGS = [
  {
    id: 'l1',
    title: '2023 Tesla Model Y',
    price: '2.450.000 ₺',
    city: 'İstanbul',
    km: '18.500 km',
    imageLabel: 'İlan foto 1 — Model Y (yatay ~640×400)',
  },
  {
    id: 'l2',
    title: '2024 Togg T10X',
    price: '1.890.000 ₺',
    city: 'Ankara',
    km: '9.200 km',
    imageLabel: 'İlan foto 2 — Togg T10X (yatay ~640×400)',
  },
  {
    id: 'l3',
    title: '2022 BYD Atto 3',
    price: '1.320.000 ₺',
    city: 'İzmir',
    km: '27.000 km',
    imageLabel: 'İlan foto 3 — BYD Atto 3 (yatay ~640×400)',
  },
  {
    id: 'l4',
    title: '2021 Hyundai IONIQ 5',
    price: '1.650.000 ₺',
    city: 'Bursa',
    km: '41.000 km',
    imageLabel: 'İlan foto 4 — IONIQ 5 (yatay ~640×400)',
  },
] as const;

export const NEARBY_STATIONS = [
  {
    id: 's1',
    name: 'Zorlu Center DC Hub',
    address: 'Beşiktaş, İstanbul',
    tags: ['DC 150 kW', 'CCS2'],
    distance: '0.8 km',
  },
  {
    id: 's2',
    name: 'Eşarj Kadıköy',
    address: 'Kadıköy, İstanbul',
    tags: ['DC 60 kW', 'AC 22 kW'],
    distance: '1.4 km',
  },
  {
    id: 's3',
    name: 'Trugo Ataşehir',
    address: 'Ataşehir, İstanbul',
    tags: ['DC 180 kW', 'CCS2'],
    distance: '2.1 km',
  },
  {
    id: 's4',
    name: 'Shell Recharge Maslak',
    address: 'Sarıyer, İstanbul',
    tags: ['DC 50 kW'],
    distance: '3.6 km',
  },
] as const;

export const POPULAR_BRANDS = [
  { name: 'Tesla', emoji: '⚡' },
  { name: 'Togg', emoji: '🇹🇷' },
  { name: 'BYD', emoji: '🔋' },
  { name: 'BMW', emoji: '🔵' },
  { name: 'Hyundai', emoji: '🅗' },
  { name: 'VW', emoji: '🚗' },
  { name: 'Mercedes', emoji: '⭐' },
  { name: 'Kia', emoji: '🏁' },
] as const;

export const HOME_NEWS = [
  {
    id: 'n1',
    title: 'Türkiye’de yeni DC şarj yatırımları hızlandı',
    date: '8 Eyl 2026',
    imageLabel: 'Haber görseli 1 (~320×200)',
  },
  {
    id: 'n2',
    title: 'Togg T10F ön sipariş ve teslim takvimi',
    date: '5 Eyl 2026',
    imageLabel: 'Haber görseli 2 (~320×200)',
  },
  {
    id: 'n3',
    title: 'Şehir içi menzil: yaz vs kış karşılaştırması',
    date: '2 Eyl 2026',
    imageLabel: 'Haber görseli 3 (~320×200)',
  },
] as const;

export const HOME_GUIDES = [
  {
    id: 'g1',
    title: 'İlk EV alacaklara 10 maddelik rehber',
    date: '1 Eyl 2026',
    imageLabel: 'Rehber görseli 1 (~320×200)',
  },
  {
    id: 'g2',
    title: 'Ev tipi şarj: kurulum ve izinler',
    date: '28 Ağu 2026',
    imageLabel: 'Rehber görseli 2 (~320×200)',
  },
  {
    id: 'g3',
    title: 'Uzun yolda batarya sağlığı nasıl korunur?',
    date: '20 Ağu 2026',
    imageLabel: 'Rehber görseli 3 (~320×200)',
  },
] as const;
