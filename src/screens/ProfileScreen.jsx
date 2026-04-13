import React, { useState, useCallback } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUserProfile, logOut } from '../services/auth';
import { getUserOutfits, deleteOutfit } from '../services/outfits';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [outfits, setOutfits] = useState([]);
  const [tab, setTab] = useState('My Outfits');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      Promise.all([getUserProfile(user.uid), getUserOutfits(user.uid)])
        .then(([prof, outs]) => {
          setProfile(prof);
          setOutfits(outs);
        })
        .catch(err => console.log('Profile load error:', err))
        .finally(() => setLoading(false));
    }, [user])
  );

  // Recompute avg rating from actual outfit data
  const avgRating = outfits.length > 0
    ? (outfits.reduce((sum, o) => sum + (o.avgRating ?? 0), 0) / outfits.length).toFixed(1)
    : '—';

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logOut() },
    ]);
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tab === 'My Outfits' ? outfits : []}
        keyExtractor={item => item.id}
        numColumns={2}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.profileHeader}>
              <Text style={styles.pageTitle}>Profile</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate('EditProfile', { profile })}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.settingsBtn}
                  onPress={() => setShowSettings(s => !s)}
                >
                  <Text style={styles.settingsIcon}>⚙</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Settings panel */}
            {showSettings && (
              <View style={styles.settingsPanel}>
                <TouchableOpacity style={styles.settingsRow}>
                  <Text style={styles.settingsRowText}>Privacy</Text>
                  <Text style={styles.settingsChevron}>›</Text>
                </TouchableOpacity>
                <View style={styles.settingsDivider} />
                <TouchableOpacity style={styles.settingsRow} onPress={handleSignOut}>
                  <Text style={[styles.settingsRowText, { color: COLORS.error }]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Avatar + name */}
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
              {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { value: outfits.length, label: 'Outfits' },
                { value: avgRating, label: 'Avg Rating' },
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
              {['My Outfits', 'Saved'].map(t => (
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
            onLongPress={() => {
              Alert.alert('Delete Outfit', 'Remove this outfit permanently?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete', style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteOutfit(item.id, user.uid);
                      setOutfits(prev => prev.filter(o => o.id !== item.id));
                    } catch (err) {
                      Alert.alert('Error', err.message || 'Could not delete.');
                    }
                  },
                },
              ]);
            }}
          >
            <Image source={{ uri: item.imageURL }} style={styles.gridImage} resizeMode="cover" />
            <View style={styles.gridDeleteHint}>
              <Text style={styles.gridDeleteHintText}>Hold to delete</Text>
            </View>
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
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md },
  pageTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  editBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6 },
  editBtnText: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: '600' },
  settingsBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 20, color: COLORS.textSecondary },
  settingsPanel: { marginHorizontal: SPACING.md, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 14 },
  settingsRowText: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  settingsChevron: { fontSize: 20, color: COLORS.textMuted },
  settingsDivider: { height: 1, backgroundColor: COLORS.border },
  avatarSection: { alignItems: 'center', paddingBottom: SPACING.lg },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: SPACING.sm },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  avatarInitial: { fontSize: 40, color: COLORS.white, fontWeight: '700' },
  displayName: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.textPrimary },
  username: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: 2 },
  bio: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.xl },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, marginBottom: SPACING.lg, gap: SPACING.sm },
  statBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, paddingHorizontal: SPACING.md },
  tabBtn: { marginRight: SPACING.xl, paddingBottom: SPACING.sm },
  tabText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.textPrimary, fontWeight: '700' },
  tabUnderline: { height: 2, backgroundColor: COLORS.textPrimary, borderRadius: 1, marginTop: 4 },
  gridItem: { flex: 1, margin: 2, aspectRatio: 1 },
  gridImage: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.sm },
  gridDeleteHint: { position: 'absolute', bottom: 4, left: 0, right: 0, alignItems: 'center' },
  gridDeleteHintText: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, fontSize: FONT_SIZE.md },
});
