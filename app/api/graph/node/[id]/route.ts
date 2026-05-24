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
