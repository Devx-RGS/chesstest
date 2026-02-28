import { Stack } from "expo-router";
import { colors } from "@/constants/themes";

export default function FolderLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background.primary },
                animation: "slide_from_right",
            }}
        />
    );
}
