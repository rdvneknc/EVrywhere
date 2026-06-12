require("dotenv").config();

const functions = require("firebase-functions/v1");

const OCM_BASE = "https://api.openchargemap.io/v3/poi/";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_UA = "EVrywhere/1.0 (https://github.com; charging-map)";

// Basit bellek cache (soğuk başlarda sıfırlanır)
const cacheTtlMs = 5 * 60 * 1000;
const stationsCache = new Map();
const geocodeCache = new Map();

function getCached(map, key) {
  const e = map.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) {
    map.delete(key);
    return null;
  }
  return e.data;
}

function setCached(map, key, data) {
  map.set(key, {data, exp: Date.now() + cacheTtlMs});
}

function ocmKey() {
  const k = (process.env.OCM_KEY || "").trim();
  if (!k) {
    throw new functions.https.HttpsError(
        "failed-precondition",
        "OCM_KEY ortam değişkeni yok. functions/.env (yerel) veya "
        + "Google Cloud Console → Cloud Functions → getChargingStations → "
        + "Düzenle → Ortam değişkenleri'nde OCM_KEY=... tanımlayın.",
    );
  }
  return k;
}

/**
 * OCM cevabını sadeleştirilmiş istasyon listesine çevir
 */
function normalizeOcmPoi(poi) {
  const info = poi.AddressInfo || {};
  const lat = info.Latitude;
  const lng = info.Longitude;
  if (lat == null || lng == null) return null;

  const conns = poi.Connections || [];
  let maxKw = 0;
  const typeTitles = [];
  for (const c of conns) {
    if (c.PowerKW && c.PowerKW > maxKw) maxKw = c.PowerKW;
    const t = (c.ConnectionType && c.ConnectionType.Title) || "";
    if (t) typeTitles.push(t);
  }

  const labels = new Set();
  for (const t of typeTitles) {
    const l = t.toLowerCase();
    if (l.includes("ccs") || l.includes("chademo") ||
        (l.includes("tesla") && l.includes("supercharger")) ||
        (l.includes("ev") && l.includes("dc")) || l.includes("combo")) {
      labels.add("DC");
    }
    if (l.includes("type 2") || l.includes("type 1") || l.includes("schuko") ||
        l.includes("3-pin") || l.includes("wall") || l.includes("socket")) {
      labels.add("AC");
    }
  }
  if (maxKw >= 100) {
    labels.add("HPC");
  }
  if (labels.size === 0) {
    if (maxKw >= 22) labels.add("DC");
    else labels.add("AC");
  }
  const labelArr = Array.from(labels);
  if (labelArr.length > 3) {
    const order = (x) => (x === "HPC" ? 0 : x === "DC" ? 1 : 2);
    labelArr.sort((a, b) => order(a) - order(b));
  }

  const name = (info.Title || "Şarj istasyonu").toString().trim();
  const address = [info.AddressLine1, info.Town, info.State].filter(Boolean).join(", ") || (info.Town || "").toString();
  const dist = poi.Distance != null
    ? Math.round(poi.Distance * 10) / 10
    : 0;

  return {
    ocmId: poi.ID,
    name,
    address,
    distanceKm: dist,
    lat,
    lng,
    maxPowerKw: Math.round(maxKw || 0),
    connectorLabels: labelArr.slice(0, 3),
  };
}

/**
 * Uygulama: lat, lng, distanceKm (1–100), maxResults (≤100)
 */
exports.getChargingStations = functions
    .region("europe-west1")
    .https.onCall(async (data) => {
      const lat = Number(data.lat);
      const lng = Number(data.lng);
      const distanceKm = Math.min(100, Math.max(1, Number(data.distanceKm) || 25));
      const maxResults = Math.min(100, Math.max(1, parseInt(String(data.maxResults || 50), 10)));

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new functions.https.HttpsError("invalid-argument", "lat ve lng gerekli");
      }

      const key = ocmKey();
      const cacheKey = `s:${lat.toFixed(4)},${lng.toFixed(4)}:${distanceKm}:${maxResults}`;
      const hit = getCached(stationsCache, cacheKey);
      if (hit) {
        return {stations: hit, fromCache: true};
      }

      const url = new URL(OCM_BASE);
      url.searchParams.set("output", "json");
      url.searchParams.set("key", key);
      url.searchParams.set("latitude", String(lat));
      url.searchParams.set("longitude", String(lng));
      url.searchParams.set("distance", String(distanceKm));
      url.searchParams.set("distanceunit", "KM");
      url.searchParams.set("maxresults", String(maxResults));
      url.searchParams.set("compact", "true");
      url.searchParams.set("verbose", "false");

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new functions.https.HttpsError("internal", `OCM HTTP ${res.status}`);
      }
      const list = await res.json();
      const stations = [];
      for (const poi of list || []) {
        const n = normalizeOcmPoi(poi);
        if (n) stations.push(n);
      }
      setCached(stationsCache, cacheKey, stations);
      return {stations, fromCache: false};
    });

/**
 * Şehir / adres metnini enlem-boylama çevir (Nominatim, Türkiye ağırlıklı)
 */
exports.geocodeCity = functions
    .region("europe-west1")
    .https.onCall(async (data) => {
      const q = (data.query && String(data.query).trim()) || "";
      if (q.length < 2) {
        throw new functions.https.HttpsError("invalid-argument", "En az 2 harf");
      }
      const hit = getCached(geocodeCache, `g:${q.toLowerCase()}`);
      if (hit) {
        return {...hit, fromCache: true};
      }

      const u = new URL(NOMINATIM);
      u.searchParams.set("format", "json");
      u.searchParams.set("limit", "1");
      u.searchParams.set("countrycodes", "tr");
      u.searchParams.set("q", q);

      const res = await fetch(u.toString(), {
        headers: {"User-Agent": NOMINATIM_UA},
      });
      if (!res.ok) {
        throw new functions.https.HttpsError("internal", `Nominatim HTTP ${res.status}`);
      }
      const arr = await res.json();
      if (!Array.isArray(arr) || arr.length === 0) {
        throw new functions.https.HttpsError("not-found", "Konum bulunamadı");
      }
      const p = arr[0];
      const out = {
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lon),
        displayName: p.display_name || q,
        fromCache: false,
      };
      setCached(geocodeCache, `g:${q.toLowerCase()}`, {
        lat: out.lat,
        lng: out.lng,
        displayName: out.displayName,
      });
      return out;
    });
