import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { api, internal } from "./_generated/api";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { getCurrentUser, requireActiveUser, resolveInviteState } from "./lib/auth";

async function geocodeCity(cityName: string) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`,
  );

  if (!response.ok) {
    throw new Error("Could not geocode that city right now.");
  }

  const payload = (await response.json()) as {
    results?: Array<{
      latitude: number;
      longitude: number;
      country_code?: string;
      name?: string;
      admin1?: string;
      country?: string;
    }>;
  };

  const result = payload.results?.[0];

  if (!result) {
    throw new Error("We could not find that city. Try a more specific name.");
  }

  return {
    cityName: result.name ?? cityName.trim(),
    countryCode: result.country_code ?? result.country ?? "",
    cityLat: result.latitude,
    cityLng: result.longitude,
  };
}

export const viewerState = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return {
        kind: "anonymous" as const,
      };
    }

    const inviteState = await resolveInviteState(ctx, user);

    if (inviteState.kind === "pending") {
      return {
        kind: "pending" as const,
        user,
      };
    }

    if (inviteState.kind === "onboarding") {
      return {
        kind: "onboarding" as const,
        user,
        invite: inviteState.invite,
      };
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", user._id))
      .collect();

    return {
      kind: "active" as const,
      user,
      unreadCount: unreadNotifications.filter((notification) => notification.readAt === undefined)
        .length,
    };
  },
});

export const getByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await requireActiveUser(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .unique();

    if (user === null || user.status !== "active") {
      return null;
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author_createdAt", (q) => q.eq("authorId", user._id))
      .order("desc")
      .take(5);

    const postSummaries = await Promise.all(
      posts.map(async (post) => {
        const category = await ctx.db.get(post.categoryId);

        return {
          ...post,
          category,
        };
      }),
    );

    return {
      user,
      recentPosts: postSummaries,
    };
  },
});

export const completeProfile = action({
  args: {
    displayName: v.string(),
    bio: v.string(),
    cityName: v.string(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);

    if (authUserId === null) {
      throw new Error("You must be signed in to complete your profile.");
    }

    const viewer = await ctx.runQuery(api.users.viewerState, {});

    if (viewer.kind !== "onboarding") {
      throw new Error("Your account is not ready for onboarding.");
    }

    const location = await geocodeCity(args.cityName);

    await ctx.runMutation(internal.users.applyProfileUpdate, {
      userId: authUserId,
      displayName: args.displayName.trim(),
      bio: args.bio.trim(),
      role: viewer.invite.role,
      status: "active",
      ...location,
    });

    return { ok: true };
  },
});

export const updateMyProfile = action({
  args: {
    displayName: v.string(),
    bio: v.string(),
    cityName: v.string(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);

    if (authUserId === null) {
      throw new Error("You must be signed in to update your profile.");
    }

    const viewer = await ctx.runQuery(api.users.viewerState, {});

    if (viewer.kind !== "active") {
      throw new Error("Only active members can update their profile.");
    }

    const location = await geocodeCity(args.cityName);

    await ctx.runMutation(internal.users.applyProfileUpdate, {
      userId: authUserId,
      displayName: args.displayName.trim(),
      bio: args.bio.trim(),
      role: viewer.user.role,
      status: "active",
      ...location,
    });

    return { ok: true };
  },
});

export const applyProfileUpdate = internalMutation({
  args: {
    userId: v.id("users"),
    displayName: v.string(),
    bio: v.string(),
    cityName: v.string(),
    countryCode: v.string(),
    cityLat: v.number(),
    cityLng: v.number(),
    role: v.union(v.literal("admin"), v.literal("member")),
    status: v.union(v.literal("invited"), v.literal("active")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      displayName: args.displayName,
      bio: args.bio,
      cityName: args.cityName,
      countryCode: args.countryCode,
      cityLat: args.cityLat,
      cityLng: args.cityLng,
      role: args.role,
      status: args.status,
    });
  },
});

export const currentUserInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});
