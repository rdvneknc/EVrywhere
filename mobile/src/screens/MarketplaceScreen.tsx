import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import {
  DEFAULT_FILTER,
  EV_BRANDS,
  EvBrand,
  EvListing,
  ListingFilter,
  DateSort,
  PriceSort,
  filterListings,
  formatPrice,
  isFilterActive,
  isFollowing,
  subscribeFollow,
  toggleFollow,
} from '../data/marketplace';
import { hexWithAlpha } from '../data/forum';
import { HeaderMessagesButton } from '../components/HeaderMessagesButton';
import { useAuth } from '../auth/AuthContext';
import { createListing, fetchListings, subscribeListings } from '../api/listings';
import { createNotification } from '../api/notifications';
import { useBlockLists } from '../hooks/useBlockLists';
import { HeroBanner } from '../components/HeroBanner';
import {
  compressImageUnderBytes,
  FIRESTORE_PHOTO_BYTES,
  formatBytes,
} from '../lib/imageCompress';
import {
  DRIVETRAIN_OPTIONS,
  VEHICLE_COLORS,
  WARRANTY_OPTIONS,
  getModelSpecs,
} from '../data/evModelSpecs';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MARKET_HERO = require('../../assets/forum-hero.jpg');

const FEATURED_BRAND_IDS = [
  'togg',
  'tesla',
  'byd',
  'bmw',
  'hyundai',
  'mg',
] as const;

const CURRENT_YEAR = new Date().getFullYear();
const LISTING_YEARS = Array.from({ length: CURRENT_YEAR - 2010 + 1 }, (_, i) =>
  String(CURRENT_YEAR - i),
);

export function MarketplaceScreen() {
  const { colors, styles } = useStyles();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { hiddenIds } = useBlockLists();
  const { width } = useWindowDimensions();
  const cardW = (width - 32 - 12) / 2;
  const searchRef = useRef<TextInput>(null);

  const [brand, setBrand] = useState<EvBrand | null>(null);
  const [model, setModel] = useState('Tümü');
  const [filter, setFilter] = useState<ListingFilter>(DEFAULT_FILTER);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showNewListing, setShowNewListing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbListings, setDbListings] = useState<EvListing[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [, setFollowTick] = useState(0);

  useEffect(() => subscribeFollow(() => setFollowTick((t) => t + 1)), []);
  useEffect(() => subscribeListings(setDbListings), []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setDbListings(await fetchListings());
    } catch {
      // realtime listener devam eder
    } finally {
      setRefreshing(false);
    }
  };

  const featuredBrands = useMemo(() => {
    const byId = new Map(EV_BRANDS.map((b) => [b.id, b]));
    return FEATURED_BRAND_IDS.map((id) => byId.get(id)).filter(
      (b): b is EvBrand => Boolean(b),
    );
  }, []);

  const listings = useMemo(() => {
    if (!brand) return [];
    const q = searchQuery.trim().toLowerCase();
    const fromDb = dbListings.filter(
      (l) =>
        (!l.sellerUserId || !hiddenIds.has(l.sellerUserId)) &&
        l.brandId === brand.id &&
        (model === 'Tümü' || l.model === model) &&
        (!q ||
          l.model.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          String(l.year).includes(q)),
    );
    return filterListings(fromDb, filter).slice(0, 24);
  }, [brand, model, filter, dbListings, hiddenIds, searchQuery]);

  const vitrin = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dbListings
      .filter(
        (l) =>
          (!l.sellerUserId || !hiddenIds.has(l.sellerUserId)) &&
          (!q ||
            l.model.toLowerCase().includes(q) ||
            l.location.toLowerCase().includes(q) ||
            (EV_BRANDS.find((b) => b.id === l.brandId)?.name ?? '')
              .toLowerCase()
              .includes(q)),
      )
      .slice(0, 14);
  }, [dbListings, hiddenIds, searchQuery]);
  const accent = brand?.color ?? colors.primary;
  const activeFilter = isFilterActive(filter);

  const goBack = () => {
    if (model !== 'Tümü') {
      setModel('Tümü');
      setFilter(DEFAULT_FILTER);
    } else {
      setBrand(null);
      setModel('Tümü');
      setFilter(DEFAULT_FILTER);
    }
  };

  const openDetail = (listing: EvListing) => {
    navigation.navigate('ListingDetail', { listing });
  };

  const selectBrand = (b: EvBrand) => {
    setBrand(b);
    setModel('Tümü');
    setFilter(DEFAULT_FILTER);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
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
          {brand ? (
            <Pressable onPress={goBack} style={styles.iconBtn}>
              <Ionicons
                name="arrow-back"
                size={18}
                color={colors.primary}
              />
            </Pressable>
          ) : (
            <View style={styles.logoMark}>
              <Ionicons name="flash" size={16} color="#fff" />
            </View>
          )}
          <View style={styles.brandBlock}>
            {brand == null ? (
              <>
                <Text style={styles.brandName}>
                  <Text style={{ color: colors.primary }}>EV</Text>rywhere
                </Text>
                <Text style={styles.brandTagline}>Daha temiz yarınlar için</Text>
              </>
            ) : (
              <>
                <Text style={styles.brandNameSmall} numberOfLines={1}>
                  {model === 'Tümü' ? brand.name : `${brand.name} · ${model}`}
                </Text>
                <Text style={styles.brandTagline}>
                  {model === 'Tümü'
                    ? 'Model seç veya tümünü gör'
                    : `${listings.length} ilan`}
                </Text>
              </>
            )}
          </View>
          <Pressable
            style={styles.iconBtn}
            onPress={() => searchRef.current?.focus()}
            hitSlop={6}
          >
            <Ionicons name="search" size={18} color={colors.primary} />
          </Pressable>
          <HeaderMessagesButton compact />
          {brand && listings.length > 0 ? (
            <Pressable
              onPress={() => setShowFilter(true)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: activeFilter ? accent : colors.primaryLight,
                  borderColor: activeFilter ? accent : colors.primaryMid,
                },
              ]}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={activeFilter ? '#fff' : accent}
              />
            </Pressable>
          ) : (
            <View style={styles.countPill}>
              <Text style={styles.countNum}>
                {brand ? listings.length : vitrin.length}
              </Text>
              <Text style={styles.countLabel}>ilan</Text>
            </View>
          )}
        </View>

        <View style={styles.heroWrap}>
          <HeroBanner
            source={MARKET_HERO}
            eyebrow="Pazar"
            title="2. El"
            subtitle="Topluluktan güvenilir elektrikli araç ilanlarını keşfet."
          />

          <View style={styles.searchFloat}>
            <Ionicons name="search" size={18} color={colors.textHint} />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Model, şehir veya marka ara…"
              placeholderTextColor={colors.textHint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textHint}
                />
              </Pressable>
            ) : null}
            <Pressable
              style={styles.filterBtnFloat}
              onPress={() =>
                brand ? setShowFilter(true) : setShowBrandPicker(true)
              }
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

        <View style={styles.brandHeadingRow}>
          <Text style={styles.brandHeading}>Markaya Göre</Text>
          <Pressable onPress={() => setShowBrandPicker(true)}>
            <Text style={styles.brandSeeAll}>Tümünü Gör ›</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandsRow}
        >
          {featuredBrands.map((b) => {
            const active = brand?.id === b.id;
            return (
              <Pressable
                key={b.id}
                onPress={() => {
                  if (active) {
                    setBrand(null);
                    setModel('Tümü');
                    setFilter(DEFAULT_FILTER);
                  } else {
                    selectBrand(b);
                  }
                }}
                style={styles.brandItem}
              >
                <View
                  style={[
                    styles.brandCircle,
                    {
                      backgroundColor: active
                        ? hexWithAlpha(b.color, 0.12)
                        : colors.surface,
                      borderColor: active
                        ? hexWithAlpha(b.color, 0.55)
                        : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.brandEmoji}>{b.emoji}</Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.brandLabel,
                    { color: active ? b.color : colors.textSecondary },
                  ]}
                >
                  {b.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {brand ? (
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <SelectorButton
              label="Model"
              value={model}
              emoji={model === 'Tümü' ? undefined : brand.emoji}
              color={brand.color}
              onPress={() => setShowModelPicker(true)}
            />
          </View>
        ) : null}

        {brand == null ? (
          <>
            <View style={styles.feedHeader}>
              <View>
                <Text style={styles.feedTitle}>Vitrin</Text>
                <Text style={styles.feedSub}>Öne çıkan ilanlar</Text>
              </View>
              <Pressable
                style={styles.newListingBtn}
                onPress={() => setShowNewListing(true)}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.newListingLabel}>İlan Ver</Text>
              </Pressable>
            </View>
            {vitrin.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name="car-outline"
                  size={48}
                  color={colors.textHint}
                />
                <Text style={styles.emptyText}>Henüz vitrin ilanı yok</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {vitrin.map((l) => (
                  <GridCard
                    key={l.id}
                    listing={l}
                    currentUserId={user?.uid}
                    width={cardW}
                    onPress={() => openDetail(l)}
                  />
                ))}
              </View>
            )}
          </>
        ) : listings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text style={styles.emptyText}>Uygun ilan bulunamadı</Text>
            {activeFilter ? (
              <Pressable
                onPress={() => setFilter(DEFAULT_FILTER)}
                style={styles.clearPill}
              >
                <Text style={styles.clearPillText}>Filtreleri Temizle</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.feedHeader}>
              <View>
                <Text style={styles.feedTitle}>{listings.length} ilan</Text>
                <Text style={styles.feedSub}>
                  {activeFilter ? 'Filtrelenmiş sonuçlar' : 'Tüm sonuçlar'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {activeFilter ? (
                  <Pressable
                    onPress={() => setFilter(DEFAULT_FILTER)}
                    style={styles.clearSmall}
                  >
                    <Text style={styles.clearSmallText}>Temizle</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.newListingBtn}
                  onPress={() => setShowNewListing(true)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.newListingLabel}>İlan Ver</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.grid}>
              {listings.map((l) => (
                <GridCard
                  key={l.id}
                  listing={l}
                  currentUserId={user?.uid}
                  width={cardW}
                  onPress={() => openDetail(l)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => setShowNewListing(true)}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabLabel}>İlan Ver</Text>
      </Pressable>

      <BrandPickerModal
        visible={showBrandPicker}
        selected={brand}
        onClose={() => setShowBrandPicker(false)}
        onSelect={(b) => {
          selectBrand(b);
          setShowBrandPicker(false);
        }}
      />

      <PickerModal
        visible={showModelPicker}
        title="Model Seç"
        options={brand ? ['Tümü', ...brand.models] : []}
        selected={model}
        accent={brand?.color ?? colors.primary}
        onClose={() => setShowModelPicker(false)}
        onSelect={(m) => {
          setModel(m);
          setFilter(DEFAULT_FILTER);
          setShowModelPicker(false);
        }}
      />

      <FilterModal
        visible={showFilter}
        current={filter}
        accent={accent}
        onClose={() => setShowFilter(false)}
        onApply={(f) => {
          setFilter(f);
          setShowFilter(false);
        }}
      />

      <NewListingModal
        visible={showNewListing}
        initialBrandId={brand?.id}
        onClose={() => setShowNewListing(false)}
        onCreated={(listing) => {
          setShowNewListing(false);
          const b = EV_BRANDS.find((x) => x.id === listing.brandId);
          if (b) {
            setBrand(b);
            setModel(listing.model);
          }
          navigation.navigate('ListingDetail', { listing });
        }}
      />
    </View>
  );
}

function SelectorButton({
  label,
  value,
  emoji,
  color,
  onPress,
}: {
  label: string;
  value?: string | null;
  emoji?: string;
  color: string;
  onPress: () => void;
}) {
  const { colors, styles } = useStyles();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selector,
        {
          borderColor: value ? hexWithAlpha(color, 0.4) : colors.border,
          backgroundColor: value
            ? hexWithAlpha(color, 0.06)
            : colors.surface,
        },
      ]}
    >
      <View
        style={[
          styles.selectorIcon,
          { backgroundColor: hexWithAlpha(color, 0.12) },
        ]}
      >
        <Text style={{ fontSize: 16 }}>{emoji ?? '🚗'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.selectorLabel}>{label}</Text>
        <Text
          style={[
            styles.selectorValue,
            { color: value ? color : colors.textHint },
          ]}
        >
          {value ?? 'Seçiniz'}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={20} color={color} />
    </Pressable>
  );
}

function GridCard({
  listing,
  currentUserId,
  width,
  onPress,
}: {
  listing: EvListing;
  currentUserId?: string;
  width: number;
  onPress: () => void;
}) {
  const { colors, styles } = useStyles();
  const [, tick] = useState(0);
  useEffect(() => subscribeFollow(() => tick((t) => t + 1)), []);
  const followed = isFollowing(listing.id);
  const damageColor =
    listing.damageStatus === 'Kazasız' ? colors.primary : colors.error;

  return (
    <Pressable onPress={onPress} style={[styles.card, { width }]}>
      <View
        style={[
          styles.cardImage,
          {
            backgroundColor: listing.gradient[1],
          },
        ]}
      >
        {listing.photos[0] ? (
          <Image
            source={{ uri: listing.photos[0] }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <>
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: listing.gradient[0],
                  opacity: 0.55,
                },
              ]}
            />
            <Text style={styles.cardEmoji}>{listing.emoji}</Text>
          </>
        )}
        {listing.isFeatured ? (
          <View style={styles.featured}>
            <Text style={styles.featuredText}>★</Text>
          </View>
        ) : null}
        <View
          style={[
            styles.damageBadge,
            { backgroundColor: hexWithAlpha(damageColor, 0.85) },
          ]}
        >
          <Text style={styles.damageBadgeText}>
            {listing.damageStatus === 'Kazasız' ? '✓' : '!'}
          </Text>
        </View>
        <Pressable
          style={[
            styles.followBtn,
            {
              backgroundColor: followed
                ? colors.primary
                : 'rgba(0,0,0,0.4)',
            },
          ]}
          onPress={() => {
            const title = `${listing.year} ${listing.model}`;
            const on = toggleFollow(listing.id, title);
            if (on) {
              if (currentUserId) {
                void createNotification({
                  actorId: currentUserId,
                  userId: currentUserId,
                  type: 'system',
                  title: 'Takip Başladı',
                  body: `${title} fiyat takibine alındı.`,
                });
              }
              setTimeout(() => {
                if (isFollowing(listing.id) && currentUserId) {
                  void createNotification({
                    actorId: currentUserId,
                    userId: currentUserId,
                    type: 'priceDown',
                    title: 'Fiyat Güncellendi',
                    body: `${title} için yeni fiyat bilgisi var.`,
                  });
                }
              }, 3000);
            }
            Alert.alert(
              on
                ? '🔔 Takibe alındı — fiyat düşünce bildirim alacaksın'
                : '🔕 Takip bırakıldı',
            );
          }}
        >
          <Ionicons
            name={followed ? 'notifications' : 'notifications-outline'}
            size={15}
            color="#fff"
          />
        </Pressable>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardModel} numberOfLines={1}>
          {listing.year} {listing.model}
        </Text>
        <Text style={styles.cardPrice}>{formatPrice(listing.price)}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="speedometer-outline" size={11} color={colors.textHint} />
          <Text style={styles.metaTxt}>
            {(listing.km / 1000).toFixed(0)}K
          </Text>
          <Ionicons name="battery-charging" size={11} color={colors.textHint} />
          <Text style={styles.metaTxt}>%{listing.batteryHealth}</Text>
          <Text style={[styles.metaTxt, { marginLeft: 'auto' }]}>
            {listing.location}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function BrandPickerModal({
  visible,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selected: EvBrand | null;
  onClose: () => void;
  onSelect: (b: EvBrand) => void;
}) {
  const { colors, styles } = useStyles();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Marka Seç</Text>
          <FlatList
            data={EV_BRANDS}
            keyExtractor={(b) => b.id}
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => {
              const active = selected?.id === item.id;
              return (
                <Pressable
                  onPress={() => onSelect(item)}
                  style={[
                    styles.pickItem,
                    {
                      backgroundColor: active
                        ? hexWithAlpha(item.color, 0.1)
                        : colors.surface,
                      borderColor: active
                        ? hexWithAlpha(item.color, 0.5)
                        : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.pickAvatar,
                      { backgroundColor: hexWithAlpha(item.color, 0.12) },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontWeight: '600',
                      color: active ? item.color : colors.textPrimary,
                    }}
                  >
                    {item.name}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={item.color}
                    />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function PickerModal({
  visible,
  title,
  options,
  selected,
  accent,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  accent: string;
  onClose: () => void;
  onSelect: (v: string) => void;
}) {
  const { colors, styles } = useStyles();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map((o) => {
            const active = o === selected;
            return (
              <Pressable
                key={o}
                onPress={() => onSelect(o)}
                style={[
                  styles.pickItem,
                  {
                    backgroundColor: active
                      ? hexWithAlpha(accent, 0.1)
                      : colors.surface,
                    borderColor: active
                      ? hexWithAlpha(accent, 0.5)
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    flex: 1,
                    fontWeight: '600',
                    color: active ? accent : colors.textPrimary,
                  }}
                >
                  {o}
                </Text>
                {active ? (
                  <Ionicons name="checkmark-circle" size={18} color={accent} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

function FilterModal({
  visible,
  current,
  accent,
  onClose,
  onApply,
}: {
  visible: boolean;
  current: ListingFilter;
  accent: string;
  onClose: () => void;
  onApply: (f: ListingFilter) => void;
}) {
  const { colors, styles } = useStyles();
  const [f, setF] = useState(current);
  useEffect(() => {
    if (visible) setF(current);
  }, [visible, current]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { maxHeight: '85%' }]}>
          <View style={styles.handle} />
          <View style={styles.filterHeader}>
            <Text style={styles.sheetTitle}>Filtrele</Text>
            <Pressable onPress={() => setF(DEFAULT_FILTER)}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Sıfırla
              </Text>
            </Pressable>
          </View>
          <ScrollView>
            <Text style={styles.fLabel}>
              Fiyat: {formatPrice(f.priceMin)} – {formatPrice(f.priceMax)}
            </Text>
            <ChipRow
              options={['0-2M', '2-3M', '3-5M', 'Tümü']}
              selected={
                f.priceMax === 2000000
                  ? '0-2M'
                  : f.priceMin === 2000000 && f.priceMax === 3000000
                    ? '2-3M'
                    : f.priceMin === 3000000
                      ? '3-5M'
                      : 'Tümü'
              }
              accent={accent}
              onSelect={(o) => {
                if (o === '0-2M') setF({ ...f, priceMin: 0, priceMax: 2000000 });
                else if (o === '2-3M')
                  setF({ ...f, priceMin: 2000000, priceMax: 3000000 });
                else if (o === '3-5M')
                  setF({ ...f, priceMin: 3000000, priceMax: 5000000 });
                else setF({ ...f, priceMin: 0, priceMax: 5000000 });
              }}
            />
            <Text style={styles.fLabel}>Kimden</Text>
            <ChipRow
              options={['Tümü', 'Sahibinden', 'Galeriden']}
              selected={f.sellerType}
              accent={accent}
              onSelect={(o) => setF({ ...f, sellerType: o })}
            />
            <Text style={styles.fLabel}>Hasar</Text>
            <ChipRow
              options={['Tümü', 'Kazasız', 'Kazalı']}
              selected={f.damageStatus}
              accent={accent}
              onSelect={(o) => setF({ ...f, damageStatus: o })}
            />
            <Text style={styles.fLabel}>Tarih sıralama</Text>
            <ChipRow
              options={['none', 'newest', 'oldest']}
              labels={{ none: 'Yok', newest: 'En yeni', oldest: 'En eski' }}
              selected={f.dateSort}
              accent={accent}
              onSelect={(o) => setF({ ...f, dateSort: o as DateSort })}
            />
            <Text style={styles.fLabel}>Fiyat sıralama</Text>
            <ChipRow
              options={['none', 'highest', 'lowest']}
              labels={{
                none: 'Yok',
                highest: 'Yüksekten',
                lowest: 'Düşükten',
              }}
              selected={f.priceSort}
              accent={accent}
              onSelect={(o) => setF({ ...f, priceSort: o as PriceSort })}
            />
          </ScrollView>
          <Pressable
            style={[styles.applyBtn, { backgroundColor: accent }]}
            onPress={() => onApply(f)}
          >
            <Text style={styles.applyText}>Uygula</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ChipRow({
  options,
  selected,
  accent,
  onSelect,
  labels,
}: {
  options: string[];
  selected: string;
  accent: string;
  onSelect: (o: string) => void;
  labels?: Record<string, string>;
}) {
  const { colors, styles } = useStyles();
  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const active = o === selected;
        return (
          <Pressable
            key={o}
            onPress={() => onSelect(o)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? accent : colors.surface,
                borderColor: active ? accent : colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: active ? '#fff' : colors.textSecondary,
              }}
            >
              {labels?.[o] ?? o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NewListingModal({
  visible,
  onClose,
  onCreated,
  initialBrandId,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (listing: EvListing) => void;
  initialBrandId?: string;
}) {
  const { colors, styles } = useStyles();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoSizes, setPhotoSizes] = useState<number[]>([]);
  const [brandId, setBrandId] = useState(initialBrandId ?? '');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [price, setPrice] = useState('');
  const [km, setKm] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [sellerType, setSellerType] = useState('Sahibinden');
  const [damage, setDamage] = useState('Kazasız');
  const [batteryHealth, setBatteryHealth] = useState('95');
  const [rangeKm, setRangeKm] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [acPower, setAcPower] = useState('');
  const [dcPower, setDcPower] = useState('');
  const [motorPower, setMotorPower] = useState('');
  const [drivetrain, setDrivetrain] = useState('Arkadan İtiş');
  const [chargeType, setChargeType] = useState('CCS2');
  const [vehicleColor, setVehicleColor] = useState('Beyaz');
  const [warranty, setWarranty] = useState('Yok');
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedBrand = EV_BRANDS.find((b) => b.id === brandId);

  const applyModelSpecs = (nextBrandId: string, nextModel: string) => {
    if (!nextBrandId || !nextModel) return;
    const s = getModelSpecs(nextBrandId, nextModel);
    setRangeKm(String(s.range));
    setBatteryCapacity(String(s.batteryCapacity));
    setAcPower(String(s.acChargePower));
    setDcPower(String(s.dcChargePower));
    setMotorPower(String(s.motorPower));
    setDrivetrain(s.drivetrain);
    setChargeType(s.chargeType);
  };

  useEffect(() => {
    if (visible && initialBrandId) setBrandId(initialBrandId);
  }, [visible, initialBrandId]);

  const pickPhoto = async () => {
    if (photos.length >= 8 || picking) return;
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
        FIRESTORE_PHOTO_BYTES,
      );
      setPhotos((p) => [...p, compressed.uri]);
      setPhotoSizes((s) => [...s, compressed.size]);
    } catch (e) {
      Alert.alert(
        'Fotoğraf işlenemedi',
        e instanceof Error ? e.message : 'Başka bir görsel dene.',
      );
    } finally {
      setPicking(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((p) => p.filter((_, i) => i !== index));
    setPhotoSizes((s) => s.filter((_, i) => i !== index));
  };

  const reset = () => {
    setPhotos([]);
    setPhotoSizes([]);
    setBrandId(initialBrandId ?? '');
    setModel('');
    setYear(String(new Date().getFullYear()));
    setPrice('');
    setKm('');
    setCity('');
    setDescription('');
    setSellerType('Sahibinden');
    setDamage('Kazasız');
    setBatteryHealth('95');
    setRangeKm('');
    setBatteryCapacity('');
    setAcPower('');
    setDcPower('');
    setMotorPower('');
    setDrivetrain('Arkadan İtiş');
    setChargeType('CCS2');
    setVehicleColor('Beyaz');
    setWarranty('Yok');
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const publish = async () => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'İlan vermek için giriş yapmalısın.');
      return;
    }
    if (!brandId || !model.trim()) {
      Alert.alert('Eksik bilgi', 'Marka ve model gerekli.');
      return;
    }
    if (photos.length < 1) {
      Alert.alert('Fotoğraf gerekli', 'En az 1 fotoğraf ekle.');
      return;
    }
    const priceN = Number(price.replace(/\D/g, ''));
    const kmN = Number(km.replace(/\D/g, ''));
    const yearN = Number(year.replace(/\D/g, ''));
    if (!priceN || !kmN || !yearN || !city.trim()) {
      Alert.alert('Eksik bilgi', 'Fiyat, km, yıl ve şehir gerekli.');
      return;
    }
    const bh = Number(batteryHealth.replace(/\D/g, ''));
    if (!bh || bh < 1 || bh > 100) {
      Alert.alert('Batarya sağlığı', '1–100 arası bir değer gir.');
      return;
    }
    const rangeN = Number(rangeKm.replace(/\D/g, ''));
    const batN = Number(batteryCapacity.replace(/\D/g, ''));
    const acN = Number(acPower.replace(/[^\d.]/g, ''));
    const dcN = Number(dcPower.replace(/[^\d.]/g, ''));
    const motorN = Number(motorPower.replace(/\D/g, ''));
    if (!rangeN || !batN || !acN || !dcN || !motorN) {
      Alert.alert(
        'Teknik özellikler',
        'Model seçince teknik alanlar dolmalı. Eksikse tamamla.',
      );
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const listing = await createListing(user, {
        brandId,
        model: model.trim(),
        year: yearN,
        price: priceN,
        km: kmN,
        location: city.trim(),
        sellerType,
        damageStatus: damage,
        description,
        batteryHealth: bh,
        range: rangeN,
        chargeType,
        color: vehicleColor,
        warranty,
        acChargePower: acN,
        dcChargePower: dcN,
        batteryCapacity: batN,
        motorPower: motorN,
        drivetrain,
        localPhotoUris: photos,
      });
      Alert.alert('İlan yayınlandı', 'Fotoğraflar kaydedildi.');
      reset();
      onCreated(listing);
    } catch (e) {
      Alert.alert(
        'Yayınlanamadı',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={[styles.sheet, { maxHeight: '92%' }]}>
          <View style={styles.handle} />
          <View style={styles.filterHeader}>
            <Text style={styles.sheetTitle}>İlan Ver</Text>
            <Pressable onPress={close} disabled={saving}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.fLabel}>
              Fotoğraflar (max 8 · otomatik küçültülür)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
            >
              <Pressable
                style={[styles.photoAdd, picking && { opacity: 0.7 }]}
                onPress={() => void pickPhoto()}
                disabled={picking || photos.length >= 8}
              >
                {picking ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="camera-outline"
                      size={22}
                      color={colors.primary}
                    />
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>
                      Ekle ({photos.length}/8)
                    </Text>
                  </>
                )}
              </Pressable>
              {photos.map((uri, i) => (
                <View key={`${uri}-${i}`} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <Pressable
                    style={styles.photoRemove}
                    onPress={() => removePhoto(i)}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </Pressable>
                  <Text style={styles.photoSize}>
                    {formatBytes(photoSizes[i] ?? 0)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.fLabel}>Marka</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {EV_BRANDS.map((b) => {
                const active = b.id === brandId;
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => {
                      setBrandId(b.id);
                      setModel('');
                      setRangeKm('');
                      setBatteryCapacity('');
                      setAcPower('');
                      setDcPower('');
                      setMotorPower('');
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? b.color : colors.surface,
                        borderColor: active ? b.color : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: active ? '#fff' : colors.textSecondary,
                      }}
                    >
                      {b.emoji} {b.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedBrand ? (
              <>
                <Text style={styles.fLabel}>Model</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {selectedBrand.models.map((m) => {
                    const active = m === model;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => {
                          setModel(m);
                          applyModelSpecs(brandId, m);
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active
                              ? selectedBrand.color
                              : colors.surface,
                            borderColor: active
                              ? selectedBrand.color
                              : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: active ? '#fff' : colors.textSecondary,
                          }}
                        >
                          {m}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}

            <Text style={styles.fLabel}>Model yılı</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {LISTING_YEARS.map((y) => {
                const active = year === y;
                return (
                  <Pressable
                    key={y}
                    onPress={() => setYear(y)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.surface,
                        borderColor: active
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: active ? '#fff' : colors.textSecondary,
                      }}
                    >
                      {y}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Field
              label="Fiyat (₺)"
              value={price}
              onChange={setPrice}
              placeholder="ör. 2850000"
              keyboard="numeric"
            />
            <Field
              label="Kilometre"
              value={km}
              onChange={setKm}
              placeholder="ör. 18500"
              keyboard="numeric"
            />
            <Field
              label="Şehir"
              value={city}
              onChange={setCity}
              placeholder="ör. İstanbul"
            />
            <Field
              label="Açıklama (opsiyonel)"
              value={description}
              onChange={setDescription}
              placeholder="Araç hakkında kısa bilgi"
            />
            <Text style={styles.fLabel}>Kimden</Text>
            <ChipRow
              options={['Sahibinden', 'Galeriden']}
              selected={sellerType}
              accent={colors.primary}
              onSelect={setSellerType}
            />
            <Text style={styles.fLabel}>Hasar Durumu</Text>
            <ChipRow
              options={['Kazasız', 'Kazalı']}
              selected={damage}
              accent={colors.primary}
              onSelect={setDamage}
            />

            <Text style={[styles.fLabel, { marginTop: 8 }]}>
              Araç rengi
            </Text>
            <ChipRow
              options={[...VEHICLE_COLORS]}
              selected={vehicleColor}
              accent={colors.primary}
              onSelect={setVehicleColor}
            />
            <Text style={styles.fLabel}>Garanti</Text>
            <ChipRow
              options={[...WARRANTY_OPTIONS]}
              selected={warranty}
              accent={colors.primary}
              onSelect={setWarranty}
            />
            <Field
              label="Batarya sağlığı (%)"
              value={batteryHealth}
              onChange={setBatteryHealth}
              placeholder="ör. 95"
              keyboard="numeric"
            />

            {model ? (
              <>
                <Text style={[styles.sectionHint, { marginTop: 10 }]}>
                  Teknik özellikler — modelden otomatik; dilersen düzelt
                </Text>
                <Field
                  label="Menzil (km)"
                  value={rangeKm}
                  onChange={setRangeKm}
                  placeholder="ör. 500"
                  keyboard="numeric"
                />
                <Field
                  label="Pil kapasitesi (kWh)"
                  value={batteryCapacity}
                  onChange={setBatteryCapacity}
                  placeholder="ör. 75"
                  keyboard="numeric"
                />
                <Field
                  label="AC şarj (kW)"
                  value={acPower}
                  onChange={setAcPower}
                  placeholder="ör. 11"
                  keyboard="numeric"
                />
                <Field
                  label="DC şarj (kW)"
                  value={dcPower}
                  onChange={setDcPower}
                  placeholder="ör. 150"
                  keyboard="numeric"
                />
                <Field
                  label="Motor gücü (hp)"
                  value={motorPower}
                  onChange={setMotorPower}
                  placeholder="ör. 300"
                  keyboard="numeric"
                />
                <Text style={styles.fLabel}>Çekiş</Text>
                <ChipRow
                  options={[...DRIVETRAIN_OPTIONS]}
                  selected={drivetrain}
                  accent={colors.primary}
                  onSelect={setDrivetrain}
                />
                <Text style={styles.fLabel}>Şarj tipi</Text>
                <ChipRow
                  options={['CCS2', 'CHAdeMO', 'Type2']}
                  selected={chargeType}
                  accent={colors.primary}
                  onSelect={setChargeType}
                />
              </>
            ) : null}

            <Pressable
              style={[styles.applyBtn, saving && { opacity: 0.75 }]}
              onPress={() => void publish()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.applyText}>İlanı Yayınla</Text>
              )}
            </Pressable>
            <Text style={styles.uploadHint}>
              Fotoğraflar küçültülüp Firestore’da saklanır (Storage gerekmez).
            </Text>
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
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboard?: 'numeric';
}) {
  const { colors, styles } = useStyles();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fLabel}>{label}</Text>
      <TextInput
        style={styles.field}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textHint}
        keyboardType={keyboard === 'numeric' ? 'numeric' : 'default'}
      />
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
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: c.textPrimary,
    letterSpacing: -0.4,
  },
  brandNameSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: c.textPrimary,
    letterSpacing: -0.3,
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
  filterPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
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
  filterBtnFloat: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  feedHeader: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  feedTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: c.textPrimary,
    letterSpacing: -0.3,
  },
  feedSub: {
    marginTop: 2,
    fontSize: 12,
    color: c.textHint,
    fontWeight: '500',
  },
  newListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primary,
  },
  newListingLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  selectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorLabel: {
    fontSize: 11,
    color: c.textHint,
    fontWeight: '500',
  },
  selectorValue: { fontSize: 15, fontWeight: '700', marginTop: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardImage: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardEmoji: { fontSize: 44, zIndex: 1 },
  featured: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  featuredText: { fontSize: 10, fontWeight: '700', color: '#000' },
  damageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  damageBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  followBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  cardModel: {
    fontSize: 11,
    fontWeight: '700',
    color: c.textPrimary,
  },
  cardPrice: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
    color: c.primary,
  },
  cardMeta: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaTxt: { fontSize: 10, color: c.textSecondary, marginRight: 4 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textSecondary,
  },
  clearPill: {
    backgroundColor: c.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearPillText: {
    color: c.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
  },
  clearSmall: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  clearSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: c.error,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: c.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: c.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: c.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    marginTop: 10,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: c.textPrimary,
    marginBottom: 12,
  },
  pickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  pickAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '600',
    color: c.primary,
    marginBottom: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  applyBtn: {
    marginTop: 16,
    height: 50,
    borderRadius: 16,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  photoAdd: {
    width: 110,
    height: 110,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: c.primary,
    borderStyle: 'dashed',
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  photoThumbWrap: {
    width: 110,
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: c.border,
  },
  photoThumb: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSize: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 3,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  uploadHint: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 12,
    color: c.textHint,
    textAlign: 'center',
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
  },
});
}
