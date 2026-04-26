import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CommentThread } from "@/components/comment-thread";
import { EmptyState } from "@/components/empty-state";
import { LoadingScreen } from "@/components/loading-screen";
import { MentionText } from "@/components/mention-text";
import { PrimaryButton } from "@/components/primary-button";
import { useMutation, useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";
import { formatRelativeTime } from "@/lib/time";

export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const post = useQuery(api.posts.getById, {
    postId: String(params.id ?? "") as Id<"posts">,
  });
  const createComment = useMutation(api.comments.createComment);
  const [body, setBody] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    id: Id<"comments"> | null;
    username?: string;
  }>({ id: null });
  const placeholder = useMemo(() => {
    if (!replyTarget.id || !replyTarget.username) {
      return "Add a thoughtful reply";
    }

    return `Reply to @${replyTarget.username}`;
  }, [replyTarget]);

  if (post === undefined) {
    return <LoadingScreen message="Loading thread..." />;
  }

  if (post === null) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <EmptyState
          title="Thread not found"
          description="This post is no longer available."
        />
      </ScrollView>
    );
  }

  const postId = post._id;

  async function handleCreateComment() {
    try {
      await createComment({
        postId,
        parentCommentId: replyTarget.id,
        body,
      });
      setBody("");
      setReplyTarget({ id: null });
    } catch (error) {
      Alert.alert(
        "Could not post reply",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.threadHeader}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.meta}>
          @{post.author?.username ?? "unknown"} • {post.category?.name ?? "General"} •{" "}
          {formatRelativeTime(post.createdAt)}
        </Text>
        <MentionText text={post.body} style={styles.body} />
      </View>

      <View style={styles.replyPanel}>
        <Text style={styles.sectionTitle}>Reply</Text>
        {replyTarget.id ? (
          <Text style={styles.replyHint}>
            Replying to @{replyTarget.username}. Submit or clear to return to the
            main thread.
          </Text>
        ) : null}
        <TextInput
          multiline
          onChangeText={setBody}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          textAlignVertical="top"
          value={body}
        />
        <View style={styles.replyActions}>
          {replyTarget.id ? (
            <PrimaryButton
              label="Clear reply target"
              onPress={() => setReplyTarget({ id: null })}
              variant="secondary"
            />
          ) : null}
          <PrimaryButton
            label="Post reply"
            onPress={() => void handleCreateComment()}
            disabled={!body.trim()}
          />
        </View>
      </View>

      <View style={styles.comments}>
        <Text style={styles.sectionTitle}>Comments</Text>
        {post.comments.length > 0 ? (
          post.comments.map((comment: any) => (
            <CommentThread
              key={comment._id}
              comment={comment}
              onReply={(commentId, username) =>
                setReplyTarget({ id: commentId, username })
              }
            />
          ))
        ) : (
          <EmptyState
            title="No replies yet"
            description="Start the conversation and set the tone."
          />
        )}
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
    padding: 16,
    gap: 14,
  },
  threadHeader: {
    paddingVertical: 10,
    gap: 10,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  body: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 23,
  },
  replyPanel: {
    borderRadius: 10,
    backgroundColor: colors.paper,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  replyHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  input: {
    minHeight: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  replyActions: {
    gap: 8,
  },
  comments: {
    gap: 10,
  },
});
