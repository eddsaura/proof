import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CheckCircleIcon,
  CrosshairIcon,
  MagnifyingGlassIcon,
  MapPinLineIcon,
} from "phosphor-react-native";

import { api } from "@/convex/_generated/api";
import { useAction } from "@/lib/convex";
import { colors } from "@/lib/theme";

export type CityLocation = {
  id?: string;
  cityName: string;
  countryCode: string;
  cityLat: number;
  cityLng: number;
  region?: string | null;
  country?: string | null;
  label?: string;
};

function locationLabel(location: CityLocation) {
  return (
    location.label ??
    [location.cityName, location.region, location.countryCode]
      .filter(Boolean)
      .join(", ")
  );
}

export function LocationPicker({
  initialLocation,
  initialQuery,
  onChange,
}: {
  initialLocation: CityLocation | null;
  initialQuery: string;
  onChange: (location: CityLocation | null) => void;
}) {
  const searchCities = useAction(api.users.searchCities);
  const [query, setQuery] = useState(
    initialLocation ? locationLabel(initialLocation) : initialQuery,
  );
  const [selectedLocation, setSelectedLocation] = useState<CityLocation | null>(
    initialLocation,
  );
  const [suggestions, setSuggestions] = useState<CityLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const search = query.trim();

    if (selectedLocation && search === locationLabel(selectedLocation)) {
      setSuggestions([]);
      return;
    }

    if (search.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    let isCurrent = true;
    setIsSearching(true);

    const timeoutId = setTimeout(() => {
      void searchCities({ query: search })
        .then((results) => {
          if (!isCurrent) {
            return;
          }

          setSuggestions(results);
          setMessage(results.length === 0 ? "No city matches yet." : null);
        })
        .catch((error) => {
          if (!isCurrent) {
            return;
          }

          setSuggestions([]);
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not search cities right now.",
          );
        })
        .finally(() => {
          if (isCurrent) {
            setIsSearching(false);
          }
        });
    }, 250);

    return () => {
      isCurrent = false;
      clearTimeout(timeoutId);
    };
  }, [query, searchCities, selectedLocation]);

  function selectLocation(location: CityLocation) {
    setSelectedLocation(location);
    setQuery(locationLabel(location));
    setSuggestions([]);
    setMessage(null);
    onChange(location);
  }

  async function handleUseCurrentCity() {
    try {
      setIsLocating(true);
      setMessage(null);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setMessage("Location permission was not granted. Search by city instead.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const addresses = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const address = addresses[0];
      const city = address?.city ?? address?.subregion ?? address?.district;

      if (!city) {
        setMessage("We could not detect your city. Search for it instead.");
        return;
      }

      const cityQuery = [city, address.region, address.isoCountryCode]
        .filter(Boolean)
        .join(", ");
      const results = await searchCities({ query: cityQuery });

      if (results.length === 0) {
        setMessage("We found your position, but not a city match.");
        setQuery(city);
        return;
      }

      selectLocation(results[0]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not detect your current city.",
      );
    } finally {
      setIsLocating(false);
    }
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setMessage(null);

    if (!selectedLocation || nextQuery !== locationLabel(selectedLocation)) {
      setSelectedLocation(null);
      onChange(null);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.searchRow}>
        <View style={styles.inputShell}>
          <MagnifyingGlassIcon color={colors.muted} size={18} />
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={handleQueryChange}
            placeholder="Barcelona, Lisbon, Buenos Aires..."
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={query}
          />
          {isSearching ? <ActivityIndicator color={colors.muted} /> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isLocating}
          onPress={() => void handleUseCurrentCity()}
          style={({ pressed }) => [
            styles.locateButton,
            pressed ? styles.pressed : null,
            isLocating ? styles.disabled : null,
          ]}
        >
          <CrosshairIcon color={colors.ink} size={18} weight="bold" />
          <Text style={styles.locateLabel}>
            {isLocating ? "Finding..." : "Use my current city"}
          </Text>
        </Pressable>
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((location) => (
            <Pressable
              accessibilityRole="button"
              key={location.id ?? locationLabel(location)}
              onPress={() => selectLocation(location)}
              style={({ pressed }) => [
                styles.suggestionRow,
                pressed ? styles.pressedRow : null,
              ]}
            >
              <MapPinLineIcon color={colors.muted} size={19} />
              <View style={styles.suggestionText}>
                <Text style={styles.suggestionTitle}>{location.cityName}</Text>
                <Text style={styles.suggestionMeta}>
                  {[location.region, location.country ?? location.countryCode]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {selectedLocation ? (
        <View style={styles.confirmation}>
          <CheckCircleIcon color={colors.accent} size={20} weight="fill" />
          <View style={styles.confirmationText}>
            <Text style={styles.confirmationTitle}>
              {selectedLocation.cityName}, {selectedLocation.countryCode}
            </Text>
            <Text style={styles.confirmationMeta}>
              Shown as a city-level pin, never your exact location.
            </Text>
          </View>
        </View>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  searchRow: {
    gap: 10,
  },
  inputShell: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    paddingVertical: 12,
  },
  locateButton: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  locateLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  suggestions: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.paper,
  },
  suggestionRow: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    flex: 1,
    gap: 2,
  },
  suggestionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  suggestionMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  confirmation: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  confirmationText: {
    flex: 1,
    gap: 3,
  },
  confirmationTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  confirmationMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  message: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.88,
  },
  pressedRow: {
    backgroundColor: colors.selectedSoft,
  },
  disabled: {
    opacity: 0.55,
  },
});
