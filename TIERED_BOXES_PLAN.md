# Mumu Tiered Boxes - Complete Implementation Plan
## For Non-Technical Stakeholders

**Date:** February 18, 2026
**Status:** Proposal for Review
**Estimated Launch:** 2-3 weeks from approval

---

## EXECUTIVE SUMMARY

**What We're Building:**
Three tiers of mystery boxes with different minimum guarantees:
- **Bronze Box**: $25 - Current mystery box (no changes)
- **Silver Box**: $35 - Guaranteed uncommon item or better
- **Gold Box**: $50 - Guaranteed rare item or better

**Why This Makes Sense:**
- Keeps the "mystery and surprise" core to Mumu
- Lets users choose their risk level
- Targets different spending behaviors (casual vs collector vs whale)
- Simple to understand ("pay more, better minimum odds")
- Fast to build (3-5 days vs 3 weeks for Smart Box)

**Expected Results:**
- 15-25% of users upgrade from Bronze to Silver/Gold
- +$80-120K additional annual revenue
- Minimal development cost (~$2,000)
- Zero new infrastructure needed

---

## WHAT IS A TIERED BOX?

### The Customer Experience

**Today (Mystery Box Only):**
1. User clicks "Open Mystery Box"
2. Pays $25
3. Gets random item (could be common, could be ultra rare)
4. That's it - one option

**With Tiered Boxes:**
1. User sees three options on the page:

   ```
   ┌──────────────────────────────────────────┐
   │  BRONZE BOX              $25             │
   │  The Classic Mystery                     │
   │  • 60% Common                            │
   │  • 30% Uncommon                          │
   │  • 9% Rare                               │
   │  • 1% Ultra Rare                         │
   │  [Open Bronze Box]                       │
   └──────────────────────────────────────────┘

   ┌──────────────────────────────────────────┐
   │  SILVER BOX              $35  🔥 Popular │
   │  Skip the Commons                        │
   │  • 0% Common (guaranteed!)               │
   │  • 75% Uncommon                          │
   │  • 23% Rare                              │
   │  • 2% Ultra Rare                         │
   │  [Open Silver Box]                       │
   └──────────────────────────────────────────┘

   ┌──────────────────────────────────────────┐
   │  GOLD BOX                $50  ⭐ Premium │
   │  Go Big or Go Home                       │
   │  • 0% Common                             │
   │  • 0% Uncommon                           │
   │  • 90% Rare                              │
   │  • 10% Ultra Rare                        │
   │  [Open Gold Box]                         │
   └──────────────────────────────────────────┘
   ```

2. User picks the tier they want
3. Confirms purchase
4. Gets the reveal animation (same as current)
5. Receives item matching that tier's guarantee

**Key Point:** It's still a mystery box - you don't know WHICH item you'll get, just that it won't be below the minimum.

---

## HOW IT WORKS (Behind The Scenes, Simplified)

### Current System
Right now, when someone opens a mystery box:
1. System checks their balance ($25 or more?)
2. System randomly picks a rarity tier (60% common, 30% uncommon, etc.)
3. System picks a random product from that rarity
4. Deducts money, gives them the item

### With Tiered Boxes
Same process, but with a filter on step 2:

**Bronze Box ($25):**
- No filter (same as current)
- Roll: 60% common, 30% uncommon, 9% rare, 1% ultra

**Silver Box ($35):**
- Filter: "Don't roll common"
- Adjusted odds: 75% uncommon, 23% rare, 2% ultra
- Math: Take the original 30/9/1 and recalculate percentages

**Gold Box ($50):**
- Filter: "Only roll rare or ultra"
- Adjusted odds: 90% rare, 10% ultra
- Math: Take the original 9/1 and recalculate percentages

**The System Doesn't Change - Just Which Rarities Are Allowed**

---

## WHAT NEEDS TO BE BUILT

### 1. Database Changes (The "Brain" of Mumu)

**Current:**
```
We have one function called "open_mystery_box"
It picks any rarity tier
```

**New:**
```
We create three variations:
- open_bronze_box (same as current)
- open_silver_box (skip common tier)
- open_gold_box (skip common and uncommon tiers)

OR (better approach):

Keep ONE function but add a "tier" option:
- open_mystery_box(user_id, tier='bronze')
- open_mystery_box(user_id, tier='silver')
- open_mystery_box(user_id, tier='gold')
```

**What Gets Changed:**
- The random number generator gets a "minimum rarity" setting
- Example: If tier is "silver", when it picks a number, if it lands on "common", it re-rolls until it gets uncommon or better

**Time Required:** 4-6 hours

---

### 2. User Interface (What People See)

**Page Layout Changes:**

**Before:**
```
┌─────────────────────────────────┐
│     Open Mystery Box            │
│                                 │
│   [One big button: $25]         │
│                                 │
└─────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────┐
│    Choose Your Mystery Box      │
│                                 │
│  [Bronze $25] [Silver $35] [Gold $50]
│                                 │
│  (Shows selected tier details)  │
│                                 │
│  [Open Selected Box]            │
└─────────────────────────────────┘
```

**What Changes:**
- Add three clickable cards (Bronze/Silver/Gold)
- Each card shows:
  - Price
  - Name/tagline
  - Probability breakdown
  - Visual badge (bronze/silver/gold color)
- User clicks a card to select it (highlights)
- "Open Box" button uses selected tier
- Everything else (reveal animation, inventory, etc.) stays the same

**Time Required:** 6-8 hours

---

### 3. Pricing Logic (Making Sure We Charge Right Amount)

**Current:**
```
Price is always $25
```

**New:**
```
Price depends on tier:
- Bronze = $25
- Silver = $35
- Gold = $50
```

**What Changes:**
- When user clicks "Open Box", system checks which tier they selected
- Deducts the correct amount ($25, $35, or $50)
- Records in transaction history which tier was used
- Balance updates reflect correct price

**Safety Check:**
- If user's balance is $40 and they try Gold ($50), system stops them
- Shows message: "Insufficient balance. You need $10 more for Gold Box."

**Time Required:** 2-3 hours

---

### 4. Transaction History (The Receipt System)

**Current:**
```
User sees: "Mystery box opened - $25"
```

**New:**
```
User sees: "Bronze Box opened - $25"
         or "Silver Box opened - $35"
         or "Gold Box opened - $50"
```

**What Changes:**
- Add "tier" field to transaction records
- Update display to show which tier was purchased
- Admin dashboard shows breakdown (X bronze, Y silver, Z gold sold)

**Time Required:** 2 hours

---

### 5. Admin Dashboard (For You To Monitor)

**New Metrics To Track:**

**Sales Breakdown:**
```
Today's Box Sales:
- Bronze: 45 boxes @ $25 = $1,125
- Silver: 12 boxes @ $35 = $420
- Gold: 3 boxes @ $50 = $150
Total: 60 boxes, $1,695 revenue
```

**Conversion Rates:**
```
Bronze → Silver: 21% of users upgraded
Bronze → Gold: 5% of users upgraded
Average box value: $28.25 (up from $25)
```

**Financial Metrics:**
```
Revenue per user today: $28.25
Margin by tier:
- Bronze: 57% ($25 - $10.70 COGS)
- Silver: 64% ($35 - $12.50 COGS)
- Gold: 66% ($50 - $17.00 COGS)
```

**Time Required:** 4 hours

---

## PRICING STRATEGY BREAKDOWN

### How We Determined These Prices

**Bronze Box: $25 (No Change)**
- Cost of goods sold (COGS): $10.70 average
- Margin: $14.30 (57%)
- This is our baseline

**Silver Box: $35 (+$10)**
- Expected COGS: $12.50 (higher because no commons)
- Margin: $22.50 (64%)
- Why $35?:
  - User avoids 60% chance of common ($7 value)
  - Gets guaranteed $25+ item
  - Perceived value: Eliminates "bad outcome"
  - Comparable to buying 1.4 bronze boxes to avoid commons

**Gold Box: $50 (+$25)**
- Expected COGS: $17.00 (rare/ultra only)
- Margin: $33.00 (66%)
- Why $50?:
  - User avoids 90% chance of non-rare
  - Gets guaranteed $60+ item
  - Perceived value: 90% chance of $60 item vs 9% in bronze
  - Comparable to buying 10+ bronze boxes hunting for rare

### Profit Analysis

**If 100 users buy boxes:**

**Scenario 1: All Bronze (Current)**
```
Revenue: 100 × $25 = $2,500
COGS: 100 × $10.70 = $1,070
Profit: $1,430
```

**Scenario 2: Mixed (Projected with Tiers)**
```
70 Bronze: 70 × $25 = $1,750
25 Silver: 25 × $35 = $875
5 Gold: 5 × $50 = $250

Total Revenue: $2,875
Total COGS: (70×$10.70) + (25×$12.50) + (5×$17) = $1,147
Total Profit: $1,728 (+21% vs all bronze)
```

**Key Insight:** Even if only 30% of users upgrade, we make 21% more profit.

---

## TIMELINE & DEVELOPMENT STAGES

### Week 1: Build Core Functionality
**Days 1-2 (Database Work):**
- Modify the box-opening function to accept tier parameter
- Test that Silver excludes commons correctly
- Test that Gold excludes commons and uncommons correctly
- Verify pricing logic for each tier
- **Deliverable:** Working backend function

**Days 3-4 (User Interface):**
- Design three tier cards (Bronze/Silver/Gold)
- Add tier selection interaction
- Connect selection to purchase button
- Update pricing display based on selection
- **Deliverable:** Working frontend

**Day 5 (Integration & Testing):**
- Connect frontend to backend
- Test full purchase flow for each tier
- Verify balance deductions are correct
- Test edge cases (insufficient balance, tier switching)
- **Deliverable:** End-to-end working system

### Week 2: Polish & Launch Prep
**Days 6-7 (Admin Dashboard):**
- Add tier breakdown metrics
- Add conversion tracking
- Add revenue analytics
- **Deliverable:** Admin visibility

**Days 8-9 (Testing & Bug Fixes):**
- User acceptance testing (you test it!)
- Fix any bugs found
- Mobile responsiveness check
- Performance testing
- **Deliverable:** Production-ready code

**Day 10 (Soft Launch):**
- Deploy to 10% of users first
- Monitor for issues
- Collect initial data
- **Deliverable:** Live to subset of users

### Week 3: Full Launch & Monitoring
**Days 11-12 (Rollout):**
- Increase to 50% of users
- Monitor metrics closely
- **Deliverable:** Half of traffic on new system

**Days 13-14 (Full Launch):**
- Roll out to 100% of users
- Announce via email/social media
- **Deliverable:** Live for everyone

**Days 15-21 (Monitoring Period):**
- Track daily metrics
- Adjust messaging if needed
- Gather user feedback
- **Deliverable:** Performance report

---

## COST BREAKDOWN

### Development Costs
| Item | Time | Rate | Cost |
|------|------|------|------|
| Database modifications | 6 hours | $150/hr | $900 |
| UI design & build | 8 hours | $150/hr | $1,200 |
| Pricing logic | 3 hours | $150/hr | $450 |
| Transaction updates | 2 hours | $150/hr | $300 |
| Admin dashboard | 4 hours | $150/hr | $600 |
| Testing & QA | 6 hours | $150/hr | $900 |
| **Total Development** | **29 hours** | | **$4,350** |

### Infrastructure Costs
| Item | Monthly Cost |
|------|--------------|
| No new infrastructure needed | $0 |
| Uses existing Supabase database | $0 |
| Uses existing Vercel hosting | $0 |
| **Total Infrastructure** | **$0** |

### Ongoing Costs
| Item | Monthly Cost |
|------|--------------|
| Maintenance (assume 2 hours/month) | $300 |
| Support tickets (estimate 5% increase) | ~$50 |
| **Total Ongoing** | **$350/month** |

### Total Investment
- **Upfront:** $4,350
- **Monthly:** $350
- **Payback period:** ~6-8 weeks (based on +$2,000/month revenue increase)

---

## RISK ANALYSIS

### Low Risk Issues (Unlikely, Minor Impact)
1. **Users don't upgrade to Silver/Gold**
   - Impact: No revenue gain, but no loss either (Bronze stays same)
   - Mitigation: A/B test pricing ($35/$40 for Silver to find sweet spot)

2. **UI confusion ("Which box do I pick?")**
   - Impact: Temporary support tickets increase
   - Mitigation: Clear labels, tooltips, video explainer

### Medium Risk Issues (Possible, Manageable)
3. **Price resistance ("$50 is too expensive")**
   - Impact: Gold tier underperforms
   - Mitigation: Start with Silver focus, Gold is "luxury option"

4. **Expectation mismatch ("I paid $50 and got the cheapest rare")**
   - Impact: Refund requests, negative sentiment
   - Mitigation: Clear messaging "Guaranteed MINIMUM rare, not guaranteed ultra"

### High Risk Issues (Must Prevent)
5. **Bug in tier logic (Gold gives common item)**
   - Impact: CRITICAL - user paid $50, got $7 item, demands refund
   - Mitigation: Extensive testing, phased rollout, kill switch ready

6. **Financial model breaks (margins collapse)**
   - Impact: Business unsustainable
   - Mitigation: Monitor margins daily for first 2 weeks, adjust pricing if needed

### Mitigation Strategies
- **Phased Rollout:** 10% → 50% → 100% over 5 days
- **Kill Switch:** Can disable Silver/Gold tiers instantly via admin panel
- **Daily Monitoring:** Check conversion rates, margins, support tickets
- **User Feedback Loop:** Survey purchasers after 1 week
- **Pricing Flexibility:** Can adjust Silver/Gold prices if economics don't work

---

## SUCCESS METRICS

### Week 1 Targets (Soft Launch)
- **Technical Success:**
  - Zero critical bugs
  - <5% support ticket increase
  - Page load time <3 seconds

- **Business Success:**
  - 10-15% of users select Silver
  - 2-5% of users select Gold
  - Average box value: $26-28

- **User Satisfaction:**
  - <3% refund requests
  - Positive sentiment in feedback
  - No complaints about "misleading" guarantees

### Month 1 Targets (Full Launch)
- **Conversion Targets:**
  - Silver conversion: 15-20%
  - Gold conversion: 3-7%
  - Total upgrade rate: 18-27%

- **Revenue Targets:**
  - +$6,000-10,000 additional monthly revenue
  - Average box value: $27-30
  - Margins maintained above 55%

- **Engagement Targets:**
  - No decrease in total boxes opened
  - Silver tier repeat purchase rate >30%
  - Gold tier repeat purchase rate >20%

### Quarter 1 Targets (3 Months)
- **Financial:**
  - +$80,000 additional quarterly revenue
  - ROI positive (investment paid back)
  - Margins stable at 60-65%

- **Product-Market Fit:**
  - Silver is 20-30% of all boxes
  - Gold is 5-10% of all boxes
  - User surveys show high satisfaction with tiers

- **Strategic:**
  - Foundation for future tiers (Platinum? Diamond?)
  - Data on price elasticity for future products
  - Whale identification (Gold buyers are high-LTV)

---

## GO/NO-GO DECISION CRITERIA

### Proceed to Full Launch IF:
✅ Soft launch shows 15%+ upgrade rate
✅ Zero critical bugs in first 3 days
✅ Support tickets <10% increase
✅ Margins hold above 55%
✅ User feedback is neutral-to-positive

### Pause Rollout IF:
⚠️ Upgrade rate <10%
⚠️ Margins drop below 50%
⚠️ Support tickets spike >20%
⚠️ Technical issues persist >24 hours

### Kill Feature IF:
❌ Critical bug causes financial loss
❌ Upgrade rate <5% after 2 weeks
❌ Margins drop below 40%
❌ User backlash is severe
❌ Refund rate >10%

**Decision Maker:** You (the founder)
**Check-in Frequency:** Daily for Week 1, Weekly for Month 1
**Data Source:** Admin dashboard + Stripe + user surveys

---

## MARKETING & MESSAGING

### How We Explain This To Users

**Email Announcement:**
```
Subject: 🎁 New! Choose Your Mystery Box Level

Hey [Name],

Big news: Mumu now has THREE mystery box tiers!

🥉 BRONZE ($25) - The classic mystery you know and love
🥈 SILVER ($35) - Skip the commons, guaranteed uncommon+
🥇 GOLD ($50) - Go big: guaranteed rare or ultra rare

Same thrill, same surprise, but now YOU pick your risk level.

[Try Silver Box Now]

Still love the OG? Bronze is still here at $25.
Feeling lucky? Gold guarantees a rare pull.

Happy unboxing!
- Mumu Team
```

**On-Page Messaging:**

**For Bronze:**
"The Classic Mystery - Best value, highest variety, pure surprise"

**For Silver:**
"Skip the basics - Why gamble on commons when you can guarantee better?"

**For Gold:**
"Collector's Choice - 90% chance of rare, 10% chance of ultra. No fillers."

**Key Messaging Principles:**
- Never say "guaranteed ultra" (it's not - Gold is guaranteed RARE minimum)
- Emphasize "better odds" not "guaranteed outcomes"
- Bronze is NOT inferior, it's "variety/value play"
- Silver is "smart upgrade" for most users
- Gold is "whale/collector" tier

---

## FREQUENTLY ASKED QUESTIONS

### For Users

**Q: If I buy Gold, do I always get an ultra rare?**
A: No. Gold guarantees you'll get AT LEAST a rare item (minimum). You have a 10% chance of getting an ultra rare, and 90% chance of getting a rare. You'll never get common or uncommon.

**Q: Is Bronze worse now?**
A: Not at all! Bronze is the same great mystery box you've always loved, same price, same odds. Silver and Gold are just optional upgrades if you want better minimum guarantees.

**Q: Can I see what items are in each tier?**
A: Every box pulls from the same 100-item catalog. The tier just determines the minimum rarity. So Bronze can give you anything, Silver guarantees uncommon+, Gold guarantees rare+.

**Q: What if I buy Gold and get the cheapest rare item?**
A: That's possible - Gold guarantees rare MINIMUM, not the most expensive rare. Think of it like buying a premium loot box - better odds, but still random within that tier.

**Q: Can I use my sellback balance for these?**
A: Yes! Your account balance works the same for all tiers. Just make sure you have enough ($25 for Bronze, $35 for Silver, $50 for Gold).

### For You (The Founder)

**Q: What if everyone just buys Bronze?**
A: Then we're no worse off than today - Bronze is the current mystery box. But data from other platforms shows 15-25% of users upgrade to premium tiers when offered.

**Q: What if Silver/Gold margins are too low?**
A: We can adjust pricing. If Silver needs to be $40 to maintain margins, we test that. The great thing about digital pricing is flexibility.

**Q: Does this cannibalize Bronze sales?**
A: Some users will switch from Bronze to Silver, yes. But they're paying $10 more, so revenue increases even if total box count stays flat. Net-net, we win.

**Q: Can we add more tiers later (Platinum, Diamond)?**
A: Absolutely. This is designed to be expandable. If Gold performs well, we could add a $75 "Platinum" tier with guaranteed ultra rare. The system scales.

**Q: What if this fails?**
A: We can disable Silver/Gold in the admin panel instantly. Bronze stays active, users never know Silver/Gold existed. Zero downside risk.

---

## COMPARISON TO ALTERNATIVES

### Tiered Boxes vs. Smart Box

| Factor | Tiered Boxes | Smart Box (Shelved) |
|--------|--------------|---------------------|
| **Implementation Time** | 2-3 weeks | 2-3 months |
| **Development Cost** | $4,350 | $15,000+ |
| **Complexity** | Low (3 options) | High (100-item customization) |
| **User Confusion** | Minimal | High |
| **Maintenance** | Low | High |
| **Revenue Upside** | +$80K/year | +$100K/year (if it works) |
| **Risk** | Low | High |
| **Aligns with Mumu Brand** | ✅ Yes | ❌ No (too complex) |

**Why Tiered Wins:**
- 80% of the revenue upside at 20% of the cost
- Keeps "mystery" core intact
- Simple, proven model (used by every gacha game)
- Fast to market
- Easy to test and iterate

---

## NEXT STEPS

### If You Approve This Plan

**Immediate Actions (This Week):**
1. **Approve budget** ($4,350 development + $350/month ongoing)
2. **Confirm pricing** (Bronze $25, Silver $35, Gold $50 - or adjust)
3. **Approve UI design** (we'll send mockups for your feedback)
4. **Set launch date target** (recommend 3 weeks from approval)

**Development Sprint (Week 1):**
- Daily updates on progress
- Staging environment for you to test
- Bug reports and fixes in real-time

**Launch Prep (Week 2):**
- Final testing with your account
- Prepare email announcement
- Prepare social media posts
- Set up monitoring dashboard

**Soft Launch (Week 3, Days 1-3):**
- Deploy to 10% of users
- Monitor metrics hourly
- Fix any issues immediately

**Full Launch (Week 3, Days 4-7):**
- Increase to 50%, then 100%
- Send announcement email
- Post on social media
- Monitor for first 48 hours closely

**Post-Launch (Week 4+):**
- Weekly performance reports
- User feedback analysis
- Pricing optimization if needed
- Plan next iteration (Platinum tier?)

---

## CONCLUSION

Tiered Boxes is a low-risk, high-reward addition to Mumu that:
- ✅ Preserves the mystery box experience
- ✅ Gives users meaningful choice
- ✅ Increases revenue without complexity
- ✅ Builds foundation for future growth
- ✅ Can be built and launched in 2-3 weeks

**The core insight:** People love mystery, but they also love managing risk. Tiered Boxes lets users pick their risk level while keeping the surprise and thrill intact.

**Total Investment:** $4,350 upfront, $350/month
**Expected Return:** +$80-120K annual revenue
**ROI Timeline:** 6-8 weeks to break even
**Strategic Value:** Whale identification, pricing data, expandable system

**Recommendation:** Approve and proceed to development.

---

## APPENDIX: TECHNICAL NOTES (For Reference)

### Database Schema Changes Needed
```
No new tables required.

Modifications:
1. Add 'tier' column to balance_transactions table
   - Type: TEXT
   - Values: 'bronze', 'silver', 'gold'

2. Modify open_mystery_box function
   - Add parameter: p_tier TEXT DEFAULT 'bronze'
   - Add logic: Filter rarity based on tier
   - Update pricing: Check tier, charge accordingly
```

### API Endpoints Changed
```
POST /api/box/open
  Body (before): { user_id }
  Body (after): { user_id, tier: 'bronze'|'silver'|'gold' }

  Logic change:
  - Validate tier is valid
  - Check balance >= tier price
  - Call open_mystery_box(user_id, tier)
```

### Frontend Components Modified
```
/app/box/page.tsx
  - Add tier selection UI (3 cards)
  - Add tier state management
  - Update purchase button to pass tier
  - Update pricing display based on tier
```

### Rollback Plan
```
If we need to disable tiers:
1. Admin panel toggle: "ENABLE_TIERS = false"
2. Frontend hides Silver/Gold cards
3. System defaults all requests to Bronze
4. Zero data loss, instant rollback
```

---

**Document Version:** 1.0
**Last Updated:** February 18, 2026
**Author:** Mumu Product Team
**Reviewers Needed:** Engineering, Finance, Marketing, CEO
**Approval Required:** Founder Sign-off