import {
  BaseQueryApi,
  FetchArgs,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { readCsrfToken } from "@/core/infrastructure/browser/csrf";
import { getAuthApiBaseUrl } from "@/core/infrastructure/config/api";
import { logout } from "@/core/infrastructure/store/slices/authSlice";

const CSRF_HEADER_NAME = "x-csrf-token";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getRequestMethod(args: string | FetchArgs): string {
  if (typeof args === "string") {
    return "GET";
  }

  return (args.method || "GET").toUpperCase();
}

function getRequestUrl(args: string | FetchArgs): string {
  return typeof args === "string" ? args : args.url;
}

function shouldAddCsrfHeader(args: string | FetchArgs): boolean {
  return UNSAFE_METHODS.has(getRequestMethod(args));
}

function shouldAttemptRefresh(args: string | FetchArgs): boolean {
  const url = getRequestUrl(args);
  return !url.endsWith("/login")
    && !url.endsWith("/register")
    && !url.endsWith("/refresh")
    && !url.endsWith("/logout");
}

export function createCredentialedBaseQuery(baseUrl: string) {
  return fetchBaseQuery({
    baseUrl,
    credentials: "include",
    prepareHeaders: (headers, api) => {
      if (shouldAddCsrfHeader(api.arg as string | FetchArgs)) {
        const csrfToken = readCsrfToken();
        if (csrfToken) {
          headers.set(CSRF_HEADER_NAME, csrfToken);
        }
      }

      return headers;
    },
  });
}

const authRefreshBaseQuery = createCredentialedBaseQuery(getAuthApiBaseUrl());

export function createBaseQueryWithReauth(baseUrl: string) {
  const baseQuery = createCredentialedBaseQuery(baseUrl);

  return async (args: string | FetchArgs, api: BaseQueryApi, extraOptions: object) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error?.status === 401 && shouldAttemptRefresh(args)) {
      const refreshResult = await authRefreshBaseQuery(
        { url: "/refresh", method: "POST" },
        api,
        extraOptions
      );

      if (!refreshResult.error) {
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    }

    return result;
  };
}
