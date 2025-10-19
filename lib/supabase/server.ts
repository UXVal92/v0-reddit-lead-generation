import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    const error = `Missing Supabase credentials. URL: ${url ? "found" : "missing"}, Service Role Key: ${serviceRoleKey ? "found" : "missing"}`
    console.error("[v0]", error)
    throw new Error(error)
  }

  console.log("[v0] Creating Supabase client with service role key (bypasses RLS)")

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
