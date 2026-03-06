


/** 
 * =========================================================
 *  🔧 TOGGLE BETWEEN SERVERS
 *  Comment/uncomment to pick which one to use.
 * =========================================================
 */
const USE_MAIN_SERVER = false; // 👉 dev / local server
// const USE_MAIN_SERVER = true;  // 👉 production server

/** 
 * =========================================================
 *  SERVER ENDPOINTS
 * =========================================================
 */
const MAIN_HTTP = 'https://decaychess-1.onrender.com';
const MAIN_API = `${MAIN_HTTP}/api`;

const DEV_HTTP = process.env.EXPO_PUBLIC_WS_URL;
const DEV_API = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL = USE_MAIN_SERVER ? MAIN_API : DEV_API;
export const WS_BASE_URL = USE_MAIN_SERVER ? MAIN_HTTP : DEV_HTTP;

/** 
 * =========================================================
 *  ROUTES
 * =========================================================
 */
export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
  },
  MAIN: {
    HOME: '/',
    CHOOSE: '/choose',
    MATCHMAKING: '/matchmaking',
    TOURNAMENT: '/tournament',
    LEADERBOARD: '/leaderboard',
    PROFILE: '/profile',
    STREAK_MASTER: '/streak-master',
  },
  GAME: {
    TIME_CONTROLS: {
      CLASSIC: '/time-controls/classic',
      CRAZY: '/time-controls/crazy',
    },
    VARIANTS: {
      CLASSIC: '/variants/classic',
      CRAZY_HOUSE: '/variants/crazy-house',
      DECAY: '/variants/decay',
      SIX_POINTER: '/variants/six-pointer',
    },
  },
} as const;

/** 
 * =========================================================
 *  UI CONSTANTS
 * =========================================================
 */
export const COLORS = {
  PRIMARY: '#F5A623',
  BACKGROUND: '#080B14',
  SECONDARY: '#111629',
  TEXT: '#E0E0E8',
  TEXT_SECONDARY: '#A0A0B0',
} as const;

export const CHESS_VARIANTS = [
  { id: 'classic', name: 'Classic', description: 'Traditional chess game' },
  { id: 'crazy-house', name: 'Crazy House', description: 'Chess with piece drops' },
  { id: 'decay', name: 'Decay', description: 'Time-based variant' },
  { id: 'six-pointer', name: 'Six Pointer', description: 'Six-sided chess' },
] as const;

console.log(`✅ Using ${USE_MAIN_SERVER ? 'MAIN' : 'DEV'} server: ${API_BASE_URL}`);
