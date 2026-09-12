import { useMemo } from 'react';
import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { useTheme } from './ThemeContext';
import type { EVColorPalette } from './colors';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: EVColorPalette) => T | NamedStyles<T>,
): T {
  const { colors, resolved } = useTheme();
  return useMemo(
    () => StyleSheet.create(factory(colors)) as T,
    // resolved ensures recreate when palette swaps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors, resolved, factory],
  );
}
