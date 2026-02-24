# Rebranding Complete: Mumu

**Status:** All code changes complete ✅
**Date:** February 22, 2026

---

## What Was Changed Automatically

All brand references have been updated to "Mumu" in the following files:

### Core Application Files (33 files updated)
- ✅ `package.json` - npm package name: `mumu`
- ✅ `package-lock.json` - all package references updated
- ✅ `README.md` - project title and description
- ✅ `app/layout.tsx` - site title: "Mumu - Mystery Box Shopping"
- ✅ All page components (box, checkout, admin, auth, legal pages)
- ✅ All API routes (checkout, topup, etc.)
- ✅ All UI components (Footer, Navbar, HowItWorks)
- ✅ All library files (analytics, email, events)
- ✅ All documentation files (CLAUDE.md, deployment guides, etc.)

### Database Files
- ✅ `supabase/schema-v2.sql` - all comments and references
- ✅ `supabase/seed-v2.sql` - all comments and references
- ✅ `supabase/seed.sql` - all references
- ✅ `supabase/005_withdrawal_requests.sql` - all references

### Preserved References
- ✅ **"Pompompurin"** - Correctly preserved (this is a Sanrio character name)

---

## What You Need to Do Manually

### 1. Supabase Project

**Update Existing Project:**

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `tymnlkwwkwbmollyecxv`
3. Update project name:
   - Go to Settings → General
   - Change project name to "Mumu"
4. No database changes needed - schema/seed files are already updated

### 2. Vercel Project

**Steps to rename in Vercel:**

1. Go to https://vercel.com/dashboard
2. Find your project
3. Go to Settings → General
4. Under "Project Name":
   - Change to "mumu"
   - Or create a new deployment from the updated codebase
5. Redeploy:
   - Go to Deployments
   - Click "Redeploy" on the latest deployment

### 3. Domain/URLs (If applicable)

If you have a custom domain:
- New: `mumu.shop` or `mumu.vercel.app`

**Actions needed:**
1. Register new domain `mumu.shop` (if desired)
2. Update Vercel project domains
3. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables
4. Update Stripe webhook URLs (if using Stripe webhooks)

### 4. Third-Party Services

**Stripe:**
- No changes needed (product names in Stripe are dynamic from your code)
- If you have webhooks configured, update the endpoint URL if your domain changes

**Email (Resend):**
- Update sender domain to `mumu.shop` (if applicable)
- Current references in code now show `mumu` branding

**Analytics (PostHog):**
- No changes needed - will automatically track new name

---

## Verification Checklist

Run these checks to ensure everything is working:

### Local Development
- [ ] Run `npm install` to ensure package.json changes are applied
- [ ] Run `npm run dev` and verify site loads
- [ ] Check browser tab title shows "Mumu - Mystery Box Shopping"
- [ ] Check all visible text on pages
- [ ] Check email templates in `lib/email/` render with "Mumu"

### Database
- [ ] Run a test query to verify database is accessible
- [ ] Check that product names in database are correct
- [ ] Verify "Pompompurin" character name is still intact

### Deployment
- [ ] Push changes to GitHub
- [ ] Trigger Vercel deployment
- [ ] Verify production site shows "Mumu" everywhere
- [ ] Test a full purchase flow (if applicable)

---

## Files Changed Summary

**Total files modified:** 33 source files + package-lock.json

### Documentation (10 files)
- CHANGELOG.md
- CHAT_MODERATION.md
- CLAUDE.md
- DEPLOYMENT_GUIDE.md
- DEPLOYMENT_README.md
- POST_DEPLOYMENT_MONITORING.md
- PRE_DEPLOYMENT_CHECKLIST.md
- README.md
- SHAKE_FEATURE_MASTER_PLAN.md
- TIERED_BOXES_PLAN.md

### Application Code (17 files)
- app/admin/page.tsx
- app/admin/products/page.tsx
- app/api/checkout/route.ts
- app/api/topup/create-session/route.ts
- app/auth/signup/page.tsx
- app/box/page.tsx
- app/checkout/page.tsx
- app/layout.tsx
- app/legal/odds/page.tsx
- app/legal/privacy/page.tsx
- app/legal/terms/page.tsx
- app/order/success/page.tsx
- components/Footer.tsx
- components/HowItWorks.tsx
- components/Navbar.tsx
- lib/analytics.ts
- lib/email/index.ts
- lib/events/balance.ts

### Configuration (2 files)
- package.json
- package-lock.json

### Database (4 files)
- supabase/005_withdrawal_requests.sql
- supabase/schema-v2.sql
- supabase/seed-v2.sql
- supabase/seed.sql

---

## Email Addresses to Update

Update these externally if configured:
- ✅ `support@mumu.shop` (update in your email provider)

---

## Next Steps

1. ✅ Code changes complete
2. ⏳ Update Supabase project name
3. ⏳ Update Vercel project name
4. ⏳ Test deployment
5. ⏳ Update any external services (domains, emails, etc.)

---

## Support

If you encounter any issues:

1. Check that all environment variables are correct
2. Verify Supabase credentials are still valid
3. Clear browser cache and cookies
4. Rebuild: `rm -rf .next && npm run dev`

All code-level changes are complete.
