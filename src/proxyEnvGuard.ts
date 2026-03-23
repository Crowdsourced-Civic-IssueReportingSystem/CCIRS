const PROXY_KEYS = [
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
  "GIT_HTTP_PROXY",
  "GIT_HTTPS_PROXY",
] as const;

const INVALID_LOCAL_PROXIES = new Set([
  "http://127.0.0.1:9",
  "https://127.0.0.1:9",
  "http://localhost:9",
  "https://localhost:9",
]);

function normalize(value: string): string {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

/**
 * Prevent known-bad local proxy values from breaking outbound Firebase calls.
 */
export function sanitizeProxyEnv(): void {
  if (process.env.DISABLE_PROXY_ENV_GUARD === "1") {
    return;
  }

  const cleared: string[] = [];

  for (const key of PROXY_KEYS) {
    const current = process.env[key];
    if (!current) continue;

    if (INVALID_LOCAL_PROXIES.has(normalize(current))) {
      delete process.env[key];
      cleared.push(key);
    }
  }

  if (cleared.length > 0) {
    console.warn(
      `[proxy-env-guard] Cleared invalid proxy variables: ${cleared.join(", ")}`,
    );
  }
}
