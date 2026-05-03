import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "solid",
  leadingIcon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "solid" | "secondary";
  leadingIcon?: ReactNode;
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
      <View style={styles.content}>
        {leadingIcon ? <View style={styles.icon}>{leadingIcon}</View> : null}
        <Text
          style={[
            styles.label,
            variant === "solid" ? styles.solidLabel : styles.secondaryLabel,
          ]}
        >
          {label}
        </Text>
      </View>
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
    backgroundColor: colors.selected,
  },
  secondary: {
    backgroundColor: colors.selectedSoft,
    borderColor: colors.border,
    borderWidth: 1,
  },
  solidLabel: {
    color: colors.background,
  },
  secondaryLabel: {
    color: colors.ink,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
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
