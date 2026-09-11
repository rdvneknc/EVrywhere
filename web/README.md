# EVrywhere Web (Forum)

React + Vite + TypeScript + Tailwind + Firebase.

## Çalıştırma

```bash
cd web
npm install
npm run dev
```

## Rotalar

- `/` — ana sayfa (forum + ilan özeti)
- `/forum` — konu listesi
- `/forum/yeni` — yeni konu (giriş gerekli)
- `/forum/:topicId` — konu + yanıtlar
- `/ilanlar` — 2. el ilan listesi
- `/ilanlar/yeni` — ilan ver (giriş gerekli)
- `/ilanlar/:listingId` — ilan detay
- `/sarj` — şarj haritası (Leaflet + mevcut OCM API)
- `/giris` — giriş / kayıt

## Firebase

Mobil ile aynı proje (`evrywhere-85bc5`). Auth domain olarak `localhost` eklenmeli.
