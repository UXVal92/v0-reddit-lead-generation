import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    const error = `Missing Supabase credentials. URL: ${url ? "found" : "missing"}, Key: ${anonKey ? "found" : "missing"}`
    console.error("[v0]", error)
    throw new Error(error)
  }

  const cookieStore = await cookies()

  const allCookies = cookieStore.getAll()
  const authCookie = allCookies.find((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"))

  let accessToken: string | undefined

  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value)
      accessToken = authData.access_token
      console.log("[v0] Found auth token in cookies")
    } catch (e) {
      console.error("[v0] Failed to parse auth cookie:", e)
    }
  } else {
    console.log("[v0] No auth cookie found")
  }

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  })
}
