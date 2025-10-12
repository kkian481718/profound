"use client";

import type { Selection } from "@react-types/shared";

import { useMemo, useState, type FormEvent } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Alert } from "@heroui/alert";
import { Select, SelectItem } from "@heroui/select";

const pickupLocations = [
  { label: "校外", value: "校外" },
  { label: "沁月", value: "沁月" },
  { label: "迎曦", value: "迎曦" },
  { label: "行雲", value: "行雲" },
  { label: "向晴", value: "向晴" },
  { label: "仰山", value: "仰山" },
  { label: "涵星", value: "涵星" },
  { label: "擷雲", value: "擷雲" },
] as const;

type ProductOption = {
  label: string;
  value: string;
};

type ErrorState = {
  product: string;
  phone: string;
  pickupLocation: string;
  address: string;
};

const initialErrors: ErrorState = {
  product: "",
  phone: "",
  pickupLocation: "",
  address: "",
};

export type OrderFormProps = {
  products?: ProductOption[];
};

export function OrderForm({ products }: OrderFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<
    string | null
  >(null);
  const [offCampusAddress, setOffCampusAddress] = useState("");
  const [errors, setErrors] = useState<ErrorState>(initialErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);

  // TODO: 從資料庫抓商家有開放下單的店家
  const productOptions = useMemo<ProductOption[]>(() => {
    if (products?.length) {
      return products;
    }

    return [
      { label: "商品 A", value: "product-a" },
      { label: "商品 B", value: "product-b" },
      { label: "商品 C", value: "product-c" },
    ];
  }, [products]);

  const showOffCampusAddress = selectedPickupLocation === "校外";

  const resetForm = () => {
    setSelectedProduct(null);
    setPhoneNumber("");
    setSelectedPickupLocation(null);
    setOffCampusAddress("");
    setErrors(initialErrors);
  };

  const handleProductChange = (keys: Selection) => {
    const key = Array.from(keys)[0];

    setSelectedProduct(key ? String(key) : null);
    setErrors((prev) => ({ ...prev, product: "" }));
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

  const validate = () => {
    let hasError = false;
    const nextErrors: ErrorState = { ...initialErrors };

    if (!selectedProduct) {
      nextErrors.product = "請選擇購買的商品";
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWasSubmitted(false);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    // TODO: Replace this with actual submit logic (e.g., API call)
    setTimeout(() => {
      setIsSubmitting(false);
      setWasSubmitted(true);
      resetForm();
    }, 600);
  };

  return (
    <Card className="w-full max-w-2xl shadow-small p-3">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <h2 className="text-2xl font-semibold">Step 2. 代購資訊</h2>
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

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <Select
            isRequired
            aria-label="購買商品"
            errorMessage={errors.product || undefined}
            isInvalid={Boolean(errors.product)}
            label="購買商品"
            placeholder="請選擇商品"
            selectedKeys={
              selectedProduct ? new Set([selectedProduct]) : new Set([])
            }
            onSelectionChange={handleProductChange}
          >
            {productOptions.map((product) => (
              <SelectItem key={product.value}>{product.label}</SelectItem>
            ))}
          </Select>

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

          <div className="flex flex-col gap-3">
            <Button
              className="w-full md:w-auto"
              color="primary"
              isLoading={isSubmitting}
              type="submit"
            >
              送出
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
