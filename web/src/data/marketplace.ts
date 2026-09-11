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
  createdAtMs: number;
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
  yearMax: 2026,
  sellerType: 'Tümü',
  damageStatus: 'Tümü',
  dateSort: 'none',
  priceSort: 'none',
};

/** Türkiye'nin 81 ili (plaka sırası) */
export const TURKEY_PROVINCES = [
  'Adana',
  'Adıyaman',
  'Afyonkarahisar',
  'Ağrı',
  'Amasya',
  'Ankara',
  'Antalya',
  'Artvin',
  'Aydın',
  'Balıkesir',
  'Bilecik',
  'Bingöl',
  'Bitlis',
  'Bolu',
  'Burdur',
  'Bursa',
  'Çanakkale',
  'Çankırı',
  'Çorum',
  'Denizli',
  'Diyarbakır',
  'Edirne',
  'Elazığ',
  'Erzincan',
  'Erzurum',
  'Eskişehir',
  'Gaziantep',
  'Giresun',
  'Gümüşhane',
  'Hakkari',
  'Hatay',
  'Isparta',
  'Mersin',
  'İstanbul',
  'İzmir',
  'Kars',
  'Kastamonu',
  'Kayseri',
  'Kırklareli',
  'Kırşehir',
  'Kocaeli',
  'Konya',
  'Kütahya',
  'Malatya',
  'Manisa',
  'Kahramanmaraş',
  'Mardin',
  'Muğla',
  'Muş',
  'Nevşehir',
  'Niğde',
  'Ordu',
  'Rize',
  'Sakarya',
  'Samsun',
  'Siirt',
  'Sinop',
  'Sivas',
  'Tekirdağ',
  'Tokat',
  'Trabzon',
  'Tunceli',
  'Şanlıurfa',
  'Uşak',
  'Van',
  'Yozgat',
  'Zonguldak',
  'Aksaray',
  'Bayburt',
  'Karaman',
  'Kırıkkale',
  'Batman',
  'Şırnak',
  'Bartın',
  'Ardahan',
  'Iğdır',
  'Yalova',
  'Karabük',
  'Kilis',
  'Osmaniye',
  'Düzce',
] as const;

/** Geriye dönük alias */
export const LISTING_CITIES = TURKEY_PROVINCES;

export function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

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

export function formatPrice(p: number): string {
  if (p >= 1_000_000) {
    const m = p / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M ₺`;
  }
  return `${(p / 1000).toFixed(0)}K ₺`;
}

export function formatPriceFull(p: number): string {
  return `${p.toLocaleString('tr-TR')} ₺`;
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

  const sorted = [...filtered];
  if (f.dateSort === 'newest') {
    sorted.sort((a, b) => b.createdAtMs - a.createdAtMs);
  } else if (f.dateSort === 'oldest') {
    sorted.sort((a, b) => a.createdAtMs - b.createdAtMs);
  }
  if (f.priceSort === 'highest') {
    sorted.sort((a, b) => b.price - a.price);
  } else if (f.priceSort === 'lowest') {
    sorted.sort((a, b) => a.price - b.price);
  }
  return sorted;
}
