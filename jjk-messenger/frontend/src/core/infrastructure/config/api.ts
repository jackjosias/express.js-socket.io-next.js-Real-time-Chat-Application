const DEFAULT_API_URL = "http://localhost:3002";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!configuredUrl || !configuredUrl.trim()) {
    return DEFAULT_API_URL;
  }

  return trimTrailingSlash(configuredUrl);
}

export function getRestApiBaseUrl(): string {
  return `${getApiBaseUrl()}/api`;
}

export function getAuthApiBaseUrl(): string {
  return `${getRestApiBaseUrl()}/auth`;
}
