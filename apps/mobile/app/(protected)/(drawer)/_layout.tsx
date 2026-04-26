import { Drawer } from "expo-router/drawer";

import { AppDrawerContent } from "@/components/app-drawer-content";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

export default function DrawerLayout() {
  const viewerState = useQuery(api.users.viewerState, {});
  const isAdmin = viewerState?.kind === "active" && viewerState.user.role === "admin";

  return (
    <Drawer
      drawerContent={(props) => (
        <AppDrawerContent {...props} isAdmin={Boolean(isAdmin)} />
      )}
      screenOptions={{
        drawerActiveBackgroundColor: colors.accentSoft,
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.muted,
        drawerStyle: {
          backgroundColor: colors.background,
        },
        drawerType: "slide",
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.ink,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
        },
        sceneContainerStyle: {
          backgroundColor: colors.background,
        },
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
