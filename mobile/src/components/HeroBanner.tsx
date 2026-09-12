import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  source: ImageSourcePropType;
  eyebrow: string;
  title: string;
  subtitle: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Hero: aynı koyu ton, ama sol→sağ yumuşak gradyan.
 * LinearGradient’e width/height %100 veriyoruz (absoluteFill tek başına
 * bazen 0×0 kalıyordu).
 */
export function HeroBanner({
  source,
  eyebrow,
  title,
  subtitle,
  style,
}: Props) {
  return (
    <ImageBackground
      source={source}
      style={[styles.frame, style]}
      imageStyle={styles.image}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(6, 18, 12, 0.72)',
          'rgba(6, 18, 12, 0.45)',
          'rgba(6, 18, 12, 0.18)',
          'rgba(6, 18, 12, 0)',
        ]}
        locations={[0, 0.32, 0.62, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.fade}
      />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 210,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 22,
  },
  fade: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  copy: {
    paddingHorizontal: 18,
    paddingBottom: 52,
    paddingTop: 24,
    maxWidth: '78%',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9AF0B4',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
