import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireActiveUser } from "./lib/auth";
import { createMentionNotifications, parseMentions, resolveMentionedActiveUserIds } from "./lib/mentions";

function buildCommentTree(comments: any[]) {
  const commentMap = new Map(
    comments.map((comment) => [
      comment._id,
      {
        ...comment,
        replies: [] as any[],
      },
    ]),
  );
  const roots: any[] = [];

  for (const comment of comments) {
    const node = commentMap.get(comment._id);

    if (!node) {
      continue;
    }

    if (comment.parentCommentId && commentMap.has(comment.parentCommentId)) {
      commentMap.get(comment.parentCommentId)?.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export const createPost = mutation({
  args: {
    categoryId: v.id("categories"),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const category = await ctx.db.get(args.categoryId);

    if (!category || !category.isActive) {
      throw new Error("Choose an active category before posting.");
    }

    const mentionedUserIds = await resolveMentionedActiveUserIds(
      ctx,
      parseMentions(`${args.title}\n${args.body}`),
    );

    const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      categoryId: args.categoryId,
      title: args.title.trim(),
      body: args.body.trim(),
      createdAt: Date.now(),
      mentionedUserIds,
      commentCount: 0,
    });

    await createMentionNotifications(ctx, {
      actorId: user._id,
      mentionedUserIds,
      postId,
      commentId: null,
    });

    return postId;
  },
});

export const getById = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    await requireActiveUser(ctx);

    const post = await ctx.db.get(args.postId);

    if (post === null) {
      return null;
    }

    const author = await ctx.db.get(post.authorId);
    const category = await ctx.db.get(post.categoryId);
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post_createdAt", (q) => q.eq("postId", args.postId))
      .collect();

    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const commentAuthor = await ctx.db.get(comment.authorId);

        return {
          ...comment,
          author: commentAuthor,
        };
      }),
    );

    return {
      ...post,
      author,
      category,
      comments: buildCommentTree(enrichedComments),
    };
  },
});
