import type { StoreOption } from "../types";

import { useState, useEffect, useMemo } from "react";

import { createClient } from "@/lib/supabase/client";
import { closeAllExpiredStores } from "@/lib/validateStore";

export function useStores(providedStores?: StoreOption[]) {
  const [storesFromDB, setStoresFromDB] = useState<StoreOption[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const supabase = createClient();

  const fetchStores = async () => {
    try {
      setIsLoadingStores(true);

      const { data, error } = await supabase
        .from("stores")
        .select(
          "id, name, order_deadline, max_daily_orders, menu_placeholder, extra_shipping_fee, extra_shipping_threshold",
        )
        .eq("is_open", true)
        .order("name");

      if (error) throw error;

      if (data) {
        // 過濾掉已經過期的店家 (雙重保險)
        const now = new Date();
        const validStores = data.filter((store) => {
          if (!store.order_deadline) return true;

          return new Date(store.order_deadline) > now;
        });

        const formattedStores = validStores.map((store) => ({
          label: store.name,
          value: store.id,
          order_deadline: store.order_deadline,
          max_daily_orders: store.max_daily_orders,
          menu_placeholder: store.menu_placeholder,
          extra_shipping_fee: store.extra_shipping_fee,
          extra_shipping_threshold: store.extra_shipping_threshold,
        }));

        setStoresFromDB(formattedStores);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("載入店家資料失敗:", error);
      setStoresFromDB([]);
    } finally {
      setIsLoadingStores(false);
    }
  };

  useEffect(() => {
    // 先關閉所有過期的店家，只在組件掛載時執行一次
    closeAllExpiredStores().finally(() => {
      fetchStores();
    });
  }, []);

  const storeOptions = useMemo<StoreOption[]>(() => {
    if (providedStores?.length) {
      return providedStores;
    }

    return storesFromDB;
  }, [providedStores, storesFromDB]);

  return {
    storeOptions,
    isLoadingStores,
    refetchStores: fetchStores,
  };
}
