import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, type Region } from "react-native-maps";

import { colors } from "@/lib/theme";
import { getWhatsAppUrl } from "@/lib/whatsapp";

type MapMember = {
  _id: string;
  cityLat: number;
  cityLng: number;
  cityName?: string;
  displayName: string;
  phone?: string;
};

type BuilderMapProps = {
  initialRegion: Region;
  members: MapMember[];
};

async function openWhatsApp(phone: string | undefined) {
  const url = getWhatsAppUrl(phone);

  if (!url) {
    return;
  }

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Could not open WhatsApp", "Check that WhatsApp is installed and try again.");
  }
}

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
          >
            <Callout onPress={() => void openWhatsApp(member.phone)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{member.displayName}</Text>
                {member.cityName ? (
                  <Text style={styles.calloutMeta}>{member.cityName}</Text>
                ) : null}
                {getWhatsAppUrl(member.phone) ? (
                  <View style={styles.calloutButton}>
                    <Text style={styles.calloutButtonText}>Message on WhatsApp</Text>
                  </View>
                ) : null}
              </View>
            </Callout>
          </Marker>
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
  callout: {
    gap: 6,
    minWidth: 190,
    padding: 6,
  },
  calloutTitle: {
    color: "#151511",
    fontSize: 14,
    fontWeight: "700",
  },
  calloutMeta: {
    color: "#62594c",
    fontSize: 12,
  },
  calloutButton: {
    alignItems: "center",
    backgroundColor: "#234f3c",
    borderRadius: 6,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  calloutButtonText: {
    color: "#f7f1e5",
    fontSize: 12,
    fontWeight: "700",
  },
});
