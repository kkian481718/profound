import type { StoreOption } from "../types";

import { useState, useEffect, useMemo } from "react";

import { createClient } from "@/lib/supabase/client";

export function useStores(providedStores?: StoreOption[]) {
  const [storesFromDB, setStoresFromDB] = useState<StoreOption[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const supabase = createClient();

  const fetchStores = async () => {
    try {
      setIsLoadingStores(true);
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .eq("is_open", true)
        .order("name");

      if (error) throw error;

      if (data) {
        const formattedStores = data.map((store) => ({
          label: store.name,
          value: store.id,
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
    fetchStores();
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
