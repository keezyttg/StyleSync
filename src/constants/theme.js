import { Platform } from 'react-native';

// Design tokens for FashIQ
// Purpose: centralize color, spacing, typography, and elevation tokens.
// Keep existing named exports (COLORS, SPACING, BORDER_RADIUS, FONT_SIZE)
// so existing imports continue to work.

export const COLORS = {
  // Brand
  primary: '#AF11D3',
  primaryLight: '#D44EF0',
  primaryDark: '#8A0DAA',

  // Neutral / background
  white: '#FFFFFF',
  black: '#000000',
  background: '#FFFFFF',
  surface: '#F7F7F8',
  card: '#FFFFFF',
  border: '#E6E6EA',
  overlay: 'rgba(0,0,0,0.4)',

  // Text
  textPrimary: '#111827', // near-black for high contrast
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  placeholder: '#D1D5DB',

  // Status
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Accent
  star: '#FFB800',

  // Semantic aliases (recommended to use these in UI)
  primaryTextOnPrimary: '#FFFFFF',
};

export const DARK_COLORS = {
  primary: '#AF11D3',
  primaryLight: '#D44EF0',
  primaryDark: '#8A0DAA',
  white: '#111827',
  black: '#F9FAFB',
  background: '#111827',
  surface: '#1F2937',
  card: '#1F2937',
  border: '#374151',
  overlay: 'rgba(0,0,0,0.6)',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  placeholder: '#4B5563',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#3B82F6',
  star: '#FFB800',
  primaryTextOnPrimary: '#FFFFFF',
};

// Spacing scale (4pt baseline)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  gutter: 16,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Font sizes and a small typography helper
export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const TYPOGRAPHY = {
  fontFamily: {
    system: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  lineHeight: {
    tight: 18,
    normal: 22,
    relaxed: 28,
  },
};

// Simple shadow presets for cards and raised elements
export const ELEVATION = {
  low: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  medium: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  high: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
};

// Utility sizes for images/thumbnails used across the app
export const SIZES = {
  avatar: 40,
  avatarLarge: 72,
  itemThumb: 100,
  navBarHeight: 56,
};

// Backwards compatibility: keep single-level exports
export default {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  TYPOGRAPHY,
  ELEVATION,
  SIZES,
};
