"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { useDisclosure } from "@heroui/modal";

import { createClient } from "@/lib/supabase/client";
import { TrashIcon } from "@/components/icons";

interface EditStatusModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onSuccess: () => void;
  orderId: string;
  currentOrderStatus: "pending" | "preparing" | "completed";
  currentAmounts: {
    cost: number;
    devFee: number;
    shippingFee: number;
  };
  orderInfo: {
    storeName: string;
    pickupName: string;
  };
}

export default function EditStatusModal({
  isOpen,
  onOpenChange,
  onSuccess,
  orderId,
  currentOrderStatus,
  currentAmounts,
  orderInfo,
}: EditStatusModalProps) {
  const [orderStatus, setOrderStatus] = useState(currentOrderStatus);
  const [cost, setCost] = useState(String(currentAmounts.cost));
  const [devFee, setDevFee] = useState(String(currentAmounts.devFee));
  const [shippingFee, setShippingFee] = useState(String(currentAmounts.shippingFee));
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
    setOrderStatus(currentOrderStatus);
    setCost(String(currentAmounts.cost));
    setDevFee(String(currentAmounts.devFee));
    setShippingFee(String(currentAmounts.shippingFee));
    setError("");
  }, [
    currentOrderStatus,
    currentAmounts.cost,
    currentAmounts.devFee,
    currentAmounts.shippingFee,
    orderId,
  ]);

  const parsedCost = Math.max(0, parseFloat(cost) || 0);
  const parsedDevFee = Math.max(0, parseFloat(devFee) || 0);
  const parsedShippingFee = Math.max(0, parseFloat(shippingFee) || 0);
  const totalAmount = parsedCost + parsedDevFee + parsedShippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          order_status: orderStatus,
          cost: parsedCost,
          dev_fee: parsedDevFee,
          shipping_fee: parsedShippingFee,
          total_amount: totalAmount,
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
    setOrderStatus(currentOrderStatus);
    setCost(String(currentAmounts.cost));
    setDevFee(String(currentAmounts.devFee));
    setShippingFee(String(currentAmounts.shippingFee));
    setError("");
    onOpenChange();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase.from("orders").delete().eq("id", orderId);

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
              <ModalHeader className="flex flex-col gap-1">編輯訂單</ModalHeader>
              <ModalBody>
                <div className="mb-4 rounded-lg bg-default-100 p-3">
                  <div className="mb-2 text-sm font-medium">訂單資訊</div>
                  <div className="space-y-1 text-xs text-default-600">
                    <div>店家：{orderInfo.storeName}</div>
                    <div>社群名稱：{orderInfo.pickupName}</div>
                  </div>
                </div>

                <form className="flex flex-col gap-4" id="edit-status-form" onSubmit={handleSubmit}>
                  <Select
                    isRequired
                    label="訂單狀態"
                    selectedKeys={[orderStatus]}
                    onChange={(e) =>
                      setOrderStatus(e.target.value as "pending" | "preparing" | "completed")
                    }
                  >
                    <SelectItem
                      key="pending"
                      startContent={
                        <Chip className="min-w-16" color="default" size="sm" variant="flat">
                          待處理
                        </Chip>
                      }
                    >
                      待處理
                    </SelectItem>
                    <SelectItem
                      key="preparing"
                      startContent={
                        <Chip className="min-w-16" color="primary" size="sm" variant="flat">
                          準備中
                        </Chip>
                      }
                    >
                      準備中
                    </SelectItem>
                    <SelectItem
                      key="completed"
                      startContent={
                        <Chip className="min-w-16" color="success" size="sm" variant="flat">
                          已完成
                        </Chip>
                      }
                    >
                      已完成
                    </SelectItem>
                  </Select>

                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-medium">訂單金額</div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        isRequired
                        label="餐點成本"
                        labelPlacement="outside"
                        min={0}
                        size="sm"
                        startContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-xs">NT$</span>
                          </div>
                        }
                        type="number"
                        value={cost}
                        onValueChange={setCost}
                      />
                      <Input
                        isRequired
                        label="開發費"
                        labelPlacement="outside"
                        min={0}
                        size="sm"
                        startContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-xs">NT$</span>
                          </div>
                        }
                        type="number"
                        value={devFee}
                        onValueChange={setDevFee}
                      />
                      <Input
                        isRequired
                        label="運費"
                        labelPlacement="outside"
                        min={0}
                        size="sm"
                        startContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-xs">NT$</span>
                          </div>
                        }
                        type="number"
                        value={shippingFee}
                        onValueChange={setShippingFee}
                      />
                    </div>
                    <div className="flex justify-between items-center rounded-lg bg-default-100 px-3 py-2">
                      <span className="text-sm text-default-600">總金額</span>
                      <span className="font-bold">NT$ {totalAmount}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
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
                  <Button color="primary" form="edit-status-form" isLoading={loading} type="submit">
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
              <ModalHeader className="flex flex-col gap-1">確認刪除訂單</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <p className="text-default-700">您確定要刪除此訂單嗎？此操作無法復原。</p>

                  <div className="rounded-lg bg-danger-50 p-3">
                    <div className="mb-2 text-sm font-medium text-danger-600">訂單資訊</div>
                    <div className="space-y-1 text-xs text-danger-600">
                      <div>店家：{orderInfo.storeName}</div>
                      <div>社群名稱：{orderInfo.pickupName}</div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
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
