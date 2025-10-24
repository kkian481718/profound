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
  const [maxOrders, setMaxOrders] = useState<string>(
    currentMaxOrders?.toString() || "",
  );
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
    } catch (err) {
      console.error("Failed to update store max orders:", err);
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
    } catch (err) {
      console.error("Failed to clear store max orders:", err);
      alert("清除失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        className="flex-1"
        placeholder="不限制"
        size="sm"
        type="number"
        value={maxOrders}
        onChange={(e) => setMaxOrders(e.target.value)}
      />
      <Button
        color="primary"
        isLoading={isSaving}
        size="sm"
        onPress={handleSave}
      >
        儲存
      </Button>
      {currentMaxOrders !== null && (
        <Button
          color="default"
          isLoading={isSaving}
          size="sm"
          variant="light"
          onPress={handleClear}
        >
          清除
        </Button>
      )}
    </div>
  );
}
