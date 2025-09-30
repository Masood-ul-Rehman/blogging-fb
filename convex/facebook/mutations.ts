import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getCurrentUser } from "../auth/helpers";

/**
 * Save or update Facebook connection for a user
 * Called after successful OAuth flow
 */
export const saveFacebookConnection = mutation({
  args: {
    fbUserId: v.string(),
    accessToken: v.string(),
    tokenType: v.string(),
    expiresAt: v.number(),
    scopes: v.array(v.string()),
    adAccounts: v.array(
      v.object({
        id: v.string(),
        accountId: v.string(),
        name: v.string(),
        currency: v.string(),
        timezone: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Check if connection already exists
    const existing = await ctx.db
      .query("facebook_connections")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", currentUser.userId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        fbUserId: args.fbUserId,
        accessToken: args.accessToken,
        tokenType: args.tokenType,
        expiresAt: args.expiresAt,
        scopes: args.scopes,
        adAccounts: args.adAccounts,
        lastSyncedAt: now,
        isActive: true,
      });
      return existing._id;
    } else {
      // Create new connection
      return await ctx.db.insert("facebook_connections", {
        clerkUserId: currentUser.userId,
        fbUserId: args.fbUserId,
        accessToken: args.accessToken,
        tokenType: args.tokenType,
        expiresAt: args.expiresAt,
        scopes: args.scopes,
        adAccounts: args.adAccounts,
        connectedAt: now,
        lastSyncedAt: now,
        isActive: true,
      });
    }
  },
});

/**
 * Disconnect Facebook connection
 * Marks the connection as inactive
 */
export const disconnectFacebook = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const connection = await ctx.db
      .query("facebook_connections")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", currentUser.userId)
      )
      .first();

    if (connection) {
      await ctx.db.patch(connection._id, {
        isActive: false,
      });
    }

    return { success: true };
  },
});

/**
 * Update ad accounts list for a connection
 * Called periodically to sync latest ad accounts
 */
export const updateAdAccounts = mutation({
  args: {
    adAccounts: v.array(
      v.object({
        id: v.string(),
        accountId: v.string(),
        name: v.string(),
        currency: v.string(),
        timezone: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const connection = await ctx.db
      .query("facebook_connections")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", currentUser.userId)
      )
      .first();

    if (!connection) {
      throw new Error("No Facebook connection found");
    }

    await ctx.db.patch(connection._id, {
      adAccounts: args.adAccounts,
      lastSyncedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Log an action performed on Facebook ads
 */
export const logFacebookAction = mutation({
  args: {
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    targetName: v.optional(v.string()),
    adAccountId: v.string(),
    result: v.string(),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        previousStatus: v.optional(v.string()),
        newStatus: v.optional(v.string()),
        previousBudget: v.optional(v.number()),
        newBudget: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await ctx.db.insert("facebook_action_logs", {
      actorClerkId: currentUser.userId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      targetName: args.targetName,
      adAccountId: args.adAccountId,
      result: args.result,
      errorMessage: args.errorMessage,
      metadata: args.metadata,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});
