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

import AddStoreModal from "@/components/stores/add-store-modal";
import DeadlineEditor from "@/components/stores/deadline-editor";
import DeliveryTimeEditor from "@/components/stores/delivery-time-editor";
import { createClient } from "@/lib/supabase/client";
import { closeAllExpiredStores } from "@/lib/validateStore";

interface Store {
  id: string;
  name: string;
  is_open: boolean;
  order_deadline: string | null;
  next_delivery_time: string | null;
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
      <div className="flex items-center justify-center py-12">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">店家管理</h1>
          <p className="mt-2 text-default-500">管理所有外送店家與接單狀態</p>
        </div>
        <Button color="primary" onPress={onOpen}>
          新增店家
        </Button>
      </div>

      {/* 全域下次出貨時間設定 */}
      <DeliveryTimeEditor onSuccess={fetchStores} />

      {/* 新增店家 Modal */}
      <AddStoreModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onSuccess={fetchStores}
      />

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
              </CardHeader>
              <CardBody className="flex flex-col gap-4 px-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm">接單狀態</span>
                  <Switch
                    isSelected={store.is_open}
                    onValueChange={() =>
                      toggleStoreStatus(store.id, store.is_open)
                    }
                  />
                </div>

                {store.is_open && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">截止時間</span>
                    <DeadlineEditor
                      currentDeadline={store.order_deadline}
                      storeId={store.id}
                      onSuccess={fetchStores}
                    />
                  </div>
                )}
              </CardBody>
              <CardFooter className="flex gap-2 px-6 pb-6">
                <Button
                  className="flex-1"
                  color="primary"
                  variant="flat"
                  onPress={() => router.push(`/admin/orders?store=${store.id}`)}
                >
                  查看訂單
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => openDeleteModal(store.id, store.name)}
                >
                  刪除
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 刪除確認 Modal */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={onDeleteModalOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                確認刪除店家
              </ModalHeader>
              <ModalBody>
                <p>
                  確定要刪除店家「
                  <span className="font-semibold">{storeToDelete?.name}</span>
                  」嗎？
                </p>
                <div className="mt-2 rounded-lg bg-danger-50 p-3">
                  <p className="text-sm text-danger">
                    ⚠️
                    警告：刪除店家後，所有相關訂單也會一併被刪除，此操作無法復原。
                  </p>
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
