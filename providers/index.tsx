"use client";

import { ThemeProvider } from "./theme-provider";
import { SessionProvider } from "./session-provider";
import type { SessionData } from "@/types/session";

interface ProvidersProps {
  children: React.ReactNode;
  initialSession?: Partial<SessionData>;
}

export function Providers({ children, initialSession }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider initialSession={initialSession}>
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
