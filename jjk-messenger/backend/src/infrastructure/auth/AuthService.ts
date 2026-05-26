import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_TTL_SECONDS } from "../security/authConstants";
import { type IAuthService } from "../../application/service/IAuthService";

export class AuthService implements IAuthService {
  private readonly JWT_SECRET: string;
  private readonly SALT_ROUNDS = 10;

  constructor(jwtSecret: string) {
    if (!jwtSecret) {
      throw new Error("JWT_SECRET est requis pour initialiser AuthService");
    }
    this.JWT_SECRET = jwtSecret;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  generateToken(userId: string, username: string): string {
    return jwt.sign(
      { userId, username },
      this.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
    );
  }

  verifyToken(token: string): { userId: string; username: string } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; username: string };
      return decoded;
    } catch (_error) {
      return null;
    }
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("base64url");
  }

  generateCsrfToken(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
