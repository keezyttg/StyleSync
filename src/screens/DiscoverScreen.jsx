import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getCommunities, searchCommunities } from '../services/communities';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const FILTER_CHIPS = ['All', 'Streetwear', 'Minimalist', 'Winter', 'Summer', 'Formal'];

const DEFAULT_COMMUNITIES = [
  { id: '1', name: 'NYC Fashion', description: 'Fashion style from NYC' },
  { id: '2', name: 'High Fashion', description: 'Designer brands only fashion' },
  { id: '3', name: 'Cosplay', description: 'Be your favorite character' },
  { id: '4', name: "90's Fashion", description: "Only styles from the 90's" },
  { id: '5', name: "Halloween's Best", description: 'Best October 31st Fits' },
  { id: '6', name: 'Runway Style', description: 'Fits that belong on the runway' },
  { id: '7', name: 'Streetwear', description: 'Hypebeast and street culture fits' },
  { id: '8', name: 'Minimalist', description: 'Less is more' },
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find outfits, styles, communities & creators</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search" placeholderTextColor={COLORS.textMuted} value={query} onChangeText={handleSearch} />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>≡</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={FILTER_CHIPS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        style={styles.filterList}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.filterChip, filter === item && styles.filterChipActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={communities}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.communityRow}>
              <Text style={styles.communityStar}>☆</Text>
              <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{item.name}</Text>
                <Text style={styles.communityDesc}>{item.description}</Text>
              </View>
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
  header: { paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.sm },
  title: { fontSize: FONT_SIZE.xxxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.sm },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 10, gap: SPACING.sm },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  filterBtn: { width: 44, height: 44, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  filterIcon: { fontSize: 18, color: COLORS.textPrimary },
  filterList: { flexGrow: 0, flexShrink: 0, marginBottom: SPACING.md },
  filterRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm, alignItems: 'center' },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: 8, height: 36, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  filterChipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  filterText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '500' },
  filterTextActive: { color: COLORS.white, fontWeight: '700' },
  communityRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.md, borderBottomWidth: 1, borderColor: COLORS.border, gap: SPACING.md },
  communityStar: { fontSize: 22, color: COLORS.textPrimary, marginTop: 2 },
  communityInfo: { flex: 1 },
  communityName: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  communityDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 60 },
});
