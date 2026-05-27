import { NextResponse } from "next/server"
import { MOCK_INVESTIGATIONS } from "../../_data"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/investigations/${id}/view-state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return new NextResponse(null, { status: res.status })
  }

  const investigation = MOCK_INVESTIGATIONS.find((inv) => inv.id === id)
  if (!investigation) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  investigation.viewState = body
  return new NextResponse(null, { status: 204 })
}
