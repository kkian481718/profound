import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";

import { title, subtitle } from "@/components/primitives";
import { OrderForm } from "@/components/order-form";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title({ color: "violet" })}>食、衣、住、行&nbsp;</span>
        <br />
        <span className={title()}>從未如此簡單</span>
        <div className={subtitle({ class: "mt-4" })}>
          Profound | 花蓮志學外送平台
        </div>
      </div>

      <div className="mt-12 w-full flex justify-center px-4">
        <OrderForm />
      </div>
    </section>
  );
}
