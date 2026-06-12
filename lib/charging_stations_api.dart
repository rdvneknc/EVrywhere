import 'dart:convert';

import 'package:http/http.dart' as http;

import 'charging_api_config.dart';
import 'charging_models.dart';

/// [ChargingApiConfig] ile verilen herhangi bir HTTPS (veya geliştirmede HTTP) uca istek.
/// Ağ sözleşmesi, repo kökünde `ocm_api/README.md` ve `ocm_api/server.js` ile aynı.
class ChargingStationsApi {
  static Map<String, String> get _headers {
    return {
      'Content-Type': 'application/json; charset=utf-8',
      if (ChargingApiConfig.serverSecret.isNotEmpty)
        'X-EV-Charging-Key': ChargingApiConfig.serverSecret,
    };
  }

  static Uri _u(String path) {
    var base = ChargingApiConfig.baseUrl.trim();
    if (base.endsWith('/')) {
      base = base.substring(0, base.length - 1);
    }
    return Uri.parse('$base$path');
  }

  static void _ensureReady() {
    final err = ChargingApiConfig.configurationError;
    if (err != null) throw StateError(err);
  }

  static Future<List<ChargingStation>> getStations({
    required double lat,
    required double lng,
    double distanceKm = 25,
    int maxResults = 50,
  }) async {
    _ensureReady();
    final res = await http
        .post(
          _u('/getChargingStations'),
          headers: _headers,
          body: jsonEncode({
            'lat': lat,
            'lng': lng,
            'distanceKm': distanceKm,
            'maxResults': maxResults,
          }),
        )
        .timeout(const Duration(seconds: 45));
    _throwIfHttpError(res, 'getChargingStations');
    final data = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    final raw = data['stations'];
    if (raw is! List) return [];
    return raw
        .map((e) => ChargingStation.fromMap(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  static Future<GeocodeResult> geocodeCity(String query) async {
    _ensureReady();
    final res = await http
        .post(
          _u('/geocodeCity'),
          headers: _headers,
          body: jsonEncode({'query': query}),
        )
        .timeout(const Duration(seconds: 30));
    _throwIfHttpError(res, 'geocodeCity');
    final d = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return GeocodeResult(
      lat: (d['lat'] as num).toDouble(),
      lng: (d['lng'] as num).toDouble(),
      displayName: d['displayName'] as String? ?? query,
    );
  }

  static void _throwIfHttpError(http.Response res, String name) {
    if (res.statusCode >= 200 && res.statusCode < 300) return;
    String msg;
    try {
      final b = jsonDecode(utf8.decode(res.bodyBytes));
      if (b is Map && b['error'] is String) {
        msg = b['error'] as String;
      } else {
        msg = res.body;
      }
    } catch (_) {
      msg = res.body;
    }
    throw StateError('Şarj API $name: HTTP ${res.statusCode} $msg');
  }
}

class GeocodeResult {
  final double lat, lng;
  final String displayName;
  GeocodeResult({
    required this.lat,
    required this.lng,
    required this.displayName,
  });
}
