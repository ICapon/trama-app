import { NextResponse } from "next/server"
import type { GraphNodeResponse } from "@/lib/graph/types"
import { MOCK_NODES } from "../_data"

const BACKEND = process.env.API_URL

export async function POST(request: Request) {
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/graph/node`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const node: GraphNodeResponse = {
    id: crypto.randomUUID(),
    type: body.type,
    category: body.category,
    label: body.label,
    properties: body.properties ?? {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  MOCK_NODES.set(node.id, node)
  return NextResponse.json(node, { status: 201 })
}
