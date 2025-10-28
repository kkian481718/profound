import type { StoreOption } from "./types";

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

  return (
    <div className="bg-gradient-to-br from-default-50 to-default-100 rounded-xl p-5 space-y-4 border border-default-200 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xl text-default-800">{store.label}</h3>
        <Chip
          className="font-semibold"
          color={isExpired ? "danger" : "success"}
          size="md"
          variant="shadow"
        >
          {isExpired ? "已截止" : "可下單"}
        </Chip>
      </div>

      <Divider className="bg-default-300" />

      <div className="space-y-4">
        {/* 截止倒數計時 */}
        {store.order_deadline && (
          <div className="bg-white rounded-lg p-3 border border-default-200">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-default-500 font-medium uppercase tracking-wide">
                下單截止倒數
              </span>
              <div className="flex items-center justify-between">
                <span
                  className={`text-lg font-semibold ${
                    isExpired
                      ? "text-danger-600"
                      : timeLeft.includes("分") || timeLeft.includes("秒")
                        ? "text-warning-600"
                        : "text-success-600"
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
          </div>
        )}
      </div>
    </div>
  );
}
