import { useMemo, useState } from "react";
import {
  type NativeSyntheticEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextInputSelectionChangeEventData,
  type TextStyle,
  View,
} from "react-native";

import { api } from "@/convex/_generated/api";
import { useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

type Selection = {
  start: number;
  end: number;
};

type ActiveMention = {
  start: number;
  end: number;
  query: string;
};

type MentionInputProps = Omit<
  TextInputProps,
  "onChangeText" | "onSelectionChange" | "selection" | "style" | "value"
> & {
  inputStyle?: StyleProp<TextStyle>;
  onChangeText: (text: string) => void;
  onSelectionChange?: TextInputProps["onSelectionChange"];
  onSelectionUpdate?: (selection: Selection) => void;
  selection?: Selection;
  suggestionsPlacement?: "above" | "below";
  value: string;
};

const activeMentionRegex = /(^|[^a-z0-9-])@([a-z0-9-]{0,39})$/i;

function findActiveMention(text: string, selection: Selection): ActiveMention | null {
  if (selection.start !== selection.end) {
    return null;
  }

  const cursor = Math.min(selection.end, text.length);
  const beforeCursor = text.slice(0, cursor);
  const match = beforeCursor.match(activeMentionRegex);

  if (!match) {
    return null;
  }

  const prefixLength = match[1]?.length ?? 0;
  const start = beforeCursor.length - match[0].length + prefixLength;

  return {
    start,
    end: cursor,
    query: match[2]?.toLowerCase() ?? "",
  };
}

function getInitials(displayName: string) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials.toUpperCase() || "?";
}

export function MentionInput({
  inputStyle,
  onChangeText,
  onSelectionChange,
  onSelectionUpdate,
  selection: controlledSelection,
  suggestionsPlacement = "below",
  value,
  ...textInputProps
}: MentionInputProps) {
  const [selection, setSelection] = useState<Selection>({
    start: value.length,
    end: value.length,
  });
  const textInputSelection = controlledSelection ?? selection;
  const activeMention = useMemo(
    () => findActiveMention(value, textInputSelection),
    [textInputSelection, value],
  );
  const candidates = useQuery(
    api.users.searchMentionCandidates,
    activeMention ? { query: activeMention.query } : "skip",
  );
  const visibleCandidates = activeMention ? (candidates ?? []) : [];

  function handleSelectionChange(
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) {
    const nextSelection = event.nativeEvent.selection;

    setSelection(nextSelection);
    onSelectionUpdate?.(nextSelection);
    onSelectionChange?.(event);
  }

  function handleSelectMention(username: string) {
    if (!activeMention) {
      return;
    }

    const mention = `@${username} `;
    const nextValue =
      value.slice(0, activeMention.start) + mention + value.slice(activeMention.end);
    const nextCursor = activeMention.start + mention.length;

    onChangeText(nextValue);
    setSelection({ start: nextCursor, end: nextCursor });
    onSelectionUpdate?.({ start: nextCursor, end: nextCursor });
  }

  const suggestions =
    visibleCandidates.length > 0 ? (
      <View style={styles.suggestions}>
        {visibleCandidates.map((user) => (
          <Pressable
            accessibilityLabel={`Mention ${user.displayName}`}
            accessibilityRole="button"
            key={user._id}
            onPress={() => handleSelectMention(user.username)}
            style={({ pressed }) => [
              styles.suggestion,
              pressed ? styles.suggestionPressed : null,
            ]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user.displayName)}</Text>
            </View>
            <View style={styles.suggestionCopy}>
              <Text style={styles.suggestionName}>{user.displayName}</Text>
              <Text style={styles.suggestionMeta}>
                @{user.username}
                {user.cityName ? ` - ${user.cityName}` : ""}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      {suggestionsPlacement === "above" ? suggestions : null}
      <TextInput
        {...textInputProps}
        onChangeText={onChangeText}
        onSelectionChange={handleSelectionChange}
        selection={textInputSelection}
        style={inputStyle}
        value={value}
      />
      {suggestionsPlacement === "below" ? suggestions : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  suggestions: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    overflow: "hidden",
  },
  suggestion: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  suggestionPressed: {
    backgroundColor: colors.accentSoft,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  suggestionCopy: {
    flex: 1,
    minWidth: 0,
  },
  suggestionName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  suggestionMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
});
