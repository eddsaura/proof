import { DrawerToggleButton } from "@react-navigation/drawer";
import { Tabs } from "expo-router";
import { Platform, useWindowDimensions } from "react-native";
import {
  HouseIcon,
  MapPinLineIcon,
  PlusCircleIcon,
  TrayArrowDownIcon,
} from "phosphor-react-native";

import { BrandLogo } from "@/components/brand-assets";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/lib/convex";
import { colors, layout } from "@/lib/theme";

export default function TabsLayout() {
  const dimensions = useWindowDimensions();
  const unreadCount = useQuery(api.notifications.unreadCount, {});
  const isDesktopLayout =
    Platform.OS === "web" && dimensions.width >= layout.desktopBreakpoint;

  return (
    <Tabs
      screenOptions={{
        headerLeft: isDesktopLayout
          ? undefined
          : () => <DrawerToggleButton tintColor={colors.ink} />,
        headerTitle: () => (
          <BrandLogo color={colors.ink} width={58} height={20} />
        ),
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.ink,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
        },
        tabBarActiveTintColor: colors.selected,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          display: isDesktopLayout ? "none" : "flex",
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
          tabBarIcon: ({ color, focused }) => (
            <HouseIcon
              color={color}
              size={24}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarLabel: "Map",
          tabBarIcon: ({ color, focused }) => (
            <MapPinLineIcon
              color={color}
              size={24}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarLabel: "Create",
          tabBarIcon: ({ color, focused }) => (
            <PlusCircleIcon
              color={color}
              size={24}
              weight={focused ? "fill" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarLabel: "Inbox",
          tabBarIcon: ({ color, focused }) => (
            <TrayArrowDownIcon
              color={color}
              size={24}
              weight={focused ? "fill" : "regular"}
            />
          ),
          tabBarBadge: unreadCount && unreadCount > 0 ? unreadCount : undefined,
        }}
      />
    </Tabs>
  );
}
