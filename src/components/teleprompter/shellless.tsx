import type { ReactNode } from "react";

/** Container mínimo usado em telas sem navegação (modo apresentação). */
export function AppShellless({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
