import { NextResponse } from "next/server"
import type { GraphConfig } from "@/types/graph-config"

const BACKEND = process.env.API_URL

type Params = { params: Promise<{ id: string; configId: string }> }

// Shared store — must import from parent to share the same Map instance
import { mockStore } from "../_store"

export async function PATCH(request: Request, { params }: Params) {
  const { id, configId } = await params
  const body = await request.json()

  if (BACKEND) {
    const res = await fetch(
      `${BACKEND}/investigations/${id}/graph-configs/${configId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  const configs = mockStore.get(id) ?? []
  const idx = configs.findIndex((c) => c.id === configId)
  if (idx === -1) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  if (body.name && body.name !== configs[idx].name) {
    if (configs.some((c) => c.name === body.name)) {
      return NextResponse.json(
        { message: `A configuration named "${body.name}" already exists for this investigation` },
        { status: 409 },
      )
    }
  }

  const updated: GraphConfig = {
    ...configs[idx],
    ...(body.name !== undefined && { name: body.name }),
    ...(body.description !== undefined && { description: body.description ?? null }),
    ...(body.filters !== undefined && { filters: { ...configs[idx].filters, ...body.filters } }),
    ...(body.layout !== undefined && { layout: body.layout }),
    updatedAt: new Date().toISOString(),
  }
  configs[idx] = updated
  mockStore.set(id, configs)
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, configId } = await params

  if (BACKEND) {
    const res = await fetch(
      `${BACKEND}/investigations/${id}/graph-configs/${configId}`,
      { method: "DELETE" },
    )
    return new NextResponse(null, { status: res.status })
  }

  const configs = mockStore.get(id) ?? []
  mockStore.set(id, configs.filter((c) => c.id !== configId))
  return new NextResponse(null, { status: 204 })
}
