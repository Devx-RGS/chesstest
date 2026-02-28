import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, postApi } from "./api";
import { useAuthStore } from "@/stores/authStore";

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
}

interface RecordActivityResponse extends StreakData {
    message: string;
}

// Fetch user's current streak
const fetchStreak = async (): Promise<StreakData> => {
    const response = await fetchApi<StreakData>("/streak");
    return response;
};

// Record user activity (call when user opens app or watches reels)
const recordActivity = async (): Promise<RecordActivityResponse> => {
    const response = await postApi<RecordActivityResponse>("/streak/record", {});
    return response;
};

// Hook to get current streak
export function useStreak() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return useQuery<StreakData>({
        queryKey: ["streak"],
        queryFn: fetchStreak,
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}

// Hook to record activity
export function useRecordActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: recordActivity,
        onSuccess: (data) => {
            // Update streak query cache with new data
            queryClient.setQueryData(["streak"], {
                currentStreak: data.currentStreak,
                longestStreak: data.longestStreak,
                lastActiveDate: data.lastActiveDate,
            });
        },
    });
}
