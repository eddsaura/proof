import { router } from "expo-router";
import {
  type GestureResponderEvent,
  StyleProp,
  Text,
  TextStyle,
} from "react-native";

import { colors } from "@/lib/theme";

export function ProfileUsername({
  username,
  style,
  muted = false,
}: {
  username?: string | null;
  style?: StyleProp<TextStyle>;
  muted?: boolean;
}) {
  const normalizedUsername = username?.trim().replace(/^@+/, "").toLowerCase();

  if (!normalizedUsername) {
    return <Text style={style}>@unknown</Text>;
  }

  const profileUsername = normalizedUsername;

  function openProfile(event?: GestureResponderEvent) {
    event?.stopPropagation();
    router.push({
      pathname: "/(protected)/member/[username]",
      params: { username: profileUsername },
    });
  }

  return (
    <Text
      accessibilityRole="link"
      onPress={openProfile}
      style={[
        {
          color: muted ? colors.muted : colors.accent,
          fontWeight: "700",
        },
        style,
      ]}
    >
      @{profileUsername}
    </Text>
  );
}
