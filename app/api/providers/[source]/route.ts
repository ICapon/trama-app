import { NextResponse } from "next/server"
import { MOCK_PROVIDERS } from "../_data"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ source: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { source } = await params

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/providers/${source}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const provider = MOCK_PROVIDERS.find((p) => p.source === source)
  if (!provider) return NextResponse.json({ message: "Not found" }, { status: 404 })
  return NextResponse.json(provider)
}

export async function DELETE(_request: Request, { params }: Params) {
  const { source } = await params

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/providers/${source}`, { method: "DELETE" })
    return new NextResponse(null, { status: res.status })
  }

  const idx = MOCK_PROVIDERS.findIndex((p) => p.source === source)
  if (idx === -1) return NextResponse.json({ message: "Not found" }, { status: 404 })
  MOCK_PROVIDERS.splice(idx, 1)
  return new NextResponse(null, { status: 204 })
}
