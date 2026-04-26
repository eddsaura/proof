import { Stack, useRouter } from "expo-router";
import { CaretLeftIcon } from "phosphor-react-native";
import { Pressable } from "react-native";

import { colors } from "@/lib/theme";

export default function ProtectedLayout() {
  const router = useRouter();

  function leaveNestedScreen() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(protected)/(drawer)/(tabs)/home");
  }

  const nestedHeaderOptions = {
    headerLeft: () => (
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={12}
        onPress={leaveNestedScreen}
        style={({ pressed }) => ({
          opacity: pressed ? 0.65 : 1,
          paddingHorizontal: 4,
          paddingVertical: 6,
        })}
      >
        <CaretLeftIcon color={colors.ink} size={28} weight="bold" />
      </Pressable>
    ),
    headerBackVisible: false,
    headerTitleAlign: "center" as const,
  };

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.ink,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
        },
      }}
    >
      <Stack.Screen name="pending" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(drawer)" />
      <Stack.Screen
        name="post/[id]"
        options={{ ...nestedHeaderOptions, headerShown: true, title: "Thread" }}
      />
      <Stack.Screen
        name="member/[username]"
        options={{ ...nestedHeaderOptions, headerShown: true, title: "Member" }}
      />
    </Stack>
  );
}
