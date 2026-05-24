/**
 * Contrôleur d'authentification
 * Gère les routes d'inscription et de connexion
 */
import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../../application/use-cases/User/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/use-cases/User/LoginUserUseCase';

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    const user = await this.registerUserUseCase.execute(username, password);
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: { id: user.id, username: user.username, createdAt: user.createdAt }
    });
    return; // Assure que la promesse se résout en void
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    const result = await this.loginUserUseCase.execute(username, password);
    res.status(200).json({ message: 'Connexion réussie', token: result.token, userId: result.userId });
    return; // Assure que la promesse se résout en void
  };
}