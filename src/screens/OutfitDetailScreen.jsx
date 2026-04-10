import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { rateOutfit, saveOutfit, deleteOutfit } from '../services/outfits';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

// ── Hanger icon ──────────────────────────────────────────────────────────────
function HangerIcon({ filled, size = 28 }) {
  const color = filled ? COLORS.primary : 'rgba(255,255,255,0.35)';
  const hw = size;
  return (
    <View style={{ width: hw, height: hw + 4, alignItems: 'center' }}>
      {/* Hook */}
      <View style={{
        width: hw * 0.38, height: hw * 0.24,
        borderRadius: hw * 0.19,
        borderWidth: 2.5, borderColor: color, borderBottomWidth: 0,
      }} />
      {/* Body triangle */}
      <View style={{
        marginTop: 1,
        width: 0, height: 0,
        borderLeftWidth: hw / 2, borderRightWidth: hw / 2,
        borderBottomWidth: hw * 0.56,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
      }} />
      {/* Bottom bar */}
      <View style={{ width: hw, height: 2.5, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

export default function OutfitDetailScreen({ route, navigation }) {
  const { outfit } = route.params;
  const { user } = useAuth();
  const [userRating, setUserRating] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saveMsg, setSaveMsg] = useState(false);
  const isOwner = user?.uid === outfit.userId;

  async function handleRate(value) {
    if (!user) return;
    try {
      await rateOutfit(outfit.id, user.uid, value);
      setUserRating(value);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete Outfit',
      'This will permanently remove this outfit. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteOutfit(outfit.id, user.uid);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete. Try again.');
            }
          },
        },
      ]
    );
  }

  async function handleSave() {
    if (!user || saved) return;
    try {
      await saveOutfit(user.uid, outfit.id);
      setSaved(true);
      setSaveMsg(true);
      setTimeout(() => setSaveMsg(false), 2000);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  // Bottom-up: [5,4,3,2,1] top→bottom; fill if value <= userRating
  const HANGERS = [5, 4, 3, 2, 1];

  return (
    <View style={styles.container}>
      <Image source={{ uri: outfit.imageURL }} style={styles.image} resizeMode="cover" />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>

      {isOwner && (
        <TouchableOpacity style={styles.menuBtn} onPress={handleDelete}>
          <Text style={styles.menuText}>🗑</Text>
        </TouchableOpacity>
      )}

      {/* Save toast */}
      {saveMsg && (
        <View style={styles.saveToast}>
          <Text style={styles.saveToastText}>✓ Outfit saved</Text>
        </View>
      )}

      {/* Hanger rating — bottom-up (5 top, 1 bottom) */}
      <View style={styles.hangerOverlay}>
        <Text style={styles.hangerLabel}>
          {userRating > 0 ? `${userRating}/5` : 'Rate'}
        </Text>
        {HANGERS.map(v => (
          <TouchableOpacity key={v} onPress={() => handleRate(v)} style={styles.hangerBtn} activeOpacity={0.7}>
            <HangerIcon filled={v <= userRating} size={26} />
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.outfitUser}>{outfit.displayName || 'User'}</Text>
            <Text style={styles.outfitMeta}>
              {outfit.items?.length ?? 0} pieces · {outfit.tags?.[0] ?? 'Mixed'}
            </Text>
          </View>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingPillText}>
              {(outfit.avgRating ?? 0).toFixed(1)} ★ · {outfit.ratingCount ?? 0}
            </Text>
          </View>
        </View>

        {outfit.caption ? (
          <Text style={styles.caption}>{outfit.caption}</Text>
        ) : null}

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

        {/* Delete above save (for owner) */}
        {isOwner && (
          <TouchableOpacity style={styles.deleteOutfitBtn} onPress={handleDelete}>
            <Text style={styles.deleteOutfitText}>🗑 Delete Outfit</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.saveOutfitBtn, saved && styles.saveOutfitBtnSaved]}
          onPress={handleSave}
        >
          <Text style={styles.saveOutfitText}>
            {saved ? '🔖 Saved' : '+ Save Outfit'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  image: { width: '100%', height: '62%' },
  backBtn: { position: 'absolute', top: 56, left: SPACING.md, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { color: COLORS.white, fontSize: 24, fontWeight: '300' },
  menuBtn: { position: 'absolute', top: 56, right: SPACING.md, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 16 },
  saveToast: { position: 'absolute', top: 104, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: SPACING.lg, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  saveToastText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  // Hangers — right side, bottom-up
  hangerOverlay: { position: 'absolute', right: SPACING.md, bottom: '40%', alignItems: 'center', gap: 6 },
  hangerLabel: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700', marginBottom: 2 },
  hangerBtn: { padding: 4 },
  // Sheet
  sheet: { flex: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, paddingHorizontal: SPACING.md },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md, marginBottom: SPACING.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  outfitUser: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  outfitMeta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  ratingPill: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  ratingPillText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '600' },
  caption: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, marginBottom: SPACING.md, lineHeight: 22 },
  itemsRow: { marginBottom: SPACING.md },
  itemCard: { width: 90, marginRight: SPACING.sm },
  itemImage: { width: 90, height: 90, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.surface },
  itemName: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 4, color: COLORS.textPrimary },
  itemCategory: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  deleteOutfitBtn: { borderWidth: 1, borderColor: COLORS.error, borderRadius: BORDER_RADIUS.md, paddingVertical: 12, alignItems: 'center', marginBottom: SPACING.sm },
  deleteOutfitText: { color: COLORS.error, fontSize: FONT_SIZE.md, fontWeight: '600' },
  saveOutfitBtn: { backgroundColor: COLORS.textPrimary, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, alignItems: 'center', marginBottom: SPACING.xl },
  saveOutfitBtnSaved: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  saveOutfitText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
});
