import { createFileRoute, redirect } from "@tanstack/react-router";
import { PortalShell } from "@/components/PortalShell";

export const Route = createFileRoute("/portal")({
  component: PortalShell,
  head: () => ({ meta: [{ title: "Patient Portal — HealthOS" }] }),
});

// no-op to satisfy isolated module guard
export { redirect as _r };