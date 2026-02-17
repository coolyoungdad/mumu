"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Package } from "@phosphor-icons/react/dist/ssr";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    router.push("/topup");
    return null;
  }

  return (
    <div className="relative min-h-screen">
      <div className="gradient-bg"></div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-20">
        <div className="glass-card-white p-12 rounded-3xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle weight="fill" className="text-5xl text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-orange-950 mb-4">
            Top-Up Successful!
          </h1>

          <p className="text-xl text-orange-800 mb-8">
            Your account balance has been updated. Time to open some boxes!
          </p>

          <div className="bg-orange-50 rounded-2xl p-8 mb-8">
            <h2 className="text-lg font-bold text-orange-950 mb-4">
              What's next?
            </h2>
            <div className="space-y-3 text-left text-orange-800">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <p>Your balance has been credited to your account</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <p>Head to the box opening page to start unboxing</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <p>Keep or sell back items to grow your balance</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push("/box")}
              className="flex-1 bg-orange-600 text-white py-4 rounded-full font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
            >
              <Package weight="fill" />
              Open Boxes
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="flex-1 bg-orange-100 text-orange-600 py-4 rounded-full font-bold hover:bg-orange-200 transition-colors"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TopUpSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
