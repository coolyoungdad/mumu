-- ============================================================
-- MIGRATION 009: Fix product_sku missing in box open functions
-- CRITICAL FIX: user_inventory requires product_sku but functions weren't providing it
-- ============================================================

-- Fix open_mystery_box to include product_sku
CREATE OR REPLACE FUNCTION open_mystery_box(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  product_id UUID,
  product_name TEXT,
  rarity rarity_tier,
  buyback_price DECIMAL(10, 2),
  resale_value DECIMAL(10, 2),
  new_balance DECIMAL(10, 2),
  inventory_item_id UUID
) AS $$
DECLARE
  v_box_price DECIMAL(10, 2) := 25.00;
  v_user_balance DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
  v_rarity rarity_tier;
  v_product_id UUID;
  v_product_name TEXT;
  v_product_sku TEXT;
  v_buyback_price DECIMAL(10, 2);
  v_resale_value DECIMAL(10, 2);
  v_inventory_item_id UUID;
  v_rand DECIMAL;
BEGIN
  -- Check balance
  SELECT account_balance INTO v_user_balance
  FROM public.users WHERE id = p_user_id FOR UPDATE;

  IF v_user_balance < v_box_price THEN
    RETURN QUERY SELECT false, 'Insufficient balance', NULL::UUID, NULL::TEXT,
                        NULL::rarity_tier, NULL::DECIMAL, NULL::DECIMAL,
                        v_user_balance, NULL::UUID;
    RETURN;
  END IF;

  -- Roll rarity with 60/30/9/1 distribution
  v_rand := random();

  IF v_rand < 0.01 THEN
    v_rarity := 'ultra';
  ELSIF v_rand < 0.10 THEN
    v_rarity := 'rare';
  ELSIF v_rand < 0.40 THEN
    v_rarity := 'uncommon';
  ELSE
    v_rarity := 'common';
  END IF;

  -- Select product from chosen rarity (NOW INCLUDING SKU)
  SELECT p.id, p.name, p.sku, p.buyback_price, p.resale_value
  INTO v_product_id, v_product_name, v_product_sku, v_buyback_price, v_resale_value
  FROM public.products p
  JOIN public.inventory i ON p.id = i.product_id
  WHERE p.rarity = v_rarity
    AND i.quantity_available > 0
  ORDER BY random()
  LIMIT 1;

  -- Fallback: if selected rarity out of stock, try any available
  IF v_product_id IS NULL THEN
    SELECT p.id, p.name, p.sku, p.rarity, p.buyback_price, p.resale_value
    INTO v_product_id, v_product_name, v_product_sku, v_rarity, v_buyback_price, v_resale_value
    FROM public.products p
    JOIN public.inventory i ON p.id = i.product_id
    WHERE i.quantity_available > 0
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Final check: completely out of stock
  IF v_product_id IS NULL THEN
    RETURN QUERY SELECT false, 'Out of stock', NULL::UUID, NULL::TEXT,
                        NULL::rarity_tier, NULL::DECIMAL, NULL::DECIMAL,
                        v_user_balance, NULL::UUID;
    RETURN;
  END IF;

  -- Deduct inventory
  UPDATE public.inventory
  SET quantity_available = quantity_available - 1
  WHERE product_id = v_product_id
    AND quantity_available > 0;

  -- Deduct box price
  UPDATE public.users
  SET account_balance = account_balance - v_box_price
  WHERE id = p_user_id
  RETURNING account_balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO public.balance_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -v_box_price, 'box_purchase', 'Mystery box opened');

  -- Add to user inventory (NOW INCLUDING SKU)
  INSERT INTO public.user_inventory (user_id, product_id, product_name, product_sku, buyback_price, status)
  VALUES (p_user_id, v_product_id, v_product_name, v_product_sku, v_buyback_price, 'kept')
  RETURNING id INTO v_inventory_item_id;

  RETURN QUERY SELECT true, 'Success', v_product_id, v_product_name,
                      v_rarity, v_buyback_price, v_resale_value,
                      v_new_balance, v_inventory_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix open_mystery_box_with_exclusions to include product_sku
CREATE OR REPLACE FUNCTION open_mystery_box_with_exclusions(
  p_user_id UUID,
  p_excluded_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  product_id UUID,
  product_name TEXT,
  rarity rarity_tier,
  buyback_price DECIMAL(10, 2),
  resale_value DECIMAL(10, 2),
  new_balance DECIMAL(10, 2),
  inventory_item_id UUID
) AS $$
DECLARE
  v_box_price DECIMAL(10, 2) := 25.00;
  v_user_balance DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
  v_rarity rarity_tier;
  v_product_id UUID;
  v_product_name TEXT;
  v_product_sku TEXT;
  v_buyback_price DECIMAL(10, 2);
  v_resale_value DECIMAL(10, 2);
  v_inventory_item_id UUID;
  v_rand DECIMAL;
BEGIN
  -- Check balance
  SELECT account_balance INTO v_user_balance
  FROM public.users WHERE id = p_user_id FOR UPDATE;

  IF v_user_balance < v_box_price THEN
    RETURN QUERY SELECT false, 'Insufficient balance', NULL::UUID, NULL::TEXT,
                        NULL::rarity_tier, NULL::DECIMAL, NULL::DECIMAL,
                        v_user_balance, NULL::UUID;
    RETURN;
  END IF;

  -- Roll rarity with 60/30/9/1 distribution
  v_rand := random();

  IF v_rand < 0.01 THEN
    v_rarity := 'ultra';
  ELSIF v_rand < 0.10 THEN
    v_rarity := 'rare';
  ELSIF v_rand < 0.40 THEN
    v_rarity := 'uncommon';
  ELSE
    v_rarity := 'common';
  END IF;

  -- Select product with exclusions (NOW INCLUDING SKU)
  SELECT p.id, p.name, p.sku, p.buyback_price, p.resale_value
  INTO v_product_id, v_product_name, v_product_sku, v_buyback_price, v_resale_value
  FROM public.products p
  JOIN public.inventory i ON p.id = i.product_id
  WHERE p.rarity = v_rarity
    AND i.quantity_available > 0
    AND (p_excluded_ids IS NULL OR p.id != ALL(p_excluded_ids))
  ORDER BY random()
  LIMIT 1;

  -- Fallback 1: Try any rarity with stock (excluding)
  IF v_product_id IS NULL THEN
    SELECT p.id, p.name, p.sku, p.rarity, p.buyback_price, p.resale_value
    INTO v_product_id, v_product_name, v_product_sku, v_rarity, v_buyback_price, v_resale_value
    FROM public.products p
    JOIN public.inventory i ON p.id = i.product_id
    WHERE i.quantity_available > 0
      AND (p_excluded_ids IS NULL OR p.id != ALL(p_excluded_ids))
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Fallback 2: Allow excluded items if no other option
  IF v_product_id IS NULL THEN
    SELECT p.id, p.name, p.sku, p.rarity, p.buyback_price, p.resale_value
    INTO v_product_id, v_product_name, v_product_sku, v_rarity, v_buyback_price, v_resale_value
    FROM public.products p
    JOIN public.inventory i ON p.id = i.product_id
    WHERE i.quantity_available > 0
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Final check: completely out of stock
  IF v_product_id IS NULL THEN
    RETURN QUERY SELECT false, 'Out of stock', NULL::UUID, NULL::TEXT,
                        NULL::rarity_tier, NULL::DECIMAL, NULL::DECIMAL,
                        v_user_balance, NULL::UUID;
    RETURN;
  END IF;

  -- Deduct inventory
  UPDATE public.inventory AS inv
  SET quantity_available = inv.quantity_available - 1
  WHERE inv.product_id = v_product_id
    AND inv.quantity_available > 0;

  -- Deduct box price
  UPDATE public.users
  SET account_balance = account_balance - v_box_price
  WHERE id = p_user_id
  RETURNING account_balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO public.balance_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -v_box_price, 'box_purchase', 'Mystery box opened');

  -- Add to user inventory (NOW INCLUDING SKU)
  INSERT INTO public.user_inventory (user_id, product_id, product_name, product_sku, buyback_price, status)
  VALUES (p_user_id, v_product_id, v_product_name, v_product_sku, v_buyback_price, 'kept')
  RETURNING id INTO v_inventory_item_id;

  RETURN QUERY SELECT true, 'Success', v_product_id, v_product_name,
                      v_rarity, v_buyback_price, v_resale_value,
                      v_new_balance, v_inventory_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
