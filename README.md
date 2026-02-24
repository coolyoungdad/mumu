# Mumu - Mystery Box E-Commerce Platform

A Next.js-based mystery box shopping platform with weighted rarity tiers, atomic inventory management, and Stripe payment integration.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Checkout Sessions
- **Icons**: Phosphor Icons
- **Font**: Plus Jakarta Sans

## Features

- 🎁 **Mystery Box System** with weighted rarity (Common 60%, Uncommon 25%, Rare 10%, Ultra 5%)
- 🔒 **Atomic Inventory Management** - prevents overselling with database row locks
- 💳 **Stripe Checkout Integration** - secure payments with webhook verification
- 📊 **Admin Dashboard** - real-time inventory and order management
- 🎨 **Modern Design** - glassmorphism, gradients, and animations
- 🔐 **Row Level Security (RLS)** - secure data access with Supabase policies

## Project Structure

```
mumu/
├── app/
│   ├── api/
│   │   ├── checkout/          # Stripe checkout session creation
│   │   └── webhooks/stripe/   # Stripe webhook handler
│   ├── admin/                 # Admin dashboard
│   ├── checkout/              # Checkout page
│   ├── order/success/         # Order confirmation
│   ├── layout.tsx
│   ├── page.tsx               # Landing page
│   └── globals.css            # Tailwind + custom styles
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── ActivityTicker.tsx
│   ├── HowItWorks.tsx
│   ├── ProductGrid.tsx
│   ├── CTASection.tsx
│   ├── Footer.tsx
│   └── BackgroundDecorations.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   └── server.ts          # Server client
│   └── types/
│       └── database.ts        # TypeScript types
└── supabase/
    ├── schema.sql             # Database schema + RLS policies
    ├── seed.sql               # Initial product data
    └── functions.sql          # Database functions
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- Supabase URL and keys
- Stripe publishable and secret keys
- Stripe webhook secret
- App URL

### 2. Database Setup

**Create Supabase Project:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and keys to `.env.local`

**Run Database Migrations:**
1. Open Supabase SQL Editor
2. Run `supabase/schema.sql` (creates tables, indexes, RLS policies)
3. Run `supabase/functions.sql` (creates helper functions)
4. Run `supabase/seed.sql` (adds initial 20 products with inventory)

**Create Admin User:**
1. Sign up via Supabase Auth UI
2. Get your user ID from Supabase Dashboard → Authentication → Users
3. Run in SQL Editor:
```sql
INSERT INTO public.users (id, email, role)
VALUES ('your-user-id', 'admin@mumu.com', 'admin');
```

### 3. Stripe Setup

**Create Stripe Account:**
1. Go to [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys
3. Add keys to `.env.local`

**Configure Webhook:**
1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Copy webhook signing secret to `.env.local`

For production:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy signing secret to production env

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Product Configuration

### Rarity Tiers

| Rarity | % Odds | COGS | Resale Value | SKUs | Units/SKU |
|--------|--------|------|--------------|------|-----------|
| Common | 60% | $6 | $8 | 12 | 20 |
| Uncommon | 25% | $12 | $18 | 5 | 20 |
| Rare | 10% | $20 | $40 | 2 | 20 |
| Ultra | 5% | $50 | $120 | 1 | 20 |

**Total**: 20 SKUs, 400 units

### Pricing

- **Box Price**: $19.99
- **Shipping Fee**: $5.00
- **Total**: $24.99
- **Expected COGS**: $11.10
- **Expected Margin**: $8.36 (33.5%)

## Key Features Explained

### Atomic Inventory Management

The `reserve_mystery_boxes()` function uses PostgreSQL row locks to prevent overselling:

```sql
-- Locks inventory row and decrements atomically
UPDATE public.inventory
SET quantity_available = quantity_available - 1
WHERE product_id = v_product_id AND quantity_available > 0;
```

Concurrent purchases for the last unit result in only one success.

### Weighted Random Selection

The `select_mystery_box_product()` function implements weighted randomness:

1. Generate random number 0-1
2. Map to rarity tier based on odds
3. Select random product of that rarity
4. Fallback to any available if rarity depleted

### Stripe Checkout Flow

1. User clicks "Start Unboxing" → `/checkout`
2. User selects quantity → Clicks "Proceed to Payment"
3. API creates Stripe Checkout Session
4. Inventory reserved atomically
5. User redirected to Stripe
6. User completes payment
7. Webhook confirms payment → Order marked "paid"
8. User redirected to success page

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Set in Vercel Dashboard → Settings → Environment Variables:
- All variables from `.env.example`
- `NEXT_PUBLIC_APP_URL` = your production URL
- `STRIPE_WEBHOOK_SECRET` = production webhook secret

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## API Endpoints

### POST `/api/checkout`
Creates Stripe Checkout session and reserves inventory.

**Request:**
```json
{ "quantity": 1 }
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

### POST `/api/webhooks/stripe`
Handles Stripe webhook events (checkout.session.completed, payment intents).

## Database Schema

### Core Tables
- `users` - User accounts with role (user/admin)
- `products` - Product catalog with rarity tiers
- `inventory` - Available quantity per product
- `orders` - Order records with Stripe session
- `order_items` - Products in each order
- `shipments` - Tracking information

### Key Functions
- `select_mystery_box_product()` - Weighted random selection
- `reserve_mystery_boxes(quantity)` - Atomic inventory reservation
- `get_random_product_by_rarity(rarity)` - Get product by rarity tier

## Security

- ✅ Row Level Security (RLS) on all tables
- ✅ Stripe webhook signature verification
- ✅ Server-side inventory management
- ✅ No client-side pricing manipulation
- ✅ Admin-only dashboard access

## Future Enhancements (Not in MVP)

- [ ] Email confirmations (Resend integration)
- [ ] Shipping label generation (Shippo API)
- [ ] Bundle purchasing
- [ ] Discount codes
- [ ] User account dashboard
- [ ] Order history
- [ ] Subscription model
- [ ] Loyalty system
- [ ] Limited-edition drops

## Troubleshooting

**Stripe webhook not working:**
- Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check webhook secret matches `.env.local`

**Inventory overselling:**
- Verify `reserve_mystery_boxes()` function exists
- Check database row locks are working

**Admin dashboard shows 403:**
- Verify user role is 'admin' in `users` table
- Check RLS policies allow admin access

## License

© 2024 Mumu Inc. All rights reserved.

