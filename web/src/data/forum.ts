export const EV_PRIMARY = '#2DC653';

export const FORUM_CATEGORIES = [
  { id: 'general', label: 'Genel', emoji: '💬' },
  { id: 'charging', label: 'Şarj', emoji: '⚡' },
  { id: 'tech', label: 'Teknik', emoji: '🔧' },
  { id: 'trips', label: 'Yolculuk', emoji: '🗺️' },
  { id: 'news', label: 'Haberler', emoji: '📰' },
  { id: 'secondhand', label: 'İkinci El', emoji: '🔄' },
  { id: 'meetup', label: 'Buluşma', emoji: '📍' },
] as const;

export type ForumBrand = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

/** Popüler markalar — sidebar grid + filtre */
export const FORUM_BRANDS: ForumBrand[] = [
  { id: 'tesla', name: 'Tesla', emoji: '⚡', color: '#CC0000' },
  { id: 'byd', name: 'BYD', emoji: '🔋', color: '#FF6B00' },
  { id: 'bmw', name: 'BMW', emoji: '🔵', color: '#1C69D4' },
  { id: 'mercedes', name: 'Mercedes', emoji: '⭐', color: '#1C1C1C' },
  { id: 'renault', name: 'Renault', emoji: '💎', color: '#FFCC00' },
  { id: 'volvo', name: 'Volvo', emoji: '🛡️', color: '#003057' },
  { id: 'hyundai', name: 'Hyundai', emoji: '🅗', color: '#00287A' },
  { id: 'kia', name: 'Kia', emoji: '🏁', color: '#05141F' },
  { id: 'togg', name: 'Togg', emoji: '🇹🇷', color: '#2DC653' },
  { id: 'mg', name: 'MG', emoji: '🅜', color: '#B00020' },
  { id: 'vw', name: 'Volkswagen', emoji: '🚗', color: '#1B3A6B' },
  { id: 'audi', name: 'Audi', emoji: '⬤', color: '#BB0A21' },
];

export const POPULAR_BRAND_IDS = [
  'tesla',
  'byd',
  'bmw',
  'mercedes',
  'renault',
  'volvo',
  'hyundai',
  'kia',
] as const;

export const CATEGORY_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  general: {
    label: '💬 Genel',
    className:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300',
  },
  charging: {
    label: '⚡ Şarj',
    className:
      'bg-sky-100 text-sky-800 dark:bg-sky-950/55 dark:text-sky-300',
  },
  tech: {
    label: '🔧 Teknik',
    className:
      'bg-amber-100 text-amber-800 dark:bg-amber-950/55 dark:text-amber-300',
  },
  trips: {
    label: '🗺️ Yolculuk',
    className:
      'bg-violet-100 text-violet-800 dark:bg-violet-950/55 dark:text-violet-300',
  },
  news: {
    label: '📰 Haberler',
    className:
      'bg-rose-100 text-rose-800 dark:bg-rose-950/55 dark:text-rose-300',
  },
  secondhand: {
    label: '🔄 2. El',
    className:
      'bg-teal-100 text-teal-800 dark:bg-teal-950/55 dark:text-teal-300',
  },
  meetup: {
    label: '📍 Buluşma',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-950/55 dark:text-orange-300',
  },
};

export type ForumTopic = {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  authorId?: string;
  categoryId: string;
  brandId: string;
  timeAgo: string;
  replies: number;
  views: number;
  photoUrl?: string;
  createdAtMs: number;
};

export type ForumComment = {
  id: string;
  authorId?: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  text: string;
  timeAgo: string;
  photoUrl?: string;
};

export function findCategory(categoryId: string) {
  return (
    FORUM_CATEGORIES.find((c) => c.id === categoryId) ?? FORUM_CATEGORIES[0]
  );
}

export function findBrand(brandId: string): ForumBrand | undefined {
  return FORUM_BRANDS.find((b) => b.id === brandId);
}

export function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

/** Marka filtresi: brandId veya başlık/özette marka adı */
export function topicMatchesBrand(topic: ForumTopic, brandId: string): boolean {
  if (!brandId || brandId === 'all') return true;
  if (topic.brandId === brandId) return true;
  const brand = findBrand(brandId);
  if (!brand) return false;
  const hay = `${topic.title} ${topic.excerpt}`.toLowerCase();
  return hay.includes(brand.name.toLowerCase());
}

