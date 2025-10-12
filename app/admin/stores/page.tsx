"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";

import { createClient } from "@/lib/supabase/client";

interface Store {
  id: string;
  name: string;
  is_open: boolean;
  order_deadline: string | null;
  created_at: string;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch stores:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stores")
        .update({ is_open: !currentStatus })
        .eq("id", storeId);

      if (error) throw error;
      fetchStores();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to update store:", err);
    }
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const date = new Date(deadline);

    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">店家管理</h1>
          <p className="mt-2 text-default-500">管理所有外送店家與接單狀態</p>
        </div>
        <Button color="primary" onPress={() => router.push("/admin/add-store")}>
          新增店家
        </Button>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-default-500">尚無店家資料</p>
            <Button
              className="mt-4"
              color="primary"
              variant="flat"
              onPress={() => router.push("/admin/add-store")}
            >
              新增第一個店家
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id} className="w-full">
              <CardHeader className="flex-col items-start gap-2 px-6 pt-6">
                <div className="flex w-full items-center justify-between">
                  <h3 className="text-xl font-bold">{store.name}</h3>
                  <Chip
                    color={store.is_open ? "success" : "default"}
                    size="sm"
                    variant="flat"
                  >
                    {store.is_open ? "開放中" : "未開放"}
                  </Chip>
                </div>
                {store.order_deadline && store.is_open && (
                  <p className="text-xs text-default-500">
                    截止時間：{formatDeadline(store.order_deadline)}
                  </p>
                )}
              </CardHeader>
              <CardBody className="px-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm">接單狀態</span>
                  <Switch
                    isSelected={store.is_open}
                    onValueChange={() =>
                      toggleStoreStatus(store.id, store.is_open)
                    }
                  />
                </div>
              </CardBody>
              <CardFooter className="px-6 pb-6">
                <Button
                  className="w-full"
                  color="primary"
                  variant="flat"
                  onPress={() => router.push(`/admin/orders?store=${store.id}`)}
                >
                  查看訂單
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
