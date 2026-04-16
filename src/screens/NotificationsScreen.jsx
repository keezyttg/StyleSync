import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getNotifications,
  markAllRead,
  deleteNotification,
  clearNotifications,
} from '../services/notifications';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import GeminiHangerIcon from '../components/GeminiHangerIcon';
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
  save:   '🔖',
};

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [clearingAll, setClearingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getNotifications(user.uid);
      setNotifications(data.map(notification => ({ ...notification, read: true })));
      markAllRead(user.uid).catch(() => {});
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
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

  function handleDeletePress(notificationId) {
    Alert.alert(
      'Delete notification?',
      'This notification will be removed from your list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;

            setDeletingIds(prev => {
              const next = new Set(prev);
              next.add(notificationId);
              return next;
            });

            try {
              await deleteNotification(user.uid, notificationId);
              setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
            } catch {
              Alert.alert('Could not delete notification', 'Please try again.');
            } finally {
              setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(notificationId);
                return next;
              });
            }
          },
        },
      ]
    );
  }

  function handleClearAllPress() {
    if (!user || notifications.length === 0 || clearingAll) return;

    Alert.alert(
      'Clear all notifications?',
      'This will permanently remove every notification currently shown.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            setClearingAll(true);
            try {
              await clearNotifications(user.uid);
              setNotifications([]);
            } catch {
              Alert.alert('Could not clear notifications', 'Please try again.');
            } finally {
              setClearingAll(false);
            }
          },
        },
      ]
    );
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
        <TouchableOpacity
          style={[
            styles.clearAllButton,
            (notifications.length === 0 || clearingAll) && styles.clearAllButtonDisabled,
          ]}
          onPress={handleClearAllPress}
          disabled={notifications.length === 0 || clearingAll}
        >
          <Text style={[styles.clearAllText, { color: colors.textPrimary }]}>
            {clearingAll ? 'Clearing...' : 'Clear all'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                !item.read && { backgroundColor: colors.surface },
              ]}
            >
              <TouchableOpacity
                style={styles.rowMain}
                onPress={() => handleTap(item)}
                activeOpacity={0.7}
              >
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
                    {item.type === 'rating' ? (
                      <GeminiHangerIcon size={11} />
                    ) : (
                      <Text style={styles.typeIconText}>
                        {TYPE_ICON[item.type] ?? '🔔'}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.content}>
                  <Text style={[styles.message, { color: colors.textPrimary }]}>{item.message}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo(item.createdAt)}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                </View>

                {item.outfitImage ? (
                  <Image source={{ uri: item.outfitImage }} style={styles.outfitThumb} />
                ) : (
                  <View style={styles.outfitPlaceholder} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  deletingIds.has(item.id) && styles.deleteButtonDisabled,
                ]}
                onPress={() => handleDeletePress(item.id)}
                disabled={deletingIds.has(item.id) || clearingAll}
              >
                <Text style={styles.deleteButtonText}>
                  {deletingIds.has(item.id) ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
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
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 3 },
  message: { fontSize: FONT_SIZE.sm, lineHeight: 20, fontWeight: '500' },
  time: { fontSize: FONT_SIZE.xs },
  outfitThumb: { width: 48, height: 48, borderRadius: BORDER_RADIUS.sm },
  outfitPlaceholder: { width: 48, height: 48 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  clearAllButton: { minWidth: 72, alignItems: 'flex-end' },
  clearAllButtonDisabled: { opacity: 0.45 },
  clearAllText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  deleteButton: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  deleteButtonDisabled: { opacity: 0.6 },
  deleteButtonText: { color: COLORS.error, fontSize: FONT_SIZE.xs, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  emptyText: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
});
