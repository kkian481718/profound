import type { Selection } from "@react-types/shared";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";

import { serviceTypes } from "./constants";

type ServiceTypeStepProps = {
  selectedServiceType: string | null;
  error: string;
  onServiceTypeChange: (keys: Selection) => void;
  onNext: () => void;
};

export function ServiceTypeStep({
  selectedServiceType,
  error,
  onServiceTypeChange,
  onNext,
}: ServiceTypeStepProps) {
  return (
    <Card className="w-full max-w-2xl shadow-small p-3">
      <CardHeader className="flex flex-col items-start gap-1 pb-0">
        <h2 className="text-2xl font-semibold">Step 1. 選擇服務類型</h2>
        <p className="text-sm text-default-500">請選擇您需要的服務</p>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            {serviceTypes.map((service) => (
              <Button
                key={service.value}
                className="flex-1"
                color={
                  selectedServiceType === service.value ? "primary" : "default"
                }
                variant={
                  selectedServiceType === service.value ? "solid" : "bordered"
                }
                onPress={() => onServiceTypeChange(new Set([service.value]))}
              >
                {service.label}
              </Button>
            ))}
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        {selectedServiceType === "rideshare" && (
          <Alert color="warning" title="正在趕工中..." variant="flat">
            共乘服務功能即將上線,敬請期待！
          </Alert>
        )}

        <div className="flex gap-3">
          {selectedServiceType === "rideshare" ? (
            <Button
              className="w-full md:w-auto"
              color="default"
              variant="flat"
              onPress={() => onServiceTypeChange(new Set([]))}
            >
              回上一步
            </Button>
          ) : (
            <Button
              className="w-full md:w-auto"
              color="primary"
              isDisabled={!selectedServiceType}
              onPress={onNext}
            >
              下一步
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
