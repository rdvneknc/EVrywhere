import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';

import 'charging_map_view.dart';
import 'charging_models.dart';
import 'charging_stations_api.dart';

// ─────────────────────────────────────────────
//  COLORS
// ─────────────────────────────────────────────
class EVColors {
  EVColors._();
  static const Color primary = Color(0xFF2DC653);
  static const Color primaryLight = Color(0xFFE8F9ED);
  static const Color primaryMid = Color(0xFFB6EFC5);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF6FBF7);
  static const Color textPrimary = Color(0xFF0D1B12);
  static const Color textSecondary = Color(0xFF5A7264);
  static const Color textHint = Color(0xFFADC4B4);
  static const Color border = Color(0xFFD4EBD9);
  static const Color divider = Color(0xFFE8F2EA);
  static const Color acBlue = Color(0xFF378ADD);
  static const Color dcAmber = Color(0xFFEF9F27);
  static const Color hpcPurple = Color(0xFF7F77DD);
}

// ─────────────────────────────────────────────
//  CHARGING SCREEN (Open Charge Map — proxy)
// ─────────────────────────────────────────────
class ChargingScreen extends StatefulWidget {
  const ChargingScreen({super.key});

  @override
  State<ChargingScreen> createState() => _ChargingScreenState();
}

class _ChargingScreenState extends State<ChargingScreen> {
  final _cityCtrl = TextEditingController();
  Timer? _debounce;

  List<ChargingStation> _stations = [];
  bool _loading = true;
  String? _error;

  double? _refLat;
  double? _refLng;
  String _locationLabel = '…';
  double _distanceKm = 25;

  String _filter = 'All';
  static const _filters = ['All', 'AC', 'DC', 'HPC'];
  static const _radiusOptions = [5.0, 10.0, 15.0, 25.0, 50.0, 100.0];

  @override
  void initState() {
    super.initState();
    _bootstrapLocation();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _cityCtrl.dispose();
    super.dispose();
  }

  Future<void> _bootstrapLocation() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        setState(() {
          _loading = false;
          _locationLabel = 'Şehir ara';
          _error =
              'Konum izni yok. Aşağıdan şehir yazarak arayabilirsin.';
        });
        return;
      }

      final pos = await Geolocator.getCurrentPosition();
      setState(() {
        _refLat = pos.latitude;
        _refLng = pos.longitude;
        _locationLabel = 'Konumun';
      });
      await _loadStations();
    } catch (e) {
      setState(() {
        _loading = false;
        _error = 'Konum alınamadı: $e';
        _locationLabel = 'Şehir ara';
      });
    }
  }

  void _scheduleReload() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), _loadStations);
  }

  Future<void> _loadStations() async {
    if (_refLat == null || _refLng == null) {
      setState(() => _loading = false);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      var list = await ChargingStationsApi.getStations(
        lat: _refLat!,
        lng: _refLng!,
        distanceKm: _distanceKm,
        maxResults: 80,
      );
      list = List<ChargingStation>.from(list)
        ..sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
      if (!mounted) return;
      setState(() {
        _stations = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
        _stations = [];
      });
    }
  }

  Future<void> _onCitySearch() async {
    final q = _cityCtrl.text.trim();
    if (q.length < 2) {
      HapticFeedback.lightImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('En az 2 harf gir.')),
      );
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    try {
      final g = await ChargingStationsApi.geocodeCity(q);
      if (!mounted) return;
      setState(() {
        _refLat = g.lat;
        _refLng = g.lng;
        _locationLabel = g.displayName;
      });
      await _loadStations();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Adres bulunamadı: $e')),
        );
      });
    }
  }

  List<ChargingStation> get _filtered {
    if (_filter == 'All') return _stations;
    return _stations.where((s) {
      final u = s.connectorLabels.map((c) => c.toUpperCase()).toList();
      if (_filter == 'HPC') return u.any((c) => c == 'HPC');
      if (_filter == 'AC') return u.contains('AC');
      if (_filter == 'DC') {
        return u.contains('DC') || u.contains('HPC');
      }
      return true;
    }).toList();
  }

  void _showDetail(ChargingStation s) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _StationDetailSheet(station: s),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return Scaffold(
      backgroundColor: EVColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          _ChargingAppBar(
            locationLabel: _locationLabel,
            cityController: _cityCtrl,
            onSearch: _onCitySearch,
            onGps: _bootstrapLocation,
          ),
          SliverToBoxAdapter(
            child: _SearchRadiusRow(
              distanceKm: _distanceKm,
              options: _radiusOptions,
              onChanged: (v) {
                setState(() => _distanceKm = v);
                _scheduleReload();
              },
            ),
          ),
          SliverToBoxAdapter(
            child: ChargingMapView(
              stations: filtered,
              centerLat: _refLat,
              centerLng: _refLng,
              onStationTap: _showDetail,
            ),
          ),
          SliverToBoxAdapter(child: _StatsRow(stations: _stations, distanceKm: _distanceKm)),
          if (_error != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: Text(
                  _error!,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFFC0392B),
                    height: 1.3,
                  ),
                ),
              ),
            ),
          SliverToBoxAdapter(
            child: _FilterChips(
              filters: _filters,
              active: _filter,
              onChanged: (f) => setState(() => _filter = f),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${_loading ? "…" : "${filtered.length}"} İstasyon',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: EVColors.textPrimary,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const Text(
                    'Uzaklığa göre',
                    style: TextStyle(
                      fontSize: 12,
                      color: EVColors.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_loading && _stations.isEmpty)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(child: CircularProgressIndicator(color: EVColors.primary)),
            )
          else if (!_loading && filtered.isEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Center(
                  child: Text(
                    _refLat == null
                        ? 'Konum yok. Şehir arayın veya izin verin.'
                        : 'Bu filtrede / yarıçapta sonuç yok.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: EVColors.textHint, fontSize: 14),
                  ),
                ),
              ),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, i) => _StationCard(
                  station: filtered[i],
                  onTap: () => _showDetail(filtered[i]),
                ),
                childCount: filtered.length,
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }
}

// ─── App bar ─────────────────────────────────
class _ChargingAppBar extends StatelessWidget {
  final String locationLabel;
  final TextEditingController cityController;
  final VoidCallback onSearch;
  final Future<void> Function() onGps;

  const _ChargingAppBar({
    required this.locationLabel,
    required this.cityController,
    required this.onSearch,
    required this.onGps,
  });

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 56, 20, 0),
      sliver: SliverToBoxAdapter(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Şarj İstasyonları',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: EVColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () async {
                    HapticFeedback.lightImpact();
                    await onGps();
                  },
                  icon: const Icon(Icons.my_location_rounded, color: EVColors.primary),
                  tooltip: 'Konumumu kullan',
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Kaynak: Open Charge Map',
              style: TextStyle(
                fontSize: 11,
                color: EVColors.textHint.withValues(alpha: 0.9),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: cityController,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => onSearch(),
                    decoration: InputDecoration(
                      isDense: true,
                      hintText: 'Şehir veya ilçe (ör. Kadıköy, İzmir)',
                      hintStyle: const TextStyle(fontSize: 13, color: EVColors.textHint),
                      filled: true,
                      fillColor: EVColors.surface,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: EVColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: EVColors.border),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: onSearch,
                  style: FilledButton.styleFrom(
                    backgroundColor: EVColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text('Ara', style: TextStyle(fontSize: 13)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Merkez: $locationLabel',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                color: EVColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Yarıçap ────────────────────────────────
class _SearchRadiusRow extends StatelessWidget {
  final double distanceKm;
  final List<double> options;
  final ValueChanged<double> onChanged;

  const _SearchRadiusRow({
    required this.distanceKm,
    required this.options,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Yarıçap: ${distanceKm == distanceKm.roundToDouble() ? distanceKm.toInt() : distanceKm} km',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: EVColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: options.map((km) {
                final active = (distanceKm - km).abs() < 0.1;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Material(
                    color: active ? EVColors.primary : EVColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        onChanged(km);
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: active ? EVColors.primary : EVColors.border,
                          ),
                        ),
                        child: Text(
                          '${km == km.roundToDouble() ? km.toInt() : km} km',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: active ? EVColors.onPrimary : EVColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Stats ───────────────────────────────────
class _StatsRow extends StatelessWidget {
  final List<ChargingStation> stations;
  final double distanceKm;

  const _StatsRow({required this.stations, required this.distanceKm});

  @override
  Widget build(BuildContext context) {
    if (stations.isEmpty) {
      return const SizedBox.shrink();
    }
    final maxP = stations.map((e) => e.maxPowerKw).reduce((a, b) => a > b ? a : b);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          _StatPill(
            icon: Icons.ev_station_rounded,
            label: '${stations.length} nokta',
            bg: EVColors.primaryLight,
            fg: EVColors.primary,
          ),
          const SizedBox(width: 8),
          _StatPill(
            icon: Icons.bolt_rounded,
            label: 'Max $maxP kW',
            bg: const Color(0xFFFFF3E0),
            fg: const Color(0xFFBF6D00),
          ),
          const SizedBox(width: 8),
          _StatPill(
            icon: Icons.radar_rounded,
            label: '${distanceKm == distanceKm.roundToDouble() ? distanceKm.toInt() : distanceKm} km',
            bg: const Color(0xFFE8F3FC),
            fg: const Color(0xFF185FA5),
          ),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color bg, fg;
  const _StatPill({
    required this.icon, required this.label, required this.bg, required this.fg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: fg.withValues(alpha: 0.20)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: fg),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: fg),
          ),
        ],
      ),
    );
  }
}

// ─── Filters ─────────────────────────────────
class _FilterChips extends StatelessWidget {
  final List<String> filters;
  final String active;
  final ValueChanged<String> onChanged;

  const _FilterChips({
    required this.filters, required this.active, required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        separatorBuilder: (context, _) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final f = filters[i];
          final isActive = f == active;
          return GestureDetector(
            onTap: () => onChanged(f),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                color: isActive ? EVColors.primary : EVColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isActive ? EVColors.primary : EVColors.border,
                ),
              ),
              child: Text(
                f,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isActive ? EVColors.onPrimary : EVColors.textSecondary,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─── Card ───────────────────────────────────
class _StationCard extends StatelessWidget {
  final ChargingStation station;
  final VoidCallback onTap;

  const _StationCard({required this.station, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: EVColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12, offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: EVColors.primaryLight,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.ev_station_rounded,
                      color: EVColors.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          station.name,
                          style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w700,
                            color: EVColors.textPrimary, letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          station.address,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12, color: EVColors.textHint,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${station.distanceKm} km',
                    style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w700,
                      color: EVColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: EVColors.divider),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
              child: Row(
                children: [
                  ..._connectorChips(station.connectorLabels),
                  const SizedBox(width: 8),
                  _InfoChip(
                    icon: Icons.bolt_rounded,
                    label: '${station.maxPowerKw} kW',
                    color: EVColors.dcAmber,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _connectorChips(List<String> connectors) {
    final colors = {
      'AC': EVColors.acBlue,
      'DC': EVColors.dcAmber,
      'HPC': EVColors.hpcPurple,
    };
    return connectors.map((c) {
      final color = colors[c] ?? EVColors.textHint;
      return Container(
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withValues(alpha: 0.30)),
        ),
        child: Text(
          c,
          style: TextStyle(
            fontSize: 10, fontWeight: FontWeight.w700, color: color,
          ),
        ),
      );
    }).toList();
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _InfoChip({
    required this.icon, required this.label, required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: 10, fontWeight: FontWeight.w600, color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══ Detail (lokal puan / yorum, sunucu yok) ═══
class _Comment {
  final String initials, text, time;
  final Color color;
  _Comment({required this.initials, required this.text, required this.time, required this.color});
}

class _StationDetailSheet extends StatefulWidget {
  final ChargingStation station;
  const _StationDetailSheet({required this.station});

  @override
  State<_StationDetailSheet> createState() => _StationDetailSheetState();
}

class _StationDetailSheetState extends State<_StationDetailSheet> {
  final List<_Comment> _comments = [];
  bool _ratingDone = false;

  void _showRate() {
    double selected = 4;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('Puan ver'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) {
                  return IconButton(
                    onPressed: () => setS(() => selected = i + 1.0),
                    icon: Icon(
                      Icons.star_rounded,
                      size: 32,
                      color: i < selected
                          ? const Color(0xFFFFB800)
                          : EVColors.divider,
                    ),
                  );
                }),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('İptal'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                setState(() => _ratingDone = true);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Teşekkürler (cihazda, sunucu yok)')),
                );
              },
              child: const Text('Gönder'),
            ),
          ],
        ),
      ),
    );
  }

  void _showComment() {
    final c = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: EVColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Yorum', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            TextField(
              controller: c,
              maxLines: 3,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: '…',
              ),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () {
                if (c.text.trim().isEmpty) return;
                setState(() {
                  _comments.insert(
                    0,
                    _Comment(
                      initials: 'S',
                      text: c.text.trim(),
                      time: 'Şimdi',
                      color: EVColors.primary,
                    ),
                  );
                });
                Navigator.pop(ctx);
              },
              child: const Text('Ekle (yerel)'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.station;
    return DraggableScrollableSheet(
      initialChildSize: 0.5,
      maxChildSize: 0.9,
      minChildSize: 0.35,
      builder: (_, sc) => Container(
        decoration: const BoxDecoration(
          color: EVColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: ListView(
          controller: sc,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color: EVColors.textHint.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              s.name,
              style: const TextStyle(
                fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.2,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              s.address,
              style: const TextStyle(fontSize: 12, color: EVColors.textHint),
            ),
            const SizedBox(height: 8),
            Text(
              'OCM #${s.ocmId} · ${s.distanceKm} km',
              style: const TextStyle(fontSize: 11, color: EVColors.textSecondary),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _showRate,
                    icon: Icon(
                      _ratingDone ? Icons.check_rounded : Icons.star_outline,
                    ),
                    label: Text(_ratingDone ? 'Puanlandı' : 'Puan ver'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _showComment,
                    icon: const Icon(Icons.chat_bubble_outline, size: 18),
                    label: const Text('Yorum'),
                    style: FilledButton.styleFrom(
                      backgroundColor: EVColors.primary,
                    ),
                  ),
                ),
              ],
            ),
            const Divider(height: 28),
            Text(
              'Yorumlar (yalnızca bu oturum, ${_comments.length})',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            if (_comments.isEmpty)
              const Text(
                'Yorum sunucuda tutulmuyor.',
                style: TextStyle(color: EVColors.textHint, fontSize: 12),
              )
            else
              ..._comments.map(
                (c) => ListTile(
                  leading: CircleAvatar(
                    child: Text(c.initials, style: const TextStyle(fontSize: 10)),
                  ),
                  title: Text(c.text, style: const TextStyle(fontSize: 13)),
                  subtitle: Text(c.time, style: const TextStyle(fontSize: 11)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
