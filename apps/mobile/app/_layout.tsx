import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { ConvexReactClient } from "convex/react";
import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import * as WebBrowser from "expo-web-browser";

import { colors } from "@/lib/theme";

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

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.selected,
    background: colors.background,
    card: colors.background,
    text: colors.ink,
    border: colors.border,
    notification: colors.danger,
  },
};

type PendingReplace = {
  relativeUrl: string;
  resolve: () => void;
};

export default function RootLayout() {
  const router = useRouter();
  const isRootMounted = useRef(false);
  const pendingReplace = useRef<PendingReplace | null>(null);

  const runReplace = useCallback(
    (relativeUrl: string, resolve: () => void) => {
      const navigate = () => {
        router.replace(relativeUrl as never);
        resolve();
      };

      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(navigate);
        return;
      }

      setTimeout(navigate, 0);
    },
    [router],
  );

  const flushPendingReplace = useCallback(() => {
    const pending = pendingReplace.current;

    if (!pending) {
      return;
    }

    pendingReplace.current = null;
    runReplace(pending.relativeUrl, pending.resolve);
  }, [runReplace]);

  useEffect(() => {
    isRootMounted.current = true;
    flushPendingReplace();

    return () => {
      isRootMounted.current = false;
    };
  }, [flushPendingReplace]);

  const replaceURL = useCallback(
    (relativeUrl: string) =>
      new Promise<void>((resolve) => {
        if (!isRootMounted.current) {
          pendingReplace.current = { relativeUrl, resolve };
          return;
        }

        runReplace(relativeUrl, resolve);
      }),
    [runReplace],
  );

  if (!convex) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.appFrame}>
          <View style={styles.missingConfig}>
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
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.appFrame}>
        <ConvexAuthProvider
          client={convex}
          storage={
            Platform.OS === "android" || Platform.OS === "ios"
              ? secureStorage
              : undefined
          }
          replaceURL={replaceURL}
        >
          <ThemeProvider value={navigationTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(public)" />
              <Stack.Screen name="(protected)" />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </ConvexAuthProvider>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appFrame: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
  },
  missingConfig: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
});
