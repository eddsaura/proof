import { StyleSheet, Text, View } from "react-native";

import { formatShortCalendarDate } from "@/convex/lib/dates";
import { colors } from "@/lib/theme";

type Batch = {
  _id?: string;
  label: string;
  houseName: string;
  cityName: string;
  startsOn?: string;
  endsOn?: string;
};

type BadgeType = "core";

const badgeAccents = [
  { backgroundColor: "#2b2419", borderColor: "#b99563" },
  { backgroundColor: "#172427", borderColor: "#6ea7a0" },
  { backgroundColor: "#281c22", borderColor: "#b87d92" },
  { backgroundColor: "#1f2318", borderColor: "#8ea160" },
] as const;

function formatDateRange(batch: Batch) {
  const startsOn = formatShortCalendarDate(batch.startsOn);
  const endsOn = formatShortCalendarDate(batch.endsOn);

  if (startsOn && endsOn) {
    return `${startsOn} - ${endsOn}`;
  }

  return startsOn ?? endsOn;
}

export function BatchBadges({
  batches,
  badgeTypes = [],
  compact = false,
}: {
  batches: Batch[];
  badgeTypes?: BadgeType[];
  compact?: boolean;
}) {
  const hasCoreBadge = badgeTypes.includes("core");

  if (batches.length === 0 && !hasCoreBadge) {
    return null;
  }

  return (
    <View style={styles.badges}>
      {hasCoreBadge ? (
        <View
          style={[
            styles.badge,
            styles.coreBadge,
            compact ? styles.badgeCompact : null,
          ]}
        >
          <Text
            style={[
              styles.houseName,
              styles.coreText,
              compact ? styles.houseNameCompact : null,
            ]}
          >
            Core
          </Text>
          <Text
            style={[
              styles.batchLabel,
              styles.coreLabel,
              compact ? styles.batchLabelCompact : null,
            ]}
          >
            SOTI team
          </Text>
        </View>
      ) : null}
      {batches.map((batch, index) => {
        const accent = badgeAccents[index % badgeAccents.length];
        const dateRange = formatDateRange(batch);

        return (
          <View
            key={batch._id ?? `${batch.label}-${index}`}
            style={[
              styles.badge,
              compact ? styles.badgeCompact : null,
              accent,
            ]}
          >
            <Text style={[styles.houseName, compact ? styles.houseNameCompact : null]}>
              {batch.houseName}
            </Text>
            <Text style={[styles.batchLabel, compact ? styles.batchLabelCompact : null]}>
              {batch.label}
              {dateRange ? ` - ${dateRange}` : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 2,
  },
  badgeCompact: {
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  coreBadge: {
    backgroundColor: "#f7f1e5",
    borderColor: "#f7f1e5",
  },
  coreText: {
    color: colors.background,
  },
  coreLabel: {
    color: "#5f584e",
  },
  houseName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  houseNameCompact: {
    fontSize: 12,
  },
  batchLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  batchLabelCompact: {
    fontSize: 11,
  },
});
