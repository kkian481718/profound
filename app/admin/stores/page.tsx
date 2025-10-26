"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";

import AddStoreModal from "@/components/admin/stores/add-store-modal";
import DeadlineEditor from "@/components/admin/stores/deadline-editor";
import DeliveryTimeEditor from "@/components/admin/stores/delivery-time-editor";
import GlobalMaxOrdersSetting from "@/components/admin/stores/global-max-orders-setting";
import StoreMaxOrdersEditor from "@/components/admin/stores/store-max-orders-editor";
import { createClient } from "@/lib/supabase/client";
import { closeAllExpiredStores } from "@/lib/validateStore";

interface Store {
  id: string;
  name: string;
  is_open: boolean;
  order_deadline: string | null;
  next_delivery_time: string | null;
  max_daily_orders: number | null;
  created_at: string;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeToDelete, setStoreToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // 新增店家的 Modal 狀態
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // 刪除確認的 Modal 狀態
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onOpenChange: onDeleteModalOpenChange,
  } = useDisclosure();

  useEffect(() => {
    // 頁面載入時檢查一次過期店家並載入資料
    const initializePage = async () => {
      await checkAndCloseExpiredStores();
      await fetchStores();
    };

    initializePage();
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

  const checkAndCloseExpiredStores = async () => {
    try {
      await closeAllExpiredStores();
      fetchStores();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to check expired stores:", err);
    }
  };

  const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      // 如果是關閉轉開啟,清除截止時間
      const updateData: { is_open: boolean; order_deadline?: null } = {
        is_open: !currentStatus,
      };

      if (!currentStatus) {
        // 重新開啟時清除截止時間
        updateData.order_deadline = null;
      }

      const { error } = await supabase
        .from("stores")
        .update(updateData)
        .eq("id", storeId);

      if (error) throw error;
      fetchStores();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to update store:", err);
    }
  };

  const openDeleteModal = (storeId: string, storeName: string) => {
    setStoreToDelete({ id: storeId, name: storeName });
    onDeleteModalOpen();
  };

  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;

    setIsDeleting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", storeToDelete.id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete store:", error);
        alert(`刪除失敗：${error.message}\n\n請確認您有足夠的權限來刪除店家。`);
        throw error;
      }

      // 刪除成功後重新載入店家列表
      await fetchStores();
      onDeleteModalOpenChange();
      setStoreToDelete(null);
      alert(`店家「${storeToDelete.name}」已成功刪除`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete store:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* 標題區載入 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-default-200 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-default-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-default-200 rounded-lg animate-pulse" />
        </div>

        {/* 全域設定區載入 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-primary rounded-full" />
            <div className="h-6 w-20 bg-default-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-l-4 border-l-primary">
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-primary-100 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-5 w-24 bg-default-200 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-default-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-16 w-full bg-default-100 rounded-lg animate-pulse" />
                <div className="h-2 w-full bg-default-200 rounded-full animate-pulse" />
                <div className="h-10 w-full bg-default-200 rounded-lg animate-pulse" />
              </CardBody>
            </Card>
            <Card className="border-l-4 border-l-primary">
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-primary-100 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-5 w-28 bg-default-200 rounded animate-pulse" />
                    <div className="h-3 w-40 bg-default-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-12 w-full bg-default-100 rounded-lg animate-pulse" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-default-200 rounded animate-pulse" />
                  <div className="h-8 bg-default-200 rounded animate-pulse" />
                </div>
                <div className="h-12 w-full bg-default-200 rounded-lg animate-pulse" />
              </CardBody>
            </Card>
          </div>
        </div>

        {/* 店家列表區載入 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-success rounded-full" />
              <div className="h-6 w-32 bg-default-200 rounded animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-default-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-l-4 border-l-default-300">
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <div className="space-y-2">
                    <div className="h-5 w-24 bg-default-200 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-default-100 rounded animate-pulse" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-6 w-16 bg-default-200 rounded-full animate-pulse" />
                    <div className="h-6 w-12 bg-default-200 rounded-full animate-pulse" />
                  </div>
                </CardHeader>
                <CardBody className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-default-200 rounded animate-pulse" />
                    <div className="h-12 w-full bg-default-100 rounded-lg animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-default-200 rounded animate-pulse" />
                    <div className="h-8 w-full bg-default-100 rounded animate-pulse" />
                  </div>
                </CardBody>
                <CardFooter className="gap-2 pt-4">
                  <div className="flex-1 h-8 bg-default-200 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-default-200 rounded animate-pulse" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 頁面標題區 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">店家管理</h1>
          <p className="mt-1 text-sm text-default-600">
            管理店家狀態、出貨時間與訂單限制
          </p>
        </div>
      </div>

      {/* 全域設定區 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-primary rounded-full" />
          <h2 className="text-xl font-semibold text-foreground">全域設定</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GlobalMaxOrdersSetting onSuccess={fetchStores} />
          <DeliveryTimeEditor onSuccess={fetchStores} />
        </div>
      </div>

      {/* 店家列表區 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-success rounded-full" />
            <h2 className="text-xl font-semibold text-foreground">
              店家列表
              <span className="ml-2 text-sm font-normal text-default-500">
                ({stores.length} 家店)
              </span>
            </h2>
          </div>
          <Button
            color="success"
            size="sm"
            startContent={
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            }
            variant="light"
            onPress={checkAndCloseExpiredStores}
          >
            檢查過期店家
          </Button>
        </div>

        {stores.length === 0 ? (
          <Card className="border-dashed border-2 border-default-200">
            <CardBody className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-default-100 p-4">
                  <svg
                    className="h-8 w-8 text-default-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">
                    還沒有店家
                  </h3>
                  <p className="mt-1 text-sm text-default-500">
                    開始新增第一家店
                  </p>
                </div>
                <Button color="success" size="lg" onPress={onOpen}>
                  立即新增店家
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            <Button
              className="w-full"
              color="success"
              size="lg"
              startContent={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 4v16m8-8H4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              }
              onPress={onOpen}
            >
              新增店家
            </Button>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stores.map((store) => (
                <Card
                  key={store.id}
                  className={`transition-all hover:shadow-lg ${
                    store.is_open
                      ? "border-l-4 border-l-success shadow-success/10"
                      : "border-l-4 border-l-default-300"
                  }`}
                >
                  <CardHeader className="flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        color="success"
                        classNames={{
                          wrapper: "mr-0",
                        }}
                        isSelected={store.is_open}
                        size="sm"
                        onValueChange={() =>
                          toggleStoreStatus(store.id, store.is_open)
                        }
                      />
                      <h3 className="text-lg font-bold text-foreground">
                        {store.name}
                      </h3>
                    </div>
                    <Chip
                      className="font-medium"
                      color={store.is_open ? "success" : "default"}
                      size="sm"
                      variant="dot"
                    >
                      {store.is_open ? "開放中" : "已關閉"}
                    </Chip>
                  </CardHeader>

                  <CardBody className="space-y-4 pt-0">
                    {store.is_open && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <svg
                              className="h-4 w-4 text-warning"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                            </svg>
                            <span className="font-medium text-foreground">
                              截止時間
                            </span>
                          </div>
                          <DeadlineEditor
                            currentDeadline={store.order_deadline}
                            storeId={store.id}
                            onSuccess={fetchStores}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <svg
                              className="h-4 w-4 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                              />
                            </svg>
                            <span className="font-medium text-foreground">
                              單量限制
                            </span>
                          </div>
                          <StoreMaxOrdersEditor
                            currentMaxOrders={store.max_daily_orders}
                            storeId={store.id}
                            onSuccess={fetchStores}
                          />
                        </div>
                      </>
                    )}
                  </CardBody>

                  <CardFooter className="gap-2 pt-4">
                    <Button
                      className="flex-1"
                      color="success"
                      size="sm"
                      startContent={
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                          />
                        </svg>
                      }
                      variant="flat"
                      onPress={() =>
                        router.push(`/admin/orders?store=${store.id}`)
                      }
                    >
                      查看訂單
                    </Button>
                    <Button
                      isIconOnly
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={() => openDeleteModal(store.id, store.name)}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddStoreModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onSuccess={fetchStores}
      />

      <Modal isOpen={isDeleteModalOpen} onOpenChange={onDeleteModalOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-danger-100 p-2">
                    <svg
                      className="h-5 w-5 text-danger"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">確認刪除店家</h3>
                    <p className="text-sm text-default-500">此操作無法復原</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <p className="text-foreground">
                    確定要刪除店家「
                    <span className="font-semibold text-danger">
                      {storeToDelete?.name}
                    </span>
                    」嗎？
                  </p>
                  <div className="rounded-lg bg-danger-50 border border-danger-200 p-4">
                    <div className="flex gap-3">
                      <svg
                        className="h-5 w-5 text-danger flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-danger">
                          刪除警告
                        </p>
                        <p className="text-sm text-danger-700">
                          刪除店家後，所有相關訂單也會一併被刪除，此操作無法復原。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  isDisabled={isDeleting}
                  variant="flat"
                  onPress={onClose}
                >
                  取消
                </Button>
                <Button
                  color="danger"
                  isLoading={isDeleting}
                  onPress={confirmDeleteStore}
                >
                  確認刪除
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
