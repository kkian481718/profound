"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Snippet } from "@heroui/snippet";

import { LocationIcon, PhoneIcon, UserIcon } from "@/components/icons";
import { Order } from "@/types";

interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onViewContent?: (order: Order) => void;
}

export default function OrderCard({
  order,
  onEdit,
  onViewContent,
}: OrderCardProps) {
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
    status: string,
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
    <Card className="hover:shadow-lg transition-shadow">
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
      <CardBody className="pt-2 flex flex-col gap-2">
        <div className="space-y-1">
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
                摘要:
              </span>
              <span className="text-xs text-default-500 line-clamp-2">
                {order.menu_items.length > 50
                  ? `${order.menu_items.substring(0, 50)}...`
                  : order.menu_items}
              </span>
            </div>
          )}
        </div>

        <div className="border-t pt-1.5 mt-1">
          <div className="flex justify-between items-center font-bold">
            <span className="text-xs md:text-sm">總金額</span>
            <span className="text-sm md:text-base">${order.total_amount}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-1.5">
          <Button
            className="flex-1"
            color="primary"
            size="sm"
            variant="flat"
            onPress={() => onEdit(order)}
          >
            編輯
          </Button>
          {onViewContent && (order.menu_items || order.menu_image_url) && (
            <Button
              className="flex-1"
              color="default"
              size="sm"
              variant="flat"
              onPress={() => onViewContent(order)}
            >
              查看內容
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
