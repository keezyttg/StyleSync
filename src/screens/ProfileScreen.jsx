import React, { useState, useCallback } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Switch, Linking, Dimensions } from 'react-native';

const ITEM_SIZE = (Dimensions.get('window').width - 4) / 2;
import { useFocusEffect } from '@react-navigation/native';
import { getUserProfile, logOut } from '../services/auth';
import { getUserOutfits, deleteOutfit, getSavedOutfits, unsaveOutfit } from '../services/outfits';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import VerifiedBadge, { isUserVerified } from '../components/VerifiedBadge';

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggleDark } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [outfits, setOutfits] = useState([]);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [tab, setTab] = useState('My Outfits');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      Promise.all([getUserProfile(user.uid), getUserOutfits(user.uid), getSavedOutfits(user.uid)])
        .then(([prof, outs, saved]) => {
          setProfile(prof);
          setOutfits(outs);
          setSavedOutfits(saved);
        })
        .catch(() => {})
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
    return <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={tab === 'My Outfits' ? outfits : savedOutfits}
        keyExtractor={item => item.id}
        numColumns={2}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.profileHeader}>
              <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Profile</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.editBtn, { borderColor: colors.textPrimary }]}
                  onPress={() => navigation.navigate('EditProfile', { profile })}
                >
                  <Text style={[styles.editBtnText, { color: colors.textPrimary }]}>Edit</Text>
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
              <View style={[styles.settingsPanel, { borderColor: colors.border }]}>
                <View style={styles.settingsRow}>
                  <Text style={[styles.settingsRowText, { color: colors.textPrimary }]}>Dark Mode</Text>
                  <Switch
                    value={isDark}
                    onValueChange={toggleDark}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
                <View style={[styles.settingsDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.settingsRow} onPress={() => Linking.openURL('https://www.termsfeed.com/live/your-terms-url')}>
                  <Text style={[styles.settingsRowText, { color: colors.textPrimary }]}>Terms & Conditions</Text>
                  <Text style={[styles.settingsChevron, { color: colors.textMuted }]}>›</Text>
                </TouchableOpacity>
                <View style={[styles.settingsDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.settingsRow} onPress={handleSignOut}>
                  <Text style={[styles.settingsRowText, { color: colors.error }]}>Sign Out</Text>
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
              <View style={styles.nameRow}>
                <Text style={[styles.displayName, { color: colors.textPrimary }]}>{profile?.displayName ?? 'User'}</Text>
                {isUserVerified(profile) && <VerifiedBadge size={20} />}
              </View>
              <Text style={[styles.username, { color: colors.textSecondary }]}>@{profile?.username ?? 'user'}</Text>
              {profile?.bio ? <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text> : null}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { value: outfits.length, label: 'Outfits', onPress: null },
                { value: profile?.followers ?? 0, label: 'Followers', onPress: () => navigation.navigate('FollowList', { userId: user.uid, type: 'followers', displayName: profile?.displayName }) },
                { value: profile?.following ?? 0, label: 'Following', onPress: () => navigation.navigate('FollowList', { userId: user.uid, type: 'following', displayName: profile?.displayName }) },
              ].map((stat, i) => (
                <TouchableOpacity key={i} style={[styles.statBox, { backgroundColor: colors.surface }]} onPress={stat.onPress} disabled={!stat.onPress} activeOpacity={stat.onPress ? 0.7 : 1}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tabs */}
            <View style={[styles.tabRow, { borderColor: colors.border }]}>
              {['My Outfits', 'Saved'].map(t => (
                <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => setTab(t)}>
                  <Text style={[styles.tabText, { color: colors.textSecondary }, tab === t && { color: colors.textPrimary, fontWeight: '700' }]}>{t}</Text>
                  {tab === t && <View style={[styles.tabUnderline, { backgroundColor: colors.textPrimary }]} />}
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
              if (tab === 'Saved') {
                Alert.alert('Remove from Saved', 'Unsave this outfit?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove', style: 'destructive',
                    onPress: async () => {
                      try {
                        await unsaveOutfit(user.uid, item.id);
                        setSavedOutfits(prev => prev.filter(o => o.id !== item.id));
                      } catch (err) {
                        Alert.alert('Error', err.message || 'Could not remove.');
                      }
                    },
                  },
                ]);
              } else {
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
              }
            }}
          >
            <Image source={{ uri: item.imageURL }} style={styles.gridImage} resizeMode="cover" />
            <View style={styles.gridDeleteHint}>
              <Text style={styles.gridDeleteHintText}>
                {tab === 'Saved' ? 'Hold to unsave' : 'Hold to delete'}
              </Text>
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
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md },
  pageTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  editBtn: { borderWidth: 1, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6 },
  editBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  settingsBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 20 },
  settingsPanel: { marginHorizontal: SPACING.md, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 14 },
  settingsRowText: { fontSize: FONT_SIZE.md },
  settingsChevron: { fontSize: 20 },
  settingsDivider: { height: 1 },
  avatarSection: { alignItems: 'center', paddingBottom: SPACING.lg },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: SPACING.sm },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#AF11D3', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  avatarInitial: { fontSize: 40, color: '#FFFFFF', fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  displayName: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  username: { fontSize: FONT_SIZE.md, marginTop: 2 },
  bio: { fontSize: FONT_SIZE.sm, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.xl },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, marginBottom: SPACING.lg, gap: SPACING.sm },
  statBox: { flex: 1, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: SPACING.sm, paddingHorizontal: SPACING.md },
  tabBtn: { marginRight: SPACING.xl, paddingBottom: SPACING.sm },
  tabText: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  tabUnderline: { height: 2, borderRadius: 1, marginTop: 4 },
  gridItem: { width: ITEM_SIZE, margin: 2, aspectRatio: 1 },
  gridImage: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.sm },
  gridDeleteHint: { position: 'absolute', bottom: 4, left: 0, right: 0, alignItems: 'center' },
  gridDeleteHintText: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: FONT_SIZE.md },
});
