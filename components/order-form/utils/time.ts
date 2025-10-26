/**
 * 格式化預計送達時間
 */
export function formatDeliveryTime(deliveryTime: string | null): string {
  if (!deliveryTime) {
    // 如果沒有設定送達時間，使用當前時間 + 8 小時作為預設
    const defaultTime = new Date();

    defaultTime.setHours(defaultTime.getHours() + 8);

    return defaultTime.toLocaleString("zh-TW", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const time = new Date(deliveryTime);

  return time.toLocaleString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * 檢查是否為今日
 */
export function isToday(date: string | null): boolean {
  if (!date) return false;

  const targetDate = new Date(date);
  const today = new Date();

  return (
    targetDate.getDate() === today.getDate() &&
    targetDate.getMonth() === today.getMonth() &&
    targetDate.getFullYear() === today.getFullYear()
  );
}
