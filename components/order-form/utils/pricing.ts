/**
 * 價格計算相關的工具函數
 */

export interface PricingBreakdown {
  /** 餐點金額 */
  cost: number;
  /** 開發費 */
  devFee: number;
  /** 基本運費 */
  baseShippingFee: number;
  /** 額外運費（遠程店家加收） */
  extraShippingFee: number;
  /** 總運費（基本運費 + 額外運費） */
  shippingFee: number;
  /** 總金額 */
  totalAmount: number;
}

export interface StoreShippingConfig {
  /** 額外運費金額 */
  extraShippingFee?: number | null;
  /** 免額外運費門檻（訂單金額超過此值不加收額外運費） */
  extraShippingThreshold?: number | null;
}

/**
 * 計算訂單的完整價格明細
 * @param cost 餐點原始金額
 * @param storeConfig 店家運費設定（可選）
 * @returns 包含各項費用的價格明細
 */
export function calculateOrderPricing(
  cost: number,
  storeConfig?: StoreShippingConfig,
): PricingBreakdown {
  const costNum = Math.max(0, cost); // 確保金額不為負數
  const devFee = 10; // 固定開發費 10 元

  // 基本運費計算邏輯
  let baseShippingFee: number;

  if (costNum < 150) {
    baseShippingFee = 20; // 商品金額 < 150：運費 20 元
  } else {
    baseShippingFee = Math.round(costNum * 0.12); // 商品金額 >= 150：運費 12%
  }

  // 額外運費計算
  let extraShippingFee = 0;

  if (storeConfig?.extraShippingFee && storeConfig.extraShippingFee > 0) {
    // 檢查是否達到免額外運費門檻
    const threshold = storeConfig.extraShippingThreshold;

    if (threshold && threshold > 0 && costNum >= threshold) {
      // 訂單金額已達門檻，不加收額外運費
      extraShippingFee = 0;
    } else {
      // 需要加收額外運費
      extraShippingFee = storeConfig.extraShippingFee;
    }
  }

  const shippingFee = baseShippingFee + extraShippingFee;
  const totalAmount = costNum + devFee + shippingFee;

  return {
    cost: costNum,
    devFee,
    baseShippingFee,
    extraShippingFee,
    shippingFee,
    totalAmount,
  };
}

/**
 * 計算服務費（開發費 + 運費）
 * @param cost 餐點原始金額
 * @param storeConfig 店家運費設定（可選）
 * @returns 服務費總額
 */
export function calculateServiceFee(cost: number, storeConfig?: StoreShippingConfig): number {
  const pricing = calculateOrderPricing(cost, storeConfig);

  return pricing.devFee + pricing.shippingFee;
}
