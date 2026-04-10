import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { getCommunityOutfits } from '../services/outfits';
import { joinCommunity, leaveCommunity, isJoined } from '../services/communities';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export default function CommunityDetailScreen({ navigation, route }) {
  const { community } = route.params;
  const { user } = useAuth();
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(community.memberCount ?? 0);

  useEffect(() => {
    getCommunityOutfits(20)
      .then(data => setOutfits(data))
      .catch(() => setOutfits([]))
      .finally(() => setLoading(false));

    if (user && community.id) {
      isJoined(community.id, user.uid).then(setJoined).catch(() => {});
    }
  }, []);

  async function handleJoinToggle() {
    if (!user || !community.id) return;
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
    }
  }

  function StarRow({ rating }) {
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <Text key={i} style={{ fontSize: 12, color: i <= Math.round(rating) ? COLORS.star : COLORS.border }}>★</Text>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={outfits}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.backText}>‹ Back</Text>
              </TouchableOpacity>
            </View>

            {/* Community info */}
            <View style={styles.heroSection}>
              <View style={styles.communityAvatar}>
                <Text style={styles.communityAvatarText}>{community.name[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.communityDesc}>{community.description}</Text>

              {community.labels?.length > 0 && (
                <View style={styles.labelsRow}>
                  {community.labels.map(l => (
                    <View key={l} style={styles.labelChip}>
                      <Text style={styles.labelText}>{l}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{memberCount || '—'}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{community.postCount ?? '—'}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.joinBtn, joined && styles.joinBtnJoined]}
                onPress={handleJoinToggle}
              >
                <Text style={[styles.joinBtnText, joined && styles.joinBtnTextJoined]}>
                  {joined ? 'Joined ✓' : 'Join Community'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Community Outfits</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridItem}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('OutfitDetail', { outfit: item })}
          >
            <Image source={{ uri: item.imageURL }} style={styles.gridImage} resizeMode="cover" />
            <View style={styles.gridOverlay}>
              <StarRow rating={item.avgRating ?? 0} />
              <Text style={styles.gridRating}>{(item.avgRating ?? 0).toFixed(1)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>No outfits posted yet. Be the first!</Text>
          )
        }
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.sm },
  backText: { fontSize: FONT_SIZE.lg, color: COLORS.primary, fontWeight: '600' },
  heroSection: { alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  communityAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  communityAvatarText: { fontSize: 36, color: COLORS.white, fontWeight: '800' },
  communityName: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  communityDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.sm },
  labelsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  labelChip: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  labelText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  statItem: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  joinBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: BORDER_RADIUS.full, minWidth: 180, alignItems: 'center' },
  joinBtnJoined: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  joinBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
  joinBtnTextJoined: { color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  grid: { paddingHorizontal: SPACING.sm, paddingBottom: 100 },
  gridItem: { flex: 1, margin: SPACING.xs, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', aspectRatio: 0.75, backgroundColor: COLORS.surface },
  gridImage: { width: '100%', height: '100%' },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', padding: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: 4 },
  starRow: { flexDirection: 'row', gap: 1 },
  gridRating: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700', marginLeft: 2 },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 60, fontSize: FONT_SIZE.md },
});
