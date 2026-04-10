import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { getTrendingOutfits, getCommunityOutfits } from '../services/outfits';
import { getFollowing, followUser, unfollowUser } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { FeedCardSkeleton } from '../components/SkeletonLoader';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('Trending');
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(new Set());

  // Load who the current user follows
  useEffect(() => {
    if (!user) return;
    getFollowing(user.uid).then(ids => setFollowing(new Set(ids))).catch(() => {});
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = tab === 'Trending' ? await getTrendingOutfits() : await getCommunityOutfits();
      setOutfits(data);
    } catch (err) {
      console.log('Feed load error:', err);
      setError('Could not load outfits. Check your connection.');
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleFollow(targetUid) {
    if (!user || !targetUid || targetUid === user.uid) return;
    const isFollowing = following.has(targetUid);
    // Optimistic update
    setFollowing(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(targetUid) : next.add(targetUid);
      return next;
    });
    try {
      isFollowing
        ? await unfollowUser(user.uid, targetUid)
        : await followUser(user.uid, targetUid);
    } catch {
      // Revert on failure
      setFollowing(prev => {
        const next = new Set(prev);
        isFollowing ? next.add(targetUid) : next.delete(targetUid);
        return next;
      });
    }
  }

  function HangerRow({ rating, count }) {
    return (
      <View style={styles.hangerRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <Text key={i} style={[styles.hangerIcon, i <= Math.round(rating) && styles.hangerFilled]}>
            {'ʕ'}
          </Text>
        ))}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        <Text style={styles.ratingCount}>({count})</Text>
      </View>
    );
  }

  function OutfitCard({ item }) {
    const isFollowing = following.has(item.userId);
    const isOwn = user?.uid === item.userId;
    const displayName = item.username || item.displayName || 'User';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OutfitDetail', { outfit: item })}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => navigation.navigate('OutfitDetail', { outfit: item })}
          >
            <Text style={styles.avatarText}>{displayName[0].toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerInfo}
            onPress={() => navigation.navigate('OutfitDetail', { outfit: item })}
          >
            <Text style={styles.username}>{displayName}</Text>
            {item.tags?.[0] && <Text style={styles.tagLine}>{item.tags[0]}</Text>}
          </TouchableOpacity>
          {!isOwn && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              onPress={() => handleFollow(item.userId)}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Image source={{ uri: item.imageURL }} style={styles.outfitImage} resizeMode="cover" />

        <View style={styles.cardFooter}>
          <HangerRow rating={item.avgRating ?? 0} count={item.ratingCount ?? 0} />
          <Text style={styles.savesText}>{item.saves ?? 0} saves</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoBlack}>Style</Text>
          <Text style={styles.logoMagenta}>Sync</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {['Trending', 'Community'].map(t => (
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
        <View style={{ padding: SPACING.md, gap: SPACING.md }}>
          <FeedCardSkeleton /><FeedCardSkeleton /><FeedCardSkeleton />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <OutfitCard item={item} />}
          contentContainerStyle={{ padding: SPACING.md, gap: SPACING.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyText}>Be the first to post an outfit and inspire others.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Camera')}>
                <Text style={styles.emptyBtnText}>Post Your First Outfit</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.sm },
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
  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
  headerInfo: { flex: 1 },
  username: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textPrimary },
  tagLine: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 1 },
  followBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: BORDER_RADIUS.full },
  followBtnActive: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  followBtnText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  followBtnTextActive: { color: COLORS.textPrimary },
  outfitImage: { width: '100%', height: 280 },
  cardFooter: { padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hangerRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  hangerIcon: { fontSize: 18, color: COLORS.border },
  hangerFilled: { color: COLORS.primary },
  ratingText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 6 },
  ratingCount: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginLeft: 2 },
  savesText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, marginTop: 60 },
  errorText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.md },
  retryBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 10 },
  retryBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZE.sm },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: 12 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
});
