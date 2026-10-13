"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Leaf,
  Plus,
  Printer,
  Radio,
  Search,
  ShoppingCart,
  Sparkles,
  Store as StoreIcon,
  Trash2,
  TrendingDown,
  Wallet,
} from "lucide-react";
import type { AISuggestion, BasketItem, Product, Store } from "@/lib/types";
import { CATEGORIES, STORES } from "@/lib/data";
import { downloadTextFile, formatUSD, toCSV } from "@/lib/utils";

type FeedEvent = { id: number; text: string; time: string };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores] = useState<Store[]>(STORES);
  const [source, setSource] = useState("seed");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "cheapest" | "savings">("savings");
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [live, setLive] = useState(true);
  const [list, setList] = useState<BasketItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("fc-list") ?? "[]");
    } catch {
      return [];
    }
  });
  const [aiQuery, setAiQuery] = useState("weekly breakfast + pasta night, family of 4");
  const [aiBudget, setAiBudget] = useState("60");
  const [aiResult, setAiResult] = useState<(AISuggestion & { model?: string }) | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((j) => {
        setProducts(j.products ?? []);
        setSource(j.source ?? "seed");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("fc-list", JSON.stringify(list));
  }, [list]);

  // Real-time simulation: nudge a random price every 6s + Supabase Realtime hook point
  useEffect(() => {
    if (!live || products.length === 0) return;
    const t = setInterval(() => {
      setProducts((prev) => {
        if (!prev.length) return prev;
        const idx = Math.floor(Math.random() * prev.length);
        const prod = prev[idx];
        const storeIds = Object.keys(prod.prices);
        const sid = storeIds[Math.floor(Math.random() * storeIds.length)];
        const delta = +(Math.random() * 0.6 - 0.3).toFixed(2);
        const next = Math.max(0.29, +((prod.prices[sid] ?? 1) + delta).toFixed(2));
        const updated = prev.map((p, i) =>
          i === idx
            ? {
                ...p,
                previousPrices: { ...p.previousPrices, [sid]: p.prices[sid] },
                prices: { ...p.prices, [sid]: next },
                updatedAt: new Date().toISOString(),
              }
            : p
        );
        const storeName = stores.find((s) => s.id === sid)?.name ?? sid;
        setFeed((f) =>
          [
            {
              id: Date.now(),
              text: `${prod.name} @ ${storeName} → ${formatUSD(next)} (${delta <= 0 ? "drop" : "up"})`,
              time: new Date().toLocaleTimeString(),
            },
            ...f,
          ].slice(0, 8)
        );
        return updated;
      });
    }, 6000);
    return () => clearInterval(t);
  }, [live, products.length, stores]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    );
    const cheapest = (p: Product) => Math.min(...Object.values(p.prices));
    const spread = (p: Product) => Math.max(...Object.values(p.prices)) - cheapest(p);
    return [...rows].sort((a, b) =>
      sortBy === "name"
        ? a.name.localeCompare(b.name)
        : sortBy === "cheapest"
          ? cheapest(a) - cheapest(b)
          : spread(b) - spread(a)
    );
  }, [products, search, category, sortBy]);

  const stats = useMemo(() => {
    if (!products.length)
      return { count: 0, cheapestBasket: 0, avgSavings: 0, drops: 0, bestStore: "—" };
    const cheapestBasket = products.reduce(
      (s, p) => s + Math.min(...Object.values(p.prices)),
      0
    );
    const avgSavings =
      products.reduce(
        (s, p) => s + (Math.max(...Object.values(p.prices)) - Math.min(...Object.values(p.prices))),
        0
      ) / products.length;
    const drops = products.filter((p) =>
      Object.entries(p.prices).some(([sid, v]) => (p.previousPrices[sid] ?? v) > v)
    ).length;
    const totals = stores.map((s) => ({
      name: s.name,
      total: +products.reduce((t, p) => t + (p.prices[s.id] ?? 0), 0).toFixed(2),
    }));
    const bestStore = totals.reduce((a, b) => (b.total < a.total ? b : a), totals[0])?.name ?? "—";
    return {
      count: products.length,
      cheapestBasket: +cheapestBasket.toFixed(2),
      avgSavings: +avgSavings.toFixed(2),
      drops,
      bestStore,
    };
  }, [products, stores]);

  const basketChart = useMemo(() => {
    const basis =
      list.length > 0
        ? list
            .map((i) => products.find((p) => p.id === i.productId))
            .filter((x): x is Product => !!x)
            .flatMap((p) => {
              const qty = list.find((l) => l.productId === p.id)?.qty ?? 1;
              return Array(qty).fill(p);
            })
        : products;
    return stores.map((s) => ({
      name: s.name,
      total: +basis.reduce((t, p) => t + (p.prices[s.id] ?? 0), 0).toFixed(2),
    }));
  }, [products, stores, list]);

  const listTotal = (storeId: string) =>
    +list
      .reduce((t, i) => {
        const p = products.find((x) => x.id === i.productId);
        return t + (p?.prices[storeId] ?? 0) * i.qty;
      }, 0)
      .toFixed(2);

  const bestListStore = stores.reduce(
    (a, s) => {
      const t = listTotal(s.id);
      return t < a.total ? { id: s.id, total: t } : a;
    },
    { id: stores[0]?.id ?? "", total: Infinity }
  );

  async function runAI() {
    setAiLoading(true);
    try {
      const r = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: aiQuery,
          budget: aiBudget ? Number(aiBudget) : undefined,
          items: list,
        }),
      });
      setAiResult(await r.json());
    } finally {
      setAiLoading(false);
    }
  }

  function exportListCSV() {
    const rows = list.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      if (!p) return null;
      const cheap = Object.entries(p.prices).reduce((a, b) => (b[1] < a[1] ? b : a));
      return {
        product: p.name,
        qty: i.qty,
        cheapest_store: stores.find((s) => s.id === cheap[0])?.name ?? cheap[0],
        unit_price: cheap[1],
        line_total: +(cheap[1] * i.qty).toFixed(2),
      };
    }).filter((x): x is NonNullable<typeof x> => !!x);
    downloadTextFile("freshcompare-list.csv", toCSV(rows.length ? rows : [{ note: "empty list" }]));
  }

  return (
    <div className="min-h-screen bg-[#f6f9f4] text-[#12211a]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-green-900/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-700 text-white">
              <Leaf size={20} />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-none">FreshCompare</p>
              <p className="text-xs text-green-900/60">Grocery Price Comparison</p>
            </div>
          </div>
          <div className="relative ml-auto flex w-full max-w-md items-center">
            <Search size={16} className="absolute left-3 text-green-900/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search milk, produce, snacks…"
              className="w-full rounded-full border border-green-900/15 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-green-600"
            />
          </div>
          <span className="hidden items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 sm:flex">
            <Radio size={12} /> {live ? "Live" : "Paused"} • DB: {source}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: <StoreIcon size={18} />, label: "Products tracked", value: String(stats.count) },
            { icon: <Wallet size={18} />, label: "Cheapest full basket", value: formatUSD(stats.cheapestBasket) },
            { icon: <TrendingDown size={18} />, label: "Avg. savings / item", value: formatUSD(stats.avgSavings) },
            { icon: <ShoppingCart size={18} />, label: `Best store: ${stats.bestStore}`, value: `${stats.drops} price drops` },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl border border-green-900/10 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-green-800">{c.icon}<span className="text-xs font-semibold uppercase tracking-wide">{c.label}</span></div>
              <p className="mt-2 text-2xl font-extrabold">{c.value}</p>
            </div>
          ))}
        </section>

        {/* Controls + live feed */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-green-900/10 bg-white p-4 shadow-sm lg:col-span-2">
            <h2 className="font-bold">Store basket comparison</h2>
            <p className="text-xs text-green-900/60">
              {list.length ? `Totals for your ${list.length}-line shopping list.` : "Totals for all tracked products. Add items to the list to compare your basket."}
            </p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={basketChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} interval={0} angle={-12} dy={8} height={50} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#15803d" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-green-900/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold"><Radio size={16} className={live ? "text-red-500" : "text-gray-400"} /> Real-time updates</h2>
              <button onClick={() => setLive(!live)} className="rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white hover:bg-green-800">
                {live ? "Pause" : "Resume"}
              </button>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {feed.length === 0 && <li className="text-green-900/50 text-xs">Listening for price changes… updates arrive every few seconds.</li>}
              {feed.map((e) => (
                <li key={e.id} className="rounded-lg bg-green-50 px-3 py-2 text-xs">
                  <span className="font-semibold">{e.time}</span> — {e.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Filters */}
        <section className="flex flex-wrap items-center gap-2">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${category === c ? "bg-green-700 text-white" : "bg-white text-green-900 border border-green-900/15"}`}
            >
              {c}
            </button>
          ))}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="ml-auto rounded-full border border-green-900/15 bg-white px-3 py-1.5 text-xs font-bold">
            <option value="savings">Sort: biggest savings</option>
            <option value="cheapest">Sort: cheapest first</option>
            <option value="name">Sort: name A–Z</option>
          </select>
        </section>

        {/* Product table / cards */}
        <section className="overflow-hidden rounded-2xl border border-green-900/10 bg-white shadow-sm">
          <div className="hidden grid-cols-[2fr_repeat(6,1fr)_auto] gap-2 bg-green-900 px-4 py-3 text-xs font-bold uppercase tracking-wide text-green-50 md:grid">
            <span>Product</span>
            {stores.map((s) => <span key={s.id} className="text-center">{s.name}</span>)}
            <span className="text-right">Add</span>
          </div>
          <div className="divide-y divide-green-900/10">
            {filtered.map((p) => {
              const min = Math.min(...Object.values(p.prices));
              const max = Math.max(...Object.values(p.prices));
              return (
                <div key={p.id} className="px-4 py-3">
                  <div className="grid items-center gap-2 md:grid-cols-[2fr_repeat(6,1fr)_auto]">
                    <div>
                      <p className="font-bold">{p.image} {p.name}</p>
                      <p className="text-xs text-green-900/60">{p.category} • {p.unit} • save {formatUSD(max - min)}</p>
                    </div>
                    {stores.map((s) => {
                      const v = p.prices[s.id] ?? 0;
                      const prev = p.previousPrices[s.id] ?? v;
                      const isBest = v === min;
                      return (
                        <div key={s.id} className={`rounded-lg px-2 py-1.5 text-center text-sm font-bold ${isBest ? "bg-green-700 text-white" : "bg-green-50"}`}>
                          {formatUSD(v)}
                          <span className="ml-1 text-[10px] font-normal opacity-80">
                            {v < prev ? <ArrowDownRight size={10} className="inline" /> : v > prev ? <ArrowUpRight size={10} className="inline" /> : null}
                          </span>
                          <span className="block text-[10px] font-normal md:hidden">{s.name}</span>
                        </div>
                      );
                    })}
                    <button
                      onClick={() =>
                        setList((l) => {
                          const f = l.find((x) => x.productId === p.id);
                          return f ? l.map((x) => x.productId === p.id ? { ...x, qty: x.qty + 1 } : x) : [...l, { productId: p.id, qty: 1 }];
                        })
                      }
                      className="rounded-full bg-green-100 p-2 text-green-800 hover:bg-green-700 hover:text-white"
                      aria-label={`Add ${p.name}`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-green-900/60">No products match. Try another search.</p>}
          </div>
        </section>

        {/* List + AI + Export */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-green-900/10 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold"><ShoppingCart size={16} /> Shopping list {list.length > 0 && <span className="rounded-full bg-green-700 px-2 py-0.5 text-xs text-white">{list.length}</span>}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {list.length === 0 && <li className="text-xs text-green-900/60">Tap + on any product to build your list.</li>}
              {list.map((i) => {
                const p = products.find((x) => x.id === i.productId);
                if (!p) return null;
                return (
                  <li key={i.productId} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                    <span className="flex-1 font-semibold">{p.name}</span>
                    <button className="px-2 font-bold" onClick={() => setList((l) => l.map((x) => x.productId === i.productId ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}>−</button>
                    <span className="w-6 text-center font-bold">{i.qty}</span>
                    <button className="px-2 font-bold" onClick={() => setList((l) => l.map((x) => x.productId === i.productId ? { ...x, qty: x.qty + 1 } : x))}>+</button>
                    <button className="text-red-600" onClick={() => setList((l) => l.filter((x) => x.productId !== i.productId))} aria-label="Remove"><Trash2 size={14} /></button>
                  </li>
                );
              })}
            </ul>
            {list.length > 0 && (
              <div className="mt-3 rounded-xl bg-green-900 p-3 text-sm text-white">
                Best single store: <b>{stores.find((s) => s.id === bestListStore.id)?.name} — {formatUSD(bestListStore.total)}</b>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-green-900/10 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold"><Sparkles size={16} /> AI shopping assistant</h2>
            <p className="text-xs text-green-900/60">Local smart model + optional LLM (set AI_API_KEY). Generates an optimized plan.</p>
            <textarea value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} rows={3} className="mt-3 w-full rounded-xl border border-green-900/15 p-2 text-sm outline-none focus:border-green-600" />
            <div className="mt-2 flex gap-2">
              <input value={aiBudget} onChange={(e) => setAiBudget(e.target.value)} inputMode="decimal" placeholder="Budget $" className="w-28 rounded-xl border border-green-900/15 p-2 text-sm" />
              <button onClick={runAI} disabled={aiLoading} className="flex-1 rounded-xl bg-green-700 px-3 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50">
                {aiLoading ? "Thinking…" : "Generate smart plan"}
              </button>
            </div>
            {aiResult && (
              <div className="mt-3 rounded-xl bg-green-50 p-3 text-sm">
                <p className="font-bold">{aiResult.title}</p>
                <p className="text-xs">Winner: {aiResult.store} • {formatUSD(aiResult.total)} • saves {formatUSD(aiResult.savings)} • <i>{aiResult.model}</i></p>
                <ul className="mt-2 list-disc pl-5 text-xs">
                  {aiResult.items.slice(0, 8).map((i, k) => <li key={k}>{i.qty}× {i.name} — {formatUSD(i.price)} ({i.store})</li>)}
                </ul>
                <ul className="mt-2 space-y-1 text-xs">
                  {aiResult.tips.map((t, k) => <li key={k}>💡 {t}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-green-900/10 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold"><Download size={16} /> Export & reporting</h2>
            <p className="text-xs text-green-900/60">Download CSV reports or print a weekly summary.</p>
            <div className="mt-3 grid gap-2 text-sm font-bold">
              <a href="/api/export" className="rounded-xl bg-green-700 px-3 py-2 text-center text-white hover:bg-green-800">Download full price report (CSV)</a>
              <button onClick={exportListCSV} className="rounded-xl border border-green-700 px-3 py-2 text-green-800 hover:bg-green-50">Export my list (CSV)</button>
              <button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-xl border border-green-900/15 px-3 py-2 hover:bg-green-50"><Printer size={15} /> Print report</button>
              <button onClick={() => setList([])} className="rounded-xl px-3 py-2 text-red-600 hover:bg-red-50">Clear list</button>
            </div>
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              Supabase: {source === "supabase" ? "connected — persistence + realtime on." : "not configured — using seed data. Add NEXT_PUBLIC_SUPABASE_URL / ANON_KEY, run supabase/schema.sql, redeploy."}
            </div>
          </div>
        </section>

        <footer className="pb-10 text-center text-xs text-green-900/50">
          FreshCompare • Next.js + Supabase + AI • Deploy on Vercel • Prices are demo data; connect Supabase for live persistence.
        </footer>
      </main>
    </div>
  );
}
