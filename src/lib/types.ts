export type Store = {
  id: string;
  name: string;
  color: string;
  deliveryFee: number;
  rating: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  image: string; // emoji fallback
  prices: Record<string, number>; // storeId -> price
  previousPrices: Record<string, number>;
  updatedAt: string;
};

export type BasketItem = {
  productId: string;
  qty: number;
};

export type AISuggestion = {
  title: string;
  store: string;
  total: number;
  savings: number;
  items: { name: string; qty: number; price: number; store: string }[];
  tips: string[];
};
