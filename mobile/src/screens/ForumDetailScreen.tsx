import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import {
  CATEGORY_BADGE,
  findBrand,
  hexWithAlpha,
} from '../data/forum';
import {
  StoredForumComment,
  addForumComment,
  deleteForumComment,
  fetchForumComments,
  subscribeForumComments,
} from '../api/forumComments';
import {
  subscribeTopicSaved,
  toggleSaveTopic,
} from '../api/savedTopics';
import { deleteForumTopic } from '../api/forumTopics';
import { useAuth } from '../auth/AuthContext';
import {
  FIRESTORE_COVER_BYTES,
  compressImageUnderBytes,
} from '../lib/imageCompress';
import { messageForBlockRelation } from '../api/moderation';
import { useBlockLists } from '../hooks/useBlockLists';

type Props = NativeStackScreenProps<RootStackParamList, 'ForumDetail'>;

export function ForumDetailScreen({ navigation, route }: Props) {
  const { colors, styles } = useStyles();
  const { topic } = route.params;
  const { user } = useAuth();
  const { relationWith } = useBlockLists();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [comments, setComments] = useState<StoredForumComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentPhoto, setCommentPhoto] = useState<string | null>(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [replies, setReplies] = useState(topic.replies);
  const [deletingTopic, setDeletingTopic] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );

  const badge = CATEGORY_BADGE[topic.categoryId] ?? CATEGORY_BADGE.general;
  const brand = findBrand(topic.brandId);
  const isTopicOwner = Boolean(
    user &&
      (topic.authorId === user.uid ||
        (!topic.authorId &&
          (topic.authorName === user.displayName?.trim() ||
            topic.authorName === user.email?.split('@')[0]))),
  );
  const authorRelation = relationWith(topic.authorId);
  const authorBlockMessage = messageForBlockRelation(authorRelation);
  const authorHidden = !isTopicOwner && authorRelation !== 'none';

  useEffect(() => {
    return subscribeForumComments(
      topic.id,
      (next) => {
        setComments(next);
        setReplies(Math.max(topic.replies, next.length));
        setLoadingComments(false);
      },
      () => setLoadingComments(false),
    );
  }, [topic.id, topic.replies]);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    return subscribeTopicSaved(user.uid, topic.id, setSaved);
  }, [user, topic.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const next = await fetchForumComments(topic.id);
      setComments(next);
      setReplies(Math.max(topic.replies, next.length));
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const openAuthor = () => {
    if (!topic.authorId) {
      Alert.alert('Profil yok', 'Bu konu eski bir kayıttan; üye profili bağlı değil.');
      return;
    }
    navigation.navigate('UserProfile', {
      userId: topic.authorId,
      name: topic.authorName,
      initials: topic.authorInitials,
      color: topic.authorColor,
      contextTitle: topic.title,
    });
  };

  const openCommentAuthor = (c: StoredForumComment) => {
    if (!c.authorId) return;
    navigation.navigate('UserProfile', {
      userId: c.authorId,
      name: c.authorName,
      initials: c.authorInitials,
      color: c.authorColor,
      contextTitle: topic.title,
    });
  };

  const onToggleSave = async () => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'Kaydetmek için giriş yapmalısın.');
      return;
    }
    if (savingToggle) return;
    setSavingToggle(true);
    try {
      const next = await toggleSaveTopic(user.uid, {
        ...topic,
        replies,
      });
      setSaved(next);
    } catch (e) {
      Alert.alert(
        'Kaydedilemedi',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setSavingToggle(false);
    }
  };

  const pickCommentPhoto = async () => {
    if (pickingPhoto || sending) return;
    setPickingPhoto(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('İzin gerekli', 'Galeri erişimi olmadan foto eklenemez.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsMultipleSelection: false,
      });
      if (res.canceled || !res.assets[0]) return;
      const compressed = await compressImageUnderBytes(
        res.assets[0].uri,
        FIRESTORE_COVER_BYTES,
        1200,
      );
      setCommentPhoto(compressed.uri);
    } catch (e) {
      Alert.alert(
        'Fotoğraf işlenemedi',
        e instanceof Error ? e.message : 'Başka bir görsel dene.',
      );
    } finally {
      setPickingPhoto(false);
    }
  };

  const postComment = async () => {
    const text = commentText.trim();
    if (!text && !commentPhoto) return;
    if (!user) {
      Alert.alert('Giriş gerekli', 'Yorum için giriş yapmalısın.');
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      await addForumComment(topic.id, user, text, commentPhoto ?? undefined);
      setCommentText('');
      setCommentPhoto(null);
      setReplies((n) => n + 1);
    } catch (e) {
      Alert.alert(
        'Yorum kaydedilemedi',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setSending(false);
    }
  };

  const confirmDeleteTopic = () => {
    if (!isTopicOwner || deletingTopic) return;
    Alert.alert(
      'Konuyu sil',
      'Bu konu ve tüm yanıtlar kalıcı olarak silinecek. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => void doDeleteTopic(),
        },
      ],
    );
  };

  const doDeleteTopic = async () => {
    setDeletingTopic(true);
    try {
      await deleteForumTopic(topic.id);
      navigation.goBack();
    } catch (e) {
      Alert.alert(
        'Silinemedi',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setDeletingTopic(false);
    }
  };

  const confirmDeleteComment = (c: StoredForumComment) => {
    if (!user || c.authorId !== user.uid || deletingCommentId) return;
    Alert.alert('Yanıtı sil', 'Bu yanıt kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => void doDeleteComment(c.id),
      },
    ]);
  };

  const doDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await deleteForumComment(topic.id, commentId);
      setReplies((n) => Math.max(0, n - 1));
    } catch (e) {
      Alert.alert(
        'Silinemedi',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  const openTopicMenu = () => {
    if (!isTopicOwner) return;
    Alert.alert('Konu seçenekleri', undefined, [
      {
        text: 'Konuyu sil',
        style: 'destructive',
        onPress: confirmDeleteTopic,
      },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {authorHidden ? (
        <>
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.textPrimary}
              />
            </Pressable>
            <Text style={styles.topTitle}>Forum</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={{ paddingHorizontal: 24, paddingTop: 40 }}>
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '700',
                fontSize: 15,
                color: '#92400E',
                backgroundColor: '#FEF3C7',
                padding: 14,
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              {authorBlockMessage}
            </Text>
            <Text
              style={{
                textAlign: 'center',
                marginTop: 12,
                color: colors.textSecondary,
                fontSize: 14,
              }}
            >
              Bu konu engelleme nedeniyle görüntülenemiyor.
            </Text>
          </View>
        </>
      ) : (
      <>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            Konu
          </Text>
          <View style={styles.topActions}>
            <Pressable
              hitSlop={10}
              onPress={() => void onToggleSave()}
              disabled={savingToggle}
            >
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={saved ? colors.primary : colors.textPrimary}
              />
            </Pressable>
            {isTopicOwner ? (
              <Pressable
                hitSlop={10}
                onPress={openTopicMenu}
                disabled={deletingTopic}
              >
                {deletingTopic ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={22}
                    color={colors.textPrimary}
                  />
                )}
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* OP — forum post */}
          <View style={styles.postCard}>
            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: badge.bg }]}>
                <Text style={[styles.tagText, { color: badge.fg }]}>
                  {badge.label}
                </Text>
              </View>
              {topic.brandId !== 'all' ? (
                <View
                  style={[
                    styles.tag,
                    {
                      backgroundColor: hexWithAlpha(brand.color, 0.1),
                      borderWidth: 1,
                      borderColor: hexWithAlpha(brand.color, 0.25),
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12 }}>{brand.emoji}</Text>
                  <Text style={[styles.tagText, { color: brand.color }]}>
                    {brand.name}
                  </Text>
                </View>
              ) : null}
              {topic.isPinned ? (
                <View style={[styles.tag, { backgroundColor: '#FFF8E1' }]}>
                  <Text style={[styles.tagText, { color: '#BF6D00' }]}>
                    Sabit
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.title}>{topic.title}</Text>

            <Pressable style={styles.authorRow} onPress={openAuthor}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: hexWithAlpha(topic.authorColor, 0.15),
                    borderColor: hexWithAlpha(topic.authorColor, 0.3),
                  },
                ]}
              >
                <Text style={[styles.avatarText, { color: topic.authorColor }]}>
                  {topic.authorInitials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{topic.authorName}</Text>
                <Text style={styles.authorMeta}>
                  Konuyu açtı · {topic.timeAgo}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textHint}
              />
            </Pressable>

            <View style={styles.postDivider} />

            <Text style={styles.body}>{topic.excerpt}</Text>

            {topic.photoUrl ? (
              <Image
                source={{ uri: topic.photoUrl }}
                style={styles.topicPhoto}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={14} color={colors.textHint} />
                <Text style={styles.statText}>{topic.views} görüntülenme</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={14}
                  color={colors.textHint}
                />
                <Text style={styles.statText}>{replies} yanıt</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => setLiked((v) => !v)}
                style={[
                  styles.actionBtn,
                  liked && {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={liked ? colors.primary : colors.textHint}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    { color: liked ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Beğen
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void onToggleSave()}
                style={[
                  styles.actionBtn,
                  saved && {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primary,
                  },
                ]}
                disabled={savingToggle}
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={saved ? colors.primary : colors.textHint}
                />
                <Text
                  style={[
                    styles.actionLabel,
                    { color: saved ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {saved ? 'Kaydedildi' : 'Kaydet'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Replies */}
          <View style={styles.repliesHeader}>
            <Text style={styles.repliesTitle}>Yanıtlar</Text>
            <View style={styles.repliesCount}>
              <Text style={styles.repliesCountText}>{comments.length}</Text>
            </View>
          </View>

          {loadingComments ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginVertical: 24 }}
            />
          ) : comments.length === 0 ? (
            <View style={styles.emptyReplies}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={28}
                color={colors.textHint}
              />
              <Text style={styles.noComments}>
                Henüz yanıt yok. İlk yanıtı sen yaz.
              </Text>
            </View>
          ) : (
            comments.map((c, index) => {
              const isMine = Boolean(user && c.authorId === user.uid);
              return (
                <View key={c.id} style={styles.replyCard}>
                  <View style={styles.replyRail} />
                  <View style={styles.replyBody}>
                    <View style={styles.replyHeadRow}>
                      <Pressable
                        style={styles.replyHead}
                        onPress={() => openCommentAuthor(c)}
                      >
                        <View
                          style={[
                            styles.replyAvatar,
                            {
                              backgroundColor: hexWithAlpha(
                                c.authorColor,
                                0.15,
                              ),
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: c.authorColor,
                              fontWeight: '700',
                              fontSize: 11,
                            }}
                          >
                            {c.authorInitials}
                          </Text>
                        </View>
                        <Text style={styles.commentName}>{c.authorName}</Text>
                        <Text style={styles.replyIndex}>#{index + 1}</Text>
                        <Text style={styles.commentTime}>{c.timeAgo}</Text>
                      </Pressable>
                      {isMine ? (
                        <Pressable
                          hitSlop={8}
                          onPress={() => confirmDeleteComment(c)}
                          disabled={deletingCommentId === c.id}
                          style={styles.replyDelete}
                        >
                          {deletingCommentId === c.id ? (
                            <ActivityIndicator
                              size="small"
                              color={colors.error}
                            />
                          ) : (
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color={colors.error}
                            />
                          )}
                        </Pressable>
                      ) : null}
                    </View>
                    {c.text ? (
                      <Text style={styles.commentText}>{c.text}</Text>
                    ) : null}
                    {c.photoUrl ? (
                      <Image
                        source={{ uri: c.photoUrl }}
                        style={styles.replyPhoto}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.composerWrap}>
          {commentPhoto ? (
            <View style={styles.composerPreview}>
              <Image
                source={{ uri: commentPhoto }}
                style={styles.composerThumb}
              />
              <Pressable
                style={styles.composerThumbRemove}
                onPress={() => setCommentPhoto(null)}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.composer}>
            <Pressable
              style={styles.attachBtn}
              onPress={() => void pickCommentPhoto()}
              disabled={pickingPhoto || sending}
            >
              {pickingPhoto ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="image-outline"
                  size={22}
                  color={colors.primary}
                />
              )}
            </Pressable>
            <TextInput
              style={styles.input}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Yanıt yaz…"
              placeholderTextColor={colors.textHint}
              multiline
            />
            <Pressable
              style={[
                styles.send,
                sending && { opacity: 0.7 },
                !commentText.trim() && !commentPhoto && { opacity: 0.45 },
              ]}
              onPress={() => void postComment()}
              disabled={sending || (!commentText.trim() && !commentPhoto)}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={17} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      </>
      )}
    </SafeAreaView>
  );
}

function useStyles() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return { colors, styles };
}

function makeStyles(c: EVColorPalette) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minWidth: 22,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
    marginHorizontal: 8,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  postCard: {
    backgroundColor: c.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
    marginBottom: 18,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tagText: { fontSize: 12, fontWeight: '600' },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: c.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 14,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '800', fontSize: 13 },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textPrimary,
  },
  authorMeta: {
    marginTop: 2,
    fontSize: 12,
    color: c.textHint,
  },
  postDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.divider,
    marginVertical: 14,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: c.textPrimary,
  },
  topicPhoto: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginTop: 14,
    backgroundColor: c.background,
  },
  statsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, color: c.textHint, fontWeight: '500' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  repliesTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: c.textPrimary,
  },
  repliesCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repliesCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.primary,
  },
  emptyReplies: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  noComments: {
    fontSize: 13,
    color: c.textHint,
    textAlign: 'center',
  },
  replyCard: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  replyRail: {
    width: 3,
    borderRadius: 2,
    backgroundColor: c.primaryMid,
    marginRight: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  replyBody: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    padding: 12,
  },
  replyHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  replyHead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyDelete: {
    padding: 4,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: c.textPrimary,
  },
  replyIndex: {
    fontSize: 11,
    fontWeight: '600',
    color: c.primary,
  },
  commentTime: { fontSize: 11, color: c.textHint },
  commentText: {
    fontSize: 14,
    lineHeight: 21,
    color: c.textPrimary,
  },
  replyPhoto: {
    marginTop: 10,
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: c.background,
  },
  composerWrap: {
    borderTopWidth: 1,
    borderTopColor: c.divider,
    backgroundColor: c.surface,
    paddingTop: 8,
  },
  composerPreview: {
    marginLeft: 14,
    marginBottom: 6,
    width: 64,
    height: 64,
  },
  composerThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  composerThumbRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primaryLight,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: c.textPrimary,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
}
