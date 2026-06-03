// Shared in-memory store for graph configs when no backend is configured.
// Both route files import this module so they share the same Map instance.
export const mockStore = new Map<string, import("@/types/graph-config").GraphConfig[]>()
