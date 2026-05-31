"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

// next-themes injects a <script> tag for FOUC prevention; React 19 warns about
// script tags inside components even though it's harmless here (runs during SSR).
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const _error = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) return;
    _error(...args);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
