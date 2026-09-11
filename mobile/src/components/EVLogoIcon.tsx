import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EVColors } from '../theme/colors';

type Props = {
  size?: number;
};

export function EVLogoIcon({ size = 72 }: Props) {
  const radius = size * 0.28;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          shadowOpacity: 0.3,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        },
      ]}
    >
      <Ionicons
        name="flash"
        size={size * 0.5}
        color={EVColors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: EVColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: EVColors.primary,
  },
});
