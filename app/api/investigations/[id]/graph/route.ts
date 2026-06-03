import { NextResponse } from "next/server"
import { MOCK_NODES, MOCK_EDGES } from "../../../graph/_data"
import { MOCK_INVESTIGATIONS } from "../../_data"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const { id } = await params

  if (BACKEND) {
    const { search } = new URL(request.url)
    const res = await fetch(`${BACKEND}/investigations/${id}/graph${search}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const investigation = MOCK_INVESTIGATIONS.find((inv) => inv.id === id)
  if (!investigation) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  const targetIds = new Set(investigation.targets?.map((t) => t.nodeId) ?? [])
  const nodes = [...MOCK_NODES.values()].filter((n) => targetIds.has(n.id))
  const nodeIds = new Set(nodes.map((n) => n.id))
  const edges = MOCK_EDGES.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))

  return NextResponse.json({ nodes, edges })
}
