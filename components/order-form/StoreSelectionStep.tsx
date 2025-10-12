import type { Selection } from "@react-types/shared";
import type { StoreOption } from "./types";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
import { Select, SelectItem } from "@heroui/select";

type StoreSelectionStepProps = {
  storeOptions: StoreOption[];
  selectedStore: string | null;
  error: string;
  isLoadingStores: boolean;
  onStoreChange: (keys: Selection) => void;
  onBack: () => void;
  onNext: () => void;
  onRetry: () => void;
};

export function StoreSelectionStep({
  storeOptions,
  selectedStore,
  error,
  isLoadingStores,
  onStoreChange,
  onBack,
  onNext,
  onRetry,
}: StoreSelectionStepProps) {
  return (
    <Card className="w-full max-w-2xl shadow-small p-3">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <h2 className="text-2xl font-semibold">Step 2. 選擇店家</h2>
        <p className="text-sm text-default-500">請選擇您想要訂購的店家</p>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        {isLoadingStores ? (
          <Alert color="default" title="載入中..." variant="flat">
            正在載入店家資料...
          </Alert>
        ) : storeOptions.length === 0 ? (
          <div className="flex flex-col gap-4">
            <Alert color="danger" title="無法載入店家資料" variant="flat">
              無法連接到伺服器,請檢查網路連線或稍後再試。
            </Alert>
            <Button
              className="w-full md:w-auto"
              color="primary"
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
            onSelectionChange={onStoreChange}
          >
            {storeOptions.map((store) => (
              <SelectItem key={store.value}>{store.label}</SelectItem>
            ))}
          </Select>
        )}

        <div className="flex gap-3">
          <Button
            className="w-full md:w-auto"
            color="default"
            variant="flat"
            onPress={onBack}
          >
            回上一步
          </Button>
          <Button
            className="w-full md:w-auto"
            color="primary"
            isDisabled={!selectedStore}
            onPress={onNext}
          >
            下一步
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
