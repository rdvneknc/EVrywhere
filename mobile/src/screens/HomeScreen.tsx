import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';
import { ForumScreen } from './ForumScreen';
import { ChargingScreen } from './ChargingScreen';
import { MarketplaceScreen } from './MarketplaceScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { ProfileScreen } from './ProfileScreen';
import { useAuth } from '../auth/AuthContext';
import { subscribeUserNotifications } from '../api/notifications';
import { useTheme } from '../theme/ThemeContext';
import { useNotificationPrefs } from '../notifications/NotificationPrefsContext';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, resolved } = useTheme();
  const { inAppEnabled } = useNotificationPrefs();
  const { user } = useAuth();
  const pagerRef = useRef<PagerView>(null);
  const [navIndex, setNavIndex] = useState(0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user || !inAppEnabled) {
      setUnread(0);
      return;
    }
    return subscribeUserNotifications(user.uid, (items) => {
      setUnread(items.filter((n) => !n.isRead).length);
    });
  }, [user, inAppEnabled]);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

  const goToPage = (index: number) => {
    setNavIndex(index);
    pagerRef.current?.setPage(index);
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: topInset, backgroundColor: colors.background },
      ]}
    >
      <StatusBar
        barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={Platform.OS === 'android'}
      />
      <PagerView
        ref={pagerRef}
        style={styles.body}
        initialPage={0}
        onPageSelected={(e) => setNavIndex(e.nativeEvent.position)}
        overdrag
      >
        <View key="forum" style={styles.page}>
          <ForumScreen />
        </View>
        <View key="charging" style={styles.page}>
          <ChargingScreen />
        </View>
        <View key="marketplace" style={styles.page}>
          <MarketplaceScreen />
        </View>
        <View key="notifications" style={styles.page}>
          <NotificationsScreen />
        </View>
        <View key="profile" style={styles.page}>
          <ProfileScreen />
        </View>
      </PagerView>
      <BottomNav
        currentIndex={navIndex}
        onTap={goToPage}
        unreadCount={unread}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
