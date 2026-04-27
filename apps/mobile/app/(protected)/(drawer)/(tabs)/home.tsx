import { useEffect, useRef } from "react";
import {
  Animated,
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
import { PostRow } from "@/components/post-row";
import { useQuery } from "@/lib/convex";
import { colors, layout } from "@/lib/theme";

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
  const feedOpacity = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    Animated.timing(feedOpacity, {
      toValue: isFiltering ? 0.62 : 1,
      duration: isFiltering ? 120 : 180,
      useNativeDriver: true,
    }).start();
  }, [feedOpacity, isFiltering]);

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
          <View
            accessible
            accessibilityLabel="Updating feed"
            accessibilityLiveRegion="polite"
            pointerEvents="none"
            style={styles.filteringTrack}
          >
            <View style={styles.filteringFill} />
          </View>
        ) : null}

        <Animated.View style={[styles.feedBody, { opacity: feedOpacity }]}>
          {visiblePosts.length > 0 ? (
            visiblePosts.map((post) => (
              <PostRow
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
        </Animated.View>
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
    maxWidth: layout.feedMaxWidth,
    paddingHorizontal: layout.pagePadding,
    paddingTop: 24,
    paddingBottom: 32,
    width: "100%",
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
    borderTopColor: colors.selected,
    borderBottomColor: colors.selected,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    gap: 3,
  },
  mapShortcutLabel: {
    color: colors.selected,
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
    borderBottomColor: colors.selected,
    borderBottomWidth: 2,
  },
  chipLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  chipLabelActive: {
    color: colors.selected,
  },
  feed: {
    position: "relative",
  },
  feedBody: {
    gap: 12,
  },
  filteringTrack: {
    backgroundColor: colors.border,
    height: 1,
    left: 0,
    opacity: 0.9,
    position: "absolute",
    right: 0,
    top: -10,
    zIndex: 1,
  },
  filteringFill: {
    backgroundColor: colors.selected,
    height: 1,
    width: "32%",
  },
});
