# Supabase 資料庫結構設計

## 資料表設計

### 1. stores (店家資料表)

儲存所有外送店家的基本資訊。

```sql
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_open BOOLEAN DEFAULT false,
  order_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_stores_is_open ON stores(is_open);
CREATE INDEX idx_stores_created_at ON stores(created_at);
```

**欄位說明：**

- `id`: 店家唯一識別碼 (UUID)
- `name`: 店家名稱
- `is_open`: 是否開放接單
- `order_deadline`: 最後下單時間
- `created_at`: 建立時間
- `updated_at`: 更新時間

---

### 2. orders (訂單資料表)

儲存所有訂單的詳細資訊。

```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  order_type VARCHAR(20) NOT NULL DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'ride')),
  order_time TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- 外送訂單專用欄位
  pickup_time TIMESTAMP WITH TIME ZONE,
  pickup_location VARCHAR(500),
  pickup_name VARCHAR(100) NOT NULL,
  pickup_code VARCHAR(4) NOT NULL,
  pickup_phone VARCHAR(20) NOT NULL,
  menu_items TEXT,
  menu_image_url TEXT,

  -- 接送訂單專用欄位
  meeting_time TIMESTAMP WITH TIME ZONE,
  start_location VARCHAR(500),
  end_location VARCHAR(500),

  -- 共用欄位
  cost DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- 確保外送訂單必須有相關欄位
  CONSTRAINT check_delivery_fields CHECK (
    order_type != 'delivery' OR (
      pickup_time IS NOT NULL AND
      pickup_location IS NOT NULL AND
      store_id IS NOT NULL
    )
  ),

  -- 確保接送訂單必須有相關欄位
  CONSTRAINT check_ride_fields CHECK (
    order_type != 'ride' OR (
      meeting_time IS NOT NULL AND
      start_location IS NOT NULL AND
      end_location IS NOT NULL
    )
  )
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_order_time ON orders(order_time);
CREATE INDEX idx_orders_pickup_time ON orders(pickup_time);
CREATE INDEX idx_orders_meeting_time ON orders(meeting_time);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX idx_orders_pickup_code ON orders(pickup_code);
```

**欄位說明：**

- `id`: 訂單唯一識別碼 (UUID)
- `store_id`: 店家 ID (外鍵參照 stores.id，接送訂單可為 NULL)
- `order_type`: 訂單類型（delivery=外送 / ride=接送）
- `order_time`: 下訂時間

**外送訂單專用欄位：**

- `pickup_time`: 預計取貨時間
- `pickup_location`: 取貨地點
- `pickup_name`: 取貨人暱稱
- `pickup_code`: 取貨密碼（四碼）
- `pickup_phone`: 取貨人手機
- `menu_items`: 餐點內容描述
- `menu_image_url`: 菜單圖片 URL

**接送訂單專用欄位：**

- `meeting_time`: 碰面時間
- `start_location`: 起點
- `end_location`: 終點

**共用欄位：**

- `pickup_name`: 聯絡人暱稱
- `pickup_code`: 取貨/接送密碼（四碼）
- `pickup_phone`: 聯絡人手機
- `cost`: 成本金額
- `shipping_fee`: 運費/服務費
- `total_amount`: 總金額（成本 + 運費）
- `payment_status`: 付款狀態（pending=待付款 / paid=已付款 / refunded=已退款）
- `delivery_status`: 訂單狀態（pending=待處理 / preparing=準備中 / ready=已就緒 / completed=已完成 / cancelled=已取消）
- `created_at`: 建立時間
- `updated_at`: 更新時間

---

## Row Level Security (RLS) 設定

為了保護資料安全，建議啟用 RLS 並設定適當的存取政策。

### 啟用 RLS

```sql
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

### 設定存取政策

```sql
-- stores 資料表政策
-- 允許所有人查看開放接單的店家
CREATE POLICY "Allow public read open stores" ON stores
  FOR SELECT
  USING (is_open = true);

-- 允許已驗證用戶查看所有店家
CREATE POLICY "Allow authenticated users to read all stores" ON stores
  FOR SELECT
  TO authenticated
  USING (true);

-- 允許已驗證用戶新增店家
CREATE POLICY "Allow authenticated users to insert stores" ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 允許已驗證用戶更新店家
CREATE POLICY "Allow authenticated users to update stores" ON stores
  FOR UPDATE
  TO authenticated
  USING (true);

-- orders 資料表政策
-- 允許匿名使用者新增訂單
CREATE POLICY "Allow anonymous users to insert orders" ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 允許匿名使用者透過取貨密碼和手機號碼查詢自己的訂單
CREATE POLICY "Allow anonymous users to read own orders by code" ON orders
  FOR SELECT
  TO anon
  USING (
    pickup_code IS NOT NULL AND
    pickup_phone IS NOT NULL
  );

-- 允許已驗證用戶查看所有訂單(管理員)
CREATE POLICY "Allow authenticated users to read all orders" ON orders
  FOR SELECT
  TO authenticated
  USING (true);

-- 允許已驗證用戶更新訂單(管理員)
CREATE POLICY "Allow authenticated users to update orders" ON orders
  FOR UPDATE
  TO authenticated
  USING (true);
```

---

## Trigger 設定（自動更新 updated_at）

```sql
-- 建立更新時間戳記的函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為 stores 資料表建立 trigger
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 為 orders 資料表建立 trigger
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 如何在 Supabase 中執行

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇您的專案
3. 點選左側選單的「SQL Editor」
4. 依序複製並執行上述 SQL 指令
5. 執行順序：
   - 先建立資料表
   - 再建立索引
   - 然後啟用 RLS
   - 接著設定存取政策
   - 最後建立 trigger

---

## 測試資料

您可以使用以下 SQL 新增測試資料：

```sql
-- 新增測試店家
INSERT INTO stores (name, is_open, order_deadline) VALUES
('麥當勞', true, now() + interval '7 days'),
('肯德基', true, now() + interval '5 days'),
('星巴克', false, null);

-- 新增測試外送訂單（請先確認 store_id）
INSERT INTO orders (
  order_type,
  store_id,
  pickup_time,
  pickup_location,
  pickup_name,
  pickup_code,
  pickup_phone,
  cost,
  shipping_fee,
  total_amount,
  payment_status,
  delivery_status
) VALUES (
  'delivery',
  '您的-store-id-在這裡',
  now() + interval '2 hours',
  '志學車站',
  '王小明',
  '1234',
  '0912345678',
  150.00,
  30.00,
  180.00,
  'paid',
  'preparing'
);

-- 新增測試接送訂單
INSERT INTO orders (
  order_type,
  meeting_time,
  start_location,
  end_location,
  pickup_name,
  pickup_code,
  pickup_phone,
  cost,
  shipping_fee,
  total_amount,
  payment_status,
  delivery_status
) VALUES (
  'ride',
  now() + interval '3 hours',
  '花蓮火車站',
  '東華大學',
  '李小華',
  '5678',
  '0923456789',
  0.00,
  100.00,
  100.00,
  'pending',
  'pending'
);
```

---

## 注意事項

1. **UUID 生成**: 使用 `gen_random_uuid()` 自動生成 UUID
2. **外鍵約束**: orders.store_id 參照 stores.id，使用 CASCADE 刪除
3. **CHECK 約束**: payment_status 和 delivery_status 限制只能使用指定的值
4. **時間戳記**: 使用 `TIMESTAMP WITH TIME ZONE` 來正確處理時區
5. **索引優化**: 針對常用查詢欄位建立索引以提升效能
6. **RLS 安全性**: 確保只有已登入的管理員可以存取敏感資料
