import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import type { EVColorPalette } from '../theme/colors';

export type NavKey = 'forum' | 'charging' | 'marketplace' | 'notifications' | 'profile';

const NAV_ITEMS: {
  key: NavKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'forum', label: 'Forum', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
  { key: 'charging', label: 'Şarj', icon: 'flash', iconOutline: 'flash-outline' },
  { key: 'marketplace', label: '2. El', icon: 'swap-horizontal', iconOutline: 'swap-horizontal-outline' },
  { key: 'notifications', label: 'Bildirim', icon: 'notifications', iconOutline: 'notifications-outline' },
  { key: 'profile', label: 'Profil', icon: 'person', iconOutline: 'person-outline' },
];

type Props = {
  currentIndex: number;
  onTap: (index: number) => void;
  unreadCount?: number;
};

export function BottomNav({ currentIndex, onTap, unreadCount = 0 }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      <View style={styles.row}>
        {NAV_ITEMS.map((item, i) => {
          const active = i === currentIndex;
          const showBadge = i === 3 && unreadCount > 0;
          return (
            <Pressable
              key={item.key}
              style={styles.item}
              onPress={() => onTap(i)}
            >
              <View style={styles.iconStack}>
                <View
                  style={[
                    styles.iconPill,
                    active && styles.iconPillActive,
                  ]}
                >
                  <Ionicons
                    name={active ? item.icon : item.iconOutline}
                    size={22}
                    color={active ? colors.primary : colors.textHint}
                  />
                </View>
                {showBadge ? <View style={styles.badge} /> : null}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    fontWeight: active ? '600' : '400',
                    color: active ? colors.primary : colors.textHint,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(c: EVColorPalette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -3 },
      elevation: 10,
    },
    row: {
      height: 62,
      flexDirection: 'row',
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconStack: {
      position: 'relative',
    },
    iconPill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
    },
    iconPillActive: {
      backgroundColor: c.primaryLight,
    },
    badge: {
      position: 'absolute',
      right: 6,
      top: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.error,
    },
    label: {
      marginTop: 2,
      fontSize: 10,
    },
  });
}
