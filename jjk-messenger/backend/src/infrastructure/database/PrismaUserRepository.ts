// --- Fichier Modifié: backend/src/infrastructure/database/PrismaUserRepository.ts ---
/**
 * Implémentation du repository User avec Prisma
 * Respecte l'interface IUserRepository définie dans la couche application
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { User } from '../../domain/entity/User';
import { IUserRepository } from '../../domain/repository/IUserRepository';

// 🧬 Type pour le client Prisma transactionnel
type PrismaTransactionalClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class PrismaUserRepository implements IUserRepository {
  private client: PrismaClient | PrismaTransactionalClient;

  constructor(prisma: PrismaClient | PrismaTransactionalClient) {
    this.client = prisma;
  }

  // 🧬 Permet d'utiliser le repository dans une transaction
  withTx(tx: Prisma.TransactionClient): PrismaUserRepository {
    return new PrismaUserRepository(tx);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.client.user.findUnique({ where: { id } });
    if (!user) {
      return null;
    }
    return new User(
      user.id,
      user.username,
      user.password,
      user.createdAt,
      user.updatedAt,
      user.lastSeenAt,
      user.isOnline
    );
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.client.user.findUnique({ where: { username } });
    if (!user) {
      return null;
    }
    return new User(
      user.id,
      user.username,
      user.password,
      user.createdAt,
      user.updatedAt,
      user.lastSeenAt,
      user.isOnline
    );
  }

  async findAll(): Promise<User[]> {
    const users = await this.client.user.findMany();
    return users.map(user => new User(
      user.id,
      user.username,
      user.password,
      user.createdAt,
      user.updatedAt,
      user.lastSeenAt,
      user.isOnline
    ));
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    const users = await this.client.user.findMany({ where: { id: { in: ids } } });
    return users.map(user => new User(
      user.id,
      user.username,
      user.password,
      user.createdAt,
      user.updatedAt,
      user.lastSeenAt,
      user.isOnline
    ));
  }

  async create(user: User): Promise<User> {
    const createdUser = await this.client.user.create({
      data: {
        username: user.username,
        password: user.password,
        lastSeenAt: user.lastSeenAt,
        isOnline: user.isOnline
      }
    });
    return new User(
      createdUser.id,
      createdUser.username,
      createdUser.password,
      createdUser.createdAt,
      createdUser.updatedAt,
      createdUser.lastSeenAt,
      createdUser.isOnline
    );
  }

  async update(user: User): Promise<User> {
    const updatedUser = await this.client.user.update({
      where: { id: user.id },
      data: {
        username: user.username,
        password: user.password,
        lastSeenAt: user.lastSeenAt,
        isOnline: user.isOnline
      }
    });
    return new User(
      updatedUser.id,
      updatedUser.username,
      updatedUser.password,
      updatedUser.createdAt,
      updatedUser.updatedAt,
      updatedUser.lastSeenAt,
      updatedUser.isOnline
    );
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<User> {
    const updatedUser = await this.client.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeenAt: new Date()
      }
    });
    return new User(
      updatedUser.id,
      updatedUser.username,
      updatedUser.password,
      updatedUser.createdAt,
      updatedUser.updatedAt,
      updatedUser.lastSeenAt,
      updatedUser.isOnline
    );
  }

  async updateLastSeen(userId: string, lastSeenAt: Date): Promise<User> {
    const updatedUser = await this.client.user.update({
      where: { id: userId },
      data: { lastSeenAt }
    });
    return new User(
      updatedUser.id,
      updatedUser.username,
      updatedUser.password,
      updatedUser.createdAt,
      updatedUser.updatedAt,
      updatedUser.lastSeenAt,
      updatedUser.isOnline
    );
  }
}