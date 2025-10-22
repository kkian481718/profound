"use client";

import { useMemo } from "react";

interface DailyProfitData {
  date: string;
  day_name: string;
  total_shipping_fee: number;
  total_dev_fee: number;
  total_amount: number;
  order_count: number;
}

interface DailyProfitChartProps {
  data: DailyProfitData[];
}

export default function DailyProfitChart({ data }: DailyProfitChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 計算總利潤（運費+開發費）
    const dataWithProfit = data.map((item) => ({
      ...item,
      total_profit: item.total_shipping_fee + item.total_dev_fee,
    }));

    // 找出最大利潤用於計算比例
    const maxProfit = Math.max(
      ...dataWithProfit.map((item) => item.total_profit),
    );

    return dataWithProfit.map((item) => ({
      ...item,
      profitPercentage:
        maxProfit > 0 ? (item.total_profit / maxProfit) * 100 : 0,
    }));
  }, [data]);

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-default-500">無數據可顯示</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 簡單直方圖 */}
      <div className="space-y-3">
        {chartData.map((item) => (
          <div key={item.date} className="space-y-2">
            <div className="flex justify-between items-center">
              <h5 className="font-medium text-sm w-16">{item.day_name}</h5>
              <div className="text-xs text-default-600">
                {item.order_count} 筆
              </div>
            </div>

            <div className="relative">
              {/* 簡單長條 */}
              <div className="w-full h-6 bg-default-100 rounded overflow-hidden">
                <div
                  className="bg-primary h-full flex items-center justify-end pr-2 text-white text-xs font-medium transition-all duration-500"
                  style={{
                    width: `${item.profitPercentage}%`,
                    minWidth: item.total_profit > 0 ? "30px" : "0",
                  }}
                >
                  {item.profitPercentage > 25 && (
                    <span>{formatCurrency(item.total_profit)}</span>
                  )}
                </div>
              </div>

              {/* 顯示金額 */}
              {item.profitPercentage <= 25 && item.total_profit > 0 && (
                <div className="mt-1 text-xs text-default-600 text-right">
                  {formatCurrency(item.total_profit)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 簡化統計摘要 */}
      <div className="mt-6 p-3 bg-default-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-default-600">週總利潤</span>
            <p className="font-medium text-lg">
              {formatCurrency(
                data.reduce(
                  (sum, item) =>
                    sum + item.total_shipping_fee + item.total_dev_fee,
                  0,
                ),
              )}
            </p>
          </div>
          <div>
            <span className="text-default-600">最佳營收日</span>
            <p className="font-medium text-lg">
              {data.length > 0
                ? data.reduce((max, item) =>
                    item.total_shipping_fee + item.total_dev_fee >
                    max.total_shipping_fee + max.total_dev_fee
                      ? item
                      : max,
                  ).day_name
                : "無"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
