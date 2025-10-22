"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button, ButtonGroup } from "@heroui/button";
import { Divider } from "@heroui/divider";

import { createClient } from "@/lib/supabase/client";
import ProfitChart from "@/components/admin/profit/profit-chart";
import DailyProfitChart from "@/components/admin/profit/daily-profit-chart";

interface ProfitData {
  store_id: string;
  store_name: string;
  total_shipping_fee: number;
  total_dev_fee: number;
  total_amount: number;
  order_count: number;
}

interface DailyProfitData {
  date: string;
  day_name: string;
  total_shipping_fee: number;
  total_dev_fee: number;
  total_amount: number;
  order_count: number;
}

interface ProfitSummary {
  total_shipping_fee: number;
  total_dev_fee: number;
  total_amount: number;
  total_orders: number;
  profit_data: ProfitData[];
  daily_profit_data?: DailyProfitData[];
}

export default function ProfitPage() {
  const [profitData, setProfitData] = useState<ProfitSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"today" | "week">("today");

  useEffect(() => {
    fetchProfitData();
  }, [timeRange]);

  const fetchProfitData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // 計算日期範圍
      const now = new Date();
      let startDate: Date;

      if (timeRange === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else {
        // 本週（週一到現在）
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        startDate = new Date(now);
        startDate.setDate(now.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);
      }

      const endDate = new Date(now);

      endDate.setHours(23, 59, 59, 999);

      // 查詢利潤資料
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(
          `
          store_id,
          shipping_fee,
          dev_fee,
          total_amount,
          order_time,
          stores (
            name
          )
        `,
        )
        .gte("order_time", startDate.toISOString())
        .lte("order_time", endDate.toISOString())
        .eq("payment_status", "paid");

      if (error) throw error;

      // 處理訂單數據
      const processedData = (ordersData || []).map((order: any) => ({
        ...order,
        store_name: order.stores?.name || "未知店家",
      }));

      // 按店家分組統計
      const groupedData: Record<string, ProfitData> = {};

      processedData.forEach((order: any) => {
        const storeId = order.store_id;

        if (!groupedData[storeId]) {
          groupedData[storeId] = {
            store_id: storeId,
            store_name: order.store_name,
            total_shipping_fee: 0,
            total_dev_fee: 0,
            total_amount: 0,
            order_count: 0,
          };
        }

        groupedData[storeId].total_shipping_fee += order.shipping_fee;
        groupedData[storeId].total_dev_fee += order.dev_fee;
        groupedData[storeId].total_amount += order.total_amount;
        groupedData[storeId].order_count += 1;
      });

      // 計算總計
      const profitDataArray = Object.values(groupedData);

      // 如果是週模式，計算每日利潤數據
      let dailyProfitData: DailyProfitData[] = [];

      if (timeRange === "week") {
        const dailyGroupedData: Record<string, DailyProfitData> = {};

        // 初始化週一到週五的數據
        const dayNames = ["週一", "週二", "週三", "週四", "週五"];

        for (let i = 0; i < 5; i++) {
          const date = new Date(startDate);

          date.setDate(startDate.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];

          dailyGroupedData[dateStr] = {
            date: dateStr,
            day_name: dayNames[i],
            total_shipping_fee: 0,
            total_dev_fee: 0,
            total_amount: 0,
            order_count: 0,
          };
        }

        // 統計每日數據
        processedData.forEach((order: any) => {
          if (order.order_time) {
            const orderDate = new Date(order.order_time)
              .toISOString()
              .split("T")[0];

            if (dailyGroupedData[orderDate]) {
              dailyGroupedData[orderDate].total_shipping_fee +=
                order.shipping_fee;
              dailyGroupedData[orderDate].total_dev_fee += order.dev_fee;
              dailyGroupedData[orderDate].total_amount += order.total_amount;
              dailyGroupedData[orderDate].order_count += 1;
            }
          }
        });

        dailyProfitData = Object.values(dailyGroupedData);
      }

      const summary: ProfitSummary = {
        total_shipping_fee: profitDataArray.reduce(
          (sum, item) => sum + item.total_shipping_fee,
          0,
        ),
        total_dev_fee: profitDataArray.reduce(
          (sum, item) => sum + item.total_dev_fee,
          0,
        ),
        total_amount: profitDataArray.reduce(
          (sum, item) => sum + item.total_amount,
          0,
        ),
        total_orders: profitDataArray.reduce(
          (sum, item) => sum + item.order_count,
          0,
        ),
        profit_data: profitDataArray.sort(
          (a, b) => b.total_amount - a.total_amount,
        ),
        daily_profit_data: dailyProfitData,
      };

      setProfitData(summary);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch profit data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-0l">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">利潤查詢</h1>
        <ButtonGroup>
          <Button
            color={timeRange === "today" ? "primary" : "default"}
            variant={timeRange === "today" ? "solid" : "flat"}
            onPress={() => setTimeRange("today")}
          >
            今日
          </Button>
          <Button
            color={timeRange === "week" ? "primary" : "default"}
            variant={timeRange === "week" ? "solid" : "flat"}
            onPress={() => setTimeRange("week")}
          >
            本週
          </Button>
        </ButtonGroup>
      </div>

      {profitData && (
        <>
          {/* 總覽卡片 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
            <Card>
              <CardHeader className="pb-2">
                <h4 className="text-sm font-medium text-default-600">
                  總訂單數
                </h4>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-2xl font-bold text-primary">
                  {profitData.total_orders}
                </p>
              </CardBody>
            </Card>

            <div className="flex gap-2">
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <h4 className="text-sm font-medium text-default-600">
                    總運費
                  </h4>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(profitData.total_shipping_fee)}
                  </p>
                </CardBody>
              </Card>

              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <h4 className="text-sm font-medium text-default-600">
                    總開發費
                  </h4>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-2xl font-bold text-warning">
                    {formatCurrency(profitData.total_dev_fee)}
                  </p>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <h4 className="text-sm font-medium text-default-600">總金額</h4>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-2xl font-bold">
                  {formatCurrency(profitData.total_amount)}
                </p>
              </CardBody>
            </Card>
          </div>

          {/* 每日利潤圖表 (僅週模式顯示) */}
          {timeRange === "week" && profitData.daily_profit_data && (
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold">每日利潤分析</h4>
              </CardHeader>
              <Divider />
              <CardBody>
                {profitData.daily_profit_data.some(
                  (day) => day.order_count > 0,
                ) ? (
                  <DailyProfitChart data={profitData.daily_profit_data} />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-default-500">本週暫無利潤資料</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* 圖表區域 */}
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold">各店家利潤分析</h4>
            </CardHeader>
            <Divider />
            <CardBody>
              {profitData.profit_data.length > 0 ? (
                <ProfitChart data={profitData.profit_data} />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-default-500">
                    {timeRange === "today" ? "今日" : "本週"}暫無利潤資料
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* 詳細數據表格 */}
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold">詳細數據</h4>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-divider">
                      <th className="text-left py-2 px-2">店家名稱</th>
                      <th className="text-right py-2 px-2">訂單數</th>
                      <th className="text-right py-2 px-2">運費</th>
                      <th className="text-right py-2 px-2">開發費</th>
                      <th className="text-right py-2 px-2">總金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitData.profit_data.map((item) => (
                      <tr
                        key={item.store_id}
                        className="border-b border-divider last:border-b-0"
                      >
                        <td className="py-2 px-2 font-medium">
                          {item.store_name}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {item.order_count}
                        </td>
                        <td className="py-2 px-2 text-right text-success">
                          {formatCurrency(item.total_shipping_fee)}
                        </td>
                        <td className="py-2 px-2 text-right text-warning">
                          {formatCurrency(item.total_dev_fee)}
                        </td>
                        <td className="py-2 px-2 text-right font-bold">
                          {formatCurrency(item.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
