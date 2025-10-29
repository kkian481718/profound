import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";

import type { OrderLimitInfo } from "./hooks/useOrderLimits";
import type { StoreOption } from "./types";

interface GlobalOrderProgressProps {
  limitInfo: OrderLimitInfo | null;
  isLoading: boolean;
  storeOptions: StoreOption[];
  isLoadingStores: boolean;
}

export function GlobalOrderProgress({
  limitInfo,
  isLoading,
  storeOptions,
  isLoadingStores,
}: GlobalOrderProgressProps) {
  // 如果正在載入店家資料，顯示載入中
  if (isLoadingStores) {
    return (
      <Card className="shadow-sm">
        <CardBody className="py-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm text-default-500">載入店家資訊中...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  // 如果沒有可用的店家，隱藏進度條
  if (!storeOptions || storeOptions.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardBody className="py-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm text-default-500">載入訂單資訊中...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!limitInfo || limitInfo.globalLimit === null) {
    return null; // 沒有設定全域限制時不顯示
  }

  const { globalLimit, globalCount } = limitInfo;
  const percentage = Math.min((globalCount / globalLimit) * 100, 100);
  const remaining = Math.max(0, globalLimit - globalCount);
  const isNearLimit = globalCount >= globalLimit * 0.8;
  const isOverLimit = globalCount >= globalLimit;

  // 根據使用狀況決定顯示顏色
  const getProgressColor = () => {
    if (isOverLimit) return "danger";
    if (isNearLimit) return "warning";
    return "success";
  };

  const getStatusChip = () => {
    if (isOverLimit) {
      return (
        <Chip color="danger" size="sm" variant="shadow">
          已滿額
        </Chip>
      );
    }
    if (isNearLimit) {
      return (
        <Chip color="warning" size="sm" variant="shadow">
          接近滿額
        </Chip>
      );
    }
    return (
      <Chip color="success" size="sm" variant="shadow">
        可接單
      </Chip>
    );
  };

  return (
    <Card>
      <CardBody className="py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">今日訂單狀況</span>
          {getStatusChip()}
        </div>

        <Progress
          color={getProgressColor()}
          formatOptions={{ style: "percent", maximumFractionDigits: 0 }}
          showValueLabel={true}
          size="sm"
          value={percentage}
        />

        {isOverLimit && (
          <Chip color="danger" size="sm" variant="flat" className="mt-2">
            今日已滿額，請明日再試
          </Chip>
        )}
      </CardBody>
    </Card>
  );
}
