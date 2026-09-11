export type EvBrand = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  models: string[];
};

export type EvListing = {
  id: string;
  brandId: string;
  model: string;
  location: string;
  sellerName: string;
  sellerInitials: string;
  sellerColor: string;
  /** Gerçek üye ilanlarında dolu — mesajlaşma için */
  sellerUserId?: string;
  year: number;
  km: number;
  price: number;
  batteryHealth: number;
  range: number;
  chargeType: string;
  sellerType: string;
  damageStatus: string;
  postedAgo: string;
  gradient: [string, string];
  emoji: string;
  isFeatured: boolean;
  color: string;
  warranty: string;
  acChargePower: number;
  dcChargePower: number;
  batteryCapacity: number;
  motorPower: number;
  drivetrain: string;
  paintedParts: string[];
  replacedParts: string[];
  photos: string[];
  description?: string;
};

export type DateSort = 'none' | 'newest' | 'oldest';
export type PriceSort = 'none' | 'highest' | 'lowest';

export type ListingFilter = {
  priceMin: number;
  priceMax: number;
  kmMin: number;
  kmMax: number;
  yearMin: number;
  yearMax: number;
  sellerType: string;
  damageStatus: string;
  dateSort: DateSort;
  priceSort: PriceSort;
};

export const DEFAULT_FILTER: ListingFilter = {
  priceMin: 0,
  priceMax: 5000000,
  kmMin: 0,
  kmMax: 200000,
  yearMin: 2018,
  yearMax: 2025,
  sellerType: 'Tümü',
  damageStatus: 'Tümü',
  dateSort: 'none',
  priceSort: 'none',
};

export const EV_BRANDS: EvBrand[] = [
  { id: 'togg', name: 'Togg', emoji: '🇹🇷', color: '#2DC653', models: ['T10X', 'T10F'] },
  { id: 'tesla', name: 'Tesla', emoji: '⚡', color: '#CC0000', models: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'] },
  { id: 'byd', name: 'BYD', emoji: '🔋', color: '#FF6B00', models: ['Atto 3', 'Dolphin', 'Seal', 'Seal U', 'Han'] },
  { id: 'mg', name: 'MG', emoji: '🅜', color: '#B00020', models: ['MG4', 'ZS EV', 'Marvel R', 'MG5 EV'] },
  { id: 'bmw', name: 'BMW', emoji: '🔵', color: '#1C69D4', models: ['i3', 'i4', 'i5', 'iX', 'iX1', 'iX3'] },
  { id: 'mercedes', name: 'Mercedes', emoji: '⭐', color: '#1C1C1C', models: ['EQA', 'EQB', 'EQC', 'EQE', 'EQE SUV', 'EQS', 'EQS SUV'] },
  { id: 'hyundai', name: 'Hyundai', emoji: '🅗', color: '#00287A', models: ['IONIQ 5', 'IONIQ 6', 'KONA Electric'] },
  { id: 'kia', name: 'Kia', emoji: '🏁', color: '#05141F', models: ['EV3', 'EV6', 'EV9', 'Niro EV'] },
  { id: 'vw', name: 'Volkswagen', emoji: '🚗', color: '#1B3A6B', models: ['ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID.Buzz'] },
  { id: 'renault', name: 'Renault', emoji: '💎', color: '#D4A900', models: ['Zoe', 'Megane E-Tech', 'Scenic E-Tech'] },
  { id: 'dacia', name: 'Dacia', emoji: '🌿', color: '#6B8E23', models: ['Spring'] },
  { id: 'audi', name: 'Audi', emoji: '⬤', color: '#BB0A21', models: ['e-tron', 'e-tron GT', 'Q4 e-tron', 'Q6 e-tron', 'Q8 e-tron'] },
  { id: 'porsche', name: 'Porsche', emoji: '🏆', color: '#AE8753', models: ['Taycan', 'Taycan Sport Turismo', 'Macan Electric'] },
  { id: 'volvo', name: 'Volvo', emoji: '🛡', color: '#003057', models: ['XC40 Recharge', 'C40 Recharge', 'EX30', 'EX90'] },
  { id: 'peugeot', name: 'Peugeot', emoji: '🦁', color: '#333333', models: ['e-208', 'e-2008', 'e-308', 'e-3008', 'e-5008'] },
  { id: 'opel', name: 'Opel', emoji: '⭕', color: '#F7FF00', models: ['Corsa-e', 'Mokka-e', 'Astra Electric', 'Grandland Electric'] },
  { id: 'citroen', name: 'Citroën', emoji: '🔷', color: '#E4002B', models: ['ë-C3', 'ë-C4', 'ë-C4 X', 'ë-Berlingo'] },
  { id: 'fiat', name: 'Fiat', emoji: '🇮🇹', color: '#AD1025', models: ['500e', '600e'] },
  { id: 'ford', name: 'Ford', emoji: '🔵', color: '#003C8C', models: ['Mustang Mach-E', 'Explorer EV', 'Capri EV', 'Puma Gen-E'] },
  { id: 'nissan', name: 'Nissan', emoji: '🌀', color: '#C3002F', models: ['Leaf', 'Ariya'] },
  { id: 'toyota', name: 'Toyota', emoji: '🔴', color: '#EB0A1E', models: ['bZ4X'] },
  { id: 'skoda', name: 'Škoda', emoji: '🟢', color: '#4BA82E', models: ['Enyaq', 'Elroq'] },
  { id: 'cupra', name: 'Cupra', emoji: '🧡', color: '#782F40', models: ['Born', 'Tavascan'] },
  { id: 'mini', name: 'MINI', emoji: '⚪', color: '#000000', models: ['Cooper SE', 'Countryman SE', 'Aceman'] },
  { id: 'smart', name: 'smart', emoji: '🟡', color: '#D7C700', models: ['#1', '#3'] },
  { id: 'jeep', name: 'Jeep', emoji: '🚙', color: '#1B4D3E', models: ['Avenger Electric'] },
  { id: 'polestar', name: 'Polestar', emoji: '⬛', color: '#000000', models: ['Polestar 2', 'Polestar 4'] },
  { id: 'lexus', name: 'Lexus', emoji: '🎀', color: '#1A1A1A', models: ['UX 300e', 'RZ'] },
  { id: 'ds', name: 'DS', emoji: '✨', color: '#1C1C1C', models: ['DS 3 E-Tense', 'DS 4 E-Tense'] },
];

const MOCK_PAINTED = [
  [],
  ['Sol Ön Kapı', 'Sol Ön Çamurluk'],
  ['Kaput', 'Ön Tampon'],
  [],
  ['Bagaj', 'Arka Tampon'],
  ['Sağ Arka Kapı'],
  [],
  ['Tavan', 'Sol Arka Çamurluk'],
];
const MOCK_REPLACED = [
  [],
  ['Ön Tampon'],
  [],
  ['Sol Arka Kapı', 'Arka Tampon'],
  [],
  ['Kaput'],
  ['Sağ Ön Çamurluk', 'Sağ Ön Kapı'],
  [],
];

function darken(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  const r = Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Demo ilan görselleri — Unsplash EV / otomobil fotoğrafları (sabit ID) */
const MOCK_CAR_PHOTOS = [
  'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&h=480&q=80', // Tesla
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&h=480&q=80', // EV side
  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&h=480&q=80', // charging
  'https://images.unsplash.com/photo-1554744512-d6c603f27c54?auto=format&fit=crop&w=800&h=480&q=80', // sports EV
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&h=480&q=80', // car front
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&h=480&q=80', // porsche-like
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&h=480&q=80', // car
  'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&h=480&q=80', // audi-like
  'https://images.unsplash.com/photo-1616422285623-13ff0162193b?auto=format&fit=crop&w=800&h=480&q=80', // modern car
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&h=480&q=80', // car detail
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&h=480&q=80', // muscle/car
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&h=480&q=80', // classic car road
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&h=480&q=80', // red car
  'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&h=480&q=80', // EV night
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&h=480&q=80', // mercedes-like
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&h=480&q=80', // ferrari-like
];

function mockPhotos(i: number): string[] {
  const n = MOCK_CAR_PHOTOS.length;
  const a = MOCK_CAR_PHOTOS[i % n];
  const b = MOCK_CAR_PHOTOS[(i + 3) % n];
  const c = MOCK_CAR_PHOTOS[(i + 7) % n];
  return i % 2 === 0 ? [a, b, c] : [a, b];
}

export function generateListings(brandId: string, model: string): EvListing[] {
  const brand = EV_BRANDS.find((b) => b.id === brandId) ?? EV_BRANDS[0];
  const sellers: [string, string, string][] = [
    ['Ahmet K.', 'AK', '#CC0000'],
    ['Merve S.', 'MS', '#2DC653'],
    ['Can D.', 'CD', '#1C69D4'],
    ['Elif T.', 'ET', '#9B59B6'],
    ['Burak A.', 'BA', '#EF9F27'],
    ['Selin Y.', 'SY', '#D4537E'],
    ['Mert K.', 'MK', '#378ADD'],
    ['Zeynep O.', 'ZO', '#20B2AA'],
    ['Emre B.', 'EB', '#FF6B35'],
    ['Ceren A.', 'CA', '#8E44AD'],
    ['Yusuf T.', 'YT', '#16A085'],
    ['Deniz P.', 'DP', '#E67E22'],
    ['Berk S.', 'BS', '#2980B9'],
    ['Ayşe M.', 'AM', '#C0392B'],
    ['Tolga R.', 'TR', '#27AE60'],
    ['Nur K.', 'NK', '#8B7000'],
  ];
  const years = [2021, 2022, 2023, 2023, 2024, 2022, 2023, 2024, 2021, 2023, 2022, 2024, 2023, 2022, 2024, 2021];
  const kms = [18500, 34200, 52000, 8900, 3200, 41000, 15600, 6700, 27300, 11200, 48000, 4100, 22400, 38700, 9800, 55000];
  const prices = [2850000, 2150000, 1780000, 3100000, 3450000, 1950000, 2650000, 3800000, 1600000, 2950000, 1450000, 4100000, 2300000, 1850000, 3550000, 1380000];
  const bh = [97, 93, 88, 99, 100, 95, 98, 99, 91, 96, 87, 100, 94, 92, 99, 86];
  const ranges = [505, 470, 430, 515, 530, 490, 528, 540, 450, 508, 420, 545, 485, 455, 525, 415];
  const types = ['Sahibinden', 'Galeriden', 'Galeriden', 'Sahibinden', 'Sahibinden', 'Galeriden', 'Sahibinden', 'Sahibinden', 'Galeriden', 'Sahibinden', 'Galeriden', 'Sahibinden', 'Galeriden', 'Sahibinden', 'Sahibinden', 'Galeriden'];
  const damages = ['Kazasız', 'Kazasız', 'Kazalı', 'Kazasız', 'Kazasız', 'Kazasız', 'Kazasız', 'Kazasız', 'Kazalı', 'Kazasız', 'Kazalı', 'Kazasız', 'Kazasız', 'Kazalı', 'Kazasız', 'Kazasız'];
  const times = ['30 dk önce', '2 saat önce', '1 gün önce', '5 saat önce', '20 dk önce', '3 gün önce', '4 saat önce', '1 saat önce', '2 gün önce', '45 dk önce', '4 gün önce', '15 dk önce', '6 saat önce', '5 gün önce', '3 saat önce', '1 hafta önce'];
  const colors = ['Beyaz', 'Siyah', 'Gri', 'Mavi', 'Kırmızı', 'Beyaz', 'Gümüş', 'Lacivert', 'Beyaz', 'Siyah', 'Kırmızı', 'Yeşil', 'Gri', 'Beyaz', 'Mavi', 'Siyah'];
  const warranties = ['Yok', '2 Yıl', 'Yok', '3 Yıl', '1 Yıl', 'Yok', 'Yok', '2 Yıl', 'Yok', '1 Yıl', 'Yok', '3 Yıl', 'Yok', 'Yok', '2 Yıl', 'Yok'];
  const acPowers = [11, 11, 22, 11, 11, 22, 11, 11, 11, 22, 11, 11, 22, 11, 11, 11];
  const dcPowers = [150, 250, 150, 350, 150, 100, 150, 250, 50, 350, 150, 200, 150, 135, 150, 50];
  const batteries = [75, 82, 100, 90, 77, 64, 82, 100, 40, 77, 82, 77, 54, 82, 91, 40];
  const motorPowers = [299, 514, 670, 204, 150, 286, 408, 299, 109, 320, 204, 218, 136, 204, 480, 109];
  const drivetrains = ['Arkadan İtiş', '4x4', 'Arkadan İtiş', 'Arkadan İtiş', 'Önden Çekiş', 'Arkadan İtiş', '4x4', 'Arkadan İtiş', 'Önden Çekiş', '4x4', 'Önden Çekiş', 'Arkadan İtiş', 'Önden Çekiş', 'Arkadan İtiş', '4x4', 'Önden Çekiş'];
  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep'];

  return Array.from({ length: 16 }, (_, i) => {
    const s = sellers[i];
    return {
      id: `${brandId}_${model}_${i}`,
      brandId,
      model,
      year: years[i],
      km: kms[i],
      price: prices[i],
      batteryHealth: bh[i],
      range: ranges[i],
      chargeType: 'CCS2',
      location: cities[i % 8],
      sellerName: s[0],
      sellerInitials: s[1],
      sellerColor: s[2],
      sellerType: types[i],
      damageStatus: damages[i],
      postedAgo: times[i],
      gradient: [darken(brand.color, 0.65), brand.color] as [string, string],
      emoji: brand.emoji,
      isFeatured: i === 0 || i === 4,
      color: colors[i],
      warranty: warranties[i],
      acChargePower: acPowers[i],
      dcChargePower: dcPowers[i],
      batteryCapacity: batteries[i],
      motorPower: motorPowers[i],
      drivetrain: drivetrains[i],
      paintedParts: MOCK_PAINTED[i % MOCK_PAINTED.length],
      replacedParts: MOCK_REPLACED[i % MOCK_REPLACED.length],
      photos: mockPhotos(i),
    };
  });
}

export function getVitrinListings(): EvListing[] {
  const all = EV_BRANDS.map((b) => generateListings(b.id, b.models[0])[0]);
  const picks = [3, 7, 1, 11, 5, 13, 0, 9, 2, 12, 6, 10, 4, 8];
  return picks.filter((i) => i < all.length).map((i) => all[i]);
}

export function formatPrice(p: number): string {
  if (p >= 1000000) {
    const m = p / 1000000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M ₺`;
  }
  return `${(p / 1000).toFixed(0)}K ₺`;
}

export function isFilterActive(f: ListingFilter): boolean {
  return (
    f.priceMin !== 0 ||
    f.priceMax !== 5000000 ||
    f.kmMin !== 0 ||
    f.kmMax !== 200000 ||
    f.yearMin !== 2018 ||
    f.yearMax !== 2025 ||
    f.sellerType !== 'Tümü' ||
    f.damageStatus !== 'Tümü' ||
    f.dateSort !== 'none' ||
    f.priceSort !== 'none'
  );
}

function postedMinutes(l: EvListing): number {
  const s = l.postedAgo;
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
  if (s.includes('dk')) return n;
  if (s.includes('saat')) return n * 60;
  if (s.includes('gün')) return n * 1440;
  if (s.includes('hafta')) return n * 10080;
  return 0;
}

export function filterListings(
  listings: EvListing[],
  f: ListingFilter,
): EvListing[] {
  const filtered = listings.filter((l) => {
    if (l.price < f.priceMin || l.price > f.priceMax) return false;
    if (l.km < f.kmMin || l.km > f.kmMax) return false;
    if (l.year < f.yearMin || l.year > f.yearMax) return false;
    if (f.sellerType !== 'Tümü' && l.sellerType !== f.sellerType) return false;
    if (f.damageStatus !== 'Tümü' && l.damageStatus !== f.damageStatus)
      return false;
    return true;
  });

  if (f.dateSort === 'newest') {
    filtered.sort((a, b) => postedMinutes(a) - postedMinutes(b));
  } else if (f.dateSort === 'oldest') {
    filtered.sort((a, b) => postedMinutes(b) - postedMinutes(a));
  }
  if (f.priceSort === 'highest') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (f.priceSort === 'lowest') {
    filtered.sort((a, b) => a.price - b.price);
  }
  return filtered;
}

const followed = new Set<string>();
const followListeners = new Set<() => void>();

export function isFollowing(id: string) {
  return followed.has(id);
}

export function subscribeFollow(cb: () => void) {
  followListeners.add(cb);
  return () => {
    followListeners.delete(cb);
  };
}

export function toggleFollow(id: string, title?: string): boolean {
  if (followed.has(id)) followed.delete(id);
  else followed.add(id);
  followListeners.forEach((l) => l());
  return followed.has(id);
}
