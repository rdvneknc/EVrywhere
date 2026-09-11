import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EVColors } from '../theme/colors';
import { BottomNav } from '../components/BottomNav';
import { ForumScreen } from './ForumScreen';
import { ChargingScreen } from './ChargingScreen';
import { MarketplaceScreen } from './MarketplaceScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { ProfileScreen } from './ProfileScreen';
import { useAuth } from '../auth/AuthContext';
import { subscribeUserNotifications } from '../api/notifications';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [navIndex, setNavIndex] = useState(0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    return subscribeUserNotifications(user.uid, (items) => {
      setUnread(items.filter((n) => !n.isRead).length);
    });
  }, [user]);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={EVColors.background}
        translucent={Platform.OS === 'android'}
      />
      <View style={styles.body}>
        <View style={[styles.page, navIndex !== 0 && styles.hidden]}>
          <ForumScreen />
        </View>
        <View style={[styles.page, navIndex !== 1 && styles.hidden]}>
          <ChargingScreen />
        </View>
        <View style={[styles.page, navIndex !== 2 && styles.hidden]}>
          <MarketplaceScreen />
        </View>
        <View style={[styles.page, navIndex !== 3 && styles.hidden]}>
          <NotificationsScreen />
        </View>
        <View style={[styles.page, navIndex !== 4 && styles.hidden]}>
          <ProfileScreen />
        </View>
      </View>
      <BottomNav
        currentIndex={navIndex}
        onTap={setNavIndex}
        unreadCount={unread}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: EVColors.background,
  },
  body: {
    flex: 1,
  },
  page: {
    ...StyleSheet.absoluteFill,
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
});
