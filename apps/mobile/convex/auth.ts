import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

import {
  ensureDefaultBatches,
  ensureDefaultCategories,
  findActiveInviteByUsername,
  normalizeUsername,
} from "./lib/community";

function githubProfile(profile: Record<string, unknown>) {
  return {
    id: String(profile.id ?? ""),
    name: String(profile.name ?? profile.login ?? ""),
    email: typeof profile.email === "string" ? profile.email : undefined,
    image:
      typeof profile.avatar_url === "string"
        ? profile.avatar_url
        : typeof profile.image === "string"
          ? profile.image
          : undefined,
    username: normalizeUsername(String(profile.login ?? profile.name ?? "")),
  };
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      profile(profile) {
        return githubProfile(profile as Record<string, unknown>);
      },
    }),
  ],
  callbacks: {
    async redirect({ redirectTo }) {
      return redirectTo;
    },
    async createOrUpdateUser(ctx, args) {
      const profile = githubProfile(args.profile);
      const invite = await findActiveInviteByUsername(ctx, profile.username);
      const role = invite?.role ?? "member";
      const now = Date.now();

      if (args.existingUserId !== null) {
        const existingUser = await ctx.db.get(args.existingUserId);

        if (existingUser === null) {
          throw new Error("Expected existing user to be present.");
        }

        await ctx.db.patch(args.existingUserId, {
          authUserId: existingUser.authUserId,
          username: existingUser.username,
          name: profile.name || existingUser.name,
          image: profile.image ?? existingUser.image,
          email: profile.email ?? existingUser.email,
          displayName: existingUser.displayName || profile.name || existingUser.username,
          avatarUrl: profile.image ?? existingUser.avatarUrl,
          batchIds: invite?.batchIds ?? existingUser.batchIds,
          role,
        });

        if (role === "admin") {
          await ensureDefaultCategories(ctx);
        }

        await ensureDefaultBatches(ctx);

        return args.existingUserId;
      }

      const userId = await ctx.db.insert("users", {
        authUserId: profile.id || profile.username,
        username: profile.username,
        name: profile.name || profile.username,
        image: profile.image,
        email: profile.email,
        displayName: profile.name || profile.username,
        avatarUrl: profile.image,
        batchIds: invite?.batchIds,
        role,
        status: "invited",
        createdAt: now,
      });

      if (role === "admin") {
        await ensureDefaultCategories(ctx);
      }

      await ensureDefaultBatches(ctx);

      return userId;
    },
  },
});
