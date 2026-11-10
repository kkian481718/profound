ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS shipping_method text NOT NULL DEFAULT 'standard'
  CHECK (shipping_method IN ('standard', 'per_item'));

COMMENT ON COLUMN public.stores.shipping_method IS '運費計算模式：standard=原本金額比例制, per_item=件數制（首件30+其餘每件15）';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quantity integer;

COMMENT ON COLUMN public.orders.quantity IS '購買件數（per_item 運費模式的訂單才有值）';

UPDATE public.stores SET shipping_method = 'per_item'
WHERE name IN ('Costco線上購物', 'Costco');
