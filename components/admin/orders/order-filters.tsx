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
            label="排序方式"
            selectedKeys={[sortBy]}
            onChange={(e) =>
              onSortByChange(e.target.value as "order_time" | "pickup_location")
            }
          >
            <SelectItem key="order_time">下單時間</SelectItem>
            <SelectItem key="pickup_location">取貨地點</SelectItem>
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

          <Select
            label="訂單狀態"
            placeholder="選擇訂單狀態"
            selectedKeys={filterDelivery ? [filterDelivery] : []}
            onChange={(e) => onFilterDeliveryChange(e.target.value)}
          >
            <SelectItem key="pending">待處理</SelectItem>
            <SelectItem key="preparing">準備中</SelectItem>
            <SelectItem key="completed">已完成</SelectItem>
          </Select>
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
