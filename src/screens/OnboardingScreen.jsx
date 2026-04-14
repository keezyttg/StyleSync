import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useWindowDimensions, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export const ONBOARDING_KEY = 'stylesync_onboarding_done';

const AESTHETICS = [
  { id: 'Streetwear',      emoji: '🧢' },
  { id: 'Minimalist',      emoji: '⬜' },
  { id: 'Formal',          emoji: '👔' },
  { id: 'Vintage',         emoji: '🕶' },
  { id: 'Summer',          emoji: '☀️' },
  { id: 'Y2K',             emoji: '💿' },
  { id: 'Athleisure',      emoji: '🏃' },
  { id: 'Casual',          emoji: '👕' },
  { id: 'Bohemian',        emoji: '🌸' },
  { id: 'Luxury',          emoji: '💎' },
  { id: 'Grunge',          emoji: '🎸' },
  { id: 'Preppy',          emoji: '🎓' },
];

export default function OnboardingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const scrollRef = useRef(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());

  function goTo(p) {
    setPage(p);
    scrollRef.current?.scrollTo({ x: p * width, animated: true });
  }

  function toggleAesthetic(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    if (user && selected.size > 0) {
      updateDoc(doc(db, 'users', user.uid), {
        stylePreferences: [...selected],
      }).catch(() => {});
    }
    navigation.replace('Main');
  }

  // ── Dot indicator ────────────────────────────────────────────────────────
  function Dots() {
    return (
      <View style={styles.dots}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >

        {/* ── PAGE 1: Welcome ─────────────────────────────────────────────── */}
        <View style={[styles.page, { width }]}>
          <View style={styles.logoRow}>
            <Text style={styles.logoBlack}>Style</Text>
            <Text style={styles.logoMagenta}>Sync</Text>
          </View>
          <Text style={styles.welcomeEmoji}>👗</Text>
          <Text style={styles.h1}>Your wardrobe,{'\n'}elevated.</Text>
          <Text style={styles.sub}>
            Track every piece, build outfits, share your style, and discover what the world is wearing.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => goTo(1)}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* ── PAGE 2: Style picker ────────────────────────────────────────── */}
        <View style={[styles.page, { width }]}>
          <Text style={styles.h1}>What's your{'\n'}aesthetic?</Text>
          <Text style={styles.sub}>Pick everything that fits. We'll personalise your Explore feed.</Text>

          <View style={styles.aestheticGrid}>
            {AESTHETICS.map(a => {
              const on = selected.has(a.id);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.aestheticChip, on && styles.aestheticChipOn]}
                  onPress={() => toggleAesthetic(a.id)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.aestheticEmoji}>{a.emoji}</Text>
                  <Text style={[styles.aestheticLabel, on && styles.aestheticLabelOn]}>{a.id}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: SPACING.lg }]}
            onPress={() => goTo(2)}
          >
            <Text style={styles.primaryBtnText}>
              {selected.size > 0 ? `Continue (${selected.size} selected)` : 'Continue'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* ── PAGE 3: Ready ───────────────────────────────────────────────── */}
        <View style={[styles.page, { width }]}>
          <Text style={styles.readyEmoji}>✨</Text>
          <Text style={styles.h1}>You're all set.</Text>
          <Text style={styles.sub}>
            {selected.size > 0
              ? `Your Explore feed will be tailored to ${[...selected].slice(0, 3).join(', ')}${selected.size > 3 ? ` +${selected.size - 3} more` : ''}.`
              : 'Explore trending outfits and start building your closet.'}
          </Text>

          <View style={styles.featureList}>
            {[
              ['👗', 'Add clothes to your closet'],
              ['⊞',  'Build and post outfits'],
              ['🔍', 'Discover styles & people'],
              ['★',  'Rate outfits & get rated'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{icon}</Text>
                <Text style={styles.featureLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: SPACING.xl }]} onPress={finish}>
            <Text style={styles.primaryBtnText}>Explore StyleSync</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Dots />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  page: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoRow: { flexDirection: 'row', marginBottom: SPACING.xl },
  logoBlack: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary },
  logoMagenta: { fontSize: 28, fontStyle: 'italic', color: COLORS.primary },
  welcomeEmoji: { fontSize: 72, marginBottom: SPACING.lg },
  readyEmoji: { fontSize: 72, marginBottom: SPACING.lg },
  h1: { fontSize: 34, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center', lineHeight: 42, marginBottom: SPACING.md },
  sub: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.lg },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: FONT_SIZE.lg },
  skipBtn: { marginTop: SPACING.md, padding: SPACING.sm },
  skipText: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm },
  // Aesthetic grid
  aestheticGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: SPACING.sm, width: '100%',
  },
  aestheticChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  aestheticChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  aestheticEmoji: { fontSize: 16 },
  aestheticLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textPrimary },
  aestheticLabelOn: { color: '#fff' },
  // Feature list
  featureList: { width: '100%', gap: SPACING.md, marginTop: SPACING.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  featureIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  featureLabel: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, fontWeight: '500' },
  // Dots
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
});
