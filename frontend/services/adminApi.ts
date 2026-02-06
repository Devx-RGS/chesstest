import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api";
import { Reel } from "@/types/reel";

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

interface PostReelData {
    videoUrl: string;
    title: string;
    description: string;
    fenString?: string;
    tags?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    folder?: "random" | "grandmaster";
    grandmaster?: string | null;
}

// Fetch all reels for admin (including drafts)
async function fetchAdminReels(): Promise<Reel[]> {
    const response = await apiClient.get<AdminVideosResponse>("/admin/videos");
    return response.data.data || [];
}

// Fetch admin stats
async function fetchAdminStats(): Promise<AdminStatsResponse["stats"]> {
    try {
        // Try dedicated stats endpoint first
        const response = await apiClient.get<AdminStatsResponse>("/admin/stats");
        return response.data.stats;
    } catch {
        // Fallback: calculate from videos
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
    return useQuery({
        queryKey: ["admin-reels"],
        queryFn: fetchAdminReels,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// Hook: Get admin stats
export function useAdminStats() {
    return useQuery({
        queryKey: ["admin-stats"],
        queryFn: fetchAdminStats,
        staleTime: 60 * 1000, // 1 minute
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
                        thumbnail: "",
                        durationSec: 0,
                    },
                    content: {
                        title: reelData.title,
                        description: reelData.description,
                        tags: reelData.tags || [],
                        difficulty: reelData.difficulty || "beginner",
                    },
                    gameId: null,
                    status: "published",
                },
            };
            const response = await apiClient.post<AdminVideoResponse>(
                "/admin/video",
                payload
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
            queryClient.invalidateQueries({ queryKey: ["reels"] });
        },
    });
}

// Hook: Delete reel with optimistic update
export function useDeleteReel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reelId: string) => {
            const response = await apiClient.delete(`/admin/video/${reelId}`);
            return response.data;
        },
        onMutate: async (reelId: string) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["admin-reels"] });

            // Snapshot previous value
            const previousReels = queryClient.getQueryData<Reel[]>(["admin-reels"]);

            // Optimistically remove the reel
            if (previousReels) {
                queryClient.setQueryData<Reel[]>(
                    ["admin-reels"],
                    previousReels.filter((reel) => reel._id !== reelId)
                );
            }

            return { previousReels };
        },
        onError: (_err, _reelId, context) => {
            // Rollback on error
            if (context?.previousReels) {
                queryClient.setQueryData(["admin-reels"], context.previousReels);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
            queryClient.invalidateQueries({ queryKey: ["reels"] });
        },
    });
}

// Types for folder APIs
interface GrandmasterData {
    name: string;
    count: number;
}

interface FolderStats {
    random: number;
    grandmaster: number;
}

// Fetch grandmasters list with counts
async function fetchGrandmasters(): Promise<GrandmasterData[]> {
    const response = await apiClient.get<{ success: boolean; data: GrandmasterData[] }>("/admin/grandmasters");
    return response.data.data || [];
}

// Fetch folder stats
async function fetchFolderStats(): Promise<FolderStats> {
    const response = await apiClient.get<{ success: boolean; data: FolderStats }>("/admin/folder-stats");
    return response.data.data || { random: 0, grandmaster: 0 };
}

// Fetch reels by folder
async function fetchReelsByFolder(folder?: string, grandmaster?: string): Promise<Reel[]> {
    const params = new URLSearchParams();
    if (folder) params.append("folder", folder);
    if (grandmaster) params.append("grandmaster", grandmaster);

    const response = await apiClient.get<AdminVideosResponse>(`/admin/videos/by-folder?${params.toString()}`);
    return response.data.data || [];
}

// Hook: Get grandmasters list
export function useGrandmasters() {
    return useQuery({
        queryKey: ["admin-grandmasters"],
        queryFn: fetchGrandmasters,
        staleTime: 2 * 60 * 1000,
    });
}

// Hook: Get folder stats
export function useFolderStats() {
    return useQuery({
        queryKey: ["admin-folder-stats"],
        queryFn: fetchFolderStats,
        staleTime: 60 * 1000,
    });
}

// Hook: Get reels by folder
export function useReelsByFolder(folder?: string, grandmaster?: string) {
    return useQuery({
        queryKey: ["admin-reels-by-folder", folder, grandmaster],
        queryFn: () => fetchReelsByFolder(folder, grandmaster),
        staleTime: 60 * 1000,
        enabled: !!folder,
    });
}

// Predefined grandmasters list for UI (fallback)
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

// Fetch all grandmaster folders
async function fetchGrandmasterFolders(): Promise<GrandmasterFolder[]> {
    const response = await apiClient.get<{ success: boolean; data: GrandmasterFolder[] }>("/admin/grandmaster-folders");
    return response.data.data || [];
}

// Hook: Get all grandmaster folders
export function useGrandmasterFolders() {
    return useQuery({
        queryKey: ["grandmaster-folders"],
        queryFn: fetchGrandmasterFolders,
        staleTime: 60 * 1000,
    });
}

// Hook: Get single grandmaster folder
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

// Hook: Create grandmaster folder
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

// Hook: Update grandmaster folder
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

// Hook: Delete grandmaster folder
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
