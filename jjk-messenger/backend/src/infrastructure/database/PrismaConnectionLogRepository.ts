// --- Fichier Modifié: backend/src/infrastructure/database/PrismaConnectionLogRepository.ts ---
/**
 * Implémentation du repository ConnectionLog avec Prisma
 * Respecte l'interface IConnectionLogRepository définie dans la couche application
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { ConnectionLog } from '../../domain/entity/ConnectionLog';
import { IConnectionLogRepository } from '../../domain/repository/IConnectionLogRepository';

// 🧬 Type pour le client Prisma transactionnel
type PrismaTransactionalClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class PrismaConnectionLogRepository implements IConnectionLogRepository {
  private client: PrismaClient | PrismaTransactionalClient;

  constructor(prisma: PrismaClient | PrismaTransactionalClient) {
    this.client = prisma;
  }

  // 🧬 Permet d'utiliser le repository dans une transaction
  withTx(tx: Prisma.TransactionClient): PrismaConnectionLogRepository {
    return new PrismaConnectionLogRepository(tx);
  }

  async findById(id: string): Promise<ConnectionLog | null> {
    const connectionLog = await this.client.connectionLog.findUnique({ where: { id } });
    if (!connectionLog) {
      return null;
    }
    return new ConnectionLog(
      connectionLog.id,
      connectionLog.userId,
      connectionLog.connectedAt,
      connectionLog.disconnectedAt
    );
  }

  async findByUserId(userId: string): Promise<ConnectionLog[]> {
    const connectionLogs = await this.client.connectionLog.findMany({
      where: { userId },
      orderBy: { connectedAt: 'desc' }
    });
    return connectionLogs.map(log => new ConnectionLog( log.id, log.userId, log.connectedAt, log.disconnectedAt ));
  }

  async findActiveByUserId(userId: string): Promise<ConnectionLog | null> {
    const connectionLog = await this.client.connectionLog.findFirst({
      where: { userId, disconnectedAt: null },
      orderBy: { connectedAt: 'desc' }
    });
    if (!connectionLog) {
      return null;
    }
    return new ConnectionLog(
      connectionLog.id,
      connectionLog.userId,
      connectionLog.connectedAt,
      connectionLog.disconnectedAt
    );
  }

  async create(connectionLog: ConnectionLog): Promise<ConnectionLog> {
    const createdLog = await this.client.connectionLog.create({
      data: {
        userId: connectionLog.userId,
        connectedAt: connectionLog.connectedAt,
        disconnectedAt: connectionLog.disconnectedAt
      }
    });
    return new ConnectionLog(
      createdLog.id,
      createdLog.userId,
      createdLog.connectedAt,
      createdLog.disconnectedAt
    );
  }

  async update(connectionLog: ConnectionLog): Promise<ConnectionLog> {
    const updatedLog = await this.client.connectionLog.update({
      where: { id: connectionLog.id },
      data: {
        disconnectedAt: connectionLog.disconnectedAt
      }
    });
    return new ConnectionLog(
      updatedLog.id,
      updatedLog.userId,
      updatedLog.connectedAt,
      updatedLog.disconnectedAt
    );
  }

  async closeActiveConnection(userId: string): Promise<ConnectionLog | null> {
    // Trouver la connexion active
    const activeConnection = await this.findActiveByUserId(userId);
    if (!activeConnection) {
      return null;
    }

    // Marquer comme déconnecté
    activeConnection.disconnect();

    // Mettre à jour dans la base de données
    return this.update(activeConnection);
  }
}