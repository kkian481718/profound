import type { OrderLimitInfo } from "./hooks/useOrderLimits";
import type { StoreOption } from "./types";

import { Alert } from "@heroui/alert";

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
  // 如果沒有可用的店家，或是正在載入中，不需要顯示這個警告
  if (isLoadingStores || isLoading || !storeOptions || storeOptions.length === 0) {
    return null;
  }

  if (!limitInfo || limitInfo.globalLimit === null) {
    return null; // 沒有設定全域限制時不顯示
  }

  const { globalLimit, globalCount } = limitInfo;
  const isNearLimit = globalCount >= globalLimit * 0.8;
  const isOverLimit = globalCount >= globalLimit;

  // 正常情況下隱藏全站進度，避免干擾買家
  if (!isNearLimit && !isOverLimit) {
    return null;
  }

  if (isOverLimit) {
    return (
      <Alert
        color="danger"
        title="今日全站外送已滿單"
        variant="flat"
      >
        平台今日外送單量已達上限，暫停接單，請明日再試。
      </Alert>
    );
  }

  return (
    <Alert
      color="warning"
      title="平台今日外送單量即將額滿"
      variant="flat"
    >
      目前訂單量較大，隨時可能滿單，請盡速下單。
    </Alert>
  );
}
