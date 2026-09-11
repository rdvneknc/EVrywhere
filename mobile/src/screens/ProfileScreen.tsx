import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EVColors } from '../theme/colors';
import {
  CATEGORY_BADGE,
  ForumTopic,
  formatCount,
  hexWithAlpha,
} from '../data/forum';
import { EvListing, EV_BRANDS, formatPrice } from '../data/marketplace';
import { HeaderMessagesButton } from '../components/HeaderMessagesButton';
import { useAuth } from '../auth/AuthContext';
import { RootStackParamList } from '../navigation/types';
import {
  UserGarage,
  UserPublicProfile,
  fetchUserPublicProfile,
  formatJoinDate,
  updateMyProfile,
} from '../api/users';
import { fetchForumTopicsByAuthor } from '../api/forumTopics';
import { fetchListingsBySeller } from '../api/listings';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabKey = 'garage' | 'forum' | 'listings';

const CURRENT_YEAR = new Date().getFullYear();
const GARAGE_YEARS = Array.from({ length: CURRENT_YEAR - 2010 + 1 }, (_, i) =>
  String(CURRENT_YEAR - i),
);

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const {
    user,
    logOut,
    emailVerified,
    sendVerificationEmail,
    refreshUser,
    changeEmail,
  } = useAuth();
  const [tab, setTab] = useState<TabKey>('garage');
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [listings, setListings] = useState<EvListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showGarageEdit, setShowGarageEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setTopics([]);
      setListings([]);
      setLoading(false);
      return;
    }
    try {
      const [p, t, l] = await Promise.all([
        fetchUserPublicProfile(user.uid, {
          name: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
          initials: (user.displayName || 'EV')
            .split(/\s+/)
            .map((x) => x[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase(),
          color: EVColors.primary,
        }),
        fetchForumTopicsByAuthor(user.uid),
        fetchListingsBySeller(user.uid),
      ]);
      setProfile(p);
      setTopics(t);
      setListings(l);
    } catch {
      Alert.alert('Profil', 'Profil bilgileri yüklenemedi. Tekrar dene.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const nickname = useMemo(() => {
    const email = user?.email;
    if (!email) return '@uye';
    return `@${email.split('@')[0]}`;
  }, [user?.email]);

  const onLogout = () => {
    Alert.alert('Çıkış yap', 'Hesabından çıkmak istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış',
        style: 'destructive',
        onPress: () => {
          void logOut();
        },
      },
    ]);
  };

  const saveProfile = async (name: string, bio: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateMyProfile(user, { displayName: name, bio });
      setShowEdit(false);
      await load();
    } catch (e) {
      Alert.alert(
        'Kaydedilemedi',
        e instanceof Error ? e.message : 'Profil güncellenemedi.',
      );
    } finally {
      setSaving(false);
    }
  };

  const saveGarage = async (garage: UserGarage | null) => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      await updateMyProfile(user, {
        displayName: profile.displayName,
        garage,
      });
      setShowGarageEdit(false);
      await load();
    } catch (e) {
      Alert.alert(
        'Kaydedilemedi',
        e instanceof Error ? e.message : 'Garaj güncellenemedi.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.emptyTitle}>Giriş gerekli</Text>
        <Text style={styles.emptyBody}>Profilini görmek için giriş yap.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={EVColors.primary}
            colors={[EVColors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.appBar}>
            <Text style={styles.appTitle}>Profilim</Text>
            <View style={styles.appBarActions}>
              <HeaderMessagesButton compact />
              <Pressable style={styles.iconBtn} onPress={onLogout}>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={EVColors.textPrimary}
                />
              </Pressable>
            </View>
          </View>

          {loading && !profile ? (
            <ActivityIndicator
              color={EVColors.primary}
              style={{ marginVertical: 40 }}
            />
          ) : (
            <>
              <View style={styles.avatarRow}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: hexWithAlpha(
                        profile?.color ?? EVColors.primary,
                        0.15,
                      ),
                      borderColor: hexWithAlpha(
                        profile?.color ?? EVColors.primary,
                        0.35,
                      ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: profile?.color ?? EVColors.primary },
                    ]}
                  >
                    {profile?.initials ?? 'EV'}
                  </Text>
                </View>
                <View style={styles.stats}>
                  <StatCol
                    value={String(profile?.topicCount ?? 0)}
                    label="Konu"
                    onPress={() =>
                      navigation.navigate('UserTopics', {
                        userId: user.uid,
                        name: profile?.displayName ?? 'Ben',
                      })
                    }
                  />
                  <View style={styles.vDiv} />
                  <StatCol
                    value={String(profile?.replyCount ?? 0)}
                    label="Yanıt"
                  />
                  <View style={styles.vDiv} />
                  <StatCol
                    value={String(
                      profile?.listingCount ?? listings.length,
                    )}
                    label="İlan"
                    onPress={() => setTab('listings')}
                  />
                </View>
              </View>

              <View style={styles.identity}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>
                    {profile?.displayName ?? 'Kullanıcı'}
                  </Text>
                  <View style={styles.evBadge}>
                    <Ionicons name="flash" size={11} color={EVColors.primary} />
                    <Text style={styles.evBadgeText}>EV Sürücüsü</Text>
                  </View>
                </View>
                <Text style={styles.nick}>{nickname}</Text>
                {user.email ? (
                  <Text style={styles.email}>{user.email}</Text>
                ) : null}
                <View style={styles.joinRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={EVColors.textHint}
                  />
                  <Text style={styles.joinText}>
                    Katılım: {formatJoinDate(profile?.createdAt ?? null)}
                  </Text>
                </View>
                {profile?.bio ? (
                  <Text style={styles.bio}>{profile.bio}</Text>
                ) : (
                  <Text style={styles.bioPlaceholder}>
                    Henüz biyografi eklenmedi.
                  </Text>
                )}
                {profile?.garage ? (
                  <View style={styles.carChip}>
                    <Text style={{ fontSize: 14 }}>
                      {profile.garage.emoji || '⚡'}
                    </Text>
                    <Text style={styles.carChipText}>
                      {profile.garage.brand} {profile.garage.model}
                    </Text>
                    {profile.garage.year ? (
                      <Text style={styles.carYear}>
                        • {profile.garage.year}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <Pressable
                style={styles.editBtn}
                onPress={() => setShowEdit(true)}
              >
                <Text style={styles.editBtnText}>Profili Düzenle</Text>
              </Pressable>

              <View
                style={[
                  styles.verifyBanner,
                  emailVerified && styles.verifyBannerOk,
                ]}
              >
                <Ionicons
                  name={
                    emailVerified
                      ? 'checkmark-circle'
                      : 'mail-unread-outline'
                  }
                  size={20}
                  color={emailVerified ? EVColors.primary : '#C46B00'}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.verifyTitle,
                      emailVerified && { color: EVColors.primary },
                    ]}
                  >
                    {emailVerified
                      ? 'E-posta doğrulandı'
                      : 'E-posta doğrulanmadı'}
                  </Text>
                  {!emailVerified ? (
                    <Text style={styles.verifyBody}>
                      Gelen kutundaki bağlantıyı aç, sonra bu ekrana geri dön.
                    </Text>
                  ) : (
                    <Text style={styles.verifyBodyOk}>
                      Hesabın güvende. Bildirimler için e-posta onaylı.
                    </Text>
                  )}
                  <View style={styles.verifyActions}>
                    {!emailVerified ? (
                      <>
                        <Pressable
                          onPress={() => {
                            void sendVerificationEmail()
                              .then(() =>
                                Alert.alert(
                                  'Gönderildi',
                                  'Doğrulama e-postası gönderildi.',
                                ),
                              )
                              .catch((e) =>
                                Alert.alert(
                                  'Gönderilemedi',
                                  e instanceof Error
                                    ? e.message
                                    : 'Tekrar dene.',
                                ),
                              );
                          }}
                        >
                          <Text style={styles.verifyLink}>Doğrula</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            void refreshUser().then((ok) => {
                              Alert.alert(
                                ok ? 'Doğrulandı' : 'Henüz değil',
                                ok
                                  ? 'E-posta onaylandı.'
                                  : 'Maildeki bağlantıyı açtıktan sonra tekrar dene.',
                              );
                            });
                          }}
                        >
                          <Text style={styles.verifyLink}>Kontrol et</Text>
                        </Pressable>
                      </>
                    ) : null}
                    <Pressable
                      onPress={() => {
                        setNewEmail('');
                        setEmailPassword('');
                        setShowChangeEmail(true);
                      }}
                    >
                      <Text style={styles.verifyLink}>
                        Mail adresini değiştir
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <Pressable
                style={styles.savedBtn}
                onPress={() => navigation.navigate('SavedTopics')}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={18}
                  color={EVColors.primary}
                />
                <Text style={styles.savedBtnText}>Kaydedilen konular</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={EVColors.textHint}
                />
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.tabs}>
          {(
            [
              ['garage', 'Garaj'],
              ['forum', 'Forum'],
              ['listings', '2. El'],
            ] as const
          ).map(([key, label]) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                style={styles.tab}
                onPress={() => setTab(key)}
              >
                <View style={styles.tabInner}>
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: active ? EVColors.primary : EVColors.textHint,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
                {active ? <View style={styles.tabIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tabBody}>
          {tab === 'garage' ? (
            <GarageTab
              garage={profile?.garage ?? null}
              topicCount={profile?.topicCount ?? 0}
              replyCount={profile?.replyCount ?? 0}
              listingCount={profile?.listingCount ?? listings.length}
              onEdit={() => setShowGarageEdit(true)}
            />
          ) : null}
          {tab === 'forum' ? (
            <ForumTab
              topics={topics}
              loading={loading}
              onOpen={(topic) =>
                navigation.navigate('ForumDetail', { topic })
              }
            />
          ) : null}
          {tab === 'listings' ? (
            <ListingsTab
              listings={listings}
              loading={loading}
              onOpen={(listing) =>
                navigation.navigate('ListingDetail', { listing })
              }
            />
          ) : null}
        </View>
      </ScrollView>

      <EditProfileModal
        visible={showEdit}
        name={profile?.displayName ?? ''}
        bio={profile?.bio ?? ''}
        saving={saving}
        onClose={() => setShowEdit(false)}
        onSave={(n, b) => void saveProfile(n, b)}
      />

      <EditGarageModal
        visible={showGarageEdit}
        garage={profile?.garage ?? null}
        saving={saving}
        onClose={() => setShowGarageEdit(false)}
        onSave={(g) => void saveGarage(g)}
      />

      <Modal
        visible={showChangeEmail}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChangeEmail(false)}
      >
        <KeyboardAvoidingView
          style={styles.emailModalWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.emailModalBackdrop}
            onPress={() => setShowChangeEmail(false)}
          />
          <View style={styles.emailModalCard}>
            <Text style={styles.emailModalTitle}>Mail adresini değiştir</Text>
            <Text style={styles.emailModalSub}>
              Mevcut: {user?.email ?? '—'}
            </Text>
            <TextInput
              style={styles.emailModalInput}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Yeni e-posta"
              placeholderTextColor={EVColors.textHint}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={styles.emailModalInput}
              value={emailPassword}
              onChangeText={setEmailPassword}
              placeholder="Şifren"
              placeholderTextColor={EVColors.textHint}
              secureTextEntry
              autoComplete="password"
            />
            <Text style={styles.emailModalHint}>
              Onay için yeni adrese bir mail gider.
            </Text>
            <Pressable
              style={[
                styles.emailModalBtn,
                changingEmail && { opacity: 0.7 },
              ]}
              disabled={changingEmail}
              onPress={() => {
                setChangingEmail(true);
                void changeEmail(newEmail, emailPassword)
                  .then(() => {
                    setShowChangeEmail(false);
                    Alert.alert(
                      'Onay maili gönderildi',
                      'Yeni adresteki bağlantıya tıklayınca e-posta güncellenir.',
                    );
                  })
                  .catch((e) =>
                    Alert.alert(
                      'Güncellenemedi',
                      e instanceof Error ? e.message : 'Tekrar dene.',
                    ),
                  )
                  .finally(() => setChangingEmail(false));
              }}
            >
              {changingEmail ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.emailModalBtnText}>Onay maili gönder</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setShowChangeEmail(false)}
              style={{ marginTop: 12, alignItems: 'center' }}
            >
              <Text style={{ color: EVColors.textHint, fontWeight: '600' }}>
                Vazgeç
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function StatCol({
  value,
  label,
  onPress,
}: {
  value: string;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <Text
        style={[
          styles.statLabel,
          onPress ? { color: EVColors.primary, fontWeight: '600' } : null,
        ]}
      >
        {label}
        {onPress ? ' ›' : ''}
      </Text>
    </>
  );
  if (onPress) {
    return (
      <Pressable style={{ alignItems: 'center' }} onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={{ alignItems: 'center' }}>{content}</View>;
}

function GarageTab({
  garage,
  topicCount,
  replyCount,
  listingCount,
  onEdit,
}: {
  garage: UserGarage | null;
  topicCount: number;
  replyCount: number;
  listingCount: number;
  onEdit: () => void;
}) {
  const brandColor =
    EV_BRANDS.find(
      (b) => b.name.toLowerCase() === garage?.brand.toLowerCase(),
    )?.color ?? EVColors.primary;

  return (
    <View style={styles.pad}>
      {garage ? (
        <View
          style={[
            styles.vehicleCard,
            { backgroundColor: brandColor, shadowColor: brandColor },
          ]}
        >
          <View style={styles.vehicleTop}>
            <Text style={{ fontSize: 32 }}>{garage.emoji || '⚡'}</Text>
            {garage.year ? (
              <View style={styles.yearPill}>
                <Text style={styles.yearPillText}>{garage.year}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.vehicleBrand}>{garage.brand}</Text>
          <Text style={styles.vehicleModel}>{garage.model}</Text>
          <View style={styles.vehicleStats}>
            <VehicleStat
              icon="speedometer-outline"
              value={garage.km || '—'}
              label="Kilometre"
            />
            <VehicleStat
              icon="battery-charging"
              value={garage.batteryHealth || '—'}
              label="Batarya"
            />
            <VehicleStat
              icon="flash"
              value={garage.rangeKm || '—'}
              label="Menzil"
            />
          </View>
        </View>
      ) : (
        <View style={styles.emptyGarage}>
          <Ionicons name="car-outline" size={36} color={EVColors.textHint} />
          <Text style={styles.emptyTitle}>Garajın boş</Text>
          <Text style={styles.emptyBody}>
            Kullandığın EV’yi ekleyerek profilini tamamla.
          </Text>
        </View>
      )}

      <Pressable style={styles.garageEditBtn} onPress={onEdit}>
        <Ionicons
          name={garage ? 'create-outline' : 'add-circle-outline'}
          size={18}
          color={EVColors.primary}
        />
        <Text style={styles.garageEditText}>
          {garage ? 'Garajı düzenle' : 'Araç ekle'}
        </Text>
      </Pressable>

      <SectionHeader title="Topluluk katkısı" />
      <View style={styles.activityRow}>
        <ActivityCard
          icon="chatbubbles"
          value={String(topicCount)}
          label="Forum konusu"
          color="#378ADD"
        />
        <ActivityCard
          icon="chatbubble-ellipses"
          value={String(replyCount)}
          label="Yanıt"
          color="#9B59B6"
        />
      </View>
      <View style={styles.activityRow}>
        <ActivityCard
          icon="swap-horizontal"
          value={String(listingCount)}
          label="2. El ilanı"
          color={EVColors.primary}
        />
        <ActivityCard
          icon="flash"
          value="—"
          label="Şarj (yakında)"
          color="#EF9F27"
        />
      </View>
    </View>
  );
}

function VehicleStat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.vStat}>
      <Ionicons name={icon} size={16} color="#fff" />
      <Text style={styles.vStatVal}>{value}</Text>
      <Text style={styles.vStatLbl}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ActivityCard({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.activityCard}>
      <View
        style={[
          styles.activityIcon,
          { backgroundColor: hexWithAlpha(color, 0.1) },
        ]}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View>
        <Text style={styles.activityValue}>{value}</Text>
        <Text style={styles.activityLabel}>{label}</Text>
      </View>
    </View>
  );
}

function ForumTab({
  topics,
  loading,
  onOpen,
}: {
  topics: ForumTopic[];
  loading: boolean;
  onOpen: (t: ForumTopic) => void;
}) {
  if (loading && topics.length === 0) {
    return (
      <ActivityIndicator color={EVColors.primary} style={{ marginTop: 40 }} />
    );
  }
  if (topics.length === 0) {
    return (
      <View style={[styles.pad, styles.center]}>
        <Text style={styles.emptyTitle}>Henüz konu yok</Text>
        <Text style={styles.emptyBody}>
          Forumda açtığın konular burada görünür.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.pad}>
      {topics.map((t) => {
        const badge = CATEGORY_BADGE[t.categoryId] ?? CATEGORY_BADGE.general;
        return (
          <Pressable
            key={t.id}
            style={styles.postCard}
            onPress={() => onOpen(t)}
          >
            {t.photoUrl ? (
              <Image source={{ uri: t.photoUrl }} style={styles.postThumb} />
            ) : null}
            <Text style={[styles.postCat, { color: badge.fg }]}>
              {badge.label}
            </Text>
            <Text style={styles.postTitle}>{t.title}</Text>
            <View style={styles.postMeta}>
              <Text style={styles.postMetaText}>{t.timeAgo}</Text>
              <Text style={styles.postMetaText}>
                {formatCount(t.replies)} yanıt
              </Text>
              <Text style={styles.postMetaText}>
                {formatCount(t.views)} görüntülenme
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ListingsTab({
  listings,
  loading,
  onOpen,
}: {
  listings: EvListing[];
  loading: boolean;
  onOpen: (l: EvListing) => void;
}) {
  if (loading && listings.length === 0) {
    return (
      <ActivityIndicator color={EVColors.primary} style={{ marginTop: 40 }} />
    );
  }
  if (listings.length === 0) {
    return (
      <View style={[styles.pad, styles.center]}>
        <Text style={styles.emptyTitle}>Henüz ilan yok</Text>
        <Text style={styles.emptyBody}>
          Pazaryerinde yayınladığın ilanlar burada listelenir.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.pad}>
      {listings.map((l) => (
        <Pressable
          key={l.id}
          style={styles.listingCard}
          onPress={() => onOpen(l)}
        >
          <View
            style={[
              styles.listingEmoji,
              { backgroundColor: hexWithAlpha(l.color, 0.12) },
            ]}
          >
            <Text style={{ fontSize: 28 }}>{l.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.listingModel}>{l.model}</Text>
            <Text style={styles.listingLoc}>{l.location}</Text>
            <Text style={styles.listingPrice}>{formatPrice(l.price)}</Text>
          </View>
          <View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: EVColors.primaryLight },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: EVColors.primary,
                }}
              >
                Aktif
              </Text>
            </View>
            <Text style={styles.listingTime}>{l.postedAgo}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function EditProfileModal({
  visible,
  name,
  bio,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  name: string;
  bio: string;
  saving: boolean;
  onClose: () => void;
  onSave: (name: string, bio: string) => void;
}) {
  const [n, setN] = useState(name);
  const [b, setB] = useState(bio);

  useEffect(() => {
    if (visible) {
      setN(name);
      setB(bio);
    }
  }, [visible, name, bio]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Profili Düzenle</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={EVColors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Field
              label="Ad Soyad"
              value={n}
              onChange={setN}
              placeholder="Adınız ve soyadınız"
            />
            <Field
              label="Biyografi"
              value={b}
              onChange={setB}
              placeholder="Kendinizden bahsedin…"
              multiline
            />
            <View style={styles.hintBox}>
              <Ionicons name="flash" size={16} color={EVColors.primary} />
              <Text style={styles.hintText}>
                Kullanıcı adın e-posta adresinden oluşur. Araç bilgilerini Garaj
                sekmesinden güncelleyebilirsin.
              </Text>
            </View>
            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              disabled={saving}
              onPress={() => onSave(n.trim(), b.trim())}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Kaydet</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EditGarageModal({
  visible,
  garage,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  garage: UserGarage | null;
  saving: boolean;
  onClose: () => void;
  onSave: (garage: UserGarage | null) => void;
}) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [km, setKm] = useState('');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [rangeKm, setRangeKm] = useState('');

  useEffect(() => {
    if (visible) {
      setBrand(garage?.brand ?? '');
      setModel(garage?.model ?? '');
      setYear(garage?.year ?? '');
      setKm(garage?.km ?? '');
      setBatteryHealth(garage?.batteryHealth ?? '');
      setRangeKm(garage?.rangeKm ?? '');
    }
  }, [visible, garage]);

  const selectedBrand = EV_BRANDS.find(
    (b) => b.name.toLowerCase() === brand.trim().toLowerCase(),
  );

  const submit = () => {
    if (!brand.trim() || !model.trim()) {
      Alert.alert('Eksik bilgi', 'Marka ve model zorunlu.');
      return;
    }
    onSave({
      brand: brand.trim(),
      model: model.trim(),
      year: year.trim(),
      km: km.trim(),
      batteryHealth: batteryHealth.trim(),
      rangeKm: rangeKm.trim(),
      emoji: selectedBrand?.emoji || '⚡',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Garaj</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={EVColors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Marka</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
              contentContainerStyle={{ gap: 8 }}
            >
              {EV_BRANDS.map((b) => {
                const active = brand.toLowerCase() === b.name.toLowerCase();
                return (
                  <Pressable
                    key={b.id}
                    style={[
                      styles.brandChip,
                      active && {
                        backgroundColor: hexWithAlpha(b.color, 0.15),
                        borderColor: b.color,
                      },
                    ]}
                    onPress={() => {
                      setBrand(b.name);
                      if (
                        model &&
                        !b.models.some(
                          (m) => m.toLowerCase() === model.toLowerCase(),
                        )
                      ) {
                        setModel('');
                      }
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{b.emoji}</Text>
                    <Text
                      style={[
                        styles.brandChipText,
                        active && { color: b.color },
                      ]}
                    >
                      {b.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedBrand ? (
              <>
                <Text style={styles.fieldLabel}>Model</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 14 }}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {selectedBrand.models.map((m) => {
                    const active = model === m;
                    return (
                      <Pressable
                        key={m}
                        style={[
                          styles.brandChip,
                          active && {
                            backgroundColor: EVColors.primaryLight,
                            borderColor: EVColors.primary,
                          },
                        ]}
                        onPress={() => setModel(m)}
                      >
                        <Text
                          style={[
                            styles.brandChipText,
                            active && { color: EVColors.primary },
                          ]}
                        >
                          {m}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : (
              <Field
                label="Model"
                value={model}
                onChange={setModel}
                placeholder="Model"
              />
            )}

            <Text style={styles.fieldLabel}>Yıl</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
              contentContainerStyle={{ gap: 8 }}
            >
              {GARAGE_YEARS.map((y) => {
                const active = year === y;
                return (
                  <Pressable
                    key={y}
                    style={[
                      styles.brandChip,
                      active && {
                        backgroundColor: EVColors.primaryLight,
                        borderColor: EVColors.primary,
                      },
                    ]}
                    onPress={() => setYear(y)}
                  >
                    <Text
                      style={[
                        styles.brandChipText,
                        active && { color: EVColors.primary },
                      ]}
                    >
                      {y}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Field
              label="Kilometre"
              value={km}
              onChange={setKm}
              placeholder="42.800"
            />
            <Field
              label="Batarya sağlığı"
              value={batteryHealth}
              onChange={setBatteryHealth}
              placeholder="%97"
            />
            <Field
              label="Menzil"
              value={rangeKm}
              onChange={setRangeKm}
              placeholder="520 km"
            />

            {garage ? (
              <Pressable
                style={styles.removeGarageBtn}
                disabled={saving}
                onPress={() =>
                  Alert.alert('Garajı temizle', 'Aracı profilinden kaldırmak istiyor musun?', [
                    { text: 'İptal', style: 'cancel' },
                    {
                      text: 'Kaldır',
                      style: 'destructive',
                      onPress: () => onSave(null),
                    },
                  ])
                }
              >
                <Text style={styles.removeGarageText}>Aracı kaldır</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              disabled={saving}
              onPress={submit}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Kaydet</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.field,
          multiline && { minHeight: 80, textAlignVertical: 'top' },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={EVColors.textHint}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EVColors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { paddingBottom: 4 },
  appBar: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: EVColors.textPrimary,
    letterSpacing: -0.4,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '800' },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginLeft: 12,
  },
  vDiv: { width: 1, height: 28, backgroundColor: EVColors.border },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: EVColors.textPrimary,
  },
  statLabel: { fontSize: 11, color: EVColors.textSecondary, marginTop: 2 },
  identity: { paddingHorizontal: 20, marginTop: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: EVColors.textPrimary,
  },
  evBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: EVColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  evBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: EVColors.primary,
  },
  nick: {
    marginTop: 2,
    fontSize: 13,
    color: EVColors.textHint,
    fontWeight: '500',
  },
  email: {
    marginTop: 2,
    fontSize: 12,
    color: EVColors.textSecondary,
  },
  joinRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinText: { fontSize: 12, color: EVColors.textHint },
  bio: {
    marginTop: 8,
    fontSize: 13,
    color: EVColors.textSecondary,
    lineHeight: 18,
  },
  bioPlaceholder: {
    marginTop: 8,
    fontSize: 13,
    color: EVColors.textHint,
    fontStyle: 'italic',
  },
  carChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  carChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  carYear: { fontSize: 12, color: EVColors.textHint },
  editBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    height: 38,
    borderRadius: 10,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  verifyBanner: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFD8A8',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  verifyBannerOk: {
    backgroundColor: EVColors.primaryLight,
    borderColor: EVColors.primaryMid,
  },
  verifyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C46B00',
  },
  verifyBody: {
    marginTop: 2,
    fontSize: 12,
    color: EVColors.textSecondary,
    lineHeight: 17,
  },
  verifyBodyOk: {
    marginTop: 2,
    fontSize: 12,
    color: EVColors.textSecondary,
    lineHeight: 17,
  },
  verifyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 8,
  },
  verifyLink: {
    fontSize: 12,
    fontWeight: '700',
    color: EVColors.primary,
  },
  emailModalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  emailModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  emailModalCard: {
    backgroundColor: EVColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  emailModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: EVColors.textPrimary,
  },
  emailModalSub: {
    marginTop: 6,
    marginBottom: 14,
    fontSize: 13,
    color: EVColors.textSecondary,
  },
  emailModalInput: {
    borderWidth: 1,
    borderColor: EVColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: EVColors.textPrimary,
    backgroundColor: EVColors.background,
    marginBottom: 10,
  },
  emailModalHint: {
    fontSize: 12,
    color: EVColors.textHint,
    marginBottom: 14,
  },
  emailModalBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: EVColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailModalBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  savedBtn: {
    marginHorizontal: 20,
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    backgroundColor: EVColors.primaryLight,
    borderWidth: 1,
    borderColor: EVColors.primaryMid,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  savedBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: EVColors.primary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: EVColors.background,
    borderBottomWidth: 1,
    borderBottomColor: EVColors.divider,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 10 },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 12 },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    width: '60%',
    backgroundColor: EVColors.primary,
    borderRadius: 2,
  },
  tabBody: { minHeight: 360 },
  pad: { padding: 20, paddingBottom: 40, gap: 10 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EVColors.textPrimary,
    marginTop: 8,
  },
  emptyBody: {
    fontSize: 13,
    color: EVColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  emptyGarage: {
    alignItems: 'center',
    paddingVertical: 28,
    borderRadius: 16,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  garageEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 12,
    backgroundColor: EVColors.primaryLight,
    borderWidth: 1,
    borderColor: EVColors.primaryMid,
  },
  garageEditText: {
    fontSize: 13,
    fontWeight: '700',
    color: EVColors.primary,
  },
  vehicleCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 4,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  vehicleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yearPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  yearPillText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  vehicleBrand: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  vehicleModel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  vehicleStats: { flexDirection: 'row', gap: 12, marginTop: 16 },
  vStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  vStatVal: {
    marginTop: 4,
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  vStatLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 2,
  },
  sectionBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: EVColors.primary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: EVColors.textPrimary,
  },
  activityRow: { flexDirection: 'row', gap: 12 },
  activityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityValue: {
    fontSize: 16,
    fontWeight: '800',
    color: EVColors.textPrimary,
  },
  activityLabel: { fontSize: 10, color: EVColors.textSecondary },
  postCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  postThumb: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: EVColors.divider,
  },
  postCat: {
    fontSize: 11,
    fontWeight: '600',
    color: EVColors.textSecondary,
  },
  postTitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: EVColors.textPrimary,
    lineHeight: 19,
  },
  postMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  postMetaText: { fontSize: 11, color: EVColors.textHint },
  listingCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  listingEmoji: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingModel: {
    fontSize: 14,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  listingLoc: { fontSize: 12, color: EVColors.textHint, marginTop: 2 },
  listingPrice: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: EVColors.primary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  listingTime: {
    marginTop: 6,
    fontSize: 11,
    color: EVColors.textHint,
    textAlign: 'right',
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: EVColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(173,196,180,0.4)',
    marginTop: 14,
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  closeBtn: {
    marginLeft: 'auto',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: EVColors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: EVColors.textSecondary,
    marginBottom: 6,
  },
  field: {
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: EVColors.textPrimary,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: EVColors.border,
    backgroundColor: EVColors.surface,
  },
  brandChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: EVColors.textPrimary,
  },
  hintBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: EVColors.primaryLight,
    marginBottom: 16,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: EVColors.primary,
    fontWeight: '500',
  },
  removeGarageBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8B4B4',
    backgroundColor: '#FDF2F2',
  },
  removeGarageText: {
    color: '#C0392B',
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: EVColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
