import { Redirect } from "expo-router";

import { api } from "@/convex/_generated/api";
import { LoadingScreen } from "@/components/loading-screen";
import { ProfileForm } from "@/components/profile-form";
import { useAction, useQuery } from "@/lib/convex";

export default function ProfileScreen() {
  const viewerState = useQuery(api.users.viewerState, {});
  const profile = useQuery(
    api.users.getMyProfile,
    viewerState?.kind === "active" ? {} : "skip",
  );
  const updateMyProfile = useAction(api.users.updateMyProfile);

  if (viewerState === undefined || (viewerState.kind === "active" && profile === undefined)) {
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
      batches={profile?.batches ?? []}
      badgeTypes={profile?.badgeTypes ?? []}
      initialValues={{
        displayName: viewerState.user.displayName,
        bio: viewerState.user.bio ?? "",
        phone: viewerState.user.phone,
        cityName: viewerState.user.cityName ?? "",
        countryCode: viewerState.user.countryCode,
        cityLat: viewerState.user.cityLat,
        cityLng: viewerState.user.cityLng,
      }}
      onSubmit={updateMyProfile}
    />
  );
}
