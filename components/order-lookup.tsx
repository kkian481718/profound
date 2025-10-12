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
  order_type: string;
  pickup_time: string | null;
  pickup_location: string | null;
  menu_items: string | null;
  menu_image_url: string | null;
  cost: number;
  shipping_fee: number;
  total_amount: number;
  payment_status: string;
  delivery_status: string;
  created_at: string;
};

export function OrderLookup() {
  const [pickupCode, setPickupCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [storeName, setStoreName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setOrder(null);
    setStoreName("");

    if (!pickupCode.trim() || !phoneNumber.trim()) {
      setError("請輸入取貨密碼和手機號碼");

      return;
    }

    if (pickupCode.trim().length !== 4) {
      setError("取貨密碼必須是4位數");

      return;
    }

    if (!/^09\d{8}$/.test(phoneNumber.trim())) {
      setError("請輸入有效的手機號碼");

      return;
    }

    setIsLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from("orders")
        .select(
          `
          id,
          store_id,
          order_type,
          pickup_time,
          pickup_location,
          menu_items,
          menu_image_url,
          cost,
          shipping_fee,
          total_amount,
          payment_status,
          delivery_status,
          created_at
        `,
        )
        .eq("pickup_code", pickupCode.trim())
        .eq("pickup_phone", phoneNumber.trim())
        .single();

      if (queryError) {
        if (queryError.code === "PGRST116") {
          setError("找不到訂單，請確認取貨密碼和手機號碼是否正確");
        } else {
          throw queryError;
        }

        return;
      }

      setOrder(data);

      // 查詢店家名稱
      if (data.store_id) {
        const { data: storeData } = await supabase
          .from("stores")
          .select("name")
          .eq("id", data.store_id)
          .single();

        if (storeData) {
          setStoreName(storeData.name);
        }
      }
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
      ready: "已就緒",
      completed: "已完成",
      cancelled: "已取消",
    };

    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "text-warning",
      preparing: "text-primary",
      ready: "text-success",
      completed: "text-success",
      cancelled: "text-danger",
    };

    return colorMap[status] || "text-default";
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "待付款",
      paid: "已付款",
      refunded: "已退款",
    };

    return statusMap[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "text-warning",
      paid: "text-success",
      refunded: "text-danger",
    };

    return colorMap[status] || "text-default";
  };

  return (
    <Card className="w-full max-w-2xl shadow-small p-3">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <h2 className="text-2xl font-semibold">查詢訂單</h2>
        <p className="text-sm text-default-500">
          請輸入取貨密碼和手機號碼查詢您的訂單
        </p>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            isRequired
            aria-label="取貨密碼"
            label="取貨密碼"
            maxLength={4}
            placeholder="請輸入4位數取貨密碼"
            value={pickupCode}
            onValueChange={setPickupCode}
          />

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

        {order && (
          <Card className="bg-default-50">
            <CardBody className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">訂單資訊</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-default-500">訂單編號:</span>
                    <p className="font-medium font-mono text-xs">
                      {order.id.slice(0, 8)}...
                    </p>
                  </div>
                  {storeName && (
                    <div>
                      <span className="text-default-500">店家:</span>
                      <p className="font-medium">{storeName}</p>
                    </div>
                  )}
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
                  {order.pickup_time && (
                    <div>
                      <span className="text-default-500">預計取貨時間:</span>
                      <p className="font-medium">
                        {new Date(order.pickup_time).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                  {order.pickup_location && (
                    <div>
                      <span className="text-default-500">取貨地點:</span>
                      <p className="font-medium">{order.pickup_location}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-default-500">訂單狀態:</span>
                    <p
                      className={`font-medium ${getStatusColor(order.delivery_status)}`}
                    >
                      {getStatusText(order.delivery_status)}
                    </p>
                  </div>
                  <div>
                    <span className="text-default-500">付款狀態:</span>
                    <p
                      className={`font-medium ${getPaymentStatusColor(order.payment_status)}`}
                    >
                      {getPaymentStatusText(order.payment_status)}
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
                    <span className="text-default-500">運費:</span>
                    <span className="font-medium">
                      NT$ {order.shipping_fee}
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
        )}
      </CardBody>
    </Card>
  );
}
