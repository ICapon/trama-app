import { NextResponse } from "next/server"
import { MOCK_INVESTIGATIONS } from "../_data"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const investigation = MOCK_INVESTIGATIONS.find((inv) => inv.id === id)
  if (!investigation) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  return NextResponse.json(investigation)
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const investigation = MOCK_INVESTIGATIONS.find((inv) => inv.id === id)
  if (!investigation) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ ...investigation, ...body, updatedAt: new Date().toISOString() })
}

export async function DELETE(_request: Request, { params }: Params) {
  await params
  return new NextResponse(null, { status: 204 })
}
