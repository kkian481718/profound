"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderInfo, setOrderInfo] = useState<{
    pickupCode: string;
    phoneNumber: string;
  } | null>(null);

  useEffect(() => {
    const pickupCode = searchParams.get("pickupCode");
    const phoneNumber = searchParams.get("phoneNumber");

    if (pickupCode && phoneNumber) {
      setOrderInfo({
        pickupCode,
        phoneNumber,
      });
    } else {
      // 如果沒有訂單資訊，導向首頁
      router.push("/");
    }
  }, [searchParams, router]);

  if (!orderInfo) {
    return null;
  }

  const handleGoHome = () => {
    router.push("/");
  };

  const handleCheckOrder = () => {
    router.push("/orders/lookup");
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 px-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* 成功訊息 */}
        <div className="text-center space-y-2">
          <div className="text-6xl">✅</div>
          <h1 className="text-3xl font-bold">訂單已建立！</h1>
          <p className="text-default-500">您的訂單已成功提交</p>
        </div>

        {/* 訂單資訊卡片 */}
        <Card className="w-full">
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-xl font-bold">📋 訂單資訊</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                <span className="text-sm font-medium">取貨密碼</span>
                <Chip
                  className="text-2xl font-bold px-4 py-2"
                  color="warning"
                  size="lg"
                  variant="flat"
                >
                  {orderInfo.pickupCode}
                </Chip>
              </div>

              <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <span className="text-sm font-medium">手機號碼</span>
                <span className="text-lg font-semibold">
                  {orderInfo.phoneNumber}
                </span>
              </div>
            </div>

            <Divider />

            {/* 重要提示 */}
            <div className="bg-default-100 dark:bg-default-50 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-warning">💡 重要提示</p>
              <ul className="text-sm space-y-1 text-default-700 dark:text-default-600">
                <li>• 請妥善保管您的取貨密碼和手機號碼</li>
                <li>• 您可以使用這些資訊隨時查詢訂單狀態</li>
                <li>• 建議立即截圖保存此頁面</li>
                <li>• 取貨時請出示您的取貨密碼</li>
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* 操作按鈕 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="w-full sm:w-auto"
            color="primary"
            size="lg"
            variant="solid"
            onPress={handleCheckOrder}
          >
            🔍 查詢訂單狀態
          </Button>
          <Button
            className="w-full sm:w-auto"
            color="default"
            size="lg"
            variant="bordered"
            onPress={handleGoHome}
          >
            ← 返回首頁
          </Button>
        </div>

        {/* 額外提示 */}
        <div className="text-center text-sm text-default-400">
          <p>訂單處理中，我們會盡快為您配送</p>
        </div>
      </div>
    </section>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 px-4">
          <div className="max-w-2xl w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="text-6xl">⏳</div>
              <h1 className="text-3xl font-bold">載入中...</h1>
            </div>
          </div>
        </section>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
