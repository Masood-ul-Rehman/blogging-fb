# Environment Setup

To fix the Convex authentication errors, you need to set up the following environment variables in a `.env.local` file:

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_JWT_ISSUER_DOMAIN=your_clerk_jwt_issuer_domain_here

# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
CONVEX_DEPLOY_KEY=your_convex_deploy_key_here

# Facebook Marketing API (optional - for /ads integration)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/facebook/callback
FB_TOKEN_ENCRYPTION_KEY=generate_with_openssl_rand_base64_32
```

## How to Get These Values

### Clerk Values

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Go to "API Keys" section
4. Copy the "Publishable key" for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
5. Copy the "Secret key" for `CLERK_SECRET_KEY`
6. For `CLERK_JWT_ISSUER_DOMAIN`, use the format: `https://clerk.{your-publishable-key-suffix}.lcl.dev` (for development) or your production domain

### Convex Values

1. Go to your [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your project
3. Go to "Settings" → "API Keys"
4. Copy the "Deploy Key" for `CONVEX_DEPLOY_KEY`
5. Copy the "URL" for `NEXT_PUBLIC_CONVEX_URL`

## After Setting Up Environment Variables

1. Restart your development server: `npm run dev` or `pnpm dev`
2. The authentication errors should be resolved
3. Users will need to sign in to view resources and dashboard content

## What Was Fixed

- Updated Convex authentication integration with Clerk
- Added proper authentication guards using `<Authenticated>` and `<Unauthenticated>` components
- Fixed the "Unauthenticated" errors by ensuring queries only run when users are authenticated
- Added loading states and proper error handling for unauthenticated users

## Facebook Ads Integration (New Feature)

This project now includes a Facebook Marketing API integration. To use it:

1. **Quick Setup:** See [`docs/FACEBOOK_SETUP.md`](docs/FACEBOOK_SETUP.md) for a step-by-step guide
2. **Full Documentation:** See [`docs/facebook-integration.md`](docs/facebook-integration.md) for complete details
3. **Features:**
   - Connect Facebook accounts via OAuth
   - View ad accounts and performance metrics
   - Manage campaigns (pause/resume)
   - Audit logging for all actions

### To Get Started with Facebook Integration:

1. Create a Facebook App at https://developers.facebook.com/
2. Add the Facebook environment variables to `.env.local` (see above)
3. Navigate to `/ads/list` in your app
4. Click "Connect Facebook" and follow the OAuth flow

For testing, use Facebook test users and test ad accounts in test mode.
