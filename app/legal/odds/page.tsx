export default function OddsPage() {
  const rarities = [
    {
      tier: "Common",
      probability: 70.5,
      color: "bg-gray-50 border-gray-200",
      badge: "bg-gray-100 text-gray-700",
      buyback: "$8",
      count: 30,
      description: "Pop Mart and Sanrio classics — the core of every collection.",
    },
    {
      tier: "Uncommon",
      probability: 25,
      color: "bg-blue-50 border-blue-200",
      badge: "bg-blue-100 text-blue-700",
      buyback: "$25",
      count: 13,
      description: "Fan favourites and limited variants with real resale value.",
    },
    {
      tier: "Rare",
      probability: 4,
      color: "bg-orange-50 border-orange-200",
      badge: "bg-orange-100 text-orange-700",
      buyback: "$50",
      count: 5,
      description: "The Skullpanda emotion series — highly sought by collectors.",
    },
    {
      tier: "Ultra",
      probability: 0.5,
      color: "bg-purple-50 border-purple-200",
      badge: "bg-purple-100 text-purple-700",
      buyback: "$100",
      count: 2,
      description: "The rarest pulls in the box. Hirono and Skullpanda ultra editions.",
    },
  ];

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-orange-950 mb-2">Odds Disclosure</h1>
        <p className="text-orange-500 mb-4">Last updated: February 2026</p>
        <p className="text-orange-700 mb-10">
          Every PomPom mystery box is <strong>$25</strong> and contains one randomly selected physical collectible.
          Below are the exact probabilities for each rarity tier. These odds are applied per box opened and do not change based on previous results.
        </p>

        <div className="space-y-4 mb-12">
          {rarities.map((r) => (
            <div key={r.tier} className={`rounded-2xl border-2 p-6 ${r.color}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${r.badge}`}>
                    {r.tier}
                  </span>
                  <span className="text-sm text-orange-600">{r.count} unique item{r.count !== 1 ? "s" : ""}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-orange-950">{r.probability}%</div>
                  <div className="text-xs text-orange-500">probability</div>
                </div>
              </div>
              <div className="w-full bg-white/60 rounded-full h-3 mb-3">
                <div
                  className="h-3 rounded-full bg-orange-400"
                  style={{ width: `${r.probability}%` }}
                />
              </div>
              <p className="text-sm text-orange-700">{r.description}</p>
              <p className="text-xs text-orange-500 mt-1">
                PomPom buyback price: <strong>{r.buyback}</strong>
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-orange-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-orange-950 mb-3">How Randomisation Works</h2>
          <p className="text-sm text-orange-700 mb-3">
            When you open a box, our system uses a PostgreSQL database function to randomly select a product from available inventory weighted by rarity. The selection is made server-side at the moment you open the box — no outcomes are pre-determined.
          </p>
          <p className="text-sm text-orange-700">
            Inventory is finite. When a specific item sells out, the next pull within that rarity tier is drawn from remaining items in that tier. If a tier is fully out of stock, the system falls back to the nearest available tier.
          </p>
        </div>

        <div className="bg-orange-100 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-orange-950 mb-2">Expected Value Example</h2>
          <p className="text-sm text-orange-700 mb-3">
            If a user opened a box and immediately sold back every item at the PomPom buyback price:
          </p>
          <div className="space-y-1 text-sm font-mono text-orange-800">
            <div className="flex justify-between"><span>70.5% × $8 (Common)</span><span>= $5.64</span></div>
            <div className="flex justify-between"><span>25% × $25 (Uncommon)</span><span>= $6.25</span></div>
            <div className="flex justify-between"><span>4% × $50 (Rare)</span><span>= $2.00</span></div>
            <div className="flex justify-between"><span>0.5% × $100 (Ultra)</span><span>= $0.50</span></div>
            <div className="flex justify-between border-t border-orange-300 pt-1 font-bold">
              <span>Expected sellback value</span><span>= $14.39</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Box price</span><span>= $25</span>
            </div>
          </div>
          <p className="text-xs text-orange-500 mt-3">
            Note: Most users keep some items rather than selling everything back. The real value is in the collectibles themselves.
          </p>
        </div>

        <div className="text-sm text-orange-500 space-y-1">
          <p>Purchasing a box does not guarantee any specific item or outcome.</p>
          <p>Results of one box opening do not affect subsequent openings.</p>
          <p>PomPom reserves the right to update its product catalog and inventory levels.</p>
        </div>

        <div className="mt-12 pt-8 border-t border-orange-200">
          <a href="/" className="text-orange-600 hover:underline text-sm">← Back to PomPom</a>
        </div>
      </div>
    </div>
  );
}
