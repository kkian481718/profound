import type { ErrorState } from "./types";

// 用戶下單時的取貨地點選項（不包含新宿、舊宿）
export const pickupLocations = [
  { label: "【校外】", value: "校外" },
  { label: "【校內教學區】", value: "校內教學區" },
  { label: "沁月", value: "沁月" },
  { label: "迎曦", value: "迎曦" },
  { label: "行雲", value: "行雲" },
  { label: "向晴", value: "向晴" },
  { label: "仰山", value: "仰山" },
  { label: "涵星", value: "涵星" },
  { label: "擷雲", value: "擷雲" },
] as const;

// 管理員篩選用的取貨地點選項（包含新宿、舊宿）
export const adminPickupLocations = [
  { label: "【校外】", value: "校外" },
  { label: "【校內教學區】", value: "校內教學區" },
  { label: "【新宿】", value: "新宿" },
  { label: "【舊宿】", value: "舊宿" },
  { label: "沁月", value: "沁月" },
  { label: "迎曦", value: "迎曦" },
  { label: "行雲", value: "行雲" },
  { label: "向晴", value: "向晴" },
  { label: "仰山", value: "仰山" },
  { label: "涵星", value: "涵星" },
  { label: "擷雲", value: "擷雲" },
] as const;

// 宿舍分類定義
export const newDormitories = ["沁月", "迎曦", "行雲"] as const;
export const oldDormitories = ["向晴", "仰山", "涵星", "擷雲"] as const;

// 移除共乘功能，只保留外送服務
export const serviceTypes = [{ label: "訂購外送", value: "delivery" }] as const;

export const initialErrors: ErrorState = {
  serviceType: "",
  store: "",
  menuItems: "",
  cost: "",
  phone: "",
  pickupLocation: "",
  address: "",
  image: "",
  pickupName: "",
};

export const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const PICKUP_CODE_LENGTH = 4;
export const DEFAULT_PICKUP_HOURS = 8;
