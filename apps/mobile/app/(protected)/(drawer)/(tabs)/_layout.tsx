import { DrawerToggleButton } from "@react-navigation/drawer";
import { Tabs } from "expo-router";
import {
  HouseIcon,
  MapPinLineIcon,
  PlusCircleIcon,
  TrayArrowDownIcon,
} from "phosphor-react-native";

import { api } from "@/convex/_generated/api";
import { useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const unreadCount = useQuery(api.notifications.unreadCount, {});

  return (
    <Tabs
      screenOptions={{
        headerLeft: () => <DrawerToggleButton tintColor={colors.ink} />,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.ink,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <HouseIcon color={color} size={24} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarLabel: "Map",
          tabBarIcon: ({ color }) => (
            <MapPinLineIcon color={color} size={24} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarLabel: "Create",
          tabBarIcon: ({ color }) => (
            <PlusCircleIcon color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarLabel: "Inbox",
          tabBarIcon: ({ color }) => (
            <TrayArrowDownIcon color={color} size={24} weight="fill" />
          ),
          tabBarBadge: unreadCount && unreadCount > 0 ? unreadCount : undefined,
        }}
      />
    </Tabs>
  );
}
