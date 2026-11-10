import type { OrderItemDraft } from "../types";
import type { OrderItem } from "@/types";

/**
 * 將表單中的商品明細草稿解析為訂單商品明細
 * @returns 解析成功的商品陣列；任一列不合法時回傳 null
 */
export function parseOrderItems(drafts: OrderItemDraft[]): OrderItem[] | null {
  const items: OrderItem[] = [];

  for (const draft of drafts) {
    const unitPrice = Number(draft.price);
    const quantity = Number(draft.quantity);

    if (
      !draft.name.trim() ||
      !draft.price.trim() ||
      isNaN(unitPrice) ||
      unitPrice <= 0 ||
      !draft.quantity.trim() ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return null;
    }

    items.push({
      name: draft.name.trim(),
      unit_price: unitPrice,
      quantity,
    });
  }

  return items.length > 0 ? items : null;
}

/**
 * 由商品明細與備註產生 menu_items 摘要文字
 */
export function buildMenuItemsSummary(items: OrderItem[], notes?: string): string {
  const lines = items.map((item) => `${item.name} x${item.quantity}`);
  const trimmedNotes = notes?.trim();

  if (trimmedNotes) {
    lines.push(`備註：${trimmedNotes}`);
  }

  return lines.join("\n");
}
