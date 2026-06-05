import { NextResponse } from "next/server"
import { MOCK_NODES, MOCK_EDGES } from "../../../_data"
import type { GraphEdgeResponse, GraphNodeResponse } from "@/lib/graph/types"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/graph/node/${id}/linked-node`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  // Mock fallback
  const newId = crypto.randomUUID()
  const newNode: GraphNodeResponse = {
    id: newId,
    type: body.newNode.type,
    category: "identity",
    label: body.newNode.label,
    properties: { name: body.newNode.label, type: body.newNode.type },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  MOCK_NODES.set(newId, newNode)

  const fromId = body.relationship.direction === "outgoing" ? id : newId
  const toId   = body.relationship.direction === "outgoing" ? newId : id
  const edge: GraphEdgeResponse = {
    id: `${fromId}_${body.relationship.type}_${toId}`,
    source: fromId,
    target: toId,
    type: body.relationship.type,
    label: body.relationship.type.toLowerCase().replace(/_/g, " "),
  }
  MOCK_EDGES.push(edge)

  return NextResponse.json({ node: newNode, edge }, { status: 201 })
}
