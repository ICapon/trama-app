import { NextResponse } from "next/server"
import { MOCK_INVESTIGATIONS } from "../_data"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/investigations/${id}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const investigation = MOCK_INVESTIGATIONS.find((inv) => inv.id === id)
  if (!investigation) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  return NextResponse.json(investigation)
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/investigations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const investigation = MOCK_INVESTIGATIONS.find((inv) => inv.id === id)
  if (!investigation) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ ...investigation, ...body, updatedAt: new Date().toISOString() })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/investigations/${id}`, { method: "DELETE" })
    return new NextResponse(null, { status: res.status })
  }

  return new NextResponse(null, { status: 204 })
}
