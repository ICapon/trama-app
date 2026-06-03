import { NextResponse } from "next/server"

const BACKEND = process.env.API_URL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get("entityId")
  const provider = searchParams.get("provider")

  if (!BACKEND) return NextResponse.json([])

  const params = new URLSearchParams()
  if (entityId) params.set("entityId", entityId)
  if (provider) params.set("provider", provider)

  const res = await fetch(`${BACKEND}/scrape-step-logs?${params}`).catch(() => null)
  if (res?.ok) return NextResponse.json(await res.json())

  return NextResponse.json([])
}
