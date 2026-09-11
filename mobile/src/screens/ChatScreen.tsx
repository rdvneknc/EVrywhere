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
  type BlockRelation,
} from '../api/moderation';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageDoc[]>([]);
  const [peer, setPeer] = useState<PeerProfile | null>(null);
  const [subject, setSubject] = useState('Direkt mesaj');
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [blockRelation, setBlockRelation] = useState<BlockRelation>('none');
  const scrollRef = useRef<ScrollView>(null);

  const blockMessage = messageForBlockRelation(blockRelation);
  const messagingLocked = blockRelation !== 'none';

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
        void getBlockRelation(user.uid, meta.peer.userId).then(setBlockRelation);
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

  const send = async () => {
    const t = text.trim();
    if (!t || !user || sending || messagingLocked) return;
    setSending(true);
    try {
      await sendChatMessage(conversationId, user, t);
      setText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e) {
      Alert.alert(
        'Gönderilemedi',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setSending(false);
    }
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
              <Text style={styles.emptyChat}>İlk mesajı sen yaz.</Text>
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
  },
  blockBannerText: {
    textAlign: 'center',
    color: '#92400E',
    fontWeight: '600',
    fontSize: 13,
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
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  listing: { fontSize: 11, color: EVColors.primary, marginTop: 1 },
  messages: { padding: 16, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: EVColors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 19 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: EVColors.divider,
    backgroundColor: EVColors.surface,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: EVColors.border,
    backgroundColor: EVColors.background,
    paddingHorizontal: 14,
    fontSize: 14,
    color: EVColors.textPrimary,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: EVColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
