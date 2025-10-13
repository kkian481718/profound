"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

import { createClient } from "@/lib/supabase/client";

interface DeliveryTimeEditorProps {
  onSuccess?: () => void;
}

export default function DeliveryTimeEditor({
  onSuccess,
}: DeliveryTimeEditorProps) {
  const [globalNextDeliveryTime, setGlobalNextDeliveryTime] = useState("");
  const [isSavingDeliveryTime, setIsSavingDeliveryTime] = useState(false);

  useEffect(() => {
    fetchGlobalDeliveryTime();
  }, []);

  const fetchGlobalDeliveryTime = async () => {
    try {
      const supabase = createClient();
      // 從第一個店家讀取 next_delivery_time (假設所有店家共用同一個時間)
      const { data, error } = await supabase
        .from("stores")
        .select("next_delivery_time")
        .limit(1)
        .single();

      if (error) throw error;

      if (data?.next_delivery_time) {
        // 轉換為 datetime-local 格式
        const date = new Date(data.next_delivery_time);
        const localDateTime = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16);

        setGlobalNextDeliveryTime(localDateTime);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch global delivery time:", err);
    }
  };

  const saveGlobalDeliveryTime = async () => {
    if (!globalNextDeliveryTime) return;

    setIsSavingDeliveryTime(true);
    try {
      const supabase = createClient();
      const deliveryTime = new Date(globalNextDeliveryTime).toISOString();

      // 更新所有店家的 next_delivery_time
      const { error } = await supabase
        .from("stores")
        .update({ next_delivery_time: deliveryTime })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // 更新所有記錄

      if (error) throw error;

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to save global delivery time:", err);
    } finally {
      setIsSavingDeliveryTime(false);
    }
  };

  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <div className="w-full">
          <label
            className="mb-2 block text-sm font-medium"
            htmlFor="global-delivery-time"
          >
            下次出貨時間
          </label>
          <input
            className="w-full rounded-lg border-2 border-default-200 bg-default-100 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            id="global-delivery-time"
            type="datetime-local"
            value={globalNextDeliveryTime}
            onChange={(e) => setGlobalNextDeliveryTime(e.target.value)}
          />
          {globalNextDeliveryTime && (
            <div className="mt-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
              已儲存：
              {new Date(globalNextDeliveryTime).toLocaleString("zh-TW", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </div>
          )}
        </div>
        <Button
          className="w-full"
          color="primary"
          isDisabled={!globalNextDeliveryTime}
          isLoading={isSavingDeliveryTime}
          onPress={saveGlobalDeliveryTime}
        >
          儲存設定
        </Button>
      </CardBody>
    </Card>
  );
}
