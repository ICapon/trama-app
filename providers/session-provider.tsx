"use client";

import { createContext, useContext, useState } from "react";
import type { SessionData, SessionContextValue } from "@/types/session";
import { defaultSession } from "@/lib/session";

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession?: Partial<SessionData>;
}) {
  const [session, setSession] = useState<SessionData>({
    ...defaultSession,
    ...initialSession,
  });

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessionContext must be used within SessionProvider");
  }
  return ctx;
}
