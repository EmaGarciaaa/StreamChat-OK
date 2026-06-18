/**
 * Utility to safely retrieve the backend API and WebSocket URL.
 * It checks both import.meta.env (Vite) and process.env (traditional) safely,
 * and falls back to window.location.origin to prevent any application crashes.
 */

export function getBackendUrl(): string {
  // 1. Safe access to process.env (without throwing ReferenceError)
  try {
    if (typeof process !== "undefined" && process && process.env) {
      const envVal = (process.env as any).NEXT_PUBLIC_WS_URL || (process.env as any).VITE_WS_URL;
      if (envVal) {
        return envVal.replace(/\/$/, "");
      }
    }
  } catch (e) {
    // Ignore error
  }

  // 2. Safe access to import.meta.env
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      const envVal = metaEnv.NEXT_PUBLIC_WS_URL || metaEnv.VITE_WS_URL;
      if (envVal) {
        return envVal.replace(/\/$/, "");
      }
    }
  } catch (e) {
    // Ignore error
  }

  // 3. Secure fallback to current hostname/origin
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin.replace(/\/$/, "");
  }

  return "";
}
