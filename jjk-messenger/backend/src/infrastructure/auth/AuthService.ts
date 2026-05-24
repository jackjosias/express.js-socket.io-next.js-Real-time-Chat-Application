/**
 * Implémentation concrète du service d'authentification
 * Utilise bcrypt pour le hachage des mots de passe et jsonwebtoken pour les JWT
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IAuthService } from '../../application/service/IAuthService';

export class AuthService implements IAuthService {
  private readonly JWT_SECRET: string;
  private readonly SALT_ROUNDS: number = 10;

  constructor(jwtSecret: string) {
    if (!jwtSecret) {
      throw new Error('JWT_SECRET est requis pour initialiser AuthService');
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
      { expiresIn: '24h' }
    );
  }

  verifyToken(token: string): { userId: string; username: string } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; username: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
