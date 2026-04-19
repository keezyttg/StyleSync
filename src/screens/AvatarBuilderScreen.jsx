import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, Platform, Image, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { G, Path, Rect, Circle, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';
import { getClosetItems } from '../services/closet';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { ACCESSORY_PLACEMENTS, getAccessoryPlacement } from '../constants/accessoryPlacement';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const { width: SW } = Dimensions.get('window');
const AVATAR_W = SW * 0.55;
const AVATAR_H = AVATAR_W * (600 / 360);
const SX = AVATAR_W / 360; // scale x
const SY = AVATAR_H / 600; // scale y

// Where each category's photo gets placed on the avatar (SVG coordinate space)
const SLOT_BOUNDS = {
  Tops:        { x: 96,  y: 186, w: 168, h: 162 },
  Bottoms:     { x: 130, y: 344, w: 100, h: 192 },
  Outerwear:   { x: 86,  y: 180, w: 188, h: 215 },
  Shoes:       { x: 118, y: 506, w: 124, h: 52  },
  Accessories: { x: 208, y: 190, w: 80,  h: 100 },
};

const ACCESSORY_SLOT_BOUNDS = {
  default: { x: 208, y: 190, w: 80, h: 100 },
  head:    { x: 120, y: 64,  w: 120, h: 74  },
  neck:    { x: 136, y: 162, w: 88,  h: 42  },
  wrist:   { x: 86,  y: 260, w: 56,  h: 54  },
  ankle:   { x: 194, y: 490, w: 60,  h: 38  },
};

const SKIN_TONES = [
  { id: 'almond',    label: 'Almond',    swatch: '#e7b28d', colors: { head: '#e7b28d', neck: '#dfaa84', torso: '#e7b28d', arms: '#e7b28d', legs: '#d89c73' } },
  { id: 'porcelain', label: 'Porcelain', swatch: '#f2d2bf', colors: { head: '#f2d2bf', neck: '#e9c5b0', torso: '#f2d2bf', arms: '#f2d2bf', legs: '#ddb39c' } },
  { id: 'bronze',    label: 'Bronze',    swatch: '#bf825d', colors: { head: '#bf825d', neck: '#b47652', torso: '#bf825d', arms: '#bf825d', legs: '#a96746' } },
  { id: 'deep',      label: 'Deep',      swatch: '#7b4a34', colors: { head: '#7b4a34', neck: '#6d412d', torso: '#7b4a34', arms: '#7b4a34', legs: '#633724' } },
];
const DEFAULT_SKIN_ID = SKIN_TONES[0].id;

const CLOSET_CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];
const TABS = ['Skin', ...CLOSET_CATEGORIES];
const SORT_OPTIONS = ['Newest', 'Most Worn', 'Least Worn', 'Oldest'];

// Base avatar — skin + hair only, no SVG clothing layers
function BaseAvatar({ skinId }) {
  const skin = SKIN_TONES.find(s => s.id === skinId)?.colors ?? SKIN_TONES[0].colors;
  return (
    <Svg width={AVATAR_W} height={AVATAR_H} viewBox="0 0 360 600">
      <Defs>
        <LinearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="#d9efff" stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      <Rect x="48" y="36" width="264" height="528" rx="44" fill="url(#bg)" />
      <Ellipse cx="180" cy="545" rx="96" ry="18" fill="#9bc4f1" opacity="0.2" />

      {/* Hair */}
      <Path d="M122 112C122 76 148 54 182 54C216 54 240 76 240 112V136H122V112Z" fill="#3a2a23" />
      <Path d="M124 122C124 84 149 66 182 66C213 66 238 83 238 122C238 137 232 153 221 166H141C130 153 124 137 124 122Z" fill="#4c372d" />

      {/* Skin */}
      <Circle cx="180" cy="128" r="48" fill={skin.head} />
      <Rect x="162" y="168" width="36" height="36" rx="12" fill={skin.neck} />
      <Rect x="102" y="214" width="34" height="166" rx="17" fill={skin.arms} />
      <Rect x="224" y="214" width="34" height="166" rx="17" fill={skin.arms} />
      <Path d="M133 198C144 188 159 182 180 182C201 182 216 188 227 198L240 330C240 347 226 361 209 361H151C134 361 120 347 120 330L133 198Z" fill={skin.torso} />
      <Rect x="145" y="356" width="30" height="170" rx="15" fill={skin.legs} />
      <Rect x="185" y="356" width="30" height="170" rx="15" fill={skin.legs} />
    </Svg>
  );
}

// Photo overlay for one clothing slot
function SlotOverlay({ category, item, onPress, isActive }) {
  const b = SLOT_BOUNDS[category];
  if (!b) return null;

  const left   = b.x * SX;
  const top    = b.y * SY;
  const width  = b.w * SX;
  const height = b.h * SY;

  if (!item) {
    if (!isActive) return null;
    return (
      <TouchableOpacity
        style={[styles.slotEmpty, { left, top, width, height }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.slotEmptyIcon}>+</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.slotFilled, { left, top, width, height }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.imageURL }}
        style={styles.slotImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

function AccessoryOverlay({ placement = 'default', item, onPress, showEmpty = false, label = '' }) {
  const b = ACCESSORY_SLOT_BOUNDS[placement] ?? ACCESSORY_SLOT_BOUNDS.default;
  const left = b.x * SX;
  const top = b.y * SY;
  const width = b.w * SX;
  const height = b.h * SY;

  if (!item) {
    if (!showEmpty) return null;
    return (
      <TouchableOpacity
        style={[styles.slotEmpty, { left, top, width, height }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.slotEmptyIcon}>+</Text>
        <Text style={styles.slotEmptyLabel}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.slotFilled, { left, top, width, height }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.imageURL }} style={styles.slotImage} resizeMode="contain" />
    </TouchableOpacity>
  );
}

export default function AvatarBuilderScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const skinToneKey = user?.uid ? `fashiq_avatar_skin_tone_${user.uid}` : null;

  const [loading, setLoading] = useState(true);
  const [closetByCategory, setClosetByCategory] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [skinId, setSkinId] = useState(DEFAULT_SKIN_ID);
  const [activeTab, setActiveTab] = useState('Tops');
  const [sort, setSort] = useState('Newest');

  useEffect(() => {
    if (!user) return;
    getClosetItems(user.uid)
      .then(items => {
        const grouped = {};
        CLOSET_CATEGORIES.forEach(cat => { grouped[cat] = []; });
        items.forEach(item => {
          if (grouped[item.category]) grouped[item.category].push(item);
        });
        setClosetByCategory(grouped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!skinToneKey) {
      setSkinId(DEFAULT_SKIN_ID);
      return;
    }
    AsyncStorage.getItem(skinToneKey)
      .then(savedSkinId => {
        setSkinId(
          SKIN_TONES.some(tone => tone.id === savedSkinId) ? savedSkinId : DEFAULT_SKIN_ID
        );
      })
      .catch(() => setSkinId(DEFAULT_SKIN_ID));
  }, [skinToneKey]);

  function handleSelectSkin(nextSkinId) {
    setSkinId(nextSkinId);
    if (skinToneKey) {
      AsyncStorage.setItem(skinToneKey, nextSkinId).catch(() => {});
    }
  }

  function selectItem(category, item) {
    if (category === 'Accessories') {
      setSelectedItems(prev => {
        const current = prev.Accessories ?? [];
        const itemPlacement = getAccessoryPlacement(item);
        const exists = current.some(i => i.id === item.id);
        return {
          ...prev,
          Accessories: exists
            ? current.filter(i => i.id !== item.id)
            : [...current.filter(i => getAccessoryPlacement(i) !== itemPlacement), item],
        };
      });
    } else {
      setSelectedItems(prev => ({ ...prev, [category]: item }));
    }
  }

  function clearItem(category) {
    if (category === 'Accessories') {
      setSelectedItems(prev => ({ ...prev, Accessories: [] }));
    } else {
      setSelectedItems(prev => { const n = { ...prev }; delete n[category]; return n; });
    }
  }

  function randomize() {
    const newSelected = {};
    CLOSET_CATEGORIES.forEach(cat => {
      const items = closetByCategory[cat] ?? [];
      if (cat === 'Accessories') {
        // 50% chance to include accessories; keep at most one accessory per placement.
        if (items.length > 0 && Math.random() > 0.5) {
          const shuffled = [...items].sort(() => Math.random() - 0.5);
          const byPlacement = new Map();
          shuffled.forEach(item => {
            const placement = getAccessoryPlacement(item);
            if (!byPlacement.has(placement)) byPlacement.set(placement, item);
          });
          const uniqueChoices = [...byPlacement.values()];
          const maxAccessories = Math.min(uniqueChoices.length, 3);
          const count = maxAccessories > 0 ? Math.ceil(Math.random() * maxAccessories) : 0;
          newSelected[cat] = uniqueChoices.slice(0, count);
        } else {
          newSelected[cat] = [];
        }
      } else if (items.length > 0) {
        newSelected[cat] = items[Math.floor(Math.random() * items.length)];
      }
    });
    setSelectedItems(newSelected);
  }

  const currentItems = (() => {
    if (activeTab === 'Skin') return [];
    const raw = [...(closetByCategory[activeTab] ?? [])];
    switch (sort) {
      case 'Most Worn':  return raw.sort((a, b) => (b.wornCount ?? 0) - (a.wornCount ?? 0));
      case 'Least Worn': return raw.sort((a, b) => (a.wornCount ?? 0) - (b.wornCount ?? 0));
      case 'Oldest':     return raw.sort((a, b) => (a.addedAt?.seconds ?? 0) - (b.addedAt?.seconds ?? 0));
      default:           return raw.sort((a, b) => (b.addedAt?.seconds ?? 0) - (a.addedAt?.seconds ?? 0));
    }
  })();

  const selectedAccessories = selectedItems.Accessories ?? [];
  const missingAccessoryPlacements = ACCESSORY_PLACEMENTS.filter(
    placement => !selectedAccessories.some(item => getAccessoryPlacement(item) === placement.id)
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backText, { color: colors.textPrimary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Build Outfit</Text>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => {
            const items = Object.entries(selectedItems).flatMap(([cat, val]) =>
              cat === 'Accessories' ? (Array.isArray(val) ? val : []) : (val ? [val] : [])
            );
            if (items.length === 0) { Alert.alert('Select at least one item'); return; }
            navigation.navigate('Post', { preselectedItems: items });
          }}
        >
          <Text style={styles.nextBtnText}>
            {(() => {
              const count = Object.entries(selectedItems).reduce((sum, [cat, val]) =>
                sum + (cat === 'Accessories' ? (Array.isArray(val) ? val.length : 0) : (val ? 1 : 0)), 0);
              return count > 0 ? `Next (${count})` : 'Next';
            })()}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar stage */}
        <View style={[styles.avatarStage, { backgroundColor: isDark ? colors.card : '#f5f5f3' }]}>
          {loading ? (
            <View style={{ width: AVATAR_W, height: AVATAR_H, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
          ) : (
            <View style={{ width: AVATAR_W, height: AVATAR_H }}>
              <BaseAvatar skinId={skinId} />
              {/* Photo overlays — clothing items use fixed slots; accessories use placement tags. */}
              {CLOSET_CATEGORIES.filter(cat => cat !== 'Accessories').map(cat => (
                <SlotOverlay
                  key={cat}
                  category={cat}
                  item={selectedItems[cat] ?? null}
                  onPress={() => setActiveTab(cat)}
                  isActive={activeTab === cat}
                />
              ))}
              {selectedAccessories.map(item => (
                <AccessoryOverlay
                  key={item.id}
                  placement={getAccessoryPlacement(item)}
                  item={item}
                  onPress={() => setActiveTab('Accessories')}
                />
              ))}
              {activeTab === 'Accessories' && missingAccessoryPlacements.map(placement => (
                <AccessoryOverlay
                  key={`empty-${placement.id}`}
                  placement={placement.id}
                  onPress={() => setActiveTab('Accessories')}
                  showEmpty
                  label={placement.label}
                />
              ))}
            </View>
          )}

          {/* Selected item strip below avatar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedStrip} contentContainerStyle={styles.selectedStripContent}>
            {CLOSET_CATEGORIES.map(cat => {
              const isAcc = cat === 'Accessories';
              const accItems = isAcc ? (selectedItems.Accessories ?? []) : [];
              const item = isAcc ? (accItems[0] ?? null) : (selectedItems[cat] ?? null);
              const hasItem = isAcc ? accItems.length > 0 : !!item;
              return (
                <View key={cat} style={[styles.stripSlot, { borderColor: hasItem ? COLORS.primary : colors.border, backgroundColor: colors.surface }]}>
                  {hasItem ? (
                    <>
                      <Image source={{ uri: item.imageURL }} style={styles.stripThumb} />
                      {isAcc && accItems.length > 1 && (
                        <View style={styles.accCountBadge}>
                          <Text style={styles.accCountText}>+{accItems.length - 1}</Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.stripClear} onPress={() => clearItem(cat)}>
                        <Text style={styles.stripClearText}>✕</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.stripEmpty} onPress={() => setActiveTab(cat)}>
                      <Text style={[styles.stripEmptyPlus, { color: colors.border }]}>+</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
          {TABS.map(tab => {
            const active = activeTab === tab;
            const count = tab === 'Skin' ? null : (closetByCategory[tab]?.length ?? 0);
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, { backgroundColor: active ? COLORS.primary : colors.surface, borderColor: active ? COLORS.primary : colors.border }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, { color: active ? COLORS.white : colors.textSecondary }]}>{tab}</Text>
                {count !== null && count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: active ? 'rgba(255,255,255,0.3)' : COLORS.primary + '22' }]}>
                    <Text style={[styles.tabBadgeText, { color: active ? COLORS.white : COLORS.primary }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort chips — shown only when viewing a clothing category */}
        {activeTab !== 'Skin' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow} style={styles.sortScroll}>
              {SORT_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sortChip, { borderColor: colors.border, backgroundColor: colors.surface }, sort === s && styles.sortChipActive]}
                  onPress={() => setSort(s)}
                >
                  <Text style={[styles.sortChipText, { color: colors.textSecondary }, sort === s && styles.sortChipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={randomize} style={styles.randomizeRow}>
              <Text style={styles.randomizeRowText}>🎲 Randomize Outfit</Text>
            </TouchableOpacity>
            {activeTab === 'Accessories' && (
              <Text style={[styles.accessoryHint, { color: colors.textSecondary }]}>
                Accessories use Head, Neck, Wrist, and Ankle placement tags from Add or Edit Item.
              </Text>
            )}
          </>
        )}

        {/* Skin tone picker */}
        {activeTab === 'Skin' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
            {SKIN_TONES.map(tone => (
              <TouchableOpacity
                key={tone.id}
                style={[styles.skinChip, { borderColor: skinId === tone.id ? COLORS.primary : colors.border, backgroundColor: colors.card }]}
                onPress={() => handleSelectSkin(tone.id)}
              >
                <View style={[styles.skinSwatch, { backgroundColor: tone.swatch }]} />
                <Text style={[styles.skinLabel, { color: skinId === tone.id ? COLORS.primary : colors.textSecondary }]}>{tone.label}</Text>
                {skinId === tone.id && <View style={styles.activeDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Closet item picker */}
        {activeTab !== 'Skin' && (
          currentItems.length === 0 ? (
            <View style={styles.emptyPicker}>
              <Text style={[styles.emptyPickerText, { color: colors.textSecondary }]}>No {activeTab} in your closet yet</Text>
              <TouchableOpacity style={styles.addItemsBtn} onPress={() => navigation.navigate('AddItem')}>
                <Text style={styles.addItemsBtnText}>+ Add Items</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {currentItems.map(item => {
                const isSelected = activeTab === 'Accessories'
                  ? (selectedItems.Accessories ?? []).some(i => i.id === item.id)
                  : selectedItems[activeTab]?.id === item.id;
                const accessoryPlacement = activeTab === 'Accessories' ? getAccessoryPlacement(item) : null;
                const placementLabel = accessoryPlacement && accessoryPlacement !== 'default'
                  ? ACCESSORY_PLACEMENTS.find(placement => placement.id === accessoryPlacement)?.label ?? null
                  : null;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemChip, { backgroundColor: colors.card, borderColor: isSelected ? COLORS.primary : colors.border }]}
                    onPress={() => selectItem(activeTab, item)}
                    activeOpacity={0.75}
                  >
                    <Image source={{ uri: item.imageURL }} style={styles.itemThumb} resizeMode="cover" />
                    {activeTab === 'Accessories' && (
                      <View style={[styles.itemPlacementBadge, accessoryPlacement === 'default' && styles.itemPlacementBadgeMissing]}>
                        <Text style={styles.itemPlacementBadgeText}>{placementLabel ?? 'Tag needed'}</Text>
                      </View>
                    )}
                    <Text style={[styles.itemLabel, { color: isSelected ? COLORS.primary : colors.textPrimary }]} numberOfLines={2}>{item.name}</Text>
                    {isSelected && (
                      <View style={styles.itemCheck}>
                        <Text style={styles.itemCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: SPACING.md, borderBottomWidth: 1,
  },
  backText: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  nextBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: BORDER_RADIUS.full },
  nextBtnText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },

  avatarStage: {
    alignItems: 'center', marginHorizontal: SPACING.md,
    marginTop: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    paddingTop: SPACING.md, paddingBottom: SPACING.sm, overflow: 'hidden',
  },

  // Photo slots on the avatar
  slotEmpty: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '80',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '12',
  },
  slotEmptyIcon: { fontSize: 22, color: COLORS.primary, lineHeight: 26, fontWeight: '300' },
  slotEmptyLabel: { fontSize: 9, color: COLORS.primary, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },

  slotFilled: {
    position: 'absolute',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: 'transparent',
  },
  slotImage: { width: '100%', height: '100%' },

  selectedStrip: { flexGrow: 0, marginTop: SPACING.sm },
  selectedStripContent: { paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.sm },
  stripSlot: { width: 62, height: 62, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, overflow: 'hidden' },
  stripThumb: { width: '100%', height: '100%' },
  accCountBadge: { position: 'absolute', bottom: 2, left: 2, backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
  accCountText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  stripClear: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  stripClearText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  stripEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stripEmptyCat: { fontSize: 8, fontWeight: '800' },
  stripEmptyPlus: { fontSize: 16, fontWeight: '300' },

  tabScroll: { flexGrow: 0, marginTop: SPACING.md },
  tabRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  tabText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 },
  tabBadgeText: { fontSize: 10, fontWeight: '800' },

  sortScroll: { flexGrow: 0, marginTop: SPACING.sm },
  sortRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xs, alignItems: 'center' },
  randomizeRow: { alignSelf: 'center', marginTop: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.primary + '15', borderWidth: 1, borderColor: COLORS.primary + '40' },
  randomizeRowText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },
  accessoryHint: { fontSize: FONT_SIZE.xs, textAlign: 'center', marginTop: SPACING.sm, paddingHorizontal: SPACING.lg },
  sortChip: { paddingHorizontal: SPACING.md, paddingVertical: 5, height: 28, borderRadius: BORDER_RADIUS.full, borderWidth: 1, justifyContent: 'center' },
  sortChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sortChipText: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
  sortChipTextActive: { color: COLORS.white, fontWeight: '700' },

  pickerRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.sm },

  skinChip: { alignItems: 'center', padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 2, width: 80, gap: 6 },
  skinSwatch: { width: 44, height: 44, borderRadius: 22 },
  skinLabel: { fontSize: 11, fontWeight: '600' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },

  itemChip: { width: 90, borderRadius: BORDER_RADIUS.md, borderWidth: 2, overflow: 'hidden' },
  itemThumb: { width: '100%', height: 90 },
  itemPlacementBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, zIndex: 1 },
  itemPlacementBadgeMissing: { backgroundColor: 'rgba(220,38,38,0.88)' },
  itemPlacementBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  itemLabel: { fontSize: 10, fontWeight: '600', padding: 5, textAlign: 'center' },
  itemCheck: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  itemCheckText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },

  emptyPicker: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.md },
  emptyPickerText: { fontSize: FONT_SIZE.md },
  addItemsBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: 10, borderRadius: BORDER_RADIUS.full },
  addItemsBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
});
