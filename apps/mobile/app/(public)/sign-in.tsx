import { useAuthActions } from "@convex-dev/auth/react";
import { makeRedirectUri } from "expo-auth-session";
import { openAuthSessionAsync } from "expo-web-browser";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "@/convex/_generated/api";
import { PrimaryButton } from "@/components/primary-button";
import { useMutation, useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

const redirectTo = makeRedirectUri({
  scheme: "proofsocialmobile",
});

export default function SignInScreen() {
  const { signIn } = useAuthActions();
  const bootstrapStatus = useQuery(api.admin.bootstrapStatus, {});
  const bootstrapCommunity = useMutation(api.admin.bootstrapCommunity);
  const [bootstrapUsername, setBootstrapUsername] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  async function handleGitHubSignIn() {
    try {
      setAuthError(null);
      setIsSigningIn(true);
      const { redirect } = await signIn("github", { redirectTo });

      if (Platform.OS === "web" || !redirect) {
        return;
      }

      const result = await openAuthSessionAsync(redirect.toString(), redirectTo);

      if (result.type === "success") {
        const code = new URL(result.url).searchParams.get("code");

        if (!code) {
          throw new Error("GitHub did not return an authorization code.");
        }

        await signIn("github", { code });
      }
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Could not sign in with GitHub.",
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleBootstrap() {
    try {
      setBootstrapError(null);
      setIsBootstrapping(true);
      await bootstrapCommunity({ githubUsername: bootstrapUsername });
      setBootstrapUsername("");
    } catch (error) {
      setBootstrapError(
        error instanceof Error ? error.message : "Could not bootstrap the community.",
      );
    } finally {
      setIsBootstrapping(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.safeArea}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>A private Reddit for builders we trust.</Text>
          <Text style={styles.copy}>
            Share learnings, keep an async rhythm across time zones, and see who
            from the House is in your city when it is time to meet.
          </Text>
          <PrimaryButton
            label={isSigningIn ? "Opening GitHub..." : "Sign in with GitHub"}
            onPress={handleGitHubSignIn}
            disabled={isSigningIn}
          />
          {authError ? <Text style={styles.error}>{authError}</Text> : null}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>What opens after sign-in</Text>
          <Text style={styles.noteCopy}>
            Invited members go through a short profile setup, then land in the
            community feed. People who are not yet invited see an access-pending
            screen until an admin adds them.
          </Text>
        </View>

        {bootstrapStatus?.needsBootstrap ? (
          <View style={styles.bootstrap}>
            <Text style={styles.noteTitle}>Bootstrap the first admin</Text>
            <Text style={styles.noteCopy}>
              Fresh deployment detected. Add the GitHub username that should own
              the community first.
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setBootstrapUsername}
              placeholder="github username"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={bootstrapUsername}
            />
            <PrimaryButton
              label={isBootstrapping ? "Creating admin invite..." : "Create first admin invite"}
              onPress={handleBootstrap}
              disabled={isBootstrapping || bootstrapUsername.trim().length === 0}
            />
            {bootstrapError ? <Text style={styles.error}>{bootstrapError}</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 18,
    justifyContent: "center",
  },
  hero: {
    paddingVertical: 12,
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  note: {
    borderRadius: 10,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  bootstrap: {
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    padding: 20,
    gap: 10,
  },
  noteTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "700",
  },
  noteCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    color: colors.ink,
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
