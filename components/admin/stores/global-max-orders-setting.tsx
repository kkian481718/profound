"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

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

  useEffect(() => {
    fetchGlobalSetting();
    fetchTodayOrderCount();
  }, []);

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
    } catch (err) {
      console.error("Failed to fetch global setting:", err);
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
    } catch (err) {
      console.error("Failed to fetch today's order count:", err);
    }
  };

  const handleSave = async () => {
    if (!maxOrders || isNaN(Number(maxOrders)) || Number(maxOrders) < 0) {
      alert("請輸入有效的最大訂單數");

      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("global_settings").upsert(
        {
          setting_key: "max_daily_orders",
          setting_value: maxOrders,
        },
        {
          onConflict: "setting_key",
        },
      );

      if (error) throw error;

      alert("全域設定已儲存");
      onSuccess?.();
    } catch (err) {
      console.error("Failed to save global setting:", err);
      alert("儲存失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

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
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">本日最大訂單數設定</h2>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <Input
              className="flex-1"
              label="本日最大訂單數"
              placeholder="輸入最大訂單數"
              type="number"
              value={maxOrders}
              onChange={(e) => setMaxOrders(e.target.value)}
            />
            <Button color="primary" isLoading={isSaving} onPress={handleSave}>
              儲存
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-default-600">
              今日已下單數：
              <span
                className={`font-semibold ${
                  isOverLimit
                    ? "text-danger"
                    : isNearLimit
                      ? "text-warning"
                      : "text-success"
                }`}
              >
                {todayOrderCount}
              </span>
              / {maxOrders}
            </span>
            <Button size="sm" variant="light" onPress={fetchTodayOrderCount}>
              重新整理
            </Button>
          </div>

          {isNearLimit && !isOverLimit && (
            <div className="rounded-lg bg-warning-50 p-3">
              <p className="text-sm text-warning-600">
                ⚠️ 警告：今日訂單數已接近上限，請留意訂單狀況
              </p>
            </div>
          )}

          {isOverLimit && (
            <div className="rounded-lg bg-danger-50 p-3">
              <p className="text-sm text-danger-600">
                🚫 注意：今日訂單數已達上限，新訂單將被阻擋
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
