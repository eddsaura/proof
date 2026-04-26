import { StyleSheet, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";

import { colors } from "@/lib/theme";

type MapMember = {
  _id: string;
  cityLat: number;
  cityLng: number;
  cityName?: string;
  displayName: string;
};

type BuilderMapProps = {
  initialRegion: Region;
  members: MapMember[];
};

export function BuilderMap({ initialRegion, members }: BuilderMapProps) {
  return (
    <View style={styles.mapShell}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {members.map((member) => (
          <Marker
            key={member._id}
            coordinate={{
              latitude: member.cityLat,
              longitude: member.cityLng,
            }}
            title={member.displayName}
            description={member.cityName}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
