import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!

  const anonKey = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY!

  console.log("[v0] Supabase client config:", {
    hasServiceRoleKey: false,
    hasAnonKey: !!anonKey,
    usingServiceRole: false,
    keyPrefix: anonKey?.substring(0, 20) + "...",
  })

  if (!url || !anonKey) {
    const error = `Missing Supabase credentials. URL: ${url ? "found" : "missing"}, Key: ${anonKey ? "found" : "missing"}`
    console.error("[v0]", error)
    throw new Error(error)
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const error = `Invalid Supabase URL format: ${url.substring(0, 30)}... (must start with http:// or https://)`
    console.error("[v0]", error)
    throw new Error(error)
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}
