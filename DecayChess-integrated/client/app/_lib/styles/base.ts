// DecayChess — Premium Gold & Navy Design System — Polished
import { StyleSheet, Platform } from 'react-native'

// ─── Color Palette ───────────────────────────────────────────────
export const COLORS = {
  // Core backgrounds (deep navy, layered)
  background: '#080B14',
  surfaceDark: '#0C1021',
  surface: '#111629',
  surfaceLight: '#171D33',
  surfaceLighter: '#1E2545',

  // Accent colors — Gold/Amber
  accent: '#F5A623',
  accentDim: 'rgba(245, 166, 35, 0.55)',
  accentGlow: 'rgba(245, 166, 35, 0.12)',
  accentSoft: 'rgba(245, 166, 35, 0.08)',

  // Gradient pairs
  gradientStart: '#F5A623',
  gradientEnd: '#E8793A',
  gradientPurpleStart: '#6C3CE0',
  gradientPurpleEnd: '#3B1F8E',
  gradientWarmStart: '#FF6B6B',
  gradientWarmEnd: '#FF3366',

  // Chess board
  lightSquare: '#F0D9B5',
  darkSquare: '#B58863',
  selectedSquare: '#7FB069',
  lastMoveSquare: '#FFE135',
  possibleMoveSquare: 'rgba(127, 176, 105, 0.3)',

  // Glass — refined for readability
  glassBg: 'rgba(255, 255, 255, 0.04)',
  glassBgLight: 'rgba(255, 255, 255, 0.07)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderLight: 'rgba(255, 255, 255, 0.14)',

  // Text — WCAG-friendly contrast on dark bg
  white: '#FFFFFF',
  black: '#000000',
  primaryText: '#F0ECF8',      // Near-white, excellent contrast
  secondaryText: '#B0ACBE',    // Visible, not washed out
  mutedText: '#706D82',        // Subtle but readable
  captionText: '#5D5A72',      // Captions/labels

  // Status
  red: '#FF5C5C',
  green: '#4ADE80',
  yellow: '#FFD93D',
  blue: '#3B82F6',

  // Rank
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',

  // Legacy compat
  primaryGreen: '#F5A623',
  gray: '#666666',
  lightGray: '#CCCCCC',
  darkGray: '#171D33',
  timerBackground: '#171D33',
  timerText: '#FFFFFF',
  timerLow: '#FF5C5C',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  modalBackground: '#111629',
}

// ─── Glassmorphism Tokens ────────────────────────────────────────
export const GLASS = {
  blur: Platform.OS === 'ios' ? 40 : 20,
  blurLight: Platform.OS === 'ios' ? 25 : 12,
  tint: 'dark' as const,
  bgOpacity: 0.06,
  borderWidth: 1,
  borderRadius: 16,
  borderRadiusLg: 20,
  borderRadiusSm: 12,
  borderRadiusPill: 999,
}

// ─── Typography Scale (8pt-aligned) ─────────────────────────────
export const FONT_SIZES = {
  xs: 10,
  caption: 11,
  small: 12,
  body2: 13,
  medium: 14,
  body: 15,
  large: 16,
  xlarge: 18,
  xxlarge: 20,
  title: 24,
  hero: 28,
  display: 32,
  timer: 16,
}

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
}

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

// ─── Font Families ────────────────────────────────────────────────
export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
}

// ─── Spacing (8pt grid) ─────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
}

// ─── Border Radius ───────────────────────────────────────────────
export const BORDER_RADIUS = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
  round: 50,
  pill: 999,
}

// ─── Shadows ─────────────────────────────────────────────────────
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  glass: {
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  glow: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
}

// ─── Base Styles ─────────────────────────────────────────────────
export const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  spaceAround: {
    justifyContent: 'space-around',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: FONTS.regular,
    color: COLORS.primaryText,
    fontSize: FONT_SIZES.body,
  },
  secondaryText: {
    fontFamily: FONTS.regular,
    color: COLORS.secondaryText,
    fontSize: FONT_SIZES.small,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: FONTS.semibold,
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
  },
})
