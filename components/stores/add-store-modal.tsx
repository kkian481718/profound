"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Switch } from "@heroui/switch";

import { createClient } from "@/lib/supabase/client";

interface AddStoreModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onSuccess: () => void;
}

export default function AddStoreModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: AddStoreModalProps) {
  const [storeName, setStoreName] = useState("");
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: insertError } = await supabase.from("stores").insert([
        {
          name: storeName,
          is_open: isStoreOpen,
          order_deadline: isStoreOpen && deadline ? new Date(deadline) : null,
        },
      ]);

      if (insertError) throw insertError;

      // 重置表單
      setStoreName("");
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
            <ModalHeader className="flex flex-col gap-1">
              新增外送店家
            </ModalHeader>
            <ModalBody>
              <form
                className="flex flex-col gap-4"
                id="add-store-form"
                onSubmit={handleSubmit}
              >
                <Input
                  isRequired
                  label="店家名稱"
                  placeholder="輸入店家名稱"
                  value={storeName}
                  onValueChange={setStoreName}
                />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">是否開放接單</p>
                    <p className="text-xs text-default-500">
                      開啟後客戶可以向此店家下訂
                    </p>
                  </div>
                  <Switch
                    isSelected={isStoreOpen}
                    onValueChange={setIsStoreOpen}
                  />
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
                  <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                    {error}
                  </div>
                )}
              </form>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onPress={onClose}>
                取消
              </Button>
              <Button
                color="primary"
                form="add-store-form"
                isLoading={loading}
                type="submit"
              >
                新增店家
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
