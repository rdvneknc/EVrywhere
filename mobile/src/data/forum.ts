export type ForumCategory = {
  id: string;
  label: string;
  emoji: string;
};

export type ForumBrand = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  threadCount: number;
};

export type ForumComment = {
  authorName: string;
  authorInitials: string;
  text: string;
  timeAgo: string;
  authorColor: string;
  likes: number;
  photoUrl?: string;
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
  readTime: string;
  replies: number;
  views: number;
  isPinned?: boolean;
  isHot?: boolean;
  /** Opsiyonel konu fotoğrafı (data URI veya URL) */
  photoUrl?: string;
  comments: ForumComment[];
};

export const FORUM_CATEGORIES: ForumCategory[] = [
  { id: 'all', label: 'Tümü', emoji: '🌐' },
  { id: 'general', label: 'Genel', emoji: '💬' },
  { id: 'charging', label: 'Şarj', emoji: '⚡' },
  { id: 'tech', label: 'Teknik', emoji: '🔧' },
  { id: 'trips', label: 'Yolculuk', emoji: '🗺' },
  { id: 'news', label: 'Haberler', emoji: '📰' },
  { id: 'secondhand', label: 'İkinci El', emoji: '🔄' },
  { id: 'meetup', label: 'Organizasyon & Buluşma', emoji: '📍' },
];

export const FORUM_BRANDS: ForumBrand[] = [
  { id: 'all', name: 'Tümü', emoji: '🚗', color: '#2DC653', threadCount: 0 },
  { id: 'togg', name: 'Togg', emoji: '🇹🇷', color: '#2DC653', threadCount: 156 },
  { id: 'tesla', name: 'Tesla', emoji: '⚡', color: '#CC0000', threadCount: 284 },
  { id: 'byd', name: 'BYD', emoji: '🔋', color: '#FF6B00', threadCount: 120 },
  { id: 'mg', name: 'MG', emoji: '🅜', color: '#B00020', threadCount: 95 },
  { id: 'bmw', name: 'BMW', emoji: '🔵', color: '#1C69D4', threadCount: 159 },
  { id: 'mercedes', name: 'Mercedes', emoji: '⭐', color: '#1C1C1C', threadCount: 136 },
  { id: 'hyundai', name: 'Hyundai', emoji: '🅗', color: '#00287A', threadCount: 211 },
  { id: 'kia', name: 'Kia', emoji: '🏁', color: '#05141F', threadCount: 178 },
  { id: 'vw', name: 'Volkswagen', emoji: '🚗', color: '#1B3A6B', threadCount: 110 },
  { id: 'renault', name: 'Renault', emoji: '💎', color: '#FFCC00', threadCount: 97 },
  { id: 'dacia', name: 'Dacia', emoji: '🌿', color: '#6B8E23', threadCount: 70 },
  { id: 'audi', name: 'Audi', emoji: '⬤', color: '#BB0A21', threadCount: 142 },
  { id: 'porsche', name: 'Porsche', emoji: '🏆', color: '#AE8753', threadCount: 74 },
  { id: 'volvo', name: 'Volvo', emoji: '🛡', color: '#003057', threadCount: 88 },
  { id: 'peugeot', name: 'Peugeot', emoji: '🦁', color: '#333333', threadCount: 80 },
  { id: 'opel', name: 'Opel', emoji: '⭕', color: '#9AAA00', threadCount: 65 },
  { id: 'citroen', name: 'Citroën', emoji: '🔷', color: '#E4002B', threadCount: 55 },
  { id: 'fiat', name: 'Fiat', emoji: '🇮🇹', color: '#AD1025', threadCount: 50 },
  { id: 'ford', name: 'Ford', emoji: '🔵', color: '#003C8C', threadCount: 60 },
  { id: 'nissan', name: 'Nissan', emoji: '🌀', color: '#C3002F', threadCount: 72 },
  { id: 'toyota', name: 'Toyota', emoji: '🔴', color: '#EB0A1E', threadCount: 58 },
  { id: 'skoda', name: 'Škoda', emoji: '🟢', color: '#4BA82E', threadCount: 48 },
  { id: 'cupra', name: 'Cupra', emoji: '🧡', color: '#782F40', threadCount: 40 },
  { id: 'mini', name: 'MINI', emoji: '⚪', color: '#444444', threadCount: 35 },
  { id: 'smart', name: 'smart', emoji: '🟡', color: '#D7C700', threadCount: 30 },
  { id: 'jeep', name: 'Jeep', emoji: '🚙', color: '#1B4D3E', threadCount: 28 },
  { id: 'polestar', name: 'Polestar', emoji: '⬛', color: '#222222', threadCount: 25 },
  { id: 'lexus', name: 'Lexus', emoji: '🎀', color: '#1A1A1A', threadCount: 22 },
  { id: 'ds', name: 'DS', emoji: '✨', color: '#1C1C1C', threadCount: 18 },
];

export const CATEGORY_BADGE: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  general: { label: '💬 Genel', bg: '#E8F9ED', fg: '#1A8C40' },
  charging: { label: '⚡ Şarj', bg: '#E8F3FC', fg: '#185FA5' },
  tech: { label: '🔧 Teknik', bg: '#FFF3E0', fg: '#BF6D00' },
  trips: { label: '🗺 Yolculuk', bg: '#F3EEFE', fg: '#5E35B1' },
  news: { label: '📰 Haberler', bg: '#FFEBEE', fg: '#C62828' },
  secondhand: { label: '🔄 İkinci El', bg: '#E0F7F5', fg: '#00897B' },
  meetup: { label: '📍 Buluşma', bg: '#FFF3E0', fg: '#E65100' },
};

export const CATEGORY_ACCENT: Record<string, string> = {
  general: '#378ADD',
  charging: '#2DC653',
  tech: '#9B59B6',
  trips: '#EF9F27',
  news: '#D4537E',
  secondhand: '#20B2AA',
  meetup: '#FF6B35',
};

export function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

export function findBrand(brandId: string): ForumBrand {
  return FORUM_BRANDS.find((b) => b.id === brandId) ?? FORUM_BRANDS[0];
}

export function findCategory(categoryId: string): ForumCategory {
  return (
    FORUM_CATEGORIES.find((c) => c.id === categoryId) ?? FORUM_CATEGORIES[1]
  );
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

