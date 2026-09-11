import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Dimensions,
  Linking,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EVColors } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import {
  EvListing,
  formatPrice,
  isFollowing,
  subscribeFollow,
  toggleFollow,
} from '../data/marketplace';
import { hexWithAlpha } from '../data/forum';
import { useAuth } from '../auth/AuthContext';
import { openOrCreateConversation } from '../api/messaging';
import {
  deleteListing,
  fetchListingPhotos,
  updateListing,
} from '../api/listings';
import { createNotification } from '../api/notifications';
import { promptReport } from '../lib/reportPrompt';
import {
  messageForBlockRelation,
} from '../api/moderation';
import { useBlockLists } from '../hooks/useBlockLists';

type Props = NativeStackScreenProps<RootStackParamList, 'ListingDetail'>;

const { width } = Dimensions.get('window');

export function ListingDetailScreen({ navigation, route }: Props) {
  const { listing: initial } = route.params;
  const { user } = useAuth();
  const { relationWith } = useBlockLists();
  const [listing, setListing] = useState<EvListing>(initial);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>(initial.photos);
  const [openingChat, setOpeningChat] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => subscribeFollow(() => setTick((t) => t + 1)), []);

  const isOwner = Boolean(user?.uid && user.uid === listing.sellerUserId);
  const sellerRelation = relationWith(listing.sellerUserId);
  const sellerBlockMessage = messageForBlockRelation(sellerRelation);
  const sellerHidden = !isOwner && sellerRelation !== 'none';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const full = await fetchListingPhotos(listing.id);
        if (!cancelled && full.length > 0) setPhotos(full);
      } catch {
        // Alt koleksiyonda foto yoksa listing.photos yeterli
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listing.id]);

  const followed = isFollowing(listing.id);
  const damageOk = listing.damageStatus === 'Kazasız';

  const onDelete = () => {
    Alert.alert('İlanı sil', 'Bu ilan kalıcı olarak silinecek.', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          if (deleting) return;
          setDeleting(true);
          void deleteListing(listing.id)
            .then(() => {
              Alert.alert('Silindi');
              navigation.goBack();
            })
            .catch((e) =>
              Alert.alert(
                'Silinemedi',
                e instanceof Error ? e.message : 'Tekrar dene.',
              ),
            )
            .finally(() => setDeleting(false));
        },
      },
    ]);
  };

  const messageSeller = async () => {
    if (!listing.sellerUserId) {
      Alert.alert('Mesaj', 'Bu ilanda satıcı bilgisi yok.');
      return;
    }
    if (!user) {
      Alert.alert('Giriş gerekli', 'Mesaj için giriş yapmalısın.');
      return;
    }
    if (user.uid === listing.sellerUserId) {
      Alert.alert('Bu senin ilanın');
      return;
    }
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const conversationId = await openOrCreateConversation(
        user,
        {
          userId: listing.sellerUserId,
          name: listing.sellerName,
          initials: listing.sellerInitials,
          color: listing.sellerColor,
        },
        `${listing.year} ${listing.model}`,
      );
      navigation.navigate('Chat', { conversationId });
    } catch (e) {
      Alert.alert(
        'Mesaj açılamadı',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setOpeningChat(false);
    }
  };

  const openSellerProfile = () => {
    if (!listing.sellerUserId) {
      Alert.alert('Profil', 'Bu ilanda satıcı profili yok.');
      return;
    }
    navigation.navigate('UserProfile', {
      userId: listing.sellerUserId,
      name: listing.sellerName,
      initials: listing.sellerInitials,
      color: listing.sellerColor,
      contextTitle: `${listing.year} ${listing.model}`,
    });
  };

  const specs = (
    [
      ['Yıl', `${listing.year}`],
      ['Kilometre', `${listing.km.toLocaleString('tr-TR')} km`],
      ['Konum', listing.location],
      ['Batarya Sağlığı', `%${listing.batteryHealth}`],
      ['Menzil', `${listing.range} km`],
      ['Pil Kapasitesi', `${listing.batteryCapacity} kWh`],
      ['AC Şarj', `${listing.acChargePower} kW`],
      ['DC Şarj', `${listing.dcChargePower} kW`],
      ['Şarj Tipi', listing.chargeType],
      ['Motor Gücü', `${listing.motorPower} hp`],
      ['Çekiş', listing.drivetrain],
      ['Renk', listing.color],
      ['Garanti', listing.warranty],
      ['Hasar Durumu', listing.damageStatus],
    ] as [string, string][]
  ).filter(([, value]) => {
    const v = value.trim();
    return v.length > 0 && v !== 'Belirtilmedi' && v !== '%0' && v !== '0 km';
  });

  return (
    <View style={styles.root}>
      {sellerHidden ? (
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ padding: 16 }}
            hitSlop={10}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={EVColors.textPrimary}
            />
          </Pressable>
          <View style={{ paddingHorizontal: 24, paddingTop: 40 }}>
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '700',
                fontSize: 15,
                color: '#92400E',
                backgroundColor: '#FEF3C7',
                padding: 14,
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              {sellerBlockMessage}
            </Text>
            <Text
              style={{
                textAlign: 'center',
                marginTop: 12,
                color: EVColors.textSecondary,
                fontSize: 14,
              }}
            >
              Bu ilan engelleme nedeniyle görüntülenemiyor.
            </Text>
          </View>
        </SafeAreaView>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const i = Math.round(e.nativeEvent.contentOffset.x / width);
                setPhotoIndex(i);
              }}
            >
              {photos.map((uri) => (
                <Image
                  key={uri.slice(0, 48)}
                  source={{ uri }}
                  style={{ width, height: 280 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.heroFallback,
                { backgroundColor: listing.gradient[1] },
              ]}
            >
              <Text style={{ fontSize: 72 }}>{listing.emoji}</Text>
            </View>
          )}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>
              {formatPrice(listing.price)}
            </Text>
          </View>
          {photos.length > 1 ? (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === photoIndex && styles.dotActive]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>
            {listing.year} {listing.model}
          </Text>
          <View style={styles.badges}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: damageOk
                    ? EVColors.primaryLight
                    : '#FFEBEE',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: damageOk ? EVColors.primary : EVColors.error,
                }}
              >
                {listing.damageStatus}
              </Text>
            </View>
            <View
              style={[styles.badge, { backgroundColor: EVColors.primaryLight }]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: EVColors.primary,
                }}
              >
                {listing.sellerType}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            {specs.map(([label, value]) => (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>

          {(listing.paintedParts.length > 0 ||
            listing.replacedParts.length > 0) && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Boya / Değişen</Text>
              {listing.paintedParts.length > 0 ? (
                <Text style={styles.parts}>
                  Boyalı: {listing.paintedParts.join(', ')}
                </Text>
              ) : null}
              {listing.replacedParts.length > 0 ? (
                <Text style={styles.parts}>
                  Değişen: {listing.replacedParts.join(', ')}
                </Text>
              ) : null}
            </View>
          )}

          <Pressable style={styles.sellerCard} onPress={openSellerProfile}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: hexWithAlpha(listing.sellerColor, 0.15),
                  borderColor: hexWithAlpha(listing.sellerColor, 0.3),
                },
              ]}
            >
              <Text style={{ color: listing.sellerColor, fontWeight: '700' }}>
                {listing.sellerInitials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{listing.sellerName}</Text>
              <Text style={styles.posted}>
                {listing.postedAgo}
                {listing.sellerUserId ? ' · Profile git' : ''}
              </Text>
            </View>
            <View style={styles.communityChip}>
              <Text style={styles.communityText}>Topluluk</Text>
            </View>
            {listing.sellerUserId ? (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={EVColors.textHint}
              />
            ) : null}
          </Pressable>

          {!isOwner && user ? (
            <Pressable
              style={styles.reportLink}
              onPress={() =>
                promptReport({
                  reporterId: user.uid,
                  targetType: 'listing',
                  targetId: listing.id,
                  targetLabel: `${listing.year} ${listing.model}`,
                })
              }
            >
              <Ionicons
                name="flag-outline"
                size={16}
                color={EVColors.textHint}
              />
              <Text style={styles.reportLinkText}>İlanı şikayet et</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.topRow}>
          <Pressable style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons
              name="chevron-back"
              size={22}
              color={EVColors.textPrimary}
            />
          </Pressable>
          {isOwner ? (
            <View style={styles.ownerActions}>
              <Pressable style={styles.back} onPress={() => setShowEdit(true)}>
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={EVColors.textPrimary}
                />
              </Pressable>
              <Pressable
                style={styles.back}
                onPress={onDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color={EVColors.error} />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={EVColors.error}
                  />
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        {isOwner ? (
          <Pressable
            style={styles.ownerEditWide}
            onPress={() => setShowEdit(true)}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={EVColors.primary}
            />
            <Text style={styles.ownerEditText}>İlanı düzenle</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={[
                styles.followWide,
                {
                  backgroundColor: followed
                    ? EVColors.primaryLight
                    : EVColors.surface,
                  borderColor: followed ? EVColors.primary : EVColors.border,
                },
              ]}
              onPress={() => {
                const title = `${listing.year} ${listing.model}`;
                const on = toggleFollow(listing.id, title);
                if (on && user?.uid) {
                  void createNotification({
                    actorId: user.uid,
                    userId: user.uid,
                    type: 'system',
                    title: 'Takip Başladı',
                    body: `${title} fiyat takibine alındı.`,
                  });
                  setTimeout(() => {
                    if (isFollowing(listing.id) && user?.uid) {
                      void createNotification({
                        actorId: user.uid,
                        userId: user.uid,
                        type: 'priceDown',
                        title: 'Fiyat Güncellendi',
                        body: `${title} için yeni fiyat bilgisi var.`,
                      });
                    }
                  }, 3000);
                }
                Alert.alert(on ? 'Takibe alındı' : 'Takip bırakıldı');
              }}
            >
              <Ionicons
                name={followed ? 'notifications' : 'notifications-outline'}
                size={18}
                color={followed ? EVColors.primary : EVColors.textSecondary}
              />
              <Text
                style={{
                  fontWeight: '700',
                  color: followed ? EVColors.primary : EVColors.textSecondary,
                }}
              >
                {followed ? 'Takip Ediliyor' : 'Fiyatı Takip Et'}
              </Text>
            </Pressable>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.msgBtn, openingChat && { opacity: 0.75 }]}
                onPress={() => void messageSeller()}
                disabled={openingChat}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                <Text style={styles.msgText}>Mesaj</Text>
              </Pressable>
              <Pressable
                style={styles.callBtn}
                onPress={() => Linking.openURL('tel:')}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={EVColors.primary}
                />
                <Text style={styles.callText}>Ara</Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
      </>
      )}

      <EditListingModal
        visible={showEdit}
        listing={listing}
        onClose={() => setShowEdit(false)}
        onSaved={(next) => {
          setListing(next);
          setShowEdit(false);
        }}
      />
    </View>
  );
}

function EditListingModal({
  visible,
  listing,
  onClose,
  onSaved,
}: {
  visible: boolean;
  listing: EvListing;
  onClose: () => void;
  onSaved: (listing: EvListing) => void;
}) {
  const [price, setPrice] = useState(String(listing.price));
  const [km, setKm] = useState(String(listing.km));
  const [city, setCity] = useState(listing.location);
  const [description, setDescription] = useState(listing.description ?? '');
  const [sellerType, setSellerType] = useState(listing.sellerType);
  const [damage, setDamage] = useState(listing.damageStatus);
  const [batteryHealth, setBatteryHealth] = useState(
    String(listing.batteryHealth),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPrice(String(listing.price));
    setKm(String(listing.km));
    setCity(listing.location);
    setDescription(listing.description ?? '');
    setSellerType(listing.sellerType);
    setDamage(listing.damageStatus);
    setBatteryHealth(String(listing.batteryHealth));
  }, [visible, listing]);

  const save = async () => {
    const priceN = Number(price.replace(/\D/g, ''));
    const kmN = Number(km.replace(/\D/g, ''));
    const bh = Number(batteryHealth.replace(/\D/g, ''));
    if (!priceN || !kmN || !city.trim()) {
      Alert.alert('Eksik bilgi', 'Fiyat, km ve şehir gerekli.');
      return;
    }
    if (!bh || bh < 1 || bh > 100) {
      Alert.alert('Batarya sağlığı', '1–100 arası bir değer gir.');
      return;
    }
    setSaving(true);
    try {
      await updateListing(listing.id, {
        price: priceN,
        km: kmN,
        location: city.trim(),
        description,
        sellerType,
        damageStatus: damage,
        batteryHealth: bh,
      });
      onSaved({
        ...listing,
        price: priceN,
        km: kmN,
        location: city.trim(),
        description: description.trim() || undefined,
        sellerType,
        damageStatus: damage,
        batteryHealth: bh,
      });
      Alert.alert('Güncellendi');
    } catch (e) {
      Alert.alert(
        'Kaydedilemedi',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.editRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.editBackdrop} onPress={onClose} />
        <View style={styles.editSheet}>
          <Text style={styles.editTitle}>İlanı düzenle</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.editLabel}>Fiyat (₺)</Text>
            <TextInput
              style={styles.editField}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor={EVColors.textHint}
            />
            <Text style={styles.editLabel}>Kilometre</Text>
            <TextInput
              style={styles.editField}
              value={km}
              onChangeText={setKm}
              keyboardType="numeric"
              placeholderTextColor={EVColors.textHint}
            />
            <Text style={styles.editLabel}>Şehir</Text>
            <TextInput
              style={styles.editField}
              value={city}
              onChangeText={setCity}
              placeholderTextColor={EVColors.textHint}
            />
            <Text style={styles.editLabel}>Batarya sağlığı (%)</Text>
            <TextInput
              style={styles.editField}
              value={batteryHealth}
              onChangeText={setBatteryHealth}
              keyboardType="numeric"
              placeholderTextColor={EVColors.textHint}
            />
            <Text style={styles.editLabel}>Açıklama</Text>
            <TextInput
              style={[styles.editField, { minHeight: 70 }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor={EVColors.textHint}
            />
            <Text style={styles.editLabel}>Kimden</Text>
            <View style={styles.chipRow}>
              {['Sahibinden', 'Galeriden'].map((o) => (
                <Pressable
                  key={o}
                  style={[styles.chip, sellerType === o && styles.chipActive]}
                  onPress={() => setSellerType(o)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      sellerType === o && styles.chipTextActive,
                    ]}
                  >
                    {o}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.editLabel}>Hasar</Text>
            <View style={styles.chipRow}>
              {['Kazasız', 'Kazalı'].map((o) => (
                <Pressable
                  key={o}
                  style={[styles.chip, damage === o && styles.chipActive]}
                  onPress={() => setDamage(o)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      damage === o && styles.chipTextActive,
                    ]}
                  >
                    {o}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              disabled={saving}
              onPress={() => void save()}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EVColors.background },
  hero: { height: 280, backgroundColor: '#111' },
  heroFallback: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceBadgeText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  dots: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: '#fff' },
  body: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: EVColors.textPrimary,
    letterSpacing: -0.3,
  },
  badges: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: EVColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: EVColors.border,
    padding: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: EVColors.divider,
  },
  infoLabel: { fontSize: 13, color: EVColors.textSecondary },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: EVColors.textPrimary,
    marginBottom: 8,
  },
  parts: {
    fontSize: 13,
    color: EVColors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  sellerCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  posted: { fontSize: 12, color: EVColors.textHint, marginTop: 2 },
  communityChip: {
    backgroundColor: EVColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  communityText: {
    fontSize: 11,
    fontWeight: '700',
    color: EVColors.primary,
  },
  reportLink: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
  },
  reportLinkText: { fontSize: 12, color: EVColors.textHint, fontWeight: '600' },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerActions: { flexDirection: 'row', gap: 8 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: EVColors.surface,
    borderTopWidth: 1,
    borderTopColor: EVColors.divider,
    gap: 10,
  },
  followWide: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ownerEditWide: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: EVColors.primary,
    backgroundColor: EVColors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ownerEditText: { color: EVColors.primary, fontWeight: '700', fontSize: 15 },
  actionRow: { flexDirection: 'row', gap: 10 },
  msgBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: EVColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  msgText: { color: '#fff', fontWeight: '700' },
  callBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callText: { color: EVColors.primary, fontWeight: '700' },
  editRoot: { flex: 1, justifyContent: 'flex-end' },
  editBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  editSheet: {
    backgroundColor: EVColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 16,
    maxHeight: '85%',
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: EVColors.textPrimary,
    marginBottom: 12,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: EVColors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  editField: {
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: EVColors.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: EVColors.border,
    backgroundColor: EVColors.surface,
  },
  chipActive: {
    backgroundColor: EVColors.primary,
    borderColor: EVColors.primary,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: EVColors.textSecondary },
  chipTextActive: { color: '#fff' },
  saveBtn: {
    marginTop: 16,
    height: 50,
    borderRadius: 14,
    backgroundColor: EVColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
