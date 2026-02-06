import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BoardTheme } from "@/constants/themes";

interface ThemeState {
    // Board appearance
    boardTheme: BoardTheme;

    // App theme
    isDarkMode: boolean;

    // Preferences
    soundEnabled: boolean;
    hapticEnabled: boolean;
    animationsEnabled: boolean;
    showLegalMoves: boolean;
    showCoordinates: boolean;
    autoQueen: boolean; // Auto-promote to queen

    // Actions
    setBoardTheme: (theme: BoardTheme) => void;
    toggleDarkMode: () => void;
    toggleSound: () => void;
    toggleHaptic: () => void;
    toggleAnimations: () => void;
    toggleLegalMoves: () => void;
    toggleCoordinates: () => void;
    toggleAutoQueen: () => void;
    resetToDefaults: () => void;
}

const defaultState = {
    boardTheme: "wood" as BoardTheme,
    isDarkMode: true,
    soundEnabled: true,
    hapticEnabled: true,
    animationsEnabled: true,
    showLegalMoves: true,
    showCoordinates: true,
    autoQueen: false,
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            ...defaultState,

            setBoardTheme: (theme) => set({ boardTheme: theme }),

            toggleDarkMode: () =>
                set((state) => ({ isDarkMode: !state.isDarkMode })),

            toggleSound: () =>
                set((state) => ({ soundEnabled: !state.soundEnabled })),

            toggleHaptic: () =>
                set((state) => ({ hapticEnabled: !state.hapticEnabled })),

            toggleAnimations: () =>
                set((state) => ({ animationsEnabled: !state.animationsEnabled })),

            toggleLegalMoves: () =>
                set((state) => ({ showLegalMoves: !state.showLegalMoves })),

            toggleCoordinates: () =>
                set((state) => ({ showCoordinates: !state.showCoordinates })),

            toggleAutoQueen: () =>
                set((state) => ({ autoQueen: !state.autoQueen })),

            resetToDefaults: () => set(defaultState),
        }),
        {
            name: "theme-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
