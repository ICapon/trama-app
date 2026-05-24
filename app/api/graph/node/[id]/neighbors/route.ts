import { NextResponse } from "next/server"
import { MOCK_NODES, MOCK_EDGES } from "../../../_data"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const depth = searchParams.get("depth") ?? "2"

  if (BACKEND) {
    const url = new URL(`${BACKEND}/graph/node/${id}/neighbors`)
    url.searchParams.set("depth", depth)
    const res = await fetch(url)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const neighbors = MOCK_EDGES
    .filter((e) => e.source === id || e.target === id)
    .flatMap((edge) => {
      const neighborId = edge.source === id ? edge.target : edge.source
      const neighbor = MOCK_NODES.get(neighborId)
      return neighbor ? [{ neighbor, edge }] : []
    })

  return NextResponse.json(neighbors)
}
