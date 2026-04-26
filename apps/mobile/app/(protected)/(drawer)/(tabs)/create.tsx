import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { CaretDownIcon } from "phosphor-react-native";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MentionInput } from "@/components/mention-input";
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
  const [isCategorySelectOpen, setIsCategorySelectOpen] = useState(false);
  const activeCategories =
    categories?.filter((category) => category.isActive) ?? [];
  const selectedCategory = activeCategories.find(
    (category) => category._id === categoryId,
  );

  useEffect(() => {
    if (categories !== undefined && categoryId && !selectedCategory) {
      setCategoryId(null);
    }
  }, [categories, categoryId, selectedCategory]);

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
        <Pressable
          accessibilityRole="button"
          disabled={categories === undefined || activeCategories.length === 0}
          onPress={() => setIsCategorySelectOpen(true)}
          style={({ pressed }) => [
            styles.select,
            pressed ? styles.selectPressed : null,
          ]}
        >
          <Text
            style={[
              styles.selectText,
              selectedCategory ? null : styles.selectPlaceholder,
            ]}
          >
            {selectedCategory?.name ??
              (categories === undefined ? "Loading categories..." : "Choose a category")}
          </Text>
          <CaretDownIcon color={colors.muted} size={18} weight="bold" />
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isCategorySelectOpen}
        onRequestClose={() => setIsCategorySelectOpen(false)}
      >
        <Pressable
          style={styles.modalScrim}
          onPress={() => setIsCategorySelectOpen(false)}
        >
          <Pressable style={styles.selectMenu}>
            <Text style={styles.selectMenuTitle}>Category</Text>
            {activeCategories.map((category) => (
              <Pressable
                accessibilityRole="button"
                key={category._id}
                onPress={() => {
                  setCategoryId(category._id);
                  setIsCategorySelectOpen(false);
                }}
                style={({ pressed }) => [
                  styles.selectOption,
                  categoryId === category._id ? styles.selectOptionActive : null,
                  pressed ? styles.selectOptionPressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    categoryId === category._id
                      ? styles.selectOptionTextActive
                      : null,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

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
        <MentionInput
          multiline
          placeholder="Add detail, context, and @mentions."
          placeholderTextColor={colors.muted}
          inputStyle={[styles.input, styles.bodyInput]}
          value={body}
          onChangeText={setBody}
          textAlignVertical="top"
        />
      </View>

      <PrimaryButton
        label={isSaving ? "Publishing..." : "Publish thread"}
        onPress={() => void handleCreatePost()}
        disabled={isSaving || !categoryId || !title.trim() || !body.trim()}
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
  select: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectPressed: {
    borderColor: colors.accent,
  },
  selectText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  selectPlaceholder: {
    color: colors.muted,
    fontWeight: "500",
  },
  modalScrim: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    padding: 16,
  },
  selectMenu: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    padding: 8,
    gap: 4,
  },
  selectMenuTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectOption: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  selectOptionActive: {
    backgroundColor: colors.accentSoft,
  },
  selectOptionPressed: {
    backgroundColor: colors.border,
  },
  selectOptionText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  selectOptionTextActive: {
    color: colors.accent,
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
