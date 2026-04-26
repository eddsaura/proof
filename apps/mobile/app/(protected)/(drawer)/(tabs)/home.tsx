import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/empty-state";
import { LoadingScreen } from "@/components/loading-screen";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

export default function HomeTabScreen() {
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const selectedCategorySlug =
    typeof params.category === "string" ? params.category : null;
  const categories = useQuery(api.feed.listCategories, {});
  const selectedCategory =
    categories?.find((category) => category.slug === selectedCategorySlug) ??
    null;
  const selectedCategoryId = selectedCategory?._id ?? null;
  const posts = useQuery(
    api.feed.listHome,
    categories === undefined ? "skip" : { categoryId: selectedCategoryId },
  );
  const previousPosts = useRef<typeof posts>(undefined);

  if (posts !== undefined) {
    previousPosts.current = posts;
  }

  useEffect(() => {
    if (categories !== undefined && selectedCategorySlug && !selectedCategory) {
      router.setParams({ category: undefined });
    }
  }, [categories, selectedCategory, selectedCategorySlug]);

  function selectCategory(slug: string | null) {
    router.setParams({ category: slug ?? undefined });
  }

  const visiblePosts = posts ?? previousPosts.current;
  const isFiltering =
    posts === undefined && previousPosts.current !== undefined;

  if (categories === undefined || visiblePosts === undefined) {
    return <LoadingScreen message="Loading the community feed..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectedCategorySlug === null }}
          onPress={() => selectCategory(null)}
          style={[
            styles.chip,
            selectedCategorySlug === null ? styles.chipActive : null,
          ]}
        >
          <Text
            style={[
              styles.chipLabel,
              selectedCategorySlug === null ? styles.chipLabelActive : null,
            ]}
          >
            All
          </Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            key={category._id}
            accessibilityRole="button"
            accessibilityState={{
              selected: selectedCategorySlug === category.slug,
            }}
            onPress={() =>
              selectCategory(
                selectedCategorySlug === category.slug ? null : category.slug,
              )
            }
            style={[
              styles.chip,
              selectedCategorySlug === category.slug ? styles.chipActive : null,
            ]}
          >
            <Text
              style={[
                styles.chipLabel,
                selectedCategorySlug === category.slug
                  ? styles.chipLabelActive
                  : null,
              ]}
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.feed}>
        {isFiltering ? (
          <View style={styles.filteringStatus}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.filteringLabel}>Updating feed</Text>
          </View>
        ) : null}

        {visiblePosts.length > 0 ? (
          visiblePosts.map((post) => (
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
            description={
              selectedCategory
                ? "Be the first builder to start a thread in this category."
                : "Be the first builder to start a thread in the community feed."
            }
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
  filteringStatus: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
  },
  filteringLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
});
