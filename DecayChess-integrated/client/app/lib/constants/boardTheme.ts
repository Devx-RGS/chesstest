export const BOARD_THEME = {
  lightSquare: "#F0D9B5",
  darkSquare: "#B58863", // Updated to match the premium gold/brown color scheme from the game
  highlight: {
    capture: "#dc2626",
    move: "#16a34a",
    selected: "#2563eb",
    lastMove: "#f59e0b",
    decay: "#ea580c",
    frozen: "#dc2626",
  },
  pieceScale: 0.8,
  moveDotScale: 0.25,
  captureIndicatorScale: 0.3,
};

export type BoardHighlight =
  | "capture"
  | "move"
  | "selected"
  | "lastMove"
  | "decay"
  | "frozen"
  | null;
