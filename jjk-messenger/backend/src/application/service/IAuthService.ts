/**
 * Interface pour le service d'authentification
 * Définit les contrats que les implémentations concrètes doivent respecter
 */
export interface IAuthService {
    hashPassword(password: string): Promise<string>;
    comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    generateToken(userId: string, username: string): string;
    verifyToken(token: string): { userId: string; username: string } | null;
  }
