"use client";

import { useState, useEffect } from "react";
import { TrendUp, Package } from "@phosphor-icons/react/dist/ssr";
import { RARITY_COLORS, type RarityTier } from "@/lib/types/database";

interface BoxItem {
  name: string;
  rarity: RarityTier;
  buybackMin: number;
  buybackMax: number;
  brand: string;
  stock: number;
  imageUrl?: string;
}

interface BoxContentsProps {
  onItemClick: (item: BoxItem) => void;
}

export default function BoxContents({ onItemClick }: BoxContentsProps) {
  const [items, setItems] = useState<BoxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRarity, setSelectedRarity] = useState<RarityTier | "all">("all");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          const mapped: BoxItem[] = data.products.map(
            (p: {
              name: string;
              rarity: RarityTier;
              buyback_price: number;
              resale_value: number;
              brand: string;
              stock: number;
              image_url?: string;
            }) => ({
              name: p.name,
              rarity: p.rarity,
              buybackMin: p.buyback_price,
              buybackMax: p.resale_value,
              brand: p.brand,
              stock: p.stock,
              imageUrl: p.image_url,
            })
          );
          setItems(mapped);
        }
      })
      .catch(() => {
        // Silently fail — items list stays empty
      })
      .finally(() => setLoading(false));
  }, []);

  const totalStock = items.reduce((sum, item) => sum + item.stock, 0);

  // Define rarity sort order (ultra = highest, common = lowest)
  const rarityOrder: Record<RarityTier, number> = {
    ultra: 4,
    rare: 3,
    uncommon: 2,
    common: 1,
  };

  const filteredItems = (
    selectedRarity === "all"
      ? items
      : items.filter((item) => item.rarity === selectedRarity)
  )
    .filter((item) => item.stock > 0) // Hide items with 0 stock
    .sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]); // Sort rarest first

  const rarityTabs: Array<{ label: string; value: RarityTier | "all" }> = [
    { label: "All", value: "all" },
    { label: "Common", value: "common" },
    { label: "Uncommon", value: "uncommon" },
    { label: "Rare", value: "rare" },
    { label: "Ultra", value: "ultra" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Rarity Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 flex-shrink-0">
        {rarityTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedRarity(tab.value)}
            className={`px-2.5 py-1 rounded-full font-semibold text-xs whitespace-nowrap transition-all ${
              selectedRarity === tab.value
                ? "bg-orange-600 text-white shadow"
                : "bg-orange-50 text-orange-600 hover:bg-orange-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-orange-50 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Items List */}
      {!loading && (
        <div className="space-y-2">
          {filteredItems.map((item, index) => (
            <button
              key={`${item.name}-${index}`}
              onClick={() => onItemClick(item)}
              className={`w-full text-left p-2 rounded-xl border-2 transition-all hover:scale-[1.01] hover:shadow-md ${
                RARITY_COLORS[item.rarity].bg
              } ${RARITY_COLORS[item.rarity].border} group flex items-center gap-2`}
            >
              {/* Image / icon slot */}
              <div className="w-10 h-10 flex-shrink-0 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Package weight="fill" className={`text-xl ${RARITY_COLORS[item.rarity].text}`} />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                {/* Row 1: name + stock */}
                <div className="flex items-start justify-between gap-1 mb-0.5">
                  <div className="font-bold text-orange-950 text-xs leading-snug group-hover:text-orange-600 transition-colors min-w-0 truncate">
                    {item.name}
                  </div>
                  <div className={`text-[10px] font-semibold flex-shrink-0 ${item.stock <= 4 ? "text-red-600" : "text-orange-500"}`}>
                    {item.stock <= 4 ? "Almost gone!" : `${item.stock}`}
                  </div>
                </div>
                {/* Row 2: rarity + brand + price */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                    <span className={`${RARITY_COLORS[item.rarity].text} font-semibold uppercase text-xs flex-shrink-0`}>
                      {item.rarity}
                    </span>
                    <span className="text-orange-400 text-xs flex-shrink-0">·</span>
                    <span className="text-orange-600 text-xs truncate">{item.brand}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-green-600 font-bold text-xs flex-shrink-0">
                    <TrendUp weight="bold" className="text-xs" />
                    <span>${item.buybackMin}–${item.buybackMax}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}

          {filteredItems.length === 0 && (
            <p className="text-center text-orange-400 py-8 text-sm">
              No items in this category.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
