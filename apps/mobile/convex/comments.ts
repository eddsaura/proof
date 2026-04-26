import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { requireActiveUser } from "./lib/auth";
import { createMentionNotifications, parseMentions, resolveMentionedActiveUserIds } from "./lib/mentions";

export const createComment = mutation({
  args: {
    postId: v.id("posts"),
    parentCommentId: v.union(v.id("comments"), v.null()),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const post = await ctx.db.get(args.postId);

    if (post === null) {
      throw new Error("That post could not be found.");
    }

    if (args.parentCommentId !== null) {
      const parent = await ctx.db.get(args.parentCommentId);

      if (parent === null || parent.postId !== args.postId) {
        throw new Error("Replies must belong to the same post.");
      }
    }

    const mentionedUserIds = await resolveMentionedActiveUserIds(
      ctx,
      parseMentions(args.body),
    );

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      parentCommentId: args.parentCommentId,
      body: args.body.trim(),
      createdAt: Date.now(),
      mentionedUserIds,
    });

    await ctx.db.patch(args.postId, {
      commentCount: post.commentCount + 1,
    });

    await createMentionNotifications(ctx, {
      actorId: user._id,
      mentionedUserIds,
      postId: args.postId,
      commentId,
    });

    return commentId;
  },
});
