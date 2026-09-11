import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EVColors } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import { hexWithAlpha } from '../data/forum';
import { useAuth } from '../auth/AuthContext';
import {
  ChatMessageDoc,
  PeerProfile,
  markConversationRead,
  sendChatMessage,
  subscribeConversationMessages,
  subscribeConversationMeta,
} from '../api/messaging';
import {
  getBlockRelation,
  messageForBlockRelation,
  unblockUser,
  type BlockRelation,
} from '../api/moderation';
import { useBlockLists } from '../hooks/useBlockLists';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const { blockedIds, blockedByIds } = useBlockLists();
  const [messages, setMessages] = useState<ChatMessageDoc[]>([]);
  const [peer, setPeer] = useState<PeerProfile | null>(null);
  const [subject, setSubject] = useState('Direkt mesaj');
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [unblocking, setUnblocking] = useState(false);
  const [blockRelation, setBlockRelation] = useState<BlockRelation>('none');
  const scrollRef = useRef<ScrollView>(null);

  const blockMessage = messageForBlockRelation(blockRelation);
  const messagingLocked = blockRelation !== 'none';
  const iBlocked =
    blockRelation === 'blocked' || blockRelation === 'mutual';

  const refreshRelation = (peerId: string) => {
    if (!user) return;
    void getBlockRelation(user.uid, peerId).then(setBlockRelation);
  };

  useEffect(() => {
    if (!user) return;
    const unsubMeta = subscribeConversationMeta(
      conversationId,
      user.uid,
      (meta) => {
        if (!meta) {
          setMissing(true);
          setLoading(false);
          return;
        }
        setPeer(meta.peer);
        setSubject(meta.subject);
        setMissing(false);
        refreshRelation(meta.peer.userId);
      },
    );
    const unsubMsgs = subscribeConversationMessages(
      conversationId,
      user.uid,
      (next) => {
        setMessages(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    void markConversationRead(conversationId, user.uid).catch(() => undefined);
    return () => {
      unsubMeta();
      unsubMsgs();
    };
  }, [conversationId, user]);

  useEffect(() => {
    if (!user || !peer?.userId) return;
    refreshRelation(peer.userId);
  }, [user?.uid, peer?.userId, blockedIds, blockedByIds]);

  const send = async () => {
    const t = text.trim();
    if (!t || !user || sending || messagingLocked) return;
    setSending(true);
    try {
      await sendChatMessage(conversationId, user, t);
      setText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Tekrar dene.';
      Alert.alert('Gönderilemedi', msg);
      if (peer?.userId) refreshRelation(peer.userId);
    } finally {
      setSending(false);
    }
  };

  const onUnblock = () => {
    if (!user || !peer || unblocking) return;
    setUnblocking(true);
    void unblockUser(user.uid, peer.userId)
      .then(() => {
        setBlockRelation((prev) =>
          prev === 'mutual' ? 'blocked_by' : 'none',
        );
        Alert.alert('Engel kaldırıldı');
      })
      .catch((e) =>
        Alert.alert(
          'İşlem başarısız',
          e instanceof Error ? e.message : 'Tekrar dene.',
        ),
      )
      .finally(() => setUnblocking(false));
  };

  if (missing) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={EVColors.textPrimary} />
        </Pressable>
        <Text style={styles.missing}>Konuşma bulunamadı</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons
              name="chevron-back"
              size={22}
              color={EVColors.textPrimary}
            />
          </Pressable>
          {peer ? (
            <Pressable
              style={styles.peerTap}
              onPress={() =>
                navigation.navigate('UserProfile', {
                  userId: peer.userId,
                  name: peer.name,
                  initials: peer.initials,
                  color: peer.color,
                  contextTitle: subject,
                })
              }
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: hexWithAlpha(peer.color, 0.15) },
                ]}
              >
                <Text
                  style={{
                    fontWeight: '700',
                    color: peer.color,
                    fontSize: 13,
                  }}
                >
                  {peer.initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{peer.name}</Text>
                <Text style={styles.listing} numberOfLines={1}>
                  {subject}
                </Text>
              </View>
            </Pressable>
          ) : (
            <ActivityIndicator color={EVColors.primary} />
          )}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={EVColors.primary} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
          >
            {messages.length === 0 ? (
              <Text style={styles.emptyChat}>
                {messagingLocked
                  ? 'Mesaj gönderilemez.'
                  : 'İlk mesajı sen yaz.'}
              </Text>
            ) : (
              messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    m.fromMe ? styles.bubbleMe : styles.bubbleThem,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      { color: m.fromMe ? '#fff' : EVColors.textPrimary },
                    ]}
                  >
                    {m.text}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {blockMessage ? (
          <View style={styles.blockBanner}>
            <Text style={styles.blockBannerText}>{blockMessage}</Text>
            {iBlocked ? (
              <Pressable
                style={[styles.unblockBtn, unblocking && { opacity: 0.7 }]}
                onPress={onUnblock}
                disabled={unblocking}
              >
                {unblocking ? (
                  <ActivityIndicator color="#92400E" size="small" />
                ) : (
                  <Text style={styles.unblockBtnText}>Engeli kaldır</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {messagingLocked ? null : (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Mesaj yaz…"
              placeholderTextColor={EVColors.textHint}
            />
            <Pressable
              style={[styles.send, sending && { opacity: 0.7 }]}
              onPress={() => void send()}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={17} color="#fff" />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: EVColors.background },
  back: { padding: 16 },
  missing: {
    textAlign: 'center',
    color: EVColors.textSecondary,
    marginTop: 40,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyChat: {
    textAlign: 'center',
    color: EVColors.textHint,
    marginTop: 40,
  },
  blockBanner: {
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    gap: 10,
  },
  blockBannerText: {
    textAlign: 'center',
    color: '#92400E',
    fontWeight: '600',
    fontSize: 13,
  },
  unblockBtn: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  unblockBtnText: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: EVColors.divider,
  },
  peerTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontWeight: '800', fontSize: 15, color: EVColors.textPrimary },
  listing: { marginTop: 1, fontSize: 12, color: EVColors.textHint },
  messages: { padding: 14, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: EVColors.primary,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: EVColors.divider,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: EVColors.border,
    backgroundColor: EVColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: EVColors.textPrimary,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: EVColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
