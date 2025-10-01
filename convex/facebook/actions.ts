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
  method: "GET" | "POST" | "DELETE" = "GET",
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

/**
 * Fetch Facebook Pages that the user manages
 * Required for creating ads (need a page_id)
 */
export const fetchFacebookPages = action({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    try {
      const data = await callFacebookAPI(
        `/me/accounts?fields=id,name,access_token,category`,
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
 * Create a Facebook ad campaign
 */
export const createCampaign = action({
  args: {
    adAccountId: v.string(),
    name: v.string(),
    objective: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("PAUSED")),
    specialAdCategories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    try {
      const campaignData = {
        name: args.name,
        objective: args.objective,
        status: args.status,
        special_ad_categories: args.specialAdCategories || [],
      };

      const result = await callFacebookAPI(
        `/${args.adAccountId}/campaigns`,
        connection.accessToken,
        "POST",
        campaignData
      );

      // Log the action
      await ctx.runMutation(api.facebook.mutations.logFacebookAction, {
        action: "create_campaign",
        targetType: "campaign",
        targetId: result.id,
        targetName: args.name,
        adAccountId: args.adAccountId,
        result: "success",
      });

      return result;
    } catch (error: any) {
      // Log failure
      await ctx.runMutation(api.facebook.mutations.logFacebookAction, {
        action: "create_campaign",
        targetType: "campaign",
        targetId: "",
        targetName: args.name,
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

/**
 * Create an ad set with targeting and budget
 */
export const createAdSet = action({
  args: {
    adAccountId: v.string(),
    campaignId: v.string(),
    name: v.string(),
    dailyBudget: v.optional(v.number()),
    lifetimeBudget: v.optional(v.number()),
    billingEvent: v.string(),
    optimizationGoal: v.string(),
    bidAmount: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    targeting: v.object({
      ageMin: v.optional(v.number()),
      ageMax: v.optional(v.number()),
      genders: v.optional(v.array(v.number())),
      geoLocations: v.object({
        countries: v.optional(v.array(v.string())),
      }),
    }),
    status: v.union(v.literal("ACTIVE"), v.literal("PAUSED")),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    try {
      const adSetData: any = {
        name: args.name,
        campaign_id: args.campaignId,
        billing_event: args.billingEvent,
        optimization_goal: args.optimizationGoal,
        status: args.status,
        targeting: {
          age_min: args.targeting.ageMin || 18,
          age_max: args.targeting.ageMax || 65,
          genders: args.targeting.genders || [1, 2],
          geo_locations: {
            countries: args.targeting.geoLocations.countries || ["US"],
          },
        },
      };

      // Add budget (either daily or lifetime, not both)
      if (args.dailyBudget) {
        adSetData.daily_budget = args.dailyBudget;
      } else if (args.lifetimeBudget) {
        adSetData.lifetime_budget = args.lifetimeBudget;
        // Lifetime budget requires start and end time
        if (args.startTime) adSetData.start_time = args.startTime;
        if (args.endTime) adSetData.end_time = args.endTime;
      }

      if (args.bidAmount) {
        adSetData.bid_amount = args.bidAmount;
      }

      const result = await callFacebookAPI(
        `/${args.adAccountId}/adsets`,
        connection.accessToken,
        "POST",
        adSetData
      );

      // Log the action
      await ctx.runMutation(api.facebook.mutations.logFacebookAction, {
        action: "create_adset",
        targetType: "adset",
        targetId: result.id,
        targetName: args.name,
        adAccountId: args.adAccountId,
        result: "success",
      });

      return result;
    } catch (error: any) {
      // Log failure
      await ctx.runMutation(api.facebook.mutations.logFacebookAction, {
        action: "create_adset",
        targetType: "adset",
        targetId: "",
        targetName: args.name,
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

/**
 * Upload an image to Facebook ad account
 * Accepts either a URL or base64 encoded image
 */
export const uploadAdImage = action({
  args: {
    adAccountId: v.string(),
    imageUrl: v.optional(v.string()),
    imageBytes: v.optional(v.string()), // base64 encoded
    imageName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    try {
      const imageData: any = {};

      if (args.imageUrl) {
        imageData.url = args.imageUrl;
      } else if (args.imageBytes) {
        imageData.bytes = args.imageBytes;
      } else {
        throw new Error("Either imageUrl or imageBytes must be provided");
      }

      if (args.imageName) {
        imageData.name = args.imageName;
      }

      const result = await callFacebookAPI(
        `/${args.adAccountId}/adimages`,
        connection.accessToken,
        "POST",
        imageData
      );

      return result;
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
 * Create an ad creative
 */
export const createAdCreative = action({
  args: {
    adAccountId: v.string(),
    name: v.string(),
    pageId: v.string(),
    imageHash: v.string(),
    linkUrl: v.string(),
    message: v.string(),
    headline: v.string(),
    description: v.string(),
    callToActionType: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    try {
      const creativeData = {
        name: args.name,
        object_story_spec: {
          page_id: args.pageId,
          link_data: {
            image_hash: args.imageHash,
            link: args.linkUrl,
            message: args.message,
            name: args.headline,
            description: args.description,
            call_to_action: {
              type: args.callToActionType,
            },
          },
        },
      };

      const result = await callFacebookAPI(
        `/${args.adAccountId}/adcreatives`,
        connection.accessToken,
        "POST",
        creativeData
      );

      // Log the action
      await ctx.runMutation(api.facebook.mutations.logFacebookAction, {
        action: "create_creative",
        targetType: "creative",
        targetId: result.id,
        targetName: args.name,
        adAccountId: args.adAccountId,
        result: "success",
      });

      return result;
    } catch (error: any) {
      // Log failure
      await ctx.runMutation(api.facebook.mutations.logFacebookAction, {
        action: "create_creative",
        targetType: "creative",
        targetId: "",
        targetName: args.name,
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

/**
 * Create an ad
 */
export const createAd = action({
  args: {
    adAccountId: v.string(),
    name: v.string(),
    adSetId: v.string(),
    creativeId: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("PAUSED")),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    try {
      const adData = {
        name: args.name,
        adset_id: args.adSetId,
        creative: {
          creative_id: args.creativeId,
        },
        status: args.status,
      };

      const result = await callFacebookAPI(
        `/${args.adAccountId}/ads`,
        connection.accessToken,
        "POST",
        adData
      );

      // Log the action
      await ctx.runMutation(api.facebook.mutations.logFacebookAction, {
        action: "create_ad",
        targetType: "ad",
        targetId: result.id,
        targetName: args.name,
        adAccountId: args.adAccountId,
        result: "success",
      });

      return result;
    } catch (error: any) {
      // Log failure
      await ctx.runMutation(api.facebook.mutations.logFacebookAction, {
        action: "create_ad",
        targetType: "ad",
        targetId: "",
        targetName: args.name,
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

/**
 * Delete a campaign (used for cleanup on errors)
 */
export const deleteCampaign = action({
  args: {
    campaignId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    try {
      await callFacebookAPI(
        `/${args.campaignId}`,
        connection.accessToken,
        "DELETE"
      );

      return { success: true };
    } catch (error: any) {
      // Don't throw on cleanup errors, just log
      console.error("Failed to delete campaign:", error.message);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Delete an ad set (used for cleanup on errors)
 */
export const deleteAdSet = action({
  args: {
    adSetId: v.string(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.facebook.queries._getFacebookConnectionWithToken
    );

    if (!connection || !connection.isActive) {
      throw new Error("No active Facebook connection");
    }

    try {
      await callFacebookAPI(
        `/${args.adSetId}`,
        connection.accessToken,
        "DELETE"
      );

      return { success: true };
    } catch (error: any) {
      // Don't throw on cleanup errors, just log
      console.error("Failed to delete ad set:", error.message);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Orchestration action: Create a complete ad (campaign -> ad set -> creative -> ad)
 * Handles rollback on errors
 */
export const createCompleteAd = action({
  args: {
    adAccountId: v.string(),
    // Campaign data
    campaignName: v.string(),
    objective: v.string(),
    // Ad Set data
    adSetName: v.string(),
    dailyBudget: v.optional(v.number()),
    lifetimeBudget: v.optional(v.number()),
    billingEvent: v.string(),
    optimizationGoal: v.string(),
    bidAmount: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    targeting: v.object({
      ageMin: v.optional(v.number()),
      ageMax: v.optional(v.number()),
      genders: v.optional(v.array(v.number())),
      geoLocations: v.object({
        countries: v.optional(v.array(v.string())),
      }),
    }),
    // Creative data
    creativeName: v.string(),
    pageId: v.string(),
    imageUrl: v.optional(v.string()),
    imageBytes: v.optional(v.string()),
    linkUrl: v.string(),
    message: v.string(),
    headline: v.string(),
    description: v.string(),
    callToActionType: v.string(),
    // Ad data
    adName: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("PAUSED")),
  },
  handler: async (ctx, args) => {
    let campaignId: string | null = null;
    let adSetId: string | null = null;

    try {
      // Step 1: Create Campaign
      const campaign = await ctx.runAction(
        api.facebook.actions.createCampaign,
        {
          adAccountId: args.adAccountId,
          name: args.campaignName,
          objective: args.objective,
          status: args.status,
        }
      );
      campaignId = campaign.id;

      // Step 2: Create Ad Set
      const adSet = await ctx.runAction(api.facebook.actions.createAdSet, {
        adAccountId: args.adAccountId,
        campaignId: campaignId,
        name: args.adSetName,
        dailyBudget: args.dailyBudget,
        lifetimeBudget: args.lifetimeBudget,
        billingEvent: args.billingEvent,
        optimizationGoal: args.optimizationGoal,
        bidAmount: args.bidAmount,
        startTime: args.startTime,
        endTime: args.endTime,
        targeting: args.targeting,
        status: args.status,
      });
      adSetId = adSet.id;

      // Step 3: Upload Image
      const imageUpload = await ctx.runAction(
        api.facebook.actions.uploadAdImage,
        {
          adAccountId: args.adAccountId,
          imageUrl: args.imageUrl,
          imageBytes: args.imageBytes,
          imageName: args.creativeName,
        }
      );

      // Extract image hash from response
      const imageHash: string = imageUpload.images
        ? (Object.values(imageUpload.images)[0] as any).hash
        : imageUpload.hash;

      // Step 4: Create Creative
      const creative = await ctx.runAction(
        api.facebook.actions.createAdCreative,
        {
          adAccountId: args.adAccountId,
          name: args.creativeName,
          pageId: args.pageId,
          imageHash: imageHash,
          linkUrl: args.linkUrl,
          message: args.message,
          headline: args.headline,
          description: args.description,
          callToActionType: args.callToActionType,
        }
      );

      // Step 5: Create Ad
      const ad = await ctx.runAction(api.facebook.actions.createAd, {
        adAccountId: args.adAccountId,
        name: args.adName,
        adSetId: adSetId,
        creativeId: creative.id,
        status: args.status,
      });

      // Step 6: Save to database for tracking
      await ctx.runMutation(api.facebook.mutations.saveCreatedAd, {
        adAccountId: args.adAccountId,
        campaignId: campaignId,
        campaignName: args.campaignName,
        adSetId: adSetId,
        adSetName: args.adSetName,
        creativeId: creative.id,
        adId: ad.id,
        adName: args.adName,
        status: args.status,
        objective: args.objective,
        dailyBudget: args.dailyBudget,
        lifetimeBudget: args.lifetimeBudget,
        targeting: {
          ageMin: args.targeting.ageMin,
          ageMax: args.targeting.ageMax,
          genders: args.targeting.genders,
          countries: args.targeting.geoLocations.countries,
        },
      });

      return {
        success: true,
        campaignId: campaignId,
        adSetId: adSetId,
        creativeId: creative.id,
        adId: ad.id,
      };
    } catch (error: any) {
      // Cleanup on error
      if (adSetId) {
        await ctx.runAction(api.facebook.actions.deleteAdSet, {
          adSetId,
        });
      }
      if (campaignId) {
        await ctx.runAction(api.facebook.actions.deleteCampaign, {
          campaignId,
        });
      }

      throw new Error(`Failed to create ad: ${error.message}`);
    }
  },
});
