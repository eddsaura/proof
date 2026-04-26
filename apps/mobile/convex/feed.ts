import { v } from "convex/values";

import { query } from "./_generated/server";
import { requireActiveUser } from "./lib/auth";

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    await requireActiveUser(ctx);

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_sortOrder")
      .collect();

    return categories.filter((category) => category.isActive);
  },
});

export const listHome = query({
  args: {
    categoryId: v.union(v.id("categories"), v.null()),
  },
  handler: async (ctx, args) => {
    await requireActiveUser(ctx);
    const categoryId = args.categoryId;

    if (categoryId === null) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_createdAt")
        .order("desc")
        .take(50);

      return await Promise.all(
        posts.map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          const category = await ctx.db.get(post.categoryId);

          return {
            ...post,
            author,
            category,
          };
        }),
      );
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_category_createdAt", (q) => q.eq("categoryId", categoryId))
      .order("desc")
      .take(50);

    return await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const category = await ctx.db.get(post.categoryId);

        return {
          ...post,
          author,
          category,
        };
      }),
    );
  },
});
