import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";

export function LoadingScreen({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.muted} size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
    gap: 12,
  },
  message: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
