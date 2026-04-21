import 'package:flutter/material.dart';
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
  static const Color tag1Bg        = Color(0xFFE8F9ED);
  static const Color tag1Text      = Color(0xFF1A8C40);
  static const Color tag2Bg        = Color(0xFFE8F3FC);
  static const Color tag2Text      = Color(0xFF185FA5);
  static const Color tag3Bg        = Color(0xFFFFF3E0);
  static const Color tag3Text      = Color(0xFFBF6D00);
}

// ─────────────────────────────────────────────
//  MODEL
// ─────────────────────────────────────────────
enum NotifType { priceDown, priceUp, forum, system }

class AppNotification {
  final String id;
  final NotifType type;
  final String title;
  final String body;
  final DateTime time;
  bool isRead;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.time,
    this.isRead = false,
  });
}

// ─────────────────────────────────────────────
//  STORE
// ─────────────────────────────────────────────
class NotificationStore {
  NotificationStore._();
  static final instance = NotificationStore._();

  final ValueNotifier<List<AppNotification>> notifications =
      ValueNotifier([]);

  int get unreadCount =>
      notifications.value.where((n) => !n.isRead).length;

  void add(AppNotification notif) {
    final updated = [notif, ...notifications.value];
    notifications.value = updated;
  }

  void markAllRead() {
    for (final n in notifications.value) {
      n.isRead = true;
    }
    notifications.value = List.from(notifications.value);
  }

  void markRead(String id) {
    for (final n in notifications.value) {
      if (n.id == id) n.isRead = true;
    }
    notifications.value = List.from(notifications.value);
  }

  void remove(String id) {
    notifications.value =
        notifications.value.where((n) => n.id != id).toList();
  }

  void clear() {
    notifications.value = [];
  }
}

// ─────────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────────
class BildirimScreen extends StatelessWidget {
  const BildirimScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EVColors.background,
      body: ValueListenableBuilder<List<AppNotification>>(
        valueListenable: NotificationStore.instance.notifications,
        builder: (context, notifs, _) {
          return CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // ── Header ─────────────────────────
              SliverToBoxAdapter(
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                    child: Row(children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Bildirimler', style: TextStyle(
                              fontSize: 26, fontWeight: FontWeight.w800,
                              color: EVColors.textPrimary,
                              letterSpacing: -0.5,
                            )),
                            Text('Takip ve forum aktivitelerin',
                              style: TextStyle(
                                fontSize: 13, color: EVColors.textSecondary,
                              )),
                          ],
                        ),
                      ),
                      if (notifs.any((n) => !n.isRead))
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            NotificationStore.instance.markAllRead();
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 7),
                            decoration: BoxDecoration(
                              color: EVColors.primaryLight,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text('Tümünü oku',
                              style: TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w600,
                                color: EVColors.primary,
                              )),
                          ),
                        ),
                    ]),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 16)),

              // ── Empty ───────────────────────────
              if (notifs.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 72, height: 72,
                          decoration: BoxDecoration(
                            color: EVColors.primaryLight,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Center(
                            child: Icon(Icons.notifications_none_rounded,
                                size: 36, color: EVColors.primary),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text('Henüz bildirim yok', style: TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w700,
                          color: EVColors.textPrimary,
                        )),
                        const SizedBox(height: 6),
                        const Text(
                          '2. el ilan takibi ve forum aktivitelerin\nburada görünecek',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13, color: EVColors.textSecondary,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                )

              // ── List ────────────────────────────
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => _NotifCard(notif: notifs[i]),
                      childCount: notifs.length,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  NOTIF CARD
// ─────────────────────────────────────────────
class _NotifCard extends StatelessWidget {
  final AppNotification notif;
  const _NotifCard({required this.notif});

  (Color, Color, IconData) get _style {
    switch (notif.type) {
      case NotifType.priceDown:
        return (const Color(0xFFE8F9ED), EVColors.primary,
            Icons.arrow_downward_rounded);
      case NotifType.priceUp:
        return (const Color(0xFFFFE5E5), const Color(0xFFD94F3D),
            Icons.arrow_upward_rounded);
      case NotifType.forum:
        return (const Color(0xFFE8F0FC), const Color(0xFF1C69D4),
            Icons.forum_rounded);
      case NotifType.system:
        return (const Color(0xFFFFF3E0), const Color(0xFFEF9F27),
            Icons.info_rounded);
    }
  }

  String _timeAgo() {
    final diff = DateTime.now().difference(notif.time);
    if (diff.inMinutes < 1) return 'Şimdi';
    if (diff.inMinutes < 60) return '${diff.inMinutes} dk önce';
    if (diff.inHours < 24) return '${diff.inHours} saat önce';
    return '${diff.inDays} gün önce';
  }

  @override
  Widget build(BuildContext context) {
    final (bg, fg, icon) = _style;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        NotificationStore.instance.markRead(notif.id);
      },
      child: Dismissible(
        key: Key(notif.id),
        direction: DismissDirection.endToStart,
        onDismissed: (_) => NotificationStore.instance.remove(notif.id),
        background: Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: const Color(0xFFD94F3D),
            borderRadius: BorderRadius.circular(16),
          ),
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 20),
          child: const Icon(Icons.delete_outline_rounded,
              color: Colors.white, size: 22),
        ),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: notif.isRead ? EVColors.surface : bg.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: notif.isRead ? EVColors.border : fg.withValues(alpha: 0.3),
              width: notif.isRead ? 1 : 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8, offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // İkon
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Icon(icon, size: 20, color: fg),
                ),
              ),
              const SizedBox(width: 12),

              // İçerik
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Expanded(
                        child: Text(notif.title, style: TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w700,
                          color: notif.isRead
                              ? EVColors.textPrimary
                              : EVColors.textPrimary,
                        )),
                      ),
                      if (!notif.isRead)
                        Container(
                          width: 8, height: 8,
                          decoration: BoxDecoration(
                            color: fg,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ]),
                    const SizedBox(height: 3),
                    Text(notif.body, style: const TextStyle(
                      fontSize: 12, color: EVColors.textSecondary,
                      height: 1.4,
                    )),
                    const SizedBox(height: 6),
                    Text(_timeAgo(), style: const TextStyle(
                      fontSize: 11, color: EVColors.textHint,
                    )),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
