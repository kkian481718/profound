"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { createClient } from "@/lib/supabase/client";

interface StoreMaxOrdersEditorProps {
  storeId: string;
  currentMaxOrders: number | null;
  onSuccess: () => void;
}

export default function StoreMaxOrdersEditor({
  storeId,
  currentMaxOrders,
  onSuccess,
}: StoreMaxOrdersEditorProps) {
  const [maxOrders, setMaxOrders] = useState<string>(currentMaxOrders?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const maxOrdersNum = maxOrders ? Number(maxOrders) : null;

    if (maxOrdersNum !== null && (isNaN(maxOrdersNum) || maxOrdersNum < 0)) {
      alert("請輸入有效的最大訂單數");

      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stores")
        .update({ max_daily_orders: maxOrdersNum })
        .eq("id", storeId);

      if (error) throw error;

      onSuccess();
    } catch {
      alert("更新失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setMaxOrders("");

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stores")
        .update({ max_daily_orders: null })
        .eq("id", storeId);

      if (error) throw error;

      onSuccess();
    } catch {
      alert("清除失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          className="flex-1"
          placeholder="不限制"
          size="sm"
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
          onChange={(e) => setMaxOrders(e.target.value)}
        />
        <Button
          color="success"
          isLoading={isSaving}
          size="sm"
          variant={currentMaxOrders ? "flat" : "solid"}
          onPress={handleSave}
        >
          {currentMaxOrders ? "更新" : "儲存"}
        </Button>
        {currentMaxOrders !== null && (
          <Button
            color="default"
            isLoading={isSaving}
            size="sm"
            variant="bordered"
            onPress={handleClear}
          >
            清除
          </Button>
        )}
      </div>

      {/* 狀態顯示 */}
      <div className="text-xs text-default-500">
        {currentMaxOrders !== null ? (
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            目前限制：每日最多 {currentMaxOrders} 單
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            無限制訂單數
          </span>
        )}
      </div>
    </div>
  );
}
