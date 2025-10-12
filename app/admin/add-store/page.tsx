"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";

import { createClient } from "@/lib/supabase/client";

export default function AddStorePage() {
  const [storeName, setStoreName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: insertError } = await supabase.from("stores").insert([
        {
          name: storeName,
          is_open: isOpen,
          order_deadline: isOpen && deadline ? new Date(deadline) : null,
        },
      ]);

      if (insertError) throw insertError;

      router.push("/admin/stores");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "新增店家失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">新增外送店家</h1>
          <p className="text-sm text-default-500">填寫店家資訊以新增到系統</p>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <Input
              isRequired
              label="店家名稱"
              placeholder="輸入店家名稱"
              value={storeName}
              onValueChange={setStoreName}
            />

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">是否開放接單</p>
                <p className="text-xs text-default-500">
                  開啟後客戶可以向此店家下訂
                </p>
              </div>
              <Switch isSelected={isOpen} onValueChange={setIsOpen} />
            </div>

            {isOpen && (
              <Input
                label="最後下單時間（選填）"
                placeholder="選擇日期和時間"
                type="datetime-local"
                value={deadline}
                onValueChange={setDeadline}
              />
            )}

            {error && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                color="default"
                variant="flat"
                onPress={() => router.back()}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                color="primary"
                isLoading={loading}
                type="submit"
              >
                新增店家
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
