import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { PrimaryButton } from "@/components/primary-button";
import { colors } from "@/lib/theme";

export function ProfileForm({
  title,
  subtitle,
  initialValues,
  submitLabel,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  initialValues: {
    displayName: string;
    bio: string;
    cityName: string;
  };
  submitLabel: string;
  onSubmit: (args: {
    displayName: string;
    bio: string;
    cityName: string;
  }) => Promise<{ ok: boolean }>;
}) {
  const [displayName, setDisplayName] = useState(initialValues.displayName);
  const [bio, setBio] = useState(initialValues.bio);
  const [cityName, setCityName] = useState(initialValues.cityName);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    try {
      setIsSaving(true);
      await onSubmit({
        displayName,
        bio,
        cityName,
      });
      router.replace("/(protected)/(drawer)/(tabs)/home");
    } catch (error) {
      Alert.alert(
        "Could not save profile",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.safeArea}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            onChangeText={setDisplayName}
            placeholder="How should the House know you?"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={displayName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            multiline
            onChangeText={setBio}
            placeholder="What are you building, learning, or exploring?"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={bio}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Home city</Text>
          <TextInput
            onChangeText={setCityName}
            placeholder="Barcelona, Lisbon, Buenos Aires..."
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={cityName}
          />
        </View>

        <PrimaryButton
          label={isSaving ? "Saving..." : submitLabel}
          onPress={() => void handleSubmit()}
          disabled={
            isSaving ||
            !displayName.trim() ||
            !bio.trim() ||
            !cityName.trim()
          }
        />
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
    gap: 16,
  },
  hero: {
    paddingVertical: 12,
    gap: 10,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 8,
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 150,
  },
});
