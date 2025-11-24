import { Card, CardBody } from "@heroui/card";
import { Order } from "@/types";

interface OrderStatsCardsProps {
  orders: Order[];
}

export default function OrderStatsCards({ orders }: OrderStatsCardsProps) {
  // 計算今日訂單的統計數據（分別計算 pending 和 preparing）
  const todayOrderStats = () => {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    const calculateStats = (status: "pending" | "preparing") => {
      const filteredOrders = orders.filter((order) => {
        const orderDate = new Date(order.order_time);
        return (
          orderDate >= todayStart &&
          orderDate <= todayEnd &&
          order.order_status === status
        );
      });

      return {
        count: filteredOrders.length,
        totalAmount: filteredOrders.reduce(
          (sum, order) => sum + (order.total_amount || 0),
          0
        ),
        totalCost: filteredOrders.reduce(
          (sum, order) => sum + (order.cost || 0),
          0
        ),
        totalShipping: filteredOrders.reduce(
          (sum, order) => sum + (order.shipping_fee || 0),
          0
        ),
        totalDevFee: filteredOrders.reduce(
          (sum, order) => sum + (order.dev_fee || 0),
          0
        ),
      };
    };

    return {
      pending: calculateStats("pending"),
      preparing: calculateStats("preparing"),
    };
  };

  const stats = todayOrderStats();

  return (
    <div className="flex flex-col gap-2">
      {/* 待處理訂單統計 */}
      <Card className="border-l-4 border-l-warning">
        <CardBody className="p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-warning">
                ⏳ 今日待處理訂單
              </h2>
              <div className="px-2 py-0.5 bg-warning-50 rounded-full">
                <span className="text-xs font-bold text-warning">
                  {stats.pending.count} 筆
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-warning-50 to-warning-100/50 rounded-lg p-2">
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-warning-600 font-medium">
                  總金額
                </span>
                <span className="text-xl font-bold text-warning-700 ml-auto">
                  ${stats.pending.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div className="flex flex-col gap-0.5 p-1.5 bg-default-50 rounded-lg">
                <span className="text-xs text-default-500 font-medium">
                  成本
                </span>
                <span className="text-sm font-bold text-default-700">
                  ${stats.pending.totalCost.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-1.5 bg-default-50 rounded-lg">
                <span className="text-xs text-default-500 font-medium">
                  運費
                </span>
                <span className="text-sm font-bold text-default-700">
                  ${stats.pending.totalShipping.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-1.5 bg-default-50 rounded-lg">
                <span className="text-xs text-default-500 font-medium">
                  開發費
                </span>
                <span className="text-sm font-bold text-default-700">
                  ${stats.pending.totalDevFee.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 準備中訂單統計 */}
      <Card className="border-l-4 border-l-primary">
        <CardBody className="p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-primary">
                🔄 今日準備中訂單
              </h2>
              <div className="px-2 py-0.5 bg-primary-50 rounded-full">
                <span className="text-xs font-bold text-primary">
                  {stats.preparing.count} 筆
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg p-2">
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-primary-600 font-medium">
                  總金額
                </span>
                <span className="text-xl font-bold text-primary-700 ml-auto">
                  ${stats.preparing.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div className="flex flex-col gap-0.5 p-1.5 bg-default-50 rounded-lg">
                <span className="text-xs text-default-500 font-medium">
                  成本
                </span>
                <span className="text-sm font-bold text-default-700">
                  ${stats.preparing.totalCost.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-1.5 bg-default-50 rounded-lg">
                <span className="text-xs text-default-500 font-medium">
                  運費
                </span>
                <span className="text-sm font-bold text-default-700">
                  ${stats.preparing.totalShipping.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-1.5 bg-default-50 rounded-lg">
                <span className="text-xs text-default-500 font-medium">
                  開發費
                </span>
                <span className="text-sm font-bold text-default-700">
                  ${stats.preparing.totalDevFee.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
