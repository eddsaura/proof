import { useDeferredValue, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/empty-state";
import { MentionText } from "@/components/mention-text";
import { PrimaryButton } from "@/components/primary-button";
import { useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

const nativeMapsModule =
  Platform.OS === "web"
    ? null
    : (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          return require("react-native-maps") as typeof import("react-native-maps");
        } catch {
          return null;
        }
      })();

const NativeMapView = nativeMapsModule?.default;
const NativeMarker = nativeMapsModule?.Marker;

export default function MapTabScreen() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const members = useQuery(api.map.listMembers, { search: deferredSearch });
  const mappableMembers = useMemo(
    () =>
      (members ?? []).filter(
        (
          member,
        ): member is typeof member & { cityLat: number; cityLng: number } =>
          member.cityLat !== undefined && member.cityLng !== undefined,
      ),
    [members],
  );

  const initialRegion = useMemo(() => {
    const first = mappableMembers[0];

    if (!first) {
      return {
        latitude: 20,
        longitude: 0,
        latitudeDelta: 70,
        longitudeDelta: 70,
      };
    }

    return {
      latitude: first.cityLat,
      longitude: first.cityLng,
      latitudeDelta: 18,
      longitudeDelta: 18,
    };
  }, [mappableMembers]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>Find builders by city.</Text>
        <Text style={styles.copy}>
          Pins show only home-city locations in v1, never exact addresses.
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setSearch}
          placeholder="Search by city or member"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={search}
        />
      </View>

      {Platform.OS === "web" || !NativeMapView || !NativeMarker ? (
        <View style={styles.webFallback}>
          <Text style={styles.webFallbackTitle}>Map preview is unavailable in this build.</Text>
          <Text style={styles.copy}>
            The searchable member list below still works, and the native map will
            appear once the simulator is running a binary with `react-native-maps`
            available.
          </Text>
        </View>
      ) : (
        <View style={styles.mapShell}>
          <NativeMapView style={styles.map} initialRegion={initialRegion}>
            {mappableMembers.map((member) => (
              <NativeMarker
                key={member._id}
                coordinate={{
                  latitude: member.cityLat,
                  longitude: member.cityLng,
                }}
                title={member.displayName}
                description={member.cityName}
              />
            ))}
          </NativeMapView>
        </View>
      )}

      <View style={styles.list}>
        {members?.length ? (
          members.map((member) => (
            <View key={member._id} style={styles.memberCard}>
              <Text style={styles.memberName}>{member.displayName}</Text>
              <Text style={styles.memberMeta}>
                @{member.username} • {member.cityName}
              </Text>
              {member.bio ? (
                <MentionText text={member.bio} style={styles.memberBio} />
              ) : null}
              <PrimaryButton
                label="View profile"
                onPress={() =>
                  router.push({
                    pathname: "/(protected)/member/[username]",
                    params: { username: member.username },
                  })
                }
                variant="secondary"
              />
            </View>
          ))
        ) : (
          <EmptyState
            title="No builders match this search"
            description="Try another city or member name."
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
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
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
  webFallback: {
    borderRadius: 10,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  webFallbackTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  mapShell: {
    overflow: "hidden",
    borderRadius: 10,
    backgroundColor: colors.paper,
    borderColor: colors.border,
    borderWidth: 1,
    height: 320,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  list: {
    gap: 12,
  },
  memberCard: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: 16,
    gap: 8,
  },
  memberName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  memberMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  memberBio: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
});
