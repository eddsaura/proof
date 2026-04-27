import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyState } from "@/components/empty-state";
import { MentionText } from "@/components/mention-text";
import { ProfileUsername } from "@/components/profile-username";
import { PrimaryButton } from "@/components/primary-button";
import { useMutation, useQuery } from "@/lib/convex";
import { colors, layout } from "@/lib/theme";
import { formatRelativeTime } from "@/lib/time";

export default function InboxTabScreen() {
  const notifications = useQuery(api.notifications.listMine, {});
  const markRead = useMutation(api.notifications.markRead);

  async function handleOpenNotification(
    notificationId: Id<"notifications">,
    postId: Id<"posts"> | null,
  ) {
    await markRead({ notificationId });

    if (postId) {
      router.push({
        pathname: "/(protected)/post/[id]",
        params: { id: postId },
      });
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>Mentions that need your attention.</Text>
        <Text style={styles.copy}>
          In v1, the inbox tracks mentions from posts and replies so you can jump
          back into the right thread.
        </Text>
      </View>

      {notifications?.length ? (
        notifications.map((notification) => (
          <View key={notification._id} style={styles.notificationRow}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>
                <ProfileUsername username={notification.actor?.username} /> mentioned you
              </Text>
              <Text style={styles.meta}>
                {formatRelativeTime(notification.createdAt)}
              </Text>
            </View>
            <MentionText
              text={notification.comment?.body ?? notification.post?.title ?? "Open the thread"}
              style={styles.notificationCopy}
              numberOfLines={3}
            />
            <PrimaryButton
              label={notification.readAt ? "Open thread" : "Mark read and open"}
              onPress={() =>
                void handleOpenNotification(notification._id, notification.postId)
              }
              variant={notification.readAt ? "secondary" : "solid"}
            />
          </View>
        ))
      ) : (
        <EmptyState
          title="Nothing in your inbox"
          description="Mentions from posts and replies will land here."
        />
      )}
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
    maxWidth: layout.readingMaxWidth,
    padding: layout.pagePadding,
    width: "100%",
    gap: 14,
  },
  hero: {
    paddingVertical: 10,
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  notificationRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: 16,
    gap: 10,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  notificationTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  notificationCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
