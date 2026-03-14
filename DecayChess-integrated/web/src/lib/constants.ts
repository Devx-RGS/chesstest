// Server configuration
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export const API_BASE_URL = `${SERVER_URL}/api`;
export const WS_BASE_URL = SERVER_URL;

// Board theme
export const BOARD_THEME = {
  lightSquare: '#F0D9B5',
  darkSquare: '#B58863',
  highlight: {
    capture: '#dc2626',
    move: '#16a34a',
    selected: '#2563eb',
    lastMove: '#f59e0b',
    decay: '#ea580c',
    frozen: '#dc2626',
  },
  pieceScale: 0.85,
  moveDotScale: 0.25,
};

// App colors — emerald green theme
export const COLORS = {
  background: '#0D3B2E',
  surfaceDark: '#0A2E24',
  surface: '#10473A',
  surfaceLight: '#145B47',
  surfaceLighter: '#1A6B54',
  accent: '#F5A623',
  accentDim: 'rgba(245, 166, 35, 0.55)',
  accentGlow: 'rgba(245, 166, 35, 0.12)',
  primaryText: '#E8F0EC',
  secondaryText: '#8ABEA8',
  mutedText: '#5D7A6E',
  white: '#FFFFFF',
  red: '#E74C3C',
  green: '#2ECC71',
  yellow: '#FFD93D',
};

// Decay timer constants (match server)
export const QUEEN_INITIAL_DECAY_TIME = 25000;
export const MAJOR_PIECE_INITIAL_DECAY_TIME = 20000;
export const DECAY_TIME_INCREMENT = 2000;

// Piece image mapping
export const PIECE_IMAGES: Record<string, string> = {
  K: '/pieces/wk.png', Q: '/pieces/wq.png', R: '/pieces/wr.png',
  B: '/pieces/wb.png', N: '/pieces/wn.png', P: '/pieces/wp.png',
  k: '/pieces/bk.png', q: '/pieces/bq.png', r: '/pieces/br.png',
  b: '/pieces/bb.png', n: '/pieces/bn.png', p: '/pieces/bp.png',
};

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const PIECE_VALUES: Record<string, number> = {
  p: 1, P: 1, n: 3, N: 3, b: 3, B: 3, r: 5, R: 5, q: 9, Q: 9, k: 0, K: 0,
};

export const MAJOR_PIECES = ['q', 'r', 'b', 'n', 'Q', 'R', 'B', 'N'];
