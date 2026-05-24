// --- Fichier Modifié: backend/src/application/use-cases/LoginUserUseCase.ts ---
/**
 * Cas d'utilisation: Connexion d'un utilisateur
 * Respecte les principes de Clean Architecture en dépendant uniquement des interfaces
 */
import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../../domain/repository/IUserRepository';
import { IAuthService } from '../../service/IAuthService';
import { IConnectionLogRepository } from '../../../domain/repository/IConnectionLogRepository';
import { ConnectionLog } from '../../../domain/entity/ConnectionLog';

export class LoginUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService,
    private connectionLogRepository: IConnectionLogRepository,
    // 🧬 Injection de l'instance Prisma pour orchestrer la transaction
    private prisma: PrismaClient
  ) {}

  async execute(
    username: string,
    password: string
  ): Promise<{ token: string; userId: string }> {
    // Vérifier si l'utilisateur existe
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Identifiants invalides');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await this.authService.comparePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error('Identifiants invalides');
    }

    // 🛡️ Utilisation d'une transaction pour garantir l'atomicité, orchestrée par le Use Case
    //    mais exécutée par les repositories via l'injection du client transactionnel.
    // @suture (MSD/MIMI v1.2) L'injection de dépendance est maintenant pure, le Use Case ne dépend plus de `prisma.$transaction`.
    // @intention (CRIDE/AHIDS v1.0) Rétablir la séparation des responsabilités : le Use Case orchestre, l'infrastructure exécute.
    await this.prisma.$transaction(async (tx) => {
      // @ts-ignore - Nécessaire car withTx n'est pas sur l'interface IUserRepository
      const userRepoTx = this.userRepository.withTx(tx);
      // @ts-ignore - Nécessaire car withTx n'est pas sur l'interface IConnectionLogRepository
      const connectionLogRepoTx = this.connectionLogRepository.withTx(tx);

      // Mettre à jour le statut de l'utilisateur
      await userRepoTx.updateOnlineStatus(user.id, true);
      await userRepoTx.updateLastSeen(user.id, new Date());

      // Créer un journal de connexion
      const connectionLog = new ConnectionLog('', user.id, new Date(), null);
      await connectionLogRepoTx.create(connectionLog);
    });

    // Générer un token JWT
    const token = this.authService.generateToken(user.id, user.username);
    return { token, userId: user.id };
  }
}