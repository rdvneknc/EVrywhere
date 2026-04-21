import 'dart:async';
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
class StoryData {
  final String id;
  final String username;
  final String userHandle;
  final String initials;
  final Color  avatarColor;
  final String evModel;
  final String evBadge;
  final String location;
  final String caption;
  final String timeAgo;
  final List<Color> bgGradient;
  final String bgEmoji;
  final Duration duration;

  const StoryData({
    required this.id,
    required this.username,
    required this.userHandle,
    required this.initials,
    required this.avatarColor,
    required this.evModel,
    required this.evBadge,
    required this.location,
    required this.caption,
    required this.timeAgo,
    required this.bgGradient,
    required this.bgEmoji,
    this.duration = const Duration(seconds: 5),
  });
}

// ─────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────
final List<StoryData> kStoryData = [
  const StoryData(
    id: 's1',
    username: 'Alex Morgan',
    userHandle: '@tesla_alex',
    initials: 'AM',
    avatarColor: Color(0xFFCC0000),
    evModel: 'Tesla Model Y',
    evBadge: '⚡',
    location: 'Supercharger · Istanbul, TR',
    caption: 'Hit 100% just in time for the drive north ⚡ V4 stalls are a total game-changer.',
    timeAgo: '2m ago',
    bgGradient: [Color(0xFF0D3B1F), Color(0xFF1A7A40), Color(0xFF2DC653)],
    bgEmoji: '⚡',
    duration: Duration(seconds: 6),
  ),
  const StoryData(
    id: 's2',
    username: 'Priya Nair',
    userHandle: '@ev_priya',
    initials: 'PN',
    avatarColor: Color(0xFF378ADD),
    evModel: 'Hyundai IONIQ 6',
    evBadge: '🔵',
    location: 'Electrify America · Ankara, TR',
    caption: '470km trip and still had 20% left. IONIQ 6 just doesn\'t quit 🌊',
    timeAgo: '14m ago',
    bgGradient: [Color(0xFF0A1E3C), Color(0xFF1A4A8C), Color(0xFF378ADD)],
    bgEmoji: '🌊',
    duration: Duration(seconds: 5),
  ),
  const StoryData(
    id: 's3',
    username: 'Marcus Webb',
    userHandle: '@porsche_m',
    initials: 'MW',
    avatarColor: Color(0xFFEF9F27),
    evModel: 'Porsche Taycan',
    evBadge: '🏆',
    location: 'Shell Recharge · İzmir, TR',
    caption: 'Sunrise charge hits different 🌅 Starting at 0%, leaving at 100 — pure ritual.',
    timeAgo: '1h ago',
    bgGradient: [Color(0xFF3B1F00), Color(0xFF9B5800), Color(0xFFEF9F27)],
    bgEmoji: '🌅',
    duration: Duration(seconds: 6),
  ),
  const StoryData(
    id: 's4',
    username: 'Sofia Ruiz',
    userHandle: '@togg_sofia',
    initials: 'SR',
    avatarColor: Color(0xFF7F77DD),
    evModel: 'Togg T10X',
    evBadge: '🇹🇷',
    location: 'Togg HızlıŞarj · Bursa, TR',
    caption: 'Month 3 with my Togg 🇹🇷 The native charger network just keeps expanding!',
    timeAgo: '3h ago',
    bgGradient: [Color(0xFF1A1060), Color(0xFF3D35A0), Color(0xFF7F77DD)],
    bgEmoji: '🇹🇷',
    duration: Duration(seconds: 5),
  ),
  const StoryData(
    id: 's5',
    username: 'Jordan Lee',
    userHandle: '@bmw_jordan',
    initials: 'JL',
    avatarColor: Color(0xFF1C69D4),
    evModel: 'BMW iX',
    evBadge: '🔵',
    location: 'BP Pulse · İstanbul, TR',
    caption: 'iX + weekend escape = perfect. Zero range anxiety, just vibes 💙',
    timeAgo: '5h ago',
    bgGradient: [Color(0xFF0A1830), Color(0xFF143060), Color(0xFF1C69D4)],
    bgEmoji: '💙',
    duration: Duration(seconds: 5),
  ),
];

// ─────────────────────────────────────────────
//  STORY VIEWER  — entry point
// ─────────────────────────────────────────────
/// Route usage:
///   Navigator.push(context, MaterialPageRoute(
///     builder: (_) => StoryViewer(stories: kStoryData, initialIndex: 0),
///   ));
class StoryViewer extends StatefulWidget {
  final List<StoryData> stories;
  final int initialIndex;

  const StoryViewer({
    super.key,
    required this.stories,
    this.initialIndex = 0,
  });

  @override
  State<StoryViewer> createState() => _StoryViewerState();
}

class _StoryViewerState extends State<StoryViewer>
    with SingleTickerProviderStateMixin {
  late int _currentIndex;
  late AnimationController _progressCtrl;
  bool _isPaused = false;

  // Scale animation for background pan-in on story change
  double _bgScale = 1.06;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;

    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
    ));

    _progressCtrl = AnimationController(vsync: this);
    _startStory(_currentIndex);
  }

  @override
  void dispose() {
    _progressCtrl.dispose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  // ── Story lifecycle ─────────────────────────
  void _startStory(int index) {
    _progressCtrl.stop();
    _progressCtrl.reset();

    setState(() {
      _currentIndex = index;
      _isPaused = false;
      _bgScale = 1.06;
    });

    // Animate background scale-in
    Future.microtask(() {
      if (mounted) setState(() => _bgScale = 1.0);
    });

    final duration = widget.stories[index].duration;
    _progressCtrl.duration = duration;
    _progressCtrl.forward().then((_) {
      if (mounted) _goNext();
    });
  }

  void _goNext() {
    if (_currentIndex < widget.stories.length - 1) {
      _startStory(_currentIndex + 1);
    } else {
      _close();
    }
  }

  void _goPrev() {
    if (_currentIndex > 0) {
      _startStory(_currentIndex - 1);
    } else {
      // Already at first — restart current
      _startStory(0);
    }
  }

  void _close() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    Navigator.of(context).pop();
  }

  void _pause() {
    if (!_isPaused) {
      _progressCtrl.stop();
      setState(() => _isPaused = true);
    }
  }

  void _resume() {
    if (_isPaused) {
      _progressCtrl.forward();
      setState(() => _isPaused = false);
    }
  }

  // ── Tap zones ───────────────────────────────
  void _handleTapDown(TapDownDetails d) => _pause();
  void _handleTapUp(TapUpDetails d) {
    _resume();
    final width = MediaQuery.of(context).size.width;
    if (d.globalPosition.dx < width * 0.33) {
      _goPrev();
    } else {
      _goNext();
    }
  }
  void _handleTapCancel() => _resume();

  @override
  Widget build(BuildContext context) {
    final story = widget.stories[_currentIndex];

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      extendBody: true,
      body: GestureDetector(
        onTapDown: _handleTapDown,
        onTapUp: _handleTapUp,
        onTapCancel: _handleTapCancel,
        // Long-press to pause
        onLongPressStart: (_) => _pause(),
        onLongPressEnd: (_) => _resume(),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // ── Background ─────────────────────────
            _StoryBackground(
              story: story,
              scale: _bgScale,
              key: ValueKey(story.id),
            ),

            // ── Top gradient ────────────────────────
            _TopGradient(),

            // ── Bottom gradient ─────────────────────
            _BottomGradient(),

            // ── Progress bars ───────────────────────
            Positioned(
              top: 0, left: 0, right: 0,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                  child: _ProgressBars(
                    count: widget.stories.length,
                    currentIndex: _currentIndex,
                    controller: _progressCtrl,
                  ),
                ),
              ),
            ),

            // ── Top info bar ─────────────────────────
            Positioned(
              top: 0, left: 0, right: 0,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 32, 16, 0),
                  child: _StoryTopBar(
                    story: story,
                    onClose: _close,
                  ),
                ),
              ),
            ),

            // ── Bottom caption panel ─────────────────
            Positioned(
              bottom: 0, left: 0, right: 0,
              child: _StoryCaption(story: story),
            ),

            // ── Tap zone hint (left / right arrows) ──
            // Invisible — just visual affordance on first view
            _TapZoneHints(),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  BACKGROUND
// ─────────────────────────────────────────────
class _StoryBackground extends StatelessWidget {
  final StoryData story;
  final double scale;

  const _StoryBackground({
    super.key,
    required this.story,
    required this.scale,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: scale,
      duration: const Duration(milliseconds: 700),
      curve: Curves.easeOutCubic,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: story.bgGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Decorative circles
            Positioned(
              top: -80, right: -80,
              child: Container(
                width: 320, height: 320,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.05),
                ),
              ),
            ),
            Positioned(
              bottom: 80, left: -100,
              child: Container(
                width: 360, height: 360,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.04),
                ),
              ),
            ),
            // Hero emoji
            Center(
              child: Text(
                story.bgEmoji,
                style: const TextStyle(fontSize: 140),
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
class _TopGradient extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 0, left: 0, right: 0,
      height: MediaQuery.of(context).size.height * 0.35,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.65),
              Colors.transparent,
            ],
          ),
        ),
      ),
    );
  }
}

class _BottomGradient extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 0, left: 0, right: 0,
      height: MediaQuery.of(context).size.height * 0.42,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withOpacity(0.80),
              Colors.transparent,
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  PROGRESS BARS
// ─────────────────────────────────────────────
class _ProgressBars extends StatelessWidget {
  final int count;
  final int currentIndex;
  final AnimationController controller;

  const _ProgressBars({
    required this.count,
    required this.currentIndex,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(count, (i) {
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: i < count - 1 ? 4 : 0),
            child: _ProgressSegment(
              state: i < currentIndex
                  ? _SegmentState.complete
                  : i == currentIndex
                      ? _SegmentState.active
                      : _SegmentState.empty,
              controller: controller,
            ),
          ),
        );
      }),
    );
  }
}

enum _SegmentState { complete, active, empty }

class _ProgressSegment extends StatelessWidget {
  final _SegmentState state;
  final AnimationController controller;

  const _ProgressSegment({
    required this.state,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(2),
      child: SizedBox(
        height: 2.5,
        child: state == _SegmentState.active
            ? AnimatedBuilder(
                animation: controller,
                builder: (_, __) => LinearProgressIndicator(
                  value: controller.value,
                  backgroundColor: Colors.white.withOpacity(0.30),
                  valueColor: const AlwaysStoppedAnimation(Colors.white),
                  minHeight: 2.5,
                ),
              )
            : Container(
                color: state == _SegmentState.complete
                    ? Colors.white
                    : Colors.white.withOpacity(0.30),
              ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  TOP INFO BAR
// ─────────────────────────────────────────────
class _StoryTopBar extends StatelessWidget {
  final StoryData story;
  final VoidCallback onClose;

  const _StoryTopBar({required this.story, required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Avatar
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: story.avatarColor,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.25),
                blurRadius: 8, offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Center(
            child: Text(story.initials, style: const TextStyle(
              fontSize: 12, fontWeight: FontWeight.w800,
              color: Colors.white,
            )),
          ),
        ),
        const SizedBox(width: 10),

        // Name + time
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(story.username, style: const TextStyle(
                fontSize: 14, fontWeight: FontWeight.w700,
                color: Colors.white, letterSpacing: -0.2,
                shadows: [Shadow(color: Colors.black45, blurRadius: 4)],
              )),
              const SizedBox(height: 1),
              Row(
                children: [
                  Text(story.timeAgo, style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withOpacity(0.65),
                    shadows: const [Shadow(color: Colors.black45, blurRadius: 4)],
                  )),
                  const SizedBox(width: 6),
                  Container(
                    width: 3, height: 3,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withOpacity(0.45),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(story.userHandle, style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withOpacity(0.55),
                    shadows: const [Shadow(color: Colors.black45, blurRadius: 4)],
                  )),
                ],
              ),
            ],
          ),
        ),

        // More button
        _GlassIconButton(
          icon: Icons.more_horiz_rounded,
          onTap: () {},
        ),
        const SizedBox(width: 8),

        // Close button
        _GlassIconButton(
          icon: Icons.close_rounded,
          onTap: onClose,
        ),
      ],
    );
  }
}

class _GlassIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _GlassIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.20)),
            ),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  BOTTOM CAPTION PANEL
// ─────────────────────────────────────────────
class _StoryCaption extends StatelessWidget {
  final StoryData story;

  const _StoryCaption({required this.story});

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, bottomPad + 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // EV model + location chips
          Row(
            children: [
              _InfoChip(
                emoji: story.evBadge,
                label: story.evModel,
                isAccent: true,
              ),
              const SizedBox(width: 8),
              Flexible(
                child: _InfoChip(
                  emoji: '📍',
                  label: story.location,
                  isAccent: false,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Caption text
          Text(
            story.caption,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.92),
              height: 1.5,
              shadows: [Shadow(
                color: Colors.black.withOpacity(0.5),
                blurRadius: 8,
              )],
            ),
          ),

          const SizedBox(height: 16),

          // Reply bar
          _ReplyBar(username: story.username),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String emoji, label;
  final bool isAccent;

  const _InfoChip({
    required this.emoji,
    required this.label,
    required this.isAccent,
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
            color: isAccent
                ? const Color(0xFF2DC653).withOpacity(0.22)
                : Colors.white.withOpacity(0.14),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isAccent
                  ? const Color(0xFF2DC653).withOpacity(0.45)
                  : Colors.white.withOpacity(0.22),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 5),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isAccent
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

class _ReplyBar extends StatelessWidget {
  final String username;

  const _ReplyBar({required this.username});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.12),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withOpacity(0.22)),
          ),
          child: Row(
            children: [
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'Reply to $username…',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.55),
                  ),
                ),
              ),
              // React buttons
              _ReplyEmoji(emoji: '❤️'),
              _ReplyEmoji(emoji: '🔥'),
              _ReplyEmoji(emoji: '⚡'),
              const SizedBox(width: 8),
              // Send
              GestureDetector(
                onTap: () {},
                child: Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2DC653).withOpacity(0.25),
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: const Color(0xFF2DC653).withOpacity(0.45)),
                    ),
                    child: const Icon(Icons.send_rounded,
                        color: Color(0xFF2DC653), size: 15),
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

class _ReplyEmoji extends StatelessWidget {
  final String emoji;
  const _ReplyEmoji({required this.emoji});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => HapticFeedback.lightImpact(),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5),
        child: Text(emoji, style: const TextStyle(fontSize: 20)),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  TAP ZONE HINTS (subtle left / right arrows)
// ─────────────────────────────────────────────
class _TapZoneHints extends StatefulWidget {
  @override
  State<_TapZoneHints> createState() => _TapZoneHintsState();
}

class _TapZoneHintsState extends State<_TapZoneHints>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1200));
    _opacity = Tween(begin: 0.18, end: 0.0).animate(
        CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));

    // Show hint briefly on first load, then fade out
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _opacity,
      builder: (_, __) => Opacity(
        opacity: _opacity.value,
        child: Row(
          children: [
            // Left hint
            Container(
              width: MediaQuery.of(context).size.width * 0.33,
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.only(left: 16),
              child: const Icon(Icons.arrow_back_ios_rounded,
                  color: Colors.white, size: 22),
            ),
            const Spacer(),
            // Right hint
            Container(
              width: MediaQuery.of(context).size.width * 0.33,
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 16),
              child: const Icon(Icons.arrow_forward_ios_rounded,
                  color: Colors.white, size: 22),
            ),
          ],
        ),
      ),
    );
  }
}