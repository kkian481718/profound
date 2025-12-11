"use client";

import { useMemo } from "react";

interface ProfitData {
  store_id: string;
  store_name: string;
  total_shipping_fee: number;
  total_dev_fee: number;
  total_amount: number;
  order_count: number;
}

interface ProfitChartProps {
  data: ProfitData[];
}

export default function ProfitChart({ data }: ProfitChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 找出最大值用於計算比例
    const maxAmount = Math.max(...data.map((item) => item.total_amount));

    return data.map((item) => ({
      ...item,
      shippingPercentage: (item.total_shipping_fee / maxAmount) * 100,
      devFeePercentage: (item.total_dev_fee / maxAmount) * 100,
      totalPercentage: (item.total_amount / maxAmount) * 100,
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
      {/* 圖例 */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-success rounded" />
          <span>運費</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-warning rounded" />
          <span>開發費</span>
        </div>
      </div>

      {/* 長條圖 */}
      <div className="space-y-4">
        {chartData.map((item) => (
          <div key={item.store_id} className="space-y-2">
            <div className="flex justify-begin items-center">
              <h5 className="font-medium text-sm truncate flex-1 mr-1">{item.store_name}</h5>
            </div>

            <div className="relative">
              {/* 背景條 */}
              <div className="w-full h-8 bg-default-100 rounded-lg overflow-hidden">
                {/* 堆疊長條圖 */}
                <div className="h-full flex">
                  {/* 運費部分 */}
                  <div
                    className="bg-success h-full flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
                    style={{
                      width: `${item.shippingPercentage}%`,
                      minWidth: item.total_shipping_fee > 0 ? "20px" : "0",
                    }}
                  >
                    {item.shippingPercentage > 15 && <span>NT$ {item.total_shipping_fee}</span>}
                  </div>
                  {/* 開發費部分 */}
                  <div
                    className="bg-warning h-full flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
                    style={{
                      width: `${item.devFeePercentage}%`,
                      minWidth: item.total_dev_fee > 0 ? "20px" : "0",
                    }}
                  >
                    {item.devFeePercentage > 15 && <span>NT$ {item.total_dev_fee}</span>}
                  </div>
                </div>
              </div>

              {/* 詳細數據提示 */}
              <div className="mt-1 flex justify-end text-xs text-default-600">
                <span>運費: {formatCurrency(item.total_shipping_fee)}</span>
                <span>&nbsp;•&nbsp;</span>
                <span>開發費: {formatCurrency(item.total_dev_fee)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 統計摘要 */}
      <div className="mt-6 p-4 bg-default-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-default-600">平均訂單運費</span>
            <p className="font-medium text-lg">
              {formatCurrency(
                data.reduce((sum, item) => sum + item.total_shipping_fee, 0) /
                  data.reduce((sum, item) => sum + item.order_count, 0) || 0,
              )}
            </p>
          </div>
          <div>
            <span className="text-default-600">運費最高店家</span>
            <p className="font-medium text-lg">
              {data.length > 0
                ? data.reduce((max, item) =>
                    item.total_shipping_fee > max.total_shipping_fee ? item : max,
                  ).store_name
                : "無"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
