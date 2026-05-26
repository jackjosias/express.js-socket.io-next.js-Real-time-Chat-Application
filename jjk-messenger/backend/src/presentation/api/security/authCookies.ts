import { type Response } from "express";
import config from "../../../config/config";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_TTL_MS,
  CSRF_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
} from "../../../infrastructure/security/authConstants";

type AuthCookiePayload = {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
};

const baseCookieOptions = {
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
} as const;

export function setAuthCookies(res: Response, payload: AuthCookiePayload): void {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, payload.accessToken, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: ACCESS_TOKEN_TTL_MS,
    path: "/",
  });

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, payload.refreshToken, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: "/api/auth",
  });

  res.cookie(CSRF_COOKIE_NAME, payload.csrfToken, {
    ...baseCookieOptions,
    httpOnly: false,
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: "/",
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
    ...baseCookieOptions,
    httpOnly: true,
    path: "/",
  });

  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    ...baseCookieOptions,
    httpOnly: true,
    path: "/api/auth",
  });

  res.clearCookie(CSRF_COOKIE_NAME, {
    ...baseCookieOptions,
    httpOnly: false,
    path: "/",
  });
}
