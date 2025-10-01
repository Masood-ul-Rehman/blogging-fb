# Ad Creation Feature - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

1. **Facebook Requirements:**
   - Facebook Business Manager account
   - At least one Ad Account
   - At least one Facebook Page (required for ads)
   - App configured with required permissions:
     - `ads_read`
     - `ads_management`
     - `business_management`
     - `pages_show_list`

2. **Environment Setup:**
   - Convex backend running
   - Facebook App ID configured
   - OAuth redirect URI configured

### First-Time Setup

1. **Start Development Servers:**
   ```bash
   # Terminal 1 - Start Convex
   npx convex dev
   
   # Terminal 2 - Start Next.js
   npm run dev
   ```

2. **Connect Facebook Account:**
   - Navigate to `http://localhost:3000/ads/list`
   - Click "Connect Facebook" button
   - Authorize required permissions
   - Wait for redirect back to app

3. **Verify Connection:**
   - You should see your ad accounts listed
   - Token status should show "Active"
   - If no pages found, create one at facebook.com/pages/create

---

## 📝 Creating Your First Ad

### Step 1: Navigate to Ad Creation

**Option A: From Ads List Page**
- Go to `/ads/list`
- Click the "Create Ad" button (top right or on ad account card)

**Option B: Direct URL**
- Go to `/ads/create`

### Step 2: Select Ad Account

- Choose which ad account to use
- Currency and settings come from selected account

### Step 3: Campaign Configuration

**Fill in:**
- **Campaign Name:** e.g., "Summer Sale 2025"
- **Objective:** Choose based on your goal
  - Traffic → Drive website visits
  - Engagement → Get likes/comments/shares
  - Leads → Collect contact info
  - Awareness → Reach more people
  - Sales → Drive purchases
  - App Promotion → Get app installs
- **Budget Type:**
  - Daily → Spend up to X per day (recommended)
  - Lifetime → Total budget for campaign duration

**Click "Next"**

### Step 4: Ad Set Setup

**Basic Info:**
- **Ad Set Name:** e.g., "Age 25-45 USA"
- **Budget:** Minimum $1.00
  - Daily budget: Runs continuously
  - Lifetime budget: Also set start/end dates

**Optimization:**
- **Optimization Goal:** What Facebook optimizes for
  - Link Clicks → Most clicks
  - Impressions → Most views
  - Reach → Unique people
  - Landing Page Views → Page loads
  - Post Engagement → Interactions
  - Conversions → Actions on your site
- **Billing Event:** What you pay for
  - Impressions (CPM) → Per 1000 views
  - Link Clicks (CPC) → Per click

**Targeting:**
- **Age Range:** 18 to 65+ (use slider)
- **Gender:** All, Male, Female, or both
- **Countries:** Select one or more
  - US, UK, Canada, Australia, Germany, France, India, Brazil

**Click "Next"**

### Step 5: Creative

**Page & Image:**
- **Facebook Page:** Select the page to publish from
- **Image Upload:** Choose method
  - **File Upload:** Drag & drop or click to select
    - Max 30MB
    - JPG, PNG, or GIF
    - Preview shown immediately
  - **Image URL:** Paste publicly accessible URL
    - Preview loads automatically

**Ad Copy:**
- **Primary Text:** (Required, max 500 chars)
  - Main message shown above image
  - Example: "🔥 Summer Sale! Get 50% off all products. Limited time only!"
  
- **Headline:** (Required, max 40 chars)
  - Bold text below image
  - Example: "Summer Sale - 50% Off"
  
- **Description:** (Optional, max 125 chars)
  - Additional details
  - Example: "Shop now and save big on summer essentials"
  
- **Destination URL:** (Required)
  - Where people go when clicking ad
  - Must be valid URL with https://
  - Example: "https://example.com/summer-sale"
  
- **Call to Action:** Button text
  - Learn More (default)
  - Shop Now
  - Sign Up
  - Download
  - Book Now
  - Contact Us
  - Get Quote
  - Apply Now
  - Subscribe

**Click "Next"**

### Step 6: Review & Publish

**Review all details:**
- Campaign summary
- Budget and schedule
- Targeting settings
- Creative preview

**Set Status:**
- **Toggle OFF (Paused):** Create ad but don't run yet ✅ Recommended for testing
- **Toggle ON (Active):** Start running immediately ⚠️ Will incur charges

**Click "Create Ad"**

**What Happens:**
- Ad created on Facebook
- Saved to your database
- Logged in action history
- Redirected to Performance page

---

## 🧪 Testing Recommendations

### Safe Testing Approach

1. **Use Test Ad Account:**
   - Create a test ad account in Facebook Business Manager
   - Set low daily budget ($1.00)

2. **Create PAUSED Ads First:**
   - Always toggle status to PAUSED during testing
   - Review in Facebook Ads Manager before activating
   - This prevents unexpected charges

3. **Verify in Facebook:**
   - Go to https://business.facebook.com/adsmanager
   - Find your ad account
   - Verify campaign, ad set, and ad created
   - Check all settings are correct

4. **Check Database:**
   - Open Convex dashboard
   - Go to `created_ads` table
   - Verify entry exists with correct data
   - Check `facebook_action_logs` for creation record

5. **Test Error Handling:**
   - Try creating ad without required fields
   - Try with budget below $1.00
   - Try with invalid URL
   - Verify error messages shown

### Example Test Ad

```
Campaign:
- Name: "Test Ad - Do Not Activate"
- Objective: OUTCOME_TRAFFIC
- Budget Type: Daily

Ad Set:
- Name: "Test Ad Set"
- Budget: $1.00
- Age: 25-45
- Gender: All
- Countries: United States

Creative:
- Page: [Your Facebook Page]
- Image: [Any test image]
- Primary Text: "This is a test ad. Please ignore."
- Headline: "Test Advertisement"
- Link: "https://example.com"
- CTA: Learn More

Status: PAUSED ✅
```

---

## 🐛 Common Issues & Solutions

### Issue: "No active Facebook connection"
**Solution:**
1. Go to `/ads/list`
2. Click "Connect Facebook"
3. Complete OAuth flow
4. Verify connection shows as active

### Issue: "Failed to load Facebook pages"
**Solution:**
1. Create a Facebook Page at facebook.com/pages/create
2. Ensure you're an admin of at least one page
3. Reconnect Facebook account
4. Check `pages_show_list` permission granted

### Issue: "Budget must be at least $1.00"
**Solution:**
- Enter minimum $1.00 in budget field
- Facebook requires minimum daily/lifetime budget

### Issue: "Image upload failed"
**Solution:**
- Check file size (max 30MB)
- Use JPG, PNG, or GIF format
- For URL: ensure publicly accessible
- Try different image

### Issue: "Please enter a valid URL"
**Solution:**
- URL must start with `https://` or `http://`
- Example: `https://example.com` ✅
- Example: `example.com` ❌

### Issue: TypeScript errors in IDE
**Solution:**
- Convex needs to regenerate types
- Ensure Convex dev server is running: `npx convex dev`
- Restart your IDE/TypeScript server
- Types will auto-generate

### Issue: Ad creation succeeds but not in Facebook
**Solution:**
1. Check browser console for errors
2. Open Convex dashboard → Logs
3. Look for Facebook API errors
4. Check `facebook_action_logs` table
5. Verify permissions in Facebook Business Manager

---

## 📊 Monitoring & Analytics

### View Created Ads

**In Application:**
1. Go to `/ads/performance`
2. Select ad account
3. See performance metrics

**In Facebook:**
1. Go to https://business.facebook.com/adsmanager
2. Navigate to your ad account
3. Find campaigns created through app
4. View detailed analytics

### Check Logs

**Action Logs:**
```typescript
// In Convex dashboard
// Table: facebook_action_logs
// Filter by: actorClerkId = [your user ID]
// Actions include:
// - create_campaign
// - create_adset
// - create_creative
// - create_ad
```

**Created Ads:**
```typescript
// In Convex dashboard
// Table: created_ads
// Filter by: clerkUserId = [your user ID]
// Shows all ads created through platform
```

---

## 🔄 Next Steps

After creating your first ad:

1. **Activate the Ad:**
   - Go to Facebook Ads Manager
   - Find your paused ad
   - Review all settings
   - Click "Publish" when ready

2. **Monitor Performance:**
   - Check `/ads/performance` page
   - View impressions, clicks, spend
   - Analyze campaign effectiveness

3. **Iterate:**
   - Create variations with different targeting
   - Test different creatives
   - Optimize based on performance data

4. **Scale:**
   - Increase budget on winning ads
   - Pause underperforming ads
   - Create similar campaigns

---

## 📞 Need Help?

### Resources:
- **Facebook Marketing API Docs:** https://developers.facebook.com/docs/marketing-apis
- **Facebook Ads Manager:** https://business.facebook.com/adsmanager
- **Convex Dashboard:** https://dashboard.convex.dev

### Debugging Steps:
1. Check browser console
2. Check Convex logs
3. Check Facebook Business Manager
4. Verify permissions
5. Review action logs table

### Support Checklist:
- [ ] Facebook account connected
- [ ] At least one ad account accessible
- [ ] At least one Facebook Page exists
- [ ] All required permissions granted
- [ ] Budget meets minimum ($1.00)
- [ ] Valid image uploaded
- [ ] All required fields filled
- [ ] Valid destination URL provided

---

**Happy Ad Creating! 🚀**

Start with small test budgets, create paused ads first, and always verify in Facebook Ads Manager before activating.

