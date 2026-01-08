import type { Selection } from "@react-types/shared";
import type { FormEvent, ChangeEvent } from "react";
import type { ErrorState, StoreOption } from "./types";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Alert } from "@heroui/alert";
import { Select, SelectItem } from "@heroui/select";

import { pickupLocations } from "./constants";
import { calculateOrderPricing } from "./utils/pricing";

type OrderDetailsStepProps = {
  storeOptions: StoreOption[];
  selectedStore: string | null;
  menuItems: string;
  cost: string;
  phoneNumber: string;
  pickupName: string;
  selectedPickupLocation: string | null;
  offCampusAddress: string;
  imagePreview: string | null;
  errors: ErrorState;
  isSubmitting: boolean;
  wasSubmitted: boolean;
  submitError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  showOffCampusAddress: boolean;
  onMenuItemsChange: (value: string) => void;
  onCostChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onPickupNameChange: (value: string) => void;
  onPickupLocationChange: (keys: Selection) => void;
  onOffCampusAddressChange: (value: string) => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function OrderDetailsStep({
  storeOptions,
  selectedStore,
  menuItems,
  cost,
  phoneNumber,
  pickupName,
  selectedPickupLocation,
  offCampusAddress,
  imagePreview,
  errors,
  isSubmitting,
  wasSubmitted,
  submitError,
  fileInputRef,
  showOffCampusAddress,
  onMenuItemsChange,
  onCostChange,
  onPhoneNumberChange,
  onPickupNameChange,
  onPickupLocationChange,
  onOffCampusAddressChange,
  onImageChange,
  onRemoveImage,
  onBack,
  onSubmit,
}: OrderDetailsStepProps) {
  // 取得選中店家的資料
  const selectedStoreData = storeOptions.find((s) => s.value === selectedStore);

  // 取得店家運費設定
  const storeShippingConfig = selectedStoreData
    ? {
        extraShippingFee: selectedStoreData.extra_shipping_fee,
        extraShippingThreshold: selectedStoreData.extra_shipping_threshold,
      }
    : undefined;

  // 使用統一的價格計算函數（包含店家額外運費設定）
  const costNum = parseFloat(cost) || 0;
  const pricing = calculateOrderPricing(costNum, storeShippingConfig);

  // 取得選中店家的自訂 placeholder
  const menuPlaceholder =
    selectedStoreData?.menu_placeholder ||
    "例如：大麥克套餐 x2（去洋蔥）\n薯條大份 x1\n可樂中杯 x2";

  // 檢查店家是否有額外運費設定
  const hasExtraShippingFee =
    selectedStoreData?.extra_shipping_fee && selectedStoreData.extra_shipping_fee > 0;

  return (
    <Card className="w-full max-w-2xl shadow-small p-3">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <h2 className="text-2xl font-semibold">Step 2. 訂單資訊</h2>
        <p className="text-sm text-default-500">商品為貨到付款，請確保聯絡資訊正確。</p>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-default-600">
              <span className="font-medium">店家：</span>
              {storeOptions.find((s) => s.value === selectedStore)?.label}
            </p>
          </div>

          <Textarea
            isRequired
            aria-label="點餐內容"
            description="請詳細描述您想點的餐點、數量及備註"
            errorMessage={errors.menuItems || undefined}
            isInvalid={Boolean(errors.menuItems)}
            label="點餐內容"
            minRows={4}
            placeholder={menuPlaceholder}
            value={menuItems}
            onValueChange={onMenuItemsChange}
          />

          <div className="space-y-2">
            <Input
              isRequired
              aria-label="餐點原始金額"
              description="請輸入餐點原本的金額，我們會幫您計算運費"
              errorMessage={errors.cost || undefined}
              isInvalid={Boolean(errors.cost)}
              label="餐點金額"
              placeholder="0"
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">NT$</span>
                </div>
              }
              type="number"
              value={cost}
              onValueChange={onCostChange}
            />
            {costNum > 0 && (
              <div className="text-sm text-default-600 space-y-1 px-1">
                <div className="flex justify-between">
                  <span>餐點金額：</span>
                  <span className="font-medium">NT$ {pricing.cost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>基本服務費：</span>
                  <span className="font-medium">
                    NT$ {(pricing.devFee + pricing.baseShippingFee).toFixed(0)}
                  </span>
                </div>
                {hasExtraShippingFee && (
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      遠距運費：
                      {pricing.extraShippingFee === 0 && (
                        <span className="text-xs text-success">（已達免運門檻）</span>
                      )}
                    </span>
                    <span
                      className={`font-medium ${pricing.extraShippingFee === 0 ? "line-through text-default-400" : "text-warning"}`}
                    >
                      NT$ {selectedStoreData?.extra_shipping_fee?.toFixed(0) || 0}
                    </span>
                  </div>
                )}
                {hasExtraShippingFee &&
                  selectedStoreData?.extra_shipping_threshold &&
                  pricing.extraShippingFee > 0 && (
                    <div className="text-xs text-warning px-1">
                      ⚠ 訂單滿 NT$ {selectedStoreData.extra_shipping_threshold.toFixed(0)}{" "}
                      可免遠距運費
                    </div>
                  )}
                <div className="flex justify-between border-t border-default-200 pt-1 font-semibold text-primary">
                  <span>總金額：</span>
                  <span>NT$ {pricing.totalAmount.toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-default-700">圖片（選填）</span>
              <p className="text-xs text-default-500">若有先訂購可上傳截圖，檔案大小限制 5MB</p>
            </div>
            <input
              ref={fileInputRef}
              accept="image/*"
              aria-label="上傳圖片"
              className="hidden"
              type="file"
              onChange={onImageChange}
            />
            {imagePreview ? (
              <div className="flex flex-col gap-2">
                <div className="relative w-full max-w-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="菜單預覽"
                    className="w-full h-auto rounded-lg border-2 border-default-200"
                    src={imagePreview}
                  />
                </div>
                <Button
                  className="w-full md:w-auto"
                  color="danger"
                  size="sm"
                  variant="flat"
                  onPress={onRemoveImage}
                >
                  移除圖片
                </Button>
              </div>
            ) : (
              <Button
                className="w-full md:w-auto"
                color="default"
                variant="flat"
                onPress={() => fileInputRef.current?.click()}
              >
                上傳菜單圖片
              </Button>
            )}
            {errors.image && <p className="text-xs text-danger">{errors.image}</p>}
          </div>

          <Input
            isRequired
            aria-label="LINE社群暱稱"
            description="請輸入您在LINE社群的暱稱"
            errorMessage={errors.pickupName || undefined}
            isInvalid={Boolean(errors.pickupName)}
            label="LINE社群暱稱"
            maxLength={20}
            placeholder="請輸入您在LINE社群的暱稱"
            type="text"
            value={pickupName}
            onValueChange={onPickupNameChange}
          />

          <Input
            isRequired
            aria-label="手機號碼"
            description="請輸入 10 碼手機號碼"
            errorMessage={errors.phone || undefined}
            isInvalid={Boolean(errors.phone)}
            label="手機號碼"
            maxLength={10}
            placeholder="請輸入手機號碼"
            type="tel"
            value={phoneNumber}
            onValueChange={onPhoneNumberChange}
          />

          <Select
            isRequired
            aria-label="取貨地點"
            errorMessage={errors.pickupLocation || undefined}
            isInvalid={Boolean(errors.pickupLocation)}
            label="取貨地點"
            placeholder="請選擇取貨地點"
            selectedKeys={selectedPickupLocation ? new Set([selectedPickupLocation]) : new Set([])}
            onSelectionChange={onPickupLocationChange}
          >
            {pickupLocations.map((location) => (
              <SelectItem key={location.value}>{location.label}</SelectItem>
            ))}
          </Select>

          {showOffCampusAddress ? (
            <Input
              isRequired
              aria-label={selectedPickupLocation === "校外" ? "校外地址" : "教學區地址"}
              errorMessage={errors.address || undefined}
              isInvalid={Boolean(errors.address)}
              label={selectedPickupLocation === "校外" ? "校外地址" : "教學區地址"}
              placeholder={
                selectedPickupLocation === "校外" ? "請輸入校外地址" : "請輸入教學區地址"
              }
              value={offCampusAddress}
              onValueChange={onOffCampusAddressChange}
            />
          ) : null}

          <div className="flex gap-3">
            <Button className="w-full md:w-auto" color="default" variant="flat" onPress={onBack}>
              回上一步
            </Button>
            <Button
              className="w-full md:w-auto"
              color="primary"
              isLoading={isSubmitting}
              type="submit"
            >
              送出訂單
            </Button>
          </div>

          {wasSubmitted ? (
            <Alert color="success" title="提交成功" variant="flat">
              我們已收到您的訂購需求,請留意後續通知。
            </Alert>
          ) : null}

          {submitError ? (
            <Alert color="danger" title="提交失敗" variant="flat">
              {submitError}
            </Alert>
          ) : null}
        </form>
      </CardBody>
    </Card>
  );
}
