import { useAuthActions } from "@convex-dev/auth/react";
import { makeRedirectUri } from "expo-auth-session";
import { openAuthSessionAsync } from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { api } from "@/convex/_generated/api";
import { BRAND_WORDMARK_PATHS, BrandRoof } from "@/components/brand-assets";
import { PrimaryButton } from "@/components/primary-button";
import { useMutation, useQuery } from "@/lib/convex";
import { colors, layout } from "@/lib/theme";

const redirectTo = makeRedirectUri({
  scheme: "proofsocialmobile",
});

export default function SignInScreen() {
  const { signIn } = useAuthActions();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const bootstrapStatus = useQuery(api.admin.bootstrapStatus, {});
  const bootstrapCommunity = useMutation(api.admin.bootstrapCommunity);
  const brandTravelProgress = useRef(new Animated.Value(0)).current;
  const logoProgress = useRef(new Animated.Value(0)).current;
  const titleProgress = useRef(
    BRAND_WORDMARK_PATHS.map(() => new Animated.Value(0)),
  ).current;
  const contentProgress = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0)),
  ).current;
  const [bootstrapUsername, setBootstrapUsername] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [introPrepared, setIntroPrepared] = useState(false);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    let isMounted = true;
    const values = [
      brandTravelProgress,
      logoProgress,
      ...titleProgress,
      ...contentProgress,
    ];

    function finishImmediately() {
      values.forEach((value) => value.setValue(1));
      setIntroPrepared(true);
    }

    function runIntro() {
      values.forEach((value) => value.setValue(0));
      setIntroPrepared(true);
      animation = Animated.sequence([
        Animated.timing(logoProgress, {
          toValue: 1,
          duration: 460,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.stagger(
          92,
          titleProgress.map((value) =>
            Animated.timing(value, {
              toValue: 1,
              duration: 560,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              useNativeDriver: true,
            }),
          ),
        ),
        Animated.sequence([
          Animated.timing(brandTravelProgress, {
            toValue: -0.02,
            duration: 260,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(brandTravelProgress, {
            toValue: 1,
            duration: 740,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            useNativeDriver: true,
          }),
        ]),
        Animated.stagger(
          70,
          contentProgress.map((value) =>
            Animated.timing(value, {
              toValue: 1,
              duration: 420,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ),
        ),
      ]);
      animation.start();
    }

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotionEnabled) => {
        if (!isMounted) {
          return;
        }

        if (reduceMotionEnabled) {
          finishImmediately();
          return;
        }

        runIntro();
      })
      .catch(() => {
        if (isMounted) {
          runIntro();
        }
      });

    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (reduceMotionEnabled) => {
        animation?.stop();

        if (reduceMotionEnabled) {
          finishImmediately();
          return;
        }

        runIntro();
      },
    );

    return () => {
      isMounted = false;
      animation?.stop();
      reduceMotionSubscription.remove();
    };
  }, [brandTravelProgress, contentProgress, logoProgress, titleProgress]);

  async function startOAuthSignIn(provider: "github" | "google") {
    const providerLabel = provider === "github" ? "GitHub" : "Google";

    try {
      setAuthError(null);
      setIsSigningIn(true);
      const { redirect } = await signIn(provider, { redirectTo });

      if (Platform.OS === "web" || !redirect) {
        return;
      }

      const result = await openAuthSessionAsync(
        redirect.toString(),
        redirectTo,
      );

      if (result.type === "success") {
        const code = new URL(result.url).searchParams.get("code");

        if (!code) {
          throw new Error(`${providerLabel} did not return an authorization code.`);
        }

        await signIn(provider, { code });
      }
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : `Could not sign in with ${providerLabel}.`,
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
        error instanceof Error
          ? error.message
          : "Could not bootstrap the community.",
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
        {introPrepared ? (
          <View style={styles.introContent}>
            <View style={styles.hero}>
              <Animated.View
                style={[
                  styles.brandLockup,
                  brandTravelStyle(
                    brandTravelProgress,
                    windowWidth,
                    windowHeight,
                  ),
                ]}
              >
                <Animated.View
                  style={[styles.logoMark, revealStyle(logoProgress, 8, 0.97)]}
                >
                  <BrandRoof color={colors.ink} height={46} width={75} />
                </Animated.View>
                <AnimatedWordmark progress={titleProgress} />
              </Animated.View>
              <Animated.View style={revealStyle(contentProgress[0])}>
                <Text style={styles.title}>
                  Our common space, for the ones who were there.
                </Text>
              </Animated.View>
              <Animated.View style={revealStyle(contentProgress[1])}>
                <Text style={styles.copy}>
                  Share learnings, keep an async rhythm across time zones, and
                  see who from SOTI is in your city when it is time to meet.
                </Text>
              </Animated.View>
              <Animated.View style={revealStyle(contentProgress[2])}>
                <PrimaryButton
                  label={isSigningIn ? "Opening Google..." : "Sign in with Google"}
                  onPress={() => startOAuthSignIn("google")}
                  disabled={isSigningIn}
                  leadingIcon={<GoogleMark />}
                />
              </Animated.View>
              <Animated.View style={revealStyle(contentProgress[2])}>
                <PrimaryButton
                  label={isSigningIn ? "Opening GitHub..." : "Sign in with GitHub"}
                  onPress={() => startOAuthSignIn("github")}
                  disabled={isSigningIn}
                  variant="secondary"
                  leadingIcon={<GitHubMark />}
                />
              </Animated.View>
              {authError ? (
                <Animated.View style={revealStyle(contentProgress[3])}>
                  <Text style={styles.error}>{authError}</Text>
                </Animated.View>
              ) : null}
            </View>

            <Animated.View
              style={[styles.note, revealStyle(contentProgress[4])]}
            >
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>What opens after sign-in</Text>
                <Text style={styles.noteCopy}>
                  Invited members go through a short profile setup, then land in
                  the community feed. People who are not yet invited see an
                  access-pending screen until an admin adds them.
                </Text>
              </View>
            </Animated.View>

            {bootstrapStatus?.needsBootstrap ? (
              <Animated.View
                style={[styles.bootstrap, revealStyle(contentProgress[5])]}
              >
                <Text style={styles.noteTitle}>Bootstrap the first admin</Text>
                <Text style={styles.noteCopy}>
                  Fresh deployment detected. Add the Google-account username that should
                  own the community first.
                </Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setBootstrapUsername}
                  placeholder="google-account username"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={bootstrapUsername}
                />
                <PrimaryButton
                  label={
                    isBootstrapping
                      ? "Creating admin invite..."
                      : "Create first admin invite"
                  }
                  onPress={handleBootstrap}
                  disabled={
                    isBootstrapping || bootstrapUsername.trim().length === 0
                  }
                />
                {bootstrapError ? (
                  <Text style={styles.error}>{bootstrapError}</Text>
                ) : null}
              </Animated.View>
            ) : null}
          </View>
        ) : (
          <View style={styles.introPlaceholder} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function brandTravelStyle(
  progress: Animated.Value,
  windowWidth: number,
  windowHeight: number,
) {
  const brandWidth = 75 + 14 + 168;
  const availableWidth = Math.min(
    Math.max(windowWidth - layout.pagePadding * 2, 0),
    layout.formMaxWidth,
  );
  const startTranslateX = Math.max((availableWidth - brandWidth) / 2, 0);
  const startTranslateY = Math.min(Math.max(windowHeight * 0.18, 120), 220);

  return {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [-0.02, 0, 1],
          outputRange: [startTranslateX * 1.02, startTranslateX, 0],
          extrapolate: "clamp",
        }),
      },
      {
        translateY: progress.interpolate({
          inputRange: [-0.02, 0, 1],
          outputRange: [startTranslateY * 1.02, startTranslateY, 0],
          extrapolate: "clamp",
        }),
      },
    ],
  };
}

function revealStyle(
  progress: Animated.Value,
  translateY = 10,
  startScale = 0.99,
) {
  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [translateY, 0],
        }),
      },
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [startScale, 1],
        }),
      },
    ],
  };
}

function AnimatedWordmark({ progress }: { progress: Animated.Value[] }) {
  return (
    <View
      accessible
      accessibilityLabel="Roof"
      accessibilityRole="image"
      style={styles.wordmark}
    >
      {BRAND_WORDMARK_PATHS.map((path, index) => (
        <Animated.View
          key={path}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            revealStyle(progress[index], 7, 0.985),
          ]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 261 91" fill="none">
            <Path d={path} fill={colors.ink} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}


function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.6v2.99h3.87c2.26-2.08 3.57-5.15 3.57-8.62Z" />
      <Path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-2.99c-1.07.72-2.43 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.09A12 12 0 0 0 12 24Z" />
      <Path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l4-3.09Z" />
      <Path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.82l3.43-3.43C17.94 1.08 15.24 0 12 0A12 12 0 0 0 1.29 6.62l4 3.09C6.23 6.88 8.88 4.77 12 4.77Z" />
    </Svg>
  );
}

function GitHubMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        fill={colors.ink}
        d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.54-1.36-1.32-1.72-1.32-1.72-1.08-.73.08-.72.08-.72 1.2.08 1.83 1.22 1.83 1.22 1.06 1.8 2.79 1.28 3.47.98.11-.77.42-1.28.76-1.57-2.66-.3-5.47-1.32-5.47-5.88 0-1.3.47-2.36 1.24-3.2-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.22a11.8 11.8 0 0 1 6 0c2.29-1.54 3.3-1.22 3.3-1.22.66 1.65.24 2.87.12 3.17.77.84 1.24 1.9 1.24 3.2 0 4.57-2.81 5.58-5.49 5.88.43.37.81 1.09.81 2.2v3.26c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: layout.formMaxWidth,
    padding: layout.pagePadding,
    width: "100%",
    justifyContent: "center",
  },
  introContent: {
    gap: 18,
    width: "100%",
  },
  introPlaceholder: {
    minHeight: 420,
    width: "100%",
  },
  hero: {
    paddingVertical: 12,
    gap: 12,
  },
  brandLockup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  logoMark: {
    alignSelf: "center",
  },
  wordmark: {
    aspectRatio: 261 / 91,
    width: 168,
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
  },
  noteContent: {
    gap: 8,
  },
  bootstrap: {
    borderRadius: 10,
    backgroundColor: colors.selectedSoft,
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
