-- Seed data for PomPom V2
-- Common items: 12 SKUs @ $6 COGS / $8 resale / $25 buyback
INSERT INTO public.products (name, sku, rarity, wholesale_cost, resale_value, buyback_price, description) VALUES
  ('Wireless Earbuds', 'COM-001', 'common', 6.00, 8.00, 25.00, 'Premium wireless earbuds with noise cancellation'),
  ('Phone PopSocket', 'COM-002', 'common', 6.00, 8.00, 25.00, 'Stylish phone grip and stand'),
  ('USB-C Cable (3ft)', 'COM-003', 'common', 6.00, 8.00, 25.00, 'Fast charging USB-C cable'),
  ('Sticker Pack (10pc)', 'COM-004', 'common', 6.00, 8.00, 25.00, 'Trendy vinyl sticker collection'),
  ('Phone Ring Holder', 'COM-005', 'common', 6.00, 8.00, 25.00, 'Rotating phone ring holder'),
  ('Keychain Flashlight', 'COM-006', 'common', 6.00, 8.00, 25.00, 'Compact LED keychain light'),
  ('Cable Organizer Set', 'COM-007', 'common', 6.00, 8.00, 25.00, 'Keep cables tidy and organized'),
  ('Screen Cleaner Kit', 'COM-008', 'common', 6.00, 8.00, 25.00, 'Microfiber cloth and spray'),
  ('Phone Stand', 'COM-009', 'common', 6.00, 8.00, 25.00, 'Adjustable phone stand'),
  ('Notebook Set', 'COM-010', 'common', 6.00, 8.00, 25.00, 'Premium lined notebooks'),
  ('Enamel Pin Set', 'COM-011', 'common', 6.00, 8.00, 25.00, 'Collectible enamel pins'),
  ('Tote Bag', 'COM-012', 'common', 6.00, 8.00, 25.00, 'Reusable canvas tote');

-- Uncommon items: 5 SKUs @ $12 COGS / $18 resale / $50 buyback
INSERT INTO public.products (name, sku, rarity, wholesale_cost, resale_value, buyback_price, description) VALUES
  ('Bluetooth Speaker', 'UNC-001', 'uncommon', 12.00, 18.00, 50.00, 'Portable waterproof speaker'),
  ('Portable Charger 10000mAh', 'UNC-002', 'uncommon', 12.00, 18.00, 50.00, 'High-capacity power bank'),
  ('LED Desk Lamp', 'UNC-003', 'uncommon', 12.00, 18.00, 50.00, 'Adjustable LED desk lamp'),
  ('Thermal Water Bottle', 'UNC-004', 'uncommon', 12.00, 18.00, 50.00, 'Keeps drinks hot or cold'),
  ('Crossbody Bag', 'UNC-005', 'uncommon', 12.00, 18.00, 50.00, 'Stylish crossbody bag');

-- Rare items: 2 SKUs @ $20 COGS / $40 resale / $100 buyback
INSERT INTO public.products (name, sku, rarity, wholesale_cost, resale_value, buyback_price, description) VALUES
  ('Wireless Charging Pad', 'RAR-001', 'rare', 20.00, 40.00, 100.00, 'Fast wireless charging station'),
  ('Smart Watch Band Set', 'RAR-002', 'rare', 20.00, 40.00, 100.00, 'Premium watch band collection');

-- Ultra items: 1 SKU @ $50 COGS / $120 resale / $300 buyback
INSERT INTO public.products (name, sku, rarity, wholesale_cost, resale_value, buyback_price, description) VALUES
  ('Mechanical Keyboard', 'ULT-001', 'ultra', 50.00, 120.00, 300.00, 'RGB mechanical gaming keyboard');

-- Initialize inventory for all products (20 units each = 400 total)
INSERT INTO public.inventory (product_id, quantity_available)
SELECT id, 20 FROM public.products;

-- Note: Admin user should be created after auth signup
-- After signing up with Supabase Auth, run:
-- INSERT INTO public.users (id, email, role, account_balance)
-- VALUES ('your-user-id-here', 'admin@pompom.com', 'admin', 0.00);
