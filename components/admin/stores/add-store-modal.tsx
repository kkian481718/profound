"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Switch } from "@heroui/switch";

import { createClient } from "@/lib/supabase/client";

const DEFAULT_CATEGORIES = ["速食", "甜點", "超市", "飲料", "其他"];

interface AddStoreModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onSuccess: () => void;
  existingCategories?: string[];
}

export default function AddStoreModal({
  isOpen,
  onOpenChange,
  onSuccess,
  existingCategories = [],
}: AddStoreModalProps) {
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("速食");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories.filter(Boolean)]),
  );

  const handleSelectCategory = (cat: string) => {
    if (cat === "__custom__") {
      setIsCustom(true);
      setCategory("__custom__");
    } else {
      setIsCustom(false);
      setCategory(cat);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const { error: insertError } = await supabase.from("stores").insert([
        {
          name: storeName.trim(),
          category: finalCategory || "其他",
          is_open: isStoreOpen,
          order_deadline: isStoreOpen && deadline ? new Date(deadline) : null,
        },
      ]);

      if (insertError) throw insertError;

      // 重置表單
      setStoreName("");
      setCategory("速食");
      setCustomCategory("");
      setIsCustom(false);
      setIsStoreOpen(false);
      setDeadline("");
      setError("");
      onOpenChange();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "新增店家失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // 重置表單狀態
    setStoreName("");
    setCategory("速食");
    setCustomCategory("");
    setIsCustom(false);
    setIsStoreOpen(false);
    setDeadline("");
    setError("");
    onOpenChange();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">新增外送店家</ModalHeader>
            <ModalBody>
              <form className="flex flex-col gap-4" id="add-store-form" onSubmit={handleSubmit}>
                <Input
                  isRequired
                  label="店家名稱"
                  placeholder="輸入店家名稱"
                  value={storeName}
                  onValueChange={setStoreName}
                />

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">店家分類</p>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map((cat) => (
                      <Chip
                        key={cat}
                        className="cursor-pointer select-none transition-all"
                        color={!isCustom && category === cat ? "success" : "default"}
                        variant={!isCustom && category === cat ? "solid" : "flat"}
                        onClick={() => handleSelectCategory(cat)}
                      >
                        {cat}
                      </Chip>
                    ))}
                    <Chip
                      className="cursor-pointer select-none transition-all"
                      color={isCustom ? "success" : "default"}
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

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">是否開放接單</p>
                    <p className="text-xs text-default-500">開啟後客戶可以向此店家下訂</p>
                  </div>
                  <Switch isSelected={isStoreOpen} onValueChange={setIsStoreOpen} />
                </div>

                {isStoreOpen && (
                  <Input
                    label="最後下單時間（選填）"
                    placeholder="選擇日期和時間"
                    type="datetime-local"
                    value={deadline}
                    onValueChange={setDeadline}
                  />
                )}

                {error && (
                  <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
                )}
              </form>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onPress={onClose}>
                取消
              </Button>
              <Button color="primary" form="add-store-form" isLoading={loading} type="submit">
                新增店家
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
