"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Chip } from "@heroui/chip";

import { createClient } from "@/lib/supabase/client";

const DEFAULT_CATEGORIES = ["速食", "甜點", "超市", "飲料", "其他"];

interface EditStoreModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  store: {
    id: string;
    name: string;
    category?: string | null;
  } | null;
  existingCategories?: string[];
  onSuccess: () => void;
}

export default function EditStoreModal({
  isOpen,
  onOpenChange,
  store,
  existingCategories = [],
  onSuccess,
}: EditStoreModalProps) {
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("其他");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Combine default categories with any existing ones from stores
  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories.filter(Boolean)]),
  );

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
      const { error: updateError } = await supabase
        .from("stores")
        .update({
          name: storeName.trim(),
          category: finalCategory || "其他",
        })
        .eq("id", store.id);

      if (updateError) throw updateError;

      onOpenChange();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "更新店家資訊失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">編輯店家資訊</ModalHeader>
            <ModalBody>
              <form className="flex flex-col gap-4" id="edit-store-form" onSubmit={handleSubmit}>
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

                {error && (
                  <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
                )}
              </form>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onPress={onClose}>
                取消
              </Button>
              <Button color="success" form="edit-store-form" isLoading={loading} type="submit">
                儲存變更
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
