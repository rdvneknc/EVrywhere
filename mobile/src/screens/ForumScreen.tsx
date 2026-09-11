import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EVColors } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import {
  FORUM_BRANDS,
  FORUM_CATEGORIES,
  CATEGORY_BADGE,
  CATEGORY_ACCENT,
  ForumTopic,
  findBrand,
  findCategory,
  formatCount,
  hexWithAlpha,
} from '../data/forum';
import {
  createForumTopic,
  fetchForumTopics,
  subscribeForumTopics,
} from '../api/forumTopics';
import { useAuth } from '../auth/AuthContext';
import { HeaderMessagesButton } from '../components/HeaderMessagesButton';
import {
  FIRESTORE_COVER_BYTES,
  compressImageUnderBytes,
  formatBytes,
} from '../lib/imageCompress';
import { useBlockLists } from '../hooks/useBlockLists';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ForumScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { hiddenIds } = useBlockLists();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [activeBrandId, setActiveBrandId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const [showNewTopic, setShowNewTopic] = useState(false);

  useEffect(() => {
    const unsub = subscribeForumTopics(
      (next) => {
        setTopics(next);
        setLoading(false);
        setLoadError(null);
      },
      (err) => {
        setLoading(false);
        setLoadError(err.message || 'Forum yüklenemedi');
      },
    );
    return unsub;
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const next = await fetchForumTopics();
      setTopics(next);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Yenilenemedi');
    } finally {
      setRefreshing(false);
    }
  };

  const brandsOnly = useMemo(
    () =>
      [...FORUM_BRANDS.filter((b) => b.id !== 'all')].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [],
  );
  const visibleBrands = brandsOnly.slice(0, 4);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return topics.filter((t) => {
      if (t.authorId && hiddenIds.has(t.authorId)) return false;
      const catOk =
        activeCategoryId === 'all' || t.categoryId === activeCategoryId;
      const brandOk =
        activeBrandId === 'all' ||
        t.brandId === activeBrandId ||
        t.brandId === 'all';
      const searchOk =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.excerpt.toLowerCase().includes(q);
      return catOk && brandOk && searchOk;
    });
  }, [topics, activeCategoryId, activeBrandId, searchQuery, hiddenIds]);

  const openDetail = (topic: ForumTopic) => {
    navigation.navigate('ForumDetail', { topic });
  };

  const createTopic = async (
    title: string,
    excerpt: string,
    categoryId: string,
    brandId: string,
    localPhotoUri?: string,
  ) => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'Konu açmak için giriş yapmalısın.');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await createForumTopic(user, {
        title,
        excerpt,
        categoryId,
        brandId,
        localPhotoUri,
      });
      setShowNewTopic(false);
      Alert.alert('Konu oluşturuldu! 🎉');
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Konu kaydedilemedi. Tekrar dene.';
      Alert.alert('Kayıt hatası', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={EVColors.primary}
            colors={[EVColors.primary]}
          />
        }
      >
        {/* App bar */}
        <View style={styles.appBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appBarEyebrow}>Topluluk</Text>
            <Text style={styles.appBarTitle}>Forum</Text>
          </View>
          <HeaderMessagesButton />
          <View style={styles.countPill}>
            <Text style={styles.countNum}>{filtered.length}</Text>
            <Text style={styles.countLabel}>konu</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={EVColors.textHint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Konu, marka veya içerik ara…"
            placeholderTextColor={EVColors.textHint}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FORUM_CATEGORIES.map((cat) => {
            const active = cat.id === activeCategoryId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategoryId(cat.id)}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                ]}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    { color: active ? EVColors.onPrimary : EVColors.textSecondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Brands */}
        <Text style={styles.brandHeading}>Markaya Göre</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandsRow}
        >
          {visibleBrands.map((brand) => {
            const active = brand.id === activeBrandId;
            return (
              <Pressable
                key={brand.id}
                onPress={() => {
                  setActiveBrandId(brand.id);
                  if (brandsExpanded) setBrandsExpanded(false);
                }}
                style={[
                  styles.brandCard,
                  {
                    backgroundColor: active
                      ? hexWithAlpha(brand.color, 0.12)
                      : EVColors.surface,
                    borderColor: active
                      ? hexWithAlpha(brand.color, 0.5)
                      : EVColors.border,
                    borderWidth: active ? 1.5 : 1,
                  },
                ]}
              >
                <Text style={styles.brandEmoji}>{brand.emoji}</Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.brandName,
                    { color: active ? brand.color : EVColors.textSecondary },
                  ]}
                >
                  {brand.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setBrandsExpanded((v) => !v)}
            style={[
              styles.brandCard,
              {
                backgroundColor: brandsExpanded
                  ? EVColors.primaryLight
                  : EVColors.surface,
                borderColor: brandsExpanded
                  ? EVColors.primary
                  : EVColors.border,
                borderWidth: brandsExpanded ? 1.5 : 1,
              },
            ]}
          >
            <Ionicons
              name={brandsExpanded ? 'chevron-up' : 'chevron-down'}
              size={26}
              color={brandsExpanded ? EVColors.primary : EVColors.textHint}
            />
            <Text
              style={[
                styles.brandName,
                {
                  color: brandsExpanded ? EVColors.primary : EVColors.textHint,
                  textAlign: 'center',
                },
              ]}
            >
              {brandsExpanded ? 'Kapat' : 'Tümünü\nGör'}
            </Text>
          </Pressable>
        </ScrollView>

        {brandsExpanded ? (
          <View style={styles.brandList}>
            <View style={styles.brandListHeader}>
              <Text style={styles.brandListTitle}>Tüm Markalar</Text>
              <Pressable
                onPress={() => {
                  setActiveBrandId('all');
                  setBrandsExpanded(false);
                }}
              >
                <Text style={styles.brandListReset}>Tümünü Göster</Text>
              </Pressable>
            </View>
            <View style={styles.divider} />
            {brandsOnly.map((brand) => {
              const active = brand.id === activeBrandId;
              return (
                <Pressable
                  key={brand.id}
                  onPress={() => {
                    setActiveBrandId(brand.id);
                    setBrandsExpanded(false);
                  }}
                  style={[
                    styles.brandListItem,
                    active && {
                      backgroundColor: hexWithAlpha(brand.color, 0.06),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.brandAvatar,
                      {
                        backgroundColor: hexWithAlpha(brand.color, 0.12),
                        borderColor: active
                          ? hexWithAlpha(brand.color, 0.5)
                          : hexWithAlpha(brand.color, 0.2),
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{brand.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.brandListName,
                      {
                        fontWeight: active ? '700' : '500',
                        color: active ? brand.color : EVColors.textPrimary,
                      },
                    ]}
                  >
                    {brand.name}
                  </Text>
                  {brand.threadCount > 0 ? (
                    <View
                      style={[
                        styles.threadPill,
                        {
                          backgroundColor: active
                            ? hexWithAlpha(brand.color, 0.12)
                            : EVColors.background,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '500',
                          color: active ? brand.color : EVColors.textHint,
                        }}
                      >
                        {brand.threadCount} konu
                      </Text>
                    </View>
                  ) : null}
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'chevron-forward'}
                    size={18}
                    color={active ? brand.color : EVColors.textHint}
                  />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {loading ? '…' : `${filtered.length} Konu`}
          </Text>
          <Text style={styles.sectionSort}>En Yeni</Text>
        </View>

        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={EVColors.primary} />
            <Text style={styles.emptyText}>Konular yükleniyor…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.empty}>
            <Ionicons
              name="cloud-offline-outline"
              size={48}
              color={EVColors.textHint}
            />
            <Text style={styles.emptyText}>{loadError}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={EVColors.textHint}
            />
            <Text style={styles.emptyText}>
              {topics.length === 0
                ? 'Henüz konu yok. İlk konuyu sen aç!'
                : 'Bu filtreyle konu bulunamadı'}
            </Text>
          </View>
        ) : (
          filtered.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onPress={() => openDetail(topic)}
              onAuthorPress={() => {
                if (!topic.authorId) {
                  openDetail(topic);
                  return;
                }
                navigation.navigate('UserProfile', {
                  userId: topic.authorId,
                  name: topic.authorName,
                  initials: topic.authorInitials,
                  color: topic.authorColor,
                  contextTitle: topic.title,
                });
              }}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setShowNewTopic(true)}>
        <Ionicons name="create-outline" size={17} color="#fff" />
        <Text style={styles.fabLabel}>Yeni Konu</Text>
      </Pressable>

      <NewTopicModal
        visible={showNewTopic}
        submitting={saving}
        onClose={() => !saving && setShowNewTopic(false)}
        onSubmit={createTopic}
      />
    </View>
  );
}

function TopicCard({
  topic,
  onPress,
  onAuthorPress,
}: {
  topic: ForumTopic;
  onPress: () => void;
  onAuthorPress: () => void;
}) {
  const badge =
    CATEGORY_BADGE[topic.categoryId] ?? CATEGORY_BADGE.general;
  const brand = findBrand(topic.brandId);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardBadges}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]}>
            {badge.label}
          </Text>
        </View>
        {topic.isPinned ? (
          <View style={[styles.badge, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.badgeText, { color: '#BF6D00' }]}>
              📌 Sabit
            </Text>
          </View>
        ) : null}
        {topic.isHot ? (
          <View style={[styles.badge, { backgroundColor: '#FFEBEE' }]}>
            <Text style={[styles.badgeText, { color: '#C62828' }]}>
              🔥 Popüler
            </Text>
          </View>
        ) : null}
        {topic.brandId !== 'all' ? (
          <View
            style={[
              styles.brandMini,
              {
                marginLeft: 'auto',
                backgroundColor: hexWithAlpha(brand.color, 0.1),
                borderColor: hexWithAlpha(brand.color, 0.25),
              },
            ]}
          >
            <Text style={{ fontSize: 10 }}>{brand.emoji}</Text>
            <Text style={[styles.brandMiniText, { color: brand.color }]}>
              {brand.name}
            </Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={2} style={styles.cardTitle}>
        {topic.title}
      </Text>
      <Text numberOfLines={2} style={styles.cardExcerpt}>
        {topic.excerpt}
      </Text>

      {topic.photoUrl ? (
        <Image
          source={{ uri: topic.photoUrl }}
          style={styles.cardPhoto}
          resizeMode="cover"
        />
      ) : null}

      <Pressable style={styles.cardMeta} onPress={onAuthorPress}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: hexWithAlpha(topic.authorColor, 0.15),
              borderColor: hexWithAlpha(topic.authorColor, 0.3),
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: topic.authorColor }]}>
            {topic.authorInitials}
          </Text>
        </View>
        <Text style={styles.authorName} numberOfLines={1}>
          {topic.authorName}
        </Text>
        <Ionicons
          name="chatbubble-outline"
          size={12}
          color={EVColors.textHint}
        />
        <Text style={styles.stat}>{formatCount(topic.replies)}</Text>
        <Ionicons name="eye-outline" size={12} color={EVColors.textHint} />
        <Text style={styles.stat}>{formatCount(topic.views)}</Text>
        <Text style={styles.timeAgo}>{topic.timeAgo}</Text>
      </Pressable>
    </Pressable>
  );
}

function NewTopicModal({
  visible,
  submitting = false,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    excerpt: string,
    categoryId: string,
    brandId: string,
    localPhotoUri?: string,
  ) => void | Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('general');
  const [brandId, setBrandId] = useState('all');
  const [picker, setPicker] = useState<'category' | 'brand' | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoSize, setPhotoSize] = useState(0);
  const [picking, setPicking] = useState(false);

  const cat = findCategory(categoryId);
  const brand = findBrand(brandId);
  const catAccent = CATEGORY_ACCENT[categoryId] ?? EVColors.primary;

  useEffect(() => {
    if (!visible) {
      setTitle('');
      setExcerpt('');
      setCategoryId('general');
      setBrandId('all');
      setPicker(null);
      setPhotoUri(null);
      setPhotoSize(0);
      setPicking(false);
    }
  }, [visible]);

  const resetAndClose = () => {
    if (submitting) return;
    onClose();
  };

  const pickPhoto = async () => {
    if (picking || submitting) return;
    setPicking(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('İzin gerekli', 'Galeri erişimi olmadan foto eklenemez.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsMultipleSelection: false,
      });
      if (res.canceled || !res.assets[0]) return;

      const compressed = await compressImageUnderBytes(
        res.assets[0].uri,
        FIRESTORE_COVER_BYTES,
        1200,
      );
      setPhotoUri(compressed.uri);
      setPhotoSize(compressed.size);
    } catch (e) {
      Alert.alert(
        'Fotoğraf işlenemedi',
        e instanceof Error ? e.message : 'Başka bir görsel dene.',
      );
    } finally {
      setPicking(false);
    }
  };

  const submit = () => {
    if (submitting) return;
    if (!title.trim() || !excerpt.trim()) {
      Alert.alert('Başlık ve açıklama gerekli');
      return;
    }
    void onSubmit(
      title.trim(),
      excerpt.trim(),
      categoryId,
      brandId,
      photoUri ?? undefined,
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.modalBackdrop} onPress={resetAndClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Konu</Text>
            <Pressable onPress={resetAndClose}>
              <Ionicons name="close" size={22} color={EVColors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Başlık</Text>
            <TextInput
              style={styles.field}
              value={title}
              onChangeText={setTitle}
              placeholder="Konu başlığı"
              placeholderTextColor={EVColors.textHint}
            />
            <Text style={styles.fieldLabel}>Açıklama</Text>
            <TextInput
              style={[styles.field, styles.fieldMultiline]}
              value={excerpt}
              onChangeText={setExcerpt}
              placeholder="Kısaca ne hakkında?"
              placeholderTextColor={EVColors.textHint}
              multiline
            />

            <SelectorRow
              label="Kategori"
              emoji={cat.emoji}
              displayName={cat.label}
              accent={catAccent}
              onPress={() => setPicker('category')}
            />
            <SelectorRow
              label="Marka"
              emoji={brand.emoji}
              displayName={brand.name}
              accent={brand.color}
              onPress={() => setPicker('brand')}
            />

            <Text style={styles.fieldLabel}>Fotoğraf (opsiyonel)</Text>
            {photoUri ? (
              <View style={styles.photoPreviewWrap}>
                <Image
                  source={{ uri: photoUri }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                />
                <Pressable
                  style={styles.photoRemove}
                  onPress={() => {
                    setPhotoUri(null);
                    setPhotoSize(0);
                  }}
                  disabled={submitting}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </Pressable>
                <Text style={styles.photoSize}>{formatBytes(photoSize)}</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.photoAdd, picking && { opacity: 0.7 }]}
                onPress={() => void pickPhoto()}
                disabled={picking || submitting}
              >
                {picking ? (
                  <ActivityIndicator color={EVColors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="image-outline"
                      size={22}
                      color={EVColors.primary}
                    />
                    <Text style={styles.photoAddLabel}>Galeriden seç</Text>
                  </>
                )}
              </Pressable>
            )}

            <Pressable
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={submit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitLabel}>Konuyu Yayınla</Text>
              )}
            </Pressable>
          </ScrollView>

          {picker ? (
            <View style={styles.pickerOverlay}>
              <Text style={styles.pickerTitle}>
                {picker === 'category' ? 'Kategori Seç' : 'Marka Seç'}
              </Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {(picker === 'category'
                  ? FORUM_CATEGORIES.filter((c) => c.id !== 'all')
                  : FORUM_BRANDS
                ).map((item) => {
                  const id = item.id;
                  const active =
                    picker === 'category' ? id === categoryId : id === brandId;
                  const color =
                    picker === 'category'
                      ? CATEGORY_ACCENT[id] ?? EVColors.primary
                      : (item as { color?: string }).color ?? EVColors.primary;
                  const emoji = item.emoji;
                  const name =
                    picker === 'category'
                      ? (item as { label: string }).label
                      : (item as { name: string }).name;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => {
                        if (picker === 'category') setCategoryId(id);
                        else setBrandId(id);
                        setPicker(null);
                      }}
                      style={[
                        styles.pickerItem,
                        {
                          backgroundColor: active
                            ? hexWithAlpha(color, 0.1)
                            : EVColors.surface,
                          borderColor: active
                            ? hexWithAlpha(color, 0.5)
                            : EVColors.border,
                          borderWidth: active ? 1.5 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.pickerIcon,
                          { backgroundColor: hexWithAlpha(color, 0.12) },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>{emoji}</Text>
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: '600',
                          color: active ? color : EVColors.textPrimary,
                        }}
                      >
                        {name}
                      </Text>
                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={color}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable onPress={() => setPicker(null)}>
                <Text style={styles.pickerCancel}>Kapat</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SelectorRow({
  label,
  emoji,
  displayName,
  accent,
  onPress,
}: {
  label: string;
  emoji: string;
  displayName: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={[
          styles.selector,
          {
            backgroundColor: hexWithAlpha(accent, 0.06),
            borderColor: hexWithAlpha(accent, 0.35),
          },
        ]}
      >
        <View
          style={[
            styles.selectorIcon,
            { backgroundColor: hexWithAlpha(accent, 0.12) },
          ]}
        >
          <Text style={{ fontSize: 16 }}>{emoji}</Text>
        </View>
        <Text style={[styles.selectorText, { color: accent }]}>
          {displayName}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={hexWithAlpha(accent, 0.6)}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EVColors.background },
  scroll: { paddingBottom: 24 },
  appBar: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appBarEyebrow: { fontSize: 13, color: EVColors.textHint },
  appBarTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: EVColors.textPrimary,
    letterSpacing: -0.6,
  },
  countPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: EVColors.primaryLight,
    borderWidth: 1,
    borderColor: EVColors.primaryMid,
    alignItems: 'center',
  },
  countNum: {
    fontSize: 18,
    fontWeight: '800',
    color: EVColors.primary,
  },
  countLabel: {
    fontSize: 10,
    color: EVColors.textSecondary,
    fontWeight: '500',
  },
  search: {
    marginTop: 16,
    marginHorizontal: 20,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: EVColors.border,
    backgroundColor: EVColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: EVColors.textPrimary,
    paddingVertical: 0,
  },
  chipsRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
    gap: 5,
  },
  chipActive: {
    backgroundColor: EVColors.primary,
    borderColor: EVColors.primary,
  },
  chipEmoji: { fontSize: 12 },
  chipLabel: { fontSize: 12, fontWeight: '600' },
  brandHeading: {
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '600',
    color: EVColors.textSecondary,
  },
  brandsRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  brandCard: {
    width: 72,
    height: 76,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: { fontSize: 22, marginBottom: 4 },
  brandName: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 12,
  },
  brandList: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: EVColors.border,
    backgroundColor: EVColors.surface,
    overflow: 'hidden',
  },
  brandListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  brandListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  brandListReset: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '500',
    color: EVColors.primary,
  },
  divider: { height: 1, backgroundColor: EVColors.divider },
  brandListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: EVColors.divider,
  },
  brandAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandListName: { flex: 1, fontSize: 14 },
  threadPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  sectionHeader: {
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EVColors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSort: {
    fontSize: 12,
    color: EVColors.primary,
    fontWeight: '500',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: EVColors.textHint,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  brandMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  brandMiniText: { fontSize: 9, fontWeight: '700' },
  cardTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: EVColors.textPrimary,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  cardExcerpt: {
    marginTop: 5,
    fontSize: 12,
    color: EVColors.textSecondary,
    lineHeight: 18,
  },
  cardPhoto: {
    marginTop: 10,
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: EVColors.background,
  },
  cardMeta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 9, fontWeight: '700' },
  authorName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: EVColors.textSecondary,
  },
  stat: {
    fontSize: 10,
    color: EVColors.textHint,
    fontWeight: '500',
    marginRight: 4,
  },
  timeAgo: { fontSize: 10, color: EVColors.textHint },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: EVColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: EVColors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: EVColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: EVColors.border,
    marginTop: 10,
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: EVColors.textPrimary,
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
    marginBottom: 14,
  },
  fieldMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  photoAdd: {
    height: 96,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: EVColors.primaryMid,
    backgroundColor: EVColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  photoAddLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: EVColors.primary,
  },
  photoPreviewWrap: {
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: EVColors.border,
    backgroundColor: EVColors.surface,
  },
  photoPreview: {
    width: '100%',
    height: 180,
  },
  photoRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSize: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  selectorIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '600' },
  submitBtn: {
    marginTop: 8,
    marginBottom: 12,
    height: 52,
    borderRadius: 16,
    backgroundColor: EVColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: EVColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EVColors.textPrimary,
    marginBottom: 12,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
  },
  pickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCancel: {
    marginTop: 12,
    textAlign: 'center',
    color: EVColors.primary,
    fontWeight: '600',
  },
});
