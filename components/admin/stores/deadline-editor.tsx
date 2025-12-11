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
      <div className="flex justify-between gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-default-100 p-2 w-full">
          <svg
            className="h-4 w-4 text-warning"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
          <div>
            {currentDeadline ? (
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatDeadline(currentDeadline)}
                </p>
                <p className="text-xs text-default-500">
                  {(() => {
                    const deadlineDate = new Date(currentDeadline);
                    const now = new Date();
                    const diffHours = Math.round(
                      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60),
                    );

                    if (diffHours < 0) {
                      return `已過期 ${Math.abs(diffHours)} 小時`;
                    } else if (diffHours < 1) {
                      return "即將截止";
                    } else if (diffHours < 24) {
                      return `${diffHours} 小時後截止`;
                    } else {
                      return `${Math.round(diffHours / 24)} 天後截止`;
                    }
                  })()}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-default-500">未設定截止時間</p>
              </div>
            )}
          </div>
        </div>
        <Button
          color="success"
          size="sm"
          variant={currentDeadline ? "flat" : "solid"}
          onPress={handleOpen}
        >
          {currentDeadline ? "修改" : "設定"}
        </Button>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-warning-100 p-2">
                    <svg
                      className="h-5 w-5 text-warning"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">設定截止時間</h3>
                    <p className="text-sm text-default-500">設定此店家的接單截止時間</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="截止時間"
                    startContent={
                      <svg
                        className="h-4 w-4 text-default-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    }
                    type="datetime-local"
                    value={deadline}
                    onValueChange={setDeadline}
                  />

                  {/* 快速設定選項 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">快速設定</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          const time = new Date();

                          time.setHours(17, 0, 0, 0);
                          setDeadline(convertToDatetimeLocal(time.toISOString()));
                        }}
                      >
                        17:00
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          const time = new Date();

                          time.setHours(19, 0, 0, 0);
                          setDeadline(convertToDatetimeLocal(time.toISOString()));
                        }}
                      >
                        19:00
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          const time = new Date();

                          time.setHours(20, 0, 0, 0);
                          setDeadline(convertToDatetimeLocal(time.toISOString()));
                        }}
                      >
                        20:00
                      </Button>
                    </div>
                  </div>

                  {deadline && (
                    <div className="rounded-lg bg-primary-50 border border-primary-200 p-3">
                      <p className="text-sm text-primary-700">
                        <span className="font-medium">預覽：</span>
                        將在{" "}
                        {new Date(deadline).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}{" "}
                        停止接單
                      </p>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  取消
                </Button>
                <Button color="primary" isDisabled={!deadline} onPress={handleSave}>
                  確認設定
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
