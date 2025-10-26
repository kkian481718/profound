"use client";

import type { Selection } from "@react-types/shared";
import type { ErrorState, OrderFormProps, Step } from "./types";

import { useState, type FormEvent } from "react";

import { initialErrors } from "./constants";
import { useStores } from "./hooks/useStores";
import { useImageUpload } from "./hooks/useImageUpload";
import { useOrderSubmit } from "./hooks/useOrderSubmit";
import { validateStore, validateOrderDetails } from "./utils/validation";
import { StoreSelectionStep } from "./StoreSelectionStep";
import { OrderDetailsStep } from "./OrderDetailsStep";

export function OrderForm({ stores }: OrderFormProps) {
  // Step 管理 - 直接從店家選擇開始
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // 表單資料 - 服務類型固定為外送
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState("");
  const [cost, setCost] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pickupName, setPickupName] = useState("");
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

  const showOffCampusAddress =
    selectedPickupLocation === "校外" ||
    selectedPickupLocation === "校內教學區";

  // 重置表單
  const resetForm = () => {
    setCurrentStep(1);
    setSelectedStore(null);
    setMenuItems("");
    setCost("");
    setPhoneNumber("");
    setPickupName("");
    setSelectedPickupLocation(null);
    setOffCampusAddress("");
    handleRemoveImage();
    setErrors(initialErrors);
  };

  // Step 1: 店家選擇處理（原本的 Step 2）
  const handleStoreChange = (keys: Selection) => {
    const key = Array.from(keys)[0];

    setSelectedStore(key ? String(key) : null);
    setErrors((prev) => ({ ...prev, store: "" }));
  };

  const handleStep1Next = () => {
    const error = validateStore(selectedStore);

    if (error) {
      setErrors((prev) => ({ ...prev, store: error }));

      return;
    }

    setCurrentStep(2);
  };

  // Step 2: 訂單詳情處理（原本的 Step 3）
  const handlePickupLocationChange = (keys: Selection) => {
    const key = Array.from(keys)[0];
    const location = key ? String(key) : null;

    setSelectedPickupLocation(location);
    setErrors((prev) => ({ ...prev, pickupLocation: "" }));

    if (location !== "校外" && location !== "校內教學區") {
      setOffCampusAddress("");
      setErrors((prev) => ({ ...prev, address: "" }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 驗證表單資料
    const validation = validateOrderDetails(
      menuItems,
      cost,
      phoneNumber,
      pickupName,
      selectedPickupLocation,
      offCampusAddress,
      showOffCampusAddress,
    );

    if (!validation.isValid) {
      setErrors(validation.errors);

      return;
    }

    const success = await submitOrder({
      selectedStore: selectedStore!,
      menuItems,
      cost,
      phoneNumber,
      pickupName,
      selectedPickupLocation: selectedPickupLocation!,
      offCampusAddress,
      uploadedImage,
      showOffCampusAddress,
    });

    if (success) {
      resetForm();
    }
  };

  // 渲染對應的 Step - 移除服務類型選擇，直接從店家選擇開始
  if (currentStep === 1) {
    return (
      <StoreSelectionStep
        error={errors.store}
        isLoadingStores={isLoadingStores}
        selectedStore={selectedStore}
        showBackButton={false} // 第一步，不顯示返回按鈕
        storeOptions={storeOptions}
        onBack={() => {}}
        onGlobalLimitError={(reason) => {
          setErrors((prev) => ({ ...prev, store: reason }));
        }}
        onNext={handleStep1Next}
        onRetry={refetchStores}
        onStoreChange={handleStoreChange}
      />
    );
  }

  return (
    <OrderDetailsStep
      cost={cost}
      errors={{ ...errors, image: imageError }}
      fileInputRef={fileInputRef}
      imagePreview={imagePreview}
      isSubmitting={isSubmitting}
      menuItems={menuItems}
      offCampusAddress={offCampusAddress}
      phoneNumber={phoneNumber}
      pickupName={pickupName}
      selectedPickupLocation={selectedPickupLocation}
      selectedStore={selectedStore}
      showOffCampusAddress={showOffCampusAddress}
      storeOptions={storeOptions}
      submitError={submitError}
      wasSubmitted={wasSubmitted}
      onBack={() => setCurrentStep(1)}
      onCostChange={(value) => {
        setCost(value);
        setErrors((prev) => ({ ...prev, cost: "" }));
      }}
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
      onPickupNameChange={(value) => {
        setPickupName(value);
        setErrors((prev) => ({ ...prev, pickupName: "" }));
      }}
      onRemoveImage={handleRemoveImage}
      onSubmit={handleSubmit}
    />
  );
}
