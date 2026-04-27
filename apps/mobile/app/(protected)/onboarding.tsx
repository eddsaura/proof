import { Redirect } from "expo-router";

import { api } from "@/convex/_generated/api";
import { LoadingScreen } from "@/components/loading-screen";
import { ProfileForm } from "@/components/profile-form";
import { useAction, useQuery } from "@/lib/convex";

export default function OnboardingScreen() {
  const viewerState = useQuery(api.users.viewerState, {});
  const completeProfile = useAction(api.users.completeProfile);

  if (viewerState === undefined) {
    return <LoadingScreen message="Preparing your onboarding..." />;
  }

  if (viewerState.kind === "active") {
    return <Redirect href="/(protected)/(drawer)/(tabs)/home" />;
  }

  if (viewerState.kind !== "onboarding") {
    return <Redirect href="/(protected)/pending" />;
  }

  return (
    <ProfileForm
      submitLabel="Enter the community"
      subtitle="Add the basics so other builders know who you are and where they can meet you."
      title="Finish your SOTI House profile"
      initialValues={{
        displayName: viewerState.user.displayName,
        bio: viewerState.user.bio ?? "",
        phone: viewerState.user.phone,
        cityName: viewerState.user.cityName ?? "",
        countryCode: viewerState.user.countryCode,
        cityLat: viewerState.user.cityLat,
        cityLng: viewerState.user.cityLng,
      }}
      onSubmit={completeProfile}
    />
  );
}
