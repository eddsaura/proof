import { Drawer } from "expo-router/drawer";

import { AppDrawerContent } from "@/components/app-drawer-content";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/lib/convex";

export default function DrawerLayout() {
  const viewerState = useQuery(api.users.viewerState, {});
  const isAdmin = viewerState?.kind === "active" && viewerState.user.role === "admin";

  return (
    <Drawer
      drawerContent={(props) => (
        <AppDrawerContent {...props} isAdmin={Boolean(isAdmin)} />
      )}
      screenOptions={{
        drawerType: "slide",
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
