# Chess Reels × DecayChess — Integration Guide

> A step-by-step record of how the standalone Chess Reels app (`d:\chesstest\backend` + `d:\chesstest\frontend`) was merged into the DecayChess monorepo (`d:\chesstest\DecayChess`).

---

## Table of Contents

1. [Overview](#overview)
2. [Project Layout (Before Merge)](#project-layout-before-merge)
3. [Phase 1 — Backend Merge](#phase-1--backend-merge)
4. [Phase 2 — Frontend Restyling](#phase-2--frontend-restyling)
5. [Phase 3 — Reels Tab Integration](#phase-3--reels-tab-integration)
6. [Environment Setup](#environment-setup)
7. [Import Path Mapping](#import-path-mapping)
8. [Running the App](#running-the-app)

---

## Overview

The goal was to merge two separate applications:

| App | Description | Stack |
|-----|-------------|-------|
| **Chess Reels** (`backend/` + `frontend/`) | Instagram-style chess learning reels with video, engagement, streaks, admin panel | Node/Express, React Native (Expo) |
| **DecayChess** (`DecayChess/`) | Real-time multiplayer chess app with tournaments, matchmaking, leaderboards, WebSocket gameplay | Node/Express, React Native (Expo) |

The merge brings Chess Reels features into DecayChess as a new "Reels" tab, reusing DecayChess's existing auth, user model, and server infrastructure.

---

## Project Layout (Before Merge)

```
d:\chesstest\
├── backend/                    # Chess Reels backend (standalone)
│   ├── controllers/
│   │   ├── reelController.js
│   │   ├── engagementController.js
│   │   ├── adminController.js
│   │   ├── streakController.js
│   │   ├── dataController.js
│   │   └── authController.js
│   ├── models/
│   │   ├── Reel.js
│   │   ├── Comment.js
│   │   ├── ChessGame.js
│   │   ├── Grandmaster.js
│   │   ├── User.js             # ← NOT copied (DecayChess has its own)
│   │   ├── UserLike.js
│   │   ├── UserSave.js
│   │   └── UserStreak.js
│   ├── routes/
│   │   ├── reelRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── uploadRoute.js
│   │   ├── streakRoutes.js
│   │   ├── dataRoutes.js
│   │   └── authRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   └── server.js
│
├── frontend/                   # Chess Reels frontend (standalone)
│   └── app/
│       ├── admin/upload.tsx
│       ├── components/
│       ├── constants/themes.ts
│       └── ...
│
└── DecayChess/                 # Target monorepo
    ├── client/                 # React Native app
    │   └── app/
    │       ├── (auth)/
    │       ├── (main)/
    │       ├── (game)/
    │       ├── (offline)/
    │       ├── components/
    │       └── lib/
    └── server/                 # Express backend
        ├── controllers/
        ├── models/
        ├── router/
        ├── middlewares/
        ├── Websockets/
        └── index.js
```

---

## Phase 1 — Backend Merge

### What Was Done

Copied Chess Reels backend components into DecayChess's server, adjusting all import paths to match DecayChess's project structure.

### Step 1: Copy Models (7 files)

Copied directly from `backend/models/` → `DecayChess/server/models/`:

| File | Purpose |
|------|---------|
| `Reel.js` | Reel schema (title, video URL, FEN, grandmaster, metadata) |
| `Comment.js` | Comment schema with reply support |
| `ChessGame.js` | Chess game reference data |
| `Grandmaster.js` | Grandmaster folder/catalog |
| `UserLike.js` | User ↔ Reel like tracking |
| `UserSave.js` | User ↔ Reel save/bookmark tracking |
| `UserStreak.js` | Daily streak tracking |

> **Important:** `User.js` was **NOT** copied. DecayChess already has `user.model.js` with its own user schema. All controllers reference DecayChess's user model instead.

### Step 2: Copy & Adjust Controllers (5 files)

| File | Changes Made |
|------|-------------|
| `reelController.js` | Copied as-is (no User model dependency) |
| `engagementController.js` | Copied as-is (uses reel models only) |
| `adminController.js` | Fixed dynamic import: `../models/User.js` → `../models/user.model.js` |
| `streakController.js` | Copied as-is |
| `dataController.js` | **Rewritten** — changed `User` import to `../models/user.model.js`, changed `JWT_SECRET` (from `config/env.js`) to `process.env.SECRET_KEY` |

> **Not copied:** `authController.js` — DecayChess already has its own auth system.

### Step 3: Create Auth Middleware

Created `DecayChess/server/middlewares/auth.middleware.js` with two middleware functions:

```javascript
// verifyToken — validates JWT for regular authenticated routes
export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
};

// verifyAdmin — validates JWT + checks isAdmin flag
export const verifyAdmin = (req, res, next) => {
    // Same as verifyToken but also checks decoded.isAdmin
};
```

> **Key difference from Chess Reels:** Uses `SECRET_KEY` (DecayChess convention) instead of `JWT_SECRET`.

### Step 4: Create Route Files (5 files)

Created in `DecayChess/server/router/`:

| Route File | Mounts At | Endpoints |
|------------|-----------|-----------|
| `reelRoutes.js` | `/api/reels` | Feed, random, grandmaster filter, view, stats, like/unlike, comment, save |
| `adminRoutes.js` | `/api/admin` | Upload video, CRUD grandmasters, admin stats, folder management |
| `uploadRoute.js` | `/api/upload` | Multer-based video + thumbnail upload |
| `streakRoutes.js` | `/api/streak` | Get streak, record activity |
| `dataRoutes.js` | `/api/data` | Token info (`/me`), all data dump (`/all`) |

### Step 5: Wire Into `index.js`

Added to `DecayChess/server/index.js`:

```javascript
// New imports
import reelRoutes from "./router/reelRoutes.js";
import adminRoutes from "./router/adminRoutes.js";
import uploadRoutes from "./router/uploadRoute.js";
import streakRoutes from "./router/streakRoutes.js";
import dataRoutes from "./router/dataRoutes.js";

// Static file serving (for uploaded videos/thumbnails)
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));

// Route mounting
app.use("/api/reels", reelRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/data", dataRoutes);
```

### Step 6: Add Dependencies

Added `multer` to `package.json` for file upload support:

```json
"multer": "^2.0.2"
```

### Step 7: Create `.env` File

Created `DecayChess/server/.env`:

```properties
PORT=3000
HOST=0.0.0.0
MONGO_URI=mongodb://127.0.0.1:27017/Chess
SECRET_KEY=change_me
REDIS_URL=redis://127.0.0.1:6379
CORS_ALLOW_ALL=true
CORS_ALLOWED_ORIGINS=http://localhost:8081,exp://localhost,exp://127.0.0.1
BASE_URL=http://localhost:3000
```

---

## Phase 2 — Frontend Restyling

### What Was Done

Restyled the entire DecayChess client from its original green/dark-gray theme to a **neon/cyber** theme that matches the Chess Reels aesthetic.

### Color Mapping

| Old (DecayChess) | New (Neon/Cyber) | Usage |
|------------------|------------------|-------|
| `#1C1C1E` / `#23272A` | `#0F0F23` | Main background |
| `#2C2C2E` | `#1A1A2E` | Surface / header bg |
| `#2C2B29` | `#16213E` | Card backgrounds |
| `#4CAF50` / `#00A862` / `#69923e` | `#00D9FF` | Primary accent (cyan) |
| — | `#7B2FF7` | Secondary accent (purple) |
| `#b0b3b8` | `#A0A0B0` | Secondary text |
| `#E8E8E8` / `#D0D0D0` | `#E0E0E8` | Primary text |

### Files Modified (~25+ files)

**Design Tokens:**
- `lib/styles/base.ts` — Core color tokens, gradients, shadows

**Layout Components:**
- `components/layout/BottomBar.tsx` — Tab bar + added Reels tab icon
- `components/layout/HeaderBar.tsx`
- `components/layout/TopNavBar.tsx`
- `components/layout/Layout.tsx`

**UI Components:**
- `components/ui/VariantCard.tsx`
- `components/ui/DecayShowcase.tsx`
- `components/ui/AnimatedSplash.tsx`
- `components/ui/Skeleton.tsx`

**Screen Stylesheets:**
- `lib/styles/screens/choose.ts`
- `lib/styles/screens/profile.ts`
- `lib/styles/screens/leaderboard.ts`
- `lib/styles/screens/tournament.ts`
- `lib/styles/screens/streak-master.ts`

**Screens (inline styles):**
- `(auth)/login.tsx`, `(auth)/signup.tsx`
- `(game)/_layout.tsx`
- `(offline)/_layout.tsx`, `(offline)/index.tsx`
- `(main)/matchmaking.tsx`, `(main)/newsletter.tsx`
- `_layout.tsx` (root)
- `lib/constants.ts` (UI_COLORS)

### How It Was Done

1. Updated `base.ts` design tokens first (single source of truth)
2. Updated all layout/UI components that import from `base.ts`
3. Used PowerShell batch scripts for mass-replacing hardcoded hex colors across all remaining files
4. Manual verification with `grep` to find and fix any remaining old colors

---

## Phase 3 — Reels Tab Integration

### What Was Done

Added a "Reels" tab to the DecayChess bottom navigation, wired up to a placeholder screen.

### Step 1: Created `reels.tsx` Screen

Created `DecayChess/client/app/(main)/reels.tsx`:

```tsx
export default function ReelsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>♟️ Chess Reels</Text>
            <Text style={styles.subtitle}>Coming Soon</Text>
        </View>
    );
}
```

### Step 2: Registered Route

Added to `(main)/_layout.tsx`:

```tsx
<Stack.Screen name="reels" options={{ headerShown: false }} />
```

### Step 3: Wired Navigation

In `BottomBar.tsx`:
- Added Reels tab icon (film/play icon with neon styling)
- Added `onSelectReels` callback prop

In `Layout.tsx`:
- Added `handleReels` function: `router.push("/(main)/reels")`
- Passed to `BottomBar` as `onSelectReels={handleReels}`

In `choose.tsx`:
- Connected layout's `handleReels` through navigation props

### Step 4: Updated `constants.ts`

Changed `DEFAULT_HOST` to LAN IP for physical device testing:

```typescript
const DEFAULT_HOST = '192.168.0.212';  // Your Wi-Fi IP
```

---

## Import Path Mapping

Key differences between Chess Reels backend and DecayChess backend imports:

| Chess Reels (Original) | DecayChess (Merged) | Notes |
|------------------------|---------------------|-------|
| `../models/User.js` | `../models/user.model.js` | DecayChess's user model |
| `../config/env.js` → `JWT_SECRET` | `process.env.SECRET_KEY` | Direct env access |
| `../middleware/auth.js` | `../middlewares/auth.middleware.js` | Different folder name |
| Routes in `routes/` | Routes in `router/` | Different folder name |
| `app.use("/reels", ...)` | `app.use("/api/reels", ...)` | DecayChess uses `/api/` prefix |
| `app.use("/admin", ...)` | `app.use("/api/admin", ...)` | DecayChess uses `/api/` prefix |

---

## Environment Setup

### Server (.env)

```properties
PORT=3000
HOST=0.0.0.0
MONGO_URI=mongodb://127.0.0.1:27017/Chess
SECRET_KEY=your_jwt_secret_here
REDIS_URL=redis://127.0.0.1:6379
CORS_ALLOW_ALL=true
CORS_ALLOWED_ORIGINS=http://localhost:8081,exp://localhost,exp://127.0.0.1
BASE_URL=http://localhost:3000
```

### Client

No `.env` file needed — the client uses hardcoded URLs in `lib/constants.ts`:

```typescript
const DEFAULT_HOST = '192.168.0.212';   // Your LAN IP
const DEFAULT_PORT = 3000;
const USE_MAIN_SERVER = false;          // Toggle for dev vs production
```

---

## Running the App

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongod` or MongoDB Atlas)
- Redis (optional, for session features)
- Expo Go on your phone (SDK 53)

### Start Backend

```bash
cd DecayChess/server
npm install
npm run dev
```

Expected output:
```
✅ Connected to MongoDB
🚀 Server running on http://0.0.0.0:3000
❌ Redis error: ...  # This is fine if Redis isn't running
```

### Start Frontend

```bash
cd DecayChess/client
npm install
npx expo start --offline --clear
```

Scan the QR code with Expo Go on your phone (same Wi-Fi network).

### API Endpoints (New)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reels` | — | Paginated feed |
| GET | `/api/reels/random` | — | Random discover reels |
| GET | `/api/reels/grandmasters` | — | Available grandmasters |
| GET | `/api/reels/grandmaster/:name` | — | Reels by grandmaster |
| POST | `/api/reels/:id/view` | — | Record view |
| POST | `/api/reels/:id/like` | Token | Like a reel |
| POST | `/api/reels/:id/unlike` | Token | Unlike |
| POST | `/api/reels/:id/comments` | Token | Add comment |
| POST | `/api/reels/:id/save` | Token | Save/bookmark |
| GET | `/api/streak` | Token | Get user streak |
| POST | `/api/streak/record` | Token | Record activity |
| POST | `/api/admin/video` | Admin | Upload reel |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| POST | `/api/upload` | — | File upload (video/thumbnail) |
| GET | `/api/data/me` | — | Token info |
| GET | `/api/data/all` | Admin | Full data dump |

---

## Summary

| Phase | What | Files Changed |
|-------|------|---------------|
| **Phase 1** | Backend merge — models, controllers, routes, middleware, deps | ~20 new/modified server files |
| **Phase 2** | Frontend restyling — neon/cyber theme across all screens | ~25+ client files |
| **Phase 3** | Reels tab — placeholder screen + navigation wiring | 4 client files |

**Total: ~50 files** created or modified to integrate Chess Reels into DecayChess.
