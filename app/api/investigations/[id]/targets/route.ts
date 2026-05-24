import { NextResponse } from "next/server"
import { MOCK_INVESTIGATIONS } from "../../_data"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/investigations/${id}/targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return new NextResponse(null, { status: res.status })
  }

  const investigation = MOCK_INVESTIGATIONS.find((inv) => inv.id === id)
  if (!investigation) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  if (!investigation.targets) investigation.targets = []
  investigation.targets.push(body)
  return new NextResponse(null, { status: 204 })
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const nodeId = searchParams.get("nodeId")

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/investigations/${id}/targets/${nodeId}`, {
      method: "DELETE",
    })
    return new NextResponse(null, { status: res.status })
  }

  const investigation = MOCK_INVESTIGATIONS.find((inv) => inv.id === id)
  if (!investigation) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  investigation.targets = investigation.targets?.filter((t) => t.nodeId !== nodeId) ?? []
  return new NextResponse(null, { status: 204 })
}
