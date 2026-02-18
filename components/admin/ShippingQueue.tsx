"use client";

import { useState } from "react";
import { Truck, CheckCircle, X } from "@phosphor-icons/react/dist/ssr";
import type { ShippingAddress } from "@/lib/types/database";

interface ShipmentItem {
  id: string;
  product_name: string;
  product_sku: string;
  rarity: string;
  acquired_at: string;
  shipping_address: ShippingAddress | null;
  user: { email?: string } | null;
}

interface Props {
  initialItems: ShipmentItem[];
}

export default function ShippingQueue({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function markShipped(itemId: string) {
    setLoading(itemId);
    const res = await fetch("/api/admin/ship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inventory_item_id: itemId,
        tracking_number: trackingInputs[itemId] || null,
      }),
    });
    setLoading(null);
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setConfirming(null);
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to mark as shipped");
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center">
        <CheckCircle weight="fill" className="text-green-400 text-4xl mx-auto mb-3" />
        <p className="font-bold text-orange-950">No pending shipments</p>
        <p className="text-sm text-orange-400 mt-1">All shipping requests have been fulfilled.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
      <div className="p-6 border-b border-orange-100 flex items-center gap-3">
        <Truck weight="fill" className="text-orange-600 text-xl" />
        <h2 className="text-xl font-bold text-orange-950">
          Pending Shipments ({items.length})
        </h2>
      </div>

      <div className="divide-y divide-orange-50">
        {items.map((item) => {
          const addr = item.shipping_address;
          const isConfirming = confirming === item.id;

          return (
            <div key={item.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                        item.rarity === "ultra"
                          ? "bg-purple-100 text-purple-800"
                          : item.rarity === "rare"
                          ? "bg-orange-100 text-orange-800"
                          : item.rarity === "uncommon"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.rarity}
                    </span>
                    <span className="text-xs text-orange-400">
                      {new Date(item.acquired_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-bold text-orange-950">{item.product_name}</p>
                  <p className="text-xs text-orange-400">{item.product_sku}</p>
                  <p className="text-sm text-orange-600 mt-1">
                    {item.user?.email ?? "Unknown user"}
                  </p>
                </div>

                {/* Shipping address */}
                {addr ? (
                  <div className="text-sm text-orange-700 bg-orange-50 rounded-xl p-3 min-w-[200px]">
                    <p className="font-bold text-orange-950">{addr.name}</p>
                    <p>{addr.line1}</p>
                    {addr.line2 && <p>{addr.line2}</p>}
                    <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                    <p>{addr.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-orange-400 italic">No address on file</p>
                )}

                {/* Action */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  {!isConfirming ? (
                    <button
                      onClick={() => setConfirming(item.id)}
                      className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-green-700 transition-colors text-sm"
                    >
                      Mark as Shipped
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Tracking number (optional)"
                        value={trackingInputs[item.id] ?? ""}
                        onChange={(e) =>
                          setTrackingInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => markShipped(item.id)}
                          disabled={loading === item.id}
                          className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                        >
                          {loading === item.id ? "Saving…" : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirming(null)}
                          className="w-9 flex items-center justify-center bg-orange-50 text-orange-400 hover:bg-orange-100 rounded-xl transition-colors"
                        >
                          <X weight="bold" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
