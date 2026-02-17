import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Package,
  CurrencyDollar,
  ShoppingCart,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";

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

  // Fetch inventory data
  const { data: inventory } = await supabase
    .from("inventory")
    .select("*, product:products(*)")
    .order("quantity_available", { ascending: true });

  // Fetch recent orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(10);

  // Calculate stats
  const totalInventory = inventory?.reduce(
    (sum, item) => sum + item.quantity_available,
    0
  ) || 0;

  const paidOrders = orders?.filter((o) => o.status === "paid").length || 0;
  const totalRevenue =
    orders
      ?.filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + parseFloat(o.total_amount.toString()), 0) || 0;

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-orange-950">Admin Dashboard</h1>
          <p className="text-orange-600 mt-1">PomPom Inventory & Orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ShoppingCart weight="fill" className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Paid Orders</p>
                <p className="text-2xl font-bold text-orange-950">{paidOrders}</p>
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
                <p className="text-sm text-orange-600 font-medium">Revenue</p>
                <p className="text-2xl font-bold text-orange-950">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-orange-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendUp weight="fill" className="text-2xl text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Avg Order Value
                </p>
                <p className="text-2xl font-bold text-orange-950">
                  ${paidOrders > 0 ? (totalRevenue / paidOrders).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
            <div className="p-6 border-b border-orange-100">
              <h2 className="text-xl font-bold text-orange-950">Inventory</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-orange-50">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {inventory?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-orange-950">
                          {item.product.name}
                        </div>
                        <div className="text-xs text-orange-600">
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
                          className={`font-bold ${
                            item.quantity_available <= 5
                              ? "text-red-600"
                              : item.quantity_available <= 10
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {item.quantity_available}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
            <div className="p-6 border-b border-orange-100">
              <h2 className="text-xl font-bold text-orange-950">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-600 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {orders?.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono text-orange-950">
                          {order.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            order.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : order.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-orange-950">
                        ${parseFloat(order.total_amount.toString()).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
