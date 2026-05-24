/**
 * Cas d'utilisation: Récupération des messages entre deux utilisateurs
 * Respecte les principes de Clean Architecture en dépendant uniquement des interfaces
 */

import { Message } from "../../../domain/entity/Message";
import { IMessageRepository } from "../../../domain/repository/IMessageRepository";
import { IUserRepository } from "../../../domain/repository/IUserRepository";


export class GetMessageHistoryUseCase {
  constructor(
    private messageRepository: IMessageRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(userId1: string, userId2: string): Promise<Message[]> {
    // Vérifier si les deux utilisateurs existent
    const user1 = await this.userRepository.findById(userId1);
    if (!user1) {
      throw new Error('Premier utilisateur non trouvé');
    }

    const user2 = await this.userRepository.findById(userId2);
    if (!user2) {
      throw new Error('Second utilisateur non trouvé');
    }

    // Récupérer tous les messages entre les deux utilisateurs
    return this.messageRepository.findBetweenUsers(userId1, userId2);
  }
}
