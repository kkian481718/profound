"use client";

import { useState, type FormEvent } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Alert } from "@heroui/alert";

import { createClient } from "@/lib/supabase/client";

type OrderData = {
  id: string;
  store_id: string;
  pickup_location: string | null;
  pickup_name: string;
  menu_items: string | null;
  menu_image_url: string | null;
  cost: number;
  dev_fee: number;
  shipping_fee: number;
  total_amount: number;
  order_status: string;
  created_at: string;
};

type OrderWithStore = OrderData & {
  storeName: string;
};

export function OrderLookup() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orders, setOrders] = useState<OrderWithStore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setOrders([]);

    if (!phoneNumber.trim()) {
      setError("請輸入手機號碼");

      return;
    }

    if (!/^09\d{8}$/.test(phoneNumber.trim())) {
      setError("請輸入有效的手機號碼");

      return;
    }

    setIsLoading(true);

    try {
      // 計算 24 小時前的時間
      const twentyFourHoursAgo = new Date();

      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error: queryError } = await supabase
        .from("orders")
        .select(
          `
          id,
          store_id,
          pickup_location,
          pickup_name,
          menu_items,
          menu_image_url,
          cost,
          dev_fee,
          shipping_fee,
          total_amount,
          order_status,
          created_at
        `,
        )
        .eq("pickup_phone", phoneNumber.trim())
        .gte("created_at", twentyFourHoursAgo.toISOString())
        .order("created_at", { ascending: false });

      if (queryError) {
        throw queryError;
      }

      if (!data || data.length === 0) {
        setError("找不到訂單，請確認手機號碼是否正確，或訂單可能已超過24小時");

        return;
      }

      // 查詢所有相關店家名稱
      const storeIds = Array.from(new Set(data.map((order) => order.store_id)));
      const { data: storesData } = await supabase
        .from("stores")
        .select("id, name")
        .in("id", storeIds);

      const storeNameMap: Record<string, string> = {};

      if (storesData) {
        storesData.forEach((store) => {
          storeNameMap[store.id] = store.name;
        });
      }

      // 組合訂單與店家名稱
      const ordersWithStores: OrderWithStore[] = data.map((order) => ({
        ...order,
        storeName: storeNameMap[order.store_id] || "未知店家",
      }));

      setOrders(ordersWithStores);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("查詢訂單失敗:", err);
      setError("查詢訂單時發生錯誤，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "待處理",
      preparing: "準備中",
      completed: "已完成",
    };

    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "text-warning",
      preparing: "text-primary",
      completed: "text-success",
    };

    return colorMap[status] || "text-default";
  };

  return (
    <Card className="w-full max-w-2xl shadow-small p-3">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <h2 className="text-2xl font-semibold">
          {orders.length > 0
            ? `${orders[0].pickup_name}，您有 ${orders.length} 筆訂單`
            : "查詢訂單"}
        </h2>
        <p className="text-sm text-default-500">
          {orders.length > 0 ? "以下是您的訂單資訊" : "僅限查詢24小時內的訂單"}
        </p>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            isRequired
            aria-label="手機號碼"
            label="手機號碼"
            maxLength={10}
            placeholder="請輸入手機號碼"
            type="tel"
            value={phoneNumber}
            onValueChange={setPhoneNumber}
          />

          {error && (
            <Alert color="danger" title="查詢失敗" variant="flat">
              {error}
            </Alert>
          )}

          <Button
            className="w-full md:w-auto"
            color="primary"
            isLoading={isLoading}
            type="submit"
          >
            查詢訂單
          </Button>
        </form>

        {orders.length > 0 && (
          <div className="flex flex-col gap-4">
            {orders.map((order, index) => (
              <Card key={order.id} className="bg-default-50">
                <CardBody className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">
                      訂單 {index + 1} - {order.storeName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-default-500">訂單編號:</span>
                        <p className="font-medium font-mono text-xs">
                          {order.id.slice(0, 8)}...
                        </p>
                      </div>
                      <div>
                        <span className="text-default-500">下單時間:</span>
                        <p className="font-medium">
                          {new Date(order.created_at).toLocaleString("zh-TW", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {order.pickup_location && (
                        <div>
                          <span className="text-default-500">取貨地點:</span>
                          <p className="font-medium">{order.pickup_location}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-default-500">訂單狀態:</span>
                        <p
                          className={`font-medium ${getStatusColor(order.order_status)}`}
                        >
                          {getStatusText(order.order_status)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-default-200 pt-4">
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-default-500">餐點費用:</span>
                        <span className="font-medium">NT$ {order.cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-500">服務費:</span>
                        <span className="font-medium">
                          NT$ {order.dev_fee + order.shipping_fee}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold border-t border-default-200 pt-2 mt-2">
                        <span>總金額:</span>
                        <span className="text-primary">
                          NT$ {order.total_amount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.menu_items && (
                    <div className="flex flex-col gap-2 border-t border-default-200 pt-4">
                      <span className="text-default-500 text-sm font-medium">
                        訂購內容:
                      </span>
                      <p className="whitespace-pre-wrap text-sm bg-default-100 p-3 rounded-lg">
                        {order.menu_items}
                      </p>
                    </div>
                  )}

                  {order.menu_image_url && (
                    <div className="flex flex-col gap-2 border-t border-default-200 pt-4">
                      <span className="text-default-500 text-sm font-medium">
                        菜單圖片:
                      </span>
                      <div className="relative w-full max-w-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt="菜單圖片"
                          className="w-full h-auto rounded-lg border-2 border-default-200"
                          src={order.menu_image_url}
                        />
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
