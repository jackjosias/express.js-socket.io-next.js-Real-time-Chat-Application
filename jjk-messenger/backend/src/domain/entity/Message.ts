/**
 * Entité Message - Représente un message dans le domaine
 * Indépendant de toute infrastructure ou framework
 */
export class Message {
    constructor(
      public readonly id: string,
      public readonly content: string,
      public readonly senderId: string,
      public readonly receiverId: string,
      public readonly createdAt: Date,
      public readAt: Date | null
    ) {}

    markAsRead(): void {
      this.readAt = new Date();
    }

    isRead(): boolean {
      return this.readAt !== null;
    }
  }
