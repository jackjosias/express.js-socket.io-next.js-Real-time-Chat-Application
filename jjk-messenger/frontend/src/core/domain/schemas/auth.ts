import type { LoginCredentials, RegisterCredentials } from "../types/auth";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

const MIN_PASSWORD_LENGTH = 6;

function normalizeUsername(username: string): string {
  return username.trim();
}

function validateUsername(username: string): string | null {
  if (!normalizeUsername(username)) {
    return "Le nom d'utilisateur est obligatoire.";
  }

  return null;
}

function validatePassword(password: string): string | null {
  if (!password) {
    return "Le mot de passe est obligatoire.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  return null;
}

export function validateLoginCredentials(
  credentials: LoginCredentials
): ValidationResult<LoginCredentials> {
  const username = normalizeUsername(credentials.username);
  const usernameError = validateUsername(username);

  if (usernameError) {
    return { success: false, message: usernameError };
  }

  const passwordError = validatePassword(credentials.password);

  if (passwordError) {
    return { success: false, message: passwordError };
  }

  return { success: true, data: { username, password: credentials.password } };
}

export function validateRegisterCredentials(
  credentials: RegisterCredentials
): ValidationResult<RegisterCredentials> {
  return validateLoginCredentials(credentials);
}

export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): ValidationResult<null> {
  if (password !== confirmPassword) {
    return { success: false, message: "Les mots de passe ne correspondent pas." };
  }

  return { success: true, data: null };
}
