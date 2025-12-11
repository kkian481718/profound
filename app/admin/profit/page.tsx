"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button, ButtonGroup } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";

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
  const [timeRange, setTimeRange] = useState<"single" | "week" | "month">("single");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();

    return today.toISOString().split("T")[0];
  });
  const [selectedWeekDate, setSelectedWeekDate] = useState(() => {
    const today = new Date();

    return today.toISOString().split("T")[0];
  });
  const [selectedMonthDate, setSelectedMonthDate] = useState(() => {
    const today = new Date();

    return today.toISOString().split("T")[0];
  });

  useEffect(() => {
    fetchProfitData();
  }, [timeRange, selectedDate, selectedWeekDate, selectedMonthDate]);

  const fetchProfitData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // 計算日期範圍
      let startDate: Date;
      let referenceDate: Date;

      if (timeRange === "single") {
        // 使用選擇的日期
        const selectedDateObj = new Date(selectedDate);

        startDate = new Date(
          selectedDateObj.getFullYear(),
          selectedDateObj.getMonth(),
          selectedDateObj.getDate(),
        );
        referenceDate = startDate;
      } else if (timeRange === "week") {
        // 使用選擇的週日期（週一到週日）
        const selectedDateObj = new Date(selectedWeekDate);
        const dayOfWeek = selectedDateObj.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        startDate = new Date(selectedDateObj);
        startDate.setDate(selectedDateObj.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        referenceDate = selectedDateObj;
      } else {
        // 使用選擇的月份日期（月初到月底）
        const selectedDateObj = new Date(selectedMonthDate);

        startDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        referenceDate = selectedDateObj;
      }

      let endDate: Date;

      if (timeRange === "single") {
        // 單日模式：設定為選擇日期的結束時間
        const selectedDateObj = new Date(selectedDate);

        endDate = new Date(
          selectedDateObj.getFullYear(),
          selectedDateObj.getMonth(),
          selectedDateObj.getDate(),
        );
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = new Date(referenceDate);

        if (timeRange === "week") {
          // 週模式：設定為週日結束時間
          const dayOfWeek = referenceDate.getDay();
          const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

          endDate.setDate(referenceDate.getDate() + daysToSunday);
        } else if (timeRange === "month") {
          // 月模式：設定為月底結束時間
          endDate.setMonth(referenceDate.getMonth() + 1, 0); // 下個月的第0天，即本月最後一天
        }

        endDate.setHours(23, 59, 59, 999);
      }

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
        .eq("order_status", "completed");

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

      // 如果是週模式或月模式，計算每日利潤數據
      let dailyProfitData: DailyProfitData[] = [];

      if (timeRange === "week") {
        const dailyGroupedData: Record<string, DailyProfitData> = {};

        // 初始化週一到週日的數據
        const dayNames = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);

          date.setDate(startDate.getDate() + i);
          // 使用本地時間格式化日期
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

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
            // 使用本地時間而非 UTC 時間來避免時區問題
            const orderDate = new Date(order.order_time);
            const localDateStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(orderDate.getDate()).padStart(2, "0")}`;

            if (dailyGroupedData[localDateStr]) {
              dailyGroupedData[localDateStr].total_shipping_fee += order.shipping_fee;
              dailyGroupedData[localDateStr].total_dev_fee += order.dev_fee;
              dailyGroupedData[localDateStr].total_amount += order.total_amount;
              dailyGroupedData[localDateStr].order_count += 1;
            }
          }
        });

        dailyProfitData = Object.values(dailyGroupedData);
      } else if (timeRange === "month") {
        const dailyGroupedData: Record<string, DailyProfitData> = {};

        // 初始化本月每一天的數據
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          // 使用本地時間格式化日期
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          const dayName = `${month + 1}/${day}`;

          dailyGroupedData[dateStr] = {
            date: dateStr,
            day_name: dayName,
            total_shipping_fee: 0,
            total_dev_fee: 0,
            total_amount: 0,
            order_count: 0,
          };
        }

        // 統計每日數據
        processedData.forEach((order: any) => {
          if (order.order_time) {
            // 使用本地時間而非 UTC 時間來避免時區問題
            const orderDate = new Date(order.order_time);
            const localDateStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(orderDate.getDate()).padStart(2, "0")}`;

            if (dailyGroupedData[localDateStr]) {
              dailyGroupedData[localDateStr].total_shipping_fee += order.shipping_fee;
              dailyGroupedData[localDateStr].total_dev_fee += order.dev_fee;
              dailyGroupedData[localDateStr].total_amount += order.total_amount;
              dailyGroupedData[localDateStr].order_count += 1;
            }
          }
        });

        dailyProfitData = Object.values(dailyGroupedData);
      }

      const summary: ProfitSummary = {
        total_shipping_fee: profitDataArray.reduce((sum, item) => sum + item.total_shipping_fee, 0),
        total_dev_fee: profitDataArray.reduce((sum, item) => sum + item.total_dev_fee, 0),
        total_amount: profitDataArray.reduce((sum, item) => sum + item.total_amount, 0),
        total_orders: profitDataArray.reduce((sum, item) => sum + item.order_count, 0),
        profit_data: profitDataArray.sort((a, b) => b.total_amount - a.total_amount),
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

  const getDateRangeDisplay = () => {
    if (timeRange === "single") {
      return null;
    } else if (timeRange === "week") {
      const selectedDateObj = new Date(selectedWeekDate);
      const dayOfWeek = selectedDateObj.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const monday = new Date(selectedDateObj);

      monday.setDate(selectedDateObj.getDate() - daysToMonday);

      const sunday = new Date(monday);

      sunday.setDate(monday.getDate() + 6);

      const formatDate = (date: Date) => {
        return `${date.getMonth() + 1}/${date.getDate()}`;
      };

      return `${formatDate(monday)}~${formatDate(sunday)}`;
    } else {
      const selectedDateObj = new Date(selectedMonthDate);

      return `${selectedDateObj.getFullYear()} ${selectedDateObj.getMonth() + 1}月`;
    }
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
        <div>
          <h1 className="text-3xl font-bold">利潤分析</h1>
          {getDateRangeDisplay() && (
            <p className="text-sm text-default-500 mt-1">{getDateRangeDisplay()}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ButtonGroup size="sm">
            <Button
              color={timeRange === "single" ? "primary" : "default"}
              variant={timeRange === "single" ? "solid" : "flat"}
              onPress={() => setTimeRange("single")}
            >
              單日
            </Button>
            <Button
              color={timeRange === "week" ? "primary" : "default"}
              variant={timeRange === "week" ? "solid" : "flat"}
              onPress={() => setTimeRange("week")}
            >
              本週
            </Button>
            <Button
              color={timeRange === "month" ? "primary" : "default"}
              variant={timeRange === "month" ? "solid" : "flat"}
              onPress={() => setTimeRange("month")}
            >
              本月
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {timeRange === "single" && (
        <Input
          className=""
          label="選擇日期"
          size="sm"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      )}

      {timeRange === "week" && (
        <Input
          className=""
          label="選擇週內任一日期"
          size="sm"
          type="date"
          value={selectedWeekDate}
          onChange={(e) => setSelectedWeekDate(e.target.value)}
        />
      )}

      {timeRange === "month" && (
        <Input
          className=""
          label="選擇月份"
          size="sm"
          type="month"
          value={selectedMonthDate.substring(0, 7)}
          onChange={(e) => setSelectedMonthDate(e.target.value + "-01")}
        />
      )}

      {profitData && (
        <>
          {/* 總覽卡片 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
            <Card>
              <CardHeader className="pb-2">
                <h4 className="text-sm font-medium text-default-600">總訂單數</h4>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-2xl font-bold text-primary">{profitData.total_orders}</p>
              </CardBody>
            </Card>

            <div className="flex gap-2">
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <h4 className="text-sm font-medium text-default-600">總運費</h4>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(profitData.total_shipping_fee)}
                  </p>
                </CardBody>
              </Card>

              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <h4 className="text-sm font-medium text-default-600">總開發費</h4>
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
                <p className="text-2xl font-bold">{formatCurrency(profitData.total_amount)}</p>
              </CardBody>
            </Card>
          </div>

          {/* 每日利潤圖表 (週/月) */}
          {(timeRange === "week" || timeRange === "month") && profitData.daily_profit_data && (
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold">每日利潤分析</h4>
              </CardHeader>
              <Divider />
              <CardBody>
                {profitData.daily_profit_data.some((day) => day.order_count > 0) ? (
                  <DailyProfitChart
                    data={profitData.daily_profit_data}
                    timeRange={timeRange as "week" | "month"}
                  />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-default-500">
                      {timeRange === "week" ? "本週" : "本月"}暫無利潤資料
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* 店家利潤圖表 */}
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold">店家利潤分析</h4>
            </CardHeader>
            <Divider />
            <CardBody>
              {profitData.profit_data.length > 0 ? (
                <ProfitChart data={profitData.profit_data} />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-default-500">
                    {timeRange === "single" ? "該日" : timeRange === "week" ? "本週" : "本月"}
                    暫無利潤資料
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* 店家詳細數據表格 */}
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold">店家詳細數據</h4>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-divider">
                      <th className="text-left py-2 px-2">店家</th>
                      <th className="text-right py-2 px-2">單</th>
                      <th className="text-right py-2 px-2">總金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitData.profit_data.map((item) => (
                      <tr key={item.store_id} className="border-b border-divider last:border-b-0">
                        <td className="py-2 px-2 font-medium">{item.store_name}</td>
                        <td className="py-2 px-2 text-right">{item.order_count}</td>
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
