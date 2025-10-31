import type { StoreOption } from "./types";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";

import { useCountdown } from "./hooks/useCountdown";
import { useOrderLimits, type StoreOrderInfo } from "./hooks/useOrderLimits";

type StoreInfoDisplayProps = {
  storeOptions: StoreOption[];
  selectedStore: string | null;
};

export function StoreInfoDisplay({
  storeOptions,
  selectedStore,
}: StoreInfoDisplayProps) {
  const selectedStoreData = storeOptions.find(
    (store) => store.value === selectedStore,
  );

  if (!selectedStoreData) {
    return null;
  }

  return <StoreInfoCard store={selectedStoreData} />;
}

type StoreInfoCardProps = {
  store: StoreOption;
};

function StoreInfoCard({ store }: StoreInfoCardProps) {
  const { timeLeft, isExpired } = useCountdown(store.order_deadline || null);
  const { fetchStoreOrderInfo } = useOrderLimits();
  const [storeOrderInfo, setStoreOrderInfo] = useState<StoreOrderInfo | null>(
    null,
  );
  const [isLoadingOrderInfo, setIsLoadingOrderInfo] = useState(false);

  useEffect(() => {
    const loadStoreOrderInfo = async () => {
      setIsLoadingOrderInfo(true);
      try {
        const orderInfo = await fetchStoreOrderInfo(store.value);

        setStoreOrderInfo(orderInfo);
      } catch (error) {
        console.error("Error loading store order info:", error);
      } finally {
        setIsLoadingOrderInfo(false);
      }
    };

    loadStoreOrderInfo();
  }, [store.value, fetchStoreOrderInfo]);

  // 計算店家訂單進度
  const getStoreOrderProgress = () => {
    if (!storeOrderInfo || storeOrderInfo.storeLimit === null) {
      return null;
    }

    const { storeCount, storeLimit } = storeOrderInfo;
    const percentage = Math.min((storeCount / storeLimit) * 100, 100);
    const remaining = Math.max(0, storeLimit - storeCount);
    const isNearLimit = storeCount >= storeLimit * 0.8;
    const isOverLimit = storeCount >= storeLimit;

    return {
      percentage,
      remaining,
      isNearLimit,
      isOverLimit,
      storeCount,
      storeLimit,
    };
  };

  const orderProgress = getStoreOrderProgress();

  return (
    <Card className="shadow-sm">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl text-foreground">{store.label}</h3>
          <Chip
            className="font-semibold"
            color={isExpired ? "danger" : "success"}
            size="md"
            variant="shadow"
          >
            {isExpired ? "已截止" : "可下單"}
          </Chip>
        </div>

        <Divider />

        <div className="space-y-4">
          {/* 截止倒數計時 */}
          {store.order_deadline && (
            <Card className="bg-content2">
              <CardBody className="py-3">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-foreground-500 font-medium uppercase tracking-wide">
                    下單截止倒數
                  </span>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-lg font-semibold ${
                        isExpired
                          ? "text-danger"
                          : timeLeft.includes("分") || timeLeft.includes("秒")
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      {timeLeft}
                    </span>
                    <Chip
                      className="font-medium"
                      color={
                        isExpired
                          ? "danger"
                          : timeLeft.includes("分") || timeLeft.includes("秒")
                            ? "warning"
                            : "success"
                      }
                      size="sm"
                      variant="dot"
                    >
                      {isExpired ? "已截止" : "進行中"}
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* 店家訂單限制顯示 */}
          {isLoadingOrderInfo ? (
            <Card className="bg-content2">
              <CardBody className="py-3">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-default-500">
                    載入訂單資訊中...
                  </span>
                </div>
              </CardBody>
            </Card>
          ) : orderProgress ? (
            <Card className="bg-content2">
              <CardBody className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">店家訂單狀況</span>
                  <Chip
                    color={
                      orderProgress.isOverLimit
                        ? "danger"
                        : orderProgress.isNearLimit
                          ? "warning"
                          : "success"
                    }
                    size="sm"
                    variant="shadow"
                  >
                    {orderProgress.isOverLimit
                      ? "已滿額"
                      : orderProgress.isNearLimit
                        ? "接近滿額"
                        : "可接單"}
                  </Chip>
                </div>

                <Progress
                  color={
                    orderProgress.isOverLimit
                      ? "danger"
                      : orderProgress.isNearLimit
                        ? "warning"
                        : "success"
                  }
                  formatOptions={{ style: "percent", maximumFractionDigits: 0 }}
                  showValueLabel={true}
                  size="sm"
                  value={orderProgress.percentage}
                />

                {orderProgress.isOverLimit && (
                  <Chip
                    className="mt-2"
                    color="danger"
                    size="sm"
                    variant="flat"
                  >
                    此店家今日已滿額
                  </Chip>
                )}
              </CardBody>
            </Card>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
