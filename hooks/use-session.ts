"use client";

import { useSessionContext } from "@/providers/session-provider";

export function useSession() {
  return useSessionContext();
}
