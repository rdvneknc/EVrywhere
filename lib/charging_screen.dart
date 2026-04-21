import 'package:flutter/material.dart';
import 'post_store.dart';
import 'package:flutter/services.dart';

// ─────────────────────────────────────────────
//  COLORS
// ─────────────────────────────────────────────
class EVColors {
  EVColors._();
  static const Color primary       = Color(0xFF2DC653);
  static const Color primaryLight  = Color(0xFFE8F9ED);
  static const Color primaryMid    = Color(0xFFB6EFC5);
  static const Color onPrimary     = Color(0xFFFFFFFF);
  static const Color surface       = Color(0xFFFFFFFF);
  static const Color background    = Color(0xFFF6FBF7);
  static const Color textPrimary   = Color(0xFF0D1B12);
  static const Color textSecondary = Color(0xFF5A7264);
  static const Color textHint      = Color(0xFFADC4B4);
  static const Color border        = Color(0xFFD4EBD9);
  static const Color divider       = Color(0xFFE8F2EA);
  static const Color acBlue        = Color(0xFF378ADD);
  static const Color dcAmber       = Color(0xFFEF9F27);
  static const Color hpcPurple     = Color(0xFF7F77DD);
}

// ─────────────────────────────────────────────
//  MODEL
// ─────────────────────────────────────────────
class ChargingStation {
  final String id;
  final String name;
  final String address;
  final double distance;
  final int power;
  double rating;
  int reviewCount;
  final List<String> connectors;
  List<String> checkIns;
  List<_Comment> comments;
  final double lat, lng; // mock coordinates
  final bool isAvailable;

  ChargingStation({
    required this.id,
    required this.name,
    required this.address,
    required this.distance,
    required this.power,
    required this.rating,
    required this.reviewCount,
    required this.connectors,
    required this.checkIns,
    required this.comments,
    required this.lat,
    required this.lng,
    this.isAvailable = true,
  });
}

class _Comment {
  final String initials;
  final Color color;
  final String text;
  final String time;
  _Comment({
    required this.initials,
    required this.color,
    required this.text,
    required this.time,
  });
}

// ─────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────
List<ChargingStation> buildStations() => [
  ChargingStation(
    id: '1',
    name: 'ZES — Mersin Marina',
    address: 'Mezitli, Mersin',
    distance: 0.8,
    power: 150,
    rating: 4.7,
    reviewCount: 134,
    connectors: ['DC', 'HPC'],
    checkIns: ['AM', 'SC', 'PN'],
    comments: [
      _Comment(initials: 'AM', color: Color(0xFF2DC653),
          text: 'Süper hızlı, 20 dakikada %80 oldu!', time: '2s önce'),
      _Comment(initials: 'SC', color: Color(0xFF378ADD),
          text: 'Temiz ve bakımlı istasyon.', time: '1h önce'),
    ],
    lat: 36.79, lng: 34.64,
    isAvailable: true,
  ),
  ChargingStation(
    id: '2',
    name: 'Togg HızlıŞarj — AVM',
    address: 'Çukurova, Adana',
    distance: 2.3,
    power: 120,
    rating: 4.5,
    reviewCount: 89,
    connectors: ['AC', 'DC'],
    checkIns: ['JL', 'MW'],
    comments: [
      _Comment(initials: 'JL', color: Color(0xFF7F77DD),
          text: 'AVM içinde olduğu için çok pratik.', time: '3h önce'),
    ],
    lat: 37.00, lng: 35.32,
    isAvailable: true,
  ),
  ChargingStation(
    id: '3',
    name: 'Supercharger V4 — Otogar',
    address: 'Yenişehir, Mersin',
    distance: 3.1,
    power: 250,
    rating: 4.9,
    reviewCount: 312,
    connectors: ['HPC'],
    checkIns: ['SR', 'AM', 'PN', 'TK'],
    comments: [
      _Comment(initials: 'SR', color: Color(0xFFD4537E),
          text: 'En hızlı şarj deneyimi! V4 muhteşem.', time: '5h önce'),
      _Comment(initials: 'TK', color: Color(0xFFEF9F27),
          text: '8 stall var, hiç bekleme olmadı.', time: '1g önce'),
    ],
    lat: 36.81, lng: 34.62,
    isAvailable: true,
  ),
  ChargingStation(
    id: '4',
    name: 'Eşarj — Migros',
    address: 'Mezitli, Mersin',
    distance: 4.7,
    power: 22,
    rating: 3.8,
    reviewCount: 45,
    connectors: ['AC'],
    checkIns: ['BK'],
    comments: [],
    lat: 36.78, lng: 34.67,
    isAvailable: false,
  ),
  ChargingStation(
    id: '5',
    name: 'Shell Recharge — D400',
    address: 'Tarsus, Mersin',
    distance: 12.4,
    power: 180,
    rating: 4.3,
    reviewCount: 78,
    connectors: ['DC', 'HPC'],
    checkIns: ['MW', 'SC'],
    comments: [
      _Comment(initials: 'MW', color: Color(0xFFEF9F27),
          text: 'Otoyol kenarı, uzun yolculuklar için ideal.', time: '2g önce'),
    ],
    lat: 36.92, lng: 34.89,
    isAvailable: true,
  ),
  ChargingStation(
    id: '6',
    name: 'BP Pulse — Limanı',
    address: 'Akdeniz, Mersin',
    distance: 5.2,
    power: 100,
    rating: 4.1,
    reviewCount: 56,
    connectors: ['AC', 'DC'],
    checkIns: ['PN', 'AM'],
    comments: [],
    lat: 36.80, lng: 34.63,
    isAvailable: true,
  ),
];

// ─────────────────────────────────────────────
//  CHARGING SCREEN
// ─────────────────────────────────────────────
class ChargingScreen extends StatefulWidget {
  const ChargingScreen({super.key});

  @override
  State<ChargingScreen> createState() => _ChargingScreenState();
}

class _ChargingScreenState extends State<ChargingScreen> {
  late List<ChargingStation> _stations;
  String _filter = 'All';
  static const _filters = ['All', 'AC', 'DC', 'HPC', 'Available'];

  @override
  void initState() {
    super.initState();
    _stations = buildStations();
  }

  List<ChargingStation> get _filtered {
    if (_filter == 'All') return _stations;
    if (_filter == 'Available') {
      return _stations.where((s) => s.isAvailable).toList();
    }
    return _stations
        .where((s) => s.connectors.contains(_filter))
        .toList();
  }

  void _onCheckin(ChargingStation station) {
  setState(() => station.checkIns.add('Me'));
  HapticFeedback.heavyImpact();

  PostStore.instance.addPost(EVPost(
    id: PostStore.instance.generateId(),
    type: PostType.checkin,
    stationName: station.name,
    stationPower: station.power,
    connectorType: station.connectors.first,
    rating: station.rating,
    caption: '${station.name} istasyonunda şarj ettim ⚡',
    gradient: const [Color(0xFF0D3B1F), Color(0xFF2DC653)],
    emoji: '⚡',
    createdAt: DateTime.now(),
    likesCount: 0,
  ));

  ScaffoldMessenger.of(context).showSnackBar(_snack('Check-in yapıldı ⚡'));
}

  void _onRate(ChargingStation station, double rating) {
    setState(() {
      final total = station.rating * station.reviewCount + rating;
      station.reviewCount++;
      station.rating = total / station.reviewCount;
    });
    ScaffoldMessenger.of(context)
        .showSnackBar(_snack('Puan verildi ⭐ ${rating.toInt()}'));
  }

  void _onComment(ChargingStation station, String text) {
    if (text.trim().isEmpty) return;
    setState(() {
      station.comments.insert(
        0,
        _Comment(
          initials: 'Me',
          color: EVColors.primary,
          text: text.trim(),
          time: 'Şimdi',
        ),
      );
    });
    ScaffoldMessenger.of(context)
        .showSnackBar(_snack('Yorum eklendi 💬'));
  }

  SnackBar _snack(String msg) => SnackBar(
        content: Text(msg,
            style: const TextStyle(
                fontWeight: FontWeight.w600, fontSize: 13)),
        backgroundColor: EVColors.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 2),
      );

  void _showDetail(ChargingStation station) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _StationDetailSheet(
        station: station,
        onCheckin: () => _onCheckin(station),
        onRate: (r) => _onRate(station, r),
        onComment: (t) => _onComment(station, t),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EVColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── App bar ────────────────────────────
          _ChargingAppBar(),

          // ── Map placeholder ────────────────────
          SliverToBoxAdapter(
            child: _MapPlaceholder(
              stations: _stations,
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                _snack('🗺 Harita yakında geliyor!'),
              ),
            ),
          ),

          // ── Stats row ──────────────────────────
          SliverToBoxAdapter(child: _StatsRow(stations: _stations)),

          // ── Filter chips ───────────────────────
          SliverToBoxAdapter(
            child: _FilterChips(
              filters: _filters,
              active: _filter,
              onChanged: (f) => setState(() => _filter = f),
            ),
          ),

          // ── Section label ──────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${_filtered.length} İstasyon',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: EVColors.textPrimary,
                        letterSpacing: -0.3,
                      )),
                  const Text('Yakına göre sırala',
                      style: TextStyle(
                        fontSize: 12,
                        color: EVColors.primary,
                        fontWeight: FontWeight.w500,
                      )),
                ],
              ),
            ),
          ),

          // ── Station list ───────────────────────
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) => _StationCard(
                station: _filtered[i],
                onTap: () => _showDetail(_filtered[i]),
              ),
              childCount: _filtered.length,
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  APP BAR
// ─────────────────────────────────────────────
class _ChargingAppBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 56, 20, 0),
      sliver: SliverToBoxAdapter(
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('Yakınımdaki', style: TextStyle(
                    fontSize: 13, color: EVColors.textHint,
                  )),
                  SizedBox(height: 2),
                  Text('Şarj İstasyonları', style: TextStyle(
                    fontSize: 24, fontWeight: FontWeight.w800,
                    color: EVColors.textPrimary, letterSpacing: -0.5,
                  )),
                ],
              ),
            ),
            // Location badge
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: EVColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: EVColors.primaryMid),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.location_on_rounded,
                      color: EVColors.primary, size: 14),
                  SizedBox(width: 4),
                  Text('Mersin', style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600,
                    color: EVColors.primary,
                  )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  MAP PLACEHOLDER
// ─────────────────────────────────────────────
class _MapPlaceholder extends StatelessWidget {
  final List<ChargingStation> stations;
  final VoidCallback onTap;

  const _MapPlaceholder({required this.stations, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        height: 180,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: EVColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12, offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Grid background (map feel)
              CustomPaint(painter: _MapGridPainter()),

              // Mock pins
              ..._mockPins(),

              // Center overlay
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.map_rounded,
                          color: EVColors.primary, size: 16),
                      SizedBox(width: 6),
                      Text('Haritayı Görüntüle',
                          style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700,
                            color: EVColors.textPrimary,
                          )),
                      SizedBox(width: 4),
                      Text('(Yakında)',
                          style: TextStyle(
                            fontSize: 11, color: EVColors.textHint,
                          )),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _mockPins() {
    final positions = [
      [0.15, 0.3], [0.45, 0.5], [0.7, 0.25],
      [0.3, 0.7], [0.8, 0.65],
    ];
    return List.generate(positions.length, (i) {
      final available = i < 4;
      return Positioned(
        left: positions[i][0] * 300,
        top: positions[i][1] * 160,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: available ? EVColors.primary : EVColors.textHint,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: (available ? EVColors.primary : EVColors.textHint)
                        .withValues(alpha: 0.3),
                    blurRadius: 8, offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(Icons.ev_station_rounded,
                  color: Colors.white, size: 14),
            ),
            Container(
              width: 6, height: 6,
              decoration: BoxDecoration(
                color: available ? EVColors.primary : EVColors.textHint,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      );
    });
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Background
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = const Color(0xFFEDF7F0),
    );

    // Grid lines
    final paint = Paint()
      ..color = const Color(0xFFD4EBD9)
      ..strokeWidth = 0.8;

    for (double x = 0; x < size.width; x += 30) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += 30) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Road lines
    final road = Paint()
      ..color = Colors.white
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(
        Offset(0, size.height * 0.45),
        Offset(size.width, size.height * 0.55), road);
    canvas.drawLine(
        Offset(size.width * 0.35, 0),
        Offset(size.width * 0.4, size.height), road);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

// ─────────────────────────────────────────────
//  STATS ROW
// ─────────────────────────────────────────────
class _StatsRow extends StatelessWidget {
  final List<ChargingStation> stations;
  const _StatsRow({required this.stations});

  @override
  Widget build(BuildContext context) {
    final available = stations.where((s) => s.isAvailable).length;
    final totalPower = stations.fold<int>(0, (s, e) => s + e.power);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          _StatPill(
              icon: Icons.ev_station_rounded,
              label: '$available Aktif',
              bg: EVColors.primaryLight,
              fg: EVColors.primary),
          const SizedBox(width: 8),
          _StatPill(
              icon: Icons.bolt_rounded,
              label: 'Max ${stations.map((s) => s.power).reduce((a, b) => a > b ? a : b)} kW',
              bg: const Color(0xFFFFF3E0),
              fg: const Color(0xFFBF6D00)),
          const SizedBox(width: 8),
          _StatPill(
              icon: Icons.people_rounded,
              label: '${stations.fold<int>(0, (s, e) => s + e.checkIns.length)} Check-in',
              bg: const Color(0xFFE8F3FC),
              fg: const Color(0xFF185FA5)),
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
    required this.icon, required this.label,
    required this.bg, required this.fg,
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
          Text(label, style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w600, color: fg,
          )),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  FILTER CHIPS
// ─────────────────────────────────────────────
class _FilterChips extends StatelessWidget {
  final List<String> filters;
  final String active;
  final ValueChanged<String> onChanged;

  const _FilterChips({
    required this.filters,
    required this.active,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final f = filters[i];
          final isActive = f == active;
          return GestureDetector(
            onTap: () => onChanged(f),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                color: isActive ? EVColors.primary : EVColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isActive ? EVColors.primary : EVColors.border,
                ),
              ),
              child: Text(f, style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.w600,
                color: isActive
                    ? EVColors.onPrimary
                    : EVColors.textSecondary,
              )),
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  STATION CARD
// ─────────────────────────────────────────────
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
          border: Border.all(
            color: station.isAvailable
                ? EVColors.border
                : EVColors.textHint.withValues(alpha: 0.3),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12, offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            // ── Top row ──────────────────────────
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      color: station.isAvailable
                          ? EVColors.primaryLight
                          : EVColors.divider,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      Icons.ev_station_rounded,
                      color: station.isAvailable
                          ? EVColors.primary
                          : EVColors.textHint,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Name + address
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(station.name, style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w700,
                          color: EVColors.textPrimary, letterSpacing: -0.2,
                        )),
                        const SizedBox(height: 2),
                        Text(station.address, style: const TextStyle(
                          fontSize: 12, color: EVColors.textHint,
                        )),
                      ],
                    ),
                  ),

                  // Distance
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('${station.distance} km', style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w700,
                        color: EVColors.textPrimary,
                      )),
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: station.isAvailable
                              ? EVColors.primaryLight
                              : EVColors.divider,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          station.isAvailable ? 'Müsait' : 'Dolu',
                          style: TextStyle(
                            fontSize: 10, fontWeight: FontWeight.w600,
                            color: station.isAvailable
                                ? EVColors.primary
                                : EVColors.textHint,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ── Divider ───────────────────────────
            const Divider(height: 1, color: EVColors.divider),

            // ── Bottom row ────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
              child: Row(
                children: [
                  // Connectors
                  ..._connectorChips(station.connectors),

                  const SizedBox(width: 8),

                  // Power
                  _InfoChip(
                    icon: Icons.bolt_rounded,
                    label: '${station.power} kW',
                    color: EVColors.dcAmber,
                  ),

                  const Spacer(),

                  // Rating
                  Row(
                    children: [
                      const Icon(Icons.star_rounded,
                          color: Color(0xFFFFB800), size: 14),
                      const SizedBox(width: 3),
                      Text(station.rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w700,
                            color: EVColors.textPrimary,
                          )),
                      const SizedBox(width: 2),
                      Text('(${station.reviewCount})',
                          style: const TextStyle(
                            fontSize: 10, color: EVColors.textHint,
                          )),
                    ],
                  ),

                  const SizedBox(width: 10),

                  // Check-in avatars
                  _AvatarRow(initials: station.checkIns),
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
        child: Text(c, style: TextStyle(
          fontSize: 10, fontWeight: FontWeight.w700, color: color,
        )),
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
          Text(label, style: TextStyle(
            fontSize: 10, fontWeight: FontWeight.w600, color: color,
          )),
        ],
      ),
    );
  }
}

class _AvatarRow extends StatelessWidget {
  final List<String> initials;
  const _AvatarRow({required this.initials});

  static const _palette = [
    Color(0xFF2DC653), Color(0xFF378ADD),
    Color(0xFFEF9F27), Color(0xFF7F77DD), Color(0xFFD4537E),
  ];

  @override
  Widget build(BuildContext context) {
    final show = initials.take(3).toList();
    return SizedBox(
      width: show.length * 18.0 + 10,
      height: 24,
      child: Stack(
        children: List.generate(show.length, (i) {
          final color = _palette[show[i].codeUnitAt(0) % _palette.length];
          return Positioned(
            left: i * 16.0,
            child: Container(
              width: 24, height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color.withValues(alpha: 0.20),
                border: Border.all(color: Colors.white, width: 1.5),
              ),
              child: Center(
                child: Text(
                  show[i].length > 1 ? show[i][0] : show[i],
                  style: TextStyle(
                    fontSize: 8, fontWeight: FontWeight.w800, color: color,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  STATION DETAIL BOTTOM SHEET
// ─────────────────────────────────────────────
class _StationDetailSheet extends StatefulWidget {
  final ChargingStation station;
  final VoidCallback onCheckin;
  final ValueChanged<double> onRate;
  final ValueChanged<String> onComment;

  const _StationDetailSheet({
    required this.station,
    required this.onCheckin,
    required this.onRate,
    required this.onComment,
  });

  @override
  State<_StationDetailSheet> createState() => _StationDetailSheetState();
}

class _StationDetailSheetState extends State<_StationDetailSheet> {
  bool _checkedIn = false;

  void _handleCheckin() {
    setState(() => _checkedIn = true);
    widget.onCheckin();
    Navigator.pop(context);
  }

  void _showRateDialog() {
    double selected = 5;
    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          backgroundColor: EVColors.surface,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20)),
          title: const Text('Puan Ver', style: TextStyle(
            fontSize: 18, fontWeight: FontWeight.w700,
            color: EVColors.textPrimary,
          )),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(widget.station.name, style: const TextStyle(
                fontSize: 13, color: EVColors.textSecondary,
              )),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) {
                  return GestureDetector(
                    onTap: () => setS(() => selected = i + 1.0),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Icon(
                        Icons.star_rounded,
                        size: 36,
                        color: i < selected
                            ? const Color(0xFFFFB800)
                            : EVColors.divider,
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 8),
              Text(
                ['', 'Çok Kötü', 'Kötü', 'İdare Eder', 'İyi', 'Mükemmel']
                    [selected.toInt()],
                style: const TextStyle(
                  fontSize: 13, color: EVColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('İptal',
                  style: TextStyle(color: EVColors.textHint)),
            ),
            GestureDetector(
              onTap: () {
                Navigator.pop(ctx);
                widget.onRate(selected);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: EVColors.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('Gönder', style: TextStyle(
                  color: Colors.white, fontWeight: FontWeight.w700,
                )),
              ),
            ),
            const SizedBox(width: 4),
          ],
        ),
      ),
    );
  }

  void _showCommentSheet() {
    final ctrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Padding(
        padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: EVColors.surface,
            borderRadius:
                BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Yorum Yaz', style: TextStyle(
                fontSize: 16, fontWeight: FontWeight.w700,
                color: EVColors.textPrimary,
              )),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: EVColors.background,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: EVColors.border),
                ),
                child: TextField(
                  controller: ctrl,
                  autofocus: true,
                  maxLines: 3,
                  style: const TextStyle(
                      fontSize: 14, color: EVColors.textPrimary),
                  decoration: const InputDecoration(
                    hintText: 'Bu istasyon hakkında ne düşünüyorsun?',
                    hintStyle: TextStyle(
                        color: EVColors.textHint, fontSize: 14),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(14),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: GestureDetector(
                  onTap: () {
                    Navigator.pop(context);
                    widget.onComment(ctrl.text);
                  },
                  child: Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: EVColors.primary,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Center(
                      child: Text('Gönder', style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700,
                        color: Colors.white,
                      )),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final station = widget.station;
    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      maxChildSize: 0.92,
      minChildSize: 0.4,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: EVColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            // Handle
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 4),
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color: EVColors.textHint.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(station.name, style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w800,
                          color: EVColors.textPrimary, letterSpacing: -0.3,
                        )),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: station.isAvailable
                              ? EVColors.primaryLight
                              : EVColors.divider,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          station.isAvailable ? '⚡ Müsait' : '⛔ Dolu',
                          style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w600,
                            color: station.isAvailable
                                ? EVColors.primary
                                : EVColors.textHint,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_rounded,
                          size: 12, color: EVColors.textHint),
                      const SizedBox(width: 3),
                      Text(station.address, style: const TextStyle(
                        fontSize: 12, color: EVColors.textHint,
                      )),
                      const SizedBox(width: 8),
                      const Icon(Icons.directions_walk_rounded,
                          size: 12, color: EVColors.textHint),
                      const SizedBox(width: 3),
                      Text('${station.distance} km', style: const TextStyle(
                        fontSize: 12, color: EVColors.textHint,
                      )),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Rating + connectors
                  Row(
                    children: [
                      const Icon(Icons.star_rounded,
                          color: Color(0xFFFFB800), size: 16),
                      const SizedBox(width: 4),
                      Text(station.rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w700,
                            color: EVColors.textPrimary,
                          )),
                      const SizedBox(width: 4),
                      Text('(${station.reviewCount} değerlendirme)',
                          style: const TextStyle(
                            fontSize: 12, color: EVColors.textHint,
                          )),
                      const Spacer(),
                      ..._connectorBadges(station.connectors),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: _ActionBtn(
                          icon: _checkedIn
                              ? Icons.check_circle_rounded
                              : Icons.place_rounded,
                          label: _checkedIn ? 'Check-in Yapıldı' : 'Check-in',
                          isPrimary: !_checkedIn,
                          onTap: _checkedIn ? null : _handleCheckin,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _ActionBtn(
                          icon: Icons.star_outline_rounded,
                          label: 'Puan Ver',
                          isPrimary: false,
                          onTap: _showRateDialog,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _ActionBtn(
                          icon: Icons.chat_bubble_outline_rounded,
                          label: 'Yorum',
                          isPrimary: false,
                          onTap: _showCommentSheet,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const Divider(height: 1, color: EVColors.divider),

            // Comments list
            Expanded(
              child: ListView(
                controller: ctrl,
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 12),
                children: [
                  Text(
                    '${station.comments.length} Yorum',
                    style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w700,
                      color: EVColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (station.comments.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text('Henüz yorum yok.',
                            style: TextStyle(
                              color: EVColors.textHint, fontSize: 13,
                            )),
                      ),
                    )
                  else
                    ...station.comments.map((c) => _CommentRow(comment: c)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _connectorBadges(List<String> connectors) {
    final colors = {
      'AC': EVColors.acBlue,
      'DC': EVColors.dcAmber,
      'HPC': EVColors.hpcPurple,
    };
    return connectors.map((c) {
      final color = colors[c] ?? EVColors.textHint;
      return Container(
        margin: const EdgeInsets.only(left: 6),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withValues(alpha: 0.30)),
        ),
        child: Text(c, style: TextStyle(
          fontSize: 10, fontWeight: FontWeight.w700, color: color,
        )),
      );
    }).toList();
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isPrimary;
  final VoidCallback? onTap;

  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.isPrimary,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: isPrimary ? EVColors.primary : EVColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isPrimary ? EVColors.primary : EVColors.border,
          ),
          boxShadow: isPrimary
              ? [
                  BoxShadow(
                    color: EVColors.primary.withValues(alpha: 0.25),
                    blurRadius: 10, offset: const Offset(0, 4),
                  )
                ]
              : [],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 18,
                color: isPrimary
                    ? Colors.white
                    : onTap == null
                        ? EVColors.textHint
                        : EVColors.textSecondary),
            const SizedBox(height: 3),
            Text(label, style: TextStyle(
              fontSize: 10, fontWeight: FontWeight.w600,
              color: isPrimary
                  ? Colors.white
                  : onTap == null
                      ? EVColors.textHint
                      : EVColors.textSecondary,
            )),
          ],
        ),
      ),
    );
  }
}

class _CommentRow extends StatelessWidget {
  final _Comment comment;
  const _CommentRow({required this.comment});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34, height: 34,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: comment.color.withValues(alpha: 0.15),
              border: Border.all(
                  color: comment.color.withValues(alpha: 0.30)),
            ),
            child: Center(
              child: Text(comment.initials, style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w700,
                color: comment.color,
              )),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(comment.initials, style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w700,
                      color: EVColors.textPrimary,
                    )),
                    const SizedBox(width: 6),
                    Text(comment.time, style: const TextStyle(
                      fontSize: 11, color: EVColors.textHint,
                    )),
                  ],
                ),
                const SizedBox(height: 3),
                Text(comment.text, style: const TextStyle(
                  fontSize: 13, color: EVColors.textSecondary, height: 1.4,
                )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}