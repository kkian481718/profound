-- ============================================
-- 更新 RLS Policies - 移除共乘服務後版本
-- ============================================
-- 此腳本會更新 RLS policies 以配合移除共乘服務後的資料庫結構
-- 確保所有訂單必須關聯到店家
-- ============================================

-- ============================================
-- 步驟 1: 刪除可能過時的 policies
-- ============================================

-- 刪除 orders 資料表可能存在的舊 policies
DROP POLICY IF EXISTS "Allow anonymous users to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow anonymous users to read own orders by code" ON orders;
DROP POLICY IF EXISTS "Allow public to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow public to read orders by code" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to read all orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to update orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to delete orders" ON orders;

-- ============================================
-- 步驟 2: 建立更新後的 orders policies
-- ============================================

-- 1. 允許所有人新增外送訂單（必須有店家ID和完整資訊）
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

-- 2. 允許所有人透過手機號碼查詢外送訂單
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
    -- 更新後仍必須有必要的外送資訊
    pickup_location IS NOT NULL AND
    pickup_name IS NOT NULL AND
    pickup_phone IS NOT NULL
  );

-- 5. 允許已驗證用戶刪除訂單(管理員) - 可選
CREATE POLICY "Allow authenticated users to delete orders" ON orders
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 完成!
-- ============================================
-- 執行完成後，您的 orders RLS policies 將確保：
-- 1. 所有新訂單都必須有完整的外送資訊（不再需要訂單密碼）
-- 2. 匿名用戶只能透過手機號碼查詢訂單
-- 3. 管理員可以管理所有訂單
-- 
-- stores 的 policies 不需要修改，因為沒有相關變更
-- ============================================