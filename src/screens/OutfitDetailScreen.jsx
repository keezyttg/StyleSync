import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, Share, Linking } from 'react-native';
import { rateOutfit, saveOutfit, isSaved, deleteOutfit, reportOutfit, getUserRating } from '../services/outfits';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { getUserPushToken, sendPushNotification, saveNotification } from '../services/notifications';
import Svg, { Path, Line } from 'react-native-svg';
import GeminiHangerIcon from '../components/GeminiHangerIcon';
import VerifiedBadge, { isUserVerified } from '../components/VerifiedBadge';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

function ShareIcon({ size = 18, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 9L12 5L16 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="5" x2="12" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M4 15V20H20V15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlagIcon({ size = 18, color = '#ef4444' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="5" y1="2" x2="5" y2="22" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M5 4H18L14 10L18 16H5V4Z" fill={color} />
    </Svg>
  );
}

export default function OutfitDetailScreen({ route, navigation }) {
  const { outfit } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const [userRating, setUserRating] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saveMsg, setSaveMsg] = useState(false);
  const [authorVerified, setAuthorVerified] = useState(outfit.userVerified ?? false);
  const isOwner = user?.uid === outfit.userId;

  useEffect(() => {
    if (user && outfit.id) {
      isSaved(user.uid, outfit.id).then(setSaved).catch(() => {});
      getUserRating(outfit.id, user.uid).then(setUserRating).catch(() => {});
    }
    if (outfit.userId && outfit.userVerified === undefined) {
      import('../services/auth').then(({ getUserProfile }) =>
        getUserProfile(outfit.userId).then(p => setAuthorVerified(isUserVerified(p))).catch(() => {})
      );
    }
  }, [user, outfit.id, outfit.userId]);

  async function handleRate(value) {
    if (!user) return;
    try {
      const isFirstRating = userRating === 0;
      await rateOutfit(outfit.id, user.uid, value);
      setUserRating(value);
      // Notify outfit owner only on first-ever rating (not re-rates)
      if (isFirstRating && outfit.userId && outfit.userId !== user.uid) {
        const token = await getUserPushToken(outfit.userId);
        const raterName = user.displayName || 'Someone';
        sendPushNotification(token, 'New Rating', `${raterName} rated your outfit ${value}/5`);
        saveNotification(outfit.userId, {
          type: 'rating',
          fromUid: user.uid,
          fromName: raterName,
          fromPhoto: user.photoURL ?? null,
          message: `${raterName} rated your outfit ${value}/5`,
          outfitId: outfit.id,
          outfitImage: outfit.imageURL ?? null,
        });
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  function handleReport() {
    const REASONS = ['Spam', 'Inappropriate content', 'Harassment', 'Other'];
    Alert.alert(
      'Report Post',
      'Why are you reporting this?',
      [
        ...REASONS.map(reason => ({
          text: reason,
          onPress: async () => {
            try {
              await reportOutfit(outfit.id, user.uid, outfit.userId, reason);
              Alert.alert('Report submitted', "Thanks for letting us know. We'll review this post.");
            } catch {
              Alert.alert('Error', 'Could not submit report. Please try again.');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  async function handleShare() {
    const poster = outfit.username || outfit.displayName || 'someone';
    try {
      await Share.share({
        title: 'StyleSync Outfit',
        message: `Check out this outfit by @${poster} on StyleSync\n${outfit.imageURL}`,
        url: outfit.imageURL,
      });
    } catch (err) {
      if (err.message !== 'The user did not share') {
        Alert.alert('Error', err.message);
      }
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
      await saveOutfit(user.uid, outfit.id, outfit.userId);
      setSaved(true);
      setSaveMsg(true);
      setTimeout(() => setSaveMsg(false), 2000);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  const HANGERS = [5, 4, 3, 2, 1];

  const MAJOR_BRANDS = {
    nike: 'https://www.nike.com/search?q=',
    adidas: 'https://www.adidas.com/us/search?q=',
    zara: 'https://www.zara.com/us/en/search?searchTerm=',
    'h&m': 'https://www2.hm.com/en_us/search-results.html?q=',
    hm: 'https://www2.hm.com/en_us/search-results.html?q=',
    gucci: 'https://www.gucci.com/us/en/search?q=',
    prada: 'https://www.prada.com/us/en/search.html?q=',
    supreme: 'https://www.supremenewyork.com/search#',
    uniqlo: 'https://www.uniqlo.com/us/en/search?q=',
    'new balance': 'https://www.newbalance.com/search?q=',
    newbalance: 'https://www.newbalance.com/search?q=',
    "levi's": 'https://www.levi.com/US/en_US/search?q=',
    levis: 'https://www.levi.com/US/en_US/search?q=',
    gap: 'https://www.gap.com/browse/search.do?searchText=',
    'ralph lauren': 'https://www.ralphlauren.com/search?q=',
    'calvin klein': 'https://www.calvinklein.us/search?q=',
    'tommy hilfiger': 'https://usa.tommy.com/en/search?q=',
    vans: 'https://www.vans.com/search?q=',
    converse: 'https://www.converse.com/shop/search?q=',
    'north face': 'https://www.thenorthface.com/search?q=',
    patagonia: 'https://www.patagonia.com/search/?q=',
  };

  function getShopUrl(item) {
    const brand = (item.brand ?? '').toLowerCase().trim();
    const query = encodeURIComponent([item.brand, item.name].filter(Boolean).join(' '));
    if (brand && MAJOR_BRANDS[brand]) return MAJOR_BRANDS[brand] + query;
    return `https://www.google.com/search?q=${query}&tbm=shop`;
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: outfit.imageURL }} style={styles.image} resizeMode="cover" />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>

      <View style={styles.topRight}>
        <TouchableOpacity style={styles.overlayBtn} onPress={handleShare}>
          <ShareIcon size={18} color={COLORS.white} />
        </TouchableOpacity>
        {isOwner ? (
          <TouchableOpacity style={styles.overlayBtn} onPress={handleDelete}>
            <Text style={styles.overlayBtnText}>🗑</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.overlayBtn} onPress={handleReport}>
            <FlagIcon size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {saveMsg && (
        <View style={styles.saveToast}>
          <Text style={styles.saveToastText}>✓ Outfit saved</Text>
        </View>
      )}

      <View style={styles.hangerOverlay}>
        <Text style={styles.hangerLabel}>
          {userRating > 0 ? `${userRating}/5` : 'Rate'}
        </Text>
        {HANGERS.map(v => (
          <TouchableOpacity key={v} onPress={() => handleRate(v)} style={styles.hangerBtn} activeOpacity={0.7}>
            <GeminiHangerIcon
              size={26}
              tone={v <= userRating ? 'gradient' : 'solid'}
              color={COLORS.white}
              opacity={v <= userRating ? 1 : 0.35}
            />
          </TouchableOpacity>
        ))}
        {userRating > 0 && (
          <View style={styles.ratedBadge}>
            <Text style={styles.ratedBadgeText}>✓ Rated</Text>
          </View>
        )}
      </View>

      <ScrollView style={[styles.sheet, { backgroundColor: colors.card }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

        <View style={styles.headerRow}>
          <View>
            <View style={styles.authorNameRow}>
              <Text style={[styles.outfitUser, { color: colors.textPrimary }]}>
                {outfit.username || outfit.displayName || 'User'}
              </Text>
              {authorVerified && <VerifiedBadge size={22} />}
            </View>
            <Text style={[styles.outfitMeta, { color: colors.textSecondary }]}>
              {outfit.items?.length ?? 0} pieces · {outfit.tags?.[0] ?? 'Mixed'}
            </Text>
          </View>
          <View style={[styles.ratingPill, { backgroundColor: colors.surface }]}>
            <GeminiHangerIcon size={14} />
            <Text style={[styles.ratingPillText, { color: colors.textPrimary }]}>
              {(outfit.avgRating ?? 0).toFixed(1)} · {outfit.ratingCount ?? 0}
            </Text>
          </View>
        </View>

        {outfit.caption ? (
          <Text style={[styles.caption, { color: colors.textPrimary }]}>{outfit.caption}</Text>
        ) : null}

        {outfit.items && outfit.items.length > 0 && (() => {
          const itemsWithPrice = outfit.items.filter(i => i.price > 0);
          const total = itemsWithPrice.reduce((sum, i) => sum + (i.price ?? 0), 0);
          const symbol = itemsWithPrice[0]?.currency ?? '$';
          return (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsRow}>
                {outfit.items.map((item, idx) => (
                  <View key={idx} style={styles.itemCard}>
                    <Image source={{ uri: item.imageURL }} style={[styles.itemImage, { backgroundColor: colors.surface }]} />
                    <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>{item.category}</Text>
                    {item.price > 0 && (
                      <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
                        {item.currency ?? '$'}{item.price.toFixed(2)}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
              {total > 0 && (
                <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total outfit value</Text>
                  <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{symbol}{total.toFixed(2)}</Text>
                </View>
              )}
            </>
          );
        })()}

        {isOwner && (
          <TouchableOpacity style={styles.deleteOutfitBtn} onPress={handleDelete}>
            <Text style={styles.deleteOutfitText}>🗑 Delete Outfit</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.saveOutfitBtn, saved && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveOutfitText, saved && { color: colors.textPrimary }]}>
            {saved ? '🔖 Saved' : '+ Save Outfit'}
          </Text>
        </TouchableOpacity>

        {outfit.items && outfit.items.length > 0 && (
          <View style={styles.shopSection}>
            <Text style={[styles.shopTitle, { color: colors.textPrimary }]}>Shop the Look</Text>
            {outfit.items.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.shopRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => Linking.openURL(getShopUrl(item))}
                activeOpacity={0.7}
              >
                <Image source={{ uri: item.imageURL }} style={styles.shopThumb} resizeMode="cover" />
                <View style={styles.shopInfo}>
                  <Text style={[styles.shopItemName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.shopItemMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.brand ? item.brand : item.category}
                  </Text>
                </View>
                <View style={styles.shopBtnWrap}>
                  <Text style={styles.shopBtnText}>Shop →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  image: { width: '100%', height: '62%' },
  backBtn: { position: 'absolute', top: 56, left: SPACING.md, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { color: COLORS.white, fontSize: 24, fontWeight: '300' },
  topRight: { position: 'absolute', top: 56, right: SPACING.md, gap: 10 },
  overlayBtn: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  overlayBtnText: { fontSize: 16, color: COLORS.white },
  saveToast: { position: 'absolute', top: 104, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: SPACING.lg, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  saveToastText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  hangerOverlay: { position: 'absolute', right: SPACING.md, bottom: '40%', alignItems: 'center', gap: 6 },
  hangerLabel: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700', marginBottom: 2 },
  hangerBtn: { padding: 4 },
  ratedBadge: { marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  ratedBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  sheet: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, paddingHorizontal: SPACING.md },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md, marginBottom: SPACING.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  outfitUser: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  outfitMeta: { fontSize: FONT_SIZE.sm },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  ratingPillText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  caption: { fontSize: FONT_SIZE.md, marginBottom: SPACING.md, lineHeight: 22 },
  itemsRow: { marginBottom: SPACING.md },
  itemCard: { width: 90, marginRight: SPACING.sm },
  itemImage: { width: 90, height: 90, borderRadius: BORDER_RADIUS.sm },
  itemName: { fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 4 },
  itemCategory: { fontSize: FONT_SIZE.xs },
  itemPrice: { fontSize: FONT_SIZE.xs, fontWeight: '700', marginTop: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: SPACING.sm, marginBottom: SPACING.md },
  totalLabel: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  totalValue: { fontSize: FONT_SIZE.md, fontWeight: '800' },
  deleteOutfitBtn: { borderWidth: 1, borderColor: COLORS.error, borderRadius: BORDER_RADIUS.md, paddingVertical: 12, alignItems: 'center', marginBottom: SPACING.sm },
  deleteOutfitText: { color: COLORS.error, fontSize: FONT_SIZE.md, fontWeight: '600' },
  saveOutfitBtn: { borderRadius: BORDER_RADIUS.md, paddingVertical: 14, alignItems: 'center', marginBottom: SPACING.md, backgroundColor: COLORS.primary },
  saveOutfitText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
  shopSection: { marginBottom: SPACING.xl },
  shopTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.sm },
  shopRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BORDER_RADIUS.md, borderWidth: 1, marginBottom: SPACING.sm, overflow: 'hidden' },
  shopThumb: { width: 56, height: 56 },
  shopInfo: { flex: 1, paddingHorizontal: SPACING.sm },
  shopItemName: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  shopItemMeta: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  shopBtnWrap: { paddingHorizontal: SPACING.md },
  shopBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },
});
