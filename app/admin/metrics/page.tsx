import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  CurrencyDollar,
  Package,
  TrendUp,
  ArrowLeft,
  Star,
  Archive,
  ChartBar,
} from "@phosphor-icons/react/dist/ssr";

export default async function MetricsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "admin") redirect("/");

  // --- ALL-TIME revenue (all topup transactions) ---
  const { data: allTopups } = await supabase
    .from("balance_transactions")
    .select("amount")
    .eq("type", "topup");

  const totalRevenue = (allTopups ?? []).reduce(
    (sum, t) => sum + parseFloat(t.amount.toString()),
    0
  );
  const topupCount = (allTopups ?? []).length;
  const avgTopup = topupCount > 0 ? totalRevenue / topupCount : 0;

  // --- ALL-TIME box openings ---
  const { data: allBoxes } = await supabase
    .from("balance_transactions")
    .select("created_at")
    .eq("type", "box_purchase");

  const totalBoxes = (allBoxes ?? []).length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const boxesToday = (allBoxes ?? []).filter(
    (b) => new Date(b.created_at) >= todayStart
  ).length;

  // --- User inventory: rarity breakdown + sellback stats + liability ---
  const { data: allInventory } = await supabase
    .from("user_inventory")
    .select("rarity, status, buyback_price, product_name");

  const rarityBreakdown: Record<string, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    ultra: 0,
  };
  let totalItems = 0;
  let soldBackItems = 0;
  let keptItems = 0;
  let outstandingLiability = 0;
  const itemCounts: Record<string, number> = {};

  for (const item of allInventory ?? []) {
    totalItems++;
    rarityBreakdown[item.rarity] = (rarityBreakdown[item.rarity] ?? 0) + 1;
    if (item.status === "sold") soldBackItems++;
    if (item.status === "kept" || item.status === "shipping_requested" || item.status === "shipped") {
      keptItems++;
      outstandingLiability += parseFloat(item.buyback_price?.toString() ?? "0");
    }
    if (item.product_name) {
      itemCounts[item.product_name] = (itemCounts[item.product_name] ?? 0) + 1;
    }
  }

  const sellbackRate = totalItems > 0 ? (soldBackItems / totalItems) * 100 : 0;

  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // --- Current warehouse stock by rarity ---
  const { data: stock } = await supabase
    .from("inventory")
    .select("quantity_available, product:products(rarity)");

  const stockByRarity: Record<string, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    ultra: 0,
  };

  for (const s of stock ?? []) {
    const rarity = (s.product as { rarity?: string })?.rarity ?? "";
    if (rarity in stockByRarity) {
      stockByRarity[rarity] += s.quantity_available;
    }
  }

  const rarityConfig: Record<string, { label: string; color: string; badge: string; threshold: number }> = {
    common:   { label: "Common",   color: "bg-gray-100",   badge: "bg-gray-200 text-gray-700",     threshold: 50 },
    uncommon: { label: "Uncommon", color: "bg-blue-50",    badge: "bg-blue-100 text-blue-700",     threshold: 15 },
    rare:     { label: "Rare",     color: "bg-orange-50",  badge: "bg-orange-100 text-orange-700", threshold: 5  },
    ultra:    { label: "Ultra",    color: "bg-purple-50",  badge: "bg-purple-100 text-purple-700", threshold: 2  },
  };

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors"
            >
              <ArrowLeft weight="bold" className="text-orange-600" />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-orange-950">Metrics</h1>
              <p className="text-orange-600 mt-0.5 text-sm">Business performance overview</p>
            </div>
          </div>
          <a href="/" className="text-sm text-orange-600 hover:text-orange-800 underline">
            Back to Site
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* REVENUE */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CurrencyDollar weight="fill" className="text-orange-600 text-xl" />
            <h2 className="text-lg font-bold text-orange-950">Revenue</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-orange-100 p-6">
              <p className="text-sm text-orange-500 font-medium mb-1">Total Top-Ups (All Time)</p>
              <p className="text-3xl font-black text-orange-950">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-orange-400 mt-1">{topupCount} transactions</p>
            </div>
            <div className="bg-white rounded-2xl border border-orange-100 p-6">
              <p className="text-sm text-orange-500 font-medium mb-1">Average Top-Up Amount</p>
              <p className="text-3xl font-black text-orange-950">${avgTopup.toFixed(2)}</p>
              <p className="text-xs text-orange-400 mt-1">per transaction</p>
            </div>
            <div className="bg-white rounded-2xl border border-orange-100 p-6">
              <p className="text-sm text-orange-500 font-medium mb-1">Outstanding Buyback Liability</p>
              <p className="text-3xl font-black text-red-600">${outstandingLiability.toFixed(2)}</p>
              <p className="text-xs text-orange-400 mt-1">owed if all users sell back today</p>
            </div>
          </div>
        </section>

        {/* BOX ACTIVITY */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendUp weight="fill" className="text-orange-600 text-xl" />
            <h2 className="text-lg font-bold text-orange-950">Box Activity</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-orange-100 p-6">
              <p className="text-sm text-orange-500 font-medium mb-1">Total Boxes Opened</p>
              <p className="text-3xl font-black text-orange-950">{totalBoxes}</p>
            </div>
            <div className="bg-white rounded-2xl border border-orange-100 p-6">
              <p className="text-sm text-orange-500 font-medium mb-1">Boxes Opened Today</p>
              <p className="text-3xl font-black text-orange-950">{boxesToday}</p>
            </div>
            <div className="bg-white rounded-2xl border border-orange-100 p-6">
              <p className="text-sm text-orange-500 font-medium mb-1">Items Sold Back</p>
              <p className="text-3xl font-black text-orange-950">{soldBackItems}</p>
              <p className="text-xs text-orange-400 mt-1">of {totalItems} total pulls</p>
            </div>
            <div className="bg-white rounded-2xl border border-orange-100 p-6">
              <p className="text-sm text-orange-500 font-medium mb-1">Sellback Rate</p>
              <p className="text-3xl font-black text-orange-950">{sellbackRate.toFixed(1)}%</p>
              <p className="text-xs text-orange-400 mt-1">{keptItems} items kept</p>
            </div>
          </div>

          {/* Rarity breakdown */}
          <div className="bg-white rounded-2xl border border-orange-100 p-6">
            <h3 className="text-sm font-bold text-orange-950 mb-4">Pulls by Rarity (All Time)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["common", "uncommon", "rare", "ultra"] as const).map((r) => {
                const cfg = rarityConfig[r];
                const count = rarityBreakdown[r] ?? 0;
                const pct = totalItems > 0 ? (count / totalItems) * 100 : 0;
                return (
                  <div key={r} className={`rounded-xl p-4 ${cfg.color}`}>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <p className="text-2xl font-black text-orange-950 mt-2">{count}</p>
                    <p className="text-xs text-orange-500">{pct.toFixed(1)}% of pulls</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* INVENTORY */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Archive weight="fill" className="text-orange-600 text-xl" />
            <h2 className="text-lg font-bold text-orange-950">Warehouse Stock</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["common", "uncommon", "rare", "ultra"] as const).map((r) => {
              const cfg = rarityConfig[r];
              const qty = stockByRarity[r] ?? 0;
              const isLow = qty <= cfg.threshold;
              return (
                <div
                  key={r}
                  className={`rounded-2xl border-2 p-6 ${
                    isLow ? "border-red-300 bg-red-50" : "border-orange-100 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    {isLow && (
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        LOW
                      </span>
                    )}
                  </div>
                  <p className={`text-3xl font-black ${isLow ? "text-red-700" : "text-orange-950"}`}>
                    {qty}
                  </p>
                  <p className="text-xs text-orange-400 mt-1">units remaining</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* TOP ITEMS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star weight="fill" className="text-orange-600 text-xl" />
            <h2 className="text-lg font-bold text-orange-950">Top 10 Most Pulled Items</h2>
          </div>
          <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
            {topItems.length === 0 ? (
              <div className="p-8 text-center text-orange-400 text-sm">
                No box openings yet. Data will appear here once users start pulling.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">Times Pulled</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">Share of All Pulls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {topItems.map(([name, count], idx) => (
                    <tr key={name} className="hover:bg-orange-50">
                      <td className="px-6 py-3 text-sm font-bold text-orange-400">{idx + 1}</td>
                      <td className="px-6 py-3 text-sm font-medium text-orange-950">{name}</td>
                      <td className="px-6 py-3 text-sm font-bold text-orange-950">{count}</td>
                      <td className="px-6 py-3 text-sm text-orange-500">
                        {totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : "0"}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* QUICK UNIT ECONOMICS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ChartBar weight="fill" className="text-orange-600 text-xl" />
            <h2 className="text-lg font-bold text-orange-950">Unit Economics</h2>
          </div>
          <div className="bg-white rounded-2xl border border-orange-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-orange-400 uppercase font-bold mb-1">Box Price</p>
                <p className="text-2xl font-black text-orange-950">$25</p>
              </div>
              <div>
                <p className="text-xs text-orange-400 uppercase font-bold mb-1">COGS (flat)</p>
                <p className="text-2xl font-black text-orange-950">$12</p>
                <p className="text-xs text-orange-400">per blind box from supplier</p>
              </div>
              <div>
                <p className="text-xs text-orange-400 uppercase font-bold mb-1">Gross Margin per Box</p>
                <p className="text-2xl font-black text-green-600">$13</p>
                <p className="text-xs text-orange-400">before Stripe fees (~2.9% + $0.30)</p>
              </div>
              <div>
                <p className="text-xs text-orange-400 uppercase font-bold mb-1">Expected Sellback EV</p>
                <p className="text-2xl font-black text-orange-950">$14.39</p>
                <p className="text-xs text-orange-400">if user sells every item back</p>
              </div>
              <div>
                <p className="text-xs text-orange-400 uppercase font-bold mb-1">House Edge (per box)</p>
                <p className="text-2xl font-black text-orange-950">$10.61</p>
                <p className="text-xs text-orange-400">$25 − $14.39 expected sellback</p>
              </div>
              <div>
                <p className="text-xs text-orange-400 uppercase font-bold mb-1">Total Gross Revenue</p>
                <p className="text-2xl font-black text-green-600">
                  ${(totalBoxes * 13.00).toFixed(2)}
                </p>
                <p className="text-xs text-orange-400">{totalBoxes} boxes × $13.00 margin</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
