import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyState } from "@/components/empty-state";
import { LoadingScreen } from "@/components/loading-screen";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

export default function HomeTabScreen() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"categories"> | null>(
    null,
  );
  const categories = useQuery(api.feed.listCategories, {});
  const posts = useQuery(api.feed.listHome, {
    categoryId: selectedCategoryId,
  });

  if (categories === undefined || posts === undefined) {
    return <LoadingScreen message="Loading the community feed..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>Share learnings and keep the async rhythm alive.</Text>
        <Text style={styles.copy}>
          The feed is chronological on purpose, so everyone can catch up thread
          by thread without gaming attention.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(protected)/(drawer)/(tabs)/map")}
          style={styles.mapShortcut}
        >
          <Text style={styles.mapShortcutLabel}>Jump to the builder map</Text>
          <Text style={styles.mapShortcutCopy}>
            See who from the House is based in your city.
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setSelectedCategoryId(null)}
          style={[
            styles.chip,
            selectedCategoryId === null ? styles.chipActive : null,
          ]}
        >
          <Text
            style={[
              styles.chipLabel,
              selectedCategoryId === null ? styles.chipLabelActive : null,
            ]}
          >
            All
          </Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            key={category._id}
            accessibilityRole="button"
            onPress={() =>
              setSelectedCategoryId((current) =>
                current === category._id ? null : category._id,
              )
            }
            style={[
              styles.chip,
              selectedCategoryId === category._id ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipLabel,
                selectedCategoryId === category._id ? styles.chipLabelActive : null,
              ]}
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.feed}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPress={() =>
                router.push({
                  pathname: "/(protected)/post/[id]",
                  params: { id: post._id },
                })
              }
            />
          ))
        ) : (
          <EmptyState
            title="No posts yet"
            description="Be the first builder to start a thread in this category."
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
  },
  hero: {
    gap: 14,
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
  mapShortcut: {
    borderTopColor: colors.accent,
    borderBottomColor: colors.accent,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    gap: 3,
  },
  mapShortcutLabel: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "700",
  },
  mapShortcutCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  chips: {
    gap: 16,
    paddingVertical: 2,
  },
  chip: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  chipActive: {
    borderBottomColor: colors.accent,
    borderBottomWidth: 2,
  },
  chipLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  chipLabelActive: {
    color: colors.accent,
  },
  feed: {
    gap: 12,
  },
});
