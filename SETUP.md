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
