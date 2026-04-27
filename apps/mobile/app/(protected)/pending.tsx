import { useAuthActions } from "@convex-dev/auth/react";
import { Redirect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { PrimaryButton } from "@/components/primary-button";
import { useQuery } from "@/lib/convex";
import { colors, layout } from "@/lib/theme";

export default function PendingScreen() {
  const viewerState = useQuery(api.users.viewerState, {});
  const { signOut } = useAuthActions();

  if (viewerState?.kind === "active") {
    return <Redirect href="/(protected)/(drawer)/(tabs)/home" />;
  }

  if (viewerState?.kind === "onboarding") {
    return <Redirect href="/(protected)/onboarding" />;
  }

  const wasDeclined = viewerState?.kind === "declined";

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>
          {wasDeclined
            ? "Your registration was declined."
            : "You are signed in, but not invited yet."}
        </Text>
        <Text style={styles.copy}>
          {wasDeclined
            ? "A SOTI House admin declined this registration. Sign out if you need to use a different account."
            : "Ask a SOTI House admin to accept "}
          {!wasDeclined ? (
            <>
              <Text style={styles.highlight}>{viewerState?.user.username}</Text>
              {" into the private builder network. As soon as they accept it, this screen will turn into onboarding automatically."}
            </>
          ) : null}
        </Text>
        <PrimaryButton label="Sign out" onPress={() => void signOut()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  panel: {
    width: "100%",
    maxWidth: layout.formMaxWidth,
    borderRadius: 10,
    backgroundColor: colors.paper,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  highlight: {
    color: colors.ink,
    fontWeight: "700",
  },
});
