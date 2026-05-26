import type { AuthRepository } from "@/core/domain/repositories/auth.repository";
import { validateRegisterCredentials } from "@/core/domain/schemas/auth";
import type {
  RegisterCredentials,
  RegisterResponse,
} from "@/core/domain/types/auth";

export const createRegisterUseCase = (authRepository: AuthRepository) => ({
  execute: async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
    const validationResult = validateRegisterCredentials(credentials);

    if (!validationResult.success) {
      throw new Error(validationResult.message);
    }

    return authRepository.register(validationResult.data);
  },
});
