import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";

type MapMember = {
  _id: string;
  cityLat: number;
  cityLng: number;
  cityName?: string;
  displayName: string;
};

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type BuilderMapProps = {
  initialRegion: Region;
  members: MapMember[];
};

export function BuilderMap({ members }: BuilderMapProps) {
  return (
    <View style={styles.webFallback}>
      <Text style={styles.webFallbackTitle}>Map preview is unavailable on web.</Text>
      <Text style={styles.copy}>
        {members.length > 0
          ? "Use the searchable member list below while viewing this build in a browser."
          : "Search for a city or member to browse builders in this web build."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
