# Supabase 認證設定指南

本專案已整合 Supabase 認證功能，以下是完整的設定步驟。

## 📋 目錄結構

已建立的檔案：
- `lib/supabase/client.ts` - 客戶端 Supabase 實例
- `lib/supabase/server.ts` - 伺服器端 Supabase 實例
- `middleware.ts` - 路由保護中間件
- `app/login/page.tsx` - 登入頁面
- `app/admin/*` - 受保護的管理頁面

## 🚀 設定步驟

### 1. 建立 Supabase 專案

1. 前往 [Supabase Dashboard](https://app.supabase.com)
2. 點選 "New Project"
3. 填寫專案資訊並建立專案
4. 等待專案建立完成（約 2 分鐘）

### 2. 取得 API 金鑰

1. 在 Supabase Dashboard 左側選單點選 **Settings** > **API**
2. 找到以下兩個值：
   - **Project URL** (例如：`https://xxxxx.supabase.co`)
   - **anon public key** (一串很長的 JWT token)

### 3. 設定環境變數

1. 在專案根目錄建立 `.env.local` 檔案（可以複製 `.env.local.example`）
2. 填入您的 Supabase 資訊：

```bash
NEXT_PUBLIC_SUPABASE_URL=你的-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的-anon-key
```

**範例：**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...很長的字串
```

### 4. 建立資料庫結構

1. 在 Supabase Dashboard 點選左側的 **SQL Editor**
2. 開啟專案根目錄的 `database-schema.md` 檔案
3. 依序複製並執行文件中的 SQL 指令：
   - 建立資料表 (stores, orders)
   - 建立索引
   - 啟用 Row Level Security (RLS)
   - 設定存取政策
   - 建立自動更新 trigger

### 5. 設定認證方式

預設使用 **Email/Password** 認證。

#### 在 Supabase Dashboard 設定：

1. 點選左側 **Authentication** > **Providers**
2. 確認 **Email** provider 已啟用
3. 可以關閉 "Confirm email" 選項（開發時比較方便）

#### 建立第一個管理員帳號：

**方式 1：透過 Supabase Dashboard**
1. 點選 **Authentication** > **Users**
2. 點選 "Add user" > "Create new user"
3. 輸入 Email 和 Password
4. 點選 "Create user"

**方式 2：透過 SQL**
```sql
-- 在 SQL Editor 執行
SELECT auth.uid();  -- 先測試是否可以執行

-- 註冊新用戶（將會收到確認信）
-- 或直接在 Dashboard 建立用戶比較簡單
```

### 6. 測試登入

1. 啟動開發伺服器：
```bash
npm run dev
```

2. 開啟瀏覽器訪問 `http://localhost:3000`

3. 點選右上角的「管理員登入」按鈕

4. 使用您建立的帳號密碼登入

5. 登入成功後會自動跳轉到「店家管理」頁面

## 🔐 認證流程說明

### 路由保護

`middleware.ts` 會自動保護所有 `/admin/*` 路由：
- 未登入訪問 `/admin/*` → 重定向到 `/login`
- 已登入訪問 `/login` → 重定向到 `/admin/stores`

### 登入狀態管理

導覽列 (`components/navbar.tsx`) 會：
- 顯示當前登入狀態
- 已登入時顯示「管理選單」下拉選單
- 未登入時顯示「管理員登入」按鈕

### 存取 Supabase 客戶端

**在客戶端元件 (Client Component)：**
```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
```

**在伺服器端元件 (Server Component)：**
```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
```

## 📱 頁面功能

### 登入頁面 (`/login`)
- Email/Password 登入表單
- 錯誤訊息顯示
- 登入後自動導向管理頁面

### 新增店家頁面 (`/admin/add-store`)
- 輸入店家名稱
- 設定是否開放接單
- 設定接單期限
- 需要登入才能訪問

### 店家管理頁面 (`/admin/stores`)
- 列出所有店家
- 切換接單狀態
- 點擊查看該店家的訂單
- 需要登入才能訪問

### 歷史訂單頁面 (`/admin/orders`)
- 顯示所有訂單
- 多條件搜尋與篩選
- 可依店家、付款狀態、配送狀態、日期範圍篩選
- 需要登入才能訪問

## 🐛 常見問題

### Q1: 登入後顯示 "Invalid login credentials"
**A:** 請檢查：
- Email 和密碼是否正確
- 用戶是否已在 Supabase Dashboard 建立
- 環境變數是否正確設定

### Q2: 無法存取管理頁面
**A:** 請確認：
- 是否已登入
- `.env.local` 檔案是否存在且正確
- 是否重新啟動開發伺服器

### Q3: 資料庫查詢失敗
**A:** 請檢查：
- 是否已執行 `database-schema.md` 中的 SQL
- RLS 政策是否正確設定
- 在 Supabase Dashboard 的 **Table Editor** 確認資料表是否存在

### Q4: 環境變數不生效
**A:** 
- 確認檔案名稱為 `.env.local`（注意前面有一個點）
- 修改 `.env.local` 後需要重新啟動開發伺服器
- 環境變數名稱必須以 `NEXT_PUBLIC_` 開頭才能在客戶端使用

## 📚 相關資源

- [Supabase 官方文件](https://supabase.com/docs)
- [Supabase Auth 文件](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase 整合指南](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## 🔄 下一步

1. ✅ 完成 Supabase 設定
2. ✅ 建立管理員帳號
3. ✅ 測試登入功能
4. 🔜 新增測試店家
5. 🔜 建立訂單表單（首頁）
6. 🔜 整合實際的訂單流程

---

如有問題，請參考 `database-schema.md` 了解資料庫結構設計。
