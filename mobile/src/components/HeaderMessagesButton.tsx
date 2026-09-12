import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { subscribeMyConversations } from '../api/messaging';
import { useBlockLists } from '../hooks/useBlockLists';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  compact?: boolean;
};

export function HeaderMessagesButton({ compact = false }: Props) {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const { hiddenIds } = useBlockLists();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    return subscribeMyConversations(user.uid, (items) => {
      const total = items
        .filter((c) => !hiddenIds.has(c.peer.userId))
        .reduce((sum, c) => sum + c.unread, 0);
      setUnread(total);
    });
  }, [user, hiddenIds]);

  return (
    <Pressable
      onPress={() => navigation.navigate('Messages')}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        pressed && styles.pressed,
      ]}
      hitSlop={6}
      accessibilityLabel="Mesajlar"
    >
      <Ionicons
        name="chatbubble-ellipses"
        size={compact ? 18 : 20}
        color={colors.primary}
      />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function makeStyles(c: EVColorPalette) {
  return StyleSheet.create({
    btn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: c.primaryLight,
      borderWidth: 1,
      borderColor: c.primaryMid,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    btnCompact: {
      width: 38,
      height: 38,
      borderRadius: 19,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.96 }],
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: c.error,
      borderWidth: 2,
      borderColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: '800',
    },
  });
}
