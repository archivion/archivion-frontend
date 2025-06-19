import { type NextRequest, NextResponse } from "next/server"

const SEARCH_FUNCTION_URL =
  process.env.SEARCH_FUNCTION_URL || "https://us-central1-your-project.cloudfunctions.net/searchFiles"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Forward search parameters to Cloud Function
    const response = await fetch(`${SEARCH_FUNCTION_URL}?${searchParams}`)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
