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

  async function handleGitHubSignIn() {
    try {
      setAuthError(null);
      setIsSigningIn(true);
      const { redirect } = await signIn("github", { redirectTo });

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
          throw new Error("GitHub did not return an authorization code.");
        }

        await signIn("github", { code });
      }
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Could not sign in with GitHub.",
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
                  label={
                    isSigningIn ? "Opening GitHub..." : "Sign in with GitHub"
                  }
                  onPress={handleGitHubSignIn}
                  disabled={isSigningIn}
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
                  Fresh deployment detected. Add the GitHub username that should
                  own the community first.
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
