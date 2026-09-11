import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EVColors } from '../theme/colors';

type Props = {
  label: string;
  onPress?: () => void;
  isLoading?: boolean;
};

export function EVPrimaryButton({
  label,
  onPress,
  isLoading = false,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const enabled = !!onPress && !isLoading;

  const pressIn = () => {
    if (!enabled) return;
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={enabled ? onPress : undefined}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={!enabled}
    >
      <Animated.View
        style={[
          styles.btn,
          {
            backgroundColor: enabled ? EVColors.primary : EVColors.primaryMid,
            transform: [{ scale }],
            shadowOpacity: enabled ? 0.35 : 0,
            elevation: enabled ? 6 : 0,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={EVColors.onPrimary} size="small" />
        ) : (
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                { color: enabled ? EVColors.onPrimary : EVColors.textSecondary },
              ]}
            >
              {label}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={enabled ? EVColors.onPrimary : EVColors.textSecondary}
            />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: EVColors.primary,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
