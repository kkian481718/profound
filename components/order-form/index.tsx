"use client";

import type { Selection } from "@react-types/shared";
import type { ErrorState, OrderFormProps, Step } from "./types";

import { useState, type FormEvent } from "react";

import { initialErrors } from "./constants";
import { useStores } from "./hooks/useStores";
import { useImageUpload } from "./hooks/useImageUpload";
import { useOrderSubmit } from "./hooks/useOrderSubmit";
import {
  validateServiceType,
  validateStore,
  validateOrderDetails,
} from "./utils/validation";
import { ServiceTypeStep } from "./ServiceTypeStep";
import { StoreSelectionStep } from "./StoreSelectionStep";
import { OrderDetailsStep } from "./OrderDetailsStep";

export function OrderForm({ stores }: OrderFormProps) {
  // Step 管理
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // 表單資料
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(
    null
  );
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<
    string | null
  >(null);
  const [offCampusAddress, setOffCampusAddress] = useState("");
  const [errors, setErrors] = useState<ErrorState>(initialErrors);

  // Custom hooks
  const { storeOptions, isLoadingStores, refetchStores } = useStores(stores);
  const {
    uploadedImage,
    imagePreview,
    imageError,
    fileInputRef,
    handleImageChange,
    handleRemoveImage,
  } = useImageUpload();
  const { isSubmitting, wasSubmitted, submitError, submitOrder } =
    useOrderSubmit();

  const showOffCampusAddress = selectedPickupLocation === "校外";

  // 重置表單
  const resetForm = () => {
    setCurrentStep(1);
    setSelectedServiceType(null);
    setSelectedStore(null);
    setMenuItems("");
    setPhoneNumber("");
    setSelectedPickupLocation(null);
    setOffCampusAddress("");
    handleRemoveImage();
    setErrors(initialErrors);
  };

  // Step 1: 服務類型選擇處理
  const handleServiceTypeChange = (keys: Selection) => {
    const key = Array.from(keys)[0];

    setSelectedServiceType(key ? String(key) : null);
    setErrors((prev) => ({ ...prev, serviceType: "" }));
  };

  const handleStep1Next = () => {
    const error = validateServiceType(selectedServiceType);

    if (error) {
      setErrors((prev) => ({ ...prev, serviceType: error }));

      return;
    }

    if (selectedServiceType === "rideshare") {
      // 共乘功能尚未開放,不進入下一步
      return;
    }

    setCurrentStep(2);
  };

  // Step 2: 店家選擇處理
  const handleStoreChange = (keys: Selection) => {
    const key = Array.from(keys)[0];

    setSelectedStore(key ? String(key) : null);
    setErrors((prev) => ({ ...prev, store: "" }));
  };

  const handleStep2Next = () => {
    const error = validateStore(selectedStore);

    if (error) {
      setErrors((prev) => ({ ...prev, store: error }));

      return;
    }

    setCurrentStep(3);
  };

  // Step 3: 訂單詳情處理
  const handlePickupLocationChange = (keys: Selection) => {
    const key = Array.from(keys)[0];
    const location = key ? String(key) : null;

    setSelectedPickupLocation(location);
    setErrors((prev) => ({ ...prev, pickupLocation: "" }));

    if (location !== "校外") {
      setOffCampusAddress("");
      setErrors((prev) => ({ ...prev, address: "" }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateOrderDetails(
      menuItems,
      phoneNumber,
      selectedPickupLocation,
      offCampusAddress,
      showOffCampusAddress
    );

    if (!validation.isValid) {
      setErrors(validation.errors);

      return;
    }

    const success = await submitOrder({
      selectedStore: selectedStore!,
      menuItems,
      phoneNumber,
      selectedPickupLocation: selectedPickupLocation!,
      offCampusAddress,
      uploadedImage,
      showOffCampusAddress,
    });

    if (success) {
      resetForm();
    }
  };

  // 渲染對應的 Step
  if (currentStep === 1) {
    return (
      <ServiceTypeStep
        error={errors.serviceType}
        selectedServiceType={selectedServiceType}
        onNext={handleStep1Next}
        onServiceTypeChange={handleServiceTypeChange}
      />
    );
  }

  if (currentStep === 2) {
    return (
      <StoreSelectionStep
        error={errors.store}
        isLoadingStores={isLoadingStores}
        selectedStore={selectedStore}
        storeOptions={storeOptions}
        onBack={() => setCurrentStep(1)}
        onNext={handleStep2Next}
        onRetry={refetchStores}
        onStoreChange={handleStoreChange}
      />
    );
  }

  return (
    <OrderDetailsStep
      errors={{ ...errors, image: imageError }}
      fileInputRef={fileInputRef}
      imagePreview={imagePreview}
      isSubmitting={isSubmitting}
      menuItems={menuItems}
      offCampusAddress={offCampusAddress}
      phoneNumber={phoneNumber}
      selectedPickupLocation={selectedPickupLocation}
      selectedStore={selectedStore}
      showOffCampusAddress={showOffCampusAddress}
      storeOptions={storeOptions}
      submitError={submitError}
      wasSubmitted={wasSubmitted}
      onBack={() => setCurrentStep(2)}
      onImageChange={handleImageChange}
      onMenuItemsChange={(value) => {
        setMenuItems(value);
        setErrors((prev) => ({ ...prev, menuItems: "" }));
      }}
      onOffCampusAddressChange={(value) => {
        setOffCampusAddress(value);
        setErrors((prev) => ({ ...prev, address: "" }));
      }}
      onPhoneNumberChange={(value) => {
        setPhoneNumber(value);
        setErrors((prev) => ({ ...prev, phone: "" }));
      }}
      onPickupLocationChange={handlePickupLocationChange}
      onRemoveImage={handleRemoveImage}
      onSubmit={handleSubmit}
    />
  );
}
