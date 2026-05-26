"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  AuthLoginResponse,
  AuthSessionResponse,
  LoginCredentials,
  RegisterCredentials,
  RegisterResponse,
} from "@/core/domain/types/auth";
import { getAuthApiBaseUrl } from "@/core/infrastructure/config/api";
import { createBaseQueryWithReauth } from "@/core/infrastructure/store/api/baseQuery";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: createBaseQueryWithReauth(getAuthApiBaseUrl()),
  endpoints: (builder) => ({
    login: builder.mutation<AuthLoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation<RegisterResponse, RegisterCredentials>({
      query: (credentials) => ({
        url: "/register",
        method: "POST",
        body: credentials,
      }),
    }),
    getSession: builder.query<AuthSessionResponse, void>({
      query: () => "/session",
    }),
    refreshSession: builder.mutation<AuthSessionResponse, void>({
      query: () => ({
        url: "/refresh",
        method: "POST",
      }),
    }),
    logoutSession: builder.mutation<void, void>({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetSessionQuery,
  useLoginMutation,
  useLogoutSessionMutation,
  useRefreshSessionMutation,
  useRegisterMutation,
} = authApi;
