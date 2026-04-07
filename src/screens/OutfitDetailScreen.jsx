import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { rateOutfit, saveOutfit } from '../services/outfits';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export default function OutfitDetailScreen({ route, navigation }) {
  const { outfit } = route.params;
  const { user } = useAuth();
  const [userRating, setUserRating] = useState(0);
  const [saved, setSaved] = useState(false);

  async function handleRate(value) {
    if (!user) return;
    try {
      await rateOutfit(outfit.id, user.uid, value);
      setUserRating(value);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleSave() {
    if (!user || saved) return;
    try {
      await saveOutfit(user.uid, outfit.id);
      setSaved(true);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: outfit.imageURL }} style={styles.image} resizeMode="cover" />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>

      <View style={styles.starOverlay}>
        {[1, 2, 3, 4, 5].map(i => (
          <TouchableOpacity key={i} onPress={() => handleRate(i)} style={styles.starBtn}>
            <Text style={[styles.starIcon, i <= userRating && styles.starFilled]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.outfitLabel}>Outfit</Text>
            <Text style={styles.outfitMeta}>
              {outfit.items?.length ?? 0} pieces · {outfit.tags?.[0] ?? 'Mixed'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveIcon}>{saved ? '🔖' : '🔖'}</Text>
          </TouchableOpacity>
        </View>

        {outfit.items && outfit.items.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsRow}>
            {outfit.items.map((item, idx) => (
              <View key={idx} style={styles.itemCard}>
                <Image source={{ uri: item.imageURL }} style={styles.itemImage} />
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.saveOutfitBtn} onPress={handleSave}>
          <Text style={styles.saveOutfitText}>+ Save Outfit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  image: { width: '100%', height: '65%' },
  backBtn: { position: 'absolute', top: 56, left: SPACING.md, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { color: COLORS.white, fontSize: 24, fontWeight: '300' },
  starOverlay: { position: 'absolute', right: SPACING.md, top: '25%', gap: SPACING.sm },
  starBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  starIcon: { fontSize: 22, color: 'rgba(255,255,255,0.5)' },
  starFilled: { color: COLORS.star },
  sheet: { flex: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, paddingHorizontal: SPACING.md },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md, marginBottom: SPACING.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  outfitLabel: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  outfitMeta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  saveBtn: { padding: SPACING.sm },
  saveIcon: { fontSize: 22 },
  itemsRow: { marginBottom: SPACING.md },
  itemCard: { width: 90, marginRight: SPACING.sm },
  itemImage: { width: 90, height: 90, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.surface },
  itemName: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 4, color: COLORS.textPrimary },
  itemCategory: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  saveOutfitBtn: { backgroundColor: COLORS.textPrimary, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, alignItems: 'center', marginBottom: SPACING.xl },
  saveOutfitText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
});
