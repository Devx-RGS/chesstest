import { create } from "zustand";
import { Reel } from "@/types/reel";

interface ReelState {
    // Current state
    reels: Reel[];
    currentIndex: number;
    targetScrollIndex: number | null;
    isLoading: boolean;
    error: string | null;

    // User interactions (stored locally)
    likedReels: Set<string>;
    savedReels: Set<string>;

    // Actions
    setReels: (reels: Reel[]) => void;
    setCurrentIndex: (index: number) => void;
    setTargetScrollIndex: (index: number | null) => void;
    clearTargetScrollIndex: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    initLikedReels: (reelIds: string[]) => void; // Initialize from server
    initSavedReels: (reelIds: string[]) => void; // Initialize from server
    likeReel: (reelId: string) => void;
    unlikeReel: (reelId: string) => void;
    saveReel: (reelId: string) => void;
    unsaveReel: (reelId: string) => void;
    isLiked: (reelId: string) => boolean;
    isSaved: (reelId: string) => boolean;
    incrementViews: (reelId: string) => void;
    reset: () => void;
}

export const useReelStore = create<ReelState>((set, get) => ({
    reels: [],
    currentIndex: 0,
    targetScrollIndex: null,
    isLoading: false,
    error: null,
    likedReels: new Set<string>(),
    savedReels: new Set<string>(),

    setReels: (reels) => set({ reels }),

    setCurrentIndex: (index) => set({ currentIndex: index }),

    setTargetScrollIndex: (index) => set({ targetScrollIndex: index }),

    clearTargetScrollIndex: () => set({ targetScrollIndex: null }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    // Initialize liked reels from server data (called on login/app load)
    initLikedReels: (reelIds) => {
        set({ likedReels: new Set(reelIds) });
    },

    // Initialize saved reels from server data (called on login/app load)
    initSavedReels: (reelIds) => {
        set({ savedReels: new Set(reelIds) });
    },

    likeReel: (reelId) => {
        const { likedReels, reels } = get();
        const newLikedReels = new Set(likedReels);
        newLikedReels.add(reelId);

        // Update engagement count locally
        const updatedReels = reels.map((reel) =>
            reel._id === reelId
                ? { ...reel, engagement: { ...(reel.engagement || { likes: 0, comments: 0, views: 0, saves: 0 }), likes: (reel.engagement?.likes || 0) + 1 } }
                : reel
        );

        set({ likedReels: newLikedReels, reels: updatedReels });
    },

    unlikeReel: (reelId) => {
        const { likedReels, reels } = get();
        const newLikedReels = new Set(likedReels);
        newLikedReels.delete(reelId);

        const updatedReels = reels.map((reel) =>
            reel._id === reelId
                ? { ...reel, engagement: { ...(reel.engagement || { likes: 0, comments: 0, views: 0, saves: 0 }), likes: Math.max(0, (reel.engagement?.likes || 0) - 1) } }
                : reel
        );

        set({ likedReels: newLikedReels, reels: updatedReels });
    },

    saveReel: (reelId) => {
        const { savedReels, reels } = get();
        const newSavedReels = new Set(savedReels);
        newSavedReels.add(reelId);

        const updatedReels = reels.map((reel) =>
            reel._id === reelId
                ? { ...reel, engagement: { ...(reel.engagement || { likes: 0, comments: 0, views: 0, saves: 0 }), saves: (reel.engagement?.saves || 0) + 1 } }
                : reel
        );

        set({ savedReels: newSavedReels, reels: updatedReels });
    },

    unsaveReel: (reelId) => {
        const { savedReels, reels } = get();
        const newSavedReels = new Set(savedReels);
        newSavedReels.delete(reelId);

        const updatedReels = reels.map((reel) =>
            reel._id === reelId
                ? { ...reel, engagement: { ...(reel.engagement || { likes: 0, comments: 0, views: 0, saves: 0 }), saves: Math.max(0, (reel.engagement?.saves || 0) - 1) } }
                : reel
        );

        set({ savedReels: newSavedReels, reels: updatedReels });
    },

    isLiked: (reelId) => get().likedReels.has(reelId),

    isSaved: (reelId) => get().savedReels.has(reelId),

    incrementViews: (reelId) => {
        const { reels } = get();
        const updatedReels = reels.map((reel) =>
            reel._id === reelId
                ? { ...reel, engagement: { ...(reel.engagement || { likes: 0, comments: 0, views: 0, saves: 0 }), views: (reel.engagement?.views || 0) + 1 } }
                : reel
        );
        set({ reels: updatedReels });
    },

    reset: () => set({
        reels: [],
        currentIndex: 0,
        targetScrollIndex: null,
        isLoading: false,
        error: null,
        likedReels: new Set<string>(),
        savedReels: new Set<string>(),
    }),
}));
