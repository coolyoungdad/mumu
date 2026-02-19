"use client";

import { useState, useEffect } from "react";
import { TrendUp, Package, X } from "@phosphor-icons/react/dist/ssr";
import { RARITY_COLORS, type RarityTier } from "@/lib/types/database";

interface BoxItem {
  id: string;
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
  eliminatedIds?: string[];
}

export default function BoxContents({ onItemClick, eliminatedIds = [] }: BoxContentsProps) {
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
              id: string;
              name: string;
              rarity: RarityTier;
              buyback_price: number;
              resale_value: number;
              brand: string;
              stock: number;
              image_url?: string;
            }) => ({
              id: p.id,
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

  const hasShake = eliminatedIds.length > 0;

  // Define rarity sort order (ultra = highest, common = lowest)
  const rarityOrder: Record<RarityTier, number> = {
    ultra: 4,
    rare: 3,
    uncommon: 2,
    common: 1,
  };

  const allFiltered = (
    selectedRarity === "all"
      ? items
      : items.filter((item) => item.rarity === selectedRarity)
  ).filter((item) => item.stock > 0);

  // Always sort by rarity — eliminated items stay in place, crossed out
  const sortedItems = allFiltered.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);

  const survivorCount = hasShake
    ? allFiltered.filter((i) => !eliminatedIds.includes(i.id)).length
    : null;

  const rarityTabs: Array<{ label: string; value: RarityTier | "all" }> = [
    { label: "All", value: "all" },
    { label: "Common", value: "common" },
    { label: "Uncommon", value: "uncommon" },
    { label: "Rare", value: "rare" },
    { label: "Ultra", value: "ultra" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Shake summary banner */}
      {hasShake && (
        <div className="mb-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl flex-shrink-0">
          <p className="text-xs font-bold text-orange-700 text-center">
            🎲 {survivorCount} items still possible
          </p>
          <p className="text-[10px] text-orange-500 text-center mt-0.5">
            Crossed out = eliminated by shake
          </p>
        </div>
      )}

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
          {sortedItems.map((item, index) => {
            const isEliminated = hasShake && eliminatedIds.includes(item.id);
            return (
              <button
                key={`${item.id}-${index}`}
                onClick={() => !isEliminated && onItemClick(item)}
                disabled={isEliminated}
                className={`w-full text-left p-2 rounded-xl border-2 transition-all flex items-center gap-2 relative ${
                  isEliminated
                    ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-200"
                    : `hover:scale-[1.01] hover:shadow-md ${RARITY_COLORS[item.rarity].bg} ${RARITY_COLORS[item.rarity].border} group${item.stock <= 2 ? " low-stock-shake" : ""}`
                }`}
              >
                {/* Image / icon slot */}
                <div className="w-10 h-10 flex-shrink-0 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package
                      weight="fill"
                      className={`text-xl ${isEliminated ? "text-gray-400" : RARITY_COLORS[item.rarity].text}`}
                    />
                  )}
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: name + stock */}
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <div className={`font-bold text-xs leading-snug min-w-0 truncate ${
                      isEliminated
                        ? "line-through text-gray-400"
                        : "text-orange-950 group-hover:text-orange-600 transition-colors"
                    }`}>
                      {item.name}
                    </div>
                    {!isEliminated && (
                      <div className={`text-[10px] font-semibold flex-shrink-0 ${item.stock <= 2 ? "text-red-600" : "text-orange-500"}`}>
                        {item.stock}
                      </div>
                    )}
                  </div>
                  {/* Row 2: rarity + brand + price */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                      <span className={`font-semibold uppercase text-xs flex-shrink-0 ${
                        isEliminated ? "text-gray-400" : RARITY_COLORS[item.rarity].text
                      }`}>
                        {item.rarity}
                      </span>
                      {!isEliminated && (
                        <>
                          <span className="text-orange-400 text-xs flex-shrink-0">·</span>
                          <span className="text-orange-600 text-xs truncate">{item.brand}</span>
                        </>
                      )}
                    </div>
                    {!isEliminated && (
                      <div className="flex items-center gap-0.5 text-green-600 font-bold text-xs flex-shrink-0">
                        <TrendUp weight="bold" className="text-xs" />
                        <span>${item.buybackMin}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Eliminated X badge */}
                {isEliminated && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-400 flex items-center justify-center">
                    <X weight="bold" className="text-white text-xs" />
                  </div>
                )}
              </button>
            );
          })}

          {sortedItems.length === 0 && (
            <p className="text-center text-orange-400 py-8 text-sm">
              No items in this category.
            </p>
          )}
        </div>
      )}
      <style>{`
        @keyframes low-stock-wiggle {
          0%, 85%, 100% { transform: rotate(0deg); }
          87% { transform: rotate(-2deg); }
          90% { transform: rotate(2deg); }
          93% { transform: rotate(-2deg); }
          96% { transform: rotate(2deg); }
          99% { transform: rotate(0deg); }
        }
        .low-stock-shake {
          animation: low-stock-wiggle 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
