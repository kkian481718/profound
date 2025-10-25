import { useState } from "react";
import { useRouter } from "next/navigation";

import { DEFAULT_PICKUP_HOURS } from "../constants";
import { calculateOrderPricing } from "../utils/pricing";

import { createClient } from "@/lib/supabase/client";
import { trackOrderEvent } from "@/lib/gtag";

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
      const pickupCode = generatePickupCode();
      let menuImageUrl: string | null = null;

      // 如果有上傳圖片，先上傳到 Supabase Storage
      if (params.uploadedImage) {
        menuImageUrl = await uploadImageToStorage(params.uploadedImage);
      }

      // 取得店家的 next_delivery_time
      const { data: storeData } = await supabase
        .from("stores")
        .select("next_delivery_time")
        .eq("id", params.selectedStore)
        .single();

      // 使用店家設定的出貨時間，如果沒有設定則使用預設值
      let pickupTime: Date;

      if (storeData?.next_delivery_time) {
        pickupTime = new Date(storeData.next_delivery_time);
      } else {
        // 預設取貨時間為下單後 8 小時
        pickupTime = new Date();
        pickupTime.setHours(pickupTime.getHours() + DEFAULT_PICKUP_HOURS);
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
        pickup_time: pickupTime.toISOString(),
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
      setSubmitError("提交訂單時發生錯誤，請稍後再試。");

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
