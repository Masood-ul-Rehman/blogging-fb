# Fix NaN Expiration Dates - Migration Guide

## Problem

Some Facebook connections in the database have `NaN` (Not a Number) values for `expiresAt`. This happens when Facebook's API doesn't return `expires_in` in the token exchange response.

### Impact:

- ❌ Cron job skips these connections
- ❌ Token status UI shows "Invalid date"
- ❌ Automatic token refresh won't work
- ❌ Manual token refresh fails

---

## ✅ Fixes Applied

### 1. **OAuth Callback** (`app/api/auth/facebook/callback/route.ts`)

**Before:**

```typescript
const expiresAt = Date.now() + longLivedTokenResponse.expires_in * 1000;
// If expires_in is undefined → NaN
```

**After:**

```typescript
const expiresInSeconds = longLivedTokenResponse.expires_in || 5184000; // Default to 60 days
const expiresAt = Date.now() + expiresInSeconds * 1000;
// Always a valid number ✅
```

### 2. **Cron Job** (`convex/facebook/internal.ts`)

Now handles NaN values:

- ✅ Detects NaN expiration dates
- ✅ Marks connection as inactive
- ✅ Logs warning for user to reconnect
- ✅ Reports count in summary

**Output:**

```javascript
{
  total: 5,
  refreshed: 2,
  failed: 0,
  skipped: 2,
  invalid: 1,  // ← NaN values found and handled
  timestamp: "2025-10-01T15:36:00.000Z"
}
```

### 3. **Query Filter** (`convex/facebook/internal.ts`)

```typescript
// Skip connections with invalid (NaN) expiration dates
return allConnections.filter(
  (conn) =>
    !isNaN(conn.expiresAt) && // ← New validation
    conn.expiresAt <= thirtyDaysFromNow &&
    conn.expiresAt > now
);
```

---

## 🔧 How to Fix Existing NaN Values

### Option 1: Run Migration Script (Recommended)

1. **Open Convex Dashboard**

   - Go to https://dashboard.convex.dev
   - Select your project
   - Navigate to "Functions" tab

2. **Run the migration function:**

   - Find: `internal.facebook.internal.fixInvalidExpirationDates`
   - Click "Run"
   - Args: `{}`
   - Click "Execute"

3. **Check results:**

   ```javascript
   {
     total: 10,              // Total connections checked
     fixed: 0,               // (Reserved for future use)
     markedInactive: 3       // Connections with NaN marked inactive
   }
   ```

4. **Notify affected users:**
   - Users with marked inactive connections will see "Token Expired" in UI
   - They need to click "Connect Facebook" to re-authenticate

### Option 2: Let Cron Job Handle It

The cron job now automatically:

1. Detects NaN values during its daily run
2. Marks connections as inactive
3. Logs warnings for monitoring

**No manual action needed** - just wait for next cron run (3:00 AM UTC daily).

---

## 🧪 Testing

### 1. Test New Connections

Connect a Facebook account and verify:

- ✅ `expiresAt` is a valid timestamp (not NaN)
- ✅ Token status UI shows correct expiration date
- ✅ Days until expiry calculated correctly

### 2. Test Cron Job

```bash
# In Convex Dashboard → Functions
# Run: internal.facebook.internal.refreshExpiringTokens
# Args: {}
```

Expected output:

- No errors about NaN values
- All connections processed correctly

### 3. Check Token Status UI

Visit `/ads/list` and verify:

- ✅ "Token Expires" shows valid date (not "Invalid date")
- ✅ Days until expiry shown correctly
- ✅ No console errors

---

## 📊 Monitoring

### Check for NaN Values

You can query directly in Convex Dashboard:

```javascript
// In Data tab → facebook_connections
// Look for records where expiresAt is NaN

// Or run this in Functions tab as a query:
ctx.db
  .query("facebook_connections")
  .collect()
  .then((conns) => conns.filter((c) => isNaN(c.expiresAt)));
```

### Cron Job Logs

Check logs for warnings:

```
⚠️  Found 2 connection(s) with invalid expiration dates.
    These have been marked inactive and users need to reconnect.
```

---

## 🔮 Prevention

All new connections are now protected:

1. ✅ **Default value** - If Facebook doesn't provide `expires_in`, defaults to 60 days
2. ✅ **Validation** - Checks for NaN before saving
3. ✅ **Logging** - Logs calculated expiration for debugging
4. ✅ **Filtering** - Cron job and queries skip NaN values

---

## 🚨 What Users Need to Do

If your connection has NaN expiration:

1. **You'll see:** "Token Expired - Please reconnect"
2. **Action:** Click "Connect Facebook" button
3. **Result:** New connection with valid 60-day expiration

**No data loss** - Your ad accounts and settings remain.

---

## ❓ FAQ

### Q: Why did this happen?

**A:** Facebook's token exchange API sometimes doesn't include `expires_in` in the response. The code didn't have a fallback, resulting in `NaN`.

### Q: Will existing ads be affected?

**A:** No. Only the connection status. Users just need to reconnect.

### Q: How do I prevent this in the future?

**A:** Already fixed! All new connections use a default 60-day expiration if Facebook doesn't provide one.

### Q: Can I manually set a valid expiration?

**A:** Easier to just reconnect via OAuth. But you can update in Convex Dashboard:

```javascript
// In Data tab → facebook_connections
// Edit record, set expiresAt to:
Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days from now
```

### Q: Will the cron job fix them automatically?

**A:** It will mark them inactive, but users still need to reconnect to get a fresh token.

---

## 📝 Files Changed

- ✅ `app/api/auth/facebook/callback/route.ts` - Added default expiration
- ✅ `convex/facebook/internal.ts` - Added NaN handling and migration
- ✅ `docs/FIX_NAN_EXPIRATION.md` - This documentation

---

## ✅ Deployment Status

- ✅ Fixes deployed
- ✅ Migration function available
- ✅ Cron job updated
- ⏭️ Ready to run migration

---

**Date:** October 1, 2025  
**Status:** ✅ Fixed and Deployed
