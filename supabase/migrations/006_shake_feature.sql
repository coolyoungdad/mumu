-- Migration 006: Shake Feature
-- Run this in Supabase SQL Editor on your live database.
-- NOTE: ALTER TYPE ADD VALUE cannot run inside a transaction block.
--       Run the ALTER TYPE statement first, then the rest separately if needed.

-- Step 1: Add box_shake to transaction_type enum
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'box_shake';

-- Step 2: Function to atomically charge a user for a shake (with idempotency)
CREATE OR REPLACE FUNCTION charge_for_shake(
  p_user_id UUID,
  p_shake_price DECIMAL(10,2),
  p_idempotency_key TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_balance DECIMAL(10,2),
  already_charged BOOLEAN
) AS $$
DECLARE
  v_user_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_existing_id UUID;
BEGIN
  -- Idempotency check: if this key was already processed, return success
  SELECT id INTO v_existing_id
  FROM public.balance_transactions
  WHERE stripe_session_id = p_idempotency_key
    AND type = 'box_shake'
    AND user_id = p_user_id;

  IF v_existing_id IS NOT NULL THEN
    SELECT account_balance INTO v_new_balance FROM public.users WHERE id = p_user_id;
    RETURN QUERY SELECT true, 'Already charged', v_new_balance, true;
    RETURN;
  END IF;

  -- Lock user row and check balance
  SELECT account_balance INTO v_user_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_user_balance < p_shake_price THEN
    RETURN QUERY SELECT false, 'Insufficient balance', v_user_balance, false;
    RETURN;
  END IF;

  -- Deduct balance atomically
  UPDATE public.users
  SET account_balance = account_balance - p_shake_price
  WHERE id = p_user_id
  RETURNING account_balance INTO v_new_balance;

  -- Record transaction with idempotency key stored in stripe_session_id field
  INSERT INTO public.balance_transactions (user_id, amount, type, description, stripe_session_id)
  VALUES (p_user_id, -p_shake_price, 'box_shake', 'Shake elimination', p_idempotency_key);

  RETURN QUERY SELECT true, 'Charged successfully', v_new_balance, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 3: Open mystery box with product exclusions (for shake feature)
CREATE OR REPLACE FUNCTION open_mystery_box_with_exclusions(
  p_user_id UUID,
  p_excluded_ids UUID[]
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  rarity rarity_tier,
  buyback_price DECIMAL(10,2),
  inventory_item_id UUID,
  new_balance DECIMAL(10,2)
) AS $$
DECLARE
  v_box_price DECIMAL(10,2) := 25.00;
  v_user_balance DECIMAL(10,2);
  v_product_id UUID;
  v_product_name TEXT;
  v_product_sku TEXT;
  v_rarity rarity_tier;
  v_buyback_price DECIMAL(10,2);
  v_inventory_item_id UUID;
  v_new_balance DECIMAL(10,2);
  v_random DECIMAL(5,3);
  v_selected_rarity rarity_tier;
BEGIN
  -- Check user balance
  SELECT account_balance INTO v_user_balance
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_user_balance < v_box_price THEN
    RETURN QUERY SELECT false, 'Insufficient balance', NULL::UUID, NULL::TEXT, NULL::TEXT,
      NULL::rarity_tier, NULL::DECIMAL, NULL::UUID, v_user_balance;
    RETURN;
  END IF;

  -- Roll rarity (same weights as original)
  v_random := RANDOM();
  IF v_random < 0.705 THEN
    v_selected_rarity := 'common';
  ELSIF v_random < 0.955 THEN
    v_selected_rarity := 'uncommon';
  ELSIF v_random < 0.995 THEN
    v_selected_rarity := 'rare';
  ELSE
    v_selected_rarity := 'ultra';
  END IF;

  -- Get a product of selected rarity, excluding eliminated IDs
  SELECT p.id INTO v_product_id
  FROM public.products p
  INNER JOIN public.inventory i ON p.id = i.product_id
  WHERE p.rarity = v_selected_rarity
    AND i.quantity_available > 0
    AND (p_excluded_ids IS NULL OR p.id != ALL(p_excluded_ids))
  ORDER BY RANDOM()
  LIMIT 1;

  -- Fallback 1: rarity pool exhausted by exclusions — pick any non-excluded product
  IF v_product_id IS NULL THEN
    SELECT p.id INTO v_product_id
    FROM public.products p
    INNER JOIN public.inventory i ON p.id = i.product_id
    WHERE i.quantity_available > 0
      AND (p_excluded_ids IS NULL OR p.id != ALL(p_excluded_ids))
    ORDER BY RANDOM()
    LIMIT 1;
  END IF;

  -- Fallback 2: everything excluded (shouldn't happen, ultras are never excluded)
  IF v_product_id IS NULL THEN
    SELECT p.id INTO v_product_id
    FROM public.products p
    INNER JOIN public.inventory i ON p.id = i.product_id
    WHERE i.quantity_available > 0
    ORDER BY RANDOM()
    LIMIT 1;
  END IF;

  IF v_product_id IS NULL THEN
    RETURN QUERY SELECT false, 'No products available', NULL::UUID, NULL::TEXT, NULL::TEXT,
      NULL::rarity_tier, NULL::DECIMAL, NULL::UUID, v_user_balance;
    RETURN;
  END IF;

  -- Get product details
  SELECT p.name, p.sku, p.rarity, p.buyback_price
  INTO v_product_name, v_product_sku, v_rarity, v_buyback_price
  FROM public.products p
  WHERE p.id = v_product_id;

  -- Deduct inventory (use table alias to avoid ambiguity with RETURNS TABLE column "product_id")
  UPDATE public.inventory AS inv
  SET quantity_available = inv.quantity_available - 1
  WHERE inv.product_id = v_product_id AND inv.quantity_available > 0;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Product out of stock', NULL::UUID, NULL::TEXT, NULL::TEXT,
      NULL::rarity_tier, NULL::DECIMAL, NULL::UUID, v_user_balance;
    RETURN;
  END IF;

  -- Deduct balance
  UPDATE public.users
  SET account_balance = account_balance - v_box_price
  WHERE id = p_user_id
  RETURNING account_balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO public.balance_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -v_box_price, 'box_purchase', 'Opened mystery box (post-shake)');

  -- Create user inventory item
  INSERT INTO public.user_inventory (user_id, product_id, product_name, product_sku, rarity, buyback_price, status)
  VALUES (p_user_id, v_product_id, v_product_name, v_product_sku, v_rarity, v_buyback_price, 'kept')
  RETURNING id INTO v_inventory_item_id;

  RETURN QUERY SELECT true, 'Box opened successfully', v_product_id, v_product_name,
    v_product_sku, v_rarity, v_buyback_price, v_inventory_item_id, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
