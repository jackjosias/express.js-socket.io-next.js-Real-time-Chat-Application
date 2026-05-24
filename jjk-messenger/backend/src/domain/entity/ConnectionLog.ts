/**
 * Entité ConnectionLog - Représente un journal de connexion dans le domaine
 * Indépendant de toute infrastructure ou framework
 */
export class ConnectionLog {
    constructor(
      public readonly id: string,
      public readonly userId: string,
      public readonly connectedAt: Date,
      public disconnectedAt: Date | null
    ) {}

    disconnect(): void {
      this.disconnectedAt = new Date();
    }

    isActive(): boolean {
      return this.disconnectedAt === null;
    }

    getDuration(): number | null {
      if (!this.disconnectedAt) {
        return null;
      }
      return this.disconnectedAt.getTime() - this.connectedAt.getTime();
    }
  }
