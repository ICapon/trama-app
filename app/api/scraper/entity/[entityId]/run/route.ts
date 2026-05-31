import { NextResponse } from "next/server"

const BACKEND = process.env.API_URL

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> },
) {
  const { entityId } = await params
  const body = await request.json()
  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get("entityType") ?? "Person"

  if (BACKEND) {
    const res = await fetch(
      `${BACKEND}/scraper/entity/${entityId}/run?entityType=${entityType}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    ).catch(() => null)

    if (!res) return NextResponse.json({ message: "Backend unavailable" }, { status: 503 })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  // Mock: simulate a started job
  return NextResponse.json(
    {
      jobs: [
        {
          id: crypto.randomUUID(),
          source: body.sources?.[0] ?? "mock-provider",
          bullJobId: `mock-${Date.now()}`,
        },
      ],
    },
    { status: 201 },
  )
}
