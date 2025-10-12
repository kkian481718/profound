"use client";

import type { Selection } from "@react-types/shared";

import {
  useMemo,
  useState,
  useEffect,
  type FormEvent,
  useRef,
  type ChangeEvent,
} from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Alert } from "@heroui/alert";
import { Select, SelectItem } from "@heroui/select";

import { createClient } from "@/lib/supabase/client";

const pickupLocations = [
  { label: "【校外】", value: "校外" },
  { label: "沁月", value: "沁月" },
  { label: "迎曦", value: "迎曦" },
  { label: "行雲", value: "行雲" },
  { label: "向晴", value: "向晴" },
  { label: "仰山", value: "仰山" },
  { label: "涵星", value: "涵星" },
  { label: "擷雲", value: "擷雲" },
] as const;

const serviceTypes = [
  { label: "訂購外送", value: "delivery" },
  { label: "預約共乘", value: "rideshare" },
] as const;

type StoreOption = {
  label: string;
  value: string;
};

type ErrorState = {
  serviceType: string;
  store: string;
  menuItems: string;
  phone: string;
  pickupLocation: string;
  address: string;
  image: string;
};

const initialErrors: ErrorState = {
  serviceType: "",
  store: "",
  menuItems: "",
  phone: "",
  pickupLocation: "",
  address: "",
  image: "",
};

export type OrderFormProps = {
  stores?: StoreOption[];
};

type Step = 1 | 2 | 3;

export function OrderForm({ stores }: OrderFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
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
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<ErrorState>(initialErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [storesFromDB, setStoresFromDB] = useState<StoreOption[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // 從 Supabase 載入開放接單的店家
  useEffect(() => {
    async function fetchStores() {
      try {
        setIsLoadingStores(true);
        setSubmitError(null);
        const { data, error } = await supabase
          .from("stores")
          .select("id, name")
          .eq("is_open", true)
          .order("name");

        if (error) throw error;

        if (data) {
          const formattedStores = data.map((store) => ({
            label: store.name,
            value: store.id,
          }));

          setStoresFromDB(formattedStores);
        }
      } catch (error) {
        // 載入失敗時不使用預設資料，而是提示重試
        // eslint-disable-next-line no-console
        console.error("載入店家資料失敗:", error);
        setStoresFromDB([]);
      } finally {
        setIsLoadingStores(false);
      }
    }

    fetchStores();
  }, [supabase]);

  // 店家選項優先使用從 DB 載入的資料
  const storeOptions = useMemo<StoreOption[]>(() => {
    if (stores?.length) {
      return stores;
    }

    return storesFromDB;
  }, [stores, storesFromDB]);

  const showOffCampusAddress = selectedPickupLocation === "校外";

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedServiceType(null);
    setSelectedStore(null);
    setMenuItems("");
    setPhoneNumber("");
    setSelectedPickupLocation(null);
    setOffCampusAddress("");
    setUploadedImage(null);
    setImagePreview(null);
    setErrors(initialErrors);
  };

  const handleServiceTypeChange = (keys: Selection) => {
    const key = Array.from(keys)[0];

    setSelectedServiceType(key ? String(key) : null);
    setErrors((prev) => ({ ...prev, serviceType: "" }));
  };

  const handleStoreChange = (keys: Selection) => {
    const key = Array.from(keys)[0];

    setSelectedStore(key ? String(key) : null);
    setErrors((prev) => ({ ...prev, store: "" }));
  };

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

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // 驗證檔案類型
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, image: "請上傳圖片檔案" }));

        return;
      }

      // 驗證檔案大小 (限制 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: "圖片檔案不能超過 5MB" }));

        return;
      }

      setUploadedImage(file);
      setErrors((prev) => ({ ...prev, image: "" }));

      // 產生預覽
      const reader = new FileReader();

      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateStep1 = () => {
    if (!selectedServiceType) {
      setErrors((prev) => ({ ...prev, serviceType: "請選擇服務類型" }));

      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!selectedStore) {
      setErrors((prev) => ({ ...prev, store: "請選擇店家" }));

      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    let hasError = false;
    const nextErrors: ErrorState = { ...initialErrors };

    if (!menuItems.trim()) {
      nextErrors.menuItems = "請輸入想點的餐點";
      hasError = true;
    }

    const normalizedPhone = phoneNumber.trim();

    if (!normalizedPhone) {
      nextErrors.phone = "請輸入手機號碼";
      hasError = true;
    } else if (!/^09\d{8}$/.test(normalizedPhone)) {
      nextErrors.phone = "請輸入有效的手機號碼 (例如：0912345678)";
      hasError = true;
    }

    if (!selectedPickupLocation) {
      nextErrors.pickupLocation = "請選擇取貨地點";
      hasError = true;
    }

    if (showOffCampusAddress) {
      if (!offCampusAddress.trim()) {
        nextErrors.address = "請填寫校外取貨地址";
        hasError = true;
      }
    }

    setErrors(nextErrors);

    return !hasError;
  };

  const handleStep1Next = () => {
    if (!validateStep1()) {
      return;
    }

    if (selectedServiceType === "rideshare") {
      // 共乘功能尚未開放，不進入下一步
      return;
    }

    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (!validateStep2()) {
      return;
    }

    setCurrentStep(3);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWasSubmitted(false);
    setSubmitError(null);

    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 生成四位數取貨密碼
      const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

      let menuImageUrl: string | null = null;

      // 如果有上傳圖片，先上傳到 Supabase Storage
      if (uploadedImage) {
        const fileExt = uploadedImage.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `order-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("orders")
          .upload(filePath, uploadedImage, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          // eslint-disable-next-line no-console
          console.warn("圖片上傳失敗:", uploadError);
        } else {
          // 取得公開 URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("orders").getPublicUrl(filePath);

          menuImageUrl = publicUrl;
        }
      }

      // 準備訂單資料
      // 預設取貨時間為下單後 8 小時
      const defaultPickupTime = new Date();

      defaultPickupTime.setHours(defaultPickupTime.getHours() + 8);

      const orderData = {
        store_id: selectedStore,
        order_type: "delivery",
        pickup_location: showOffCampusAddress
          ? offCampusAddress
          : selectedPickupLocation,
        pickup_name: "客戶", // 可以之後新增輸入欄位
        pickup_code: pickupCode,
        pickup_phone: phoneNumber,
        menu_items: menuItems,
        menu_image_url: menuImageUrl,
        cost: 0, // 需要之後計算或輸入
        shipping_fee: 0, // 需要之後計算或輸入
        total_amount: 0, // 需要之後計算
        payment_status: "pending",
        delivery_status: "pending",
        pickup_time: defaultPickupTime.toISOString(), // 預設 2 小時後取貨
      };

      // 儲存訂單到資料庫
      const { error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // 成功提交
      setWasSubmitted(true);

      // 顯示取貨密碼和查詢說明
      alert(
        `✅ 訂單已建立！\n\n` +
          `📋 訂單資訊：\n` +
          `取貨密碼：${pickupCode}\n` +
          `手機號碼：${phoneNumber}\n\n` +
          `💡 請妥善保管此資訊！\n` +
          `您可以使用「取貨密碼」和「手機號碼」\n` +
          `隨時查詢訂單狀態。\n\n` +
          `🔍 查詢訂單請前往：訂單查詢頁面\n` +
          `建議立即截圖保存！`
      );

      resetForm();
    } catch (error) {
      // 處理錯誤
      // eslint-disable-next-line no-console
      console.error("提交訂單失敗:", error);
      setSubmitError("提交訂單時發生錯誤，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: 選擇服務類型
  if (currentStep === 1) {
    return (
      <Card className="w-full max-w-2xl shadow-small p-3">
        <CardHeader className="flex flex-col items-start gap-1 pb-0">
          <h2 className="text-2xl font-semibold">Step 1. 選擇服務類型</h2>
          <p className="text-sm text-default-500">請選擇您需要的服務</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-6">
          <Select
            isRequired
            aria-label="服務類型"
            errorMessage={errors.serviceType || undefined}
            isInvalid={Boolean(errors.serviceType)}
            label="服務類型"
            placeholder="請選擇服務類型"
            selectedKeys={
              selectedServiceType ? new Set([selectedServiceType]) : new Set([])
            }
            onSelectionChange={handleServiceTypeChange}
          >
            {serviceTypes.map((service) => (
              <SelectItem key={service.value}>{service.label}</SelectItem>
            ))}
          </Select>

          {selectedServiceType === "rideshare" && (
            <Alert color="warning" title="正在趕工中..." variant="flat">
              共乘服務功能即將上線，敬請期待！
            </Alert>
          )}

          <div className="flex gap-3">
            {selectedServiceType === "rideshare" ? (
              <Button
                className="w-full md:w-auto"
                color="default"
                variant="flat"
                onPress={() => {
                  setSelectedServiceType(null);
                  setErrors((prev) => ({ ...prev, serviceType: "" }));
                }}
              >
                回上一步
              </Button>
            ) : (
              <Button
                className="w-full md:w-auto"
                color="primary"
                isDisabled={!selectedServiceType}
                onPress={handleStep1Next}
              >
                下一步
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  const handleRetryLoadStores = async () => {
    try {
      setIsLoadingStores(true);
      setSubmitError(null);
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .eq("is_open", true)
        .order("name");

      if (error) throw error;

      if (data) {
        const formattedStores = data.map((store) => ({
          label: store.name,
          value: store.id,
        }));

        setStoresFromDB(formattedStores);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("重新載入店家資料失敗:", error);
      setStoresFromDB([]);
    } finally {
      setIsLoadingStores(false);
    }
  };

  // Step 2: 選擇店家
  if (currentStep === 2) {
    return (
      <Card className="w-full max-w-2xl shadow-small p-3">
        <CardHeader className="flex flex-col items-start gap-1 pb-0">
          <h2 className="text-2xl font-semibold">Step 2. 選擇店家</h2>
          <p className="text-sm text-default-500">請選擇您想要訂購的店家</p>
        </CardHeader>
        <CardBody className="flex flex-col gap-6">
          {isLoadingStores ? (
            <Alert color="default" title="載入中..." variant="flat">
              正在載入店家資料...
            </Alert>
          ) : storeOptions.length === 0 ? (
            <div className="flex flex-col gap-4">
              <Alert color="danger" title="無法載入店家資料" variant="flat">
                無法連接到伺服器，請檢查網路連線或稍後再試。
              </Alert>
              <Button
                className="w-full md:w-auto"
                color="primary"
                variant="flat"
                onPress={handleRetryLoadStores}
              >
                重新載入
              </Button>
            </div>
          ) : (
            <Select
              isRequired
              aria-label="店家"
              errorMessage={errors.store || undefined}
              isInvalid={Boolean(errors.store)}
              label="店家"
              placeholder="請選擇店家"
              selectedKeys={
                selectedStore ? new Set([selectedStore]) : new Set([])
              }
              onSelectionChange={handleStoreChange}
            >
              {storeOptions.map((store) => (
                <SelectItem key={store.value}>{store.label}</SelectItem>
              ))}
            </Select>
          )}

          <div className="flex gap-3">
            <Button
              className="w-full md:w-auto"
              color="default"
              variant="flat"
              onPress={() => setCurrentStep(1)}
            >
              回上一步
            </Button>
            <Button
              className="w-full md:w-auto"
              color="primary"
              isDisabled={!selectedStore}
              onPress={handleStep2Next}
            >
              下一步
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Step 3: 填寫訂單資訊
  return (
    <Card className="w-full max-w-2xl shadow-small p-3">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <h2 className="text-2xl font-semibold">Step 3. 訂單資訊</h2>
        <p className="text-sm text-default-500">
          商品為貨到付款，請確保聯絡資訊正確。
        </p>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        {wasSubmitted ? (
          <Alert color="success" title="提交成功" variant="flat">
            我們已收到您的訂購需求，請留意後續通知。
          </Alert>
        ) : null}

        {submitError ? (
          <Alert color="danger" title="提交失敗" variant="flat">
            {submitError}
          </Alert>
        ) : null}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
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
            placeholder="例如：大麥克套餐 x2（去洋蔥）&#10;薯條大份 x1&#10;可樂中杯 x2"
            value={menuItems}
            onValueChange={(value) => {
              setMenuItems(value);
              setErrors((prev) => ({ ...prev, menuItems: "" }));
            }}
          />

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-default-700">
                菜單圖片（選填）
              </span>
              <p className="text-xs text-default-500">
                可上傳菜單截圖或照片，檔案大小限制 5MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              accept="image/*"
              aria-label="上傳菜單圖片"
              className="hidden"
              type="file"
              onChange={handleImageChange}
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
                  onPress={handleRemoveImage}
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
            {errors.image && (
              <p className="text-xs text-danger">{errors.image}</p>
            )}
          </div>

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
            onValueChange={(value) => {
              setPhoneNumber(value);
              setErrors((prev) => ({ ...prev, phone: "" }));
            }}
          />

          <Select
            isRequired
            aria-label="取貨地點"
            errorMessage={errors.pickupLocation || undefined}
            isInvalid={Boolean(errors.pickupLocation)}
            label="取貨地點"
            placeholder="請選擇取貨地點"
            selectedKeys={
              selectedPickupLocation
                ? new Set([selectedPickupLocation])
                : new Set([])
            }
            onSelectionChange={handlePickupLocationChange}
          >
            {pickupLocations.map((location) => (
              <SelectItem key={location.value}>{location.label}</SelectItem>
            ))}
          </Select>

          {showOffCampusAddress ? (
            <Input
              isRequired
              aria-label="校外地址"
              errorMessage={errors.address || undefined}
              isInvalid={Boolean(errors.address)}
              label="校外地址"
              placeholder="請輸入校外地址"
              value={offCampusAddress}
              onValueChange={(value) => {
                setOffCampusAddress(value);
                setErrors((prev) => ({ ...prev, address: "" }));
              }}
            />
          ) : null}

          <div className="flex gap-3">
            <Button
              className="w-full md:w-auto"
              color="default"
              variant="flat"
              onPress={() => setCurrentStep(2)}
            >
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
        </form>
      </CardBody>
    </Card>
  );
}
