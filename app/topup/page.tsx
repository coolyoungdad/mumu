"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CurrencyDollar, Sparkle, Gift } from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";

const TOPUP_AMOUNTS = [
  { label: "$25", value: 25 },
  { label: "$50", value: 50 },
  { label: "$100", value: 100 },
  { label: "$200", value: 200 },
];

export default function TopUpPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    setUser(user);

    // Fetch user balance
    const { data: userData } = await supabase
      .from("users")
      .select("account_balance")
      .eq("id", user.id)
      .single();

    if (userData) {
      setBalance(userData.account_balance);
    }

    setIsLoading(false);
  };

  const handleDemoRefill = async () => {
    setIsRefilling(true);
    setError(null);
    try {
      const response = await fetch("/api/demo/refill", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to refill");
      setBalance(data.balance);
      window.dispatchEvent(new CustomEvent("balance-updated", { detail: { balance: data.balance } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refill");
    } finally {
      setIsRefilling(false);
    }
  };

  const handleTopUp = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

    if (amount < 5) {
      setError("Minimum top-up amount is $5");
      return;
    }

    if (amount > 1000) {
      setError("Maximum top-up amount is $1000");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/topup/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process top-up");
      setIsProcessing(false);
    }
  };

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-orange-950 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="gradient-bg"></div>
      <Navbar />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-20 mt-20">
        <button
          onClick={() => router.push("/profile")}
          className="text-orange-800 hover:text-orange-600 transition-colors mb-8"
        >
          ← Back to Profile
        </button>

        <div className="glass-card-white p-12 rounded-3xl">

          {/* Demo Mode Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Gift weight="fill" className="text-2xl text-green-600 flex-shrink-0" />
              <div>
                <div className="font-bold text-green-900">Demo Mode — Free Credits!</div>
                <div className="text-sm text-green-700">Running low? Refill your balance instantly for free.</div>
              </div>
            </div>
            <button
              onClick={handleDemoRefill}
              disabled={isRefilling}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-base transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefilling ? "Refilling..." : "🎁 Get $500 Demo Credits"}
            </button>
          </div>

          <div className="text-center mb-8">
            <Sparkle
              weight="fill"
              className="text-5xl text-orange-600 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-orange-950 mb-2">
              Top Up Balance
            </h1>
            <p className="text-orange-800">
              Add funds to your account to open more mystery boxes
            </p>
          </div>

          {/* Current Balance */}
          <div className="bg-orange-50 rounded-xl p-6 mb-8">
            <div className="text-center">
              <div className="text-sm text-orange-600 mb-2">Current Balance</div>
              <div className="text-4xl font-bold text-orange-950">
                ${balance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Quick Amounts */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-orange-950 mb-3">
              Quick Select
            </label>
            <div className="grid grid-cols-4 gap-3">
              {TOPUP_AMOUNTS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedAmount(option.value);
                    setCustomAmount("");
                  }}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    selectedAmount === option.value && !customAmount
                      ? "bg-orange-600 text-white shadow-lg"
                      : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-orange-950 mb-2">
              Or Enter Custom Amount
            </label>
            <div className="relative">
              <CurrencyDollar
                weight="bold"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 text-xl"
              />
              <input
                type="number"
                min="5"
                max="1000"
                step="0.01"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(0);
                }}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-orange-200 focus:border-orange-600 focus:outline-none text-orange-950 font-bold text-xl"
              />
            </div>
            <p className="text-xs text-orange-600 mt-2">
              Min: $5.00 • Max: $1,000.00
            </p>
          </div>

          {/* Total Preview */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-orange-950 font-medium">Amount to Add</span>
              <span className="text-2xl font-bold text-orange-950">
                ${finalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-orange-600">New Balance</span>
              <span className="font-bold text-orange-600">
                ${(balance + finalAmount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
              {error}
            </div>
          )}

          {/* Submit Button */}
          {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
            <div className="w-full bg-orange-100 text-orange-400 py-4 rounded-full font-bold text-lg text-center cursor-not-allowed border-2 border-dashed border-orange-200">
              Real payments disabled in demo
            </div>
          ) : (
            <button
              onClick={handleTopUp}
              disabled={isProcessing || finalAmount < 5}
              className="w-full bg-orange-600 text-white py-4 rounded-full font-bold text-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isProcessing ? "Processing..." : `Add $${finalAmount.toFixed(2)}`}
            </button>
          )}

          <p className="text-xs text-center text-orange-600 mt-4">
            {process.env.NEXT_PUBLIC_DEMO_MODE === "true"
              ? "Use the Demo Credits button above to add balance"
              : "Secure payment powered by Stripe"}
          </p>
        </div>
      </div>
    </div>
  );
}
