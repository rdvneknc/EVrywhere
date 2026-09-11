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
import { EVColors } from '../theme/colors';
import {
  ChargingStation,
  connectorColor,
} from '../data/charging';
import {
  getChargingStations,
  geocodeCity,
} from '../api/chargingStations';
import { ChargingMapView } from '../components/ChargingMapView';
import { hexWithAlpha } from '../data/forum';
import {
  TurkeyPlace,
  searchTurkeyPlaces,
} from '../data/turkeyPlaces';
import { useAuth } from '../auth/AuthContext';
import {
  StationReview,
  averageRating,
  deleteStationReview,
  subscribeStationReviews,
  upsertStationReview,
} from '../api/chargingReviews';
import { promptReport } from '../lib/reportPrompt';

const FILTERS = ['All', 'AC', 'DC', 'HPC'] as const;
const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 100];

export function ChargingScreen() {
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
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
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
      // Tam / güçlü eşleşme varsa yerel koordinat kullan
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
            tintColor={EVColors.primary}
            colors={[EVColors.primary]}
          />
        }
      >
        <View style={styles.appBar}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Şarj İstasyonları</Text>
            <View style={styles.titleActions}>
              <HeaderMessagesButton compact />
              <Pressable onPress={bootstrapLocation} hitSlop={8}>
                <Ionicons name="locate" size={22} color={EVColors.primary} />
              </Pressable>
            </View>
          </View>
          <Text style={styles.source}>Kaynak: Open Charge Map</Text>
          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <View style={styles.cityInputWrap}>
                <TextInput
                  style={styles.cityInput}
                  value={city}
                  onChangeText={onCityChange}
                  placeholder="Şehir veya ilçe (ör. An… → Ankara)"
                  placeholderTextColor={EVColors.textHint}
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
                  <Pressable
                    style={styles.clearBtn}
                    onPress={clearCity}
                    hitSlop={10}
                    accessibilityLabel="Temizle"
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={EVColors.textHint}
                    />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                style={styles.searchBtn}
                onPress={() => void onCitySearch()}
              >
                <Text style={styles.searchBtnText}>Ara</Text>
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
                      color={EVColors.primary}
                    />
                    <Text style={styles.suggestText}>{p.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <Text style={styles.centerLabel} numberOfLines={2}>
            Merkez: {locationLabel}
          </Text>
        </View>

        <View style={styles.radiusBlock}>
          <Text style={styles.radiusLabel}>Yarıçap: {distanceKm} km</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {RADIUS_OPTIONS.map((km) => {
              const active = distanceKm === km;
              return (
                <Pressable
                  key={km}
                  onPress={() => scheduleReload(km)}
                  style={[
                    styles.radiusChip,
                    active && styles.radiusChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      {
                        color: active
                          ? EVColors.onPrimary
                          : EVColors.textSecondary,
                      },
                    ]}
                  >
                    {km} km
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

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
              bg={EVColors.primaryLight}
              fg={EVColors.primary}
            />
            <StatPill
              icon="flash"
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: active
                      ? EVColors.onPrimary
                      : EVColors.textSecondary,
                  }}
                >
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {loading ? '…' : filtered.length} İstasyon
          </Text>
          <Text style={styles.sectionSort}>Uzaklığa göre</Text>
        </View>

        {loading && stations.length === 0 ? (
          <ActivityIndicator
            color={EVColors.primary}
            style={{ marginVertical: 40 }}
          />
        ) : !loading && filtered.length === 0 ? (
          <Text style={styles.empty}>
            {refLat == null
              ? 'Konum yok. Şehir arayın veya izin verin.'
              : 'Bu filtrede / yarıçapta sonuç yok.'}
          </Text>
        ) : (
          filtered.map((s) => (
            <StationCard
              key={s.ocmId}
              station={s}
              onPress={() => setSelected(s)}
            />
          ))
        )}

        <View style={{ height: 32 }} />
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
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Ionicons name="flash" size={24} color={EVColors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{station.name}</Text>
          <Text style={styles.cardAddress} numberOfLines={2}>
            {station.address}
          </Text>
        </View>
        <Text style={styles.cardDist}>{station.distanceKm} km</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.cardBottom}>
        {station.connectorLabels.map((c) => {
          const color = connectorColor(c);
          return (
            <View
              key={c}
              style={[
                styles.connChip,
                {
                  backgroundColor: hexWithAlpha(color, 0.12),
                  borderColor: hexWithAlpha(color, 0.3),
                },
              ]}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color }}>{c}</Text>
            </View>
          );
        })}
        <View
          style={[
            styles.powerChip,
            { backgroundColor: hexWithAlpha(EVColors.dcAmber, 0.1) },
          ]}
        >
          <Ionicons name="flash" size={11} color={EVColors.dcAmber} />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: EVColors.dcAmber,
            }}
          >
            {station.maxPowerKw} kW
          </Text>
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
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>{station.name}</Text>
            <Text style={styles.sheetAddress}>{station.address}</Text>
            <Text style={styles.sheetMeta}>
              OCM #{station.ocmId} · {station.distanceKm} km
              {avg != null ? ` · ★ ${avg} (${reviews.length})` : ''}
            </Text>

            <View style={styles.sheetActions}>
              <Pressable
                style={styles.outlineBtn}
                onPress={() => {
                  setStars(myReview?.rating || 4);
                  setShowRate(true);
                }}
              >
                <Ionicons
                  name={myReview ? 'star' : 'star-outline'}
                  size={18}
                  color={EVColors.textPrimary}
                />
                <Text style={styles.outlineBtnText}>
                  {myReview ? 'Puanını güncelle' : 'Puan ver'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.filledBtn}
                onPress={() => {
                  setCommentText(myReview?.text || '');
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
              <ActivityIndicator color={EVColors.primary} />
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
                        color={EVColors.textHint}
                      />
                    </Pressable>
                  ) : user ? (
                    <Pressable hitSlop={8} onPress={() => reportReview(r)}>
                      <Ionicons
                        name="flag-outline"
                        size={16}
                        color={EVColors.textHint}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>

          {showRate ? (
            <View style={styles.innerModal}>
              <Text style={styles.innerTitle}>Puan ver</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Pressable key={i} onPress={() => setStars(i)}>
                    <Ionicons
                      name="star"
                      size={32}
                      color={i <= stars ? '#FFB800' : EVColors.divider}
                    />
                  </Pressable>
                ))}
              </View>
              <View style={styles.innerActions}>
                <Pressable onPress={() => setShowRate(false)}>
                  <Text style={styles.cancelText}>İptal</Text>
                </Pressable>
                <Pressable
                  style={[styles.filledBtn, saving && { opacity: 0.7 }]}
                  disabled={saving}
                  onPress={() => void submitReview(stars)}
                >
                  <Text style={styles.filledBtnText}>Gönder</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {showComment ? (
            <View style={styles.innerModal}>
              <Text style={styles.innerTitle}>Yorum</Text>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="İstasyon hakkında deneyimini yaz…"
                placeholderTextColor={EVColors.textHint}
                multiline
              />
              <Pressable
                style={[styles.filledBtn, saving && { opacity: 0.7 }]}
                disabled={saving}
                onPress={() => {
                  if (!commentText.trim()) return;
                  void submitReview(myReview?.rating || stars, commentText);
                }}
              >
                <Text style={styles.filledBtnText}>Kaydet</Text>
              </Pressable>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: EVColors.background },
  scroll: { paddingBottom: 24 },
  appBar: { paddingHorizontal: 20, paddingTop: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: EVColors.textPrimary,
    letterSpacing: -0.5,
  },
  source: {
    marginTop: 4,
    fontSize: 11,
    color: EVColors.textHint,
  },
  searchWrap: {
    marginTop: 12,
    zIndex: 20,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cityInputWrap: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  cityInput: {
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingRight: 40,
    paddingVertical: 12,
    fontSize: 13,
    color: EVColors.textPrimary,
  },
  clearBtn: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  searchBtn: {
    backgroundColor: EVColors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  suggestBox: {
    marginTop: 6,
    backgroundColor: EVColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: EVColors.border,
    overflow: 'hidden',
  },
  suggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: EVColors.divider,
  },
  suggestText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: EVColors.textPrimary,
  },
  centerLabel: {
    marginTop: 6,
    fontSize: 12,
    color: EVColors.textSecondary,
    fontWeight: '500',
  },
  radiusBlock: { paddingHorizontal: 20, paddingTop: 12 },
  radiusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: EVColors.textPrimary,
    marginBottom: 8,
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  radiusChipActive: {
    backgroundColor: EVColors.primary,
    borderColor: EVColors.primary,
  },
  radiusChipText: { fontSize: 12, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
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
    marginHorizontal: 20,
    marginTop: 8,
    fontSize: 12,
    color: '#C0392B',
    lineHeight: 16,
  },
  filters: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  filterChipActive: {
    backgroundColor: EVColors.primary,
    borderColor: EVColors.primary,
  },
  sectionHeader: {
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
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
    textAlign: 'center',
    padding: 40,
    color: EVColors.textHint,
    fontSize: 14,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: EVColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: EVColors.textPrimary,
    letterSpacing: -0.2,
  },
  cardAddress: {
    marginTop: 2,
    fontSize: 12,
    color: EVColors.textHint,
  },
  cardDist: {
    fontSize: 13,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  divider: { height: 1, backgroundColor: EVColors.divider },
  cardBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  connChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  powerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: EVColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(173,196,180,0.4)',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: EVColors.textPrimary,
    letterSpacing: -0.2,
  },
  sheetAddress: {
    marginTop: 4,
    fontSize: 12,
    color: EVColors.textHint,
  },
  sheetMeta: {
    marginTop: 8,
    fontSize: 11,
    color: EVColors.textSecondary,
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
    borderColor: EVColors.border,
    backgroundColor: EVColors.surface,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: EVColors.textPrimary,
  },
  filledBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: EVColors.primary,
    paddingHorizontal: 12,
  },
  filledBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  commentsTitle: {
    marginTop: 12,
    fontWeight: '600',
    color: EVColors.textPrimary,
  },
  noComments: {
    marginTop: 8,
    color: EVColors.textHint,
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
    backgroundColor: EVColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInitials: {
    fontSize: 10,
    fontWeight: '700',
    color: EVColors.primary,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: EVColors.textPrimary,
  },
  commentStars: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF9F27',
  },
  commentBody: { fontSize: 13, color: EVColors.textPrimary, marginTop: 2 },
  commentTime: { fontSize: 11, color: EVColors.textHint, marginTop: 2 },
  innerModal: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: EVColors.surface,
    borderWidth: 1,
    borderColor: EVColors.border,
  },
  innerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: EVColors.textPrimary,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 16,
  },
  innerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  cancelText: { color: EVColors.textSecondary, fontWeight: '500' },
  commentInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: EVColors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    textAlignVertical: 'top',
    color: EVColors.textPrimary,
  },
});
