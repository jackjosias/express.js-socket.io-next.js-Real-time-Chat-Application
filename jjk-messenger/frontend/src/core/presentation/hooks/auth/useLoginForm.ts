"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createLoginUseCase } from "@/core/application/useCases/auth";
import type { LoginCredentials } from "@/core/domain/types/auth";
import { clearLegacyAuthStorage } from "@/core/infrastructure/browser/authStorage";
import { useAuthApiRepository } from "@/core/infrastructure/repositories/auth/auth-api.repository";
import { useAppDispatch } from "@/core/infrastructure/store";
import { loginSuccess } from "@/core/infrastructure/store/slices/authSlice";
import { setCurrentUserId } from "@/core/infrastructure/store/slices/chatSlice";
import { getApiErrorMessage } from "@/shared/errors/apiError";

const LOGIN_REDIRECT_DELAY_MS = 3000;

export function useLoginForm() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectTimerRef = useRef<number | null>(null);
  const authRepository = useAuthApiRepository();
  const loginUseCase = useMemo(
    () => createLoginUseCase(authRepository),
    [authRepository]
  );
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const updateField = (field: keyof LoginCredentials, value: string) => {
    setCredentials((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const session = await loginUseCase.execute(credentials);
      clearLegacyAuthStorage();
      dispatch(loginSuccess(session));
      dispatch(setCurrentUserId(session.userId));
      toast.success("Connexion reussie ! Bienvenue !");
      redirectTimerRef.current = window.setTimeout(() => {
        router.push("/dashboard");
      }, LOGIN_REDIRECT_DELAY_MS);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : getApiErrorMessage(caughtError, "Une erreur est survenue lors de la connexion");
      setError(message);
      toast.error(message);
    }
  };

  return {
    credentials,
    error,
    handleSubmit,
    isLoading: authRepository.isLoginLoading,
    showPassword,
    toggleShowPassword: () => setShowPassword((current) => !current),
    updateField,
  };
}
