import { useContext, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { useLocalSearchParams } from "expo-router";
import {
  LinkIcon,
  PaperPlaneRightIcon,
  TextBIcon,
  TextItalicIcon,
  XIcon,
} from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CommentThread } from "@/components/comment-thread";
import { EmptyState } from "@/components/empty-state";
import { LoadingScreen } from "@/components/loading-screen";
import { MentionInput } from "@/components/mention-input";
import { MentionText } from "@/components/mention-text";
import { ProfileUsername } from "@/components/profile-username";
import { useMutation, useQuery } from "@/lib/convex";
import { colors, layout } from "@/lib/theme";
import { formatRelativeTime } from "@/lib/time";

type Selection = {
  start: number;
  end: number;
};

const COMPOSER_COLLAPSED_HEIGHT = 64;
const COMPOSER_EXPANDED_HEIGHT = 188;
const COMPOSER_REPLY_HEIGHT = 218;

export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const post = useQuery(api.posts.getById, {
    postId: String(params.id ?? "") as Id<"posts">,
  });
  const createComment = useMutation(api.comments.createComment);
  const [body, setBody] = useState("");
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });
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
  const composerHeight = isComposerExpanded
    ? replyTarget.id
      ? COMPOSER_REPLY_HEIGHT
      : COMPOSER_EXPANDED_HEIGHT
    : COMPOSER_COLLAPSED_HEIGHT;
  const composerBottomOffset = Math.max(tabBarHeight, insets.bottom);
  const contentBottomPadding = composerBottomOffset + composerHeight + 24;

  async function handleCreateComment() {
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      return;
    }

    try {
      await createComment({
        postId,
        parentCommentId: replyTarget.id,
        body: trimmedBody,
      });
      setBody("");
      setReplyTarget({ id: null });
      setIsComposerExpanded(false);
      setSelection({ start: 0, end: 0 });
    } catch (error) {
      Alert.alert(
        "Could not post reply",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.container}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: contentBottomPadding },
          ]}
        >
          <View style={styles.threadHeader}>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.meta}>
              <ProfileUsername
                username={post.author?.username}
                muted
                style={styles.metaUsername}
              />{" "}
              •{" "}
              {post.category?.name ?? "General"} • {formatRelativeTime(post.createdAt)}
            </Text>
            <MentionText text={post.body} style={styles.body} />
          </View>

          <View style={styles.comments}>
            <Text style={styles.sectionTitle}>Comments</Text>
            {post.comments.length > 0 ? (
              post.comments.map((comment: any) => (
                <CommentThread
                  key={comment._id}
                  comment={comment}
                  onReply={(commentId, username) => {
                    setReplyTarget({ id: commentId, username });
                    setIsComposerExpanded(true);
                  }}
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

        <View style={[styles.composerDock, { bottom: composerBottomOffset }]}>
          <ReplyComposer
            body={body}
            isExpanded={isComposerExpanded}
            onChangeBody={setBody}
            onClearReplyTarget={() => setReplyTarget({ id: null })}
            onExpand={() => setIsComposerExpanded(true)}
            onSelectionChange={setSelection}
            onSubmit={() => void handleCreateComment()}
            placeholder={placeholder}
            replyTarget={replyTarget}
            selection={selection}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function ReplyComposer({
  body,
  isExpanded,
  onChangeBody,
  onClearReplyTarget,
  onExpand,
  onSelectionChange,
  onSubmit,
  placeholder,
  replyTarget,
  selection,
}: {
  body: string;
  isExpanded: boolean;
  onChangeBody: (body: string) => void;
  onClearReplyTarget: () => void;
  onExpand: () => void;
  onSelectionChange: (selection: Selection) => void;
  onSubmit: () => void;
  placeholder: string;
  replyTarget: { id: Id<"comments"> | null; username?: string };
  selection: Selection;
}) {
  const canSubmit = body.trim().length > 0;

  function replaceSelection(nextValue: string, nextSelection: Selection) {
    onChangeBody(nextValue);
    onSelectionChange(nextSelection);
  }

  function wrapSelection(prefix: string, suffix: string, fallback: string) {
    const start = Math.min(selection.start, body.length);
    const end = Math.min(selection.end, body.length);
    const selected = body.slice(start, end) || fallback;
    const nextValue =
      body.slice(0, start) + prefix + selected + suffix + body.slice(end);
    const nextSelectionStart = start + prefix.length;

    onExpand();
    replaceSelection(nextValue, {
      start: nextSelectionStart,
      end: nextSelectionStart + selected.length,
    });
  }

  function insertLink() {
    const start = Math.min(selection.start, body.length);
    const end = Math.min(selection.end, body.length);
    const label = body.slice(start, end) || "link";
    const url = "https://";
    const link = `[${label}](${url})`;
    const nextValue = body.slice(0, start) + link + body.slice(end);
    const urlStart = start + label.length + 3;

    onExpand();
    replaceSelection(nextValue, {
      start: urlStart,
      end: urlStart + url.length,
    });
  }

  return (
    <View style={styles.composer}>
      {replyTarget.id ? (
        <View style={styles.replyTargetRow}>
          <Text style={styles.replyTargetText}>
            Replying to @{replyTarget.username ?? "unknown"}
          </Text>
          <Pressable
            accessibilityLabel="Clear reply target"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClearReplyTarget}
            style={({ pressed }) => [
              styles.smallIconButton,
              pressed ? styles.iconButtonPressed : null,
            ]}
          >
            <XIcon color={colors.muted} size={14} weight="bold" />
          </Pressable>
        </View>
      ) : null}

      {isExpanded ? (
        <View style={styles.editorToolbar}>
          <EditorToolButton
            label="Bold"
            onPress={() => wrapSelection("**", "**", "bold")}
          >
            <TextBIcon color={colors.ink} size={18} weight="bold" />
          </EditorToolButton>
          <EditorToolButton
            label="Italic"
            onPress={() => wrapSelection("*", "*", "italic")}
          >
            <TextItalicIcon color={colors.ink} size={18} weight="bold" />
          </EditorToolButton>
          <EditorToolButton label="Add link" onPress={insertLink}>
            <LinkIcon color={colors.ink} size={18} weight="bold" />
          </EditorToolButton>
        </View>
      ) : null}

      <View style={styles.editorRow}>
        <View style={styles.editorInputShell}>
          <MentionInput
            blurOnSubmit={false}
            inputStyle={[
              styles.editorInput,
              isExpanded ? styles.editorInputExpanded : null,
            ]}
            multiline
            onChangeText={onChangeBody}
            onFocus={onExpand}
            onSelectionUpdate={onSelectionChange}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            selection={selection}
            suggestionsPlacement="above"
            textAlignVertical="top"
            value={body}
          />
        </View>
        <Pressable
          accessibilityLabel="Post reply"
          accessibilityRole="button"
          disabled={!canSubmit}
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.sendButton,
            pressed ? styles.sendButtonPressed : null,
            !canSubmit ? styles.sendButtonDisabled : null,
          ]}
        >
          <PaperPlaneRightIcon
            color={canSubmit ? colors.background : colors.muted}
            size={20}
            weight="fill"
          />
        </Pressable>
      </View>
    </View>
  );
}

function EditorToolButton({
  children,
  label,
  onPress,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolButton,
        pressed ? styles.iconButtonPressed : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    alignSelf: "center",
    maxWidth: layout.readingMaxWidth,
    paddingHorizontal: layout.pagePadding,
    paddingTop: layout.pagePadding,
    width: "100%",
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
  metaUsername: {
    color: colors.muted,
    fontSize: 13,
  },
  body: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 23,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  comments: {
    gap: 10,
    marginTop: 32,
  },
  composerDock: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
    width: "100%",
  },
  composer: {
    maxWidth: layout.readingMaxWidth,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(247, 241, 229, 0.12)",
    backgroundColor: colors.background,
    paddingHorizontal: layout.pagePadding,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  replyTargetRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 4,
  },
  replyTargetText: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  smallIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  editorToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toolButton: {
    width: 36,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPressed: {
    opacity: 0.72,
  },
  editorRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  editorInputShell: {
    flex: 1,
    minWidth: 0,
  },
  editorInput: {
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(247, 241, 229, 0.16)",
    backgroundColor: colors.background,
    color: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 20,
  },
  editorInputExpanded: {
    minHeight: 104,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.selected,
  },
  sendButtonPressed: {
    opacity: 0.86,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(247, 241, 229, 0.12)",
  },
});
