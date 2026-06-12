# EVrywhere Firebase backend

Bu klasör, istemcinin kullandığı **Firestore** ve **Storage** kurallarını ve indeks tanımlarını içerir. Proje kimliği: `evrywhere-85bc5`.

## Mevcut veri modeli (özet)

| Koleksiyon      | Kullanım                          | Zorunlu sorgu alanları      |
|-----------------|-----------------------------------|-----------------------------|
| `posts`         | Şarj check-in vb.; **authorId** = gönderiyi atanın `uid`’si | `createdAt` (azalan)        |
| `forum_topics`  | Forum başlıkları; **authorId** = konuyu açan kullanıcının `uid`’si | `createdAt` (azalan)        |

Firestore, tek alanlı `orderBy` için çoğunlukla otomatik indeks oluşturur; bileşik sorgu eklersen `firestore.indexes.json` içine ekle.

## Dağıtım

1. [Firebase CLI](https://firebase.google.com/docs/cli) kur: `npm install -g firebase-tools`
2. Giriş: `firebase login`
3. Proje kökünde: `firebase use evrywhere-85bc5` (veya `firebase init` ile eşle)
4. Sadece kurallar:  
   `firebase deploy --only firestore,storage`

### Şarj / geocode (uygulama dışı API)

Uygulama artık **Firebase Function çağırmaz**. Open Charge Map proxy’si, repodaki `ocm_api/` HTTP sunucusu veya aynı HTTP sözleşmesini (bkz. `ocm_api/README.md`) uygulayan herhangi bir barındırma üzerinde çalışır. Build’de `CHARGING_API_BASE_URL` verilmesi gerekir.

- Kurulum: **proje kökünde `ocm_api/README.md`** (yerel, emülatör, canlı URL, `dart-define` örnekleri orada).

Klasör **`functions/`** yalnızca eski/isteğe bağlı **Firebase** deploy’u içindir (Blaze planı gerekir); şu an asıl yol `ocm_api` + kendi `CHARGING_API_BASE_URL`’in.

---

İlk defa Storage kullanıyorsan Firebase Console’da Storage’ı etkinleştir.

## Geliştirme notu

Kurallar `request.auth != null` istiyor; uygulama giriş yaptıktan sonra sorgu yapmalı. Herkese açık forum okuması istersen `forum_topics` için `allow read: if true` ile gevşetebilirsin (spam riskine dikkat).
