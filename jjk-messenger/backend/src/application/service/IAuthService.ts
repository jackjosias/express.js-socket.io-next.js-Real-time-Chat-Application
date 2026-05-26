export interface IAuthService {
  hashPassword(password: string): Promise<string>;
  comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  generateToken(userId: string, username: string): string;
  verifyToken(token: string): { userId: string; username: string } | null;
  generateRefreshToken(): string;
  generateCsrfToken(): string;
  hashToken(token: string): string;
}
