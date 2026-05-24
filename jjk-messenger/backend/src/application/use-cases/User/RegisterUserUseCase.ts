/**
 * Cas d'utilisation: Inscription d'un utilisateur
 * Respecte les principes de Clean Architecture en dépendant uniquement des interfaces
 */
import { User } from '../../../domain/entity/User';
import { IUserRepository } from '../../../domain/repository/IUserRepository';
import { IAuthService } from '../../service/IAuthService';

export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService
  ) {}

  async execute(username: string, password: string): Promise<User> {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findByUsername(username);
    if (existingUser) {
      throw new Error('Nom d\'utilisateur déjà pris');
    }

    // Hasher le mot de passe
    const hashedPassword = await this.authService.hashPassword(password);

    // Créer un nouvel utilisateur
    const now = new Date();
    const user = new User(
      '', // ID sera généré par l'infrastructure
      username,
      hashedPassword,
      now,
      now,
      now,
      false
    );

    // Persister l'utilisateur
    return this.userRepository.create(user);
  }
}
