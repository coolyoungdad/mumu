import { SHAKE_PRICE, type RarityTier } from "@/lib/types/database";
import { getDemoProducts } from "./products";
import { deductDemoBalance } from "./balance";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface DemoShakeResult {
  success: boolean;
  error?: string;
  eliminated_product_ids?: string[];
  eliminated_count?: number;
  new_balance?: number;
}

export async function demoShake(): Promise<DemoShakeResult> {
  const newBalance = deductDemoBalance(SHAKE_PRICE);
  if (newBalance === null) {
    return { success: false, error: "Insufficient balance" };
  }

  const products = await getDemoProducts();
  const inStock = products.filter((p) => p.stock > 0);

  const rarities: RarityTier[] = ["common", "uncommon", "rare"];
  const eliminatedIds: string[] = [];

  for (const rarity of rarities) {
    const tier = inStock.filter((p) => p.rarity === rarity);
    const count = Math.floor(tier.length * 0.5);
    const eliminated = shuffle(tier).slice(0, count);
    eliminatedIds.push(...eliminated.map((p) => p.id));
  }

  return {
    success: true,
    eliminated_product_ids: eliminatedIds,
    eliminated_count: eliminatedIds.length,
    new_balance: newBalance,
  };
}
