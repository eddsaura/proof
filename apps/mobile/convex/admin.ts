import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { ensureDefaultCategories, findActiveInviteByUsername, normalizeUsername, slugifyCategory } from "./lib/community";
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

    return { ok: true };
  },
});

export const listInvites = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    return await ctx.db.query("invites").order("desc").collect();
  },
});

export const createInvite = mutation({
  args: {
    githubUsername: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const githubUsername = normalizeUsername(args.githubUsername);
    const existingInvite = await findActiveInviteByUsername(ctx, githubUsername);

    if (existingInvite) {
      await ctx.db.patch(existingInvite._id, {
        role: args.role,
        revokedAt: undefined,
      });
    } else {
      await ctx.db.insert("invites", {
        githubUsername,
        role: args.role,
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

export const listCategoriesForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("categories").withIndex("by_sortOrder").collect();
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
