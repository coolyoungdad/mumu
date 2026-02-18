"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Package,
  Truck,
  Wallet,
  Lightning,
  Crown,
  CurrencyDollar,
} from "@phosphor-icons/react/dist/ssr";
import { RARITY_COLORS, type UserInventoryItem } from "@/lib/types/database";
import Navbar from "@/components/Navbar";
import { onBalanceUpdate, dispatchBalanceUpdate } from "@/lib/events/balance";

type Tab = "collection" | "history" | "shipping";

interface WithdrawalForm {
  amount: string;
  paypal_email: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface ShippingForm {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

function getMemberTier(totalUnboxed: number) {
  if (totalUnboxed >= 50) return { label: "Gold Member", color: "bg-yellow-100 text-yellow-700" };
  if (totalUnboxed >= 20) return { label: "Silver Member", color: "bg-slate-100 text-slate-600" };
  if (totalUnboxed >= 5)  return { label: "Bronze Member", color: "bg-orange-100 text-orange-700" };
  return { label: "Starter", color: "bg-orange-50 text-orange-500" };
}

function getLevel(totalUnboxed: number) {
  const totalXP = totalUnboxed * 100;
  const level = Math.floor(totalXP / 1000) + 1;
  const currentXP = totalXP % 1000;
  const progress = Math.min((currentXP / 1000) * 100, 100);
  return { level, currentXP, progress };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [shippedItems, setShippedItems] = useState<UserInventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalUnboxed, setTotalUnboxed] = useState(0);
  const [totalSoldBack, setTotalSoldBack] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("collection");
  const [sellbackLoading, setSellbackLoading] = useState<string | null>(null);
  const [pendingShipments, setPendingShipments] = useState<UserInventoryItem[]>([]);
  const [shippingModal, setShippingModal] = useState<{ open: boolean; item: UserInventoryItem | null }>({ open: false, item: null });
  const [shippingForm, setShippingForm] = useState<ShippingForm>({ name: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "US" });
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState<WithdrawalForm>({ amount: "", paypal_email: "" });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  useEffect(() => {
    loadProfile();
    const unsubscribe = onBalanceUpdate(({ newBalance }) => setBalance(newBalance));
    return () => unsubscribe();
  }, []);

  const loadProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login?redirect=/profile");
      return;
    }

    setUser(user);

    const [{ data: userData }, { data: allItems }, { data: txData }] = await Promise.all([
      supabase.from("users").select("account_balance").eq("id", user.id).single(),
      supabase.from("user_inventory").select("*").eq("user_id", user.id).order("acquired_at", { ascending: false }),
      supabase.from("balance_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    if (userData) {
      setBalance(userData.account_balance);
      dispatchBalanceUpdate(userData.account_balance, "initial_load");
    }
    if (allItems) {
      setInventory(allItems.filter((i: any) => i.status === "kept") as UserInventoryItem[]);
      setShippedItems(allItems.filter((i: any) => i.status === "shipped") as UserInventoryItem[]);
      setPendingShipments(allItems.filter((i: any) => i.status === "shipping_requested") as UserInventoryItem[]);
      setTotalUnboxed(allItems.length);
      setTotalSoldBack(allItems.filter((i: any) => i.status === "sold").length);
    }
    if (txData) setTransactions(txData as Transaction[]);

    setIsLoading(false);
  };

  const handleSellBack = async (item: UserInventoryItem) => {
    setSellbackLoading(item.id);
    try {
      const response = await fetch("/api/box/sellback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory_item_id: item.id, buyback_price: item.buyback_price }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setBalance(data.new_balance);
      dispatchBalanceUpdate(data.new_balance, "sellback");
      setInventory(prev => prev.filter(i => i.id !== item.id));
      setTotalSoldBack(prev => prev + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to sell back");
    } finally {
      setSellbackLoading(null);
    }
  };

  const handleShipItem = (item: UserInventoryItem) => {
    setShippingError("");
    setShippingForm({ name: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "US" });
    setShippingModal({ open: true, item });
  };

  const handleShippingSubmit = async () => {
    if (!shippingModal.item) return;
    setShippingLoading(true);
    setShippingError("");
    try {
      const response = await fetch("/api/shipping/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory_item_id: shippingModal.item.id,
          address: shippingForm,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      // Move item from inventory to pendingShipments
      setInventory(prev => prev.filter(i => i.id !== shippingModal.item!.id));
      setPendingShipments(prev => [...prev, { ...shippingModal.item!, status: "shipping_requested" }]);
      setShippingModal({ open: false, item: null });
    } catch (err) {
      setShippingError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setShippingLoading(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    setWithdrawLoading(true);
    setWithdrawError("");
    setWithdrawSuccess("");
    try {
      const response = await fetch("/api/withdraw/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(withdrawForm.amount),
          paypal_email: withdrawForm.paypal_email,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setBalance(data.new_balance);
      dispatchBalanceUpdate(data.new_balance, "withdrawal");
      setWithdrawSuccess(data.message);
      setWithdrawForm({ amount: "", paypal_email: "" });
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : "Failed to submit withdrawal");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#FFF5F0] min-h-screen flex items-center justify-center">
        <div className="text-orange-600 text-xl font-bold">Loading...</div>
      </div>
    );
  }

  const emailName = user?.email?.split("@")[0] ?? "User";
  const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
  const initial = displayName.charAt(0).toUpperCase();
  const tier = getMemberTier(totalUnboxed);
  const { level, currentXP, progress } = getLevel(totalUnboxed);
  const collectionValue = inventory.reduce((sum, item) => sum + Number(item.buyback_price), 0);
  const recentTx = transactions.slice(0, 3);

  const tabs: { id: Tab; label: string }[] = [
    { id: "collection", label: `My Collection (${inventory.length})` },
    { id: "history",    label: "History" },
    { id: "shipping",   label: `Pending Shipping (${pendingShipments.length})` },
  ];

  return (
    <div className="bg-[#FFF5F0] min-h-screen">
      <Navbar />

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Top row: Profile card + Balance card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

            {/* Profile card */}
            <div
              className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 border border-orange-100/50"
              style={{ boxShadow: "0 10px 30px -5px rgba(255,77,77,0.08)" }}
            >
              {/* Dot pattern decoration */}
              <div
                className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-5"
                style={{ backgroundImage: "radial-gradient(circle, #FF6B4A 1px, transparent 1.5px)", backgroundSize: "16px 16px" }}
              />

              {/* Avatar + level badge */}
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 rounded-full border-4 border-orange-100 flex items-center justify-center bg-orange-50">
                  <span className="text-5xl font-extrabold text-orange-400">{initial}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 border-white">
                  {level}
                </div>
              </div>

              {/* Name + tier + XP */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                  <h1 className="text-3xl font-extrabold text-orange-950">{displayName}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${tier.color}`}>
                    <Crown weight="fill" className="text-sm" /> {tier.label}
                  </span>
                </div>

                <div className="w-full mb-2">
                  <div className="flex justify-between text-sm font-bold text-orange-950 mb-2">
                    <span>Level {level} Progress</span>
                    <span>{currentXP} / 1,000 XP</span>
                  </div>
                  <div className="h-4 w-full bg-orange-50 rounded-full overflow-hidden p-1">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, boxShadow: "0 0 15px rgba(255,176,136,0.5)" }}
                    />
                  </div>
                </div>
                <p className="text-sm text-orange-800/60 font-medium">Each box opened = 100 XP</p>
              </div>

              {/* Stats */}
              <div className="flex gap-8 md:border-l border-orange-100 md:pl-8 flex-shrink-0">
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-950">{totalUnboxed}</div>
                  <div className="text-xs font-bold text-orange-400 uppercase tracking-widest">Unboxed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-950">{totalSoldBack}</div>
                  <div className="text-xs font-bold text-orange-400 uppercase tracking-widest">Sold Back</div>
                </div>
              </div>
            </div>

            {/* Balance card */}
            <div
              className="bg-gradient-to-br from-orange-600 to-red-500 rounded-[2.5rem] p-8 text-white flex flex-col justify-between"
              style={{ boxShadow: "0 10px 30px -5px rgba(255,77,77,0.08)" }}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-sm font-bold uppercase tracking-widest opacity-80">Current Balance</span>
                  <Wallet weight="fill" className="text-2xl opacity-40" />
                </div>
                <div className="text-5xl font-black mb-2">${balance.toFixed(2)}</div>
                <div className="text-orange-100/70 text-sm font-medium">
                  {inventory.length} item{inventory.length !== 1 ? "s" : ""} · ${collectionValue.toFixed(2)} value
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => router.push("/topup")}
                  className="flex-1 bg-white text-orange-600 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-transform"
                >
                  Deposit
                </button>
                <button
                  onClick={() => {
                    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
                      alert("Withdrawals are disabled in demo mode.");
                      return;
                    }
                    setWithdrawError("");
                    setWithdrawSuccess("");
                    setWithdrawForm({ amount: "", paypal_email: "" });
                    setWithdrawModal(true);
                  }}
                  className="flex-1 bg-orange-950/20 border border-white/20 text-white py-3 rounded-2xl font-bold text-sm hover:bg-orange-950/30 transition-colors"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex items-center gap-8 border-b border-orange-200/50 mb-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 font-bold whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id ? "text-orange-950" : "text-orange-400 hover:text-orange-600"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main area */}
            <div className="lg:col-span-2">

              {/* Collection */}
              {activeTab === "collection" && (
                inventory.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-16 text-center" style={{ boxShadow: "0 10px 30px -5px rgba(255,77,77,0.08)" }}>
                    <Package weight="fill" className="text-6xl text-orange-200 mx-auto mb-4" />
                    <p className="text-orange-600 font-medium mb-6">No items in your collection yet.</p>
                    <button
                      onClick={() => router.push("/box")}
                      className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-orange-700 transition-colors"
                    >
                      Open Your First Box
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {inventory.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-5 rounded-[2rem] border border-orange-50 group hover:-translate-y-1 transition-all"
                        style={{ boxShadow: "0 10px 30px -5px rgba(255,77,77,0.08)" }}
                      >
                        <div className={`relative aspect-square ${RARITY_COLORS[item.rarity].bg} rounded-2xl mb-4 flex items-center justify-center overflow-hidden`}>
                          <Package weight="fill" className={`text-7xl ${RARITY_COLORS[item.rarity].text} opacity-50 group-hover:scale-110 transition-transform duration-300`} />
                          <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-1 rounded-full uppercase border ${RARITY_COLORS[item.rarity].bg} ${RARITY_COLORS[item.rarity].text} ${RARITY_COLORS[item.rarity].border}`}>
                            {item.rarity}
                          </div>
                        </div>
                        <div className="mb-4">
                          <h4 className="font-bold text-orange-950 truncate">{item.product_name}</h4>
                          <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">
                            Value: ${Number(item.buyback_price).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShipItem(item)}
                            className="flex-1 bg-orange-600 text-white py-2 rounded-xl font-bold text-xs hover:bg-orange-700 transition-colors"
                          >
                            Ship Item
                          </button>
                          <button
                            onClick={() => handleSellBack(item)}
                            disabled={sellbackLoading === item.id}
                            className="flex-1 bg-orange-50 text-orange-600 py-2 rounded-xl font-bold text-xs hover:bg-orange-100 transition-colors disabled:opacity-50"
                          >
                            {sellbackLoading === item.id ? "Selling..." : "Sell Back"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* History */}
              {activeTab === "history" && (
                <div className="bg-white rounded-[2rem] p-6" style={{ boxShadow: "0 10px 30px -5px rgba(255,77,77,0.08)" }}>
                  <h3 className="font-bold text-orange-950 mb-6 text-lg">Transaction History</h3>
                  {transactions.length === 0 ? (
                    <p className="text-orange-400 text-center py-8">No transactions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-2xl">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${tx.amount > 0 ? "bg-green-500" : "bg-orange-600"}`}>
                            {tx.amount > 0 ? <CurrencyDollar weight="bold" /> : <Package weight="bold" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-orange-950 truncate">{tx.description}</div>
                            <div className="text-[10px] text-orange-400 font-bold uppercase">
                              {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                            </div>
                          </div>
                          <div className={`text-sm font-bold flex-shrink-0 ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                            {tx.amount > 0 ? "+" : ""}${Math.abs(Number(tx.amount)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pending Shipping */}
              {activeTab === "shipping" && (
                <div className="bg-white rounded-[2rem] p-6 space-y-6" style={{ boxShadow: "0 10px 30px -5px rgba(255,77,77,0.08)" }}>
                  <div>
                    <h3 className="font-bold text-orange-950 mb-4 text-lg">Awaiting Shipment</h3>
                    {pendingShipments.length === 0 ? (
                      <div className="text-center py-8">
                        <Truck weight="fill" className="text-5xl text-orange-200 mx-auto mb-4" />
                        <p className="text-orange-400 font-medium">No items awaiting shipment.</p>
                        <p className="text-sm text-orange-300 mt-2">Use &quot;Ship Item&quot; on any item in your collection.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingShipments.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-4 bg-orange-50/50 rounded-2xl">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${RARITY_COLORS[item.rarity].bg}`}>
                              <Package weight="fill" className={`text-xl ${RARITY_COLORS[item.rarity].text}`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-orange-950">{item.product_name}</div>
                              <div className="text-xs text-orange-400 font-bold uppercase">{item.rarity} · {item.product_sku}</div>
                            </div>
                            <div className="text-xs font-bold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full uppercase">Processing</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {shippedItems.length > 0 && (
                    <div>
                      <h3 className="font-bold text-orange-950 mb-4 text-lg">Shipped</h3>
                      <div className="space-y-3">
                        {shippedItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-4 bg-green-50/50 rounded-2xl">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${RARITY_COLORS[item.rarity].bg}`}>
                              <Package weight="fill" className={`text-xl ${RARITY_COLORS[item.rarity].text}`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-orange-950">{item.product_name}</div>
                              <div className="text-xs text-orange-400 font-bold uppercase">{item.rarity} · {item.product_sku}</div>
                              {item.tracking_number && (
                                <div className="text-xs text-orange-500 font-mono mt-0.5">{item.tracking_number}</div>
                              )}
                            </div>
                            <div className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full uppercase">Shipped</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Recent Activity */}
              <div className="bg-white rounded-[2rem] p-6" style={{ boxShadow: "0 10px 30px -5px rgba(255,77,77,0.08)" }}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-orange-950">Recent Activity</h3>
                  <button onClick={() => setActiveTab("history")} className="text-xs font-bold text-orange-600">View All</button>
                </div>
                {recentTx.length === 0 ? (
                  <p className="text-orange-300 text-sm text-center py-4">No activity yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentTx.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-2xl">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${tx.amount > 0 ? "bg-green-500" : "bg-orange-600"}`}>
                          {tx.amount > 0 ? <CurrencyDollar weight="bold" /> : <Package weight="bold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-orange-950 truncate">{tx.description}</div>
                          <div className="text-[10px] text-orange-400 font-bold">
                            {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                        <div className={`text-sm font-bold flex-shrink-0 ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                          {tx.amount > 0 ? "+" : ""}${Math.abs(Number(tx.amount)).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Open More Boxes CTA */}
              <div
                className="bg-orange-950 text-white rounded-[2rem] p-6 relative overflow-hidden"
                style={{ boxShadow: "0 10px 30px -5px rgba(255,77,77,0.08)" }}
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{ backgroundImage: "radial-gradient(circle, #FF6B4A 1px, transparent 1.5px)", backgroundSize: "16px 16px" }}
                />
                <div className="relative z-10">
                  <Lightning weight="fill" className="text-3xl text-yellow-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Open More Boxes</h3>
                  <p className="text-sm text-orange-100/70 mb-6">
                    Each box earns 100 XP. Level up to unlock exclusive member perks!
                  </p>
                  <button
                    onClick={() => router.push("/box")}
                    className="w-full bg-white text-orange-950 py-3 rounded-2xl font-bold text-sm hover:scale-[1.02] transition-transform"
                  >
                    Open a Box
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Withdrawal Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-orange-950 mb-1">Withdraw Funds</h2>
            <p className="text-sm text-orange-500 mb-6">
              Minimum $10 · Maximum $500 · Paid via PayPal within 2–3 business days
            </p>

            {withdrawError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {withdrawError}
              </div>
            )}

            {withdrawSuccess ? (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-4">
                <p className="font-bold mb-1">Request submitted!</p>
                <p>{withdrawSuccess}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-orange-700 mb-1 uppercase tracking-wide">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 font-bold">$</span>
                    <input
                      type="number"
                      min="10"
                      max={Math.min(500, balance)}
                      step="0.01"
                      placeholder="0.00"
                      value={withdrawForm.amount}
                      onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))}
                      className="w-full border border-orange-200 rounded-xl pl-8 pr-4 py-3 text-sm text-orange-950 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <p className="text-xs text-orange-400 mt-1">
                    Available balance: <span className="font-bold text-orange-600">${balance.toFixed(2)}</span>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-orange-700 mb-1 uppercase tracking-wide">
                    PayPal Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@paypal.com"
                    value={withdrawForm.paypal_email}
                    onChange={e => setWithdrawForm(f => ({ ...f, paypal_email: e.target.value }))}
                    className="w-full border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-950 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <p className="text-xs text-orange-400 bg-orange-50 rounded-xl px-3 py-2">
                  Note: Withdrawals are held 7 days after your most recent deposit to prevent fraud.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setWithdrawModal(false)}
                disabled={withdrawLoading}
                className="flex-1 bg-orange-50 text-orange-600 py-3 rounded-2xl font-bold text-sm hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                {withdrawSuccess ? "Close" : "Cancel"}
              </button>
              {!withdrawSuccess && (
                <button
                  onClick={handleWithdrawSubmit}
                  disabled={withdrawLoading || !withdrawForm.amount || !withdrawForm.paypal_email}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {withdrawLoading ? "Submitting..." : "Request Withdrawal"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shipping Address Modal */}
      {shippingModal.open && shippingModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-orange-950 mb-1">Ship This Item</h2>
            <p className="text-sm text-orange-500 mb-6">
              <span className="font-bold text-orange-700">{shippingModal.item.product_name}</span> will be mailed to this address.
            </p>

            {shippingError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {shippingError}
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full name *"
                value={shippingForm.name}
                onChange={e => setShippingForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-950 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                type="text"
                placeholder="Address line 1 *"
                value={shippingForm.line1}
                onChange={e => setShippingForm(f => ({ ...f, line1: e.target.value }))}
                className="w-full border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-950 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                type="text"
                placeholder="Address line 2 (optional)"
                value={shippingForm.line2}
                onChange={e => setShippingForm(f => ({ ...f, line2: e.target.value }))}
                className="w-full border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-950 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City *"
                  value={shippingForm.city}
                  onChange={e => setShippingForm(f => ({ ...f, city: e.target.value }))}
                  className="border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-950 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  type="text"
                  placeholder="State *"
                  value={shippingForm.state}
                  onChange={e => setShippingForm(f => ({ ...f, state: e.target.value }))}
                  className="border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-950 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="ZIP code *"
                  value={shippingForm.postal_code}
                  onChange={e => setShippingForm(f => ({ ...f, postal_code: e.target.value }))}
                  className="border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-950 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  type="text"
                  placeholder="Country *"
                  value={shippingForm.country}
                  onChange={e => setShippingForm(f => ({ ...f, country: e.target.value }))}
                  className="border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-950 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShippingModal({ open: false, item: null })}
                disabled={shippingLoading}
                className="flex-1 bg-orange-50 text-orange-600 py-3 rounded-2xl font-bold text-sm hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleShippingSubmit}
                disabled={shippingLoading}
                className="flex-1 bg-orange-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {shippingLoading ? "Submitting..." : "Confirm Shipping"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
