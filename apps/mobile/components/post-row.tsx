import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { MentionText } from "@/components/mention-text";
import { ProfileUsername } from "@/components/profile-username";
import { colors } from "@/lib/theme";
import { formatRelativeTime } from "@/lib/time";

export function PostRow({
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
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.meta}>
        <ProfileUsername
          username={post.author?.username}
          muted
          style={styles.metaUsername}
        />{" "}
        • {post.category?.name ?? "General"}
      </Text>
      <MentionText text={post.body} style={styles.preview} numberOfLines={3} />
      <Text style={styles.activity}>
        {formatRelativeTime(post.createdAt)} • {post.commentCount} comments
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(247, 241, 229, 0.14)",
    paddingVertical: 22,
  },
  pressed: {
    opacity: 0.9,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    marginBottom: 8,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 14,
  },
  metaUsername: {
    color: colors.muted,
    fontSize: 13,
  },
  preview: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  activity: {
    color: colors.muted,
    fontSize: 13,
  },
});
