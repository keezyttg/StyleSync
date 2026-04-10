import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getCommunities, searchCommunities } from '../services/communities';
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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCommunities(); }, []);

  async function loadCommunities() {
    setLoading(true);
    try {
      const data = await getCommunities();
      setCommunities(data.length > 0 ? data : DEFAULT_COMMUNITIES);
    } catch {
      setCommunities(DEFAULT_COMMUNITIES);
    }
    setLoading(false);
  }

  async function handleSearch(text) {
    setQuery(text);
    if (text.length > 1) {
      const results = await searchCommunities(text);
      setCommunities(results.length > 0 ? results : DEFAULT_COMMUNITIES.filter(c =>
        c.name.toLowerCase().includes(text.toLowerCase())
      ));
    } else if (text.length === 0) {
      loadCommunities();
    }
  }

  function clearSearch() {
    setQuery('');
    loadCommunities();
  }

  const filtered = filter === 'All'
    ? communities
    : communities.filter(c => c.labels?.includes(filter) || c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <View style={styles.container}>
      {/* One-line header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateCommunity')}
        >
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search with delete button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search communities"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={handleSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips — single scrollable line */}
      <FlatList
        data={FILTER_CHIPS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        style={styles.filterList}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.communityRow}
              onPress={() => navigation.navigate('CommunityDetail', { community: item })}
            >
              <View style={styles.communityAvatar}>
                <Text style={styles.communityAvatarText}>{item.name[0].toUpperCase()}</Text>
              </View>
              <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{item.name}</Text>
                <Text style={styles.communityDesc} numberOfLines={1}>{item.description}</Text>
                {item.labels?.length > 0 && (
                  <View style={styles.labelRow}>
                    {item.labels.slice(0, 3).map(l => (
                      <View key={l} style={styles.labelChip}>
                        <Text style={styles.labelText}>{l}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {item.memberCount > 0 && (
                <Text style={styles.memberCount}>{item.memberCount} members</Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No communities found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.sm },
  title: { fontSize: FONT_SIZE.xxxl, fontWeight: '800', color: COLORS.textPrimary },
  createBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  createBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  searchRow: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 10, gap: SPACING.sm },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  clearBtn: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  filterList: { flexGrow: 0, flexShrink: 0, marginBottom: SPACING.md },
  filterRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm, alignItems: 'center' },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 7, height: 34, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, justifyContent: 'center' },
  filterChipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  filterText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '500' },
  filterTextActive: { color: COLORS.white, fontWeight: '700' },
  communityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderColor: COLORS.border, gap: SPACING.md },
  communityAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  communityAvatarText: { color: COLORS.white, fontWeight: '800', fontSize: FONT_SIZE.md },
  communityInfo: { flex: 1 },
  communityName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textPrimary },
  communityDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 1 },
  labelRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  labelChip: { backgroundColor: COLORS.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  labelText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '500' },
  memberCount: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 60 },
});
