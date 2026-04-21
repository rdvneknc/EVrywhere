import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'forum_detail_screen.dart';

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
}

// ─────────────────────────────────────────────
//  MODELS
// ─────────────────────────────────────────────
class ForumCategory {
  final String id, label, emoji;
  const ForumCategory({required this.id, required this.label, required this.emoji});
}

class ForumBrand {
  final String id, name, emoji;
  final Color color;
  final int threadCount;
  const ForumBrand({
    required this.id, required this.name,
    required this.emoji, required this.color, required this.threadCount,
  });
}

class ForumTopic {
  final String id, title, excerpt, authorName, authorInitials;
  final Color authorColor;
  final String categoryId, brandId, timeAgo, readTime;
  final int replies, views;
  final bool isPinned, isHot;
  final List<ForumComment> comments;

  ForumTopic({
    required this.id, required this.title, required this.excerpt,
    required this.authorName, required this.authorInitials,
    required this.authorColor, required this.categoryId,
    required this.brandId, required this.timeAgo, required this.readTime,
    required this.replies, required this.views,
    this.isPinned = false, this.isHot = false,
    required this.comments,
  });
}

class ForumComment {
  final String authorName, authorInitials, text, timeAgo;
  final Color authorColor;
  int likes;
  ForumComment({
    required this.authorName, required this.authorInitials,
    required this.text, required this.timeAgo,
    required this.authorColor, this.likes = 0,
  });
}

// ─────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────
const List<ForumCategory> kCategories = [
  ForumCategory(id: 'all',      label: 'Tümü',                emoji: '🌐'),
  ForumCategory(id: 'general',  label: 'Genel',               emoji: '💬'),
  ForumCategory(id: 'charging', label: 'Şarj',                emoji: '⚡'),
  ForumCategory(id: 'tech',     label: 'Teknik',              emoji: '🔧'),
  ForumCategory(id: 'trips',    label: 'Yolculuk',            emoji: '🗺'),
  ForumCategory(id: 'news',     label: 'Haberler',            emoji: '📰'),
  ForumCategory(id: 'secondhand', label: 'İkinci El',         emoji: '🔄'),
  ForumCategory(id: 'meetup',   label: 'Organizasyon & Buluşma', emoji: '📍'),
];

const List<ForumBrand> kBrands = [
  ForumBrand(id: 'all',      name: 'Tümü',     emoji: '🚗', color: Color(0xFF2DC653), threadCount: 0),
  ForumBrand(id: 'tesla',    name: 'Tesla',     emoji: '⚡', color: Color(0xFFCC0000), threadCount: 284),
  ForumBrand(id: 'togg',     name: 'Togg',      emoji: '🇹🇷', color: Color(0xFF2DC653), threadCount: 156),
  ForumBrand(id: 'bmw',      name: 'BMW',       emoji: '🔵', color: Color(0xFF1C69D4), threadCount: 159),
  ForumBrand(id: 'hyundai',  name: 'Hyundai',   emoji: '🅗',  color: Color(0xFF00287A), threadCount: 211),
  ForumBrand(id: 'kia',      name: 'Kia',       emoji: '🏁', color: Color(0xFF05141F), threadCount: 178),
  ForumBrand(id: 'porsche',  name: 'Porsche',   emoji: '🏆', color: Color(0xFFAE8753), threadCount: 74),
  ForumBrand(id: 'audi',     name: 'Audi',      emoji: '⬤',  color: Color(0xFFBB0A21), threadCount: 142),
  ForumBrand(id: 'volvo',    name: 'Volvo',     emoji: '🛡',  color: Color(0xFF003057), threadCount: 88),
  ForumBrand(id: 'renault',  name: 'Renault',   emoji: '💎', color: Color(0xFFFFCC00), threadCount: 97),
  ForumBrand(id: 'mercedes', name: 'Mercedes',  emoji: '⭐', color: Color(0xFF1C1C1C), threadCount: 136),
];

List<ForumTopic> buildTopics() => [
  ForumTopic(
    id: '1', categoryId: 'charging', brandId: 'tesla',
    title: 'Tesla Model Y için ev şarj kurulumu — ne kadar harcadım?',
    excerpt: 'Hem EATON hem Wallbox teklifi aldım. Aradaki fark çarpıcıydı, detayları paylaşıyorum.',
    authorName: 'Alex Morgan', authorInitials: 'AM', authorColor: Color(0xFF2DC653),
    timeAgo: '12 dk önce', readTime: '4 dk', replies: 34, views: 821,
    isPinned: true,
    comments: [
      ForumComment(authorName: 'Sam Chen', authorInitials: 'SC', authorColor: Color(0xFF378ADD),
          text: 'Wallbox seçimi doğru olmuş, bende de aynı deneyim vardı.', timeAgo: '5 dk önce', likes: 8),
      ForumComment(authorName: 'Priya N.', authorInitials: 'PN', authorColor: Color(0xFFEF9F27),
          text: 'Elektrikçi ücretleri şehre göre çok değişiyor.', timeAgo: '10 dk önce', likes: 3),
    ],
  ),
  ForumTopic(
    id: '2', categoryId: 'general', brandId: 'togg',
    title: 'Togg T10X — 3 ay kullandım, dürüst değerlendirme',
    excerpt: 'Yerli araç heyecanı bir kenara, gerçekten günlük kullanıma uygun mu?',
    authorName: 'Sofia Ruiz', authorInitials: 'SR', authorColor: Color(0xFF7F77DD),
    timeAgo: '1 saat önce', readTime: '6 dk', replies: 58, views: 1340, isHot: true,
    comments: [
      ForumComment(authorName: 'Mert K.', authorInitials: 'MK', authorColor: Color(0xFF2DC653),
          text: 'Şarj ağı hızla genişliyor, bu büyük artı.', timeAgo: '30 dk önce', likes: 12),
    ],
  ),
  ForumTopic(
    id: '3', categoryId: 'trips', brandId: 'bmw',
    title: 'BMW iX ile Türkiye kıyı şeridi turu — 1800 km raporu',
    excerpt: 'İstanbul\'dan Antalya\'ya, oradan İzmir\'e. Şarj planı, gerçek tüketim ve sürprizler.',
    authorName: 'Marcus Webb', authorInitials: 'MW', authorColor: Color(0xFFEF9F27),
    timeAgo: '3 saat önce', readTime: '8 dk', replies: 22, views: 610,
    comments: [],
  ),
  ForumTopic(
    id: '4', categoryId: 'tech', brandId: 'hyundai',
    title: 'IONIQ 6 yazılım güncellemesi — V2L özelliği nasıl çalışıyor?',
    excerpt: 'Son OTA güncellemesiyle gelen V2L özelliğini test ettim. Kampçılar için ideal.',
    authorName: 'Priya Nair', authorInitials: 'PN', authorColor: Color(0xFF378ADD),
    timeAgo: '5 saat önce', readTime: '5 dk', replies: 47, views: 992, isHot: true,
    comments: [
      ForumComment(authorName: 'Jordan L.', authorInitials: 'JL', authorColor: Color(0xFFD4537E),
          text: 'Şehir dışı kamp için mükemmel özellik!', timeAgo: '2 saat önce', likes: 15),
    ],
  ),
  ForumTopic(
    id: '5', categoryId: 'news', brandId: 'all',
    title: 'ZES 2025 şarj ağı genişleme planı açıklandı',
    excerpt: 'ZES bu yıl 500 yeni nokta kuracak. Hangi şehirler öncelikli?',
    authorName: 'Jordan Lee', authorInitials: 'JL', authorColor: Color(0xFFD4537E),
    timeAgo: '1 gün önce', readTime: '3 dk', replies: 91, views: 2100, isPinned: true,
    comments: [],
  ),
  ForumTopic(
    id: '6', categoryId: 'general', brandId: 'porsche',
    title: 'Porsche Taycan vs Tesla Model S — hangisi gerçekten daha iyi?',
    excerpt: 'İki premium EV\'yi 6 ay arayla kullandım. Fiyat/performans, şarj hızı ve sürüş keyfi.',
    authorName: 'Jordan Lee', authorInitials: 'JL', authorColor: Color(0xFFD4537E),
    timeAgo: '2 gün önce', readTime: '7 dk', replies: 113, views: 3800, isHot: true,
    comments: [
      ForumComment(authorName: 'Sofia R.', authorInitials: 'SR', authorColor: Color(0xFF7F77DD),
          text: 'Taycan sürüş keyfi konusunda tartışmasız üstün.', timeAgo: '1 gün önce', likes: 23),
    ],
  ),
  ForumTopic(
    id: '7', categoryId: 'charging', brandId: 'all',
    title: 'Türkiye şarj ağlarını karşılaştırdım — 2025 güncel',
    excerpt: 'ZES, Togg HızlıŞarj, Eşarj ve BP Pulse — fiyat, hız ve kapsama analizi.',
    authorName: 'Sam Chen', authorInitials: 'SC', authorColor: Color(0xFF378ADD),
    timeAgo: '3 gün önce', readTime: '10 dk', replies: 67, views: 1850,
    comments: [],
  ),
  ForumTopic(
    id: '8', categoryId: 'tech', brandId: 'kia',
    title: 'Kia EV9 — 7 kişilik ailemi EV\'e geçirdi',
    excerpt: 'Geniş aile araçlarında EV seçenekleri kısıtlıydı. EV9 bu boşluğu kapatıyor mu?',
    authorName: 'Marcus Webb', authorInitials: 'MW', authorColor: Color(0xFFEF9F27),
    timeAgo: '4 gün önce', readTime: '6 dk', replies: 39, views: 720,
    comments: [],
  ),
];

// ─────────────────────────────────────────────
//  FORUM SCREEN
// ─────────────────────────────────────────────
class ForumScreen extends StatefulWidget {
  const ForumScreen({super.key});
  @override
  State<ForumScreen> createState() => _ForumScreenState();
}

class _ForumScreenState extends State<ForumScreen> {
  late List<ForumTopic> _topics;
  String _activeCategoryId = 'all';
  String _activeBrandId    = 'all';
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _topics = buildTopics();
    @override
void initState() {
  super.initState();
  _topics = buildTopics();
  _loadTopicsFromFirestore(); // ← EKLE
  _searchCtrl.addListener(
      () => setState(() => _searchQuery = _searchCtrl.text.toLowerCase()));
}
    _searchCtrl.addListener(
        () => setState(() => _searchQuery = _searchCtrl.text.toLowerCase()));
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }
  Future<void> _loadTopicsFromFirestore() async {
  try {
    final snap = await FirebaseFirestore.instance
        .collection('forum_topics')
        .orderBy('createdAt', descending: true)
        .limit(30)
        .get();
    for (final doc in snap.docs) {
      final d = doc.data();
      final topic = ForumTopic(
        id: doc.id,
        title: d['title'] ?? '',
        excerpt: d['excerpt'] ?? '',
        authorName: d['authorName'] ?? 'Kullanıcı',
        authorInitials: d['authorInitials'] ?? 'KU',
        authorColor: EVColors.primary,
        categoryId: d['categoryId'] ?? 'general',
        brandId: d['brandId'] ?? 'all',
        timeAgo: 'Yakın zamanda',
        readTime: '1 dk',
        replies: d['replies'] ?? 0,
        views: d['views'] ?? 0,
        isPinned: d['isPinned'] ?? false,
        isHot: d['isHot'] ?? false,
        comments: [],
      );
      if (!_topics.any((t) => t.id == topic.id)) {
        setState(() => _topics.insert(0, topic));
      }
    }
  } catch (e) {
    debugPrint('Forum load error: $e');
  }
}

  List<ForumTopic> get _filtered => _topics.where((t) {
    final catOk   = _activeCategoryId == 'all' || t.categoryId == _activeCategoryId;
    final brandOk = _activeBrandId    == 'all' || t.brandId    == _activeBrandId
        || (t.brandId == 'all' && _activeBrandId != 'all' ? false : true);
    final searchOk = _searchQuery.isEmpty ||
        t.title.toLowerCase().contains(_searchQuery) ||
        t.excerpt.toLowerCase().contains(_searchQuery);
    return catOk && brandOk && searchOk;
  }).toList();

  void _openDetail(ForumTopic topic) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ForumDetailScreen(
          topic: topic,
          onCommentAdded: (c) => setState(() => topic.comments.insert(0, c)),
        ),
      ),
    );
  }

  void _showNewTopicSheet() {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _NewTopicSheet(
       // SONRA:
onSubmit: (title, excerpt, categoryId, brandId) async {
  final newTopic = ForumTopic(
    id: DateTime.now().millisecondsSinceEpoch.toString(),
    title: title, excerpt: excerpt,
    authorName: 'Sen', authorInitials: 'SE',
    authorColor: EVColors.primary,
    categoryId: categoryId,
brandId: brandId,
    timeAgo: 'Şimdi', readTime: '1 dk',
    replies: 0, views: 1, comments: [],
  );
  setState(() => _topics.insert(0, newTopic));

  // Firestore'a kaydet
  try {
    await FirebaseFirestore.instance
        .collection('forum_topics')
        .doc(newTopic.id)
        .set({
      'title': newTopic.title,
      'excerpt': newTopic.excerpt,
      'authorName': newTopic.authorName,
      'authorInitials': newTopic.authorInitials,
      'categoryId': newTopic.categoryId,
      'brandId': newTopic.brandId,
      'replies': 0,
      'views': 1,
      'isPinned': false,
      'isHot': false,
      'createdAt': FieldValue.serverTimestamp(),
    });
  } catch (e) {
    debugPrint('Forum topic save error: $e');
  }

  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: const Text('Konu oluşturuldu! 🎉',
        style: TextStyle(fontWeight: FontWeight.w600)),
    backgroundColor: EVColors.primary,
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    margin: const EdgeInsets.all(16),
  ));
},
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return Scaffold(
      backgroundColor: EVColors.background,
      floatingActionButton: _NewTopicFab(onTap: _showNewTopicSheet),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _ForumAppBar(topicCount: filtered.length)),
          SliverToBoxAdapter(child: _SearchBar(controller: _searchCtrl)),
          SliverToBoxAdapter(child: _CategoryChips(
            categories: kCategories,
            activeId: _activeCategoryId,
            onChanged: (id) => setState(() => _activeCategoryId = id),
          )),
          SliverToBoxAdapter(child: _BrandSelector(
            brands: kBrands,
            activeId: _activeBrandId,
            onChanged: (id) => setState(() => _activeBrandId = id),
          )),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${filtered.length} Konu', style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700,
                    color: EVColors.textPrimary, letterSpacing: -0.3,
                  )),
                  const Text('En Yeni', style: TextStyle(
                    fontSize: 12, color: EVColors.primary,
                    fontWeight: FontWeight.w500,
                  )),
                ],
              ),
            ),
          ),
          filtered.isEmpty
              ? SliverToBoxAdapter(child: _EmptyState())
              : SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => _TopicCard(
                        topic: filtered[i],
                        onTap: () => _openDetail(filtered[i])),
                    childCount: filtered.length,
                  ),
                ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  APP BAR
// ─────────────────────────────────────────────
class _ForumAppBar extends StatelessWidget {
  final int topicCount;
  const _ForumAppBar({required this.topicCount});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 56, 20, 0),
      child: Row(
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Topluluk', style: TextStyle(fontSize: 13, color: EVColors.textHint)),
                SizedBox(height: 2),
                Text('Forum', style: TextStyle(
                  fontSize: 28, fontWeight: FontWeight.w800,
                  color: EVColors.textPrimary, letterSpacing: -0.6,
                )),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: EVColors.primaryLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: EVColors.primaryMid),
            ),
            child: Column(children: [
              Text('$topicCount', style: const TextStyle(
                fontSize: 18, fontWeight: FontWeight.w800,
                color: EVColors.primary, letterSpacing: -0.4,
              )),
              const Text('konu', style: TextStyle(
                fontSize: 10, color: EVColors.textSecondary,
                fontWeight: FontWeight.w500,
              )),
            ]),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  SEARCH BAR
// ─────────────────────────────────────────────
class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  const _SearchBar({required this.controller});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Container(
        height: 46,
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: EVColors.border),
        ),
        child: Row(children: [
          const SizedBox(width: 14),
          const Icon(Icons.search_rounded, color: EVColors.textHint, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              style: const TextStyle(fontSize: 14, color: EVColors.textPrimary),
              decoration: const InputDecoration(
                hintText: 'Konu, marka veya içerik ara…',
                hintStyle: TextStyle(color: EVColors.textHint, fontSize: 14),
                border: InputBorder.none, isDense: true,
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  CATEGORY CHIPS
// ─────────────────────────────────────────────
class _CategoryChips extends StatelessWidget {
  final List<ForumCategory> categories;
  final String activeId;
  final ValueChanged<String> onChanged;
  const _CategoryChips({required this.categories, required this.activeId, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final cat = categories[i];
          final active = cat.id == activeId;
          return GestureDetector(
            onTap: () => onChanged(cat.id),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: active ? EVColors.primary : EVColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: active ? EVColors.primary : EVColors.border),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(cat.emoji, style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 5),
                Text(cat.label, style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w600,
                  color: active ? EVColors.onPrimary : EVColors.textSecondary,
                )),
              ]),
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  BRAND SELECTOR
// ─────────────────────────────────────────────
class _BrandSelector extends StatefulWidget {
  final List<ForumBrand> brands;
  final String activeId;
  final ValueChanged<String> onChanged;
  const _BrandSelector({
    required this.brands,
    required this.activeId,
    required this.onChanged,
  });

  @override
  State<_BrandSelector> createState() => _BrandSelectorState();
}

class _BrandSelectorState extends State<_BrandSelector> {
  bool _expanded = false;

  // Tümü hariç markalar, alfabetik sıralı
  List<ForumBrand> get _brandsOnly =>
      widget.brands.where((b) => b.id != 'all').toList()
        ..sort((a, b) => a.name.compareTo(b.name));

  // Yatay çubukta ilk 4 marka
  List<ForumBrand> get _visibleBrands => _brandsOnly.take(4).toList();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 16, 20, 10),
          child: Text('Markaya Göre', style: TextStyle(
            fontSize: 13, fontWeight: FontWeight.w600,
            color: EVColors.textSecondary,
          )),
        ),

        // ── Yatay çubuk ──────────────────────────
        SizedBox(
          height: 76,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            children: [
              // İlk 4 marka
              ..._visibleBrands.map((brand) {
                final active = brand.id == widget.activeId;
                return GestureDetector(
                  onTap: () {
                    widget.onChanged(brand.id);
                    if (_expanded) setState(() => _expanded = false);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: 72,
                    margin: const EdgeInsets.only(right: 10),
                    decoration: BoxDecoration(
                      color: active
                          ? brand.color.withValues(alpha: 0.12)
                          : EVColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: active
                            ? brand.color.withValues(alpha: 0.5)
                            : EVColors.border,
                        width: active ? 1.5 : 1.0,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(brand.emoji,
                            style: const TextStyle(fontSize: 22)),
                        const SizedBox(height: 4),
                        Text(brand.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: active
                                ? brand.color
                                : EVColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),

              // "Tümünü Gör" butonu
              GestureDetector(
                onTap: () => setState(() => _expanded = !_expanded),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 72,
                  decoration: BoxDecoration(
                    color: _expanded
                        ? EVColors.primaryLight
                        : EVColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _expanded
                          ? EVColors.primary
                          : EVColors.border,
                      width: _expanded ? 1.5 : 1.0,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AnimatedRotation(
                        turns: _expanded ? 0.5 : 0,
                        duration: const Duration(milliseconds: 220),
                        child: Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: _expanded
                              ? EVColors.primary
                              : EVColors.textHint,
                          size: 26,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _expanded ? 'Kapat' : 'Tümünü\nGör',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                          color: _expanded
                              ? EVColors.primary
                              : EVColors.textHint,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // ── Alfabetik liste (açılır) ──────────────
        AnimatedCrossFade(
          duration: const Duration(milliseconds: 260),
          crossFadeState: _expanded
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          firstChild: const SizedBox.shrink(),
          secondChild: Container(
            margin: const EdgeInsets.fromLTRB(20, 10, 20, 0),
            decoration: BoxDecoration(
              color: EVColors.surface,
              borderRadius: BorderRadius.circular(18),
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
                // Başlık + "Tümünü Sıfırla"
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                  child: Row(
                    children: [
                      const Text('Tüm Markalar', style: TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w700,
                        color: EVColors.textPrimary,
                      )),
                      const Spacer(),
                      GestureDetector(
                        onTap: () {
                          widget.onChanged('all');
                          setState(() => _expanded = false);
                        },
                        child: const Text('Tümünü Göster', style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w500,
                          color: EVColors.primary,
                        )),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: EVColors.divider),

                // Alfabetik liste
                ..._brandsOnly.map((brand) {
                  final active = brand.id == widget.activeId;
                  return GestureDetector(
                    onTap: () {
                      widget.onChanged(brand.id);
                      setState(() => _expanded = false);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      color: active
                          ? brand.color.withValues(alpha: 0.06)
                          : Colors.transparent,
                      child: Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                // Logo dairesi
                                Container(
                                  width: 40, height: 40,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: brand.color.withValues(alpha: 0.12),
                                    border: Border.all(
                                      color: active
                                          ? brand.color.withValues(alpha: 0.5)
                                          : brand.color.withValues(alpha: 0.20),
                                    ),
                                  ),
                                  child: Center(
                                    child: Text(brand.emoji,
                                        style: const TextStyle(fontSize: 18)),
                                  ),
                                ),
                                const SizedBox(width: 14),

                                // Marka adı
                                Expanded(
                                  child: Text(brand.name, style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: active
                                        ? FontWeight.w700
                                        : FontWeight.w500,
                                    color: active
                                        ? brand.color
                                        : EVColors.textPrimary,
                                  )),
                                ),

                                // Konu sayısı
                                if (brand.threadCount > 0)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: active
                                          ? brand.color.withValues(alpha: 0.12)
                                          : EVColors.background,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text('${brand.threadCount} konu',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                        color: active
                                            ? brand.color
                                            : EVColors.textHint,
                                      ),
                                    ),
                                  ),

                                const SizedBox(width: 8),

                                // Seçili işareti
                                Icon(
                                  active
                                      ? Icons.check_circle_rounded
                                      : Icons.chevron_right_rounded,
                                  color: active
                                      ? brand.color
                                      : EVColors.textHint,
                                  size: 18,
                                ),
                              ],
                            ),
                          ),
                          const Divider(height: 1, color: EVColors.divider),
                        ],
                      ),
                    ),
                  );
                }),

                const SizedBox(height: 4),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
//  TOPIC CARD
// ─────────────────────────────────────────────
class _TopicCard extends StatelessWidget {
  final ForumTopic topic;
  final VoidCallback onTap;
  const _TopicCard({required this.topic, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: EVColors.border),
          boxShadow: [BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10, offset: const Offset(0, 3),
          )],
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Badges
          Row(children: [
            _CategoryBadge(categoryId: topic.categoryId),
            if (topic.isPinned) ...[
              const SizedBox(width: 6),
              _Badge(label: '📌 Sabit',
                  bg: const Color(0xFFFFF8E1), fg: const Color(0xFFBF6D00)),
            ],
            if (topic.isHot) ...[
              const SizedBox(width: 6),
              _Badge(label: '🔥 Popüler',
                  bg: const Color(0xFFFFEBEE), fg: const Color(0xFFC62828)),
            ],
            if (topic.brandId != 'all') ...[
              const Spacer(),
              _BrandMini(brandId: topic.brandId),
            ],
          ]),
          const SizedBox(height: 10),
          Text(topic.title,
            maxLines: 2, overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w700,
              color: EVColors.textPrimary, height: 1.35, letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 5),
          Text(topic.excerpt,
            maxLines: 2, overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12, color: EVColors.textSecondary, height: 1.5,
            ),
          ),
          const SizedBox(height: 12),
          Row(children: [
            _AuthorAvatar(initials: topic.authorInitials, color: topic.authorColor),
            const SizedBox(width: 7),
            Expanded(child: Text(topic.authorName, style: const TextStyle(
              fontSize: 11, fontWeight: FontWeight.w600,
              color: EVColors.textSecondary,
            ))),
            _Stat(icon: Icons.chat_bubble_outline_rounded, value: topic.replies),
            const SizedBox(width: 10),
            _Stat(icon: Icons.remove_red_eye_outlined, value: topic.views),
            const SizedBox(width: 10),
            Text(topic.timeAgo, style: const TextStyle(
              fontSize: 10, color: EVColors.textHint,
            )),
          ]),
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  SMALL REUSABLE WIDGETS
// ─────────────────────────────────────────────
class _CategoryBadge extends StatelessWidget {
  final String categoryId;
  const _CategoryBadge({required this.categoryId});

  @override
  Widget build(BuildContext context) {
    const map = {
      'general':  ('💬 Genel',    Color(0xFFE8F9ED), Color(0xFF1A8C40)),
      'charging': ('⚡ Şarj',     Color(0xFFE8F3FC), Color(0xFF185FA5)),
      'tech':     ('🔧 Teknik',   Color(0xFFFFF3E0), Color(0xFFBF6D00)),
      'trips':    ('🗺 Yolculuk', Color(0xFFF3EEFE), Color(0xFF5E35B1)),
      'news':     ('📰 Haberler', Color(0xFFFFEBEE), Color(0xFFC62828)),
    };
    final d = map[categoryId] ??
        ('💬 Genel', const Color(0xFFE8F9ED), const Color(0xFF1A8C40));
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(color: d.$2, borderRadius: BorderRadius.circular(20)),
      child: Text(d.$1, style: TextStyle(
        fontSize: 10, fontWeight: FontWeight.w600, color: d.$3,
      )),
    );
  }
}

class _BrandMini extends StatelessWidget {
  final String brandId;
  const _BrandMini({required this.brandId});
  @override
  Widget build(BuildContext context) {
    final brand = kBrands.firstWhere((b) => b.id == brandId, orElse: () => kBrands.first);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: brand.color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: brand.color.withValues(alpha: 0.25)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(brand.emoji, style: const TextStyle(fontSize: 10)),
        const SizedBox(width: 3),
        Text(brand.name, style: TextStyle(
          fontSize: 9, fontWeight: FontWeight.w700, color: brand.color,
        )),
      ]),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color bg, fg;
  const _Badge({required this.label, required this.bg, required this.fg});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(
      fontSize: 10, fontWeight: FontWeight.w600, color: fg,
    )),
  );
}

class _AuthorAvatar extends StatelessWidget {
  final String initials;
  final Color color;
  const _AuthorAvatar({required this.initials, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    width: 26, height: 26,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: color.withValues(alpha: 0.15),
      border: Border.all(color: color.withValues(alpha: 0.30)),
    ),
    child: Center(child: Text(initials, style: TextStyle(
      fontSize: 9, fontWeight: FontWeight.w700, color: color,
    ))),
  );
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final int value;
  const _Stat({required this.icon, required this.value});
  String _fmt(int n) => n >= 1000 ? '${(n / 1000).toStringAsFixed(1)}k' : '$n';
  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, size: 12, color: EVColors.textHint),
    const SizedBox(width: 3),
    Text(_fmt(value), style: const TextStyle(
      fontSize: 10, color: EVColors.textHint, fontWeight: FontWeight.w500,
    )),
  ]);
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(vertical: 60),
    child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.forum_outlined, color: EVColors.textHint, size: 48),
      SizedBox(height: 12),
      Text('Bu filtreyle konu bulunamadı', style: TextStyle(
        fontSize: 14, color: EVColors.textHint, fontWeight: FontWeight.w500,
      )),
    ])),
  );
}

// ─────────────────────────────────────────────
//  NEW TOPIC FAB
// ─────────────────────────────────────────────
class _NewTopicFab extends StatelessWidget {
  final VoidCallback onTap;
  const _NewTopicFab({required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: EVColors.primary,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(
          color: EVColors.primary.withValues(alpha: 0.35),
          blurRadius: 16, offset: const Offset(0, 6),
        )],
      ),
      child: const Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.edit_rounded, color: Colors.white, size: 17),
        SizedBox(width: 8),
        Text('Yeni Konu', style: TextStyle(
          fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white,
        )),
      ]),
    ),
  );
}

// ─────────────────────────────────────────────
//  NEW TOPIC SHEET
// ─────────────────────────────────────────────
class _NewTopicSheet extends StatefulWidget {
  final void Function(String title, String excerpt, String categoryId, String brandId) onSubmit;
  const _NewTopicSheet({required this.onSubmit});
  @override
  State<_NewTopicSheet> createState() => _NewTopicSheetState();
}

class _NewTopicSheetState extends State<_NewTopicSheet> {
  final _titleCtrl   = TextEditingController();
  final _excerptCtrl = TextEditingController();
  String _selectedCategory = 'general';
  String _selectedBrand = 'all';

  @override
  void dispose() { _titleCtrl.dispose(); _excerptCtrl.dispose(); super.dispose(); }

  static const Map<String, Color> _catColors = {
    'general':    Color(0xFF378ADD),
    'charging':   Color(0xFF2DC653),
    'tech':       Color(0xFF9B59B6),
    'trips':      Color(0xFFEF9F27),
    'news':       Color(0xFFD4537E),
    'secondhand': Color(0xFF20B2AA),
    'meetup':     Color(0xFFFF6B35),
  };

  void _pickCategory() {
    final cats = kCategories.where((c) => c.id != 'all').toList();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _PickerSheet(
        title: 'Kategori Seç',
        child: SizedBox(
          height: 300,
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            itemCount: cats.length,
            itemBuilder: (_, i) {
              final cat = cats[i];
              final color = _catColors[cat.id] ?? EVColors.primary;
              final active = cat.id == _selectedCategory;
              return GestureDetector(
                onTap: () {
                  setState(() => _selectedCategory = cat.id);
                  Navigator.pop(context);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: active ? color.withValues(alpha: 0.10) : EVColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: active ? color.withValues(alpha: 0.5) : EVColors.border,
                      width: active ? 1.5 : 1,
                    ),
                  ),
                  child: Row(children: [
                    Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text(cat.emoji, style: const TextStyle(fontSize: 18)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(cat.label, style: TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w600,
                        color: active ? color : EVColors.textPrimary,
                      )),
                    ),
                    if (active)
                      Icon(Icons.check_circle_rounded, color: color, size: 18),
                  ]),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  void _pickBrand() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _PickerSheet(
        title: 'Marka Seç',
        child: SizedBox(
          height: 300,
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            itemCount: kBrands.length,
            itemBuilder: (_, i) {
              final brand = kBrands[i];
              final active = brand.id == _selectedBrand;
              return GestureDetector(
                onTap: () {
                  setState(() => _selectedBrand = brand.id);
                  Navigator.pop(context);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: active
                        ? brand.color.withValues(alpha: 0.10)
                        : EVColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: active
                          ? brand.color.withValues(alpha: 0.5)
                          : EVColors.border,
                      width: active ? 1.5 : 1,
                    ),
                  ),
                  child: Row(children: [
                    Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(
                        color: brand.color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text(brand.emoji,
                            style: const TextStyle(fontSize: 18)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(brand.name, style: TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w600,
                        color: active ? brand.color : EVColors.textPrimary,
                      )),
                    ),
                    if (active)
                      Icon(Icons.check_circle_rounded,
                          color: brand.color, size: 18),
                  ]),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildSelector({
    required String label,
    required String emoji,
    required String displayName,
    required Color accentColor,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(
          fontSize: 12, fontWeight: FontWeight.w600,
          color: EVColors.textSecondary,
        )),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: accentColor.withValues(alpha: 0.35),
                width: 1.5,
              ),
            ),
            child: Row(children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(emoji, style: const TextStyle(fontSize: 16)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(displayName, style: TextStyle(
                  fontSize: 14, fontWeight: FontWeight.w600,
                  color: accentColor,
                )),
              ),
              Icon(Icons.keyboard_arrow_down_rounded,
                  color: accentColor.withValues(alpha: 0.6), size: 20),
            ]),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    final selCat = kCategories.firstWhere((c) => c.id == _selectedCategory,
        orElse: () => kCategories.first);
    final selBrand = kBrands.firstWhere((b) => b.id == _selectedBrand,
        orElse: () => kBrands.first);
    final catColor = _catColors[_selectedCategory] ?? EVColors.primary;

    return Container(
      padding: EdgeInsets.fromLTRB(20, 0, 20, bottom + 20),
      decoration: const BoxDecoration(
        color: EVColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 16),
            child: Container(width: 36, height: 4,
              decoration: BoxDecoration(
                color: EVColors.textHint.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          )),
          const Text('Yeni Konu Oluştur', style: TextStyle(
            fontSize: 18, fontWeight: FontWeight.w700, color: EVColors.textPrimary,
          )),
          const SizedBox(height: 20),

          // Kategori seçici
          _buildSelector(
            label: 'Kategori',
            emoji: selCat.emoji,
            displayName: selCat.label,
            accentColor: catColor,
            onTap: _pickCategory,
          ),
          const SizedBox(height: 14),

          // Marka seçici
          _buildSelector(
            label: 'Marka (opsiyonel)',
            emoji: selBrand.emoji,
            displayName: selBrand.name,
            accentColor: selBrand.color,
            onTap: _pickBrand,
          ),
          const SizedBox(height: 14),

          // Başlık
          const Text('Başlık', style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: EVColors.textSecondary,
          )),
          const SizedBox(height: 6),
          _InputField(controller: _titleCtrl, hint: 'Konu başlığı…', maxLines: 1),
          const SizedBox(height: 14),

          // Açıklama
          const Text('Açıklama', style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: EVColors.textSecondary,
          )),
          const SizedBox(height: 6),
          _InputField(controller: _excerptCtrl, hint: 'Konuyu kısaca açıkla…', maxLines: 3),
          const SizedBox(height: 20),

          // Yayınla
          SizedBox(
            width: double.infinity,
            child: GestureDetector(
              onTap: () {
                if (_titleCtrl.text.trim().isEmpty) return;
                Navigator.pop(context);
                widget.onSubmit(
                  _titleCtrl.text.trim(),
                  _excerptCtrl.text.trim(),
                  _selectedCategory,
                  _selectedBrand,
                );
              },
              child: Container(
                height: 50,
                decoration: BoxDecoration(
                  color: EVColors.primary,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(child: Text('Yayınla', style: TextStyle(
                  fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white,
                ))),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final int maxLines;
  const _InputField({required this.controller, required this.hint, required this.maxLines});
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: EVColors.surface,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: EVColors.border),
    ),
    child: TextField(
      controller: controller, maxLines: maxLines,
      style: const TextStyle(fontSize: 14, color: EVColors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: EVColors.textHint, fontSize: 14),
        border: InputBorder.none,
        contentPadding: const EdgeInsets.all(14),
      ),
    ),
  );
}

// ─────────────────────────────────────────────
//  PICKER SHEET (kategori & marka seçici alt panel)
// ─────────────────────────────────────────────
class _PickerSheet extends StatelessWidget {
  final String title;
  final Widget child;
  const _PickerSheet({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: EVColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 8),
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color: EVColors.textHint.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
            child: Text(title, style: const TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700,
              color: EVColors.textPrimary,
            )),
          ),
          child,
        ],
      ),
    );
  }
}