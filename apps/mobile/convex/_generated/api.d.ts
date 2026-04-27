/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as feed from "../feed.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_community from "../lib/community.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_mentions from "../lib/mentions.js";
import type * as map from "../map.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  comments: typeof comments;
  feed: typeof feed;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/community": typeof lib_community;
  "lib/dates": typeof lib_dates;
  "lib/mentions": typeof lib_mentions;
  map: typeof map;
  notifications: typeof notifications;
  posts: typeof posts;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
