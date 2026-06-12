/// Open Charge Map’ten (proxy üzerinden) gelen sadeleştirilmiş istasyon.
class ChargingStation {
  final int ocmId;
  final String name;
  final String address;
  final double distanceKm;
  final double lat;
  final double lng;
  final int maxPowerKw;
  final List<String> connectorLabels;

  const ChargingStation({
    required this.ocmId,
    required this.name,
    required this.address,
    required this.distanceKm,
    required this.lat,
    required this.lng,
    required this.maxPowerKw,
    required this.connectorLabels,
  });

  factory ChargingStation.fromMap(Map<String, dynamic> m) {
    final conns = m['connectorLabels'];
    return ChargingStation(
      ocmId: (m['ocmId'] as num).toInt(),
      name: m['name'] as String? ?? 'İstasyon',
      address: m['address'] as String? ?? '',
      distanceKm: (m['distanceKm'] as num?)?.toDouble() ?? 0,
      lat: (m['lat'] as num).toDouble(),
      lng: (m['lng'] as num).toDouble(),
      maxPowerKw: (m['maxPowerKw'] as num?)?.toInt() ?? 0,
      connectorLabels: conns is List
          ? conns.map((e) => e.toString()).toList()
          : <String>[],
    );
  }
}
