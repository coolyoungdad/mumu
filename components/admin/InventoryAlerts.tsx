"use client";

import { useEffect, useState } from "react";
import { Warning, Info, Check } from "@phosphor-icons/react/dist/ssr";

interface InventoryAlert {
  id: string;
  name: string;
  sku: string;
  rarity: string;
  quantity_available: number;
  wholesale_cost: number;
  buyback_price: number;
  alert_level: "critical" | "warning" | "low" | "ok";
}

export default function InventoryAlerts() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ critical: 0, warning: 0, low: 0, total: 0 });

  useEffect(() => {
    fetch("/api/admin/inventory-alerts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAlerts(data.alerts);
          setSummary(data.summary);
        }
      })
      .catch((err) => console.error("Failed to load inventory alerts:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 animate-pulse">
        <div className="h-6 bg-orange-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (summary.total === 0) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-start gap-3">
        <Check weight="fill" className="text-green-500 text-xl flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-green-800">All Stock Levels Healthy</p>
          <p className="text-sm text-green-700">
            No inventory alerts. All items have sufficient stock (&gt;20 units).
          </p>
        </div>
      </div>
    );
  }

  const critical = alerts.filter((a) => a.alert_level === "critical");
  const warning = alerts.filter((a) => a.alert_level === "warning");
  const low = alerts.filter((a) => a.alert_level === "low");

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      {summary.critical > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <Warning weight="fill" className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">CRITICAL: Restock Immediately</p>
            <p className="text-sm text-red-700">
              {summary.critical} product(s) have less than 5 units in stock. Restock urgently
              to avoid running out.
            </p>
          </div>
        </div>
      )}

      {summary.warning > 0 && summary.critical === 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
          <Warning weight="fill" className="text-yellow-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-yellow-800">Warning: Low Stock</p>
            <p className="text-sm text-yellow-700">
              {summary.warning} product(s) have 5-9 units remaining. Plan restocking soon.
            </p>
          </div>
        </div>
      )}

      {summary.low > 0 && summary.critical === 0 && summary.warning === 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 flex items-start gap-3">
          <Info weight="fill" className="text-orange-500 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-orange-800">Inventory Notice</p>
            <p className="text-sm text-orange-700">
              {summary.low} product(s) have 10-19 units. Monitor and order more stock.
            </p>
          </div>
        </div>
      )}

      {/* Detailed List */}
      <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-orange-100">
          <h3 className="font-bold text-orange-950">Inventory Alerts ({summary.total})</h3>
          <p className="text-xs text-orange-600 mt-1">
            Sorted by urgency (ultra/rare first, then lowest stock)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 border-b border-orange-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-orange-800">Level</th>
                <th className="px-4 py-3 text-left font-semibold text-orange-800">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-orange-800">SKU</th>
                <th className="px-4 py-3 text-left font-semibold text-orange-800">Rarity</th>
                <th className="px-4 py-3 text-right font-semibold text-orange-800">Stock</th>
                <th className="px-4 py-3 text-right font-semibold text-orange-800">COGS</th>
                <th className="px-4 py-3 text-right font-semibold text-orange-800">Buyback</th>
              </tr>
            </thead>
            <tbody>
              {critical.map((item) => (
                <tr key={item.id} className="border-b border-orange-50 bg-red-50 hover:bg-red-100">
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                      CRITICAL
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-red-900">{item.name}</td>
                  <td className="px-4 py-3 text-red-700 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold uppercase text-red-700">
                      {item.rarity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    {item.quantity_available}
                  </td>
                  <td className="px-4 py-3 text-right text-red-700">
                    ${item.wholesale_cost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-700">
                    ${item.buyback_price.toFixed(2)}
                  </td>
                </tr>
              ))}

              {warning.map((item) => (
                <tr key={item.id} className="border-b border-orange-50 bg-yellow-50 hover:bg-yellow-100">
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded">
                      WARNING
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-yellow-900">{item.name}</td>
                  <td className="px-4 py-3 text-yellow-700 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold uppercase text-yellow-700">
                      {item.rarity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-yellow-600">
                    {item.quantity_available}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-700">
                    ${item.wholesale_cost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-700">
                    ${item.buyback_price.toFixed(2)}
                  </td>
                </tr>
              ))}

              {low.map((item) => (
                <tr key={item.id} className="border-b border-orange-50 hover:bg-orange-50">
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 bg-orange-400 text-white text-xs font-bold rounded">
                      LOW
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-orange-900">{item.name}</td>
                  <td className="px-4 py-3 text-orange-700 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold uppercase text-orange-700">
                      {item.rarity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-orange-600">
                    {item.quantity_available}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-700">
                    ${item.wholesale_cost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-700">
                    ${item.buyback_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-orange-50 border-t border-orange-100 text-xs text-orange-600">
          <p>
            <strong>Alert Levels:</strong> Critical (&lt;5), Warning (5-9), Low (10-19).
            Ultra/rare items prioritized. Check stock daily.
          </p>
        </div>
      </div>
    </div>
  );
}
