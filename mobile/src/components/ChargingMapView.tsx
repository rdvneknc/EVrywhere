import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation, stationMarkerColor } from '../data/charging';
import { EVColors } from '../theme/colors';

type Props = {
  stations: ChargingStation[];
  centerLat: number | null;
  centerLng: number | null;
  onStationTap: (station: ChargingStation) => void;
};

export function ChargingMapView({
  stations,
  centerLat,
  centerLng,
  onStationTap,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const ready = centerLat != null || stations.length > 0;

  const initial = useMemo(() => {
    if (centerLat != null && centerLng != null) {
      return {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };
    }
    if (stations[0]) {
      return {
        latitude: stations[0].lat,
        longitude: stations[0].lng,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };
    }
    return {
      latitude: 39,
      longitude: 35,
      latitudeDelta: 8,
      longitudeDelta: 8,
    };
  }, [centerLat, centerLng, stations]);

  useEffect(() => {
    if (!mapRef.current || !ready) return;
    const coords = [
      ...(centerLat != null && centerLng != null
        ? [{ latitude: centerLat, longitude: centerLng }]
        : []),
      ...stations.map((s) => ({ latitude: s.lat, longitude: s.lng })),
    ];
    if (coords.length === 0) return;
    if (coords.length === 1) {
      mapRef.current.animateToRegion(
        {
          ...coords[0],
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        350,
      );
      return;
    }
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, [stations, centerLat, centerLng, ready]);

  return (
    <View style={styles.wrap}>
      {!ready ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Konum alınıyor…</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          initialRegion={initial}
          rotateEnabled={false}
        >
          {centerLat != null && centerLng != null ? (
            <Marker
              coordinate={{ latitude: centerLat, longitude: centerLng }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.userDot} />
            </Marker>
          ) : null}
          {stations.map((s) => {
            const color = stationMarkerColor(s);
            return (
              <Marker
                key={s.ocmId}
                coordinate={{ latitude: s.lat, longitude: s.lng }}
                onPress={() => onStationTap(s)}
                tracksViewChanges={Platform.OS === 'android'}
              >
                <View style={styles.markerCol}>
                  <View style={[styles.marker, { backgroundColor: color }]}>
                    <Ionicons name="flash" size={14} color="#fff" />
                  </View>
                  <View style={[styles.tail, { borderTopColor: color }]} />
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}
      <View style={styles.osmBadge}>
        <Text style={styles.osmText}>© OpenStreetMap / Maps</Text>
      </View>
      {stations.length > 0 ? (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{stations.length} nokta</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 16,
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: EVColors.border,
    overflow: 'hidden',
    backgroundColor: '#EDF7F0',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: EVColors.textSecondary,
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: EVColors.acBlue,
    borderWidth: 3,
    borderColor: '#fff',
  },
  markerCol: { alignItems: 'center' },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  osmBadge: {
    position: 'absolute',
    left: 10,
    bottom: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  osmText: { fontSize: 9, color: EVColors.textSecondary },
  countBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
});
