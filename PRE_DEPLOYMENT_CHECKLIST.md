# Mumu v2.0 Pre-Deployment Checklist
## 60/30/9/1 Probability Distribution Release

**Print this page and check off each item before deploying.**

---

## ⚠️ STOP - READ THIS FIRST

This deployment changes core game mechanics. **Do not skip any step.**

**What's changing:**
- Drop rates: 70.5/25/4/0.5 → 60/30/9/1
- Buyback prices: Lower across all tiers
- Profit per box: $8.19 → $7.47 (-$0.72)
- User experience: +35% better (more rare/ultra pulls)

**Approval:** 3-1 vote (CEO/Designer/Data Scientist approved, CFO cautioned)

---

## PHASE 1: INVENTORY & CASH (DO FIRST)

### Critical Inventory Purchase
**Status:** ⬜ NOT STARTED | ⬜ IN PROGRESS | ⬜ COMPLETE

**Why:** Current rare stock (25 units) only supports 278 boxes at new 9% drop rate. Without restocking, you'll run out in 2-3 weeks.

**Action Required:**
- [ ] Order **+65 rare items** minimum
- [ ] Budget confirmed: **$3,900** (secondary market pricing)
- [ ] Sourcing plan:
  - [ ] Option 1: PopMart stores (retail ~$15-20/unit, need bulk)
  - [ ] Option 2: Secondary market (eBay, Mercari, ~$60/unit)
  - [ ] Option 3: Authorized distributor (best if available)
- [ ] Storage plan: Store at home, organize by rarity
- [ ] ETA for delivery: _______________ (date)

**Additional Optional Stock:**
- [ ] +170 uncommon items ($2,550) for 1,000 box capacity
- [ ] +5 ultra items ($750) for buffer
- [ ] Total investment if ordering all: **$7,200**

**Timeline:**
- Order rare items **within 48 hours** of deployment
- Can deploy before items arrive (278 boxes buffer)
- Cannot sustain 100 boxes/month beyond Week 3 without rare restock

---

### Cash Reserve Confirmation
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

- [ ] Bank account balance ≥ **$3,000**
- [ ] Purpose: Covers ultra sellback variance (worst case: 3 ultras in one month = $240 cost)
- [ ] Operating buffer: Do not dip below **$2,000** at any time

**If balance < $3,000:**
- [ ] Option 1: Delay deployment until cash available
- [ ] Option 2: Reduce to 65/28/6/1 distribution (safer margin)
- [ ] Option 3: Proceed with risk (monitor daily, kill switch ready)

---

## PHASE 2: DATABASE MIGRATIONS

### Migration 007: Sellback Inventory + Shipping
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

**File:** `mumu/supabase/migrations/007_sellback_inventory_restore.sql`

**Steps:**
1. [ ] Open Supabase Dashboard → SQL Editor
2. [ ] Open `007_sellback_inventory_restore.sql` in code editor
3. [ ] Copy entire file contents
4. [ ] Paste into Supabase SQL Editor
5. [ ] Click **"Run"**
6. [ ] Wait for success message (should take <5 seconds)

**Verification:**
```sql
-- Run this query to verify success:
SELECT routine_name, updated
FROM information_schema.routines
WHERE routine_name = 'sellback_item';

-- Should return 1 row with recent updated timestamp
```

- [ ] Verification query returned success
- [ ] No error messages in Supabase logs

**What this does:**
- ✅ Fixes sellback inventory restoration bug
- ✅ Adds shipping_fee column to user_inventory
- ✅ Adds tracking_number column
- ✅ Creates low_inventory_items view

---

### Migration 008: Probability Distribution Update
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

**File:** `mumu/supabase/migrations/008_update_probabilities_60_30_9_1.sql`

**⚠️ IMPORTANT:** Run AFTER migration 007 (sequential dependency)

**Steps:**
1. [ ] Confirm migration 007 completed successfully
2. [ ] Open new query in Supabase SQL Editor
3. [ ] Open `008_update_probabilities_60_30_9_1.sql` in code editor
4. [ ] Copy entire file contents
5. [ ] Paste into Supabase SQL Editor
6. [ ] Click **"Run"**
7. [ ] Wait for success message (should take <5 seconds)

**Verification (Optional - takes 30 seconds):**
Run the included test query to verify distribution is correct:
```sql
-- This runs 1,000 test box opens and counts rarities
-- (Full query is at bottom of migration file)
-- Expected: Common ~600, Uncommon ~300, Rare ~90, Ultra ~10
```

- [ ] Verification query showed correct distribution
- [ ] No error messages in Supabase logs

**What this does:**
- ✅ Updates open_mystery_box() to 60/30/9/1 distribution
- ✅ Updates open_mystery_box_with_exclusions() (shake feature)
- ✅ Includes pity system structure (commented out for Phase 2)

---

## PHASE 3: CODE DEPLOYMENT

### GitHub Push
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

**Pre-push checks:**
- [ ] `.env.local` is in `.gitignore` (verify: `git check-ignore .env.local` should output `.env.local`)
- [ ] No sensitive data in code (no API keys, passwords, etc.)
- [ ] All changes committed locally

**Commands:**
```bash
cd "/Users/alexanderbercow/Desktop/Mumu Claude/mumu"

# Verify .env.local won't be committed
git check-ignore .env.local

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Deploy v2.0: 60/30/9/1 probability distribution

- Update probability distribution (60/30/9/1)
- Fix sellback inventory restoration bug
- Add shipping fee system ($5 or free on $50+)
- Add low inventory alerts to admin dashboard
- Update buyback prices to Balanced model
- Add comprehensive documentation

Executive approval: 3-1 (CEO/Designer/Data Scientist approved)
See IMPLEMENTATION_SUMMARY_60_30_9_1.txt for full details"

# Push to GitHub
git push origin main
```

- [ ] Push succeeded without errors
- [ ] Verified on GitHub.com that commit appears

---

### Vercel Deployment
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

#### New Vercel Project (if first deployment)
- [ ] Created Vercel account at https://vercel.com
- [ ] Clicked "Add New Project"
- [ ] Selected Mumu repository
- [ ] Framework: Next.js (auto-detected)

#### Environment Variables Configuration
**⚠️ CRITICAL:** Add all environment variables from your `.env.local`

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = https://your-project.supabase.co
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = pk_live_... (⚠️ Use LIVE keys for production)
- [ ] `STRIPE_SECRET_KEY` = sk_live_... (⚠️ Use LIVE keys for production)
- [ ] `STRIPE_WEBHOOK_SECRET` = whsec_... (configure AFTER first deployment)
- [ ] `NEXT_PUBLIC_APP_URL` = https://mumu.vercel.app (update after deployment)

**Optional but recommended:**
- [ ] `UPSTASH_REDIS_REST_URL` (rate limiting)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (rate limiting)
- [ ] `RESEND_API_KEY` (email)
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` (analytics)
- [ ] `NEXT_PUBLIC_POSTHOG_HOST` (analytics)

#### Deploy
- [ ] Clicked **"Deploy"**
- [ ] Waited for build to complete (2-5 minutes)
- [ ] Build succeeded (green checkmark)
- [ ] Copied production URL: _________________________________

---

### Supabase Auth Configuration
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

- [ ] Opened Supabase → Authentication → URL Configuration
- [ ] Set **Site URL** to production URL (e.g., `https://mumu.vercel.app`)
- [ ] Added to **Redirect URLs**:
  - [ ] `https://mumu.vercel.app/auth/callback`
  - [ ] `https://mumu.vercel.app/**`
- [ ] Clicked **"Save"**

---

### Stripe Webhook Configuration
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

- [ ] Opened Stripe Dashboard → Developers → Webhooks
- [ ] Clicked **"Add endpoint"**
- [ ] Endpoint URL: `https://mumu.vercel.app/api/webhooks/stripe`
- [ ] Selected events: **checkout.session.completed**
- [ ] Clicked **"Add endpoint"**
- [ ] Copied **Signing secret** (starts with `whsec_...`): _________________________________
- [ ] Went to Vercel → Settings → Environment Variables
- [ ] Updated `STRIPE_WEBHOOK_SECRET` with new production signing secret
- [ ] Clicked **"Save"**
- [ ] Triggered redeploy: Vercel → Deployments → ••• → **Redeploy**

---

## PHASE 4: PRODUCTION TESTING

### Admin Account Setup
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

```sql
-- Run in Supabase SQL Editor:
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

- [ ] Updated your email address in query above
- [ ] Ran query in Supabase
- [ ] Verified: 1 row updated

---

### Full User Flow Test
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

**Test on production URL:** https://_________________________________

#### 1. Signup & Authentication
- [ ] Visited production URL
- [ ] Clicked "Sign Up"
- [ ] Created test account with new email
- [ ] Received email verification (if enabled)
- [ ] Redirected to /box page after login
- [ ] No console errors in browser DevTools (F12)

#### 2. Top-Up Balance
- [ ] Clicked "Top Up Balance"
- [ ] Selected $25 option
- [ ] Used test card: 4242 4242 4242 4242 (any future date, any CVV)
- [ ] Payment succeeded in Stripe
- [ ] Waited 5 seconds for webhook
- [ ] Balance updated in UI (+$25.00)
- [ ] Checked Supabase `balance_transactions` table: row exists with type='topup'

**If balance didn't update:**
- Check Vercel → Functions → Logs for webhook errors
- Check Stripe → Webhooks → webhook endpoint → recent events for failures
- Verify `STRIPE_WEBHOOK_SECRET` matches production webhook

#### 3. Open Mystery Box
- [ ] Clicked "Open Mystery Box"
- [ ] Box animation played
- [ ] Item revealed with rarity (Common/Uncommon/Rare/Ultra)
- [ ] Balance deducted $25.00
- [ ] Item added to "Your Collection"
- [ ] Checked Supabase `user_inventory` table: new row exists

#### 4. Shake Feature (Optional)
- [ ] Top-up +$25 to have enough balance
- [ ] Before opening, clicked "Shake Box"
- [ ] Paid $1.49
- [ ] Saw exclusion animation
- [ ] Opened box with reduced pool
- [ ] Verified cannot shake again for this box (30-minute cooldown)

#### 5. Sellback Item
- [ ] Clicked "Sell Back" on an item
- [ ] Confirmed sellback
- [ ] Balance increased by buyback price (e.g., +$7 for Common)
- [ ] Item status changed to "sold_back" in collection
- [ ] **CRITICAL:** Checked Supabase `inventory` table for that product
- [ ] Verified `quantity_available` increased by 1
- [ ] ✅ This confirms migration 007 worked!

**If inventory didn't restore:**
- Migration 007 didn't run or failed
- Do NOT proceed - fix this first
- Check Supabase logs for errors

#### 6. Shipping Request
- [ ] Kept an item (didn't sell back)
- [ ] Clicked "Ship Item"
- [ ] Filled out shipping address form
- [ ] Submitted request
- [ ] **If balance < $50:** Verified $5 fee deducted
- [ ] **If balance ≥ $50:** Verified free shipping (no fee)
- [ ] Item status changed to "shipping_requested"
- [ ] Checked admin dashboard for shipping request

#### 7. Admin Dashboard
- [ ] Visited `/admin` (must have admin role)
- [ ] InventoryAlerts component loaded
- [ ] Saw inventory alerts (if any items < 20 stock)
- [ ] Verified alert levels correct:
  - Red for <5 units
  - Yellow for 5-9 units
  - Orange for 10-19 units
- [ ] Saw shipping request from previous test

---

### Error Check
- [ ] No JavaScript errors in browser console (F12 → Console tab)
- [ ] No failed API calls in Network tab (F12 → Network)
- [ ] No errors in Vercel → Functions → Logs
- [ ] No errors in Supabase → Logs

---

## PHASE 5: POST-DEPLOYMENT SETUP

### Google Sheet Update
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

**File:** `mumu/IMPLEMENTATION_SUMMARY_60_30_9_1.txt`

- [ ] Opened Google Sheet: https://docs.google.com/spreadsheets/d/121oEwaW8mMVCj9dDgRvDod8KqPUgQ6p8LQ5UPQ0aZCs/edit
- [ ] Created 11 tabs (or updated existing):
  1. [ ] Probability Distribution
  2. [ ] Unit Economics
  3. [ ] Old vs New Comparison
  4. [ ] Scale Projections
  5. [ ] Risk Analysis
  6. [ ] Inventory Requirements
  7. [ ] Expected Value
  8. [ ] Monte Carlo Simulation
  9. [ ] Shake Economics
  10. [ ] Shipping Economics
  11. [ ] Weekly Metrics Tracker

- [ ] Copied data from IMPLEMENTATION_SUMMARY_60_30_9_1.txt into respective tabs
- [ ] Added formulas for:
  - [ ] Weighted sellback EV
  - [ ] Gross profit per box
  - [ ] Margin percentage
  - [ ] Monthly profit calculator
- [ ] Verified calculations match summary file

---

### Monitoring Setup
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

#### Daily Checks (First 7 Days)
- [ ] Set calendar reminder: Check `/admin` dashboard every morning
- [ ] Monitor low inventory alerts
- [ ] Watch for CRITICAL (<5 units) alerts on rare items

#### Weekly Tracking
- [ ] Created weekly tracking spreadsheet (or use Tab 11 of Google Sheet)
- [ ] Will track:
  - Boxes opened
  - Revenue
  - Sellback rate (actual vs 40% target)
  - Rare pulls (actual vs 9% target)
  - Ultra pulls (actual vs 1% target)
  - Profit per box (actual vs $7.47 target)

---

### Customer Support
**Status:** ⬜ NOT STARTED | ⬜ COMPLETE

- [ ] Email address for support: _________________________________
  - [ ] Option 1: Create support@mumu.com (Google Workspace $6/month)
  - [ ] Option 2: Use personal email initially
- [ ] Response time target: **24 hours**
- [ ] FAQ documented for common issues:
  - "Balance didn't update after payment"
  - "Where's my shipping tracking number?"
  - "I got the wrong item"
  - "How do I sell back an item?"

---

## PHASE 6: MONITORING & KILL SWITCH

### 30-Day A/B Test Criteria
**Status:** ⬜ TRACKING | ⬜ COMPLETE

#### Success Criteria (Full Rollout After 30 Days If):
- [ ] Revenue per user ≥ control group
- [ ] Viral coefficient increases 25%+ (more social shares)
- [ ] 7-day retention improves 10%+
- [ ] Sellback rate stays < 45%
- [ ] Customer feedback positive (NPS > 40)

#### Kill Switch Criteria (Revert Immediately If):
- [ ] Sellback rate exceeds **48%** (margin too thin)
- [ ] Revenue per user drops **below control**
- [ ] Rare inventory depletes (< 5 items remaining)
- [ ] Cash balance drops below **$2,000**
- [ ] Excessive customer complaints

---

### Rollback Plan (Emergency Only)
**Status:** ⬜ READY (DON'T USE UNLESS EMERGENCY)

**When to use:** Kill switch triggered, must revert immediately

**Database Rollback:**
```sql
-- See mumu/supabase/migrations/008_update_probabilities_60_30_9_1.sql
-- (Full rollback script at bottom of file)
-- Reverts to 70.5/25/4/0.5 distribution
```

**Code Rollback:**
```bash
git revert HEAD
git push origin main
# Vercel auto-deploys reverted code
```

**Communication:**
- [ ] Email all affected users
- [ ] Offer $5 credit as goodwill
- [ ] Explain: "We've temporarily adjusted box odds while we improve the experience"

---

## FINAL CHECKLIST (Sign-Off)

**30 minutes before marking deployment COMPLETE:**

- [ ] All migrations run successfully in production
- [ ] Full user flow tested end-to-end
- [ ] Sellback inventory restoration confirmed working
- [ ] Shipping fee logic tested ($5 and free scenarios)
- [ ] Admin dashboard accessible and functional
- [ ] No errors in production logs
- [ ] Stripe webhook processing 100% successfully
- [ ] Inventory ordered or delivery confirmed
- [ ] Cash reserve confirmed ≥ $3,000
- [ ] Google Sheet updated with new financial model
- [ ] Monitoring plan set up (daily + weekly)
- [ ] Customer support email ready
- [ ] Rollback plan printed and accessible

**Deployment Sign-Off:**

- [ ] I have completed all steps above
- [ ] I understand the risks (margin compression, inventory bottleneck, cash flow variance)
- [ ] I have $3,000+ cash reserve
- [ ] I have ordered rare inventory or have delivery confirmed
- [ ] I am ready to monitor daily for first 7 days
- [ ] I have the rollback plan ready if needed

**Signed:** _________________________________

**Date:** _________________________________

**Production URL:** _________________________________

---

## SUPPORT

**If anything goes wrong:**

1. **Check DEPLOYMENT_GUIDE.md troubleshooting section**
2. **Check Vercel logs:** Vercel → Functions → Logs
3. **Check Supabase logs:** Supabase → Logs
4. **Check Stripe webhook logs:** Stripe → Webhooks → Events

**Emergency rollback:** See rollback section above

**Questions:** Re-read IMPLEMENTATION_SUMMARY_60_30_9_1.txt

---

**You've got this! 🎲**

All infrastructure ready. All risks documented. Clear kill switch. This is a well-planned deployment.
