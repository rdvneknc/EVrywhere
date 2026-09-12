import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { HeaderMessagesButton } from '../components/HeaderMessagesButton';
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { ChargingStation, connectorColor } from '../data/charging';
import { getChargingStations, geocodeCity } from '../api/chargingStations';
import { ChargingMapView } from '../components/ChargingMapView';
import { hexWithAlpha } from '../data/forum';
import { TurkeyPlace, searchTurkeyPlaces } from '../data/turkeyPlaces';
import { useAuth } from '../auth/AuthContext';
import {
  StationReview,
  averageRating,
  deleteStationReview,
  subscribeStationReviews,
  upsertStationReview,
} from '../api/chargingReviews';
import { promptReport } from '../lib/reportPrompt';
import { HeroBanner } from '../components/HeroBanner';

const CHARGING_HERO = require('../../assets/forum-hero.jpg');

const FILTERS = [
  { id: 'All', label: 'Tümü', emoji: '⚡' },
  { id: 'AC', label: 'AC', emoji: '🔌' },
  { id: 'DC', label: 'DC', emoji: '🔋' },
  { id: 'HPC', label: 'HPC', emoji: '🚀' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 100];

export function ChargingScreen() {
  const { colors, styles } = useStyles();
  const searchRef = useRef<TextInput>(null);
  const [city, setCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<TurkeyPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refLat, setRefLat] = useState<number | null>(null);
  const [refLng, setRefLng] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState('…');
  const [distanceKm, setDistanceKm] = useState(25);
  const [filter, setFilter] = useState<FilterId>('All');
  const [selected, setSelected] = useState<ChargingStation | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const distanceRef = useRef(distanceKm);
  distanceRef.current = distanceKm;

  const loadStations = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const list = await getChargingStations({
        lat,
        lng,
        distanceKm: distanceRef.current,
        maxResults: 80,
      });
      list.sort((a, b) => a.distanceKm - b.distanceKm);
      setStations(list);
    } catch (e) {
      setStations([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const bootstrapLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        setLocationLabel('Şehir ara');
        setError('Konum izni yok. Aşağıdan şehir yazarak arayabilirsin.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setRefLat(pos.coords.latitude);
      setRefLng(pos.coords.longitude);
      setLocationLabel('Konumun');
      await loadStations(pos.coords.latitude, pos.coords.longitude);
    } catch (e) {
      setLoading(false);
      setLocationLabel('Şehir ara');
      setError(`Konum alınamadı: ${e instanceof Error ? e.message : e}`);
    }
  }, [loadStations]);

  useEffect(() => {
    bootstrapLocation();
  }, [bootstrapLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (refLat != null && refLng != null) {
        await loadStations(refLat, refLng);
      } else {
        await bootstrapLocation();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const scheduleReload = (km: number) => {
    distanceRef.current = km;
    setDistanceKm(km);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (refLat != null && refLng != null) {
        loadStations(refLat, refLng);
      }
    }, 400);
  };

  const onCitySearch = async () => {
    const q = city.trim();
    if (q.length < 2) {
      Alert.alert('En az 2 harf gir.');
      return;
    }
    setShowSuggestions(false);
    setLoading(true);
    try {
      const matches = searchTurkeyPlaces(q, 1);
      const local = matches[0];
      if (local) {
        setRefLat(local.lat);
        setRefLng(local.lng);
        setLocationLabel(local.label);
        setCity(local.label);
        await loadStations(local.lat, local.lng);
        return;
      }
      const g = await geocodeCity(q);
      setRefLat(g.lat);
      setRefLng(g.lng);
      setLocationLabel(g.displayName);
      await loadStations(g.lat, g.lng);
    } catch (e) {
      setLoading(false);
      Alert.alert(
        'Adres bulunamadı',
        e instanceof Error ? e.message : String(e),
      );
    }
  };

  const onCityChange = (text: string) => {
    setCity(text);
    const next = searchTurkeyPlaces(text, 10);
    setCitySuggestions(next);
    setShowSuggestions(text.trim().length >= 1 && next.length > 0);
  };

  const clearCity = () => {
    setCity('');
    setCitySuggestions([]);
    setShowSuggestions(false);
  };

  const selectPlace = async (place: TurkeyPlace) => {
    setCity(place.label);
    setShowSuggestions(false);
    setCitySuggestions([]);
    setLoading(true);
    setError(null);
    try {
      setRefLat(place.lat);
      setRefLng(place.lng);
      setLocationLabel(place.label);
      await loadStations(place.lat, place.lng);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'All') return stations;
    return stations.filter((s) => {
      const u = s.connectorLabels.map((c) => c.toUpperCase());
      if (filter === 'HPC') return u.includes('HPC');
      if (filter === 'AC') return u.includes('AC');
      if (filter === 'DC') return u.includes('DC') || u.includes('HPC');
      return true;
    });
  }, [stations, filter]);

  const maxPower = stations.length
    ? Math.max(...stations.map((s) => s.maxPowerKw))
    : 0;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
          <Pressable
            style={styles.iconBtn}
            onPress={() => void bootstrapLocation()}
            hitSlop={6}
            accessibilityLabel="Konumumu kullan"
          >
            <Ionicons name="locate" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.heroWrap}>
          <HeroBanner
            source={CHARGING_HERO}
            eyebrow="Harita"
            title="Şarj"
            subtitle="Yakındaki istasyonları bul, filtrele ve deneyimlerini paylaş."
          />

          <View style={styles.searchFloat}>
            <Ionicons name="search" size={18} color={colors.textHint} />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              value={city}
              onChangeText={onCityChange}
              placeholder="Şehir veya ilçe ara…"
              placeholderTextColor={colors.textHint}
              returnKeyType="search"
              onSubmitEditing={() => void onCitySearch()}
              onFocus={() => {
                if (city.trim().length >= 1) {
                  const next = searchTurkeyPlaces(city, 10);
                  setCitySuggestions(next);
                  setShowSuggestions(next.length > 0);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            {city.length > 0 ? (
              <Pressable onPress={clearCity} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textHint}
                />
              </Pressable>
            ) : null}
            <Pressable
              style={styles.searchGo}
              onPress={() => void onCitySearch()}
            >
              <Text style={styles.searchGoLabel}>Ara</Text>
            </Pressable>
          </View>

          {showSuggestions ? (
            <View style={styles.suggestBox}>
              {citySuggestions.map((p) => (
                <Pressable
                  key={`${p.label}-${p.lat}`}
                  style={styles.suggestItem}
                  onPress={() => void selectPlace(p)}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.suggestText}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <Text style={styles.centerLabel} numberOfLines={2}>
          Merkez: {locationLabel}
          <Text style={styles.sourceHint}> · Open Charge Map</Text>
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={styles.chipEmoji}>{f.emoji}</Text>
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
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>Yarıçap</Text>
          <Text style={styles.sectionHint}>{distanceKm} km</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.radiusRow}
        >
          {RADIUS_OPTIONS.map((km) => {
            const active = distanceKm === km;
            return (
              <Pressable
                key={km}
                onPress={() => scheduleReload(km)}
                style={[styles.radiusChip, active && styles.radiusChipActive]}
              >
                <Text
                  style={[
                    styles.radiusChipText,
                    {
                      color: active
                        ? colors.onPrimary
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {km} km
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ChargingMapView
          stations={filtered}
          centerLat={refLat}
          centerLng={refLng}
          onStationTap={setSelected}
        />

        {stations.length > 0 ? (
          <View style={styles.statsRow}>
            <StatPill
              icon="flash"
              label={`${stations.length} nokta`}
              bg={colors.primaryLight}
              fg={colors.primary}
            />
            <StatPill
              icon="speedometer-outline"
              label={`Max ${maxPower} kW`}
              bg="#FFF3E0"
              fg="#BF6D00"
            />
            <StatPill
              icon="radio-outline"
              label={`${distanceKm} km`}
              bg="#E8F3FC"
              fg="#185FA5"
            />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.feedHeader}>
          <View>
            <Text style={styles.feedTitle}>
              {loading ? '…' : `${filtered.length} İstasyon`}
            </Text>
            <Text style={styles.feedSub}>Uzaklığa göre sıralı</Text>
          </View>
          <Pressable
            style={styles.locateBtn}
            onPress={() => void bootstrapLocation()}
          >
            <Ionicons name="navigate" size={14} color="#fff" />
            <Text style={styles.locateLabel}>Konumum</Text>
          </Pressable>
        </View>

        {loading && stations.length === 0 ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyText}>İstasyonlar yükleniyor…</Text>
          </View>
        ) : !loading && filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="flash-outline"
              size={48}
              color={colors.textHint}
            />
            <Text style={styles.emptyText}>
              {refLat == null
                ? 'Konum yok. Şehir arayın veya izin verin.'
                : 'Bu filtrede / yarıçapta sonuç yok.'}
            </Text>
          </View>
        ) : (
          filtered.map((s) => (
            <StationCard
              key={s.ocmId}
              station={s}
              onPress={() => setSelected(s)}
            />
          ))
        )}

        <View style={{ height: 28 }} />
      </ScrollView>

      <StationDetailModal
        station={selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function StatPill({
  icon,
  label,
  bg,
  fg,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  bg: string;
  fg: string;
}) {
  const { colors, styles } = useStyles();
  return (
    <View
      style={[
        styles.statPill,
        { backgroundColor: bg, borderColor: hexWithAlpha(fg, 0.2) },
      ]}
    >
      <Ionicons name={icon} size={12} color={fg} />
      <Text style={{ fontSize: 11, fontWeight: '600', color: fg }}>{label}</Text>
    </View>
  );
}

function StationCard({
  station,
  onPress,
}: {
  station: ChargingStation;
  onPress: () => void;
}) {
  const { colors, styles } = useStyles();
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardIconWrap}>
        <View style={styles.cardIcon}>
          <Ionicons name="flash" size={20} color={colors.primary} />
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          {station.connectorLabels.slice(0, 3).map((c) => {
            const color = connectorColor(c);
            return (
              <View
                key={c}
                style={[styles.badge, { backgroundColor: hexWithAlpha(color, 0.12) }]}
              >
                <Text style={[styles.badgeText, { color }]}>{c}</Text>
              </View>
            );
          })}
          <Text style={styles.cardDist}>{station.distanceKm} km</Text>
        </View>

        <Text numberOfLines={2} style={styles.cardTitle}>
          {station.name}
        </Text>
        <Text style={styles.cardMetaLine} numberOfLines={2}>
          {station.address || 'Adres yok'}
        </Text>

        <View style={styles.cardStats}>
          <Ionicons name="flash-outline" size={13} color={colors.dcAmber} />
          <Text style={[styles.stat, { color: colors.dcAmber }]}>
            {station.maxPowerKw} kW
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textHint}
            style={{ marginLeft: 'auto' }}
          />
        </View>
      </View>
    </Pressable>
  );
}

function StationDetailModal({
  station,
  onClose,
}: {
  station: ChargingStation | null;
  onClose: () => void;
}) {
  const { colors, styles } = useStyles();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<StationReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [stars, setStars] = useState(4);
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!station) {
      setReviews([]);
      setShowRate(false);
      setShowComment(false);
      setCommentText('');
      return;
    }
    setLoading(true);
    return subscribeStationReviews(
      station.ocmId,
      (items) => {
        setReviews(items);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [station]);

  if (!station) return null;

  const avg = averageRating(reviews);
  const myReview = reviews.find((r) => r.authorId === user?.uid);

  const submitReview = async (rating: number, text?: string) => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'Puan veya yorum için giriş yapmalısın.');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await upsertStationReview(user, {
        stationOcmId: station.ocmId,
        stationName: station.name,
        rating: rating || myReview?.rating || 4,
        text: text ?? myReview?.text,
      });
      setShowRate(false);
      setShowComment(false);
      setCommentText('');
      Alert.alert('Teşekkürler', 'İncelemen kaydedildi.');
    } catch (e) {
      Alert.alert(
        'Kaydedilemedi',
        e instanceof Error ? e.message : 'Tekrar dene.',
      );
    } finally {
      setSaving(false);
    }
  };

  const reportReview = (review: StationReview) => {
    if (!user) return;
    promptReport({
      reporterId: user.uid,
      targetType: 'post',
      targetId: review.id,
      targetLabel: station.name,
    });
  };

  return (
    <Modal
      visible={station != null}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={onClose}
          accessibilityLabel="Kapat"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          style={styles.sheet}
        >
          <View style={styles.sheetHeader}>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.sheetHandleHit}
              accessibilityLabel="Aşağı kaydırarak kapat"
            >
              <View style={styles.handle} />
            </Pressable>
            <Pressable
              onPress={onClose}
              style={styles.sheetCloseBtn}
              hitSlop={8}
              accessibilityLabel="Kapat"
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <Text style={styles.sheetTitle}>{station!.name}</Text>
            <Text style={styles.sheetAddress}>{station!.address}</Text>
            <Text style={styles.sheetMeta}>
              OCM #{station!.ocmId} · {station!.distanceKm} km
              {avg != null ? ` · ★ ${avg} (${reviews.length})` : ''}
            </Text>

            <View style={styles.sheetActions}>
              <Pressable
                style={styles.outlineBtn}
                onPress={() => {
                  setStars(myReview?.rating || 4);
                  setShowComment(false);
                  setShowRate(true);
                }}
              >
                <Ionicons
                  name={myReview ? 'star' : 'star-outline'}
                  size={18}
                  color={colors.textPrimary}
                />
                <Text style={styles.outlineBtnText}>
                  {myReview ? 'Puanını güncelle' : 'Puan ver'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                onPress={() => {
                  setCommentText(myReview?.text || '');
                  setStars(myReview?.rating || stars || 4);
                  setShowRate(false);
                  setShowComment(true);
                }}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                <Text style={styles.filledBtnText}>Yorum</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />
            <Text style={styles.commentsTitle}>
              İncelemeler ({reviews.length})
            </Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : reviews.length === 0 ? (
              <Text style={styles.noComments}>
                Henüz inceleme yok. İlk puanı sen ver.
              </Text>
            ) : (
              reviews.map((r) => (
                <View key={r.id} style={styles.commentItem}>
                  <View
                    style={[
                      styles.commentAvatar,
                      {
                        backgroundColor: hexWithAlpha(r.authorColor, 0.15),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.commentInitials,
                        { color: r.authorColor },
                      ]}
                    >
                      {r.authorInitials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Text style={styles.commentAuthor}>{r.authorName}</Text>
                      {r.rating > 0 ? (
                        <Text style={styles.commentStars}>★ {r.rating}</Text>
                      ) : null}
                    </View>
                    {r.text ? (
                      <Text style={styles.commentBody}>{r.text}</Text>
                    ) : null}
                    <Text style={styles.commentTime}>{r.timeAgo}</Text>
                  </View>
                  {user?.uid === r.authorId ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() =>
                        Alert.alert('İncelemeyi sil', 'Kaldırmak istiyor musun?', [
                          { text: 'İptal', style: 'cancel' },
                          {
                            text: 'Sil',
                            style: 'destructive',
                            onPress: () =>
                              void deleteStationReview(r.id).catch(() =>
                                Alert.alert('Silinemedi'),
                              ),
                          },
                        ])
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={colors.textHint}
                      />
                    </Pressable>
                  ) : user ? (
                    <Pressable hitSlop={8} onPress={() => reportReview(r)}>
                      <Ionicons
                        name="flag-outline"
                        size={16}
                        color={colors.textHint}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>

          {showRate || showComment ? (
            <View style={styles.composerWrap}>
              <View style={styles.composerCard}>
                <View style={styles.composerHeader}>
                  <Text style={styles.innerTitle}>
                    {showComment ? 'Yorum yaz' : 'Puan ver'}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowRate(false);
                      setShowComment(false);
                    }}
                    hitSlop={8}
                    accessibilityLabel="İptal"
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>

                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Pressable key={i} onPress={() => setStars(i)} hitSlop={4}>
                      <Ionicons
                        name="star"
                        size={32}
                        color={i <= stars ? '#FFB800' : colors.divider}
                      />
                    </Pressable>
                  ))}
                </View>

                {showComment ? (
                  <TextInput
                    style={styles.commentInput}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="İstasyon hakkında deneyimini yaz…"
                    placeholderTextColor={colors.textHint}
                    multiline
                    autoFocus
                    textAlignVertical="top"
                  />
                ) : null}

                <View style={styles.innerActions}>
                  <Pressable
                    onPress={() => {
                      setShowRate(false);
                      setShowComment(false);
                    }}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelText}>İptal</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      { flex: 0, minWidth: 120 },
                      saving && { opacity: 0.7 },
                    ]}
                    disabled={saving}
                    onPress={() => {
                      if (showComment && !commentText.trim()) {
                        Alert.alert('Yorum boş', 'Birkaç cümle yazıp kaydet.');
                        return;
                      }
                      void submitReview(
                        stars,
                        showComment ? commentText : undefined,
                      );
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.filledBtnText}>
                        {showComment ? 'Kaydet' : 'Gönder'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    </Modal>
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
  heroWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    zIndex: 20,
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
  searchGo: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchGoLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  suggestBox: {
    marginTop: 8,
    marginHorizontal: 10,
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  suggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.divider,
  },
  suggestText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: c.textPrimary,
  },
  centerLabel: {
    marginHorizontal: 20,
    marginTop: 4,
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: '500',
  },
  sourceHint: {
    color: c.textHint,
    fontWeight: '400',
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
  sectionHeadingRow: {
    marginTop: 18,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: c.textPrimary,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '600',
    color: c.primary,
  },
  radiusRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  radiusChipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  radiusChipText: { fontSize: 12, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  error: {
    marginHorizontal: 16,
    marginTop: 10,
    fontSize: 12,
    color: '#C0392B',
    lineHeight: 16,
  },
  feedHeader: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 8,
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
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primary,
  },
  locateLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    paddingVertical: 48,
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
  cardIconWrap: {
    marginTop: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardDist: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '700',
    color: c.primary,
  },
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
    lineHeight: 17,
  },
  cardStats: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stat: {
    fontSize: 11,
    color: c.textHint,
    fontWeight: '600',
  },
  divider: { height: 1, backgroundColor: c.divider },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: c.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    zIndex: 2,
  },
  sheetHeader: {
    position: 'relative',
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHandleHit: {
    paddingVertical: 8,
    paddingHorizontal: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(173,196,180,0.4)',
  },
  sheetCloseBtn: {
    position: 'absolute',
    right: 0,
    top: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: c.textPrimary,
    letterSpacing: -0.2,
  },
  sheetAddress: {
    marginTop: 4,
    fontSize: 12,
    color: c.textHint,
  },
  sheetMeta: {
    marginTop: 8,
    fontSize: 11,
    color: c.textSecondary,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textPrimary,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: c.primary,
    paddingHorizontal: 12,
  },
  filledBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  commentsTitle: {
    marginTop: 12,
    fontWeight: '600',
    color: c.textPrimary,
  },
  noComments: {
    marginTop: 8,
    color: c.textHint,
    fontSize: 12,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInitials: {
    fontSize: 10,
    fontWeight: '700',
    color: c.primary,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textPrimary,
  },
  commentStars: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF9F27',
  },
  commentBody: { fontSize: 13, color: c.textPrimary, marginTop: 2 },
  commentTime: { fontSize: 11, color: c.textHint, marginTop: 2 },
  composerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
    paddingTop: 10,
  },
  composerCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  innerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 12,
  },
  innerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    height: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: c.textSecondary, fontWeight: '600' },
  commentInput: {
    minHeight: 90,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    textAlignVertical: 'top',
    color: c.textPrimary,
    backgroundColor: c.background,
  },
});
}
