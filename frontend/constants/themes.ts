// Chess board theme configurations
export type BoardTheme = "wood" | "marble" | "neon";

export interface BoardColors {
    light: string;
    dark: string;
    highlight: string;
    selected: string;
    lastMove: string;
    check: string;
    legalMove: string;
}

export const boardThemes: Record<BoardTheme, BoardColors> = {
    wood: {
        light: "#F0D9B5",
        dark: "#B58863",
        highlight: "#829769",
        selected: "#BBCC44",
        lastMove: "rgba(155, 199, 0, 0.41)",
        check: "rgba(255, 0, 0, 0.5)",
        legalMove: "rgba(0, 0, 0, 0.15)",
    },
    marble: {
        light: "#EEEED2",
        dark: "#769656",
        highlight: "#BACA44",
        selected: "#F6F669",
        lastMove: "rgba(155, 199, 0, 0.41)",
        check: "rgba(255, 0, 0, 0.5)",
        legalMove: "rgba(0, 0, 0, 0.12)",
    },
    neon: {
        light: "#1E3A5F",
        dark: "#0D1B2A",
        highlight: "#00D9FF",
        selected: "#7B2FF7",
        lastMove: "rgba(0, 217, 255, 0.3)",
        check: "rgba(255, 44, 223, 0.6)",
        legalMove: "rgba(0, 217, 255, 0.25)",
    },
};

// Time control presets (in seconds)
export interface TimeControl {
    name: string;
    initial: number; // Initial time in seconds
    increment: number; // Increment per move in seconds
    label: string;
    emoji: string;
}

export const timeControls: TimeControl[] = [
    { name: "bullet", initial: 60, increment: 0, label: "1+0", emoji: "⚡" },
    { name: "bullet", initial: 120, increment: 1, label: "2+1", emoji: "⚡" },
    { name: "blitz", initial: 180, increment: 0, label: "3+0", emoji: "🔥" },
    { name: "blitz", initial: 180, increment: 2, label: "3+2", emoji: "🔥" },
    { name: "blitz", initial: 300, increment: 0, label: "5+0", emoji: "🔥" },
    { name: "blitz", initial: 300, increment: 3, label: "5+3", emoji: "🔥" },
    { name: "rapid", initial: 600, increment: 0, label: "10+0", emoji: "⏱️" },
    { name: "rapid", initial: 900, increment: 10, label: "15+10", emoji: "⏱️" },
    { name: "classical", initial: 1800, increment: 0, label: "30+0", emoji: "🏛️" },
];

// App-wide colors
export const colors = {
    background: {
        primary: "#0F0F23",
        secondary: "#1A1A2E",
        tertiary: "#16213E",
    },
    accent: {
        cyan: "#00D9FF",
        purple: "#7B2FF7",
        pink: "#FF2CDF",
        green: "#22c55e",
    },
    glass: {
        light: "rgba(255, 255, 255, 0.05)",
        medium: "rgba(255, 255, 255, 0.1)",
        border: "rgba(255, 255, 255, 0.15)",
    },
    success: "#10B981",
    danger: "#EF4444",
    warning: "#F59E0B",
    text: {
        primary: "#FFFFFF",
        secondary: "#A0A0B0",
        muted: "#6B7280",
    },
};
