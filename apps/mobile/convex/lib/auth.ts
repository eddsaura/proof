import { getAuthUserId } from "@convex-dev/auth/server";

import { findActiveInviteByUsername, normalizeUsername } from "./community";

export type UserRole = "super-admin" | "admin" | "member";

export function isAdminRole(role: string | undefined) {
  return role === "super-admin" || role === "admin";
}

export function resolveManagedRole(username: string, role: UserRole) {
  const normalizedUsername = normalizeUsername(username);

  if (normalizedUsername === "saura") {
    return "super-admin";
  }

  if (role === "super-admin") {
    throw new Error("Only saura can be super-admin.");
  }

  return role;
}

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
  const isSaura = normalizeUsername(user.username) === "saura";
  const effectiveUser =
    isSaura && user.role !== "super-admin"
      ? { ...user, role: "super-admin" as const }
      : user;

  if (isSaura && user.role !== "super-admin") {
    await ctx.db.patch(user._id, {
      role: "super-admin",
    });
  }

  if (!isAdminRole(effectiveUser.role)) {
    throw new Error("Admin access is required for this action.");
  }

  return effectiveUser;
}

export async function getOptionalAdmin(ctx: any) {
  const user = await getCurrentUser(ctx);

  if (user === null || user.status !== "active") {
    return null;
  }

  const isSaura = normalizeUsername(user.username) === "saura";
  const effectiveUser =
    isSaura && user.role !== "super-admin"
      ? { ...user, role: "super-admin" as const }
      : user;

  if (!isAdminRole(effectiveUser.role)) {
    return null;
  }

  return effectiveUser;
}

export async function resolveInviteState(ctx: any, user: any) {
  if (user.status === "active") {
    return { kind: "active" as const, invite: null };
  }

  if (user.status === "declined") {
    return { kind: "declined" as const, invite: null };
  }

  const invite = await findActiveInviteByUsername(ctx, user.username);

  if (invite === null) {
    return { kind: "pending" as const, invite: null };
  }

  return { kind: "onboarding" as const, invite };
}
