-- Function to reserve mystery boxes atomically
-- This prevents overselling by using row-level locks
CREATE OR REPLACE FUNCTION reserve_mystery_boxes(p_quantity INTEGER DEFAULT 1)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  rarity rarity_tier,
  resale_value DECIMAL(10, 2)
) AS $$
DECLARE
  v_product_id UUID;
  v_counter INTEGER := 0;
BEGIN
  -- Create temporary table to store selected products
  CREATE TEMP TABLE IF NOT EXISTS selected_products (
    id UUID,
    name TEXT,
    sku TEXT,
    rarity rarity_tier,
    resale_value DECIMAL(10, 2)
  ) ON COMMIT DROP;

  -- Select and reserve products
  WHILE v_counter < p_quantity LOOP
    -- Select a mystery box product
    v_product_id := select_mystery_box_product();

    IF v_product_id IS NULL THEN
      -- No more products available
      EXIT;
    END IF;

    -- Lock and decrement inventory atomically
    UPDATE public.inventory
    SET quantity_available = quantity_available - 1
    WHERE product_id = v_product_id AND quantity_available > 0;

    -- If update succeeded (row was found and updated)
    IF FOUND THEN
      -- Store product info
      INSERT INTO selected_products
      SELECT p.id, p.name, p.sku, p.rarity, p.resale_value
      FROM public.products p
      WHERE p.id = v_product_id;

      v_counter := v_counter + 1;
    END IF;
  END LOOP;

  -- Return selected products
  RETURN QUERY SELECT * FROM selected_products;
END;
$$ LANGUAGE plpgsql;
