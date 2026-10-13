import type { Product, Store } from "./types";

export const STORES: Store[] = [
  { id: "walmart", name: "Walmart", color: "#0071ce", deliveryFee: 0, rating: 4.4 },
  { id: "kroger", name: "Kroger", color: "#004990", deliveryFee: 4.99, rating: 4.5 },
  { id: "aldi", name: "Aldi", color: "#ff7f00", deliveryFee: 0, rating: 4.6 },
  { id: "target", name: "Target", color: "#cc0000", deliveryFee: 5.99, rating: 4.3 },
  { id: "costco", name: "Costco", color: "#005daa", deliveryFee: 0, rating: 4.8 },
  { id: "wholefoods", name: "Whole Foods", color: "#00674a", deliveryFee: 9.99, rating: 4.2 },
];

export const CATEGORIES = [
  "Produce",
  "Dairy",
  "Bakery",
  "Meat",
  "Pantry",
  "Beverages",
  "Snacks",
  "Frozen",
] as const;

const now = () => new Date().toISOString();

function p(
  id: string,
  name: string,
  category: string,
  unit: string,
  image: string,
  prices: Record<string, number>,
  drop: Record<string, number> = {}
): Product {
  const previousPrices: Record<string, number> = {};
  for (const [s, price] of Object.entries(prices)) {
    previousPrices[s] = drop[s] ?? +(price * (1 + Math.random() * 0.12)).toFixed(2);
  }
  return { id, name, category, unit, image, prices, previousPrices, updatedAt: now() };
}

export const PRODUCTS: Product[] = [
  p("milk", "Whole Milk 1 Gal", "Dairy", "1 gal", "🥛", { walmart: 3.98, kroger: 4.29, aldi: 3.49, target: 4.19, costco: 3.29, wholefoods: 5.99 }),
  p("eggs", "Large Eggs 12ct", "Dairy", "12 ct", "🥚", { walmart: 4.12, kroger: 4.49, aldi: 3.29, target: 4.39, costco: 3.99, wholefoods: 6.49 }),
  p("bread", "Whole Wheat Bread", "Bakery", "20 oz", "🍞", { walmart: 2.48, kroger: 2.99, aldi: 1.99, target: 2.79, costco: 2.29, wholefoods: 4.99 }),
  p("bananas", "Bananas", "Produce", "per lb", "🍌", { walmart: 0.62, kroger: 0.69, aldi: 0.49, target: 0.65, costco: 0.55, wholefoods: 0.99 }),
  p("avocado", "Hass Avocado", "Produce", "each", "🥑", { walmart: 1.25, kroger: 1.5, aldi: 0.99, target: 1.49, costco: 1.1, wholefoods: 2.0 }),
  p("chicken", "Chicken Breast", "Meat", "per lb", "🍗", { walmart: 3.49, kroger: 3.99, aldi: 2.99, target: 3.79, costco: 2.79, wholefoods: 6.99 }),
  p("salmon", "Atlantic Salmon", "Meat", "per lb", "🐟", { walmart: 8.99, kroger: 9.99, aldi: 7.99, target: 9.49, costco: 7.49, wholefoods: 14.99 }),
  p("rice", "Jasmine Rice 5lb", "Pantry", "5 lb", "🍚", { walmart: 6.48, kroger: 7.29, aldi: 5.49, target: 6.99, costco: 4.99, wholefoods: 11.99 }),
  p("pasta", "Spaghetti 16oz", "Pantry", "16 oz", "🍝", { walmart: 1.28, kroger: 1.49, aldi: 0.95, target: 1.39, costco: 1.1, wholefoods: 2.99 }),
  p("oliveoil", "Extra Virgin Olive Oil", "Pantry", "500ml", "🫒", { walmart: 7.98, kroger: 9.49, aldi: 6.49, target: 8.99, costco: 5.99, wholefoods: 14.99 }),
  p("coffee", "Ground Coffee 12oz", "Beverages", "12 oz", "☕", { walmart: 6.98, kroger: 8.49, aldi: 5.29, target: 7.99, costco: 5.49, wholefoods: 12.99 }),
  p("oj", "Orange Juice 52oz", "Beverages", "52 oz", "🍊", { walmart: 3.98, kroger: 4.49, aldi: 3.29, target: 4.29, costco: 3.49, wholefoods: 6.99 }),
  p("yogurt", "Greek Yogurt 32oz", "Dairy", "32 oz", "🍦", { walmart: 4.48, kroger: 5.29, aldi: 3.79, target: 4.99, costco: 3.99, wholefoods: 7.49 }),
  p("cheese", "Cheddar Block 16oz", "Dairy", "16 oz", "🧀", { walmart: 4.98, kroger: 5.49, aldi: 3.99, target: 5.29, costco: 4.29, wholefoods: 8.99 }),
  p("apples", "Honeycrisp Apples", "Produce", "per lb", "🍎", { walmart: 2.48, kroger: 2.99, aldi: 1.99, target: 2.79, costco: 1.89, wholefoods: 3.99 }),
  p("spinach", "Baby Spinach 5oz", "Produce", "5 oz", "🥬", { walmart: 2.98, kroger: 3.49, aldi: 2.29, target: 3.29, costco: 2.49, wholefoods: 4.99 }),
  p("tomatoes", "Roma Tomatoes", "Produce", "per lb", "🍅", { walmart: 1.48, kroger: 1.79, aldi: 1.19, target: 1.69, costco: 1.29, wholefoods: 2.99 }),
  p("chips", "Potato Chips 8oz", "Snacks", "8 oz", "🍟", { walmart: 3.48, kroger: 3.99, aldi: 2.49, target: 3.79, costco: 2.99, wholefoods: 5.49 }),
  p("choc", "Dark Chocolate Bar", "Snacks", "3.5 oz", "🍫", { walmart: 2.28, kroger: 2.99, aldi: 1.79, target: 2.79, costco: 1.99, wholefoods: 3.99 }),
  p("icecream", "Vanilla Ice Cream", "Frozen", "1.5 qt", "🍨", { walmart: 4.48, kroger: 5.99, aldi: 3.49, target: 5.49, costco: 3.99, wholefoods: 7.99 }),
  p("pizza", "Pepperoni Pizza", "Frozen", "20 oz", "🍕", { walmart: 5.48, kroger: 6.49, aldi: 3.99, target: 5.99, costco: 4.49, wholefoods: 9.99 }),
  p("honey", "Raw Honey 12oz", "Pantry", "12 oz", "🍯", { walmart: 5.98, kroger: 7.49, aldi: 4.99, target: 6.99, costco: 4.49, wholefoods: 10.99 }),
  p("butter", "Unsalted Butter 1lb", "Dairy", "1 lb", "🧈", { walmart: 3.98, kroger: 4.79, aldi: 3.29, target: 4.49, costco: 3.19, wholefoods: 6.99 }),
  p("strawberry", "Strawberries 1lb", "Produce", "1 lb", "🍓", { walmart: 3.48, kroger: 3.99, aldi: 2.79, target: 3.79, costco: 2.99, wholefoods: 5.99 }),
];

export function cheapestStore(product: Product): { storeId: string; price: number } {
  let best = { storeId: "", price: Infinity };
  for (const [s, price] of Object.entries(product.prices)) {
    if (price < best.price) best = { storeId: s, price };
  }
  return best;
}

export function priceSpread(product: Product): number {
  const vals = Object.values(product.prices);
  return Math.max(...vals) - Math.min(...vals);
}

export function basketTotal(productIds: string[] | { productId: string; qty: number }[], storeId: string): number {
  let total = 0;
  for (const entry of productIds) {
    const pid = typeof entry === "string" ? entry : entry.productId;
    const qty = typeof entry === "string" ? 1 : entry.qty;
    const prod = PRODUCTS.find((x) => x.id === pid);
    if (prod) total += (prod.prices[storeId] ?? 0) * qty;
  }
  return +total.toFixed(2);
}

export function bestSingleStore(items: { productId: string; qty: number }[]): { storeId: string; total: number } {
  let best = { storeId: STORES[0].id, total: Infinity };
  for (const s of STORES) {
    const t = basketTotal(items, s.id);
    if (t < best.total) best = { storeId: s.id, total: t };
  }
  return best;
}
