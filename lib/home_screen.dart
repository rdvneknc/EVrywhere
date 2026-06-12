import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'forum_screen.dart';
import 'profile_screen.dart';
import 'charging_screen.dart';
import 'ikinci_el_screen.dart';
import 'bildirim_screen.dart';

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
  static const Color tag1Bg        = Color(0xFFE8F9ED);
  static const Color tag1Text      = Color(0xFF1A8C40);
  static const Color tag2Bg        = Color(0xFFE8F3FC);
  static const Color tag2Text      = Color(0xFF185FA5);
  static const Color tag3Bg        = Color(0xFFFFF3E0);
  static const Color tag3Text      = Color(0xFFBF6D00);
}

// ─────────────────────────────────────────────
//  MOCK DATA MODELS
// ─────────────────────────────────────────────
class NewsItem {
  final String id, title, subtitle, category, readTime;
  final Color gradientStart, gradientEnd;
  final IconData icon;
  final String content; // ← EKLE
  const NewsItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.category,
    required this.readTime,
    required this.gradientStart,
    required this.gradientEnd,
    required this.icon,
    this.content = '', // ← EKLE
  });
}

class PostItem {
  final String id, author, avatar, title, excerpt, tag, time, readTime;
  final int likes, comments;
  final Color tagBg, tagText;
  const PostItem({
    required this.id,
    required this.author,
    required this.avatar,
    required this.title,
    required this.excerpt,
    required this.tag,
    required this.time,
    required this.readTime,
    required this.likes,
    required this.comments,
    required this.tagBg,
    required this.tagText,
  });
}

const List<NewsItem> kNews = [
  NewsItem(
    id: '1',
    title: 'Tesla Unveils 500-Mile Range Battery Tech',
    subtitle: 'New solid-state cells promise to reshape long-distance EV travel by 2026.',
    category: 'Technology',
    readTime: '3 min read',
    gradientStart: Color(0xFF1B7A3E),
    gradientEnd: Color(0xFF2DC653),
    icon: Icons.electric_bolt_rounded,
    content: 'Tesla, yeni nesil katı hal pil teknolojisini tanıttı. Şirket, 2026 yılına kadar seri üretime geçmeyi planladığı bu teknoloji ile araçların menzilini 500 milin üzerine çıkarmayı hedefliyor.\n\nYeni batarya teknolojisi, geleneksel lityum iyon pillere kıyasla çok daha yüksek enerji yoğunluğu sunuyor. Aynı zamanda şarj sürelerini dramatik biçimde kısaltması bekleniyor.\n\nTesla CEO\'su Elon Musk, bu gelişmenin elektrikli araç endüstrisinde devrim yaratacağını açıkladı. Analistler de bu teknolojinin EV pazarındaki rekabeti kökten değiştirebileceğini vurguluyor.',
  ),
  NewsItem(
    id: '2',
    title: 'EU Mandates 100% EV Sales by 2035',
    subtitle: 'Historic legislation signals the end of combustion engines across Europe.',
    category: 'Policy',
    readTime: '4 min read',
    gradientStart: Color(0xFF0D5CA6),
    gradientEnd: Color(0xFF378ADD),
    icon: Icons.policy_rounded,
    content: 'Avrupa Birliği, 2035 yılından itibaren yalnızca sıfır emisyonlu araçların satışına izin verecek. Bu tarihi karar, kıtada içten yanmalı motorlu araç üretiminin sona ereceğinin resmi ilanı niteliğinde.\n\nAB\'nin aldığı bu karar, otomotiv sektörünü köklü bir dönüşüme zorluyor. Volkswagen, BMW ve Stellantis gibi büyük üreticiler elektrikli araç yatırımlarını hızlandırıyor.\n\nTüketiciler açısından ise bu karar, önümüzdeki on yılda piyasadaki araç seçeneklerini tamamen değiştirecek. Uzmanlar, EV fiyatlarının 2030\'a kadar içten yanmalı araçlarla rekabet edebilir seviyeye ineceğini öngörüyor.',
  ),
  NewsItem(
    id: '3',
    title: 'Ultra-Fast 350kW Chargers Hit Highways',
    subtitle: 'New stations cut charge time to under 10 minutes for most EVs.',
    category: 'Charging',
    readTime: '2 min read',
    gradientStart: Color(0xFF7B3F00),
    gradientEnd: Color(0xFFEF9F27),
    icon: Icons.bolt_rounded,
    content: 'Avrupa ve Kuzey Amerika otoyollarına kurulan yeni nesil 350 kW şarj istasyonları, elektrikli araç kullanıcılarının en büyük sorununu çözüyor: şarj süresi.\n\nBu ultra hızlı şarj noktaları, uyumlu araçları 10 dakikanın altında yeterli menzile ulaştırabiliyor. Özellikle uzun yol seyahatlerinde bu gelişme büyük kolaylık sağlıyor.\n\nTürkiye\'de de ZES ve Togg HızlıŞarj bu teknolojiye yatırım yapıyor. 2025 sonu itibarıyla ülke genelinde 200\'den fazla ultra hızlı şarj noktası kurulması planlanıyor.',
  ),
  NewsItem(
    id: '4',
    title: 'Rivian R3 Starts at \$38k — Orders Open',
    subtitle: 'The eagerly awaited compact SUV finally hits the market at an accessible price.',
    category: 'Vehicles',
    readTime: '5 min read',
    gradientStart: Color(0xFF4A1575),
    gradientEnd: Color(0xFF7F77DD),
    icon: Icons.directions_car_rounded,
    content: 'Rivian\'ın uzun süredir beklenen kompakt SUV modeli R3, 38.000 dolar başlangıç fiyatıyla sipariş almaya başladı. Bu fiyat noktası, Rivian\'ı daha geniş bir kitleye ulaştırabilir.\n\nR3, 300 mil menzil ve çift motor seçeneğiyle dikkat çekiyor. Amazon ile ortaklığı sayesinde güçlü bir servis ağına sahip olan Rivian, R3 ile rekabetçi EV pazarında önemli bir yer edinmeyi hedefliyor.\n\nTürkiye\'ye resmi dağıtım için henüz bir tarih açıklanmamış olsa da Avrupa pazarına 2026\'da giriş yapılması bekleniyor.',
  ),
];

const List<PostItem> kPosts = [
  PostItem(
    id: '1',
    author: 'Alex Morgan',
    avatar: 'AM',
    title: 'My 3,000-mile road trip in a Model Y — honest review',
    excerpt: 'I drove coast-to-coast on the Supercharger network. Here\'s what worked, what surprised me, and where Tesla still has room to improve.',
    tag: 'Road Trip',
    time: '2h ago',
    readTime: '6 min read',
    likes: 312,
    comments: 47,
    tagBg: EVColors.tag1Bg,
    tagText: EVColors.tag1Text,
  ),
  PostItem(
    id: '2',
    author: 'Sam Chen',
    avatar: 'SC',
    title: 'Home charging setup guide: Level 1 vs Level 2',
    excerpt: 'Everything you need to know before installing a home charger — costs, permits, electricians, and which EVSE brands are actually worth it.',
    tag: 'Charging',
    time: '5h ago',
    readTime: '8 min read',
    likes: 198,
    comments: 34,
    tagBg: EVColors.tag2Bg,
    tagText: EVColors.tag2Text,
  ),
  PostItem(
    id: '3',
    author: 'Priya Nair',
    avatar: 'PN',
    title: 'Best EVs under \$40k in 2025 — ranked',
    excerpt: 'With so many new models dropping this year, we put the top 8 affordable EVs head-to-head on range, features, and real-world value.',
    tag: 'Buying Guide',
    time: '1d ago',
    readTime: '10 min read',
    likes: 541,
    comments: 89,
    tagBg: EVColors.tag3Bg,
    tagText: EVColors.tag3Text,
  ),
  PostItem(
    id: '4',
    author: 'Jordan Lee',
    avatar: 'JL',
    title: 'Why I switched from gas back to EV after 6 months',
    excerpt: 'I bought a hybrid thinking it was a safer bet. Six months later I traded it for a Hyundai IONIQ 6. Here\'s my honest take on the experience.',
    tag: 'Opinion',
    time: '2d ago',
    readTime: '5 min read',
    likes: 276,
    comments: 61,
    tagBg: EVColors.tag1Bg,
    tagText: EVColors.tag1Text,
  ),
  PostItem(
    id: '5',
    author: 'Marcus Webb',
    avatar: 'MW',
    title: 'Comparing charging networks: Supercharger vs Electrify America',
    excerpt: 'Speed, reliability, app experience, and pricing — a data-driven breakdown of the two biggest public networks in North America.',
    tag: 'Charging',
    time: '3d ago',
    readTime: '7 min read',
    likes: 433,
    comments: 72,
    tagBg: EVColors.tag2Bg,
    tagText: EVColors.tag2Text,
  ),
];

// ─────────────────────────────────────────────
//  BOTTOM NAV ITEMS
// ─────────────────────────────────────────────
const List<_NavItem> kNavItems = [
  _NavItem(icon: Icons.forum_rounded,           label: 'Forum'),
  _NavItem(icon: Icons.ev_station_rounded,      label: 'Şarj'),
  _NavItem(icon: Icons.swap_horiz_rounded,      label: '2. El'),
  _NavItem(icon: Icons.notifications_rounded,   label: 'Bildirim'),
  _NavItem(icon: Icons.person_rounded,          label: 'Profil'),
];



// ─────────────────────────────────────────────
//  HOME SCREEN
// ─────────────────────────────────────────────
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _navIndex = 0;

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: EVColors.background,
        body: IndexedStack(
          index: _navIndex,
          children: const [
            SafeArea(child: ForumScreen()),
            ChargingScreen(),
            IkinciElScreen(),
            BildirimScreen(),
            ProfileScreen(),
          ],
        ),
        bottomNavigationBar: _BottomNav(
          currentIndex: _navIndex,
         onTap: (i) {
  setState(() => _navIndex = i);

},
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  APP BAR
// ─────────────────────────────────────────────
class _AppBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 56, 20, 8),
      sliver: SliverToBoxAdapter(
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Good morning 👋', style: TextStyle(
                    fontSize: 13,
                    color: EVColors.textHint,
                    fontWeight: FontWeight.w400,
                  )),
                  const SizedBox(height: 2),
                  RichText(
                    text: const TextSpan(children: [
                      TextSpan(text: 'EV', style: TextStyle(
                        fontSize: 22, fontWeight: FontWeight.w800,
                        color: EVColors.primary, letterSpacing: -0.4,
                      )),
                      TextSpan(text: 'rywhere', style: TextStyle(
                        fontSize: 22, fontWeight: FontWeight.w800,
                        color: EVColors.textPrimary, letterSpacing: -0.4,
                      )),
                    ]),
                  ),
                ],
              ),
            ),
            // Search button
            _IconBtn(icon: Icons.search_rounded, onTap: () {}),
            const SizedBox(width: 10),
            // Notification button
            Stack(
              children: [
                _IconBtn(icon: Icons.notifications_none_rounded, onTap: () {}),
                Positioned(
                  top: 8, right: 8,
                  child: Container(
                    width: 8, height: 8,
                    decoration: const BoxDecoration(
                      color: EVColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconBtn({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42, height: 42,
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: EVColors.border),
        ),
        child: Icon(icon, color: EVColors.textPrimary, size: 20),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  SECTION LABEL
// ─────────────────────────────────────────────
class _SectionLabel extends StatelessWidget {
  final String label, trailing;
  const _SectionLabel({required this.label, required this.trailing});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(
            fontSize: 18, fontWeight: FontWeight.w700,
            color: EVColors.textPrimary, letterSpacing: -0.3,
          )),
          Text(trailing, style: const TextStyle(
            fontSize: 13, fontWeight: FontWeight.w500,
            color: EVColors.primary,
          )),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  NEWS SLIDER
// ─────────────────────────────────────────────
class _NewsSlider extends StatelessWidget {
  final PageController pageCtrl;
  final int currentIndex;
  final ValueChanged<int> onPageChanged;

  const _NewsSlider({
    required this.pageCtrl,
    required this.currentIndex,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: PageView.builder(
        controller: pageCtrl,
        itemCount: kNews.length,
        onPageChanged: onPageChanged,
        itemBuilder: (context, i) {
          return AnimatedScale(
  scale: currentIndex == i ? 1.0 : 0.95,
  duration: const Duration(milliseconds: 300),
  curve: Curves.easeOut,
  child: GestureDetector(
    onTap: () => Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => NewsDetailScreen(news: kNews[i]),
      ),
    ),
    child: _NewsCard(news: kNews[i]),
  ),
);
        },
      ),
    );
  }
}

class _NewsCard extends StatelessWidget {
  final NewsItem news;
  const _NewsCard({required this.news});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: [news.gradientStart, news.gradientEnd],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: news.gradientEnd.withValues(alpha: 0.35),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Decorative background circle
            Positioned(
              right: -28, top: -28,
              child: Container(
                width: 150, height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.07),
                ),
              ),
            ),
            Positioned(
              right: 20, bottom: -40,
              child: Container(
                width: 120, height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.05),
                ),
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.20),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(news.icon, size: 12,
                                color: Colors.white.withValues(alpha: 0.9)),
                            const SizedBox(width: 5),
                            Text(news.category, style: const TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w600,
                              color: Colors.white,
                            )),
                          ],
                        ),
                      ),
                      const Spacer(),
                      Text(news.readTime, style: TextStyle(
                        fontSize: 11, color: Colors.white.withValues(alpha: 0.75),
                      )),
                    ],
                  ),
                  const Spacer(),
                  Text(
                    news.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w700,
                      color: Colors.white, height: 1.35, letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    news.subtitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12, color: Colors.white.withValues(alpha: 0.80),
                      height: 1.45,
                    ),
                  ),
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
//  SLIDER DOTS
// ─────────────────────────────────────────────
class _SliderDots extends StatelessWidget {
  final int count, active;
  const _SliderDots({required this.count, required this.active});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(count, (i) {
          return AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: active == i ? 20 : 6,
            height: 6,
            decoration: BoxDecoration(
              color: active == i ? EVColors.primary : EVColors.primaryMid,
              borderRadius: BorderRadius.circular(3),
            ),
          );
        }),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  POST CARD
// ─────────────────────────────────────────────
class _PostCard extends StatelessWidget {
  final PostItem post;
  const _PostCard({required this.post});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: EVColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Author row
            Row(
              children: [
                _AvatarCircle(initials: post.avatar),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(post.author, style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600,
                        color: EVColors.textPrimary,
                      )),
                      Text(post.time, style: const TextStyle(
                        fontSize: 11, color: EVColors.textHint,
                      )),
                    ],
                  ),
                ),
                // Tag chip
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: post.tagBg,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(post.tag, style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w600,
                    color: post.tagText,
                  )),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // Title
            Text(post.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 15, fontWeight: FontWeight.w700,
                color: EVColors.textPrimary, height: 1.35, letterSpacing: -0.2,
              ),
            ),

            const SizedBox(height: 6),

            // Excerpt
            Text(post.excerpt,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13, color: EVColors.textSecondary, height: 1.5,
              ),
            ),

            const SizedBox(height: 14),

            // Footer row
            Row(
              children: [
                _PostStat(icon: Icons.favorite_border_rounded,
                    value: post.likes),
                const SizedBox(width: 16),
                _PostStat(icon: Icons.chat_bubble_outline_rounded,
                    value: post.comments),
                const Spacer(),
                Row(
                  children: [
                    Icon(Icons.access_time_rounded,
                        size: 12, color: EVColors.textHint),
                    const SizedBox(width: 4),
                    Text(post.readTime, style: const TextStyle(
                      fontSize: 11, color: EVColors.textHint,
                    )),
                  ],
                ),
                const SizedBox(width: 12),
                Icon(Icons.bookmark_border_rounded,
                    size: 18, color: EVColors.textHint),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AvatarCircle extends StatelessWidget {
  final String initials;
  const _AvatarCircle({required this.initials});

  static const List<Color> _palette = [
    Color(0xFF2DC653), Color(0xFF378ADD),
    Color(0xFFEF9F27), Color(0xFF7F77DD),
    Color(0xFFD4537E),
  ];

  Color get _color => _palette[initials.codeUnitAt(0) % _palette.length];

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36, height: 36,
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.15),
        shape: BoxShape.circle,
        border: Border.all(color: _color.withValues(alpha: 0.25)),
      ),
      child: Center(
        child: Text(initials, style: TextStyle(
          fontSize: 12, fontWeight: FontWeight.w700, color: _color,
        )),
      ),
    );
  }
}

class _PostStat extends StatelessWidget {
  final IconData icon;
  final int value;
  const _PostStat({required this.icon, required this.value});
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 15, color: EVColors.textHint),
        const SizedBox(width: 4),
        Text(_formatCount(value), style: const TextStyle(
          fontSize: 12, color: EVColors.textHint, fontWeight: FontWeight.w500,
        )),
      ],
    );
  }
  String _formatCount(int n) => n >= 1000 ? '${(n / 1000).toStringAsFixed(1)}k' : '$n';
}

// ─────────────────────────────────────────────
//  BOTTOM NAVIGATION
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  BOTTOM NAV  —  drop-in replacement
//  Replaces _BottomNav + _NavItem in home_screen.dart
// ─────────────────────────────────────────────



class _NavItem {
  final IconData icon;
  final String label;
  const _NavItem({required this.icon, required this.label});
}

class _BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const _BottomNav({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<List<AppNotification>>(
      valueListenable: NotificationStore.instance.notifications,
      builder: (context, notifs, _) {
        final unread = notifs.where((n) => !n.isRead).length;
        return Container(
          decoration: BoxDecoration(
            color: EVColors.surface,
            border: Border(top: BorderSide(color: EVColors.border)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 16,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: SizedBox(
              height: 60,
              child: Row(
                children: List.generate(kNavItems.length, (i) {
                  final item = kNavItems[i];
                  final active = i == currentIndex;
                  // index 3 = Bildirim tab
                  final showBadge = i == 3 && unread > 0;
                  return Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => onTap(i),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 5),
                                decoration: BoxDecoration(
                                  color: active
                                      ? EVColors.primaryLight
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  item.icon,
                                  size: 22,
                                  color: active
                                      ? EVColors.primary
                                      : EVColors.textHint,
                                ),
                              ),
                              if (showBadge)
                                Positioned(
                                  right: 6,
                                  top: 2,
                                  child: Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFD94F3D),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 200),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: active
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: active
                                  ? EVColors.primary
                                  : EVColors.textHint,
                            ),
                            child: Text(item.label),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        );
      },
    );
  }
}


class NewsDetailScreen extends StatelessWidget {
  final NewsItem news;
  const NewsDetailScreen({super.key, required this.news});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EVColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── Hero header ──────────────────────
          SliverToBoxAdapter(
            child: Container(
              height: 280,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [news.gradientStart, news.gradientEnd],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Stack(
                children: [
                  // Dekoratif daireler
                  Positioned(top: -40, right: -40,
                    child: Container(width: 200, height: 200,
                      decoration: BoxDecoration(shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.07)))),
                  Positioned(bottom: -60, left: -60,
                    child: Container(width: 240, height: 240,
                      decoration: BoxDecoration(shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.05)))),

                  // Geri butonu
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 12,
                    left: 16,
                    child: GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 38, height: 38,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.20),
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: Colors.white.withValues(alpha: 0.30)),
                        ),
                        child: const Icon(Icons.arrow_back_ios_new_rounded,
                            color: Colors.white, size: 16),
                      ),
                    ),
                  ),

                  // Kategori + süre
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 12,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.20),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(news.readTime, style: const TextStyle(
                        fontSize: 11, color: Colors.white,
                        fontWeight: FontWeight.w500,
                      )),
                    ),
                  ),

                  // İkon + başlık
                  Positioned(
                    bottom: 24, left: 20, right: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.20),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(news.icon, size: 12, color: Colors.white),
                              const SizedBox(width: 5),
                              Text(news.category, style: const TextStyle(
                                fontSize: 11, color: Colors.white,
                                fontWeight: FontWeight.w600,
                              )),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(news.title, style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w800,
                          color: Colors.white, height: 1.3,
                          letterSpacing: -0.4,
                        )),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── İçerik ──────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Özet
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: EVColors.primaryLight,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: EVColors.primaryMid),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline_rounded,
                            color: EVColors.primary, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(news.subtitle, style: const TextStyle(
                            fontSize: 13, color: EVColors.textSecondary,
                            height: 1.5,
                          )),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Makale içeriği
                  Text(news.content, style: const TextStyle(
                    fontSize: 15, color: EVColors.textPrimary,
                    height: 1.75, letterSpacing: 0.1,
                  )),

                  const SizedBox(height: 32),

                  // Paylaş butonu
                  _NewsActionBar(newsId: news.id),
const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
  }
class _NewsActionBar extends StatefulWidget {
  final String newsId;
  const _NewsActionBar({required this.newsId});

  @override
  State<_NewsActionBar> createState() => _NewsActionBarState();
}

class _NewsActionBarState extends State<_NewsActionBar> {
  bool _liked = false;
  int _likes = 0;
  final List<_NewsComment> _comments = [];
  final _commentCtrl = TextEditingController();

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  void _showComments() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: const BoxDecoration(
            color: EVColors.background,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
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
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                child: Row(children: [
                  Text('${_comments.length} Yorum', style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700,
                    color: EVColors.textPrimary,
                  )),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.pop(ctx),
                    child: Container(
                      width: 28, height: 28,
                      decoration: BoxDecoration(
                          color: EVColors.divider, shape: BoxShape.circle),
                      child: const Icon(Icons.close_rounded,
                          size: 14, color: EVColors.textSecondary),
                    ),
                  ),
                ]),
              ),
              const Divider(height: 1, color: EVColors.divider),
              Expanded(
                child: _comments.isEmpty
                    ? const Center(child: Text('İlk yorumu sen yap!',
                        style: TextStyle(color: EVColors.textHint, fontSize: 13)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _comments.length,
                        itemBuilder: (_, i) {
                          final c = _comments[i];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 34, height: 34,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: EVColors.primaryLight,
                                  ),
                                  child: const Icon(Icons.person_rounded,
                                      color: EVColors.primary, size: 18),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: EVColors.surface,
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(color: EVColors.border),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(children: [
                                          const Text('Sen', style: TextStyle(
                                            fontSize: 12, fontWeight: FontWeight.w700,
                                            color: EVColors.textPrimary,
                                          )),
                                          const SizedBox(width: 6),
                                          Text(c.timeAgo, style: const TextStyle(
                                            fontSize: 10, color: EVColors.textHint,
                                          )),
                                        ]),
                                        const SizedBox(height: 4),
                                        Text(c.text, style: const TextStyle(
                                          fontSize: 13, color: EVColors.textSecondary,
                                          height: 1.4,
                                        )),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
              Container(
                padding: EdgeInsets.fromLTRB(16, 10, 16,
                    MediaQuery.of(context).viewInsets.bottom + 10),
                decoration: const BoxDecoration(
                  color: EVColors.surface,
                  border: Border(top: BorderSide(color: EVColors.divider)),
                ),
                child: Row(children: [
                  Container(
                    width: 34, height: 34,
                    decoration: const BoxDecoration(
                        shape: BoxShape.circle, color: EVColors.primaryLight),
                    child: const Icon(Icons.person_rounded,
                        color: EVColors.primary, size: 18),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: EVColors.background,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: EVColors.border),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: TextField(
                        controller: _commentCtrl,
                        style: const TextStyle(
                            fontSize: 13, color: EVColors.textPrimary),
                        decoration: const InputDecoration(
                          hintText: 'Yorum yaz…',
                          hintStyle: TextStyle(
                              color: EVColors.textHint, fontSize: 13),
                          border: InputBorder.none,
                          isDense: true,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: () {
                      final text = _commentCtrl.text.trim();
                      if (text.isEmpty) return;
                      setS(() {
                        setState(() {
                          _comments.insert(0, _NewsComment(
                              text: text, timeAgo: 'Şimdi'));
                          _commentCtrl.clear();
                        });
                      });
                      HapticFeedback.lightImpact();
                    },
                    child: Container(
                      width: 40, height: 40,
                      decoration: const BoxDecoration(
                          color: EVColors.primary, shape: BoxShape.circle),
                      child: const Icon(Icons.send_rounded,
                          color: Colors.white, size: 17),
                    ),
                  ),
                ]),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          setState(() {
            _liked = !_liked;
            _likes += _liked ? 1 : -1;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: _liked ? EVColors.primaryLight : EVColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
                color: _liked ? EVColors.primary : EVColors.border),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(_liked ? Icons.bolt_rounded : Icons.bolt_outlined,
                color: _liked ? EVColors.primary : EVColors.textHint,
                size: 18),
            const SizedBox(width: 6),
            Text(_likes > 0 ? '$_likes Beğeni' : 'Beğen',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _liked ? EVColors.primary : EVColors.textHint)),
          ]),
        ),
      ),
      const SizedBox(width: 10),
      GestureDetector(
        onTap: _showComments,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: EVColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: EVColors.border),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.chat_bubble_outline_rounded,
                color: EVColors.textHint, size: 18),
            const SizedBox(width: 6),
            Text(
                _comments.isEmpty
                    ? 'Yorum Yap'
                    : '${_comments.length} Yorum',
                style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: EVColors.textHint)),
          ]),
        ),
      ),
      const Spacer(),
      GestureDetector(
        onTap: () {},
        child: Container(
          width: 42, height: 42,
          decoration: BoxDecoration(
            color: EVColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: EVColors.border),
          ),
          child: const Icon(Icons.share_outlined,
              color: EVColors.textHint, size: 18),
        ),
      ),
    ]);
  }
}

class _NewsComment {
  final String text, timeAgo;
  const _NewsComment({required this.text, required this.timeAgo});
}