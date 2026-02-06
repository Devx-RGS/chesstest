import * as FileSystem from "expo-file-system/legacy";
import { Reel } from "@/types/reel";

const STORAGE_DIR = FileSystem.documentDirectory + "chess_app/";
const GAME_HISTORY_FILE = STORAGE_DIR + "game_history.json";
const PREFERENCES_FILE = STORAGE_DIR + "preferences.json";
const REELS_CACHE_FILE = STORAGE_DIR + "reels_cache.json";

export interface GameRecord {
    id: string;
    pgn: string;
    whitePlayer: string;
    blackPlayer: string;
    result: "1-0" | "0-1" | "1/2-1/2" | "*";
    timeControl: string;
    date: string;
}

export interface UserPreferences {
    boardTheme: string;
    soundEnabled: boolean;
    hapticEnabled: boolean;
    boardFlipped: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    boardTheme: "wood",
    soundEnabled: true,
    hapticEnabled: true,
    boardFlipped: false,
};

// Ensure storage directory exists
async function ensureStorageDir(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(STORAGE_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
    }
}

// Game History Functions
export async function saveGameHistory(game: GameRecord): Promise<void> {
    await ensureStorageDir();
    const history = await loadGameHistory();
    history.unshift(game); // Add to beginning
    // Keep only last 50 games
    const trimmedHistory = history.slice(0, 50);
    await FileSystem.writeAsStringAsync(
        GAME_HISTORY_FILE,
        JSON.stringify(trimmedHistory)
    );
}

export async function loadGameHistory(): Promise<GameRecord[]> {
    try {
        const fileInfo = await FileSystem.getInfoAsync(GAME_HISTORY_FILE);
        if (!fileInfo.exists) {
            return [];
        }
        const content = await FileSystem.readAsStringAsync(GAME_HISTORY_FILE);
        return JSON.parse(content) as GameRecord[];
    } catch (error) {
        console.error("Error loading game history:", error);
        return [];
    }
}

export async function deleteGameFromHistory(gameId: string): Promise<void> {
    const history = await loadGameHistory();
    const filtered = history.filter((g) => g.id !== gameId);
    await FileSystem.writeAsStringAsync(
        GAME_HISTORY_FILE,
        JSON.stringify(filtered)
    );
}

// User Preferences Functions
export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
    await ensureStorageDir();
    const current = await loadPreferences();
    const updated = { ...current, ...prefs };
    await FileSystem.writeAsStringAsync(
        PREFERENCES_FILE,
        JSON.stringify(updated)
    );
}

export async function loadPreferences(): Promise<UserPreferences> {
    try {
        const fileInfo = await FileSystem.getInfoAsync(PREFERENCES_FILE);
        if (!fileInfo.exists) {
            return DEFAULT_PREFERENCES;
        }
        const content = await FileSystem.readAsStringAsync(PREFERENCES_FILE);
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(content) };
    } catch (error) {
        console.error("Error loading preferences:", error);
        return DEFAULT_PREFERENCES;
    }
}

// Reels Cache Functions
export async function cacheReels(reels: Reel[]): Promise<void> {
    await ensureStorageDir();
    const cacheData = {
        reels,
        cachedAt: new Date().toISOString(),
    };
    await FileSystem.writeAsStringAsync(
        REELS_CACHE_FILE,
        JSON.stringify(cacheData)
    );
}

export async function getCachedReels(): Promise<Reel[]> {
    try {
        const fileInfo = await FileSystem.getInfoAsync(REELS_CACHE_FILE);
        if (!fileInfo.exists) {
            return [];
        }
        const content = await FileSystem.readAsStringAsync(REELS_CACHE_FILE);
        const data = JSON.parse(content);
        return data.reels || [];
    } catch (error) {
        console.error("Error loading cached reels:", error);
        return [];
    }
}

// Clear all storage (for logout)
export async function clearAllStorage(): Promise<void> {
    try {
        const dirInfo = await FileSystem.getInfoAsync(STORAGE_DIR);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(STORAGE_DIR, { idempotent: true });
        }
    } catch (error) {
        console.error("Error clearing storage:", error);
    }
}

// Get storage stats
export async function getStorageStats(): Promise<{
    gamesCount: number;
    reelsCached: number;
}> {
    const games = await loadGameHistory();
    const reels = await getCachedReels();
    return {
        gamesCount: games.length,
        reelsCached: reels.length,
    };
}
