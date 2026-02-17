"use client";

import { useState, useEffect } from "react";
import { Package, TrendUp } from "@phosphor-icons/react/dist/ssr";
import { RARITY_COLORS, type RarityTier } from "@/lib/types/database";

interface BoxItem {
  name: string;
  rarity: RarityTier;
  buybackMin: number;
  buybackMax: number;
  brand: string;
  stock: number;
}

const INITIAL_ITEMS: BoxItem[] = [
  // Common items (30 items)
  { name: "Aries Molly", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 180 },
  { name: "Astronaut Dimoo", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 175 },
  { name: "Ballet Girl Molly", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 168 },
  { name: "Beach Time Hangyodon", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Sanrio", stock: 192 },
  { name: "Bee Elf Labubu", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 156 },
  { name: "Bunny Pajamas My Melody", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Sanrio", stock: 203 },
  { name: "Carnival Dancer Labubu", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 188 },
  { name: "Chef Molly", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 171 },
  { name: "Christmas Baby Pucky", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 165 },
  { name: "Circus Ringmaster Labubu", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 179 },
  { name: "Clown Labubu", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 194 },
  { name: "Cloud Traveler Dimoo", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 182 },
  { name: "Flower Elf Labubu", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 177 },
  { name: "Forest Baby Pucky", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 169 },
  { name: "Gothic Dress Kuromi", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Sanrio", stock: 198 },
  { name: "Ice Cream Labubu", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 186 },
  { name: "Milk Tea Cinnamoroll", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Sanrio", stock: 201 },
  { name: "Monster Baby Pucky", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 174 },
  { name: "Moonlight Dimoo", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 189 },
  { name: "Pajama Time Pompompurin", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Sanrio", stock: 196 },
  { name: "Party Queen Kuromi", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Sanrio", stock: 183 },
  { name: "Pisces Molly", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 167 },
  { name: "Planet Explorer Dimoo", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 191 },
  { name: "Pudding Chef Pompompurin", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Sanrio", stock: 205 },
  { name: "Rainy Day Keroppi", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Sanrio", stock: 178 },
  { name: "Retro TV Molly", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 172 },
  { name: "Rock Star Badtz-Maru", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Sanrio", stock: 187 },
  { name: "Rose Elf Labubu", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 195 },
  { name: "Sakura Kimono Hello Kitty", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Sanrio", stock: 210 },
  { name: "Schoolgirl Molly", rarity: "common", buybackMin: 8, buybackMax: 15, brand: "Pop Mart", stock: 173 },

  // Uncommon items (13 items)
  { name: "Shadow Labubu", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Pop Mart", stock: 65 },
  { name: "Sky Angel Cinnamoroll", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Sanrio", stock: 72 },
  { name: "Sleeping Baby Pucky", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Pop Mart", stock: 58 },
  { name: "Sleeping Deer Dimoo", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Pop Mart", stock: 61 },
  { name: "Space Bunny Dimoo", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Pop Mart", stock: 68 },
  { name: "Space Molly", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Pop Mart", stock: 54 },
  { name: "Stargazer Dimoo", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Pop Mart", stock: 63 },
  { name: "Starry Night Little Twin Stars", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Sanrio", stock: 75 },
  { name: "Strawberry Dress Hello Kitty", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Sanrio", stock: 79 },
  { name: "Strawberry Macaron Labubu", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Pop Mart", stock: 56 },
  { name: "Sweet Tooth Labubu", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Pop Mart", stock: 62 },
  { name: "Tea Party My Melody", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Sanrio", stock: 71 },
  { name: "Winter Coat Tuxedosam", rarity: "uncommon", buybackMin: 25, buybackMax: 40, brand: "Sanrio", stock: 67 },

  // Rare items (5 items)
  { name: "The Awakening Skullpanda", rarity: "rare", buybackMin: 50, buybackMax: 80, brand: "Pop Mart", stock: 18 },
  { name: "The Grief Skullpanda", rarity: "rare", buybackMin: 50, buybackMax: 80, brand: "Pop Mart", stock: 15 },
  { name: "The Joy Skullpanda", rarity: "rare", buybackMin: 50, buybackMax: 80, brand: "Pop Mart", stock: 21 },
  { name: "The Obsession Skullpanda", rarity: "rare", buybackMin: 50, buybackMax: 80, brand: "Pop Mart", stock: 16 },
  { name: "The Riddle Skullpanda", rarity: "rare", buybackMin: 50, buybackMax: 80, brand: "Pop Mart", stock: 19 },

  // Ultra items (2 items)
  { name: "The Other One Hirono", rarity: "ultra", buybackMin: 150, buybackMax: 300, brand: "Pop Mart", stock: 3 },
  { name: "The Warmth Skullpanda", rarity: "ultra", buybackMin: 150, buybackMax: 300, brand: "Pop Mart", stock: 5 },
];

interface BoxContentsProps {
  onItemClick: (item: BoxItem) => void;
}

export default function BoxContents({ onItemClick }: BoxContentsProps) {
  const [items, setItems] = useState<BoxItem[]>(INITIAL_ITEMS);
  const [selectedRarity, setSelectedRarity] = useState<RarityTier | "all">("all");

  // Simulate live stock updates
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => prev.map(item => ({
        ...item,
        stock: Math.max(0, item.stock - Math.floor(Math.random() * 3)) // Random decrease 0-2
      })));
    }, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, []);

  const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
  const filteredItems = selectedRarity === "all"
    ? items
    : items.filter(item => item.rarity === selectedRarity);

  const rarityTabs: Array<{ label: string; value: RarityTier | "all" }> = [
    { label: "All", value: "all" },
    { label: "Common", value: "common" },
    { label: "Uncommon", value: "uncommon" },
    { label: "Rare", value: "rare" },
    { label: "Ultra", value: "ultra" },
  ];

  return (
    <div className="glass-card-white rounded-2xl p-6 h-[calc(100vh-180px)] flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-orange-950">What&apos;s in the Box?</h2>
          <div className="bg-orange-50 px-4 py-2 rounded-full">
            <div className="text-xs text-orange-600 font-semibold">Total Stock</div>
            <div className="text-xl font-bold text-orange-950">{totalStock.toLocaleString()}</div>
          </div>
        </div>

        {/* Rarity Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {rarityTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setSelectedRarity(tab.value)}
              className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                selectedRarity === tab.value
                  ? "bg-orange-600 text-white shadow-lg"
                  : "bg-orange-50 text-orange-600 hover:bg-orange-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Items List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {filteredItems.map((item, index) => (
          <button
            key={`${item.name}-${index}`}
            onClick={() => onItemClick(item)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-lg ${
              RARITY_COLORS[item.rarity].bg
            } ${RARITY_COLORS[item.rarity].border} group`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg">
                <Package weight="fill" className={`text-2xl ${RARITY_COLORS[item.rarity].text}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-orange-950 truncate group-hover:text-orange-600 transition-colors">
                  {item.name}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`${RARITY_COLORS[item.rarity].text} font-semibold uppercase text-xs`}>
                    {item.rarity}
                  </span>
                  <span className="text-orange-400">•</span>
                  <span className="text-orange-600">{item.brand}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600 font-bold mb-1">
                  <TrendUp weight="bold" className="text-sm" />
                  <span className="text-sm">${item.buybackMin}-${item.buybackMax}</span>
                </div>
                <div className={`text-xs font-semibold ${
                  item.stock < 20 ? "text-red-600" : "text-orange-500"
                }`}>
                  {item.stock} left
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(251, 146, 60, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 146, 60, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 146, 60, 0.5);
        }
      `}</style>
    </div>
  );
}
