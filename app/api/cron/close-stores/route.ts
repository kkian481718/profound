import { timingSafeEqual, createHash } from "crypto";

import { NextResponse } from "next/server";

import { closeAllExpiredStores } from "@/lib/validateStore";

// Use constant-time comparison to prevent timing attacks
// Hashing inputs prevents length-leaking early return
function safeCompare(a: string, b: string): boolean {
  const aHash = new Uint8Array(createHash("sha256").update(a).digest());
  const bHash = new Uint8Array(createHash("sha256").update(b).digest());

  return timingSafeEqual(aHash, bHash);
}

export async function GET(request: Request) {
  try {
    // 驗證 Cron Secret (防止被濫用)
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

    // 關閉所有過期的店家
    const closedCount = await closeAllExpiredStores();

    return NextResponse.json({
      success: true,
      message: `成功關閉 ${closedCount} 個過期店家`,
      closedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to close expired stores:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to close expired stores",
      },
      { status: 500 },
    );
  }
}
