import type { GraphNodeResponse, GraphEdgeResponse } from "@/lib/graph/types"

export const MOCK_NODES = new Map<string, GraphNodeResponse>([
  ["n1", { id: "n1", type: "Person",       category: "identity",      label: "Juan Pérez",                   properties: { role: "Primary suspect" },   createdAt: "2026-05-10T09:00:00Z", updatedAt: "2026-05-10T09:00:00Z" }],
  ["n2", { id: "n2", type: "Organization", category: "organization",  label: "XYZ Logistics Inc.",            properties: { district: "North" },        createdAt: "2026-05-10T09:00:00Z", updatedAt: "2026-05-10T09:00:00Z" }],
  ["n3", { id: "n3", type: "Location",     category: "location",      label: "5th Street North Warehouse",   properties: { address: "5th St N" },       createdAt: "2026-05-10T09:00:00Z", updatedAt: "2026-05-10T09:00:00Z" }],
  ["n4", { id: "n4", type: "Organization", category: "organization",  label: "ABC Holdings Corp.",            properties: {},                           createdAt: "2026-05-18T11:00:00Z", updatedAt: "2026-05-18T11:00:00Z" }],
  ["n5", { id: "n5", type: "Person",       category: "identity",      label: "Roberto Lima",                 properties: { role: "CFO" },               createdAt: "2026-05-18T11:00:00Z", updatedAt: "2026-05-18T11:00:00Z" }],
  ["n6", { id: "n6", type: "Person",       category: "identity",      label: "Carlos M.",                    properties: {},                           createdAt: "2026-05-21T08:30:00Z", updatedAt: "2026-05-21T08:30:00Z" }],
])

export const MOCK_EDGES: GraphEdgeResponse[] = [
  { id: "e1", source: "n1", target: "n2", type: "WORKS_FOR",   label: "works for" },
  { id: "e2", source: "n1", target: "n3", type: "FREQUENTS",   label: "frequents" },
  { id: "e3", source: "n2", target: "n3", type: "OPERATES_AT", label: "operates at" },
  { id: "e4", source: "n5", target: "n4", type: "WORKS_FOR",   label: "works for" },
]
