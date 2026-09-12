import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { CATEGORY_BADGE, hexWithAlpha } from '../data/forum';
import { useAuth } from '../auth/AuthContext';
import {
  SavedTopicPreview,
  resolveSavedTopic,
  subscribeSavedTopics,
} from '../api/savedTopics';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedTopics'>;

export function SavedTopicsScreen({ navigation }: Props) {
  const { colors, styles } = useStyles();
  const { user } = useAuth();
  const [items, setItems] = useState<SavedTopicPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    return subscribeSavedTopics(
      user.uid,
      (next) => {
        setItems(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user]);

  const openItem = async (preview: SavedTopicPreview) => {
    if (openingId) return;
    setOpeningId(preview.topicId);
    try {
      const topic = await resolveSavedTopic(preview);
      navigation.navigate('ForumDetail', { topic });
    } finally {
      setOpeningId(null);
      setRefreshing(false);
    }
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
        <Text style={styles.topTitle}>Kaydedilenler</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={
          items.length === 0 ? styles.emptyScroll : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 400);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="bookmark-outline"
              size={40}
              color={colors.primary}
            />
            <Text style={styles.emptyTitle}>Henüz kayıt yok</Text>
            <Text style={styles.emptyBody}>
              Forum konularında Kaydet’e basarak buraya ekleyebilirsin.
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const badge =
              CATEGORY_BADGE[item.categoryId] ?? CATEGORY_BADGE.general;
            return (
              <Pressable
                key={item.topicId}
                style={styles.card}
                onPress={() => void openItem(item)}
                disabled={openingId === item.topicId}
              >
                {item.photoUrl ? (
                  <Image
                    source={{ uri: item.photoUrl }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.thumbPlaceholder,
                      { backgroundColor: hexWithAlpha(badge.fg, 0.12) },
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={22}
                      color={badge.fg}
                    />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View
                    style={[styles.badge, { backgroundColor: badge.bg }]}
                  >
                    <Text style={[styles.badgeText, { color: badge.fg }]}>
                      {badge.label}
                    </Text>
                  </View>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.authorName} · {item.replies} yanıt
                  </Text>
                </View>
                {openingId === item.topicId ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textHint}
                  />
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
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
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyScroll: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '700',
    color: c.textPrimary,
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 13,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: c.background,
  },
  thumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textPrimary,
    lineHeight: 19,
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: c.textHint,
  },
});
}
