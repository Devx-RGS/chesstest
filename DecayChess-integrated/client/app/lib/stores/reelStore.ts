import { create } from "zustand";
import { Reel } from "../types/reel";

interface ReelState {
    reels: Reel[];
    currentIndex: number;
    targetScrollIndex: number | null;
    isLoading: boolean;
    error: string | null;

    // User interactions (stored locally for instant UI)
    likedReels: Set<string>;
    savedReels: Set<string>;

    // Actions
    setReels: (reels: Reel[]) => void;
    setCurrentIndex: (index: number) => void;
    setTargetScrollIndex: (index: number | null) => void;
    clearTargetScrollIndex: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    initLikedReels: (reelIds: string[]) => void;
    initSavedReels: (reelIds: string[]) => void;
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

    initLikedReels: (reelIds) => set({ likedReels: new Set(reelIds) }),
    initSavedReels: (reelIds) => set({ savedReels: new Set(reelIds) }),

    likeReel: (reelId) => {
        const { likedReels, reels } = get();
        const newLiked = new Set(likedReels);
        newLiked.add(reelId);
        const updatedReels = reels.map((r) =>
            r._id === reelId
                ? { ...r, engagement: { ...(r.engagement || { likes: 0, comments: 0, views: 0, saves: 0 }), likes: (r.engagement?.likes || 0) + 1 } }
                : r
        );
        set({ likedReels: newLiked, reels: updatedReels });
    },

    unlikeReel: (reelId) => {
        const { likedReels, reels } = get();
        const newLiked = new Set(likedReels);
        newLiked.delete(reelId);
        const updatedReels = reels.map((r) =>
            r._id === reelId
                ? { ...r, engagement: { ...(r.engagement || { likes: 0, comments: 0, views: 0, saves: 0 }), likes: Math.max(0, (r.engagement?.likes || 0) - 1) } }
                : r
        );
        set({ likedReels: newLiked, reels: updatedReels });
    },

    saveReel: (reelId) => {
        const { savedReels, reels } = get();
        const newSaved = new Set(savedReels);
        newSaved.add(reelId);
        const updatedReels = reels.map((r) =>
            r._id === reelId
                ? { ...r, engagement: { ...(r.engagement || { likes: 0, comments: 0, views: 0, saves: 0 }), saves: (r.engagement?.saves || 0) + 1 } }
                : r
        );
        set({ savedReels: newSaved, reels: updatedReels });
    },

    unsaveReel: (reelId) => {
        const { savedReels, reels } = get();
        const newSaved = new Set(savedReels);
        newSaved.delete(reelId);
        const updatedReels = reels.map((r) =>
            r._id === reelId
                ? { ...r, engagement: { ...(r.engagement || { likes: 0, comments: 0, views: 0, saves: 0 }), saves: Math.max(0, (r.engagement?.saves || 0) - 1) } }
                : r
        );
        set({ savedReels: newSaved, reels: updatedReels });
    },

    isLiked: (reelId) => get().likedReels.has(reelId),
    isSaved: (reelId) => get().savedReels.has(reelId),

    incrementViews: (reelId) => {
        const { reels } = get();
        const updatedReels = reels.map((r) =>
            r._id === reelId
                ? { ...r, engagement: { ...(r.engagement || { likes: 0, comments: 0, views: 0, saves: 0 }), views: (r.engagement?.views || 0) + 1 } }
                : r
        );
        set({ reels: updatedReels });
    },

    reset: () =>
        set({
            reels: [],
            currentIndex: 0,
            targetScrollIndex: null,
            isLoading: false,
            error: null,
            likedReels: new Set<string>(),
            savedReels: new Set<string>(),
        }),
}));
