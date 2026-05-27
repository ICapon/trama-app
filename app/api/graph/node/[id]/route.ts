import { NextResponse } from "next/server"
import { MOCK_NODES } from "../../_data"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/graph/node/${id}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const node = MOCK_NODES.get(id)
  if (!node) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  return NextResponse.json(node)
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/graph/node/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const node = MOCK_NODES.get(id)
  if (!node) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  const updated = { ...node, properties: { ...node.properties, ...body.properties }, updatedAt: new Date().toISOString() }
  MOCK_NODES.set(id, updated)
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/graph/node/${id}`, { method: "DELETE" })
    return new NextResponse(null, { status: res.status })
  }

  if (!MOCK_NODES.has(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  MOCK_NODES.delete(id)
  return new NextResponse(null, { status: 204 })
}
