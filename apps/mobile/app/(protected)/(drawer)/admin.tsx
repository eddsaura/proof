import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/empty-state";
import { LoadingScreen } from "@/components/loading-screen";
import { PrimaryButton } from "@/components/primary-button";
import { useMutation, useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

export default function AdminScreen() {
  const viewerState = useQuery(api.users.viewerState, {});
  const isAdmin =
    viewerState?.kind === "active" && viewerState.user.role === "admin";
  const invites = useQuery(api.admin.listInvites, isAdmin ? {} : "skip");
  const categories = useQuery(
    api.admin.listCategoriesForAdmin,
    isAdmin ? {} : "skip",
  );
  const createInvite = useMutation(api.admin.createInvite);
  const revokeInvite = useMutation(api.admin.revokeInvite);
  const createCategory = useMutation(api.admin.createCategory);
  const updateCategory = useMutation(api.admin.updateCategory);
  const [githubUsername, setGithubUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [editableCategories, setEditableCategories] = useState<any[]>([]);

  useEffect(() => {
    if (categories) {
      setEditableCategories(categories);
    }
  }, [categories]);

  if (
    viewerState === undefined ||
    (isAdmin && (invites === undefined || categories === undefined))
  ) {
    return <LoadingScreen message="Loading admin tools..." />;
  }

  if (!isAdmin) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <EmptyState
          title="Admin access only"
          description="Only SOTI House admins can manage invites and categories."
        />
      </ScrollView>
    );
  }

  const safeInvites = invites ?? [];
  const safeCategories = categories ?? [];

  async function handleCreateInvite() {
    try {
      await createInvite({
        githubUsername,
        role: inviteRole,
      });
      setGithubUsername("");
      setInviteRole("member");
    } catch (error) {
      Alert.alert(
        "Could not create invite",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  async function handleCreateCategory() {
    try {
      await createCategory({
        name: newCategoryName,
        description: newCategoryDescription,
        sortOrder: editableCategories.length,
      });
      setNewCategoryName("");
      setNewCategoryDescription("");
    } catch (error) {
      Alert.alert(
        "Could not create category",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  async function handleSaveCategory(category: any) {
    try {
      await updateCategory({
        categoryId: category._id,
        name: category.name,
        description: category.description,
        sortOrder: Number(category.sortOrder) || 0,
        isActive: Boolean(category.isActive),
      });
    } catch (error) {
      Alert.alert(
        "Could not save category",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>Admin</Text>
        <Text style={styles.copy}>
          Manage the private invite list and keep categories curated for the
          whole House.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite a member</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setGithubUsername}
          placeholder="github username"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={githubUsername}
        />
        <View style={styles.roleRow}>
          <PrimaryButton
            label="Member"
            onPress={() => setInviteRole("member")}
            variant={inviteRole === "member" ? "solid" : "secondary"}
          />
          <PrimaryButton
            label="Admin"
            onPress={() => setInviteRole("admin")}
            variant={inviteRole === "admin" ? "solid" : "secondary"}
          />
        </View>
        <PrimaryButton
          label="Save invite"
          onPress={() => void handleCreateInvite()}
          disabled={!githubUsername.trim()}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current invites</Text>
        {safeInvites.length > 0 ? (
          safeInvites.map((invite) => (
            <View key={invite._id} style={styles.inviteRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inviteTitle}>@{invite.githubUsername}</Text>
                <Text style={styles.copy}>
                  {invite.role}
                  {invite.revokedAt ? " • revoked" : " • active"}
                </Text>
              </View>
              {!invite.revokedAt ? (
                <PrimaryButton
                  label="Revoke"
                  onPress={() => void revokeInvite({ inviteId: invite._id })}
                  variant="secondary"
                />
              ) : null}
            </View>
          ))
        ) : (
          <EmptyState
            title="No invites yet"
            description="Add GitHub usernames here to unlock the private network."
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create category</Text>
        <TextInput
          onChangeText={setNewCategoryName}
          placeholder="Category name"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={newCategoryName}
        />
        <TextInput
          multiline
          onChangeText={setNewCategoryDescription}
          placeholder="Category description"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.bodyInput]}
          textAlignVertical="top"
          value={newCategoryDescription}
        />
        <PrimaryButton
          label="Create category"
          onPress={() => void handleCreateCategory()}
          disabled={!newCategoryName.trim() || !newCategoryDescription.trim()}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Edit categories</Text>
        {safeCategories.length > 0 ? (
          editableCategories.map((category, index) => (
          <View key={category._id} style={styles.categoryItem}>
            <TextInput
              onChangeText={(value) =>
                setEditableCategories((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, name: value } : item,
                  ),
                )
              }
              style={styles.input}
              value={category.name}
            />
            <TextInput
              multiline
              onChangeText={(value) =>
                setEditableCategories((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, description: value } : item,
                  ),
                )
              }
              style={[styles.input, styles.bodyInput]}
              textAlignVertical="top"
              value={category.description}
            />
            <View style={styles.switchRow}>
              <Text style={styles.copy}>Active</Text>
              <Switch
                onValueChange={(value) =>
                  setEditableCategories((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, isActive: value } : item,
                    ),
                  )
                }
                value={category.isActive}
              />
            </View>
            <PrimaryButton
              label="Save category"
              onPress={() => void handleSaveCategory(category)}
            />
          </View>
          ))
        ) : (
          <EmptyState
            title="No categories yet"
            description="Create the first category for the community feed."
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
  section: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  copy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  bodyInput: {
    minHeight: 110,
  },
  roleRow: {
    gap: 8,
  },
  inviteRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  inviteTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  categoryItem: {
    borderRadius: 10,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
