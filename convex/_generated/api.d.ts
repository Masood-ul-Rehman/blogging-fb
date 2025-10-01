/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin_setup from "../admin/setup.js";
import type * as auth_helpers from "../auth/helpers.js";
import type * as content_mutations from "../content/mutations.js";
import type * as content_queries from "../content/queries.js";
import type * as facebook_actions from "../facebook/actions.js";
import type * as facebook_mutations from "../facebook/mutations.js";
import type * as facebook_queries from "../facebook/queries.js";
import type * as sync from "../sync.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "admin/setup": typeof admin_setup;
  "auth/helpers": typeof auth_helpers;
  "content/mutations": typeof content_mutations;
  "content/queries": typeof content_queries;
  "facebook/actions": typeof facebook_actions;
  "facebook/mutations": typeof facebook_mutations;
  "facebook/queries": typeof facebook_queries;
  sync: typeof sync;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
