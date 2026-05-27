import { NextResponse } from "next/server"
import { MOCK_PROVIDERS } from "../../_data"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ source: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { source } = await params
  const { isActive } = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/providers/${source}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    })
    return new NextResponse(null, { status: res.status })
  }

  const provider = MOCK_PROVIDERS.find((p) => p.source === source)
  if (!provider) return NextResponse.json({ message: "Not found" }, { status: 404 })
  provider.isActive = isActive
  return new NextResponse(null, { status: 204 })
}
