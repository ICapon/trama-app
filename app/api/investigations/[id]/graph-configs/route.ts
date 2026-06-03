import { NextResponse } from "next/server"
import type { GraphConfig } from "@/types/graph-config"
import { mockStore } from "./_store"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string }> }

function getStore(investigationId: string): GraphConfig[] {
  if (!mockStore.has(investigationId)) mockStore.set(investigationId, [])
  return mockStore.get(investigationId)!
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/investigations/${id}/graph-configs`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  return NextResponse.json(getStore(id))
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/investigations/${id}/graph-configs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const configs = getStore(id)
  if (configs.some((c) => c.name === body.name)) {
    return NextResponse.json(
      { message: `A configuration named "${body.name}" already exists for this investigation` },
      { status: 409 },
    )
  }

  const now = new Date().toISOString()
  const config: GraphConfig = {
    id: crypto.randomUUID(),
    investigationId: id,
    name: body.name,
    description: body.description ?? null,
    filters: body.filters ?? { relationshipTypes: [] },
    layout: body.layout ?? "force",
    createdAt: now,
    updatedAt: now,
  }
  configs.push(config)
  return NextResponse.json(config, { status: 201 })
}
