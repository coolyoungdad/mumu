"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Package,
  Sparkle,
  ArrowsClockwise,
  ListBullets,
  ChatCircleDots,
} from "@phosphor-icons/react/dist/ssr";
import { BOX_PRICE, RARITY_COLORS, type RarityTier } from "@/lib/types/database";
import { dispatchBalanceUpdate } from "@/lib/events/balance";
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login?redirect=/box");
      return;
    }

    setUser(user);

    const { data } = await supabase
      .from("users")
      .select("account_balance")
      .eq("id", user.id)
      .single();

    if (data) {
      setBalance(data.account_balance);
      dispatchBalanceUpdate(data.account_balance, "initial_load");
    }

    setIsLoading(false);
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
      dispatchBalanceUpdate(data.new_balance, "box_open");

      setOpenState("splash");

      const splashDuration = item.rarity === "rare" || item.rarity === "ultra" ? 2000 : 1200;
      await new Promise((resolve) => setTimeout(resolve, splashDuration));

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
      dispatchBalanceUpdate(data.new_balance, "sellback");
      setOpenState("decided");

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

    setTimeout(() => {
      setOpenState("idle");
      setRevealedItem(null);
    }, 2000);
  };

  const canAffordBox = balance >= BOX_PRICE;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-orange-950 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="gradient-bg"></div>
      <Navbar />

      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      <div className="relative z-10 flex gap-4 px-4 mt-20 min-h-[calc(100vh-80px)] pb-6">

        {/* Left Sidebar: Box Contents */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 bg-white/90 backdrop-blur-md rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 112px)" }}>
            <div className="px-4 py-3 border-b border-orange-100 flex-shrink-0">
              <h3 className="font-bold text-orange-950 text-sm flex items-center gap-2">
                <ListBullets weight="bold" className="text-base" />
                What's Inside
              </h3>
            </div>
            <div className="overflow-y-auto flex-1 p-3">
              <BoxContents onItemClick={setSelectedItem} />
            </div>
          </div>
        </div>

        {/* Center: Main Box Content */}
        <div className="flex-1 flex flex-col items-center justify-center py-8 min-w-0">

          {/* Idle State */}
          {openState === "idle" && (
            <div className="text-center max-w-lg mx-auto w-full animate-[fadeIn_0.5s_ease-out]">
              <h1 className="text-5xl font-bold text-orange-950 mb-4">
                Blind Box
              </h1>
              <p className="text-lg text-orange-800 mb-8 max-w-sm mx-auto">
                Open a blind box to reveal a surprise collectible! Sell it back instantly or add it to your collection.
              </p>

              {/* The Box */}
              <div className="relative w-56 h-56 mx-auto mb-6">
                <div className="absolute inset-0 bg-orange-400 blur-[80px] opacity-50 rounded-full animate-pulse-glow"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-all duration-300 border-4 border-white/30 cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
                  <Package weight="fill" className="text-[130px] text-white drop-shadow-2xl relative z-10 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              {/* Price and Open Button */}
              <div className="bg-white rounded-2xl p-5 mb-4 border border-orange-100 shadow-md">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-base font-semibold text-orange-950">Box Price:</span>
                  <span className="text-3xl font-bold text-orange-600">${BOX_PRICE.toFixed(2)}</span>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleOpenBox}
                  disabled={!canAffordBox}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl hover:shadow-orange-500/50 hover:scale-105 flex items-center justify-center gap-3"
                >
                  <Sparkle weight="fill" className="text-xl" />
                  Open Now!
                </button>

                {!canAffordBox && (
                  <p className="text-red-500 mt-3 font-medium text-sm">
                    Insufficient balance. Please top up your account.
                  </p>
                )}
              </div>

              <button
                onClick={() => router.push("/profile")}
                className="text-orange-600 hover:text-orange-950 transition-colors font-medium text-sm"
              >
                View My Inventory →
              </button>
            </div>
          )}

          {/* Opening Animation */}
          {openState === "opening" && (
            <div className="text-center animate-[fadeIn_0.3s_ease-out]">
              <div className="relative w-80 h-80 mx-auto mb-8">
                <div className="absolute inset-0 bg-orange-400 blur-[100px] opacity-80 rounded-full animate-pulse-glow"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 rounded-3xl shadow-2xl flex items-center justify-center transform animate-float border-4 border-white/30">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
                  {countdown > 0 ? (
                    <div className="text-[160px] font-bold text-white drop-shadow-2xl animate-pulse z-10">
                      {countdown}
                    </div>
                  ) : (
                    <Package weight="fill" className="text-[160px] text-white drop-shadow-2xl animate-pulse z-10" />
                  )}
                </div>
              </div>
              <p className="text-4xl font-bold text-orange-950 animate-pulse">
                {countdown > 0 ? "Get ready..." : "Opening..."}
              </p>
            </div>
          )}

          {/* Splash Animation */}
          {openState === "splash" && revealedItem && (
            <div className="text-center animate-[fadeIn_0.3s_ease-out]">
              <div className="relative mx-auto mb-12 w-80 h-80">
                <div
                  className={`absolute inset-0 blur-[150px] rounded-full ${
                    RARITY_COLORS[revealedItem.rarity].bg
                  } animate-pulse`}
                  style={{ opacity: 0.9 }}
                ></div>

                {[...Array(12)].map((_, i) => {
                  const angle = (i * 30) * (Math.PI / 180);
                  const distance = 130;
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
                        fontSize: revealedItem.rarity === "ultra" ? "40px" : "28px",
                        animationDelay: `${i * 0.08}s`,
                        transform: `translate(${x}px, ${y}px)`,
                        opacity: 0,
                      }}
                    />
                  );
                })}

                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkle
                    weight="fill"
                    className={`${
                      RARITY_COLORS[revealedItem.rarity].text
                    } animate-pulse drop-shadow-2xl`}
                    style={{ fontSize: revealedItem.rarity === "ultra" ? "100px" : "80px" }}
                  />
                </div>
              </div>
              {(revealedItem.rarity === "rare" || revealedItem.rarity === "ultra") && (
                <p className="text-5xl font-bold text-orange-950 animate-pulse">
                  ✨ {revealedItem.rarity === "ultra" ? "ULTRA RARE!" : "RARE!"} ✨
                </p>
              )}
            </div>
          )}

          {/* Revealed Item */}
          {openState === "revealing" && revealedItem && (
            <div className="max-w-sm mx-auto w-full animate-[reveal-scale_0.5s_ease-out] px-4">
              <div
                className={`${
                  RARITY_COLORS[revealedItem.rarity].bg
                } ${RARITY_COLORS[revealedItem.rarity].border} border-4 rounded-3xl p-6 shadow-2xl backdrop-blur-sm`}
              >
                <div className="text-center mb-4">
                  <Sparkle
                    weight="fill"
                    className="text-5xl text-orange-300 inline-block drop-shadow-lg animate-pulse-glow"
                  />
                  <h2 className="text-2xl font-bold text-white drop-shadow-lg inline-block ml-3">
                    You got!
                  </h2>
                </div>

                <div className="bg-white rounded-2xl w-36 h-36 flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <Package weight="fill" className="text-[90px] text-orange-600" />
                </div>

                <h3 className="text-2xl font-bold text-orange-950 mb-2 text-center leading-tight">
                  {revealedItem.name}
                </h3>
                <p className="text-sm text-orange-600 font-mono mb-3 text-center">
                  {revealedItem.sku}
                </p>

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

                <div className="bg-white rounded-xl p-4 mb-4 shadow-lg">
                  <div className="text-sm text-orange-600 font-medium mb-1">Instant Buyback Value</div>
                  <div className="text-4xl font-bold text-orange-950">
                    ${revealedItem.buyback_price.toFixed(2)}
                  </div>
                </div>

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
              <p className="text-4xl font-bold text-orange-950 mb-12">
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

        {/* Right Sidebar: Live Chat */}
        <div className="w-80 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 bg-white/90 backdrop-blur-md rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 112px)" }}>
            <div className="px-4 py-3 border-b border-orange-100 flex-shrink-0">
              <h3 className="font-bold text-orange-950 text-sm flex items-center gap-2">
                <ChatCircleDots weight="fill" className="text-base" />
                Live Chat
              </h3>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-3">
              <LiveChat />
            </div>
          </div>
        </div>

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
