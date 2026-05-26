export const ACCESS_TOKEN_COOKIE_NAME = "jjk_access";
export const REFRESH_TOKEN_COOKIE_NAME = "jjk_refresh";
export const CSRF_COOKIE_NAME = "jjk_csrf";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const ACCESS_TOKEN_TTL_MS = ACCESS_TOKEN_TTL_SECONDS * 1000;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const CSRF_HEADER_NAME = "x-csrf-token";
