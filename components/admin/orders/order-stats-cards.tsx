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
    <div className="grid grid-cols-2 gap-2">
      {/* 待處理訂單統計 */}
      <Card>
        <CardBody className="p-3">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-warning">
              今日待處理訂單
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-default-500">訂單數量</span>
                <span className="text-xl font-bold text-foreground">
                  {stats.pending.count}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-default-500">總金額</span>
                <span className="text-xl font-bold text-foreground">
                  ${stats.pending.totalAmount}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-default-500">成本</span>
                  <span className="text-base font-semibold text-default-500">
                    ${stats.pending.totalCost}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-default-500">運費</span>
                  <span className="text-base font-semibold text-default-500">
                    ${stats.pending.totalShipping}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-default-500">開發費</span>
                  <span className="text-base font-semibold text-default-500">
                    ${stats.pending.totalDevFee}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 準備中訂單統計 */}
      <Card>
        <CardBody className="p-3">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-primary">
              今日準備中訂單
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-default-500">訂單數量</span>
                <span className="text-xl font-bold text-foreground">
                  {stats.preparing.count}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-default-500">總金額</span>
                <span className="text-xl font-bold text-foreground">
                  ${stats.preparing.totalAmount}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-default-500">成本</span>
                  <span className="text-base font-semibold text-default-500">
                    ${stats.preparing.totalCost}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-default-500">運費</span>
                  <span className="text-base font-semibold text-default-500">
                    ${stats.preparing.totalShipping}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-default-500">開發費</span>
                  <span className="text-base font-semibold text-default-500">
                    ${stats.preparing.totalDevFee}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
