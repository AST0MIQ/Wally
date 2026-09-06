import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Temporary scaffolding for routes whose features land in later phases.
 * Keeps navigation fully wired without shipping half-built screens.
 */
export function PagePlaceholder({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </header>

      <Card>
        <CardContent className="flex min-h-40 items-center justify-center p-8 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>

      {children}
    </section>
  );
}
