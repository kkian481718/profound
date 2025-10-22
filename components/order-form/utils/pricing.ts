/**
 * 價格計算相關的工具函數
 */

export interface PricingBreakdown {
  /** 餐點金額 */
  cost: number;
  /** 開發費 */
  devFee: number;
  /** 運費 */
  shippingFee: number;
  /** 總金額 */
  totalAmount: number;
}

/**
 * 計算訂單的完整價格明細
 * @param cost 餐點原始金額
 * @returns 包含各項費用的價格明細
 */
export function calculateOrderPricing(cost: number): PricingBreakdown {
  const costNum = Math.max(0, cost); // 確保金額不為負數
  const devFee = 10; // 固定開發費 10 元

  // 運費計算邏輯
  let shippingFee: number;

  if (costNum < 150) {
    shippingFee = 20; // 商品金額 < 150：運費 20 元
  } else {
    shippingFee = Math.round(costNum * 0.12); // 商品金額 >= 150：運費 12%
  }

  const totalAmount = costNum + devFee + shippingFee;

  return {
    cost: costNum,
    devFee,
    shippingFee,
    totalAmount,
  };
}

/**
 * 計算服務費（開發費 + 運費）
 * @param cost 餐點原始金額
 * @returns 服務費總額
 */
export function calculateServiceFee(cost: number): number {
  const pricing = calculateOrderPricing(cost);

  return pricing.devFee + pricing.shippingFee;
}
