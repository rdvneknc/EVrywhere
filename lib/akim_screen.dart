import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// ─────────────────────────────────────────────
//  COLORS
// ─────────────────────────────────────────────
class EVColors {
  EVColors._();
  static const Color primary      = Color(0xFF2DC653);
  static const Color primaryLight = Color(0xFFE8F9ED);
  static const Color primaryMid   = Color(0xFFB6EFC5);
  static const Color onPrimary    = Color(0xFFFFFFFF);
  static const Color surface      = Color(0xFFFFFFFF);
  static const Color background   = Color(0xFFF6FBF7);
  static const Color textPrimary  = Color(0xFF0D1B12);
  static const Color textSecondary= Color(0xFF5A7264);
  static const Color textHint     = Color(0xFFADC4B4);
  static const Color border       = Color(0xFFD4EBD9);
}

// ─────────────────────────────────────────────
//  MODEL
// ─────────────────────────────────────────────
class AkimPost {
  final String id;
  final String username;
  final String userHandle;
  final String avatarInitials;
  final Color avatarColor;
  final String evModel;
  final String evBadgeIcon;
  final String location;
  final String caption;
  final String timeAgo;
  final int likes;
  final int comments;
  final int shares;
  final List<Color> gradientColors; // replaces real image
  final String gradientEmoji;       // hero visual on the "photo"
  bool isLiked;
  bool isBookmarked;

  AkimPost({
    required this.id,
    required this.username,
    required this.userHandle,
    required this.avatarInitials,
    required this.avatarColor,
    required this.evModel,
    required this.evBadgeIcon,
    required this.location,
    required this.caption,
    required this.timeAgo,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.gradientColors,
    required this.gradientEmoji,
    this.isLiked = false,
    this.isBookmarked = false,
  });
}

// ─────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────
List<AkimPost> buildMockPosts() => [
  AkimPost(
    id: '1',
    username: 'Alex Morgan',
    userHandle: '@alexdrives',
    avatarInitials: 'AM',
    avatarColor: const Color(0xFF2DC653),
    evModel: 'Tesla Model Y',
    evBadgeIcon: '⚡',
    location: 'Supercharger · Istanbul, TR',
    caption: 'Top up before the long drive 🚗 Loving the new V4 stalls — zero wait time at midnight!',
    timeAgo: '2m ago',
    likes: 312,
    comments: 47,
    shares: 18,
    gradientColors: [Color(0xFF0D3B1F), Color(0xFF1A7A40), Color(0xFF2DC653)],
    gradientEmoji: '⚡',
    isLiked: true,
  ),
  AkimPost(
    id: '2',
    username: 'Priya Nair',
    userHandle: '@priyaev',
    avatarInitials: 'PN',
    avatarColor: const Color(0xFF378ADD),
    evModel: 'Hyundai IONIQ 6',
    evBadgeIcon: '🔵',
    location: 'Electrify America · Ankara, TR',
    caption: 'First road trip in the IONIQ 6 ✨ 470km and still showing 20% — genuinely impressed.',
    timeAgo: '14m ago',
    likes: 198,
    comments: 34,
    shares: 9,
    gradientColors: [Color(0xFF0A1E3C), Color(0xFF1A4A8C), Color(0xFF378ADD)],
    gradientEmoji: '🌊',
    isLiked: false,
  ),
  AkimPost(
    id: '3',
    username: 'Marcus Webb',
    userHandle: '@marcusev',
    avatarInitials: 'MW',
    avatarColor: const Color(0xFFEF9F27),
    evModel: 'Porsche Taycan',
    evBadgeIcon: '🏆',
    location: 'Shell Recharge · İzmir, TR',
    caption: 'Sunrise charge hits different 🌅 There\'s something meditative about starting the day at 0% and leaving at 100.',
    timeAgo: '1h ago',
    likes: 541,
    comments: 89,
    shares: 44,
    gradientColors: [Color(0xFF3B1F00), Color(0xFF9B5800), Color(0xFFEF9F27)],
    gradientEmoji: '🌅',
    isLiked: false,
  ),
  AkimPost(
    id: '4',
    username: 'Sofia Ruiz',
    userHandle: '@sofiacharges',
    avatarInitials: 'SR',
    avatarColor: const Color(0xFF7F77DD),
    evModel: 'Togg T10X',
    evBadgeIcon: '🇹🇷',
    location: 'Togg HızlıŞarj · Bursa, TR',
    caption: 'Proud Togg owner month 3 update 🇹🇷 The native charger network is expanding fast — 3 new stations near me this month!',
    timeAgo: '3h ago',
    likes: 276,
    comments: 61,
    shares: 27,
    gradientColors: [Color(0xFF1A1060), Color(0xFF3D35A0), Color(0xFF7F77DD)],
    gradientEmoji: '🇹🇷',
    isLiked: true,
  ),
  AkimPost(
    id: '5',
    username: 'Jordan Lee',
    userHandle: '@jordanelec',
    avatarInitials: 'JL',
    avatarColor: const Color(0xFFD4537E),
    evModel: 'BMW iX',
    evBadgeIcon: '🔵',
    location: 'BP Pulse · İstanbul, TR',
    caption: 'iX + weekend escape = perfect combo 💙 Didn\'t even check range anxiety once. This car just handles everything.',
    timeAgo: '5h ago',
    likes: 433,
    comments: 72,
    shares: 31,
    gradientColors: [Color(0xFF4A0A25), Color(0xFF8C1A45), Color(0xFFD4537E)],
    gradientEmoji: '💙',
    isLiked: false,
  ),
  AkimPost(
    id: '6',
    username: 'Sam Chen',
    userHandle: '@samchenev',
    avatarInitials: 'SC',
    avatarColor: const Color(0xFF2DC653),
    evModel: 'Renault Megane E-Tech',
    evBadgeIcon: '💎',
    location: 'Renault Charge · Antalya, TR',
    caption: 'Coastal drive down the D400 🌊 Megane E-Tech absolutely eats this road. Regen paddle + twisties = pure joy.',
    timeAgo: '8h ago',
    likes: 189,
    comments: 28,
    shares: 12,
    gradientColors: [Color(0xFF003830), Color(0xFF006655), Color(0xFF00C49A)],
    gradientEmoji: '🌊',
    isLiked: false,
  ),
];

// ─────────────────────────────────────────────
//  AKIM SCREEN
// ─────────────────────────────────────────────
class AkimScreen extends StatefulWidget {
  const AkimScreen({super.key});

  @override
  State<AkimScreen> createState() => _AkimScreenState();
}

class _AkimScreenState extends State<AkimScreen> {
  late final PageController _pageCtrl;
  late final List<AkimPost> _posts;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _posts = buildMockPosts();
    _pageCtrl = PageController();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
    ));
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    // Restore system UI when leaving
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  void _onLike(int index) {
    HapticFeedback.mediumImpact();
    setState(() {
      final p = _posts[index];
      p.isLiked = !p.isLiked;
    });
  }

  void _onBookmark(int index) {
    HapticFeedback.lightImpact();
    setState(() => _posts[index].isBookmarked = !_posts[index].isBookmarked);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      extendBody: true,
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // ── Full-screen page view ──────────────────────
          PageView.builder(
            controller: _pageCtrl,
            scrollDirection: Axis.vertical,
            itemCount: _posts.length,
            onPageChanged: (i) => setState(() => _currentIndex = i),
            itemBuilder: (_, i) => _PostPage(
              post: _posts[i],
              isActive: i == _currentIndex,
              onLike: () => _onLike(i),
              onBookmark: () => _onBookmark(i),
              onComment: () => _showCommentSheet(context, _posts[i]),
              onShare: () {},
            ),
          ),

          // ── Top bar (title + progress dots) ───────────
          _TopBar(
            currentIndex: _currentIndex,
            total: _posts.length,
          ),
        ],
      ),
    );
  }

  void _showCommentSheet(BuildContext context, AkimPost post) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CommentSheet(post: post),
    );
  }
}

// ─────────────────────────────────────────────
//  TOP BAR
// ─────────────────────────────────────────────
class _TopBar extends StatelessWidget {
  final int currentIndex, total;
  const _TopBar({required this.currentIndex, required this.total});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Row(
          children: [
            // Back button
            _GlassButton(
              icon: Icons.arrow_back_ios_new_rounded,
              onTap: () => Navigator.of(context).maybePop(),
            ),
            const SizedBox(width: 12),
            // Title
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  RichText(
                    text: const TextSpan(children: [
                      TextSpan(
                        text: 'Akı',
                        style: TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w800,
                          color: Colors.white, letterSpacing: -0.4,
                        ),
                      ),
                      TextSpan(
                        text: 'm',
                        style: TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w800,
                          color: Color(0xFF2DC653), letterSpacing: -0.4,
                        ),
                      ),
                    ]),
                  ),
                  Text('EV moments', style: TextStyle(
                    fontSize: 11, color: Colors.white.withOpacity(0.55),
                    fontWeight: FontWeight.w400,
                  )),
                ],
              ),
            ),
            // Progress dots
            _ProgressDots(current: currentIndex, total: total),
          ],
        ),
      ),
    );
  }
}

class _ProgressDots extends StatelessWidget {
  final int current, total;
  const _ProgressDots({required this.current, required this.total});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(total, (i) {
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          margin: const EdgeInsets.symmetric(horizontal: 2),
          width: current == i ? 16 : 4,
          height: 4,
          decoration: BoxDecoration(
            color: current == i
                ? const Color(0xFF2DC653)
                : Colors.white.withOpacity(0.35),
            borderRadius: BorderRadius.circular(2),
          ),
        );
      }),
    );
  }
}

class _GlassButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _GlassButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            width: 38, height: 38,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.20)),
            ),
            child: Icon(icon, color: Colors.white, size: 16),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  POST PAGE
// ─────────────────────────────────────────────
class _PostPage extends StatefulWidget {
  final AkimPost post;
  final bool isActive;
  final VoidCallback onLike, onBookmark, onComment, onShare;

  const _PostPage({
    required this.post,
    required this.isActive,
    required this.onLike,
    required this.onBookmark,
    required this.onComment,
    required this.onShare,
  });

  @override
  State<_PostPage> createState() => _PostPageState();
}

class _PostPageState extends State<_PostPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _heartCtrl;
  late Animation<double> _heartScale;
  bool _showHeart = false;
  DateTime? _lastTap;

  @override
  void initState() {
    super.initState();
    _heartCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _heartScale = TweenSequence([
      TweenSequenceItem(
          tween: Tween(begin: 0.0, end: 1.3)
              .chain(CurveTween(curve: Curves.elasticOut)),
          weight: 60),
      TweenSequenceItem(
          tween: Tween(begin: 1.3, end: 0.0)
              .chain(CurveTween(curve: Curves.easeIn)),
          weight: 40),
    ]).animate(_heartCtrl);
  }

  @override
  void dispose() {
    _heartCtrl.dispose();
    super.dispose();
  }

  void _handleDoubleTap() {
    if (!widget.post.isLiked) widget.onLike();
    setState(() => _showHeart = true);
    _heartCtrl.forward(from: 0).then((_) {
      if (mounted) setState(() => _showHeart = false);
    });
    HapticFeedback.heavyImpact();
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    return GestureDetector(
      onDoubleTap: _handleDoubleTap,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // ── Background "photo" ───────────────────────
          _PostBackground(post: post, isActive: widget.isActive),

          // ── Gradient overlays ────────────────────────
          _GradientOverlays(),

          // ── Double-tap heart ─────────────────────────
          if (_showHeart)
            Center(
              child: ScaleTransition(
                scale: _heartScale,
                child: Icon(
  Icons.bolt_rounded,
  color: const Color(0xFF2DC653).withValues(alpha: 0.95),
  size: 100,
),
              ),
            ),

          // ── Right action buttons ─────────────────────
          Positioned(
            right: 16,
            bottom: 120,
            child: _ActionColumn(
              post: post,
              onLike: widget.onLike,
              onComment: widget.onComment,
              onShare: widget.onShare,
              onBookmark: widget.onBookmark,
            ),
          ),

          // ── Bottom info panel ────────────────────────
          Positioned(
            left: 0, right: 72, bottom: 0,
            child: _BottomInfo(post: post),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  POST BACKGROUND (gradient + emoji)
// ─────────────────────────────────────────────
class _PostBackground extends StatefulWidget {
  final AkimPost post;
  final bool isActive;
  const _PostBackground({required this.post, required this.isActive});

  @override
  State<_PostBackground> createState() => _PostBackgroundState();
}

class _PostBackgroundState extends State<_PostBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleCtrl;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _scaleCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800));
    _scaleAnim = Tween(begin: 1.08, end: 1.0).animate(
        CurvedAnimation(parent: _scaleCtrl, curve: Curves.easeOutCubic));
  }

  @override
  void didUpdateWidget(_PostBackground old) {
    super.didUpdateWidget(old);
    if (widget.isActive && !old.isActive) {
      _scaleCtrl.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _scaleCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnim,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: widget.post.gradientColors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            // Decorative circles
            Positioned(
              top: -60, right: -60,
              child: Container(
                width: 280, height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.04),
                ),
              ),
            ),
            Positioned(
              bottom: 100, left: -80,
              child: Container(
                width: 320, height: 320,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.03),
                ),
              ),
            ),
            // Hero emoji
            Center(
              child: Text(
                widget.post.gradientEmoji,
                style: const TextStyle(fontSize: 120),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  GRADIENT OVERLAYS
// ─────────────────────────────────────────────
class _GradientOverlays extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Top fade (for top bar legibility)
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.center,
              colors: [
                Colors.black.withOpacity(0.55),
                Colors.transparent,
              ],
            ),
          ),
        ),
        // Bottom fade (for info panel legibility)
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.bottomCenter,
              end: Alignment(0, 0.1),
              colors: [
                Colors.black.withOpacity(0.80),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
//  ACTION COLUMN (right side)
// ─────────────────────────────────────────────
class _ActionColumn extends StatelessWidget {
  final AkimPost post;
  final VoidCallback onLike, onComment, onShare, onBookmark;

  const _ActionColumn({
    required this.post,
    required this.onLike,
    required this.onComment,
    required this.onShare,
    required this.onBookmark,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Avatar
        _AvatarButton(post: post),
        const SizedBox(height: 24),

        // Like
        _ActionBtn(
          icon: post.isLiked
    ? Icons.bolt_rounded
    : Icons.bolt_outlined,
iconColor: post.isLiked ? const Color(0xFF2DC653) : Colors.white,
          label: _fmt(post.likes + (post.isLiked ? 1 : 0)),
          onTap: onLike,
        ),
        const SizedBox(height: 20),

        // Comment
        _ActionBtn(
          icon: Icons.chat_bubble_rounded,
          iconColor: Colors.white,
          label: _fmt(post.comments),
          onTap: onComment,
        ),
        const SizedBox(height: 20),

        // Share
        _ActionBtn(
          icon: Icons.reply_rounded,
          iconColor: Colors.white,
          label: _fmt(post.shares),
          onTap: onShare,
          flipHorizontal: true,
        ),
        const SizedBox(height: 20),

        // Bookmark
        _ActionBtn(
          icon: post.isBookmarked
              ? Icons.bookmark_rounded
              : Icons.bookmark_border_rounded,
          iconColor: post.isBookmarked
              ? const Color(0xFF2DC653)
              : Colors.white,
          label: '',
          onTap: onBookmark,
        ),
      ],
    );
  }

  String _fmt(int n) =>
      n >= 1000 ? '${(n / 1000).toStringAsFixed(1)}k' : '$n';
}

class _AvatarButton extends StatelessWidget {
  final AkimPost post;
  const _AvatarButton({required this.post});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.bottomCenter,
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 48, height: 48,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: post.avatarColor,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 8, offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Center(
            child: Text(post.avatarInitials, style: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w800,
              color: Colors.white,
            )),
          ),
        ),
        Positioned(
          bottom: -8,
          child: Container(
            width: 20, height: 20,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF2DC653),
              border: Border.all(color: Colors.white, width: 1.5),
            ),
            child: const Icon(Icons.add_rounded,
                color: Colors.white, size: 12),
          ),
        ),
      ],
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;
  final bool flipHorizontal;

  const _ActionBtn({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.onTap,
    this.flipHorizontal = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Transform.scale(
            scaleX: flipHorizontal ? -1 : 1,
            child: Icon(icon, color: iconColor, size: 30,
              shadows: [Shadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 8,
              )],
            ),
          ),
          if (label.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(label, style: TextStyle(
              fontSize: 12, fontWeight: FontWeight.w600,
              color: Colors.white.withOpacity(0.9),
              shadows: [Shadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 4,
              )],
            )),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  BOTTOM INFO PANEL
// ─────────────────────────────────────────────
class _BottomInfo extends StatelessWidget {
  final AkimPost post;
  const _BottomInfo({required this.post});

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 16, bottom + 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Username + handle
          Row(
            children: [
              Text(post.username, style: const TextStyle(
                fontSize: 16, fontWeight: FontWeight.w800,
                color: Colors.white, letterSpacing: -0.2,
                shadows: [Shadow(color: Colors.black45, blurRadius: 6)],
              )),
              const SizedBox(width: 6),
              Text(post.userHandle, style: TextStyle(
                fontSize: 13, color: Colors.white.withOpacity(0.65),
                shadows: [Shadow(color: Colors.black45, blurRadius: 4)],
              )),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF2DC653).withOpacity(0.25),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: const Color(0xFF2DC653).withOpacity(0.5)),
                ),
                child: Text('Follow', style: const TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w700,
                  color: Color(0xFF2DC653),
                )),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // EV model + location row
          Row(
            children: [
              _InfoChip(
                icon: post.evBadgeIcon,
                label: post.evModel,
                glassStyle: true,
              ),
              const SizedBox(width: 8),
              Flexible(
                child: _InfoChip(
                  icon: '📍',
                  label: post.location,
                  glassStyle: false,
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Caption
          Text(
            post.caption,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 13,
              color: Colors.white.withOpacity(0.88),
              height: 1.45,
              shadows: [Shadow(
                color: Colors.black.withOpacity(0.5),
                blurRadius: 6,
              )],
            ),
          ),

          const SizedBox(height: 10),

          // Time ago
          Text(post.timeAgo, style: TextStyle(
            fontSize: 11, color: Colors.white.withOpacity(0.45),
          )),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String icon, label;
  final bool glassStyle;
  const _InfoChip({
    required this.icon,
    required this.label,
    required this.glassStyle,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: glassStyle
                ? const Color(0xFF2DC653).withOpacity(0.20)
                : Colors.white.withOpacity(0.12),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: glassStyle
                  ? const Color(0xFF2DC653).withOpacity(0.40)
                  : Colors.white.withOpacity(0.20),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(icon, style: const TextStyle(fontSize: 11)),
              const SizedBox(width: 5),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: glassStyle
                        ? const Color(0xFF2DC653)
                        : Colors.white.withOpacity(0.90),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  COMMENT SHEET
// ─────────────────────────────────────────────
class _CommentSheet extends StatelessWidget {
  final AkimPost post;
  const _CommentSheet({required this.post});

  static const List<Map<String, dynamic>> _mockComments = [
    {'name': 'Lee K.',    'init': 'LK', 'text': 'That range is insane 🔥',          'time': '1m',  'likes': 12},
    {'name': 'Mia R.',    'init': 'MR', 'text': 'Charging to 100% overnight squad', 'time': '4m',  'likes': 8},
    {'name': 'Tom V.',    'init': 'TV', 'text': 'Which station app do you use?',     'time': '11m', 'likes': 3},
    {'name': 'Nina S.',   'init': 'NS', 'text': 'Same charger near me — great spot!','time': '22m', 'likes': 5},
    {'name': 'Omar F.',   'init': 'OF', 'text': 'You should try the V4 stalls 👌',  'time': '45m', 'likes': 19},
  ];

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: MediaQuery.of(context).size.height * 0.62,
          decoration: const BoxDecoration(
            color: Color(0xF5FFFFFF),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle
              Padding(
                padding: const EdgeInsets.only(top: 12, bottom: 4),
                child: Container(
                  width: 36, height: 4,
                  decoration: BoxDecoration(
                    color: EVColors.textHint.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: Row(
                  children: [
                    Text('${post.comments} Comments',
                      style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700,
                        color: EVColors.textPrimary,
                      )),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 30, height: 30,
                        decoration: BoxDecoration(
                          color: EVColors.background,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close_rounded,
                            size: 16, color: EVColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1, color: Color(0xFFE8F2EA)),

              // Comment list
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 12),
                  itemCount: _mockComments.length,
                  itemBuilder: (_, i) {
                    final c = _mockComments[i];
                    return _CommentRow(comment: c);
                  },
                ),
              ),

              // Input bar
              _CommentInput(),
            ],
          ),
        ),
      ),
    );
  }
}

class _CommentRow extends StatelessWidget {
  final Map<String, dynamic> comment;
  const _CommentRow({required this.comment});

  static const List<Color> _palette = [
    Color(0xFF2DC653), Color(0xFF378ADD),
    Color(0xFFEF9F27), Color(0xFF7F77DD), Color(0xFFD4537E),
  ];

  Color get _color =>
      _palette[(comment['init'] as String).codeUnitAt(0) % _palette.length];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34, height: 34,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _color.withOpacity(0.15),
              border: Border.all(color: _color.withOpacity(0.30)),
            ),
            child: Center(
              child: Text(comment['init'] as String,
                style: TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w700,
                  color: _color,
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
                    Text(comment['name'] as String,
                      style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w700,
                        color: EVColors.textPrimary,
                      )),
                    const SizedBox(width: 6),
                    Text(comment['time'] as String,
                      style: const TextStyle(
                        fontSize: 11, color: EVColors.textHint,
                      )),
                  ],
                ),
                const SizedBox(height: 3),
                Text(comment['text'] as String,
                  style: const TextStyle(
                    fontSize: 13, color: EVColors.textSecondary, height: 1.4,
                  )),
              ],
            ),
          ),
          Column(
            children: [
              const Icon(Icons.favorite_border_rounded,
                  size: 14, color: EVColors.textHint),
              Text('${comment['likes']}',
                style: const TextStyle(
                  fontSize: 11, color: EVColors.textHint,
                )),
            ],
          ),
        ],
      ),
    );
  }
}

class _CommentInput extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom
        + MediaQuery.of(context).padding.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(16, 10, 16, 10 + bottom),
      decoration: const BoxDecoration(
        color: Color(0xFFF6FBF7),
        border: Border(top: BorderSide(color: Color(0xFFE8F2EA))),
      ),
      child: Row(
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
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: EVColors.border),
              ),
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: const TextField(
                decoration: InputDecoration(
                  hintText: 'Add a comment…',
                  hintStyle: TextStyle(
                    fontSize: 13, color: EVColors.textHint,
                  ),
                  border: InputBorder.none,
                  isDense: true,
                ),
                style: TextStyle(fontSize: 13, color: EVColors.textPrimary),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: EVColors.primary,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: EVColors.primary.withOpacity(0.30),
                  blurRadius: 10, offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(Icons.send_rounded,
                color: Colors.white, size: 18),
          ),
        ],
      ),
    );
  }
}