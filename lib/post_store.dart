import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

// ─────────────────────────────────────────────
//  POST MODEL
// ─────────────────────────────────────────────
enum PostType { image, checkin }

class EVPost {
  final String id;
  final PostType type;
  final String? caption;
  final String? imagePath;
  final String? stationName;
  final int? stationPower;
  final String? connectorType;
  final double? rating;
  final DateTime createdAt;
  int likesCount;
  final List<Color> gradient;
  final String emoji;
  /// Firestore’da: gönderiyi oluşturan kullanıcının [FirebaseAuth] uid’si.
  final String? authorId;

  EVPost({
    required this.id,
    required this.type,
    this.caption,
    this.imagePath,
    this.stationName,
    this.stationPower,
    this.connectorType,
    this.rating,
    required this.createdAt,
    this.likesCount = 0,
    required this.gradient,
    required this.emoji,
    this.authorId,
  });

  Map<String, dynamic> toFirestore() {
    return {
      'type': type.name,
      'caption': caption,
      'imagePath': imagePath,
      'stationName': stationName,
      'stationPower': stationPower,
      'connectorType': connectorType,
      'rating': rating,
      'createdAt': Timestamp.fromDate(createdAt),
      'likesCount': likesCount,
      'emoji': emoji,
      'gradientStart': gradient.first.toARGB32(),
      'gradientEnd': gradient.last.toARGB32(),
      if (authorId != null) 'authorId': authorId,
    };
  }

  factory EVPost.fromFirestore(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return EVPost(
      id: doc.id,
      type: d['type'] == 'checkin' ? PostType.checkin : PostType.image,
      caption: d['caption'],
      imagePath: d['imagePath'],
      stationName: d['stationName'],
      stationPower: d['stationPower'],
      connectorType: d['connectorType'],
      rating: d['rating']?.toDouble(),
      createdAt: (d['createdAt'] as Timestamp).toDate(),
      likesCount: d['likesCount'] ?? 0,
      emoji: d['emoji'] ?? '⚡',
      authorId: d['authorId'] as String?,
      gradient: [
        Color(d['gradientStart'] ?? 0xFF0D3B1F),
        Color(d['gradientEnd'] ?? 0xFF2DC653),
      ],
    );
  }
}

// ─────────────────────────────────────────────
//  SINGLETON STORE
// ─────────────────────────────────────────────
class PostStore {
  PostStore._();
  static final PostStore instance = PostStore._();

  final _db = FirebaseFirestore.instance;

  final List<EVPost> posts = [
    EVPost(
      id: 'p1',
      type: PostType.image,
      caption: 'İlk şarj deneyimim ⚡',
      gradient: [Color(0xFF0D3B1F), Color(0xFF2DC653)],
      emoji: '⚡',
      createdAt: DateTime.now().subtract(const Duration(days: 5)),
      likesCount: 312,
    ),
    EVPost(
      id: 'p2',
      type: PostType.image,
      caption: 'Sahil yolculuğu 🌊',
      gradient: [Color(0xFF0A1E3C), Color(0xFF378ADD)],
      emoji: '🌊',
      createdAt: DateTime.now().subtract(const Duration(days: 4)),
      likesCount: 198,
    ),
    EVPost(
      id: 'p3',
      type: PostType.image,
      caption: 'Gün batımı şarjı 🌅',
      gradient: [Color(0xFF3B1F00), Color(0xFFEF9F27)],
      emoji: '🌅',
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
      likesCount: 541,
    ),
    EVPost(
      id: 'p4',
      type: PostType.image,
      caption: 'Türkiye turu 🇹🇷',
      gradient: [Color(0xFF1A1060), Color(0xFF7F77DD)],
      emoji: '🇹🇷',
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
      likesCount: 276,
    ),
    EVPost(
      id: 'p5',
      type: PostType.image,
      caption: 'Gece şarjı 💙',
      gradient: [Color(0xFF4A0A25), Color(0xFFD4537E)],
      emoji: '💙',
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      likesCount: 433,
    ),
    EVPost(
      id: 'p6',
      type: PostType.image,
      caption: 'Doğa molası 🌿',
      gradient: [Color(0xFF003830), Color(0xFF00C49A)],
      emoji: '🌿',
      createdAt: DateTime.now().subtract(const Duration(hours: 12)),
      likesCount: 189,
    ),
  ];

  Future<void> addPost(EVPost post) async {
    posts.insert(0, post);
    if (post.authorId == null) {
      debugPrint('addPost: Firestore atlandı (authorId yok)');
      return;
    }
    try {
      await _db.collection('posts').doc(post.id).set(post.toFirestore());
    } catch (e) {
      debugPrint('Firestore addPost error: $e');
    }
  }

  Future<void> loadFromFirestore() async {
    try {
      final snap = await _db
          .collection('posts')
          .orderBy('createdAt', descending: true)
          .limit(50)
          .get();

      for (final doc in snap.docs) {
        final post = EVPost.fromFirestore(doc);
        if (!posts.any((p) => p.id == post.id)) {
          posts.insert(0, post);
        }
      }
    } catch (e) {
      debugPrint('Firestore loadPosts error: $e');
    }
  }

  String generateId() =>
      'post_${DateTime.now().millisecondsSinceEpoch}';
}