import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireActiveUser } from "./lib/auth";

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", user._id))
      .collect();

    return notifications.filter((notification) => notification.readAt === undefined).length;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);

    return await Promise.all(
      notifications.map(async (notification) => {
        const actor = await ctx.db.get(notification.actorId);
        const post = notification.postId ? await ctx.db.get(notification.postId) : null;
        const comment = notification.commentId ? await ctx.db.get(notification.commentId) : null;

        return {
          ...notification,
          actor,
          post,
          comment,
        };
      }),
    );
  },
});

export const markRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (notification === null || notification.userId !== user._id) {
      throw new Error("That notification does not belong to you.");
    }

    await ctx.db.patch(args.notificationId, {
      readAt: Date.now(),
    });
  },
});
