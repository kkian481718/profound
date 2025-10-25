// Google Analytics configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_TRACKING_ID as string, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = (
  action: string,
  {
    event_category,
    event_label,
    value,
  }: {
    event_category?: string;
    event_label?: string;
    value?: number;
  },
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category,
      event_label,
      value,
    });
  }
};

// 自定義事件追蹤 - 針對 Profound 平台的業務邏輯
export const trackOrderEvent = (
  eventName: "order_started" | "order_completed" | "order_failed",
  orderData?: {
    store_name?: string;
    order_total?: number;
    pickup_location?: string;
  },
) => {
  event(eventName, {
    event_category: "Order",
    event_label: orderData?.store_name,
    value: orderData?.order_total,
  });
};

export const trackStoreEvent = (
  eventName: "store_viewed" | "store_selected",
  storeName: string,
) => {
  event(eventName, {
    event_category: "Store",
    event_label: storeName,
  });
};

export const trackAdminEvent = (
  eventName: "admin_login" | "order_status_updated" | "store_settings_changed",
  details?: string,
) => {
  event(eventName, {
    event_category: "Admin",
    event_label: details,
  });
};
