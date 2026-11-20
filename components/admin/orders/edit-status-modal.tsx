"use client";

import type { OrderItem } from "@/types";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { useDisclosure } from "@heroui/modal";

import { createClient } from "@/lib/supabase/client";
import { TrashIcon } from "@/components/icons";
import {
  calculateOrderPricing,
  calculatePerItemItemsPricing,
  StoreShippingConfig,
} from "@/components/order-form/utils/pricing";

const DEV_FEE = 10; // 網頁服務費固定 10 元

interface EditableOrderItem {
  name: string;
  unitPrice: string;
  quantity: string;
}

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
  storeShippingConfig?: StoreShippingConfig;
  orderItems?: OrderItem[] | null;
  orderQuantity?: number | null;
}

const toEditableItems = (
  items?: OrderItem[] | null,
  quantity?: number | null,
): EditableOrderItem[] => {
  if (items && items.length > 0) {
    return items.map((item) => ({
      name: item.name,
      unitPrice: String(item.unit_price),
      quantity: String(item.quantity),
    }));
  }

  if (quantity && quantity > 0) {
    return [
      {
        name: "",
        unitPrice: "",
        quantity: String(quantity),
      },
    ];
  }

  return [];
};

const parseEditableItems = (items: EditableOrderItem[]) =>
  items.map((item) => ({
    name: item.name.trim(),
    unit_price: Math.max(0, parseFloat(item.unitPrice) || 0),
    quantity: Math.max(0, Math.floor(parseFloat(item.quantity) || 0)),
  }));

export default function EditStatusModal({
  isOpen,
  onOpenChange,
  onSuccess,
  orderId,
  currentOrderStatus,
  currentAmounts,
  orderInfo,
  storeShippingConfig,
  orderItems,
  orderQuantity,
}: EditStatusModalProps) {
  const [orderStatus, setOrderStatus] = useState(currentOrderStatus);
  const [cost, setCost] = useState(String(currentAmounts.cost));
  const [shippingFee, setShippingFee] = useState(String(currentAmounts.shippingFee));
  const [items, setItems] = useState<EditableOrderItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isPerItemMode =
    storeShippingConfig?.shippingMethod === "per_item" || (orderItems?.length ?? 0) > 0;

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  // 當 props 改變時，更新 state
  useEffect(() => {
    setOrderStatus(currentOrderStatus);
    setCost(String(currentAmounts.cost));
    setShippingFee(String(currentAmounts.shippingFee));
    setItems(isPerItemMode ? toEditableItems(orderItems, orderQuantity) : []);
    setError("");
  }, [
    currentOrderStatus,
    currentAmounts.cost,
    currentAmounts.devFee,
    currentAmounts.shippingFee,
    orderId,
    isPerItemMode,
    orderItems,
    orderQuantity,
  ]);

  // 依公式計算的價格明細（僅供對照與自動帶入，不直接覆蓋 DB 現值）
  const formulaPricing = useMemo(() => {
    if (isPerItemMode) {
      return calculatePerItemItemsPricing(
        parseEditableItems(items).map((item) => ({
          unitPrice: item.unit_price,
          quantity: item.quantity,
        })),
        storeShippingConfig,
      );
    }

    return calculateOrderPricing(parseFloat(cost) || 0, storeShippingConfig);
  }, [isPerItemMode, items, cost, storeShippingConfig]);

  const formulaShippingFee = formulaPricing.shippingFee;
  const parsedShippingFee = Math.max(0, parseFloat(shippingFee) || 0);
  const shippingDeviated = Math.abs(parsedShippingFee - formulaShippingFee) > 0.5;

  const costNum = isPerItemMode ? formulaPricing.cost : Math.max(0, parseFloat(cost) || 0);
  const totalAmount = costNum + DEV_FEE + parsedShippingFee;

  // standard 模式：成本異動時自動重算運費
  const handleCostChange = (value: string) => {
    setCost(value);
    const pricing = calculateOrderPricing(parseFloat(value) || 0, storeShippingConfig);

    setShippingFee(String(pricing.shippingFee));
  };

  // per_item 模式：商品明細異動時自動重算成本與運費
  const recalcPerItemShipping = (nextItems: EditableOrderItem[]) => {
    const pricing = calculatePerItemItemsPricing(
      parseEditableItems(nextItems).map((item) => ({
        unitPrice: item.unit_price,
        quantity: item.quantity,
      })),
      storeShippingConfig,
    );

    setShippingFee(String(pricing.shippingFee));
  };

  const updateItem = (index: number, field: keyof EditableOrderItem, value: string) => {
    const nextItems = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));

    setItems(nextItems);
    recalcPerItemShipping(nextItems);
  };

  const addItem = () => {
    const nextItems = [...items, { name: "", unitPrice: "", quantity: "1" }];

    setItems(nextItems);
    recalcPerItemShipping(nextItems);
  };

  const removeItem = (index: number) => {
    const nextItems = items.filter((_, i) => i !== index);

    setItems(nextItems);
    recalcPerItemShipping(nextItems);
  };

  const validItemCount = isPerItemMode
    ? parseEditableItems(items).filter((item) => item.name.length > 0 && item.quantity >= 1).length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isPerItemMode && validItemCount === 0) {
        setError("請至少新增一項有效商品（需填寫品名且數量 ≥ 1）");

        return;
      }

      const supabase = createClient();

      let finalCost = costNum;
      let finalQuantity: number | null = null;
      let finalItems: OrderItem[] | null = null;

      if (isPerItemMode) {
        finalItems = parseEditableItems(items).filter(
          (item) => item.name.length > 0 && item.quantity >= 1,
        );
        const pricing = calculatePerItemItemsPricing(
          finalItems.map((item) => ({ unitPrice: item.unit_price, quantity: item.quantity })),
          storeShippingConfig,
        );

        finalCost = pricing.cost;
        finalQuantity = pricing.quantity ?? null;
      }

      const finalTotalAmount = finalCost + DEV_FEE + parsedShippingFee;

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          order_status: orderStatus,
          cost: finalCost,
          dev_fee: DEV_FEE,
          shipping_fee: parsedShippingFee,
          total_amount: finalTotalAmount,
          quantity: isPerItemMode ? finalQuantity : null,
          items: isPerItemMode ? finalItems : null,
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
    setShippingFee(String(currentAmounts.shippingFee));
    setItems(isPerItemMode ? toEditableItems(orderItems, orderQuantity) : []);
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

                    {isPerItemMode ? (
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-[1fr_90px_70px_32px] gap-2 text-xs text-default-500">
                          <span>品名</span>
                          <span>單價</span>
                          <span>數量</span>
                          <span />
                        </div>
                        {items.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-[1fr_90px_70px_32px] items-center gap-2"
                          >
                            <Input
                              aria-label={`商品 ${index + 1} 品名`}
                              placeholder="品名"
                              size="sm"
                              value={item.name}
                              onValueChange={(v) => updateItem(index, "name", v)}
                            />
                            <Input
                              aria-label={`商品 ${index + 1} 單價`}
                              placeholder="單價"
                              size="sm"
                              startContent={
                                <div className="pointer-events-none flex items-center">
                                  <span className="text-default-400 text-xs">$</span>
                                </div>
                              }
                              type="number"
                              value={item.unitPrice}
                              onValueChange={(v) => updateItem(index, "unitPrice", v)}
                            />
                            <Input
                              aria-label={`商品 ${index + 1} 數量`}
                              placeholder="數量"
                              size="sm"
                              type="number"
                              value={item.quantity}
                              onValueChange={(v) => updateItem(index, "quantity", v)}
                            />
                            <Button
                              isIconOnly
                              aria-label={`刪除商品 ${index + 1}`}
                              color="danger"
                              size="sm"
                              variant="light"
                              onPress={() => removeItem(index)}
                            >
                              <TrashIcon size={14} />
                            </Button>
                          </div>
                        ))}
                        <Button size="sm" variant="flat" onPress={addItem}>
                          新增品項
                        </Button>
                        <div className="flex justify-between px-1 text-sm">
                          <span className="text-default-600">
                            商品金額（共 {validItemCount} 項）：
                          </span>
                          <span className="font-medium">NT$ {formulaPricing.cost.toFixed(0)}</span>
                        </div>
                      </div>
                    ) : (
                      <Input
                        isRequired
                        aria-label="餐點原始金額"
                        label="餐點成本"
                        labelPlacement="outside"
                        min={0}
                        placeholder="0"
                        size="sm"
                        startContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-xs">NT$</span>
                          </div>
                        }
                        type="number"
                        value={cost}
                        onValueChange={handleCostChange}
                      />
                    )}

                    <Input
                      isRequired
                      aria-label="運費"
                      description={`公式運費：NT$ ${formulaShippingFee}（可手動調整）`}
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
                    {shippingDeviated && (
                      <p className="px-1 text-xs text-warning">
                        目前運費與公式不同（公式 NT$ {formulaShippingFee}
                        ），仍可手動調整後儲存
                      </p>
                    )}

                    {Math.abs(formulaShippingFee - currentAmounts.shippingFee) > 0.5 && (
                      <Chip className="self-start" color="warning" size="sm" variant="flat">
                        公式運費 NT$ {formulaShippingFee}（原訂單 NT$ {currentAmounts.shippingFee}）
                      </Chip>
                    )}

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
