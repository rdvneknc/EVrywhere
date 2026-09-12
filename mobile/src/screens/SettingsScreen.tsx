import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useTheme, type ThemeMode } from '../theme/ThemeContext';
import type { EVColorPalette } from '../theme/colors';
import { useAuth } from '../auth/AuthContext';
import { useNotificationPrefs } from '../notifications/NotificationPrefsContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SITE = 'https://evrywhere.vercel.app';

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user, logOut } = useAuth();
  const { preference, colors, setPreference } = useTheme();
  const { inAppEnabled, setInAppEnabled } = useNotificationPrefs();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const version =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    '1.0.0';

  const themeOptions: { id: ThemeMode; label: string; hint: string }[] = [
    { id: 'light', label: 'Açık', hint: 'Her zaman açık tema' },
    { id: 'dark', label: 'Koyu', hint: 'Her zaman koyu tema' },
    { id: 'system', label: 'Sistem', hint: 'Cihaz ayarını takip et' },
  ];

  const onLogout = () => {
    Alert.alert('Çıkış yap', 'Hesabından çıkmak istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış',
        style: 'destructive',
        onPress: () => void logOut(),
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Ayarlar</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Görünüm</Text>
        <View style={styles.card}>
          {themeOptions.map((opt, i) => {
            const active = preference === opt.id;
            return (
              <Pressable
                key={opt.id}
                style={[
                  styles.row,
                  i < themeOptions.length - 1 && styles.rowBorder,
                ]}
                onPress={() => setPreference(opt.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{opt.label}</Text>
                  <Text style={styles.rowHint}>{opt.hint}</Text>
                </View>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={active ? colors.primary : colors.textHint}
                />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Hesap</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>E-posta</Text>
              <Text style={styles.rowHint} numberOfLines={1}>
                {user?.email ?? '—'}
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.row, styles.rowBorder]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <Text style={[styles.rowTitle, { flex: 1 }]}>Profile git</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textHint}
            />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Bildirimler</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Uygulama içi bildirimler</Text>
              <Text style={styles.rowHint}>
                {inAppEnabled
                  ? 'Forum yanıtları, mesajlar ve fiyat uyarıları Bildirimler sekmesinde görünür.'
                  : 'Kapalıyken liste ve rozet gizlenir. Tekrar açınca kayıtlı bildirimler gelir.'}
              </Text>
            </View>
            <Switch
              value={inAppEnabled}
              onValueChange={setInAppEnabled}
              trackColor={{
                false: colors.border,
                true: colors.primaryMid,
              }}
              thumbColor={
                inAppEnabled ? colors.primary : colors.surface
              }
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Hakkında</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>EVrywhere</Text>
              <Text style={styles.rowHint}>Sürüm {version}</Text>
            </View>
          </View>
          <Pressable
            style={[styles.row, styles.rowBorder]}
            onPress={() => void Linking.openURL(SITE)}
          >
            <Ionicons
              name="globe-outline"
              size={20}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <Text style={[styles.rowTitle, { flex: 1 }]}>Web sitesi</Text>
            <Ionicons
              name="open-outline"
              size={16}
              color={colors.textHint}
            />
          </Pressable>
          <Pressable
            style={[styles.row, styles.rowBorder]}
            onPress={() =>
              Alert.alert(
                'Gizlilik',
                'Hesap ve içerik verilerin Firebase üzerinde saklanır. Engelleme, şikayet ve e-posta doğrulama ile topluluk güvenliği sağlanır.',
              )
            }
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <Text style={[styles.rowTitle, { flex: 1 }]}>Gizlilik</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textHint}
            />
          </Pressable>
          <Pressable
            style={[styles.row, styles.rowBorder]}
            onPress={() =>
              Alert.alert(
                'Yardım',
                Platform.select({
                  ios: 'Sorun için uygulamadaki Şikayet et seçeneklerini kullanabilir veya web üzerinden bize ulaşabilirsin.',
                  default:
                    'Sorun için uygulamadaki Şikayet et seçeneklerini kullanabilir veya web üzerinden bize ulaşabilirsin.',
                }),
              )
            }
          >
            <Ionicons
              name="help-circle-outline"
              size={20}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <Text style={[styles.rowTitle, { flex: 1 }]}>Yardım</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textHint}
            />
          </Pressable>
        </View>

        {user ? (
          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={styles.logoutText}>Çıkış yap</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: EVColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 10,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '800',
      color: c.textPrimary,
    },
    sectionLabel: {
      marginTop: 18,
      marginBottom: 8,
      marginHorizontal: 20,
      fontSize: 12,
      fontWeight: '700',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    card: {
      marginHorizontal: 16,
      borderRadius: 18,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
    },
    rowIcon: { marginTop: 1 },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textPrimary,
    },
    rowHint: {
      marginTop: 2,
      fontSize: 12,
      color: c.textHint,
      lineHeight: 16,
    },
    logoutBtn: {
      marginTop: 28,
      marginHorizontal: 16,
      height: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.error,
      backgroundColor: c.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: '700',
      color: c.error,
    },
  });
}
