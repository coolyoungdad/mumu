"use client";

import { Trophy } from "@phosphor-icons/react/dist/ssr";

const stats = [
  { value: "$2.5M+", label: "Value Unboxed" },
  { value: "4.9/5", label: "App Store" },
  { value: "Instant", label: "Payouts" },
];

export default function CTASection() {
  return (
    <section className="py-24 px-6 relative z-10 overflow-hidden">
      <div className="max-w-5xl mx-auto bg-orange-600 rounded-[3rem] p-10 md:p-16 text-center text-white relative shadow-2xl shadow-orange-500/40">
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-700 to-red-500 rounded-[3rem] z-0"></div>
        <div className="absolute inset-0 dot-pattern opacity-10 rounded-[3rem] z-0"></div>

        <div className="relative z-10">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-full mb-6">
            <Trophy weight="fill" className="text-4xl text-yellow-300" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Join 250,000+ Winners
          </h2>
          <p className="text-xl text-orange-50 max-w-2xl mx-auto mb-10">
            Climb the leaderboards, earn XP for every unbox, and unlock exclusive
            VIP boxes.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[140px]"
              >
                <span className="text-3xl font-bold text-white">{stat.value}</span>
                <span className="text-sm text-orange-100">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <button className="bg-white text-orange-600 px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:scale-105 transition-all shadow-lg">
              Create Free Account
            </button>
            <p className="mt-4 text-sm text-orange-100 opacity-80">
              No credit card required to browse
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
