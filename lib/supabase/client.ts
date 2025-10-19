import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  console.log("[v0] Checking Supabase environment variables...")
  console.log("[v0] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Found" : "✗ Missing")
  console.log(
    "[v0] SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Found" : "✗ Missing",
  )

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error("[v0] Missing Supabase environment variables!")
    console.error("[v0] You need to add NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables")
    console.error("[v0] Go to the Vars section in the sidebar to add it")
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}
