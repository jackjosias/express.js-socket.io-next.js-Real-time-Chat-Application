"use client";

import { useMemo } from "react";
import type { AuthRepository } from "@/core/domain/repositories/auth.repository";
import type { LoginCredentials } from "@/core/domain/types/auth";
import {
  useLoginMutation,
  useRegisterMutation,
} from "@/core/infrastructure/store/api/authApi";

export function useAuthApiRepository() {
  const [loginMutation, loginState] = useLoginMutation();
  const [registerMutation, registerState] = useRegisterMutation();

  return useMemo(
    () => ({
      isLoginLoading: loginState.isLoading,
      isRegisterLoading: registerState.isLoading,
      login: async (credentials: LoginCredentials) => {
        const response = await loginMutation(credentials).unwrap();
        return {
          userId: response.userId,
          username: response.username,
        };
      },
      register: async (credentials: LoginCredentials) => {
        return registerMutation(credentials).unwrap();
      },
    }),
    [
      loginMutation,
      loginState.isLoading,
      registerMutation,
      registerState.isLoading,
    ]
  ) satisfies AuthRepository & {
    isLoginLoading: boolean;
    isRegisterLoading: boolean;
  };
}
