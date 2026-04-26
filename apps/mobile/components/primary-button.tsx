import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/lib/theme";

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "solid",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "solid" | "secondary";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "solid" ? styles.solid : styles.secondary,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "solid" ? styles.solidLabel : styles.secondaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  solid: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
    borderWidth: 1,
  },
  solidLabel: {
    color: colors.background,
  },
  secondaryLabel: {
    color: colors.ink,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
});
