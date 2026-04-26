import { v } from "convex/values";

import { query } from "./_generated/server";
import { requireActiveUser } from "./lib/auth";

export const listMembers = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, args) => {
    await requireActiveUser(ctx);

    const normalizedSearch = args.search.trim().toLowerCase();
    const users = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return users
      .filter((user) => user.cityLat !== undefined && user.cityLng !== undefined)
      .filter((user) => {
        if (!normalizedSearch) {
          return true;
        }

        return [user.displayName, user.username, user.cityName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => {
        const leftKey = `${left.cityName ?? ""}-${left.displayName}`;
        const rightKey = `${right.cityName ?? ""}-${right.displayName}`;
        return leftKey.localeCompare(rightKey);
      });
  },
});
