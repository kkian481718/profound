export type StoreOption = {
  label: string;
  value: string;
  order_deadline?: string | null;
  max_daily_orders?: number | null;
  menu_placeholder?: string | null;
  extra_shipping_fee?: number | null;
  extra_shipping_threshold?: number | null;
  shipping_method?: "standard" | "per_item" | string | null;
};

export type OrderItemDraft = {
  name: string;
  price: string;
  quantity: string;
};

export type ErrorState = {
  serviceType: string;
  store: string;
  menuItems: string;
  cost: string;
  items: string;
  phone: string;
  pickupLocation: string;
  address: string;
  image: string;
  pickupName: string;
};

export type Step = 1 | 2;

export type OrderFormData = {
  selectedServiceType: string | null;
  selectedStore: string | null;
  menuItems: string;
  cost: string;
  phoneNumber: string;
  selectedPickupLocation: string | null;
  offCampusAddress: string;
  uploadedImage: File | null;
};

export type OrderFormProps = {
  stores?: StoreOption[];
};
