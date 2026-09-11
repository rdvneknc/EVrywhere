export type ChargingStation = {
  ocmId: number;
  name: string;
  address: string;
  distanceKm: number;
  lat: number;
  lng: number;
  maxPowerKw: number;
  connectorLabels: string[];
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

export function parseStation(m: Record<string, unknown>): ChargingStation {
  const conns = m.connectorLabels;
  return {
    ocmId: Number(m.ocmId),
    name: (m.name as string) ?? 'İstasyon',
    address: (m.address as string) ?? '',
    distanceKm: Number(m.distanceKm ?? 0),
    lat: Number(m.lat),
    lng: Number(m.lng),
    maxPowerKw: Number(m.maxPowerKw ?? 0),
    connectorLabels: Array.isArray(conns)
      ? conns.map((e) => String(e))
      : [],
  };
}

export function connectorColor(label: string): string {
  const u = label.toUpperCase();
  if (u === 'HPC') return '#7F77DD';
  if (u === 'DC') return '#EF9F27';
  if (u === 'AC') return '#378ADD';
  return '#ADC4B4';
}

export function stationMarkerColor(station: ChargingStation): string {
  const labels = station.connectorLabels.map((e) => e.toUpperCase());
  if (labels.includes('HPC')) return '#7F77DD';
  if (labels.includes('DC')) return '#EF9F27';
  return '#2DC653';
}
