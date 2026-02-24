import { StyleSheet } from 'react-native'

// Base design tokens and common styles
export const COLORS = {
  // Main theme colors
  background: '#0F0F23',
  primaryGreen: '#00D9FF',
  white: '#FFFFFF',
  black: '#000000',

  // Chess board colors
  lightSquare: '#F0D9B5',
  darkSquare: '#B58863',
  selectedSquare: '#7FB069',
  lastMoveSquare: '#FFE135',
  possibleMoveSquare: 'rgba(127, 176, 105, 0.3)',

  // UI colors
  gray: '#666666',
  lightGray: '#CCCCCC',
  darkGray: '#1A1A2E',
  red: '#FF6B6B',
  blue: '#4ECDC4',
  yellow: '#FFE135',

  // Timer colors
  timerBackground: '#1A1A2E',
  timerText: '#FFFFFF',
  timerLow: '#FF6B6B',

  // Modal colors
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  modalBackground: '#16213E',

  // Text colors
  primaryText: '#E0E0E8',
  secondaryText: '#A0A0B0',
  mutedText: '#6B7280',
}

export const FONT_SIZES = {
  small: 12,
  medium: 14,
  large: 16,
  xlarge: 18,
  xxlarge: 20,
  title: 24,
  timer: 16,
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
}

export const BORDER_RADIUS = {
  small: 4,
  medium: 8,
  large: 12,
  round: 50,
}

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  }
}

// Base style objects that can be reused
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
    color: COLORS.primaryText,
    fontSize: FONT_SIZES.medium,
  },
  secondaryText: {
    color: COLORS.secondaryText,
    fontSize: FONT_SIZES.small,
  },
  button: {
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
})
