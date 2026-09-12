import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import {
  AppNotification,
  NotifType,
  markAllNotificationsRead,
  markNotificationRead,
  removeNotificationDoc,
  subscribeUserNotifications,
  timeAgo,
} from '../api/notifications';
import { HeaderMessagesButton } from '../components/HeaderMessagesButton';
import { useAuth } from '../auth/AuthContext';
import { useNotificationPrefs } from '../notifications/NotificationPrefsContext';

function styleFor(type: NotifType): {
  bg: string;
  fg: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  switch (type) {
    case 'priceDown':
      return { bg: '#E8F9ED', fg: '#2DC653', icon: 'arrow-down' };
    case 'priceUp':
      return { bg: '#FFE5E5', fg: '#D94F3D', icon: 'arrow-up' };
    case 'forum':
      return { bg: '#E8F3FC', fg: '#1C69D4', icon: 'chatbubbles' };
    case 'message':
      return { bg: '#E8F9ED', fg: '#2DC653', icon: 'chatbubble-ellipses' };
    case 'system':
      return { bg: '#FFF3E0', fg: '#EF9F27', icon: 'information-circle' };
  }
}

export function NotificationsScreen() {
  const { colors, styles } = useStyles();
  const { resolved } = useTheme();
  const { inAppEnabled } = useNotificationPrefs();
  const { user } = useAuth();
  const fadeColors =
    resolved === 'dark'
      ? (['#143221', '#122018', '#0B1410', '#0B1410'] as const)
      : (['#D8F5E2', '#E8F9ED', '#F5FBF7', '#FFFFFF'] as const);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasUnread = notifs.some((n) => !n.isRead);

  useEffect(() => {
    if (!user || !inAppEnabled) {
      setNotifs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeUserNotifications(
      user.uid,
      (items) => {
        setNotifs(items);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user, inAppEnabled]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 400));
    setRefreshing(false);
  };

  const openQuickActions = () => {
    if (!user || !inAppEnabled) return;
    Alert.alert('Bildirimler', undefined, [
      hasUnread
        ? {
            text: 'Tümünü okundu işaretle',
            onPress: () => void markAllNotificationsRead(user.uid),
          }
        : {
            text: 'Okunmamış bildirim yok',
            style: 'cancel',
          },
      { text: 'Kapat', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        pointerEvents="none"
        colors={[...fadeColors]}
        locations={[0, 0.28, 0.62, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bgFade}
      />
      <View pointerEvents="none" style={styles.decorA} />
      <View pointerEvents="none" style={styles.decorB} />

      <ScrollView
        contentContainerStyle={
          !inAppEnabled || notifs.length === 0 ? styles.flexGrow : styles.listPad
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
            enabled={inAppEnabled}
          />
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Bildirimler</Text>
            <Text style={styles.subtitle}>
              {inAppEnabled
                ? 'Forum yanıtları ve mesajların'
                : 'Uygulama içi bildirimler kapalı'}
            </Text>
          </View>
          <HeaderMessagesButton compact />
        </View>

        {!inAppEnabled ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="notifications-off-outline"
                size={36}
                color={colors.textHint}
              />
            </View>
            <Text style={styles.emptyTitle}>Bildirimler kapalı</Text>
            <Text style={styles.emptyBody}>
              {
                'Açmak için Profil → Ayarlar →\nUygulama içi bildirimler'
              }
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : notifs.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="notifications-outline"
                size={36}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
            <Text style={styles.emptyBody}>
              {'Konuna yorum veya sana mesaj gelince\nburada görünecek'}
            </Text>
          </View>
        ) : (
          notifs.map((n) => <NotifCard key={n.id} notif={n} />)
        )}
      </ScrollView>

      {user && inAppEnabled ? (
        <Pressable
          style={styles.fab}
          onPress={openQuickActions}
          accessibilityLabel="Bildirim işlemleri"
        >
          <Ionicons name="settings" size={22} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

function NotifCard({ notif }: { notif: AppNotification }) {
  const { colors, styles } = useStyles();
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
        style={styles.card}
        onPress={() => {
          if (!notif.isRead) void markNotificationRead(notif.id);
        }}
      >
        <View style={styles.iconStack}>
          <View style={[styles.iconWrap, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={20} color={fg} />
          </View>
          {!notif.isRead ? <View style={styles.unreadDot} /> : null}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {notif.title}
          </Text>
          <Text style={styles.cardBody} numberOfLines={2}>
            {notif.body}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(notif.time)}</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

function useStyles() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return { colors, styles };
}

function makeStyles(c: EVColorPalette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  bgFade: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '58%',
  },
  decorA: {
    position: 'absolute',
    right: -30,
    top: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(45, 198, 83, 0.10)',
  },
  decorB: {
    position: 'absolute',
    right: 40,
    top: 70,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(45, 198, 83, 0.08)',
  },
  flexGrow: { flexGrow: 1, paddingBottom: 110 },
  listPad: { paddingBottom: 110, paddingTop: 0 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: c.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: c.textSecondary,
    fontWeight: '500',
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
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '700',
    color: c.textPrimary,
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 13,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 22,
    backgroundColor: c.surface,
    flexDirection: 'row',
    gap: 14,
    shadowColor: '#0D1B12',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconStack: {
    position: 'relative',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: c.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: c.textPrimary,
    letterSpacing: -0.2,
  },
  cardBody: {
    marginTop: 4,
    fontSize: 13,
    color: c.textSecondary,
    lineHeight: 18,
  },
  cardTime: {
    marginTop: 8,
    fontSize: 11,
    color: c.textHint,
    fontWeight: '500',
  },
  deleteAction: {
    backgroundColor: c.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    marginTop: 10,
    marginRight: 16,
    borderRadius: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
}
