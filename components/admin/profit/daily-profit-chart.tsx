"use client";

import { useMemo, useState } from "react";

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
  timeRange?: "week" | "month";
}

export default function DailyProfitChart({ data, timeRange = "week" }: DailyProfitChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item) => ({
      ...item,
      total_profit: item.total_shipping_fee + item.total_dev_fee,
    }));
  }, [data]);

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-default-500">無數據可顯示</p>
      </div>
    );
  }

  // 繪製用常數
  const svgWidth = 800;
  const svgHeight = 280;
  const paddingTop = 20;
  const paddingBottom = 30; // 調整底部留白
  const paddingX = 50; // 左右留白增加，避免Y軸字體被切掉
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // 取最大值以決定 Y 軸比例
  const maxValue = Math.max(
    100,
    ...chartData.map((d) => Math.max(d.total_shipping_fee, d.total_dev_fee)),
  );

  // 找出適合閱讀的座標間距 (100, 500, 1000, 2000...)
  const intervalAmount = (() => {
    if (maxValue <= 200) return 50;
    if (maxValue <= 500) return 100;
    if (maxValue <= 1000) return 200;
    if (maxValue <= 2000) return 500;
    if (maxValue <= 5000) return 1000;
    if (maxValue <= 10000) return 2000;
    return Math.ceil(maxValue / 5000) * 1000;
  })();

  const maxTick = Math.ceil(maxValue / intervalAmount) * intervalAmount;
  const yAxisTicks = [];
  for (let i = 0; i <= maxTick; i += intervalAmount) {
    yAxisTicks.push(i);
  }

  const getX = (index: number) => {
    if (chartData.length <= 1) return paddingX + chartWidth / 2;
    return paddingX + (index / (chartData.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    return svgHeight - paddingBottom - (value / maxTick) * chartHeight;
  };

  // 生成運費 (Shipping) 的折線 Path
  const shippingPoints = chartData
    .map((d, i) => `${getX(i)},${getY(d.total_shipping_fee)}`)
    .join(" ");

  // 生成開發費 (Dev Fee) 的折線 Path
  const devFeePoints = chartData.map((d, i) => `${getX(i)},${getY(d.total_dev_fee)}`).join(" ");

  return (
    <div className="space-y-4">
      {/* 互動數據看板，手機友善設計 */}
      <div className="h-16 flex items-center justify-center bg-default-50 border border-default-100 rounded-xl px-4 transition-all">
        {activeIndex !== null && chartData[activeIndex] ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-default-800 text-sm">
                {chartData[activeIndex].day_name}
              </span>
              <span className="text-xs text-default-500 font-medium">
                {chartData[activeIndex].date} • {chartData[activeIndex].order_count} 筆
              </span>
            </div>
            <div className="flex gap-4 sm:gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] tracking-widest text-[#0ea5e9] font-bold">運費</span>
                <span className="font-bold text-[#0284c7] text-sm">
                  {formatCurrency(chartData[activeIndex].total_shipping_fee)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] tracking-widest text-[#8b5cf6] font-bold">開發費</span>
                <span className="font-bold text-[#6d28d9] text-sm">
                  {formatCurrency(chartData[activeIndex].total_dev_fee)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-default-400 font-medium tracking-wide">
            點擊圖表節點查看詳細金額
          </div>
        )}
      </div>

      {/* 圖例 */}
      <div className="flex flex-wrap gap-5 text-xs font-medium justify-end px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#0ea5e9] rounded-full shadow-sm" />
          <span className="text-[#0284c7]">運費</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#8b5cf6] rounded-full shadow-sm" />
          <span className="text-[#6d28d9]">開發費</span>
        </div>
      </div>

      {/* 繪製 SVG 單純折線圖 */}
      <div className="relative w-full overflow-x-auto overflow-y-hidden pb-2 -mt-2">
        <div className="min-w-[500px]">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto font-sans"
            preserveAspectRatio="none"
          >
            {/* 格線與 Y 軸數值 (以固定間距渲染) */}
            {yAxisTicks.map((tick, i) => {
              const y = getY(tick);
              return (
                <g key={`tick-${i}`}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-default-200"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="currentColor"
                    className="text-default-400 font-medium"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* 開發費折線 */}
            <path
              d={`M ${devFeePoints}`}
              fill="none"
              stroke="#8b5cf6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-out"
              strokeWidth="2.5"
            />

            {/* 運費折線 */}
            <path
              d={`M ${shippingPoints}`}
              fill="none"
              stroke="#0ea5e9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-out"
              strokeWidth="2.5"
            />

            {/* X 軸標籤與點擊互動區塊 */}
            {chartData.map((item, index) => {
              const x = getX(index);
              const isActive = activeIndex === index;
              // 計算感應寬度
              const areaWidth =
                chartData.length > 1 ? chartWidth / (chartData.length - 1) : chartWidth;

              return (
                <g key={item.date} className="group">
                  {/* X 軸標籤 */}
                  <text
                    x={x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fill="currentColor"
                    className={`transition-colors duration-300 ${isActive ? "text-default-900 font-bold" : "text-default-500"}`}
                  >
                    {item.day_name}
                  </text>

                  {/* 如果點擊或 Hover 動態顯示垂直線 */}
                  {isActive && (
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={svgHeight - paddingBottom}
                      stroke="currentColor"
                      className="text-default-300"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* 節點圓點 (運費) */}
                  <circle
                    cx={x}
                    cy={getY(item.total_shipping_fee)}
                    r={isActive ? "5" : "3"}
                    fill="#fff"
                    stroke="#0ea5e9"
                    strokeWidth="2"
                    className={`transition-all duration-300 ${isActive ? "shadow-sm" : ""}`}
                  />
                  {/* 節點圓點 (開發費) */}
                  <circle
                    cx={x}
                    cy={getY(item.total_dev_fee)}
                    r={isActive ? "5" : "3"}
                    fill="#fff"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    className={`transition-all duration-300 ${isActive ? "shadow-sm" : ""}`}
                  />

                  {/* 感應區塊 (無形)，適合觸控 */}
                  <rect
                    x={x - areaWidth / 2}
                    y={0}
                    width={areaWidth}
                    height={svgHeight}
                    fill="transparent"
                    onClick={() => setActiveIndex(isActive ? null : index)}
                    className="cursor-pointer"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 統計摘要 */}
      <div className="mt-6 p-4 bg-default-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-default-600">
              {timeRange === "week" ? "週總利潤" : "月總利潤"}
            </span>
            <p className="font-medium text-lg">
              {formatCurrency(
                data.reduce((sum, item) => sum + item.total_shipping_fee + item.total_dev_fee, 0),
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
