type Level = "info" | "warn" | "error";

function log(
  level: Level,
  action: string,
  data?: Record<string, unknown>,
): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    action,
    ...data,
  };
  // In production replace this with your preferred log sink (Datadog, Logtail, etc.)
  console[level](JSON.stringify(entry));
}

export const logger = {
  info: (action: string, data?: Record<string, unknown>) =>
    log("info", action, data),
  warn: (action: string, data?: Record<string, unknown>) =>
    log("warn", action, data),
  error: (action: string, data?: Record<string, unknown>) =>
    log("error", action, data),
};
