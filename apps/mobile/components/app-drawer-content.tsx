import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Text, View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";

import { api } from "@/convex/_generated/api";
import { useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

const icons = {
  "(tabs)": "home-outline",
  profile: "person-outline",
  settings: "settings-outline",
  admin: "shield-outline",
} as const;

export function AppDrawerContent(
  props: DrawerContentComponentProps & { isAdmin: boolean },
) {
  const viewerState = useQuery(api.users.viewerState, {});
  const { signOut } = useAuthActions();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 6 }}>
        <Text style={{ color: colors.ink, fontSize: 22, fontWeight: "700" }}>
          {viewerState?.kind === "active" ? viewerState.user.displayName : "Builder"}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          {viewerState?.kind === "active"
            ? `@${viewerState.user.username}`
            : "Private community"}
        </Text>
      </View>

      <View style={{ gap: 2 }}>
        {props.state.routes
          .filter((route) => (props.isAdmin ? true : route.name !== "admin"))
          .map((route) => {
            const focused = props.state.routeNames[props.state.index] === route.name;
            return (
              <DrawerItem
                key={route.key}
                focused={focused}
                label={route.name === "(tabs)" ? "Home" : route.name[0].toUpperCase() + route.name.slice(1)}
                onPress={() => props.navigation.navigate(route.name as never)}
                icon={({ color, size }) => (
                  <Ionicons
                    color={color}
                    name={icons[route.name as keyof typeof icons]}
                    size={size}
                  />
                )}
              />
            );
          })}
      </View>

      <View style={{ marginTop: "auto", padding: 16 }}>
        <DrawerItem
          label="Sign out"
          onPress={() => void signOut()}
          icon={({ color, size }) => (
            <Ionicons color={color} name="log-out-outline" size={size} />
          )}
        />
      </View>
    </DrawerContentScrollView>
  );
}
