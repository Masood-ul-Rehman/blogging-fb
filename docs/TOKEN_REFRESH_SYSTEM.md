# Facebook Token Refresh System

## Overview

Automatic and manual token refresh system for Facebook Marketing API long-lived tokens. This ensures uninterrupted access to Facebook ads without requiring users to reconnect their accounts.

---

## 🔐 How Facebook Tokens Work

### Token Types

1. **Short-lived tokens** (1-2 hours)

   - Initial token from OAuth flow
   - Quickly exchanged for long-lived token

2. **Long-lived tokens** (60 days)
   - Stored in database
   - Used for API requests
   - Can be refreshed before expiry

### Token Lifecycle

```
User Connects → Short-lived Token → Long-lived Token (60 days)
                                           ↓
                               Token Refresh (before expiry)
                                           ↓
                               New Long-lived Token (60 days)
```

**Note:** Unlike other OAuth providers, Facebook does NOT provide refresh tokens. Instead, you exchange the current long-lived token for a new one before it expires.

---

## 🤖 Automatic Token Refresh

### Cron Job Schedule

**File:** `convex/crons.ts`

```typescript
crons.daily(
  "refresh-facebook-tokens",
  {
    hourUTC: 3, // 3:00 AM UTC
    minuteUTC: 0,
  },
  internal.facebook.internal.refreshExpiringTokens
);
```

- **Runs:** Daily at 3:00 AM UTC
- **Checks:** All active Facebook connections
- **Refreshes:** Tokens expiring within 7 days
- **Extends:** Token validity for another 60 days

### Refresh Logic

The cron job (`refreshExpiringTokens`):

1. ✅ Queries all active connections
2. 🔍 Filters tokens expiring in ≤30 days
3. ⏰ Prioritizes tokens expiring in ≤7 days
4. 🔄 Exchanges current token for new token via Facebook API
5. ✓ Verifies new token works
6. 💾 Updates database with new token & expiry
7. 📊 Logs results (success/failure counts)

### Error Handling

If token refresh fails:

- ❌ Connection marked as `isActive: false`
- 🔔 User sees "Token Expired" warning in UI
- 🔄 User can reconnect via OAuth or manual refresh

---

## 👤 Manual Token Refresh

### UI Location

**Component:** `components/ads/token-status.tsx`

Users can manually refresh their token from:

- `/ads/list` page
- Any page showing TokenStatus component

### Button States

1. **Token Healthy (>7 days)**

   - ✓ Shows: "Token is healthy. Will auto-refresh when needed."
   - 🔘 Button: "Refresh Token" (available)

2. **Token Expiring Soon (≤7 days)**

   - ⚠️ Shows: "Token expires soon. Refresh now to extend for 60 more days."
   - 🔘 Button: "Refresh Token" (highlighted)

3. **Token Expired**
   - ❌ Shows: "Token Expired - Please reconnect"
   - 🔘 Button: "Connect Facebook" (reconnect via OAuth)

### API Endpoint

**Action:** `api.facebook.actions.refreshMyToken`

```typescript
const refreshToken = useAction(api.facebook.actions.refreshMyToken);

const handleRefreshToken = async () => {
  try {
    await refreshToken({});
    toast.success("Token refreshed! Valid for another 60 days.");
  } catch (error) {
    toast.error(`Failed to refresh: ${error.message}`);
  }
};
```

---

## 🏗️ Architecture

### Files Structure

```
convex/
├── crons.ts                          # Cron job definitions
├── facebook/
│   ├── internal.ts                  # Internal token refresh functions
│   │   ├── refreshExpiringTokens    # Main cron handler (internalAction)
│   │   ├── refreshSingleToken       # Refresh one token (internalAction)
│   │   ├── getExpiringConnections   # Query expiring tokens (internalQuery)
│   │   ├── updateConnectionToken    # Update database (internalMutation)
│   │   └── markConnectionInactive   # Mark failed tokens (internalMutation)
│   ├── actions.ts
│   │   └── refreshMyToken           # Manual refresh action
│   ├── mutations.ts                 # Public mutations
│   └── queries.ts                   # Public queries

components/ads/
└── token-status.tsx                 # UI with refresh button
```

### Data Flow

#### Automatic Refresh (Cron)

```
Cron Trigger (3 AM UTC)
    ↓
refreshExpiringTokens
    ↓
getExpiringConnections (query)
    ↓
For each expiring token:
    ↓
refreshSingleToken
    ↓
Exchange token with Facebook API
    ↓
Verify new token
    ↓
updateConnectionToken (mutation)
    ↓
Database updated ✓
```

#### Manual Refresh (User)

```
User clicks "Refresh Token"
    ↓
refreshMyToken (action)
    ↓
Get current connection
    ↓
refreshSingleToken (internal action)
    ↓
Exchange token with Facebook API
    ↓
Verify new token
    ↓
updateConnectionToken (mutation)
    ↓
Show success toast ✓
```

---

## 🔧 Token Exchange Process

### Facebook API Endpoint

```http
GET https://graph.facebook.com/v23.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={FACEBOOK_APP_ID}
  &client_secret={FACEBOOK_APP_SECRET}
  &fb_exchange_token={current_long_lived_token}
```

### Response

```json
{
  "access_token": "new_long_lived_token...",
  "token_type": "bearer",
  "expires_in": 5183944 // ~60 days in seconds
}
```

### Token Verification

After receiving new token, verify it works:

```http
GET https://graph.facebook.com/v23.0/me?access_token={new_token}
```

If verification succeeds, update database. Otherwise, mark connection as inactive.

---

## 📊 Monitoring & Logs

### Cron Job Logs

Check Convex logs for daily refresh results:

```typescript
{
  total: 10,           // Total connections checked
  refreshed: 3,        // Successfully refreshed
  failed: 0,           // Failed to refresh
  skipped: 7,          // Not expiring yet (>7 days)
  timestamp: "2025-10-01T03:00:00.000Z"
}
```

### Console Output Examples

**Success:**

```
🕐 Starting Facebook token refresh cron job...
📊 Found 10 connections to check for token refresh
⏰ Token expiring soon for user user_abc (5 days remaining)
🔄 Refreshing token for user: user_abc
✅ Token refreshed successfully for user: user_abc. New expiry: 2025-12-01
✅ Token refresh cron job completed: { refreshed: 3, failed: 0 }
```

**Failure:**

```
🔄 Refreshing token for user: user_xyz
❌ Failed to refresh token for user user_xyz: Token exchange failed
```

---

## 🛡️ Security Considerations

### Access Token Storage

- ✅ Stored in Convex database (server-side)
- ✅ Never sent to client
- ✅ Only accessible via internal queries
- ⚠️ **TODO:** Encrypt before storing in production

### Token Refresh Security

- ✅ Requires valid `FACEBOOK_APP_SECRET`
- ✅ Internal actions (not publicly accessible)
- ✅ User-scoped (can only refresh own token)
- ✅ Rate limited (1 second delay between refreshes)

### Environment Variables Required

```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_API_VERSION=v23.0
```

---

## 🧪 Testing

### Test Manual Refresh

1. Go to `/ads/list`
2. Check "Token Expires" date
3. Click "Refresh Token" button
4. Verify success toast
5. Check new expiry date (should be ~60 days from now)

### Test Automatic Refresh

#### Option 1: Trigger Cron Manually

```typescript
// In Convex dashboard: Functions tab
// Run: internal.facebook.internal.refreshExpiringTokens
// Args: {}
```

#### Option 2: Wait for Scheduled Run

- Cron runs daily at 3:00 AM UTC
- Check logs next day
- Verify tokens were refreshed

### Simulate Expiring Token

Manually update `expiresAt` in database:

```typescript
// Set token to expire in 5 days
const fiveDaysFromNow = Date.now() + 5 * 24 * 60 * 60 * 1000;

// Update in Convex dashboard
await ctx.db.patch(connectionId, {
  expiresAt: fiveDaysFromNow,
});
```

Then test that:

1. UI shows "Token expiring soon" warning
2. Manual refresh works
3. Cron job picks it up and refreshes

---

## 📈 Best Practices

### For Users

1. ✅ Keep connection active
2. ✅ Refresh manually if seeing "expiring soon" warning
3. ✅ Reconnect via OAuth if token expires
4. ❌ Don't disconnect and reconnect unnecessarily

### For Developers

1. ✅ Monitor cron job logs daily
2. ✅ Set up alerts for high failure rates
3. ✅ Encrypt tokens before storing in production
4. ✅ Keep `FACEBOOK_APP_SECRET` secure
5. ✅ Test token refresh in staging before production

### Refresh Timing

- **7 days before expiry:** Automatic refresh kicks in
- **30 days:** Cron checks all tokens expiring in this window
- **60 days:** New token validity period

**Why 7 days?**

- Provides buffer for failures/retries
- Users have time to take action if needed
- Multiple cron runs before expiry

---

## ❓ FAQ

### Q: What happens if token refresh fails?

**A:** Connection is marked inactive. User sees "Token Expired" warning and can reconnect via OAuth.

### Q: Can I change the cron schedule?

**A:** Yes! Edit `convex/crons.ts`. You can run it:

- Multiple times per day: `crons.hourly()`
- Weekly: `crons.weekly()`
- Custom interval: `crons.interval()`

### Q: Does refresh work for expired tokens?

**A:** No. Facebook won't exchange an already-expired token. User must reconnect via OAuth to get a new token.

### Q: How many tokens can be refreshed at once?

**A:** All tokens expiring ≤7 days are refreshed in one cron run, with 1-second delay between each to avoid rate limits.

### Q: What if Facebook API is down during cron?

**A:** Refresh fails for that run, but cron runs daily. Token will be retried next day. As long as refresh succeeds within 7 days, no interruption occurs.

---

## 🔄 Migration Guide

If you have existing Facebook connections, they will automatically benefit from token refresh once this system is deployed:

1. ✅ No database migration needed (uses existing `expiresAt` field)
2. ✅ Cron starts running automatically
3. ✅ First run will check all connections
4. ✅ Tokens expiring soon will be refreshed immediately

---

## 📝 Changelog

**v1.0.0** (Oct 2025)

- ✨ Initial token refresh system
- 🤖 Daily cron job for automatic refresh
- 👤 Manual refresh button in UI
- 📊 Comprehensive logging
- 🛡️ Security improvements

---

## 🚀 Future Enhancements

- [ ] Email notifications for token expiry warnings
- [ ] Slack/Discord webhooks for failed refreshes
- [ ] Token encryption at rest
- [ ] Refresh history tracking
- [ ] Admin dashboard for monitoring all tokens
- [ ] Retry logic with exponential backoff
- [ ] Batch refresh optimization

---

**Last Updated:** October 1, 2025  
**Convex Version:** Latest  
**Facebook API Version:** v23.0
