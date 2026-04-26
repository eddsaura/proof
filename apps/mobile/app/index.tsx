import { Redirect } from "expo-router";
import { useConvexAuth } from "convex/react";

import { api } from "@/convex/_generated/api";
import { LoadingScreen } from "@/components/loading-screen";
import { useQuery } from "@/lib/convex";

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const viewerState = useQuery(api.users.viewerState, {});

  if (isLoading || (isAuthenticated && viewerState === undefined)) {
    return <LoadingScreen message="Opening the house..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/sign-in" />;
  }

  switch (viewerState?.kind) {
    case "pending":
      return <Redirect href="/(protected)/pending" />;
    case "onboarding":
      return <Redirect href="/(protected)/onboarding" />;
    case "active":
      return <Redirect href="/(protected)/(drawer)/(tabs)/home" />;
    default:
      return <LoadingScreen message="Checking your access..." />;
  }
}
