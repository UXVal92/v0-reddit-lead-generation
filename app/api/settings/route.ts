import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// GET - Fetch a setting by key
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "Setting key is required" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle()

    if (error) {
      console.error("[v0] Error fetching setting:", error)
      return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 })
    }

    return NextResponse.json({ value: data?.value || null })
  } catch (error) {
    console.error("[v0] Error in settings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Save or update a setting
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from("settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })

    if (error) {
      console.error("[v0] Error saving setting:", error)
      return NextResponse.json({ error: "Failed to save setting" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in settings POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
