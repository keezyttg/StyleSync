import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getUserProfile } from '../services/auth';
import { getUserOutfits } from '../services/outfits';
import { logOut } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

type Tab = 'My Outfits' | 'Saved';

export default function ProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('My Outfits');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [prof, outs] = await Promise.all([
          getUserProfile(user.uid),
          getUserOutfits(user.uid),
        ]);
        setProfile(prof);
        setOutfits(outs);
      } catch (err) {
        console.log('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logOut() },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tab === 'My Outfits' ? outfits : []}
        keyExtractor={item => item.id}
        numColumns={2}
        ListHeaderComponent={
          <View>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <Text style={styles.pageTitle}>Profile</Text>
              <TouchableOpacity onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* Avatar */}
            <View style={styles.avatarSection}>
              {profile?.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.displayName}>{profile?.displayName ?? 'User'}</Text>
              <Text style={styles.username}>@{profile?.username ?? 'user'}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { value: profile?.outfitCount ?? 0, label: 'Outfits' },
                { value: (profile?.avgRating ?? 0).toFixed(1), label: 'Avg Rating' },
                { value: profile?.followers ?? 0, label: 'Followers' },
              ].map((stat, i) => (
                <View key={i} style={styles.statBox}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              {(['My Outfits', 'Saved'] as Tab[]).map(t => (
                <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => setTab(t)}>
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                  {tab === t && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
              ))}
            </View>
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
          <Text style={styles.emptyText}>
            {tab === 'My Outfits' ? "You haven't posted any outfits yet." : "No saved outfits yet."}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 56,
    paddingBottom: SPACING.md,
  },
  pageTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.textPrimary },
  signOutText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
  avatarSection: { alignItems: 'center', paddingBottom: SPACING.lg },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: SPACING.sm },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarInitial: { fontSize: 40, color: COLORS.white, fontWeight: '700' },
  displayName: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.textPrimary },
  username: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  tabBtn: { marginRight: SPACING.xl, paddingBottom: SPACING.sm },
  tabText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.textPrimary, fontWeight: '700' },
  tabUnderline: { height: 2, backgroundColor: COLORS.textPrimary, borderRadius: 1, marginTop: 4 },
  gridItem: { flex: 1, margin: 2, aspectRatio: 1 },
  gridImage: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.sm },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, fontSize: FONT_SIZE.md },
});
