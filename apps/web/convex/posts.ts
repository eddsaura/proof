import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const demoPosts = [
  {
    author: "Ava from Barcelona",
    body: "Just connected our first customer feed in under ten minutes.",
    channel: "Website conversion",
  },
  {
    author: "Luca at Beacon Studio",
    body: "Swapped the placeholder cards for live events and the page felt real instantly.",
    channel: "Product activity",
  },
  {
    author: "Noor on the growth team",
    body: "Bun + Next + Convex is a very nice starting stack for fast iteration.",
    channel: "Internal note",
  },
];

export const listLatest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .take(12);
  },
});

export const createPost = mutation({
  args: {
    author: v.string(),
    body: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const seedDemoPosts = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("posts").take(1);

    if (existing.length > 0) {
      return { inserted: 0 };
    }

    const now = Date.now();

    for (const [index, post] of demoPosts.entries()) {
      await ctx.db.insert("posts", {
        ...post,
        createdAt: now - index * 1000 * 60 * 9,
      });
    }

    return { inserted: demoPosts.length };
  },
});
