# OCM + Nominatim HTTP proxy (herhangi bir host)

EVrywhere uygulaması **Firebase Function kullanmaz**; kendi koyduğun herhangi bir URL’e istek atar (`CHARGING_API_BASE_URL`).

## Uçlar (sözleşme)

- `POST {baseUrl}/getChargingStations`  
  - Gövde (JSON): `{ "lat", "lng", "distanceKm"?, "maxResults"? }`  
  - 200: `{ "stations": [ ... ], "fromCache"?: bool }`  
- `POST {baseUrl}/geocodeCity`  
  - Gövde: `{ "query": "..." }`  
  - 200: `{ "lat", "lng", "displayName", "fromCache"?: bool }`  
- (İsteğe bağlı) `API_SECRET` tanımlıysa, her iki isteğe header: `X-EV-Charging-Key: <API_SECRET>`

Hata: JSON `{ "error": "mesaj" }`, uygun HTTP kodu.

## Bu klasörle çalıştırma

```bash
cd ocm_api
cp .env.example .env
# OCM_KEY=... yaz
npm install
npm start
# http://127.0.0.1:8787/health
```

## Flutter (aynı makinede emülatör / web)

- Android emülatör: `10.0.2.2:8787` (localhost yerine)  
- iOS simülatör: `127.0.0.1:8787`  
- Fiziksel cihaz: PC’nin yerel ağı IP’si + 8787

```bash
flutter run --dart-define=CHARGING_API_BASE_URL=http://10.0.2.2:8787
```

Gizlilik istersen sunucu ve uygulamada aynı `API_SECRET` / `CHARGING_API_SECRET` değerini kullan.

## Canlı (örnek)

Herhangi bir PaaS / VPS: `ocm_api`’yi deploy et, ortam değişkeni `OCM_KEY` (ve isteğe `API_SECRET`) ver. Sabit alan adı: `https://api.senin.com` gibi, sonda `/` yok. Flutter’da:

`--dart-define=CHARGING_API_BASE_URL=https://api.senin.com`

Kendi uygulamanda bu sözleşmeyi karşılayan farklı bir stack (Deno, Go, vb.) de kullanabilirsin; bu `server.js` sadece referans.
