/** Product isolation and verified TLS for remote care databases. */
export function akshDatabaseConnectionOptions(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Invalid Aksh PostgreSQL connection URL"); }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Aksh requires PostgreSQL");
  if (!/^(?:[a-z0-9.-]+|\[::1\])$/i.test(url.hostname)) throw new Error("Invalid database hostname");
  if (/ep-restless-dew|ep-blue-salad/i.test(url.hostname)) throw new Error("HSI/ISI databases must not be used for Aksh care records");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const mode = url.searchParams.get("sslmode");
  if (!local && mode && !["require", "verify-ca", "verify-full"].includes(mode)) throw new Error("Remote Aksh databases require verified TLS");
  const tls = !local || (mode !== null && mode !== "disable");
  // URL sslmode can override pg's explicit TLS object; configure it in one place.
  url.searchParams.delete("sslmode");
  return { connectionString: url.toString(), ...(tls ? { ssl: { rejectUnauthorized: true } } : {}) };
}
