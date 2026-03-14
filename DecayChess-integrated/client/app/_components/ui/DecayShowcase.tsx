import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  BORDER_RADIUS,
  COLORS as THEME_COLORS,
  FONT_SIZES,
  SHADOWS,
  SPACING,
} from "@/app/_lib/styles/base";
import { getPieceComponent } from "../game/chessPieces";

type PieceColor = "white" | "black";

type Piece = {
  id: string;
  color: PieceColor;
  pieceKey: string; // Used by getPieceComponent (e.g. 'K', 'q', 'r')
  isQueen?: boolean;
};

type BoardState = Record<string, Piece | undefined>;

type ShowcaseMove = {
  note: string;
  from?: string;
  to?: string;
  isQueenMove?: "white" | "black";
  activatesTimer?: boolean;
  drainsTimer?: boolean;
  decayBonus?: number;
  reset?: boolean;
};

type LastMove = {
  from?: string;
  to?: string;
};

const MOVE_INTERVAL_MS = 1800;
const DECAY_TIMER_START = 25; // Updated per user request to match actual Decay Chess
const DECAY_DRAIN_PER_MOVE = 8;

const BOARD_COLUMNS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const BOARD_ROWS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

const INITIAL_POSITIONS: { square: string; piece: Piece }[] = [
  { square: "e1", piece: { id: "wK", color: "white", pieceKey: "K" } },
  { square: "d1", piece: { id: "wQ", color: "white", pieceKey: "Q", isQueen: true } },
  { square: "a1", piece: { id: "wR1", color: "white", pieceKey: "R" } },
  { square: "h1", piece: { id: "wR2", color: "white", pieceKey: "R" } },
  { square: "d2", piece: { id: "wP1", color: "white", pieceKey: "P" } },
  { square: "f2", piece: { id: "wP2", color: "white", pieceKey: "P" } },
  { square: "g2", piece: { id: "wP3", color: "white", pieceKey: "P" } },
  { square: "h2", piece: { id: "wP4", color: "white", pieceKey: "P" } },
  { square: "e8", piece: { id: "bK", color: "black", pieceKey: "k" } },
  { square: "d8", piece: { id: "bQ", color: "black", pieceKey: "q", isQueen: true } },
  { square: "c8", piece: { id: "bB", color: "black", pieceKey: "b" } },
  { square: "g8", piece: { id: "bN", color: "black", pieceKey: "n" } },
  { square: "h8", piece: { id: "bR2", color: "black", pieceKey: "r" } },
  { square: "d7", piece: { id: "bP1", color: "black", pieceKey: "p" } },
  { square: "e7", piece: { id: "bP2", color: "black", pieceKey: "p" } },
  { square: "f7", piece: { id: "bP3", color: "black", pieceKey: "p" } },
  { square: "g7", piece: { id: "bP4", color: "black", pieceKey: "p" } },
  { square: "h7", piece: { id: "bP5", color: "black", pieceKey: "p" } },
];

const SHOWCASE_MOVES: ShowcaseMove[] = [
  { note: "Watch a Decay duel—both queens will race against time.", reset: true },
  { from: "d2", to: "d4", note: "White opens the center so the queen can break out." },
  { from: "d7", to: "d5", note: "Black challenges." },
  { from: "d1", to: "d3", note: "White queen moves! Her 25s timer begins.", isQueenMove: "white", activatesTimer: true },
  { from: "d8", to: "d6", note: "Black queen enters the fray. Her timer starts too.", isQueenMove: "black", activatesTimer: true },
  { from: "d3", to: "g3", note: "White queen shifts, shedding an 8s chunk off the clock.", isQueenMove: "white", drainsTimer: true },
  { from: "d6", to: "g6", note: "Black queen mirrors, her clock also drains.", isQueenMove: "black", drainsTimer: true },
  { from: "g3", to: "h3", note: "White queen burns more time.", isQueenMove: "white", drainsTimer: true },
  { from: "g6", to: "h6", note: "Black queen follows suit.", isQueenMove: "black", drainsTimer: true },
  { from: "h3", to: "e3", note: "White queen is down to 1 second!", isQueenMove: "white", drainsTimer: true },
  { from: "h6", to: "e6", note: "Black queen is also on the brink.", isQueenMove: "black", drainsTimer: true },
  { from: "e3", to: "c3", note: "White queen's 25s timer empties. She is REMOVED.", isQueenMove: "white", drainsTimer: true },
  { from: "e6", to: "c6", note: "Black queen is also removed! Both are gone.", isQueenMove: "black", drainsTimer: true },
  { from: "g1", to: "f3", note: "Now other pieces must take over the fight." },
];

const createInitialBoard = (): BoardState => {
  const board: BoardState = {};
  INITIAL_POSITIONS.forEach(({ square, piece }) => {
    board[square] = { ...piece };
  });
  return board;
};

const DecayShowcase = () => {
  const [boardState, setBoardState] = useState<BoardState>(() => createInitialBoard());
  const [moveIndex, setMoveIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState(SHOWCASE_MOVES[0].note);
  const [lastMove, setLastMove] = useState<LastMove>({});
  const [whiteTimer, setWhiteTimer] = useState(DECAY_TIMER_START);
  const [whiteActive, setWhiteActive] = useState(false);

  const [blackTimer, setBlackTimer] = useState(DECAY_TIMER_START);
  const [blackActive, setBlackActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMoveIndex((prev) => (prev + 1) % SHOWCASE_MOVES.length);
    }, MOVE_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [moveIndex]);

  useEffect(() => {
    const move = SHOWCASE_MOVES[moveIndex];
    setStatusMessage(move.note);

    if (move.reset) {
      setBoardState(createInitialBoard());
      setWhiteActive(false); setWhiteTimer(DECAY_TIMER_START);
      setBlackActive(false); setBlackTimer(DECAY_TIMER_START);
      setLastMove({});
      return;
    }

    if (move.from && move.to) {
      const fromSquare = move.from;
      const toSquare = move.to;

      setBoardState((prev) => {
        const movingPiece = prev[fromSquare];
        if (!movingPiece) {
          return prev;
        }
        const updated: BoardState = { ...prev };
        delete updated[fromSquare];
        updated[toSquare] = { ...movingPiece };
        return updated;
      });
      setLastMove({ from: fromSquare, to: toSquare });
    } else {
      setLastMove({});
    }

    if (move.isQueenMove === "white") {
      if (move.activatesTimer) setWhiteActive(true);
      if (move.drainsTimer) {
        setWhiteTimer((prev) => {
          const next = Math.max(prev - DECAY_DRAIN_PER_MOVE + (move.decayBonus ?? 0), 0);
          if (next === 0) {
            setWhiteActive(false);
            setBoardState((board) => {
              const updated = { ...board };
              // Find and remove White Queen
              Object.keys(updated).forEach(sq => {
                if (updated[sq]?.isQueen && updated[sq]?.color === "white") {
                  delete updated[sq];
                }
              });
              return updated;
            });
          }
          return next;
        });
      }
    } else if (move.isQueenMove === "black") {
      if (move.activatesTimer) setBlackActive(true);
      if (move.drainsTimer) {
        setBlackTimer((prev) => {
          const next = Math.max(prev - DECAY_DRAIN_PER_MOVE + (move.decayBonus ?? 0), 0);
          if (next === 0) {
            setBlackActive(false);
            setBoardState((board) => {
              const updated = { ...board };
              // Find and remove Black Queen
              Object.keys(updated).forEach(sq => {
                if (updated[sq]?.isQueen && updated[sq]?.color === "black") {
                  delete updated[sq];
                }
              });
              return updated;
            });
          }
          return next;
        });
      }
    }
  }, [moveIndex]);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Preview</Text>
        </View>

        <View style={styles.boardContainer}>
          {BOARD_ROWS.map((row) => (
            <View key={row} style={styles.boardRow}>
              {BOARD_COLUMNS.map((column, index) => {
                const square = `${column}${row}`;
                const piece = boardState[square];
                const isLightSquare = (row + index) % 2 === 0;
                const isLastMoveSquare = lastMove.from === square || lastMove.to === square;
                const isQueenSquare = piece?.isQueen;
                const isWhiteQueen = isQueenSquare && piece?.color === "white";
                const isBlackQueen = isQueenSquare && piece?.color === "black";
                const qActive = (isWhiteQueen && whiteActive) || (isBlackQueen && blackActive);
                const qTimer = isWhiteQueen ? whiteTimer : (isBlackQueen ? blackTimer : 0);

                return (
                  <View
                    key={square}
                    style={[
                      styles.square,
                      { backgroundColor: isLightSquare ? THEME_COLORS.lightSquare : THEME_COLORS.darkSquare },
                      isLastMoveSquare && styles.lastMoveSquare,
                      qActive && styles.decayPulse,
                    ]}
                  >
                    {piece ? (
                      <View>
                        {getPieceComponent(piece.pieceKey, 20)}
                      </View>
                    ) : null}

                    {isQueenSquare && qActive && (
                      <View style={[styles.inlineTimerOverlay]}>
                        <Text style={[styles.inlineTimerText]} numberOfLines={1}>
                          {qTimer}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <Text style={styles.caption} numberOfLines={2} ellipsizeMode="tail">
          {statusMessage}
        </Text>
      </View>
    </View>
  );
};

export default DecayShowcase;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#10473A",
    borderRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    width: "100%",
    height: 380,
    overflow: "hidden",
    ...SHADOWS.small,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  title: {
    color: THEME_COLORS.white,
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: "600",
  },
  subtitle: {
    color: THEME_COLORS.secondaryText,
    fontSize: FONT_SIZES.small,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: "transparent",
  },
  badgeText: {
    color: THEME_COLORS.white,
    fontSize: FONT_SIZES.small,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  badgeLive: {
    backgroundColor: "rgba(0, 168, 98, 0.15)",
    borderColor: "#F5A623",
  },
  badgeIdle: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  badgeFrozen: {
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    borderColor: "#FF6B6B",
  },
  boardContainer: {
    width: "100%",
    maxWidth: 220,
    maxHeight: 220,
    aspectRatio: 1,
    alignSelf: "center",
    borderRadius: BORDER_RADIUS.medium,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#1F1F21",
    marginBottom: SPACING.md,
  },
  boardRow: {
    flex: 1,
    flexDirection: "row",
  },
  square: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pieceText: {
    fontSize: 22,
  },
  whitePiece: {
    color: "#fff",
  },
  blackPiece: {
    color: "#1b1b1b",
  },
  lastMoveSquare: {
    borderWidth: 2,
    borderColor: "#FFE135",
  },
  decayPulse: {
    borderWidth: 2,
    borderColor: "rgba(0, 168, 98, 0.6)",
  },
  frozenSquare: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  frozenPieceContainer: {
    opacity: 0.5, // Visual queue to simulate frozen PNG piece
  },
  inlineTimerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: "rgba(245, 166, 35, 0.5)",
  },
  inlineTimerText: {
    color: "#F5A623",
    fontSize: 7,
    fontWeight: "700",
  },
  caption: {
    color: THEME_COLORS.white,
    fontSize: FONT_SIZES.small,
    lineHeight: 18,
  },
});
