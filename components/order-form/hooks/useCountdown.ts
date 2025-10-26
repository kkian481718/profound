import { useState, useEffect } from "react";

export type CountdownResult = {
  timeLeft: string;
  isExpired: boolean;
};

export function useCountdown(deadline: string | null): CountdownResult {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft("無期限");
      setIsExpired(false);

      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const distance = deadlineTime - now;

      if (distance < 0) {
        setTimeLeft("已截止");
        setIsExpired(true);

        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}小時${minutes}分鐘`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}分${seconds}秒`);
      } else {
        setTimeLeft(`${seconds}秒`);
      }

      setIsExpired(false);
    };

    // 立即執行一次
    updateCountdown();

    // 每秒更新
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return { timeLeft, isExpired };
}
