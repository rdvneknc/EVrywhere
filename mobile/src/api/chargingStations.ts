import { ChargingApiConfig } from './chargingConfig';
import {
  ChargingStation,
  GeocodeResult,
  parseStation,
} from '../data/charging';

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (ChargingApiConfig.serverSecret) {
    h['X-EV-Charging-Key'] = ChargingApiConfig.serverSecret;
  }
  return h;
}

function url(path: string) {
  return `${ChargingApiConfig.baseUrl}${path}`;
}

async function throwIfError(res: Response, name: string) {
  if (res.ok) return;
  let msg = '';
  try {
    const b = await res.json();
    msg = typeof b?.error === 'string' ? b.error : JSON.stringify(b);
  } catch {
    msg = await res.text();
  }
  throw new Error(`Şarj API ${name}: HTTP ${res.status} ${msg}`);
}

export async function getChargingStations(params: {
  lat: number;
  lng: number;
  distanceKm?: number;
  maxResults?: number;
}): Promise<ChargingStation[]> {
  const res = await fetch(url('/getChargingStations'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      lat: params.lat,
      lng: params.lng,
      distanceKm: params.distanceKm ?? 25,
      maxResults: params.maxResults ?? 80,
    }),
  });
  await throwIfError(res, 'getChargingStations');
  const data = await res.json();
  const raw = data.stations;
  if (!Array.isArray(raw)) return [];
  return raw.map((e) => parseStation(e as Record<string, unknown>));
}

export async function geocodeCity(query: string): Promise<GeocodeResult> {
  const res = await fetch(url('/geocodeCity'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query }),
  });
  await throwIfError(res, 'geocodeCity');
  const d = await res.json();
  return {
    lat: Number(d.lat),
    lng: Number(d.lng),
    displayName: (d.displayName as string) ?? query,
  };
}
