# Facebook Ads Integration - Quick Setup Guide

This guide will help you quickly set up and test the Facebook Marketing API integration locally.

## Prerequisites

- Node.js 18+ and pnpm installed
- Facebook Developer Account
- Clerk account (already configured)
- Convex account (already configured)

## 1. Facebook App Setup (5 minutes)

### Create Facebook App

1. Go to https://developers.facebook.com/apps/
2. Click **Create App** → Select **Business** type
3. Enter app details:
   - App Name: `Your App Name`
   - Contact Email: `your@email.com`

### Configure OAuth & Marketing API

1. **Add Facebook Login product:**

   - Dashboard → Add Product → Facebook Login
   - Settings → Valid OAuth Redirect URIs:
     ```
     http://localhost:3000/api/auth/facebook/callback
     ```

2. **Add Marketing API product:**

   - Dashboard → Add Product → Marketing API

3. **Get App Credentials:**
   - Settings → Basic → Copy:
     - App ID
     - App Secret

## 2. Environment Variables (2 minutes)

Create `.env.local` in your project root:

```bash
# Existing Clerk & Convex variables (keep these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
CONVEX_DEPLOY_KEY=...

# Add these new variables:
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
NEXT_PUBLIC_FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/facebook/callback
```

**Generate encryption key:**

```bash
openssl rand -base64 32
```

Add to `.env.local`:

```
FB_TOKEN_ENCRYPTION_KEY=<generated_key>
```

## 3. Install Dependencies & Run (3 minutes)

```bash
# Install new dependencies
pnpm install

# Deploy Convex schema (includes new Facebook tables)
npx convex dev

# In another terminal, start Next.js
pnpm dev
```

Visit: http://localhost:3000/ads/list

## 4. Test with Facebook Test User (5 minutes)

### Create Test User

1. Go to your Facebook App → Roles → Test Users
2. Click **Add Test Users** → Create 1-2 test users
3. Note the credentials (email/password)

### Set Up Test Ad Account

1. Log in to Facebook as the test user
2. Go to https://business.facebook.com/adsmanager
3. Enable **Test Mode** (banner at top)
4. Create a test ad account
5. Create 2-3 test campaigns with sample data:
   - Campaign 1: Active, $100 budget
   - Campaign 2: Paused, $50 budget

### Test the Integration

1. In your app, go to `/ads/list`
2. Click **Connect Facebook**
3. Log in with test user credentials
4. Grant permissions
5. You should see:
   - Green "Active" badge in connection status
   - List of ad accounts
6. Click **View Performance** on an account
7. Verify:
   - Summary cards show metrics
   - Charts display data
   - Campaigns table lists campaigns
8. Test **Pause** button on an active campaign

## 5. Common Issues & Fixes

### "Missing authorization code" error

- **Fix:** Ensure redirect URI matches exactly in Facebook app settings
- Check: `http://localhost:3000/api/auth/facebook/callback` (no trailing slash)

### "No ad accounts found"

- **Fix:** Make sure test user has created ad accounts in test mode
- Create at least one test campaign with data

### "Invalid App ID or Secret"

- **Fix:** Verify environment variables match Facebook app settings
- Restart dev server after changing .env.local

### Charts show "No data available"

- **Fix:** Select a different date range
- Ensure test campaigns have activity data

## 6. What's Been Added?

### New Pages

- `/ads` - Redirects to list
- `/ads/list` - View ad accounts and connection status
- `/ads/performance` - View performance metrics and manage campaigns

### New Components

- `ConnectFacebookButton` - Initiates OAuth flow
- `TokenStatus` - Shows connection status
- `AdAccountSelector` - Dropdown for selecting accounts
- `PerformanceChart` - Recharts-based visualizations
- `AdsTable` - Campaigns table with pause/resume

### New Convex Tables

- `facebook_connections` - Stores tokens and ad account metadata
- `facebook_action_logs` - Audit log for ad management actions

### New Convex Functions

- **Mutations:** `saveFacebookConnection`, `disconnectFacebook`, `logFacebookAction`
- **Queries:** `getFacebookConnection`, `getAdAccounts`, `hasActiveConnection`
- **Actions:** `fetchAdAccounts`, `fetchAdAccountInsights`, `fetchCampaigns`, `updateAdStatus`

### New API Routes

- `/api/auth/facebook/callback` - OAuth callback handler

## 7. Next Steps for Production

Before deploying to production:

1. **Environment Variables:**

   - Update `FACEBOOK_OAUTH_REDIRECT_URI` to production URL
   - Ensure all secrets are in deployment environment

2. **Facebook App Review:**

   - Submit for review with required permissions
   - Provide screencast (see `docs/facebook-integration.md`)
   - Complete business verification if required

3. **Security Enhancements:**

   - Implement token encryption (see docs)
   - Add CSRF token validation with secure cookies
   - Set up token refresh before expiration

4. **Data Deletion:**

   - Implement `/api/facebook/data-deletion` endpoint
   - Test deletion callback from Facebook

5. **Monitoring:**
   - Set up error tracking (Sentry, etc.)
   - Monitor Facebook API rate limits
   - Set up alerts for token expiration

## 8. Testing

Run the test suite:

```bash
pnpm test
```

Run with coverage:

```bash
pnpm test:coverage
```

## 9. Documentation

For complete documentation, see:

- **Full Integration Guide:** `docs/facebook-integration.md`
- **API Reference:** Facebook Marketing API Docs
- **App Review Guide:** Included in `docs/facebook-integration.md`

## Support

If you encounter issues:

1. Check the troubleshooting section in `docs/facebook-integration.md`
2. Review Convex function logs in the dashboard
3. Check browser console for client-side errors
4. Verify Facebook app is in development mode with test users

## Quick Reference

### Important URLs

- Facebook Developers: https://developers.facebook.com/
- Ads Manager (Test Mode): https://business.facebook.com/adsmanager
- Graph API Explorer: https://developers.facebook.com/tools/explorer

### Required Permissions

- `ads_read` - Read ad data
- `ads_management` - Manage ads
- `business_management` - Access business assets
- `pages_show_list` - List pages

### Key Files

```
app/
├── ads/
│   ├── list/page.tsx           # Ad accounts list
│   └── performance/page.tsx    # Performance dashboard
└── api/auth/facebook/
    └── callback/route.ts       # OAuth callback

components/ads/
├── connect-facebook-button.tsx
├── token-status.tsx
├── ad-account-selector.tsx
├── performance-chart.tsx
└── ads-table.tsx

convex/facebook/
├── mutations.ts                # Save/update connections
├── queries.ts                  # Fetch connections/accounts
└── actions.ts                  # Call Facebook API
```

---

**Ready to test!** Navigate to http://localhost:3000/ads/list and click "Connect Facebook"
