import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL

  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SUPABASE_ANON_KEY

  if (!url || !key) {
    const error = `Missing Supabase credentials. URL: ${url ? "found" : "missing"}, Key: ${key ? "found" : "missing"}`
    console.error("[v0]", error)
    throw new Error(error)
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const error = `Invalid Supabase URL format: ${url.substring(0, 30)}... (must start with http:// or https://)`
    console.error("[v0]", error)
    throw new Error(error)
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignore errors from Server Components
        }
      },
    },
  })
}
