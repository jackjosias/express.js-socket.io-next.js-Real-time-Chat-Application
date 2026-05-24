'use client';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store'; // Garder l'import de RootState pour le typage prepareHeaders

interface AuthResponse {
  token: string;
  userId: string;
  username: string;
}

interface LoginRequest {
  username?: string;
  password?: string;
}

type RegisterRequest = LoginRequest;

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth` : 'http://localhost:3002/api/auth',
    prepareHeaders: (headers, { getState }) => {
      // Récupérer le token depuis le state. Assurez-vous que le store est déjà initialisé.
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: '/register',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

// Exporter les hooks générés directement d'ici
export const { useLoginMutation, useRegisterMutation } = authApi;
