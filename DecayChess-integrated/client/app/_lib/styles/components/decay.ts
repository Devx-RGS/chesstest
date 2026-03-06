import { Dimensions, StyleSheet } from 'react-native'
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../base'

const screenWidth = Dimensions.get("window").width
const screenHeight = Dimensions.get("window").height
const isTablet = Math.min(screenWidth, screenHeight) > 600
const isSmallScreen = screenWidth < 380
const isVerySmallScreen = screenWidth < 320

// Improved responsive sizing for better centering
const horizontalPadding = isSmallScreen ? 8 : isTablet ? 20 : 12
const boardSize = screenWidth - horizontalPadding * 2
const squareSize = boardSize / 8

// Dynamic sizing based on screen size with better proportions
const playerInfoHeight = isSmallScreen ? 70 : isTablet ? 100 : 85
const gameStatusHeight = isSmallScreen ? 35 : 45
const bottomBarHeight = isSmallScreen ? 65 : 75
const decayTimerFontSize = isSmallScreen ? 8 : 10
const pieceFontSize = squareSize * (isSmallScreen ? 0.6 : isTablet ? 0.7 : 0.65)

// Improved spacing constants
const verticalSpacing = isSmallScreen ? 8 : isTablet ? 16 : 12
const componentSpacing = isSmallScreen ? 6 : isTablet ? 12 : 8

export const decayStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: isSmallScreen ? 30 : isTablet ? 60 : 50,
    paddingBottom: bottomBarHeight,
    paddingHorizontal: horizontalPadding,
  },
  boardContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: verticalSpacing,
    ...SHADOWS.medium,
    alignSelf: "center",
    paddingTop: 20,
    paddingBottom: 4,
    overflow: "visible",
  },
  board: {
    flexDirection: "column",
    borderRadius: 4,
    overflow: "visible",
    borderWidth: 2,
    borderColor: COLORS.surfaceLighter,
    width: boardSize,
    height: boardSize,
  },
  row: {
    flexDirection: "row",
    flex: 1,
    overflow: "visible",
  },
  square: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    flex: 1,
    overflow: "visible",
  },
  playerInfoContainer: {
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: isSmallScreen ? 12 : isTablet ? 20 : 16,
    paddingVertical: isSmallScreen ? 10 : isTablet ? 16 : 12,
    marginVertical: componentSpacing,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    minHeight: playerInfoHeight,
  },
  activePlayerContainer: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderColor: COLORS.accent,
    borderWidth: 2,
    ...SHADOWS.glow,
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerDetails: {
    flex: 1,
    marginRight: isSmallScreen ? 8 : 12,
  },
  playerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isSmallScreen ? 4 : 6,
  },
  playerAvatar: {
    width: isSmallScreen ? 32 : isTablet ? 48 : 40,
    height: isSmallScreen ? 32 : isTablet ? 48 : 40,
    borderRadius: isSmallScreen ? 16 : isTablet ? 24 : 20,
    backgroundColor: COLORS.surfaceLighter,
    justifyContent: "center",
    alignItems: "center",
    marginRight: isSmallScreen ? 8 : isTablet ? 16 : 12,
  },
  playerAvatarText: {
    color: COLORS.accent,
    fontSize: isSmallScreen ? 14 : isTablet ? 20 : 16,
    fontWeight: "bold",
  },
  playerNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  playerName: {
    color: COLORS.primaryText,
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: "600",
  },
  activePlayerName: {
    color: COLORS.accent,
  },
  playerRating: {
    color: COLORS.secondaryText,
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    marginTop: 2,
  },
  youIndicator: {
    color: COLORS.accent,
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    fontWeight: "500",
    backgroundColor: COLORS.accentGlow,
    paddingHorizontal: isSmallScreen ? 6 : 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  decayStatus: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  decayStatusText: {
    color: COLORS.accent,
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    marginRight: 12,
    marginTop: 2,
  },
  frozenStatusText: {
    color: COLORS.red,
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    marginTop: 2,
  },
  timerContainer: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: isSmallScreen ? 12 : isTablet ? 20 : 16,
    paddingVertical: isSmallScreen ? 8 : isTablet ? 12 : 10,
    borderRadius: 20,
    minWidth: isSmallScreen ? 70 : isTablet ? 100 : 80,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  activeTimerContainer: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  timerText: {
    color: COLORS.primaryText,
    fontSize: isSmallScreen ? 16 : isTablet ? 22 : 18,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  activeTimerText: {
    color: COLORS.background,
  },
  capturedPieces: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: isSmallScreen ? 8 : isTablet ? 16 : 12,
    paddingTop: isSmallScreen ? 6 : isTablet ? 12 : 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  capturedPieceGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  capturedCount: {
    color: COLORS.secondaryText,
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    marginLeft: 2,
    fontWeight: "bold",
  },
  gameStatusContainer: {
    alignItems: "center",
    marginVertical: componentSpacing,
    paddingHorizontal: 16,
    minHeight: gameStatusHeight,
    justifyContent: "center",
  },
  gameOverText: {
    color: COLORS.red,
    fontSize: isSmallScreen ? 16 : isTablet ? 22 : 18,
    fontWeight: "bold",
  },
  turnIndicator: {
    color: COLORS.secondaryText,
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    marginBottom: 4,
    textAlign: "center",
  },
  myTurnIndicator: {
    color: COLORS.accent,
    fontWeight: "600",
  },
  variantName: {
    color: COLORS.blue,
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.surfaceDark,
    paddingVertical: isSmallScreen ? 10 : isTablet ? 16 : 12,
    paddingHorizontal: horizontalPadding,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    height: bottomBarHeight,
  },
  bottomBarButton: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: isSmallScreen ? 8 : isTablet ? 16 : 12,
    borderRadius: 8,
    flex: 1,
  },
  bottomBarIcon: {
    fontSize: isSmallScreen ? 18 : isTablet ? 24 : 20,
    color: COLORS.accent,
    marginBottom: 4,
  },
  bottomBarLabel: {
    fontSize: isSmallScreen ? 10 : isTablet ? 14 : 12,
    color: COLORS.secondaryText,
    fontWeight: "500",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  moveHistoryModal: {
    backgroundColor: COLORS.modalBackground,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    width: "85%",
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: COLORS.glassBorderLight,
  },
  moveHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  moveHistoryTitle: {
    color: COLORS.primaryText,
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: COLORS.red,
    padding: 8,
    borderRadius: BORDER_RADIUS.small,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  moveHistoryScroll: {
    maxHeight: 300,
  },
  moveRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  moveNumber: {
    color: COLORS.mutedText,
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    width: 30,
    fontFamily: "monospace",
  },
  moveText: {
    color: COLORS.primaryText,
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    marginRight: 16,
    fontFamily: "monospace",
  },
  promotionModal: {
    backgroundColor: COLORS.modalBackground,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorderLight,
  },
  promotionTitle: {
    color: COLORS.primaryText,
    fontSize: isSmallScreen ? 16 : isTablet ? 20 : 18,
    fontWeight: "bold",
    marginBottom: SPACING.xl,
  },
  promotionOptions: {
    flexDirection: "row",
    gap: 12,
  },
  promotionOption: {
    backgroundColor: COLORS.surfaceLighter,
    padding: isSmallScreen ? 12 : isTablet ? 20 : 16,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  promotionPieceText: {
    color: COLORS.primaryText,
    fontSize: isSmallScreen ? 20 : isTablet ? 28 : 24,
    fontWeight: "bold",
  },
  gameEndModal: {
    backgroundColor: COLORS.modalBackground,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xxl,
    alignItems: "center",
    width: "85%",
    borderWidth: 2,
    borderColor: COLORS.glassBorderLight,
  },
  victoryModal: {
    borderColor: COLORS.green,
  },
  defeatModal: {
    borderColor: COLORS.red,
  },
  gameEndTitle: {
    fontSize: isSmallScreen ? 20 : isTablet ? 28 : 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: SPACING.lg,
    color: COLORS.primaryText,
  },
  victoryTitle: {
    color: COLORS.green,
  },
  defeatTitle: {
    color: COLORS.red,
  },
  gameEndMessage: {
    color: COLORS.primaryText,
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    textAlign: "center",
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  gameEndReason: {
    color: COLORS.secondaryText,
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    marginBottom: SPACING.sm,
  },
  gameEndMove: {
    color: COLORS.secondaryText,
    fontSize: isSmallScreen ? 12 : isTablet ? 16 : 14,
    marginBottom: SPACING.sm,
  },
  gameEndWinner: {
    color: COLORS.accent,
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: "bold",
    marginBottom: SPACING.lg,
  },
  menuButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
  },
  menuButtonText: {
    color: COLORS.white,
    fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
    fontWeight: "600",
  },
  coordinateLabel: {
    position: "absolute",
    fontWeight: "bold",
  },
  rankLabel: {
    left: 2,
    top: 2,
  },
  fileLabel: {
    right: 2,
    bottom: 2,
  },
  decayTimerAbove: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  decayTimerBox: {
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    paddingHorizontal: isSmallScreen ? 4 : 6,
    paddingVertical: 2,
    ...SHADOWS.small,
  },
  decayTimerBoxText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  frozenIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: COLORS.red,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  frozenText: {
    // fontSize is set dynamically in renderSquare
  },
  possibleMoveDot: {
    position: "absolute",
    backgroundColor: COLORS.accentDim,
    opacity: 0.6,
  },
  captureIndicator: {
    position: "absolute",
    backgroundColor: COLORS.red,
    top: 2,
    right: 2,
    opacity: 0.9,
  },
})

export const variantStyles = decayStyles
