import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";
import { formatRelativeTime } from "@/lib/time";

export function PostCard({
  post,
  onPress,
}: {
  post: any;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={
        onPress ??
        (() =>
          router.push({
            pathname: "/(protected)/post/[id]",
            params: { id: post._id },
          }))
      }
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.meta}>
        @{post.author?.username ?? "unknown"} • {post.category?.name ?? "General"} •{" "}
        {formatRelativeTime(post.createdAt)}
      </Text>
      <Text style={styles.preview} numberOfLines={3}>
        {post.body}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{post.commentCount} comments</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    backgroundColor: colors.paper,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  pressed: {
    opacity: 0.9,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  preview: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
});
