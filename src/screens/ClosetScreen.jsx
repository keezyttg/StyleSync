import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { getClosetItems, incrementWornCount } from '../services/closet';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { ClosetRowSkeleton } from '../components/SkeletonLoader';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];
const SORTS = ['Newest', 'Most Worn', 'Least Worn', 'Price: High', 'Price: Low'];

export default function ClosetScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('Newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getClosetItems(user.uid, category === 'All' ? undefined : category);
      setItems(data);
    } catch (err) {
      console.log('Closet load error:', err);
    }
    setLoading(false);
  }, [user, category]);

  const totalWears = items.reduce((sum, i) => sum + (i.wornCount ?? 0), 0);

  function sortedItems() {
    const arr = [...items];
    switch (sort) {
      case 'Most Worn': return arr.sort((a, b) => (b.wornCount ?? 0) - (a.wornCount ?? 0));
      case 'Least Worn': return arr.sort((a, b) => (a.wornCount ?? 0) - (b.wornCount ?? 0));
      case 'Price: High': return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case 'Price: Low': return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      default: return arr; // Newest — already sorted by addedAt desc
    }
  }

  async function handleIncrementWorn(item) {
    try {
      await incrementWornCount(user.uid, item.id, item.price ?? 0, item.wornCount ?? 0);
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, wornCount: (i.wornCount ?? 0) + 1 } : i
      ));
    } catch (err) {
      console.log('Worn count error:', err);
    }
  }

  useEffect(() => { load(); }, [load]);

  function ItemCard({ item }) {
    return (
      <TouchableOpacity style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.85}>
        <Image source={{ uri: item.imageURL }} style={styles.itemImage} resizeMode="cover" />
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{item.category}{item.size ? ` · ${item.size}` : ''}</Text>
          <View style={styles.itemFooter}>
            <Text style={[styles.wornText, { color: colors.textSecondary }]}>Worn {item.wornCount ?? 0}×</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.wornBtn} onPress={() => handleIncrementWorn(item)}>
          <Text style={styles.wornBtnText}>+</Text>
          <Text style={styles.wornBtnLabel}>Wore</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Closet</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddItem')}
          accessibilityRole="button"
          accessibilityLabel="Add item"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {[
          { value: items.length, label: 'Pieces' },
          { value: totalWears, label: 'Total Wears' },
        ].map((stat, i) => (
          <View key={i} style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        contentContainerStyle={styles.categoryRow}
        style={{ flexGrow: 0, flexShrink: 0 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catChip, category === item && styles.catChipActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.catText, category === item && styles.catTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={[styles.buildBanner, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('BuildOutfit')}>
        <Text style={styles.buildIcon}>⊞</Text>
        <View>
          <Text style={styles.buildTitle}>Build an outfit</Text>
          <Text style={styles.buildSub}>Mix pieces from your closet & post</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.listHeader}>
        <Text style={styles.pieceCount}>{items.length} pieces</Text>
        <TouchableOpacity onPress={() => setShowSortMenu(s => !s)}>
          <Text style={styles.sortText}>{sort} ▾</Text>
        </TouchableOpacity>
      </View>

      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SORTS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.sortOption, { borderColor: colors.border }]}
              onPress={() => { setSort(s); setShowSortMenu(false); }}
            >
              <Text style={[styles.sortOptionText, { color: colors.textPrimary }, sort === s && styles.sortOptionActive]}>{s}</Text>
              {sort === s && <Text style={styles.sortCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={{ paddingHorizontal: SPACING.md }}>
          {[1, 2, 3, 4].map(k => <ClosetRowSkeleton key={k} />)}
        </View>
      ) : (
        <FlatList
          data={sortedItems()}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ItemCard item={item} />}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Your closet is empty — let’s get you started</Text>
              <Text style={styles.emptyText}>Add pieces to track cost-per-wear, build outfits, and get outfit ideas. Snap a photo or import from your gallery to begin.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddItem')}
                accessibilityRole="button"
                accessibilityLabel="Add your first item"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.emptyBtnText}>Add your first piece</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md },
  title: { fontSize: FONT_SIZE.xxxl, fontWeight: '800', color: COLORS.textPrimary },
  addBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  addBtnText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm },
  statBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  categoryRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md, alignItems: 'center' },
  catChip: { paddingHorizontal: SPACING.md, paddingVertical: 8, height: 36, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center' },
  catChipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  catText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '500' },
  catTextActive: { color: COLORS.white, fontWeight: '700' },
  buildBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  buildIcon: { fontSize: 24, color: COLORS.primary },
  buildTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textPrimary },
  buildSub: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  pieceCount: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  sortText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '600' },
  itemCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  itemImage: { width: 100, height: 100, backgroundColor: COLORS.surface },
  itemInfo: { flex: 1, padding: SPACING.sm, justifyContent: 'space-between' },
  itemName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textPrimary },
  itemMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  wornText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '500' },
  wornBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderColor: COLORS.border },
  wornBtnText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.primary },
  wornBtnLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },
  sortMenu: { marginHorizontal: SPACING.md, marginBottom: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, overflow: 'hidden' },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: 1, borderColor: COLORS.border },
  sortOptionText: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  sortOptionActive: { color: COLORS.primary, fontWeight: '700' },
  sortCheck: { fontSize: FONT_SIZE.md, color: COLORS.primary },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: 12 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
});
