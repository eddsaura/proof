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

import { BatchBadges } from "@/components/batch-badges";
import { LocationPicker, type CityLocation } from "@/components/location-picker";
import { PrimaryButton } from "@/components/primary-button";
import { colors, layout } from "@/lib/theme";
import { getWhatsAppUrl, normalizePhoneNumber } from "@/lib/whatsapp";

export function ProfileForm({
  title,
  subtitle,
  initialValues,
  batches = [],
  badgeTypes = [],
  submitLabel,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  initialValues: {
    displayName: string;
    bio: string;
    phone?: string;
    cityName: string;
    countryCode?: string;
    cityLat?: number;
    cityLng?: number;
  };
  batches?: {
    _id?: string;
    label: string;
    houseName: string;
    cityName: string;
    startsOn?: string;
    endsOn?: string;
  }[];
  badgeTypes?: ("core")[];
  submitLabel: string;
  onSubmit: (args: {
    displayName: string;
    bio: string;
    phone?: string;
    location: CityLocation;
  }) => Promise<{ ok: boolean }>;
}) {
  const [displayName, setDisplayName] = useState(initialValues.displayName);
  const [bio, setBio] = useState(initialValues.bio);
  const [phone, setPhone] = useState(initialValues.phone ?? "");
  const [location, setLocation] = useState<CityLocation | null>(
    initialValues.cityName &&
      initialValues.countryCode &&
      initialValues.cityLat !== undefined &&
      initialValues.cityLng !== undefined
      ? {
          cityName: initialValues.cityName,
          countryCode: initialValues.countryCode,
          cityLat: initialValues.cityLat,
          cityLng: initialValues.cityLng,
        }
      : null,
  );
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    if (!location) {
      Alert.alert("Choose a home city", "Select a confirmed city before saving.");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    if (normalizedPhone && !getWhatsAppUrl(normalizedPhone)) {
      Alert.alert(
        "Check the WhatsApp number",
        "Use an international number with country code, like +34 600 000 000.",
      );
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit({
        displayName,
        bio,
        phone: normalizedPhone,
        location,
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
          <BatchBadges batches={batches} badgeTypes={badgeTypes} />
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
          <Text style={styles.label}>WhatsApp number</Text>
          <TextInput
            autoComplete="tel"
            keyboardType="phone-pad"
            onChangeText={setPhone}
            placeholder="+34 600 000 000"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textContentType="telephoneNumber"
            value={phone}
          />
          <Text style={styles.hint}>
            Include your country code so members can open a chat in one tap.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Home city</Text>
          <LocationPicker
            initialLocation={location}
            initialQuery={initialValues.cityName}
            onChange={setLocation}
          />
        </View>

        <PrimaryButton
          label={isSaving ? "Saving..." : submitLabel}
          onPress={() => void handleSubmit()}
          disabled={
            isSaving ||
            !displayName.trim() ||
            !bio.trim() ||
            location === null
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
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: layout.formMaxWidth,
    padding: layout.pagePadding,
    width: "100%",
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
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});
