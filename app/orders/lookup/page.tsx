import { Button } from "@heroui/button";

import { OrderLookup } from "@/components/order-lookup";

export default function OrderLookupPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="mt-12 w-full flex justify-center px-4">
        <OrderLookup />
      </div>

      <div className="mt-4">
        <Button as="a" color="primary" href="/" variant="bordered">
          ← 返回首頁
        </Button>
      </div>
    </section>
  );
}
