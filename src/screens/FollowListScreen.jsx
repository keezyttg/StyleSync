import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { getFollowers, getFollowing, getUserProfile, followUser, unfollowUser, getFollowing as getMyFollowing } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import VerifiedBadge, { isUserVerified } from '../components/VerifiedBadge';

export default function FollowListScreen({ route, navigation }) {
  const { userId, type, displayName } = route.params; // type: 'followers' | 'following'
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myFollowing, setMyFollowing] = useState(new Set());
  const [followLoading, setFollowLoading] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const uids = type === 'followers'
          ? await getFollowers(userId)
          : await getFollowing(userId);

        const [profiles, followingIds] = await Promise.all([
          Promise.all(uids.map(id => getUserProfile(id).then(p => p ? { ...p, uid: id } : null))),
          currentUser ? getMyFollowing(currentUser.uid) : [],
        ]);

        setUsers(profiles.filter(Boolean));
        setMyFollowing(new Set(followingIds));
      } catch {}
      setLoading(false);
    }
    load();
  }, [userId, type, currentUser]);

  async function toggleFollow(targetUid) {
    if (!currentUser || followLoading[targetUid]) return;
    setFollowLoading(prev => ({ ...prev, [targetUid]: true }));
    const wasFollowing = myFollowing.has(targetUid);
    setMyFollowing(prev => {
      const next = new Set(prev);
      wasFollowing ? next.delete(targetUid) : next.add(targetUid);
      return next;
    });
    try {
      wasFollowing
        ? await unfollowUser(currentUser.uid, targetUid)
        : await followUser(currentUser.uid, targetUid);
    } catch {
      setMyFollowing(prev => {
        const next = new Set(prev);
        wasFollowing ? next.add(targetUid) : next.delete(targetUid);
        return next;
      });
    }
    setFollowLoading(prev => ({ ...prev, [targetUid]: false }));
  }

  function renderUser({ item }) {
    const isSelf = currentUser?.uid === item.uid;
    const isFollowing = myFollowing.has(item.uid);
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: colors.border }]}
        onPress={() => {
          if (isSelf) { navigation.goBack(); return; }
          navigation.navigate('UserProfile', { userId: item.uid, username: item.username });
        }}
        activeOpacity={0.7}
      >
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.avatarInitial}>{(item.displayName || item.username || '?')[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.displayName || item.username}</Text>
            {isUserVerified(item) && <VerifiedBadge size={14} />}
          </View>
          <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>@{item.username}</Text>
        </View>
        {!isSelf && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing
              ? { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }
              : { backgroundColor: COLORS.primary }
            ]}
            onPress={() => toggleFollow(item.uid)}
            disabled={!!followLoading[item.uid]}
          >
            <Text style={[styles.followBtnText, isFollowing && { color: colors.textPrimary }]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.back, { color: colors.textPrimary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {displayName ? `${displayName}'s ` : ''}{type === 'followers' ? 'Followers' : 'Following'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.uid}
          renderItem={renderUser}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { flex: 1 },
  back: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  title: { fontSize: FONT_SIZE.md, fontWeight: '700', textAlign: 'center', flex: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '700' },
  info: { flex: 1, marginLeft: SPACING.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  username: { fontSize: FONT_SIZE.sm, marginTop: 1 },
  followBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: BORDER_RADIUS.full },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.sm },
  empty: { textAlign: 'center', marginTop: 60, fontSize: FONT_SIZE.md },
});
