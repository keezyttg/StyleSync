import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getClosetItems } from '../services/closet';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];

export default function ClosetScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getClosetItems(user.uid, category === 'All' ? undefined : category);
      setItems(data);
    } catch (err) {
      console.log('Closet load error:', err);
    }
    setLoading(false);
  }, [user, category]);

  useEffect(() => { load(); }, [load]);

  function ItemCard({ item }) {
    return (
      <TouchableOpacity style={styles.itemCard} activeOpacity={0.85}>
        <Image source={{ uri: item.imageURL }} style={styles.itemImage} resizeMode="cover" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemMeta}>{item.category}{item.size ? ` · ${item.size}` : ''}</Text>
          {item.tags?.length > 0 && (
            <View style={styles.tagChip}>
              <Text style={styles.tagText}>{item.tags[0]}</Text>
            </View>
          )}
        </View>
        <Text style={styles.wornBadge}>Worn {item.wornCount}x</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Closet</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddItem')}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {[
          { value: items.length, label: 'Pieces' },
          { value: '4.2', label: 'Avg Rating' },
          { value: '8', label: 'Outfits' },
        ].map((stat, i) => (
          <View key={i} style={styles.statBox}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
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

      <TouchableOpacity style={styles.buildBanner} onPress={() => navigation.navigate('BuildOutfit')}>
        <Text style={styles.buildIcon}>⊞</Text>
        <View>
          <Text style={styles.buildTitle}>Build an outfit</Text>
          <Text style={styles.buildSub}>Mix pieces from your closet & post</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.listHeader}>
        <Text style={styles.pieceCount}>{items.length} pieces</Text>
        <TouchableOpacity>
          <Text style={styles.sortText}>Most Worn ▾</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ItemCard item={item} />}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Your closet is empty. Add your first item!</Text>}
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
  itemInfo: { flex: 1, padding: SPACING.sm },
  itemName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textPrimary },
  itemMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  tagChip: { marginTop: SPACING.xs, alignSelf: 'flex-start', backgroundColor: COLORS.textPrimary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.sm },
  tagText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  wornBadge: { position: 'absolute', bottom: SPACING.sm, right: SPACING.sm, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 60, fontSize: FONT_SIZE.md },
});
