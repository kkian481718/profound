import type { StoreOption } from "./types";

import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";

import { useCountdown } from "./hooks/useCountdown";

type StoreInfoDisplayProps = {
  storeOptions: StoreOption[];
  selectedStore: string | null;
};

export function StoreInfoDisplay({
  storeOptions,
  selectedStore,
}: StoreInfoDisplayProps) {
  const selectedStoreData = storeOptions.find(
    (store) => store.value === selectedStore
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
        </div>
      </CardBody>
    </Card>
  );
}
