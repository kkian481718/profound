"use client";

import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";

const FAQ_DATA = [
  {
    category: "關於訂單",
    items: [
      {
        question: "什麼是「訂單密碼」？",
        answer:
          "訂單成立後，系統會自動生成一組 4 位數字的密碼，這組密碼可以用來查詢您的訂單狀態。",
      },
      {
        question: "我想訂肯德基的優惠碼餐點，訂單內容要輸入甚麼？",
        answer: "在「點餐內容」直接輸入優惠碼即可。",
      },
    ],
  },
  {
    category: "關於外送費用與規範",
    items: [
      {
        question: "外送費用如何計算？",
        answer: (
          <div className="space-y-2">
            <p>我們的收費包含兩部分：</p>
            <div className="pl-4 space-y-1">
              <p>
                <strong>1. 基礎網頁費：</strong> 10 元。
              </p>
              <p>
                <strong>2. 外送服務費：</strong>
              </p>
              <div className="pl-4 space-y-1">
                <p>• 餐點金額未滿 150 元：加收 20 元。</p>
                <p>• 餐點金額 150 元 (含) 以上：加收餐點金額的 12%。</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 italic">
              （我們的初衷是補貼一點油錢，讓大家不方便或懶得出門時，也能享用到市區的餐點。）
            </p>
          </div>
        ),
      },
      {
        question: "如果我沒有準時取餐會怎麼樣？",
        answer: (
          <div className="space-y-2">
            <p>
              為了維護其他顧客的餐點品質並避免送餐延誤，請務必在收到通知後準時取餐。
            </p>
            <div className="bg-red-50 border-l-4 border-red-400 p-3 my-3">
              <p className="font-semibold text-red-800">重要提醒：</p>
              <p className="text-red-700">
                如果發生送達指定地點、發出通知後，卻長時間無人取餐且未回覆訊息的狀況，我們將會
                <strong>額外加收 20 元</strong>
                的費用。因為這會造成我們額外的油耗與時間成本（例如需要先派送其他訂單再折返）。
              </p>
            </div>
          </div>
        ),
      },
      {
        question: "我要如何確保能收到送餐通知？",
        answer: (
          <div className="space-y-2">
            <div className="space-y-1">
              <p>1. 請務必開啟您的 LINE 通知。</p>
              <p>
                2. 如果您擔心 LINE 訊息太多會錯過，
                <strong>強烈建議您在訂單中留下電話號碼</strong>。
              </p>
              <p>
                3. 為了避免 LINE 將號碼判讀為垃圾訊息，請使用「-」隔開，例如：
                <code className="bg-gray-100 px-2 py-1 rounded">
                  0-9-1-2-3-4-5-6-7-8
                </code>
                。
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    category: "關於配送流程",
    items: [
      {
        question: "我下單後大概多久會收到餐點？",
        answer:
          "由於我們會依照路線分區配送，送達時間大約會抓 1 個小時左右。我們會盡力將餐點快速送到您手上，也請您耐心等候。",
      },
      {
        question: "外送的流程是什麼？",
        answer: (
          <div className="space-y-2">
            <div className="space-y-1">
              <p>
                <strong>1. 配送區域：</strong>{" "}
                主要分為「校外」、「新宿」、「舊宿」三區。
              </p>
              <p>
                <strong>2. 每日路線：</strong>{" "}
                我們會根據當天的訂單狀況，提前公告當日的送餐路線（例如：新宿 →
                舊宿 → 校外）。
              </p>
              <p>
                <strong>3. 即時通知：</strong> 送餐途中，我們會 @
                所有人，提醒您餐點大概多久會抵達。
              </p>
              <p>
                <strong>4. 提前準備：</strong>{" "}
                收到通知後，麻煩您稍微提早一點下樓，或設定鬧鐘準備取餐，以減少送餐員在樓下的等候時間，讓我們能更快地服務下一位顧客。
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    category: "關於店家",
    items: [
      {
        question: "目前有提供哪些店家的外送服務？",
        answer: (
          <div className="space-y-2">
            <p>目前固定開團的店家有：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>肯德基 (KFC)</li>
              <li>麥當勞 (McDonald&apos;s)</li>
              <li>必勝客 (Pizza Hut)</li>
              <li>小豬很忙蔬果滷味</li>
              <li>御國香</li>
            </ul>
            <p className="text-sm text-gray-600">
              （未來也即將開放「漢堡王」。）
            </p>
          </div>
        ),
      },
      {
        question: "為什麼沒有達美樂 (Domino's)？",
        answer:
          "由於達美樂的外盒上完全沒有餐點標示，我們在核對餐點時較為困難，為避免送錯，目前暫時不會開放。",
      },
      {
        question: "我可以許願想吃的店家嗎？",
        answer:
          "當然可以！歡迎您到我們 LINE 主頁「重要貼文」中的「許願池」留言，我們會評估狀況並考慮開團喔！",
      },
    ],
  },
];

export function FAQ() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {FAQ_DATA.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <div className="mb-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                {category.category}
              </h3>
            </div>

            <Accordion selectionMode="multiple" variant="splitted">
              {category.items.map((item, itemIndex) => (
                <AccordionItem
                  key={`${categoryIndex}-${itemIndex}`}
                  aria-label={item.question}
                  title={
                    <div className="flex items-start gap-2">
                      <span className="text-violet-600 font-bold flex-shrink-0">
                        Q:
                      </span>
                      <span>{item.question}</span>
                    </div>
                  }
                >
                  <div className="flex items-start gap-2">
                    <span className="text-pink-600 font-bold flex-shrink-0">
                      A:
                    </span>
                    <div className="flex-1">
                      {typeof item.answer === "string" ? (
                        <p>{item.answer}</p>
                      ) : (
                        item.answer
                      )}
                    </div>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      <Accordion className="mt-12" variant="bordered">
        <AccordionItem
          key="contact"
          aria-label="還有其他問題？"
          title="💡還有其他問題？"
        >
          <div className="space-y-3">
            <p>如果您有任何其他疑問，歡迎隨時加入 LINE 社群詢問！</p>
            <Button
              as="a"
              color="success"
              href="https://line.me/ti/g2/doSJzEdtzFR3oAV6YoZPhoZR8mubtUVPf9tWmQ"
              rel="noopener noreferrer"
              startContent={
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
              }
              target="_blank"
              variant="shadow"
            >
              加入社群
            </Button>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
