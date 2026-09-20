import { timingSafeEqual, createHash } from "crypto";

import { NextResponse } from "next/server";

import { cleanupOldOrderImages, getCleanupPreview } from "@/lib/cleanupOldImages";

// 預設清理超過 30 天的圖片
const DEFAULT_DAYS_OLD = 30;

// Use constant-time comparison to prevent timing attacks
// Hashing inputs prevents length-leaking early return
function safeCompare(a: string, b: string): boolean {
  const aHash = new Uint8Array(createHash("sha256").update(a).digest());
  const bHash = new Uint8Array(createHash("sha256").update(b).digest());

  return timingSafeEqual(aHash, bHash);
}

/**
 * GET: 預覽可清理的圖片數量（不實際刪除）
 * POST: 實際執行清理操作
 */
export async function GET(request: Request) {
  try {
    // 驗證 Cron Secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration: CRON_SECRET not set" },
        { status: 500 },
      );
    }

    const expectedHeader = `Bearer ${cronSecret}`;

    if (!authHeader || !safeCompare(authHeader, expectedHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 從 URL 參數取得天數設定
    const url = new URL(request.url);
    const daysOld = parseInt(url.searchParams.get("days") || String(DEFAULT_DAYS_OLD), 10);

    // 預覽模式：只回傳統計資料
    const preview = await getCleanupPreview(daysOld);

    return NextResponse.json({
      success: true,
      mode: "preview",
      message: `發現 ${preview.count} 張超過 ${daysOld} 天的訂單圖片可清理`,
      preview,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to preview cleanup:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    // 驗證 Cron Secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration: CRON_SECRET not set" },
        { status: 500 },
      );
    }

    const expectedHeader = `Bearer ${cronSecret}`;

    if (!authHeader || !safeCompare(authHeader, expectedHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 從 URL 參數取得天數設定
    const url = new URL(request.url);
    const daysOld = parseInt(url.searchParams.get("days") || String(DEFAULT_DAYS_OLD), 10);

    // 執行清理
    const result = await cleanupOldOrderImages(daysOld);

    return NextResponse.json({
      success: result.success,
      mode: "cleanup",
      message: result.success
        ? `成功清理 ${result.deletedCount} 張超過 ${daysOld} 天的訂單圖片，釋放約 ${result.freedSpaceEstimate} 空間`
        : `清理過程發生錯誤`,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to cleanup old images:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
