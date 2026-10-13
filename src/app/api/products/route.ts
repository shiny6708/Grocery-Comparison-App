import { NextResponse } from "next/server";
import { PRODUCTS, STORES } from "@/lib/data";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  // Try Supabase persistence first; fall back to seed data
  try {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { data, error } = await supabase.from("products").select("*").limit(100);
      if (!error && data && data.length > 0) {
        return NextResponse.json({ source: "supabase", stores: STORES, products: data });
      }
    }
  } catch {
    // ignore — fall through to seed
  }
  return NextResponse.json({ source: "seed", stores: STORES, products: PRODUCTS });
}
