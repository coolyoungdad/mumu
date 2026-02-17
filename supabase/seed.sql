-- Seed initial product data
-- Common items: 12 SKUs @ $6 COGS / $8 resale (60% odds)
INSERT INTO public.products (name, sku, rarity, wholesale_cost, resale_value) VALUES
  ('Wireless Earbuds', 'COM-001', 'common', 6.00, 8.00),
  ('Phone PopSocket', 'COM-002', 'common', 6.00, 8.00),
  ('USB-C Cable (3ft)', 'COM-003', 'common', 6.00, 8.00),
  ('Sticker Pack (10pc)', 'COM-004', 'common', 6.00, 8.00),
  ('Phone Ring Holder', 'COM-005', 'common', 6.00, 8.00),
  ('Keychain Flashlight', 'COM-006', 'common', 6.00, 8.00),
  ('Cable Organizer Set', 'COM-007', 'common', 6.00, 8.00),
  ('Screen Cleaner Kit', 'COM-008', 'common', 6.00, 8.00),
  ('Phone Stand', 'COM-009', 'common', 6.00, 8.00),
  ('Notebook Set', 'COM-010', 'common', 6.00, 8.00),
  ('Enamel Pin Set', 'COM-011', 'common', 6.00, 8.00),
  ('Tote Bag', 'COM-012', 'common', 6.00, 8.00);

-- Uncommon items: 5 SKUs @ $12 COGS / $18 resale (25% odds)
INSERT INTO public.products (name, sku, rarity, wholesale_cost, resale_value) VALUES
  ('Bluetooth Speaker', 'UNC-001', 'uncommon', 12.00, 18.00),
  ('Portable Charger 10000mAh', 'UNC-002', 'uncommon', 12.00, 18.00),
  ('LED Desk Lamp', 'UNC-003', 'uncommon', 12.00, 18.00),
  ('Thermal Water Bottle', 'UNC-004', 'uncommon', 12.00, 18.00),
  ('Crossbody Bag', 'UNC-005', 'uncommon', 12.00, 18.00);

-- Rare items: 2 SKUs @ $20 COGS / $40 resale (10% odds)
INSERT INTO public.products (name, sku, rarity, wholesale_cost, resale_value) VALUES
  ('Wireless Charging Pad', 'RAR-001', 'rare', 20.00, 40.00),
  ('Smart Watch Band Set', 'RAR-002', 'rare', 20.00, 40.00);

-- Ultra items: 1 SKU @ $50 COGS / $120 resale (5% odds)
INSERT INTO public.products (name, sku, rarity, wholesale_cost, resale_value) VALUES
  ('Mechanical Keyboard', 'ULT-001', 'ultra', 50.00, 120.00);

-- Initialize inventory for all products (20 units each = 400 total)
INSERT INTO public.inventory (product_id, quantity_available)
SELECT id, 20 FROM public.products;

-- Create an admin user (you'll need to update this after creating your actual auth user)
-- After signing up with Supabase Auth, run this with your actual user ID:
-- INSERT INTO public.users (id, email, role) VALUES ('your-user-id-here', 'admin@pompom.com', 'admin');
