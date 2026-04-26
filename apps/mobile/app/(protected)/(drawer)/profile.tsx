import { Redirect } from "expo-router";

import { api } from "@/convex/_generated/api";
import { LoadingScreen } from "@/components/loading-screen";
import { ProfileForm } from "@/components/profile-form";
import { useAction, useQuery } from "@/lib/convex";

export default function ProfileScreen() {
  const viewerState = useQuery(api.users.viewerState, {});
  const updateMyProfile = useAction(api.users.updateMyProfile);

  if (viewerState === undefined) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  if (viewerState.kind !== "active") {
    return <Redirect href="/(protected)/pending" />;
  }

  return (
    <ProfileForm
      submitLabel="Save profile"
      subtitle="This is what members see from mentions, the map, and profile links."
      title="Your member profile"
      initialValues={{
        displayName: viewerState.user.displayName,
        bio: viewerState.user.bio ?? "",
        cityName: viewerState.user.cityName ?? "",
      }}
      onSubmit={updateMyProfile}
    />
  );
}
