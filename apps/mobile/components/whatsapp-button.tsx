import { Alert, Linking, Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/lib/theme";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppButton({
  phone,
  label = "Open WhatsApp",
  compact = false,
}: {
  phone: string | null | undefined;
  label?: string;
  compact?: boolean;
}) {
  const url = getWhatsAppUrl(phone);

  if (!url) {
    return null;
  }

  const whatsappUrl = url;

  async function openWhatsApp() {
    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      Alert.alert("Could not open WhatsApp", "Check that WhatsApp is installed and try again.");
    }
  }

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void openWhatsApp()}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.label, compact ? styles.compactLabel : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#234f3c",
    borderColor: "#327456",
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  compact: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  compactLabel: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.86,
  },
});
