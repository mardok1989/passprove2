import { NextResponse } from "next/server"
import { getShopApiKey } from "@/lib/get-shop-api-key"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { identifier } = body

    if (!identifier) {
      return NextResponse.json({ error: "Missing identifier" }, { status: 400 })
    }

    const apiKey = await getShopApiKey(identifier)

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error("Error in get-shop-api-key route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

