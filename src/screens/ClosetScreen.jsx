import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet,
  Modal, Alert, useWindowDimensions, ScrollView,
} from 'react-native';
import { getClosetItems, incrementWornCount, decrementWornCount, deleteClothingItem } from '../services/closet';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];
const SORTS = ['Newest', 'Most Worn', 'Least Worn', 'Price: High', 'Price: Low'];
const GAP = 10;

const GridCard = React.memo(function GridCard({ item, cardSize, onPress }) {
  const worn = item.wornCount ?? 0;
  return (
    <TouchableOpacity style={[styles.card, { width: cardSize, height: cardSize * 1.25 }]} onPress={() => onPress(item)} activeOpacity={0.88}>
      <Image source={{ uri: item.imageURL }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardOverlay}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        {worn > 0 && (
          <View style={styles.wornBadge}>
            <Text style={styles.wornBadgeText}>{worn}×</Text>
          </View>
        )}
      </View>
      {item.brand ? (
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText} numberOfLines={1}>{item.brand}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

export default function ClosetScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const cardSize = (width - SPACING.md * 2 - GAP) / 2;

  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('Newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getClosetItems(user.uid, category === 'All' ? undefined : category);
      setItems(data);
    } catch {}
    setLoading(false);
  }, [user, category]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const totalWears = items.reduce((sum, i) => sum + (i.wornCount ?? 0), 0);

  const sortedItems = useMemo(() => {
    const arr = [...items];
    switch (sort) {
      case 'Most Worn':   return arr.sort((a, b) => (b.wornCount ?? 0) - (a.wornCount ?? 0));
      case 'Least Worn':  return arr.sort((a, b) => (a.wornCount ?? 0) - (b.wornCount ?? 0));
      case 'Price: High': return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case 'Price: Low':  return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      default: return arr;
    }
  }, [items, sort]);

  async function handleIncrement() {
    if (!selectedItem) return;
    const item = selectedItem;
    const next = { ...item, wornCount: (item.wornCount ?? 0) + 1 };
    setSelectedItem(next);
    setItems(prev => prev.map(i => i.id === item.id ? next : i));
    try { await incrementWornCount(user.uid, item.id, item.price ?? 0, item.wornCount ?? 0); } catch {}
  }

  async function handleDecrement() {
    if (!selectedItem || (selectedItem.wornCount ?? 0) === 0) return;
    const item = selectedItem;
    const next = { ...item, wornCount: Math.max(0, (item.wornCount ?? 0) - 1) };
    setSelectedItem(next);
    setItems(prev => prev.map(i => i.id === item.id ? next : i));
    try { await decrementWornCount(user.uid, item.id, item.price ?? 0, item.wornCount ?? 0); } catch {}
  }

  function handleDelete(item) {
    Alert.alert('Delete Item', `Remove "${item.name}" from your closet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setSelectedItem(null);
          setItems(prev => prev.filter(i => i.id !== item.id));
          try { await deleteClothingItem(user.uid, item.id); }
          catch { setItems(prev => [...prev, item]); }
        },
      },
    ]);
  }

  function handleEditDone(updatedItem) {
    setItems(prev => prev.map(i => i.id === updatedItem.id ? { ...i, ...updatedItem } : i));
    setSelectedItem(prev => prev?.id === updatedItem.id ? { ...prev, ...updatedItem } : prev);
  }

  const renderCard = useCallback(({ item }) => (
    <GridCard item={item} cardSize={cardSize} onPress={setSelectedItem} />
  ), [cardSize]);

  const ListHeader = useMemo(() => (
    <View>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{items.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pieces</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalWears}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Wears</Text>
        </View>
        <TouchableOpacity
          style={[styles.statBox, styles.buildBox]}
          onPress={() => navigation.navigate('AvatarBuilder')}
        >
          <Text style={styles.buildIcon}>🧍</Text>
          <Text style={styles.buildLabel}>Build Outfit</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.catChip, { backgroundColor: colors.surface, borderColor: colors.border }, category === c && styles.catChipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.catText, { color: colors.textPrimary }, category === c && styles.catTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>{items.length} pieces</Text>
        <TouchableOpacity onPress={() => setShowSortMenu(s => !s)}>
          <Text style={[styles.sortBtn, { color: colors.textPrimary }]}>{sort} ▾</Text>
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
              <Text style={[styles.sortOptionText, { color: colors.textPrimary }, sort === s && { color: COLORS.primary, fontWeight: '700' }]}>{s}</Text>
              {sort === s && <Text style={{ color: COLORS.primary }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  ), [items.length, totalWears, category, sort, showSortMenu, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Closet</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate('AddItem')}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingGrid}>
          {[1, 2, 3, 4].map(k => (
            <View key={k} style={[styles.skeleton, { width: cardSize, height: cardSize * 1.25, backgroundColor: colors.surface }]} />
          ))}
        </View>
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={i => i.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
          removeClippedSubviews
          maxToRenderPerBatch={12}
          windowSize={7}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>👗</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your closet is empty</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add pieces to track cost-per-wear and build outfits.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddItem')}>
                <Text style={styles.emptyBtnText}>Add first piece</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Item detail modal */}
      <Modal visible={!!selectedItem} transparent animationType="slide" onRequestClose={() => setSelectedItem(null)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setSelectedItem(null)} />
        {selectedItem && (
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetBody}>
              <Image source={{ uri: selectedItem.imageURL }} style={styles.sheetImage} resizeMode="cover" />
              <View style={styles.sheetInfo}>
                <Text style={[styles.sheetName, { color: colors.textPrimary }]} numberOfLines={2}>{selectedItem.name}</Text>
                <Text style={[styles.sheetMeta, { color: colors.textSecondary }]}>
                  {selectedItem.category}{selectedItem.size ? ` · ${selectedItem.size}` : ''}{selectedItem.brand ? ` · ${selectedItem.brand}` : ''}
                </Text>

                {/* Stats */}
                <View style={styles.sheetStats}>
                  {selectedItem.price > 0 && (
                    <View style={[styles.sheetStat, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.sheetStatVal, { color: colors.textPrimary }]}>{selectedItem.currency ?? '$'}{selectedItem.price}</Text>
                      <Text style={[styles.sheetStatLbl, { color: colors.textSecondary }]}>Paid</Text>
                    </View>
                  )}
                  <View style={[styles.sheetStat, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sheetStatVal, { color: colors.textPrimary }]}>{selectedItem.wornCount ?? 0}×</Text>
                    <Text style={[styles.sheetStatLbl, { color: colors.textSecondary }]}>Worn</Text>
                  </View>
                  {selectedItem.price > 0 && (selectedItem.wornCount ?? 0) > 0 && (
                    <View style={[styles.sheetStat, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.sheetStatVal, { color: colors.textPrimary }]}>{selectedItem.currency ?? '$'}{(selectedItem.price / selectedItem.wornCount).toFixed(2)}</Text>
                      <Text style={[styles.sheetStatLbl, { color: colors.textSecondary }]}>/wear</Text>
                    </View>
                  )}
                </View>

                {/* Worn counter */}
                <View style={[styles.wornCounter, { backgroundColor: colors.surface }]}>
                  <TouchableOpacity style={styles.wornCounterBtn} onPress={handleDecrement}>
                    <Text style={[styles.wornCounterGlyph, (selectedItem.wornCount ?? 0) === 0 && { color: colors.border }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.wornCounterVal, { color: colors.textPrimary }]}>Mark worn</Text>
                  <TouchableOpacity style={styles.wornCounterBtn} onPress={handleIncrement}>
                    <Text style={styles.wornCounterGlyph}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetActionBtn, { backgroundColor: colors.surface }]}
                onPress={() => { setSelectedItem(null); navigation.navigate('EditItem', { item: selectedItem, onDone: handleEditDone }); }}
              >
                <Text style={[styles.sheetActionText, { color: colors.textPrimary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetActionBtn, styles.sheetDeleteBtn]}
                onPress={() => handleDelete(selectedItem)}
              >
                <Text style={[styles.sheetActionText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.sm },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, marginBottom: SPACING.md },
  statBox: { flex: 1, borderRadius: BORDER_RADIUS.md, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  buildBox: { backgroundColor: COLORS.primary + '18' },
  buildIcon: { fontSize: 20 },
  buildLabel: { fontSize: 10, fontWeight: '700', color: COLORS.primary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  catRow: { gap: SPACING.sm, paddingBottom: SPACING.md },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  catChipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  catText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  catTextActive: { color: '#fff', fontWeight: '700' },

  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  countText: { fontSize: FONT_SIZE.sm },
  sortBtn: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  sortMenu: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, overflow: 'hidden', marginBottom: SPACING.sm },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  sortOptionText: { fontSize: FONT_SIZE.md },

  row: { gap: GAP, marginBottom: GAP },
  card: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  cardImage: { width: '100%', height: '100%', position: 'absolute' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1, marginRight: 4 },
  wornBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  wornBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  brandBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  brandBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600', maxWidth: 80 },

  loadingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, padding: SPACING.md },
  skeleton: { borderRadius: 16 },

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: SPACING.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  emptyText: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  sheetBody: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.md },
  sheetImage: { width: 120, height: 150, borderRadius: 14 },
  sheetInfo: { flex: 1 },
  sheetName: { fontSize: FONT_SIZE.lg, fontWeight: '800', marginBottom: 4 },
  sheetMeta: { fontSize: FONT_SIZE.xs, marginBottom: SPACING.sm },
  sheetStats: { flexDirection: 'row', gap: 8, marginBottom: SPACING.sm },
  sheetStat: { flex: 1, borderRadius: BORDER_RADIUS.sm, paddingVertical: 8, alignItems: 'center' },
  sheetStatVal: { fontSize: FONT_SIZE.sm, fontWeight: '800' },
  sheetStatLbl: { fontSize: 10, marginTop: 1 },
  wornCounter: { flexDirection: 'row', alignItems: 'center', borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  wornCounterBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  wornCounterGlyph: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  wornCounterVal: { flex: 1, textAlign: 'center', fontSize: FONT_SIZE.sm, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  sheetActionBtn: { flex: 1, paddingVertical: 14, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  sheetDeleteBtn: { backgroundColor: '#FEE2E2' },
  sheetActionText: { fontWeight: '700', fontSize: FONT_SIZE.sm },
});
