// --- Fichier Final Corrigé: backend/src/presentation/api/controllers/UserController.ts ---
/**
 * Contrôleur des utilisateurs
 * Gère les routes liées aux utilisateurs
 */
import { Request, Response } from 'express';
import { GetUserListUseCase } from '../../../application/use-cases/User/GetUserListUseCase';

export class UserController {
    constructor(private getUserListUseCase: GetUserListUseCase) {}

    getUsers = async (req: Request, res: Response): Promise<void> => {
        if (!req.user) {
            res.status(401).json({ message: 'Utilisateur non authentifié' });
            return;
        }
        const users = await this.getUserListUseCase.execute(req.user.userId);
        res.status(200).json({ users });
    };
}