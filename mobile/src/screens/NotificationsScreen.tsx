import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { EVColors } from '../theme/colors';
import {
  AppNotification,
  NotifType,
  markAllNotificationsRead,
  markNotificationRead,
  removeNotificationDoc,
  subscribeUserNotifications,
  timeAgo,
} from '../api/notifications';
import { hexWithAlpha } from '../data/forum';
import { HeaderMessagesButton } from '../components/HeaderMessagesButton';
import { useAuth } from '../auth/AuthContext';

function styleFor(type: NotifType): {
  bg: string;
  fg: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  switch (type) {
    case 'priceDown':
      return { bg: '#E8F9ED', fg: EVColors.primary, icon: 'arrow-down' };
    case 'priceUp':
      return { bg: '#FFE5E5', fg: '#D94F3D', icon: 'arrow-up' };
    case 'forum':
      return { bg: '#E8F0FC', fg: '#1C69D4', icon: 'chatbubbles' };
    case 'message':
      return { bg: '#E8F9ED', fg: EVColors.primary, icon: 'chatbubble-ellipses' };
    case 'system':
      return { bg: '#FFF3E0', fg: '#EF9F27', icon: 'information-circle' };
  }
}

export function NotificationsScreen() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasUnread = notifs.some((n) => !n.isRead);

  useEffect(() => {
    if (!user) {
      setNotifs([]);
      setLoading(false);
      return;
    }
    return subscribeUserNotifications(
      user.uid,
      (items) => {
        setNotifs(items);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 400));
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={
          notifs.length === 0 ? styles.flexGrow : styles.listPad
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={EVColors.primary}
            colors={[EVColors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Bildirimler</Text>
            <Text style={styles.subtitle}>
              Forum yanıtları ve mesajların
            </Text>
          </View>
          <View style={styles.headerActions}>
            <HeaderMessagesButton compact />
            {hasUnread && user ? (
              <Pressable
                onPress={() => void markAllNotificationsRead(user.uid)}
                style={styles.markAll}
              >
                <Text style={styles.markAllText}>Tümünü oku</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={EVColors.primary} />
          </View>
        ) : notifs.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="notifications-outline"
                size={36}
                color={EVColors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
            <Text style={styles.emptyBody}>
              {
                'Konuna yorum veya sana mesaj gelince\nburada görünecek'
              }
            </Text>
          </View>
        ) : (
          notifs.map((n) => <NotifCard key={n.id} notif={n} />)
        )}
      </ScrollView>
    </View>
  );
}

function NotifCard({ notif }: { notif: AppNotification }) {
  const { bg, fg, icon } = styleFor(notif.type);

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          style={styles.deleteAction}
          onPress={() => void removeNotificationDoc(notif.id)}
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </Pressable>
      )}
    >
      <Pressable
        style={[
          styles.card,
          !notif.isRead && {
            borderColor: EVColors.primaryMid,
            backgroundColor: hexWithAlpha(EVColors.primary, 0.04),
          },
        ]}
        onPress={() => {
          if (!notif.isRead) void markNotificationRead(notif.id);
        }}
      >
        <View style={[styles.iconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={20} color={fg} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {notif.title}
            </Text>
            {!notif.isRead ? <View style={styles.dot} /> : null}
          </View>
          <Text style={styles.cardBody} numberOfLines={2}>
            {notif.body}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(notif.time)}</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EVColors.background },
  flexGrow: { flexGrow: 1, paddingBottom: 100 },
  listPad: { paddingBottom: 100, paddingTop: 0 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: EVColors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: EVColors.textSecondary,
  },
  markAll: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: EVColors.primaryLight,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: EVColors.primary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: EVColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 13,
    color: EVColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EVColors.primary,
  },
  cardBody: {
    marginTop: 4,
    fontSize: 13,
    color: EVColors.textSecondary,
    lineHeight: 18,
  },
  cardTime: {
    marginTop: 6,
    fontSize: 11,
    color: EVColors.textHint,
  },
  deleteAction: {
    backgroundColor: EVColors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    marginTop: 10,
    marginRight: 16,
    borderRadius: 16,
  },
});
