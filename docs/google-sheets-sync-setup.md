# Google Sheets 訂單同步設定指南

此文件說明如何設定 Supabase Edge Function 自動同步訂單到 Google Sheets。

## 前置需求

- Supabase 專案已建立
- Google 帳號

---

## 步驟 1：建立 Google Cloud Service Account

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Google Sheets API**：
   - 左側選單 → APIs & Services → Library
   - 搜尋 "Google Sheets API" → Enable
4. 建立 Service Account：
   - 左側選單 → APIs & Services → Credentials
   - Create Credentials → Service Account
   - 輸入名稱（如 `profound-sheets-sync`）→ Create
   - 略過權限設定 → Done
5. 建立 JSON Key：
   - 點擊剛建立的 Service Account
   - Keys 標籤 → Add Key → Create new key → JSON
   - 下載 JSON 檔案（包含 `client_email` 和 `private_key`）

---

## 步驟 2：建立 Google Sheet

1. 前往 [Google Sheets](https://sheets.google.com/)
2. 建立新試算表，命名為「Profound 訂單備份」
3. 在第一行新增標題（可選）：
   ```
   訂單時間 | 店家 | 取貨人 | 電話 | 地點 | 訂單內容 | 圖片 | 餐點成本 | 開發費 | 運費 | 總金額 | 狀態 | 備註
   ```
4. 將工作表名稱改為 `訂單備份`（或記住你的工作表名稱）
5. 取得 Spreadsheet ID：
   - 從 URL 複製 ID，格式為：
   - `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
6. 分享給 Service Account：
   - 點擊右上角「共用」
   - 輸入 Service Account 的 `client_email`（從 JSON 檔案取得）
   - 權限設為「編輯者」

---

## 步驟 3：部署 Edge Function

### 安裝 Supabase CLI（如果尚未安裝）

```bash
npm install -g supabase
```

### 登入 Supabase

```bash
supabase login
```

### 連結專案

```bash
cd d:\MiffyProject\profound
supabase link --project-ref <your-project-ref>
```

### 設定環境變數

```bash
# 將 JSON 檔案內容作為環境變數（需轉為單行）
supabase secrets set GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...整個 JSON 內容...}'

# 設定 Spreadsheet ID
supabase secrets set GOOGLE_SPREADSHEET_ID='你的試算表ID'

# 設定工作表名稱（可選，預設為「訂單備份」）
supabase secrets set GOOGLE_SHEET_NAME='訂單備份'
```

### 部署 Edge Function

```bash
supabase functions deploy sync-to-sheets
```

---

## 步驟 4：設定 Database Webhook

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 左側選單 → Database → Webhooks
4. 點擊「Create a new webhook」
5. 設定：
   - **Name**: `sync-orders-to-sheets`
   - **Table**: `orders`
   - **Events**: ✅ Insert
   - **Type**: Supabase Edge Functions
   - **Edge Function**: `sync-to-sheets`
6. 儲存

---

## 驗證測試

1. 在網站前台建立一筆新訂單
2. 等待約 5-10 秒
3. 開啟 Google Sheet 確認訂單資料已同步

### 查看 Edge Function 日誌

```bash
supabase functions logs sync-to-sheets
```

或在 Supabase Dashboard → Edge Functions → sync-to-sheets → Logs

---

## 故障排除

### 訂單未同步到 Sheets

1. 檢查 Edge Function 日誌是否有錯誤
2. 確認 Service Account 有試算表的編輯權限
3. 確認環境變數設定正確

### 權限錯誤

- 確認 Google Sheets API 已啟用
- 確認試算表已分享給 Service Account

### JSON 格式錯誤

- 環境變數中的 JSON 需要是單行格式
- 確保特殊字元有正確跳脫
