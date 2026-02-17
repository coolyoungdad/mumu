"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Package,
  Sparkle,
  CurrencyDollar,
  ArrowsClockwise,
  X,
  ListBullets,
  ChatCircle,
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
  const [showContents, setShowContents] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // DEMO MODE - Skip auth for UI testing
    setUser({ id: "demo-user", email: "demo@pompom.com" });
    setBalance(100.00); // Mock balance for demo
    setIsLoading(false);
    return;
  };

  const handleOpenBox = async () => {
    setError(null);
    setOpenState("opening");
    setShowContents(false);
    setShowChat(false);

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
      const splashDuration = item.rarity === "rare" || item.rarity === "ultra" ? 2000 : 1200;
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
    <div className="relative min-h-screen overflow-hidden">
      <div className="gradient-bg"></div>
      <Navbar />

      {/* Item Detail Modal */}
      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      {/* Slide-out Contents Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-40 ${
          showContents ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-orange-950">Box Contents</h3>
            <button
              onClick={() => setShowContents(false)}
              className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <X weight="bold" className="text-xl text-orange-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <BoxContents onItemClick={setSelectedItem} />
          </div>
        </div>
      </div>

      {/* Slide-out Chat Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-40 ${
          showChat ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-orange-950">Live Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <X weight="bold" className="text-xl text-orange-600" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <LiveChat />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 mt-20">
        {/* Top Bar with Balance and Quick Actions */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
          >
            ← Back to Home
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <CurrencyDollar weight="fill" className="text-yellow-300 text-2xl" />
              <div>
                <div className="text-xs text-orange-100">Balance</div>
                <div className="text-white font-bold text-lg">${balance.toFixed(2)}</div>
              </div>
              <button
                onClick={() => router.push("/topup")}
                className="ml-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                Top Up
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="min-h-[calc(100vh-240px)] flex flex-col items-center justify-center">
          {/* Idle State */}
          {openState === "idle" && (
            <div className="text-center max-w-2xl mx-auto animate-[fadeIn_0.5s_ease-out]">
              <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                Blind Box
              </h1>
              <p className="text-xl text-orange-100 mb-8 max-w-xl mx-auto">
                Open a blind box to reveal a surprise collectible! Sell it back instantly or add it to your collection.
              </p>

              {/* The Box */}
              <div className="relative w-64 h-64 mx-auto mb-6">
                <div className="absolute inset-0 bg-orange-400 blur-[100px] opacity-50 rounded-full animate-pulse-glow"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-all duration-300 border-4 border-white/30 cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
                  <Package weight="fill" className="text-[160px] text-white drop-shadow-2xl relative z-10 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              {/* Price and Open Button */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-4 border border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-white">Box Price:</span>
                  <span className="text-4xl font-bold text-orange-300">${BOX_PRICE.toFixed(2)}</span>
                </div>

                {error && (
                  <div className="bg-red-500/20 border-2 border-red-400/50 text-red-100 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleOpenBox}
                  disabled={!canAffordBox}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-12 py-4 rounded-xl font-bold text-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl hover:shadow-orange-500/50 hover:scale-105 flex items-center justify-center gap-3"
                >
                  <Sparkle weight="fill" className="text-2xl" />
                  Open Blind Box
                </button>

                {!canAffordBox && (
                  <p className="text-red-300 mt-4 font-medium">
                    Insufficient balance. Please top up your account.
                  </p>
                )}
              </div>

              {/* Quick Links */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push("/profile")}
                  className="text-white/80 hover:text-white transition-colors font-medium"
                >
                  View My Inventory →
                </button>
              </div>
            </div>
          )}

          {/* Opening Animation */}
          {openState === "opening" && (
            <div className="text-center animate-[fadeIn_0.3s_ease-out]">
              <div className="relative w-96 h-96 mx-auto mb-8">
                <div className="absolute inset-0 bg-orange-400 blur-[120px] opacity-80 rounded-full animate-pulse-glow"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 rounded-3xl shadow-2xl flex items-center justify-center transform animate-float border-4 border-white/30">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
                  {countdown > 0 ? (
                    <div className="text-[180px] font-bold text-white drop-shadow-2xl animate-pulse z-10">
                      {countdown}
                    </div>
                  ) : (
                    <Package weight="fill" className="text-[180px] text-white drop-shadow-2xl animate-pulse z-10" />
                  )}
                </div>
              </div>
              <p className="text-4xl font-bold text-white animate-pulse drop-shadow-lg">
                {countdown > 0 ? "Get ready..." : "Opening..."}
              </p>
            </div>
          )}

          {/* Splash Animation */}
          {openState === "splash" && revealedItem && (
            <div className="text-center animate-[fadeIn_0.3s_ease-out]">
              <div className="relative mx-auto mb-12" style={{
                width: revealedItem.rarity === "rare" || revealedItem.rarity === "ultra" ? "600px" : "500px",
                height: revealedItem.rarity === "rare" || revealedItem.rarity === "ultra" ? "600px" : "500px"
              }}>
                {/* Multiple burst layers */}
                <div
                  className={`absolute inset-0 rounded-full animate-[splash-burst_1s_ease-out_infinite] ${
                    RARITY_COLORS[revealedItem.rarity].border.replace("border-", "bg-")
                  }`}
                  style={{ opacity: 0.7 }}
                ></div>
                <div
                  className={`absolute inset-0 rounded-full animate-[splash-burst_1s_ease-out_infinite] ${
                    RARITY_COLORS[revealedItem.rarity].bg
                  }`}
                  style={{ animationDelay: "0.15s" }}
                ></div>
                <div
                  className={`absolute inset-0 rounded-full animate-[splash-burst_1s_ease-out_infinite] ${
                    RARITY_COLORS[revealedItem.rarity].text.replace("text-", "bg-")
                  }`}
                  style={{ animationDelay: "0.3s", opacity: 0.5 }}
                ></div>
                {/* Center glow */}
                <div
                  className={`absolute inset-0 blur-[150px] rounded-full ${
                    RARITY_COLORS[revealedItem.rarity].bg
                  }`}
                  style={{ opacity: 0.95 }}
                ></div>
              </div>
              {revealedItem.rarity === "rare" || revealedItem.rarity === "ultra" ? (
                <p className="text-6xl font-bold text-white animate-pulse drop-shadow-2xl">
                  ✨ {revealedItem.rarity === "ultra" ? "ULTRA RARE!" : "RARE!"} ✨
                </p>
              ) : null}
            </div>
          )}

          {/* Revealed Item */}
          {openState === "revealing" && revealedItem && (
            <div className="max-w-lg mx-auto animate-[reveal-scale_0.5s_ease-out] px-4">
              <div
                className={`${
                  RARITY_COLORS[revealedItem.rarity].bg
                } ${RARITY_COLORS[revealedItem.rarity].border} border-4 rounded-3xl p-6 shadow-2xl backdrop-blur-sm`}
              >
                {/* Sparkle and "You got!" */}
                <div className="text-center mb-4">
                  <Sparkle
                    weight="fill"
                    className="text-5xl text-orange-300 inline-block drop-shadow-lg animate-pulse-glow"
                  />
                  <h2 className="text-2xl font-bold text-white drop-shadow-lg inline-block ml-3">
                    You got!
                  </h2>
                </div>

                {/* Item image */}
                <div className="bg-white rounded-2xl w-40 h-40 flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <Package weight="fill" className="text-[100px] text-orange-600" />
                </div>

                {/* Item details */}
                <h3 className="text-2xl font-bold text-orange-950 mb-2 text-center leading-tight">
                  {revealedItem.name}
                </h3>
                <p className="text-sm text-orange-600 font-mono mb-3 text-center">
                  {revealedItem.sku}
                </p>

                {/* Rarity badge */}
                <div className="flex justify-center mb-4">
                  <div
                    className={`inline-block ${
                      RARITY_COLORS[revealedItem.rarity].bg
                    } ${
                      RARITY_COLORS[revealedItem.rarity].text
                    } px-5 py-2 rounded-full font-bold uppercase text-sm border-2 border-white/50`}
                  >
                    {revealedItem.rarity}
                  </div>
                </div>

                {/* Buyback price */}
                <div className="bg-white rounded-xl p-4 mb-4 shadow-lg">
                  <div className="text-sm text-orange-600 font-medium mb-1">Instant Buyback Value</div>
                  <div className="text-4xl font-bold text-orange-950">
                    ${revealedItem.buyback_price.toFixed(2)}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSellBack}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-base hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/50 hover:scale-105"
                  >
                    💰 Sell
                    <div className="text-xs opacity-90">${revealedItem.buyback_price.toFixed(2)}</div>
                  </button>
                  <button
                    onClick={handleKeep}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold text-base hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-orange-500/50 hover:scale-105"
                  >
                    ⭐ Keep It
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Decision Made */}
          {openState === "decided" && (
            <div className="text-center animate-[fadeIn_0.5s_ease-out]">
              <div className="text-8xl mb-6">✨</div>
              <p className="text-4xl font-bold text-white mb-12 drop-shadow-lg">
                Success!
              </p>
              <button
                onClick={() => {
                  setOpenState("idle");
                  setRevealedItem(null);
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-12 py-5 rounded-xl font-bold text-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-2xl hover:shadow-orange-500/50 hover:scale-105 flex items-center gap-3 mx-auto"
              >
                <ArrowsClockwise weight="bold" className="text-2xl" />
                Open Another Box
              </button>
            </div>
          )}
        </div>

        {/* Floating Action Buttons (only show when idle) */}
        {openState === "idle" && (
          <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-4 z-30">
            <button
              onClick={() => setShowContents(!showContents)}
              className="bg-white text-orange-600 px-6 py-4 rounded-full font-bold shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all flex items-center gap-2"
            >
              <ListBullets weight="bold" className="text-xl" />
              What's Inside
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="bg-white text-orange-600 px-6 py-4 rounded-full font-bold shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all flex items-center gap-2"
            >
              <ChatCircle weight="fill" className="text-xl" />
              Live Chat
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
