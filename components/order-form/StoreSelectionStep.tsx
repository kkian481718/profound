import type { Selection } from "@react-types/shared";
import type { StoreOption } from "./types";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
import { Select, SelectItem } from "@heroui/select";

import {
  checkGlobalOrderLimit,
  checkOrderLimits,
  type OrderLimitCheck,
} from "@/lib/checkOrderLimits";
import { trackStoreEvent } from "@/lib/gtag";
import { StoreInfoDisplay } from "./StoreInfoDisplay";

type StoreSelectionStepProps = {
  storeOptions: StoreOption[];
  selectedStore: string | null;
  error: string;
  isLoadingStores: boolean;
  showBackButton?: boolean;
  onStoreChange: (keys: Selection) => void;
  onBack: () => void;
  onNext: () => void;
  onRetry: () => void;
  onGlobalLimitError?: (reason: string) => void;
};

export function StoreSelectionStep({
  storeOptions,
  selectedStore,
  error,
  isLoadingStores,
  showBackButton = true,
  onStoreChange,
  onBack,
  onNext,
  onRetry,
  onGlobalLimitError,
}: StoreSelectionStepProps) {
  const [globalLimitCheck, setGlobalLimitCheck] =
    useState<OrderLimitCheck | null>(null);
  const [isCheckingGlobalLimits, setIsCheckingGlobalLimits] = useState(false);
  const [storeLimitCheck, setStoreLimitCheck] =
    useState<OrderLimitCheck | null>(null);
  const [isCheckingStoreLimits, setIsCheckingStoreLimits] = useState(false);

  // 檢查全站訂單限制
  useEffect(() => {
    if (!isLoadingStores && storeOptions.length > 0) {
      setIsCheckingGlobalLimits(true);
      setGlobalLimitCheck(null); // 重置狀態

      checkGlobalOrderLimit()
        .then((limitCheck) => {
          setGlobalLimitCheck(limitCheck);
        })
        .catch((err) => {
          console.error("Error checking global order limits:", err);
          setGlobalLimitCheck({ canOrder: true });
        })
        .finally(() => {
          setIsCheckingGlobalLimits(false);
        });
    }
  }, [isLoadingStores, storeOptions.length]);

  const handleNext = async () => {
    // 如果全站已達限制，通知父組件
    if (globalLimitCheck && !globalLimitCheck.canOrder) {
      onGlobalLimitError?.(globalLimitCheck.reason || "訂單已達上限");

      return;
    }

    // 檢查個別店家訂單數限制
    if (!selectedStore) {
      return;
    }

    setIsCheckingStoreLimits(true);
    try {
      const limitCheck = await checkOrderLimits(selectedStore);

      setStoreLimitCheck(limitCheck);

      if (!limitCheck.canOrder) {
        onGlobalLimitError?.(limitCheck.reason || "無法下單");

        return;
      }

      // 所有檢查都通過，繼續下一步
      onNext();
    } catch (err) {
      console.error("Error checking store order limits:", err);
      // 如果檢查失敗，允許繼續但記錄錯誤
      onNext();
    } finally {
      setIsCheckingStoreLimits(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-small p-3">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <h2 className="text-2xl font-semibold">Step 1. 選擇店家</h2>
        <p className="text-sm text-default-500">請選擇您想要訂購的店家</p>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        {isLoadingStores ? (
          <Alert color="default" title="載入中..." variant="flat">
            正在載入店家資料...
          </Alert>
        ) : isCheckingGlobalLimits ? (
          <Alert color="default" title="檢查中..." variant="flat">
            正在檢查訂單限制...
          </Alert>
        ) : globalLimitCheck && !globalLimitCheck.canOrder ? (
          <Alert color="danger" title="訂單已達上限" variant="flat">
            {globalLimitCheck.reason}
          </Alert>
        ) : storeOptions.length === 0 ? (
          <div className="flex flex-col gap-1">
            <Alert color="warning" title="下次請早：（" variant="flat">
              目前沒有開放下單的店家
            </Alert>
            <Button
              className="w-full md:w-auto"
              color="warning"
              variant="flat"
              onPress={onRetry}
            >
              重新載入
            </Button>
          </div>
        ) : (
          <Select
            isRequired
            aria-label="店家"
            errorMessage={error || undefined}
            isInvalid={Boolean(error)}
            label="店家"
            placeholder="請選擇店家"
            selectedKeys={
              selectedStore ? new Set([selectedStore]) : new Set([])
            }
            onSelectionChange={(keys) => {
              onStoreChange(keys);
              // 追蹤店家選擇事件
              const selectedKeys = Array.from(keys);

              if (selectedKeys.length > 0) {
                const selectedStoreId = selectedKeys[0] as string;
                const selectedStoreOption = storeOptions.find(
                  (store) => store.value === selectedStoreId
                );

                if (selectedStoreOption) {
                  trackStoreEvent("store_selected", selectedStoreOption.label);
                }
              }
            }}
          >
            {storeOptions.map((store) => (
              <SelectItem key={store.value}>{store.label}</SelectItem>
            ))}
          </Select>
        )}

        {/* 顯示選中店家的詳細資訊 */}
        {selectedStore && !isLoadingStores && storeOptions.length > 0 && (
          <StoreInfoDisplay
            selectedStore={selectedStore}
            storeOptions={storeOptions}
          />
        )}

        <div className="flex gap-3">
          {showBackButton && (
            <Button
              className="w-full md:w-auto"
              color="default"
              variant="flat"
              onPress={onBack}
            >
              回上一步
            </Button>
          )}
          <Button
            className={showBackButton ? "w-full md:w-auto" : "w-full"}
            color="primary"
            isDisabled={
              !selectedStore ||
              (globalLimitCheck && !globalLimitCheck.canOrder) ||
              isCheckingGlobalLimits ||
              isCheckingStoreLimits
            }
            isLoading={isCheckingStoreLimits}
            onPress={handleNext}
          >
            {isCheckingStoreLimits ? "檢查中..." : "下一步"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
