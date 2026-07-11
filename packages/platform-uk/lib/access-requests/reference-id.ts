export function formatAccessRequestReferenceId(id: string): string {
  const compact = id.replace(/-/g, "").toUpperCase();
  return `AKSH-${compact.slice(0, 4)}`;
}
