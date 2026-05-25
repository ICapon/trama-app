import { NextResponse } from "next/server"
import type { GraphNodeResponse, TramaNodeType, TramaNodeCategory } from "@/lib/graph/types"
import { TRAMA_NODE_CATEGORIES } from "@/lib/graph/types"
import { MOCK_NODES } from "../_data"

const BACKEND = process.env.API_URL

function categoryForType(type: string): TramaNodeCategory {
  for (const [cat, types] of Object.entries(TRAMA_NODE_CATEGORIES)) {
    if ((types as readonly string[]).includes(type)) return cat as TramaNodeCategory
  }
  return "identity"
}

// Backend returns raw Neo4j records; normalize to GraphNodeResponse
function normalizeNode(raw: unknown): GraphNodeResponse {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    if (typeof obj.id === "string") return obj as unknown as GraphNodeResponse
    if (obj.properties && typeof obj.properties === "object") {
      const p = obj.properties as Record<string, unknown>
      const type = (p.type as string) ?? "Person"
      return {
        id: p.id as string,
        type: type as TramaNodeType,
        category: categoryForType(type),
        label: ((p.name ?? p.label ?? "") as string),
        properties: p,
        createdAt: (p.createdAt as string) ?? new Date().toISOString(),
        updatedAt: (p.createdAt as string) ?? new Date().toISOString(),
      }
    }
  }
  return raw as GraphNodeResponse
}

export async function POST(request: Request) {
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/graph/node`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const raw = await res.json()
    return NextResponse.json(normalizeNode(raw), { status: res.status })
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
