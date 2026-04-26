import { getAuthUserId } from "@convex-dev/auth/server";

import { findActiveInviteByUsername } from "./community";

export async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx);

  if (userId === null) {
    return null;
  }

  return await ctx.db.get(userId);
}

export async function requireCurrentUser(ctx: any) {
  const user = await getCurrentUser(ctx);

  if (user === null) {
    throw new Error("You must be signed in to continue.");
  }

  return user;
}

export async function requireActiveUser(ctx: any) {
  const user = await requireCurrentUser(ctx);

  if (user.status !== "active") {
    throw new Error("Complete your access flow before using the app.");
  }

  return user;
}

export async function requireAdmin(ctx: any) {
  const user = await requireActiveUser(ctx);

  if (user.role !== "admin") {
    throw new Error("Admin access is required for this action.");
  }

  return user;
}

export async function resolveInviteState(ctx: any, user: any) {
  if (user.status === "active") {
    return { kind: "active" as const, invite: null };
  }

  const invite = await findActiveInviteByUsername(ctx, user.username);

  if (invite === null) {
    return { kind: "pending" as const, invite: null };
  }

  return { kind: "onboarding" as const, invite };
}
