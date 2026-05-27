import { NextResponse } from "next/server"
import { MOCK_EDGES } from "../_data"
import type { GraphEdgeResponse } from "@/lib/graph/types"

const BACKEND = process.env.API_URL

export async function POST(request: Request) {
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/graph/relationship`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const edge: GraphEdgeResponse = {
    id: crypto.randomUUID(),
    source: body.fromId,
    target: body.toId,
    type: body.type,
    label: body.type.toLowerCase().replace(/_/g, " "),
    properties: body.properties ?? {},
  }
  MOCK_EDGES.push(edge)
  return NextResponse.json(edge, { status: 201 })
}
