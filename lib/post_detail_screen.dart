import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'post_store.dart';

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
//  POST DETAIL SCREEN
// ─────────────────────────────────────────────
class PostDetailScreen extends StatefulWidget {
  final EVPost post;
  const PostDetailScreen({super.key, required this.post});

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  bool _liked = false;
  bool _saved = false;
  final List<_PDComment> _comments = [];
  final _commentCtrl = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ));
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Şimdi';
    if (diff.inMinutes < 60) return '${diff.inMinutes}d önce';
    if (diff.inHours < 24) return '${diff.inHours}s önce';
    return '${diff.inDays}g önce';
  }

  void _postComment() {
    final text = _commentCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _comments.insert(0, _PDComment(text: text, timeAgo: 'Şimdi'));
      _commentCtrl.clear();
    });
    _focusNode.unfocus();
    HapticFeedback.lightImpact();
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final isCheckin = post.type == PostType.checkin;
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Scaffold(
      backgroundColor: EVColors.background,
      body: Column(
        children: [
          // ── İçerik ────────────────────────────
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

                // ── Yazar bilgisi ────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Row(children: [
                      Container(
                        width: 42, height: 42,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: EVColors.primary.withValues(alpha: 0.15),
                          border: Border.all(
                              color: EVColors.primary.withValues(alpha: 0.30)),
                        ),
                        child: Center(
                          child: Icon(
                            isCheckin
                                ? Icons.ev_station_rounded
                                : Icons.person_rounded,
                            color: EVColors.primary, size: 20,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isCheckin
                                  ? (post.stationName ?? 'Şarj İstasyonu')
                                  : 'Sen',
                              style: const TextStyle(
                                fontSize: 14, fontWeight: FontWeight.w700,
                                color: EVColors.textPrimary,
                              ),
                            ),
                            Text(
                              _timeAgo(post.createdAt),
                              style: const TextStyle(
                                fontSize: 11, color: EVColors.textHint,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (isCheckin)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: EVColors.primaryLight,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: EVColors.primary.withValues(alpha: 0.3)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.bolt_rounded,
                                  color: EVColors.primary, size: 12),
                              SizedBox(width: 3),
                              Text('Check-in', style: TextStyle(
                                fontSize: 10, fontWeight: FontWeight.w700,
                                color: EVColors.primary,
                              )),
                            ],
                          ),
                        ),
                    ]),
                  ),
                ),

                // ── Görsel ───────────────────────
                SliverToBoxAdapter(
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: post.imagePath != null
                        ? Image.file(
                            File(post.imagePath!),
                            fit: BoxFit.cover,
                          )
                        : Stack(
                            fit: StackFit.expand,
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: post.gradient,
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                ),
                              ),
                              Center(
                                child: Text(post.emoji,
                                    style: const TextStyle(fontSize: 80)),
                              ),
                              if (isCheckin)
                                Positioned(
                                  bottom: 16, left: 16, right: 16,
                                  child: Row(children: [
                                    if (post.connectorType != null)
                                      _InfoPill(
                                          label: post.connectorType!,
                                          icon: Icons.power_rounded),
                                    const SizedBox(width: 8),
                                    if (post.stationPower != null)
                                      _InfoPill(
                                          label: '${post.stationPower} kW',
                                          icon: Icons.bolt_rounded),
                                    const SizedBox(width: 8),
                                    if (post.rating != null)
                                      _InfoPill(
                                          label: post.rating!.toStringAsFixed(1),
                                          icon: Icons.star_rounded),
                                  ]),
                                ),
                            ],
                          ),
                  ),
                ),

                // ── Aksiyon butonları ────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Row(children: [
                      // Beğen
                      GestureDetector(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          setState(() => _liked = !_liked);
                        },
                        child: Icon(
                          _liked ? Icons.bolt_rounded : Icons.bolt_outlined,
                          color: _liked ? EVColors.primary : EVColors.textHint,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${post.likesCount + (_liked ? 1 : 0)}',
                        style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600,
                          color: EVColors.textHint,
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Yorum
                      GestureDetector(
                        onTap: () => _focusNode.requestFocus(),
                        child: const Icon(
                          Icons.chat_bubble_outline_rounded,
                          color: EVColors.textHint, size: 26,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${_comments.length}',
                        style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600,
                          color: EVColors.textHint,
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Paylaş
                      GestureDetector(
                        onTap: () {},
                        child: const Icon(
                          Icons.share_outlined,
                          color: EVColors.textHint, size: 26,
                        ),
                      ),
                      const Spacer(),
                      // Kaydet
                      GestureDetector(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          setState(() => _saved = !_saved);
                        },
                        child: Icon(
                          _saved
                              ? Icons.bookmark_rounded
                              : Icons.bookmark_border_rounded,
                          color: _saved ? EVColors.primary : EVColors.textHint,
                          size: 26,
                        ),
                      ),
                    ]),
                  ),
                ),

                // ── Caption ──────────────────────
                if (post.caption != null && post.caption!.isNotEmpty)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                      child: RichText(
                        text: TextSpan(
                          children: [
                            const TextSpan(
                              text: 'Sen  ',
                              style: TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w700,
                                color: EVColors.textPrimary,
                              ),
                            ),
                            TextSpan(
                              text: post.caption!,
                              style: const TextStyle(
                                fontSize: 13, color: EVColors.textSecondary,
                                height: 1.45,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                // ── Yorumlar ─────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      _comments.isEmpty
                          ? 'Henüz yorum yok'
                          : '${_comments.length} yorum',
                      style: const TextStyle(
                        fontSize: 12, color: EVColors.textHint,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),

                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => _CommentRow(comment: _comments[i]),
                    childCount: _comments.length,
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 20)),
              ],
            ),
          ),

          // ── Yorum input ──────────────────────
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
                  constraints: const BoxConstraints(minHeight: 40),
                  decoration: BoxDecoration(
                    color: EVColors.background,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: EVColors.border),
                  ),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 8),
                  child: TextField(
                    controller: _commentCtrl,
                    focusNode: _focusNode,
                    maxLines: null,
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
//  YORUM SATIRI
// ─────────────────────────────────────────────
class _CommentRow extends StatelessWidget {
  final _PDComment comment;
  const _CommentRow({required this.comment});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32, height: 32,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: EVColors.primaryLight,
            ),
            child: const Icon(Icons.person_rounded,
                color: EVColors.primary, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Text('Sen', style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700,
                    color: EVColors.textPrimary,
                  )),
                  const SizedBox(width: 6),
                  Text(comment.timeAgo, style: const TextStyle(
                    fontSize: 10, color: EVColors.textHint,
                  )),
                ]),
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

// ─────────────────────────────────────────────
//  INFO PILL
// ─────────────────────────────────────────────
class _InfoPill extends StatelessWidget {
  final String label;
  final IconData icon;
  const _InfoPill({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: Colors.white, size: 11),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(
          fontSize: 10, color: Colors.white, fontWeight: FontWeight.w600,
        )),
      ]),
    );
  }
}

// ─────────────────────────────────────────────
//  MODEL
// ─────────────────────────────────────────────
class _PDComment {
  final String text, timeAgo;
  const _PDComment({required this.text, required this.timeAgo});
}