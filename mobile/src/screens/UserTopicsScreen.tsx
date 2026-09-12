import React, { useCallback, useState, useMemo } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import type { EVColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import {
  CATEGORY_BADGE,
  ForumTopic,
  formatCount,
  hexWithAlpha,
} from '../data/forum';
import { fetchForumTopicsByAuthor } from '../api/forumTopics';

type Props = NativeStackScreenProps<RootStackParamList, 'UserTopics'>;

export function UserTopicsScreen({ navigation, route }: Props) {
  const { colors, styles } = useStyles();
  const { userId, name } = route.params;
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await fetchForumTopicsByAuthor(userId);
      setTopics(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Konular yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

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
        <View style={styles.topTitles}>
          <Text style={styles.topTitle} numberOfLines={1}>
            Konular
          </Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={
          topics.length === 0 ? styles.emptyScroll : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
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
        ) : error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyBody}>{error}</Text>
          </View>
        ) : topics.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="document-text-outline"
              size={40}
              color={colors.primary}
            />
            <Text style={styles.emptyTitle}>Henüz konu yok</Text>
            <Text style={styles.emptyBody}>
              Bu üye henüz forumda konu açmamış.
            </Text>
          </View>
        ) : (
          topics.map((topic) => {
            const badge =
              CATEGORY_BADGE[topic.categoryId] ?? CATEGORY_BADGE.general;
            return (
              <Pressable
                key={topic.id}
                style={styles.card}
                onPress={() => navigation.navigate('ForumDetail', { topic })}
              >
                {topic.photoUrl ? (
                  <Image
                    source={{ uri: topic.photoUrl }}
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
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.fg }]}>
                      {badge.label}
                    </Text>
                  </View>
                  <Text style={styles.title} numberOfLines={2}>
                    {topic.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {topic.timeAgo} · {formatCount(topic.replies)} yanıt
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textHint}
                />
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
    gap: 8,
  },
  topTitles: { flex: 1, alignItems: 'center' },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
  },
  topSub: {
    marginTop: 1,
    fontSize: 12,
    color: c.textHint,
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
