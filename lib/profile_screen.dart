import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'message_store.dart';

// ─────────────────────────────────────────────
//  COLORS
// ─────────────────────────────────────────────
class EVColors {
  EVColors._();
  static const Color primary       = Color(0xFF2DC653);
  static const Color primaryLight  = Color(0xFFE8F9ED);
  static const Color surface       = Color(0xFFFFFFFF);
  static const Color background    = Color(0xFFF6FBF7);
  static const Color textPrimary   = Color(0xFF0D1B12);
  static const Color textSecondary = Color(0xFF5A7264);
  static const Color textHint      = Color(0xFFADC4B4);
  static const Color border        = Color(0xFFD4EBD9);
  static const Color divider       = Color(0xFFE8F2EA);
}

// ─────────────────────────────────────────────
//  MOCK — kendi aracı
// ─────────────────────────────────────────────
class _OwnedVehicle {
  final String brand, model, emoji, year, km, batteryHealth, range;
  final Color color;
  const _OwnedVehicle({
    required this.brand, required this.model, required this.emoji,
    required this.year,  required this.km,    required this.batteryHealth,
    required this.range, required this.color,
  });
}

// Forum gönderi özeti
class _ForumPost {
  final String category, categoryEmoji, title, timeAgo;
  final int    replies, likes;
  const _ForumPost({
    required this.category, required this.categoryEmoji,
    required this.title,    required this.timeAgo,
    required this.replies,  required this.likes,
  });
}

// 2.El ilan özeti
class _MyListing {
  final String model, emoji, location, price, timeAgo;
  final bool   isActive;
  final Color  color;
  const _MyListing({
    required this.model,   required this.emoji,
    required this.location,required this.price,
    required this.timeAgo, required this.isActive,
    required this.color,
  });
}

// ── Mock veri ────────────────────────────────
const _OwnedVehicle _kVehicle = _OwnedVehicle(
  brand: 'Tesla', model: 'Model Y Long Range',
  emoji: '⚡',    year: '2023',
  km: '42.800',   batteryHealth: '%97',
  range: '520 km', color: Color(0xFFCC0000),
);

const List<_ForumPost> _kPosts = [
  _ForumPost(category: 'Teknoloji', categoryEmoji: '💡',
    title: 'Model Y\'de yazılım güncellemesi sonrası menzil arttı mı?',
    timeAgo: '2 saat önce', replies: 14, likes: 38),
  _ForumPost(category: 'Şarj', categoryEmoji: '🔋',
    title: 'Supercharger kuyruğu için en iyi saat aralığı',
    timeAgo: '1 gün önce', replies: 7, likes: 22),
  _ForumPost(category: 'Genel', categoryEmoji: '💬',
    title: 'İlk EV\'imi aldım — 3 ay sonra izlenimlerim',
    timeAgo: '5 gün önce', replies: 31, likes: 94),
];

const List<_MyListing> _kListings = [
  _MyListing(model: 'Tesla Model 3 2021', emoji: '⚡',
    location: 'İstanbul', price: '2.150.000 ₺',
    timeAgo: '3 gün önce', isActive: true, color: Color(0xFFCC0000)),
];

// ─────────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────────
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  // Kullanıcı alanları (gerçek uygulamada auth'dan gelir)
  String _name      = 'Ahmet Kaya';
  String _nickname  = '@ahmetkaya_ev';
  String _bio       = 'EV tutkunuyum ⚡ Elektrikli geleceğe inanıyorum 🌍';
  final bool   _hasVehicle = true;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() { _tab.dispose(); super.dispose(); }

  void _editProfile() {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _EditProfileSheet(
        name: _name, nickname: _nickname, bio: _bio,
        onSave: (name, nick, bio) =>
            setState(() { _name = name; _nickname = nick; _bio = bio; }),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EVColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (_, _) => [
          SliverToBoxAdapter(child: _buildHeader()),
          SliverPersistentHeader(
            pinned: true,
            delegate: _TabBarDelegate(controller: _tab),
          ),
        ],
        body: TabBarView(
          controller: _tab,
          children: [
            _VehicleTab(hasVehicle: _hasVehicle),
            _ForumTab(),
            _ListingsTab(),
            const _MessagesTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── AppBar satırı ───────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(children: [
              const Expanded(
                child: Text('Profilim', style: TextStyle(
                  fontSize: 22, fontWeight: FontWeight.w800,
                  color: EVColors.textPrimary, letterSpacing: -0.4,
                )),
              ),
              _IconBtn(
                icon: Icons.settings_outlined,
                onTap: () {},
              ),
            ]),
          ),

          const SizedBox(height: 20),

          // ── Avatar + istatistikler ──────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Avatar
                Stack(
                  children: [
                    Container(
                      width: 76, height: 76,
                      decoration: BoxDecoration(
                        color: EVColors.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: EVColors.primaryLight, width: 3),
                      ),
                      child: Center(
                        child: Text(
                          _name.split(' ').map((e) => e[0]).take(2).join(),
                          style: const TextStyle(
                            fontSize: 26, fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 0, right: 0,
                      child: GestureDetector(
                        onTap: () {},
                        child: Container(
                          width: 24, height: 24,
                          decoration: BoxDecoration(
                            color: EVColors.primary,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(Icons.add_rounded,
                              size: 14, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(width: 20),

                // İstatistik sayaçları
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _StatCol(value: '127', label: 'Gönderi'),
                      _vDivider(),
                      _StatCol(value: '4.8K', label: 'Takipçi'),
                      _vDivider(),
                      _StatCol(value: '318', label: 'Takip'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // ── Ad, nick, araç ──────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text(_name, style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w800,
                    color: EVColors.textPrimary,
                  )),
                  const SizedBox(width: 6),
                  // Doğrulanmış rozeti
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: EVColors.primaryLight,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.electric_bolt_rounded,
                            size: 11, color: EVColors.primary),
                        SizedBox(width: 2),
                        Text('EV Sürücüsü', style: TextStyle(
                          fontSize: 10, fontWeight: FontWeight.w700,
                          color: EVColors.primary,
                        )),
                      ],
                    ),
                  ),
                ]),
                const SizedBox(height: 2),
                Text(_nickname, style: const TextStyle(
                  fontSize: 13, color: EVColors.textHint,
                  fontWeight: FontWeight.w500,
                )),
                const SizedBox(height: 6),
                if (_bio.isNotEmpty)
                  Text(_bio, style: const TextStyle(
                    fontSize: 13, color: EVColors.textSecondary,
                    height: 1.4,
                  )),
                if (_hasVehicle) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: EVColors.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: EVColors.border),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Text(_kVehicle.emoji,
                          style: const TextStyle(fontSize: 14)),
                      const SizedBox(width: 6),
                      Text('${_kVehicle.brand} ${_kVehicle.model}',
                        style: const TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w700,
                          color: EVColors.textPrimary,
                        )),
                      const SizedBox(width: 4),
                      Text('• ${_kVehicle.year}', style: const TextStyle(
                        fontSize: 12, color: EVColors.textHint,
                      )),
                    ]),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ── Profili Düzenle butonu ──────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: _editProfile,
              child: Container(
                width: double.infinity, height: 38,
                decoration: BoxDecoration(
                  color: EVColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: EVColors.border),
                ),
                child: const Center(
                  child: Text('Profili Düzenle', style: TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w700,
                    color: EVColors.textPrimary,
                  )),
                ),
              ),
            ),
          ),

          const SizedBox(height: 4),
        ],
      ),
    );
  }

  Widget _vDivider() => Container(
    width: 1, height: 28,
    color: EVColors.border,
  );
}

// ─────────────────────────────────────────────
//  TAB BAR DELEGATE
// ─────────────────────────────────────────────
class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabController controller;
  const _TabBarDelegate({required this.controller});

  @override double get minExtent => 48;
  @override double get maxExtent => 48;

  @override
  Widget build(_, double shrink, bool overlaps) {
    return Container(
      color: EVColors.background,
      child: ValueListenableBuilder<List<Conversation>>(
        valueListenable: MessageStore.instance.conversations,
        builder: (context, convs, _) {
          final unread = MessageStore.instance.totalUnread;
          return TabBar(
            controller: controller,
            indicatorColor: EVColors.primary,
            indicatorWeight: 2.5,
            labelColor: EVColors.primary,
            unselectedLabelColor: EVColors.textHint,
            labelStyle: const TextStyle(
                fontSize: 12, fontWeight: FontWeight.w700),
            unselectedLabelStyle: const TextStyle(
                fontSize: 12, fontWeight: FontWeight.w500),
            tabs: [
              const Tab(text: 'Garaj'),
              const Tab(text: 'Forum'),
              const Tab(text: '2. El'),
              Tab(child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Mesajlar'),
                  if (unread > 0) ...[
                    const SizedBox(width: 4),
                    Container(
                      width: 16, height: 16,
                      decoration: const BoxDecoration(
                        color: Color(0xFFD94F3D),
                        shape: BoxShape.circle,
                      ),
                      child: Center(child: Text('$unread',
                        style: const TextStyle(
                          fontSize: 9, fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ))),
                    ),
                  ],
                ],
              )),
            ],
          );
        },
      ),
    );
  }

  @override
  bool shouldRebuild(_TabBarDelegate old) => false;
}

// ─────────────────────────────────────────────
//  TAB — GARAJ
// ─────────────────────────────────────────────
class _VehicleTab extends StatelessWidget {
  final bool hasVehicle;
  const _VehicleTab({required this.hasVehicle});

  @override
  Widget build(BuildContext context) {
    if (!hasVehicle) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: EVColors.primaryLight,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Center(
                child: Text('🚗', style: TextStyle(fontSize: 30))),
          ),
          const SizedBox(height: 14),
          const Text('Henüz araç eklemedin', style: TextStyle(
            fontSize: 16, fontWeight: FontWeight.w700,
            color: EVColors.textPrimary,
          )),
          const SizedBox(height: 6),
          const Text('Aracını ekleyerek topluluğa katıl',
            style: TextStyle(fontSize: 13, color: EVColors.textSecondary)),
          const SizedBox(height: 20),
          _PrimaryButton(label: 'Araç Ekle', onTap: () {}),
        ]),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      child: Column(children: [
        // Araç kartı
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft, end: Alignment.bottomRight,
              colors: [
                _kVehicle.color.withValues(alpha: 0.9),
                _kVehicle.color,
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: _kVehicle.color.withValues(alpha: 0.3),
                blurRadius: 16, offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text(_kVehicle.emoji,
                    style: const TextStyle(fontSize: 32)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(_kVehicle.year, style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700,
                    color: Colors.white,
                  )),
                ),
              ]),
              const SizedBox(height: 10),
              Text(_kVehicle.brand, style: const TextStyle(
                fontSize: 13, color: Colors.white70,
                fontWeight: FontWeight.w500,
              )),
              Text(_kVehicle.model, style: const TextStyle(
                fontSize: 20, fontWeight: FontWeight.w800,
                color: Colors.white, letterSpacing: -0.3,
              )),
              const SizedBox(height: 16),
              Row(children: [
                _vehicleStat(Icons.speed_rounded, _kVehicle.km, 'Kilometre'),
                const SizedBox(width: 12),
                _vehicleStat(Icons.battery_charging_full_rounded,
                    _kVehicle.batteryHealth, 'Batarya'),
                const SizedBox(width: 12),
                _vehicleStat(Icons.electric_bolt_rounded,
                    _kVehicle.range, 'Menzil'),
              ]),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Aktivite istatistikleri
        _sectionHeader('Topluluk Katkısı'),
        const SizedBox(height: 12),
        Row(children: [
          _ActivityCard(icon: Icons.forum_rounded,
              value: '127', label: 'Forum Gönderisi',
              color: const Color(0xFF378ADD)),
          const SizedBox(width: 12),
          _ActivityCard(icon: Icons.swap_horiz_rounded,
              value: '3', label: '2. El İlanı',
              color: EVColors.primary),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          _ActivityCard(icon: Icons.thumb_up_rounded,
              value: '1.2K', label: 'Beğeni Aldı',
              color: const Color(0xFF9B59B6)),
          const SizedBox(width: 12),
          _ActivityCard(icon: Icons.ev_station_rounded,
              value: '48', label: 'Şarj İstasyonu',
              color: const Color(0xFFEF9F27)),
        ]),
      ]),
    );
  }

  Widget _vehicleStat(IconData icon, String val, String lbl) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(children: [
        Icon(icon, size: 16, color: Colors.white),
        const SizedBox(height: 4),
        Text(val, style: const TextStyle(
          fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white,
        )),
        Text(lbl, style: const TextStyle(
          fontSize: 10, color: Colors.white70,
        )),
      ]),
    ),
  );
}

Widget _sectionHeader(String title) => Row(children: [
  Container(width: 4, height: 16,
    decoration: BoxDecoration(
      color: EVColors.primary, borderRadius: BorderRadius.circular(2)),
  ),
  const SizedBox(width: 8),
  Text(title, style: const TextStyle(
    fontSize: 15, fontWeight: FontWeight.w800,
    color: EVColors.textPrimary,
  )),
]);

class _ActivityCard extends StatelessWidget {
  final IconData icon;
  final String value, label;
  final Color color;
  const _ActivityCard({required this.icon, required this.value,
      required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: EVColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: EVColors.border),
      ),
      child: Row(children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value, style: const TextStyle(
            fontSize: 16, fontWeight: FontWeight.w800,
            color: EVColors.textPrimary,
          )),
          Text(label, style: const TextStyle(
            fontSize: 10, color: EVColors.textSecondary,
          )),
        ]),
      ]),
    ),
  );
}

// ─────────────────────────────────────────────
//  TAB — FORUM
// ─────────────────────────────────────────────
class _ForumTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      itemCount: _kPosts.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, i) => _ForumPostCard(post: _kPosts[i]),
    );
  }
}

class _ForumPostCard extends StatelessWidget {
  final _ForumPost post;
  const _ForumPostCard({required this.post});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: EVColors.surface,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: EVColors.border),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: EVColors.primaryLight,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(post.categoryEmoji,
                style: const TextStyle(fontSize: 11)),
            const SizedBox(width: 4),
            Text(post.category, style: const TextStyle(
              fontSize: 11, fontWeight: FontWeight.w700,
              color: EVColors.primary,
            )),
          ]),
        ),
        const Spacer(),
        Text(post.timeAgo, style: const TextStyle(
          fontSize: 11, color: EVColors.textHint,
        )),
      ]),
      const SizedBox(height: 8),
      Text(post.title, style: const TextStyle(
        fontSize: 13, fontWeight: FontWeight.w600,
        color: EVColors.textPrimary, height: 1.3,
      )),
      const SizedBox(height: 10),
      Row(children: [
        Icon(Icons.chat_bubble_outline_rounded,
            size: 13, color: EVColors.textHint),
        const SizedBox(width: 4),
        Text('${post.replies}', style: const TextStyle(
          fontSize: 12, color: EVColors.textHint,
        )),
        const SizedBox(width: 14),
        Icon(Icons.favorite_border_rounded,
            size: 13, color: EVColors.textHint),
        const SizedBox(width: 4),
        Text('${post.likes}', style: const TextStyle(
          fontSize: 12, color: EVColors.textHint,
        )),
      ]),
    ]),
  );
}

// ─────────────────────────────────────────────
//  TAB — 2. EL İLANLARI
// ─────────────────────────────────────────────
class _ListingsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    if (_kListings.isEmpty) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: EVColors.primaryLight,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Center(
                child: Text('🏷️', style: TextStyle(fontSize: 28))),
          ),
          const SizedBox(height: 14),
          const Text('Aktif ilanın yok', style: TextStyle(
            fontSize: 16, fontWeight: FontWeight.w700,
            color: EVColors.textPrimary,
          )),
          const SizedBox(height: 6),
          const Text('2. El bölümünden ilan verebilirsin',
            style: TextStyle(fontSize: 13, color: EVColors.textSecondary)),
        ]),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      itemCount: _kListings.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, i) => _MyListingCard(listing: _kListings[i]),
    );
  }
}

class _MyListingCard extends StatelessWidget {
  final _MyListing listing;
  const _MyListingCard({required this.listing});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: EVColors.surface,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: EVColors.border),
    ),
    child: Row(children: [
      Container(
        width: 50, height: 50,
        decoration: BoxDecoration(
          color: listing.color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(child: Text(listing.emoji,
            style: const TextStyle(fontSize: 24))),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(listing.model, style: const TextStyle(
            fontSize: 13, fontWeight: FontWeight.w700,
            color: EVColors.textPrimary,
          )),
          const SizedBox(height: 3),
          Row(children: [
            Icon(Icons.location_on_rounded,
                size: 11, color: EVColors.textHint),
            const SizedBox(width: 2),
            Text(listing.location, style: const TextStyle(
              fontSize: 11, color: EVColors.textHint,
            )),
            const SizedBox(width: 8),
            Text('• ${listing.timeAgo}', style: const TextStyle(
              fontSize: 11, color: EVColors.textHint,
            )),
          ]),
          const SizedBox(height: 6),
          Text(listing.price, style: const TextStyle(
            fontSize: 15, fontWeight: FontWeight.w800,
            color: EVColors.textPrimary,
          )),
        ]),
      ),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: listing.isActive
              ? EVColors.primaryLight
              : const Color(0xFFFFF3E0),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(listing.isActive ? 'Aktif' : 'Pasif',
          style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w700,
            color: listing.isActive
                ? EVColors.primary
                : const Color(0xFFEF9F27),
          )),
      ),
    ]),
  );
}

// ─────────────────────────────────────────────
//  TAB — MESAJLAR
// ─────────────────────────────────────────────
class _MessagesTab extends StatelessWidget {
  const _MessagesTab();

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<List<Conversation>>(
      valueListenable: MessageStore.instance.conversations,
      builder: (context, convs, _) {
        if (convs.isEmpty) {
          return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 64, height: 64,
              decoration: BoxDecoration(
                color: EVColors.primaryLight,
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Center(
                  child: Icon(Icons.chat_bubble_outline_rounded,
                      size: 30, color: EVColors.primary)),
            ),
            const SizedBox(height: 14),
            const Text('Henüz mesajın yok', style: TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700,
              color: EVColors.textPrimary,
            )),
            const SizedBox(height: 6),
            const Text('2. El ilanlarından satıcılara\nmesaj gönderebilirsin',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: EVColors.textSecondary)),
          ]));
        }

        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          itemCount: convs.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (_, i) => _ConversationCard(conv: convs[i]),
        );
      },
    );
  }
}

class _ConversationCard extends StatelessWidget {
  final Conversation conv;
  const _ConversationCard({required this.conv});

  String _timeAgo(DateTime t) {
    final diff = DateTime.now().difference(t);
    if (diff.inMinutes < 1) return 'Şimdi';
    if (diff.inMinutes < 60) return '${diff.inMinutes} dk';
    if (diff.inHours < 24)   return '${diff.inHours} sa';
    return '${diff.inDays} gün';
  }

  @override
  Widget build(BuildContext context) {
    final last = conv.lastMessage;
    return GestureDetector(
      onTap: () => Navigator.push(context,
        MaterialPageRoute(builder: (_) => _ChatScreen(conv: conv))),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: EVColors.border),
        ),
        child: Row(children: [
          Container(
            width: 46, height: 46,
            decoration: BoxDecoration(
              color: conv.sellerColor.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Center(child: Text(conv.sellerInitials, style: TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700,
              color: conv.sellerColor,
            ))),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(conv.sellerName, style: const TextStyle(
                fontSize: 14, fontWeight: FontWeight.w700,
                color: EVColors.textPrimary,
              )),
              const SizedBox(height: 2),
              Text(conv.listingTitle, style: const TextStyle(
                fontSize: 11, color: EVColors.primary,
                fontWeight: FontWeight.w500,
              )),
              if (last != null) ...[
                const SizedBox(height: 3),
                Text(
                  '${last.fromMe ? "Sen: " : ""}${last.text}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12, color: EVColors.textSecondary,
                  ),
                ),
              ],
            ],
          )),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (last != null)
                Text(_timeAgo(last.time), style: const TextStyle(
                  fontSize: 11, color: EVColors.textHint,
                )),
              const SizedBox(height: 4),
              if (conv.unreadCount > 0)
                Container(
                  width: 20, height: 20,
                  decoration: const BoxDecoration(
                    color: Color(0xFFD94F3D), shape: BoxShape.circle),
                  child: Center(child: Text('${conv.unreadCount}',
                    style: const TextStyle(fontSize: 10,
                        fontWeight: FontWeight.w800, color: Colors.white))),
                ),
            ],
          ),
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  CHAT SCREEN (konuşma detayı)
// ─────────────────────────────────────────────
class _ChatScreen extends StatefulWidget {
  final Conversation conv;
  const _ChatScreen({required this.conv});
  @override
  State<_ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<_ChatScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();

  @override
  void dispose() {
    _ctrl.dispose(); _scroll.dispose(); super.dispose();
  }

  void _send() {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    HapticFeedback.lightImpact();
    MessageStore.instance.replyInConversation(widget.conv.id, text);
    _ctrl.clear();
    FocusScope.of(context).unfocus();
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent + 100,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Scaffold(
      backgroundColor: EVColors.background,
      appBar: AppBar(
        backgroundColor: EVColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: EVColors.textPrimary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(children: [
          Container(
            width: 34, height: 34,
            decoration: BoxDecoration(
              color: widget.conv.sellerColor.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Center(child: Text(widget.conv.sellerInitials,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                  color: widget.conv.sellerColor))),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.conv.sellerName, style: const TextStyle(
                fontSize: 14, fontWeight: FontWeight.w700,
                color: EVColors.textPrimary,
              )),
              Text(widget.conv.listingTitle, style: const TextStyle(
                fontSize: 11, color: EVColors.primary,
              )),
            ],
          )),
        ]),
      ),
      body: Column(children: [
        const Divider(height: 1, color: EVColors.divider),
        Expanded(
          child: ValueListenableBuilder<List<Conversation>>(
            valueListenable: MessageStore.instance.conversations,
            builder: (context, convs, _) {
              final conv = convs.firstWhere(
                (c) => c.id == widget.conv.id,
                orElse: () => widget.conv,
              );
              return ListView.builder(
                controller: _scroll,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                itemCount: conv.messages.length,
                itemBuilder: (_, i) => _Bubble(msg: conv.messages[i]),
              );
            },
          ),
        ),
        Container(
          padding: EdgeInsets.fromLTRB(16, 10, 16, bottom + 12),
          decoration: const BoxDecoration(
            color: EVColors.surface,
            border: Border(top: BorderSide(color: EVColors.divider)),
          ),
          child: Row(children: [
            Expanded(
              child: Container(
                constraints: const BoxConstraints(maxHeight: 100),
                decoration: BoxDecoration(
                  color: EVColors.background,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: EVColors.border),
                ),
                child: TextField(
                  controller: _ctrl,
                  maxLines: null,
                  style: const TextStyle(fontSize: 14, color: EVColors.textPrimary),
                  decoration: const InputDecoration(
                    hintText: 'Mesaj yaz…',
                    hintStyle: TextStyle(color: EVColors.textHint, fontSize: 14),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: _send,
              child: Container(
                width: 42, height: 42,
                decoration: BoxDecoration(
                  color: EVColors.primary,
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(
                    color: EVColors.primary.withValues(alpha: 0.3),
                    blurRadius: 8, offset: const Offset(0, 3),
                  )],
                ),
                child: const Icon(Icons.send_rounded,
                    color: Colors.white, size: 18),
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}

class _Bubble extends StatelessWidget {
  final ChatMessage msg;
  const _Bubble({required this.msg});

  String _timeStr(DateTime t) =>
    '${t.hour.toString().padLeft(2,'0')}:${t.minute.toString().padLeft(2,'0')}';

  @override
  Widget build(BuildContext context) {
    final fromMe = msg.fromMe;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment:
            fromMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!fromMe)
            Container(
              width: 28, height: 28,
              margin: const EdgeInsets.only(right: 8),
              decoration: const BoxDecoration(
                color: EVColors.primaryLight, shape: BoxShape.circle),
              child: const Icon(Icons.person_rounded,
                  size: 16, color: EVColors.primary),
            ),
          Flexible(
            child: Column(
              crossAxisAlignment:
                  fromMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: fromMe ? EVColors.primary : EVColors.surface,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(fromMe ? 16 : 4),
                      bottomRight: Radius.circular(fromMe ? 4 : 16),
                    ),
                    border: fromMe
                        ? null
                        : Border.all(color: EVColors.border),
                    boxShadow: [BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 4, offset: const Offset(0, 2),
                    )],
                  ),
                  child: Text(msg.text, style: TextStyle(
                    fontSize: 14, height: 1.4,
                    color: fromMe ? Colors.white : EVColors.textPrimary,
                  )),
                ),
                const SizedBox(height: 3),
                Text(_timeStr(msg.time), style: const TextStyle(
                  fontSize: 10, color: EVColors.textHint,
                )),
              ],
            ),
          ),
          if (fromMe) const SizedBox(width: 4),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  PROFİL DÜZENLE SHEET
// ─────────────────────────────────────────────
class _EditProfileSheet extends StatefulWidget {
  final String name, nickname, bio;
  final void Function(String, String, String) onSave;
  const _EditProfileSheet({
    required this.name, required this.nickname,
    required this.bio,  required this.onSave,
  });
  @override
  State<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<_EditProfileSheet> {
  late TextEditingController _nameCtrl, _nickCtrl, _bioCtrl;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.name);
    _nickCtrl = TextEditingController(text: widget.nickname);
    _bioCtrl  = TextEditingController(text: widget.bio);
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _nickCtrl.dispose(); _bioCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 0, 20, bottom + 28),
      decoration: const BoxDecoration(
        color: EVColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          Center(child: Padding(
            padding: const EdgeInsets.only(top: 14, bottom: 10),
            child: Container(width: 36, height: 4,
              decoration: BoxDecoration(
                color: EVColors.textHint.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          )),
          const SizedBox(height: 10),
          Row(children: [
            const Text('Profili Düzenle', style: TextStyle(
              fontSize: 18, fontWeight: FontWeight.w700,
              color: EVColors.textPrimary,
            )),
            const Spacer(),
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: 34, height: 34,
                decoration: BoxDecoration(
                  color: EVColors.divider, shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close_rounded,
                    size: 18, color: EVColors.textSecondary),
              ),
            ),
          ]),
          const SizedBox(height: 24),

          _field('Ad Soyad', _nameCtrl, 'Adınız ve soyadınız'),
          _field('Kullanıcı Adı', _nickCtrl, '@kullaniciadi'),
          _field('Biyografi', _bioCtrl, 'Kendinizden bahsedin…',
              maxLines: 3),

          const SizedBox(height: 8),

          // Araç seçimi notu
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: EVColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(children: [
              const Icon(Icons.electric_bolt_rounded,
                  size: 16, color: EVColors.primary),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Araç bilgilerini "Garaj" sekmesinden güncelleyebilirsin.',
                  style: TextStyle(
                    fontSize: 12, color: EVColors.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ]),
          ),

          const SizedBox(height: 20),
          GestureDetector(
            onTap: () {
              widget.onSave(
                _nameCtrl.text.trim(),
                _nickCtrl.text.trim(),
                _bioCtrl.text.trim(),
              );
              Navigator.pop(context);
            },
            child: Container(
              width: double.infinity, height: 52,
              decoration: BoxDecoration(
                color: EVColors.primary,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [BoxShadow(
                  color: EVColors.primary.withValues(alpha: 0.35),
                  blurRadius: 12, offset: const Offset(0, 4),
                )],
              ),
              child: const Center(child: Text('Kaydet', style: TextStyle(
                fontSize: 15, fontWeight: FontWeight.w700,
                color: Colors.white,
              ))),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, String hint,
      {int maxLines = 1}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(
        fontSize: 12, fontWeight: FontWeight.w600,
        color: EVColors.textSecondary,
      )),
      const SizedBox(height: 6),
      Container(
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: EVColors.border),
        ),
        child: TextField(
          controller: ctrl, maxLines: maxLines,
          style: const TextStyle(fontSize: 14, color: EVColors.textPrimary),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: EVColors.textHint, fontSize: 14),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 14, vertical: 12),
          ),
        ),
      ),
      const SizedBox(height: 14),
    ]);
  }
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
class _StatCol extends StatelessWidget {
  final String value, label;
  const _StatCol({required this.value, required this.label});

  @override
  Widget build(BuildContext context) => Column(children: [
    Text(value, style: const TextStyle(
      fontSize: 17, fontWeight: FontWeight.w800,
      color: EVColors.textPrimary,
    )),
    const SizedBox(height: 2),
    Text(label, style: const TextStyle(
      fontSize: 11, color: EVColors.textSecondary,
    )),
  ]);
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 38, height: 38,
      decoration: BoxDecoration(
        color: EVColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: EVColors.border),
      ),
      child: Icon(icon, size: 20, color: EVColors.textSecondary),
    ),
  );
}

class _PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _PrimaryButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 13),
      decoration: BoxDecoration(
        color: EVColors.primary,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(
          color: EVColors.primary.withValues(alpha: 0.3),
          blurRadius: 10, offset: const Offset(0, 4),
        )],
      ),
      child: Text(label, style: const TextStyle(
        fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white,
      )),
    ),
  );
}
