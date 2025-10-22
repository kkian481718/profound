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
import OrderList from "@/components/admin/orders/order-list";
import OrderCard from "@/components/admin/orders/order-card";
import OrderContentModal from "@/components/admin/orders/order-content-modal";
import { pickupLocations } from "@/components/order-form/constants";
import { GridIcon, TableIcon } from "@/components/icons";
import { Order } from "@/types";

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterDelivery, setFilterDelivery] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderForContent, setSelectedOrderForContent] =
    useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "card">("card");
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
    setCurrentPage(1); // 當篩選條件改變時，重置到第一頁
  }, [
    orders,
    searchQuery,
    filterStore,
    filterPayment,
    filterDelivery,
    filterLocation,
    filterDateFrom,
    filterDateTo,
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

    // 搜尋過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(
        (order) =>
          order.store_name.toLowerCase().includes(query) ||
          order.pickup_name.toLowerCase().includes(query) ||
          order.pickup_code.toLowerCase().includes(query) ||
          order.pickup_phone.includes(query),
      );
    }

    // 店家過濾
    if (filterStore) {
      filtered = filtered.filter((order) => order.store_id === filterStore);
    }

    // 付款狀態過濾
    if (filterPayment) {
      filtered = filtered.filter(
        (order) => order.payment_status === filterPayment,
      );
    }

    // 配送狀態過濾
    if (filterDelivery) {
      filtered = filtered.filter(
        (order) => order.delivery_status === filterDelivery,
      );
    }

    // 取貨地點過濾
    if (filterLocation) {
      // 從 constants 中提取宿舍地點（排除校外選項）
      const dormLocations: string[] = pickupLocations
        .filter((loc) => loc.value !== "校外")
        .map((loc) => loc.value);

      if (filterLocation === "校外") {
        filtered = filtered.filter(
          (order) => !dormLocations.includes(order.pickup_location),
        );
      } else {
        filtered = filtered.filter(
          (order) => order.pickup_location === filterLocation,
        );
      }
    }

    // 日期範圍過濾
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);

      filtered = filtered.filter(
        (order) => new Date(order.order_time) >= fromDate,
      );
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);

      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (order) => new Date(order.order_time) <= toDate,
      );
    }

    setFilteredOrders(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStore("");
    setFilterPayment("");
    setFilterDelivery("");
    setFilterLocation("");
    setFilterDateFrom("");
    setFilterDateTo("");
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
            color={viewMode === "table" ? "primary" : "default"}
            variant={viewMode === "table" ? "solid" : "flat"}
            onPress={() => setViewMode("table")}
          >
            <TableIcon className="w-5 h-5" />
            列表
          </Button>
          <Button
            color={viewMode === "card" ? "primary" : "default"}
            variant={viewMode === "card" ? "solid" : "flat"}
            onPress={() => setViewMode("card")}
          >
            <GridIcon className="w-5 h-5" />
            卡片
          </Button>
        </ButtonGroup>
      </div>

      <OrderFilters
        filterDateFrom={filterDateFrom}
        filterDateTo={filterDateTo}
        filterDelivery={filterDelivery}
        filterLocation={filterLocation}
        filterPayment={filterPayment}
        filterStore={filterStore}
        filteredOrdersCount={filteredOrders.length}
        searchQuery={searchQuery}
        showAdvancedFilters={showAdvancedFilters}
        stores={stores}
        totalOrders={orders.length}
        onClearFilters={clearFilters}
        onFilterDateFromChange={setFilterDateFrom}
        onFilterDateToChange={setFilterDateTo}
        onFilterDeliveryChange={setFilterDelivery}
        onFilterLocationChange={setFilterLocation}
        onFilterPaymentChange={setFilterPayment}
        onFilterStoreChange={setFilterStore}
        onSearchQueryChange={setSearchQuery}
        onToggleAdvancedFilters={() =>
          setShowAdvancedFilters(!showAdvancedFilters)
        }
      />

      {filteredOrders.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-default-500">無符合條件的訂單</p>
          </CardBody>
        </Card>
      ) : viewMode === "table" ? (
        <OrderList
          orders={paginatedOrders}
          onEditOrder={handleEditOrder}
          onViewContent={handleViewContent}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {paginatedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onEdit={handleEditOrder}
              onViewContent={handleViewContent}
            />
          ))}
        </div>
      )}

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

      {selectedOrder && (
        <EditStatusModal
          currentDeliveryStatus={selectedOrder.delivery_status}
          currentPaymentStatus={selectedOrder.payment_status}
          isOpen={isOpen}
          orderId={selectedOrder.id}
          orderInfo={{
            storeName: selectedOrder.store_name,
            pickupName: selectedOrder.pickup_name,
            pickupCode: selectedOrder.pickup_code,
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
