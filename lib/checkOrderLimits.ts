import { createClient } from "@/lib/supabase/client";

export interface OrderLimitCheck {
  canOrder: boolean;
  reason?: string;
  globalLimit?: number;
  globalCount?: number;
  storeLimit?: number;
  storeCount?: number;
}

export async function checkOrderLimits(
  storeId: string,
): Promise<OrderLimitCheck> {
  try {
    const supabase = createClient();
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // 獲取全域最大訂單數設定
    const { data: globalSetting } = await supabase
      .from("global_settings")
      .select("setting_value")
      .eq("setting_key", "max_daily_orders")
      .single();

    const globalLimit = globalSetting?.setting_value
      ? Number(globalSetting.setting_value)
      : null;

    // 獲取店家設定
    const { data: store } = await supabase
      .from("stores")
      .select("max_daily_orders")
      .eq("id", storeId)
      .single();

    const storeLimit = store?.max_daily_orders;

    // 檢查全域訂單數
    if (globalLimit !== null) {
      const { count: globalCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("order_time", startOfDay)
        .lte("order_time", endOfDay);

      if (globalCount !== null && globalCount >= globalLimit) {
        return {
          canOrder: false,
          reason: `今日訂單數已達全站上限（${globalCount}/${globalLimit}），請明日再試`,
          globalLimit,
          globalCount,
        };
      }
    }

    // 檢查店家訂單數
    if (storeLimit !== null) {
      const { count: storeCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .gte("order_time", startOfDay)
        .lte("order_time", endOfDay);

      if (storeCount !== null && storeCount >= storeLimit) {
        return {
          canOrder: false,
          reason: `此店家今日訂單數已達上限（${storeCount}/${storeLimit}），請明日再試`,
          storeLimit,
          storeCount,
        };
      }
    }

    return { canOrder: true };
  } catch (error) {
    console.error("Error checking order limits:", error);

    // 如果檢查失敗，允許下單但記錄錯誤
    return { canOrder: true };
  }
}

export async function checkGlobalOrderLimit(): Promise<OrderLimitCheck> {
  try {
    const supabase = createClient();
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // 獲取全域最大訂單數設定
    const { data: globalSetting } = await supabase
      .from("global_settings")
      .select("setting_value")
      .eq("setting_key", "max_daily_orders")
      .single();

    const globalLimit = globalSetting?.setting_value
      ? Number(globalSetting.setting_value)
      : null;

    // 如果沒有設定全域限制，則允許下單
    if (globalLimit === null) {
      return { canOrder: true };
    }

    // 檢查全域訂單數
    const { count: globalCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("order_time", startOfDay)
      .lte("order_time", endOfDay);

    if (globalCount !== null && globalCount >= globalLimit) {
      return {
        canOrder: false,
        reason: `今日訂單數已達全站上限（${globalCount}/${globalLimit}），請明日再試`,
        globalLimit,
        globalCount,
      };
    }

    return { canOrder: true, globalLimit, globalCount: globalCount || 0 };
  } catch (error) {
    console.error("Error checking global order limit:", error);

    // 如果檢查失敗，允許下單但記錄錯誤
    return { canOrder: true };
  }
}

export async function getOrderCounts(storeId?: string) {
  try {
    const supabase = createClient();
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // 獲取全域訂單數
    const { count: globalCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("order_time", startOfDay)
      .lte("order_time", endOfDay);

    let storeCount = null;

    if (storeId) {
      const result = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .gte("order_time", startOfDay)
        .lte("order_time", endOfDay);

      storeCount = result.count;
    }

    return {
      globalCount: globalCount || 0,
      storeCount: storeCount || 0,
    };
  } catch (error) {
    console.error("Error getting order counts:", error);

    return {
      globalCount: 0,
      storeCount: 0,
    };
  }
}
