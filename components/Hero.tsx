"use client";

import { ArrowRight, Sneaker, GameController, Watch, Package } from "@phosphor-icons/react/dist/ssr";

export default function Hero() {
  return (
    <section className="relative pt-40 pb-20 px-6 z-10 min-h-screen flex flex-col justify-center items-center text-center">
      <div className="max-w-4xl mx-auto relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full text-orange-800 mb-8 animate-float">
          <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
          <span className="text-sm font-semibold tracking-wide uppercase">
            Live Drops Happening Now
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-extrabold text-orange-950 tracking-tight leading-tight mb-8">
          Unbox the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-500 italic inline-block pr-8">
            Unexpected
          </span>
        </h1>

        <p className="text-lg md:text-xl text-orange-800 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Shopping that feels like play.<br />
          Open a box, reveal what you got, and keep what you love.<br />
          Not your vibe? Sell it back instantly for cash.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/box"
            className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white rounded-full font-bold text-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            Play Now
            <ArrowRight weight="bold" />
          </a>
        </div>
      </div>

      {/* 3D Box with floating products */}
      <div className="mt-20 relative w-full max-w-lg mx-auto aspect-square md:aspect-video flex items-center justify-center">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-pink-300 blur-[100px] opacity-20 rounded-full"></div>

        {/* Floating product icons */}
        <div className="absolute top-0 right-10 bg-white p-3 rounded-2xl shadow-xl animate-float-slow transform rotate-12 z-20">
          <Sneaker weight="fill" className="text-4xl text-orange-500" />
        </div>
        <div className="absolute bottom-10 left-10 bg-white p-3 rounded-2xl shadow-xl animate-float transform -rotate-12 z-20">
          <GameController weight="fill" className="text-4xl text-coral-500" />
        </div>
        <div className="absolute top-1/2 left-0 bg-white p-3 rounded-2xl shadow-xl animate-float-delayed transform -rotate-6 z-20">
          <Watch weight="fill" className="text-4xl text-amber-500" />
        </div>

        {/* Central mystery box */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl shadow-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500 group cursor-pointer border-4 border-white/20">
          <div className="absolute inset-0 dot-pattern opacity-20 rounded-2xl"></div>
          <Package
            weight="fill"
            className="text-9xl text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute -bottom-6 bg-white text-orange-600 px-6 py-2 rounded-full font-bold shadow-lg border border-orange-100 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            $25
          </div>
        </div>
      </div>
    </section>
  );
}
