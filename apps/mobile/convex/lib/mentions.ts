import { normalizeUsername } from "./community";

const MENTION_REGEX = /(^|[^a-z0-9-])@([a-z0-9-]{1,39})/gi;

export function parseMentions(text: string) {
  const usernames = new Set<string>();

  for (const match of text.matchAll(MENTION_REGEX)) {
    const username = match[2];

    if (username) {
      usernames.add(normalizeUsername(username));
    }
  }

  return [...usernames];
}

export async function resolveMentionedActiveUserIds(ctx: any, usernames: string[]) {
  const userIds: any[] = [];

  for (const username of usernames) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .unique();

    if (user && user.status === "active") {
      userIds.push(user._id);
    }
  }

  return [...new Set(userIds)];
}

export async function createMentionNotifications(
  ctx: any,
  {
    actorId,
    mentionedUserIds,
    postId,
    commentId,
  }: {
    actorId: string;
    mentionedUserIds: string[];
    postId: string | null;
    commentId: string | null;
  },
) {
  for (const userId of mentionedUserIds) {
    if (userId === actorId) {
      continue;
    }

    await ctx.db.insert("notifications", {
      userId,
      type: "mention",
      actorId,
      postId,
      commentId,
      createdAt: Date.now(),
    });
  }
}
