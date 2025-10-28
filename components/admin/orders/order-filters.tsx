"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";

import { adminPickupLocations } from "@/components/order-form/constants";

interface OrderFiltersProps {
  searchQuery: string;
  filterStore: string;
  filterDelivery: string;
  filterLocation: string;
  filterDateFrom: string;
  filterDateTo: string;
  showAdvancedFilters: boolean;
  stores: any[];
  totalOrders: number;
  filteredOrdersCount: number;
  showTodayOnly: boolean;
  onSearchQueryChange: (value: string) => void;
  onFilterStoreChange: (value: string) => void;
  onFilterDeliveryChange: (value: string) => void;
  onFilterLocationChange: (value: string) => void;
  onFilterDateFromChange: (value: string) => void;
  onFilterDateToChange: (value: string) => void;
  onToggleAdvancedFilters: () => void;
  onClearFilters: () => void;
  onShowTodayOnlyChange: (value: boolean) => void;
}

export default function OrderFilters({
  searchQuery,
  filterStore,
  filterDelivery,
  filterLocation,
  filterDateFrom,
  filterDateTo,
  showAdvancedFilters,
  stores,
  totalOrders,
  filteredOrdersCount,
  showTodayOnly,
  onSearchQueryChange,
  onFilterStoreChange,
  onFilterDeliveryChange,
  onFilterLocationChange,
  onFilterDateFromChange,
  onFilterDateToChange,
  onToggleAdvancedFilters,
  onClearFilters,
  onShowTodayOnlyChange,
}: OrderFiltersProps) {
  const hasActiveFilters =
    filterStore ||
    filterDelivery ||
    filterLocation ||
    filterDateFrom ||
    filterDateTo ||
    !showTodayOnly;

  return (
    <Card>
      <CardBody className="gap-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <Input
            isClearable
            className="flex-1"
            placeholder="搜尋店家、社群名稱、密碼、手機、訂購內容..."
            size="lg"
            value={searchQuery}
            onClear={() => onSearchQueryChange("")}
            onValueChange={onSearchQueryChange}
          />

          <Select
            className="md:w-48"
            label="取貨地點"
            placeholder="選擇取貨地點"
            selectedKeys={filterLocation ? [filterLocation] : []}
            onChange={(e) => onFilterLocationChange(e.target.value)}
          >
            {adminPickupLocations.map((location) => (
              <SelectItem key={location.value}>{location.label}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <Switch
            isSelected={showTodayOnly}
            onValueChange={onShowTodayOnlyChange}
          >
            僅顯示本日訂單
          </Switch>
        </div>

        <div className="flex items-center justify-between">
          <Button
            color="primary"
            size="sm"
            variant="light"
            onPress={onToggleAdvancedFilters}
          >
            {showAdvancedFilters ? "收起進階搜尋" : "展開進階搜尋"}
          </Button>
          {hasActiveFilters && (
            <Button
              color="default"
              size="sm"
              variant="flat"
              onPress={onClearFilters}
            >
              清除篩選
            </Button>
          )}
        </div>

        {showAdvancedFilters && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <div className="flex flex-wrap gap-4">
              <Input
                className="max-w-xs"
                label="下訂時間（起）"
                type="date"
                value={filterDateFrom}
                onValueChange={onFilterDateFromChange}
              />
              <Input
                className="max-w-xs"
                label="下訂時間（迄）"
                type="date"
                value={filterDateTo}
                onValueChange={onFilterDateToChange}
              />
            </div>
          </>
        )}

        <div className="text-sm text-default-500 text-center">
          共 {filteredOrdersCount} 筆訂單
          {filteredOrdersCount !== totalOrders &&
            ` (從 ${totalOrders} 筆中篩選)`}
        </div>
      </CardBody>
    </Card>
  );
}
