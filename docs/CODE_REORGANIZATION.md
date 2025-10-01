# Code Reorganization - Token Refresh System

## Overview

The token refresh code has been reorganized by function type for better maintainability and consistency with Convex best practices.

---

## Changes Made

### 1. **Moved Token Refresh Code**

**From:** `convex/facebook/tokenRefresh.ts` (deleted)  
**To:** `convex/facebook/internal.ts` (new file)

**Reason:** All token refresh functions are internal (not publicly accessible), so they belong in `internal.ts` alongside other internal functions.

---

## File Structure

### Before:

```
convex/facebook/
├── actions.ts          # Public actions
├── mutations.ts        # Public mutations
├── queries.ts          # Public queries
└── tokenRefresh.ts     # ❌ Mixed internal functions
```

### After:

```
convex/facebook/
├── actions.ts          # Public actions
├── mutations.ts        # Public mutations
├── queries.ts          # Public queries
└── internal.ts         # ✅ All internal functions organized by type
```

---

## Functions Organized in `internal.ts`

### **Internal Queries** (read data)

- `getExpiringConnections` - Fetch connections with tokens expiring within 30 days

### **Internal Mutations** (write data)

- `updateConnectionToken` - Update a connection with a new token
- `markConnectionInactive` - Mark a failed connection as inactive

### **Internal Actions** (external API calls)

- `refreshSingleToken` - Exchange one token for a new one via Facebook API
- `refreshExpiringTokens` - Main cron job handler to refresh all expiring tokens

### **Helper Functions** (private)

- `exchangeForNewLongLivedToken()` - Facebook API token exchange
- `verifyToken()` - Verify token validity

---

## Updated References

### 1. `convex/crons.ts`

```typescript
// OLD
internal.facebook.tokenRefresh.refreshExpiringTokens;

// NEW
internal.facebook.internal.refreshExpiringTokens;
```

### 2. `convex/facebook/actions.ts`

```typescript
// OLD
internal.facebook.tokenRefresh.refreshSingleToken;

// NEW
internal.facebook.internal.refreshSingleToken;
```

### 3. `docs/TOKEN_REFRESH_SYSTEM.md`

- Updated file structure diagram
- Updated all code examples
- Updated testing instructions

---

## Benefits of This Organization

### ✅ **Better Organization**

- All internal functions in one place
- Clear separation of concerns by function type
- Easier to navigate and maintain

### ✅ **Consistency**

- Follows Convex conventions:
  - `queries.ts` - Public queries
  - `mutations.ts` - Public mutations
  - `actions.ts` - Public actions
  - `internal.ts` - Internal functions (queries, mutations, actions)

### ✅ **Scalability**

- Easy to add new internal functions
- Clear pattern for future development
- Reduced file clutter

### ✅ **Type Safety**

- Functions properly organized by Convex function type:
  - `internalQuery` - Read-only internal operations
  - `internalMutation` - Write internal operations
  - `internalAction` - External API calls

---

## Testing

All changes have been deployed and tested:

```bash
npx convex dev --once
# ✅ Convex functions ready! (3.6s)
```

**No breaking changes** - All references have been updated automatically.

---

## Migration Guide

If you have any code that references the old `tokenRefresh` module:

### Update imports/calls:

```typescript
// OLD ❌
import { internal } from "./_generated/api";
await ctx.runAction(internal.facebook.tokenRefresh.refreshSingleToken, {...});

// NEW ✅
import { internal } from "./_generated/api";
await ctx.runAction(internal.facebook.internal.refreshSingleToken, {...});
```

### Cron jobs:

```typescript
// OLD ❌
internal.facebook.tokenRefresh.refreshExpiringTokens;

// NEW ✅
internal.facebook.internal.refreshExpiringTokens;
```

---

## Files Modified

- ✅ **Created:** `convex/facebook/internal.ts`
- ✅ **Updated:** `convex/crons.ts`
- ✅ **Updated:** `convex/facebook/actions.ts`
- ✅ **Updated:** `docs/TOKEN_REFRESH_SYSTEM.md`
- ✅ **Deleted:** `convex/facebook/tokenRefresh.ts`
- ✅ **Created:** `docs/CODE_REORGANIZATION.md` (this file)

---

## Next Steps

1. ✅ Code reorganized
2. ✅ All references updated
3. ✅ Documentation updated
4. ✅ Deployed and tested
5. ⏭️ Ready to commit

---

**Date:** October 1, 2025  
**Status:** ✅ Complete
