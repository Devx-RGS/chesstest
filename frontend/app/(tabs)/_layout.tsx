import { Tabs } from "expo-router";
import { View, Platform } from "react-native";
import { Home, User, Film } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/themes";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.background.primary,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(255, 255, 255, 0.1)",
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 8,
                    // Edge-to-edge: tab bar sits at true bottom
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                },
                tabBarActiveTintColor: colors.accent.cyan,
                tabBarInactiveTintColor: colors.text.muted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                    marginTop: 2,
                },
                // Let content flow behind tab bar for reels
                tabBarBackground: () => (
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: colors.background.primary + "F5",
                            borderTopWidth: 1,
                            borderTopColor: "rgba(255, 255, 255, 0.08)",
                        }}
                    />
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                padding: 6,
                                borderRadius: 10,
                                backgroundColor: focused
                                    ? colors.accent.cyan + "20"
                                    : "transparent",
                            }}
                        >
                            <Home size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="reels"
                options={{
                    title: "Reels",
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                padding: 6,
                                borderRadius: 10,
                                backgroundColor: focused
                                    ? colors.accent.cyan + "20"
                                    : "transparent",
                            }}
                        >
                            <Film size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                padding: 6,
                                borderRadius: 10,
                                backgroundColor: focused
                                    ? colors.accent.cyan + "20"
                                    : "transparent",
                            }}
                        >
                            <User size={22} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}
