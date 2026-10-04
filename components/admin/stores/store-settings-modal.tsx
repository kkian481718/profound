"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Tab, Tabs } from "@heroui/tabs";

import { createClient } from "@/lib/supabase/client";

const DEFAULT_CATEGORIES = ["速食", "甜點", "超市", "飲料", "其他"];

interface StoreSettingsModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  store: {
    id: string;
    name: string;
    category?: string | null;
    is_open: boolean;
    order_deadline: string | null;
    max_daily_orders: number | null;
    menu_placeholder: string | null;
    extra_shipping_fee: number | null;
    extra_shipping_threshold: number | null;
  } | null;
  existingCategories?: string[];
  onSuccess: () => void;
}

export default function StoreSettingsModal({
  isOpen,
  onOpenChange,
  store,
  existingCategories = [],
  onSuccess,
}: StoreSettingsModalProps) {
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("其他");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const [deadline, setDeadline] = useState("");
  const [maxOrders, setMaxOrders] = useState("");
  const [extraFee, setExtraFee] = useState("");
  const [threshold, setThreshold] = useState("");
  const [placeholder, setPlaceholder] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories.filter(Boolean)]),
  );

  const convertToDatetimeLocal = (isoString: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (store) {
      setStoreName(store.name || "");
      const storeCat = store.category?.trim() || "其他";

      if (allCategories.includes(storeCat)) {
        setCategory(storeCat);
        setIsCustom(false);
        setCustomCategory("");
      } else {
        setCategory("__custom__");
        setIsCustom(true);
        setCustomCategory(storeCat);
      }

      setDeadline(convertToDatetimeLocal(store.order_deadline));
      setMaxOrders(store.max_daily_orders !== null ? String(store.max_daily_orders) : "");
      setExtraFee(store.extra_shipping_fee !== null ? String(store.extra_shipping_fee) : "");
      setThreshold(
        store.extra_shipping_threshold !== null ? String(store.extra_shipping_threshold) : "",
      );
      setPlaceholder(store.menu_placeholder || "");
      setError("");
    }
  }, [store]);

  const handleSelectCategory = (cat: string) => {
    if (cat === "__custom__") {
      setIsCustom(true);
      setCategory("__custom__");
    } else {
      setIsCustom(false);
      setCategory(cat);
    }
  };

  const handleQuickDeadline = (hoursToAdd?: number, specificHour?: number) => {
    const now = new Date();

    if (hoursToAdd !== undefined) {
      now.setHours(now.getHours() + hoursToAdd);
    } else if (specificHour !== undefined) {
      now.setHours(specificHour, 0, 0, 0);
    }
    setDeadline(convertToDatetimeLocal(now.toISOString()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    const finalCategory = isCustom ? customCategory.trim() : category;

    if (!storeName.trim()) {
      setError("店家名稱不能為空");

      return;
    }
    if (isCustom && !finalCategory) {
      setError("請輸入自訂分類名稱");

      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const updatePayload: Record<string, any> = {
        name: storeName.trim(),
        category: finalCategory || "其他",
        order_deadline: deadline ? new Date(deadline).toISOString() : null,
        max_daily_orders: maxOrders ? parseInt(maxOrders, 10) : null,
        extra_shipping_fee: extraFee ? parseFloat(extraFee) : null,
        extra_shipping_threshold: threshold ? parseFloat(threshold) : null,
        menu_placeholder: placeholder.trim() || null,
      };

      const { error: updateError } = await supabase
        .from("stores")
        .update(updatePayload)
        .eq("id", store.id);

      if (updateError) throw updateError;

      onOpenChange();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "更新店家設定失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal className="max-w-lg" isOpen={isOpen} scrollBehavior="inside" onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center justify-between pr-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground truncate max-w-[240px]">
                    {storeName || "店家設定"}
                  </h3>
                  <Chip
                    className="h-5 px-1.5 text-[10px]"
                    color={store?.is_open ? "success" : "default"}
                    size="sm"
                    variant="flat"
                  >
                    {store?.is_open ? "開放中" : "已關閉"}
                  </Chip>
                </div>
              </div>
              <p className="text-xs text-default-500 font-normal">
                管理店家基本資訊、接單時間限制與運費規則
              </p>
            </ModalHeader>

            <ModalBody className="pt-0">
              <form id="store-settings-form" onSubmit={handleSubmit}>
                <Tabs
                  aria-label="店家設定分頁"
                  className="w-full mb-3"
                  color="success"
                  variant="underlined"
                >
                  {/* 分頁 1: 基本資訊與分類 */}
                  <Tab key="basic" title="📋 基本資訊">
                    <div className="space-y-4 pt-1">
                      <Input
                        isRequired
                        label="店家名稱"
                        placeholder="請輸入店家名稱"
                        value={storeName}
                        onValueChange={setStoreName}
                      />

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">店家分類</p>
                        <div className="flex flex-wrap gap-1.5">
                          {allCategories.map((cat) => (
                            <Chip
                              key={cat}
                              className="cursor-pointer select-none text-xs"
                              color={!isCustom && category === cat ? "success" : "default"}
                              size="sm"
                              variant={!isCustom && category === cat ? "solid" : "flat"}
                              onClick={() => handleSelectCategory(cat)}
                            >
                              {cat}
                            </Chip>
                          ))}
                          <Chip
                            className="cursor-pointer select-none text-xs"
                            color={isCustom ? "success" : "default"}
                            size="sm"
                            variant={isCustom ? "solid" : "flat"}
                            onClick={() => handleSelectCategory("__custom__")}
                          >
                            + 自訂分類
                          </Chip>
                        </div>

                        {isCustom && (
                          <Input
                            className="mt-2"
                            label="自訂分類名稱"
                            placeholder="例如：便當、早午餐"
                            size="sm"
                            value={customCategory}
                            onValueChange={setCustomCategory}
                          />
                        )}
                      </div>
                    </div>
                  </Tab>

                  {/* 分頁 2: 截止時間與限制 */}
                  <Tab key="order_rules" title="⏰ 接單與運費">
                    <div className="space-y-4 pt-1">
                      {/* 截止時間 */}
                      <div className="space-y-2 p-3 rounded-xl bg-default-50 border border-default-100">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <span className="text-warning">⏰</span> 截止時間
                          </p>
                          {deadline && (
                            <button
                              className="text-[11px] text-danger hover:underline"
                              type="button"
                              onClick={() => setDeadline("")}
                            >
                              清除時間
                            </button>
                          )}
                        </div>
                        <Input
                          placeholder="選擇截止日期與時間"
                          size="sm"
                          type="datetime-local"
                          value={deadline}
                          onValueChange={setDeadline}
                        />

                        {/* 快捷按鈕 */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Button
                            className="h-6 px-2 text-[11px]"
                            size="sm"
                            variant="flat"
                            onPress={() => handleQuickDeadline(1)}
                          >
                            +1 小時
                          </Button>
                          <Button
                            className="h-6 px-2 text-[11px]"
                            size="sm"
                            variant="flat"
                            onPress={() => handleQuickDeadline(2)}
                          >
                            +2 小時
                          </Button>
                          <Button
                            className="h-6 px-2 text-[11px]"
                            size="sm"
                            variant="flat"
                            onPress={() => handleQuickDeadline(undefined, 17)}
                          >
                            今日 17:00
                          </Button>
                          <Button
                            className="h-6 px-2 text-[11px]"
                            size="sm"
                            variant="flat"
                            onPress={() => handleQuickDeadline(undefined, 19)}
                          >
                            今日 19:00
                          </Button>
                        </div>
                      </div>

                      {/* 每日單量限制 */}
                      <div className="space-y-2 p-3 rounded-xl bg-default-50 border border-default-100">
                        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <span className="text-primary">📦</span> 每日單量限制
                        </p>
                        <Input
                          min="0"
                          placeholder="留空表示不限制單量"
                          size="sm"
                          type="number"
                          value={maxOrders}
                          onValueChange={setMaxOrders}
                        />
                        <p className="text-[11px] text-default-400">達到上限後將自動停止接單</p>
                      </div>

                      {/* 遠距運費 */}
                      <div className="space-y-2 p-3 rounded-xl bg-default-50 border border-default-100">
                        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <span className="text-warning">🛵</span> 遠距額外運費
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="加收運費"
                            min="0"
                            placeholder="例如：30"
                            size="sm"
                            startContent={<span className="text-xs text-default-400">NT$</span>}
                            type="number"
                            value={extraFee}
                            onValueChange={setExtraFee}
                          />
                          <Input
                            label="免運門檻"
                            min="0"
                            placeholder="例如：300"
                            size="sm"
                            startContent={<span className="text-xs text-default-400">≥ NT$</span>}
                            type="number"
                            value={threshold}
                            onValueChange={setThreshold}
                          />
                        </div>
                      </div>
                    </div>
                  </Tab>

                  {/* 分頁 3: 提示文字 */}
                  <Tab key="placeholder" title="💬 點餐提示">
                    <div className="space-y-3 pt-1">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">
                          點餐提示文字 (顧客點餐時顯示)
                        </p>
                        <textarea
                          className="w-full min-h-[140px] p-3 text-xs sm:text-sm rounded-xl bg-default-100 border border-default-200 text-foreground focus:outline-none focus:ring-2 focus:ring-success/50 transition-all"
                          placeholder="例如：本服務屬於代購性質...（留空則顯示預設提示）"
                          value={placeholder}
                          onChange={(e) => setPlaceholder(e.target.value)}
                        />
                        <p className="text-[11px] text-default-400">
                          顧客在點餐表單填寫此店家時，將看到此段自訂提示資訊。
                        </p>
                      </div>
                    </div>
                  </Tab>
                </Tabs>

                {error && (
                  <div className="rounded-lg bg-danger-50 p-2.5 text-xs text-danger mb-2">
                    {error}
                  </div>
                )}
              </form>
            </ModalBody>

            <ModalFooter className="pt-2">
              <Button color="default" size="sm" variant="flat" onPress={onClose}>
                取消
              </Button>
              <Button
                color="success"
                form="store-settings-form"
                isLoading={loading}
                size="sm"
                type="submit"
              >
                儲存所有變更
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
