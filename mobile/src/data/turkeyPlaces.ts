/**
 * Türkiye illeri + tüm ilçeler — şehir önerisi (OCM/geocode’tan bağımsız).
 * Veri: turkeyPlaces.data.json (81 il + ~970 ilçe)
 */

import rawPlaces from './turkeyPlaces.data.json';

export type TurkeyPlace = {
  name: string;
  /** Gösterim: "Kadıköy, İstanbul" */
  label: string;
  lat: number;
  lng: number;
};

type PlaceTuple = [string, string, number, number];

function normalizeTr(s: string): string {
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

export const TURKEY_PLACES: TurkeyPlace[] = (rawPlaces as PlaceTuple[]).map(
  ([name, label, lat, lng]) => ({ name, label, lat, lng }),
);

export function searchTurkeyPlaces(
  query: string,
  limit = 10,
): TurkeyPlace[] {
  const q = normalizeTr(query);
  if (q.length < 1) return [];

  const scored: Array<{ place: TurkeyPlace; score: number }> = [];
  for (const place of TURKEY_PLACES) {
    const nName = normalizeTr(place.name);
    const nLabel = normalizeTr(place.label);
    let score = 0;
    if (nName === q || nLabel === q) score = 100;
    else if (nName.startsWith(q)) score = 80;
    else if (nLabel.startsWith(q)) score = 70;
    else if (nName.includes(q)) score = 50;
    else if (nLabel.includes(q)) score = 40;
    if (score > 0) scored.push({ place, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score || a.place.label.localeCompare(b.place.label, 'tr'),
  );
  return scored.slice(0, limit).map((s) => s.place);
}
