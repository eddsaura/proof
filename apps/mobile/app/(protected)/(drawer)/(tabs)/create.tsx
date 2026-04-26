import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PrimaryButton } from "@/components/primary-button";
import { useMutation, useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

export default function CreateTabScreen() {
  const categories = useQuery(api.feed.listCategories, {});
  const createPost = useMutation(api.posts.createPost);
  const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreatePost() {
    if (!categoryId) {
      Alert.alert("Choose a category", "Every thread needs one category in v1.");
      return;
    }

    try {
      setIsSaving(true);
      const postId = await createPost({
        categoryId,
        title,
        body,
      });
      setTitle("");
      setBody("");
      setCategoryId(null);
      router.replace({
        pathname: "/(protected)/post/[id]",
        params: { id: postId },
      });
    } catch (error) {
      Alert.alert(
        "Could not publish thread",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>Start a thread worth coming back to.</Text>
        <Text style={styles.copy}>
          Write clearly, mention builders directly with @username, and keep the
          asynchronous rhythm easy to follow later.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories?.map((category) => (
            <PrimaryButton
              key={category._id}
              label={category.name}
              onPress={() => setCategoryId(category._id)}
              variant={categoryId === category._id ? "solid" : "secondary"}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          placeholder="What are you sharing?"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Body</Text>
        <TextInput
          multiline
          placeholder="Add detail, context, and @mentions."
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.bodyInput]}
          value={body}
          onChangeText={setBody}
          textAlignVertical="top"
        />
      </View>

      <PrimaryButton
        label={isSaving ? "Publishing..." : "Publish thread"}
        onPress={() => void handleCreatePost()}
        disabled={isSaving || !title.trim() || !body.trim()}
      />
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
    gap: 16,
  },
  hero: {
    paddingVertical: 10,
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700",
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 8,
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  categoryGrid: {
    gap: 10,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.ink,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  bodyInput: {
    minHeight: 220,
  },
});
