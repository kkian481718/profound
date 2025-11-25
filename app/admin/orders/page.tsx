"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useDisclosure } from "@heroui/modal";
import { ButtonGroup } from "@heroui/button";
import { Pagination } from "@heroui/pagination";

import { createClient } from "@/lib/supabase/client";
import EditStatusModal from "@/components/admin/orders/edit-status-modal";
import OrderFilters from "@/components/admin/orders/order-filters";
import OrderCard from "@/components/admin/orders/order-card";
import OrderContentModal from "@/components/admin/orders/order-content-modal";
import OrderStatsCards from "@/components/admin/orders/order-stats-cards";
import {
  adminPickupLocations,
  newDormitories,
  oldDormitories,
} from "@/components/order-form/constants";
import { GridIcon, ListIcon } from "@/components/icons";
import { Order } from "@/types";

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [filterDelivery, setFilterDelivery] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [showTodayOnly, setShowTodayOnly] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderForContent, setSelectedOrderForContent] =
    useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"detailed" | "summary">("summary");
  const [sortBy, setSortBy] = useState<"order_time" | "pickup_location">(
    "order_time",
  );
  const itemsPerPage = 15;

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isContentOpen,
    onOpen: onContentOpen,
    onOpenChange: onContentOpenChange,
  } = useDisclosure();

  useEffect(() => {
    fetchData();
    const storeParam = searchParams.get("store");

    if (storeParam) {
      setFilterStore(storeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // 當篩選條件改變時,重置到第一頁
  }, [
    orders,
    searchQuery,
    filterStore,
    filterDelivery,
    filterLocation,
    showTodayOnly,
    sortBy,
  ]);

  const fetchData = async () => {
    try {
      const supabase = createClient();

      // 獲取店家列表
      const { data: storesData } = await supabase
        .from("stores")
        .select("*")
        .order("name");

      setStores(storesData || []);

      // 獲取訂單列表
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          stores (
            name
          )
        `,
        )
        .order("order_time", { ascending: false });

      if (error) throw error;

      // 格式化訂單數據
      const formattedOrders =
        ordersData?.map((order: any) => ({
          ...order,
          store_name: order.stores?.name || "未知店家",
        })) || [];

      setOrders(formattedOrders);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // 本日訂單過濾
    if (showTodayOnly) {
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999,
      );

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.order_time);

        return orderDate >= todayStart && orderDate <= todayEnd;
      });
    }

    // 搜尋過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(
        (order) =>
          order.store_name.toLowerCase().includes(query) ||
          order.pickup_name.toLowerCase().includes(query) ||
          order.pickup_phone.includes(query) ||
          (order.menu_items && order.menu_items.toLowerCase().includes(query)),
      );
    }

    // 店家過濾
    if (filterStore) {
      filtered = filtered.filter((order) => order.store_id === filterStore);
    }

    // 訂單狀態過濾
    if (filterDelivery) {
      filtered = filtered.filter(
        (order) => order.order_status === filterDelivery,
      );
    }

    // 取貨地點過濾
    if (filterLocation) {
      // 從 constants 中提取宿舍地點（排除校外、校內教學區、新宿、舊宿選項）
      const dormLocations: string[] = adminPickupLocations
        .filter(
          (loc) =>
            loc.value !== "校外" &&
            loc.value !== "校內教學區" &&
            loc.value !== "新宿" &&
            loc.value !== "舊宿",
        )
        .map((loc) => loc.value);

      if (filterLocation === "校外") {
        // 過濾出校外地址：以 [校外] 開頭的地址，或不在宿舍名單中的地址（向後相容）
        filtered = filtered.filter(
          (order) =>
            order.pickup_location.startsWith("[校外]") ||
            (!dormLocations.includes(order.pickup_location) &&
              !order.pickup_location.startsWith("[校內教學區]")),
        );
      } else if (filterLocation === "校內教學區") {
        // 過濾出校內教學區地址：以 [校內教學區] 開頭的地址
        filtered = filtered.filter((order) =>
          order.pickup_location.startsWith("[校內教學區]"),
        );
      } else if (filterLocation === "新宿") {
        // 過濾出新宿地址：沁月、迎曦、行雲
        filtered = filtered.filter((order) =>
          newDormitories.includes(order.pickup_location as any),
        );
      } else if (filterLocation === "舊宿") {
        // 過濾出舊宿地址：向晴、仰山、涵星、擷雲
        filtered = filtered.filter((order) =>
          oldDormitories.includes(order.pickup_location as any),
        );
      } else {
        // 過濾出指定宿舍：不包含前綴標識的宿舍名稱
        filtered = filtered.filter(
          (order) => order.pickup_location === filterLocation,
        );
      }
    }

    // 排序
    if (sortBy === "order_time") {
      // 依照下單時間排序（最新到最舊）
      filtered.sort((a, b) => {
        return (
          new Date(b.order_time).getTime() - new Date(a.order_time).getTime()
        );
      });
    } else if (sortBy === "pickup_location") {
      // 依照取貨地點排序（新宿、舊宿分組）
      filtered.sort((a, b) => {
        const getLocationOrder = (location: string) => {
          // 校外地址
          if (location.startsWith("[校外]")) return 0;
          // 校內教學區
          if (location.startsWith("[校內教學區]")) return 1;
          // 新宿（沁月、迎曦、行雲）
          if (newDormitories.includes(location as any)) {
            return 2 + newDormitories.indexOf(location as any) * 0.1;
          }
          // 舊宿（向晴、仰山、涵星、擷雲）
          if (oldDormitories.includes(location as any)) {
            return 3 + oldDormitories.indexOf(location as any) * 0.1;
          }

          // 其他（兜底）
          return 999;
        };

        const orderA = getLocationOrder(a.pickup_location);
        const orderB = getLocationOrder(b.pickup_location);

        return orderA - orderB;
      });
    }

    setFilteredOrders(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStore("");
    setFilterDelivery("");
    setFilterLocation("");
    setShowTodayOnly(true);
    setSortBy("order_time");
    router.push("/admin/orders");
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    onOpen();
  };

  const handleViewContent = (order: Order) => {
    setSelectedOrderForContent(order);
    onContentOpen();
  };

  const handleStatusUpdateSuccess = () => {
    fetchData();
  };

  // 計算分頁相關數據
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">歷史訂單</h1>
        </div>
        <ButtonGroup>
          <Button
            color={viewMode === "detailed" ? "primary" : "default"}
            variant={viewMode === "detailed" ? "solid" : "flat"}
            onPress={() => setViewMode("detailed")}
          >
            <GridIcon className="w-5 h-5" />
            詳細
          </Button>
          <Button
            color={viewMode === "summary" ? "primary" : "default"}
            variant={viewMode === "summary" ? "solid" : "flat"}
            onPress={() => setViewMode("summary")}
          >
            <ListIcon className="w-5 h-5" />
            摘要
          </Button>
        </ButtonGroup>
      </div>

      {/* 今日訂單統計 */}
      <OrderStatsCards orders={orders} />

      <OrderFilters
        filterDelivery={filterDelivery}
        filterLocation={filterLocation}
        filterStore={filterStore}
        filteredOrdersCount={filteredOrders.length}
        searchQuery={searchQuery}
        showTodayOnly={showTodayOnly}
        sortBy={sortBy}
        stores={stores}
        totalOrders={orders.length}
        onClearFilters={clearFilters}
        onFilterDeliveryChange={setFilterDelivery}
        onFilterLocationChange={setFilterLocation}
        onFilterStoreChange={setFilterStore}
        onSearchQueryChange={setSearchQuery}
        onShowTodayOnlyChange={setShowTodayOnly}
        onSortByChange={setSortBy}
      />

      {filteredOrders.length > 0 && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            showControls
            page={currentPage}
            total={totalPages}
            onChange={setCurrentPage}
          />
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-default-500">無符合條件的訂單</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {paginatedOrders.map((order) => (
            <OrderCard
              key={order.id}
              isDetailed={viewMode === "detailed"}
              order={order}
              onEdit={handleEditOrder}
              onStatusChange={handleStatusUpdateSuccess}
              onViewContent={handleViewContent}
            />
          ))}
        </div>
      )}

      {selectedOrder && (
        <EditStatusModal
          currentOrderStatus={selectedOrder.order_status}
          isOpen={isOpen}
          orderId={selectedOrder.id}
          orderInfo={{
            storeName: selectedOrder.store_name,
            pickupName: selectedOrder.pickup_name,
          }}
          onOpenChange={onOpenChange}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}

      <OrderContentModal
        isOpen={isContentOpen}
        order={selectedOrderForContent}
        onOpenChange={onContentOpenChange}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <p>載入中...</p>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
