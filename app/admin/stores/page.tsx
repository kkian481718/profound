"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
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
import StoreSettingsModal from "@/components/admin/stores/store-settings-modal";
import GlobalMaxOrdersSetting from "@/components/admin/stores/global-max-orders-setting";
import { TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { closeAllExpiredStores } from "@/lib/validateStore";

interface Store {
  id: string;
  name: string;
  is_open: boolean;
  order_deadline: string | null;
  max_daily_orders: number | null;
  menu_placeholder: string | null;
  extra_shipping_fee: number | null;
  extra_shipping_threshold: number | null;
  category: string | null;
  created_at: string;
}

const DEFAULT_CATEGORIES = ["速食", "甜點", "超市", "飲料", "其他"];

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [storeToDelete, setStoreToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [storeToConfigure, setStoreToConfigure] = useState<Store | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 新增店家的 Modal 狀態
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // 店家詳細設定的 Modal 狀態
  const {
    isOpen: isSettingsModalOpen,
    onOpen: onSettingsModalOpen,
    onOpenChange: onSettingsModalOpenChange,
  } = useDisclosure();

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

      const { error } = await supabase.from("stores").update(updateData).eq("id", storeId);

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

  const openSettingsModal = (store: Store) => {
    setStoreToConfigure(store);
    onSettingsModalOpen();
  };

  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;

    setIsDeleting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("stores").delete().eq("id", storeToDelete.id);

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

  // 收集所有動態分類（包含預設 5 類 + 使用者自訂分類）
  const availableCategories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);

    stores.forEach((s) => {
      if (s.category && s.category.trim()) {
        set.add(s.category.trim());
      }
    });

    return Array.from(set);
  }, [stores]);

  // 根據選擇的分類篩選店家
  const filteredStores = useMemo(() => {
    if (selectedCategory === "全部") return stores;

    return stores.filter((s) => (s.category?.trim() || "其他") === selectedCategory);
  }, [stores, selectedCategory]);

  // 格式化截止時間簡述
  const formatDeadlineSummary = (deadlineStr: string | null) => {
    if (!deadlineStr) return null;
    const date = new Date(deadlineStr);
    const now = new Date();
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    const timeStr = date.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    if (diffHours < 0) return `已過期 (${timeStr})`;
    if (diffHours < 1) return `即將截止 (${timeStr})`;
    if (diffHours < 24) return `${timeStr} 截止 (${diffHours}h)`;

    return `${date.getMonth() + 1}/${date.getDate()} ${timeStr} 截止`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
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
          <div className="h-28 w-full bg-default-100 rounded-xl animate-pulse" />
        </div>

        {/* 分類標籤載入 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-8 w-20 bg-default-200 rounded-full animate-pulse flex-shrink-0"
            />
          ))}
        </div>

        {/* 店家列表雙欄載入 */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border border-default-200">
              <CardHeader className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-9 bg-default-200 rounded-full animate-pulse" />
                  <div className="h-4 w-12 bg-default-200 rounded animate-pulse" />
                </div>
                <div className="h-5 w-24 bg-default-200 rounded animate-pulse" />
                <div className="h-4 w-14 bg-default-100 rounded animate-pulse" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題區 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">店家管理</h1>
          <p className="mt-1 text-xs sm:text-sm text-default-600">
            管理店家狀態、出貨時間與訂單限制
          </p>
        </div>
      </div>

      {/* 全域設定區 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-primary rounded-full" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">全域設定</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <GlobalMaxOrdersSetting onSuccess={fetchStores} />
        </div>
      </div>

      {/* 店家列表區 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-success rounded-full" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              店家列表
              <span className="ml-2 text-xs sm:text-sm font-normal text-default-500">
                ({filteredStores.length} / {stores.length} 家店)
              </span>
            </h2>
          </div>
          <Button
            color="success"
            size="sm"
            startContent={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* 新增店家按鈕 */}
        <Button
          className="w-full font-medium"
          color="success"
          size="md"
          startContent={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* 分類標籤導覽 (Tabs / Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <button
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === "全部"
                ? "bg-success text-white shadow-sm"
                : "bg-default-100 text-default-600 hover:bg-default-200"
            }`}
            type="button"
            onClick={() => setSelectedCategory("全部")}
          >
            <span>全部</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === "全部"
                  ? "bg-white/20 text-white"
                  : "bg-default-200 text-default-700"
              }`}
            >
              {stores.length}
            </span>
          </button>
          {availableCategories.map((cat) => {
            const count = stores.filter((s) => (s.category?.trim() || "其他") === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-success text-white shadow-sm"
                    : "bg-default-100 text-default-600 hover:bg-default-200"
                }`}
                type="button"
                onClick={() => setSelectedCategory(cat)}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-default-200 text-default-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredStores.length === 0 ? (
          <Card className="border-dashed border-2 border-default-200">
            <CardBody className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-default-100 p-3">
                  <svg
                    className="h-6 w-6 text-default-400"
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
                  <h3 className="text-base font-medium text-foreground">
                    {selectedCategory === "全部"
                      ? "還沒有任何店家"
                      : `「${selectedCategory}」分類尚無店家`}
                  </h3>
                  <p className="mt-1 text-xs text-default-500">
                    可以點擊上方按鈕新增店家，或切換其他分類
                  </p>
                </div>
                {selectedCategory !== "全部" && (
                  <Button
                    color="default"
                    size="sm"
                    variant="flat"
                    onPress={() => setSelectedCategory("全部")}
                  >
                    查看全部店家
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          /* 店家卡片列表：上下分層、店名不截斷、高度統一整齊 */
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStores.map((store) => {
              const deadlineSummary = formatDeadlineSummary(store.order_deadline);

              return (
                <Card
                  key={store.id}
                  className={`transition-all hover:shadow-md ${
                    store.is_open
                      ? "border-2 border-success shadow-success/10 bg-success-50/5 dark:bg-success-950/10"
                      : "border border-default-200"
                  }`}
                >
                  <CardHeader className="flex flex-col justify-between h-full p-2.5 sm:p-3 gap-2">
                    {/* 頂部：開關與狀態徽章 */}
                    <div className="flex items-center justify-between w-full">
                      <Switch
                        classNames={{
                          wrapper: "mr-0",
                        }}
                        color="success"
                        isSelected={store.is_open}
                        size="sm"
                        onValueChange={() => toggleStoreStatus(store.id, store.is_open)}
                      />
                      <Chip
                        className="h-4.5 px-1.5 text-[10px] font-semibold"
                        color={store.is_open ? "success" : "default"}
                        size="sm"
                        variant={store.is_open ? "solid" : "flat"}
                      >
                        {store.is_open ? "開放中" : "已關閉"}
                      </Chip>
                    </div>

                    {/* 中間：店家全名（獨佔整行、允許折行、絕不被截斷） */}
                    <div className="w-full my-0.5">
                      <h3
                        className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words line-clamp-2 min-h-[2rem] flex items-center"
                        title={store.name}
                      >
                        {store.name}
                      </h3>

                      {/* 開放中若有截止時間或單量，顯示簡短狀態 */}
                      {store.is_open && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-success-600 dark:text-success-400 font-medium truncate">
                          <svg
                            className="h-3 w-3 flex-shrink-0"
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
                          <span className="truncate">
                            {deadlineSummary ||
                              (store.max_daily_orders
                                ? `限 ${store.max_daily_orders} 單`
                                : "無時間限制")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 底部：分類標籤 + 設定/刪除按鈕 */}
                    <div className="flex items-center justify-between w-full pt-1.5 border-t border-default-100">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-default-100 text-default-600 font-medium">
                        {store.category || "其他"}
                      </span>

                      <div className="flex items-center gap-0.5">
                        <Button
                          isIconOnly
                          aria-label="店家設定"
                          className="h-6 w-6 min-w-6 text-default-500 hover:text-success"
                          size="sm"
                          variant="light"
                          onPress={() => openSettingsModal(store)}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                            />
                            <path
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                            />
                          </svg>
                        </Button>
                        <Button
                          isIconOnly
                          aria-label="刪除店家"
                          className="h-6 w-6 min-w-6 text-danger-400 hover:text-danger"
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => openDeleteModal(store.id, store.name)}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddStoreModal
        existingCategories={availableCategories}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onSuccess={fetchStores}
      />

      <StoreSettingsModal
        existingCategories={availableCategories}
        isOpen={isSettingsModalOpen}
        store={storeToConfigure}
        onOpenChange={onSettingsModalOpenChange}
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
                    <span className="font-semibold text-danger">{storeToDelete?.name}</span>
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
                        <p className="text-sm font-medium text-danger">刪除警告</p>
                        <p className="text-sm text-danger-700">
                          刪除店家後，所有相關訂單也會一併被刪除，此操作無法復原。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" isDisabled={isDeleting} variant="flat" onPress={onClose}>
                  取消
                </Button>
                <Button color="danger" isLoading={isDeleting} onPress={confirmDeleteStore}>
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
