"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";

import { createClient } from "@/lib/supabase/client";

interface GlobalMaxOrdersSettingProps {
  onSuccess?: () => void;
}

export default function GlobalMaxOrdersSetting({
  onSuccess,
}: GlobalMaxOrdersSettingProps) {
  const [maxOrders, setMaxOrders] = useState<string>("100");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [todayOrderCount, setTodayOrderCount] = useState<number>(0);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchGlobalSetting();
    fetchTodayOrderCount();
  }, []);

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const fetchGlobalSetting = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("global_settings")
        .select("setting_value")
        .eq("setting_key", "max_daily_orders")
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 是沒有找到記錄的錯誤碼
        throw error;
      }

      if (data) {
        setMaxOrders(data.setting_value || "100");
      }
    } catch {
      // Error is handled by setting loading to false
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayOrderCount = async () => {
    try {
      const supabase = createClient();
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("order_time", startOfDay)
        .lte("order_time", endOfDay);

      if (error) throw error;
      setTodayOrderCount(count || 0);
    } catch {
      // Error is handled silently, count remains 0
    }
  };

  const autoSave = useCallback(
    async (value: string) => {
      if (!value || isNaN(Number(value)) || Number(value) < 0) {
        addToast({
          title: "輸入錯誤",
          description: "請輸入有效的最大訂單數",
          color: "danger",
        });

        return;
      }

      setIsSaving(true);

      try {
        const supabase = createClient();
        const { error } = await supabase.from("global_settings").upsert(
          {
            setting_key: "max_daily_orders",
            setting_value: value,
          },
          {
            onConflict: "setting_key",
          },
        );

        if (error) throw error;

        addToast({
          title: "設定已儲存",
          description: `每日訂單上限已更新為 ${value} 單`,
          color: "success",
        });
        onSuccess?.();
      } catch {
        addToast({
          title: "儲存失敗",
          description: "請稍後再試",
          color: "danger",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [onSuccess],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setMaxOrders(value);

      // 清除之前的 timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // 設置新的 timeout，1.5 秒後自動儲存
      const newTimeout = setTimeout(() => {
        autoSave(value);
      }, 1500);

      setSaveTimeout(newTimeout);
    },
    [saveTimeout, autoSave],
  );

  if (isLoading) {
    return (
      <Card>
        <CardBody className="py-4">
          <p className="text-center text-default-500">載入中...</p>
        </CardBody>
      </Card>
    );
  }

  const maxOrdersNum = Number(maxOrders);
  const isNearLimit = todayOrderCount >= maxOrdersNum * 0.8;
  const isOverLimit = todayOrderCount >= maxOrdersNum;

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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <div>
            <h2 className="text-md font-semibold text-foreground">
              每日訂單上限
            </h2>
            <p className="text-sm text-default-500">超過後，系統會停止接單</p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        {/* 當前狀態指示器 */}
        <div className="flex items-center justify-between rounded-lg bg-primary-50 border border-primary-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
              <span className="text-lg font-bold text-white">
                {todayOrderCount}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">今日訂單數</p>
              <p className="text-xs text-default-500">
                上限 {maxOrders} 單 • 剩餘{" "}
                {Math.max(0, Number(maxOrders) - todayOrderCount)} 單
              </p>
            </div>
          </div>
        </div>

        {/* 狀態警告 */}
        {isNearLimit && !isOverLimit && (
          <div className="flex gap-3 rounded-lg bg-warning-50 border border-warning-200 p-4">
            <svg
              className="h-5 w-5 text-warning flex-shrink-0 mt-0.5"
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
            <div>
              <p className="text-sm font-medium text-warning-800">接近上限</p>
              <p className="text-sm text-warning-600">
                今日訂單數已接近設定上限，請密切關注訂單狀況
              </p>
            </div>
          </div>
        )}

        {isOverLimit && (
          <div className="flex gap-3 rounded-lg bg-danger-50 border border-danger-200 p-4">
            <svg
              className="h-5 w-5 text-danger flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-danger-800">已達上限</p>
              <p className="text-sm text-danger-600">
                今日訂單數已達到設定上限，系統將暫停接受新訂單
              </p>
            </div>
          </div>
        )}

        {/* 設定區域 */}
        <div className="flex gap-3">
          <Input
            description={isSaving ? "正在儲存..." : "更改後將自動儲存"}
            endContent={
              isSaving && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span className="text-xs text-default-500">儲存中</span>
                </div>
              )
            }
            isDisabled={isSaving}
            label="設定上限"
            placeholder="輸入最大訂單數"
            startContent={
              <svg
                className="h-4 w-4 text-default-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            }
            type="number"
            value={maxOrders}
            variant="bordered"
            onChange={(e) => handleInputChange(e.target.value)}
          />
        </div>
      </CardBody>
    </Card>
  );
}
