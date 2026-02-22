"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Sparkle, Lightning } from "@phosphor-icons/react/dist/ssr";
import { BOX_PRICE, SHIPPING_FEE } from "@/lib/types/database";

export default function CheckoutPage() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = BOX_PRICE * quantity;
  const total = subtotal + SHIPPING_FEE;

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="gradient-bg"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="mb-8 text-orange-800 hover:text-orange-600 transition-colors flex items-center gap-2"
        >
          ← Back to Home
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Info */}
          <div className="glass-card-white p-8 rounded-3xl">
            <div className="relative bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl aspect-square flex items-center justify-center mb-6 border-4 border-white/20">
              <div className="absolute inset-0 dot-pattern opacity-20 rounded-2xl"></div>
              <Package weight="fill" className="text-9xl text-white drop-shadow-lg relative z-10" />
            </div>

            <h1 className="text-3xl font-bold text-orange-950 mb-4">
              MuMu Mystery Box
            </h1>

            <p className="text-orange-800 mb-6 leading-relaxed">
              Every box contains one curated item from top brands. Items range from
              $8 to $120 in resale value!
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-orange-800">
                <Sparkle weight="fill" className="text-orange-600" />
                <span>Guaranteed authentic products</span>
              </div>
              <div className="flex items-center gap-3 text-orange-800">
                <Lightning weight="fill" className="text-orange-600" />
                <span>Instant reveal after payment</span>
              </div>
              <div className="flex items-center gap-3 text-orange-800">
                <Package weight="fill" className="text-orange-600" />
                <span>Free shipping included</span>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-4">
              <h3 className="font-bold text-orange-950 mb-2">What's inside?</h3>
              <div className="space-y-2 text-sm text-orange-800">
                <div className="flex justify-between">
                  <span>Common (60%)</span>
                  <span className="font-bold">$8 value</span>
                </div>
                <div className="flex justify-between">
                  <span>Uncommon (25%)</span>
                  <span className="font-bold">$18 value</span>
                </div>
                <div className="flex justify-between">
                  <span>Rare (10%)</span>
                  <span className="font-bold">$40 value</span>
                </div>
                <div className="flex justify-between">
                  <span>Ultra (5%)</span>
                  <span className="font-bold text-orange-600">$120 value!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="glass-card-white p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-orange-950 mb-6">
              Complete Your Order
            </h2>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-orange-950 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full font-bold hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-orange-950 w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  disabled={quantity >= 10}
                  className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full font-bold hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-orange-600 mt-2">Max 10 boxes per order</p>
            </div>

            {/* Order Summary */}
            <div className="bg-orange-50 rounded-xl p-6 mb-6 space-y-3">
              <div className="flex justify-between text-orange-800">
                <span>Subtotal ({quantity} {quantity === 1 ? "box" : "boxes"})</span>
                <span className="font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-orange-800">
                <span>Shipping</span>
                <span className="font-bold">${SHIPPING_FEE.toFixed(2)}</span>
              </div>
              <div className="border-t border-orange-200 pt-3 flex justify-between text-orange-950 text-xl">
                <span className="font-bold">Total</span>
                <span className="font-bold">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
                {error}
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-4 rounded-full font-bold text-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Processing..." : "Proceed to Payment"}
            </button>

            <p className="text-xs text-center text-orange-600 mt-4">
              Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
