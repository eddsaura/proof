import Google from "@auth/core/providers/google";
import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

import {
  ensureDefaultBatches,
  ensureDefaultCategories,
  findActiveInviteByUsername,
  normalizeUsername,
} from "./lib/community";
import { isAdminRole, resolveManagedRole } from "./lib/auth";

function googleProfile(profile: Record<string, unknown>) {
  return {
    id: String(profile.id ?? ""),
    name: String(profile.name ?? profile.given_name ?? ""),
    email: typeof profile.email === "string" ? profile.email : undefined,
    image:
      typeof profile.picture === "string"
        ? profile.picture
        : typeof profile.image === "string"
          ? profile.image
          : undefined,
    username: normalizeUsername(String(profile.given_name ?? profile.name ?? "")),
  };
}

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

function appProfile(
  provider: string,
  profile: Record<string, unknown>,
) {
  if (provider === "github") {
    return githubProfile(profile);
  }

  return googleProfile(profile);
}

function normalizeEmail(email: string | undefined) {
  return email?.trim().toLowerCase();
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      profile(profile) {
        return githubProfile(profile as Record<string, unknown>);
      },
    }),
    Google({
      profile(profile) {
        return googleProfile(profile as Record<string, unknown>);
      },
    }),
  ],
  callbacks: {
    async redirect({ redirectTo }) {
      return redirectTo;
    },
    async createOrUpdateUser(ctx, args) {
      const profile = appProfile(args.provider.id, args.profile);
      const normalizedEmail = normalizeEmail(profile.email);
      const invite = await findActiveInviteByUsername(ctx, profile.username);
      const now = Date.now();

      if (args.existingUserId !== null) {
        const existingUser = await ctx.db.get(args.existingUserId);

        if (existingUser === null) {
          throw new Error("Expected existing user to be present.");
        }

        const role = resolveManagedRole(
          profile.username,
          invite?.role ?? existingUser.role ?? "member",
        );

        await ctx.db.patch(args.existingUserId, {
          authUserId: existingUser.authUserId,
          username: existingUser.username,
          name: profile.name || existingUser.name,
          image: profile.image ?? existingUser.image,
          email: normalizedEmail ?? existingUser.email,
          displayName: existingUser.displayName || profile.name || existingUser.username,
          avatarUrl: profile.image ?? existingUser.avatarUrl,
          batchIds: invite?.batchIds ?? existingUser.batchIds,
          role,
        });

        if (isAdminRole(role)) {
          await ensureDefaultCategories(ctx);
        }

        await ensureDefaultBatches(ctx);

        return args.existingUserId;
      }

      if (normalizedEmail) {
        const userWithSameEmail = await ctx.db
          .query("users")
          .withIndex("email" as any, (q: any) => q.eq("email", normalizedEmail))
          .unique();

        if (userWithSameEmail !== null) {
          const role = resolveManagedRole(
            profile.username,
            invite?.role ?? userWithSameEmail.role ?? "member",
          );

          await ctx.db.patch(userWithSameEmail._id, {
            name: profile.name || userWithSameEmail.name,
            image: profile.image ?? userWithSameEmail.image,
            email: normalizedEmail,
            displayName: userWithSameEmail.displayName || profile.name || userWithSameEmail.username,
            avatarUrl: profile.image ?? userWithSameEmail.avatarUrl,
            batchIds: invite?.batchIds ?? userWithSameEmail.batchIds,
            role,
          });

          if (isAdminRole(role)) {
            await ensureDefaultCategories(ctx);
          }

          await ensureDefaultBatches(ctx);

          return userWithSameEmail._id;
        }
      }

      const role = resolveManagedRole(profile.username, invite?.role ?? "member");

      const userId = await ctx.db.insert("users", {
        authUserId: profile.id || profile.username,
        username: profile.username,
        name: profile.name || profile.username,
        image: profile.image,
        email: normalizedEmail,
        displayName: profile.name || profile.username,
        avatarUrl: profile.image,
        batchIds: invite?.batchIds,
        role,
        status: "invited",
        createdAt: now,
      });

      if (isAdminRole(role)) {
        await ensureDefaultCategories(ctx);
      }

      await ensureDefaultBatches(ctx);

      return userId;
    },
  },
});
