import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { getClosetItems, incrementWornCount, decrementWornCount } from '../services/closet';
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
  const [enlargedItem, setEnlargedItem] = useState(null);

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

  async function handleDecrementWorn(item) {
    if ((item.wornCount ?? 0) === 0) return;
    try {
      await decrementWornCount(user.uid, item.id, item.price ?? 0, item.wornCount ?? 0);
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, wornCount: Math.max(0, (i.wornCount ?? 0) - 1) } : i
      ));
    } catch (err) {
      console.log('Worn count error:', err);
    }
  }

  useEffect(() => { load(); }, [load]);

  function ItemCard({ item }) {
    const priceLabel = item.price > 0 ? `${item.currency ?? '$'}${item.price}` : null;
    const worn = item.wornCount ?? 0;
    return (
      <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.itemCardBody} onPress={() => setEnlargedItem(item)} activeOpacity={0.75}>
          <Image source={{ uri: item.imageURL }} style={styles.itemImage} resizeMode="cover" />
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{item.category}{item.size ? ` · ${item.size}` : ''}</Text>
            <View style={styles.itemFooter}>
              <View style={[styles.wornPill, { backgroundColor: colors.surface }]}>
                <Text style={[styles.wornPillText, { color: colors.textSecondary }]}>👟 {worn}×</Text>
              </View>
              {priceLabel && (
                <View style={styles.pricePill}>
                  <Text style={styles.pricePillText}>{priceLabel}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <View style={[styles.wornBtnGroup, { borderLeftColor: colors.border }]}>
          <TouchableOpacity style={styles.wornHalf} onPress={() => handleIncrementWorn(item)}>
            <Text style={styles.wornPlus}>+</Text>
          </TouchableOpacity>
          <View style={[styles.wornDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.wornHalf} onPress={() => handleDecrementWorn(item)}>
            <Text style={[styles.wornMinus, worn === 0 && styles.wornBtnDisabled]}>−</Text>
          </TouchableOpacity>
        </View>
      </View>
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
              <Text style={styles.emptyTitle}>Your closet is empty — let's get you started</Text>
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

      <Modal visible={!!enlargedItem} transparent animationType="fade" onRequestClose={() => setEnlargedItem(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEnlargedItem(null)}>
          {enlargedItem && (
            <View style={styles.modalCard}>
              <Image source={{ uri: enlargedItem.imageURL }} style={styles.modalImage} resizeMode="contain" />
              <View style={styles.modalInfo}>
                <Text style={styles.modalName}>{enlargedItem.name}</Text>
                <Text style={styles.modalMeta}>
                  {enlargedItem.category}{enlargedItem.size ? ` · ${enlargedItem.size}` : ''}
                  {enlargedItem.brand ? ` · ${enlargedItem.brand}` : ''}
                </Text>
                <View style={styles.modalStats}>
                  {enlargedItem.price > 0 && (
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatValue}>{enlargedItem.currency ?? '$'}{enlargedItem.price}</Text>
                      <Text style={styles.modalStatLabel}>Paid</Text>
                    </View>
                  )}
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>{enlargedItem.wornCount ?? 0}×</Text>
                    <Text style={styles.modalStatLabel}>Worn</Text>
                  </View>
                  {enlargedItem.price > 0 && (enlargedItem.wornCount ?? 0) > 0 && (
                    <View style={styles.modalStat}>
                      <Text style={styles.modalStatValue}>{enlargedItem.currency ?? '$'}{enlargedItem.costPerWear ?? enlargedItem.price}</Text>
                      <Text style={styles.modalStatLabel}>Per Wear</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
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
  itemCard: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemCardBody: { flex: 1, flexDirection: 'row' },
  itemImage: { width: 90, height: 90, backgroundColor: COLORS.surface },
  itemInfo: { flex: 1, paddingHorizontal: SPACING.sm, paddingVertical: 10, justifyContent: 'center', gap: 4 },
  itemName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  itemMeta: { fontSize: FONT_SIZE.xs },
  itemFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  wornPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
  wornPillText: { fontSize: 11, fontWeight: '600' },
  pricePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full, backgroundColor: '#E8F5E9' },
  pricePillText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  wornBtnGroup: { width: 48, borderLeftWidth: 1, flexDirection: 'column' },
  wornHalf: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wornDivider: { height: 1 },
  wornPlus: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  wornMinus: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  wornBtnDisabled: { color: COLORS.border },
  // Enlarged image modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modalCard: { width: '100%', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  modalImage: { width: '100%', height: 340 },
  modalInfo: { padding: SPACING.md },
  modalName: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  modalMeta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  modalStats: { flexDirection: 'row', gap: SPACING.md },
  modalStat: { alignItems: 'center' },
  modalStatValue: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.textPrimary },
  modalStatLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
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
