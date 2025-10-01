import { v } from "convex/values";
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";

const FB_API_VERSION = process.env.FACEBOOK_API_VERSION || "v23.0";
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

/**
 * Helper to make Facebook Graph API requests with retry logic
 */
async function callFacebookAPI(
  endpoint: string,
  accessToken: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, any>
): Promise<any> {
  const url = `${FB_GRAPH_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  if (body && method === "POST") {
    options.body = JSON.stringify(body);
  }

  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        // Handle Facebook API errors
        if (data.error) {
          const error = data.error;

          // Token expired or invalid
          if (error.code === 190 || error.type === "OAuthException") {
            throw new Error("EXPIRED_TOKEN");
          }

          throw new Error(
            `Facebook API Error: ${error.message} (code: ${error.code})`
          );
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on token errors
      if (lastError.message === "EXPIRED_TOKEN") {
        throw lastError;
      }

      // Wait before retry (exponential backoff)
      if (attempt < 2) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new Error("Failed to call Facebook API");
}

/**
 * Fetch ad accounts from Facebook
 * Called server-side to get latest ad accounts
 */
export const fetchAdAccounts = action({
  args: {},
  handler: async (ctx) => {
    // Get the full connection with access token (server-side only)
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    try {
      // Call Facebook API to get ad accounts
      const data = await callFacebookAPI(
        `/me/adaccounts?fields=id,account_id,name,currency,timezone,account_status`,
        connection.accessToken
      );

      const adAccounts = data.data.map((account: any) => ({
        id: account.id,
        accountId: account.account_id,
        name: account.name,
        currency: account.currency,
        timezone: account.timezone,
      }));

      // Update the connection with latest ad accounts
      await ctx.runMutation(api.facebook.mutations.updateAdAccounts, {
        adAccounts,
      });

      return adAccounts;
    } catch (error: any) {
      if (error.message === "EXPIRED_TOKEN") {
        // Mark connection as inactive
        await ctx.runMutation(api.facebook.mutations.disconnectFacebook, {});
        throw new Error("EXPIRED_TOKEN");
      }
      throw error;
    }
  },
});

/**
 * Fetch insights for an ad account
 */
export const fetchAdAccountInsights = action({
  args: {
    adAccountId: v.string(),
    datePreset: v.optional(v.string()), // e.g., "last_7d", "last_30d"
    startDate: v.optional(v.string()), // YYYY-MM-DD
    endDate: v.optional(v.string()), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    // Build query parameters
    const params = new URLSearchParams({
      fields: "impressions,clicks,spend,ctr,cpc,cpp,cpm",
      level: "account",
    });

    if (args.datePreset) {
      params.append("date_preset", args.datePreset);
    } else if (args.startDate && args.endDate) {
      params.append(
        "time_range",
        JSON.stringify({
          since: args.startDate,
          until: args.endDate,
        })
      );
    } else {
      params.append("date_preset", "last_7d");
    }

    try {
      const data = await callFacebookAPI(
        `/${args.adAccountId}/insights?${params.toString()}`,
        connection.accessToken
      );

      return data.data || [];
    } catch (error: any) {
      if (error.message === "EXPIRED_TOKEN") {
        await ctx.runMutation(api.facebook.mutations.disconnectFacebook, {});
        throw new Error("EXPIRED_TOKEN");
      }
      throw error;
    }
  },
});

/**
 * Fetch campaigns for an ad account
 */
export const fetchCampaigns = action({
  args: {
    adAccountId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    const limit = args.limit || 25;

    try {
      const data = await callFacebookAPI(
        `/${args.adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&limit=${limit}`,
        connection.accessToken
      );

      return data.data || [];
    } catch (error: any) {
      if (error.message === "EXPIRED_TOKEN") {
        await ctx.runMutation(api.facebook.mutations.disconnectFacebook, {});
        throw new Error("EXPIRED_TOKEN");
      }
      throw error;
    }
  },
});

/**
 * Fetch campaign insights
 */
export const fetchCampaignInsights = action({
  args: {
    adAccountId: v.string(),
    datePreset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    const datePreset = args.datePreset || "last_7d";

    try {
      const data = await callFacebookAPI(
        `/${args.adAccountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,spend,ctr&level=campaign&date_preset=${datePreset}`,
        connection.accessToken
      );

      return data.data || [];
    } catch (error: any) {
      if (error.message === "EXPIRED_TOKEN") {
        await ctx.runMutation(api.facebook.mutations.disconnectFacebook, {});
        throw new Error("EXPIRED_TOKEN");
      }
      throw error;
    }
  },
});

/**
 * Pause or resume an ad
 */
export const updateAdStatus = action({
  args: {
    adId: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("PAUSED")),
    adAccountId: v.string(),
    adName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    try {
      // Get current ad status
      const currentAd = await callFacebookAPI(
        `/${args.adId}?fields=status`,
        connection.accessToken
      );

      // Update the ad status
      await callFacebookAPI(`/${args.adId}`, connection.accessToken, "POST", {
        status: args.status,
      });

      // Log the action
      await ctx.runMutation(api.facebook.mutations.logFacebookAction, {
        action: args.status === "PAUSED" ? "pause_ad" : "resume_ad",
        targetType: "ad",
        targetId: args.adId,
        targetName: args.adName,
        adAccountId: args.adAccountId,
        result: "success",
        metadata: {
          previousStatus: currentAd.status,
          newStatus: args.status,
        },
      });

      return { success: true };
    } catch (error: any) {
      // Log the failure
      await ctx.runMutation(api.facebook.mutations.logFacebookAction, {
        action: args.status === "PAUSED" ? "pause_ad" : "resume_ad",
        targetType: "ad",
        targetId: args.adId,
        targetName: args.adName,
        adAccountId: args.adAccountId,
        result: "failure",
        errorMessage: error.message,
      });

      if (error.message === "EXPIRED_TOKEN") {
        await ctx.runMutation(api.facebook.mutations.disconnectFacebook, {});
        throw new Error("EXPIRED_TOKEN");
      }

      throw error;
    }
  },
});
