import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Just pass through all requests - auth checks will be handled in pages
  return NextResponse.next()
}
