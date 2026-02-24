import type { RarityTier } from "@/lib/types/database";

export interface DemoProduct {
  id: string;
  name: string;
  sku: string;
  rarity: RarityTier;
  buyback_price: number;
  resale_value: number;
  brand: string;
  stock: number;
}

let _cache: DemoProduct[] | null = null;
let _fetchPromise: Promise<DemoProduct[]> | null = null;

export async function getDemoProducts(): Promise<DemoProduct[]> {
  if (_cache) return _cache;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = fetch("/api/products")
    .then((res) => res.json())
    .then((data) => {
      const products: DemoProduct[] = (data.products ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        sku: (p.sku as string) ?? (p.id as string),
        rarity: p.rarity as RarityTier,
        buyback_price: parseFloat(String(p.buyback_price)),
        resale_value: parseFloat(String(p.resale_value)),
        brand: (p.brand as string) ?? "",
        stock: (p.stock as number) ?? 0,
      }));
      _cache = products;
      return products;
    })
    .catch(() => {
      _fetchPromise = null;
      return [];
    });

  return _fetchPromise;
}
