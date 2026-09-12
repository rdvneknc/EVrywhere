import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { hexWithAlpha } from '../data/forum';
import { useAuth } from '../auth/AuthContext';
import { openOrCreateConversation } from '../api/messaging';
import {
  UserPublicProfile,
  fetchUserPublicProfile,
  formatJoinDate,
} from '../api/users';
import {
  blockUser,
  getBlockRelation,
  messageForBlockRelation,
  syncOutgoingBlockMirrors,
  unblockUser,
  type BlockRelation,
} from '../api/moderation';
import { promptReport } from '../lib/reportPrompt';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export function UserProfileScreen({ navigation, route }: Props) {
  const { colors, styles } = useStyles();
  const { userId, name, initials, color, contextTitle } = route.params;
  const { user } = useAuth();
  const [opening, setOpening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [relation, setRelation] = useState<BlockRelation>('none');
  const isSelf = user?.uid === userId;
  const blockMessage = messageForBlockRelation(relation);
  const iBlocked = relation === 'blocked' || relation === 'mutual';
  const contentHidden = relation !== 'none';

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void fetchUserPublicProfile(userId, { name, initials, color })
      .then((p) => {
        if (alive) setProfile(p);
      })
      .catch(() => {
        if (alive) {
          setProfile({
            userId,
            displayName: name,
            initials,
            color,
            bio: '',
            createdAt: null,
            topicCount: 0,
            replyCount: 0,
            listingCount: 0,
            garage: null,
          });
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userId, name, initials, color]);

  useEffect(() => {
    if (!user || isSelf) {
      setRelation('none');
      return;
    }
    let alive = true;
    void syncOutgoingBlockMirrors(user.uid)
      .catch(() => undefined)
      .then(() => getBlockRelation(user.uid, userId))
      .then((r) => {
        if (alive) setRelation(r);
      });
    return () => {
      alive = false;
    };
  }, [user, userId, isSelf]);

  const displayName = profile?.displayName ?? name;
  const displayInitials = profile?.initials ?? initials;
  const displayColor = profile?.color ?? color;

  const startChat = async () => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'Mesaj göndermek için giriş yapmalısın.');
      return;
    }
    if (isSelf) {
      Alert.alert('Bu sensin', 'Kendine mesaj gönderemezsin.');
      return;
    }
    if (contentHidden) {
      Alert.alert('Engelli', blockMessage ?? 'Mesaj gönderilemez.');
      return;
    }
    if (opening) return;
    setOpening(true);
    try {
      const conversationId = await openOrCreateConversation(
        user,
        {
          userId,
          name: displayName,
          initials: displayInitials,
          color: displayColor,
        },
        contextTitle ? `Konu: ${contextTitle}` : 'Direkt mesaj',
      );
      navigation.replace('Chat', { conversationId });
    } catch (e) {
      Alert.alert(
        'Mesaj açılamadı',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setOpening(false);
    }
  };

  const toggleBlock = () => {
    if (!user || isSelf) return;
    if (iBlocked) {
      void unblockUser(user.uid, userId)
        .then(() => {
          setRelation((prev) =>
            prev === 'mutual' ? 'blocked_by' : 'none',
          );
          Alert.alert('Engel kaldırıldı');
        })
        .catch((e) =>
          Alert.alert(
            'İşlem başarısız',
            e instanceof Error ? e.message : 'Tekrar dene.',
          ),
        );
      return;
    }
    Alert.alert(
      'Engelle',
      `${displayName} engellensin mi? Profili, ilanları ve mesajları gizlenir.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: () => {
            void blockUser(user.uid, userId)
              .then(() => {
                setRelation((prev) =>
                  prev === 'blocked_by' ? 'mutual' : 'blocked',
                );
                Alert.alert('Engellendi');
              })
              .catch((e) =>
                Alert.alert(
                  'İşlem başarısız',
                  e instanceof Error ? e.message : 'Tekrar dene.',
                ),
              );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons
            name="chevron-back"
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>
        <Text style={styles.topTitle}>Üye profili</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: hexWithAlpha(displayColor, 0.15),
              borderColor: hexWithAlpha(displayColor, 0.35),
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: displayColor }]}>
            {displayInitials}
          </Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <View style={styles.badge}>
          <Ionicons name="flash" size={12} color={colors.primary} />
          <Text style={styles.badgeText}>EV Sürücüsü</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: 28 }}
          />
        ) : contentHidden ? (
          <Text style={styles.blockBodyHint}>
            Bu üyenin profili, ilanları ve içerikleri gizlendi.
          </Text>
        ) : (
          <>
            {profile?.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : null}

            {profile?.garage ? (
              <View style={styles.garageChip}>
                <Text style={{ fontSize: 16 }}>
                  {profile.garage.emoji || '⚡'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.garageTitle}>
                    {profile.garage.brand} {profile.garage.model}
                  </Text>
                  <Text style={styles.garageMeta}>
                    {[
                      profile.garage.year,
                      profile.garage.km ? `${profile.garage.km} km` : '',
                      profile.garage.batteryHealth,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Garaj'}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.statsCard}>
              <Stat
                icon="calendar-outline"
                label="Katılım"
                value={formatJoinDate(profile?.createdAt ?? null)}
              />
              <View style={styles.statDiv} />
              <Stat
                icon="document-text-outline"
                label="Konu"
                value={String(profile?.topicCount ?? 0)}
                onPress={() =>
                  navigation.navigate('UserTopics', {
                    userId,
                    name: displayName,
                  })
                }
              />
              <View style={styles.statDiv} />
              <Stat
                icon="chatbubbles-outline"
                label="Yanıt"
                value={String(profile?.replyCount ?? 0)}
              />
            </View>

            <View style={styles.listingStatRow}>
              <Ionicons
                name="swap-horizontal"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.listingStatText}>
                {profile?.listingCount ?? 0} aktif 2. el ilanı
              </Text>
            </View>

            {contextTitle ? (
              <Text style={styles.context} numberOfLines={2}>
                Bu profilden: {contextTitle}
              </Text>
            ) : null}
          </>
        )}

        {!isSelf ? (
          <>
            {blockMessage ? (
              <Text style={styles.blockHint}>{blockMessage}</Text>
            ) : null}
            {!contentHidden ? (
            <Pressable
              style={[
                styles.msgBtn,
                opening && { opacity: 0.75 },
              ]}
              onPress={() => void startChat()}
              disabled={opening}
            >
              {opening ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.msgLabel}>Mesaj gönder</Text>
                </>
              )}
            </Pressable>
            ) : null}
            {user ? (
              <View style={styles.moderationRow}>
                <Pressable style={styles.modBtn} onPress={toggleBlock}>
                  <Ionicons
                    name={iBlocked ? 'lock-open-outline' : 'ban-outline'}
                    size={16}
                    color={iBlocked ? colors.primary : colors.error}
                  />
                  <Text
                    style={[
                      styles.modBtnText,
                      {
                        color: iBlocked ? colors.primary : colors.error,
                      },
                    ]}
                  >
                    {iBlocked ? 'Engeli kaldır' : 'Engelle'}
                  </Text>
                </Pressable>
                {!contentHidden ? (
                <Pressable
                  style={styles.modBtn}
                  onPress={() =>
                    promptReport({
                      reporterId: user.uid,
                      targetType: 'user',
                      targetId: userId,
                      targetLabel: displayName,
                    })
                  }
                >
                  <Ionicons
                    name="flag-outline"
                    size={16}
                    color={colors.textHint}
                  />
                  <Text style={[styles.modBtnText, { color: colors.textHint }]}>
                    Şikayet et
                  </Text>
                </Pressable>
                ) : null}
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.selfHint}>Bu senin profilin</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const { colors, styles } = useStyles();
  const content = (
    <>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          onPress ? { color: colors.primary, fontWeight: '600' } : null,
        ]}
      >
        {label}
        {onPress ? ' ›' : ''}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.statCol} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.statCol}>{content}</View>;
}

function useStyles() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return { colors, styles };
}

function makeStyles(c: EVColorPalette) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800' },
  name: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '800',
    color: c.textPrimary,
    letterSpacing: -0.4,
  },
  badge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: c.primaryLight,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.primary,
  },
  bio: {
    marginTop: 14,
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  garageChip: {
    marginTop: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  garageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textPrimary,
  },
  garageMeta: {
    marginTop: 2,
    fontSize: 12,
    color: c.textHint,
  },
  statsCard: {
    marginTop: 24,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  listingStatRow: {
    marginTop: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.primaryLight,
  },
  listingStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.primary,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  statDiv: {
    width: 1,
    backgroundColor: c.divider,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: c.textPrimary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: c.textHint,
    fontWeight: '500',
  },
  context: {
    marginTop: 16,
    fontSize: 13,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  msgBtn: {
    marginTop: 28,
    minWidth: 200,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  msgLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  moderationRow: {
    marginTop: 14,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  modBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  modBtnText: { fontSize: 13, fontWeight: '600' },
  selfHint: {
    marginTop: 28,
    fontSize: 14,
    color: c.textHint,
  },
  blockHint: {
    textAlign: 'center',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 10,
    overflow: 'hidden',
  },
  blockBodyHint: {
    marginTop: 20,
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
});
}
