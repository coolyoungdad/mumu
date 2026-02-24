import { RARITY_ODDS, BOX_PRICE, type RarityTier } from "@/lib/types/database";
import { getDemoProducts, type DemoProduct } from "./products";
import { deductDemoBalance } from "./balance";

export interface DemoOpenResult {
  success: boolean;
  error?: string;
  product?: DemoProduct;
  new_balance?: number;
}

function rollRarity(): RarityTier {
  const rand = Math.random();
  let cumulative = 0;
  const tiers: RarityTier[] = ["ultra", "rare", "uncommon", "common"];
  for (const tier of tiers) {
    cumulative += RARITY_ODDS[tier];
    if (rand < cumulative) return tier;
  }
  return "common";
}

function pickProduct(products: DemoProduct[], rarity: RarityTier, excludedIds: string[]): DemoProduct | null {
  const eligible = products.filter(
    (p) => p.rarity === rarity && p.stock > 0 && !excludedIds.includes(p.id)
  );
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

export async function demoOpenBox(excludedIds: string[] = []): Promise<DemoOpenResult> {
  const newBalance = deductDemoBalance(BOX_PRICE);
  if (newBalance === null) {
    return { success: false, error: "Insufficient balance" };
  }

  const products = await getDemoProducts();
  if (products.length === 0) {
    return { success: false, error: "Failed to load products" };
  }

  const rarity = rollRarity();
  let product = pickProduct(products, rarity, excludedIds);

  // Fallback cascade if rolled tier is empty after exclusions
  if (!product) {
    const fallbackOrder: RarityTier[] = ["common", "uncommon", "rare", "ultra"];
    for (const fallback of fallbackOrder) {
      product = pickProduct(products, fallback, excludedIds);
      if (product) break;
    }
  }

  if (!product) {
    return { success: false, error: "No products available" };
  }

  return { success: true, product, new_balance: newBalance };
}
