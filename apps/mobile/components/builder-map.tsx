import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import maplibregl, { type LngLatBoundsLike, type Map, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { colors, lightColors } from "@/lib/theme";
import { getWhatsAppUrl } from "@/lib/whatsapp";

type MapMember = {
  _id: string;
  cityLat: number;
  cityLng: number;
  cityName?: string;
  displayName: string;
  phone?: string;
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

const mapStyle = "https://tiles.openfreemap.org/styles/bright";
const pinColor = "#b4453c";

function regionZoom(region: Region) {
  const zoomFromLongitude = Math.log2(360 / Math.max(region.longitudeDelta, 0.001));
  const zoomFromLatitude = Math.log2(170 / Math.max(region.latitudeDelta, 0.001));

  return Math.max(1, Math.min(12, Math.min(zoomFromLatitude, zoomFromLongitude)));
}

function createPopup(member: MapMember) {
  const content = document.createElement("div");
  content.style.display = "grid";
  content.style.gap = "2px";

  const name = document.createElement("strong");
  name.textContent = member.displayName;
  name.style.color = lightColors.ink;
  name.style.fontSize = "14px";

  const city = document.createElement("span");
  city.textContent = member.cityName ?? "Home city";
  city.style.color = lightColors.muted;
  city.style.fontSize = "12px";

  content.append(name, city);

  const whatsappUrl = getWhatsAppUrl(member.phone);

  if (whatsappUrl) {
    const link = document.createElement("a");
    link.href = whatsappUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Message on WhatsApp";
    link.style.color = "#1f6f4a";
    link.style.fontSize = "12px";
    link.style.fontWeight = "700";
    link.style.marginTop = "6px";
    link.style.textDecoration = "none";
    content.append(link);
  }

  return new maplibregl.Popup({ offset: 18 }).setDOMContent(content);
}

function createMarkerElement() {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.setAttribute("aria-label", "Member city marker");
  marker.style.width = "18px";
  marker.style.height = "18px";
  marker.style.borderRadius = "999px";
  marker.style.border = `3px solid ${colors.selected}`;
  marker.style.background = pinColor;
  marker.style.boxShadow = "0 5px 14px rgba(0, 0, 0, 0.22)";
  marker.style.cursor = "pointer";
  marker.style.padding = "0";

  return marker;
}

function fitMapToMembers(map: Map, members: MapMember[], initialRegion: Region) {
  if (members.length === 0) {
    map.easeTo({
      center: [initialRegion.longitude, initialRegion.latitude],
      zoom: regionZoom(initialRegion),
      duration: 400,
    });
    return;
  }

  if (members.length === 1) {
    const [member] = members;
    map.easeTo({
      center: [member.cityLng, member.cityLat],
      zoom: Math.max(regionZoom(initialRegion), 4),
      duration: 400,
    });
    return;
  }

  const bounds = members.reduce(
    (nextBounds, member) => nextBounds.extend([member.cityLng, member.cityLat]),
    new maplibregl.LngLatBounds(
      [members[0].cityLng, members[0].cityLat],
      [members[0].cityLng, members[0].cityLat],
    ),
  );

  map.fitBounds(bounds as LngLatBoundsLike, {
    padding: 54,
    maxZoom: 7,
    duration: 400,
  });
}

export function BuilderMap({ initialRegion, members }: BuilderMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      attributionControl: { compact: true },
      center: [initialRegion.longitude, initialRegion.latitude],
      container: containerRef.current,
      style: mapStyle,
      zoom: regionZoom(initialRegion),
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [initialRegion]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = members.map((member) =>
      new maplibregl.Marker({ element: createMarkerElement() })
        .setLngLat([member.cityLng, member.cityLat])
        .setPopup(createPopup(member))
        .addTo(map),
    );

    fitMapToMembers(map, members, initialRegion);
  }, [initialRegion, members]);

  return (
    <View style={styles.mapShell}>
      <View
        // React Native Web exposes this View as a DOM node; MapLibre needs the underlying element.
        ref={containerRef as never}
        style={styles.map}
      />
      {members.length === 0 ? (
        <View pointerEvents="none" style={styles.emptyOverlay}>
          <Text style={styles.emptyTitle}>No city pins yet</Text>
          <Text style={styles.emptyCopy}>Search for a city or member to update the map.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    borderRadius: 10,
    backgroundColor: colors.paper,
    borderColor: colors.border,
    borderWidth: 1,
    height: 360,
    overflow: "hidden",
  },
  map: {
    height: "100%",
    width: "100%",
  },
  emptyOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    gap: 3,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});
