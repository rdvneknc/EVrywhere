# EVrywhere

Elektrikli araç topluluğu — **Expo / React Native** (`mobile/`) + **web forum** (`web/`).

## Mobil

```bash
cd mobile
npm install
npx expo start
```

## Web (forum anasayfa)

```bash
cd web
npm install
npm run dev
```

## Firebase

- Kurallar: `firebase/firestore.rules`, `firebase/storage.rules`
- Deploy: `firebase deploy --only firestore:rules,storage`

## Şarj API

Varsayılan: Cloudflare Worker (`mobile/src/api/chargingConfig.ts`).  
Yerel alternatif: `ocm_api/` (+ `scripts/start-ocm-api.ps1`).
