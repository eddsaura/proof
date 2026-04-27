import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  ensureDefaultBatches,
  ensureDefaultCategories,
  findActiveInviteByUsername,
  normalizeUsername,
  slugify,
  slugifyCategory,
} from "./lib/community";
import { requireAdmin } from "./lib/auth";

async function ensureUniqueCategorySlug(ctx: any, slug: string, categoryId?: string) {
  const existing = await ctx.db
    .query("categories")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .unique();

  if (existing && existing._id !== categoryId) {
    throw new Error("That category name already exists.");
  }
}

async function ensureUniqueBatchSlug(ctx: any, slug: string, batchId?: string) {
  const existing = await ctx.db
    .query("batches")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .unique();

  if (existing && existing._id !== batchId) {
    throw new Error("That batch already exists.");
  }
}

async function assertValidBatchIds(ctx: any, batchIds: Id<"batches">[]) {
  const uniqueIds = [...new Set(batchIds)];

  for (const batchId of uniqueIds) {
    const batch = await ctx.db.get(batchId);

    if (batch === null) {
      throw new Error("One of the selected batches no longer exists.");
    }
  }

  return uniqueIds;
}

function normalizeBadgeTypes(badgeTypes: ("core")[] | undefined) {
  return [...new Set(badgeTypes ?? [])];
}

async function resolveBatches(ctx: any, batchIds: string[] | undefined) {
  const batches = await Promise.all((batchIds ?? []).map((batchId) => ctx.db.get(batchId)));

  return batches
    .filter(Boolean)
    .sort((left: any, right: any) => left.sortOrder - right.sortOrder);
}

export const bootstrapStatus = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(1);
    const invites = await ctx.db.query("invites").take(1);

    return {
      needsBootstrap: users.length === 0 && invites.length === 0,
    };
  },
});

export const bootstrapCommunity = mutation({
  args: {
    githubUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").take(1);
    const invites = await ctx.db.query("invites").take(1);

    if (users.length > 0 || invites.length > 0) {
      throw new Error("The community has already been bootstrapped.");
    }

    await ctx.db.insert("invites", {
      githubUsername: normalizeUsername(args.githubUsername),
      role: "admin",
      createdAt: Date.now(),
    });

    await ensureDefaultCategories(ctx);
    await ensureDefaultBatches(ctx);

    return { ok: true };
  },
});

export const ensureDefaultBatchesForAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    await ensureDefaultBatches(ctx);
    return { ok: true };
  },
});

export const listInvites = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const invites = await ctx.db.query("invites").order("desc").collect();

    return await Promise.all(
      invites.map(async (invite) => ({
        ...invite,
        batches: await resolveBatches(ctx, invite.batchIds),
      })),
    );
  },
});

export const listMembersForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db
      .query("users")
      .withIndex("by_status_username", (q) => q.eq("status", "active"))
      .collect();

    return await Promise.all(
      users.map(async (user) => ({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        cityName: user.cityName,
        role: user.role,
        batchIds: user.batchIds ?? [],
        badgeTypes: user.badgeTypes ?? [],
        batches: await resolveBatches(ctx, user.batchIds),
      })),
    );
  },
});

export const createInvite = mutation({
  args: {
    githubUsername: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    batchIds: v.optional(v.array(v.id("batches"))),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const githubUsername = normalizeUsername(args.githubUsername);
    const existingInvite = await findActiveInviteByUsername(ctx, githubUsername);
    const batchIds = await assertValidBatchIds(ctx, args.batchIds ?? []);

    if (existingInvite) {
      await ctx.db.patch(existingInvite._id, {
        role: args.role,
        batchIds,
        revokedAt: undefined,
      });
    } else {
      await ctx.db.insert("invites", {
        githubUsername,
        role: args.role,
        batchIds,
        invitedBy: admin._id,
        createdAt: Date.now(),
      });
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", githubUsername))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        role: args.role,
        batchIds,
      });
    }
  },
});

export const revokeInvite = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.inviteId, {
      revokedAt: Date.now(),
    });
  },
});

export const updateMemberBatches = mutation({
  args: {
    userId: v.id("users"),
    batchIds: v.array(v.id("batches")),
    badgeTypes: v.optional(v.array(v.literal("core"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);

    if (user === null) {
      throw new Error("That member no longer exists.");
    }

    const batchIds = await assertValidBatchIds(ctx, args.batchIds);
    const badgeTypes = normalizeBadgeTypes(args.badgeTypes);

    await ctx.db.patch(args.userId, {
      batchIds,
      badgeTypes,
    });
  },
});

export const listCategoriesForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("categories").withIndex("by_sortOrder").collect();
  },
});

export const listBatchesForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("batches").withIndex("by_sortOrder").collect();
  },
});

export const createBatch = mutation({
  args: {
    label: v.string(),
    houseName: v.string(),
    cityName: v.string(),
    startsOn: v.optional(v.string()),
    endsOn: v.optional(v.string()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const label = args.label.trim();
    const slug = slugify(label);
    await ensureUniqueBatchSlug(ctx, slug);

    await ctx.db.insert("batches", {
      slug,
      label,
      houseName: args.houseName.trim(),
      cityName: args.cityName.trim(),
      startsOn: args.startsOn?.trim() || undefined,
      endsOn: args.endsOn?.trim() || undefined,
      sortOrder: args.sortOrder,
      isActive: true,
    });
  },
});

export const updateBatch = mutation({
  args: {
    batchId: v.id("batches"),
    label: v.string(),
    houseName: v.string(),
    cityName: v.string(),
    startsOn: v.optional(v.string()),
    endsOn: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const label = args.label.trim();
    const slug = slugify(label);
    await ensureUniqueBatchSlug(ctx, slug, args.batchId);

    await ctx.db.patch(args.batchId, {
      slug,
      label,
      houseName: args.houseName.trim(),
      cityName: args.cityName.trim(),
      startsOn: args.startsOn?.trim() || undefined,
      endsOn: args.endsOn?.trim() || undefined,
      sortOrder: args.sortOrder,
      isActive: args.isActive,
    });
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const slug = slugifyCategory(args.name);
    await ensureUniqueCategorySlug(ctx, slug);

    await ctx.db.insert("categories", {
      slug,
      name: args.name.trim(),
      description: args.description.trim(),
      sortOrder: args.sortOrder,
      isActive: true,
    });
  },
});

export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const slug = slugifyCategory(args.name);
    await ensureUniqueCategorySlug(ctx, slug, args.categoryId);

    await ctx.db.patch(args.categoryId, {
      slug,
      name: args.name.trim(),
      description: args.description.trim(),
      sortOrder: args.sortOrder,
      isActive: args.isActive,
    });
  },
});
