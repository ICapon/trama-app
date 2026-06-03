import { NextResponse } from "next/server"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const res = await fetch(`${BACKEND}/provider-credentials/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const res = await fetch(`${BACKEND}/provider-credentials/${id}`, { method: "DELETE" })
  return new NextResponse(null, { status: res.status })
}
