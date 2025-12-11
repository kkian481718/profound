import { FAQ } from "@/components/faq";
import { title } from "@/components/primitives";

export default function FAQPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center mb-8">
        <span className={title({ color: "violet" })}>常見問題</span>
        <div className="mt-4 text-gray-600">關於 Profound 訂餐服務的詳細說明</div>
      </div>

      <div className="w-full">
        <FAQ />
      </div>
    </section>
  );
}
