/**
 * Neon/Vercel: node-postgres treats `sslmode=require` as strict certificate
 * verification, which fails on Vercel's runtime. `uselibpqcompat=true` restores
 * libpq semantics (encrypted, as intended). Applied here so the env var can stay
 * exactly as the Neon integration sets it.
 */
export function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw || !/sslmode=require/.test(raw) || /uselibpqcompat=/.test(raw)) return raw;
  return `${raw}${raw.includes("?") ? "&" : "?"}uselibpqcompat=true`;
}
