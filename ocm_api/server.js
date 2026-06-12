/**
 * OCM + Nominatim — tek bir HTTP servisi (Vercel, Render, Fly.io, kendi Nginx+Node, vb.)
 * Sözleşme: POST /getChargingStations, POST /geocodeCity (ayrıntı: README.md)
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const OCM_BASE = "https://api.openchargemap.io/v3/poi/";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_UA = "EVrywhere/1.0 (ocm_api; self-hosted)";

const cacheTtlMs = 5 * 60 * 1000;
const stationsCache = new Map();
const geocodeCache = new Map();

const apiSecret = (process.env.API_SECRET || "").trim();

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
    const err = new Error("OCM_KEY yok. .env veya host ortam değişkeni.");
    err.status = 500;
    throw err;
  }
  return k;
}

function requireSecret(req, res, next) {
  if (!apiSecret) return next();
  const h = (req.get("X-EV-Charging-Key") || "").trim();
  if (h !== apiSecret) {
    return res.status(401).json({error: "Geçersiz veya eksik X-EV-Charging-Key"});
  }
  next();
}

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
  if (maxKw >= 100) labels.add("HPC");
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
  const address = [info.AddressLine1, info.Town, info.State].filter(Boolean).join(", ") ||
    (info.Town || "").toString();
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

const app = express();
app.use(cors());
app.use(express.json({limit: "32kb"}));

app.get("/health", (_req, res) => {
  res.json({ok: true});
});

app.post("/getChargingStations", requireSecret, async (req, res) => {
  try { // ocmKey ve fetch
    const data = req.body || {};
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    const distanceKm = Math.min(100, Math.max(1, Number(data.distanceKm) || 25));
    const maxResults = Math.min(100, Math.max(1, parseInt(String(data.maxResults || 50), 10)));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({error: "lat ve lng gerekli"});
    }
    const key = ocmKey();
    const cacheKey = `s:${lat.toFixed(4)},${lng.toFixed(4)}:${distanceKm}:${maxResults}`;
    const hit = getCached(stationsCache, cacheKey);
    if (hit) {
      return res.json({stations: hit, fromCache: true});
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
    const r = await fetch(url.toString());
    if (!r.ok) {
      return res.status(502).json({error: `OCM HTTP ${r.status}`});
    }
    const list = await r.json();
    const stations = [];
    for (const poi of list || []) {
      const n = normalizeOcmPoi(poi);
      if (n) stations.push(n);
    }
    setCached(stationsCache, cacheKey, stations);
    return res.json({stations, fromCache: false});
  } catch (e) {
    const status = e.status && Number.isFinite(e.status) ? e.status : 500;
    return res.status(status).json({error: e.message || "Sunucu hatası"});
  }
});

app.post("/geocodeCity", requireSecret, async (req, res) => {
  try {
    const data = req.body || {};
    const q = (data.query && String(data.query).trim()) || "";
    if (q.length < 2) {
      return res.status(400).json({error: "En az 2 harf"});
    }
    const hit = getCached(geocodeCache, `g:${q.toLowerCase()}`);
    if (hit) {
      return res.json({...hit, fromCache: true});
    }
    const u = new URL(NOMINATIM);
    u.searchParams.set("format", "json");
    u.searchParams.set("limit", "1");
    u.searchParams.set("countrycodes", "tr");
    u.searchParams.set("q", q);
    const r = await fetch(u.toString(), {
      headers: {"User-Agent": NOMINATIM_UA},
    });
    if (!r.ok) {
      return res.status(502).json({error: `Nominatim HTTP ${r.status}`});
    }
    const arr = await r.json();
    if (!Array.isArray(arr) || arr.length === 0) {
      return res.status(404).json({error: "Konum bulunamadı"});
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
    return res.json(out);
  } catch (e) {
    const status = e.status && Number.isFinite(e.status) ? e.status : 500;
    return res.status(status).json({error: e.message || "Sunucu hatası"});
  }
});

const port = Number(process.env.PORT) || 8787;
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`ocm_api listening on :${port}`);
  });
}

module.exports = {app};
