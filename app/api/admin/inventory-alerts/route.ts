import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch low inventory items from view created in migration 007
    const { data: alerts, error: alertsError } = await supabase
      .from("low_inventory_items")
      .select("*");

    if (alertsError) {
      console.error("Inventory alerts fetch error:", alertsError);
      return NextResponse.json(
        { error: "Failed to fetch inventory alerts" },
        { status: 500 }
      );
    }

    // Count alerts by level
    const critical = alerts?.filter((a) => a.alert_level === "critical") || [];
    const warning = alerts?.filter((a) => a.alert_level === "warning") || [];
    const low = alerts?.filter((a) => a.alert_level === "low") || [];

    return NextResponse.json({
      success: true,
      summary: {
        critical: critical.length,
        warning: warning.length,
        low: low.length,
        total: alerts?.length || 0,
      },
      alerts: alerts || [],
    });
  } catch (error) {
    console.error("Inventory alerts route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
