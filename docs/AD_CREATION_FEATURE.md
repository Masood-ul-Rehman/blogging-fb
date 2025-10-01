# Facebook Ad Creation Feature - Implementation Guide

## Overview

This document describes the complete implementation of the Facebook Ad Creation feature, which allows users to create Facebook ads directly from the application using the Facebook Marketing API v23.0.

---

## 🎯 Feature Capabilities

Users can now:
1. **Create complete Facebook ad campaigns** through a guided multi-step wizard
2. **Configure campaign objectives** (Traffic, Engagement, Leads, Awareness, Sales, App Promotion)
3. **Set up ad sets** with budget, targeting, and optimization settings
4. **Upload ad creatives** with images, copy, and call-to-action buttons
5. **Review and publish ads** as either active or paused

---

## 📁 Architecture Overview

### **Backend (Convex)**

#### **1. Schema Updates** (`convex/schema.ts`)
- **`created_ads` table**: Tracks all ads created through the platform
  - Stores campaign, ad set, creative, and ad IDs
  - Links to user and ad account
  - Tracks budget, targeting, and status information
  - Indexed by user, ad account, campaign, and timestamp

#### **2. Ad Creation Actions** (`convex/facebook/ad-creation-actions.ts`)
All actions use the internal `_getFacebookConnectionWithToken` query to securely retrieve access tokens.

**Individual Actions:**
- `fetchFacebookPages()` - Gets user's Facebook Pages (required for ad creatives)
- `createCampaign()` - Creates a Facebook campaign
- `createAdSet()` - Creates an ad set with targeting and budget
- `uploadAdImage()` - Uploads images to Facebook (supports URL or base64)
- `createAdCreative()` - Creates ad creative with image and copy
- `createAd()` - Creates the final ad entity
- `deleteCampaign()` - Cleanup helper for error rollback
- `deleteAdSet()` - Cleanup helper for error rollback

**Orchestration Action:**
- `createCompleteAd()` - **Main entry point** that:
  1. Creates campaign
  2. Creates ad set
  3. Uploads image
  4. Creates creative
  5. Creates ad
  6. Saves to database
  7. Handles rollback on errors (deletes created entities)

#### **3. Mutations** (`convex/facebook/mutations.ts`)
- `saveCreatedAd()` - Stores created ad information in the database for tracking

---

### **Frontend (React/Next.js)**

#### **Components Structure**

**1. Main Page** (`app/ads/create/page.tsx`)
- Entry point for ad creation
- Manages form state across all steps
- Handles validation and submission
- Converts form data to Facebook API format
- Features:
  - Ad account selection
  - Multi-step wizard integration
  - Form data management
  - Validation logic
  - Error handling
  - Success redirection

**2. Wizard Component** (`components/ads/ad-creation-wizard.tsx`)
- Multi-step progress indicator
- Step navigation (Next/Previous)
- Progress bar visualization
- Submit button on final step
- Disables navigation during submission

**3. Step Components:**

**a) Campaign Form** (`components/ads/campaign-form.tsx`)
- Campaign name input
- Objective selection (6 options)
- Budget type selection (daily vs. lifetime)

**b) Ad Set Form** (`components/ads/adset-form.tsx`)
- Ad set name
- Budget amount (currency-aware)
- Date range selector (for lifetime budget)
- Optimization goal dropdown
- Billing event selection
- **Targeting options:**
  - Age range slider (18-65+)
  - Gender checkboxes (All, Male, Female)
  - Country multi-select (8 countries)

**c) Creative Form** (`components/ads/creative-form.tsx`)
- Facebook Page selector
- Image upload options:
  - File upload (with drag & drop UI)
  - Image URL input
  - Live preview
- **Ad copy fields:**
  - Primary text (500 char limit)
  - Headline (40 char limit)
  - Description (125 char limit, optional)
  - Destination URL
  - Call-to-action button (9 options)

**d) Review Step** (`components/ads/review-step.tsx`)
- Summary of all settings
- Image preview
- Status toggle (Active/Paused)
- Warning about charges
- Organized into cards:
  - Campaign Details
  - Ad Set Configuration
  - Audience Targeting
  - Ad Creative

---

## 🔄 Data Flow

### **Ad Creation Flow**

```
1. USER FILLS FORMS
   ├─ Step 1: Campaign (name, objective, budget type)
   ├─ Step 2: Ad Set (budget, targeting, optimization)
   ├─ Step 3: Creative (page, image, copy, CTA)
   └─ Step 4: Review (preview, status toggle)

2. FORM VALIDATION
   ├─ Client-side validation at each step
   ├─ Required fields checked
   ├─ URL format validation
   └─ Budget minimum validation

3. SUBMIT TO BACKEND
   ├─ Convert image to base64 (if file upload)
   ├─ Convert budget to cents
   ├─ Format dates for lifetime budget
   └─ Call createCompleteAd action

4. BACKEND PROCESSING
   ├─ Get access token (internal query)
   ├─ Create campaign → Facebook API
   ├─ Create ad set → Facebook API
   ├─ Upload image → Facebook API
   ├─ Create creative → Facebook API
   ├─ Create ad → Facebook API
   ├─ Save to database (created_ads table)
   └─ Log all actions (facebook_action_logs)

5. ERROR HANDLING
   ├─ If any step fails:
   │  ├─ Delete created campaign (if exists)
   │  ├─ Delete created ad set (if exists)
   │  ├─ Log failure to action logs
   │  └─ Return error to user
   └─ User can retry from current step

6. SUCCESS
   ├─ Show success toast
   └─ Redirect to /ads/performance with account ID
```

---

## 🔐 Security & Token Management

### **Access Token Flow**
1. **Frontend** never receives access tokens
2. **Backend actions** use `_getFacebookConnectionWithToken` (internal query)
3. **Token validation** checks expiration before each API call
4. **Auto-disconnect** if token is expired (error code 190)
5. **Audit logging** tracks all actions for compliance

### **Data Protection**
- Access tokens stored in Convex (should be encrypted in production)
- Tokens never sent to client
- All Facebook API calls server-side only
- User can only access their own data (filtered by Clerk user ID)

---

## 📊 Database Schema

### **`created_ads` Table**

```typescript
{
  clerkUserId: string,           // User who created the ad
  adAccountId: string,           // Facebook ad account ID
  campaignId: string,            // Facebook campaign ID
  campaignName: string,          // Campaign name for display
  adSetId: string,               // Facebook ad set ID
  adSetName: string,             // Ad set name for display
  creativeId: string,            // Facebook creative ID
  adId: string,                  // Facebook ad ID
  adName: string,                // Ad name for display
  status: string,                // "ACTIVE" or "PAUSED"
  objective: string,             // Campaign objective
  dailyBudget?: number,          // In cents (if daily budget)
  lifetimeBudget?: number,       // In cents (if lifetime budget)
  targeting?: {
    ageMin?: number,
    ageMax?: number,
    genders?: number[],          // [1=male, 2=female]
    countries?: string[],        // ISO country codes
  },
  createdAt: number,             // Unix timestamp
}
```

**Indexes:**
- `by_clerkUserId` - Get user's ads
- `by_adAccountId` - Get ads by account
- `by_campaignId` - Get ads by campaign
- `by_timestamp` - Sort by creation date

---

## 🚀 Usage Guide

### **For End Users**

1. **Navigate to Ad Creation**
   - Click "Create Ad" button on `/ads/list` page
   - Or go directly to `/ads/create`

2. **Step 1: Campaign Setup**
   - Enter campaign name
   - Select objective (what you want to achieve)
   - Choose budget type (daily or lifetime)
   - Click "Next"

3. **Step 2: Ad Set Configuration**
   - Name your ad set
   - Set budget amount
   - (For lifetime budget) Set start/end dates
   - Choose optimization goal
   - Select billing event
   - **Set targeting:**
     - Age range
     - Gender
     - Countries
   - Click "Next"

4. **Step 3: Creative**
   - Select Facebook Page
   - Upload image or provide URL
   - Write primary text (main message)
   - Write headline (bold text below image)
   - Add description (optional)
   - Enter destination URL
   - Choose call-to-action button
   - Click "Next"

5. **Step 4: Review & Publish**
   - Review all settings
   - Toggle "Launch Ad Immediately" (Active vs. Paused)
   - Click "Create Ad"
   - Wait for confirmation
   - Redirected to Performance page

### **For Developers**

#### **Adding New Campaign Objectives**

Edit `components/ads/campaign-form.tsx`:

```typescript
const OBJECTIVES = [
  { value: "OUTCOME_YOUR_OBJECTIVE", label: "Your Objective - Description" },
  // ... existing objectives
];
```

#### **Adding New Countries**

Edit `components/ads/adset-form.tsx`:

```typescript
const COUNTRIES = [
  { value: "XX", label: "Country Name" },
  // ... existing countries
];
```

#### **Adding New Call-to-Actions**

Edit `components/ads/creative-form.tsx`:

```typescript
const CALL_TO_ACTIONS = [
  { value: "YOUR_CTA", label: "Your CTA" },
  // ... existing CTAs
];
```

---

## ⚠️ Important Notes

### **Facebook API Requirements**

1. **Required Permissions:**
   - `ads_read` - Read ads data
   - `ads_management` - Create and manage ads
   - `business_management` - Access business assets
   - `pages_show_list` - List Facebook Pages

2. **Facebook Page Required:**
   - Every ad needs a Facebook Page
   - Users must have at least one Page
   - Page must be accessible by the user

3. **Budget Constraints:**
   - Minimum daily budget: $1.00 (100 cents)
   - Budgets stored in cents in Facebook API
   - Currency determined by ad account settings

4. **Image Requirements:**
   - Supported formats: JPG, PNG, GIF
   - Maximum size: 30MB
   - Can use URL or upload file

### **Error Handling**

**Common Errors:**
- `EXPIRED_TOKEN` - User needs to reconnect Facebook
- `No Facebook Pages` - User needs to create a Facebook Page
- `Insufficient Permissions` - Need to re-authorize with correct scopes
- `Budget too low` - Minimum $1.00 required

**Rollback Mechanism:**
- If ad creation fails at any step, previously created entities are deleted
- Prevents orphaned campaigns/ad sets
- User can retry without creating duplicates

### **Testing**

**Recommended Test Flow:**
1. Create ad with PAUSED status first
2. Verify ad appears in Facebook Ads Manager
3. Check database entry in `created_ads` table
4. Verify action logs in `facebook_action_logs`
5. Test with minimal budget ($1.00)

---

## 🔧 Troubleshooting

### **"No Facebook connection" Error**
- User needs to connect Facebook account at `/ads/list`
- Check token expiration in database
- Verify `facebook_connections` table has active entry

### **"Failed to load Facebook pages" Error**
- User may not have admin access to any Pages
- User needs to create a Facebook Page first
- Check `pages_show_list` permission granted

### **Image Upload Fails**
- Check file size (max 30MB)
- Verify file format (JPG/PNG/GIF only)
- For URL: ensure publicly accessible
- Check CORS if loading from external domain

### **Ad Creation Fails After Review**
- Check browser console for detailed error
- Verify all required fields filled
- Check budget meets minimum ($1.00)
- Verify Facebook API limits not exceeded
- Check action logs table for error details

### **TypeScript Errors**
- Run Convex dev server to regenerate types
- Types auto-generated from Convex schema
- Restart Next.js dev server if needed

---

## 📈 Future Enhancements

**Potential Features:**
- [ ] Advanced targeting (interests, behaviors, custom audiences)
- [ ] Multiple ad creatives per campaign
- [ ] A/B testing setup
- [ ] Bulk ad creation from CSV
- [ ] Ad templates/saved drafts
- [ ] Budget optimization suggestions
- [ ] Performance forecasting
- [ ] Carousel ads support
- [ ] Video ads support
- [ ] Location-based targeting (cities, radius)
- [ ] Schedule ads for future dates
- [ ] Duplicate existing ads
- [ ] Ad preview in multiple placements

---

## 📝 API Reference

### **Facebook Marketing API v23.0 Endpoints Used**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/me/accounts` | GET | Fetch user's Facebook Pages |
| `/{ad_account_id}/campaigns` | POST | Create campaign |
| `/{ad_account_id}/adsets` | POST | Create ad set |
| `/{ad_account_id}/adimages` | POST | Upload image |
| `/{ad_account_id}/adcreatives` | POST | Create creative |
| `/{ad_account_id}/ads` | POST | Create ad |
| `/{campaign_id}` | DELETE | Delete campaign (rollback) |
| `/{adset_id}` | DELETE | Delete ad set (rollback) |

### **Convex Actions**

| Action | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `fetchFacebookPages` | - | `Array<Page>` | Get user's Facebook Pages |
| `createCampaign` | Campaign data | `{id: string}` | Create campaign |
| `createAdSet` | Ad set data | `{id: string}` | Create ad set |
| `uploadAdImage` | Image data | `{hash: string}` | Upload image |
| `createAdCreative` | Creative data | `{id: string}` | Create creative |
| `createAd` | Ad data | `{id: string}` | Create ad |
| `createCompleteAd` | Full ad data | `{success, ids}` | Create complete ad (orchestration) |

---

## ✅ Implementation Checklist

- [x] Database schema with `created_ads` table
- [x] Backend actions for Facebook API calls
- [x] Orchestration action with error rollback
- [x] Multi-step wizard component
- [x] Campaign form with objectives
- [x] Ad set form with targeting
- [x] Creative form with image upload
- [x] Review step with summary
- [x] Main page with validation
- [x] Navigation from ads list page
- [x] Error handling and logging
- [x] Success redirection
- [x] Documentation

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Review Convex logs for backend errors
3. Check `facebook_action_logs` table for API errors
4. Verify Facebook Business Manager setup
5. Ensure correct permissions granted

---

**Last Updated:** October 1, 2025  
**API Version:** Facebook Marketing API v23.0  
**Framework:** Next.js 14+ with Convex Backend

