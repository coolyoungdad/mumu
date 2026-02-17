"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CurrencyDollar,
  Package,
  Truck,
  SignOut,
  Plus,
} from "@phosphor-icons/react/dist/ssr";
import { RARITY_COLORS, type UserInventoryItem } from "@/lib/types/database";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    // DEMO MODE - Skip auth for UI testing
    setUser({ id: "demo-user", email: "demo@pompom.com" });
    setBalance(100.00);

    // Mock inventory items for demo
    const mockInventory: UserInventoryItem[] = [
      {
        id: "1",
        user_id: "demo-user",
        product_id: "product-1",
        product_name: "The Joy Skullpanda",
        product_sku: "ITEM-087",
        rarity: "rare" as any,
        buyback_price: 100,
        status: "kept" as any,
        acquired_at: new Date().toISOString(),
      },
      {
        id: "2",
        user_id: "demo-user",
        product_id: "product-2",
        product_name: "The Other One Hirono",
        product_sku: "ITEM-099",
        rarity: "ultra" as any,
        buyback_price: 300,
        status: "kept" as any,
        acquired_at: new Date().toISOString(),
      },
      {
        id: "3",
        user_id: "demo-user",
        product_id: "product-3",
        product_name: "Space Molly",
        product_sku: "ITEM-042",
        rarity: "uncommon" as any,
        buyback_price: 50,
        status: "kept" as any,
        acquired_at: new Date().toISOString(),
      },
    ];
    setInventory(mockInventory);
    setIsLoading(false);
    return;

    // REAL AUTH CODE - Uncomment when Supabase is set up
    // const supabase = createClient();
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();

    // if (!user) {
    //   router.push("/");
    //   return;
    // }

    // setUser(user);

    // // Fetch user balance
    // const { data: userData } = await supabase
    //   .from("users")
    //   .select("account_balance")
    //   .eq("id", user.id)
    //   .single();

    // if (userData) {
    //   setBalance(userData.account_balance);
    // }

    // // Fetch user inventory (only kept items)
    // const { data: inventoryData } = await supabase
    //   .from("user_inventory")
    //   .select("*")
    //   .eq("user_id", user.id)
    //   .eq("status", "kept")
    //   .order("acquired_at", { ascending: false });

    // if (inventoryData) {
    //   setInventory(inventoryData as UserInventoryItem[]);
    // }

    // setIsLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleRequestShipping = async (itemId: string) => {
    // TODO: Implement shipping request
    alert("Shipping request feature coming soon!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="gradient-bg"></div>
      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 mt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-orange-200 transition-colors"
          >
            ← Back to Home
          </button>

          <button
            onClick={handleSignOut}
            className="glass-panel px-6 py-3 rounded-full flex items-center gap-2 text-white hover:bg-white/20 transition-colors"
          >
            <SignOut weight="bold" />
            Sign Out
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Balance Card */}
          <div className="glass-card-white p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <CurrencyDollar weight="fill" className="text-2xl text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-orange-600 font-medium">Balance</div>
                <div className="text-3xl font-bold text-orange-950">
                  ${balance.toFixed(2)}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/topup")}
              className="w-full bg-orange-600 text-white py-3 rounded-full font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus weight="bold" />
              Top Up Balance
            </button>
          </div>

          {/* Inventory Stats */}
          <div className="glass-card-white p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package weight="fill" className="text-2xl text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-orange-600 font-medium">Items Owned</div>
                <div className="text-3xl font-bold text-orange-950">
                  {inventory.length}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/box")}
              className="w-full bg-orange-100 text-orange-600 py-3 rounded-full font-bold hover:bg-orange-200 transition-colors"
            >
              Open More Boxes
            </button>
          </div>

          {/* Total Value */}
          <div className="glass-card-white p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CurrencyDollar weight="fill" className="text-2xl text-green-600" />
              </div>
              <div>
                <div className="text-sm text-orange-600 font-medium">
                  Total Value
                </div>
                <div className="text-3xl font-bold text-orange-950">
                  ${inventory
                    .reduce((sum, item) => sum + Number(item.buyback_price), 0)
                    .toFixed(2)}
                </div>
              </div>
            </div>
            <p className="text-sm text-orange-600">
              Value of items in inventory
            </p>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="glass-card-white p-8 rounded-3xl">
          <h2 className="text-2xl font-bold text-orange-950 mb-6">
            My Inventory
          </h2>

          {inventory.length === 0 ? (
            <div className="text-center py-20">
              <Package
                weight="fill"
                className="text-6xl text-orange-300 mx-auto mb-4"
              />
              <p className="text-orange-600 mb-6">
                You don't have any items yet. Open a box to get started!
              </p>
              <button
                onClick={() => router.push("/box")}
                className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-colors"
              >
                Open Your First Box
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className={`${
                    RARITY_COLORS[item.rarity].bg
                  } border-2 ${
                    RARITY_COLORS[item.rarity].border
                  } rounded-2xl p-6 relative overflow-hidden`}
                >
                  {/* Rarity Badge */}
                  <div
                    className={`absolute top-4 right-4 ${
                      RARITY_COLORS[item.rarity].bg
                    } ${
                      RARITY_COLORS[item.rarity].text
                    } px-3 py-1 rounded-full text-xs font-bold uppercase`}
                  >
                    {item.rarity}
                  </div>

                  {/* Item Image Placeholder */}
                  <div className="bg-white rounded-xl aspect-square flex items-center justify-center mb-4">
                    <Package
                      weight="fill"
                      className="text-6xl text-orange-400"
                    />
                  </div>

                  {/* Item Details */}
                  <h3 className="font-bold text-orange-950 mb-1 text-lg">
                    {item.product_name}
                  </h3>
                  <p className="text-xs text-orange-600 font-mono mb-3">
                    {item.product_sku}
                  </p>

                  <div className="bg-white rounded-lg p-3 mb-4">
                    <div className="text-xs text-orange-600 mb-1">
                      Buyback Value
                    </div>
                    <div className="text-xl font-bold text-orange-950">
                      ${item.buyback_price.toFixed(2)}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleRequestShipping(item.id)}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Truck weight="bold" />
                    Ship to Me
                  </button>

                  <p className="text-xs text-orange-600 text-center mt-2">
                    $5.00 shipping fee
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
