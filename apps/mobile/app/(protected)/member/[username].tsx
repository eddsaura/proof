import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/empty-state";
import { LoadingScreen } from "@/components/loading-screen";
import { MentionText } from "@/components/mention-text";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

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
        <Text style={styles.title}>{member.user.displayName}</Text>
        <Text style={styles.meta}>
          @{member.user.username}
          {member.user.cityName ? ` • ${member.user.cityName}` : ""}
        </Text>
        {member.user.bio ? (
          <MentionText text={member.user.bio} style={styles.bio} />
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent threads</Text>
        {member.recentPosts.length > 0 ? (
          member.recentPosts.map((post: any) => <PostCard key={post._id} post={post} />)
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
    padding: 16,
    gap: 14,
  },
  hero: {
    paddingVertical: 10,
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
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
