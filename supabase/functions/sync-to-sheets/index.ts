// @ts-types="npm:@types/deno"
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Deno 運行時環境變數
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const GOOGLE_SHEETS_CREDENTIALS = Deno.env.get("GOOGLE_SHEETS_CREDENTIALS");
const SPREADSHEET_ID = Deno.env.get("GOOGLE_SPREADSHEET_ID");
const SHEET_NAME = Deno.env.get("GOOGLE_SHEET_NAME") || "訂單備份";

interface OrderPayload {
  type: "INSERT";
  table: "orders";
  record: {
    id: string;
    store_id: string;
    store_name?: string | null;
    order_time: string;
    pickup_location: string;
    pickup_name: string;
    pickup_phone: string;
    menu_items?: string;
    menu_image_url?: string | null;
    cost: number;
    dev_fee: number;
    shipping_fee: number;
    total_amount: number;
    order_status: string;
    admin_note?: string;
  };
  schema: "public";
}

// 取得 Google OAuth2 Access Token (使用 Service Account)
async function getAccessToken(): Promise<string> {
  if (!GOOGLE_SHEETS_CREDENTIALS) {
    throw new Error("GOOGLE_SHEETS_CREDENTIALS not set");
  }

  const credentials = JSON.parse(GOOGLE_SHEETS_CREDENTIALS);
  const now = Math.floor(Date.now() / 1000);

  // 建立 JWT Header
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  // 建立 JWT Claim
  const claim = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Base64url 編碼
  const encoder = new TextEncoder();
  const base64url = (data: Uint8Array) => {
    let binary = "";

    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const claimB64 = base64url(encoder.encode(JSON.stringify(claim)));
  const unsignedToken = `${headerB64}.${claimB64}`;

  // 匯入私鑰並簽名
  const pemContents = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken),
  );

  const signatureB64 = base64url(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${signatureB64}`;

  // 交換 Access Token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

// 格式化日期時間 (轉為台灣時間)
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);

  return date.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// 轉換訂單狀態為中文
function getStatusText(status: string): string {
  switch (status) {
    case "preparing":
      return "準備中";
    case "completed":
      return "已完成";
    default:
      return "待處理";
  }
}

// 新增一行到 Google Sheets
async function appendToSheet(order: OrderPayload["record"]): Promise<void> {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SPREADSHEET_ID not set");
  }

  const accessToken = await getAccessToken();
  const storeName = order.store_name || "未知店家";

  // 準備要寫入的資料 (按照 implementation_plan.md 定義的欄位順序)
  const row = [
    formatDateTime(order.order_time), // 訂單時間
    storeName, // 店家
    order.pickup_name, // 取貨人
    order.pickup_phone, // 電話
    order.pickup_location, // 地點
    order.menu_items || "", // 訂單內容
    order.menu_image_url || "", // 圖片
    order.cost, // 餐點成本
    order.dev_fee, // 開發費
    order.shipping_fee, // 運費
    order.total_amount, // 總金額
    getStatusText(order.order_status), // 狀態
    order.admin_note || "", // 備註
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [row],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Failed to append to sheet: ${response.status} ${errorText}`);
  }

  console.log("Successfully appended order to Google Sheets:", order.id);
}

Deno.serve(async (req: Request) => {
  try {
    // 驗證請求方法
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 解析 Webhook payload
    const payload: OrderPayload = await req.json();

    // 只處理 INSERT 事件
    if (payload.type !== "INSERT") {
      return new Response(JSON.stringify({ message: "Ignored non-INSERT event" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 同步到 Google Sheets
    await appendToSheet(payload.record);

    return new Response(JSON.stringify({ success: true, orderId: payload.record.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error syncing to Google Sheets:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
