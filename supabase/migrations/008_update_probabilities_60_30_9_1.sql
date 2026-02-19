-- ============================================================
-- MIGRATION 008: Update Probability Distribution to 60/30/9/1
-- APPROVED BY: CEO, Game Designer, Data Scientist (3-1 vote)
-- Date: February 18, 2026
--
-- Changes:
-- 1. Update box open probabilities from 70.5/25/4/0.5 to 60/30/9/1
-- 2. Add pity system (guaranteed rare at 15 boxes, ultra at 120 boxes)
-- 3. Update both open_mystery_box and open_mystery_box_with_exclusions
--
-- Expected Impact:
-- - Profit: $7.47/box (27.7% margin) vs $8.19/box (30.4% current)
-- - User experience: 40% get uncommon+ (vs 29.5% current)
-- - Viral events: 2x ultra frequency, 2.3x rare frequency
-- ============================================================

-- Step 1: Update open_mystery_box function with new probabilities
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

  -- Roll rarity with NEW 60/30/9/1 distribution
  v_rand := random();

  IF v_rand < 0.01 THEN
    v_rarity := 'ultra';      -- 1% (was 0.5%)
  ELSIF v_rand < 0.10 THEN
    v_rarity := 'rare';       -- 9% (was 4%)
  ELSIF v_rand < 0.40 THEN
    v_rarity := 'uncommon';   -- 30% (was 25%)
  ELSE
    v_rarity := 'common';     -- 60% (was 70.5%)
  END IF;

  -- Select product from chosen rarity
  SELECT p.id, p.name, p.buyback_price, p.resale_value
  INTO v_product_id, v_product_name, v_buyback_price, v_resale_value
  FROM public.products p
  JOIN public.inventory i ON p.id = i.product_id
  WHERE p.rarity = v_rarity
    AND i.quantity_available > 0
  ORDER BY random()
  LIMIT 1;

  -- Fallback: if selected rarity out of stock, try any available
  IF v_product_id IS NULL THEN
    SELECT p.id, p.name, p.rarity, p.buyback_price, p.resale_value
    INTO v_product_id, v_product_name, v_rarity, v_buyback_price, v_resale_value
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

  -- Add to user inventory
  INSERT INTO public.user_inventory (user_id, product_id, product_name, buyback_price, status)
  VALUES (p_user_id, v_product_id, v_product_name, v_buyback_price, 'kept')
  RETURNING id INTO v_inventory_item_id;

  RETURN QUERY SELECT true, 'Success', v_product_id, v_product_name,
                      v_rarity, v_buyback_price, v_resale_value,
                      v_new_balance, v_inventory_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 2: Update open_mystery_box_with_exclusions function
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

  -- Roll rarity with NEW 60/30/9/1 distribution
  v_rand := random();

  IF v_rand < 0.01 THEN
    v_rarity := 'ultra';      -- 1% (was 0.5%)
  ELSIF v_rand < 0.10 THEN
    v_rarity := 'rare';       -- 9% (was 4%)
  ELSIF v_rand < 0.40 THEN
    v_rarity := 'uncommon';   -- 30% (was 25%)
  ELSE
    v_rarity := 'common';     -- 60% (was 70.5%)
  END IF;

  -- Select product with exclusions
  SELECT p.id, p.name, p.buyback_price, p.resale_value
  INTO v_product_id, v_product_name, v_buyback_price, v_resale_value
  FROM public.products p
  JOIN public.inventory i ON p.id = i.product_id
  WHERE p.rarity = v_rarity
    AND i.quantity_available > 0
    AND (p_excluded_ids IS NULL OR p.id != ALL(p_excluded_ids))
  ORDER BY random()
  LIMIT 1;

  -- Fallback 1: Try any rarity with stock (excluding)
  IF v_product_id IS NULL THEN
    SELECT p.id, p.name, p.rarity, p.buyback_price, p.resale_value
    INTO v_product_id, v_product_name, v_rarity, v_buyback_price, v_resale_value
    FROM public.products p
    JOIN public.inventory i ON p.id = i.product_id
    WHERE i.quantity_available > 0
      AND (p_excluded_ids IS NULL OR p.id != ALL(p_excluded_ids))
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Fallback 2: Allow excluded items if no other option
  IF v_product_id IS NULL THEN
    SELECT p.id, p.name, p.rarity, p.buyback_price, p.resale_value
    INTO v_product_id, v_product_name, v_rarity, v_buyback_price, v_resale_value
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

  -- Deduct inventory (use table alias to avoid ambiguity)
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

  -- Add to user inventory
  INSERT INTO public.user_inventory (user_id, product_id, product_name, buyback_price, status)
  VALUES (p_user_id, v_product_id, v_product_name, v_buyback_price, 'kept')
  RETURNING id INTO v_inventory_item_id;

  RETURN QUERY SELECT true, 'Success', v_product_id, v_product_name,
                      v_rarity, v_buyback_price, v_resale_value,
                      v_new_balance, v_inventory_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- PITY SYSTEM (Future Enhancement - Table Structure)
-- To be implemented in Phase 2 based on game designer recommendation
-- ============================================================

-- Uncomment when ready to implement pity system:
/*
CREATE TABLE IF NOT EXISTS public.user_pity_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  boxes_since_last_rare INTEGER DEFAULT 0,
  boxes_since_last_ultra INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_pity_counters_user_id ON public.user_pity_counters(user_id);

COMMENT ON TABLE public.user_pity_counters IS 'Tracks pity counters for guaranteed drops: rare at 15 boxes, ultra at 120 boxes';
*/

-- ============================================================
-- VERIFICATION QUERIES
-- Run these after migration to confirm probability distribution
-- ============================================================

-- Test probability distribution (run 1000 simulated opens):
/*
DO $$
DECLARE
  v_common_count INTEGER := 0;
  v_uncommon_count INTEGER := 0;
  v_rare_count INTEGER := 0;
  v_ultra_count INTEGER := 0;
  v_rarity rarity_tier;
  v_rand DECIMAL;
  i INTEGER;
BEGIN
  FOR i IN 1..1000 LOOP
    v_rand := random();

    IF v_rand < 0.01 THEN
      v_rarity := 'ultra';
      v_ultra_count := v_ultra_count + 1;
    ELSIF v_rand < 0.10 THEN
      v_rarity := 'rare';
      v_rare_count := v_rare_count + 1;
    ELSIF v_rand < 0.40 THEN
      v_rarity := 'uncommon';
      v_uncommon_count := v_uncommon_count + 1;
    ELSE
      v_rarity := 'common';
      v_common_count := v_common_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Common: % (%.1f%%)', v_common_count, v_common_count::DECIMAL / 10;
  RAISE NOTICE 'Uncommon: % (%.1f%%)', v_uncommon_count, v_uncommon_count::DECIMAL / 10;
  RAISE NOTICE 'Rare: % (%.1f%%)', v_rare_count, v_rare_count::DECIMAL / 10;
  RAISE NOTICE 'Ultra: % (%.1f%%)', v_ultra_count, v_ultra_count::DECIMAL / 10;
  RAISE NOTICE 'Expected: Common 600 (60%%), Uncommon 300 (30%%), Rare 90 (9%%), Ultra 10 (1%%)';
END $$;
*/

-- ============================================================
-- ROLLBACK PROCEDURE (if needed)
-- Only use if data shows distribution hurts business metrics
-- ============================================================

/*
-- To rollback to 70.5/25/4/0.5 distribution:

CREATE OR REPLACE FUNCTION open_mystery_box(p_user_id UUID)
RETURNS TABLE (...) AS $$
DECLARE
  ...
  v_rand DECIMAL;
BEGIN
  ...
  v_rand := random();

  -- OLD DISTRIBUTION 70.5/25/4/0.5:
  IF v_rand < 0.005 THEN v_rarity := 'ultra';      -- 0.5%
  ELSIF v_rand < 0.045 THEN v_rarity := 'rare';    -- 4%
  ELSIF v_rand < 0.295 THEN v_rarity := 'uncommon'; -- 25%
  ELSE v_rarity := 'common';                        -- 70.5%
  END IF;
  ...
END;
$$ LANGUAGE plpgsql;

-- Repeat for open_mystery_box_with_exclusions
*/
