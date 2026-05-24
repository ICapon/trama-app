import { NextResponse } from "next/server"
import type { Investigation } from "@/types/investigation"
import { MOCK_INVESTIGATIONS } from "./_data"

const BACKEND = process.env.API_URL

export async function GET(request: Request) {
  console.log("GET /investigations called")
  console.log('BACKEND', BACKEND)
  if (BACKEND) {
    const { searchParams } = new URL(request.url)
    const upstream = new URL(`${BACKEND}/investigations`)
    searchParams.forEach((v, k) => upstream.searchParams.set(k, v))
    const res = await fetch(upstream, { headers: { "Content-Type": "application/json" } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  return NextResponse.json(MOCK_INVESTIGATIONS)
}

export async function POST(request: Request) {
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/investigations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const investigation: Investigation = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description,
    status: "open",
    priority: body.priority ?? "medium",
    tags: body.tags ?? [],
    ownerId: body.ownerId ?? null,
    targets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return NextResponse.json(investigation, { status: 201 })
}
