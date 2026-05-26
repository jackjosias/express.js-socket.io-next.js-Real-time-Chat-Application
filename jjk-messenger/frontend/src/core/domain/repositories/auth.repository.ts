import type {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  RegisterResponse,
} from "../types/auth";

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(credentials: RegisterCredentials): Promise<RegisterResponse>;
}
