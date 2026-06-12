import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import 'charging_models.dart';

/// OpenStreetMap karoları — ek API anahtarı gerekmez.
class ChargingMapView extends StatefulWidget {
  const ChargingMapView({
    super.key,
    required this.stations,
    required this.centerLat,
    required this.centerLng,
    required this.onStationTap,
  });

  final List<ChargingStation> stations;
  final double? centerLat;
  final double? centerLng;
  final ValueChanged<ChargingStation> onStationTap;

  @override
  State<ChargingMapView> createState() => _ChargingMapViewState();
}

class _ChargingMapViewState extends State<ChargingMapView> {
  static const _defaultCenter = LatLng(39.0, 35.0);
  static const _defaultZoom = 6.0;

  final MapController _controller = MapController();
  List<ChargingStation> _lastFitStations = const [];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant ChargingMapView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.stations != widget.stations ||
        oldWidget.centerLat != widget.centerLat ||
        oldWidget.centerLng != widget.centerLng) {
      _scheduleFit();
    }
  }

  void _scheduleFit() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _fitToStations();
    });
  }

  void _fitToStations() {
    if (widget.stations == _lastFitStations &&
        widget.centerLat == null &&
        widget.centerLng == null) {
      return;
    }
    _lastFitStations = widget.stations;

    final points = <LatLng>[];
    if (widget.centerLat != null && widget.centerLng != null) {
      points.add(LatLng(widget.centerLat!, widget.centerLng!));
    }
    for (final s in widget.stations) {
      points.add(LatLng(s.lat, s.lng));
    }
    if (points.isEmpty) {
      _controller.move(_defaultCenter, _defaultZoom);
      return;
    }
    if (points.length == 1) {
      _controller.move(points.first, 14);
      return;
    }
    final bounds = LatLngBounds.fromPoints(points);
    _controller.fitCamera(
      CameraFit.bounds(
        bounds: bounds,
        padding: const EdgeInsets.all(40),
      ),
    );
  }

  LatLng get _initialCenter {
    if (widget.centerLat != null && widget.centerLng != null) {
      return LatLng(widget.centerLat!, widget.centerLng!);
    }
    if (widget.stations.isNotEmpty) {
      final s = widget.stations.first;
      return LatLng(s.lat, s.lng);
    }
    return _defaultCenter;
  }

  @override
  Widget build(BuildContext context) {
    final ready = widget.centerLat != null || widget.stations.isNotEmpty;

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      height: 220,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFD4EBD9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (!ready)
              ColoredBox(
                color: const Color(0xFFEDF7F0),
                child: Center(
                  child: Text(
                    widget.stations.isEmpty ? 'Konum alınıyor…' : 'Harita',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF5A7264),
                    ),
                  ),
                ),
              )
            else
              FlutterMap(
                mapController: _controller,
                options: MapOptions(
                  initialCenter: _initialCenter,
                  initialZoom: widget.stations.length <= 1 ? 13 : 11,
                  interactionOptions: const InteractionOptions(
                    flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
                  ),
                  onMapReady: _scheduleFit,
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.example.evrywhere',
                  ),
                  if (widget.centerLat != null && widget.centerLng != null)
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: LatLng(widget.centerLat!, widget.centerLng!),
                          width: 28,
                          height: 28,
                          child: Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFF378ADD),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 6,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  MarkerLayer(
                    markers: [
                      for (final s in widget.stations)
                        Marker(
                          point: LatLng(s.lat, s.lng),
                          width: 40,
                          height: 40,
                          child: GestureDetector(
                            onTap: () => widget.onStationTap(s),
                            child: _StationMarker(station: s),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            Positioned(
              left: 10,
              bottom: 8,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  child: Text(
                    '© OpenStreetMap',
                    style: TextStyle(fontSize: 9, color: Color(0xFF5A7264)),
                  ),
                ),
              ),
            ),
            if (widget.stations.isNotEmpty)
              Positioned(
                right: 10,
                top: 10,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    child: Text(
                      '${widget.stations.length} nokta',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0D1B12),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StationMarker extends StatelessWidget {
  const _StationMarker({required this.station});

  final ChargingStation station;

  Color get _color {
    final labels = station.connectorLabels.map((e) => e.toUpperCase()).toList();
    if (labels.contains('HPC')) return const Color(0xFF7F77DD);
    if (labels.contains('DC')) return const Color(0xFFEF9F27);
    return const Color(0xFF2DC653);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: _color,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2.5),
            boxShadow: [
              BoxShadow(
                color: _color.withValues(alpha: 0.45),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(
            Icons.ev_station_rounded,
            size: 16,
            color: Colors.white,
          ),
        ),
        CustomPaint(
          size: const Size(10, 6),
          painter: _PinTailPainter(_color),
        ),
      ],
    );
  }
}

class _PinTailPainter extends CustomPainter {
  _PinTailPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final path = ui.Path()
      ..moveTo(size.width / 2, size.height)
      ..lineTo(0, 0)
      ..lineTo(size.width, 0)
      ..close();
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _PinTailPainter old) => old.color != color;
}
