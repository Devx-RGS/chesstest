import { Dimensions, StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONT_SIZES, GLASS, SHADOWS, SPACING } from '../base';

const { width: screenWidth } = Dimensions.get('window');

export const leaderboardScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    color: COLORS.white,
    fontSize: Math.min(screenWidth * 0.08, 30),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.secondaryText,
    fontSize: Math.min(screenWidth * 0.04, 15),
    fontWeight: '500',
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primaryText,
    fontSize: FONT_SIZES.large,
    fontWeight: '500',
    marginTop: SPACING.md,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.secondaryText,
    fontSize: FONT_SIZES.large,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: COLORS.glassBgLight,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.glassBorderLight,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
  },

  // Scroll Content
  scrollContent: {
    paddingBottom: 40,
  },

  // Full Rankings
  fullRankingsContainer: {
    paddingHorizontal: SPACING.xl,
  },
  fullRankingsTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xlarge,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    letterSpacing: 0.3,
  },

  // Player Cards
  playerCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: GLASS.borderRadius,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.glass,
  },
  topThreeCard: {
    borderColor: COLORS.glassBorderLight,
    borderWidth: 1,
    backgroundColor: COLORS.glassBgLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  // Rank Badge
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  goldRank: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  silverRank: {
    backgroundColor: 'rgba(192, 192, 192, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(192, 192, 192, 0.4)',
  },
  bronzeRank: {
    backgroundColor: 'rgba(205, 127, 50, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(205, 127, 50, 0.4)',
  },
  defaultRank: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  rankText: {
    fontSize: FONT_SIZES.large,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Player Info
  playerInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  playerName: {
    color: COLORS.white,
    fontSize: Math.min(screenWidth * 0.045, 17),
    fontWeight: '600',
    marginBottom: 3,
  },
  playerEmail: {
    color: COLORS.mutedText,
    fontSize: Math.min(screenWidth * 0.035, 13),
    fontWeight: '400',
  },

  // Rating
  ratingContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.accentGlow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accentDim,
  },
  ratingValue: {
    color: COLORS.white,
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: '700',
    marginBottom: 1,
  },
  ratingLabel: {
    color: COLORS.secondaryText,
    fontSize: Math.min(screenWidth * 0.025, 10),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: COLORS.white,
    fontSize: Math.min(screenWidth * 0.04, 15),
    fontWeight: '600',
    marginBottom: 3,
  },
  statLabel: {
    color: COLORS.mutedText,
    fontSize: Math.min(screenWidth * 0.028, 11),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.glassBorder,
    marginHorizontal: SPACING.sm,
  },

  // Footer
  footerSpace: {
    height: 40,
  },
})
