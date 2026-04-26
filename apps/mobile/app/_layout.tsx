import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { ConvexReactClient } from "convex/react";
import { Platform, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import * as WebBrowser from "expo-web-browser";

import { colors } from "@/lib/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

WebBrowser.maybeCompleteAuthSession();

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl
  ? new ConvexReactClient(convexUrl, { unsavedChangesWarning: false })
  : null;
const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  if (!convex) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.ink,
              textAlign: "center",
            }}
          >
            Missing EXPO_PUBLIC_CONVEX_URL
          </Text>
          <Text
            style={{
              marginTop: 12,
              fontSize: 15,
              lineHeight: 22,
              color: colors.muted,
              textAlign: "center",
            }}
          >
            Add your Convex deployment URL to apps/mobile/.env before starting
            the app.
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexAuthProvider
        client={convex}
        storage={
          Platform.OS === "android" || Platform.OS === "ios"
            ? secureStorage
            : undefined
        }
        replaceURL={(relativeUrl) => router.replace(relativeUrl as never)}
      >
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(protected)" />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </ConvexAuthProvider>
    </GestureHandlerRootView>
  );
}
