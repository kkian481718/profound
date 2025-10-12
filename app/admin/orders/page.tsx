"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

import { createClient } from "@/lib/supabase/client";

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
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchData();
    const storeParam = searchParams.get("store");

    if (storeParam) {
      setFilterStore(storeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [
    orders,
    searchQuery,
    filterStore,
    filterPayment,
    filterDelivery,
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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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
    setFilterDateFrom("");
    setFilterDateTo("");
    router.push("/admin/orders");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">歷史訂單</h1>
        <p className="mt-2 text-default-500">查看和管理所有訂單記錄</p>
      </div>

      <Card>
        <CardBody className="gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Input
              isClearable
              placeholder="搜尋店家、取貨人、密碼、手機..."
              value={searchQuery}
              onClear={() => setSearchQuery("")}
              onValueChange={setSearchQuery}
            />

            <Select
              label="店家"
              placeholder="選擇店家"
              selectedKeys={filterStore ? [filterStore] : []}
              onChange={(e) => setFilterStore(e.target.value)}
            >
              {stores.map((store) => (
                <SelectItem key={store.id}>{store.name}</SelectItem>
              ))}
            </Select>

            <Select
              label="付款狀態"
              placeholder="選擇付款狀態"
              selectedKeys={filterPayment ? [filterPayment] : []}
              onChange={(e) => setFilterPayment(e.target.value)}
            >
              <SelectItem key="pending">待付款</SelectItem>
              <SelectItem key="paid">已付款</SelectItem>
              <SelectItem key="refunded">已退款</SelectItem>
            </Select>

            <Select
              label="配送狀態"
              placeholder="選擇配送狀態"
              selectedKeys={filterDelivery ? [filterDelivery] : []}
              onChange={(e) => setFilterDelivery(e.target.value)}
            >
              <SelectItem key="pending">待處理</SelectItem>
              <SelectItem key="preparing">準備中</SelectItem>
              <SelectItem key="ready">待取貨</SelectItem>
              <SelectItem key="completed">已完成</SelectItem>
              <SelectItem key="cancelled">已取消</SelectItem>
            </Select>
          </div>

          <div className="flex flex-wrap gap-4">
            <Input
              className="max-w-xs"
              label="下訂時間（起）"
              type="date"
              value={filterDateFrom}
              onValueChange={setFilterDateFrom}
            />
            <Input
              className="max-w-xs"
              label="下訂時間（迄）"
              type="date"
              value={filterDateTo}
              onValueChange={setFilterDateTo}
            />
            <Button color="default" variant="flat" onPress={clearFilters}>
              清除篩選
            </Button>
          </div>

          <div className="text-sm text-default-500">
            共 {filteredOrders.length} 筆訂單
            {filteredOrders.length !== orders.length &&
              ` (從 ${orders.length} 筆中篩選)`}
          </div>
        </CardBody>
      </Card>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-default-500">無符合條件的訂單</p>
          </CardBody>
        </Card>
      ) : (
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
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
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
