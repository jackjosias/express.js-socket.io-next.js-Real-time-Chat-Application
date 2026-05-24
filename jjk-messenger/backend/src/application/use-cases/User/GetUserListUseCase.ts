/**
 * Cas d'utilisation: Récupération de la liste des utilisateurs
 * Respecte les principes de Clean Architecture en dépendant uniquement des interfaces
 */

import { PublicUser } from "../../../domain/entity/User";
import { IUserRepository } from "../../../domain/repository/IUserRepository";

export class GetUserListUseCase {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(currentUserId: string): Promise<PublicUser[]> {
    // Récupérer tous les utilisateurs
    const users = await this.userRepository.findAll();

    // Filtrer l'utilisateur courant et transformer en version publique (sans mot de passe)
    return users
      .filter(user => user.id !== currentUserId)
      .map(user => user.toPublic());
  }
}
