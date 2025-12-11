import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Google Analytics types
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: {
        page_path?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
        [key: string]: any;
      },
    ) => void;
  }
}

export interface Order {
  id: string;
  store_id: string;
  store_name: string;
  order_time: string;
  pickup_location: string;
  pickup_name: string;
  pickup_phone: string;
  menu_items?: string;
  menu_image_url?: string;
  cost: number;
  dev_fee: number;
  shipping_fee: number;
  total_amount: number;
  order_status: "pending" | "preparing" | "completed";
  admin_note?: string;
}

export interface Store {
  id: string;
  name: string;
  is_open: boolean;
  order_deadline: string | null;
  max_daily_orders: number | null;
  menu_placeholder: string | null;
  created_at: string;
}

export interface GlobalSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
}
