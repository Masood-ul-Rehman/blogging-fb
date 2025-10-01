import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { internal } from "../_generated/api";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FB_API_VERSION = process.env.FACEBOOK_API_VERSION || "v23.0";

interface TokenExchangeResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Exchange a long-lived token for a new long-lived token
 * This extends the token validity for another 60 days
 */
async function exchangeForNewLongLivedToken(
  currentToken: string
): Promise<TokenExchangeResponse> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    fb_exchange_token: currentToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?${params.toString()}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Token refresh failed: ${error.error?.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Verify if a token is still valid by making a test API call
 */
async function verifyToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/me?access_token=${accessToken}`,
      { method: "GET" }
    );
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// INTERNAL QUERIES
// ============================================================================

/**
 * Get all connections with tokens expiring within 30 days
 */
export const getExpiringConnections = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    const allConnections = await ctx.db
      .query("facebook_connections")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter connections with tokens expiring within 30 days
    // Skip connections with invalid (NaN) expiration dates
    return allConnections.filter(
      (conn) =>
        !isNaN(conn.expiresAt) &&
        conn.expiresAt <= thirtyDaysFromNow &&
        conn.expiresAt > now
    );
  },
});

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

/**
 * Fix connections with invalid (NaN) expiration dates
 * This is a one-time migration to fix existing bad data
 */
export const fixInvalidExpirationDates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allConnections = await ctx.db.query("facebook_connections").collect();

    let fixedCount = 0;
    let inactiveCount = 0;

    for (const connection of allConnections) {
      if (isNaN(connection.expiresAt)) {
        // Mark as inactive - user needs to reconnect
        await ctx.db.patch(connection._id, {
          isActive: false,
        });
        inactiveCount++;
        console.log(
          `Marked connection ${connection._id} as inactive due to invalid expiration date`
        );
      }
    }

    return {
      total: allConnections.length,
      fixed: fixedCount,
      markedInactive: inactiveCount,
    };
  },
});

/**
 * Internal mutation to update a connection with a new token
 */
export const updateConnectionToken = internalMutation({
  args: {},
  handler: async (
    ctx,
    args: {
      connectionId: string;
      newAccessToken: string;
      newExpiresAt: number;
    }
  ) => {
    await ctx.db.patch(args.connectionId as any, {
      accessToken: args.newAccessToken,
      expiresAt: args.newExpiresAt,
      lastSyncedAt: Date.now(),
    });
  },
});

/**
 * Mark a connection as inactive
 */
export const markConnectionInactive = internalMutation({
  args: {},
  handler: async (ctx, args: { connectionId: string }) => {
    await ctx.db.patch(args.connectionId as any, {
      isActive: false,
    });
  },
});

// ============================================================================
// INTERNAL ACTIONS
// ============================================================================

/**
 * Refresh a single Facebook token
 */
export const refreshSingleToken = internalAction({
  args: {},
  handler: async (
    ctx,
    args: {
      connectionId: string;
      currentToken: string;
      clerkUserId: string;
    }
  ) => {
    try {
      console.log(`🔄 Refreshing token for user: ${args.clerkUserId}`);

      // Exchange current token for new long-lived token
      const tokenResponse = await exchangeForNewLongLivedToken(
        args.currentToken
      );

      // Calculate new expiration time (60 days from now)
      const newExpiresAt = Date.now() + tokenResponse.expires_in * 1000;

      // Verify the new token works
      const isValid = await verifyToken(tokenResponse.access_token);
      if (!isValid) {
        throw new Error("New token verification failed");
      }

      // Update the connection with the new token
      await ctx.runMutation(internal.facebook.internal.updateConnectionToken, {
        connectionId: args.connectionId,
        newAccessToken: tokenResponse.access_token,
        newExpiresAt: newExpiresAt,
      });

      console.log(
        `✅ Token refreshed successfully for user: ${
          args.clerkUserId
        }. New expiry: ${new Date(newExpiresAt).toISOString()}`
      );

      return { success: true, newExpiresAt };
    } catch (error: any) {
      console.error(
        `❌ Failed to refresh token for user ${args.clerkUserId}:`,
        error.message
      );

      // Mark connection as inactive if token refresh fails
      await ctx.runMutation(internal.facebook.internal.markConnectionInactive, {
        connectionId: args.connectionId,
      });

      return { success: false, error: error.message };
    }
  },
});

/**
 * Main cron job: Find and refresh tokens expiring within 7 days
 */
export const refreshExpiringTokens = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("🕐 Starting Facebook token refresh cron job...");

    // Get all active connections
    const connections = await ctx.runQuery(
      internal.facebook.internal.getExpiringConnections
    );

    console.log(
      `📊 Found ${connections.length} connections to check for token refresh`
    );

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;

    for (const connection of connections) {
      const now = Date.now();

      // Skip connections with invalid (NaN) expiration dates
      if (isNaN(connection.expiresAt)) {
        invalidCount++;
        console.error(
          `❌ Invalid expiration date (NaN) for user ${connection.clerkUserId}. Connection needs to be re-established.`
        );
        // Mark as inactive so user knows they need to reconnect
        await ctx.runMutation(
          internal.facebook.internal.markConnectionInactive,
          {
            connectionId: connection._id,
          }
        );
        continue;
      }

      const daysUntilExpiry = Math.floor(
        (connection.expiresAt - now) / (24 * 60 * 60 * 1000)
      );

      // Skip if token expires in more than 7 days
      if (daysUntilExpiry > 7) {
        skippedCount++;
        console.log(
          `⏭️  Skipping user ${connection.clerkUserId} - token expires in ${daysUntilExpiry} days`
        );
        continue;
      }

      console.log(
        `⏰ Token expiring soon for user ${connection.clerkUserId} (${daysUntilExpiry} days remaining)`
      );

      const result = await ctx.runAction(
        internal.facebook.internal.refreshSingleToken,
        {
          connectionId: connection._id,
          currentToken: connection.accessToken,
          clerkUserId: connection.clerkUserId,
        }
      );

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Add a small delay between refreshes to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const summary = {
      total: connections.length,
      refreshed: successCount,
      failed: failureCount,
      skipped: skippedCount,
      invalid: invalidCount,
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Token refresh cron job completed:", summary);

    if (invalidCount > 0) {
      console.warn(
        `⚠️  Found ${invalidCount} connection(s) with invalid expiration dates. These have been marked inactive and users need to reconnect.`
      );
    }

    return summary;
  },
});
