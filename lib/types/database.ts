export type RarityTier = "common" | "uncommon" | "rare" | "ultra";

export type InventoryStatus = "kept" | "shipping_requested" | "shipped" | "sold";

export type TransactionType = "topup" | "box_purchase" | "sellback" | "shipping" | "refund" | "box_shake";

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  account_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  rarity: RarityTier;
  wholesale_cost: number;
  resale_value: number;
  buyback_price: number;
  image_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  quantity_available: number;
  updated_at: string;
}

export interface UserInventoryItem {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  rarity: RarityTier;
  buyback_price: number;
  status: InventoryStatus;
  acquired_at: string;
  shipped_at?: string;
  tracking_number?: string;
  shipping_address?: ShippingAddress;
}

export interface BalanceTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  description: string;
  stripe_session_id?: string;
  related_inventory_id?: string;
  created_at: string;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface BoxOpenResult {
  success: boolean;
  message: string;
  product_id?: string;
  product_name?: string;
  rarity?: RarityTier;
  buyback_price?: number;
  resale_value?: number;
  inventory_item_id?: string;
  new_balance?: number;
}

export interface SellbackResult {
  success: boolean;
  message: string;
  amount_credited?: number;
  new_balance?: number;
}

// Rarity odds configuration
export const RARITY_ODDS = {
  common: 0.705,
  uncommon: 0.25,
  rare: 0.04,
  ultra: 0.005,
} as const;

// Product configuration
export const BOX_PRICE = 25;
export const SHAKE_PRICE = 1.49;
export const SHIPPING_FEE = 5.0;

// Rarity colors for UI
export const RARITY_COLORS = {
  common: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
  },
  uncommon: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  rare: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-300",
  },
  ultra: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-300",
  },
} as const;
