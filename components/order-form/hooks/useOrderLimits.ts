import { useState, useEffect, useCallback } from "react";

import { createClient } from "@/lib/supabase/client";

export interface OrderLimitInfo {
  globalLimit: number | null;
  globalCount: number;
  storeCount?: number;
  storeLimit?: number;
}

export interface StoreOrderInfo {
  storeId: string;
  storeCount: number;
  storeLimit: number | null;
}

export function useOrderLimits() {
  const [globalLimitInfo, setGlobalLimitInfo] = useState<OrderLimitInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchGlobalLimitInfo = useCallback(async () => {
    try {
      setIsLoading(true);
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

      // 獲取今日全域訂單數
      const { count: globalCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("order_time", startOfDay)
        .lte("order_time", endOfDay);

      setGlobalLimitInfo({
        globalLimit,
        globalCount: globalCount || 0,
      });
    } catch (error) {
      console.error("Error fetching global limit info:", error);
      setGlobalLimitInfo({
        globalLimit: null,
        globalCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStoreOrderInfo = useCallback(
    async (storeId: string): Promise<StoreOrderInfo | null> => {
      try {
        const supabase = createClient();
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(
          today.setHours(23, 59, 59, 999),
        ).toISOString();

        // 獲取店家設定
        const { data: store } = await supabase
          .from("stores")
          .select("max_daily_orders")
          .eq("id", storeId)
          .single();

        const storeLimit = store?.max_daily_orders;

        // 獲取店家今日訂單數
        const { count: storeCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("store_id", storeId)
          .gte("order_time", startOfDay)
          .lte("order_time", endOfDay);

        return {
          storeId,
          storeCount: storeCount || 0,
          storeLimit,
        };
      } catch (error) {
        console.error("Error fetching store order info:", error);

        return null;
      }
    },
    [],
  );

  useEffect(() => {
    fetchGlobalLimitInfo();
  }, [fetchGlobalLimitInfo]);

  const refetchAll = useCallback(async () => {
    await fetchGlobalLimitInfo();
  }, [fetchGlobalLimitInfo]);

  return {
    globalLimitInfo,
    isLoading,
    refetchGlobalLimitInfo: fetchGlobalLimitInfo,
    fetchStoreOrderInfo,
    refetchAll,
  };
}
