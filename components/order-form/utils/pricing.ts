/**
 * 價格計算相關的工具函數
 */

export interface PricingBreakdown {
  /** 餐點/商品金額 */
  cost: number;
  /** 開發費（網頁服務費） */
  devFee: number;
  /** 基本運費 */
  baseShippingFee: number;
  /** 額外運費（遠程店家加收） */
  extraShippingFee: number;
  /** 總運費（基本運費 + 額外運費） */
  shippingFee: number;
  /** 總金額 */
  totalAmount: number;
  /** 購買件數（僅 per_item 模式有值） */
  quantity?: number;
}

export type ShippingMethod = "standard" | "per_item";

export interface StoreShippingConfig {
  /** 額外運費金額 */
  extraShippingFee?: number | null;
  /** 免額外運費門檻（訂單金額超過此值不加收額外運費） */
  extraShippingThreshold?: number | null;
  /** 運費計算模式：standard=金額比例制, per_item=件數制 */
  shippingMethod?: ShippingMethod | string | null;
}

/** per_item 模式：第一件運費 */
export const PER_ITEM_FIRST_SHIPPING_FEE = 30;
/** per_item 模式：第二件起每件運費 */
export const PER_ITEM_ADDITIONAL_SHIPPING_FEE = 15;

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
  const extraShippingFee = calculateExtraShippingFee(costNum, storeConfig);

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
 * 計算額外運費（遠程店家加收，含免運門檻判斷）
 */
function calculateExtraShippingFee(costNum: number, storeConfig?: StoreShippingConfig): number {
  if (!storeConfig?.extraShippingFee || storeConfig.extraShippingFee <= 0) {
    return 0;
  }

  const threshold = storeConfig.extraShippingThreshold;

  if (threshold && threshold > 0 && costNum >= threshold) {
    return 0;
  }

  return storeConfig.extraShippingFee;
}

/**
 * 計算件數制（per_item）的完整價格明細
 * 運費規則：第一件 NT$30，第二件起每件 NT$15
 * @param unitPrice 商品單價
 * @param quantity 購買件數
 * @param storeConfig 店家運費設定（可選）
 * @returns 包含各項費用的價格明細
 */
export function calculatePerItemPricing(
  unitPrice: number,
  quantity: number,
  storeConfig?: StoreShippingConfig,
): PricingBreakdown {
  const quantityNum = Math.max(1, Math.floor(quantity) || 1);
  const unitPriceNum = Math.max(0, unitPrice);
  const costNum = unitPriceNum * quantityNum;
  const devFee = 10; // 固定網頁服務費 10 元
  const baseShippingFee =
    PER_ITEM_FIRST_SHIPPING_FEE + PER_ITEM_ADDITIONAL_SHIPPING_FEE * (quantityNum - 1);

  const extraShippingFee = calculateExtraShippingFee(costNum, storeConfig);
  const shippingFee = baseShippingFee + extraShippingFee;
  const totalAmount = costNum + devFee + shippingFee;

  return {
    cost: costNum,
    devFee,
    baseShippingFee,
    extraShippingFee,
    shippingFee,
    totalAmount,
    quantity: quantityNum,
  };
}

export interface PerItemEntry {
  /** 商品單價 */
  unitPrice: number;
  /** 數量 */
  quantity: number;
}

/**
 * 計算件數制（per_item）多商品明細的完整價格明細
 * 運費規則：第一件 NT$30，第二件起每件 NT$15（依總件數計算）
 * @param items 商品明細（單價 + 數量）
 * @param storeConfig 店家運費設定（可選）
 * @returns 包含各項費用的價格明細
 */
export function calculatePerItemItemsPricing(
  items: PerItemEntry[],
  storeConfig?: StoreShippingConfig,
): PricingBreakdown {
  let costNum = 0;
  let totalQuantity = 0;

  for (const item of items) {
    const qty = Math.max(1, Math.floor(item.quantity) || 1);

    costNum += Math.max(0, item.unitPrice) * qty;
    totalQuantity += qty;
  }

  totalQuantity = Math.max(1, totalQuantity);

  const devFee = 10; // 固定網頁服務費 10 元
  const baseShippingFee =
    PER_ITEM_FIRST_SHIPPING_FEE + PER_ITEM_ADDITIONAL_SHIPPING_FEE * (totalQuantity - 1);

  const extraShippingFee = calculateExtraShippingFee(costNum, storeConfig);
  const shippingFee = baseShippingFee + extraShippingFee;
  const totalAmount = costNum + devFee + shippingFee;

  return {
    cost: costNum,
    devFee,
    baseShippingFee,
    extraShippingFee,
    shippingFee,
    totalAmount,
    quantity: totalQuantity,
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
