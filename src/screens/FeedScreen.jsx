import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, useWindowDimensions, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOutfitsByFilter, getCommunityOutfits } from '../services/outfits';
import { getFollowing, followUser, unfollowUser, getUserProfile } from '../services/auth';
import { getUserCommunities } from '../services/communities';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { FeedCardSkeleton } from '../components/SkeletonLoader';
import { getUnreadCount } from '../services/notifications';
import { useFocusEffect } from '@react-navigation/native';
import BrandWordmark from '../components/BrandWordmark';
import { OutfitCard, CARD_CHROME } from '../components/FeedCard';
import { isUserVerified } from '../components/VerifiedBadge';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const COMMUNITIES_CACHE_KEY = 'user_communities_cache';

const TRENDING_FILTERS = [
  { key: 'Hot',           icon: '🔥' },
  { key: 'New',           icon: '✨' },
  { key: 'Top',           icon: '⭐' },
  { key: 'Rising',        icon: '📈' },
  { key: 'Controversial', icon: '⚡' },
];

// Module-level cache: avoids re-fetching profiles across filter/tab changes
const profileCache = new Map();

async function fetchMissingProfiles(ids) {
  const toFetch = ids.filter(id => !profileCache.has(id));
  if (toFetch.length > 0) {
    const profiles = await Promise.all(toFetch.map(id => getUserProfile(id).catch(() => null)));
    toFetch.forEach((id, i) => { if (profiles[i]) profileCache.set(id, profiles[i]); });
  }
  return ids.map(id => profileCache.get(id) ?? null);
}

export default function FeedScreen({ navigation }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [tab, setTab] = useState('Trending');
  const [trendingFilter, setTrendingFilter] = useState('Hot');
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(new Set());
  const [myCommunities, setMyCommunities] = useState([]);
  const [communityFilter, setCommunityFilter] = useState('All');
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getUnreadCount(user.uid).then(setUnreadCount).catch(() => {});
    }, [user])
  );

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getFollowing(user.uid).then(ids => setFollowing(new Set(ids))).catch(() => {});
    }, [user])
  );

  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(COMMUNITIES_CACHE_KEY + user.uid)
      .then(raw => { if (raw) setMyCommunities(JSON.parse(raw)); })
      .catch(() => {});
    getUserCommunities(user.uid).then(communities => {
      setMyCommunities(communities);
      AsyncStorage.setItem(COMMUNITIES_CACHE_KEY + user.uid, JSON.stringify(communities)).catch(() => {});
    }).catch(() => {});
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = tab === 'Trending'
        ? await getOutfitsByFilter(trendingFilter)
        : await getCommunityOutfits();

      const allUserIds = [...new Set(data.filter(o => o.userId).map(o => o.userId))];
      if (allUserIds.length > 0) {
        const profiles = await fetchMissingProfiles(allUserIds);
        const profileMap = {};
        allUserIds.forEach((id, i) => { if (profiles[i]) profileMap[id] = profiles[i]; });
        setOutfits(data.map(o => {
          const p = profileMap[o.userId];
          return {
            ...o,
            username: o.username || p?.displayName || p?.username || '',
            userPhotoURL: o.userPhotoURL ?? p?.photoURL ?? null,
            userVerified: isUserVerified(p),
          };
        }));
      } else {
        setOutfits(data);
      }
    } catch {
      setError('Could not load outfits. Check your connection.');
    }
    setLoading(false);
  }, [tab, trendingFilter]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    profileCache.clear();
    await load();
    setRefreshing(false);
  }

  const filteredOutfits = (() => {
    if (tab !== 'Community' || communityFilter === 'All') return outfits;
    const community = myCommunities.find(c => c.name === communityFilter);
    if (!community || !community.labels?.length) return outfits;
    return outfits.filter(o =>
      o.tags?.some(tag => community.labels.map(l => l.toLowerCase()).includes(tag.toLowerCase()))
    );
  })();

  const handleFollow = useCallback(async (targetUid) => {
    if (!user || !targetUid || targetUid === user.uid) return;
    const isFollowing = following.has(targetUid);
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
      setFollowing(prev => {
        const next = new Set(prev);
        isFollowing ? next.add(targetUid) : next.delete(targetUid);
        return next;
      });
    }
  }, [user, following]);

  const renderItem = useCallback(({ item }) => (
    <OutfitCard
      item={item}
      isFollowing={following.has(item.userId)}
      isOwn={user?.uid === item.userId}
      onFollow={handleFollow}
      navigation={navigation}
    />
  ), [following, user, handleFollow, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <BrandWordmark size={24} mainColor={colors.textPrimary} style={styles.logoRow} />
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellWrap}>
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {['Trending', 'Community'].map(t => (
          <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => { setTab(t); setCommunityFilter('All'); }}>
            <Text style={[styles.tabText, { color: colors.textSecondary }, tab === t && { color: colors.textPrimary, fontWeight: '700' }]}>{t}</Text>
            {tab === t && <View style={[styles.tabUnderline, { backgroundColor: colors.textPrimary }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'Trending' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.filterBar, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.filterBarContent}
        >
          {TRENDING_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, trendingFilter === f.key && styles.filterPillActive]}
              onPress={() => setTrendingFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterPillIcon}>{f.icon}</Text>
              <Text style={[
                styles.filterPillLabel,
                { color: trendingFilter === f.key ? COLORS.white : colors.textSecondary },
              ]}>
                {f.key}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {tab === 'Community' && myCommunities.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {['All', ...myCommunities.map(c => c.name)].map(name => (
            <TouchableOpacity
              key={name}
              style={[styles.filterChip, { borderColor: colors.border, backgroundColor: colors.background }, communityFilter === name && styles.filterChipActive]}
              onPress={() => setCommunityFilter(name)}
            >
              <Text style={[styles.filterChipText, { color: colors.textPrimary }, communityFilter === name && styles.filterChipTextActive]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={{ padding: SPACING.md, gap: SPACING.md }}>
          <FeedCardSkeleton /><FeedCardSkeleton /><FeedCardSkeleton />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { borderColor: colors.primary }]} onPress={load}>
            <Text style={[styles.retryBtnText, { color: colors.primary }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOutfits}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ gap: 1 }}
          snapToInterval={Math.min(screenWidth * 1.25, screenHeight - CARD_CHROME - 220) + CARD_CHROME}
          decelerationRate="fast"
          removeClippedSubviews
          maxToRenderPerBatch={5}
          windowSize={5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nothing here yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Be the first to post an outfit and inspire others.</Text>
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.sm, borderBottomWidth: 1 },
  logoRow: {},
  bellWrap: { position: 'relative' },
  bellIcon: { fontSize: 22 },
  bellBadge: { position: 'absolute', top: -4, right: -6, backgroundColor: COLORS.primary, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, borderBottomWidth: 1 },
  tabBtn: { marginRight: SPACING.xl, paddingBottom: SPACING.sm },
  tabText: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  tabUnderline: { height: 2, borderRadius: 1, marginTop: 4 },
  filterBar: { flexGrow: 0, flexShrink: 0, borderBottomWidth: 1 },
  filterBarContent: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm, alignItems: 'center' },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BORDER_RADIUS.full, backgroundColor: 'transparent' },
  filterPillActive: { backgroundColor: COLORS.primary },
  filterPillIcon: { fontSize: 13 },
  filterPillLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filterRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  filterChipTextActive: { color: COLORS.white, fontWeight: '700' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, marginTop: 60 },
  errorText: { fontSize: FONT_SIZE.md, textAlign: 'center', marginBottom: SPACING.md },
  retryBtn: { borderWidth: 1.5, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 10 },
  retryBtnText: { fontWeight: '700', fontSize: FONT_SIZE.sm },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  emptyText: { fontSize: FONT_SIZE.md, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: 12 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
});
