import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { hexWithAlpha } from '../data/forum';
import { useAuth } from '../auth/AuthContext';
import {
  ConversationSummary,
  chatTimeAgo,
  subscribeMyConversations,
} from '../api/messaging';
import { useBlockLists } from '../hooks/useBlockLists';

type Props = NativeStackScreenProps<RootStackParamList, 'Messages'>;

export function MessagesScreen({ navigation }: Props) {
  const { colors, styles } = useStyles();
  const { user } = useAuth();
  const { blockedByIds, blockedIds } = useBlockLists();
  const [conversations, setConversations] = useState<ConversationSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }
    return subscribeMyConversations(
      user.uid,
      (items) => {
        setConversations(items);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user]);

  const visibleConversations = conversations.filter(
    (c) => !blockedByIds.includes(c.peer.userId),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    // Realtime zaten açık; kısa bir UI feedback
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons
            name="chevron-back"
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mesajlar</Text>
          <Text style={styles.subtitle}>Üyeler arası sohbetlerin</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : visibleConversations.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={styles.emptyIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={30}
              color={colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>Henüz mesajın yok</Text>
          <Text style={styles.emptyBody}>
            {
              'Forumda bir üyenin profiline gidip\nmesaj gönderebilirsin'
            }
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {visibleConversations.map((c) => (
            <Pressable
              key={c.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate('Chat', { conversationId: c.id })
              }
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: hexWithAlpha(c.peer.color, 0.15) },
                ]}
              >
                <Text
                  style={{
                    fontWeight: '700',
                    color: c.peer.color,
                    fontSize: 16,
                  }}
                >
                  {c.peer.initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.peer.name}</Text>
                {blockedIds.includes(c.peer.userId) ? (
                  <Text style={styles.blockedTag}>Engelledin</Text>
                ) : null}
                <Text style={styles.listing} numberOfLines={1}>
                  {c.subject}
                </Text>
                {c.lastMessage ? (
                  <Text style={styles.preview} numberOfLines={1}>
                    {c.lastMessage}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {c.lastMessageAt > 0 ? (
                  <Text style={styles.time}>
                    {chatTimeAgo(c.lastMessageAt)}
                  </Text>
                ) : null}
                {c.unread > 0 ? (
                  <View style={styles.unread}>
                    <Text style={styles.unreadText}>
                      {c.unread > 9 ? '9+' : c.unread}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: c.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: c.textSecondary,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
  },
  emptyBody: {
    marginTop: 6,
    fontSize: 13,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textPrimary,
  },
  blockedTag: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  listing: {
    marginTop: 2,
    fontSize: 11,
    color: c.primary,
    fontWeight: '500',
  },
  preview: {
    marginTop: 3,
    fontSize: 12,
    color: c.textSecondary,
  },
  time: { fontSize: 11, color: c.textHint },
  unread: {
    marginTop: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#D94F3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { fontSize: 10, fontWeight: '800', color: '#fff' },
});
}
