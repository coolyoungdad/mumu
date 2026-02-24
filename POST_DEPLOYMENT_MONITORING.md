# Post-Deployment Monitoring Plan
## Mumu v2.0 (60/30/9/1 Distribution)

**Purpose:** Track actual performance vs projections, identify issues early, make go/no-go decision after 30 days.

---

## DAILY CHECKLIST (First 7 Days)

### Morning Routine (10 minutes)

1. **Check Admin Dashboard**
   - Visit: `https://your-production-url.vercel.app/admin`
   - Review InventoryAlerts component
   - **Action if CRITICAL alert (<5 units):** Order inventory immediately
   - **Action if WARNING alert (5-9 units):** Order within 3 days

2. **Check Vercel Logs**
   - Visit: Vercel → Functions → Logs
   - Look for red error messages
   - **Action if errors:** Investigate immediately, may need rollback

3. **Check Stripe Webhook Health**
   - Visit: Stripe → Webhooks → your production endpoint
   - Verify "Success rate" is 100%
   - **Action if < 100%:** Check webhook secret matches Vercel env variable

4. **Quick Financial Check**
   - Note yesterday's:
     - Boxes opened: _____
     - Revenue: $_____
     - Approximate sellback rate: _____%
   - Add to tracking spreadsheet

---

## WEEKLY TRACKING (Every Monday)

### Data Collection

**From Supabase (run these queries in SQL Editor):**

```sql
-- Total boxes opened this week
SELECT COUNT(*) as boxes_opened
FROM balance_transactions
WHERE type = 'box_purchase'
  AND created_at >= NOW() - INTERVAL '7 days';

-- Total revenue this week (topups)
SELECT SUM(amount) as total_revenue
FROM balance_transactions
WHERE type = 'topup'
  AND created_at >= NOW() - INTERVAL '7 days';

-- Sellback count this week
SELECT COUNT(*) as sellbacks,
       SUM(amount) as total_sellback_cost
FROM balance_transactions
WHERE type = 'sellback'
  AND created_at >= NOW() - INTERVAL '7 days';

-- Rarity distribution this week
SELECT
  ui.rarity,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM user_inventory ui
WHERE ui.created_at >= NOW() - INTERVAL '7 days'
GROUP BY ui.rarity
ORDER BY
  CASE ui.rarity
    WHEN 'ultra' THEN 1
    WHEN 'rare' THEN 2
    WHEN 'uncommon' THEN 3
    WHEN 'common' THEN 4
  END;

-- Actual profit this week
SELECT
  COUNT(CASE WHEN type = 'box_purchase' THEN 1 END) as boxes,
  SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END) as revenue,
  SUM(CASE WHEN type = 'sellback' THEN -amount ELSE 0 END) as sellback_cost,
  (SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END) -
   SUM(CASE WHEN type = 'sellback' THEN -amount ELSE 0 END) -
   (COUNT(CASE WHEN type = 'box_purchase' THEN 1 END) * 12.00)) as gross_profit
FROM balance_transactions
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Inventory status
SELECT
  rarity,
  COUNT(*) as products,
  SUM(quantity_available) as total_stock,
  MIN(quantity_available) as lowest_stock
FROM products p
JOIN inventory i ON p.id = i.product_id
GROUP BY rarity
ORDER BY
  CASE rarity
    WHEN 'ultra' THEN 1
    WHEN 'rare' THEN 2
    WHEN 'uncommon' THEN 3
    WHEN 'common' THEN 4
  END;

-- Shake adoption rate
SELECT
  COUNT(*) as total_boxes,
  COUNT(CASE WHEN description LIKE '%Shake%' THEN 1 END) as shakes,
  ROUND(COUNT(CASE WHEN description LIKE '%Shake%' THEN 1 END) * 100.0 / COUNT(*), 1) as shake_adoption_pct
FROM balance_transactions
WHERE type = 'box_purchase'
  AND created_at >= NOW() - INTERVAL '7 days';

-- Shipping requests
SELECT COUNT(*) as shipping_requests
FROM user_inventory
WHERE status = 'shipping_requested'
  AND created_at >= NOW() - INTERVAL '7 days';
```

---

### Weekly Metrics Spreadsheet

**Update your Google Sheet Tab 11 (Weekly Metrics) with:**

| Week | Boxes | Revenue | Sellback Cost | Gross Profit | Profit/Box | Margin | Common% | Uncommon% | Rare% | Ultra% | Shake Adoption | Shipping Requests |
|------|-------|---------|---------------|--------------|------------|--------|---------|-----------|-------|--------|----------------|-------------------|
| 1 | ___ | $___ | $___ | $___ | $___ | ___% | ___% | ___% | ___% | ___% | ___% | ___ |
| 2 | ___ | $___ | $___ | $___ | $___ | ___% | ___% | ___% | ___% | ___% | ___% | ___ |
| 3 | ___ | $___ | $___ | $___ | $___ | ___% | ___% | ___% | ___% | ___% | ___% | ___ |
| 4 | ___ | $___ | $___ | $___ | $___ | ___% | ___% | ___% | ___% | ___% | ___% | ___ |

**Target Benchmarks:**
- Profit/Box: **$7.47**
- Margin: **27.7%**
- Common%: **60%**
- Uncommon%: **30%**
- Rare%: **9%**
- Ultra%: **1%**
- Shake Adoption: **30%**
- Shipping Requests: **30% of items kept**

---

### Weekly Analysis

**Answer these questions every Monday:**

1. **Are we on track financially?**
   - Actual profit/box: $_____ (target: $7.47)
   - **If < $6.50:** Investigate sellback rate, may need intervention
   - **If > $8.50:** Users keeping more items than expected (good!)

2. **Is the probability distribution working correctly?**
   - Common: ____% (target: 60% ± 5%)
   - Uncommon: ____% (target: 30% ± 5%)
   - Rare: ____% (target: 9% ± 3%)
   - Ultra: ____% (target: 1% ± 1%)
   - **If off by >10% consistently:** Database function may have issue

3. **What's the sellback rate by rarity?**
   ```sql
   -- Run this query:
   SELECT
     ui.rarity,
     COUNT(*) as total_items,
     COUNT(CASE WHEN ui.status = 'sold' THEN 1 END) as sold_back,
     ROUND(COUNT(CASE WHEN ui.status = 'sold' THEN 1 END) * 100.0 / COUNT(*), 1) as sellback_pct
   FROM user_inventory ui
   WHERE ui.created_at >= NOW() - INTERVAL '7 days'
   GROUP BY ui.rarity;
   ```
   - Common sellback rate: ____% (expected: 60-80%)
   - Uncommon sellback rate: ____% (expected: 40-60%)
   - Rare sellback rate: ____% (expected: 20-40%)
   - Ultra sellback rate: ____% (expected: 10-30%)
   - **If ultra sellback > 50%:** Users may not value ultras, check product selection

4. **Inventory status - any concerns?**
   - Rare items remaining: _____ (restock if < 15)
   - Ultra items remaining: _____ (restock if < 3)
   - Days until rare depletion: _____ (current stock / weekly rare pulls)
   - **If < 14 days until depletion:** Order immediately

5. **Customer feedback trends?**
   - Support tickets this week: _____
   - Common complaints: _____________________________
   - Positive feedback: _____________________________
   - **If excessive "rigged" complaints:** May indicate perception issue

---

## KILL SWITCH MONITORING

### Check These Thresholds WEEKLY

**🔴 STOP IMMEDIATELY AND ROLLBACK IF:**

| Metric | Kill Threshold | Current Value | Status |
|--------|----------------|---------------|--------|
| Sellback rate (blended) | > 48% | ____% | ⬜ OK / ⬜ KILL |
| Revenue per user | < Control group | $____ | ⬜ OK / ⬜ KILL |
| Rare inventory | < 5 items | ____ items | ⬜ OK / ⬜ KILL |
| Cash balance | < $2,000 | $____ | ⬜ OK / ⬜ KILL |
| Profit per box | < $5.00 | $____ | ⬜ OK / ⬜ KILL |

**If ANY threshold triggered:**
1. Stop accepting new box opens (disable "Open Box" button temporarily)
2. Run rollback procedure (see DEPLOYMENT_GUIDE.md)
3. Communicate to users via email
4. Analyze root cause before re-deploying

---

### Blended Sellback Rate Calculation

```sql
-- Calculate weighted sellback rate
WITH sellback_stats AS (
  SELECT
    ui.rarity,
    COUNT(*) as total,
    COUNT(CASE WHEN ui.status = 'sold' THEN 1 END) as sold,
    CASE ui.rarity
      WHEN 'common' THEN 0.60
      WHEN 'uncommon' THEN 0.30
      WHEN 'rare' THEN 0.09
      WHEN 'ultra' THEN 0.01
    END as probability
  FROM user_inventory ui
  WHERE ui.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY ui.rarity
)
SELECT
  SUM(
    (sold::DECIMAL / NULLIF(total, 0)) * probability
  ) / SUM(probability) * 100 as blended_sellback_pct
FROM sellback_stats;
```

**Target:** < 45%
**Warning:** > 45%
**Kill:** > 48%

---

## 30-DAY GO/NO-GO DECISION

### Success Criteria (Full Rollout)

**Evaluate these metrics on Day 30:**

| Metric | Target | Actual | Met? |
|--------|--------|--------|------|
| Revenue per user | ≥ Control | $____ | ⬜ Yes / ⬜ No |
| Viral coefficient | +25% vs control | +____% | ⬜ Yes / ⬜ No |
| 7-day retention | +10% vs control | +____% | ⬜ Yes / ⬜ No |
| Sellback rate | < 45% | ____% | ⬜ Yes / ⬜ No |
| Customer satisfaction | NPS > 40 | NPS ____ | ⬜ Yes / ⬜ No |

**Decision Matrix:**

| Criteria Met | Decision |
|--------------|----------|
| 5/5 | ✅ **FULL ROLLOUT** - Keep 60/30/9/1, scale up |
| 4/5 | ✅ **CONTINUE** - Extend test 30 days, monitor closely |
| 3/5 | ⚠️ **ITERATE** - Adjust to 65/28/6/1 (compromise) |
| ≤2/5 | ❌ **REVERT** - Rollback to 70.5/25/4/0.5 |

---

### Viral Coefficient Tracking

**Manual tracking (no automated analytics yet):**

1. **Social Media Mentions**
   - Search Twitter for "mumu mystery box" weekly
   - Count unique mentions: _____
   - Track sentiment (positive/neutral/negative)
   - Note any viral posts (>1,000 likes)

2. **Referral Source**
   - Ask new users in welcome email: "How did you hear about us?"
   - Options: Friend, TikTok, Instagram, Twitter, Other
   - Calculate: Friend referrals / Total signups = _____%

3. **UGC (User Generated Content)**
   - Count unboxing videos posted: _____
   - Count rare/ultra pull posts: _____
   - Compare to previous 30 days: +____% increase

**Viral Coefficient Formula:**
```
Viral Coefficient = (New users from referrals) / (Existing users who invited)

Target: 0.5+ (each user brings 0.5 new users = exponential growth)
Excellent: 1.0+ (each user brings 1+ new user = rapid growth)
```

---

### Retention Rate Calculation

```sql
-- 7-day retention
WITH cohort AS (
  SELECT
    DATE_TRUNC('week', created_at) as signup_week,
    user_id
  FROM users
  WHERE created_at >= NOW() - INTERVAL '60 days'
),
activity AS (
  SELECT DISTINCT
    user_id,
    DATE_TRUNC('week', created_at) as activity_week
  FROM user_inventory
)
SELECT
  c.signup_week,
  COUNT(DISTINCT c.user_id) as signups,
  COUNT(DISTINCT CASE
    WHEN a.activity_week = c.signup_week + INTERVAL '1 week' THEN c.user_id
  END) as retained_week_1,
  ROUND(
    COUNT(DISTINCT CASE
      WHEN a.activity_week = c.signup_week + INTERVAL '1 week' THEN c.user_id
    END) * 100.0 / COUNT(DISTINCT c.user_id),
    1
  ) as retention_pct
FROM cohort c
LEFT JOIN activity a ON c.user_id = a.user_id
GROUP BY c.signup_week
ORDER BY c.signup_week DESC
LIMIT 8;
```

**Benchmark:**
- Good: 30-40% week-1 retention
- Excellent: 50%+ week-1 retention
- Industry avg (gacha): 25-35%

---

## CUSTOMER SUPPORT TRACKING

### Support Ticket Template

**Track all customer issues in a simple spreadsheet:**

| Date | Issue Type | Description | Resolution | Time to Resolve |
|------|-----------|-------------|------------|-----------------|
| 2/18 | Balance | Topup didn't credit | Checked webhook, manually credited | 2 hours |
| 2/19 | Shipping | Where's tracking? | Not shipped yet, sent ETA | 30 min |
| 2/20 | Rare pull | Got ultra, amazing! | Positive feedback, thanked user | 5 min |

**Common Issue Types:**
- Balance not updating
- Item never shipped
- Wrong item received
- "Feels rigged" / probability complaints
- How to sell back
- Account locked
- Positive feedback

**Weekly Analysis:**
- Most common issue: _____________________________
- Average resolution time: _____ hours
- % resolved within 24 hours: _____%
- Positive feedback count: _____

**Red flags:**
- >10 tickets/week at 100 boxes/month = issue with UX
- Multiple "rigged" complaints = perception problem
- Balance update issues = webhook broken

---

## INVENTORY MANAGEMENT

### Restock Triggers

**Automated alerts via Admin Dashboard, but also track manually:**

| Rarity | Current Stock | Weekly Burn Rate | Days Until Depletion | Action Needed |
|--------|---------------|------------------|----------------------|---------------|
| Common | ___ | ___ | ___ | ⬜ Order / ⬜ OK |
| Uncommon | ___ | ___ | ___ | ⬜ Order / ⬜ OK |
| Rare | ___ | ___ | ___ | ⬜ Order / ⬜ OK |
| Ultra | ___ | ___ | ___ | ⬜ Order / ⬜ OK |

**Burn Rate Formula:**
```
Weekly Burn Rate = Boxes Opened This Week × Probability

Example:
- 100 boxes opened
- Rare probability: 9%
- Rare burn rate: 100 × 0.09 = 9 rare items used this week
```

**Days Until Depletion:**
```
Days Until Depletion = (Current Stock / Weekly Burn Rate) × 7

Example:
- Rare stock: 25 items
- Weekly burn rate: 9 items
- Days: (25 / 9) × 7 = 19.4 days
```

**Restock Levels:**
- Common: Restock when < 200 (order +300)
- Uncommon: Restock when < 50 (order +100)
- Rare: Restock when < 15 (order +50)
- Ultra: Restock when < 3 (order +10)

---

## FINANCIAL RECONCILIATION

### Monthly Audit (End of Month)

**Compare Actual vs Projected:**

| Metric | Projected | Actual | Variance | Analysis |
|--------|-----------|--------|----------|----------|
| Boxes opened | 100 | ___ | ___% | ________________________ |
| Revenue | $2,695 | $___ | ___% | ________________________ |
| COGS | $1,200 | $___ | ___% | ________________________ |
| Sellback cost | $748 | $___ | ___% | ________________________ |
| Gross profit | $747 | $___ | ___% | ________________________ |
| Margin | 27.7% | ___% | ___pp | ________________________ |

**Stripe Fees:**
```sql
-- Estimate Stripe fees (they don't appear in your DB)
SELECT
  SUM(amount) as total_topups,
  SUM(amount) * 0.029 + COUNT(*) * 0.30 as estimated_stripe_fees
FROM balance_transactions
WHERE type = 'topup'
  AND created_at >= DATE_TRUNC('month', NOW());
```

**Cash Reconciliation:**
```
Bank Balance = Opening Balance + Revenue - Inventory Purchases - Operating Expenses - Stripe Fees

Verify: Actual bank balance matches calculation ± $50
```

---

## TOOLS & DASHBOARDS

### Recommended Setup (Optional)

1. **Error Monitoring**
   - Tool: Sentry (free tier: 5,000 events/month)
   - Alerts: Email on any production error
   - Setup time: 1 hour

2. **Analytics**
   - Tool: PostHog (free tier: 1M events/month)
   - Track: box_opened, item_sold_back, topup_completed, shipping_requested
   - Setup time: 2 hours

3. **Uptime Monitoring**
   - Tool: UptimeRobot (free tier: 50 monitors)
   - Ping: https://your-app.vercel.app/api/health every 5 minutes
   - Alert: Email if down for >5 minutes
   - Setup time: 15 minutes

4. **Financial Dashboard**
   - Tool: Google Sheets + Zapier (optional automation)
   - Auto-pull data from Supabase weekly
   - Setup time: 4 hours

---

## TROUBLESHOOTING

### Issue: Probability distribution looks off

**Symptoms:**
- Week 1: Common 75%, Uncommon 20%, Rare 4%, Ultra 1%
- Significantly off from 60/30/9/1 target

**Diagnosis:**
1. Check if migration 008 actually ran:
   ```sql
   SELECT routine_name, routine_definition
   FROM information_schema.routines
   WHERE routine_name = 'open_mystery_box';
   ```
2. Look for `v_rand < 0.01` (should be 0.01, not 0.005)
3. Look for `v_rand < 0.10` (should be 0.10, not 0.045)
4. Look for `v_rand < 0.40` (should be 0.40, not 0.295)

**Fix:**
- Re-run migration 008 if thresholds are wrong
- Clear Vercel cache: Vercel → Deployments → ••• → Redeploy

---

### Issue: Sellback rate too high (>48%)

**Symptoms:**
- Margin dropping below 20%
- Users selling back >48% of all items
- Ultra sellback rate >60%

**Root Causes:**
- Product selection poor (users don't want the items)
- Buyback prices too generous relative to perceived value
- Better deals available elsewhere

**Fix:**
1. **Immediate (Band-aid):**
   - Lower buyback prices slightly (Common $7 → $6, Uncommon $22 → $20)
   - Communicate as "updated market pricing"

2. **Medium-term (Product improvement):**
   - Survey users: "What items do you actually want?"
   - Replace unpopular products with high-demand collectibles
   - Test new products at lower quantities first

3. **Long-term (Structural):**
   - Implement tier-based sellback bonuses (Gold members get +$1)
   - Add "sell now vs keep for collection" messaging
   - Gamify keeping items (collection completion rewards)

---

### Issue: Inventory depleting faster than expected

**Symptoms:**
- Rare items down to 8 remaining (expected 15+)
- Only 2 weeks into deployment
- Admin dashboard showing CRITICAL alerts

**Root Cause:**
- More boxes opened than projected (growth!)
- Sellback rate lower than expected (users keeping items)

**Fix:**
1. **Immediate:**
   - Expedite rare item order (priority shipping)
   - Consider temporarily reducing rare probability to 7% until stock arrives

2. **Preventive:**
   - Set up auto-reorder trigger at 20 units
   - Maintain 2x buffer stock (if weekly burn = 10, keep 20+ in stock)

---

## WEEK-BY-WEEK MILESTONES

### Week 1: Survival
- ✅ No critical bugs
- ✅ Webhooks processing 100%
- ✅ Inventory alerts working
- ✅ Sellback restoring inventory
- ✅ No rollback needed

### Week 2: Stabilization
- ✅ Customer support response time <24 hours
- ✅ All shipping requests processed
- ✅ Inventory restock ordered
- ✅ Probability distribution matches target ± 5%
- ✅ Financial tracking up to date

### Week 3: Optimization
- ✅ Identified top 3 UX improvements
- ✅ Customer satisfaction survey sent
- ✅ Rare inventory restocked
- ✅ Social media tracking started
- ✅ Retention cohort analysis done

### Week 4: Decision Prep
- ✅ All 30-day metrics calculated
- ✅ Variance analysis complete
- ✅ User interviews conducted (5-10 users)
- ✅ Financial model updated with actuals
- ✅ Go/no-go recommendation prepared

---

## SUCCESS INDICATORS

**You're on track for SUCCESS if:**
- ✅ Week 1 profit/box: $6.50-8.50
- ✅ Week 2 sellback rate: <45%
- ✅ Week 3 viral mentions: >5
- ✅ Week 4 retention: >30%
- ✅ Zero critical bugs
- ✅ Customer feedback mostly positive
- ✅ You're having fun / not stressed

**Warning signs (intervention needed):**
- ⚠️ Profit/box < $6.00 consistently
- ⚠️ Sellback rate > 46% and rising
- ⚠️ Multiple "rigged" complaints
- ⚠️ Inventory running out faster than expected
- ⚠️ You're stressed about cash flow

**Abort criteria (rollback now):**
- ❌ Profit/box < $5.00
- ❌ Sellback rate > 48%
- ❌ Cash balance < $2,000
- ❌ Negative social media sentiment
- ❌ Unable to fulfill shipping requests

---

## FINAL NOTES

**Remember:**
1. This is a **test**, not a permanent commitment
2. You have a **rollback plan** ready
3. 30 days is enough to know if it works
4. Real data > projections
5. User feedback matters more than spreadsheets
6. If in doubt, ask the community

**Most important question to ask yourself weekly:**

> "If I had to decide right now whether to keep this distribution or revert, what would I choose and why?"

If the answer is "revert" for 2 weeks in a row, it's time to revert.

---

**You've got this! 📊**

You have better monitoring than 90% of startups at launch. Trust your data, trust your instincts.
