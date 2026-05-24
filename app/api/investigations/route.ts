import { NextResponse } from "next/server"
import type { Investigation } from "@/types/investigation"
import { MOCK_INVESTIGATIONS } from "./_data"

export async function GET() {
  return NextResponse.json(MOCK_INVESTIGATIONS)
}

export async function POST(request: Request) {
  const body = await request.json()
  const investigation: Investigation = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description,
    status: "open",
    priority: body.priority ?? "medium",
    tags: body.tags ?? [],
    ownerId: body.ownerId ?? null,
    targets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return NextResponse.json(investigation, { status: 201 })
}
