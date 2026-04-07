import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';

function Bone({ width, height, borderRadius = BORDER_RADIUS.sm, style }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '#E0E0E0', opacity }, style]}
    />
  );
}

export function FeedCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <Bone width={36} height={36} borderRadius={18} />
        <View style={{ marginLeft: SPACING.sm, gap: 6 }}>
          <Bone width={120} height={12} />
          <Bone width={80} height={10} />
        </View>
      </View>
      {/* Image */}
      <Bone width="100%" height={280} borderRadius={0} />
      {/* Footer */}
      <View style={styles.cardFooter}>
        <Bone width={140} height={14} />
        <Bone width={80} height={10} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function ClosetRowSkeleton() {
  return (
    <View style={styles.row}>
      <Bone width={100} height={100} borderRadius={BORDER_RADIUS.md} />
      <View style={{ flex: 1, marginLeft: SPACING.sm, gap: 8, justifyContent: 'center' }}>
        <Bone width="70%" height={13} />
        <Bone width="45%" height={11} />
        <Bone width="30%" height={10} />
      </View>
    </View>
  );
}

export function GridItemSkeleton() {
  return <Bone width="100%" height={180} borderRadius={BORDER_RADIUS.md} style={{ margin: 4 }} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  cardFooter: {
    padding: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    padding: SPACING.sm,
    alignItems: 'center',
  },
});
