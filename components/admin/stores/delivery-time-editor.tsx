"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";

import { createClient } from "@/lib/supabase/client";

interface DeliveryTimeEditorProps {
  onSuccess?: () => void;
}

export default function DeliveryTimeEditor({
  onSuccess,
}: DeliveryTimeEditorProps) {
  const [globalNextDeliveryTime, setGlobalNextDeliveryTime] = useState("");
  const [isSavingDeliveryTime, setIsSavingDeliveryTime] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchGlobalDeliveryTime();
  }, []);

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

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
          date.getTime() - date.getTimezoneOffset() * 60000
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

  const autoSaveDeliveryTime = useCallback(
    async (value: string) => {
      if (!value) {
        addToast({
          title: "輸入錯誤",
          description: "請選擇有效的出貨時間",
          color: "danger",
        });

        return;
      }

      const deliveryDate = new Date(value);
      const now = new Date();

      if (deliveryDate < now) {
        addToast({
          title: "時間錯誤",
          description: "出貨時間不能早於現在時間",
          color: "warning",
        });
        // 仍然儲存，但給予警告
      }

      setIsSavingDeliveryTime(true);
      try {
        const supabase = createClient();
        const deliveryTime = deliveryDate.toISOString();

        // 更新所有店家的 next_delivery_time
        const { error } = await supabase
          .from("stores")
          .update({ next_delivery_time: deliveryTime })
          .neq("id", "00000000-0000-0000-0000-000000000000"); // 更新所有記錄

        if (error) throw error;

        const formattedTime = deliveryDate.toLocaleString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        addToast({
          title: "出貨時間已更新",
          description: `所有店家的出貨時間已設定為 ${formattedTime}`,
          color: "success",
        });

        onSuccess?.();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save global delivery time:", err);
        addToast({
          title: "儲存失敗",
          description: "請稍後再試",
          color: "danger",
        });
      } finally {
        setIsSavingDeliveryTime(false);
      }
    },
    [onSuccess]
  );

  const handleTimeChange = useCallback(
    (value: string) => {
      setGlobalNextDeliveryTime(value);

      // 清除之前的 timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // 設置新的 timeout，1.5 秒後自動儲存
      const newTimeout = setTimeout(() => {
        autoSaveDeliveryTime(value);
      }, 1500);

      setSaveTimeout(newTimeout);
    },
    [saveTimeout, autoSaveDeliveryTime]
  );

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary-100 p-2">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <div>
            <h2 className="text-md font-semibold text-foreground">出貨時間</h2>
            <p className="text-sm text-default-500">
              提示客戶大概這個時間來取餐
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        {/* 當前出貨時間顯示 */}
        {globalNextDeliveryTime && (
          <div className="rounded-lg bg-primary-50 border border-primary-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  當前出貨時間
                </p>
                <p className="text-lg font-semibold text-primary">
                  {new Date(globalNextDeliveryTime).toLocaleString("zh-TW", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
                <p className="text-xs text-default-500">
                  {(() => {
                    const deliveryDate = new Date(globalNextDeliveryTime);
                    const now = new Date();
                    const diffHours = Math.round(
                      (deliveryDate.getTime() - now.getTime()) /
                        (1000 * 60 * 60)
                    );

                    if (diffHours < 0) {
                      return `已過期 ${Math.abs(diffHours)} 小時`;
                    } else if (diffHours < 24) {
                      return `${diffHours} 小時後出貨`;
                    } else {
                      return `${Math.round(diffHours / 24)} 天後出貨`;
                    }
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 警告提示 */}
        {globalNextDeliveryTime &&
          new Date(globalNextDeliveryTime) < new Date() && (
            <div className="flex gap-3 rounded-lg bg-warning-50 border border-warning-200 p-3">
              <svg
                className="h-4 w-4 text-warning flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <p className="text-sm text-warning-700">
                所設定的時間已過期，建議重新設定未來的出貨時間
              </p>
            </div>
          )}

        {/* 時間設定區域 */}
          <Input
            description={
              isSavingDeliveryTime ? "正在儲存..." : "更改後將自動儲存"
            }
            endContent={
              isSavingDeliveryTime && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span className="text-xs text-default-500">儲存中</span>
                </div>
              )
            }
            id="global-delivery-time"
            isDisabled={isSavingDeliveryTime}
            label="設定出貨時間"
            size="md"
            type="datetime-local"
            value={globalNextDeliveryTime}
            variant="bordered"
            onChange={(e) => handleTimeChange(e.target.value)}
          />
      </CardBody>
    </Card>
  );
}
