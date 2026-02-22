"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus,
  PencilSimple,
  Trash,
  ArrowLeft,
  Package,
  X,
  CloudArrowUp,
  StackPlus,
} from "@phosphor-icons/react/dist/ssr";
import type { RarityTier } from "@/lib/types/database";

interface ProductWithStock {
  id: string;
  name: string;
  sku: string;
  rarity: RarityTier;
  wholesale_cost: number;
  resale_value: number;
  buyback_price: number;
  description: string;
  image_url: string | null;
  stock: number;
}

const EMPTY_FORM = {
  name: "",
  sku: "",
  rarity: "common" as RarityTier,
  wholesale_cost: "12.00",
  resale_value: "",
  buyback_price: "",
  description: "",
  image_url: "",
  initial_stock: "0",
};

const rarityBadge: Record<RarityTier, string> = {
  common:   "bg-gray-100 text-gray-700",
  uncommon: "bg-blue-100 text-blue-700",
  rare:     "bg-orange-100 text-orange-800",
  ultra:    "bg-purple-100 text-purple-800",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RarityTier | "all">("all");

  // Add / Edit modal
  const [modal, setModal] = useState<"add" | "edit" | "stock" | null>(null);
  const [editing, setEditing] = useState<ProductWithStock | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Stock modal
  const [stockAmount, setStockAmount] = useState("");
  const [stockLoading, setStockLoading] = useState(false);

  // Image upload
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setModal("add");
  }

  function openEdit(p: ProductWithStock) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      rarity: p.rarity,
      wholesale_cost: p.wholesale_cost.toString(),
      resale_value: p.resale_value.toString(),
      buyback_price: p.buyback_price.toString(),
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      initial_stock: p.stock.toString(),
    });
    setFormError("");
    setModal("edit");
  }

  function openStock(p: ProductWithStock) {
    setEditing(p);
    setStockAmount("");
    setModal("stock");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/products/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      setForm((f) => ({ ...f, image_url: data.url }));
    } else {
      setFormError(data.error ?? "Upload failed");
    }
    setUploading(false);
  }

  async function handleSave() {
    setFormError("");
    if (!form.name.trim() || !form.sku.trim() || !form.buyback_price) {
      setFormError("Name, SKU, and buyback price are required.");
      return;
    }
    setSaving(true);
    if (modal === "add") {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to save"); setSaving(false); return; }
    } else if (modal === "edit" && editing) {
      const res = await fetch(`/api/admin/products/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to save"); setSaving(false); return; }
    }
    setSaving(false);
    setModal(null);
    load();
  }

  async function handleStock() {
    if (!editing || !stockAmount) return;
    setStockLoading(true);
    const res = await fetch(`/api/admin/products/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ add_stock: parseInt(stockAmount) }),
    });
    setStockLoading(false);
    if (res.ok) { setModal(null); load(); }
  }

  async function handleDelete(p: ProductWithStock) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? "Delete failed"); return; }
    load();
  }

  const filtered = filter === "all"
    ? products
    : products.filter((p) => p.rarity === filter);

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors"
            >
              <ArrowLeft weight="bold" className="text-orange-600" />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-orange-950">Products</h1>
              <p className="text-orange-600 mt-0.5 text-sm">{products.length} items in catalog</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-orange-700 transition-colors"
          >
            <Plus weight="bold" />
            Add Product
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "common", "uncommon", "rare", "ultra"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-colors ${
                filter === r
                  ? "bg-orange-600 text-white"
                  : "bg-white text-orange-600 border border-orange-200 hover:bg-orange-50"
              }`}
            >
              {r === "all" ? `All (${products.length})` : `${r} (${products.filter((p) => p.rarity === r).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-orange-100 p-4 animate-pulse">
                <div className="w-full aspect-square bg-gray-100 rounded-xl mb-3" />
                <div className="h-4 bg-gray-100 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-orange-400">
            <Package className="text-5xl mx-auto mb-4 opacity-30" />
            <p className="font-medium">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-orange-100 overflow-hidden flex flex-col"
              >
                {/* Image */}
                <div className="aspect-square bg-orange-50 flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="text-4xl text-orange-200" />
                  )}
                </div>

                <div className="p-3 flex flex-col gap-2 flex-1">
                  <div>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${rarityBadge[p.rarity]}`}>
                      {p.rarity}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-orange-950 leading-tight">{p.name}</p>
                  <p className="text-xs text-orange-400">{p.description || "—"}</p>
                  <div className="flex justify-between text-xs text-orange-600 font-medium">
                    <span>Buyback: ${p.buyback_price}</span>
                    <span
                      className={`font-bold ${
                        p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-orange-500" : "text-green-600"
                      }`}
                    >
                      {p.stock} left
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 mt-auto pt-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 py-1.5 rounded-lg transition-colors"
                    >
                      <PencilSimple weight="bold" />
                      Edit
                    </button>
                    <button
                      onClick={() => openStock(p)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 rounded-lg transition-colors"
                    >
                      <StackPlus weight="bold" />
                      Stock
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="w-8 flex items-center justify-center text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-orange-100">
              <h2 className="text-xl font-bold text-orange-950">
                {modal === "add" ? "Add New Product" : `Edit: ${editing?.name}`}
              </h2>
              <button onClick={() => setModal(null)} className="text-orange-400 hover:text-orange-600">
                <X weight="bold" className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {formError}
                </div>
              )}

              {/* Image upload */}
              <div>
                <label className="block text-xs font-bold text-orange-600 uppercase mb-2">
                  Product Photo
                </label>
                {form.image_url ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-orange-200 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                      className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow text-red-500"
                    >
                      <X weight="bold" className="text-xs" />
                    </button>
                  </div>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleUpload}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl border border-orange-200 transition-colors disabled:opacity-50"
                >
                  <CloudArrowUp weight="bold" />
                  {uploading ? "Uploading…" : form.image_url ? "Change Photo" : "Upload Photo"}
                </button>
                <p className="text-xs text-orange-400 mt-1">JPEG, PNG or WebP · max 5MB</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-orange-600 uppercase mb-1">
                    Product Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Clown Labubu"
                    className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-orange-600 uppercase mb-1">
                    SKU Code *
                  </label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                    placeholder="CLOWN-LABUBU"
                    className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
                  />
                  <p className="text-xs text-orange-400 mt-0.5">Short code, no spaces</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-orange-600 uppercase mb-1">
                    Brand
                  </label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Pop Mart or Sanrio"
                    className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-orange-600 uppercase mb-1">
                    Rarity Tier *
                  </label>
                  <select
                    value={form.rarity}
                    onChange={(e) => setForm((f) => ({ ...f, rarity: e.target.value as RarityTier }))}
                    className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="common">Common (60% odds)</option>
                    <option value="uncommon">Uncommon (25% odds)</option>
                    <option value="rare">Rare (10% odds)</option>
                    <option value="ultra">Ultra (5% odds)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-orange-600 uppercase mb-1">
                    What You Paid (COGS)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.wholesale_cost}
                      onChange={(e) => setForm((f) => ({ ...f, wholesale_cost: e.target.value }))}
                      className="w-full border border-orange-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-orange-600 uppercase mb-1">
                    Secondary Market Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.resale_value}
                      onChange={(e) => setForm((f) => ({ ...f, resale_value: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-orange-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-orange-600 uppercase mb-1">
                    MuMu Buyback Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.buyback_price}
                      onChange={(e) => setForm((f) => ({ ...f, buyback_price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-orange-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <p className="text-xs text-orange-400 mt-0.5">What users get if they sell back</p>
                </div>

                {modal === "add" && (
                  <div>
                    <label className="block text-xs font-bold text-orange-600 uppercase mb-1">
                      Starting Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.initial_stock}
                      onChange={(e) => setForm((f) => ({ ...f, initial_stock: e.target.value }))}
                      className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <p className="text-xs text-orange-400 mt-0.5">Units you have on hand</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-orange-100 flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 border border-orange-200 text-orange-600 font-bold py-2.5 rounded-xl hover:bg-orange-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Stock Modal */}
      {modal === "stock" && editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-orange-100">
              <h2 className="text-xl font-bold text-orange-950">Manage Stock</h2>
              <button onClick={() => setModal(null)} className="text-orange-400 hover:text-orange-600">
                <X weight="bold" className="text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-sm text-orange-600 font-medium">{editing.name}</p>
                <p className="text-3xl font-black text-orange-950 mt-1">{editing.stock}</p>
                <p className="text-xs text-orange-400">units currently in stock</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-orange-600 uppercase mb-1">
                  Add or Remove Units
                </label>
                <input
                  type="number"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  placeholder="Enter a number (e.g. 10 or -5)"
                  className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="text-xs text-orange-400 mt-1">
                  Use positive numbers to add stock, negative to remove. E.g. type 10 to add 10 units.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-orange-100 flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 border border-orange-200 text-orange-600 font-bold py-2.5 rounded-xl hover:bg-orange-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStock}
                disabled={stockLoading || !stockAmount}
                className="flex-1 bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {stockLoading ? "Saving…" : "Update Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
