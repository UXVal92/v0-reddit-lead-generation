import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("[v0] Fetching existing leads from database...")

    const supabase = await createClient()

    const { data: leads, error } = await supabase
      .from("reddit_leads")
      .select("*")
      .order("reddit_created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching leads from database:", error)
      return NextResponse.json({ error: "Failed to fetch leads from database" }, { status: 500 })
    }

    const formattedLeads = leads.map((lead) => ({
      id: lead.reddit_id,
      title: lead.title,
      content: lead.content || "",
      subreddit: lead.subreddit,
      author: lead.author,
      url: lead.url,
      summary: lead.summary,
      score: lead.score,
      opportunity: lead.opportunity, // Added opportunity field
      draftReply: lead.draft_reply,
      timestamp: lead.reddit_created_at,
    }))

    console.log(`[v0] Fetched ${formattedLeads.length} existing leads from database`)

    return NextResponse.json({ posts: formattedLeads })
  } catch (error) {
    console.error("[v0] Error in reddit-leads API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch leads",
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    console.log("[v0] Deleting all leads from database...")

    const supabase = await createClient()

    const { error } = await supabase.from("reddit_leads").delete().gte("created_at", "1970-01-01")

    if (error) {
      console.error("[v0] Error deleting all leads:", error)
      return NextResponse.json({ error: "Failed to delete all leads" }, { status: 500 })
    }

    console.log("[v0] Successfully deleted all leads")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in delete all leads API:", error)
    return NextResponse.json({ error: "Failed to delete all leads" }, { status: 500 })
  }
}
