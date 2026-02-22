"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Package,
  Sparkle,
  ArrowsClockwise,
  ListBullets,
  ChatCircleDots,
  Shuffle,
} from "@phosphor-icons/react/dist/ssr";
import { BOX_PRICE, SHAKE_PRICE, RARITY_COLORS, type RarityTier } from "@/lib/types/database";
import { dispatchBalanceUpdate } from "@/lib/events/balance";
import { track } from "@/lib/analytics";
import Navbar from "@/components/Navbar";
import BoxContents from "@/components/BoxContents";
import ItemDetailModal from "@/components/ItemDetailModal";
import LiveChat from "@/components/LiveChat";

type OpenState = "idle" | "shaking" | "opening" | "splash" | "revealing" | "decided";

interface RevealedItem {
  id: string;
  name: string;
  sku: string;
  rarity: RarityTier;
  buyback_price: number;
  inventory_item_id: string;
}

// localStorage helpers
const SHAKE_STORAGE_KEY = "mumu_shake_state";
const SHAKE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface ShakeState {
  eliminated_ids: string[];
  idempotency_key: string;
  ts: number;
}

function loadShakeState(): ShakeState | null {
  try {
    const raw = localStorage.getItem(SHAKE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: ShakeState = JSON.parse(raw);
    if (Date.now() - parsed.ts > SHAKE_TTL_MS) {
      localStorage.removeItem(SHAKE_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveShakeState(state: ShakeState) {
  localStorage.setItem(SHAKE_STORAGE_KEY, JSON.stringify(state));
}

function clearShakeState() {
  localStorage.removeItem(SHAKE_STORAGE_KEY);
}

export default function BoxOpeningPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [openState, setOpenState] = useState<OpenState>("idle");
  const [revealedItem, setRevealedItem] = useState<RevealedItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ name: string; rarity: RarityTier; buybackMin: number; buybackMax: number; brand: string; stock: number } | null>(null);
  const [countdown, setCountdown] = useState(3);

  // Shake state
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [shakeError, setShakeError] = useState<string | null>(null);

  const [mobilePanel, setMobilePanel] = useState<"none" | "contents" | "chat">("none");

  useEffect(() => {
    checkAuth();
  }, []);

  // Restore shake state from localStorage on mount
  useEffect(() => {
    const saved = loadShakeState();
    if (saved) {
      setEliminatedIds(saved.eliminated_ids);
    }
  }, []);

  // Track shake abandonment when user navigates away with active shake state
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eliminatedIds.length > 0) {
        track({ event: "shake_abandoned" });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [eliminatedIds]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
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
    }

    setIsLoading(false);
  };

  const handleShake = useCallback(async () => {
    if (!user) {
      router.push("/auth/login?redirect=/box");
      return;
    }
    if (isShaking) return;

    track({ event: "shake_initiated" });
    setShakeError(null);
    setIsShaking(true);
    setOpenState("shaking");

    // Generate a fresh idempotency key for this shake attempt
    const idempotency_key = crypto.randomUUID();

    try {
      const response = await fetch("/api/box/shake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotency_key }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to shake");
      }

      const newIds: string[] = data.eliminated_product_ids ?? [];
      setEliminatedIds(newIds);
      setBalance(data.new_balance);
      dispatchBalanceUpdate(data.new_balance, "shake");

      if (!data.already_charged && newIds.length > 0) {
        saveShakeState({ eliminated_ids: newIds, idempotency_key, ts: Date.now() });
        track({
          event: "shake_charged",
          properties: { eliminated_count: data.eliminated_count, new_balance: data.new_balance },
        });
      }
    } catch (err) {
      setShakeError(err instanceof Error ? err.message : "Failed to shake");
      track({ event: "shake_abandoned" });
    } finally {
      setIsShaking(false);
      setOpenState("idle");
    }
  }, [user, isShaking, router]);

  const handleFreshBox = useCallback(() => {
    track({ event: "fresh_box_requested" });
    clearShakeState();
    setEliminatedIds([]);
    setShakeError(null);
  }, []);

  const handleOpenBox = async () => {
    if (!user) {
      router.push("/auth/login?redirect=/box");
      return;
    }
    setError(null);
    setOpenState("opening");

    // Countdown animation
    setCountdown(3);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setCountdown(2);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setCountdown(1);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const hadShake = eliminatedIds.length > 0;

    try {
      const response = await fetch("/api/box/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excluded_ids: eliminatedIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open box");
      }

      const item: RevealedItem = {
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

      // Track open event
      if (hadShake) {
        track({
          event: "box_opened_after_shake",
          properties: { rarity: item.rarity, product_name: item.name, new_balance: data.new_balance },
        });
      } else {
        track({
          event: "box_opened_no_shake",
          properties: { rarity: item.rarity, product_name: item.name, new_balance: data.new_balance },
        });
      }

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

      track({
        event: "item_sold_back",
        properties: { rarity: revealedItem.rarity, buyback_price: revealedItem.buyback_price },
      });

      setBalance(data.new_balance);
      dispatchBalanceUpdate(data.new_balance, "sellback");

      // Clear shake state now that the user has made a decision
      clearShakeState();
      setEliminatedIds([]);

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
    if (!revealedItem) return;
    track({ event: "item_kept", properties: { rarity: revealedItem.rarity } });

    // Clear shake state now that the user has made a decision
    clearShakeState();
    setEliminatedIds([]);

    setOpenState("decided");

    setTimeout(() => {
      setOpenState("idle");
      setRevealedItem(null);
    }, 2000);
  };

  const canAffordBox = balance >= BOX_PRICE;
  const canAffordShake = balance >= SHAKE_PRICE;
  const hasShake = eliminatedIds.length > 0;

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
              <BoxContents onItemClick={setSelectedItem} eliminatedIds={eliminatedIds} />
            </div>
          </div>
        </div>

        {/* Center: Main Box Content */}
        <div className="flex-1 flex flex-col items-center justify-center py-8 min-w-0">

          {/* Idle State */}
          {(openState === "idle" || openState === "shaking") && (
            <div className="text-center max-w-lg mx-auto w-full animate-[fadeIn_0.5s_ease-out]">
              <h1 className="text-5xl font-bold text-orange-950 mb-4">
                Blind Box
              </h1>
              <p className="text-lg text-orange-800 mb-8 max-w-sm mx-auto">
                Open a blind box to reveal a surprise collectible! Sell it back instantly or add it to your collection.
              </p>

              {/* The Box */}
              <div className="relative w-56 h-56 mx-auto mb-6">
                <div className={`absolute inset-0 blur-[80px] opacity-50 rounded-full animate-pulse-glow ${hasShake ? "bg-purple-400" : "bg-orange-400"}`}></div>
                <div className={`relative w-full h-full bg-gradient-to-br rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-all duration-300 border-4 border-white/30 cursor-pointer group ${
                  hasShake
                    ? "from-purple-400 via-purple-500 to-indigo-600"
                    : "from-orange-400 via-orange-500 to-red-600"
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
                  {isShaking ? (
                    <Shuffle weight="fill" className="text-[130px] text-white drop-shadow-2xl relative z-10 animate-[wiggle_0.15s_ease-in-out_infinite]" />
                  ) : (
                    <Package weight="fill" className="text-[130px] text-white drop-shadow-2xl relative z-10 group-hover:scale-110 transition-transform" />
                  )}
                </div>
              </div>

              {/* Price and Buttons */}
              <div className="bg-white rounded-2xl p-5 mb-4 border border-orange-100 shadow-md">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-base font-semibold text-orange-950">Box Price:</span>
                  <span className="text-3xl font-bold text-orange-600">${BOX_PRICE.toFixed(2)}</span>
                </div>

                {/* Shake result message */}
                {hasShake && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
                    <p className="text-sm font-bold text-purple-700 text-center mb-2">
                      🎲 {eliminatedIds.length} items eliminated — check the list!
                    </p>
                    <button
                      onClick={handleFreshBox}
                      className="w-full bg-white border-2 border-purple-300 text-purple-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-100 transition-all"
                    >
                      ↺ Try a fresh box
                    </button>
                  </div>
                )}

                {(error || shakeError) && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">
                    {error || shakeError}
                  </div>
                )}

                {/* Open Button */}
                <button
                  onClick={handleOpenBox}
                  disabled={(!!user && !canAffordBox) || openState === "shaking"}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl hover:shadow-orange-500/50 hover:scale-105 flex items-center justify-center gap-3 mb-3"
                >
                  <Sparkle weight="fill" className="text-xl" />
                  {user ? (hasShake ? "Open This Box!" : "Open Now!") : "Sign Up to Open"}
                </button>

                {/* Shake Button */}
                {user && !hasShake && (
                  <button
                    onClick={handleShake}
                    disabled={!canAffordShake || isShaking}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-10 py-3 rounded-xl font-bold text-sm hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/30 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Shuffle weight="fill" className="text-base" />
                    {isShaking ? "Shaking..." : `Shake this box — $${SHAKE_PRICE.toFixed(2)}`}
                  </button>
                )}

                {/* Shake help text */}
                {user && !hasShake && (
                  <p className="text-center text-xs text-orange-400 mt-2">
                    Shake to eliminate half the possibilities — then decide.
                  </p>
                )}

                {user && !canAffordBox && (
                  <p className="text-red-500 mt-3 font-medium text-sm">
                    Insufficient balance. Please top up your account.
                  </p>
                )}

                {user && !hasShake && !canAffordShake && canAffordBox && (
                  <p className="text-orange-400 mt-2 text-xs text-center">
                    Need ${SHAKE_PRICE.toFixed(2)} to shake.
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

      {/* Mobile Bottom Buttons */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-3 z-40 lg:hidden">
        <button
          onClick={() => setMobilePanel(mobilePanel === "contents" ? "none" : "contents")}
          className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-orange-200 text-orange-950 px-4 py-2.5 rounded-full font-bold text-sm shadow-lg"
        >
          <ListBullets weight="bold" className="text-base" />
          What's Inside
        </button>
        <button
          onClick={() => setMobilePanel(mobilePanel === "chat" ? "none" : "chat")}
          className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-orange-200 text-orange-950 px-4 py-2.5 rounded-full font-bold text-sm shadow-lg"
        >
          <ChatCircleDots weight="fill" className="text-base" />
          Live Chat
        </button>
      </div>

      {/* Mobile Panel Drawer */}
      {mobilePanel !== "none" && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobilePanel("none")} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: "75vh" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100 flex-shrink-0">
              <h3 className="font-bold text-orange-950 text-sm flex items-center gap-2">
                {mobilePanel === "contents" ? (
                  <><ListBullets weight="bold" className="text-base" /> What's Inside</>
                ) : (
                  <><ChatCircleDots weight="fill" className="text-base" /> Live Chat</>
                )}
              </h3>
              <button onClick={() => setMobilePanel("none")} className="text-orange-400 hover:text-orange-600 font-bold text-lg">✕</button>
            </div>
            <div className={`flex-1 p-3 ${mobilePanel === "contents" ? "overflow-y-auto" : "overflow-hidden flex flex-col min-h-0"}`}>
              {mobilePanel === "contents" ? (
                <BoxContents
                  onItemClick={(item) => { setSelectedItem(item); setMobilePanel("none"); }}
                  eliminatedIds={eliminatedIds}
                />
              ) : (
                <LiveChat />
              )}
            </div>
          </div>
        </div>
      )}

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
        @keyframes wiggle {
          0%, 100% { transform: rotate(-8deg) translateX(-4px); }
          50% { transform: rotate(8deg) translateX(4px); }
        }
      `}</style>
    </div>
  );
}
