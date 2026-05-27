import { NextResponse } from "next/server"
import type { ScrapeJob } from "@/types/provider"

const BACKEND = process.env.API_URL

const MOCK_JOBS: ScrapeJob[] = [
  {
    id: "j1",
    personId: "n1",
    source: "mx-curp",
    status: "completed",
    seed: { firstName: "Juan", lastName: "Pérez", fullName: "Juan Pérez" },
    createdNodeIds: ["abc1", "abc2"],
    errorMessage: null,
    bullJobId: "bull-001",
    startedAt: "2026-05-24T18:32:01Z",
    finishedAt: "2026-05-24T18:32:03Z",
    createdAt: "2026-05-24T18:32:00Z",
  },
  {
    id: "j2",
    personId: "n5",
    source: "mx-sat-rfc",
    status: "completed",
    seed: { firstName: "Roberto", lastName: "Lima" },
    createdNodeIds: ["abc3"],
    errorMessage: null,
    bullJobId: "bull-002",
    startedAt: "2026-05-23T11:15:02Z",
    finishedAt: "2026-05-23T11:15:05Z",
    createdAt: "2026-05-23T11:15:00Z",
  },
  {
    id: "j3",
    personId: "n1",
    source: "mx-sat-rfc",
    status: "failed",
    seed: { firstName: "Juan", lastName: "Pérez", fullName: "Juan Pérez" },
    createdNodeIds: [],
    errorMessage: "Timeout: el servicio del SAT no respondió en el tiempo esperado.",
    bullJobId: "bull-003",
    startedAt: "2026-05-22T09:10:01Z",
    finishedAt: "2026-05-22T09:10:31Z",
    createdAt: "2026-05-22T09:10:00Z",
  },
]

export async function GET() {
  if (!BACKEND) return NextResponse.json(MOCK_JOBS)

  // Try the global jobs endpoint first (available once backend is restarted)
  const directRes = await fetch(`${BACKEND}/scraper/jobs`).catch(() => null)
  if (directRes?.ok) {
    const data = await directRes.json()
    return NextResponse.json(data)
  }

  // Fallback: aggregate runs from each provider
  const providersRes = await fetch(`${BACKEND}/providers`)
  if (!providersRes.ok) return NextResponse.json([], { status: 200 })

  const providers: { source: string }[] = await providersRes.json()

  const allJobs = (
    await Promise.all(
      providers.map((p) =>
        fetch(`${BACKEND}/providers/${p.source}/runs`)
          .then((r) => (r.ok ? (r.json() as Promise<ScrapeJob[]>) : []))
          .catch(() => [] as ScrapeJob[]),
      ),
    )
  ).flat()

  allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json(allJobs)
}
