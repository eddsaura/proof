export const DEFAULT_CATEGORIES = [
  {
    slug: "learnings",
    name: "Learnings",
    description: "What we are learning while building, shipping, and reflecting.",
    sortOrder: 0,
  },
  {
    slug: "async-rhythm",
    name: "Async Rhythm",
    description: "Threaded updates that help everyone stay in sync across time zones.",
    sortOrder: 1,
  },
  {
    slug: "asks",
    name: "Asks",
    description: "Questions, feedback requests, and unblockers from the community.",
    sortOrder: 2,
  },
  {
    slug: "city-notes",
    name: "City Notes",
    description: "Local context, meetup pings, and who is around in a given city.",
    sortOrder: 3,
  },
] as const;

export function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function slugifyCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function findActiveInviteByUsername(ctx: any, githubUsername: string) {
  const normalized = normalizeUsername(githubUsername);
  const invites = await ctx.db
    .query("invites")
    .withIndex("by_githubUsername", (q: any) => q.eq("githubUsername", normalized))
    .collect();

  return invites.find((invite: any) => invite.revokedAt === undefined) ?? null;
}

export async function ensureDefaultCategories(ctx: any) {
  const existing = await ctx.db.query("categories").take(1);

  if (existing.length > 0) {
    return;
  }

  for (const category of DEFAULT_CATEGORIES) {
    await ctx.db.insert("categories", {
      ...category,
      isActive: true,
    });
  }
}
