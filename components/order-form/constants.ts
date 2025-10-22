import type { ErrorState } from "./types";

export const pickupLocations = [
  { label: "【校外】", value: "校外" },
  { label: "沁月", value: "沁月" },
  { label: "迎曦", value: "迎曦" },
  { label: "行雲", value: "行雲" },
  { label: "向晴", value: "向晴" },
  { label: "仰山", value: "仰山" },
  { label: "涵星", value: "涵星" },
  { label: "擷雲", value: "擷雲" },
] as const;

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
