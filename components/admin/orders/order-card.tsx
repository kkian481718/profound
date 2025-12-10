"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Snippet } from "@heroui/snippet";
import { Textarea } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";

import {
  LocationIcon,
  PhoneIcon,
  UserIcon,
  NoteIcon,
} from "@/components/icons";
import { Order } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onViewContent?: (order: Order) => void;
  onStatusChange?: () => void;
  isDetailed?: boolean;
}

export default function OrderCard({
  order,
  onEdit,
  onViewContent,
  onStatusChange,
  isDetailed = false,
}: OrderCardProps) {
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  // 樂觀更新：本地狀態用於即時 UI 反饋
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  // 管理員備註相關狀態
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(order.admin_note || "");
  const [noteSaving, setNoteSaving] = useState(false);

  // 顯示的狀態：優先使用樂觀更新的狀態
  const displayStatus = optimisticStatus ?? order.order_status;

  const handleSaveNote = async () => {
    setNoteSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ admin_note: noteValue.trim() || null })
        .eq("id", order.id);

      if (error) throw error;
      setIsEditingNote(false);
      onStatusChange?.();
    } catch (err) {
      console.error("儲存備註失敗:", err);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleCancelNote = () => {
    setNoteValue(order.admin_note || "");
    setIsEditingNote(false);
  };

  const handleQuickStatusChange = async (
    newStatus: "pending" | "preparing" | "completed"
  ) => {
    if (displayStatus === newStatus) return;

    // 樂觀更新：立即更新 UI
    setOptimisticStatus(newStatus);
    setStatusLoading(newStatus);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ order_status: newStatus })
        .eq("id", order.id);

      if (error) throw error;
      onStatusChange?.();
    } catch (err) {
      console.error("更新狀態失敗:", err);
      // 失敗時回滾到原始狀態
      setOptimisticStatus(null);
    } finally {
      setStatusLoading(null);
      // 成功後清除樂觀狀態，讓 props 接管
      setOptimisticStatus(null);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);

    return date.toLocaleString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getOrderStatusColor = (
    status: string
  ): "default" | "primary" | "success" => {
    switch (status) {
      case "preparing":
        return "primary";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return "準備中";
      case "completed":
        return "已完成";
      default:
        return "待處理";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow h-full">
      <CardHeader className="flex flex-col gap-2 pb-2">
        <div className="flex justify-between items-start w-full">
          <h3 className="text-sm md:text-base font-bold flex-1 pr-2 line-clamp-1">
            {order.store_name}
          </h3>
          <Chip
            className="text-xs"
            color={getOrderStatusColor(order.order_status)}
            size="sm"
            variant="flat"
          >
            {getOrderStatusText(order.order_status)}
          </Chip>
        </div>
        <div className="flex justify-between items-center w-full">
          <p className="text-xs text-default-500">
            {formatDateTime(order.order_time)}
          </p>
        </div>
      </CardHeader>
      <CardBody className="pt-2 flex flex-col gap-2 h-full">
        <div className="space-y-1 flex-1">
          <Snippet
            hideSymbol
            classNames={{
              base: "bg-transparent p-0 gap-1.5",
              pre: "text-xs md:text-sm font-medium",
              copyButton: "min-w-6 w-6 h-6",
            }}
            size="sm"
            variant="flat"
          >
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-default-400 flex-shrink-0" />
              <span>{order.pickup_name}</span>
            </div>
          </Snippet>
          <div className="flex items-center gap-1.5">
            <PhoneIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-default-400 flex-shrink-0" />
            <span className="text-xs text-default-500 truncate">
              {order.pickup_phone}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <LocationIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-default-400 flex-shrink-0" />
            <span className="text-xs text-default-500 truncate">
              {order.pickup_location}
            </span>
          </div>
          {order.menu_items && (
            <div className="flex items-start gap-1.5 mt-2">
              <span className="text-xs text-default-400 mt-0.5 flex-shrink-0">
                {isDetailed ? "內容:" : "摘要:"}
              </span>
              <span
                className={`text-xs text-default-500 ${isDetailed ? "whitespace-pre-wrap" : "line-clamp-2"}`}
              >
                {isDetailed
                  ? order.menu_items
                  : order.menu_items.length > 50
                    ? `${order.menu_items.substring(0, 50)}...`
                    : order.menu_items}
              </span>
            </div>
          )}
          {isDetailed && order.menu_image_url && (
            <div className="mt-2">
              <img
                alt="訂單圖片"
                className="w-full rounded-lg object-cover max-h-48"
                src={order.menu_image_url}
              />
            </div>
          )}

          {/* 管理員備註區域 */}
          <div className="mt-2 pt-2 border-t border-dashed border-default-200">
            {isEditingNote ? (
              <div className="space-y-2">
                <Textarea
                  minRows={2}
                  placeholder="輸入管理員備註..."
                  size="sm"
                  value={noteValue}
                  variant="bordered"
                  onValueChange={setNoteValue}
                />
                <div className="flex gap-1.5 justify-end">
                  <Button
                    isDisabled={noteSaving}
                    size="sm"
                    variant="flat"
                    onPress={handleCancelNote}
                  >
                    取消
                  </Button>
                  <Button
                    color="primary"
                    isLoading={noteSaving}
                    size="sm"
                    onPress={handleSaveNote}
                  >
                    儲存
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-1.5">
                <NoteIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-default-400 flex-shrink-0 mt-0.5" />
                {order.admin_note ? (
                  <Tooltip content="點擊編輯備註">
                    <button
                      className="text-xs text-warning-600 dark:text-warning-400 text-left hover:underline cursor-pointer line-clamp-2"
                      onClick={() => setIsEditingNote(true)}
                    >
                      {order.admin_note}
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    className="text-xs text-default-400 hover:text-default-600 cursor-pointer"
                    onClick={() => setIsEditingNote(true)}
                  >
                    + 新增備註
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <div className="border-t pt-1.5">
            {isDetailed && (
              <div className="space-y-0.5 mb-1.5">
                <div className="flex justify-between items-center text-default-500">
                  <span className="text-xs">餐點成本</span>
                  <span className="text-xs">${order.cost}</span>
                </div>
                <div className="flex justify-between items-center text-default-500">
                  <span className="text-xs">開發費</span>
                  <span className="text-xs">${order.dev_fee}</span>
                </div>
                <div className="flex justify-between items-center text-default-500">
                  <span className="text-xs">運費</span>
                  <span className="text-xs">${order.shipping_fee}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center font-bold">
              <span className="text-xs md:text-sm">總金額</span>
              <span className="text-sm md:text-base">
                ${order.total_amount}
              </span>
            </div>
          </div>

          {/* 狀態切換 - 使用分段控制器樣式 */}
          <div className="flex items-center gap-1 p-1 bg-default-100 rounded-lg mt-2">
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                displayStatus === "pending"
                  ? "bg-white dark:bg-default-50 shadow-sm text-default-700"
                  : "text-default-500 hover:text-default-700"
              } ${statusLoading === "pending" ? "opacity-50" : ""}`}
              disabled={displayStatus === "pending" || statusLoading !== null}
              onClick={() => handleQuickStatusChange("pending")}
            >
              {statusLoading === "pending" ? "..." : "待處理"}
            </button>
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                displayStatus === "preparing"
                  ? "bg-white dark:bg-default-50 shadow-sm text-primary"
                  : "text-default-500 hover:text-default-700"
              } ${statusLoading === "preparing" ? "opacity-50" : ""}`}
              disabled={displayStatus === "preparing" || statusLoading !== null}
              onClick={() => handleQuickStatusChange("preparing")}
            >
              {statusLoading === "preparing" ? "..." : "準備中"}
            </button>
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                displayStatus === "completed"
                  ? "bg-white dark:bg-default-50 shadow-sm text-success"
                  : "text-default-500 hover:text-default-700"
              } ${statusLoading === "completed" ? "opacity-50" : ""}`}
              disabled={displayStatus === "completed" || statusLoading !== null}
              onClick={() => handleQuickStatusChange("completed")}
            >
              {statusLoading === "completed" ? "..." : "已完成"}
            </button>
          </div>

          {/* 操作按鈕 - 使用 HeroUI Button */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-dashed border-default-200">
            <Button size="sm" variant="flat" onPress={() => onEdit(order)}>
              編輯訂單
            </Button>
            {onViewContent && (order.menu_items || order.menu_image_url) && (
              <Button
                size="sm"
                variant="flat"
                onPress={() => onViewContent(order)}
              >
                查看內容
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
