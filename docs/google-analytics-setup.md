# Google Analytics 設定指南

此專案已整合 Google Analytics 4 (GA4) 來追蹤用戶行為和業務指標。

## 設定步驟

### 1. 取得 Google Analytics 追蹤 ID

1. 前往 [Google Analytics](https://analytics.google.com/)
2. 建立新的 GA4 屬性
3. 在「資料串流」中設定網站
4. 複製「評估 ID」（格式：G-XXXXXXXXXX）

### 2. 設定環境變數

在專案根目錄創建 `.env.local` 檔案：

```bash
# 複製 .env.example 並填入實際的 GA ID
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 3. 追蹤事件說明

專案已設定以下自動追蹤事件：

#### 訂餐流程追蹤

- `order_started`: 用戶開始下單流程
- `order_completed`: 訂單成功提交
- `order_failed`: 訂單提交失敗

#### 店家互動追蹤

- `store_viewed`: 用戶查看店家資訊
- `store_selected`: 用戶選擇店家

#### 管理員操作追蹤

- `admin_login`: 管理員登入
- `order_status_updated`: 訂單狀態更新
- `store_settings_changed`: 店家設定修改

### 4. 自訂追蹤事件

如需添加新的追蹤事件，請使用 `lib/gtag.ts` 中的函數：

```typescript
import {
  event,
  trackOrderEvent,
  trackStoreEvent,
  trackAdminEvent,
} from "@/lib/gtag";

// 基本事件追蹤
event("custom_event", {
  event_category: "User Interaction",
  event_label: "Button Click",
  value: 1,
});

// 業務邏輯專用追蹤
trackOrderEvent("order_completed", {
  store_name: "店家名稱",
  order_total: 150,
  pickup_location: "取貨地點",
});
```

### 5. 驗證設定

1. 啟動開發伺服器：`npm run dev`
2. 在瀏覽器中打開開發者工具 > Network 標籤
3. 執行一些操作（選擇店家、提交訂單等）
4. 檢查是否有送出到 `google-analytics.com` 或 `googletagmanager.com` 的請求

### 6. GA4 儀表板建議

建議在 GA4 中設定以下報表：

#### 轉換目標

- `order_completed` 設為主要轉換目標
- `admin_login` 設為管理員活動指標

#### 自訂維度

- 店家名稱 (store_name)
- 取貨地點 (pickup_location)
- 訂單金額 (order_total)

#### 漏斗分析

1. 頁面載入
2. 店家選擇 (store_selected)
3. 訂單開始 (order_started)
4. 訂單完成 (order_completed)

### 7. 隱私權注意事項

- GA4 會收集用戶的匿名使用數據
- 建議在隱私權政策中說明數據收集用途
- 可考慮添加 Cookie 同意機制（目前未實作）

### 8. 效能優化

- GA4 腳本使用 `strategy="afterInteractive"` 避免阻塞頁面載入
- 僅在生產環境載入 GA 腳本（透過環境變數控制）
- 事件追蹤採用異步方式，不影響用戶體驗

## 疑難排解

### GA 腳本沒有載入

- 檢查 `NEXT_PUBLIC_GA_ID` 環境變數是否正確設定
- 確認 GA ID 格式為 `G-XXXXXXXXXX`

### 事件沒有追蹤到

- 打開瀏覽器開發者工具檢查 console 是否有錯誤
- 確認 `window.gtag` 函數已正確載入
- 檢查 GA4 即時報表（事件可能需要幾分鐘才會顯示）

### TypeScript 錯誤

- 確認 `types/index.ts` 中的 global Window 介面擴展已正確設定
- 重新啟動 TypeScript 伺服器

## 相關檔案

- `lib/gtag.ts`: Google Analytics 配置和事件追蹤函數
- `components/GoogleAnalytics.tsx`: GA4 腳本載入組件
- `types/index.ts`: TypeScript 類型定義
- `app/layout.tsx`: GA 組件整合到應用程式布局
