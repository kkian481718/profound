import { createClient } from "@supabase/supabase-js";

// 使用 service role key 來繞過 RLS 進行清理操作
// 這個函數應該只在伺服器端的 cron job 中使用
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables for admin client");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  freedSpaceEstimate: string;
  errors: string[];
  details: {
    ordersProcessed: number;
    imagesDeleted: string[];
  };
}

/**
 * 清理超過指定天數的訂單圖片
 * @param daysOld - 超過多少天的圖片要刪除，預設 30 天
 * @returns 清理結果
 */
export async function cleanupOldOrderImages(daysOld: number = 30): Promise<CleanupResult> {
  const supabase = createAdminClient();
  const errors: string[] = [];
  const imagesDeleted: string[] = [];

  try {
    // 計算截止日期
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffDateISO = cutoffDate.toISOString();

    // 1. 查詢所有超過指定天數且有圖片的訂單
    const { data: oldOrders, error: queryError } = await supabase
      .from("orders")
      .select("id, menu_image_url, created_at")
      .not("menu_image_url", "is", null)
      .lt("created_at", cutoffDateISO);

    if (queryError) {
      throw new Error(`查詢舊訂單失敗: ${queryError.message}`);
    }

    if (!oldOrders || oldOrders.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        freedSpaceEstimate: "0 KB",
        errors: [],
        details: {
          ordersProcessed: 0,
          imagesDeleted: [],
        },
      };
    }

    // 2. 從圖片 URL 提取檔案路徑
    const imagePaths: string[] = [];
    const orderIdsToUpdate: string[] = [];

    for (const order of oldOrders) {
      if (order.menu_image_url) {
        // URL 格式: https://xxx.supabase.co/storage/v1/object/public/orders/order-images/filename.jpg
        const urlParts = order.menu_image_url.split("/storage/v1/object/public/orders/");
        if (urlParts.length === 2) {
          imagePaths.push(urlParts[1]);
          orderIdsToUpdate.push(order.id);
        }
      }
    }

    if (imagePaths.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        freedSpaceEstimate: "0 KB",
        errors: [],
        details: {
          ordersProcessed: oldOrders.length,
          imagesDeleted: [],
        },
      };
    }

    // 3. 從 Storage 刪除圖片檔案
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from("orders")
      .remove(imagePaths);

    if (deleteError) {
      errors.push(`刪除 Storage 檔案失敗: ${deleteError.message}`);
    } else if (deleteData) {
      imagesDeleted.push(...imagePaths);
    }

    // 4. 更新訂單記錄，清除 menu_image_url
    const { error: updateError } = await supabase
      .from("orders")
      .update({ menu_image_url: null })
      .in("id", orderIdsToUpdate);

    if (updateError) {
      errors.push(`更新訂單記錄失敗: ${updateError.message}`);
    }

    // 5. 估算釋放的空間（假設平均每張圖片 500KB）
    const estimatedFreedKB = imagesDeleted.length * 500;
    const freedSpaceEstimate =
      estimatedFreedKB >= 1024
        ? `${(estimatedFreedKB / 1024).toFixed(2)} MB`
        : `${estimatedFreedKB} KB`;

    return {
      success: errors.length === 0,
      deletedCount: imagesDeleted.length,
      freedSpaceEstimate,
      errors,
      details: {
        ordersProcessed: oldOrders.length,
        imagesDeleted,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    errors.push(errorMessage);

    return {
      success: false,
      deletedCount: 0,
      freedSpaceEstimate: "0 KB",
      errors,
      details: {
        ordersProcessed: 0,
        imagesDeleted: [],
      },
    };
  }
}

/**
 * 查詢可清理的舊圖片統計（不實際刪除）
 * @param daysOld - 超過多少天的圖片
 */
export async function getCleanupPreview(daysOld: number = 30) {
  const supabase = createAdminClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffDateISO = cutoffDate.toISOString();

  const { data, error, count } = await supabase
    .from("orders")
    .select("id, menu_image_url, created_at", { count: "exact" })
    .not("menu_image_url", "is", null)
    .lt("created_at", cutoffDateISO);

  if (error) {
    throw new Error(`查詢失敗: ${error.message}`);
  }

  return {
    count: count || 0,
    estimatedSpaceMB: ((count || 0) * 0.5).toFixed(2),
    oldestOrder: data?.[0]?.created_at || null,
    cutoffDate: cutoffDateISO,
  };
}
