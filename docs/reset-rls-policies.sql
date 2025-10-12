-- ============================================
-- 清理並重建 RLS Policies
-- ============================================
-- 此腳本會刪除所有現有的 policies 並重新建立
-- 執行前請確保已備份重要資料
-- ============================================

-- ============================================
-- 步驟 1: 刪除所有現有的 policies
-- ============================================

-- 刪除 stores 資料表的所有 policies
DROP POLICY IF EXISTS "Allow public read open stores" ON stores;
DROP POLICY IF EXISTS "Allow authenticated users to read all stores" ON stores;
DROP POLICY IF EXISTS "Allow authenticated users to insert stores" ON stores;
DROP POLICY IF EXISTS "Allow authenticated users to update stores" ON stores;
DROP POLICY IF EXISTS "Allow authenticated users to delete stores" ON stores;

-- 刪除 orders 資料表的所有 policies
DROP POLICY IF EXISTS "Allow anonymous users to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow anonymous users to read own orders by code" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to read all orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to update orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to delete orders" ON orders;

-- ============================================
-- 步驟 2: 確保 RLS 已啟用
-- ============================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 步驟 3: 建立 stores 資料表的 policies
-- ============================================

-- 1. 允許所有人(包括匿名用戶)查看開放接單的店家
CREATE POLICY "Allow public read open stores" ON stores
  FOR SELECT
  TO public
  USING (is_open = true);

-- 2. 允許已驗證用戶查看所有店家(管理員)
CREATE POLICY "Allow authenticated users to read all stores" ON stores
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. 允許已驗證用戶新增店家(管理員)
CREATE POLICY "Allow authenticated users to insert stores" ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. 允許已驗證用戶更新店家(管理員)
CREATE POLICY "Allow authenticated users to update stores" ON stores
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 步驟 4: 建立 orders 資料表的 policies
-- ============================================

-- 1. 允許匿名使用者新增訂單
CREATE POLICY "Allow anonymous users to insert orders" ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 2. 允許匿名使用者透過取貨密碼和手機號碼查詢自己的訂單
CREATE POLICY "Allow anonymous users to read own orders by code" ON orders
  FOR SELECT
  TO anon
  USING (
    pickup_code IS NOT NULL AND 
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
  WITH CHECK (true);

-- ============================================
-- 完成!
-- ============================================
-- 執行完成後,您的 RLS policies 應該已經正確設定
-- 
-- 驗證方式:
-- 1. 在 Supabase Dashboard 中檢查 Authentication > Policies
-- 2. 測試匿名用戶建立訂單
-- 3. 測試匿名用戶查詢訂單
-- 4. 測試管理員登入後的功能
-- ============================================
