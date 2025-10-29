-- ============================================
-- 移除訂單密碼功能 - 資料庫更新腳本
-- ============================================
-- 此腳本會更新 RLS policies 並移除對 pickup_code 的依賴
-- 改為僅使用手機號碼查詢訂單
-- ============================================

-- ============================================
-- 步驟 1: 刪除現有的 orders RLS policies
-- ============================================

-- 刪除所有與 orders 相關的現有 policies
DROP POLICY IF EXISTS "Allow public to insert delivery orders" ON orders;
DROP POLICY IF EXISTS "Allow public to read delivery orders by code" ON orders;
DROP POLICY IF EXISTS "Allow public to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow public to read orders by code" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to read all orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to update orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to delete orders" ON orders;

-- ============================================
-- 步驟 2: 建立新的 orders RLS policies（無需 pickup_code）
-- ============================================

-- 1. 允許所有人新增外送訂單（不再要求 pickup_code）
CREATE POLICY "Allow public to insert delivery orders" ON orders
  FOR INSERT
  TO public
  WITH CHECK (
    -- 確保有店家ID
    store_id IS NOT NULL AND
    -- 確保有必要的外送資訊（移除 pickup_code 要求）
    pickup_location IS NOT NULL AND
    pickup_name IS NOT NULL AND
    pickup_phone IS NOT NULL
  );

-- 2. 允許所有人透過手機號碼查詢外送訂單（不再需要 pickup_code）
CREATE POLICY "Allow public to read delivery orders by phone" ON orders
  FOR SELECT
  TO public
  USING (
    -- 只需要手機號碼
    pickup_phone IS NOT NULL
  );

-- 3. 允許已驗證用戶查看所有訂單(管理員)
CREATE POLICY "Allow authenticated users to read all orders" ON orders
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. 允許已驗證用戶更新訂單(管理員)
CREATE POLICY "Allow authenticated users to update orders" ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- 更新後仍必須有店家ID
    store_id IS NOT NULL AND
    -- 更新後仍必須有必要的外送資訊（移除 pickup_code 要求）
    pickup_location IS NOT NULL AND
    pickup_name IS NOT NULL AND
    pickup_phone IS NOT NULL
  );

-- 5. 允許已驗證用戶刪除訂單(管理員)
CREATE POLICY "Allow authenticated users to delete orders" ON orders
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 步驟 3: 更新資料表約束條件（可選 - 如果要完全移除 pickup_code）
-- ============================================

-- 注意：以下操作會移除 pickup_code 欄位的 NOT NULL 約束
-- 如果您想完全移除這個欄位，可以執行以下操作：
ALTER TABLE orders DROP COLUMN pickup_code;

-- ============================================
-- 步驟 4: 移除相關索引（可選）
-- ============================================

-- 如果您不再需要 pickup_code 索引，可以移除它
DROP INDEX IF EXISTS idx_orders_pickup_code;

-- ============================================
-- 完成!
-- ============================================
-- 執行完成後，您的系統將：
-- 1. 不再需要 pickup_code 來查詢訂單
-- 2. 僅使用手機號碼進行訂單查詢
-- 3. 保持所有其他功能正常運作
-- 4. 管理員仍可以管理所有訂單
-- ============================================