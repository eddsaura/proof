import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowBendUpLeftIcon } from "phosphor-react-native";

import type { Id } from "@/convex/_generated/dataModel";
import { MentionText } from "@/components/mention-text";
import { ProfileUsername } from "@/components/profile-username";
import { colors } from "@/lib/theme";
import { formatRelativeTime } from "@/lib/time";

export function CommentThread({
  comment,
  onReply,
  depth = 0,
}: {
  comment: any;
  onReply: (commentId: Id<"comments">, username: string) => void;
  depth?: number;
}) {
  return (
    <View style={[styles.container, { marginLeft: Math.min(depth, 2) * 16 }]}>
      <View style={styles.commentRow}>
        <Text style={styles.meta}>
          <ProfileUsername
            username={comment.author?.username}
            muted
            style={styles.metaUsername}
          />{" "}
          • {formatRelativeTime(comment.createdAt)}
        </Text>
        <MentionText text={comment.body} style={styles.body} />
        <Pressable
          accessibilityRole="button"
          onPress={() => onReply(comment._id, comment.author?.username ?? "unknown")}
          style={({ pressed }) => [
            styles.replyButton,
            pressed ? styles.replyButtonPressed : null,
          ]}
        >
          <ArrowBendUpLeftIcon color={colors.accent} size={15} weight="bold" />
          <Text style={styles.reply}>Reply</Text>
        </Pressable>
      </View>

      {comment.replies?.length
        ? comment.replies.map((reply: any) => (
            <CommentThread
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  commentRow: {
    borderTopColor: "rgba(247, 241, 229, 0.12)",
    borderTopWidth: 1,
    paddingVertical: 14,
    gap: 8,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  metaUsername: {
    color: colors.muted,
    fontSize: 12,
  },
  body: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  replyButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replyButtonPressed: {
    opacity: 0.72,
  },
  reply: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
});
