import { query, internalQuery } from "../_generated/server";
import { getCurrentUserNullable } from "../auth/helpers";

/**
 * Internal query to get full connection with access token (server-side only)
 * Checks for token expiration and returns null if expired
 */
export const _getFacebookConnectionWithToken = internalQuery({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserNullable(ctx);

    if (!currentUser) {
      return null;
    }

    const connection = await ctx.db
      .query("facebook_connections")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", currentUser.userId)
      )
      .first();

    if (!connection) {
      return null;
    }

    // Check if token is expired
    const now = Date.now();
    if (connection.expiresAt <= now) {
      console.log(
        `Token expired for user ${currentUser.userId}. Expires at: ${new Date(
          connection.expiresAt
        ).toISOString()}, Now: ${new Date(now).toISOString()}`
      );
      return null; // Token expired, return null to trigger "No active connection" error
    }

    return connection;
  },
});

/**
 * Get Facebook connection for current user
 */
export const getFacebookConnection = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserNullable(ctx);

    if (!currentUser) {
      return null;
    }

    const connection = await ctx.db
      .query("facebook_connections")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", currentUser.userId)
      )
      .first();

    if (!connection) {
      return null;
    }

    // Don't send the access token to the client
    const { accessToken, ...safeConnection } = connection;

    return safeConnection;
  },
});

/**
 * Get ad accounts for current user
 */
export const getAdAccounts = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserNullable(ctx);

    if (!currentUser) {
      return [];
    }

    const connection = await ctx.db
      .query("facebook_connections")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", currentUser.userId)
      )
      .first();

    if (!connection || !connection.isActive) {
      return [];
    }

    return connection.adAccounts;
  },
});

/**
 * Get action logs for current user
 */
export const getActionLogs = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserNullable(ctx);

    if (!currentUser) {
      return [];
    }

    const logs = await ctx.db
      .query("facebook_action_logs")
      .withIndex("by_actorClerkId", (q) =>
        q.eq("actorClerkId", currentUser.userId)
      )
      .order("desc")
      .take(100); // Last 100 actions

    return logs;
  },
});

/**
 * Check if user has an active Facebook connection
 */
export const hasActiveConnection = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserNullable(ctx);

    if (!currentUser) {
      return false;
    }

    const connection = await ctx.db
      .query("facebook_connections")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", currentUser.userId)
      )
      .first();

    if (!connection || !connection.isActive) {
      return false;
    }

    // Check if token is expired
    const now = Date.now();
    if (connection.expiresAt <= now) {
      return false;
    }

    return true;
  },
});
