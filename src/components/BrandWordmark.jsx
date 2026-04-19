import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function BrandWordmark({
  size = 28,
  mainColor = COLORS.textPrimary,
  accentColor = COLORS.primary,
  style,
}) {
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.main, { fontSize: size, color: mainColor }]}>Fash</Text>
      <Text style={[styles.accent, { fontSize: size, color: accentColor }]}>IQ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  main: { fontWeight: '900' },
  accent: { fontWeight: '900', fontStyle: 'italic' },
});
