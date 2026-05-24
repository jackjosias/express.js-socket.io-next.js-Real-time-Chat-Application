/**
 * Cas d'utilisation: Envoi d'un message
 * Respecte les principes de Clean Architecture en dépendant uniquement des interfaces
 */
import { Message } from '../../../domain/entity/Message';
import { IMessageRepository } from '../../../domain/repository/IMessageRepository';
import { IUserRepository } from '../../../domain/repository/IUserRepository';

export class SendMessageUseCase {
  constructor(
    private messageRepository: IMessageRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(content: string, senderId: string, receiverId: string): Promise<Message> {
    // Vérifier si l'expéditeur existe
    const sender = await this.userRepository.findById(senderId);
    if (!sender) {
      throw new Error('Expéditeur non trouvé');
    }

    // Vérifier si le destinataire existe
    const receiver = await this.userRepository.findById(receiverId);
    if (!receiver) {
      throw new Error('Destinataire non trouvé');
    }

    // Créer un nouveau message
    const message = new Message(
      '', // ID sera généré par l'infrastructure
      content,
      senderId,
      receiverId,
      new Date(),
      null
    );

    // 🧬 Persiste et retourne le message. La responsabilité de l'envoi est déléguée.
    return this.messageRepository.create(message);
  }
}
