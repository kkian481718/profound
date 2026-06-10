"use client";

import { useMemo } from "react";
import { Card, CardBody } from "@heroui/card";

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

    const sortedData = [...data].sort((left, right) => right.total_amount - left.total_amount);
    const totalAmount = sortedData.reduce((sum, item) => sum + item.total_amount, 0) || 1;

    return sortedData.map((item) => {
      const storeTotal = item.total_amount || 0;

      return {
        ...item,
        shippingPercentage: storeTotal > 0 ? (item.total_shipping_fee / storeTotal) * 100 : 0,
        devFeePercentage: storeTotal > 0 ? (item.total_dev_fee / storeTotal) * 100 : 0,
        totalSharePercentage: (storeTotal / totalAmount) * 100,
      };
    });
  }, [data]);

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  const formatPercent = (amount: number) => {
    return `${amount.toFixed(0)}%`;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-default-500">無數據可顯示</p>
      </div>
    );
  }

  const totalShippingFee = data.reduce((sum, item) => sum + item.total_shipping_fee, 0);
  const totalDevFee = data.reduce((sum, item) => sum + item.total_dev_fee, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.order_count, 0);
  const topStore = chartData[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
        <div className="flex items-center gap-2 rounded-full bg-[#0ea5e9]/10 px-3 py-1">
          <div className="h-3 w-3 rounded-full bg-[#0ea5e9] shadow-sm" />
          <span className="text-[#0284c7]">運費</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#8b5cf6]/10 px-3 py-1">
          <div className="h-3 w-3 rounded-full bg-[#8b5cf6] shadow-sm" />
          <span className="text-[#6d28d9]">開發費</span>
        </div>
        <span className="text-default-500">依總金額由高到低排序</span>
      </div>

      <div className="grid gap-3">
        {chartData.map((item, index) => {
          const averagePerOrder = item.order_count > 0 ? item.total_amount / item.order_count : 0;

          return (
            <Card key={item.store_id} className="border border-default-200/80 shadow-none">
              <CardBody className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-default-100 text-xs font-bold text-default-600">
                          {index + 1}
                        </span>
                        <h5 className="truncate text-base font-semibold text-default-900">
                          {item.store_name}
                        </h5>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-default-500">
                        <span>{item.order_count} 筆訂單</span>
                        <span>•</span>
                        <span>平均每單 {formatCurrency(averagePerOrder)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-medium text-default-500">總金額</p>
                      <p className="text-2xl font-bold text-default-900">
                        {formatCurrency(item.total_amount)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-default-500">
                      <span>店內費用結構</span>
                      <span>
                        運費 {formatPercent(item.shippingPercentage)} / 開發費{" "}
                        {formatPercent(item.devFeePercentage)}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-default-100">
                      <div className="flex h-full w-full">
                        <div
                          className="h-full bg-[#0ea5e9] transition-all duration-300"
                          style={{ width: `${item.shippingPercentage}%` }}
                        />
                        <div
                          className="h-full bg-[#8b5cf6] transition-all duration-300"
                          style={{ width: `${item.devFeePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-lg bg-[#0ea5e9]/10 p-2">
                      <p className="font-medium text-[#0284c7]">運費</p>
                      <p className="mt-1 text-sm font-semibold text-default-900">
                        {formatCurrency(item.total_shipping_fee)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#8b5cf6]/10 p-2">
                      <p className="font-medium text-[#6d28d9]">開發費</p>
                      <p className="mt-1 text-sm font-semibold text-default-900">
                        {formatCurrency(item.total_dev_fee)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-default-50 p-2">
                      <p className="font-medium text-default-600">總占比</p>
                      <p className="mt-1 text-sm font-semibold text-default-900">
                        {formatPercent(item.totalSharePercentage)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg bg-default-50 p-4">
        <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          <div>
            <span className="text-default-600">總店數</span>
            <p className="font-medium text-lg">{data.length}</p>
          </div>
          <div>
            <span className="text-default-600">總訂單數</span>
            <p className="font-medium text-lg">{totalOrders}</p>
          </div>
          <div>
            <span className="text-default-600">平均每單運費</span>
            <p className="font-medium text-lg">
              {formatCurrency(totalOrders > 0 ? totalShippingFee / totalOrders : 0)}
            </p>
          </div>
          <div>
            <span className="text-default-600">總開發費</span>
            <p className="font-medium text-lg">{formatCurrency(totalDevFee)}</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-default-500">
          最高總額店家：{topStore?.store_name || "無"}
        </div>
      </div>
    </div>
  );
}
