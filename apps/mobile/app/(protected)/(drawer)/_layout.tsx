import { Drawer } from "expo-router/drawer";
import { Platform, useWindowDimensions } from "react-native";

import { AppDrawerContent } from "@/components/app-drawer-content";
import { BrandLogo } from "@/components/brand-assets";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/lib/convex";
import { colors, layout } from "@/lib/theme";

export default function DrawerLayout() {
  const dimensions = useWindowDimensions();
  const viewerState = useQuery(api.users.viewerState, {});
  const isAdmin =
    viewerState?.kind === "active" &&
    (viewerState.user.role === "admin" || viewerState.user.role === "super-admin");
  const isDesktopLayout =
    Platform.OS === "web" && dimensions.width >= layout.desktopBreakpoint;

  return (
    <Drawer
      drawerContent={(props) => (
        <AppDrawerContent
          {...props}
          isAdmin={Boolean(isAdmin)}
          isDesktopLayout={isDesktopLayout}
        />
      )}
      screenOptions={{
        drawerActiveBackgroundColor: colors.selectedSoft,
        drawerActiveTintColor: colors.selected,
        drawerInactiveTintColor: colors.ink,
        drawerStyle: {
          backgroundColor: colors.background,
          borderRightColor: colors.border,
          borderRightWidth: isDesktopLayout ? 1 : 0,
          width: layout.drawerWidth,
        },
        drawerType: isDesktopLayout
          ? "permanent"
          : Platform.OS === "web"
            ? "front"
            : "slide",
        headerLeft: isDesktopLayout ? () => null : undefined,
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
        sceneStyle: {
          backgroundColor: colors.background,
        },
        swipeEnabled: !isDesktopLayout && Platform.OS !== "web",
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Home",
          headerShown: false,
          title: "Home",
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          title: "Profile",
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="admin"
        options={{
          drawerLabel: "Admin",
          title: "Admin",
          headerShown: true,
        }}
      />
    </Drawer>
  );
}
