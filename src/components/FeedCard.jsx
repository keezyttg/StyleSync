import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions,
} from 'react-native';
import GeminiHangerIcon from './GeminiHangerIcon';
import VerifiedBadge from './VerifiedBadge';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

// card header (~70) + card footer (~56) + 1px separator
export const CARD_CHROME = 127;

export const HangerRow = React.memo(function HangerRow({ rating, count }) {
  const { colors } = useTheme();
  return (
    <View style={styles.hangerRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <GeminiHangerIcon
          key={i}
          size={16}
          tone={i <= Math.round(rating) ? 'gradient' : 'solid'}
          color={colors.border}
          opacity={i <= Math.round(rating) ? 1 : 0.8}
        />
      ))}
      <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{rating.toFixed(1)}</Text>
      <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>({count})</Text>
    </View>
  );
});

export const OutfitCard = React.memo(function OutfitCard({ item, isFollowing, isOwn, onFollow, navigation }) {
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const displayName = item.username || item.displayName || 'User';
  const imageHeight = Math.min(screenWidth * 1.25, screenHeight - CARD_CHROME - 220);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('OutfitDetail', { outfit: item })}
      activeOpacity={0.9}
    >
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => item.userId && navigation.navigate('UserProfile', { userId: item.userId, username: item.username || item.displayName })}
        >
          {item.userPhotoURL ? (
            <Image source={{ uri: item.userPhotoURL }} style={styles.avatarCircle} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{displayName[0].toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => item.userId && navigation.navigate('UserProfile', { userId: item.userId, username: item.username || item.displayName })}
        >
          <View style={styles.nameRow}>
            <Text style={[styles.username, { color: colors.textPrimary }]}>{displayName}</Text>
            {item.userVerified && <VerifiedBadge size={22} />}
          </View>
          {item.tags?.[0] && <Text style={[styles.tagLine, { color: colors.textSecondary }]}>{item.tags[0]}</Text>}
        </TouchableOpacity>
        {!isOwn && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && [styles.followBtnActive, { backgroundColor: colors.surface, borderColor: colors.border }]]}
            onPress={() => onFollow(item.userId)}
          >
            <Text style={[styles.followBtnText, isFollowing && { color: colors.textPrimary }]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Image source={{ uri: item.imageURL }} style={[styles.outfitImage, { height: imageHeight }]} resizeMode="cover" />

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <HangerRow rating={item.avgRating ?? 0} count={item.ratingCount ?? 0} />
        <Text style={[styles.savesText, { color: colors.textSecondary }]}>{item.saves ?? 0} saves</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: { borderBottomWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  username: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  tagLine: { fontSize: FONT_SIZE.xs, marginTop: 1 },
  followBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: BORDER_RADIUS.full },
  followBtnActive: { borderWidth: 1 },
  followBtnText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  outfitImage: { width: '100%' },
  cardFooter: { padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1 },
  hangerRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: FONT_SIZE.md, fontWeight: '700', marginLeft: 6 },
  ratingCount: { fontSize: FONT_SIZE.sm, marginLeft: 2 },
  savesText: { fontSize: FONT_SIZE.sm },
});
