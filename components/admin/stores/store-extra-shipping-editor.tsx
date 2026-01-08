"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { createClient } from "@/lib/supabase/client";

interface StoreExtraShippingEditorProps {
  storeId: string;
  currentExtraFee: number | null;
  currentThreshold: number | null;
  onSuccess: () => void;
}

export default function StoreExtraShippingEditor({
  storeId,
  currentExtraFee,
  currentThreshold,
  onSuccess,
}: StoreExtraShippingEditorProps) {
  const [extraFee, setExtraFee] = useState<string>(currentExtraFee?.toString() || "");
  const [threshold, setThreshold] = useState<string>(currentThreshold?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const extraFeeNum = extraFee ? Number(extraFee) : null;
    const thresholdNum = threshold ? Number(threshold) : null;

    if (extraFeeNum !== null && (isNaN(extraFeeNum) || extraFeeNum < 0)) {
      alert("請輸入有效的額外運費金額");

      return;
    }

    if (thresholdNum !== null && (isNaN(thresholdNum) || thresholdNum < 0)) {
      alert("請輸入有效的免運門檻金額");

      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stores")
        .update({
          extra_shipping_fee: extraFeeNum,
          extra_shipping_threshold: thresholdNum,
        })
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
    setExtraFee("");
    setThreshold("");

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stores")
        .update({
          extra_shipping_fee: null,
          extra_shipping_threshold: null,
        })
        .eq("id", storeId);

      if (error) throw error;

      onSuccess();
    } catch {
      alert("清除失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  const hasExtraShipping = currentExtraFee !== null && currentExtraFee > 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Input
          className="flex-1"
          placeholder="不加收"
          size="sm"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-xs">NT$</span>
            </div>
          }
          type="number"
          value={extraFee}
          onChange={(e) => setExtraFee(e.target.value)}
        />
        <Input
          className="flex-1"
          placeholder="無門檻"
          size="sm"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-xs">≥</span>
            </div>
          }
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          className="flex-1"
          color="success"
          isLoading={isSaving}
          size="sm"
          variant={hasExtraShipping ? "flat" : "solid"}
          onPress={handleSave}
        >
          {hasExtraShipping ? "更新" : "儲存"}
        </Button>
        {hasExtraShipping && (
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
        {hasExtraShipping ? (
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-warning">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              遠距店家：加收 NT$ {currentExtraFee} 運費
            </span>
            {currentThreshold && currentThreshold > 0 && (
              <span className="flex items-center gap-1 text-success">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                訂單滿 NT$ {currentThreshold} 免加收
              </span>
            )}
          </div>
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
            無額外運費
          </span>
        )}
      </div>
    </div>
  );
}
