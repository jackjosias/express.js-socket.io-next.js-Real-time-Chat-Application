"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createRegisterUseCase } from "@/core/application/useCases/auth";
import { validatePasswordConfirmation } from "@/core/domain/schemas/auth";
import type { RegisterCredentials } from "@/core/domain/types/auth";
import { useAuthApiRepository } from "@/core/infrastructure/repositories/auth/auth-api.repository";
import { getApiErrorMessage } from "@/shared/errors/apiError";

type RegisterFormState = RegisterCredentials & {
  confirmPassword: string;
};

const REGISTER_REDIRECT_DELAY_MS = 3000;

export function useRegisterForm() {
  const [formState, setFormState] = useState<RegisterFormState>({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectTimerRef = useRef<number | null>(null);
  const authRepository = useAuthApiRepository();
  const registerUseCase = useMemo(
    () => createRegisterUseCase(authRepository),
    [authRepository]
  );
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const updateField = (field: keyof RegisterFormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const confirmation = validatePasswordConfirmation(
      formState.password,
      formState.confirmPassword
    );

    if (!confirmation.success) {
      setError(confirmation.message);
      return;
    }

    try {
      await registerUseCase.execute({
        username: formState.username,
        password: formState.password,
      });
      toast.success("Inscription reussie !");
      redirectTimerRef.current = window.setTimeout(() => {
        router.push("/login?registered=true");
      }, REGISTER_REDIRECT_DELAY_MS);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : getApiErrorMessage(caughtError, "Une erreur est survenue lors de l'inscription");
      setError(message);
      toast.error(message);
    }
  };

  return {
    error,
    formState,
    handleSubmit,
    isLoading: authRepository.isRegisterLoading,
    showConfirmPassword,
    showPassword,
    toggleShowConfirmPassword: () => setShowConfirmPassword((current) => !current),
    toggleShowPassword: () => setShowPassword((current) => !current),
    updateField,
  };
}
