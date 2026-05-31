import { NextResponse } from "next/server"
import type { ScrapeJob } from "@/types/provider"

const BACKEND = process.env.API_URL

const MOCK_JOBS: ScrapeJob[] = [
  {
    id: "j1",
    entityId: "n1",
    investigationId: "inv-001",
    source: "mx-curp",
    status: "completed",
    seed: { firstName: "Juan", lastName: "Pérez", fullName: "Juan Pérez" },
    config: null,
    errorMessage: null,
    bullJobId: "bull-001",
    startedAt: "2026-05-24T18:32:01Z",
    finishedAt: "2026-05-24T18:32:03Z",
    createdAt: "2026-05-24T18:32:00Z",
    updatedAt: "2026-05-24T18:32:03Z",
  },
  {
    id: "j2",
    entityId: "n5",
    investigationId: "inv-001",
    source: "mx-sat-rfc",
    status: "completed",
    seed: { firstName: "Roberto", lastName: "Lima" },
    config: { "dork-search": { searchMode: "identity", engine: "brave", maxQueries: 5 } },
    errorMessage: null,
    bullJobId: "bull-002",
    startedAt: "2026-05-23T11:15:02Z",
    finishedAt: "2026-05-23T11:15:05Z",
    createdAt: "2026-05-23T11:15:00Z",
    updatedAt: "2026-05-23T11:15:05Z",
  },
  {
    id: "j3",
    entityId: "n1",
    investigationId: null,
    source: "mx-sat-rfc",
    status: "failed",
    seed: { firstName: "Juan", lastName: "Pérez", fullName: "Juan Pérez" },
    config: null,
    errorMessage: "Timeout: el servicio del SAT no respondió en el tiempo esperado.",
    bullJobId: "bull-003",
    startedAt: "2026-05-22T09:10:01Z",
    finishedAt: "2026-05-22T09:10:31Z",
    createdAt: "2026-05-22T09:10:00Z",
    updatedAt: "2026-05-22T09:10:31Z",
  },
]

export async function GET() {
  if (!BACKEND) return NextResponse.json(MOCK_JOBS)

  const res = await fetch(`${BACKEND}/scraper/jobs`).catch(() => null)
  if (res?.ok) return NextResponse.json(await res.json())

  return NextResponse.json([], { status: 200 })
}
