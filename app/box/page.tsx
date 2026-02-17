"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Package,
  Sparkle,
  CurrencyDollar,
  ArrowsClockwise,
} from "@phosphor-icons/react/dist/ssr";
import { BOX_PRICE, RARITY_COLORS, type RarityTier } from "@/lib/types/database";
import Navbar from "@/components/Navbar";
import BoxContents from "@/components/BoxContents";
import ItemDetailModal from "@/components/ItemDetailModal";
import LiveChat from "@/components/LiveChat";

type OpenState = "idle" | "opening" | "splash" | "revealing" | "decided";

interface RevealedItem {
  id: string;
  name: string;
  sku: string;
  rarity: RarityTier;
  buyback_price: number;
  inventory_item_id: string;
}

export default function BoxOpeningPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [openState, setOpenState] = useState<OpenState>("idle");
  const [revealedItem, setRevealedItem] = useState<RevealedItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // DEMO MODE - Skip auth for UI testing
    setUser({ id: "demo-user", email: "demo@pompom.com" });
    setBalance(100.00); // Mock balance for demo
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

    // setIsLoading(false);
  };

  const handleOpenBox = async () => {
    setError(null);
    setOpenState("opening");

    // Countdown animation
    setCountdown(3);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setCountdown(2);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setCountdown(1);
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const response = await fetch("/api/box/open", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open box");
      }

      // Store the revealed item
      const item = {
        id: data.product.id,
        name: data.product.name,
        sku: data.product.sku,
        rarity: data.product.rarity,
        buyback_price: data.product.buyback_price,
        inventory_item_id: data.inventory_item_id,
      };
      setRevealedItem(item);
      setBalance(data.new_balance);

      // Show splash animation
      setOpenState("splash");

      // Splash duration - longer for rare/ultra
      const splashDuration = item.rarity === "rare" || item.rarity === "ultra" ? 1500 : 1000;
      await new Promise((resolve) => setTimeout(resolve, splashDuration));

      // Now reveal the item
      setOpenState("revealing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open box");
      setOpenState("idle");
    }
  };

  const handleSellBack = async () => {
    if (!revealedItem) return;

    try {
      const response = await fetch("/api/box/sellback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory_item_id: revealedItem.inventory_item_id,
          buyback_price: revealedItem.buyback_price
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sell back");
      }

      setBalance(data.new_balance);
      setOpenState("decided");

      // Reset after showing success
      setTimeout(() => {
        setOpenState("idle");
        setRevealedItem(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sell back");
    }
  };

  const handleKeep = () => {
    setOpenState("decided");

    // Reset after showing success
    setTimeout(() => {
      setOpenState("idle");
      setRevealedItem(null);
    }, 2000);
  };

  const canAffordBox = balance >= BOX_PRICE;

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

      {/* Item Detail Modal */}
      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      <div className="relative z-10 max-w-[1800px] mx-auto px-6 py-20 mt-20">
        {/* Header with Balance */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-orange-200 transition-colors"
          >
            ← Back
          </button>

          <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3">
            <CurrencyDollar weight="fill" className="text-yellow-300 text-xl" />
            <div>
              <div className="text-xs text-orange-100">Balance</div>
              <div className="text-white font-bold">${balance.toFixed(2)}</div>
            </div>
            <button
              onClick={() => router.push("/topup")}
              className="ml-4 bg-white/20 hover:bg-white/30 text-white px-4 py-1 rounded-full text-sm font-bold transition-colors"
            >
              Top Up
            </button>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Box Contents */}
          <div className="hidden lg:block lg:col-span-3">
            <BoxContents onItemClick={setSelectedItem} />
          </div>

          {/* Center - Main Box Area */}
          <div className="lg:col-span-6">
            <div className="glass-card-white p-12 rounded-3xl text-center min-h-[700px] flex flex-col justify-center">
          {/* Idle State */}
          {openState === "idle" && (
            <>
              <h1 className="text-4xl font-bold text-orange-950 mb-4">
                Mystery Box
              </h1>
              <p className="text-orange-800 mb-8">
                Open a box to reveal a surprise item! You can sell it back instantly
                or keep it.
              </p>

              <div className="relative w-64 h-64 mx-auto mb-8">
                <div className="absolute inset-0 bg-orange-400 blur-[80px] opacity-40 rounded-full"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300 border-4 border-white/20 cursor-pointer">
                  <div className="absolute inset-0 dot-pattern opacity-20 rounded-3xl"></div>
                  <Package weight="fill" className="text-9xl text-white drop-shadow-lg relative z-10" />
                </div>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 mb-8 max-w-md mx-auto">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-orange-950">Box Price:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    ${BOX_PRICE.toFixed(2)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6 max-w-md mx-auto">
                  {error}
                </div>
              )}

              <button
                onClick={handleOpenBox}
                disabled={!canAffordBox}
                className="bg-orange-600 text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
              >
                <Sparkle weight="fill" />
                Open Box
              </button>

              {!canAffordBox && (
                <p className="text-red-600 mt-4">
                  Insufficient balance. Please top up your account.
                </p>
              )}
            </>
          )}

          {/* Opening Animation */}
          {openState === "opening" && (
            <div className="py-12">
              <div className="relative w-80 h-80 mx-auto mb-8">
                <div className="absolute inset-0 bg-orange-400 blur-[100px] opacity-70 rounded-full animate-pulse-glow"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl shadow-2xl flex items-center justify-center transform animate-float border-4 border-white/20">
                  <div className="absolute inset-0 dot-pattern opacity-20 rounded-3xl"></div>
                  {countdown > 0 ? (
                    <div className="text-9xl font-bold text-white drop-shadow-lg animate-pulse z-10">
                      {countdown}
                    </div>
                  ) : (
                    <Package weight="fill" className="text-9xl text-white drop-shadow-lg animate-pulse z-10" />
                  )}
                </div>
              </div>
              <p className="text-3xl font-bold text-orange-950 animate-pulse">
                {countdown > 0 ? "Get ready..." : "Opening..."}
              </p>
            </div>
          )}

          {/* Splash Animation */}
          {openState === "splash" && revealedItem && (
            <div className="py-20">
              <div className="relative mx-auto mb-8" style={{
                width: revealedItem.rarity === "rare" || revealedItem.rarity === "ultra" ? "500px" : "400px",
                height: revealedItem.rarity === "rare" || revealedItem.rarity === "ultra" ? "500px" : "400px"
              }}>
                {/* Outer burst */}
                <div
                  className={`absolute inset-0 rounded-full animate-[splash-burst_0.8s_ease-out_infinite] ${
                    RARITY_COLORS[revealedItem.rarity].border.replace("border-", "bg-")
                  }`}
                  style={{ opacity: 0.6 }}
                ></div>
                {/* Middle burst */}
                <div
                  className={`absolute inset-0 rounded-full animate-[splash-burst_0.8s_ease-out_infinite] ${
                    RARITY_COLORS[revealedItem.rarity].bg
                  }`}
                  style={{ animationDelay: "0.2s" }}
                ></div>
                {/* Inner burst */}
                <div
                  className={`absolute inset-0 rounded-full animate-[splash-burst_0.8s_ease-out_infinite] ${
                    RARITY_COLORS[revealedItem.rarity].text.replace("text-", "bg-")
                  }`}
                  style={{ animationDelay: "0.4s", opacity: 0.4 }}
                ></div>
                {/* Center glow */}
                <div
                  className={`absolute inset-0 blur-[120px] rounded-full ${
                    RARITY_COLORS[revealedItem.rarity].bg
                  }`}
                  style={{ opacity: 0.9 }}
                ></div>
              </div>
              {revealedItem.rarity === "rare" || revealedItem.rarity === "ultra" ? (
                <p className="text-4xl font-bold text-white animate-pulse drop-shadow-lg">
                  ✨ {revealedItem.rarity === "ultra" ? "ULTRA RARE!" : "RARE!"} ✨
                </p>
              ) : null}
            </div>
          )}

          {/* Revealed Item */}
          {openState === "revealing" && revealedItem && (
            <div className="animate-[reveal-scale_0.5s_ease-out]">
              <div className="mb-8">
                <Sparkle
                  weight="fill"
                  className="text-6xl text-orange-600 mx-auto mb-4 animate-pulse-glow"
                />
                <h2 className="text-3xl font-bold text-orange-950 mb-2">
                  You got!
                </h2>
              </div>

              <div
                className={`${
                  RARITY_COLORS[revealedItem.rarity].bg
                } ${RARITY_COLORS[revealedItem.rarity].border} border-4 rounded-3xl p-8 max-w-lg mx-auto mb-8`}
              >
                <div className="bg-white rounded-2xl aspect-square flex items-center justify-center mb-4 p-8">
                  <Package weight="fill" className="text-9xl text-orange-600" />
                </div>

                <h3 className="text-2xl font-bold text-orange-950 mb-2">
                  {revealedItem.name}
                </h3>
                <p className="text-sm text-orange-600 font-mono mb-4">
                  {revealedItem.sku}
                </p>

                <div
                  className={`inline-block ${
                    RARITY_COLORS[revealedItem.rarity].bg
                  } ${
                    RARITY_COLORS[revealedItem.rarity].text
                  } px-4 py-2 rounded-full font-bold uppercase text-sm mb-4`}
                >
                  {revealedItem.rarity}
                </div>

                <div className="bg-white rounded-xl p-4">
                  <div className="text-sm text-orange-600 mb-1">Sell Back Value</div>
                  <div className="text-3xl font-bold text-orange-950">
                    ${revealedItem.buyback_price.toFixed(2)}
                  </div>
                </div>
              </div>

              <p className="text-orange-800 mb-6">
                What would you like to do with this item?
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleSellBack}
                  className="bg-green-600 text-white px-8 py-4 rounded-full font-bold hover:bg-green-700 transition-all shadow-lg"
                >
                  Sell for ${revealedItem.buyback_price.toFixed(2)}
                </button>
                <button
                  onClick={handleKeep}
                  className="bg-orange-600 text-white px-8 py-4 rounded-full font-bold hover:bg-orange-700 transition-all shadow-lg"
                >
                  Keep It
                </button>
              </div>
            </div>
          )}

          {/* Decision Made */}
          {openState === "decided" && (
            <div className="py-20">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-2xl font-bold text-orange-950 mb-8">
                {revealedItem ? "Item added to your inventory!" : "Item sold!"}
              </p>
              <button
                onClick={() => {
                  setOpenState("idle");
                  setRevealedItem(null);
                }}
                className="bg-orange-600 text-white px-8 py-4 rounded-full font-bold hover:bg-orange-700 transition-all shadow-lg flex items-center gap-2 mx-auto"
              >
                <ArrowsClockwise weight="bold" />
                Open Another Box
              </button>
            </div>
          )}
            </div>

            {/* Quick Actions */}
            {openState === "idle" && (
              <div className="flex gap-4 justify-center mt-8">
                <button
                  onClick={() => router.push("/profile")}
                  className="text-white hover:text-orange-200 transition-colors font-medium"
                >
                  View My Inventory →
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar - Live Chat */}
          <div className="hidden lg:block lg:col-span-3">
            <LiveChat />
          </div>
        </div>
      </div>
    </div>
  );
}
