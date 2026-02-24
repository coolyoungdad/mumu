import type { RarityTier } from "@/lib/types/database";

const DEMO_INVENTORY_KEY = "mumu_demo_inventory";

export interface DemoInventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  rarity: RarityTier;
  buyback_price: number;
  status: "kept" | "sold";
  acquired_at: string;
}

export function getDemoInventory(): DemoInventoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEMO_INVENTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDemoInventory(items: DemoInventoryItem[]) {
  localStorage.setItem(DEMO_INVENTORY_KEY, JSON.stringify(items));
}

export function addDemoInventoryItem(
  item: Omit<DemoInventoryItem, "id" | "acquired_at" | "status">
): DemoInventoryItem {
  const newItem: DemoInventoryItem = {
    ...item,
    id: crypto.randomUUID(),
    status: "kept",
    acquired_at: new Date().toISOString(),
  };
  const inventory = getDemoInventory();
  inventory.unshift(newItem);
  saveDemoInventory(inventory);
  return newItem;
}

export function sellDemoInventoryItem(itemId: string): boolean {
  const inventory = getDemoInventory();
  const index = inventory.findIndex((i) => i.id === itemId);
  if (index === -1) return false;
  inventory[index].status = "sold";
  saveDemoInventory(inventory);
  return true;
}
