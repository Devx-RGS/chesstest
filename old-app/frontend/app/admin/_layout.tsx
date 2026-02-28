import { Stack } from "expo-router";
import { colors } from "@/constants/themes";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

export default function AdminLayout() {
    return (
        <AdminAuthGuard>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background.primary },
                    animation: "fade",
                    // Ensure edge-to-edge
                    navigationBarColor: colors.background.primary,
                    statusBarStyle: "light",
                }}
            >
                <Stack.Screen name="login" />
                <Stack.Screen name="dashboard" />
                <Stack.Screen name="upload" />
            </Stack>
        </AdminAuthGuard>
    );
}
