import { PRODUCTS, STORES, bestSingleStore, cheapestStore } from "./data";
import type { AISuggestion, BasketItem } from "./types";

const MEAL_MAP: Record<string, string[]> = {
  pasta: ["pasta", "oliveoil", "tomatoes", "cheese"],
  breakfast: ["eggs", "milk", "bread", "coffee", "bananas"],
  taco: ["tomatoes", "cheese", "avocado", "chicken"],
  salad: ["spinach", "avocado", "tomatoes", "oliveoil"],
  pizza: ["pizza", "cheese", "choc"],
  smoothie: ["strawberry", "bananas", "milk", "yogurt"],
  sandwich: ["bread", "cheese", "tomatoes", "chicken"],
  dessert: ["icecream", "choc", "strawberry"],
  healthy: ["spinach", "salmon", "avocado", "apples", "yogurt"],
  budget: ["rice", "pasta", "bread", "bananas", "eggs", "milk"],
};

export function generateSmartBasket(
  input: string,
  budget?: number,
  items?: BasketItem[]
): AISuggestion {
  const q = input.toLowerCase();
  let productIds: string[] = [];

  // 1. explicit item matching
  for (const p of PRODUCTS) {
    if (q.includes(p.name.toLowerCase().split(" ")[0]) || q.includes(p.id)) {
      productIds.push(p.id);
    }
  }
  // 2. meal keyword matching
  for (const [meal, ids] of Object.entries(MEAL_MAP)) {
    if (q.includes(meal)) productIds.push(...ids);
  }
  // 3. user-supplied list items
  if (items?.length) productIds.push(...items.map((i) => i.productId));
  productIds = [...new Set(productIds)];
  // 4. fallback: budget-friendly staples
  if (productIds.length === 0) {
    productIds = budget && budget < 30
      ? [...(MEAL_MAP.budget ?? [])]
      : ["milk", "eggs", "bread", "bananas", "chicken", "rice", "spinach", "coffee"];
  }

  const qtyMap = new Map<string, number>();
  items?.forEach((i) => qtyMap.set(i.productId, i.qty));
  const basket: BasketItem[] = productIds.map((pid) => ({
    productId: pid,
    qty: qtyMap.get(pid) ?? 1,
  }));

  const best = bestSingleStore(basket);
  const storeName = STORES.find((s) => s.id === best.storeId)?.name ?? best.storeId;

  // per-item cheapest (split-shop) total
  let splitTotal = 0;
  const detailed = basket.map((b) => {
    const prod = PRODUCTS.find((x) => x.id === b.productId)!;
    const cheap = cheapestStore(prod);
    const cheapStoreName = STORES.find((s) => s.id === cheap.storeId)?.name ?? cheap.storeId;
    splitTotal += cheap.price * b.qty;
    return {
      name: prod.name,
      qty: b.qty,
      price: +((prod.prices[best.storeId] ?? cheap.price) * b.qty).toFixed(2),
      store: storeName,
      cheapestAlt: `${cheapStoreName} $${cheap.price.toFixed(2)}`,
    };
  });
  splitTotal = +splitTotal.toFixed(2);

  // savings vs most expensive single store
  let maxTotal = 0;
  for (const s of STORES) {
    let t = 0;
    for (const b of basket) {
      const prod = PRODUCTS.find((x) => x.id === b.productId)!;
      t += (prod.prices[s.id] ?? 0) * b.qty;
    }
    maxTotal = Math.max(maxTotal, t);
  }
  const savings = +(maxTotal - best.total).toFixed(2);

  const tips: string[] = [];
  tips.push(`Single-trip winner: ${storeName} at $${best.total.toFixed(2)}.`);
  if (splitTotal < best.total) {
    tips.push(
      `Split-shop across cheapest per-item stores to reach $${splitTotal.toFixed(2)} (saves $${(best.total - splitTotal).toFixed(2)} extra).`
    );
  }
  const drops = PRODUCTS.filter((prod) =>
    basket.some((b) => b.productId === prod.id) &&
    Object.entries(prod.prices).some(
      ([s, price]) => (prod.previousPrices[s] ?? price) > price
    )
  );
  if (drops.length) tips.push(`${drops.length} item(s) on price drop — good time to stock up: ${drops.map((d) => d.name).slice(0, 3).join(", ")}.`);
  if (budget && best.total > budget) {
    tips.push(
      `Over budget by $${(best.total - budget).toFixed(2)} — consider swapping Whole Foods-priced items to Aldi/Costco equivalents.`
    );
  } else if (budget) {
    tips.push(`Under budget by $${(budget - best.total).toFixed(2)} — great job!`);
  }
  tips.push("Tip: Costco wins on pantry staples; Aldi wins on produce & dairy this week.");

  return {
    title: input.trim() ? `Smart plan for "${input.trim()}"` : "Optimized weekly basket",
    store: storeName,
    total: best.total,
    savings,
    items: detailed.map((d) => ({ name: d.name, qty: d.qty, price: d.price, store: d.store })),
    tips,
  };
}
