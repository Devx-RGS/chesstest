import { StyleSheet } from 'react-native'
import { BORDER_RADIUS, COLORS, FONT_SIZES, GLASS, SHADOWS, SPACING } from '../base'

export const chooseScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: SPACING.xl,
  },
  connectingContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  connectingText: {
    color: COLORS.secondaryText,
    fontSize: FONT_SIZES.medium,
    marginTop: SPACING.sm,
  },
  variantsColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  rulesModal: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: GLASS.borderRadius,
    padding: SPACING.xxl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderColor: COLORS.glassBorderLight,
    borderWidth: 1,
    ...SHADOWS.glass,
  },
  rulesTitle: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  rulesContent: {
    maxHeight: 300,
    marginBottom: SPACING.xl,
  },
  rulesText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    lineHeight: 24,
    textAlign: 'left',
  },
  closeRulesButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.pill,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    alignSelf: 'center',
  },
  closeRulesButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    fontWeight: '700',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  navButton: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.medium,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  navButtonText: {
    color: COLORS.primaryText,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
  heading: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: SPACING.lg,
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  decayShowcaseWrapper: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
})
