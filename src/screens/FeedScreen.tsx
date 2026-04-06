import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getTrendingOutfits, getCommunityOutfits } from '../services/outfits';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

type Tab = 'Trending' | 'Community';

export default function FeedScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('Trending');
  const [outfits, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = tab === 'Trending'
      ? await getTrendingOutfits()
      : await getCommunityOutfits();
    setOutfits(data);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function StarRow({ rating, count }: { rating: number; count: number }) {
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <Text key={i} style={{ fontSize: 18, color: i <= Math.round(rating) ? COLORS.star : COLORS.border }}>★</Text>
        ))}
        <Text style={styles.ratingText}>{rating.toFixed(1)}/5</Text>
        <Text style={styles.ratingCount}>{count} ratings</Text>
      </View>
    );
  }

  function OutfitCard({ item }: { item: any }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OutfitDetail', { outfit: item })}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(item.displayName || 'U')[0].toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{item.displayName || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {item.tags?.length > 0 && (
          <View style={styles.tagChip}>
            <Text style={styles.tagChipText}>{item.tags[0]}</Text>
          </View>
        )}

        <Image source={{ uri: item.imageURL }} style={styles.outfitImage} resizeMode="cover" />

        <View style={styles.cardFooter}>
          <StarRow rating={item.avgRating ?? 0} count={item.ratingCount ?? 0} />
          <Text style={styles.savesText}>{item.saves ?? 0} saves</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoBlack}>Style</Text>
          <Text style={styles.logoMagenta}>Sync</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabRow}>
        {(['Trending', 'Community'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            {tab === t && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'Trending' && (
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionText}>Top rated this week</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <OutfitCard item={item} />}
          contentContainerStyle={{ padding: SPACING.md, gap: SPACING.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No outfits yet. Be the first to post!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 56,
    paddingBottom: SPACING.sm,
  },
  logoRow: { flexDirection: 'row' },
  logoBlack: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary },
  logoMagenta: { fontSize: 24, fontStyle: 'italic', color: COLORS.primary },
  bellIcon: { fontSize: 22 },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderColor: COLORS.border },
  tabBtn: { marginRight: SPACING.xl, paddingBottom: SPACING.sm },
  tabText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.textPrimary, fontWeight: '700' },
  tabUnderline: { height: 2, backgroundColor: COLORS.textPrimary, borderRadius: 1, marginTop: 4 },
  sectionLabel: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  sectionText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: { color: COLORS.white, fontWeight: '700' },
  headerInfo: { flex: 1 },
  username: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary },
  followBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  followBtnText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  tagChip: {
    position: 'absolute',
    top: 70,
    left: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 10,
  },
  tagChipText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  outfitImage: { width: '100%', height: 280 },
  cardFooter: { padding: SPACING.md },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 4 },
  ratingText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 6 },
  ratingCount: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginLeft: 4 },
  savesText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'right' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 60, fontSize: FONT_SIZE.md },
});
