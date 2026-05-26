const LEGACY_AUTH_STORAGE_KEYS = ["token", "userId", "username"] as const;

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function clearLegacyAuthStorage(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  for (const key of LEGACY_AUTH_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}
