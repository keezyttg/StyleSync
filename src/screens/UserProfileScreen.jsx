import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';

const ITEM_SIZE = (Dimensions.get('window').width - 4) / 2;
import { getUserProfile, followUser, unfollowUser, getFollowing } from '../services/auth';
import { getUserOutfits } from '../services/outfits';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export default function UserProfileScreen({ navigation, route }) {
  const { userId, username: routeUsername } = route.params;
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState(null);
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [prof, outs, followingIds] = await Promise.all([
          getUserProfile(userId),
          getUserOutfits(userId),
          currentUser ? getFollowing(currentUser.uid) : Promise.resolve([]),
        ]);
        setProfile(prof);
        setOutfits(outs);
        setIsFollowing(followingIds.includes(userId));
      } catch (err) {
        // non-fatal: profile stays null and UI shows empty state
      }
      setLoading(false);
    }
    load();
  }, [userId, currentUser]);

  async function handleFollowToggle() {
    if (!currentUser || followLoading) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    try {
      wasFollowing
        ? await unfollowUser(currentUser.uid, userId)
        : await followUser(currentUser.uid, userId);
      // Update follower count locally
      setProfile(prev => prev ? {
        ...prev,
        followers: (prev.followers ?? 0) + (wasFollowing ? -1 : 1),
      } : prev);
    } catch {
      setIsFollowing(wasFollowing);
    }
    setFollowLoading(false);
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const displayName = profile?.displayName || routeUsername || 'User';
  const initials = displayName[0].toUpperCase();
  const isSelf = currentUser?.uid === userId;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={outfits}
        keyExtractor={item => item.id}
        numColumns={2}
        ListHeaderComponent={
          <View>
            {/* Back button */}
            <View style={[styles.navBar, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.backBtn, { color: colors.textPrimary }]}>‹ Back</Text>
              </TouchableOpacity>
            </View>

            {/* Avatar + name */}
            <View style={styles.avatarSection}>
              {profile?.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
              )}
              <Text style={[styles.displayName, { color: colors.textPrimary }]}>{displayName}</Text>
              <Text style={[styles.username, { color: colors.textSecondary }]}>
                @{profile?.username ?? routeUsername ?? 'user'}
              </Text>
              {profile?.bio ? (
                <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
              ) : null}

              {/* Follow button (hide if viewing own profile) */}
              {!isSelf && (
                <TouchableOpacity
                  style={[
                    styles.followBtn,
                    isFollowing
                      ? [styles.followBtnActive, { borderColor: colors.border, backgroundColor: colors.surface }]
                      : { backgroundColor: colors.primary },
                  ]}
                  onPress={handleFollowToggle}
                  disabled={followLoading}
                >
                  <Text style={[styles.followBtnText, isFollowing && { color: colors.textPrimary }]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { value: outfits.length, label: 'Outfits' },
                { value: profile?.followers ?? 0, label: 'Followers' },
                { value: profile?.following ?? 0, label: 'Following' },
              ].map((stat, i) => (
                <View key={i} style={[styles.statBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Outfits</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('OutfitDetail', { outfit: item })}
          >
            <Image source={{ uri: item.imageURL }} style={styles.gridImage} resizeMode="cover" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No outfits posted yet.</Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.sm },
  backBtn: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  avatarSection: { alignItems: 'center', paddingBottom: SPACING.lg, paddingTop: SPACING.sm },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: SPACING.sm },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#AF11D3', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  avatarInitial: { fontSize: 40, color: '#FFFFFF', fontWeight: '700' },
  displayName: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  username: { fontSize: FONT_SIZE.md, marginTop: 2 },
  bio: { fontSize: FONT_SIZE.sm, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.xl },
  followBtn: { marginTop: SPACING.md, paddingHorizontal: SPACING.xl, paddingVertical: 10, borderRadius: BORDER_RADIUS.full },
  followBtnActive: { borderWidth: 1 },
  followBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm },
  statBox: { flex: 1, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  sectionLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  gridItem: { width: ITEM_SIZE, margin: 2, aspectRatio: 1 },
  gridImage: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.sm },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: FONT_SIZE.md },
});
