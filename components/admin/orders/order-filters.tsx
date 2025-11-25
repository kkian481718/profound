"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";

import { SearchIcon } from "@/components/icons";
import { adminPickupLocations } from "@/components/order-form/constants";

interface OrderFiltersProps {
  searchQuery: string;
  filterStore: string;
  filterDelivery: string;
  filterLocation: string;
  stores: any[];
  totalOrders: number;
  filteredOrdersCount: number;
  showTodayOnly: boolean;
  sortBy: "order_time" | "pickup_location";
  onSearchQueryChange: (value: string) => void;
  onFilterStoreChange: (value: string) => void;
  onFilterDeliveryChange: (value: string) => void;
  onFilterLocationChange: (value: string) => void;
  onClearFilters: () => void;
  onShowTodayOnlyChange: (value: boolean) => void;
  onSortByChange: (value: "order_time" | "pickup_location") => void;
}

export default function OrderFilters({
  searchQuery,
  filterStore,
  filterDelivery,
  filterLocation,
  stores,
  totalOrders,
  filteredOrdersCount,
  showTodayOnly,
  sortBy,
  onSearchQueryChange,
  onFilterStoreChange,
  onFilterDeliveryChange,
  onFilterLocationChange,
  onClearFilters,
  onShowTodayOnlyChange,
  onSortByChange,
}: OrderFiltersProps) {
  const hasActiveFilters =
    filterStore || filterDelivery || filterLocation || !showTodayOnly;

  return (
    <Card>
      <CardBody className="gap-4">
        {/* 搜尋框與今日開關 */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Input
            isClearable
            className="flex-1 w-full"
            placeholder="搜尋訂購內容、社群名稱、手機、店家..."
            size="lg"
            startContent={<SearchIcon className="text-default-400" size={20} />}
            value={searchQuery}
            variant="faded"
            onClear={() => onSearchQueryChange("")}
            onValueChange={onSearchQueryChange}
          />

          <Switch
            className="shrink-0"
            isSelected={showTodayOnly}
            onValueChange={onShowTodayOnlyChange}
          >
            僅顯示本日訂單
          </Switch>
        </div>

        {/* 篩選器網格 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label="取貨地點"
            placeholder="選擇取貨地點"
            selectedKeys={filterLocation ? [filterLocation] : []}
            onChange={(e) => onFilterLocationChange(e.target.value)}
          >
            {adminPickupLocations.map((location) => (
              <SelectItem key={location.value}>{location.label}</SelectItem>
            ))}
          </Select>

          <Select
            label="店家"
            placeholder="選擇店家"
            selectedKeys={filterStore ? [filterStore] : []}
            onChange={(e) => onFilterStoreChange(e.target.value)}
          >
            {stores.map((store) => (
              <SelectItem key={store.id}>{store.name}</SelectItem>
            ))}
          </Select>

          {/* 排序方式 - 分段控制器樣式 */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-default-600">排序方式</span>
            <div className="flex items-center gap-1 p-1 bg-default-100 rounded-lg h-10">
              <button
                className={`flex-1 h-full text-xs font-medium rounded-md transition-all ${
                  sortBy === "order_time"
                    ? "bg-white dark:bg-default-50 shadow-sm text-default-700"
                    : "text-default-500 hover:text-default-700"
                }`}
                onClick={() => onSortByChange("order_time")}
              >
                下單時間
              </button>
              <button
                className={`flex-1 h-full text-xs font-medium rounded-md transition-all ${
                  sortBy === "pickup_location"
                    ? "bg-white dark:bg-default-50 shadow-sm text-default-700"
                    : "text-default-500 hover:text-default-700"
                }`}
                onClick={() => onSortByChange("pickup_location")}
              >
                取貨地點
              </button>
            </div>
          </div>

          {/* 訂單狀態 - 分段控制器樣式 */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-default-600">訂單狀態</span>
            <div className="flex items-center gap-1 p-1 bg-default-100 rounded-lg h-10">
              <button
                className={`flex-1 h-full text-xs font-medium rounded-md transition-all ${
                  filterDelivery === ""
                    ? "bg-white dark:bg-default-50 shadow-sm text-default-700"
                    : "text-default-500 hover:text-default-700"
                }`}
                onClick={() => onFilterDeliveryChange("")}
              >
                全部
              </button>
              <button
                className={`flex-1 h-full text-xs font-medium rounded-md transition-all ${
                  filterDelivery === "pending"
                    ? "bg-white dark:bg-default-50 shadow-sm text-default-700"
                    : "text-default-500 hover:text-default-700"
                }`}
                onClick={() => onFilterDeliveryChange("pending")}
              >
                待處理
              </button>
              <button
                className={`flex-1 h-full text-xs font-medium rounded-md transition-all ${
                  filterDelivery === "preparing"
                    ? "bg-white dark:bg-default-50 shadow-sm text-primary"
                    : "text-default-500 hover:text-default-700"
                }`}
                onClick={() => onFilterDeliveryChange("preparing")}
              >
                準備中
              </button>
              <button
                className={`flex-1 h-full text-xs font-medium rounded-md transition-all ${
                  filterDelivery === "completed"
                    ? "bg-white dark:bg-default-50 shadow-sm text-success"
                    : "text-default-500 hover:text-default-700"
                }`}
                onClick={() => onFilterDeliveryChange("completed")}
              >
                已完成
              </button>
            </div>
          </div>
        </div>

        {/* 清除篩選按鈕與統計 */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          {hasActiveFilters && (
            <Button
              color="danger"
              size="sm"
              variant="flat"
              onPress={onClearFilters}
            >
              清除篩選
            </Button>
          )}

          <div className="text-sm text-default-500">
            共 {filteredOrdersCount} 筆訂單
            {filteredOrdersCount !== totalOrders &&
              ` (從 ${totalOrders} 筆中篩選)`}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
