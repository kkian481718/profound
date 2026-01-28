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
  max_daily_orders INTEGER DEFAULT NULL,
  extra_shipping_fee DECIMAL(10, 2) DEFAULT NULL,
  extra_shipping_threshold DECIMAL(10, 2) DEFAULT NULL,
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
- `max_daily_orders`: 每日最大訂單數限制（NULL 表示無限制）
- `extra_shipping_fee`: 額外運費金額（遠程店家加收運費，NULL 表示不加收）
- `extra_shipping_threshold`: 免額外運費門檻（訂單金額超過此值不加收額外運費，NULL 表示無門檻限制）
- `created_at`: 建立時間
- `updated_at`: 更新時間

---

### 2. orders (訂單資料表)

儲存所有訂單的詳細資訊。

```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  store_name VARCHAR(255),
  order_time TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- 外送訂單欄位
  pickup_location VARCHAR(500) NOT NULL,
  pickup_name VARCHAR(100) NOT NULL,
  pickup_phone VARCHAR(20) NOT NULL,
  menu_items TEXT,
  menu_image_url TEXT,

  -- 費用相關欄位
  cost DECIMAL(10, 2) NOT NULL,
  dev_fee DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  shipping_fee DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'preparing', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- 確保外送訂單必須有相關欄位
  CONSTRAINT check_delivery_required_fields CHECK (
    pickup_location IS NOT NULL AND
    store_id IS NOT NULL AND
    pickup_name IS NOT NULL AND
    pickup_phone IS NOT NULL
  )
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_order_time ON orders(order_time);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_pickup_phone ON orders(pickup_phone);
```

**欄位說明：**

- `id`: 訂單唯一識別碼 (UUID)
- `store_id`: 店家 ID (外鍵參照 stores.id，必填)
- `store_name`: 店家名稱（冗餘欄位，方便同步/查詢）
- `order_time`: 下訂時間

**外送訂單欄位：**

- `pickup_location`: 取貨地點（必填）
- `pickup_name`: 取貨人暱稱（必填）
- `pickup_phone`: 取貨人手機（必填）
- `menu_items`: 餐點內容描述
- `menu_image_url`: 菜單圖片 URL

**費用相關欄位：**

- `cost`: 成本金額
- `dev_fee`: 開發費（固定10元）
- `shipping_fee`: 運費
- `total_amount`: 總金額（成本 + 開發費 + 運費）
- `order_status`: 訂單狀態（pending=待處理 / preparing=準備中 / completed=已完成）
- `created_at`: 建立時間
- `updated_at`: 更新時間

---

### 3. global_settings (全域設定資料表)

儲存系統全域設定，如每日最大訂單數等。

```sql
CREATE TABLE global_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_global_settings_key ON global_settings(setting_key);
```

**欄位說明：**

- `id`: 設定唯一識別碼 (UUID)
- `setting_key`: 設定鍵值（唯一）
- `setting_value`: 設定值
- `created_at`: 建立時間
- `updated_at`: 更新時間

---

## Row Level Security (RLS) 設定

為了保護資料安全，建議啟用 RLS 並設定適當的存取政策。

### 啟用 RLS

```sql
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
```

### 設定存取政策

```sql
-- stores 資料表政策
-- 允許所有人（包括匿名用戶）查看開放接單的店家
CREATE POLICY "Allow public read open stores" ON stores
  FOR SELECT
  TO public
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
  USING (true)
  WITH CHECK (true);

-- 允許已驗證用戶刪除店家
CREATE POLICY "Allow authenticated users to delete stores" ON stores
  FOR DELETE
  TO authenticated
  USING (true);

-- 允許所有人(包括匿名用戶)關閉過期的店家
CREATE POLICY "Allow public to close expired stores" ON stores
  FOR UPDATE
  TO public
  USING (
    is_open = true AND
    order_deadline IS NOT NULL AND
    order_deadline < NOW()
  )
  WITH CHECK (
    -- 允許更新後的狀態為關閉
    is_open = false AND
    -- 確保其他欄位沒有被修改(order_deadline 仍然是過去的時間)
    order_deadline IS NOT NULL
  );

-- orders 資料表政策
-- 允許所有人（包括匿名用戶）新增外送訂單
CREATE POLICY "Allow public to insert delivery orders" ON orders
  FOR INSERT
  TO public
  WITH CHECK (
    -- 確保有店家ID
    store_id IS NOT NULL AND
    -- 確保有必要的外送資訊
    pickup_location IS NOT NULL AND
    pickup_name IS NOT NULL AND
    pickup_phone IS NOT NULL
  );

-- 允許所有人（包括匿名用戶）透過手機號碼查詢訂單
CREATE POLICY "Allow public to read orders by phone" ON orders
  FOR SELECT
  TO public
  USING (
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
  USING (true)
  WITH CHECK (
    -- 更新後仍必須有店家ID
    store_id IS NOT NULL AND
    -- 更新後仍必須有必要的外送資訊
    pickup_location IS NOT NULL AND
    pickup_name IS NOT NULL AND
    pickup_phone IS NOT NULL
  );

-- global_settings 資料表政策
-- 允許已驗證用戶查看全域設定
CREATE POLICY "Allow authenticated users to read global settings" ON global_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- 允許已驗證用戶更新全域設定
CREATE POLICY "Allow authenticated users to update global settings" ON global_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 允許已驗證用戶新增全域設定
CREATE POLICY "Allow authenticated users to insert global settings" ON global_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
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

-- 為 global_settings 資料表建立 trigger
CREATE TRIGGER update_global_settings_updated_at BEFORE UPDATE ON global_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 如何在 Supabase 中執行

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇您的專案
3. 點選左側選單的「SQL Editor」
4. 依序複製並執行上述 SQL 指令
5. 執行順序：
   - 先建立資料表（stores, orders, global_settings）
   - 再建立索引
   - 然後啟用 RLS
   - 接著設定存取政策
   - 建立 trigger
   - 最後插入預設資料

---

## 測試資料

您可以使用以下 SQL 新增測試資料：

```sql
-- 新增測試店家
INSERT INTO stores (name, is_open, order_deadline, max_daily_orders) VALUES
('麥當勞', true, now() + interval '7 days', 50),
('肯德基', true, now() + interval '5 days', 30),
('星巴克', false, null, null);

-- 新增全域設定測試資料
INSERT INTO global_settings (setting_key, setting_value) VALUES
('max_daily_orders', '100')
ON CONFLICT (setting_key) DO NOTHING;

-- 新增測試外送訂單（請先確認 store_id）
INSERT INTO orders (
  store_id,
  pickup_location,
  pickup_name,
  pickup_phone,
  menu_items,
  cost,
  dev_fee,
  shipping_fee,
  total_amount,
  order_status
) VALUES (
  '您的-store-id-在這裡',
  '志學車站',
  '王小明',
  '0912345678',
  '大麥克套餐 x1, 薯條(大) x1',
  150.00,
  10.00,
  30.00,
  190.00,
  'preparing'
);

-- 測試資料說明：
-- 所有訂單都是外送訂單，必須包含店家ID和完整的外送資訊
-- 店家資料包含每日最大訂單數限制
-- 全域設定包含系統層級的每日最大訂單數限制
```

---

## 注意事項

1. **UUID 生成**: 使用 `gen_random_uuid()` 自動生成 UUID
2. **外鍵約束**: orders.store_id 參照 stores.id，使用 CASCADE 刪除
3. **CHECK 約束**: order_status 限制只能使用指定的值
4. **時間戳記**: 使用 `TIMESTAMP WITH TIME ZONE` 來正確處理時區
5. **索引優化**: 針對常用查詢欄位建立索引以提升效能
6. **RLS 安全性**: 確保只有已登入的管理員可以存取敏感資料
7. **訂單限制**: 支援店家層級和全域層級的每日訂單數量限制功能
8. **全域設定**: 使用 global_settings 表來儲存系統層級的設定值
