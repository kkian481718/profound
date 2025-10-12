import type { ErrorState } from "../types";

import { initialErrors } from "../constants";

export function validateServiceType(
  selectedServiceType: string | null
): string {
  if (!selectedServiceType) {
    return "請選擇服務類型";
  }

  return "";
}

export function validateStore(selectedStore: string | null): string {
  if (!selectedStore) {
    return "請選擇店家";
  }

  return "";
}

export function validateOrderDetails(
  menuItems: string,
  cost: string,
  phoneNumber: string,
  pickupName: string,
  selectedPickupLocation: string | null,
  offCampusAddress: string,
  showOffCampusAddress: boolean
): { isValid: boolean; errors: ErrorState } {
  let hasError = false;
  const nextErrors: ErrorState = { ...initialErrors };

  if (!menuItems.trim()) {
    nextErrors.menuItems = "請輸入想點的餐點";
    hasError = true;
  }

  const costNum = parseFloat(cost);

  if (!cost.trim()) {
    nextErrors.cost = "請輸入餐點金額";
    hasError = true;
  } else if (isNaN(costNum) || costNum <= 0) {
    nextErrors.cost = "請輸入有效的金額";
    hasError = true;
  }

  const normalizedPhone = phoneNumber.trim();

  if (!normalizedPhone) {
    nextErrors.phone = "請輸入手機號碼";
    hasError = true;
  } else if (!/^09\d{8}$/.test(normalizedPhone)) {
    nextErrors.phone = "請輸入有效的手機號碼 (例如:0912345678)";
    hasError = true;
  }

  const normalizedName = pickupName.trim();

  if (!normalizedName) {
    nextErrors.pickupName = "請輸入暱稱";
    hasError = true;
  } else if (normalizedName.length < 2) {
    nextErrors.pickupName = "暱稱至少需要2個字元";
    hasError = true;
  } else if (normalizedName.length > 20) {
    nextErrors.pickupName = "暱稱不能超過20個字元";
    hasError = true;
  }

  if (!selectedPickupLocation) {
    nextErrors.pickupLocation = "請選擇取貨地點";
    hasError = true;
  }

  if (showOffCampusAddress && !offCampusAddress.trim()) {
    nextErrors.address = "請填寫校外取貨地址";
    hasError = true;
  }

  return { isValid: !hasError, errors: nextErrors };
}

export function validateImageFile(file: File): string {
  if (!file.type.startsWith("image/")) {
    return "請上傳圖片檔案";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "圖片檔案不能超過 5MB";
  }

  return "";
}
