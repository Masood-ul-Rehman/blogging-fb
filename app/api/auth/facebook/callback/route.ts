import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FacebookUserResponse {
  id: string;
  name: string;
  email?: string;
}

interface FacebookAdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone?: string;
}

/**
 * Exchange authorization code for short-lived access token
 */
async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<FacebookTokenResponse> {
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    redirect_uri: redirectUri,
    code,
  });

  console.log("Token exchange params:", {
    client_id: FACEBOOK_APP_ID,
    redirect_uri: redirectUri,
    code_present: !!code,
  });

  const response = await fetch(
    `https://graph.facebook.com/v23.0/oauth/access_token?${params.toString()}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Token exchange error details:", error);
    throw new Error(
      `Token exchange failed: ${error.error?.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<FacebookLongLivedTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/v23.0/oauth/access_token?${params.toString()}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Long-lived token exchange failed: ${
        error.error?.message || response.statusText
      }`
    );
  }

  return response.json();
}

/**
 * Fetch user info from Facebook
 */
async function fetchFacebookUser(
  accessToken: string
): Promise<FacebookUserResponse> {
  const response = await fetch(
    `https://graph.facebook.com/v23.0/me?fields=id,name,email&access_token=${accessToken}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to fetch user: ${error.error?.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Fetch ad accounts from Facebook
 */
async function fetchAdAccounts(
  accessToken: string
): Promise<FacebookAdAccount[]> {
  const response = await fetch(
    `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,account_id,name,currency,timezone&access_token=${accessToken}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to fetch ad accounts: ${
        error.error?.message || response.statusText
      }`
    );
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * OAuth callback handler
 * Handles the redirect from Facebook after user authorization
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Facebook OAuth callback received");
    console.log("Request URL:", request.url);
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );

    // Note: We'll get the user ID from the state parameter instead of auth
    // This is because OAuth redirects can sometimes lose the session context

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorReason = searchParams.get("error_reason");
    const errorDescription = searchParams.get("error_description");

    console.log("OAuth parameters:", { code: !!code, state, error });

    // Handle user denial or errors from Facebook
    if (error) {
      console.error("Facebook OAuth error:", {
        error,
        errorReason,
        errorDescription,
      });
      return NextResponse.redirect(
        new URL(
          `/ads/list?error=${encodeURIComponent(
            errorDescription || "Facebook authorization failed"
          )}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // Extract user ID from state parameter
    // State format: "user_33PPMP17B4YCkttjGY9gBUZERCk_1759238776568"
    if (!state) {
      return NextResponse.json(
        { error: "Missing state parameter" },
        { status: 400 }
      );
    }

    // Extract user ID from state (format: userId_timestamp)
    const stateParts = state.split("_");
    if (stateParts.length < 2) {
      return NextResponse.json(
        { error: "Invalid state parameter format" },
        { status: 400 }
      );
    }

    // Reconstruct the user ID (Clerk user IDs have underscores)
    const userIdFromState = stateParts.slice(0, -1).join("_");
    console.log("User ID from state:", userIdFromState);

    // Use the user ID from state instead of auth
    const finalUserId = userIdFromState;

    // Construct the redirect URI - must match exactly what was sent in the initial request
    // Use environment variable if set, otherwise construct from request
    const redirectUri =
      process.env.FACEBOOK_OAUTH_REDIRECT_URI ||
      process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}/api/auth/facebook/callback`;

    console.log("Using redirect URI:", redirectUri);
    console.log("Request protocol:", request.nextUrl.protocol);
    console.log("Request host:", request.nextUrl.host);

    // Step 1: Exchange code for short-lived token
    console.log("Exchanging code for token...");
    const tokenResponse = await exchangeCodeForToken(code, redirectUri);

    // Step 2: Exchange short-lived token for long-lived token
    console.log("Exchanging for long-lived token...");
    const longLivedTokenResponse = await exchangeForLongLivedToken(
      tokenResponse.access_token
    );

    // Step 3: Fetch user information
    console.log("Fetching Facebook user info...");
    const fbUser = await fetchFacebookUser(longLivedTokenResponse.access_token);

    // Step 4: Fetch ad accounts
    console.log("Fetching ad accounts...");
    const adAccounts = await fetchAdAccounts(
      longLivedTokenResponse.access_token
    );

    // Step 5: Calculate token expiration
    const expiresAt = Date.now() + longLivedTokenResponse.expires_in * 1000;

    // Step 6: Save to Convex (without authentication - using OAuth-specific mutation)
    console.log("Saving to Convex...");
    const convexClient = new ConvexHttpClient(CONVEX_URL);

    // Note: In production, encrypt the access token before storing
    // For example, using crypto.createCipheriv with FB_TOKEN_ENCRYPTION_KEY
    await convexClient.mutation(
      api.facebook.mutations.saveFacebookConnectionOAuth,
      {
        clerkUserId: finalUserId,
        fbUserId: fbUser.id,
        accessToken: longLivedTokenResponse.access_token, // Should be encrypted
        tokenType: longLivedTokenResponse.token_type,
        expiresAt,
        scopes: ["ads_read", "ads_management"], // Update based on actual granted scopes
        adAccounts: adAccounts.map((acc) => ({
          id: acc.id,
          accountId: acc.account_id,
          name: acc.name,
          currency: acc.currency,
          timezone: acc.timezone || undefined, // Optional field
        })),
      }
    );

    console.log("Facebook connection saved successfully");

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/ads/list?connected=true", request.url)
    );
  } catch (error: any) {
    console.error("Facebook OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/ads/list?error=${encodeURIComponent(
          error.message || "Failed to connect Facebook"
        )}`,
        request.url
      )
    );
  }
}
