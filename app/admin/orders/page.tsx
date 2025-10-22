"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { useDisclosure } from "@heroui/modal";
import { ButtonGroup } from "@heroui/button";

import { createClient } from "@/lib/supabase/client";
import EditStatusModal from "@/components/orders/edit-status-modal";
import OrderFilters from "@/components/orders/order-filters";
import { pickupLocations } from "@/components/order-form/constants";
import {
  ClockIcon,
  GridIcon,
  LocationIcon,
  LockIcon,
  PhoneIcon,
  TableIcon,
  UserIcon,
} from "@/components/icons";

interface Order {
  id: string;
  store_id: string;
  store_name: string;
  order_time: string;
  pickup_time: string;
  pickup_location: string;
  pickup_name: string;
  pickup_code: string;
  pickup_phone: string;
  cost: number;
  dev_fee: number;
  shipping_fee: number;
  total_amount: number;
  payment_status: "pending" | "paid" | "refunded";
  delivery_status:
    | "pending"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
}

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
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const itemsPerPage = 15;

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);

    return date.toLocaleString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getPaymentStatusColor = (
    status: string,
  ): "default" | "success" | "warning" => {
    switch (status) {
      case "paid":
        return "success";
      case "refunded":
        return "warning";
      default:
        return "default";
    }
  };

  const getDeliveryStatusColor = (
    status: string,
  ): "default" | "primary" | "success" | "warning" | "danger" => {
    switch (status) {
      case "preparing":
        return "primary";
      case "ready":
        return "warning";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "已付款";
      case "refunded":
        return "已退款";
      default:
        return "待付款";
    }
  };

  const getDeliveryStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return "準備中";
      case "ready":
        return "待取貨";
      case "completed":
        return "已完成";
      case "cancelled":
        return "已取消";
      default:
        return "待處理";
    }
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
        <Card>
          <CardBody className="overflow-x-auto">
            <Table aria-label="訂單列表">
              <TableHeader>
                <TableColumn>訂單時間</TableColumn>
                <TableColumn>店家</TableColumn>
                <TableColumn>取貨資訊</TableColumn>
                <TableColumn>取貨時間</TableColumn>
                <TableColumn>金額</TableColumn>
                <TableColumn>付款狀態</TableColumn>
                <TableColumn>配送狀態</TableColumn>
                <TableColumn>操作</TableColumn>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(order.order_time)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.store_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium">
                          {order.pickup_name}
                        </div>
                        <div className="text-xs text-default-500">
                          密碼：{order.pickup_code}
                        </div>
                        <div className="text-xs text-default-500">
                          {order.pickup_phone}
                        </div>
                        <div className="text-xs text-default-500">
                          {order.pickup_location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(order.pickup_time)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-default-500">
                          成本：${order.cost}
                        </div>
                        <div className="text-xs text-default-500">
                          運費：${order.shipping_fee}
                        </div>
                        <div className="text-xs text-default-500">
                          網頁費：${order.dev_fee}
                        </div>
                        <div className="font-medium">
                          總計：${order.total_amount}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={getPaymentStatusColor(order.payment_status)}
                        size="sm"
                        variant="flat"
                      >
                        {getPaymentStatusText(order.payment_status)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={getDeliveryStatusColor(order.delivery_status)}
                        size="sm"
                        variant="flat"
                      >
                        {getDeliveryStatusText(order.delivery_status)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={() => handleEditOrder(order)}
                      >
                        編輯狀態
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {paginatedOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-col gap-2 pb-2">
                <div className="flex justify-between items-start w-full">
                  <h3 className="text-sm md:text-base font-bold flex-1 pr-2 line-clamp-1">
                    {order.store_name}
                  </h3>
                  <div className="flex gap-1">
                    <Chip
                      className="text-xs"
                      color={getPaymentStatusColor(order.payment_status)}
                      size="sm"
                      variant="flat"
                    >
                      {getPaymentStatusText(order.payment_status)}
                    </Chip>
                  </div>
                </div>
                <div className="flex justify-between items-center w-full">
                  <p className="text-xs text-default-500">
                    {formatDateTime(order.order_time)}
                  </p>
                  <Chip
                    className="text-xs"
                    color={getDeliveryStatusColor(order.delivery_status)}
                    size="sm"
                    variant="flat"
                  >
                    {getDeliveryStatusText(order.delivery_status)}
                  </Chip>
                </div>
              </CardHeader>
              <CardBody className="pt-2 flex flex-col gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-default-400 flex-shrink-0" />
                    <span className="text-xs md:text-sm font-medium truncate">
                      {order.pickup_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <LockIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-default-400 flex-shrink-0" />
                    <span className="text-xs text-default-500 truncate">
                      密碼：{order.pickup_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PhoneIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-default-400 flex-shrink-0" />
                    <span className="text-xs text-default-500 truncate">
                      {order.pickup_phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <LocationIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-default-400 flex-shrink-0" />
                    <span className="text-xs text-default-500 truncate">
                      {order.pickup_location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-default-400 flex-shrink-0" />
                    <span className="text-xs text-default-500 truncate">
                      取貨：{formatDateTime(order.pickup_time)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-1.5 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-default-500">成本</span>
                    <span className="text-xs md:text-sm">${order.cost}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-default-500">運費</span>
                    <span className="text-xs md:text-sm">
                      ${order.shipping_fee}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-default-500">網頁費</span>
                    <span className="text-xs md:text-sm">${order.dev_fee}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold mt-0.5">
                    <span className="text-xs md:text-sm">總計</span>
                    <span className="text-sm md:text-base">
                      ${order.total_amount}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full mt-1.5"
                  color="primary"
                  size="sm"
                  variant="flat"
                  onPress={() => handleEditOrder(order)}
                >
                  編輯
                </Button>
              </CardBody>
            </Card>
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
