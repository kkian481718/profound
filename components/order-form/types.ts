export type StoreOption = {
  label: string;
  value: string;
};

export type ErrorState = {
  serviceType: string;
  store: string;
  menuItems: string;
  phone: string;
  pickupLocation: string;
  address: string;
  image: string;
};

export type Step = 1 | 2 | 3;

export type OrderFormData = {
  selectedServiceType: string | null;
  selectedStore: string | null;
  menuItems: string;
  phoneNumber: string;
  selectedPickupLocation: string | null;
  offCampusAddress: string;
  uploadedImage: File | null;
};

export type OrderFormProps = {
  stores?: StoreOption[];
};
