import { useState } from "react";
import { useRouter } from "next/navigation";

import { calculateOrderPricing } from "../utils/pricing";

import { createClient } from "@/lib/supabase/client";
import { trackOrderEvent } from "@/lib/gtag";
import { validateAndCloseExpiredStore } from "@/lib/validateStore";
import { checkOrderLimits } from "@/lib/checkOrderLimits";

type SubmitOrderParams = {
  selectedStore: string;
  menuItems: string;
  cost: string;
  phoneNumber: string;
  pickupName: string;
  selectedPickupLocation: string;
  offCampusAddress: string;
  uploadedImage: File | null;
  showOffCampusAddress: boolean;
};

export function useOrderSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const generatePickupCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const uploadImageToStorage = async (image: File): Promise<string | null> => {
    try {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `order-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("orders")
        .upload(filePath, image, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        // eslint-disable-next-line no-console
        console.warn("圖片上傳失敗:", uploadError);

        return null;
      }

      // 取得公開 URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("orders").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("圖片上傳錯誤:", error);

      return null;
    }
  };

  const submitOrder = async (params: SubmitOrderParams) => {
    setWasSubmitted(false);
    setSubmitError(null);
    setIsSubmitting(true);

    // 追蹤訂單開始事件
    trackOrderEvent("order_started");

    try {
      // 1. 驗證店家是否仍可接單（包含自動關閉過期店家）
      const storeValidation = await validateAndCloseExpiredStore(
        params.selectedStore,
      );

      if (!storeValidation.isValid) {
        setSubmitError(
          storeValidation.message || "店家驗證失敗，請重新選擇店家",
        );

        return false;
      }

      // 2. 檢查訂單限制（全站限制 + 店家限制）
      const limitCheck = await checkOrderLimits(params.selectedStore);

      if (!limitCheck.canOrder) {
        setSubmitError(limitCheck.reason || "訂單數已達上限，無法下單");

        return false;
      }

      const pickupCode = generatePickupCode();
      let menuImageUrl: string | null = null;

      // 如果有上傳圖片，先上傳到 Supabase Storage
      if (params.uploadedImage) {
        menuImageUrl = await uploadImageToStorage(params.uploadedImage);
      }

      // 使用統一的價格計算函數
      const costNum = parseFloat(params.cost);
      const pricing = calculateOrderPricing(costNum);

      const orderData = {
        store_id: params.selectedStore,
        pickup_location: params.showOffCampusAddress
          ? params.selectedPickupLocation === "校內教學區"
            ? `[校內教學區] ${params.offCampusAddress}`
            : `[校外] ${params.offCampusAddress}`
          : params.selectedPickupLocation,
        pickup_name: params.pickupName,
        pickup_code: pickupCode,
        pickup_phone: params.phoneNumber,
        menu_items: params.menuItems,
        menu_image_url: menuImageUrl,
        cost: pricing.cost,
        dev_fee: pricing.devFee,
        shipping_fee: pricing.shippingFee,
        total_amount: pricing.totalAmount,
        order_status: "pending",
      };

      // 儲存訂單到資料庫
      const { error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // 成功提交
      setWasSubmitted(true);

      // 追蹤訂單完成事件
      trackOrderEvent("order_completed", {
        store_name: params.selectedStore,
        order_total: pricing.totalAmount,
        pickup_location: params.showOffCampusAddress
          ? params.selectedPickupLocation === "校內教學區"
            ? `[校內教學區] ${params.offCampusAddress}`
            : `[校外] ${params.offCampusAddress}`
          : params.selectedPickupLocation,
      });

      // 導航到訂單確認頁面
      router.push(
        `/orders/confirmation?pickupCode=${pickupCode}&phoneNumber=${encodeURIComponent(params.phoneNumber)}&totalAmount=${pricing.totalAmount.toFixed(0)}`,
      );

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("提交訂單失敗:", error);

      // 根據錯誤類型提供更具體的錯誤訊息
      if (error instanceof Error) {
        if (error.message.includes("店家") || error.message.includes("限制")) {
          setSubmitError(error.message);
        } else {
          setSubmitError("提交訂單時發生錯誤，請稍後再試。");
        }
      } else {
        setSubmitError("提交訂單時發生錯誤，請稍後再試。");
      }

      // 追蹤訂單失敗事件
      trackOrderEvent("order_failed", {
        store_name: params.selectedStore,
      });

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    wasSubmitted,
    submitError,
    submitOrder,
    setSubmitError,
  };
}
