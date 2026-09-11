# EVrywhere Firebase

Firestore ve Storage kuralları — proje: `evrywhere-85bc5`.

## Deploy

```bash
firebase login
firebase use evrywhere-85bc5
firebase deploy --only firestore,storage
```

## Şarj API

Uygulama Firebase Functions kullanmaz. Varsayılan Cloudflare Worker veya yerel `ocm_api/` (bkz. `ocm_api/README.md`, `mobile/src/api/chargingConfig.ts`).
