-- ============================================================
-- MIGRATION 007: Sellback Inventory Restoration + Shipping Fees
-- CRITICAL FIX: Sold-back items must return to inventory stock
-- FEATURE: Shipping fee tracking ($5 or free on $50+ balance)
-- ============================================================

-- Step 1: Fix sellback_item to restore inventory quantities
-- CRITICAL: Without this, every sellback permanently depletes inventory
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
  v_product_id UUID;
BEGIN
  -- Get buyback price, product_id, and verify ownership
  SELECT ui.buyback_price, ui.product_id INTO v_buyback_price, v_product_id
  FROM public.user_inventory ui
  WHERE ui.id = p_inventory_item_id
    AND ui.user_id = p_user_id
    AND ui.status = 'kept'
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

  -- CRITICAL FIX: Restore item to inventory stock
  UPDATE public.inventory
  SET quantity_available = quantity_available + 1
  WHERE product_id = v_product_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 2: Add shipping_fee column to user_inventory
-- Tracks actual shipping fee charged (can be $0 if balance >= $50)
ALTER TABLE public.user_inventory
ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10, 2) DEFAULT NULL;

-- Step 3: Add tracking_number column if not exists
ALTER TABLE public.user_inventory
ADD COLUMN IF NOT EXISTS tracking_number TEXT DEFAULT NULL;

COMMENT ON COLUMN public.user_inventory.shipping_fee IS 'Shipping fee charged when status changed to shipping_requested. NULL = not shipped, 0 = free shipping (balance >= $50), 5.00 = standard fee';
COMMENT ON COLUMN public.user_inventory.tracking_number IS 'USPS/UPS tracking number added by admin when item ships';

-- Step 4: Create low_inventory_alert view for admin dashboard
CREATE OR REPLACE VIEW low_inventory_items AS
SELECT
  p.id,
  p.name,
  p.sku,
  p.rarity,
  i.quantity_available,
  p.wholesale_cost,
  p.buyback_price,
  -- Alert level: critical (<5), warning (<10), low (<20)
  CASE
    WHEN i.quantity_available < 5 THEN 'critical'
    WHEN i.quantity_available < 10 THEN 'warning'
    WHEN i.quantity_available < 20 THEN 'low'
    ELSE 'ok'
  END as alert_level
FROM public.products p
JOIN public.inventory i ON p.id = i.product_id
WHERE i.quantity_available < 20
ORDER BY
  -- Sort: ultra first, then by quantity (lowest first)
  CASE p.rarity
    WHEN 'ultra' THEN 1
    WHEN 'rare' THEN 2
    WHEN 'uncommon' THEN 3
    WHEN 'common' THEN 4
  END,
  i.quantity_available ASC;

COMMENT ON VIEW low_inventory_items IS 'Shows items with quantity < 20, sorted by rarity and stock level. Critical = <5, Warning = <10, Low = <20';

-- ============================================================
-- VERIFICATION QUERIES (run after migration):
--
-- 1. Test sellback restoration:
--    SELECT * FROM inventory WHERE product_id = 'your-product-id';
--    -- Open a box, sell it back, check quantity_available increased
--
-- 2. Check low inventory:
--    SELECT * FROM low_inventory_items;
--
-- 3. Verify shipping columns:
--    SELECT shipping_fee, tracking_number FROM user_inventory LIMIT 5;
-- ============================================================
