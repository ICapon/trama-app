import { NextResponse } from "next/server"
import { MOCK_PROVIDERS } from "./_data"

const BACKEND = process.env.API_URL

export async function GET() {
  if (BACKEND) {
    const res = await fetch(`${BACKEND}/providers`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  return NextResponse.json(MOCK_PROVIDERS)
}

export async function POST(request: Request) {
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const now = new Date().toISOString()
  const newProvider = {
    id: crypto.randomUUID(),
    ...body,
    totalRuns: 0,
    successCount: 0,
    failCount: 0,
    avgDurationMs: null,
    lastRunAt: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  }
  MOCK_PROVIDERS.push(newProvider)
  return NextResponse.json(newProvider, { status: 201 })
}
