import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api";
import { Reel } from "@/types/reel";
import { cacheReels, getCachedReels } from "./storageService";

interface ReelsResponse {
    success: boolean;
    reels: Reel[];
}

interface CommentResponse {
    success: boolean;
    comments: Comment[];
}

interface Comment {
    _id: string;
    reelId: string;
    userId: {
        _id: string;
        username: string;
        profile?: {
            avatarUrl?: string;
        };
    } | null;
    text: string;
    createdAt: string;
}

// Fetch all reels from the backend
async function fetchReels(): Promise<Reel[]> {
    try {
        // Try the new /reels endpoint first
        const response = await apiClient.get<ReelsResponse>("/reels");
        const reels = response.data.reels || [];

        // Cache for offline use
        if (reels.length > 0) {
            await cacheReels(reels);
        }

        return reels;
    } catch (error) {
        console.error("Error fetching reels from /reels, trying /data/all:", error);

        // Fallback to /data/all endpoint
        try {
            const response = await apiClient.get<{ reels: Reel[] }>("/data/all");
            const reels = (response.data.reels || []).filter(r => r.status === "published");

            if (reels.length > 0) {
                await cacheReels(reels);
            }

            return reels;
        } catch (fallbackError) {
            console.error("Fallback also failed, trying cache:", fallbackError);
            return await getCachedReels();
        }
    }
}

// TanStack Query hook for fetching reels
export function useReels() {
    return useQuery({
        queryKey: ["reels"],
        queryFn: fetchReels,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 2,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });
}

// Get a single reel by ID
export function useReel(reelId: string) {
    return useQuery({
        queryKey: ["reel", reelId],
        queryFn: async () => {
            const allReels = await fetchReels();
            return allReels.find((reel) => reel._id === reelId) || null;
        },
        enabled: !!reelId,
    });
}

// Like a reel with optimistic update
export function useLikeReel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ reelId, action }: { reelId: string; action: "like" | "unlike" }) => {
            const response = await apiClient.patch(`/reels/${reelId}/like`, { action });
            return response.data;
        },
        // Note: Optimistic updates are handled by the Zustand store in reels.tsx
        onError: (err) => {
            console.error("Like mutation failed:", err);
            // Store rollback is handled by the component if needed
        },
        // Invalidate queries to sync like counts across All Reels and Games views
        onSettled: () => {
            // Invalidate all reels-related queries to ensure consistency
            queryClient.invalidateQueries({ queryKey: ["reels"] });
            queryClient.invalidateQueries({ queryKey: ["reels-by-game"] });
        },
    });
}

// Fetch user's liked reel IDs from server
interface LikedReelsResponse {
    success: boolean;
    likedReelIds: string[];
}

export function useUserLikedReels() {
    return useQuery({
        queryKey: ["user-liked-reels"],
        queryFn: async () => {
            const response = await apiClient.get<LikedReelsResponse>("/reels/liked");
            return response.data.likedReelIds || [];
        },
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
    });
}

// Save a reel with optimistic update
export function useSaveReel() {
    return useMutation({
        mutationFn: async ({ reelId, action }: { reelId: string; action: "save" | "unsave" }) => {
            const response = await apiClient.patch(`/reels/${reelId}/save`, { action });
            return response.data;
        },
        onError: (err) => {
            console.error("Save mutation failed:", err);
        },
    });
}

// Fetch user's saved reel IDs from server
interface SavedReelsResponse {
    success: boolean;
    savedReelIds: string[];
}

export function useUserSavedReels() {
    return useQuery({
        queryKey: ["user-saved-reels"],
        queryFn: async () => {
            const response = await apiClient.get<SavedReelsResponse>("/reels/saved");
            return response.data.savedReelIds || [];
        },
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
    });
}

// Record a unique view on a reel
export function useRecordView() {
    return useMutation({
        mutationFn: async ({ reelId, viewerId }: { reelId: string; viewerId: string }) => {
            const response = await apiClient.post(`/reels/${reelId}/view`, { viewerId });
            return response.data;
        },
        // Note: View count updates are handled by Zustand store (incrementViews)
        // We do NOT update React Query cache here to avoid sync loops
    });
}

// Get comments for a reel
export function useReelComments(reelId: string) {
    return useQuery({
        queryKey: ["reel-comments", reelId],
        queryFn: async () => {
            const response = await apiClient.get<CommentResponse>(`/reels/${reelId}/comments`);
            return response.data.comments || [];
        },
        enabled: !!reelId,
        staleTime: 60 * 1000, // 1 minute
    });
}

// Post a comment with optimistic update
export function usePostComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ reelId, text, userId }: { reelId: string; text: string; userId?: string }) => {
            const response = await apiClient.post(`/reels/${reelId}/comments`, { text, userId });
            return response.data;
        },
        onMutate: async ({ reelId, text }) => {
            await queryClient.cancelQueries({ queryKey: ["reel-comments", reelId] });

            const previousComments = queryClient.getQueryData<Comment[]>(["reel-comments", reelId]);

            // Optimistically add comment
            const optimisticComment: Comment = {
                _id: `temp-${Date.now()}`,
                reelId,
                userId: null,
                text,
                createdAt: new Date().toISOString(),
            };

            queryClient.setQueryData<Comment[]>(["reel-comments", reelId], (old) => [
                optimisticComment,
                ...(old || []),
            ]);

            return { previousComments };
        },
        onError: (err, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(["reel-comments", variables.reelId], context.previousComments);
            }
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["reel-comments", variables.reelId] });
            queryClient.invalidateQueries({ queryKey: ["reels"] });
        },
    });
}

// Delete a comment
export function useDeleteComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ reelId, commentId }: { reelId: string; commentId: string }) => {
            const response = await apiClient.delete(`/reels/${reelId}/comments/${commentId}`);
            return response.data;
        },
        onMutate: async ({ reelId, commentId }) => {
            await queryClient.cancelQueries({ queryKey: ["reel-comments", reelId] });

            const previousComments = queryClient.getQueryData<Comment[]>(["reel-comments", reelId]);

            // Optimistically remove comment
            queryClient.setQueryData<Comment[]>(["reel-comments", reelId], (old) =>
                old?.filter((comment) => comment._id !== commentId) || []
            );

            return { previousComments };
        },
        onError: (err, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(["reel-comments", variables.reelId], context.previousComments);
            }
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["reel-comments", variables.reelId] });
            queryClient.invalidateQueries({ queryKey: ["reels"] });
        },
    });
}

// Format view count for display
export function formatCount(count: number): string {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
}

// Get difficulty color
export function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
        case "beginner":
            return "#10B981"; // green
        case "intermediate":
            return "#F59E0B"; // yellow
        case "advanced":
            return "#EF4444"; // red
        default:
            return "#6B7280"; // gray
    }
}

// ============== GRANDMASTERS API ==============

export interface GrandmasterItem {
    name: string;
    reelCount: number;
    thumbnail: string | null;
}

interface GrandmastersResponse {
    success: boolean;
    data: GrandmasterItem[];
    count: number;
}

interface ReelsByGrandmasterResponse {
    success: boolean;
    data: Reel[];
    grandmaster: { name: string };
    pagination: {
        currentPage: number;
        totalPages: number;
        totalReels: number;
        hasMore: boolean;
    };
}

// Get list of available grandmasters
export function useAvailableGrandmasters() {
    return useQuery({
        queryKey: ["available-grandmasters"],
        queryFn: async () => {
            const response = await apiClient.get<GrandmastersResponse>("/reels/grandmasters");
            return response.data.data || [];
        },
        staleTime: 60 * 1000,
    });
}

// Get reels for a specific grandmaster
export function useReelsByGrandmaster(name: string | null) {
    return useQuery({
        queryKey: ["reels-by-grandmaster", name],
        queryFn: async () => {
            const response = await apiClient.get<ReelsByGrandmasterResponse>(`/reels/grandmaster/${encodeURIComponent(name!)}`);
            return {
                reels: response.data.data || [],
                grandmaster: response.data.grandmaster,
            };
        },
        staleTime: 60 * 1000,
        enabled: !!name,
    });
}
