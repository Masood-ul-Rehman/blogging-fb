# Facebook Marketing API Integration

This document provides comprehensive instructions for setting up, testing, and submitting the Facebook Marketing API integration for App Review.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Local Setup](#local-setup)
4. [Facebook App Configuration](#facebook-app-configuration)
5. [Testing the Integration](#testing-the-integration)
6. [App Review Preparation](#app-review-preparation)
7. [Scope Justifications](#scope-justifications)
8. [Screencast Instructions](#screencast-instructions)
9. [Test Users & Test Data](#test-users--test-data)
10. [Security & Privacy](#security--privacy)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This integration enables users to:

- Connect their Facebook accounts via OAuth 2.0
- View their Facebook ad accounts
- Analyze ad performance with metrics (impressions, clicks, spend, CTR)
- Pause/resume ad campaigns
- Track all ad management actions via audit logs

**Tech Stack:**

- Next.js 15 (App Router) with TypeScript
- Clerk for user authentication
- Convex for backend data storage
- Facebook Marketing API v21.0

---

## Architecture

### OAuth Flow

```
User → Connect Button → Facebook OAuth Dialog →
Authorization Code → Server Exchange → Long-Lived Token →
Store in Convex → Fetch Ad Accounts → Store Metadata
```

### Data Flow

```
Client → Convex Query/Action → Facebook Graph API →
Process Response → Return to Client
```

**Security:**

- All Facebook API calls are server-side only (Convex actions)
- Access tokens stored in Convex (should be encrypted in production)
- No client-side exposure of tokens or App Secret
- State parameter for CSRF protection

---

## Local Setup

### Prerequisites

- Node.js 18+ and pnpm
- Clerk account with app configured
- Convex account with deployment
- Facebook Developer account

### Step 1: Clone and Install

```bash
git clone <your-repo>
cd blogging
git checkout feature/facebook-ads-integration
pnpm install
```

### Step 2: Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Clerk (existing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex (existing)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# Facebook Marketing API (new)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/facebook/callback

# Token Encryption (generate with: openssl rand -base64 32)
FB_TOKEN_ENCRYPTION_KEY=your_random_32_byte_base64_key

# Facebook API Version (optional)
FACEBOOK_API_VERSION=v21.0
```

### Step 3: Deploy Convex Schema

```bash
npx convex dev
```

This will push the updated schema with `facebook_connections` and `facebook_action_logs` tables.

### Step 4: Run the Application

```bash
pnpm dev
```

Visit `http://localhost:3000/ads/list`

---

## Facebook App Configuration

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Fill in app details:
   - **App Name:** Your App Name
   - **App Contact Email:** your-email@example.com
   - **Business Account:** Select or create a business account

### Step 2: Add Products

1. In the app dashboard, click **Add Product**
2. Add **Facebook Login**
   - Settings → Valid OAuth Redirect URIs:
     - `http://localhost:3000/api/auth/facebook/callback` (dev)
     - `https://yourdomain.com/api/auth/facebook/callback` (production)
3. Add **Marketing API**

### Step 3: Configure Permissions

1. Go to **App Review** → **Permissions and Features**
2. Request the following permissions:
   - `ads_read` - Read ads data
   - `ads_management` - Manage ads (pause/resume)
   - `business_management` - Access business assets
   - `pages_show_list` - List pages

### Step 4: Add Test Users

1. Go to **Roles** → **Test Users**
2. Click **Add Test Users**
3. Create 2-3 test users
4. For each test user:
   - Set up test ad accounts in [Facebook Ads Manager Test Mode](https://www.facebook.com/ads/manager/test_mode)
   - Create test campaigns with sample data

### Step 5: App Settings

1. **Basic Settings:**

   - Add **App Domains:** `localhost`, `yourdomain.com`
   - **Privacy Policy URL:** (required for review)
   - **Terms of Service URL:** (recommended)
   - **User Data Deletion URL:** (required)

2. **Advanced Settings:**
   - Enable **OAuth Login**
   - Set **Client OAuth Login:** Yes
   - Set **Web OAuth Login:** Yes

---

## Testing the Integration

### Manual Testing Flow

1. **Sign In**

   - Go to `http://localhost:3000`
   - Sign in with Clerk

2. **Navigate to Ads**

   - Go to `/ads/list`
   - Verify the "Connect Facebook" button appears

3. **Connect Facebook**

   - Click "Connect Facebook"
   - Should redirect to Facebook OAuth dialog
   - Login with a **test user** that has ad accounts
   - Grant all requested permissions
   - Should redirect back to `/ads/list?connected=true`

4. **Verify Connection**

   - Connection status card should show "Active"
   - Token expiration date should be displayed
   - Ad accounts should be listed

5. **View Performance**

   - Click "View Performance" on an ad account
   - Select date range (Last 7 days)
   - Verify metrics load:
     - Summary cards (impressions, clicks, spend, CTR)
     - Charts display data
     - Campaigns table shows campaigns

6. **Pause/Resume Campaign**

   - In the campaigns table, click "Pause" on an active campaign
   - Verify status changes to "PAUSED"
   - Check audit logs in Convex dashboard
   - Click "Resume" to reactivate

7. **Disconnect**
   - Return to `/ads/list`
   - Click "Disconnect Facebook"
   - Verify connection becomes inactive

### Automated Testing

Run the test suite:

```bash
pnpm test
```

Tests cover:

- Token exchange logic
- Convex mutations and queries
- Error handling for expired tokens
- OAuth state validation

---

## App Review Preparation

### Required Materials

1. **Screencast Video**

   - Record a complete user flow (see Screencast Instructions below)
   - Max 5 minutes
   - Show all permission use cases
   - Upload to YouTube (unlisted)

2. **Step-by-Step Instructions**

   - Written guide matching the screencast
   - Include test credentials
   - Explain each permission usage

3. **Privacy Policy**

   - Must explain data collection and usage
   - Link from Facebook app settings

4. **User Data Deletion**
   - Implement endpoint: `/api/facebook/data-deletion`
   - Must handle Facebook deletion callbacks
   - Document the process

### Submission Checklist

- [ ] App is in "Development" mode
- [ ] All permissions added to App Review
- [ ] Privacy Policy URL added
- [ ] Data Deletion Callback URL added
- [ ] Screencast uploaded and linked
- [ ] Step-by-step instructions provided
- [ ] Test users created with ad accounts
- [ ] Test credentials provided to reviewers
- [ ] Business verification completed (if required)

---

## Scope Justifications

### ads_read

**Purpose:** Read ad campaign data, metrics, and insights.

**Usage:**

- Fetch ad accounts: `GET /me/adaccounts`
- Fetch campaigns: `GET /{ad_account_id}/campaigns`
- Fetch insights: `GET /{ad_account_id}/insights`

**Justification:**
Required to display user's ad accounts, campaign performance metrics (impressions, clicks, spend, CTR), and historical data for analytics.

**Where Used:**

- `/ads/list` - Display ad accounts
- `/ads/performance` - Display performance charts and metrics

---

### ads_management

**Purpose:** Manage ad campaigns, ad sets, and ads.

**Usage:**

- Update ad status: `POST /{ad_id}` with `status=PAUSED|ACTIVE`

**Justification:**
Allows users to pause and resume their ad campaigns directly from our interface without switching to Facebook Ads Manager.

**Where Used:**

- `/ads/performance` - Pause/Resume buttons in campaigns table

---

### business_management

**Purpose:** Access business assets and ad accounts owned by businesses.

**Usage:**

- Access ad accounts owned by Business Manager
- Required for most business users who manage ads through Business Manager

**Justification:**
Many users manage their ads through Facebook Business Manager rather than personal accounts. This permission is required to access those ad accounts.

**Where Used:**

- OAuth flow - Grants access to business-managed ad accounts
- `/ads/list` - List all accessible ad accounts including business-managed ones

---

### pages_show_list

**Purpose:** List Facebook Pages the user manages.

**Usage:**

- May be used in future features to connect ad campaigns to Pages
- Helpful for users managing page-based campaigns

**Justification:**
While not currently used in the core flow, this permission supports future features like page insights integration and ensures compatibility with page-promoted ads.

**Where Used:**

- Reserved for future features

---

## Screencast Instructions

### Recording Setup

- **Tool:** Loom, OBS, or QuickTime
- **Resolution:** 1280x720 minimum
- **Duration:** 3-5 minutes
- **Audio:** Clear narration explaining each step

### Script

**[0:00 - 0:30] Introduction**

> "This screencast demonstrates our Facebook Marketing API integration. I'll show how users connect their Facebook account, view ad accounts, analyze performance, and manage campaigns."

**[0:30 - 1:00] Sign In**

> "First, I sign in to the application using Clerk authentication."

- Show login screen
- Enter test credentials
- Navigate to dashboard

**[1:00 - 2:00] Connect Facebook**

> "Now I navigate to the Ads section and connect my Facebook account."

- Click on "Ads" navigation
- Show the Connect Facebook button
- Click "Connect Facebook"
- Show Facebook OAuth dialog
- Point out requested permissions
- Click "Continue"
- Show redirect back to app with success message

**[2:00 - 3:00] View Ad Accounts**

> "Here are my connected ad accounts. Each card shows the account name, currency, and timezone."

- Show list of ad accounts
- Highlight the connection status card
- Show token expiration info

**[3:00 - 4:00] View Performance**

> "Let me view performance for one of my ad accounts."

- Click "View Performance"
- Show the performance dashboard
- Explain the metrics: impressions, clicks, spend, CTR
- Change date range to show data updates
- Point out the charts

**[4:00 - 4:30] Manage Campaign**

> "I can pause and resume campaigns directly from this interface."

- Scroll to campaigns table
- Click "Pause" on an active campaign
- Show status change
- Click "Resume"
- Show status change back

**[4:30 - 5:00] Review & Disconnect**

> "All actions are logged for audit purposes. Finally, I can disconnect my Facebook account at any time."

- Return to /ads/list
- Show connection status
- Click "Disconnect"
- Show connection inactive

### Upload & Submit

1. Upload to YouTube as **Unlisted**
2. Copy the video link
3. Paste into Facebook App Review submission
4. Include the timestamp breakdown in the notes

---

## Test Users & Test Data

### Creating Test Users

1. **In Facebook App:**

   - Go to **Roles** → **Test Users**
   - Click **Add Test Users**
   - Generate 2-3 test users
   - Note down credentials

2. **Set Up Test Ad Accounts:**

   - Log in as each test user
   - Go to [Facebook Ads Manager](https://business.facebook.com/adsmanager)
   - Enable test mode (top banner)
   - Create test ad account
   - Create 2-3 test campaigns with mock data

3. **Provide Credentials:**

   ```
   Test User 1:
   Email: testuser_xxxxx@tfbnw.net
   Password: [auto-generated]
   Ad Account ID: act_xxxxx

   Test User 2:
   Email: testuser_yyyyy@tfbnw.net
   Password: [auto-generated]
   Ad Account ID: act_yyyyy
   ```

### Sample Test Data

For test campaigns, create:

- **Campaign 1:** Active, $100 budget, 10,000 impressions, 250 clicks
- **Campaign 2:** Paused, $50 budget, 5,000 impressions, 100 clicks
- **Campaign 3:** Active, $200 budget, 20,000 impressions, 800 clicks

---

## Security & Privacy

### Token Storage

**Current Implementation:**

- Tokens stored in Convex `facebook_connections` table
- Accessible only via server-side Convex actions
- Never sent to client

**Production Recommendations:**

1. **Encrypt tokens** using `FB_TOKEN_ENCRYPTION_KEY`:

   ```typescript
   import crypto from "crypto";

   function encryptToken(token: string, key: string): string {
     const iv = crypto.randomBytes(16);
     const cipher = crypto.createCipheriv(
       "aes-256-cbc",
       Buffer.from(key, "base64"),
       iv
     );
     let encrypted = cipher.update(token, "utf8", "hex");
     encrypted += cipher.final("hex");
     return iv.toString("hex") + ":" + encrypted;
   }

   function decryptToken(encrypted: string, key: string): string {
     const parts = encrypted.split(":");
     const iv = Buffer.from(parts[0], "hex");
     const encryptedText = parts[1];
     const decipher = crypto.createDecipheriv(
       "aes-256-cbc",
       Buffer.from(key, "base64"),
       iv
     );
     let decrypted = decipher.update(encryptedText, "hex", "utf8");
     decrypted += decipher.final("utf8");
     return decrypted;
   }
   ```

2. **Rotate tokens** before expiration
3. **Implement token refresh** logic
4. **Rate limiting** on Facebook API calls

### CSRF Protection

The OAuth flow includes state parameter validation:

```typescript
// Generate state (should use crypto.randomBytes in production)
const state = crypto.randomBytes(32).toString("hex");

// Store in secure, httpOnly cookie
response.cookies.set("oauth_state", state, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 600, // 10 minutes
});

// Validate on callback
const receivedState = searchParams.get("state");
const storedState = request.cookies.get("oauth_state");
if (receivedState !== storedState) {
  throw new Error("Invalid state parameter");
}
```

### Data Deletion

Implement `/api/facebook/data-deletion` endpoint:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { signed_request } = body;

  // Verify signed request from Facebook
  // Parse user_id
  // Delete user's facebook_connection from Convex
  // Delete related audit logs

  return NextResponse.json({
    url: `https://yourdomain.com/deletion-status/${user_id}`,
    confirmation_code: crypto.randomBytes(16).toString("hex"),
  });
}
```

---

## Troubleshooting

### Common Issues

**1. "Missing authorization code" error**

- **Cause:** User denied permissions or OAuth flow interrupted
- **Solution:** Try connecting again, ensure all permissions are granted

**2. "Token exchange failed" error**

- **Cause:** Invalid `FACEBOOK_APP_SECRET` or `FACEBOOK_APP_ID`
- **Solution:** Verify environment variables match Facebook app settings

**3. "No ad accounts found"**

- **Cause:** User has no ad accounts or insufficient permissions
- **Solution:** Create test ad accounts in Ads Manager test mode

**4. "EXPIRED_TOKEN" error**

- **Cause:** Long-lived token has expired (60 days)
- **Solution:** Reconnect Facebook account to get new token

**5. Charts not rendering**

- **Cause:** No data for selected date range
- **Solution:** Try different date range or create test campaigns with data

**6. "Failed to call Facebook API" error**

- **Cause:** Rate limiting or network issues
- **Solution:** Retry logic with exponential backoff is implemented; wait and retry

### Debug Mode

Enable debug logging:

```typescript
// In convex/facebook/actions.ts
const DEBUG = true;

if (DEBUG) {
  console.log("FB API Request:", { endpoint, method, body });
  console.log("FB API Response:", data);
}
```

### Convex Dashboard

Monitor:

- `facebook_connections` table for token status
- `facebook_action_logs` table for action history
- Function logs for errors

---

## Additional Resources

- [Facebook Marketing API Documentation](https://developers.facebook.com/docs/marketing-apis)
- [Facebook App Review Guide](https://developers.facebook.com/docs/app-review)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer)
- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)

---

## Support

For questions or issues:

1. Check this documentation
2. Review the Troubleshooting section
3. Consult Facebook Developer Community
4. Contact the development team

---

**Last Updated:** 2025-09-30  
**Integration Version:** 1.0.0  
**Facebook API Version:** v21.0
