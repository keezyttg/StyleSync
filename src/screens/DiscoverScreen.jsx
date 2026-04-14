import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCommunities, isJoined, joinCommunity, leaveCommunity } from '../services/communities';
import { searchUsers, followUser, unfollowUser, getFollowing } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const DEFAULT_COMMUNITIES = [
  { id: '1', name: 'NYC Fashion',   description: 'Fashion style from NYC',           labels: ['Streetwear'] },
  { id: '2', name: 'High Fashion',  description: 'Designer brands only',             labels: ['Formal'] },
  { id: '3', name: 'Cosplay',       description: 'Be your favorite character',        labels: [] },
  { id: '4', name: "90's Fashion",  description: "Only styles from the 90's",         labels: ['Vintage'] },
  { id: '5', name: 'Runway Style',  description: 'Fits that belong on the runway',   labels: ['Formal'] },
  { id: '6', name: 'Streetwear',    description: 'Hypebeast and street culture fits', labels: ['Streetwear'] },
  { id: '7', name: 'Minimalist',    description: 'Less is more',                      labels: ['Minimalist'] },
  { id: '8', name: 'Summer Vibes',  description: 'Sun, sand, and style',              labels: ['Summer'] },
];

export default function DiscoverScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [tab, setTab] = useState('People');

  // ── People state ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [suggested, setSuggested] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [following, setFollowing] = useState(new Set());

  // ── Communities state ─────────────────────────────────────────────────────
  const [communities, setCommunities] = useState([]);
  const [commLoading, setCommLoading] = useState(false);
  const [commFilter, setCommFilter] = useState('All');
  const [commQuery, setCommQuery] = useState('');
  const [joinedCommunities, setJoinedCommunities] = useState(new Set());

  // ── Reload following list whenever this screen gains focus ───────────────
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getFollowing(user.uid).then(ids => setFollowing(new Set(ids))).catch(() => {});
    }, [user])
  );

  // ── Load suggested people when People tab is opened ───────────────────────
  const loadSuggested = useCallback(async () => {
    if (!user) return;
    setPeopleLoading(true);
    try {
      const all = await searchUsers('');
      const followSet = following;
      const suggestions = all
        .filter(u => u.id !== user.uid && !followSet.has(u.id))
        .slice(0, 30);
      setSuggested(suggestions);
    } catch {
      setSuggested([]);
    }
    setPeopleLoading(false);
  }, [user, following]);

  useEffect(() => {
    if (tab === 'People' && suggested.length === 0) loadSuggested();
  }, [tab]);

  // ── Load communities + joined state when Communities tab is opened ────────
  const loadCommunities = useCallback(async () => {
    setCommLoading(true);
    try {
      const data = await getCommunities();
      const list = data.length > 0 ? data : DEFAULT_COMMUNITIES;
      setCommunities(list);
      if (user) {
        const results = await Promise.all(list.map(c => isJoined(c.id, user.uid).catch(() => false)));
        const joinedSet = new Set(list.filter((_, i) => results[i]).map(c => c.id));
        setJoinedCommunities(joinedSet);
      }
    } catch {
      setCommunities(DEFAULT_COMMUNITIES);
    }
    setCommLoading(false);
  }, [user]);

  useEffect(() => {
    if (tab === 'Communities' && communities.length === 0) loadCommunities();
  }, [tab]);

  // ── People search ─────────────────────────────────────────────────────────
  async function handleSearch(text) {
    setQuery(text);
    if (text.length < 2) { setSearchResults([]); return; }
    setPeopleLoading(true);
    try {
      const results = await searchUsers(text);
      setSearchResults(results.filter(u => u.id !== user?.uid));
    } catch {
      setSearchResults([]);
    }
    setPeopleLoading(false);
  }

  // ── Follow toggle ─────────────────────────────────────────────────────────
  async function handleFollow(targetUid) {
    if (!user || targetUid === user.uid) return;
    const isFollowing = following.has(targetUid);
    setFollowing(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(targetUid) : next.add(targetUid);
      return next;
    });
    // Update suggested list optimistically
    if (!isFollowing) {
      setSuggested(prev => prev.filter(u => u.id !== targetUid));
    }
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
  }

  // ── Community join toggle ─────────────────────────────────────────────────
  async function handleJoinToggle(communityId, e) {
    e.stopPropagation();
    if (!user) return;
    const wasJoined = joinedCommunities.has(communityId);
    setJoinedCommunities(prev => {
      const next = new Set(prev);
      wasJoined ? next.delete(communityId) : next.add(communityId);
      return next;
    });
    try {
      wasJoined
        ? await leaveCommunity(communityId, user.uid)
        : await joinCommunity(communityId, user.uid);
    } catch {
      setJoinedCommunities(prev => {
        const next = new Set(prev);
        wasJoined ? next.add(communityId) : next.delete(communityId);
        return next;
      });
    }
  }

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredCommunities = communities.filter(c => {
    const matchesTag = commFilter === 'All' || c.labels?.includes(commFilter) || c.name.toLowerCase().includes(commFilter.toLowerCase());
    const matchesQuery = commQuery.length < 2 || c.name.toLowerCase().includes(commQuery.toLowerCase()) || c.description?.toLowerCase().includes(commQuery.toLowerCase());
    return matchesTag && matchesQuery;
  });

  const peopleToShow = query.length >= 2 ? searchResults : suggested;

  // ── Sub-renders ───────────────────────────────────────────────────────────
  function PersonRow({ item }) {
    const isFollowing = following.has(item.id);
    const displayName = item.displayName || item.username || '?';
    return (
      <TouchableOpacity
        style={[styles.personRow, { borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id, username: item.username })}
        activeOpacity={0.7}
      >
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.personAvatarImg} />
        ) : (
          <View style={styles.personAvatar}>
            <Text style={styles.personAvatarText}>{displayName[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.personInfo}>
          <Text style={[styles.personName, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.personUsername, { color: colors.textSecondary }]}>@{item.username}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.followBtn,
            isFollowing && [styles.followBtnActive, { backgroundColor: colors.surface, borderColor: colors.border }],
          ]}
          onPress={() => handleFollow(item.id)}
        >
          <Text style={[styles.followBtnText, isFollowing && { color: colors.textPrimary }]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Discover</Text>
        {tab === 'Communities' && (
          <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('CreateCommunity')}>
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab row */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {['People', 'Communities'].map(t => (
          <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, { color: colors.textSecondary }, tab === t && { color: colors.textPrimary, fontWeight: '700' }]}>{t}</Text>
            {tab === t && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── PEOPLE TAB ── */}
      {tab === 'People' && (
        <View style={{ flex: 1 }}>
          {/* Search bar */}
          <View style={styles.searchRow}>
            <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search by name or username"
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={handleSearch}
                autoCapitalize="none"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); setSearchResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[styles.clearBtn, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {query.length === 0 && (
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Suggested for you</Text>
          )}

          {peopleLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : peopleToShow.length > 0 ? (
            <FlatList
              data={peopleToShow}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
              renderItem={({ item }) => <PersonRow item={item} />}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {query.length >= 2 ? 'No results' : 'No suggestions yet'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {query.length >= 2 ? 'Try a different name or username.' : 'Check back as more people join.'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── COMMUNITIES TAB ── */}
      {tab === 'Communities' && (
        <View style={{ flex: 1 }}>
          {/* Search bar */}
          <View style={styles.searchRow}>
            <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search communities"
                placeholderTextColor={colors.textMuted}
                value={commQuery}
                onChangeText={setCommQuery}
                autoCapitalize="none"
              />
              {commQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCommQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[styles.clearBtn, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagRow}
            style={styles.tagScroll}
          >
            {['All', 'Streetwear', 'Minimalist', 'Formal', 'Vintage', 'Summer', 'Y2K'].map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.tagChip, { borderColor: colors.border, backgroundColor: colors.background }, commFilter === f && styles.tagChipActive]}
                onPress={() => setCommFilter(f)}
              >
                <Text style={[styles.tagChipText, { color: colors.textPrimary }, commFilter === f && styles.tagChipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {commLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredCommunities}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
              renderItem={({ item }) => {
                const joined = joinedCommunities.has(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.communityRow, { borderBottomColor: colors.border }]}
                    onPress={() => navigation.navigate('CommunityDetail', { community: item })}
                  >
                    <View style={styles.communityAvatar}>
                      <Text style={styles.communityAvatarText}>{item.name[0].toUpperCase()}</Text>
                    </View>
                    <View style={styles.communityInfo}>
                      <Text style={[styles.communityName, { color: colors.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.communityDesc, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text>
                      {item.labels?.length > 0 && (
                        <View style={styles.labelRow}>
                          {item.labels.slice(0, 3).map(l => (
                            <View key={l} style={[styles.labelChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                              <Text style={[styles.labelText, { color: colors.textSecondary }]}>{l}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.joinBtn, joined && [styles.joinBtnJoined, { backgroundColor: colors.surface, borderColor: colors.border }]]}
                      onPress={e => handleJoinToggle(item.id, e)}
                    >
                      <Text style={[styles.joinBtnText, joined && { color: colors.textPrimary }]}>
                        {joined ? 'Joined ✓' : 'Join'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary, textAlign: 'center', marginTop: 60 }]}>No communities found.</Text>}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.sm },
  title: { fontSize: FONT_SIZE.xxxl, fontWeight: '800' },
  newBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  newBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, borderBottomWidth: 1, marginBottom: SPACING.sm },
  tabBtn: { marginRight: SPACING.xl, paddingBottom: SPACING.sm },
  tabText: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  tabUnderline: { height: 2, borderRadius: 1, marginTop: 4 },
  // Tag / filter chips
  tagScroll: { flexGrow: 0, flexShrink: 0 },
  tagRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.sm, alignItems: 'center' },
  tagChip: { paddingHorizontal: SPACING.md, paddingVertical: 7, height: 34, borderRadius: BORDER_RADIUS.full, borderWidth: 1, justifyContent: 'center' },
  tagChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagChipText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  tagChipTextActive: { color: COLORS.white, fontWeight: '700' },
  // Explore grid
  outfitGrid: { paddingHorizontal: SPACING.sm, paddingBottom: 100 },
  outfitCell: { flex: 1, margin: SPACING.xs, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', aspectRatio: 0.75 },
  outfitImage: { width: '100%', height: '100%' },
  ratingBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
  ratingBadgeText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  tagBadge: { position: 'absolute', bottom: 8, left: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: BORDER_RADIUS.sm },
  tagBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '600' },
  // People
  searchRow: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 10, gap: SPACING.sm },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md },
  clearBtn: { fontSize: 14, fontWeight: '600' },
  sectionHeading: { fontSize: FONT_SIZE.sm, fontWeight: '600', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  personAvatarImg: { width: 48, height: 48, borderRadius: 24, flexShrink: 0 },
  personRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, gap: SPACING.md },
  personAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  personAvatarText: { color: COLORS.white, fontWeight: '800', fontSize: FONT_SIZE.lg },
  personInfo: { flex: 1 },
  personName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  personUsername: { fontSize: FONT_SIZE.sm, marginTop: 1 },
  followBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  followBtnActive: { borderWidth: 1 },
  followBtnText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  // Communities
  communityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, gap: SPACING.md },
  communityAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  communityAvatarText: { color: COLORS.white, fontWeight: '800', fontSize: FONT_SIZE.md },
  communityInfo: { flex: 1 },
  communityName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  communityDesc: { fontSize: FONT_SIZE.sm, marginTop: 1 },
  labelRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  labelChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm, borderWidth: 1 },
  labelText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  memberCount: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  joinBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: BORDER_RADIUS.full, flexShrink: 0 },
  joinBtnJoined: { borderWidth: 1 },
  joinBtnText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700' },
  // Empty states
  emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  emptyText: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
});
