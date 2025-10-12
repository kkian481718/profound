import { createClient } from "@/lib/supabase/client";

export interface StoreValidationResult {
  isValid: boolean;
  message?: string;
  store?: {
    id: string;
    name: string;
    is_open: boolean;
    order_deadline: string | null;
  };
}

/**
 * 驗證店家是否可以接單,並自動關閉過期的店家
 * @param storeId 店家 ID
 * @returns 驗證結果
 */
export async function validateAndCloseExpiredStore(
  storeId: string,
): Promise<StoreValidationResult> {
  try {
    const supabase = createClient();

    const { data: store, error } = await supabase
      .from("stores")
      .select("id, name, is_open, order_deadline")
      .eq("id", storeId)
      .single();

    if (error || !store) {
      return { isValid: false, message: "店家不存在" };
    }

    // 檢查截止時間
    if (store.order_deadline) {
      const deadline = new Date(store.order_deadline);
      const now = new Date();

      if (now > deadline && store.is_open) {
        // 自動關閉店家（原子操作，避免race condition）
        const { error: updateError } = await supabase
          .from("stores")
          .update({ is_open: false })
          .eq("id", storeId)
          .eq("is_open", true)
          .lt("order_deadline", now);

        if (updateError) {
          // eslint-disable-next-line no-console
          console.error("Failed to close expired store:", updateError);
        }

        return {
          isValid: false,
          message: `${store.name} 已超過接單時間`,
          store: { ...store, is_open: false },
        };
      }
    }

    if (!store.is_open) {
      return {
        isValid: false,
        message: `${store.name} 目前未開放接單`,
        store,
      };
    }

    return { isValid: true, store };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error occurred during store validation:", error);

    return { isValid: false, message: "店家驗證失敗，請稍後再試" };
  }
}

/**
 * 批量檢查並關閉所有過期的店家
 * @returns 被關閉的店家數量
 */
export async function closeAllExpiredStores(): Promise<number> {
  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    // 查詢所有開放中且截止時間已過的店家
    const { data: expiredStores, error: fetchError } = await supabase
      .from("stores")
      .select("id, name")
      .eq("is_open", true)
      .not("order_deadline", "is", null)
      .lt("order_deadline", now);

    if (fetchError) throw fetchError;

    if (!expiredStores || expiredStores.length === 0) {
      return 0;
    }

    // 批量關閉過期店家
    const storeIds = expiredStores.map((store) => store.id);

    const { error: updateError } = await supabase
      .from("stores")
      .update({ is_open: false })
      .in("id", storeIds);

    if (updateError) throw updateError;

    // eslint-disable-next-line no-console
    console.log(
      `已自動關閉 ${expiredStores.length} 個過期店家:`,
      expiredStores.map((s) => s.name).join(", "),
    );

    return expiredStores.length;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error occurred while closing expired stores:", error);

    return 0;
  }
}
