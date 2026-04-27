import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { api, internal } from "./_generated/api";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { getCurrentUser, requireActiveUser, resolveInviteState } from "./lib/auth";

const locationValidator = v.object({
  cityName: v.string(),
  countryCode: v.string(),
  cityLat: v.number(),
  cityLng: v.number(),
  region: v.optional(v.union(v.string(), v.null())),
  country: v.optional(v.union(v.string(), v.null())),
  label: v.optional(v.string()),
});

async function geocodeCity(cityName: string) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`,
  );

  if (!response.ok) {
    throw new Error("Could not geocode that city right now.");
  }

  const payload = (await response.json()) as {
    results?: {
      latitude: number;
      longitude: number;
      country_code?: string;
      name?: string;
      admin1?: string;
      country?: string;
    }[];
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

function formatCityLabel(location: {
  name?: string;
  admin1?: string;
  country?: string;
  country_code?: string;
}) {
  const place = [location.name, location.admin1].filter(Boolean).join(", ");
  const country = location.country_code ?? location.country;
  return [place, country].filter(Boolean).join(", ");
}

function normalizeLocation(location: {
  cityName: string;
  countryCode: string;
  cityLat: number;
  cityLng: number;
}) {
  return {
    cityName: location.cityName.trim(),
    countryCode: location.countryCode.trim(),
    cityLat: location.cityLat,
    cityLng: location.cityLng,
  };
}

function normalizePhone(phone: string | undefined) {
  const trimmed = phone?.trim() ?? "";
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 0) {
    return undefined;
  }

  if (digits.length < 8) {
    throw new Error("Use a WhatsApp number with country code.");
  }

  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

async function resolveBatches(ctx: any, batchIds: string[] | undefined) {
  const batches = await Promise.all((batchIds ?? []).map((batchId) => ctx.db.get(batchId)));

  return batches
    .filter(Boolean)
    .sort((left: any, right: any) => left.sortOrder - right.sortOrder);
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

    if (inviteState.kind === "declined") {
      return {
        kind: "declined" as const,
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
      badgeTypes: user.badgeTypes ?? [],
      batches: await resolveBatches(ctx, user.batchIds),
      recentPosts: postSummaries,
    };
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);

    return {
      user,
      badgeTypes: user.badgeTypes ?? [],
      batches: await resolveBatches(ctx, user.batchIds),
    };
  },
});

export const listActiveBatches = query({
  args: {},
  handler: async (ctx) => {
    await requireActiveUser(ctx);

    const batches = await ctx.db.query("batches").withIndex("by_sortOrder").collect();

    return batches.filter((batch) => batch.isActive);
  },
});

export const searchMentionCandidates = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    await requireActiveUser(ctx);

    const search = args.query.trim().toLowerCase().replace(/^@/, "").slice(0, 39);
    const users = await ctx.db
      .query("users")
      .withIndex("by_status_username", (q) => {
        const activeUsers = q.eq("status", "active");

        if (search.length === 0) {
          return activeUsers;
        }

        return activeUsers.gte("username", search).lt("username", `${search}\uffff`);
      })
      .take(8);

    return users.map((user) => ({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      cityName: user.cityName ?? null,
    }));
  },
});

export const searchCities = action({
  args: {
    query: v.string(),
  },
  handler: async (_ctx, args) => {
    const search = args.query.trim();

    if (search.length < 2) {
      return [];
    }

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=6&language=en&format=json`,
    );

    if (!response.ok) {
      throw new Error("Could not search cities right now.");
    }

    const payload = (await response.json()) as {
      results?: {
        id?: number;
        latitude: number;
        longitude: number;
        country_code?: string;
        name?: string;
        admin1?: string;
        country?: string;
      }[];
    };

    const seen = new Set<string>();

    return (payload.results ?? [])
      .map((result) => ({
        id: String(result.id ?? `${result.name}-${result.country_code}-${result.latitude}`),
        cityName: result.name ?? search,
        countryCode: result.country_code ?? result.country ?? "",
        cityLat: result.latitude,
        cityLng: result.longitude,
        region: result.admin1 ?? null,
        country: result.country ?? null,
        label: formatCityLabel(result),
      }))
      .filter((location) => {
        const key = `${location.cityName}-${location.countryCode}-${location.region}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
  },
});

export const completeProfile = action({
  args: {
    displayName: v.string(),
    bio: v.string(),
    phone: v.optional(v.string()),
    cityName: v.optional(v.string()),
    location: v.optional(locationValidator),
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

    const location = args.location
      ? normalizeLocation(args.location)
      : await geocodeCity(args.cityName ?? "");

    await ctx.runMutation(internal.users.applyProfileUpdate, {
      userId: authUserId,
      displayName: args.displayName.trim(),
      bio: args.bio.trim(),
      phone: normalizePhone(args.phone),
      batchIds: viewer.invite.batchIds,
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
    phone: v.optional(v.string()),
    cityName: v.optional(v.string()),
    location: v.optional(locationValidator),
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

    const location = args.location
      ? normalizeLocation(args.location)
      : await geocodeCity(args.cityName ?? "");

    await ctx.runMutation(internal.users.applyProfileUpdate, {
      userId: authUserId,
      displayName: args.displayName.trim(),
      bio: args.bio.trim(),
      phone: normalizePhone(args.phone),
      batchIds: viewer.user.batchIds,
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
    phone: v.optional(v.string()),
    batchIds: v.optional(v.array(v.id("batches"))),
    cityName: v.string(),
    countryCode: v.string(),
    cityLat: v.number(),
    cityLng: v.number(),
    role: v.union(v.literal("super-admin"), v.literal("admin"), v.literal("member")),
    status: v.union(v.literal("invited"), v.literal("active"), v.literal("declined")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      displayName: args.displayName,
      bio: args.bio,
      phone: args.phone,
      batchIds: args.batchIds,
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
