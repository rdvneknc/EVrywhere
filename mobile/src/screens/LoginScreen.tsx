import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { EVLogoIcon } from '../components/EVLogoIcon';
import { EVPrimaryButton } from '../components/EVPrimaryButton';
import { useAuth } from '../auth/AuthContext';

type Mode = 'login' | 'register';

export function LoginScreen() {
  const { colors, styles } = useStyles();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  const canSubmit =
    email.trim().includes('@') && password.length >= 6 && !isLoading;

  const brandTitle = useMemo(
    () => (
      <Text style={styles.brand}>
        <Text style={styles.brandEv}>EV</Text>
        <Text style={styles.brandRest}>rywhere</Text>
      </Text>
    ),
    [],
  );

  const onSubmit = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
        Alert.alert(
          'Hesap oluşturuldu',
          'Doğrulama e-postası gönderildi. Gelen kutunu (ve spam) kontrol et.',
        );
      }
    } catch (e) {
      Alert.alert(
        'Hata',
        e instanceof Error ? e.message : 'Bir şeyler ters gitti',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!email.trim().includes('@')) {
      Alert.alert('E-posta gerekli', 'Şifre sıfırlamak için e-posta adresini yaz.');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Mail gönderildi',
        'Şifre sıfırlama bağlantısı e-posta adresine iletildi.',
      );
    } catch (e) {
      Alert.alert(
        'Gönderilemedi',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fade, transform: [{ translateY: slide }] },
            ]}
          >
            <View style={styles.logoBlock}>
              <EVLogoIcon size={76} />
              <View style={{ height: 20 }} />
              {brandTitle}
              <Text style={styles.tagline}>Share the drive</Text>
            </View>

            <Text style={styles.heading}>
              {mode === 'login' ? 'Welcome back' : 'Hesap oluştur'}
            </Text>
            <Text style={styles.subheading}>
              {mode === 'login'
                ? 'E-posta ve şifrenle giriş yap'
                : 'Ücretsiz üye ol, topluluğa katıl'}
            </Text>

            {mode === 'register' ? (
              <View style={styles.fieldWrap}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.textHint}
                />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ad Soyad (isteğe bağlı)"
                  placeholderTextColor={colors.textHint}
                  autoCapitalize="words"
                />
              </View>
            ) : null}

            <View style={styles.fieldWrap}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={colors.textHint}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="E-posta"
                placeholderTextColor={colors.textHint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={colors.textHint}
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Şifre (min. 6 karakter)"
                placeholderTextColor={colors.textHint}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textHint}
                />
              </Pressable>
            </View>

            {mode === 'login' ? (
              <Pressable
                style={styles.forgotBtn}
                onPress={() => void onForgotPassword()}
                disabled={isLoading}
              >
                <Text style={styles.forgotText}>Şifremi unuttum</Text>
              </Pressable>
            ) : null}

            <View style={{ height: 16 }} />

            <EVPrimaryButton
              label={mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              onPress={canSubmit ? onSubmit : undefined}
              isLoading={isLoading}
            />

            <Pressable
              style={styles.switchMode}
              onPress={() =>
                setMode((m) => (m === 'login' ? 'register' : 'login'))
              }
            >
              <Text style={styles.switchText}>
                {mode === 'login'
                  ? 'Hesabın yok mu? '
                  : 'Zaten üye misin? '}
                <Text style={styles.switchLink}>
                  {mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}
                </Text>
              </Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing you agree to our{' '}
                <Text style={styles.footerLink}>Terms of Service</Text>
                {' and '}
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useStyles() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return { colors, styles };
}

function makeStyles(c: EVColorPalette) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  content: {
    flexGrow: 1,
    paddingTop: 48,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandEv: { color: c.primary },
  brandRest: { color: c.textPrimary },
  tagline: {
    marginTop: 6,
    fontSize: 15,
    color: c.textSecondary,
    letterSpacing: 0.2,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: c.textPrimary,
    letterSpacing: -0.4,
  },
  subheading: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 15,
    color: c.textSecondary,
    lineHeight: 21,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: c.textPrimary,
    paddingVertical: 16,
  },
  switchMode: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.primary,
  },
  switchText: {
    fontSize: 14,
    color: c.textSecondary,
  },
  switchLink: {
    color: c.primary,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: c.textHint,
    textAlign: 'center',
    lineHeight: 19,
  },
  footerLink: {
    color: c.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
}
