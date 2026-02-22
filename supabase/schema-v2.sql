-- MuMu Schema V2 - Balance-based Loot Box System
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE rarity_tier AS ENUM ('common', 'uncommon', 'rare', 'ultra');
CREATE TYPE inventory_status AS ENUM ('kept', 'shipped', 'sold');
CREATE TYPE transaction_type AS ENUM ('topup', 'box_purchase', 'sellback', 'shipping', 'refund');

-- Users table with account balance
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  account_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (account_balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Products table with buyback price
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  rarity rarity_tier NOT NULL,
  wholesale_cost DECIMAL(10, 2) NOT NULL,
  resale_value DECIMAL(10, 2) NOT NULL,
  buyback_price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inventory table (global stock)
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity_available INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(product_id)
);

-- User inventory (items user owns)
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  rarity rarity_tier NOT NULL,
  buyback_price DECIMAL(10, 2) NOT NULL,
  status inventory_status NOT NULL DEFAULT 'kept',
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  shipped_at TIMESTAMP WITH TIME ZONE,
  tracking_number TEXT,
  shipping_address JSONB
);

-- Balance transactions (ledger)
CREATE TABLE IF NOT EXISTS public.balance_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type transaction_type NOT NULL,
  description TEXT NOT NULL,
  stripe_session_id TEXT,
  related_inventory_id UUID REFERENCES public.user_inventory(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_products_rarity ON public.products(rarity);
CREATE INDEX idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_status ON public.user_inventory(status);
CREATE INDEX idx_balance_transactions_user_id ON public.balance_transactions(user_id);
CREATE INDEX idx_balance_transactions_type ON public.balance_transactions(type);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for products table
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for inventory table
CREATE POLICY "Anyone can view inventory" ON public.inventory
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage inventory" ON public.inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_inventory table
CREATE POLICY "Users can view own inventory" ON public.user_inventory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all inventory" ON public.user_inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can create inventory items" ON public.user_inventory
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own inventory" ON public.user_inventory
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for balance_transactions table
CREATE POLICY "Users can view own transactions" ON public.balance_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.balance_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can create transactions" ON public.balance_transactions
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to open a mystery box (atomic)
CREATE OR REPLACE FUNCTION open_mystery_box(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  rarity rarity_tier,
  buyback_price DECIMAL(10, 2),
  inventory_item_id UUID,
  new_balance DECIMAL(10, 2)
) AS $$
DECLARE
  v_box_price DECIMAL(10, 2) := 25.00;
  v_user_balance DECIMAL(10, 2);
  v_product_id UUID;
  v_product_name TEXT;
  v_product_sku TEXT;
  v_rarity rarity_tier;
  v_buyback_price DECIMAL(10, 2);
  v_inventory_item_id UUID;
  v_new_balance DECIMAL(10, 2);
BEGIN
  -- Check user balance
  SELECT account_balance INTO v_user_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_user_balance < v_box_price THEN
    RETURN QUERY SELECT false, 'Insufficient balance', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::rarity_tier, NULL::DECIMAL, NULL::UUID, v_user_balance;
    RETURN;
  END IF;

  -- Select random product
  v_product_id := select_mystery_box_product();

  IF v_product_id IS NULL THEN
    RETURN QUERY SELECT false, 'No products available', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::rarity_tier, NULL::DECIMAL, NULL::UUID, v_user_balance;
    RETURN;
  END IF;

  -- Get product details
  SELECT p.name, p.sku, p.rarity, p.buyback_price
  INTO v_product_name, v_product_sku, v_rarity, v_buyback_price
  FROM public.products p
  WHERE p.id = v_product_id;

  -- Deduct inventory
  UPDATE public.inventory
  SET quantity_available = quantity_available - 1
  WHERE product_id = v_product_id AND quantity_available > 0;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Product out of stock', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::rarity_tier, NULL::DECIMAL, NULL::UUID, v_user_balance;
    RETURN;
  END IF;

  -- Deduct balance
  UPDATE public.users
  SET account_balance = account_balance - v_box_price
  WHERE id = p_user_id
  RETURNING account_balance INTO v_new_balance;

  -- Create transaction record
  INSERT INTO public.balance_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -v_box_price, 'box_purchase', 'Opened mystery box');

  -- Create temporary inventory item (user hasn't decided to keep/sell yet)
  INSERT INTO public.user_inventory (user_id, product_id, product_name, product_sku, rarity, buyback_price, status)
  VALUES (p_user_id, v_product_id, v_product_name, v_product_sku, v_rarity, v_buyback_price, 'kept')
  RETURNING id INTO v_inventory_item_id;

  RETURN QUERY SELECT true, 'Box opened successfully', v_product_id, v_product_name, v_product_sku, v_rarity, v_buyback_price, v_inventory_item_id, v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to sell back an item
CREATE OR REPLACE FUNCTION sellback_item(p_user_id UUID, p_inventory_item_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  amount_credited DECIMAL(10, 2),
  new_balance DECIMAL(10, 2)
) AS $$
DECLARE
  v_buyback_price DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
BEGIN
  -- Get buyback price and verify ownership
  SELECT buyback_price INTO v_buyback_price
  FROM public.user_inventory
  WHERE id = p_inventory_item_id AND user_id = p_user_id AND status = 'kept'
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT account_balance INTO v_new_balance FROM public.users WHERE id = p_user_id;
    RETURN QUERY SELECT false, 'Item not found or already sold', 0::DECIMAL, v_new_balance;
    RETURN;
  END IF;

  -- Update inventory item status
  UPDATE public.user_inventory
  SET status = 'sold'
  WHERE id = p_inventory_item_id;

  -- Credit user balance
  UPDATE public.users
  SET account_balance = account_balance + v_buyback_price
  WHERE id = p_user_id
  RETURNING account_balance INTO v_new_balance;

  -- Create transaction record
  INSERT INTO public.balance_transactions (user_id, amount, type, description, related_inventory_id)
  VALUES (p_user_id, v_buyback_price, 'sellback', 'Sold item back', p_inventory_item_id);

  RETURN QUERY SELECT true, 'Item sold successfully', v_buyback_price, v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to get random product by rarity
CREATE OR REPLACE FUNCTION get_random_product_by_rarity(p_rarity rarity_tier)
RETURNS UUID AS $$
DECLARE
  v_product_id UUID;
BEGIN
  SELECT p.id INTO v_product_id
  FROM public.products p
  INNER JOIN public.inventory i ON p.id = i.product_id
  WHERE p.rarity = p_rarity AND i.quantity_available > 0
  ORDER BY RANDOM()
  LIMIT 1;

  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to select mystery box product with weighted rarity
CREATE OR REPLACE FUNCTION select_mystery_box_product()
RETURNS UUID AS $$
DECLARE
  v_random DECIMAL(5, 3);
  v_rarity rarity_tier;
  v_product_id UUID;
BEGIN
  v_random := RANDOM();

  IF v_random < 0.705 THEN
    v_rarity := 'common';
  ELSIF v_random < 0.955 THEN
    v_rarity := 'uncommon';
  ELSIF v_random < 0.995 THEN
    v_rarity := 'rare';
  ELSE
    v_rarity := 'ultra';
  END IF;

  v_product_id := get_random_product_by_rarity(v_rarity);

  IF v_product_id IS NULL THEN
    SELECT p.id INTO v_product_id
    FROM public.products p
    INNER JOIN public.inventory i ON p.id = i.product_id
    WHERE i.quantity_available > 0
    ORDER BY RANDOM()
    LIMIT 1;
  END IF;

  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql;
