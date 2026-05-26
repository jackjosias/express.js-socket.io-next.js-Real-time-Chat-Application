import type { AuthRepository } from "@/core/domain/repositories/auth.repository";
import { validateLoginCredentials } from "@/core/domain/schemas/auth";
import type { AuthSession, LoginCredentials } from "@/core/domain/types/auth";

export const createLoginUseCase = (authRepository: AuthRepository) => ({
  execute: async (credentials: LoginCredentials): Promise<AuthSession> => {
    const validationResult = validateLoginCredentials(credentials);

    if (!validationResult.success) {
      throw new Error(validationResult.message);
    }

    return authRepository.login(validationResult.data);
  },
});
