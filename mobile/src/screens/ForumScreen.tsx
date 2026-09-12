import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
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
import { HeroBanner } from '../components/HeroBanner';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FeedTab = 'recent' | 'popular' | 'unanswered';

const FORUM_HERO = require('../../assets/forum-hero.jpg');

const FEATURED_BRAND_IDS = [
  'tesla',
  'bmw',
  'byd',
  'hyundai',
  'vw',
  'audi',
] as const;

const FEED_TABS: { id: FeedTab; label: string }[] = [
  { id: 'recent', label: 'Son Konular' },
  { id: 'popular', label: 'Popüler' },
  { id: 'unanswered', label: 'Cevapsız' },
];

export function ForumScreen() {
  const { colors, styles } = useStyles();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { hiddenIds } = useBlockLists();
  const searchRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const feedYRef = useRef(0);

  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [activeBrandId, setActiveBrandId] = useState('all');
  const [feedTab, setFeedTab] = useState<FeedTab>('recent');
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

  const featuredBrands = useMemo(() => {
    const byId = new Map(brandsOnly.map((b) => [b.id, b]));
    return FEATURED_BRAND_IDS.map((id) => byId.get(id)).filter(
      (b): b is (typeof brandsOnly)[number] => Boolean(b),
    );
  }, [brandsOnly]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = topics.filter((t) => {
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

    if (feedTab === 'unanswered') {
      list = list.filter((t) => t.replies === 0);
    } else if (feedTab === 'popular') {
      list = [...list].sort(
        (a, b) => b.views + b.replies * 3 - (a.views + a.replies * 3),
      );
    }

    return list;
  }, [
    topics,
    activeCategoryId,
    activeBrandId,
    searchQuery,
    hiddenIds,
    feedTab,
  ]);

  const showAllTopics = () => {
    setActiveCategoryId('all');
    setActiveBrandId('all');
    setFeedTab('recent');
    setSearchQuery('');
    setBrandsExpanded(false);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, feedYRef.current - 8),
        animated: true,
      });
    });
  };

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
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.topBar}>
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Ionicons name="flash" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle}>
                <Text style={{ color: colors.primary }}>EV</Text>rywhere
              </Text>
              <Text style={styles.brandTagline}>Daha temiz yarınlar için</Text>
            </View>
          </View>
          <Pressable
            style={styles.iconBtn}
            onPress={() => searchRef.current?.focus()}
            hitSlop={6}
          >
            <Ionicons name="search" size={18} color={colors.primary} />
          </Pressable>
          <HeaderMessagesButton compact />
          <View style={styles.countPill}>
            <Text style={styles.countNum}>{filtered.length}</Text>
            <Text style={styles.countLabel}>konu</Text>
          </View>
        </View>

        <View style={styles.heroWrap}>
          <HeroBanner
            source={FORUM_HERO}
            eyebrow="Topluluk"
            title="Forum"
            subtitle="Deneyimlerini paylaş, sorularını sor, birlikte daha temiz yarınlar inşa edelim."
          />

          <View style={styles.searchFloat}>
            <Ionicons name="search" size={18} color={colors.textHint} />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Konu, marka veya içerik ara…"
              placeholderTextColor={colors.textHint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            <Pressable
              style={styles.filterBtn}
              onPress={() => setBrandsExpanded((v) => !v)}
              hitSlop={6}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </View>

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
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: active
                        ? colors.onPrimary
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.brandHeadingRow}>
          <Text style={styles.brandHeading}>Markaya Göre</Text>
          <Pressable onPress={() => setBrandsExpanded((v) => !v)}>
            <Text style={styles.brandSeeAll}>
              {brandsExpanded ? 'Kapat' : 'Tümünü Gör >'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandsRow}
        >
          {featuredBrands.map((brand) => {
            const active = brand.id === activeBrandId;
            return (
              <Pressable
                key={brand.id}
                onPress={() =>
                  setActiveBrandId((prev) =>
                    prev === brand.id ? 'all' : brand.id,
                  )
                }
                style={styles.brandItem}
              >
                <View
                  style={[
                    styles.brandCircle,
                    {
                      backgroundColor: active
                        ? hexWithAlpha(brand.color, 0.12)
                        : colors.surface,
                      borderColor: active
                        ? hexWithAlpha(brand.color, 0.55)
                        : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.brandEmoji}>{brand.emoji}</Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.brandLabel,
                    { color: active ? brand.color : colors.textSecondary },
                  ]}
                >
                  {brand.name}
                </Text>
              </Pressable>
            );
          })}
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
                        color: active ? brand.color : colors.textPrimary,
                      },
                    ]}
                  >
                    {brand.name}
                  </Text>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'chevron-forward'}
                    size={18}
                    color={active ? brand.color : colors.textHint}
                  />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View
          style={styles.feedHeader}
          onLayout={(e) => {
            feedYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.feedTabs}
          >
            {FEED_TABS.map((tab) => {
              const active = feedTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setFeedTab(tab.id)}
                  style={styles.feedTab}
                >
                  <Text
                    style={[
                      styles.feedTabLabel,
                      active && styles.feedTabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {active ? <View style={styles.feedTabUnderline} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            style={styles.newTopicBtn}
            onPress={() => setShowNewTopic(true)}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.newTopicLabel}>Yeni Konu</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyText}>Konular yükleniyor…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.empty}>
            <Ionicons
              name="cloud-offline-outline"
              size={48}
              color={colors.textHint}
            />
            <Text style={styles.emptyText}>{loadError}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={colors.textHint}
            />
            <Text style={styles.emptyText}>
              {topics.length === 0
                ? 'Henüz konu yok. İlk konuyu sen aç!'
                : 'Bu filtreyle konu bulunamadı'}
            </Text>
          </View>
        ) : (
          <>
            {filtered.map((topic) => (
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
            ))}
            <Pressable style={styles.seeAllBtn} onPress={showAllTopics}>
              <Text style={styles.seeAllLabel}>Tüm Konuları Gör →</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>

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
  const { colors, styles } = useStyles();
  const badge =
    CATEGORY_BADGE[topic.categoryId] ?? CATEGORY_BADGE.general;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Pressable style={styles.cardAvatarWrap} onPress={onAuthorPress}>
        <View
          style={[
            styles.avatarLg,
            {
              backgroundColor: hexWithAlpha(topic.authorColor, 0.15),
              borderColor: hexWithAlpha(topic.authorColor, 0.28),
            },
          ]}
        >
          <Text style={[styles.avatarLgText, { color: topic.authorColor }]}>
            {topic.authorInitials}
          </Text>
        </View>
        <View style={styles.onlineDot} />
      </Pressable>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
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
          <Ionicons
            name="bookmark-outline"
            size={18}
            color={colors.textHint}
            style={{ marginLeft: 'auto' }}
          />
        </View>

        <Text numberOfLines={2} style={styles.cardTitle}>
          {topic.title}
        </Text>

        <Text style={styles.cardMetaLine} numberOfLines={1}>
          {topic.authorName} • {topic.timeAgo}
        </Text>

        {topic.photoUrl ? (
          <Image
            source={{ uri: topic.photoUrl }}
            style={styles.cardPhoto}
            resizeMode="cover"
          />
        ) : null}

        <View style={styles.cardStats}>
          <Ionicons
            name="chatbubble-outline"
            size={13}
            color={colors.textHint}
          />
          <Text style={styles.stat}>{formatCount(topic.replies)}</Text>
          <Ionicons name="eye-outline" size={13} color={colors.textHint} />
          <Text style={styles.stat}>{formatCount(topic.views)}</Text>
        </View>
      </View>
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
  const { colors, styles } = useStyles();
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
  const catAccent = CATEGORY_ACCENT[categoryId] ?? colors.primary;

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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
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
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Başlık</Text>
            <TextInput
              style={styles.field}
              value={title}
              onChangeText={setTitle}
              placeholder="Konu başlığı"
              placeholderTextColor={colors.textHint}
            />
            <Text style={styles.fieldLabel}>Açıklama</Text>
            <TextInput
              style={[styles.field, styles.fieldMultiline]}
              value={excerpt}
              onChangeText={setExcerpt}
              placeholder="Kısaca ne hakkında?"
              placeholderTextColor={colors.textHint}
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
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="image-outline"
                      size={22}
                      color={colors.primary}
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
                      ? CATEGORY_ACCENT[id] ?? colors.primary
                      : (item as { color?: string }).color ?? colors.primary;
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
                            : colors.surface,
                          borderColor: active
                            ? hexWithAlpha(color, 0.5)
                            : colors.border,
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
                          color: active ? color : colors.textPrimary,
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
  const { colors, styles } = useStyles();
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

function useStyles() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return { colors, styles };
}

function makeStyles(c: EVColorPalette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  scroll: { paddingTop: 4, paddingBottom: 24 },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: c.textPrimary,
    letterSpacing: -0.4,
  },
  brandTagline: {
    marginTop: 1,
    fontSize: 11,
    color: c.textSecondary,
    fontWeight: '500',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.primaryLight,
    borderWidth: 1,
    borderColor: c.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 22,
    backgroundColor: c.primary,
    alignItems: 'center',
  },
  countNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 16,
  },
  countLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  heroWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchFloat: {
    marginTop: -24,
    marginHorizontal: 10,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: '#0D1B12',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: c.textPrimary,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    gap: 5,
  },
  chipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  chipEmoji: { fontSize: 12 },
  chipLabel: { fontSize: 12, fontWeight: '600' },
  brandHeadingRow: {
    marginTop: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: c.textPrimary,
  },
  brandSeeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: c.primary,
  },
  brandsRow: {
    paddingHorizontal: 16,
    gap: 14,
  },
  brandItem: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },
  brandCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: { fontSize: 24 },
  brandLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  brandList: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
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
    color: c.textPrimary,
  },
  brandListReset: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '500',
    color: c.primary,
  },
  divider: { height: 1, backgroundColor: c.divider },
  brandListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.divider,
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
  feedHeader: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedTabs: {
    flexGrow: 1,
    gap: 14,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  feedTab: {
    paddingBottom: 8,
  },
  feedTabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textHint,
  },
  feedTabLabelActive: {
    color: c.textPrimary,
    fontWeight: '800',
  },
  feedTabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: c.primary,
  },
  newTopicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primary,
  },
  newTopicLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: c.textHint,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 14,
    paddingHorizontal: 4,
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.divider,
  },
  cardAvatarWrap: {
    position: 'relative',
    marginTop: 2,
  },
  avatarLg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLgText: { fontSize: 13, fontWeight: '800' },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: c.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: c.textPrimary,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  cardMetaLine: {
    marginTop: 5,
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: '500',
  },
  cardPhoto: {
    marginTop: 10,
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: c.background,
  },
  cardStats: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  stat: {
    fontSize: 11,
    color: c.textHint,
    fontWeight: '500',
    marginRight: 8,
  },
  seeAllBtn: {
    marginTop: 12,
    marginHorizontal: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: c.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: c.background,
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
    backgroundColor: c.border,
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
    color: c.textPrimary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
    marginBottom: 6,
  },
  field: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: c.textPrimary,
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
    borderColor: c.primaryMid,
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  photoAddLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.primary,
  },
  photoPreviewWrap: {
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
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
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  pickerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: c.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
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
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
  },
});
}
