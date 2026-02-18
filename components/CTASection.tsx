"use client";

import { Sparkle } from "@phosphor-icons/react/dist/ssr";

export default function CTASection() {
  return (
    <section className="py-24 px-6 relative z-10 overflow-hidden">
      <div className="max-w-5xl mx-auto bg-orange-600 rounded-[3rem] p-10 md:p-16 text-center text-white relative shadow-2xl shadow-orange-500/40">
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-700 to-red-500 rounded-[3rem] z-0"></div>
        <div className="absolute inset-0 dot-pattern opacity-10 rounded-[3rem] z-0"></div>

        <div className="relative z-10">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-full mb-6">
            <Sparkle weight="fill" className="text-4xl text-yellow-300" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Create a Free Account
          </h2>
          <p className="text-xl text-orange-50 max-w-2xl mx-auto mb-10">
            Start opening today and discover your favorite collectibles. Instant buyback on every item. Make your shopping feel like play.
          </p>

          <div className="mt-12">
            <a href="/auth/signup" className="inline-block bg-white text-orange-600 px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:scale-105 transition-all shadow-lg">
              Create Free Account
            </a>
            <p className="mt-4 text-sm text-orange-100 opacity-80">
              No credit card required to browse
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
