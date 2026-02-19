import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Drop the old functions
    const { error: dropError1 } = await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS open_mystery_box(UUID);'
    }).catch(() => ({ error: null })); // Ignore if exec_sql doesn't exist

    const { error: dropError2 } = await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS open_mystery_box_with_exclusions(UUID, UUID[]);'
    }).catch(() => ({ error: null }));

    // Since exec_sql might not exist, we'll need to tell the user to run the SQL manually
    return NextResponse.json({
      message: "Cannot execute SQL via API. Please run QUICK_FIX_RUN_THIS.sql in Supabase SQL Editor",
      url: "https://supabase.com/dashboard/project/tymnlkwwkwbmollyecxv/sql/new"
    });
  } catch (error) {
    console.error('Fix functions error:', error);
    return NextResponse.json(
      { error: "Failed to fix functions" },
      { status: 500 }
    );
  }
}
