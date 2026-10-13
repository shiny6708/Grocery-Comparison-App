import { NextResponse } from "next/server";
import { PRODUCTS, STORES } from "@/lib/data";
import { toCSV } from "@/lib/utils";

export async function GET() {
  const rows = PRODUCTS.map((p) => {
    const entries = Object.entries(p.prices);
    const cheapest = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
    const expensive = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    const row: Record<string, string | number> = {
      product: p.name,
      category: p.category,
      unit: p.unit,
      cheapest_store: STORES.find((s) => s.id === cheapest[0])?.name ?? cheapest[0],
      cheapest_price: cheapest[1],
      most_expensive_store: STORES.find((s) => s.id === expensive[0])?.name ?? expensive[0],
      most_expensive_price: expensive[1],
      savings: +(expensive[1] - cheapest[1]).toFixed(2),
    };
    for (const s of STORES) row[s.name] = p.prices[s.id] ?? "";
    return row;
  });
  const csv = toCSV(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="grocery-price-report.csv"',
    },
  });
}
