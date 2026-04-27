import { useAuthActions } from "@convex-dev/auth/react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { colors, layout } from "@/lib/theme";

export default function SettingsScreen() {
  const { signOut } = useAuthActions();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.copy}>
          Keep the first release simple: profile lives in the drawer, mentions go
          to the inbox, and notifications stay in-app only.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session</Text>
        <PrimaryButton label="Sign out" onPress={() => void signOut()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    alignSelf: "center",
    maxWidth: layout.formMaxWidth,
    padding: layout.pagePadding,
    width: "100%",
    gap: 14,
  },
  header: {
    paddingVertical: 10,
    gap: 8,
  },
  section: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 16,
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
