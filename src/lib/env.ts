// ─── Server-side environment validation ────────────────────────────────────────
//
// Import this module (or import lib/prisma.ts, which imports it) in any
// server-side entrypoint. It throws at module-load time if required variables
// are missing, surfacing misconfigurations immediately rather than at runtime.
//
// Do NOT import from client components — process.env secrets are not available
// in the browser bundle.

const REQUIRED = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

type RequiredEnvKey = (typeof REQUIRED)[number];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `[env] Missing required environment variables:\n${missing.map((k) => `  • ${k}`).join("\n")}\n\nCopy .env.example to .env and fill in the values.`,
  );
}

// Type-safe accessor — guaranteed non-empty after the check above.
export function env(key: RequiredEnvKey): string {
  return process.env[key] as string;
}
