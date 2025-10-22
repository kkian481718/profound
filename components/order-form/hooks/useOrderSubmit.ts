import { useState } from "react";
import { useRouter } from "next/navigation";

import { DEFAULT_PICKUP_HOURS } from "../constants";

import { createClient } from "@/lib/supabase/client";

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

      // 計算金額
      const costNum = parseFloat(params.cost);
      const devFee = 10; // 固定網頁費 10 元

      // 運費計算邏輯
      let shippingFeeNum: number;

      if (costNum < 150) {
        shippingFeeNum = 20; // 商品金額 < 150：運費 20 元
      } else {
        shippingFeeNum = Math.round(costNum * 0.12); // 商品金額 >= 150：運費 12%
      }

      const totalAmountNum = costNum + devFee + shippingFeeNum;

      const orderData = {
        store_id: params.selectedStore,
        order_type: "delivery",
        pickup_location: params.showOffCampusAddress
          ? params.offCampusAddress
          : params.selectedPickupLocation,
        pickup_name: params.pickupName,
        pickup_code: pickupCode,
        pickup_phone: params.phoneNumber,
        menu_items: params.menuItems,
        menu_image_url: menuImageUrl,
        cost: costNum,
        dev_fee: devFee,
        shipping_fee: shippingFeeNum,
        total_amount: totalAmountNum,
        payment_status: "pending",
        delivery_status: "pending",
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

      // 導航到訂單確認頁面
      router.push(
        `/orders/confirmation?pickupCode=${pickupCode}&phoneNumber=${encodeURIComponent(params.phoneNumber)}&totalAmount=${totalAmountNum.toFixed(0)}`,
      );

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("提交訂單失敗:", error);
      setSubmitError("提交訂單時發生錯誤，請稍後再試。");

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
