import React from "react";
import { Stack } from "expo-router";

export default function AdminLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0F0F23" },
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="upload" />
        </Stack>
    );
}
