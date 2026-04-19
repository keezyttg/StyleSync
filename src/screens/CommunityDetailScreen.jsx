import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';

const ITEM_SIZE = (Dimensions.get('window').width - 32) / 2; // 8px padding × 2 sides + 4px margin × 4 edges
import { getCommunityOutfits } from '../services/outfits';
import { getCommunity, joinCommunity, leaveCommunity, isJoined } from '../services/communities';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import GeminiHangerIcon from '../components/GeminiHangerIcon';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

function normalizeTag(tag) {
  return String(tag ?? '').trim().toLowerCase();
}

function outfitHasTag(outfit, tag) {
  if (!tag) return true;
  return (outfit.tags ?? []).some(itemTag => normalizeTag(itemTag) === normalizeTag(tag));
}

export default function CommunityDetailScreen({ navigation, route }) {
  const { community, initiallyJoined, initialTag = null } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(initiallyJoined ?? false);
  const [memberCount, setMemberCount] = useState(community.memberCount ?? 0);
  const [selectedTag, setSelectedTag] = useState(
    community.labels?.some(label => normalizeTag(label) === normalizeTag(initialTag)) ? initialTag : null
  );
  const toggling = useRef(false);

  useEffect(() => {
    // Fetch fresh community data so member count is always accurate
    if (community.id) {
      getCommunity(community.id)
        .then(fresh => { if (fresh) setMemberCount(fresh.memberCount ?? 0); })
        .catch(() => {});
    }

    getCommunityOutfits(community.id, null)
      .then(data => setOutfits(data))
      .catch(() => setOutfits([]))
      .finally(() => setLoading(false));

    if (user && community.id) {
      isJoined(community.id, user.uid).then(setJoined).catch(() => {});
    }
  }, [community.id, user?.uid]);

  const filteredOutfits = outfits.filter(outfit => outfitHasTag(outfit, selectedTag));

  async function handleJoinToggle() {
    if (!user || !community.id || toggling.current) return;
    toggling.current = true;
    const wasJoined = joined;
    setJoined(!wasJoined);
    setMemberCount(c => wasJoined ? c - 1 : c + 1);
    try {
      wasJoined
        ? await leaveCommunity(community.id, user.uid)
        : await joinCommunity(community.id, user.uid);
    } catch {
      setJoined(wasJoined);
      setMemberCount(c => wasJoined ? c + 1 : c - 1);
    } finally {
      toggling.current = false;
    }
  }

  function RatingRow({ rating }) {
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <GeminiHangerIcon
            key={i}
            size={10}
            tone={i <= Math.round(rating) ? 'gradient' : 'solid'}
            color={COLORS.white}
            opacity={i <= Math.round(rating) ? 1 : 0.35}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredOutfits}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <View>
            <View style={[styles.header, { backgroundColor: colors.background }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.backText}>‹ Back</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
              <View style={styles.communityAvatar}>
                <Text style={styles.communityAvatarText}>{community.name[0].toUpperCase()}</Text>
              </View>
              <Text style={[styles.communityName, { color: colors.textPrimary }]}>{community.name}</Text>
              <Text style={[styles.communityDesc, { color: colors.textSecondary }]}>{community.description}</Text>

              {community.labels?.length > 0 && (
                <View style={styles.labelsRow}>
                  <TouchableOpacity
                    style={[
                      styles.labelChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      !selectedTag && styles.labelChipActive,
                    ]}
                    onPress={() => setSelectedTag(null)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.labelText, { color: colors.textSecondary }, !selectedTag && styles.labelTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {community.labels.map(l => {
                    const isActive = normalizeTag(selectedTag) === normalizeTag(l);
                    return (
                      <TouchableOpacity
                        key={l}
                        style={[
                          styles.labelChip,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          isActive && styles.labelChipActive,
                        ]}
                        onPress={() => setSelectedTag(prev => normalizeTag(prev) === normalizeTag(l) ? null : l)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.labelText, { color: colors.textSecondary }, isActive && styles.labelTextActive]}>{l}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{memberCount || '—'}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Members</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{community.postCount ?? '—'}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.joinBtn, joined && [styles.joinBtnJoined, { backgroundColor: colors.surface, borderColor: colors.border }]]}
                onPress={handleJoinToggle}
              >
                <Text style={[styles.joinBtnText, joined && { color: colors.textPrimary }]}>
                  {joined ? 'Joined ✓' : 'Join Community'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {selectedTag ? `${selectedTag} Posts` : 'Community Outfits'}
              </Text>
              {selectedTag && (
                <TouchableOpacity onPress={() => setSelectedTag(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.clearFilterText}>Show All</Text>
                </TouchableOpacity>
              )}
            </View>
            {selectedTag ? (
              <Text style={[styles.filterHint, { color: colors.textSecondary }]}>
                Showing only outfits tagged {selectedTag}.
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: colors.surface }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('OutfitDetail', { outfit: item })}
          >
            <Image source={{ uri: item.imageURL }} style={styles.gridImage} resizeMode="cover" />
            <View style={styles.gridOverlay}>
              <RatingRow rating={item.avgRating ?? 0} />
              <Text style={styles.gridRating}>{(item.avgRating ?? 0).toFixed(1)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {selectedTag
                ? `No outfits tagged ${selectedTag} yet in this community.`
                : 'No outfits posted yet. Be the first!'}
            </Text>
          )
        }
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.sm },
  backText: { fontSize: FONT_SIZE.lg, color: COLORS.primary, fontWeight: '600' },
  heroSection: { alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  communityAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  communityAvatarText: { fontSize: 36, color: COLORS.white, fontWeight: '800' },
  communityName: { fontSize: FONT_SIZE.xxl, fontWeight: '800', textAlign: 'center' },
  communityDesc: { fontSize: FONT_SIZE.sm, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.sm },
  labelsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  labelChip: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  labelText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  labelChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  labelTextActive: { color: COLORS.white, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  statItem: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  statDivider: { width: 1, height: 32 },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  joinBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: BORDER_RADIUS.full, minWidth: 180, alignItems: 'center' },
  joinBtnJoined: { borderWidth: 1 },
  joinBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, marginBottom: SPACING.xs },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  clearFilterText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '700' },
  filterHint: { fontSize: FONT_SIZE.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  grid: { paddingHorizontal: SPACING.sm, paddingBottom: 100 },
  gridItem: { width: ITEM_SIZE, margin: SPACING.xs, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', aspectRatio: 0.75 },
  gridImage: { width: '100%', height: '100%' },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', padding: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: 4 },
  starRow: { flexDirection: 'row', gap: 1 },
  gridRating: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700', marginLeft: 2 },
  emptyText: { textAlign: 'center', marginTop: 60, fontSize: FONT_SIZE.md },
});
