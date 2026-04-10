import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { getClosetItems } from '../services/closet';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];

export default function BuildOutfitScreen({ navigation }) {
  const { user } = useAuth();
  const [allItems, setAllItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getClosetItems(user.uid).then(data => {
      setAllItems(data);
      setLoading(false);
    });
  }, [user]);

  const items = category === 'All'
    ? allItems
    : allItems.filter(i => i.category === category);

  function toggleItem(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function handleNext() {
    if (selected.length === 0) { Alert.alert('Select at least one item'); return; }
    const selectedItems = allItems.filter(i => selected.includes(i.id));
    navigation.navigate('Post', { preselectedItems: selectedItems });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Build an Outfit</Text>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            Next {selected.length > 0 ? `(${selected.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category filter chips */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={c => c}
        contentContainerStyle={styles.catRow}
        style={{ flexGrow: 0, flexShrink: 0, marginBottom: SPACING.sm }}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.catChip, category === cat && styles.catChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        )}
      />

      {selected.length > 0 && (
        <View style={styles.selectedBar}>
          <Text style={styles.selectedText}>
            {selected.length} item{selected.length !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity onPress={() => setSelected([])}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {category === 'All' ? 'Your closet is empty.' : `No ${category} in your closet.`}
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddItem')}>
            <Text style={styles.addBtnText}>Add Items</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const isSelected = selected.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.imageURL }} style={styles.image} resizeMode="cover" />
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{item.category}{item.size ? ` · ${item.size}` : ''}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md },
  backText: { fontSize: FONT_SIZE.lg, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  nextBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  nextBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  catRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm, alignItems: 'center' },
  catChip: { paddingHorizontal: SPACING.md, paddingVertical: 7, height: 34, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center' },
  catChipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  catText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '500' },
  catTextActive: { color: COLORS.white, fontWeight: '700' },
  selectedBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, marginHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm },
  selectedText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.sm },
  clearText: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZE.sm, fontWeight: '600' },
  grid: { paddingHorizontal: SPACING.sm, paddingBottom: 100 },
  card: { flex: 1, margin: SPACING.xs, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: COLORS.surface },
  cardSelected: { borderColor: COLORS.primary },
  image: { width: '100%', height: 160 },
  checkBadge: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  checkText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
  cardInfo: { padding: SPACING.sm },
  itemName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textPrimary },
  itemMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: BORDER_RADIUS.full },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
});
