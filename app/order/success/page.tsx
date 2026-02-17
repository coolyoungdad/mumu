"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Package, Sparkle } from "@phosphor-icons/react/dist/ssr";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    // Verify session and show success
    setIsLoading(false);
  }, [sessionId, router]);

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

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-20">
        <div className="glass-card-white p-12 rounded-3xl text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle weight="fill" className="text-5xl text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-orange-950 mb-4">
            Order Confirmed!
          </h1>

          <p className="text-xl text-orange-800 mb-8">
            Your mystery box is on its way. Get ready for the reveal!
          </p>

          {/* What's Next */}
          <div className="bg-orange-50 rounded-2xl p-8 mb-8 text-left">
            <h2 className="text-2xl font-bold text-orange-950 mb-6 flex items-center gap-2">
              <Sparkle weight="fill" className="text-orange-600" />
              What happens next?
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-orange-950 mb-1">
                    Check your email
                  </h3>
                  <p className="text-orange-800 text-sm">
                    We've sent a confirmation with your order details and what you
                    won!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-orange-950 mb-1">We'll ship it</h3>
                  <p className="text-orange-800 text-sm">
                    Your item will be shipped within 2-3 business days via USPS
                    First Class.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-orange-950 mb-1">
                    Track your package
                  </h3>
                  <p className="text-orange-800 text-sm">
                    You'll receive a tracking number once your order ships.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-orange-600 text-white py-4 rounded-full font-bold hover:bg-orange-700 transition-colors"
            >
              Buy Another Box
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-orange-100 text-orange-600 py-4 rounded-full font-bold hover:bg-orange-200 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Share */}
        <div className="text-center mt-8">
          <p className="text-white/80 text-sm">
            Love PomPom? Share with your friends! 🎁
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
