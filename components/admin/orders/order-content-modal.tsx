"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Image } from "@heroui/image";
import { Divider } from "@heroui/divider";

import { Order } from "@/types";

interface OrderContentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export default function OrderContentModal({
  isOpen,
  onOpenChange,
  order,
}: OrderContentModalProps) {
  if (!order) return null;

  const hasContent = order.menu_items || order.menu_image_url;

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-lg font-bold">訂單內容</h3>
              <div className="text-sm text-default-500">
                {order.store_name} - {order.pickup_name}
              </div>
            </ModalHeader>
            <ModalBody>
              {!hasContent ? (
                <Card>
                  <CardBody className="py-8 text-center">
                    <p className="text-default-500">此訂單沒有餐點內容資訊</p>
                  </CardBody>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* 菜單圖片 */}
                  {order.menu_image_url && (
                    <Card>
                      <CardBody>
                        <h4 className="text-medium font-semibold mb-3">
                          菜單圖片
                        </h4>
                        <div className="flex justify-center">
                          <Image
                            alt="菜單圖片"
                            className="max-h-96 w-auto object-contain"
                            loading="lazy"
                            src={order.menu_image_url}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* 餐點內容 */}
                  {order.menu_items && (
                    <Card>
                      <CardBody>
                        <h4 className="text-medium font-semibold mb-3">
                          餐點內容
                        </h4>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {order.menu_items}
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* 訂單基本資訊 */}
                  <Card>
                    <CardBody>
                      <h4 className="text-medium font-semibold mb-3">
                        訂單資訊
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-default-600">訂單編號:</span>
                          <span className="font-mono text-xs">
                            {order.id.slice(-8)}
                          </span>
                        </div>
                        <Divider />
                        <div className="flex justify-between">
                          <span className="text-default-600">取貨密碼:</span>
                          <span className="font-mono font-bold">
                            {order.pickup_code}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-600">聯絡電話:</span>
                          <span>{order.pickup_phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-600">取貨地點:</span>
                          <span>{order.pickup_location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-600">取貨時間:</span>
                          <span>
                            {new Date(order.pickup_time).toLocaleString(
                              "zh-TW",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )}
                          </span>
                        </div>
                        <Divider />
                        <div className="flex justify-between">
                          <span className="text-default-600">成本:</span>
                          <span>${order.cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-default-600">運費:</span>
                          <span>${order.shipping_fee}</span>
                        </div>
                        {order.dev_fee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-default-600">網頁費:</span>
                            <span>${order.dev_fee}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-base border-t pt-2">
                          <span>總計:</span>
                          <span>${order.total_amount}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onClose}>
                關閉
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
