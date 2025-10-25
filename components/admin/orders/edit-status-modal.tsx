"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { useDisclosure } from "@heroui/modal";

import { createClient } from "@/lib/supabase/client";
import { TrashIcon } from "@/components/icons";

interface EditStatusModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onSuccess: () => void;
  orderId: string;
  currentPaymentStatus: "pending" | "paid" | "refunded";
  currentDeliveryStatus:
    | "pending"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  orderInfo: {
    storeName: string;
    pickupName: string;
    pickupCode: string;
  };
}

export default function EditStatusModal({
  isOpen,
  onOpenChange,
  onSuccess,
  orderId,
  currentPaymentStatus,
  currentDeliveryStatus,
  orderInfo,
}: EditStatusModalProps) {
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [deliveryStatus, setDeliveryStatus] = useState(currentDeliveryStatus);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  // 當 props 改變時，更新 state
  useEffect(() => {
    setPaymentStatus(currentPaymentStatus);
    setDeliveryStatus(currentDeliveryStatus);
    setError("");
  }, [currentPaymentStatus, currentDeliveryStatus, orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: paymentStatus,
          delivery_status: deliveryStatus,
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      onOpenChange();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "更新狀態失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // 重置表單狀態
    setPaymentStatus(currentPaymentStatus);
    setDeliveryStatus(currentDeliveryStatus);
    setError("");
    onOpenChange();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (deleteError) throw deleteError;

      onDeleteOpenChange();
      onOpenChange();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "刪除訂單失敗");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={handleClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                編輯訂單狀態
              </ModalHeader>
              <ModalBody>
                <div className="mb-4 rounded-lg bg-default-100 p-3">
                  <div className="mb-2 text-sm font-medium">訂單資訊</div>
                  <div className="space-y-1 text-xs text-default-600">
                    <div>店家：{orderInfo.storeName}</div>
                    <div>社群名稱：{orderInfo.pickupName}</div>
                    <div>取貨密碼：{orderInfo.pickupCode}</div>
                  </div>
                </div>

                <form
                  className="flex flex-col gap-4"
                  id="edit-status-form"
                  onSubmit={handleSubmit}
                >
                  <Select
                    isRequired
                    label="付款狀態"
                    selectedKeys={[paymentStatus]}
                    onChange={(e) =>
                      setPaymentStatus(
                        e.target.value as "pending" | "paid" | "refunded",
                      )
                    }
                  >
                    <SelectItem
                      key="pending"
                      startContent={
                        <Chip
                          className="min-w-16"
                          color="default"
                          size="sm"
                          variant="flat"
                        >
                          待付款
                        </Chip>
                      }
                    >
                      待付款
                    </SelectItem>
                    <SelectItem
                      key="paid"
                      startContent={
                        <Chip
                          className="min-w-16"
                          color="success"
                          size="sm"
                          variant="flat"
                        >
                          已付款
                        </Chip>
                      }
                    >
                      已付款
                    </SelectItem>
                    <SelectItem
                      key="refunded"
                      startContent={
                        <Chip
                          className="min-w-16"
                          color="warning"
                          size="sm"
                          variant="flat"
                        >
                          已退款
                        </Chip>
                      }
                    >
                      已退款
                    </SelectItem>
                  </Select>

                  <Select
                    isRequired
                    label="配送狀態"
                    selectedKeys={[deliveryStatus]}
                    onChange={(e) =>
                      setDeliveryStatus(
                        e.target.value as
                          | "pending"
                          | "preparing"
                          | "ready"
                          | "completed"
                          | "cancelled",
                      )
                    }
                  >
                    <SelectItem
                      key="pending"
                      startContent={
                        <Chip
                          className="min-w-16"
                          color="default"
                          size="sm"
                          variant="flat"
                        >
                          待處理
                        </Chip>
                      }
                    >
                      待處理
                    </SelectItem>
                    <SelectItem
                      key="preparing"
                      startContent={
                        <Chip
                          className="min-w-16"
                          color="primary"
                          size="sm"
                          variant="flat"
                        >
                          準備中
                        </Chip>
                      }
                    >
                      準備中
                    </SelectItem>
                    <SelectItem
                      key="ready"
                      startContent={
                        <Chip
                          className="min-w-16"
                          color="warning"
                          size="sm"
                          variant="flat"
                        >
                          待取貨
                        </Chip>
                      }
                    >
                      待取貨
                    </SelectItem>
                    <SelectItem
                      key="completed"
                      startContent={
                        <Chip
                          className="min-w-16"
                          color="success"
                          size="sm"
                          variant="flat"
                        >
                          已完成
                        </Chip>
                      }
                    >
                      已完成
                    </SelectItem>
                    <SelectItem
                      key="cancelled"
                      startContent={
                        <Chip
                          className="min-w-16"
                          color="danger"
                          size="sm"
                          variant="flat"
                        >
                          已取消
                        </Chip>
                      }
                    >
                      已取消
                    </SelectItem>
                  </Select>

                  {error && (
                    <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                      {error}
                    </div>
                  )}
                </form>
              </ModalBody>
              <ModalFooter className="flex justify-between">
                <Button
                  color="danger"
                  startContent={<TrashIcon size={16} />}
                  variant="flat"
                  onPress={onDeleteOpen}
                >
                  刪除訂單
                </Button>
                <div className="flex gap-2">
                  <Button color="default" variant="flat" onPress={onClose}>
                    取消
                  </Button>
                  <Button
                    color="primary"
                    form="edit-status-form"
                    isLoading={loading}
                    type="submit"
                  >
                    儲存變更
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 刪除確認對話框 */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                確認刪除訂單
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <p className="text-default-700">
                    您確定要刪除此訂單嗎？此操作無法復原。
                  </p>

                  <div className="rounded-lg bg-danger-50 p-3">
                    <div className="mb-2 text-sm font-medium text-danger-600">
                      訂單資訊
                    </div>
                    <div className="space-y-1 text-xs text-danger-600">
                      <div>店家：{orderInfo.storeName}</div>
                      <div>社群名稱：{orderInfo.pickupName}</div>
                      <div>取貨密碼：{orderInfo.pickupCode}</div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                      {error}
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  取消
                </Button>
                <Button
                  color="danger"
                  isLoading={deleteLoading}
                  startContent={!deleteLoading && <TrashIcon size={16} />}
                  onPress={handleDelete}
                >
                  確認刪除
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
