import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { getCommunities, searchCommunities } from '../services/communities';
import { searchUsers, followUser, unfollowUser, getFollowing } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const FILTER_CHIPS = ['All', 'Streetwear', 'Minimalist', 'Formal', 'Vintage', 'Summer', 'Y2K'];

const DEFAULT_COMMUNITIES = [
  { id: '1', name: 'NYC Fashion', description: 'Fashion style from NYC', labels: ['Streetwear'] },
  { id: '2', name: 'High Fashion', description: 'Designer brands only', labels: ['Formal'] },
  { id: '3', name: 'Cosplay', description: 'Be your favorite character', labels: [] },
  { id: '4', name: "90's Fashion", description: "Only styles from the 90's", labels: ['Vintage'] },
  { id: '5', name: 'Runway Style', description: 'Fits that belong on the runway', labels: ['Formal'] },
  { id: '6', name: 'Streetwear', description: 'Hypebeast and street culture fits', labels: ['Streetwear'] },
  { id: '7', name: 'Minimalist', description: 'Less is more', labels: ['Minimalist'] },
  { id: '8', name: 'Summer Vibes', description: 'Sun, sand, and style', labels: ['Summer'] },
];

export default function DiscoverScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [tab, setTab] = useState('Communities');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const [communities, setCommunities] = useState([]);
  const [commLoading, setCommLoading] = useState(true);

  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [following, setFollowing] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    getFollowing(user.uid).then(ids => setFollowing(new Set(ids))).catch(() => {});
  }, [user]);

  useEffect(() => { loadCommunities(); }, []);

  async function loadCommunities() {
    setCommLoading(true);
    try {
      const data = await getCommunities();
      setCommunities(data.length > 0 ? data : DEFAULT_COMMUNITIES);
    } catch {
      setCommunities(DEFAULT_COMMUNITIES);
    }
    setCommLoading(false);
  }

  async function handleSearch(text) {
    setQuery(text);
    if (tab === 'Communities') {
      if (text.length > 1) {
        const results = await searchCommunities(text);
        setCommunities(results.length > 0 ? results : DEFAULT_COMMUNITIES.filter(c =>
          c.name.toLowerCase().includes(text.toLowerCase())
        ));
      } else if (text.length === 0) {
        loadCommunities();
      }
    } else {
      if (text.length > 1) {
        setPeopleLoading(true);
        try {
          const results = await searchUsers(text);
          setPeople(results.filter(u => u.id !== user?.uid));
        } catch {
          setPeople([]);
        }
        setPeopleLoading(false);
      } else {
        setPeople([]);
      }
    }
  }

  function clearSearch() {
    setQuery('');
    if (tab === 'Communities') loadCommunities();
    else setPeople([]);
  }

  function switchTab(t) {
    setTab(t);
    setQuery('');
    if (t === 'Communities') loadCommunities();
    else setPeople([]);
  }

  async function handleFollow(targetUid) {
    if (!user || targetUid === user.uid) return;
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
  }

  const filtered = filter === 'All'
    ? communities
    : communities.filter(c => c.labels?.includes(filter) || c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Discover</Text>
        {tab === 'Communities' && (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreateCommunity')}
          >
            <Text style={styles.createBtnText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab toggle */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {['Communities', 'People'].map(t => (
          <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => switchTab(t)}>
            <Text style={[styles.tabText, { color: colors.textSecondary }, tab === t && { color: colors.textPrimary, fontWeight: '700' }]}>{t}</Text>
            {tab === t && <View style={[styles.tabUnderline, { backgroundColor: colors.textPrimary }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={tab === 'Communities' ? 'Search communities' : 'Search by username'}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.clearBtn, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Communities tab */}
      {tab === 'Communities' && (
        <>
          <FlatList
            data={FILTER_CHIPS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i}
            style={styles.filterList}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, { borderColor: colors.border, backgroundColor: colors.background }, filter === item && styles.filterChipActive]}
                onPress={() => setFilter(item)}
              >
                <Text style={[styles.filterText, { color: colors.textPrimary }, filter === item && styles.filterTextActive]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          {commLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
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
                  {item.memberCount > 0 && (
                    <Text style={[styles.memberCount, { color: colors.textMuted }]}>{item.memberCount} members</Text>
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No communities found.</Text>}
            />
          )}
        </>
      )}

      {/* People tab */}
      {tab === 'People' && (
        <View style={{ flex: 1 }}>
          {peopleLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : people.length > 0 ? (
            <FlatList
              data={people}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
              renderItem={({ item }) => {
                const isFollowing = following.has(item.id);
                const displayName = item.displayName || item.username || '?';
                return (
                  <TouchableOpacity
                    style={[styles.personRow, { borderBottomColor: colors.border }]}
                    onPress={() => navigation.navigate('UserProfile', { userId: item.id, username: item.username })}
                    activeOpacity={0.7}
                  >
                    {item.photoURL ? (
                      <Image source={{ uri: item.photoURL }} style={styles.personAvatarImage} />
                    ) : (
                      <View style={styles.personAvatar}>
                        <Text style={styles.personAvatarText}>
                          {displayName[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.personInfo}>
                      <Text style={[styles.personName, { color: colors.textPrimary }]}>{displayName}</Text>
                      <Text style={[styles.personUsername, { color: colors.textSecondary }]}>@{item.username}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.followBtn, isFollowing && [styles.followBtnActive, { backgroundColor: colors.surface, borderColor: colors.border }]]}
                      onPress={(e) => { e.stopPropagation(); handleFollow(item.id); }}
                    >
                      <Text style={[styles.followBtnText, isFollowing && { color: colors.textPrimary }]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <View style={styles.peopleEmpty}>
              <Text style={[styles.peopleEmptyTitle, { color: colors.textPrimary }]}>Find people</Text>
              <Text style={[styles.peopleEmptyText, { color: colors.textSecondary }]}>Search by username to find and follow others.</Text>
            </View>
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
  createBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  createBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, borderBottomWidth: 1, marginBottom: SPACING.sm },
  tabBtn: { marginRight: SPACING.xl, paddingBottom: SPACING.sm },
  tabText: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  tabUnderline: { height: 2, borderRadius: 1, marginTop: 4 },
  searchRow: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 10, gap: SPACING.sm },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md },
  clearBtn: { fontSize: 14, fontWeight: '600' },
  filterList: { flexGrow: 0, flexShrink: 0, marginBottom: SPACING.md },
  filterRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm, alignItems: 'center' },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 7, height: 34, borderRadius: BORDER_RADIUS.full, borderWidth: 1, justifyContent: 'center' },
  filterChipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  filterText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  filterTextActive: { color: COLORS.white, fontWeight: '700' },
  communityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, gap: SPACING.md },
  communityAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  communityAvatarText: { color: COLORS.white, fontWeight: '800', fontSize: FONT_SIZE.md },
  communityInfo: { flex: 1 },
  communityName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  communityDesc: { fontSize: FONT_SIZE.sm, marginTop: 1 },
  labelRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  labelChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm, borderWidth: 1 },
  labelText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  memberCount: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 60 },
  personAvatarImage: { width: 48, height: 48, borderRadius: 24, flexShrink: 0 },
  personRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, gap: SPACING.md },
  personAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  personAvatarText: { color: COLORS.white, fontWeight: '800', fontSize: FONT_SIZE.lg },
  personInfo: { flex: 1 },
  personName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  personUsername: { fontSize: FONT_SIZE.sm, marginTop: 1 },
  followBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  followBtnActive: { borderWidth: 1 },
  followBtnText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  peopleEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, gap: SPACING.sm, marginTop: 60 },
  peopleEmptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  peopleEmptyText: { fontSize: FONT_SIZE.md, textAlign: 'center' },
});
