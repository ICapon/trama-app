import type { Investigation } from "@/types/investigation"

export const MOCK_INVESTIGATIONS: Investigation[] = [
  {
    id: "1",
    title: "Red de distribución norte",
    description:
      "Análisis de posible red de distribución clandestina en la zona norte de la ciudad. Se detectaron patrones de movimiento sospechosos.",
    status: "in_progress",
    priority: "critical",
    hypothesis:
      "El sujeto principal coordina entregas a través de intermediarios conocidos operando en mercados locales.",
    tags: ["osint", "red", "distribución"],
    ownerId: null,
    targets: [
      { nodeId: "n1", nodeLabel: "Juan Pérez", nodeType: "Person" },
      { nodeId: "n2", nodeLabel: "Logística XYZ S.A.", nodeType: "Organization" },
      { nodeId: "n3", nodeLabel: "Almacén Calle 5 Norte", nodeType: "Location" },
    ],
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-05-23T14:30:00Z",
  },
  {
    id: "2",
    title: "Fraude financiero corporativo",
    description:
      "Investigación sobre posibles irregularidades en los estados financieros de la corporación durante el ejercicio fiscal 2025.",
    status: "open",
    priority: "high",
    tags: ["fraude", "finanzas", "corporativo"],
    ownerId: null,
    targets: [
      { nodeId: "n4", nodeLabel: "Corporación ABC Holdings", nodeType: "Organization" },
      { nodeId: "n5", nodeLabel: "Roberto Lima", nodeType: "Person" },
    ],
    createdAt: "2026-05-18T11:00:00Z",
    updatedAt: "2026-05-20T09:15:00Z",
  },
  {
    id: "3",
    title: "Seguimiento sujeto de interés",
    description:
      "Perfil y análisis de movimientos de sujeto con posibles vínculos a actividades ilícitas transfronterizas.",
    status: "open",
    priority: "medium",
    tags: ["persona", "perfil", "osint"],
    ownerId: null,
    targets: [{ nodeId: "n6", nodeLabel: "Carlos M.", nodeType: "Person" }],
    createdAt: "2026-05-21T08:30:00Z",
    updatedAt: "2026-05-21T08:30:00Z",
  },
  {
    id: "4",
    title: "Análisis redes sociales campaña",
    description:
      "Detección de coordinación inorgánica en redes sociales durante período electoral. Se identificaron patrones de amplificación artificial.",
    status: "closed",
    priority: "high",
    hypothesis: "Existe una red de cuentas automatizadas coordinadas amplificando narrativas específicas.",
    tags: ["redes-sociales", "desinformación", "bots"],
    ownerId: null,
    targets: [],
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-05-15T17:00:00Z",
  },
  {
    id: "5",
    title: "Mapeo estructura criminal zona sur",
    description:
      "Identificación y mapeo de relaciones entre miembros de estructura criminal activa en la zona sur.",
    status: "archived",
    priority: "low",
    tags: ["crimen-organizado", "estructura", "zona-sur"],
    ownerId: null,
    targets: [],
    createdAt: "2026-01-15T12:00:00Z",
    updatedAt: "2026-03-20T08:00:00Z",
  },
]
