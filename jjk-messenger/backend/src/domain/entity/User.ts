// Définit le type pour la représentation publique de l'utilisateur (sans le mot de passe et les méthodes)
export type PublicUser = Omit<User, 'password' | 'updateStatus' | 'toPublic'>;

/**
 * Entité User - Représente un utilisateur dans le domaine
 * Indépendant de toute infrastructure ou framework
 */
export class User {
    constructor(
      public readonly id: string,
      public readonly username: string,
      public readonly password: string, // Stocké hashé
      public readonly createdAt: Date,
      public readonly updatedAt: Date,
      public lastSeenAt: Date,
      public isOnline: boolean
    ) {}

    updateStatus(isOnline: boolean): void {
      this.isOnline = isOnline;
      this.lastSeenAt = new Date();
    }

    // Méthode pour créer une représentation publique de l'utilisateur (sans mot de passe et méthodes)
    toPublic(): PublicUser {
      return {
        id: this.id,
        username: this.username,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        lastSeenAt: this.lastSeenAt,
        isOnline: this.isOnline,
      };
    }
  }
