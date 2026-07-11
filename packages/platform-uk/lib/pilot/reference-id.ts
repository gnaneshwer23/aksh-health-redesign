export function formatPilotReferenceId(id: string): string {
  const compact = id.replace(/-/g, "").toUpperCase();
  return `PILOT-${compact.slice(0, 4)}`;
}
