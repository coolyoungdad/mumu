"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Package,
  Sparkle,
  ArrowsClockwise,
  X,
  ListDashes,
  Chats,
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

      {/* Backdrop for panels - NO click to close, only X button */}
      {(showContents || showChat) && (
        <div className="fixed inset-0 bg-black/50 z-30 transition-opacity" />
      )}

      {/* Slide-out Contents Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
          showContents ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col pt-20">
          <div className="px-6 pb-4 flex items-center justify-between border-b-2 border-orange-100">
            <h3 className="text-xl font-bold text-orange-950">Box Contents</h3>
            <button
              onClick={() => setShowContents(false)}
              className="p-3 hover:bg-red-100 rounded-lg transition-colors bg-orange-100 border-2 border-orange-400 shadow-lg"
            >
              <X weight="bold" className="text-2xl text-red-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pt-4">
            <BoxContents onItemClick={setSelectedItem} />
          </div>
        </div>
      </div>

      {/* Slide-out Chat Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
          showChat ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col pt-20">
          <div className="px-6 pb-4 flex items-center justify-between border-b-2 border-orange-100">
            <h3 className="text-xl font-bold text-orange-950">Live Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="p-3 hover:bg-red-100 rounded-lg transition-colors bg-orange-100 border-2 border-orange-400 shadow-lg"
            >
              <X weight="bold" className="text-2xl text-red-600" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden px-6 pt-4">
            <LiveChat />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 mt-20">
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
              <div className="relative mx-auto mb-12 w-96 h-96">
                {/* Central burst glow */}
                <div
                  className={`absolute inset-0 blur-[180px] rounded-full ${
                    RARITY_COLORS[revealedItem.rarity].bg
                  } animate-pulse`}
                  style={{ opacity: 0.9 }}
                ></div>

                {/* Particle sparkles radiating outward */}
                {[...Array(12)].map((_, i) => {
                  const angle = (i * 30) * (Math.PI / 180);
                  const distance = 150;
                  const x = Math.cos(angle) * distance;
                  const y = Math.sin(angle) * distance;

                  return (
                    <Sparkle
                      key={i}
                      weight="fill"
                      className={`absolute top-1/2 left-1/2 ${
                        RARITY_COLORS[revealedItem.rarity].text
                      } animate-[particle-burst_1s_ease-out_infinite]`}
                      style={{
                        fontSize: revealedItem.rarity === "ultra" ? "48px" : "32px",
                        animationDelay: `${i * 0.08}s`,
                        transform: `translate(${x}px, ${y}px)`,
                        opacity: 0,
                      }}
                    />
                  );
                })}

                {/* Center icon pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkle
                    weight="fill"
                    className={`${
                      RARITY_COLORS[revealedItem.rarity].text
                    } animate-pulse drop-shadow-2xl`}
                    style={{ fontSize: revealedItem.rarity === "ultra" ? "120px" : "96px" }}
                  />
                </div>
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

        {/* Fixed Corner Action Buttons */}
        {openState === "idle" && (
          <>
            <button
              onClick={() => setShowContents(!showContents)}
              className="fixed top-24 left-6 bg-white text-orange-600 px-5 py-3 rounded-full font-bold shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all z-30 flex items-center gap-2"
            >
              <ListDashes weight="bold" className="text-xl" />
              <span className="text-sm">What's Inside</span>
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="fixed top-24 right-6 bg-white text-orange-600 px-5 py-3 rounded-full font-bold shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all z-30 flex items-center gap-2"
            >
              <Chats weight="fill" className="text-xl" />
              <span className="text-sm">Live Chat</span>
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes particle-burst {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--tx, 0px)), calc(-50% + var(--ty, 0px))) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
