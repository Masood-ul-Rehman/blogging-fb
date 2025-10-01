import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getCurrentUser } from "../auth/helpers";
import { ConvexError } from "convex/values";

/**
 * Save or update Facebook connection for a user (server-side OAuth callback)
 * This version accepts userId as a parameter for use in OAuth callbacks
 */
export const saveFacebookConnectionOAuth = mutation({
  args: {
    clerkUserId: v.string(),
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
        timezone: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.clerkUserId))
      .first();

    if (!user) {
      throw new ConvexError(`User not found: ${args.clerkUserId}`);
    }

    // Check if connection already exists
    const existing = await ctx.db
      .query("facebook_connections")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
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
        clerkUserId: args.clerkUserId,
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
 * Save or update Facebook connection for a user (client-side)
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
        timezone: v.optional(v.string()),
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
        timezone: v.optional(v.string()),
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

/**
 * Save a created ad to the database for tracking
 */
export const saveCreatedAd = mutation({
  args: {
    adAccountId: v.string(),
    campaignId: v.string(),
    campaignName: v.string(),
    adSetId: v.string(),
    adSetName: v.string(),
    creativeId: v.string(),
    adId: v.string(),
    adName: v.string(),
    status: v.string(),
    objective: v.string(),
    dailyBudget: v.optional(v.number()),
    lifetimeBudget: v.optional(v.number()),
    targeting: v.optional(
      v.object({
        ageMin: v.optional(v.number()),
        ageMax: v.optional(v.number()),
        genders: v.optional(v.array(v.number())),
        countries: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await ctx.db.insert("created_ads", {
      clerkUserId: currentUser.userId,
      adAccountId: args.adAccountId,
      campaignId: args.campaignId,
      campaignName: args.campaignName,
      adSetId: args.adSetId,
      adSetName: args.adSetName,
      creativeId: args.creativeId,
      adId: args.adId,
      adName: args.adName,
      status: args.status,
      objective: args.objective,
      dailyBudget: args.dailyBudget,
      lifetimeBudget: args.lifetimeBudget,
      targeting: args.targeting,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
