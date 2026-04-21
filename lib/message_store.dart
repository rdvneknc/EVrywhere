import 'package:flutter/material.dart';

// ─────────────────────────────────────────────
//  MODELS
// ─────────────────────────────────────────────
class ChatMessage {
  final String text;
  final bool fromMe;
  final DateTime time;
  ChatMessage({required this.text, required this.fromMe, required this.time});
}

class Conversation {
  final String id;          // listing id
  final String listingTitle;
  final String sellerName;
  final String sellerInitials;
  final Color  sellerColor;
  final List<ChatMessage> messages;

  Conversation({
    required this.id,
    required this.listingTitle,
    required this.sellerName,
    required this.sellerInitials,
    required this.sellerColor,
    required this.messages,
  });

  ChatMessage? get lastMessage =>
      messages.isEmpty ? null : messages.last;

  int get unreadCount =>
      messages.where((m) => !m.fromMe).length;
}

// ─────────────────────────────────────────────
//  STORE
// ─────────────────────────────────────────────
class MessageStore {
  MessageStore._();
  static final instance = MessageStore._();

  final ValueNotifier<List<Conversation>> conversations = ValueNotifier([]);

  int get totalUnread => conversations.value
      .fold(0, (sum, c) => sum + c.unreadCount);

  void sendMessage({
    required String listingId,
    required String listingTitle,
    required String sellerName,
    required String sellerInitials,
    required Color  sellerColor,
    required String text,
  }) {
    final list = List<Conversation>.from(conversations.value);
    final idx  = list.indexWhere((c) => c.id == listingId);

    final msg = ChatMessage(text: text, fromMe: true, time: DateTime.now());

    if (idx >= 0) {
      list[idx].messages.add(msg);
      // Konuşmayı en üste taşı
      final conv = list.removeAt(idx);
      list.insert(0, conv);
    } else {
      list.insert(0, Conversation(
        id: listingId,
        listingTitle: listingTitle,
        sellerName: sellerName,
        sellerInitials: sellerInitials,
        sellerColor: sellerColor,
        messages: [msg],
      ));
    }
    conversations.value = list;

    // Satıcıdan otomatik yanıt (2 sn sonra)
    Future.delayed(const Duration(seconds: 2), () {
      final updated = List<Conversation>.from(conversations.value);
      final i = updated.indexWhere((c) => c.id == listingId);
      if (i < 0) return;
      updated[i].messages.add(ChatMessage(
        text: 'Merhaba! İlanımla ilgilendiğiniz için teşekkürler. '
              'Daha fazla bilgi almak ister misiniz?',
        fromMe: false,
        time: DateTime.now(),
      ));
      conversations.value = List.from(updated);
    });
  }

  void replyInConversation(String listingId, String text) {
    final list = List<Conversation>.from(conversations.value);
    final idx  = list.indexWhere((c) => c.id == listingId);
    if (idx < 0) return;
    list[idx].messages.add(
      ChatMessage(text: text, fromMe: true, time: DateTime.now()),
    );
    final conv = list.removeAt(idx);
    list.insert(0, conv);
    conversations.value = list;

    Future.delayed(const Duration(seconds: 2), () {
      final updated = List<Conversation>.from(conversations.value);
      final i = updated.indexWhere((c) => c.id == listingId);
      if (i < 0) return;
      updated[i].messages.add(ChatMessage(
        text: 'Teşekkürler, size en kısa sürede dönüş yapacağım.',
        fromMe: false,
        time: DateTime.now(),
      ));
      conversations.value = List.from(updated);
    });
  }
}
