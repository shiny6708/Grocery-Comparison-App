import { NextResponse } from "next/server";
import { generateSmartBasket } from "@/lib/ai";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const query: string = body.query ?? "";
  const budget: number | undefined = body.budget ? Number(body.budget) : undefined;
  const items = Array.isArray(body.items) ? body.items : [];

  const suggestion = generateSmartBasket(query, budget, items);

  // Persist to Supabase if configured (best-effort)
  try {
    const supabase = await createServerSupabase();
    if (supabase) {
      await supabase.from("shopping_lists").insert({
        title: suggestion.title,
        store: suggestion.store,
        total: suggestion.total,
        items: suggestion.items,
      });
    }
  } catch {
    // offline / unconfigured — still return the suggestion
  }

  // Optional: if an external LLM key is configured, enrich tips.
  // Supports OpenAI-compatible endpoint via AI_API_KEY + AI_API_URL.
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL;
  if (apiKey && apiUrl) {
    try {
      const r = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL ?? "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a grocery savings assistant. Reply with 2 short tips." },
            { role: "user", content: `Basket: ${suggestion.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}. Total $${suggestion.total} at ${suggestion.store}.` },
          ],
          max_tokens: 150,
        }),
      });
      const j = await r.json().catch(() => null);
      const extra: string | undefined = j?.choices?.[0]?.message?.content;
      if (extra) suggestion.tips.push(`AI: ${extra.slice(0, 280)}`);
    } catch {
      // keep local tips only
    }
  }

  return NextResponse.json({ ...suggestion, model: apiKey ? "hybrid (local + LLM)" : "local-smart-v1" });
}
