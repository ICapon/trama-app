import { NextResponse } from "next/server"

const BACKEND = process.env.API_URL
type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const res = await fetch(`${BACKEND}/graph/node/${id}/social-analysis`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
