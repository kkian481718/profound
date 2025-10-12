"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";

import { createClient } from "@/lib/supabase/client";

interface DeadlineEditorProps {
  storeId: string;
  currentDeadline: string | null;
  onSuccess: () => void;
}

export default function DeadlineEditor({
  storeId,
  currentDeadline,
  onSuccess,
}: DeadlineEditorProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [deadline, setDeadline] = useState("");

  const formatDeadline = (deadlineStr: string | null) => {
    if (!deadlineStr) return null;
    const date = new Date(deadlineStr);

    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const convertToDatetimeLocal = (deadlineStr: string) => {
    const date = new Date(deadlineStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleOpen = () => {
    if (currentDeadline) {
      setDeadline(convertToDatetimeLocal(currentDeadline));
    } else {
      setDeadline("");
    }
    onOpen();
  };

  const handleSave = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stores")
        .update({
          order_deadline: deadline ? new Date(deadline) : null,
        })
        .eq("id", storeId);

      if (error) throw error;

      setDeadline("");
      onSuccess();
      onOpenChange();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to update deadline:", err);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-default-500">
          {currentDeadline ? formatDeadline(currentDeadline) : "未設定"}
        </p>
        <Button color="primary" size="sm" variant="light" onPress={handleOpen}>
          編輯
        </Button>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                設定截止時間
              </ModalHeader>
              <ModalBody>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onValueChange={setDeadline}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  取消
                </Button>
                <Button color="success" onPress={handleSave}>
                  儲存
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
