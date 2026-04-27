import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    authUserId: v.string(),
    username: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    batchIds: v.optional(v.array(v.id("batches"))),
    badgeTypes: v.optional(v.array(v.literal("core"))),
    cityName: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    cityLat: v.optional(v.number()),
    cityLng: v.optional(v.number()),
    role: v.union(v.literal("super-admin"), v.literal("admin"), v.literal("member")),
    status: v.union(v.literal("invited"), v.literal("active"), v.literal("declined")),
    createdAt: v.number(),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_username", ["username"])
    .index("by_authUserId", ["authUserId"])
    .index("by_status", ["status"])
    .index("by_status_username", ["status", "username"]),
  invites: defineTable({
    githubUsername: v.string(),
    role: v.union(v.literal("super-admin"), v.literal("admin"), v.literal("member")),
    batchIds: v.optional(v.array(v.id("batches"))),
    invitedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  }).index("by_githubUsername", ["githubUsername"]),
  batches: defineTable({
    slug: v.string(),
    label: v.string(),
    houseName: v.string(),
    cityName: v.string(),
    startsOn: v.optional(v.string()),
    endsOn: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_sortOrder", ["sortOrder"]),
  categories: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_sortOrder", ["sortOrder"]),
  posts: defineTable({
    authorId: v.id("users"),
    categoryId: v.id("categories"),
    title: v.string(),
    body: v.string(),
    createdAt: v.number(),
    mentionedUserIds: v.array(v.id("users")),
    commentCount: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_category_createdAt", ["categoryId", "createdAt"])
    .index("by_author_createdAt", ["authorId", "createdAt"]),
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    parentCommentId: v.union(v.id("comments"), v.null()),
    body: v.string(),
    createdAt: v.number(),
    mentionedUserIds: v.array(v.id("users")),
  })
    .index("by_post_createdAt", ["postId", "createdAt"])
    .index("by_parent_createdAt", ["parentCommentId", "createdAt"]),
  notifications: defineTable({
    userId: v.id("users"),
    type: v.literal("mention"),
    actorId: v.id("users"),
    postId: v.union(v.id("posts"), v.null()),
    commentId: v.union(v.id("comments"), v.null()),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  }).index("by_user_createdAt", ["userId", "createdAt"]),
});
