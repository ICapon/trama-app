import { NextResponse } from "next/server"
import type { TramaExportBundle } from "@/types/export-bundle"
import type { Investigation } from "@/types/investigation"
import { MOCK_INVESTIGATIONS } from "../_data"

const BACKEND = process.env.API_URL

export async function POST(request: Request) {
  const bundle: TramaExportBundle = await request.json()

  if (BACKEND) {
    const res = await fetch(`${BACKEND}/investigations/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bundle),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  // Mock: create investigation from bundle (no graph recreation in mock)
  const investigation: Investigation = {
    id: crypto.randomUUID(),
    title: `${bundle.investigation.title} (imported)`,
    description: bundle.investigation.description ?? undefined,
    status: (bundle.investigation.status as Investigation["status"]) ?? "open",
    priority: (bundle.investigation.priority as Investigation["priority"]) ?? "medium",
    hypothesis: bundle.investigation.hypothesis ?? undefined,
    tags: bundle.investigation.tags ?? [],
    ownerId: null,
    targets: bundle.investigation.targets,
    viewState: bundle.investigation.viewState ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  MOCK_INVESTIGATIONS.push(investigation)
  return NextResponse.json(investigation, { status: 201 })
}
