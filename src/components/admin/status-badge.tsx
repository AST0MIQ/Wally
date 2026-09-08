import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { variant: "neutral" | "positive" | "negative" | "accent" }> = {
  DRAFT: { variant: "neutral" },
  PUBLISHED: { variant: "positive" },
  HIDDEN: { variant: "accent" },
  ARCHIVED: { variant: "negative" },
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={MAP[status]?.variant ?? "neutral"}>{status}</Badge>;
}
