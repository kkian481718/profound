import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Order {
  id: string;
  store_id: string;
  store_name: string;
  order_time: string;
  pickup_time: string;
  pickup_location: string;
  pickup_name: string;
  pickup_code: string;
  pickup_phone: string;
  menu_items?: string;
  menu_image_url?: string;
  cost: number;
  dev_fee: number;
  shipping_fee: number;
  total_amount: number;
  payment_status: "pending" | "paid" | "refunded";
  delivery_status:
    | "pending"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
}
