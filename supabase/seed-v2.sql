-- MuMu Seed Data V2 — Real PopMart/Sanrio Collectibles
-- Run AFTER schema-v2.sql and all migrations
-- Clears existing data and re-seeds with real product catalog

-- Clear existing data (safe to re-run)
DELETE FROM public.user_inventory;
DELETE FROM public.inventory;
DELETE FROM public.products;

-- ============================================================
-- PRODUCTS — 50 collectibles matching BoxContents.tsx
-- description field = brand name (used by BoxContents sidebar)
-- Box price: $25
-- COGS: $12.00 flat (purchased as blind boxes from supplier)
-- Buyback prices tuned for viable economics (CFO-optimized "Balanced" model):
--   Expected sellback EV = $12.44 vs $25 box price
--   Profit target: $8.18/box (30.3% margin) with shake + shipping revenue
-- ============================================================

INSERT INTO public.products (id, name, sku, rarity, wholesale_cost, resale_value, buyback_price, description) VALUES

-- COMMON (30 items) — buyback $7 | COGS $12.00 | resale ~$15
(uuid_generate_v4(), 'Aries Molly',                  'ARIES-MOLLY',              'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Astronaut Dimoo',               'ASTRONAUT-DIMOO',           'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Ballet Girl Molly',             'BALLET-MOLLY',             'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Beach Time Hangyodon',          'BEACH-HANGYODON',           'common',   12.00, 15.00,  7.00, 'Sanrio'),
(uuid_generate_v4(), 'Bee Elf Labubu',                'BEE-ELF-LABUBU',           'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Bunny Pajamas My Melody',       'BUNNY-MY-MELODY',          'common',   12.00, 15.00,  7.00, 'Sanrio'),
(uuid_generate_v4(), 'Carnival Dancer Labubu',        'CARNIVAL-LABUBU',          'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Chef Molly',                    'CHEF-MOLLY',               'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Christmas Baby Pucky',          'CHRISTMAS-PUCKY',          'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Circus Ringmaster Labubu',      'CIRCUS-LABUBU',            'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Clown Labubu',                  'CLOWN-LABUBU',             'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Cloud Traveler Dimoo',          'CLOUD-DIMOO',              'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Flower Elf Labubu',             'FLOWER-ELF-LABUBU',        'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Forest Baby Pucky',             'FOREST-PUCKY',             'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Gothic Dress Kuromi',           'GOTHIC-KUROMI',            'common',   12.00, 15.00,  7.00, 'Sanrio'),
(uuid_generate_v4(), 'Ice Cream Labubu',              'ICE-CREAM-LABUBU',         'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Milk Tea Cinnamoroll',          'MILK-TEA-CINNAMOROLL',     'common',   12.00, 15.00,  7.00, 'Sanrio'),
(uuid_generate_v4(), 'Monster Baby Pucky',            'MONSTER-PUCKY',            'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Moonlight Dimoo',               'MOONLIGHT-DIMOO',          'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Pajama Time Pompompurin',       'PAJAMA-MUMUPURIN',        'common',   12.00, 15.00,  7.00, 'Sanrio'),
(uuid_generate_v4(), 'Party Queen Kuromi',            'PARTY-KUROMI',             'common',   12.00, 15.00,  7.00, 'Sanrio'),
(uuid_generate_v4(), 'Pisces Molly',                  'PISCES-MOLLY',             'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Planet Explorer Dimoo',         'PLANET-DIMOO',             'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Pudding Chef Pompompurin',      'PUDDING-MUMUPURIN',       'common',   12.00, 15.00,  7.00, 'Sanrio'),
(uuid_generate_v4(), 'Rainy Day Keroppi',             'RAINY-KEROPPI',            'common',   12.00, 15.00,  7.00, 'Sanrio'),
(uuid_generate_v4(), 'Retro TV Molly',                'RETRO-MOLLY',              'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Rock Star Badtz-Maru',          'ROCKSTAR-BADTZ',           'common',   12.00, 15.00,  7.00, 'Sanrio'),
(uuid_generate_v4(), 'Rose Elf Labubu',               'ROSE-ELF-LABUBU',          'common',   12.00, 15.00,  7.00, 'Pop Mart'),
(uuid_generate_v4(), 'Sakura Kimono Hello Kitty',     'SAKURA-HELLO-KITTY',       'common',   12.00, 15.00,  7.00, 'Sanrio'),
(uuid_generate_v4(), 'Schoolgirl Molly',              'SCHOOLGIRL-MOLLY',         'common',   12.00, 15.00,  7.00, 'Pop Mart'),

-- UNCOMMON (13 items) — buyback $22 | COGS $12.00 | resale ~$35
(uuid_generate_v4(), 'Shadow Labubu',                 'SHADOW-LABUBU',            'uncommon', 12.00, 35.00, 22.00, 'Pop Mart'),
(uuid_generate_v4(), 'Sky Angel Cinnamoroll',         'SKY-ANGEL-CINNAMOROLL',    'uncommon', 12.00, 35.00, 22.00, 'Sanrio'),
(uuid_generate_v4(), 'Sleeping Baby Pucky',           'SLEEPING-PUCKY',           'uncommon', 12.00, 35.00, 22.00, 'Pop Mart'),
(uuid_generate_v4(), 'Sleeping Deer Dimoo',           'SLEEPING-DIMOO',           'uncommon', 12.00, 35.00, 22.00, 'Pop Mart'),
(uuid_generate_v4(), 'Space Bunny Dimoo',             'SPACE-BUNNY-DIMOO',        'uncommon', 12.00, 35.00, 22.00, 'Pop Mart'),
(uuid_generate_v4(), 'Space Molly',                   'SPACE-MOLLY',              'uncommon', 12.00, 35.00, 22.00, 'Pop Mart'),
(uuid_generate_v4(), 'Stargazer Dimoo',               'STARGAZER-DIMOO',          'uncommon', 12.00, 35.00, 22.00, 'Pop Mart'),
(uuid_generate_v4(), 'Starry Night Little Twin Stars','STARRY-TWIN-STARS',        'uncommon', 12.00, 35.00, 22.00, 'Sanrio'),
(uuid_generate_v4(), 'Strawberry Dress Hello Kitty',  'STRAWBERRY-HELLO-KITTY',   'uncommon', 12.00, 35.00, 22.00, 'Sanrio'),
(uuid_generate_v4(), 'Strawberry Macaron Labubu',     'STRAWBERRY-LABUBU',        'uncommon', 12.00, 35.00, 22.00, 'Pop Mart'),
(uuid_generate_v4(), 'Sweet Tooth Labubu',            'SWEET-TOOTH-LABUBU',       'uncommon', 12.00, 35.00, 22.00, 'Pop Mart'),
(uuid_generate_v4(), 'Tea Party My Melody',           'TEA-PARTY-MY-MELODY',      'uncommon', 12.00, 35.00, 22.00, 'Sanrio'),
(uuid_generate_v4(), 'Winter Coat Tuxedosam',         'WINTER-TUXEDOSAM',         'uncommon', 12.00, 35.00, 22.00, 'Sanrio'),

-- RARE (5 items) — buyback $40 | COGS $12.00 | resale ~$60
-- Note: secondary market top-up cost ~$60-100 if stock depletes
(uuid_generate_v4(), 'The Awakening Skullpanda',      'AWAKENING-SKULLPANDA',     'rare',     12.00, 60.00, 40.00, 'Pop Mart'),
(uuid_generate_v4(), 'The Grief Skullpanda',          'GRIEF-SKULLPANDA',         'rare',     12.00, 60.00, 40.00, 'Pop Mart'),
(uuid_generate_v4(), 'The Joy Skullpanda',            'JOY-SKULLPANDA',           'rare',     12.00, 60.00, 40.00, 'Pop Mart'),
(uuid_generate_v4(), 'The Obsession Skullpanda',      'OBSESSION-SKULLPANDA',     'rare',     12.00, 60.00, 40.00, 'Pop Mart'),
(uuid_generate_v4(), 'The Riddle Skullpanda',         'RIDDLE-SKULLPANDA',        'rare',     12.00, 60.00, 40.00, 'Pop Mart'),

-- ULTRA (2 items) — buyback $80 | COGS $12.00 | resale ~$200
-- Note: secondary market top-up cost ~$150-300 if stock depletes
(uuid_generate_v4(), 'The Other One Hirono',          'OTHER-ONE-HIRONO',         'ultra',    12.00, 200.00, 80.00, 'Pop Mart'),
(uuid_generate_v4(), 'The Warmth Skullpanda',         'WARMTH-SKULLPANDA',        'ultra',    12.00, 200.00, 80.00, 'Pop Mart');

-- ============================================================
-- INVENTORY — seed stock quantities matching BoxContents.tsx
-- Common: 28 each | Uncommon: 10 each | Rare: 5 each | Ultra: 2-3 each
-- ============================================================

INSERT INTO public.inventory (product_id, quantity_available)
SELECT
  p.id,
  CASE
    WHEN p.rarity = 'common'   THEN 28
    WHEN p.rarity = 'uncommon' THEN 10
    WHEN p.rarity = 'rare'     THEN 5
    WHEN p.rarity = 'ultra'    THEN
      CASE p.sku
        WHEN 'OTHER-ONE-HIRONO'  THEN 2
        WHEN 'WARMTH-SKULLPANDA' THEN 3
        ELSE 2
      END
  END
FROM public.products p;

-- ============================================================
-- VERIFY — after running, check counts:
--   SELECT rarity, COUNT(*) as products, SUM(i.quantity_available) as stock
--   FROM products p JOIN inventory i ON p.id = i.product_id
--   GROUP BY rarity ORDER BY rarity;
-- Expected:
--   common   | 30 | 840
--   uncommon | 13 | 130
--   rare     |  5 |  25
--   ultra    |  2 |   5
-- Total: 50 products | 1,000 units in stock
-- ============================================================

-- TO RUN IN SUPABASE: paste this entire file into the SQL editor and execute.
-- Also run this to update the open_mystery_box function box price:
--   (schema-v2.sql line with v_box_price should be 25.00)

-- ADMIN USER SETUP (run separately after signup):
--   UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';

-- SECONDARY MARKET RESTOCK ALERT:
-- When rare/ultra stock drops below 2, restock before depleting completely.
-- Rare restock budget: up to $60/unit from secondary (still profitable vs. $50 buyback cap)
-- Ultra restock budget: up to $110/unit from secondary (still profitable vs. $100 buyback cap)
-- If secondary price exceeds these thresholds, consider pausing that rarity tier.
