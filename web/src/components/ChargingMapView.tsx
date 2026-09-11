import { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  stationMarkerColor,
  type ChargingStation,
} from '../data/charging';
import { useTheme } from '../theme/ThemeContext';
import 'leaflet/dist/leaflet.css';

type Props = {
  stations: ChargingStation[];
  centerLat: number | null;
  centerLng: number | null;
  selectedId: number | null;
  onStationTap: (station: ChargingStation) => void;
  scrollWheelZoom?: boolean;
  className?: string;
};

const LIGHT_TILES = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

const DARK_TILES = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

function FitBounds({
  stations,
  centerLat,
  centerLng,
}: {
  stations: ChargingStation[];
  centerLat: number | null;
  centerLng: number | null;
}) {
  const map = useMap();
  const stationsKey = stations.map((s) => s.ocmId).join(',');

  useEffect(() => {
    const points: [number, number][] = [];
    if (centerLat != null && centerLng != null) {
      points.push([centerLat, centerLng]);
    }
    for (const s of stations) points.push([s.lat, s.lng]);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, stationsKey, centerLat, centerLng]);

  return null;
}

function FocusSelected({
  selectedId,
  stations,
}: {
  selectedId: number | null;
  stations: ChargingStation[];
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedId == null) return;
    const station = stations.find((s) => s.ocmId === selectedId);
    if (!station) return;
    const zoom = Math.max(map.getZoom(), 15);
    map.flyTo([station.lat, station.lng], zoom, { duration: 0.65 });
  }, [map, selectedId, stations]);

  return null;
}

function markerIcon(color: string, active: boolean) {
  const size = active ? 18 : 14;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:2px solid var(--color-ev-surface,#fff);box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
  });
}

function StationMarker({
  station,
  active,
  onTap,
}: {
  station: ChargingStation;
  active: boolean;
  onTap: () => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const color = stationMarkerColor(station);

  useEffect(() => {
    if (!active) return;
    const marker = markerRef.current;
    if (!marker) return;
    const t = window.setTimeout(() => marker.openPopup(), 350);
    return () => window.clearTimeout(t);
  }, [active]);

  return (
    <Marker
      ref={markerRef}
      position={[station.lat, station.lng]}
      icon={markerIcon(color, active)}
      zIndexOffset={active ? 1000 : 0}
      eventHandlers={{ click: onTap }}
    >
      <Popup>
        <div className="text-sm font-bold">{station.name}</div>
        <div className="text-xs text-ev-muted">{station.address}</div>
        <div className="mt-1 text-xs">
          {station.maxPowerKw} kW · {station.distanceKm.toFixed(1)} km
        </div>
      </Popup>
    </Marker>
  );
}

export function ChargingMapView({
  stations,
  centerLat,
  centerLng,
  selectedId,
  onStationTap,
  scrollWheelZoom = true,
  className,
}: Props) {
  const { theme } = useTheme();
  const tiles = theme === 'dark' ? DARK_TILES : LIGHT_TILES;
  const fallback: [number, number] =
    centerLat != null && centerLng != null
      ? [centerLat, centerLng]
      : stations[0]
        ? [stations[0].lat, stations[0].lng]
        : [39.0, 35.0];

  return (
    <div
      className={
        className ??
        'relative z-0 h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-ev-border isolate'
      }
    >
      <MapContainer
        center={fallback}
        zoom={centerLat != null ? 12 : 6}
        className="h-full w-full !z-0"
        scrollWheelZoom={scrollWheelZoom}
      >
        <TileLayer
          key={theme}
          attribution={tiles.attribution}
          url={tiles.url}
        />
        <FitBounds
          stations={stations}
          centerLat={centerLat}
          centerLng={centerLng}
        />
        <FocusSelected selectedId={selectedId} stations={stations} />
        {centerLat != null && centerLng != null ? (
          <CircleMarker
            center={[centerLat, centerLng]}
            radius={8}
            pathOptions={{
              color: theme === 'dark' ? '#94a3b8' : '#fff',
              weight: 2,
              fillColor: '#378ADD',
              fillOpacity: 1,
            }}
          >
            <Popup>Arama merkezi</Popup>
          </CircleMarker>
        ) : null}
        {stations.map((s) => (
          <StationMarker
            key={s.ocmId}
            station={s}
            active={selectedId === s.ocmId}
            onTap={() => onStationTap(s)}
          />
        ))}
      </MapContainer>
    </div>
  );
}
