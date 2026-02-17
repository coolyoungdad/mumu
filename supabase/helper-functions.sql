-- Helper function to credit user balance
CREATE OR REPLACE FUNCTION credit_user_balance(p_user_id UUID, p_amount DECIMAL(10, 2))
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_new_balance DECIMAL(10, 2);
BEGIN
  UPDATE public.users
  SET account_balance = account_balance + p_amount
  WHERE id = p_user_id
  RETURNING account_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
