import { createServiceRoleClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceRoleClient()
    const { id } = params

    console.log(`[v0] Deleting lead with reddit_id: ${id}`)

    const { data, error } = await supabase.from("reddit_leads").delete().eq("reddit_id", id).select()

    if (error) {
      console.error("[v0] Error deleting lead:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error("[v0] No lead found with reddit_id:", id)
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    console.log(`[v0] Successfully deleted lead with reddit_id ${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in delete lead API:", error)
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}
