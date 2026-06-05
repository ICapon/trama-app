import { NextResponse } from "next/server"
import { MOCK_EDGES } from "../../_data"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params

  if (BACKEND) {
    // Edge ID format: "${fromId}_${TYPE}_${toId}" — UUIDs are always 36 chars
    const fromId = id.slice(0, 36)
    const toId = id.slice(-36)
    const type = id.slice(37, -37)
    const res = await fetch(`${BACKEND}/graph/relationship/${fromId}/${type}/${toId}`, { method: "DELETE" })
    return new NextResponse(null, { status: res.status })
  }

  const idx = MOCK_EDGES.findIndex((e) => e.id === id)
  if (idx === -1) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  MOCK_EDGES.splice(idx, 1)
  return new NextResponse(null, { status: 204 })
}
