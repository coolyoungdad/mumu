import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Anonymise email → first letter + "***" (e.g. "a***")
function anonymise(email: string | undefined): string {
  if (!email) return "Someone";
  const local = email.split("@")[0];
  if (local.length <= 1) return local[0] + "***";
  return local[0].toUpperCase() + local.slice(1, 3).replace(/./g, "*") + "***";
}

// Avatar background colours — deterministic per user id
const BG_COLORS = [
  "bg-purple-200", "bg-blue-200", "bg-indigo-200",
  "bg-orange-200", "bg-pink-200", "bg-teal-200",
];
function avatarColor(id: string): string {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return BG_COLORS[n % BG_COLORS.length];
}

export async function GET() {
  const supabase = await createClient();

  // Recent box openings (any rarity)
  const { data: openings } = await supabase
    .from("user_inventory")
    .select("id, user_id, product_name, rarity, buyback_price, status, acquired_at, user:users(email)")
    .order("acquired_at", { ascending: false })
    .limit(30);

  const events: {
    id: string;
    name: string;
    action: string;
    item: string;
    value?: string;
    seed: string;
    bgColor: string;
  }[] = [];

  for (const row of openings ?? []) {
    const email = (row.user as { email?: string } | null)?.email;
    const name = anonymise(email);
    const seed = row.user_id ?? row.id;
    const color = avatarColor(seed);

    if (row.status === "sold") {
      events.push({
        id: row.id + "-sold",
        name,
        action: "sold back",
        item: row.product_name,
        value: `+$${parseFloat(row.buyback_price?.toString() ?? "0").toFixed(0)}`,
        seed,
        bgColor: color,
      });
    } else {
      events.push({
        id: row.id + "-open",
        name,
        action: "just unboxed",
        item: row.product_name,
        seed,
        bgColor: color,
      });
    }
  }

  // If fewer than 7 real events, pad with tasteful placeholders
  const PLACEHOLDERS = [
    { name: "A***", action: "just unboxed", item: "The Warmth Skullpanda", seed: "p1", bgColor: "bg-purple-200" },
    { name: "K***", action: "just unboxed", item: "The Other One Hirono",  seed: "p2", bgColor: "bg-indigo-200" },
    { name: "M***", action: "sold back",    item: "The Joy Skullpanda", value: "+$38", seed: "p3", bgColor: "bg-blue-200" },
    { name: "Z***", action: "just unboxed", item: "Strawberry Macaron Labubu", seed: "p4", bgColor: "bg-pink-200" },
    { name: "R***", action: "sold back",    item: "Space Molly", value: "+$22", seed: "p5", bgColor: "bg-teal-200" },
    { name: "L***", action: "just unboxed", item: "The Awakening Skullpanda", seed: "p6", bgColor: "bg-purple-300" },
    { name: "J***", action: "just unboxed", item: "Sky Angel Cinnamoroll", seed: "p7", bgColor: "bg-blue-300" },
  ];

  const output = events.length >= 7
    ? events.slice(0, 20).map((e) => ({ ...e }))
    : PLACEHOLDERS.map((p, i) => ({ ...p, id: `placeholder-${i}` }));

  return NextResponse.json({ activities: output });
}
