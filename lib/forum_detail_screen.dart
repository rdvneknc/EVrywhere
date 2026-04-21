import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'forum_screen.dart';

// ─────────────────────────────────────────────
//  FORUM DETAIL SCREEN
// ─────────────────────────────────────────────
class ForumDetailScreen extends StatefulWidget {
  final ForumTopic topic;
  final void Function(ForumComment comment) onCommentAdded;

  const ForumDetailScreen({
    super.key,
    required this.topic,
    required this.onCommentAdded,
  });

  @override
  State<ForumDetailScreen> createState() => _ForumDetailScreenState();
}

class _ForumDetailScreenState extends State<ForumDetailScreen> {
  bool _liked = false;
  final _commentCtrl = TextEditingController();
  late List<ForumComment> _comments;

  @override
  void initState() {
    super.initState();
    _comments = List.from(widget.topic.comments);
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  void _postComment() {
    final text = _commentCtrl.text.trim();
    if (text.isEmpty) return;
    final comment = ForumComment(
      authorName: 'Sen',
      authorInitials: 'SE',
      authorColor: EVColors.primary,
      text: text,
      timeAgo: 'Şimdi',
      likes: 0,
    );
    setState(() {
      _comments.insert(0, comment);
      _commentCtrl.clear();
    });
    widget.onCommentAdded(comment);
    FocusScope.of(context).unfocus();
    HapticFeedback.lightImpact();
  }

  @override
  Widget build(BuildContext context) {
    final topic = widget.topic;
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Scaffold(
      backgroundColor: EVColors.background,
      body: Column(
        children: [
          // ── Content ─────────────────────────────
          Expanded(
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [

                // ── App bar ──────────────────────
                SliverAppBar(
                  backgroundColor: EVColors.background,
                  elevation: 0,
                  floating: true,
                  leading: IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded,
                        color: EVColors.textPrimary, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                  actions: [
                    IconButton(
                      icon: const Icon(Icons.more_horiz_rounded,
                          color: EVColors.textPrimary),
                      onPressed: () {},
                    ),
                  ],
                ),

                // ── Topic header ─────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [

                        // ── 1. Etiketler ──────────────────
                        Wrap(spacing: 6, runSpacing: 6, children: [
                          _CategoryBadgeDetail(categoryId: topic.categoryId),
                          if (topic.brandId != 'all')
                            _BrandBadgeDetail(brandId: topic.brandId),
                          if (topic.isPinned)
                            _SmallBadge(label: '📌 Sabit',
                                bg: const Color(0xFFFFF8E1),
                                fg: const Color(0xFFBF6D00)),
                          if (topic.isHot)
                            _SmallBadge(label: '🔥 Popüler',
                                bg: const Color(0xFFFFEBEE),
                                fg: const Color(0xFFC62828)),
                        ]),

                        const SizedBox(height: 12),

                        // ── 2. Yazar kartı (yatay) ────────
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: EVColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: EVColors.border),
                            boxShadow: [BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 8, offset: const Offset(0, 2),
                            )],
                          ),
                          child: Row(children: [
                            _Avatar(
                              initials: topic.authorInitials,
                              color: topic.authorColor,
                              size: 46,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(topic.authorName, style: const TextStyle(
                                    fontSize: 14, fontWeight: FontWeight.w700,
                                    color: EVColors.textPrimary,
                                  )),
                                  const SizedBox(height: 4),
                                  Row(children: [
                                    const Icon(Icons.electric_bolt_rounded,
                                        size: 11, color: EVColors.primary),
                                    const SizedBox(width: 3),
                                    const Text('Tesla Model Y',
                                      style: TextStyle(fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: EVColors.primary)),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.location_on_rounded,
                                        size: 11, color: EVColors.textHint),
                                    const SizedBox(width: 3),
                                    const Text('İstanbul',
                                      style: TextStyle(fontSize: 11,
                                          color: EVColors.textHint)),
                                  ]),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(topic.timeAgo, style: const TextStyle(
                                  fontSize: 11, color: EVColors.textHint,
                                )),
                                const SizedBox(height: 4),
                                Row(mainAxisSize: MainAxisSize.min, children: [
                                  _MetaPill(
                                    icon: Icons.chat_bubble_outline_rounded,
                                    label: '${topic.replies}',
                                  ),
                                  const SizedBox(width: 4),
                                  _MetaPill(
                                    icon: Icons.remove_red_eye_outlined,
                                    label: '${topic.views}',
                                  ),
                                ]),
                              ],
                            ),
                          ]),
                        ),

                        const SizedBox(height: 10),

                        // ── 3. Başlık kutusu ──────────────
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: EVColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: EVColors.border),
                            boxShadow: [BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 8, offset: const Offset(0, 2),
                            )],
                          ),
                          child: Text(topic.title, style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w800,
                            color: EVColors.textPrimary,
                            height: 1.35, letterSpacing: -0.3,
                          )),
                        ),

                        const SizedBox(height: 10),

                        // ── 4. Açıklama kutusu ────────────
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: EVColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: EVColors.divider),
                          ),
                          child: Text(topic.excerpt, style: const TextStyle(
                            fontSize: 14, color: EVColors.textSecondary,
                            height: 1.65,
                          )),
                        ),

                        const SizedBox(height: 14),

                        // ── 5. Beğen / Paylaş / Kaydet ────
                        Row(children: [
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              setState(() => _liked = !_liked);
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 9),
                              decoration: BoxDecoration(
                                color: _liked ? EVColors.primaryLight : EVColors.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _liked ? EVColors.primary : EVColors.border,
                                ),
                              ),
                              child: Row(mainAxisSize: MainAxisSize.min, children: [
                                Icon(
                                  _liked ? Icons.bolt_rounded : Icons.bolt_outlined,
                                  color: _liked ? EVColors.primary : EVColors.textHint,
                                  size: 18,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _liked ? 'Beğenildi' : 'Beğen',
                                  style: TextStyle(
                                    fontSize: 13, fontWeight: FontWeight.w600,
                                    color: _liked ? EVColors.primary : EVColors.textHint,
                                  ),
                                ),
                              ]),
                            ),
                          ),
                          const SizedBox(width: 10),
                          GestureDetector(
                            onTap: () {},
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 9),
                              decoration: BoxDecoration(
                                color: EVColors.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: EVColors.border),
                              ),
                              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                                Icon(Icons.share_outlined,
                                    color: EVColors.textHint, size: 18),
                                SizedBox(width: 6),
                                Text('Paylaş', style: TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w600,
                                  color: EVColors.textHint,
                                )),
                              ]),
                            ),
                          ),
                          const Spacer(),
                          GestureDetector(
                            onTap: () {},
                            child: Container(
                              width: 40, height: 40,
                              decoration: BoxDecoration(
                                color: EVColors.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: EVColors.border),
                              ),
                              child: const Icon(Icons.bookmark_border_rounded,
                                  color: EVColors.textHint, size: 18),
                            ),
                          ),
                        ]),
                      ],
                    ),
                  ),
                ),

                // ── Divider ──────────────────────
                const SliverToBoxAdapter(
                  child: Divider(height: 1, color: EVColors.divider),
                ),

                // ── Comments header ──────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 10),
                    child: Text('${_comments.length} Yorum',
                      style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700,
                        color: EVColors.textPrimary,
                      )),
                  ),
                ),

                // ── Comments ─────────────────────
                _comments.isEmpty
                    ? const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 30),
                          child: Center(
                            child: Text('İlk yorumu sen yap!',
                              style: TextStyle(
                                color: EVColors.textHint, fontSize: 13,
                              )),
                          ),
                        ),
                      )
                    : SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (_, i) => _CommentCard(comment: _comments[i]),
                          childCount: _comments.length,
                        ),
                      ),

                const SliverToBoxAdapter(child: SizedBox(height: 20)),
              ],
            ),
          ),

          // ── Comment input ────────────────────────
          Container(
            padding: EdgeInsets.fromLTRB(16, 10, 16, bottom + 10),
            decoration: const BoxDecoration(
              color: EVColors.surface,
              border: Border(top: BorderSide(color: EVColors.divider)),
            ),
            child: Row(children: [
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
                    color: EVColors.background,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: EVColors.border),
                  ),
                  alignment: Alignment.centerLeft,
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
                onTap: _postComment,
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: EVColors.primary,
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(
                      color: EVColors.primary.withValues(alpha: 0.30),
                      blurRadius: 8, offset: const Offset(0, 3),
                    )],
                  ),
                  child: const Icon(Icons.send_rounded,
                      color: Colors.white, size: 17),
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  COMMENT CARD
// ─────────────────────────────────────────────
class _CommentCard extends StatefulWidget {
  final ForumComment comment;
  const _CommentCard({required this.comment});
  @override
  State<_CommentCard> createState() => _CommentCardState();
}

class _CommentCardState extends State<_CommentCard> {
  bool _liked = false;
  @override
  Widget build(BuildContext context) {
    final c = widget.comment;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _Avatar(initials: c.authorInitials, color: c.authorColor, size: 36),
        const SizedBox(width: 10),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: EVColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: EVColors.border),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(c.authorName, style: const TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w700,
                  color: EVColors.textPrimary,
                )),
                const SizedBox(width: 6),
                Text(c.timeAgo, style: const TextStyle(
                  fontSize: 10, color: EVColors.textHint,
                )),
              ]),
              const SizedBox(height: 5),
              Text(c.text, style: const TextStyle(
                fontSize: 13, color: EVColors.textSecondary, height: 1.45,
              )),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  setState(() {
                    _liked = !_liked;
                    c.likes += _liked ? 1 : -1;
                  });
                },
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(
                    _liked ? Icons.bolt_rounded : Icons.bolt_outlined,
                    size: 14,
                    color: _liked ? EVColors.primary : EVColors.textHint,
                  ),
                  const SizedBox(width: 3),
                  Text('${c.likes}', style: TextStyle(
                    fontSize: 11,
                    color: _liked ? EVColors.primary : EVColors.textHint,
                    fontWeight: FontWeight.w500,
                  )),
                ]),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}

// ─────────────────────────────────────────────
//  SHARED SMALL WIDGETS
// ─────────────────────────────────────────────
class _Avatar extends StatelessWidget {
  final String initials;
  final Color color;
  final double size;
  const _Avatar({required this.initials, required this.color, required this.size});
  @override
  Widget build(BuildContext context) => Container(
    width: size, height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: color.withValues(alpha: 0.15),
      border: Border.all(color: color.withValues(alpha: 0.30)),
    ),
    child: Center(child: Text(initials, style: TextStyle(
      fontSize: size * 0.3, fontWeight: FontWeight.w700, color: color,
    ))),
  );
}

class _MetaPill extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MetaPill({required this.icon, required this.label});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: EVColors.background,
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 11, color: EVColors.textHint),
      const SizedBox(width: 3),
      Text(label, style: const TextStyle(
        fontSize: 11, color: EVColors.textHint, fontWeight: FontWeight.w500,
      )),
    ]),
  );
}

class _CategoryBadgeDetail extends StatelessWidget {
  final String categoryId;
  const _CategoryBadgeDetail({required this.categoryId});
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: d.$2, borderRadius: BorderRadius.circular(20)),
      child: Text(d.$1, style: TextStyle(
        fontSize: 11, fontWeight: FontWeight.w600, color: d.$3,
      )),
    );
  }
}

class _BrandBadgeDetail extends StatelessWidget {
  final String brandId;
  const _BrandBadgeDetail({required this.brandId});
  @override
  Widget build(BuildContext context) {
    final brand = kBrands.firstWhere((b) => b.id == brandId, orElse: () => kBrands.first);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: brand.color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: brand.color.withValues(alpha: 0.25)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(brand.emoji, style: const TextStyle(fontSize: 12)),
        const SizedBox(width: 4),
        Text(brand.name, style: TextStyle(
          fontSize: 11, fontWeight: FontWeight.w700, color: brand.color,
        )),
      ]),
    );
  }
}

class _SmallBadge extends StatelessWidget {
  final String label;
  final Color bg, fg;
  const _SmallBadge({required this.label, required this.bg, required this.fg});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(
      fontSize: 10, fontWeight: FontWeight.w600, color: fg,
    )),
  );
}

class _AuthorInfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _AuthorInfoRow({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Icon(icon, size: 11, color: color),
      const SizedBox(width: 4),
      Flexible(
        child: Text(label,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 10, fontWeight: FontWeight.w600, color: color,
          ),
        ),
      ),
    ],
  );
}