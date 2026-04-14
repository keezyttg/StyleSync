import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getNotifications, markAllRead } from '../services/notifications';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

function timeAgo(date) {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const TYPE_ICON = {
  follow: '👤',
  rating: '★',
  save:   '🔖',
};

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      getNotifications(user.uid)
        .then(data => setNotifications(data))
        .finally(() => setLoading(false));

      // Mark all read when screen is opened
      markAllRead(user.uid);
    }, [user])
  );

  function handleTap(notif) {
    if (notif.outfitId && notif.outfitImage) {
      // Navigate to outfit — pass a minimal outfit object so OutfitDetail renders
      navigation.navigate('OutfitDetail', {
        outfit: {
          id: notif.outfitId,
          imageURL: notif.outfitImage,
          userId: notif.fromUid,
          username: notif.fromName,
          avgRating: 0,
          ratingCount: 0,
        },
      });
    } else if (notif.fromUid) {
      navigation.navigate('UserProfile', {
        userId: notif.fromUid,
        username: notif.fromName,
      });
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.back, { color: colors.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                !item.read && { backgroundColor: colors.surface },
              ]}
              onPress={() => handleTap(item)}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                {item.fromPhoto ? (
                  <Image source={{ uri: item.fromPhoto }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.avatarInitial}>
                      {(item.fromName || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.typeIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.typeIconText, item.type === 'rating' && { color: COLORS.star }]}>
                    {TYPE_ICON[item.type] ?? '🔔'}
                  </Text>
                </View>
              </View>

              {/* Message */}
              <View style={styles.content}>
                <Text style={[styles.message, { color: colors.textPrimary }]}>{item.message}</Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo(item.createdAt)}</Text>
              </View>

              {/* Outfit thumbnail */}
              {item.outfitImage ? (
                <Image source={{ uri: item.outfitImage }} style={styles.outfitThumb} />
              ) : (
                <View style={{ width: 48 }} />
              )}

              {/* Unread dot */}
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notifications yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                When someone follows you or rates your outfit, it'll show up here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  back: { fontSize: 32, fontWeight: '300', lineHeight: 36 },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    borderBottomWidth: 1, gap: SPACING.md,
  },
  avatarWrap: { position: 'relative', width: 48, height: 48 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.lg },
  typeIcon: {
    position: 'absolute', bottom: -2, right: -4,
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  typeIconText: { fontSize: 10, color: COLORS.primary },
  content: { flex: 1 },
  message: { fontSize: FONT_SIZE.sm, lineHeight: 20, fontWeight: '500' },
  time: { fontSize: FONT_SIZE.xs, marginTop: 3 },
  outfitThumb: { width: 48, height: 48, borderRadius: BORDER_RADIUS.sm },
  unreadDot: {
    position: 'absolute', right: 12, top: '50%',
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary,
    transform: [{ translateY: -4 }],
  },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  emptyText: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
});
