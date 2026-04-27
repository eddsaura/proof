import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { usePathname, useRouter } from "expo-router";
import type { ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  GearIcon,
  HouseIcon,
  MapPinLineIcon,
  PlusCircleIcon,
  ShieldIcon,
  SignOutIcon,
  TrayArrowDownIcon,
  UserIcon,
} from "phosphor-react-native";

import { BrandRoof } from "@/components/brand-assets";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/lib/convex";
import { colors } from "@/lib/theme";

type DrawerNavItem = {
  key: string;
  label: string;
  href: string;
  activePaths: string[];
  icon: ComponentType<any>;
  adminOnly?: boolean;
  desktopOnly?: boolean;
};

const navItems: DrawerNavItem[] = [
  {
    key: "home",
    label: "Home",
    href: "/(protected)/(drawer)/(tabs)/home",
    activePaths: ["/", "/home"],
    icon: HouseIcon,
  },
  {
    key: "map",
    label: "Map",
    href: "/(protected)/(drawer)/(tabs)/map",
    activePaths: ["/map"],
    icon: MapPinLineIcon,
    desktopOnly: true,
  },
  {
    key: "create",
    label: "Create",
    href: "/(protected)/(drawer)/(tabs)/create",
    activePaths: ["/create"],
    icon: PlusCircleIcon,
    desktopOnly: true,
  },
  {
    key: "inbox",
    label: "Inbox",
    href: "/(protected)/(drawer)/(tabs)/inbox",
    activePaths: ["/inbox"],
    icon: TrayArrowDownIcon,
    desktopOnly: true,
  },
  {
    key: "profile",
    label: "Profile",
    href: "/(protected)/(drawer)/profile",
    activePaths: ["/profile"],
    icon: UserIcon,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/(protected)/(drawer)/settings",
    activePaths: ["/settings"],
    icon: GearIcon,
  },
  {
    key: "admin",
    label: "Admin",
    href: "/(protected)/(drawer)/admin",
    activePaths: ["/admin"],
    icon: ShieldIcon,
    adminOnly: true,
  },
];

export function AppDrawerContent(
  props: DrawerContentComponentProps & {
    isAdmin: boolean;
    isDesktopLayout: boolean;
  },
) {
  const pathname = usePathname();
  const router = useRouter();
  const viewerState = useQuery(api.users.viewerState, {});
  const { signOut } = useAuthActions();
  const username =
    viewerState?.kind === "active" ? `@${viewerState.user.username}` : "@builder";
  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && !props.isAdmin) {
      return false;
    }

    if (item.desktopOnly && !props.isDesktopLayout) {
      return false;
    }

    return true;
  });

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1 }}
      style={{ backgroundColor: colors.background }}
    >
      <View style={styles.drawerBrand}>
        <BrandRoof color={colors.ink} width={64} height={39} />
        <Text style={styles.drawerUsername}>{username}</Text>
      </View>

      <View style={{ gap: 2 }}>
        {visibleItems.map((item) => {
          const focused = item.activePaths.some(
            (activePath) => pathname === activePath || pathname.endsWith(activePath),
          );
          const DrawerIcon = item.icon;

          return (
            <DrawerItem
              key={item.key}
              focused={focused}
              label={item.label}
              onPress={() => {
                router.navigate(item.href as never);

                if (!props.isDesktopLayout) {
                  props.navigation.closeDrawer();
                }
              }}
              activeBackgroundColor={colors.selectedSoft}
              activeTintColor={colors.selected}
              inactiveTintColor={colors.ink}
              icon={({ color, size }) => (
                <DrawerIcon
                  color={color}
                  size={size}
                  weight={focused ? "fill" : "regular"}
                />
              )}
              labelStyle={[
                styles.drawerLabel,
                focused ? styles.drawerLabelActive : null,
              ]}
              style={styles.drawerItem}
            />
          );
        })}
      </View>

      <View style={{ marginTop: "auto", padding: 16 }}>
        <DrawerItem
          label="Sign out"
          onPress={() => void signOut()}
          inactiveTintColor={colors.muted}
          icon={({ color, size }) => (
            <SignOutIcon color={color} size={size} />
          )}
          labelStyle={styles.signOutLabel}
          style={styles.drawerItem}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerBrand: {
    alignItems: "flex-start",
    gap: 10,
    paddingBottom: 22,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  drawerUsername: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "600",
  },
  drawerItem: {
    borderRadius: 8,
  },
  drawerLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "500",
  },
  drawerLabelActive: {
    color: colors.selected,
    fontWeight: "800",
  },
  signOutLabel: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "500",
  },
});
