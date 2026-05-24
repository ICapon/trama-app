import type { Investigation } from "@/types/investigation"

export const MOCK_INVESTIGATIONS: Investigation[] = [
  {
    id: "1",
    title: "Northern Distribution Network",
    description:
      "Analysis of a suspected clandestine distribution network operating in the northern district. Unusual movement patterns have been detected across multiple locations.",
    status: "in_progress",
    priority: "critical",
    hypothesis:
      "The primary subject coordinates deliveries through known intermediaries operating at local markets.",
    tags: ["osint", "network", "distribution"],
    ownerId: null,
    targets: [
      { nodeId: "n1", nodeLabel: "Juan Pérez", nodeType: "Person" },
      { nodeId: "n2", nodeLabel: "XYZ Logistics Inc.", nodeType: "Organization" },
      { nodeId: "n3", nodeLabel: "5th Street North Warehouse", nodeType: "Location" },
    ],
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-05-23T14:30:00Z",
  },
  {
    id: "2",
    title: "Corporate Financial Fraud",
    description:
      "Investigation into possible irregularities in the corporation's financial statements during the 2025 fiscal year.",
    status: "open",
    priority: "high",
    tags: ["fraud", "finance", "corporate"],
    ownerId: null,
    targets: [
      { nodeId: "n4", nodeLabel: "ABC Holdings Corp.", nodeType: "Organization" },
      { nodeId: "n5", nodeLabel: "Roberto Lima", nodeType: "Person" },
    ],
    createdAt: "2026-05-18T11:00:00Z",
    updatedAt: "2026-05-20T09:15:00Z",
  },
  {
    id: "3",
    title: "Subject of Interest Tracking",
    description:
      "Profile and movement analysis of a subject with suspected ties to cross-border illicit activities.",
    status: "open",
    priority: "medium",
    tags: ["person", "profile", "osint"],
    ownerId: null,
    targets: [{ nodeId: "n6", nodeLabel: "Carlos M.", nodeType: "Person" }],
    createdAt: "2026-05-21T08:30:00Z",
    updatedAt: "2026-05-21T08:30:00Z",
  },
  {
    id: "4",
    title: "Campaign Social Media Analysis",
    description:
      "Detection of inorganic coordination on social media during the electoral period. Artificial amplification patterns were identified.",
    status: "closed",
    priority: "high",
    hypothesis: "A coordinated network of automated accounts is amplifying specific narratives.",
    tags: ["social-media", "disinformation", "bots"],
    ownerId: null,
    targets: [],
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-05-15T17:00:00Z",
  },
  {
    id: "5",
    title: "Southern Zone Criminal Structure Mapping",
    description:
      "Identification and mapping of relationships between members of a criminal organization active in the southern zone.",
    status: "archived",
    priority: "low",
    tags: ["organized-crime", "structure", "southern-zone"],
    ownerId: null,
    targets: [],
    createdAt: "2026-01-15T12:00:00Z",
    updatedAt: "2026-03-20T08:00:00Z",
  },
]
