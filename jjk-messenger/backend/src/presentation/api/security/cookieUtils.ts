import { type Request } from "express";

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
}

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, cookiePart) => {
    const separatorIndex = cookiePart.indexOf("=");
    if (separatorIndex === -1) {
      return cookies;
    }

    const key = cookiePart.slice(0, separatorIndex).trim();
    const value = cookiePart.slice(separatorIndex + 1).trim();
    if (key) {
      cookies[key] = decodeCookieValue(value);
    }

    return cookies;
  }, {});
}

export function getCookie(req: Request, name: string): string | null {
  return parseCookieHeader(req.headers.cookie)[name] ?? null;
}
