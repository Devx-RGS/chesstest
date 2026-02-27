import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./apiClient";
import { Reel } from "../types/reel";
import { useAuthStore } from "../stores/authStore";

interface AdminVideosResponse {
    success: boolean;
    count: number;
    data: Reel[];
}

interface AdminVideoResponse {
    success: boolean;
    data: Reel;
    uploadedBy?: string;
}

interface AdminStatsResponse {
    success: boolean;
    stats: {
        totalReels: number;
        publishedReels: number;
        draftReels: number;
        totalViews: number;
        totalLikes: number;
    };
}

export interface PostReelData {
    videoUrl: string;
    title: string;
    description: string;
    fenString?: string;
    tags?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    folder?: "random" | "grandmaster";
    grandmaster?: string | null;
    thumbnailUrl?: string;
    whitePlayer?: string;
    blackPlayer?: string;
    interactive?: {
        chessFen?: string;
        triggerTimestamp?: number;
        playerColor?: 'w' | 'b' | null;
        challengePrompt?: string;
        solutionMoves?: string[];
        difficultyRating?: number;
    };
}

// Fetch all reels for admin (including drafts)
async function fetchAdminReels(): Promise<Reel[]> {
    try {
        const response = await apiClient.get<AdminVideosResponse>("/admin/videos");
        console.log(`[AdminAPI] fetchAdminReels: got ${response.data.data?.length ?? 0} reels`);
        return response.data.data || [];
    } catch (error: any) {
        console.error("[AdminAPI] fetchAdminReels FAILED:", error?.response?.status, error?.response?.data || error?.message);
        throw error; // Re-throw so React Query can track the error state
    }
}

// Fetch admin stats
async function fetchAdminStats(): Promise<AdminStatsResponse["stats"]> {
    try {
        const response = await apiClient.get<AdminStatsResponse>("/admin/stats");
        return response.data.stats;
    } catch {
        const reels = await fetchAdminReels();
        return {
            totalReels: reels.length,
            publishedReels: reels.filter((r) => r.status === "published").length,
            draftReels: reels.filter((r) => r.status === "draft").length,
            totalViews: reels.reduce((sum, r) => sum + (r.engagement?.views || 0), 0),
            totalLikes: reels.reduce((sum, r) => sum + (r.engagement?.likes || 0), 0),
        };
    }
}

// Hook: Get all admin reels
export function useAdminReels() {
    const token = useAuthStore((s) => s.token);
    const isAdmin = useAuthStore((s) => s.isAdmin);
    return useQuery({
        queryKey: ["admin-reels"],
        queryFn: fetchAdminReels,
        staleTime: 2 * 60 * 1000,
        enabled: !!token && isAdmin,
    });
}

// Hook: Get admin stats
export function useAdminStats() {
    const token = useAuthStore((s) => s.token);
    const isAdmin = useAuthStore((s) => s.isAdmin);
    return useQuery({
        queryKey: ["admin-stats"],
        queryFn: fetchAdminStats,
        staleTime: 60 * 1000,
        enabled: !!token && isAdmin,
    });
}

// Hook: Post new reel
export function usePostReel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reelData: PostReelData) => {
            const payload = {
                adminId: "admin",
                videoData: {
                    video: {
                        url: reelData.videoUrl,
                        thumbnail: reelData.thumbnailUrl || "",
                        durationSec: 0,
                    },
                    content: {
                        title: reelData.title,
                        description: reelData.description,
                        tags: reelData.tags || [],
                        difficulty: reelData.difficulty || "beginner",
                        whitePlayer: reelData.whitePlayer || null,
                        blackPlayer: reelData.blackPlayer || null,
                    },
                    gameId: null,
                    interactive: reelData.interactive ? {
                        chessFen: reelData.interactive.chessFen || null,
                        triggerTimestamp: reelData.interactive.triggerTimestamp || null,
                        playerColor: reelData.interactive.playerColor ?? null,
                        challengePrompt: reelData.interactive.challengePrompt || null,
                        solutionMoves: reelData.interactive.solutionMoves || [],
                        difficultyRating: reelData.interactive.difficultyRating || null,
                    } : undefined,
                    status: "published",
                    whitePlayer: reelData.whitePlayer || null,
                    blackPlayer: reelData.blackPlayer || null,
                    folder: reelData.folder || "random",
                    grandmaster: reelData.grandmaster || null,
                },
            };
            const response = await apiClient.post<AdminVideoResponse>("/admin/video", payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
            queryClient.invalidateQueries({ queryKey: ["reels"] });
        },
    });
}

// Hook: Delete reel (optimistic)
export function useDeleteReel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reelId: string) => {
            const response = await apiClient.delete(`/admin/video/${reelId}`);
            return response.data;
        },
        onMutate: async (reelId: string) => {
            await queryClient.cancelQueries({ queryKey: ["admin-reels"] });
            const prev = queryClient.getQueryData<Reel[]>(["admin-reels"]);
            if (prev) {
                queryClient.setQueryData<Reel[]>(["admin-reels"], prev.filter((r) => r._id !== reelId));
            }
            return { prev };
        },
        onError: (_err, _reelId, context) => {
            if (context?.prev) queryClient.setQueryData(["admin-reels"], context.prev);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
            queryClient.invalidateQueries({ queryKey: ["reels"] });
        },
    });
}

// ============== FOLDER / GRANDMASTER APIs ==============

interface GrandmasterData {
    name: string;
    count: number;
}

interface FolderStats {
    random: number;
    grandmaster: number;
}

async function fetchGrandmasters(): Promise<GrandmasterData[]> {
    const response = await apiClient.get<{ success: boolean; data: GrandmasterData[] }>("/admin/grandmasters");
    return response.data.data || [];
}

async function fetchFolderStats(): Promise<FolderStats> {
    const response = await apiClient.get<{ success: boolean; data: FolderStats }>("/admin/folder-stats");
    return response.data.data || { random: 0, grandmaster: 0 };
}

export function useGrandmasters() {
    return useQuery({
        queryKey: ["admin-grandmasters"],
        queryFn: fetchGrandmasters,
        staleTime: 2 * 60 * 1000,
    });
}

export function useFolderStats() {
    return useQuery({
        queryKey: ["admin-folder-stats"],
        queryFn: fetchFolderStats,
        staleTime: 60 * 1000,
    });
}

export function useReelsByFolder(folder?: string, grandmaster?: string) {
    return useQuery({
        queryKey: ["admin-reels-by-folder", folder, grandmaster],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (folder) params.append("folder", folder);
            if (grandmaster) params.append("grandmaster", grandmaster);
            const response = await apiClient.get<AdminVideosResponse>(`/admin/videos/by-folder?${params.toString()}`);
            return response.data.data || [];
        },
        staleTime: 60 * 1000,
        enabled: !!folder,
    });
}

export const PREDEFINED_GRANDMASTERS = [
    "Magnus Carlsen",
    "Hikaru Nakamura",
    "Fabiano Caruana",
    "Ding Liren",
    "Ian Nepomniachtchi",
];

// ============== GRANDMASTER FOLDER CRUD ==============

export interface GrandmasterFolder {
    _id: string;
    name: string;
    thumbnail: string | null;
    description: string;
    reelCount: number;
    createdAt: string;
}

interface CreateGrandmasterData {
    name: string;
    thumbnail?: string;
    description?: string;
}

interface UpdateGrandmasterData {
    name?: string;
    thumbnail?: string;
    description?: string;
}

async function fetchGrandmasterFolders(): Promise<GrandmasterFolder[]> {
    const response = await apiClient.get<{ success: boolean; data: GrandmasterFolder[] }>("/admin/grandmaster-folders");
    return response.data.data || [];
}

export function useGrandmasterFolders() {
    return useQuery({
        queryKey: ["grandmaster-folders"],
        queryFn: fetchGrandmasterFolders,
        staleTime: 60 * 1000,
    });
}

export function useGrandmasterFolder(id: string) {
    return useQuery({
        queryKey: ["grandmaster-folder", id],
        queryFn: async () => {
            const response = await apiClient.get<{ success: boolean; data: GrandmasterFolder }>(`/admin/grandmaster/${id}`);
            return response.data.data;
        },
        staleTime: 60 * 1000,
        enabled: !!id,
    });
}

export function useCreateGrandmaster() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateGrandmasterData) => {
            const response = await apiClient.post<{ success: boolean; data: GrandmasterFolder }>("/admin/grandmaster", data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["grandmaster-folders"] });
            queryClient.invalidateQueries({ queryKey: ["admin-grandmasters"] });
        },
    });
}

export function useUpdateGrandmaster() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateGrandmasterData }) => {
            const response = await apiClient.put<{ success: boolean; data: GrandmasterFolder }>(`/admin/grandmaster/${id}`, data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["grandmaster-folders"] });
            queryClient.invalidateQueries({ queryKey: ["admin-grandmasters"] });
        },
    });
}

export function useDeleteGrandmaster() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, deleteReels = false }: { id: string; deleteReels?: boolean }) => {
            const response = await apiClient.delete(`/admin/grandmaster/${id}?deleteReels=${deleteReels}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["grandmaster-folders"] });
            queryClient.invalidateQueries({ queryKey: ["admin-grandmasters"] });
            queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
        },
    });
}
