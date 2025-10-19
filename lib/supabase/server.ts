import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.SUPABASE_SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    const error = `Missing Supabase credentials. URL: ${url ? "found" : "missing"}, Key: ${anonKey ? "found" : "missing"}`
    console.error("[v0]", error)
    throw new Error(error)
  }

  const cookieStore = await cookies()
  const authCookie = cookieStore.get("sb-access-token")

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: authCookie
        ? {
            Authorization: `Bearer ${authCookie.value}`,
          }
        : {},
    },
  })
}
