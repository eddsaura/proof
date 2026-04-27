import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { BatchBadges } from "@/components/batch-badges";
import { EmptyState } from "@/components/empty-state";
import { LoadingScreen } from "@/components/loading-screen";
import { PrimaryButton } from "@/components/primary-button";
import {
  formatCalendarDateInput,
  normalizeCalendarDateRange,
} from "@/convex/lib/dates";
import { useMutation, useQuery } from "@/lib/convex";
import { colors, layout } from "@/lib/theme";

type BadgeType = "core";
type AdminTab = "invites" | "members" | "batches" | "categories";

const adminTabs: { key: AdminTab; label: string; description: string }[] = [
  {
    key: "invites",
    label: "Invites",
    description: "Create access links and clean up pending invitations.",
  },
  {
    key: "members",
    label: "Members",
    description: "Assign profile badges to active members.",
  },
  {
    key: "batches",
    label: "Batches",
    description: "Manage House batches, dates, and active badge options.",
  },
  {
    key: "categories",
    label: "Categories",
    description: "Curate the community feed sections.",
  },
];

export default function AdminScreen() {
  const viewerState = useQuery(api.users.viewerState, {});
  const isAdmin =
    viewerState?.kind === "active" && viewerState.user.role === "admin";
  const invites = useQuery(api.admin.listInvites, isAdmin ? {} : "skip");
  const members = useQuery(api.admin.listMembersForAdmin, isAdmin ? {} : "skip");
  const categories = useQuery(
    api.admin.listCategoriesForAdmin,
    isAdmin ? {} : "skip",
  );
  const batches = useQuery(api.admin.listBatchesForAdmin, isAdmin ? {} : "skip");
  const ensureDefaultBatches = useMutation(api.admin.ensureDefaultBatchesForAdmin);
  const createInvite = useMutation(api.admin.createInvite);
  const revokeInvite = useMutation(api.admin.revokeInvite);
  const updateMemberBatches = useMutation(api.admin.updateMemberBatches);
  const createBatch = useMutation(api.admin.createBatch);
  const updateBatch = useMutation(api.admin.updateBatch);
  const createCategory = useMutation(api.admin.createCategory);
  const updateCategory = useMutation(api.admin.updateCategory);
  const [activeTab, setActiveTab] = useState<AdminTab>("invites");
  const [githubUsername, setGithubUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [selectedBatchIds, setSelectedBatchIds] = useState<Id<"batches">[]>([]);
  const [newBatchLabel, setNewBatchLabel] = useState("");
  const [newBatchHouseName, setNewBatchHouseName] = useState("");
  const [newBatchCityName, setNewBatchCityName] = useState("");
  const [newBatchStartsOn, setNewBatchStartsOn] = useState("");
  const [newBatchEndsOn, setNewBatchEndsOn] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [editableCategories, setEditableCategories] = useState<any[]>([]);
  const [editableBatches, setEditableBatches] = useState<any[]>([]);
  const [editableMemberBatchIds, setEditableMemberBatchIds] = useState<
    Record<string, Id<"batches">[]>
  >({});
  const [editableMemberBadgeTypes, setEditableMemberBadgeTypes] = useState<
    Record<string, BadgeType[]>
  >({});
  const [didRequestDefaultBatches, setDidRequestDefaultBatches] = useState(false);

  useEffect(() => {
    if (isAdmin && !didRequestDefaultBatches) {
      setDidRequestDefaultBatches(true);
      void ensureDefaultBatches({});
    }
  }, [didRequestDefaultBatches, ensureDefaultBatches, isAdmin]);

  useEffect(() => {
    if (categories) {
      setEditableCategories(categories);
    }
  }, [categories]);

  useEffect(() => {
    if (batches) {
      setEditableBatches(batches);
    }
  }, [batches]);

  useEffect(() => {
    if (members) {
      setEditableMemberBatchIds(
        Object.fromEntries(
          members.map((member) => [member._id, member.batchIds ?? []]),
        ),
      );
      setEditableMemberBadgeTypes(
        Object.fromEntries(
          members.map((member) => [member._id, member.badgeTypes ?? []]),
        ),
      );
    }
  }, [members]);

  if (
    viewerState === undefined ||
    (isAdmin &&
      (invites === undefined ||
        members === undefined ||
        categories === undefined ||
        batches === undefined))
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
  const safeMembers = members ?? [];
  const safeCategories = categories ?? [];
  const safeBatches = batches ?? [];
  const activeTabConfig =
    adminTabs.find((tab) => tab.key === activeTab) ?? adminTabs[0];

  function toggleBatch(batchId: Id<"batches">) {
    setSelectedBatchIds((current) =>
      current.includes(batchId)
        ? current.filter((id) => id !== batchId)
        : [...current, batchId],
    );
  }

  function toggleMemberBatch(userId: Id<"users">, batchId: Id<"batches">) {
    setEditableMemberBatchIds((current) => {
      const key = String(userId);
      const currentBatchIds = current[key] ?? [];

      return {
        ...current,
        [key]: currentBatchIds.includes(batchId)
          ? currentBatchIds.filter((id) => id !== batchId)
          : [...currentBatchIds, batchId],
      };
    });
  }

  function toggleMemberBadgeType(userId: Id<"users">, badgeType: BadgeType) {
    setEditableMemberBadgeTypes((current) => {
      const key = String(userId);
      const currentBadgeTypes = current[key] ?? [];

      return {
        ...current,
        [key]: currentBadgeTypes.includes(badgeType)
          ? currentBadgeTypes.filter((type) => type !== badgeType)
          : [...currentBadgeTypes, badgeType],
      };
    });
  }

  function getBatchDates(startsOnValue: string, endsOnValue: string) {
    try {
      return normalizeCalendarDateRange({
        startsOn: startsOnValue,
        endsOn: endsOnValue,
      });
    } catch (error) {
      Alert.alert(
        "Check the batch dates",
        error instanceof Error ? error.message : "Use real dates in YYYY-MM-DD format.",
      );
      return null;
    }
  }

  async function handleCreateInvite() {
    try {
      await createInvite({
        githubUsername,
        role: inviteRole,
        batchIds: selectedBatchIds,
      });
      setGithubUsername("");
      setInviteRole("member");
      setSelectedBatchIds([]);
    } catch (error) {
      Alert.alert(
        "Could not create invite",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  async function handleCreateBatch() {
    const dates = getBatchDates(newBatchStartsOn, newBatchEndsOn);

    if (dates === null) {
      return;
    }

    try {
      await createBatch({
        label: newBatchLabel,
        houseName: newBatchHouseName,
        cityName: newBatchCityName,
        startsOn: dates.startsOn,
        endsOn: dates.endsOn,
        sortOrder: editableBatches.length,
      });
      setNewBatchLabel("");
      setNewBatchHouseName("");
      setNewBatchCityName("");
      setNewBatchStartsOn("");
      setNewBatchEndsOn("");
    } catch (error) {
      Alert.alert(
        "Could not create batch",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  async function handleSaveMemberBatches(userId: Id<"users">) {
    try {
      await updateMemberBatches({
        userId,
        batchIds: editableMemberBatchIds[String(userId)] ?? [],
        badgeTypes: editableMemberBadgeTypes[String(userId)] ?? [],
      });
    } catch (error) {
      Alert.alert(
        "Could not update member badges",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  }

  async function handleSaveBatch(batch: any) {
    const dates = getBatchDates(
      formatCalendarDateInput(batch.startsOn),
      formatCalendarDateInput(batch.endsOn),
    );

    if (dates === null) {
      return;
    }

    try {
      await updateBatch({
        batchId: batch._id,
        label: batch.label,
        houseName: batch.houseName,
        cityName: batch.cityName,
        startsOn: dates.startsOn,
        endsOn: dates.endsOn,
        sortOrder: Number(batch.sortOrder) || 0,
        isActive: Boolean(batch.isActive),
      });
    } catch (error) {
      Alert.alert(
        "Could not save batch",
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
      <View style={styles.header}>
        <Text style={styles.title}>Admin</Text>
        <Text style={styles.copy}>
          Manage the private invite list and keep categories curated for the
          whole House.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {adminTabs.map((tab) => {
          const selected = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, selected ? styles.tabActive : null]}
            >
              <Text style={[styles.tabLabel, selected ? styles.tabLabelActive : null]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.tabIntro}>
        <Text style={styles.sectionTitle}>{activeTabConfig.label}</Text>
        <Text style={styles.copy}>{activeTabConfig.description}</Text>
      </View>

      {activeTab === "invites" ? (
        <View style={styles.tabPanel}>
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
            <View style={styles.batchPicker}>
              <Text style={styles.copy}>Batch badges</Text>
              {safeBatches.length > 0 ? (
                <View style={styles.batchOptions}>
                  {safeBatches
                    .filter((batch) => batch.isActive)
                    .map((batch) => {
                      const selected = selectedBatchIds.includes(batch._id);

                      return (
                        <PrimaryButton
                          key={batch._id}
                          label={batch.label}
                          onPress={() => toggleBatch(batch._id)}
                          variant={selected ? "solid" : "secondary"}
                        />
                      );
                    })}
                </View>
              ) : (
                <Text style={styles.copy}>
                  Create a batch before assigning badges.
                </Text>
              )}
              <BatchBadges
                batches={safeBatches.filter((batch) =>
                  selectedBatchIds.includes(batch._id),
                )}
                compact
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
                      {invite.revokedAt ? " - revoked" : " - active"}
                    </Text>
                    <BatchBadges batches={invite.batches ?? []} compact />
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
        </View>
      ) : null}

      {activeTab === "members" ? (
        <View style={styles.tabPanel}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Member badges</Text>
            {safeMembers.length > 0 ? (
              safeMembers.map((member) => {
                const memberBatchIds =
                  editableMemberBatchIds[String(member._id)] ?? [];
                const memberBadgeTypes =
                  editableMemberBadgeTypes[String(member._id)] ?? [];
                const hasCoreBadge = memberBadgeTypes.includes("core");

                return (
                  <View key={member._id} style={styles.memberBadgeRow}>
                    <View style={styles.memberHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inviteTitle}>{member.displayName}</Text>
                        <Text style={styles.copy}>
                          @{member.username}
                          {member.cityName ? ` - ${member.cityName}` : ""}
                          {member.role === "admin" ? " - admin" : ""}
                        </Text>
                      </View>
                    </View>
                    <BatchBadges
                      batches={safeBatches.filter((batch) =>
                        memberBatchIds.includes(batch._id),
                      )}
                      badgeTypes={memberBadgeTypes}
                      compact
                    />
                    <View style={styles.batchOptions}>
                      <PrimaryButton
                        label="Core SOTI team"
                        onPress={() => toggleMemberBadgeType(member._id, "core")}
                        variant={hasCoreBadge ? "solid" : "secondary"}
                      />
                    </View>
                    {safeBatches.length > 0 ? (
                      <View style={styles.batchOptions}>
                        {safeBatches
                          .filter((batch) => batch.isActive)
                          .map((batch) => {
                            const selected = memberBatchIds.includes(batch._id);

                            return (
                              <PrimaryButton
                                key={batch._id}
                                label={batch.label}
                                onPress={() =>
                                  toggleMemberBatch(member._id, batch._id)
                                }
                                variant={selected ? "solid" : "secondary"}
                              />
                            );
                          })}
                      </View>
                    ) : (
                      <Text style={styles.copy}>
                        Create a batch before assigning badges to members.
                      </Text>
                    )}
                    <PrimaryButton
                      label="Save member badges"
                      onPress={() => void handleSaveMemberBatches(member._id)}
                      variant="secondary"
                    />
                  </View>
                );
              })
            ) : (
              <EmptyState
                title="No active members yet"
                description="Active members will appear here after they complete onboarding."
              />
            )}
          </View>
        </View>
      ) : null}

      {activeTab === "batches" ? (
        <View style={styles.tabPanel}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create batch</Text>
            <TextInput
              onChangeText={setNewBatchLabel}
              placeholder="Batch label, e.g. Dec25 Barcelona"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={newBatchLabel}
            />
            <TextInput
              onChangeText={setNewBatchHouseName}
              placeholder="House or season name, e.g. Kubrick"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={newBatchHouseName}
            />
            <TextInput
              onChangeText={setNewBatchCityName}
              placeholder="City, e.g. Barcelona"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={newBatchCityName}
            />
            <View style={styles.dateRow}>
              <TextInput
                onChangeText={setNewBatchStartsOn}
                autoCapitalize="none"
                placeholder="Starts YYYY-MM-DD"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.dateInput]}
                value={newBatchStartsOn}
              />
              <TextInput
                onChangeText={setNewBatchEndsOn}
                autoCapitalize="none"
                placeholder="Ends YYYY-MM-DD"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.dateInput]}
                value={newBatchEndsOn}
              />
            </View>
            <PrimaryButton
              label="Create batch"
              onPress={() => void handleCreateBatch()}
              disabled={
                !newBatchLabel.trim() ||
                !newBatchHouseName.trim() ||
                !newBatchCityName.trim()
              }
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit batches</Text>
            {safeBatches.length > 0 ? (
              editableBatches.map((batch, index) => (
                <View key={batch._id} style={styles.categoryItem}>
                  <BatchBadges batches={[batch]} compact />
                  <TextInput
                    onChangeText={(value) =>
                      setEditableBatches((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, label: value } : item,
                        ),
                      )
                    }
                    placeholder="Batch label"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={batch.label}
                  />
                  <TextInput
                    onChangeText={(value) =>
                      setEditableBatches((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, houseName: value }
                            : item,
                        ),
                      )
                    }
                    placeholder="House or season name"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={batch.houseName}
                  />
                  <TextInput
                    onChangeText={(value) =>
                      setEditableBatches((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, cityName: value } : item,
                        ),
                      )
                    }
                    placeholder="City"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={batch.cityName}
                  />
                  <View style={styles.dateRow}>
                    <TextInput
                      onChangeText={(value) =>
                        setEditableBatches((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, startsOn: value }
                              : item,
                          ),
                        )
                      }
                      placeholder="Starts YYYY-MM-DD"
                      placeholderTextColor={colors.muted}
                      style={[styles.input, styles.dateInput]}
                      value={formatCalendarDateInput(batch.startsOn)}
                    />
                    <TextInput
                      onChangeText={(value) =>
                        setEditableBatches((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, endsOn: value } : item,
                          ),
                        )
                      }
                      placeholder="Ends YYYY-MM-DD"
                      placeholderTextColor={colors.muted}
                      style={[styles.input, styles.dateInput]}
                      value={formatCalendarDateInput(batch.endsOn)}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.copy}>Active</Text>
                    <Switch
                      onValueChange={(value) =>
                        setEditableBatches((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, isActive: value }
                              : item,
                          ),
                        )
                      }
                      value={batch.isActive}
                    />
                  </View>
                  <PrimaryButton
                    label="Save batch"
                    onPress={() => void handleSaveBatch(batch)}
                  />
                </View>
              ))
            ) : (
              <EmptyState
                title="No batches yet"
                description="Create the first batch to give member profiles a badge."
              />
            )}
          </View>
        </View>
      ) : null}

      {activeTab === "categories" ? (
        <View style={styles.tabPanel}>
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
                          itemIndex === index
                            ? { ...item, description: value }
                            : item,
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
                            itemIndex === index
                              ? { ...item, isActive: value }
                              : item,
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
        </View>
      ) : null}
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
    maxWidth: layout.formMaxWidth,
    paddingHorizontal: layout.pagePadding,
    paddingTop: 24,
    paddingBottom: 32,
    width: "100%",
    gap: 18,
  },
  header: {
    gap: 8,
  },
  section: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 12,
  },
  tabPanel: {
    gap: 22,
  },
  tabIntro: {
    gap: 4,
    paddingBottom: 2,
  },
  tabs: {
    gap: 16,
    paddingVertical: 2,
  },
  tab: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  tabActive: {
    borderBottomColor: colors.selected,
    borderBottomWidth: 2,
  },
  tabLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: colors.selected,
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
  batchPicker: {
    gap: 10,
  },
  batchOptions: {
    gap: 8,
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateInput: {
    flex: 1,
    minWidth: 0,
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
  memberBadgeRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 12,
  },
  memberHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
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
