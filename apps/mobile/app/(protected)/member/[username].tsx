import { useLocalSearchParams } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { BatchBadges } from "@/components/batch-badges";
import { EmptyState } from "@/components/empty-state";
import { LoadingScreen } from "@/components/loading-screen";
import { MentionText } from "@/components/mention-text";
import { PostRow } from "@/components/post-row";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { useQuery } from "@/lib/convex";
import { colors, layout } from "@/lib/theme";

export default function MemberProfileScreen() {
  const params = useLocalSearchParams<{ username: string }>();
  const member = useQuery(api.users.getByUsername, {
    username: String(params.username ?? "").toLowerCase(),
  });

  if (member === undefined) {
    return <LoadingScreen message="Loading member profile..." />;
  }

  if (member === null) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <EmptyState
          title="Member not found"
          description="That profile is not available right now."
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.identityRow}>
          {member.user.avatarUrl ? (
            <Image source={{ uri: member.user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {member.user.displayName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.identityCopy}>
            <Text style={styles.title}>{member.user.displayName}</Text>
            <Text style={styles.meta}>
              @{member.user.username}
              {member.user.cityName ? ` - ${member.user.cityName}` : ""}
              {member.user.countryCode ? `, ${member.user.countryCode}` : ""}
            </Text>
          </View>
        </View>
        <BatchBadges batches={member.batches} badgeTypes={member.badgeTypes} />
        {member.user.bio ? (
          <MentionText text={member.user.bio} style={styles.bio} />
        ) : null}
        <WhatsAppButton phone={member.user.phone} label="Message on WhatsApp" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent threads</Text>
        {member.recentPosts.length > 0 ? (
          member.recentPosts.map((post: any) => <PostRow key={post._id} post={post} />)
        ) : (
          <EmptyState
            title="No threads yet"
            description="This builder has not started a thread yet."
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
    alignSelf: "center",
    maxWidth: layout.readingMaxWidth,
    padding: layout.pagePadding,
    width: "100%",
    gap: 22,
  },
  hero: {
    paddingVertical: 12,
    gap: 16,
  },
  identityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  identityCopy: {
    flex: 1,
    gap: 4,
  },
  avatar: {
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarInitial: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "700",
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
  },
  bio: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
});
