import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pending" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(drawer)" />
      <Stack.Screen
        name="post/[id]"
        options={{ headerShown: true, title: "Thread" }}
      />
      <Stack.Screen
        name="member/[username]"
        options={{ headerShown: true, title: "Member" }}
      />
    </Stack>
  );
}
