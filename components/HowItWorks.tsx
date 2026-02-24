"use client";

import { Cube, Sparkle, ArrowsLeftRight, Lightning } from "@phosphor-icons/react/dist/ssr";

const steps = [
  {
    number: 1,
    icon: Cube,
    title: "Open a Box",
    description:
      "Browse collectible boxes from brands you love. Thoughtfully priced, always fun to open.",
    featured: {
      category: "Featured",
      title: "Mystery Box",
      iconBg: "bg-orange-600",
    },
  },
  {
    number: 2,
    icon: Sparkle,
    title: "Reveal & Win",
    description:
      "Open it instantly. Every box contains a real collectible.",
    animation: "You got The Joy Skullpanda!",
  },
  {
    number: 3,
    icon: ArrowsLeftRight,
    title: "Keep or Sell",
    description:
      "Love it? We ship it. Don't need it? Sell it back to us instantly for credit.",
    buttons: true,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-orange-950 mb-6">
            How Mumu Works
          </h2>
          <p className="text-xl text-orange-800 max-w-2xl mx-auto">
            No junk. Only high-quality pulls with guaranteed value and instant cash-out.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="glass-card-white p-8 rounded-[2rem] relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  {step.number}
                </div>

                <h3 className="text-2xl font-bold text-orange-950 mb-4">
                  {step.title}
                </h3>
                <p className="text-orange-800/80 leading-relaxed">
                  {step.description}
                </p>

                {/* Step-specific content */}
                {step.featured && (
                  <div className="mt-8">
                    <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-4">
                      <div
                        className={`w-12 h-12 ${step.featured.iconBg} rounded-lg flex items-center justify-center text-white`}
                      >
                        <Lightning weight="bold" />
                      </div>
                      <div>
                        <div className="text-xs text-orange-500 font-bold uppercase">
                          {step.featured.category}
                        </div>
                        <div className="text-orange-900 font-bold">
                          {step.featured.title}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step.animation && (
                  <div className="mt-8 relative h-16">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-pulse-glow bg-orange-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform rotate-3">
                        {step.animation}
                      </div>
                    </div>
                  </div>
                )}

                {step.buttons && (
                  <div className="mt-8 flex gap-2">
                    <button className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-bold text-sm shadow-md hover:bg-orange-600 transition-colors">
                      Sell $240
                    </button>
                    <button className="flex-1 bg-orange-100 text-orange-600 py-2 rounded-lg font-bold text-sm hover:bg-orange-200 transition-colors">
                      Ship It
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
