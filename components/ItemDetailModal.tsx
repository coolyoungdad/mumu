"use client";

import { X, Package, TrendUp, Tag, Storefront } from "@phosphor-icons/react/dist/ssr";
import { RARITY_COLORS, type RarityTier } from "@/lib/types/database";

interface ItemDetailModalProps {
  item: {
    name: string;
    rarity: RarityTier;
    buybackMin: number;
    buybackMax: number;
    brand: string;
    stock: number;
  } | null;
  onClose: () => void;
}

export default function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-all shadow-lg"
        >
          <X weight="bold" className="text-2xl text-orange-950" />
        </button>

        {/* Header with Rarity Color */}
        <div className={`${RARITY_COLORS[item.rarity].bg} ${RARITY_COLORS[item.rarity].border} border-b-4 p-8`}>
          <div className="flex items-center gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <Package weight="fill" className={`text-6xl ${RARITY_COLORS[item.rarity].text}`} />
            </div>
            <div className="flex-1">
              <div className={`inline-block ${RARITY_COLORS[item.rarity].bg} ${RARITY_COLORS[item.rarity].text} px-4 py-1 rounded-full font-bold uppercase text-xs mb-3`}>
                {item.rarity}
              </div>
              <h2 className="text-3xl font-bold text-orange-950 mb-2">
                {item.name}
              </h2>
              <div className="flex items-center gap-2 text-orange-600">
                <Storefront weight="fill" className="text-lg" />
                <span className="font-semibold">{item.brand}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Buyback Value */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendUp weight="fill" className="text-2xl text-green-600" />
                <h3 className="font-bold text-green-900">Sell Back Value</h3>
              </div>
              <div className="text-3xl font-bold text-green-600">
                ${item.buybackMin} - ${item.buybackMax}
              </div>
              <p className="text-sm text-green-700 mt-2">
                Instant cash when you sell this item back
              </p>
            </div>

            {/* Stock Remaining */}
            <div className={`rounded-2xl p-6 border-2 ${
              item.stock < 20
                ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-200"
                : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Tag weight="fill" className={`text-2xl ${item.stock < 20 ? "text-red-600" : "text-orange-600"}`} />
                <h3 className={`font-bold ${item.stock < 20 ? "text-red-900" : "text-orange-900"}`}>
                  Stock Remaining
                </h3>
              </div>
              <div className={`text-3xl font-bold ${item.stock < 20 ? "text-red-600" : "text-orange-600"}`}>
                {item.stock}
              </div>
              {item.stock < 20 && (
                <p className="text-sm text-red-700 mt-2 font-semibold">
                  ⚡ Low stock! Act fast
                </p>
              )}
              {item.stock >= 20 && (
                <p className="text-sm text-orange-700 mt-2">
                  Available in this box
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-100">
            <h3 className="font-bold text-orange-950 mb-3 text-lg">About This Item</h3>
            <p className="text-orange-800 leading-relaxed">
              <strong>{item.name}</strong> is a {item.rarity} collectible from <strong>{item.brand}</strong>.
              {item.rarity === "ultra" && " This is an ultra-rare item with extremely limited availability!"}
              {item.rarity === "rare" && " This rare item is highly sought after by collectors."}
              {item.rarity === "uncommon" && " An uncommon find that stands out from the crowd."}
              {item.rarity === "common" && " A charming collectible perfect for any collection."}
              {" "}Open a mystery box for a chance to win this item and sell it back for <strong>${item.buybackMin}-${item.buybackMax}</strong>!
            </p>
          </div>

          {/* Probability Info */}
          <div className="mt-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-4 border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-orange-700 font-semibold mb-1">Drop Rate</div>
                <div className="text-lg font-bold text-orange-950">
                  {item.rarity === "common" && "60% chance"}
                  {item.rarity === "uncommon" && "25% chance"}
                  {item.rarity === "rare" && "10% chance"}
                  {item.rarity === "ultra" && "5% chance"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-orange-700 font-semibold mb-1">From Brand</div>
                <div className="text-lg font-bold text-orange-950">{item.brand}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
