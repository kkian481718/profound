"use client";

import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Button } from "@heroui/button";

import { Order } from "@/types";

interface OrderListProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  onViewContent?: (order: Order) => void;
}

export default function OrderList({
  orders,
  onEditOrder,
  onViewContent,
}: OrderListProps) {
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

  if (orders.length === 0) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <p className="text-default-500">無符合條件的訂單</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="overflow-x-auto">
        <Table aria-label="訂單列表">
          <TableHeader>
            <TableColumn>訂單時間</TableColumn>
            <TableColumn>店家</TableColumn>
            <TableColumn>聯絡資訊</TableColumn>
            <TableColumn>訂單摘要</TableColumn>
            <TableColumn>總金額</TableColumn>
            <TableColumn>訂單狀態</TableColumn>
            <TableColumn>操作</TableColumn>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="text-sm">
                    {formatDateTime(order.order_time)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{order.store_name}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium">
                      {order.pickup_name}
                    </div>
                    <div className="text-xs text-default-500">
                      {order.pickup_phone}
                    </div>
                    <div className="text-xs text-default-500">
                      {order.pickup_location}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm max-w-48">
                    {order.menu_items ? (
                      <span className="line-clamp-2">
                        {order.menu_items.length > 60
                          ? `${order.menu_items.substring(0, 60)}...`
                          : order.menu_items}
                      </span>
                    ) : (
                      <span className="text-default-400 italic">無內容</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">${order.total_amount}</div>
                </TableCell>
                <TableCell>
                  <Chip
                    color={getOrderStatusColor(order.order_status)}
                    size="sm"
                    variant="flat"
                  >
                    {getOrderStatusText(order.order_status)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      size="sm"
                      variant="flat"
                      onPress={() => onEditOrder(order)}
                    >
                      編輯狀態
                    </Button>
                    {onViewContent &&
                      (order.menu_items || order.menu_image_url) && (
                        <Button
                          color="default"
                          size="sm"
                          variant="flat"
                          onPress={() => onViewContent(order)}
                        >
                          查看內容
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
