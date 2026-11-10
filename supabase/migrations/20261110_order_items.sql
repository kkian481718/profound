ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS items jsonb;

COMMENT ON COLUMN public.orders.items IS '商品明細 [{name, unit_price, quantity}]（per_item 運費模式的訂單才有值）';
