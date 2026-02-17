"use client";

import { Sneaker, Laptop, Handbag, GameController } from "@phosphor-icons/react/dist/ssr";

const products = [
  {
    id: 1,
    name: "Kicks Vol. 4",
    category: "Sneakers",
    topPrize: "Dior Jordan 1",
    price: "$45",
    icon: Sneaker,
    gradient: "from-gray-100 to-gray-200",
    categoryColor: "bg-black/5 text-black/60",
    iconColor: "text-gray-400",
  },
  {
    id: 2,
    name: "Apple Box",
    category: "Tech",
    topPrize: "MacBook Pro",
    price: "$15",
    icon: Laptop,
    gradient: "from-orange-100 to-orange-200",
    categoryColor: "bg-orange-600/10 text-orange-600",
    iconColor: "text-orange-400",
  },
  {
    id: 3,
    name: "High Fashion",
    category: "Luxury",
    topPrize: "Birkin Bag",
    price: "$95",
    icon: Handbag,
    gradient: "from-coral-100 to-orange-100",
    categoryColor: "bg-orange-600/10 text-orange-600",
    iconColor: "text-orange-400",
  },
  {
    id: 4,
    name: "Gamer Set",
    category: "Gaming",
    topPrize: "Setup Bundle",
    price: "$25",
    icon: GameController,
    gradient: "from-rose-100 to-orange-100",
    categoryColor: "bg-orange-600/10 text-orange-600",
    iconColor: "text-orange-400",
  },
];

export default function ProductGrid() {
  return (
    <section className="py-20 px-6 relative z-10 bg-orange-50/50 backdrop-blur-xl">
      <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-bold text-orange-950">Trending Boxes</h2>
            <p className="text-orange-600 mt-2 font-medium">
              The hottest collections dropping right now.
            </p>
          </div>
          <button className="px-6 py-3 rounded-full border-2 border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-colors">
            View All Collections
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <div
                key={product.id}
                className="bg-white p-4 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-orange-50"
              >
                <div
                  className={`relative bg-gradient-to-br ${product.gradient} rounded-2xl aspect-square flex items-center justify-center mb-4 overflow-hidden`}
                >
                  <div
                    className={`absolute top-3 left-3 ${product.categoryColor} px-2 py-1 rounded text-xs font-bold`}
                  >
                    {product.category}
                  </div>
                  <Icon
                    weight="fill"
                    className={`text-6xl ${product.iconColor} group-hover:scale-110 transition-transform duration-300`}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="font-bold text-lg text-orange-950">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Top Prize: {product.topPrize}
                    </p>
                  </div>
                  <div className="text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-full text-sm">
                    {product.price}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
