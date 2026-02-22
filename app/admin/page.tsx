import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Package,
  CurrencyDollar,
  Users,
  TrendUp,
  ArrowDown,
  ArrowUp,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import ShippingQueue from "@/components/admin/ShippingQueue";
import WithdrawalQueue from "@/components/admin/WithdrawalQueue";
import InventoryAlerts from "@/components/admin/InventoryAlerts";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "admin") {
    redirect("/");
  }

  // Fetch inventory data (V2 schema: inventory + products join)
  const { data: inventory } = await supabase
    .from("inventory")
    .select("*, product:products(*)")
    .order("quantity_available", { ascending: true });

  // Fetch recent balance transactions (replaces V1 "orders" table)
  const { data: recentTransactions } = await supabase
    .from("balance_transactions")
    .select("*, user:users(email)")
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch pending shipping requests
  const { data: pendingShipments } = await supabase
    .from("user_inventory")
    .select("*, user:users(email), product:products(name, sku)")
    .eq("status", "shipping_requested")
    .order("acquired_at", { ascending: true });

  // Fetch withdrawal requests (all, ordered newest completed last so pending shows first)
  const { data: withdrawalRequests } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .order("created_at", { ascending: true });

  // Fetch user count
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // Calculate stats from balance_transactions
  const topupTransactions = recentTransactions?.filter(
    (t) => t.type === "topup"
  ) ?? [];
  const boxTransactions = recentTransactions?.filter(
    (t) => t.type === "box_purchase"
  ) ?? [];

  const totalRevenue = topupTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amount.toString()),
    0
  );

  const totalInventory =
    inventory?.reduce((sum, item) => sum + item.quantity_available, 0) ?? 0;

  const lowStockItems = inventory?.filter((i) => i.quantity_available <= 5) ?? [];

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-orange-950">
              Admin Dashboard
            </h1>
            <p className="text-orange-600 mt-1">MuMu Operations</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin/metrics"
              className="text-sm font-medium text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors"
            >
              Metrics
            </a>
            <a
              href="/admin/products"
              className="text-sm font-medium text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors"
            >
              Products
            </a>
            <a
              href="/"
              className="text-sm text-orange-600 hover:text-orange-800 underline"
            >
              Back to Site
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Inventory Alerts - Enhanced with detailed tracking */}
        <InventoryAlerts />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package weight="fill" className="text-2xl text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Total Inventory
                </p>
                <p className="text-2xl font-bold text-orange-950">
                  {totalInventory}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CurrencyDollar
                  weight="fill"
                  className="text-2xl text-blue-600"
                />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Total Top-Ups
                </p>
                <p className="text-2xl font-bold text-orange-950">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendUp weight="fill" className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Boxes Opened
                </p>
                <p className="text-2xl font-bold text-orange-950">
                  {boxTransactions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users weight="fill" className="text-2xl text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Users</p>
                <p className="text-2xl font-bold text-orange-950">
                  {userCount ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Shipments — interactive client component */}
        <ShippingQueue
          initialItems={(pendingShipments ?? []).map((item) => ({
            id: item.id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            rarity: item.rarity,
            acquired_at: item.acquired_at,
            shipping_address: item.shipping_address as import("@/lib/types/database").ShippingAddress | null,
            user: item.user as { email?: string } | null,
          }))}
        />

        <WithdrawalQueue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialRequests={(withdrawalRequests ?? []) as any}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
            <div className="p-6 border-b border-orange-100">
              <h2 className="text-xl font-bold text-orange-950">
                Inventory ({inventory?.length ?? 0} SKUs)
              </h2>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-orange-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      Rarity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      Buyback
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {inventory?.map((item) => (
                    <tr key={item.id} className="hover:bg-orange-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-orange-950">
                          {item.product.name}
                        </div>
                        <div className="text-xs text-orange-500">
                          {item.product.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.product.rarity === "ultra"
                              ? "bg-purple-100 text-purple-800"
                              : item.product.rarity === "rare"
                              ? "bg-orange-100 text-orange-800"
                              : item.product.rarity === "uncommon"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.product.rarity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold text-sm ${
                            item.quantity_available <= 5
                              ? "text-red-600"
                              : item.quantity_available <= 10
                              ? "text-orange-500"
                              : "text-green-600"
                          }`}
                        >
                          {item.quantity_available}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-orange-950">
                        ${parseFloat(item.product.buyback_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
            <div className="p-6 border-b border-orange-100">
              <h2 className="text-xl font-bold text-orange-950">
                Recent Transactions
              </h2>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-orange-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {recentTransactions?.map((tx) => {
                    const isCredit = parseFloat(tx.amount.toString()) > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-orange-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isCredit ? (
                              <ArrowDown
                                weight="bold"
                                className="text-green-500 text-sm"
                              />
                            ) : (
                              <ArrowUp
                                weight="bold"
                                className="text-red-400 text-sm"
                              />
                            )}
                            <span className="text-xs font-bold capitalize text-orange-950">
                              {tx.type.replace("_", " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-orange-700 truncate max-w-[120px]">
                          {(tx.user as { email?: string })?.email ?? "—"}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm font-bold ${
                            isCredit ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {isCredit ? "+" : ""}$
                          {Math.abs(parseFloat(tx.amount.toString())).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-xs text-orange-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
